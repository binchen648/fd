# Phase 3 Slice, Task, And Promotion Contract

- Version: `P3-STP-1.0`
- Effective control epoch: `FD-P3-2026-09-23-07`
- Effective main: `a7751c3fa51895fd3a401721b1e926b90e016862`
- Status: `PLANNER_PUBLISHED_GOVERNANCE_REVIEW_REQUIRED`

## Definitions

**Slice** is the smallest independently promotable semantic acceptance unit.
It defines one bounded behavior, consumer set, dependency set, risk tier, and
acceptance boundary.

**Task** is one role's work within a Slice. A Slice normally has several Tasks.

**Conversation** is an execution session. It may complete one Task or part of
one Task and has no acceptance authority by itself.

**Artifact** is an immutable, attributable, exact-SHA-bound implementation,
review, evidence, or governance record.

**Promotion PR** is the Slice's only PR intended to merge into `main`.

## Required Slice Record

Every Slice records:

```yaml
sliceId: P3-...
controlEpoch: FD-P3-2026-09-23-07
mainBase: exact_sha
riskTier: EVIDENCE_ONLY | AUTHORING_ONLY | RUNTIME_DELTA | CONTRACT_CONFLICT
pipelineStage: PREPARE | IMPLEMENT | VERIFY | PROMOTE | DONE
semanticBoundary: one sentence
consumers: []
dependencies: []
resourceDomains: []
tasks: []
candidateSha: null_or_exact_sha
promotionPr: null_or_number
creditDelta: 0
```

## Role Pipelines

```text
EVIDENCE_ONLY:
  A -> RA -> I -> Human

AUTHORING_ONLY:
  A dependency check -> S -> focused independent review -> A/RA -> I -> Human

RUNTIME_DELTA:
  B -> RB -> A -> RA -> I -> Human

CONTRACT_CONFLICT:
  read-only analysis -> Planner/user disposition
```

Additional review is allowed when the Slice crosses visibility, lifecycle,
interaction, battle, persistence, or authority boundaries. Removing a stage
requires an accepted governance rule; an implementer cannot waive it.

## Three-Slot Pipeline

For each resource domain:

- `IMPLEMENT`: one task holds the writer lock.
- `VERIFY`: frozen candidate under independent review.
- `PREPARE`: up to two read-only future tasks.

PREPARE may inspect source evidence, compute semantic deltas, define tests, and
calculate overlap. It may not edit runtime or authoring production paths.

## Promotion Rule

Codex I creates one final PR targeting `main` only after all required artifacts
are accepted. The PR binds the Slice, exact candidate, accepted review
artifacts, evidence sync, current-main compatibility result, tests, policy, and
zero/non-zero credit claim.

Promotion-ready candidates may queue, but merges are serial. Immediately before
each merge, I rechecks current main, exact HEAD, drift classification, required
checks, and human approval.

## Main Drift

Drift classification compares the old base with current main across declared
resource domains, dependency commits, public contracts, contract vectors, and
consumer sets. A changed filename list alone is insufficient.

| State | Minimum action |
|---|---|
| `CONTROL_ONLY_DRIFT` | preserve candidate; rerun governance policy |
| `NON_OVERLAPPING_DRIFT` | compatibility validation and related tests |
| `CONTRACT_DRIFT` | replay from current main and scoped independent review |

Codex A owns classifier implementation. Reviewer A owns classifier evidence
review. Codex G owns governance adoption. B, B2, and S may not classify their
own drift.

## Transition

The no-stacked-role-PR rule is immediately active for new Planner dispatch.
Automated rejection, lock leasing, handoff collection, and drift classification
remain implementation tasks. Until accepted automation exists, Planner records
the state and reviewers verify it manually.
