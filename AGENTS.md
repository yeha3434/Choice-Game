# 选什么 · 项目规则

开始工作前先读：

- `docs/decisions-entangled-sports.md`
- `docs/plan-entangled-sports.md`

只实现用户已经确认的当前阶段，不顺手加入后续功能。

交差前运行与本阶段相关的类型检查、测试和真实浏览器验证。可见界面需要提供截图，并确认浏览器控制台没有错误。

用户确认之前不执行 `git commit`。

## 规则与自动检查

| 规则 | 由什么拦住 |
|---|---|
| TypeScript 必须通过严格检查 | `npm run build` |
| 页面必须能在真实浏览器打开且控制台无错误 | `npm run test:e2e` + 截图 |
| 测试与构建产物不进入 Git | `.gitignore` + `git status` |
| 每阶段先验证、用户确认后再提交 | 阶段交差清单 + 用户确认 |
