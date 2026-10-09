# B11 Tooling Minimum Contract

- Published: 2026-10-09
- Epoch: FD-P3-2026-09-23-08
- Owner: Codex A; independent automation review: Reviewer A
- Main at definition: `9a1689d2ec5b56b67d1483d2593b4ab809d6c15c`
- Status: PLANNER_IMPLEMENTATION_CONTRACT_REVIEW_REQUIRED
- Scope: task readiness diagnostics, not promotion policy

## Disposition Of Historical References

The historical phase3-preflight.ts consumes contractVersion=1 implementation
manifests. Current B11's task manifest is not that schema. Do not copy the old
validator and invent values merely to pass. Historical contract-parity.ts
compares supplied classifications; equal self-reported values alone do not
prove real compiler/runtime/coverage parity. The current command references
therefore denote required diagnostics defined below, not waived gates or
aliases to phase3:ci-gate. Historical candidate PASS is not inherited.

## phase3:preflight

Design target:
`npm run phase3:preflight -- --manifest PATH --candidate FULL_SHA --base FULL_SHA`

Read-only output: versioned JSON with taskId, epoch, exact inputs, issue codes,
paths and status PASS/FAIL. Exit 0 means only the specified readiness checks
passed; malformed/missing arguments exit 2, validation failures exit 1.

Require an explicit versioned task-check input schema. Support current B11 and
shared-socket task records through documented adapters; do not silently accept
arbitrary shapes. Input binds role, scope, authorized paths, full base/candidate
SHAs, canonical file/section references, dependency evidence and declared checks.

Verify commits exist, base is an ancestor of candidate, inspected files are
read from the specified commit, and complete base..candidate path changes
including deletions/renames fall within the declared authorization. Validate
task/epoch, required references, and each declared dependency's exact commit
and review artifact digest/conclusion. Distinguish pending dependency from
accepted evidence. Scope-check adapters must not expand another role's rights.
Undeclared paths, missing evidence, stale binding or unsupported schema fail.

Dirty worktree detection must be explicit. Commit-based diagnostics may inspect
a dirty checkout but cannot claim it represents the working tree. Check results
must identify their actual tested SHA; no new runtime acceptance or automatic
reviewReady toggle. Promotion head/base, human approval and GitHub policy remain
owned by the existing promotion gate.

## phase3:contract-parity

Design target:
`npm run phase3:contract-parity -- --contract PATH --candidate FULL_SHA`

Input binds a contract ID/version, exact candidate, fixture IDs/digests and
applicable owners: runtime, compiler, inventory and coverage. Declare the
meaning of routeCandidate and exactEligible per owner, including the mapping
from real API outputs. If an owner has no comparable classification API,
return NOT_EVALUATED with reason; never fill it with expected values or alias
another owner's observation. Required unavailable observations fail readiness.

Require positive eligible, owned malformed/reject and outside-scope fixtures;
exercise identity variations and binding graph boundaries relevant to B11.
Fixtures/expected semantics must derive from the canonical references and
explicit contract, independently reviewed by the applicable reviewer before
their agreement is used as an acceptance premise. A may build adapters to
existing exported APIs; changes to runtime APIs or semantics are handed to B.

Collect observations by invoking the real APIs against candidate code in an
isolated checkout, or consume reproducible exact-SHA execution artifacts whose
producer, fixture hashes and tested inputs can be verified. Matching unverified
JSON is insufficient. Output records actual classifications, applicability,
disagreements, input hashes and execution method. Route agreement does not
prove effect correctness, fallback closure or browser acceptance. Exit 0 only
when every required applicable observation agrees with accepted expectations.

## Implementation And Handoff

A owns tooling files, package script entries, documented task-check fixtures,
automation tests and evidence. Coordinate package.json/tooling writer locks;
do not replace existing policy tests or change phase3-governance.ts, workflows,
coverage KPI, taxonomy, runtime or authoring semantics. Historical source is
design evidence only. Add meaningful tests for stale SHA, missing dependency,
unauthorized deleted path, unsupported schema and real parity disagreement.

Implement on the designated B11 automation line, keep old evidence immutable,
and report the exact tooling candidate and independent Reviewer A verdict.
Run the diagnostics on the final B11/socket/coverage combination and return
their exact inputs/results. A blocked upstream Runtime observation stays
blocked until B supplies its contract/API; do not substitute a waiver.

Codex G is needed only if implementation changes promotion policy. This task
does not add a governance approval round, create a new Epoch, grant acceptance,
or authorize promotion. Existing B11 ready=false may be updated by its owner
only after the actual declared prerequisites and fresh reviews are complete.
