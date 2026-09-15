# P3-A FM04 Migration Synchronization - 2026-09-16

Role: Codex A
Status: `MIGRATION_SYNC_CANDIDATE`
S candidate: `0047b30cd00fd3093f01db373f69cc9540466cd5`
S base / P3-A-FM04 dispatch sync: `a3f7e7d56d6e4bb5af9bf5ae68d89e534ea7df96`
R31 family reconciliation: `9d5498027f05ace0aa3a018da87473a1b47b7a21`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Exact frozen-F1 burn-down

A independently recomputed authoring overlap against the frozen 944-ID F1 inventory rather than inheriting the S report.

- F1 denominator: `944`.
- Canonical authoring overlap before FM04: `59 / 944`.
- Canonical authoring overlap after FM04: `69 / 944`.
- Net increase: `+10`.
- Accepted Independent Action family: `1/11 -> 11/11`.
- Exact newly added set is the ten authorized non-Tomoe siblings.
- Extra non-selected F1 IDs added: `0`.
- F1 IDs removed: `0`.
- Selected missing siblings skipped: `0`.
- Tomoe remains canonical with zero diff.

## Fresh A material coverage

- archives `49 -> 59`;
- cards `81 -> 91`;
- abilities `160 -> 180`;
- `newRuntimeSemanticRouted=12 -> 22`;
- `legacyExecuteAbility=3` unchanged;
- `legacyResolveEffect=107 -> 117`;
- `dualRuntime=0` unchanged;
- `notClassifiable=38` unchanged;
- `taxonomyWarnings=114 -> 124`;
- source fingerprint `401d6d62a3f085eb84e54e1c6889108dcec5ee9fd38b4dbd9ee841059c906125`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

Because the authoring corpus changed materially, `artifacts/phase3-skill-coverage.json` is committed by A.

## Reporter reconciliation

The twenty newly visible abilities split exactly into:

- ten Independent Action `+3 VP` phase actions: `NEW_RUNTIME_SEMANTIC_ROUTED`, semantic route `RESOURCE_NUMERIC_CORE_DIRECT_ACTION`, plus the existing phase-action taxonomy warning;
- ten unpreventable defeat penalties: `LEGACY_RESOLVE_EFFECT` under the current coverage reporter, while runtime execution is independently accepted by B21/R15's exact structural classifier.

This reporter split is reproduced for every new sibling. A does not redefine taxonomy/KPI during migration synchronization. `dualRuntime` stays zero and `notClassifiable` does not increase.

## Independent A recertification

- `npm.cmd run typecheck`: PASS.
- FM04 authoring + TO08 Resource + B21 defeat-penalty focused: `3 files / 15 tests PASS`.
- content validation: PASS, `0` blockers.
- deterministic generated content: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- S fresh all-rules evidence: `49 files / 292 tests PASS`.
- S standard full CI: `116 files / 705 tests PASS`.
- A fresh coverage equals S temporary material coverage except `generatedAt`.
- runtime hot-file diff from the S base: `0`.
- Tomoe archive diff from the pre-FM04 base: `0`.
- `git diff --check`: PASS.

## Gate state

A certifies `MIGRATION_SYNC_CANDIDATE`, not final migration acceptance. P3-R32 is READY on this exact A-synchronized lineage and must independently judge FM04.
