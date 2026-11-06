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

    /**
     * The official DeepSeek mark — the whale — copied verbatim from the Harness
     * primitives (FISH_LOGO_PATH), so the version cell wears the same artwork
     * as the sidebar brand instead of an invented one. Native box: 23.16 × 17.04.
     */
    const DEEPSEEK_MARK_PATH =
      'M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z';

    /**
     * The third-party vendors' own marks.
     *
     * Agnes publishes /images/biglogo.svg: a disc with the swoosh and dot cut
     * out. The cut-outs are painted with the popover surface token instead of
     * baked white, so the logo follows the theme like every other glyph here.
     * SenseNova ships only a 65 × 65 favicon, inlined as a data URI so the
     * popover renders without a network round trip.
     */
    const AGNES_DISC_PATH =
      'M141.65 283.3C219.881 283.3 283.3 219.881 283.3 141.65C283.3 63.4189 219.881 0 141.65 0C63.4189 0 0 63.4189 0 141.65C0 219.881 63.4189 283.3 141.65 283.3Z';
    const AGNES_SWOOSH_PATH =
      'M42.67 168.24C42.67 168.24 25.78 220.34 56.91 225.59C88.04 230.84 139.65 215.87 196.7 106.67C196.7 106.67 189.66 140.96 185.83 160.61C184.67 166.59 179.44 170.92 173.35 170.97L165.74 171.02C163.5 171.04 162.65 173.9 164.49 175.18C171.7 180.17 180.95 190.98 182.43 213.89C182.75 218.78 187.89 221.92 192.36 219.9C194.36 219 196.3 217.44 197.79 214.82C199.04 212.63 199.62 210.11 199.72 207.59L198.69 198.04C198.14 192.98 201.17 188.27 205.95 186.54C212.71 184.09 221.84 178.96 226.31 168.44C226.84 167.2 225.61 165.91 224.34 166.37C219.82 167.99 211.23 170.67 203.76 170.63C201.54 170.62 199.86 168.6 200.18 166.4L210.55 93.9502C211.15 89.7802 207.99 86.0002 203.78 85.9102C201.44 85.8602 198.61 86.1502 195.36 87.1202C188.09 89.2902 181.21 92.9602 177.44 100.2C159.64 134.44 74.4 237.07 42.67 168.24Z';
    const AGNES_DOT_PATH =
      'M197.34 71.25C207.016 71.25 214.86 63.406 214.86 53.73C214.86 44.0539 207.016 36.21 197.34 36.21C187.664 36.21 179.82 44.0539 179.82 53.73C179.82 63.406 187.664 71.25 197.34 71.25Z';
    /** Volcengine's own mark: the blue/cyan peaks from the vendor's favicon
        (portal.volccdn.com/obj/volcfe/misc/favicon.png), inlined as a data URI
        so the Ark cell renders without a request. */
    const VOLCENGINE_MARK =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAjWSURBVHhe7ZtpbFVFFMfHuC8fXBPjFj8YF74YFaMxflAjJsbEnQ8GDCJaet9rtRUVoghEcUNcoxWXiBHU4BLFEAPuWheCIigo7XuvCxREhYiiaHA51/9/7ky5nTe3vX23xGfbk/zS17vMnTnnf87M3NeqYRu2YasumxgereqkCZxojgwxC+RmdVsYqpw8Zo4MJQt3wcDfVTfBAYGsVjXhPubEELF6GQEHbFPXwQF1IB+eZc4MEauVBtVA+YNG/pR7zZkhYoG81e2A67UDvlKNsrc5O8itVo6DA37V0qcD8kQEn880Vwxyy0nQHX2L/l1mmisGuQWysMwBTINaWYbZYHdz1SC1mvAoDPQnVe84QKeD/IVUGGmuHKSWl/E62sz7uAMIVRHIrebKQWo5ebVM/hY6JpBmNTrc1Vw9yKxejoADNpXJ3xKlwXakyEnmjkFmgYxNlL9FL4rCKeaO/4HlwkPNp74tL88lyt8STYdvmzuq3IJwtGqQjZDs+eZIstXLIVDAhkT5W5gGgfymF0tVb4G8rG5hx+UZcyTZ8nKZ3vj4Bu0SqaDO3FmlxoIWyGads4G0I7f3N2f8Fshck999EzlgkbmzSi0nV+qCRslGsr3AnCm3CXIgJL0utQKi2WArOMa0UIUWyPzuiPJnXh42Z8otLxfq3O+t+rtEKghMC1VmN4QHwwHruyOqf8q3iW918tKUWv6WyAGvmRaqzOrk0h5yZmQp27yM0ueLkO4aOUN/niT7YiAtqeVvoWJYYwI5UrdTVRbIk2URZcRqzVudoryp2uV3FYYHqCuwx9fOiV2bBl4f7RDH6TarxhpR0AJZWxZRdnaCfKaWywkY/Ba1Bb9vkcvVmHBGv+VvoVMDecE8uUqMBY2DdyPK36+WX9Qr2Ox04fNGsAorumtlZVTVKyBKgx/VRDncPL0KLJA53ogGoAYsAXRAB1gFJgMed69Pg02DnIwxT/+PLRfuBwe0egsaBzlFRK3GTw6+DXSCR8AE4F6fFjo7wB6iKiyQ8xILGgfZBNaBkoFKeANcC9zr00JnB9Klp17XinIy6s1M9a0cZI7sZKuV+xMLGge5CHDQ1gFUwEpwI5gIfPf1BZ2tN1BykenFDitAGYJzreFV5shONL6zD2RVlJMOlD+/4voKUP7WAdYJD4GsaZBH7YnbOsxGBSyvt+JcQRaYozvRAjm7V/k/DNaC+OAJFfE6uAawULr3pkHXHOmA83dsuEpyiVqP46Qom7DwOsycyWBfYs++IWE5mwvv6VX+C0Fc/hYqYDloRIHMkgZ66sUUbK2ExdiPOMZi+x0oyFhzpkJbi1VbUQpo8FlzZIfVy55QwAqv/DmoSWAF4GBdB7CDTIvZcEDWNLBfo2/E8rokRR19PoOOKMk8fa5ia5PL1M+6oV9Uq7PwyMlp8P7f3gUNB/Ug4OA5WNcBhMp4FQ5gGrj3pyVKgxbdny6kI5/XDmz7RcwUmWaDgjylNqEhn5xyMj3anTkwpzmo14BP/hbWhmVwwPWgFp/ddtKgaw/uP19Gqg1yh+6rbZ+O4PM7wotNj/tpHSguRRQZSuoHNhpbeEwPd8ODP02UfwM6xRz3yd9CZbCTs0AWFVCBk5D762UpalXPZzANGMSKrIg5lh60nixir2/lxK+q+JWVT/4czH1wgF35xTvkwnZfBlkcwOl2qmxXLUhHd7pl8ArSqYPZb2uTx7slRSfo4oI9P41fVSVVf+Y/B2WLUW8wDZYCKqnSNOB9TIUPQHzFSXYEr3zB1KutREUtYH0fl5SeXiA1WiAfevOfneFglgHf/O9ChZC7oZgsKrgazEUbHKz7jGg26OcfXBVkVI+KShjRdbJa3ROeqWpka6L8mdNp5G/pQsdflH8yOYBrjhmgFcT7TBjEoqxJXMt4rSSze1RUotNA/lBz5OPEuZvHXwJp5G+hUj4FdGiWNODs8xGc6UsDBrM1PNeMrg/rCPeCx77WU1+8IUaUkeX87osWO8ENCnM6jfwtNmIzQdY0mA98zmcwi/KAGWEf1iLn6IG6FVXP24A57lu+svN3AjrKlWFfMHefB1lWhXw+neh7PtOggPRlcPu0otxbJn9Cz1Levcmfg/AVor6gbJshX1bzLGnANGI6uQqkQxjQNVgt9mqrwz3ggC8T5X8f8DnAPvwT0B/5W9jBIrgdTsjyosQGISkNCjLLjDTBOuR01Y4Fjit/FpEvAKc+n/zZacqP1/ZX/hbOBs+CrGlwF/ClQbScX65CrGITrYT1vZ43HShrru35AN/+nZ2eh85XIn8L0+B9tFELKn1HoAsx7l+KadVVIoPK4LZjE+e1MNwVDvhEv7qO30hvUgGs/knyZ+42A3cK6g+MGOfxaSBTGsABCxKCES2KppkRO9Ymp8I728s2MPyd7/C4v0+S/3RQAJXK38JOzwVZ04CLMfaFwYu3r4OLIL/k+4OrkkxNlL99i5skf3Y6i/wtVNB7gKqqNA30bhR8Dtw0YDDb5E98PsWMOmZFrO998mcjD0FSvqiwk4SdziJ/C6PWAvgPE1lng6QNWZQGU82ojRVkBBzwu9djKzH4pFfY7CQ7y067M0elcDZ4Altbruzc56WFDpiFdpLSoCDvm5Eba5Mb9EsP92LKmu/1k+TPTj4NBkL+Fra1BJ3nPj9rGnDqdmuaDrJsU50IereVZLH63rnQyv9RkCR/5uo76OxAyN9CJX0DJhsnuM9NA/vGYshX725wOK7oDVdDNPj1cix++bVM/uwIv9ObAnwdoSqmgjVgoORP2EE6tAkO8Dk+LbyXX77owgfiz6ADCgi6tna5ThcGmy8WFpDFwJf79gFPAHo4ft9AwGfzG2U+O0sasHZxCmdw4+1rxSINWsLjKf9m9RsOsDhYmA6bAfObMmc+xeHraMK1/08gfu9AwIBQVVxfcJHlPj8N9oUtHen2kePbBtr457fFcDScMA6FcGwZt4MaUOfAv+9tBCtAJ/DdmxW2O1vGYGVX/vy0jAdzQBdw2++Q8XrvM2zDNpRNqX8B8xousZ2WPKwAAAAASUVORK5CYII=';    const SENSENOVA_MARK =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAABBCAYAAACO98lFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFcSURBVHhe7ZIxSkNRFEQ/hK+lLsE2qbIEwQVYG5ssJTuykk9I4SIUkk7EVUiUn/kydtNlHlxhDpz6Due97nFxGP+LXSvUsapysh91rKqc7Ecdqyon+1HHqsrJftSxqnKyH3WsqpzsRx2rKif7Uceqysl+1LGqcrIfdayqnOxHHasqJ/tRx6rKyX7Usapysh91rKqc7Ecdqyon+1HHqsrJftSxqnKyH3WsqpzsRx2rKif7Uceqysl+1LFzXc0PLw/z/cZtf3y2OzsOt00iTIPZ2MrFzzC6nUIkQiIkwq+JABMBJgJMBJgIMBFgIsBEgIkAEwEmAkwEmAgwEWAiwESAfxHe3d7fvW4ux6cbt9efu9Ht1ce2yYN1U11V/VwR2G6rX5sIE4kAEgEkAkgEkAggEUAigEQAiQASASQCSASQCCARQCKARACJABIBJALov7bL/ntYu10t9g18W54AFzqCHLdkl1gAAAAASUVORK5CYII=';
    /** Host routes serving the normalized payloads. */
    const USAGE_ROUTE = '/opencode-go-quota/usage';
    const MODELS_ROUTE = '/opencode-go-quota/models';
    const VERSION_ROUTE = '/opencode-go-quota/version';
/** Host action: regenerate the auto-managed model routes (POST only). */
const SYNC_ROUTE = '/opencode-go-quota/models/sync';
/** Third-party provider catalogs (Agnes / SenseNova). */
const PROVIDERS_ROUTE = '/opencode-go-quota/providers';
    /** Volcengine Ark Agent Plan: AFP quota, and the plan's models plus usage. */
    const ARK_USAGE_ROUTE = '/opencode-go-quota/ark/usage';
    const ARK_CATALOG_ROUTE = '/opencode-go-quota/ark/catalog';
    /** Where the previous visit's per-provider id lists live. */
