# P3-A FB2-46 Battle-Loss VP Winner Reward Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-21

## Formal baseline

- Exact Base: `de8e680a8937790f28a3c46b5d1f6d6d288042c9`
- Base branch: `codex/a-p3-r96-medusa-s2-migration-acceptance-sync`
- Formal migration accepted: **`149/944`**
- Formal remaining: **`795`**
- Branch-local frozen authoring overlap: **`144/944`**
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

This is zero-credit identity-free capability work. FB2-46 itself may not change formal migration accounting.

## Why a new B2 seam is permitted

A reran the migration-credit-first readiness check after synchronizing Medusa s2 acceptance:

1. The preceding FB2-45 dispatch had already mechanically reduced the then-current historical block-free `SOURCE_GROUNDED` population to a defensible `S_READY_NOW = 0`, except for the exact Medusa pre-battle-defeat shape that FB2-45 was designed to close.
2. The current scan has `57` unmaterialized historical `SOURCE_GROUNDED`, block-free rows, exactly one fewer than that prior `58`: the removed row is accepted Medusa s2.
3. There is **no production runtime delta** between accepted FB2-45 Candidate `17685e678e758cb38032732bf15d47b07592d81e` and current synchronized Base `de8e680a8937790f28a3c46b5d1f6d6d288042c9`. Medusa migration/synchronization added only authoring, tests and reports, so it cannot silently unlock another runtime shape.
4. Fresh spot probes reject the low-complexity stale labels as direct-ready: Gorgon s2 still spans target-count, card-play and defeat-ignore contracts; Sion s13 has discard-play targeting in addition to VP payment; Helena s1 lacks same-location-opponent face-up servant-skill targeting in addition to face-state mutation; Roberts s1/s2 are multi-contract interactions; Nobunaga s3 still contains more than one historical semantic question.
5. Exact accepted capability names are not generic authorization. A historical label such as `VP payment`, `set_selected_cards_face`, or `winner-resource routing` is not treated as a runnable current contract.

Therefore the current singleton-ready queue is defensibly zero and one narrow zero-credit B2 release is permitted.

## Selected seam

The next seam is the smallest authoritative transaction isolated from the Nobunaga s3 `reckless-strategy` clause:

> after the controller is authoritatively recorded as a loser of one exact battle, lose up to a fixed number of Victory Points (flooring at zero); **only if the actual VP loss is greater than zero**, grant a fixed VP reward to every winner of that same frozen battle result.

The seam is deliberately **not** a generic `lose_victory_points` primitive, generic result-binding language, generic winner selector, or arbitrary nested effect engine.

## Exact authoring contract

B2 may add one new identity-free executable ability shape, represented by an exact dedicated effect such as:

```json
{
  "type": "battle_loss_vp_then_reward_winners",
  "lossAmount": 2,
  "winnerRewardAmount": 2
}
```

The accepted parent ability envelope must be exact and fail closed:

- `kind: forced_trigger`;
- activation contains only `trigger: after_controller_loses_battle`;
- exactly one condition: `event_player_is_controller`;
- no targets;
- exactly one effect of the dedicated transaction type above;
- `lossAmount` and `winnerRewardAmount` are positive safe integers; FB2-46 tests must cover the frozen `2/2` shape while the classifier remains bounded and rejects malformed/nonpositive/noninteger values;
- no cost, creates or ruleModifiers;
- empty lifecycle, responseWindow, limit and visibility;
- automatic execution;
- no extra authoring keys/containers and no silent normalization of malformed object/scalar payloads.

A narrower equivalent dedicated node name is allowed if semantics and fail-closed shape are identical. Do not expose the raw historical nested `thenIfAnyLost` / `event_combat_winners` vocabulary as generic executable authoring.

## Authoritative runtime semantics

Execution is valid only from a trusted `after_controller_loses_battle` event whose frozen provenance is self-consistent:

