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

The 13 split into **11 per-battlefield result consumers** (first-loss/loss/result/win) plus **2 battle-phase-terminal `after_battle_ended` consumers**. `after_battle_ended` is not a per-battlefield event.

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
| battle-phase Recon reward plan/receipt | Battle Phase Resource owner | typed phase-level plan owned here; not tied to a battlefield winner |
| base event/competition/location VP plan + military result plan | Battle Scoring owner | typed per-battlefield plan owned here |
| actual VP/mana/seal mutation | typed Resource primitive | consumes recon/scoring/trigger continuation |
| movement/card-zone/lifecycle/hidden/special side effects | their reviewed owner | never absorbed into Battle Result |
| reconnect/projection | MatchSession/Projection | projects immutable result + permitted trace only |

## 4. Canonical Data Concepts

These are normative concepts, not a requirement to copy these exact TypeScript declarations.

```ts
type BattleWinExclusion =
  | { kind: 'defeated' }
  | { kind: 'cannot_win' }
  | { kind: 'rule_excluded'; policyId: string };

type BattleOutcomeClass = 'winner' | 'loser';

type BattleLossEffectPolicy =
  | { eligible: true }
  | { eligible: false; suppressionPolicyId: string };

interface BattleParticipantOutcome {
  playerId: string;
  participated: true;
  finalPower: number;
  powerTraceRef: string;
  eligibleForWin: boolean;
  winExclusion?: BattleWinExclusion;
  outcome: BattleOutcomeClass;
  lossEffects: BattleLossEffectPolicy;
}

interface BattleResultEnvelope {
  battleId: string;
  resultId: string;
  causationId: string;
  createdRevision: number;
  roundNumber: number;
  battlePhaseResolutionId: string;
  battlefieldId: string;
  participants: BattleParticipantOutcome[];
  winnerPlayerIds: [string, ...string[]];
  loserPlayerIds: string[];
  excludedPlayerIds: string[];
  tied: boolean;
  soleWinnerPlayerId?: string;
  margin: number;
  scoringPlanId: string;
}

type BattleResultAdmission =
  | { kind: 'no_participants'; battlefieldId: string }
  | { kind: 'resolved'; result: BattleResultEnvelope }
  | {
      kind: 'blocked';
      blocker: 'NO_ELIGIBLE_WINNER_POLICY_REQUIRED';
      battlefieldId: string;
      participantIds: string[];
      exclusionPolicyRefs: string[];
    };

interface BattlePhaseResolutionEnvelope {
  battlePhaseResolutionId: string;
  roundNumber: number;
  battlefieldIds: string[];
  admissions: BattleResultAdmission[];
  postBattleBarrierId: string;
}

type BaseBattlefieldVpSource =
  | {
      kind: 'base_pool_share';
      battlefieldId: string;
      eventInstanceIds: string[];
      competitionRuleId?: string;
    }
  | { kind: 'location_reward'; locationId: string; rewardRuleId: string };

interface BattleVpAdjustment {
  playerId: string;
  delta: number;
  source: BaseBattlefieldVpSource;
}

interface ReconRewardAdjustment {
  playerId: string;
  delta: number;
  source: { kind: 'recon_reward'; locationId: string; rewardRuleId: string };
}

interface ReconRewardPlan {
  reconRewardPlanId: string;
  battlePhaseResolutionId: string;
  roundNumber: number;
  adjustments: ReconRewardAdjustment[];
}

interface ReconRewardReceipt {
  reconRewardReceiptId: string;
  reconRewardPlanId: string;
  committedRevision: number;
  resourceResultIds: string[];
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

1. the participating set;
2. winner eligibility for each participant plus typed exclusion, including defeated/cannot-win rules;
3. winner set from **eligible** final power only;
4. tie / sole-winner fact;
5. loser set from participating non-winners, including participants who were ineligible to win unless an accepted rule explicitly says they did not participate;
6. margin from the accepted rules definition;
7. loss-effect eligibility/suppression separately from both winner eligibility and the winner/loser outcome.

Winner eligibility, battle outcome, and loss-effect settlement are three independent rule dimensions. A participating player may be excluded from winning and still be a loser; a loser may separately ignore/suppress some loss effects. The result model must not erase a loss because the player was ineligible to win or because a later loss effect is suppressed. Only a player who did **not participate** in that battlefield's power resolution is neither a winner nor a loser and must not appear in `BattleParticipantOutcome[]`. Trigger production uses the authoritative loser set plus the reviewed loss-effect policy for the specific event.

A normal `BattleResultEnvelope` is admissible only when `winnerPlayerIds` is non-empty. Two non-normal admissions are explicit:

- no participants: return `{ kind: 'no_participants' }`; do not fabricate a result, scoring plan, win/loss events, margin, or military adjustment;
- participants exist but the eligible-for-win set is empty: return the typed blocker `NO_ELIGIBLE_WINNER_POLICY_REQUIRED`. Current reviewed rules do not define the missing no-eligible-winner margin/scoring/loss policy, so the claimed runtime slice must stop before creating a `BattleResultEnvelope`, scoring plan, or result/win/loss event. It must preserve any separately committed earlier battle-phase receipt (for example Recon), and must not fall back to legacy behavior.

This is an admission boundary, not a new game ruling. A future reviewed no-eligible-winner rule may replace the blocker with a typed policy; until then, zero-winner arithmetic and inferred loser/military semantics are forbidden.

No card/ability ID may be used to decide generic winner, loser, tie, margin, or exclusion semantics. Card-specific rules must first normalize into typed eligibility/power/loss-effect inputs owned by their proper gateway.

## 6. Result And Trigger Event Production

Battle Result is a system event producer under the accepted TO-03 envelope. TO-14 extends payloads but does not drop Trigger Gateway minimum identity.

Minimum payloads:

| Event | TO-14 payload requirement | Scope |
|---|---|---|
| `after_battle_result_determined` | `battlePhaseResolutionId + battleId + resultId`, battlefield, participant IDs, winners, losers, excluded IDs, tie/sole-winner facts | per resolved battlefield; settlement waits behind phase barrier |
| `after_controller_wins_battle` | `battlePhaseResolutionId + battleId + resultId`, controller, winner set, sole/shared-win fact | per resolved battlefield; settlement waits behind phase barrier |
| `after_controller_loses_battle` | `battlePhaseResolutionId + battleId + resultId`, controller, winner set, authoritative loser membership, controller loss-effect eligibility/suppression | per resolved battlefield; settlement waits behind phase barrier |
| `after_controller_first_loses_battle` | `battlePhaseResolutionId + battleId + resultId`, controller, authoritative reviewed loss ordinal/history identity | per resolved battlefield; settlement waits behind phase barrier |
| `after_controller_gains_victory` | `battlePhaseResolutionId + battleId + resultId`, scoring receipt/victory transition identity, controller, reviewed victory-policy identity and causation | same post-all-battlefield-scoring trigger set as the other post-battle events |
| `after_battle_ended` | `battlePhaseResolutionId`, ordered resolved `battleIds`, ordered `resultIds`, required scoring receipt IDs, aggregate participant references, terminal post-battle state | **once per battle-power-resolution phase**, after all ordinary post-battle consumers are terminal |

The two current `after_battle_ended` authoring rows say `战斗阶段结束时/后`; they are phase-terminal consumers. TO-14 must not emit `after_battle_ended` once per battlefield.

For `after_controller_first_loses_battle`, an event may be produced only when the authoritative battle-history/ordering owner can assign a reviewed loss ordinal. If the same phase creates multiple candidate losses and no reviewed rule determines which loss is first, first-loss event production remains blocked; source-file order, battlefield array order, card IDs, or lexical sorting may not invent the ordinal.

Trigger Gateway owns discovery, forced/optional scheduling, relative ordering, idempotency, cancellation, interaction handoff, and revalidation. TO-14 must not implement a second trigger queue or hard-code a global event-family order.

## 7. Stage Ordering

The generic stage model is battle-phase-wide:

1. At battle-power-resolution start, build and consume one round/phase-scoped `ReconRewardPlan` exactly once; commit legal Recon +2 VP adjustments atomically and record `ReconRewardReceipt`.
2. Freeze participant/power inputs for **all enabled battlefields** under one `battlePhaseResolutionId`.
3. Run a **read-only admission pass for every battlefield before committing any battlefield result or base scoring**. `no_participants` is a legal skip. If any non-empty battlefield has zero eligible winners, return `NO_ELIGIBLE_WINNER_POLICY_REQUIRED` for the phase and stop before creating any battlefield result/scoring/event state. Recon remains committed.
4. If all admissions are supported, determine and commit each immutable Battle Result plus base scoring plan. Create stable per-battlefield result/win/loss event identities. Create first-loss identity only when reviewed loss ordinal/history makes it authoritative. Keep every ordinary continuation behind one server-owned `post_all_battlefield_scoring` barrier keyed by `battlePhaseResolutionId`.
5. Consume **every** resolved battlefield base scoring plan exactly once and create one receipt per resolved battlefield. No ordinary post-battle trigger may settle while any required scoring receipt is missing.
6. Once every required receipt exists, derive any reviewed `after_controller_gains_victory` event identities from the committed scoring/victory transitions and merge them into the **same phase-wide post-battle event set** as result/win/loss/first-loss events. Then open `post_all_battlefield_scoring`.
7. Trigger Gateway settles that combined post-battle event set using accepted `orderingRef` semantics. TO-14 imposes **no fixed relative order** among result/win/loss/first-loss/gains-victory families. If a collision can change outcome and no reviewed rule resolves it, that collision remains blocked. Personal VP/rewards remain separate typed Resource results and never re-enter a base pool.
8. After every event in that combined post-battle set is terminal, produce exactly one phase-terminal `after_battle_ended` event for `battlePhaseResolutionId`, settle its consumers, and wait for them to become terminal.
9. Only then hand off to battle cleanup/lifecycle.

The phase-wide barrier is normative. Canonical flow is Recon -> all battlefield winner/base-scoring settlement -> post-battle effect set -> phase-end effects -> cleanup. A per-battlefield barrier that allows one battlefield post-battle effect to settle before another battlefield base scoring is forbidden.

If a base-scoring dispatch fails after earlier battlefield receipts have committed, the barrier remains closed; retry may complete only the missing receipt and previously committed receipts are not rerun. If a semantic failure cannot be retried safely, the phase remains blocked rather than opening post-battle settlement against a partially scored set.

If an accepted rule defines a true pre-scoring modification, it requires a distinct reviewed pre-scoring contract and explicit ordering rule; event type alone cannot bypass the phase-wide barrier.

## 8. Scoring / Resource Composition

The **base battlefield** scoring plan is immutable once the result is committed. Its VP adjustments use only the closed `BaseBattlefieldVpSource` union: one combined `base_pool_share` carrying both event and competition provenance, or a separately reviewed location reward carrying a `rewardRuleId`. There is no generic `reviewed_rule`, `battle_vp`, display-label, or card-ID escape hatch. Post-result personal trigger awards or penalties do **not** rewrite that plan; they settle only after the base scoring receipt as separate typed Resource results linked by causation to the same battle result. Card-specific code may not mutate an arbitrary scoring accumulator or fold personal rewards back into the shared pool.

Canonical base-pool arithmetic is a hard invariant:

`baseVpPool = eventVpPool + competitionVpPool`

`baseVpPerWinner = ceil(baseVpPool / winnerCount)`, with the hard precondition `winnerCount >= 1`.

A zero-winner battlefield never evaluates this formula. It must have been rejected by the admission boundary above unless a future reviewed no-eligible-winner policy explicitly defines a replacement scoring rule.

Each winner receives exactly one `base_pool_share` with `delta === baseVpPerWinner`. Event and competition components are simultaneous provenance only; they are not independently rounded adjustments. If an audit needs component attribution, that attribution must sum exactly to `baseVpPerWinner` and cannot change the awarded total. Counterexample guard: with 2 winners, event pool 1 and competition pool 1, each winner receives 1, never 2.

Recon is a separate **battle-phase** resource settlement because canonical rules award legal Recon occupants +2 VP at battle-power-resolution start rather than as a battlefield winner reward. `ReconRewardPlan` is scoped by `battlePhaseResolutionId` and round, consumed once, and cannot be attached to a Miyama/Shinto winner or folded into a battlefield base pool.

All committed VP/mana/command-seal mutations use the typed resource envelope already required by Resource/Numeric:

- source ability/system identity;
- controller/target player identity;
- resource type;
- delta;
- before/after;
- result identity;
- revision.

Base battle scoring uses a system producer linked to `battleResultId/scoringPlanId`. Trigger-earned VP uses the trigger's source ability identity, retains the same battle result causation link, and can settle only after **all required battlefield scoring receipts for that `battlePhaseResolutionId`** exist and the phase-wide barrier opens.

`after_controller_gains_victory` is **not** inferred from arbitrary positive VP, a display label, or merely being in `winnerPlayerIds`. Its producer requires a reviewed Battle/Scoring victory rule and a stable `victoryTransitionId` linked to the committed result/scoring receipt. If that qualification rule is absent or ambiguous for a future runtime slice, that producer remains blocked.

## 9. Exactly-Once And Replay Safety

Semantic idempotency keys:

- battle-phase Recon settlement: `reconRewardPlanId` exactly once per authoritative `battlePhaseResolutionId` / round;
- result determination: `battleId -> resultId` exactly once;
- trigger scheduling: accepted TO-03 key `(eventId, sourceCardInstanceId, sourceAbilityId)`;
- scoring consumption: `scoringPlanId` exactly once;
- phase-wide post-battle barrier opening: `postBattleBarrierId` exactly once after all required scoring receipts exist;
- scoring-derived victory production: `victoryTransitionId` exactly once per reviewed victory transition;
- phase-terminal event production: `battlePhaseResolutionId + after_battle_ended` exactly once; its payload preserves ordered `battleIds/resultIds` plus required scoring receipts;
- resource mutation: typed resource result identity exactly once.

Reconnect or stale replay may re-project existing Recon/result/scoring/barrier/terminal identities but cannot:

- consume Recon a second time;
- determine a second result for the same battle;
- re-consume an existing battlefield scoring plan;
- open the phase-wide barrier before all required receipts exist or open it twice;
- reschedule a terminal trigger;
- emit a second `after_battle_ended` for the same phase resolution;
- duplicate VP/military/resource adjustment;
- increment revision merely by projection/reconnect.

Golden Flow 2 accepted evidence demonstrates a representative browser/reconnect/stale-command property. It does not by itself prove the new phase-wide trigger barrier; later runtime work needs dedicated evidence for two-battlefield ordering.

## 10. Transaction Semantics

Recon is an earlier, separate battle-phase settlement. The battlefield admission pass is read-only. A phase-level admission blocker therefore preserves Recon but commits no battlefield result, base scoring, result-trigger event, or post-battle barrier state.

After admission succeeds:

- each Battle Result/base scoring plan may commit under its stable identity;
- each base scoring dispatch commits its Resource/military mutations and receipt atomically;
- a failed scoring dispatch creates no receipt/result mutation from that failing dispatch and leaves `post_all_battlefield_scoring` closed;
- already committed scoring receipts are preserved and never rerun while a missing receipt is retried;
- ordinary post-battle trigger dispatches cannot begin until the phase-wide barrier opens;
- once open, a trigger dispatch rolls back only that trigger dispatch on failure, per TO-03; it cannot erase prior Recon/result/scoring receipts;
- a successful terminal trigger cannot be replayed after reconnect;
- `after_battle_ended` cannot be produced until every earlier post-battle consumer for the phase is terminal;
- cleanup failure cannot reopen scoring, ordinary post-battle triggers, or the phase-terminal event.

No client command may partially open the barrier or supply the expected result/receipt set.

## 11. Projection / Hidden Information

The server retains authoritative `battlePhaseResolutionId`, admissions, results, Power Trace refs, scoring receipts, barrier identity/state, victory-transition identities, and phase-terminal event identity. Viewer projection may redact hidden source detail through accepted projection policy, but public battle facts required by the game remain stable.

Reconnect receives the same phase/result/receipt/barrier/terminal identities. Projection/reconnect alone never consumes Recon, creates a battlefield result, re-scores a battlefield, opens the barrier, or re-emits `after_battle_ended`.

## 12. 39-Row Admission Boundary

The 13 direct event consumers split into:

- **11 per-battlefield result consumers**: first-loss/loss/result/win events;
- **2 phase-terminal consumers**: `after_battle_ended`.

The other 26 battle-integration rows remain with their real owners, for example combat actions, deployment/battlefield rules, Modifier/Power/Lifecycle, Hidden Information, Special subsystem, Result Binding, Resource, and Movement.

TO-14 acceptance therefore does **not** make 39 abilities runtime-ready. Each row remains blocked on every unresolved external owner shown by the semantic-axis map.

## 13. Fail-Closed Requirements

Reject without legacy fallback when a claimed Battle Result route has:

- missing/duplicate battle, result, or `battlePhaseResolutionId`;
- missing/stale Power Trace ref or non-finite final power/margin;
- inconsistent participant/winner/loser/exclusion/loss-suppression facts;
- non-empty participation with no eligible winner and no reviewed policy: return `NO_ELIGIBLE_WINNER_POLICY_REQUIRED` during phase admission, before any battlefield result/scoring/event commit;
- any zero-winner base-pool rounding, margin, military, or normal win/loss inference;
- scoring plan/result identity mismatch;
- generic/unknown VP source, missing combined base-pool provenance, independent event/competition rounding, or winner delta inconsistent with `ceil((eventVpPool + competitionVpPool) / winnerCount)`;
- Recon attached to a battlefield result, wrong recipient/delta for its reviewed policy, or duplicate Recon consumption;
- phase admission that commits some battlefield result/scoring before discovering a later unsupported battlefield;
- phase-wide barrier opened while any supported resolved battlefield lacks its scoring receipt;
- ordinary result/win/loss/first-loss/gains-victory continuation settled before `post_all_battlefield_scoring` opens;
- per-battlefield event payload missing explicit `battleId/resultId`, or phase-terminal payload missing ordered `battleIds/resultIds`;
- first-loss event produced without a reviewed authoritative loss ordinal/history identity;
- hard-coded gains-victory-after-win/loss ordering (or any other event-family ordering) when no reviewed rule/`orderingRef` establishes it;
- `after_battle_ended` emitted per battlefield, emitted before all earlier post-battle consumers are terminal, or emitted more than once per `battlePhaseResolutionId`;
- phase-terminal payload missing the resolved result/scoring-receipt identities needed for deterministic replay;
- client-authored winner, score, barrier state, resource delta, processed state, or result payload;
- unresolved semantic ordering that can change outcome;
- unsupported external owner dependency in a runtime slice that claims full support.

A recognized Battle Result envelope failure must not fall back to `resolveEffect`, `executeAbility`, display-text parsing, card-name branches, or ability-ID routing.

## 14. Runtime Handoff Criteria

TO-14 may be independently accepted as a specification only if review confirms:

- 39/28 battle-integration set reconciles exactly;
- direct 13 split explicitly into 11 per-battlefield result consumers + 2 phase-terminal `after_battle_ended` consumers;
- the one cross-axis `after_controller_gains_victory` producer dependency is covered without changing 39/28;
- Power Trace, Battle Result, Trigger Gateway, Scoring, Resource and phase-terminal cleanup owners are non-overlapping;
- Recon is phase-level and exactly-once;
- all battlefield admissions are preflighted before any battlefield result/base-scoring commit;
- no-participant is an explicit skip and zero-eligible-winner is fail-closed;
- event + competition VP use one combined, single-rounding base pool for non-empty winner sets;
- **all supported battlefield base scoring receipts exist before any ordinary post-battle trigger settlement**;
- phase-wide barrier/open/replay semantics are explicit and reconnect-safe;
- all per-battlefield trigger payloads preserve `battleId/resultId`, and phase-terminal payload preserves ordered `battleIds/resultIds`;
- first-loss production requires reviewed authoritative loss ordinal/history identity; ambiguous simultaneous losses remain blocked;
- gains-victory joins the same phase-wide post-battle ordering set rather than being forced after win/loss families;
- `after_battle_ended` is emitted exactly once per `battlePhaseResolutionId`, only after the entire combined post-battle set is terminal;
- unresolved collision ordering remains blocked rather than guessed;
- no runtime migration or Gate promotion is claimed by this spec.

Runtime work after spec acceptance requires a fresh B task and independent Gate A/B/C evidence for the chosen representative slice, including a two-battlefield ordering scenario.
