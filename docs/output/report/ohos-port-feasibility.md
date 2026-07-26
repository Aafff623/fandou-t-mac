# T-MAC → OpenHarmony 移植可行性方案

> 依据：ADR-0001（LUT kernel + 用户态 SystemAbility 路径）· `docs/knowledge.md` 方案蓝图
> 事实来源：2026-07-26 四路源码深挖（codegen / runtime+build / e2e+Android / OHOS 生态），全部断言可回溯到 `file:line` 或 URL
> 状态：**规划稿**，未动任何功能代码（受 CLAUDE.md「PRD 未批准不写功能代码」约束）
> 面向：复赛窗口 2026-07-27 → 2026-09-30

---

## 0. 结论先行

**移植可行，且成本比立项时预估低一个量级。**

T-MAC 的 LUT 计算核心**不是** OS 绑定的，是 **ISA 绑定**的。Android 与 OpenHarmony 同为 `aarch64 + NEON + fp16`，所以内核本体、权重打包、调优配置**一行都不用改**——需要改的只是「谁来编译它」和「谁来调用它」。

| 层 | 改动量 | 说明 |
|---|---|---|
| LUT 内核本体（`kernels.cc`） | **0 行** | 已有 4 套预生成 aarch64 NEON 源码，直接换工具链重编 |
| 权重打包（`weights.py`） | **0 行** | 布局绑 SIMD 宽度，NEON→NEON 不变 |
| 调优配置（`kcfg.ini`） | **0 行** | 同微架构，最优 tiling 一致 |
| codegen 平台层（`platform.py`） | **+1 个预设 +1 个分支** | 只为「需要新模型 shape 时能重新生成」 |
| 端到端驱动（`run_pipeline.py`） | **+1 个 elif 分支 + adb→hdc** | Android 分支是现成模板 |
| **新增 `ohos/` 目录** | 全新 | dmlc shim + 最小 CMake + SystemAbility 封装 + 调度层 ← **真正的工作量在这** |

一句话：**移植不是难点，封装和调度才是。这恰好和赛题「操作系统智能创新」的评分点对齐**——评委不看你会不会交叉编译，看你有没有把能力做成系统服务、有没有调度闭环、有没有可复现数据。

---

## 1. 事实基座（已核验）

### 1.1 T-MAC 有两条落地路径，只有一条对我们成立

| | **A. LLVM-object 路径**（默认） | **B. 可移植 C 路径**（`-gc`）✅ |
|---|---|---|
| 触发 | `return_type="lower"/"mod"` | `compile.py -gc` → `return_type="c"` |
| 产物 | `kernels.o` / `kernels.dll` | `kernels.cc` + `kernels.h` + `kcfg.ini` |
| 运行期依赖 | libtvm_runtime + DLPack | **仅 `stdint.h`/`string.h`/`arm_neon.h`** |
| 线程 | TVM threadpool | 调用方自己切块并发 |
| OHOS 难度 | 高（要把 TVM runtime 移植到 musl） | **低（纯交叉编译）** |

切换开关早就在代码里：`include/t-mac/tmac_gemm_wrapper.h:3-11` 用 `TMAC_USE_TVM_THREADPOOL` 二选一。**不定义它** → 走 `#else` 分支，直接 `#include "t-mac/kernels.h"` 调 `qgemm_lut_int8()` / `preprocessor_int8()`（`:191-227`），全程不碰 TVM。

> 更关键的是：官方默认 CMake 流程（`run_pipeline.py` 不传 `TMAC_STATIC`/`TMAC_LIBRARY`）本来就走 `TMAC_TVM=OFF`（`CMakeLists.txt:8-9` 的 `CMAKE_DEPENDENT_OPTION` 语义），**连 libtvm_runtime 都不装**。我们要复刻的就是这条官方默认路径，不是发明新路子。

### 1.2 生成内核的依赖面（grep 实证）

对 `deploy/tuned/kernels.cc`（1336 行）全量扫描：

| 类别 | 命中数 |
|---|---|
| `TVMBackend*` / `__tvm*` / `DLTensor` / `TVMFuncCall` | **0** |
| `malloc` / `posix_memalign` / `pthread` / OpenMP / `mmap` / `sysconf` | **0** |
| `syscall` / `__ANDROID__` / `<unistd.h>` | **0** |
| 实际外部调用 | 仅 `memset` + 头内联的 `std::max/min` |

计算全用栈缓冲（`alignas(32) half CBits[256]` 等）。这就是一份自包含的 NEON C++ 文件。

### 1.3 现成可用的 aarch64 资产

`deploy/tuned/` 下已有 **4 套**预生成 NEON 内核源码：

| 目录 | 模型 | 位宽 |
|---|---|---|
| `aarch64-hf-bitnet-3b/` | BitNet-3B | 2bit |
| `aarch64-llama-2-7b-2bit/` | Llama-2-7B | 2bit |
| `aarch64-llama-2-7b-4bit/` | Llama-2-7B | 4bit |
| `aarch64-llama-3-8b-2bit/` | Llama-3-8B | 2bit |

每套含 `kernels.cc` + `kernels.h` + `kcfg.ini`，`__ARM_NEON` 在**下游编译时**才展开，tuned 的 `bm/kfactor` 已 baked 进源码与 kcfg。

> ⚠️ 顶层 `deploy/tuned/kernels.o`（35KB）、`kernels.dll`（68KB）是 **x86_64-Windows/AVX2** 产物，OHOS **必须弃用**。别误拿。

### 1.4 OHOS 侧生态事实（带来源核查）

