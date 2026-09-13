# P3-TO-03 Independent Reviewer Checklist

- Implementer: Codex B, specification lane only
- Review owner: Codex R
- Date: 2026-09-14
- Implementer status: `SPEC_REVIEW_READY`
- Allowed reviewer outcomes: `SPEC_ACCEPTED`, `PLAN_NEEDS_REVISION`, `FAILED`
- Runtime/Gate effect: none

## 1. Scope Guard

- [ ] Review exact P3-TO-03 candidate commit, not a moving branch.
- [ ] Changed files are limited to the Trigger Gateway contract, 37-ability map, negative acceptance matrix, reviewer checklist, and optional scoped spec report/artifact.
- [ ] No `packages/rules`, `apps/client`, `apps/server`, `e2e`, authoring, generated content, taxonomy generator, KPI, or coverage classifier file changed.
- [ ] No runtime migration, card-specific trigger handler, or Gate A/B/C promotion is claimed.
- [ ] P3-B07/P3-TO-11 are not marked runtime-complete by this review.

## 2. Inventory Reconciliation

- [ ] `strictDomainTriggerAbilities=37`.
- [ ] Exactly 37 unique ability rows exist in the ability map.
- [ ] Exactly 13 event types exist.
- [ ] Event counts sum to 37.
- [ ] `on_use_declared=9`.
- [ ] `on_card_played=6`.
- [ ] `game_start=4`.
- [ ] `after_controller_loses_battle=4`.
- [ ] `after_battle_result_determined=3`.
- [ ] `after_controller_wins_battle=3`.
- [ ] `after_battle_ended=2`.
- [ ] Each remaining event type has count 1.
- [ ] Phase timing, continuous requirements, response windows, and power hooks are not added to the strict denominator unless already present on the corrected domain-event axis.

Suggested mechanical check:

```powershell
node -e "const x=require('./artifacts/phase3-skill-coverage.json'); const a=x.semanticAxes.filter(r=>r.domainEventTriggers?.length); console.log(a.length,new Set(a.flatMap(r=>r.domainEventTriggers)).size)"
```

Expected: `37 13`.

## 3. Identity Contract

- [ ] Event identity is distinct from event producer identity and consuming trigger-source identity.
- [ ] Event producer is a non-empty discriminated identity; `card_ability` requires both card-instance and ability ID, `card` requires card-instance ID, and `system` requires stable system ID.
- [ ] The processed/idempotency key includes event ID + source card instance + source ability.
- [ ] Controller/actor identities are explicit where semantically required.
- [ ] Causation identity is mandatory enough to audit nested and derived events.
- [ ] Stable entity IDs are normative; names, translations, indexes, and list positions are presentation only.
- [ ] Clients cannot create authoritative events or overwrite candidate/processed/continuation state.

## 4. Forced / Optional Split

- [ ] Authored `OPTIONAL_TRIGGER` rows are optional scheduling candidates.
- [ ] Current optional strict triggers hand off to accepted P3-TO-05 interaction semantics rather than defining a second yes/no protocol.
- [ ] Other strict event consumers are scheduled as forced consumers when their event contract and dependencies are supported.
- [ ] Forced triggers cannot be declined by clients.
- [ ] Disconnect/reconnect cannot auto-accept or auto-decline an optional trigger.

## 5. Ordering

- [ ] Event queue order is explicit and deterministic.
- [ ] Trigger ordering is represented explicitly rather than depending on JS object/map iteration.
- [ ] The contract does not invent a game-semantic priority from card ID, ability ID, lexical sort, or source-file order.
- [ ] If reviewed rules do not resolve a material simultaneous-order collision, runtime remains blocked or hands off to an accepted ordering contract.
- [ ] Technical tie-breakers are permitted only after semantic order is fixed and cannot alter outcomes.

## 6. Duplicate, Replay, And Reentrancy

