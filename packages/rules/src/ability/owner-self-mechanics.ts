import type { GameState } from '../schema/game';
import type { RuleNode } from './types';

export const LOSE_VP_EQUAL_SOURCE_PLAY_COUNT_EFFECT = 'lose_victory_points_equal_source_play_count' as const;
export const HIDE_SERVANT_TRUE_NAME_UNTIL_ROUND_END_EFFECT = 'hide_servant_true_name_until_round_end' as const;
export const REVEAL_HAND_ROUND_POWER_EFFECT = 'reveal_hand_and_add_round_power_by_base_power' as const;
export const PLAYER_COMBAT_TOTAL_POWER_RULE = 'player.combatTotalPower' as const;

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

export function isLoseVpEqualSourcePlayCountEffect(value: RuleNode): boolean {
  return value.type === LOSE_VP_EQUAL_SOURCE_PLAY_COUNT_EFFECT && exactKeys(value, ['type']);
}

export function isHideServantTrueNameUntilRoundEndEffect(value: RuleNode): boolean {
  return value.type === HIDE_SERVANT_TRUE_NAME_UNTIL_ROUND_END_EFFECT && exactKeys(value, ['type']);
}

export function isRevealHandRoundPowerEffect(value: RuleNode): boolean {
  return value.type === REVEAL_HAND_ROUND_POWER_EFFECT && value.minBasePower === 4 && value.perCard === 2 &&
    value.max === 6 && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'minBasePower', 'perCard', 'max', 'duration']);
}

export function isPlayerCombatTotalPowerModifier(value: RuleNode): boolean {
  if (value.operation !== 'add' || value.rule !== PLAYER_COMBAT_TOTAL_POWER_RULE || !Number.isSafeInteger(value.value) ||
      Number(value.value) < 0 || !exactKeys(value, ['operation', 'rule', 'scope', 'value'])) return false;
  const scope = value.scope && typeof value.scope === 'object' && !Array.isArray(value.scope)
    ? value.scope as RuleNode : {};
  return scope.controller === 'self' && exactKeys(scope, ['controller']);
}

export function ownerSelfMechanicIsWellFormed(value: RuleNode): boolean {
  switch (value.type) {
    case LOSE_VP_EQUAL_SOURCE_PLAY_COUNT_EFFECT: return isLoseVpEqualSourcePlayCountEffect(value);
    case HIDE_SERVANT_TRUE_NAME_UNTIL_ROUND_END_EFFECT: return isHideServantTrueNameUntilRoundEndEffect(value);
    case REVEAL_HAND_ROUND_POWER_EFFECT: return isRevealHandRoundPowerEffect(value);
    default: return true;
  }
}
export function servantRevealSuppressedByTemporaryConcealment(state: GameState, playerId: string): boolean {
  return state.abilityRuntime?.structuredPlayerFlagsByPlayer?.[playerId]?.__fd_temporary_servant_concealment_active === true;
}

export function playerCombatTotalPowerAdjustment(state: GameState, playerId: string): number {
  const runtime = state.abilityRuntime;
  if (!runtime) return 0;
  let total = 0;
  for (const ongoing of runtime.ongoingEffects) {
    if (ongoing.controllerId !== playerId || (ongoing.expiresAtRound !== undefined && state.round.roundNumber >= ongoing.expiresAtRound)) continue;
    for (const modifier of ongoing.ruleModifiers) {
      if (!isPlayerCombatTotalPowerModifier(modifier.definition)) continue;
      total += Number(modifier.definition.value);
    }
  }
  return total;
}
