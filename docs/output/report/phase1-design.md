# Phase 1 · 设计稿

源文件：`assets/images/readme/architecture-phase1.drawio`、`sequence-phase1.drawio`
PNG：`assets/images/readme/architecture-phase1.png`、`sequence-phase1.png`
海报：`assets/poster/poster-phase1.png`

![LUT-SA 系统海报](../assets/poster/poster-phase1.png)

## 图 1 · 系统架构

![系统架构](../assets/images/readme/architecture-phase1.png)

自顶向下四层：L1 应用层 → L2 感知与调度 → L3 系统服务层（用户态 SystemAbility）→ L4 计算核心（T-MAC 二开），垂直单向依赖。右侧并列「对照与验证」，与 llama.cpp 反量化基线对照。边线语义：实线为主调用；细实线为内部连接；虚线为调度 / 控制 / 对照。底部边界声明：不修改 OS 内核，仅在用户态封装 LUT 内核并以 SA 暴露能力。

## 图 2 · 交互 / 时序

![调用时序](../assets/images/readme/sequence-phase1.png)

五条 lifeline：Demo App → SAMgr → LUT SA → Native Lib → LUT Kernel。主调用链按 1–5 编号，覆盖一次完整 Generate：CreateSession → InitBuffers / LoadLUT → Generate → InferTokenBatch → mpGEMM / LUT lookup。右侧 TTFT 双向开口标尺，覆盖 CreateSession 完成 → 首 token 返回。