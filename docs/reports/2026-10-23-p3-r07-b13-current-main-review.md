# P3-R07 B13 Current-main Independent Review

Date: 2026-10-23 (Asia/Hong_Kong)  
Candidate: `3e3357bdd43d48b9c72ea8f4dd558ef97bc7025f`  
Exact parent/current-main base: `a42b5e1c517141b90f3407773958b0d8afe63264`  
Verdict: **MIGRATION_BLOCKED**

## Findings by severity

1. **Blocker — Gate C has no passing production browser/server evidence.** The P3-B13 handoff requires a fresh Shinji two-battlefield browser/server scenario with authoritative loss, stable battle identities, reconnect, and stale-revision rejection. `e2e/fd-shinji-battle-loss-resource.spec.ts` encodes those assertions, but the Builder reports Playwright exit 1 because Chromium is absent. This is not a Gate C pass. No browser/server execution receipt verifies that scenario on this exact Candidate.
2. **Evidence correction — focused test count is inconsistent.** The Candidate test file has nine `it(...)` cases, including the newly added duplicate-receipt negative case. The Builder report says the post-install single-file run passed eight tests, while the task handoff cites 9/9. The report should bind the exact final output or correct the count. The reported three-file compatibility run is 21/21; this review did not rerun tests.
3. **Residual coverage — scoring receipt negatives are only partly tested.** The new guard in `packages/rules/src/match-session.ts` rejects duplicate resolved battlefield IDs, duplicate receipt IDs, count mismatches, and missing expected IDs before staging events. The new test directly proves duplicate receipts; no new direct test independently exercises cardinality mismatch or an unexpected battlefield receipt. The condition itself is fail closed, but those branches remain unverified by this focused delta.

## Contract assessment

The diff is limited to `match-session.ts`, one B13 regression test, and the Builder report. It changes no inventory, coverage classifier, task index, or authoring identity. The current-main production path already resolves battlefields, applies phase scoring, checks receipts, then queues and flushes result/first-loss events. The receipt check now requires a one-to-one battlefield mapping before the post-scoring barrier opens. Server-owned `battlePhaseResolutionId`, `battleId`, `resultId`, `battlefieldId`, and controller `playerId` are staged by `MatchSession`; processed and pending-event checks guard re-entry. Focused tests cover the two-battlefield ordering, same-shape synthetic semantic classification, no-loss/no-seal cases, and repeat settlement. Olga first-loss compatibility is included in the reported 21/21 run. The typed Resource route is supported by the current-main code/test evidence; this review does not grant the Shinji identity migration or prove absence of every legacy route beyond the inspected path.

Gate A: typecheck exit 0 is reported; same-shape and near-miss focused cases are present. Gate B: 21/21 compatibility pass is reported and a two-battlefield regression exists, subject to the focused-count correction above. Gate C: **NOT_VERIFIED** because Playwright exited 1 before browser execution. The missing fresh browser/server proof is sufficient to block migration acceptance even though the Candidate's narrow hardening appears consistent with the contract.

`git diff --check HEAD^ HEAD` passed. The Reviewer worktree was clean before this report. This review does not alter Candidate/runtime code, grant migration or coverage credit, or authorize merge. No previously security-blocked command was repeated.
