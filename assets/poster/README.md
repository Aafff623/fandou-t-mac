# Phase 1 · 海报

文件：`poster-phase1.png`（约 256 KB，单页长版海报）

## 用途

初赛提交可选用（`docs/agents/deliver.md` 中初赛阶段 1/2/3 必选，海报属附加材料）。复赛 / 总决赛现场常用。

## 来源

按对话产出的高级 prompt 喂 GPT-2-image 生成。prompt 见 `docs/agents/` 历史会话输出（本仓未入库历史对话）。

## 元素覆盖

- 顶部品牌条：FANDOU-T-MAC · 翻斗花园 / 鸿蒙高校创新赛 · 方向四
- 主标题：比特级查找表驱动的端侧大模型系统加速
- 四层架构：L1 应用层 → L2 感知与调度 → L3 系统服务层 → L4 计算核心
- 对照与验证侧栏：llama.cpp 基线、关键指标、测试报告
- 三栏优势卡片：感知→调度→加速闭环 / 用户态 SystemAbility / 低线程稳定吞吐
- 数据条：22.08 / 8.03 / 5.9× 与公开 profiling 来源标注
- 页脚：翻斗花园 · 中北大学 / LUT-SA / 指导专家占位

## 编辑与重导

海报由 GPT-2-image 出图后人工对齐。下次重做：

1. 复用同一 prompt，调整版式 / 数据
2. 关键数字务必替换为本仓 `docs/profiling_data.md` 与本队实测数据
3. 落盘时保持同名 `poster-phase1.png` 或按版本号 `poster-phase1-v2.png`
4. 引用方：`docs/output/report/phase1-work-intro.md` / `phase1-design.md`