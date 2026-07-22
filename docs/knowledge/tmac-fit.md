# T-MAC 与赛题契合度

来源：论文 EuroSys 2025（Microsoft Research + USTC）及 `chat_with_grok-temp.md` 分析。开源：https://github.com/microsoft/T-MAC

## 技术要点（给文档写作用）

| 点 | 说明 |
|----|------|
| 问题 | 边缘低比特 LLM（W4A16、W2A16、W1A16 等）的 mpGEMM；传统反量化吃掉收益 |
| 方法 | 权重按比特分解 → 预计算激活与比特模式写入 LUT → 推理查表 + 加法，消除乘法 |
| 系统 | LUT-centric 布局、轴重排、tiling；表驻留最快片上存储；ARM TBL / x86 PSHUF 等 |
| 算法 | 表量化、镜像合并压缩表 |
| 公开结果线索 | 相对 llama.cpp 可观吞吐提升与能耗下降；多设备（M2 Ultra、树莓派等）有数据 |

> 写进作品介绍/测试报告时核对 `docs/profiling_data.md` 与论文原文，勿臆造数字。

## 映射赛题

| 赛题/案例方向 | 契合 |
|---------------|------|
| 端侧大模型 TTFT 系统级加速 | 直接 |
| 软硬件异构与 AI 任务效率 | LUT 计算范式 + 资源/功耗优势 |
| 端侧记忆调度 / 语义互联 | 高效推理为上下文/向量同步打底（复赛扩展） |
| 可落地与测试报告 | 开源 + 评测工具链齐全 |

## 本仓关键路径（实现时再细读）

| 路径 | 角色 |
|------|------|
| `python/t_mac/` | codegen / ops / intrins（LUT 构造与表查找） |
| `include/t-mac/` | C++ 封装头 |
| `deploy/` | 编译、benchmark、tuned kernels |
| `t-man/` | NPU 向扩展 |
| `docs/android.md` `docs/e2e.md` `docs/profiling_data.md` | 移植与数据 |

## 结论

主方案以 T-MAC 为计算引擎做系统服务化，是方向四在紧时间窗口下成功率最高的路径之一。
