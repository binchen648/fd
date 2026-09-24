import type { GameState } from '../schema/game';
import { isActiveCardSource } from '../core/card-source-state';
import { getEffectiveCardAttributes } from './card-instance-state';
import { isAcceptedM50AdditiveCardModifier } from './m50-structural-card-modifiers';
import { isAcceptedNextRoundSituationBenefitSuppressionAbility } from './next-round-situation-benefit-suppression';
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
function empty(value: unknown): boolean { return Object.keys(record(value)).length === 0; }
function emptyList(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function exactDefaultResponse(value: unknown): boolean {
  const response = record(value); const keys = Object.keys(response);
  return keys.length === 0 || (exactKeys(response, ['order', 'passBehavior']) && response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function automatic(value: unknown): boolean {
  const execution = record(value);
  return execution.mode === 'automatic' && Object.keys(execution).every((key) => ['mode', 'allowedOperations'].includes(key)) &&
    (execution.allowedOperations === undefined || (Array.isArray(execution.allowedOperations) && execution.allowedOperations.length === 0));
}
function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string' && entry.length > 0) && new Set(value).size === value.length;
}

export interface M50GrantedCardAbilityFamily {
  attributesAny?: string[];
  definitionIds?: string[];
  basic?: true;
  sourceRequirement: 'owned' | 'active' | 'revealed';
  targetSubject?: 'controller' | 'all_players';
  nameOverride?: string;
  forbidNonEffectVictoryPointGain?: true;
  combatPowerPerFaceUpDefinition?: { definitionId: string; amount: number };
  grantedAbility: AuthoringAbility;
}

export function isAcceptedM50BladeStormGrantedAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode; const activation = record(raw.activation); const effects = list(raw.effects); const effect = effects[0]; const cost = list(raw.cost)[0];
  const limit = record(raw.limit);
  return raw.kind === 'phase_action' && automatic(raw.execution) &&
    exactKeys(activation, ['phase','opens','requiresSourceState']) && activation.phase === 'action' && activation.opens === 'controller_action_window' && activation.requiresSourceState === 'active' &&
    emptyList(raw.conditions) && emptyList(raw.targets) && effects.length === 1 && !!effect &&
    exactKeys(effect, ['type']) && effect.type === 'double_source_base_power_remove_after_battle' &&
    list(raw.cost).length === 1 && !!cost && exactKeys(cost, ['type','amount']) && cost.type === 'pay_mana' && cost.amount === 2 &&
    emptyList(raw.creates) && emptyList(raw.ruleModifiers) && empty(raw.lifecycle) && exactDefaultResponse(raw.responseWindow) &&
    exactKeys(limit, ['type','uses','scope']) && limit.type === 'per_round' && limit.uses === 1 && limit.scope === 'this_card' && empty(raw.visibility);
}

export function isAcceptedM50SourceCardCombatJoinAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  const activation = record(raw.activation); const effect = list(raw.effects)[0]; const cost = list(raw.cost)[0];
  return raw.kind === 'phase_action' && automatic(raw.execution) &&
    exactKeys(activation, ['phase', 'opens']) && activation.phase === 'combat' && activation.opens === 'controller_combat_action_window' &&
    emptyList(raw.conditions) && emptyList(raw.targets) && list(raw.effects).length === 1 && !!effect &&
    exactKeys(effect, ['type', 'allowedSourceZones']) && effect.type === 'join_source_card_to_attack' &&
    Array.isArray(effect.allowedSourceZones) && JSON.stringify(effect.allowedSourceZones) === JSON.stringify(['hand', 'skill']) &&
    list(raw.cost).length === 1 && !!cost && exactKeys(cost, ['type', 'amount']) && cost.type === 'pay_mana' && cost.amount === 6 &&
    emptyList(raw.creates) && emptyList(raw.ruleModifiers) && empty(raw.lifecycle) && exactDefaultResponse(raw.responseWindow) &&
    empty(raw.limit) && empty(raw.visibility);
}

