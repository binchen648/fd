# P3-TO-05 Interaction Template Contract

- Owner: Codex B
- Date: 2026-09-13
- Status: `SPEC_REVIEW_READY`
- Scope: contract only; consumes corrected taxonomy baseline `146213f`; no runtime, protocol, projection, E2E, classifier, taxonomy, card authoring, or card migration changes
- Inventory authority: regenerated `docs/audits/fd-skill-semantic-axis-matrix.md`
- Ability mapping: `docs/audits/2026-09-13-p3-to-05-interaction-ability-map.md`
- Independent review: `docs/reports/2026-09-13-p3-to-05-reviewer-checklist.md`

## 1. Purpose And Boundary

This contract defines the common server-authoritative interaction envelope needed by target selection, response, branch, yes/no, amount, and order interactions. The corrected generated matrix identifies 18 explicit interaction abilities and 11 strict `PendingInteraction` consumers.

This specification does not:

- select or hardcode the representative ability for a later runtime slice;
- authorize P3-B12 or any other interaction runtime implementation;
- modify the consumed taxonomy/coverage baseline or change any Gate status;
- absorb Trigger, Lifecycle, Battle, Hidden Information, Modifier, movement, card-action, or result-binding semantics into the interaction gateway;
- treat the current `PendingDecision` representation as the normative contract.

The later runtime slice may use an adapter around existing state while migrating, but observable behavior must satisfy this contract and must not fall back to legacy interaction resolution after the new gateway claims a route.

## 2. Normative Principles

1. The server derives legal candidates, validates intent, owns continuation data, and performs settlement.
2. The client submits only a stable interaction identity, an expected match revision, and template-specific intent.
3. Display labels, array indexes, client projections, and client-supplied binding values are never authoritative identities.
4. An interaction is owned by exactly one player unless an explicit response-window coordinator contract says otherwise.
5. Private candidate data is projected only to the owner. Other viewers receive a redacted waiting envelope.
6. Every mutation command uses revision compare-and-swap and revalidates candidates against current authoritative state.
7. A rejected, stale, replayed, unauthorized, malformed, cancelled, timed-out, or invalidated command performs no mutation for that dispatch.
8. Unsupported or malformed gateway candidates fail closed and do not enter legacy target or effect resolution.
9. Interaction mechanics coordinate choice only. Trigger scheduling, lifecycle cleanup, battle calculation, hidden-card reveal, modifiers, and effect execution remain owned by their respective contracts.
10. An effect node of type `branch` is not an interaction by itself. It becomes `BRANCH_CHOICE` only when authoring declares a player-owned choice target or an equivalent explicit player option/intent schema.

## 3. Canonical Data Contract

The names below are normative schema concepts, not an instruction to add these exact TypeScript declarations during P3-TO-05.

```ts
type InteractionTemplate =
  | 'target'
  | 'response'
  | 'branch'
  | 'yes_no'
  | 'amount'
  | 'order';

type InteractionVisibility = 'public' | 'owner_only';
type CancelPolicy = 'forbidden' | 'decline' | 'explicit_cancel';

interface EntityRef {
  kind: 'card' | 'player' | 'location' | 'option';
  id: string;
}

interface PendingInteraction {
  interactionId: string;
  template: InteractionTemplate;
  ownerPlayerId: string;
  sourceCardInstanceId: string;
  abilityId: string;
  originatingEventId?: string;
  createdRevision: number;
  visibility: InteractionVisibility;
  cancelPolicy: CancelPolicy;
  deadlineAt?: string;
  constraints: InteractionConstraints;
  candidates: readonly EntityRef[];
  continuationRef: string;
}

interface InteractionCommand<TIntent> {
  interactionId: string;
  expectedRevision: number;
  intent: TIntent;
}
```

`continuationRef` denotes a server-owned, serializable continuation record. It must resolve to validated source identity, execution position, committed-stage boundary, and any typed results needed by the next stage. A client must never submit or overwrite continuation state, result bindings, costs, effects, or candidate metadata.

`candidates` is an authoritative snapshot used for projection and deterministic recovery, but command settlement must also rederive or revalidate legality against current match state. Snapshot membership alone is insufficient when an entity moved, changed owner, became hidden, or otherwise became illegal.

## 4. Identity And Constraints

### 4.1 Stable identity

