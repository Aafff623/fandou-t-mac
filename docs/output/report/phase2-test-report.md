# Phase 2 · 测试报告草稿（复赛）

Status: scaffold（host 工具链已通；板上数据待填）

> 需要排版预览 / 队内对齐时，看模拟稿：  
> **[`phase2-test-report-MOCK.md`](phase2-test-report-MOCK.md)**（全文标 MOCK，禁止当实测提交）。

## 1. 测试目的

验证 LUT-SA 在 OpenHarmony 开发板上相对 llama.cpp 反量化基线的吞吐 / TTFT，并验证 SystemAbility 调用链可演示。

## 2. 测试环境

见 [phase2-bench-matrix.md](phase2-bench-matrix.md)。

## 3. 测试项

| ID | 项 | 方法 | 期望 |
|----|----|------|------|
| T1 | Native LUT 库 | `tmac_selftest` | 退出 0，NMSE&lt;1e-3 |
| T2 | E2E 推理 | `llama-cli` | 连贯文本 |
| T3 | 加速比 | `llama-bench` ON vs OFF | tok/s 提升可复现 |
| T4 | SA IPC | Demo App | `hidumper` 可见 + 结果回传 |
| T5 | QoS | 前后台切换 | QoS 读回变化 + TTFT 差 |

## 4. 结果

（板测后粘贴矩阵与原始 log 路径）

## 5. 结论

（待填）

## 6. 数据引用边界

可引：本队 OHOS 实测 + B1（MSRA）注明来源设备。  
不可引：B2/B4/B7/B10 mock 或通稿数字（见 feasibility §10.4）。  
本文正式稿未填前，不要把 `*-MOCK.md` 里的模拟 tok/s 抄进来当实测。
