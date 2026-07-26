# Knowledge · 赛题 / 方案 / 调研

> 本文合并原 `docs/knowledge/*`（competition-brief / team / solution-blueprint / tmac-fit / reference-repos / inspiration-sources / asset-map / init-alignment）。
> Agent 工作规范与口径见 [`docs/agents.md`](agents.md)。

## 赛事简报

来源：`chat_with_grok-temp.md`（2026-07-22）+ 官方报名手册 / 作品说明文档模板 / 茶思屋上传须知（2026-07-26 核对）。权威细节以官网、组委会通知与茶思屋上传页为准。官方原件：`assets/backup/official-2026/`。

### 赛事身份

| 项 | 内容 |
|----|------|
| 全称语境 | 第九届中国高校计算机大赛——人工智能创意赛（C4-AI）核心专项 |
| 俗称 | 鸿蒙高校创新赛 |
| 主办 / 承办 | 全国高等学校计算机教育研究会 / 华为、浙江大学 |
| 官网 | https://developer.huawei.com/home/C4-AI |
| 咨询 | AiContest@huawei.com |

### 方向四：操作系统智能创新

**赛题口径：** 在现有操作系统架构下，通过技术创新，优化软硬件异构调度、跨端通信协议与感知数据流处理机制，提升系统 AI 任务运行效率、多设备协同能力与环境感知精度。

**官方解析侧重：** 桌面/通知/图库等系统 App 与底层后台的用户行为模型 + 资源调度 + 多维感知融合；端侧数据存储、知识抽取、记忆调度、设备语义互联；须有创新思路、技术亮点、可落地性。

**本队选型：** 方向四；技术底座锁定 T-MAC LUT 范式（见下文 · 方案蓝图）。

### 评分（公开口径）

| 维度 | 权重线索 |
|------|----------|
| 创新性 | 约 50（鸿蒙技术创新 / 产品创意 / 交互 / 技术） |
| 完备度 | 约 20 |
| 前景评估 | 约 20 |
| 规范性 | 约 10 |
| 附加「实际应用价值」 | 约 20（可演示 HAP/源码/演示系统、上架成熟度等） |

初赛 / 复赛 / 总决赛独立评分，成绩不累计。

### 赛程与截止

| 阶段 | 截止 | 必须交付 |
|------|------|----------|
| 初赛 | **2026-07-26 24:00** | 表单（简介/方向各 ≤500 字）+ `01` 官方模板 PDF + `02` 演示视频 MP4 ≤5min + `03` 演示 zip |
| 复赛 | **2026-09-30 24:00** | 原作品上迭代：可演示系统/源码、完整测试报告、演示视频、PPT |
| 总决赛 | 2026-11 | 现场答辩、多设备演示、规范性 |

提交平台：黄大年茶思屋（截止前最多更新 10 次；晋级后仅可在原作品上迭代）。报名/提交入口：https://developer.huawei.com/consumer/cn/activity/incentive/C4

### 初赛提交材料（茶思屋实际上传 · 2026-07-26 核对）

表单字段：作品简介 ≤500 字；作品方向 ≤500 字（本队：**操作系统智能创新**）。

附件（命名硬性；合计 ≤2GB；最多更新 10 次）：

| 命名 | 材料 | 要求 |
|------|------|------|
| `01-作品说明文档+参赛队伍名称` | 作品说明文档 | **官网统一模板** → **PDF**；主体 ≤20 页 |
| `02-演示视频+参赛队伍名称` | 演示视频 | **MP4**；≤5 分钟完整展示核心功能 |
| `03-作品名称+参赛队伍名称.zip` | 演示 demo | HAP / 源代码 / 演示系统，压成 **zip** |

作品说明文档模板内必含：参赛团队信息表（作品名 ≤30 字；队名 ≤10 字、无标点；勾选赛题方向；队员+指导教师）、作品原创性声明（全员签名 + 指导老师审核签名）、创意描述（一句话关键创新点 **≤30 字**）、技术方案（效果图/流程图）、介绍文档（**≤800 字**：痛点与需求、核心功能、市场前景）、测试报告（**操作系统智能赛题额外要求**）。

### 组队要点

- 高校在读，最多 3 人，可跨校跨专业；**须 1 名指导教师（须与队长同校）**
- 每队仅选一个赛题方向、提交一个作品；复赛阶段需学籍核验材料
- 复赛作品提交截止前，队员更换至多 1 次（书面申请经批准）

