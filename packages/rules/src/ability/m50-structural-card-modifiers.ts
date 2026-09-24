import type { GameState } from '../schema/game';
import { isActiveCardSource } from '../core/card-source-state';
import { getEffectiveCardAttributes } from './card-instance-state';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

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
function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string' && entry.length > 0) &&
    new Set(value).size === value.length;
}
function automatic(ability: AuthoringAbility | RuleNode): boolean {
  return record((ability as RuleNode).execution).mode === 'automatic';
}
type M50ModifierApplicability =
  | { sourceRequirement: 'owned' | 'active' }
  | { sourceRequirement: 'owned'; playerFlag: { key: string; value: boolean | string | number } }
  | { sourceRequirement: 'owned'; roundPlayerFlagKey: string };

function modifierApplicability(ability: AuthoringAbility | RuleNode): M50ModifierApplicability | undefined {
  const conditions = list((ability as RuleNode).conditions);
  if (conditions.length === 2 && exactKeys(conditions[0]!, ['type']) && conditions[0]!.type === 'source_owned' &&
      exactKeys(conditions[1]!, ['type', 'key']) && conditions[1]!.type === 'player_flag_number_current_round' &&
      typeof conditions[1]!.key === 'string' && conditions[1]!.key.length > 0) {
    return { sourceRequirement: 'owned', roundPlayerFlagKey: String(conditions[1]!.key) };
  }
  if (conditions.length !== 1) return undefined;
  const condition = conditions[0]!;
  if (exactKeys(condition, ['type']) && condition.type === 'source_owned') return { sourceRequirement: 'owned' };
  if (exactKeys(condition, ['type']) && condition.type === 'source_active') return { sourceRequirement: 'active' };
  if (exactKeys(condition, ['type', 'key', 'value']) && condition.type === 'player_flag_equals' &&
      typeof condition.key === 'string' && condition.key.length > 0 &&
      ['boolean', 'string', 'number'].includes(typeof condition.value) &&
      (typeof condition.value !== 'number' || Number.isFinite(condition.value))) {
    return { sourceRequirement: 'owned', playerFlag: { key: condition.key, value: condition.value as boolean | string | number } };
  }
  return undefined;
}

export interface M50AdditiveCardModifier {
  rule: 'card_power' | 'card_cost';
  amount: number;
  sourceRequirement: 'owned' | 'active';
  playerFlag?: { key: string; value: boolean | string | number };
  roundPlayerFlagKey?: string;
  basic?: true;
  attributesAny?: string[];
  definitionIds?: string[];
}

/**
 * Bounded identity-free M50 modifier envelope. This intentionally accepts only
 * additive effective Power / play-cost modifiers over controller-owned cards.
 * Other operations, rules, subjects, selector keys, and lifecycles remain fail-closed.
 */
export function classifyM50AdditiveCardModifier(
  ability: AuthoringAbility | RuleNode,
  modifier: RuleNode,
): M50AdditiveCardModifier | undefined {
  const a = ability as RuleNode;
  if (!Array.isArray(a.markers) || !a.markers.includes('m50_structured_v1') ||
      !automatic(ability) || !['passive', 'residual'].includes(String(a.kind))) return undefined;
  const applicability = modifierApplicability(ability); if (!applicability) return undefined;
  const conditionalFlag = 'playerFlag' in applicability;
  const exactWithLifecycle = exactKeys(modifier, ['id', 'operation', 'rule', 'scope', 'value', 'lifecycle']) ||
    exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle']);
  const exactWithoutLifecycle = exactKeys(modifier, ['id', 'operation', 'rule', 'scope', 'value']) ||
    exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value']);
  if (conditionalFlag ? !exactWithoutLifecycle : !exactWithLifecycle) return undefined;
  if (modifier.operation !== 'add' || !['card_power', 'card_cost'].includes(String(modifier.rule)) ||
      !Number.isSafeInteger(modifier.value)) return undefined;
  const amount = Number(modifier.value);
  if (!conditionalFlag) {
    const lifecycle = record(modifier.lifecycle);
    const expectedDuration = applicability.sourceRequirement === 'owned' ? 'permanent' : 'while_active';
    if (!exactKeys(lifecycle, ['duration']) || lifecycle.duration !== expectedDuration) return undefined;
  }
  const scope = record(modifier.scope); const cards = record(scope.cards);
  if (!exactKeys(scope, ['subject', 'cards']) || scope.subject !== 'controller') return undefined;
  const allowedCardKeys = new Set(['basic', 'attributesAny', 'definitionIds']);
  if (Object.keys(cards).length === 0 || Object.keys(cards).some((key) => !allowedCardKeys.has(key))) return undefined;
  if (cards.basic !== undefined && cards.basic !== true) return undefined;
  if (cards.attributesAny !== undefined && !stringList(cards.attributesAny)) return undefined;
  if (cards.definitionIds !== undefined && !stringList(cards.definitionIds)) return undefined;
  if (cards.basic === undefined && cards.attributesAny === undefined && cards.definitionIds === undefined) return undefined;
  return {
    rule: modifier.rule as 'card_power' | 'card_cost', amount, sourceRequirement: applicability.sourceRequirement,
    ...(conditionalFlag ? { playerFlag: { ...applicability.playerFlag } } : {}),
    ...('roundPlayerFlagKey' in applicability ? { roundPlayerFlagKey: applicability.roundPlayerFlagKey } : {}),
    ...(cards.basic === true ? { basic: true as const } : {}),
    ...(cards.attributesAny !== undefined ? { attributesAny: [...cards.attributesAny as string[]] } : {}),
    ...(cards.definitionIds !== undefined ? { definitionIds: [...cards.definitionIds as string[]] } : {}),
  };
}

