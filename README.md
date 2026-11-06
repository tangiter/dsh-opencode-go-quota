# OpenCode Go 侧边栏 · `@local/opencode-go-quota`

在 DSH Web 界面**侧边栏底部**并排若干单元格。最左边是一个**齿轮**（板块设置），
它永远不会被关掉；右边依次是：

| 单元格 | 平时显示 | 打开后 |
| --- | --- | --- |
| **⚙ 设置** | 三根滑杆图标 | 悬停弹出：顶部「全选 / 反选」+ 已选计数，下面每个板块一个开关，底部两个小控件——**鲸鱼**（DSH 版本）和**时钟**（读数刷新间隔）；关掉的格子立即消失 |
| **OpenCode Go** | OpenCode 方框标记 + 三根迷你竖条，宽栏时再加最紧一项的百分比 | 悬停弹出：三个窗口的占用条、剩余比例、重置倒计时；右下角一个「模型 29」按钮，点了在**右侧另开一张面板**（全部模型 / 差异对比）；页脚是控制台、Go 文档和「更新模型」 |
| **火山方舟** | 火山官方蓝峰标志 + 四根 AFP 竖条，宽栏时再加最紧窗口的百分比 | 悬停弹出：四个 AFP 窗口（5 小时 / 今日 / 本周 / 本月）的已用÷配额与重置倒计时；右下角并排两个按钮——「用量 5.79M」在左、「模型 27」在右，各自在**右侧另开一张面板** |
| **第三方目录** | 「模型」图标（三层叠片），宽栏时加模型总数 | 悬停弹出：Agnes / SenseNova 两个小节，各带自己的品牌标志、模型数与新增徽章 |

两个套餐格子的读法统一成**「先 logo，后小竖条」**：先说明这是谁家的额度，再给出余量条；
Go 与火山各自用自家标记（OpenCode 方框 / 火山官方蓝峰 `favicon.png`），右侧才是三根、四根竖条。
侧边栏那一行里的两个标志走**灰度**（`.dshogq-wrap .dshogq-markimg{filter:grayscale(1)}`）：那一行是界面外壳，
彩色的品牌色块挨着一排灰色图标会显得突兀；弹层内部（标题左边、第三方小节）仍保留原色，那里是内容区。
`第三方目录` 用一枚**「模型」图标**（三层叠片，取自 Lucide 的 `layers`），因为它管的不是额度而是模型清单。

格子之间留 6px 空隙（每格左右各 3px 外边距），悬停高亮才读得出是四个独立按钮；格子内部间距不变。

**版本不再是独立格子**（v2.0 起）：它被收进齿轮弹层，就是底部那个**鲸鱼**按钮——
点开在同一个弹层里换成版本视图，左上角一个 `‹` 返回板块开关。理由很简单：版本关注频率低，
一年看不了几次，不值得长期占一格；它旁边的绿点仍然表示「有新版本」，所以不点也知道。
弹层里一次只显示一种视图：板块开关 / 间隔选择 / 版本，三者互斥。

格子都是**悬停展开、移开收起**（移开后留 220ms 宽限，方便把指针移进弹层）；点击只是再次确认展开，不用于关闭。面板底边与格子贴齐（0 间距），指针上移不会经过一段"外面"。

### 板块开关（v1.9.0）

想只留 OpenCode、或只想看火山方舟，点最左边的**齿轮**：弹层里每个板块一个开关
（现在三项：OpenCode Go / 火山方舟套餐 / 第三方目录），
点一下该格子立刻消失或出现，**不用刷新页面**。选择存在浏览器
`localStorage` 的 `opencode-go-quota:panels:v1`，只影响当前浏览器。

- **齿轮永远保留**：全部板块关掉后侧边栏只剩这一个图标，弹层里会写一句
  「全部板块都关了」，随时能开回来。它也是唯一不受开关控制的格子。
