# 复赛测评矩阵（P5 草稿）

> 自产 OHOS 数据占位。板测完成后填入实测；禁止引用 B2/B7/B10 等不可信数字。  
> 对照基线：llama.cpp `--disable-t-mac`；可选 RKNN。

## 环境

| 项 | 值 |
|----|-----|
| 板型 | （待填 RK3588 型号） |
| OHOS / SDK | clang 15.0.4（DevEco native） |
| 模型 | hf-bitnet-3b 2bit |
| 日期 | |

## 矩阵模板

| # | 模型 | 位宽 | 线程 | QoS | TTFT(ms) | tok/s | 功耗备注 | T-MAC? |
|---|------|------|------|-----|----------|-------|----------|--------|
| 1 | bitnet-3b | 2 | 1 | default | | | | ON |
| 2 | bitnet-3b | 2 | 4 | interactive | | | | ON |
| 3 | bitnet-3b | 2 | 4 | background | | | | ON |
| 4 | bitnet-3b | 2 | 4 | default | | | | OFF（反量化） |

## 复现命令（板上）

```bash
export TMAC_KCFG_FILE=/data/local/tmp/kcfg.ini
/data/local/tmp/bin/llama-bench -m <gguf> -n 128 -t 4 -ngl 0
# 对照：同二进制以 GGML_TMAC=OFF 重编或 pipeline --disable-t-mac
```

## 交付清单

| 物 | 路径 | 状态 |
|----|------|------|
| 本矩阵填数 | `docs/output/report/phase2-bench-matrix.md` | 草稿 |
| 测试报告全文 | `docs/output/report/phase2-test-report.md` | 待写 |
| 演示视频 | `assets/video/` | 待录 |
| 源码 zip | 茶思屋 `03-*.zip` | 待打 |

## Host 已完成（无需板）

- `libtmac_kernels.a` aarch64 交叉编译；llvm-nm 无 TVM 未定义符
- `tmac_selftest` / `hello` / `libtmac_sa.so` 已产出于 `ohos/build/`
- `platform.py` / `run_pipeline.py` 已支持 `-d ohos`
