# FD-FIXTURE-006: Moving outer HEAD imports unbound post-review evidence

Status: SOURCE_VERIFIED_DRAFT; RA knowledge review pending. No runtime verdict.
Risk: HIGH. Domains: evidence-tooling, integration.
Contracts: EXPLICIT_TEMPORAL_FIXTURE, EXACT_REVIEW_REFERENCE.
Files: scripts/tests/phase3-e09-b11-final-binding.test.ts,
scripts/tests/phase3-readiness-preflight.test.ts, scripts/phase3-preflight.ts.

## Exact Evidence

- Failed assembly: 487ab81a8e3fabf75eea5a73cd3582b37cf65520.
- Original I CI: exit1, 192/194 files, 1578 passed / 2 failed / 20 skipped.
- Persisted packet: 1ce0b406ecf1e7389886bd2962e9e28f0d7d444b at
  artifacts/phase3-e09-b11-integration-evidence-binding.json.
- SHA-256: e8fd40e8b0f74701755cdab3135d58e0dc3a7c08aac7c4da9652bb622b38103e.
- Source pointer: /previousIntegrationFailure/receipt, original I stdout/stderr
  bytes, exact failed head, times, exit and SHA-256; K01 validates embedded bytes.
- Diagnostic authorization: 6ea26f3bc12fc3bda37b6b2607fd6edda452eee3,
  docs/agents/P3-E09-B11-TEMPORAL-FIXTURE-FINALIZATION.md, independently bound
  by the K01 audit. This is Planner diagnosis/authority, not runtime review.

## Fact, Cause And Failed Approach

CONFIRMED within inspected source and original I receipt: producer fixtures
checkout executing HEAD, import its real RA file, and call strict validation
with stage PRODUCER and empty current references. The validator rejects
Unknown integration delta for that unbound file. The readiness test expecting
an extra unknown test path instead hits the inherited RA file first. A final
binding hook also aborts. Earlier focused producer success did not demonstrate
the suites' portability after RA/G evidence was appended.

This is fixture lifecycle error, not a new B11 runtime regression, not a wrong
hash or forged RA. Do not change semantic routing or make validation permissive.

## Invariants And Negative Obligations

Use named immutable pre-review data, execute validator from the tested source,
and explicitly supply candidate/RA/G/synchronization/actual-head references for
ASSEMBLED checks. No automatic phase inference based on discovered files.
Unbound producer RA, forged/missing/unrelated refs, wrong stage/head, unknown
paths and runtime drift still reject. No directory whitelist or skipped test.
Validate the same focused and default CI at producer and post-review checkouts,
bind all source objects and raw receipts. Synthetic PASS proofs are test data,
not technical acceptance or a real GitHub statement.

## Test Status And Limits

At f1b3588b0b9eb4be943fa127ae24409e067566bf, the two fixture suites use fixed
b5e68444 pre-review data; explicit real assembly and temporal binding negatives
are present. The A packet records focused95/95 and default194/1607 on both the
implementation and synthetic assembled994943f9. K01 verifies receipt binding
and source presence only, does not execute suites or issue independent PASS.
The source packet remains IMPLEMENTATION_COMPLETE_CANDIDATE and current review
is pending in that packet; it is not an immutable RA verdict. Current-main
dynamic conformance and eventual real I post-new-RA/G execution are unverified.
Applicable command, NOT RUN by K01:
`npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts scripts/tests/phase3-contract-parity.test.ts --maxWorkers=2`.

Load for evidence/preflight fixture or final assembly changes; unrelated pure
card rules are out of scope. Knowledge extraction grants no writes to B11 and
no promotion, Gate or credit. Keep FD-EVID-005's uncertain hook/RPC cause separate.