| 项 | 结论 | 来源 |
|---|---|---|
| triple / libc | `aarch64-linux-ohos` + musl fork，clang（OHOS 定制 LLVM） | CMake issue #25987、rustc platform-support |
| CMake 接入 | `{sdk}/native/build/cmake/ohos.toolchain.cmake`，变量 `OHOS_ARCH` / `OHOS_PLATFORM` / `OHOS_STL` | 官方 NDK CMake 构建文档 |
| NEON / dotprod / i8mm | NEON（含 `vqtbl` 查表）是 aarch64 基线 ✅；RK3568/3588 有 dotprod；**无 i8mm**（需 ARMv8.6） | 芯片规格 |
| 自定义 SystemAbility | 标准系统开发板**可行**（自编镜像 / hdc 推 `/system`）；零售 HarmonyOS NEXT 手机**不可行**（闭源签名 + 强沙箱） | safwk / samgr / build 子系统 |
| llama.cpp OHOS 先例 | `Aloereed/llama.cpp-server-ohos`（HAP 应用内）、`bachjin/oh-llama.cpp`（RK3588 + RKNN，活跃至 2026-04） | GitHub |
| 调度 API | `OH_QoS_SetThreadQoS`（6 级）+ FFRT（5 级）+ Background Tasks Kit | 华为开发者文档 |

**这条决定了演示形态**：复赛真机演示**必须用标准系统开发板**（SA 才成立），NEXT 手机只能作「HAP 内 NAPI 调用」的补充展示。

---

## 2. 技术决策（含被否决的路径）

| # | 决策 | 理由 | 被否决的替代 |
|---|---|---|---|
| D1 | 走 **B 路径**（`-gc` 可移植 C） | 设备侧依赖收敛到 libc(musl) + libc++ + `arm_neon.h` | A 路径：要为 musl 移植整个 TVM runtime，投入产出比极差 |
| D2 | **直接复用** `aarch64-*` 预生成内核，不重跑 codegen | 同 ISA 同 tiling；连 host 端都不用装 TVM（Windows 上装 TVM 本身就是一道坎） | 在 host 重跑 `compile.py -d ohos`：只在需要新模型 shape 时才做 |
| D3 | **不改** `tmac_gemm_wrapper.h`，用 **include 路径优先级**注入 dmlc shim | 上游文件零改动 = 后续 rebase 上游无冲突 | 直接编辑 wrapper 删 `#include`：污染上游层，违反「两层结构」约束 |
| D4 | 内核库自建**最小 CMake target**，不复用根 `CMakeLists.txt` | 根 CMake 的 `TMAC_STATIC` 路径在 `:61` 链 `tvm_runtime`，会把整个 TVM 拖进来 | 复用根 CMake + 一堆 `-D` 关掉：脆弱且难解释 |
| D5 | **并行交给上层**（SA / ggml），内核保持单块单线程语义 | `-tb` 产物本就是单 threadblock；wrapper 注释 `:197-199` 明确要求调用方切块 | 在内核里塞线程：破坏可移植性 |
| D6 | 调度用 **QoS + FFRT**，不押注 pthread 硬亲和 | QoS 是官方 API 且沙箱内可用；affinity 在 OHOS musl 是否放开**未核实** | `pthread_setaffinity_np`：风险未知 |
| D7 | 演示**双轨**：开发板真 SA（主）+ 手机 HAP NAPI（辅） | SA 在 NEXT 手机上物理不可行，但只演示开发板会被质疑「离用户太远」 | 单轨押手机：SA 叙事直接崩塌 |

---

## 3. 目标形态

### 3.1 分层与依赖面

```
┌─ L1  Demo App (ArkTS / HAP)
│        │ @ohos.rpc / NAPI
├─ L2  感知与调度  ── OH_QoS_SetThreadQoS · FFRT · Background Tasks Kit
│        │
├─ L3  LUT SystemAbility  (libtmac_sa.z.so)          ← 新写
│        ├─ SAMgr 注册 / IPC 接口 / 会话与 buffer 生命周期
│        └─ M/N 维切块 → 多线程调 llama_cpp_compute()
│        │
├─ L4  Native LUT 库  (libtmac_kernels.a)            ← 交叉编译，源码零改
│        ├─ tmac_gemm_wrapper.h  (直连模式，header-only)
│        ├─ kernels.cc / kernels.h  (aarch64 NEON，来自 deploy/tuned/)
│        └─ kcfg.ini  (运行时经 TMAC_KCFG_FILE 定位)
└─ 依赖面：libc(musl) + libc++ + arm_neon.h + _Float16
           零 TVM runtime · 零 OpenMP · 零 pthread 直用
```

### 3.2 与 Phase-1 架构图的对应

L1–L4 与 `assets/images/readme/architecture-phase1.drawio` 的四层一一对应——**初赛画的架构图在复赛落地时不需要重画**，只是把 L3/L4 从「设计」变成「有二进制」。这一点对评委叙事很重要：证明我们初赛不是画饼。

---

## 4. 代码改动清单（逐文件）

### 4.1 上游层（`python/` `tools/`）—— 必改，但很小

| # | 文件 | 改动 | 必要性 |
|---|---|---|---|
| 1 | `python/t_mac/platform.py:75` `_device_kwargs` | 新增 `"ohos"` 预设 | **P0 强制**。缺它 `is_cross_compiling()`（`run_pipeline.py:42`）会 `KeyError: 'target'` |
| 2 | `python/t_mac/platform.py:180` `get_arch()` | 加 `elif device == "ohos": return "aarch64"` | **P0 强制**。else 分支反查 `_platform_device_default_map`，`ohos` 不在里面会抛 `StopIteration`；而 `-u` 复用预构建正是靠 `get_arch()` 拼 `tuned/aarch64-<model>`（`run_pipeline.py:58`） |
| 3 | `tools/run_pipeline.py:189` | `if device=="android"` 后加 `elif device=="ohos"` 分支 | P0 |
| 4 | `tools/run_pipeline.py:234-264` | `adb push/shell/chmod` → `hdc file send` / `hdc shell` | P0 |
| 5 | `tools/run_pipeline.py` FLAGS | 加 `--ohos-ndk`（对应现有 `-ndk`） | P0 |

