# P3-FB2-08 Source-Play + Basic-Attack Draw Trigger Handoff

Date: 2026-09-16
Role: A
Status: READY_FOR_B2

## Baselines

- Runtime/A-sync baseline: `e0f1a40b1e66c64df78f32e98791018475829af3`.
- F1 final source evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Trigger specification dependency: P3-TO-03 `SPEC_ACCEPTED`.
- Existing interaction/play dependency: TO13 `GATE_A_B_CANDIDATE_ACCEPTED` for the Drake-shaped private optional `0..3`, controller-hand, base-power-at-most-3 `play_selected_cards` route.
- Existing Card Zone primitive: typed controller `draw_cards`.

## Goal

Accept one narrow identity-free Trigger Runtime contract for the exact current-lineage Drake draw shape:

`forced on_card_played + source active + played_with_basic_attack + fixed controller draw 1`

This task regularizes an existing tested behavior that currently reaches generic trigger discovery and legacy draw-effect execution. B2 must route only this exact shape through typed Resolution Data-flow and fail closed for recognized malformed near-matches.

## Frozen F1 candidate membership (14)

- `servant.boudica.skill.sc-boudica-3`
- `servant.constantine.skill.sc-constantine-1`
- `servant.drake.skill.sc-drake-1`
- `servant.hephaistion.skill.sc-hephaistion-3`
- `servant.iskandar.skill.sc-iskandar-1`
- `servant.ivan.skill.sc-ivan-3`
- `servant.mandricardo.skill.sc-mandricardo-3`
- `servant.martha.skill.sc-martha-3`
- `servant.medb.skill.sc-medb-1`
- `servant.medusa.skill.sc-medusa-1`
- `servant.odysseus.skill.sc-odysseus-3`
- `servant.roberts.skill.sc-roberts-3`
- `servant.teach.skill.sc-teach-3`
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`

All fourteen source overlays share the same `source_played_with_one_base_attack -> draw_cards(1)` clause plus the same optional low-power hand-play clause. Okita is excluded because its repeat-play / after-each-use draw semantics are materially different.

These 14 are only **candidate post-R25 migration membership**. B2 must not edit F1 authoring or dispatch FM01.

## Exact runtime semantic contract

Candidate envelope:

- `kind = forced_trigger`;
- `activation.trigger = on_card_played`;
- `activation.requiresSourceState = active`.

Accepted exact shape additionally requires:

- no activation phase/window/location metadata;
- exactly one condition: `played_with_basic_attack`;
- no targets, costs, creates, rule modifiers, lifecycle policy, response window, or usage limit;
- exactly one `draw_cards` effect;
- fixed safe-integer count exactly `1`;
- draw owner/player is controller only; current authoring `owner: controller` must normalize to the existing typed controller draw primitive;
- no extra effect semantics.

## Trusted event scope

The trigger may settle only from trusted `on_card_played` event provenance where:

- `event.sourceCardId` is the executing source card instance;
- `event.playerId` equals the source controller;
- `event.playedCards` includes that source face up under the same controller;
- the same batch contains at least one other face-up `basic_attack` controlled by that controller.

Separate plays, a face-down basic companion, another player's basic attack, a wrong event source/player, or a replayed identical event ID must not draw.

`playBatch` remains the event producer. FB2-08 must not create a second play/batch/event engine.

## Execution / fail-closed requirements

- exact semantic route settles `draw_cards(1)` through existing typed Resolution Data-flow;
- normal deck/discard recycle/shuffle behavior remains owned by that primitive;
- recognized candidate shapes with wrong condition/effect/count/owner or extra parent semantics must fail closed before legacy effect fallback when they are actually triggered;
- event dedupe remains exactly once by trusted event ID;
- malformed/failed settlement is atomic under the existing cloned event/action transaction;
- no ability/card/servant identity or printed text may participate in routing.

## Out of scope

- broad Trigger Gateway / all `on_card_played`;
- optional triggers/response windows;
- event attribute triggers such as Noble Phantasm CLOSE;
- Okita repeat-play semantics;
- generic Condition Evaluation;
- broad Card Action PLAY or TO13 reimplementation;
- MatchSession/client/projection changes;
- F1 migration / FM01 dispatch.

## Required proof

1. classifier accepts a renamed exact semantic copy and rejects malformed siblings;
2. real source + face-up basic same batch draws exactly one through typed event evidence;
3. separate plays and face-down/basic-other-controller cases do not trigger;
4. wrong trusted-event source/player does not trigger;
5. same event ID is idempotent;
6. malformed candidate does not fall through to legacy draw mutation;
7. existing TO13 private optional hand-play, Card Action CLOSE `on_card_played`, and other accepted trigger families remain green;
8. typecheck, focused suite, all rules regressions, generated determinism, full CI, identity/forbidden-file audit, and diff check pass.

## May touch

- `packages/rules/src/ability/interpreter.ts`;
- one focused FB2-08 regression test;
- narrow existing trigger/Drake assertions only if required;
- `docs/reports/2026-09-16-p3-fb2-08-source-play-basic-draw-result.md`.

Do not modify MatchSession, authoring, generated content, F1 artifacts, coverage/taxonomy, TO13 interaction implementation, or unrelated hot files.

## Completion status

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
