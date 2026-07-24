# Phase 1 · 作品介绍

![LUT-SA 系统海报](../../assets/poster/poster-phase1.png)

![系统架构](../../assets/images/readme/architecture-phase1.png)

![调用时序](../../assets/images/readme/sequence-phase1.png)

低比特大模型在边缘设备落地时，主流路径仍以反量化后高精度乘加实现，反量化访存与转换开销显著抵消低比特收益；多任务并发场景下，首字延迟（TTFT）与能耗指标进一步劣化。赛题要求在现有操作系统架构下提升系统 AI 任务运行效率，纯应用层 Demo 难以承载「系统级创新」这一命题。

作品 LUT-SA 以开源 T-MAC（EuroSys 2025）比特级查找表范式为计算引擎，将低比特混合精度矩阵乘转换为查表与加法运算，消除反量化乘加路径。计算内核经 NDK 封装后，以用户态 SystemAbility 注册到 OpenHarmony / HarmonyOS 系统服务框架，对外统一暴露模型加载、推理与指标回传三类能力。调度侧联动系统通知、前台状态与负载信号，动态调整 AI 任务优先级与预取策略，形成「感知 → 调度 → 加速」闭环。系统路径全程运行于用户态，不依赖未公开的内核接口。

工程实现分三层：计算层适配 T-MAC LUT Kernel 至 ARM 架构，处理访存模式与 LUT 表布局；服务层按 SAMgr 注册 LUT SystemAbility，对外暴露统一加速接口，应用按需获取 proxy；策略层将行为信号映射为优先级、预取与节流策略，可在演示场景中直观呈现。

公开评测数据表明，相对 llama.cpp 反量化基线，T-MAC 在多种边缘 CPU 上吞吐具备稳定优势。BitNet-3B 在 M2-Ultra 单核 22.08 对 6.49 tokens/s，树莓派 5 单核 8.03 对 1.37 tokens/s，数据出处为本仓 `docs/profiling_data.md`。本作品以此为性能基线，并规划在 OpenHarmony 模拟器或 ARM 设备上完成复现与实测补充。复赛阶段可进一步叠加官方 NPU / CANN 量化路径作对照，强化「异构调度」的论证链。

作品意义在于将 LUT 计算范式产品化为系统级服务，降低端侧大模型部署门槛，为隐私本地推理、低功耗生成等场景提供基础支撑。