> ⚠️ 前一版分析把 #2 标成「可选」，**实测是强制**：`get_arch` 的 else 分支对未登记设备会直接抛异常。

`ohos` 预设草案：

```python
"ohos": {
    "target": "llvm -device=arm_cpu -mtriple=aarch64-linux-ohos "
              "-mattr=+v8.2a,+fullfp16,+fp-armv8,+neon",
    "eval_kwargs": {"number": 10, "repeat": 10},
    "remote_kwargs": None,          # OHOS 无 TVM RPC，禁真机调优
    "cc": os.environ.get("OHOS_NDK_CC"),   # {sdk}/native/llvm/bin/clang++
    "cc_opts": ["-O3", "-march=armv8.2a+fp16",
                "--target=aarch64-linux-ohos", "--sysroot=<ohos_sysroot>",
                "-mllvm", "-inline-threshold=10000"],
    "out_dtype": "float16",
    "aggregation_dtype": "int32",
},
```

`run_pipeline.py` 的 ohos 分支（照 Android 逐项替换）：

| Android 现有（`file:line`） | OHOS 换成 |
|---|---|
| `-DCMAKE_TOOLCHAIN_FILE=$NDK_HOME/build/cmake/android.toolchain.cmake`（`:194`） | `{ohos_sdk}/native/build/cmake/ohos.toolchain.cmake` |
| `-DANDROID_ABI=arm64-v8a`（`:195`） | `-DOHOS_ARCH=arm64-v8a` |
| `-DANDROID_PLATFORM=android-23`（`:196`） | `-DOHOS_PLATFORM=OHOS`（musl 无 API level 概念） |
| `-DCMAKE_C_FLAGS=-march=armv8.2a+dotprod+fp16`（`:197`） | **原样保留**（`+fp16` 对 `_Float16` 强制必需） |
| `-DGGML_METAL=OFF -DGGML_ACCELERATE=OFF`（`:198-199`） | 原样保留 |
| `-DCMAKE_FIND_ROOT_PATH_MODE_PACKAGE/INCLUDE=BOTH`（`:200-201`） | 原样保留 |
| `-DGGML_OPENMP=OFF`（`:186`） | 原样保留（并行归上层） |
| — | 加 `-DOHOS_STL=c++_shared` |

### 4.2 新增 `ohos/` 目录（本仓竞赛层，不污染上游）

```
ohos/
├── CMakeLists.txt              # 最小 target：libtmac_kernels.a
├── shim/dmlc/logging.h         # LOG/DCHECK/ICHECK/DLOG → no-op 或 assert
├── sa/                         # LUT SystemAbility
│   ├── lut_sa.cpp/.h           # SA 骨架 + IPC 接口
│   ├── lut_sa.cfg              # init 拉起配置
│   ├── profile.json            # SA 声明（said / libpath）
│   └── BUILD.gn / bundle.json  # 编入镜像用
├── sched/qos_policy.cpp        # QoS + FFRT 调度策略
├── napi/                       # 手机端降级路径：HAP 内 NAPI 桥
└── scripts/build_ohos.sh       # 一键交叉编译
```

**dmlc shim 精确范围**（`grep` 实证，`tmac_gemm_wrapper.h` 只用这 4 个宏）：

| 宏 | 出现位置 | shim 实现 |
|---|---|---|
| `LOG(FATAL)` | `:49`, `:67` | 打印到 stderr + `abort()` |
| `LOG(INFO)` | `:92`, `:109` | 走 OHOS `HiLog` 或 no-op |
| `DCHECK(cond)` | `:193`, `:226` | Release 下 no-op，Debug 下 assert |
| `ICHECK(cond)` | `:303` | 同上（仅 TVM 分支用到，直连不触发） |

四个宏都要支持 `<<` 流式追加 → shim 用「返回一个吞掉 `operator<<` 的临时对象」实现，约 30 行。

**最小 CMake target 要点**：

```cmake
add_library(tmac_kernels STATIC ${TMAC_KERNELS_SOURCE})   # deploy/tuned/aarch64-*/kernels.cc
target_include_directories(tmac_kernels PUBLIC
    ${T_MAC_ROOT}/include          # tmac_gemm_wrapper.h / INIReader.h
    ${CMAKE_CURRENT_SOURCE_DIR}/shim)   # ← 优先级注入 dmlc/logging.h
target_compile_options(tmac_kernels PRIVATE -O3 -fPIC -march=armv8.2a+dotprod+fp16)
set_target_properties(tmac_kernels PROPERTIES CXX_STANDARD 17)
# 绝不定义 TMAC_USE_TVM_THREADPOOL
```

### 4.3 明确不改的

`python/t_mac/intrins/{tbl.cc,lut_ctor.cc}`（NEON 本体）、`python/t_mac/weights.py`（权重打包）、`include/t-mac/tmac_gemm_wrapper.h`、`include/t-mac/INIReader.h`、根 `CMakeLists.txt`、`deploy/tuned/aarch64-*/*`。

---

## 5. 分期路线 P0–P5

### P0 · 环境与工具链打通（1 周）

| 项 | 内容 |
|---|---|
| 目标 | OHOS SDK 装好，能用 `ohos.toolchain.cmake` 编出一个 aarch64-ohos 的 hello world 并在板子上跑起来 |
| 关键动作 | ① 采购/借用 RK3588 标准系统开发板 ② 下载 OHOS SDK（command-line-tools 或 huaweicloud 镜像）③ 打通 `hdc` 连接 ④ 确认 SDK 内 clang 版本与 CMake 版本 |
| **验收** | `hdc shell /data/local/tmp/hello` 输出正确；`file` 确认二进制为 `aarch64` + musl 动态链接 |
| 风险 | SDK 内置 CMake 仅 3.16，若脚本用了新语法需自备 CMake 3.30+ |

### P1 · Native LUT 库交叉编译（1 周）

