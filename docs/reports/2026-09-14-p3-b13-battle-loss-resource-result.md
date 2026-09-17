# P3-B13 Battle Loss Resource Trigger Runtime Result

- Date: 2026-09-14
- Task: `P3-B13`
- Owner: Codex B
- Branch: `codex/b-p3-b13-battle-loss-resource-r1`
- Dispatch/Handoff commit: `5fe59b00cdb483fa80ad7ba48dc5a0a3967df721`
- Current-lineage runtime base before B13: `64dbd16927fc9df4a03b235d2e882534fb8b659e`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Independent reviewer required: `P3-R07`

## Exact Scope

B13 migrates exactly one TO14 direct battle-result consumer:

```text
archive: master.shinji
card: master.shinji.skill.clown
ability: clown.lose-command-seal
kind: forced_trigger
trigger: after_controller_loses_battle
effect: adjust_command_seals(-1)
```

The production route is semantic rather than identity-based. No production routing branch in the B13 diff references Shinji, Olga, representative card IDs, or representative ability IDs.

B13 does not claim migration or Gate status for the other TO14 battle-integration rows.

## Runtime Changes

### Phase-wide post-scoring barrier

The previous production order allowed `resolveBattlefield()` to dispatch `after_battle_result_determined` immediately, which could settle result/win/loss consumers before all battlefield base scoring completed.

B13 changes the authoritative order to:

1. resolve all supported battlefields;
2. commit base scoring for the resolved battlefield set;
3. verify/record the post-scoring barrier;
4. dispatch stable battle-result events through Trigger Gateway;
5. settle controller win/loss and authoritative first-loss continuations;
6. continue cleanup/round-end only after pending post-battle work is terminal.

The same ordering is connected to both production battle entry paths:

- `MatchSession.resolveBattlePhase()`;
- core `stepGameLoop()` battle flow.

### Stable server-owned battle identities

Battle-derived post-scoring events now carry server-authored:

- `battlePhaseResolutionId`;
- `battleId`;
- `resultId`;
- `battlefieldId`;
- frozen `battleParticipantIds`.

`MatchSession` additionally records post-scoring barrier and dispatch trace entries. Reconnect/projection does not create new identities or re-run the resource mutation.

### Frozen participant eligibility after scoring

A real production-path test exposed an ordering edge case: base scoring may eliminate the losing controller before Trigger Gateway discovers the loss trigger. B13 therefore preserves the frozen participant set on the authoritative battle event. An eliminated controller remains eligible only for the stable battle-scoped event in which that controller actually participated. Ordinary non-battle events remain restricted to active controllers.

### Winner/loss-effect separation

B13 adds `lossEffectSuppressedPlayerIds` to the authoritative battle result so three concepts remain distinct:

- winner eligibility;
- winner/loser outcome;
- loss-effect suppression.

A participant can be a loser even when military delta is zero; a reviewed suppression such as Luck can suppress loss effects without erasing the loser/outcome fact.

### Typed Shinji resource route

The supported semantic classifier requires:

```text
forced_trigger
+ after_controller_loses_battle
+ no conditions/targets/cost/creates/rule modifiers
+ no lifecycle/limit/response opens
+ exactly one adjust_command_seals effect
+ controller/default resource target
+ integer amount
```

The exact shape routes through `executeResolutionEffects()` and the typed Resource primitive. A renamed synthetic same-shape ability classifies successfully. Near-miss shapes are rejected/out of scope. No supported B13 path falls back to legacy `resolveEffect`.

At zero command seals the forced loss effect is a semantic no-op: it does not call the underflowing primitive and does not make the whole battle settlement fail. The generic Resource primitive itself remains fail-closed for invalid underflow.

### TO10/B07 first-loss compatibility

First-loss production remains based on authoritative MatchSession battle history and ordinal `1`, but is now queued behind the post-scoring barrier. A later loss does not stage a second first-loss activation. Olga's delayed Trismegistus activation still occurs at formal round end.

## Gate A / B Evidence

- `npm.cmd run typecheck`: PASS.
- B13 focused regression: `8/8 PASS`.
- B13 + Olga focused compatibility: `15/15 PASS` during the eliminated-controller repair cycle.
- Accepted current-lineage compatibility set: `16 files / 130/130 PASS` before the final core-game-loop compatibility bridge.
- Final core/authoring/battle compatibility set after that bridge: `5 files / 58/58 PASS`.
- `git diff --check`: PASS.
- Production-diff representative-ID scan: no Shinji/Olga/representative ability identity routing.

The B13 regression covers:

- identity-free classifier and near-miss negatives;
- standalone battlefield resolution not settling result triggers before scoring;
- two-battlefield post-scoring barrier;
- typed command seal `3 -> 2`;
- scoring-eliminated controller retaining only frozen battle-event eligibility;
- no-loss negative path;
- zero-seal no-op;
- stable-event deduplication;
- battle-phase re-entry exactly-once behavior.

## Gate C Candidate Evidence

Fresh final Chromium run:

```text
e2e/fd-olga-activate-card-action.spec.ts: PASS
e2e/fd-shinji-battle-loss-resource.spec.ts: PASS
2/2 PASS
```

The new Shinji browser/server scenario proves:

- a real remote `MatchRoom` production path;
- two resolved battlefields;
- post-scoring barrier before Shinji result-trigger settlement;
- command seals `3 -> 2` through the authoritative loss event;
- stable `battlePhaseResolutionId / battleId / resultId` trace;
- reconnect preserves the same settled value/revision;
- stale revision is rejected;
- stale/reconnect activity does not duplicate the command-seal loss.

The fresh Olga scenario proves the accepted B07 first-loss/round-end activation path still works after B13.

## Full Baseline

Latest root test run with `--testTimeout=15000`:

```text
Test files: 97 passed / 10 failed / 107 total
Tests:      644 passed / 20 failed / 664 total
```

All 20 failures are inherited source-evidence environment failures involving unavailable CHM/original-image paths. No B13 runtime/compiler/room/game-loop failure remains.

The accepted TO10 current-lineage baseline was `636 PASS / 20 inherited FAIL`. B13 therefore adds `+8 PASS` with `+0` new deterministic failures.

## Residual / Explicitly Out Of Scope

B13 does not promote:

- the other direct TO14 result consumers;
- `after_battle_ended` phase-terminal consumers;
- a complete generic Battle Result / Scoring envelope;
- no-eligible-winner policy;
- broad Battle Power/Modifier migration;
- Hidden Information, Interaction, Movement, Lifecycle, or Special subsystem work;
- global coverage/KPI classification.

Global Phase 3 coverage synchronization remains Codex A-owned and may occur only after fresh P3-R07 acceptance of the exact frozen B13 candidate SHA.
