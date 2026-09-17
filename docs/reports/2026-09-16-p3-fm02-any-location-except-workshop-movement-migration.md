# P3-FM02 Any-Location-Except-Workshop Movement Migration

Date: 2026-09-16
Role: S
Status: MIGRATION_CANDIDATE
Base A sync: `1fb744fcfb85f152534f66aa676984e2c4a8ac96`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Runtime acceptance: R27 `698dba5a8476e3d86363f286c57c9f515746eb3f`

## Exact batch

FM02 migrates exactly these 12 frozen F1 identities and no others:

- `servant.benkei.skill.sc-benkei-1`
- `servant.bradamante.skill.sc-bradamante-1`
- `servant.brynhildr.skill.sc-brynhildr-1`
- `servant.cu.skill.sc-cu-2`
- `servant.diarmuid.skill.sc-diarmuid-3`
- `servant.donquixote.skill.sc-donquixote-3`
- `servant.enkidu.skill.sc-enkidu-3`
- `servant.jaguarman.skill.sc-jaguarman-1`
- `servant.kagetora.skill.sc-kagetora-3`
- `servant.lishuwen.skill.sc-lishuwen-3`
- `servant.romulus.skill.sc-romulus-3`
- `servant.vlad.skill.sc-vlad-3`

All 12 were absent from canonical authoring at the A handoff. Each new servant archive is intentionally minimal and contains only its selected skill card. No same-owner sibling skill was migrated.

## Source and static metadata preservation

- Frozen F1 printed/source text SHA-256 for every member: `5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0`.
- Source hash preservation: 12/12 PASS.
- Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is used only for static card metadata.
- All selected cards preserve printed `cost=3`, `basePower=5`, legacy `requirement=3`, and their exact per-card type-label/attribute ordering.
- Canonical skill-zone play requirement is final rule 9.4: 8 mana. The legacy `requirement=3` remains evidence metadata only.
- Li Shuwen remains an Assassin owner while the selected card preserves the source-defined Lancer-class skill family; owner class is not used to infer card mechanics.

## Canonical accepted semantic shape

Every migrated card loads to exactly one accepted FB2-09 ability:

- `phase_action`;
- action phase; controller action window; active source;
- one location target, count `1..1`;
- exact constraints `any_enabled_location` + `not_location_kind: workshop`;
- one controller `move_player` effect to the declared target;
- no cost, conditions, creates, modifiers, lifecycle, response opening, or activation limit.

All 12 pass both `isAnyLocationExceptWorkshopMovementCandidate` and `isAnyLocationExceptWorkshopMovementSemantic`.

## Runtime exercise

A newly migrated non-fixture representative, Benkei `servant.benkei.skill.sc-benkei-1`, is exercised end-to-end:

- the active ability is exposed in the action window;
- the private server decision includes legal destinations;
- current location and Magic Workshop are excluded;
- choosing Shinto settles through the typed movement route;
- the controller moves and the typed `effect_resolved` provenance is present.

## Frozen-authoring burn-down observed by S

- frozen-F1 canonical authoring overlap before FM02: 37;
- after FM02 candidate: 49;
- delta: +12;
- delta set equals the exact authorized FM02 IDs: PASS;
- exact batch: `0/12 -> 12/12`;
- unauthorized frozen-F1 additions: 0.

## Raw coverage observation

Temporary S coverage (not committed) reports:

- archives `27 -> 39`;
- cards `59 -> 71`;
- abilities `118 -> 130`;
- `newRuntimeSemanticRouted=12`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=87` (75 + 12 newly visible Movement abilities);
- `dualRuntime=0`;
- `notClassifiable=28`;
- `taxonomyWarnings=104` (92 + 12 standard phase-action warnings);
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards 70 / characters 14 / blocking issues 0.

The 12 new coverage records have one identical semantic signature. They are all reported as `LEGACY_RESOLVE_EFFECT` with the existing `TAXONOMY_DRIFT_WARNING:phase_action_is_not_domain_trigger`. S does not modify A-owned coverage routing or taxonomy definitions.

## Validation

- `npm.cmd run typecheck`: PASS.
- FM02 authoring + FB2-09 + Resolution Data-flow focused: 3 files / 27 tests PASS.
- content validation: 7 masters / 7 servants / 20 events / 0 blocking issues.
- all rules regressions: 48 files / 287 tests PASS.
- generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- full CI: 115 files / 700 tests PASS.
- `git diff --check`: PASS.
- runtime hot-file changes: 0.

## Changed scope

- 12 new minimal `data/authoring/servants/*.json` archives for the exact batch;
- `packages/rules/tests/fm02-any-location-except-workshop-movement-authoring.test.ts`;
- this migration report.

No runtime implementation, coverage classifier, frozen F1 data, generated playtest content, or unrelated authoring is changed.
