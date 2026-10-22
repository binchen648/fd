# P3-R07 B13 Current-main Independent Review v4

Date: 2026-10-23 (Asia/Hong_Kong)  
Exact Candidate: `a594400105435e4e7c5267f0460333c62bba9efb`  
Exact current-main base: `a42b5e1c517141b90f3407773958b0d8afe63264`  
Verdict: **MIGRATION_ACCEPTED**, limited to P3-B13 Shinji `clown.lose-command-seal`.

## Independent execution on the exact Candidate

In this clean Reviewer checkout, `npm ci` exited 0; `npm run typecheck` exited 0; B13 focused Vitest passed **9/9**; the B13, Olga first-loss recertification, and battle-loss state-transform suite passed **21/21**; Chromium Playwright `e2e/fd-shinji-battle-loss-resource.spec.ts` passed **1/1**. These are fresh v4 Reviewer runs, not inherited Builder or historical B07 receipts. `git diff --check origin/main HEAD` passed.

## Contract assessment

The complete current-main-to-Candidate diff touches only `packages/rules/src/match-session.ts`, the B13 regression, the B13 browser test and two support fixture files, plus the Builder report. The v4 increment over reviewed `6efe9a22` changes only that browser test and report. No product server authentication, inventory, coverage, task index, authoring, or general runtime policy changed.

The production `MatchSession` resolves the enabled battlefields, applies base scoring, and then stages result and first-loss events. Its new receipt guard rejects duplicate battlefield IDs, duplicate scoring receipts, count mismatch, and missing battlefield receipts before the barrier opens. Server state determines `battlePhaseResolutionId`, `battleId`, `resultId`, `battlefieldId`, and controller-specific player facts. Pending/processed event checks and passing repeat/re-entry tests support exactly-once mutation. The semantic classifier accepts an identity-free forced `after_controller_loses_battle` trigger with one controller `adjust_command_seals` safe-integer effect; this route executes typed resolution effects. A malformed candidate shape rejects before legacy `resolveEffect`. The compatibility run includes Olga B07 first-loss timing after both scoring receipts.

The in-process fixture prepares the room in the same server process so the deferred authority seal remains valid; the browser still communicates with the actual match server over HTTP/WebSocket using a server-issued credential and a stale revision command. Gate C observes both battlefields, the phase-wide scoring barrier before result dispatch, Shinji command seals `3 -> 2`, and reload/reconnect and stale rejection without an additional seal or revision mutation. The v4 assertions capture the settled `battlePhaseResolutionId`, `battleId`, `resultId`, and `battlefieldId` and compare all four after reconnect and after stale-command rejection. The settled values are also constrained by the earlier barrier/result assertions, so the equality check cannot pass merely on four absent fields.

## Gate decision and boundaries

Gate A: PASS for scoped typecheck and semantic shape/near-miss evidence. Gate B: PASS for scoped 9/9, 21/21, two-battlefield ordering, exactly-once, and Olga compatibility evidence. Gate C: PASS for the fresh exact-Candidate Chromium browser/server scenario, including preserved battle identities across reconnect and stale rejection. The previous cross-process restore failure and the v3 missing identity assertion are resolved by the final Candidate and fresh run.

`MIGRATION_ACCEPTED` applies only to this B13 representative and its identity-free bridge. It grants no acceptance to the other TO14 consumers or broader Gate C/roster coverage. Coverage accounting and any later synchronization belong to their designated owner; this review changes no credit, code, or merge state.
