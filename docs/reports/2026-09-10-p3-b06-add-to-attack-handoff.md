# P3-B06 Add To Attack Runtime Handoff From Codex A

- Document Role: AGENT_HANDOFF
- From: Codex A
- To: Codex B
- Source Task: `P3-A02`
- Target Task: `P3-B06`
- Target Branch: `codex/b-p3-b06-add-to-attack`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this handoff does not promote Gate A/B/C, Phase 3, or Release status.

## Target Task

Codex B owns `CARD_ACTION_SEMANTICS_ADD_TO_ATTACK`.

This is the next independent Card Action contract after scoped `PLAY` and scoped `PLAY_SOURCE_RESPONSE`. It must not inherit either Time Alter normal-play evidence or Volumen source-card response evidence.

## A Baseline For B

B06 must use the accepted post-P3-B05 coverage output as its numeric before baseline.

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

If B06 starts from the merged B05 runtime branch, B must regenerate `phase3:coverage` first and report before/after against that accepted checkout, not against stale A artifacts.

## ADD_TO_ATTACK Inventory

Command:

```text
node docs/audits/fd-card-action-add-to-attack-inventory.mjs
```

Fresh A output:

```text
CARD_ACTION_SEMANTICS_MINIMAL ADD_TO_ATTACK inventory
sourceFiles=14
cardActionSemanticAbilities=7
eligible=1
skipped=6
```

Eligible scoped representative:

| Archive | Card | Ability | Kind | Window | Cost | Target | Effect |
|---|---|---|---|---|---|---|---|
| `master.maiya` | `master.maiya.skill.military` | `military.attach-support-shot` | `phase_action` | `advance` / `controller_action_window` | fixed `pay_mana(2)` | one non-controller player | `attach_card_to_player_attack` |

Required exact shape:

- `phase_action` ability;
- `activation.phase = advance`;
- `activation.opens = controller_action_window`;
- canonical condition: `not(controller_at_battlefield)`;
- exactly one target `supported_player`;
- target type is `player`;
- target count is exactly one;
- target constraints include `not_controller`;
- fixed `pay_mana(2)`;
- no creates;
- exactly one `attach_card_to_player_attack` effect;
- `cardId = master.maiya.deck.support-shot`;
- `target = supported_player`;
- `returnAtRoundEnd = true`;
- `controllerCannotWinStatus = maiya_cannot_win_battle_this_round`;
- support-shot card must still exist in the controller's skill zone at server revalidation.

## Skipped Card Action Abilities

| Archive | Card | Ability | Effects | Skip reason |
|---|---|---|---|---|
| `master.kayneth` | `master.kayneth.deck.volumen-hydrargyrum` | `volumen.extra-play` | `play_source_card` | `out_of_scope:play_semantics` |
| `master.kiritsugu` | `master.kiritsugu.skill.time-alter` | `time-alter.action` | `play_selected_cards`, `draw_cards` | `out_of_scope:play_semantics` |
| `master.maiya` | `master.maiya.deck.support-shot` | `support-shot.append-only` | `append_only_rule` | `out_of_scope:append_only_rule_marker` |
| `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.first-loss` | `activate_card_by_id` | `out_of_scope:activate_semantics` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.angra-mainyu-embrace` | `close_source_card` | `out_of_scope:close_semantics` |
| `servant.drake` | `servant.drake.skill.sc-drake-1` | `sc-drake-1.mount-summon` | `play_selected_cards` | `out_of_scope:play_semantics` |

## B Runtime Scope

P3-B06 may touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`;
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it;
- focused mechanic tests;
- scoped implementation report;
- one scoped browser/server spec if required by candidate evidence.

P3-B06 must not touch:

- coverage KPI;
- taxonomy classifier rules;
- evidence classification;
- scoped normal `PLAY` contract;
- scoped `PLAY_SOURCE_RESPONSE` contract;
- unrelated card-action contracts;
- Trigger runtime;
- Lifecycle runtime beyond the exact round-end return marker already present on this contract;
- Hidden projection runtime;
- Battle result runtime beyond the exact cannot-win status required by this contract.

## Inheritance Boundary

This contract must not inherit scoped normal `PLAY` evidence or scoped `PLAY_SOURCE_RESPONSE` evidence. Its Gate C inheritance is invalidated by:

- normal hand-card play;
- response-window source-card play;
- `play_selected_cards`;
- `play_source_card`;
- `append_only_rule`;
- variable or pending payment;
- target selection other than exactly one non-controller player;
- hidden/private choice;
- missing support-shot identity;
- support-shot not in controller skill zone;
- attachment to self;
- movement to ordinary `attack_area` as a normal play;
- missing `returnAtRoundEnd`;
- source close;
- modifier or power calculation;
- battle-result dependency other than the scoped cannot-win status marker;
- lifecycle semantics beyond round-end return of the attached support card;
- `CREATE_AND_ACTIVATE`;
- `ACTIVATE`;
- `CLOSE`;
- roster-wide JSON migration.

## B Checklist

- Prove routing by exact semantic form, not ability id.
- Prove fixed `pay_mana(2)` fail-closed for missing, wrong, variable, or pending cost.
- Prove canonical condition: controller at battlefield cannot activate and does not pay mana.
- Prove missing support-shot fails closed before spending mana.
- Prove target revalidation rejects self-target and unavailable players.
- Prove stale replay does not duplicate attachment, mana payment, cannot-win status, or VP/battle trace side effects.
- Prove normal `PLAY` counters are not consumed by this append-to-attack contract unless future canonical text explicitly requires it.
- Keep support-shot `append_only_rule` and `support-shot.suppress` out of B06 runtime migration.
- Keep Time Alter under scoped `PLAY`; keep Volumen under scoped `PLAY_SOURCE_RESPONSE`; keep Drake skipped.
- Report before/after legacy route counts against the accepted post-P3-B05 baseline.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-b06-add-to-attack-handoff.json
```
