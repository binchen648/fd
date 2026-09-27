# P3-B Skadi Rune / Castle Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Date: 2026-09-27
Base: `44bf45f39c6adc2b419527f96d4257aea4080bb8`
Classification: bounded zero-credit capability/readiness prerequisite for current owner `servant.skadi`

## Why this capability is required

Mechanical source recertification for `P3-S-OWNER-SKADI-COMPLETE-MIGRATION` found that part of the three-card owner surface can reuse existing generic primitives, but five source-defined runtime seams were not expressible without new shared capability.

Source grounding was re-read from the frozen CHM-derived records (`FD全卡图鉴V2.0.chm -> 从者/魔术师/英文版/斯卡哈·斯卡蒂.htm`) and locked Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

The relevant source semantics are:

- sc-skadi-1 outpost: pay 1 mana, draw one card, then choose exactly two hand cards and shuffle them into the deck;
- sc-skadi-1 Action: pay 3 mana and derive a rune combination from attributes chosen from two distinct basic attacks played this round;
- rune `魔术+魔术`: other active players at the controller's location lose 2 mana;
- rune `迅捷+特殊`: arm a same-round combat defeat branch; the combat branch defeats the unique active opponent at the controller's battlefield and consumes the arm;
- sc-skadi-3 residual: other active players at the live source controller's location cannot gain mana;
- sc-skadi-3 outpost: choose one of 力量/迅捷/魔术/特殊; matching basic attacks at that source location have doubled base power for the current round.

The remaining observed rune effects (movement, hand attack play, deployment/terrain multiplication, +4 VP) are intentionally outside this new privileged surface because current generic primitives can encode them.

## Implemented generic seam

New generic module: `packages/rules/src/ability/source-location-rune-capability.ts`.

Bounded capability surface:

1. `controller_current_round_basic_attack_attribute_pair`
   - only 迅捷 / 魔术 / 特殊 rune attributes;
   - requires two distinct physical current-round basic attacks;
   - exact node shape only.

2. `draw_then_shuffle_two_hand_cards_into_deck`
   - accepted only as an exact `phase_action` in `advance/controller_action_window`;
   - exactly fixed controller mana cost 1;
   - draws one first, then opens a private owner-only, non-cancelable exact-2 hand-card continuation;
   - settlement revalidates controller/source/ability/revision/candidates/constraints before moving exactly two selected hand cards to deck and shuffling.

3. `adjust_other_active_players_at_source_location_mana`
   - accepted only in the exact current-round rune-pair + not-used-this-round shell;
   - exact fixed controller mana cost 3;
   - affects only other active players at the controller location and respects cross-player ability immunity;
   - the exact shell sets a this-round structured flag so the same authored rune cannot repeat in the same round.

4. `defeat_single_active_opponent_at_controller_battlefield`
   - accepted only in the exact combat action shell gated by a current-round structured arm flag plus exactly one active opponent at the controller battlefield;
   - marks the unique eligible opponent defeated for the current round and clears the arm flag.

5. `forbid_other_players_at_active_source_location_mana_gain`
   - accepted only as an exact residual `while_active` whole ability;
   - dynamically feeds the unified positive mana-gain suppression boundary for other active players at the live source controller location;
   - source close/move/inactivation changes the aura dynamically rather than persisting a stale player snapshot.

6. `set_source_location_basic_base_power_multiplier_from_choice`
   - accepted only as an active-source outpost action with an exact one-of-four attribute choice target;
   - stores a source-bound current-round `{attribute, multiplier:2, round}` record;
   - `calculateCardPower` consumes it only for active face-up basic attacks at the live source location that carry the selected attribute;
   - round expiry is implicit from exact round matching; transform/close cleanup removes the transient source record.

The loader recursively detects privileged nodes and rejects widened/nested near matches unless the entire ability matches one accepted whole-ability semantic. Runtime resolution rechecks the same whole-ability contract after compiled-pack corruption.

## R1 revision closure

