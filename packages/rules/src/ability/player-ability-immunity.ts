import type { GameState } from '../schema/game';
import type { RuleNode } from './types';

export const OTHER_PLAYER_ABILITY_EFFECT_IMMUNITY_RULE = 'other_player_ability_effect' as const;

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

export function isOtherPlayerAbilityEffectImmunityModifier(value: RuleNode): boolean {
  if (value.operation !== 'ignore' || value.rule !== OTHER_PLAYER_ABILITY_EFFECT_IMMUNITY_RULE ||
      !exactKeys(value, ['operation', 'rule', 'scope'])) return false;
  const scope = value.scope && typeof value.scope === 'object' && !Array.isArray(value.scope)
    ? value.scope as RuleNode : {};
  return scope.subject === 'controller' && scope.sourcePlayers === 'same_location_opponents' &&
    exactKeys(scope, ['subject', 'sourcePlayers']);
}

export function playerIgnoresAbilityFromController(
  state: GameState,
  targetPlayerId: string,
  sourceControllerId: string,
): boolean {
  if (targetPlayerId === sourceControllerId) return false;
  const target = state.players.find((candidate) => candidate.id === targetPlayerId);
  const source = state.players.find((candidate) => candidate.id === sourceControllerId);
  if (!target?.locationId || target.locationId !== source?.locationId) return false;
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  return runtime.ongoingEffects.some((ongoing) =>
    ongoing.controllerId === targetPlayerId &&
    (ongoing.expiresAtRound === undefined || state.round.roundNumber < ongoing.expiresAtRound) &&
    ongoing.ruleModifiers.some((modifier) => isOtherPlayerAbilityEffectImmunityModifier(modifier.definition)));
}