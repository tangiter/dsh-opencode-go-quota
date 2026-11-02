# OpenCode Go 侧边栏 · `@local/opencode-go-quota`

在 DSH Web 界面**侧边栏底部**（Settings 旁边）并排三个单元格，从左到右：

| 单元格 | 平时显示 | 打开后 |
| --- | --- | --- |
| **用量** | 三根迷你竖条（时段 / 本周 / 本月），宽栏时再加最紧一项的百分比 | 悬停弹出：每个窗口的占用条、剩余比例、重置倒计时 |
| **OpenCode 标志** | OpenCode 方框标记，宽栏时加模型总数 | 悬停弹出：折叠的两栏（实时清单 / 差异），底部是「控制台」和「Go 官方文档」两个链接 |
| **Ver** | 标签图标 + `Ver`，有新版本时带一个圆点 | 悬停弹出：折叠的两栏（当前版本 / 更新内容），展开后在右侧给出里程碑与双语更新日志 |

三格都是**悬停展开、移开收起**（移开后留 140ms 宽限，方便把指针移进弹层）；点击只是再次确认展开，不用于关闭。

按住左键在弹层里拖选文字时，弹层**不会被关闭**：mousedown 会把焦点从触发按钮移走（失焦关闭），拖出面板边缘还会触发移开关闭，
两者都会把面板连同刚选中的文字一起拆掉。修法是按住期间挂起这两种关闭，松开时若指针仍在面板内、或这次拖动确实产生了选区，
面板就保持打开，方便复制；指针在面板外松开且没有选区时才关闭。弹层自身还显式开启 `user-select:text`，因为侧边栏外壳是禁选中的。
弹层背景用的是不透明的 `--dsw-alias-bg-overlay`，而不是宿主菜单那套半透明的
`--dsw-specific-menu`（浅色 58%、深色 45% 不透明度）——这里要显示细字，半透明会透出底下内容。

### 刷新规则

用量那一格每 60 秒自动轮询一次（页面不可见时不轮询），因为它是常看的读数。

**模型**和 **Ver** 两格不轮询，只在这三种时机读上游：

1. **页面加载**（等于启动一次）；
2. **每天 08:00 本地时间一次**——靠一个 60 秒的定时器检查是否已过今天的 08:00，过期就重读；
   网页被挂起过也不会变成每分钟刷一次，因为读到新答案后边界就推到明天了；
3. **手动点弹层标题右边的刷新图标**。

弹层标题栏里的小图标就是第 3 条，点击会带 `?force=1` 强制绕过 Host 缓存，直接重新打上游。
绿色圆点只在「这次刷新发现了变化」时出现：模型格看的是相对上次快照的新增/下架，
Ver 格看的是 npm `latest` 是否高于你正在跑的版本。

### 模型弹层的两栏

官方文档的模型说明**不再复述进弹层**，改成底部一个可点击的链接直接跳过去。弹层主体是一列两栏，
两栏都可折叠，且**一次只展开一栏**——点开某一栏，另一栏自动收起。

| 栏目 | 折叠时显示 | 展开后右侧新增面板里的内容 |
| --- | --- | --- |
| 「全部模型（实时）」 | `37 · 15:10`（数目＋读取时间） | 本次接口返回的完整清单，按字母排序 |
| 「差异对比」 | 变更总数 | 「下架」＝快照里有、这次没有；「新增」＝这次有、快照里没有 |

展开是**向右侧新增一栏**而不是向下撑开：左栏用 `flex:none`，宽度永远由它自己的行决定，
弹层加宽多出来的部分全部给右侧面板，所以左栏的位置一动不动（flex 默认会压缩子项，这里必须显式关掉）。
收起时弹层宽度自适应内容（`max-content`），展开时固定 440px；内容区高度上限 220px，
超出的清单在面板内部滚动。再点一次同一栏则收起。

选中的栏目状态放在单元格里而不在弹层里，所以宽度变化能触发定位重算；移开指针关闭弹层后，
下次展开又从「全部收起」开始。

