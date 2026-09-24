import type { AuthoringAbility, AuthoringCard, AuthoringPack, ExecutionMode, RuleNode, AdapterReportEntry } from './types';
import { hostOperations } from './types';
import { isAcceptedCommandSealLossConditionalDefeatAbility } from './command-seal-loss-conditional-defeat';
import { ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID } from '../core/card-source-state';
import {
  isPrivateOptionalHandPlayInteractionCandidate, isPrivateOptionalHandPlayInteractionSemantic,
  isSameBattlefieldPrivateHandReturnInteractionCandidate, isSameBattlefieldPrivateHandReturnInteractionSemantic,
} from './interaction-gateway';
import {
  isRulerSealBindingCandidate, isRulerSealBindingSemantic,
  isRulerSealUseCandidate, isRulerSealUseSemantic,
} from './ruler-seal';
import { isOuterGodLifeAbilityCandidate, isOuterGodLifeAbilitySemantic, OUTER_GOD_LIFE_CATEGORY } from './outer-god-life';
import { classifyAcceptedSkillUseForbidModifier, isAcceptedEffectInstalledSelectedDefinitionSkillUseForbidModifier } from './skill-use-forbid';
import { isAcceptedEffectInstalledCombatSettlementBundle, isAcceptedEffectInstalledCombatSettlementModifier, isAcceptedEffectInstalledControllerManaSpendingForbidModifier } from './m50-effect-installed-rule-modifiers';
import { isAcceptedControlledCardCloseForbidModifier } from './card-close-forbid';
import { isAcceptedStaticFaceUpCardsPerRoundAbility } from './face-up-cards-per-round';
import { isAcceptedLowerVpLoneBattlefieldDeploymentAbility } from './deployment-destinations';
import { isAcceptedCurrentRoundCombatLossAbsenceCondition } from './current-round-combat-loss-condition';
import { isAcceptedCurrentRoundCombatWinAbsenceCondition } from './current-round-combat-win-condition';
import { isAcceptedEventLocationEqualsControllerCondition } from './event-location-equals-controller';
import { isAcceptedOpponentRoundVpGainThresholdAbility, isOpponentRoundVpGainThresholdCandidate, OPPONENT_ROUND_VP_GAIN_TRIGGER } from './opponent-round-vp-gain-threshold';
import {
  NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT,
  SITUATION_SUPPRESSION_LUCK_PREDICATE,
  isAcceptedNextRoundSituationBenefitSuppressionAbility,
  isNextRoundSituationBenefitSuppressionCandidate,
} from './next-round-situation-benefit-suppression';
import { isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility, isAcceptedDeploymentLocationOpponentDefeatAbility, isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility, isAcceptedPreBattleDefeatAbility, isAcceptedSelectedSameBattlefieldDefeatAbility, isAcceptedStructuredChosenOpponentDefeatAbility, isPreBattleDefeatCandidate } from './pre-battle-defeat';
import {
  BATTLE_LOSS_VP_WINNER_REWARD_EFFECT,
  isAcceptedBattleLossVpWinnerRewardAbility,
  isBattleLossVpWinnerRewardCandidate,
} from './battle-loss-vp-winner-reward';
import {
  CONTROLLER_DEFEATED_TRIGGER,
  isAcceptedControllerDefeatedVpRewardAbility,
  isControllerDefeatedVpRewardCandidate,
} from './controller-defeated-vp-reward';
import {
  COMBAT_OPPONENT_POWER_VP_REWARD_EFFECT,
  isAcceptedCombatOpponentPowerVpRewardAbility,
  isCombatOpponentPowerVpRewardCandidate,
} from './combat-opponent-power-vp-reward';
import {
  OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT,
  OPPONENT_CLOSE_ONE_NON_RESIDUAL_EFFECT,
  isAcceptedOpponentCloseToOneAbility,
  isAcceptedOpponentCloseOneNonResidualAbility,
  isOpponentCloseToOneCandidate,
} from './opponent-close-to-one';
import {
  SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT,
  isAcceptedSelectedPlayedAttackTemporaryCopyAbility,
  isSelectedPlayedAttackTemporaryCopyCandidate,
} from './selected-played-attack-temporary-copy';
import {
  isGameStartPlayerStatusAssignmentCandidate,
  isGameStartPlayerStatusAssignmentSemantic,
} from './game-start-player-status-assignment';
import {
  BASIC_STRENGTH_ATTACK_CONSTRAINT,
  SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT,
  SET_SELECTED_CARD_FACE_DOWN_EFFECT,
  isAcceptedBasicStrengthOpponentSkillFaceDownAbility,
  isBasicStrengthOpponentSkillFaceDownCandidate,
} from './basic-strength-opponent-skill-face-down';
import {
  EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION,
  SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT,
  isAcceptedEventPowerUncontestedWinRewardAbility,
  isEventPowerUncontestedWinRewardCandidate,
} from './event-power-uncontested-win-reward';
import {
  BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER,
  BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST,
  isAcceptedBatchPassiveFamilyAbility,
  isBatchPassiveFamilyCandidate,
} from './batch-passive-card-rules';
import {
  B02_VICTORY_POINTS_IS_LOWEST,
  isAcceptedB02OwnedPassiveAbility,
  isB02OwnedPassiveCandidate,
} from './batch-owned-passive-rules';
import {
  B03_EVENT_COMBAT_HAS_ATTRIBUTE, B03_SCHEDULE_EFFECT,
  isAcceptedB03ModifierLifecycleAbility, isB03ModifierLifecycleCandidate,
} from './batch-modifier-lifecycle-rules';
import { isAcceptedM50AdditiveCardModifier, isAcceptedM50PermanentPlayerRuleModifier, isAcceptedM50StructuredStandardAppendAbility } from './m50-structural-card-modifiers';
import { isAcceptedM50DeductionRecordMarker, isM50DeductionRecordCandidate } from './m50-deduction-record';
import { isAcceptedM50LinkedPlayerCardModifier, isAcceptedM50LinkedPlayerSameBattlefieldCardAbility } from './m50-linked-player-card-modifiers';
import { isAcceptedM50SourceSpecificVictoryPointGainAbility, isAcceptedM50VictoryPointGainModifier } from './m50-victory-point-gain';
import { isAcceptedM50BoundaryBottomDiscardAbility, isAcceptedM50GrantedCardAbilitySource } from './m50-granted-card-abilities';
import { M50_CLOSE_SELECTED_FACE_DOWN_ATTACKS, M50_DRAW_AND_PLAY_FACE_DOWN, isAcceptedM50DrawAndPlayFaceDownAttackAbility, isAcceptedM50FaceDownAttackCloseAbility, isAcceptedM50FaceDownAttackRuleAbility, isAcceptedM50FaceDownAttackRuleModifier } from './m50-face-down-attack-rules';
import { isAcceptedM50SourceBattlefieldLockdownAbility } from './m50-source-battlefield-lockdown';
import { M50_BATTLE_TERMINAL_ACTIVE_ATTACK_VP_ATTRITION, isAcceptedM50BattleTerminalActiveAttackVpAttritionAbility } from './m50-battle-terminal-attrition';
import { isAcceptedM50OpponentDefeatCostAbility } from './m50-defeat-cost';
import { isAcceptedM50ConditionalCombatWinnerInclusionAbility } from './m50-conditional-combat-winner-inclusion';
import { M50_PLAYER_FLAG_GREATER_THAN_MANA_RATIO, isAcceptedM50RatioFilteredDefeatAbility, parseM50PlayerFlagManaRatioPredicate } from './m50-ratio-defeat';
import {
  B04_FIRST_MOVEMENT_SOURCE_POWER_EFFECT, B04_EVENT_PLAYER_MANA_EFFECT, B04_FIRST_MOVEMENT_CONDITION, B04_ROUND_DOUBLE_EFFECT, B04_SAME_LOCATION_MANA_EFFECT,
  isAcceptedB04EventSourcePowerAbility, isAcceptedB04ControllerDefeatManaReleaseAbility, isB04EventSourcePowerCandidate,
} from './batch-event-source-power-rules';import {
  B05_CONTROLLER_MANA_BELOW_TWO_CONDITION, B05_EVENT_LOCATION_IS_WORKSHOP_CONDITION, B05_OTHER_NON_WORKSHOP_BATTLEFIELD_ENTRY_CONDITION,
  B05_DEPLOYMENT_RESOURCE_EXCHANGE_EFFECT, B05_TRANSFER_VP_ARM_ROUND_CLOSE_EFFECT, B05_SOURCE_TRIGGERED_THIS_ROUND_CONDITION, B05_CLOSE_TRIGGERED_SOURCE_EFFECT,
  isAcceptedB05EventResourceLifecycleAbility, isB05EventResourceLifecycleCandidate,
} from './batch-event-resource-lifecycle-rules';
import {
  B06_SOURCE_PLAYED_FACE_UP_CONDITION, B06_ARM_ROUND_PUNISHMENT_EFFECT, B06_SOURCE_ARMED_THIS_ROUND_CONDITION,
  B06_PUNISH_BATTLE_LOSERS_EFFECT, B06_EVENT_BURST_EFFECT,
  isAcceptedB06CardPlayCombatEventBurstAbility, isB06CardPlayCombatEventBurstCandidate,
} from './batch-card-play-combat-event-burst-rules';

export function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
export function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
export function str(value: unknown): string { return typeof value === 'string' ? value : ''; }
function isAcceptedMagicResistanceIndependentModifierLifecycle(rawAbility: RuleNode, modifier: RuleNode): boolean {
  if (str(rawAbility.kind) !== 'phase_action') return false;
  const activation = node(rawAbility.activation);
  if (str(activation.phase) !== 'combat' || str(activation.opens) !== 'controller_combat_action_window' ||
    str(activation.requiresSourceState) !== 'active' ||
    !Object.keys(activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key))) return false;
  if (nodes(rawAbility.conditions).length !== 0 || nodes(rawAbility.targets).length !== 0 ||
    (Array.isArray(rawAbility.cost) ? nodes(rawAbility.cost).length !== 0 : rawAbility.cost !== undefined) ||
    nodes(rawAbility.effects).length !== 0 || nodes(rawAbility.creates).length !== 0 || nodes(rawAbility.ruleModifiers).length !== 1 ||
    Object.keys(node(rawAbility.lifecycle)).length !== 0 || Object.keys(node(rawAbility.responseWindow)).length !== 0 ||
    Object.keys(node(rawAbility.limit)).length !== 0 || Object.keys(node(rawAbility.visibility)).length !== 0) return false;
  const scope = node(modifier.scope); const constraints = nodes(scope.constraints); const lifecycle = node(modifier.lifecycle);
  return str(modifier.type) === 'combat_power_modifier' && modifier.operation === 'set' && modifier.rule === 'attack.currentPower' &&
    Number(modifier.value) === 0 && Number.isFinite(Number(modifier.value)) &&
    str(scope.controller) === 'engaged_opponents_same_battlefield' && str(scope.object) === 'attack_card' &&
    Object.keys(scope).every((key) => ['controller', 'object', 'constraints'].includes(key)) &&
    constraints.length === 1 && str(constraints[0]!.type) === 'has_attribute' && str(constraints[0]!.attribute) === '魔术' &&
    Object.keys(constraints[0]!).every((key) => ['type', 'attribute'].includes(key)) &&
    str(lifecycle.duration) === 'this_round' && Object.keys(lifecycle).every((key) => key === 'duration') &&
    Object.keys(modifier).every((key) => ['id', 'printedClause', 'type', 'operation', 'rule', 'scope', 'value', 'lifecycle'].includes(key));
}

export function isAcceptedStaticCombatRewardDistributionAbility(
  rawAbility: RuleNode,
  form: 'authoring' | 'compiled' = 'authoring',
): boolean {
  if (str(rawAbility.kind) !== 'passive') return false;
  const responseWindow = node(rawAbility.responseWindow);
  const responseKeys = Object.keys(responseWindow);
  const responseAccepted = form === 'authoring'
    ? responseKeys.length === 0
    : responseWindow.order === 'turn_order' && responseWindow.passBehavior === 'decline_this_window' &&
      responseKeys.length === 2 && responseKeys.every((key) => ['order', 'passBehavior'].includes(key));
  if (Object.keys(node(rawAbility.activation)).length !== 0 ||
    nodes(rawAbility.conditions).length !== 0 || nodes(rawAbility.targets).length !== 0 ||
    (Array.isArray(rawAbility.cost) ? nodes(rawAbility.cost).length !== 0 : rawAbility.cost !== undefined) ||
    nodes(rawAbility.effects).length !== 0 || nodes(rawAbility.creates).length !== 0 ||
    Object.keys(node(rawAbility.lifecycle)).length !== 0 || !responseAccepted ||
    Object.keys(node(rawAbility.limit)).length !== 0 || Object.keys(node(rawAbility.visibility)).length !== 0 ||
    (Array.isArray(rawAbility.markers) && rawAbility.markers.length !== 0) || rawAbility.copies !== undefined || rawAbility.transforms !== undefined) return false;
  const modifiers = nodes(rawAbility.ruleModifiers);
  if (modifiers.length !== 1) return false;
  const modifier = modifiers[0]!;
  const scope = node(modifier.scope);
  if (modifier.operation !== 'replace' || modifier.rule !== 'combat_reward_distribution' ||
    str(scope.subject) !== 'controller' || scope.whenControllerWins !== true || str(scope.mode) !== 'full_reward_each') return false;
  if (!Object.keys(scope).every((key) => ['subject', 'whenControllerWins', 'mode'].includes(key))) return false;
  if (!Object.keys(modifier).every((key) => ['id', 'printedClause', 'operation', 'rule', 'scope'].includes(key))) return false;
  const execution = node(rawAbility.execution);
  if (str(execution.mode || 'automatic') !== 'automatic' ||
    !Object.keys(execution).every((key) => ['mode', 'hostOps', 'allowedOperations'].includes(key))) return false;
  if (form === 'authoring') {
    for (const key of ['hostOps', 'allowedOperations']) {
      if (execution[key] !== undefined && (!Array.isArray(execution[key]) || (execution[key] as unknown[]).length !== 0)) return false;
    }
  } else {
    if (execution.hostOps !== undefined) return false;
    if (!Array.isArray(execution.allowedOperations)) return false;
    const allowed = execution.allowedOperations as unknown[];
    const isExplicitEmpty = allowed.length === 0;
    const isLoaderDefault = allowed.length === hostOperations.length &&
      hostOperations.every((operation, index) => allowed[index] === operation);
    if (!isExplicitEmpty && !isLoaderDefault) return false;
  }
  return true;
}

