# P3-TO-04 Lifecycle Policy Gateway Contract

- Owner: Codex B, specification lane only
- Date: 2026-09-14
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`
- Source handoff: `docs/reports/2026-09-14-p3-to-04-lifecycle-gateway-handoff.md`
- Inventory authority: `artifacts/phase3-skill-coverage.json` and corrected semantic-axis matrix
- Ability map: `docs/audits/2026-09-14-p3-to-04-lifecycle-ability-map.md`
- Negative acceptance matrix: `docs/audits/2026-09-14-p3-to-04-lifecycle-negative-acceptance-matrix.md`
- Independent review: `docs/reports/2026-09-14-p3-to-04-reviewer-checklist.md`

## 1. Purpose And Boundary

This contract defines the server-authoritative Lifecycle Policy Gateway for the **11 explicit lifecycle/reset abilities** in the corrected ability-level inventory.

Lifecycle owns the state machine that answers:

- what source instance/ability a policy belongs to;
- when lifecycle state is installed or a usage/unique claim is committed;
- how long a supported policy remains live;
- when a usage namespace resets or persists;
- when active/closed/moved/transformed/missing-source validity invalidates lifecycle-owned state;
- when a fixed-duration policy becomes due for expiry/expiration and what stable expiration transition identity owns that boundary;
- which cleanup directive is required at expiry;
- how duplicate reset/expiry/cleanup/reconnect attempts are made idempotent;
- what lifecycle state is authoritative after rollback.

Lifecycle does **not** own:

- Domain Event Trigger detection or ordering;
- player target/yes-no/response/order interaction;
- card play, close, move, activate, create, or other Card Action/Card Zone execution;
- Battle result, power, scoring, deployment, or location semantics;
- Hidden Information reveal/visibility legality;
- Modifier arithmetic or power calculation;
- Special subsystem behavior;
- card-specific cleanup branches;
- Gate A/B/C promotion or runtime migration.

Lifecycle may participate in one atomic transaction with an external owner, but participation does not transfer ownership of the external mutation.

## 2. Corrected Denominator

```text
explicitLifecycleAbilities=11
```

The 11-row evidence map is normative for this task. Modifier-local lifecycle metadata outside the corrected ability-level lifecycle axis does not silently increase this denominator.

Current normalized families represented by the 11 rows:

- per-round `this_card` usage;
- per-game `this_card` usage;
- unique-keyword-group / trigger-window conflict policy;
- `while_card_active` source-bound duration;
- fixed `round_count` duration;
- cleanup when source leaves active area;
- cleanup by expiry after duration;
- `remain_active` cleanup policy;
- immediate lifecycle installation.

## 3. Normative Principles

1. Lifecycle identity is stable and server-owned. Display names, translated text, array indexes, card IDs, or ability IDs may identify evidence but may not decide generic lifecycle eligibility.
2. Policy state is scoped to a source card **instance** plus source ability/policy identity. A same-definition new card instance does not inherit `this_card` state.
3. A transformed/replaced definition cannot silently adopt lifecycle or usage state from an unrelated old ability. Transfer requires an explicit reviewed transfer policy; otherwise the old state terminates/cleans when its source ability is no longer valid.
4. Usage and unique-group claims commit only at their normalized authoritative consumption boundary. Merely offering an interaction never consumes a use or unique claim.
5. Failed effect transactions, stale commands, unauthorized commands, declined choices, and forbidden cancellation do not consume usage unless a separately committed earlier lifecycle transition is explicitly part of the reviewed contract.
6. Per-round and per-game limits do not reset because a client reconnects, a card changes ordinary zones, or a new projection is created.
7. Source movement/close and lifecycle cleanup must be atomic when cleanup is a mandatory consequence of that source transition. If lifecycle cleanup fails, the composed source transition must not partially commit.
8. Lifecycle does not guess cleanup destination. A movement-producing expiry needs an explicit or independently accepted resolved cleanup-destination policy before runtime admission.
9. `remain_active` means Lifecycle does not automatically move/close the source at ordinary cleanup solely because the round ended. Another accepted rule may still close/remove the source.
10. Unsupported, stale, duplicate, ambiguous, or corrupted lifecycle state must **fail closed** and never fall back to a card-specific legacy lifecycle handler.

## 4. Canonical Data Concepts

Names below are normative schema concepts, not instructions to add these exact TypeScript declarations during P3-TO-04.

```ts
interface LifecycleSourceRef {
  sourceCardInstanceId: string;
  sourceAbilityId: string;
  controllerPlayerId: string;
  sourceDefinitionIdAtInstall: string;
}

