# AGENTS

> **Output Style**: `humanizer-output-style` skill — 统一语气与去 AI 味。详见 `skills/humanizer-output-style/SKILL.md`
>
> **Windows Rules**: 项目级 Cursor rules（`alwaysApply`）—
> `.cursor/rules/windows-path-discipline.mdc`、
> `.cursor/rules/windows-shell-discipline.mdc`
> （从用户级 `%USERPROFILE%\.cursor\rules\` 同步；路径操作与 Shell 必须遵守）。
>
> **Answer Format**: `.cursor/rules/answer-format.mdc`（`alwaysApply`）—
> 先简述再详细回答；表格 / Mermaid 信息密度优先；与 `humanizer-output-style` 叠加。

## 项目一句话

基于 **microsoft/T-MAC** 二开：把 LUT 低比特 LLM 加速内核封装为鸿蒙/OpenHarmony 系统级 AI 加速服务，参赛「鸿蒙高校创新赛 · 方向四 · 操作系统智能创新」。

## 产品根与边界

| 区域 | 路径 | 说明 |
|------|------|------|
| 计算核心（上游 T-MAC） | 仓库根：`python/` `deploy/` `include/` `t-man/` | 勿无故大改上游结构 |
| 竞赛与 Agent 资产 | `docs/` `assets/{backup,images,video,theme}/` | 本仓新增规范层 |
| 上游演示图（保留） | `assets/*.png` `assets/demo.gif` | README 仍引用此处，勿挪 |
| 鸿蒙封装（规划） | `ohos/`（尚未创建） | SystemAbility + NDK 落地时再建 |
| 任务跟踪 | GitHub Issues | `Aafff623/fandou-t-mac` |

## Agent skills

### Issue tracker

本仓使用 **GitHub Issues**（`gh` CLI）。详见 `docs/agents.md` · Issue tracker。

### Triage labels

使用五类 canonical GitHub label（默认同名）。详见 `docs/agents.md` · Triage labels。

### Domain docs

Single-context：根目录 `CONTEXT.md` + `docs/adr/`。详见 `docs/agents.md` · 文档消费规则。

## 工作流指针

| 文档 | 用途 |
|------|------|
| `docs/agents.md` | 工作流、交付、issue/triage、归档、语气、文档消费、术语 |
| `docs/knowledge.md` | 赛题、方案、参考仓 + Blog 灵感、队伍、资产、对齐 |

## Gate

Phase A 初始化完成前：不写业务功能代码（T-MAC 上游代码只读分析除外）。  
用户 Review init 产物后，再开功能实施（**handoff 停用**；用 GitHub Issue 跟踪）。