快照存在浏览器 `localStorage` 的 `opencode-go-quota:models:v1`，**自动写入，无需手动保存**：
页面加载、每日 08:00、手动刷新这三种时机读到上游后都会把它更新为本次清单，所以它就是「上次获取」的基线。
界面不再单列一栏展示这份清单，只把对比结果放进「差异对比」一栏；首次访问还没有基线时，该栏给出一句说明，
并把本次清单记为基线，之后刷新即可对比。

Host 半边仍然计算并返回 `docsBaseline`（内置的 2026-10-15 文档清单，32 个），
只是界面不再展示它。弹层底部是两个链接，都开新标签页：**控制台**
（`opencode.ai/console`）和 **Go 官方文档**（`opencode.ai/zh/go`）。

**Ver** 弹层用的是同一套折叠结构，默认也是收起，两栏：

| 栏目 | 折叠时显示 | 展开后右侧新增面板里的内容 |
| --- | --- | --- |
| 「当前版本」 | 版本号 ＋「有新版本 / 已是最新」徽章 | 当前 / 最新 / alpha / next 四行里程碑，各带发布日期；以及 npm 或 Release 读取失败时的报错 |
| 「更新内容」 | 比当前更新的 Release 数 | 每个 Release 的版本、通道、日期，以及按界面语言选取的双语更新日志 |

「有新版本」这个徽章特意留在**折叠态的行里**，所以不展开也能一眼看到，跟 Ver 单元格旁边的圆点是同一份判断。
发布日期取自 GitHub Release，npm `time` 作为兜底。

颜色：低于 70% 用品牌色，70–89% 警告色，≥90% 或上游报异常状态用错误色。

三个单元格的数据都来自 Host 半边的同源路由，**API Key 不会出现在任何发往浏览器的响应里**：

| 路由 | 上游 | 缓存 |
| --- | --- | --- |
| `/opencode-go-quota/usage` | `GET <baseUrl>/usage` | `refreshMs`（默认 60 秒） |
| `/opencode-go-quota/models` | `GET <baseUrl>/models` | `infoRefreshMs`（默认 15 分钟） |
| `/opencode-go-quota/version` | npm registry + GitHub Release | `infoRefreshMs` |
| `/opencode-go-quota/models/sync`（**仅 POST**） | 上述 `/models` ＋ 逐个模型实测 | 无（动作路由，写完即返回） |

模型目录里**没有可用的"新旧"信号**（37 个条目的 `created` 时间戳完全相同），所以"更新了哪些模型"
由两条显式基准回答：内置的官方文档清单（下方 `DOCS_BASELINE_MODELS`，带日期），以及浏览器里
保存的上次快照。后者存在 `localStorage` 的 `opencode-go-quota:models:v1`。

### 更新模型分栏（v1.4.0）

弹层页脚在 **Go 官方文档** 右边多了一个 **更新模型** 按钮。它解决的是这个问题：实时目录里出现的
模型，`pi-ai` 内置快照要等到依赖升级才认识，在那之前 DSH 的目录路由根本看不到它们。

点一下，Host 会依次做：

1. 读 `pi-ai` 内置的 `opencode-go.json` 快照（30 个模型，含各自协议）
2. 拉实时 `/models`（37 个）
3. 算差集 ＝ 目录外模型
4. 逐个实测协议：`chat/completions` → `/messages`（用 `x-api-key`）→ `/responses`
5. 实测视觉与推理
6. 按协议分栏生成 YAML，整块写回 `cordis.patch.yml`

**为什么必须按协议分栏**：DSH 的 `api` 是 provider 级字段，`PiAiModelProfile` 里根本没有 `api`，
所以一种协议只能占一栏。而同一个网关里方言并不统一 —— 实测 `claude-haiku-5-5` 只认
`anthropic-messages`，`gpt-6-luna` 只认 `openai-responses`，其余多数吃 `openai-completions`。

写入范围只有 `cordis.patch.yml` 里的标记区块，块外一个字节都不动：

```yaml
      # >>> BEGIN auto-managed: opencode-go-quota
      opencode-go-new: ...
      # <<< END auto-managed: opencode-go-quota
```

配合 profile 的 `patchReload: live`，写完自动热重载，不需要重启 DSH。

