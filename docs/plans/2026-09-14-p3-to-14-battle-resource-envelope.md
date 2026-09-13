# P3-TO-14 Battle Result / Scoring / Resource Envelope Contract

- Date: 2026-09-14
- Task: P3-TO-14
- Status: SPEC_REVIEW_READY
- Scope: docs-only; no runtime migration in this task
- Accepted prerequisites: P3-TO-03 Trigger Gateway; Golden Flow 2 representative flow `E2E_VERIFIED` at review `9db8a7236d8dae4d00e3e543e2094c5ea15a5ff2`; P3-TO-15 Power handoff as input contract

## 1. Purpose

Define the authoritative boundary between final participant power, battle result determination, result-trigger production, battle scoring/resource settlement, and terminal battle-end events. The contract exists so later runtime slices do not encode card-specific battle logic in Combat Resolver, Scoring Resolver, Trigger Gateway, or Resource primitives.

This spec does **not** migrate the 39 battle-integration abilities.

## 2. Corrected Denominator

Current authoritative battle-integration denominator is **39 abilities / 28 cards**. The current semantic-axis set exactly equals the historical `BATTLE_RESULT` set.

However, only **13** rows are direct post-result / battle-ended event consumers:

- `after_controller_first_loses_battle`: 1
- `after_controller_loses_battle`: 4
- `after_battle_result_determined`: 3
- `after_controller_wins_battle`: 3
- `after_battle_ended`: 2

The other 26 rows are broader battle integration and must compose with their real owner (combat action, power/modifier, movement/deployment, lifecycle, interaction, hidden information, special subsystem, or resource), rather than consuming a fake Battle Result envelope. Exact membership is in `docs/audits/2026-09-14-p3-to-14-battle-integration-map.md`.

Separately, the accepted Trigger Gateway has one **cross-axis Scoring/Battle producer dependency** outside the 39-row denominator: `servant.artoriac.skill.sc-artoriac-3#sc-artoriac-3.shuffle-discard-on-victory` consumes `after_controller_gains_victory`. TO-14 must define that producer event without changing the 39/28 battle-integration denominator.

## 3. Ownership Boundary

| Concern | Canonical owner | TO-14 relationship |
|---|---|---|
| final participant power + immutable power trace | accepted TO-15 Modifier/Power contract | input only |
| battlefield participant/eligibility snapshot | Battle runtime | input to result determination |
| winner/tie/loser/exclusion/margin | Battle Result owner | owned here |
| post-result domain events | Battle Result producer + accepted TO-03 Trigger Gateway | producer payload owned here; scheduling owned by Trigger Gateway |
| optional result-trigger intent | accepted TO-05 Interaction contract | external owner |
| base/event/competition VP plan + military result plan | Battle Scoring owner | typed plan owned here |
| actual VP/mana/seal mutation | typed Resource primitive | consumes scoring/trigger continuation |
| movement/card-zone/lifecycle/hidden/special side effects | their reviewed owner | never absorbed into Battle Result |
| reconnect/projection | MatchSession/Projection | projects immutable result + permitted trace only |

## 4. Canonical Data Concepts

These are normative concepts, not a requirement to copy these exact TypeScript declarations.

```ts
type BattleExclusion =
  | { kind: 'defeated' }
  | { kind: 'cannot_win' }
  | { kind: 'rule_excluded'; policyId: string };

type BattleOutcome =
  | { class: 'winner' }
  | { class: 'loser'; lossEffectsEligible: boolean }
  | { class: 'excluded'; exclusion: BattleExclusion };

interface BattleParticipantOutcome {
  playerId: string;
  finalPower: number;
  powerTraceRef: string;
  outcome: BattleOutcome;
}

interface BattleResultEnvelope {
  battleId: string;
  resultId: string;
  causationId: string;
  createdRevision: number;
  roundNumber: number;
  battlefieldId: string;
  participants: BattleParticipantOutcome[];
  winnerPlayerIds: string[];
  loserPlayerIds: string[];
  excludedPlayerIds: string[];
  tied: boolean;
  soleWinnerPlayerId?: string;
  margin: number;
  scoringPlanId: string;
}

interface BattleVpAdjustment {
  playerId: string;
  delta: number;
  source: 'battle_vp' | 'event_vp' | 'competition_vp' | 'reviewed_rule';
  sourceRef: string;
}

interface BattleMilitaryAdjustment {
  playerId: string;
  delta: number;
  sourceRef: string;
}

interface BattleScoringPlan {
  scoringPlanId: string;
  battleResultId: string;
  eventVpPool: number;
  competitionVpPool: number;
  baseVpPerWinner: number;
  vpAdjustments: BattleVpAdjustment[];
  militaryAdjustments: BattleMilitaryAdjustment[];
}

interface BattleScoringReceipt {
  scoringReceiptId: string;
  scoringPlanId: string;
  battleResultId: string;
  committedRevision: number;
  resourceResultIds: string[];
}
```

