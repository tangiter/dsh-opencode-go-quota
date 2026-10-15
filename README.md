# OpenCode Go 用量 · `@local/opencode-go-quota`

在 DSH Web 界面**侧边栏底部**（Settings 旁边）显示 OpenCode Go 套餐的三个计量窗口：

- **时段（5 小时）** / **本周** / **本月** — 各自的占用百分比、剩余比例、重置倒计时
- 收起成 56px 窄栏时显示三根迷你竖条，悬停弹出明细
- 低于 70% 用品牌色，70–89% 警告色，≥90% 或上游报异常状态用错误色

数据来自 `GET <baseUrl>/usage`（默认 `https://opencode.ai/zen/go/v1`），由 Host 半边用
`ctx.credentials` 解析出的 API Key 直接调用；**Key 不会出现在任何发往浏览器的响应里**。

---

## 安装

### 1. 把这个目录放到一个长期不变的位置

安装用的是 pnpm 的 `link:`（目录软链），**装好之后不能移动或删除这个目录**，否则插件会失效。
建议放在工作区里，例如：

| 平台 | 建议位置 |
| --- | --- |
| Windows | `<你的工作区>\opencode-go-quota` |
| macOS / Linux | `~/dsh-workspace/opencode-go-quota` |

### 2. 在本机 DSH 的「创造模式」会话里说一句

> 我有个 DSH 插件包在 `<这个目录的绝对路径>`，请用 plugin_manager 的 `install_bundle`
> 把它装到当前 profile。

或者直接由 agent 调用：

```
plugin_manager
  action: install_bundle
  target: <这个目录的绝对路径>
```

安装结果要看 `application` 字段：`applied` 才算生效。**不需要重启**，装完即可在侧边栏看到。

### 3. 配置 API Key（必做）

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

### 4. 验证

- 侧边栏底部 Settings 旁边出现三根小竖条；
- 悬停弹出明细，三行数字应与 [console](https://opencode.ai/console) 里看到的一致；
- 若弹层显示红色报错文字，对照文案排查：
  - 「没有为 OPENCODE_GO_API_KEY 配置凭据」→ 第 3 步没做或变量名不符；
  - 「Go API Key 被拒绝」→ Key 失效或写错；
  - 「无法连接用量接口」→ 网络到不了 `opencode.ai`。

### 5. 如果装是装上了，但侧边栏什么都没有

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
`available: true` 但 occupants 里没有 `opencode-go-quota`，则多半是浏览器缓存了旧的
bundle，刷新一次页面即可。

---

## 可调参数

改 `cordis.patch.yml` 里那一行的 `config`（改完刷新页面即可，Host 侧会热重载配置）：

```yaml
- insert:
    - id: opencode-go-quota
      name: '@local/opencode-go-quota'
      config:
        baseUrl: https://opencode.ai/zen/go/v1   # 换端点；`/usage` 会自动追加
        apiKeyEnv: OPENCODE_GO_API_KEY           # 换凭据引用名
        refreshMs: 60000                         # Host 缓存时长，之后才会重新打上游
        timeoutMs: 15000                         # 单次上游请求超时
```

页面侧固定每 60 秒轮询一次，且**页面不可见时不轮询**；所以没有页面开着时完全不产生流量。
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
| `index.js` | Host 半边：解析 Key → 调 `/usage` → 归一化 → 经同源路由 `/opencode-go-quota/usage` 提供给页面 |
| `client.js` | Client 半边：在 `sidebar.footer.action` 注册单元格与弹层；纯视图 `QuotaView` 与轮询容器 `makeCell` 分离 |
| `cordis.patch.yml` | 插入插件行并声明可调参数 |
| `icon.svg` / `locale/*.json` | 插件管理页的图标与标题、描述 |

- 路由带 Host 的信任围栏（未认证请求 401），与系统自带的 `/open-in-app/*` 同一套机制；
- 上游返回两种形状都兼容：`{ usage: { rolling, weekly, monthly } }` 与 `{ windows: [...] }`；
- 上游改版导致无法识别时**显示报错而不是伪造 0%**，避免误判额度。

**注意**：`/usage` 这个端点官方文档没有记载，属于未文档化接口，上游可能随时变更路径或返回结构。
真被改了，弹层会给出提示，改 `index.js` 里的 `extractWindows` 即可适配。
