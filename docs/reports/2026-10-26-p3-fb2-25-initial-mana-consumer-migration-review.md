# P3 FB2-25 Initial-Mana Consumer Migration Review

Date: 2026-10-26
Role: Independent Reviewer
Verdict: **MIGRATION_ACCEPTED**

## Reviewed boundary

- Exact Base: `b780972acbbe12639568f88de63c33c627fbc1d3`.
- Candidate: `7c19eea34cbe5eb18589ceda57e43d6c6b9a5076` (`codex/builder-p3-fb2-25-consumer-20261026`).
- Frozen F1: `59f145434695d29bdd17e4cb3adc887e84182377`; locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Accepted parents: FB2-05 / R22 fixed-controller `set_mana`, and FB2-25 / R51 `game_start` fixed set-Mana.

The Candidate changes exactly four files: `data/authoring/masters/master.iliya.json`, `data/authoring/masters/master.taiga.json`, one focused consumer test, and the Builder report. There is no runtime, pack manifest, generated/product content, unrelated Master, or FM09 diff. The two new archives are standalone `master_skill_card_archive` files with one canonical skill each and are absent from the playtest pack manifest.

## Independent source and semantic checks

| Exact F1 identity | Printed text | F1 source ability | Fixed controller target |
| --- | --- | --- | ---: |
| `master.iliya.skill.s1` | `你的魔力初始值为6。` | `iliya.homunculus.initial-mana` | 6 |
| `master.taiga.skill.s1` | `你的魔力初始值为3。` | `taiga.helper.initial-mana` | 3 |

I compared both archives with the F1 inventory and source-evidence overlays at the frozen commit. Identity, owner/name, exact text, clause SHA-256, source references, semantic locators, source-file hash, source ability IDs, `game.started` trigger, and fixed controller `set_mana` amounts match. The locked Reference legacy content confirms both `s1` identities, owner/name, passive type, no legacy requirement, and exact printed text. The source has null cost/base-power fields for these passive skills; the authoring card uses the established numeric-zero representation and records null legacy requirement. No Reference handler was copied into runtime.

The production authoring loader reports no blockers. Each loaded ability fits the accepted FB2-25 envelope: one automatic forced `game_start` trigger, no conditions/targets/cost/creates/modifiers/lifecycle/limit/visibility/host operations, and one fixed controller `set_mana`. The focused test independently observes controller-only exact assignment, typed `mana_adjusted` evidence, and same-event replay idempotence.

## Verification

All runs used the exact Candidate checkout unless stated otherwise.

| Check | Result |
| --- | --- |
| Consumer migration focused | 5/5 PASS |
| FB2-25 runtime focused | 5/5 PASS |
| Fixed-controller dependency compatibility (seven FB2 regression files: set-Mana, resource component, Mana cost, draw, source removal, command seals, game-start set-Mana) | 7 files / 37 tests PASS |
| Wider authoring/resource/trigger compatibility | 7 files / 83 tests PASS |
| All rules regression | 57 files / 358 tests PASS |
| `npm run typecheck -- --pretty false` | PASS |
| `npm run content:validate` | PASS; 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm run verify:generated-content` | PASS; deterministic hashes unchanged |
| `git diff --check Base Candidate` | PASS |

The full root suite with `--maxWorkers=2` gives Candidate **885/905** and Base **880/900**. After normalizing checkout paths, the same 20 tests fail in both; no Candidate-only failure exists. They are the existing unavailable external CHM/page-image and source-path fixture checks in servant/master authoring and playtest-content tests. A preliminary simultaneous Base/Candidate run also timed out one `match-session` test in both checkouts; that test passed in isolation and in each sequential full rerun, so it is not a Candidate regression.

## Decision

**MIGRATION_ACCEPTED** for exactly `master.iliya.skill.s1` and `master.taiga.skill.s1` at the reviewed Candidate. This report grants no A-owned accounting or synchronization by itself. No A-sync, credit update, or merge was performed.
