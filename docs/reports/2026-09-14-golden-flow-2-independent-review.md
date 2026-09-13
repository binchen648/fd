# Golden Flow 2 Independent Review — Current Baseline

- Reviewer: Codex R
- Date: 2026-09-14
- Reviewed baseline: `1f9e1e536ae251b61ec806359289256f8c44c977`
- Original implementer report: `docs/reports/2026-09-07-golden-flow-2-combat-power-winner-vp-result.md`
- Review mode: fresh worktree, no runtime fixes
- Verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Gate promotion: none

## Decision

Golden Flow 2 cannot be independently promoted on the current reachable repository state.

The current core battle/scoring fragments remain reproducible, but the named Golden Flow 2 Gate B/C evidence claimed by the implementer report is not present in reachable Git history, and the current server command-chain required by the report does not typecheck or pass its stale-revision test.

```text
Gate A fragments: PASS
Gate B named Golden Flow 2 evidence: MISSING
Gate C named Golden Flow 2 evidence: MISSING
Current server command chain: BROKEN
Final: IMPLEMENTATION_NEEDS_REVISION
E2E_VERIFIED: NO
```

## Fresh Tests

### Current rules/core evidence

```text
npx vitest run
  packages/rules/tests/core/combat-resolver.test.ts
  packages/rules/tests/core/scoring-resolver.test.ts
  packages/rules/tests/regression/battle-winner-conformance.test.ts
  packages/rules/tests/match-session.test.ts

PASS: 4 files / 43 tests
```

This preserves useful Gate A and generic MatchSession evidence, but it is not the named Golden Flow 2 scenario from the report.

### Current client bridge

```text
apps/client:
npx vitest --config vitest.config.ts --run src/state/engine-bridge.test.ts

PASS: 1 file / 5 tests
```

The tied-winner projection bridge still has component evidence.

### Current server test

```text
apps/server:
npx vitest --config vitest.config.ts --run src/match-server.test.ts

FAIL: 1 of 2 tests
```

Failure:

```text
expected 'hub.endTurn is not a function' to contain 'Stale command revision'
```

The current server handler still contains an end-turn branch, but the protocol/hub API no longer supplies the compatible command/method shape.

### Current typecheck

```text
npm.cmd run typecheck

FAIL
```

Relevant errors:

```text
match-server.ts: client:end_turn comparison has no overlap
Property 'endTurn' does not exist on MatchRoomHub
expectedRevision unavailable on current protocol union
hub.dispatchAbilityCommand signature mismatch
```

This is a current production-contract blocker, not merely missing documentation.

## [P1] Named Golden Flow 2 Gate B/C Evidence Is Not Reachable

The implementer report claims these named evidence files:

```text
packages/rules/tests/regression/golden-flow-2-combat-power-winner-vp.test.ts
e2e/fd-golden-flow-2-combat-power-winner-vp.spec.ts
e2e/support/build-golden-flow-2-snapshot.ts
```

All three are absent from the current checkout.

Independent `git log --all -- <path>` finds no reachable history for any of those paths. The 2026-09-07 result report itself entered this repository later in documentation commit `459709a`; it therefore cannot substitute for executable evidence.

Required repair:

- recreate a named current rules/MatchSession Golden Flow 2 regression from the documented contract;
- recreate a browser/server Gate C path or equivalent named current evidence;
- ensure the evidence is committed and independently reproducible.

## [P1] Server End-Turn / Revision Contract Is Internally Inconsistent

The report's claimed production chain is:

```text
client:end_turn
-> expectedRevision validation
-> MatchRoomHub/MatchRoom end-turn
-> MatchSession priority/flow advance
-> combat/scoring
-> projection
```

Current code does not satisfy that chain:

- server handler references `client:end_turn`;
- current protocol union does not include that message shape;
- current `MatchRoomHub` has no compatible `endTurn` method;
- dispatch-command expectedRevision signatures are inconsistent;
- current typecheck fails.

Required repair:

- restore one authoritative protocol/hub/server command contract;
- reject stale revision before mutation;
- do not create a second battle/scoring owner;
- add focused server tests for accepted and stale command paths.

## Gate Boundary

Current passing component tests are not sufficient to promote Golden Flow 2 to `E2E_VERIFIED` because the acceptance plan explicitly requires the real client/server/revalidation/projection/reconnect chain.

No Gate A/B/C status is promoted by this review.

## Safe Repair Scope

A repair may touch the Golden Flow 2 transport/evidence surface without touching the currently occupied B11 ability hot files:

- `packages/rules/src/match-room-protocol.ts`
- `packages/rules/src/match-room-hub.ts`
- server transport/tests
- focused Golden Flow 2 regression/E2E/support files
- scoped report

It must not modify or discard the dirty `fd-b11-repair1` ability-runtime changes.
