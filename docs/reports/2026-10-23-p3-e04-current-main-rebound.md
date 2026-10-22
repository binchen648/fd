# P3-E04-A111 Current-Main Execution Re-attestation

- Task ID: `P3-E04-A111`
- Control Epoch: `FD-P3-2026-09-23-04`
- Main SHA: `a42b5e1c517141b90f3407773958b0d8afe63264`
- Matrix artifact: `artifacts/phase3-e04-current-main-rebound-20261023.json`
- Normalized matrix SHA-256: `b5efdf311e29d24df518c86576542577b8011525838c0563a5278fb62fc54c93`
- Role: Codex A / Automation / Coverage / Evidence
- Credit change: `NONE`

## Recomputed Accounting

- accepted: `111`
- denominator: `944`
- remaining: `833`
- duplicates: `0`
- missing: `0`
- allowed cross-batch overlaps: `2` (servant.drake.skill.sc-drake-1, servant.tomoe.skill.sc-tomoe-1)
- illegal duplicate IDs: `0`
- generated registry missing: `87`
- Gate C required/pending identities: `111`
- unexpected material ids outside accepted numerator: `35`

## Status Summary

- `EVIDENCE_BINDING_GAP`: 111
- `MAIN_EXECUTABLE_GATE_C_NOT_REQUIRED`: 0
- `MAIN_EXECUTABLE_GATE_C_PENDING`: 0
- `MAIN_EXECUTABLE_VERIFIED`: 0
- `RUNTIME_REGRESSION_FOUND`: 0

## Family Summary

- `ALTER_EGO_TRANSFORM`: 10
- `ANY_LOCATION_EXCEPT_WORKSHOP_MOVEMENT`: 12
- `CURRENT_MAIN_PLAYTEST_BASELINE`: 22
- `GAME_START_RULE_OVERRIDES`: 10
- `INDEPENDENT_ACTION`: 11
- `PRESENCE_CONCEALMENT`: 12
- `SABER_MAGIC_RESISTANCE_AND_NOBLE_BLOOM`: 10
- `SOURCE_PLAY_BASIC_DRAW`: 14
- `TERRITORY_CREATION`: 10

## Gaps

- Runtime semantic gaps: `0` recorded by this automation run.
- Evidence binding gaps: `111`
- Gate C pending identities by identity field: `111`

## Non-Claims

- This report does not grant migration credit.
- This report does not mark any identity `PROMOTED_ON_MAIN`.
- This report does not create `E2E_VERIFIED` conclusions.
- Family representative evidence is not treated as identity-specific Gate C proof.
- Generated registry presence is measured from `data/generated/fd-playtest-v1.content-library.json` only; frozen inventory presence is not substituted.
- Current-main execution status is evidence-bound only when report existence, expected SHA, accepted verdict, and canonical identity match all pass.

## Execution receipts

- Matrix generation command exited `0` and emitted the artifact/report above.
- Targeted command `npm exec vitest run scripts/tests/phase3-a111-current-main-execution-matrix.test.ts` exited `1` during Vitest startup because `vitest/config` could not be resolved from `vitest.config.ts` (`ERR_MODULE_NOT_FOUND`). This is an environment/dependency startup failure, not a test pass and not evidence that the matrix is invalid.
