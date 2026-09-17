# P3-A FM03 Migration Synchronization - 2026-09-16

Role: Codex A
Status: MIGRATION_SYNC_CANDIDATE
S candidate: `cac8a0065dadd190aab6666989571845e4de0f1c`
S base / P3-A-FB2-10 synchronization: `07f6eb51cd6a107a9e48098a13332ae2f622a795`
FB2-10 independent acceptance: R29 `37fcdaf6d3367a4efb9dcfaf8a1a532fb4354ae9`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Exact frozen-F1 burn-down

A independently recomputed authoring overlap against the frozen 944-ID F1 inventory.

- F1 denominator: `944`.
- Canonical authoring overlap before FM03: `49 / 944`.
- Canonical authoring overlap after FM03: `59 / 944`.
- Net increase: `+10`.
- FM03 batch: `0/10 -> 10/10`.
- Extra non-selected F1 IDs added: `0`.
- F1 IDs removed: `0`.
- Selected IDs skipped: `0`.

Exact added set is the authorized FM03 list: Altera SC3, Arthur SC3, Bedivere SC1, Charlemagne SC3, Gawain SC3, Lakshmibai SC3, Mordred SC3, Musashi SC3, Saber SC1, and Saitou SC1.

## Fresh A material coverage

- archives `39 -> 49`;
- cards `71 -> 81`;
- abilities `130 -> 160`;
- `newRuntimeSemanticRouted=12`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=87 -> 107`;
- `dualRuntime=0`;
- `notClassifiable=28 -> 38`;
- `taxonomyWarnings=104 -> 114`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

Because the authoring corpus changed materially, `artifacts/phase3-skill-coverage.json` is committed by A.

## Reporter reconciliation

The selected 30 abilities split exactly into 20 Noble Bloom Resource abilities and 10 Magic Resistance Power abilities. The reporter retains `LEGACY_RESOLVE_EFFECT` for the 20 Noble Bloom siblings and `NOT_CLASSIFIABLE` plus the phase-action taxonomy warning for the 10 Magic Resistance siblings. A does not redefine taxonomy during migration synchronization.

S independently proved all 30 selected abilities are structurally identical, excluding identity fields, to the three accepted Artoria Alter representatives from B18/R12, B19/R13, and FB2-10/R29 (`STRUCTURAL_MISMATCHES=0`).

## Independent A recertification

- `npm.cmd run typecheck`: PASS.
- FM03 authoring + FB2-10 + B18/B19 focused: `21/21 PASS`.
- content validation: PASS, `0` blockers.
- deterministic generated content: PASS; hashes unchanged.
- runtime diff from S base: `0`.
- `git diff --check`: PASS.
- S evidence: all rules `292/292 PASS`.
- S standard parallel full CI: `704/705` with only the known eleven-round 5s wall-clock timeout; isolated match-session `26/26 PASS`; equivalent single-worker full CI `705/705 PASS`.

## Gate state

A certifies `MIGRATION_SYNC_CANDIDATE`, not final migration acceptance. P3-R30 is READY on this exact A-synchronized lineage and must independently judge FM03.
