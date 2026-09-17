# P3-A FM05 Migration Synchronization - 2026-09-16

Role: Codex A
Status: `MIGRATION_SYNC_CANDIDATE`
S candidate: `3e66365a03c12b4a1d683bdae5e9350acad80455`
S base / P3-A-FB2-11 synchronization: `fd17ba227182e5e9a14d093390bbfb3a47af1c39`
R33 runtime/family acceptance: `0121d500b3abda1e9ef4de45c9a266620aa20f45`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Exact frozen-F1 burn-down

A independently recomputed the authoring overlap against the frozen 944-ID F1 inventory rather than inheriting S's result.

- F1 denominator: `944`.
- Canonical authoring overlap before FM05: `69 / 944`.
- Canonical authoring overlap after FM05: `79 / 944`.
- Net increase: `+10`.
- Exact newly added set is the ten authorized Territory Creation identities.
- Extra non-selected F1 IDs added: `0`.
- F1 IDs removed: `0`.
- Selected FM05 members skipped: `0`.

## Fresh A material coverage

Fresh A coverage exactly reproduces S material coverage except `generatedAt`:

- archives `59 -> 69`;
- cards `91 -> 101`;
- abilities `180 -> 200`;
- `newRuntimeSemanticRouted=22` unchanged;
- `legacyExecuteAbility=3` unchanged;
- `legacyResolveEffect=117 -> 127`;
- `dualRuntime=0` unchanged;
- `notClassifiable=38 -> 48`;
- `taxonomyWarnings=124` unchanged;
- source fingerprint `1b408949712eb6eb129577789e09050345f9492c2c9e2ba2814a1720bdb9413f`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

Because the authoring corpus changed materially, `artifacts/phase3-skill-coverage.json` is committed by A.

## Reporter reconciliation

The twenty new abilities split under the existing reporter as:

- ten Territory deployment rewards: `LEGACY_RESOLVE_EFFECT`;
- ten `continuous_formula` round-Power abilities: `NOT_CLASSIFIABLE`;
- no new dual-runtime route;
- no new taxonomy warning.

These labels are reporter facts, not runtime authorization. R33 independently accepted only the trusted `game.round_number` metric and R19 independently accepted the exact deployment-resource semantic. A does not redefine taxonomy/KPI during migration synchronization.

## Independent A recertification

- `npm.cmd run typecheck`: PASS.
- FM05 authoring + FB2-11 + FB2-02 focused: `3 files / 17 tests PASS`.
- content validation: PASS, `0` blockers.
- deterministic generated content: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- S rules regression/core evidence: `63 files / 368 tests PASS`.
- S standard full CI: `117 files / 710 tests PASS`.
- A fresh coverage equals S temporary material coverage except `generatedAt`.
- runtime hot-file diff from the S base: `0`.
- `git diff --check`: PASS.

## Gate state

A certifies `MIGRATION_SYNC_CANDIDATE`, not final migration acceptance. P3-R34 is READY on this exact A-synchronized lineage and must independently judge FM05.
