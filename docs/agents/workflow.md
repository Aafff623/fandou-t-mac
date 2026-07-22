# Workflow

日常业务流（init Gate 通过后）：

```
GitHub Issue
  → docs/output/report/ (调研，可选)
  → docs/output/prd/prd.md (draft → approved)
  → 实施（Issue 跟踪）→ awaiting-review【停】
  → 通过 → commit / commit-history / archive
```

不使用业务 theme 子目录；产出直接落在 `docs/output/report/`、`docs/output/prd/`。  
**Handoff 停用**（不以 `docs/output/handoff/` 交接）。

## 规则

- PRD 未批准不写功能代码
- Review 先于 commit
- 任务与状态以 GitHub Issues + labels 为准（见 `triage-labels.md`）

## Bug 流

发现 Bug → 诊断（根因 + 复现）→ GitHub Issue → 修复 → Review → commit（`Closes #N`）
