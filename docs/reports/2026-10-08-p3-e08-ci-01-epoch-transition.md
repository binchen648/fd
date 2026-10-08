# P3-E08-CI-01 Epoch 08 Control Transition

- Candidate control epoch: `FD-P3-2026-09-23-08`
- Candidate base: `7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`
- Trigger: PR #543 merged at `7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`
- Previous task-index epoch: `FD-P3-2026-09-23-07`

## Disposition

PR #543 merged from base `a7751c3fa51895fd3a401721b1e926b90e016862`, so
the Epoch 07 task index and control record no longer match authoritative main.
The merge checks recorded by GitHub were successful for build, test, and the
Phase 3 policy gate. No deploy result is claimed here.

The candidate transition updates the task index to Epoch 08 and records
`P3-E08-CI-01` as Codex A's evidence/report task. Its exact three authorized
paths remain governed by the existing task assignment. This transition grants
no runtime or authoring access and makes no acceptance or migration claims.

## Publication Gate

This branch commit is a review candidate, not the authoritative publication.
The repository's governance process requires the applicable Codex G review,
successful required checks on the candidate, and human approval/merge to
`main`. No Codex G reviewer task or candidate review is recorded yet. Human
approval remains a separate action under Epoch 06.

Until the transition is present on `origin/main` and the task index there names
Epoch 08, Codex A must not bind new evidence/report output to Epoch 08.

Final status: `EPOCH_08_CANDIDATE_PENDING_GOVERNANCE_REVIEW_AND_HUMAN_MERGE`
