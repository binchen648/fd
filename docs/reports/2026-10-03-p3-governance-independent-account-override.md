# Phase 3 Governance Override: Distinct GitHub Account

- Document role: `PLANNER_GOVERNANCE_OVERRIDE`
- Control Epoch: `FD-P3-2026-09-23-06`
- User decision date: `2026-10-03` (Asia/Shanghai)
- Decision: `DISTINCT_GITHUB_ACCOUNT_REQUIREMENT_CANCELLED`
- Effective scope: this RP-00 promotion lineage and future tasks that
  explicitly inherit Epoch 06 governance
- Status: `RECORDED_WAIT_CODEX_G_ATTESTATION`

## User-Accepted Risk

The user explicitly approved cancellation of the requirement that independent
process roles must be represented by different GitHub accounts.

This accepts the risk that `github:binchen648` may appear as PR author,
review-attestation identity, governance identity, or human approver. GitHub
account distinction is no longer used as the independence proof.

## Replacement Independence Controls

Independence is demonstrated by all of the following instead:

1. separate B, Reviewer B, A, Reviewer A, Codex G, Codex I, and Human stages;
2. immutable exact-SHA artifacts for each stage;
3. chronological stage ordering;
4. candidate/carrier separation with no runtime delta in the carrier;
5. SHA-256 binding of review and evidence artifacts;
6. fresh promotion-policy execution against the exact carrier;
7. no role may silently rewrite another role's artifact;
8. final human approval remains a separate explicit action.

Failure of any replacement control remains fail-closed.

## Accepted Binding

| Field | Accepted value |
|---|---|
| Main | `4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27` |
| Runtime candidate | `30be3b74258c817ede1cb857ace947505b62d8ed` |
| Governance carrier | `054726e90ce7e65a181f07ce151f614f677ce970` |
| Carrier PR | `#491` |
| A sync lineage HEAD | `3af8509693cdae285051c75e499bbcef3e9a8a96` |
| Human approver | `github:binchen648` |

Candidate `30be3b7...` is an ancestor of carrier `054726e...`. Their diff is
limited to the Reviewer B artifact and GitHub-bound review record. No runtime
or authoring file differs.

## Policy Evidence

PR #491 has fresh successful policy runs on 2026-10-03, including run
`37088881513`, whose policy output includes:

`PHASE_3_GOVERNANCE_PASSED`

This proves the repository policy accepts the current stacked manifest. It
does not by itself replace the Codex G override attestation required by Epoch
06.

## Non-Claims

This override does not:

- mark governance input complete;
- authorize Codex I yet;
- promote the candidate;
- grant runtime, migration, Gate C, mainline, or release credit;
- permit reuse of the stale PR #480 promotion head.

Planner disposition:

`OVERRIDE_RECORDED_CODEX_G_REQUIRED`
