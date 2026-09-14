# FD Full-Roster Semantic Axis Matrix

- Document Role: AUDIT
- Status: PHASE_3_FS03_NORMALIZED
- Authority: V2 structured authoring is canonical only when source-aligned; Reference handler shape is observed behavior only.
- Interaction Policy: interaction is derived only from explicit structured interaction fields/effects, never timing or printed wording.

totalIdentityCount=944
sourceGroundedCount=129
blockedCount=815
unclassifiedCount=0
structuredAbilityCount=210

## Axis Value Counts

| Axis | Value | Identity Count |
|---|---|---:|
| timing | `ACTION` | 40 |
| timing | `COMBAT` | 17 |
| timing | `OUTPOST` | 4 |
| timing | `PREPARATION` | 2 |
| trigger | `combat.resolved` | 26 |
| trigger | `card.played` | 7 |
| trigger | `combat.ending` | 7 |
| trigger | `game.started` | 5 |
| trigger | `player.entered-location` | 5 |
| trigger | `round.started` | 4 |
| trigger | `combat.power-calculated` | 3 |
| trigger | `player.moved` | 3 |
| trigger | `round.ended` | 3 |
| trigger | `round.ending` | 3 |
| trigger | `cycle_state.entered` | 2 |
| trigger | `player.defeated` | 2 |
| trigger | `player.mana.changed` | 2 |
| trigger | `card.exiled` | 1 |
| trigger | `card_or_ability.used` | 1 |
| trigger | `command-seal.spent` | 1 |
| trigger | `event.revealed` | 1 |
| trigger | `player.deployed` | 1 |
| trigger | `player.victory-points.changed` | 1 |
| trigger | `servant.true-name-revealed` | 1 |
| trigger | `skill.used` | 1 |
| condition | `SOURCE_ACTIVE` | 37 |
| condition | `SOURCE_OWNED` | 30 |
| condition | `EVENT_PLAYER_WON_COMBAT` | 17 |
| condition | `EVENT_PLAYER_IS_CONTROLLER` | 14 |
| condition | `EVENT_LOCATION_EQUALS_CONTROLLER` | 11 |
| condition | `AT_BATTLEFIELD` | 10 |
| condition | `EVENT_DEFINITION_IS_SELF` | 8 |
| condition | `EVENT_PLAYER_IS_OPPONENT` | 8 |
| condition | `METRIC` | 7 |
| condition | `EVENT_PLAYER_LOST_COMBAT` | 6 |
| condition | `METRIC_COMPARE` | 6 |
| condition | `EVENT_COUNT_AT_LEAST` | 5 |
| condition | `TARGET_COUNT_AT_LEAST` | 5 |
| condition | `EVENT_FACE_IS` | 4 |
| condition | `PLAYER_FLAG_NUMBER_CURRENT_ROUND` | 4 |
| condition | `COMBAT_OCCURS_AT_SOURCE_EVENT_BATTLEFIELD` | 3 |
| condition | `PLAYER_FLAG_NUMBER_NOT_CURRENT_ROUND` | 3 |
| condition | `CARD_COUNT_AT_LEAST` | 2 |
| condition | `COMMAND_SEALS_AT_LEAST` | 2 |
| condition | `CONSTANT` | 2 |
| condition | `CYCLE_STATE_IS_NOT` | 2 |
| condition | `EVENT_DEFINITION_IS` | 2 |
| condition | `EVENT_LOCATION_IS` | 2 |
| condition | `EVENT_NUMBER_COMPARE` | 2 |
| condition | `PLAYER_IS_WODIME_OPPONENT` | 2 |
| condition | `ACTIVE_SITUATION_PROHIBITS_NOBLE_PHANTASM_USE` | 1 |
| condition | `ANY_OF` | 1 |
| condition | `COMBAT_HAS_OTHER_PLAYER_WITH_LOWER_VICTORY_POINTS` | 1 |
| condition | `CONTROLLER_AT_UNDEPLOYED_BATTLEFIELD` | 1 |
| condition | `CYCLE_TRANSITION_PENDING` | 1 |
| condition | `DOES_NOT_CONTROL_CARD_DEFINITION` | 1 |
| condition | `ENGAGED_OPPONENT_VICTORY_POINTS_GREATER_THAN_CONTROLLER` | 1 |
| condition | `EVENT_CARD_HAS_ATTRIBUTE` | 1 |
| condition | `EVENT_COMBAT_HAS_ATTRIBUTE` | 1 |
| condition | `EVENT_COMBAT_OPPONENT_COUNT_EQUALS` | 1 |
| condition | `EVENT_HAS_LOSTBELT_TAG` | 1 |
| condition | `EVENT_LOCATION_NOT` | 1 |
| condition | `EVENT_LOCATION_NOT_CONTROLLER` | 1 |
| condition | `EVENT_OPPONENT_MATCHES_BOUND_TARGET` | 1 |
| condition | `EVENT_ROUND_VICTORY_POINTS_GAIN_CROSSES` | 1 |
| condition | `EVENT_SCOUTING_REWARDED_CONTROLLER` | 1 |
| condition | `EVENT_SKILL_ID_IS` | 1 |
| condition | `FORMULA` | 1 |
| condition | `HAS_STATUS` | 1 |
| condition | `IMPLIES` | 1 |
| condition | `LOCATION_IS` | 1 |
| condition | `PHASE_IS` | 1 |
| condition | `PLAYER_COMMAND_SEALS_SPENT_THIS_ROUND_EQUALS` | 1 |
| condition | `PLAYER_DEPLOYED_TO_SOURCE_EVENT_BATTLEFIELD_DURING` | 1 |
| condition | `PLAYER_FLAG_EQUALS` | 1 |
| condition | `PLAYER_FLAG_IS` | 1 |
| condition | `PLAYER_FLAG_NUMBER_EQUALS_EVENT_FIELD` | 1 |
| condition | `PLAYER_POWER_BELOW` | 1 |
| condition | `ROUND_IS_CLIMAX` | 1 |
| condition | `ROUND_NUMBER_EQUALS` | 1 |
| condition | `ROUND_VICTORY_POINTS_GAINED_EQUALS` | 1 |
| condition | `SCHEDULED_PAYLOAD_PRESENT` | 1 |
| condition | `SECRET_ROUND_MATCHES_CURRENT` | 1 |
| condition | `SITUATION_FORBIDS_ATTRIBUTE` | 1 |
| condition | `TARGET_COUNT_EQUALS` | 1 |
| condition | `TRANSCEND_OUTPOST_SWITCH_USED_THIS_ROUND` | 1 |
| condition | `TRANSCEND_SECOND_SWITCH_USED_THIS_ROUND` | 1 |
| condition | `TRUE_NAME_REVEALED` | 1 |
| condition | `VICTORY_POINTS_IS_FIRST` | 1 |
| condition | `VICTORY_POINTS_IS_LOWEST` | 1 |
| cost | `MANA` | 6 |
| cost | `DISCARD_CARDS` | 1 |
| cost | `VICTORY_POINTS` | 1 |
| target | `CHOOSE_ONE_CARD` | 12 |
| target | `BRANCH_CHOICE` | 6 |
| target | `CHOOSE_N_CARDS` | 6 |
| target | `CHOOSE_ONE_PLAYER` | 6 |
| target | `CHOOSE_ONE_EVENT` | 5 |
| target | `CHOOSE_ONE_LOCATION` | 5 |
| target | `CHOOSE_NUMBER` | 3 |
| target | `CHOOSE_EACH_PLAYER_OPTION` | 2 |
| target | `CHOOSE_EACH_PLAYER_CARDS` | 1 |
| target | `CHOOSE_N_EVENTS` | 1 |
| effect | `GAIN_VICTORY_POINTS` | 17 |
| effect | `EVENT_CARD_RULE` | 12 |
| effect | `CLOSE_SOURCE_CARD` | 11 |
| effect | `COMBAT_POWER_BONUS` | 10 |
| effect | `CYCLE_STATE_TRANSITION` | 9 |
| effect | `DEFEAT_PLAYER` | 8 |
| effect | `GAIN_MANA` | 8 |
| effect | `LOSE_VICTORY_POINTS` | 8 |
| effect | `PLAY_SELECTED_CARDS` | 8 |
| effect | `SET_PLAYER_FLAG` | 8 |
| effect | `DRAW_CARDS` | 7 |
| effect | `IF_CONDITION` | 7 |
| effect | `SOURCE_CARD_POWER_BONUS` | 7 |
| effect | `LOSE_MANA` | 5 |
| effect | `LOSTBELT_EXPANSION` | 5 |
| effect | `RETURN_CARD_BY_DEFINITION` | 5 |
| effect | `ADD_STATUS` | 4 |
| effect | `MOVE_SELECTED_CARDS` | 4 |
| effect | `CLEAR_PLAYER_FLAG` | 3 |
| effect | `EXILE_SOURCE_CARD` | 3 |
| effect | `MOVE_MATCHING_EVENTS` | 3 |
| effect | `MOVE_PLAYER` | 3 |
| effect | `MOVE_SELECTED_EVENTS` | 3 |
| effect | `MOVE_SOURCE_CARD` | 3 |
| effect | `SCHEDULE_EFFECT` | 3 |
| effect | `INSTALL_ABILITY_RULE_MODIFIER` | 2 |
| effect | `REMOVE_STATUS` | 2 |
| effect | `SECRET_ROUND_BINDING` | 2 |
| effect | `TRANSFER_VICTORY_POINTS` | 2 |
| effect | `ADD_LINKED_STATUS` | 1 |
| effect | `ADD_PLAYER_FLAG_NUMBER` | 1 |
| effect | `ADJUST_COMMAND_SEALS` | 1 |
| effect | `ASTRONOMICAL_SPHERE_RULE` | 1 |
| effect | `CLOSE_SELECTED_CARD` | 1 |
| effect | `COMBAT_POWER_LOCK` | 1 |
| effect | `ENSURE_EVENT_DECK_COUNT` | 1 |
| effect | `INFO_NOTE` | 1 |
| effect | `LOCATION_TOKEN_RULE` | 1 |
| effect | `LOSE_VICTORY_POINTS_PER_MATCHING_CARDS` | 1 |
| effect | `MOVE_CARD` | 1 |
| effect | `MOVE_MATCHING_CARDS` | 1 |
| effect | `PLAY_SOURCE_CARD` | 1 |
| effect | `REMOVE_CARDS_IN_ZONE` | 1 |
| effect | `REMOVE_LINKED_STATUS` | 1 |
| effect | `REMOVE_OWNED_CARDS_BY_LINKED_SKILL` | 1 |
| effect | `REPLACE_SELECTED_EVENT_FROM_DECK` | 1 |
| effect | `RESET_SKILL_USAGE` | 1 |
| effect | `RETRIGGER_CARD_PLAY_EFFECTS` | 1 |
| effect | `SEQUESTER_RANDOM_INACTIVE_SERVANT_SKILL` | 1 |
| effect | `SET_MANA` | 1 |
| effect | `SET_SELECTED_CARDS_FACE` | 1 |
| effect | `SHUFFLE_EVENT_DECK` | 1 |
| effect | `SWAP_SELECTED_EVENT_LOCATIONS` | 1 |
| effect | `TERRAIN_POSITION_ADJUSTMENT` | 1 |
| effect | `TRANSFER_MANA` | 1 |
| effect | `TRANSFER_MATCHING_CARDS` | 1 |
| effect | `TRANSFER_SELECTED_CARDS` | 1 |
| interaction | `CHOOSE_ONE_CARD` | 12 |
| interaction | `BRANCH_CHOICE` | 6 |
| interaction | `CHOOSE_N_CARDS` | 6 |
| interaction | `CHOOSE_ONE_PLAYER` | 6 |
| interaction | `CHOOSE_ONE_EVENT` | 5 |
| interaction | `CHOOSE_ONE_LOCATION` | 5 |
| interaction | `CHOOSE_NUMBER` | 3 |
| interaction | `CHOOSE_EACH_PLAYER_OPTION` | 2 |
| interaction | `CHOOSE_EACH_PLAYER_CARDS` | 1 |
| interaction | `CHOOSE_N_EVENTS` | 1 |
| lifecycle | `duration:while_active` | 19 |
| lifecycle | `cleanup:remain_active` | 14 |
| lifecycle | `duration:this_round` | 13 |
| lifecycle | `duration:permanent` | 7 |
| lifecycle | `starts:immediate` | 7 |
| lifecycle | `duration:until_card_closed` | 2 |
| lifecycle | `duration:until_condition_met` | 2 |
| lifecycle | `duration:until_round_end` | 2 |
| lifecycle | `limit.scope:controller` | 2 |
| lifecycle | `cleanup:clear_bound_target` | 1 |
| lifecycle | `cleanup:remove_from_game` | 1 |
| lifecycle | `cleanup:restore_base_pairs` | 1 |
| lifecycle | `duration:until_next_preparation` | 1 |
| lifecycle | `duration:until_triggered` | 1 |
| lifecycle | `expires:round_end` | 1 |
| lifecycle | `expiresOn:card.exiled` | 1 |
| lifecycle | `expiresOn:combat.win` | 1 |
| lifecycle | `expiresOn:master.akasha.reincarnation` | 1 |
| lifecycle | `limit.maxUses:1` | 1 |
| lifecycle | `limit.maxUses:2` | 1 |
| lifecycle | `limit.period:game` | 1 |
| lifecycle | `limit.period:round` | 1 |
| lifecycle | `limit:once_per_game` | 1 |
| modifier | `effect:combat_power_bonus` | 10 |
| modifier | `effect:source_card_power_bonus` | 7 |
| modifier | `rule:skill_use:forbid` | 5 |
| modifier | `rule:card_power:add` | 4 |
| modifier | `rule:defeat:ignore` | 3 |
| modifier | `rule:total_power:add` | 3 |
| modifier | `rule:card_cost:add` | 2 |
| modifier | `rule:card_play_mode:require_additional_play` | 2 |
| modifier | `rule:card_power:set` | 2 |
| modifier | `rule:combat_power:add` | 2 |
| modifier | `rule:combat_reward_distribution:replace` | 2 |
| modifier | `rule:movement_destinations:forbid` | 2 |
| modifier | `rule:ability_use_limit:set` | 1 |
| modifier | `rule:card_ability_move_direction:allow` | 1 |
| modifier | `rule:card_activation_persistence:remain_active_until` | 1 |
| modifier | `rule:card_base_power:add` | 1 |
| modifier | `rule:card_close:forbid` | 1 |
| modifier | `rule:card_draw:forbid` | 1 |
| modifier | `rule:card_entry_method:restrict_to_this_ability` | 1 |
| modifier | `rule:card_play:forbid` | 1 |
| modifier | `rule:card_play_limit:ignore_once_per_game` | 1 |
| modifier | `rule:card_play_limit:remove_once_per_game` | 1 |
| modifier | `rule:card_play_mana_requirement:ignore` | 1 |
| modifier | `rule:card_play_mana_requirement:ignore_below_threshold` | 1 |
| modifier | `rule:card_play_with_others:forbid` | 1 |
| modifier | `rule:combat_attack_power_increase_from_other_cards:prohibit` | 1 |
| modifier | `rule:combat_power_resolution:ignore_other_controller_attacks` | 1 |
| modifier | `rule:combat_skill_card_power:increase` | 1 |
| modifier | `rule:combat_winner_inclusion:allow` | 1 |
| modifier | `rule:controller_master_skill_power:set_and_lock` | 1 |
| modifier | `rule:defeat_immunity:disable` | 1 |
| modifier | `rule:deployment_advantage:add` | 1 |
| modifier | `rule:deployment_advantage:multiply` | 1 |
| modifier | `rule:deployment_destinations:replace` | 1 |
| modifier | `rule:deployment_resource_gain:forbid` | 1 |
| modifier | `rule:elimination:replace` | 1 |
| modifier | `rule:face_up_cards_per_round:set` | 1 |
| modifier | `rule:mana_spending:forbid` | 1 |
| modifier | `rule:movement_cost:subtract` | 1 |
| modifier | `rule:movement_permission:prohibit` | 1 |
| modifier | `rule:non_effect_victory_point_gain:forbid` | 1 |
| modifier | `rule:round_mana_gain_cap:set_by_round_kind` | 1 |
| modifier | `rule:scrambled_seal_type:replace` | 1 |
| modifier | `rule:situation_card_play:ignore` | 1 |
| modifier | `rule:situation_mana_gain:forbid` | 1 |
| modifier | `rule:situation_power_bonus:forbid` | 1 |
| modifier | `rule:skill_use_limit:set_unlimited` | 1 |
| modifier | `rule:standard_attack_card_count:replace` | 1 |
| visibility | `REVEALS_TRUE_NAME` | 28 |
| visibility | `revealScope:servant_package` | 28 |
| visibility | `revealTiming:on_use_declared` | 28 |
| visibility | `FACE_UP` | 8 |
| visibility | `FACE_DOWN` | 2 |
| binding | `payload:selectedInstanceIds` | 13 |
| binding | `payload:selectedEventIds` | 3 |
| binding | `payload:selectedBeastIds` | 2 |
| binding | `payload:targetLocationId` | 2 |
| binding | `payload:x` | 2 |
| binding | `result:discardedCount` | 2 |
| binding | `binding:discardedCount` | 1 |
| binding | `binding:fullRecoveryTranscendChoice` | 1 |
| binding | `binding:removedEventCount` | 1 |
| binding | `payload:attackInstanceIds` | 1 |
| binding | `payload:closedAttackIds` | 1 |
| binding | `payload:discardBeastIds` | 1 |
| binding | `payload:discardedEventIds` | 1 |
| binding | `payload:fullRecoveryTranscendChoice` | 1 |
| binding | `payload:keptInstanceIds` | 1 |
| binding | `payload:pairIndex` | 1 |
| binding | `payload:replacementEventIds` | 1 |
| binding | `payload:selectedPlayerIds` | 1 |
| binding | `payload:targetPlayerId` | 1 |
| binding | `payload:targetSkillInstanceIds` | 1 |
| binding | `payload:twiceReplaceEventIds` | 1 |
| binding | `payload:twiceSwapEventIds` | 1 |
| binding | `result:fullRecoveryTranscendChoice` | 1 |
| binding | `result:removedEventCount` | 1 |
| battle | `COMBAT_CONDITION` | 38 |
| battle | `COMBAT_EVENT` | 36 |
| battle | `COMBAT_EFFECT` | 11 |
| battle | `COMBAT_RULE_MODIFIER` | 10 |

