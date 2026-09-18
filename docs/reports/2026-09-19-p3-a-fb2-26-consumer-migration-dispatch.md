# P3-A R55 / FB2-26 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-19

## Baseline

- A synchronization Base: `8a145c14752391c8de11a102b8fb325045db35d4`
- Accepted FB2-26 Revision Candidate: `e4c703bf3755a5a9e865ca05f0ad93118b70f0e2`
- Fresh R55 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery accepted overlap: `118/944`
- Remaining: `826/944`

## Exact migration family

Dispatch exactly these three frozen source identities:

1. `master.ciel.skill.s1a` — 埋葬机关的修女 — `将【火葬式典】加入你的技能区。` — clause SHA `2cdf7e6bcc7876757898867a73658374247440ab0d78a6a21d2b8f34cf19d486` — target `master.ciel.skill.s2`.
2. `master.shiki-ryougi.skill.s1a` — 欠损 — `游戏开始时，将【死・紧握】加入你的技能区。` — clause SHA `d1e84428f5798f573fd01ed7f061e937925424f2fbab89c4a43ad6af7782d98f` — target `master.shiki-ryougi.skill.s3`.
3. `master.shirou-emiya.skill.s2` — 投影 — `将【干将·莫邪】加入你的技能区。` — clause SHA `a0ea1f45cedb3ac69c9d4050cfdadcf318cf32f62b749013a8454245535ca575` — target `card.derived.master.shirou-emiya.ganjiang-moye`.

All three F1 rows are `CONTRACT_MAPPED`, `blockedBy=[]`, and use the same locked Reference shared handler `core.game-start-add-skill`. Their target definitions are already accepted and present in canonical authoring.

## Accepted contracts to reuse

S must reuse only already accepted contracts:

- P3-R41 / FB2-15: exact identity-free `game_start` skill provisioning semantic;
- P3-R42 / FB2-16 where target behavior requires required-additional-play;
- P3-R43 / FB2-18: exact `initialPlacement: "outside_game"` representation;
- P3-R44-R2 / FB2-19: existing support-only target definition contract;
- P3-R45 / FB2-17-R3: accepted Shirou derived target definition;
- P3-R47: accepted Ciel s2 target definition;
- P3-R49: accepted Ryougi s3 target definition;
- P3-R55 / FB2-26: accepted non-playable mixed master rule archive representation.

No new runtime semantic is authorized. Do not modify interpreter, MatchSession, generic runtime semantics, F1 data, taxonomy, or KPI accounting.

## Authoring representation

For exactly these three existing owner files:

- `data/authoring/masters/master.ciel.json`
- `data/authoring/masters/master.shiki-ryougi.json`
- `data/authoring/masters/master.shirou-emiya.json`

S may convert `archiveType` from `master_support_definition_archive` to `master_rule_definition_archive`, preserve the already accepted outside-game target card, and add exactly one ordinary/non-deferred provisioning source card for the same owner.

For `data/packs/fd-playtest-v1/pack.json`, move exactly those three file registrations from `authoringMasterSupportFiles` to `authoringMasterRuleFiles`. Do not add them to `authoringMasterFiles` and do not create playable masters, presentation surfaces, fallback command spells, decks, or fixture seats.

## Required runtime shape

Each source must use the exact accepted FB2-15 game-start provisioning shape and target only its accepted same-owner target definition. No identity-specific production branching is allowed.

Validation must prove for all three sources:

- source is initially an ordinary owner skill;
- target is initially absent from runtime state;
- trusted `game_start` creates the target exactly once in controller-owned `skill` zone;
- owner/controller/visibility/generatedBy/source event evidence are correct under the accepted FB2-15 contract;
- replay/idempotency does not duplicate the target;
- production product roster remains unchanged;
- the three source cards are the only new frozen canonical identities.

## Scope / accounting

Expected authoring/product scope is limited to the three owner archives, pack registration, focused regression/authoring tests, and the S result report. No unrelated migration is authorized.

This A dispatch earns zero frozen credit. If S adds exactly the three authorized source identities with zero removals and zero duplicates, Candidate material may mechanically become:

**`121/944`**

Formal accepted remains **`118/944`** until a fresh independent migration review returns `MIGRATION_ACCEPTED` and a later A acceptance synchronization records that verdict.

Historical P3-FM09 remains `MIGRATION_BLOCKED`; this dispatch does not claim the historical exact-ten attempt is unblocked and does not dispatch FM10.
