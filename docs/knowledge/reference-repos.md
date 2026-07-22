# 参考仓库清单

来源：`chat_with_grok-temp.md` 检索结论（2026-07-22）。链接失效时以 upstream 为准。

> **灵感总册（Repos + Blog）：** [`inspiration-sources.md`](inspiration-sources.md) — 规划灵感优先从该文件吸收；本文只维护仓库表。

## 主项目（二开锁定）

| 仓库 | URL | 用途 |
|------|-----|------|
| **microsoft/T-MAC** | https://github.com/microsoft/T-MAC | **本仓上游**：LUT mpGEMM、llama.cpp 集成、评测与 Android 交叉编译；`t-man` 为 NPU 演进 |

**二开切入：** 抽取 LUT kernel → Native 库 → OpenHarmony SystemAbility → 轻量调度 → 测试报告。

本 fork remote：`https://github.com/Aafff623/fandou-t-mac.git`

## 计算演进（可借鉴）

| # | 仓库 | URL | 借鉴点 |
|---|------|-----|--------|
| 1 | OpenBitSys/vlut.cpp | https://github.com/OpenBitSys/vlut.cpp | Vector LUT / prefill；创新性加分候选 |
| 2 | T-MAC `t-man/` | 本仓子树 | NPU 向扩展、异构调度叙事 |

## OpenHarmony 系统与 AI 框架

| # | 仓库 | URL | 借鉴点 |
|---|------|-----|--------|
| 3 | openharmony/ai_engine | https://github.com/openharmony/ai_engine | AI 子系统插件化、系统服务暴露 |
| 4 | systemabilitymgr_safwk / samgr | OpenHarmony 对应仓 | SA 注册、生命周期、IPC、配置 |
| 5 | ai_neural_network_runtime (NNRt) | OpenHarmony | 跨芯片推理运行时对照 |

## 端侧 LLM 移植（工程落地）

| # | 仓库 | URL | 借鉴点 |
|---|------|-----|--------|
| 6 | Aloereed/llama.cpp-server-ohos | https://github.com/Aloereed/llama.cpp-server-ohos | HarmonyOS Next Server 构建部署 |
| 7 | bachjin/oh-llama.cpp | https://github.com/bachjin/oh-llama.cpp | OH + RK3588 / RKNN 工具链 |
| 8 | Turbo1123/turbo-ai-chat-harmonyos | https://github.com/Turbo1123/turbo-ai-chat-harmonyos | ArkTS + N-API + MNN 桥接与 Demo |
| 9 | OpenBMB/MiniCPM-V-Apps | HarmonyOS release | 多模态打包与模型管理 |

## 基线与官方

| 资产 | 用途 |
|------|------|
| ggerganov/llama.cpp | 吞吐/延迟基线对比 |
| 华为 CANN / MindSpore Lite 文档与示例 | 量化与 NPU 对照路径 |

## 使用规则

- **主代码演进只从 T-MAC 抽**；其他仓作模式参考，禁止无授权整仓拷贝进提交作品造成版权纠纷
- 引用第三方数据与架构图时在测试报告/介绍中标注来源
- 新增借鉴仓时追加本表并写一行「借鉴点」
