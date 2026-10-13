# FD-EVID-005: Producer test counts do not reproduce at independent review

Status: SOURCE_VERIFIED_DRAFT; independent knowledge review pending.
This records historical evidence; it grants no current runtime acceptance.

## Identity

- Failure ID: FD-EVID-005
- Risk: MEDIUM
- Runtime domains: evidence-tooling
- Files: `scripts/tests/phase3-e09-b11-final-binding.test.ts`, `scripts/tests/phase3-readiness-preflight.test.ts`
- Semantic contracts: EXACT_EXECUTION_RECEIPTS, REPRODUCIBLE_REVIEW

## Evidence

- Source task/PR: P3-E09-B11-INTEGRATION-CLOSURE-TEST-STABILITY
- Reviewed exact SHA: cfa6a92551a939709b85a787d9044e19ec00f0ef
- Reviewer verdict: Historical FAIL retained inside later scoped PASS
- Source commit: dbd430be9550947a2bac691ef645db56cf5c408f
- Artifact: docs/reviews/phase3/P3-E09-B11-b5e6844-integration-closure-reviewer-a.json
- Raw Git SHA-256: a0f4b6ff474b169b36e7ff18092ad93e7f29a573c7e2a0c85bf299011ab0e5a9
- Input and observed result: Historical producer claimed focused 66/66; reviewer result was 43 passed / 3 failed / 20 skipped plus hook/RPC timeouts. Later reviewed carrier b5e6844 preserves the failed packet and independently records 88 passing focused tests.

Planner read the source and independently hashed its raw Git bytes. Planner
has not rerun the probe or substituted its own technical verdict. Verify the
artifact at the pinned commit, not a moving file path.

## Root Cause

UNKNOWN for the complete hook/RPC root cause. Expensive synchronous Git fixture work is a hypothesis; later measured scoped repair is evidence of mitigation, not proof of every cause.

## Failed Approach

CONFIRMED: producer summary alone did not prove reproducibility. Do not invent a failed blanket-timeout remedy; that historical approach is UNKNOWN.

## Prevention

- Required invariant: Counts bind command, tested SHA, exit code, skipped tests, errors and raw outputs. A scoped PASS does not certify later actual assembly.
- Forbidden pattern: Transferring old test results to a new SHA; masking nonzero exit or skipped/unhandled failures; declaring assembly PASS from producer-only tests.
- Required negative test: Run the exact fixture suites in producer and assembled contexts; retain failing receipts and hash/source negatives. Reproduce reviewer failures before classifying them.
- Test paths: `scripts/tests/phase3-e09-b11-final-binding.test.ts`, `scripts/tests/phase3-readiness-preflight.test.ts`
- Historical test status: EXISTS; scope is b5e68444f55ea9fc1a86a9eea0ea0bedce3de229.
- Relevant command: `npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts --maxWorkers=2`
- Current-main coverage: NOT_VERIFIED. Suites exist on candidate. Actual assembly lifecycle remains a separately active repair (Planner 6ea26f3b); this lesson does not accept it.

## Applicability

Load for a task changing the listed files, contracts or runtime domains. Match
by task metadata rather than card names alone. Excluded: Documentation with no execution-result or test-fixture claims.
No live runtime edit or heavy test run is authorized by this case. Original
contracts, review scopes and writer reservations govern actual work.