export function isAcceptedM50FreeSourceCardCombatPlayAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode; const activation = record(raw.activation); const effects = list(raw.effects);
  const effect = effects[0];
  return raw.kind === 'phase_action' && automatic(raw.execution) &&
    exactKeys(activation, ['phase', 'opens']) && activation.phase === 'combat' && activation.opens === 'controller_combat_action_window' &&
    emptyList(raw.conditions) && emptyList(raw.targets) && emptyList(raw.cost) && effects.length === 1 && !!effect &&
    exactKeys(effect, ['type', 'face']) && effect.type === 'play_source_card' && effect.face === 'face_up' &&
    emptyList(raw.creates) && emptyList(raw.ruleModifiers) && empty(raw.lifecycle) && exactDefaultResponse(raw.responseWindow) &&
    empty(raw.limit) && empty(raw.visibility);
}

export function isAcceptedM50BoundaryBottomDiscardAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  const activation = record(raw.activation); const targets = list(raw.targets); const effects = list(raw.effects);
  if (raw.kind !== 'phase_action' || !automatic(raw.execution) ||
      !exactKeys(activation, ['phase','opens','requiresSourceState']) || activation.phase !== 'combat' ||
      activation.opens !== 'controller_combat_action_window' || activation.requiresSourceState !== 'active' ||
      !emptyList(raw.conditions) || targets.length !== 1 || effects.length !== 1 || !emptyList(raw.cost) ||
      !emptyList(raw.creates) || !emptyList(raw.ruleModifiers) || !empty(raw.lifecycle) || !exactDefaultResponse(raw.responseWindow) ||
      !empty(raw.visibility)) return false;
  const target = targets[0]!; const count = record(target.count); const constraints = list(target.constraints);
  if (!exactKeys(target, ['id','type','count','constraints']) || target.id !== 'boundary_target' || target.type !== 'player' ||
      !exactKeys(count, ['min','max']) || count.min !== 1 || count.max !== 1 || constraints.length !== 2) return false;
  const sameBattlefield = constraints[0]!; const nonemptyDeck = constraints[1]!;
  if (!exactKeys(sameBattlefield, ['type']) || sameBattlefield.type !== 'same_battlefield_as_controller' ||
      !exactKeys(nonemptyDeck, ['type','target','zone','value']) || nonemptyDeck.type !== 'card_count_at_least' ||
      nonemptyDeck.target !== 'controller' || nonemptyDeck.zone !== 'deck' || nonemptyDeck.value !== 1) return false;
  const effect = effects[0]!;
  if (!exactKeys(effect, ['type','target']) || effect.type !== 'discard_bottom_card' || effect.target !== 'boundary_target') return false;
  const limit = record(raw.limit);
  return exactKeys(limit, ['type','uses','scope']) && limit.type === 'per_round' && limit.uses === 1 && limit.scope === 'this_card';
}
export function isAcceptedM50GrantedRoundDefeatIgnoreAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode; const activation = record(raw.activation); const modifiers = list(raw.ruleModifiers);
  const limit = record(raw.limit);
  if (raw.kind !== 'phase_action' || !automatic(raw.execution) ||
      !exactKeys(activation, ['phase','opens','requiresSourceState']) || activation.phase !== 'combat' ||
      activation.opens !== 'controller_combat_action_window' || activation.requiresSourceState !== 'active' ||
      !emptyList(raw.conditions) || !emptyList(raw.targets) || !emptyList(raw.effects) || !emptyList(raw.cost) ||
      !emptyList(raw.creates) || modifiers.length !== 1 || !empty(raw.lifecycle) || !exactDefaultResponse(raw.responseWindow) ||
      !exactKeys(limit, ['type','uses','scope']) || limit.type !== 'per_round' || limit.uses !== 1 || limit.scope !== 'this_card' ||
      !empty(raw.visibility)) return false;
  const modifier = modifiers[0]!; const scope = record(modifier.scope); const lifecycle = record(modifier.lifecycle); const priority = record(modifier.priority);
  return exactKeys(modifier, ['id','printedClause','operation','rule','scope','lifecycle','priority','conflictPolicy']) &&
    modifier.operation === 'ignore' && modifier.rule === 'defeat' && exactKeys(scope, ['subject']) && scope.subject === 'controller' &&
    exactKeys(lifecycle, ['duration']) && lifecycle.duration === 'this_round' &&
    exactKeys(priority, ['tier','specificity']) && priority.tier === 'card_text' && priority.specificity === 'explicit_exception' &&
    modifier.conflictPolicy === 'explicit_exception_over_general';
}

