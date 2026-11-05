/**
 * Host half of the OpenCode Go bundle.
 *
 * Serves three same-origin reads to the Client half, each behind the Host's
 * trust fence and each cached so a browser left open cannot hammer upstream:
 *
 *   GET /opencode-go-quota/usage    Go plan meters (5-hour / weekly / monthly)
 *   GET /opencode-go-quota/models   the Go model catalog plus two diffs
 *   GET /opencode-go-quota/version  running DSH version vs published releases
 *
 * Upstream shapes this half normalizes:
 *
 *   /usage    { usage: { rolling, weekly, monthly } }   (live)
 *             { plan, windows: [{ name, usagePercent, resetInSec }] }
 *   /models   { object: 'list', data: [{ id, created, owned_by }] }
 *
 * Every upstream call needs the Go API key except the version read, which uses
 * the npm registry and the public GitHub release feed. The key is resolved per
 * call through `ctx.credentials` (never cached) and is never serialized into a
 * response.
 *
 * The model catalog carries no usable recency signal — `created` is identical
 * across every entry — so "what changed" is answered by two explicit baselines
 * instead: the published documentation (frozen below) and the reader's own
 * previous snapshot (kept in the browser).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Default Go inference base URL; endpoint paths are appended. */
const DEFAULT_BASE_URL = 'https://opencode.ai/zen/go/v1';
/** Default environment-variable name the profile stores the Go key under. */
const DEFAULT_API_KEY_ENV = 'OPENCODE_GO_API_KEY';
/** Same-origin routes the Client half reads. */
const ROUTE_PREFIX = '/opencode-go-quota';
const USAGE_PATH = `${ROUTE_PREFIX}/usage`;
const MODELS_PATH = `${ROUTE_PREFIX}/models`;
const VERSION_PATH = `${ROUTE_PREFIX}/version`;
const SYNC_PATH = `${ROUTE_PREFIX}/models/sync`;
/** Third-party provider catalogs (Agnes / SenseNova), one row per configured provider. */
const PROVIDERS_PATH = `${ROUTE_PREFIX}/providers`;
/** Attribution header, so upstream can tell this client from a bare SDK. */
const USER_AGENT = 'dsh-opencode-go-quota/1.8.0';

/** The three metered windows, in the order the popover lists them. */
const WINDOW_IDS = ['rolling', 'weekly', 'monthly'];
/** Substrings identifying a `windows[]` entry from the alternate response shape. */
const WINDOW_MATCHERS = {
  rolling: ['rolling', '5-hour', '5 hour', '5h', 'session'],
  weekly: ['weekly', 'week'],
  monthly: ['monthly', 'month'],
};

/**
 * Model ids the official Go documentation listed when this baseline was taken.
 * The `/models` endpoint is the authority on what exists; this list is the
 * "what the docs admit to" side of the diff, so it is deliberately frozen and
 * dated rather than refreshed silently.
 */
const DOCS_BASELINE_DATE = '2026-10-15';
const DOCS_BASELINE_MODELS = [
  'cat-jam-free',
  'claude-haiku-5-5',
  'deepseek-v4-pro',
  'deepseek-v4.1-flash',
  'gemini-4-argon-contributor',
  'glm-5.2',
  'glm-5.3',
  'glm-5.3-flash',
  'gpt-5.6-luna',
  'gpt-6-luna',
  'grok-4.6',
  'grok-4.7',
  'hy3',
  'hy4-preview',
  'kimi-k2.6',
  'kimi-k2.7-code',
  'kimi-k3',
  'longcat-2.0',
  'longcat-2.5-preview-free',
  'mimo-v2.5',
  'mimo-v2.5-pro',
  'mimo-v2.6-flash',
  'mimo-v2.6-pro',
  'minimax-m2.7',
  'minimax-m3',
  'muse-spark-1.2-contributor',
  'muse-spark-1.3-contributor',
  'qwen3.7-plus',
  'qwen3.8-flash',
  'qwen3.8-max',
  'space-bunny',
  'step-5-preview-free',
];

/** npm package whose published versions describe the running Harness. */
const DSH_PACKAGE = '@deepseek-ai/dsh';
/** Repository whose releases carry the bilingual changelog. */
const RELEASES_REPO = 'deepseek-ai/deepseek-harness';
/** Release tag prefix for Harness releases. */
const RELEASE_TAG_PREFIX = 'dsh-v';
/** How many newer releases to describe, and how much of each body to send. */
const MAX_RELEASES = 6;
const MAX_RELEASE_BODY = 6000;

/** Coerce a configured number into a bounded integer, or fall back. */
function clampNumber(value, min, max, fallback) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

/** Read a finite number, or `null` when the field is absent or unusable. */
function numberOrNull(value) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Clamp a percentage into `[0, 100]`, or `null` when the field is unusable. */
function percentOrNull(value) {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  return Math.min(100, Math.max(0, Math.round(parsed * 100) / 100));
}

/** Accept an ISO instant (or an epoch-millisecond number) as an ISO string. */
function isoOrNull(value) {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  const parsed = numberOrNull(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}

/** Turn a relative `resetInSec` into the absolute instant every reader expects. */
function isoFromDelaySeconds(value) {
  const seconds = numberOrNull(value);
  if (seconds === null) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/** Which metered window an alternate-shape entry names, or `null` when unknown. */
function windowIdOf(name) {
  if (typeof name !== 'string') return null;
  const lowered = name.toLowerCase();
  for (const id of WINDOW_IDS) {
    for (const needle of WINDOW_MATCHERS[id]) {
      if (lowered.indexOf(needle) !== -1) return id;
    }
  }
  return null;
}

/** Normalize one mapped window object into the shape the page renders. */
function normalizeEntry(id, raw) {
  return {
    id: id,
    status: typeof raw.status === 'string' && raw.status.length > 0 ? raw.status : 'ok',
    percent: percentOrNull(raw.percent !== undefined ? raw.percent : raw.usagePercent),
    resetsAt:
      isoOrNull(raw.resetsAt !== undefined ? raw.resetsAt : raw.resetAt) ??
      isoFromDelaySeconds(raw.resetInSec !== undefined ? raw.resetInSec : raw.resetInSeconds),
    used: numberOrNull(raw.used),
    limit: numberOrNull(raw.limit),
  };
}

/**
 * Normalize an upstream usage body into the three known windows.
 *
 * Both known shapes are accepted and merged; unknown entries are dropped rather
 * than guessed at, and a window upstream omitted stays absent so the page can
 * say so instead of inventing 0%.
 */
function extractWindows(body) {
  const byId = new Map();
  const usage = body !== null && typeof body === 'object' ? body.usage : undefined;
  const map = usage !== null && typeof usage === 'object' ? usage : undefined;
  if (map !== undefined) {
    for (const id of WINDOW_IDS) {
      const raw = map[id];
      if (raw !== null && typeof raw === 'object') byId.set(id, normalizeEntry(id, raw));
    }
  }
  const list = body !== null && typeof body === 'object' ? body.windows : undefined;
  if (Array.isArray(list)) {
    for (const raw of list) {
      if (raw === null || typeof raw !== 'object') continue;
      const id = windowIdOf(raw.name !== undefined ? raw.name : raw.window);
      if (id === null || byId.has(id)) continue;
      byId.set(id, normalizeEntry(id, raw));
    }
  }
  return WINDOW_IDS.filter((id) => byId.has(id)).map((id) => byId.get(id));
}

/** JSON answer with live-fact caching disabled on both sides. */
function sendJson(res, status, payload, headOnly) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(headOnly === true ? undefined : JSON.stringify(payload));
}

/** Abort a request after `ms`; the fallback covers runtimes without `AbortSignal.timeout`. */
function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  if (typeof timer.unref === 'function') timer.unref();
  return controller.signal;
}

/** Split a version into comparable parts; `null` when it is not semver-shaped. */
function parseVersion(text) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(String(text));
  if (match === null) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] === undefined ? [] : match[4].split('.'),
  };
}