export function isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(
  rawAbility: RuleNode,
  form: 'authoring' | 'compiled' = 'authoring',
): boolean {
  if (str(rawAbility.kind) !== 'passive') return false;
  const responseWindow = node(rawAbility.responseWindow);
  const responseKeys = Object.keys(responseWindow);
  const responseAccepted = form === 'authoring'
    ? responseKeys.length === 0
    : responseWindow.order === 'turn_order' && responseWindow.passBehavior === 'decline_this_window' &&
      responseKeys.length === 2 && responseKeys.every((key) => ['order', 'passBehavior'].includes(key));
  const conditions = nodes(rawAbility.conditions);
  if (Object.keys(node(rawAbility.activation)).length !== 0 || conditions.length !== 1 ||
    str(conditions[0]?.type) !== 'source_owned' || !Object.keys(conditions[0]!).every((key) => key === 'type') ||
    nodes(rawAbility.targets).length !== 0 ||
    (Array.isArray(rawAbility.cost) ? nodes(rawAbility.cost).length !== 0 : rawAbility.cost !== undefined) ||
    nodes(rawAbility.effects).length !== 0 || nodes(rawAbility.creates).length !== 0 ||
    Object.keys(node(rawAbility.lifecycle)).length !== 0 || !responseAccepted ||
    Object.keys(node(rawAbility.limit)).length !== 0 || Object.keys(node(rawAbility.visibility)).length !== 0 ||
    (Array.isArray(rawAbility.markers) && rawAbility.markers.length !== 0) || rawAbility.copies !== undefined || rawAbility.transforms !== undefined) return false;
  const modifiers = nodes(rawAbility.ruleModifiers);
  if (modifiers.length !== 1) return false;
  const modifier = modifiers[0]!;
  const scope = node(modifier.scope); const where = nodes(scope.where);
  const value = node(modifier.value); const lifecycle = node(modifier.lifecycle); const priority = node(modifier.priority);
  if (modifier.operation !== 'add' || modifier.rule !== 'combat_power' ||
    str(scope.subject) !== 'players_at_source_battlefield' || where.length !== 1 ||
    str(where[0]?.type) !== 'round_active_attack_paid_cost_sum_is_highest' ||
    !Object.keys(where[0]!).every((key) => key === 'type') ||
    str(value.type) !== 'constant' || typeof value.value !== 'number' || value.value !== 6 || !Number.isSafeInteger(value.value) ||
    str(lifecycle.duration) !== 'permanent' || str(priority.tier) !== 'card_text' || str(priority.specificity) !== 'specific' ||
    str(modifier.conflictPolicy) !== 'higher_priority_wins') return false;
  if (!Object.keys(scope).every((key) => ['subject', 'where'].includes(key)) ||
    !Object.keys(value).every((key) => ['type', 'value'].includes(key)) ||
    !Object.keys(lifecycle).every((key) => key === 'duration') ||
    !Object.keys(priority).every((key) => ['tier', 'specificity'].includes(key)) ||
    !Object.keys(modifier).every((key) => ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle', 'priority', 'conflictPolicy'].includes(key))) return false;
  const execution = node(rawAbility.execution);
  if (str(execution.mode || 'automatic') !== 'automatic' ||
    !Object.keys(execution).every((key) => ['mode', 'hostOps', 'allowedOperations'].includes(key))) return false;
  if (form === 'authoring') {
    for (const key of ['hostOps', 'allowedOperations']) {
      if (execution[key] !== undefined && (!Array.isArray(execution[key]) || (execution[key] as unknown[]).length !== 0)) return false;
    }
  } else {
    if (execution.hostOps !== undefined || !Array.isArray(execution.allowedOperations)) return false;
    const allowed = execution.allowedOperations as unknown[];
    const isExplicitEmpty = allowed.length === 0;
    const isLoaderDefault = allowed.length === hostOperations.length && hostOperations.every((operation, index) => allowed[index] === operation);
    if (!isExplicitEmpty && !isLoaderDefault) return false;
  }
  return true;
}

const supportedTypes = new Set([
  'controller_alone_at_battlefield', 'claim_and_discard_location_events', 'any_enabled_location',
  'skill_zone_mana_at_least', 'played_with_basic_attack', 'draw_cards', 'play_selected_cards', 'base_power_at_most',
  'reveal_information', 'set_zone_visibility', 'look_at_deck_top', 'move_card', 'move_all_remaining',
  'shuffle_zone_into_deck', 'shuffle_deck', 'adjust_mana', 'adjust_victory_points', 'move_player', 'branch',
  'create_card', 'pay_mana', 'move_source_card', 'integer', 'lte', 'gt', 'exists_target', 'played_this_round',
  'or', 'and', 'not', 'not_card_type', 'is_attack', 'has_attribute', 'not_source_card', 'has_card_id',
  'source_card_in_zone', 'controller_at_location_kind', 'reachable_along_arrows', 'can_adjust_mana',
  'event_played_card_has_attribute', 'source_reversed', 'transform_event_source_card',
  'controller_won_battle', 'controller_sole_winner', 'controller_mana_at_least', 'min_mana',
  // New types for 5 servants
  'opponents_random_discard', 'lock_battlefield', 'exclude_from_terrain_and_external_effects',
  'choice', 'set_opponent_power_to_zero', 'forbid_opponents_noble_phantasm',
  'create_status', 'terrain_multiplier', 'controller_seat_in_first_half',
  'reduce_opponents_power', 'move_card_from_zone_to_skill', 'controller_at_battlefield',
  'controller_servant_revealed', 'choice_is', 'hide_servant_true_name', 'close_source_card',
  'controller_at_battlefield_with_exactly_one_opponent',
  'reverse_situation_event_power_modifiers', 'reverse_situation_and_event_power_modifiers',
  'controller_played_highest_cost_noble_phantasm_in_battle_this_round',
  'controller_strict_second_battle_power', 'defeat_highest_power_opponents',
  'highest_cost_noble_phantasm_cost_at_least', 'selected_count_at_least',
  'create_modifier', 'not_location_kind', 'power_bonus', 'card_not_on_board', 'not_card_id',
  // Master authoring adapters
  'record_master_directive', 'adjust_command_seals', 'set_mana', 'create_independent_deck',
  'draw_from_independent_deck', 'activate_card_by_id', 'replace_card_in_deck', 'return_card_by_definition',
  'movement_rule_override', 'deployment_rule_override', 'play_source_card',
  'attach_card_to_player_attack', 'append_only_rule', 'transfer_vp_to_owner',
  'look_at_match_deck_bottoms', 'swap_revealed_with_deck_bottom',
  'soul_drag_power_bonus', 'transform_to_return_silence_on_loss', 'return_silence_battle_start',
  'false_attendant_book_replacement', 'existing_attack_controlled_by_target', 'not_controller', 'at_battlefield',
  'same_battlefield_as_controller', 'owned_active_card_by_definition', 'deployed_this_round_at_controller_location', 'inspect_target_hand_optional_return_one_to_owner_deck',
  // Phase 3A resolution/data-flow infrastructure
  'remove_advantage_position', 'noop', 'fail_invariant', 'install_rule_override', 'provision_skill_cards',
  // FB2-27 Ruler seal relationship subsystem
  'grant_ruler_seals', 'ruler_copy_steal_guard', 'use_ruler_seal', 'least_ruler_binding_count', 'bound_by_controller_ruler_seal',
  // FB2-28 event-rule executable bridge
  'event_location_is_source_event_battlefield', 'combat_occurs_at_source_event_battlefield', 'move_source_event',
  'event_has_tag', 'event_in_set', 'move_event_card',
  // FB2-31 event-player relation conditions
  'event_player_is_controller', 'event_player_is_opponent', 'event_player_same_location_as_controller', 'event_mana_spent_at_least',
  'event_round_victory_points_gain_crosses',
  // FB2-52 exact next-round situation-benefit suppression family; whole-envelope gated below.
  NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT, SITUATION_SUPPRESSION_LUCK_PREDICATE,
  // FB2-53 exact two-stage basic-Strength -> opponent servant-skill face-down family; whole-envelope gated below.
  BASIC_STRENGTH_ATTACK_CONSTRAINT, SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT, SET_SELECTED_CARD_FACE_DOWN_EFFECT,
  // FB2-54 exact event-power / uncontested-win reward family; whole-envelope gated below.
  SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT, EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION,
  // F4 B01 bounded passive/modifier batch vocabulary; whole-envelope gated below.
  BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER, BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST, 'target_printed_base_power',
  // F4 B02 source-owned passive/modifier batch vocabulary; whole-envelope gated below.
  B02_VICTORY_POINTS_IS_LOWEST,
  // F4 B03 bounded modifier/lifecycle batch vocabulary; whole-envelope gated below.
  B03_SCHEDULE_EFFECT, B03_EVENT_COMBAT_HAS_ATTRIBUTE,
  // F4 B04 bounded event/source-power/resource vocabulary; whole-envelope gated below.
  B04_FIRST_MOVEMENT_CONDITION, B04_FIRST_MOVEMENT_SOURCE_POWER_EFFECT, B04_ROUND_DOUBLE_EFFECT, B04_EVENT_PLAYER_MANA_EFFECT, B04_SAME_LOCATION_MANA_EFFECT,
  // F4 B05 bounded event/resource/lifecycle vocabulary; whole-envelope gated below.
  B05_CONTROLLER_MANA_BELOW_TWO_CONDITION, B05_EVENT_LOCATION_IS_WORKSHOP_CONDITION, B05_OTHER_NON_WORKSHOP_BATTLEFIELD_ENTRY_CONDITION,
  B05_DEPLOYMENT_RESOURCE_EXCHANGE_EFFECT, B05_TRANSFER_VP_ARM_ROUND_CLOSE_EFFECT, B05_SOURCE_TRIGGERED_THIS_ROUND_CONDITION, B05_CLOSE_TRIGGERED_SOURCE_EFFECT,
  // F4 B06 bounded card-play/combat/event-burst vocabulary; whole-envelope gated below.
  B06_SOURCE_PLAYED_FACE_UP_CONDITION, B06_ARM_ROUND_PUNISHMENT_EFFECT, B06_SOURCE_ARMED_THIS_ROUND_CONDITION,
  B06_PUNISH_BATTLE_LOSERS_EFFECT, B06_EVENT_BURST_EFFECT,
  // M50 generic structured-skill primitives ported from the locked Reference runtime.
  'phase_is', 'player_flag_equals', 'linked_player_flag_same_battlefield', 'player_flag_number_at_least', 'player_flag_number_current_round', 'player_flag_number_not_current_round',
  'player_flag_number_equals_event_field', 'player_flag_number_not_event_field',
  'event_definition_is_self', 'event_face_is', 'event_eliminated_same_battlefield_player', 'set_player_flag', 'clear_player_flag', 'add_status', 'remove_status', 'add_linked_status', 'remove_linked_status', 'gain_mana', 'transfer_mana', 'gain_victory_points', 'transfer_victory_points', 'gain_victory_points_per_target', 'gain_current_battlefield_competition_reward', 'pay_victory_points', 'if_condition', 'info_note',
  'combat_power_bonus', 'multiply_deployment_bonus', 'source_card_power_bonus', 'add_card_cost_modifier', 'return_cards_by_definitions', 'exile_source_card', 'sequester_random_inactive_servant_skill', 'remove_selected_cards', 'remove_cards_in_zone', 'close_selected_card', 'lose_victory_points', 'card_count_at_least', 'selected_cards_all_have_attribute',
  'activate_owned_skill_card', 'deactivate_owned_skill_card', 'create_card_instances', 'copy_selected_card', 'join_source_card_to_attack', 'double_source_base_power_remove_after_battle', M50_CLOSE_SELECTED_FACE_DOWN_ATTACKS, M50_DRAW_AND_PLAY_FACE_DOWN, 'discard_bottom_card', 'install_ability_rule_modifier', 'remove_owned_cards_by_linked_skill', 'retrigger_card_play_effects', 'current_round',
  'gain_mana_from_selected_card_base_power', 'gain_victory_points_if_selected_card_base_power_greater', 'transfer_selected_cards', 'transfer_matching_cards', 'discard_all_hand', 'lose_mana', 'lose_victory_points_per_matching_cards', 'event_count_at_least', 'move_selected_events', 'swap_selected_event_locations', 'replace_selected_event_from_deck',
  'close_owned_active_cards_by_definition', 'move_matching_events', M50_BATTLE_TERMINAL_ACTIVE_ATTACK_VP_ATTRITION,
  'add_player_flag_number', 'finish_game', 'event_location_is', 'situation_forbids_attribute',
  'clear_player_status_and_source_card_power_bonus', 'event_scouting_rewarded_controller',
  'ensure_event_deck_count', 'shuffle_event_deck', 'location_in', 'claim_all_location_advantages',
  'engaged_opponent_victory_points_greater_than_controller',
  M50_PLAYER_FLAG_GREATER_THAN_MANA_RATIO,
  'mana_at_least', 'location_is', 'current_situation_id_is', 'same_location_player_count_equals', 'round_victory_points_gained_equals', 'face_up_cards_played_this_round_at_least',
  'has_status', 'lacks_status', 'command_seals_at_least', 'command_seals_less_than_controller', 'can_pay_mana', 'can_effect_move_to_controller_location', 'target_command_seals_at_most', 'target_command_seals_equals', 'lacks_linked_skill_card', 'victory_points_not_first', 'victory_points_is_first', 'lose_command_seals', 'pay_command_seals', 'scheduled_payload_present',
  'choose_cards', 'choose_one', 'choose_locations', 'choose_events', 'choose_players', 'choose_each_player_option', 'move_selected_cards',
  'constant', 'metric', 'metric_compare', 'payload_count', 'payload_number', 'payload_number_plus', 'formula', 'target_count_at_least', 'target_count_equals',
  // FB2-32 source-state conditions
  'source_active', 'source_owned', 'source_owned_live', 'source_revealed',
  // FB2-33 event combat outcome conditions
  'event_player_won_combat', 'event_player_lost_combat',
  // FB2-43 exact movement-event location relation condition
  'event_location_equals_controller',
  // FB2-45 exact action-phase pre-battle defeat selector/effect tokens; gated by whole-ability classifier below.
  'defeat_player', 'no_attack_played_this_round_with_attribute',
  // FB2-46 exact battle-loss VP -> same-result winners transaction; gated by whole-ability classifier below.
  BATTLE_LOSS_VP_WINNER_REWARD_EFFECT, COMBAT_OPPONENT_POWER_VP_REWARD_EFFECT, OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT,
  OPPONENT_CLOSE_ONE_NON_RESIDUAL_EFFECT, SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT,
  // FB2-29 source-owner relational power/return primitives
  'adjust_round_total_power', 'schedule_source_card_return',
  // FB2-39 exact game-start player-status assignment
  'add_status',
]);
const formulaOps = new Set(['const', 'var', 'add', 'multiply', 'floor_divide', 'ceil_divide', 'min', 'max', 'abs', 'count_cards', 'gt', 'lte']);
const triggers = new Set(['on_use_declared', 'on_card_played', 'controller_action_window', 'controller_combat_action_window',
  'after_battle_result_determined', 'after_controller_wins_battle', 'after_controller_gains_victory', 'when_formula_condition_met',
  // New triggers for 5 servants
  'after_controller_loses_battle', CONTROLLER_DEFEATED_TRIGGER, 'while_active', 'when_power_calculation_applied',
  'after_battle_ended', 'after_player_deployed_to_battlefield', 'when_play_requirements_checked',
  // Master triggers
  'game_start', 'm50_skill_unlocked', 'm50_card_exiled', 'm50_servant_true_name_revealed', 'm50_player_mana_spent', 'after_controller_enters_location', 'after_controller_loses_all_command_seals',
  'round_end', 'after_controller_first_loses_battle', 'after_battle_power_calculated',
  'before_situation_or_event_resolves', 'when_movement_options_requested',
  OPPONENT_ROUND_VP_GAIN_TRIGGER,
  // M50 server-scheduled synthetic trigger. This never fires from untrusted input; the interpreter dispatches it only from an armed schedule.
  'm50_round_started',
]);
const mechanicKeys = new Set(['type', 'id', 'printedClause', 'scope', 'subject', 'owner', 'player', 'target', 'amount', 'count',
  'lossAmount', 'winnerRewardAmount',
  'resultZone', 'visibility', 'to', 'from', 'optional', 'excluding', 'branches', 'if', 'then', 'else', 'cardId', 'zone',
  'var', 'op', 'args', 'left', 'right', 'formula', 'formulaRef', 'printedExpression', 'constraints', 'value', 'min', 'max',
  'targetRef', 'resultVar', 'optionalCost', 'uses', 'conditions', 'locationKind', 'maxSteps', 'cardType', 'face', 'attribute', 'sourceCard',
  'object', 'controller', 'location', 'negated', 'tier', 'specificity',
  'source', 'interpretation', 'name', 'note',
  // New mechanic keys for 5 servants
  'options', 'label', 'condition', 'targets', 'duration', 'scope', 'statusId', 'choiceId', 'value',
  'modifier', 'kind', 'rule',
  // Master mechanic keys
  'directive', 'payload', 'deckId', 'definitionId', 'linkedSkillId', 'destination', 'createIfMissing', 'active', 'residual', 'quantity', 'rounding', 'targetPlayer',
  'oncePerRound', 'replacement', 'deckKinds', 'revealedKind', 'targetKind', 'controllerCannotWinStatus',
  'returnAtRoundEnd', 'preserveVictoryPoints', 'sakuraMasterId', 'fallbackServantPool',
  // Phase 3A resolution/data-flow infrastructure
  'bind', 'expr', 'binding', 'field', 'valueType', 'ids', 'reason', 'message', 'enabled', 'regular', 'climax', 'threshold', 'phase', 'targetDefinitionIds',
  // FB2-27 Ruler seal structural fields
  'policy', 'option', 'moveDestinations', 'rewardVp',
  // FB2-28 event-rule source semantics
  'eventController', 'locationId', 'locationRef', 'ruleControllerPlayerId', 'zones', 'tag', 'eventSetId',
  // FB2-29 exact relational fields
  'recipients', 'recipient', 'dedupe',
  // FB2-39 opaque player-status key
  'status', 'situationId',
  // M50 generic structured-skill state/selection fields.
  'key', 'numerator', 'denominator', 'offset', 'selectionRef', 'payloadKey', 'minCount', 'maxCount', 'allowCancel', 'skipIfNoCandidates', 'candidateTarget', 'candidateConditions',
  'allowedLocationIds', 'excludeCurrent', 'adjacentOnly', 'forwardOnly', 'minForwardSteps', 'maxForwardSteps', 'sourceZone', 'sourceZones', 'allowedSourceZones', 'fromZone', 'payCost', 'movementKind',

  'definitionIds', 'basicOnly', 'attackOnly', 'activeOnly', 'playableOnly', 'distinctBasePower', 'totalPlayCostAtMostMana', 'matchesControlledAttack', 'attackZoneActiveOnly', 'attackZoneNonSkillOnly',
  'sameBasePowerAsPayloadKey', 'sameAttributeAsPayloadKey', 'captureCardPowerFromPayloadKey', 'payloadVariableKey', 'position', 'recordChoice', 'ignoreEngagement', 'attributesAny', 'attributesAll',
  'metric', 'operator', 'multiply', 'add', 'multiplier', 'locationIds', 'leftPayloadKey', 'rightPayloadKey', 'maxTotal', 'ownerScope', 'attributes', 'nonResidualOnly', 'whenOtherWinnerControlsOrHasSkillDefinitionId',
  'countTarget', 'amountPerTarget', 'amountPerCard', 'sourceTarget', 'flagKey', 'maxAmount', 'temporary', 'abilityId', 'triggerEventType', 'triggerRoundOffset', 'expiresAfterRoundOffset', 'once', 'capturePayloadKeys',
  'deferPreflight', 'topCount', 'unpreventable', 'closeSourceWhenHandEmpty', 'nextRoundVictoryPointGainMultiplier', 'returnOn', 'requireExact', 'modifierId', 'installation', 'skillDefinitionIdsFromSelectedCard',
  'residualOnly', 'countFormula', 'victoryPoints',
  // M50 nested structured-choice/effect envelopes. Runtime consumes option.effects
  // and effect.lifecycle explicitly; allowing the keys does not make new types valid.
  'effects', 'lifecycle', 'expiresOn', 'cleanup',
  // FB2-45 nested exact target predicate list.
  'where',
]);

/** Load an object or JSON text. Unsupported mechanics are retained as report entries and disabled. */
export function loadAuthoringJson(input: unknown): AuthoringPack {
  const root = node(typeof input === 'string' ? JSON.parse(input) : structuredClone(input));
  if (root.schemaVersion !== 'fd-card-authoring-v1' || !Array.isArray(root.cards) || !str(root.id)) throw new Error('Invalid authoring archive');
  const report: AdapterReportEntry[] = [];
  const cards: Record<string, AuthoringCard> = Object.create(null) as Record<string, AuthoringCard>;
  for (const raw of nodes(root.cards)) {
    const cardId = str(raw.id);
    if (!cardId || cards[cardId] || !Array.isArray(raw.abilities)) throw new Error('Invalid or duplicate card definition');
    const collectResultVars = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap(collectResultVars);
      if (!value || typeof value !== 'object') return [];
      const n = node(value);
      return [str(n.resultVar), ...Object.values(n).flatMap(collectResultVars)].filter(Boolean);
    };
    const boundVariables = new Map(nodes(raw.abilities).map(a => [str(a.id), [
      ...nodes(Array.isArray(a.cost) ? a.cost : a.cost ? [a.cost] : []).filter(c => c.type === 'pay_mana').map(c => str(node(c.amount).var)).filter(Boolean),
      ...collectResultVars(a.effects),
      ...collectResultVars(a.creates),
    ]]));
    const issue = (path: string, reason: string, abilityId?: string, status: ExecutionMode = 'unsupported') => {
      report.push({ cardId, ...(abilityId ? { abilityId } : {}), path, status, reason,
        suggestedImplementation: 'Add a validated handler and behavioral tests for this field before enabling automation.' });
    };
    const scan = (value: unknown, path: string, abilityId?: string): void => {
      if (Array.isArray(value)) { value.forEach((v, i) => scan(v, `${path}[${i}]`, abilityId)); return; }
      if (!value || typeof value !== 'object') return;
      const n = node(value);
      if (n.type === 'player_flag_number_not_current_round' && (n.key === 'combatWinRound' || n.key === 'combatLossRound')) {
        if (!path.startsWith('conditions')) issue(path, n.key === 'combatWinRound'
          ? 'Current-round combat-win absence condition is supported only under ability conditions'
          : 'Current-round combat-loss absence condition is supported only under ability conditions', abilityId);
        else if (!isAcceptedCurrentRoundCombatLossAbsenceCondition(n) && !isAcceptedCurrentRoundCombatWinAbsenceCondition(n)) {
          issue(path, n.key === 'combatWinRound'
            ? 'Unsupported current-round combat-win absence condition shape'
            : 'Unsupported current-round combat-loss absence condition shape', abilityId);
        }
        return;
      }
      if (n.type === 'add_status' && !path.startsWith('effects')) {
        issue(path, 'Player-status assignment is supported only by the exact game-start effect envelope', abilityId);
      }
      const fb252Keys = n.type === NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT
        ? ['type', 'target', 'roundOffset', 'benefits']
        : n.type === SITUATION_SUPPRESSION_LUCK_PREDICATE
          ? ['type', 'definitionIds', 'zones', 'activeOnly', 'face']
          : [];
      const rawAbility = abilityId ? nodes(raw.abilities).find((candidate) => str(candidate.id) === abilityId) : undefined;
      const b03ExtraKeys = rawAbility && isB03ModifierLifecycleCandidate(rawAbility as unknown as AuthoringAbility)
        ? ['abilityId', 'triggerEventType', 'triggerRoundOffset', 'fromLocationIds', 'definitionIds', 'attributesAny']
        : [];
      for (const key of Object.keys(n)) if (!mechanicKeys.has(key) && !fb252Keys.includes(key) && !b03ExtraKeys.includes(key)) issue(`${path}.${key}`, 'Unmapped mechanic field', abilityId);
      if (n.type && !supportedTypes.has(str(n.type))) issue(`${path}.type`, `Unmapped type: ${str(n.type)}`, abilityId);
      if (n.type === 'metric' && n.metric === 'round_number' &&
          (n.source !== 'controller' || Object.keys(n).some((key) => !['type', 'metric', 'source'].includes(key)))) {
        issue(path, 'Round-number metric requires exact controller source shape', abilityId);
      }
      if (['event_count_at_least', 'choose_events'].includes(str(n.type)) && n.visibility !== undefined && !['up', 'down'].includes(str(n.visibility))) {
        issue(`${path}.visibility`, 'Structured event visibility must be up or down', abilityId);
      }
      if (['swap_selected_event_locations', 'replace_selected_event_from_deck'].includes(str(n.type))) {
        if (typeof n.payloadKey !== 'string' || !n.payloadKey || Object.keys(n).some((key) => !['type', 'payloadKey'].includes(key))) {
          issue(path, 'Structured selected-event mutation requires exact type + payloadKey shape', abilityId);
        }
      }
      if (['mana_at_least', 'location_is', 'same_location_player_count_equals', 'round_victory_points_gained_equals', 'face_up_cards_played_this_round_at_least'].includes(str(n.type))) {
        const allowed = n.type === 'mana_at_least' ? ['type','amount'] : n.type === 'location_is' ? ['type','locationId'] : n.type === 'face_up_cards_played_this_round_at_least' ? ['type','count'] : ['type','value'];
        if (Object.keys(n).some((key) => !allowed.includes(key))) issue(path, 'Unsupported structured condition shape', abilityId);
        const numeric = n.type === 'mana_at_least' ? n.amount : n.type === 'face_up_cards_played_this_round_at_least' ? n.count : n.type === 'location_is' ? undefined : n.value;
        if (n.type === 'location_is') { if (typeof n.locationId !== 'string' || !n.locationId) issue(path, 'Structured location condition requires locationId', abilityId); }
        else if (!Number.isSafeInteger(numeric) || Number(numeric) < 0) issue(path, 'Structured condition requires a nonnegative safe integer', abilityId);
      }
      if (n.type === 'can_pay_mana') {
        if (!path.includes('.candidateConditions[') || !Number.isSafeInteger(n.amount) || Number(n.amount) < 0 ||
            Object.keys(n).some((key) => !['type', 'amount'].includes(key))) {
          issue(path, 'Unsupported candidate mana-payment condition shape', abilityId);
        }
      }
      if (n.type === 'can_effect_move_to_controller_location' &&
          (!path.includes('.candidateConditions[') || Object.keys(n).some((key) => key !== 'type'))) {
        issue(path, 'Unsupported candidate effect-movement condition shape', abilityId);
      }
      if (n.type === 'lacks_linked_skill_card') {
        const zones = Array.isArray(n.zones) ? n.zones : [];
        const allowedZones = new Set(['attack', 'attack_area', 'servant-skills', 'master-skills', 'skill', 'hand', 'deck', 'discard', 'removed', 'removed_from_game']);
        if (!path.includes('.candidateConditions[') || typeof n.linkedSkillId !== 'string' || !n.linkedSkillId || !zones.length ||
            zones.some((zone) => typeof zone !== 'string' || !allowedZones.has(zone)) ||
            Object.keys(n).some((key) => !['type', 'linkedSkillId', 'zones'].includes(key))) {
          issue(path, 'Unsupported candidate linked-skill absence condition shape', abilityId);
        }
      }
      if (n.type === 'victory_points_not_first') {
        if (!path.includes('.candidateConditions[') || Object.keys(n).some((key) => key !== 'type')) {
          issue(path, 'Unsupported candidate victory-point rank condition shape', abilityId);
        }
      }
      if (n.type === 'victory_points_is_first') {
        if (!path.startsWith('conditions') || Object.keys(n).some((key) => key !== 'type')) {
          issue(path, 'Unsupported victory-point first-place condition shape', abilityId);
        }
      }
      if (['target_command_seals_at_most', 'target_command_seals_equals'].includes(str(n.type)) &&
          (!path.includes('conditions') || !Number.isSafeInteger(n.value) || Number(n.value) < 0 || Object.keys(n).some((key) => !['type','target','value'].includes(key)))) {
        issue(path, 'Pre-loss command-seal condition requires exact shape', abilityId);
      }
      if (n.type === 'lose_command_seals' &&
          (!path.startsWith('effects') || n.amount === undefined || typeof n.amount === 'string' || typeof n.amount === 'boolean' || Object.keys(n).some((key) => !['type','target','amount','then'].includes(key)))) {
        issue(path, 'Command-seal loss effect requires exact shape', abilityId);
      }
      if (n.type === 'choose_each_player_option') {
        const target = node(n.candidateTarget); const scope = str(target.scope); const options = nodes(n.options);
        const optionIds = options.map((option) => str(option.id));
        const nestedChoice = options.some((option) => nodes(option.effects).some((entry) =>
          ['choose_each_player_option','choose_cards','choose_one','choose_locations','choose_events','choose_players'].includes(str(entry.type))));
        if (!path.startsWith('effects') || !['same_location_opponents','same_battlefield_opponents','all_opponents'].includes(scope) ||
            Object.keys(target).some((key) => key !== 'scope') || options.length < 2 || options.length > 8 ||
            optionIds.some((id) => !id) || new Set(optionIds).size !== optionIds.length || nestedChoice ||
            options.some((option) => Object.keys(option).some((key) => !['id','label','effects'].includes(key)) ||
              (option.label !== undefined && typeof option.label !== 'string') || !Array.isArray(option.effects)) ||
            (n.candidateConditions !== undefined && !Array.isArray(n.candidateConditions)) ||
            (n.skipIfNoCandidates !== undefined && n.skipIfNoCandidates !== true && n.skipIfNoCandidates !== false) ||
            Object.keys(n).some((key) => !['type','candidateTarget','options','candidateConditions','skipIfNoCandidates'].includes(key))) {
          issue(path, 'Unsupported structured each-player option shape', abilityId);
        }
      }
      if (n.type === 'choose_players') {
        const minCount = Number(n.minCount ?? 1); const maxCount = Number(n.maxCount ?? 1);
        const target = n.candidateTarget; const scope = typeof target === 'string' ? target : str(node(target).scope);
        const allowedScopes = ['all_opponents','same_location_opponents','same_battlefield_opponents','engaged_opponents','event_combat_opponents'];
        if (!path.startsWith('effects') || minCount !== 1 || maxCount !== 1 || !allowedScopes.includes(scope) ||
            (n.allowCancel !== undefined && n.allowCancel !== false) ||
            (n.skipIfNoCandidates !== undefined && n.skipIfNoCandidates !== true && n.skipIfNoCandidates !== false)) {
          issue(path, 'Unsupported structured single-player choice shape', abilityId);
        }
      }
      if (n.type === 'choose_cards' && n.totalPlayCostAtMostMana !== undefined && n.totalPlayCostAtMostMana !== true) {
        issue(`${path}.totalPlayCostAtMostMana`, 'Structured total play-cost bound must be literal true', abilityId);
      }
      if (['add_linked_status', 'remove_linked_status'].includes(str(n.type)) &&
          (!path.startsWith('effects') || typeof n.status !== 'string' || !n.status || Object.keys(n).some((key) => !['type','target','status'].includes(key)))) {
        issue(path, 'Structured linked-status effect shape is invalid', abilityId);
      }
      if (n.type === 'lose_victory_points_per_matching_cards') {
        const ids = Array.isArray(n.definitionIds) ? n.definitionIds : [];
        if (!path.startsWith('effects') || n.target !== 'all_players' || n.zone !== 'discard' || !ids.length || new Set(ids).size !== ids.length ||
            ids.some((id) => typeof id !== 'string' || !id) || !Number.isSafeInteger(n.amountPerCard) || Number(n.amountPerCard) < 0 ||
            !Number.isSafeInteger(n.maxAmount) || Number(n.maxAmount) < 0 ||
            Object.keys(n).some((key) => !['type','target','zone','definitionIds','amountPerCard','maxAmount'].includes(key))) {
          issue(path, 'Structured matching-card VP loss requires exact discard-zone shape', abilityId);
        }
      }
      if (n.type === 'transfer_matching_cards') {
        const ids = Array.isArray(n.definitionIds) ? n.definitionIds : [];
        if (!path.startsWith('effects') || n.sourceTarget !== 'all_players' || n.target !== 'controller' || n.zone !== 'discard' || n.destination !== 'hand' ||
            !ids.length || new Set(ids).size !== ids.length || ids.some((id) => typeof id !== 'string' || !id) ||
            Object.keys(n).some((key) => !['type','sourceTarget','target','zone','destination','definitionIds'].includes(key))) {
          issue(path, 'Structured matching-card transfer requires exact discard-to-hand shape', abilityId);
        }
      }
      if (n.type === 'sequester_random_inactive_servant_skill') {
        const target = node(n.target);
        if (!path.startsWith('effects') || target.scope !== 'event_defeated_players' || n.returnOn !== 'controller_elimination' ||
            Object.keys(target).some((key) => key !== 'scope') || Object.keys(n).some((key) => !['type','target','returnOn'].includes(key))) {
          issue(path, 'Structured servant-skill sequestration requires exact shape', abilityId);
        }
      }
      if (n.type === 'exile_source_card' && (!path.startsWith('effects') || Object.keys(n).some((key) => key !== 'type'))) {
        issue(path, 'Structured exile-source-card effect must contain only type', abilityId);
      }
      if (n.type === 'transfer_mana') {
        const from = node(n.from ?? n.source);
        const creatorShape = from.scope === 'source_card_creator' && typeof from.linkedSkillId === 'string' && !!from.linkedSkillId &&
          Object.keys(from).every((key) => ['scope','linkedSkillId'].includes(key)) && n.requireExact === true;
        const selectedPlayerShape = (n.from ?? n.source) === 'selected_player' && n.requireExact === undefined;
        if (!path.startsWith('effects') || (!creatorShape && !selectedPlayerShape) || n.target !== 'controller' ||
            !Number.isSafeInteger(n.amount) || Number(n.amount) < 0 ||
            Object.keys(n).some((key) => !['type','from','source','target','amount','requireExact'].includes(key))) {
          issue(path, 'Structured mana transfer requires exact creator or selected-player shape', abilityId);
        }
      }
      if (n.type === 'remove_owned_cards_by_linked_skill') {
        const zones = Array.isArray(n.zones) ? n.zones : [];
        if (!path.startsWith('effects') || n.target !== 'controller' || typeof n.linkedSkillId !== 'string' || !n.linkedSkillId ||
            zones.length !== 1 || zones[0] !== 'skill' || Object.keys(n).some((key) => !['type','target','linkedSkillId','zones'].includes(key))) {
          issue(path, 'Structured linked-skill cleanup requires exact controller skill-zone shape', abilityId);
        }
      }
      if (n.type === 'transfer_victory_points') {
        const target = node(n.target); const amount = node(n.amount);
        if (!path.startsWith('effects') || n.from !== 'controller' || target.scope !== 'source_card_creator' || typeof target.linkedSkillId !== 'string' || !target.linkedSkillId ||
            Object.keys(target).some((key) => !['scope','linkedSkillId'].includes(key)) || amount.type !== 'metric' || amount.metric !== 'source_card_current_power' ||
            Object.keys(amount).some((key) => !['type','metric'].includes(key)) || Object.keys(n).some((key) => !['type','from','source','target','amount'].includes(key))) {
          issue(path, 'Structured creator victory-point transfer requires exact source-power shape', abilityId);
        }
      }
      if (n.type === 'join_source_card_to_attack') {
        const zones = Array.isArray(n.allowedSourceZones) ? n.allowedSourceZones : [];
        if (!path.includes('.grantAbilities[') || JSON.stringify(zones) !== JSON.stringify(['hand', 'skill']) ||
            Object.keys(n).some((key) => !['type','allowedSourceZones'].includes(key))) {
          issue(path, 'Structured source-card combat join is reserved to the exact M50 granted-card envelope', abilityId);
        }
      }
      if (n.type === 'double_source_base_power_remove_after_battle') {
        if (!path.includes('.grantAbilities[') || Object.keys(n).some((key) => key !== 'type')) {
          issue(path, 'Structured source-card base-power doubling is reserved to the exact M50 granted-card envelope', abilityId);
        }
      }
      if (n.type === 'discard_bottom_card') {
        if (!path.startsWith('effects') || typeof n.target !== 'string' || !n.target ||
            Object.keys(n).some((key) => !['type','target'].includes(key))) {
          issue(path, 'Structured bottom-card discard requires an exact selected-player target shape', abilityId);
        }
      }      if (n.type === 'copy_selected_card') {
        const lifecycle = node(n.lifecycle);
        const allowedKeys = ['type','id','printedClause','source','payloadKey','target','zone','face','active','temporary','lifecycle','residual'];
        const permanentAttack = n.target === 'selected_player' && n.zone === 'attack_area' && n.face === 'up' && n.active === true &&
          n.temporary === false && n.residual === true && lifecycle.duration === 'permanent' &&
          Object.keys(lifecycle).every((key) => key === 'duration');
        const temporarySkill = n.target === 'controller' && ['servant-skills','master-skills','skill'].includes(str(n.zone)) && n.face === 'up' && n.active === false &&
          n.temporary === true && n.residual === false && lifecycle.duration === 'this_round' && lifecycle.cleanup === 'remove_from_game' &&
          Object.keys(lifecycle).every((key) => ['duration','cleanup'].includes(key));
        if (!path.startsWith('effects') || n.source !== 'selected_card' || typeof n.payloadKey !== 'string' || !n.payloadKey ||
            Object.keys(n).some((key) => !allowedKeys.includes(key)) || (!permanentAttack && !temporarySkill)) {
          issue(path, 'Structured selected-card copy requires an exact accepted permanent-attack or temporary-skill shape', abilityId);
        }
      }
      if (n.type === M50_PLAYER_FLAG_GREATER_THAN_MANA_RATIO) {
        if (!path.includes('.where[') || !parseM50PlayerFlagManaRatioPredicate(n)) {
          issue(path, 'Structured player-flag/mana ratio predicate requires an exact positive-integer ratio under a target where-clause', abilityId);
        }
      }      if (n.type === 'selected_cards_all_have_attribute') {
        if (!path.startsWith('conditions') && !path.includes('.conditions') || typeof n.attribute !== 'string' || !n.attribute ||
            (n.payloadKey !== undefined && (typeof n.payloadKey !== 'string' || !n.payloadKey)) ||
            !Object.keys(n).every((key) => ['type','attribute','payloadKey'].includes(key))) {
          issue(path, 'Unsupported selected-card attribute condition shape', abilityId);
        }
      }
      if (n.type === 'add_card_cost_modifier') {
        const keys = Object.keys(n).sort();
        const expected = (n.maxTotal === undefined ? ['amount', 'definitionId', 'duration', 'id', 'type'] : ['amount', 'definitionId', 'duration', 'id', 'maxTotal', 'type']).sort();
        if (!path.startsWith('effects') || keys.length !== expected.length || keys.some((key, index) => key !== expected[index]) ||
            typeof n.id !== 'string' || n.id.length === 0 || typeof n.definitionId !== 'string' || n.definitionId.length === 0 ||
            n.duration !== 'game' || n.amount === undefined ||
            (n.maxTotal !== undefined && (!Number.isSafeInteger(n.maxTotal) || Number(n.maxTotal) < 0))) {
          issue(path, 'Unsupported structured card-cost modifier shape', abilityId);
        }
      }
      if (n.op && !formulaOps.has(str(n.op))) issue(`${path}.op`, `Unmapped formula: ${str(n.op)}`, abilityId);
      const serverMetric = ['controller.availableMana', 'controller.deployment_bonus', 'consecutive_play_rounds', 'game.round_number',
        'source_card_active_round_count', 'controller.movement_distance_this_round',
        'controller.battlefields_passed_or_stayed_this_round'].includes(str(n.var ?? n.name));
      if ((n.var !== undefined || n.op === 'var') && !serverMetric &&
        !(abilityId && boundVariables.get(abilityId)?.includes(str(n.var ?? n.name)))) {
        issue(`${path}.var`, `Unbound server metric or variable: ${str(n.var ?? n.name)}`, abilityId);
      }
      if (n.formulaRef && n.formulaRef !== 'cardFace.basePower') issue(`${path}.formulaRef`, 'Unmapped formula reference', abilityId);
      if (n.owner && n.owner !== 'controller') issue(`${path}.owner`, 'Only controller ownership is supported', abilityId);
      if (n.player && n.player !== 'controller') issue(`${path}.player`, 'Only controller resource/movement effects are supported', abilityId);
      if (n.type === 'reveal_information' && n.subject !== 'controller.servant') issue(`${path}.subject`, 'Only controller servant reveal is supported', abilityId);
      if (['adjust_mana', 'adjust_victory_points', 'pay_mana', 'can_adjust_mana'].includes(str(n.type)) &&
        (n.amount === undefined || typeof n.amount === 'string' || typeof n.amount === 'boolean')) issue(`${path}.amount`, 'Expected a numeric amount or controlled AST', abilityId);
      if (n.type === 'move_card' && !str(n.target)) issue(`${path}.target`, 'Card movement requires a declared target reference', abilityId);
      if (n.resultVar && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(str(n.resultVar))) issue(`${path}.resultVar`, 'Result variable must be a stable identifier', abilityId);
      if (n.type === 'move_player' && !str(n.to) && !str(n.locationId)) issue(`${path}.to`, 'Player movement requires a destination target reference', abilityId);
      if (n.type === 'move_player' && n.movementKind !== undefined) {
        const exactEffectMove = path.includes('.effects') && n.target === 'decision_player' && n.to === 'controller_location' && n.movementKind === 'effect' &&
          Object.keys(n).every((key) => ['type', 'target', 'to', 'movementKind'].includes(key));
        if (!exactEffectMove) issue(path, 'Structured effect movement requires exact decision-player/controller-location shape', abilityId);
      }
      if (n.type === 'draw_cards') {
        const drawCount = n.count ?? n.amount;
        const drawCountValid = (Number.isSafeInteger(drawCount) && Number(drawCount) >= 0) || (!!drawCount && typeof drawCount === 'object');
        if (!drawCountValid) issue(`${path}.${n.count !== undefined ? 'count' : 'amount'}`, 'Draw count must be a nonnegative integer or controlled numeric AST', abilityId);
      }
      if (n.type === 'return_cards_by_definitions') {
        const definitionIds = Array.isArray(n.definitionIds) ? n.definitionIds : [];
        const uniqueIds = new Set(definitionIds);
        const count = n.count ?? 1; const minCount = n.minCount ?? count;
        const allowed = ['type','definitionIds','count','minCount','fromZone','destination','face','payloadKey','then'];
        if (!definitionIds.length || uniqueIds.size !== definitionIds.length || definitionIds.some((id) => typeof id !== 'string' || !id) ||
            !Number.isSafeInteger(count) || Number(count) < 0 || !Number.isSafeInteger(minCount) || Number(minCount) < 0 || Number(minCount) > Number(count) ||
            n.fromZone !== 'removed_from_game' || n.destination !== 'skill' || n.face !== 'up' ||
            (n.payloadKey !== undefined && (typeof n.payloadKey !== 'string' || !n.payloadKey)) ||
            Object.keys(n).some((key) => !allowed.includes(key))) {
          issue(path, 'Unsupported existing-card multi-definition return shape', abilityId);
        }
      }
      if (n.type === 'return_card_by_definition') {
        const hasDefinitionId = typeof n.definitionId === 'string' && n.definitionId.length > 0;
        const hasLinkedSkillId = typeof n.linkedSkillId === 'string' && n.linkedSkillId.length > 0;
        if (hasDefinitionId === hasLinkedSkillId) issue(`${path}.definitionId`, 'Definition return requires exactly one definitionId or linkedSkillId', abilityId);
        const masterReturn = n.target === 'controller' && n.destination === 'master-skills' && n.createIfMissing === true && n.face === 'up' && n.active === false &&
          Object.keys(n).every((key) => ['type', 'target', 'definitionId', 'linkedSkillId', 'destination', 'createIfMissing', 'face', 'active'].includes(key));
        const existingServantReturn = hasDefinitionId && !hasLinkedSkillId && n.target === undefined && n.fromZone === 'removed_from_game' &&
          n.destination === 'skill' && n.face === 'up' && n.createIfMissing === undefined && n.active === undefined &&
          Object.keys(n).every((key) => ['type', 'definitionId', 'fromZone', 'destination', 'face'].includes(key));
        const linkedSkillAttackReturn = !hasDefinitionId && hasLinkedSkillId && n.target === undefined && n.fromZone === 'skill' &&
          n.destination === 'attack_area' && n.face === 'up' && n.active === true && n.residual === false && n.createIfMissing === undefined &&
          Object.keys(n).every((key) => ['type', 'linkedSkillId', 'fromZone', 'destination', 'face', 'active', 'residual'].includes(key));
        if (!masterReturn && !existingServantReturn && !linkedSkillAttackReturn) {
          const masterLike = n.target === 'controller' || n.destination === 'master-skills' || n.createIfMissing === true ||
            n.active !== undefined || hasLinkedSkillId;
          issue(path, masterLike ? 'Unsupported controller master-skill definition-return shape' : 'Unsupported definition-return shape', abilityId);
        }
      }
      if (['event_player_is_controller', 'event_player_is_opponent', 'event_player_same_location_as_controller'].includes(str(n.type)) &&
        !Object.keys(n).every((key) => key === 'type')) {
        issue(path, 'Event-player relation condition must contain only type', abilityId);
      }
      if (n.type === 'event_mana_spent_at_least' &&
          (!Number.isSafeInteger(n.amount) || Number(n.amount) <= 0 || Object.keys(n).some((key) => !['type', 'amount'].includes(key)))) {
        issue(path, 'Mana-spent threshold condition requires exact positive integer amount shape', abilityId);
      }
      if (n.type === 'event_round_victory_points_gain_crosses') {
        if (path !== 'conditions[1]') {
          issue(path, 'Round VP-gain crossing condition is supported only in the exact FB2-51 condition slot', abilityId);
        }
        if (n.threshold !== 7 || !Object.keys(n).every((key) => ['type', 'threshold'].includes(key))) {
          issue(path, 'Round VP-gain crossing condition requires the literal threshold 7 and exact shape', abilityId);
        }
      }
      if (str(n.type) === B02_VICTORY_POINTS_IS_LOWEST) {
        if (path !== 'conditions[1]' || Object.keys(n).length !== 1) issue(path, 'Lowest-VP condition is reserved to the exact F4 B02 condition slot', abilityId);
      }
      if (['source_active', 'source_owned', 'source_owned_live'].includes(str(n.type))) {
        if (!path.startsWith('conditions')) issue(path, 'Source-state condition is supported only under ability conditions', abilityId);
        if (!Object.keys(n).every((key) => key === 'type')) issue(path, 'Source-state condition must contain only type', abilityId);
      }
      if (['event_player_won_combat', 'event_player_lost_combat'].includes(str(n.type))) {
        if (!path.startsWith('conditions')) issue(path, 'Event combat outcome condition is supported only under ability conditions', abilityId);
        if (!Object.keys(n).every((key) => key === 'type')) issue(path, 'Event combat outcome condition must contain only type', abilityId);
      }
      if (str(n.type) === 'event_location_equals_controller') {
        if (!path.startsWith('conditions')) issue(path, 'Event-location relation condition is supported only under ability conditions', abilityId);
        if (!isAcceptedEventLocationEqualsControllerCondition(n)) issue(path, 'Event-location relation condition must contain only type', abilityId);
      }
      if (str(n.type) === BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER) {
        if (!path.startsWith('conditions') || Object.keys(n).length !== 1) issue(path, 'Battlefield/controller relation requires exact condition shape', abilityId);
      }
      if (str(n.type) === BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST) {
        if (!path.startsWith('conditions') || n.count !== 2 || !Object.keys(n).every((key) => ['type', 'count'].includes(key))) {
          issue(path, 'Battle opponent-count condition requires literal count 2 and exact shape', abilityId);
        }
      }
      if (str(n.type) === 'target_printed_base_power') {
        if (!path.startsWith('ruleModifiers.value') || Object.keys(n).length !== 1) issue(path, 'Target printed-base-power metric is reserved to exact batch modifier value', abilityId);
      }
      if (n.type === SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT) {
        if (path !== 'effects[0]') issue(path, 'FB2-54 source-card combat-power bonus is supported only in the exact effect slot', abilityId);
        if (n.amount !== 2 || !Object.keys(n).every((key) => ['type', 'amount'].includes(key))) {
          issue(path, 'FB2-54 source-card combat-power bonus requires literal amount 2 and exact shape', abilityId);
        }
      }
      if (n.type === EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION) {
        if (path !== 'conditions[2]') issue(path, 'FB2-54 battle opponent-count condition is supported only in the exact condition slot', abilityId);
        if (n.count !== 0 || !Object.keys(n).every((key) => ['type', 'count'].includes(key))) {
          issue(path, 'FB2-54 battle opponent-count condition requires literal count 0 and exact shape', abilityId);
        }
      }
      if (n.type === 'base_power_at_most' && (typeof n.value !== 'number' || !Number.isFinite(n.value))) issue(`${path}.value`, 'Base power bound must be finite', abilityId);
      if (['move_card', 'move_source_card', 'move_all_remaining', 'create_card'].includes(str(n.type)) &&
        !['hand', 'deck', 'discard', 'field', 'skill', 'attack_area', 'removed_from_game'].includes(str(node(n.to).zone))) issue(`${path}.to.zone`, 'Unsupported or missing destination zone', abilityId);
      if (['move_source_event', 'move_event_card'].includes(str(n.type)) && !['event_deck', 'event_discard', 'event_outside_game', 'event_battlefield'].includes(str(node(n.to).zone))) {
        issue(`${path}.to.zone`, 'Unsupported or missing event destination zone', abilityId);
      }
      if (n.optionalCost && str(node(n.optionalCost).type) !== 'pay_mana') issue(`${path}.optionalCost`, 'Only optional mana payment is supported', abilityId);
      if (n.type === 'look_at_deck_top' && (n.resultZone !== 'looked_cards' || n.count === undefined)) issue(`${path}.resultZone`, 'Deck look requires a count and looked_cards temporary zone', abilityId);
      if (n.type === 'set_zone_visibility' && (n.visibility !== 'public' || n.zone !== 'discard')) issue(`${path}.visibility`, 'Only continuous public discard visibility is supported', abilityId);
      if (n.type === 'shuffle_zone_into_deck' && (node(n.from).zone !== 'discard' || node(n.to).zone !== 'deck')) issue(`${path}.from`, 'Only discard-to-deck shuffle is supported', abilityId);
      for (const [key, child] of Object.entries(n)) scan(child, `${path}.${key}`, abilityId);
    };
    const face = node(raw.cardFace);
    scan(face.cost, 'cardFace.cost'); scan(face.basePower, 'cardFace.basePower'); scan(face.requirements, 'cardFace.requirements');
    if (face.hasReversalEffect !== undefined && typeof face.hasReversalEffect !== 'boolean') issue('cardFace.hasReversalEffect', 'Expected boolean reversal metadata');
    if (face.revealsTrueNameOnReverse !== undefined && typeof face.revealsTrueNameOnReverse !== 'boolean') issue('cardFace.revealsTrueNameOnReverse', 'Expected boolean reverse reveal metadata');
    if (face.revealsTrueNameOnReverse === true && face.hasReversalEffect !== true) issue('cardFace.revealsTrueNameOnReverse', 'Reverse reveal requires an authored reversal effect');
    if (face.semanticCategory !== undefined && face.semanticCategory !== OUTER_GOD_LIFE_CATEGORY) issue('cardFace.semanticCategory', 'Unsupported semantic card category');
    if (typeof face.basePower === 'string') issue('cardFace.basePower', 'String expressions are forbidden; provide a formula AST');
    scan(raw.playRequirements, 'playRequirements');
    if (face.cost !== undefined && (typeof face.cost !== 'number' || !Number.isFinite(face.cost) || face.cost < 0)) issue('cardFace.cost', 'Expected a nonnegative printed mana cost');
    const timing = node(raw.playTiming);
    const initialPlacement = raw.initialPlacement;
    const owner = node(raw.owner);
    const rootId = str(root.id);
    const cardType = str(raw.cardType);
    const exactOwnedMasterSkill = cardType === 'master_skill' && rootId.startsWith('master.') &&
      ((!str(owner.type) && !str(owner.id)) || (owner.type === 'master' && owner.id === rootId));
    const exactOwnedServantSkill = cardType === 'servant_skill' && rootId.startsWith('servant.') &&
      owner.type === 'servant' && owner.id === rootId;
    if (initialPlacement !== undefined) {
      if (typeof initialPlacement !== 'string' || initialPlacement !== 'outside_game') {
        issue('initialPlacement', 'Only outside_game initial placement is supported');
      }
      if (!exactOwnedMasterSkill && !exactOwnedServantSkill) {
        issue('initialPlacement', 'Outside-game initial placement is supported only for an owned master_skill or owner-matching servant_skill');
      }
    }
    if (node(raw.verification).implementationStatus && node(raw.verification).implementationStatus !== 'complete') issue('verification.implementationStatus', 'Archive explicitly marks this card as unfinished');
    if (str(raw.cardType) !== 'event' && (timing.phase !== 'action' || timing.window !== 'controller_play_card_window')) issue('playTiming', 'Unsupported card play window');
    const seen = new Set<string>();
    const abilities = nodes(raw.abilities).map((a): AuthoringAbility => {
      const id = str(a.id); if (!id || seen.has(id)) throw new Error('Invalid or duplicate ability id'); seen.add(id);
      const activation = node(a.activation); const lifecycle = node(a.lifecycle);
      const m50Structured = Array.isArray(a.markers) && a.markers.includes('m50_structured_v1');
      const m50PermanentPlayerRuleAbility = m50Structured && nodes(a.ruleModifiers).length > 0 &&
        nodes(a.ruleModifiers).every((modifier) => isAcceptedM50PermanentPlayerRuleModifier(a as unknown as AuthoringAbility, modifier));
      const abilityKeys = new Set(['id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost',
        'ruleModifiers', 'creates', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution', 'copies', 'transforms']);
      for (const key of Object.keys(a)) if (!abilityKeys.has(key)) issue(key, 'Unmapped ability field', id);
      const execution = node(a.execution); const mode = str(execution.mode || 'automatic');
      if (!['automatic', 'host_adjudicated', 'unsupported', 'text_unconfirmed'].includes(mode)) issue('execution.mode', 'Invalid execution mode', id);
      if (activation.trigger && !triggers.has(str(activation.trigger))) issue('activation.trigger', 'Unmapped trigger', id);
      if (activation.phase && !['preparation', 'advance', 'action', 'combat'].includes(str(activation.phase))) issue('activation.phase', 'Unmapped phase', id);
      if (activation.requiresSourceState && activation.requiresSourceState !== 'active') issue('activation.requiresSourceState', 'Unmapped source state', id);
      if (activation.eventController !== undefined && !['placement_controller', 'event_player'].includes(str(activation.eventController))) {
        issue('activation.eventController', 'Unsupported event-rule controller source', id);
      }
      if (activation.eventLocationId !== undefined && (!str(activation.eventLocationId) || !['after_controller_enters_location', 'after_player_deployed_to_battlefield'].includes(str(activation.trigger)))) issue('activation.eventLocationId', 'Event location requires a supported location-bearing trigger', id);
      if (a.kind === 'phase_action' && !['controller_action_window', 'controller_combat_action_window'].includes(str(activation.opens))) issue('activation.opens', 'Unsupported phase action window', id);
      if (activation.step) issue('activation.step', 'Subphase step mapping is not implemented', id);
      if (!['phase_action', 'passive', 'residual', 'declaration_reveal', 'conditional_reveal', 'forced_trigger', 'optional_trigger', 'response', 'continuous_formula'].includes(str(a.kind))) issue('kind', 'Unmapped ability kind', id);
      const acceptedM50GrantedCardAbilitySource = m50Structured && isAcceptedM50GrantedCardAbilitySource(a);
      if ((a.copies || a.transforms) && !acceptedM50GrantedCardAbilitySource) issue('copies/transforms', 'Copy and transformation handlers are not implemented', id);
      if (lifecycle.starts && lifecycle.starts !== 'immediate') issue('lifecycle.starts', 'Only immediate lifecycle starts are supported', id);
      if (lifecycle.duration && !['round_count', 'while_card_active', 'while_active', 'this_round', 'until_card_closed'].includes(str(lifecycle.duration)) &&
          !(m50PermanentPlayerRuleAbility && lifecycle.duration === 'permanent')) issue('lifecycle.duration', 'Unmapped lifecycle', id);
      if (lifecycle.duration === 'round_count' && (!Number.isInteger(lifecycle.rounds) || Number(lifecycle.rounds) < 1)) issue('lifecycle.rounds', 'Expected positive round count', id);
      if (lifecycle.cleanup && !['expire_after_duration', 'when_card_leaves_active_area', 'remain_active', 'close_at_round_end', 'discard_at_round_end', 'remove_from_game'].includes(str(lifecycle.cleanup))) issue('lifecycle.cleanup', 'Unmapped cleanup', id);
      if (lifecycle.sourceValidity !== undefined) {
        const sourceValidity = node(lifecycle.sourceValidity);
        if (sourceValidity.kind !== 'accepted_source_state_policy' || sourceValidity.owner !== 'card_zone_source_state' ||
          sourceValidity.policyId !== ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID) {
          issue('lifecycle.sourceValidity', 'Unsupported Card Zone source-validity policy', id);
        }
        if (lifecycle.duration !== 'while_card_active' || !['when_card_leaves_active_area', 'remain_active'].includes(str(lifecycle.cleanup))) {
          issue('lifecycle.sourceValidity', 'Source-validity policy requires while_card_active with a supported source cleanup policy', id);
        }
      }
      const response = node(a.responseWindow);
      if (['optional_trigger', 'response'].includes(str(a.kind)) && !str(response.opens)) issue('responseWindow.opens', 'Explicit response window is required', id);
      if ((response.order && response.order !== 'turn_order') || (response.priority && response.priority !== 'turn_order')) issue('responseWindow.order', 'Only turn_order is supported', id);
      const limit = node(a.limit);
      if (limit.type === 'unique' && (limit.conflictPolicy !== 'only_one_effect_may_activate_per_window' || !str(limit.groupId))) issue('limit', 'Unmapped activation limit', id);
      else if (limit.type === 'per_game' && (!Number.isInteger(limit.uses) || Number(limit.uses) < 1 || str(limit.scope) !== 'this_card')) issue('limit', 'Per-game limits require positive uses and this_card scope', id);
      else if (limit.type === 'per_round' && (!Number.isInteger(limit.uses) || Number(limit.uses) < 1 || str(limit.scope) !== 'this_card')) issue('limit', 'Per-round limits require positive uses and this_card scope', id);
      else if (limit.type && !['unique', 'per_game', 'per_round'].includes(str(limit.type))) issue('limit', 'Unmapped activation limit', id);
      for (const field of ['effects', 'conditions', 'cost', 'creates']) scan(a[field], field, id);
      for (const effect of nodes(a.effects)) {
        if (effect.type === 'play_selected_cards') {
          const payloadKey = str(effect.payloadKey);
          const payloadProducer = payloadKey && nodes(a.effects).some(candidate =>
            candidate.type === 'choose_cards' && str(candidate.payloadKey) === payloadKey);
          const structuredPayloadPlay = !!payloadProducer && (!effect.target || effect.target === 'controller' || effect.target === 'self');
          const declaredTargetPlay = nodes(a.targets).some(t => t.id === effect.target && t.type === 'card_instance' && node(t.scope).zone === 'hand');
          if (!structuredPayloadPlay && !declaredTargetPlay) issue('effects.target', 'Effect play requires a declared card target or trusted structured-choice payload', id);
        }
        if (effect.type === 'move_event_card' && !nodes(a.targets).some(t => t.id === effect.target && t.type === 'event_card')) {
          issue('effects.target', 'Event movement requires a declared event-card target', id);
        }
        if (effect.type === 'move_source_event' && str(raw.cardType) !== 'event') {
          issue('effects.type', 'move_source_event is valid only on an event rule definition', id);
        }
      }
      for (const target of nodes(a.targets)) {
        if (!['card_instance', 'location', 'choice', 'player', 'event_card'].includes(str(target.type))) issue('targets.type', 'Unmapped target type', id);
        if (target.type !== 'choice') {
          scan(target.constraints, 'targets.constraints', id);
          if (target.type === 'location' && nodes(target.constraints).some(c => c.type === 'any_enabled_location') &&
            nodes(target.constraints).some(c => !['any_enabled_location', 'not_location_kind'].includes(str(c.type)))) {
            issue('targets.constraints', 'Any-location selection cannot silently ignore additional constraints', id);
          }
          const scope = node(target.scope);
          if (target.type === 'card_instance' && !['battle_area', 'attack_area', 'looked_cards', 'hand', 'deck', 'removed_from_game', 'discard', 'skill'].includes(str(scope.zone))) issue('targets.scope.zone', 'Unmapped target zone', id);
          if (target.type === 'event_card') {
            const rawZones = scope.zones;
            const zones = Array.isArray(rawZones) ? rawZones.map((zone) => str(zone)) : [];
            if (!zones.length || zones.some((zone) => !['event_deck', 'event_discard', 'event_outside_game', 'event_battlefield'].includes(zone))) {
              issue('targets.scope.zones', 'Event-card target requires one or more supported event zones', id);
            }
            for (const eventConstraint of nodes(target.constraints)) {
              if (eventConstraint.type === 'event_has_tag' && !str(eventConstraint.tag)) issue('targets.constraints.tag', 'Event tag constraint requires a nonempty tag', id);
              else if (eventConstraint.type === 'event_in_set' && !str(eventConstraint.eventSetId)) issue('targets.constraints.eventSetId', 'Event-set constraint requires a nonempty eventSetId', id);
              else if (!['event_has_tag', 'event_in_set'].includes(str(eventConstraint.type))) issue('targets.constraints', 'Unsupported event-card constraint', id);
            }
          }
          if (scope.owner && !['controller', 'any'].includes(str(scope.owner))) issue('targets.scope.owner', 'Only controller or any ownership is supported', id);
          if (scope.controller && !['self', 'any'].includes(str(scope.controller))) issue('targets.scope.controller', 'Only self or any controller targets are supported', id);
        }
        const count = node(target.count); const min = Number(count.min ?? 1); const max = Number(count.max ?? 1);
        if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || min > max) issue('targets.count', 'Invalid target cardinality', id);
      }
      const acceptedStaticCombatRewardDistribution = isAcceptedStaticCombatRewardDistributionAbility(a);
      const acceptedPaidCostCombatPower = isAcceptedRoundActiveAttackPaidCostCombatPowerAbility(a);
      const acceptedDeploymentDestinationReplacement = isAcceptedLowerVpLoneBattlefieldDeploymentAbility(a);
      const acceptedFaceUpCardsPerRound = isAcceptedStaticFaceUpCardsPerRoundAbility(a, 'authoring');
      const acceptedBatchPassiveFamily = isAcceptedBatchPassiveFamilyAbility(a as unknown as AuthoringAbility);
      const acceptedB02OwnedPassive = isAcceptedB02OwnedPassiveAbility(a as unknown as AuthoringAbility);
      const acceptedB03ModifierLifecycle = isAcceptedB03ModifierLifecycleAbility(a as unknown as AuthoringAbility);
      const acceptedM50StructuredStandardAppend = m50Structured && isAcceptedM50StructuredStandardAppendAbility(a as unknown as AuthoringAbility);
      const acceptedM50SourceBattlefieldLockdown = m50Structured && isAcceptedM50SourceBattlefieldLockdownAbility(a as unknown as AuthoringAbility);
      const acceptedM50LinkedPlayerCard = m50Structured && isAcceptedM50LinkedPlayerSameBattlefieldCardAbility(a as unknown as AuthoringAbility);
      const acceptedM50SourceSpecificVictoryPointGain = m50Structured && isAcceptedM50SourceSpecificVictoryPointGainAbility(a as unknown as AuthoringAbility);
      const acceptedM50OpponentDefeatCost = m50Structured && isAcceptedM50OpponentDefeatCostAbility(a as unknown as AuthoringAbility);
      const acceptedM50ConditionalCombatWinnerInclusion = m50Structured && isAcceptedM50ConditionalCombatWinnerInclusionAbility(a as unknown as AuthoringAbility);
      const acceptedM50BattleTerminalAttrition = m50Structured && isAcceptedM50BattleTerminalActiveAttackVpAttritionAbility(a as unknown as AuthoringAbility);
      const acceptedM50FaceDownAttackRule = m50Structured && isAcceptedM50FaceDownAttackRuleAbility(a as unknown as AuthoringAbility);
      const acceptedM50FaceDownAttackClose = m50Structured && isAcceptedM50FaceDownAttackCloseAbility(a as unknown as AuthoringAbility);
      const acceptedM50DrawAndPlayFaceDown = m50Structured && isAcceptedM50DrawAndPlayFaceDownAttackAbility(a as unknown as AuthoringAbility);
      if (nodes(a.effects).some((effect) => effect.type === M50_BATTLE_TERMINAL_ACTIVE_ATTACK_VP_ATTRITION) && !acceptedM50BattleTerminalAttrition) {
        issue('effects', 'Unsupported battle-terminal active-attack VP attrition shape', id);
      }
      if (nodes(a.effects).some((effect) => effect.type === M50_CLOSE_SELECTED_FACE_DOWN_ATTACKS) && !acceptedM50FaceDownAttackClose) {
        issue('effects', 'Unsupported face-down attack close-response shape', id);
      }
      if (nodes(a.effects).some((effect) => effect.type === M50_DRAW_AND_PLAY_FACE_DOWN) && !acceptedM50DrawAndPlayFaceDown) {
        issue('effects', 'Unsupported draw-and-play face-down attack shape', id);
      }
      const acceptedEffectInstalledCombatSettlement = isAcceptedEffectInstalledCombatSettlementBundle(nodes(a.ruleModifiers));
      const m50AdditiveCardAbility = nodes(a.ruleModifiers).length > 0 && nodes(a.ruleModifiers).every((modifier) =>
        isAcceptedM50AdditiveCardModifier(a as unknown as AuthoringAbility, modifier));
      const m50PermanentRuleBundle = m50Structured && nodes(a.ruleModifiers).length > 0 && nodes(a.ruleModifiers).every((modifier) =>
        isAcceptedM50AdditiveCardModifier(a as unknown as AuthoringAbility, modifier) ||
        isAcceptedM50PermanentPlayerRuleModifier(a as unknown as AuthoringAbility, modifier));
      for (const m of nodes(a.ruleModifiers)) {
        const acceptedRewardModifier = acceptedStaticCombatRewardDistribution && m === nodes(a.ruleModifiers)[0];
        const acceptedPaidCostModifier = acceptedPaidCostCombatPower && m === nodes(a.ruleModifiers)[0];
        const acceptedDeploymentModifier = acceptedDeploymentDestinationReplacement && m === nodes(a.ruleModifiers)[0];
        const acceptedSkillUseForbid = classifyAcceptedSkillUseForbidModifier(m);
        const acceptedEffectInstalledSkillUseForbid = isAcceptedEffectInstalledSelectedDefinitionSkillUseForbidModifier(m);
        const acceptedEffectInstalledManaSpendingForbid = isAcceptedEffectInstalledControllerManaSpendingForbidModifier(m);
        const acceptedEffectInstalledCombatSettlementModifier = isAcceptedEffectInstalledCombatSettlementModifier(m);
        const acceptedM50VictoryPointGainModifier = acceptedM50SourceSpecificVictoryPointGain &&
          isAcceptedM50VictoryPointGainModifier(a as unknown as AuthoringAbility, m);
        const acceptedM50LinkedPlayerCardModifier = acceptedM50LinkedPlayerCard &&
          isAcceptedM50LinkedPlayerCardModifier(a as unknown as AuthoringAbility, m);
        const acceptedCardCloseForbid = mode === 'automatic' && lifecycle.duration === 'this_round' &&
          isAcceptedControlledCardCloseForbidModifier(m);
        const acceptedFaceUpPlayLimit = acceptedFaceUpCardsPerRound && m === nodes(a.ruleModifiers)[0];
        const modifierScope = node(m.scope); const modifierLifecycle = node(m.lifecycle);
        const acceptedM50AdditiveCardModifier = isAcceptedM50AdditiveCardModifier(a as unknown as AuthoringAbility, m);
        const acceptedM50PermanentPlayerRuleModifier = isAcceptedM50PermanentPlayerRuleModifier(a as unknown as AuthoringAbility, m);
        const acceptedM50FaceDownAttackRuleModifier = acceptedM50FaceDownAttackRule && isAcceptedM50FaceDownAttackRuleModifier(a as unknown as AuthoringAbility, m);
        const m50GenericModifier = m50Structured && (
          (m.operation === 'replace' && m.rule === 'standard_attack_card_count' && modifierScope.subject === 'controller' &&
            modifierScope.minCount === 0 && modifierScope.maxCount === 4 && modifierScope.closeSourceWhenHandEmpty === true) ||
          (m.operation === 'forbid' && m.rule === 'card_draw' && modifierScope.subject === 'controller') ||
          (m.operation === 'ignore' && m.rule === 'situation_card_play' && modifierScope.subject === 'controller' &&
            Array.isArray(node(modifierScope.cards).attributesAny) && (node(modifierScope.cards).attributesAny as unknown[]).length === 1 && modifierLifecycle.duration === 'permanent') ||
          (m.operation === 'replace' && m.rule === 'elimination' && modifierScope.subject === 'controller' &&
            modifierScope.replacement === 'remove_source_card' && modifierScope.nextRoundVictoryPointGainMultiplier === 2 && modifierLifecycle.duration === 'permanent')
        );
        const operationSupported = ['add', 'set', 'ignore', 'lock', 'exclude', 'forbid'].includes(str(m.operation)) ||
          (acceptedM50LinkedPlayerCardModifier && ['multiply', 'replace'].includes(str(m.operation))) ||
          (acceptedM50VictoryPointGainModifier && m.operation === 'multiply') ||
          (acceptedEffectInstalledCombatSettlementModifier && ['allow', 'replace'].includes(str(m.operation))) ||
          (acceptedM50ConditionalCombatWinnerInclusion && m.operation === 'allow') ||
          (acceptedM50StructuredStandardAppend && m.operation === 'allow') ||
          (acceptedM50FaceDownAttackRuleModifier && m.operation === 'allow') ||
          (acceptedM50PermanentPlayerRuleModifier && m.operation === 'subtract') ||
          (acceptedRewardModifier && m.operation === 'replace') ||
          (acceptedDeploymentModifier && m.operation === 'replace') ||
          (acceptedB02OwnedPassive && m.rule === 'elimination' && m.operation === 'replace') ||
          (m50GenericModifier && m.operation === 'replace');
        const ruleSupported = ['attack.currentPower', 'card.currentPower', 'effect_prevention', 'battlefield', 'terrain_and_external_effects', 'use_skill_card', 'play_card_attribute', 'enter_or_leave_current_battlefield', 'terrain_and_external_effects_for_controller_and_opponents', 'terrain_and_external_servant_or_npc_effects', 'situation_restrictions', 'situation_play_forbid', 'skill_zone_mana_requirement', 'skill_zone_mana_at_least', 'netherworld_protection'].includes(str(m.rule)) ||
          (m50GenericModifier && ['standard_attack_card_count', 'card_draw', 'situation_card_play', 'elimination'].includes(str(m.rule))) ||
          (acceptedRewardModifier && m.rule === 'combat_reward_distribution') ||
          (acceptedPaidCostModifier && m.rule === 'combat_power') ||
          (acceptedDeploymentModifier && m.rule === 'deployment_destinations') ||
          ((acceptedSkillUseForbid !== undefined || acceptedEffectInstalledSkillUseForbid) && m.rule === 'skill_use') ||
          (acceptedEffectInstalledManaSpendingForbid && m.rule === 'mana_spending') ||
          (acceptedEffectInstalledCombatSettlementModifier && ['defeat', 'combat_winner_inclusion', 'combat_reward_distribution'].includes(str(m.rule))) ||
          (acceptedM50ConditionalCombatWinnerInclusion && m.rule === 'combat_winner_inclusion') ||
          (acceptedCardCloseForbid && m.rule === 'card_close') ||
          (acceptedFaceUpPlayLimit && m.rule === 'face_up_cards_per_round') ||
          (acceptedBatchPassiveFamily && ['skill_use', 'card_base_power', 'card_cost', 'card_play_with_others', 'defeat'].includes(str(m.rule))) ||
          (acceptedB02OwnedPassive && ['skill_use', 'card_power', 'card_cost', 'combat_power', 'elimination'].includes(str(m.rule))) ||
          (acceptedB03ModifierLifecycle && ['movement_destinations', 'card_power', 'deployment_advantage'].includes(str(m.rule))) ||
          (acceptedM50AdditiveCardModifier && ['card_power', 'card_cost'].includes(str(m.rule))) ||
          (acceptedM50StructuredStandardAppend && ['standard_append', 'standard_append_cost'].includes(str(m.rule))) ||
          (acceptedM50GrantedCardAbilitySource && ['non_effect_victory_point_gain', 'combat_power'].includes(str(m.rule))) ||
          (acceptedM50VictoryPointGainModifier && m.rule === 'victory_point_gain') ||
          (acceptedM50OpponentDefeatCost && m.rule === 'defeat_cost') ||
          (acceptedM50LinkedPlayerCardModifier && ['card_cost', 'card_base_power', 'card_attributes'].includes(str(m.rule))) ||
          (acceptedM50FaceDownAttackRuleModifier && ['card_base_power', 'card_residual'].includes(str(m.rule))) ||
          (acceptedM50SourceBattlefieldLockdown && ['card_play', 'movement_destinations'].includes(str(m.rule))) ||
          (acceptedM50PermanentPlayerRuleModifier && ['deployment_resource_gain', 'movement_cost', 'deployment_destinations', 'movement_destinations', 'card_play'].includes(str(m.rule)));
        if (!operationSupported || !ruleSupported) issue('ruleModifiers', 'Unmapped rule or operation', id);
        if (m.rule === 'skill_use' && acceptedSkillUseForbid === undefined && !acceptedEffectInstalledSkillUseForbid && !acceptedBatchPassiveFamily && !acceptedB02OwnedPassive) issue('ruleModifiers', 'Unsupported skill-use forbid selector shape', id);
        if (m.rule === 'card_close' && !acceptedCardCloseForbid) issue('ruleModifiers', 'Unsupported card-close forbid selector shape', id);
        if (m.rule === 'face_up_cards_per_round' && !acceptedFaceUpPlayLimit) issue('ruleModifiers', 'Unsupported face-up cards-per-round selector shape', id);
        if (m.rule === 'deployment_destinations' && !acceptedDeploymentModifier && !acceptedM50PermanentPlayerRuleModifier) issue('ruleModifiers', 'Unsupported deployment-destination replacement shape', id);
        if (m.rule === 'combat_reward_distribution' && !acceptedRewardModifier && !acceptedEffectInstalledCombatSettlementModifier) issue('ruleModifiers', 'Unsupported combat reward distribution modifier shape', id);
        if (m.rule === 'effect_prevention' && (m.operation !== 'ignore' || node(m.priority).tier !== 'explicit_exception')) issue('ruleModifiers.priority', 'Prevention exception requires explicit_exception', id);
        const ruleIsPlayException = m.operation === 'ignore' && ['situation_restrictions', 'situation_play_forbid', 'skill_zone_mana_requirement', 'skill_zone_mana_at_least'].includes(str(m.rule));
        const ruleIsStaticException = m.operation === 'ignore' && m.rule === 'netherworld_protection';
        if (m.rule !== 'effect_prevention' && !ruleIsPlayException && !ruleIsStaticException && !acceptedRewardModifier && !acceptedEffectInstalledCombatSettlementModifier && !acceptedBatchPassiveFamily && !acceptedB02OwnedPassive && !acceptedB03ModifierLifecycle && !acceptedM50AdditiveCardModifier && !acceptedM50StructuredStandardAppend && !acceptedM50GrantedCardAbilitySource && !acceptedM50VictoryPointGainModifier && !acceptedM50OpponentDefeatCost && !acceptedM50LinkedPlayerCardModifier && !acceptedM50FaceDownAttackRuleModifier && !acceptedM50SourceBattlefieldLockdown && !acceptedM50PermanentPlayerRuleModifier && !lifecycle.duration && !node(m.lifecycle).duration) issue('ruleModifiers.lifecycle', 'Modifier requires lifecycle', id);
        if (!acceptedPaidCostModifier && !acceptedM50LinkedPlayerCardModifier) scan(m.value, 'ruleModifiers.value', id);
        scan(node(m.scope).constraints, 'ruleModifiers.scope.constraints', id);
        if (node(m.scope).object && !['source_card', 'this_card', 'attack_card', 'this_effect', 'engaged_opponents_same_battlefield', 'opponents_at_same_battlefield', 'all_players'].includes(str(node(m.scope).object))) issue('ruleModifiers.scope.object', 'Unmapped modifier scope', id);
        if (node(m.scope).controller && !['self', 'controller', 'engaged_opponents_same_battlefield', 'opponents_at_same_battlefield'].includes(str(node(m.scope).controller))) issue('ruleModifiers.scope.controller', 'Unmapped modifier controller', id);
        if (m.lifecycle && a.lifecycle && JSON.stringify(m.lifecycle) !== JSON.stringify(a.lifecycle) &&
          !isAcceptedMagicResistanceIndependentModifierLifecycle(a, m) && !acceptedPaidCostModifier && !acceptedDeploymentModifier && !acceptedBatchPassiveFamily && !acceptedB02OwnedPassive && !acceptedB03ModifierLifecycle && !acceptedM50AdditiveCardModifier && !acceptedM50StructuredStandardAppend && !acceptedM50GrantedCardAbilitySource && !acceptedM50VictoryPointGainModifier && !acceptedM50OpponentDefeatCost && !acceptedM50ConditionalCombatWinnerInclusion && !acceptedM50LinkedPlayerCardModifier && !acceptedM50FaceDownAttackRuleModifier && !acceptedM50SourceBattlefieldLockdown && !acceptedM50PermanentPlayerRuleModifier && !acceptedEffectInstalledSkillUseForbid && !acceptedEffectInstalledManaSpendingForbid && !acceptedEffectInstalledCombatSettlementModifier && !m50GenericModifier) {
          issue('ruleModifiers.lifecycle', 'Independent modifier lifecycles require a separate ongoing handler', id);
        }
      }
      const installsRuleOverride = nodes(a.effects).some(effect => effect.type === 'install_rule_override');
      const provisionsSkillCards = nodes(a.effects).some(effect => effect.type === 'provision_skill_cards');
      const assignsPlayerStatuses = nodes(a.effects).some(effect => effect.type === 'add_status');
      if (installsRuleOverride || provisionsSkillCards || assignsPlayerStatuses) {
        const executionKeys = new Set(['mode', 'hostOps', 'allowedOperations']);
        for (const key of Object.keys(execution)) {
          if (!executionKeys.has(key)) issue(`execution.${key}`, 'Unmapped rule-override execution field', id);
        }
        if (Object.prototype.hasOwnProperty.call(execution, 'hostOps') && Object.prototype.hasOwnProperty.call(execution, 'allowedOperations')) {
          issue('execution', 'Rule-override execution cannot declare both hostOps and allowedOperations', id);
        }
        for (const operationsKey of ['hostOps', 'allowedOperations'] as const) {
          if (!Object.prototype.hasOwnProperty.call(execution, operationsKey)) continue;
          const authority = execution[operationsKey];
          if (!Array.isArray(authority) || authority.length !== 0) {
            issue(`execution.${operationsKey}`, 'Automatic rule-override execution authority must be an empty array when declared', id);
          }
        }
        if (assignsPlayerStatuses) {
          const responseKeys = Object.keys(response);
          const exactStatusResponse = responseKeys.length === 0 || (
            response.order === 'turn_order' && response.passBehavior === 'decline_this_window' &&
            responseKeys.length === 2 && responseKeys.every((key) => ['order', 'passBehavior'].includes(key)));
          if (!exactStatusResponse) {
            issue('responseWindow', 'Game-start player-status assignment requires an empty or exact default response window', id);
          }
        }
      }
      const requested = execution.hostOps ?? execution.allowedOperations;
      const defaultAllowed = mode === 'automatic' && (installsRuleOverride || provisionsSkillCards || assignsPlayerStatuses) ? [] : [...hostOperations];
      const allowed = Array.isArray(requested) ? hostOperations.filter(op => requested.includes(op)) : defaultAllowed;
      if (Array.isArray(requested) && requested.some(op => !hostOperations.includes(op as typeof hostOperations[number]))) issue('execution.hostOps', 'Operation outside the host allowlist', id);
      if (mode !== 'automatic') issue('execution.mode', str(execution.reason) || mode, id, mode as ExecutionMode);
      const candidateAbility: AuthoringAbility = { id, kind: str(a.kind), printedClause: str(a.printedClause),
        ...(Array.isArray(a.markers) ? { markers: a.markers.filter((marker): marker is string => typeof marker === 'string') } : {}), activation,
        conditions: nodes(a.conditions), targets: nodes(a.targets), effects: nodes(a.effects),
        cost: Array.isArray(a.cost) ? nodes(a.cost) : a.cost ? [node(a.cost)] : [],
        ruleModifiers: nodes(a.ruleModifiers), creates: nodes(a.creates),
        ...(acceptedM50GrantedCardAbilitySource ? { transforms: nodes(a.transforms) } : {}), lifecycle,
        responseWindow: { ...response, order: 'turn_order', passBehavior: 'decline_this_window' },
        limit, visibility: node(a.visibility), execution: { mode: mode as ExecutionMode, allowedOperations: allowed } };
      const m50ScheduleArm = m50Structured && candidateAbility.effects.some((effect) =>
        effect.type === 'schedule_effect' && typeof effect.abilityId === 'string' && effect.abilityId.length > 0 &&
        ['round.started', 'combat.ending'].includes(str(effect.triggerEventType)) && Number.isSafeInteger(effect.triggerRoundOffset) &&
        Number(effect.triggerRoundOffset) >= 0 && Number(effect.triggerRoundOffset) <= 1 &&
        Object.keys(effect).every((key) => ['type', 'abilityId', 'triggerEventType', 'triggerRoundOffset', 'expiresAfterRoundOffset', 'once', 'capturePayloadKeys', 'captureCardPowerFromPayloadKey', 'payloadVariableKey'].includes(key)));
      const m50ScheduledSelfDefeat = m50Structured && candidateAbility.kind === 'passive' && activation.trigger === 'm50_round_started' &&
        candidateAbility.effects.length === 1 && candidateAbility.effects[0]?.type === 'defeat_player' && candidateAbility.effects[0]?.target === 'controller' &&
        Object.keys(candidateAbility.effects[0]!).every((key) => ['type', 'target'].includes(key));
      const m50ScheduledRankedSelfDefeatSequence = m50Structured && candidateAbility.kind === 'passive' && activation.trigger === 'm50_round_started' &&
        candidateAbility.conditions.length === 2 && candidateAbility.conditions[0]?.type === 'source_active' && Object.keys(candidateAbility.conditions[0]!).every((key) => key === 'type') &&
        candidateAbility.conditions[1]?.type === 'victory_points_is_first' && Object.keys(candidateAbility.conditions[1]!).every((key) => key === 'type') &&
        candidateAbility.effects.length >= 2 && candidateAbility.effects[0]?.type === 'defeat_player' && candidateAbility.effects[0]?.target === 'controller' &&
        Object.keys(candidateAbility.effects[0]!).every((key) => ['type','target'].includes(key));
      const m50EachPlayerOption = m50Structured && candidateAbility.effects.some((effect) => {
        if (effect.type !== 'choose_each_player_option') return false;
        const target = node(effect.candidateTarget); const options = nodes(effect.options); const ids = options.map((option) => str(option.id));
        return ['same_location_opponents','same_battlefield_opponents','all_opponents'].includes(str(target.scope)) && Object.keys(target).every((key) => key === 'scope') &&
          options.length >= 2 && options.length <= 8 && ids.every(Boolean) && new Set(ids).size === ids.length &&
          options.every((option) => Array.isArray(option.effects) && Object.keys(option).every((key) => ['id','label','effects'].includes(key)));
      });
      const m50RatioFilteredDefeat = m50Structured && isAcceptedM50RatioFilteredDefeatAbility(candidateAbility);
      const m50ScheduledPayloadStatusTarget = m50Structured && candidateAbility.kind === 'passive' && activation.trigger === 'm50_round_started' &&
        candidateAbility.conditions.length === 1 && candidateAbility.conditions[0]?.type === 'scheduled_payload_present' &&
        candidateAbility.effects.length > 0 && candidateAbility.effects.every((effect) => effect.type === 'add_status' && effect.target === 'selected_player' && typeof effect.status === 'string' && effect.status.length > 0);
      const m50EliminationReplacement = m50Structured && candidateAbility.kind === 'passive' && candidateAbility.conditions.length === 1 &&
        candidateAbility.conditions[0]?.type === 'source_owned' && candidateAbility.ruleModifiers.length === 1 && (() => {
          const modifier = candidateAbility.ruleModifiers[0]!; const scope = node(modifier.scope); const modifierLife = node(modifier.lifecycle);
          return modifier.operation === 'replace' && modifier.rule === 'elimination' && scope.subject === 'controller' && scope.replacement === 'remove_source_card' &&
            scope.nextRoundVictoryPointGainMultiplier === 2 && modifierLife.duration === 'permanent';
        })();
      if (isPrivateOptionalHandPlayInteractionCandidate(candidateAbility) && !isPrivateOptionalHandPlayInteractionSemantic(candidateAbility)) {
        issue('interaction.gateway', 'Unsupported private optional hand-play interaction semantic shape', id);
      }
      if (isSameBattlefieldPrivateHandReturnInteractionCandidate(candidateAbility) &&
          !isSameBattlefieldPrivateHandReturnInteractionSemantic(candidateAbility) &&
          !isAcceptedSelectedSameBattlefieldDefeatAbility(candidateAbility, 'compiled') &&
          !isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(candidateAbility, 'compiled') &&
          !isAcceptedCommandSealLossConditionalDefeatAbility(candidateAbility) &&
          !isAcceptedM50BoundaryBottomDiscardAbility(candidateAbility) &&
          !isAcceptedM50GrantedCardAbilitySource(candidateAbility)) {
        issue('interaction.gateway', 'Unsupported same-battlefield private hand-return interaction semantic shape', id);
      }
      if (isRulerSealBindingCandidate(candidateAbility) && !isRulerSealBindingSemantic(candidateAbility)) {
        issue('rulerSeal.gateway', 'Unsupported Ruler seal binding semantic shape', id);
      }
      if (isRulerSealUseCandidate(candidateAbility) && !isRulerSealUseSemantic(candidateAbility)) {
        issue('rulerSeal.gateway', 'Unsupported Ruler seal use semantic shape', id);
      }
      if (isOuterGodLifeAbilityCandidate(candidateAbility) && !isOuterGodLifeAbilitySemantic(candidateAbility)) {
        issue('outerGodLife.gateway', 'Unsupported Outer-God-Life relational semantic shape', id);
      }
      if (isM50DeductionRecordCandidate(candidateAbility) && !isAcceptedM50DeductionRecordMarker(candidateAbility)) {
        issue('m50DeductionRecord.gateway', 'Unsupported deduction-record semantic marker shape', id);
      }
      if (isGameStartPlayerStatusAssignmentCandidate(candidateAbility) && !isGameStartPlayerStatusAssignmentSemantic(candidateAbility) && !m50ScheduledPayloadStatusTarget && !m50EachPlayerOption) {
        issue('gameStartPlayerStatus.gateway', 'Unsupported game-start player-status assignment semantic shape', id);
      }
      if (isPreBattleDefeatCandidate(a) && !isAcceptedPreBattleDefeatAbility(a, 'authoring') && !isAcceptedSelectedSameBattlefieldDefeatAbility(a, 'authoring') && !isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(a, 'authoring') && !isAcceptedStructuredChosenOpponentDefeatAbility(a, 'authoring') && !isAcceptedDeploymentLocationOpponentDefeatAbility(a, 'authoring') && !isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility(a, 'authoring') && !m50ScheduledSelfDefeat && !m50ScheduledRankedSelfDefeatSequence && !m50RatioFilteredDefeat && !isAcceptedCommandSealLossConditionalDefeatAbility(candidateAbility)) {
        issue('preBattleDefeat.gateway', 'Unsupported pre-battle defeat semantic shape', id);
      }
      if (isBattleLossVpWinnerRewardCandidate(a) && !isAcceptedBattleLossVpWinnerRewardAbility(a, 'authoring')) {
        issue('battleLossVpWinnerReward.gateway', 'Unsupported battle-loss VP winner-reward semantic shape', id);
      }
      if (isControllerDefeatedVpRewardCandidate(a) && !isAcceptedControllerDefeatedVpRewardAbility(a, 'authoring') &&
          !isAcceptedB04ControllerDefeatManaReleaseAbility(a as unknown as AuthoringAbility)) {
        issue('controllerDefeatedVpReward.gateway', 'Unsupported controller-defeated VP reward semantic shape', id);
      }
      if (isCombatOpponentPowerVpRewardCandidate(a) && !isAcceptedCombatOpponentPowerVpRewardAbility(a, 'authoring')) {
        issue('combatOpponentPowerVpReward.gateway', 'Unsupported frozen combat-opponent power VP reward semantic shape', id);
      }
      if (isOpponentCloseToOneCandidate(a) &&
          !isAcceptedOpponentCloseToOneAbility(a, 'authoring') && !isAcceptedOpponentCloseOneNonResidualAbility(a, 'authoring')) {
        issue('opponentCloseToOne.gateway', 'Unsupported opponent close-to-one interaction semantic shape', id);
      }
      if (isSelectedPlayedAttackTemporaryCopyCandidate(a) && !isAcceptedSelectedPlayedAttackTemporaryCopyAbility(a, 'authoring')) {
        issue('selectedPlayedAttackTemporaryCopy.gateway', 'Unsupported selected played-attack temporary-copy semantic shape', id);
      }
      if (isOpponentRoundVpGainThresholdCandidate(a as unknown as AuthoringAbility) && !isAcceptedOpponentRoundVpGainThresholdAbility(a as unknown as AuthoringAbility, 'authoring')) {
        issue('opponentRoundVpGainThreshold.gateway', 'Unsupported opponent round VP-gain threshold semantic shape', id);
      }
      if (isNextRoundSituationBenefitSuppressionCandidate(a as unknown as AuthoringAbility) &&
          !acceptedM50GrantedCardAbilitySource &&
          !isAcceptedNextRoundSituationBenefitSuppressionAbility(a as unknown as AuthoringAbility, 'authoring')) {
        issue('nextRoundSituationBenefitSuppression.gateway', 'Unsupported next-round situation-benefit suppression semantic shape', id);
      }
      if (isBasicStrengthOpponentSkillFaceDownCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a as unknown as AuthoringAbility, 'authoring')) {
        issue('basicStrengthOpponentSkillFaceDown.gateway', 'Unsupported basic-Strength play -> opponent servant-skill face-down semantic shape', id);
      }
      if (isEventPowerUncontestedWinRewardCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedEventPowerUncontestedWinRewardAbility(a as unknown as AuthoringAbility, 'authoring')) {
        issue('eventPowerUncontestedWinReward.gateway', 'Unsupported FB2-54 event-power / uncontested-win reward semantic shape', id);
      }
      if (isBatchPassiveFamilyCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedBatchPassiveFamilyAbility(a as unknown as AuthoringAbility) && !acceptedB02OwnedPassive && !m50AdditiveCardAbility && !m50PermanentRuleBundle && !acceptedM50FaceDownAttackRule && !acceptedM50SourceSpecificVictoryPointGain && !acceptedM50LinkedPlayerCard && !acceptedEffectInstalledCombatSettlement) {
        issue('batchPassive.gateway', 'Unsupported F4 B01 passive/modifier semantic shape', id);
      }
      if (isB02OwnedPassiveCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedB02OwnedPassiveAbility(a as unknown as AuthoringAbility) && !m50EliminationReplacement) {
        issue('batchOwnedPassive.gateway', 'Unsupported F4 B02 source-owned passive/modifier semantic shape', id);
      }
      if (isB03ModifierLifecycleCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedB03ModifierLifecycleAbility(a as unknown as AuthoringAbility) && !m50ScheduleArm && !m50PermanentRuleBundle && !acceptedM50SourceSpecificVictoryPointGain && !acceptedM50SourceBattlefieldLockdown && !acceptedEffectInstalledCombatSettlement) {
        issue('batchModifierLifecycle.gateway', 'Unsupported F4 B03 modifier/lifecycle semantic shape', id);
      }
      if (isB04EventSourcePowerCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedB04EventSourcePowerAbility(a as unknown as AuthoringAbility)) {
        issue('batchEventSourcePower.gateway', 'Unsupported F4 B04 event/source-power/resource semantic shape', id);
      }      if (isB05EventResourceLifecycleCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedB05EventResourceLifecycleAbility(a as unknown as AuthoringAbility)) {
        issue('batchEventResourceLifecycle.gateway', 'Unsupported F4 B05 event/resource/lifecycle semantic shape', id);
      }
      if (isB06CardPlayCombatEventBurstCandidate(a as unknown as AuthoringAbility) &&
          !isAcceptedB06CardPlayCombatEventBurstAbility(a as unknown as AuthoringAbility)) {
        issue('batchCardPlayCombatEventBurst.gateway', 'Unsupported F4 B06 card-play/combat/event-burst semantic shape', id);
      }
      const failure = report.find(r => r.abilityId === id && r.status === 'unsupported');
      const visibility = candidateAbility.visibility;
      if (Array.isArray(a.markers) && a.markers.includes('真名解放') && !visibility.revealTiming) {
        visibility.revealsTrueName = true; visibility.revealTiming = 'on_use_declared'; visibility.revealScope = 'servant_package';
      }
      return { ...candidateAbility, visibility,
        execution: { mode: failure ? 'unsupported' : mode as ExecutionMode, allowedOperations: allowed } };
    });
    if (abilities.some(isOuterGodLifeAbilityCandidate) && face.semanticCategory !== OUTER_GOD_LIFE_CATEGORY) {
      issue('cardFace.semanticCategory', 'Outer-God-Life relational abilities require semanticCategory=outer_god_life');
    }
    cards[cardId] = { id: cardId, name: str(raw.name), cardType: str(raw.cardType), cardFace: face,
      playTiming: timing, playRequirements: nodes(raw.playRequirements), abilities,
      ...(initialPlacement === 'outside_game' && (exactOwnedMasterSkill || exactOwnedServantSkill)
        ? { initialPlacement: 'outside_game' as const }
        : {}),
      mode: report.some(r => r.cardId === cardId && !r.abilityId) ? 'unsupported' : 'automatic' };
  }
  const publicCards = nodes(root.cards).map(c => ({ id: str(c.id), name: str(c.name), printedText: str(c.printedText), cardFace: node(c.cardFace) }));
  return { cards, report, servantPackage: { id: str(root.id), name: str(root.name), class: str(root.class),
    publicInformation: node(root.publicInformation), skillCards: publicCards.filter(c => cards[c.id]?.cardType === 'servant_skill'), knownCardDefinitions: publicCards } };
}
