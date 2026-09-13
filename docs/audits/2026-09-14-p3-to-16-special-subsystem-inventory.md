# P3-TO-16 Special Subsystem Authoritative Inventory

- Owner: Codex B, planning/docs-only lane
- Date: 2026-09-14
- Status: `PLANNING_REVIEW_READY`
- Runtime authorization: `NONE`
- Authority: current `artifacts/phase3-skill-coverage.json` + `docs/audits/fd-skill-semantic-axis-matrix.md`

## Correct Denominator And Drift Finding

Current authoritative strict denominator:

```text
SPECIAL_SUBSYSTEM abilities=17
SPECIAL_SUBSYSTEM cards=12
LEGACY_RESOLVE_EFFECT among strict special=17
NEW_RUNTIME among strict special=0
```

The older throughput/optimization prose that says **18 abilities / 13 cards** is stale planning evidence. The corrected taxonomy commit `ce17801` introduced the semantic-axis matrix at **17**; this is not a later consumer silently disappearing. TO-16 therefore uses **17/12** as its acceptance denominator and treats 18/13 only as historical drift to be repaired by the owning documentation lane.

The old conservative `30 special-like` estimate is a scheduling-risk heuristic, not a strict semantic-axis or acceptance denominator. It must not be mixed into the 17-row quarantine ledger.

## Strict Cluster Summary

| Cluster | Abilities | Intended isolation direction |
|---|---:|---|
| `DIRECTIVE_PROTOCOL` | 10 | Quarantine string protocol; decompose to typed scoring/movement/rule/card/battle contracts. |
| `INDEPENDENT_DECK` | 2 | Isolated deterministic private-deck subsystem candidate. |
| `DECK_REPLACEMENT` | 1 | Typed Card Zone + Interaction/Hidden composition candidate. |
| `MATCH_DECK_INTERVENTION` | 1 | Typed match-deck intervention + Trigger/Interaction/Lifecycle/Hidden composition. |
| `STATE_TRANSFORM_CHAIN` | 2 | Typed transform/state-machine + Trigger/Lifecycle/Battle composition. |
| `IDENTITY_REPLACEMENT` | 1 | Dedicated roster/identity replacement subsystem. |

## Ability-Level Inventory

| # | Archive | Card | Ability | Cluster | Exact primitive(s) | Event/timing | Interaction | Lifecycle | Battle | Runtime route |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | `master.gatou` | `master.gatou.skill.seeker` | `seeker.battle-end-reward` | `DIRECTIVE_PROTOCOL` | `record_master_directive` | `after_battle_ended` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 2 | `master.gatou` | `master.gatou.skill.seeker` | `seeker.meditation` | `DIRECTIVE_PROTOCOL` | `record_master_directive` | `WHILE_ACTIVE` | NONE | NONE | NONE | `LEGACY_RESOLVE_EFFECT` |
| 3 | `master.gatou` | `master.gatou.command-spell` | `command-spell.power-victory` | `DIRECTIVE_PROTOCOL` | `adjust_command_seals`<br>`record_master_directive` | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 4 | `master.gatou` | `master.gatou.command-spell` | `command-spell.free-move` | `DIRECTIVE_PROTOCOL` | `adjust_command_seals`<br>`record_master_directive` | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 5 | `master.irisviel` | `master.irisviel.skill.proxy-master` | `proxy-master.command-spell-timing` | `DIRECTIVE_PROTOCOL` | `record_master_directive` | `WHILE_ACTIVE` | NONE | NONE | NONE | `LEGACY_RESOLVE_EFFECT` |
| 6 | `master.kayneth` | `master.kayneth.skill.double-master` | `double-master.passive` | `DIRECTIVE_PROTOCOL` | `record_master_directive` | `WHILE_ACTIVE` | NONE | NONE | NONE | `LEGACY_RESOLVE_EFFECT` |
| 7 | `master.kayneth` | `master.kayneth.skill.alchemist` | `alchemist.setup` | `INDEPENDENT_DECK` | `create_independent_deck` | `game_start` | NONE | NONE | NONE | `LEGACY_RESOLVE_EFFECT` |
| 8 | `master.kayneth` | `master.kayneth.skill.alchemist` | `alchemist.draw-volumen` | `INDEPENDENT_DECK` | `draw_from_independent_deck` | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | NONE | NONE | NONE | `LEGACY_RESOLVE_EFFECT` |
| 9 | `master.kiritsugu` | `master.kiritsugu.skill.magus-killer` | `magus-killer.setup` | `DECK_REPLACEMENT` | `replace_card_in_deck` | `CONTROLLER_ACTION_WINDOW`<br>`PREPARATION` | `CHOOSE_N_CARDS` | NONE | NONE | `LEGACY_RESOLVE_EFFECT` |
| 10 | `master.kiritsugu` | `master.kiritsugu.skill.square-accel` | `square-accel.combat` | `DIRECTIVE_PROTOCOL` | `record_master_directive` | `COMBAT`<br>`CONTROLLER_COMBAT_ACTION_WINDOW` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 11 | `master.kiritsugu` | `master.kiritsugu.deck.origin-bullet` | `origin-bullet.cut-bind` | `DIRECTIVE_PROTOCOL` | `record_master_directive` | `COMBAT`<br>`CONTROLLER_COMBAT_ACTION_WINDOW` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 12 | `master.olga-marie` | `master.olga-marie.skill.chaldeas` | `chaldeas.swap-before-resolve` | `MATCH_DECK_INTERVENTION` | `swap_revealed_with_deck_bottom` | `before_situation_or_event_resolves` | `YES_NO` | `limit:scope:this_card`<br>`limit:type:per_round`<br>`limit:uses:1` | NONE | `LEGACY_RESOLVE_EFFECT` |
| 13 | `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.loss-transform` | `STATE_TRANSFORM_CHAIN` | `transform_to_return_silence_on_loss` | `after_controller_loses_battle` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 14 | `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.return-silence` | `STATE_TRANSFORM_CHAIN` | `return_silence_battle_start` | `WHILE_ACTIVE` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 15 | `master.olga-marie` | `master.olga-marie.command-spell` | `command-spell.power-victory` | `DIRECTIVE_PROTOCOL` | `adjust_command_seals`<br>`record_master_directive` | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 16 | `master.olga-marie` | `master.olga-marie.command-spell` | `command-spell.free-move` | `DIRECTIVE_PROTOCOL` | `adjust_command_seals`<br>`record_master_directive` | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | NONE | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 17 | `master.shinji` | `master.shinji.skill.false-attendant-book` | `false-attendant-book.first-empty-seals` | `IDENTITY_REPLACEMENT` | `false_attendant_book_replacement` | `after_controller_loses_all_command_seals` | NONE | `limit:scope:this_card`<br>`limit:type:per_game`<br>`limit:uses:1` | NONE | `LEGACY_RESOLVE_EFFECT` |

## Inventory Invariants

- Card/ability IDs identify evidence rows only; they are forbidden as generic runtime routing conditions.
- A row may leave the strict special quarantine only after its semantics are owned by reviewed typed contracts and the A-owned taxonomy/coverage lane explicitly reclassifies it. Runtime implementation alone does not change this denominator.
- A generic primitive implemented inside `extended-effects.ts` is not automatically a special subsystem. Conversely, a strict special row does not become core merely because its effect can be expressed as several generic mutations.
- Hidden, Trigger, Interaction, Lifecycle, Battle, Modifier/Power, and Card Zone axes remain separate dependencies; Special Isolation must not absorb them.
- The authoritative row set is regenerated from semantic-axis evidence; conservative text scans never add acceptance rows.
