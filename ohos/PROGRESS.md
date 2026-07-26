# P0–P5 落地状态（host 侧 2026-07-26）

| 阶段 | Issue | Host | Board |
|------|-------|------|-------|
| Gate0 PRD+Issues | — | done | — |
| P0 hello | #2 | aarch64 hello 已编 | hdc 空，待板 |
| P1 kernels | #3 | `libtmac_kernels.a` + selftest 已编；nm 无 TVM | selftest 待推 |
| P2 llama | #4 | `llama-cli`/`llama-bench` + `.so` OHOS 已编 | 推理待板+gguf |
| P3 SA | #5 | `libtmac_sa.so` + workspace/tile/QoS + `sa_smoke` | samgr 注册待板 |
| P4 QoS | #6 | `ApplyPerceptionSignal` + 可选 `TMAC_USE_OH_QOS` | 真 QoS 链库待系统镜像 |
| P5 交付 | #7 | 矩阵/报告骨架；**适配 zip 已打** | 实测数待填 |

## 提交包

`docs/output/report/submission/03-LUT-SA翻斗花园-ohos-adapt.zip`

产物目录：`ohos/build/` · `ohos/hello/build/` · `3rdparty/llama.cpp/build-ohos-check/`
