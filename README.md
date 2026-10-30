# 选什么

一个把纠结选项变成搞怪赛跑选手的网页小游戏。

输入 2～4 个不同选项，抽取角色并观看赛跑；冠军即为随机结果。赛后可确认、重赛或修改选项。每个选项胜率相同。

## 本地运行

```bash
npm install
npm run dev
```

终端显示本地地址后，用浏览器打开即可。输入选项、点击“抽取角色”，可手动换人，再点击“开始比赛”。音乐和音效可以分别关闭，设置会保存在当前浏览器；选项和结果刷新后不会保留。

比赛约 18 秒，另有 3 秒倒计时。关闭终端窗口或按 `Ctrl+C` 停止本地服务。网页只在本机运行，尚未公开部署。

## 验证命令

```bash
npm run build
npm test
npm run test:e2e
npm run check
```

端到端测试默认使用本机已安装的 Microsoft Edge，不会额外下载浏览器内核。

## GitHub Pages 发布

将仓库推送到 GitHub，打开仓库 Settings → Pages，在 Build and deployment 中将 Source 设为 GitHub Actions。推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并发布 `dist`。使用相对资源路径，可部署在 GitHub Pages 项目子路径下。

## 项目资料

- 需求与决定：`docs/decisions-entangled-sports.md`
- 分阶段计划：`docs/plan-entangled-sports.md`