- **它排在最左**，因为侧边栏底部是一行固定宽度、超出就被裁掉的布局：放在最右边
  时，格子一多它自己会被裁掉、点不到。放最左既不会被裁，也不会因为开关
  别的格子而左右移动。
- 齿轮又单独**向左挪了 5px**（`position:relative; left:-5px`），贴着侧边栏的内边距线；
  用相对位移而不是外边距，所以后面几格的位置一个像素都没动。
- 关掉的格子**完全不挂载**（不是渲染成空），所以它既不轮询也不请求 Host。
- 列表上方一排批量操作：**全选**（一键恢复全部）和**反选**（显示/隐藏互换），右侧显示 
/3。它们就是原来的「全部显示」，从页脚挪到了列表头上。
- 页脚右下角是**本插件的版本号**（`v2.3.2`），取自 Host 每次响应里的 `source.version`；不用打开 Go 那格也知道跑的是哪一版。
- 那行状态提示**固定占一行**（min-height:19px），所以开关全关时弹层高度不变——否则面板会在指针底下抽走，刚点完批量操作就被关掉。
- 新装/新浏览器默认全部显示。

按住左键在弹层里拖选文字时，弹层**不会被关闭**：mousedown 会把焦点从触发按钮移走（失焦关闭），拖出面板边缘还会触发移开关闭，
两者都会把面板连同刚选中的文字一起拆掉。修法是按住期间挂起这两种关闭，松开时若指针仍在面板内、或这次拖动确实产生了选区，
面板就保持打开，方便复制；指针在面板外松开且没有选区时才关闭。弹层自身还显式开启 `user-select:text`，因为侧边栏外壳是禁选中的。
弹层背景用的是不透明的 `--dsw-alias-bg-overlay`，而不是宿主菜单那套半透明的
`--dsw-specific-menu`（浅色 58%、深色 45% 不透明度）——这里要显示细字，半透明会透出底下内容。

### 刷新规则

用量那一格默认每 60 秒自动轮询一次（页面不可见时不轮询），因为它是常看的读数。
**这个间隔可以自己改**：齿轮弹层底部有一个**时钟**按钮（在鲸鱼和「全部显示」之间），
点一下把弹层正文切换成间隔选择——30 秒 / 1 / 2 / 5 / 10 / 30 分钟 / **仅手动**；
再点一次回到板块开关。选好会自动回到开关视图，并飘一句确认。
选择存在浏览器 `localStorage`（`opencode-go-quota:pollMs:v1`），只影响当前浏览器，
改完立刻生效、不用刷新页面；选「仅手动」时完全不自动请求，只在弹层的刷新按钮上按一次才读。
无论选哪档，**标签页不可见时都不发请求**。

**版本视图**就在同一个弹层里：点底部的**鲸鱼**切换过去（再点一次或按左上角 `‹` 回来）。
它是一张**对齐的三栏表**（v2.1 重排）：宽 440，点开某个版本后加宽到 780。

| 区域 | 内容 |
| --- | --- |
| 标题行 | `DSH 版本` + **有新版本 / 已是最新**徽章（从「最新」那一行挪到标题上） |
| 里程碑四行 | 当前 / 最新 / alpha / next，**每一行都有版本号与发布日期**（当前版本取 release feed 里的发布日） |
| 「更新内容 N」 | 比当前更新的每个 Release 一行：版本 | 通道 | 日期 |
| 详情 | 点某一行，**列表面板原样不动**，右侧另开一张**独立面板**：高度占满屏幕（`calc(100vh - 16px)`），宽度跟随内容（`width:max-content`，上限视口宽）——发布说明的每一行都短，让它决定宽度就不会被挤成窄条 |

三栏用同一套网格（`46px / 1fr / 72px`，Release 行首列加宽到 `98px` 以免版本号折行），
里程碑和 Release 列表因此上下对齐成一整张表。之所以不再把日志直接铺在列表里：
六个版本一起展开就是一面字墙；现在列表只有六行，想看谁再点谁。

