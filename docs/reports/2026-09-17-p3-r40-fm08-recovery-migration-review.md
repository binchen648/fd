# P3-R40 FM08 Recovery Migration Review

Date: 2026-09-17
Role: Codex R, independent migration reviewer
Reviewed HEAD / A synchronization: `bf496c772bda7eb9899fcfa51d825929951012b7`
Exact S candidate: `81ccb7e7e5d0f2cf5ad7da1eda3279c20a604c1a`
Recovery A base before S: `ff2742e51d46ee862071abffe4e23a61652dbdc1`
Accepted FB2-14 recovery runtime: `0831d9fea7c0ffedde634333f27564ea3c1dc65a`
Fresh R39 runtime acceptance: `45e1cc6ff25fe6da838b8d7fca382d0504275aa7`
Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Blocking findings

None.

The invalid old #343-#345 FM08 acceptance chain and its old R40 verdict were not used as provenance. This review reconstructs the result from the pinned recovery lineage, frozen F1 inventory, locked Reference checkout, real candidate authoring, and fresh validation.

## Lineage and exact diff scope

- `HEAD` is exactly `bf496c772bda7eb9899fcfa51d825929951012b7`.
- Ancestry is exact and linear for this gate: `ff2742e` -> `81ccb7e` -> `bf496c7`.
- S versus its recovery A base is additive only: 10 files, 1,168 insertions, zero deletions. It adds exactly eight master authoring archives, one focused FM08 regression, and one S report.
- The eight archives carry exactly ten cards: Bazett one, Caules one, Fiore three, Irisviel one, Peperoncino one, Sieg one, Waver one, and Zouken one. No card outside the authorized set is present in those archives.
- S removes nothing and changes no production runtime source, generated artifact, package file, coverage/taxonomy implementation, KPI implementation, or playtest pack manifest.
- A synchronization versus S changes only three documentation files: `docs/agents/PHASE3-TASK-INDEX.md`, its synchronization report, and the throughput baseline. A has no runtime/content/test/package/generated diff.
- `git diff --check ff2742e..HEAD` passes.

## Authorized identity and evidence reconciliation

The frozen inventory has exactly twelve block-free rows whose Reference handler is `core.game-start-rule-flags`. The authorized complete subset is exactly:

1. `master.bazett.skill.s1b`
2. `master.caules.skill.s1a`
3. `master.fiore.skill.s2`
4. `master.fiore.skill.s3`
5. `master.fiore.skill.s4`
6. `master.irisviel.skill.s1`
7. `master.peperoncino.skill.s1a`
8. `master.sieg.skill.s1`
9. `master.waver.skill.s1`
10. `master.zouken.skill.s5`

For all ten, independent comparison proves:

- the exact frozen F1 row exists;
- both inventory `blockedBy` and Phase 3 `blockedBy` are empty;
- owner ID, canonical card ID, and Reference legacy skill ID match authoring;
- the Reference handler is `core.game-start-rule-flags`;
- the SHA-256 of authoring `printedText` equals the frozen full-text hash recorded in authoring evidence (including the two-line combined hash for Fiore s4);
- locked Reference owner/static metadata matches authoring after the documented adapter normalization;
- source legacy passive records have `cost=null`, `basePower=null`, and `requirement=null`, while the locked Reference generated card layer normalizes passive `cost/basePower` to `0/0`; authoring correctly records `0/0`, legacy requirement `null`, and type label `被动`.

`master.leonardo.skill.s1a` remains excluded because its frozen text requires both event victory-point and event-mana bonuses, while the accepted contract lacks a single authoritative structured event-mana reward path; accepting only the VP half would be incomplete. `master.ophelia.skill.s1a` remains excluded because it only increases uses of the separate Delayed Mystic Eye skill, which is not canonical, leaving a write-only flag without an independently executable contract.

## Authoring and accepted runtime contract

