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
 *   [◫ 37]      the OpenCode mark — a hover popover comparing the live model
 *               catalog against the published documentation and against the
 *               previous visit's snapshot.
 *   [Ver •]     the running Harness version against published releases, with
 *               the bilingual changelog of everything newer than it.
 *
 * All three open on hover and close on leaving; a click only re-asserts the
 * open state.
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
    /** The two links the catalog popover's footer offers, instead of the
        documentation being recited inline. */
    const CONSOLE_URL = 'https://opencode.ai/console';
    const DOCS_URL = 'https://opencode.ai/zh/go';
    /** How often the page re-reads the meters; the Host caches behind it. */
    const POLL_MS = 60000;
    /** Countdown refresh cadence. */
    const TICK_MS = 30000;
    /**
     * Catalog and version answers are read once per page load and then again
     * only when the reader asks, so they stay good for the whole page session.
     */
    const INFO_TTL_MS = Infinity;
    /** The catalog and version popovers widen to hold a detail pane beside
        their column; an unset width lets a shell measure itself to its content. */
    const QUOTA_WIDTH = 268;
    const MODELS_SPLIT = 440;
    const VERSION_SPLIT = 460;
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
      modelsHint: 'Every model the Go plan currently offers',
      refresh: 'Refresh',
      liveSection: 'Every model (live)',
      snapFirstNote: 'First read — this list is now the snapshot ({n} models). Press refresh to compare.',
      diffSection: 'Difference',
      added: 'Added',
      removed: 'Removed',
      none: 'none',
      consoleLink: 'Console',
      docsLink: 'Go docs',
      versionTitle: 'DSH version',
      versionHint: 'Check for updates',
      verCurrent: 'Current',
      verLatest: 'Latest',
      verUnknown: 'unknown (installation not found)',
      verUpdateYes: 'update available',
      verUpdateNo: 'up to date',
      verNone: 'Nothing published is newer than this build',
      verChannelBeyond: 'newer than latest',
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
        modelsHint: 'Go 套餐当前提供的全部模型',
        refresh: '刷新',
        liveSection: '全部模型（实时）',
        snapFirstNote: '首次获取，已把本次清单记为快照（{n} 个）。之后点刷新即可对比。',
        diffSection: '差异对比',
        added: '新增',
        removed: '下架',
        none: '无',
        consoleLink: '控制台',
        docsLink: 'Go 官方文档',
        versionTitle: 'DSH 版本',
        versionHint: '检查更新',
        verCurrent: '当前',
        verLatest: '最新',
        verUnknown: '未知（找不到安装位置）',
        verUpdateYes: '有新版本',
        verUpdateNo: '已是最新',
        verNone: '当前版本已是最新发布',
        verChannelBeyond: '晚于 latest',
        verChanges: '更新内容',
        verNoNotes: '（该版本没有发布说明）',
      },
      en: FALLBACK,
    };

    const CSS = [
      /* Cell chrome copies the host's own sidebar-foot trigger and the model
         selector's trigger: no border, no background, host radius and hover
         token, host focus ring. Nothing here is an invented value. */
      '.dshogq-wrap{display:inline-flex;align-items:center;position:relative;flex:0 0 auto;}',
      '.dshogq-cell{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 8px;',
      'border-radius:var(--dsw-radius-sm);border:none;outline:none;background:0 0;cursor:pointer;',
      'color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;font-weight:400;line-height:20px;',
      'white-space:nowrap;font-variant-numeric:tabular-nums;}',
      '.dshogq-cell[data-icon="true"]{padding:0 6px;}',
      '.dshogq-cell:hover,.dshogq-cell[data-open="true"]{background:var(--dsw-alias-interactive-bg-hover);}',
      '.dshogq-cell:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      '.dshogq-bars{display:flex;align-items:stretch;gap:2px;height:14px;flex:none;}',
      '.dshogq-bar{position:relative;width:2px;border-radius:var(--dsw-radius-xs);',
      'background:var(--dsw-alias-border-l1);overflow:hidden;}',
      '.dshogq-bar>i{position:absolute;left:0;right:0;bottom:0;display:block;border-radius:var(--dsw-radius-xs);',
      'background:var(--dsw-alias-state-idle-primary);transition:height .2s var(--ds-ease-in-out);}',
      '.dshogq-bar[data-level="normal"]>i{background:var(--dsw-alias-brand-primary);}',
      '.dshogq-bar[data-level="warn"]>i{background:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-bar[data-level="critical"]>i,.dshogq-bar[data-level="blocked"]>i{background:var(--dsw-alias-state-error-primary);}',
      '.dshogq-celltext{color:var(--dsw-alias-label-primary);}',
      '.dshogq-celltext[data-level="normal"]{color:var(--dsw-alias-brand-primary);}',
      '.dshogq-celltext[data-level="warn"]{color:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-celltext[data-level="critical"],.dshogq-celltext[data-level="blocked"]{color:var(--dsw-alias-state-error-primary);}',
      '.dshogq-marksvg{display:block;flex:none;}',
      '.dshogq-refresh{display:inline-flex;align-items:center;justify-content:center;flex:none;',
      'margin-left:6px;width:20px;height:20px;padding:0;border-radius:var(--dsw-radius-xs);',
      'border:none;outline:none;background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;}',
      '.dshogq-refresh:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dshogq-refresh:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      '.dshogq-refresh[data-busy="true"]{opacity:.4;cursor:default;}',
      '.dshogq-badge{width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-state-success-primary);flex:none;}',
      /* Popover chrome copies the host's menu: no border, one elevation token,
         4px padding, .5px hairlines, host scrollbar tokens, hidden overflow so
         the rounded corners clip the scrolling child. */
      '.dshogq-pop{position:fixed;z-index:1100;box-sizing:border-box;width:max-content;',
      'min-width:200px;max-width:min(460px,calc(100vw - 32px));max-height:min(420px,calc(100vh - 96px));',
      'border:0;border-radius:var(--dsw-radius-md);padding:4px;overflow:hidden;display:flex;flex-direction:column;',
      '--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent);',
      /* The host's own menu surface is deliberately translucent (58% light /
         45% dark) because it floats over content. These popovers carry fine
         print, so they use the opaque overlay token instead. */
      'background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);',
      '--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);',
      '--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);',
      'font-size:12px;line-height:18px;',
      /* The sidebar chrome disables selection; the popover's fine print is the
         one place a reader copies text out of, so selection is switched back on
         here. Without it a drag selects the conversation behind the panel. */
      '-webkit-user-select:text;user-select:text;}',
      '.dshogq-head{display:flex;align-items:baseline;gap:8px;padding:6px 8px 2px;}',
      '.dshogq-title{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary);}',
      '.dshogq-updated{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-foot{margin-top:auto;padding:6px 8px 4px;font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-scroll{min-height:0;overflow-y:auto;overflow-x:hidden;padding:0 4px;}',
      /* Meters: the v1 rhythm, retuned to host type sizes. */
      '.dshogq-rows{padding:2px 4px;}',
      '.dshogq-row{padding:6px 4px;display:flex;flex-direction:column;gap:5px;}',
      '.dshogq-row+.dshogq-row{border-top:.5px solid var(--dsw-alias-border-l1);}',
      '.dshogq-rowhead{display:flex;align-items:baseline;gap:8px;}',
      '.dshogq-rowlabel{font-size:12px;color:var(--dsw-alias-label-secondary);}',
      '.dshogq-rowpct{margin-left:auto;font-size:13px;font-weight:500;font-variant-numeric:tabular-nums;}',
      '.dshogq-rowpct[data-level="normal"]{color:var(--dsw-alias-brand-primary);}',
      '.dshogq-rowpct[data-level="warn"]{color:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-rowpct[data-level="critical"],.dshogq-rowpct[data-level="blocked"]{color:var(--dsw-alias-state-error-primary);}',
      '.dshogq-rowpct[data-level="idle"]{color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-track{position:relative;height:4px;border-radius:var(--dsw-radius-xs);',
      'background:var(--dsw-alias-border-l1);overflow:hidden;}',
      '.dshogq-fill{position:absolute;top:0;bottom:0;left:0;border-radius:var(--dsw-radius-xs);',
      'background:var(--dsw-alias-state-idle-primary);transition:width .2s var(--ds-ease-in-out);}',
      '.dshogq-fill[data-level="normal"]{background:var(--dsw-alias-brand-primary);}',
      '.dshogq-fill[data-level="warn"]{background:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-fill[data-level="critical"],.dshogq-fill[data-level="blocked"]{background:var(--dsw-alias-state-error-primary);}',
      '.dshogq-sub{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      /* Model catalog: quiet section titles, no uppercase tracking, code-font chips
         on the host's interactive hover fill instead of boxed outlines. */
      '.dshogq-sect{padding:4px 8px 6px;}',
      '.dshogq-sect+.dshogq-sect{border-top:.5px solid var(--dsw-alias-border-l1);}',
      '.dshogq-secttitle{display:flex;align-items:baseline;gap:8px;font-size:11px;font-weight:500;',
      'color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-count{margin-left:auto;font-weight:400;font-variant-numeric:tabular-nums;}',
      /* The catalog splits sideways: a fixed column of rows, and a pane holding
         whichever row is open. The detail is capped, so the panel's height
         never moves no matter which section is chosen. */
      '.dshogq-pane{display:flex;align-items:stretch;}',
      /* The column keeps whatever width its own rows need, however much room
         the pane beside it asks for: flex would otherwise squeeze it, and the
         column is meant to sit exactly where it was before the pane appeared. */
      '.dshogq-nav{display:flex;flex-direction:column;gap:2px;flex:none;}',
      '.dshogq-detail{display:flex;flex-direction:column;min-width:0;overflow:hidden;flex:1 1 0;',
      'border-left:.5px solid var(--dsw-alias-border-l1);}',
      '.dshogq-detailbody{padding:2px 0 2px 8px;max-height:220px;overflow-y:auto;overflow-x:hidden;}',
      '.dshogq-navrow{display:flex;align-items:center;gap:6px;padding:6px 8px;border:none;outline:none;',
      'background:0 0;cursor:pointer;color:inherit;font:inherit;font-size:11px;font-weight:500;line-height:16px;',
      'text-align:left;border-radius:var(--dsw-radius-xs);}',
      '.dshogq-navrow[data-on="true"]{background:var(--dsw-alias-interactive-bg-hover);}',
      '.dshogq-navrow:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      '.dshogq-navlabel{color:var(--dsw-alias-label-tertiary);transition:color .12s var(--ds-ease-in-out);}',
      '.dshogq-navrow[data-on="true"] .dshogq-navlabel,.dshogq-navrow:hover .dshogq-navlabel{color:var(--dsw-alias-label-primary);}',
      '.dshogq-navmeta{margin-left:auto;font-weight:400;color:var(--dsw-alias-label-tertiary);',
      'font-variant-numeric:tabular-nums;}',
      '.dshogq-caret{flex:none;color:var(--dsw-alias-label-tertiary);transition:transform .12s var(--ds-ease-in-out);}',
      '.dshogq-caret[data-open="true"]{transform:rotate(90deg);}',
      '.dshogq-diff{display:flex;flex-direction:column;gap:4px;margin-top:5px;}',
      '.dshogq-diffrow{display:flex;align-items:baseline;gap:8px;}',
      '.dshogq-difflabel{flex:none;width:26px;font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-diffrow>.dshogq-ids{flex:1;min-width:0;margin-top:0;}',
      '.dshogq-link{color:var(--dsw-alias-brand-primary);text-decoration:none;}',
      '.dshogq-link:hover{text-decoration:underline;}',
      '.dshogq-links{display:flex;align-items:center;gap:6px;}',
      '.dshogq-linksep{color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-ids{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px;}',
      '.dshogq-id{font-family:var(--ds-font-family-code);font-size:11px;padding:1px 5px;',
      'border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-module-platform);',
      'color:var(--dsw-alias-label-primary);line-height:16px;}',
      '.dshogq-id[data-tone="new"]{color:var(--dsw-alias-brand-primary);}',
      '.dshogq-id[data-tone="gone"]{color:var(--dsw-alias-state-error-primary);text-decoration:line-through;}',
      /* Version: milestones as host rows, chips as host pills. */
      '.dshogq-kv{display:flex;align-items:baseline;gap:8px;padding:4px 8px;font-size:12px;}',
      '.dshogq-kv+.dshogq-kv{border-top:.5px solid var(--dsw-alias-border-l1);}',
      '.dshogq-kvlabel{color:var(--dsw-alias-label-tertiary);min-width:48px;}',
      '.dshogq-kvvalue{margin-left:auto;font-size:13px;font-weight:500;font-variant-numeric:tabular-nums;}',
      '.dshogq-kvdate{font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;}',
      '.dshogq-ver{padding:6px 8px;}',
      '.dshogq-ver+.dshogq-ver{border-top:.5px solid var(--dsw-alias-border-l1);}',
      '.dshogq-verhead{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
      '.dshogq-vertag{font-size:13px;font-weight:500;font-variant-numeric:tabular-nums;}',
      '.dshogq-verdate{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-chip{font-size:10px;padding:0 5px;border-radius:var(--dsw-radius-sm);line-height:16px;',
      'background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-chip[data-tone="ok"]{color:var(--dsw-alias-state-success-primary);}',
      '.dshogq-chip[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary);}',
      '.dshogq-log{display:flex;flex-direction:column;gap:2px;margin-top:4px;}',
      '.dshogq-logheading{font-size:11px;font-weight:500;color:var(--dsw-alias-label-secondary);margin-top:5px;}',
      '.dshogq-logitem{font-size:11px;color:var(--dsw-alias-label-secondary);padding-left:10px;position:relative;',
      'word-break:break-word;}',
      '.dshogq-logitem::before{content:"·";position:absolute;left:2px;}',
      '.dshogq-logtext{font-size:11px;color:var(--dsw-alias-label-tertiary);word-break:break-word;}',
      '.dshogq-msg{padding:4px 8px 6px;font-size:12px;color:var(--dsw-alias-state-error-primary);word-break:break-word;}',
      '.dshogq-note{padding:4px 8px 6px;font-size:12px;color:var(--dsw-alias-label-tertiary);}'
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
          /* An unset width means "size to the content": the panel measures
             itself, and the guess below only keeps the clamp honest. */
          const sized = Number.isFinite(width);
          const guess = sized ? width : 300;
          const clamped = Math.min(guess, Math.max(200, window.innerWidth - 16));
          const left = wide ? rect.left : rect.right + 8;
          setPosition({
            width: sized ? clamped : undefined,
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
          typeof props.onRefresh === 'function'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dshogq-refresh',
                  'data-busy': props.busy === true ? 'true' : 'false',
                  'aria-label': props.refreshLabel,
                  title: props.refreshLabel,
                  disabled: props.busy === true,
                  onClick: props.onRefresh,
                },
                h(RefreshGlyph, null),
              )
            : null,
        ),
        props.children,
        props.footer === null || props.footer === undefined ? null : h('div', { className: 'dshogq-foot' }, props.footer),
      );
    }

    /**
     * One cell in the sidebar foot: a button plus the popover it opens.
     *
     * `mode` decides how the popover opens. 'hover' is what every cell uses: the
     * pointer arriving opens it, and leaving closes it after a short grace so
     * the popover can be walked into. 'click' remains for a cell whose content
     * is too tall to appear under a passing pointer.
     */
    function CellShell(props) {
      const wide = props.wide === true;
      const hover = props.mode === 'hover';
      const [open, setOpen] = React.useState(false);
      const anchorRef = React.useRef(null);
      const closeTimer = React.useRef(0);
      /* True while the primary button is held down inside the wrapper. A reader
         pressing to select the popover's text must keep the panel: mousedown
         moves focus off the trigger (blur-close fires), and a drag that crosses
         the panel's edge fires mouseleave (grace-close fires) — both would
         otherwise tear the panel down mid-selection, taking the selection with
         it. */
      const pressRef = React.useRef(false);
      const position = usePopoverPosition(open, anchorRef, wide, props.width);

      const cancelClose = () => {
        if (closeTimer.current) {
          window.clearTimeout(closeTimer.current);
          closeTimer.current = 0;
        }
      };
      /* One funnel for the open flag, so a cell can reset its own popover state
         when the popover closes without owning that state itself. */
      const setOpenState = (value) => {
        setOpen(value);
        if (typeof props.onOpenChange === 'function') props.onOpenChange(value);
      };
      const openNow = () => {
        cancelClose();
        setOpenState(true);
      };
      const closeSoon = () => {
        cancelClose();
        /* A held button is an in-progress selection, not a departure. */
        if (pressRef.current) return;
        closeTimer.current = window.setTimeout(() => {
          closeTimer.current = 0;
          setOpenState(false);
        }, 140);
      };
      const closeNow = () => {
        cancelClose();
        setOpenState(false);
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
        /* The release can land outside the wrapper (a drag that ran past the
           panel's edge), so it is observed on the document. A release still
           inside keeps the panel; a release outside keeps it only when the drag
           actually produced a selection, so the reader can still copy it. */
        const onPointerUp = (event) => {
          if (!pressRef.current) return;
          pressRef.current = false;
          const node = anchorRef.current;
          if (node !== null && node !== undefined && node.contains(event.target)) return;
          const selection = window.getSelection();
          if (selection !== null && selection !== undefined && selection.isCollapsed === false) return;
          closeNow();
        };
        const onPointerCancel = () => {
          pressRef.current = false;
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerCancel);
        return () => {
          document.removeEventListener('keydown', onKey);
          document.removeEventListener('pointerdown', onPointer);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerCancel);
          pressRef.current = false;
        };
      }, [open]);

      /* Focus lives on the wrapper, not the button, and a focus that moves into
         the popover does not close it. Handled on the button it would blur the
         moment a reader clicked a section row or the refresh icon, and the
         popover would vanish a grace period later. */
      const onBlur = hover
        ? (event) => {
            /* A press inside blurs the trigger on mousedown; that is the start of
               a selection, not a departure. */
            if (pressRef.current) return;
            const node = anchorRef.current;
            const next = event.relatedTarget;
            if (next !== null && node !== null && node !== undefined && node.contains(next)) return;
            closeSoon();
          }
        : undefined;

      return h(
        'span',
        {
          className: 'dshogq-wrap',
          ref: anchorRef,
          /* A press starting inside opens the selection window: from here until
             the matching release nothing may close the panel. */
          onPointerDown: (event) => {
            if (event.button !== 0) return;
            pressRef.current = true;
            cancelClose();
          },
          onMouseEnter: hover ? openNow : undefined,
          onMouseLeave: hover ? closeSoon : undefined,
          onFocus: hover ? openNow : undefined,
          onBlur: onBlur,
        },
        h(
          'button',
          {
            type: 'button',
            className: 'dshogq-cell',
            'data-open': open ? 'true' : 'false',
            /* Icon-only cells need the host's tighter padding; a labelled cell
               reads better with the wider side bearing its text uses. */
            'data-icon': props.label === null || props.label === undefined ? 'true' : 'false',
            'aria-expanded': open,
            'aria-label': props.title,
            title: open ? undefined : props.hint,
            /* Hover owns the popover for every cell, so a click only re-asserts
               the open state instead of fighting the pointer. */
            onClick: hover ? openNow : () => (open ? closeNow() : openNow()),
          },
          props.glyph,
          props.label === null || props.label === undefined
            ? null
            : h('span', { className: 'dshogq-celltext', 'data-level': props.labelLevel || 'idle' }, props.label),
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

    /** The manual-refresh affordance in a popover's title row. */
    function RefreshGlyph() {
      return h(
        'svg',
        { className: 'dshogq-marksvg', width: 12, height: 12, viewBox: '0 0 16 16', 'aria-hidden': true },
        h('path', {
          d: 'M13.5 8a5.5 5.5 0 1 1-1.61-3.89A.75.75 0 0 1 12.9 5.3 4 4 0 1 0 12 8a.75.75 0 0 1 1.5 0Z',
          fill: 'currentColor',
        }),
        h('path', {
          d: 'M13.5 1.75a.75.75 0 0 1 .75.75V5.5a.75.75 0 0 1-1.5 0V3.06l-2.47 2.47a.75.75 0 1 1-1.06-1.06l2.47-2.47H12.75a.75.75 0 0 1 0-1.5Z',
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

    /** The local 08:00 that follows an instant — the one auto-refresh a day. */
    function nextEightAm(from) {
      const next = new Date(from);
      next.setHours(8, 0, 0, 0);
      if (next.getTime() <= from) next.setDate(next.getDate() + 1);
      return next.getTime();
    }

    /**
     * Read a slow-moving Host route once and share it between every component
     * that asks for the same path — a page load costs one read, and every later
     * read is either the refresh button in the popover or the daily 08:00 tick.
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

      /* Exactly one automatic re-read a day, at 08:00 local time. A miss is
         cheap to repeat and self-corrects: the new answer moves the next
         boundary to tomorrow, so a suspended tab that wakes late still refreshes
         once rather than every minute until then. The page load itself owns the
         first read, so a missing entry is left alone here. */
      React.useEffect(() => {
        const check = () => {
          const hit = RESOURCE_CACHE.get(path);
          if (hit === undefined) return;
          if (Date.now() < nextEightAm(hit.at)) return;
          RESOURCE_CACHE.delete(path);
          setNonce((value) => value + 1);
        };
        const timer = window.setInterval(check, 60000);
        return () => window.clearInterval(timer);
      }, [path]);

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

      return {
        state: entry.state,
        at: entry.at,
        busy: entry.state.phase === 'loading',
        refresh: refresh,
      };
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
          setDiff({ first: true, at: null, previousIds: null, added: [], removed: [] });
        } else {
          const before = new Set(previous.ids);
          const now = new Set(ids);
          setDiff({
            first: false,
            at: previous.at,
            /* The list this page's read replaced, so the popover can show what
               was recorded rather than only what changed. */
            previousIds: previous.ids,
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

    /** One row in the catalog's column; the caret tracks the pane it owns. */
    function CatalogRow(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'dshogq-navrow',
          'data-on': props.on === true ? 'true' : 'false',
          'aria-expanded': props.on === true,
          onClick: props.onClick,
        },
        h(
          'span',
          { className: 'dshogq-caret', 'data-open': props.on === true ? 'true' : 'false', 'aria-hidden': true },
          '▸',
        ),
        h('span', { className: 'dshogq-navlabel' }, props.label),
        props.chip === null || props.chip === undefined
          ? null
          : h('span', { className: 'dshogq-chip', 'data-tone': props.chip.tone }, props.chip.text),
        h('span', { className: 'dshogq-navmeta' }, props.meta),
      );
    }

    /**
     * The model catalog: a fixed column of three collapsible inventories, and a
     * detail pane that opens beside whichever one is chosen.
     *
     * Expanding sideways instead of downwards is the point — the panel's height
     * never changes, so opening a section cannot push the sidebar around. One
     * section owns the pane at a time, so choosing one collapses the other.
     */
    function ModelsPopover(props) {
      const t = props.t;
      const state = props.state;
      const diff = props.diff;
      const payload = state.phase === 'ready' ? state.payload : null;
      const models = payload !== null && Array.isArray(payload.models) ? payload.models : [];
      const active = props.active === undefined ? null : props.active;
      const toggle = (key) => {
        if (typeof props.setActive === 'function') props.setActive(active === key ? null : key);
      };

      const added = diff !== null && diff.first === false ? diff.added : [];
      const removed = diff !== null && diff.first === false ? diff.removed : [];

      let body;
      if (state.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error' || payload === null) {
        body = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
      } else {
        let detail = null;
        if (active === 'live') {
          detail = idRow(models.map((model) => model.id), null);
        } else if (active === 'diff') {
          detail =
            diff === null
              ? h('div', { className: 'dshogq-note' }, t('loading'))
              : diff.first
                ? h('div', { className: 'dshogq-note' }, fill(t('snapFirstNote'), { n: models.length }))
                : h(
                    'div',
                    { className: 'dshogq-diff' },
                    h(
                      'div',
                      { className: 'dshogq-diffrow' },
                      h('span', { className: 'dshogq-difflabel' }, t('removed')),
                      removed.length === 0
                        ? h('span', { className: 'dshogq-note' }, t('none'))
                        : idRow(removed, 'gone'),
                    ),
                    h(
                      'div',
                      { className: 'dshogq-diffrow' },
                      h('span', { className: 'dshogq-difflabel' }, t('added')),
                      added.length === 0 ? h('span', { className: 'dshogq-note' }, t('none')) : idRow(added, 'new'),
                    ),
                  );
        }

        body = h(
          'div',
          { className: 'dshogq-pane' },
          h(
            'div',
            { className: 'dshogq-nav' },
            h(CatalogRow, {
              on: active === 'live',
              label: t('liveSection'),
              meta: `${models.length} · ${clockTime(payload.fetchedAt)}`,
              onClick: () => toggle('live'),
            }),
            h(CatalogRow, {
              on: active === 'diff',
              label: t('diffSection'),
              meta: diff === null || diff.first === true ? '—' : String(added.length + removed.length),
              onClick: () => toggle('diff'),
            }),
          ),
          detail === null
            ? null
            : h('div', { className: 'dshogq-detail' }, h('div', { className: 'dshogq-detailbody' }, detail)),
        );
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: active === null ? undefined : MODELS_SPLIT,
          title: t('modelsTitle'),
          subtitle: payload === null ? null : fill(t('checkedAt'), { time: clockTime(payload.fetchedAt) }),
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
          footer: h(
            'span',
            { className: 'dshogq-links' },
            h(
              'a',
              { className: 'dshogq-link', href: CONSOLE_URL, target: '_blank', rel: 'noreferrer' },
              t('consoleLink'),
            ),
            h('span', { className: 'dshogq-linksep', 'aria-hidden': true }, '·'),
            h('a', { className: 'dshogq-link', href: DOCS_URL, target: '_blank', rel: 'noreferrer' }, t('docsLink')),
          ),
        },
        body,
      );
    }

    /**
     * The version popover: a column of collapsible rows beside a detail pane,
     * the same shape as the catalog popover so the two read as one family.
     */
    function VersionPopover(props) {
      const t = props.t;
      const state = props.state;
      const payload = state.phase === 'ready' ? state.payload : null;
      const locale = props.locale;
      const active = props.active === undefined ? null : props.active;
      const toggle = (key) => {
        if (typeof props.setActive === 'function') props.setActive(active === key ? null : key);
      };

      /* One milestone row: label, version, its publish date, then any chip. */
      const milestone = (label, version, date, tone) =>
        h(
          'div',
          { className: 'dshogq-kv', key: label },
          h('span', { className: 'dshogq-kvlabel' }, label),
          h('span', { className: 'dshogq-kvvalue' }, version === null || version === undefined ? '—' : version),
          date === null || date === undefined
            ? null
            : h('span', { className: 'dshogq-kvdate' }, dayStamp(date)),
          tone === null || tone === undefined
            ? null
            : h('span', { className: 'dshogq-chip', 'data-tone': tone.tone }, tone.text),
        );

      let body;
      if (state.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error' || payload === null) {
        body = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
      } else {
        const channels = payload.channels !== null && typeof payload.channels === 'object' ? payload.channels : {};
        const dates = payload.channelDates !== null && typeof payload.channelDates === 'object' ? payload.channelDates : {};
        const releases = Array.isArray(payload.releases) ? payload.releases : [];

        /* The headline signal — whether anything is published above this build —
           rides in the collapsed row so it never needs opening to be seen. */
        const status =
          payload.latest === null || payload.current === null
            ? null
            : payload.updateAvailable
              ? { tone: 'warn', text: t('verUpdateYes') }
              : { tone: 'ok', text: t('verUpdateNo') };

        const notes = [];
        if (payload.registryOk !== true) {
          notes.push(
            h('div', { className: 'dshogq-msg', key: 'registry' }, fill(t('errRegistry'), { detail: payload.registryMessage || '' })),
          );
        }
        if (payload.releasesOk !== true) {
          notes.push(
            h('div', { className: 'dshogq-msg', key: 'releases' }, fill(t('errReleases'), { detail: payload.releasesMessage || '' })),
          );
        }

        const milestones = h(
          'div',
          { className: 'dshogq-rows' },
          milestone(t('verCurrent'), payload.current === null ? t('verUnknown') : payload.current, null, null),
          milestone(t('verLatest'), payload.latest, dates.latest ?? null, status),
          typeof channels.alpha === 'string' && channels.alpha !== payload.latest
            ? milestone('alpha', channels.alpha, dates.alpha ?? null, null)
            : null,
          typeof channels.next === 'string' && channels.next !== payload.latest && channels.next !== channels.alpha
            ? milestone('next', channels.next, dates.next ?? null, null)
            : null,
        );

        const changelog =
          releases.length === 0
            ? h('div', { className: 'dshogq-note' }, t('verNone'))
            : releases.map((release) => {
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
              });

        let detail = null;
        if (active === 'where') {
          detail = h('div', null, milestones, notes.length > 0 ? h('div', null, notes) : null);
        } else if (active === 'notes') {
          detail = h('div', { className: 'dshogq-scroll' }, changelog);
        }

        body = h(
          'div',
          { className: 'dshogq-pane' },
          h(
            'div',
            { className: 'dshogq-nav' },
            h(CatalogRow, {
              on: active === 'where',
              label: t('verCurrent'),
              meta: payload.current === null ? t('verUnknown') : payload.current,
              chip: status,
              onClick: () => toggle('where'),
            }),
            h(CatalogRow, {
              on: active === 'notes',
              label: t('verChanges'),
              meta: String(payload.newerCount),
              onClick: () => toggle('notes'),
            }),
          ),
          detail === null
            ? null
            : h('div', { className: 'dshogq-detail' }, h('div', { className: 'dshogq-detailbody' }, detail)),
        );
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: active === null ? undefined : VERSION_SPLIT,
          title: t('versionTitle'),
          subtitle: payload === null ? null : fill(t('checkedAt'), { time: clockTime(payload.fetchedAt) }),
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
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
        /* The cell shows the window that is closest to its own limit, and wears
           that window's colour, so a tight meter reads before the popover opens. */
        let highest = { percent: 0, level: 'idle' };
        for (const key of known) {
          const window = byId[key.id];
          if (percentOf(window) > highest.percent) {
            highest = { percent: percentOf(window), level: levelOf(window) };
          }
        }

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
            label: wide && ready ? `${Math.round(highest.percent)}%` : null,
            labelLevel: highest.level,
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
    /**
     * Build the OpenCode-mark cell: the model column beside a detail pane.
     *
     * The chosen section lives here rather than inside the popover so the
     * popover's width can follow it (and the placement be recomputed), and so
     * that closing the popover collapses the column again.
     */
    function makeModelsCell() {
      return function OpenCodeGoModels(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);

        const remote = useRemote(MODELS_ROUTE, INFO_TTL_MS);
        const payload = remote.state.phase === 'ready' ? remote.state.payload : null;
        const diff = useModelDiff(payload);
        /* The dot means "the last refresh changed the catalog", not "the docs
           are behind" — that condition never clears, and a dot that is always
           on has stopped saying anything. */
        const updated = diff !== null && diff.first === false && (diff.added.length > 0 || diff.removed.length > 0);
        const [active, setActive] = React.useState(null);

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'hover',
            /* Collapsed, the panel measures itself; widening only happens when
               a section opens, and the column keeps its place throughout. */
            width: active === null ? undefined : MODELS_SPLIT,
            title: t('modelsTitle'),
            hint: t('modelsHint'),
            glyph: h(OpenCodeMark, { height: 16 }),
            label: wide && payload !== null ? String(payload.total) : null,
            badge: updated,
            onOpenChange: (isOpen) => {
              if (!isOpen) setActive(null);
            },
            renderPopover: (position) =>
              h(ModelsPopover, {
                position: position,
                t: t,
                state: remote.state,
                diff: diff,
                busy: remote.busy,
                onRefresh: remote.refresh,
                active: active,
                setActive: setActive,
              }),
          },
        );
      };
    }

    /** Build the version cell: the running Harness build against published ones. */
    /**
     * Build the version cell: the Harness build against published ones.
     *
     * The chosen row lives here so the popover's width can follow it and so
     * closing the popover collapses the column again — same as the catalog.
     */
    function makeVersionCell() {
      return function OpenCodeGoVersion(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);
        const locale = props && typeof props.__locale === 'string' ? props.__locale : 'en';

        const remote = useRemote(VERSION_ROUTE, INFO_TTL_MS);
        const payload = remote.state.phase === 'ready' ? remote.state.payload : null;
        const [active, setActive] = React.useState(null);

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'hover',
            width: active === null ? undefined : VERSION_SPLIT,
            title: t('versionTitle'),
            hint: t('versionHint'),
            glyph: h(VersionGlyph, null),
            label: 'Ver',
            badge: payload !== null && payload.updateAvailable === true,
            onOpenChange: (isOpen) => {
              if (!isOpen) setActive(null);
            },
            renderPopover: (position) =>
              h(VersionPopover, {
                position: position,
                t: t,
                state: remote.state,
                locale: locale,
                busy: remote.busy,
                onRefresh: remote.refresh,
                active: active,
                setActive: setActive,
              }),
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

        /* Styles go into the document head the way every shipped Client half does
           them: one guarded <style> tag, added once and removed when this plugin
           unloads. Rendering the tag as a React child of a cell never reaches the
           document, so without this the whole control renders unstyled. */
        const tagId = `${NS}/client.css`;
        if (
          typeof document !== 'undefined' &&
          document.querySelector(`style[data-plugin-css=${JSON.stringify(tagId)}]`) === null
        ) {
          ctx.effect(() => {
            const tag = document.createElement('style');
            tag.dataset.plugin = NS;
            tag.dataset.pluginCss = tagId;
            tag.textContent = CSS;
            document.head.appendChild(tag);
            return () => {
              if (tag.parentNode !== null) tag.parentNode.removeChild(tag);
            };
          }, 'opencode-go-quota: styles');
        }

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
