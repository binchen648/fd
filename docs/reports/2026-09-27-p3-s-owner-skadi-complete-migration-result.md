# P3-S Owner Skadi Complete Migration Result

Role: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-27
Task: `P3-S-OWNER-SKADI-COMPLETE-MIGRATION`
Exact Base: `bc4304ebbde331af6e2d00c4d33a1fedde6fbf79`
Owner root: `servant.skadi`

## Formal owner scope

This owner-complete transaction migrates exactly all three current-main remaining frozen Skadi identities together:

1. `servant.skadi.skill.sc-skadi-1` — 大神的睿智
2. `servant.skadi.skill.sc-skadi-2` — 原初之卢恩
3. `servant.skadi.skill.sc-skadi-3` — 通往死亡满溢的魔境之门

No prior formal Skadi migration credit exists. Strict formal accounting remains `134/944`, remaining `810`, until this exact owner Candidate receives `MIGRATION_ACCEPTED` and the subsequent A-sync/accounting transaction completes. If accepted and synchronized, this batch contributes exactly three identities and moves the next strict target to `137/944`, remaining `807`.

## Source recertification

The frozen owner task requires source recertification before encoding. The locked Reference was mechanically re-read at exact commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, together with the frozen CHM/development source evidence `FD全卡图鉴V2.0.chm -> 从者/魔术师/英文版/斯卡哈·斯卡蒂.htm` and `Fate_Domination-开发版 -> servant.skadi/斯卡哈·斯卡蒂`.

Static/deck evidence:

- class: `Caster`;
- exact 12-card deck: `card.cardq1`, `card.cardq2`, `card.cardq2`, `card.cardq4`, `card.carda2`, `card.carda2`, `card.carda3`, `card.carda4`, `card.carda4`, `card.cardluck`, `card.cardluck`, `card.cardpreparation`;
- sc-skadi-1: `被动`, printed cost `0`, base power `0`;
- sc-skadi-2: `被动`, printed cost `0`, base power `0`;
- sc-skadi-3: `魔术/宝具`, printed/skill-zone threshold `10`, base power `0`, true-name release on declaration/play.

Mechanically recertified semantic observations:

- sc-skadi-1 outpost branch: pay 1 mana, draw one, then privately choose exactly two hand cards and shuffle them into deck; source legality requires a nonempty deck before activation;
- sc-skadi-1 Action branch: pay 3 mana and derive rune combinations from two distinct current-round basic attacks;
- `迅捷+迅捷` Raido: choose one enabled legal destination other than the current location and move through normal movement authority;
- `迅捷+魔术` Haglaz: play one legal attack from hand, paying the attack's ordinary play cost in addition to the fixed rune cost;
- `特殊+迅捷` Teiwaz: arm a same-round combat continuation; sc-skadi-2 consumes that arm when the source-defined unique-opponent battlefield condition is satisfied and applies defeat;
- `魔术+魔术` Isan: other active players at the controller's location lose 2 mana, with once-this-round gating;
- `特殊+魔术` Peorth: terrain/deployment contribution becomes x3 for the round;
- `特殊+特殊` Ansuz: controller gains 4 VP;
- sc-skadi-3 true-name release occurs on declaration;
- sc-skadi-3 residual active-source aura blocks positive mana gain for opponents at the live source location;
- sc-skadi-3 outpost Action selects one supported attribute and applies source-bound current-round x2 base power to matching basic attacks at the live source location.

Historical identity handlers `core.skadi-wisdom`, `core.skadi-runes`, and `core.skadi-castle` remain evidence only; no production identity routing is introduced.

## Accepted zero-credit prerequisites consumed

This formal migration consumes, without re-crediting, both accepted bounded prerequisites:

- PR #466 exact accepted Candidate `f807936f26d3e61dc2454a59f918de073fcfeb4f`: generic rune/castle readiness, including exact rune-pair derivation, post-draw private continuation, same-location mana loss, armed combat defeat, live source-location mana-gain suppression, and source-bound selected-attribute base-power multiplier;
- PR #467 exact accepted Candidate `b94a44ee9bf32f3fbd542df47d3a6b42d0e04876`: generic exact Raido any-enabled-location movement whole-ability contract plus loader/runtime fail-closed widening protection.

