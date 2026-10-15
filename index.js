/**
 * Host half of the OpenCode Go quota bundle.
 *
 * The Go plan (https://opencode.ai/docs/go) meters usage with three rolling
 * dollar allowances: a 5-hour window at 20% of the monthly limit, a weekly one
 * at 50%, and the month itself at 100%. A Go API key can read all three from
 * `GET <baseUrl>/usage`, which answers:
 *
 *   { "usage": { "rolling":   { "status": "ok", "percent": 1,
 *                               "resetsAt": "2026-10-15T06:23:06.000Z" },
 *                "weekly":    { ... }, "monthly": { ... } } }
 *
 * This half resolves the key through `ctx.credentials`, calls that endpoint,
 * normalizes the answer, and serves it to the page from one same-origin exact
 * route. Only percentages and reset instants cross to the browser: the key is
 * never serialized into a response.
 *
 * The Client half (`client.js`) is the only consumer, and it polls; the Host
 * therefore caches each answer for `refreshMs` and collapses concurrent reads
 * into one upstream request.
 */

/** Default Go inference base URL; `/usage` is appended. */
const DEFAULT_BASE_URL = 'https://opencode.ai/zen/go/v1';
/** Default environment-variable name the profile stores the Go key under. */
const DEFAULT_API_KEY_ENV = 'OPENCODE_GO_API_KEY';
/** Same-origin exact route the Client half reads. */
const ROUTE_PATH = '/opencode-go-quota/usage';
/** Attribution header, so OpenCode can tell this client apart from a bare SDK. */
const USER_AGENT = 'dsh-opencode-go-quota/1.0.0';

/** The three metered windows, in the order the popover lists them. */
const WINDOW_IDS = ['rolling', 'weekly', 'monthly'];

/** Substrings that identify a `windows[]` entry from the alternate response shape. */
const WINDOW_MATCHERS = {
  rolling: ['rolling', '5-hour', '5 hour', '5h', 'session'],
  weekly: ['weekly', 'week'],
  monthly: ['monthly', 'month'],
};

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
    const needles = WINDOW_MATCHERS[id];
    for (const needle of needles) {
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
 * Normalize an upstream body into the three known windows.
 *
 * Two shapes are accepted: the live `{ usage: { rolling, weekly, monthly } }`
 * map, and the `{ plan, windows: [{ name, usagePercent, resetInSec, ... }] }`
 * list. Unknown entries are dropped rather than guessed at, and a window the
 * upstream omitted stays absent so the page can say so instead of inventing 0%.
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

/** Without a Web server there is nothing to serve the Client half; stay inert. */
export const inject = ['webServer'];

/** Mount the usage route; the Client half owns every rendered artifact. */
export function apply(ctx, config) {
  const settings = config !== null && typeof config === 'object' ? config : {};
  const baseUrl = String(settings.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/u, '');
  const apiKeyEnv = String(settings.apiKeyEnv ?? DEFAULT_API_KEY_ENV);
  const refreshMs = clampNumber(settings.refreshMs, 5000, 3600000, 60000);
  const timeoutMs = clampNumber(settings.timeoutMs, 1000, 120000, 15000);

  /** Last successful-or-failed answer, so a poll never repeats an upstream call. */
  let cached = null;
  /** In-flight read, so concurrent polls collapse into one upstream request. */
  let inflight = null;

  const source = () => ({ baseUrl: baseUrl, apiKeyEnv: apiKeyEnv });

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

  /** One upstream read, already normalized into the page's payload shape. */
  async function readUpstream() {
    const key = await resolveApiKey();
    if (key === undefined) {
      return { ok: false, code: 'no-credential', message: `no credential is configured for ${apiKeyEnv}`, source: source() };
    }
    let response;
    try {
      response = await fetch(`${baseUrl}/usage`, {
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
        return { ok: false, code: 'timeout', message: `no answer within ${timeoutMs} ms`, source: source() };
      }
      return { ok: false, code: 'network', message: String((error && error.message) || error), source: source() };
    }

    if (response.status === 401 || response.status === 403) {
      return { ok: false, code: 'unauthorized', message: `the Go key was rejected (HTTP ${response.status})`, source: source() };
    }
    if (response.status === 429) {
      return { ok: false, code: 'rate-limited', message: 'the usage endpoint asked us to slow down (HTTP 429)', source: source() };
    }
    let body;
    try {
      body = await response.json();
    } catch (error) {
      return { ok: false, code: 'upstream', message: `HTTP ${response.status} with no JSON body`, source: source() };
    }
    if (!response.ok) {
      const detail = body !== null && typeof body === 'object' && typeof body.error === 'string' ? `: ${body.error}` : '';
      return { ok: false, code: 'upstream', message: `HTTP ${response.status}${detail}`, source: source() };
    }

    const windows = extractWindows(body);
    if (windows.length === 0) {
      return { ok: false, code: 'shape', message: 'the usage endpoint returned no recognized window', source: source() };
    }
    return {
      ok: true,
      source: source(),
      plan: typeof body.plan === 'string' ? body.plan : null,
      useBalance: typeof body.useBalance === 'boolean' ? body.useBalance : null,
      fetchedAt: new Date().toISOString(),
      windows: windows,
    };
  }

  /** The cached answer, refreshed only when it has aged past `refreshMs`. */
  async function readUsage() {
    const now = Date.now();
    if (cached !== null && now - cached.at < refreshMs) return cached.payload;
    if (inflight !== null) return inflight;
    inflight = (async () => {
      try {
        const payload = await readUpstream();
        cached = { at: Date.now(), payload: payload };
        return payload;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ROUTE_PATH,
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
          let payload;
          try {
            payload = await readUsage();
          } catch (error) {
            payload = { ok: false, code: 'internal', message: String((error && error.message) || error), source: source() };
          }
          sendJson(res, 200, payload, req.method === 'HEAD');
        },
      }),
    `opencode-go-quota: GET ${ROUTE_PATH}`,
  );
}
