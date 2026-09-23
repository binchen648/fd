import type { GameState } from '../schema/game';
import { isActiveCardSource } from '../core/card-source-state';
import type { AbilityEvent, AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

export const BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER = 'event_battlefield_equals_controller';
export const BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST = 'event_battle_opponent_count_at_least';

function record(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function list(value: unknown): RuleNode[] { return Array.isArray(value) ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object' && !Array.isArray(entry)) : []; }
function exactKeys(value: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function exactStringList(value: unknown, length?: number): value is string[] {
  return Array.isArray(value) && (length === undefined || value.length === length) && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}
function emptyRecord(value: unknown): boolean { return Object.keys(record(value)).length === 0; }
function emptyResponse(value: unknown): boolean {
  const response = record(value); const keys = Object.keys(response).sort();
  return keys.length === 0 || (keys.length === 2 && keys[0] === 'order' && keys[1] === 'passBehavior' &&
    response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function emptyList(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function automatic(ability: AuthoringAbility | RuleNode): boolean { return record(ability.execution).mode === 'automatic'; }
function abilityFieldList(ability: AuthoringAbility | RuleNode, key: string): RuleNode[] { return list((ability as RuleNode)[key]); }
function activation(ability: AuthoringAbility | RuleNode): RuleNode { return record((ability as RuleNode).activation); }
function lifecycle(ability: AuthoringAbility | RuleNode): RuleNode { return record((ability as RuleNode).lifecycle); }
function commonPassiveNoEffects(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode;
  return automatic(ability) && emptyList(a.targets ?? []) && emptyList(a.effects ?? []) && emptyList(a.cost ?? []) &&
    emptyList(a.creates ?? []) && emptyResponse(a.responseWindow) && emptyRecord(a.limit) && emptyRecord(a.visibility) && emptyRecord(a.activation);
}

export interface OwnedDefinitionCardRuleFamily {
  forbiddenSkillDefinitionId: string;
  ownerDefinitionId: string;
  powerBonus: number;
}

/**
 * Exact identity-free envelope used by cards that, while their source remains active,
 * (1) forbid one explicit skill definition, (2) add a fixed amount to cards owned by
 * one definition family, and (3) add each target card's printed base Power to its mana cost.
 */
export function classifyOwnedDefinitionCardRuleAbility(ability: AuthoringAbility | RuleNode): OwnedDefinitionCardRuleFamily | undefined {
  const a = ability as RuleNode;
  const visibility = record(a.visibility);
  if (a.kind !== 'residual' || !automatic(ability) || !emptyRecord(a.activation) || !emptyList(a.targets ?? []) ||
      !emptyList(a.effects ?? []) || !emptyList(a.cost ?? []) || !emptyList(a.creates ?? []) ||
      !emptyResponse(a.responseWindow) || !emptyRecord(a.limit) ||
      !exactKeys(visibility, ['revealsTrueName', 'revealTiming', 'revealScope']) || visibility.revealsTrueName !== true ||
      visibility.revealTiming !== 'on_use_declared' || visibility.revealScope !== 'servant_package') return undefined;
  const conditions = abilityFieldList(ability, 'conditions');
  const modifiers = abilityFieldList(ability, 'ruleModifiers');
  const life = lifecycle(ability);
  if (conditions.length !== 1 || !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_active' ||
      modifiers.length !== 3 || !exactKeys(life, ['duration', 'starts', 'cleanup']) ||
      life.duration !== 'while_active' || life.starts !== 'immediate' || life.cleanup !== 'remain_active') return undefined;

  const forbid = modifiers.find((m) => m.rule === 'skill_use');
  const power = modifiers.find((m) => m.rule === 'card_base_power');
  const cost = modifiers.find((m) => m.rule === 'card_cost');
  if (!forbid || !power || !cost) return undefined;

  const forbidScope = record(forbid.scope);
  if (forbid.operation !== 'forbid' || !exactKeys(forbid, ['id', 'printedClause', 'operation', 'rule', 'scope', 'lifecycle']) ||
      !exactKeys(forbidScope, ['subject', 'skillDefinitionIds']) || forbidScope.subject !== 'controller' ||
      !exactStringList(forbidScope.skillDefinitionIds, 1) || !exactKeys(record(forbid.lifecycle), ['duration']) || record(forbid.lifecycle).duration !== 'while_active') return undefined;

  const powerScope = record(power.scope); const powerCards = record(powerScope.cards);
  const costScope = record(cost.scope); const costCards = record(costScope.cards);
  const scopeOk = (scope: RuleNode, cards: RuleNode) => exactKeys(scope, ['subject', 'cards']) && scope.subject === 'controller' &&
    exactKeys(cards, ['ownerDefinitionIds', 'excludeSource']) && exactStringList(cards.ownerDefinitionIds, 1) && cards.excludeSource === true;
  if (!scopeOk(powerScope, powerCards) || !scopeOk(costScope, costCards)) return undefined;
  if (power.operation !== 'add' || !exactKeys(power, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle']) ||
      typeof power.value !== 'number' || !Number.isFinite(power.value) || power.value <= 0 || !exactKeys(record(power.lifecycle), ['duration']) || record(power.lifecycle).duration !== 'while_active') return undefined;
  const costValue = record(cost.value);
  if (cost.operation !== 'add' || !exactKeys(cost, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle']) ||
      !exactKeys(costValue, ['type']) || costValue.type !== 'target_printed_base_power' ||
      !exactKeys(record(cost.lifecycle), ['duration']) || record(cost.lifecycle).duration !== 'while_active') return undefined;
  if ((powerCards.ownerDefinitionIds as string[])[0] !== (costCards.ownerDefinitionIds as string[])[0]) return undefined;
  return {
    forbiddenSkillDefinitionId: (forbidScope.skillDefinitionIds as string[])[0]!,
    ownerDefinitionId: (powerCards.ownerDefinitionIds as string[])[0]!,
    powerBonus: power.value,
  };
}

export function isOwnedDefinitionCardRuleCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const modifiers = abilityFieldList(ability, 'ruleModifiers');
  return modifiers.some((modifier) => ['card_base_power', 'card_cost'].includes(String(modifier.rule))) ||
    modifiers.some((modifier) => modifier.rule === 'skill_use' && Object.prototype.hasOwnProperty.call(record(modifier.scope), 'skillDefinitionIds'));
}

export interface PlayAloneFamily { definitionId: string }
export function classifyPlayAloneAbility(ability: AuthoringAbility | RuleNode): PlayAloneFamily | undefined {
  const a = ability as RuleNode;
  if (a.kind !== 'passive' || !commonPassiveNoEffects(ability) || !emptyList(a.conditions ?? []) || !emptyRecord(a.lifecycle)) return undefined;
  const modifiers = abilityFieldList(ability, 'ruleModifiers');
  if (modifiers.length !== 1) return undefined;
  const m = modifiers[0]!; const scope = record(m.scope); const cards = record(scope.cards);
  if (!exactKeys(m, ['id', 'printedClause', 'operation', 'rule', 'scope']) || m.operation !== 'forbid' || m.rule !== 'card_play_with_others' ||
      !exactKeys(scope, ['subject', 'cards']) || scope.subject !== 'controller' || !exactKeys(cards, ['definitionIds']) ||
      !exactStringList(cards.definitionIds, 1)) return undefined;
  return { definitionId: (cards.definitionIds as string[])[0]! };
}

export function isPlayAloneCandidate(ability: AuthoringAbility | RuleNode): boolean {
  return abilityFieldList(ability, 'ruleModifiers').some((modifier) => modifier.rule === 'card_play_with_others');
}

export function isAcceptedDefeatIgnoreAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const conditions = abilityFieldList(ability, 'conditions'); const modifiers = abilityFieldList(ability, 'ruleModifiers');
  const life = lifecycle(ability);
  if (a.kind !== 'residual' || !automatic(ability) || !emptyRecord(a.activation) || conditions.length !== 1 ||
      !exactKeys(conditions[0]!, ['type']) || conditions[0]!.type !== 'source_active' || !emptyList(a.targets ?? []) ||
      !emptyList(a.effects ?? []) || !emptyList(a.cost ?? []) || !emptyList(a.creates ?? []) || modifiers.length !== 1 ||
      !emptyResponse(a.responseWindow) || !emptyRecord(a.limit) || !emptyRecord(a.visibility) ||
      !exactKeys(life, ['duration', 'starts', 'cleanup']) || life.duration !== 'while_active' || life.starts !== 'immediate' || life.cleanup !== 'remain_active') return false;
  const m = modifiers[0]!; const scope = record(m.scope); const modifierLife = record(m.lifecycle);
  return exactKeys(m, ['id', 'printedClause', 'operation', 'rule', 'scope', 'lifecycle']) && m.operation === 'ignore' && m.rule === 'defeat' &&
    exactKeys(scope, ['subject']) && scope.subject === 'controller' &&
    exactKeys(modifierLife, ['duration', 'starts', 'cleanup']) && modifierLife.duration === 'while_active' &&
    modifierLife.starts === 'immediate' && modifierLife.cleanup === 'remain_active';
}
export function isDefeatIgnoreCandidate(ability: AuthoringAbility | RuleNode): boolean {
  return abilityFieldList(ability, 'ruleModifiers').some((modifier) => modifier.rule === 'defeat');
}

export function isAcceptedCrowdedBattleCloseAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const act = activation(ability); const conditions = abilityFieldList(ability, 'conditions');
  const effects = abilityFieldList(ability, 'effects'); const life = lifecycle(ability);
  return a.kind === 'forced_trigger' && automatic(ability) && exactKeys(act, ['trigger']) && act.trigger === 'after_battle_result_determined' &&
    conditions.length === 3 && exactKeys(conditions[0]!, ['type']) && conditions[0]!.type === 'source_active' &&
    exactKeys(conditions[1]!, ['type']) && conditions[1]!.type === BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER &&
    exactKeys(conditions[2]!, ['type', 'count']) && conditions[2]!.type === BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST && conditions[2]!.count === 2 &&
    effects.length === 1 && exactKeys(effects[0]!, ['type']) && effects[0]!.type === 'close_source_card' &&
    emptyList(a.targets ?? []) && emptyList(a.cost ?? []) && emptyList(a.creates ?? []) && abilityFieldList(ability, 'ruleModifiers').length === 0 &&
    exactKeys(life, ['duration', 'starts', 'cleanup']) && life.duration === 'while_active' && life.starts === 'immediate' && life.cleanup === 'remain_active' &&
    emptyResponse(a.responseWindow) && emptyRecord(a.limit) && emptyRecord(a.visibility);
}
export function isCrowdedBattleCloseCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const conditions = abilityFieldList(ability, 'conditions');
  return conditions.some((condition) => [BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER, BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST].includes(String(condition.type)));
}

export function isBatchPassiveFamilyCandidate(ability: AuthoringAbility | RuleNode): boolean {
  return isOwnedDefinitionCardRuleCandidate(ability) || isPlayAloneCandidate(ability) || isDefeatIgnoreCandidate(ability) || isCrowdedBattleCloseCandidate(ability);
}
export function isAcceptedBatchPassiveFamilyAbility(ability: AuthoringAbility | RuleNode): boolean {
  if (!isBatchPassiveFamilyCandidate(ability)) return false;
  return !!classifyOwnedDefinitionCardRuleAbility(ability) || !!classifyPlayAloneAbility(ability) ||
    isAcceptedDefeatIgnoreAbility(ability) || isAcceptedCrowdedBattleCloseAbility(ability);
}

function definition(state: GameState, instanceId: string): ExecutableCardDefinition | undefined {
  const instance = state.cards.find((card) => card.instanceId === instanceId);
  return instance ? state.abilityRuntime?.pack.cards[instance.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
function activeSources(state: GameState, controllerId: string) {
  return state.cards.filter((source) => source.controllerPlayerId === controllerId && isActiveCardSource(state, source.instanceId));
}

export function ownedDefinitionCardRuleAdjustment(state: GameState, targetCardInstanceId: string): { power: number; cost: number } {
  const target = state.cards.find((card) => card.instanceId === targetCardInstanceId);
  const targetDefinition = definition(state, targetCardInstanceId);
  if (!target || !targetDefinition) return { power: 0, cost: 0 };
  let power = 0; let cost = 0;
  for (const source of activeSources(state, target.controllerPlayerId)) {
    const sourceDefinition = definition(state, source.instanceId);
    if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyOwnedDefinitionCardRuleAbility(ability);
      if (!family || source.instanceId === targetCardInstanceId || targetDefinition.ownerId !== family.ownerDefinitionId || targetDefinition.playKind !== 'attack') continue;
      const printedBasePower = Number(targetDefinition.cardFace.basePower ?? 0);
      if (!Number.isFinite(printedBasePower) || printedBasePower < 0) continue;
      power += family.powerBonus;
      cost += printedBasePower;
    }
  }
  return { power, cost };
}

export function skillDefinitionForbiddenByOwnedDefinitionCardRule(state: GameState, controllerId: string, targetDefinitionId: string): boolean {
  for (const source of activeSources(state, controllerId)) {
    const sourceDefinition = definition(state, source.instanceId); if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      const family = classifyOwnedDefinitionCardRuleAbility(ability);
      if (family?.forbiddenSkillDefinitionId === targetDefinitionId) return true;
    }
  }
  return false;
}

export function cardRequiresSoloPlay(state: GameState, cardInstanceId: string): boolean {
  const d = definition(state, cardInstanceId); if (!d) return false;
  return d.abilities.some((ability) => classifyPlayAloneAbility(ability)?.definitionId === d.id);
}

export function controllerHasActiveDefeatIgnore(state: GameState, controllerId: string): boolean {
  return activeSources(state, controllerId).some((source) => definition(state, source.instanceId)?.abilities.some(isAcceptedDefeatIgnoreAbility));
}

function exactStringArray(left: unknown, right: unknown): boolean {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => typeof value === 'string' && value === right[index]);
}
function exactPowerSnapshot(left: unknown, right: unknown): boolean {
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) || Array.isArray(right)) return false;
  const a = left as Record<string, unknown>; const b = right as Record<string, unknown>;
  const ak = Object.keys(a).sort(); const bk = Object.keys(b).sort();
  return ak.length === bk.length && ak.every((key, index) => key === bk[index] && Number.isFinite(a[key]) && a[key] === b[key]);
}
export function trustedCrowdedBattleEventMatches(state: GameState, controllerId: string, event: AbilityEvent | undefined): boolean {
  if (!event || event.type !== 'after_battle_result_determined' || event.id !== event.resultId ||
      typeof event.resultId !== 'string' || typeof event.battleId !== 'string' || typeof event.battlePhaseResolutionId !== 'string' ||
      typeof event.battlefieldId !== 'string' || !Array.isArray(event.battleParticipantIds)) return false;
  const trusted = state.abilityRuntime?.trustedBattleResultSnapshots?.[event.resultId];
  const controller = state.players.find((player) => player.id === controllerId);
  const known = new Set(state.players.map((player) => player.id));
  if (!trusted || !controller || controller.status !== 'active' || controller.locationId !== event.battlefieldId ||
      trusted.battlePhaseResolutionId !== event.battlePhaseResolutionId || trusted.battleId !== event.battleId ||
      trusted.resultId !== event.resultId || trusted.battlefieldId !== event.battlefieldId ||
      !exactStringArray(event.battleParticipantIds, trusted.battleParticipantIds) ||
      !exactStringArray(event.battleResult?.winners, trusted.winners) || !exactStringArray(event.battleResult?.loserIds, trusted.loserIds) ||
      !exactPowerSnapshot(event.battleParticipantPowers, trusted.battleParticipantPowers) ||
      new Set(event.battleParticipantIds).size !== event.battleParticipantIds.length || event.battleParticipantIds.some((id) => !known.has(id)) ||
      !event.battleParticipantIds.includes(controllerId)) return false;
  return event.battleParticipantIds.filter((id) => id !== controllerId).length >= 2;
}