- Every real migrated archive loads with an empty authoring report.
- Each selected card has one automatic forced trigger at trusted `game_start`, no conditions, targets, costs, creations, or rule modifiers, and only exact FB2-14-whitelisted `install_rule_override` effects.
- All ten real cards were executed through runtime initialization plus `processAbilityEvent(... game_start ...)`; the expected controller-scoped rule override was installed for every contract.
- Fiore s4 alone has two effects: lower-VP battle total-power adjustment `-2`, and controller master-skill Power final lock `0` when the Situation forbids `宝具`. The other nine have exactly one effect.
- Canonical `master.irisviel.skill.s1` is isolated in `master.irisviel.fm08.json`. The existing playtest `master.irisviel.json`, its proxy/conversion cards, the pack manifest, and all generated/compiled playtest artifacts are unchanged.
- No production runtime source diff is introduced; semantics rely only on the already accepted FB2-14 recovery runtime.

## Fresh material accounting

The denominator was recomputed from frozen F1 rather than inferred from reports:

- frozen denominator: `943 static + 1 dynamic = 944`;
- current authoring: `98 archives / 133 cards / 232 abilities`;
- unique frozen identities materialized: `111`;
- duplicate frozen identities: `0`;
- every FM08 target occurs exactly once;
- dynamic identity `master.tiamat.card.life-sea` materialized: **no**;
- remaining unmaterialized denominator: `833/944`.

Therefore the exact candidate material boundary is `111/944`, not `112/944`. The sole dynamic row is part of the denominator but receives no numerator credit. The S diff adds ten unique authorized identities to the accepted base material state of `101/944`, with no authoring removal.

Material presence alone did not advance accepted overlap during S or A. With this report preserved as traceable reviewer evidence, local recovery-line accepted overlap may advance from `101/944` to exactly `111/944`.

## Fresh validation evidence

- `npm.cmd run typecheck`: PASS.
- `npm.cmd test -- --run packages/rules/tests/fm08-game-start-rule-overrides-authoring.test.ts packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`: 2 files, 16/16 PASS (FM08 5; FB2-14 11).
- `npm.cmd test -- --run packages/rules/tests/regression packages/rules/tests/core`: 66 files, 396/396 PASS.
- `npm.cmd run content:validate`: PASS; 7 masters, 7 servants, 20 events, zero blocking issues.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content library `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run test:ci -- --maxWorkers=2`: 120 files, 738/738 PASS.
- `npm.cmd run phase3:coverage -- --out node_modules/.cache/p3-r40-coverage.json`: PASS; 98 archives, 133 cards, 232 abilities; raw runtime counts `22/3/127/0/80/124` (new/legacy-execute/legacy-resolve/dual/not-classifiable/taxonomy-warnings); compiled playtest 70 cards, 14 characters, zero blocking issues; definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.
- `npm.cmd run phase3:automation-audit -- --out node_modules/.cache/p3-r40-automation-audit.json`: PASS; legacy resolve/execute/not-classifiable `127/3/80`, promotion findings `20`. This is audit evidence, not gate promotion.
- The ten added authoring abilities explain the expected not-classifiable increase from the pre-FM08 count of 70 to 80. There is no change to taxonomy or KPI code and no manufactured runtime-route credit.
- `git diff --check ff2742e..HEAD`: PASS.

A first parallel test attempt overlapped TypeScript build output creation and produced transient workspace package-resolution errors. After typecheck completed, all affected focused, rules, and full-CI suites were rerun sequentially and passed at the counts above; the transient attempt does not indicate a source failure.

## Repository and governance boundary

Against the locally available `origin/main`, `git rev-list --left-right --count origin/main...HEAD` reports `33 218`; merge-base is `fba31b5a725e6c0b8ba54793be8b6726bfc31040`. The recovery line is therefore materially divergent and `BASELINE_REBASE_REQUIRED` remains in force.

This verdict accepts only the pinned local recovery-line migration. It is not current-main acceptance and must not be represented as such before an explicit repository integration path succeeds.

This process-separated Codex review establishes workflow separation only. It does not prove a distinct GitHub account or a human reviewer identity, and it supplies no independent GitHub review/status evidence.

## Final status

`MIGRATION_ACCEPTED`
