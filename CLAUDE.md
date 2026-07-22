# CLAUDE

> **Output Style**: `humanizer-output-style` skill — 统一语气与去 AI 味。详见 `skills/humanizer-output-style/SKILL.md`
>
> **Windows Rules**: 项目级 Cursor rules（`alwaysApply`）—
> `.cursor/rules/windows-path-discipline.mdc`、
> `.cursor/rules/windows-shell-discipline.mdc`
> （从用户级 `%USERPROFILE%\.cursor\rules\` 同步；路径操作与 Shell 必须遵守）。
>
> **Answer Format**: `.cursor/rules/answer-format.mdc`（`alwaysApply`）—
> 先简述再详细回答；表格 / Mermaid 信息密度优先；与 `humanizer-output-style` 叠加。

与 `AGENTS.md` 同源入口。本文件给 Claude Code / 同类 Agent 快速对齐。

## 必读顺序

1. `CONTEXT.md` — 领域词汇与边界
2. `docs/agents/domain.md` — 文档消费规则
3. `docs/knowledge/competition-brief.md` — 赛题与截止
4. `docs/knowledge/solution-blueprint.md` — 主方案
5. `docs/knowledge/inspiration-sources.md` — Repos + Blogs 灵感总册（规划优先）
6. `docs/knowledge/reference-repos.md` — 二开主仓 + 借鉴仓明细
7. 相关 `docs/adr/*` — 已拍板决策

## Agent skills

### Issue tracker

GitHub Issues + `gh`。见 `docs/agents/issue-tracker.md`。

### Triage labels

五类 canonical GitHub labels。见 `docs/agents/triage-labels.md`。

### Domain docs

Single-context。见 `docs/agents/domain.md`。

## 硬约束

- 初赛截止：**2026-07-26 24:00**（创意/设计/≤800 字介绍 + 测试报告雏形）
- 不做完整内核改写；优先 **用户态 SystemAbility + Native LUT 库**
- PRD 未批准不写功能代码；**handoff 停用**；Review 先于 commit
- Windows 路径用反斜杠；Shell 重定向用 `nul`