- `event.playerId === controllerId`;
- nonempty `battlePhaseResolutionId`, `battleId`, `resultId`, and `battlefieldId`;
- `battleParticipantIds` is present, unique, contains the controller, and contains every frozen winner/loser referenced by `battleResult`;
- `battleResult` exists; controller is in `battleResult.loserIds`; controller is not in `battleResult.winners`;
- winners are nonempty, unique, are battle participants, and do not overlap losers;
- the source ability is reached only through the authoritative server-side battle event pipeline, never a client-supplied event/effect.

Transaction:

1. snapshot controller VP before mutation;
2. deduct `min(lossAmount, currentVP)`, never below zero;
3. compute `actualLoss = before - after`;
4. if `actualLoss === 0`, grant **no** winner reward;
5. if `actualLoss > 0`, add exactly `winnerRewardAmount` VP to **each** player id in `event.battleResult.winners` from this exact battle result;
6. tied/shared winners each receive the fixed reward once;
7. winner rewards do not scale with `actualLoss`: at controller VP=1 and lossAmount=2, actual loss is 1 and each winner still receives the fixed reward 2;
8. emit authoritative VP adjustment evidence with source ability and trigger-event provenance using existing typed logging conventions or an equally strict dedicated record;
9. the mutation is atomic: invalid provenance or invalid shape changes nothing;
10. standard processed-event/transaction boundaries must prevent replay of the same trusted event from double-paying.

The seam must use the frozen event result, not current location, current highest Power, global battle history, or a recomputed winner set.

## Explicit non-goals

FB2-46 must not:

- implement arbitrary `lose_victory_points` authoring;
- implement arbitrary `event_combat_winners` targeting;
- implement generic `thenIfAnyLost` continuation/dataflow;
- widen `adjust_victory_points` to arbitrary player scopes;
- change shared-victory, optional VP, unpreventable VP, Ruler reward, Basic Luck, battle scoring or existing combat-reward distribution semantics;
- add `player.defeated` semantics or claim Nobunaga s3 is already whole-card ready;
- add character/name/card-id/Chinese-text routing;
- parse frozen Chinese text at runtime;
- edit consumer authoring, product packs or generated product outputs.

## Required fail-closed tests

Focused tests must cover at least:

- exact trusted losing-controller battle event: controller VP 5 -> 3 and every same-result winner +2;
- controller VP 1 -> 0 still rewards each winner +2 because actual loss >0;
- controller VP 0 -> 0 gives no winner reward;
- shared/tied winners each receive reward exactly once;
- unrelated/nonwinner participants receive no reward;
- wrong event type, wrong event player, controller not loser, controller also winner, missing/empty battle ids/result ids/battlefield, malformed participant set, winner outside participants, duplicate winners/participants, overlapping winner/loser sets all fail closed atomically;
- malformed ability envelope, extra condition/target/effect/cost/create/modifier/lifecycle/response/limit/visibility, malformed/nonpositive/noninteger amounts and forbidden raw tokens fail through one explicit FB2-46 gateway;
- repeated trusted processing of the same exact event is idempotent through the existing event boundary;
- existing shared-victory/optional VP/battle-loss VP/Ruler reward/combat-reward regressions remain unchanged.

## Scope

B2 may modify only the minimum rules capability surface needed for this exact identity-free seam, focused tests, and its result report. Likely paths include a dedicated ability classifier/helper plus the loader/interpreter/executable-pack/type/index integration points actually required by the implementation. Any additional production path must be justified in the result report.

Forbidden scope:

- `data/authoring/**` consumer materialization;
- `data/packs/**` or generated product registration;
- client/UI changes;
- unrelated capability refactors;
- merge or retarget.

## Acceptance / next action

FB2-46 is zero-credit. Formal project migration remains **`149/944`**, **`795` remaining** throughout B2 implementation/review.

After an exact fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes that capability, A must freshly reconstruct the complete `servant.nobunaga.skill.sc-nobunaga-3` card on that synchronized runtime. **Do not assume FB2-46 makes Nobunaga S-ready.** If `player.defeated` or any other exact whole-card gap remains, record the residual blocker and continue migration-credit-first probing. Dispatch singleton S only if the complete card is mechanically zero-gap.