| 项 | 内容 |
|---|---|
| 目标 | 产出 `libtmac_kernels.a`，零 TVM 依赖 |
| 关键动作 | ① 写 `ohos/shim/dmlc/logging.h` ② 写 `ohos/CMakeLists.txt` ③ 编 `deploy/tuned/aarch64-hf-bitnet-3b/kernels.cc` ④ 写一个最小自测 main：喂随机权重调 `qgemm_lut_int8(m=128,k=3200,n=1,b=2)`，与 x86 端同输入结果比 NMSE |
| **验收** | ① `nm -u libtmac_kernels.a` 无 `TVM*` / `pthread*` 符号 ② 板上自测 main 返回 0 且 NMSE < 1e-3 ③ `ldd` 只依赖 `libc.so`(musl) + `libc++_shared.so` |
| 风险 | `_Float16` 编译失败 → 检查 `-march` 是否带 `+fp16`；`arm_neon.h` 找不到 → 检查 sysroot |

> P1 是**整个方案的技术风险闸门**。P1 过了，后面全是工程活；P1 不过，方案要重估。所以 P1 排在最前，且验收标准最硬。

### P2 · 端到端 llama.cpp on OHOS（2 周）

| 项 | 内容 |
|---|---|
| 目标 | 板上跑通 `llama-cli`，出第一个 token |
| 关键动作 | ① `git submodule update --init 3rdparty/llama.cpp`（**当前三个 submodule 全未初始化**，这是前置阻塞）② `platform.py` 加 ohos 预设 + `get_arch` 分支 ③ `run_pipeline.py` 加 ohos 分支 + adb→hdc ④ `-u` 复用 `aarch64-hf-bitnet-3b` 预构建 ⑤ 推 gguf + kcfg.ini 到板子，设 `TMAC_KCFG_FILE` |
| **验收** | ① `llama-cli -m bitnet-3b.gguf -n 128 -t 4 -ngl 0` 输出连贯文本 ② `llama-bench` 给出 tokens/s ③ 与 `--disable-t-mac` 的反量化基线对比出加速比 |
| 风险 | ggml 侧 `ggml-tmac.*` 是否显式定义 `TMAC_USE_TVM_THREADPOOL` **待 submodule 检出后确认**；OpenMP 已由 `GGML_OPENMP=OFF` 规避 |

### P3 · LUT SystemAbility 封装（2 周）

| 项 | 内容 |
|---|---|
| 目标 | 能力从「命令行二进制」变成「系统服务」——这是 ADR-0001 的核心主张，也是赛题得分点 |
| 关键动作 | ① SA 骨架（`.cfg` + `profile.json` + `libtmac_sa.z.so`），samgr 注册 ② IPC 接口设计：`CreateSession / LoadModel / InferTokenBatch / ReleaseSession` ③ buffer 生命周期：`_qlut/_lut_scales/_lut_biases` 由 SA 侧分配（直连模式下 wrapper 不管这些）④ M/N 维切块 + 多线程调 `llama_cpp_compute`，`llama_cpp_init` 仅主线程调一次 ⑤ 编入镜像或 hdc 推 `/system` |
| **验收** | ① `hdc shell "hidumper -ls"` 能看到我们的 SA ② Demo App 经 IPC 拿到推理结果 ③ 多线程切块结果与单线程 bit-level 一致 ④ 时序图 `sequence-phase1.drawio` 的 5 步全部跑通 |
| 风险 | 自编镜像流程长；`hdc` 推 `/system` 需系统分区可写（开发板成立，见 §1.4） |

### P4 · 行为感知调度闭环（1 周）

| 项 | 内容 |
|---|---|
| 目标 | 把「创新叙事」变成可演示的代码 |
| 关键动作 | ① `OH_QoS_SetThreadQoS` 分级：前台交互 → `QOS_USER_INTERACTIVE`，后台预取 → `QOS_BACKGROUND` ② FFRT 组织并发任务图 ③ Background Tasks Kit 感知前后台切换 ④ 感知输入源（通知/传感器/桌面状态）→ 优先级与预取策略 |
| **验收** | ① 前台/后台切换时线程 QoS 实测变化（`OH_QoS_GetThreadQoS` 读回）② 同一 prompt 在两种 QoS 下 TTFT 有可测差异 ③ 能画出「感知 → 决策 → 调度」的闭环日志 |
| 风险 | 「行为感知」的感知输入源接口名**未逐一核实**，需 P0 阶段并行核一轮；不要押注 pthread 硬亲和 |

### P5 · 测评与交付物（2 周）

| 项 | 内容 |
|---|---|
| 目标 | 复赛要的「完整测试报告 + 可演示系统 + 视频 + PPT」 |
| 关键动作 | ① 测评矩阵：模型 × 位宽 × 线程数 × QoS 档位，指标 TTFT / tokens-per-s / 功耗 ② 对照组：llama.cpp 反量化基线、官方量化路径、（可选）RKNN NPU ③ 复现脚本 + 原始数据落 `docs/output/report/` ④ 演示视频 + PPT + 源码 zip |
| **验收** | 测试报告可被第三方按脚本复现；视频完整展示 SA 调用链 |

---

## 6. 排期（映射复赛 2026-09-30）

可用窗口：2026-07-27 → 2026-09-30，约 **9.5 周**。

| 周 | 日期 | 阶段 | 里程碑 |
|---|---|---|---|
| W1 | 07-27 ~ 08-02 | P0 | 板子到手 + 工具链跑通 hello world |
| W2 | 08-03 ~ 08-09 | **P1** | **`libtmac_kernels.a` 板上自测通过 ← 技术风险闸门** |
| W3–W4 | 08-10 ~ 08-23 | P2 | 板上 llama-cli 出 token + 首个加速比数据 |
| W5–W6 | 08-24 ~ 09-06 | P3 | SA 注册成功 + Demo App 经 IPC 拿到结果 |
| W7 | 09-07 ~ 09-13 | P4 | 调度闭环可演示 |
| W8 | 09-14 ~ 09-20 | P5-a | 测评矩阵跑完 + 测试报告初稿 |
| W9 | 09-21 ~ 09-27 | P5-b | 视频 + PPT + 源码 zip 打包 |
| 缓冲 | 09-28 ~ 09-30 | — | 上传与修订（茶思屋最多更新 10 次） |