Canonical #467 same-attempt acceptance evidence is `https://github.com/binchen648/fd/pull/467#issuecomment-5855166720`. The subsequent zero-credit acceptance synchronization commit `bc4304ebbde331af6e2d00c4d33a1fedde6fbf79` is the exact Base for this formal owner batch.

A pre-capability consumer draft was preserved as local-only WIP `1c3546bb01d4d20820282f671e5045050d4b879e`. That commit is not reviewed, not pushed as a Candidate, and receives no credit. Only its two consumer files were replayed onto the new exact A-sync Base; this formal Candidate has independent Base/Candidate lineage from `bc4304eb...`.

## Implementation

`data/authoring/servants/servant.skadi.json` introduces exactly the three canonical Skadi skill cards and the source-grounded 12-card deck.

The implementation is fully generic/data-driven:

- sc1 outpost uses the accepted `draw_then_shuffle_two_hand_cards_into_deck` shell with fixed pay-1 cost;
- each sc1 rune branch uses the accepted current-round distinct basic-attack attribute-pair condition plus existing/accepted generic effects;
- Raido uses the accepted PR #467 pay-3 exact `any_enabled_location` movement shell;
- Haglaz uses generic selected hand-attack play;
- Teiwaz uses generic structured current-round player flags plus accepted unique-opponent defeat seam;
- Isan uses accepted same-location mana-loss + once-round flag shell;
- Peorth uses generic terrain multiplier;
- Ansuz uses generic VP adjustment;
- sc2 consumes the Teiwaz arm through the accepted combat defeat shell;
- sc3 uses existing true-name declaration reveal plus accepted live source-location mana suppression and source-location selected-attribute base-power multiplier shells.

No `packages/rules/src` production runtime file changes in this formal migration.

## Verification

Focused formal owner regression:

- `packages/rules/tests/regression/p3-owner-skadi-complete-migration.test.ts`: `9/9 PASS`.
- Covers exact three-card identity/static metadata/deck, privileged-shell fail-closed widening, exact 1-mana outpost continuation, all six rune mappings, Teiwaz cross-card arm/consume defeat, sc3 true-name/mana aura, and current-round castle attribute x2 base-power behavior.

Affected serial chain:

- `packages/rules/tests/regression/p3-owner-skadi-complete-migration.test.ts`
- `packages/rules/tests/regression/p3-raido-movement-readiness-capability.test.ts`
- `packages/rules/tests/regression/p3-skadi-rune-castle-readiness-capability.test.ts`
- `packages/rules/tests/regression/fb2-any-location-except-workshop-movement.test.ts`
- `packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`
- `packages/rules/tests/authoring-interpreter.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/match-session.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`

Result: `9 files / 179 tests PASS`.

Static/content gates:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS with unchanged deterministic hashes:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- Base-to-worktree `git diff --check`: PASS before Candidate freeze.

Scope/identity audit:

- Base-to-worktree `packages/rules/src` production diff: EMPTY;
- production diff identity hits: `servant.skadi=0`, `sc-skadi=0`, `斯卡哈=0`, `大神的睿智=0`, `原初之卢恩=0`, `通往死亡满溢的魔境之门=0`, `SkillLib=0`;
- canonical authoring IDs are exactly sc-skadi-1 / sc-skadi-2 / sc-skadi-3;
- authoring `phase3EvidenceBase` is exact `bc4304ebbde331af6e2d00c4d33a1fedde6fbf79`;
- sc1 evidence binds both PR #466 and PR #467 accepted seams; sc2/sc3 bind PR #466 as their actual privileged prerequisite.

## Review boundary

This report does not grant migration credit. Freeze one exact Candidate from Base `bc4304ebbde331af6e2d00c4d33a1fedde6fbf79`, push one formal owner PR, pass the exact-Candidate Phase 3 policy gate, then request one fresh independent R for the whole three-skill Skadi owner batch.

Allowed formal verdicts are `MIGRATION_ACCEPTED`, `MIGRATION_NEEDS_REVISION`, or `MIGRATION_BLOCKED`.
