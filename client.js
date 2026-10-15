/**
 * Client half of the OpenCode Go quota bundle.
 *
 * Registers one entry in `sidebar.footer.action`, the seat beside Settings at
 * the sidebar foot, so the Go plan's three metered windows stay visible on
 * every page of the shell:
 *
 *   - three stacked mini bars, one per window (5-hour, weekly, monthly), each
 *     filled to its share and tinted by its own level;
 *   - the currently highest share beside them when the column renders wide;
 *   - a hover/focus popover listing all three with a usage bar, the remaining
 *     share, and a live reset countdown.
 *
 * The numbers come from the Host half's same-origin route, never from a model
 * call or a session projection: this is ambient process state, not session
 * state. Visible copy goes through the Client locale service under the
 * `opencode-go-quota` namespace.
 *
 * `QuotaView` is a pure function of an explicit render state, so the drawing
 * path is inspectable without a live Host route; `makeCell` is the container
 * that polls, tracks the popover, and delegates every pixel to it.
 */
window.__ModuleLoader__.load({
  id: '@local/opencode-go-quota',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Dictionary namespace this bundle owns. */
    const NS = 'opencode-go-quota';
    /** Host route serving the normalized usage payload. */
    const ROUTE = '/opencode-go-quota/usage';
    /** How often the page re-reads the route; the Host caches behind it. */
    const POLL_MS = 60000;
    /** Countdown refresh cadence. */
    const TICK_MS = 30000;
    /** Widest the popover may grow before it is clamped to the viewport. */
    const POPOVER_WIDTH = 268;
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
      loading: 'Reading usage…',
      noData: 'No usage data yet',
      updatedAt: 'updated {time}',
      footer: 'Go plan · opencode.ai/console',
      retryHint: 'The Host could not read the Go usage endpoint.',
      errNoCredential: 'No credential is configured for {env}.',
      errUnauthorized: 'The Go API key was rejected.',
      errRateLimited: 'The usage endpoint asked us to slow down.',
      errTimeout: 'The usage endpoint did not answer in time.',
      errNetwork: 'The usage endpoint is unreachable: {detail}',
      errUpstream: 'The usage endpoint answered {status}.',
      errShape: 'The usage endpoint returned an unrecognized shape.',
      errInternal: 'The Host failed while reading usage.',
      expired: 'any moment now',
      lessThanMin: 'under a minute',
      min: '{m} min',
      hourMin: '{h} h {m} min',
      dayHour: '{d} d {h} h',
      hint: '5-hour {a}% · weekly {b}% · monthly {c}%',
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
        loading: '读取用量…',
        noData: '暂无用量数据',
        updatedAt: '{time} 更新',
        footer: 'Go 套餐 · opencode.ai/console',
        retryHint: 'Host 未能读取 Go 用量接口。',
        errNoCredential: '没有为 {env} 配置凭据。',
        errUnauthorized: 'Go API Key 被拒绝。',
        errRateLimited: '用量接口要求降低请求频率。',
        errTimeout: '用量接口超时未响应。',
        errNetwork: '无法连接用量接口：{detail}',
        errUpstream: '用量接口返回 {status}。',
        errShape: '用量接口返回了无法识别的格式。',
        errInternal: 'Host 读取用量时出错。',
        expired: '即将重置',
        lessThanMin: '不到 1 分钟',
        min: '{m} 分钟',
        hourMin: '{h} 小时 {m} 分',
        dayHour: '{d} 天 {h} 小时',
        hint: '时段 {a}% · 本周 {b}% · 本月 {c}%',
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

    /** Severity bucket that decides every colour this control draws. */
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

    /** Index the payload's windows by id; unknown ids are simply carried along. */
    function windowsById(state) {
      const map = {};
      const payload = state !== null && typeof state === 'object' ? state.payload : null;
      const list = payload !== null && Array.isArray(payload.windows) ? payload.windows : [];
      for (const window of list) {
        if (window !== null && typeof window === 'object' && typeof window.id === 'string') map[window.id] = window;
      }
      return map;
    }

    /** `HH:MM` of a payload instant, deterministic across locales. */
    function clockTime(iso) {
      const date = new Date(iso);
      if (!Number.isFinite(date.getTime())) return '';
      const pad = (value) => (value < 10 ? `0${value}` : String(value));
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

    /** One-row copy for a Host payload that carries no windows. */
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
        case 'shape':
          return t('errShape');
        default:
          return t('errInternal');
      }
    }

    /** The three stacked mini bars: the always-visible part of the control. */
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

    /**
     * Pure view of the sidebar-foot control.
     *
     * @param props.wide - the sidebar renders wide content (false = 56px rail).
     * @param props.t - translate function bound to this bundle's namespace.
     * @param props.state - `{ phase, payload, message }` from the polling container.
     * @param props.open - whether the popover is showing.
     * @param props.position - popover placement from the container, or null.
     * @param props.anchorRef - ref on the wrapper, used for placement.
     * @param props.handlers - hover/focus/click callbacks for the cell.
     * @returns the wrapper element: the cell, and the popover only while open.
     */
    function QuotaView(props) {
      const wide = props.wide === true;
      const t = props.t;
      const state = props.state !== null && typeof props.state === 'object' ? props.state : { phase: 'loading' };
      const open = props.open === true;
      const handlers = props.handlers !== null && typeof props.handlers === 'object' ? props.handlers : {};
      const byId = windowsById(state);
      const known = WINDOW_KEYS.filter((key) => byId[key.id] !== undefined);
      const ready = state.phase === 'ready' && known.length > 0;

      let headline = { percent: 0, level: 'idle' };
      for (const key of known) {
        const window = byId[key.id];
        if (percentOf(window) > headline.percent) headline = { percent: displayPercent(window), level: levelOf(window) };
      }

      const hint = ready
        ? fill(t('hint'), {
            a: displayPercent(byId.rolling),
            b: displayPercent(byId.weekly),
            c: displayPercent(byId.monthly),
          })
        : t('noData');

      let body;
      if (state.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error') {
        const payload = state.payload;
        const structured = payload !== null && typeof payload === 'object' && typeof payload.ok === 'boolean';
        body = h(
          'div',
          { className: 'dshogq-msg' },
          structured ? messageFor(payload, t) : `${t('retryHint')} ${String(state.message ?? '')}`.trim(),
        );
      } else if (!ready) {
        body = h('div', { className: 'dshogq-msg' }, t('errShape'));
      } else {
        body = h('div', { className: 'dshogq-rows' }, known.map((key) => windowRow(key, byId[key.id], t)));
      }

      const placement =
        props.position !== null && typeof props.position === 'object'
          ? { left: props.position.left, bottom: props.position.bottom, width: props.position.width }
          : { left: 0, bottom: 0, width: POPOVER_WIDTH, visibility: 'hidden' };

      return h(
        'span',
        {
          className: 'dshogq-wrap',
          ref: props.anchorRef,
          onMouseEnter: handlers.enter,
          onMouseLeave: handlers.leave,
        },
        h('style', null, CSS),
        h(
          'button',
          {
            type: 'button',
            className: 'dshogq-cell',
            'data-open': open ? 'true' : 'false',
            'aria-expanded': open,
            'aria-label': `${t('title')} — ${hint}`,
            /* Only while closed: once the popover is up, a native tooltip would
               double it. The rail keeps a text fallback if placement ever fails. */
            title: open ? undefined : hint,
            onFocus: handlers.focus,
            onBlur: handlers.blur,
            onClick: handlers.toggle,
          },
          miniBars(byId),
          wide ? h('span', { className: 'dshogq-pct', 'data-level': headline.level }, `${headline.percent}%`) : null,
        ),
        open
          ? h(
              'div',
              { className: 'dshogq-pop', role: 'group', 'aria-label': t('title'), style: placement },
              h(
                'div',
                { className: 'dshogq-head' },
                h('span', { className: 'dshogq-title' }, t('title')),
                ready ? h('span', { className: 'dshogq-updated' }, fill(t('updatedAt'), { time: clockTime(state.payload.fetchedAt) })) : null,
              ),
              body,
              h('div', { className: 'dshogq-foot' }, t('footer')),
            )
          : null,
      );
    }

    /** Read the Host route once and fold the answer into a render state. */
    async function fetchUsage(signal) {
      const response = await fetch(ROUTE, { headers: { accept: 'application/json' }, signal: signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (payload !== null && typeof payload === 'object' && payload.ok === true && Array.isArray(payload.windows)) {
        return { phase: 'ready', payload: payload, message: '' };
      }
      return { phase: 'error', payload: payload !== null && typeof payload === 'object' ? payload : null, message: '' };
    }

    /** Poll the Host route while the page is visible, plus a countdown heartbeat. */
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
            const next = await fetchUsage(controller.signal);
            if (alive) setState(next);
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

    /** Place the popover above the cell, clamped to the viewport. */
    function usePopoverPosition(open, anchorRef, wide) {
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
          const width = Math.min(POPOVER_WIDTH, Math.max(220, window.innerWidth - 16));
          const left = wide ? rect.left : rect.right + 8;
          setPosition({
            width: width,
            left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
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
      }, [open, anchorRef, wide]);
      return position;
    }

    /**
     * Build the sidebar-foot container bound to a live plugin context.
     * @param ctx - the Client plugin context (`slots` and `locale` present).
     * @returns the React component registered into `sidebar.footer.action`.
     */
    function makeCell(ctx) {
      return function OpenCodeGoQuota(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? FALLBACK[key] ?? key : locales(key), params);

        const state = useQuota();
        const [open, setOpen] = React.useState(false);
        const anchorRef = React.useRef(null);
        const closeTimer = React.useRef(0);
        const position = usePopoverPosition(open, anchorRef, wide);

        const cancelClose = () => {
          if (closeTimer.current) {
            window.clearTimeout(closeTimer.current);
            closeTimer.current = 0;
          }
        };
        const openNow = () => {
          cancelClose();
          setOpen(true);
        };
        const closeSoon = () => {
          cancelClose();
          closeTimer.current = window.setTimeout(() => {
            closeTimer.current = 0;
            setOpen(false);
          }, 140);
        };

        React.useEffect(() => cancelClose, []);

        React.useEffect(() => {
          if (!open) return undefined;
          const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
          };
          const onPointer = (event) => {
            const node = anchorRef.current;
            if (node !== null && node !== undefined && !node.contains(event.target)) setOpen(false);
          };
          document.addEventListener('keydown', onKey);
          document.addEventListener('pointerdown', onPointer);
          return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
          };
        }, [open]);

        return h(QuotaView, {
          wide: wide,
          t: t,
          state: state,
          open: open,
          position: position,
          anchorRef: anchorRef,
          handlers: {
            enter: openNow,
            leave: closeSoon,
            focus: openNow,
            blur: closeSoon,
            toggle: () => (open ? setOpen(false) : openNow()),
          },
        });
      };
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        /** Copy table for the active locale, read live through the locale service. */
        const readCopy = () => {
          try {
            return String(ctx.locale.getLocale().active || '').toLowerCase().indexOf('zh') === 0 ? COPY.zh : COPY.en;
          } catch (error) {
            return COPY.en;
          }
        };

        for (const locale of Object.keys(COPY)) {
          ctx.effect(() => ctx.locale.register(NS, locale, COPY[locale]), `opencode-go-quota: locale ${locale}`);
        }

        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            {
              name: 'sidebar.footer.action',
              id: 'opencode-go-quota',
              order: 40,
              label: () => readCopy().title,
              locale: NS,
            },
            makeCell(ctx),
          ),
        );
      },
    };
  },
});
