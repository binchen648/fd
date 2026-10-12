# B11 Integration Closure Test Stability Authorization

Date: 2026-10-12. Owner: Planner. Epoch: FD-P3-2026-09-23-09.
State: A_CONTRACT_REPAIR_FAILED_REVIEW_TEST_STABILITY_AUTHORIZED.

This supplements `P3-E09-B11-INTEGRATION-CLOSURE-REPAIR.md` and does not
change its runtime, governance, promotion or accounting boundaries.

## Exact Failure Registration

Reviewer A reported `FAIL` for the current integration-closure candidate.

- Reviewed carrier: `cfa6a925...`.
- Worktree: clean.
- `git diff --check`: PASS.
- Claimed focused result `66/66 PASS`: NOT REPRODUCED.
- Fresh command:
  `npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts --maxWorkers=2`
- Fresh result: `43 passed / 3 failed / 20 skipped`, plus hook timeout and
  `onTaskUpdate` RPC timeout.

Observed timeout locations:

- `scripts/tests/phase3-e09-b11-final-binding.test.ts:68` hook timeout.
- `scripts/tests/phase3-e09-b11-final-binding.test.ts:122` 5s timeout.
- `scripts/tests/phase3-e09-b11-final-binding.test.ts:240` 5s timeout.
- `scripts/tests/phase3-readiness-preflight.test.ts:133` 5s timeout.

The failure class is test/evidence execution stability in existing
evidence/preflight suites. It is not accepted as a runtime, client, server,
authoring, migration, coverage KPI, Gate C or promotion failure.

## A: Limited Stability Repair

Task: `P3-E09-B11-INTEGRATION-CLOSURE-TEST-STABILITY`. Owner: Codex A.

Start from the exact failed closure line unless Reviewer A identifies a newer
authoritative carrier. Preserve all accepted source and review evidence.

Authorized write paths are limited to:

- `scripts/tests/phase3-e09-b11-final-binding.test.ts`
- `scripts/tests/phase3-readiness-preflight.test.ts`
- `scripts/tests/phase3-contract-parity.test.ts`
- `scripts/phase3-preflight.ts` (only the exact authorization consumption below)
- `scripts/fixtures/phase3-e09-b11-integration-binding.json`
- `artifacts/phase3-e09-b11-integration-evidence-binding.json`
- `docs/reports/2026-10-12-p3-e09-b11-integration-evidence-binding.md`

Allowed changes:

- split slow all-in-one assertions into smaller deterministic cases;
- move expensive Git/object setup into explicit fixture preparation that is
  bound by hash and reused inside the same test file;
- raise only the local timeout for the named evidence/preflight tests or their
  named `beforeAll` hooks when the assertion semantics are unchanged;
- reduce redundant repeated Git graph walks when the checked object set is
  byte-identical and the artifact records the source hashes;
- improve raw receipt recording for the focused command and default CI.

### Exact Preflight Authorization Continuation

Planner supplements authorization commit
`bd0dabe80c40cdc3bae024303b68851d11f980b2` to close the mismatch between its
authorized test changes and the integration preflight contract.

Codex A may modify `scripts/phase3-preflight.ts` solely to consume the exact
test-path authorization in that commit for this B11 integration-closure task.
The newly admitted test delta is limited to:

- `scripts/tests/phase3-e09-b11-final-binding.test.ts`
- `scripts/tests/phase3-readiness-preflight.test.ts`
- `scripts/tests/phase3-contract-parity.test.ts`

Bind the authorization to its full commit SHA, task, candidate lineage and
actual path set using the existing contract representation. Preserve existing
hash, ancestry, review-reference and historical/current snapshot checks.
This is authorization consumption, not acceptance of arbitrary content in
these files; Reviewer A must review the actual changes.

Do not admit a directory, glob, all tests, or arbitrary Planner commits.
Unknown paths and absent, forged or mismatched authorization must still fail
closed. Add positive and negative regression cases in the already authorized
`scripts/tests/phase3-readiness-preflight.test.ts`: the exact authorized parity
test delta is accepted, while an extra path or invalid authorization is rejected.

Include this supplemental Planner commit in the final packet. Re-run the
integration evidence preflight on the completed carrier in addition to the
verification below. A preflight PASS does not grant promotion acceptance.

Not allowed:

- no runtime/client/server/source behavior changes;
- no workflow, package script, dependency, global Vitest config, retry, skip or
  concurrency change;
- no weakening of unknown-delta, stale-hash, forged-review, wrong-candidate,
  runtime-drift or extra-file negative checks;
- no removal of the real rejected-artifact regression;
- no promotion, PR creation, Gate C, credit or release claim.

The repair must keep every semantic assertion intact. If a timeout is raised,
the report must identify the exact test/hook, old timeout, new timeout, measured
duration and why this is a test-infrastructure bound rather than a candidate
behavior acceptance.

## Required Verification

A must freeze one new carrier and provide a single packet with:

- the exact previous failed carrier and this Planner authorization commit;
- focused command above repeated at least twice in the same clean worktree;
- default `npm run test:ci` once, with full stdout/stderr receipt hashes;
- `npm run typecheck`;
- `git diff --check`;
- explicit statement that runtime/source files were not modified.

If focused tests still fail, stop and return the full remaining blocker set.
Do not add a second stability repair without Planner review.

## Reviewer A

Reviewer A reviews only:

- whether the timeout/performance repair is limited to the authorized tests;
- whether all original evidence/preflight negative checks still execute;
- whether the previously failing focused command is reproducibly green;
- whether full CI was recorded, not merely summarized.

Reviewer A must not grant runtime acceptance, Gate C, promotion or credit.

## Downstream

If Reviewer A returns PASS, the flow returns to the existing closure sequence:

1. G binds the new A carrier and new RA artifact.
2. I assembles the actual post-RA/post-G HEAD.
3. I runs integration evidence preflight and ancestry/policy preflight on that
   actual HEAD before creating the single B11 promotion PR.

All credit deltas remain zero; accounting remains `111/944`. The 93 missing
images, Gate C and long-term CI stability remain separate blockers.