**目录**和**版本**不轮询，只在这三种时机读上游：

1. **页面加载**（等于启动一次）；
2. **每天 08:00 本地时间一次**——靠一个 60 秒的定时器检查是否已过今天的 08:00，过期就重读；
   网页被挂起过也不会变成每分钟刷一次，因为读到新答案后边界就推到明天了；
3. **手动点弹层标题右边的刷新图标**。

弹层标题栏里的小图标就是第 3 条，点击会带 `?force=1` 强制绕过 Host 缓存，直接重新打上游。
绿色圆点只在「这次刷新发现了变化」时出现：Go 格看的是相对上次快照的新增/下架，
鲸鱼按钮上的圆点看的是 npm `latest` 是否高于你正在跑的版本。

### Go 弹层：计量 + 旁边的目录面板（v2.0）

模型目录原来自己占一格，现在从用量弹层的**右下角按钮**打开，而且是**另一张面板**——
不是长在原弹层里。原因很实际：在原窗口里加一块，弹层会在指针底下变宽变高，
看着像布局抖动；现在计量面板的尺寸一像素都不变。

| 位置 | 内容 |
| --- | --- |
| 计量面板（300×~284） | 标题左边是 OpenCode 标记；三个窗口的占用条、剩余比例、重置倒计时；一条分割线，下面左下角「模型 29」按钮（靠左，好点） |
| 目录面板（560） | 点按钮后出现在**右侧、与计量面板贴边**，**没有菜单**：直接是全部模型 id，按列竖排；下面一条分割线，线下面是「下架 / 新增」的差异对比 |

模型多时自动加列：`.dshogq-modellist{columns:3 168px}` —— 29 个 id 排 3 列、10 行，
一屏放下且不截断（实测 `truncated: 0`、无滚动条）。差异对比放在分割线下面，
因为它是清单的脚注，不是和清单并列的一个"栏目"。

两张面板**贴边不重叠**（目录面板的 `left` = 计量面板的 `left + 300`），指针从一张走到另一张
始终在同一个 wrapper 里，悬停不会断；离开整个区域两张一起收起。视口不够宽时目录面板会被
夹到屏幕内（`innerWidth - 宽 - 8`）。

目录面板里左栏用 `flex:none`、宽度固定 252px，加宽多出来的部分全部给右侧明细，
所以左栏的位置一动不动（flex 默认会压缩子项，这里必须显式关掉）；明细区高度上限 330px，
超出的清单在面板内部滚动。再点一次同一栏则收起。

选中的栏目状态放在单元格里而不在弹层里，所以宽度变化能触发定位重算；移开指针关闭弹层后，
下次展开又从「全部收起」开始。

快照存在浏览器 `localStorage` 的 `opencode-go-quota:models:v1`，**自动写入，无需手动保存**：
页面加载、每日 08:00、手动刷新这三种时机读到上游后都会把它更新为本次清单，所以它就是「上次获取」的基线。
界面不再单列一栏展示这份清单，只把对比结果放进「差异对比」一栏；首次访问还没有基线时，该栏给出一句说明，
并把本次清单记为基线，之后刷新即可对比。

Host 半边仍然计算并返回 `docsBaseline`（内置的 2026-10-15 文档清单，32 个），
只是界面不再展示它。弹层页脚左端是 `Go 套餐 · v2.0.x`，右端是三样：**控制台**
（`opencode.ai/console`）、**Go 官方文档**（`opencode.ai/zh/go`）和**更新模型**按钮。

颜色：低于 70% 用品牌色，70–89% 警告色，≥90% 或上游报异常状态用错误色。

这些格子（Go、火山、第三方目录）以及设置里的版本视图，数据都来自 Host 半边的同源路由，**API Key 不会出现在任何发往浏览器的响应里**：

