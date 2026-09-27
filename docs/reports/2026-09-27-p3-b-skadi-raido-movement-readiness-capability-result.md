# P3-B Skadi Raido Movement Readiness Capability Result

Role: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Date: 2026-09-27
Task: `P3-B-SKADI-RAIDO-MOVEMENT-READINESS-CAPABILITY`
Exact Base: `abda8c845133bd12bce47f624808a3ead9d95510`
Classification: bounded zero-credit capability/readiness prerequisite for current owner `servant.skadi`

## Why this capability is required

After PR #466 was accepted and A-synchronized, formal owner-complete Skadi consumer encoding resumed from exact Base `abda8c845133bd12bce47f624808a3ead9d95510`.

Mechanical locked-Reference/source recertification and the first formal owner focused run proved eight of nine source-defined owner scenarios executable through already accepted/existing generic seams. The sole blocker was Raido (`迅捷+迅捷`): locked Reference requires the pay-3 Action rune to move the controller to any other enabled legal location.

The generic `move_player` effect and `any_enabled_location` target already support the actual move, occupancy, movement locks, disabled locations, current-location exclusion, movement history, and normal movement events. The missing seam was the exact whole-ability gateway. Existing FB2-09 deliberately recognizes Action any-location movement and fails closed unless it matches the legacy free active-source `any_enabled_location + not workshop` contract. The source-grounded Raido shell therefore compiled as generic authoring but was correctly rejected at runtime as a near match.

This task adds only the missing generic whole-ability semantic. It does not add Skadi consumer authoring and grants no migration credit.

The in-progress formal consumer work was preserved before this capability task as local-only WIP commit `1c3546bb01d4d20820282f671e5045050d4b879e` on `codex/s-p3-owner-skadi-complete-migration-r2`. That WIP is not pushed, not a Candidate, not reviewed, and earns no credit. After this capability is ACCEPTED and A-synchronized, execution must return to the same Skadi owner on a fresh formal Base and carry forward the preserved consumer work.

## Source-grounded exact semantic

Locked Reference exact commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

The observed Raido contract is:

- Action phase / controller action window;
- rune combination derived from two distinct current-round basic attacks;
- exact selected pair `迅捷 + 迅捷`;
- fixed controller mana cost `3`;
- choose exactly one enabled legal destination different from the current location;
- move the controller through the normal typed movement path;
- existing occupancy/movement-lock/disabled-location authority remains in force.

No card/servant identity is part of the runtime semantic.

## Implementation

`packages/rules/src/ability/source-location-rune-capability.ts` adds an identity-free classifier for Action any-enabled-location movement plus two accepted whole-ability semantics:

1. the existing legacy FB2-09 free active-source `any_enabled_location + not workshop` shape, represented in the shared loader gateway so loader/runtime agree;
2. the new exact rune movement shape: one exact current-round distinct `迅捷/迅捷` basic-attack pair condition, one fixed pay-3 controller mana cost, one exact single `any_enabled_location` destination target, and one exact controller `move_player` effect.

Candidate detection is intentionally broader than acceptance. Action location-movement candidates enter the loader gateway when they either carry `any_enabled_location` or retain the Raido rune-pair + mana-cost signature, so removing/replacing the required selector cannot evade the gateway; only one of the two exact whole-ability contracts is accepted.

`packages/rules/src/ability/loader.ts` now fails malformed movement candidates closed before runtime construction. This is stricter than the older FB2-09 regression, which previously allowed one malformed near-match through the loader solely to prove runtime rejection. That regression is updated to assert the stronger loader rejection while preserving its legal movement coverage.

`packages/rules/src/ability/interpreter.ts` recognizes the exact rune movement contract consistently at every relevant authority boundary:

- discovery structural gate;
- mandatory target availability;
- authoritative fixed-cost affordability preflight;
- exact movement resolution branch;
- server-side execution corruption recheck;
- typed direct-action/data-flow normalization route.

The normal generic movement implementation remains unchanged.

## R1 revision closure

Fresh independent R on predecessor Candidate `eb06cac542e6bd1cb54eacaaa0cc4ec6a18c444a` returned one exact-scope blocker. Canonical same-attempt Coordinator relay: `https://github.com/binchen648/fd/pull/467#issuecomment-5855009517`.

- R1 P1 CLOSED: removing or replacing the required `any_enabled_location` selector no longer drops an otherwise Raido-shaped Action movement shell out of the loader candidate class. The detector now also recognizes the identity-free rune-pair + mana-cost movement signature, while exact whole-ability acceptance still requires the original single `any_enabled_location` target. Therefore widened target near-matches are rejected by the loader instead of bypassing it.
- Runtime remains fail closed after compiled-pack corruption: removing the selector from an already compiled pack cannot complete movement, cannot spend mana, cannot change location, and cannot leave a pending decision.
- The legacy FB2-09 free active-source `any_enabled_location + not workshop` contract remains unchanged and is still covered by its regression suite; ordinary arrow movement is not routed into the new Raido candidate path.

## Scope boundary

- `data/authoring/**` delta: EMPTY;
- no Skadi consumer migration occurs in this task;
- no `servant.skadi`, `sc-skadi`, Skadi card name, Chinese printed text, or `SkillLib` identity routing is introduced in production runtime;
- no runtime source-text parsing;
- no new movement effect primitive;
- no change to ordinary arrow movement;
- existing FB2-09 free any-location-except-workshop movement remains accepted and behaviorally covered;
- formal accounting remains `134/944`, remaining `810`.

## Verification

Focused generic regression:

- `packages/rules/tests/regression/p3-raido-movement-readiness-capability.test.ts`: `4/4 PASS`.
- Exact contract loads and moves at exactly 3 mana.
- Current location is excluded from destination candidates.
- 2 mana is not advertised and direct dispatch is rejected without mana/location/continuation mutation.
- wrong cost, extra condition, missing/replaced/extra target selector, widened effect, and wrong rune pair fail closed at the loader gateway.
- compiled-pack corruption, including removal of the required selector, fails closed at runtime.

Affected serial chain:

- `packages/rules/tests/regression/p3-raido-movement-readiness-capability.test.ts`
- `packages/rules/tests/regression/fb2-any-location-except-workshop-movement.test.ts`
- `packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`
- `packages/rules/tests/regression/p3-skadi-rune-castle-readiness-capability.test.ts`
- `packages/rules/tests/authoring-interpreter.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/match-session.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`

Result: `8 files / 170 tests PASS`.

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

## Continuation

Freeze exactly one Candidate from Base `abda8c845133bd12bce47f624808a3ead9d95510`, publish one bounded zero-credit PR, pass exact-Candidate Phase 3 Pre-Review Gate, then request one fresh independent R.

Allowed verdicts: `IMPLEMENTATION_ACCEPTED_CANDIDATE` or `IMPLEMENTATION_NEEDS_REVISION`.

If ACCEPTED: A-sync/rescan and return immediately to `P3-S-OWNER-SKADI-COMPLETE-MIGRATION` for all three Skadi identities together. Do not advance owners and do not credit this capability.
