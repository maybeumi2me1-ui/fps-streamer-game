# FPS 主播模拟器

Vue 3 + TypeScript + Vite 构建的单机 H5 经营游戏。无需账号、后端或 API 密钥。

## 浏览器预览

需要 Node.js 20.19+ 或 22.12+（当前验证版本：24.19.0）。

```sh
npm ci
npm run dev
```

在运行该命令的电脑浏览器打开终端显示的地址（默认端口 5173）。云开发工具中请使用端口转发或 Ports 面板打开 5173；手机需与开发机处于可互访网络，访问开发机 IP 的 5173 端口。

```sh
npm run build
npm run preview
```

生产预览默认端口 4173。`dist/` 可部署到任意静态网站服务，Vite 已配置相对资源路径，支持子目录部署。

## 玩法

- 共 7 天，每天一场直播、3 个事件回合。先点击场景中的靶心（每回合最多 6 次），再选择应对事件的方式。
- 练枪每天一次：枪法 +8，体力 -20。枪法和较高体力提升对局表现。
- 剪视频每天一次：粉丝 +25，体力 -15；休息每天一次：体力 +20（上限 100）。
- 升级设备消耗金币，最多三级升级，提升后续直播收入与曝光。
- 下播根据击杀、互动表现和少量随机浮动获得粉丝、收入和段位积分。可花费 ¥80 推广切片，增加本场粉丝收益的 50%，每场一次。
- 下一天恢复体力；第 7 天结束后显示生涯总结。数据中心记录每天的直播结果。
- 操作后自动保存至当前浏览器 localStorage。直播中刷新会回到当日开播前，不保留未结算对局。重新开始需确认并覆盖存档。

## 范围

画面为原创 CSS 风格化射击训练场，提供点击靶心互动与文字决策；不包含《无畏契约》素材、实际 3D FPS、多人对战或真实直播服务。参考概念图的主界面、直播和结算布局。切片推广使用游戏内金币，不接入真实广告和支付。

## 验证

- `npm run build`：TypeScript 检查与生产构建。
- 已通过 Chromium 自动化跑通 7 天、21 个事件、126 次靶心命中、推广防重复、存档恢复、成长记录、重新开始、损坏存档恢复与 390px 手机宽度检查。

## GitHub Pages 自动部署

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会安装锁定依赖、执行 TypeScript 检查、构建并部署 `dist/`。

首次启用：打开 GitHub 仓库 → **Settings** → 左侧 **Pages** → **Build and deployment** → **Source** 选择 **GitHub Actions**。

之后打开 **Actions** → **Deploy game to GitHub Pages** 查看进度。如首次流程在开启 Pages 前失败，点击失败的运行 → **Re-run all jobs**。也可以在此工作流页面点击 **Run workflow**，选择 `main` 并运行。

游戏地址：https://maybeumi2me1-ui.github.io/fps-streamer-game/

Pages 构建使用 `npm run build -- --mode github-pages`，自动设置 `/fps-streamer-game/` 资源前缀；本地开发不受影响。首次发布需要等待 Actions 的 build 和 deploy 都成功。GitHub Pages 的浏览器存档独立于本地开发地址。