Every identity above is server-authored. Clients may reference an offered interaction/command identity but cannot author result IDs, participant outcomes, winner sets, scoring plans, resource deltas, or processed state.

## 5. Result Determination

Battle Result consumes a frozen authoritative participant set and final Power Trace refs. It must determine:

1. the eligible participant set;
2. typed exclusions, including defeated/cannot-win rules;
3. winner set from eligible final power;
4. tie / sole-winner fact;
5. loser set separately from excluded participants;
6. margin from the accepted rules definition;
7. loss-effect eligibility separately from the fact that a participant did not win.

A participant may have lost the battle while a separate rule suppresses defeat/loss side effects. The result model must not erase the outcome merely because a later loss effect is ignored. Trigger production uses the reviewed loss-effect policy for the specific event.

No card/ability ID may be used to decide generic winner, loser, tie, margin, or exclusion semantics. Card-specific rules must first normalize into typed eligibility/power/loss-effect inputs owned by their proper gateway.

## 6. Result And Trigger Event Production

Battle Result is a system event producer under the accepted TO-03 envelope. Every produced event carries the same immutable `battleId/resultId` and causation chain.

Minimum payloads:

| Event | TO-14 payload requirement |
|---|---|
| `after_battle_result_determined` | result identity, battlefield, participant IDs, winners, losers, excluded IDs, tie/sole-winner facts |
| `after_controller_wins_battle` | result identity, controller, winner set, sole/shared-win fact |
| `after_controller_loses_battle` | result identity, controller, winner set, controller loss-effect eligibility |
| `after_controller_first_loses_battle` | result identity, controller, authoritative loss ordinal/history identity |
| `after_controller_gains_victory` | result identity, scoring receipt/victory transition identity, controller, reviewed victory-policy identity and causation |
| `after_battle_ended` | result identity plus terminal scoring receipt/status |

Trigger Gateway owns discovery, forced/optional scheduling, ordering, idempotency, cancellation, interaction handoff, and revalidation. TO-14 must not implement a second trigger queue.

## 7. Stage Ordering

The generic stage model is:

1. freeze participant/power inputs;
2. determine and commit one immutable Battle Result;
3. produce result/win/loss/first-loss events;
4. Trigger Gateway schedules and settles required result-dependent trigger windows;
5. once blocking result-trigger windows are resolved, consume the scoring plan exactly once;
6. commit typed resource/military mutations and one scoring receipt;
7. when a reviewed Battle/Scoring rule says the controller has **gained a victory**, produce `after_controller_gains_victory` exactly once from the committed result + scoring/victory transition, then settle its Trigger Gateway consumers;
8. produce `after_battle_ended` with terminal scoring status only after scoring-derived victory triggers are terminal;
9. hand off to battle cleanup/lifecycle.

If an accepted rule requires a different relative order for a specific collision, that collision requires an explicit `orderingRef`. Runtime migration remains blocked when the semantic order is material and unresolved; current implementation order is not automatically normative.

## 8. Scoring / Resource Composition

The scoring plan is immutable once the result is committed. Post-result trigger awards or penalties do **not** rewrite that plan; they settle as separate typed Resource results linked by causation to the same battle result. Card-specific code may not mutate an arbitrary scoring accumulator.

All committed VP/mana/command-seal mutations use the typed resource envelope already required by Resource/Numeric:

- source ability/system identity;
- controller/target player identity;
- resource type;
- delta;
- before/after;
- result identity;
- revision.

Base battle scoring uses a system producer linked to `battleResultId/scoringPlanId`. Trigger-earned VP uses the trigger's source ability identity and retains the same battle result causation link.

`after_controller_gains_victory` is **not** inferred from arbitrary positive VP, a display label, or merely being in `winnerPlayerIds`. Its producer requires a reviewed Battle/Scoring victory rule and a stable `victoryTransitionId` linked to the committed result/scoring receipt. If that qualification rule is absent or ambiguous for a future runtime slice, that producer remains blocked.

