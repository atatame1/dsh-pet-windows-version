# dsh-pet 独立桌面版（Standalone Edition）

把 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet) 桌宠从 DeepSeek Harness 插件改造成**能双击运行的 Windows 桌面程序**：不需要安装 DSH，也不再带对话功能。

> 代码许可 MIT，**素材禁止商用**，二创在公开渠道分发须署名原作者。

---

## 一、原作者与来源（请务必保留）

| 项目 | 内容 |
| --- | --- |
| 原作者 | **PC2005-cloud** |
| 上游仓库 | <https://github.com/PC2005-cloud/dsh-pet> |
| 上游版本 | v0.3.8 |
| 代码许可 | MIT（见 `LICENSE`，Copyright © 2026 PC2005-cloud） |
| 素材许可 | **禁止商用**；二次创作在公开渠道发布时须署名原作者并附上游链接 |
| 本分支 | 独立桌面版（删去对话、改为独立 Electron 应用、新增原生配置页等，见第五节） |

本目录里 `src/`、`runtime/`、`assets/` 的绝大部分内容，以及 `assets/` 下的 **106 个 webm 透明动画、表情包、字体、头像**，全部来自上游项目，版权归原作者 **PC2005-cloud** 所有。本分支只做「剥离 DSH 依赖 + 适配独立运行」的改造，不主张这些素材与主体代码的著作权。

如果要把这个版本再分发出去（网盘、GitHub、群文件都算公开渠道），请在说明里写明：

> 本项目基于 PC2005-cloud 的 dsh-pet（https://github.com/PC2005-cloud/dsh-pet）改造，桌宠形象与动画素材版权归原作者，禁止商用。

`README.upstream.md` 是上游原始 README，一并保留以便对照。

---

## 二、这个版本有什么

**保留**：一百余个透明动画、多只宠物同屏（多开）、拖拽 / 抛掷 / 弹弓物理、自主漫游与随机动作链、碎碎念、待办事项、余额气泡、系统托盘、人设（prompt）、显示位置与边距、多显示器适配、动画点播、配图。

**移除**：与宠物对话（含聊天窗口、附件拖入、会话记忆）。

**新增**（相对上游）：

- 右键菜单「打开 AI 设置」→ **「桌宠配置」**，指向本机自带的原生配置页（加宠物 / 改人设 / 调物理 / 全局开关），不再是只能手改文件的落地页；
- 本机服务**固定端口 45871**；
- 配置**保存后立即生效**，不用重启应用；
- 每只宠物可单独设**动作间隔**（`actionIntervalSec`）；
- 单击宠物不再弹出待办面板，待办只从右键菜单进。

---

## 三、从源码跑起来

**环境**：Windows 10/11 x64、Node.js ≥ 22.12、pnpm 12.x。
（`node_modules` 未随源码附带，需要自己装。）

```bash
pnpm install --frozen-lockfile

# 构建：tsdown → lib/、共享层 → runtime/electron-helper/shared-core.js、类型声明 → lib/types/
npm run build

# 首次运行前准备 Electron（解压到 %USERPROFILE%\.dsh\electron，国内走 npmmirror）
npm run ensure:electron

# 开发模式直接拉起（不打包）
npm run start:app
```

启动后桌面出现宠物，托盘出现图标；右键宠物即可看到菜单。

> **两个坑**
>
> 1. **不要带 `ELECTRON_RUN_AS_NODE=1` 启动**。某些 IDE / 终端会把它传进子进程，Electron 会退化成纯 Node 模式，`require('electron')` 直接失败、窗口一个都不出。`scripts/start-app.mjs` 会主动清掉它；手动双击 exe 时请确认环境里没有这个变量。
> 2. **本机 HTTP 服务只监听 `127.0.0.1:45871`**。端口被占用时会自动顺延（最多 10 个），日志里会写明实际端口。

---

## 四、打包成独立应用

```bash
node scripts/dist.mjs        # 输出 dist-app/win-unpacked/
```

