# LUT-SA · OpenHarmony 适配交付说明

队名：翻斗花园 · 作品：LUT-SA  
本文对应复赛「T-MAC → OHOS」**计算核 + 工具链适配**（计划 P0–P2 主机侧 + 封装骨架）。

## 做到哪一步

| 层级 | 状态 | 说明 |
|------|------|------|
| 工具链 P0 | ✅ Host 完成 | DevEco NDK 交叉编译；`hello` = aarch64-ohos |
| Native LUT 库 P1 | ✅ Host 完成 | `libtmac_kernels.a` 零 TVM；`tmac_selftest` 已编 |
| llama.cpp P2 | ✅ Host 完成 | `llama-cli` / `llama-bench` aarch64-ohos 已编 |
| codegen / pipeline | ✅ 完成 | `platform.py` 含 `ohos`；`run_pipeline.py` 支持 `-d ohos` + hdc |
| SystemAbility / QoS | 🟡 源码骨架 | `ohos/sa` `ohos/sched` 已有 IPC/切块/QoS stub，需开发板 samgr |
| 板上实测 | ❌ 阻塞 | 当前 `hdc list targets` 为空，无 RK3588 / 无 gguf 模型 |

**结论：** 「适配鸿蒙化」主机侧（换工具链、出 aarch64 库与可执行文件、流水线开关）已完成；真机跑 token / 填加速比要等板子。

## 本包内容

```
ohos-adapt/
  README.md                 # 本文件
  ohos/                     # 鸿蒙封装源码 + 构建脚本（不含临时 log）
  prebuilt/aarch64-ohos/    # 已交叉编译产物
    hello
    libtmac_kernels.a
    tmac_selftest
    libtmac_sa.so
    llama-cli
    llama-bench
    kcfg.ini
  patches-note.md           # 上游小改文件清单
  kernels-src/              # 复用的 aarch64-hf-bitnet-3b 可移植 C 内核
```

## 板上最短验证（有设备后）

```bash
hdc file send prebuilt/aarch64-ohos/hello /data/local/tmp/hello
hdc shell chmod 755 /data/local/tmp/hello
hdc shell /data/local/tmp/hello

hdc file send prebuilt/aarch64-ohos/tmac_selftest /data/local/tmp/
hdc shell /data/local/tmp/tmac_selftest

# 另推 gguf + kcfg 后：
# TMAC_KCFG_FILE=... llama-cli -m model.gguf -n 128 -t 4 -ngl 0
```

## 从源码重编（Windows + DevEco SDK）

```powershell
. .\ohos\scripts\env.ps1
powershell -File .\ohos\scripts\build_hello.ps1
powershell -File .\ohos\scripts\stage_tmac_prefix.ps1
powershell -File .\ohos\scripts\build_kernels.ps1
# llama：见 ohos/P2_STATUS.md
```

默认 SDK：`D:\dev_software\DevEco Studio\sdk\default\openharmony\native`
