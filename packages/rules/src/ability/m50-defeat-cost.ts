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

export function isAcceptedM50OpponentDefeatCostAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'passive' || !Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') ||
      !automatic(raw.execution) || !emptyRecord(raw.activation) || !emptyArray(raw.targets) || !emptyArray(raw.effects) ||
      !emptyArray(raw.cost) || !emptyArray(raw.creates) || !emptyRecord(raw.lifecycle) || !defaultResponse(raw.responseWindow) ||
      !emptyRecord(raw.limit) || !emptyRecord(raw.visibility) || raw.copies !== undefined || raw.transforms !== undefined) return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned') return false;
  const modifiers = nodes(raw.ruleModifiers);
  if (modifiers.length !== 1) return false;
  const modifier = modifiers[0]!;
  const scope = record(modifier.scope);
  const lifecycle = record(modifier.lifecycle);
  return exactKeys(modifier, ['id', 'operation', 'rule', 'scope', 'value', 'lifecycle']) &&
    typeof modifier.id === 'string' && modifier.id.length > 0 && modifier.operation === 'add' && modifier.rule === 'defeat_cost' &&
    modifier.value === 3 && exactKeys(scope, ['subject']) && scope.subject === 'controller' &&
    exactKeys(lifecycle, ['duration']) && lifecycle.duration === 'permanent';
}

function sourceOwnedLive(state: GameState, sourceInstanceId: string, playerId: string): boolean {
  const source = state.cards.find((card) => card.instanceId === sourceInstanceId);
  const player = state.players.find((candidate) => candidate.id === playerId);
  return !!source && !!player && player.status === 'active' && source.ownerPlayerId === playerId && source.controllerPlayerId === playerId &&
    ['skill', 'hand', 'attack_area'].includes(source.zone);
}

/** Additional mana an opposing card-effect controller must pay before defeating targetPlayerId. */
export function m50OpponentDefeatManaCost(state: GameState, targetPlayerId: string): number {
  if (!state.abilityRuntime) return 0;
  let total = 0;
  for (const source of state.cards) {
    if (!sourceOwnedLive(state, source.instanceId, targetPlayerId)) continue;
    const definition = state.abilityRuntime.pack.cards[source.definitionId];
    if (!definition) continue;
    for (const ability of definition.abilities) {
      if (!isAcceptedM50OpponentDefeatCostAbility(ability)) continue;
      total += Number(ability.ruleModifiers[0]!.value);
      if (!Number.isSafeInteger(total) || total < 0) throw new Error('M50_DEFEAT_COST_OVERFLOW');
    }
  }
  return total;
}
