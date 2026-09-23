import type { GameState } from '../schema/game';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

export const B02_VICTORY_POINTS_IS_LOWEST = 'victory_points_is_lowest';

function record(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function list(value: unknown): RuleNode[] {
  return Array.isArray(value) ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object' && !Array.isArray(entry)) : [];
}
function exactKeys(value: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function emptyRecord(value: unknown): boolean { return Object.keys(record(value)).length === 0; }
function emptyList(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function emptyResponse(value: unknown): boolean {
  const response = record(value); const keys = Object.keys(response).sort();
  return keys.length === 0 || (keys.length === 2 && keys[0] === 'order' && keys[1] === 'passBehavior' &&
    response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function automatic(ability: AuthoringAbility | RuleNode): boolean { return record((ability as RuleNode).execution).mode === 'automatic'; }
function fields(ability: AuthoringAbility | RuleNode, key: string): RuleNode[] { return list((ability as RuleNode)[key]); }
function commonPassive(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode;
  return a.kind === 'passive' && automatic(ability) && emptyRecord(a.activation) && emptyList(a.targets ?? []) &&
    emptyList(a.effects ?? []) && emptyList(a.cost ?? []) && emptyList(a.creates ?? []) && emptyRecord(a.lifecycle) &&
    emptyResponse(a.responseWindow) && emptyRecord(a.limit) && emptyRecord(a.visibility);
}
function oneString(value: unknown): value is string[] {
  return Array.isArray(value) && value.length === 1 && typeof value[0] === 'string' && value[0].length > 0;
}

export function isAcceptedB02OwnedBasicAttackRuleAbility(ability: AuthoringAbility | RuleNode): boolean {
  if (!commonPassive(ability) || fields(ability, 'conditions').length !== 0) return false;
  const modifiers = fields(ability, 'ruleModifiers');
  if (modifiers.length !== 2) return false;
  const cost = modifiers.find((modifier) => modifier.rule === 'card_cost');
  const power = modifiers.find((modifier) => modifier.rule === 'card_power');
  if (!cost || !power) return false;
  const exact = (modifier: RuleNode, rule: string, value: number) => {
    const scope = record(modifier.scope); const cards = record(scope.cards);
    return exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value']) &&
      modifier.operation === 'add' && modifier.rule === rule && modifier.value === value &&
      exactKeys(scope, ['subject', 'cards']) && scope.subject === 'controller' &&
      exactKeys(cards, ['basic']) && cards.basic === true;
  };
  return exact(cost, 'card_cost', 1) && exact(power, 'card_power', 2);
}

export function classifyB02OwnedSkillDefinitionForbidAbility(ability: AuthoringAbility | RuleNode): string | undefined {
  if (!commonPassive(ability) || fields(ability, 'conditions').length !== 0) return undefined;
  const modifiers = fields(ability, 'ruleModifiers'); if (modifiers.length !== 1) return undefined;
  const modifier = modifiers[0]!; const scope = record(modifier.scope);
  if (!exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope']) || modifier.operation !== 'forbid' || modifier.rule !== 'skill_use' ||
      !exactKeys(scope, ['subject', 'skillDefinitionIds']) || scope.subject !== 'controller' || !oneString(scope.skillDefinitionIds)) return undefined;
  return (scope.skillDefinitionIds as string[])[0]!;
}

export function isAcceptedB02LowestVictoryCombatPowerAbility(ability: AuthoringAbility | RuleNode): boolean {
  if (!commonPassive(ability)) return false;
  const conditions = fields(ability, 'conditions'); const modifiers = fields(ability, 'ruleModifiers');
  if (conditions.length !== 2 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned' ||
      !exactKeys(conditions[1]!, ['type']) || conditions[1]!.type !== B02_VICTORY_POINTS_IS_LOWEST || modifiers.length !== 1) return false;
  const modifier = modifiers[0]!; const scope = record(modifier.scope);
  return exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value']) && modifier.operation === 'add' &&
    modifier.rule === 'combat_power' && modifier.value === 12 && exactKeys(scope, ['subject']) && scope.subject === 'controller';
}

export function isAcceptedB02EliminationReplacementAbility(ability: AuthoringAbility | RuleNode): boolean {
  if (!commonPassive(ability)) return false;
  const conditions = fields(ability, 'conditions'); const modifiers = fields(ability, 'ruleModifiers');
  if (conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned' || modifiers.length !== 1) return false;
  const modifier = modifiers[0]!; const scope = record(modifier.scope); const priority = record(modifier.priority);
  return exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'priority', 'conflictPolicy']) &&
    modifier.operation === 'replace' && modifier.rule === 'elimination' && modifier.conflictPolicy === 'higher_priority_wins' &&
    exactKeys(scope, ['subject', 'replacement']) && scope.subject === 'controller' && scope.replacement === 'remove_source_card' &&
    exactKeys(priority, ['tier', 'specificity']) && priority.tier === 'card_text' && priority.specificity === 'explicit_exception';
}

export function isAcceptedB02RoundEndVpLossAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const conditions = fields(ability, 'conditions'); const effects = fields(ability, 'effects');
  if (a.kind !== 'forced_trigger' || !automatic(ability) || !exactKeys(record(a.activation), ['trigger']) || record(a.activation).trigger !== 'round_end' ||
      conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned' || effects.length !== 1 ||
      !exactKeys(effects[0]!, ['type', 'player', 'amount']) || effects[0]!.type !== 'adjust_victory_points' || effects[0]!.player !== 'controller' || effects[0]!.amount !== -2 ||
      !emptyList(a.targets ?? []) || !emptyList(a.cost ?? []) || !emptyList(a.creates ?? []) || fields(ability, 'ruleModifiers').length !== 0 ||
      !emptyRecord(a.lifecycle) || !emptyResponse(a.responseWindow) || !emptyRecord(a.limit) || !emptyRecord(a.visibility)) return false;
  return true;
}

export function isB02OwnedPassiveCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const conditions = fields(ability, 'conditions'); const modifiers = fields(ability, 'ruleModifiers');
  if (isAcceptedB02RoundEndVpLossAbility(ability)) return true;
  if (conditions.some((condition) => condition.type === B02_VICTORY_POINTS_IS_LOWEST)) return true;
  if (modifiers.some((modifier) => modifier.rule === 'elimination')) return true;
  if (conditions.length === 0 && modifiers.some((modifier) => ['card_power', 'card_cost'].includes(String(modifier.rule)) && record(record(modifier.scope).cards).basic === true)) return true;
  return conditions.length === 0 && modifiers.some((modifier) => modifier.rule === 'skill_use' && Object.prototype.hasOwnProperty.call(record(modifier.scope), 'skillDefinitionIds'));
}
export function isAcceptedB02OwnedPassiveAbility(ability: AuthoringAbility | RuleNode): boolean {
  if (!isB02OwnedPassiveCandidate(ability)) return false;
  return isAcceptedB02OwnedBasicAttackRuleAbility(ability) || !!classifyB02OwnedSkillDefinitionForbidAbility(ability) ||
    isAcceptedB02LowestVictoryCombatPowerAbility(ability) || isAcceptedB02EliminationReplacementAbility(ability) ||
    isAcceptedB02RoundEndVpLossAbility(ability);
}

function definition(state: GameState, instanceId: string): ExecutableCardDefinition | undefined {
  const instance = state.cards.find((card) => card.instanceId === instanceId);
  return instance ? state.abilityRuntime?.pack.cards[instance.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
export function b02SourceOwned(state: GameState, sourceCardInstanceId: string, playerId: string): boolean {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const source = state.cards.find((candidate) => candidate.instanceId === sourceCardInstanceId);
  return !!player && player.status !== 'eliminated' && !!source && source.ownerPlayerId === playerId && ['skill', 'hand', 'attack_area'].includes(source.zone);
}
function ownedPassiveSources(state: GameState, playerId: string) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.status === 'eliminated') return [];
  return state.cards.filter((source) => source.ownerPlayerId === playerId && ['skill', 'hand', 'attack_area'].includes(source.zone));
}

export function b02OwnedBasicAttackAdjustment(state: GameState, targetCardInstanceId: string): { power: number; cost: number } {
  const target = state.cards.find((card) => card.instanceId === targetCardInstanceId);
  const targetDefinition = definition(state, targetCardInstanceId);
  if (!target || !targetDefinition || targetDefinition.cardType !== 'basic_attack') return { power: 0, cost: 0 };
  let power = 0; let cost = 0;
  for (const source of ownedPassiveSources(state, target.controllerPlayerId)) {
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      if (isAcceptedB02OwnedBasicAttackRuleAbility(ability)) { power += 2; cost += 1; }
    }
  }
  return { power, cost };
}

export function b02SkillDefinitionForbidden(state: GameState, controllerId: string, targetDefinitionId: string): boolean {
  return ownedPassiveSources(state, controllerId).some((source) => definition(state, source.instanceId)?.abilities.some((ability) =>
    classifyB02OwnedSkillDefinitionForbidAbility(ability) === targetDefinitionId));
}

export function b02LowestVictoryCombatPowerAdjustment(state: GameState, playerId: string): number {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const alive = state.players.filter((candidate) => candidate.status !== 'eliminated');
  if (!player || player.status === 'eliminated' || alive.length === 0 || player.vp !== Math.min(...alive.map((candidate) => candidate.vp))) return 0;
  let adjustment = 0;
  for (const source of ownedPassiveSources(state, playerId)) {
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) if (isAcceptedB02LowestVictoryCombatPowerAbility(ability)) adjustment += 12;
  }
  return adjustment;
}

export function consumeB02EliminationReplacement(state: GameState, playerId: string): boolean {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.status === 'eliminated') return false;
  const sources = ownedPassiveSources(state, playerId).filter((source) =>
    definition(state, source.instanceId)?.abilities.some(isAcceptedB02EliminationReplacementAbility));
  if (sources.length === 0) return false;
  if (sources.length > 1) throw new Error('B02_ELIMINATION_REPLACEMENT_CONFLICT');
  const source = sources[0]!;
  if (source.ownerPlayerId !== playerId && source.controllerPlayerId !== playerId) throw new Error('B02_ELIMINATION_REPLACEMENT_SOURCE_INVALID');
  source.zone = 'removed_from_game';
  source.visibility = { scope: 'public' };
  const sourceState = state.abilityRuntime?.cardState[source.instanceId];
  if (sourceState) { sourceState.active = false; sourceState.faceDown = true; }
  return true;
}
