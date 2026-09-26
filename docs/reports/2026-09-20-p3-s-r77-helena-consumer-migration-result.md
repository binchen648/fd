# P3-S R77 Helena Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Exact dispatch

- Exact A dispatch Base: `c2b88b4923600f29b37d26478ec6752c06665ca3`
- A dispatch branch: `codex/a-p3-r77-helena-consumer-migration-dispatch`
- S branch: `codex/s-p3-r77-helena-consumer-migration`
- Frozen identity: `servant.helena.skill.sc-helena-3`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Accepted FB2-36 runtime Candidate: `22731b5be697825bd6bfbc09faea3c333eb629b6`
- Canonical FB2-36 reviewer evidence: `https://github.com/binchen648/fd/pull/382#issuecomment-5745209825`

S changed only the exact dispatched consumer material. No runtime production source was modified.

## Materialized consumer

Created standalone archive:

- `data/authoring/servants/servant.helena.json`

The archive contains exactly one card:

- `servant.helena.skill.sc-helena-3`

Static metadata is source-grounded from Locked Reference / legacy metadata:

- owner: `servant.helena`
- owner name: `海伦娜·布拉瓦茨基`
- servant class: `Caster`
- legacy ID / alias: `sc_helena_3`
- card name: `金星神·火炎天主`
- typeLabel: `魔术/宝具`
- attributes: `魔术`, `宝具`
- cost: `3`
- basePower: `7`
- skill-zone mana requirement: `8`
- play envelope: action / `controller_play_card_window`

F1 evidence:

- source ability: `mana-synchronization`
- document: `src/content/authoring/cards.json`
- locator: `skillCards[13].abilities[0].printedClause`
- clause SHA-256: `827a73ca8ea48bda73c2a252c0cda060db3cbb22b9c34cdc529723085e3f5497`
- full printed-text SHA-256: `ff3ff32a20b02a8a8504bcf2ddb2f3062c8a4ca091d6360f9897c60187bfc7a5`

The migrated definition preserves exactly one semantic ability, `mana-synchronization`, with:

- `kind: phase_action`
- activation `action / controller_action_window / requiresSourceState: active`
- `condition: source_active`
- exactly one `skill_use / forbid` modifier
- scope `opponents_at_source_location`
- exact skill selector zones `master-skills + servant-skills`, `face: down`
- modifier and ability lifecycle `this_round`
- structural true-name visibility `{ revealsTrueName: true, revealTiming: on_use_declared, revealScope: servant_package }`
- automatic execution

The raw Reference-only ability `name` field is not preserved. No identity-specific runtime route was added.

## Focused runtime evidence

Added:

- `packages/rules/tests/helena-consumer-migration.test.ts`

Focused evidence uses the real migrated Helena archive and verifies:

- exact archive identity, clause/full-text hashes, Reference static metadata, and one-ability shape;
- real archive loader report is empty and execution is automatic;
- accepted FB2-36 classifier returns `same_location_opponent_facedown_skill`;
- real action-window activation installs the accepted `this_round` ongoing modifier with the next-round expiry boundary;
- same-location opponent face-down master and servant skill-zone cards are forbidden while the rule is live;
- controller cards, face-up skills, non-skill cards, and different-location opponents are not matched;
- inactive, face-down, or no-longer-active Helena source stops enforcing the ongoing rule;
- next-round expiry stops enforcement while source remains active;
- trusted batch play converges on the same authoritative play-eligibility gate and rejects mutation-free;
- standalone archive is not added to product pack or generated product outputs.

Test-only fixture identities are not production routing.

## Mechanical frozen-roster accounting

A set comparison over top-level `data/authoring/**/*.json` `cards[].id` against the authoritative frozen inventory returned:

- inventory canonical IDs: `944`
- Base top-level authoring cards: `157`
- Candidate top-level authoring cards: `158`
- Base frozen overlap: `134/944`
- Candidate frozen overlap: `135/944`
- exact frozen addition: `servant.helena.skill.sc-helena-3`
- frozen removals: `0`
- Base duplicates: `0`
- Candidate duplicates: `0`

This branch-local material overlap is not formal project credit. Project formal migration accounting remains **`138/944`**, with **`806`** remaining, until fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

PR #381 / Ibaraki remains a separate pending migration-review lineage and is not included in this Base or accounting.

## Validation

All required gates passed in this fresh S worktree:

- offline install: `npm.cmd ci --ignore-scripts --offline` — 239 packages, 0 vulnerabilities;
- typecheck: `npm.cmd run typecheck` — PASS;
- focused Helena migration: **1 file / 7 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **83 files / 501 tests PASS**;
- official CI with `--maxWorkers=2`: **153 files / 1073 tests PASS**;
- eleven-round MatchSession case: PASS, about `1.82 s`;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning appeared;
- `git diff --check`: PASS;
- `phase3:coverage`: PASS (`archives=118`, `cards=158`, `abilities=265`, `blockingIssues=0`); generated `artifacts/phase3-skill-coverage.json` side effect restored before staging;
- forbidden diff is empty under `packages/rules/src/**`, `data/packs/**`, `data/generated/**`, `data/phase3/**`, `apps/**`.

## Candidate scope

Candidate staging is restricted to exactly:

1. `data/authoring/servants/servant.helena.json`
2. `packages/rules/tests/helena-consumer-migration.test.ts`
3. this S result report

No merge or retarget is performed. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