## 9. Exactly-Once And Replay Safety

Semantic idempotency keys:

- result determination: `battleId -> resultId` exactly once;
- trigger scheduling: accepted TO-03 key `(eventId, sourceCardInstanceId, sourceAbilityId)`;
- scoring consumption: `scoringPlanId` exactly once;
- scoring-derived victory production: `victoryTransitionId` exactly once per reviewed victory transition;
- resource mutation: typed resource result identity exactly once.

Reconnect or stale replay may re-project an existing result/receipt but cannot:

- determine a second result for the same battle;
- reschedule a terminal trigger;
- consume scoring twice;
- duplicate VP/military/resource adjustment;
- increment revision merely by projection/reconnect.

Golden Flow 2 accepted evidence demonstrates the representative browser/reconnect/stale-command property; family-wide inheritance still requires the exact same accepted semantic form and no new external dependency.

## 10. Transaction Semantics

Result determination is committed as its own authoritative stage before optional post-result interaction can pause. A later trigger failure must not roll back a previously committed battle result.

For each subsequent dispatch:

- a trigger dispatch rolls back only that trigger dispatch on failure, per TO-03;
- scoring consumption and its resource/military mutations commit atomically;
- a failed scoring dispatch creates no scoring receipt/consumption-ledger entry, no resource result, and no logs/events/revision from the failed dispatch;
- a successful scoring commit cannot be undone by a later cleanup failure;
- a failed later cleanup cannot cause scoring to run again.

## 11. Projection / Hidden Information

The server retains the full authoritative result and full Power Trace refs. Viewer projection may redact hidden source detail through the accepted projection policy, but public battle facts required by the game remain stable: battlefield, winner/tie outcome, allowed participant facts, permitted power summary, and committed VP changes.

Projection must never redact authoritative server storage in place. Reconnect receives the same result/receipt identities and terminal state.

## 12. 39-Row Admission Boundary

Only the 13 direct post-result/ended consumers are candidates to consume this result-event envelope directly.

The other 26 battle-integration rows remain with their real owners, for example:

- combat actions: Interaction/Card Action/Power/Card Zone;
- deployment/battlefield rules: Movement + Trigger + Battle context;
- battle power/status: TO-15 Modifier/Power + Lifecycle;
- hidden/reveal: Hidden Information + Trigger;
- special directives/replacement: reviewed Special subsystem;
- result-bound VP/movement: Result Binding / Resource / Movement.

TO-14 acceptance therefore does **not** make 39 abilities runtime-ready. Each row remains blocked on every unresolved external owner shown by the semantic-axis map.

## 13. Fail-Closed Requirements

Reject without legacy fallback when a claimed Battle Result route has:

- missing/duplicate battle or result identity;
- missing or stale Power Trace ref;
- non-finite final power or margin;
- participant duplicated across winner/loser/excluded classes;
- winner not in eligible participant set;
- malformed tie/sole-winner facts;
- unknown exclusion/loss-effect policy;
- scoring plan/result identity mismatch;
- duplicate scoring consumption;
- client-authored winner, score, resource delta, processed state, or result payload;
- unresolved semantic ordering that can change outcome;
- unsupported external owner dependency in a runtime slice that claims full support.

A recognized Battle Result envelope failure must not fall back to `resolveEffect`, `executeAbility`, display-text parsing, card-name branches, or ability-ID routing.

## 14. Runtime Handoff Criteria

TO-14 may be independently accepted as a specification only if review confirms:

- 39/28 battle-integration set reconciles exactly;
- 13 direct result/ended consumers are not conflated with the other 26 rows;
- the one cross-axis `after_controller_gains_victory` Scoring/Battle producer dependency is covered without changing 39/28;
- Power Trace input, Battle Result, Trigger Gateway, Scoring and Resource owners are non-overlapping;
- stage ordering and unresolved-order policy are explicit;
- result/scoring/resource identities support exactly-once replay safety;
- optional trigger pauses do not roll back committed result state;
- projection/reconnect preserves authoritative identities without leaking hidden detail;
- no runtime migration or Gate promotion is claimed by the spec itself.

Runtime work after spec acceptance requires a fresh B task and independent Gate A/B/C evidence for the chosen representative slice.
