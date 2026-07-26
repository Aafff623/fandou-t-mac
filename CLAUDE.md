# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Output Style**: `humanizer-output-style` skill — 统一语气与去 AI 味。详见 `skills/humanizer-output-style/SKILL.md`
>
> **Windows Rules**: 项目级 Cursor rules（`alwaysApply`）—
> `.cursor/rules/windows-path-discipline.mdc`、
> `.cursor/rules/windows-shell-discipline.mdc`
> （从用户级 `%USERPROFILE%\.cursor\rules\` 同步；路径操作与 Shell 必须遵守）。
>
> **Answer Format**: `.cursor/rules/answer-format.mdc`（`alwaysApply`）—
> 先简述再详细回答；表格 / Mermaid 信息密度优先；与 `humanizer-output-style` 叠加。

与 `AGENTS.md` 同源入口。本文件给 Claude Code / 同类 Agent 快速对齐。

## 必读顺序

1. `CONTEXT.md` — 领域词汇与边界
2. `docs/agents.md` — 工作规范与口径（文档消费、workflow、交付、issue/triage、归档、语气、术语）
3. `docs/knowledge.md` — 赛题与截止、方案蓝图、参考仓 + Blog 灵感、队伍、资产、对齐
4. 相关 `docs/adr/*` — 已拍板决策

## Repo 定位

本仓是 [microsoft/T-MAC](https://github.com/microsoft/T-MAC)（EuroSys 2025）的竞赛向 fork（分叉自上游 commit，见 `94694a0` 之后为本队提交）。**两层结构**：

| 层 | 路径 | 性质 |
|---|---|---|
| 上游计算核心 | `python/` `deploy/` `include/` `t-man/` `3rdparty/` | T-MAC 原生代码，勿无故大改结构 |
| 本仓竞赛/Agent 层 | `docs/` `assets/{backup,images,video,theme,poster}` | 本仓新增，围绕鸿蒙高校创新赛交付 |

`ohos/`（SystemAbility 封装）尚未创建，是复赛阶段的规划目标，不要假设它已存在。

## Architecture：T-MAC 代码生成流水线

核心不是普通库代码，而是一条 **TVM 代码生成流水线**，理解它需要跨 `python/t_mac/ops/*` 和 `python/t_mac/intrins/*` 联动看：

```
python/t_mac/ops/base.py (OpCodegen)
  ├─ _compute() / _schedule() 用 TVM TE（Tensor Expression）搭计算图
  │    GeMMCodegen        (ops/gemm.py)   — 朴素浮点 GEMM，仅作对照基线
  │    QGeMMLUTBitsCodegen        (ops/qgemm.py) — 真正的 LUT 混合精度 GEMM
  │    QGeMMLUTBitsPreprocessorCodegen (ops/qgemm.py) — 激活量化为 LUT + 逐组 scale/bias
  ├─ _schedule() 把内层规约循环 tensorize 到手写 C++ intrinsic：
  │    intrins/tbl.py      — table-lookup + shift-add 核心（对应 LUT kernel 本体）
  │    intrins/lut_ctor.py — 构造 LUT / partial_max
  │    intrins/utils.py    — _create_llvm：shell 出去调 clang，把 C++ 编译成 LLVM IR
  │                           再通过 TVM 的 "import_llvm" pragma 塞回 schedule
  ├─ compile() 走 TVM autotvm（可调优）lower + build，产出二选一：
  │    - LLVM object（kernels.o，供静态/动态库链接）
  │    - 可移植 C 代码（return_type="c"，用于 llama.cpp 等无法跑 TVM runtime 的交叉编译目标）
  └─ deploy/compile.py 是 CLI 入口：按 (M,K,N) × 模型 × 设备 × 位宽 扫一遍，
     写出 deploy/tuned/{kernels.cc,kernels.h,kcfg.ini}
```

其他关键模块：

| 模块 | 作用 |
|---|---|
| `python/t_mac/platform.py` | 设备预设（`m2` `intel_win` `intel_linux` `android` `jetson` `arm_win`）：target triple、编译选项、`out_dtype`。`get_default_device_kwargs()` 按宿主 OS/架构自动选一个。**目前没有 OpenHarmony/ohos 预设**，复赛适配时需要新增。 |
| `python/t_mac/weights.py` | 宿主侧权重打包/重排，需与 tensorize 后 kernel 期望的内存布局对齐。 |
| `CMakeLists.txt` | 消费 `deploy/tuned/` 产物构建 `kernels_static`/`kernels_library`（链接 `tvm_runtime`）；`cmake/TMACConfig.cmake.in` 是装好后给下游用的 package config。 |
| `3rdparty/llama.cpp`（子模块，`kaleid-liner` fork，branch `master-rebased`） | 通过 `-DGGML_TMAC=ON` + `TMACConfig.cmake` 集成 T-MAC kernel（旧名 `LLAMA_TMAC` 已废弃，`docs/e2e.md` 部分段落陈旧；现行开关见 `tools/run_pipeline.py:183`），是当前的端到端验证路径。 |
| `t-man/` | 独立的 NPU 扩展方向（`executorch` 子模块），见 `t-man/README.md`，与 LUT/SystemAbility 主线是两条不同的路。 |

竞赛层：`docs/knowledge.md` 是赛题/方案/仓库调研；`docs/agents.md` 是 Agent 工作流与口径；`docs/adr/` 是已拍板决策（如 `0001-lut-systemability-path.md`）；`docs/output/{report,prd}` 是交付物落盘处。

## Commands

### Python 环境 / TVM 构建

自动构建路径（`pip install -e .`）**仅支持 macOS-arm64 / Linux-aarch64 / Linux-x86_64**（见 `setup.py` 的 `PLATFORM_LLVM_MAP`）。**Windows 必须手动构建**，走 `docs/codegen.md`：

```bash
cd 3rdparty/tvm && mkdir build && cp cmake/config.cmake build && cd build
cmake ..
cmake --build . --config Release   # Visual Studio
```

然后设置 `PYTHONPATH` 指向 `3rdparty/tvm/python`，再 `pip install -e .`（非 Windows 会自动下载 Clang+LLVM 并 build TVM，生成 `build/t-mac-envs.sh` 供 `source`）。装完验证：

```bash
python -c "import t_mac; print(t_mac.__version__); from tvm.contrib.clang import find_clang; print(find_clang())"
```

### 代码生成与调优（deploy/compile.py）

```bash
cd deploy
python compile.py -t -o tuned -da -d <device> -m <preset_model> -nt <threads> -tb -gc -gs <group_size> -ags <act_group_size>
```

`-d` 取值见 `python/t_mac/platform.py`（`m2`/`intel_win`/`intel_linux`/`android`/`jetson`/`arm_win`）；`-m` 选预设模型（choices 见 `get_preset_models()`，默认 `hf-bitnet-3b`；自定义模型改用 `-md <model_dir>`）——**位宽与 kernel 形状 `(bits,M,K,N)` 由模型经 `model_utils.extract_kernel_shapes` 推出（`compile.py:91`），没有 `-b`/`--bits` 这个参数**；`-gc` 生成可移植 C 代码（跨平台/llama.cpp 集成必需）；`-tb` 单 threadblock（不依赖 TVM 线程池时需要）。产物落 `deploy/tuned/`。

### 测试

`tests/*.py`（`test_acc.py` `test_act_quant.py` `test_e2e.py`）是**可直接运行的脚本，不是 pytest 用例**（无 `test_*` 函数，跑起来会 build+lower 一个 TVM schedule 并打印 NMSE）：

```bash
python tests/test_acc.py
```

`test_e2e.py` 需要一个可达的 TVM RPC tracker/设备。`tests/{test_tbl,test_lut_ctor,test_halving_adder}.cc` 是独立 C++ main，未接入 CMake/CTest，需针对生成的 `tbl.cc`/`lut_ctor.cc` 手动编译（参考 `blackbox/test_tbl.sh` 的调用方式）。仓库没有配置 lint/formatter（无 `.flake8`、无 pre-commit），改动时对齐现有风格即可。CI 只有 CodeQL 安全扫描（`.github/workflows/codeql.yml`），不跑测试。

### 构建 Native Kernel 库（CMake）

前提：`deploy/tuned/` 下已有 `compile.py` 产物（`kernels.o`/`kernels.cc`/`kernels.h`/`kcfg.ini`）。

```bash
cmake -DCMAKE_INSTALL_PREFIX=${TMAC_ROOT_DIR}/install ..
cmake --build . --target install --config Release
```

`-DTMAC_STATIC=ON` / `-DTMAC_LIBRARY=ON` 二选一决定链接静态对象还是预编译动态库，设任一个都会**强制 `TMAC_TVM=ON`** 连带构建 TVM 子目录；都不设时 `TMAC_TVM` 默认 **OFF**——不建 TVM，仅 install `kernels.cc/.h` + `kcfg.ini` 源码三件套（`CMakeLists.txt:9` 的 `CMAKE_DEPENDENT_OPTION` 语义）。

### 端到端 llama.cpp 基线对比

```bash
tools/all_in_one.sh <model_path> <kernel_name> <model_type> [--rechunk] [--convert-model] [--run-only] [--disable-t-mac]
```

一条龙跑 compile → gguf 转换 → llama.cpp 构建 → 推理+benchmark；手动分步见 `docs/e2e.md`。`tools/bench_e2e.py`、`tools/run_pipeline.py` 是同一流程的 Python 版驱动脚本。

## Agent skills

### Issue tracker

本仓使用 **GitHub Issues**（`gh` CLI）。详见 `docs/agents.md` · Issue tracker。

### Triage labels

使用五类 canonical GitHub label（默认同名）。详见 `docs/agents.md` · Triage labels。

### Domain docs

Single-context：根目录 `CONTEXT.md` + `docs/adr/`。详见 `docs/agents.md` · 文档消费规则。

## 硬约束

- 初赛截止：**2026-07-26 24:00**（茶思屋：`01` 官方模板 PDF + `02` 视频 MP4 + `03` 演示 zip；详见 `docs/output/report/phase1-captain-review.md`）
- 不做完整内核改写；优先 **用户态 SystemAbility + Native LUT 库**
- PRD 未批准不写功能代码；**handoff 停用**；Review 先于 commit
- Windows 路径用反斜杠；Shell 重定向用 `nul`