**用量弹层右下角的版本号**：`v1.5.0` 这样的浅色小字。它取的是 Host 半边从自己 `package.json`
读到的版本（随每次响应放在 `source.version` 里返回），所以改版本号只需改 `package.json`，
不用在界面上另找地方同步。

**能力怎么判定**

| 能力 | 判定方式 | 为什么这么做 |
| --- | --- | --- |
| 协议 | 依次试三种端点，只有 `ModelProtocolUnsupported` 才换下一个 | 其它错误（地区封锁、需同意训练）换协议也没用，直接记入跳过清单 |
| 视觉 | 「纯文本」与「带图」两次请求的 `prompt_tokens` 增量 ≥ 5 | 图像被丢弃时正文与纯文本完全相同、增量恒为 0；而「让模型描述图像再匹配关键词」不可靠，实测有模型把红图答成 Blue，但图像 token 照样计入 |
| 推理 | 用一道会诱发推理的题，看有没有 `reasoning_content` / thinking 块 | 手工声明的模型不写 `reasoningEfforts` 时 DSH 会当成「不推理」，所以必须先测出来 |

**耗时与复用**：首次点击要对每个新模型发 4~6 个请求，约 2~5 分钟；之后点击复用区块里已有的
结论，**3 秒左右**返回且幂等（内容没变就不写文件）。复用而不是每次重测，是为了避免上游抖动
把已知能力反复翻面。需要强制重测时：

```
curl -X POST http://127.0.0.1:3080/opencode-go-quota/models/sync?force=1
```

**无法启用的模型**会连同具体原因一起跳过，例如 `beam-free` 与 `gpt-6-luna` 在本地区返回 403，
`gemini-4-argon-contributor` 需要先在控制台同意「用你的数据训练」。

---

### 第三方目录：Agnes / SenseNova（v1.6.0，可选）

第四格在侧边栏底部（`Ver` 右边），把任意 **OpenAI 兼容网关**的模型清单也纳入监控。

**默认不启用**：`cordis.patch.yml` 里不写 `watchProviders` 就不会出现这一格（不影响前三格）。
启用只需在插件行的 `config` 里加：

```yaml
        watchRefreshMs: 900000        # Host 侧清单缓存，默认 15 分钟
        watchProviders:
          - id: agnes
            label: Agnes
            baseUrl: https://apihub.agnes-ai.com/v1
            apiKeyEnv: AGNES_API_KEY  # 走 ctx.credentials 解析，不写明文
            docs: https://agnes-ai.com/zh-Hans/docs/overview
            consoleUrl: https://platform.agnes-ai.com
          - id: sensenova
            label: SenseNova
            baseUrl: https://token.sensenova.cn/v1
            apiKeyEnv: SENSENOVA_API_KEY
            docs: https://platform.sensenova.cn/docs
            consoleUrl: https://platform.sensenova.cn
```

凭据仍按「配置 API Key」那节的办法写进 `$DSH_HOME/.credentials.yaml` 的 `refs:`，或设成同名环境变量。

**它显示什么**：每家的模型数、全部模型 id、以及相对浏览器上次快照的**新增/下架**；格子本身在宽栏时
显示两家模型总数，有新变动时带绿点。刷新节奏与 `模型`／`Ver` 两格一致（页面加载、每天 08:00、手动刷新）。

**它刻意不显示用量**：实测 Agnes 与 SenseNova 都**没有**面向 API key 的用量/配额接口——

| 探测 | 结果 |
| --- | --- |
| Agnes `/v1/dashboard/billing/usage` | 200，但恒为 `total_usage: 0`（占位实现） |
| Agnes `/v1/dashboard/billing/subscription` | 200，占位额度（`hard_limit_usd: 100000000`） |
| Agnes LiteLLM 管理端点（`/key/info`、`/spend/logs`…） | 403（网关只放行 `/v1/*`） |
| Agnes 国际站 `api.agnes-ai.com/api/v1/*` | 401 `Login expired`（需控制台登录态） |
| 正常对话响应头 | 无额度/限流字段 |
| SenseNova `/v1/{usage,quota,balance,credits,…}` | 全部 404 |