- [ ] Duplicate delivery of one event cannot duplicate trigger execution.
- [ ] Reconnect does not recreate event/trigger identity.
- [ ] Terminal triggers cannot be replayed.
- [ ] Nested legitimate events receive new event IDs plus causation links.
- [ ] Nested/reentrant execution cannot become an uncontrolled card-specific recursive callback stack.

## 7. Cancellation Ownership

- [ ] Forced triggers are not client-cancellable.
- [ ] Optional cancellation delegates to accepted P3-TO-05 `cancelPolicy` and defaults to forbidden.
- [ ] `decline` and `cancelled` are distinct terminal meanings.
- [ ] A permitted explicit cancellation executes no trigger effect continuation and cannot roll back an earlier committed command.
- [ ] `cancelled` is replay-protected for the same trigger identity.
- [ ] Cancellation closes scheduler/interaction bookkeeping only; source/lifecycle cleanup remains with external owners.

## 8. Revalidation And Rollback

- [ ] Source card and ability are revalidated at settlement.
- [ ] Controller/ownership, source-active, location, battle, lifecycle/limit state are revalidated when required.
- [ ] Stale/corrupt optional interaction state fails closed.
- [ ] Failing dispatch preserves resources, zones, status, phase/priority, pending state, events/logs, processed state, revision, and terminal trigger state.
- [ ] Effect-settlement failure remains non-terminal/unprocessed; `invalidated` may commit only as a separate successful revalidation outcome that retains no failed effect mutation.
- [ ] Failure in a later command does not roll back an earlier successfully committed command.

## 9. Projection And Reconnect

- [ ] Forced trigger projection does not leak server-only continuation or hidden payload data.
- [ ] Optional owner projection is delegated to accepted Interaction Template semantics.
- [ ] Non-owner optional projection may be redacted.
- [ ] Reconnect restores the same pending identity and does not increment revision by itself.
- [ ] Already processed forced triggers are not rerun on restore/reconnect.

## 10. External Ownership Boundaries

- [ ] Trigger Gateway schedules; it does not execute/own Resource, Card Zone, Card Action, Movement, Visibility, or other effect primitive semantics.
- [ ] Lifecycle owns duration/reset/source-close/cleanup.
- [ ] Battle/Scoring owns battle result and winner/loser facts.
- [ ] Hidden Information owns reveal/privacy legality.
- [ ] Special subsystems remain explicit blockers.
- [ ] Interaction Template owns player intent after an optional trigger is valid.
- [ ] An ability with an unresolved external dependency remains blocked after spec acceptance.

## 11. Negative Acceptance Matrix

Reviewer samples at least one case from each class and confirms the specification requires fail-closed behavior:

- [ ] event identity/admission;
- [ ] duplicate/replay;
- [ ] source revalidation;
- [ ] optional interaction ownership/revision;
- [ ] simultaneous ordering ambiguity;
- [ ] nested/reentrant causation;
- [ ] external-owner boundary;
- [ ] card/ability-ID or translated-text fallback.

## 12. Runtime Handoff Decision

`SPEC_ACCEPTED` may authorize only later task planning. It does not authorize broad trigger migration by itself.

Before the first runtime slice, a separate dispatch should:

- choose one low-coupling representative from the 37-row map;
- confirm required event producer already exists or is separately accepted;
- confirm downstream effect primitive is accepted;
- avoid unresolved Battle, Lifecycle, Hidden, Interaction, or Special coupling when possible;
- reserve runtime hot files;
- define Gate A/B and Gate C only if projection/reconnect changes are in scope.

## 13. Reviewer Decision

Record one result:

```text
Decision: SPEC_ACCEPTED | PLAN_NEEDS_REVISION | FAILED
Reviewed commit:
Blocking findings:
Non-blocking findings:
37 unique strict trigger abilities verified: yes/no
13 unique event types verified: yes/no
Interaction dependency synchronized at reachable 7aab428: yes/no
Runtime files changed: yes/no
Runtime or Gate promotion performed: no
Representative selected by this review: no
```

`SPEC_ACCEPTED` accepts only the design contract. Runtime remains a separate task.