# P3-B07 Activate Runtime Handoff From Codex A

- Document Role: AGENT_HANDOFF
- From: Codex A
- To: Codex B
- Source Task: `P3-A02`
- Target Task: `P3-B07`
- Target Branch: `codex/b-p3-b07-activate`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this handoff does not promote Gate A/B/C, Phase 3, or Release status.

## Target Task

Codex B owns `CARD_ACTION_SEMANTICS_ACTIVATE`.

This is the next independent Card Action contract after scoped `PLAY`, `PLAY_SOURCE_RESPONSE`, and `ADD_TO_ATTACK`. It must not inherit evidence from those contracts.

## Critical Delayed Trigger Split

Olga-Marie's canonical printed text says:

```text
当你首次战败后的回合结束时，激活【特里斯墨吉斯忒斯之殇】。
```

The current canonical authoring JSON represents the ability as:

```text
activation.trigger = after_controller_first_loses_battle
effect = activate_card_by_id(master.olga-marie.skill.trismegistus-grief)
```

B07 must not interpret that as immediate activation. The scoped contract has two separate runtime responsibilities:

1. `after_controller_first_loses_battle` records a stable pending delayed activation and does not move or activate the target card.
2. The formal `round_end` event consumes that pending delayed activation and then executes the compiled `activate_card_by_id` data-flow primitive.

If current runtime cannot express this split without a card-specific hardcode or broad trigger scheduler, record a runtime semantic gap in the implementation report and stop rather than claiming B07 complete.

## A Baseline For B

B07 must use the accepted post-P3-B06 checkout as its numeric before baseline.

The provisional automation baseline available from the current A branch remains:

```text
totalAbilities=92
newRuntimeSemanticRouted=8
legacyExecuteAbility=3
legacyResolveEffect=53
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
compiledDefinitionHash=1bccc97dd813d9b48208ff6223db40f11a995ca123a513e78e7e444d9bdafe2f
```

If B07 starts from the merged B06 runtime branch, B must regenerate `phase3:coverage` first and report before/after against that accepted checkout, not against stale A artifacts.

## ACTIVATE Inventory

Command:

```text
node docs/audits/fd-card-action-activate-inventory.mjs
```

Fresh A output:

```text
CARD_ACTION_SEMANTICS_MINIMAL ACTIVATE inventory
sourceFiles=14
cardActionSemanticAbilities=7
eligible=1
skipped=6
```

Eligible scoped representative:

| Archive | Card | Ability | Kind | Trigger | Effect |
|---|---|---|---|---|---|
| `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.first-loss` | `forced_trigger` | `after_controller_first_loses_battle` with delayed `round_end` consumption | `activate_card_by_id(master.olga-marie.skill.trismegistus-grief)` |

Required exact shape:

- `forced_trigger` ability;
- authoring trigger is `after_controller_first_loses_battle`;
- no targets;
- no cost;
- no creates;
- exactly one `activate_card_by_id` effect;
- `definitionId = master.olga-marie.skill.trismegistus-grief`;
- runtime splits printed delayed timing into first-loss pending marker plus formal `round_end` activation;
- target card must already exist;
- target card must be owned or controlled by the Olga controller according to the existing card ownership model;
- target card must be in the allowed inactive source zone, expected to be `skill`;
- target card must not already be active.

## Skipped Card Action Abilities

| Archive | Card | Ability | Effects | Skip reason |
|---|---|---|---|---|
| `master.kayneth` | `master.kayneth.deck.volumen-hydrargyrum` | `volumen.extra-play` | `play_source_card` | `out_of_scope:play_semantics` |
| `master.kiritsugu` | `master.kiritsugu.skill.time-alter` | `time-alter.action` | `play_selected_cards`, `draw_cards` | `out_of_scope:play_semantics` |
| `master.maiya` | `master.maiya.skill.military` | `military.attach-support-shot` | `attach_card_to_player_attack` | `out_of_scope:add_to_attack_semantics` |
| `master.maiya` | `master.maiya.deck.support-shot` | `support-shot.append-only` | `append_only_rule` | `out_of_scope:append_only_rule_marker` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.angra-mainyu-embrace` | `close_source_card` | `out_of_scope:close_semantics` |
| `servant.drake` | `servant.drake.skill.sc-drake-1` | `sc-drake-1.mount-summon` | `play_selected_cards` | `out_of_scope:play_semantics` |

## B Runtime Scope

P3-B07 may touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`;
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it;
- focused mechanic tests;
- scoped implementation report;
- one scoped browser/server spec if required by candidate evidence.

P3-B07 must not touch:

- coverage KPI;
- taxonomy classifier rules;
- evidence classification;
- scoped normal `PLAY` contract;
- scoped `PLAY_SOURCE_RESPONSE` contract;
- scoped `ADD_TO_ATTACK` contract;
- unrelated card-action contracts;
- broad Trigger runtime beyond the exact Olga first-loss pending marker and round-end consumption;
- Lifecycle runtime beyond this exact delayed activation consumption;
- Hidden projection runtime;
- Battle result runtime beyond consuming the existing first-loss event;
- roster-wide JSON.

## Inheritance Boundary

This contract must not inherit scoped `PLAY`, `PLAY_SOURCE_RESPONSE`, or `ADD_TO_ATTACK` evidence. Its Gate C inheritance is invalidated by:

- immediate activation at battle-loss time;
- any trigger other than `after_controller_first_loses_battle`;
- no formal `round_end` consumption;
- optional response timing;
- client-command activation;
- target selection;
- variable or pending payment;
- hidden/private choice;
- creating a new card before activation;
- activating a card outside the allowed inactive source zone;
- activating an already-active card;
- ambiguous duplicate cards with the same `definitionId`;
- source close;
- modifier or power follow-up semantics;
- Trismegistus follow-up abilities;
- `CREATE_AND_ACTIVATE`;
- `CLOSE`;
- roster-wide JSON migration.

## B Checklist

- Prove routing by exact semantic form, not ability id.
- Prove `after_controller_first_loses_battle` records pending delayed activation without moving the target.
- Prove repeated first-loss event does not duplicate pending activation or repeated activation.
- Prove formal `round_end` consumes the pending activation exactly once.
- Prove target lookup is fail-closed for missing target, wrong owner/controller, wrong zone, duplicate ambiguous target, and already-active target.
- Prove the card moves from `skill` to `field` or the canonical active zone used by the runtime, and records active face-up card state.
- Prove event/projection trace exposes activation source and result identity.
- Keep Trismegistus `soul_drag_power_bonus`, `transform_to_return_silence_on_loss`, and `return_silence_battle_start` as secondary runtime paths outside B07.
- Keep Time Alter under `PLAY`, Volumen under `PLAY_SOURCE_RESPONSE`, Maiya under `ADD_TO_ATTACK`, and Drake skipped.
- Report before/after legacy route counts against the accepted post-P3-B06 baseline.

## Browser Candidate Boundary

Preferred Gate C candidate is not a button-click ability test. Olga activation is event-driven.

The browser/server candidate should start no later than a restored first-loss pending state, then drive a real server phase transition to formal `round_end`, assert activation in projection, reload/reconnect, and assert stale or duplicate round-end processing cannot activate twice. If B can cheaply start earlier from a real battle loss event, that is stronger, but the acceptance boundary must still prove no immediate activation before `round_end`.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-b07-activate-handoff.json
```
