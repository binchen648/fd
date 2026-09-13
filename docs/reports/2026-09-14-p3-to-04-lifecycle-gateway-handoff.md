# P3-TO-04 Lifecycle Policy Gateway Handoff

- Document Role: SPEC_HANDOFF
- Owner: Codex B, specification lane only
- Status: `READY_SPEC_OWNER`
- Runtime Authorization: `NONE`
- Maximum Completion Claim: `SPEC_REVIEW_READY`
- Dispatch Authority: corrected Phase 3 parallel queue marks P3-TO-04 `READY_NEXT`; P3-TO-03 is now independently `SPEC_ACCEPTED`.

## Objective

Define a reusable Lifecycle Policy Gateway for the **11 explicit lifecycle/reset abilities** in the corrected semantic-axis inventory. The specification must separate duration, source validity, usage/reset, conflict policy, and cleanup ownership from Trigger, Interaction, Battle, Hidden, Modifier/Power, and effect execution.

## Correct Denominator

```text
explicitLifecycleAbilities=11
```

The current inventory includes these lifecycle policy families:

- per-round and per-game usage limits scoped to a card;
- unique-keyword-group conflict policy within a trigger window;
- `while_card_active` duration;
- fixed `round_count` duration;
- cleanup when a card leaves its active area;
- expiration after duration;
- `remain_active` cleanup policy;
- immediate lifecycle start.

The 11 ability rows include Trigger-, Hidden-, Battle-, Special-, Card Action-, Visibility-, and power-related dependencies. Lifecycle representability does not make those external semantics runtime-ready.

## Required Contract

The specification must define at minimum:

- stable source card/ability identity;
- active, closed, moved, transformed, and missing-source validity;
- lifecycle start point and ownership;
- duration representation for `while_card_active`, fixed rounds, and other supported reviewed forms;
- round boundary / reset ownership;
- per-round and per-game usage accounting and reset behavior;
- unique group/window conflict policy and deterministic ownership;
- expiration event/identity and idempotency;
- cleanup destination versus `remain_active` policy;
- source-leaves-active-area cleanup behavior;
- projection/reconnect persistence for authoritative lifecycle state;
- composition with accepted Trigger and Interaction contracts without reimplementing them;
- fail-closed handling for stale, duplicate, unsupported, ambiguous, or corrupted lifecycle state;
- transaction boundaries so failed cleanup/reset does not partially mutate authoritative state.

## Ability Mapping

Map all 11 explicit lifecycle abilities exactly once. Each row must identify:

- lifecycle/limit policy;
- start condition;
- duration/reset boundary;
- cleanup/expiration policy;
- external Trigger/Interaction/Battle/Hidden/Special/Modifier dependency;
- whether later runtime work remains blocked.

## Accepted Dependencies

- Trigger Gateway: P3-TO-03 spec `ac70c33cb943d99d02f1f7077d80b36337014439`, review `6ce17aab18ea20cec7e5fcfc6efb4fc5f6384f6e`, `SPEC_ACCEPTED`.
- Interaction Template: reachable acceptance synchronization `7aab428`, `SPEC_ACCEPTED` evidence. Historical referenced TO-05 object remains unavailable and must not be represented as restored.

## Forbidden Work

- no changes under `packages/rules`, `apps/client`, `apps/server`, or `e2e`;
- no authoring or generated-content changes;
- no lifecycle runtime migration;
- no card-specific cleanup branch design;
- no Gate promotion;
- no absorption of Trigger ordering, Battle resolution, Hidden visibility, Modifier/Power semantics, or Card Action execution into Lifecycle;
- no use of card/ability identity as generic lifecycle eligibility routing.

## Required Deliverables

1. Lifecycle Policy Gateway specification with typed policy/state/expiration concepts and invariants.
2. Exact 11-ability mapping with external dependency blockers.
3. Negative acceptance matrix covering stale source, duplicate expiry/reset, invalid durations, cleanup ambiguity, reconnect/replay, and transaction rollback.
4. Independent reviewer checklist.
5. Scoped spec result/handoff.

Stop at `SPEC_REVIEW_READY`. Do not implement runtime and do not mark P3-B08 ready until independent review accepts this specification and runtime hot-file ownership is separately available.