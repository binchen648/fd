# P3-E08-CI-01 CI Stability Diagnosis

Control Epoch: `FD-P3-2026-09-23-07`

Base: `b6375c4889009497e7dd9c98e83c1d2ce0da10d9`

Candidate: `0e6acd0c4017a00f689c422260808e09b13225ed`

Machine artifact: `artifacts/phase3-e08-ci-01.json`

Machine artifact SHA-256: `8B91FEEC60DB9C4E9A94B8E2681F0FD7D948E53E5FD58A157DB99DC5C22250E0`

## Root Cause

The reported exact candidate failed the default full suite at
`packages/rules/tests/regression/complex-skills-regression.test.ts:1547`.
The test itself remained semantically green (`37/37` in isolation); the
failure was the default Vitest `5000ms` test timeout under full-suite load.
This is classified as `TEST_TIMEOUT_UNDER_FULL_SUITE_LOAD`, not a runtime
semantic defect or assertion failure.

Measured baseline:

- isolated complex-skills suite: `37/37 PASS`, about `1.96s` test time;
- observed full-suite failure: `5463ms`, over the default `5000ms` budget;
- repeated baseline full suites on the reconciliation branch: `184/184`
  files and `1411/1411` tests passed in about `27.20s` and `26.61s`, showing
  the failure is load-sensitive rather than deterministic.

## Minimum Fix

The single three-round MatchSession regression now has a local `15_000ms`
timeout. No global timeout, Vitest worker setting, assertion, runtime file,
authoring file, coverage rule, or migration accounting was changed.

## Verification

- `npx vitest run packages/rules/tests/regression/complex-skills-regression.test.ts`:
  `37/37 PASS`;
- `npm run test:ci`: `184 files / 1411 tests PASS`, about `26.96s`;
- `npm run typecheck`: `PASS`;
- `git diff --check`: `PASS`.

## Boundaries

This slice only addresses CI test stability. It does not promote any Gate,
change `111/944`, add migration credit, or resolve the `93 MISSING_IMAGE`
source-asset Release blocker. It is ready for independent Reviewer A review.
