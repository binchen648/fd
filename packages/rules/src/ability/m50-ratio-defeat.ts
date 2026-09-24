import type { AuthoringAbility, RuleNode } from './types';

export const M50_PLAYER_FLAG_GREATER_THAN_MANA_RATIO = 'player_flag_greater_than_mana_ratio';

function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function empty(value: unknown): boolean { return Object.keys(node(value)).length === 0; }
function emptyList(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }

export interface M50PlayerFlagManaRatioPredicate {
  key: string;
  numerator: number;
  denominator: number;
}

export function parseM50PlayerFlagManaRatioPredicate(value: unknown): M50PlayerFlagManaRatioPredicate | undefined {
  const predicate = node(value);
  if (predicate.type !== M50_PLAYER_FLAG_GREATER_THAN_MANA_RATIO ||
      typeof predicate.key !== 'string' || predicate.key.length === 0 ||
      !Number.isSafeInteger(predicate.numerator) || Number(predicate.numerator) <= 0 ||
      !Number.isSafeInteger(predicate.denominator) || Number(predicate.denominator) <= 0 ||
      !exactKeys(predicate, ['type','key','numerator','denominator'])) return undefined;
  return { key: predicate.key, numerator: Number(predicate.numerator), denominator: Number(predicate.denominator) };
}

export function m50RatioFilteredDefeatPredicate(ability: AuthoringAbility): M50PlayerFlagManaRatioPredicate | undefined {
  if (!Array.isArray(ability.markers) || !ability.markers.includes('m50_structured_v1') || ability.kind !== 'phase_action' ||
      ability.activation.phase !== 'combat' || ability.activation.opens !== 'controller_combat_action_window' ||
      ability.activation.requiresSourceState !== 'active' ||
      Object.keys(ability.activation).some((key) => !['phase','opens','requiresSourceState'].includes(key))) return undefined;
  if (ability.conditions.length !== 1 || ability.conditions[0]?.type !== 'phase_is' || ability.conditions[0]?.phase !== 'combat' ||
      !exactKeys(ability.conditions[0]!, ['type','phase']) || !emptyList(ability.targets) || !emptyList(ability.cost) ||
      !emptyList(ability.creates) || !emptyList(ability.ruleModifiers) || !empty(ability.lifecycle)) return undefined;
  if (ability.effects.length !== 1 || ability.effects[0]?.type !== 'defeat_player' || !exactKeys(ability.effects[0]!, ['type','target'])) return undefined;
  const target = node(ability.effects[0]!.target); const where = Array.isArray(target.where) ? target.where : [];
  if (target.scope !== 'all_players' || !exactKeys(target, ['scope','where']) || where.length !== 1) return undefined;
  const predicate = parseM50PlayerFlagManaRatioPredicate(where[0]); if (!predicate) return undefined;
  const limit = node(ability.limit);
  if (limit.type !== 'per_game' || limit.uses !== 1 || limit.scope !== 'this_card' || !exactKeys(limit, ['type','uses','scope'])) return undefined;
  const visibility = node(ability.visibility);
  if (visibility.revealsTrueName !== true || visibility.revealTiming !== 'on_use_declared' || visibility.revealScope !== 'servant_package' ||
      !exactKeys(visibility, ['revealsTrueName','revealTiming','revealScope'])) return undefined;
  if (ability.execution.mode !== 'automatic' || !Array.isArray(ability.execution.allowedOperations) || ability.execution.allowedOperations.length !== 0) return undefined;
  return predicate;
}

export function isAcceptedM50RatioFilteredDefeatAbility(ability: AuthoringAbility): boolean {
  return m50RatioFilteredDefeatPredicate(ability) !== undefined;
}