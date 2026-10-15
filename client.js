/**
 * Client half of the OpenCode Go bundle.
 *
 * Registers three entries in `sidebar.footer.action`, the seat beside Settings
 * at the sidebar foot, left to right:
 *
 *   [▮▮▮ 14%]   Go plan meters — three mini bars (5-hour / weekly / monthly),
 *               the highest share beside them when the column renders wide, and
 *               a hover popover with a bar, the remaining share and a live reset
 *               countdown per window.
 *   [◫ 37]      the OpenCode mark — a click popover comparing the live model
 *               catalog against the published documentation and against the
 *               previous visit's snapshot.
 *   [Ver •]     the running Harness version against published releases, with
 *               the bilingual changelog of everything newer than it.
 *
 * Every number comes from the Host half's same-origin routes, never from a model
 * call or a session projection: this is ambient process state, not session
 * state. Visible copy goes through the Client locale service under the
 * `opencode-go-quota` namespace.
 *
 * The views are pure functions of an explicit render state, so each drawing
 * path is inspectable without a live Host route; the cells own the polling,
 * the popover lifecycle, and the snapshot that makes the model diff meaningful.
 */
window.__ModuleLoader__.load({
  id: '@local/opencode-go-quota',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Dictionary namespace this bundle owns. */
    const NS = 'opencode-go-quota';
    /** Host routes serving the normalized payloads. */
    const USAGE_ROUTE = '/opencode-go-quota/usage';
    const MODELS_ROUTE = '/opencode-go-quota/models';
    const VERSION_ROUTE = '/opencode-go-quota/version';
    /** How often the page re-reads the meters; the Host caches behind it. */
    const POLL_MS = 60000;
    /** Countdown refresh cadence. */
    const TICK_MS = 30000;
    /** How long a catalog or version answer stays good in the page. */
    const INFO_TTL_MS = 900000;
    /** A popover re-reads its route on open once its answer is older than this. */
    const REOPEN_REFRESH_MS = 60000;
    /** Popover widths, before viewport clamping. */
    const QUOTA_WIDTH = 268;
    const MODELS_WIDTH = 320;
    const VERSION_WIDTH = 344;
    /** Where the previous visit's model snapshot lives. */
    const SNAPSHOT_KEY = 'opencode-go-quota:models:v1';
    /** The three metered windows, in display order. */
    const WINDOW_KEYS = [
      { id: 'rolling', label: 'window5h' },
      { id: 'weekly', label: 'windowWeekly' },
      { id: 'monthly', label: 'windowMonthly' },
    ];

    /** English fallback, so a missing locale face never blanks the control. */
    const FALLBACK = {
      title: 'OpenCode Go usage',
      window5h: '5-hour',
      windowWeekly: 'Weekly',
      windowMonthly: 'Monthly',
      resetIn: 'resets in {time}',
      remaining: '{percent}% left',
      loading: 'Reading…',
      noData: 'No data yet',
      updatedAt: 'updated {time}',
      checkedAt: 'checked {time}',
      footer: 'Go plan · opencode.ai/console',
      modelsFooter: 'opencode.ai/docs/go · model catalog',
      versionFooter: 'npm @deepseek-ai/dsh · github releases',
      retryHint: 'The Host could not reach the source.',
      errNoCredential: 'No credential is configured for {env}.',
      errUnauthorized: 'The Go API key was rejected.',
      errRateLimited: 'The source asked us to slow down.',
      errTimeout: 'The source did not answer in time.',
      errNetwork: 'The source is unreachable: {detail}',
      errUpstream: 'The source answered {status}.',
      errRegistry: 'The npm registry could not be read: {detail}',
      errReleases: 'The release feed could not be read: {detail}',
      errShape: 'The source returned an unrecognized shape.',
      errInternal: 'The Host failed while reading.',
      expired: 'any moment now',
      lessThanMin: 'under a minute',
      min: '{m} min',
      hourMin: '{h} h {m} min',
      dayHour: '{d} d {h} h',
      hint: '5-hour {a}% · weekly {b}% · monthly {c}%',
      modelsTitle: 'OpenCode Go models',
      modelsHint: 'Model catalog and what changed',
      modelsCount: '{n} models',
      docsSection: 'Not in the docs',
      docsBaseline: 'baseline {date} · {n} documented',
      docsNone: 'The catalog matches the docs',
      docsMissing: 'Documented but absent: {ids}',
      sinceSection: 'Since your last look',
      sinceFirst: 'Baseline recorded ({n} models). Additions and removals will show up here.',
      sinceAt: 'snapshot {time}',
      sinceNone: 'No additions or removals',
      allSection: 'All models',
      versionTitle: 'DSH version',
      versionHint: 'Check for updates',
      verCurrent: 'Current',
      verLatest: 'Latest',
      verUnknown: 'unknown (installation not found)',
      verUpdateYes: 'update available',
      verUpdateNo: 'up to date',
      verNewer: '{n} releases newer than this build',
      verNone: 'Nothing published is newer than this build',
      verChannelBeyond: 'newer than latest',
      verRegistryFail: 'npm versions unreadable',
      verReleasesFail: 'release notes unreadable',
      verChanges: 'What changed',
      verNoNotes: '(no notes published)',
    };

    /** Dictionaries registered into the Client locale service under `NS`. */
    const COPY = {
      zh: {
        title: 'OpenCode Go 用量',
        window5h: '时段（5 小时）',
        windowWeekly: '本周',
        windowMonthly: '本月',
        resetIn: '{time}后重置',
        remaining: '剩余 {percent}%',
        loading: '读取中…',
        noData: '暂无数据',
        updatedAt: '{time} 更新',
        checkedAt: '{time} 检查',
        footer: 'Go 套餐 · opencode.ai/console',
        modelsFooter: 'opencode.ai/docs/go · 模型目录',
        versionFooter: 'npm @deepseek-ai/dsh · github releases',
        retryHint: 'Host 未能读取数据源。',
        errNoCredential: '没有为 {env} 配置凭据。',
        errUnauthorized: 'Go API Key 被拒绝。',
        errRateLimited: '数据源要求降低请求频率。',
        errTimeout: '数据源超时未响应。',
        errNetwork: '无法连接数据源：{detail}',
        errUpstream: '数据源返回 {status}。',
        errRegistry: '读不到 npm 版本：{detail}',
        errReleases: '读不到更新说明：{detail}',
        errShape: '数据源返回了无法识别的格式。',
        errInternal: 'Host 读取时出错。',
        expired: '即将重置',
        lessThanMin: '不到 1 分钟',
        min: '{m} 分钟',
        hourMin: '{h} 小时 {m} 分',
        dayHour: '{d} 天 {h} 小时',
        hint: '时段 {a}% · 本周 {b}% · 本月 {c}%',
        modelsTitle: 'OpenCode Go 模型',
        modelsHint: '模型目录，以及更新了哪些模型',
        modelsCount: '{n} 个模型',
        docsSection: '官方文档未列出',
        docsBaseline: '基准 {date} · 文档 {n} 个',
        docsNone: '接口与文档一致',
        docsMissing: '文档有、接口没有：{ids}',
        sinceSection: '自上次查看',
        sinceFirst: '已记录基线（{n} 个模型），之后新增或下架的会出现在这里。',
        sinceAt: '基线 {time}',
        sinceNone: '没有新增或下架',
        allSection: '全部模型',
        versionTitle: 'DSH 版本',
        versionHint: '检查更新',
        verCurrent: '当前',
        verLatest: '最新',
        verUnknown: '未知（找不到安装位置）',
        verUpdateYes: '有新版本',
        verUpdateNo: '已是最新',
        verNewer: '比当前新的版本 {n} 个',
        verNone: '当前版本已是最新发布',
        verChannelBeyond: '晚于 latest',
        verRegistryFail: '读不到 npm 版本',
        verReleasesFail: '读不到更新说明',
        verChanges: '更新内容',
        verNoNotes: '（该版本没有发布说明）',
      },
      en: FALLBACK,
    };

    const CSS = [
      '.dshogq-wrap{display:inline-flex;align-items:center;position:relative;flex:0 0 auto;}',
      '.dshogq-cell{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 7px;border-radius:8px;',
      'border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;',
      'font-size:11px;line-height:1;font-variant-numeric:tabular-nums;cursor:pointer;}',
      '.dshogq-cell:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.dshogq-cell[data-open="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.dshogq-cell:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.dshogq-bars{display:flex;align-items:stretch;gap:2px;height:15px;}',
      '.dshogq-bar{position:relative;width:3px;border-radius:2px;background:var(--dsw-alias-border-l1);overflow:hidden;}',
      '.dshogq-bar>i{position:absolute;left:0;right:0;bottom:0;display:block;border-radius:2px;',
      'background:var(--dsw-alias-state-idle-primary);transition:height .25s ease;}',
      '.dshogq-bar[data-level="normal"]>i{background:var(--dsw-alias-brand-primary);}',
      '.dshogq-bar[data-level="warn"]>i{background:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-bar[data-level="critical"]>i,.dshogq-bar[data-level="blocked"]>i{background:var(--dsw-alias-state-error-primary);}',
      '.dshogq-pct{font-weight:600;font-size:11px;}',
      '.dshogq-pct[data-level="normal"]{color:var(--dsw-alias-brand-primary);}',
      '.dshogq-pct[data-level="warn"]{color:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-pct[data-level="critical"],.dshogq-pct[data-level="blocked"]{color:var(--dsw-alias-state-error-primary);}',
      '.dshogq-celltext{font-weight:600;font-size:11px;letter-spacing:.02em;}',
      '.dshogq-marksvg{display:block;}',
      '.dshogq-badge{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-warn-primary);',
      'margin-left:1px;flex:0 0 auto;}',
      '.dshogq-pop{position:fixed;z-index:2147483000;box-sizing:border-box;padding:11px 12px 10px;border-radius:12px;',
      'background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);',
      'box-shadow:0 14px 34px rgba(0,0,0,.3);font-size:12px;line-height:1.45;}',
      '.dshogq-head{display:flex;align-items:baseline;gap:8px;}',
      '.dshogq-title{font-weight:600;font-size:12.5px;}',
      '.dshogq-updated{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-secondary);}',
      '.dshogq-rows{margin-top:6px;}',
      '.dshogq-row{padding:7px 0;display:flex;flex-direction:column;gap:6px;}',
      '.dshogq-row+.dshogq-row{border-top:1px solid var(--dsw-alias-border-l1);}',
      '.dshogq-rowhead{display:flex;align-items:baseline;gap:8px;}',
      '.dshogq-rowlabel{font-size:12px;font-weight:500;}',
      '.dshogq-rowpct{margin-left:auto;font-weight:600;font-variant-numeric:tabular-nums;}',
      '.dshogq-rowpct[data-level="normal"]{color:var(--dsw-alias-brand-primary);}',
      '.dshogq-rowpct[data-level="warn"]{color:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-rowpct[data-level="critical"],.dshogq-rowpct[data-level="blocked"]{color:var(--dsw-alias-state-error-primary);}',
      '.dshogq-rowpct[data-level="idle"]{color:var(--dsw-alias-label-secondary);}',
      '.dshogq-track{position:relative;height:5px;border-radius:99px;background:var(--dsw-alias-bg-layer-2);',
      'border:1px solid var(--dsw-alias-border-l1);overflow:hidden;}',
      '.dshogq-fill{position:absolute;top:0;bottom:0;left:0;border-radius:99px;background:var(--dsw-alias-state-idle-primary);',
      'transition:width .25s ease;}',
      '.dshogq-fill[data-level="normal"]{background:var(--dsw-alias-brand-primary);}',
      '.dshogq-fill[data-level="warn"]{background:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-fill[data-level="critical"],.dshogq-fill[data-level="blocked"]{background:var(--dsw-alias-state-error-primary);}',
      '.dshogq-sub{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--dsw-alias-label-secondary);}',
      '.dshogq-msg{padding:6px 0 2px;font-size:11.5px;color:var(--dsw-alias-state-error-primary);word-break:break-word;}',
      '.dshogq-note{padding:6px 0 2px;font-size:11.5px;color:var(--dsw-alias-label-secondary);}',
      '.dshogq-foot{margin-top:8px;padding-top:7px;border-top:1px solid var(--dsw-alias-border-l1);font-size:10.5px;',
      'color:var(--dsw-alias-label-secondary);}',
      '.dshogq-sect{margin-top:9px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1);}',
      '.dshogq-secttitle{display:flex;align-items:baseline;gap:8px;font-size:10.5px;font-weight:600;letter-spacing:.04em;',
      'text-transform:uppercase;color:var(--dsw-alias-label-secondary);}',
      '.dshogq-count{margin-left:auto;font-variant-numeric:tabular-nums;text-transform:none;letter-spacing:0;}',
      '.dshogq-ids{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;}',
      '.dshogq-id{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;padding:2px 6px;',
      'border-radius:6px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);',
      'color:var(--dsw-alias-label-primary);line-height:1.4;}',
      '.dshogq-id[data-tone="new"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);}',
      '.dshogq-id[data-tone="gone"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);',
      'text-decoration:line-through;}',
      '.dshogq-scroll{max-height:min(46vh,360px);overflow:auto;margin-top:2px;padding-right:2px;}',
      '.dshogq-kv{display:flex;align-items:baseline;gap:8px;padding:4px 0;font-size:12px;}',
      '.dshogq-kv+.dshogq-kv{border-top:1px solid var(--dsw-alias-border-l1);}',
      '.dshogq-kvlabel{color:var(--dsw-alias-label-secondary);min-width:52px;}',
      '.dshogq-kvvalue{margin-left:auto;font-weight:600;font-variant-numeric:tabular-nums;}',
      '.dshogq-ver{padding:8px 0 6px;}',
      '.dshogq-ver+.dshogq-ver{border-top:1px solid var(--dsw-alias-border-l1);}',
      '.dshogq-verhead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}',
      '.dshogq-vertag{font-weight:600;font-size:12px;font-variant-numeric:tabular-nums;}',
      '.dshogq-verdate{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-secondary);}',
      '.dshogq-chip{font-size:10px;padding:1px 6px;border-radius:99px;border:1px solid var(--dsw-alias-border-l1);',
      'color:var(--dsw-alias-label-secondary);line-height:1.5;}',
      '.dshogq-chip[data-tone="ok"]{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary);}',
      '.dshogq-chip[data-tone="warn"]{border-color:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-log{display:flex;flex-direction:column;gap:2px;margin-top:5px;}',
      '.dshogq-logheading{font-size:11px;font-weight:600;margin-top:5px;}',
      '.dshogq-logitem{font-size:11px;color:var(--dsw-alias-label-secondary);padding-left:11px;position:relative;',
      'word-break:break-word;}',
      '.dshogq-logitem::before{content:"·";position:absolute;left:2px;}',
      '.dshogq-logtext{font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-word;}',
    ].join('');

    /** Substitute `{name}` placeholders without depending on the translator's signature. */
    function fill(template, params) {
      let out = String(template);
      if (params === undefined || params === null) return out;
      for (const name of Object.keys(params)) out = out.split('{' + name + '}').join(String(params[name]));
      return out;
    }

    /** Coerce a payload percentage into `[0, 100]`. */
    function percentOf(window) {
      const value = window !== undefined && window !== null ? window.percent : undefined;
      const parsed = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(parsed)) return 0;
      return Math.min(100, Math.max(0, parsed));
    }

    /** Severity bucket that decides every colour the meter control draws. */
    function levelOf(window) {
      if (window === undefined || window === null) return 'idle';
      if (typeof window.status === 'string' && window.status.length > 0 && window.status !== 'ok') return 'blocked';
      const percent = percentOf(window);
      if (percent >= 90) return 'critical';
      if (percent >= 70) return 'warn';
      return 'normal';
    }

    /** Displayed share: whole numbers, so the cell never jitters on decimals. */
    function displayPercent(window) {
      return Math.round(percentOf(window));
    }

    /** Index a payload's windows by id; unknown ids are simply carried along. */
    function windowsById(state) {
      const map = {};
      const payload = state !== null && typeof state === 'object' ? state.payload : null;
      const list = payload !== null && Array.isArray(payload.windows) ? payload.windows : [];
      for (const window of list) {
        if (window !== null && typeof window === 'object' && typeof window.id === 'string') map[window.id] = window;
      }
      return map;
    }

    /** `HH:MM` of an instant, deterministic across locales. */
    function clockTime(iso) {
      const date = new Date(iso);
      if (!Number.isFinite(date.getTime())) return '';
      const pad = (value) => (value < 10 ? `0${value}` : String(value));
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    /** `YYYY-MM-DD` of an instant, deterministic across locales. */
    function dayStamp(iso) {
      const date = new Date(iso);
      if (!Number.isFinite(date.getTime())) return '';
      const pad = (value) => (value < 10 ? `0${value}` : String(value));
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    /** Coarse remaining time, matching the popover's one-line budget. */
    function countdown(iso, t) {
      const date = new Date(iso);
      if (!Number.isFinite(date.getTime())) return '';
      const remaining = date.getTime() - Date.now();
      if (remaining <= 0) return t('expired');
      const minutes = Math.floor(remaining / 60000);
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      const rest = minutes % 60;
      if (days > 0) return fill(t('dayHour'), { d: days, h: hours });
      if (hours > 0) return fill(t('hourMin'), { h: hours, m: rest });
      if (rest > 0) return fill(t('min'), { m: rest });
      return t('lessThanMin');
    }

    /** One-line copy for a Host payload that carries an error code. */
    function messageFor(payload, t) {
      const code = payload !== null && typeof payload === 'object' ? payload.code : undefined;
      const source = payload !== null && typeof payload === 'object' ? payload.source : null;
      const env = source !== null && typeof source === 'object' ? source.apiKeyEnv : undefined;
      const detail = payload !== null && typeof payload === 'object' ? String(payload.message ?? '') : '';
      switch (code) {
        case 'no-credential':
          return fill(t('errNoCredential'), { env: env === undefined ? 'OPENCODE_GO_API_KEY' : env });
        case 'unauthorized':
          return t('errUnauthorized');
        case 'rate-limited':
          return t('errRateLimited');
        case 'timeout':
          return t('errTimeout');
        case 'network':
          return fill(t('errNetwork'), { detail: detail });
        case 'upstream':
          return fill(t('errUpstream'), { status: detail });
        case 'registry':
          return fill(t('errRegistry'), { detail: detail });
        case 'releases':
          return fill(t('errReleases'), { detail: detail });
        case 'shape':
          return t('errShape');
        default:
          return t('errInternal');
      }
    }

    /** The shared "this payload failed" line, used by every popover. */
    function failureLine(state, t) {
      const payload = state.payload;
      const structured = payload !== null && typeof payload === 'object' && typeof payload.ok === 'boolean';
      if (structured) return messageFor(payload, t);
      return `${t('retryHint')} ${String(state.message ?? '')}`.trim();
    }

    /** Strip the little HTML and markdown the release feed writes. */
    function flatten(text) {
      return String(text)
        .replace(/<[^>]*>/g, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*`]/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    /**
     * Reduce one release body to lines for the active locale.
     *
     * The feed writes both languages into one body, each under its own anchor
     * heading, so the reader's half is selected first and flattened after. A
     * body without those anchors is flattened whole rather than dropped.
     */
    function releaseLines(body, locale) {
      if (typeof body !== 'string' || body.length === 0) return [];
      let text = body;
      const zhIndex = text.search(/<h3[^>]*id="cn-/i);
      const enIndex = text.search(/<h3[^>]*id="en-/i);
      if (zhIndex !== -1 && enIndex !== -1 && enIndex > zhIndex) {
        text = locale === 'zh' ? text.slice(zhIndex, enIndex) : text.slice(enIndex);
      }
      const lines = [];
      for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line.length === 0) continue;
        if (/^\[[^\]]*\]\(#[^)]*\)\s*\|/.test(line)) continue;
        const tagHeading = /^<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>$/i.exec(line);
        const mdHeading = /^(#{2,6})\s+(.*)$/.exec(line);
        if (tagHeading !== null) {
          const label = flatten(tagHeading[1]);
          if (label.length > 0) lines.push({ kind: 'heading', text: label });
          continue;
        }
        if (mdHeading !== null) {
          const label = flatten(mdHeading[2]);
          if (label.length > 0) lines.push({ kind: 'heading', text: label });
          continue;
        }
        if (/^[-*+]\s+/.test(line)) {
          lines.push({ kind: 'item', text: flatten(line.replace(/^[-*+]\s+/, '')) });
          continue;
        }
        const plain = flatten(line);
        if (plain.length > 0) lines.push({ kind: 'text', text: plain });
      }
      return lines;
    }

    /** The previous visit's model snapshot, or `null` on a first look. */
    function readSnapshot() {
      try {
        const raw = window.localStorage.getItem(SNAPSHOT_KEY);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.ids)) return null;
        const ids = parsed.ids.filter((id) => typeof id === 'string');
        if (ids.length === 0) return null;
        return { at: typeof parsed.at === 'string' ? parsed.at : null, ids: ids };
      } catch (error) {
        return null;
      }
    }

    /** Record the catalog this visit saw; a failed write only weakens next visit's diff. */
    function writeSnapshot(ids) {
      try {
        window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ at: new Date().toISOString(), ids: ids }));
      } catch (error) {
        /* private mode or quota exhausted: the diff degrades to "first look" */
      }
    }

    /** Place a popover above its cell, clamped to the viewport. */
    function usePopoverPosition(open, anchorRef, wide, width) {
      const [position, setPosition] = React.useState(null);
      React.useEffect(() => {
        if (!open) {
          setPosition(null);
          return undefined;
        }
        const place = () => {
          const node = anchorRef.current;
          if (node === null || node === undefined) return;
          const rect = node.getBoundingClientRect();
          const clamped = Math.min(width, Math.max(200, window.innerWidth - 16));
          const left = wide ? rect.left : rect.right + 8;
          setPosition({
            width: clamped,
            left: Math.max(8, Math.min(left, window.innerWidth - clamped - 8)),
            bottom: Math.max(8, window.innerHeight - rect.top + 8),
          });
        };
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => {
          window.removeEventListener('resize', place);
          window.removeEventListener('scroll', place, true);
        };
      }, [open, anchorRef, wide, width]);
      return position;
    }

    /** The popover surface every cell shares: chrome, title, footer, placement. */
    function PopoverBox(props) {
      const position = props.position;
      const placement =
        position !== null && typeof position === 'object'
          ? { left: position.left, bottom: position.bottom, width: position.width }
          : { left: 0, bottom: 0, width: props.width, visibility: 'hidden' };
      return h(
        'div',
        { className: 'dshogq-pop', role: 'group', 'aria-label': props.title, style: placement },
        h(
          'div',
          { className: 'dshogq-head' },
          h('span', { className: 'dshogq-title' }, props.title),
          props.subtitle === null || props.subtitle === undefined
            ? null
            : h('span', { className: 'dshogq-updated' }, props.subtitle),
        ),
        props.children,
        props.footer === null || props.footer === undefined ? null : h('div', { className: 'dshogq-foot' }, props.footer),
      );
    }

    /**
     * One cell in the sidebar foot: a button plus the popover it opens.
     *
     * `mode` decides how it opens — 'hover' for the ambient meter reading that
     * should not need a click, 'click' for the two inspectors whose content is
     * too tall to appear under a passing pointer.
     */
    function CellShell(props) {
      const wide = props.wide === true;
      const hover = props.mode === 'hover';
      const [open, setOpen] = React.useState(false);
      const anchorRef = React.useRef(null);
      const closeTimer = React.useRef(0);
      const position = usePopoverPosition(open, anchorRef, wide, props.width);

      const cancelClose = () => {
        if (closeTimer.current) {
          window.clearTimeout(closeTimer.current);
          closeTimer.current = 0;
        }
      };
      const openNow = () => {
        cancelClose();
        setOpen(true);
        if (typeof props.onOpen === 'function') props.onOpen();
      };
      const closeSoon = () => {
        cancelClose();
        closeTimer.current = window.setTimeout(() => {
          closeTimer.current = 0;
          setOpen(false);
        }, 140);
      };
      const closeNow = () => {
        cancelClose();
        setOpen(false);
      };

      React.useEffect(() => cancelClose, []);

      React.useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') closeNow();
        };
        const onPointer = (event) => {
          const node = anchorRef.current;
          if (node !== null && node !== undefined && !node.contains(event.target)) closeNow();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        return () => {
          document.removeEventListener('keydown', onKey);
          document.removeEventListener('pointerdown', onPointer);
        };
      }, [open]);

      return h(
        'span',
        {
          className: 'dshogq-wrap',
          ref: anchorRef,
          onMouseEnter: hover ? openNow : undefined,
          onMouseLeave: hover ? closeSoon : undefined,
        },
        h(
          'button',
          {
            type: 'button',
            className: 'dshogq-cell',
            'data-open': open ? 'true' : 'false',
            'aria-expanded': open,
            'aria-label': props.title,
            title: open ? undefined : props.hint,
            onFocus: hover ? openNow : undefined,
            onBlur: hover ? closeSoon : undefined,
            onClick: () => (open ? closeNow() : openNow()),
          },
          props.glyph,
          props.label === null || props.label === undefined
            ? null
            : h('span', { className: 'dshogq-celltext' }, props.label),
          props.badge === true ? h('span', { className: 'dshogq-badge', 'aria-hidden': true }) : null,
        ),
        open && typeof props.renderPopover === 'function' ? props.renderPopover(position) : null,
      );
    }

    /** The three stacked mini bars: the always-visible part of the meter cell. */
    function miniBars(byId) {
      return h(
        'span',
        { className: 'dshogq-bars', 'aria-hidden': 'true' },
        WINDOW_KEYS.map((key) => {
          const window = byId[key.id];
          return h(
            'span',
            { className: 'dshogq-bar', key: key.id, 'data-level': levelOf(window) },
            h('i', { style: { height: `${percentOf(window)}%` } }),
          );
        }),
      );
    }

    /** One window row: label, share, a usage bar, and a live reset countdown. */
    function windowRow(key, window, t) {
      const level = levelOf(window);
      const percent = displayPercent(window);
      return h(
        'div',
        { className: 'dshogq-row', key: key.id },
        h(
          'div',
          { className: 'dshogq-rowhead' },
          h('span', { className: 'dshogq-rowlabel' }, t(key.label)),
          h('span', { className: 'dshogq-rowpct', 'data-level': level }, `${percent}%`),
        ),
        h(
          'div',
          { className: 'dshogq-track' },
          h('span', { className: 'dshogq-fill', 'data-level': level, style: { width: `${percentOf(window)}%` } }),
        ),
        h(
          'div',
          { className: 'dshogq-sub' },
          h('span', null, fill(t('resetIn'), { time: countdown(window.resetsAt, t) })),
          h('span', null, fill(t('remaining'), { percent: Math.max(0, 100 - percent) })),
        ),
      );
    }

    /** The OpenCode mark, drawn in `currentColor` so it follows the theme. */
    function OpenCodeMark(props) {
      const height = props && props.height ? props.height : 16;
      return h(
        'svg',
        {
          className: 'dshogq-marksvg',
          width: Math.round(height * 0.8),
          height: height,
          viewBox: '128 96 256 320',
          'aria-hidden': true,
        },
        h('path', { d: 'M320 224V352H192V224H320Z', fill: 'currentColor', opacity: 0.45 }),
        h('path', {
          d: 'M384 416H128V96H384V416ZM320 160H192V352H320V160Z',
          fill: 'currentColor',
          fillRule: 'evenodd',
          clipRule: 'evenodd',
        }),
      );
    }

    /** A tiny tag glyph for the version cell. */
    function VersionGlyph() {
      return h(
        'svg',
        { className: 'dshogq-marksvg', width: 14, height: 14, viewBox: '0 0 16 16', 'aria-hidden': true },
        h('path', {
          d: 'M2 2.75A.75.75 0 0 1 2.75 2h4.19c.2 0 .39.08.53.22l6.06 6.06a.75.75 0 0 1 0 1.06l-4.19 4.19a.75.75 0 0 1-1.06 0L2.22 7.47A.75.75 0 0 1 2 6.94Zm2.5 2.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
          fill: 'currentColor',
        }),
      );
    }

    /** Poll the meter route while the page is visible, plus a countdown heartbeat. */
    function useQuota() {
      const [state, setState] = React.useState({ phase: 'loading', payload: null, message: '' });
      const [, setTick] = React.useState(0);

      React.useEffect(() => {
        let alive = true;
        let controller = null;
        const load = async () => {
          if (controller !== null) controller.abort();
          controller = new AbortController();
          try {
            const response = await fetch(USAGE_ROUTE, { headers: { accept: 'application/json' }, signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (!alive) return;
            setState(
              payload !== null && typeof payload === 'object' && payload.ok === true && Array.isArray(payload.windows)
                ? { phase: 'ready', payload: payload, message: '' }
                : { phase: 'error', payload: payload !== null && typeof payload === 'object' ? payload : null, message: '' },
            );
          } catch (error) {
            if (!alive || (error !== null && typeof error === 'object' && error.name === 'AbortError')) return;
            setState({ phase: 'error', payload: null, message: String((error && error.message) || error) });
          }
        };
        const onVisibility = () => {
          if (!document.hidden) load();
        };

        load();
        const poll = window.setInterval(() => {
          if (!document.hidden) load();
        }, POLL_MS);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
          alive = false;
          window.clearInterval(poll);
          document.removeEventListener('visibilitychange', onVisibility);
          if (controller !== null) controller.abort();
        };
      }, []);

      React.useEffect(() => {
        const timer = window.setInterval(() => setTick((value) => value + 1), TICK_MS);
        return () => window.clearInterval(timer);
      }, []);

      return state;
    }

    /**
     * Read a slow-moving Host route once per `ttlMs` and share it between every
     * component that asks for the same path — a page load costs one read, and
     * reopening a popover inside the window costs none.
     */
    const RESOURCE_CACHE = new Map();

    function useRemote(path, ttlMs) {
      const read = () => {
        const hit = RESOURCE_CACHE.get(path);
        return hit !== undefined && Date.now() - hit.at < ttlMs
          ? { state: hit.state, at: hit.at }
          : { state: { phase: 'loading', payload: null, message: '' }, at: 0 };
      };
      const [entry, setEntry] = React.useState(read);
      const [nonce, setNonce] = React.useState(0);

      React.useEffect(() => {
        const hit = RESOURCE_CACHE.get(path);
        if (nonce === 0 && hit !== undefined && Date.now() - hit.at < ttlMs) {
          setEntry({ state: hit.state, at: hit.at });
          return undefined;
        }
        let alive = true;
        const controller = new AbortController();
        const url = nonce === 0 ? path : `${path}${path.indexOf('?') === -1 ? '?' : '&'}force=1`;
        (async () => {
          try {
            const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            const next =
              payload !== null && typeof payload === 'object' && payload.ok === true
                ? { phase: 'ready', payload: payload, message: '' }
                : { phase: 'error', payload: payload !== null && typeof payload === 'object' ? payload : null, message: '' };
            const at = Date.now();
            RESOURCE_CACHE.set(path, { at: at, state: next });
            if (alive) setEntry({ state: next, at: at });
          } catch (error) {
            if (!alive || (error !== null && typeof error === 'object' && error.name === 'AbortError')) return;
            setEntry({ state: { phase: 'error', payload: null, message: String((error && error.message) || error) }, at: 0 });
          }
        })();
        return () => {
          alive = false;
          controller.abort();
        };
      }, [path, ttlMs, nonce]);

      const refresh = React.useCallback(() => {
        RESOURCE_CACHE.delete(path);
        setNonce((value) => value + 1);
      }, [path]);

      return { state: entry.state, at: entry.at, refresh: refresh };
    }

    /**
     * Diff the live catalog against the snapshot the previous visit left behind,
     * then record this one. Keyed on payload identity, so one fetch produces one
     * diff however many times the view re-renders.
     */
    function useModelDiff(payload) {
      const [diff, setDiff] = React.useState(null);
      const seen = React.useRef(null);
      React.useEffect(() => {
        if (payload === null || !Array.isArray(payload.models)) return;
        if (seen.current === payload) return;
        seen.current = payload;
        const ids = payload.models.map((model) => model.id);
        const previous = readSnapshot();
        if (previous === null) {
          setDiff({ first: true, at: null, added: [], removed: [] });
        } else {
          const before = new Set(previous.ids);
          const now = new Set(ids);
          setDiff({
            first: false,
            at: previous.at,
            added: ids.filter((id) => !before.has(id)),
            removed: previous.ids.filter((id) => !now.has(id)),
          });
        }
        writeSnapshot(ids);
      }, [payload]);
      return diff;
    }

    /** One labelled row of model ids. */
    function idRow(ids, tone) {
      return h(
        'div',
        { className: 'dshogq-ids' },
        ids.map((id) => h('span', { className: 'dshogq-id', key: id, 'data-tone': tone }, id)),
      );
    }

    /** The model catalog popover: both baselines, then the whole list. */
    function ModelsPopover(props) {
      const t = props.t;
      const state = props.state;
      const diff = props.diff;
      const payload = state.phase === 'ready' ? state.payload : null;
      const baseline = payload !== null && payload.docsBaseline !== null && typeof payload.docsBaseline === 'object' ? payload.docsBaseline : null;
      const models = payload !== null && Array.isArray(payload.models) ? payload.models : [];

      let body;
      if (state.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error' || payload === null) {
        body = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
      } else {
        const sections = [];
        sections.push(
          h(
            'div',
            { className: 'dshogq-sect', key: 'docs' },
            h(
              'div',
              { className: 'dshogq-secttitle' },
              h('span', null, t('docsSection')),
              h(
                'span',
                { className: 'dshogq-count' },
                fill(t('docsBaseline'), {
                  date: baseline === null ? '?' : baseline.date,
                  n: baseline === null ? 0 : baseline.count,
                }),
              ),
            ),
            baseline !== null && baseline.notInDocs.length > 0
              ? idRow(baseline.notInDocs, 'new')
              : h('div', { className: 'dshogq-note' }, t('docsNone')),
            baseline !== null && baseline.missingFromApi.length > 0
              ? h(
                  'div',
                  { className: 'dshogq-note' },
                  fill(t('docsMissing'), { ids: baseline.missingFromApi.join(', ') }),
                )
              : null,
          ),
        );

        const added = diff !== null && diff.first === false ? diff.added : [];
        const removed = diff !== null && diff.first === false ? diff.removed : [];
        sections.push(
          h(
            'div',
            { className: 'dshogq-sect', key: 'since' },
            h(
              'div',
              { className: 'dshogq-secttitle' },
              h('span', null, t('sinceSection')),
              diff !== null && diff.at !== null
                ? h('span', { className: 'dshogq-count' }, fill(t('sinceAt'), { time: dayStamp(diff.at) }))
                : null,
            ),
            diff === null
              ? h('div', { className: 'dshogq-note' }, t('loading'))
              : diff.first
                ? h('div', { className: 'dshogq-note' }, fill(t('sinceFirst'), { n: models.length }))
                : added.length === 0 && removed.length === 0
                  ? h('div', { className: 'dshogq-note' }, t('sinceNone'))
                  : h('div', null, added.length > 0 ? idRow(added, 'new') : null, removed.length > 0 ? idRow(removed, 'gone') : null),
          ),
        );

        sections.push(
          h(
            'div',
            { className: 'dshogq-sect', key: 'all' },
            h(
              'div',
              { className: 'dshogq-secttitle' },
              h('span', null, t('allSection')),
              h('span', { className: 'dshogq-count' }, fill(t('modelsCount'), { n: models.length })),
            ),
            h(
              'div',
              { className: 'dshogq-scroll' },
              h(
                'div',
                { className: 'dshogq-ids' },
                models.map((model) => h('span', { className: 'dshogq-id', key: model.id }, model.id)),
              ),
            ),
          ),
        );
        body = h('div', null, sections);
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: MODELS_WIDTH,
          title: t('modelsTitle'),
          subtitle: payload === null ? null : clockTime(payload.fetchedAt),
          footer: t('modelsFooter'),
        },
        body,
      );
    }

    /** The version popover: three milestones, then the changelog of what is newer. */
    function VersionPopover(props) {
      const t = props.t;
      const state = props.state;
      const payload = state.phase === 'ready' ? state.payload : null;
      const locale = props.locale;

      const milestone = (label, version, tone) =>
        h(
          'div',
          { className: 'dshogq-kv', key: label },
          h('span', { className: 'dshogq-kvlabel' }, label),
          h('span', { className: 'dshogq-kvvalue' }, version === null || version === undefined ? '—' : version),
          tone === null || tone === undefined ? null : h('span', { className: 'dshogq-chip', 'data-tone': tone.tone }, tone.text),
        );

      let body;
      if (state.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error' || payload === null) {
        body = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
      } else {
        const channels = payload.channels !== null && typeof payload.channels === 'object' ? payload.channels : {};
        const rows = [
          milestone(t('verCurrent'), payload.current === null ? t('verUnknown') : payload.current, null),
          milestone(
            t('verLatest'),
            payload.latest,
            payload.latest === null || payload.current === null
              ? null
              : payload.updateAvailable
                ? { tone: 'warn', text: t('verUpdateYes') }
                : { tone: 'ok', text: t('verUpdateNo') },
          ),
        ];
        if (typeof channels.alpha === 'string' && channels.alpha !== payload.latest) {
          rows.push(milestone('alpha', channels.alpha, { tone: null, text: null }));
        }
        if (typeof channels.next === 'string' && channels.next !== payload.latest && channels.next !== channels.alpha) {
          rows.push(milestone('next', channels.next, null));
        }

        const notes = [];
        if (payload.registryOk !== true) {
          notes.push(h('div', { className: 'dshogq-msg', key: 'registry' }, fill(t('errRegistry'), { detail: payload.registryMessage || '' })));
        }
        if (payload.releasesOk !== true) {
          notes.push(h('div', { className: 'dshogq-msg', key: 'releases' }, fill(t('errReleases'), { detail: payload.releasesMessage || '' })));
        }

        const releases = Array.isArray(payload.releases) ? payload.releases : [];
        const changelog =
          releases.length === 0
            ? h('div', { className: 'dshogq-note' }, t('verNone'))
            : h(
                'div',
                { className: 'dshogq-scroll' },
                releases.map((release) => {
                  const lines = releaseLines(release.body, locale);
                  return h(
                    'div',
                    { className: 'dshogq-ver', key: release.tag },
                    h(
                      'div',
                      { className: 'dshogq-verhead' },
                      h('span', { className: 'dshogq-vertag' }, release.version),
                      h('span', { className: 'dshogq-chip' }, release.channel),
                      release.beyondLatest === true
                        ? h('span', { className: 'dshogq-chip', 'data-tone': 'warn' }, t('verChannelBeyond'))
                        : null,
                      h('span', { className: 'dshogq-verdate' }, dayStamp(release.publishedAt)),
                    ),
                    lines.length === 0
                      ? h('div', { className: 'dshogq-logtext' }, t('verNoNotes'))
                      : h(
                          'div',
                          { className: 'dshogq-log' },
                          lines.map((line, index) =>
                            line.kind === 'heading'
                              ? h('div', { className: 'dshogq-logheading', key: index }, line.text)
                              : line.kind === 'item'
                                ? h('div', { className: 'dshogq-logitem', key: index }, line.text)
                                : h('div', { className: 'dshogq-logtext', key: index }, line.text),
                          ),
                        ),
                  );
                }),
              );

        body = h(
          'div',
          null,
          h('div', { className: 'dshogq-rows' }, rows),
          notes,
          h(
            'div',
            { className: 'dshogq-sect' },
            h(
              'div',
              { className: 'dshogq-secttitle' },
              h('span', null, t('verChanges')),
              h(
                'span',
                { className: 'dshogq-count' },
                releases.length === 0 ? t('verUpdateNo') : fill(t('verNewer'), { n: payload.newerCount }),
              ),
            ),
            changelog,
          ),
        );
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: VERSION_WIDTH,
          title: t('versionTitle'),
          subtitle: payload === null ? null : fill(t('checkedAt'), { time: clockTime(payload.fetchedAt) }),
          footer: t('versionFooter'),
        },
        body,
      );
    }

    /**
     * Build the meter cell: three mini bars, plus a hover popover of detail.
     * @param ctx - the Client plugin context (`slots` and `locale` present).
     * @returns the React component registered into `sidebar.footer.action`.
     */
    function makeQuotaCell(ctx) {
      return function OpenCodeGoQuota(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);

        const state = useQuota();
        const byId = windowsById(state);
        const known = WINDOW_KEYS.filter((key) => byId[key.id] !== undefined);
        const ready = state.phase === 'ready' && known.length > 0;
        let highest = 0;
        for (const key of known) highest = Math.max(highest, percentOf(byId[key.id]));

        const hint = ready
          ? fill(t('hint'), {
              a: displayPercent(byId.rolling),
              b: displayPercent(byId.weekly),
              c: displayPercent(byId.monthly),
            })
          : t('noData');

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'hover',
            width: QUOTA_WIDTH,
            title: t('title'),
            hint: hint,
            glyph: miniBars(byId),
            label: wide && ready ? `${Math.round(highest)}%` : null,
            renderPopover: (position) => {
              let body;
              if (state.phase === 'loading') {
                body = h('div', { className: 'dshogq-note' }, t('loading'));
              } else if (state.phase === 'error') {
                body = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
              } else if (!ready) {
                body = h('div', { className: 'dshogq-msg' }, t('errShape'));
              } else {
                body = h(
                  'div',
                  { className: 'dshogq-rows' },
                  known.map((key) => windowRow(key, byId[key.id], t)),
                );
              }
              return h(
                PopoverBox,
                {
                  position: position,
                  width: QUOTA_WIDTH,
                  title: t('title'),
                  subtitle: ready ? fill(t('updatedAt'), { time: clockTime(state.payload.fetchedAt) }) : null,
                  footer: t('footer'),
                },
                body,
              );
            },
          },
        );
      };
    }

    /** Build the OpenCode-mark cell: the model catalog and what moved in it. */
    function makeModelsCell() {
      return function OpenCodeGoModels(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);

        const remote = useRemote(MODELS_ROUTE, INFO_TTL_MS);
        const payload = remote.state.phase === 'ready' ? remote.state.payload : null;
        const diff = useModelDiff(payload);
        const baseline = payload !== null && payload.docsBaseline !== null && typeof payload.docsBaseline === 'object' ? payload.docsBaseline : null;
        const fresh = (baseline !== null && baseline.notInDocs.length > 0) || (diff !== null && diff.first === false && (diff.added.length > 0 || diff.removed.length > 0));

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'click',
            width: MODELS_WIDTH,
            title: t('modelsTitle'),
            hint: t('modelsHint'),
            glyph: h(OpenCodeMark, { height: 16 }),
            label: wide && payload !== null ? String(payload.total) : null,
            badge: fresh,
            onOpen: () => {
              if (Date.now() - remote.at > REOPEN_REFRESH_MS) remote.refresh();
            },
            renderPopover: (position) => h(ModelsPopover, { position: position, t: t, state: remote.state, diff: diff }),
          },
        );
      };
    }

    /** Build the version cell: the running Harness build against published ones. */
    function makeVersionCell() {
      return function OpenCodeGoVersion(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);
        const locale = props && typeof props.__locale === 'string' ? props.__locale : 'en';

        const remote = useRemote(VERSION_ROUTE, INFO_TTL_MS);
        const payload = remote.state.phase === 'ready' ? remote.state.payload : null;

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'click',
            width: VERSION_WIDTH,
            title: t('versionTitle'),
            hint: t('versionHint'),
            glyph: h(VersionGlyph, null),
            label: 'Ver',
            badge: payload !== null && payload.updateAvailable === true,
            onOpen: () => {
              if (Date.now() - remote.at > REOPEN_REFRESH_MS) remote.refresh();
            },
            renderPopover: (position) =>
              h(VersionPopover, { position: position, t: t, state: remote.state, locale: locale }),
          },
        );
      };
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        /** Copy table for the active locale, read live through the locale service. */
        const readLocale = () => {
          try {
            return String(ctx.locale.getLocale().active || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
          } catch (error) {
            return 'en';
          }
        };
        const readCopy = () => COPY[readLocale()];

        for (const locale of Object.keys(COPY)) {
          ctx.effect(() => ctx.locale.register(NS, locale, COPY[locale]), `opencode-go-quota: locale ${locale}`);
        }

        /** The release-notes language follows the interface language per render. */
        const withLocale = (Component) =>
          function LocalizedCell(props) {
            const [locale, setLocale] = React.useState(readLocale);
            React.useEffect(() => {
              let unsubscribe = () => {};
              try {
                unsubscribe = ctx.locale.subscribe(() => setLocale(readLocale()));
              } catch (error) {
                unsubscribe = () => {};
              }
              return () => {
                try {
                  unsubscribe();
                } catch (error) {
                  /* already disposed */
                }
              };
            }, []);
            return h(Component, Object.assign({}, props, { __locale: locale }));
          };

        const register = (id, order, labelKey, Component) =>
          ctx.slots.inject('sidebar.footer.action', () =>
            ctx.slots.register(
              {
                name: 'sidebar.footer.action',
                id: id,
                order: order,
                label: () => readCopy()[labelKey],
                locale: NS,
              },
              Component,
            ),
          );

        register('opencode-go-quota', 40, 'title', makeQuotaCell(ctx));
        register('opencode-go-models', 41, 'modelsTitle', withLocale(makeModelsCell()));
        register('opencode-go-version', 42, 'versionTitle', withLocale(makeVersionCell()));
      },
    };
  },
});
