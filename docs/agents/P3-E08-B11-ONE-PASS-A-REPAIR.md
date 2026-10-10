# B11 One-Pass A Repair

Published: 2026-10-10. Epoch: FD-P3-2026-09-23-08.
Task: P3-E08-B11-CI-AND-BINDING-FINALIZATION.
Owner: Codex A; RA independent review; RB retains runtime authority.
Status: AUTHORIZED_SCOPED_IMPLEMENTATION_AFTER_RESERVATION_CHECK.

## Inputs And Disposition

Base: 11c1985dc4c72151bbf16298292bf4b7fa29fcab.
Main anchor: 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c.
The supplied diagnosis reports default CI exit 1 with 193/1507 passing but
onTaskUpdate RPC failure; maxWorkers=2 exits 0 at the same SHA. This supports
resource contention, not a conclusive root cause or long-term stability claim.
Planner authorizes a bounded concurrency mitigation and one consolidated
binding repair, not suppression of worker errors or unconditional readiness.

## Write Scope

Inherited evidence repair paths remain governed by 8eb752c1 and b2ff7441.
For this task write only:

- package.json: append --maxWorkers=2 to test:ci, preserving existing exclusions
  and all other command behavior; no other scripts or dependencies changed.
- scripts/fixtures/phase3-b11-task-check.json: exact review/check bindings.
- artifacts/phase3-e08-b11-final-combination-evidence.json: explicit continuation.
- docs/reports/2026-10-10-p3-e08-b11-final-combination-evidence.md: continuation.
- artifacts/phase3-e08-b11-ci-and-binding-finalization.json (new).
- docs/reports/2026-10-10-p3-e08-b11-ci-and-binding-finalization.md (new).

Reserve package/tooling/evidence paths, use a clean isolated worktree and do
not compete with any existing writer. No runtime, workflow, vitest config,
timeouts, assertions, retries, test skips, RPC limits or lockfile changes.
Existing frozen packet bytes stay available by exact historical commit/hash.

## Single Execution Packet

1. Apply only the test:ci concurrency cap. It is the new declared repository
   default, not the old default retroactively passing. Record old failure.
2. Freeze the implementation/source SHA. In a quiet environment run the new
   npm run test:ci twice sequentially. Record all exits, unhandled errors,
   counts, versions and durations; never select only a successful run. A new
   failure requires returning the exact blocker, not another timeout patch.
3. Run focused evidence checks, typecheck, content validation, generated
   determinism and diff-check. Execute component/server/browser checks on
   the final combination, or reuse exact prior receipts only with complete
   relevant source/execution-config equivalence and reviewer consent. Bind
   actual testedSha, receipt hash and accepted scope; do not invent reruns.
4. Retrieve RA/RB immutable artifacts and original authority for all pending
   paths. Existing scoped verdicts are dependencies, not final combination
   acceptance. RA's new scoped PASS must be persisted by RA, never by A.
5. For seven B paths and two runtime overlaps, keep absent historical authority
   UNPROVEN. The API exposure dispatch does not authorize semantic repair.
   This task does not authorize retroactive runtime adoption; present the
   unresolved exact deltas together for Planner disposition. If that requires
   a policy exception, G must handle it; A cannot relax preflight instead.
6. Bind all three check references to real execution receipts and reviews.
   Pending reviews stay pending. Add this exact Planner authorization for
   the package.json change; do not authorize package.json's prior deltas by
   inheritance. Preserve independent path/scope checks for the 33 A/R paths.
7. Produce one frozen evidence carrier and one final packet for parallel RA/RB
   review. Record source-to-carrier blob equivalence, ancestry and dirty state.

Readiness becomes a candidate claim only if all required references and checks
actually pass; formal acceptance remains with reviewers. Missing authority
or verdict is a real blocker, not permission to fill a field optimistically.

## Completion Boundary

A can finish its implementation and binding work in one handoff without
waiting for a separate sync cycle per review. It cannot guarantee full closure
of missing independent decisions. Return all remaining blockers together.
RA reviews the command mitigation and evidence contracts; RB reviews affected
combined runtime acceptance, without new B implementation work on current facts.
I waits for explicit Planner promotion authorization and GitHub required checks.
No role-level PR or C01 dispatch. 93 MISSING_IMAGE remains a separate Release
blocker. Credit delta=0; ledger 111/944; Gate C and Release readiness ungranted.