**并行项**（不占主线周次）：OHOS 生态待核实项的二次核查（§9）、手机端 NAPI 降级路径（P3 完成后由第二人并行做）。

**关键路径**：P0 → P1 → P2 → P3。P4 可与 P3 部分重叠，P5 依赖 P3 完成。

**若 W2 的 P1 未通过**：立即启动 Plan B——放弃开发板 SA，改走 `Aloereed/llama.cpp-server-ohos` 的 HAP 应用内路线（已有先例跑通），叙事从「系统服务」降级为「应用内加速引擎 + 调度建议」。这个决策点必须在 W2 结束时明确拍板，不能拖。

---

## 7. 设备与模型矩阵

### 设备

| 板 | 芯片 | CPU | dotprod / i8mm | NPU | 定位 |
|---|---|---|---|---|---|
| **RK3588 板**（贝启 BQ3588HM / hihope-rk3588 / ArmSoM-LM7） | RK3588 | 4×A76 + 4×A55 @2.4GHz | 有 / 无 | 6 TOPS | **主推**。A76 大核 + 可选 RKNN 做「LUT CPU vs NPU」对比亮点。淘宝约 ¥2000+ |
| DAYU200（HH-SCDAYU200） | RK3568 | 4×A55 @2.0GHz | 有 / 无 | ~1T | 兜底基线。标准系统首发，社区文档最全 |
| HarmonyOS NEXT 手机 | — | — | — | — | **仅**能演示 HAP 内 NAPI，不能演示 SA |

### 模型

| 模型 | 位宽 | 预构建 | 优先级 |
|---|---|---|---|
| BitNet-3B (`hf-bitnet-3b`) | 2bit | ✅ | **P0**，首选验证目标：3B 参数在端侧内存友好 |
| Llama-2-7B | 2bit / 4bit | ✅ | P1，做位宽对比 |
| Llama-3-8B | 2bit | ✅ | P2，压测上限 |

四套 kernel 形状（以 bitnet-3b 为例）：`m128_k8640_n1_b2`、`m128_k3200_n1_b2`、`m320_k3200_n1_b2`，全部 `n=1`（decode 期 GEMV）。**若要演示 prefill 阶段的 batch GEMM，需重新 codegen**——这是唯一会触发「host 端装 TVM」的场景，排期上放 P5 之后作为加分项，不进主线。

---

## 8. 风险矩阵

| # | 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|---|
| R1 | 开发板采购/到货延迟 | 中 | **致命**（阻塞全部真机验证） | W1 第一天就下单；同时申请学校/华为开发者社区借板；备选先用 QEMU aarch64 + OHOS 模拟验证编译链 |
| R2 | P1 交叉编译失败（`_Float16` / sysroot / musl） | 低 | 高 | 三个已知摩擦点已定位（§4.2）；失败则退到 Plan B（HAP 路线） |
| R3 | submodule 未初始化，ggml 侧集成细节未知 | **已确认存在** | 中 | P2 第一件事就是 `git submodule update --init`；两个 fork 分支坐标已知（`kaleid-liner/llama.cpp` @ `master-rebased`） |
| R4 | SA 编入镜像流程超预期（GN 构建学习曲线） | 中 | 高 | 优先走 `hdc` 推 `/system` 的轻量路径，编镜像作为 W6 的可选加强 |
| R5 | 评委质疑「套壳 T-MAC」 | **高** | 高 | 文档与视频必须讲清三件事：系统层接口设计、调度闭环、可复现数据。ADR-0001 已预警此点，P3/P4 的产出就是答案 |
| R6 | 「行为感知」接口名未核实，做不出闭环 | 中 | 中 | W1 并行核查；退路是用「前后台切换 + 电量 + 通知」三个确定可用的信号 |
| R7 | 手机端演示缺失被扣「实际应用价值」分 | 中 | 中 | P3 后并行做 HAP NAPI 降级路径，视频里两个形态都出镜 |
| R8 | 复赛窗口与开学季/其他课业冲突 | 中 | 中 | 关键路径 P0–P2 压在 8 月（暑假）完成 |

---

## 9. 待核实清单（W1 并行处理）

| # | 待核实 | 影响 | 怎么核 |
|---|---|---|---|
| 1 | OHOS SDK 内 clang / LLVM 具体版本号 | 决定能否吃 `-march=armv8.2a+dotprod+fp16` | 装完 SDK 跑 `clang --version` |
| 2 | RK3588 开发板确切型号与定价 | 采购决策 | 淘宝/官方渠道询价 |
| 3 | Sensor Service Kit 具体接口名 | P4 感知输入源 | 华为开发者文档 |
| 4 | `pthread_setaffinity_np` 在 OHOS musl 是否放开 | P4 备选方案 | 板上写 5 行测试 |
| 5 | `TMAC_TVM` 默认值实机复验 | 已按 `cmake_dependent_option` 文档语义推定为 OFF 并已修正 `CLAUDE.md`；建议装 cmake 后 `cmake -LA` 确认一次 | 本机无 cmake |
| 6 | ggml-tmac 是否显式定义 `TMAC_USE_TVM_THREADPOOL` | 决定 P2 是否需额外改 ggml 侧 | submodule 检出后 grep |

---

## 10. 社区文章吸收：短期跟风适配 × 长期创新蓝图

