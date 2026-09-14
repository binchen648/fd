# P3-B15 Terminal Battle Card Zone Runtime Handoff

- Date: 2026-09-14
- Owner: Codex A handoff to Codex B
- Task: `P3-B15`
- Base lineage: A03 B14 sync `b500052ec39cf904c7d60f23e809d77a898dfcc0`
- Accepted prerequisite runtime: B14 `6ef5fa69cab1d51d1681e525410a93172ee7a714`
- Accepted prerequisite review: R08 `32be96d5d31107c72913881be12ea4b8513c7360`
- Status: `READY_FOR_IMPLEMENTATION`

## Representative

```text
archive: servant.ereshkigal
card: servant.ereshkigal.skill.sc-ereshkigal-2
ability: sc-ereshkigal-2.return-to-skill-zone
kind: forced_trigger
phase: combat
trigger: after_battle_ended
effect: move this source card to controller skill zone
```

Printed clause: `战斗阶段结束后将此牌放还于技能区。`

This is selected from the remaining 11 TO14 direct consumers because it has no optional interaction, no hidden-information dependency, no special transform, no unpreventable modifier semantics, and no battle-power calculation. Its missing pieces are both reusable public infrastructure: the phase-terminal event producer and a typed source-card zone move.

## Exact Gaps

### 1. Phase-terminal producer

The accepted TO14 contract requires `after_battle_ended` exactly once per `battlePhaseResolutionId`, after every ordinary post-battle consumer is terminal and before cleanup.

Current production code has the correct insertion points but does not emit this event:

- MatchSession: after `queuePostScoringBattleEvents()` + `flushPostScoringBattleEvents()` and pending checks, immediately before `advanceAbilityPhase(..., 'cleanup')`;
- core game-loop: after post-scoring result queue/flush has become terminal and before cleanup transition.

B15 must not emit one terminal event per battlefield.

### 2. Typed source-card move

Current resolution-dataflow has typed Card Zone primitives such as `move_all_remaining`, draw/create/close operations and an internal `moveCardInstance`, but no typed single source-card move matching the canonical `move_card target=this_card -> skill` authoring shape.

B15 may add a narrowly generic source-card move primitive. It must not create an Ereshkigal-specific handler or route by card/ability ID.

## Terminal Event Contract

Stable event identity should be derived from the phase, e.g. the semantic key:

```text
battlePhaseResolutionId + after_battle_ended
```

The actual implementation may choose an equivalent deterministic ID, but it must prove:

- one event per battle-power-resolution phase;
- ordered `battleIds` and `resultIds` retained from the authoritative resolved set;
- scoring receipt/battlefield references retained sufficiently for replay/order evidence;
- aggregate participant references preserved as required by TO14;
- it cannot be emitted while ordinary post-battle queue/interaction/host work remains pending;
- it is processed before cleanup changes attack/source zones;
- re-entry/reconnect/stale replay cannot settle it twice.

MatchSession and core game-loop must expose the same semantic ordering even if logging surfaces differ.

## Typed Card Zone Contract

The migrated semantic shape is exactly:

```text
forced_trigger
+ phase = combat
+ trigger = after_battle_ended
+ no conditions/targets/cost/creates/ruleModifiers/lifecycle/response/limit
+ exactly one source-card move to controller skill zone
```

For the source move:

- source instance must exist;
- controller must match the ability controller;
- source must be in a supported active battlefield/board source zone for this trigger;
- destination must be controller `skill` for this B15 route;
- successful move sets zone `skill`;
- controller returns to owner/controller authority;
- visibility becomes owner-only;
- active source state becomes false;
- typed result/event records the move;
- any invalid source/controller/zone/destination rejects atomically.

Compiler validation and runtime normalization must reject malformed same-family candidates rather than falling through to legacy resolution.

## Required Tests

Focused tests must include:

- identity-free synthetic exact-shape classifier positive;
- renamed same-shape positive;
- wrong trigger/phase/destination/extra effect or condition negatives;
- typed source-card move success and event/result evidence;
- wrong controller, off-board source, invalid destination fail closed with unchanged caller state;
- two-battlefield production phase emits one terminal event only;
- terminal event occurs after all ordinary post-battle dispatches and before cleanup;
- Eresh source reaches `skill` rather than being discarded by cleanup;
- same battle-phase re-entry does not emit/move again;
- core game-loop equivalent terminal ordering;
- B13 Shinji and B14 shared-victory consumers remain terminal before B15 event.

## Gate C

Use a real remote room/server browser path. A suitable scenario has an active Ereshkigal SC2 source in the attack area during a battle phase. Ending action/battle must prove:

- ordinary battle scoring/result settlement completes;
- exactly one terminal event is dispatched;
- SC2 ends in owner skill zone and is inactive instead of being discarded by cleanup;
- reconnect projects the same final zone/revision;
- a stale command is rejected;
- reconnect/stale/re-entry does not produce a second terminal move.

## Explicitly Out Of Scope

B15 does not migrate or promote:

- Gatou `seeker.battle-end-reward`;
- Tomoe `penalty-on-defeat` or its unpreventable clause;
- Achilles reveal-on-loss;
- Olga loss transform;
- Artoria Alter or Artoria Caster optional battle-result/win triggers;
- any other remaining TO14 direct consumer;
- TO15 Modifier/Power;
- global coverage/KPI changes.

## Reviewer Boundary

Codex B may stop only at `IMPLEMENTATION_COMPLETE_CANDIDATE` with an exact frozen SHA.

A fresh P3-R09 reviewer must independently verify phase-terminal ordering/exactly-once, typed Card Zone atomicity, MatchSession/core parity, no identity routing/legacy bypass, Gate C, and the full baseline before A03 may advance the scoped TO14 overlay from `2/13` to `3/13`.
