# P3-A FB2-25 Consumer Migration Dispatch — Iliya S1 + Taiga S1

Date: 2026-09-18
Role: Codex A
Status: `READY_FOR_S`
Base: exact post-R51 capability synchronization `f81cdbf42e7469e75213b51a97b1202670022831`
Accepted recovery overlap at dispatch: `115/944`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted runtime capability: FB2-25 / R51 Candidate `101cb0d4e3fbd105cfadafda26585b3825616fe1`

## Exact S migration set

Codex S may materialize exactly two frozen identities:

1. `master.iliya.skill.s1` / 人工生命体 — printed text `你的魔力初始值为6。`;
2. `master.taiga.skill.s1` / 带着她的头号帮手 — printed text `你的魔力初始值为3。`.

No other frozen identity is in scope. In particular, `master.zouken.skill.s1` is excluded because its frozen semantics also set Mana capacity for game duration.

## Fresh source and static metadata grounding

F1 final source evidence independently records both rows as `SOURCE_GROUNDED`, blocker-free `READY_GENERIC_EXTENSION`, with exactly the axes `game.started -> SET_MANA` and required capabilities `GENERIC_TRIGGER_GATEWAY + GENERIC_RESOURCE_NUMERIC`.

Exact source evidence:

- Iliya source locator `Fate_Domination-开发版/data_masters.js#m_iliya.skills[s1]#line=12`; full-text SHA-256 `681da5eab6814317aeb7428ffedec22af430a9b4f889ef2950a7f04ef6a12335`; normalized amount `6`.
- Taiga source locator `Fate_Domination-开发版/data_masters.js#m_taiga.skills[s1]#line=136`; full-text SHA-256 `ab00e7ecf418b26b1a697eaede5ef229bfa9ad00707630efd97fd9c1b5352951`; normalized amount `3`.

Locked Reference confirms only static/identity metadata and the historical shared handler:

- owners `master.iliya` / 伊莉雅斯菲尔 and `master.taiga` / 藤村大河;
- legacy skill id `s1` for both;
- type `被动`;
- generated-card normalized cost/basePower `0/0`;
- legacy requirement `null`;
- Reference handler `core.master-initial-mana` is corroborating evidence only and is not runtime routing authority.

## Accepted contract closure

FB2-05 / R22 accepted the fixed-controller literal `set_mana` primitive but explicitly left these two rows waiting on Trigger Gateway. FB2-25 / R51 now accepts the exact identity-free composed parent semantic:

`automatic forced_trigger + activation exactly game_start + exactly one fixed-controller literal set_mana + all other semantic axes empty/default`.

A fresh temporary consumer probe against the exact accepted runtime proves that raw authoring with explicit `execution.allowedOperations: []` loads with zero report, satisfies the accepted FB2-25 classifier, and on trusted `game_start` changes only the controller Mana from 4 to 6/3 respectively.

## Authoring channel and product isolation

Use the already accepted FM08/R40 standalone full-roster pattern, not the outside-game support archive channel:

- create `data/authoring/masters/master.iliya.json` and `data/authoring/masters/master.taiga.json`;
- each archive uses `archiveType: "master_skill_card_archive"` and contains exactly its one authorized card;
- do **not** add either archive to `data/packs/fd-playtest-v1/pack.json`;
- do not add `publicInformation`, deck material, full master roster surface, fallback/manual product files, or unrelated skills;
- do not use `master_support_definition_archive` / `initialPlacement: outside_game`, because these are game-start source skills rather than provisioned target definitions.

The cards are passive source skills, so they follow the accepted FM08 passive-card pattern: type `被动`, cost/basePower `0/0`, empty `playRequirements`, and one automatic `game_start` forced trigger. Final Rules 9.4 ordinary played-skill Mana threshold is not introduced here because these abilities are not player-played skill attacks.

## Allowed S scope

Expected implementation scope is narrowly:

- the two new master authoring archives above;
- one focused authoring/runtime regression for these two identities and FB2-25 compatibility;
- one S result report.

No production `packages/rules/src/**`, pack/generated, apps, scripts, taxonomy/KPI, or Reference changes are authorized. If exact implementation requires any such change, stop with `MIGRATION_BLOCKED` rather than expanding scope.

## Required S proof

S must independently verify:

- exact F1 full-text hashes, owner/card IDs, names, source locators, and Reference static metadata;
- each new archive loads with zero authoring report;
- each normalized ability satisfies `isGameStartFixedControllerManaSetSemantic`;
- trusted `game_start` sets controller Mana exactly to 6/3, leaves the other player unchanged, emits correct typed `mana_adjusted` on non-zero change, and is replay-idempotent;
- no identity/name/text-specific production runtime routing;
- standard content/generated product remains unchanged because pack manifest is untouched;
- frozen material accounting is exactly `115/944 -> 117/944`, additions only these two, removals 0, duplicates 0.

Run offline install, typecheck, focused new + FB2-25/05 compatibility, content validate/compile/determinism, locked Reference verify, full CI, rules core+regression, client build, phase3 coverage, automation audit, `git diff --check`, exact scope, and final cleanliness.

## Credit boundary

This A dispatch takes zero migration credit. Recovery-line accepted overlap stays `115/944` until the exact S Candidate receives a fresh process-separated migration review and post-review A acceptance synchronization. Candidate material may reach `117/944`; that must not be reported as accepted before fresh R.
