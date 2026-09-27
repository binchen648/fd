# P3 A Lineage-Bound Evidence Sync

本次同步修复的是 promotion lineage，不是运行时实现。

新的 A evidence commit 直接建立在已通过 Reviewer B 审查的 candidate 上，因此其父提交可由 Git 复算为该 candidate 的 direct parent。此前的 A sync commit 不再用于 promotion，因为它与 accepted candidate 不在同一条 descendant 链上。

本次只保留已授权的三个 setup consumer 状态：`REVIEWER_ACCEPTED_CANDIDATE`。它们的 legacy fallback 记录为 `CLOSED`，Gate C 仍为 `NOT_VERIFIED`，且没有标记为 `PROMOTED_ON_MAIN`。

本次 before/after consumer counts 相同，所有 delta 为零。历史的 consumer transition 单独记录为历史字段，不作为本次 burn-down 或 main coverage credit。92 ability 正式分母不变，main credit delta 为零。

## Review Boundary

- Reviewer B 的 PASS 绑定到已接受 candidate 及其 reviewer artifact SHA。
- Reviewer A 必须针对本次新的 A sync commit 重新审查；旧的 Reviewer A 身份不能复用。
- 本提交不创建 promotion PR，不声明 merge，不修改 runtime，不改变任何非授权 ability。

## Result

状态：`READY_FOR_REVIEW`

下一步：由 Reviewer A 对本提交执行 exact lineage、artifact hash、zero-credit 与 scope 检查；通过后再交回 Integration Owner。