export function isAcceptedM50AdditiveCardModifier(ability: AuthoringAbility | RuleNode, modifier: RuleNode): boolean {
  return classifyM50AdditiveCardModifier(ability, modifier) !== undefined;
}

export type M50PermanentPlayerRuleModifier =
  | { kind: 'deployment_mana_forbid'; sourceRequirement: 'owned'; locationId: 'magic_workshop' }
  | { kind: 'regular_movement_cost_subtract'; sourceRequirement: 'owned'; fromLocationId: 'magic_workshop'; amount: 1 }
  | { kind: 'deployment_destination_forbid'; sourceRequirement: 'owned'; locationId: 'magic_workshop' }
  | { kind: 'movement_destination_forbid'; sourceRequirement: 'owned'; locationId: 'magic_workshop' }
  | { kind: 'card_play_ignore'; sourceRequirement: 'owned' };

function normalizedWorkshopLocation(value: unknown): 'magic_workshop' | undefined {
  return value === 'workshop' || value === 'magic_workshop' ? 'magic_workshop' : undefined;
}

/** Narrow permanent controller-rule modifiers used by source-grounded M50 consumers. */
export function classifyM50PermanentPlayerRuleModifier(
  ability: AuthoringAbility | RuleNode,
  modifier: RuleNode,
): M50PermanentPlayerRuleModifier | undefined {
  const a = ability as RuleNode;
  if (!Array.isArray(a.markers) || !a.markers.includes('m50_structured_v1') || !automatic(ability) || a.kind !== 'passive') return undefined;
  const applicability = modifierApplicability(ability);
  if (!applicability || applicability.sourceRequirement !== 'owned' || 'playerFlag' in applicability) return undefined;
  const abilityLifecycle = record(a.lifecycle);
  const modifierLifecycle = record(modifier.lifecycle);
  if (!exactKeys(modifierLifecycle, ['duration']) || modifierLifecycle.duration !== 'permanent') return undefined;
  const scope = record(modifier.scope);
  const modifierKeys = Object.keys(modifier);
  const commonKeys = new Set(['id', 'printedClause', 'operation', 'rule', 'scope', 'lifecycle']);
  const independentPermanentEnvelope = Object.keys(abilityLifecycle).length === 0 ||
    (exactKeys(abilityLifecycle, ['duration']) && abilityLifecycle.duration === 'permanent');
  if (!independentPermanentEnvelope) return undefined;
  if (modifier.operation === 'forbid' && modifier.rule === 'deployment_destinations') {
    if (modifierKeys.some((key) => !commonKeys.has(key)) || !exactKeys(scope, ['subject', 'locationIds']) ||
        scope.subject !== 'controller' || !Array.isArray(scope.locationIds) || scope.locationIds.length !== 1) return undefined;
    const locationId = normalizedWorkshopLocation(scope.locationIds[0]);
    return locationId ? { kind: 'deployment_destination_forbid', sourceRequirement: 'owned', locationId } : undefined;
  }
  if (modifier.operation === 'forbid' && modifier.rule === 'movement_destinations') {
    if (modifierKeys.some((key) => !commonKeys.has(key)) || !exactKeys(scope, ['subject', 'toLocationIds']) ||
        scope.subject !== 'controller' || !Array.isArray(scope.toLocationIds) || scope.toLocationIds.length !== 1) return undefined;
    const locationId = normalizedWorkshopLocation(scope.toLocationIds[0]);
    return locationId ? { kind: 'movement_destination_forbid', sourceRequirement: 'owned', locationId } : undefined;
  }
  if (modifier.operation === 'ignore' && modifier.rule === 'card_play') {
    if (modifierKeys.some((key) => !commonKeys.has(key)) || !exactKeys(scope, ['subject']) || scope.subject !== 'controller') return undefined;
    return { kind: 'card_play_ignore', sourceRequirement: 'owned' };
  }
  if (!exactKeys(abilityLifecycle, ['duration']) || abilityLifecycle.duration !== 'permanent') return undefined;
  if (modifier.operation === 'forbid' && modifier.rule === 'deployment_resource_gain') {
    if (modifierKeys.some((key) => !commonKeys.has(key)) || !exactKeys(scope, ['subject', 'resource', 'locationIds']) ||
        scope.subject !== 'controller' || scope.resource !== 'mana' || !Array.isArray(scope.locationIds) || scope.locationIds.length !== 1) return undefined;
    const locationId = normalizedWorkshopLocation(scope.locationIds[0]);
    return locationId ? { kind: 'deployment_mana_forbid', sourceRequirement: 'owned', locationId } : undefined;
  }
  if (modifier.operation === 'subtract' && modifier.rule === 'movement_cost') {
    const movementKeys = new Set([...commonKeys, 'value']);
    if (modifierKeys.some((key) => !movementKeys.has(key)) || modifier.value !== 1 ||
        !exactKeys(scope, ['subject', 'method', 'fromLocationIds']) || scope.subject !== 'controller' || scope.method !== 'regular' ||
        !Array.isArray(scope.fromLocationIds) || scope.fromLocationIds.length !== 1) return undefined;
    const fromLocationId = normalizedWorkshopLocation(scope.fromLocationIds[0]);
    return fromLocationId ? { kind: 'regular_movement_cost_subtract', sourceRequirement: 'owned', fromLocationId, amount: 1 } : undefined;
  }
  return undefined;
}