- 打包**不下载 Electron**：默认复用 `%USERPROFILE%\.dsh\electron` 里已解压的那套（可用 `DSH_PET_ELECTRON_DIST` 指定）。找不到就明确报错，不会静默拉一百多兆。
- 只出「解包目录」一种形态（绿色版），没有安装包。

`win-unpacked/` 里真正需要分发的是下面这 13 个文件（其余可删）：

| 文件 | 说明 |
| --- | --- |
| `dsh-pet.exe` | 就是 `electron.exe` 改名 |
| `resources/app.asar` | 全部代码 + 动画素材 |
| `ffmpeg.dll`、`libEGL.dll`、`libGLESv2.dll`、`d3dcompiler_47.dll` | Electron 运行时依赖 |
| `resources.pak`、`chrome_100_percent.pak`、`chrome_200_percent.pak` | 资源包 |
| `icudtl.dat`、`snapshot_blob.bin`、`v8_context_snapshot.bin` | 运行时数据 |
| `locales/en-US.pak`、`locales/zh-CN.pak` | 语言包 |

> **Windows 智能应用控制（SAC）**：如果系统开着「智能应用控制」，放行是按**文件哈希**判定的。改代码只需替换 `resources/app.asar`；**不要随手替换 `dsh-pet.exe`**（重新打包会改写它的字节，SAC 会重新拦截）。

---

## 五、相对上游的改动清单

1. **删除对话功能**：移除 `src/shared/chat/`、`src/client/chat/`、`src/host/routes/chat.ts`、`src/host/plugin/command-chat.ts` 等 30 余个文件，以及菜单、设置页、命令面里全部对话入口；模型配置只保留给碎碎念与余额使用。
2. **独立应用外壳**：`src/app/main.ts` 以单进程方式拉起本机 HTTP 服务 + 桌面窗口，不再依赖 DSH 宿主注入。React 由宿主提供的浏览器半侧只保留插件形态可用，独立版页面全部用原生 DOM 重写（`src/standalone/`）。
3. **原生「桌宠配置」页**：`src/standalone/pet-config-page.ts`，三段（宠物卡片 / 全局开关 / 物理参数），可增删宠物、改名称与大小、选停靠角落与边距、写人设、切四个开关、调重力与弹性等；`/standalone-ai/` 仍是模型接口页，两页用页签互跳。
4. **固定端口**：`src/shared/constants.ts` 的 `APP_HTTP_PORT = 45871`；`src/app/router.ts` 的 `bindPreferredPort()` 从首选端口起试，仅在 `EADDRINUSE` 时顺延并写日志。选这个值是因为它避开知名端口，又低于 Windows 动态端口起点 49152。
5. **保存即生效**：配置写盘后走同进程热重载——`runtime/electron-helper/main/windows.js` 的 `reload()` 销毁全部宠物窗口并按最新 `DSH_PET_PETS` 重建，`main.js` 在 ready 后挂出 `__dshPetReloadInProcess`，`src/host/plugin/desktop/spawn.ts` 在应用模式分支里调用它（并刷新托盘）。
6. **每宠独立的动作间隔** `pets[].actionIntervalSec`（秒，0–3600，默认 0）：随机链两段自主动作之间空等的时间，等待期间播待机循环，带 ±25% 抖动；只影响随机链，点播 / 事件动画 / 碎碎念 / 拖拽不受影响。实现在 `runtime/electron-helper/sprite/playback.js` 的 `scheduleIdle()`。
7. **单击不再打开待办**：`runtime/electron-helper/sprite/input.js` 去掉单击开面板，只保留互动动画；待办入口留在右键菜单。
8. **顺手修的既有问题**：请求体超限回 413 时补 `connection: close`（否则 keep-alive 连接被复用会让客户端莫名重试）；应用模式下跳过 DPI 探测，避免子进程被单实例锁卡住等满 20 秒超时。

---

## 六、使用

