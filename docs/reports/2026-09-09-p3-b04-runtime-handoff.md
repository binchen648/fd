# P3-B04 Runtime Handoff From Codex A

- Document Role: AGENT_HANDOFF
- From: Codex A
- To: Codex B
- Source Task: `P3-A01`
- Target Task: `P3-B04`
- Target Branch: `codex/b-p3-b04-card-action-play`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this handoff does not promote Gate A/B/C, Phase 3, or Release status.

## Target Task

Per `docs/agents/PHASE3-TASK-INDEX.md`, Codex B owns `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`.

Codex B should read only:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`;
- `TASK P3-B04` from `docs/agents/PHASE3-TASK-INDEX.md`;
- `docs/rules/FD-Game-Rules-Final.md` card play semantics only;
- `docs/plans/fd-card-engine-stabilization-plan.md` Phase 3 only;
- `docs/audits/fd-skill-mechanic-family-matrix.md` relevant `CARD_ACTION_SEMANTICS` rows only;
- `docs/audits/fd-skill-semantic-axis-matrix.md` relevant ability rows only.

## A Baseline For B

Fresh A automation baseline:

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

Codex B must report before/after route counts against this baseline. B must not redefine taxonomy, KPI, or evidence classification.

## PLAY Inventory

Command:

```text
node docs/audits/fd-card-action-play-inventory.mjs
```

Fresh output:

```text
CARD_ACTION_SEMANTICS_MINIMAL PLAY inventory
sourceFiles=14
cardActionSemanticAbilities=7
eligible=1
skipped=6
```

Eligible scoped PLAY ability:

| Archive | Card | Ability | Effects |
|---|---|---|---|
| `master.kiritsugu` | `master.kiritsugu.skill.time-alter` | `time-alter.action` | `play_selected_cards`, `draw_cards` |

Skipped abilities:

| Archive | Card | Ability | Effects | Skip reason |
|---|---|---|---|---|
| `master.kayneth` | `master.kayneth.deck.volumen-hydrargyrum` | `volumen.extra-play` | `play_source_card` | `separate_contract:play_source_card_response` |
| `master.maiya` | `master.maiya.skill.military` | `military.attach-support-shot` | `attach_card_to_player_attack` | `out_of_scope:add_to_attack_semantics` |
| `master.maiya` | `master.maiya.deck.support-shot` | `support-shot.append-only` | `append_only_rule` | `out_of_scope:append_only_rule_marker` |
| `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.first-loss` | `activate_card_by_id` | `out_of_scope:activate_semantics` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.angra-mainyu-embrace` | `close_source_card` | `out_of_scope:close_semantics` |
| `servant.drake` | `servant.drake.skill.sc-drake-1` | `sc-drake-1.mount-summon` | `play_selected_cards` | `not_verified:play_selected_shape_not_exact_match` |

## B Runtime Scope

P3-B04 may touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`;
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it;
- focused mechanic tests;
- scoped implementation report.

P3-B04 must not touch:

- coverage KPI;
- taxonomy classifier rules;
- evidence classification;
- unrelated card-action contracts;
- Trigger runtime;
- Lifecycle runtime;
- Interaction runtime;
- Hidden projection runtime;
- Battle runtime.

Hot files reserved for B:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`.

## PLAY Contract Boundary

The scoped PLAY contract may inherit Time Alter representative evidence only for the exact semantic form:

- direct visible `phase_action`;
- no cost;
- no creates;
- server-projected controller hand card target;
- selected target must be an attack card;
- selected card is played face-down through the shared `playBatch` hook;
- paired `draw_cards(1)` companion effect;
- mandatory target availability checked before activation.

It must not inherit Gate C if the ability introduces:

- `play_source_card`;
- costed play;
- response-window play;
- hidden/private target or choice;
- power or lifecycle dependency;
- `ADD_TO_ATTACK`;
- `CREATE_AND_ACTIVATE`;
- `ACTIVATE`;
- `CLOSE`;
- card movement outside exact selected controller hand attack to `attack_area` face-down.

## B Checklist

- Consume the A baseline as read-only input before editing runtime.
- Prove semantic routing by shape, not ability id.
- Keep Volumen under `PLAY_SOURCE_CARD_WITH_COST_RESPONSE`, not scoped PLAY.
- Keep Drake `mount-summon` skipped until hidden/private, power, and lifecycle dependencies are handled by separate tasks.
- Report before/after legacy route count.
- Include fail-closed proof for invalid shape and runtime corruption.
- Produce implementer evidence only; Codex R owns promotion.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-b04-runtime-handoff.json
```