所以每节右上角给的是**控制台链接**，弹层底部明确写着「用量与配额只能登录控制台查看」。
另外 Agnes 的 API 网关只暴露 `/v1/*` —— 同一账号的中文站与国际站共用 `apihub.agnes-ai.com`，
key 在两边通用。

---

## 安装

两条路，按机器情况选一条。

### 方式 A：从 git 安装（推荐，前提是 `git` 在 PATH 上）

```
plugin_manager
  action: install_bundle
  target: git+https://github.com/tangiter/dsh-opencode-go-quota.git
```

**前提**：运行 DSH 的那个进程必须能在 PATH 上找到 `git`，否则 pnpm 会直接报
`ERR_PNPM_GIT_RESOLVE_FAILED: git executable not found on PATH`（跟网络无关，纯粹是找不到 git）。
macOS 装了 Xcode Command Line Tools、Windows 装了 Git for Windows、Linux 装了 `git` 包，一般就满足。
想确认，在 DSH 的终端里跑 `git --version`。

这条路装出来的是**包副本**（存在 pnpm store 里，`node_modules` 下是指向 store 的 junction），
所以仓库目录放哪儿都行、删掉也不影响运行。升级用 `pnpm update`。

### 方式 B：从本地目录安装（不需要 git）

把仓库克隆或解压到一个**长期不变的位置**，然后用那个绝对路径安装：

```
plugin_manager
  action: install_bundle
  target: <这个目录的绝对路径>
```

这条路用的是 pnpm 的 `link:`（目录软链），**装好之后不能移动或删除该目录**，否则插件失效。
建议放在工作区里：

| 平台 | 建议位置 |
| --- | --- |
| Windows | `<你的工作区>\opencode-go-quota` |
| macOS / Linux | `~/dsh-workspace/opencode-go-quota` |

### 安装完成后

看 `application` 字段：`applied` 才算生效。**不需要重启**，装完即可在侧边栏看到。

### 配置 API Key（必做）

插件只认一个凭据引用：**`OPENCODE_GO_API_KEY`**。三种配法任选其一：

1. **设置界面**：DSH 里「设置 → 模型」，配置 OpenCode Go / `opencode-go` provider 的 API Key；
2. **凭据文件**：在 `$DSH_HOME/.credentials.yaml` 的 `refs:` 下写
   ```yaml
   refs:
     OPENCODE_GO_API_KEY: sk-...
   ```
3. **环境变量**：启动 `dsh` 前设好 `OPENCODE_GO_API_KEY`。

> **同一个账号的不同电脑请用同一把 Key。** 额度是记在订阅上的，不是记在机器上的——
> 两台机器看到的是**同一份**数字，两个终端的消耗会累加进同样的窗口。这正是你想要的效果。

如果另一台机器用的是**另一个账号**，那就把 `cordis.patch.yml` 里的 `apiKeyEnv` 改成
另一个变量名（例如 `OPENCODE_GO_API_KEY_WORK`），再按上面的方式配上对应的 Key。

### 验证

