# P3-E08-CI-01 Current-Main CI Stability

Control Epoch: `FD-P3-2026-09-23-08`

Planner publication: `e34642c51422d4580a5937225627edf30341b0cf`
at `origin/codex/planner-p3-e07-control`, dispatch
`docs/agents/P3-E08-CI-01-EVIDENCE-DISPATCH.md`.

Base: `7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`

Implementation SHA: `b5a76f8d2c8a742c2b4d8910c6c77ed00d7461e6`

The evidence carrier is the subsequent commit containing this report and the
artifact. Its exact SHA is returned after commit in the handoff; it is not
embedded in its own contents. Its direct parent must be the implementation SHA.

Branch: `codex/a-p3-e08-ci-01-current-main-replay`

Artifact: `artifacts/phase3-e08-ci-01.json`

Artifact SHA-256: `D533972A2BA41BBA637231F5B738BCBD764026D2274A4C85EE60D9F555086398`

Status: `READY_FOR_REVIEW`; Reviewer verdict: `NOT_STARTED`.

## Diagnosis and Measurement

The supported diagnosis is `TEST_TIMEOUT_UNDER_FULL_SUITE_LOAD`. Historical
source evidence `13b8096b66a430c8327d4e36ac07e735a21a10b2` records the Reviewer
failure on `2ef7e2994919ed60858c19696307d0140a3b122e`: the target test took
`5463ms` against the default `5000ms` timeout. The historical implementation was
`0e6acd0c4017a00f689c422260808e09b13225ed`; its `184 files / 1411 tests` result
is provenance only and is not reused as current-main verification.

On current main, the unmodified focused suite passed `37/37` with the target
taking `1452ms`. The unmodified full suite passed `183 files / 1409 tests` in
`26404ms` wall time, with the target taking `3883ms`. Thus the timeout did not
recur in this baseline run, while the load increased its duration substantially.
These observations support the timeout diagnosis; runtime performance was not
audited.

## Minimum Replay

The implementation's direct parent is the exact main base. The only implementation
change adds local `15_000ms` to the existing three-round MatchSession regression
at `packages/rules/tests/regression/complex-skills-regression.test.ts:1559`.
Its assertions, global timeout, worker configuration, runtime and authoring are
unchanged. The old branch lineage was not merged.

## Actual Verification

- `npm ci`: exit `0`; 239 packages added, 12 npm audit advisories reported.
- Initial focused run immediately after install: exit `1`, no tests collected
  because `@fd/content` dist exports had not been built. The repository Test
  workflow runs `npm run typecheck` before tests; applying that setup resolved it.
- Baseline `npm run typecheck`: exit `0`.
- Baseline focused: exit `0`, `1 file / 37 tests`, target `1452ms`.
- Baseline default `npm run test:ci`: exit `0`, `183 files / 1409 tests`,
  target `3883ms`, wall time `26404ms`.
- Patched focused, immediately before the implementation commit with identical
  code: exit `0`, `1 file / 37 tests`, target `1406ms`.
- Implementation `npm run typecheck`: exit `0`.
- Implementation default `npm run test:ci`: exit `0`, `183 files / 1409 tests`,
  target `3882ms`, wall time `24336ms`.
- `git diff --check 7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0..HEAD`: exit `0`.

The artifact records the exact baseline and implementation identities for these
commands. Evidence-only generation uses those completed results; no additional
full-suite repetition is claimed.

## Review Boundary

Main coverage, denominator and migration credit deltas are all `0`. Gate C,
GitHub required checks, promotion and long-term CI stability remain
`NOT_VERIFIED`. The previously recorded `93 MISSING_IMAGE` Release blocker is
retained; this task did not re-audit source assets. Runtime legacy paths are
untouched. Independent Reviewer A must review the exact evidence carrier before
the single CI-stability Promotion PR proceeds through Codex I.
