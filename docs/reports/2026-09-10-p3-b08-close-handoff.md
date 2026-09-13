# P3-B08 Close Runtime Handoff From Codex A

- Document Role: AGENT_HANDOFF
- From: Codex A
- To: Codex B
- Source Task: `P3-A03`
- Target Task: `P3-B08`
- Target Branch: `codex/b-p3-b08-close`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this handoff does not promote Gate A/B/C, Phase 3, or Release status.

## Target Task

Codex B owns `CARD_ACTION_SEMANTICS_CLOSE`.

This is the next independent Card Action contract after scoped `PLAY`, `PLAY_SOURCE_RESPONSE`, `ADD_TO_ATTACK`, and `ACTIVATE`. It must not inherit evidence from those contracts.

Historical CLOSE implementation evidence exists in `docs/reports/2026-09-08-card-action-close-result.md`, but B08 must revalidate it against the accepted post-P3-B07 baseline and produce a current implementation report. Old evidence is context, not promotion.

## A Baseline For B

B08 must use the accepted post-P3-B07 checkout as its numeric before baseline.

The reviewer-reported post-B07 coverage numbers are:

```text
newRuntimeSemanticRouted=9
legacyResolveEffect=52
dualRuntime=0
```

If B08 starts from a different merged runtime branch, B must regenerate `phase3:coverage` first and report before/after against that checkout rather than stale A artifacts.

## CLOSE Inventory

Command:

```text
node docs/audits/fd-card-action-close-inventory.mjs
```

Fresh A output:

```text
CARD_ACTION_SEMANTICS_MINIMAL CLOSE inventory
sourceFiles=14
cardActionSemanticAbilities=7
eligible=1
skipped=6
```

Eligible scoped representative:

| Archive | Card | Ability | Kind | Trigger | Effect |
|---|---|---|---|---|---|
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.angra-mainyu-embrace` | `residual` | `on_card_played` | `close_source_card` |

Required exact shape:

- `residual` ability;
- `activation.trigger = on_card_played`;
- no targets;
- no cost;
- no creates;
- exactly one `close_source_card` effect;
- condition includes `source_card_in_zone(field)`;
- condition includes `event_played_card_has_attribute(宝具)`;
- lifecycle, if present, is limited to `duration = while_card_active` and `cleanup = when_card_leaves_active_area`;
- source card must exist;
- source card must be controlled by the ability controller;
- source card must be active face-up in an allowed active zone;
- source card must have a compiled definition;
- triggering played card must be visible to the source-close check and must have `宝具`.

## Skipped Card Action Abilities

| Archive | Card | Ability | Effects | Skip reason |
|---|---|---|---|---|
| `master.kayneth` | `master.kayneth.deck.volumen-hydrargyrum` | `volumen.extra-play` | `play_source_card` | `out_of_scope:play_source_card_response_semantics` |
| `master.kiritsugu` | `master.kiritsugu.skill.time-alter` | `time-alter.action` | `play_selected_cards`, `draw_cards` | `out_of_scope:play_semantics` |
| `master.maiya` | `master.maiya.skill.military` | `military.attach-support-shot` | `attach_card_to_player_attack` | `out_of_scope:add_to_attack_semantics` |
| `master.maiya` | `master.maiya.deck.support-shot` | `support-shot.append-only` | `append_only_rule` | `out_of_scope:append_only_rule_marker` |
| `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.first-loss` | `activate_card_by_id` | `out_of_scope:activate_semantics` |
| `servant.drake` | `servant.drake.skill.sc-drake-1` | `sc-drake-1.mount-summon` | `play_selected_cards` | `out_of_scope:play_semantics` |

## B Runtime Scope

P3-B08 may touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`;
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it;
- focused mechanic tests;
- scoped implementation report;
- one scoped browser/server spec if required by candidate evidence.

P3-B08 must not touch:

- coverage KPI;
- taxonomy classifier rules;
- evidence classification;
- scoped normal `PLAY` contract;
- scoped `PLAY_SOURCE_RESPONSE` contract;
- scoped `ADD_TO_ATTACK` contract;
- scoped `ACTIVATE` contract;
- unrelated card-action contracts;
- broad Trigger runtime beyond exact residual `on_card_played` source-close dispatch;
- broad Lifecycle runtime beyond validating active face-up source close for this exact contract;
- Hidden projection runtime;
- Battle result runtime;
- roster-wide JSON.

## Inheritance Boundary

This contract must not inherit scoped `PLAY`, `PLAY_SOURCE_RESPONSE`, `ADD_TO_ATTACK`, or `ACTIVATE` evidence. Its Gate C inheritance is invalidated by:

- any trigger other than exact residual `on_card_played`;
- any triggering played-card requirement other than visible `宝具`;
- targeted close;
- close-then-activate;
- source card not active, not face-up, off-board, wrong-controller, missing, or lacking compiled definition;
- hidden/private or face-down source identity;
- variable or pending payment;
- creating a card before close;
- activating a card after close;
- temporary-card dissolve;
- non-skill close destination matrix;
- once-per-game residual removal;
- broader cleanup ordering;
- modifier or power follow-up semantics;
- battle-result dependency;
- `PLAY`;
- `PLAY_SOURCE_RESPONSE`;
- `ADD_TO_ATTACK`;
- `ACTIVATE`;
- `CREATE_AND_ACTIVATE`;
- roster-wide JSON migration.

## B Checklist

- Prove routing by exact semantic form, not ability id.
- Prove `close_source_card` is a typed primitive with `closedCount` result schema.
- Prove exact classifier positives and negatives for wrong kind, wrong trigger, missing source-zone condition, missing played-card attribute condition, target additions, costs, creates, and extra effects.
- Prove source-card lookup is fail-closed for missing, off-board, inactive, face-down, wrong-controller, and missing compiled definition.
- Prove non-noble play does not close the source.
- Prove visible noble play closes exactly one active source card and emits traceable `source_card_closed` plus `effect_resolved(close_source_card)` evidence.
- Prove stale replay does not close or move the source twice.
- Keep Kiritsugu targeted close-and-activate, temporary dissolve, non-skill destination close, and broad cleanup ordering outside B08.
- Report before/after legacy route counts against the accepted post-P3-B07 baseline.

## Browser Candidate Boundary

The preferred Gate C candidate should drive the actual visible card-play trigger path:

1. Browser or restored remote room state has Artoria Alter `黑化诅咒` active and face-up in the source active zone.
2. Browser sends WS `client:dispatch_command` with `expectedRevision` to play a visible `宝具`.
3. Server revalidates the card play and the residual `on_card_played` trigger.
4. Data-flow closes the source card exactly once.
5. Projection shows the closed source state.
6. Reconnect preserves the closed source state.
7. Stale replay is rejected before duplicate close or duplicate movement.

The candidate must not claim coverage for targeted close, create-and-activate, hidden source proof, temporary cards, non-skill close destinations, or broader cleanup ordering.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-b08-close-handoff.json
```
