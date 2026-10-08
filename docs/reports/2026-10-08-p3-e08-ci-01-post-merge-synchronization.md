# P3-E08-CI-01 Post-Merge Synchronization

Control Epoch: `FD-P3-2026-09-23-08`.

Task: `P3-E08-CI-01-POST-MERGE-SYNC`; status: `READY_FOR_REVIEW`.

PR #554 merged on 2026-10-08 at 14:33:28 Asia/Shanghai as
`fefcf4f7f5bd66ed7693889fb99391e6e7321016`. The artifact's
`main.observedMainSha` is this immutable historical commit; it does not impose
permanent equality with the moving `origin/main` ref.

Artifact: `artifacts/phase3-e08-ci-01-post-merge-sync.json`.

Artifact SHA-256: `30946D1B11468999E9B19AD8D18AA27925904174D441B5DB8D62D7A892F5BD1D`.

## Promoted Scope And Evidence

The CI-stability slice is now `PROMOTED_ON_MAIN`: its single-test local
`15_000ms` timeout is present on main. This grants no ability migration credit.
Implementation `b5a76f8d2c8a742c2b4d8910c6c77ed00d7461e6`, reviewed carrier
`ff7abf7df6922247d2684d61eb7b0400373cacd4`, Reviewer A commit `d927b7a...`,
policy-compatible review binding `c309823...` and promotion head
`3b934ad90860fb122936be46b2ca1920ae5c388c` are ancestors of the observed main.
The merge's first parent is previous main `0a8853d...`; its second parent is
the promotion head. The source artifact and both accepted review artifacts
match their SHA-256 bindings. Original pre-merge evidence remains unchanged.

GitHub PR metadata reports SUCCESS for build, test and Phase 3 policy on the
promotion head. Job URLs are recorded in the machine artifact. These checks
are distinguished from post-merge local execution. Reviewer A independently
ran focused `37/37`, default CI `183 files / 1409 tests` and typecheck on the
reviewed carrier; those results remain attributed to that exact SHA.

## Zero-Delta Recount

The existing coverage classifier was run read-only against authoring blobs
read independently from the previous main and merge commit. Both yield
`127 archives / 169 cards / 281 abilities` and fingerprint
`7239686f1a799c82029d383962a6674363eb1eb20b6ba399ed988f466e0a2fd0`.

| Raw classification | Before | After | Delta |
|---|---:|---:|---:|
| New semantic route | 22 | 22 | 0 |
| Legacy resolveEffect | 144 | 144 | 0 |
| Legacy executeAbility | 3 | 3 | 0 |
| Dual | 0 | 0 | 0 |
| Not classifiable | 112 | 112 | 0 |

These are classifier counts, not new acceptance credits. Coverage credit,
migration credit and denominator deltas are all `0`; no accepted identity
is added or removed. Authoring, pack, content source, rules runtime, classifier
and committed coverage artifact Git objects are identical across the merge.
The artifact records each immutable object ID for reproduction.

## Checks Actually Performed

- `git fetch origin main`: PASS; observed merge commit resolved successfully.
- `gh pr view 554 --json number,url,state,mergedAt,mergeCommit,headRefOid,baseRefOid,statusCheckRollup`:
  PASS; MERGED, exact merge/head/base and three successful checks returned.
- Git parent/ancestor, review JSON field and artifact digest assertions: PASS.
- Read-only `buildCoverageFromArchives` recount using both commits' authoring
  blobs: PASS; complete before/after objects equal.
- Protected Git object comparisons: PASS; runtime, authoring and classifier unchanged.
- Supplemental GitHub `commits/<promotion-head>/check-runs` requests timed out
  at TLS handshake twice. The successfully retrieved PR check rollup supplies
  the reported check evidence; no successful direct check-runs response is claimed.

The recount reused the already installed tsx executable from the implementation
worktree as tooling; all classifier code and audited inputs came from this
merge-based worktree or its exact Git objects. No runtime suites were rerun
on the merge commit for this evidence-only synchronization.

## Remaining Gates And Next Owner

Gate C is `NOT_VERIFIED`; `93 MISSING_IMAGE` blockers remain inherited and
were not re-audited. Release Gate remains BLOCKED and long-term CI stability
is not established. Runtime legacy paths are retained unchanged.

Reviewer A should review the exact post-merge synchronization commit. Planner
can then register this disposition and resume A3 reconciliation. This task
does not independently authorize a new runtime slice or grant Phase 3 acceptance.
