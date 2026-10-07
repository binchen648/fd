# Phase 3 Epoch 07 Control Transition

- Previous main: `4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27`
- Current main: `a7751c3fa51895fd3a401721b1e926b90e016862`
- Trigger: PR #536 merged
- Main checks: build, test, deploy, and Phase 3 policy all passed

## Planner Disposition

Epoch 06 is stale because the authoritative main changed. Epoch 07 starts with
RP-00 merged but awaiting Codex A post-merge recount and Reviewer A acceptance.
The RP-00 runtime reservation remains held until that review passes.

New Phase 3 dispatch immediately stops creating role-stage stacked PRs. Existing
stacked PRs remain evidence inputs and receive no automatic merge, credit, or
closure. New Slices use role-owned commits and artifacts followed by one Codex I
Promotion PR targeting `main`.

The Slice/Task/Promotion contract introduces risk tiers, pipeline stages,
resource-domain writer limits, PREPARE-only parallel work, and manual drift
classification boundaries. Machine enforcement remains pending dedicated A
automation and G governance review.

Final status: `CONTROL_TRANSITION_PUBLISHED_GOVERNANCE_REVIEW_REQUIRED`