export function isAcceptedM50PermanentPlayerRuleModifier(ability: AuthoringAbility | RuleNode, modifier: RuleNode): boolean {
  return classifyM50PermanentPlayerRuleModifier(ability, modifier) !== undefined;
}

function definition(state: GameState, instanceId: string): ExecutableCardDefinition | undefined {
  const instance = state.cards.find((card) => card.instanceId === instanceId);
  return instance ? state.abilityRuntime?.pack.cards[instance.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
function sourceApplies(state: GameState, instanceId: string, controllerId: string, required: 'owned' | 'active'): boolean {
  const source = state.cards.find((card) => card.instanceId === instanceId);
  if (!source || source.controllerPlayerId !== controllerId || source.ownerPlayerId !== controllerId) return false;
  if (required === 'active') return isActiveCardSource(state, instanceId);
  const player = state.players.find((candidate) => candidate.id === controllerId);
  return !!player && player.status !== 'eliminated' && ['skill', 'hand', 'attack_area'].includes(source.zone);
}
function targetMatches(state: GameState, targetInstanceId: string, family: M50AdditiveCardModifier): boolean {
  const target = state.cards.find((card) => card.instanceId === targetInstanceId);
  const targetDefinition = definition(state, targetInstanceId);
  if (!target || !targetDefinition) return false;
  if (family.basic === true && targetDefinition.cardType !== 'basic_attack') return false;
  if (family.definitionIds && !family.definitionIds.includes(target.definitionId)) return false;
  if (family.attributesAny) {
    const attributes = getEffectiveCardAttributes(state, targetInstanceId);
    if (!family.attributesAny.some((attribute) => attributes.includes(attribute))) return false;
  }
  return true;
}

export function m50DeploymentManaGainForbidden(state: GameState, playerId: string, locationId: string): boolean {
  if (!state.abilityRuntime || normalizedWorkshopLocation(locationId) !== 'magic_workshop') return false;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      for (const modifier of ability.ruleModifiers ?? []) {
        const family = classifyM50PermanentPlayerRuleModifier(ability, modifier);
        if (family?.kind === 'deployment_mana_forbid' && family.locationId === 'magic_workshop' &&
            sourceApplies(state, source.instanceId, playerId, family.sourceRequirement)) return true;
      }
    }
  }
  return false;
}

