# B11 Evidence Contract Continuation

Published: 2026-10-10. Epoch: FD-P3-2026-09-23-08.
Task: P3-E08-B11-EVIDENCE-CONTRACT-CONTINUATION.
Owner: Codex A. State: AUTHORIZED_AFTER_EVIDENCE_PATH_RESERVATION.

## Disposition

Observed blocked carrier: 4d911906c00b0d0309f82adefb96cd8680baa6da.
Its implementation: f4cdad92f129d26a75aac207ecedc991d40a653c.
Original default-CI failure and two subsequent preparation failures remain
historical evidence. Missing dist collection failures do not show runtime
regression or successful RPC mitigation. No new runtime task is assigned.

This extends 08e2f8cb (one-pass repair) and 8eb752c1 (evidence repair), not
historical runtime authority. No new Epoch, policy waiver or automatic PASS.

## Authorized Implementation Paths

- scripts/phase3-e08-b11-coverage-sync.ts
- scripts/tests/phase3-e08-b11-coverage-sync.test.ts
- scripts/tests/phase3-e06-post-merge-recount.test.ts
- scripts/phase3-preflight.ts
- scripts/tests/phase3-readiness-preflight.test.ts
- scripts/fixtures/phase3-b11-task-check.json
- artifacts/phase3-skill-coverage.json
- artifacts/phase3-e08-b11-final-combination-evidence.json
- docs/reports/2026-10-10-p3-e08-b11-final-combination-evidence.md
- artifacts/phase3-e08-b11-ci-and-binding-finalization.json
- docs/reports/2026-10-10-p3-e08-b11-ci-and-binding-finalization.md

Confirm no competing writer. No workflow, runtime, parity semantics, package
dependencies, timeout, classifier or governance edits. The already authorized
package.json maxWorkers=2 change remains; no additional package edit here.

## Contract Requirements

Support a documented versioned authorization continuation in current-mode
evidence and preflight inputs. Bind original and continuation commit/path/blob
and SHA-256, task/epoch, source/tested/carrying SHAs and each exact changed path.
Verify actual pinned authorization bytes and actual delta, not labels or a
union of unverified caller-provided allowlists. Only the documented A-owned
paths and test:ci concurrency change may be admitted by these continuations.
Read authorization from pinned Git objects even if not on main; expose its
publication status. Do not invent authority for seven historical B paths.

Preserve legacy historical validation unchanged. Keep exact complete path
coverage, compilation, source hashes, ancestry and historical artifacts.
Unknown schema/version/keys fail. Add explicit current-version receipt/review
fields rather than arbitrary extra keys. Accepted review requires real exact
artifact identity/hash/scope. Execution success and review acceptance remain
separate; unavailable acceptance stays pending. No pending-to-PASS shortcut.

Tests must reject forged/missing continuation, unauthorized paths, altered
commands, tampered receipts, stale testedSha, mismatched review scope and
historical snapshot drift. A positive case covers only the exact authorized
concurrency delta and properly bound evidence. No broad semantic waiver.

## Preparation And Validation Order

1. Use a clean isolated checkout from the blocked carrier; apply scoped fixes.
2. Run npm ci, then npm run typecheck as the existing workflow does. Verify
   required workspace dist exports exist before claiming CI preparation.
3. Run evidence focused tests and historical/current producer validation.
   Deterministic assertion failures must be repaired within scope before
   full CI. Preflight may still FAIL for true missing runtime authority or
   independent acceptance; do not weaken it to pass preparation.
4. Freeze implementation SHA and regenerate exact source-bound evidence.
   Run the revised default npm run test:ci twice sequentially, without other
   FD CI executions competing. Preserve all previous and new exits/counts.
   Stop for a fresh deterministic or out-of-scope error rather than retrying
   until success or adding another timeout. No unconditional stability claim.
5. Bind actual receipts for component/server/browser to the final combination
   using fresh execution or reviewer-approved exact source/config equivalence.
6. Freeze one consolidated carrier for parallel RA/RB review. Prior blocked
   packet consistency is historical input, not final candidate acceptance.

RA may review prior blocked consistency in parallel, but final review waits
for this frozen candidate; do not create a separate A sync for that prior
review. Publish exact commit/path/hash for each review. A collects both once.

Missing original B authority and scope acceptance stay visible for Planner/G
disposition. This task cannot guarantee overall readiness. Push failure is
publication pending; do not falsely claim a remote ref or create role-level
PRs. I waits. C01 remains undispatched. Credit=0; ledger 111/944; 93 missing
images remain a Release blocker; Gate C and Release readiness ungranted.
