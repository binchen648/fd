# P3-TO-03 Domain Event Trigger Gateway Handoff

- Document Role: SPEC_HANDOFF
- Owner: Codex B, specification lane only
- Status: `READY_SPEC_OWNER`
- Runtime Authorization: `NONE`
- Maximum Completion Claim: `SPEC_REVIEW_READY`

## Objective

Define one reusable Domain Event Trigger Gateway for the 37 strict trigger abilities. The specification must prevent card-specific event handlers from owning detection, ordering, optional interaction, effect execution, and cleanup at the same time.

## Correct Denominator

```text
strictDomainTriggerAbilities=37
```

Phase timing, continuous conditions, requirement hooks, response windows, and power-calculation hooks are not strict domain-event triggers.

## Required Contract

The specification must define:

- event id/type, revision, actor/controller, source identity, causation id, and visibility;
- deterministic ordering across simultaneous triggers;
- processed-event identity and duplicate/idempotency policy;
- forced versus optional scheduling;
- server-owned eligibility and source-validity revalidation;
- handoff to Interaction Template when player input is required;
- projection and reconnect representation for pending triggers;
- terminal processing, cancellation, and cleanup ownership;
- fail-closed behavior for malformed, stale, unsupported, duplicate, or incorrectly ordered events.

## Ability Mapping

Map all 37 strict trigger abilities across the 13 current event types. Each row must identify its event contract, forced/optional policy, interaction dependency, lifecycle/battle dependency, and whether runtime work is blocked.

Existing setup, Olga delayed activation, response, and battle-result implementations are reference evidence only. They cannot automatically inherit acceptance for the generic gateway.

## Forbidden Work

- no changes under `packages/rules`, `apps/client`, `apps/server`, or `e2e`;
- no authoring or generated-content changes;
- no trigger runtime migration;
- no card-specific event cases;
- no Gate promotion;
- no collapsing trigger detection into interaction or lifecycle semantics.

Stop at `SPEC_REVIEW_READY` and submit the specification, 37-ability map, negative acceptance matrix, and independent reviewer checklist.

## Acceptance Record

This kickoff handoff is satisfied by P3-TO-03 r2 specification commit `ac70c33cb943d99d02f1f7077d80b36337014439` and independent review commit `6ce17aab18ea20cec7e5fcfc6efb4fc5f6384f6e`, verdict `SPEC_ACCEPTED`.

Specification acceptance authorizes no runtime migration or Gate promotion. P3-B07's Trigger-spec dependency is satisfied, but B07 remains blocked on exclusive runtime hot-file ownership as recorded by P3-A03 on 2026-09-14.