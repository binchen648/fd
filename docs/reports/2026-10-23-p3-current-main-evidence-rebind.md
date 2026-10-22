# P3 Current-main Evidence Rebind

Date: 2026-10-23 (Asia/Hong_Kong)
Owner: Builder (read-only evidence rebind)
Branch: `codex/b-current-main-evidence-rebind-20261023`

## Scope and exact base

This report is a current-main evidence reconciliation only. The exact current
main is:

- `origin/main`: `a42b5e1c517141b90f3407773958b0d8afe63264`
- `HEAD`: `a42b5e1c517141b90f3407773958b0d8afe63264`
- merge: PR #560, `Merge pull request #560 from binchen648/codex/i-p3-efp-i01-promotion`

Only this report is added. No runtime, inventory, generated registry, Candidate,
or existing task-index data is changed.

## Current-main inventory reconciliation

The locked current-main inventory is **943 static + 1 dynamic = 944 total**.
Its `data/phase3/full-roster-ability-inventory.json` `semanticSummary`
reconciliation is:

- `72 SOURCE_GROUNDED`
- `872 BLOCKED`

This is an evidence/state classification, not skill acceptance or migration
credit. It does not establish executable Gate C coverage for any blocked item.

## E04 accepted-111 matrix rebind finding

`artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json` is not
bound to the current main. Its embedded `mainSha` remains the historical
`0e943a94e8bdab6335e34818278ecc90760015f0`, rather than
`a42b5e1c517141b90f3407773958b0d8afe63264`.

The matrix therefore remains historical evidence with these unchanged findings:

- `111` entries are `EVIDENCE_BINDING_GAP`;
- `111` identities are `Gate-C pending`;
- `87` accepted identities lack generated registry IDs;
- `35` unexpected material IDs are present.

No current-main acceptance is inferred from that matrix. A fresh exact-current-
main review/reconciliation is required before any dispatch decision.

## Owner-reference availability

The `27` owner-complete references examined for the current-main reconciliation
are not present in the current-main evidence closure. They cannot be promoted
to current-main acceptance evidence by filename, historical branch, old recovery
lineage, or prose-only reference.

## EFP history and interpretation

EFP PR #560 is merged into current main. The earlier
`docs/reports/2026-10-13-p3-efp-integration-preflight.md` status
`PROMOTION_BLOCKED_GOVERNANCE` is the pre-merge historical state, not a claim
that PR #560 is still unmerged. The subsequent
`docs/reports/2026-10-13-p3-efp-i01-governance-inputs.md` records
`GOVERNANCE_INPUT_COMPLETE`; that is governance-input completeness only. It
does not provide skill acceptance, migration credit, Gate-C verification, or a
new current-main accepted-111 execution matrix.

## Disposition

**Current conclusion: `REVIEW_RECONCILIATION_REQUIRED`.**

This report does not declare any skill accepted, does not grant migration or
coverage credit, does not authorize or create a new Candidate, and does not
claim a new merge or release readiness. The next permitted action is a fresh
review/reconciliation against exact current main, including regeneration or
replacement of the stale E04 binding and verification of owner-reference
availability. No security-blocked command was rerun.
