import type { GameState } from '../schema/game';
import { getEffectiveCardAttributes } from './card-instance-state';
import { playerIgnoresAbilityFromController } from './player-ability-immunity';
import type { AuthoringAbility, RuleNode } from './types';

export const CURRENT_ROUND_BASIC_ATTACK_ATTRIBUTE_PAIR_CONDITION = 'controller_current_round_basic_attack_attribute_pair';
export const DRAW_THEN_SHUFFLE_TWO_HAND_EFFECT = 'draw_then_shuffle_two_hand_cards_into_deck';
export const ADJUST_OTHER_ACTIVE_PLAYERS_AT_SOURCE_LOCATION_MANA_EFFECT = 'adjust_other_active_players_at_source_location_mana';
export const DEFEAT_SINGLE_ACTIVE_OPPONENT_AT_CONTROLLER_BATTLEFIELD_EFFECT = 'defeat_single_active_opponent_at_controller_battlefield';
export const FORBID_OTHER_PLAYERS_AT_ACTIVE_SOURCE_LOCATION_MANA_GAIN_EFFECT = 'forbid_other_players_at_active_source_location_mana_gain';
export const SET_SOURCE_LOCATION_BASIC_BASE_POWER_MULTIPLIER_FROM_CHOICE_EFFECT = 'set_source_location_basic_base_power_multiplier_from_choice';

