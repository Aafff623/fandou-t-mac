# OHOS 移植调研底稿 · 4 子 Agent 深挖

> 生成：2026-07-26。来源：本会话 4 个并行子 Agent 对 `microsoft/T-MAC` fork 的只读源码分析 + OHOS 生态 web 核查。
> 本文是正式方案 [`ohos-port-feasibility.md`](ohos-port-feasibility.md) 的**证据底稿**，忠实保留各 Agent 的证据链（`file:line`）。要看结论、路线与排期请读方案；要查某条断言的出处读本文。
> 原始 transcript（完整对话记录，系统自动存档）见文末「原始存档」。

## 交叉验证摘要（先读这条）

4 份报告独立得出、互相印证的 5 个核心判断：

| # | 判断 | 支撑 Agent | 关键证据 |
|---|------|-----------|----------|
| 1 | **走 `-gc` 可移植 C 路径**：生成的 `kernels.cc` 零 TVM 符号、零线程、零 syscall，设备侧只需 `libc++_shared.so`(musl) + `kcfg.ini` | codegen / runtime / e2e | grep `kernels.cc` 无 `TVMBackend*`/`pthread`/`mmap`；默认 CMake 流程连 `libtvm_runtime` 都不装 |
| 2 | **现成 4 套 aarch64 内核直接复用**（bitnet-3b、llama-2-7b 2/4bit、llama-3-8b 2bit），kernel/权重打包/调优配置零改动 | codegen / runtime / e2e | 内核是 ISA 绑定非 OS 绑定；Android↔OHOS 同为 aarch64+NEON+fp16 |
| 3 | **NEON `vqtbl` 查表是 aarch64 基线指令**，RK3568/RK3588 的 fp16+dotprod 均可用（i8mm 不可用，属 ARMv8.6） | codegen / ohos | `tbl.cc:53-58`；RK 芯片为 ARMv8.2-A |
| 4 | **SA 双轨**：标准系统开发板可跑真 SystemAbility（ADR-0001 成立）；零售 HarmonyOS NEXT 手机不可行，降级 HAP 应用内 NAPI | ohos | safwk/samgr 需自编镜像或可写 `/system`；NEXT 闭源签名 |
| 5 | **codegen 层唯一必改**：`platform.py` 加一个 `ohos` 预设（换工具链）；下游 `run_pipeline.py` 加 ohos 分支、adb→hdc | 全部 | `platform.py:75` 无 ohos；`run_pipeline.py:189` android 硬编码 |

---

## 1. codegen 流水线分析（codegen-analyst）

### 核心结论

T-MAC 有两条彼此独立的落地路径，OHOS 移植可行性取决于走哪条：

| 路径 | 产物 | 运行期依赖 | 线程 | OHOS 适配难度 |
|---|---|---|---|---|
| **A. LLVM-object**（默认 `return_type="lower"`） | `kernels.o`/`.dll` | 需 libtvm_runtime + DLPack（`tmac_gemm_wrapper.h:3-7,88-97`） | TVM 自带 threadpool | 高 |
| **B. 可移植 C**（`-gc`，`return_type="c"`） | `kernels.cc/.h`/`kcfg.ini` | 零 TVM，仅 `stdint.h`/`string.h`/`arm_neon.h` | 调用方自管并发 | 低 |

`tmac_gemm_wrapper.h` 用宏 `TMAC_USE_TVM_THREADPOOL` 在两路切换（`:3-11`）：未定义时直接 `#include "t-mac/kernels.h"` 调 `qgemm_lut_int8()`/`preprocessor_int8()`（`:191-227`），完全不碰 TVM。**这是 OHOS SystemAbility Native LUT 库应走的路径。**

### Q1 平台预设解剖（`platform.py:75-158`）

字段与消费方：`target`（→`tvm.target.Target`，`base.py:43`）、`eval_kwargs`（→`time_evaluator`，`base.py:347`）、`remote_kwargs`（→`RPCRunner`/真机上传，`base.py:101-333`）、`cc`+`cc_opts`（→`_create_llvm`，`intrins/utils.py:23-28`）、`out_dtype`（ARM=float16，`qgemm.py:70`）、`aggregation_dtype`（int32）。

