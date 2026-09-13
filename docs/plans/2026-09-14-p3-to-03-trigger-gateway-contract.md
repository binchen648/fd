# P3-TO-03 Domain Event Trigger Gateway Contract

- Owner: Codex B, specification lane only
- Date: 2026-09-14
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`
- Source handoff: `docs/reports/2026-09-13-p3-to-03-trigger-gateway-handoff.md`
- Inventory authority: `artifacts/phase3-skill-coverage.json` and `docs/audits/fd-skill-semantic-axis-matrix.md`
- Ability map: `docs/audits/2026-09-14-p3-to-03-trigger-ability-map.md`
- Negative acceptance matrix: `docs/audits/2026-09-14-p3-to-03-trigger-negative-acceptance-matrix.md`
- Independent review: `docs/reports/2026-09-14-p3-to-03-reviewer-checklist.md`

## 1. Purpose And Boundary

This contract defines the common server-authoritative scheduling envelope for the **37 strict Domain Event Trigger abilities across 13 event types** in the corrected semantic-axis inventory.

The gateway owns only:

- accepting a reviewed typed domain event;
- discovering trigger candidates from authoritative authored/runtime metadata;
- binding stable event, source-card, source-ability, controller, and causation identity;
- deterministic scheduling according to an accepted ordering policy;
- separating forced from optional trigger scheduling;
- duplicate/idempotency protection;
- source-validity and event-validity revalidation before settlement;
- representing pending trigger work across projection/reconnect;
- terminal processed/declined/cancelled/invalidated bookkeeping;
- handing player input to the accepted Interaction Template contract when required.

The gateway does **not** own:

- the game rule that produces battle results, location movement, card play, declaration, resource loss, or setup events;
- target/response/yes-no/amount/order interaction semantics;
- effect primitive execution;
- lifecycle duration, reset, cleanup, source-close, or persistence policy;
- hidden-information reveal rules;
- battle power/outcome calculation;
- special subsystem behavior;
- card-specific trigger handlers;
- Gate A/B/C promotion or runtime migration.

An event being representable by this contract does not make every consumer of that event runtime-eligible. External dependencies in the ability map remain blockers until independently accepted.

## 2. Normative Principles

1. Event identity, trigger-source identity, and causation identity are separate concepts and must never be inferred from display text.
2. The server is authoritative for event creation, trigger discovery, scheduling, revalidation, and settlement.
3. A client may observe or answer an optional interaction but cannot create a domain event, choose trigger eligibility, overwrite continuation state, or mark a trigger processed.
4. Gateway eligibility is semantic. Card IDs and ability IDs may identify a scheduled source but may not decide whether the gateway supports the shape.
5. Every strict event has a stable `eventId`; every scheduled consumer has a stable trigger identity derived from the event plus source-card instance plus source ability.
6. Duplicate delivery, replay, reconnect, projection, or retry must not execute the same forced trigger twice or open duplicate optional interactions.
7. Source validity is rechecked immediately before settlement. A stale source, invalid controller, expired lifecycle, or no-longer-valid event dependency fails closed.
8. Optional scheduling uses the accepted P3-TO-05 interaction contract as synchronized at reachable commit `7aab428`; TO-03 does not redefine interaction semantics.
9. A failed gateway dispatch performs no mutation for that dispatch and never retries through legacy trigger resolution.
10. The gateway must not invent simultaneous-trigger priority. If reviewed rules do not define ordering and no accepted ordering contract applies, the affected runtime slice remains blocked.

## 3. Canonical Data Contract

The names below are normative schema concepts, not an instruction to add these exact TypeScript declarations in P3-TO-03.

```ts
type StrictDomainEventType =
  | 'after_battle_ended'
  | 'game_start'
  | 'after_controller_first_loses_battle'
  | 'before_situation_or_event_resolves'
  | 'after_controller_loses_battle'
  | 'after_controller_enters_location'
  | 'after_controller_loses_all_command_seals'
  | 'on_use_declared'
  | 'on_card_played'
  | 'after_battle_result_determined'
  | 'after_controller_gains_victory'
  | 'after_controller_wins_battle'
  | 'after_player_deployed_to_battlefield';

