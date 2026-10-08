# P3-E08-G01 Control Publication

- Owner: Codex G, Governance Owner
- Planner candidate: `codex/planner-p3-e07-control`
- Authoritative base for assembly: `origin/main@7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`
- Risk: governance only; no runtime or migration credit
- Reviewer A work for CI-01 may proceed in parallel.

Create a fresh branch from the exact main. Materialize only the current
Planner-approved versions of:

- `docs/agents/FD-P3-CONTROL-EPOCH-08.md`
- `docs/agents/P3-E08-CI-01-EVIDENCE-DISPATCH.md`
- `docs/agents/manifests/governance/P3-E08-CONTROL-TRANSITION.json`

Update only the task index header and its current control task block to point
to Epoch 08 and the exact main base, with CI-01 awaiting independent review.
Preserve historical task entries and the accepted Epoch 07 contract. Verify
the new index pointer, JSON validity, path scope, diff-check, and governance
policy. Create one governance PR targeting main, with role G and a manifest
bound to the PR's exact base/head. Request human approval; do not self-merge.
If main moves, refresh the exact base and record the drift classification.

Codex G's PR must not claim CI-01 Reviewer A PASS, A3 Promotion acceptance,
runtime completion, Gate C, or migration credit. After the governance PR is
merged, Planner records its merge SHA and requests CI-01 Reviewer A's exact-SHA
attestation before dispatching Codex I.
