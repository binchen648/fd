# P3-B14 Shared Victory VP Runtime Handoff

- Date: 2026-09-14
- Owner: Codex A handoff to Codex B
- Task: `P3-B14`
- Base lineage: A03 B13 sync `60560bc7c085dff3a7ff67e7a6b2d119150b13ad`
- Accepted prerequisite runtime: B13 `37189b32d4de0da3a8eabdca8edbf674c8852d97`
- Accepted prerequisite review: R07 `f1fa9c12ac43ab96050468f52070fc7ea53fd09d`
- Status: `READY_FOR_IMPLEMENTATION`

## Why This Representative

The accepted TO14 direct-consumer denominator contains 13 result/phase-terminal consumers. B13 independently accepted exactly one, Shinji `clown.lose-command-seal`, leaving 12 without inherited migration.

The next representative is:

```text
archive: servant.artoriac
card: servant.artoriac.skill.sc-artoriac-6
ability: sc-artoriac-6.gain-vp-if-not-sole-winner
kind: forced_trigger
trigger: after_battle_result_determined
conditions:
  - controller_won_battle
  - not(controller_sole_winner)
source state: active
result: adjust_victory_points(controller, +2)
```

This row is selected because it reuses already accepted owners without opening a new subsystem:

- B13 supplies authoritative post-scoring per-battlefield result identity and winner facts;
- Trigger Gateway already evaluates battle-result events;
- `controller_won_battle` and `controller_sole_winner` are generic runtime conditions already understood by the interpreter;
- typed `adjust_victory_points` already exists in resolution-dataflow;
- accepted SOURCE_ACTIVE lifecycle policy supplies the source-validity boundary;
- the ability is forced and has no target/private/optional Interaction dependency.

Tomoe `sc-tomoe-1.penalty-on-defeat` is deliberately not selected in B14 because its printed clause says the VP loss "cannot be prevented by any method". That wording crosses the accepted TO15 Modifier/override boundary and is not silently normalized into an ordinary Resource loss by this handoff.

## Exact Runtime Gap

On the current accepted lineage, this ability remains a legacy Battle Result consumer even though all of its lower-level ingredients already exist:

```text
RESULT_EVENT_CONSUMER
LEGACY_RESOLVE_EFFECT
RESOURCE_NUMERIC + adjust_victory_points
SOURCE_ACTIVE
forced after_battle_result_determined
```

The B13 barrier now emits the authoritative result event only after base scoring. B14 must connect the exact shared-winner VP semantic shape to typed resolution-dataflow rather than allowing it to continue through the legacy resolver.

## Required Semantic Contract

The classifier must be identity-free. A renamed synthetic ability with the exact same shape must classify; representative IDs must not participate in routing.

The supported shape is exactly:

```text
kind = forced_trigger
activation.phase = combat
activation.trigger = after_battle_result_determined
activation.opens = immediate
activation.requiresSourceState = active
conditions = controller_won_battle AND not(controller_sole_winner)
targets = []
cost = []
creates = []
effects = [adjust_victory_points(controller, +2)]
```

Equivalent structural normalization of the two accepted conditions is allowed only if it cannot broaden eligibility to unrelated result triggers. Extra effects, missing/wrong conditions, wrong trigger, wrong source-state policy, non-integer/wrong amount, targets, costs, or creates must remain out of scope/fail closed.

## Production Ordering Contract

The +2 VP reward must be evaluated from B13's stable post-scoring result event.

For an authoritative battlefield where the controller is one of multiple winners:

1. base battle scoring for all resolved battlefields is committed;
2. the post-scoring result event is dispatched with stable `battlePhaseResolutionId / battleId / resultId`;
3. the B14 trigger conditions read the authoritative winner set;
4. only then is `adjust_victory_points(+2)` committed.

B14 must not restore per-battlefield early dispatch.

## Required Positive / Negative Proof

At minimum, focused tests must prove:

- shared winner: applies exactly +2 VP after base scoring;
- sole winner: no +2 VP;
- controller loses: no +2 VP;
- source inactive/invalid: no +2 VP;
- malformed semantic near misses: not classified/no legacy bypass;
- duplicate stable result event: no second +2 VP;
- battle-phase re-entry: no duplicate reward;
- an unrelated battlefield result cannot reward a controller not contained in that result's winners.

## Gate C Requirement

Fresh browser/server evidence must exercise the real room/session path and prove:

- a shared-winner result reaches the post-scoring trigger;
- the final VP contains base scoring plus exactly one +2 trigger reward;
- reconnect projects the same VP/revision;
- stale revision is rejected;
- stale/reconnect/re-entry does not duplicate the +2 reward.

B13 Shinji browser evidence or historical Artoria Caster tests cannot substitute for B14 Gate C.

## Compatibility Boundary

B14 must keep green at least:

- B13 Shinji Battle -> Trigger -> Resource path;
- B07/TO10 Olga first-loss ACTIVATE path;
- TO08 direct Resource Numeric primitives;
- TO11 Trigger Gateway representative;
- TO12 SOURCE_ACTIVE lifecycle representative;
- accepted Card Action / Card Zone / Interaction current-lineage regressions relevant to touched files.

## Explicitly Out Of Scope

B14 does not migrate or promote:

- Tomoe `penalty-on-defeat`;
- Artoria Alter Noble Bloom optional result triggers;
- Artoria Caster optional pilgrim luck-on-win triggers;
- `after_battle_ended` phase-terminal consumers;
- Olga Trismegistus transform/special chain;
- the remaining TO14 direct consumers or other Battle-integration rows;
- TO15 Modifier/Power runtime;
- any global coverage/KPI delta.

## Reviewer Boundary

Codex B may stop only at `IMPLEMENTATION_COMPLETE_CANDIDATE` after freezing an exact candidate SHA with fresh implementation evidence.

A fresh P3-R08 reviewer must independently verify semantic routing, no legacy bypass, shared-winner/sole-winner behavior, post-scoring ordering, exactly-once/reconnect/stale behavior, compatibility, and Gate A/B/C.

Only after R08 acceptance may A03 synchronize the scoped direct-consumer overlay from `1/13` to `2/13`.
