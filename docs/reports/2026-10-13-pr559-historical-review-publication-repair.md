# PR559 Historical Review Publication Repair

Date: 2026-10-13. Owner: Planner / Process Controller.
Epoch: FD-P3-2026-09-23-09. No control transition.

## Exact Failure And Cause

PR559 HEAD: 3ec8b5393118b2b250eacd044dfd18ec098662cb.
GitHub Test run: 38345988548, initial attempt FAILURE.
Build and promotion policy were SUCCESS at this same HEAD.
Two suites failed setup while reading historical review commit/path:

5a361fffaf9c151ffbc27c995ea773380692e120:
docs/reviews/phase3/P3-E08-B11-final-packet-11c1985-reviewer-b.json.

Local Git contained the exact artifact. The local reviewer branch pointed
exactly to this commit; its parent is
11c1985dc4c72151bbf16298292bf4b7fa29fcab. The commit adds only this review
artifact, preserving its BLOCKED verdict and narrow historical scope.

Before repair, git ls-remote showed no corresponding remote branch and the
GitHub git-commit API returned 404. Test checkout already uses fetch-depth: 0.
The evidence publication omission, rather than shallow checkout or a runtime
failure, is confirmed for this dependency. No Git replace refs were present.

## Repair And Independent Remote Check

Published the existing exact commit without alteration to:
refs/heads/codex/rb-e08-final-packet-11c1985.
This is evidence publication, not a new review, role-level PR or merge.
The GitHub API now resolves the exact commit. A fresh remote-only bare clone
without local alternates reproduced the artifact byte-for-byte and its parent.
Artifact SHA-256:
6A6B732622E7275FA2D387AAD06C6B93C6C54FCDB83B1CDF61B2F7C0523D5CF8.

PR HEAD, implementation, validator, workflow, manifests, historical verdicts
and accounting were not changed. Requested a fresh rerun of Test workflow
38345988548 at the existing PR HEAD. Terminal result recorded below after
the GitHub run completes; local results do not substitute for required checks.

## Completion

Remote Test rerun: SUCCESS, attempt 2 of run 38345988548.
GitHub log: 194 passed files; 1606 passed / 1 skipped tests (1607 total).
This is the actual Linux/Node20 result, not a claim of 1607 executed PASS.
Final PR metadata confirms build/test/policy all SUCCESS on unchanged HEAD
3ec8b5393118b2b250eacd044dfd18ec098662cb. PR remains OPEN, mergedAt=null,
reviewDecision empty. This closes the evidence-publication CI blocker only.
Human approval and merge: NOT_PERFORMED.
Credit delta: 0. Gate C and long-term stability remain NOT_VERIFIED.
93 MISSING_IMAGE remains a separate Release blocker.
Keep this historical evidence ref reachable while CI relies on its objects.