android vs m2/intel 关键差异：android 带 `remote_kwargs`（`platform.py:100-106`）、`build_func:"ndk"`，靠 TVM RPC 到真机测延迟；本地设备无。triple：android=`aarch64-linux-gnu`(:95)。

新增 ohos 预设：字段同 android，但 `target` triple 建议 `aarch64-linux-ohos`、`cc`=OHOS NDK clang++、`cc_opts` 加 `--target=aarch64-linux-ohos --sysroot=<ndk>`、`remote_kwargs:None`（无 RPC 则禁调优）、`out_dtype:"float16"`。注意现有 map 无 `(Linux,aarch64)→android`，默认落 `jetson`（`platform.py:167`），ohos 须显式 `-d`。

### Q2 可移植 C 路径（`-gc`）

生成路径：`compile.py:87` `return_type="c"` → `base.py:275` `tvm.build(target="c")` → `_postprocess_tvm_c_code`（`base.py:129-234`）把 TVM C-backend 依赖全剥离（删 `c_runtime_api.h`/`TVM_DLL`/`__tvm_main__`；kernel 签名改裸指针；`DLTensor.*`→NULL；`TVMBackendAllocWorkspace`→栈数组；加 `alignas(32)`）。落盘 `kernels.h`(+`stdint.h`) 与 `kernels.cc`（`compile.py:196-201`）。

运行期只需：`stdint.h`/`string.h`(memset)/`<type_traits>`/`<algorithm>` + `__ARM_NEON` 下 `arm_neon.h`。**实测**：grep `deploy/tuned/kernels.cc` 无任何 `TVMBackend*`/`pthread` 符号。入口 `qgemm_lut_int8(m,k,n,b,...)`、`preprocessor_int8(...)`。

`-tb`（单 threadblock）：`compile.py:47` `num_threads=1` → `qgemm.py:268` 不 emit `parallel` → 不含 `TVMBackendParallelLaunch`。`-gc -tb` = 无 TVM runtime + 无 TVM 线程池的自包含单块 kernel，正是 OHOS SA 库要的形态。

### Q3 调优复用（关键判断）

**OHOS 真机无 TVM RPC 时能复用已有 aarch64 调优结果，且是推荐做法。** 证据：
1. `deploy/tuned/aarch64-*` 只含 `kcfg.ini`+`kernels.cc/.h`，committed 的 `tune.log` 是 0 字节——沉淀的是最终可移植 C 产物+配置，非 autotvm 原始日志。
2. 这些 `.cc` 是 ISA-可移植源码，`__ARM_NEON` 在下游编译时才解析，tuned 的 `bm/kfactor` 已 baked 进源码与 `kcfg.ini`。
3. grep `deploy/tuned/` 无 `syscall`/`glibc`/`musl`/`__ANDROID__` 等 OS 依赖。
4. C 路径下 TVM triple 基本不影响输出（`_vectorization=False`，`base.py:249`；NEON 全来自手写 `.cc`）。

正确姿势：aarch64(Android/glibc)→aarch64(OHOS/musl) 同微架构、同 128-bit NEON、同 `simd_n_in=16/simd_n_out=8`，最优 tiling 一致。首选直接取现成 aarch64 产物用 OHOS NDK 交叉编译，跳过重 codegen 与调优，不需设备端 TVM/RPC。

### Q4 Intrinsic ISA 依赖

`tbl.cc`（LUT+shift-add 核心）：NEON `vqtbl1q_u8/s8`（TBL 查表本体，`:53-58,348`）、`vrhaddq_s8`（折半加，`:107`）；x86 `_mm256_shuffle_epi8`（pshufb，`:460`）。**无 syscall/libc 特性**，仅 `memset`。`lut_ctor.cc`：NEON `vld4q_f16`/`vcvtnq_s16_f16` 等，无 OS 依赖。两个 `.cc` 纯 SIMD 计算、零 OS 耦合、NEON 分支完整，OHOS(aarch64) 与 Android(aarch64) 用同一份，无需改。