| 路由 | 上游 | 缓存 |
| --- | --- | --- |
| `/opencode-go-quota/usage` | `GET <baseUrl>/usage` | `refreshMs`（默认 60 秒） |
| `/opencode-go-quota/models` | `GET <baseUrl>/models` | `infoRefreshMs`（默认 15 分钟） |
| `/opencode-go-quota/version` | npm registry + GitHub Release | `infoRefreshMs` |
| `/opencode-go-quota/models/sync`（**仅 POST**） | 上述 `/models` ＋ 逐个模型实测 | 无（动作路由，写完即返回） |
| `/opencode-go-quota/ark/usage` | `GetAFPUsage`（火山管控面） | `ark.refreshMs`（默认 60 秒） |
| `/opencode-go-quota/ark/catalog` | `ListArkAgentPlanModel` ＋ `GetUsageDetails` | `ark.infoRefreshMs`（默认 15 分钟） |

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

最后一格在侧边栏底部，把任意 **OpenAI 兼容网关**的模型清单也纳入监控。
格子本身是那枚**「模型」图标**；弹层里每家一个小节，节标题前是该厂商**自己的标志**：

| 厂商 | 标志来源 | 落地方式 |
| --- | --- | --- |
| Agnes | 厂商自己发布的 `platform.agnes-ai.com/images/biglogo.svg` | 抽成三条路径内联。圆盘的镂空部分用弹层底色 token 画，而不是烤死白色，深浅色主题都不糊 |
| SenseNova | 厂商 favicon（`platform.sensenova.cn/favicon.ico`，65×65） | 转成 65×65 PNG 后以 `data:image/png;base64,…` 内联（608 字符），渲染时不发任何请求 |

两个标志都只用来标识对应小节（nominative use）。没配过的 provider 不会画标志，只显示名字。

**默认不启用**：`cordis.patch.yml` 里不写 `watchProviders` 就不会出现这一格（不影响其它格子）。
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

**不需要 API Key**。两家各有一条零凭据的取数路径，配置了 key 时仍然以实时接口为准：

| 提供方 | 零凭据来源 | 说明 |
| --- | --- | --- |
| **Agnes** | `docsIndex: https://wiki.agnes-ai.com/llms.txt` | Mintlify 发布的文档索引，模型页即清单 |
| **SenseNova** | `docsChunksPage: https://platform.sensenova.cn/docs` | 页面是 Next.js 外壳，但文档正文（含模型表格的原始 Markdown）编译在 `/_next/static/chunks/` 里。插件读页面 HTML → 找到含表格的 chunk → 解析。chunk 名带内容哈希、每次部署都变，所以是**发现**而非固定 URL |

两者都不是实时 API，因此徽章写 `[来自文档]`，点开可跳到对应文档。

**SenseNova 的抓取细节**：文档里那张表长这样（注意列宽填充空格）——

```
| Model Name               | Model ID                   | Description |
| SenseNova 6.8 Flash      | `sensenova-6.8-flash`      | …           |
```

解析器按行切 `|`、取第三格的反引号内容作为 id，并只在 id 形如 `[A-Za-z0-9][A-Za-z0-9._-]*` 时接受。
首次读取约 1.8 秒（扫描 17 个 chunk，实测第 7 个命中）；之后记住那个 chunk URL，直接单文件读取。
部署换了哈希会取不到，此时自动重新扫描。

**离线兜底**：`staticModels` / `staticAsOf` 仍保留一份带日期的快照。只有在扫描失败（比如站点改版）
时才会用到，徽章会变成 `[快照 2026-11-05]`。它不再是主数据源。

> 实用差异：Agnes 文档比实时接口多两个条目（`agnes-2.5-pro` 已被 `-alpha`/`-beta` 取代、
> `agnes-3.0-pro` 标注 coming soon），实时接口则多一个 `agnes-2.5-pro-alpha`。文档是近似镜像，
> 不是精确同步——徽章就是为此而设。

**它显示什么**：每家的模型数、全部模型 id、以及相对浏览器上次快照的**新增/下架**；格子本身在宽栏时
显示两家模型总数，有新变动时带绿点。刷新节奏与 Go 的目录一致（页面加载、每天 08:00、手动刷新）。

