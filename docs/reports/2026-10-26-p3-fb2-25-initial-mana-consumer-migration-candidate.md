# P3 FB2-25 Initial-Mana Consumer Migration Candidate

Date: 2026-10-26
Role: Builder
Status: `MIGRATION_COMPLETE_CANDIDATE`
Exact Base: `b780972acbbe12639568f88de63c33c627fbc1d3`
Accepted runtime seam: FB2-25 / R51 Candidate `67ffba23740a2ea07a4a25f0038df1d8ed8dbd54`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact migration set

This candidate materializes exactly two frozen F1 identities:

1. `master.iliya.skill.s1` — 人工生命体 — `你的魔力初始值为6。`
2. `master.taiga.skill.s1` — 带着她的头号帮手 — `你的魔力初始值为3。`

No other frozen identity is added. Both archives are standalone and remain outside the playtest pack manifest.

## Authoring and runtime proof

Each archive contains exactly one canonical `master_skill` and one automatic `forced_trigger` with `game_start` activation and fixed-controller `set_mana`. The focused regression loads the real archive through the production authoring loader, checks exact F1 text hashes and locked static metadata, proves FB2-25 semantic classification, proves controller-only Mana mutation and typed evidence, and proves same-event replay idempotence.

## Scope

Only these consumer archives, their focused authoring-boundary test, and this report are changed. Runtime, generated/product packs, unrelated master skills, FM09, and manifest routing are untouched. This candidate is not migration credit and requires independent review before acceptance.
