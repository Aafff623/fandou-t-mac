# Phase 1 清单 · 翻斗花园

截止：2026-07-26 24:00 · Issue：https://github.com/Aafff623/fandou-t-mac/issues/1

## 必交付（茶思屋 5 项）

| # | 材料 | 文件 | 状态 |
|---|------|------|------|
| 0 | 报名组队（已在官网） | `docs/knowledge/team.md` | ✅ Done（截图确认 2026-07-23） |
| 1 | 一句话创意 | `phase1-one-liner.md` | ✅ Draft · 待小队确认字眼 |
| 2 | 设计稿（架构 + 时序） | `assets/images/readme/architecture-phase1.{drawio,png,md}`<br>`assets/images/readme/sequence-phase1.{drawio,png,md}`<br>`phase1-design.md` | ✅ Done · PNG 已导出 |
| 3 | 作品介绍 ≤800 字 | `phase1-work-intro.md`（约 623 字，顶部已挂图） | ✅ Draft · 待小队最后审 |
| 4 | 测试报告雏形（方向四附加） | `phase1-test-report.md` | ✅ Draft · 公开数据 + 移植计划 |

## 提交平台映射（茶思屋字段 → 本仓文件）

| 茶思屋字段 | 用本仓什么 |
|------------|------------|
| 创意描述 | `phase1-one-liner.md` 里的「主推荐（短）」 |
| 设计稿 | `architecture-phase1.png` + `sequence-phase1.png` |
| 作品介绍 | `phase1-work-intro.md` 正文（约 623 字） |
| 测试报告 | `phase1-test-report.md`（初赛可只交公开数据 + 移植计划两节） |
| 模型名称 | `team.md` 里的「LUT-SA」 |

## 仓库配套文档（不直接交，但用于支撑与复盘）

| 类别 | 文件 | 用途 |
|------|------|------|
| 赛题与决策 | `docs/knowledge/competition-brief.md` | 赛题、赛程、评分、提交口径 |
| | `docs/knowledge/solution-blueprint.md` | 技术栈与分阶段 |
| | `docs/knowledge/reference-repos.md` | 主仓 + 借鉴仓清单 |
| | `docs/knowledge/asset-map.md` | 路径职责 |
| | `docs/knowledge/team.md` | 队伍信息 |
| 决策记录 | `docs/adr/0001-lut-systemability-path.md` | 主路径决策（Accepted） |
| 调研 | `docs/output/report/strategy-summary.md` | 调研摘要 + 备选 |
| | `docs/output/report/prelim-submission-outline.md` | 初赛写作骨架 |
| 历史 | `phase1-design-draft.md` | 旧 Mermaid 稿（已被新版替代，保留作对照） |
| 上游 | `assets/*.png`、`assets/demo.gif` | T-MAC 上游 README 配图，保留不挪 |

## 提交前动作

1. 三人快速过文案，把 Draft 三份（创意句 / 作品介绍 / 测试报告）改到能上茶思屋的版本
2. 茶思屋占坑提交（一版就够，截止前最多更新 10 次）
3. 同步状态到 GitHub Issue #1

## 不在初赛交付里（复赛再说）

- `ohos/`（鸿蒙封装代码）、DevEco Native 模块、SystemAbility 注册
- 演示视频 ≤5 min、PPT、答辩逐字稿 → `assets/video/` 与 `assets/theme/ppt/`
- 实测 TTFT / 能耗
- GitHub PR / 分支