- `interactionId` is server generated and unique within a match history.
- Entity selection uses `EntityRef.kind + EntityRef.id`; text, translated name, position, and list index are presentation only.
- Card targets use card instance identity, not definition identity, unless a template explicitly represents a definition-level option rather than an in-match card.
- An interaction restored after reconnect retains its original identity, owner, creation revision, constraints, candidate identities, and continuation reference.
- A completed or terminal interaction ID is retained in replay protection long enough to reject duplicate commands deterministically.

### 4.2 Constraint forms

```ts
type InteractionConstraints =
  | { kind: 'target'; targetKind: EntityRef['kind']; min: number; max: number; distinct: true }
  | { kind: 'response'; allowed: readonly string[] }
  | { kind: 'branch'; optionIds: readonly string[]; min: 1; max: 1 }
  | { kind: 'yes_no' }
  | { kind: 'amount'; min: number; max: number; step: number }
  | { kind: 'order'; members: readonly EntityRef[]; exactPermutation: true };
```

Bounds and option sets are computed by the server. `min`, `max`, and `step` must be finite integers with `min <= max` and `step > 0`. Target selections are distinct unless a future reviewed contract explicitly introduces multiplicity. An order intent must be an exact permutation of the authoritative member set: no omission, duplication, insertion, or identity substitution.

## 5. Template Contracts

| Template | Client intent | Server validation | Settlement meaning |
|---|---|---|---|
| `target` | ordered or unordered `EntityRef[]` as declared | ownership, visibility, kind, cardinality, distinctness, snapshot membership, current legality | continue with server-bound target identities |
| `response` | one allowed response ID | response-window ownership, priority, source availability, timing, cost, current allowed set | accept, decline, or execute the chosen response according to the source contract |
| `branch` | one stable option ID | explicit player-choice schema, exact option membership, and current branch preconditions | continue only through the player-selected server-authored branch |
| `yes_no` | boolean | owner, timing window, optional-trigger availability | `yes` continues; `no` terminates as an explicit decline without running effects |
| `amount` | integer | finite integer, min/max/step, affordability or resource-dependent bound revalidation | bind the validated amount to the server continuation |
| `order` | ordered `EntityRef[]` | exact permutation and current member validity | bind deterministic order without changing membership |

Future abilities may compose templates in stages, for example branch then amount or branch then target. Each stage receives a distinct interaction ID and revision. A completed earlier dispatch remains committed; failure of a later dispatch rolls back only the later dispatch. Cross-command rollback is forbidden. No current-card-pool `CHOOSE_AMOUNT` membership is asserted by this contract.

The authoring-level corrected inventory contains no explicit `CHOOSE_AMOUNT` or `ORDER` ability. Both templates are specified because amount and ordering are part of the assigned gateway family, but each current inventory denominator is zero and neither can inherit acceptance evidence from another template.

## 6. State Machine

```text
ABSENT
  -> PENDING

PENDING
  -> RESOLVING
  -> DECLINED       (only when policy permits)
  -> CANCELLED      (only when policy permits)
  -> TIMED_OUT      (only when a deadline is authored)
  -> INVALIDATED    (authoritative state no longer permits resolution)

RESOLVING
  -> RESOLVED
  -> PENDING        (next authored interaction stage)
  -> FAILED         (current dispatch rolled back)
```

Terminal states are immutable. A command against a terminal or replaced interaction is rejected as stale/replayed and cannot create a new interaction. Only one command may win a given revision. Settlement and transition to the next state are one authoritative transaction.

## 7. Projection And Visibility

The owner projection contains the interaction ID, template, source identity allowed by existing visibility rules, constraints, legal candidate identities and display data, cancel policy, and deadline when enabled.

Non-owner projections contain only a redacted waiting envelope sufficient to render that the match is waiting for `ownerPlayerId`. They must not expose:

- owner-only candidate identities or counts when count itself is private;
- hidden card definitions, ordering, private-look contents, or rejected candidates;
- continuation references, bindings, branch internals, costs not otherwise public, or validation diagnostics.

`owner_only` is a projection policy, not permission to bypass the Hidden Information contract. An ability involving private look or hidden cards remains blocked on that separate contract even if this gateway can represent its choice.

## 8. Revision, Reconnect, And Replay

