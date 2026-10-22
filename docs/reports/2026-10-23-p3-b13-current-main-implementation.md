# P3-B13 Current-main Implementation Report

Date: 2026-10-23 (Asia/Hong_Kong)
Task: `P3-B13`
Branch: `codex/b-p3-b13-current-main-20261023`
Exact Base: `a42b5e1c517141b90f3407773958b0d8afe63264`

## Scope

This Builder pass audited and verified the B13 Shinji
`clown.lose-command-seal` battle-loss Resource slice already present on the
exact current main, then added one narrow current-main hardening for duplicate
scoring receipts. The implementation is confined to the task contract:
phase-wide post-scoring barrier, server-authored battle/result facts, typed
forced-trigger Resource routing, stable first-loss ordering, and exactly-once
re-entry safeguards. No old branch or old Candidate was copied into this
branch.

Current-main source paths inspected:

- `packages/rules/src/match-session.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`

Current-main focused proofs are already present in:

- `packages/rules/tests/regression/battle-loss-resource-trigger.test.ts`
- `e2e/fd-shinji-battle-loss-resource.spec.ts`

Builder delta in this Candidate:

- `packages/rules/src/match-session.ts`: reject duplicate or cardinality-mismatched
  scoring receipts before opening the post-scoring barrier.
- `packages/rules/tests/regression/battle-loss-resource-trigger.test.ts`: add a
  focused duplicate-receipt negative proof.
- `e2e/fd-shinji-battle-loss-resource.spec.ts`: create the target host room
  first, bind the generated snapshot host credential to that room's
  `clientId`/`reconnectToken`, and send both credentials in the restore request.

No coverage/classifier, inventory, generated registry, task-index, Gate/credit,
other consumer, or authoring identity was changed. No PR was created or
merged.

## Verified contract points

- `queuePostScoringBattleEvents` requires every resolved battlefield to have a
  scoring receipt before staging result/first-loss events.
- Stable `battlePhaseResolutionId`, `battleId`, `resultId`, and `battlefieldId`
  facts are staged by the server-owned MatchSession path.
- Result events are queued behind the scoring barrier and flushed once;
  processed-event and pending-queue checks prevent re-entry duplication.
- `isBattleLossResourceTriggerSemantic` is identity-free and rejects trigger,
  effect-count, and non-integer near misses in the focused regression.
- Shinji loss routes through the typed `adjust_command_seals` Resource path;
  no-loss, zero-seal, stale/re-entry, and Olga/TO10 compatibility behavior are
  covered by the existing current-main regression set.

## Execution receipts

1. `npm ci` — exit `0` (workspace dependencies installed; npm reported audit
   warnings only).
2. `npm run typecheck` — exit `0`.
3. Initial focused command before dependency installation,
   `npm exec vitest run packages/rules/tests/regression/battle-loss-resource-trigger.test.ts` — exit `1`, startup could not resolve `vitest/config`.
4. After `npm ci`, the same focused command — exit `0`: `1` file / `9` tests
   passed.
5. Compatibility focused command `npm exec vitest run packages/rules/tests/regression/battle-loss-resource-trigger.test.ts packages/rules/tests/regression/battle-first-loss-delayed-activation-recert.test.ts packages/rules/tests/regression/battle-loss-state-transform.test.ts` — exit `0`: `3` files / `21` tests passed, including Olga first-loss recertification.
6. With Chromium installed by `npx playwright install chromium` under the
   requested proxy (`npx playwright install chromium` — exit `0`),
   `npx playwright test e2e/fd-shinji-battle-loss-resource.spec.ts -c playwright.config.ts`
   reached the browser and repository webServer but exited `1`: the initial
   `/rooms/:roomId/restore` response was HTTP `400` with body
   `{\"code\":\"bad_request\",\"message\":\"Invalid or missing deferred runtime state authority\"}`.
   The host-room credential mismatch is repaired; the remaining failure is the
   cross-process deferred-runtime authority seal, so the test stopped before
   the two-battlefield, reconnect, and stale-command assertions. No Gate-C or
   E2E pass is claimed.

The earlier `npm exec playwright ...` form exited `1` with npm `EUSAGE`; it was
corrected to `npx playwright ...`. The corrected run's restore failure is the
authoritative E2E receipt above.

## Disposition

`IMPLEMENTATION_COMPLETE_CANDIDATE` for the current-main B13 implementation
scope. Independent Reviewer acceptance has not yet been received. This report makes no
migration-credit, skill-acceptance, Gate-C, merge, or release-readiness claim.
The browser/server E2E remains unverified because room restore failed on the
deferred-runtime authority seal before the scenario assertions.
