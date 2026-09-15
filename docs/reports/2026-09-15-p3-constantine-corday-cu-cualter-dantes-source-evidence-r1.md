# P3 F1 Source Evidence — Constantine / Corday / Cu Alter / Cu / Dantes R1

- Role: S source-evidence / semantic-normalization candidate
- Base accepted R: `9ac11fb3f5221729d897aff850394fbae87cabab`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 15 identities (Constantine 3, Corday 3, Cu Alter 3, Cu 3, Dantes 3)
- Source replay: 15/15 exact printed-text bindings

## Locked development evidence

- `Fate_Domination-开发版/batch_lancer_rider.js` — `4123b4e5f01a099eb7e0bb04a3aaf5366bdcd6aa6f4eb02d6dd498b6b65a7f0f`
- `Fate_Domination-开发版/batch_caster_assassin.js` — `d6f1b5d4173f437d6592904a73def7006065d8e8ac8ed333e1cbec733f3a5bc0`
- `Fate_Domination-开发版/batch_berserker_extra.js` — `6bf26e40ff08ff632ac5dcee88a9cda4684e60ca71c39adadbb239d1f3723fdc`
- `Fate_Domination-开发版/data_servants.js` — `6da31ebdf36561c550dfe9725963a71496705050e90a8b5a87464f501ee43ae3`

## Classification

- READY_GENERIC_EXTENSION: 2
  - `servant.constantine.skill.sc-constantine-1` (Riding pattern)
  - `servant.cu.skill.sc-cu-2` (move to any non-workshop location)
- SPECIAL_HANDLER_CANDIDATE: 13
- No runtime acceptance was inferred from Reference handlers.

## Recomputed state

- sourceGroundedCount: 642/944
- semanticBlockedCount: 302
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 229
- SPECIAL_HANDLER_CANDIDATE: 411
- SOURCE_EVIDENCE_REQUIRED: 302
- zeroSilentFallback: true
- automation audit: `EXACT_AGREEMENT`
- gapCount: 0

## Verification

- `npm.cmd run typecheck`: PASS
- Phase 3 focused suite: 6 files / 138 tests PASS
- `packages/rules/tests/match-session.test.ts`: 26/26 PASS
- `npm.cmd run test:ci -- --maxWorkers=2`: 84 files / 583 tests PASS
- `git diff --check`: PASS
- production runtime diff vs accepted base (`packages`, `src`): none

The default highly parallel full-CI run intermittently hit existing 5-second test timeouts under host contention. No timeout threshold or production/runtime code was changed; the same full suite passed with two workers.