- `expectedRevision` is mandatory for every interaction mutation at protocol and authoritative handler boundaries.
- A missing revision is rejected as `missing_expected_revision`; a mismatched revision is rejected as stale. Neither rejection mutates state, logs, events, pending interaction, priority, or revision.
- Creating, resolving, declining, cancelling, timing out, or invalidating an interaction increments revision exactly as defined by the enclosing accepted match transaction.
- Connecting, disconnecting, projecting, or restoring a projection does not itself resolve or recreate the interaction and does not increment revision.
- Reconnect returns the same pending interaction to the same authorized player. Old sockets closing after a replacement socket connects cannot mark the replacement session disconnected.
- A command replayed after successful settlement is rejected even when its payload is byte-identical.

P3-TO-05 adopts equivalent existing stale/reconnect facilities as specification references: the remote-room patterns in `e2e/fd-golden-eater-result-binding.spec.ts` and `e2e/fd-add-to-attack-card-action.spec.ts`, plus authoritative server regressions in `apps/server/src/match-server.test.ts`. This does not mark P3-TO-07 complete; shared helper extraction remains owned by P3-TO-07.

## 9. Cancellation And Timeout

- Default `cancelPolicy` is `forbidden`.
- `decline` is valid only for an authored optional response or yes/no interaction and is a terminal choice, not a generic undo.
- `explicit_cancel` requires an ability-level rule that defines whether already committed earlier stages remain committed. It cannot restore state from a previous command.
- Closing a browser, losing a socket, or reconnecting is not cancellation.
- Timeout is disabled unless the authored contract supplies a server-clock deadline and deterministic terminal behavior.
- A timeout never auto-selects a private target, cheapest amount, first option, or arbitrary order.
- Timeout processing revalidates interaction identity and revision, is idempotent, and emits an auditable terminal reason without leaking private candidates.

## 10. Fail-Closed And Transaction Rules

Compiler or admission validation must reject:

- an unknown template or unsupported template composition;
- malformed bounds, duplicate option IDs, invalid visibility, absent owner/source identity, or nonserializable continuation data;
- a gateway route candidate whose exact semantic contract is not supported;
- client-authored continuation, bindings, effects, costs, or candidate metadata.

Runtime validation must reject, with no mutation in the failing dispatch:

- wrong owner, interaction ID, revision, template, target kind, cardinality, amount, option, order, or response timing;
- candidates that are absent, duplicated, hidden from the owner, moved, no longer legal, or no longer satisfy source conditions;
- missing/corrupt continuation state or unsupported next-stage shape;
- cancellation or timeout not allowed by policy.

If a route candidate is recognized but exact validation fails, the gateway returns a rule rejection such as `resolution_failed`; it must not call legacy `resolveEffect`, legacy pending selection, or a card/ability-ID fallback. A failed dispatch preserves mana, VP, command seals, cards and zones, statuses, pending state, priority, phase, events, logs, and revision as they existed at dispatch start.

## 11. Composition Boundaries

| Dependency | Interaction gateway responsibility | External owner |
|---|---|---|
| Trigger/response window | represent owner intent after a valid window is supplied | Trigger Gateway schedules and closes the window |
| Lifecycle/limits | carry stable source identity for revalidation | Lifecycle Policy owns duration, usage, reset, cleanup |
| Battle | revalidate candidates supplied by battle state | Battle runtime owns outcome, participants, power, and timing |
| Hidden/private | apply declared projection visibility | Hidden Information owns reveal and private-card legality |
| Modifier | choose an authored branch/amount only | Modifier runtime owns modifier semantics and cleanup |
| Card action/movement/resource/result binding | bind validated intent into continuation | Typed primitive/data-flow runtime owns mutation and results |

An interaction template being representable does not make the enclosing ability eligible for migration. Every external dependency must either have an accepted contract/runtime or remain an explicit blocker.

## 12. Exit Criteria For This Spec

P3-TO-05 can leave `SPEC_REVIEW_READY` only after Codex R independently confirms:

- the contract is server-authoritative and fail-closed;
- all 18 explicit interaction abilities and all 11 strict pending abilities are mapped exactly once at the ability level, with multi-template memberships preserved;
- automatic effect `branch` nodes are excluded unless backed by an explicit player-choice target or intent schema;
- structured target visibility and private-zone scope feed the regenerated visibility axis;
- visibility, reconnect, revision, stale replay, cancellation, timeout, and rollback are testable;
- no representative card is preselected and no Gate status is promoted;
- P3-TO-07 is referenced as future shared infrastructure, not falsely marked complete.

Only after that review may a separate task compare low-coupling strict-pending candidates and dispatch one scoped runtime representative.