交叉编译到 OHOS 需保证：OHOS clang target aarch64 且开 NEON（自动定义 `__ARM_NEON`）、`-march=armv8.2a+fp16`（供 `_Float16`）、OHOS sysroot + libc++、`--target=aarch64-linux-ohos --sysroot=<ndk>`。**注意**：B 路径下 `.cc` 头作为源码写进 `kernels.cc`，由下游工具链编译——OHOS 真正要配的是下游编译（llama.cpp/Native 库/CMake），非 codegen 期 `_create_llvm`。

### Q5 权重打包耦合

`weights.py:preprocess_weights`（`:5-88`）是 host 侧离线重排，耦合点：最终形状 `(M//bm,K//g,bm//ngroups)`（`:73` ↔ `qgemm.py:131`）、16-lane 交织（`:61,65-71` ↔ `tbl.cc:49` 每次 `vld1q_u8` 取 16 字节）、scales 按 `simd_n_out×bits` 重排（`:77-84` ↔ `tbl.cc:424`）。**跨平台风险低（NEON→NEON）**：打包是 ISA-布局绑定非 OS 绑定，OHOS 复用同一份 aarch64 kernels+kcfg 则打包代码一字不改。唯一破坏情形：换 SIMD 宽度（SVE）或 kcfg 与实际 kernel 不一致。

### Q6 改动清单

**必须（P0）**：① `platform.py:75` 新增 `ohos` 预设（换工具链参数）；② 下游构建用 OHOS NDK 交叉编译 `-gc` 产物，走非 `TMAC_USE_TVM_THREADPOOL` 分支。
**可选/推荐**：③ `platform.py:165-187` 加 `ohos→aarch64` 特判；④ 不重新 codegen，直接复用 `deploy/tuned/aarch64-*` 交叉编译（最省事）；⑤ 线程由 SA 自建线程池调单块 kernel。**不推荐** A 路径（要把 TVM runtime 移植到 OHOS musl）。

---

## 2. 运行时与构建系统分析（runtime-analyst）

### 前置事实

| 事实 | 证据 |
|---|---|
| 三个 submodule（tvm/llama.cpp/executorch）全未初始化 | `git submodule status` 全带 `-` 前缀 |
| 顶层 `kernels.o/.dll` 是 x86_64-Windows(AVX2) 产物，**OHOS 不可用** | 顶层 `kernels.cc` 走 `__AVX2__` 分支 |
| 已有 4 套预生成 aarch64 NEON 内核源码可直接为 OHOS 重编 | `deploy/tuned/aarch64-{hf-bitnet-3b,llama-2-7b-2bit,llama-2-7b-4bit,llama-3-8b-2bit}/` |

### Q1 构建图谱

| 目标/开关 | 行为 | 证据 |
|---|---|---|
| `kernels_static` | `TMAC_STATIC=ON` 时把 `kernels.o` 包成 STATIC，**PUBLIC 链接 `tvm_runtime`** | `CMakeLists.txt:47-62` |
| `kernels_library` | `TMAC_LIBRARY=ON` 时只 `find_file(kernels.dll)`+install，不建 target | `:39-45` |
| `TMAC_TVM` | 默认(皆 OFF)→**OFF**；STATIC/LIBRARY→强制 **ON** | `:8-9`（`CMAKE_DEPENDENT_OPTION`） |

`tvm_runtime` **可完全不要**：下游走 `t_mac_no_tvm` 接口 + 直接编译 `kernels.cc`。唯一残留是 wrapper 直连模式 `#include "dmlc/logging.h"` 头依赖（stub 掉 `LOG`/`DCHECK` 即可）。这是 OHOS 应复刻的路径。`TMACConfig.cmake.in` 暴露 `t_mac_object`(kernels.o+tvm)/`t_mac`(dll+tvm)/**`t_mac_no_tvm`(仅 kcfg，无 tvm，恒建)**/`TMAC_KERNELS_SOURCE`(=kernels.cc)。