const PROVIDERS_SNAPSHOT_KEY = 'opencode-go-quota:providers:v1';
    /** Where the previous visit's Ark model snapshot lives. */
    const ARK_SNAPSHOT_KEY = 'opencode-go-quota:ark-models:v1';
    /** Which sidebar cells this browser asked to see; the gear is never in it. */
    const PANEL_STORAGE_KEY = 'opencode-go-quota:panels:v1';
    /** The two links the catalog popover's footer offers, instead of the
        documentation being recited inline. */
    const CONSOLE_URL = 'https://opencode.ai/console';
    const DOCS_URL = 'https://opencode.ai/zh/go';
    /** Volcengine's Agent Plan seat: the console page and the API this cell reads. */
    const ARK_CONSOLE_URL = 'https://ark.volcengine.com/region:cn-beijing/subscription/agent-plan';
    const ARK_DOCS_URL = 'https://ark.volcengine.com/region:cn-beijing/docs/get-afp-usage-api';
    /** Default cadence for the meters; the clock cell lets the reader change it. */
    const POLL_MS = 60000;
    /**
     * The intervals the clock cell offers, in display order. `0` disables
     * automatic polling entirely: the usage popover then reads only when its
     * own refresh button is pressed.
     */
    const POLL_OPTIONS = [
      { ms: 30000, key: 'poll30s' },
      { ms: 60000, key: 'poll1m' },
      { ms: 120000, key: 'poll2m' },
      { ms: 300000, key: 'poll5m' },
      { ms: 600000, key: 'poll10m' },
      { ms: 1800000, key: 'poll30m' },
      { ms: 0, key: 'pollManual' },
    ];
    /** Where the reader's choice lives; one value per browser. */
    const POLL_STORAGE_KEY = 'opencode-go-quota:pollMs:v1';
    /** How long the "interval saved" confirmation stays before it fades out. */
    const NOTICE_MS = 3000;
    /**
     * A same-origin read that has not answered in this long is reported as an
     * error. The Host caches every route and answers in milliseconds; anything
     * slower than this is a stalled route, and without a deadline the cell would
     * sit on "reading" until the page was reloaded.
     */
    const REMOTE_TIMEOUT_MS = 30000;
    /**
     * How long an errored same-origin read waits before retrying itself. The
     * upstream gateway hangs for seconds at a time; without this, one blip left
     * the catalog and version cells red until the reader pressed refresh.
     */
    const ERROR_RETRY_MS = 45000;
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
    /** The version view: one column wide enough for release-note prose. */
    const VERSION_WIDTH = 440;
    /** The version view with a release opened: list + a wide reading pane. */
    /** The Go popover: the meters column alone, then that column plus a detail. */
    const GO_WIDTH = 300;
    const GO_PANEL_WIDE = 560;
    /** The Ark popover: the meters column alone, then that column plus a detail. */
    const ARK_WIDTH = 300;
    const ARK_PANEL = 320;
    const ARK_PANEL_USAGE = 420;
    const ARK_PANEL_WIDE = 560;
    /** Where the previous visit's model snapshot lives. */
    const SNAPSHOT_KEY = 'opencode-go-quota:models:v1';
    /** The three metered windows, in display order. */
    const WINDOW_KEYS = [
      { id: 'rolling', label: 'window5h' },
      { id: 'weekly', label: 'windowWeekly' },
      { id: 'monthly', label: 'windowMonthly' },
    ];
    /** The four rolling AFP windows Volcengine reports, in display order. */
    const ARK_WINDOWS = [
      { id: 'fiveHour', label: 'arkWindow5h' },
      { id: 'daily', label: 'arkWindowDaily' },
      { id: 'weekly', label: 'arkWindowWeekly' },
      { id: 'monthly', label: 'arkWindowMonthly' },
    ];
    /**
     * Every cell the settings popover can switch, in sidebar order.
     *
     * The gear itself is deliberately absent: it is the one cell that can never
     * be hidden, because it is also the way back for everything else.
     */
    const PANEL_IDS = [
      { id: 'go-usage', labelKey: 'title' },
      { id: 'ark', labelKey: 'arkTitle' },
      { id: 'providers', labelKey: 'providersTitle' },
    ];

    /** English fallback, so a missing locale face never blanks the control. */
    const FALLBACK = {
      title: 'OpenCode Go',
      window5h: '5-hour',
      windowWeekly: 'Weekly',
      windowMonthly: 'Monthly',
      resetIn: 'resets in {time}',
      remaining: '{percent}% left',
      loading: 'Reading…',
      noData: 'No data yet',
      updatedAt: 'updated {time}',
      checkedAt: 'checked {time}',
      footer: 'Go plan',
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
      refresh: 'Refresh',
      liveSection: 'Every model (live)',
      snapFirstNote: 'First read — this list is now the snapshot ({n} models). Press refresh to compare.',
      diffSection: 'Difference',
      added: 'Added',
      removed: 'Removed',
      none: 'none',
      consoleLink: 'Console',
      docsLink: 'Go docs',
      syncLabel: 'Update models',
      syncBusy: 'Updating…',
      syncHint: 'Re-probe out-of-catalog models and regenerate the model columns',
      versionTitle: 'DSH version',
      panelBack: 'Back to panels',
      modelsButton: 'Models',
      usageWord: 'Usage',
      arkUsageWindow: 'Last {days} days',
      usageToggleHint: 'Open the AFP usage in its own panel',
      modelsToggleHint: 'Show or hide the model list',
      verCurrent: 'Current',
      verLatest: 'Latest',
      verUnknown: 'unknown (installation not found)',
      verUpdateYes: 'update available',
      verUpdateNo: 'up to date',
      verNone: 'Nothing published is newer than this build',
      verChannelBeyond: 'newer than latest',
      verChanges: 'What changed',
      verNoNotes: '(no notes published)',
      providersTitle: 'Third-party catalogs',
      providersHint: 'Agnes / SenseNova model lists',
      providersEmpty: 'No provider answered yet.',
      providersFirst: 'First read — this is now the snapshot ({n} models). Press refresh to compare.',
      providerAdded: '{n} new',
      providerDocs: 'from docs',
      providerDocsHint: 'Read from the published documentation index; the live catalog needs a key.',
      providerSnapshot: 'snapshot',
      providerSnapshotHint: 'A dated list taken from the official docs; it changes rarely and needs no key.',
      providerFailed: 'failed',
      modalityText: 'Text',
      modalityImage: 'Image',
      modalityVideo: 'Video',
      providersFooter: 'agnes-ai.com · platform.sensenova.cn',
      agnesDocs: 'Agnes docs',
      sensenovaDocs: 'SenseNova docs',
      usageHint: 'Usage and quota are console-only — neither provider exposes an API for them.',
      /* Volcengine Ark Agent Plan. */
      arkTitle: 'Volcengine Ark plan',
      arkHint: 'Agent Plan AFP quota',
      arkWindow5h: '5-hour',
      arkWindowDaily: 'Today',
      arkWindowWeekly: 'Weekly',
      arkWindowMonthly: 'Monthly',
      arkUsedOf: '{used} / {quota} AFP',
      arkNoWindow: 'no window running',
      arkPlan: 'Plan {plan}',
      arkLiveSection: 'Plan models',
      arkUsageSection: 'Usage · {days} d',
      arkUsagePeriod: '{from} → {to}',
      arkUsageTotal: '{tokens} tokens · {images} images',
      arkUsageEmpty: 'No usage recorded in this window.',
      arkUsageHint: 'Aggregated from the plan usage feed.',
      arkConsoleLink: 'Ark console',
      arkDocsLink: 'Agent Plan docs',
      errDisabled: 'This half is turned off in the plugin config.',
      /* Panel visibility, reachable from the gear that never hides. */
      panelTitle: 'Panels',
      panelHint: 'Choose which cells to show',
      panelAll: 'Select all',
      panelInvert: 'Invert',
      panelEmpty: 'All hidden — press Select all to bring them back.',
      intervalTitle: 'Refresh interval',
      intervalHint: 'How often the meters read',
      poll30s: '30 seconds',
      poll1m: '1 minute',
      poll2m: '2 minutes',
      poll5m: '5 minutes',
      poll10m: '10 minutes',
      poll30m: '30 minutes',
      pollManual: 'Manual only',
      intervalSaved: 'Set to refresh every {value}',
      intervalSavedManual: 'Set to refresh only when asked',
    };

    /** Dictionaries registered into the Client locale service under `NS`. */
    const COPY = {
      zh: {
        title: 'OpenCode Go',
        window5h: '时段（5 小时）',
        windowWeekly: '本周',
        windowMonthly: '本月',
        resetIn: '{time}后重置',
        remaining: '剩余 {percent}%',
        loading: '读取中…',
        noData: '暂无数据',
        updatedAt: '{time} 更新',
        checkedAt: '{time} 检查',
        footer: 'Go 套餐',
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
        refresh: '刷新',
        liveSection: '全部模型（实时）',
        snapFirstNote: '首次获取，已把本次清单记为快照（{n} 个）。之后点刷新即可对比。',
        diffSection: '差异对比',
        added: '新增',
        removed: '下架',
        none: '无',
        consoleLink: '控制台',
        docsLink: 'Go 官方文档',
        syncLabel: '更新模型',
        syncBusy: '更新中…',
        syncHint: '重新探测目录外模型的协议 / 视觉 / 推理，并重建模型分栏',
        versionTitle: 'DSH 版本',
        panelBack: '返回板块设置',
        modelsButton: '模型',
        usageWord: '用量',
        arkUsageWindow: '近 {days} 天',
        usageToggleHint: '在独立面板里查看 AFP 用量',
        modelsToggleHint: '显示或隐藏模型清单',
        verCurrent: '当前',
        verLatest: '最新',
        verUnknown: '未知（找不到安装位置）',
        verUpdateYes: '有新版本',
        verUpdateNo: '已是最新',
        verNone: '当前版本已是最新发布',
        verChannelBeyond: '晚于 latest',
        verChanges: '更新内容',
        verNoNotes: '（该版本没有发布说明）',
        providersTitle: '第三方目录',
        providersHint: 'Agnes / SenseNova 模型清单',
        providersEmpty: '还没有提供方返回数据。',
        providersFirst: '首次读取，已记为快照（{n} 个）。点刷新可对比。',
        providerAdded: '新增 {n}',
        providerDocs: '来自文档',
        providerDocsHint: '这份清单读自官方文档索引；实时接口需要 API Key。',
        providerSnapshot: '快照',
        providerSnapshotHint: '取自官方文档的带日期清单；模型很少变动，因此无需 API Key。',
        providerFailed: '读取失败',
        modalityText: '文本',
        modalityImage: '图片',
        modalityVideo: '视频',
        providersFooter: 'agnes-ai.com · platform.sensenova.cn',
        agnesDocs: 'Agnes 文档',
        sensenovaDocs: 'SenseNova 文档',
        usageHint: '用量与配额只能登录控制台查看（两家均未开放查询接口）。',
        arkTitle: '火山方舟套餐',
        arkHint: 'Agent Plan AFP 额度',
        arkWindow5h: '时段（5 小时）',
        arkWindowDaily: '今日',
        arkWindowWeekly: '本周',
        arkWindowMonthly: '本月',
        arkUsedOf: '{used} / {quota} AFP',
        arkNoWindow: '当前无活动窗口',
        arkPlan: '套餐 {plan}',
        arkLiveSection: '套餐模型',
        arkUsageSection: '用量 · {days} 天',
        arkUsagePeriod: '{from} → {to}',
        arkUsageTotal: '{tokens} tokens · {images} 张图片',
        arkUsageEmpty: '这段时间没有用量记录。',
        arkUsageHint: '按套餐用量明细汇总。',
        arkConsoleLink: '方舟控制台',
        arkDocsLink: '套餐文档',
        errDisabled: '这一块在插件配置里被关掉了。',
        panelTitle: '显示板块',
        panelHint: '选择侧边栏底部显示哪些格子',
        panelAll: '全选',
        panelInvert: '反选',
        panelEmpty: '已全部关闭——点「全选」恢复。',
        intervalTitle: '刷新间隔',
        intervalHint: '用量格多久读一次',
        poll30s: '30 秒',
        poll1m: '1 分钟',
        poll2m: '2 分钟',
        poll5m: '5 分钟',
        poll10m: '10 分钟',
        poll30m: '30 分钟',
        pollManual: '仅手动',
        intervalSaved: '设置 {value}刷新用量成功',
        intervalSavedManual: '已切换为仅手动刷新用量',
      },
      en: FALLBACK,
    };

    const CSS = [
      /* Cell chrome copies the host's own sidebar-foot trigger and the model
         selector's trigger: no border, no background, host radius and hover
         token, host focus ring. Nothing here is an invented value. */
      '.dshogq-wrap{display:inline-flex;align-items:center;position:relative;flex:0 0 auto;margin:0 3px;}',
      /* The settings gear is pulled to the sidebar's left padding line; the other
         cells keep their symmetric margin so the rest of the row stays centred. */
      '.dshogq-wrap-flush{left:-5px;}',
      '.dshogq-cell{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 6px;',
      'border-radius:var(--dsw-radius-sm);border:none;outline:none;background:0 0;cursor:pointer;',
      'color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;font-weight:400;line-height:20px;',
      'white-space:nowrap;font-variant-numeric:tabular-nums;}',
      '.dshogq-cell[data-icon="true"]{padding:0 6px;}',
      '.dshogq-cell:hover,.dshogq-cell[data-open="true"]{background:var(--dsw-alias-interactive-bg-hover);}',
      '.dshogq-cell:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      '.dshogq-bars{display:flex;align-items:stretch;gap:2px;height:14px;flex:none;}',
      '.dshogq-bar{position:relative;width:3px;border-radius:1px;',
      'background:var(--dsw-alias-border-l2);overflow:hidden;}',
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
      /* The cadence toggle sits in the meters popover's footer, left of the
         version string: a quiet 18px clock that lights up while the interval
         list is showing. */
      '.dshogq-clock{display:inline-flex;align-items:center;justify-content:center;flex:none;width:24px;height:24px;',
      'padding:0;border:none;outline:none;background:0 0;border-radius:var(--dsw-radius-xs);',
      'color:var(--dsw-alias-label-tertiary);cursor:pointer;}',
      '.dshogq-clock:hover,.dshogq-clock[data-on="true"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dshogq-clock:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      /* The version button in the settings footer: the DeepSeek mark and, when
         npm has something newer, the same update dot the old cell carried. */
      '.dshogq-verbtn{display:inline-flex;align-items:center;justify-content:center;gap:3px;flex:none;height:24px;',
      'padding:0 3px;border:none;outline:none;background:0 0;border-radius:var(--dsw-radius-xs);',
      'color:var(--dsw-alias-label-tertiary);cursor:pointer;}',
      '.dshogq-verbtn:hover,.dshogq-verbtn[data-on="true"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dshogq-verbtn:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      /* A stacked view needs a back arrow in the popover head. */
      '.dshogq-back{display:inline-flex;align-items:center;justify-content:center;align-self:center;flex:none;',
      'width:18px;height:18px;margin-right:-2px;padding:0;border:none;outline:none;background:0 0;cursor:pointer;',
      'border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-tertiary);font-size:15px;line-height:1;}',
      '.dshogq-back:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dshogq-back:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      /* The "interval saved" confirmation under the popover head: it fades on
         its own, so nothing has to be dismissed. */
      '.dshogq-toast{margin:2px 8px 4px;padding:4px 8px;border-radius:var(--dsw-radius-sm);',
      'background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-state-success-primary);',
      'font-size:11px;line-height:16px;animation:dshogq-toast-fade 3s var(--ds-ease-in-out) forwards;}',
      '@keyframes dshogq-toast-fade{0%{opacity:0;transform:translateY(-2px);}8%{opacity:1;transform:none;}',
      '75%{opacity:1;}100%{opacity:0;}}',
      '.dshogq-badge{width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-state-success-primary);flex:none;}',
      /* Popover chrome copies the host's menu: no border, one elevation token,
         4px padding, .5px hairlines, host scrollbar tokens, hidden overflow so
         the rounded corners clip the scrolling child. */
      '.dshogq-pop{position:fixed;z-index:1100;box-sizing:border-box;width:max-content;',
      'min-width:200px;max-width:min(560px,calc(100vw - 32px));max-height:min(420px,calc(100vh - 96px));',
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
            /* The vendor's own mark leads its section; the label follows on the text
         baseline, so logo and name read as one line. */
      '.dshogq-sectmark{display:inline-flex;align-items:center;align-self:center;flex:none;}',
      '.dshogq-vendormark{display:block;flex:none;}',
      '.dshogq-vendorpng{border-radius:3px;}',
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
      /* The Ark column is as tall as its four meters, so its detail pane is
         allowed to match that height instead of stopping at the catalog's cap. */
      '.dshogq-pane[data-tall="true"] .dshogq-detailbody{max-height:330px;}',
      /* A cell glyph that carries two marks (a plan logo, then its meter bars). */
      '.dshogq-mark{display:inline-flex;align-items:center;gap:6px;flex:none;}',
      /* The vendors' own marks are raster, so they are drawn as images; the OpenCode
         and DeepSeek marks stay inline SVG because they follow the text colour. */
      '.dshogq-markimg{display:block;flex:none;}',
      /* The corner button that opens a meter popover's model section. */
      '.dshogq-corner{display:flex;justify-content:flex-start;gap:4px;padding:2px 2px 0;flex-wrap:wrap;}',
      '.dshogq-corner-col{flex-direction:column;align-items:stretch;}',
      '.dshogq-corner-col .dshogq-cornerbtn{width:100%;justify-content:flex-start;}',
      '.dshogq-corner-col .dshogq-caret{margin-left:auto;}',
      '.dshogq-cornerbtn{display:inline-flex;align-items:center;gap:4px;padding:3px 6px;border:none;outline:none;',
      'background:0 0;border-radius:var(--dsw-radius-xs);font:inherit;font-size:11px;line-height:16px;',
      'color:var(--dsw-alias-label-tertiary);cursor:pointer;}',
      '.dshogq-cornerbtn:hover,.dshogq-cornerbtn[data-on="true"]{background:var(--dsw-alias-interactive-bg-hover);',
      'color:var(--dsw-alias-label-primary);}',
      '.dshogq-cornerbtn:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
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
      '.dshogq-sync{border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:11px;line-height:1.5;padding:1px 6px;border-radius:4px;cursor:pointer;white-space:nowrap;flex:none;}',
      '.dshogq-sync:hover:not(:disabled){background:var(--dsw-alias-fill-l2);}',
      '.dshogq-sync:disabled{opacity:.6;cursor:default;}',
      '.dshogq-footrow{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;}',
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
      '.dshogq-note{padding:4px 8px 6px;font-size:12px;color:var(--dsw-alias-label-tertiary);}',
      /* Panel switches: a host-style row, a two-state pill, no invented chrome. */
      '.dshogq-toggle{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:none;outline:none;',
      'background:0 0;border-radius:var(--dsw-radius-xs);cursor:pointer;color:inherit;font:inherit;font-size:12px;',
      'line-height:18px;text-align:left;}',
      '.dshogq-toggle:hover{background:var(--dsw-alias-interactive-bg-hover);}',
      '.dshogq-toggle:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      /* Bulk actions above the switch list. */
      '.dshogq-paneltools{display:flex;align-items:center;gap:6px;padding:2px 8px 4px;}',
      '.dshogq-tool{border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);',
      'font:inherit;font-size:11px;line-height:1.5;padding:1px 8px;border-radius:var(--dsw-radius-sm);cursor:pointer;}',
      '.dshogq-tool:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}',
      '.dshogq-tool:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      '.dshogq-toolcount{margin-left:auto;font-size:10px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;}',
      '.dshogq-panelnote{min-height:19px;padding:0 8px 2px;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-togglelabel{color:var(--dsw-alias-label-primary);}',
      '.dshogq-toggle[data-on="false"] .dshogq-togglelabel{color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-switch{position:relative;flex:none;width:24px;height:14px;border-radius:7px;',
      'background:var(--dsw-alias-border-l1);transition:background .12s var(--ds-ease-in-out);}',
      '.dshogq-switch[data-on="true"]{background:var(--dsw-alias-brand-primary);}',
      '.dshogq-knob{position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;',
      'background:var(--dsw-alias-bg-overlay);box-shadow:0 0 0 .5px var(--dsw-alias-border-l1);',
      'transition:left .12s var(--ds-ease-in-out);}',
      '.dshogq-switch[data-on="true"] .dshogq-knob{left:12px;}',
      '.dshogq-switchlabel{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      /* Ark usage rows: name, tokens, a hairline; the unit is quiet, the number is not. */
      '.dshogq-usagerow{display:flex;align-items:baseline;gap:8px;padding:3px 8px;font-size:11px;}',
      '.dshogq-usagerow+.dshogq-usagerow{border-top:.5px solid var(--dsw-alias-border-l1);}',
      '.dshogq-usagename{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
      'font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-secondary);}',
      '.dshogq-usageunit{flex:none;color:var(--dsw-alias-label-tertiary);font-size:10px;}',
      '.dshogq-usageval{margin-left:auto;flex:none;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);}',
      /* A hairline between the Ark meters and the catalog rows in one column. */
      '.dshogq-sep{height:.5px;margin:4px 6px;background:var(--dsw-alias-border-l1);flex:none;}',
      /* The version view is a document, not a menu: one wide column, taller, and
         set at reading size instead of the popover's 11px fine print. */
      '.dshogq-pop[data-size="large"]{max-width:min(560px,calc(100vw - 32px));max-height:min(560px,calc(100vh - 64px));}',
      '.dshogq-verbody{padding:2px 2px 2px;}',
      '.dshogq-vermilestones{border-bottom:.5px solid var(--dsw-alias-border-l1);padding-bottom:4px;}',
      '.dshogq-subhead{display:flex;align-items:baseline;gap:8px;padding:8px 8px 2px;font-size:11px;font-weight:500;',
      'color:var(--dsw-alias-label-secondary);}',
      '.dshogq-verbody .dshogq-ver{padding:8px 8px 6px;}',
      '.dshogq-verbody .dshogq-logtext,.dshogq-verbody .dshogq-logitem{font-size:12px;line-height:19px;}',
      '.dshogq-verbody .dshogq-logheading{font-size:12px;line-height:19px;}',
      /* The third-party sections split their models by output kind. */
      '.dshogq-groupwrap+.dshogq-groupwrap{margin-top:2px;}',
      '.dshogq-group{display:flex;align-items:baseline;gap:6px;margin:0 0 2px;font-size:10px;font-weight:500;',
      'letter-spacing:.04em;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-groupcount{font-weight:400;font-variant-numeric:tabular-nums;}',
      /* The third-party panel: one column per provider, and inside a column one
         vertical list per output kind. Wrapping columns let three providers exist
         without any of them being clipped. */
      '.dshogq-vendorgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(248px,1fr));',
      'gap:2px 20px;padding:2px 4px 0;align-items:start;}',
      '.dshogq-vendorgrid .dshogq-sect{padding:2px 4px 6px;}',
      '.dshogq-vendorgrid .dshogq-sect+.dshogq-sect{border-top:0;}',
      '.dshogq-sectname{color:var(--dsw-alias-label-primary);}',
      '.dshogq-sectsub{display:flex;align-items:center;gap:6px;padding:2px 0 3px;font-size:10px;',
      'color:var(--dsw-alias-label-tertiary);min-height:14px;}',
      '.dshogq-modelet{display:flex;align-items:baseline;gap:8px;padding:0 0 0 2px;',
      'font-family:var(--ds-font-family-code);font-size:11px;line-height:17px;color:var(--dsw-alias-label-secondary);}',
      '.dshogq-modeletname{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dshogq-modelet[data-tone="new"] .dshogq-modeletname{color:var(--dsw-alias-brand-primary);}',
      '.dshogq-modelet[data-tone="new"] .dshogq-modeletname::before{content:"+";margin-right:3px;}',
      '.dshogq-modeletmeta{margin-left:auto;flex:none;font-size:10px;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-vgroup+.dshogq-vgroup{margin-top:5px;}',
      /* The model panel: the catalog itself, laid out down columns so a 29-model
         list fits without scrolling and the diff reads as its footnote. */
      '.dshogq-titlemark{display:inline-flex;align-items:center;align-self:center;flex:none;}',
      '.dshogq-modellist{column-count:3;column-gap:18px;padding:6px 8px 8px;}',
      '.dshogq-modellistitem{display:block;break-inside:avoid;font-family:var(--ds-font-family-code);',
      'font-size:11px;line-height:18px;color:var(--dsw-alias-label-secondary);',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dshogq-diffblock{border-top:.5px solid var(--dsw-alias-border-l1);padding:6px 8px 4px;}',
      /* Version view: one row grid shared by the milestones and the release list,
         plus a wide reading pane for whichever release is open. */
      /* Release notes: a full-height panel whose width follows the text, so the
         lines do not wrap into a narrow ribbon. */
      '.dshogq-pop[data-size="fullheight"]{width:max-content;max-height:none;height:calc(100vh - 16px);}',
      '.dshogq-notebody{flex:1 1 auto;min-height:0;overflow-y:auto;padding:6px 12px 10px;}',
      '.dshogq-titlechip{display:inline-flex;align-items:center;flex:none;}',
      '.dshogq-vercol{display:flex;flex-direction:column;min-width:0;}',
      '.dshogq-vgrid{display:flex;flex-direction:column;}',
      '.dshogq-vrow{display:grid;grid-template-columns:46px minmax(0,1fr) 72px;gap:8px;align-items:baseline;',
      'padding:3px 8px;font-size:11px;line-height:17px;}',
      /* The release list needs a wider first column: a version is longer than
         the milestone labels above it, and a wrapped version reads as two rows. */
      '.dshogq-vgrid[data-kind="releases"] .dshogq-vrow{grid-template-columns:98px minmax(0,1fr) 72px;}',
      '.dshogq-vrowbtn{width:100%;border:none;outline:none;background:0 0;text-align:left;font:inherit;font-size:11px;',
      'cursor:pointer;border-radius:var(--dsw-radius-xs);}',
      '.dshogq-vrowbtn:hover,.dshogq-vrowbtn[data-on="true"]{background:var(--dsw-alias-interactive-bg-hover);}',
      '.dshogq-vrowbtn:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));}',
      '.dshogq-vlabel{color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-vvalue{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.dshogq-vdate{color:var(--dsw-alias-label-tertiary);text-align:right;font-variant-numeric:tabular-nums;}',
      'border-bottom:.5px solid var(--dsw-alias-border-l1);}',
      /* Usage panel: two windows, each a compact bar chart. */
      '.dshogq-ublock{padding:6px 8px 6px;}',
      '.dshogq-ublock+.dshogq-ublock{border-top:.5px solid var(--dsw-alias-border-l1);}',
      '.dshogq-uhead{display:flex;align-items:baseline;gap:8px;font-size:11px;font-weight:500;',
      'color:var(--dsw-alias-label-secondary);}',
      '.dshogq-uperiod{margin-left:auto;font-weight:400;font-size:10px;color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-usum{font-size:10px;color:var(--dsw-alias-label-tertiary);margin:2px 0 5px;}',
      '.dshogq-urow{display:grid;grid-template-columns:minmax(0,1fr) 84px 46px;gap:8px;align-items:center;',
      'font-size:11px;line-height:16px;padding:1px 0;}',
      '.dshogq-uname{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-secondary);',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dshogq-ubar{position:relative;height:5px;border-radius:2px;background:var(--dsw-alias-border-l1);overflow:hidden;}',
      '.dshogq-ubarfill{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--dsw-alias-brand-primary);}',
      '.dshogq-uval{text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);}',
      '.dshogq-usep{display:flex;align-items:center;gap:8px;margin:7px 0 4px;font-size:10px;',
      'color:var(--dsw-alias-label-tertiary);}',
      '.dshogq-usep::after{content:"";flex:1;height:.5px;background:var(--dsw-alias-border-l1);}',
      /* The sidebar cells show the vendors in greyscale: the row is chrome, and a
         saturated brand block next to the muted glyphs beside it reads as a bug. */
      '.dshogq-wrap .dshogq-markimg{filter:grayscale(1);opacity:.9;}',
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

    /**
     * Which credential ref a payload is complaining about.
     *
     * `payload.source` already names it, so the message can quote the exact ref
     * to fill in instead of a hard-coded default. Ark needs a pair, and both
     * names are worth printing: either one missing produces the same refusal.
     */
    function envLabelOf(payload) {
      const source = payload !== null && typeof payload === 'object' ? payload.source : null;
      if (source === null || typeof source !== 'object') return 'OPENCODE_GO_API_KEY';
      const names = [];
      if (typeof source.accessKeyEnv === 'string') names.push(source.accessKeyEnv);
      if (typeof source.secretKeyEnv === 'string') names.push(source.secretKeyEnv);
      if (names.length > 0) return names.join(' / ');
      return typeof source.apiKeyEnv === 'string' ? source.apiKeyEnv : 'OPENCODE_GO_API_KEY';
    }

    /** One-line copy for a Host payload that carries an error code. */
    function messageFor(payload, t) {
      const code = payload !== null && typeof payload === 'object' ? payload.code : undefined;
      const detail = payload !== null && typeof payload === 'object' ? String(payload.message ?? '') : '';
      switch (code) {
        case 'no-credential':
          return fill(t('errNoCredential'), { env: envLabelOf(payload) });
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
        case 'disabled':
          return t('errDisabled');
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

    /** The previous visit's model snapshot for one catalog, or `null` on a first look. */
    function readSnapshot(key) {
      try {
        const raw = window.localStorage.getItem(key === undefined ? SNAPSHOT_KEY : key);
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
    function writeSnapshot(key, ids) {
      try {
        window.localStorage.setItem(key === undefined ? SNAPSHOT_KEY : key, JSON.stringify({ at: new Date().toISOString(), ids: ids }));
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
            /* Flush with the cell's top edge: an 8px gap used to sit between the
               button and the panel, and a pointer crossing it left the wrapper,
               which closed the popover just as the reader reached it. */
            bottom: Math.max(8, window.innerHeight - rect.top),
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
          ? {
              left: position.left,
              bottom: position.bottom,
              width: position.width,
              maxWidth: props.maxWidth === undefined ? undefined : props.maxWidth,
            }
          : { left: 0, bottom: 0, width: props.width, visibility: 'hidden' };
      return h(
        'div',
        { className: 'dshogq-pop', role: 'group', 'aria-label': props.title, 'data-size': props.size, style: placement },
        h(
          'div',
          { className: 'dshogq-head' },
          /* A view stacked inside another popover (the settings cell's version
             pane) needs one way back that is not "close and reopen". */
          typeof props.onBack === 'function'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dshogq-back',
                  'aria-label': props.backLabel,
                  title: props.backLabel,
                  onClick: props.onBack,
                },
                '‹',
              )
            : null,
          props.mark === null || props.mark === undefined
            ? null
            : h('span', { className: 'dshogq-titlemark' }, props.mark),
          h('span', { className: 'dshogq-title' }, props.title),
          props.chip === null || props.chip === undefined ? null : h('span', { className: 'dshogq-titlechip' }, props.chip),
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
        /* Long enough to walk into the panel at a normal pointer speed. */
        closeTimer.current = window.setTimeout(() => {
          closeTimer.current = 0;
          setOpenState(false);
        }, 220);
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
          className: props.flush === true ? 'dshogq-wrap dshogq-wrap-flush' : 'dshogq-wrap',
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

    /**
     * The stacked mini bars: the always-visible part of a meter cell.
     *
     * Takes the windows themselves rather than an index, because the Go meters
     * draw three and the Ark quota draws four, and a missing window still has to
     * occupy its slot so the glyph does not change width between renders.
     */
    function miniBars(windows) {
      return h(
        'span',
        { className: 'dshogq-bars', 'aria-hidden': 'true' },
        windows.map((window, index) =>
          h(
            'span',
            {
              className: 'dshogq-bar',
              key: window !== null && typeof window === 'object' && typeof window.id === 'string' ? window.id : index,
              'data-level': levelOf(window),
            },
            h('i', { style: { height: `${percentOf(window)}%` } }),
          ),
        ),
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

    /**
     * The DeepSeek mark for the version cell: the same whale the Harness brand
     * slot draws, at the sidebar's 14px scale. The artwork's own box is
     * 23.16 × 17.04, so the width follows the height instead of a square box.
     */
    function DeepSeekMark(props) {
      const height = props !== null && props !== undefined && Number.isFinite(props.height) ? props.height : 12;
      return h(
        'svg',
        {
          className: 'dshogq-marksvg',
          width: Math.round((height * 23.16) / 17.04),
          height: height,
          viewBox: '0 0 23.16 17.04',
          'aria-hidden': true,
        },
        h('path', { d: DEEPSEEK_MARK_PATH, fill: 'currentColor' }),
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
    /** The interval this browser chose, or `null` when it never chose one. */
    function readStoredPollMs() {
      try {
        const raw = window.localStorage.getItem(POLL_STORAGE_KEY);
        if (raw === null) return null;
        const value = Number(raw);
        return Number.isFinite(value) && value >= 0 ? value : null;
      } catch (error) {
        return null;
      }
    }

    /** Module-level so the clock cell and the meters read the same value. */
    let storedPollMs = readStoredPollMs();
    const pollListeners = new Set();

    /** Record a new interval, persist it, and tell every mounted cell. */
    function setPollMs(value) {
      storedPollMs = value;
      try {
        window.localStorage.setItem(POLL_STORAGE_KEY, String(value));
      } catch (error) {
        /* private mode: the choice lasts for this page only */
      }
      for (const listener of pollListeners) listener(value);
    }

    /** The effective interval: the reader's choice, else the built-in default. */
    function usePollMs() {
      const [value, setValue] = React.useState(storedPollMs === null ? POLL_MS : storedPollMs);
      React.useEffect(() => {
        pollListeners.add(setValue);
        return () => {
          pollListeners.delete(setValue);
        };
      }, []);
      return value;
    }

    // ── Which cells this browser shows ─────────────────────────────────
    // Any cell can be turned off from the gear, and the gear itself is never on
    // the list: it is the way back when everything else is hidden. Like the poll
    // interval, the choice is per browser and applied without a reload.

    /** The ids this browser hid; an empty set means "show everything". */
    function readHiddenPanels() {
      try {
        const raw = window.localStorage.getItem(PANEL_STORAGE_KEY);
        if (raw === null) return new Set();
        const parsed = JSON.parse(raw);
        const list = parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.hidden) ? parsed.hidden : [];
        return new Set(list.filter((id) => typeof id === 'string'));
      } catch (error) {
        return new Set();
      }
    }

    let hiddenPanels = readHiddenPanels();
    const panelListeners = new Set();

    /** Write the set through, then tell every mounted gate and the gear. */
    function commitHiddenPanels() {
      try {
        window.localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify({ hidden: [...hiddenPanels] }));
      } catch (error) {
        /* private mode: the choice lasts for this page only */
      }
      for (const listener of panelListeners) listener();
    }

    function setPanelVisible(id, visible) {
      if (visible) hiddenPanels.delete(id);
      else hiddenPanels.add(id);
      hiddenPanels = new Set(hiddenPanels);
      commitHiddenPanels();
    }

    function showAllPanels() {
      hiddenPanels = new Set();
      commitHiddenPanels();
    }

    /** Flip every switch: shown becomes hidden and the other way round. */
    function invertPanels() {
      const next = new Set();
      for (const panel of PANEL_IDS) {
        if (hiddenPanels.has(panel.id)) next.delete(panel.id);
        else next.add(panel.id);
      }
      hiddenPanels = next;
      commitHiddenPanels();
    }

    /** Re-render on every change, and hand back the current hidden set. */
    function useHiddenPanels() {
      const [, bump] = React.useState(0);
      React.useEffect(() => {
        const listener = () => bump((value) => value + 1);
        panelListeners.add(listener);
        return () => {
          panelListeners.delete(listener);
        };
      }, []);
      return hiddenPanels;
    }

    /**
     * Wrap a cell so a hidden one is never mounted at all.
     *
     * Returning null from inside the cell would keep its polling and its Host
     * reads running; gating the component itself makes a hidden panel cost
     * nothing while it is off.
     */
    function gated(panelId, Component) {
      return function PanelGate(props) {
        const hidden = useHiddenPanels();
        if (hidden.has(panelId)) return null;
        return h(Component, props);
      };
    }

    /**
     * One metered Host route, re-read at the chosen interval (never while the
     * tab is hidden). `intervalMs === 0` means manual only: nothing is polled
     * until `refresh()` runs. The Ark quota cell shares this hook with the Go
     * meters, so both follow the same clock.
     */
    function usePolled(route, intervalMs) {
      const [state, setState] = React.useState({ phase: 'loading', payload: null, message: '' });
      const [nonce, setNonce] = React.useState(0);
      const [, setTick] = React.useState(0);

      React.useEffect(() => {
        let alive = true;
        let controller = null;
        const load = async (force) => {
          if (controller !== null) controller.abort();
          controller = new AbortController();
          const url = force === true ? `${route}${route.indexOf('?') === -1 ? '?' : '&'}force=1` : route;
          try {
            const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
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
          if (!document.hidden) load(false);
        };

        /* `nonce > 0` means the reader pressed refresh, which bypasses the
           Host's cache; the mount itself reads normally. */
        load(nonce > 0);
        const poll =
          intervalMs > 0
            ? window.setInterval(() => {
                if (!document.hidden) load(false);
              }, intervalMs)
            : null;
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
          alive = false;
          if (poll !== null) window.clearInterval(poll);
          document.removeEventListener('visibilitychange', onVisibility);
          if (controller !== null) controller.abort();
        };
      }, [route, intervalMs, nonce]);

      React.useEffect(() => {
        const timer = window.setInterval(() => setTick((value) => value + 1), TICK_MS);
        return () => window.clearInterval(timer);
      }, []);

      return { state: state, refresh: React.useCallback(() => setNonce((value) => value + 1), []) };
    }

    /** The Go meters: the same polling hook, pinned to their route. */
    function useQuota(intervalMs) {
      return usePolled(USAGE_ROUTE, intervalMs);
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
        /* A Host route that never answers must surface as an error rather than
           sit on "loading" forever: the abort here is a deadline, not unmount,
           so its AbortError is reported instead of swallowed. */
        let timedOut = false;
        const deadline = window.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, REMOTE_TIMEOUT_MS);
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
            if (!alive) return;
            const aborted = error !== null && typeof error === 'object' && error.name === 'AbortError';
            if (aborted && !timedOut) return;
            const message = timedOut
              ? `${Math.round(REMOTE_TIMEOUT_MS / 1000)}s without an answer`
              : String((error && error.message) || error);
            setEntry({ state: { phase: 'error', payload: null, message: message }, at: 0 });
          } finally {
            window.clearTimeout(deadline);
          }
        })();
        return () => {
          alive = false;
          window.clearTimeout(deadline);
          controller.abort();
        };
      }, [path, ttlMs, nonce]);

      const refresh = React.useCallback(() => {
        RESOURCE_CACHE.delete(path);
        setNonce((value) => value + 1);
      }, [path]);

      /* An errored read retries itself once the upstream has had time to
         recover; success never re-enters this path, so a healthy cell stays
         put for the whole page session. */
      React.useEffect(() => {
        if (entry.state.phase !== 'error') return undefined;
        const timer = window.setTimeout(() => {
          RESOURCE_CACHE.delete(path);
          setNonce((value) => value + 1);
        }, ERROR_RETRY_MS);
        return () => window.clearTimeout(timer);
      }, [entry.state.phase, path]);

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
     * diff however many times the view re-renders. `key` lets a second catalog
     * (Ark) keep its own snapshot instead of overwriting the Go one.
     */
    function useModelDiff(payload, key) {
      const [diff, setDiff] = React.useState(null);
      const seen = React.useRef(null);
      React.useEffect(() => {
        if (payload === null || !Array.isArray(payload.models)) return;
        if (seen.current === payload) return;
        seen.current = payload;
        const ids = payload.models.map((model) => model.id);
        const previous = readSnapshot(key);
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
        writeSnapshot(key, ids);
      }, [payload, key]);
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

    /**
     * One corner button of a meter popover: an icon, a label and a caret.
     *
     * The buttons open their content in a **second** popover placed beside the
     * meters, so the panel the reader is looking at never changes shape.
     */
    function CornerButton(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'dshogq-cornerbtn',
          'data-on': props.on === true ? 'true' : 'false',
          'aria-expanded': props.on === true,
          title: props.hint,
          onClick: () => {
            if (typeof props.onClick === 'function') props.onClick();
          },
        },
        props.icon === undefined || props.icon === null ? null : props.icon,
        h('span', null, props.label),
        h('span', { className: 'dshogq-caret', 'data-open': props.on === true ? 'true' : 'false', 'aria-hidden': true }, '▸'),
      );
    }

    /**
     * Where a side panel sits: flush with the meter popover's right edge, so the
     * pointer can walk from one into the other without crossing a gap, clamped to
     * the viewport.
     */
    function sidePosition(position, width) {
      if (position === null || position === undefined) return null;
      const left = position.left + (Number.isFinite(position.width) ? position.width : GO_WIDTH);
      const clamped = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      return { left: clamped, bottom: position.bottom, width: width };
    }

    /**
     * The Go meters: three windows, plus the corner row that opens the catalog.
     *
     * The catalog sits in its own panel beside this one rather than growing
     * inside it: a meter panel that changes width and height under the pointer
     * reads as a layout glitch, and the rows pushed the meters out of place.
     */
    function GoPopover(props) {
      const t = props.t;
      return h(
        PopoverBox,
        {
          position: props.position,
          width: GO_WIDTH,
          title: t('title'),
          mark: h(OpenCodeMark, { height: 13 }),
          subtitle: props.subtitle === null || props.subtitle === undefined ? null : props.subtitle,
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
          footer: h(
            'span',
            { className: 'dshogq-footrow' },
            h('span', null, props.footerLabel),
            h(
              'span',
              { className: 'dshogq-links' },
              h('a', { className: 'dshogq-link', href: CONSOLE_URL, target: '_blank', rel: 'noreferrer' }, t('consoleLink')),
              h('span', { className: 'dshogq-linksep', 'aria-hidden': true }, '·'),
              h('a', { className: 'dshogq-link', href: DOCS_URL, target: '_blank', rel: 'noreferrer' }, t('docsLink')),
              h('span', { className: 'dshogq-linksep', 'aria-hidden': true }, '·'),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshogq-sync',
                  disabled: props.sync !== null && props.sync !== undefined && props.sync.busy === true,
                  title: t('syncHint'),
                  onClick: () => {
                    if (typeof props.onSync === 'function') props.onSync();
                  },
                },
                props.sync !== null && props.sync !== undefined && props.sync.busy === true ? t('syncBusy') : t('syncLabel'),
              ),
            ),
          ),
        },
        h(
          'div',
          null,
          props.meters,
          /* A hairline under the meters: the corner buttons are a different kind
             of thing from the readings above them. */
          h('div', { className: 'dshogq-sep', 'aria-hidden': true }),
          h(
            'div',
            { className: 'dshogq-corner' },
            h(CornerButton, {
              t: t,
              icon: h(ModelsGlyph, { size: 12 }),
              label: `${t('modelsButton')} ${props.modelCount}`,
              hint: t('modelsToggleHint'),
              on: props.panel === 'models',
              onClick: props.onTogglePanel,
            }),
          ),
        ),
      );
    }

    /**
     * The Go model panel: the whole catalog, then a divider and the diff.
     *
     * There is no menu here: the button opens straight into the list. The ids run
     * down columns (`columns: 3 150px`), so 29 models fit without a scrollbar and
     * the diff sits under a hairline at the bottom, where it belongs — it is a
     * footnote to the list, not a peer of it.
     */
    function GoCatalogPanel(props) {
      const t = props.t;
      const state = props.state;
      const payload = state.phase === 'ready' ? state.payload : null;
      const models = payload !== null && Array.isArray(payload.models) ? payload.models : [];
      const diff = props.diff;
      const added = diff !== null && diff.first === false ? diff.added : [];
      const removed = diff !== null && diff.first === false ? diff.removed : [];

      let list;
      if (state.phase === 'loading') {
        list = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error') {
        list = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
      } else if (models.length === 0) {
        list = h('div', { className: 'dshogq-note' }, t('errShape'));
      } else {
        list = h(
          'div',
          { className: 'dshogq-modellist' },
          models.map((model) => h('span', { className: 'dshogq-modellistitem', key: model.id, title: model.id }, model.id)),
        );
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: GO_PANEL_WIDE,
          size: 'large',
          title: `${t('title')} · ${t('modelsButton')}`,
          subtitle: payload === null ? null : fill(t('checkedAt'), { time: clockTime(payload.fetchedAt) }),
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
          mark: h(OpenCodeMark, { height: 13 }),
        },
        h(
          'div',
          { className: 'dshogq-scroll' },
          list,
          h(
            'div',
            { className: 'dshogq-diffblock' },
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
                      removed.length === 0 ? h('span', { className: 'dshogq-note' }, t('none')) : idRow(removed, 'gone'),
                    ),
                    h(
                      'div',
                      { className: 'dshogq-diffrow' },
                      h('span', { className: 'dshogq-difflabel' }, t('added')),
                      added.length === 0 ? h('span', { className: 'dshogq-note' }, t('none')) : idRow(added, 'new'),
                    ),
                  ),
          ),
        ),
      );
    }


    /**
     * The version view: milestones and the changelog as aligned three-column rows.
     *
     * The old body printed every release's prose inline, which made a six-release
     * list a wall of text. Now both the four milestones and the release list share
     * one row grid — version, channel, date — and a release only expands, in a
     * wide pane beside the list, when it is clicked.
     */
    function VersionPopover(props) {
      const t = props.t;
      const state = props.state;
      const payload = state.phase === 'ready' ? state.payload : null;
      const locale = props.locale;
      const active = props.active === undefined ? null : props.active;

      /* One row: label, version, date. The same grid backs the release list, so
         the two blocks read as one table. */
      const row = (key, label, value, date, extra) =>
        h(
          'div',
          { className: 'dshogq-vrow', key: key },
          h('span', { className: 'dshogq-vlabel' }, label),
          h('span', { className: 'dshogq-vvalue' }, value),
          h('span', { className: 'dshogq-vdate' }, date === null || date === undefined ? '—' : dayStamp(date)),
          extra === null || extra === undefined ? null : extra,
        );

      let body;
      let chip = null;
      if (state.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error' || payload === null) {
        body = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
      } else {
        const channels = payload.channels !== null && typeof payload.channels === 'object' ? payload.channels : {};
        const dates = payload.channelDates !== null && typeof payload.channelDates === 'object' ? payload.channelDates : {};
        const releases = Array.isArray(payload.releases) ? payload.releases : [];

        /* The headline signal moved into the title row: whether this build is
           behind is a property of the panel, not of the "latest" line. */
        const status =
          payload.latest === null || payload.current === null
            ? null
            : payload.updateAvailable
              ? { tone: 'warn', text: t('verUpdateYes') }
              : { tone: 'ok', text: t('verUpdateNo') };
        chip = status === null ? null : h('span', { className: 'dshogq-chip', 'data-tone': status.tone }, status.text);

        const milestones = h(
          'div',
          { className: 'dshogq-vgrid', 'data-kind': 'milestones' },
          row('current', t('verCurrent'), payload.current === null ? t('verUnknown') : payload.current, payload.currentPublishedAt ?? null),
          row('latest', t('verLatest'), payload.latest, dates.latest ?? null),
          typeof channels.alpha === 'string' && channels.alpha !== payload.latest
            ? row('alpha', 'alpha', channels.alpha, dates.alpha ?? null)
            : null,
          typeof channels.next === 'string' && channels.next !== payload.latest && channels.next !== channels.alpha
            ? row('next', 'next', channels.next, dates.next ?? null)
            : null,
        );

        const releaseRows =
          releases.length === 0
            ? h('div', { className: 'dshogq-note' }, t('verNone'))
            : h(
                'div',
                { className: 'dshogq-vgrid', 'data-kind': 'releases' },
                releases.map((release) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      key: release.tag,
                      className: 'dshogq-vrow dshogq-vrowbtn',
                      'data-on': active === release.tag ? 'true' : 'false',
                      'aria-expanded': active === release.tag,
                      onClick: () => {
                        if (typeof props.setActive === 'function') props.setActive(active === release.tag ? null : release.tag);
                      },
                    },
                    h('span', { className: 'dshogq-vlabel' }, release.version),
                    h('span', { className: 'dshogq-vvalue' }, release.channel),
                    h('span', { className: 'dshogq-vdate' }, dayStamp(release.publishedAt)),
                  ),
                ),
              );

        const left = h(
          'div',
          { className: 'dshogq-vercol' },
          milestones,
          h(
            'div',
            { className: 'dshogq-subhead' },
            h('span', null, t('verChanges')),
            h('span', { className: 'dshogq-count' }, String(payload.newerCount)),
          ),
          releaseRows,
        );

        body = left;
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: VERSION_WIDTH,
          size: 'large',
          title: t('versionTitle'),
          chip: chip,
          subtitle: payload === null ? null : fill(t('checkedAt'), { time: clockTime(payload.fetchedAt) }),
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
          footer: t('versionFooter'),
          /* Set when this view is stacked inside the settings cell. */
          onBack: props.onBack,
          backLabel: props.backLabel,
        },
        body,
      );
    }

    /**
     * The release notes in their own panel.
     *
     * Opening a release must not resize the list the reader is looking at, so the
     * notes open beside it instead: full viewport height, and a width that follows
     * the content (`max-content`) up to the viewport — release notes are broken
     * into short lines, and letting them set the panel width keeps them from
     * wrapping into a ragged column.
     */
    function VersionNotePopover(props) {
      const t = props.t;
      const release = props.release;
      if (release === null || release === undefined) return null;
      const lines = releaseLines(release.body, props.locale);

      return h(
        PopoverBox,
        {
          position: props.position,
          maxWidth: props.maxWidth,
          size: 'fullheight',
          title: release.version,
          chip: h('span', { className: 'dshogq-chip' }, release.channel),
          subtitle: dayStamp(release.publishedAt),
          footer: null,
        },
        h(
          'div',
          { className: 'dshogq-notebody' },
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
        ),
      );
    }
    /**
     * Build the Go cell: the OpenCode mark followed by three meter bars (and the
     * tightest window's share when the column is wide), plus one hover popover
     * holding both halves of the plan — the metered windows and the catalog.
     */
    function makeQuotaCell(ctx) {
      return function OpenCodeGo(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);

        const intervalMs = usePollMs();
        const quota = useQuota(intervalMs);
        const catalog = useRemote(MODELS_ROUTE, INFO_TTL_MS);

        const state = quota.state;
        const catalogPayload = catalog.state.phase === 'ready' ? catalog.state.payload : null;
        const diff = useModelDiff(catalogPayload);
        const [active, setActive] = React.useState(null);
        /* Which side panel is open, if any. The meter panel never changes shape. */
        const [panel, setPanel] = React.useState(null);
        /* Sync action: ask the Host to re-probe out-of-catalog models and rewrite
           the auto-managed provider block, then re-read the catalog. */
        const [sync, setSync] = React.useState({ busy: false, result: null });
        const refreshCatalog = catalog.refresh;
        const runSync = React.useCallback(async () => {
          setSync({ busy: true, result: null });
          try {
            const response = await fetch(SYNC_ROUTE, { method: 'POST', headers: { accept: 'application/json' } });
            const result = await response.json();
            setSync({ busy: false, result: result });
            if (result !== null && typeof result === 'object' && result.ok === true) refreshCatalog();
          } catch (error) {
            setSync({ busy: false, result: { ok: false, message: String((error && error.message) || error) } });
          }
        }, [refreshCatalog]);

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

        /* The dot means "the last refresh changed the catalog", not "the docs are
           behind" — that condition never clears, and a dot that is always on has
           stopped saying anything. */
        const updated = diff !== null && diff.first === false && (diff.added.length > 0 || diff.removed.length > 0);
        const version =
          state.phase === 'ready' && state.payload !== null && typeof state.payload.source?.version === 'string'
            ? state.payload.source.version
            : null;

        const meters =
          state.phase === 'loading'
            ? h('div', { className: 'dshogq-note' }, t('loading'))
            : state.phase === 'error'
              ? h('div', { className: 'dshogq-msg' }, failureLine(state, t))
              : !ready
                ? h('div', { className: 'dshogq-msg' }, t('errShape'))
                : h(
                    'div',
                    { className: 'dshogq-rows' },
                    known.map((key) => windowRow(key, byId[key.id], t)),
                  );

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'hover',
            width: GO_WIDTH,
            title: t('title'),
            hint: hint,
            /* The mark first, then the bars: the seat reads "whose plan" before
               "how much of it is left". */
            glyph: h(
              'span',
              { className: 'dshogq-mark' },
              h(OpenCodeMark, { height: 14 }),
              miniBars(WINDOW_KEYS.map((key) => byId[key.id] ?? { id: key.id })),
            ),
            label: wide && ready ? `${Math.round(highest.percent)}%` : null,
            labelLevel: highest.level,
            badge: updated,
            onOpenChange: (isOpen) => {
              if (!isOpen) {
                setActive(null);
                setPanel(null);
              }
            },
            renderPopover: (position) => {
              const metersPanel = h(GoPopover, {
                position: position,
                t: t,
                subtitle: ready ? fill(t('updatedAt'), { time: clockTime(state.payload.fetchedAt) }) : null,
                footerLabel: version === null ? t('footer') : `${t('footer')} · v${version}`,
                meters: meters,
                onRefresh: () => {
                  quota.refresh();
                  catalog.refresh();
                },
                onSync: runSync,
                sync: sync,
                modelCount: catalogPayload !== null && Array.isArray(catalogPayload.models) ? catalogPayload.models.length : 0,
                panel: panel,
                onTogglePanel: () => setPanel((current) => (current === 'models' ? null : 'models')),
              });
              if (panel !== 'models') return metersPanel;
              return [
                metersPanel,
                h(GoCatalogPanel, {
                  key: 'catalog',
                  position: sidePosition(position, GO_PANEL_WIDE),
                  t: t,
                  state: catalog.state,
                  diff: diff,
                  busy: catalog.busy === true,
                  onRefresh: catalog.refresh,
                }),
              ];
            },
          },
        );
      };
    }

    /**
     * The third-party catalogs' cell glyph: three stacked layers, the usual
     * "model collection" reading, drawn as outlines so it stays legible at 14px.
     */
    function ModelsGlyph(props) {
      const size = props !== null && props !== undefined && Number.isFinite(props.size) ? props.size : 15;
      return h(
        'svg',
        {
          className: 'dshogq-marksvg',
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z' }),
        h('path', { d: 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65' }),
        h('path', { d: 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65' }),
      );
    }

    /**
     * Agnes' own mark, from `/images/biglogo.svg`: a disc with the swoosh and dot
     * cut out. The cut-outs take the popover's surface colour so the logo reads
     * the same in either theme instead of baking white into the artwork.
     */
    function AgnesMark() {
      return h(
        'svg',
        { className: 'dshogq-vendormark', width: 14, height: 14, viewBox: '0 0 284 284', 'aria-hidden': true },
        h('path', { d: AGNES_DISC_PATH, fill: 'currentColor' }),
        h('path', { d: AGNES_SWOOSH_PATH, fill: 'var(--dsw-alias-bg-overlay)' }),
        h('path', { d: AGNES_DOT_PATH, fill: 'var(--dsw-alias-bg-overlay)' }),
      );
    }

    /** SenseNova's own mark: the vendor favicon, inlined as a data URI. */
    function SenseNovaMark() {
      return h('img', {
        className: 'dshogq-vendormark dshogq-vendorpng',
        src: SENSENOVA_MARK,
        width: 14,
        height: 14,
        alt: '',
        'aria-hidden': true,
      });
    }

    /** The mark for one provider row, or `null` for a provider without one. */
    function vendorMark(id) {
      if (id === 'agnes') return h(AgnesMark, null);
      if (id === 'sensenova') return h(SenseNovaMark, null);
      return null;
    }

    /**
     * Diff each provider's live ids against the snapshot the previous visit left,
     * then record this one. Keyed on payload identity, so one fetch is one diff.
     */
    function useProvidersDiff(providers) {
      const [diff, setDiff] = React.useState(null);
      const seen = React.useRef(null);
      React.useEffect(() => {
        if (!Array.isArray(providers) || providers.length === 0) return;
        if (seen.current === providers) return;
        seen.current = providers;

        let previous = null;
        try {
          previous = JSON.parse(window.localStorage.getItem(PROVIDERS_SNAPSHOT_KEY) ?? 'null');
        } catch (error) {
          previous = null;
        }
        if (previous === null || typeof previous !== 'object') previous = null;

        const next = {};
        const addedBy = {};
        const removedBy = {};
        const firstBy = {};
        for (const provider of providers) {
          if (provider === null || typeof provider !== 'object' || provider.ok !== true || !Array.isArray(provider.models)) continue;
          const ids = provider.models.map((model) => model.id);
          next[provider.id] = ids;
          const before = previous !== null && Array.isArray(previous[provider.id]) ? previous[provider.id] : null;
          if (before === null) {
            firstBy[provider.id] = true;
            addedBy[provider.id] = [];
            removedBy[provider.id] = [];
            continue;
          }
          const beforeSet = new Set(before);
          const nowSet = new Set(ids);
          addedBy[provider.id] = ids.filter((id) => !beforeSet.has(id));
          removedBy[provider.id] = before.filter((id) => !nowSet.has(id));
        }
        const flattenBag = (bag) => Object.keys(bag).reduce((acc, key) => acc.concat(bag[key]), []);
        setDiff({
          first: previous === null,
          addedBy: addedBy,
          removedBy: removedBy,
          firstBy: firstBy,
          added: flattenBag(addedBy),
          removed: flattenBag(removedBy),
        });
        try {
          window.localStorage.setItem(PROVIDERS_SNAPSHOT_KEY, JSON.stringify(next));
        } catch (error) {
          /* private mode or quota: the diff degrades to "first look" */
        }
      }, [providers]);
      return diff;
    }


    /** One model line: its id, and its context window when the source knows it. */
    function modelLine(model, isNew) {
      return h(
        'div',
        { className: 'dshogq-modelet', key: model.id, 'data-tone': isNew ? 'new' : undefined, title: model.id },
        h('span', { className: 'dshogq-modeletname' }, model.id),
        Number.isFinite(model.contextWindow)
          ? h('span', { className: 'dshogq-modeletmeta' }, `${Math.round(model.contextWindow / 1000)}k`)
          : null,
      );
    }

    /**
     * One provider block: mark, name and counts on the first line, where the list
     * came from plus its console link on the second, then one vertical list per
     * output kind.
     *
     * The lists are stacked with one model per line. A wrapped row of chips made
     * a ten-model catalog read as a block of tags; a column of ids reads as an
     * inventory, and the three kinds stay visibly apart.
     */
    function providerSection(provider, diff, t) {
      const ok = provider !== null && typeof provider === 'object' && provider.ok === true && Array.isArray(provider.models);
      const models = ok ? provider.models : [];
      const addedList =
        diff !== null && diff.addedBy !== undefined && Array.isArray(diff.addedBy[provider.id]) ? diff.addedBy[provider.id] : [];
      const first = diff !== null && diff.firstBy !== undefined && diff.firstBy[provider.id] === true;

      const head = h(
        'div',
        { className: 'dshogq-secttitle' },
        h(
          'span',
          { className: 'dshogq-sectmark' },
          vendorMark(provider === null || provider === undefined ? null : provider.id),
        ),
        h('span', { className: 'dshogq-sectname' }, String(provider === null || provider === undefined ? '' : provider.label ?? provider.id ?? '')),
        ok ? h('span', { className: 'dshogq-count' }, String(models.length)) : null,
        ok || provider === null || provider === undefined
          ? null
          : h('span', { className: 'dshogq-chip', 'data-tone': 'warn' }, t('providerFailed')),
        ok && addedList.length > 0
          ? h('span', { className: 'dshogq-chip', 'data-tone': 'ok' }, fill(t('providerAdded'), { n: addedList.length }))
          : null,
      );

      /* Neither list is live: one is read from the published documentation, the
         other from a dated snapshot. Say which, because a documented model can be
         announced before it serves. */
      const source = [];
      if (ok && provider.via === 'snapshot') {
        source.push(
          h(
            'span',
            { className: 'dshogq-chip', title: t('providerSnapshotHint'), key: 'via' },
            typeof provider.asOf === 'string' && provider.asOf.length > 0
              ? `${t('providerSnapshot')} ${provider.asOf}`
              : t('providerSnapshot'),
          ),
        );
      }
      if (ok && provider.via === 'docs') {
        source.push(
          h(
            'a',
            {
              className: 'dshogq-chip',
              key: 'via',
              href: typeof provider.docsIndex === 'string' ? provider.docsIndex : provider.docs,
              target: '_blank',
              rel: 'noreferrer',
              title: t('providerDocsHint'),
            },
            t('providerDocs'),
          ),
        );
      }
      const consoleUrl = typeof provider.consoleUrl === 'string' && provider.consoleUrl.length > 0 ? provider.consoleUrl : null;
      const sub =
        source.length === 0 && consoleUrl === null
          ? null
          : h(
              'div',
              { className: 'dshogq-sectsub' },
              ...source,
              consoleUrl === null
                ? null
                : h(
                    'a',
                    {
                      className: 'dshogq-link',
                      style: { marginLeft: 'auto' },
                      href: consoleUrl,
                      target: '_blank',
                      rel: 'noreferrer',
                    },
                    t('consoleLink'),
                  ),
            );

      let content = null;
      if (!ok) {
        content = h('div', { className: 'dshogq-msg' }, messageFor(provider, t));
      } else {
        const buckets = { text: [], image: [], video: [] };
        for (const model of models) {
          const key = model.modality === 'image' || model.modality === 'video' ? model.modality : 'text';
          buckets[key].push(model);
        }
        const groups = [
          ['text', 'modalityText'],
          ['image', 'modalityImage'],
          ['video', 'modalityVideo'],
        ].filter(([key]) => buckets[key].length > 0);
        const addedSet = first ? null : new Set(addedList);
        content = h(
          'div',
          null,
          first ? h('div', { className: 'dshogq-note' }, fill(t('providersFirst'), { n: models.length })) : null,
          groups.map(([key, labelKey]) =>
            h(
              'div',
              { className: 'dshogq-vgroup', key: key },
              groups.length > 1
                ? h(
                    'div',
                    { className: 'dshogq-group' },
                    h('span', null, t(labelKey)),
                    h('span', { className: 'dshogq-groupcount' }, String(buckets[key].length)),
                  )
                : null,
              buckets[key].map((model) => modelLine(model, addedSet !== null && addedSet.has(model.id))),
            ),
          ),
        );
      }

      return h(
        'div',
        { className: 'dshogq-sect', key: provider === null || provider === undefined ? 'provider' : provider.id },
        head,
        sub,
        content,
      );
    }

    /** The third-party catalog popover: one section per provider. */
    function ProvidersPopover(props) {
      const t = props.t;
      const state = props.state;
      const payload = state.phase === 'ready' ? state.payload : null;
      const providers = payload !== null && Array.isArray(payload.providers) ? payload.providers : [];

      let body;
      if (state.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (state.phase === 'error' || payload === null) {
        body = h('div', { className: 'dshogq-msg' }, failureLine(state, t));
      } else if (providers.length === 0) {
        body = h('div', { className: 'dshogq-note' }, t('providersEmpty'));
      } else {
        /* Two columns when there are two providers, one when there is one: the
           grid decides, so a third provider simply wraps instead of clipping. */
        body = h(
          'div',
          { className: 'dshogq-vendorgrid' },
          providers.map((provider) => providerSection(provider, props.diff, t)),
        );
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: 560,
          size: 'large',
          title: t('providersTitle'),
          subtitle: payload !== null ? fill(t('updatedAt'), { time: clockTime(payload.fetchedAt) }) : null,
          busy: props.busy,
          refreshLabel: t('refresh'),
          onRefresh: props.onRefresh,
          footer: h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' } },
            h(
              'span',
              { className: 'dshogq-footrow' },
              h('span', null, t('providersFooter')),
              h(
                'span',
                { className: 'dshogq-links' },
                h(
                  'a',
                  { className: 'dshogq-link', href: 'https://agnes-ai.com/zh-Hans/docs/overview', target: '_blank', rel: 'noreferrer' },
                  t('agnesDocs'),
                ),
                h('span', { className: 'dshogq-linksep' }, '·'),
                h(
                  'a',
                  { className: 'dshogq-link', href: 'https://platform.sensenova.cn/docs', target: '_blank', rel: 'noreferrer' },
                  t('sensenovaDocs'),
                ),
              ),
            ),
            h('span', { className: 'dshogq-logtext' }, t('usageHint')),
          ),
        },
        body,
      );
    }

    /** Build the third-party catalog cell: Agnes + SenseNova model counts. */
    function makeWatchCell() {
      return function OpenCodeGoProviders(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);

        const remote = useRemote(PROVIDERS_ROUTE, INFO_TTL_MS);
        const payload = remote.state.phase === 'ready' ? remote.state.payload : null;
        const providers = payload !== null && Array.isArray(payload.providers) ? payload.providers : [];
        const diff = useProvidersDiff(providers);

        /* Opt-in: while unread, and whenever the Host reports no configured
           providers, this cell is not wanted at all — draw nothing. */
        if (remote.state.phase === 'loading') return null;
        if (payload !== null && providers.length === 0) return null;

        let total = 0;
        for (const provider of providers) {
          if (provider !== null && typeof provider === 'object' && provider.ok === true && Array.isArray(provider.models)) {
            total += provider.models.length;
          }
        }
        const updated = diff !== null && diff.first === false && diff.added.length + diff.removed.length > 0;

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'hover',
            width: 560,
            title: t('providersTitle'),
            hint: t('providersHint'),
            glyph: h(ModelsGlyph, null),
            label: wide && total > 0 ? String(total) : null,
            badge: updated,
            renderPopover: (position) =>
              h(ProvidersPopover, {
                position: position,
                t: t,
                state: remote.state,
                diff: diff,
                busy: remote.busy,
                onRefresh: remote.refresh,
              }),
          },
        );
      };
    }

    // ── Volcengine Ark Agent Plan ──────────────────────────────────────
    //
    // Two cells, because the plan answers two different questions: how much AFP
    // is left in each rolling window, and what the plan serves plus where the AFP
    // went. The quota cell polls like the Go meters (same clock, same visibility
    // rule); the catalog cell reads once per page load, like the other catalogs.

    /**
     * Volcengine's own mark — the blue/cyan peaks from the vendor favicon — so
     * the Ark cell carries the same artwork the console uses instead of an
     * invented flame.
     */
    function ArkGlyph() {
      return h('img', {
        className: 'dshogq-markimg',
        src: VOLCENGINE_MARK,
        width: 15,
        height: 15,
        alt: '',
        'aria-hidden': true,
      });
    }

    /** AFP values arrive as fractional numbers; print them with a grouped integer part. */
    function formatAfp(value) {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(parsed)) return '—';
      const rounded = Math.round(parsed * 10) / 10;
      const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
      const parts = text.split('.');
      const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
      return parts.length === 1 ? grouped : `${grouped}.${parts[1]}`;
    }

    /** Token counts read at a glance: 851.7k, 3.33M. */
    function formatCount(value) {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(parsed)) return '—';
      const absolute = Math.abs(parsed);
      if (absolute >= 1e9) return `${(parsed / 1e9).toFixed(2)}B`;
      if (absolute >= 1e6) return `${(parsed / 1e6).toFixed(2)}M`;
      if (absolute >= 1e4) return `${(parsed / 1e3).toFixed(1)}k`;
      return String(Math.round(parsed));
    }

    /** One AFP window row: label, share, bar, then spent-of-quota and the reset. */
    function arkWindowRow(spec, win, t) {
      const level = levelOf(win);
      const percent = percentOf(win);
      const resetsAt = win !== null && typeof win === 'object' && typeof win.resetsAt === 'string' ? win.resetsAt : null;
      return h(
        'div',
        { className: 'dshogq-row', key: spec.id },
        h(
          'div',
          { className: 'dshogq-rowhead' },
          h('span', { className: 'dshogq-rowlabel' }, t(spec.label)),
          h('span', { className: 'dshogq-rowpct', 'data-level': level }, `${Math.round(percent)}%`),
        ),
        h(
          'div',
          { className: 'dshogq-track' },
          h('span', { className: 'dshogq-fill', 'data-level': level, style: { width: `${percent}%` } }),
        ),
        h(
          'div',
          { className: 'dshogq-sub' },
          h(
            'span',
            null,
            fill(t('arkUsedOf'), {
              used: formatAfp(win !== null && typeof win === 'object' ? win.used : 0),
              quota: formatAfp(win !== null && typeof win === 'object' ? win.quota : 0),
            }),
          ),
          h('span', null, resetsAt === null ? t('arkNoWindow') : fill(t('resetIn'), { time: countdown(resetsAt, t) })),
        ),
      );
    }

    /**
     * Build the Ark cell: the flame in the sidebar, and one popover holding both
     * halves of the plan — the four AFP windows, then the catalog and the usage
     * feed as collapsible rows beside a detail pane.
     *
     * The two halves read different routes with different cache ages, so both
     * states arrive here; the one refresh button forces both.
     */
    function makeArkCell() {
      return function OpenCodeArk(props) {
        const wide = !!(props && props.wide);
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);

        const intervalMs = usePollMs();
        const quota = usePolled(ARK_USAGE_ROUTE, intervalMs);
        const catalog = useRemote(ARK_CATALOG_ROUTE, INFO_TTL_MS);

        const quotaPayload = quota.state.phase === 'ready' ? quota.state.payload : null;
        const catalogPayload = catalog.state.phase === 'ready' ? catalog.state.payload : null;
        const byId = windowsById(quota.state);
        const known = ARK_WINDOWS.filter((spec) => byId[spec.id] !== undefined);
        const ready = quota.state.phase === 'ready' && known.length > 0;

        const diff = useModelDiff(catalogPayload, ARK_SNAPSHOT_KEY);
        /* The two windows the Host fills; the panel titles and button labels read them. */
        const arkShortDays = catalogPayload !== null && catalogPayload.usage !== null && Number.isFinite(catalogPayload.usage.days) ? catalogPayload.usage.days : 7;
        const arkLongDays = catalogPayload !== null && catalogPayload.usageLong !== null && Number.isFinite(catalogPayload.usageLong.days) ? catalogPayload.usageLong.days : 30;
        const updated = diff !== null && diff.first === false && (diff.added.length > 0 || diff.removed.length > 0);
        const [active, setActive] = React.useState(null);
        /* Which side panel is open: 'usage', 'models', or none. */
        const [panel, setPanel] = React.useState(null);

        let highest = { percent: 0, level: 'idle' };
        for (const spec of known) {
          const percent = percentOf(byId[spec.id]);
          if (percent > highest.percent) highest = { percent: percent, level: levelOf(byId[spec.id]) };
        }

        return h(
          CellShell,
          {
            wide: wide,
            mode: 'hover',
            width: ARK_WIDTH,
            title: t('arkTitle'),
            hint: ready ? t('arkHint') : t('noData'),
            /* The mark first, then the four AFP bars — same reading order as the
               Go cell beside it. */
            glyph: h(
              'span',
              { className: 'dshogq-mark' },
              h(ArkGlyph, null),
              miniBars(ARK_WINDOWS.map((spec) => byId[spec.id] ?? { id: spec.id })),
            ),
            label: wide && ready ? `${Math.round(highest.percent)}%` : null,
            labelLevel: highest.level,
            badge: updated,
            onOpenChange: (isOpen) => {
              if (!isOpen) {
                setActive(null);
                setPanel(null);
              }
            },
            renderPopover: (position) => {
              const metersPanel = h(ArkPopover, {
                position: position,
                t: t,
                quotaState: quota.state,
                catalogState: catalog.state,
                byId: byId,
                known: known,
                ready: ready,
                planType: quotaPayload !== null ? quotaPayload.planType : null,
                fetchedAt: quotaPayload !== null ? quotaPayload.fetchedAt : null,
                catalogPayload: catalogPayload,
                diff: diff,
                busy: quota.state.phase === 'loading' || catalog.busy === true,
                onRefresh: () => {
                  quota.refresh();
                  catalog.refresh();
                },
                panel: panel,
                shortDays: arkShortDays,
                longDays: arkLongDays,
                onOpenPanel: (name) => setPanel((current) => (current === name ? null : name)),
              });
              if (panel === null) return metersPanel;
              if (panel === null) return metersPanel;
              const isUsage = panel === 'usage-short' || panel === 'usage-long';
              const side = sidePosition(position, isUsage ? ARK_PANEL_USAGE : ARK_PANEL_WIDE);
              return [
                metersPanel,
                isUsage
                  ? h(ArkUsagePanel, {
                      key: panel,
                      position: side,
                      t: t,
                      window: panel === 'usage-long' ? 'long' : 'short',
                      shortDays: arkShortDays,
                      longDays: arkLongDays,
                      catalogState: catalog.state,
                      catalogPayload: catalogPayload,
                      busy: catalog.busy === true,
                      onRefresh: catalog.refresh,
                    })
                  : h(ArkCatalogPanel, {
                      key: 'catalog',
                      position: side,
                      t: t,
                      catalogState: catalog.state,
                      catalogPayload: catalogPayload,
                      diff: diff,
                      busy: catalog.busy === true,
                      onRefresh: catalog.refresh,
                    }),
              ];
            },
          },
        );
      };
    }

    /** One usage line: the model, its unit, and the amount spent. */
    function arkUsageRow(entry) {
      return h(
        'div',
        { className: 'dshogq-usagerow', key: `${entry.unit}:${entry.name}` },
        h('span', { className: 'dshogq-usagename', title: entry.name }, entry.name),
        h('span', { className: 'dshogq-usageunit' }, entry.unit === 'Images' ? 'img' : 'tok'),
        h('span', { className: 'dshogq-usageval' }, formatCount(entry.usage)),
      );
    }

    /**
     * The Ark meters: four AFP windows and the corner row that opens the plan's
     * catalog and its usage in panels of their own.
     *
     * The usage button sits to the left of the model button: they are two peers,
     * not one nested inside the other, and each opens its own panel.
     */
    function ArkPopover(props) {
      const t = props.t;
      const payload = props.catalogPayload;
      const usageShort = payload !== null && payload.usage !== null && typeof payload.usage === 'object' ? payload.usage : null;
      const usageLong = payload !== null && payload.usageLong !== null && typeof payload.usageLong === 'object' ? payload.usageLong : null;
      const usageShortOk = usageShort !== null && usageShort.ok === true;
      const usageLongOk = usageLong !== null && usageLong.ok === true;
      const shortDays = usageShort !== null && Number.isFinite(usageShort.days) ? usageShort.days : props.shortDays;
      const longDays = usageLong !== null && Number.isFinite(usageLong.days) ? usageLong.days : props.longDays;
      const modelCount = payload !== null && Array.isArray(payload.models) ? payload.models.length : 0;

      let meters;
      if (props.quotaState.phase === 'loading') {
        meters = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (props.quotaState.phase === 'error') {
        meters = h('div', { className: 'dshogq-msg' }, failureLine(props.quotaState, t));
      } else if (props.ready !== true) {
        meters = h('div', { className: 'dshogq-msg' }, t('errShape'));
      } else {
        meters = h(
          'div',
          { className: 'dshogq-rows' },
          props.known.map((spec) => arkWindowRow(spec, props.byId[spec.id], t)),
        );
      }

      const planText =
        typeof props.planType === 'string' ? fill(t('arkPlan'), { plan: props.planType }) : t('arkUsageHint');

      return h(
        PopoverBox,
        {
          position: props.position,
          width: ARK_WIDTH,
          title: t('arkTitle'),
          mark: h(ArkGlyph, null),
          subtitle: typeof props.fetchedAt === 'string' ? fill(t('updatedAt'), { time: clockTime(props.fetchedAt) }) : null,
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
          footer: h(
            'span',
            { className: 'dshogq-footrow' },
            h('span', null, planText),
            h(
              'span',
              { className: 'dshogq-links' },
              h('a', { className: 'dshogq-link', href: ARK_CONSOLE_URL, target: '_blank', rel: 'noreferrer' }, t('arkConsoleLink')),
              h('span', { className: 'dshogq-linksep', 'aria-hidden': true }, '·'),
              h('a', { className: 'dshogq-link', href: ARK_DOCS_URL, target: '_blank', rel: 'noreferrer' }, t('arkDocsLink')),
            ),
          ),
        },
        h(
          'div',
          null,
          meters,
          /* A hairline under the meters: the corner buttons are a different kind
             of thing from the readings above them. */
          h('div', { className: 'dshogq-sep', 'aria-hidden': true }),
          h(
            'div',
            { className: 'dshogq-corner dshogq-corner-col' },
            h(CornerButton, {
              t: t,
              label: fill(t('arkUsageWindow'), { days: shortDays }) + (usageShortOk ? ' ' + formatCount(usageShort.totals?.tokens) : ''),
              hint: t('usageToggleHint'),
              on: props.panel === 'usage-short',
              onClick: () => props.onOpenPanel('usage-short'),
            }),
            h(CornerButton, {
              t: t,
              label: fill(t('arkUsageWindow'), { days: longDays }) + (usageLongOk ? ' ' + formatCount(usageLong.totals?.tokens) : ''),
              hint: t('usageToggleHint'),
              on: props.panel === 'usage-long',
              onClick: () => props.onOpenPanel('usage-long'),
            }),
            h(CornerButton, {
              t: t,
              icon: h(ModelsGlyph, { size: 12 }),
              label: t('modelsButton') + ' ' + modelCount,
              hint: t('modelsToggleHint'),
              on: props.panel === 'models',
              onClick: () => props.onOpenPanel('models'),
            }),
          ),
        ),
      );
    }

    /**
     * The plan's catalog panel: every model the plan serves, then the divider and
     * the diff — same shape as the Go panel beside it.
     */
    function ArkCatalogPanel(props) {
      const t = props.t;
      const payload = props.catalogPayload;
      const models = payload !== null && Array.isArray(payload.models) ? payload.models : [];
      const diff = props.diff;
      const added = diff !== null && diff.first === false ? diff.added : [];
      const removed = diff !== null && diff.first === false ? diff.removed : [];

      let list;
      if (props.catalogState.phase === 'loading') {
        list = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (props.catalogState.phase === 'error') {
        list = h('div', { className: 'dshogq-msg' }, failureLine(props.catalogState, t));
      } else if (models.length === 0) {
        list = h('div', { className: 'dshogq-note' }, t('errShape'));
      } else {
        list = h(
          'div',
          { className: 'dshogq-modellist' },
          models.map((model) =>
            h('span', {
              className: 'dshogq-modellistitem',
              key: model.id,
              title: Number.isFinite(model.contextWindow) ? `${model.id} · ${Math.round(model.contextWindow / 1000)}k ctx` : model.id,
            }, model.id),
          ),
        );
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: ARK_PANEL_WIDE,
          size: 'large',
          title: `${t('arkTitle')} · ${t('modelsButton')}`,
          subtitle: payload === null ? null : fill(t('checkedAt'), { time: clockTime(payload.fetchedAt) }),
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
          mark: h(ArkGlyph, null),
        },
        h(
          'div',
          { className: 'dshogq-scroll' },
          list,
          h(
            'div',
            { className: 'dshogq-diffblock' },
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
                      removed.length === 0 ? h('span', { className: 'dshogq-note' }, t('none')) : idRow(removed, 'gone'),
                    ),
                    h(
                      'div',
                      { className: 'dshogq-diffrow' },
                      h('span', { className: 'dshogq-difflabel' }, t('added')),
                      added.length === 0 ? h('span', { className: 'dshogq-note' }, t('none')) : idRow(added, 'new'),
                    ),
                  ),
          ),
        ),
      );
    }
    /**
     * One usage window: the total, then a thin bar per model so the numbers can
     * be compared at a glance, with the image models split off under a divider —
     * tokens and images are different units and do not belong in one ranking.
     */
    function arkUsageBlock(usage, title, t) {
      if (usage === null || usage === undefined || usage.ok !== true) {
        return h(
          'div',
          { className: 'dshogq-ublock' },
          h('div', { className: 'dshogq-uhead' }, h('span', null, title)),
          h(
            'div',
            { className: 'dshogq-msg' },
            usage === null || usage === undefined ? t('errShape') : messageFor(usage, t),
          ),
        );
      }
      const rows = Array.isArray(usage.byModel) ? usage.byModel : [];
      const tokens = rows.filter((entry) => entry.unit !== 'Images');
      const images = rows.filter((entry) => entry.unit === 'Images');
      const maxOf = (list) => list.reduce((max, entry) => Math.max(max, Number(entry.usage) || 0), 0);
      const tokenMax = maxOf(tokens);
      const imageMax = maxOf(images);

      const line = (entry, max) => {
        const value = Number(entry.usage) || 0;
        const percent = max > 0 ? Math.max(1.5, (value / max) * 100) : 0;
        return h(
          'div',
          { className: 'dshogq-urow', key: `${entry.unit}:${entry.name}` },
          h('span', { className: 'dshogq-uname', title: entry.name }, entry.name),
          h('span', { className: 'dshogq-ubar' }, h('span', { className: 'dshogq-ubarfill', style: { width: `${percent}%` } })),
          h('span', { className: 'dshogq-uval' }, formatCount(value)),
        );
      };

      return h(
        'div',
        { className: 'dshogq-ublock' },
        h(
          'div',
          { className: 'dshogq-uhead' },
          h('span', null, title),
          h('span', { className: 'dshogq-uperiod' }, fill(t('arkUsagePeriod'), { from: usage.from, to: usage.to })),
        ),
        h(
          'div',
          { className: 'dshogq-usum' },
          fill(t('arkUsageTotal'), {
            tokens: formatCount(usage.totals?.tokens),
            images: formatCount(usage.totals?.images),
          }),
        ),
        tokens.length === 0 ? h('div', { className: 'dshogq-note' }, t('arkUsageEmpty')) : tokens.map((entry) => line(entry, tokenMax)),
        images.length === 0
          ? null
          : h(
              'div',
              { className: 'dshogq-usep' },
              h('span', { className: 'dshogq-useplabel' }, t('modalityImage')),
            ),
        images.map((entry) => line(entry, imageMax)),
      );
    }

    /**
    /**
     * One AFP usage window as a small bar chart.
     *
     * The two windows are separate panels now: "what did the week cost" and "what
     * does the month look like" are asked at different moments, and one panel per
     * window keeps each short enough to read without scrolling.
     */
    function ArkUsagePanel(props) {
      const t = props.t;
      const payload = props.catalogPayload;
      const usage = props.window === 'long'
        ? payload !== null && payload.usageLong !== null && typeof payload.usageLong === 'object' ? payload.usageLong : null
        : payload !== null && payload.usage !== null && typeof payload.usage === 'object' ? payload.usage : null;
      const days = usage !== null && Number.isFinite(usage.days) ? usage.days : props.window === 'long' ? props.longDays : props.shortDays;

      let body;
      if (props.catalogState.phase === 'loading') {
        body = h('div', { className: 'dshogq-note' }, t('loading'));
      } else if (props.catalogState.phase === 'error') {
        body = h('div', { className: 'dshogq-msg' }, failureLine(props.catalogState, t));
      } else if (usage === null) {
        body = h('div', { className: 'dshogq-msg' }, t('errShape'));
      } else {
        body = arkUsageBlock(usage, fill(t('arkUsageWindow'), { days: days }), t);
      }

      return h(
        PopoverBox,
        {
          position: props.position,
          width: ARK_PANEL_USAGE,
          size: 'large',
          title: t('usageWord'),
          subtitle: fill(t('arkUsageWindow'), { days: days }),
          onRefresh: props.onRefresh,
          busy: props.busy === true,
          refreshLabel: t('refresh'),
          mark: h(ArkGlyph, null),
        },
        h('div', { className: 'dshogq-scroll' }, body),
      );
    }

    // ── Panel visibility ───────────────────────────────────────────────

    /** The settings mark: three host-style sliders, drawn in `currentColor`. */
    function SlidersGlyph() {
      const knob = (cx, cy) =>
        h('circle', {
          cx: cx,
          cy: cy,
          r: 1.7,
          fill: 'var(--dsw-alias-bg-overlay)',
          stroke: 'currentColor',
          strokeWidth: 1.3,
        });
      return h(
        'svg',
        { className: 'dshogq-marksvg', width: 14, height: 14, viewBox: '0 0 16 16', 'aria-hidden': true },
        h('path', {
          d: 'M2 4.5h12M2 8h12M2 11.5h12',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          opacity: 0.75,
        }),
        knob(6, 4.5),
        knob(10.5, 8),
        knob(5, 11.5),
      );
    }

    /**
     * Build the settings cell: the panel switches, the meter cadence behind its
     * clock, and the Harness version behind its whale — one popover, one place
     * for everything that is set once in a while, and the only cell that can
     * never be switched off.
     *
     * The version read used to own a cell; it is looked at rarely enough that a
     * third footer button is the better trade. Its view stacks inside this
     * popover and carries a back arrow to the switches.
     */
    function makeSettingsCell() {
      return function OpenCodeGoPanels(props) {
        const locales = props && typeof props.t === 'function' ? props.t : null;
        const t = (key, params) => fill(locales === null ? (FALLBACK[key] ?? key) : locales(key), params);
        const locale = props && typeof props.__locale === 'string' ? props.__locale : 'en';
        const hidden = useHiddenPanels();
        const intervalMs = usePollMs();
        const allHidden = PANEL_IDS.every((panel) => hidden.has(panel.id));
        /* One view at a time: the switches, the interval list, or the version. */
        const [view, setView] = React.useState('panels');
        const [notice, setNotice] = React.useState(null);
        /* The read the version cell used to make: once per page load, cached for
           the day like every other catalog answer. */
        const version = useRemote(VERSION_ROUTE, INFO_TTL_MS);
        const [versionActive, setVersionActive] = React.useState(null);
        const updateAvailable =
          version.state.phase === 'ready' && version.state.payload !== null && version.state.payload.updateAvailable === true;
        React.useEffect(() => {
          if (notice === null) return undefined;
          const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
          return () => window.clearTimeout(timer);
        }, [notice]);

        const intervalList = h(
          'div',
          { className: 'dshogq-rows' },
          POLL_OPTIONS.map((option) =>
            h(
              'button',
              {
                type: 'button',
                key: option.key,
                className: 'dshogq-navrow',
                'data-on': option.ms === intervalMs ? 'true' : 'false',
                'aria-pressed': option.ms === intervalMs,
                onClick: () => {
                  setPollMs(option.ms);
                  setView('panels');
                  setNotice(option);
                },
              },
              h('span', { className: 'dshogq-caret', 'aria-hidden': true }, option.ms === intervalMs ? '✓' : ''),
              h('span', { className: 'dshogq-navlabel' }, t(option.key)),
            ),
          ),
        );

        const switches = h(
          'div',
          { className: 'dshogq-rows' },
          /* Always rendered, one line tall: the popover must not change height when
             the last switch flips, or it slides out from under the pointer. */
          h('div', { className: 'dshogq-panelnote' }, allHidden ? t('panelEmpty') : ''),
          PANEL_IDS.map((panel) => {
            const on = !hidden.has(panel.id);
            return h(
              'button',
              {
                type: 'button',
                key: panel.id,
                className: 'dshogq-toggle',
                'data-on': on ? 'true' : 'false',
                role: 'switch',
                'aria-checked': on,
                onClick: () => setPanelVisible(panel.id, !on),
              },
              h(
                'span',
                { className: 'dshogq-switch', 'data-on': on ? 'true' : 'false', 'aria-hidden': true },
                h('span', { className: 'dshogq-knob' }),
              ),
              h('span', { className: 'dshogq-togglelabel' }, t(panel.labelKey)),
            );
          }),
        );

        /* The select-all / invert pair sits above the switches, where it reads as
           a bulk action on the list below it rather than a footer afterthought. */
        const shownCount = PANEL_IDS.filter((panel) => !hidden.has(panel.id)).length;
        const toolbar = h(
          'div',
          { className: 'dshogq-paneltools' },
          h(
            'button',
            { type: 'button', className: 'dshogq-tool', onClick: () => showAllPanels() },
            t('panelAll'),
          ),
          h(
            'button',
            { type: 'button', className: 'dshogq-tool', onClick: () => invertPanels() },
            t('panelInvert'),
          ),
          h('span', { className: 'dshogq-toolcount' }, `${shownCount}/${PANEL_IDS.length}`),
        );

        const toast =
          notice === null || view === 'interval'
            ? null
            : h(
                'div',
                { className: 'dshogq-toast' },
                fill(t(notice.ms === 0 ? 'intervalSavedManual' : 'intervalSaved'), { value: t(notice.key) }),
              );

        /* The list and its notes are two panels: opening a release must leave the
           list exactly as it was, and the notes take the whole screen height so a
           long changelog is read, not scrolled in a 300px box. */
        const versionView = (position) => {
          const list = h(VersionPopover, {
            position: position,
            t: t,
            state: version.state,
            locale: locale,
            busy: version.busy,
            onRefresh: version.refresh,
            active: versionActive,
            setActive: setVersionActive,
            onBack: () => setView('panels'),
            backLabel: t('panelBack'),
          });
          if (versionActive === null || position === null || position === undefined) return list;
          const payload = version.state.phase === 'ready' ? version.state.payload : null;
          const releases = payload !== null && Array.isArray(payload.releases) ? payload.releases : [];
          const selected = releases.find((release) => release.tag === versionActive) ?? null;
          if (selected === null) return list;
          const listRight = position.left + VERSION_WIDTH;
          const left = Math.max(8, Math.min(listRight, window.innerWidth - 420));
          return [
            list,
            h(VersionNotePopover, {
              key: 'notes',
              position: { left: left, bottom: 8 },
              maxWidth: Math.max(320, window.innerWidth - left - 8),
              t: t,
              locale: locale,
              release: selected,
            }),
          ];
        };

        return h(
          CellShell,
          {
            mode: 'hover',
            flush: true,
            /* Anchored to its own left edge: this is the first cell in the row, and
               a popover that opened to its right would sit over the next cell — the
               pointer crossing that cell would open *its* popover instead. */
            wide: true,
            width: view === 'version' ? VERSION_WIDTH : 252,
            title: t('panelTitle'),
            hint: t('panelHint'),
            glyph: h(SlidersGlyph, null),
            label: null,
            onOpenChange: (isOpen) => {
              if (!isOpen) {
                setView('panels');
                setVersionActive(null);
              }
            },
            renderPopover: (position) => (view === 'version' ? versionView(position) : h(
                    PopoverBox,
                    {
                      position: position,
                      width: 252,
                      title: view === 'interval' ? t('intervalTitle') : t('panelTitle'),
                      subtitle: view === 'interval' ? t('intervalHint') : t('panelHint'),
                      footer: h(
                        'span',
                        { className: 'dshogq-footrow' },
                        /* The "select all / invert" pair moved above the switches;
                           the footer keeps only the two view buttons. */
                        h(
                          'span',
                          { className: 'dshogq-links' },
                          /* Version first, then cadence: both are "set once"
                             controls that used to live in their own cells. */
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dshogq-verbtn',
                              'data-on': view === 'version' ? 'true' : 'false',
                              'aria-pressed': view === 'version',
                              title: t('versionTitle'),
                              'aria-label': t('versionTitle'),
                              onClick: () => setView((current) => (current === 'version' ? 'panels' : 'version')),
                            },
                            h(DeepSeekMark, { height: 12 }),
                            updateAvailable ? h('span', { className: 'dshogq-badge', 'aria-hidden': true }) : null,
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'dshogq-clock',
                              'data-on': view === 'interval' ? 'true' : 'false',
                              'aria-pressed': view === 'interval',
                              title: t('intervalTitle'),
                              'aria-label': t('intervalTitle'),
                              onClick: () => setView((current) => (current === 'interval' ? 'panels' : 'interval')),
                            },
                            h(ClockGlyph, null),
                          ),
                        ),
                      ),
                    },
                    /* A fixed-height body keeps the top edge still while the switch list
                       changes: a shrinking panel would slide out from under the pointer
                       that just clicked a bulk action. */
                    h('div', null, toast, view === 'interval' ? intervalList : h('div', null, toolbar, switches)),
                  )),
          },
        );
      };
    }

    /** A clock glyph for the cadence cell. */
    function ClockGlyph() {
      return h(
        'svg',
        { className: 'dshogq-marksvg', width: 14, height: 14, viewBox: '0 0 14 14', 'aria-hidden': true },
        h('circle', { cx: 7, cy: 7, r: 5.4, fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', {
          d: 'M7 4.2V7l2 1.4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
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

        /* First, and never gated: the sidebar foot is one fixed-width row that
           clips whatever does not fit, so the one control that brings cells back
           has to sit where the row cannot cut it off. It also never moves when a
           cell is switched, which is what makes it findable. */
        register('opencode-go-panels', 39, 'panelTitle', withLocale(makeSettingsCell()));
        register('opencode-go-quota', 40, 'title', gated('go-usage', makeQuotaCell(ctx)));
        register('opencode-go-ark', 41, 'arkTitle', withLocale(gated('ark', makeArkCell())));
        register('opencode-go-providers', 42, 'providersTitle', withLocale(gated('providers', makeWatchCell())));
      },
    };
  },
});