**按输出类型分组（v2.0）**：每个厂商小节内部再分「文本 / 图片 / 视频」，每类下面**一个模型一行竖排**
（等宽字体，右侧有上下文长度就顺带标出）；只有一组时不显示类名（「文本 10」盖在唯一一组上没有信息量）。

面板因此放大到 **560px**，两个厂商**并排两列**（`grid-template-columns: repeat(auto-fit, minmax(248px, 1fr))`，
第三个 provider 自动换行而不是被裁）。实测这套数据 377px 高、两列各 262px，**不出滚动条**。
改成竖排的原因：10 个模型摊成一行 chips 像一堆标签，竖着读才像清单。

类型从哪来——两家都没有干净的 capability 字段，所以按"能拿到的文字"判定，优先级依次是：

1. 插件配置里的 `modalities` 映射（**显式优先**，用于命名无规律的自建网关）：
   ```yaml
   - id: agnes
     baseUrl: https://apihub.agnes-ai.com/v1
     modalities:
       agnes-video-2.5: video
       agnes-image-2.1-flash: image
   ```
2. SenseNova 文档表里的 **Description 列**（Host 现在会解析这一格）：`image creation model` → 图片，
   含 `video` → 视频；
3. 模型 id / 名称里的关键词：`video`/`seedance` → 视频，`image`/`seedream`/`flux` → 图片；
4. 都没有 → **文本**（两家的绝大多数是对话模型）。

实测结果：Agnes 10 个（文本 5 / 图片 3 / 视频 2），SenseNova 9 个（文本 7 / 图片 2，U1.5 两个是图像模型）。

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

### 火山引擎 Agent Plan：AFP 额度 / 套餐模型 / 用量明细（v1.9.0）

「火山方舟」这一格把套餐的三份数据合到一处。弹层右下角**并排两个按钮**，
各自在右侧**另开一张面板**（和 Go 那格同一个机制）：

```
                         [用量 5.79M ▸]  [▤ 模型 27 ▸]
```

- 三个按钮**左对齐、各占一行**（容易点中）：`近 7 天 5.66M`、`近 30 天 10.63M`、`模型 27`。两个用量窗口各自一个按钮、各自一张面板。
- 点「近 7 天」/「近 30 天」→ 右侧 420px 面板，只放该窗口：区间、合计、每个模型一条细横条，图片模型用分隔线单独一组。
- 点「模型」→ 右侧 **560px** 面板：没有菜单，直接是套餐的 27 个模型 id（3 列竖排），下面一条分割线加「下架 / 新增」；标题左边是火山标志。
- 两个按钮互斥：点另一个会替换当前面板；再点同一个则收起。两个面板的标题左边都带火山标志。

| 面板 | 上游接口 | 说明 |
| --- | --- | --- |
| 计量（四个窗口条） | `GetAFPUsage` | AFP（Agent Frame Point）在 5 小时 / 今日 / 本周 / 本月四个滚动窗口的已用与总配额；`Quota`、`Used` 都是可带小数的字符串，界面按「已用 ÷ 配额」画条并给重置倒计时 |
| 「模型」面板的模型清单 | `ListArkAgentPlanModel`（`Edition: personal`） | 套餐当前可调用的模型 id（上下文长度进 tooltip） |
| 「用量」面板 | `GetUsageDetails`（`QueryInterval: Day`） | 按模型汇总的 token / 图片消耗，以及这段区间的合计 |
| 「模型」面板的「差异对比」 | 浏览器里的上次快照 | 与上次访问相比新增 / 下架的模型，存 `localStorage` 的 `opencode-go-quota:ark-models:v1` |

**鉴权是这里唯一容易踩的坑**。这三个接口都在**管控面**
`https://ark.<region>.volcengineapi.com/?Action=…&Version=2024-01-01`，只认
**Access Key 签名**：