### Q2 封装 API（`tmac_gemm_wrapper.h`）

`template <typename T, int g=4> class TMACGeMMWrapper`（`:79`）。T=浮点（ARM `float16_t`）；g=4（每 4bit 一组 →16 表项）。两套编译期分支由 `TMAC_USE_TVM_THREADPOOL` 决定。

直连模式（OHOS 用）：`llama_cpp_init(void* B,qlut,lut_scales,lut_biases,M,K,N,bits)`→`preprocessor_int8`（`:192`）；`llama_cpp_compute(...)`→`qgemm_lut_int8`（`:225`），单线程任务、调用方切块。init/kcfg：构造→`get_kcfg_file()`（入参→env `TMAC_KCFG_FILE`→宏→`LOG(FATAL)`）→`INIReader`，section 名 `qgemm_lut_t{nt}_int8_m{M*bits}_k{K}_n{N}_b{bits}`（`:325-346`）。

**线程模型**：wrapper 自身不起任何线程。直连模式单次调用单线程，并行由调用方负责（注释 `:197-199`）。无 OpenMP/std::thread/裸 pthread（仅 `std::mutex` 护 `_fcache`）。→ OHOS 并行由 SA/NAPI 或 ggml 层驱动。内存对齐 `kAllocAlignment=64`；`posix_memalign`（非 Win，`:265`）。

### Q3 生成内核符号依赖

`deploy/tuned/kernels.cc`（1336 行）外部依赖：`TVMBackend*`/`__tvm*`/`DLTensor`=**0 个**；`aligned_alloc`/`posix_memalign`/`pthread`/`sysconf`/`mmap`/OpenMP=**0 个**。实际外部调用仅 `memset` + `std::max/min`（头内联）。DLTensor 拆包已剥离（shape/strides 全 NULL，`:841-858`），计算用栈缓冲 `alignas(32) half CBits[256]`。→ `-gc`+`-tb` 产物零 TVM runtime 独立跑。`benchmark.cc` 是 threadpool 示例（用 `TVMArrayAlloc`+`-ltvm_runtime`+写死 `arm_neon`），**不是零 TVM 示例**；仓内无独立直连示例（真实调用方是未检出的 llama.cpp）。

### Q4 musl/OHOS 审计

`posix_memalign`(musl OK)、`_Float16`/`float16_t`（需 clang `-march=+fp16`，OHOS NDK 支持）、`arm_neon.h`/`memset`/`getenv`/`fopen`(INIReader) 均 musl OK。摩擦点仅三个：(a) fp16 的 `-march` flag；(b) `dmlc/logging.h` 头依赖；(c) 别误用 benchmark 的 TVM runtime 路径。**无严重 musl 地雷。**

### Q5 最小依赖构建方案

策略：复刻 `t_mac_no_tvm` 接口 + `run_pipeline.py` 的 Android 交叉编译配方，从源码编 `kernels.cc`，不碰 TVM runtime。**不要**用根 CMakeLists 的 `TMAC_STATIC`（`:61` 链 tvm_runtime）。

草案：① 内核源取 `deploy/tuned/aarch64-<model>/`（已存在 4 套）；② 新写最小 CMake target `add_library(tmac_kernels STATIC .../kernels.cc)`+`-march=armv8.2a+dotprod+fp16 -O3 -fPIC`+`CXX_STANDARD 17`；③ stub 掉 dmlc 日志（`LOG`/`DCHECK`/`ICHECK`→no-op），绝不定义 `TMAC_USE_TVM_THREADPOOL`；④ kcfg 经 `-DTMAC_KCFG_FILE=` 或运行时 env；⑤ 产出 `libtmac_kernels.a`+header-only wrapper 给 SA/NAPI 链接，上层切块多线程调 `llama_cpp_compute`。最终 OHOS 依赖面：libc(musl)+libc++ + `arm_neon.h`+`_Float16`。零 TVM/OpenMP/裸 pthread。

---

## 3. 端到端集成与 Android 路径分析（e2e-analyst）

