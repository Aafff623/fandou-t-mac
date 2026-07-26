# 上游 / 仓内为 OHOS 适配改动的文件

| 文件 | 改动 |
|------|------|
| `python/t_mac/platform.py` | 新增 `ohos` 设备预设；`get_arch("ohos")=="aarch64"` |
| `tools/run_pipeline.py` | `-d ohos`：`ohos.toolchain.cmake`、`--ohos-ndk`、`hdc` 部署、`TMAC_DIR` staging |
| `ohos/**` | 全新竞赛层：shim / CMake / selftest / sa / sched / napi / scripts |
| `docs/output/prd/prd.md` | 复赛 PRD（approved） |
| `3rdparty/llama.cpp` | submodule 检出；**未改 ggml 源码**；`GGML_TMAC_TVM_THREADPOOL` 默认 OFF 即直连 |

未改：`tbl.cc` / `lut_ctor.cc` / `weights.py` / `tmac_gemm_wrapper.h` / 根 `CMakeLists.txt` 的 TVM 静态库路径。
