import type { AuthoringAbility, RuleNode } from './types';

export const BATTLE_LUCK_CLOSE_DRAW_PLAY_EFFECT = 'resolve_battle_luck_close_draw_immediate_play' as const;

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) &&
    ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window';
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}

export function isBattleLuckCloseDrawPlayEffect(value: RuleNode): boolean {
  return value.type === BATTLE_LUCK_CLOSE_DRAW_PLAY_EFFECT &&
    value.discardAttribute === '幸运' && value.maxClosePerOpponent === 1 && value.excludePerGame === true &&
    value.refund === 'effective_play_cost' && value.drawCount === 1 &&
    value.playDrawnCard === 'optional_turn_order' && value.immediatePlayQuota === 'effect' &&
    value.actionAbilityPermission === 'this_round' &&
    exactKeys(value, [
      'type', 'discardAttribute', 'maxClosePerOpponent', 'excludePerGame', 'refund', 'drawCount',
      'playDrawnCard', 'immediatePlayQuota', 'actionAbilityPermission',
    ]);
}

export function containsBattleLuckCloseDrawPlayNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsBattleLuckCloseDrawPlayNode);
  if (!value || typeof value !== 'object') return false;
  const record = value as RuleNode;
  if (record.type === BATTLE_LUCK_CLOSE_DRAW_PLAY_EFFECT) return true;
  return Object.values(record).some(containsBattleLuckCloseDrawPlayNode);
}

export function isAcceptedBattleLuckCloseDrawPlayAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' &&
    ability.activation.phase === 'combat' && ability.activation.opens === 'controller_combat_action_window' &&
    ability.activation.requiresSourceState === 'active' && exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) &&
    ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.effects.length === 1 && isBattleLuckCloseDrawPlayEffect(ability.effects[0]!) &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) &&
    standardResponse(ability) && automaticNoHost(ability);
}