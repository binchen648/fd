# P3-A R82 Amakusa s1 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Formal baseline

- Exact A acceptance-sync Base: `00edec31096190985a2e98f359c923a3ad913964`
- Accepted FB2-39 Candidate beneath this sync: `3ca21ec1c20cc7d6689b3fef6c28f982bb4ff93c`
- FB2-39 reviewer evidence: `https://github.com/binchen648/fd/pull/389#issuecomment-5747497720`
- Formal migration accepted: `142/944`
- Formal remaining: `802`
- Branch-local frozen overlap: `137/944`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

FB2-39 is synchronized capability infrastructure only and received zero migration credit.

## Exact migration identity

Migrate exactly one frozen consumer:

- `master.amakusa.skill.s1`
- owner: `master.amakusa`
- owner type/class: `master` / `Master`
- owner name: `天草四郎`
- skill name: `教则`
- legacy id: `s1`
- static metadata: type label `被动`, cost `0`, base power `0`, attributes `[]`, no legacy play requirement

Frozen F1 printed evidence:

- full printed text: `游戏开始时，你是【红队领袖】，你后置位的那名玩家成为【神仆】。`
- full printed-text SHA-256: `7eab2353f1342bcc8cf643a44d16c9bdf923f8c66ffa993059334ff37766c320`
- source-grounded clause: `游戏开始时，你是【红队领袖】，你后置位的那名玩家成为【神仆】`
- clause source: `src/content/authoring/cards.json#skillCards[49].abilities[0].printedClause`
- clause SHA-256: `0bef7042f91686e4653ddb4d8ed0bfb6dff4d37cbe32de201aeb84e5ebaa4b1f`
- semantic axes: trigger `game.started`, condition `SOURCE_OWNED`, effect `ADD_STATUS`; no cost, target-selection interaction, lifecycle, modifier, visibility, binding, or battle axis.

Locked Reference whole-card material confirms exactly three status assignments:

1. controller receives `role:red-team-leader`;
2. exact circular next active/non-eliminated player receives `role:god-servant`;
3. the same next player receives `history:god-servant`.

The Reference `event_type_is/game.started` envelope is evidence only. Current authoring must normalize onto the accepted authoritative `game_start` activation and must not introduce a generic `event_type_is` runtime seam.

## Zero-gap re-overlay proof

A constructed the complete normalized card in a temporary read-only probe over the synchronized FB2-39 runtime, then removed the probe. The exact normalized ability used:

- `kind: forced_trigger`;
- `activation: { trigger: "game_start" }`;
- exact conditions `[{ type: "source_owned" }]`;
- the three exact `add_status` effects listed above;
- empty targets/cost/creates/ruleModifiers/lifecycle/limit/visibility;
- automatic execution with exact `allowedOperations: []`.

Mechanical loader result:

- `report = []`;
- card mode `automatic`;
- `isGameStartPlayerStatusAssignmentSemantic(...) = true`.

Therefore `master.amakusa.skill.s1` is now `S_READY_NOW`. Under migration-credit-first, no unrelated B2/runtime work is allowed before this singleton migration completes its fresh R cycle.

## S scope

Fresh S must create exactly one standalone archive:

- `data/authoring/masters/master.amakusa.json`

The archive must contain only `master.amakusa.skill.s1`, preserving the exact F1 text/hashes and Reference static metadata while using only accepted FB2-39 structures. It must remain unregistered in `data/packs/fd-playtest-v1/pack.json` and must not mutate generated/product content.

Fresh S must also add:

- one focused consumer-migration test file; and
- one S result report.

Focused behavior must prove through the real loader/runtime path:

- exact archive/evidence/static metadata and zero-issue automatic compilation;
- authoritative `game_start` assigns `role:red-team-leader` to the controller;
- both `role:god-servant` and `history:god-servant` go to the same circular next active player;
- eliminated players are skipped and wrap-around is correct;
- repeated processing does not duplicate status keys;
- `PlayerState.status` remains unchanged by opaque role/history assignment;
- missing ownership or invalid/only-self topology fails closed without partial assignment;
- the standalone archive remains absent from playtest pack/generated product output.

Forbidden scope:

- no production runtime source change;
- no second consumer identity, including `master.amakusa.skill.s1a`, `s2`, `s3`, or ascension;
- no pack/generated/product registration;
- no generic status removal/history semantics beyond storing the exact opaque key;
- no identity-specific runtime routing;
- no merge or retarget;
- no formal migration credit before fresh R `MIGRATION_ACCEPTED` plus A synchronization.

## Required accounting and gates

Mechanical baseline accounting over all 944 frozen identities:

- Base: exactly `137/944` unique frozen identities represented in authoring;
- frozen duplicates: `0`;
- `master.amakusa.skill.s1` absent at Base.

Candidate must be exactly `138/944`, with exact addition `master.amakusa.skill.s1`, zero frozen removals, zero frozen duplicates, and no other frozen addition.

Required gates:

- typecheck;
- focused Amakusa migration + FB2-39 tests;
- rules src/core/regression/focused suite;
- official `npm.cmd run test:ci -- --maxWorkers=2`;
- content validation;
- generated-content determinism;
- exact Locked Reference verification;
- client production build;
- `git diff --check`;
- final cleanliness and runtime/product forbidden-scope audits.

Formal project migration remains **`142/944`**, with **`802`** remaining until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A performs acceptance synchronization. On acceptance, A may credit exactly one identity to `143/944`, leaving `801`.
