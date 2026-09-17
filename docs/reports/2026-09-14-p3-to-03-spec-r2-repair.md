# P3-TO-03 Trigger Gateway Spec r2 Repair

- Task: `P3-TO-03`
- Repair owner: Codex B, specification lane only
- Base candidate: `529b6c7ac9523a7f8ff5a78174d459f1d2962fbf`
- r1 review evidence: `6e6d0c3b19fbc2e01c5a8a5900a7672592d3ebfa`
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`

## Cancellation Ownership Repair

The r1 review found that the handoff-required cancellation contract was absent.

r2 now defines:

- forced triggers are not client-cancellable;
- optional trigger cancellation delegates to accepted P3-TO-05 `cancelPolicy`;
- optional cancellation defaults to `forbidden` unless `explicit_cancel` is specifically permitted;
- `decline` and `cancelled` are distinct terminal meanings;
- a valid explicit cancellation executes no trigger effect continuation;
- cancellation cannot roll back earlier successfully committed commands;
- cancellation closes scheduler/interaction bookkeeping only and does not perform source/lifecycle/card-zone/hidden/battle cleanup;
- `cancelled` is replay-protected and idempotent for the trigger key.

`cancelled` is now included consistently in the normative terminal-state type, the gateway responsibility summary, the terminal-state section, negative acceptance cases, and reviewer checklist.

## Negative Acceptance Additions

- cancel attempt against forced trigger -> reject, zero mutation;
- optional cancellation when TO-05 policy forbids it -> reject, zero mutation;
- explicit cancellation may commit scheduler terminal state only; it may not execute effects or undo prior committed state.

## Reverification

- all handoff-required concepts are now present, including cancellation and cleanup ownership;
- trigger ability map remains 37/37 unique abilities;
- event types remain 13/13;
- missing/extra ability rows remain 0/0;
- `git diff --check`: PASS;
- changed scope remains documentation only;
- no runtime, tests, authoring, generated content, taxonomy, KPI, or Gate changes.

## Next Step

Fresh Codex R review of the exact r2 commit. No runtime or Gate promotion is claimed by this repair.