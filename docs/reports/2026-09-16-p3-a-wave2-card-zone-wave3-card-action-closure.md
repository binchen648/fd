# P3-A Wave 2 Card Zone / Wave 3 Card Action Closure

Date: 2026-09-16
Role: A
Status: DEPENDENCY_SEQUENCE_CLOSED_FOR_NEXT_GATEWAY
Runtime baseline: `e0f1a40b1e66c64df78f32e98791018475829af3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Wave 2 Card Zone judgment

The F1 `GENERIC_CARD_ZONE` request contains 121 identities. After FB2-06/07 and prior accepted Card Zone work, only one identity has `GENERIC_CARD_ZONE` as its sole requested capability: `master.waver.skill.s2`. That exact direct shape is the FB2-06 accepted `advance/outpost + pay 1 Mana + draw 2` route.

All remaining Card Zone identities retain at least one independent parent capability or reviewed-special dependency. The largest residual Move/Return surfaces are heterogeneous and dependency-bound:

- `move_matching_cards`: 18 identities / 19 rows; every identity has another parent capability;
- `move_selected_cards`: 11 identities / 11 distinct shapes; every identity has Target/Binding/Lifecycle/Trigger/Battle/Special or another parent dependency;
- `return_card_by_definition`: common create-if-missing shape proves only 8 unique overlay skill IDs, and mixes Return with Card Create semantics;
- source-card removal: 12 identities are component-aligned under accepted FB2-07, but complete migration readiness added is 0.

A therefore closes the independent Wave-2 Card Zone lane without inventing low-value generic movement primitives. Residual rows are explicitly deferred to their actual parent owners.

## Wave 3 Card Action judgment

F1 request counts:

- `CARD_ACTION_PLAY`: 46
- `CARD_ACTION_CLOSE`: 19
- `CARD_ACTION_ACTIVATE`: 10
- `CARD_ACTION_ADD_TO_ATTACK`: 8
- `CARD_ACTION_CREATE_AND_ACTIVATE`: 2

No identity in any of these five request sets depends on that Card Action capability alone. Existing current-lineage accepted TO10/TO13 contracts already provide the narrow reusable PLAY / PLAY_SOURCE / ADD_TO_ATTACK / ACTIVATE / CLOSE / private optional hand-play primitives. Remaining rows are composition/dependency problems rather than evidence that a new broad Card Action engine is required.

The most important composition is a 14-identity servant family. Each source-grounded overlay has the same two clauses:

1. source played together with a face-up controller basic attack -> draw 1;
2. action ability -> optionally play up to three controller-hand cards with base power at most 3.

TO13 already accepts the identity-free private optional hand-play half. The draw primitive is typed, but the source-play trigger half has not received a narrow runtime Gate acceptance. That trigger is now the next dependency-ordered gateway slice.

## F4 consequence

P3-FM01 remains undispatched at this closure point. No Wave-2/3 component count is treated as migration readiness. The next legal attempt to open F4 is the exact 14-identity source-play/basic-attack/draw trigger family in P3-FB2-08, followed by independent R25 and an A-owned post-acceptance dependency check.