type UsageConsumptionBoundary =
  | 'successful_effect_commit'
  | 'successful_card_play_commit'
  | 'trigger_schedule_commit'
  | 'successful_trigger_activation';

type UsageLimitPolicy = {
  kind: 'usage_limit';
  scope: 'this_card';
  cadence: 'per_round' | 'per_game';
  uses: number;
  consumeOn: UsageConsumptionBoundary;
};

type UniqueWindowPolicy = {
  kind: 'unique_trigger_window_group';
  scope: 'unique_keyword_group';
  groupId: string;
  window: 'trigger_window';
  conflictPolicy: 'only_one_effect_may_activate_per_window';
  claimOn: 'successful_trigger_activation';
};

type RoundBoundaryConvention =
  | 'start_round_inclusive'
  | 'next_round_boundary';

type DurationPolicy =
  | {
      kind: 'while_card_active';
      starts: 'immediate';
      cleanup: 'when_card_leaves_active_area' | 'remain_active';
    }
  | {
      kind: 'round_count';
      starts: 'immediate';
      rounds: number;
      boundaryConvention: RoundBoundaryConvention;
      cleanup: 'expire_after_duration';
      cleanupDestination: ResolvedCleanupDestination;
    }
  | {
      kind: 'this_round';
      starts: 'immediate';
      cleanup: 'expire_after_duration';
      cleanupDestination?: ResolvedCleanupDestination;
    };

type ResolvedCleanupDestination =
  | { kind: 'explicit_zone'; zone: 'skill' | 'discard' | 'removed_from_game' }
  | { kind: 'accepted_card_zone_policy'; policyId: string };

type LifecyclePolicy = UsageLimitPolicy | UniqueWindowPolicy | DurationPolicy;

type LifecycleTerminalReason =
  | 'duration_expired'
  | 'source_left_active_area'
  | 'source_ability_invalidated'
  | 'window_closed';

interface LifecycleState {
  lifecycleId: string;
  source: LifecycleSourceRef;
  policyKey: string;
  policy: LifecyclePolicy;
  installedRevision: number;
  installedRound: number;
  status: 'active' | 'terminal';
  terminalReason?: LifecycleTerminalReason;
  usageCount?: number;
  usageRound?: number;
  claimedWindowId?: string;
}

