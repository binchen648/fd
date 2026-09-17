# P3-TO-03 Strict Domain Trigger Ability Map

- Owner: Codex B, specification lane only
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`
- Inventory authority: `artifacts/phase3-skill-coverage.json` and regenerated `docs/audits/fd-skill-semantic-axis-matrix.md`
- Strict trigger abilities: **37**
- Event types: **13**

## Event-Type Denominator

| Event type | Ability count |
|---|---:|
| `after_battle_ended` | 2 |
| `after_battle_result_determined` | 3 |
| `after_controller_enters_location` | 1 |
| `after_controller_first_loses_battle` | 1 |
| `after_controller_gains_victory` | 1 |
| `after_controller_loses_all_command_seals` | 1 |
| `after_controller_loses_battle` | 4 |
| `after_controller_wins_battle` | 3 |
| `after_player_deployed_to_battlefield` | 1 |
| `before_situation_or_event_resolves` | 1 |
| `game_start` | 4 |
| `on_card_played` | 6 |
| `on_use_declared` | 9 |

The table below maps every strict trigger ability exactly once. `FORCED` means the trigger does not ask the player whether to schedule the trigger. `OPTIONAL` means scheduling requires an accepted Interaction Template handoff. Non-`OPTIONAL_TRIGGER` kinds such as declaration reveal, residual, or continuous formula are still strict event consumers in the corrected semantic-axis inventory and are therefore scheduled as forced consumers when their event contract is supported.

## Ability-Level Mapping

| # | Archive | Card | Ability | Event | Policy | Effect owner | External dependencies | Runtime status |
|---:|---|---|---|---|---|---|---|---|
| 1 | `master.gatou` | `master.gatou.skill.seeker` | `seeker.battle-end-reward` | `after_battle_ended` | `FORCED` | `record_master_directive` | `BATTLE`, `SPECIAL` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 2 | `master.kayneth` | `master.kayneth.skill.alchemist` | `alchemist.setup` | `game_start` | `FORCED` | `CARD_ZONE` + `create_independent_deck` | `SPECIAL` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 3 | `master.maiya` | `master.maiya.skill.military` | `military.has-support-shot` | `game_start` | `FORCED` | `CARD_ZONE` + `create_card` | NONE | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 4 | `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.has-chaldeas` | `game_start` | `FORCED` | `CARD_ZONE` + `create_card` | NONE | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 5 | `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.first-loss` | `after_controller_first_loses_battle` | `FORCED` | `CARD_ACTION_SEMANTICS` + `activate_card_by_id` | `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 6 | `master.olga-marie` | `master.olga-marie.skill.chaldeas` | `chaldeas.swap-before-resolve` | `before_situation_or_event_resolves` | `OPTIONAL` | `CARD_ZONE` + `swap_revealed_with_deck_bottom` | `INTERACTION:YES_NO`, `LIFECYCLE`, `HIDDEN`, `SPECIAL` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 7 | `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.loss-transform` | `after_controller_loses_battle` | `FORCED` | `transform_to_return_silence_on_loss` | `BATTLE`, `SPECIAL` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 8 | `master.shinji` | `master.shinji.skill.drain-command` | `drain-command.enter-miyama` | `after_controller_enters_location` | `FORCED` | `RESOURCE_NUMERIC` + `adjust_mana` | NONE | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 9 | `master.shinji` | `master.shinji.skill.useless-person` | `useless-person.setup` | `game_start` | `FORCED` | `CARD_ZONE` + `create_card` | NONE | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 10 | `master.shinji` | `master.shinji.skill.clown` | `clown.lose-command-seal` | `after_controller_loses_battle` | `FORCED` | `RESOURCE_NUMERIC` + `adjust_command_seals` | `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 11 | `master.shinji` | `master.shinji.skill.false-attendant-book` | `false-attendant-book.first-empty-seals` | `after_controller_loses_all_command_seals` | `FORCED` | `false_attendant_book_replacement` | `LIFECYCLE`, `SPECIAL` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 12 | `servant.achilles` | `servant.achilles.skill.sc-achilles-1` | `sc-achilles-1.achilles-heel` | `after_controller_loses_battle` | `FORCED` | `VISIBILITY` + `reveal_information` | `BATTLE`, `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 13 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-1` | `sc-artoria-alt-1.true-name-release` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 14 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.angra-mainyu-embrace` | `on_card_played` | `FORCED` | `CARD_ACTION_SEMANTICS` + `close_source_card` | `LIFECYCLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 15 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.noble-bloom` | `after_battle_result_determined` | `OPTIONAL` | `RESOURCE_NUMERIC` + `adjust_victory_points` | `INTERACTION:YES_NO`, `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 16 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.noble-bloom-extra-vp` | `after_battle_result_determined` | `OPTIONAL` | `RESOURCE_NUMERIC` + `adjust_victory_points` | `INTERACTION:YES_NO`, `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 17 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-1` | `sc-artoriac-1.true-name-release` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 18 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-1` | `sc-artoriac-1.residual-special-power-bonus` | `on_card_played` | `FORCED` | `NONE` | `LIFECYCLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 19 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-3` | `sc-artoriac-3.discard-public-and-power-formula` | `on_card_played` | `FORCED` | `VISIBILITY` + `set_zone_visibility` | `LIFECYCLE`, `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 20 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-3` | `sc-artoriac-3.shuffle-discard-on-victory` | `after_controller_gains_victory` | `FORCED` | `CARD_ZONE` + `shuffle_zone_into_deck` | NONE | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 21 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-4` | `sc-artoriac-4.unique-passive-luck-on-win` | `after_controller_wins_battle` | `OPTIONAL` | `NONE` | `INTERACTION:YES_NO`, `LIFECYCLE`, `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 22 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-5` | `sc-artoriac-5.unique-passive-luck-on-win` | `after_controller_wins_battle` | `OPTIONAL` | `NONE` | `INTERACTION:YES_NO`, `LIFECYCLE`, `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 23 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-6` | `sc-artoriac-6.unique-passive-luck-on-win` | `after_controller_wins_battle` | `OPTIONAL` | `NONE` | `INTERACTION:YES_NO`, `LIFECYCLE`, `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 24 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-6` | `sc-artoriac-6.gain-vp-if-not-sole-winner` | `after_battle_result_determined` | `FORCED` | `RESOURCE_NUMERIC` + `adjust_victory_points` | `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 25 | `servant.drake` | `servant.drake.skill.sc-drake-1` | `sc-drake-1.draw` | `on_card_played` | `FORCED` | `CARD_ZONE` + `draw_cards` | NONE | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 26 | `servant.drake` | `servant.drake.skill.sc-drake-2` | `sc-drake-2.reveal` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 27 | `servant.drake` | `servant.drake.skill.sc-drake-3` | `sc-drake-3.reveal` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 28 | `servant.drake` | `servant.drake.skill.sc-drake-3` | `sc-drake-3.movement-power` | `on_card_played` | `FORCED` | `NONE` | NONE | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 29 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.netherworld-protection` | `on_card_played` | `FORCED` | `reverse_situation_and_event_power_modifiers` | `LIFECYCLE`, `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 30 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.gain-mana-on-deploy` | `after_player_deployed_to_battlefield` | `FORCED` | `RESOURCE_NUMERIC` + `adjust_mana` | `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 31 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.return-to-skill-zone` | `after_battle_ended` | `FORCED` | `CARD_ZONE` + `move_card` | `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 32 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-3` | `sc-ereshkigal-3.true-name-release` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 33 | `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-1` | `sc-kintoki-1.true-name-release` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 34 | `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-2` | `sc-kintoki-2.true-name-release` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 35 | `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-3` | `sc-kintoki-3.true-name-release` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 36 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-1` | `sc-tomoe-1.penalty-on-defeat` | `after_controller_loses_battle` | `FORCED` | `RESOURCE_NUMERIC` + `adjust_victory_points` | `BATTLE` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |
| 37 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-3` | `sc-tomoe-3.true-name-release` | `on_use_declared` | `FORCED` | `VISIBILITY` + `reveal_information` | `HIDDEN` | `BLOCKED_PENDING_TRIGGER_GATEWAY_REVIEW` |

## Mapping Rules

- Every row is blocked from runtime promotion until P3-TO-03 is independently accepted and a later runtime task is explicitly dispatched.
- `INTERACTION:*` depends on the accepted P3-TO-05 contract as synchronized at reachable commit `7aab428`; this map does not reopen or reimplement interaction runtime.
- `LIFECYCLE`, `BATTLE`, `HIDDEN`, and `SPECIAL` are external owners. A trigger event being representable does not make those abilities runtime-eligible.
- Trigger policy is derived from authored ability kind; no card or ability ID is used to decide gateway eligibility.
- If simultaneous trigger order cannot be derived from a reviewed rule or accepted external ordering contract, the runtime slice must remain blocked rather than inventing an order from card IDs, object iteration, or source-file order.