export const RUNE_PAIR_ATTRIBUTES = ['迅捷', '魔术', '特殊'] as const;
export const SOURCE_LOCATION_BASE_POWER_ATTRIBUTES = ['力量', '迅捷', '魔术', '特殊'] as const;
export type SourceLocationBasePowerAttribute = typeof SOURCE_LOCATION_BASE_POWER_ATTRIBUTES[number];

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function emptyRecord(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function standardResponse(ability: AuthoringAbility): boolean {
  const response = ability.responseWindow;
  return Object.keys(response).length === 2 && response.order === 'turn_order' && response.passBehavior === 'decline_this_window';
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}
function fixedControllerManaCost(ability: AuthoringAbility, amount: number): boolean {
  if (ability.cost.length !== 1) return false;
  const cost = ability.cost[0]!;
  return cost.type === 'pay_mana' && (cost.player === undefined || cost.player === 'controller') &&
    cost.amount === amount && exactKeys(cost, cost.player === undefined ? ['type', 'amount'] : ['type', 'player', 'amount']);
}
function exactCurrentRoundFlagCondition(value: RuleNode, kind: 'player_flag_number_current_round' | 'player_flag_number_not_current_round'): boolean {
  return value.type === kind && typeof value.key === 'string' && value.key.length > 0 && exactKeys(value, ['type', 'key']);
}
function exactSetCurrentRoundFlagEffect(value: RuleNode, key: string): boolean {
  const current = value.value;
  const lifecycle = value.lifecycle && typeof value.lifecycle === 'object' && !Array.isArray(value.lifecycle)
    ? value.lifecycle as RuleNode : {};
  return value.type === 'set_player_flag' && value.target === 'controller' && value.key === key &&
    lifecycle.duration === 'this_round' && exactKeys(lifecycle, ['duration']) && !!current && typeof current === 'object' && !Array.isArray(current) &&
    (current as RuleNode).type === 'current_round' && Object.keys(current as RuleNode).every((field) => ['type', 'offset'].includes(field)) &&
    ((current as RuleNode).offset === undefined || Number.isSafeInteger((current as RuleNode).offset)) &&
    exactKeys(value, ['type', 'target', 'key', 'value', 'lifecycle']);
}
function exactClearFlagEffect(value: RuleNode, key: string): boolean {
  return value.type === 'clear_player_flag' && value.target === 'controller' && value.key === key &&
    exactKeys(value, ['type', 'target', 'key']);
}
function commonEmptyAbilityParts(ability: AuthoringAbility): boolean {
  return ability.ruleModifiers.length === 0 && ability.creates.length === 0 && emptyRecord(ability.lifecycle) &&
    emptyRecord(ability.limit) && emptyRecord(ability.visibility) && standardResponse(ability);
}

export function isCurrentRoundBasicAttackAttributePairCondition(value: RuleNode): boolean {
  return value.type === CURRENT_ROUND_BASIC_ATTACK_ATTRIBUTE_PAIR_CONDITION &&
    typeof value.firstAttribute === 'string' && RUNE_PAIR_ATTRIBUTES.includes(value.firstAttribute as typeof RUNE_PAIR_ATTRIBUTES[number]) &&
    typeof value.secondAttribute === 'string' && RUNE_PAIR_ATTRIBUTES.includes(value.secondAttribute as typeof RUNE_PAIR_ATTRIBUTES[number]) &&
    value.distinctCards === true && exactKeys(value, ['type', 'firstAttribute', 'secondAttribute', 'distinctCards']);
}

export function controllerHasCurrentRoundBasicAttackAttributePair(state: GameState, controllerId: string, value: RuleNode): boolean {
  if (!isCurrentRoundBasicAttackAttributePairCondition(value)) return false;
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  const attacks = state.cards.filter((card) => card.controllerPlayerId === controllerId && card.zone === 'attack_area' &&
    runtime.cardState[card.instanceId]?.playedRound === state.round.roundNumber && runtime.pack.cards[card.definitionId]?.cardType === 'basic_attack');
  const first = String(value.firstAttribute); const second = String(value.secondAttribute);
  return attacks.some((left) => getEffectiveCardAttributes(state, left.instanceId).includes(first) &&
    attacks.some((right) => right.instanceId !== left.instanceId && getEffectiveCardAttributes(state, right.instanceId).includes(second)));
}

export function isDrawThenShuffleTwoHandEffect(value: RuleNode): boolean {
  return value.type === DRAW_THEN_SHUFFLE_TWO_HAND_EFFECT && exactKeys(value, ['type']);
}
export function isAdjustOtherPlayersAtSourceLocationManaEffect(value: RuleNode): boolean {
  return value.type === ADJUST_OTHER_ACTIVE_PLAYERS_AT_SOURCE_LOCATION_MANA_EFFECT && exactKeys(value, ['type']);
}
export function isDefeatSingleOpponentAtControllerBattlefieldEffect(value: RuleNode): boolean {
  return value.type === DEFEAT_SINGLE_ACTIVE_OPPONENT_AT_CONTROLLER_BATTLEFIELD_EFFECT && exactKeys(value, ['type']);
}
export function isForbidOtherPlayersAtActiveSourceLocationManaGainEffect(value: RuleNode): boolean {
  return value.type === FORBID_OTHER_PLAYERS_AT_ACTIVE_SOURCE_LOCATION_MANA_GAIN_EFFECT && exactKeys(value, ['type']);
}
export function isSetSourceLocationBasicBasePowerMultiplierEffect(value: RuleNode): boolean {
  return value.type === SET_SOURCE_LOCATION_BASIC_BASE_POWER_MULTIPLIER_FROM_CHOICE_EFFECT &&
    typeof value.target === 'string' && value.target.length > 0 && exactKeys(value, ['type', 'target']);
}

export function containsSourceLocationRunePrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSourceLocationRunePrivilegedNode);
  if (value === null || typeof value !== 'object') return false;
  const record = value as RuleNode;
  if ([DRAW_THEN_SHUFFLE_TWO_HAND_EFFECT, ADJUST_OTHER_ACTIVE_PLAYERS_AT_SOURCE_LOCATION_MANA_EFFECT,
    DEFEAT_SINGLE_ACTIVE_OPPONENT_AT_CONTROLLER_BATTLEFIELD_EFFECT, FORBID_OTHER_PLAYERS_AT_ACTIVE_SOURCE_LOCATION_MANA_GAIN_EFFECT,
    SET_SOURCE_LOCATION_BASIC_BASE_POWER_MULTIPLIER_FROM_CHOICE_EFFECT].includes(String(record.type))) return true;
  return Object.values(record).some(containsSourceLocationRunePrivilegedNode);
}

export function isAcceptedPostDrawHandShuffleAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  return ability.kind === 'phase_action' && automaticNoHost(ability) &&
    activation.phase === 'advance' && activation.opens === 'controller_action_window' && exactKeys(activation, ['phase', 'opens']) &&
    ability.conditions.length === 0 && ability.targets.length === 0 && fixedControllerManaCost(ability, 1) &&
    ability.effects.length === 1 && isDrawThenShuffleTwoHandEffect(ability.effects[0]!) && commonEmptyAbilityParts(ability);
}

export function isAcceptedSameLocationManaLossAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  const pair = ability.conditions.find(isCurrentRoundBasicAttackAttributePairCondition);
  const unused = ability.conditions.find((condition) => exactCurrentRoundFlagCondition(condition, 'player_flag_number_not_current_round'));
  if (!pair || !unused || ability.conditions.length !== 2) return false;
  const key = String(unused.key);
  return ability.kind === 'phase_action' && automaticNoHost(ability) &&
    activation.phase === 'action' && activation.opens === 'controller_action_window' && exactKeys(activation, ['phase', 'opens']) &&
    ability.targets.length === 0 && fixedControllerManaCost(ability, 3) && ability.effects.length === 2 &&
    isAdjustOtherPlayersAtSourceLocationManaEffect(ability.effects[0]!) && exactSetCurrentRoundFlagEffect(ability.effects[1]!, key) &&
    commonEmptyAbilityParts(ability);
}

function exactlyOneOpponentCondition(value: RuleNode): boolean {
  return value.type === 'controller_at_battlefield_with_exactly_one_opponent' && exactKeys(value, ['type']);
}
export function isAcceptedUniqueOpponentDefeatAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  const armed = ability.conditions.find((condition) => exactCurrentRoundFlagCondition(condition, 'player_flag_number_current_round'));
  if (!armed || ability.conditions.length !== 2 || !ability.conditions.some(exactlyOneOpponentCondition)) return false;
  const key = String(armed.key);
  return ability.kind === 'phase_action' && automaticNoHost(ability) &&
    activation.phase === 'combat' && activation.opens === 'controller_combat_action_window' && exactKeys(activation, ['phase', 'opens']) &&
    ability.targets.length === 0 && ability.cost.length === 0 && ability.effects.length === 2 &&
    isDefeatSingleOpponentAtControllerBattlefieldEffect(ability.effects[0]!) && exactClearFlagEffect(ability.effects[1]!, key) &&
    commonEmptyAbilityParts(ability);
}

export function isAcceptedSourceLocationManaGainForbidAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  return ability.kind === 'residual' && automaticNoHost(ability) &&
    activation.trigger === 'while_active' && activation.requiresSourceState === 'active' && exactKeys(activation, ['trigger', 'requiresSourceState']) &&
    ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.effects.length === 1 && isForbidOtherPlayersAtActiveSourceLocationManaGainEffect(ability.effects[0]!) && commonEmptyAbilityParts(ability);
}

function isExactAttributeChoiceTarget(value: RuleNode): boolean {
  if (value.type !== 'choice' || typeof value.id !== 'string' || value.id.length === 0 || !Array.isArray(value.options)) return false;
  const count = value.count && typeof value.count === 'object' && !Array.isArray(value.count) ? value.count as RuleNode : {};
  if (count.min !== 1 || count.max !== 1 || !exactKeys(count, ['min', 'max'])) return false;
  const options = value.options as unknown[];
  if (options.length !== SOURCE_LOCATION_BASE_POWER_ATTRIBUTES.length) return false;
  const ids: string[] = [];
  for (const option of options) {
    if (!option || typeof option !== 'object' || Array.isArray(option)) return false;
    const record = option as RuleNode;
    if (typeof record.id !== 'string' || !SOURCE_LOCATION_BASE_POWER_ATTRIBUTES.includes(record.id as SourceLocationBasePowerAttribute) ||
        (record.label !== undefined && typeof record.label !== 'string') ||
        !Object.keys(record).every((key) => ['id', 'label'].includes(key))) return false;
    ids.push(record.id);
  }
  return new Set(ids).size === SOURCE_LOCATION_BASE_POWER_ATTRIBUTES.length &&
    SOURCE_LOCATION_BASE_POWER_ATTRIBUTES.every((attribute) => ids.includes(attribute)) &&
    Object.keys(value).every((key) => ['id', 'type', 'count', 'options'].includes(key));
}
export function isAcceptedSourceLocationBasicPowerAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  if (ability.targets.length !== 1 || !isExactAttributeChoiceTarget(ability.targets[0]!)) return false;
  const targetId = String(ability.targets[0]!.id);
  return ability.kind === 'phase_action' && automaticNoHost(ability) &&
    activation.phase === 'advance' && activation.opens === 'controller_action_window' && activation.requiresSourceState === 'active' &&
    exactKeys(activation, ['phase', 'opens', 'requiresSourceState']) && ability.conditions.length === 0 && ability.cost.length === 0 &&
    ability.effects.length === 1 && isSetSourceLocationBasicBasePowerMultiplierEffect(ability.effects[0]!) && ability.effects[0]!.target === targetId &&
    commonEmptyAbilityParts(ability);
}

