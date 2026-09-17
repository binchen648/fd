# P3-A FM07 Migration Synchronization - 2026-09-16

Role: Codex A
Status: `MIGRATION_SYNC_CANDIDATE`
S candidate: `9c32957b13bc3964932b9a134702c1487069e059`
S base / accepted FB2-13 synchronization: `2fec63dbd6533f435e851c471d3bf00fa75695e2`
R37 runtime/family acceptance: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact frozen-F1 burn-down

A independently recomputed the migration burn-down from `full-roster-ability-inventory.json` rather than inheriting S's count.

- frozen static identities: `943`;
- frozen dynamic identities: `1`;
- authoritative denominator: `944`;
- canonical overlap before FM07: `91 / 944`;
- canonical overlap after FM07: `101 / 944`;
- remaining outside canonical authoring: `843 / 944`;
- net canonical increase: `+10`;
- exact additions: the ten FM07 authorized identities;
- F1 removals: `0`;
- unauthorized additions: `0`.

The exact newly added set is identical to the R37/A-dispatched family: Sion EX plus the nine regular Alter Ego cards. This remains material state only; independently accepted overlap stays `91/944` until R38 accepts FM07.

## Source and static metadata reconciliation

A independently re-read every current archive and re-hashed each full printed text.

Nine regular cards preserve SHA:

`b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`

Sion EX preserves SHA:

`43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`

Locked Reference differences are preserved rather than flattened:

- all nine servant owners remain class `Alterego`;
- regular numeric metadata remains printed cost 2 / legacy requirement 2 / base Power 3;
- eight regular cards remain type label `被动`;
- Passionlip remains the regular-text outlier with type label `特殊` and Reference residual metadata;
- Sion remains owner class `Master`, `master_skill`, type label `特殊`, printed cost 3, legacy requirement 3 and base Power 3;
- all ten retain normal final-rule `skill_zone_mana_at_least: 8` authoring evidence;
- Sion's triggered EX cost 3 is encoded separately inside the accepted response semantic and is not merged with the printed cost or 8-mana qualification gate.

## Fresh A material coverage

Fresh A coverage reproduces the S material state:

- archives `80 -> 90`;
- cards `113 -> 123`;
- abilities `212 -> 222`;
- `newRuntimeSemanticRouted=22` unchanged;
- `legacyExecuteAbility=3` unchanged;
- `legacyResolveEffect=127` unchanged;
- `dualRuntime=0` unchanged;
- `notClassifiable=60 -> 70`;
- `taxonomyWarnings=124` unchanged;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

The ten new rows are the expected legacy coverage-taxonomy `NOT_CLASSIFIABLE:unknown_effect_primitive:transform_event_source_card` material rows. This reporter limitation does not override R37's direct production classifier/runtime acceptance. A does not edit runtime or coverage taxonomy during migration synchronization.

Because the authoring corpus changed materially, fresh `artifacts/phase3-skill-coverage.json` is committed by A.

## Independent A recertification

- fresh offline dependency install: PASS, 0 vulnerabilities;
- `npm.cmd run typecheck`: PASS;
- FM07 + FB2-13 + FM06 focused: `3 files / 18 tests PASS`;
- `npm.cmd run content:validate`: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- S migration suites FM01-FM07 + FB2-13: `56/56 PASS`;
- S rules regression/core: `65 files / 385 tests PASS`;
- S standard full CI: `119 files / 727 tests PASS`;
- runtime production diff from pre-FM07 A-sync `2fec63dbd6533f435e851c471d3bf00fa75695e2`: `0` files;
- `git diff --check`: PASS.

## Gate state

A certifies `MIGRATION_SYNC_CANDIDATE`, not final migration acceptance. P3-R38 is READY on this exact A-synchronized lineage and must independently judge FM07 before accepted overlap may move from `91/944` to `101/944`.
