# 选什么 · 项目规则

开始工作前先读：

- `docs/decisions-entangled-sports.md`
- `docs/plan-entangled-sports.md`

按照用户最新指示连续完成剩余阶段；每个有意义的改动都需要适当验证。

交差前运行与本阶段相关的类型检查、测试和真实浏览器验证。可见界面需要提供截图，并确认浏览器控制台没有错误。

用户已授权在合适的节点自行提交 Git，无需逐阶段等待确认。

## 规则与自动检查

| 规则 | 由什么拦住 |
|---|---|
| TypeScript 必须通过严格检查 | `npm run build` |
| 页面必须能在真实浏览器打开且控制台无错误 | `npm run test:e2e` + 截图 |
| 测试与构建产物不进入 Git | `.gitignore` + `git status` |
| 每个改动验证后提交 | 阶段检查 + Git 提交记录 |