## 参赛队伍

Status：已报名（茶思屋截图确认 2026-07-24）；初赛作品附件尚未按官方三件套提交。赛题方向须勾选 **操作系统智能创新**。

| 项 | 内容 |
|----|------|
| 团队名称 | 翻斗花园（≤10 字、无标点，符合） |
| 所属机构 | 中北大学 |
| 参赛赛题方向 | **操作系统智能创新**（旧记「模型与算子」作废） |
| 报名时间 | 2026-07-17 |
| 指导专家 | 暂未添加（须与队长同校） |
| 队长 | 聂君奋 |
| 队员 | 范腾达、郑李惠杰 |

作品技术名 **LUT-SA**：基于比特级查找表的端侧低比特 LLM 加速方案。一句话见 `docs/output/report/phase1-one-liner.md`。

## 方案蓝图

来源：`chat_with_grok-temp.md` 定稿口径（2026-07-22）。

**一句话创新点（初赛可用）：** 基于比特级查找表（LUT）的系统级低比特 LLM 加速服务，结合用户行为感知实现动态资源调度，降低端侧首字响应延迟与能耗。

**定位：不是从零写 OS，而是范式复用 + 系统封装 + 场景验证。**

| 层 | 做什么 | 不做什么 |
|----|--------|----------|
| 计算核心 | 二开 / 抽取 T-MAC LUT kernel | 重写完整推理框架 |
| 系统服务 | SystemAbility + Native 库暴露加速 API | 改内核调度器源码 |
| 调度感知 | 轻量：通知/传感器/桌面状态 → 优先级与预取 | 完整用户画像平台 |
| 演示验证 | 最小可跑路径 + 对比测试报告 | 纯 PPT 方案 |

赛题允许基于其他开源系统仿真验证，最终可用于鸿蒙。

### 与赛题映射

| 赛题关键词 | 本方案落点 |
|------------|------------|
| 系统 AI 任务运行效率 | LUT 消除反量化开销；吞吐/能耗/TTFT |
| 软硬件异构调度 | CPU LUT vs NPU/官方量化路径；后续 t-man / CANN 对照 |
| 跨端通信 / 语义互联 | 复赛可选：软总线 + 意图接续轻演示 |
| 感知数据流 | 行为触发调度（通知/传感器模拟） |
| 可落地 | 开源基线 + 公开评测数据 + 可移植说明 |

### 推荐技术栈

| 层级 | 选型 | 优先级 |
|------|------|--------|
| OS 底座 | OpenHarmony（优先）或 HarmonyOS NEXT | P0 |
| 系统服务 | SystemAbility + SAMgr | P0 |
| 计算内核 | C/C++ NDK + T-MAC | P0 |
| 官方 AI | CANN LM / AI Engine Kit（对比或混合） | P1 |
| 分布式/感知 | 软总线、Continuation、传感器/通知 Kit | P1–P2 |
| IDE | DevEco Studio + DevEco Code | P0 |
| Agent | Cursor + Claude Code | P0 |
| 基线 | llama.cpp | P0 |

### 分阶段与风险

```mermaid
flowchart LR
  A[初赛文档与设计] --> B[复赛可演示系统]
  B --> C[总决赛答辩优化]
```

| 阶段 | 目标 |
|------|------|
| 初赛（–07-26） | 创意句、架构/流程图、≤800 字介绍、测试报告雏形（可引用公开 CPU 数据 + 移植计划） |
| 复赛（–09-30） | LUT 移植、SA 封装、轻量调度、完整测试报告、≤5 min 视频 |
| 总决赛 | 完备度、多设备、文档与答辩 |

| 风险 | 应对 |
|------|------|
| 初赛时间极紧 | 文档优先；平台可多次更新 |
| 系统权限有限 | 用户态 SA / 库，避开未公开内部 API |
| ARM 适配成本 | 用 T-MAC Android/ARM 路径与 oh-llama 类工程经验 |
| 创新性被说成「只是套壳」 | 强调计算范式（LUT）+ 系统服务化 + 调度闭环 |

## T-MAC 与赛题契合度

来源：论文 EuroSys 2025（Microsoft Research + USTC），开源 https://github.com/microsoft/T-MAC。