export function m50RegularMovementCostDiscount(state: GameState, playerId: string, fromLocationId: string): number {
  if (!state.abilityRuntime || normalizedWorkshopLocation(fromLocationId) !== 'magic_workshop') return 0;
  let discount = 0;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      for (const modifier of ability.ruleModifiers ?? []) {
        const family = classifyM50PermanentPlayerRuleModifier(ability, modifier);
        if (family?.kind === 'regular_movement_cost_subtract' && family.fromLocationId === 'magic_workshop' &&
            sourceApplies(state, source.instanceId, playerId, family.sourceRequirement)) {
          discount += family.amount;
          if (!Number.isSafeInteger(discount) || discount < 0) throw new Error('M50_STRUCTURAL_MOVEMENT_DISCOUNT_OVERFLOW');
        }
      }
    }
  }
  return discount;
}

export function m50DeploymentDestinationForbidden(state: GameState, playerId: string, locationId: string): boolean {
  if (!state.abilityRuntime || normalizedWorkshopLocation(locationId) !== 'magic_workshop') return false;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) for (const modifier of ability.ruleModifiers ?? []) {
      const family = classifyM50PermanentPlayerRuleModifier(ability, modifier);
      if (family?.kind === 'deployment_destination_forbid' && family.locationId === 'magic_workshop' &&
          sourceApplies(state, source.instanceId, playerId, family.sourceRequirement)) return true;
    }
  }
  return false;
}

export function m50MovementDestinationForbidden(state: GameState, playerId: string, locationId: string): boolean {
  if (!state.abilityRuntime || normalizedWorkshopLocation(locationId) !== 'magic_workshop') return false;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) for (const modifier of ability.ruleModifiers ?? []) {
      const family = classifyM50PermanentPlayerRuleModifier(ability, modifier);
      if (family?.kind === 'movement_destination_forbid' && family.locationId === 'magic_workshop' &&
          sourceApplies(state, source.instanceId, playerId, family.sourceRequirement)) return true;
    }
  }
  return false;
}

export function m50IgnoresCardEffectPlayRestrictions(state: GameState, playerId: string): boolean {
  if (!state.abilityRuntime) return false;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) for (const modifier of ability.ruleModifiers ?? []) {
      const family = classifyM50PermanentPlayerRuleModifier(ability, modifier);
      if (family?.kind === 'card_play_ignore' && sourceApplies(state, source.instanceId, playerId, family.sourceRequirement)) return true;
    }
  }
  return false;
}

export function m50AdditiveCardAdjustment(state: GameState, targetInstanceId: string): { power: number; cost: number } {
  const target = state.cards.find((card) => card.instanceId === targetInstanceId);
  if (!target || !state.abilityRuntime) return { power: 0, cost: 0 };
  let power = 0; let cost = 0;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== target.controllerPlayerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      for (const modifier of ability.ruleModifiers ?? []) {
        const family = classifyM50AdditiveCardModifier(ability, modifier);
        if (!family || !sourceApplies(state, source.instanceId, target.controllerPlayerId, family.sourceRequirement) ||
            (family.playerFlag && state.abilityRuntime.structuredPlayerFlagsByPlayer?.[target.controllerPlayerId]?.[family.playerFlag.key] !== family.playerFlag.value) ||
            (family.roundPlayerFlagKey && state.abilityRuntime.structuredPlayerFlagsByPlayer?.[target.controllerPlayerId]?.[family.roundPlayerFlagKey] !== state.round.roundNumber) ||
            !targetMatches(state, targetInstanceId, family)) continue;
        if (family.rule === 'card_power') power += family.amount;
        else cost += family.amount;
        if (!Number.isSafeInteger(power) || !Number.isSafeInteger(cost)) throw new Error('M50_STRUCTURAL_CARD_MODIFIER_OVERFLOW');
      }
    }
  }
  return { power, cost };
}

export interface M50StructuredStandardAppendRule {
  manaAtLeast: number;
  definitionIds: string[];
  extraCost: number;
}

