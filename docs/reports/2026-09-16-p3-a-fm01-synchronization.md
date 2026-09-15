# P3-A FM01 Migration Synchronization — 2026-09-16

Role: Codex A
Status: MIGRATION_SYNC_CANDIDATE
S candidate: `6203b70c5bc2a81ceecca31008dc2b71246519a9`
S base: `135d1d1996165f07e3044d5378329eb38362f8b3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Exact before / after burn-down

A independently enumerated all card IDs in `data/authoring/**` at the exact S base and candidate and intersected them with the frozen 944 F1 canonical IDs.

- F1 denominator: `944`.
- Canonical authoring overlap before FM01: `24 / 944`.
- Canonical authoring overlap after FM01: `37 / 944`.
- Net global canonical-authoring increase: `+13` exact F1 IDs.
- FM01 selected batch before: `1 / 14` (Drake only).
- FM01 selected batch after: `14 / 14`.
- Newly added selected IDs: `13`.
- Extra non-selected F1 IDs added: `0`.
- Selected IDs skipped: `0`.

Exact post-migration membership:

- `servant.boudica.skill.sc-boudica-3`
- `servant.constantine.skill.sc-constantine-1`
- `servant.drake.skill.sc-drake-1`
- `servant.hephaistion.skill.sc-hephaistion-3`
- `servant.iskandar.skill.sc-iskandar-1`
- `servant.ivan.skill.sc-ivan-3`
- `servant.mandricardo.skill.sc-mandricardo-3`
- `servant.martha.skill.sc-martha-3`
- `servant.medb.skill.sc-medb-1`
- `servant.medusa.skill.sc-medusa-1`
- `servant.odysseus.skill.sc-odysseus-3`
- `servant.roberts.skill.sc-roberts-3`
- `servant.teach.skill.sc-teach-3`
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`


Drake was already canonical authoring and remains byte-unmodified by S; the other 13 selected rows are the complete global delta.

## Fresh A coverage artifact

Fresh `npm.cmd run phase3:coverage` from exact S candidate produced the committed material artifact `artifacts/phase3-skill-coverage.json`:

- archives: `14 -> 27`;
- cards: `46 -> 59`;
- abilities: `92 -> 118`;
- `newRuntimeSemanticRouted=12` (unchanged);
- `legacyExecuteAbility=3` (unchanged);
- `legacyResolveEffect=49 -> 75`;
- `dualRuntime=0` (unchanged);
- `notClassifiable=28` (unchanged);
- `taxonomyWarnings=79 -> 92`;
- source fingerprint: `2350e4949a4757fb6417080f63b8698c0c45492c2e03f36bdc8f4672f1276c6f -> abc541c2fa221eb52cdac69945c20492327f52a91e864a9f19d0aefd48079bc2`;
- compiled product definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, compiled characters `14`, blocking issues `0`.

Because the authoring corpus changed materially, this coverage artifact is intentionally committed by A. This differs from prior A syncs where only timestamp/source-line drift changed.

## Reporter reconciliation

The raw `LEGACY_RESOLVE_EFFECT` increase is not interpreted as a runtime regression or a newly accepted KPI result.

A compared all 26 newly visible abilities against the two pre-existing Drake Riding abilities in the *pre-FM01* coverage artifact while ignoring identity fields. Result: `STRUCTURAL_MISMATCHES=0`.

The pre-existing independently accepted Drake representatives were already reported as:

- draw trigger: `runtimeRoute=LEGACY_RESOLVE_EFFECT`, no semantic route;
- optional low-power action: `runtimeRoute=LEGACY_RESOLVE_EFFECT`, plus the existing generic `phase_action_is_not_domain_trigger` warning.

The 13 new cards inherit exactly those two semantic signatures. The reporter therefore exposes a known evidence-classification gap: it does not yet encode TO13 or FB2-08 as raw `semanticRoutes`. A does not rewrite classifier/taxonomy/KPI definitions inside a migration synchronization. `unclassifiedItems` is byte-equivalent before/after, `dualRuntime` remains zero, and the product compiled definition is unchanged.

R26 must judge the migration using both this raw artifact and the accepted-contract evidence, rather than treating a pre-existing reporter label as proof that the runtime took a legacy fallback.

## Independent A verification

From exact S candidate:

- `npm.cmd run typecheck`: PASS.
- FM01 + FB2-08 + TO13 focused suite: `30/30 PASS`.
- `npm.cmd run content:validate`: PASS, 0 blocking issues.
- generated-content determinism: PASS with unchanged three hashes.
- S lineage `git diff --check`: PASS.
- S lineage changed exactly 13 selected authoring archives + one FM01 test + one S report; no runtime source, client/app, coverage classifier, F1 evidence, or production pack file changed.
- S full-CI evidence: `693/693 PASS`; all rules regressions `280/280 PASS`.

## Gate state

A certifies the migration lineage as `MIGRATION_SYNC_CANDIDATE`, not accepted. The exact 14-ID batch, source preservation, accepted-contract conformance, and reporter reconciliation now require independent R26 review. No classifier repair or next migration batch is dispatched before that judgment.
