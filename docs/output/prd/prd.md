# PRD · LUT-SA OpenHarmony 复赛落地

Status: **approved**（用户确认「T-MAC → OHOS 复赛落地计划」即批准）  
Date: 2026-07-26  
依据: [ohos-port-feasibility.md](../report/ohos-port-feasibility.md) · [ADR-0001](../../adr/0001-lut-systemability-path.md)

## 1. 目标 / 非目标

| | 内容 |
|---|---|
| **目标** | 将 T-MAC LUT 内核交叉编译到 OpenHarmony，封装为用户态 SystemAbility，叠加 QoS 感知调度，复赛可演示 + 可复现测试报告 |
| **非目标** | 改 OS 内核；移植完整 TVM runtime；零售 HarmonyOS NEXT 上跑真 SA；重写 mpGEMM；把不可信 Blog 数字写进报告 |

## 2. 技术默认（已锁定）

| # | 决策 |
|---|------|
| D1 | `-gc` 可移植 C，设备侧零 TVM |
| D2 | 复用 `deploy/tuned/aarch64-*`，首模 `hf-bitnet-3b` |
| D3 | dmlc shim 注入，不改 `tmac_gemm_wrapper.h` |
| D4 | `ohos/` 自建最小 CMake，不用根 `TMAC_STATIC` |
| D5 | 内核单块单线程，并行归 SA/上层 |
| D6 | QoS + FFRT，不押 pthread 硬亲和 |
| D7 | 主轨开发板真 SA；辅轨手机 HAP NAPI |

## 3. 分层（L1–L4）

```
L1 Demo App (ArkTS/HAP)
L2 感知与调度 (QoS / FFRT / Background Tasks)
L3 LUT SystemAbility (IPC + 切块并行)
L4 Native LUT 库 (libtmac_kernels.a ← aarch64 kernels.cc)
依赖: musl + libc++ + arm_neon.h + _Float16
```

## 4. 阶段验收（对照 Issue）

| 阶段 | Issue | 验收 |
|------|-------|------|
| P0 | 工具链 + 板上 hello | `hdc shell /data/local/tmp/hello`；二进制 aarch64+musl |
| P1 | `libtmac_kernels.a` | 无 TVM 符号；板上 NMSE &lt; 1e-3 |
| P2 | llama.cpp on OHOS | 出 token；有 vs 反量化加速比 |
| P3 | SystemAbility | `hidumper` 可见；IPC 出结果 |
| P4 | 调度闭环 | QoS 读回变化；TTFT 可测差 |
| P5 | 交付 | 自产矩阵 + 视频 + zip |

**Plan B**：P1 未过 → 放弃真 SA 主线，改 HAP 应用内 NAPI + 应用内加速叙事。

## 5. 范围边界

- 不改 `tbl.cc` / `lut_ctor.cc` / `weights.py` / 根 CMake `TMAC_STATIC` 路径
- 不重跑 host TVM codegen（prefill batch 加分项除外）
- 窗口：2026-07-27 → 2026-09-30

## 6. 跟踪

GitHub Issues `P0`…`P5`（label `ready-for-agent`）。实施以 Issue + 本文为准；handoff 停用。