| 点 | 说明 |
|----|------|
| 问题 | 边缘低比特 LLM（W4A16、W2A16、W1A16 等）的 mpGEMM；传统反量化吃掉收益 |
| 方法 | 权重按比特分解 → 预计算激活与比特模式写入 LUT → 推理查表 + 加法，消除乘法 |
| 系统 | LUT-centric 布局、轴重排、tiling；表驻留最快片上存储；ARM TBL / x86 PSHUF 等 |
| 算法 | 表量化、镜像合并压缩表 |
| 公开结果线索 | 相对 llama.cpp 可观吞吐提升与能耗下降；多设备（M2 Ultra、树莓派等）有数据 |

> 写进作品介绍/测试报告时核对 `docs/profiling_data.md` 与论文原文，勿臆造数字。

| 赛题方向 | 契合 |
|----------|------|
| 端侧大模型 TTFT 系统级加速 | 直接 |
| 软硬件异构与 AI 任务效率 | LUT 计算范式 + 资源/功耗优势 |
| 端侧记忆调度 / 语义互联 | 高效推理为上下文/向量同步打底（复赛扩展） |
| 可落地与测试报告 | 开源 + 评测工具链齐全 |

本仓关键路径（实现时细读）：`python/t_mac/`（codegen/ops/intrins）、`include/t-mac/`（C++ 封装头）、`deploy/`（编译/benchmark/tuned）、`t-man/`（NPU 向扩展）、`docs/{android,e2e,profiling_data}.md`（移植与数据）。

**结论：** 以 T-MAC 为计算引擎做系统服务化，是方向四在紧时间窗口下成功率最高的路径之一。

## 参考仓库

来源：`chat_with_grok-temp.md` 检索结论（2026-07-22）。链接失效时以 upstream 为准。