- **右键宠物**：桌宠配置、待办事项、查看余额、碎碎念、配图、回到初始位置、显示位置、重载配置，以及按分类展开的动画点播树。
- **左键单击**：只播互动动画，不打开任何窗口。
- **拖拽**：拖到边缘松手会掉落，快速甩出是抛掷，双击按住可弹弓发射。
- **托盘图标**：列出全部宠物，末项「退出」。
- **配置页地址**：`http://127.0.0.1:45871/standalone-ai/pet-config#token=<每次启动都会变>`。令牌每次启动重新生成，所以从右键菜单进最省事，别把带 token 的地址存成书签。
- **日志**：`%USERPROFILE%\.dsh\dsh-pet\logs.txt`。

---

## 七、配置文件

路径：`%USERPROFILE%\.dsh\dsh-pet\main-config.jsonc`（JSONC，允许注释）。

宠物相关字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一标识，素材与端点都按它定位，不能重复 |
| `name` | 显示名，可重复 |
| `size` | 显示宽度（px），基准 462 |
| `display` | `web` / `desktop` / `both` / `none`；**必须是 `desktop` 或 `both` 才会开窗** |
| `position` | `{ corner, marginX, marginY }`，`corner` 取 `top-left` / `top-right` / `bottom-left` / `bottom-right` |
| `balanceEnabled` | 是否启用余额动画与气泡 |
| `whisperEnabled` | 是否自动碎碎念（会调用模型） |
| `workStatusEnabled` | 是否跟工作状态联动（只在 DSH 宿主里有数据，独立版基本用不到） |
| `fixedEnabled` | 固定：随机链不抽转向与移动 |
| `actionIntervalSec` | 动作间隔（秒），0 = 上一段播完立刻下一拍 |
| `whisperPrompt` | 这只宠物自己的人设正文（写了就替换条目级那份） |

示例：

```jsonc
{
  "pets": [
    {
      "id": "pet1",
      "name": "蓝胖子",
      "size": 462,
      "display": "desktop",
      "position": { "corner": "bottom-right", "marginX": 24, "marginY": 80 },
      "whisperEnabled": true,
      "actionIntervalSec": 6
    }
  ]
}
```

手改文件后需要「重载配置」（右键菜单）或重启应用；从「桌宠配置」页保存则立即生效。

---

## 八、目录结构

```
dsh-pet-source/
├── src/
│   ├── app/          独立应用主进程：本机服务、窗口、托盘、落地页
│   ├── host/         DSH 插件半侧：配置读写与合并、路由、模型调用、拉起桌面 Helper
│   ├── client/       浏览器半侧界面（React 由 DSH 宿主注入，独立版不走这条）
│   ├── standalone/   独立版专用原生页面与请求鉴权
│   └── shared/       两端共用：类型、常量、物理、动画链、菜单树
├── runtime/
│   └── electron-helper/   桌宠窗口运行时（原生 JS，直接进 asar，不经 bundle）
├── assets/           素材：webm 动画、字体、表情包、头像、默认配置
├── scripts/          构建 / 打包 / 启动脚本
├── electron-builder.yml
├── tsdown.config.mjs
└── package.json
```

---

## 九、常见问题

**双击没反应 / 刚启动就退出？**
先看 `%USERPROFILE%\.dsh\dsh-pet\logs.txt`。多数是环境里带了 `ELECTRON_RUN_AS_NODE=1`，或者 exe 被智能应用控制拦了。

**提示端口被占用？**
45871 被别的程序占了会顺延，日志里写着实际端口。想要固定不变就腾出这个端口。

**碎碎念不吭声、余额不显示？**
需要先在「桌宠配置 → 模型接口」里填 OpenAI 兼容的接口地址、密钥与模型名，点「测试」通过即可。

**改了配置没反应？**
从配置页保存是立即生效的；手改 `main-config.jsonc` 后要点一次右键菜单里的「重载配置」。

---

## 十、许可

代码 MIT，保留原始版权声明（`LICENSE`，Copyright © 2026 PC2005-cloud）。
**素材（`assets/` 下的动画、表情包、字体、头像）禁止商用**；公开渠道的二次创作必须署名原作者并附上游仓库链接。
