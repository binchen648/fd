# P3-A03 Burn-Down Sync — Accepted P3-B06 R1

- Document Role: COVERAGE_SYNC
- Owner: Codex A
- Task: `P3-A03`
- Branch: `codex/a-p3-a03-b06-sync`
- Parent A Sync: `bfeab3a5f76bfe0f664c23df032eb60b65973fbc`
- Accepted Runtime Target: `f619df5479ed733b76c096410f7ccdc700abd661`
- R05 Evidence: `3445de4aca46b4ec1c63fcb7b7642eaaf28cb0c1`
- Status: `COVERAGE_SYNC_CANDIDATE`

## Judgment Consumed

P3-R05 independently accepted P3-B06 `CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK` for the exact Maiya representative. The accepted review includes fresh no-target, stale-target, stale-source, existing-attack, PLAY-counter separation, browser reconnect, and stale-command evidence.

Accepted representative:

- `master.maiya.skill.military#military.attach-support-shot`

## A-Owned Raw Coverage Relationship

The A-owned coverage artifact already classifies this ability as:

- `runtimeRoute = NEW_RUNTIME_SEMANTIC_ROUTED`;
- semantic route `CARD_ACTION_SEMANTICS_MINIMAL:ADD_TO_ATTACK`.

Therefore B06 acceptance must not apply another global route delta. Parent raw counts remain:

```text
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
notClassifiable=28
pilotAllowlist=0
```

The previously accepted B11 overlay remains the only accepted global adjustment not already represented in that raw baseline. Accepted aggregate counts therefore remain:

```text
newRuntimeSemanticRouted=13
legacyExecuteAbility=3
legacyResolveEffect=48
dualRuntime=0
```

## Accepted B06 Local Burn-Down

```text
legacyAddToAttackConsumerCount:            1 -> 0
newRuntimeSemanticRoutedAddToAttackCount:  0 -> 1
dualCompatibleAddToAttackCount:            1 -> 0
eligible / migrated / skipped:             1 / 1 / 6
```

The six skipped Card Action abilities remain separate contracts and do not inherit B06 acceptance.

## Accepted proof boundary

R05 accepted:

- no legal target means the action is not projected and no state is committed;
- a target that becomes inactive after activation rejects only the second dispatch while preserving the valid first-stage 2-mana commit;
- Support Shot leaving skill after activation fails closed on the second dispatch;
- attachment can coexist beside a pre-existing target attack;
- direct ADD_TO_ATTACK does not mutate normal `cardsPlayedByPlayer` or `attacksDeclaredByPlayer`;
- only the explicit Military 2-mana cost is paid; Support Shot's printed play cost is not charged because this is direct "join attack", not PLAY.

## Dependency status

B06 releases its runtime hot-file ownership after accepted review. However the next Card Action runtime tasks are **not automatically READY**:

- P3-B07 ACTIVATE: `WAIT_TRIGGER_SPEC_OR_EXPLICIT_OVERRIDE`;
- P3-B08 CLOSE: `WAIT_LIFECYCLE_SPEC_OR_EXPLICIT_OVERRIDE`;
- P3-B09 CREATE_AND_ACTIVATE: `WAIT_INVENTORY_AND_GATEWAY_SPECS`;
- P3-B10 is already review-accepted historical work (with the separately recovered replacement baseline tracked elsewhere).

A03 therefore records B06 acceptance but does not authorize bypassing those dependency gates. The next legal work must satisfy a gateway/inventory dependency or use another task explicitly marked READY.

## Ownership Boundary

This sync changes only A-owned report/artifact records. It does not touch runtime, tests, classifier rules, or reviewer judgments.

## Completion Claim

`COVERAGE_SYNC_CANDIDATE`
