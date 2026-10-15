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

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Default Go inference base URL; endpoint paths are appended. */
const DEFAULT_BASE_URL = 'https://opencode.ai/zen/go/v1';
/** Default environment-variable name the profile stores the Go key under. */
const DEFAULT_API_KEY_ENV = 'OPENCODE_GO_API_KEY';
/** Same-origin routes the Client half reads. */
const ROUTE_PREFIX = '/opencode-go-quota';
const USAGE_PATH = `${ROUTE_PREFIX}/usage`;
const MODELS_PATH = `${ROUTE_PREFIX}/models`;
const VERSION_PATH = `${ROUTE_PREFIX}/version`;
/** Attribution header, so upstream can tell this client from a bare SDK. */
const USER_AGENT = 'dsh-opencode-go-quota/1.1.0';

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

  const source = () => ({ baseUrl: baseUrl, apiKeyEnv: apiKeyEnv });

  /** Serve `producer()` through a TTL cache; `force` skips a fresh-enough entry. */
  async function cached(key, ttlMs, force, producer) {
    const hit = cache.get(key);
    const now = Date.now();
    if (force !== true && hit !== undefined && hit.payload !== null && now - hit.at < ttlMs) return hit.payload;
    if (hit !== undefined && hit.inflight !== undefined) return hit.inflight;
    const inflight = (async () => {
      try {
        const payload = await producer();
        cache.set(key, { at: Date.now(), payload: payload });
        return payload;
      } catch (error) {
        const entry = cache.get(key);
        if (entry !== undefined) entry.inflight = undefined;
        throw error;
      }
    })();
    cache.set(key, { at: hit === undefined ? 0 : hit.at, payload: hit === undefined ? null : hit.payload, inflight: inflight });
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

  /** One authenticated JSON read against the Go API. */
  async function goJson(path, what) {
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
    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      current: current,
      channels: channels,
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

  registerRoute(USAGE_PATH, 'usage', (force) => cached('usage', refreshMs, force, readUsage));
  registerRoute(MODELS_PATH, 'models', (force) => cached('models', infoRefreshMs, force, readModels));
  registerRoute(VERSION_PATH, 'version', (force) => cached('version', infoRefreshMs, force, readVersion));
}