/** Exact M50 transform envelopes. Runtime routing is structural and identity-free. */
export function classifyM50GrantedCardAbilitySource(ability: AuthoringAbility | RuleNode): M50GrantedCardAbilityFamily | undefined {
  const raw = ability as RuleNode;
  if (!Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') || !automatic(raw.execution) ||
      !emptyList(raw.targets) || !emptyList(raw.effects) || !emptyList(raw.cost) || !emptyList(raw.creates) ||
      !exactDefaultResponse(raw.responseWindow) || !empty(raw.limit)) return undefined;
  const conditions = list(raw.conditions); const modifiers = list(raw.ruleModifiers); const transforms = list(raw.transforms);
  if (transforms.length !== 1) return undefined;
  const transform = transforms[0]!; const target = record(transform.target); const cards = record(target.cards); const transformLifecycle = record(transform.lifecycle);
  const grants = list(transform.grantAbilities);
  if (grants.length !== 1 || transform.type !== 'card' || !exactKeys(target, ['subject','cards']) ||
      !['controller','all_players'].includes(String(target.subject))) return undefined;

  if (raw.kind === 'passive' && target.subject === 'all_players') {
    const activation = record(raw.activation); const parentLifecycle = record(raw.lifecycle); const modifier = modifiers[0];
    const modifierScope = record(modifier?.scope); const modifierLifecycle = record(modifier?.lifecycle); const value = record(modifier?.value);
    const args = list(value.args); const countMetric = args[1] ?? {}; const constant = args[0] ?? {};
    if (!exactKeys(activation, ['requiresSourceState']) || activation.requiresSourceState !== 'active' || conditions.length !== 2 ||
        !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_active' ||
        !exactKeys(conditions[1]!, ['type','phase']) || conditions[1]!.type !== 'phase_is' || conditions[1]!.phase !== 'combat' ||
        modifiers.length !== 1 || !modifier || !exactKeys(modifier, ['id','operation','rule','scope','value','lifecycle']) ||
        modifier.operation !== 'add' || modifier.rule !== 'combat_power' || !exactKeys(modifierScope, ['subject']) || modifierScope.subject !== 'controller' ||
        !exactKeys(value, ['type','op','args']) || value.type !== 'formula' || value.op !== 'multiply' || args.length !== 2 ||
        !exactKeys(constant, ['type','value']) || constant.type !== 'constant' || constant.value !== 2 ||
        !exactKeys(countMetric, ['type','metric','source','key']) || countMetric.type !== 'metric' || countMetric.metric !== 'face_up_definition_count' || countMetric.source !== 'all_players' ||
        typeof countMetric.key !== 'string' || !countMetric.key || !exactKeys(modifierLifecycle, ['duration']) || modifierLifecycle.duration !== 'while_active' ||
        !exactKeys(parentLifecycle, ['duration']) || parentLifecycle.duration !== 'while_active' || !empty(raw.visibility) ||
        !exactKeys(transform, ['id','printedClause','type','target','grantAbilities','lifecycle']) ||
        !exactKeys(cards, ['definitionIds']) || !stringList(cards.definitionIds) || cards.definitionIds.length !== 1 || cards.definitionIds[0] !== countMetric.key ||
        !exactKeys(transformLifecycle, ['duration']) || transformLifecycle.duration !== 'while_active' ||
        !isAcceptedM50FreeSourceCardCombatPlayAbility(grants[0]!)) return undefined;
    return {
      definitionIds: [...cards.definitionIds], sourceRequirement: 'active', targetSubject: 'all_players',
      combatPowerPerFaceUpDefinition: { definitionId: String(countMetric.key), amount: 2 },
      grantedAbility: grants[0]! as unknown as AuthoringAbility,
    };
  }

  if (conditions.length !== 1 || target.subject !== 'controller') return undefined;
  if (raw.kind === 'passive' && exactKeys(conditions[0]!, ['type']) && conditions[0]!.type === 'source_revealed') {
    if (!empty(raw.activation) || !empty(raw.lifecycle) || !empty(raw.visibility) || modifiers.length !== 0 ||
        !exactKeys(transform, ['id','type','target','grantAbilities','lifecycle']) || !exactKeys(cards, ['basic']) || cards.basic !== true ||
        !exactKeys(transformLifecycle, ['duration']) || transformLifecycle.duration !== 'permanent' ||
        !isAcceptedM50BladeStormGrantedAbility(grants[0]!)) return undefined;
    return { basic: true, sourceRequirement: 'revealed', grantedAbility: grants[0]! as unknown as AuthoringAbility };
  }
  if (raw.kind === 'passive') {
    if (!empty(raw.activation) || !empty(raw.lifecycle) || !empty(raw.visibility) || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_owned' || modifiers.length !== 1 ||
        !isAcceptedM50AdditiveCardModifier(ability, modifiers[0]!) ||
        !exactKeys(transform, ['id','type','target','grantAbilities','lifecycle']) ||
        !exactKeys(transformLifecycle, ['duration']) || transformLifecycle.duration !== 'permanent') return undefined;
    const modifierScope = record(modifiers[0]!.scope); const modifierCards = record(modifierScope.cards);
    if (exactKeys(cards, ['attributesAny']) && stringList(cards.attributesAny)) {
      if (!Array.isArray(modifierCards.attributesAny) || JSON.stringify(modifierCards.attributesAny) !== JSON.stringify(cards.attributesAny)) return undefined;
      const ciel = isAcceptedNextRoundSituationBenefitSuppressionAbility(grants[0]!, 'compiled');
      const boundary = exactKeys(modifierCards, ['attributesAny']) && modifiers[0]!.rule === 'card_power' && modifiers[0]!.value === 2 &&
        isAcceptedM50BoundaryBottomDiscardAbility(grants[0]!);
      if (!ciel && !boundary) return undefined;
      return { attributesAny: [...cards.attributesAny], sourceRequirement: 'owned', grantedAbility: grants[0]! as unknown as AuthoringAbility };
    }
    if (exactKeys(cards, ['definitionIds']) && stringList(cards.definitionIds)) {
      if (modifierCards.basic !== true || !Array.isArray(modifierCards.attributesAny) || modifierCards.attributesAny.length !== 1 ||
          modifiers[0]!.value !== 3 || !isAcceptedM50SourceCardCombatJoinAbility(grants[0]!)) return undefined;
      return { definitionIds: [...cards.definitionIds], sourceRequirement: 'owned', grantedAbility: grants[0]! as unknown as AuthoringAbility };
    }
    return undefined;
  }

  const sourceActivation = record(raw.activation);
  if (raw.kind !== 'residual' || !exactKeys(sourceActivation, ['requiresSourceState']) || sourceActivation.requiresSourceState !== 'active' ||
      !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_active' || modifiers.length !== 1) return undefined;
  const parentLifecycle = record(raw.lifecycle); const parentVisibility = record(raw.visibility); const modifier = modifiers[0]!; const modifierScope = record(modifier.scope);
  const modifierLifecycle = record(modifier.lifecycle); const priority = record(modifier.priority); const set = record(transform.set);
  if (!exactKeys(parentLifecycle, ['starts','duration','cleanup']) || parentLifecycle.starts !== 'immediate' || parentLifecycle.duration !== 'while_active' || parentLifecycle.cleanup !== 'remain_active' ||
      !exactKeys(parentVisibility, ['revealsTrueName','revealTiming','revealScope']) || parentVisibility.revealsTrueName !== true ||
      parentVisibility.revealTiming !== 'on_use_declared' || parentVisibility.revealScope !== 'servant_package' ||
      !exactKeys(modifier, ['id','printedClause','operation','rule','scope','lifecycle','priority','conflictPolicy']) ||
      modifier.operation !== 'forbid' || modifier.rule !== 'non_effect_victory_point_gain' ||
      !exactKeys(modifierScope, ['subject']) || modifierScope.subject !== 'controller' ||
      !exactKeys(modifierLifecycle, ['duration']) || modifierLifecycle.duration !== 'while_active' ||
      !exactKeys(priority, ['tier','specificity']) || priority.tier !== 'card_text' || priority.specificity !== 'explicit_exception' ||
      modifier.conflictPolicy !== 'explicit_exception_over_general' ||
      !exactKeys(transform, ['id','printedClause','type','target','set','grantAbilities','lifecycle']) ||
      !exactKeys(cards, ['basic','attributesAny']) || cards.basic !== true || !stringList(cards.attributesAny) ||
      !exactKeys(set, ['name']) || typeof set.name !== 'string' || set.name.length === 0 ||
      !exactKeys(transformLifecycle, ['duration']) || transformLifecycle.duration !== 'while_active' ||
      !isAcceptedM50GrantedRoundDefeatIgnoreAbility(grants[0]!)) return undefined;
  return {
    basic: true, attributesAny: [...cards.attributesAny], sourceRequirement: 'active', nameOverride: set.name,
    forbidNonEffectVictoryPointGain: true, grantedAbility: grants[0]! as unknown as AuthoringAbility,
  };
}

export function isAcceptedM50GrantedCardAbilitySource(ability: AuthoringAbility | RuleNode): boolean {
  return classifyM50GrantedCardAbilitySource(ability) !== undefined;
}

function definition(state: GameState, instanceId: string): ExecutableCardDefinition | undefined {
  const card = state.cards.find((candidate) => candidate.instanceId === instanceId);
  return card ? state.abilityRuntime?.pack.cards[card.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
function sourceApplies(state: GameState, sourceId: string, requirement: 'owned' | 'active' | 'revealed'): boolean {
  const source = state.cards.find((candidate) => candidate.instanceId === sourceId);
  const controller = source ? state.players.find((candidate) => candidate.id === source.controllerPlayerId) : undefined;
  if (!source || !controller || controller.status === 'eliminated' || source.ownerPlayerId !== source.controllerPlayerId) return false;
  if (requirement === 'active') return isActiveCardSource(state, sourceId);
  if (requirement === 'revealed') {
    const sourceState = state.abilityRuntime?.cardState[sourceId];
    return ['skill', 'attack_area'].includes(source.zone) && source.visibility.scope === 'public' && sourceState?.faceDown !== true;
  }
  return ['skill', 'hand', 'attack_area'].includes(source.zone);
}
function familyCanTarget(sourceControllerId: string, targetControllerId: string, family: M50GrantedCardAbilityFamily): boolean {
  return (family.targetSubject ?? 'controller') === 'all_players' || sourceControllerId === targetControllerId;
}

function targetMatchesFamily(state: GameState, targetInstanceId: string, family: M50GrantedCardAbilityFamily): boolean {
  const targetDefinition = definition(state, targetInstanceId); if (!targetDefinition) return false;
  if (family.basic === true && targetDefinition.cardType !== 'basic_attack') return false;
  if (family.definitionIds && !family.definitionIds.includes(targetDefinition.id)) return false;
  const attributes = getEffectiveCardAttributes(state, targetInstanceId);
  if (family.attributesAny && !family.attributesAny.some((attribute) => attributes.includes(attribute))) return false;
  return family.basic === true || !!family.definitionIds || !!family.attributesAny;
}

/** Dynamic ability projection is identity-free: source structure + current effective card attributes only. */
export function m50GrantedAbilitiesForCard(state: GameState, targetInstanceId: string): AuthoringAbility[] {
  const runtime = state.abilityRuntime; const target = state.cards.find((candidate) => candidate.instanceId === targetInstanceId);
  if (!runtime || !target || !definition(state, targetInstanceId)) return [];
  const grants: AuthoringAbility[] = [];
  for (const source of state.cards) {
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyM50GrantedCardAbilitySource(ability); if (!family ||
          !familyCanTarget(source.controllerPlayerId, target.controllerPlayerId, family) ||
          !sourceApplies(state, source.instanceId, family.sourceRequirement) ||
          !targetMatchesFamily(state, targetInstanceId, family)) continue;
      if (grants.some((existing) => existing.id === family.grantedAbility.id)) throw new Error('M50_GRANTED_ABILITY_AMBIGUOUS');
      grants.push(family.grantedAbility);
    }
  }
  return grants;
}

export function m50GrantedAbilityForCard(state: GameState, targetInstanceId: string, abilityId: string): AuthoringAbility | undefined {
  return m50GrantedAbilitiesForCard(state, targetInstanceId).find((ability) => ability.id === abilityId);
}

export function m50GrantedCardNameOverride(state: GameState, targetInstanceId: string): string | undefined {
  const target = state.cards.find((candidate) => candidate.instanceId === targetInstanceId);
  if (!state.abilityRuntime || !target) return undefined;
  const names: string[] = [];
  for (const source of state.cards) {
    if (source.controllerPlayerId !== target.controllerPlayerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyM50GrantedCardAbilitySource(ability);
      if (!family?.nameOverride || !familyCanTarget(source.controllerPlayerId, target.controllerPlayerId, family) ||
          !sourceApplies(state, source.instanceId, family.sourceRequirement) || !targetMatchesFamily(state, targetInstanceId, family)) continue;
      names.push(family.nameOverride);
    }
  }
  const unique = [...new Set(names)];
  if (unique.length > 1) throw new Error('M50_CARD_NAME_OVERRIDE_AMBIGUOUS');
  return unique[0];
}

export function m50NonEffectVictoryPointGainForbidden(state: GameState, playerId: string): boolean {
  if (!state.abilityRuntime) return false;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyM50GrantedCardAbilitySource(ability);
      if (family?.forbidNonEffectVictoryPointGain === true && source.controllerPlayerId === playerId &&
          sourceApplies(state, source.instanceId, family.sourceRequirement)) return true;
    }
  }
  return false;
}

export function m50GrantedCombatPowerAdjustment(state: GameState, playerId: string): number {
  if (!state.abilityRuntime || state.round.activePhase !== 'battle') return 0;
  let total = 0;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyM50GrantedCardAbilitySource(ability); const power = family?.combatPowerPerFaceUpDefinition;
      if (!family || !power || !sourceApplies(state, source.instanceId, family.sourceRequirement)) continue;
      const count = state.cards.filter((candidate) => candidate.definitionId === power.definitionId &&
        isActiveCardSource(state, candidate.instanceId) && state.abilityRuntime!.cardState[candidate.instanceId]?.faceDown !== true).length;
      const contribution = count * power.amount;
      if (!Number.isSafeInteger(contribution) || contribution < 0) throw new Error('M50_GRANTED_COMBAT_POWER_INVALID');
      total += contribution;
      if (!Number.isSafeInteger(total) || total < 0) throw new Error('M50_GRANTED_COMBAT_POWER_OVERFLOW');
    }
  }
  return total;
}
