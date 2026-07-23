# Phase 1 · 设计稿说明

Status: 设计稿定稿（draw.io XML + PNG）
源文件：`assets/images/readme/architecture-phase1.drawio`、`sequence-phase1.drawio`
本地 PNG：`assets/images/readme/architecture-phase1.png`、`sequence-phase1.png`

> 历史版本见 `phase1-design-draft.md`（旧 Mermaid 渲染稿，已被本稿替代）。
> 配色：统一灰阶（白底 / 黑字 / 黑边），便于黑白打印。

## 渲染产物

### 图 1 · 系统架构

![系统架构](../assets/images/readme/architecture-phase1.png)

要点：

- L1 应用 → L2 感知与调度 → L3 SystemAbility → L4 计算核心，垂直单向依赖。
- 右侧「对照与验证」并列，强调与 llama.cpp 的可复现对照。
- 边线：实线 = 主调用；细实线 = 内部连接；虚线 = 调度/控制/对照。
- 底部「边界声明」：不修改 OS 内核，仅在用户态封装 LUT 内核并以 SA 暴露能力。

### 图 2 · 交互 / 时序

![调用时序](../assets/images/readme/sequence-phase1.png)

要点：

- 五条 lifeline：Demo App → SAMgr → LUT SA → Native Lib → LUT Kernel。
- 主调用编号 1–5，覆盖一次完整 Generate。
- 右侧 TTFT 双向开口标尺，覆盖 CreateSession 完成 → 首 token 返回。
- 边线：实线 = 调用；虚线 = 返回/异步；双向开口 = 指标区间。

## 出图与提交

| 步 | 动作 |
|----|------|
| 1 | 用 draw.io Desktop 或 https://app.diagrams.net 打开 `.drawio` 源文件 |
| 2 | File → Export as → PNG，2× 分辨率 |
| 3 | 落盘到 `assets/images/readme/`，与 `.drawio` 同名 |
| 4 | 上传茶思屋「设计稿」 |

## 图 3 · 赛题映射（表格，作为图说的补充）

| 赛题关键词 | 本设计落点 |
|------------|------------|
| 系统 AI 任务效率 | LUT 计算范式 + 指标回传 |
| 软硬件异构调度 | CPU LUT 主路径；NPU 对照（复赛） |
| 感知与资源调度 | 通知 / 桌面 / 负载 → Policy |
| 可落地 | 用户态 SA + NDK，不改内核 |

## 源文件与可编辑性

- draw.io 源文件已落到仓库，可在本地直接打开编辑后重新导出 PNG。
- 编辑后请保持配色与边线宽度规范，避免再次出现「花花绿绿」版本。