**主项目（二开锁定）：** [microsoft/T-MAC](https://github.com/microsoft/T-MAC) — 本仓上游：LUT mpGEMM、llama.cpp 集成、评测与 Android 交叉编译；`t-man` 为 NPU 演进。本 fork：https://github.com/Aafff623/fandou-t-mac.git 。二开切入：抽取 LUT kernel → Native 库 → OpenHarmony SystemAbility → 轻量调度 → 测试报告。

| # | 仓库 | URL | 借鉴点 |
|---|------|-----|--------|
| 1 | OpenBitSys/vlut.cpp | https://github.com/OpenBitSys/vlut.cpp | Vector LUT / prefill；创新性加分候选 |
| 2 | T-MAC `t-man/` | 本仓子树 | NPU 向扩展、异构调度叙事 |
| 3 | openharmony/ai_engine | https://github.com/openharmony/ai_engine | AI 子系统插件化、系统服务暴露 |
| 4 | systemabilitymgr_safwk / samgr | OpenHarmony 对应仓 | SA 注册、生命周期、IPC、配置 |
| 5 | ai_neural_network_runtime (NNRt) | OpenHarmony | 跨芯片推理运行时对照 |
| 6 | Aloereed/llama.cpp-server-ohos | https://github.com/Aloereed/llama.cpp-server-ohos | HarmonyOS Next Server 构建部署 |
| 7 | bachjin/oh-llama.cpp | https://github.com/bachjin/oh-llama.cpp | OH + RK3588 / RKNN 工具链 |
| 8 | Turbo1123/turbo-ai-chat-harmonyos | https://github.com/Turbo1123/turbo-ai-chat-harmonyos | ArkTS + N-API + MNN 桥接与 Demo |
| 9 | OpenBMB/MiniCPM-V-Apps | HarmonyOS release | 多模态打包与模型管理 |

基线与官方：`ggerganov/llama.cpp`（吞吐/延迟基线）；华为 CANN / MindSpore Lite 文档与示例（量化与 NPU 对照）。

**使用规则：** 主代码演进**只从 T-MAC 抽**；其他仓作模式参考，禁止无授权整仓拷贝进提交作品；引用第三方数据/架构图时在测试报告/介绍中标注来源；新增借鉴仓追加本表并写一行借鉴点。

## 灵感 Blog

来源：用户「相关开发灵感文章与资源整理」；检索社区含知乎、CSDN、掘金、SegmentFault、华为开发者联盟、InfoQ、OSChina、电子工程专辑等。对齐目标：系统级 AI 效率、软硬件异构调度、低比特端侧 LLM、资源调度与多设备协同。

**阅读顺序：** 精读 B1+B2+B3（T-MAC 中文解析 + CANN/openPangu）→ 再读 B5+B4（OH 全栈服务化 + 场景调度）→ 补 B6–B9（调度/接续/RAG 工程）→ 最后 B10–B12（前景引用与扩展手段）。

### 最高优先级（精读）

| # | 标题 | 来源 | URL | 使用建议 |
|---|------|------|-----|----------|
| B1 | 大模型端侧 CPU 部署最高提效 6 倍！T-MAC 技术解析 | InfoQ | https://www.infoq.cn/article/RiZDLfUF9pJCixbZX1Na | 初赛创新点、技术方案、测试报告基线叙事 |
| B2 | HarmonyOS 6.1.1 芯端侧大模型中枢：实战 CANN LM Engine 部署端侧 LLM | SegmentFault | https://segmentfault.com/a/1190000047809693 | T-MAC 与官方 AI 引擎结合 / 异构对照 |
| B3 | HarmonyOS7 端侧大模型：openPangu 2.0 接入实战与坑点 | CSDN 鸿蒙社区 | https://harmonyosdev.csdn.net/6a3b6e8510ee7a33f2819de4.html | SystemAbility 接口与模型加载/资源管理参考 |
| B4 | 基于 HarmonyOS 的 AI 私人管家系统：全场景叠加式调度与端侧智能提速 | 华为开发者联盟 | https://developer.huawei.com/consumer/cn/blog/topic/03207740048595240 | 轻量「行为→调度」逻辑，不改内核 |
| B5 | 进迭时空「RISC-V + OpenHarmony + 本地大模型」全栈方案 | 电子工程专辑 | https://www.eet-china.com/info/73299.html | OH 上 LLM 系统服务化样板，二开 T-MAC 强相关 |

### 高优先级（调度 / 异构 / 性能）

| # | 标题 | 来源 | URL | 使用建议 |
|---|------|------|-----|----------|
| B6 | 鸿蒙开发心迹（10）——端侧大模型技术挑战与解决方案 | CSDN | https://harmonyosdev.csdn.net/6960772f0846ec2c4c5afb91.html | 「加速服务 + 调度策略」总架构 |
| B7 | HarmonyNext 内核级性能优化与多模态资源调度体系全解 | 掘金 | https://juejin.cn/post/7476030597165727754 | 强化「软硬件异构调度」叙事；⚠️ AI 农场文，仅作叙事脚手架，数字不可引用 |
| B8 | 鸿蒙 PC AI 原生开发：端侧算力调度与任务接续实战 | Harmony PC 社区（CSDN） | https://harmonypc.csdn.net/6913125c82fbe0098caa9173.html | SA 封装骨架 + 任务接续；含生产级 TS 代码（原 openharmonycrossplatform 链 404，已更正；数字来自模拟器集群） |
| B9 | 鸿蒙端侧 RAG 系统全链路实现 | 开源鸿蒙跨平台社区（CSDN） | https://openharmonycrossplatform.csdn.net/69e824a554b52172bc6b5d64.html | **LUT-SA 理想宿主**（换掉其 MindSpore-Lite LLM 模块）；INT8 逐通道量化硬教训；RK3588 单机实测 |

### 中优先级（视野与官方能力）

| # | 标题 | 来源 / URL | 使用建议（含可信度） |
|---|------|-----------|----------|
| B10 | 鸿蒙7支持方舟调度引擎 + 性能大模型：高频应用流畅度提升 22% | 东方财富转 PChome 通稿 https://caifuhao.eastmoney.com/news/20260612155904289837650 · CSDN 开发者复盘 https://harmonyosdev.csdn.net/6a43839010ee7a33f284f318.html | 前景 / 社会价值引用 + 官方「性能大模型」对标物；数字均华为实验室口径，通稿别当技术依据 |
| B11 | 华为 UCM（推理记忆数据管理器）开源，长序列吞吐 2–22 倍 | 华为官方页 https://e.huawei.com/cn/solutions/storage/ai-storage/ai-inference-acceleration · 智东西 https://zhidx.com/p/496909.html | 记忆调度思想（前缀缓存 / 冷热分级 / 后缀联想）；⚠️ 服务端存储方案，端侧只借思想；官方最新口径「2 倍+」，「22 倍」是最优场景天花板 |
| B12 | 动态稀疏化 + ArkData（鸿蒙开发心迹 16 / QCon 专家对谈） | CSDN https://harmonyosdev.csdn.net/695ce12f6554f1331aa00f72.html（数字不可信）· InfoQ https://www.infoq.cn/article/atf5mZKSWCXk2LgfdHlr（权威） | 「OS 级资源管理空白」立论 + llama.cpp / 2–4bit 专家背书；数字只引 InfoQ，CSDN 那篇疑似 AI 合成 |

低优先级（背景）：竞赛宣传类报道技术深度有限，仅作赛题背景；赛题权威口径以上文 · 赛事简报与官网为准。

**吸收用法：** 一句话创新点/≤800 字介绍 → 先读 B1、B5 + T-MAC 契合度；架构图/SA 接口 → B2、B3、B5 + 仓 #3–#4；测试报告基线 → B1、B3、仓 T-MAC/llama.cpp；轻量调度 → B4、B6、B7；复赛多设备/NPU → B8、B2、仓 `t-man`/CANN；代码落地 → 仓 #1、#3–#8（仅模式参考，主实现仍抽 T-MAC）。新增灵感往本节追加一行，并在 Issue/报告中引用编号（如「灵感源 B1」「仓 #6」）。B1–B12 全文已于 2026-07-26 联网抓取并精提炼，「短期跟风 × 长期创新」的逐条吸收结论、可信度分级与「不可引用数字清单」见 [`ohos-port-feasibility.md`](output/report/ohos-port-feasibility.md) · §10。

## 资产定位

本仓同时存在**上游 T-MAC 资产**与**竞赛/Agent 规范资产**，搬家前先看本表。

| 路径 | 职责 | 可否挪上游文件 |
|------|------|----------------|
| `assets/*.png` `assets/demo.gif` | 上游 README 配图 | **否**（README 硬引用） |
| `assets/images/readme/` | 竞赛/本仓 README 新图 | 新图放这里 |
| `assets/images/avatar/` `icon/` | 品牌头像/图标 | 新资产 |
| `assets/video/` | 演示视频 | 新资产 |
| `assets/poster/` | 海报（初赛可选、复赛现场常用） | 新资产 |
| `assets/theme/ppt/` `script/` | 答辩 PPT、逐字稿（资产目录名，非业务 theme） | 新资产 |
| `assets/backup/` | zip/旧稿只读备份 | 迁入前登记 |
| `docs/{android,codegen,e2e,profiling_data,usage_deprecated}.md` | 上游技术文档 | **否** |
| `docs/agents.md` | Agent 工作流、口径、术语（本目录规范层） | 仅规范文档 |
| `docs/knowledge.md` | 赛题/方案/仓库/队伍/资产/对齐 | 从临时对话归类至此 |
| `docs/adr/` | 架构决策（一决策一文件） | — |
| `docs/output/report/` | 调研成稿（扁平，无 theme 子目录） | — |
| `docs/output/prd/` | 正式 PRD | — |
| GitHub Issues | 任务与状态跟踪 | — |
| `ohos/`（规划） | Harmony/OH 封装代码 | 实施阶段创建 |

**停用：** 业务 theme 子目录（如 `os-ai-accel/`）；`docs/output/handoff/`；`.scratch/` 本地 Issue（改 GitHub Issues）。
**禁止：** `docs/images/`（配图走 `assets/`）；`docs/agents/language.md`、`docs/agents/context.md`（用根 `CONTEXT.md`）；把第三方标杆图原样当本项目 README 图提交。

## Phase A 对齐记录

Date：2026-07-22（同日修订：GitHub Issues / 取消 theme 名 / handoff 停用）。

| # | 确认项 | 采用 |
|---|--------|------|
| 1 | Issue tracker | **GitHub Issues**（`gh`） |
| 2 | Triage 标签 | 五类 canonical 同名（GitHub labels） |
| 3 | CONTEXT | 单上下文（无 CONTEXT-MAP） |
| 4 | 外部资产 | 对话稿 → `docs/knowledge.md` + `docs/output/report/`；原文 → `assets/backup/` |
| 5 | 产品层根 | 仓库根 = T-MAC；鸿蒙封装规划 `ohos/` |
| 6 | 业务 theme 名 | **不使用**；output 扁平（`report/` `prd/`） |
| 7 | 项目预期 | 方向四竞赛作品：系统级 LUT 加速服务 + 可演示 + 测试报告 |
| 8 | Handoff | **停用** |
| 9 | 语气 + 回答格式 | [`docs/agents.md` · 语气与回答格式](agents.md#语气与回答格式) → `answer-format.mdc` |
| 10 | Cursor MDC | `.cursor/rules/` 三份已同步 |
