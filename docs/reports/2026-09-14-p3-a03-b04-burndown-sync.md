# P3-A03 Burn-Down Sync — Accepted P3-B04

- Document Role: COVERAGE_SYNC
- Owner: Codex A
- Task: `P3-A03`
- Branch: `codex/a-p3-a03-b04-sync`
- Parent A Sync: `2262c609100d8a2a6c236628c1e31dedee14a593`
- Accepted Runtime Target: `56376bea590eda20d3c7d9ad359df1cabf4371d1`
- R04 Evidence: `1cecb7c8864f023f05c63402a3332eac912b0f71`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Judgment Consumed

P3-R04 independently accepted the clean P3-B04 `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` candidate after the original mixed-role commit was repacked. The accepted representative is:

- `master.kiritsugu.skill.time-alter#time-alter.action`

R04 recorded Gate A/B/C evidence as passing for this exact PLAY semantic shape. This acceptance does not extend to Kayneth response play, Maiya add-to-attack/append-only, Olga activation, Artoria Alter close, Drake hidden/private play, or general action-phase card play.

## A-Owned Raw Coverage Relationship

The corrected A automation baseline already counted Time Alter as a semantic new-runtime route before R04 promotion. The raw A counts carried by the parent sync are:

```text
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
```

Therefore B04 acceptance must **not** apply another global `new +1 / legacy -1` overlay. Doing so would double-count Time Alter.

The prior accepted B11 overlay remains:

```text
newRuntimeSemanticRouted=13
legacyExecuteAbility=3
legacyResolveEffect=48
dualRuntime=0
```

After B04 synchronization these accepted aggregate counts remain unchanged.

## Accepted B04 Local Burn-Down

R04 accepted the following scoped PLAY transition:

```text
legacyPlayConsumerCount:            1 -> 0
newRuntimeSemanticRoutedPlayCount:  0 -> 1
dualCompatiblePlayCount:            1 -> 0
eligible / migrated / skipped:      1 / 1 / 6
```

This local transition is now accepted evidence rather than implementer-only evidence.

## Candidate History

Rejected/superseded packaging:

- original B04 `628238a696d9adfdbfb3a3c404871a8405a6ff8d`;
- first R04 review `98aa785` returned `IMPLEMENTATION_NEEDS_REVISION` because that commit mixed B runtime with A-owned coverage/matrix/plan changes.

Accepted replacement:

- clean B04 r1 `56376bea590eda20d3c7d9ad359df1cabf4371d1`;
- fresh R04 r1 evidence `1cecb7c8864f023f05c63402a3332eac912b0f71`;
- runtime semantics were unchanged; only role/PR boundaries were repaired.

## Accepted / Rejected / Pending

Accepted:

- Time Alter exact PLAY semantic route, Gate A/B/C scoped representative evidence.
- Local PLAY burn-down `legacy 1->0`, `new 0->1`, `dual 1->0`.

Rejected/superseded:

- the mixed-role packaging of original candidate `628238a`.

Pending:

- six other Card Action abilities remain on their separately scoped contracts.
- no Trigger/Lifecycle/Interaction runtime inheritance is allowed.
- full-roster migration and Phase 3 completion remain open.

## Dependency Changes

R04 acceptance satisfies the review dependency that gates the next Card Action slices.

Newly dispatchable from the current task index:

- `P3-B05` — `CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE` (`READY_AFTER_P3_R04`).

`P3-B06` remains conditional on the task's `READY_AFTER_P3_R04_OR_COORDINATOR` rule and runtime hot-file ownership. Other gateway-dependent runtime tasks remain blocked by their own contracts.

## Ownership Boundary

This P3-A03 sync changes only A-owned evidence/report artifacts. It does not edit runtime, implementation tests, semantic classifier rules, or Gate judgment.

## Completion Claim

`COVERAGE_SYNC_CANDIDATE`
