# P3-B Sitonai Combination / Fimbul Capability Result

Role: Codex B
Task: `P3-B-SITONAI-COMBINATION-FIMBUL-CAPABILITY`
Classification: bounded zero-credit capability/readiness prerequisite
Base: `508050bb701d2dd2fe425dc323eca2a970ec95c1`
Date: 2026-09-27

## Boundary

This task does not migrate a Sitonai consumer and grants zero formal migration credit. It supplies only the generic clean-line runtime seams required before returning to the current formal owner `servant.sitonai` for the two remaining frozen consumers together.

`data/authoring/**` is unchanged by this task. Current-main strict formal accounting remains `132/944`; remaining `812`.

## Locked source recertification

Locked Reference was mechanically re-read at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

- The historical combination join requires exactly one active Strength-bearing attack and exactly one active Magic-bearing attack, carried by two distinct physical cards. Other active attacks that bear neither requested attribute do not invalidate the pair. The join itself pays 3 mana and moves the source from skill into the attack; existing generic cost / `move_source_card` primitives already cover that consumer action.
- The historical Fimbul action applies through the end of the next round. Unreversed source blocks ordinary card draw for every non-eliminated player; reversed source blocks positive mana gain for every non-eliminated player. The behavior is timed state and does not depend on the source remaining active after resolution.

Historical character handlers remain evidence only; this implementation contains no character/card/text routing in production rules.

## Generic capability implemented

### Exact active-attack attribute pair

Added the exact generic condition `controller_active_attacks_exact_distinct_attribute_pair`.

- It evaluates current face-up active `attack_area` cards controlled by the controller.
- Each requested attribute must have exactly one carrier.
- The two carriers must be distinct physical cards.
- Effective attributes are used, so accepted instance-local transforms remain authoritative.
- Widened condition shapes fail closed in the loader and the runtime helper independently validates the exact condition shape.

### Timed all-player resource suppression

Added the exact generic effect `suppress_all_active_players_resource_through_round` with resource `normal_card_draw` or `mana_gain` and exact `roundsAfterCurrent: 1`.

The powerful effect is admitted only inside the accepted automatic Action-phase whole-ability shell: active source, exactly one exact `source_reversed` condition (positive or negated), no targets/cost/modifiers/creates/lifecycle/limit/visibility widening, and empty automatic execution authority. Runtime execution rechecks the same whole-ability semantic before applying state.

Timed state is stored as inclusive-through-round server-owned maps keyed by player id. Restore validation authenticates map value shape and rejects keys outside the live player set. Round advancement prunes expired entries; behavioral checks also compare the inclusive round directly, so stale bytes cannot extend the effect.

Ordinary draw suppression is enforced at every current clean-line ordinary draw boundary touched by the runtime: ability interpreter `draw_cards`, typed resolution-dataflow `draw_cards`, core `drawCard`, real MatchSession round-start hand refill, and the preparation-phase draw boundary. Deck look/reveal mechanics are not treated as ordinary draws.

Timed mana suppression is consumed by the unified positive `grantMana` boundary and by the `can_adjust_mana` condition. Negative mana costs/adjustments are not blocked.

## R1 revision closure

Fresh independent R on predecessor `f2e2c8e727e2606d7d753c8ee6b164a2328cc39d` returned `IMPLEMENTATION_NEEDS_REVISION` with two bounded findings.

- Nested suppression primitives now fail closed at the whole-ability boundary: a recursive detector finds the powerful timed-suppression primitive anywhere under the enclosing effects tree, and both loader admission and runtime activation require the exact accepted top-level whole-ability semantic. A nested `branch -> then -> suppress...` regression is rejected.
- `draw_cards` validates its evaluated count before consulting timed draw suppression, so malformed negative/non-integer counts cannot become state-dependent no-ops while suppression is active. Focused regression covers the negative-count case under an active draw block.

## Focused / affected validation

- `tools\verify-toolchain.cmd` => `FD_TOOLCHAIN_OK`.
- focused bounded capability: `7/7 PASS`.
- affected serial chain: `8 files / 162 tests PASS`:
  - bounded capability 7
  - authoring interpreter 38
  - executable-card-pack 50
  - MatchSession 33
  - resolution-dataflow 15
  - MatchSession regressions 7
  - all-card-types 1
  - card-action-add-to-attack 11
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`.
- `npm run content:compile`: PASS — same summary.
- `npm run verify:generated-content`: PASS, no generated-content delta.
  - content library: `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`
- `git diff --check`: PASS.
- production identity-routing audit under `packages/rules/src`: `servant.sitonai=0`, `sc-sitonai=0`, `志度内=0`, `连携打击=0`, `冻结吧=0`, `SkillLib=0`.
- `data/authoring/**` diff: EMPTY.

## Continuation

This task is permanently zero-credit. After exact-Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronization/rescan, execution must return to `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION`. It must not advance to another owner. The subsequent formal Sitonai owner batch remains exactly sc-sitonai-1 + sc-sitonai-2; the already accepted FM07/R38 sc-sitonai-3 is preserved and receives no duplicate credit.