export function isAcceptedSourceLocationRunePrivilegedAbility(ability: AuthoringAbility): boolean {
  return isAcceptedPostDrawHandShuffleAbility(ability) || isAcceptedSameLocationManaLossAbility(ability) ||
    isAcceptedUniqueOpponentDefeatAbility(ability) || isAcceptedSourceLocationManaGainForbidAbility(ability) ||
    isAcceptedSourceLocationBasicPowerAbility(ability);
}

function liveActiveSource(state: GameState, instanceId: string): boolean {
  const card = state.cards.find((candidate) => candidate.instanceId === instanceId);
  const cardState = state.abilityRuntime?.cardState[instanceId];
  return !!card && card.zone === 'attack_area' && cardState?.active === true && cardState.faceDown !== true;
}
function sourceHasAcceptedAbility(state: GameState, instanceId: string, predicate: (ability: AuthoringAbility) => boolean): boolean {
  const card = state.cards.find((candidate) => candidate.instanceId === instanceId);
  const definition = card ? state.abilityRuntime?.pack.cards[card.definitionId] : undefined;
  return !!definition?.abilities.some(predicate);
}

export function isManaGainForbiddenByActiveSourceLocationAura(state: GameState, playerId: string): boolean {
  const target = state.players.find((candidate) => candidate.id === playerId && candidate.status === 'active');
  if (!target?.locationId || !state.abilityRuntime) return false;
  return state.cards.some((source) => {
    if (source.controllerPlayerId === playerId || !liveActiveSource(state, source.instanceId) ||
        !sourceHasAcceptedAbility(state, source.instanceId, isAcceptedSourceLocationManaGainForbidAbility)) return false;
    const controller = state.players.find((candidate) => candidate.id === source.controllerPlayerId && candidate.status === 'active');
    return !!controller?.locationId && controller.locationId === target.locationId &&
      !playerIgnoresAbilityFromController(state, playerId, source.controllerPlayerId);
  });
}

export function sourceLocationBasicAttackBasePowerMultiplier(state: GameState, targetInstanceId: string): number {
  const runtime = state.abilityRuntime;
  const target = state.cards.find((candidate) => candidate.instanceId === targetInstanceId);
  const targetState = runtime?.cardState[targetInstanceId];
  const targetDef = target ? runtime?.pack.cards[target.definitionId] : undefined;
  if (!runtime || !target || target.zone !== 'attack_area' || targetState?.active !== true || targetState.faceDown === true ||
      targetDef?.cardType !== 'basic_attack') return 1;
  const targetPlayer = state.players.find((candidate) => candidate.id === target.controllerPlayerId && candidate.status === 'active');
  if (!targetPlayer?.locationId) return 1;
  let multiplier = 1;
  for (const source of state.cards) {
    const sourceState = runtime.cardState[source.instanceId];
    const modifier = sourceState?.sourceLocationBasicBasePowerMultiplier;
    if (!modifier || modifier.round !== state.round.roundNumber || modifier.multiplier !== 2 ||
        !SOURCE_LOCATION_BASE_POWER_ATTRIBUTES.includes(modifier.attribute) || !liveActiveSource(state, source.instanceId) ||
        !sourceHasAcceptedAbility(state, source.instanceId, isAcceptedSourceLocationBasicPowerAbility)) continue;
    const controller = state.players.find((candidate) => candidate.id === source.controllerPlayerId && candidate.status === 'active');
    if (!controller?.locationId || controller.locationId !== targetPlayer.locationId ||
        playerIgnoresAbilityFromController(state, targetPlayer.id, source.controllerPlayerId) ||
        !getEffectiveCardAttributes(state, targetInstanceId).includes(modifier.attribute)) continue;
    multiplier *= 2;
  }
  return multiplier;
}
