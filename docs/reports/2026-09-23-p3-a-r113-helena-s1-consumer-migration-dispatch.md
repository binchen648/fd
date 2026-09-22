# P3-A R113 Helena S1 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-23

## Baseline

- Exact R112 FB2-53 acceptance synchronization Base: `a5f475dece21eac9d8a36a6d566e1402da6d33f9`
- Accepted FB2-53 Candidate: `c8fadf19c304a698e7f4c847e376a5ba6609c60e`
- Formal Reviewer-result evidence relay: `https://github.com/binchen648/fd/pull/431#issuecomment-5786353918`
- Prior exact revision finding evidence: `https://github.com/binchen648/fd/pull/431#issuecomment-5786025899`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration: `155/944`
- Formal remaining: `789`
- Material frozen overlap: `150/944`
- Duplicate frozen ids: `0`
- `servant.helena.skill.sc-helena-1`: absent
- `servant.helena.skill.sc-helena-3`: exactly once

This dispatch grants no migration credit. Formal accounting remains `155/944` until exact fresh independent R returns `MIGRATION_ACCEPTED` for the S Candidate and A synchronizes it.

## Exact singleton S scope

Migrate exactly one frozen identity:

- `servant.helena.skill.sc-helena-1`

No second Helena card, no runtime capability, no product registration, no pack/generated/client change.

## Frozen source and static metadata

F1 frozen source:

- owner: `servant.helena`
- card/ability id: `servant.helena.skill.sc-helena-1`
- source ability: `colonel-olcott-action`
- source document: `src/content/authoring/cards.json`
- source locator: `skillCards[31].abilities[0].printedClause`
- clause SHA-256: `abc76e38254ac8688fa7caef5392e28a7b8baa507479231db743a638e9f3fc52`
- full printed-text SHA-256: `abc76e38254ac8688fa7caef5392e28a7b8baa507479231db743a638e9f3fc52`
- exact text: `被动/行动阶段：从手牌打出一张力量基础攻击，若如此做，将一名你所在地点的对手技能区明置的一张从者技能暗置。`

Locked Reference static metadata:

- owner name: `海伦娜·布拉瓦茨基`
- class: `Caster`
- legacy skill id: `sc_helena_1`
- name: `奥尔科特上校`
- typeLabel: `被动`
- cost: `0`
- basePower: `0`
- attributes: `[]`
- legacy requirement: `0`

Use the accepted ordinary servant-skill card envelope:

- `cardType: servant_skill`
- owner `{ type: "servant", id: "servant.helena" }`
- `playTiming: { phase: "action", window: "controller_play_card_window" }`
- canonical `playRequirements: [{ type: "skill_zone_mana_at_least", value: 8 }]`

Legacy requirement `0` is evidence metadata only and does not override the final servant skill-zone 8-mana threshold.

## Accepted FB2-53 normalized ability

Fresh no-file-write whole-card probe on the R112 synchronized runtime proves `report=[]`, authoring classifier `true`, compiled classifier `true`, and automatic compiled mode for this exact normalized envelope:

- ability id `colonel-olcott-action`
- `kind: phase_action`
- exact activation `{ phase: "action", opens: "controller_action_window" }`
- empty conditions/cost/creates/ruleModifiers/lifecycle/limit/visibility
- target 1 exactly:
  - id `strength_basic_attack`
  - card instance / self hand
  - exactly one
  - sole constraint `basic_strength_attack`
- target 2 exactly:
  - id `opponent_servant_skill`
  - card instance / skill zone / controller any
  - exactly one
  - sole constraint `same_location_opponent_face_up_servant_skill`
- effect 1 exactly `play_selected_cards -> strength_basic_attack`
- effect 2 exactly `set_selected_card_face_down -> opponent_servant_skill`
- empty authoring responseWindow; compiler canonicalizes it to turn-order/decline defaults
- automatic execution

