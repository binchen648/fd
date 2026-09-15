# P3-FM04 Archer Independent Action Migration

Date: 2026-09-16
Role: S
Status: `MIGRATION_CANDIDATE`
Base A dispatch sync: `a3f7e7d56d6e4bb5af9bf5ae68d89e534ea7df96`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted dependencies: TO08 Resource Numeric direct action + B21/R15 unpreventable battle-loss VP trigger + R31 Independent Action family reconciliation

## Exact family and migration delta

The accepted Independent Action family contains exactly eleven cards. Tomoe was already canonical and is intentionally unchanged. FM04 adds only the ten missing siblings:

- `servant.atalanta.skill.sc-atalanta-3`
- `servant.baobhan.skill.sc-baobhan-3`
- `servant.chiron.skill.sc-chiron-1`
- `servant.emiya-alt.skill.sc-emiya-alt-1`
- `servant.euryale.skill.sc-euryale-1`
- `servant.gil.skill.sc-gil-1`
- `servant.ishtar.skill.sc-ishtar-3`
- `servant.napoleon.skill.sc-napoleon-3`
- `servant.robin.skill.sc-robin-1`
- `servant.tristan.skill.sc-tristan-3`

Each new archive contains exactly one selected skill card and exactly two abilities. `data/authoring/servants/servant.tomoe.json` has zero diff.

## Frozen source and static metadata

All eleven family members have the same frozen printed-text SHA:

`792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5`

The ten new archives preserve the F1 full text and all three clause source hashes per identity. Locked Reference metadata is uniform across the family: `typeLabel=特殊`, `cost=0`, `basePower=6`, historical `requirement=0`. Canonical skill-zone play still uses final rule 9.4 at 8 mana; the historical requirement remains evidence metadata only.

Gilgamesh keeps its F1 source provenance and historical blocker-label distinction, but R31 independently confirmed the locked Reference places Gil in the same eleven-member `independentActionSkillIds` array with the same `core.independent-action` handler and no Gil-specific runtime branch.

## Accepted two-ability decomposition

Every new archive uses the already accepted Tomoe structure with identity-only renaming:

1. `*.independent-action`: action phase/controller action window/active source; condition `controller_seat_in_first_half`; typed controller VP `+3`. This is the accepted TO08 `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` semantic shape.
2. `*.penalty-on-defeat`: forced `after_controller_loses_battle`; typed controller VP `-5`; exact `ignore / effect_prevention / this_effect / explicit_exception` rule modifier. This is the accepted B21/R15 unpreventable battle-loss VP shape.

The two printed clauses rejoin with a real newline to the exact frozen full card text for all ten new cards (`10/10 PASS`).

## Real migrated representative

Atalanta is exercised as a real newly migrated archive through both accepted runtime paths:

- while in the first half of turn order, the action ability executes through the typed Resource route and increases VP by exactly `+3`;
- on a controller battle loss, with ordinary effect prevention enabled, the penalty still settles unpreventably for `-5` VP through the B21 route.

The focused migration suite also proves all ten new archives classify into both accepted structural contracts and preserve the family source/static metadata.

## Frozen-F1 authoring burn-down observed by S

Programmatic comparison against the exact A handoff and frozen 944-ID F1 inventory:

- denominator: `944`;
- canonical authoring overlap: `59 -> 69` (`+10`);
- Independent Action family: `1/11 -> 11/11`;
- exact added frozen IDs equal the authorized ten missing siblings: PASS;
- unauthorized additions: `0`;
- removals: `0`;
- skipped new siblings: `0`;
- Tomoe remains present and unchanged.

## Raw coverage observation

Temporary S coverage is not staged for commit. Relative to the FM03 material baseline it reports:

- archives `49 -> 59`;
- cards `81 -> 91`;
- abilities `160 -> 180`;
- `newRuntimeSemanticRouted=12 -> 22` (`+10`, the Independent Action `+3 VP` abilities);
- `legacyExecuteAbility=3` unchanged;
- `legacyResolveEffect=107 -> 117` (`+10`, the unpreventable defeat penalties under the existing reporter label);
- `dualRuntime=0` unchanged;
- `notClassifiable=38` unchanged;
- `taxonomyWarnings=114 -> 124` (`+10` existing phase-action warnings);
- compiled product unchanged: 70 cards / 14 characters / 0 blocking issues;
- compiled definition hash unchanged: `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.

S does not redefine A-owned runtime taxonomy/KPI. The B21 abilities are accepted by the runtime semantic classifier even though the current coverage reporter retains the legacy label for that structural family.

## Validation

- typecheck: PASS;
- FM04 + TO08 + B21 focused: `3 files / 15 tests PASS`;
- content validation: 7 masters / 7 servants / 20 events / 0 blocking issues;
- all rules regressions: `49 files / 292 tests PASS`;
- deterministic generated content: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `116 files / 705 tests PASS`;
- runtime hot-file changes relative to handoff: `0`;
- Tomoe archive changes: `0`;
- `git diff --check`: PASS.

## Changed scope

Candidate scope is exactly:

- ten new minimal `data/authoring/servants/*.json` archives for the authorized missing siblings;
- `packages/rules/tests/fm04-independent-action-authoring.test.ts`;
- this S migration report.

`artifacts/phase3-skill-coverage.json` remains locally modified only because S ran temporary material coverage; it is intentionally unstaged for A-owned material synchronization. No runtime implementation, coverage/taxonomy definition, frozen F1 artifact, generated playtest content, Tomoe archive, or unrelated authoring is changed.
