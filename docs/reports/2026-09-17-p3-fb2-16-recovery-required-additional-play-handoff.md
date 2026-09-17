# P3-FB2-16 Recovery Required Additional-Play Marker Handoff

Date: 2026-09-17
Role: Codex A
Status: `READY_FOR_B2_RECOVERY`

## Pins

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`
- Accepted FB2-15 recovery candidate: `23a666913a3050ad55d781e3f5b3a1518add4c3e`
- FM09 fresh S blocker: `9c6e38b33de1f1d6f090e9c644d0ab66dbbee4e7`
- FM09 blocker synchronization / coordinator base: `5b50f1ad0b6054c84dd1bb2d65ddfba7fbfd81ea`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Historical downstream FB2-16 material is planning evidence only. This handoff is a fresh dispatch on the integrated recovery lineage and carries no inherited implementation or review acceptance.

## Why this is the next dependency contract

FM09 remains blocked because its twelve provisioning target definitions are not registered. One direct non-frozen dependency is `card.derived.master.shirou-emiya.ganjiang-moye`. Locked Reference independently confirms its stable ID, owner `master.shirou-emiya`, cost `1`, requirement `8`, base power `5`, type `力量/宝具`, and printed rule `投影-此牌需追加打出。`.

Current canonical authoring already contains a product representative for the same narrow rule boundary: `master.maiya.deck.support-shot` carries a passive `append_only_rule` with printed clause `此牌需追加打出。`.

The final game rules are explicit:

- §9.4: regular play normally plays exactly two attack cards in one batch and pays face-up costs atomically;
- §9.6: cards marked required/allowed additional play are played and paid in the same regular-play batch but do not count toward the normal two-card quantity;
- §9.6: additional-play cards have no global count limit, subject to their own legality/cost conditions;
- effect-extra plays are a separate semantic route.

This task owns only the **required additional-play marker**. It does not materialize Shirou's derived card, any FM09 source/target identity, or any other frozen skill.

## Fresh current-line gap

At coordinator base `5b50f1a...`, the gap is independently visible in current product/runtime code:

1. Canonical Maiya Support Shot is `cardType=master_skill`, cost `2`, has the exact passive `append_only_rule`, and is currently compiled as `playKind=support`, `destinationZone=field`.
2. `playFailure()` rejects every `append_only_rule` except the unrelated explicit foreign rule `ignore_battle_loss_effects` with reason `append_only`.
3. `playBatch()` calls `playFailure()` for every batch member, so a required-additional card cannot currently join an otherwise legal regular batch.
4. `playBatch()` counts all attack-area choices against `attackPlayAllowance`; it has no required-additional quota exemption.
5. Staged legal actions and `stage_attack_card` also route through `playFailure()`, so a required-additional card cannot be appended to an in-progress regular attack batch.
6. No shared `requiredAdditional...` structural helper exists in current rules source.

Thus current behavior implements only “cannot be played standalone”; it does not implement the rulebook's required “may accompany regular play without consuming the normal regular-card allowance.”

## Exact recovery contract

B2 may add one identity-free exact structural predicate for the **required additional-play marker**. Compiler and runtime must use the same predicate.

The accepted shape must distinguish the bare required marker

```text
kind=passive
activation.trigger=while_active
effects=[{ type: append_only_rule }]
execution.mode=automatic
```

from foreign `append_only_rule` nodes carrying an explicit unrelated `rule` field, including current `basic.luck` / `ignore_battle_loss_effects`.

For a definition carrying the exact required marker:

1. Direct standalone `play_card` remains illegal with the existing append-only rejection.
2. The executable compiler classifies it as regular-play attack/`attack_area` even when storage `cardType` is `master_skill`.
3. A regular play batch may include one or more required-additional cards only as additions to an otherwise legal regular batch.
4. Required-additional cards do not consume `attackPlayAllowance` and do not increase `attacksDeclaredThisRound`.
5. They still count in `cardsPlayedThisRound`, pay face-up mana cost in the same aggregate pre-payment, move/activate atomically with the batch, and appear in the same played-card event evidence.
6. Staged regular-play flow may add required-additional cards after an ordinary attack has been staged and confirm the combined batch atomically.
7. Required-additional-only batches remain illegal.
8. Duplicate cards, insufficient aggregate mana, invalid zone/controller/timing, malformed marker shape, stale staged state, or any other rejected batch condition fail closed without partial mutation.
9. Effect-play routes remain separate and do not gain required-additional legality from this contract.
10. Existing explicit extra-regular-play allowances remain separate: Sieg's accepted `extra_attack_play_allowance_if_mana_at_least` changes the number of normal regular attacks and must not be reinterpreted as append-only quota.

## Explicit exclusions

Do not fold any of these into FB2-16 recovery:

- optional/conditional “may be additional” permissions;
- temporary extra-play grants or per-round extra regular-play allowances;
- Riding/effect-play or `play_selected_cards` / `play_source_card` semantics;
- Sieg's `extra_attack_play_allowance_if_mana_at_least` contract;
- card-specific additional-play conditions such as Goetia/Sasaki/Tezcat variants;
- foreign `append_only_rule` shapes with another explicit `rule`, including `ignore_battle_loss_effects`;
- Shirou derived-card registration, any support-definition materialization, FM09 retry, authoring migration, taxonomy/KPI promotion, or broad PLAY/ACTIVATE acceptance.

No card ID, owner/name, printed text, Reference handler, or target-definition allowlist may appear in the production classifier/runtime path.

## Required evidence

Focused evidence must prove at minimum:

- exact structural marker acceptance independent of identity and rejection of malformed/foreign-rule markers;
- direct standalone play still rejected;
- canonical `2 ordinary attacks + 1 required-additional card` regular batch succeeds;
- multiple required-additional cards can accompany one legal regular batch without consuming normal attack allowance;
- `attacksDeclaredThisRound` advances only for ordinary attacks while `cardsPlayedThisRound` includes additional cards;
- aggregate mana includes required-additional costs and insufficient total mana rolls back the entire batch;
- staged flow can append a required-additional card to an in-progress regular attack batch and confirm atomically;
- required-additional-only batch and effect-play route fail closed;
- existing explicit extra-regular-play allowance remains separate;
- current Maiya attachment semantics, ordinary two-card play, source/effect-play regressions, FB2-14 rule overrides, and FB2-15 provisioning remain green;
- generated content determinism remains exact if the executable product classification changes.

## Sequence

1. Fresh B2 implements only this narrow runtime/compiler boundary.
2. Fresh process-separated R42 reviews the exact candidate, review-only.
3. If R42 accepts, fresh A synchronizes the runtime boundary.
4. Only then may A plan a separate non-credit support-definition task for `card.derived.master.shirou-emiya.ganjiang-moye`.
5. FM09 remains blocked until all twelve direct targets and any transitive dependencies are legitimately registered.

FB2-16 recovery takes zero migration credit. Accepted current-main overlap remains `111/944` throughout this runtime gate.