### 前置：submodule 未检出

`3rdparty/llama.cpp`（`kaleid-liner/llama.cpp` branch `master-rebased`）与 `3rdparty/tvm` 均未检出，故 ggml-tmac.* 集成文件不在盘上，涉 llama.cpp 内部实现处标「推断」，T-MAC 侧桥接均有 file:line 实证。

### Q1 端到端流程（`tools/run_pipeline.py` 8 step）

| Step | 命令要点 | 产物 |
|---|---|---|
| 0 compile | `compile.py -o tuned/<m> -da -nt N -tb -gc -gs G -ags A -m <model>` | `kernels.cc/.h`/`kcfg.ini` |
| 1-2 cmake+install | `cmake -DCMAKE_INSTALL_PREFIX=install ..` → `--target install` | `install/lib/{kcfg.ini,kernels.cc,TMACConfig.cmake}`+`install/include/t-mac/*`（**默认不含 libtvm_runtime**，见修正） |
| 3 convert | `convert_hf_to_gguf.py --kcfg .. --enable-t-mac` | `<model>.<TYPE>.gguf` |
| 4 cmake llama | `cmake -DGGML_TMAC=ON -DCMAKE_PREFIX_PATH=install/lib/cmake/t-mac -DGGML_OPENMP=OFF [+toolchain]` | `build-<device>/` |
| 5 build | `--target llama-cli llama-bench ..` | `bin/*` |
| 6-7 run/bench | 本地直跑 / android 经 adb | log/tps |

关键 env：`NDK_HOME`、`TVM_NDK_CC`、`TMAC_KCFG_FILE`（运行时指向设备 kcfg）、`TVM_TRACKER_HOST/PORT`（RPC 调优）。

### Q2 Android 交叉编译 & 迁移对照

NDK 接入（`run_pipeline.py:189-201`，仅 `device=="android"` 硬编码）：`android.toolchain.cmake`+`ANDROID_ABI=arm64-v8a`+`ANDROID_PLATFORM=android-23`+`-march=armv8.2a+dotprod+fp16`。NDK 26.1/Clang 17（`android.md:5`）。**TVM RPC 调优可选非必需**：Option.1(`-u` 预构建)/Option.2(`-dt` 禁调优) 完全不碰 RPC。adb 部署：push bin→`/data/local/tmp`→push model/kcfg→`TMAC_KCFG_FILE=.. llama-cli -m .. -t N`。

| Android | file:line | OHOS 替换 |
|---|---|---|
| `android.toolchain.cmake` | `:194` | `ohos.toolchain.cmake` |
| `ANDROID_ABI=arm64-v8a` | `:195` | `OHOS_ARCH=arm64-v8a` |
| `ANDROID_PLATFORM=android-23` | `:196` | 删（musl 无此概念） |
| `adb push/shell` | `:237-264` | `hdc file send`/`hdc shell` |
| `tvmrpc-release.apk` 调优 | `android.md:50` | 无 OHOS 版→`-dt`/`-u` |

独有假设：`if FLAGS.device=="android"`（`:189`）整块硬编码，OHOS 需加 `elif`；`platform.py` 无 ohos 预设。

### Q3 llama.cpp 集成点

桥接层：`tmac_gemm_wrapper.h`(核心桥)、`kernels.h`(C ABI 分发)、`INIReader.h`(kcfg 解析)、`kernels.cc`(kernel 本体)、`TMACConfig.cmake.in`(3 种 target)。开关：`GGML_TMAC`(总开关)、`GGML_TMAC_RECHUNK`、`TMAC_USE_TVM_THREADPOOL`、`GGML_OPENMP=OFF`。

⚠️ **文档陈旧**：`docs/e2e.md:46/48`、`docs/usage_deprecated.md` 仍写旧名 `-DLLAMA_TMAC=ON`；当前实际用 `-DGGML_TMAC`（`run_pipeline.py:183`）。