> §0–§9 解决「怎么把 T-MAC 搬上 OHOS」（**短期跟风**）；本节解决「搬上去之后靠什么拿创新分」（**长期创新**）。
> 素材：`docs/knowledge.md` 灵感 Blog **B1–B12**，2026-07-26 四路并行子 Agent 逐篇联网抓取全文提炼（此前只有标题+URL，从未读进来过）。
> 每条断言标注来源编号；数字严格区分「可引用 / 厂商宣称 / mock 不可引」。本节是 §8 **R5「评委质疑套壳」**的正面答案。

### 10.1 先给可信度分级（决定每篇怎么用）

抓取全部成功，无失败项。但「抓到」不等于「可信」——十二篇质量差三个数量级，用错会被评审反噬：

| # | 一句话 | 性质 | 可信度 | 用法定位 |
|---|--------|------|--------|----------|
| **B1** | T-MAC 官方技术解析（InfoQ / MSRA 供稿） | 原厂稿 | **高·数字可引** | 基线硬数据 + 计算范式背书 |
| B2 | CANN LM Engine 端侧部署 | 社区实战（实为 `setTimeout` mock） | 中·45ms/token 不可引 | 官方栈缺口 + NAPI/ArkTS 封装范式 |
| B3 | openPangu 2.0 + AIKit 接入 | 社区实战（真 ArkTS 调用） | 中·API 名需核验 | 后端抽象 + 会话生命周期范式 |
| B4 | AI 私人管家·叠加式调度 | 参赛概念文（PPT 级） | 低·数字自述 | 仅产品叙事对标 |
| B5 | 进迭时空 RISC-V+OH+LLM 全栈 | 厂商通稿（含实工程细节） | 中上·缺 tok/s | SA 封装 + 底层调度照搬 |
| B6 | 鸿蒙开发心迹(10)·端侧挑战 | 社区综述（伪代码/假 API） | 中·思路可信、码不可抄 | 行为感知信号源 + 动态精度 |
| B7 | HarmonyNext 资源调度全解 | **AI 农场文** | 低·数字全不可引 | 仅叙事脚手架，不进正式引用 |
| B8 | 鸿蒙 PC 算力调度 + 任务接续 | 技术实战（含生产 TS 码 + 诚实免责） | 中上·数据来自模拟器 | SA 骨架 + 跨设备接续骨架 |
| **B9** | 鸿蒙端侧 RAG 全链路 | 技术实战（RK3588 单机实测） | **高(工程)·API 需核验** | **LUT-SA 理想宿主** + 量化纪律 |
| B10 | 方舟引擎 + 性能大模型 | 营销通稿 + 开发者复盘 | 低(通稿)/中(复盘) | 官方对标 + 前景引用 |
| B11 | UCM 推理记忆数据管理器 | 官方页 + 可信媒体（智东西） | 中·数字分层·**服务端** | 记忆调度思想（端侧裁剪） |
| B12 | 动态稀疏化 + ArkData | CSDN(疑 AI 合成) + InfoQ(专家对谈) | **InfoQ 部分：高** | 「OS 资源管理空白」立论 |

**一句话结论**：真正可当硬证据引用的只有 **B1（原厂）+ B9（实测）+ B12 的 InfoQ 段**；B5/B8 是可照搬的工程骨架但数字要标注；其余主要供叙事与定位，数字一律不可引。

### 10.2 短期跟风适配：能直接抄的工程骨架

别人已趟通的坑，我们不必再踩。按主题归拢，每条标来源与落地 P 阶段：

**① SA 封装 / 接口分层**（B5 · B2 · B3）→ 落 **P3**
- 接口形状照 B5 的 `IAiModelAgent`（OHOS 标准 AI 接口）+ JS/TS 一键调用，服务落 `foundation/ai/<svc>` 目录——正是我们「用户态 SA + JS/TS 上层」要照搬的分层。
- NAPI（C/C++）+ ArkTS 双侧封装（B2/B3）：Native LUT 库经 NAPI 暴露，ArkTS 侧薄封装。
- 会话生命周期对齐官方形状（B3 AIKit）：`createLLMSession / generate(stream:true, onToken) / release`。
- ⚠️ **照抄前必核签名**：NNRT 真实是 C API（`OH_NNModel/OH_NNCompilation/OH_NNExecutor`），B8 的 `@ohos.neuralNetworkRuntime` TS 面被简化过；`@kit.AIKit` 的 `aiEngine`、`CANN LM Engine` API 名均需对官方文档二次核验。

**② 生命周期 + 优雅降级 + 资源预算**（B8 · B9）→ 落 **P3/P4**，含金量最高
- 现成骨架：能力探测 → 超时降级 → 模型缓存 → `onMemoryLevel` 驱逐 → 空闲释放 → 版本探测兜底。
- 权限 `ohos.permission.MANAGE_AI_MODELS`（B8，`module.json5`）。
- 模型 `rawfile` → 首启拷沙箱 → 预加载（B8/B9）；`forceCpuMode` 式降级开关——我们改成「NPU 忙/热 → 降级 CPU-LUT / 降位宽」。
- LLM 懒加载 + 空闲 5min 释放（B9，防 4GB RK3588 上 Embedding+LLM 共驻 OOM）。

**③ 底层调度抓手**（B5 · B6）→ 落 **P4**
- 绑核 CPU0-3 + `SCHED_FIFO` 优先级 99 + 大小核分工（4 核推理 / 4 核系统）+ 待机降频 600MHz（B5）。⚠️ 会抢占系统服务，需评估发热/掉帧/功耗——与 §2 D6「QoS/FFRT 优先于硬亲和」并存，先 QoS 再评估是否上 `SCHED_FIFO`。
- 功耗/温度感知回调（B6）：`onHighTemperature`→降位宽、`onLowBattery`→关次要计算——直接是「行为感知→调度」的信号源+策略模板。B7 的 ESS 能耗决策树（能耗成本×Deadline×电量×充电态）只作话术骨架，数字不可引。

