import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

export type M50VictoryPointGainSource = 'objective' | 'competition' | 'command_seal' | 'scouting';

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
  if (execution.mode !== 'automatic') return false;
  return Object.keys(execution).every((key) => ['mode', 'allowedOperations', 'hostOps'].includes(key)) &&
    (execution.allowedOperations === undefined || Array.isArray(execution.allowedOperations)) &&
    (execution.hostOps === undefined || Array.isArray(execution.hostOps));
}

export interface M50VictoryPointGainModifier {
  operation: 'set' | 'multiply';
  sources: M50VictoryPointGainSource[];
  value: number;
}

export function classifyM50VictoryPointGainModifier(modifier: RuleNode): M50VictoryPointGainModifier | undefined {
  const allowedModifierKeys = ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle'];
  if (Object.keys(modifier).some((key) => !allowedModifierKeys.includes(key)) ||
      typeof modifier.id !== 'string' || modifier.id.length === 0 ||
      (modifier.printedClause !== undefined && typeof modifier.printedClause !== 'string') ||
      modifier.rule !== 'victory_point_gain' || !['set', 'multiply'].includes(String(modifier.operation)) ||
      !Number.isSafeInteger(modifier.value) || Number(modifier.value) < 0) return undefined;
  const scope = record(modifier.scope);
  const lifecycle = record(modifier.lifecycle);
  if (!exactKeys(scope, ['subject', 'sources']) || scope.subject !== 'controller' || !Array.isArray(scope.sources) ||
      !scope.sources.length || scope.sources.some((source) => !['objective', 'competition', 'command_seal', 'scouting'].includes(String(source))) ||
      new Set(scope.sources.map(String)).size !== scope.sources.length ||
      !exactKeys(lifecycle, ['duration']) || lifecycle.duration !== 'permanent') return undefined;
  return {
    operation: modifier.operation as 'set' | 'multiply',
    sources: scope.sources.map(String) as M50VictoryPointGainSource[],
    value: Number(modifier.value),
  };
}

/**
 * Exact identity-free M50 envelope for source-owned, source-specific VP gain text:
 * objective -> 0; command-seal + competition -> x2.  The exact bundle is kept
 * narrow so other numeric VP rules remain fail-closed until independently migrated.
 */
export function isAcceptedM50SourceSpecificVictoryPointGainAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'passive' || !Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') ||
      !automatic(raw.execution) || !emptyRecord(raw.activation) || !emptyArray(raw.targets) || !emptyArray(raw.effects) ||
      !emptyArray(raw.cost) || !emptyArray(raw.creates) || !emptyRecord(raw.lifecycle) || !defaultResponse(raw.responseWindow) ||
      !emptyRecord(raw.limit) || !emptyRecord(raw.visibility) || raw.copies !== undefined || raw.transforms !== undefined) return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned') return false;
  const modifiers = nodes(raw.ruleModifiers);
  if (modifiers.length !== 2) return false;
  const first = classifyM50VictoryPointGainModifier(modifiers[0]!);
  const second = classifyM50VictoryPointGainModifier(modifiers[1]!);
  return !!first && !!second &&
    first.operation === 'set' && first.value === 0 && JSON.stringify(first.sources) === JSON.stringify(['objective']) &&
    second.operation === 'multiply' && second.value === 2 && JSON.stringify(second.sources) === JSON.stringify(['command_seal', 'competition']);
}

export function isAcceptedM50VictoryPointGainModifier(ability: AuthoringAbility | RuleNode, modifier: RuleNode): boolean {
  return isAcceptedM50SourceSpecificVictoryPointGainAbility(ability) && classifyM50VictoryPointGainModifier(modifier) !== undefined;
}

function sourceOwned(state: GameState, instanceId: string, playerId: string): boolean {
  const source = state.cards.find((card) => card.instanceId === instanceId);
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!source || !player || player.status === 'eliminated' || source.ownerPlayerId !== playerId || source.controllerPlayerId !== playerId) return false;
  return ['skill', 'hand', 'attack_area'].includes(source.zone);
}

/** Authoritative source-specific VP gain query. Positive VP producers call this before crediting VP. */
export function m50VictoryPointGainForSource(
  state: GameState,
  playerId: string,
  sourceKind: M50VictoryPointGainSource,
  base: number,
): number {
  if (!Number.isSafeInteger(base) || base < 0) throw new Error('M50_VP_GAIN_BASE_INVALID');
  if (!state.abilityRuntime || base === 0) return base;
  let value = base;
  const modifiers: M50VictoryPointGainModifier[] = [];
  for (const source of state.cards) {
    if (!sourceOwned(state, source.instanceId, playerId)) continue;
    const definition = state.abilityRuntime.pack.cards[source.definitionId];
    if (!definition) continue;
    for (const ability of definition.abilities) {
      if (!isAcceptedM50SourceSpecificVictoryPointGainAbility(ability)) continue;
      for (const modifier of ability.ruleModifiers) {
        const classified = classifyM50VictoryPointGainModifier(modifier);
        if (classified?.sources.includes(sourceKind)) modifiers.push(classified);
      }
    }
  }
  for (const modifier of modifiers.filter((candidate) => candidate.operation === 'multiply')) {
    value *= modifier.value;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('M50_VP_GAIN_OVERFLOW');
  }
  const setValues = [...new Set(modifiers.filter((candidate) => candidate.operation === 'set').map((candidate) => candidate.value))];
  if (setValues.length > 1) throw new Error('M50_VP_GAIN_SET_CONFLICT');
  if (setValues.length === 1) value = setValues[0]!;
  return value;
}
