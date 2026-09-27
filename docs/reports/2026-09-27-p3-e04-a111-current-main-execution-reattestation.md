# P3-E04-A111 Current-Main Execution Re-attestation

- Task ID: `P3-E04-A111`
- Control Epoch: `FD-P3-2026-09-23-04`
- Main SHA: `0e943a94e8bdab6335e34818278ecc90760015f0`
- Matrix artifact: `artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json`
- Normalized matrix SHA-256: `a73f98b464b4d54f42de4bdd3833adf86bbf690dcd0b14c6813df73b6cd9e6d2`
- Role: Codex A / Automation / Coverage / Evidence
- Credit change: `NONE`

## Recomputed Accounting

- accepted: `111`
- denominator: `944`
- remaining: `833`
- duplicates: `0`
- missing: `0`
- unexpected material ids outside accepted numerator: `35`

## Status Summary

- `EVIDENCE_BINDING_GAP`: 0
- `MAIN_EXECUTABLE_GATE_C_NOT_REQUIRED`: 0
- `MAIN_EXECUTABLE_GATE_C_PENDING`: 111
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
- Evidence binding gaps: `0`
- Gate C pending identities: `111`

## Commands and Results

| Command | Exit | Relevant result |
|---|---:|---|
| `git rev-parse HEAD` | 0 | `0e943a94e8bdab6335e34818278ecc90760015f0` |
| `git status --short` | 0 | only A111 script/test/report plus refreshed coverage artifact before commit |
| `npm ci` | 0 | dependencies installed; npm audit reports 10 vulnerabilities |
| `npm run content:validate` | 0 | `7 masters, 7 servants, 20 events, 0 blocking issues` |
| `npm run verify:generated-content` | 0 | content `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`; fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`; evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3` |
| `npm run phase3:coverage` | 0 | archives `127`, cards `169`, abilities `281`, compiled cards `76`, characters `14`, blockers `0`, new `22`, legacyExecute `3`, legacyResolve `144`, dual `0`, notClassifiable `112` |
| `npx tsx scripts/phase3-a111-current-main-execution-matrix.ts --generated-at 2026-09-27T00:00:00.000Z` | 0 | accepted `111`, denominator `944`, remaining `833`, duplicates `0`, missing `0`, unexpected material `35` |
| `npx vitest run scripts/tests/phase3-a111-current-main-execution-matrix.test.ts` | 0 | `1 file / 3 tests PASS` |
| `npm run test:complex-skills` | 0 | `1 file / 37 tests PASS` |
| `npm run typecheck` | 0 | TypeScript build PASS |
| `npm run test:ci` | 0 | `179 files / 1361 tests PASS` |
| `git diff --check` | 0 | PASS |

## Unexpected Material Outside Numerator

The matrix reports `35` frozen IDs that are present in current authoring
material but are not included in the accepted `111/944` numerator. They are
recorded in `unexpectedMaterialIds` and receive no credit in this task.

This prevents recovery-only or later stacked material from being counted as
current-main accepted execution conformance.

## Non-Claims

- This report does not grant migration credit.
- This report does not mark any identity `PROMOTED_ON_MAIN`.
- This report does not create `E2E_VERIFIED` conclusions.
- Family representative evidence is not treated as identity-specific Gate C proof.

## Final Status

`REVIEW_READY`