type TriggerPolicy = 'forced' | 'optional';
type TriggerTerminalState = 'processed' | 'declined' | 'cancelled' | 'invalidated';
type TriggerVisibility = 'public' | 'controller_only' | 'redacted';

type EventProducerRef =
  | {
      kind: 'card_ability';
      sourceCardInstanceId: string;
      sourceAbilityId: string;
    }
  | {
      kind: 'card';
      sourceCardInstanceId: string;
    }
  | {
      kind: 'system';
      sourceSystem: string;
    };

interface DomainEventEnvelope<TPayload = unknown> {
  eventId: string;
  type: StrictDomainEventType;
  createdRevision: number;
  causationId: string;
  actorPlayerId?: string;
  controllerPlayerId?: string;
  producer: EventProducerRef;
  visibility: TriggerVisibility;
  payload: TPayload;
}

interface ScheduledTrigger {
  triggerId: string;
  eventId: string;
  sourceCardInstanceId: string;
  sourceAbilityId: string;
  controllerPlayerId: string;
  policy: TriggerPolicy;
  createdRevision: number;
  orderingRef: string;
  continuationRef: string;
  terminalState?: TriggerTerminalState;
}

interface ProcessedTriggerKey {
  eventId: string;
  sourceCardInstanceId: string;
  sourceAbilityId: string;
}
```

`triggerId` may be generated independently, but the tuple `(eventId, sourceCardInstanceId, sourceAbilityId)` is the semantic idempotency key. A later implementation must reject a second live or terminal scheduling record for the same tuple.

`continuationRef` is server-owned. It may point to a typed primitive/effect continuation or to an accepted Interaction Template record for optional player input. Clients cannot submit or rewrite it.

## 4. Event Envelope Requirements

All strict events require:

- a non-empty discriminated producer identity: either `card_ability` with both card-instance and ability identity, `card` with card-instance identity, or `system` with a stable system identity;
- unique stable `eventId`;
- event type from the accepted 13-type inventory;
- authoritative creation revision;
- causation identity linking the event to the command, prior event, phase transition, or server process that produced it;
- actor/controller identities where the event semantics require them;
- producer identity sufficient to audit the source of the event without conflating that producer with a consuming trigger source;
- event-specific payload with stable entity IDs rather than names or array indexes;
- visibility classification compatible with existing hidden-information policy.

### 4.1 Event-Specific Minimum Payload

| Event type | Minimum event-specific payload | External owner that must validate production |
|---|---|---|
| `game_start` | match/round identity and startup causation | Match setup / lifecycle bootstrap |
| `on_use_declared` | declaring player, declared card instance, declaration identity | Card-play/declaration runtime |
| `on_card_played` | player, played card instance, resolved play identity and resulting zone/state required by consumers | Card Action / Card Zone runtime |
| `after_controller_enters_location` | player, `fromLocationId`, `toLocationId`, movement causation | Movement runtime |
| `after_player_deployed_to_battlefield` | player, destination battlefield/location, deployment causation | Movement + Battle runtime |
| `after_controller_loses_all_command_seals` | player, before/after seal counts and resource result identity | Resource runtime |
| `before_situation_or_event_resolves` | pending situation/event instance identity, controller/owner as applicable, resolution causation | Situation/Event runtime |
| `after_controller_first_loses_battle` | battle identity, controller, loss ordinal/first-loss fact from authoritative battle history | Battle runtime |
| `after_controller_loses_battle` | battle identity, controller, winner/loser participation needed by the consumer | Battle runtime |
| `after_battle_result_determined` | battle identity, participant set, winners/losers/result identity | Battle result runtime |
| `after_controller_gains_victory` | controller, source battle/result identity, VP/victory causation as applicable | Scoring/Battle runtime |
| `after_controller_wins_battle` | battle identity, controller, winner set and sole/shared-win facts needed by consumers | Battle runtime |
| `after_battle_ended` | battle identity, participant set, terminal battle state | Battle cleanup runtime |

The table defines minimum identity, not full game-rule semantics. A later runtime task may extend payloads, but it may not drop the identity required for deterministic replay and revalidation.

## 5. Trigger Discovery And Source Identity

For each accepted event, the gateway discovers candidate abilities from authoritative current state and compiled semantic metadata.

A candidate is valid only when:

- its authored semantic axis declares the exact event type;
- its source card instance exists in an allowed current state;
- the source ability identity exists on that source definition;
- the source belongs to the correct controller/owner for the authored trigger scope;
- authored requirements that are safe to evaluate at trigger-discovery time still hold;
- lifecycle, battle, hidden, special, or interaction dependencies required by the ability are either accepted or explicitly block runtime scheduling.

Discovery must not:

- branch on a named card or ability to decide generic gateway eligibility;
- scan translated text at runtime;
- use a fallback handler to reinterpret unsupported event semantics;
- treat phase timing, continuous requirements, response windows, or power hooks as domain events unless the corrected semantic-axis inventory classifies them as one of the 13 strict event types.

## 6. Forced And Optional Scheduling

### 6.1 Forced

All strict event consumers except authored `OPTIONAL_TRIGGER` rows use forced scheduling in this contract. This includes declaration reveal, residual, and continuous-formula rows that the corrected inventory classifies as strict domain-event consumers.

A forced trigger:

- is scheduled automatically after discovery and revalidation;
- cannot be declined by the client;
- executes only after its ordering slot is authoritative;
- becomes `processed` or `invalidated` exactly once; effect-settlement failure itself does not create a terminal state.

### 6.2 Optional

An authored `OPTIONAL_TRIGGER` is scheduled as optional and must hand player intent to the accepted Interaction Template contract. Current strict-trigger inventory uses `YES_NO` for these rows.

An optional trigger:

- creates one server-owned interaction for the trigger owner only after the event/source candidate is valid;
- retains the same event and trigger identity across reconnect;
- records explicit decline as a terminal trigger result;
- revalidates source/event legality after a `yes` decision before effect settlement;
- cannot be auto-accepted due to disconnect, timeout, list position, or stale client state.

TO-03 does not define the interaction wire schema; it only defines when and how the trigger scheduler hands off to TO-05.

### 6.3 Cancellation

Trigger cancellation is distinct from decline and invalidation.

- Forced triggers are not cancellable by the client. A cancel attempt against a forced trigger is rejected with no mutation.
- Optional trigger cancellation delegates to the accepted P3-TO-05 `cancelPolicy`; TO-03 does not create a second cancellation protocol.
- The default optional-trigger cancellation policy is therefore `forbidden` unless the authored/accepted interaction contract explicitly permits `explicit_cancel`.
- `decline` is a player decision not to execute an optional trigger. It terminates as `declined`, not `cancelled`.
- A permitted `explicit_cancel` terminates the trigger as `cancelled`, executes no trigger effect continuation, and cannot roll back an earlier successfully committed command.
- Cancellation closes only scheduler/interaction bookkeeping for that trigger identity. It does not close, move, reset, reveal, or otherwise clean up the source card; Lifecycle, Card Zone, Hidden, Battle, or another accepted owner remains responsible for such state.
- `cancelled` is replay-protected and idempotent for the same `(eventId, sourceCardInstanceId, sourceAbilityId)` key. Reconnect or duplicate commands cannot reopen it.

## 7. Deterministic Ordering

The gateway must maintain a deterministic event queue and deterministic ordering metadata, but it must not invent game semantics.

Rules:

1. Event creation order is preserved by stable server event identity/sequence, not JavaScript object iteration order.
2. Trigger candidates for one event must be represented as an explicit ordered set before execution begins.
3. If the rules or an accepted external contract define priority/controller order, the scheduler encodes that policy explicitly in `orderingRef`.
4. If the rules require a player to choose an order, scheduling must hand off to an accepted `ORDER` interaction contract; no current-card denominator is implied by merely specifying this capability.
5. If simultaneous ordering is materially ambiguous and no reviewed rule or accepted ordering contract resolves it, runtime migration for that collision remains blocked.
6. Card ID, ability ID, source-file order, map/object enumeration order, and lexical sorting are acceptable only as stable technical tie-breakers **after** semantic order is fixed and only if the tie-break cannot change a game outcome. They are never a substitute for a missing game rule.

## 8. Idempotency, Replay, And Reentrancy

The processed-trigger key is `(eventId, sourceCardInstanceId, sourceAbilityId)`.

The gateway must reject or no-op deterministically when:

- the same event is delivered twice;
- reconnect causes a pending trigger to be projected again;
- the client replays an optional-trigger decision after terminal settlement;
- nested effect execution re-emits the same logical event identity;
- retry logic attempts to reschedule a terminal trigger.

A *new* legitimate event caused by an effect must receive a new event ID and causation link. Idempotency must not suppress distinct later events that happen to share type, player, card, or payload values.

Reentrant events are queued through the same gateway. They may not recursively execute an unbounded card-specific callback stack. The implementation must preserve causation identity and either schedule the nested event after the current atomic settlement boundary or follow an explicitly reviewed nested-event rule.

## 9. Revalidation And Transaction Boundary

Before a scheduled trigger settles, the server revalidates:

- event identity is known and not terminally invalidated;
- trigger has not already been processed;
- source card instance and ability still exist;
- controller/source ownership is still valid;
- required source-active, location, battle, limit, or lifecycle state is still valid;
- any optional interaction is owned by the correct player and has the correct current revision;
- typed effect continuation remains supported.

A failing dispatch or forced settlement rolls back all mutation performed by that dispatch. It preserves, at minimum:

- mana, VP, command seals, and other resources;
- card zones, control, visibility, and active/closed state;
- battle, movement, phase, and priority state;
- pending interactions and trigger queue state except for a separately committed prior command;
- events, logs, processed-trigger records, and revision.

A failure in a later command does not roll back an earlier successfully committed command. This matches the accepted staged-interaction transaction boundary.

Effect-settlement failure is not an authoritative terminal transition. After rollback, the trigger remains non-terminal/unprocessed with the same live scheduling state unless a later authoritative revalidation proves the source/event permanently invalid.

`invalidated` is a successful scheduler outcome, not a failed-dispatch side effect. It may commit only when a revalidation dispatch itself succeeds in proving that the trigger can no longer legally settle (for example, a required source no longer exists). That invalidation transition may update scheduler bookkeeping, terminal history, revision, and an audit log as one atomic successful scheduler transaction, but it may not retain any failed effect mutation.

## 10. Projection And Reconnect

Projection must expose enough information to render server progress without leaking hidden data.

For forced triggers, ordinary clients normally need only public/redacted scheduling or result information already permitted by the source/event visibility. Internal continuation and hidden candidate data remain server-only.

For optional triggers, the owner projection is delegated to the accepted Interaction Template contract. Non-owner projections may show a redacted waiting state but must not expose private cards, hidden event payload fields, continuation references, or server diagnostics.

Reconnect:

- does not recreate the event or trigger;
- does not increment revision by itself;
- restores the same pending optional trigger/interaction identity to the authorized player;
- does not re-run already processed forced triggers;
- cannot make an old socket close invalidate a replacement active session.

## 11. Terminal States And Cleanup Ownership

`processed`, `declined`, `cancelled`, and `invalidated` trigger records are terminal for the same trigger identity. Effect-settlement failure is non-terminal and leaves authoritative trigger state unchanged after rollback.

The Trigger Gateway owns scheduler bookkeeping only. It may remove a trigger from the live queue and retain replay-protection history.

It does not own:

- source-card cleanup, including cleanup after a trigger is cancelled;
- duration expiration;
- once-per-round / once-per-game reset policy;
- battle cleanup;
- hidden information restoration;
- card movement caused by the effect.

Those remain with Lifecycle, Battle, Hidden, Card Zone, or other accepted external owners.

## 12. Composition Boundaries

| Dependency | Trigger Gateway responsibility | External owner |
|---|---|---|
| Interaction | open one optional-intent handoff after trigger eligibility is valid | accepted P3-TO-05 Interaction Template |
| Lifecycle / limits | carry stable source identity and revalidate current validity | P3-TO-04 Lifecycle Policy Gateway |
| Battle | consume a valid battle event and revalidate referenced battle identity | Battle/Scoring runtime |
| Hidden / visibility | preserve event and source visibility labels | Hidden Information / Visibility runtime |
| Resource / Card Zone / Card Action | schedule continuation only | typed primitive/data-flow owner |
| Special subsystem | retain explicit blocker | subsystem-specific reviewed owner |

A trigger ability with an unresolved external dependency remains blocked even after this spec is accepted.

## 13. Fail-Closed Requirements

Compiler/admission or gateway setup must reject:

- unknown event type;
- missing or duplicate event ID;
- missing causation identity where required;
- missing source card instance or source ability identity for a scheduled consumer;
- unsupported optional/forced policy shape;
- malformed ordering policy;
- client-authored processed state, continuation, candidate set, or event payload;
- recognized trigger shape with an unsupported external dependency when the runtime slice claims full support.

Runtime must reject, with no mutation for the failing dispatch:

- stale or unknown event;
- duplicate processed-trigger key;
- source missing, moved, closed, transformed, or otherwise invalid when the contract requires current validity;
- wrong controller/owner;
- stale interaction revision or wrong optional-trigger owner;
- invalid event payload identity;
- unsupported or ambiguous simultaneous ordering;
- corrupt continuation;
- unsupported nested/reentrant event shape.

A recognized gateway failure may return a rule rejection such as `resolution_failed`; it must not call a legacy trigger handler or card/ability-ID fallback.

## 14. Current Inventory Reconciliation

Current corrected denominator:

```text
strictDomainTriggerAbilities=37
eventTypes=13
```

Event counts:

| Event | Count |
|---|---:|
| `on_use_declared` | 9 |
| `on_card_played` | 6 |
| `game_start` | 4 |
| `after_controller_loses_battle` | 4 |
| `after_battle_result_determined` | 3 |
| `after_controller_wins_battle` | 3 |
| `after_battle_ended` | 2 |
| `after_controller_first_loses_battle` | 1 |
| `before_situation_or_event_resolves` | 1 |
| `after_controller_enters_location` | 1 |
| `after_controller_loses_all_command_seals` | 1 |
| `after_controller_gains_victory` | 1 |
| `after_player_deployed_to_battlefield` | 1 |

The exact 37-row mapping is normative evidence in `docs/audits/2026-09-14-p3-to-03-trigger-ability-map.md`.

## 15. Runtime Handoff Criteria

P3-TO-03 may leave `SPEC_REVIEW_READY` only after independent review confirms:

- all 37 strict trigger abilities are mapped exactly once;
- all 13 event types reconcile to the corrected inventory;
- event, source, controller, causation, and processed identity are explicit and non-conflated;
- forced/optional scheduling is server-authoritative;
- optional scheduling composes with accepted TO-05 rather than reimplementing interaction;
- simultaneous-order ambiguity is blocked rather than guessed;
- duplicate delivery/replay/reconnect cannot double-execute;
- revalidation and rollback are fail-closed;
- projection/reconnect rules do not leak hidden state;
- Lifecycle, Battle, Hidden, Special, primitive execution, and cleanup ownership stay external;
- no runtime, authoring, generated-content, taxonomy, KPI, or Gate changes were made by this task.

Only after `SPEC_ACCEPTED` may a separate runtime task choose a low-coupling representative. The first runtime slice should prefer an event consumer with accepted downstream primitive behavior and no unresolved Battle, Lifecycle, Hidden, Interaction, or Special dependency. Representative selection is not performed by this specification.