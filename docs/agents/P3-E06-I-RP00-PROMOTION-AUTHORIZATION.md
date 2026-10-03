# P3-E06 RP-00 Codex I Promotion Authorization

- Document role: `PLANNER_INTEGRATION_AUTHORIZATION`
- Control Epoch: `FD-P3-2026-09-23-06`
- Task ID: `P3-E06-I-RP00-PROMOTION`
- Owner: `Codex I / Integration Owner`
- Status: `AUTHORIZED_TO_CREATE_PROMOTION_PR`
- Human approver: `github:binchen648`
- Merge authorization: `NOT_GRANTED`

## Authorized Inputs

| Input | Exact value |
|---|---|
| Authoritative main | `4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27` |
| Runtime candidate | `30be3b74258c817ede1cb857ace947505b62d8ed` |
| Governance carrier | `054726e90ce7e65a181f07ce151f614f677ce970` |
| A sync lineage head | `3af8509693cdae285051c75e499bbcef3e9a8a96` |
| Carrier PR | `#491` |
| Codex G verdict | `GOVERNANCE_INPUT_COMPLETE` |
| Codex G manifest SHA-256 | `B88CB5C0D16F4D6243BC0C484037478ECB74778001D5BE5EE50DD138775AAE31` |
| Codex G report SHA-256 | `A5D1E209FD0F4B5A6DB40AD6F32EF985FEF08CF60EC161D18222D88112123CC6` |

## Authorized Operation

Codex I may create one fresh promotion-only branch and one PR targeting
`main`.

Recommended branch:

`codex/i-p3-e06-rp00-setup-create-to-skill-promotion`

The branch must preserve this ancestry without squash, amend, or semantic
reconstruction:

```text
4b8eeeeb... -> 30be3b7... -> 054726e... -> 3af8509...
```

The promotion branch must contain `3af8509...` as an ancestor. Codex I may add
only governance and integration metadata after that commit.

## Required Governance Files

Codex I must include the exact contents of:

- `docs/agents/FD-P3-CONTROL-EPOCH-06.md`
- `docs/reports/2026-10-03-p3-governance-independent-account-override.md`
- `docs/agents/manifests/governance/P3-E06-DISTINCT-ACCOUNT-OVERRIDE.json`
- `docs/agents/manifests/governance/P3-E06-G-OVERRIDE-ATTESTATION.json`
- `docs/reports/2026-10-03-p3-e06-g-governance-override-attestation.md`
- this Planner authorization document;
- `docs/agents/manifests/governance/P3-E06-I-RP00-AUTHORIZATION.json`.

It may add the minimum promotion manifest required by the repository policy.
It must not copy unrelated dirty-worktree files or Epoch 05 recovery drafts.

## Required Verification Before PR Creation

1. Fetch `origin` and require `origin/main` to equal `4b8eeeeb...`.
2. Require PR #491 HEAD to remain `054726e...`.
3. Verify candidate, carrier, and A sync ancestry.
4. Verify `git diff 30be3b7...HEAD -- packages/rules packages/content apps`
   contains no post-candidate semantic changes.
5. Verify the Codex G manifest and report hashes.
6. Run the current Phase 3 promotion policy against the exact promotion HEAD.
7. Run `git diff --check`, typecheck, focused setup tests, full CI, content
   validation, and client build as required by the promotion lane.
8. Keep the worktree clean after commit and push.

If main, PR #491, any bound hash, or the accepted ancestry changes, stop with
`STALE_PROMOTION_AUTHORIZATION` and return to Planner.

## PR Requirements

The PR must:

- target `main`;
- identify runtime candidate `30be3b7...` separately from carrier
  `054726e...` and promotion HEAD;
- link PR #491 as provenance, not as the final promotion vehicle;
- state that distinct-account independence was replaced by the Epoch 06
  artifact-based governance override;
- include exact test and policy results;
- request final approval from `github:binchen648`;
- claim zero main, migration, denominator, and Gate C credit before merge.

PR #480 must not be reused or merged.

## Prohibited Operations

Codex I must not:

- edit runtime, authoring, tests, A evidence, Reviewer evidence, or Codex G
  attestation;
- squash or rewrite accepted commits;
- add the superseded `abbf1ae...` lineage;
- merge the PR;
- grant itself human approval;
- claim `PROMOTED_ON_MAIN`, Gate C PASS, Phase 3 completion, or release ready.

## Required Handoff

Return:

- promotion branch;
- promotion HEAD;
- PR number and URL;
- exact ancestry proof;
- changed paths after `3af8509...`;
- policy and test results;
- current review decision;
- confirmation that merge remains pending human approval.

Allowed result:

`PROMOTION_PR_CREATED_WAIT_HUMAN_APPROVAL`