**④ 量化与工具链纪律**（B9 · B2 · B12）→ 落 **P1/P2**
- **INT8 全局量化毁精度：89%→72%（作废）；改逐通道（per_channel+per_layer+非对称）回到 87.6%，INT4 逐通道 81.2%**（B9 硬教训）→ 直接印证我们 `weights.py:77-84` 的分组 scale/bias 打包是对的，别退回全局量化。
- 宿主工具链版本必须与真机严格一致，否则产物加载 crash（B2 的 CANN/OM 教训）→ 对应我们：host 端 codegen 的 `kcfg.ini` 与设备端 kernel 版本锁定。
- 量化上限约 2–4bit（B12 · BUPT 徐梦炜）、内存可压到参数量 50% 以下（华为 CANN）——正落 T-MAC 甜区，作基线对比参数。

**⑤ 保留 T-MAC 自身优化**（B1）→ 移植时不丢
- autotvm tiling、weights 重排/交错、LUT 常驻片上、TBL/PSHUF 查表指令——呼应 §4.3「不改 `tbl.cc`/`weights.py`」。
- 真实要撞的墙（B1 作者自陈）：**LUT 访存是随机的**（必须常驻最快片上存储）+ **LUT 方案增大片上内存占用**（要存激活×所有位模式）。

### 10.3 长期创新蓝图：一个立论 + 四个差异化锚点

**核心立论——补上官方缺的「第三档异构调度」。** 官方两套端侧栈都是 NPU 绑定 + 硬件白名单：CANN LM Engine（B2）只支持 Kirin X90，openPangu/AIKit（B3）`inferenceBackend=NPU`、失败即 `fallbackToCloudModel()`。二者对非白名单设备的答案都是**「降级上云」**。这留下一个公开空档：

```
官方现状：  端侧 NPU  ────────────────►  云
                （中低端/老 Kirin/非旗舰 OHOS 存量设备被直接放弃到云）

LUT-SA 补位：端侧 NPU  ──►  端侧 CPU-LUT  ──►  云
                         ↑ 第三档：纯 CPU、不挑 NPU、隐私+离线本地兜底
```

再往上抬一层：不止「兜底」，而是**「主动错峰的一档」**。B1 的硬数据撑腰——4bit-7B 在 Surface AI PC 上 **T-MAC 20 tok/s 超同片 NPU 的 10.4**、端到端较 llama.cpp **4–5 倍**、**同速率仅需 1/4–1/6 核心、算力随比特数线性下降**（反量化的 NPU/GPU 做不到）。于是「NPU 忙/热/被占时把推理主动调到 CPU-LUT、错峰不抢占」站得住脚。**这一条就是 R5「套壳」质疑的正面回击：三档调度是系统级设计，不是套壳。**

四个锚点，按创新性价值排序：

| 锚点 | 一句话 | 主要来源 | 赛题关键词 | 落 P |
|---|---|---|---|---|
| **① 动态位宽 × 负载感知调度** | 按 行为/温度/电量/NPU 争用 切 LUT 位宽，做成调度器核心旋钮 | B1 + B6 | AI任务效率 · 感知数据流 | P4 |
| **② LUT 内核 + 端侧 RAG 记忆闭环**（主叙事） | 把 B9 Pipeline 里的 LLM 模块换成 T-MAC LUT，白捡向量库+记忆层 | B9 + B11 | **记忆调度** · 前景 | P5 |
| ③ 可插拔 CPU_LUT 后端 + A2A 互操作 | `InferenceBackend.CPU_LUT` 与 `NPU` 并列，接 Function Calling→A2A | B3 + B8 | 多设备协同 | P3+ |
| ④ 跨设备 LUT 推理接续 | 复用 KVStore+DeviceManager 接续骨架，演示跨设备 LUT 接力 | B8 | 任务接续 · 多设备 | P5 |

- **① 动态位宽调度**：LUT 换精度只改建表、查表逻辑不变（B1），天然适配「运行时切位宽」；官方也在按路径动态精度 FP16/INT8/INT4（B6）。把它做成调度旋钮，是创新性最该押的差异化。
- **② LUT + RAG 记忆闭环（建议设为主创新叙事）**：B9 就是理想宿主——它的 `Embedding(bge-small-zh) → OH5.1 RDB 原生向量索引(HNSW) → RRF 融合 → LLM 生成` 现在用 MindSpore-Lite 跑 Qwen2.5-1.5B-INT4；**换成 T-MAC 低比特 LUT 内核，白捡它整条 Pipeline 与全套优化（语义缓存 56×、HNSW 检索 30×、KV Cache 6.3×，端到端 2135ms→207ms）**。低比特小模型正是 T-MAC 主场；RDB/HNSW 向量层是现成「记忆调度」实体，直击 50% 创新分。UCM 思想（B11）裁到端侧：前缀缓存复用（多轮对话以查代算）+ 冷热分级（RAM↔flash）。⚠️ **UCM as-shipped 是服务端存储方案（OceanStor 四级），别把服务端「22 倍」安到端侧。**
- **③ 可插拔后端 + A2A**：`inferenceBackend` 可枚举（B3）→「换后端不换上层」；Function Calling→A2A 协议（B3）让 SA 既是推理提供方、也作为 A2A 一员参与任务分发。
- **④ 跨设备接续**：B8 明确点破「跨设备算力池化 API 尚未开放、仅为展望」——这是**公开的差异化空档**，哪怕演示一小片跨设备 LUT 接力就踩在别人还没趟通的地方。

