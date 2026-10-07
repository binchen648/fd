# FD Phase 3 Control Epoch 07

- Control Epoch: `FD-P3-2026-09-23-07`
- Status: `ACTIVE`
- Authoritative main: `origin/main@a7751c3fa51895fd3a401721b1e926b90e016862`
- Previous epoch: `FD-P3-2026-09-23-06` (`STALE_AFTER_PR_536_PROMOTION`)
- Epoch trigger: PR #536 merged, authoritative main changed, and the accepted
  promotion governance entered main
- Effective date: `2026-10-07`

## Verified Main State

- PR #536: `MERGED`
- Merge SHA: `a7751c3fa51895fd3a401721b1e926b90e016862`
- Main checks: `build=PASS`, `test=PASS`, `deploy=PASS`,
  `Phase 3 Promotion Lane / policy=PASS`
- RP-00 runtime candidate: promoted in the merge lineage
- Gate C, release readiness, and non-zero migration credit: not granted by this
  control transition

## Active Post-Merge Recount

| Task | Owner | Exact base | State |
|---|---|---|---|
| `P3-E07-RP-00-A3` | Codex A | `a7751c3...` | `CANDIDATE_EXISTS: fa76e03...` |
| `P3-E07-RP-00-RA3` | Reviewer A | `fa76e03...` | `READY_FOR_REVIEW` |

Codex A owns coverage, ledger, and evidence recount only. It must not edit
runtime or authoring semantics. RP-00 reaches
`PROMOTED_ON_MAIN_RECOUNTED` only after Reviewer A returns PASS for the exact A3
candidate.

## Runtime Reservation

The `ability-runtime/setup-create-to-skill` reservation remains held by RP-00
while recount is pending. No additional runtime mutation is authorized by this
document. The Planner releases the reservation only after `P3-E07-RP-00-RA3`
PASS.

Read-only PREPARE work may proceed without the lock. It may extract semantic
deltas, dependencies, consumer sets, test vectors, and file overlap, but may
not create runtime or authoring commits.

## Immediate Pull Request Directive

`NO_NEW_STACKED_ROLE_PR` is active for every task dispatched under Epoch 07.

- A, B, B2, R, and S may create worktrees, branches, commits, and immutable
  artifacts.
- They must not open a new PR based on another unmerged role branch.
- Codex I creates the Slice's single final Promotion PR targeting `main` after
  all required role artifacts are accepted.
- Existing stacked PRs remain provenance only until individually classified.
- This directive does not close, merge, retarget, or grant credit to any
  existing PR.

CI hard enforcement of this directive is a follow-up Automation/Governance
task. Until that check is accepted on main, Planner dispatch is the controlling
gate and a violating PR is `PROCESS_DRIFT`.

## Slice Pipeline

Each Slice records one risk tier and one pipeline stage.

Risk tiers:

- `EVIDENCE_ONLY`
- `AUTHORING_ONLY`
- `RUNTIME_DELTA`
- `CONTRACT_CONFLICT`

Pipeline stages:

- `PREPARE`
- `IMPLEMENT`
- `VERIFY`
- `PROMOTE`
- `DONE`

A Slice is a semantic acceptance unit, not a conversation. Multiple role-owned
tasks and conversations may serve one Slice, but the Slice has one final
Promotion PR.

## Resource Domains

| Domain | Representative scope | Writer limit |
|---|---|---:|
| `ability-runtime` | interpreter, executable pack, resolution dataflow | 1 |
| `session-authority` | match session, room, hub, server authority | 1 |
| `authoring-content` | source definitions, compiler inputs, generated registry | 1 |
| `client-projection` | client state, reconnect projection, E2E | 1 |
| `evidence-governance` | classifiers, reports, manifests, policy | 1 |

One task may require multiple domains. Shared public contracts require every
affected domain reservation. Read-only PREPARE does not acquire a writer lock.

## WIP Limits

- `IMPLEMENT`: at most one writer per resource domain.
- `VERIFY`: at most three Slices globally.
- `PREPARE`: at most four Slices globally and at most two per domain.
- `PROMOTE`: at most three accepted candidates may wait; merges remain serial.
- New role-stage stacked PRs: zero.

## Main Drift States

Until the automated classifier is accepted, these states are Planner/Reviewer
decisions and may not be self-declared by an implementer:

- `CONTROL_ONLY_DRIFT`: governance/evidence paths only; rerun policy.
- `NON_OVERLAPPING_DRIFT`: no protected path, dependency, contract vector, or
  consumer-set overlap; run compatibility verification.
- `CONTRACT_DRIFT`: protected path or semantic dependency overlap; return to
  runtime replay and scoped review.

## Active Parallel Work

Permitted now:

1. A completes RP-00 post-merge recount from exact main.
2. Reviewer A waits for and reviews the exact A candidate.
3. Planner/Governance prepares the Epoch 07 process contract.
4. A may design, but not yet claim acceptance for, Control CLI and drift
   classifier tasks.
5. Future runtime Slices may perform PREPARE-only reconnaissance.

Forbidden now:

- releasing the RP-00 runtime reservation before RA3 PASS;
- dispatching a new overlapping runtime IMPLEMENT task;
- creating new role-stage stacked PRs;
- treating any historical PR count or candidate status as main credit.

## Next Sync Triggers

1. Reviewer A returns the RA3 verdict for `fa76e03...`;
2. RP-00 recount PASS or findings change the reservation state;
3. the no-stacked-role-PR governance contract is accepted or rejected;
4. authoritative main changes;
5. a new role-stage stacked PR is opened after this directive.

Final control status: `RP00_RECOUNT_ACTIVE_NO_NEW_STACKED_ROLE_PR`