Fresh independent Reviewer on predecessor Candidate `ae5647871bedf3c2fcc143975bbcd7854d8ff5aa` returned `IMPLEMENTATION_NEEDS_REVISION`. Canonical same-attempt Coordinator relay: `https://github.com/binchen648/fd/pull/466#issuecomment-5854462673`.

The two blocking findings are closed together in one successor revision:

- P1: the post-draw hand-shuffle action now requires a nonempty controller deck at authoritative activation time and rechecks the same condition before draw/continuation staging. An empty deck is illegal even if discard cards could otherwise be reshuffled by the generic draw primitive. This preserves the locked Reference legality boundary `deck nonempty -> pay 1 -> draw 1 -> shuffle exactly 2 hand cards`.
- P2: `getLegalActions` now applies existing fixed-cost affordability preflight to both accepted privileged fixed-cost phase actions: pay-1 post-draw shuffle and pay-3 same-location mana-loss rune. Direct dispatch remains fail closed because it consumes the same legal-action authority before execution.

Focused negative regression proves empty-deck, 0-mana pay-1, and 2-mana pay-3 states are not advertised and direct activation is rejected without resource/continuation mutation.

## Persistence / authority boundary

- post-draw hand-shuffle continuation metadata is private, exact-shape restore-validated, and reauthenticated at settlement;
- source-location base-power multiplier state has exact restore keys, allowed attribute, multiplier `2`, and positive safe round;
- restore additionally requires the modifier source to be a real active face-up attack-area card whose restored definition still contains the accepted source-location basic-power ability;
- malformed continuation state, malformed multiplier state, or a widened restored ability is rejected fail closed.

## Scope boundary

- `data/authoring/**` is unchanged; zero Skadi consumer authoring occurs in this task;
- no `servant.skadi`, skill-id, card-name, printed-text, Chinese-text, or `SkillLib` identity routing exists in production runtime;
- no runtime source-text parsing is added;
- no Skadi migration credit is granted by this task;
- strict formal accounting remains `134/944`, remaining `810`;
- ACCEPTED must A-sync/rescan and return to `P3-S-OWNER-SKADI-COMPLETE-MIGRATION` for all three Skadi frozen identities together. It cannot advance owners.

## Verification

Focused capability regression:

- `packages/rules/tests/regression/p3-skadi-rune-castle-readiness-capability.test.ts`: `11/11 PASS`.
- Covers exact whole-ability loader gates, current-round distinct basic-attack pair derivation, private draw/shuffle continuation, source-grounded nonempty-deck legality, pay-1/pay-3 fixed-cost legal-action affordability, same-location mana loss + once-per-round flag, armed unique-opponent defeat, dynamic source-location mana-gain aura, selected-attribute same-location base-power doubling + round expiry, tamper-resistant continuation/restore state, and runtime compiled-pack corruption.

Affected serial chain:

- `packages/rules/tests/authoring-interpreter.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/match-session.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/fm07-alter-ego-transform-authoring.test.ts`
- `packages/rules/tests/regression/battle-loss-state-transform.test.ts`
- `packages/rules/tests/regression/fb2-alter-ego-transform.test.ts`
- `packages/rules/tests/regression/p3-sitonai-readiness-capability.test.ts`
- `packages/rules/tests/regression/p3-source-skill-attack-join-capability.test.ts`
- `packages/rules/tests/regression/p3-skadi-rune-castle-readiness-capability.test.ts`

Result: `10 files / 181 tests PASS`.

Static/content gates:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged deterministic hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- Base-to-worktree `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production identity audit: zero hits for `servant.skadi`, `sc-skadi`, `斯卡哈`, `大神的睿智`, `原初之卢恩`, `通往死亡满溢的魔境之门`, `SkillLib`.

This report grants no migration credit. Freeze one exact Candidate, publish one bounded capability PR, pass the exact-Candidate Phase 3 Pre-Review Gate, then request one fresh independent R.
