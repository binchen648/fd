# P3-R07 B13 Current-main Independent Review v3

Date: 2026-10-23 (Asia/Hong_Kong)  
Exact Candidate: `6efe9a22f109bf05ce03364e05afebc61fcdba1d`  
Exact base: `origin/main=a42b5e1c517141b90f3407773958b0d8afe63264`  
Verdict: **MIGRATION_BLOCKED**

## Independent execution

In this clean Reviewer checkout, `npm ci` exited 0, `npm run typecheck` exited 0, the B13 focused Vitest file passed **9/9**, and the B13 + Olga first-loss + battle-loss state-transform files passed **21/21**. The exact Chromium command `npx playwright test e2e/fd-shinji-battle-loss-resource.spec.ts -c playwright.config.ts` exited 0 with **1/1** passing. These are fresh runs on `6efe9a22`, not inherited historical receipts. `git diff --check origin/main HEAD` passed.

## Contract findings

The main-to-Candidate diff is confined to the B13 runtime guard, B13 regression, B13 browser scenario and support fixture, and implementation report. No inventory, coverage, task-index, authoring, general server authentication, or shared persistence file changed. The new fixture creates and prepares a `MatchRoom` inside its serving process, avoiding the rejected cross-process deferred-authority restore. The browser still connects to the actual server over HTTP/WebSocket with a server-issued credential, and sends a stale revision command through the authenticated socket. The fixture does not add a product authentication bypass.

The production `MatchSession` path scores resolved battlefields before staging result/first-loss events. Its guard rejects duplicate resolved battlefield IDs, duplicate scoring receipt IDs, count mismatch, and missing battlefield receipt before opening the barrier. It constructs `battlePhaseResolutionId`, `battleId`, `resultId`, `battlefieldId`, and authoritative player-specific first-loss data from server state. Pending/processed event guards and the passing re-entry tests support exactly-once settlement. The classifier is identity-free for the claimed forced-trigger / `after_controller_loses_battle` / one controller `adjust_command_seals` integer-effect shape; that semantic route uses typed resolution effects. A malformed candidate shape is rejected before the legacy `resolveEffect` path. The reported and independently rerun compatibility suite includes Olga B07 first-loss recertification.

The passing browser test proves two battlefields appear, the barrier log precedes result dispatch, its receipt lists both battlefields, Shinji seals move `3 -> 2`, reload preserves seals and revision, and a stale command is rejected without another seal/revision mutation. **One exact Gate C requirement remains unproven:** the P3-B13 handoff requires reconnect to preserve the same battle identities. The test checks `battleId`/`resultId` in the settled projection before reload, but after reload it checks only revision and command seals; it never compares post-reconnect `battleId`/`resultId` or the battle log identities to the settled values. Stable identity construction and unit evidence make the behavior plausible, but they are not the required fresh browser assertion. The stale-command check likewise does not compare identities after rejection.

## Gate decision and residual risk

Gate A: PASS for the scoped typecheck and semantic focused evidence. Gate B: PASS for the scoped 9/9 and 21/21 unit/regression evidence. Gate C: browser execution PASS, but **contract coverage incomplete** for identity preservation across reconnect/stale replay. This is an evidence gap, not a demonstrated runtime defect. Add direct post-reconnect and post-stale identity equality assertions to the fresh browser scenario and obtain a passing exact-Candidate receipt before requesting `MIGRATION_ACCEPTED`. This review grants no skill acceptance, migration/coverage credit, or merge authorization.
