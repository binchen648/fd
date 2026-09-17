# P3-TO-03 Trigger Gateway Spec r1 Repair

- Task: `P3-TO-03`
- Repair owner: Codex B, specification lane only
- Base candidate: `e2f13fd10005cfbe178c60ee9b502909bac80200`
- Failed review evidence: `f65b28f31c646d79245ea5df8c1502f3086e00f3`
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`

## Blocker 1 Repair — Producer Identity

The old normative producer shape allowed `{}` because every field was optional.

r1 replaces it with a required discriminated union:

- `card_ability` requires both `sourceCardInstanceId` and `sourceAbilityId`;
- `card` requires `sourceCardInstanceId`;
- `system` requires stable `sourceSystem` identity.

The contract now also states non-empty producer identity as an all-event requirement. Negative acceptance case 38 rejects empty or incomplete producer identity.

## Blocker 2 Repair — Failure / Terminal State

The old contract listed `failed` as terminal while also requiring failed dispatches to mutate nothing.

r1 removes `failed` from authoritative terminal states.

- effect-settlement failure rolls back and leaves the trigger non-terminal/unprocessed;
- `processed`, `declined`, and `invalidated` are the only authoritative terminal states;
- `invalidated` may commit only as a successful revalidation outcome proving the trigger can no longer legally settle;
- an invalidation transaction may update scheduler bookkeeping/revision/audit history but may retain no failed effect mutation.

Negative acceptance case 34 and the reviewer checklist now enforce the same rule.

## Reverification

- trigger ability map: 37 source rows / 37 mapped rows / 37 unique abilities;
- event types: 13;
- missing ability rows: 0;
- extra ability rows: 0;
- `git diff --check`: PASS;
- repair diff scope: documentation only;
- no runtime, tests, authoring, generated content, taxonomy, KPI, or Gate changes.

## Next Step

Fresh Codex R review of the exact r1 commit. No Gate or runtime status changes are claimed by this repair.