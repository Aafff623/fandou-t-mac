# Phase 2 · 测试报告（MOCK 模拟稿）

> **【MOCK · 非实测】**  
> 本文仅用于：报告结构预览、队内对齐口径、填空练习。  
> **禁止**把下列带「模拟」标记的数字写成「本队鸿蒙板实测」去茶思屋/答辩。  
> 真板数据到位后：复制本文 → 去掉 MOCK → 替换 §4/§5 数字 → 覆盖 `phase2-test-report.md`。  
> 生成日期：2026-07-26

---

## 1. 测试目的

验证 LUT-SA（T-MAC LUT 内核 + OpenHarmony 用户态封装）相对 llama.cpp 反量化基线，在端侧 CPU 上的吞吐与首字延迟（TTFT）收益；并核对交叉编译产物与 SystemAbility 调用链的可演示性。

## 2. 测试环境

### 2.1 已核实（Host，非模拟）

| 项 | 值 |
|----|-----|
| 主机 | Windows 10 + DevEco Studio OHOS NDK |
| SDK | `openharmony/native`，clang **15.0.4** |
| 交叉目标 | `aarch64-linux-ohos` + musl + `libc++_shared` |
| 工具链文件 | `ohos.toolchain.cmake`，`OHOS_ARCH=arm64-v8a` |
| 首模 / 内核 | `deploy/tuned/aarch64-hf-bitnet-3b`（2bit，`-gc` 可移植 C） |
| hdc | 3.2.0d（当前无设备） |

### 2.2 模拟假定设备（【MOCK】）

| 项 | 模拟取值 |
|----|----------|
| 板型 | RK3588 标准系统开发板（模拟型号：BQ3588HM） |
| CPU | 4×A76 + 4×A55（测试绑大核 4 线程） |
| 系统 | OpenHarmony 标准系统（可写 `/system`，可注册 SA） |
| 模型文件 | `hf-bitnet-3b.*.gguf`（模拟路径 `/data/local/tmp/model.gguf`） |

## 3. 测试项与方法

| ID | 项 | 方法 | 期望 | MOCK 结果 |
|----|----|------|------|-----------|
| T0 | 交叉编译 hello | `ohos/scripts/build_hello.ps1` | aarch64 ELF | ✅ Host 已通过（真实） |
| T1 | Native LUT 库 | `tmac_selftest` | 退出 0，NMSE&lt;1e-3 | ✅ Host 已编出；板上跑通为【MOCK】假定 PASS |
| T2 | E2E 推理 | `llama-cli -n 128 -t 4 -ngl 0` | 连贯文本 | 【MOCK】假定输出正常 |
| T3 | 加速比 | `llama-bench` ON vs OFF | tok/s 可复现提升 | 【MOCK】见表 §4 |
| T4 | SA IPC | `sa_smoke` / 未来 Demo | 会话 API 通 | ✅ Host 已编 `sa_smoke`；samgr 注册【MOCK】未做 |
| T5 | QoS | 前后台信号 | QoS/TTFT 差异 | 【MOCK】见表 §4 |

## 4. 模拟结果数据（【MOCK】）

> 下列 tok/s、TTFT **不是**仪器读数。量级参考公开 `docs/profiling_data.md` 中 Raspberry Pi 5 / AGX Orin 档，按「RK3588 大核略强于 Pi5」做**示意缩放**，仅方便排版。

### 4.1 吞吐矩阵（模拟）

| # | 模型 | 位宽 | 线程 | QoS | TTFT(ms)【MOCK】 | tok/s【MOCK】 | T-MAC | 约倍速【MOCK】 |
|---|------|------|------|-----|------------------|---------------|-------|----------------|
| 1 | bitnet-3b | 2 | 1 | default | 420 | 9.2 | ON | — |
| 2 | bitnet-3b | 2 | 4 | interactive | 180 | 24.5 | ON | vs #4 ≈ **2.7×** |
| 3 | bitnet-3b | 2 | 4 | background | 260 | 18.0 | ON | vs #2 降约 26% |
| 4 | bitnet-3b | 2 | 4 | default | 310 | 9.1 | OFF（反量化） | 基线 |

