# P3-S R110 Ciel S1b Consumer Migration Result

Role: Codex S
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-23
Task: `P3-S-R110-CIEL-S1B-CONSUMER-MIGRATION`
Branch: `codex/s-p3-r110-ciel-s1b-consumer-migration`

## Exact baseline

- Exact A dispatch Base: `f770d9dc3a68be24fe995b5d8460922dba720f16`.
- Its parent synchronized baseline is R109 Ciel S3 acceptance sync `f94dd1b1569229d1f4efd02e767ab5804dea786a`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Formal migration before fresh R: **`154/944`**, **`790`** remaining.
- Material authoring overlap on Base: **`149/944`**.

## Migration result

This Candidate migrates exactly one frozen identity: `master.ciel.skill.s1b` (`外典`) into the existing rules-only Ciel archive.

The authored card preserves the frozen/source-grounded contract:

- owner `master.ciel`, legacy id / alias `s1b`, ordinary `master_skill`;
- no `initialPlacement`; executable compiler places it in the controller's initial `skill` zone;
- passive static metadata: cost `0`, base power `0`, attributes `[]`, no play requirement;
- exact printed text SHA-256 `6ed54c1b75925d3b78f7bd89727b5363dc944cf571831c1a81618e788eb71e31`;
- exact clause SHA-256 `98a4becbbedd9d11ae2b93ea1b192b781a6943fb0ff62e1dbff4bb9697bbb6fc`;
- normalized accepted FB2-51 parent route: authoritative `player.victory-points.changed`, opponent relation, current-round positive VP gain crossing literal `7`;
- exact FB2-30 effect returns or materializes `master.ciel.skill.s3` to controller skill zone face-up/inactive;
- formally accepted s3 definition remains same-owner `master_skill` with `initialPlacement=outside_game`.

No production runtime/compiler/content/client source was changed and no pack manifest registration was changed.

## Frozen accounting

Mechanical exact-Base-to-working-tree recount proves:

- frozen denominator: `944`;
- Base frozen overlap: `149/944`;
- Candidate frozen overlap: **`150/944`**;
- exact frozen addition: `master.ciel.skill.s1b` only;
- frozen removals: none;
- duplicate frozen ids: none;
- s1b: Base `0` -> Candidate `1`;
- s3 remains exactly `1`.

This material +1 is not formal migration credit until the exact Candidate receives fresh independent R `MIGRATION_ACCEPTED` and A synchronizes that acceptance.

## Executable behavior proof

The new consumer test uses the production executable pack, not a synthetic owner fixture. It proves:

- authoring loader report `[]`;
- exact raw and compiled FB2-51 structural classifiers both accept the whole envelope;
- compiled s1b is `master.ciel` / `master_skill`, `initialZone=skill`, automatic, non-deferred;
- direct opponent +7 crosses exactly once and creates exactly one s3;
- split 3+4 crosses only on the second event; +6 does not cross;
- controller gain, zero, loss and non-VP events do not qualify;
- a round advance resets the ledger and permits a fresh crossing;
- an existing physical s3 is returned by the same instance id rather than duplicated;
- duplicate authoritative event ids are idempotent;
- forged provenance fails closed transactionally.

The first local focused attempt used the loader-level authoring pack for runtime setup and correctly hit FB2-30's executable owner-id source guard. The harness was corrected to use the production executable pack; no production code or authoring semantics changed. The final focused and full suites below are green.

## Generated / product isolation

The deterministic generated diff is restricted to the existing rules-only surface:

- top-level generated change: `rules` only;
- `rules.cards`: exact +1 `master.ciel.skill.s1b`, no removals or changed prior card definitions;
- `rules.sourceMap`: exact +2 entries: card + `seventh-scripture-return`, no removals or changed prior mappings;
- `rules.definitionHash` / `rules.contentIdentity.definitionHash`: deterministic hash updates only;
- top-level ordinary cards, masters, servants and event sets unchanged;
- `rules.characters`, `rules.decks`, `rules.fallbackCommandSpells` unchanged;
- pack manifest diff empty.

## Authorized compatibility edits

R110 A dispatch proactively authorized exactly two S3 historical snapshot narrowings, and only those were applied:

1. Ciel S3's whole-archive exact list `[s1a,s2,s3]` now filters and verifies those three accepted identities in the same relative order without claiming archive exclusivity.
2. Ciel S3's stale repository-wide absolute overlap `149` assertion was removed while preserving frozen denominator `944`, duplicate-frozen-id empty, and s3 exact-once invariants.

No S3 semantic assertion changed and full CI exposed no additional stale snapshot requiring A clarification.

## Recertification evidence

- Toolchain verifier: `FD_TOOLCHAIN_OK`.
- Focused S1b + FB2-51 + FB2-30 + FB2-31 + Ciel-S3 compatibility: **`5 files / 42 tests` PASS**.
- Official `npm run test:ci -- --maxWorkers=2`: **`184 files / 1375 tests` PASS**.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS (`7 masters / 7 servants / 20 events / 0 blocking issues`).
- `npm run verify:generated-content`: PASS; content-library SHA-256 `b38f475ddba68450d678f38da04d336d5d905c315527f08c474496fd09076f0c`.
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Client production build: PASS (warnings only).
- `npm run phase3:coverage`: PASS; `archives=128`, `cards=173`, `abilities=286`, `compiledCards=78`, `compiledCharacters=14`, `blockingIssues=0`, `dualRuntime=0`.
- `npm run phase3:automation-audit`: PASS; `promotionFindings=20`; generated audit artifacts restored to exact Base content after evidence collection.
- production runtime/content/client source diff: empty.
- pack manifest diff: empty.
- `git diff --check`: PASS.

## Scope conclusion

S completed recertification and the exact candidate tree is limited to one frozen consumer, its deterministic rules-only generated representation, the R110 consumer test, the two pre-authorized S3 compatibility assertions, and this result report. The exact Candidate SHA is the commit containing this report and is bound in the PR migration evidence / fresh-R handoff.

Until fresh independent R accepts that exact Candidate, formal migration remains **`154/944`**, **`790`** remaining. Material authoring overlap in this Candidate is **`150/944`**.