```
Authorization: HMAC-SHA256 Credential=<AK>/<date>/<region>/ark/request,
               SignedHeaders=content-type;host;x-content-sha256;x-date,
               Signature=<HMAC-SHA256 派生密钥签名>
```

- **`ark-…` 开头的推理 API Key 在这里必定失败**（实测返回
  `InvalidAccessKey: The security token[…] included in the request is invalid.`），
  它只能用于数据面 `ark.cn-beijing.volces.com/api/v3/*`。
- 所以插件要的是一对 **Access Key ID + Secret Access Key**，默认从凭据引用
  `ARK_ACCESS_KEY_ID` / `ARK_SECRET_ACCESS_KEY` 解析：

```yaml
refs:
  ARK_ACCESS_KEY_ID: AKLT...
  ARK_SECRET_ACCESS_KEY: ...
```

  在 `$DSH_HOME/.credentials.yaml` 的 `refs:` 下写这两行即可（或设同名环境变量）。
  建议在火山控制台建一个只有 Ark 只读权限的子用户，用它的 AK/SK。
- 两个值都只在 Host 进程里使用，**不会出现在任何发往浏览器的响应里**；响应只带
  变量名（`source.accessKeyEnv` / `secretKeyEnv`），缺凭据时弹层显示
  「没有为 ARK_ACCESS_KEY_ID / ARK_SECRET_ACCESS_KEY 配置凭据。」

配置（`cordis.patch.yml` 里插件行的 `config.ark`）：

```yaml
        ark:
          enabled: true
          region: cn-beijing       # 换 region 会同时换 host 与签名 scope
          service: ark
          planEdition: personal    # personal | enterprise
          usageDays: 7             # 短窗口天数，1–31
          usageLongDays: 30        # 长窗口，8–31（面板里两个窗口一起显示）
          refreshMs: 60000         # AFP 额度缓存
          infoRefreshMs: 900000    # 模型清单 + 用量缓存
          accessKeyEnv: ARK_ACCESS_KEY_ID
          secretKeyEnv: ARK_SECRET_ACCESS_KEY
```

`enabled: false` 时两条路由都不注册，格子会显示「这一块在插件配置里被关掉了」。
企业版席位的用量要用 `GetSeatAFPUsage` / `GetSeatUsageDetails`，本插件没有接
（那是另一套响应结构）；给到 `enterprise` 也只能读到公共模型列表。

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

插件认三组凭据引用，按你要用的板块配：

| 凭据引用 | 用在哪 | 必需 |
| --- | --- | --- |
| `OPENCODE_GO_API_KEY` | OpenCode Go（用量 + 目录，以及设置里的版本读取） | 用 Go 时必需 |
| `ARK_ACCESS_KEY_ID` + `ARK_SECRET_ACCESS_KEY` | 火山方舟（AFP 额度 / 套餐模型 / 用量明细） | 用火山时必需 |
| `AGNES_API_KEY` / `SENSENOVA_API_KEY` | 第三方目录（可留空，会退到文档或快照） | 不必需 |

OpenCode Go 的 Key 三种配法任选其一：

1. **设置界面**：DSH 里「设置 → 模型」，配置 OpenCode Go / `opencode-go` provider 的 API Key；
2. **凭据文件**：在 `$DSH_HOME/.credentials.yaml` 的 `refs:` 下写
   ```yaml
   refs:
     OPENCODE_GO_API_KEY: sk-...
     ARK_ACCESS_KEY_ID: AKLT...
     ARK_SECRET_ACCESS_KEY: ...
   ```
3. **环境变量**：启动 `dsh` 前设好同名变量。

> **同一个账号的不同电脑请用同一把 Key。** 额度是记在订阅上的，不是记在机器上的——
> 两台机器看到的是**同一份**数字，两个终端的消耗会累加进同样的窗口。这正是你想要的效果。

