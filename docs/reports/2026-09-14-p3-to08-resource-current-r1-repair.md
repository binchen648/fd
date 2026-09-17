# P3-TO-08 Resource Numeric Current-Lineage r1 Repair

- Document Role: `IMPLEMENTATION_RESULT`
- Task: `P3-TO-08` / `RESOURCE_NUMERIC_CORE_DIRECT_ACTION`
- Base integrated commit: `b63376ca0ebc3fc005405a385e6f1b438b6295c1`
- Prior independent review: `8f3e834caa70a2f4b6c4df7ba9faa23ffd34b73c` / `IMPLEMENTATION_NEEDS_REVISION`
- Branch: `codex/b-p3-to08-resource-current-r1`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Review blocker repaired

The prior reviewer proved that the current integrated lineage accepted a Resource `activate_ability` command with no `expectedRevision`, allowing Gatou command-spell state to mutate from mana 8 / command seals 3 to mana 12 / command seals 2.

The repair restores the authoritative room CAS boundary for **every** `MatchRoomHub.dispatchCommand` invocation:

```text
dispatchCommand
-> assertExpectedRevision(..., required=true)
-> only then dispatch to MatchRoom / MatchSession / ability runtime
```

This intentionally keeps the TypeScript Hub parameter optional so negative tests can submit a missing revision directly. Runtime authority, not client typing, owns the rejection.

No Resource primitive, authoring card, semantic classifier, coverage classifier, taxonomy rule, or TO13 interaction semantic was changed.

## Added evidence

### Resource room boundary

`packages/rules/tests/regression/resource-numeric-room-boundary.test.ts` proves:

- missing revision rejects with `missing_expected_revision`;
- stale revision rejects;
- both failures preserve revision, mana, command seals, logs, replay, replay snapshots, and room version;
- the current authoritative revision still succeeds and performs the canonical 8 -> 12 mana / 3 -> 2 command-seal mutation.

### Browser / WebSocket Gate C

`e2e/fd-command-spell-resource-core.spec.ts` now sends a raw `client:dispatch_command` with the same canonical command payload but **without** `expectedRevision` after reconnect.

The real server must return:

```text
server:error
code=command_failed
message contains missing_expected_revision
```

The browser then verifies mana and command seals remain unchanged before running the existing stale-revision replay check.

## Fresh verification

```text
npm.cmd run typecheck
PASS

focused:
resolution-dataflow
resource-numeric-core-direct-action
resource-numeric-room-boundary
interaction-room-boundary
executable-card-pack
5 files / 47 tests PASS

npm.cmd test --workspace @fd/server -- --run
1 file / 2 tests PASS

Resource Chromium Gate C:
fd-command-spell-resource-core.spec.ts --repeat-each=5
5/5 PASS

TO13 Interaction Chromium compatibility:
fd-private-optional-interaction.spec.ts --repeat-each=3
3/3 PASS
```

Resource inventory remains:

```text
sourceFiles=14
resourceNumericAbilities=17
eligible=3
migrated=3
blocked=8
special=6
skipped=14
legacyResourceConsumerCount.before=3
legacyResourceConsumerCount.after=0
newRuntimeSemanticRoutedCount.after=3
dualCompatibleCount.after=0
remainingSkippedCount.after=14
```

Root suite:

```text
100 files total
90 passed / 10 failed
611 tests total
591 passed / 20 failed
```

All 20 failures remain the inherited local CHM/original-image source-asset absence class already present before this repair. No Resource Numeric, room revision, TO13 interaction, MatchSession, compiler, or E2E test is in the failure set.

`git diff --check`: PASS.

## Scope boundary

This candidate repairs only the current-lineage Resource Gate C revision regression and its evidence gap. It does not claim:

- migration of the 14 skipped Resource Numeric consumers;
- Trigger, Battle, Interaction, Movement, Result Binding, Lifecycle, Modifier, or Special subsystem inheritance;
- automatic acceptance of historical detached `b1a1dc8` evidence;
- Gate A/B/C promotion without a new fresh independent review;
- any A-owned global coverage/taxonomy update.

## Required next step

Run a fresh independent reviewer from the exact r1 candidate SHA. The reviewer must independently reprobe missing and stale revision behavior, rerun the three Resource representatives' Gate A/B evidence, and rerun browser/WS reconnect + missing/stale revision Gate C evidence before any promotion.
