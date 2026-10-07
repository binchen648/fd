# P3-E06 Codex G Governance Override Attestation

- Document role: `CODEX_G_GOVERNANCE_OVERRIDE_ATTESTATION`
- Control Epoch: `FD-P3-2026-09-23-06`
- Task ID: `P3-E06-G-OVERRIDE-01`
- Governance identity: `github:binchen648`
- GitHub account ID: `201342173`
- Verification timestamp: `2026-10-03T10:37:47.2670874+08:00`
- Verdict: `GOVERNANCE_INPUT_COMPLETE`
- Machine attestation:
  `docs/agents/manifests/governance/P3-E06-G-OVERRIDE-ATTESTATION.json`

## Override authority

The Planner-recorded override at
`docs/agents/manifests/governance/P3-E06-DISTINCT-ACCOUNT-OVERRIDE.json`
has SHA-256
`A6C856B70BF72FAD82BA99424C8B17CE87734BD4FE1EFD59B65E02D8A3B7EC94`.

Epoch 06 removes the distinct-GitHub-account requirement while retaining
separate process roles, separate immutable artifacts, exact-SHA binding,
chronological stage ordering, fresh policy validation, and final human
approval.

## Exact lineage

The accepted lineage is:

```text
origin/main 4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27
  -> runtime candidate 30be3b74258c817ede1cb857ace947505b62d8ed
  -> Reviewer B artifact 73733de713e0deb833241417a04f061faf3ce8a3
  -> governance carrier 054726e90ce7e65a181f07ce151f614f677ce970
  -> A sync 00add371a1d32d09ed9c09ca3856490a1fa6ad6a
  -> Reviewer A binding 3af8509693cdae285051c75e499bbcef3e9a8a96
```

All ancestor checks pass. PR #491 and its remote candidate branch both resolve
to the exact governance carrier. The A-sync remote branch resolves to the exact
Reviewer A binding carrier.

## Immutable provenance

| Stage | Artifact | SHA-256 |
|---|---|---|
| Reviewer B | `artifacts/reviewer-evidence/2026-09-29-p3-e04-s00-a2-reviewer-b.json` | `FD988E5544AF230D148FE9CD94E218293D54BFFB05BCFA3AE7C09B3970D66C67` |
| GitHub review record | `docs/reviews/phase3/P3-E04-S00-A2-review.json` | `C0ADB21C7358E4F6F1A03FF9888F323AA9A88811B1632133D182AEB4E5961F04` |
| Codex A sync | `artifacts/phase3-e04-s00-a2-current-candidate-sync.json` | `EBC56094F744CE7DE5FA1D6700DF57B92EFE66B0AF9A7A8B411FDFA11080F157` |
| Reviewer A binding | `artifacts/phase3-e04-s00-a2-reviewer-a-sync-binding.json` | `4E92FEF7AB33C025AB13170DB1F5A24B7AEADDBC9A6A5C1EEEB81AE3ED7A0A31` |

The candidate-to-carrier diff contains only the Reviewer B artifact and the
GitHub review record. No runtime, authoring, content, or application path is
changed by the carrier. The later A-sync lineage adds only evidence,
governance-support scripts, focused tests, and reports.

## Policy evidence

- PR: `https://github.com/binchen648/fd/pull/491`
- Workflow run: `37088881513`
- Job: `111104751814`
- Run head: `054726e90ce7e65a181f07ce151f614f677ce970`
- Conclusion: `success`
- Output: `PHASE_3_GOVERNANCE_PASSED`

The run is fresh for the exact governance carrier and validates the current
stacked manifest.

## Replacement controls

- Separate completed B, Reviewer B, A, Reviewer A, and Codex G stages: `PASS`
- Separate exact-SHA artifacts: `PASS`
- Chronological stage ordering: `PASS`
- Candidate/carrier separation with no runtime delta: `PASS`
- SHA-256 artifact binding: `PASS`
- Fresh exact-carrier policy execution: `PASS`
- Cross-role artifact rewrite detected: `NO`
- Codex I stage is reserved and has not executed: `YES`
- Human approval stage is reserved and has not executed: `YES`
- Final human approval remains required: `YES`

## Accounting and non-claims

- Main coverage credit delta: `0`
- Main denominator delta: `0`
- Migration credit delta: `0`
- `promotedOnMain=false`
- Gate C is not verified.
- Phase 3 and Release Ready are not claimed.
- Codex I is not authorized by this attestation alone.
- Candidate `abbf1ae6419719462ff34fb3ce46f4c97f7407a4` remains
  `SUPERSEDED_BY_USER_APPROVED_LINEAGE_OVERRIDE` and must not be mixed into the
  accepted lineage.

## Disposition

All Epoch 06 override checks pass.

`GOVERNANCE_INPUT_COMPLETE`

Allowed next owner: `Planner`. The Planner must issue a separate Codex I
authorization before any fresh promotion-only branch or PR is created.