**对齐叙事（答辩用）**：与 RISC-V 阵营（B5）——他们赌 RISC-V 同构自定义指令，我们赌 ARM 通用 CPU 查表，**ISA 互补不撞车**；与华为主线（B10/B11/B12）——华为在用「调度 + 记忆 + 稀疏」三件套压推理成本，哲学是「用记忆/预测换算力」，LUT 是「用查表换乘加」，**同构**，可讲「我们踩在华为主推方向上」。端侧 openPangu 30B 总参 / 2B 激活（B10）= 动态稀疏，与 LUT 低比特**正交**，可提「LUT 低比特 × 激活稀疏 × 行为调度」三层叠加（稀疏作复赛后扩展，B12 · InfoQ 背书）。InfoQ（B12）权威点更直接坐实路线：华为 CANN 章武**点名 llama.cpp + 2–4bit/group 量化作端侧入门**，且「大模型将下沉为 OS 系统级服务、OS 资源管理有空白（LMK 失效、NPU 抢占/调度缺失）」——正是我们 SA + 行为调度要填的坑。

### 10.4 诚实边界与待核验（写进交付物前必读）

- **需对官方 SDK/文档二次核验的 API**：NNRT C API（`OH_NNModel/OH_NNCompilation/OH_NNExecutor`）与 `@ohos.neuralNetworkRuntime` TS 面、`@kit.AIKit` 的 `aiEngine`、CANN LM Engine 接口名、OH5.1 RDB `VECTOR INDEX`/`vectorSearch` 语法与 API18 可用性、`@ohos.aip.dataIntelligence`、ArkData 向量库指标。
- **数字不可引用清单**（写报告时删）：B2 45ms/token（mock）；B4 场景切换数字（参赛自述）；B7 全部（农场文）；B8 数字（模拟器集群非真机）；B10 全部（华为实验室宣称）；B11「22 倍」（最优场景天花板，官方最新只打「2 倍+」，且属服务端）；B12 CSDN 数字（疑似 AI 合成）。
- **可放心引用**：B1（MSRA 原厂稿全部数字）+ B9（RK3588 单机实测，注明「作者单机」）+ B12 · InfoQ 权威口径（量化上限 2–4bit、1B 端侧 ~1000 tok/s、内存压 50% 以下）。
- **强建议**：§5 P5 的测评矩阵要**优先自产一组端侧「吞吐 / 位宽-精度」曲线**——目前全队可引用的硬指标几乎只有 B1，且是 x86/ARM PC 非鸿蒙设备；不自测，交付物里就没有一个「我们自己在 OHOS 上跑出来」的可复现数据，这是评审最会追问的点。
- **可选二轮补充**（本轮未抓，复赛深入时的一手来源候选）：① openPangu 2.0 开源技术说明（HDC 2026 起开源，B10/B12 动态稀疏的官方一手来源）；② UCM 开源仓（魔擎社区 / GitHub，取前缀缓存/后缀检索代码）；③ ArkData 端侧向量库官方文档（证实/证伪 B12 的向量库指标）。

---

## 11. 附录

### A. 证据索引（关键 `file:line`）

| 断言 | 证据 |
|---|---|
| 两条路径切换开关 | `include/t-mac/tmac_gemm_wrapper.h:3-11` |
| 直连模式调用点 | `tmac_gemm_wrapper.h:191-195`（init）、`:200-228`（compute） |
| 「调用方自己切块」 | `tmac_gemm_wrapper.h:197-199` 注释 |
| kcfg 定位顺序（入参→env→宏→FATAL） | `tmac_gemm_wrapper.h:40-56` |
| `-gc` 剥离 TVM 后端 | `python/t_mac/ops/base.py:129-234` |
| `-tb` 不 emit parallel | `deploy/compile.py:47` + `python/t_mac/ops/qgemm.py:268-273` |
| C 路径改 unroll 不 vectorize | `python/t_mac/ops/base.py:249` |
| `TMAC_TVM` 依赖语义 | `CMakeLists.txt:8-9` |
| `kernels_static` 链 tvm_runtime | `CMakeLists.txt:61` |
| `t_mac_no_tvm` 恒建、不链 TVM | `cmake/TMACConfig.cmake.in:65-73` |
| Android 交叉编译配方 | `tools/run_pipeline.py:189-201` |
| adb 部署 | `tools/run_pipeline.py:234-264` |
| `-u` 预构建复用 | `tools/run_pipeline.py:58-62` |
| `get_arch` 对未登记设备抛异常 | `python/t_mac/platform.py:180-187` |
| `GGML_TMAC` 现行开关名 | `tools/run_pipeline.py:183` |
| 权重打包与 kernel 布局耦合 | `python/t_mac/weights.py:61,65-71,73,77-84` |
| NEON 查表指令 | `python/t_mac/intrins/tbl.cc:53-58,348-349,556-557` |

### B. 证据底稿

本方案的每条事实都来自 [`ohos-port-research.md`](ohos-port-research.md) —— 四份子 Agent 深挖报告全文 + 交叉验证摘要 + 待复核项。**要查某条断言的完整出处，读那份。** 两份文件的分工：

| 文件 | 内容 | 谁读 |
|---|---|---|
| `ohos-port-feasibility.md`（本文） | 结论、决策、改动清单、分期、排期、风险 | 队员执行、评委答辩 |
| `ohos-port-research.md` | 4 份报告全文，逐条 `file:line` 证据 | 需要追溯或反驳某条判断时 |

原始 transcript（系统自动存档，体积大、非人类可读）：`C:\Users\Lenovo\.claude\projects\D--OneDrive-Desktop-fandou-t-mac\fc18fc0b-9115-4c96-b06e-f6c59be46f26\subagents\*.jsonl`（4 个子 Agent）+ 同名 `.jsonl` 主 transcript。

### C. 本方案已顺手修正的文档错误

| 文件 | 原表述 | 修正 |
|---|---|---|
| `CLAUDE.md` | 「不设置任一个时默认整个构建 TVM 子目录」 | 实际默认 `TMAC_TVM=OFF`，是 STATIC/LIBRARY 才强制 ON |
| `CLAUDE.md` | `-DLLAMA_TMAC=ON` | 现行为 `-DGGML_TMAC=ON`（`docs/e2e.md` 部分段落仍陈旧） |