## Identity-Level Matrix

| Canonical Ability | Status | Blocks | Timing | Trigger | Condition | Cost | Target | Effect | Interaction | Lifecycle | Modifier | Visibility | Binding | Battle | Observed Handler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `master.akasha.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akasha-reincarnation` |
| `master.akasha.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `game.started` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `cleanup:remain_active`, `duration:until_condition_met`, `expiresOn:master.akasha.reincarnation` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.akasha.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akasha-reincarnation` |
| `master.akasha.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akasha-reincarnation` |
| `master.akasha.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akasha-reincarnation` |
| `master.akasha.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akasha-reincarnation` |
| `master.akasha.skill.s5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akasha-reincarnation` |
| `master.akasha.skill.s6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akasha-reincarnation` |
| `master.akiha.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akiha-bloodlust` |
| `master.akiha.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akiha-bloodlust` |
| `master.akiha.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akiha-bloodlust` |
| `master.akiha.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akiha-bloodlust` |
| `master.akiha.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.akiha-bloodlust` |
| `master.alice.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alice-phantom-player` |
| `master.alice.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alice-phantom-player` |
| `master.alice.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alice-phantom-player` |
| `master.amakusa.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.amakusa-past-ruler` |
| `master.amakusa.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `game.started` | `SOURCE_OWNED` | `NONE` | `NONE` | `ADD_STATUS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.amakusa.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_CARD` | `INSTALL_ABILITY_RULE_MODIFIER`, `REMOVE_STATUS` | `CHOOSE_ONE_CARD` | `cleanup:remove_from_game`, `duration:this_round` | `rule:skill_use:forbid` | `FACE_UP` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `master.amakusa.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `round.started` | `COMMAND_SEALS_AT_LEAST`, `FORMULA`, `HAS_STATUS`, `METRIC`, `SCHEDULED_PAYLOAD_PRESENT`, `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_PLAYER` | `ADD_STATUS` | `CHOOSE_ONE_PLAYER` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.amakusa.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.amakusa-vassal` |
| `master.araya.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.araya-paradox-spiral` |
| `master.araya.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.araya-triple-boundary` |
| `master.araya.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.ending` | `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_CARD` | `GAIN_MANA`, `MOVE_SELECTED_CARDS` | `CHOOSE_ONE_CARD` | `NONE` | `NONE` | `NONE` | `payload:selectedInstanceIds` | `COMBAT_EVENT` | `core.structured-skill` |
| `master.arcueid.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.arcueid.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `game.started`, `skill.used` | `EVENT_SKILL_ID_IS` | `NONE` | `NONE` | `RESET_SKILL_USAGE`, `RETURN_CARD_BY_DEFINITION` | `NONE` | `NONE` | `NONE` | `FACE_UP` | `NONE` | `NONE` | `core.structured-skill` |
| `master.arcueid.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `OUTPOST` | `combat.resolved` | `EVENT_PLAYER_WON_COMBAT`, `PLAYER_FLAG_EQUALS`, `SOURCE_OWNED`, `TARGET_COUNT_AT_LEAST` | `NONE` | `CHOOSE_ONE_PLAYER` | `CLEAR_PLAYER_FLAG`, `REMOVE_OWNED_CARDS_BY_LINKED_SKILL`, `SET_PLAYER_FLAG` | `CHOOSE_ONE_PLAYER` | `cleanup:remain_active`, `duration:until_condition_met`, `expiresOn:combat.win` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `master.arcueid.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arcueid-materialization` |
| `master.arcueid.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `round.ending` | `SOURCE_OWNED` | `NONE` | `NONE` | `LOSE_VICTORY_POINTS` | `NONE` | `NONE` | `rule:card_cost:add`, `rule:card_power:add`, `rule:skill_use:forbid` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.artoira.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoira-wooden-sword` |
| `master.artoira.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoira-charge` |
| `master.bazett.skill.ascension` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:card_activation_persistence:remain_active_until`, `rule:card_play_limit:remove_once_per_game` | `NONE` | `NONE` | `NONE` | `core.bazett-flawless-defense` |
| `master.bazett.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.bazett.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved`, `game.started`, `round.ended` | `CYCLE_STATE_IS_NOT`, `EVENT_PLAYER_LOST_COMBAT`, `ROUND_IS_CLIMAX` | `NONE` | `NONE` | `CYCLE_STATE_TRANSITION`, `LOSE_VICTORY_POINTS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.bazett-time-loop` |
| `master.bazett.skill.s1b` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:while_active` | `rule:total_power:add` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.bazett.skill.s1c` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `GAIN_VICTORY_POINTS` | `NONE` | `duration:while_active` | `rule:card_play_limit:ignore_once_per_game`, `rule:card_play_mana_requirement:ignore` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.bazett-time-loop` |
| `master.bazett.skill.s1d` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved`, `round.ended` | `CYCLE_STATE_IS_NOT`, `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `CYCLE_STATE_TRANSITION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.bazett-time-loop` |
| `master.bazett.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card_or_ability.used` | `EVENT_CARD_HAS_ATTRIBUTE`, `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_IS_OPPONENT`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `DEFEAT_PLAYER` | `NONE` | `duration:until_triggered`, `limit:once_per_game` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bazett-fragarach` |
| `master.bazett.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `round.started` | `CYCLE_TRANSITION_PENDING` | `NONE` | `NONE` | `CYCLE_STATE_TRANSITION`, `GAIN_VICTORY_POINTS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bazett-time-loop` |
| `master.bazett.skill.s4` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `ADJUST_COMMAND_SEALS`, `CYCLE_STATE_TRANSITION`, `RETURN_CARD_BY_DEFINITION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bazett-time-loop` |
| `master.bazett.skill.s5` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `combat.resolved` | `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `CYCLE_STATE_TRANSITION`, `GAIN_VICTORY_POINTS`, `MOVE_CARD` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.bazett-third-day` |
| `master.caren.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caren-valentinus` |
| `master.caren.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caren-spirit-medium` |
| `master.caren.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caren-gain-shroud` |
| `master.caren.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caren-spiritual-masochism` |
| `master.caren.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caren-shroud-magdalene` |
| `master.caules-yggdmillennia.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caules-yggdmillennia-last-narrator` |
| `master.caules-yggdmillennia.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.caules-yggdmillennia.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.caules-yggdmillennia.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.caules-yggdmillennia.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caules-yggdmillennia-thunder` |
| `master.caules.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caules-forvedge-enhanced-circuits` |
| `master.caules.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caules-forvedge-bioelectromancer` |
| `master.caules.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.caules.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caules-forvedge-primeval-battery` |
| `master.caules.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caules-forvedge-crafted-tree` |
| `master.celenike.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.celenike-iron-stake` |
| `master.celenike.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.celenike-curse` |
| `master.celenike.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.round-end-resource-adjustment` |
| `master.chaos.skill.ascension` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `MANA` | `NONE` | `DRAW_CARDS` | `NONE` | `NONE` | `rule:skill_use_limit:set_unlimited` | `NONE` | `NONE` | `NONE` | `core.chaos-beast-engine` |
| `master.chaos.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `OUTPOST` | `player.mana.changed` | `EVENT_NUMBER_COMPARE`, `EVENT_PLAYER_IS_CONTROLLER` | `DISCARD_CARDS` | `CHOOSE_ONE_CARD` | `ADD_STATUS`, `DRAW_CARDS`, `PLAY_SELECTED_CARDS` | `CHOOSE_ONE_CARD` | `duration:permanent` | `NONE` | `NONE` | `payload:selectedBeastIds` | `NONE` | `core.chaos-beast-engine` |
| `master.chaos.skill.s10` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:deployment_advantage:multiply` | `NONE` | `NONE` | `NONE` | `core.double-deployment-bonus` |
| `master.chaos.skill.s11` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `command-seal.spent` | `EVENT_PLAYER_IS_CONTROLLER`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD` | `NONE` | `duration:while_active` | `rule:scrambled_seal_type:replace` | `NONE` | `NONE` | `NONE` | `core.chaos-beast-engine` |
| `master.chaos.skill.s12` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `NONE` | `CHOOSE_NUMBER` | `MOVE_PLAYER`, `SOURCE_CARD_POWER_BONUS` | `CHOOSE_NUMBER` | `NONE` | `effect:source_card_power_bonus` | `NONE` | `payload:x` | `NONE` | `core.structured-skill` |
| `master.chaos.skill.s13` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `NONE` | `CHOOSE_NUMBER`, `CHOOSE_ONE_EVENT` | `MOVE_SELECTED_EVENTS` | `CHOOSE_NUMBER`, `CHOOSE_ONE_EVENT` | `NONE` | `NONE` | `NONE` | `payload:selectedEventIds`, `payload:x` | `NONE` | `core.structured-skill` |
| `master.chaos.skill.s14` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:card_power:add` | `NONE` | `NONE` | `NONE` | `core.chaos-phantom` |
| `master.chaos.skill.s15` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:total_power:add` | `NONE` | `NONE` | `NONE` | `core.same-battlefield-opponent-power` |
| `master.chaos.skill.s16` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card.played` | `EVENT_DEFINITION_IS_SELF`, `EVENT_PLAYER_IS_CONTROLLER` | `NONE` | `NONE` | `MOVE_MATCHING_CARDS`, `SOURCE_CARD_POWER_BONUS` | `NONE` | `NONE` | `effect:source_card_power_bonus` | `NONE` | `binding:discardedCount`, `result:discardedCount` | `NONE` | `core.chaos-beast-engine` |
| `master.chaos.skill.s17` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.chaos-beast-engine` |
| `master.chaos.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_POWER_BONUS` | `NONE` | `NONE` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_EFFECT` | `core.chaos-hunter` |
| `master.chaos.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `NONE` | `CHOOSE_N_CARDS` | `GAIN_MANA`, `MOVE_SELECTED_CARDS` | `CHOOSE_N_CARDS` | `NONE` | `NONE` | `NONE` | `payload:selectedBeastIds`, `result:discardedCount` | `NONE` | `core.chaos-beast-engine` |
| `master.chaos.skill.s4` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card.played` | `EVENT_DEFINITION_IS_SELF`, `EVENT_PLAYER_IS_CONTROLLER` | `NONE` | `CHOOSE_N_CARDS` | `DRAW_CARDS`, `MOVE_SELECTED_CARDS`, `SCHEDULE_EFFECT` | `CHOOSE_N_CARDS` | `duration:until_next_preparation` | `NONE` | `NONE` | `payload:discardBeastIds` | `NONE` | `core.chaos-beast-engine` |
| `master.chaos.skill.s5` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `player.entered-location` | `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_IS_OPPONENT` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:this_round` | `rule:total_power:add` | `NONE` | `NONE` | `NONE` | `core.chaos-shadow-trap` |
| `master.chaos.skill.s6` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_PLAYER_LOST_COMBAT` | `NONE` | `NONE` | `DRAW_CARDS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.chaos-beast-engine` |
| `master.chaos.skill.s7` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `GAIN_VICTORY_POINTS`, `LOSE_VICTORY_POINTS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.chaos-sacrifice` |
| `master.chaos.skill.s8` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `NONE` | `NONE` | `CHOOSE_ONE_PLAYER` | `DEFEAT_PLAYER` | `CHOOSE_ONE_PLAYER` | `NONE` | `NONE` | `NONE` | `payload:selectedPlayerIds` | `NONE` | `core.chaos-giant-shark` |
| `master.chaos.skill.s9` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:card_power:set` | `NONE` | `NONE` | `NONE` | `core.chaos-fear` |
| `master.ciel.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.ciel.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ciel-mediator` |
| `master.ciel.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.ciel.skill.s1b` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `player.victory-points.changed` | `EVENT_PLAYER_IS_OPPONENT`, `EVENT_ROUND_VICTORY_POINTS_GAIN_CROSSES` | `NONE` | `NONE` | `RETURN_CARD_BY_DEFINITION` | `NONE` | `NONE` | `NONE` | `FACE_UP` | `NONE` | `NONE` | `core.structured-skill` |
| `master.ciel.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `combat.resolved` | `EVENT_COMBAT_OPPONENT_COUNT_EQUALS`, `EVENT_PLAYER_WON_COMBAT`, `LOCATION_IS` | `NONE` | `NONE` | `GAIN_MANA`, `GAIN_VICTORY_POINTS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `master.ciel.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `AT_BATTLEFIELD`, `DOES_NOT_CONTROL_CARD_DEFINITION`, `SOURCE_ACTIVE`, `TARGET_COUNT_AT_LEAST` | `NONE` | `NONE` | `SET_PLAYER_FLAG` | `NONE` | `duration:permanent` | `rule:situation_mana_gain:forbid`, `rule:situation_power_bonus:forbid` | `NONE` | `NONE` | `COMBAT_CONDITION` | `core.structured-skill` |
| `master.dan.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.attached-supply-append` |
| `master.dan.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dan-sniper` |
| `master.dan.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dan-honor` |
| `master.darnic.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.darnic-old-acquaintances` |
| `master.darnic.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.unoccupied-terrain-advantage` |
| `master.darnic.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved`, `round.ending` | `CONSTANT`, `EVENT_PLAYER_WON_COMBAT`, `METRIC`, `METRIC_COMPARE`, `SOURCE_OWNED` | `NONE` | `BRANCH_CHOICE` | `LOSE_VICTORY_POINTS`, `SET_MANA` | `BRANCH_CHOICE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `master.fiore.skill.ascension` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `combat.resolved` | `EVENT_PLAYER_LOST_COMBAT`, `PLAYER_FLAG_IS` | `NONE` | `BRANCH_CHOICE` | `CYCLE_STATE_TRANSITION`, `LOSE_VICTORY_POINTS`, `SET_PLAYER_FLAG` | `BRANCH_CHOICE` | `expires:round_end`, `limit.maxUses:1`, `limit.period:round`, `limit.scope:controller` | `NONE` | `NONE` | `binding:fullRecoveryTranscendChoice`, `payload:fullRecoveryTranscendChoice`, `result:fullRecoveryTranscendChoice` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.fiore-full-recovery` |
| `master.fiore.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `CYCLE_STATE_TRANSITION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.fiore.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `ACTION`, `OUTPOST` | `combat.ending` | `TRANSCEND_OUTPOST_SWITCH_USED_THIS_ROUND`, `TRANSCEND_SECOND_SWITCH_USED_THIS_ROUND` | `NONE` | `CHOOSE_NUMBER` | `CYCLE_STATE_TRANSITION`, `LOSE_MANA` | `CHOOSE_NUMBER` | `cleanup:restore_base_pairs`, `duration:until_round_end` | `NONE` | `NONE` | `payload:pairIndex` | `COMBAT_EVENT` | `core.fiore-transcend` |
| `master.fiore.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:movement_permission:prohibit` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.fiore.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:round_mana_gain_cap:set_by_round_kind` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.fiore.skill.s4` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `ACTIVE_SITUATION_PROHIBITS_NOBLE_PHANTASM_USE`, `COMBAT_HAS_OTHER_PLAYER_WITH_LOWER_VICTORY_POINTS` | `NONE` | `NONE` | `COMBAT_POWER_BONUS` | `NONE` | `NONE` | `effect:combat_power_bonus`, `rule:controller_master_skill_power:set_and_lock` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EFFECT` | `core.game-start-rule-flags` |
| `master.fiore.skill.s5` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `cycle_state.entered` | `CONTROLLER_AT_UNDEPLOYED_BATTLEFIELD`, `EVENT_DEFINITION_IS` | `MANA` | `NONE` | `MOVE_PLAYER`, `MOVE_SOURCE_CARD`, `TERRAIN_POSITION_ADJUSTMENT` | `NONE` | `NONE` | `rule:card_play_mode:require_additional_play` | `NONE` | `NONE` | `COMBAT_CONDITION` | `core.fiore-neuromechanics` |
| `master.fiore.skill.s6` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_OPPONENT_MATCHES_BOUND_TARGET`, `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `CYCLE_STATE_TRANSITION`, `GAIN_VICTORY_POINTS` | `NONE` | `cleanup:clear_bound_target`, `duration:until_round_end` | `NONE` | `NONE` | `payload:targetPlayerId` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.fiore-determination` |
| `master.fiore.skill.s7` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `cycle_state.entered` | `EVENT_DEFINITION_IS` | `MANA` | `NONE` | `MOVE_SOURCE_CARD` | `NONE` | `NONE` | `rule:card_play_mode:require_additional_play`, `rule:combat_skill_card_power:increase` | `NONE` | `NONE` | `COMBAT_RULE_MODIFIER` | `core.fiore-clever-mind` |
| `master.fou.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.fou-force-of-providence` |
| `master.fou.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.fou-mark-of-beast` |
| `master.fujino.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.fujino-injury-warp` |
| `master.fujino.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.fujino.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.fujino-injury-warp` |
| `master.fujino.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.fujino-injury-warp` |
| `master.fujino.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.fujino-injury-warp` |
| `master.fujino.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.fujino-injury-warp` |
| `master.goetia.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.goetia-demon-gods` |
| `master.goetia.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.goetia-demon-gods` |
| `master.goetia.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.goetia-demon-gods` |
| `master.goredolf.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.goredolf-dont-fall-behind` |
| `master.goredolf.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.goredolf-iron-fist` |
| `master.goredolf.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.goredolf-fools-resolve` |
| `master.hakuno-f.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-f-mystic-code` |
| `master.hakuno-f.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-f-mystic-code` |
| `master.hakuno-f.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-f-mystic-code` |
| `master.hakuno-f.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-f-mystic-code` |
| `master.hakuno-f.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-f-mystic-code` |
| `master.hakuno-f.skill.s5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-f-mystic-code` |
| `master.hakuno-m.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-m-yomi` |
| `master.hakuno-m.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-m-yomi` |
| `master.hakuno-m.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-m-yomi` |
| `master.hakuno-m.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hakuno-m-yomi` |
| `master.hinako.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hinako-package` |
| `master.hinako.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hinako-package` |
| `master.hinako.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hinako-package` |
| `master.hinako.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hinako-package` |
| `master.hinako.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hinako-package` |
| `master.hinako.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hinako-package` |
| `master.hisui-detective.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hisui-detective` |
| `master.hisui-detective.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hisui-detective` |
| `master.hisui-detective.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hisui-detective` |
| `master.hisui-detective.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hisui-detective` |
| `master.hisui-detective.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hisui-detective` |
| `master.iliya.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.iliya.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.master-initial-mana` |
| `master.iliya.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.round-start-activate-skill` |
| `master.iliya.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.illya-small-grail` |
| `master.iliya.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.illya-heavenly-garment` |
| `master.illya-mahou.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.magical-ruby` |
| `master.illya-mahou.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.magical-ruby` |
| `master.illya-mahou.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.magical-ruby` |
| `master.irisviel.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.active-attack-lifecycle-boost` |
| `master.irisviel.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.irisviel.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.irisviel-conversion-magic` |
| `master.jinako.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jinako-time-out` |
| `master.jinako.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jinako-gamer` |
| `master.jinako.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jinako-cheat-code-cast` |
| `master.julius.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.julius-black-scorpion` |
| `master.julius.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.julius-skulk` |
| `master.julius.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.julius-rapid-aging` |
| `master.kadoc.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kadoc-fast-expansion` |
| `master.kadoc.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kadoc-crypter` |
| `master.kadoc.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.round-end-victory-point-loss` |
| `master.kadoc.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lostbelt-expansion` |
| `master.kadoc.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lostbelt-objective` |
| `master.kadoc.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lostbelt-objective` |
| `master.kadoc.skill.s5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lostbelt-objective` |
| `master.kariya.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kariya-human-battery` |
| `master.kariya.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kariya-insects` |
| `master.kariya.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kariya-nemesis` |
| `master.kariya.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kariya-nemesis` |
| `master.kariya.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kariya-collapse` |
| `master.kayneth.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kayneth-fluid-dynamics` |
| `master.kayneth.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.skill-eight-mana-waiver` |
| `master.kayneth.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kayneth-alchemist` |
| `master.kayneth.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `SOURCE_OWNED` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:permanent` | `rule:deployment_destinations:replace` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.kiara.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kiara.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kiara.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kiara.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kiara.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kiara.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kiara.skill.s5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kiara.skill.s6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiara-secret-gardens` |
| `master.kirei.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.kirei.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kirei-role` |
| `master.kirei.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.kirei.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` |
| `master.kiritsugu.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.kiritsugu.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-replace-deck-card` |
| `master.kiritsugu.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiritsugu-time-control` |
| `master.kiritsugu.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiritsugu-fourfold-speed` |
| `master.kiritsugu.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiritsugu-origin-bullet` |
| `master.kohaku.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kohaku-mech-hisui` |
| `master.kohaku.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kohaku-smile` |
| `master.kohaku.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.kohaku.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kohaku-burned-workshop` |
| `master.kuzuki.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.kuzuki.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-deck-cards` |
| `master.kuzuki.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.ending` | `ROUND_VICTORY_POINTS_GAINED_EQUALS`, `SOURCE_OWNED` | `NONE` | `NONE` | `IF_CONDITION` | `NONE` | `duration:permanent` | `rule:deployment_resource_gain:forbid`, `rule:movement_cost:subtract` | `NONE` | `NONE` | `COMBAT_EVENT` | `core.structured-skill` |
| `master.kuzuki.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `master.leonardo.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.leonardo-final-judgment` |
| `master.leonardo.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.combat-history` |
| `master.leonardo.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.maiya.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.maiya-support-fire` |
| `master.maiya.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.maiya-support-fire` |
| `master.maiya.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.maiya-support-fire` |
| `master.miyu.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.miyu-sapphire` |
| `master.miyu.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.miyu-sapphire` |
| `master.miyu.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.miyu-sapphire` |
| `master.miyu.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.miyu-sapphire` |
| `master.ophelia.skill.ascension` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.ending` | `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `EVENT_CARD_RULE`, `MOVE_SOURCE_CARD`, `SOURCE_CARD_POWER_BONUS` | `NONE` | `NONE` | `effect:source_card_power_bonus` | `NONE` | `binding:removedEventCount`, `result:removedEventCount` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.ophelia-world-eater` |
| `master.ophelia.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `LOSTBELT_EXPANSION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.ophelia-crypter` |
| `master.ophelia.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:ability_use_limit:set` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.ophelia.skill.s1b` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `ROUND_NUMBER_EQUALS` | `NONE` | `NONE` | `COMBAT_POWER_BONUS` | `NONE` | `NONE` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_EFFECT` | `core.round-start-power-bonus` |
| `master.ophelia.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `MANA` | `NONE` | `COMBAT_POWER_LOCK` | `NONE` | `limit.maxUses:2`, `limit.period:game`, `limit.scope:controller` | `rule:combat_attack_power_increase_from_other_cards:prohibit` | `NONE` | `NONE` | `COMBAT_EFFECT`, `COMBAT_RULE_MODIFIER` | `core.ophelia-prolongation` |
| `master.ophelia.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `EVENT_CARD_RULE`, `LOSTBELT_EXPANSION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lostbelt-expansion` |
| `master.ophelia.skill.s4` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.ending` | `NONE` | `NONE` | `NONE` | `EVENT_CARD_RULE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_EVENT` | `core.lostbelt-objective` |
| `master.ophelia.skill.s5` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_POWER_BONUS`, `EVENT_CARD_RULE` | `NONE` | `NONE` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_EFFECT` | `core.lostbelt-objective` |
| `master.ophelia.skill.s6` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_POWER_BONUS`, `EVENT_CARD_RULE` | `NONE` | `NONE` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_EFFECT` | `core.lostbelt-objective` |
| `master.ophelia.skill.s7` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_POWER_BONUS`, `EVENT_CARD_RULE` | `NONE` | `NONE` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_EFFECT` | `core.lostbelt-objective` |
| `master.peperoncino.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.india-nirvana` |
| `master.peperoncino.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.peperoncino.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.peperoncino.skill.s1b` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.power-bonus-and-forward-move` |
| `master.peperoncino.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.india-expansion` |
| `master.peperoncino.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.india-yuga-cycle` |
| `master.peperoncino.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.india-objectives` |
| `master.rani.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rani-prophecies` |
| `master.rani.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rani-prophecies` |
| `master.rani.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rani-prophecies` |
| `master.rani.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rani-prophecies` |
| `master.reines.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reines-trimmau` |
| `master.reines.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reines-trimmau` |
| `master.reines.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reines-trimmau` |
| `master.reines.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reines-trimmau` |
| `master.reines.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reines-trimmau` |
| `master.reines.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reines-trimmau` |
| `master.rin.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rin-jewel-sword` |
| `master.rin.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rin-gem-magic` |
| `master.rin.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rin-command-seal-duty` |
| `master.rin.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rin-gem` |
| `master.rin.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `master.ritsuka-f.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ritsuka-f-dual-servant` |
| `master.ritsuka-f.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ritsuka-f-dual-servant` |
| `master.ritsuka-f.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ritsuka-f-dual-servant` |
| `master.ritsuka-m.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ritsuka-m-craft-essence` |
| `master.ritsuka-m.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ritsuka-m-craft-essence` |
| `master.ritsuka-m.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ritsuka-m-craft-essence` |
| `master.roche.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.roche-noble-sacrifice` |
| `master.roche.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.roche-innocence` |
| `master.roche.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.roche-giant-guidance` |
| `master.roche.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.roche-betrayal` |
| `master.ryuunosuke.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryuunosuke-blasphemer` |
| `master.ryuunosuke.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryuunosuke-chain-killer` |
| `master.ryuunosuke.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryuunosuke-death-art` |
| `master.sakura.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sakura-corrosion` |
| `master.sakura.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sakura-corrupted-grail-trigger` |
| `master.sakura.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sakura-corrupted-grail-trigger` |
| `master.sakura.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sakura-black-mud` |
| `master.sakura.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `master.shiki-nanaya.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nanaya-dark-compulsion` |
| `master.shiki-nanaya.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.shiki-nanaya.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.combat-history` |
| `master.shiki-nanaya.skill.s1b` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nanaya-demon-hunter` |
| `master.shiki-nanaya.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nanaya-death-perception` |
| `master.shiki-ryougi.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `master.shiki-ryougi.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.shiki-ryougi.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.shiki-ryougi.skill.s1b` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryougi-void` |
| `master.shiki-ryougi.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryougi-sever-life` |
| `master.shiki-ryougi.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.shiki-tohno.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tohno-shiki-possession` |
| `master.shiki-tohno.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.shiki-tohno.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tohno-shiki-possession` |
| `master.shiki-tohno.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tohno-shiki-possession` |
| `master.shiki-tohno.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tohno-shiki-possession` |
| `master.shiki-tohno.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tohno-shiki-possession` |
| `master.shinji.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shinji-book` |
| `master.shinji.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.enter-location-gain-mana` |
| `master.shinji.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shinji-book` |
| `master.shinji.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.defeat-lose-command-seal` |
| `master.shinji.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shinji-book` |
| `master.shirou-emiya.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `master.shirou-emiya.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.master-initial-mana` |
| `master.shirou-emiya.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.shirou-emiya.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.shirou-meal.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shirou-meal-ascension` |
| `master.shirou-meal.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shirou-meal-procurement` |
| `master.shirou-meal.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shirou-meal-menu` |
| `master.shishigou.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shishigou-necromancy` |
| `master.shishigou.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shishigou-necromancy` |
| `master.shishigou.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shishigou-necromancy` |
| `master.shishigou.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shishigou-necromancy` |
| `master.sieg.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sieg-galvanism` |
| `master.sieg.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.sieg.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sieg-dragon-command-seal` |
| `master.sieg.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sieg-balmung` |
| `master.sion.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.sion.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-chaldea-training` |
| `master.sion.skill.s10` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-presence-concealment-ex` |
| `master.sion.skill.s11` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.sion.skill.s12` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `master.sion.skill.s13` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `CONSTANT`, `METRIC`, `METRIC_COMPARE`, `SOURCE_OWNED` | `VICTORY_POINTS` | `CHOOSE_ONE_CARD` | `PLAY_SELECTED_CARDS` | `CHOOSE_ONE_CARD` | `NONE` | `NONE` | `NONE` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `master.sion.skill.s14` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-chaldea-training` |
| `master.sion.skill.s15` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-chaldea-training` |
| `master.sion.skill.s16` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.sion.skill.s17` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-chaldea-training` |
| `master.sion.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-chaldea-training` |
| `master.sion.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-chaldea-training` |
| `master.sion.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-chaldea-training` |
| `master.sion.skill.s5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-magic-immunity-ex` |
| `master.sion.skill.s6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.sion.skill.s7` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-independent-action-ex` |
| `master.sion.skill.s8` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `master.sion.skill.s9` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sion-territory-expansion-ex` |
| `master.taiga.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.taiga-domestic-carnage` |
| `master.taiga.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.master-initial-mana` |
| `master.taiga.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.taiga-fates-guide` |
| `master.tiamat.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.tiamat.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tiamat-mother-of-all` |
| `master.tiamat.skill.s1a` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tiamat-human-evil` |
| `master.tokiomi.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `master.tokiomi.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tokiomi-elementalist` |
| `master.tokiomi.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.twice.skill.ascension` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `SOURCE_OWNED`, `VICTORY_POINTS_IS_LOWEST` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `rule:combat_power:add`, `rule:elimination:replace` | `NONE` | `NONE` | `COMBAT_RULE_MODIFIER` | `core.structured-skill` |
| `master.twice.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `ACTION`, `PREPARATION` | `NONE` | `ANY_OF`, `COMMAND_SEALS_AT_LEAST`, `EVENT_COUNT_AT_LEAST`, `IMPLIES`, `METRIC`, `METRIC_COMPARE`, `PHASE_IS`, `SOURCE_OWNED` | `NONE` | `BRANCH_CHOICE`, `CHOOSE_N_EVENTS`, `CHOOSE_ONE_EVENT` | `IF_CONDITION`, `REPLACE_SELECTED_EVENT_FROM_DECK`, `SWAP_SELECTED_EVENT_LOCATIONS` | `BRANCH_CHOICE`, `CHOOSE_N_EVENTS`, `CHOOSE_ONE_EVENT` | `NONE` | `NONE` | `NONE` | `payload:twiceReplaceEventIds`, `payload:twiceSwapEventIds` | `NONE` | `core.structured-skill` |
| `master.wallachia.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s7` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.wallachia.skill.s8` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wallachia-tatari` |
| `master.waver.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.waver-case-files` |
| `master.waver.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `master.waver.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.pay-mana-draw` |
| `master.waver.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `master.wodime.skill.ascension` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `SECRET_ROUND_BINDING` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s1` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `game.started` | `NONE` | `NONE` | `NONE` | `LOSTBELT_EXPANSION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s1a` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `SECRET_ROUND_BINDING` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s2` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `SECRET_ROUND_MATCHES_CURRENT` | `NONE` | `NONE` | `ASTRONOMICAL_SPHERE_RULE`, `PLAY_SOURCE_CARD` | `NONE` | `NONE` | `rule:card_entry_method:restrict_to_this_ability`, `rule:card_play_mana_requirement:ignore_below_threshold`, `rule:combat_power_resolution:ignore_other_controller_attacks` | `NONE` | `NONE` | `COMBAT_RULE_MODIFIER` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_POWER_BONUS`, `GAIN_MANA`, `LOCATION_TOKEN_RULE` | `NONE` | `NONE` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_EFFECT` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s4` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `event.revealed` | `EVENT_HAS_LOSTBELT_TAG` | `NONE` | `NONE` | `EVENT_CARD_RULE`, `LOSTBELT_EXPANSION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s5` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `EVENT_CARD_RULE`, `LOSTBELT_EXPANSION` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s6` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `EVENT_CARD_RULE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s7` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.power-calculated` | `COMBAT_OCCURS_AT_SOURCE_EVENT_BATTLEFIELD`, `PLAYER_POWER_BELOW` | `NONE` | `NONE` | `DEFEAT_PLAYER`, `EVENT_CARD_RULE` | `NONE` | `NONE` | `rule:defeat_immunity:disable` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT`, `COMBAT_RULE_MODIFIER` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s8` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.power-calculated` | `COMBAT_OCCURS_AT_SOURCE_EVENT_BATTLEFIELD`, `PLAYER_COMMAND_SEALS_SPENT_THIS_ROUND_EQUALS`, `PLAYER_IS_WODIME_OPPONENT` | `NONE` | `NONE` | `DEFEAT_PLAYER`, `EVENT_CARD_RULE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.wodime-lostbelt-system` |
| `master.wodime.skill.s9` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.power-calculated` | `COMBAT_OCCURS_AT_SOURCE_EVENT_BATTLEFIELD`, `PLAYER_DEPLOYED_TO_SOURCE_EVENT_BATTLEFIELD_DURING`, `PLAYER_IS_WODIME_OPPONENT` | `NONE` | `NONE` | `DEFEAT_PLAYER`, `EVENT_CARD_RULE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.wodime-lostbelt-system` |
| `master.zouken.skill.ascension` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.zouken-illusive-mastermind` |
| `master.zouken.skill.s1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-player-config` |
| `master.zouken.skill.s2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-add-skill` |
| `master.zouken.skill.s3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.zouken-founder` |
| `master.zouken.skill.s4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.zouken-pseudo-vampire` |
| `master.zouken.skill.s5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `servant.abigail.skill.sc-abigail-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.abigail-witching-hour` |
| `servant.abigail.skill.sc-abigail-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.abigail-witch-trial` |
| `servant.abigail.skill.sc-abigail-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.abigail-gate-to-nowhere` |
| `servant.abigail.skill.sc-abigail-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.outer-god-life` |
| `servant.achilles.skill.sc-achilles-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.achilles-package` |
| `servant.achilles.skill.sc-achilles-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.achilles-package` |
| `servant.achilles.skill.sc-achilles-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.achilles-package` |
| `servant.albion.skill.sc-albion-1` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `combat.ending`, `player.entered-location` | `EVENT_LOCATION_IS`, `EVENT_PLAYER_IS_CONTROLLER`, `SOURCE_OWNED` | `NONE` | `BRANCH_CHOICE`, `CHOOSE_ONE_LOCATION` | `GAIN_MANA`, `GAIN_VICTORY_POINTS`, `LOSE_MANA`, `RETURN_CARD_BY_DEFINITION`, `SCHEDULE_EFFECT` | `BRANCH_CHOICE`, `CHOOSE_ONE_LOCATION` | `NONE` | `NONE` | `FACE_UP` | `NONE` | `COMBAT_EVENT` | `core.structured-skill` |
| `servant.albion.skill.sc-albion-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `player.moved` | `EVENT_PLAYER_IS_CONTROLLER`, `PLAYER_FLAG_NUMBER_NOT_CURRENT_ROUND`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `SET_PLAYER_FLAG`, `SOURCE_CARD_POWER_BONUS` | `NONE` | `NONE` | `effect:source_card_power_bonus` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.albion.skill.sc-albion-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dragon-heart` |
| `servant.altera.skill.sc-altera-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.altera-teardrop-photon-ray` |
| `servant.altera.skill.sc-altera-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.altera-photon-ray` |
| `servant.altera.skill.sc-altera-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.amakusa.skill.sc-amakusa-1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card.played` | `EVENT_DEFINITION_IS_SELF`, `EVENT_FACE_IS`, `EVENT_PLAYER_IS_CONTROLLER` | `NONE` | `NONE` | `MOVE_MATCHING_EVENTS`, `SOURCE_CARD_POWER_BONUS` | `NONE` | `NONE` | `effect:source_card_power_bonus` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.amakusa.skill.sc-amakusa-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.amakusa-magician` |
| `servant.amakusa.skill.sc-amakusa-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ruler-class` |
| `servant.amor.skill.sc-amor-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ruler-class` |
| `servant.amor.skill.sc-amor-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.amor-golden-arrow` |
| `servant.amor.skill.sc-amor-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.amor-calling-agape` |
| `servant.anastasia.skill.sc-anastasia-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.anastasia.skill.sc-anastasia-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.anastasia-sumerki-kremlin` |
| `servant.anastasia.skill.sc-anastasia-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.anastasia-viy` |
| `servant.andersen.skill.sc-andersen-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.andersen.skill.sc-andersen-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `NONE` | `NONE` | `cleanup:remain_active`, `duration:this_round`, `duration:while_active` | `rule:defeat:ignore`, `rule:non_effect_victory_point_gain:forbid` | `NONE` | `NONE` | `COMBAT_RULE_MODIFIER` | `core.structured-skill` |
| `servant.andersen.skill.sc-andersen-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.andersen-innocent-monster` |
| `servant.angra.skill.sc-angra-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.angra-all-evils` |
| `servant.angra.skill.sc-angra-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.angra-eternal-binding` |
| `servant.angra.skill.sc-angra-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.angra-bites` |
| `servant.arash.skill.sc-arash-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arash-preparation` |
| `servant.arash.skill.sc-arash-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arash-clairvoyance` |
| `servant.arash.skill.sc-arash-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arash-stella` |
| `servant.arcueid.skill.sc-arcueid-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arcueid-crimson-moon` |
| `servant.arcueid.skill.sc-arcueid-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arcueid-millennium-castle` |
| `servant.arcueid.skill.sc-arcueid-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arcueid-marble-phantasm` |
| `servant.arjuna-archer.skill.sc-arjuna-archer-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arjuna-endowed-hero` |
| `servant.arjuna-archer.skill.sc-arjuna-archer-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arjuna-agni-gandiva` |
| `servant.arjuna-archer.skill.sc-arjuna-archer-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arjuna-judgment` |
| `servant.arjuna.skill.sc-arjuna-1` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `card.exiled`, `combat.resolved` | `EVENT_DEFINITION_IS_SELF`, `EVENT_PLAYER_LOST_COMBAT`, `EVENT_PLAYER_WON_COMBAT`, `SOURCE_OWNED` | `NONE` | `NONE` | `ADD_LINKED_STATUS`, `COMBAT_POWER_BONUS`, `EXILE_SOURCE_CARD`, `REMOVE_LINKED_STATUS` | `NONE` | `duration:until_card_closed`, `expiresOn:card.exiled` | `effect:combat_power_bonus` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EFFECT`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.arjuna.skill.sc-arjuna-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.god-arjuna-world-reset` |
| `servant.arjuna.skill.sc-arjuna-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.god-arjuna-imperfection-is-sin` |
| `servant.arthur.skill.sc-arthur-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.arthur.skill.sc-arthur-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.arthur-windbreaker` |
| `servant.arthur.skill.sc-arthur-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.artoria-alt.skill.sc-artoria-alt-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoria-alt-excalibur-morgan` |
| `servant.artoria-alt.skill.sc-artoria-alt-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoria-alt-blackening-curse` |
| `servant.artoria-alt.skill.sc-artoria-alt-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.artoriac.skill.sc-artoriac-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoria-avalon` |
| `servant.artoriac.skill.sc-artoriac-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.artoriac.skill.sc-artoriac-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoria-avalon` |
| `servant.artoriac.skill.sc-artoriac-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoria-avalon` |
| `servant.artoriac.skill.sc-artoriac-5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoria-avalon` |
| `servant.artoriac.skill.sc-artoriac-6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.artoria-avalon` |
| `servant.ashva.skill.sc-ashva-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ashva-avatar-rage` |
| `servant.ashva.skill.sc-ashva-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ashva-mahakala` |
| `servant.ashva.skill.sc-ashva-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ashva-sudarshan-chakra` |
| `servant.astolfo.skill.sc-astolfo-1` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `AT_BATTLEFIELD`, `SOURCE_OWNED` | `NONE` | `CHOOSE_EACH_PLAYER_CARDS` | `NONE` | `CHOOSE_EACH_PLAYER_CARDS` | `NONE` | `NONE` | `FACE_UP`, `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:keptInstanceIds` | `COMBAT_CONDITION` | `core.structured-skill` |
| `servant.astolfo.skill.sc-astolfo-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.astolfo-trap-of-argalia` |
| `servant.astolfo.skill.sc-astolfo-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.astolfo-casseur-de-logistille` |
| `servant.astraea.skill.sc-astraea-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.astraea.skill.sc-astraea-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.astraea-return-order` |
| `servant.astraea.skill.sc-astraea-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.astraea-scale-protection` |
| `servant.atalanta.skill.sc-atalanta-1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `NONE` | `NONE` | `cleanup:remain_active`, `duration:while_active`, `starts:immediate` | `rule:card_base_power:add`, `rule:card_cost:add`, `rule:skill_use:forbid` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.atalanta.skill.sc-atalanta-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `METRIC`, `METRIC_COMPARE`, `SOURCE_ACTIVE` | `NONE` | `CHOOSE_ONE_CARD` | `NONE` | `CHOOSE_ONE_CARD` | `duration:this_round` | `NONE` | `NONE` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.atalanta.skill.sc-atalanta-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.avicebron.skill.sc-avicebron-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.avicebron-golems` |
| `servant.avicebron.skill.sc-avicebron-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.avicebron-golems` |
| `servant.avicebron.skill.sc-avicebron-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.avicebron.skill.sc-avicebron-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.avicebron-golems` |
| `servant.avicebron.skill.sc-avicebron-5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.avicebron-golems` |
| `servant.baobhan.skill.sc-baobhan-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.baobhan-part-collector` |
| `servant.baobhan.skill.sc-baobhan-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.baobhan-fetch-failnaught` |
| `servant.baobhan.skill.sc-baobhan-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.barghest.skill.sc-barghest-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.barghest-demon-chains` |
| `servant.barghest.skill.sc-barghest-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.barghest-black-dog-galatine` |
| `servant.barghest.skill.sc-barghest-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.barghest-sun-devourer` |
| `servant.bb.skill.sc-bb-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bb-moon-cell` |
| `servant.bb.skill.sc-bb-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bb-moon-cell` |
| `servant.bb.skill.sc-bb-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bb-moon-cell` |
| `servant.bb.skill.sc-bb-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.moon-cancer` |
| `servant.bedivere.skill.sc-bedivere-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.bedivere.skill.sc-bedivere-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bedivere-oath-of-protection` |
| `servant.bedivere.skill.sc-bedivere-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bedivere-silver-arm` |
| `servant.benkei.skill.sc-benkei-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.benkei.skill.sc-benkei-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.benkei-bulwark` |
| `servant.benkei.skill.sc-benkei-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.benkei-evenly-matched` |
| `servant.bikuni.skill.sc-bikuni-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bikuni-moon-cell` |
| `servant.bikuni.skill.sc-bikuni-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bikuni-moon-cell` |
| `servant.bikuni.skill.sc-bikuni-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bikuni-moon-cell` |
| `servant.bikuni.skill.sc-bikuni-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.moon-cancer` |
| `servant.billy.skill.sc-billy-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.billy-thunderer-hidden-attacks` |
| `servant.billy.skill.sc-billy-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.billy-luck-double` |
| `servant.billy.skill.sc-billy-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.billy-quick-draw` |
| `servant.boudica.skill.sc-boudica-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.boudica.skill.sc-boudica-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.boudica.skill.sc-boudica-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.bradamante.skill.sc-bradamante-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.bradamante.skill.sc-bradamante-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bradamante-angelica-cathay` |
| `servant.bradamante.skill.sc-bradamante-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.bradamante-bouclier-atlante` |
| `servant.brynhildr.skill.sc-brynhildr-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.brynhildr.skill.sc-brynhildr-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.brynhildr-hero-bridesmaid` |
| `servant.brynhildr.skill.sc-brynhildr-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.caenis.skill.sc-caenis-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caenis-poseidon-favor` |
| `servant.caenis.skill.sc-caenis-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caenis-golden-wings` |
| `servant.caenis.skill.sc-caenis-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caenis-maelstrom` |
| `servant.caligula.skill.sc-caligula-1` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SITUATION_FORBIDS_ATTRIBUTE`, `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_CARD` | `PLAY_SELECTED_CARDS` | `CHOOSE_ONE_CARD` | `duration:permanent` | `rule:situation_card_play:ignore` | `NONE` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.caligula.skill.sc-caligula-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caligula-mad-tyrant` |
| `servant.caligula.skill.sc-caligula-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.caligula-flucticulus-diana` |
| `servant.carmilla.skill.sc-carmilla-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.carmilla-fresh-blood` |
| `servant.carmilla.skill.sc-carmilla-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.carmilla-immoral-suggestion` |
| `servant.carmilla.skill.sc-carmilla-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.carmilla-phantom-maiden` |
| `servant.charlemagne.skill.sc-charlemagne-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.charlemagne-joyeuse-ordre` |
| `servant.charlemagne.skill.sc-charlemagne-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.charlemagne-charles-patricius` |
| `servant.charlemagne.skill.sc-charlemagne-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.chiron.skill.sc-chiron-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.chiron.skill.sc-chiron-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.chiron.skill.sc-chiron-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.self-play-card` |
| `servant.chloe.skill.sc-chloe-1` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `CHOOSE_N_CARDS`, `CHOOSE_ONE_CARD` | `CLOSE_SELECTED_CARD`, `IF_CONDITION`, `PLAY_SELECTED_CARDS` | `CHOOSE_N_CARDS`, `CHOOSE_ONE_CARD` | `duration:while_active` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:closedAttackIds`, `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.chloe.skill.sc-chloe-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.chloe-projection-magic` |
| `servant.chloe.skill.sc-chloe-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.chloe-kanshou-bakuya` |
| `servant.clytie.skill.sc-clytie-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.clytie-starry-night` |
| `servant.clytie.skill.sc-clytie-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.clytie-water-nymph` |
| `servant.clytie.skill.sc-clytie-3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `servant.true-name-revealed` | `EVENT_PLAYER_IS_CONTROLLER` | `NONE` | `NONE` | `EXILE_SOURCE_CARD`, `LOSE_VICTORY_POINTS_PER_MATCHING_CARDS`, `TRANSFER_MATCHING_CARDS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.clytie.skill.sc-clytie-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.outer-god-life` |
| `servant.constantine.skill.sc-constantine-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.constantine.skill.sc-constantine-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.constantine.skill.sc-constantine-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.constantine-triple-walls` |
| `servant.corday.skill.sc-corday-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.corday.skill.sc-corday-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.corday-foolish-plan` |
| `servant.corday.skill.sc-corday-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.corday-dream` |
| `servant.cu-alter.skill.sc-cu-alter-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.cu-alter-curruid-passive` |
| `servant.cu-alter.skill.sc-cu-alter-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.cu-alter-curruid-permanent` |
| `servant.cu-alter.skill.sc-cu-alter-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.cu-alter-gae-bolg` |
| `servant.cu.skill.sc-cu-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.cu-gae-bolg` |
| `servant.cu.skill.sc-cu-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.cu.skill.sc-cu-np` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.cu-gungnir-reward` |
| `servant.dantes.skill.sc-dantes-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dantes-king` |
| `servant.dantes.skill.sc-dantes-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dantes-attendre` |
| `servant.dantes.skill.sc-dantes-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dantes-enfer` |
| `servant.danzou.skill.sc-danzou-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.danzou-mechanical-illusion` |
| `servant.danzou.skill.sc-danzou-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.danzou-synthetic-limbs` |
| `servant.danzou.skill.sc-danzou-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.darius.skill.sc-darius-1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.ending` | `PLAYER_FLAG_NUMBER_NOT_CURRENT_ROUND`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD` | `NONE` | `cleanup:remain_active`, `duration:while_active`, `starts:immediate` | `NONE` | `NONE` | `NONE` | `COMBAT_EVENT` | `core.structured-skill` |
| `servant.darius.skill.sc-darius-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:this_round` | `rule:card_close:forbid`, `rule:card_power:add` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.darius.skill.sc-darius-3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:this_round` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.darius.skill.sc-darius-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.davinci.skill.sc-davinci-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.davinci-package` |
| `servant.davinci.skill.sc-davinci-10` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.zero-target-strength-and-exile` |
| `servant.davinci.skill.sc-davinci-11` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.imaginary-submarine-and-exile` |
| `servant.davinci.skill.sc-davinci-12` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.spiritron-transfer-and-exile` |
| `servant.davinci.skill.sc-davinci-13` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.instant-enhancement` |
| `servant.davinci.skill.sc-davinci-14` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.emergency-treatment-and-exile` |
| `servant.davinci.skill.sc-davinci-15` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.davinci-focus` |
| `servant.davinci.skill.sc-davinci-16` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.block-movement-and-exile` |
| `servant.davinci.skill.sc-davinci-17` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.attach-power-upgrade` |
| `servant.davinci.skill.sc-davinci-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.davinci-package` |
| `servant.davinci.skill.sc-davinci-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.davinci-package` |
| `servant.davinci.skill.sc-davinci-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.deploy-workshop-gain-mana` |
| `servant.davinci.skill.sc-davinci-5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reveal-target-true-name-and-exile` |
| `servant.davinci.skill.sc-davinci-6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.davinci-black-key` |
| `servant.davinci.skill.sc-davinci-7` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.davinci.skill.sc-davinci-8` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` |
| `servant.davinci.skill.sc-davinci-9` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.davinci-package` |
| `servant.deon.skill.sc-deon-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.deon-sword-dance` |
| `servant.deon.skill.sc-deon-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.deon-fleur-de-lys` |
| `servant.deon.skill.sc-deon-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.deon-self-suggestion` |
| `servant.diarmuid.skill.sc-diarmuid-1` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `combat.resolved` | `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_WON_COMBAT`, `PLAYER_FLAG_NUMBER_CURRENT_ROUND`, `SOURCE_ACTIVE`, `SOURCE_OWNED` | `NONE` | `NONE` | `CLEAR_PLAYER_FLAG`, `SEQUESTER_RANDOM_INACTIVE_SERVANT_SKILL`, `SET_PLAYER_FLAG` | `NONE` | `duration:this_round` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.diarmuid.skill.sc-diarmuid-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.diarmuid-red-rose` |
| `servant.diarmuid.skill.sc-diarmuid-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.dioscuri.skill.sc-dioscuri-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dioscuri-twin-divinity` |
| `servant.dioscuri.skill.sc-dioscuri-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dioscuri-gift-of-mortality` |
| `servant.dioscuri.skill.sc-dioscuri-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dioscuri-tyndaridae` |
| `servant.donquixote.skill.sc-donquixote-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.donquixote.skill.sc-donquixote-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `servant.donquixote.skill.sc-donquixote-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.douman.skill.sc-douman-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.douman-evil-minister` |
| `servant.douman.skill.sc-douman-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.douman-ridicule-cat` |
| `servant.douman.skill.sc-douman-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.drake.skill.sc-drake-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.drake.skill.sc-drake-2` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_LOCATION` | `IF_CONDITION`, `MOVE_PLAYER` | `CHOOSE_ONE_LOCATION` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:targetLocationId` | `NONE` | `core.structured-skill` |
| `servant.drake.skill.sc-drake-3` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `SOURCE_ACTIVE`, `SOURCE_OWNED` | `NONE` | `NONE` | `GAIN_VICTORY_POINTS` | `NONE` | `NONE` | `rule:card_ability_move_direction:allow` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.edison.skill.sc-edison-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.opponent-bonus-per-costly-attack` |
| `servant.edison.skill.sc-edison-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card.played`, `player.deployed`, `player.mana.changed` | `EVENT_DEFINITION_IS_SELF`, `EVENT_LOCATION_IS`, `EVENT_NUMBER_COMPARE`, `EVENT_PLAYER_IS_CONTROLLER`, `EVENT_PLAYER_IS_OPPONENT`, `METRIC`, `METRIC_COMPARE`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD`, `GAIN_MANA`, `GAIN_VICTORY_POINTS`, `LOSE_MANA` | `NONE` | `cleanup:remain_active`, `duration:while_active`, `starts:immediate` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.edison.skill.sc-edison-3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_COMBAT_HAS_ATTRIBUTE`, `EVENT_LOCATION_EQUALS_CONTROLLER`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD` | `NONE` | `cleanup:remain_active`, `duration:while_active` | `rule:card_power:set`, `rule:deployment_advantage:add` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.elizabeth.skill.sc-elizabeth-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.elizabeth-volume-power` |
| `servant.elizabeth.skill.sc-elizabeth-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.elizabeth-vocal-performance` |
| `servant.elizabeth.skill.sc-elizabeth-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.elizabeth-iron-maiden` |
| `servant.emiya-alt.skill.sc-emiya-alt-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.emiya-alt.skill.sc-emiya-alt-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.emiya-alt-unlimited-blade-works` |
| `servant.emiya-alt.skill.sc-emiya-alt-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.emiya-alt-kanshou-bakuya` |
| `servant.emiya.skill.sc-emiya-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.zero-opponent-attribute` |
| `servant.emiya.skill.sc-emiya-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.emiya-fake-spiral-sword` |
| `servant.emiya.skill.sc-emiya-np` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `CHOOSE_N_CARDS` | `MOVE_SELECTED_CARDS` | `CHOOSE_N_CARDS` | `duration:until_card_closed` | `rule:card_draw:forbid`, `rule:standard_attack_card_count:replace` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.enkidu.skill.sc-enkidu-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.enkidu-transfiguration` |
| `servant.enkidu.skill.sc-enkidu-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.enkidu-enuma-elish` |
| `servant.enkidu.skill.sc-enkidu-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.ereshkigal.skill.sc-ereshkigal-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.ereshkigal.skill.sc-ereshkigal-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ereshkigal-blessing-of-kur` |
| `servant.ereshkigal.skill.sc-ereshkigal-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ereshkigal-kur-kigal-irkalla` |
| `servant.euryale.skill.sc-euryale-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.euryale.skill.sc-euryale-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.euryale-siren-song` |
| `servant.euryale.skill.sc-euryale-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.euryale-eye` |
| `servant.frank.skill.sc-frank-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.frank.skill.sc-frank-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.combat-power-from-battlefield-played-costs` |
| `servant.frank.skill.sc-frank-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.gareth.skill.sc-gareth-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.gareth.skill.sc-gareth-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gareth-ira-lupus` |
| `servant.gareth.skill.sc-gareth-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gareth-gun-lance` |
| `servant.gawain.skill.sc-gawain-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gawain-galatine` |
| `servant.gawain.skill.sc-gawain-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gawain-saint-number` |
| `servant.gawain.skill.sc-gawain-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.georgios.skill.sc-georgios-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.georgios-martyr-soul` |
| `servant.georgios.skill.sc-georgios-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.georgios-bayard` |
| `servant.georgios.skill.sc-georgios-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.georgios-ascalon` |
| `servant.gil.skill.sc-gil-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.gil.skill.sc-gil-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.double-deployment-bonus` |
| `servant.gil.skill.sc-gil-np` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gilgamesh-enuma-elish` |
| `servant.gilles.skill.sc-gilles-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gilles-mass-summoning` |
| `servant.gilles.skill.sc-gilles-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.gilles.skill.sc-gilles-np` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gilles-call-ancients` |
| `servant.gorgon.skill.sc-gorgon-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.gorgon-noble-phantasm-watch` |
| `servant.gorgon.skill.sc-gorgon-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_LOCATION_EQUALS_CONTROLLER`, `SOURCE_ACTIVE`, `TARGET_COUNT_AT_LEAST` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD` | `NONE` | `cleanup:remain_active`, `duration:while_active`, `starts:immediate` | `rule:card_play_with_others:forbid`, `rule:defeat:ignore` | `NONE` | `NONE` | `COMBAT_EVENT`, `COMBAT_RULE_MODIFIER` | `core.structured-skill` |
| `servant.gorgon.skill.sc-gorgon-3` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `DEFEAT_PLAYER` | `NONE` | `cleanup:remain_active`, `duration:while_active` | `rule:card_play:forbid`, `rule:movement_destinations:forbid` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.hassan.skill.sc-hassan-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.hassan.skill.sc-hassan-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.hassan.skill.sc-hassan-np` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hassan-np` |
| `servant.hassanhf.skill.sc-hassanhf-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hundred-faced-hassan-tracking` |
| `servant.hassanhf.skill.sc-hassanhf-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hundred-faced-hassan-illusion` |
| `servant.hassanhf.skill.sc-hassanhf-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.hassanser.skill.sc-hassanser-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.hassanser.skill.sc-hassanser-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.hassanser.skill.sc-hassanser-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.serenity-dance` |
| `servant.helena.skill.sc-helena-1` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `NONE` | `NONE` | `CHOOSE_ONE_CARD` | `PLAY_SELECTED_CARDS`, `SET_SELECTED_CARDS_FACE` | `CHOOSE_ONE_CARD` | `NONE` | `NONE` | `FACE_DOWN`, `FACE_UP` | `payload:attackInstanceIds`, `payload:targetSkillInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.helena.skill.sc-helena-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.helena-search-unknown` |
| `servant.helena.skill.sc-helena-3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:this_round` | `rule:skill_use:forbid` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.hephaistion.skill.sc-hephaistion-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hephaistion-wheel` |
| `servant.hephaistion.skill.sc-hephaistion-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.pretender-class` |
| `servant.hephaistion.skill.sc-hephaistion-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.herc.skill.sc-herc-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.twelve-labors` |
| `servant.herc.skill.sc-herc-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.twelve-labors` |
| `servant.herc.skill.sc-herc-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.twelve-labors` |
| `servant.hijikata.skill.sc-hijikata-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hijikata-coat` |
| `servant.hijikata.skill.sc-hijikata-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hijikata-flag` |
| `servant.hijikata.skill.sc-hijikata-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hijikata-law` |
| `servant.himiko.skill.sc-himiko-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.himiko-oracle-kidou` |
| `servant.himiko.skill.sc-himiko-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.himiko-oracle-kidou` |
| `servant.himiko.skill.sc-himiko-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.himiko-oracle-kidou` |
| `servant.hokusai.skill.sc-hokusai-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hokusai-colors-beyond` |
| `servant.hokusai.skill.sc-hokusai-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hokusai-colors-world` |
| `servant.hokusai.skill.sc-hokusai-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.hokusai-great-wave` |
| `servant.hokusai.skill.sc-hokusai-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.outer-god-life` |
| `servant.ibaraki.skill.sc-ibaraki-1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `SOURCE_OWNED` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:permanent` | `rule:combat_power:add` | `NONE` | `NONE` | `COMBAT_RULE_MODIFIER` | `core.structured-skill` |
| `servant.ibaraki.skill.sc-ibaraki-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mana-threshold-vp-loss` |
| `servant.ibaraki.skill.sc-ibaraki-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ibaraki-rashomon-grudge` |
| `servant.illya.skill.sc-illya-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.illya-card-holster` |
| `servant.illya.skill.sc-illya-10` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.illya-caster-install` |
| `servant.illya.skill.sc-illya-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.illya.skill.sc-illya-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.illya-quintett-feuer` |
| `servant.illya.skill.sc-illya-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.zero-opponent-attribute` |
| `servant.illya.skill.sc-illya-5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.illya.skill.sc-illya-6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.illya-dream-archer` |
| `servant.illya.skill.sc-illya-7` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.illya.skill.sc-illya-8` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.illya-dream-assassin` |
| `servant.illya.skill.sc-illya-9` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.ishtar.skill.sc-ishtar-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ishtar-divine-authority` |
| `servant.ishtar.skill.sc-ishtar-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ishtar-an-gal-ta-kigal-she` |
| `servant.ishtar.skill.sc-ishtar-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.iskandar.skill.sc-iskandar-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.iskandar.skill.sc-iskandar-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `AT_BATTLEFIELD`, `EVENT_COUNT_AT_LEAST`, `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_EVENT` | `ENSURE_EVENT_DECK_COUNT`, `MOVE_SELECTED_EVENTS`, `SHUFFLE_EVENT_DECK` | `CHOOSE_ONE_EVENT` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:discardedEventIds`, `payload:replacementEventIds` | `COMBAT_CONDITION` | `core.structured-skill` |
| `servant.iskandar.skill.sc-iskandar-np` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.create-temporary-attacks` |
| `servant.ivan.skill.sc-ivan-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ivan-black-dog` |
| `servant.ivan.skill.sc-ivan-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ivan-beast-form` |
| `servant.ivan.skill.sc-ivan-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.izou.skill.sc-izou-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.izou-shimatsuken` |
| `servant.izou.skill.sc-izou-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.izou-man-slayer` |
| `servant.izou.skill.sc-izou-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.jack.skill.sc-jack-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jack-dissociation` |
| `servant.jack.skill.sc-jack-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jack-mist` |
| `servant.jack.skill.sc-jack-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jack-maria` |
| `servant.jaguarman.skill.sc-jaguarman-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.jaguarman.skill.sc-jaguarman-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jaguarman-dark-forest` |
| `servant.jaguarman.skill.sc-jaguarman-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jaguarman-death-claw` |
| `servant.jason.skill.sc-jason-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jason-argonaut-quest` |
| `servant.jason.skill.sc-jason-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jason-argonaut-quest` |
| `servant.jason.skill.sc-jason-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jason-argonaut-quest` |
| `servant.jeanne-alter.skill.sc-jeanne-alter-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.defeat-engaged-if-more-attacks` |
| `servant.jeanne-alter.skill.sc-jeanne-alter-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jeanne-alter-dragon-witch` |
| `servant.jeanne-alter.skill.sc-jeanne-alter-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jeanne-alter-oblivion-correction` |
| `servant.jeanne.skill.sc-jeanne-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ruler-class` |
| `servant.jeanne.skill.sc-jeanne-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.jeanne.skill.sc-jeanne-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.defeat-combat-participants` |
| `servant.jekyll.skill.sc-jekyll-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jekyll-dangerous-game` |
| `servant.jekyll.skill.sc-jekyll-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.jekyll-lycanthropy` |
| `servant.jekyll.skill.sc-jekyll-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.kagekiyo.skill.sc-kagekiyo-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kagekiyo-azamaru` |
| `servant.kagekiyo.skill.sc-kagekiyo-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_LOST_COMBAT`, `SOURCE_OWNED` | `NONE` | `BRANCH_CHOICE`, `CHOOSE_ONE_CARD` | `DRAW_CARDS`, `TRANSFER_SELECTED_CARDS` | `BRANCH_CHOICE`, `CHOOSE_ONE_CARD` | `NONE` | `NONE` | `FACE_DOWN`, `FACE_UP` | `payload:selectedInstanceIds` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.kagekiyo.skill.sc-kagekiyo-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kagekiyo-never-dies` |
| `servant.kagetora.skill.sc-kagetora-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kagetora-god-of-war` |
| `servant.kagetora.skill.sc-kagetora-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kagetora-eight-phase` |
| `servant.kagetora.skill.sc-kagetora-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.kagetora.skill.sc-kagetora-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kagetora-ruler-seal` |
| `servant.kama.skill.sc-kama-1` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `BRANCH_CHOICE`, `CHOOSE_ONE_LOCATION` | `CLOSE_SOURCE_CARD`, `COMBAT_POWER_BONUS`, `LOSE_MANA` | `BRANCH_CHOICE`, `CHOOSE_ONE_LOCATION` | `cleanup:remain_active`, `duration:while_active` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_EFFECT` | `core.structured-skill` |
| `servant.kama.skill.sc-kama-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `player.entered-location`, `round.ended` | `AT_BATTLEFIELD`, `EVENT_LOCATION_NOT`, `EVENT_LOCATION_NOT_CONTROLLER`, `EVENT_PLAYER_IS_OPPONENT`, `PLAYER_FLAG_NUMBER_EQUALS_EVENT_FIELD`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLEAR_PLAYER_FLAG`, `CLOSE_SOURCE_CARD`, `SET_PLAYER_FLAG`, `TRANSFER_VICTORY_POINTS` | `NONE` | `duration:while_active` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION` | `core.structured-skill` |
| `servant.kama.skill.sc-kama-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.karna.skill.sc-karna-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.karna-victory-for-power` |
| `servant.karna.skill.sc-karna-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.karna-sun-armor` |
| `servant.karna.skill.sc-karna-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.karna-next-round-defeat` |
| `servant.kinggil.skill.sc-kinggil-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.kinggil.skill.sc-kinggil-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.king-gil-gate-of-babylon` |
| `servant.kinggil.skill.sc-kinggil-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.king-gil-melammu-dingir` |
| `servant.kinghassan.skill.sc-kinghassan-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.king-hassan-azrael` |
| `servant.kinghassan.skill.sc-kinghassan-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.king-hassan-azrael` |
| `servant.kinghassan.skill.sc-kinghassan-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.king-hassan-azrael` |
| `servant.kingprotea.skill.sc-kingprotea-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kingprotea-limit-break` |
| `servant.kingprotea.skill.sc-kingprotea-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kingprotea-hibernation` |
| `servant.kingprotea.skill.sc-kingprotea-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kingprotea-infinite-growth` |
| `servant.kintoki.skill.sc-kintoki-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.kintoki.skill.sc-kintoki-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.kintoki.skill.sc-kintoki-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.kiritsugu.skill.sc-kiritsugu-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.kiritsugu.skill.sc-kiritsugu-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `AT_BATTLEFIELD`, `SOURCE_OWNED`, `TARGET_COUNT_AT_LEAST` | `NONE` | `CHOOSE_EACH_PLAYER_OPTION` | `INSTALL_ABILITY_RULE_MODIFIER`, `LOSE_VICTORY_POINTS` | `CHOOSE_EACH_PLAYER_OPTION` | `duration:this_round` | `rule:mana_spending:forbid` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `COMBAT_CONDITION` | `core.structured-skill` |
| `servant.kiritsugu.skill.sc-kiritsugu-3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `AT_BATTLEFIELD`, `EVENT_COUNT_AT_LEAST`, `METRIC`, `METRIC_COMPARE`, `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_EVENT` | `GAIN_VICTORY_POINTS`, `MOVE_SELECTED_EVENTS` | `CHOOSE_ONE_EVENT` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:selectedEventIds` | `COMBAT_CONDITION` | `core.structured-skill` |
| `servant.kiyohime.skill.sc-kiyohime-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiyohime-flame-colored-kiss` |
| `servant.kiyohime.skill.sc-kiyohime-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiyohime-no-more-lies` |
| `servant.kiyohime.skill.sc-kiyohime-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kiyohime-samadhi` |
| `servant.kotarou.skill.sc-kotarou-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.kotarou.skill.sc-kotarou-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kotarou-chaos-brigade` |
| `servant.kotarou.skill.sc-kotarou-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kotarou-shinobi-sabotage` |
| `servant.koyanskaya.skill.sc-koyanskaya-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.koyanskaya.skill.sc-koyanskaya-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.koyanskaya-nff` |
| `servant.koyanskaya.skill.sc-koyanskaya-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.koyanskaya-package` |
| `servant.koyanskaya.skill.sc-koyanskaya-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `servant.koyanskaya.skill.sc-koyanskaya-5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.koyanskaya-package` |
| `servant.koyanskaya.skill.sc-koyanskaya-6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.koyanskaya-package` |
| `servant.koyo.skill.sc-koyo-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.koyo-momijigari` |
| `servant.koyo.skill.sc-koyo-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.koyo-demon-form` |
| `servant.koyo.skill.sc-koyo-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.koyo-fire-breathing` |
| `servant.kriemhild.skill.sc-kriemhild-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kriemhild-das-rheingold` |
| `servant.kriemhild.skill.sc-kriemhild-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kriemhild-black-wedding` |
| `servant.kriemhild.skill.sc-kriemhild-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.kriemhild-corrupted-balmung` |
| `servant.ladyavalon.skill.sc-ladyavalon-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lady-avalon-ideal-land` |
| `servant.ladyavalon.skill.sc-ladyavalon-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.pretender-class` |
| `servant.ladyavalon.skill.sc-ladyavalon-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.lakshmibai.skill.sc-lakshmibai-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lakshmibai-package` |
| `servant.lakshmibai.skill.sc-lakshmibai-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lakshmibai-package` |
| `servant.lakshmibai.skill.sc-lakshmibai-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.lakshmibai.skill.sc-lakshmibai-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lakshmibai-package` |
| `servant.lance.skill.sc-lance-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lancelot-eternal-arms-mastery` |
| `servant.lance.skill.sc-lance-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `servant.lance.skill.sc-lance-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lancelot-for-someones-glory` |
| `servant.leonidas.skill.sc-leonidas-1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `player.moved` | `EVENT_PLAYER_IS_CONTROLLER`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD` | `NONE` | `duration:while_active` | `rule:face_up_cards_per_round:set` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.leonidas.skill.sc-leonidas-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.leonidas.skill.sc-leonidas-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.leonidas-pride` |
| `servant.lionking.skill.sc-lionking-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lionking-divine-command` |
| `servant.lionking.skill.sc-lionking-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lionking-dun-stallion` |
| `servant.lionking.skill.sc-lionking-3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card.played`, `combat.resolved` | `EVENT_DEFINITION_IS_SELF`, `EVENT_FACE_IS`, `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_IS_CONTROLLER`, `EVENT_PLAYER_WON_COMBAT`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `ADD_PLAYER_FLAG_NUMBER`, `IF_CONDITION`, `INFO_NOTE`, `MOVE_MATCHING_EVENTS` | `NONE` | `cleanup:remain_active`, `duration:while_active`, `starts:immediate` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.lishuwen.skill.sc-lishuwen-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lishuwen-sphere-boundary` |
| `servant.lishuwen.skill.sc-lishuwen-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lishuwen-no-second-strike` |
| `servant.lishuwen.skill.sc-lishuwen-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.lobo.skill.sc-lobo-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lobo-frostes-henker` |
| `servant.lobo.skill.sc-lobo-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lobo-ghastly-howl` |
| `servant.lobo.skill.sc-lobo-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lobo-oblivion-correction` |
| `servant.lubu.skill.sc-lubu-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lubu-restless-soul` |
| `servant.lubu.skill.sc-lubu-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `servant.lubu.skill.sc-lubu-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.lubu-god-force` |
| `servant.mandricardo.skill.sc-mandricardo-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mandricardo-instant-strike` |
| `servant.mandricardo.skill.sc-mandricardo-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mandricardo-instant-strike` |
| `servant.mandricardo.skill.sc-mandricardo-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.martha.skill.sc-martha-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.martha-divine-obedience` |
| `servant.martha.skill.sc-martha-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.martha-tarasque` |
| `servant.martha.skill.sc-martha-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.martha.skill.sc-martha-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.martha-divine-obedience` |
| `servant.mash.skill.sc-mash-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mash-lord-camelot` |
| `servant.mash.skill.sc-mash-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.opponent-attack-power-modifier` |
| `servant.mash.skill.sc-mash-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mash-ortenaus` |
| `servant.mash.skill.sc-mash-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `servant.maxwell.skill.sc-maxwell-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.maxwell.skill.sc-maxwell-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.maxwell.skill.sc-maxwell-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mana-gain-replacement-residual` |
| `servant.mechaeli.skill.sc-mechaeli-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-later-seat-opponent` |
| `servant.mechaeli.skill.sc-mechaeli-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved`, `player.entered-location` | `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_IS_OPPONENT`, `EVENT_PLAYER_WON_COMBAT`, `SOURCE_ACTIVE`, `TARGET_COUNT_EQUALS` | `NONE` | `NONE` | `COMBAT_POWER_BONUS`, `GAIN_VICTORY_POINTS` | `NONE` | `NONE` | `effect:combat_power_bonus` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EFFECT`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.mechaeli.skill.sc-mechaeli-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.medb.skill.sc-medb-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.medb.skill.sc-medb-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.medb-red-mead` |
| `servant.medb.skill.sc-medb-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.medb-chariot` |
| `servant.medea.skill.sc-medea-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.medea.skill.sc-medea-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.medea.skill.sc-medea-np` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.medusa.skill.sc-medusa-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.medusa.skill.sc-medusa-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `DEFEAT_PLAYER` | `NONE` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.medusa.skill.sc-medusa-np` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_LOCATION` | `NONE` | `CHOOSE_ONE_LOCATION` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:targetLocationId` | `NONE` | `core.structured-skill` |
| `servant.meltryllis.skill.sc-meltryllis-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.meltryllis-melt-virus` |
| `servant.meltryllis.skill.sc-meltryllis-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.meltryllis-saraswati-meltout` |
| `servant.meltryllis.skill.sc-meltryllis-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.melusine.skill.sc-melusine-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.melusine-ray-horizon` |
| `servant.melusine.skill.sc-melusine-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.melusine-perl-dancer` |
| `servant.melusine.skill.sc-melusine-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.dragon-heart` |
| `servant.mephisto.skill.sc-mephisto-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.mephisto.skill.sc-mephisto-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION`, `PREPARATION` | `round.started` | `SOURCE_ACTIVE`, `VICTORY_POINTS_IS_FIRST` | `NONE` | `NONE` | `DEFEAT_PLAYER`, `EXILE_SOURCE_CARD`, `SOURCE_CARD_POWER_BONUS`, `TRANSFER_MANA`, `TRANSFER_VICTORY_POINTS` | `NONE` | `NONE` | `effect:source_card_power_bonus` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.mephisto.skill.sc-mephisto-3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `CHOOSE_ONE_CARD`, `CHOOSE_ONE_PLAYER` | `GAIN_VICTORY_POINTS` | `CHOOSE_ONE_CARD`, `CHOOSE_ONE_PLAYER` | `duration:permanent` | `NONE` | `NONE` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.merlin.skill.sc-merlin-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-rule-flags` |
| `servant.merlin.skill.sc-merlin-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.merlin-flower-sea` |
| `servant.merlin.skill.sc-merlin-3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `combat.resolved` | `AT_BATTLEFIELD`, `EVENT_COUNT_AT_LEAST`, `EVENT_SCOUTING_REWARDED_CONTROLLER`, `SOURCE_OWNED` | `NONE` | `NONE` | `GAIN_MANA`, `GAIN_VICTORY_POINTS`, `MOVE_MATCHING_EVENTS` | `NONE` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.mhx.skill.sc-mhx-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mhx-anti-saber-weapon` |
| `servant.mhx.skill.sc-mhx-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mhx-nameless-victory-sword` |
| `servant.mhx.skill.sc-mhx-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.molay.skill.sc-molay-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.molay-pilgrims-reward` |
| `servant.molay.skill.sc-molay-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.molay-mother-of-goats` |
| `servant.molay.skill.sc-molay-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.molay-goats-invitation` |
| `servant.molay.skill.sc-molay-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.outer-god-life` |
| `servant.mordred.skill.sc-mordred-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mordred-hidden-helm` |
| `servant.mordred.skill.sc-mordred-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.mordred-clarent` |
| `servant.mordred.skill.sc-mordred-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.morgan.skill.sc-morgan-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.morgan-end-of-world` |
| `servant.morgan.skill.sc-morgan-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.morgan-infinity-mirror` |
| `servant.morgan.skill.sc-morgan-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ruler-class` |
| `servant.moriarty.skill.sc-moriarty-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.moriarty-wicked-charisma` |
| `servant.moriarty.skill.sc-moriarty-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.moriarty-spider-web` |
| `servant.moriarty.skill.sc-moriarty-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.moriarty-dynamics` |
| `servant.mozart.skill.sc-mozart-1` | `SOURCE_GROUNDED` | `NONE` | `ACTION`, `OUTPOST` | `round.started` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `SCHEDULE_EFFECT` | `NONE` | `duration:this_round` | `rule:card_power:add`, `rule:movement_destinations:forbid` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.mozart.skill.sc-mozart-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card.played`, `combat.resolved` | `EVENT_DEFINITION_IS_SELF`, `EVENT_FACE_IS`, `EVENT_PLAYER_IS_CONTROLLER`, `PLAYER_FLAG_NUMBER_CURRENT_ROUND` | `NONE` | `NONE` | `LOSE_VICTORY_POINTS`, `SET_PLAYER_FLAG` | `NONE` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `COMBAT_EVENT` | `core.structured-skill` |
| `servant.mozart.skill.sc-mozart-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.muramasa.skill.sc-muramasa-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.muramasa.skill.sc-muramasa-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.muramasa-imperfect-edge` |
| `servant.muramasa.skill.sc-muramasa-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.musashi.skill.sc-musashi-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.musashi-mastery` |
| `servant.musashi.skill.sc-musashi-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.musashi-niten-ichiryu` |
| `servant.musashi.skill.sc-musashi-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.napoleon.skill.sc-napoleon-1` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `AT_BATTLEFIELD`, `CARD_COUNT_AT_LEAST`, `SOURCE_OWNED` | `NONE` | `CHOOSE_ONE_CARD` | `NONE` | `CHOOSE_ONE_CARD` | `cleanup:remain_active`, `duration:this_round` | `rule:combat_reward_distribution:replace`, `rule:combat_winner_inclusion:allow`, `rule:defeat:ignore` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:selectedInstanceIds` | `COMBAT_CONDITION`, `COMBAT_RULE_MODIFIER` | `core.structured-skill` |
| `servant.napoleon.skill.sc-napoleon-2` | `SOURCE_GROUNDED` | `NONE` | `COMBAT` | `NONE` | `ENGAGED_OPPONENT_VICTORY_POINTS_GREATER_THAN_CONTROLLER`, `SOURCE_ACTIVE` | `NONE` | `CHOOSE_ONE_CARD` | `DRAW_CARDS`, `PLAY_SELECTED_CARDS` | `CHOOSE_ONE_CARD` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.napoleon.skill.sc-napoleon-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.nemo.skill.sc-nemo-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nemo-sea-god-blessing` |
| `servant.nemo.skill.sc-nemo-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nemo-split-thinking` |
| `servant.nemo.skill.sc-nemo-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nemo-nautilus` |
| `servant.nero.skill.sc-nero-1` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved`, `round.ending` | `EVENT_PLAYER_WON_COMBAT`, `PLAYER_FLAG_NUMBER_NOT_CURRENT_ROUND`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD`, `GAIN_VICTORY_POINTS` | `NONE` | `cleanup:remain_active`, `duration:while_active`, `starts:immediate` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.nero.skill.sc-nero-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `CHOOSE_N_CARDS` | `DRAW_CARDS`, `PLAY_SELECTED_CARDS`, `REMOVE_CARDS_IN_ZONE` | `CHOOSE_N_CARDS` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.nero.skill.sc-nero-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nero-emperor-privilege` |
| `servant.nightingale.skill.sc-nightingale-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nightingale-pledge` |
| `servant.nightingale.skill.sc-nightingale-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nightingale-iron-nurse` |
| `servant.nightingale.skill.sc-nightingale-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nightingale-angel` |
| `servant.nitocris.skill.sc-nitocris-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nitocris-entomb` |
| `servant.nitocris.skill.sc-nitocris-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nitocris-entomb` |
| `servant.nitocris.skill.sc-nitocris-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nitocris-entomb` |
| `servant.nobunaga.skill.sc-nobunaga-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nobunaga-papiyas` |
| `servant.nobunaga.skill.sc-nobunaga-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nobunaga-three-line-formation` |
| `servant.nobunaga.skill.sc-nobunaga-3` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved`, `player.defeated` | `EVENT_PLAYER_IS_CONTROLLER`, `EVENT_PLAYER_LOST_COMBAT` | `NONE` | `NONE` | `GAIN_VICTORY_POINTS`, `LOSE_VICTORY_POINTS` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT` | `core.structured-skill` |
| `servant.nursery.skill.sc-nursery-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nursery-package` |
| `servant.nursery.skill.sc-nursery-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `NONE` | `SOURCE_ACTIVE` | `NONE` | `NONE` | `NONE` | `NONE` | `duration:while_active` | `rule:skill_use:forbid` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.nursery.skill.sc-nursery-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.nursery-package` |
| `servant.oberon.skill.sc-oberon-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.game-start-player-config` |
| `servant.oberon.skill.sc-oberon-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.pretender-class` |
| `servant.oberon.skill.sc-oberon-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ruler-class` |
| `servant.oberon.skill.sc-oberon-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ruler-class` |
| `servant.odysseus.skill.sc-odysseus-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.odysseus-troia-hippos` |
| `servant.odysseus.skill.sc-odysseus-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.odysseus-aigis` |
| `servant.odysseus.skill.sc-odysseus-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.okita-alt.skill.sc-okita-alt-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.okita-alt.skill.sc-okita-alt-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.okita-alt-boundless` |
| `servant.okita-alt.skill.sc-okita-alt-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.okita-alt-rengoku` |
| `servant.okita.skill.sc-okita-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.okita-sincerity-flag` |
| `servant.okita.skill.sc-okita-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.create-temporary-attacks` |
| `servant.okita.skill.sc-okita-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.okita-haori` |
| `servant.okita.skill.sc-okita-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.okita-weak-constitution` |
| `servant.orion.skill.sc-orion-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.orion-hunter-moon` |
| `servant.orion.skill.sc-orion-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.orion-sea-god-blessing` |
| `servant.orion.skill.sc-orion-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.orion-luck-exile` |
| `servant.osakabe.skill.sc-osakabe-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.osakabe-castle-apparition` |
| `servant.osakabe.skill.sc-osakabe-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.osakabe-chiyogami-bats` |
| `servant.osakabe.skill.sc-osakabe-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.osakabe-hakuro-castle` |
| `servant.ozymandias.skill.sc-ozymandias-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ozymandias-ramesseum` |
| `servant.ozymandias.skill.sc-ozymandias-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `card.played`, `player.defeated`, `player.entered-location` | `EVENT_DEFINITION_IS_SELF`, `EVENT_FACE_IS`, `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_IS_CONTROLLER`, `EVENT_PLAYER_IS_OPPONENT`, `SOURCE_ACTIVE` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD`, `GAIN_MANA`, `LOSE_MANA`, `SOURCE_CARD_POWER_BONUS` | `NONE` | `cleanup:remain_active`, `duration:while_active`, `starts:immediate` | `effect:source_card_power_bonus` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.ozymandias.skill.sc-ozymandias-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ozymandias-dendera` |
| `servant.parvati.skill.sc-parvati-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.parvati-ashes-of-kama` |
| `servant.parvati.skill.sc-parvati-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.parvati-imaginary-around` |
| `servant.parvati.skill.sc-parvati-3` | `SOURCE_GROUNDED` | `NONE` | `ACTION`, `COMBAT` | `NONE` | `PLAYER_FLAG_NUMBER_CURRENT_ROUND`, `SOURCE_ACTIVE` | `NONE` | `CHOOSE_N_CARDS`, `CHOOSE_ONE_PLAYER` | `IF_CONDITION`, `PLAY_SELECTED_CARDS` | `CHOOSE_N_CARDS`, `CHOOSE_ONE_PLAYER` | `duration:this_round` | `NONE` | `NONE` | `payload:selectedInstanceIds` | `NONE` | `core.structured-skill` |
| `servant.passionlip.skill.sc-passionlip-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.passionlip.skill.sc-passionlip-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.passionlip-masochism` |
| `servant.passionlip.skill.sc-passionlip-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.passionlip-durga-armor` |
| `servant.penthesilea.skill.sc-penthesilea-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.penthesilea-war-god-roar` |
| `servant.penthesilea.skill.sc-penthesilea-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.penthesilea-divine-beauty` |
| `servant.penthesilea.skill.sc-penthesilea-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.penthesilea-evicerate` |
| `servant.quetzalcoatl.skill.sc-quetzalcoatl-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.quetzal-flame` |
| `servant.quetzalcoatl.skill.sc-quetzalcoatl-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.quetzal-sunstone` |
| `servant.quetzalcoatl.skill.sc-quetzalcoatl-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.power-bonus-and-forward-move` |
| `servant.raikou.skill.sc-raikou-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.raikou-ox-king` |
| `servant.raikou.skill.sc-raikou-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.raikou.skill.sc-raikou-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.raikou-mystery-killer` |
| `servant.roberts.skill.sc-roberts-1` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `AT_BATTLEFIELD`, `EVENT_COUNT_AT_LEAST`, `SOURCE_OWNED`, `TARGET_COUNT_AT_LEAST` | `MANA` | `CHOOSE_EACH_PLAYER_OPTION`, `CHOOSE_ONE_EVENT` | `ADD_STATUS`, `IF_CONDITION`, `REMOVE_STATUS`, `SET_PLAYER_FLAG` | `CHOOSE_EACH_PLAYER_OPTION`, `CHOOSE_ONE_EVENT` | `duration:this_round` | `NONE` | `NONE` | `payload:selectedEventIds` | `COMBAT_CONDITION` | `core.structured-skill` |
| `servant.roberts.skill.sc-roberts-2` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `PLAYER_FLAG_NUMBER_CURRENT_ROUND`, `SOURCE_ACTIVE`, `SOURCE_OWNED` | `MANA` | `CHOOSE_ONE_LOCATION` | `RETURN_CARD_BY_DEFINITION` | `CHOOSE_ONE_LOCATION` | `NONE` | `NONE` | `FACE_UP`, `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.roberts.skill.sc-roberts-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.robin.skill.sc-robin-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.robin.skill.sc-robin-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.robin.skill.sc-robin-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.robin-prayer-bow` |
| `servant.romulus.skill.sc-romulus-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.romulus-moles-necessrie` |
| `servant.romulus.skill.sc-romulus-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.romulus-magna-voluisse-magnum` |
| `servant.romulus.skill.sc-romulus-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.ryouma.skill.sc-ryouma-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryouma-soaring-dragon` |
| `servant.ryouma.skill.sc-ryouma-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryouma-blade-restoration` |
| `servant.ryouma.skill.sc-ryouma-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ryouma-dragon-restoration` |
| `servant.saber.skill.sc-saber-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.saber.skill.sc-saber-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.zero-opponent-attribute` |
| `servant.saber.skill.sc-saber-np` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.saitou.skill.sc-saitou-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saber-magic-resistance` |
| `servant.saitou.skill.sc-saitou-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saitou-flag-of-sincerity` |
| `servant.saitou.skill.sc-saitou-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.saitou-formlessness` |
| `servant.salieri.skill.sc-salieri-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.salieri-avenger` |
| `servant.salieri.skill.sc-salieri-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.salieri-avenger` |
| `servant.salieri.skill.sc-salieri-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.salieri-avenger` |
| `servant.sanson.skill.sc-sanson-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sanson-judgment-day` |
| `servant.sanson.skill.sc-sanson-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sanson-death-hope` |
| `servant.sanson.skill.sc-sanson-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.high-victory-combat-power` |
| `servant.sanzang.skill.sc-sanzang-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `servant.sanzang.skill.sc-sanzang-1` |
| `servant.sanzang.skill.sc-sanzang-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sanzang-teachings` |
| `servant.sanzang.skill.sc-sanzang-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sanzang-five-elements-palm` |
| `servant.sasaki.skill.sc-sasaki-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sasaki-first-strike` |
| `servant.sasaki.skill.sc-sasaki-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sasaki-second-strike` |
| `servant.sasaki.skill.sc-sasaki-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sasaki-third-strike` |
| `servant.scathach.skill.sc-scathach-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.scathach-wisdom` |
| `servant.scathach.skill.sc-scathach-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.scathach.skill.sc-scathach-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.scathach-mana-gate` |
| `servant.sei.skill.sc-sei-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sei-nostalgia` |
| `servant.sei.skill.sc-sei-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sei-nostalgia` |
| `servant.sei.skill.sc-sei-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sei-nostalgia` |
| `servant.semiramis.skill.sc-semiramis-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.semiramis.skill.sc-semiramis-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.semiramis.skill.sc-semiramis-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.shakespeare.skill.sc-shakespeare-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.territory-creation` |
| `servant.shakespeare.skill.sc-shakespeare-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.unlock-owner-ascension` |
| `servant.shakespeare.skill.sc-shakespeare-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.sherlock.skill.sc-sherlock-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sherlock-elementary` |
| `servant.sherlock.skill.sc-sherlock-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sherlock-empty-house` |
| `servant.sherlock.skill.sc-sherlock-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sherlock-retroduction` |
| `servant.sherlock.skill.sc-sherlock-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `servant.sherlock.skill.sc-sherlock-5` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `servant.sherlock.skill.sc-sherlock-6` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `servant.sherlock.skill.sc-sherlock-7` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.rule-marker` |
| `servant.shuten.skill.sc-shuten-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shuten-debaucherous-banquet` |
| `servant.shuten.skill.sc-shuten-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shuten-noxious-sake` |
| `servant.shuten.skill.sc-shuten-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.shuten-bone-collector` |
| `servant.siegfried.skill.sc-siegfried-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.siegfried-invisibility-cloak` |
| `servant.siegfried.skill.sc-siegfried-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `player.moved` | `AT_BATTLEFIELD`, `EVENT_LOCATION_EQUALS_CONTROLLER`, `EVENT_PLAYER_IS_OPPONENT`, `SOURCE_ACTIVE`, `TRUE_NAME_REVEALED` | `NONE` | `NONE` | `CLOSE_SOURCE_CARD` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `COMBAT_CONDITION` | `core.structured-skill` |
| `servant.siegfried.skill.sc-siegfried-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.reveal-hand-power-bonus` |
| `servant.sigurd.skill.sc-sigurd-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sigurd-gram-ii` |
| `servant.sigurd.skill.sc-sigurd-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sigurd-bolverk-gram` |
| `servant.sigurd.skill.sc-sigurd-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.sitonai.skill.sc-sitonai-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sitonai-combination-attack` |
| `servant.sitonai.skill.sc-sitonai-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.sitonai-pohjola-fimbul` |
| `servant.sitonai.skill.sc-sitonai-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.skadi.skill.sc-skadi-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.skadi-wisdom` |
| `servant.skadi.skill.sc-skadi-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.skadi-runes` |
| `servant.skadi.skill.sc-skadi-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.skadi-castle` |
| `servant.spartacus.skill.sc-spartacus-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.combat-power-from-command-seal-users` |
| `servant.spartacus.skill.sc-spartacus-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_LOCATION_EQUALS_CONTROLLER`, `SOURCE_ACTIVE` | `NONE` | `CHOOSE_ONE_PLAYER` | `GAIN_VICTORY_POINTS` | `CHOOSE_ONE_PLAYER` | `duration:while_active` | `NONE` | `NONE` | `NONE` | `COMBAT_EVENT` | `core.structured-skill` |
| `servant.spartacus.skill.sc-spartacus-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.spartacus-free-spirit` |
| `servant.stheno.skill.sc-stheno-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.presence-concealment` |
| `servant.stheno.skill.sc-stheno-2` | `SOURCE_GROUNDED` | `NONE` | `NONE` | `combat.resolved` | `EVENT_PLAYER_WON_COMBAT` | `NONE` | `NONE` | `GAIN_VICTORY_POINTS` | `NONE` | `NONE` | `rule:combat_reward_distribution:replace` | `NONE` | `NONE` | `COMBAT_CONDITION`, `COMBAT_EVENT`, `COMBAT_RULE_MODIFIER` | `core.structured-skill` |
| `servant.stheno.skill.sc-stheno-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.stheno-divine-core` |
| `servant.suzuka.skill.sc-suzuka-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.suzuka-package` |
| `servant.suzuka.skill.sc-suzuka-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.suzuka-package` |
| `servant.suzuka.skill.sc-suzuka-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.suzuka-package` |
| `servant.taisui.skill.sc-taisui-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.alter-ego-transform` |
| `servant.taisui.skill.sc-taisui-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.taisui-calamity` |
| `servant.taisui.skill.sc-taisui-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.taisui-awaken` |
| `servant.tamamo.skill.sc-tamamo-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tamamo-cascade` |
| `servant.tamamo.skill.sc-tamamo-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tamamo-witchcraft` |
| `servant.tamamo.skill.sc-tamamo-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tamamo-transcendence` |
| `servant.teach.skill.sc-teach-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.teach-gentleman-love` |
| `servant.teach.skill.sc-teach-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.teach-queen-anne` |
| `servant.teach.skill.sc-teach-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.tesla.skill.sc-tesla-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tesla-lightning-hand` |
| `servant.tesla.skill.sc-tesla-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tesla-lightning-descent` |
| `servant.tesla.skill.sc-tesla-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.tezcat.skill.sc-tezcat-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.card-play` |
| `servant.tezcat.skill.sc-tezcat-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tezcat-guise-warrior` |
| `servant.tezcat.skill.sc-tezcat-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tezcat-first-sun` |
| `servant.tomoe.skill.sc-tomoe-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.tomoe.skill.sc-tomoe-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tomoe-demonic-nature` |
| `servant.tomoe.skill.sc-tomoe-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.same-battlefield-opponent-power` |
| `servant.tristan.skill.sc-tristan-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tristan-lament` |
| `servant.tristan.skill.sc-tristan-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.tristan-love` |
| `servant.tristan.skill.sc-tristan-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.independent-action` |
| `servant.ushiwakamaru.skill.sc-ushiwakamaru-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ushiwakamaru-icicle-cutter` |
| `servant.ushiwakamaru.skill.sc-ushiwakamaru-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.ushiwakamaru-eight-boat-leap` |
| `servant.ushiwakamaru.skill.sc-ushiwakamaru-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.riding` |
| `servant.valkyrie.skill.sc-valkyrie-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.valkyrie-maiden-descent` |
| `servant.valkyrie.skill.sc-valkyrie-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.valkyrie-swan-dress` |
| `servant.valkyrie.skill.sc-valkyrie-3` | `SOURCE_GROUNDED` | `NONE` | `ACTION` | `NONE` | `CARD_COUNT_AT_LEAST`, `SOURCE_OWNED` | `NONE` | `NONE` | `RETRIGGER_CARD_PLAY_EFFECTS` | `NONE` | `NONE` | `NONE` | `REVEALS_TRUE_NAME`, `revealScope:servant_package`, `revealTiming:on_use_declared` | `NONE` | `NONE` | `core.structured-skill` |
| `servant.vlad.skill.sc-vlad-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.vlad-protector-of-nation` |
| `servant.vlad.skill.sc-vlad-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.vlad-kazikli-bey` |
| `servant.vlad.skill.sc-vlad-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.move-to-non-workshop` |
| `servant.voyager.skill.sc-voyager-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.voyager-message-hope` |
| `servant.voyager.skill.sc-voyager-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.voyager-message-peace` |
| `servant.voyager.skill.sc-voyager-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.voyager-pale-blue-dot` |
| `servant.voyager.skill.sc-voyager-4` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.outer-god-life` |
| `servant.xiangyu.skill.sc-xiangyu-1` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.xiangyu-ultimate-defense-matrix` |
| `servant.xiangyu.skill.sc-xiangyu-2` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.xiangyu-martial-force` |
| `servant.xiangyu.skill.sc-xiangyu-3` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `core.xiangyu-conquering-might` |
| `master.tiamat.card.life-sea` | `BLOCKED` | `SEMANTIC_SOURCE_REQUIRED`, `SOURCE_EVIDENCE_REQUIRED` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` | `NONE` |
