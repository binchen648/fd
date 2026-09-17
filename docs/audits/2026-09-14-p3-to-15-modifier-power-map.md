# P3-TO-15 Modifier / Power Authoritative Mapping

- Owner: Codex B, specification lane only
- Date: 2026-09-14
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`

## Denominator Contract

Two different inventories are retained intentionally:

```text
strict current modifier semantic-axis = 25 abilities / 18 cards
legacy planning power-risk set       = 18 abilities / 16 cards
```

The old mechanic-family value `MODIFIER 24 / 17 cards` is stale/incomplete relative to the corrected semantic-axis. Its only missing current modifier is `servant.ereshkigal.skill.sc-ereshkigal-3::sc-ereshkigal-3.blooming-netherworld`, whose current authored else branch contains `create_modifier(power_bonus +6)`.

The 18-row POWER set is retained as a **planning risk set**, not promoted to a semantic-axis denominator because the corrected semantic-axis artifact has no standalone POWER axis. All 18 historical rows still exist in current authoring/semantic evidence.

## Strict Modifier Map

| # | Archive | Card | Ability | Modifier axis | Power-risk member | Timing / event | Requirements | Lifecycle | Battle | Runtime route |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | `master.kayneth` | `master.kayneth.skill.double-master` | `double-master.passive` | `RULE_MODIFIER` | NO | `WHILE_ACTIVE` | NONE | NONE | NONE | `LEGACY_RESOLVE_EFFECT` |
| 2 | `master.maiya` | `master.maiya.deck.support-shot` | `support-shot.suppress` | `EFFECT_MODIFIER` | YES | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | `SOURCE_ACTIVE` | NONE | NONE | `NOT_CLASSIFIABLE` |
| 3 | `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.soul-drag` | `EFFECT_MODIFIER` | YES | `WHILE_ACTIVE` | `BATTLE_STATE` | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 4 | `servant.achilles` | `servant.achilles.skill.sc-achilles-1` | `sc-achilles-1.gale-advance` | `EFFECT_MODIFIER` | YES | `COMBAT`<br>`CONTROLLER_COMBAT_ACTION_WINDOW` | `BATTLE_STATE`<br>`SOURCE_ACTIVE` | NONE | `BATTLE_INTEGRATION` | `NOT_CLASSIFIABLE` |
| 5 | `servant.achilles` | `servant.achilles.skill.sc-achilles-2` | `sc-achilles-2.blue-sky` | `RULE_MODIFIER` | NO | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | `BATTLE_STATE`<br>`SOURCE_ACTIVE` | NONE | `BATTLE_INTEGRATION` | `NOT_CLASSIFIABLE` |
| 6 | `servant.achilles` | `servant.achilles.skill.sc-achilles-3` | `sc-achilles-3.hero-duel` | `RULE_MODIFIER` | YES | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | `BATTLE_STATE`<br>`LOCATION`<br>`SOURCE_ACTIVE` | NONE | `BATTLE_INTEGRATION` | `NOT_CLASSIFIABLE` |
| 7 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-1` | `sc-artoria-alt-1.ignore-situation-restrictions` | `RULE_MODIFIER` | NO | `WHEN_PLAY_REQUIREMENTS_CHECKED` | NONE | NONE | NONE | `NOT_CLASSIFIABLE` |
| 8 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-1` | `sc-artoria-alt-1.chain-of-wind-king` | `EFFECT_MODIFIER` | YES | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | `SOURCE_ACTIVE` | NONE | NONE | `NOT_CLASSIFIABLE` |
| 9 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.low-mana-play-override` | `RULE_MODIFIER` | NO | `WHEN_PLAY_REQUIREMENTS_CHECKED` | NONE | NONE | NONE | `NOT_CLASSIFIABLE` |
| 10 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-2` | `sc-artoria-alt-2.forbid-noble-phantasm-when-low-mana` | `RULE_MODIFIER` | NO | `WHILE_ACTIVE` | `BATTLE_STATE`<br>`LOCATION`<br>`MANA` | NONE | `BATTLE_INTEGRATION` | `NOT_CLASSIFIABLE` |
| 11 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.magic-resistance` | `RULE_MODIFIER` | YES | `COMBAT`<br>`CONTROLLER_COMBAT_ACTION_WINDOW` | `BATTLE_STATE`<br>`LOCATION`<br>`SOURCE_ACTIVE` | NONE | `BATTLE_INTEGRATION` | `NOT_CLASSIFIABLE` |
| 12 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-1` | `sc-artoriac-1.residual-special-power-bonus` | `RULE_MODIFIER` | YES | `IMMEDIATE`<br>`on_card_played` | NONE | `lifecycle:cleanup:expire_after_duration`<br>`lifecycle:duration:round_count`<br>`lifecycle:rounds:2`<br>`lifecycle:starts:immediate` | NONE | `NOT_CLASSIFIABLE` |
| 13 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-3` | `sc-artoriac-3.discard-public-and-power-formula` | `RULE_MODIFIER` | NO | `IMMEDIATE`<br>`on_card_played` | NONE | `lifecycle:cleanup:when_card_leaves_active_area`<br>`lifecycle:duration:while_card_active`<br>`lifecycle:starts:immediate` | NONE | `NOT_CLASSIFIABLE` |
| 14 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-3` | `sc-artoriac-3.shuffle-discard-on-victory` | `RULE_MODIFIER` | NO | `IMMEDIATE`<br>`after_controller_gains_victory` | `SOURCE_ACTIVE` | NONE | NONE | `NOT_CLASSIFIABLE` |
| 15 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.netherworld-protection` | `EFFECT_MODIFIER` | YES | `IMMEDIATE`<br>`on_card_played` | `BATTLE_STATE`<br>`LOCATION` | `lifecycle:cleanup:remain_active`<br>`lifecycle:duration:while_card_active`<br>`lifecycle:starts:immediate` | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 16 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.self-exempt` | `RULE_MODIFIER` | YES | `WHEN_POWER_CALCULATION_APPLIED` | NONE | NONE | NONE | `NOT_CLASSIFIABLE` |
| 17 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-3` | `sc-ereshkigal-3.blooming-netherworld` | `EFFECT_MODIFIER` | YES | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | `LOCATION`<br>`SOURCE_ACTIVE` | NONE | NONE | `NOT_CLASSIFIABLE` |
| 18 | `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-1` | `sc-kintoki-1.ignore-skill-zone-mana-requirement` | `RULE_MODIFIER` | NO | `WHEN_PLAY_REQUIREMENTS_CHECKED` | NONE | NONE | NONE | `NOT_CLASSIFIABLE` |
| 19 | `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-1` | `sc-kintoki-1.ignore-situation-play-forbid` | `RULE_MODIFIER` | NO | `WHEN_PLAY_REQUIREMENTS_CHECKED` | NONE | NONE | NONE | `NOT_CLASSIFIABLE` |
| 20 | `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-2` | `sc-kintoki-2.ignore-skill-zone-mana-requirement` | `RULE_MODIFIER` | NO | `WHEN_PLAY_REQUIREMENTS_CHECKED` | NONE | NONE | NONE | `NOT_CLASSIFIABLE` |
| 21 | `servant.kintoki` | `servant.kintoki.skill.sc-kintoki-2` | `sc-kintoki-2.ignore-situation-play-forbid` | `RULE_MODIFIER` | NO | `WHEN_PLAY_REQUIREMENTS_CHECKED` | NONE | NONE | NONE | `NOT_CLASSIFIABLE` |
| 22 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-1` | `sc-tomoe-1.penalty-on-defeat` | `RULE_MODIFIER` | NO | `after_controller_loses_battle` | `BATTLE_STATE` | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 23 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-2` | `sc-tomoe-2.inferno-fire` | `EFFECT_MODIFIER` | YES | `ACTION`<br>`CONTROLLER_ACTION_WINDOW` | `BATTLE_STATE`<br>`LOCATION`<br>`SOURCE_ACTIVE` | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 24 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-2` | `sc-tomoe-2.double-terrain` | `EFFECT_MODIFIER` | YES | `COMBAT`<br>`CONTROLLER_COMBAT_ACTION_WINDOW` | `BATTLE_STATE`<br>`SOURCE_ACTIVE` | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |
| 25 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-3` | `sc-tomoe-3.rain-of-fire` | `EFFECT_MODIFIER` | YES | `COMBAT`<br>`CONTROLLER_COMBAT_ACTION_WINDOW` | `BATTLE_STATE`<br>`LOCATION`<br>`SOURCE_ACTIVE` | NONE | `BATTLE_INTEGRATION` | `LEGACY_RESOLVE_EFFECT` |