- 侧边栏底部 Settings 旁边出现三根小竖条；
- 悬停弹出明细，三行数字应与 [console](https://opencode.ai/console) 里看到的一致；
- 若弹层显示红色报错文字，对照文案排查：
  - 「没有为 OPENCODE_GO_API_KEY 配置凭据」→ 上面配置 Key 那步没做或变量名不符；
  - 「Go API Key 被拒绝」→ Key 失效或写错；
  - 「无法连接用量接口」→ 网络到不了 `opencode.ai`。

### 如果装是装上了，但侧边栏什么都没有

说明那台机器的 DSH 里**没有 `sidebar.footer.action` 这个槽位**。槽位不存在时
`ctx.slots.inject` 的回调永远不会触发，插件会静默地什么都不注册（不报错、不崩溃）。

在创造模式会话里跑一次检查即可确认：

```
cordis_inspect_query
  platform: client
  provider: Slots
  method:   listSubTree
  input:    {"root": "sidebar.footer.action"}
```

`available: false` 就表示槽位不存在 —— 把那台机器的 DSH 升级到与本机相同或更新的版本。
`available: true` 但 occupants 里没有 `opencode-go-quota` / `opencode-go-models` /
`opencode-go-version` 这三个 id，则多半是浏览器缓存了旧的 bundle，刷新一次页面即可。

---

## 可调参数

改 `cordis.patch.yml` 里那一行的 `config`（改配置会被热重载，不用重启）：

```yaml
- insert:
    - id: opencode-go-quota
      name: '@local/opencode-go-quota'
      config:
        baseUrl: https://opencode.ai/zen/go/v1        # 换端点；`/usage`、`/models` 会自动追加
        apiKeyEnv: OPENCODE_GO_API_KEY                # 换凭据引用名
        refreshMs: 60000                              # 用量答案的缓存时长
        infoRefreshMs: 900000                         # 模型目录与版本答案的缓存时长
        timeoutMs: 15000                              # 单次上游请求超时
        registryUrl: https://registry.npmjs.org       # npm 版本来源
        releasesRepo: deepseek-ai/deepseek-harness    # 更新说明来源
```

`infoRefreshMs` 不宜调小：GitHub 的 Release 接口对未认证请求限制 **60 次/小时**，
默认 15 分钟缓存意味着页面开着一天也只消耗 4 次左右。

用量那一格固定每 60 秒轮询一次，且**页面不可见时不轮询**——没有页面开着时完全不产生流量。
想改轮询节奏，编辑 `client.js` 顶部的 `POLL_MS`。

---

## 卸载

```
plugin_manager
  action: remove_bundle
  target: '@local/opencode-go-quota'
```

然后可以删掉这个目录。

---

## 实现要点（便于以后改）

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host 半边：解析 Key、调上游、归一化，经三条同源路由提供给页面 |
| `client.js` | Client 半边：在 `sidebar.footer.action` 注册三个单元格；纯视图与容器分离，弹层外壳 `PopoverBox` / `CellShell` 共用 |
| `cordis.patch.yml` | 插入插件行并声明可调参数 |
| `icon.svg` / `locale/*.json` | 插件管理页的图标与标题、描述 |

- 三条路由都带 Host 的信任围栏（未认证请求 401），与系统自带的 `/open-in-app/*` 同一套机制；
- 上游返回形状都做了兼容：用量认 `{ usage: {...} }` 与 `{ windows: [...] }`，
  模型认 `{ data: [...] }` 与 `{ models: [...] }`，Release 正文按 `<h3 id="cn-…">` / `id="en-…"`
  锚点切成双语；
- 任何一方无法识别或读不到时**显示具体错误而不是伪造数值**，避免把"读失败"误读成"用量为 0"。

**注意**：`/usage` 与 `/models` 这两个端点官方文档没有记载，属于未文档化接口，上游可能随时
变更路径或返回结构。真被改了，弹层会给出提示，改 `index.js` 里的 `extractWindows` / `readModels`
即可适配。`DOCS_BASELINE_MODELS` 是抓取当天的文档清单，会随时间过时——那是它的设计意图，
它只用来回答"接口里有哪些是文档还没写的"。

---

## 改 Host 半边（`index.js`）

DSH 的 HMR **默认只监听配置文件，不监听插件源码**（base bundle 给的是 `root: []`）。
后果是：`client.js` 的改动会被浏览器侧自己的加载机制捡起（刷新页面即生效），
而 `index.js` 的改动会一直等到 DSH 重启。

要让它也热重载，在 profile 的 `cordis.patch.yml` 里给 `hmr` 这一行加上本插件的源码目录：

```yaml
- id: hmr
  config:
    root:
      - '<本插件的绝对路径>'
```

实测在运行中写入**也能生效**（profile patch 变化会触发重新组合）。之后任何一次真实写入
（编辑保存、或 `[IO.File]::WriteAllBytes` 原样回写）都会在 chokidar 的 2 秒写稳定窗口后
替换模块缓存并重载该条目。

验证办法：探测三条路由，已注册的返回 **401**，未注册的返回 **404**——拿一个随便编的路径做对照：

```
GET /opencode-go-quota/version   -> 401   已注册（未认证）
GET /zzz-nope                    -> 404   未注册
```

注意 `root` 覆盖会**替换整个 `config`**，`base` / `ignored` / `debounce` 留默认值即可。
另外：替换**已安装包的版本**仍然需要重启，HMR 只管源码文件。