interface LifecycleTransition {
  transitionId: string;
  lifecycleId: string;
  kind: 'install' | 'consume_usage' | 'claim_unique' | 'expire' | 'source_invalidated' | 'reset';
  causationId: string;
  createdRevision: number;
  roundId?: number;
  triggerWindowId?: string;
}
```

`policyKey` is a normalized semantic-policy identity. It is not a display name and must not be generated by parsing printed text at runtime.

`sourceDefinitionIdAtInstall` is evidence for revalidation. It does not make definition ID a generic eligibility switch.

## 5. Lifecycle Installation

A lifecycle state is installed only after its authored start condition has been validated and the enclosing authoritative command reaches the policy's commit boundary.

For current immediate residual forms:

- source play/effect validation happens first;
- lifecycle policy is normalized and validated;
- lifecycle installation and any mandatory source/effect mutation commit in one transaction;
- failed installation rolls back the enclosing mutation when lifecycle is a required consequence.

Duplicate installation of the same active `(sourceCardInstanceId, sourceAbilityId, policyKey)` is rejected or deterministically idempotent; it must not stack an extra copy unless the policy explicitly supports stacking. None of the current 11 rows authorizes stacking.

## 6. Usage Limits

### 6.1 Common Rules

For `scope=this_card`, semantic usage scope is the authoritative source card instance plus source ability. Definition-equivalent replacement instances do not share the count.

`uses` must be a positive safe integer. Unknown cadence/scope/consume boundary fails admission.

Consumption is atomic with the normalized boundary:

- `successful_effect_commit`: counter increments only if the effect transaction commits;
- `successful_card_play_commit`: counter increments with the play transaction, not when legality is merely checked;
- `trigger_schedule_commit`: counter/reservation commits with accepted authoritative trigger scheduling, so a later separate delayed-resolution failure does not retroactively erase the earlier trigger event;
- `successful_trigger_activation`: counter/group claim commits only when the optional/forced activation itself commits.

If a task cannot prove the correct consumption boundary from reviewed rules/evidence, that consumer remains blocked rather than defaulting to one.

### 6.2 Per-Round

Per-round state is keyed by authoritative round identity. A fresh round gets a fresh semantic namespace; reconnect/projection does not create it.

Implementations may retain old round records for replay/audit. Pruning is storage cleanup only and must not change semantic availability.

The new round boundary is owned by the round/phase controller. Lifecycle consumes that authoritative boundary; it does not advance the round itself.

### 6.3 Per-Game

Per-game state persists for the same source card instance/ability until match termination. Ordinary movement between hand/skill/field/attack/discard-like zones does not reset the count by itself.

If the source is removed, transformed, or replaced, the historical usage record may remain for replay. A new or transformed ability cannot inherit it unless an explicit reviewed transfer policy says so.

### 6.4 Delayed Trigger Consumption

A delayed trigger such as a "first event" policy may require an earlier committed reservation/usage transition so subsequent qualifying events cannot schedule duplicates before the delayed effect settles.

That boundary must be explicit (`trigger_schedule_commit`) in the normalized lifecycle contract. Lifecycle does not infer it merely from `per_game` or the word "first" in printed text.

## 7. Unique Trigger-Window Groups

Current unique-group rows use:

```text
scope=unique_keyword_group
groupId=artoriac-pilgrim-unique-on-win
window=trigger_window
conflictPolicy=only_one_effect_may_activate_per_window
```

The generic claim key is:

```text
controllerPlayerId + semantic groupId + authoritative triggerWindowId
```

Rules:

- opening/offering multiple optional choices does not claim the group;
- decline, cancellation, stale replay, or failed activation does not claim it;
- successful activation atomically claims the group with that activation transaction;
- once claimed, peer choices in the same controller/group/window become ineligible and their Interaction/Trigger bookkeeping closes according to the accepted external contracts;
- two concurrent/stale attempts cannot both commit a claim;
- a new trigger-window ID creates a new unique-window namespace;
- Trigger owns event/window ordering; Interaction owns player choice; Lifecycle owns the authoritative unique-group claim.

## 8. Source Validity And Active-Area Semantics

`while_card_active` depends on authoritative source state supplied by Card Zone/Card Action/Lifecycle integration.

A source-bound policy must revalidate:

- source card instance still exists;
- controller/owner semantics required by the policy still hold;
- source ability/policy still exists on the current valid definition, unless an explicit transfer contract applies;
- source is active and in an accepted active area for `while_card_active`;
- source is not closed/face-down/inactive when that invalidates the policy.

### 8.1 `when_card_leaves_active_area`

This cleanup policy means the lifecycle-owned state/effects end as a consequence of an accepted source transition out of active state/area.

Lifecycle does **not** move or close the source card. The external source-transition owner does that.

When cleanup is mandatory, the source transition and lifecycle cleanup are one atomic composed transaction:

```text
validate source transition
-> compute affected lifecycle records
-> apply external card transition + lifecycle cleanup in working state
-> emit typed transition/cleanup evidence
-> commit once
```

If lifecycle cleanup fails, the composed source transition does not partially commit.

This is the required boundary for later P3-B08 source-close work: `close_source_card` owns closing/movement; Lifecycle owns cleanup of state that depends on the source remaining active.

### 8.2 Transform / Replacement

A transform/replacement that changes the source definition or removes the source ability invalidates the old lifecycle policy unless an explicit reviewed transfer policy exists.

No provenance/state adoption by same name, same definition family, or same ability string is allowed implicitly. A transfer must name the source lifecycle identity and target semantic policy explicitly and be independently reviewed.

## 9. Fixed Duration And Round Boundaries

A normalized fixed-duration state records at minimum:

- authoritative install round;
- positive finite duration;
- explicit `boundaryConvention`;
- resolved cleanup directive before runtime admission;
- stable expiry/transition identity.

There is **no implicit default** for how an authored `round_count` counts the install round. A runtime packet must bind the card/rules evidence to one accepted boundary convention. The current Artoria Caster `rounds=2` row remains blocked from Gate promotion until that exact timing is confirmed.

`this_round` may be represented for composition with separately reviewed modifier-local lifecycle policies, but it does not add abilities to the 11-row denominator and is not promoted by P3-TO-04 alone.

For `this_round`, an omitted `cleanupDestination` means **state-only expiry**: Lifecycle removes only lifecycle-owned effect/state at the accepted round boundary and must not move the source. If the reviewed rule requires source movement, a resolved cleanup destination becomes mandatory before runtime admission.

Duplicate round-boundary processing must not expire a lifecycle twice or move a source twice.

## 10. Cleanup Policies

### 10.1 `expire_after_duration`

Lifecycle owns deciding that a valid fixed-duration policy is due to expire. If expiry requires source movement, an external Card Zone/Card Action owner performs that movement using a cleanup destination already resolved before runtime admission.

Lifecycle must not derive a destination at runtime from:

- character/card names;
- translated text;
- arbitrary card type heuristics not backed by an accepted policy;
- current zone alone;
- legacy handler behavior.

If no explicit or accepted cleanup-destination policy is available, the runtime consumer remains blocked.

Expiry + required source movement + lifecycle teardown are one atomic composed transaction. A failure leaves the pre-expiry authoritative state unchanged for that dispatch.

### 10.2 `remain_active`

`remain_active` means ordinary cleanup controlled by this lifecycle policy performs no automatic source-card movement/close. The source and lifecycle effect continue while the `while_card_active` source-validity condition remains true.

Another accepted rule may later close, remove, transform, or otherwise invalidate the source. Lifecycle then performs the applicable source-invalidated teardown; `remain_active` is not immunity from other rules.

### 10.3 State-Only Cleanup

Usage/history and terminal lifecycle records may be retained for replay/audit. Removing a live modifier/visibility/persistence record is distinct from deleting evidence history.

## 11. Reset Ownership

Lifecycle owns usage/claim state but not the events that define round, match, or trigger-window boundaries.

- round controller supplies authoritative round identity;
- match/session owner supplies match lifetime;
- Trigger Gateway supplies authoritative trigger-window identity/order;
- Interaction Template supplies optional decision settlement;
- Lifecycle updates its own usage/claim availability from those accepted boundaries.

No client command may directly reset a usage counter or unique group.

## 12. Projection, Persistence, And Reconnect

Lifecycle state is server-owned and must survive serialization/reconnect consistently.

Projection rules:

- expose only state needed by the authorized viewer to understand legal actions/public effects;
- private/hidden source data remains governed by Hidden Information;
- usage counters need not be public unless a reviewed product/rules contract makes them public;
- server-only cleanup destination refs, provenance, transition dedupe keys, and diagnostics remain private.

Reconnect/restore:

- does not reinstall lifecycle state;
- does not reset per-round/per-game counters;
- does not reopen a closed unique trigger window;
- does not duplicate expiry/source-cleanup transitions;
- preserves the same lifecycle/transition identity;
- does not increment revision merely for projection/restore.

## 13. Idempotency And Replay

Every authoritative lifecycle transition has a stable `transitionId` and causation identity. Reprocessing the same transition is rejected or idempotent with no duplicate mutation.

Semantic duplicate protections include:

- active policy install key;
- usage consumption boundary/command identity;
- unique group/window claim key;
- fixed-duration expiry identity;
- source-invalidated cleanup identity;
- round/reset boundary identity.

A genuinely new later event receives a new transition identity. Dedupe must not suppress a distinct legal use merely because source/ability/policy values look similar.

## 14. Transaction And Failure Semantics

Lifecycle changes use the same authoritative transaction boundary as the mutation they qualify.

A failing dispatch preserves, unless an earlier command was already committed:

- usage counters and unique claims;
- live/terminal lifecycle states;
- card zones/control/visibility/active status;
- ongoing modifier or visibility state;
- resources, battle, phase, location, and priority;
- pending Trigger/Interaction state;
- events/logs/transition history;
- revision.

A later failed command never rolls back an earlier successfully committed command.

If an external card transition and mandatory lifecycle cleanup belong to one command, they must commit or roll back together.

## 15. Composition Boundaries

| Dependency | Lifecycle responsibility | External owner |
|---|---|---|
| Trigger | consume event/window identity; maintain lifecycle claim/usage state | accepted P3-TO-03 Trigger Gateway |
| Interaction | consume authoritative decision result; do not count prompt/decline unless policy says | accepted P3-TO-05 Interaction Template |
| Card Action / Card Zone | clean lifecycle state as consequence; provide/execute movement | typed action/zone owner |
| Battle / Scoring | consume battle/window facts only | Battle/Scoring runtime |
| Hidden / Visibility | retain lifecycle duration, not reveal legality | Hidden Information / Visibility owner |
| Modifier / Power | retain source/duration identity, not arithmetic | Modifier/Power owner |
| Special subsystem | maintain explicit blocker | subsystem-specific reviewed owner |

An ability with unresolved external dependencies remains runtime-blocked after Lifecycle spec acceptance.

## 16. Fail-Closed Admission And Runtime Requirements

Admission/compiler/runtime setup rejects:

- missing source card/ability identity;
- invalid/zero/negative/non-integer `uses` or `rounds`;
- unknown cadence, scope, start, duration, cleanup, conflict, or consumption boundary;
- `round_count` without explicit boundary convention;
- movement-producing expiry without resolved cleanup destination;
- unique group without groupId/window/conflict policy;
- unsupported contradictory lifecycle combination;
- implicit transform/replacement state adoption;
- recognized lifecycle shape whose required external owner is unsupported while claiming runtime support.

Runtime rejects with no failing-dispatch mutation:

- stale/missing/invalid source;
- duplicate install/usage/claim/expiry/reset transition;
- usage beyond limit;
- stale/closed trigger window claim;
- wrong controller/source instance;
- client-authored lifecycle state/counter/reset/cleanup destination;
- ambiguous cleanup destination;
- corrupted persistence/reconnect state;
- unsupported source transfer;
- lifecycle cleanup failure during a composed card transition.

Recognized lifecycle failure must not call a legacy card-specific lifecycle branch or parse display text to recover semantics.

## 17. Current Inventory Reconciliation

The exact 11-row mapping is `docs/audits/2026-09-14-p3-to-04-lifecycle-ability-map.md`.

Policy memberships are many-to-many; one ability can carry several lifecycle/limit fields. The denominator is unique abilities, not membership count.

Specification acceptance must not be reported as runtime burn-down.

## 18. Runtime Handoff Criteria

P3-TO-04 may leave `SPEC_REVIEW_READY` only after independent review confirms:

- all 11 explicit lifecycle/reset abilities are mapped exactly once;
- source identity and transform/replacement non-adoption are explicit;
- usage consumption boundaries are server-authoritative and transactional;
- per-round/per-game reset ownership is explicit;
- unique-group arbitration composes with Trigger/Interaction and cannot double-claim;
- source-close/move and mandatory lifecycle cleanup are atomically composed without Lifecycle owning movement;
- fixed-duration policies require explicit counting convention and cleanup destination;
- `remain_active` is not confused with immunity;
- projection/reconnect/replay are idempotent and hidden-safe;
- external Trigger/Interaction/Card Zone/Battle/Hidden/Modifier/Special ownership remains separate;
- malformed/stale/duplicate/unsupported state fails closed;
- no runtime, tests, authoring, generated content, taxonomy, KPI, or Gate changes were made by this task.

Only after `SPEC_ACCEPTED` may P3-B08's Lifecycle-spec dependency be considered satisfied. Runtime hot-file ownership remains a separate dependency.