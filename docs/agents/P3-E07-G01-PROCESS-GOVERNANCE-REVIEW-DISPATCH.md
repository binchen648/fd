# P3-E07 G01 Process Governance Review Dispatch

- Control Epoch: `FD-P3-2026-09-23-07`
- Task ID: `P3-E07-G01`
- Owner: `Codex G / Promotion Governance Owner`
- Review mode: `READ_ONLY`
- Base: `a7751c3fa51895fd3a401721b1e926b90e016862`
- Candidate: `0cbdd33cd5e70978322777326849b99cb40c6e9e`
- Status: `READY_FOR_GOVERNANCE_REVIEW`

## Objective

Determine whether the candidate establishes a coherent Epoch 07 control
transition without weakening exact-SHA review, role separation, human approval,
or promotion policy.

## Read

1. `docs/agents/FD-P3-CONTROL-EPOCH-07.md`
2. `docs/agents/P3-E07-NO-STACKED-ROLE-PR-DIRECTIVE.md`
3. `docs/governance/phase3-slice-task-promotion-contract.md`
4. `docs/governance/phase3-promotion-lane.md`
5. `docs/agents/PHASE3-AGENT-CONTRACT.md`
6. `docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`
7. `docs/agents/manifests/governance/P3-E07-CONTROL-TRANSITION.json`

## Required Verification

1. Base and candidate resolve and `a7751c3...` is the direct parent lineage.
2. Diff contains no runtime, authoring, generated content, test, or app changes.
3. PR #536 merge and main-check claims match GitHub state.
4. RP-00 remains `MERGED_RECOUNT_PENDING`; the runtime lock is not released.
5. The no-stacked-role-PR rule preserves separate role artifacts and read-only
   reviewer ownership.
6. Only Codex I may create a Slice Promotion PR and only Human may merge it.
7. Existing stacked PRs remain evidence and receive no automatic credit,
   retarget, merge, or closure.
8. Risk tiers, pipeline stages, resource locks, and WIP limits do not imply
   acceptance or runtime concurrency without disjoint domains.
9. Drift categories are manual evidence states until A automation and Reviewer
   A acceptance exist; implementers cannot self-classify.
10. C01-A remains blocked while A owns the post-merge recount.

## Prohibited Actions

Do not modify the candidate, implement CI enforcement, update coverage or
migration counts, release a lock, accept a runtime Slice, create a Promotion
PR, or close historical PRs while reviewing.

## Verdicts

- `GOVERNANCE_CONTRACT_PASS`
- `GOVERNANCE_CONTRACT_NEEDS_REVISION`
- `STALE_BASE`

Return exact base, exact candidate, changed paths, checks performed, findings,
non-claims, and the next owner. A PASS authorizes a governance-only PR for this
candidate; it does not authorize a runtime or migration promotion.
