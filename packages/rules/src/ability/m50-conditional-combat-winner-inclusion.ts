import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

function record(value: unknown): RuleNode {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object' && !Array.isArray(entry))
    : [];
}
function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function emptyRecord(value: unknown): boolean {
  return value === undefined || (value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);
}
function emptyArray(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length === 0);
}
function defaultResponse(value: unknown): boolean {
  const response = record(value);
  return Object.keys(response).length === 0 ||
    (exactKeys(response, ['order', 'passBehavior']) && response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function automatic(value: unknown): boolean {
  const execution = record(value);
  return execution.mode === 'automatic' && Object.keys(execution).every((key) => ['mode', 'allowedOperations', 'hostOps'].includes(key)) &&
    (execution.allowedOperations === undefined || Array.isArray(execution.allowedOperations)) &&
    (execution.hostOps === undefined || Array.isArray(execution.hostOps));
}

export function isAcceptedM50ConditionalCombatWinnerInclusionAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'passive' || !Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') ||
      !automatic(raw.execution) || !emptyRecord(raw.activation) || !emptyArray(raw.targets) || !emptyArray(raw.effects) ||
      !emptyArray(raw.cost) || !emptyArray(raw.creates) || !emptyRecord(raw.lifecycle) || !defaultResponse(raw.responseWindow) ||
      !emptyRecord(raw.limit) || !emptyRecord(raw.visibility) || raw.copies !== undefined || raw.transforms !== undefined) return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_active') return false;
  const modifiers = nodes(raw.ruleModifiers);
  if (modifiers.length !== 1) return false;
  const modifier = modifiers[0]!;
  const scope = record(modifier.scope);
  const lifecycle = record(modifier.lifecycle);
  return exactKeys(modifier, ['id', 'operation', 'rule', 'scope', 'lifecycle']) &&
    typeof modifier.id === 'string' && modifier.id.length > 0 && modifier.operation === 'allow' && modifier.rule === 'combat_winner_inclusion' &&
    exactKeys(scope, ['subject', 'whenOtherWinnerControlsOrHasSkillDefinitionId']) && scope.subject === 'controller' &&
    typeof scope.whenOtherWinnerControlsOrHasSkillDefinitionId === 'string' && scope.whenOtherWinnerControlsOrHasSkillDefinitionId.length > 0 &&
    exactKeys(lifecycle, ['duration']) && lifecycle.duration === 'while_active';
}

function activeSource(state: GameState, playerId: string, ability: AuthoringAbility): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  return state.cards.some((source) => {
    if (source.ownerPlayerId !== playerId || source.controllerPlayerId !== playerId || source.zone !== 'attack_area') return false;
    const sourceState = runtime.cardState[source.instanceId];
    if (sourceState?.active !== true || sourceState.faceDown === true) return false;
    const definition = runtime.pack.cards[source.definitionId];
    return !!definition && definition.abilities.includes(ability);
  });
}

/**
 * Returns true when an exact while-active inclusion rule adds playerId to the
 * winner set because another current primary winner physically controls/holds
 * the referenced definition in attack or skill zone.
 */
export function m50ConditionalCombatWinnerIncluded(
  state: GameState,
  playerId: string,
  currentWinnerIds: string[],
): boolean {
  const runtime = state.abilityRuntime;
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!runtime || !player || player.status !== 'active') return false;
  for (const definition of Object.values(runtime.pack.cards)) {
    for (const ability of definition.abilities) {
      if (!isAcceptedM50ConditionalCombatWinnerInclusionAbility(ability) || !activeSource(state, playerId, ability)) continue;
      const modifier = ability.ruleModifiers[0]!;
      const requiredDefinitionId = String(record(modifier.scope).whenOtherWinnerControlsOrHasSkillDefinitionId);
      if (currentWinnerIds.some((winnerId) => {
        if (winnerId === playerId) return false;
        const winner = state.players.find((candidate) => candidate.id === winnerId);
        if (!winner || winner.status !== 'active') return false;
        return state.cards.some((candidate) => candidate.definitionId === requiredDefinitionId &&
          candidate.controllerPlayerId === winnerId && ['attack_area', 'skill'].includes(candidate.zone));
      })) return true;
    }
  }
  return false;
}
