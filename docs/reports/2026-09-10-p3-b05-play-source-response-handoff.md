# P3-B05 Play Source Response Runtime Handoff From Codex A

- Document Role: AGENT_HANDOFF
- From: Codex A
- To: Codex B
- Source Task: `P3-A02`
- Target Task: `P3-B05`
- Target Branch: `codex/b-p3-b05-play-source-response`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this handoff does not promote Gate A/B/C, Phase 3, or Release status.

## Target Task

Codex B owns `CARD_ACTION_SEMANTICS_PLAY_SOURCE_RESPONSE`.

This is the next Card Action contract after accepted P3-B04 scoped `PLAY`. It must not inherit the normal `PLAY` proof from Time Alter.

## A Baseline For B

B05 must use the accepted post-P3-B04 coverage output as its numeric before baseline.

The provisional A02 automation baseline remains:

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

If B05 starts from a merged B04 branch, B must regenerate `phase3:coverage` first and report before/after against that accepted checkout, not against stale A02 artifacts.

## Eligible Contract

Eligible scoped representative:

| Archive | Card | Ability | Kind | Window | Cost | Effect |
|---|---|---|---|---|---|---|
| `master.kayneth` | `master.kayneth.deck.volumen-hydrargyrum` | `volumen.extra-play` | `response` | `controller_combat_action_window` | fixed `pay_mana(2)` | `play_source_card(face_up)` |

Required exact shape:

- `response` ability;
- `activation.trigger = controller_combat_action_window`;
- `responseWindow.opens = controller_combat_action_window`;
- no targets;
- no creates;
- fixed `pay_mana(2)`;
- exactly one `play_source_card(face_up)` effect;
- source card still belongs to the controller and is still in hand at server revalidation.

## Skipped Card Action Abilities

| Archive | Card | Ability | Effects | Skip reason |
|---|---|---|---|---|
| `master.kiritsugu` | `master.kiritsugu.skill.time-alter` | `time-alter.action` | `play_selected_cards`, `draw_cards` | `separate_contract:normal_play_selected_cards` |
| `master.maiya` | `master.maiya.skill.military` | `military.attach-support-shot` | `attach_card_to_player_attack` | `out_of_scope:add_to_attack_semantics` |
| `master.maiya` | `master.maiya.deck.support-shot` | `support-shot.append-only` | `append_only_rule` | `out_of_scope:append_only_rule_marker` |
| `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.first-loss` | `activate_card_by_id` | `out_of_scope:activate_semantics` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.angra-mainyu-embrace` | `close_source_card` | `out_of_scope:close_semantics` |
| `servant.drake` | `servant.drake.skill.sc-drake-1` | `sc-drake-1.mount-summon` | `play_selected_cards` | `not_verified:hidden_power_lifecycle_play_selected_shape` |

## B Runtime Scope

P3-B05 may touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`;
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it;
- focused mechanic tests;
- scoped implementation report;
- one scoped browser/server spec if required by candidate evidence.

P3-B05 must not touch:

- coverage KPI;
- taxonomy classifier rules;
- evidence classification;
- scoped normal `PLAY` contract;
- unrelated card-action contracts;
- Trigger runtime beyond the existing response-window hook needed to open the Volumen prompt;
- Lifecycle runtime;
- Hidden projection runtime;
- Battle result runtime.

## Inheritance Boundary

This contract must not inherit scoped normal `PLAY` evidence. It is invalidated by:

- normal `phase_action` play;
- `play_selected_cards`;
- multiple selected cards;
- face-down source play;
- non-hand source card;
- missing source identity revalidation;
- variable cost;
- pending payment;
- target selection;
- hidden/private choice;
- `ADD_TO_ATTACK`;
- `CREATE_AND_ACTIVATE`;
- `ACTIVATE`;
- `CLOSE`;
- lifecycle cleanup;
- source close;
- modifier or power calculation;
- battle-result dependency;
- defeat or scoring side effects;
- recursive trigger processing beyond the scoped source-card play result.

## B Checklist

- Prove routing by exact semantic form, not ability id.
- Prove fixed `pay_mana(2)` fail-closed for missing, wrong, variable, or pending cost.
- Prove source-card identity and source-still-in-hand revalidation.
- Prove insufficient mana withholds or rejects the response.
- Prove stale replay does not duplicate source-card movement or mana payment.
- Keep Time Alter under scoped `PLAY`; keep Drake skipped.
- Report before/after legacy route counts against the accepted post-P3-B04 baseline.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-b05-play-source-response-handoff.json
```
