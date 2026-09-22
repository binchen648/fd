# P3-A FB2-47 Controller-Defeated VP Reward Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-21

## Formal baseline

- Exact Base: `90c4ef30ade3316f0532185aeb79171878d20c49`
- Base branch: `codex/a-p3-r97-fb2-46-acceptance-sync`
- Formal migration accepted: **`149/944`**
- Formal remaining: **`795`**
- Branch-local frozen authoring overlap: **`144/944`**
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

This is zero-credit identity-free capability work. FB2-47 itself may not change formal migration accounting.

## Why a new B2 seam is permitted

A completed the required fresh whole-card reconstruction of `servant.nobunaga.skill.sc-nobunaga-3` after exact FB2-46 acceptance synchronization.

Mechanical findings:

1. Accepted FB2-46 closes only the second frozen clause (`reckless-strategy`): authoritative combat loss -> controller loses 2 VP with floor zero -> if actual loss is positive, every winner from that same frozen result gains 2 VP.
2. The first frozen clause remains independent and exact: `fool-defeat-reward`, `player.defeated` + `EVENT_PLAYER_IS_CONTROLLER` -> controller gains 3 VP.
3. Current loader trigger vocabulary contains no `player.defeated` equivalent; current production rules contain no `player.defeated` AbilityEvent route. The current authoring tree contains no executable `event_type_is` / `player.defeated` consumer shape.
4. Locked Reference treats `player.defeated` as a distinct authoritative domain fact. Ordinary combat settlement emits `player.defeated` for each actually defeated player before `combat.resolved`; the shared defeat boundary also emits the same fact for non-combat defeat effects. It is not synonymous with `combat.resolved` or with a raw combat-loser label.
5. Current rebuilt battle settlement already distinguishes battle-loss suppression (`lossEffectSuppressedPlayerIds`): the post-scoring loser set excludes a player whose battle-loss/defeat effect is ignored. Existing Presence Concealment and FB2-45 pre-battle defeat exclusions flow into the frozen battle result and therefore can be represented by the same authoritative actual-defeat fact when not suppressed.
6. The authoritative frozen 944 inventory contains only two `player.defeated` consumers: Nobunaga s3 and Ozymandias s2. Ozymandias s2 retains additional source-active/card-close/mana semantics, so this seam does not make it an immediate singleton S consumer.
7. Immediately before FB2-46, A had already mechanically established `S_READY_NOW = 0`; Medusa s2 was the sole consumer unlocked by FB2-45 and its accepted migration added no runtime capability. FB2-46 can newly close only the exact Nobunaga second clause, and the first clause remains blocked as above. Therefore the current ready queue remains defensibly zero.

One narrow zero-credit B2 release is therefore permitted.

## Selected seam

Add one authoritative, identity-free **controller-defeated fact -> fixed controller VP reward** route.

The semantic event name may be `after_controller_defeated` or a mechanically equivalent typed name, but it must represent the authoritative transition/fact that the controller was actually defeated, not merely that the controller appeared in a raw combat-loser list.

For the currently accepted battle runtime, the server producer is the trusted frozen post-scoring battle result. For every actual loser in that result, emit one stable derived defeated event **before** the corresponding `after_controller_loses_battle` event is processed.

This ordering is part of the contract. Nobunaga's frozen clauses require the defeat reward to settle first: at 0 VP, defeat reward `+3` must occur before FB2-46 loss `-2`, yielding actual loss 2 and enabling the winner reward. Reversing those events would incorrectly suppress the FB2-46 continuation at zero starting VP.

## Exact authoring contract

B2 may add exactly one new whole-ability executable envelope:

- `kind: forced_trigger`;
- activation contains only `trigger: after_controller_defeated` (or the exact chosen typed equivalent);
- exactly one condition: `event_player_is_controller`;
- no targets;
- exactly one effect: existing fixed controller VP adjustment, structurally equivalent to `{ "type": "adjust_victory_points", "player": "controller", "amount": <positive safe integer> }`;
- no cost, creates or ruleModifiers;
- empty lifecycle, responseWindow, limit and visibility;
- automatic execution;
- no extra authoring keys/containers, markers or silent normalization of malformed scalar/object payloads.

The classifier must be whole-ability exact and fail closed. Adding the trigger token to loader vocabulary must **not** make arbitrary effects/conditions executable under that trigger.

For the frozen Nobunaga clause, focused tests must include amount `3`; the classifier may accept a positive safe-integer fixed amount but must reject zero, negative, noninteger, unsafe, formula/object/string or additional payload-bearing forms.

A dedicated effect node is allowed only if it is strictly narrower than the existing fixed `adjust_victory_points` primitive and does not create generic defeat-event routing. Reusing the existing fixed controller VP primitive is preferred.

## Authoritative defeated-event provenance

For the currently accepted battle producer, a derived defeated event is valid only when all of the following are true:

- it is generated server-side from an already trusted `after_battle_result_determined` event, never supplied by an AbilityCommand/client payload;
- `battlePhaseResolutionId`, `battleId`, `resultId`, `battlefieldId`, `battleParticipantIds` and `battleResult` remain the same frozen battle provenance;
- `playerId` is a known participant and occurs in the exact frozen loser set used by the authoritative post-scoring pipeline;
- `playerId` is not in `battleResult.winners`;
- the player is not excluded from loss effects by the authoritative suppression set that already prevents the corresponding loss event;
- derived event identity is stable and collision-free for the battle/result/player, e.g. `${resultId}:defeat:${playerId}`;
- each actual defeated player receives at most one defeated fact for that exact battle result;
- the defeated fact is processed before that player's `after_controller_loses_battle` derived event;
- processing the same root battle result again remains idempotent through existing processed-event boundaries.

The producer must use the frozen event/result facts; it may not recompute losers from current Power, current location, current VP, current card state, global logs or mutable board occupancy.

## Runtime reward semantics

When an exact accepted ability receives the trusted controller-defeated fact:

1. require `event.playerId === controllerId`;
2. require the exact trusted defeat provenance described above;
3. add the fixed positive VP amount to the controller exactly once;
4. emit the normal authoritative VP adjustment/runtime evidence with source ability and trigger-event provenance;
5. malformed event provenance or malformed ability shape changes nothing;
6. replay of the same exact event cannot pay twice.

No choice/response window opens; execution is automatic.

## Current defeat coverage / future boundary

FB2-47 does **not** create a generic defeat engine or persistent defeated-state subsystem. It only introduces the authoritative defeat fact route required by the frozen consumer and wires the currently accepted battle-derived defeat producer.

Current accepted battle defeat sources (ordinary actual battle losses, Presence Concealment defeat settlement and FB2-45 pre-battle defeat settlement) must produce the same defeated fact when they appear as actual unsuppressed losers in the frozen result. Basic Luck / battle-loss immunity must not produce a false defeated fact.

Future non-battle defeat capabilities, if formally released later, must explicitly wire their own authoritative successful-defeat producer to this same typed fact before they can claim complete defeat semantics. FB2-47 does not authorize speculative non-battle defeat effects today.

## Explicit non-goals

FB2-47 must not:

- add generic client-supplied `player.defeated` events;
- add arbitrary event-name authoring or generic `event_type_is` parsing;
- add a generic defeat-player engine, persistent defeated player state, revival/reset semantics or elimination semantics;
- reinterpret every `after_controller_loses_battle` as a defeat without the authoritative actual-loss/suppression checks;
- change FB2-45, Presence Concealment or Basic Luck target/settlement semantics;
- widen `adjust_victory_points` to arbitrary player scopes/formulas;
- change FB2-46 loss/winner reward semantics;
- add Ozymandias/Nobunaga/name/card-id/Chinese-text runtime routing;
- parse frozen Chinese text at runtime;
- edit consumer authoring, product packs or generated product outputs;
- merge or retarget.

## Required fail-closed tests

Focused tests must cover at least:

- exact accepted ability loads automatically and malformed siblings fail through one explicit FB2-47 gateway;
- trusted actual loser receives one defeated fact and fixed controller VP reward;
- multiple losers each receive their own stable defeated fact without cross-paying another controller's source;
- winner/tied winner/nonparticipant do not receive a defeated fact;
- a loss-effect-suppressed/Luck-protected participant does not receive a defeated fact or reward;
- ordinary battle loss, accepted Presence Concealment defeat and accepted FB2-45 pre-battle defeat each reach the same fact when unsuppressed;
- defeated reward occurs before the same player's `after_controller_loses_battle` trigger: a composed synthetic Nobunaga-like pair starting at 0 VP must settle `+3`, then `-2`, and therefore pay the FB2-46 winners reward;
- wrong event player, missing/malformed battle provenance, controller not in authoritative loser set, controller also winner, duplicated participants/results or forged standalone defeated event fail closed atomically;
- extra condition/target/effect/cost/create/modifier/lifecycle/response/limit/visibility/markers fail closed;
- amount 0, negative, fractional, unsafe, string, formula/object or extra-key amount/effect forms fail closed;
- replaying the same exact root/result or derived defeat event is idempotent;
- existing FB2-45 and FB2-46 focused suites plus battle-result/combat-reward regressions remain green.

## Scope

B2 may modify only the minimum rules capability surface needed for this exact identity-free seam, focused tests, and its result report. Likely paths are loader/interpreter plus a dedicated classifier/helper if needed, the existing post-scoring event derivation site, index/type integration only if required, focused FB2-47 tests, and the B2 result report.

Any additional production path must be explicitly justified in the result report.

Forbidden scope:

- `data/authoring/**` consumer materialization;
- `data/packs/**` or generated product registration;
- client/UI changes;
- unrelated capability refactors;
- merge or retarget.

## Acceptance / next action

FB2-47 is zero-credit. Formal project migration remains **`149/944`**, **`795` remaining** throughout B2 implementation/review.

After exact fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes the capability, A must freshly reconstruct the **complete** `servant.nobunaga.skill.sc-nobunaga-3` card on that synchronized runtime. Dispatch singleton S only if both frozen clauses, event ordering, card metadata and full runtime behavior are then mechanically zero-gap. Do not infer S readiness from the capability name alone.
