# 调研报告摘要

Date: 2026-07-22  
Status: draft（从临时对话归类，待用户 Review）

## 结论

锁定 **T-MAC LUT → SystemAbility 封装 → 轻量感知调度** 作为方向四主方案；初赛冲文档与设计，复赛冲可演示系统。

## 依据文档

| 文档 | 内容 |
|------|------|
| [competition-brief.md](../../knowledge/competition-brief.md) | 赛题、赛程、提交、评分 |
| [tmac-fit.md](../../knowledge/tmac-fit.md) | 论文契合度 |
| [solution-blueprint.md](../../knowledge/solution-blueprint.md) | 技术栈与分阶段 |
| [reference-repos.md](../../knowledge/reference-repos.md) | 主仓 + 借鉴仓 |
| [asset-map.md](../../knowledge/asset-map.md) | 资产路径职责 |
| ADR-0001 | 路径决策已 Accepted |

## 备选方向（未采纳为 P0）

| 方向 | 为何降优先级 |
|------|----------------|
| 多设备记忆/语义一致性为主 | 初赛难出硬核数据；作复赛扩展 |
| 多传感器行为挖掘为主 | 弱化 kernel 则创新性依赖数据挖掘叙事，团队更偏系统/AI agent |

## 下一步

1. 用户 Review Phase A Gate
2. 初赛材料：见同目录 `prelim-submission-outline.md`
3. 跟踪用 **GitHub Issues**；批准后写 `docs/output/prd/prd.md`（当前不启用 handoff）
