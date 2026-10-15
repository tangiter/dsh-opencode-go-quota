# OpenCode Go 侧边栏 · `@local/opencode-go-quota`

在 DSH Web 界面**侧边栏底部**（Settings 旁边）并排三个单元格，从左到右：

| 单元格 | 平时显示 | 打开后 |
| --- | --- | --- |
| **用量** | 三根迷你竖条（时段 / 本周 / 本月），宽栏时再加最紧一项的百分比 | 悬停弹出：每个窗口的占用条、剩余比例、重置倒计时 |
| **OpenCode 标志** | OpenCode 方框标记，宽栏时加模型总数 | 点击弹出：官方文档未列出的模型、自上次查看新增/下架的模型、全部模型 |
| **Ver** | 标签图标 + `Ver`，有新版本时带一个圆点 | 点击弹出：当前 DSH 版本 / npm `latest` / `alpha`，以及每个更新版本的双语更新说明 |

颜色：低于 70% 用品牌色，70–89% 警告色，≥90% 或上游报异常状态用错误色。

三个单元格的数据都来自 Host 半边的同源路由，**API Key 不会出现在任何发往浏览器的响应里**：

| 路由 | 上游 | 缓存 |
| --- | --- | --- |
| `/opencode-go-quota/usage` | `GET <baseUrl>/usage` | `refreshMs`（默认 60 秒） |
| `/opencode-go-quota/models` | `GET <baseUrl>/models` | `infoRefreshMs`（默认 15 分钟） |
| `/opencode-go-quota/version` | npm registry + GitHub Release | `infoRefreshMs` |

模型目录里**没有可用的"新旧"信号**（37 个条目的 `created` 时间戳完全相同），所以"更新了哪些模型"
由两条显式基准回答：内置的官方文档清单（下方 `DOCS_BASELINE_MODELS`，带日期），以及浏览器里
保存的上次快照。后者存在 `localStorage` 的 `opencode-go-quota:models:v1`。

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
