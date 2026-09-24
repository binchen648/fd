import type { GameState } from '../schema/game';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

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
function exactStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string' && entry.length > 0) && new Set(value).size === value.length;
}
function emptyList(value: unknown): boolean { return value === undefined || (Array.isArray(value) && value.length === 0); }
function emptyRecord(value: unknown): boolean { return value === undefined || Object.keys(record(value)).length === 0; }
function defaultResponse(value: unknown): boolean {
  const response = record(value);
  return Object.keys(response).length === 0 || (exactKeys(response, ['order', 'passBehavior']) && response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function automatic(ability: AuthoringAbility | RuleNode): boolean { return record((ability as RuleNode).execution).mode === 'automatic'; }

export interface M50LinkedPlayerCardModifierFamily {
  playerFlagKey: string;
  definitionId: string;
  costMultiplier: number;
  basePowerMultiplier: number;
  removeAttributes: string[];
  addAttributes: string[];
}

function cardScopeDefinitionId(modifier: RuleNode): string | undefined {
  const scope = record(modifier.scope); const cards = record(scope.cards);
  if (!exactKeys(scope, ['subject', 'cards']) || scope.subject !== 'controller' || !exactKeys(cards, ['definitionIds']) ||
      !exactStringList(cards.definitionIds) || cards.definitionIds.length !== 1) return undefined;
  return cards.definitionIds[0];
}

function permanentLifecycle(modifier: RuleNode): boolean {
  const lifecycle = record(modifier.lifecycle);
  return exactKeys(lifecycle, ['duration']) && lifecycle.duration === 'permanent';
}

/**
 * Identity-free M50 family for a source-owned card whose controller stores another
 * player id in a structured flag. While both players share a battlefield, the same
 * target definition may multiply card cost/base Power and replace printed attributes.
 */
export function classifyM50LinkedPlayerSameBattlefieldCardAbility(
  ability: AuthoringAbility | RuleNode,
): M50LinkedPlayerCardModifierFamily | undefined {
  const raw = ability as RuleNode;
  if (raw.kind !== 'passive' || !automatic(ability) || !Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') ||
      !emptyRecord(raw.activation) || !emptyList(raw.targets) || !emptyList(raw.effects) || !emptyList(raw.cost) || !emptyList(raw.creates) ||
      !emptyRecord(raw.lifecycle) || !defaultResponse(raw.responseWindow) || !emptyRecord(raw.limit) || !emptyRecord(raw.visibility)) return undefined;
  const conditions = list(raw.conditions);
  if (conditions.length !== 2 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned' ||
      !exactKeys(conditions[1]!, ['type', 'key']) || conditions[1]!.type !== 'linked_player_flag_same_battlefield' ||
      typeof conditions[1]!.key !== 'string' || !conditions[1]!.key) return undefined;
  const modifiers = list(raw.ruleModifiers);
  if (modifiers.length !== 3) return undefined;
  const cost = modifiers.find((modifier) => modifier.rule === 'card_cost');
  const power = modifiers.find((modifier) => modifier.rule === 'card_base_power');
  const attributes = modifiers.find((modifier) => modifier.rule === 'card_attributes');
  if (!cost || !power || !attributes) return undefined;
  const multiplierOk = (modifier: RuleNode): boolean =>
    Object.keys(modifier).every((key) => ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle'].includes(key)) &&
    typeof modifier.id === 'string' && modifier.id.length > 0 && (modifier.printedClause === undefined || typeof modifier.printedClause === 'string') &&
    modifier.operation === 'multiply' && Number.isSafeInteger(modifier.value) && Number(modifier.value) > 0 && permanentLifecycle(modifier);
  if (!multiplierOk(cost) || !multiplierOk(power)) return undefined;
  const costDefinitionId = cardScopeDefinitionId(cost); const powerDefinitionId = cardScopeDefinitionId(power); const attributeDefinitionId = cardScopeDefinitionId(attributes);
  if (!costDefinitionId || costDefinitionId !== powerDefinitionId || costDefinitionId !== attributeDefinitionId) return undefined;
  const attributeValue = record(attributes.value);
  if (Object.keys(attributes).some((key) => !['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle'].includes(key)) ||
      typeof attributes.id !== 'string' || !attributes.id || attributes.operation !== 'replace' || !permanentLifecycle(attributes) ||
      !exactKeys(attributeValue, ['removeAttributes', 'addAttributes']) || !exactStringList(attributeValue.removeAttributes) || !exactStringList(attributeValue.addAttributes)) return undefined;
  const removeAttributes = [...attributeValue.removeAttributes as string[]]; const addAttributes = [...attributeValue.addAttributes as string[]];
  if (removeAttributes.some((attribute) => addAttributes.includes(attribute))) return undefined;
  return {
    playerFlagKey: String(conditions[1]!.key), definitionId: costDefinitionId,
    costMultiplier: Number(cost.value), basePowerMultiplier: Number(power.value), removeAttributes, addAttributes,
  };
}

export function isAcceptedM50LinkedPlayerSameBattlefieldCardAbility(ability: AuthoringAbility | RuleNode): boolean {
  return classifyM50LinkedPlayerSameBattlefieldCardAbility(ability) !== undefined;
}
export function isAcceptedM50LinkedPlayerCardModifier(ability: AuthoringAbility | RuleNode, modifier: RuleNode): boolean {
  const family = classifyM50LinkedPlayerSameBattlefieldCardAbility(ability);
  return !!family && list((ability as RuleNode).ruleModifiers).includes(modifier);
}

function definition(state: GameState, instanceId: string): ExecutableCardDefinition | undefined {
  const instance = state.cards.find((candidate) => candidate.instanceId === instanceId);
  return instance ? state.abilityRuntime?.pack.cards[instance.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
function sourceOwned(state: GameState, instanceId: string, controllerId: string): boolean {
  const source = state.cards.find((candidate) => candidate.instanceId === instanceId);
  const controller = state.players.find((candidate) => candidate.id === controllerId);
  return !!source && !!controller && controller.status === 'active' && source.ownerPlayerId === controllerId && source.controllerPlayerId === controllerId &&
    ['skill', 'hand', 'attack_area'].includes(source.zone);
}
function sameBattlefieldLinkedPlayer(state: GameState, controllerId: string, flagKey: string): boolean {
  const controller = state.players.find((candidate) => candidate.id === controllerId);
  const linkedId = state.abilityRuntime?.structuredPlayerFlagsByPlayer?.[controllerId]?.[flagKey];
  const linked = typeof linkedId === 'string' ? state.players.find((candidate) => candidate.id === linkedId) : undefined;
  const locationId = controller?.locationId;
  const battlefield = locationId ? state.map.locations.find((location) => location.id === locationId)?.tags.includes('battlefield') === true : false;
  return !!controller && controller.status === 'active' && !!linked && linked.status === 'active' && !!locationId && battlefield && linked.locationId === locationId;
}

function matchingFamilies(state: GameState, targetInstanceId: string): M50LinkedPlayerCardModifierFamily[] {
  const target = state.cards.find((candidate) => candidate.instanceId === targetInstanceId);
  if (!target || !state.abilityRuntime) return [];
  const out: M50LinkedPlayerCardModifierFamily[] = [];
  for (const source of state.cards) {
    if (source.controllerPlayerId !== target.controllerPlayerId || !sourceOwned(state, source.instanceId, target.controllerPlayerId)) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyM50LinkedPlayerSameBattlefieldCardAbility(ability);
      if (!family || family.definitionId !== target.definitionId || !sameBattlefieldLinkedPlayer(state, target.controllerPlayerId, family.playerFlagKey)) continue;
      out.push(family);
    }
  }
  return out;
}

export function m50LinkedPlayerCardMultipliers(state: GameState, targetInstanceId: string): { basePower: number; cost: number } {
  let basePower = 1; let cost = 1;
  for (const family of matchingFamilies(state, targetInstanceId)) {
    basePower *= family.basePowerMultiplier; cost *= family.costMultiplier;
    if (!Number.isSafeInteger(basePower) || !Number.isSafeInteger(cost) || basePower < 0 || cost < 0) throw new Error('M50_LINKED_PLAYER_CARD_MULTIPLIER_OVERFLOW');
  }
  return { basePower, cost };
}

export function m50LinkedPlayerCardAttributes(state: GameState, targetInstanceId: string, baseAttributes: readonly string[]): string[] {
  const transformed = new Set(baseAttributes);
  for (const family of matchingFamilies(state, targetInstanceId)) {
    for (const attribute of family.removeAttributes) transformed.delete(attribute);
    for (const attribute of family.addAttributes) transformed.add(attribute);
  }
  return [...transformed];
}
