# P3-S Owner Sitonai Complete Migration Result

Role: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-27
Task: `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION`
Exact Base: `3748e7341ecdfd26ccd56bbde75fbd6502e1f233`
Owner root: `servant.sitonai`

## Formal owner scope

This owner-complete transaction migrates exactly the two current-main remaining frozen Sitonai identities together:

1. `servant.sitonai.skill.sc-sitonai-1` — 连携打击
2. `servant.sitonai.skill.sc-sitonai-2` — 冻结吧，天上的诸力

`servant.sitonai.skill.sc-sitonai-3` — 他人格（Alter Ego Class） was independently migration-accepted in FM07/R38. Its canonical JSON object is preserved byte-for-value at the semantic object level and it receives no duplicate credit in this batch.

Strict formal accounting remains `132/944`, remaining `812`, until this exact owner Candidate receives `MIGRATION_ACCEPTED` and the subsequent A-sync/accounting transaction completes. If accepted and synchronized, this batch contributes exactly two identities and the next strict target is `134/944`, remaining `810`.

## Source recertification

The frozen inventory and owner task require source recertification for sc-sitonai-1/sc-sitonai-2. Before encoding, the locked Reference was mechanically re-read at exact commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, together with the frozen confirmed source overrides grounded to `FD全卡图鉴V2.0.chm -> 从者/他人格/英文版/志度内.htm` and the development image `Fate_Domination-开发版/images/servants/志度内.png`.

The locked static metadata is:

- sc-sitonai-1: 力量/魔术, printed cost `1`, base power `5`, skill-zone threshold `8`;
- sc-sitonai-2: 魔术/宝具, printed cost `5`, base power `7`, skill-zone threshold `8`, true-name release on declaration.

The locked semantic behavior recertifies:

- sc-sitonai-1 reversal: an active reversed source grants the controller `+4 VP` after the controller wins that battle;
- sc-sitonai-1 combination join: during the controller Action phase, if active attacks contain exactly one Strength carrier and exactly one Magic carrier on two distinct physical cards, the controller may pay `3 mana` to join the owned skill-zone source to the attack;
- attack join is not ordinary card play: the physical source becomes public/face-up/active in the attack area, ordinary paid play cost remains zero, no ordinary play trigger/count is created, and join does not forge current-round play provenance;
- sc-sitonai-2 true-name release is declared on use;
- sc-sitonai-2 unreversed Action branch suppresses ordinary card draws for all active/non-eliminated players through the end of the next round;
- sc-sitonai-2 reversed Action branch instead suppresses positive mana gain for all active/non-eliminated players through the end of the next round.

Historical identity handlers `core.sitonai-combination-attack` and `core.sitonai-pohjola-fimbul` remain evidence only. No production identity-keyed routing is introduced.

## Accepted generic prerequisites consumed

This formal migration consumes, without re-crediting, the two already accepted zero-credit Sitonai prerequisite seams:

- PR #463 / exact accepted Candidate `8789fcad58867b999a9d713b83342f602fa3f775`: exact distinct active-attack attribute-pair condition plus source-reversal-driven timed global draw/mana suppression through next round;
- PR #464 / exact accepted Candidate `c68bfe1246c06a2a0f67728d5539a3710a355933`: generic source-owned skill-zone card attack join with server-side ownership/state/cost validation and non-play provenance preservation.

The #464 same-attempt canonical Coordinator relay is `https://github.com/binchen648/fd/pull/464#issuecomment-5853397996`; its A-sync/rescan is exact Base `3748e7341ecdfd26ccd56bbde75fbd6502e1f233` for this formal owner batch.

## Implementation

`data/authoring/servants/servant.sitonai.json` now contains all three canonical Sitonai skill cards. Only sc-sitonai-1 and sc-sitonai-2 are new formal identities in this transaction.

The consumer authoring is entirely generic/data-driven:

- `sc-sitonai-1.combination-join` uses the accepted exact attribute-pair condition, fixed `pay_mana: 3`, and `join_source_skill_card_to_attack` shell;
- `sc-sitonai-1.reversed-win-vp` uses the generic `after_controller_wins_battle` trigger, physical `source_reversed` condition, and generic controller `adjust_victory_points +4`;
- `sc-sitonai-2.true-name-release` uses the existing declaration-reveal contract;
- `sc-sitonai-2.freeze-draw` uses the accepted unreversed timed `normal_card_draw` suppression shell;
- `sc-sitonai-2.freeze-mana-gain` uses the accepted reversed timed `mana_gain` suppression shell.

No `packages/rules/src` production runtime file changes in this formal migration.

The historical FM07 regression formerly required every accepted Alter Ego owner archive to remain permanently one-card/minimal. Owner-complete migration legitimately expands the Sitonai archive. That assertion is updated to protect the exact ten authorized FM07 identities and each selected card's locked static/evidence contract without forbidding later owner-complete sibling additions. All other FM07 transform assertions remain unchanged and pass.

## Verification

Focused formal owner test:

- `packages/rules/tests/regression/p3-owner-sitonai-complete-migration.test.ts`: `6/6 PASS`.
- Covers exact sc1/sc2 static metadata and sc3 presence, privileged-shell fail-closed widening, exact distinct Strength/Magic join + 3 mana + non-play provenance, reversed-win +4 VP, sc2 true-name release, and unreversed/reversed through-next-round draw/mana suppression expiry.

Owner/prerequisite/sc3 chain:

- Sitonai formal owner + #463 readiness + #464 attack-join + FM07 Alter Ego transform: `4 files / 24 tests PASS`.

Affected serial chain:

- `packages/rules/tests/authoring-interpreter.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/match-session.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/regression/p3-sitonai-readiness-capability.test.ts`
- `packages/rules/tests/regression/p3-source-skill-attack-join-capability.test.ts`
- `packages/rules/tests/fm07-alter-ego-transform-authoring.test.ts`
- `packages/rules/tests/regression/p3-owner-sitonai-complete-migration.test.ts`

Result: `8 files / 160 tests PASS`.

Static/content gates:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same summary;
- `npm run verify:generated-content`: PASS, deterministic hashes unchanged:
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- Base-to-worktree `git diff --check`: PASS before staging; a final cached diff-check is required before Candidate freeze.

Scope/identity audit:

- Base-to-worktree `packages/rules/src` production diff: EMPTY;
- production diff identity hits: `servant.sitonai=0`, `sc-sitonai=0`, `志度内=0`, `连携打击=0`, `冻结吧=0`, `SkillLib=0`;
- sc-sitonai-3 current JSON object versus exact Base object: deep-equal `true`.

## Review boundary

This report does not grant migration credit. Freeze one exact Candidate from Base `3748e7341ecdfd26ccd56bbde75fbd6502e1f233`, push one formal owner PR, pass the exact-Candidate Phase 3 policy gate, then request one fresh independent R for the whole remaining Sitonai owner batch.

Allowed formal verdicts are `MIGRATION_ACCEPTED`, `MIGRATION_NEEDS_REVISION`, or `MIGRATION_BLOCKED`.
