# P3-A FM02 Migration Synchronization — 2026-09-16

Role: Codex A
Status: MIGRATION_SYNC_CANDIDATE
S candidate: `e1d8456637648d31127d6d69daeb9d74a6d01a18`
S base / P3-A-FB2-09 synchronization: `1fb744fcfb85f152534f66aa676984e2c4a8ac96`
FB2-09 independent acceptance: `698dba5a8476e3d86363f286c57c9f515746eb3f`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Exact frozen-F1 burn-down

A independently enumerated all card IDs in `data/authoring/**` at the exact S base and exact S candidate/current worktree, then intersected them with the frozen 944 F1 canonical identities.

- F1 denominator: `944`.
- Canonical authoring overlap before FM02: `37 / 944`.
- Canonical authoring overlap after FM02: `49 / 944`.
- Net global canonical-authoring increase: `+12` exact F1 IDs.
- FM02 selected batch before: `0 / 12`.
- FM02 selected batch after: `12 / 12`.
- Extra non-selected F1 IDs added: `0`.
- F1 IDs removed: `0`.
- Selected IDs skipped: `0`.

Exact added set:

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

This is exact membership agreement with the A handoff and S candidate.

## Fresh A material coverage

After repairing only the local incomplete `node_modules` installation with `npm.cmd ci --offline --ignore-scripts`, A ran fresh `npm.cmd run phase3:coverage` from the exact S candidate. The committed material artifact now reports:

- archives: `27 -> 39`;
- cards: `59 -> 71`;
- abilities: `118 -> 130`;
- `newRuntimeSemanticRouted=12` (unchanged);
- `legacyExecuteAbility=3` (unchanged);
- `legacyResolveEffect=75 -> 87`;
- `dualRuntime=0` (unchanged);
- `notClassifiable=28` (unchanged);
- `taxonomyWarnings=92 -> 104`;
- source fingerprint: `abc541c2fa221eb52cdac69945c20492327f52a91e864a9f19d0aefd48079bc2 -> 3e8cc78e550b61c3924f91fcfeb1b6c304c586beed9e07ee18f60403d94eb315`;
- compiled product definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, compiled characters `14`, blocking issues `0`.

Because the authoring corpus changed materially, `artifacts/phase3-skill-coverage.json` is intentionally committed by A.

## Reporter reconciliation

S independently showed that the 12 newly visible Movement abilities have exactly one raw coverage signature. The reporter labels all 12 `LEGACY_RESOLVE_EFFECT` and emits the same `TAXONOMY_DRIFT_WARNING:phase_action_is_not_domain_trigger`. A retains those raw labels rather than redefining taxonomy or KPI during synchronization.

That raw reporter classification is not used to broaden or revoke the independently accepted FB2-09 runtime contract. R28 must judge exact authoring semantics against the accepted identity-free Movement contract and verify that the production execution path is the typed `move_player` route.

## Independent A recertification

From exact S candidate lineage:

- `npm.cmd run typecheck`: PASS.
- FM02 authoring + FB2-09 + Resolution Data-flow focused suite: `27/27 PASS`.
- `npm.cmd run content:validate`: PASS, `0` blocking issues.
- generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `git diff --check`: PASS.
- Runtime source diff from the FM02 S base: `0`.
- S evidence already supplied all rules regressions `287/287 PASS` and full root CI `700/700 PASS`.

## Gate state

A certifies `MIGRATION_SYNC_CANDIDATE`, not final acceptance. P3-R28 is READY on the exact A-synchronized lineage and must remain independent/read-only. R28 may return only `MIGRATION_ACCEPTED` or `REVIEW_BLOCKED`; A does not self-promote the migration.