替换路径：T-MAC 替换量化权重 GEMM（QGeMM-LUT），presets 全 `N=1`（decode 期 GEMV）。量化类型（`--enable-t-mac` 注册的私有 GGUF type）：`int_n`(GPTQ 2/4bit)、`tq1_0`/`tq2_0`(三值 BitNet)、`q4_0`、`f16`。

### Q4 模型/位宽矩阵

预置形状（`model_utils.py:19-88`）：llama-2-7b(2/4bit)、llama-2-13b(2bit)、llama-3-8b(2/4bit)、hf-bitnet-3b、phi-3-mini-2bit、trilm-3.9b、gptq-auto。`deploy/tuned/aarch64-*` 4 套可 `-u` 复用（`prebuilt_dir=tuned/{get_arch}-{model}`，`get_arch(android)→aarch64`）。顶层 `deploy/tuned/kcfg.ini`=Llama-2-7B 4bit。

### Q5 真机运行时依赖

可移植 C 路径（默认）：仅 `libc++_shared.so`(NDK) + `kcfg.ini`+`TMAC_KCFG_FILE` env，无 libtvm_runtime、无 OpenMP。→ OHOS 只需 OHOS NDK 的 musl 版 `libc++_shared.so`+kcfg。

### Q6 OHOS 迁移差异清单

`platform.py` 新增 ohos 预设（target `aarch64-linux-ohos`、cc=OHOS clang、`remote_kwargs:None`）+`get_arch()` 加 `ohos→aarch64`；`run_pipeline.py:189` 加 `elif device=="ohos"`；adb→hdc；`libc++_shared.so`→musl 版。OHOS llama.cpp 参考：Aloereed/llama.cpp-server-ohos、RK3588 移植。

### 修正（默认流程不建 TVM）

`CMAKE_DEPENDENT_OPTION(TMAC_TVM "Build TVM" OFF "NOT TMAC_STATIC;NOT TMAC_LIBRARY" ON)`：都不设 STATIC/LIBRARY→`TMAC_TVM=OFF`。`run_pipeline.py` 的 `cmake_t_mac()`（`:115-119`）不带任何 STATIC/LIBRARY 标志→**TMAC_TVM=OFF**。故：
1. **Q1 Step2 修正**：默认 install 实际只产出 `install/lib/{kcfg.ini,kernels.cc,TMACConfig.cmake}`+`install/include/t-mac/*`，**无 libtvm_runtime**。
2. **Q5 更强**：TMACConfig 里 `tvm_runtime_LIBRARY`/`kernels_OBJECT`/`kernels_LIBRARY` 均非 REQUIRED（`TMACConfig.cmake.in:6-19`），默认只建 `t_mac_no_tvm` INTERFACE（无 tvm 链接）+ 暴露 `TMAC_KERNELS_SOURCE`。llama.cpp 链 `t_mac_no_tvm` 并直接把 kernels.cc 编进二进制。
3. **净影响**：默认端到端流程从不需要为 OHOS 交叉编译 libtvm_runtime；设备侧只需 `libc++_shared.so`+kcfg。只有显式 `-DTMAC_STATIC/LIBRARY=ON` 才需 tvm_runtime，OHOS 应避免。

---

## 4. OHOS 生态核查（ohos-researcher，带 URL）

### Q1 OHOS NDK 工具链

| 项 | 值 | 来源 |
|---|---|---|
| 编译器 | OHOS 定制 LLVM 分支「ohos clang」，SDK `native/llvm/` | gitee tpc_c_cplusplus OHOS_SDK-Usage |
| triple | 64 位 `aarch64-linux-ohos`；32 位 `arm-linux-ohos` | CMake issue #25987、rustc *-linux-ohos |
| libc | musl 的 fork（部分 libc 函数如 Android 般被有意禁用） | CMake issue #25987 |
| STL | libc++；`OHOS_STL=c++_shared`(默认)/`c++_static` | harmonyos.cool NDK CMake 文档 |
| toolchain 文件 | `{sdk}/{os}/native/build/cmake/ohos.toolchain.cmake` | 同上、Qt vcpkg 博客 |
| 关键变量 | `OHOS_ARCH`(arm64-v8a)、`OHOS_PLATFORM=OHOS`、`OHOS_STL`；toolchain 自动设 `--sysroot` | 命令行 CMake 构建 NDK 工程 |
| 自带 CMake | SDK 内置 3.16(Ninja)；主线 CMake 3.30+ 原生支持 `CMAKE_SYSTEM_NAME=OHOS` | CMake issue #25987 |
| 下载 | command-line-tools / DevEco Studio 内置 / huaweicloud 镜像 `repo.huaweicloud.com/openharmony/os/` | 同上 |

