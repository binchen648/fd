import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

function record(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function list(value: unknown): RuleNode[] {
  return Array.isArray(value) ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object' && !Array.isArray(entry)) : [];
}
function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function empty(value: unknown): boolean { return Object.keys(record(value)).length === 0; }
function emptyList(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function defaultResponse(value: unknown): boolean {
  const response = record(value);
  return Object.keys(response).length === 0 ||
    (exactKeys(response, ['order','passBehavior']) && response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function automatic(value: unknown): boolean {
  const execution = record(value);
  return execution.mode === 'automatic' && Object.keys(execution).every((key) => ['mode','allowedOperations'].includes(key)) &&
    (execution.allowedOperations === undefined || (Array.isArray(execution.allowedOperations) && execution.allowedOperations.length === 0));
}

export const M50_CLOSE_SELECTED_FACE_DOWN_ATTACKS = 'close_selected_face_down_attacks' as const;
export const M50_DRAW_AND_PLAY_FACE_DOWN = 'draw_and_play_face_down_attacks' as const;

export type M50FaceDownAttackRuleKind = 'printed_base_power_zero' | 'residual';
export interface M50FaceDownAttackRuleFamily { kind: M50FaceDownAttackRuleKind }

/** Exact continuous face-down attack modifiers ported from the locked Reference authoring envelope. */
export function classifyM50FaceDownAttackRuleAbility(ability: AuthoringAbility | RuleNode): M50FaceDownAttackRuleFamily | undefined {
  const raw = ability as RuleNode;
  if (raw.kind !== 'passive' || !Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') || !automatic(raw.execution) ||
      !empty(raw.activation) || !emptyList(raw.targets) || !emptyList(raw.effects) || !emptyList(raw.cost) || !emptyList(raw.creates) ||
      !empty(raw.lifecycle) || !defaultResponse(raw.responseWindow) || !empty(raw.limit) || !empty(raw.visibility)) return undefined;
  const conditions = list(raw.conditions); const modifiers = list(raw.ruleModifiers);
  if (conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned' || modifiers.length !== 1) return undefined;
  const modifier = modifiers[0]!; const scope = record(modifier.scope); const cards = record(scope.cards); const lifecycle = record(modifier.lifecycle);
  if (!exactKeys(modifier, ['id','operation','rule','scope','value','lifecycle']) || typeof modifier.id !== 'string' || !modifier.id ||
      !exactKeys(scope, ['subject','cards']) || scope.subject !== 'controller' ||
      !exactKeys(cards, ['zones','face']) || JSON.stringify(cards.zones) !== JSON.stringify(['attack_area']) || cards.face !== 'down' ||
      !exactKeys(lifecycle, ['duration']) || lifecycle.duration !== 'permanent') return undefined;
  if (modifier.operation === 'set' && modifier.rule === 'card_base_power' && modifier.value === 0) return { kind: 'printed_base_power_zero' };
  if (modifier.operation === 'allow' && modifier.rule === 'card_residual' && modifier.value === 1) return { kind: 'residual' };
  return undefined;
}

export function isAcceptedM50FaceDownAttackRuleAbility(ability: AuthoringAbility | RuleNode): boolean {
  return classifyM50FaceDownAttackRuleAbility(ability) !== undefined;
}
export function isAcceptedM50FaceDownAttackRuleModifier(ability: AuthoringAbility | RuleNode, modifier: RuleNode): boolean {
  return !!classifyM50FaceDownAttackRuleAbility(ability) && list((ability as RuleNode).ruleModifiers)[0] === modifier;
}

/** Exact optional round-end close response synthesized from the residual grant. */
export function isAcceptedM50FaceDownAttackCloseAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode; const activation = record(raw.activation); const response = record(raw.responseWindow);
  const targets = list(raw.targets); const effects = list(raw.effects); const target = targets[0]; const effect = effects[0];
  const scope = record(target?.scope); const count = record(target?.count); const constraints = list(target?.constraints);
  return raw.kind === 'optional_trigger' && Array.isArray(raw.markers) && raw.markers.includes('m50_structured_v1') && automatic(raw.execution) &&
    exactKeys(activation, ['trigger']) && activation.trigger === 'round_end' &&
    list(raw.conditions).length === 1 && exactKeys(list(raw.conditions)[0]!, ['type']) && list(raw.conditions)[0]!.type === 'source_owned' &&
    targets.length === 1 && !!target && exactKeys(target, ['id','type','scope','count','constraints']) && target.id === 'face_down_attacks' && target.type === 'card_instance' &&
    exactKeys(scope, ['zone']) && scope.zone === 'attack_area' && exactKeys(count, ['min','max']) && count.min === 1 && count.max === 50 &&
    constraints.length === 1 && exactKeys(constraints[0]!, ['type','face']) && constraints[0]!.type === 'is_attack' && constraints[0]!.face === 'face_down' &&
    effects.length === 1 && !!effect && exactKeys(effect, ['type','target']) && effect.type === M50_CLOSE_SELECTED_FACE_DOWN_ATTACKS && effect.target === 'face_down_attacks' &&
    emptyList(raw.cost) && emptyList(raw.creates) && emptyList(raw.ruleModifiers) && empty(raw.lifecycle) &&
    exactKeys(response, ['opens','order','passBehavior']) && response.opens === 'round_end' && response.order === 'turn_order' && response.passBehavior === 'decline_this_window' &&
    empty(raw.limit) && empty(raw.visibility);
}

/** Exact advance/outpost action: no hidden attack -> pay 3 -> draw up to two and play them face-down for free. */
export function isAcceptedM50DrawAndPlayFaceDownAttackAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode; const activation = record(raw.activation); const conditions = list(raw.conditions); const not = record(conditions[0]);
  const inner = record(not.condition); const cost = list(raw.cost)[0]; const effect = list(raw.effects)[0];
  return raw.kind === 'phase_action' && Array.isArray(raw.markers) && raw.markers.includes('m50_structured_v1') && automatic(raw.execution) &&
    exactKeys(activation, ['phase','opens']) && activation.phase === 'advance' && activation.opens === 'controller_action_window' &&
    conditions.length === 1 && exactKeys(not, ['type','condition']) && not.type === 'not' &&
    exactKeys(inner, ['type','target','zone','face','value']) && inner.type === 'card_count_at_least' && inner.target === 'controller' && inner.zone === 'attack_area' && inner.face === 'down' && inner.value === 1 &&
    emptyList(raw.targets) && list(raw.cost).length === 1 && !!cost && exactKeys(cost, ['type','amount']) && cost.type === 'pay_mana' && cost.amount === 3 &&
    list(raw.effects).length === 1 && !!effect && exactKeys(effect, ['type','target','count']) && effect.type === M50_DRAW_AND_PLAY_FACE_DOWN && effect.target === 'controller' && effect.count === 2 &&
    emptyList(raw.creates) && emptyList(raw.ruleModifiers) && empty(raw.lifecycle) && defaultResponse(raw.responseWindow) && empty(raw.limit) && empty(raw.visibility);
}

function sourceOwned(state: GameState, sourceId: string): boolean {
  const source = state.cards.find((candidate) => candidate.instanceId === sourceId);
  const controller = source ? state.players.find((candidate) => candidate.id === source.controllerPlayerId) : undefined;
  return !!source && !!controller && controller.status === 'active' && source.ownerPlayerId === source.controllerPlayerId &&
    ['skill','hand','attack_area'].includes(source.zone);
}
function targetIsFaceDownAttack(state: GameState, targetId: string, controllerId: string): boolean {
  const target = state.cards.find((candidate) => candidate.instanceId === targetId);
  const targetState = target ? state.abilityRuntime?.cardState[target.instanceId] : undefined;
  return !!target && target.ownerPlayerId === controllerId && target.controllerPlayerId === controllerId && target.zone === 'attack_area' &&
    targetState?.faceDown === true;
}

function matchingSourceFamilies(state: GameState, targetId: string, kind: M50FaceDownAttackRuleKind): string[] {
  if (!state.abilityRuntime) return [];
  const target = state.cards.find((candidate) => candidate.instanceId === targetId); if (!target) return [];
  const matches: string[] = [];
  for (const source of state.cards) {
    if (source.controllerPlayerId !== target.controllerPlayerId || !sourceOwned(state, source.instanceId)) continue;
    const sourceDefinition = state.abilityRuntime.pack.cards[source.definitionId]; if (!sourceDefinition) continue;
    if (!targetIsFaceDownAttack(state, targetId, source.controllerPlayerId)) continue;
    if (sourceDefinition.abilities.some((ability) => classifyM50FaceDownAttackRuleAbility(ability)?.kind === kind)) matches.push(source.instanceId);
  }
  return matches;
}

export function m50FaceDownAttackPrintedBasePowerOverride(state: GameState, targetId: string): number | undefined {
  return matchingSourceFamilies(state, targetId, 'printed_base_power_zero').length ? 0 : undefined;
}
export function m50FaceDownAttackResidual(state: GameState, targetId: string): boolean {
  return matchingSourceFamilies(state, targetId, 'residual').length > 0;
}

/** Reveal every exact residual source that is currently preserving at least one hidden attack. */
export function revealM50FaceDownAttackResidualSources(state: GameState): void {
  const runtime = state.abilityRuntime; if (!runtime) return;
  for (const source of state.cards) {
    if (!sourceOwned(state, source.instanceId)) continue;
    const sourceDefinition = runtime.pack.cards[source.definitionId];
    if (!sourceDefinition?.abilities.some((ability) => classifyM50FaceDownAttackRuleAbility(ability)?.kind === 'residual')) continue;
    const hasHidden = state.cards.some((candidate) => targetIsFaceDownAttack(state, candidate.instanceId, source.controllerPlayerId) &&
      matchingSourceFamilies(state, candidate.instanceId, 'residual').includes(source.instanceId));
    if (!hasHidden) continue;
    const sourceState = runtime.cardState[source.instanceId];
    if (sourceState) sourceState.faceDown = false;
    source.visibility = { scope: 'public' };
  }
}
