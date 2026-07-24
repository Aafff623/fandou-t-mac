# README Diagram Brief · LUT-SA（Phase B 契约层）

Status: active · 2026-07-24  
Scope: 根 `README.md` 章节地图 + 资产清单 + 引用规约。  
不替代上游 T-MAC 演示图（仍保留在 `assets/*.png`，作为 README 后段折叠块引用）。

## 章节地图

| 章节 | 配图节点 | 引用规约 | 来源 |
|---|---|---|---|
| 顶部 brand 段 | 无 | 不需要 | 自行组装 |
| 1 · 海报（hero） | `assets/poster/poster-phase1.png` | `<img width="85%">` | `assets/poster/README.md` |
| 2 · 一句话创意 | 无 | 不需要 | `docs/output/report/phase1-one-liner.md` |
| 3 · 系统架构 | `assets/images/readme/architecture-phase1.png` | `<img width="85%">` | `assets/images/readme/architecture-phase1.md` |
| 4 · 调用时序 | `assets/images/readme/sequence-phase1.png` | `<img width="85%">` | `assets/images/readme/sequence-phase1.md` |
| 5 · 公开性能基线 | 无（表） | 不需要 | `docs/output/report/phase1-test-report.md` §4 |
| 6 · 移植到 OpenHarmony 路线 | 无（表） | 不需要 | `docs/output/report/phase1-test-report.md` §6 |
| 7 · 作品介绍（≤800 字） | 含图引用，引用规约同上 | 不需要 | `docs/output/report/phase1-work-intro.md` |
| 8 · 测试报告雏形 | 引用规约同上 | 不需要 | `docs/output/report/phase1-test-report.md` |
| 9 · 团队 | 无（表） | 不需要 | `docs/knowledge/team.md` |
| 10 · 仓库内指针 | 无 | 不需要 | 自组 |
| 折叠段 · 上游 T-MAC 原文 | 沿用原 `<img>` 标签（不动） | 不需要 | `README.md` 历史正文 |

> 章节顺序针对初赛评审：先 1 句话 → 设计稿 → 数据 → 落地路径 → 介绍/报告 → 团队。

## 资产清单

| 文件 | 用途 | 状态 |
|---|---|---|
| `assets/poster/poster-phase1.png` | hero 海报 | 已落盘 |
| `assets/images/readme/architecture-phase1.drawio` | 架构图源（draw.io XML） | 已落盘 |
| `assets/images/readme/architecture-phase1.png` | 架构图（导出） | 已落盘 |
| `assets/images/readme/architecture-phase1.md` | 架构图设计说明 | 已落盘 |
| `assets/images/readme/sequence-phase1.drawio` | 时序图源 | 已落盘 |
| `assets/images/readme/sequence-phase1.png` | 时序图（导出） | 已落盘 |
| `assets/images/readme/sequence-phase1.md` | 时序图设计说明 | 已落盘 |

不做的标准件（理由：本项目面向初赛 + 落盘 ≤ 800 字介绍，海报 + 架构 + 时序已覆盖主要评审点）：

- `banner.png`：直接用海报充当 hero banner
- `tech-stack.png`：文字表已能说清 L4 层栈
- `workflow.png`：时序图已承担
- `structure.png`：用 Markdown 树替代
- `features.png`：卡片式三栏写进 README 即可
- `preview-shell.png` / `showcase-*.png`：复赛可视演示阶段再补

## 引用规约

- 竞赛章节一律 `<img src="..." width="85%" alt="..." />`（HTML 标签，不用 Markdown `![]()`）
- 上游折叠段沿用 README 原 HTML `<img>` 标签，**不要重排**
- 相对路径相对仓库根，例如 `assets/images/readme/architecture-phase1.png`
- 路径统一用反斜杠（Windows）；README 是 Markdown，浏览器渲染时浏览器会自己处理
- alt 文本至少包含图的中文名 + 一句用途

## 出图与导出

| 类型 | 工具 | 备注 |
|---|---|---|
| 海报 | GPT-2-image（按 `assets/poster/README.md` 中 prompt 重导） | 关键数字务必替换为本仓数据 |
| 架构图 / 时序图 | draw.io Desktop 或 https://app.diagrams.net | 打开 `.drawio` → File → Export as → PNG，2× 分辨率 |

## 验收

- [ ] `readme-diagram-brief.md` 填实（本文件）
- [ ] README 海报 / 架构图 / 时序图 / 测试报告 / 团队 等竞赛章节均引用本仓 PNG
- [ ] 竞赛章节 `<img width="85%">`，上游折叠段保留原 HTML `<img>`
- [ ] `preview-readme.html` + `.css` + `.js` + `port-registry.md` 落盘
- [ ] 没有把第三方标杆图原样塞进 README
