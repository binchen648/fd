# A3 Reference Test Timeout Disposition

- Recorded: 2026-10-09
- Epoch: FD-P3-2026-09-23-08
- Task: P3-E08-RP-00-A3-RECONCILIATION
- Main at inspection: `fefcf4f7f5bd66ed7693889fb99391e6e7321016`
- Implementation: `482d54bde108ffd54015a025044f58eccd8d722f`
- Evidence carrier: `18846c4744226dfe1ebe88b28bd64768afab67f9`
- Overall state: REVIEW_RECONCILIATION_REQUIRED
- Promotion authorization: NOT_GRANTED

Record implementer evidence as 183/184 files, 1411/1412 tests, with the
authorized MatchSession test passing at 6799ms and focused 33/33 PASS. This
is producer evidence, not a new independent acceptance. The remaining failure
is scripts/tests/phase3-reference-lock.test.ts:61 at 5179ms vs default 5000ms.

## Codex A Scoped Authorization

Continue on the current A3 candidate lineage. Add only
`scripts/tests/phase3-reference-lock.test.ts` to the previously authorized paths.
Reserve this test file for Codex A after checking competing writers.

The authorized invocation is named:
`verifies repository, exact commit, clean checkout, required files, and SHA-256 digests`.
Set its local timeout to 15000ms. Preserve its fixture Git commands, commit,
clean-checkout verification and every digest/identity assertion. Do not edit
the Reference verifier implementation, mock Git, alter fixture semantics or
change suite/global timeouts or Vitest worker counts. Report any new semantic
failure rather than treating it as another timeout adjustment.

The observed test launches several real Git processes. Full-suite contention
is a plausible explanation, not a confirmed general root cause. Record focused
and full-suite durations and basic worker/environment information. Do not claim
that local timeout changes prove absence of performance regressions.

Run the Reference suite, authorized MatchSession/recount focused suites,
typecheck, diff-check and one fresh default full test:ci on the repaired
implementation. Collect test-level timings with a supported reporter when
available without changing scheduling. Preserve historical failures and exact
tested SHAs in fresh evidence. Retain other required A3 evidence bindings.

If the default full suite passes, return one complete fresh carrier for
Reviewer A's overall review. A separate local-review round before that full
result is not required. If another default-timeout failure appears, stop the
sequence of one-test amendments and return consolidated timing evidence for a
single CI resource diagnosis; do not increase more timeouts automatically.

Reviewer A verifies the complete A3 diff and an independent full-suite result,
then supplies the applicable GitHub-bound verdict. Codex I waits for overall
acceptance and updates the existing single A3 PR #545 only afterward. No new
Epoch, no extra mandatory governance PR, no new coverage or migration credit.
Gate C and long-term stability remain NOT_VERIFIED; historical missing assets
remain a Release blocker. C01 and separately authorized runtime work are not
dependencies of this evidence repair.