如果另一台机器用的是**另一个账号**，那就把 `cordis.patch.yml` 里的 `apiKeyEnv` 改成
另一个变量名（例如 `OPENCODE_GO_API_KEY_WORK`），再按上面的方式配上对应的 Key。

> **火山的 AK/SK 不是 API Key。** `ark-…` 开头那把是数据面推理 Key，管控面接口会直接
> 回 `InvalidAccessKey`。AK/SK 在火山控制台「API 访问密钥」里生成（`AKLT…` 开头 + 一串
> Secret），建议用只有 Ark 只读权限的子用户。填好不用重启——凭据是每次调用时解析的。

### 验证

- 侧边栏底部出现一个齿轮，依次是：OpenCode（标记 + 三根竖条 + 百分比）、
  火山方舟（火山蓝峰 + 四根竖条 + 百分比）、第三方目录；点齿轮可以只留其中几格；
- 点齿轮 → 顶部「全选 / 反选」；底部两个控件：**鲸鱼**（版本视图，带更新圆点）、**时钟**（间隔选择）；
  **全部显示**；点鲸鱼换到 `DSH 版本` 视图，左上角 `‹` 回到开关；
- 悬停弹出明细，三行数字应与 [console](https://opencode.ai/console) 里看到的一致；
- 火山方舟那一格显示 AFP 百分比，弹层里四行数字与
  [订阅页](https://ark.volcengine.com/region:cn-beijing/subscription/agent-plan) 一致；
- 若弹层显示红色报错文字，对照文案排查：
  - 「没有为 OPENCODE_GO_API_KEY 配置凭据」→ 上面配置 Key 那步没做或变量名不符；
  - 「没有为 ARK_ACCESS_KEY_ID / ARK_SECRET_ACCESS_KEY 配置凭据」→ 火山的 AK/SK 没配；
  - 「Go API Key 被拒绝」/「火山 Access Key 被拒绝」→ 凭据失效或写错；
  - 「无法连接用量接口」→ 网络到不了对应站点。

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
`available: true` 但 occupants 里没有 `opencode-go-panels` / `opencode-go-quota` /
`opencode-go-ark` / `opencode-go-providers`
这些 id，则多半是浏览器缓存了旧的 bundle，刷新一次页面即可。

### 只看到齿轮、别的格子都没了

那不是故障，是这台浏览器把板块关掉了（`localStorage` 的
`opencode-go-quota:panels:v1`）。点齿轮 → 「全部显示」即可恢复；也可以在
DevTools 里删掉这个键。

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
        ark:                                          # 火山方舟套餐（见上一节）
          enabled: true
          region: cn-beijing
          planEdition: personal
          usageDays: 7
          usageLongDays: 30        # 长窗口，8–31（面板里同时显示两个窗口）
          refreshMs: 60000
          infoRefreshMs: 900000
          accessKeyEnv: ARK_ACCESS_KEY_ID
          secretKeyEnv: ARK_SECRET_ACCESS_KEY
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
| `index.js` | Host 半边：解析凭据、调上游、归一化，经同源路由提供给页面；含火山 Access Key 签名 |
| `client.js` | Client 半边：在 `sidebar.footer.action` 注册齿轮与各单元格；纯视图与容器分离，弹层外壳 `PopoverBox` / `CellShell` 共用，板块开关状态走模块级 `hiddenPanels` + `gated()` |
| `cordis.patch.yml` | 插入插件行并声明可调参数 |
| `icon.svg` / `locale/*.json` | 插件管理页的图标与标题、描述 |

- 所有路由都带 Host 的信任围栏（未认证请求 401），与系统自带的 `/open-in-app/*` 同一套机制；
- 上游返回形状都做了兼容：用量认 `{ usage: {...} }` 与 `{ windows: [...] }`，
  模型认 `{ data: [...] }` 与 `{ models: [...] }`，Release 正文按 `<h3 id="cn-…">` / `id="en-…"`
  锚点切成双语；火山的 AFP 窗口对 `-1` 时间戳（窗口未运行）按「无活动窗口」处理；
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
