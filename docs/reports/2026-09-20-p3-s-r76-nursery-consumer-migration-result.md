# P3-S R76 Nursery Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Exact dispatch

- Exact A dispatch Base: `26964c96793ed74cffeb417528d84cd8ba1aa88d`
- A dispatch branch: `codex/a-p3-r76-nursery-consumer-migration-dispatch`
- S branch: `codex/s-p3-r76-nursery-consumer-migration`
- Frozen identity: `servant.nursery.skill.sc-nursery-2`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Accepted FB2-36 runtime Candidate: `22731b5be697825bd6bfbc09faea3c333eb629b6`
- Canonical FB2-36 reviewer evidence: `https://github.com/binchen648/fd/pull/382#issuecomment-5745209825`

S changed only the exact dispatched consumer material. No runtime production source was modified.

## Materialized consumer

Created standalone archive:

- `data/authoring/servants/servant.nursery.json`

The archive contains exactly one card:

- `servant.nursery.skill.sc-nursery-2`

Static metadata is source-grounded from Locked Reference / legacy metadata:

- owner: `servant.nursery`
- owner name: `童谣`
- servant class: `Caster`
- legacy ID / alias: `sc_nursery_2`
- card name: `无名森林`
- typeLabel: `特殊/宝具`
- attributes: `特殊`, `宝具`
- cost: `3`
- basePower: `5`
- skill-zone mana requirement: `8`
- play envelope: action / `controller_play_card_window`

F1 source-grounded semantic clause:

- source ability: `memory-playground`
- document: `src/content/authoring/cards.json`
- locator: `skillCards[14].abilities[0].printedClause`
- SHA-256: `7858494efa94ff36bd0479163dfccaeac2c1208209cdc7ad90208d0f12a7c721`

The migrated definition preserves exactly one semantic ability, `memory-playground`, with:

- `kind: passive`
- `condition: source_active`
- exactly one `skill_use / forbid` modifier
- scope `players_at_source_location`
- exact skill selector `{ notInAttack: true, trueNameRelease: true }`
- modifier and ability lifecycle `while_active`
- structural true-name visibility `{ revealsTrueName: true, revealTiming: on_use_declared, revealScope: servant_package }`
- automatic execution

No separate true-name-release ability was invented. FB2-36 consumes the structural compiled visibility on this frozen ability.

## Focused runtime evidence

Added:

- `packages/rules/tests/nursery-consumer-migration.test.ts`

Focused evidence uses the real migrated Nursery archive and verifies:

- exact archive identity, F1 clause hash, Reference static metadata, and one-ability shape;
- real archive loader report is empty and card/ability execution is automatic;
- accepted FB2-36 classifier returns `same_location_true_name_off_attack`;
- accepted static while-active classifier recognizes the migrated ability;
- active Nursery source forbids same-location structural true-name skill use, including its controller;
- an ordinary skill lacking structural true-name visibility remains playable;
- current location is evaluated live;
- inactive, face-down, or no-longer-active Nursery source stops enforcing the forbid;
- a structural true-name card already in `attack_area` is not rejected by the Nursery forbid selector;
- trusted effect/card batch play converges on the same authoritative play-eligibility gate and rejects mutation-free;
- the standalone archive is not added to the product pack or generated product outputs.

The focused target cards are test-only structural fixtures; no production routing depends on Nursery identity, target identity, name, printed text, F1 hash, Locked-Reference hash, or Reference handler.

## Mechanical frozen-roster accounting

A set comparison over top-level `data/authoring/**.json` `cards[].id` against the authoritative full-roster inventory mechanically returned:

- inventory canonical IDs: `944`
- Base top-level authoring cards: `156`
- Candidate top-level authoring cards: `157`
- Base frozen overlap: `133/944`
- Candidate frozen overlap: `134/944`
- exact frozen addition: `servant.nursery.skill.sc-nursery-2`
- frozen removals: `0`
- Base duplicates: `0`
- Candidate duplicates: `0`

This branch-local material overlap is not formal project migration credit. Project formal migration accounting remains **`137/944`**, with **`807`** remaining, until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

PR #381 / Ibaraki remains a separate pending migration-review lineage and is not included in this Base or accounting.

## Validation

All required gates passed in this fresh S worktree:

- offline install: `npm.cmd ci --ignore-scripts --offline` — 239 packages, 0 vulnerabilities;
- typecheck: `npm.cmd run typecheck` — PASS;
- focused Nursery migration: **1 file / 7 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **83 files / 501 tests PASS**;
- official CI: **152 files / 1066 tests PASS**;
- eleven-round MatchSession case in official CI: PASS, about 1.89 s;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning appeared;
- `git diff --check`: PASS;
- `phase3:coverage`: PASS; generated audit side effect `artifacts/phase3-skill-coverage.json` was restored before Candidate staging;
- forbidden product/runtime paths remain unchanged: `packages/rules/src/**`, `data/packs/**`, `data/generated/**`, `data/phase3/**`, `apps/**`.

## Candidate scope

Candidate staging is restricted to:

1. `data/authoring/servants/servant.nursery.json`
2. `packages/rules/tests/nursery-consumer-migration.test.ts`
3. this S result report

No merge or retarget is performed. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
