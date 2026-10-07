# FD Phase 3 Control Epoch 06

- Control Epoch: `FD-P3-2026-09-23-06`
- Status: `STALE_AFTER_PR_536_PROMOTION`
- Authoritative main: `origin/main@4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27`
- Previous epoch: `FD-P3-2026-09-23-05` (`STALE`)
- Epoch trigger: user-approved governance-policy and authoritative-lineage change
- Governance override: `REMOVE_DISTINCT_GITHUB_ACCOUNT_REQUIREMENT`

This epoch removes the requirement that implementation, review, evidence,
governance, and human approval use distinct GitHub accounts. It does not remove
role separation, exact-SHA binding, immutable artifacts, policy validation, or
human approval.

## Governance Override

| Rule | Epoch 05 | Epoch 06 |
|---|---|---|
| Distinct GitHub account required | `YES` | `NO` |
| Distinct process roles required | `YES` | `YES` |
| Separate artifacts required | `YES` | `YES` |
| Exact candidate binding required | `YES` | `YES` |
| GitHub-bound carrier required | `YES` | `YES` |
| Promotion policy must pass | `YES` | `YES` |
| Human approval required | `YES` | `YES` |

The same GitHub login may represent multiple process roles only when each role
produces a separately attributable, ordered, immutable artifact. One role may
not rewrite another role's artifact.

## Authoritative Promotion Lineage

Runtime candidate:

`30be3b74258c817ede1cb857ace947505b62d8ed`

Governance carrier / PR #491 HEAD:

`054726e90ce7e65a181f07ce151f614f677ce970`

Current A sync lineage HEAD:

`3af8509693cdae285051c75e499bbcef3e9a8a96`

Accepted binding:

```text
main 4b8eeeeb
  -> runtime candidate 30be3b7
  -> evidence carrier 73733de
  -> GitHub identity carrier 054726e
  -> A sync / Reviewer A binding 3af8509
```

`30be3b7...` is an ancestor of `054726e...`. The carrier delta from candidate
to carrier contains only:

- `artifacts/reviewer-evidence/2026-09-29-p3-e04-s00-a2-reviewer-b.json`
- `docs/reviews/phase3/P3-E04-S00-A2-review.json`

No runtime, authoring, content, or app path changes between candidate and
carrier.

## Current Verification State

- PR #491 current HEAD: `054726e...`
- PR #491 state: `OPEN`
- PR #491 mergeability: `MERGEABLE`
- Latest Phase 3 policy checks on 2026-10-03: `SUCCESS`
- Policy output: `PHASE_3_GOVERNANCE_PASSED`
- Candidate-to-carrier ancestry: `PASS`
- Candidate-to-carrier runtime delta: `NONE`
- A sync descendant exists: `3af8509...`
- Distinct-account requirement: `OVERRIDDEN_BY_USER`
- Governance input state: `GOVERNANCE_INPUT_COMPLETE`
- Codex G attestation SHA-256:
  `B88CB5C0D16F4D6243BC0C484037478ECB74778001D5BE5EE50DD138775AAE31`
- Codex I authorization: `GRANTED_PROMOTION_PR_CREATION_ONLY`

## Competing Lineage Disposition

The prior Epoch 05 candidate
`abbf1ae6419719462ff34fb3ce46f4c97f7407a4` is now
`SUPERSEDED_BY_USER_APPROVED_LINEAGE_OVERRIDE`.

It remains provenance evidence and receives no main credit. It must not be
mixed with `30be3b7...`, `054726e...`, or `3af8509...` in a promotion branch.

PR #480 is not reusable as the new promotion vehicle because its head predates
the accepted carrier and A sync. Codex I must create a fresh promotion-only PR
after governance completion.

## Required Remaining Chain

```text
Planner override recorded
  -> Codex G override attestation COMPLETE
  -> GOVERNANCE_INPUT_COMPLETE
  -> Planner explicit Codex I authorization GRANTED
  -> Codex I fresh promotion-only branch and PR
  -> github:binchen648 human approval
  -> merge
  -> post-merge recount
```

## Hard Boundaries

- Codex G may validate governance only; it may not edit runtime or A evidence.
- Codex I may not start before `GOVERNANCE_INPUT_COMPLETE` and a separate
  Planner authorization record.
- The override does not grant Gate C, migration credit, main credit, Phase 3
  completion, or release readiness.
- PR #491 is a carrier/review vehicle, not the final main promotion PR.

## Next Sync Trigger

1. Codex I creates the fresh promotion-only PR;
2. PR #491 HEAD changes;
3. authoritative main changes;
4. the promotion policy becomes non-successful.

Final control status: `CODEX_I_PROMOTION_PR_CREATION_AUTHORIZED`

## Supersession

PR #536 merged as
`a7751c3fa51895fd3a401721b1e926b90e016862` on 2026-10-07. The
authoritative main and workstream topology therefore moved to
`FD-P3-2026-09-23-07`. This file remains immutable historical control
evidence and must not be used for new dispatch.