Accepted FB2-53 semantics require stage one to settle normal effect-play `playBatch` before stage two opens, with ordinary printed mana payment/play provenance. Both stages use persisted frozen decision snapshots intersected with current-live legality and exact fail-closed continuation validation. Stage two is exactly an owner-controlled face-up `servant_skill` in a same-location active opponent's skill zone and turns that physical card face-down/inactive without moving or closing it.

## Authoring / isolation requirements

Append exactly S1 to the existing `data/authoring/servants/servant.helena.json`; preserve accepted S3 byte-for-semantic content. Do not create another Helena archive.

The Helena archive remains intentionally outside `data/packs/fd-playtest-v1/pack.json`; therefore this S migration must not modify product manifest, generated playtest outputs, runtime/compiler/client source, or `data/phase3/**` inventories.

One pre-existing S3 test has a stale archive-exclusivity assertion caused solely by this authorized +1. S may modify only `packages/rules/tests/helena-consumer-migration.test.ts` so that:

- S3 is still asserted present exactly once by id;
- the S3 card is located by id rather than `raw.cards[0]`;
- all S3 F1/static metadata/runtime/lifecycle/skill-use-forbid/product-isolation assertions remain unchanged.

No other historical test modification is pre-authorized. If full CI exposes another stale absolute snapshot, stop and obtain A clarification rather than widening S scope.

## Required S evidence

S must prove at minimum:

- exact material accounting `150/944 -> 151/944`, exact +1 S1, zero removals, zero duplicate frozen ids, S3 remains exactly once;
- exact F1 clause/full-text hash and static metadata above;
- archive loads with `report=[]`; authoring and compiled FB2-53 whole-envelope classifiers return true;
- servant-skill 8-mana play requirement is preserved;
- stage-one eligible candidates are only currently playable controller-hand basic Strength attacks;
- successful stage-one selection immediately settles normal-cost effect-play before stage two;
- stage two offers only same-location active-opponent owner-controlled face-up servant skills;
- face-down mutation preserves physical identity/owner/controller/zone and does not use close semantics;
- both pending decisions enforce frozen snapshot plus current-live legality and malformed/stale/forged continuation state fails closed;
- old Helena S3 remains semantically unchanged and its product-isolation assertion still passes;
- no runtime/compiler/client/product/generated/pack diff;
- focused/affected tests, typecheck, official full CI, content validation, generated determinism, Locked Reference verify, client build, coverage/audit, and `git diff --check` pass;
- S 完成 recertification 并提交 Exact Base/Candidate.

Formal migration remains **`155/944`**, with **`789`** remaining until fresh R + A synchronization.
## A clarification after full-CI stale-snapshot discovery

S recertification on the exact dispatched Helena S1 working tree exposed one additional historical repository-wide absolute-count assertion in `packages/rules/tests/ciel-s1b-consumer-migration.test.ts`: the Ciel S1b migration test still hard-codes total frozen authoring overlap `150`, while the authorized Helena S1 singleton correctly raises current material overlap to `151`.

This is a stale repository-total snapshot only; all Ciel S1b card semantics, generated rules-only registration, S3 target behavior, hashes, product isolation, and exact-once identity assertions passed in the same full-CI run.

A therefore grants one narrow compatibility edit only:

- in `packages/rules/tests/ciel-s1b-consumer-migration.test.ts`, remove the brittle assertion that repository-wide `overlap` has absolute length `150`;
- retain `frozen.size === 944`;
- retain `duplicateFrozen === []`;
- retain exact-once assertions for Ciel S1b and Ciel S3;
- do not replace `150` with another moving absolute repository total;
- do not modify any Ciel runtime/content/generated/product semantics.

No other historical test modification is authorized. This clarification changes no migration scope, no runtime capability, no product surface, and no credit. Helena S1 Candidate accounting remains exact `150/944 -> 151/944`; formal migration remains `155/944`, with `789` remaining pending fresh R and A synchronization.