标准命令：`cmake -DOHOS_STL=c++_shared -DOHOS_ARCH=arm64-v8a -DOHOS_PLATFORM=OHOS -DCMAKE_TOOLCHAIN_FILE={sdk}/native/build/cmake/ohos.toolchain.cmake ..`

CPU 特性：`-march=armv8.2-a+dotprod` 编译器层可用；**NEON(asimd) 是 aarch64 基线**（T-MAC 的 `vqtbl` 即基线 NEON）。运行期 RK3568(A55)/RK3588(A76+A55) 均 ARMv8.2-A → 含 dotprod(asimddp)，**不含 i8mm**(ARMv8.6)。clang 具体次版本号未逐位核实（随 SDK 演进）。

### Q2 llama.cpp on OHOS 先例

| | Aloereed/llama.cpp-server-ohos | bachjin/oh-llama.cpp |
|---|---|---|
| 定位 | HarmonyOS Next 应用内(HAP) llama.cpp server | RK3588 命令行 + RKNN NPU 后端 |
| 工具链 | OHOS SDK `native/llvm` clang, C++17, OpenMP | **ARM GNU** `aarch64-none-linux-gnu 11.2`, `hm_aarch64.cmake` |
| 构建 | DevEco Studio | `cmake -DGGML_RKNN=on -DCMAKE_TOOLCHAIN_FILE=hm_aarch64.cmake` |
| 部署 | 随 HAP 打包 | `hdc file send` .so→`/system/lib64/`、bin→`/data/` |
| 活跃 | 14★，末次 2025-01 | 4★，活跃至 2026-04 |

来源：github Aloereed/llama.cpp-server-ohos、github bachjin/oh-llama.cpp。其他：eduxiji DAYU200 多模态 APP、CSDN 鸿蒙/Android 双平台 LLaMA.cpp 部署。

**已知坑**：应用内(clang/musl/HAP) vs 命令行(push /system，需可写系统分区=开发板)分野明显；bachjin 用 GNU 裸工具链靠 push `/system/lib64`，只在可 root 开发板成立；musl 部分 libc 缺失；线程手动 `-t`。**对我们**：主线走 ohos clang(musl) 工具链 + `OHOS_ARCH=arm64-v8a` 编 T-MAC 可移植 C，避免 GNU/glibc 路线。

### Q3 自定义 SystemAbility 可行性

| | 标准系统开发板(DAYU200/RK3568、RK3588) | 零售 HarmonyOS NEXT 手机 |
|---|---|---|
| 加自定义 SA | **可行 ✅** | **不可行 ❌** |
| 依据 | 源码自编镜像；SA=`.cfg+profile.json+lib.z.so`，init 拉起、samgr 注册；GN 构建编入 image | 闭源签名系统，无法重编刷入；应用强沙箱；无注册三方 SA 通道 |
| 落地 | 编进镜像 / hdc 推 `.so`bin 到 `/system``/data` | 仅 HAP 应用内 bundling `lib_shared.so` 经 NAPI 调用 |
| 权限 | 系统签名，SA 可取 `system_basic/core` | 三方应用默认 `normal`；后台进程会被冻结 |

来源：gitee safwk、samgr、build 子系统；华为云 APL 说明；CSDN libc++ 系统库/应用库。**结论**：ADR-0001「用户态 SA + Native LUT 库」在标准系统开发板成立且是正道；NEXT 手机降级 HAP 应用内 NAPI。→ **复赛真机演示务必用标准系统开发板**，NEXT 手机作应用内推理补充。