/** Semver ordering, prerelease-aware: a release outranks its own prereleases. */
function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (a === null || b === null) return 0;
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = a.prerelease[index];
    const rightPart = b.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if (leftNumeric && rightNumeric) {
      if (Number(leftPart) !== Number(rightPart)) return Number(leftPart) < Number(rightPart) ? -1 : 1;
      continue;
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    if (leftPart !== rightPart) return leftPart < rightPart ? -1 : 1;
  }
  return 0;
}

/** Which publishing channel a version belongs to. */
function channelOf(version) {
  if (version.indexOf('-alpha') !== -1) return 'alpha';
  if (version.indexOf('-rc') !== -1) return 'rc';
  if (version.indexOf('-') !== -1) return 'prerelease';
  return 'stable';
}

/**
 * Locate the running Harness installation by walking up from the process
 * entry script until a manifest names `@deepseek-ai/dsh`.
 *
 * The Harness is launched as `node <...>/@deepseek-ai/dsh/lib/bin.js`, so the
 * entry script sits inside the package. This is a lookup, not a dependency: an
 * embedded or unusual launcher simply yields `null` and the page says so.
 */
function resolveDshVersion() {
  const roots = [];
  if (typeof process !== 'undefined' && Array.isArray(process.argv)) {
    for (const arg of process.argv.slice(0, 2)) {
      if (typeof arg === 'string' && arg.length > 0) roots.push(arg);
    }
  }
  for (const root of roots) {
    let directory = dirname(root);
    for (let depth = 0; depth < 10; depth += 1) {
      try {
        const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
        if (manifest !== null && typeof manifest === 'object' && manifest.name === DSH_PACKAGE) {
          return typeof manifest.version === 'string' ? manifest.version : null;
        }
      } catch (error) {
        /* keep walking */
      }
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  return null;
}

/** Without a Web server there is nothing to serve the Client half; stay inert. */
export const inject = ['webServer'];

/** Mount the three reads; the Client half owns every rendered artifact. */
export function apply(ctx, config) {
  const settings = config !== null && typeof config === 'object' ? config : {};
  const baseUrl = String(settings.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/u, '');
  const apiKeyEnv = String(settings.apiKeyEnv ?? DEFAULT_API_KEY_ENV);
  const refreshMs = clampNumber(settings.refreshMs, 5000, 3600000, 60000);
  const infoRefreshMs = clampNumber(settings.infoRefreshMs, 60000, 86400000, 900000);
  const timeoutMs = clampNumber(settings.timeoutMs, 1000, 120000, 15000);
  const registryUrl = String(settings.registryUrl ?? 'https://registry.npmjs.org').replace(/\/+$/u, '');
  const releasesRepo = String(settings.releasesRepo ?? RELEASES_REPO);

  /** One cached answer per key, carrying the in-flight read that produces it. */
  const cache = new Map();

  /** This plugin's own version, read once so every payload can report it. */
  const pluginVersion = (() => {
    try {
      const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'));
      return typeof pkg.version === 'string' ? pkg.version : null;
    } catch (error) {
      return null;
    }
  })();

  const source = () => ({ baseUrl: baseUrl, apiKeyEnv: apiKeyEnv, version: pluginVersion });

  /**
   * Serve `producer()` through a TTL cache; `force` skips a fresh-enough entry.
   *
   * A read that never settles must not poison the key. Before this, one stalled
   * upstream call left `hit.inflight` pending forever, so every later request —
   * including `?force=1` from the refresh button — awaited that same dead
   * promise and the popover sat on "reading" until the Host restarted. An
   * inflight older than the read budget is now abandoned instead, and `force`
   * always starts a fresh read.
   */
  const INFLIGHT_BUDGET_MS = Math.max(timeoutMs * 4, 60000);

  async function cached(key, ttlMs, force, producer) {
    const hit = cache.get(key);
    const now = Date.now();
    if (force !== true && hit !== undefined && hit.payload !== null && now - hit.at < ttlMs) return hit.payload;
    const inflightAge = hit !== undefined && hit.inflightAt !== undefined ? now - hit.inflightAt : Infinity;
    if (hit !== undefined && hit.inflight !== undefined && force !== true && inflightAge < INFLIGHT_BUDGET_MS) {
      return hit.inflight;
    }
    const inflight = (async () => {
      try {
        const payload = await producer();
        cache.set(key, { at: Date.now(), payload: payload });
        return payload;
      } catch (error) {
        const entry = cache.get(key);
        if (entry !== undefined && entry.inflight === inflight) entry.inflight = undefined;
        throw error;
      }
    })();
    cache.set(key, {
      at: hit === undefined ? 0 : hit.at,
      payload: hit === undefined ? null : hit.payload,
      inflight: inflight,
      inflightAt: now,
    });
    return inflight;
  }

  /** Resolve the Go key: the credential store first, then the process environment. */
  async function resolveApiKey() {
    const credentials = ctx.get('credentials');
    if (credentials !== undefined && typeof credentials.resolve === 'function') {
      try {
        const resolved = await credentials.resolve(apiKeyEnv);
        if (resolved !== undefined && typeof resolved.value === 'string' && resolved.value.length > 0) {
          return resolved.value;
        }
      } catch (error) {
        /* fall through to the process environment */
      }
    }
    const fromEnv = typeof process !== 'undefined' && process.env !== undefined ? process.env[apiKeyEnv] : undefined;
    return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : undefined;
  }

  /**
   * One authenticated JSON read against the Go API, retrying transient stalls.
   *
   * The gateway is reached over links that intermittently hang: a read that
   * times out or fails at the socket layer is almost always fine a moment later,
   * and a single-shot read turns that blip into a red popover. Only transport
   * failures are retried — an auth or upstream status is reported as it is.
   */
  const READ_ATTEMPTS = 3;
  const RETRY_BACKOFF_MS = 400;

  async function goJson(path, what) {
    for (let attempt = 1; ; attempt += 1) {
      const answer = await goJsonOnce(path, what);
      if (answer.ok === true || attempt >= READ_ATTEMPTS) return answer;
      if (answer.code !== 'network' && answer.code !== 'timeout') return answer;
      await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS * attempt));
    }
  }

  /** A single attempt; {@link goJson} owns the retry policy. */
  async function goJsonOnce(path, what) {
    const key = await resolveApiKey();
    if (key === undefined) {
      return { ok: false, code: 'no-credential', message: `no credential is configured for ${apiKeyEnv}` };
    }
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${key}`,
          'user-agent': USER_AGENT,
        },
        signal: timeoutSignal(timeoutMs),
      });
    } catch (error) {
      const name = error !== null && typeof error === 'object' ? error.name : undefined;
      if (name === 'TimeoutError' || name === 'AbortError') {
        return { ok: false, code: 'timeout', message: `${what} did not answer within ${timeoutMs} ms` };
      }
      return { ok: false, code: 'network', message: String((error && error.message) || error) };
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, code: 'unauthorized', message: `${what} rejected the Go key (HTTP ${response.status})` };
    }
    if (response.status === 429) {
      return { ok: false, code: 'rate-limited', message: `${what} asked us to slow down (HTTP 429)` };
    }
    let body;
    try {
      body = await response.json();
    } catch (error) {
      return { ok: false, code: 'upstream', message: `HTTP ${response.status} with no JSON body` };
    }
    if (!response.ok) {
      const detail = body !== null && typeof body === 'object' && typeof body.error === 'string' ? `: ${body.error}` : '';
      return { ok: false, code: 'upstream', message: `HTTP ${response.status}${detail}` };
    }
    return { ok: true, body: body };
  }

  /** Go plan meters, normalized to the three windows. */
  async function readUsage() {
    const answer = await goJson('/usage', 'the usage endpoint');
    if (answer.ok !== true) {
      return Object.assign({ source: source() }, answer);
    }
    const windows = extractWindows(answer.body);
    if (windows.length === 0) {
      return { ok: false, code: 'shape', message: 'the usage endpoint returned no recognized window', source: source() };
    }
    return {
      ok: true,
      source: source(),
      plan: typeof answer.body.plan === 'string' ? answer.body.plan : null,
      useBalance: typeof answer.body.useBalance === 'boolean' ? answer.body.useBalance : null,
      fetchedAt: new Date().toISOString(),
      windows: windows,
    };
  }

  /** The Go model catalog plus both diffs the page shows. */
  async function readModels() {
    const answer = await goJson('/models', 'the models endpoint');
    if (answer.ok !== true) {
      return Object.assign({ source: source() }, answer);
    }
    const list = answer.body !== null && typeof answer.body === 'object' ? answer.body.data : undefined;
    const rows = (Array.isArray(list) ? list : []).filter(
      (row) => row !== null && typeof row === 'object' && typeof row.id === 'string',
    );
    if (rows.length === 0) {
      return { ok: false, code: 'shape', message: 'the models endpoint returned no model', source: source() };
    }
    const models = rows
      .map((row) => ({ id: row.id, ownedBy: typeof row.owned_by === 'string' ? row.owned_by : null }))
      .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
    const live = new Set(models.map((model) => model.id));
    const documented = new Set(DOCS_BASELINE_MODELS);
    return {
      ok: true,
      source: source(),
      fetchedAt: new Date().toISOString(),
      total: models.length,
      models: models,
      docsBaseline: {
        date: DOCS_BASELINE_DATE,
        count: DOCS_BASELINE_MODELS.length,
        notInDocs: models.filter((model) => !documented.has(model.id)).map((model) => model.id),
        missingFromApi: DOCS_BASELINE_MODELS.filter((id) => !live.has(id)),
      },
    };
  }

  /** Published npm tags for the Harness package. */
  async function readNpmTags() {
    let response;
    try {
      response = await fetch(`${registryUrl}/${encodeURIComponent(DSH_PACKAGE)}`, {
        headers: { accept: 'application/json', 'user-agent': USER_AGENT },
        signal: timeoutSignal(timeoutMs),
      });
    } catch (error) {
      return { ok: false, code: 'network', message: String((error && error.message) || error) };
    }
    if (!response.ok) {
      return { ok: false, code: 'registry', message: `the npm registry answered HTTP ${response.status}` };
    }
    let body;
    try {
      body = await response.json();
    } catch (error) {
      return { ok: false, code: 'registry', message: 'the npm registry answer was not JSON' };
    }
    const tags = body !== null && typeof body === 'object' ? body['dist-tags'] : undefined;
    if (tags === null || typeof tags !== 'object') {
      return { ok: false, code: 'registry', message: 'the npm registry answer carried no dist-tags' };
    }
    const channels = {};
    for (const name of Object.keys(tags)) {
      if (typeof tags[name] === 'string') channels[name] = tags[name];
    }
    const times = body !== null && typeof body === 'object' && body.time !== null && typeof body.time === 'object' ? body.time : {};
    return { ok: true, channels: channels, times: times };
  }

  /** Public release feed for the Harness repository. */
  async function readReleases() {
    let response;
    try {
      response = await fetch(`https://api.github.com/repos/${releasesRepo}/releases?per_page=40`, {
        headers: { accept: 'application/vnd.github+json', 'user-agent': USER_AGENT },
        signal: timeoutSignal(timeoutMs),
      });
    } catch (error) {
      return { ok: false, code: 'network', message: String((error && error.message) || error) };
    }
    if (response.status === 403 || response.status === 429) {
      return { ok: false, code: 'rate-limited', message: `the release feed refused us (HTTP ${response.status})` };
    }
    if (!response.ok) {
      return { ok: false, code: 'releases', message: `the release feed answered HTTP ${response.status}` };
    }
    let body;
    try {
      body = await response.json();
    } catch (error) {
      return { ok: false, code: 'releases', message: 'the release feed answer was not JSON' };
    }
    if (!Array.isArray(body)) {
      return { ok: false, code: 'releases', message: 'the release feed answer was not a list' };
    }
    const releases = [];
    for (const entry of body) {
      if (entry === null || typeof entry !== 'object') continue;
      const tag = typeof entry.tag_name === 'string' ? entry.tag_name : '';
      if (tag.indexOf(RELEASE_TAG_PREFIX) !== 0) continue;
      const version = tag.slice(RELEASE_TAG_PREFIX.length);
      if (parseVersion(version) === null) continue;
      releases.push({
        version: version,
        tag: tag,
        name: typeof entry.name === 'string' ? entry.name : tag,
        publishedAt: isoOrNull(entry.published_at),
        prerelease: entry.prerelease === true,
        channel: channelOf(version),
        body: typeof entry.body === 'string' ? entry.body.slice(0, MAX_RELEASE_BODY) : '',
      });
    }
    return { ok: true, releases: releases };
  }

  /** Running Harness version against every published release newer than it. */
  async function readVersion() {
    const current = resolveDshVersion();
    const tags = await readNpmTags();
    const feed = await readReleases();
    const channels = tags.ok === true ? tags.channels : {};
    const times = tags.ok === true ? tags.times : {};
    const latest = typeof channels.latest === 'string' ? channels.latest : null;
    const newer =
      feed.ok === true && current !== null
        ? feed.releases
            .filter((release) => compareVersions(release.version, current) > 0)
            .sort((left, right) => compareVersions(right.version, left.version))
        : [];
    const releases = newer.slice(0, MAX_RELEASES).map((release) =>
      Object.assign({}, release, {
        beyondLatest: latest !== null && compareVersions(release.version, latest) > 0,
      }),
    );
    /* Publish date of every tag a channel names: the release feed is the
       authority, npm's `time` map covers a tag the feed does not carry. */
    const publishedAt = new Map();
    if (feed.ok === true) {
      for (const release of feed.releases) {
        if (!publishedAt.has(release.version)) publishedAt.set(release.version, release.publishedAt);
      }
    }
    const channelDates = {};
    for (const name of Object.keys(channels)) {
      const version = channels[name];
      const date = isoOrNull(publishedAt.get(version)) ?? isoOrNull(times[version]);
      if (date !== null) channelDates[name] = date;
    }
    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      current: current,
      channels: channels,
      channelDates: channelDates,
      latest: latest,
      latestPublishedAt: latest === null ? null : isoOrNull(times[latest]),
      updateAvailable: current !== null && latest !== null && compareVersions(latest, current) > 0,
      newerCount: newer.length,
      releases: releases,
      releasesOk: feed.ok === true,
      releasesMessage: feed.ok === true ? null : feed.message,
      registryOk: tags.ok === true,
      registryMessage: tags.ok === true ? null : tags.message,
    };
  }

  /** Register one exact JSON route behind the Host's trust fence. */
  function registerRoute(path, what, produce) {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'exact',
          path: path,
          handler: async (req, res) => {
            const connection = ctx.get('connection');
            if (connection !== undefined && typeof connection.requestRejection === 'function') {
              const rejection = connection.requestRejection(req);
              if (rejection !== undefined) {
                res.statusCode = rejection;
                res.end();
                return;
              }
            }
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              res.statusCode = 405;
              res.setHeader('allow', 'GET, HEAD');
              res.end();
              return;
            }
            const force = typeof req.url === 'string' && req.url.indexOf('force=1') !== -1;
            let payload;
            try {
              payload = await produce(force);
            } catch (error) {
              payload = { ok: false, code: 'internal', message: String((error && error.message) || error), source: source() };
            }
            sendJson(res, 200, payload, req.method === 'HEAD');
          },
        }),
      `opencode-go-quota: GET ${path} (${what})`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // 「更新模型分栏」
  //
  // 目标：把 Go 实时目录(/models)里有、但 pi-ai 内置快照尚未收录的模型，
  // 逐个实测出「协议 + 视觉 + 推理」，然后重新生成 profile patch 里
  //   # >>> BEGIN auto-managed: opencode-go-quota
  //   # <<< END auto-managed: opencode-go-quota
  // 之间的内容。区块外的用户手写配置一个字节都不动。
  //
  // 为什么要实测协议：DSH 的 `api` 是 route 级字段（PiAiModelProfile 没有
  // api），所以一种协议必须占一栏；而同一个网关不同模型的方言并不统一
  // （实测 claude-haiku-5-5 只说 anthropic-messages，gpt-6-luna 只说
  //  openai-responses，其余多数吃 openai-completions）。
  // ───────────────────────────────────────────────────────────────────────

  /**
   * 32×32 纯红 PNG（208 字符，已实测被所有候选端点接受）。
   *
   * 只用来让「带图 / 不带图」产生可测的 token 差值，不关心它画的是什么 ——
   * 更大的图反而会被部分上游以 invalid_parameter 拒掉，所以刻意留小。
   */
  /** 判定「端点是否收图」的 prompt token 增量阈值（丢弃图像时增量为 0）。 */
  const VISION_TOKEN_DELTA = 5;

  /** 探针单次请求的超时；部分模型带图推理很慢，60s 会误判成不支持。 */
  const PROBE_TIMEOUT_MS = 120000;

  const RED_PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAvSURBVFhH7c4hAQAACAMwkrx/KLqcGJiJ+c0m/SQgICAgICAgICAgICAgIPAcSA/xOFx5OIo7rwAAAABJRU5ErkJggg==';

  /** 每种协议对应一栏的名字与标题。 */
  const PROTOCOL_ROUTES = {
    'openai-completions': { id: 'opencode-go-new', title: 'OpenCode Go · 目录外新模型', suffix: '/chat/completions' },
    'anthropic-messages': { id: 'opencode-go-anthropic', title: 'OpenCode Go · 目录外 (Anthropic 协议)', suffix: '/messages' },
    'openai-responses': { id: 'opencode-go-responses', title: 'OpenCode Go · 目录外 (Responses 协议)', suffix: '/responses' },
  };

  /**
   * 跑 `fn()` 最多 `times` 次，返回第一个非 null 的结果。
   *
   * 探针要区分「测出来是不支持」和「根本没测成」：前者是有意义的答案，
   * 后者只说明上游抖动（超时、瞬时 5xx）。用 null 表示没测成，才会重试。
   */
  async function retrying(times, fn) {
    for (let attempt = 0; attempt < times; attempt += 1) {
      try {
        const value = await fn();
        if (value !== null && value !== undefined) return value;
      } catch (error) {
        /* retry */
      }
    }
    return null;
  }

  /** 由字符串派生稳定的 session id，重复生成不会漂移。 */
  function stableSessionId(seed) {
    let h1 = 0x811c9dc5;
    let h2 = 0x1000193;
    let h3 = 0x9e3779b1;
    let h4 = 0x85ebca6b;
    for (let i = 0; i < seed.length; i += 1) {
      const c = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 + c, 2246822519) >>> 0;
      h3 = Math.imul(h3 ^ (c << 3), 3266489917) >>> 0;
      h4 = Math.imul(h4 + (c << 5), 668265263) >>> 0;
    }
    const hex = [h1, h2, h3, h4].map((n) => n.toString(16).padStart(8, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }

  /** 定位 pi-ai 内置的 opencode-go 目录文件（可能不在本 profile 的依赖里）。 */
  function snapshotPath() {
    const override = typeof process !== 'undefined' ? process.env.DSH_PI_AI_SNAPSHOT : undefined;
    const candidates = [];
    if (typeof override === 'string' && override.length > 0) candidates.push(override);

    // 从 DSH 入口和本模块位置各自向上逐层查找 node_modules，
    // 因为 pi-ai 属于 DSH 的依赖树，未必在 profile 自己的 node_modules 里。
    const seeds = [];
    if (typeof process !== 'undefined' && typeof process.argv[1] === 'string') seeds.push(process.argv[1]);
    try {
      seeds.push(fileURLToPath(import.meta.url));
    } catch (error) {
      /* import.meta unavailable in some bundlers */
    }
    for (const seed of seeds) {
      let dir = dirname(seed);
      for (let depth = 0; depth < 8; depth += 1) {
        candidates.push(join(dir, 'node_modules', '@earendil-works', 'pi-ai', 'dist', 'providers', 'data', 'opencode-go.json'));
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    }
    for (const candidate of candidates) {
      try {
        readFileSync(candidate);
        return candidate;
      } catch (error) {
        /* try the next candidate */
      }
    }
    return null;
  }

  /** 快照里已收录的模型 id → 它们的协议与元数据。 */
  function readSnapshot() {
    const path = snapshotPath();
    if (path === null) return { ok: false, code: 'no-snapshot', message: 'pi-ai snapshot not found', models: new Map(), path: null };
    let doc;
    try {
      doc = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      return { ok: false, code: 'snapshot', message: String((error && error.message) || error), models: new Map(), path };
    }
    const models = new Map();
    for (const [api, group] of Object.entries(doc !== null && typeof doc === 'object' ? doc : {})) {
      if (group === null || typeof group !== 'object') continue;
      for (const [id, entry] of Object.entries(group)) {
        models.set(id, {
          api: api,
          input: entry !== null && typeof entry === 'object' && Array.isArray(entry.input) ? entry.input : ['text'],
        });
      }
    }
    return { ok: true, path, models };
  }

  /** 一次 POST，返回 { status, body }；网络异常抛出。 */
  async function postJson(url, extraHeaders, body, ms) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-opencode-session': stableSessionId('opencode-go-quota-probe'),
        'user-agent': USER_AGENT,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: timeoutSignal(Math.max(ms, timeoutMs)),
    });
    let parsed = null;
    try {
      parsed = await response.json();
    } catch (error) {
      parsed = null;
    }
    return { status: response.status, body: parsed };
  }

  /** 按协议发一次纯文本请求，返回统一形状。 */
  async function textTurn(api, id, key, prompt, maxTokens) {
    if (api === 'anthropic-messages') {
      const answer = await postJson(
        `${baseUrl}/messages`,
        { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        { model: id, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] },
        PROBE_TIMEOUT_MS,
      );
      const error = answer.body !== null && typeof answer.body === 'object' ? answer.body.error : undefined;
      if (error !== undefined && error !== null) return { ok: false, type: error.type, message: String(error.message ?? '') };
      const blocks = Array.isArray(answer.body?.content) ? answer.body.content : [];
      return {
        ok: true,
        text: blocks.filter((b) => b?.type === 'text').map((b) => b.text).join(''),
        thinks: blocks.some((b) => b?.type === 'thinking' || b?.type === 'reasoning'),
        promptTokens: answer.body?.usage?.input_tokens ?? null,
      };
    }
    if (api === 'openai-responses') {
      const answer = await postJson(
        `${baseUrl}/responses`,
        { Authorization: `Bearer ${key}` },
        { model: id, input: prompt, max_output_tokens: maxTokens },
        PROBE_TIMEOUT_MS,
      );
      const error = answer.body !== null && typeof answer.body === 'object' ? answer.body.error : undefined;
      if (error !== undefined && error !== null) return { ok: false, type: error.type, message: String(error.message ?? '') };
      return { ok: true, text: String(answer.body?.output_text ?? ''), thinks: false, promptTokens: answer.body?.usage?.input_tokens ?? null };
    }
    const answer = await postJson(
      `${baseUrl}/chat/completions`,
      { Authorization: `Bearer ${key}` },
      { model: id, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens },
      60000,
    );
    const error = answer.body !== null && typeof answer.body === 'object' ? answer.body.error : undefined;
    if (error !== undefined && error !== null) return { ok: false, type: error.type, message: String(error.message ?? '') };
    const message = answer.body?.choices?.[0]?.message ?? {};
    return {
      ok: true,
      text: String(message.content ?? ''),
      thinks: typeof message.reasoning_content === 'string' && message.reasoning_content.length > 0,
      promptTokens: answer.body?.usage?.prompt_tokens ?? null,
    };
  }

  /** 按协议发一次带图请求，只回报它是否被接受以及计了多少钱的 token。 */
  async function imageTurn(api, id, key, question) {
    if (api === 'anthropic-messages') {
      const answer = await postJson(
        `${baseUrl}/messages`,
        { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        {
          model: id,
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: question },
                { type: 'image', source: { type: 'base64', media_type: 'image/png', data: RED_PNG_B64 } },
              ],
            },
          ],
        },
        PROBE_TIMEOUT_MS,
      );
      const error = answer.body !== null && typeof answer.body === 'object' ? answer.body.error : undefined;
      if (error !== undefined && error !== null) return { ok: false };
      return { ok: true, promptTokens: answer.body?.usage?.input_tokens ?? null };
    }
    const content = [
      { type: 'text', text: question },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${RED_PNG_B64}` } },
    ];
    const isResponses = api === 'openai-responses';
    const answer = await postJson(
      isResponses ? `${baseUrl}/responses` : `${baseUrl}/chat/completions`,
      { Authorization: `Bearer ${key}` },
      isResponses
        ? { model: id, input: [{ role: 'user', content }], max_output_tokens: 200 }
        : { model: id, messages: [{ role: 'user', content }], max_tokens: 200 },
      60000,
    );
    const error = answer.body !== null && typeof answer.body === 'object' ? answer.body.error : undefined;
    if (error !== undefined && error !== null) return { ok: false };
    return {
      ok: true,
      promptTokens: isResponses
        ? (answer.body?.usage?.input_tokens ?? null)
        : (answer.body?.usage?.prompt_tokens ?? null),
    };
  }

  /**
   * 判定视觉支持：对比「纯文本」与「带图」两次请求的 prompt token 增量。
   *
   * 图像一旦被端点接受就必然计入 token，所以增量明显大于 0 就说明它真的收图。
   * 这比「让它描述图像内容再匹配关键词」可靠得多 —— 实测个别模型对退化的
   * 纯色小图会答错颜色（longcat 把红图读成 Blue），但它照样吃掉了图像 token。
   * `input` 需要声明的是「端点收不收图」，而不是「它认不认得准」，所以用增量。
   */
  async function visionTurn(api, id, key) {
    const question = 'Describe this image in one short sentence.';
    let baseline;
    try {
      baseline = await textTurn(api, id, key, question, 80);
    } catch (error) {
      return null;
    }
    if (baseline.ok !== true) return null;

    let withImage;
    try {
      withImage = await imageTurn(api, id, key, question);
    } catch (error) {
      return null;
    }
    if (withImage.ok !== true) return null;

    const before = baseline.promptTokens;
    const after = withImage.promptTokens;
    // 图像被丢弃时请求正文与纯文本完全相同，delta 恒为 0；只要端点收图，
    // 不同编码器会加上 18~170 不等的 token（实测 32×32 小图的下界是 18）。
    // 阈值取 5，既避开「完全没加」也容忍编码器的最小开销。
    if (typeof before === 'number' && typeof after === 'number' && before > 0) return after - before >= VISION_TOKEN_DELTA;
    return true;
  }

  /** 实测一个模型的协议、视觉、推理。 */
  async function probeModel(id, key) {
    const order = ['openai-completions', 'anthropic-messages', 'openai-responses'];
    let chosen = null;
    let lastReason = 'no protocol accepted the model';
    for (const api of order) {
      let answer;
      try {
        answer = await textTurn(api, id, key, 'Reply with exactly: OK', 200);
      } catch (error) {
        lastReason = `network: ${String((error && error.message) || error)}`;
        continue;
      }
      if (answer.ok) {
        chosen = api;
        break;
      }
      if (answer.type === 'ModelProtocolUnsupported') continue;
      // 地区封锁 / 需同意训练 / 上游故障：换协议也没用，直接定案
      return { id, ok: false, reason: `${answer.type ?? 'error'}: ${String(answer.message ?? '').slice(0, 120)}` };
    }
    if (chosen === null) return { id, ok: false, reason: lastReason };

    // 推理：用一道会诱发推理的题，看有没有 thinking/reasoning 内容。
    // 上游偶发超时/抖动，所以每步都重试一次，并把「测出 false」与「没测出来」
    // 区分开：没测出来就按保守值处理（不声明该能力），避免误判成不支持。
    const thinks = await retrying(2, async () => {
      const think = await textTurn(
        chosen,
        id,
        key,
        'A bat and a ball cost $1.10 total. The bat costs $1.00 more than the ball. How much is the ball?',
        800,
      );
      if (think.ok !== true) return null;
      return think.thinks === true;
    });

    const seen = await retrying(2, () => visionTurn(chosen, id, key));

    return { id, ok: true, api: chosen, vision: seen === true, reasoning: thinks === true };
  }

  /** 把实测结果渲染成 patch 文件里的 provider 区块文本（6 空格缩进）。 */
  function renderBlock(groups) {
    const lines = [];
    for (const [api, models] of Object.entries(groups)) {
      const route = PROTOCOL_ROUTES[api];
      if (route === undefined || models.length === 0) continue;
      lines.push(`      ${route.id}:`);
      lines.push(`        displayName: ${route.title}`);
      lines.push('        apiKeyEnv: OPENCODE_GO_API_KEY');
      lines.push(`        api: ${api}`);
      lines.push('        baseURL: https://opencode.ai/zen/go/v1');
      lines.push('        headers:');
      lines.push(`          x-opencode-session: ${stableSessionId(route.id)}`);
      lines.push('        models:');
      for (const model of models) {
        lines.push(`          - id: ${model.id}`);
        if (model.name !== undefined && model.name !== null) lines.push(`            name: ${model.name}`);
        lines.push('            contextWindow: 262144');
        lines.push('            maxTokens: 32768');
        lines.push(`            input: [${(model.vision ? ['text', 'image'] : ['text']).join(', ')}]`);
        if (model.reasoning) {
          lines.push('            reasoningEfforts:');
          lines.push('              low: low');
          lines.push('              medium: medium');
          lines.push('              high: high');
        }
      }
    }
    return lines.join('\n');
  }

  /** 用新生成的区块替换标记之间的旧内容；区块外一个字节都不动。 */
  function splicePatch(text, block) {
    const lines = text.split(/\r?\n/u);
    const begin = lines.findIndex((line) => line.includes('>>> BEGIN auto-managed: opencode-go-quota'));
    const end = lines.findIndex((line) => line.includes('<<< END auto-managed: opencode-go-quota'));
    if (begin === -1 || end === -1 || end <= begin) {
      throw new Error('auto-managed markers not found in cordis.patch.yml (expected ">>> BEGIN/<<< END auto-managed: opencode-go-quota")');
    }
    const next = [...lines.slice(0, begin + 1), ...block.split('\n'), ...lines.slice(end)];
    return next.join('\n');
  }

  /** 找到当前 profile 的 patch 文件。 */
  function patchFile() {
    const profileDir = typeof process !== 'undefined' ? process.env.DSH_PROFILE_DIR : undefined;
    if (typeof profileDir === 'string' && profileDir.length > 0) return join(profileDir, 'cordis.patch.yml');
    const home = typeof process !== 'undefined' ? process.env.DSH_HOME : undefined;
    if (typeof home === 'string' && home.length > 0) {
      const name = typeof process !== 'undefined' ? process.env.DSH_PROFILE : undefined;
      return join(home, 'profiles', name ?? 'web', 'cordis.patch.yml');
    }
    return null;
  }

  /** 从现有标记区块里恢复已知模型的能力，让重复点击不必全量重测。 */
  function knownFromBlock(text) {
    const known = new Map();
    let inside = false;
    let api = null;
    let current = null;
    for (const line of text.split(/\r?\n/u)) {
      if (line.includes('>>> BEGIN auto-managed: opencode-go-quota')) {
        inside = true;
        continue;
      }
      if (line.includes('<<< END auto-managed: opencode-go-quota')) break;
      if (!inside) continue;
      const apiMatch = /^\s+api:\s*(\S+)\s*$/u.exec(line);
      if (apiMatch !== null) {
        api = apiMatch[1];
        continue;
      }
      const idMatch = /^\s+-\s+id:\s*(\S+)\s*$/u.exec(line);
      if (idMatch !== null) {
        current = { api: api, vision: false, reasoning: false };
        known.set(idMatch[1], current);
        continue;
      }
      if (current === null) continue;
      const inputMatch = /^\s+input:\s*\[(.*)\]\s*$/u.exec(line);
      if (inputMatch !== null) current.vision = /image/u.test(inputMatch[1]);
      if (/^\s+reasoningEfforts:\s*$/u.test(line)) current.reasoning = true;
    }
    return known;
  }

  /** 完整同步流程：算差集 → 逐个实测 → 生成区块 → 写回 → 返回报告。 */
  async function syncModels(force) {
    const recheck = force === true;
    const key = await resolveApiKey();
    if (key === undefined) {
      return { ok: false, code: 'no-credential', message: `no credential is configured for ${apiKeyEnv}` };
    }
    const snapshot = readSnapshot();
    if (snapshot.ok !== true) return { ok: false, code: snapshot.code, message: snapshot.message };

    const file = patchFile();
    if (file === null) return { ok: false, code: 'no-patch-path', message: 'cannot resolve the profile patch file' };

    let before;
    try {
      before = readFileSync(file, 'utf8');
    } catch (error) {
      return { ok: false, code: 'read-patch', message: String((error && error.message) || error) };
    }

    // 已经测过的模型直接复用上一轮结论：既让重复点击变快，也避免上游抖动把
    // 已知能力反复翻面（一次误判就会让 input 少声明 image）。
    const known = knownFromBlock(before);

    const catalog = await goJson('/models', 'the models endpoint');
    if (catalog.ok !== true) return Object.assign({ ok: false }, catalog);
    const list = catalog.body !== null && typeof catalog.body === 'object' ? catalog.body.data : undefined;
    const live = (Array.isArray(list) ? list : [])
      .filter((row) => row !== null && typeof row === 'object' && typeof row.id === 'string')
      .map((row) => row.id)
      .sort();

    const missing = live.filter((id) => !snapshot.models.has(id));
    const probes = [];
    const reused = [];
    for (const id of missing) {
      const memo = known.get(id);
      if (recheck !== true && memo !== undefined) {
        probes.push({ id, ok: true, api: memo.api, vision: memo.vision, reasoning: memo.reasoning });
        reused.push(id);
        continue;
      }
      try {
        probes.push(await probeModel(id, key));
      } catch (error) {
        probes.push({ id, ok: false, reason: `probe threw: ${String((error && error.message) || error)}` });
      }
    }

    const groups = {};
    const skipped = [];
    for (const probe of probes) {
      if (probe.ok !== true) {
        skipped.push({ id: probe.id, reason: probe.reason });
        continue;
      }
      groups[probe.api] = groups[probe.api] ?? [];
      groups[probe.api].push({ id: probe.id, vision: probe.vision, reasoning: probe.reasoning });
    }

    const block = renderBlock(groups);
    let after;
    try {
      after = splicePatch(before, block);
    } catch (error) {
      return { ok: false, code: 'splice', message: String((error && error.message) || error) };
    }

    const changed = after !== before;
    if (changed) {
      try {
        writeFileSync(file, after, 'utf8');
      } catch (error) {
        return { ok: false, code: 'write-patch', message: String((error && error.message) || error) };
      }
    }

    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      liveCount: live.length,
      snapshotCount: snapshot.models.size,
      snapshotPath: snapshot.path,
      patchFile: file,
      changed: changed,
      reused: reused,
      applied: Object.entries(groups).map(([api, models]) => ({
        api: api,
        provider: PROTOCOL_ROUTES[api]?.id ?? api,
        models: models.map((m) => ({ id: m.id, vision: m.vision, reasoning: m.reasoning })),
      })),
      skipped: skipped,
      live: live,
    };
  }

  /** 注册一个允许 POST 的动作路由（写操作只开放 POST）。 */
  function registerAction(path, what, produce) {
    ctx.effect(
      () =>
        ctx.webServer.register({
          kind: 'exact',
          path: path,
          handler: async (req, res) => {
            const connection = ctx.get('connection');
            if (connection !== undefined && typeof connection.requestRejection === 'function') {
              const rejection = connection.requestRejection(req);
              if (rejection !== undefined) {
                res.statusCode = rejection;
                res.end();
                return;
              }
            }
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('allow', 'POST');
              res.end();
              return;
            }
            let payload;
            try {
              payload = await produce(req);
            } catch (error) {
              payload = { ok: false, code: 'internal', message: String((error && error.message) || error) };
            }
            sendJson(res, 200, payload, false);
          },
        }),
      `opencode-go-quota: POST ${path} (${what})`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // 「第三方目录」：Agnes / SenseNova 的 /models 清单
  //
  // 与 Go 目录无关的第三条数据源。凭据仍走 ctx.credentials（默认 ref：
  // AGNES_API_KEY / SENSENOVA_API_KEY），清单由 Host 缓存，?force=1 才重打上游。
  // 单个提供方失败只影响它自己那一节，整体仍是 ok，页面照常渲染其余部分。
  // ───────────────────────────────────────────────────────────────────────
  const DEFAULT_WATCH = [
    {
      id: 'agnes',
      label: 'Agnes',
      baseUrl: 'https://apihub.agnes-ai.com/v1',
      apiKeyEnv: 'AGNES_API_KEY',
      docs: 'https://agnes-ai.com/zh-Hans/docs/overview',
      /* Mintlify publishes a machine-readable index of every documentation
         page here, and the model pages are the catalog. Used only when no
         credential is configured, so a key still wins when one exists. */
      docsIndex: 'https://wiki.agnes-ai.com/llms.txt',
      consoleUrl: 'https://platform.agnes-ai.com',
    },
    {
      id: 'sensenova',
      label: 'SenseNova',
      baseUrl: 'https://token.sensenova.cn/v1',
      apiKeyEnv: 'SENSENOVA_API_KEY',
      docs: 'https://platform.sensenova.cn/docs',
      /* The docs site is a Next.js shell that only renders in a browser, and it
         has no llms.txt / openapi.json (every probe answers 404). Its page
         content — including the model table as raw Markdown — is compiled into a
         content-hashed chunk under /_next/static/chunks/. So the plugin reads
         the page HTML, finds the chunk holding the table, and parses it. The
         chunk name changes on every deploy, hence discovery rather than a fixed
         URL. No credential is involved at any point. */
      docsChunksPage: 'https://platform.sensenova.cn/docs',
      /* Offline fallback, used only when that scan fails: a dated copy of the
         same table. Not the primary source any more. */
      staticAsOf: '2026-11-05',
      staticModels: [
        { id: 'sensenova-6.8-flash', name: 'SenseNova 6.8 Flash' },
        { id: 'sensenova-6.8-flash-lite', name: 'SenseNova 6.8 Flash Lite' },
        { id: 'sensenova-u1.5-lite', name: 'SenseNova U1.5 Lite' },
        { id: 'sensenova-u1.5-fast', name: 'SenseNova U1.5 Fast' },
        { id: 'deepseek-flash', name: 'DeepSeek V4.1 Flash' },
        { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
        { id: 'glm-5.3', name: 'GLM-5.3' },
        { id: 'glm-5.2', name: 'GLM-5.2' },
        { id: 'kimi-k3', name: 'Kimi K3' },
      ],
      consoleUrl: 'https://platform.sensenova.cn',
    },
  ];

  /**
   * The configured provider list, normalized.
   *
   * Opt-in by design: no `watchProviders` means no third-party catalog at all, so
   * an installation that never asked for it does not grow an empty fourth cell.
   * `DEFAULT_WATCH` is only a per-id fallback for the fields an entry leaves out
   * (label / docs / console link / credential ref).
   */
  function watchSpecs() {
    const configured = Array.isArray(settings.watchProviders) ? settings.watchProviders : [];
    return configured
      .filter((spec) => spec !== null && typeof spec === 'object' && typeof spec.baseUrl === 'string')
      .map((spec, index) => {
        const id = String(spec.id ?? `provider-${index}`);
        const fallback = DEFAULT_WATCH.find((entry) => entry.id === id) ?? {};
        const pick = (value, fallbackValue) =>
          typeof value === 'string' && value.length > 0 ? value : typeof fallbackValue === 'string' ? fallbackValue : undefined;
        /* A static snapshot may come from either layer; a configured one is for
           a gateway the shipped defaults do not describe. */
        const snapshotOf = (value, fallbackValue) => {
          if (Array.isArray(value) && value.length > 0) return value;
          if (Array.isArray(fallbackValue) && fallbackValue.length > 0) return fallbackValue;
          return null;
        };
        return {
          id: id,
          label: pick(spec.label, fallback.label) ?? id,
          baseUrl: String(spec.baseUrl).replace(/\/+$/u, ''),
          apiKeyEnv: pick(spec.apiKeyEnv, fallback.apiKeyEnv),
          docs: pick(spec.docs, fallback.docs) ?? null,
          docsIndex: pick(spec.docsIndex, fallback.docsIndex) ?? null,
          docsChunksPage: pick(spec.docsChunksPage, fallback.docsChunksPage) ?? null,
          staticModels: snapshotOf(spec.staticModels, fallback.staticModels),
          staticAsOf: pick(spec.staticAsOf, fallback.staticAsOf) ?? null,
          consoleUrl: pick(spec.consoleUrl, fallback.consoleUrl) ?? null,
        };
      });
  }

  /** Resolve an arbitrary credential ref: the store first, then the process environment. */
  async function resolveRef(env) {
    if (typeof env !== 'string' || env.length === 0) return undefined;
    const credentials = ctx.get('credentials');
    if (credentials !== undefined && typeof credentials.resolve === 'function') {
      try {
        const resolved = await credentials.resolve(env);
        if (resolved !== undefined && typeof resolved.value === 'string' && resolved.value.length > 0) {
          return resolved.value;
        }
      } catch (error) {
        /* fall through to the process environment */
      }
    }
    const fromEnv = typeof process !== 'undefined' && process.env !== undefined ? process.env[env] : undefined;
    return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : undefined;
  }

  /**
   * Turn a documentation slug into the id the API serves.
   * `agnes-25-flash` → `agnes-2.5-flash`, `agnes-video-25` → `agnes-video-2.5`.
   */
  function slugToModelId(slug) {
    return slug.replace(/-(\d)(\d)(?=-|$)/gu, '-$1.$2');
  }

  /**
   * Model entries from a Mintlify `llms.txt` documentation index.
   *
   * Only pages whose slug starts with the provider id count: the same index also
   * lists quickstarts, integration guides, pricing and legal pages, and none of
   * those are models. Entries are deduplicated by derived id.
   *
   * @returns models in id order, possibly empty when the index carries none.
   */
  function parseDocsIndex(text, spec) {
    const models = [];
    const seen = new Set();
    for (const line of String(text).split(/\r?\n/u)) {
      const match = /^\s*-\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+?\.md)\)\s*(?::\s*(.*))?$/u.exec(line);
      if (match === null) continue;
      const slug = match[2].split('/').pop().replace(/\.md$/u, '');
      if (!slug.startsWith(`${spec.id}-`)) continue;
      const id = slugToModelId(slug);
      if (seen.has(id)) continue;
      seen.add(id);
      const note = typeof match[3] === 'string' ? match[3].trim() : '';
      models.push({ id: id, name: match[1].trim(), contextWindow: null, note: note.length > 0 ? note : null });
    }
    return models.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  /**
   * The header of a model table in the published Markdown, cell padding and all:
   * `| Model Name               | Model ID                   | Description |`.
   */
  const MODEL_TABLE_HEADER = /\|\s*Model\s*Name\s*\|\s*Model\s*ID\s*\|/iu;
  /** Chunk references inside one docs page's HTML. */
  const NEXT_CHUNK_HINT = /\/_next\/static\/chunks\/[^"'\s)]+?\.js/gu;
  /** How many chunks a single scan may fetch, newest first in page order. */
  const MAX_DOCS_CHUNKS = 40;
  /** Which chunk last carried a provider's model table, so a later read skips the scan. */
  const chunkCache = new Map();

  /**
   * Parse a Markdown model table out of a chunk's source text.
   *
   * Rows look like `| SenseNova 6.8 Flash | \`sensenova-6.8-flash\` | … |`, with
   * padding spaces and escaped newlines because this is a JavaScript string.
   * Only rows whose second cell is a backticked id count, so the separator line
   * and any prose are skipped.
   */
  function parseModelTable(text) {
    const header = MODEL_TABLE_HEADER.exec(text);
    if (header === null) return [];
    const region = text.slice(header.index, header.index + 12000);
    const models = [];
    const seen = new Set();
    for (const rawLine of region.split(/\\n|\n/u)) {
      const line = rawLine.trim();
      if (!line.startsWith('|')) continue;
      const cells = line.split('|').map((cell) => cell.trim());
      if (cells.length < 4) continue;
      const idMatch = /^`([^`]+)`$/u.exec(cells[2]);
      if (idMatch === null) continue;
      const id = idMatch[1].trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(id) || seen.has(id)) continue;
      seen.add(id);
      const name = cells[1].replace(/\s+/gu, ' ').trim();
      models.push({ id: id, name: name.length > 0 ? name : id, contextWindow: null });
    }
    return models.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }

  /** Fetch one chunk and return its model table, or [] when it carries none. */
  async function readChunkTable(url) {
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { accept: 'text/javascript, application/javascript, */*;q=0.8', 'user-agent': USER_AGENT },
        signal: timeoutSignal(timeoutMs),
      });
    } catch (error) {
      return [];
    }
    if (!response.ok) return [];
    let text;
    try {
      text = await response.text();
    } catch (error) {
      return [];
    }
    if (!MODEL_TABLE_HEADER.test(text)) return [];
    return parseModelTable(text);
  }

  /**
   * One provider's catalog read from its documentation site's compiled chunks.
   *
   * A Next.js page renders its Markdown into a content-hashed chunk, so there is
   * no stable URL to fetch: the page HTML is read for chunk references, then the
   * chunks are scanned in small batches until one carries the model table. The
   * winning URL is remembered, so a repeat read fetches one file instead of all.
   *
   * @returns normalized models, or `null` when no chunk could be read.
   */
  async function readProviderChunks(spec, head) {
    const known = chunkCache.get(spec.id);
    if (typeof known === 'string') {
      const models = await readChunkTable(known);
      if (models.length > 0) return Object.assign({}, head, { ok: true, via: 'docs', models: models });
      /* The chunk name changes on every deploy; drop the stale hint and rescan. */
      chunkCache.delete(spec.id);
    }

    let html;
    try {
      const response = await fetch(spec.docsChunksPage, {
        method: 'GET',
        headers: { accept: 'text/html', 'user-agent': USER_AGENT },
        signal: timeoutSignal(timeoutMs),
      });
      if (!response.ok) return null;
      html = await response.text();
    } catch (error) {
      return null;
    }

    const urls = [];
    for (const match of html.matchAll(NEXT_CHUNK_HINT)) {
      const url = new URL(match[0], spec.docsChunksPage).href;
      if (!urls.includes(url)) urls.push(url);
    }
    if (urls.length === 0) return null;

    const queue = urls.slice(0, MAX_DOCS_CHUNKS);
    for (let index = 0; index < queue.length; index += 6) {
      const batch = queue.slice(index, index + 6);
      const settled = await Promise.all(
        batch.map((url) => readChunkTable(url).then((models) => ({ url, models })).catch(() => null)),
      );
      for (const item of settled) {
        if (item === null || item.models.length === 0) continue;
        chunkCache.set(spec.id, item.url);
        return Object.assign({}, head, { ok: true, via: 'docs', models: item.models });
      }
    }
    return null;
  }

  /**
   * One provider's catalog read from its documentation index, used when no
   * credential is configured. Returns `null` when the index is unusable so the
   * caller can still try the endpoint anonymously.
   */
  async function readProviderDocs(spec, head) {
    let response;
    try {
      response = await fetch(spec.docsIndex, {
        method: 'GET',
        headers: { accept: 'text/plain, text/markdown;q=0.9, */*;q=0.5', 'user-agent': USER_AGENT },
        signal: timeoutSignal(timeoutMs),
      });
    } catch (error) {
      return null;
    }
    if (!response.ok) return null;
    let text;
    try {
      text = await response.text();
    } catch (error) {
      return null;
    }
    const models = parseDocsIndex(text, spec);
    if (models.length === 0) return null;
    return Object.assign({}, head, { ok: true, via: 'docs', docsIndex: spec.docsIndex, models: models });
  }

  /** One provider's live catalog: GET <baseUrl>/models, normalized and sorted. */
  async function readProviderCatalog(spec) {
    const head = {
      id: spec.id,
      label: spec.label,
      docs: spec.docs,
      consoleUrl: spec.consoleUrl,
      apiKeyEnv: spec.apiKeyEnv,
      source: { apiKeyEnv: spec.apiKeyEnv },
    };
    const key = await resolveRef(spec.apiKeyEnv);
    /* No credential but a published documentation index: read the catalog from
       the docs instead of failing. A key always wins when one exists. */
    if (key === undefined && typeof spec.docsIndex === 'string' && spec.docsIndex.length > 0) {
      const fromDocs = await readProviderDocs(spec, head);
      if (fromDocs !== null) return fromDocs;
    }
    /* No credential but a documentation site whose content is compiled into
       chunks: scan for the model table, so the list is live rather than baked. */
    if (key === undefined && typeof spec.docsChunksPage === 'string' && spec.docsChunksPage.length > 0) {
      const fromChunks = await readProviderChunks(spec, head);
      if (fromChunks !== null) return fromChunks;
    }
    /* No credential and no readable index: a dated static snapshot still answers
       without any network call, which is what lets a shared installation show
       this provider without asking every user for its key. */
    if (key === undefined && Array.isArray(spec.staticModels) && spec.staticModels.length > 0) {
      const models = spec.staticModels
        .filter((model) => model !== null && typeof model === 'object' && typeof model.id === 'string')
        .map((model) => ({
          id: model.id,
          name: typeof model.name === 'string' && model.name.length > 0 ? model.name : model.id,
          contextWindow: null,
        }))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      if (models.length > 0) {
        return Object.assign({}, head, { ok: true, via: 'snapshot', asOf: spec.staticAsOf, models: models });
      }
    }
    /* A catalog can also be public — a gateway may serve `/v1/models` to anyone,
       ignoring the Authorization header entirely. An absent credential
       therefore only drops that header instead of giving up: a catalog that
       really needs one answers 401 below and is reported as such, while a
       public one still renders. Sending another provider's key would leak it. */
    const headers = { accept: 'application/json', 'user-agent': USER_AGENT };
    if (key !== undefined) headers.authorization = `Bearer ${key}`;
    let response;
    try {
      response = await fetch(`${spec.baseUrl}/models`, {
        method: 'GET',
        headers: headers,
        signal: timeoutSignal(timeoutMs),
      });
    } catch (error) {
      const name = error !== null && typeof error === 'object' ? error.name : undefined;
      if (name === 'TimeoutError' || name === 'AbortError') {
        return Object.assign({}, head, { ok: false, code: 'timeout', message: `${timeoutMs} ms` });
      }
      return Object.assign({}, head, { ok: false, code: 'network', message: String((error && error.message) || error) });
    }
    if (response.status === 401 || response.status === 403) {
      /* With no credential configured, the truthful cause is the missing
         credential, not a rejected one: say which ref to fill in. */
      if (key === undefined) {
        return Object.assign({}, head, {
          ok: false,
          code: 'no-credential',
          message: spec.apiKeyEnv === undefined ? 'the catalog needs a credential' : `set ${spec.apiKeyEnv}`,
        });
      }
      return Object.assign({}, head, { ok: false, code: 'unauthorized', message: `HTTP ${response.status}` });
    }
    if (response.status === 429) {
      return Object.assign({}, head, { ok: false, code: 'rate-limited', message: 'HTTP 429' });
    }
    let body = null;
    try {
      body = await response.json();
    } catch (error) {
      return Object.assign({}, head, { ok: false, code: 'upstream', message: `HTTP ${response.status} without JSON` });
    }
    if (!response.ok) {
      return Object.assign({}, head, { ok: false, code: 'upstream', message: `HTTP ${response.status}` });
    }
    const rows = body !== null && typeof body === 'object' && Array.isArray(body.data) ? body.data : [];
    const models = rows
      .filter((row) => row !== null && typeof row === 'object' && typeof row.id === 'string' && row.id.length > 0)
      .map((row) => ({
        id: row.id,
        name: typeof row.name === 'string' && row.name.length > 0 ? row.name : row.id,
        contextWindow: Number.isFinite(row.context_length)
          ? row.context_length
          : Number.isFinite(row.context_window)
            ? row.context_window
            : null,
      }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (models.length === 0) {
      return Object.assign({}, head, { ok: false, code: 'shape', message: 'no recognized rows' });
    }
    return Object.assign({}, head, { ok: true, models: models });
  }

  /** A catalog read retried across transport-only failures, like {@link goJson}. */
  async function readProviderCatalogRetrying(spec) {
    for (let attempt = 1; ; attempt += 1) {
      const answer = await readProviderCatalog(spec);
      if (answer.ok === true || attempt >= READ_ATTEMPTS) return answer;
      if (answer.code !== 'network' && answer.code !== 'timeout') return answer;
      await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS * attempt));
    }
  }

  /** Every configured provider, each answering (or failing) on its own. */
  async function readProviders() {
    const specs = watchSpecs();
    const providers = await Promise.all(
      specs.map((spec) =>
        readProviderCatalogRetrying(spec).catch((error) =>
          Object.assign(
            { id: spec.id, label: spec.label, docs: spec.docs, consoleUrl: spec.consoleUrl, source: { apiKeyEnv: spec.apiKeyEnv } },
            { ok: false, code: 'internal', message: String((error && error.message) || error) },
          ),
        ),
      ),
    );
    return { ok: true, source: source(), fetchedAt: new Date().toISOString(), providers: providers };
  }

  const watchRefreshMs = clampNumber(settings.watchRefreshMs, 60000, 86400000, 900000);

  registerRoute(USAGE_PATH, 'usage', (force) => cached('usage', refreshMs, force, readUsage));
  registerRoute(MODELS_PATH, 'models', (force) => cached('models', infoRefreshMs, force, readModels));
  registerRoute(VERSION_PATH, 'version', (force) => cached('version', infoRefreshMs, force, readVersion));
  registerRoute(PROVIDERS_PATH, 'third-party provider catalogs', (force) => cached('providers', watchRefreshMs, force, readProviders));
  registerAction(SYNC_PATH, 'regenerate the auto-managed model routes', (req) =>
    syncModels(typeof req?.url === 'string' && req.url.indexOf('force=1') !== -1),
  );
}
