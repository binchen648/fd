# P3-R07 B13 Battle Loss Resource Independent Review

- Date: 2026-09-14
- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-R07`
- TargetCommit: `37189b32d4de0da3a8eabdca8edbf674c8852d97`
- TargetBranch: `codex/b-p3-b13-battle-loss-resource-r1`
- ReviewBranch: `codex/r-p3-b13-battle-loss-resource-r1-review`
- Candidate Parent / A-owned handoff: `5fe59b00cdb483fa80ad7ba48dc5a0a3967df721`
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking B13 finding remains on the exact frozen candidate.

The review did not inherit acceptance from TO14 specification, TO08 Resource, historical B07/Olga evidence, or the implementation-side test run. A fresh worktree was created from the exact candidate and installed its own workspace dependencies; `@fd/rules` and `@fd/content` resolved to the reviewer worktree itself.

## Scope Judgment

B13 migrates exactly the semantic form:

```text
forced_trigger
+ after_controller_loses_battle
+ no conditions/targets/cost/creates/rule modifiers
+ no lifecycle/limit/response opens
+ exactly one controller adjust_command_seals integer effect
```

The representative is Shinji `clown.lose-command-seal`, but fresh production-diff inspection from `5fe59b0` to `37189b3` found no Shinji, Olga, representative card, or representative ability identity routing in rules production source.

The other TO14 battle-integration rows receive no migration or Gate inheritance from this review.

## Semantic Routing / Legacy Bypass

Fresh source inspection confirms:

- `isBattleLossResourceTriggerSemantic()` is structural and identity-free;
- exact supported shapes route through `executeResolutionEffects()`;
- malformed battle-loss-resource candidates are rejected fail-closed;
- the supported path does not fall through to legacy `resolveEffect`;
- zero command seals are rejected at ability eligibility for this forced semantic route, preserving the generic typed Resource primitive's underflow protection.

The focused regression also proves a renamed synthetic same-shape ability routes while wrong trigger, extra effect, and fractional amount near-misses do not.

Judgment: **PASS**.

## Phase-Wide Post-Scoring Barrier

The reviewer ran an independent temporary adversarial probe in addition to the committed candidate tests. The probe instrumented the real `MatchSession` record boundary and observed the exact transition state.

Result:

```json
{
  "twoScoringReceiptsBeforeBarrier": true,
  "barrierIndex": 20,
  "resultDispatchIndex": 21,
  "commandSeals": 2,
  "resourceEventCount": 1,
  "stableIds": [
    {
      "battleId": "battle-phase:1:battle:miyama_town:1",
      "resultId": "battle-phase:1:battle:miyama_town:1:result"
    },
    {
      "battleId": "battle-phase:1:battle:shinto:2",
      "resultId": "battle-phase:1:battle:shinto:2:result"
    }
  ],
  "reentryNoDuplicate": true,
  "forgedFrozenParticipantRejected": true
}
```

At the moment the post-scoring barrier opened, both battlefield scoring receipts were already committed and Shinji still had 3 command seals. At the Miyama result dispatch record, the typed battle-loss effect had then changed the resource to 2. This closes the early-settlement defect independently of single-battle evidence.

The same probe verified a forged frozen-participant event cannot grant an eliminated nonparticipant battle-trigger eligibility.

Judgment: **PASS**.

## Exactly-Once / Stable Identity

Fresh tests and the independent probe confirm:

- server-owned `battlePhaseResolutionId`, `battleId`, and `resultId` are stable;
- replaying/re-entering the same battle phase does not spend another command seal;
- duplicate stable result events do not mutate the resource twice;
- reconnect and stale command handling do not duplicate the mutation;
- an eliminated controller remains eligible only for the frozen battle event in which that controller actually participated.

Judgment: **PASS**.

## TO10 / B07 Olga Compatibility

Fresh focused tests preserve authoritative first-loss history and ordinal semantics. First-loss settlement is now behind the scoring barrier, while the delayed Trismegistus activation still occurs at formal round end.

Fresh Chromium Olga evidence also passed.

Judgment: **PASS**.

## Gate A / B

Fresh reviewer runs:

```text
npm.cmd run typecheck
PASS
```

B13/Olga/core focused set:

```text
5 files / 65 tests PASS
```

Current-lineage compatibility set covering Resource, Card Zone, Card Action, Trigger, Lifecycle, Interaction, room/session, Golden Flow 2 and complex session regressions:

```text
16 files / 145 tests PASS
```

`git diff --check`: PASS.

Judgment: **Gate A PASS / Gate B PASS**.

## Gate C

Fresh reviewer Chromium run:

```text
e2e/fd-olga-activate-card-action.spec.ts PASS
e2e/fd-shinji-battle-loss-resource.spec.ts PASS
2/2 PASS
```

The Shinji scenario covers the real remote room/server path, two-battlefield scoring barrier, command seals `3 -> 2`, reconnect, stale revision rejection and no duplicate settlement. The Olga scenario independently protects the accepted first-loss/round-end continuation.

Judgment: **Gate C PASS**.

## Full Root Baseline

Fresh reviewer run:

```text
npx.cmd vitest run --testTimeout=15000
Test files: 97 passed / 10 failed / 107 total
Tests:      644 passed / 20 failed / 664 total
```

All 20 failures reproduce the inherited source-evidence environment class: unavailable CHM/original-image paths. No deterministic B13 runtime, compiler, game-loop, room, projection, reconnect, Trigger or Resource failure was introduced.

The accepted TO10 current-lineage baseline was `636 PASS / 20 inherited FAIL`; B13 therefore contributes `+8 PASS / +0 new deterministic failures`.

## Final Judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

P3-B13 target `37189b32d4de0da3a8eabdca8edbf674c8852d97` is accepted for its exact one-representative Battle -> Trigger -> Resource slice.

A03 may now synchronize this accepted evidence. No sibling TO14 consumer, TO15 Modifier/Power row, or broad Battle family is promoted by this judgment.
