# P3-R07 B13 Current-main Independent Review v2

Date: 2026-10-23 (Asia/Hong_Kong)  
Final Builder Candidate: `20439addff5277cf31704acb58a021bc77fe9ca3`  
Current-main base: `a42b5e1c517141b90f3407773958b0d8afe63264`  
Verdict: **MIGRATION_BLOCKED**

## Findings by severity

1. **Blocker — fresh Gate C scenario did not execute.** The Builder reports `npx playwright install chromium` exit 0 and a subsequent Playwright exit 1 after the browser and repository webServer started. The initial `/rooms/:roomId/restore` returned non-2xx; `e2e/fd-shinji-battle-loss-resource.spec.ts` asserts `response.ok()` at line 95 before the two-battlefield, reconnect, and stale-command steps. Consequently none of those required production assertions passed. The report gives no HTTP status/body, so this review cannot attribute the restore failure to the fixture, server, or runtime. B13's handoff requires fresh browser/server proof and historical evidence cannot substitute.
2. **Evidence count corrected.** The final Builder report records B13 focused `9/9` and the B13/first-loss/Olga compatibility run `21/21`, matching the nine `it(...)` declarations in the B13 focused test file. It records typecheck exit 0. These are Builder receipts, not independently rerun tests in this read-only review. The report correctly makes no Gate-C pass claim.
3. **Residual negative-test gap.** The exact Candidate runtime diff strengthens the post-scoring barrier to reject duplicate battlefield IDs, duplicate scoring receipts, receipt-count mismatches, and missing battlefield receipts before result/first-loss staging. Its added direct test covers duplicate receipts. Separate count-mismatch and unexpected-receipt negative tests are not present in this Candidate, although the guard condition is fail closed on inspection.

## Gate and scope assessment

The exact main-to-Candidate diff changes only `packages/rules/src/match-session.ts`, its B13 regression test, and the Builder report. The current-main path already resolves battlefields, applies phase-wide scoring, then stages and flushes post-scoring battle/first-loss events with server-authored phase, battle, result, battlefield, and player facts. The existing focused tests exercise identity-free same-shape classification, typed resource mutation, two-battlefield ordering, no-loss/no-seal behavior, and re-entry dedupe; the reported 21/21 run includes Olga first-loss compatibility. This is relevant Gate A/B evidence, but it does not turn the failed browser run into Gate C evidence.

Gate A: reported typecheck 0 and focused semantic positives/negatives. Gate B: reported 9/9 and 21/21, with a two-battlefield unit-level proof. Gate C: **NOT_VERIFIED** because room restore failed before the production scenario reached its assertions. No Shinji migration, skill acceptance, coverage credit, or merge is approved. Diagnose the non-2xx restore response and obtain a passing fresh exact-Candidate browser/server receipt before reconsidering acceptance.

`git diff --check origin/main HEAD` passed, and the Reviewer worktree was clean before this report. This review made no code, Candidate, inventory, coverage, or task-index change and reran no security-blocked command.
