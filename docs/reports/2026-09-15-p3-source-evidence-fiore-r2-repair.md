# Phase 3 Full-Roster Source Evidence — Fiore R2 Repair

- Date: 2026-09-15
- Role: Codex S
- Parent S candidate: `23bdad59e8cf08dd301816559ccdda493bded281`
- R1 rejection: `fcd8148`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: repair Fiore Determination source-semantic/dependency shape only; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE_R2`

## R1 blocker closure

`master.fiore.skill.s6` now represents the printed clause `此牌超越时，选择一名战果高于你的对手。` through the existing canonical structural vocabulary:

```text
kind=triggered
trigger=cycle_state.entered
condition=event_definition_is(master.fiore.skill.s6)
effect=choose_players
minCount=1
maxCount=1
relation=opponent
condition=victory_points_greater_than_controller
payloadKey=targetPlayerId
```

The reviewed-special `cycle_state_transition` remains responsible only for binding the selected target to the Transcend pair state. It does not hide the ordinary trigger/selection dependencies anymore.

Regenerated s6 axes now expose:

```text
trigger:
  combat.resolved
  cycle_state.entered
condition:
  EVENT_DEFINITION_IS
  EVENT_OPPONENT_MATCHES_BOUND_TARGET
  EVENT_PLAYER_WON_COMBAT
target:
  CHOOSE_ONE_PLAYER
interaction:
  CHOOSE_ONE_PLAYER
binding:
  payload:targetPlayerId
```

Its capability membership now includes:

```text
GENERIC_BATTLE_INTEGRATION
GENERIC_CONDITION_EVALUATION
GENERIC_LIFECYCLE_POLICY
GENERIC_PENDING_INTERACTION
GENERIC_RESOURCE_NUMERIC
GENERIC_RESULT_BINDING
GENERIC_TARGET_SELECTION
GENERIC_TRIGGER_GATEWAY
REVIEWED_SPECIAL_HANDLER
```

It remains `SPECIAL_HANDLER_CANDIDATE` with `SPECIAL_EFFECT:cycle_state_transition` and inherits zero current runtime acceptance contracts.

No Fiore identity branch or new mapper primitive was added; the repair uses the existing `choose_players` and event-trigger normalization rules.

## Burn-down

R2 changes dependency shape only. Candidate totals remain:

```text
sourceGroundedCount=129
semanticBlockedCount=815
structuredAbilityCount=210
contractMappedCount=129
explicitBlockCount=815
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=93
SPECIAL_HANDLER_CANDIDATE=36
SOURCE_EVIDENCE_REQUIRED=815
```

## Verification

```text
FS03 / FS04 / FS05 regeneration                      PASS
npm run typecheck                                    PASS
Phase 3 Reference/full-roster suite                  6 files / 61 tests PASS
master.fiore.skill.s6 target axis                    CHOOSE_ONE_PLAYER
master.fiore.skill.s6 interaction axis               CHOOSE_ONE_PLAYER
master.fiore.skill.s6 cycle entry trigger            PRESENT
master.fiore.skill.s6 inherited contracts            0
git diff --check                                     PASS
production paths under packages/ or apps/            NONE
```

## Non-promotion

This repair does not implement Fiore runtime behavior and does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, migration acceptance, or full-roster closure. A must independently recompute the repaired artifacts and fresh R must close the R1 finding before `129 / 815` becomes an accepted F1 checkpoint.
