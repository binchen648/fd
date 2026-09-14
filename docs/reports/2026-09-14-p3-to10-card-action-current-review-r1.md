# P3-TO-10 Card Action Current-Lineage Independent Review r1

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-10` / scoped Card Action review
- TargetCommit: `a8682306bce4829db2436e4f8b80734834af6de4`
- Accepted TO09 runtime underneath: `9718064d54876985b46fdefc99de4477a8b75368`
- Review Branch: `codex/r-p3-to10-card-action-current-review-r1`
- Final Status: `IMPLEMENTATION_NEEDS_REVISION`

## Scope

TO10 reviews five independent Card Action contracts on the exact current lineage:

1. `PLAY` — Kiritsugu `time-alter.action`;
2. `PLAY_SOURCE_CARD_WITH_COST_RESPONSE` — Kayneth `volumen.extra-play`;
3. `ADD_TO_ATTACK` — Maiya `military.attach-support-shot`;
4. `ACTIVATE` — Olga-Marie `astronomical-science.first-loss`;
5. `CLOSE` — Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace`.

The contracts remain separate. Passing one does not grant inheritance to another.

## Findings

### [P1] Four of five scoped Card Action contracts are absent from the exact current-lineage typed runtime

Fresh source inspection of `packages/rules/src/ability/resolution-dataflow.ts` on the exact target confirms that the current lineage contains typed `play_selected_cards`, but does **not** contain typed primitives for:

```text
play_source_card
attach_card_to_player_attack
activate_card_by_id
close_source_card
```

Fresh source inspection of `packages/rules/src/ability/interpreter.ts` confirms the Time Alter PLAY structural route is present, while the other four scoped contracts are not routed into the typed data-flow runtime on this target.

Legacy interpreter cases or historical implementation reports are not current-lineage migration evidence.

### [P1] Four current-lineage Gate B/C evidence sets are missing

The exact current target contains the Time Alter PLAY regression/E2E evidence, but does not contain the accepted follow-up slice evidence files:

```text
packages/rules/tests/regression/card-action-play-source-response.test.ts
e2e/fd-volumen-extra-play-card-action.spec.ts

packages/rules/tests/regression/card-action-add-to-attack.test.ts
e2e/fd-add-to-attack-card-action.spec.ts

packages/rules/tests/regression/card-action-activate.test.ts
e2e/fd-olga-activate-card-action.spec.ts

packages/rules/tests/regression/card-action-close.test.ts
e2e/fd-artoria-alt-close-card-action.spec.ts
```

Those files exist on previously reviewed B05/B06/B07/B08 lineages, but detached historical evidence cannot be inherited into a current-lineage TO10 promotion.

## Inventory observations

Fresh reviewer inventories still report one exact eligible representative for each scoped contract.

### PLAY

```text
eligible=1
legacyPlayConsumerCount.before=1
legacyPlayConsumerCount.after=0
newRuntimeSemanticRoutedPlayCount.after=1
dualCompatiblePlayCount.after=0
```

### ADD_TO_ATTACK

```text
eligible=1
legacyAddToAttackConsumerCount.before=1
legacyAddToAttackConsumerCount.after=0
newRuntimeSemanticRoutedAddToAttackCount.after=1
dualCompatibleAddToAttackCount.after=0
```

### ACTIVATE

```text
eligible=1
legacyActivateConsumerCount.before=1
legacyActivateConsumerCount.after=0
newRuntimeSemanticRoutedActivateCount.after=1
dualCompatibleActivateCount.after=0
```

### CLOSE

```text
eligible=1
legacyCloseConsumerCount.before=1
legacyCloseConsumerCount.after=0
newRuntimeSemanticRoutedCloseCount.after=1
dualCompatibleCloseCount.after=0
```

The non-PLAY inventory claims are not backed by the exact target runtime and therefore cannot be promoted by this review.

PLAY_SOURCE is a separate exact contract documented by the B05 result/handoff: Kayneth Volumen response play with fixed `pay_mana(2)`, no target/create, face-up `play_source_card`, and source-still-in-hand server revalidation. Its historical report does not substitute for current-lineage runtime/evidence.

## PLAY Judgment

The current-lineage PLAY contract is healthy.

Fresh reviewer verification:

```text
npm.cmd run typecheck
PASS
```

Focused PLAY/compiler/data-flow set:

```text
card-action-play.test.ts
resolution-dataflow.test.ts
executable-card-pack.test.ts

3 files / 47 tests PASS
```

Fresh Chromium Gate C:

```text
e2e/fd-time-alter-core-primitive.spec.ts
1/1 PASS
```

Time Alter therefore has current-lineage Gate A/B/C candidate evidence. This partial success does not make the five-contract TO10 batch acceptable while four sibling contracts are absent.

## Historical repair references

Previously independently accepted narrow candidates are available as repair references only:

```text
B05 PLAY_SOURCE runtime: c505c4748251feb9d151f4af52f091162a64a5b6
B06 ADD_TO_ATTACK runtime: f619df5479ed733b76c096410f7ccdc700abd661
B07 ACTIVATE runtime: bd1d9ac73e42c21fb9078097313df259b2cb5738
B08 CLOSE runtime candidate: 5d34bef (exact object must be resolved before repair)
```

The repair should port only the accepted narrow semantic contracts/evidence onto the exact current lineage. It must not cherry-pick unrelated historical client/server/coverage or later B10/B11 work.

## Gate Judgment

- `PLAY`: **PASS candidate evidence** on the current lineage.
- `PLAY_SOURCE`: **FAIL / NOT PROMOTED** — typed runtime and current Gate evidence absent.
- `ADD_TO_ATTACK`: **FAIL / NOT PROMOTED** — typed runtime and current Gate evidence absent.
- `ACTIVATE`: **FAIL / NOT PROMOTED** — typed runtime and current Gate evidence absent.
- `CLOSE`: **FAIL / NOT PROMOTED** — typed runtime and current Gate evidence absent.
- TO10 aggregate: **FAIL / IMPLEMENTATION_NEEDS_REVISION**.

## Required repair

Start from the exact current lineage and preserve accepted TO08/TO09/TO11/TO12/TO13 boundaries.

Reintroduce only the four missing narrow Card Action contracts using their previously accepted implementation lines as reference:

- B05 exact Volumen response source-play;
- B06 exact Maiya add-to-attack;
- B07 exact Olga first-loss delayed activation;
- B08 exact Artoria Alter source-close.

Keep PLAY unchanged except for compatibility integration. Restore each contract's regression and browser/WS evidence on the repaired current lineage. Routing must remain semantic/structural and fail closed; no representative identity branch is allowed.

A fresh independent TO10 review is required after the repair.

## Final Judgment

`IMPLEMENTATION_NEEDS_REVISION`

Do not synchronize TO10 as accepted from this review.
