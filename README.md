# dsh-theme-cyberpunk2077 — NIGHT CITY EDITION

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/dsh-theme-cyberpunk2077?color=FCE300&label=npm&logo=npm&logoColor=black)](https://www.npmjs.com/package/dsh-theme-cyberpunk2077)
[![⭐ DSH 插件市场](https://img.shields.io/static/v1?label=%E2%AD%90%20DSH&message=%E6%8F%92%E4%BB%B6%E5%B8%82%E5%9C%BA&color=7C3AED&style=flat-square)](https://dshfind.com/zh/plugins/Tommy00748/dsh-theme-cyberpunk2077)

> 欢迎来到夜之城。你的 DeepSeek Harness 已经被改装过了。

> ⚠️ **要求 DSH 0.2.0-rc.1+**（peer `@deepseek-ai/dsh-client-ui-theme: ^0.2.0-rc.1`）。0.1.x 宿主上本插件会被 DSH 的兼容门**整包跳过**，界面不会有任何变化。

Cyberpunk 2077（夜之城）风格的 DSH Web UI 主题。纯浏览器客户端插件，零音频资源——所有声音都是 Web Audio 实时合成，不下载一个字节的音频文件。

![NIGHT CITY — screenshot](assets/screenshot.png)

## ✨ 这是什么

一个把 DSH Web 界面整个搬进 2077 年的主题：夜之城黄 × 霓虹青的配色、CRT 扫描线、Kiroshi 义眼式悬停锁定、战斗状态的 HUD、合成音效……以及两个只有夜之城老司机才知道的彩蛋。

所有的效果都可以关——动画、音效、干扰，一个按钮的事。它在小屏幕上和「减弱动态效果」系统设置下也会自动收敛，不会烦你。

## ⚡ 快速上手

```bash
dsh plugin --profile web add dsh-theme-cyberpunk2077
```

0.2.0 的 `dsh plugin` 会把包写进 profile 的 `dsh.profile.bundles`，并自动套用插件自带的 `cordis.patch.yml`（行 id `ui-theme-cyberpunk`）——**不用再手改 profile 补丁**。重启 `dsh web`，NIGHT CITY 开机转场之后，欢迎来到 2077。

> 🧰 **手动兜底**（仅在插件管理器 / CLI 不可用时）：把 `dsh-theme-cyberpunk2077` 加进 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles`，或在 `~/.dsh/profiles/web/cordis.patch.yml` 里插入同一行：
>
> ```yaml
> - insert:
>     - id: ui-theme-cyberpunk
>       name: 'dsh-theme-cyberpunk2077'
> ```

> 💡 **装不上 / 主题不生效？** 先确认插件是 **≥ 0.2.0**（`npm view dsh-theme-cyberpunk2077 version`）且宿主是 **0.2.0-rc.1+**。本插件声明了 peer，不满足时 DSH 会把整个 bundle 跳过，启动日志里出现 `dsh: skipping profile bundle "dsh-theme-cyberpunk2077"`。0.1.3 及更早版本则是漏打 `cordis.patch.yml`，装完直接启动失败。

> 想微调？右下角 `DECK` 按钮打开控制面板，每个特效独立开关；`SND` 一键静音全部。主题会**硬锁夜之城暗色调色板**：设置页 Appearance 里点 Light / Dark 不会改变外观（这是主题的预期行为），想回官方配色就禁用插件行。

## 🌆 视觉：夜之城的皮

- **配色**：NC 黄 `#FCE300` / 霓虹青 `#00F0FF` / 玫红 / 近黑夜蓝底——夜之城广告牌的味道
- **切角按钮**（45° chamfer），主按钮霓虹脉冲呼吸，像一块通电的电路板
- **CRT 层**：扫描线 + 城市网格 + 双色霓虹雾，复古显示器既视感（可关）
- **Logo 故障动画**：红青 RGB 色散，每 5.5 秒裂一次
- **开机转场**：CRT 开机线 → glitch 条纹 → NIGHT CITY 标题 → 白闪（可关）。每个标签页只播第一次，刷新/断线重连不重播
- **会话 = 数据碎片**：每条会话按稀有度上色（白/绿/青/紫/橙循环），激活的会话是传奇级橙黄光
- **Kiroshi 光学锁定**：悬停会话行，青色扫描线扫过 + 四角瞄准括号——像义眼在锁定目标
- **警示纹**：错误通知顶部红黑 45° 斜纹、面板标题青色斜纹，危险区一眼可辨
- **夜之城时钟 + 数据流**：左下角 `0x93E2E4 23:47 NC-TIME` 一行 HUD 读出，侧栏收起自动隐藏
- **任务追踪器**：目标栏变成 ◈ OBJECTIVE，统计条变成 HUD 读出（⟨ ⟩）
- **通知改版**：切角 + 黄边 + 滑入发光，错误红边——像来了一条 gig 提醒
- **空状态文案**：— NIGHT CITY LOCAL // 2077 —
- **字体**：MiSans（小米，jsDelivr 按 unicode-range 分片加载）+ 本地等宽栈（代码）

## 🎧 声音：合成出来的赛博氛围

- **打字机音效**：每个键一声合成机械声（噪声瞬态 + 降频体），空格/回车更低沉（可关）
- **消息音效闭环**：发送（上行双音）/ 完成（双短音）/ 错误（故障蜂鸣）/ 通知（高频双音）（可关）
- **生成中 = 战斗状态**：`PROCESSING_` 下方出现体力条式脉冲进度；每 6 秒轮换一条夜之城风格加载提示；标签页标题变成 `▶ NC-JOB //`
- **俚语状态条**：发送 `GIG UP // 单子已发` / 完成 `PREEM. // 任务完成`（绿）/ 错误 `FLATLINE // 连接中断`（红）
- **EXECUTE ⏎ 悬停提示**，主发送键悬停时红青 RGB 分离故障
- **标签页接管**：favicon 变成黄色切角方块，标题 `DSH // NC-TERMINAL`（偶尔错字闪烁）

## 🥚 彩蛋：夜之城的秘密

- 在输入框输入 `relic` 并发送 → **「WAKE UP, SAMURAI. WE HAVE A CITY TO BURN.」** 全屏故障时刻
- 在输入框输入 `johnny` 并发送 → 强尼·银手夺屏 2.6 秒：全屏去饱和 + 红青色散 + 画面撕裂 + 随机台词（中英双语）+ 低频嗡鸣

![RELIC — WAKE UP, SAMURAI](assets/relic-easter-egg.png)

（系统开启「减弱动态效果」时，彩蛋会自动收敛，不吓你一跳。）

## 🛡️ 性能护栏

- 小屏（≤768px）：自动关闭扫描线、数据流和重动画
- `prefers-reduced-motion`：停掉全部循环动画
- 所有特效都能在 `DECK` 面板独立关闭，偏好存 localStorage

## 📁 项目结构

```
package.json     # dsh.bundle + dsh.client manifest（platform: web, immediately: true）
cordis.patch.yml # 一键安装的补丁层
lib/index.js     # 宿主端（空壳，让插件行挂载）
lib/client.js    # 浏览器 bundle：主题 + 全部子系统
scripts/         # audit-tokens.mjs：对照 DSH 源码校验 token 覆盖
test/            # apply.smoke.mjs：jsdom 冒烟测试（node --test）
assets/          # README 截图
```

## 🧹 想卸载？

```bash
dsh plugin --profile web remove dsh-theme-cyberpunk2077
```

0.2.0 的插件管理器会把依赖和 `dsh.profile.bundles` 里的条目一起清掉；主题行来自插件自带的 `cordis.patch.yml`，随包一起消失——重启 `dsh web` 即可。夜之城随时欢迎你回来。

> 如果你是按上文「手动兜底」插进 profile `cordis.patch.yml` 的，需要自己把 `ui-theme-cyberpunk` 那行删掉。

## 🧪 开发者自检

主题是纯 token 覆盖层：DSH 每次改版都可能新增/改名 `--dsw-*`，所以仓库里有两个零依赖守卫：

```bash
node scripts/audit-tokens.mjs        # token 覆盖：死覆盖 / 漏光（默认对照 ../deepseek-harness/packages/client）
node --test                          # jsdom 冒烟：注册契约 + 注入样式 + HMR 幂等
```

`audit-tokens.mjs` 支持 `--dsh-source <path>` / `DSH_SOURCE` 指向别的 DSH checkout；冒烟测试默认从 `../deepseek-harness/node_modules` 取 jsdom，可用 `DSH_DEPS_DIR` 覆盖。

## 🧾 更新日志

### 0.2.0 — 对齐 DSH 0.2.0-rc.2

- **token 层**：补齐 29 个 `--dsw-alias-*`（文件 diff、文档预览、思考/微光、turn trigger、onboarding、设置卡、菜单图标、switch、toast 等），新增 `--dsw-menu-surface-fill`（`MenuSurface` 直读，此前菜单漏官方灰）、`--dsw-focus-ring-color`、`--dsw-elevation-stroke-color`、4 个 diff alpha 静态色与 2 个中性色。alias/specific 覆盖 **118/118**，0 死覆盖。
- **字体**：`--dsw-font-family` / `--dsw-font-family-brand` 改到 `:root`（上游在 `:root` 求值品牌字体，原先设在 `body` 到不了）。
- **选择器**：修掉 0.2.0 已不存在的 `railFish`、`detailsCol` 两个钩子；右栏 HUD 角标改锚 `data-sidebar-right-open` 稳定属性。
- **注册**：`ctx.theme.register` 幂等化并回收其 disposer，客户端 HMR 重载不再报 `already registered`。
- **清单**：声明 peer `@deepseek-ai/dsh-client-ui-theme ^0.2.0-rc.1`；`dsh.client.immediately: true` 提前预取，减少首屏默认主题闪烁。
- **工具**：新增 `scripts/audit-tokens.mjs`、`test/apply.smoke.mjs`。

## 📜 许可证

MIT — 拿去改装，Night City 不搞版权审查。
