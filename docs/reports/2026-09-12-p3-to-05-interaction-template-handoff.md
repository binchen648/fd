# P3-TO-05 Interaction Template Contract Handoff

- Document Role: SPEC_HANDOFF
- Owner: Codex B, specification lane only
- Status: `READY_SPEC_OWNER`
- Runtime Authorization: `NONE`
- Maximum Completion Claim: `SPEC_REVIEW_READY`

## Objective

Define reusable interaction contracts before broad PendingInteraction migration. The contract must cover only explicit player-input semantics:

- target selection;
- response;
- branch choice;
- yes/no confirmation;
- amount selection;
- ordering.

Timing hooks, domain triggers, continuous conditions, lifecycle policies, and hidden-information rules are dependencies or separate axes, not interaction templates by themselves.

## Corrected Denominators

```text
explicitInteractionAbilities=20
strictPendingInteractionAbilities=11
```

The spec must preserve both counts. It must not treat all 20 interactions as target-based pending decisions.

## Required Contract Fields

Each template must define:

- interaction id and template kind;
- source ability id and source card instance id;
- controller/decision owner;
- legal choices derived by the server;
- min/max selection or amount bounds;
- public/private visibility policy;
- originating event and causation id where applicable;
- created revision and expected revision;
- continuation/result-binding contract;
- reconnect serialization and projection;
- stale, duplicate, unauthorized, malformed, cancel, and timeout behavior;
- terminal resolution and cleanup ownership.

## Reference Evidence

- B11 Golden Eater: staged private target selection and optional payment continuation.
- Existing response-window work: response ownership and source-card identity.
- Existing stale/reconnect tests: transport evidence only, not automatic template acceptance.

Reference implementations do not define the generic contract by themselves.

## Forbidden Work

- no changes under `packages/rules`, `apps/client`, `apps/server`, or `e2e`;
- no runtime PendingInteraction or response migration;
- no card-specific exception design;
- no Gate promotion;
- no assumption that hidden/private semantics are solved by interaction projection alone.

## Required Deliverables

1. Interaction Template specification with typed shapes and invariants.
2. Mapping of 20 explicit interaction abilities to templates or dependency-blocked reasons.
3. Separate mapping of 11 strict target-based PendingInteraction abilities.
4. Compiler/runtime acceptance requirements for a later implementation task.
5. Gate A design checklist and independent reviewer checklist.
6. Explicit runtime owner and hot-file reservation recommendation for the later slice.

Stop at `SPEC_REVIEW_READY`. Do not implement runtime.
