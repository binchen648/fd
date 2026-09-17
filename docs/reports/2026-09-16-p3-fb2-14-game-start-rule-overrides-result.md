# P3-FB2-14 Game-Start Rule Overrides — B2 Result

Date: 2026-09-16
Owner: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base / A handoff: `50602c9355794c9c0c7fe4d79b75f7936d912c17`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted canonical overlap at dispatch: `101/944`

## Implemented contract

FB2-14 implements exactly the identity-free typed `game_start` persistent RuleOverride family frozen by A. No future FM08 identity is routed by id, name, or printed text, and no authoring migration is included.

The runtime adds a typed `RuleOverrideState` and accepts only an automatic forced `game_start` ability whose structural payload consists of one or more distinct, exactly whitelisted `install_rule_override` effects for the controller. The exact whitelist is:

1. `first_logical_day_total_power_adjustment(value=-2)`;
2. `non_climax_situation_mana_gain_cap(value=1)`;
3. `lock_controller_movement_in_own_action_and_combat(enabled=true)`;
4. `round_total_mana_gain_cap(regular=2, climax=4)`;
5. `total_power_adjustment_if_other_battle_participant_lower_vp(value=-2)`;
6. `controller_master_skill_power_lock_if_situation_forbids(attribute=宝具,value=0)`;
7. `command_spell_phase_override(phase=advance)`;
8. `view_opponent_discard(enabled=true)`;
9. `extra_attack_play_allowance_if_mana_at_least(threshold=11,amount=1)`;
10. `view_face_down_events(enabled=true)`;
11. `ignore_situation_play_forbid_attribute(attribute=宝具)`.

Any wrong literal, wrong player, extra field, duplicate rule, foreign response metadata, or non-`game_start` structural variant fails closed. Loader-normalized empty response metadata is accepted only as the exact defaults `order=turn_order` and `passBehavior=decline_this_window`; this preserves the frozen raw-empty contract without broadening response semantics.

## Generic consumers

- Combat derives first-logical-day `-2` and lower-VP-participant `-2` from typed state only.
- Controller `master_skill` Power is final-locked to `0` only while an active Situation-origin forbid matches `宝具`; event-origin forbids do not trigger that lock.
- Command-spell action timing is replaced by Advance only for the configured controller.
- Sieg-family attack allowance is prospective: regular allowance gains exactly `+1` while authoritative mana is at least `11`.
- Zouken-family exemption ignores only matching Situation-origin `modeState.cardPlayForbids`; event-origin forbids remain enforced.
- Own Action/Combat movement lock applies to normal movement and ordinary card-effect movement. A trusted, explicit `ignoreCardMovementRestrictions` effect path can bypass it; Preparation/Advance are unaffected.
- Ordinary client projections no longer expose ids of `hidden_until_trigger` event placements. The authorized viewer override exposes those ids without changing public count semantics.
- Authorized opponent-discard visibility exposes opponent discard ids only; it does not expose opponent hand/deck/private-zone ids.

## Shared positive-mana authority

Positive mana gains now converge on `grantMana(...)` for the generic typed adjustment path, effect-stack `gain_mana`, Situation grants, Magic Workshop/deployment grants, and the standalone Situation engine. The ledger records only successfully applied positive gains.

- non-climax Situation printed grant is capped to `1` before the round budget;
- regular round positive-gain budget is `2`, climax budget is `4`;
- deterministic partial application reports requested/capped/applied/overflow quantities;
- storage cap remains `12` unless the existing runtime mana-cap authority overrides it;
- mana payments, losses, and direct set-mana semantics do not consume positive-gain budget;
- round transition resets the ledger through the authoritative phase/round transition path.

## Game-start / persistence authority

Installation is driven by the existing trusted backend `game_start` event path and inherits `processedEvents` replay idempotency. Typed overrides and the positive-gain ledger are ordinary serialized authoritative state and survive MatchSession serialize/restore without creating a second persistence path.

## Focused evidence

`packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`: `9 / 9 PASS`.

The focused suite proves:

1. all eleven exact shapes accept under a renamed synthetic source and near matches fail closed;
2. a real loaded `game_start` source installs all typed overrides, and duplicate event replay is idempotent;
3. non-climax Situation cap, regular/climax round gain budgets, partial application, non-gain semantics, and round reset;
4. first-logical-day and lower-VP combat adjustments;
5. Situation-only `master_skill` Power lock;
6. command-spell phase replacement, prospective attack allowance, and Situation-only Noble Phantasm forbid exemption;
7. Action/Combat movement lock plus explicit trusted bypass and Advance non-interference;
8. hidden-event and opponent-discard projection privacy;
9. serialization/restoration of typed overrides and gain ledger.

Focused/high-risk compatibility set: `5 files / 60 tests PASS`, covering the new family plus effect resolver, resolution data-flow, movement, and full MatchSession regressions.

## Full validation

- `npm.cmd run typecheck`: PASS.
- rules regression + core: `66 files / 394 tests PASS`.
- `npm.cmd run content:validate`: `7 masters, 7 servants, 20 events, 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- standard `npm.cmd run test:ci`: `120 files / 736 tests PASS`.
- One first full-CI attempt hit the existing eleven-round MatchSession test's 5s wall at 5.059s under parallel load. The exact test immediately passed in isolation at 1.78s, the focused suite passed it at 1.68s, and a fresh unmodified full-CI rerun passed all `736/736`; no timeout or production behavior was changed.
- `git diff --check`: PASS.

## Coverage / determinism

Fresh `phase3:coverage` remains exactly at the R38-accepted FM07 material baseline:

- archives `90`;
- cards `123`;
- abilities `222`;
- `newRuntimeSemanticRouted=22`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=127`;
- `dualRuntime=0`;
- `notClassifiable=70`;
- `taxonomyWarnings=124`;
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- blocking issues `0`.

Runtime-only FB2-14 does not manufacture FM08 coverage credit. Fresh `phase3:coverage` changes its generated artifact only through `generatedAt` and static source-location/runtime-handler scan offsets/additions caused by the new generic runtime. Fresh `phase3:automation-audit` reports the same authoritative legacy counters (`127 / 3 / 70`) as R38; both regenerated artifacts are intentionally excluded from the B2 candidate commit.

## Scope / safety audit

- exact future FM08 ids found in `packages/rules/src`: `0`;
- authoring diff from exact A handoff base: `0` files;
- arbitrary player/runtime flag bag: `0`;
- runtime printed-text parser or identity/name router: `0`;
- Leonardo s1a / Ophelia s1a promotion: `0`;
- future FM08 authoring migration: `0`;
- existing accepted canonical overlap remains `101/944`; runtime acceptance alone does not claim `111/944`.

## Reviewer handoff

R39 must independently review the exact FB2-14 candidate and must not implement fixes. It should independently verify the eleven-shape fail-closed classifier, loader normalization boundary, all generic consumers, positive-mana ledger ordering/counting, hidden-event privacy, viewer-scoped opponent discard visibility, movement trusted-bypass boundary, persistence/idempotency, zero future-identity routing, zero authoring migration, and independently reconcile the exact ten-member future FM08 family before A may synchronize FM08 to READY.