function emptyRecord(value: unknown): boolean { return Object.keys(record(value)).length === 0; }
function emptyArray(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function defaultResponse(value: unknown): boolean {
  const response = record(value);
  return Object.keys(response).length === 0 || (exactKeys(response, ['order', 'passBehavior']) && response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}

/** Optional standard-append permission: ordinary play remains ordinary; surcharge applies only when the card occupies the extra slot. */
export function classifyM50StructuredStandardAppendAbility(ability: AuthoringAbility | RuleNode): M50StructuredStandardAppendRule | undefined {
  const raw = ability as RuleNode;
  if (!Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') || raw.kind !== 'passive' || !automatic(ability) ||
      !emptyRecord(raw.activation) || !emptyArray(raw.targets) || !emptyArray(raw.effects) || !emptyArray(raw.cost) || !emptyArray(raw.creates) ||
      !emptyRecord(raw.lifecycle) || !defaultResponse(raw.responseWindow) || !emptyRecord(raw.limit) || !emptyRecord(raw.visibility) ||
      (Array.isArray(raw.transforms) && raw.transforms.length > 0)) return undefined;
  const conditions = list(raw.conditions);
  if (conditions.length !== 2 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned' ||
      !exactKeys(conditions[1]!, ['type', 'amount']) || conditions[1]!.type !== 'mana_at_least' ||
      !Number.isSafeInteger(conditions[1]!.amount) || Number(conditions[1]!.amount) < 0) return undefined;
  const modifiers = list(raw.ruleModifiers); if (modifiers.length !== 2) return undefined;
  const allow = modifiers[0]!; const surcharge = modifiers[1]!;
  const allowScope = record(allow.scope); const allowCards = record(allowScope.cards); const allowLife = record(allow.lifecycle);
  const costScope = record(surcharge.scope); const costCards = record(costScope.cards); const costLife = record(surcharge.lifecycle);
  if (!exactKeys(allow, ['id', 'operation', 'rule', 'scope', 'lifecycle']) || allow.operation !== 'allow' || allow.rule !== 'standard_append' ||
      !exactKeys(allowScope, ['subject', 'cards']) || allowScope.subject !== 'controller' || !exactKeys(allowCards, ['definitionIds']) || !stringList(allowCards.definitionIds) ||
      !exactKeys(allowLife, ['duration']) || allowLife.duration !== 'permanent') return undefined;
  if (!exactKeys(surcharge, ['id', 'operation', 'rule', 'scope', 'value', 'lifecycle']) || surcharge.operation !== 'add' || surcharge.rule !== 'standard_append_cost' ||
      !Number.isSafeInteger(surcharge.value) || Number(surcharge.value) < 0 || !exactKeys(costScope, ['subject', 'cards']) || costScope.subject !== 'controller' ||
      !exactKeys(costCards, ['definitionIds']) || JSON.stringify(costCards.definitionIds) !== JSON.stringify(allowCards.definitionIds) ||
      !exactKeys(costLife, ['duration']) || costLife.duration !== 'permanent') return undefined;
  return { manaAtLeast: Number(conditions[1]!.amount), definitionIds: [...allowCards.definitionIds as string[]], extraCost: Number(surcharge.value) };
}

export function isAcceptedM50StructuredStandardAppendAbility(ability: AuthoringAbility | RuleNode): boolean {
  return classifyM50StructuredStandardAppendAbility(ability) !== undefined;
}

export function m50StructuredStandardAppendTargetIsAttack(state: GameState, playerId: string, targetInstanceId: string): boolean {
  const runtime = state.abilityRuntime; const target = state.cards.find((candidate) => candidate.instanceId === targetInstanceId);
  if (!runtime || !target || target.controllerPlayerId !== playerId) return false;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyM50StructuredStandardAppendAbility(ability); if (!family) continue;
      if (sourceApplies(state, source.instanceId, playerId, 'owned') && family.definitionIds.includes(target.definitionId)) return true;
    }
  }
  return false;
}

export function m50StructuredStandardAppendRule(state: GameState, playerId: string, targetInstanceId: string): { extraCost: number } | undefined {
  const runtime = state.abilityRuntime; const target = state.cards.find((candidate) => candidate.instanceId === targetInstanceId);
  const controller = state.players.find((candidate) => candidate.id === playerId);
  if (!runtime || !target || !controller || controller.status === 'eliminated' || target.controllerPlayerId !== playerId) return undefined;
  const matches: M50StructuredStandardAppendRule[] = [];
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyM50StructuredStandardAppendAbility(ability); if (!family) continue;
      if (!sourceApplies(state, source.instanceId, playerId, 'owned') || controller.mana < family.manaAtLeast || !family.definitionIds.includes(target.definitionId)) continue;
      matches.push(family);
    }
  }
  if (matches.length > 1) throw new Error('M50_STRUCTURED_APPEND_AMBIGUOUS');
  return matches[0] ? { extraCost: matches[0].extraCost } : undefined;
}
