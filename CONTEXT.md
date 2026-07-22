# CONTEXT

## Domain

本仓库是 **T-MAC（EuroSys 2025）** 的竞赛向 fork，目标是把「比特级查找表（LUT）驱动的低比特 LLM 推理」做成可在 **OpenHarmony / HarmonyOS** 上演示的**系统级 AI 加速服务**，参赛鸿蒙高校创新赛方向四「操作系统智能创新」。

## Glossary（核心词）

| 术语 | 本仓含义 | 避免混用 |
|------|----------|----------|
| T-MAC | LUT-centric mpGEMM 内核库（上游 microsoft/T-MAC） | 不要写成「某个聊天 App」 |
| LUT kernel | 比特级表查找 + 加法，替代反量化后乘加 | 不要泛化为任意 cache |
| SystemAbility | OpenHarmony 系统能力（SA），对外暴露加速接口 | 不要当成普通 ArkTS 页面服务 |
| TTFT | Time To First Token，首字响应延迟 | 不要与端到端吞吐混为一谈 |
| 方向四 | 操作系统智能创新赛题 | 不要做成纯应用创新 Demo |

## Boundaries

**In scope**

- T-MAC LUT 内核适配 / 抽取 / 评测
- 封装为 SystemAbility（或等价用户态系统服务）+ 轻量资源/行为调度
- 初赛文档、设计稿、测试报告；复赛可演示系统与视频
- 与 llama.cpp 等基线对比数据

**Out of scope（当前）**

- 完整 OS 内核修改
- 纯应用层聊天产品（可作为演示壳，不是创新主体）
- 未获 PRD 批准的功能实现
- handoff 文档流（已停用）

## Actors

| 角色 | 职责 |
|------|------|
| 参赛队员 | 方案、移植、封装、文档、演示 |
| Agent（Cursor / Claude Code） | 文档骨架、代码适配、报告草稿 |
| 指导教师 | 学籍与正式提交背书 |
| 评委 | 创新性 / 完备度 / 前景 / 规范性 / 附加落地 |

## 主线

基于 LUT 的系统级低比特 LLM 加速服务 + 轻量感知调度（无独立 theme 命名；产出落 `docs/output/` 扁平目录）。
