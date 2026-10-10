# B11 Final Evidence Repair Authorization

Published: 2026-10-10. Epoch: FD-P3-2026-09-23-08.
Task: P3-E08-B11-FINAL-EVIDENCE-RECONCILIATION.
Owner: Codex A. Status: AUTHORIZED_SUBJECT_TO_EVIDENCE_WRITER_RESERVATION.
Integration Owner: WAITING. C01 dispatch: not authorized by this task.

## Exact Inputs

Main: 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c.
Implementation base: 46dbd031b06192e7e81479706678937064cdc1a3.
Scoped sync Review: b81acf2b4749a09b1dfc0a6f292dda442b7fdbd5.
Artifact SHA-256: 0C6D1224B80A1BA4EC6D5B617BC70C882B174C82452A7F22AF1614D4A526C9E0.
This review accepts scoped binding only, not final readiness/runtime/browser.

Source membership to register and verify, not accepted wholesale:

| Segment | Exact source |
|---|---|
| B11 production bridge | 7868b82949e3e17e64218755e0efe3ed478ff778 |
| Shared socket | d13ab485dc54398581568a5a66bd696d4459862d |
| API export | c0db16ae65699b2e2789c7776c0aa4271b11e496 |
| Ownership repair | 7ec91bbc26be0f63332d5cc8421b2c7c014906c5 |
| Adapter/fixture | 7a9699efcca8e16467cd973a7c7dd522e5a230a9 |
| Scoped evidence | 46dbd031b06192e7e81479706678937064cdc1a3 |

Verify full objects and source lineage. Do not import a whole stale branch.
Before editing, record evidence-domain ownership and exact path reservation.
If another writer owns an overlapping path, remain read-only until handoff.
Existing B runtime/server reservations remain intact; this is not their release.

## Authorized Write Paths

- scripts/phase3-e08-b11-coverage-sync.ts
- scripts/tests/phase3-e08-b11-coverage-sync.test.ts
- scripts/tests/phase3-e06-post-merge-recount.test.ts
- artifacts/phase3-skill-coverage.json
- scripts/fixtures/phase3-b11-task-check.json
- scripts/phase3-preflight.ts
- scripts/tests/phase3-readiness-preflight.test.ts
- artifacts/phase3-e08-b11-final-combination-evidence.json (new)
- docs/reports/2026-10-10-p3-e08-b11-final-combination-evidence.md (new)

Outputs or test-driven edits beyond these paths require additional authorization.
No production runtime, server, authoring, generated content, parity semantics,
coverage classifier/KPI, workflow, timeout, governance or old review edits.
Do not overwrite historical coverage-sync/recount artifacts or reports.

## Required Contract Repair

1. Separate immutable historical candidate validation from final source binding.
   Historical 7868b829 validation reads its pinned Git objects and historical
   artifact bytes. Final mode binds the new source candidate and full source
   trees/blobs explicitly. Preserve dirty/untracked checks, hashes, compilation,
   ancestry and coverage fingerprint validation. Do not simply remove drift
   rejection or allow any descendant. Unauthorized input changes still fail.
2. Historical recount verifies historical coverage at its pinned commit with
   all original assertions intact. Current coverage is checked independently
   against the final source candidate. Preserve exact scan locations for each
   respective source; do not normalize them away to manufacture equality.
   Add negatives for stale/mixed/tampered coverage and missing historical Git
   objects. Missing history fails, not skips. No credit is re-awarded.
3. Update readiness input through exact provenance segments. For every one of
   the reported 40 uncovered paths, record path, introducing delta/base/SHA,
   role, original authorization and accepted/pending scope. Registration is
   not acceptance. Unknown or unproven authorization remains a blocker.
   This authorization covers only the A repair paths above; it does not
   retroactively approve all 40 earlier paths or expand B's scope.
4. Any preflight adapter change must preserve full changed-path coverage,
   fail-closed schemas and exact dependency scope/SHA/hash verification.
   No directory wildcards, generic allow-all segments, pending-to-PASS mapping
   or stale checks re-labelled as current execution.

## Freeze, Execute, Review

Freeze one final source candidate after implementation. Evidence-only carrier
may descend from it; bind testedSha to the actual checkout and prove relevant
source blobs unchanged through the carrier. Never claim carrier tests that
were executed only on its parent. New check/review bindings may need a final
carrier update; do not fabricate self-referential commit hashes.

Generate one consolidated packet with provenance segments, exact source and
review hashes/scopes, commands/exits, test SHA, coverage and pending blockers.
Run source-binding validation, fresh coverage/recount, preflight, parity,
default full CI, typecheck, content validation, generated determinism and
diff-check. Run component and server boundary tests on the final combination.
Run the two existing Golden Eater/Conversion browser suites with the declared
repeat-each=5. Do not change fixtures, assertions or runtime if they fail.

RA and RB may review the same frozen candidate in parallel: RA owns evidence,
tooling and readiness bindings; RB owns runtime/socket/fixture and combined
behavior acceptance. Prior scoped PASS remains scoped. Mark dependencies
pending until the corresponding fresh accepted evidence actually exists.
Passing diagnostics alone does not grant acceptance or promotion.

Source-assets must be run and its actual result recorded separately. Historical
93 MISSING_IMAGE is retained as a Release blocker, not silently hidden and not
assigned to A here. A must not redefine whether that gate blocks a particular
promotion. Report applicable policy unchanged for Planner/G disposition.

The supplied packet reports 191/193 files, 1499 pass, 1 fail, 3 skipped with
two deterministic evidence-suite failures; retain the raw command outcomes
and explain the file/test discrepancy from logs, rather than inventing totals.
Historical timeout/RPC failures remain historical unless freshly reproduced.

## Next Sync And Exit

Next sync: exact final packet or an out-of-scope failure requiring another
Owner. Do not interrupt B to request unrelated repair. No role-level PR.
Planner authorizes I only after final acceptance scopes and required checks
are complete. Frozen ledger remains 111/944; migration/denominator delta=0.
Raw final diagnostic 23/144/3/0/111 is not new main credit. Global Gate C,
Release readiness and overall Phase 3 completion remain ungranted.