### 4.2 功能项（模拟判定）

| 检查 | 【MOCK】结论 | 备注 |
|------|--------------|------|
| `llvm-readobj`：hello / llama-cli 为 `EM_AARCH64` | ✅ 真实（Host） | 已在开发机核实 |
| `llvm-nm`：`libtmac_kernels.a` 无 `TVM*` 未定义 | ✅ 真实（Host） | 符合 `-gc` 直连路径 |
| 板上 `tmac_selftest` PASS | 🟡 模拟假定 | 待 hdc 实跑 |
| 板上 `llama-cli` 出 token | 🟡 模拟假定 | 需 gguf + 板 |
| `hidumper -ls` 见 LutSystemAbility | 🟡 模拟未测 | 仅有 SA 用户态库骨架 |

### 4.3 公开对照（非 MOCK，可引用）

出处：`docs/profiling_data.md`（上游公开 profiling，**非本队 OHOS**）。

| 模型 | 设备 | 线程 | llama.cpp | T-MAC | 约倍速 |
|------|------|------|-----------|-------|--------|
| BitNet-3B | Raspberry Pi 5 | 1 | 1.37 | 8.03 | ~5.9× |
| BitNet-3B | Raspberry Pi 5 | 2 | 2.71 | 11.09 | ~4.1× |
| BitNet-3B | M2-Ultra | 4 | 22.09 | 54.46 | ~2.5× |

## 5. 模拟结论（【MOCK】话术草稿）

1. Host 侧已证明：LUT 内核可按 OHOS NDK 交叉编译，且不依赖 TVM runtime。  
2. 【MOCK】在假定 RK3588 上，4 线程 T-MAC 相对反量化基线吞吐约 **2.5–3×** 量级（示意，非正式）。  
3. 【MOCK】后台 QoS 相对前台交互档位，吞吐与 TTFT 均变差，可用于「感知→调度」叙事演示。  
4. 正式结论必须以板上 `llama-bench` 原始 log 为准；本 MOCK 稿在上板后作废数字段。

## 6. 复现步骤（上板后把 MOCK 换成真值）

```powershell
# Host
. .\ohos\scripts\env.ps1
powershell -File .\ohos\scripts\build_kernels.ps1

# Device（hdc 非 Empty 后）
hdc file send .\ohos\build\tmac_selftest /data/local/tmp/
hdc file send .\deploy\tuned\aarch64-hf-bitnet-3b\kcfg.ini /data/local/tmp/kcfg.ini
hdc shell "TMAC_KCFG_FILE=/data/local/tmp/kcfg.ini /data/local/tmp/tmac_selftest"

# llama（需自备 gguf + prebuilt .so）
# export LD_LIBRARY_PATH=... TMAC_KCFG_FILE=...
# llama-bench -m model.gguf -n 128 -t 4 -ngl 0
```

原始 log 建议落盘：`docs/output/report/logs/`（目录可自建）。

## 7. 风险与边界

| 项 | 说明 |
|----|------|
| MOCK 数字 | 不可用于评分材料中的「实测」表述 |
| 无板 | T1–T5 板上项全部未闭环 |
| 无 gguf | T2/T3 无法真实执行 |
| SA | 当前为进程内 API + `sa_smoke`，非 samgr 已注册服务 |

## 8. 附件索引

| 文件 | 角色 |
|------|------|
| 本文 | MOCK 全文 |
| [`phase2-test-report.md`](phase2-test-report.md) | 正式稿骨架（待填真值） |
| [`phase2-bench-matrix.md`](phase2-bench-matrix.md) | 正式矩阵（待填） |
| [`phase1-test-report.md`](phase1-test-report.md) | 初赛雏形（公开数据，可用） |
| `ohos/PROGRESS.md` | 代码侧进度 |