## Power-Risk Planning Map

| # | Archive | Card | Ability | Old family evidence | Current modifier member | Current runtime route |
|---:|---|---|---|---|---|---|
| 1 | `master.gatou` | `master.gatou.command-spell` | `command-spell.power-victory` | `record_master_directive, adjust_command_seals` | NO | `LEGACY_RESOLVE_EFFECT` |
| 2 | `master.kayneth` | `master.kayneth.deck.volumen-hydrargyrum` | `volumen.slash` | `none` | NO | `NOT_CLASSIFIABLE` |
| 3 | `master.kiritsugu` | `master.kiritsugu.deck.origin-bullet` | `origin-bullet.cut-bind` | `record_master_directive` | NO | `LEGACY_RESOLVE_EFFECT` |
| 4 | `master.maiya` | `master.maiya.deck.support-shot` | `support-shot.suppress` | `terrain_multiplier, transfer_vp_to_owner` | YES | `NOT_CLASSIFIABLE` |
| 5 | `master.olga-marie` | `master.olga-marie.skill.trismegistus-grief` | `trismegistus.soul-drag` | `soul_drag_power_bonus` | YES | `LEGACY_RESOLVE_EFFECT` |
| 6 | `master.olga-marie` | `master.olga-marie.command-spell` | `command-spell.power-victory` | `record_master_directive, adjust_command_seals` | NO | `LEGACY_RESOLVE_EFFECT` |
| 7 | `servant.achilles` | `servant.achilles.skill.sc-achilles-1` | `sc-achilles-1.gale-advance` | `opponents_random_discard, set_opponent_power_to_zero` | YES | `NOT_CLASSIFIABLE` |
| 8 | `servant.achilles` | `servant.achilles.skill.sc-achilles-3` | `sc-achilles-3.hero-duel` | `none` | YES | `NOT_CLASSIFIABLE` |
| 9 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-1` | `sc-artoria-alt-1.chain-of-wind-king` | `create_modifier` | YES | `NOT_CLASSIFIABLE` |
| 10 | `servant.artoria-alt` | `servant.artoria-alt.skill.sc-artoria-alt-3` | `sc-artoria-alt-3.magic-resistance` | `none` | YES | `NOT_CLASSIFIABLE` |
| 11 | `servant.artoriac` | `servant.artoriac.skill.sc-artoriac-1` | `sc-artoriac-1.residual-special-power-bonus` | `none` | YES | `NOT_CLASSIFIABLE` |
| 12 | `servant.drake` | `servant.drake.skill.sc-drake-1` | `sc-drake-1.mount-summon` | `play_selected_cards` | NO | `LEGACY_RESOLVE_EFFECT` |
| 13 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.netherworld-protection` | `reverse_situation_and_event_power_modifiers` | YES | `LEGACY_RESOLVE_EFFECT` |
| 14 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-2` | `sc-ereshkigal-2.self-exempt` | `none` | YES | `NOT_CLASSIFIABLE` |
| 15 | `servant.ereshkigal` | `servant.ereshkigal.skill.sc-ereshkigal-3` | `sc-ereshkigal-3.blooming-netherworld` | `branch` | YES | `NOT_CLASSIFIABLE` |
| 16 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-2` | `sc-tomoe-2.inferno-fire` | `create_status` | YES | `LEGACY_RESOLVE_EFFECT` |
| 17 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-2` | `sc-tomoe-2.double-terrain` | `create_modifier` | YES | `LEGACY_RESOLVE_EFFECT` |
| 18 | `servant.tomoe` | `servant.tomoe.skill.sc-tomoe-3` | `sc-tomoe-3.rain-of-fire` | `reduce_opponents_power` | YES | `LEGACY_RESOLVE_EFFECT` |

## Mapping Rules

- The 25 modifier rows are the current authoritative semantic-axis denominator.
- The 18 power-risk rows are a planning set used to ensure power-trace coverage; they must not be reported as a current generated semantic-axis count.
- Membership overlap is expected: some modifiers affect play legality, prevention, movement, or other rules rather than numeric power.
- Conversely, some power-risk rows are not current modifier-axis rows because they affect power through formulas, directives, play selection, or other legacy paths.
- Card/ability IDs are evidence identity only and are forbidden as generic runtime routing criteria.
- Runtime acceptance for any row remains separate from this mapping.
