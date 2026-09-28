import type { AuthoringAbility, RuleNode } from './types';

export const AUTOMATIC_RECYCLE_KEEP_GAIN_COUNTER_EFFECT = 'automatic_recycle_keep_gain_counter' as const;
export const SPEND_COUNTER_IGNORE_BATTLE_LOSS_EFFECT = 'spend_counter_ignore_battle_loss_this_round' as const;
export const DISCARD_BASIC_REPLAY_COUNTER_EFFECT = 'discard_basic_attacks_with_counter_return_after_battle' as const;
export const PHYSICAL_CARD_REPLAY_GROWTH_EFFECT = 'physical_card_replay_cost_top_deck_power' as const;

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function emptyArrays(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0;
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function counterKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value);
}

export function isAutomaticRecycleKeepGainCounterEffect(value: RuleNode): boolean {
  return value.type === AUTOMATIC_RECYCLE_KEEP_GAIN_COUNTER_EFFECT && counterKey(value.counterKey) &&
    value.keepMax === 3 && value.gain === 1 && value.reason === 'automatic_recycle' &&
    exactKeys(value, ['type', 'counterKey', 'keepMax', 'gain', 'reason']);
}
export function isAcceptedAutomaticRecycleKeepGainCounterAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' && empty(ability.activation) && emptyArrays(ability) && ability.effects.length === 1 &&
    isAutomaticRecycleKeepGainCounterEffect(ability.effects[0]!) && empty(ability.lifecycle) && standardResponse(ability) &&
    empty(ability.limit) && empty(ability.visibility) && automaticNoHost(ability);
}

export function isSpendCounterIgnoreBattleLossEffect(value: RuleNode): boolean {
  return value.type === SPEND_COUNTER_IGNORE_BATTLE_LOSS_EFFECT && counterKey(value.counterKey) && value.amount === 1 &&
    value.duration === 'this_round' && exactKeys(value, ['type', 'counterKey', 'amount', 'duration']);
}
export function isAcceptedSpendCounterIgnoreBattleLossAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && ability.activation.phase === 'advance' &&
    ability.activation.opens === 'controller_action_window' && exactKeys(ability.activation, ['phase', 'opens']) &&
    emptyArrays(ability) && ability.effects.length === 1 && isSpendCounterIgnoreBattleLossEffect(ability.effects[0]!) &&
    empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) && standardResponse(ability) && automaticNoHost(ability);
}

export function isDiscardBasicReplayCounterEffect(value: RuleNode): boolean {
  return value.type === DISCARD_BASIC_REPLAY_COUNTER_EFFECT && counterKey(value.counterKey) && value.maxSpend === 2 &&
    value.baseCount === 3 && value.sourceZone === 'discard' && value.cardKind === 'basic_attack' && value.payCardCosts === true &&
    value.returnAfter === 'after_battle_ended' && exactKeys(value, [
      'type', 'counterKey', 'maxSpend', 'baseCount', 'sourceZone', 'cardKind', 'payCardCosts', 'returnAfter',
    ]);
}
export function isAcceptedDiscardBasicReplayCounterAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' &&
    exactKeys(ability.activation, ['phase', 'opens']) && emptyArrays(ability) && ability.effects.length === 1 &&
    isDiscardBasicReplayCounterEffect(ability.effects[0]!) && empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) &&
    standardResponse(ability) && automaticNoHost(ability);
}

export function isPhysicalCardReplayGrowthEffect(value: RuleNode): boolean {
  return value.type === PHYSICAL_CARD_REPLAY_GROWTH_EFFECT && value.costIncreasePerPlay === 1 && value.costDuration === 'game' &&
    value.revealDiscardTop === 3 && value.printedPowerEquals === 4 && value.powerBonus === 'effective_play_cost' &&
    value.powerDuration === 'this_round' && exactKeys(value, [
      'type', 'costIncreasePerPlay', 'costDuration', 'revealDiscardTop', 'printedPowerEquals', 'powerBonus', 'powerDuration',
    ]);
}
export function isAcceptedPhysicalCardReplayGrowthAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'forced_trigger' && ability.activation.trigger === 'on_card_played' &&
    ability.activation.requiresSourceState === 'active' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    emptyArrays(ability) && ability.effects.length === 1 && isPhysicalCardReplayGrowthEffect(ability.effects[0]!) &&
    empty(ability.lifecycle) && standardResponse(ability) && empty(ability.limit) && empty(ability.visibility) && automaticNoHost(ability);
}

const privilegedTypes = new Set<string>([
  AUTOMATIC_RECYCLE_KEEP_GAIN_COUNTER_EFFECT,
  SPEND_COUNTER_IGNORE_BATTLE_LOSS_EFFECT,
  DISCARD_BASIC_REPLAY_COUNTER_EFFECT,
  PHYSICAL_CARD_REPLAY_GROWTH_EFFECT,
]);
export function containsDeckRecycleReplayGrowthPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsDeckRecycleReplayGrowthPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const current = value as RuleNode;
  if (privilegedTypes.has(String(current.type))) return true;
  return Object.values(current).some(containsDeckRecycleReplayGrowthPrivilegedNode);
}
export function isAcceptedDeckRecycleReplayGrowthAbility(ability: AuthoringAbility): boolean {
  return isAcceptedAutomaticRecycleKeepGainCounterAbility(ability) || isAcceptedSpendCounterIgnoreBattleLossAbility(ability) ||
    isAcceptedDiscardBasicReplayCounterAbility(ability) || isAcceptedPhysicalCardReplayGrowthAbility(ability);
}