### Q4 演示设备矩阵

| 板 | 芯片 | CPU | dotprod/i8mm | NPU | OH 支持 | 价位 |
|---|---|---|---|---|---|---|
| 润和 DAYU200 | RK3568 | 4×A55@2.0G | 有/无 | ~1T | 标准系统首发，OH 3.1+ | 未精确核实 |
| RK3588 板(BQ3588HM/hihope/ArmSoM) | RK3588 | 4×A76+4×A55@2.4G | 有/无 | **6 TOPS** | OH 5.0+ 标准 | 淘宝约 ¥2000+ |

来源：gitee OpenHarmony 开发板表、device_board_hihope、gitcode OpenHarmony-ChipBoards。**推荐**：主推 RK3588 板（A76 大核+dotprod，可选 RKNN 做「LUT CPU vs NPU」对比亮点）；DAYU200/RK3568 作官方基线兜底。

### Q5 行为感知调度 API

| 能力 | API | 关键点 | 来源 |
|---|---|---|---|
| 线程 QoS（首选） | `OH_QoS_SetThreadQoS/Reset/Get`，`QoS_Level` 6 级，`qos/qos.h` 链 `libqos.so` | 只能设当前线程；实测 +13% | harmonyos.cool QoS 指导 |
| 并发运行时 | FFRT，`ffrt_qos_*` 5 级 | 数据依赖异步任务图 | 知乎 FFRT/QoS |
| 后台任务 | Background Tasks Kit（短时含 C/C++ native、长时、延迟） | 短时配额；后台默认冻结 | 华为 Background Task Kit |
| pthread 亲和 | `pthread_setaffinity_np` 是否放开 **未核实**，沙箱通常受限 | 建议以 QoS/FFRT 替代硬亲和 | 未核实 |
| 传感器/状态感知 | Sensor Service Kit、通知 Notification Kit（接口名未逐一核实） | 「行为感知」输入源 | 未核实 |

**调度层建议**：以 QoS(`OH_QoS_SetThreadQoS`) 为主调度钮 + FFRT 组织并发 + Background Tasks Kit 感知前后台；不押注 pthread 硬亲和。感知输入源接口名需再核一轮。

---

## 待复核项（诚实标注，非结论）

| # | 项 | 谁提出 |
|---|----|--------|
| 1 | OHOS clang/LLVM 具体次版本号（随 SDK 演进） | ohos |
| 2 | `pthread_setaffinity_np` 在 OHOS musl 是否放开 | ohos |
| 3 | Sensor/Notification Kit 具体 native 接口名 | ohos |
| 4 | DAYU200/RK3588 精确零售价 | ohos |
| 5 | `3rdparty/llama.cpp` 的 ggml-tmac.* 是否显式定义 `TMAC_USE_TVM_THREADPOOL`（submodule 未检出，据 `t_mac_no_tvm`+`GGML_OPENMP=OFF` 推断为直连） | e2e/runtime |
| 6 | 复赛前需 `git submodule update --init` 才能看到/改 ggml 侧真正 type dispatch | e2e |

---

## 原始存档（transcript）

4 个子 Agent 的完整对话记录（系统自动存，只读、体积大、非人类可读）：

```
C:\Users\Lenovo\.claude\projects\D--OneDrive-Desktop-fandou-t-mac\fc18fc0b-9115-4c96-b06e-f6c59be46f26\subagents\
  ├─ agent-acodegen-analyst-02ee2ffe43e3d5b4.jsonl    (570 KB)
  ├─ agent-aruntime-analyst-ca7c174165b0d196.jsonl    (434 KB)
  ├─ agent-ae2e-analyst-6ded678aea4218eb.jsonl        (522 KB)
  └─ agent-aohos-researcher-1231c222dd189d20.jsonl    (664 KB)
```

本会话主 transcript：`C:\Users\Lenovo\.claude\projects\D--OneDrive-Desktop-fandou-t-mac\fc18fc0b-9115-4c96-b06e-f6c59be46f26.jsonl`
