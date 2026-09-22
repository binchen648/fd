# P3-S R108 Ciel S3 Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-23
Task: `P3-S-R108-CIEL-S3-CONSUMER-MIGRATION`
Branch: `codex/s-p3-r108-ciel-s3-consumer-migration`

## Exact baseline

- Exact A dispatch / clarification Base: `c3564f7b191e8220c828edcbec6bb09e556a06d8` (tree-equivalent local clarification SHA `69a9f63621bebe62f2cc61df7175ec3ca4a04f0d`).
- Accepted FB2-52 runtime Candidate: `59d930f9e5a0202e0d1b3d9358e0d35ca3a0d029`.
- Canonical FB2-52 Reviewer evidence: `https://github.com/binchen648/fd/pull/428#issuecomment-5784412049`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Formal migration before fresh R: `153/944`; formal remaining `791`.

## Migration result

This Candidate migrates exactly one frozen identity, `master.ciel.skill.s3` (`第七圣典`), into the existing rules-only Ciel archive.

The authored card preserves the frozen/source-grounded contract:

- `master_skill`, owner `master.ciel`, legacy id `s3`, `initialPlacement=outside_game`;
- printed cost `3`, printed base Power `7`, type/attribute `力量`;
- canonical final-rules skill-zone play threshold `8` mana;
- `<每局游戏限一次>` through the existing per-game play limiter;
- Combat phase action `seventh-scripture-soul-crush` with exact `source_active` + `at_battlefield` conditions;
- exact accepted FB2-52 compound effect: same-battlefield opponents lacking active face-up `card.cardluck` receive next-round suppression of `situation_mana_gain` and `situation_power_bonus` only.

No production runtime/compiler source was changed, no pack manifest registration was changed, and `master.ciel.skill.s1b` remains absent.

## Frozen accounting

Mechanical Base-to-Candidate working-tree recount against the frozen inventory proves:

- frozen denominator: `944`;
- Base unique authoring ids: `171`; Base frozen overlap: `148/944`; Base duplicate frozen ids: `0`;
- Candidate unique authoring ids: `172`; Candidate frozen overlap: `149/944`; Candidate duplicate frozen ids: `0`;
- exact frozen additions: `master.ciel.skill.s3` only;
- frozen removals: none;
- `master.ciel.skill.s3`: Base `0` -> Candidate `1`;
- `master.ciel.skill.s1b`: Candidate `0`.

This material +1 is not formal migration credit until the exact Candidate receives fresh independent R `MIGRATION_ACCEPTED` and A synchronizes the acceptance.

## Generated / product isolation

The deterministic generated-content diff is restricted to the existing rules-only surface:

- top-level generated change: `rules` only;
- `rules.cards`: exact +1 `master.ciel.skill.s3`;
- `rules.sourceMap`: exact +3 entries for the card and its two abilities;
- `rules.definitionHash` / `rules.contentIdentity.definitionHash`: deterministic hash updates only;
- no generated playable master/card/deck/character surface change;
- pack manifest diff: empty.

## Authorized compatibility edits

Full-CI recertification exposed four stale historical absolute snapshots. The A dispatch clarifications authorize only these exact compatibility edits, all now narrowed to stable invariants:

1. Atalanta S2: remove stale repository-wide `overlap===148` while retaining denominator/duplicate/Atalanta identity checks.
2. FB2-26 provisioning: keep exact source/target once/in-order checks without claiming the whole Ciel archive has only those two definitions.
3. Executable-card-pack: remove only the stale absolute total executable-card count `76`; all schema/hash/deck/source-map/classification assertions remain.
4. Ciel S2 support definition: replace the stale whole-archive length `2` with exact-once presence checks for accepted s1a and s2; all S2 semantics remain unchanged.

No other historical test or production behavior is changed.

## Recertification evidence

- Focused Ciel S3 + FB2-52 + authorized compatibility suite: `6 files / 122 tests` PASS.
- Official `npm run test:ci -- --maxWorkers=2`: `183 files / 1368 tests` PASS.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS (`7 masters / 7 servants / 20 events / 0 blocking issues`).
- `npm run verify:generated-content`: PASS; content-library SHA-256 `4b1f46dc3a0d22eb13652d817c1b4db9056dcc85e9c14fdac1515804b85c9da7`.
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Client production build: PASS (warnings only).
- `npm run phase3:coverage`: PASS; `archives=128`, `cards=172`, `abilities=285`, `compiledCards=77`, `blockingIssues=0`, `dualRuntime=0`.
- `npm run phase3:automation-audit`: PASS; `promotionFindings=20`; generated audit artifacts restored to exact Base content after evidence collection.
- `git diff --check`: PASS.

## Scope conclusion

S completed recertification. The exact Candidate SHA is the commit containing this result report and is bound in the PR implementation evidence / fresh-R handoff. Until fresh independent R accepts that exact Candidate, formal migration remains `153/944` with `791` remaining.