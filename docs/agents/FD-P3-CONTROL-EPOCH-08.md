# FD Phase 3 Control Epoch 08

- Control Epoch: `FD-P3-2026-09-23-08`
- Status: `ACTIVE_ON_AUTHORITATIVE_MAIN_AFTER_MERGE`
- Authoritative main: `origin/main@7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`
- Previous epoch: `FD-P3-2026-09-23-07` (`STALE_AFTER_PR_543_MERGE`)
- Epoch trigger: PR #543 merged, changing authoritative main and adopting the
  Epoch 07 promotion governance
- Effective date: `2026-10-07`

## Verified Main State

- PR #543: `MERGED`
- Base: `a7751c3fa51895fd3a401721b1e926b90e016862`
- Head: `fadf4810fc25762d1e6cf34e1dffb2350e9f2fce`
- Merge SHA: `7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`
- Checks on the merged PR: `build=PASS`, `test=PASS`,
  `Phase 3 Promotion Lane / policy=PASS`

This is a control-state transition only. It does not claim a deploy check,
runtime change, acceptance promotion, migration credit, Gate C, or release
readiness.

## Active Task

| Task | Owner | State | Boundary |
|---|---|---|---|
| `P3-E08-CI-01` | Codex A | `READY` | CI stability evidence/report only, within the three paths in its task assignment; no runtime or authoring edits |

This transition preserves the task's existing path authorization and does not
expand it. Codex A may bind new evidence to Epoch 08 only after this transition
is formally present on `origin/main` and the task index there identifies Epoch
08 as current.

## Inherited Governance

Epoch 07's no-stacked-role-PR rule remains active. Epoch 06's separate human
approval requirement remains in force. Governance-only publication uses the
Codex G role and requires its applicable review, successful required checks,
and a human merge to `main`.

Final control status: `EPOCH_08_CANDIDATE_PENDING_GOVERNANCE_REVIEW_AND_HUMAN_MERGE`
