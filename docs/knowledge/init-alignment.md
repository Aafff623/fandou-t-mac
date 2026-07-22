# Phase A 对齐记录

Date: 2026-07-22（修订同日：GitHub Issues / 取消 theme 名 / handoff 停用）

| # | 确认项 | 采用 |
|---|--------|------|
| 1 | Issue tracker | **GitHub Issues**（`gh`） |
| 2 | Triage 标签 | 五类 canonical 同名（GitHub labels） |
| 3 | CONTEXT | 单上下文（无 CONTEXT-MAP） |
| 4 | 外部资产 | 对话稿 → `docs/knowledge/*` + `docs/output/report/`；原文 → `assets/backup/` |
| 5 | 产品层根 | 仓库根 = T-MAC；鸿蒙封装规划 `ohos/` |
| 6 | 业务 theme 名 | **不使用**；output 扁平（`report/` `prd/`） |
| 7 | 项目预期 | 方向四竞赛作品：系统级 LUT 加速服务 + 可演示 + 测试报告 |
| 8 | Handoff | **停用** |
| 9 | 语气 + 回答格式 | `docs/agents/voice.md` → `answer-format.mdc` |
| 10 | Cursor MDC | `.cursor/rules/` 三份已同步 |

## 迁移清单

| 源 | 目标 | 状态 |
|----|------|------|
| chat_with_grok-temp.md | docs/knowledge/* + assets/backup/ | Done |
| 曾用 `os-ai-accel/` 子目录 | 扁平到 `docs/output/report|prd/` | Done |
| 本地 `.scratch/` | 废弃，改 GitHub Issues | Done |
| `docs/output/handoff/` | 停用移除 | Done |
