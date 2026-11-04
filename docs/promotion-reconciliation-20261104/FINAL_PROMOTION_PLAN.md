# FINAL_PROMOTION_PLAN.md

## 最终候选

**本轮未创建功能 Promotion PR。** 没有一项产品 delta 同时满足：最新 main 为祖先、无重复、依赖闭合、合法写权限、当前 HEAD 行为测试、适用检查、正式独立 Review。不能把旧 Base 的累积 Candidate 直接换 Base 或打包成新 Promotion。

| PR 类型 | PR | Base SHA | Head SHA | 文件范围 | 来源 | 依赖 | Build/Test/Policy | Review | 未解项 |
|---|---|---|---|---|---|---|---|---|---|
| Runtime / Content / Master-Data / Integration | 无 | — | — | 无产品代码改动 | — | — | 未执行（无候选） | 未开始 | reservation、语义和来源证明未闭环 |

## 证据门状态

- PR 创建成功：没有创建功能 PR。
- CI 与语义正确分开判断；本轮没有候选 HEAD，因此没有新 Build/Test/Policy 结论。
- 635 条未合并作者 PR 无正式 GitHub Review；#347/#424 旧 approvals 只针对它们旧 SHA。
- 15 条 source-audit tooling/test 增量现列为 BLOCKED：缺 `data/phase3/full-roster-source-evidence-overlays.json` 且 `data/**` 禁止写入；不能单独抽取成可运行工具 PR。
- 所有 Candidate PR 必须在将来以当时重新验证的最新 origin/main 建新分支，绑定精确 Base/Head，再跑检查并取得非 Builder 的正式 Review。

## 解除条件

1. 为受保留文件取得其合法 Owner 释放或新授权。
2. 补齐语义合同、原始来源与依赖；Altera/Arthur primitive proposal、Arthur 权威来源、Abigail SC3a 原始输入按各自规定处理。
3. 对可执行增量从最新 main 重新实现，保留断言并执行真实行为测试。
4. 形成最小且依赖闭合的 PR，并获得独立 GitHub Review。
5. Phase 1/2 报告审阅确认后再开始大规模重建；完成后停止，不自动合并。

## 基线与本轮安全边界

- 基线 `e63cdeb2a065a9f87c24039d2b08bbe059513fed`，commit time `2026-11-01T00:14:47+08:00`；重新 fetch 后仍不变。
- 审计交付分支 `codex/fengling-pr-audit-delivery-20261105` 基于该 SHA 创建；本轮只改审计文档和机器账本。
- 没有更改旧 PR Base、批量 cherry-pick、合并任何 PR 或触碰 #689/#690。
