# P3-TO-14 Battle Integration Ability Map

- Date: 2026-09-14
- Status: AUTHORITATIVE_DENOMINATOR_FOR_TO14_REVIEW
- Source: `artifacts/phase3-skill-coverage.json` corrected semantic-axis plus `docs/audits/fd-skill-mechanic-family-matrix.md` reconciliation
- Strict battle-integration denominator: **39 abilities / 28 cards**
- Direct post-result / battle-ended event consumers: **13**
- Other battle integration rows: **26**

## Reconciliation

Current semantic-axis membership and the historical `BATTLE_RESULT` membership are exact-set equal: 39 vs 39, with no added or missing row. TO-14 therefore keeps 39/28 as the **battle-integration** denominator. It does **not** relabel all 39 rows as result-trigger consumers.

Cross-axis producer note: `servant.artoriac.skill.sc-artoriac-3#sc-artoriac-3.shuffle-discard-on-victory` consumes Trigger Gateway event `after_controller_gains_victory`. It is not tagged BATTLE_INTEGRATION and is **not** denominator row 40, but Scoring/Battle still owns production of that strict event.

## Cluster Counts

| Cluster | Count | Meaning |
|---|---:|---|
| RESULT_EVENT_CONSUMER | 13 | Directly consumes a post-result / post-battle domain event and therefore needs Battle Result -> Trigger Gateway payload. |
| BATTLE_DEPLOY_EVENT | 1 | Deployment-to-battlefield trigger; composes Movement + Trigger + Battle context, not a battle result. |
| BATTLE_MODIFIER_EVENT | 1 | Card-play event installs/changes battle power semantics; composes Card Action/Trigger/Modifier. |
| BATTLE_STATE_OR_COMBAT_INTEGRATION | 24 | Combat action/passive/state rule that consumes battle state, power, location, movement, lifecycle, or interaction, but not a result event. |

## 39-Row Map

| Archive | Card | Ability | Kind | Event trigger | Cluster | Runtime route |
|---|---|---|---|---|---|---|
| `master.gatou` | `master.gatou.skill.seeker` | `seeker.battle-end-reward` | FORCED_TRIGGER | `after_battle_ended` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `master.gatou` | `master.gatou.command-spell` | `command-spell.power-victory` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.gatou` | `master.gatou.command-spell` | `command-spell.free-move` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.kayneth` | `master.kayneth.skill.pride` | `pride.must-deploy` | PASSIVE | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `master.kayneth` | `master.kayneth.deck.volumen-hydrargyrum` | `volumen.extra-play` | RESPONSE | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NEW_RUNTIME_SEMANTIC_ROUTED` |
| `master.kiritsugu` | `master.kiritsugu.skill.square-accel` | `square-accel.combat` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.kiritsugu` | `master.kiritsugu.deck.origin-bullet` | `origin-bullet.cut-bind` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.maiya` | `master.maiya.skill.military` | `military.attach-support-shot` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NEW_RUNTIME_SEMANTIC_ROUTED` |
| `master.olga-marie` | `master.olga-marie.skill.astronomical-science` | `astronomical-science.first-loss` | FORCED_TRIGGER | `after_controller_first_loses_battle` | RESULT_EVENT_CONSUMER | `NEW_RUNTIME_SEMANTIC_ROUTED` |
| `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.soul-drag` | PASSIVE | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.loss-transform` | FORCED_TRIGGER | `after_controller_loses_battle` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.return-silence` | PASSIVE | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.olga-marie` | `master.olga-marie.command-spell` | `command-spell.power-victory` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.olga-marie` | `master.olga-marie.command-spell` | `command-spell.free-move` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `master.shinji` | `master.shinji.skill.clown` | `clown.lose-command-seal` | FORCED_TRIGGER | `after_controller_loses_battle` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `servant.achilles` | `servant.achilles.skill.sc-achilles-1` | `sc-achilles-1.achilles-heel` | FORCED_TRIGGER | `after_controller_loses_battle` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `servant.achilles` | `servant.achilles.skill.sc-achilles-1` | `sc-achilles-1.gale-advance` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `servant.achilles` | `servant.achilles.skill.sc-achilles-2` | `sc-achilles-2.blue-sky` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `servant.achilles` | `servant.achilles.skill.sc-achilles-3` | `sc-achilles-3.hero-duel` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.forbid-noble-phantasm-when-low-mana` | RESIDUAL | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.noble-bloom` | OPTIONAL_TRIGGER | `after_battle_result_determined` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.noble-bloom-extra-vp` | OPTIONAL_TRIGGER | `after_battle_result_determined` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.magic-resistance` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-1` | `sc-artoriac-1.return-current-round-attack` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-4` | `sc-artoriac-4.unique-passive-luck-on-win` | OPTIONAL_TRIGGER | `after_controller_wins_battle` | RESULT_EVENT_CONSUMER | `LEGACY_EXECUTE_ABILITY` |
| `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-5` | `sc-artoriac-5.unique-passive-luck-on-win` | OPTIONAL_TRIGGER | `after_controller_wins_battle` | RESULT_EVENT_CONSUMER | `LEGACY_EXECUTE_ABILITY` |
| `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-6` | `sc-artoriac-6.unique-passive-luck-on-win` | OPTIONAL_TRIGGER | `after_controller_wins_battle` | RESULT_EVENT_CONSUMER | `LEGACY_EXECUTE_ABILITY` |
| `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-6` | `sc-artoriac-6.gain-vp-if-not-sole-winner` | FORCED_TRIGGER | `after_battle_result_determined` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `servant.drake` | `servant.drake.skill.sc-drake-2` | `sc-drake-2.reward-and-move` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `servant.drake` | `servant.drake.skill.sc-drake-3` | `sc-drake-3.plunder` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-1` | `sc-ereshkigal-1.battle-continuation` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.netherworld-protection` | RESIDUAL | `on_card_played` | BATTLE_MODIFIER_EVENT | `LEGACY_RESOLVE_EFFECT` |
| `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.gain-mana-on-deploy` | FORCED_TRIGGER | `after_player_deployed_to_battlefield` | BATTLE_DEPLOY_EVENT | `LEGACY_RESOLVE_EFFECT` |
| `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.return-to-skill-zone` | FORCED_TRIGGER | `after_battle_ended` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-3` | `sc-kintoki-3.golden-eater` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `NOT_CLASSIFIABLE` |
| `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-1` | `sc-tomoe-1.penalty-on-defeat` | FORCED_TRIGGER | `after_controller_loses_battle` | RESULT_EVENT_CONSUMER | `LEGACY_RESOLVE_EFFECT` |
| `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-2` | `sc-tomoe-2.inferno-fire` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-2` | `sc-tomoe-2.double-terrain` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |
| `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-3` | `sc-tomoe-3.rain-of-fire` | PHASE_ACTION | - | BATTLE_STATE_OR_COMBAT_INTEGRATION | `LEGACY_RESOLVE_EFFECT` |

## Runtime Distribution

- `LEGACY_EXECUTE_ABILITY`: 3
- `LEGACY_RESOLVE_EFFECT`: 25
- `NEW_RUNTIME_SEMANTIC_ROUTED`: 3
- `NOT_CLASSIFIABLE`: 8

The runtime distribution is evidence only. TO-14 is a docs-first owner-contract task and does not promote or migrate any row.
