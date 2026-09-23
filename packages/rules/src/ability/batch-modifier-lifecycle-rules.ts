import type { GameState } from '../schema/game';
import { getEffectiveCardAttributes } from './card-instance-state';
import type { AbilityEvent, AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

export const B03_SCHEDULE_EFFECT = 'schedule_effect';
export const B03_EVENT_COMBAT_HAS_ATTRIBUTE = 'event_combat_has_attribute';
export const B03_WORKSHOP_LOCATION = 'magic_workshop';

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
function empty(value: unknown): boolean { return Object.keys(record(value)).length === 0; }
function emptyList(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function emptyResponse(value: unknown): boolean {
  const response = record(value); const keys = Object.keys(response).sort();
  return keys.length === 0 || (keys.length === 2 && keys[0] === 'order' && keys[1] === 'passBehavior' &&
    response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function fields(ability: AuthoringAbility | RuleNode, key: string): RuleNode[] { return list((ability as RuleNode)[key]); }
function automatic(ability: AuthoringAbility | RuleNode): boolean { return record((ability as RuleNode).execution).mode === 'automatic'; }
function exactVisibility(value: unknown): boolean {
  const v = record(value);
  return exactKeys(v, ['revealsTrueName', 'revealTiming', 'revealScope']) && v.revealsTrueName === true &&
    v.revealTiming === 'on_use_declared' && v.revealScope === 'servant_package';
}
function sourceActiveOnly(ability: AuthoringAbility | RuleNode): boolean {
  const conditions = fields(ability, 'conditions');
  return conditions.length === 1 && exactKeys(conditions[0]!, ['type']) && conditions[0]!.type === 'source_active';
}
function phaseActionCommon(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const activation = record(a.activation);
  return a.kind === 'phase_action' && automatic(ability) && exactKeys(activation, ['phase', 'opens']) &&
    activation.phase === 'action' && activation.opens === 'controller_action_window' && sourceActiveOnly(ability) &&
    emptyList(a.targets ?? []) && emptyList(a.cost ?? []) && emptyList(a.creates ?? []) && emptyResponse(a.responseWindow) &&
    empty(a.limit) && exactVisibility(a.visibility);
}

export function isAcceptedB03WorkshopMovementLockAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const modifiers = fields(ability, 'ruleModifiers'); const lifecycle = record(a.lifecycle);
  if (!phaseActionCommon(ability) || fields(ability, 'effects').length !== 0 || modifiers.length !== 1 ||
      !exactKeys(lifecycle, ['duration']) || lifecycle.duration !== 'this_round') return false;
  const modifier = modifiers[0]!; const scope = record(modifier.scope); const modifierLifecycle = record(modifier.lifecycle);
  return exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'lifecycle']) &&
    modifier.operation === 'forbid' && modifier.rule === 'movement_destinations' &&
    exactKeys(scope, ['subject', 'fromLocationIds']) && scope.subject === 'opponents' &&
    Array.isArray(scope.fromLocationIds) && scope.fromLocationIds.length === 1 && scope.fromLocationIds[0] === B03_WORKSHOP_LOCATION &&
    exactKeys(modifierLifecycle, ['duration']) && modifierLifecycle.duration === 'this_round';
}

export function isAcceptedB03NextRoundCardPowerScheduleAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const effects = fields(ability, 'effects');
  if (!phaseActionCommon(ability) || effects.length !== 1 || fields(ability, 'ruleModifiers').length !== 0 || !empty(a.lifecycle)) return false;
  const effect = effects[0]!;
  return exactKeys(effect, ['type', 'abilityId', 'triggerEventType', 'triggerRoundOffset']) && effect.type === B03_SCHEDULE_EFFECT &&
    typeof effect.abilityId === 'string' && effect.abilityId.length > 0 && effect.triggerEventType === 'round.started' && effect.triggerRoundOffset === 1;
}

export function isAcceptedB03ScheduledCardPowerAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const modifiers = fields(ability, 'ruleModifiers'); const lifecycle = record(a.lifecycle);
  if (a.kind !== 'passive' || !automatic(ability) || !empty(a.activation) || fields(ability, 'conditions').length !== 0 ||
      !emptyList(a.targets ?? []) || fields(ability, 'effects').length !== 0 || !emptyList(a.cost ?? []) || !emptyList(a.creates ?? []) ||
      modifiers.length !== 1 || !exactKeys(lifecycle, ['duration']) || lifecycle.duration !== 'this_round' ||
      !emptyResponse(a.responseWindow) || !empty(a.limit) || !exactVisibility(a.visibility)) return false;
  const modifier = modifiers[0]!; const scope = record(modifier.scope); const cards = record(scope.cards); const modifierLifecycle = record(modifier.lifecycle);
  if (!exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle']) ||
      modifier.operation !== 'add' || modifier.rule !== 'card_power' || modifier.value !== 3 ||
      !exactKeys(scope, ['subject', 'cards']) || scope.subject !== 'controller' || !exactKeys(cards, ['definitionIds']) ||
      !Array.isArray(cards.definitionIds) || cards.definitionIds.length !== 2 || cards.definitionIds.some((id) => typeof id !== 'string' || !id) ||
      !exactKeys(modifierLifecycle, ['duration']) || modifierLifecycle.duration !== 'this_round') return false;
  return new Set(cards.definitionIds as string[]).size === 2;
}

export function isAcceptedB03OpponentCardPowerTerrainAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const modifiers = fields(ability, 'ruleModifiers'); const life = record(a.lifecycle);
  if (a.kind !== 'residual' || !automatic(ability) || !empty(a.activation) || !sourceActiveOnly(ability) ||
      !emptyList(a.targets ?? []) || fields(ability, 'effects').length !== 0 || !emptyList(a.cost ?? []) || !emptyList(a.creates ?? []) ||
      modifiers.length !== 3 || !exactKeys(life, ['duration', 'cleanup']) || life.duration !== 'while_active' || life.cleanup !== 'remain_active' ||
      !emptyResponse(a.responseWindow) || !empty(a.limit) || !exactVisibility(a.visibility)) return false;
  const magic = modifiers[0]!; const luck = modifiers[1]!; const terrain = modifiers[2]!;
  const exactSet = (modifier: RuleNode, selector: 'attributesAny' | 'definitionIds', expected?: string) => {
    const scope = record(modifier.scope); const cards = record(scope.cards); const ml = record(modifier.lifecycle);
    return exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle']) &&
      modifier.operation === 'set' && modifier.rule === 'card_power' && modifier.value === 0 &&
      exactKeys(scope, ['subject', 'cards']) && scope.subject === 'opponents_at_source_battlefield' && exactKeys(cards, [selector]) &&
      Array.isArray(cards[selector]) && (selector === 'attributesAny'
        ? (cards[selector] as unknown[]).length === 1 && (cards[selector] as unknown[])[0] === expected
        : (cards[selector] as unknown[]).length === 2 && (cards[selector] as unknown[]).every((id) => typeof id === 'string' && id.length > 0) &&
          new Set(cards[selector] as string[]).size === 2) &&
      exactKeys(ml, ['duration']) && ml.duration === 'while_active';
  };
  const terrainScope = record(terrain.scope); const terrainLife = record(terrain.lifecycle);
  return exactSet(magic, 'attributesAny', '魔术') && exactSet(luck, 'definitionIds') &&
    exactKeys(terrain, ['id', 'printedClause', 'operation', 'rule', 'scope', 'value', 'lifecycle']) &&
    terrain.operation === 'add' && terrain.rule === 'deployment_advantage' && terrain.value === 2 &&
    exactKeys(terrainScope, ['subject']) && terrainScope.subject === 'controller' && exactKeys(terrainLife, ['duration']) && terrainLife.duration === 'while_active';
}

export function isAcceptedB03CombatAttributeCloseAbility(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const activation = record(a.activation); const conditions = fields(ability, 'conditions'); const effects = fields(ability, 'effects');
  return a.kind === 'forced_trigger' && automatic(ability) && exactKeys(activation, ['trigger']) && activation.trigger === 'after_battle_result_determined' &&
    conditions.length === 3 && exactKeys(conditions[0]!, ['type']) && conditions[0]!.type === 'source_active' &&
    exactKeys(conditions[1]!, ['type']) && conditions[1]!.type === 'event_location_equals_controller' &&
    exactKeys(conditions[2]!, ['type', 'attribute']) && conditions[2]!.type === B03_EVENT_COMBAT_HAS_ATTRIBUTE && conditions[2]!.attribute === '魔术' &&
    effects.length === 1 && exactKeys(effects[0]!, ['type']) && effects[0]!.type === 'close_source_card' &&
    emptyList(a.targets ?? []) && emptyList(a.cost ?? []) && emptyList(a.creates ?? []) && fields(ability, 'ruleModifiers').length === 0 &&
    empty(a.lifecycle) && emptyResponse(a.responseWindow) && empty(a.limit) && empty(a.visibility);
}

export function isB03ModifierLifecycleCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const a = ability as RuleNode; const modifiers = fields(ability, 'ruleModifiers'); const effects = fields(ability, 'effects'); const conditions = fields(ability, 'conditions');
  return modifiers.some((m) => ['movement_destinations', 'deployment_advantage'].includes(String(m.rule))) ||
    effects.some((e) => e.type === B03_SCHEDULE_EFFECT) || conditions.some((c) => c.type === B03_EVENT_COMBAT_HAS_ATTRIBUTE) ||
    (a.kind === 'passive' && record(a.lifecycle).duration === 'this_round' && modifiers.some((m) => {
      const cards = record(record(m.scope).cards);
      return m.rule === 'card_power' && Array.isArray(cards.definitionIds) && cards.definitionIds.length === 2;
    }));
}
export function isAcceptedB03ModifierLifecycleAbility(ability: AuthoringAbility | RuleNode): boolean {
  if (!isB03ModifierLifecycleCandidate(ability)) return false;
  return isAcceptedB03WorkshopMovementLockAbility(ability) || isAcceptedB03NextRoundCardPowerScheduleAbility(ability) ||
    isAcceptedB03ScheduledCardPowerAbility(ability) || isAcceptedB03OpponentCardPowerTerrainAbility(ability) || isAcceptedB03CombatAttributeCloseAbility(ability);
}

function definition(state: GameState, instanceId: string): ExecutableCardDefinition | undefined {
  const instance = state.cards.find((card) => card.instanceId === instanceId);
  return instance ? state.abilityRuntime?.pack.cards[instance.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
function activeSource(state: GameState, instanceId: string): boolean {
  const source = state.cards.find((card) => card.instanceId === instanceId); const sourceState = state.abilityRuntime?.cardState[instanceId];
  const controller = source ? state.players.find((player) => player.id === source.controllerPlayerId) : undefined;
  return !!source && !!controller && controller.status === 'active' && ['field', 'attack_area'].includes(source.zone) &&
    sourceState?.active === true && sourceState.faceDown !== true;
}

export function b03WorkshopExitForbidden(state: GameState, playerId: string): boolean {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.status !== 'active' || player.locationId !== B03_WORKSHOP_LOCATION) return false;
  for (const ongoing of state.abilityRuntime?.ongoingEffects ?? []) {
    const source = state.cards.find((card) => card.instanceId === ongoing.sourceCardId); const sourceDefinition = definition(state, ongoing.sourceCardId);
    const ability = sourceDefinition?.abilities.find((candidate) => candidate.id === ongoing.abilityId);
    if (!ability || !isAcceptedB03WorkshopMovementLockAbility(ability)) continue;
    if (!source || source.controllerPlayerId !== ongoing.controllerId || ongoing.controllerId === playerId || ongoing.duration !== 'this_round' ||
        ongoing.startRound !== state.round.roundNumber || ongoing.id !== `${ongoing.sourceCardId}:${ongoing.abilityId}` || ongoing.ruleModifiers.length !== 1 ||
        JSON.stringify(ongoing.ruleModifiers[0]!.definition) !== JSON.stringify(ability.ruleModifiers[0]!)) {
      throw new Error('B03_MOVEMENT_LOCK_STATE_INVALID');
    }
    return true;
  }
  return false;
}

export function armB03NextRoundCardPowerSchedule(state: GameState, sourceCardId: string, controllerId: string, ability: AuthoringAbility, effect: RuleNode): void {
  if (!isAcceptedB03NextRoundCardPowerScheduleAbility(ability) || effect !== ability.effects[0]) throw new Error('B03_SCHEDULE_ENVELOPE_INVALID');
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const sourceDefinition = source ? definition(state, sourceCardId) : undefined;
  const targetAbilityId = String(effect.abilityId ?? '');
  const target = sourceDefinition?.abilities.find((candidate) => candidate.id === targetAbilityId);
  if (!source || source.controllerPlayerId !== controllerId || !sourceDefinition || !target || !isAcceptedB03ScheduledCardPowerAbility(target)) {
    throw new Error('B03_SCHEDULE_TARGET_INVALID');
  }
  const armedRound = state.round.roundNumber;
  const dueRound = armedRound + 1;
  const pending = state.abilityRuntime!.pendingB03CardPowerBoosts ??= [];
  if (pending.some((entry) => entry.sourceCardId === sourceCardId && entry.abilityId === ability.id && entry.armedRound === armedRound)) return;
  pending.push({ controllerId, sourceCardId, sourceDefinitionId: sourceDefinition.id, abilityId: ability.id, targetAbilityId, armedRound, dueRound });
}

function exactStringArray(left: unknown, right: readonly string[]): boolean {
  return Array.isArray(left) && left.length === right.length && left.every((value, index) => typeof value === 'string' && value === right[index]);
}
function scheduledDefinitionIds(ability: AuthoringAbility): string[] {
  if (!isAcceptedB03ScheduledCardPowerAbility(ability)) throw new Error('B03_SCHEDULE_TARGET_INVALID');
  const cards = record(record(ability.ruleModifiers[0]!.scope).cards);
  return [...(cards.definitionIds as string[])];
}
function validateB03PendingSchedule(state: GameState, entry: NonNullable<NonNullable<GameState['abilityRuntime']>['pendingB03CardPowerBoosts']>[number]): { sourceDefinition: ExecutableCardDefinition; target: AuthoringAbility } {
  const source = state.cards.find((card) => card.instanceId === entry.sourceCardId);
  const sourceDefinition = source ? definition(state, source.instanceId) : undefined;
  const arm = sourceDefinition?.abilities.find((ability) => ability.id === entry.abilityId);
  const target = sourceDefinition?.abilities.find((ability) => ability.id === entry.targetAbilityId);
  if (!source || !sourceDefinition || source.definitionId !== entry.sourceDefinitionId || source.controllerPlayerId !== entry.controllerId ||
      !arm || !target || !isAcceptedB03NextRoundCardPowerScheduleAbility(arm) || !isAcceptedB03ScheduledCardPowerAbility(target) ||
      arm.effects[0]?.abilityId !== entry.targetAbilityId || !Number.isSafeInteger(entry.armedRound) || entry.armedRound < 1 ||
      !Number.isSafeInteger(entry.dueRound) || entry.dueRound !== entry.armedRound + 1) throw new Error('B03_SCHEDULE_STATE_INVALID');
  return { sourceDefinition, target };
}
function validateB03ActiveBoost(state: GameState, active: NonNullable<NonNullable<GameState['abilityRuntime']>['activeB03CardPowerBoosts']>[number]): { target: AuthoringAbility; definitionIds: string[] } {
  const source = state.cards.find((card) => card.instanceId === active.sourceCardId);
  const sourceDefinition = source ? definition(state, source.instanceId) : undefined;
  const arm = sourceDefinition?.abilities.find((ability) => ability.id === active.armAbilityId);
  const target = sourceDefinition?.abilities.find((ability) => ability.id === active.targetAbilityId);
  const expectedDefinitionIds = target && isAcceptedB03ScheduledCardPowerAbility(target) ? scheduledDefinitionIds(target) : [];
  if (!source || !sourceDefinition || source.definitionId !== active.sourceDefinitionId || source.controllerPlayerId !== active.controllerId ||
      !arm || !target || !isAcceptedB03NextRoundCardPowerScheduleAbility(arm) || !isAcceptedB03ScheduledCardPowerAbility(target) ||
      arm.effects[0]?.abilityId !== active.targetAbilityId || !Number.isSafeInteger(active.round) || active.round < 1 || active.amount !== 3 ||
      !exactStringArray(active.definitionIds, expectedDefinitionIds)) throw new Error('B03_ACTIVE_BOOST_STATE_INVALID');
  return { target, definitionIds: expectedDefinitionIds };
}

export function advanceB03RoundSchedules(state: GameState, round: number): void {
  const runtime = state.abilityRuntime; if (!runtime) return;
  if (!Number.isSafeInteger(round) || round < 1) throw new Error('B03_SCHEDULE_ROUND_INVALID');
  const priorActive = runtime.activeB03CardPowerBoosts ?? [];
  const seenActive = new Set<string>();
  for (const active of priorActive) {
    validateB03ActiveBoost(state, active);
    const key = JSON.stringify([active.controllerId, active.sourceCardId, active.armAbilityId, active.targetAbilityId, active.round]);
    if (seenActive.has(key)) throw new Error('B03_ACTIVE_BOOST_DUPLICATE');
    seenActive.add(key);
    if (active.round > round) throw new Error('B03_ACTIVE_BOOST_STATE_INVALID');
  }
  runtime.activeB03CardPowerBoosts = priorActive.filter((entry) => entry.round === round);

  const pending = runtime.pendingB03CardPowerBoosts ?? [];
  const seenPending = new Set<string>();
  for (const entry of pending) {
    validateB03PendingSchedule(state, entry);
    const key = JSON.stringify([entry.controllerId, entry.sourceCardId, entry.abilityId, entry.armedRound]);
    if (seenPending.has(key)) throw new Error('B03_SCHEDULE_DUPLICATE');
    seenPending.add(key);
  }
  const stale = pending.filter((entry) => entry.dueRound < round);
  if (stale.length) throw new Error('B03_SCHEDULE_STALE');
  const due = pending.filter((entry) => entry.dueRound === round);
  for (const entry of due) {
    const { target } = validateB03PendingSchedule(state, entry);
    const definitionIds = scheduledDefinitionIds(target);
    runtime.activeB03CardPowerBoosts ??= [];
    const activeKey = JSON.stringify([entry.controllerId, entry.sourceCardId, entry.abilityId, entry.targetAbilityId, round]);
    const existingKeys = new Set(runtime.activeB03CardPowerBoosts.map((active) => JSON.stringify([active.controllerId, active.sourceCardId, active.armAbilityId, active.targetAbilityId, active.round])));
    if (!existingKeys.has(activeKey)) {
      runtime.activeB03CardPowerBoosts.push({ controllerId: entry.controllerId, sourceCardId: entry.sourceCardId, sourceDefinitionId: entry.sourceDefinitionId,
        armAbilityId: entry.abilityId, targetAbilityId: entry.targetAbilityId, round, definitionIds, amount: 3 });
    }
  }
  runtime.pendingB03CardPowerBoosts = pending.filter((entry) => entry.dueRound > round);
}

export function b03ScheduledCardPowerBonus(state: GameState, targetCardInstanceId: string): number {
  const target = state.cards.find((card) => card.instanceId === targetCardInstanceId); if (!target) return 0;
  let total = 0; const seen = new Set<string>();
  for (const active of state.abilityRuntime?.activeB03CardPowerBoosts ?? []) {
    const { definitionIds } = validateB03ActiveBoost(state, active);
    const key = JSON.stringify([active.controllerId, active.sourceCardId, active.armAbilityId, active.targetAbilityId, active.round]);
    if (seen.has(key)) throw new Error('B03_ACTIVE_BOOST_DUPLICATE');
    seen.add(key);
    if (active.round !== state.round.roundNumber || active.controllerId !== target.controllerPlayerId) continue;
    if (definitionIds.includes(target.definitionId)) total += active.amount;
  }
  return total;
}

function b03OpponentCardPowerTerrainSources(state: GameState) {
  return state.cards.filter((source) => activeSource(state, source.instanceId) && definition(state, source.instanceId)?.abilities.some(isAcceptedB03OpponentCardPowerTerrainAbility));
}
export function b03OpponentCardPowerSetZero(state: GameState, targetCardInstanceId: string): boolean {
  const target = state.cards.find((card) => card.instanceId === targetCardInstanceId); const targetDefinition = definition(state, targetCardInstanceId);
  const targetPlayer = target ? state.players.find((player) => player.id === target.controllerPlayerId) : undefined;
  if (!target || !targetDefinition || !targetPlayer) return false;
  for (const source of b03OpponentCardPowerTerrainSources(state)) {
    const controller = state.players.find((player) => player.id === source.controllerPlayerId);
    const location = controller?.locationId ? state.map.locations.find((candidate) => candidate.id === controller.locationId) : undefined;
    if (!controller || target.controllerPlayerId === controller.id || !controller.locationId || controller.locationId !== targetPlayer.locationId ||
        location?.tags.includes('battlefield') !== true) continue;
    const continuous = definition(state, source.instanceId)?.abilities.find(isAcceptedB03OpponentCardPowerTerrainAbility);
    if (!continuous) continue;
    const magicScope = record(continuous.ruleModifiers[0]!.scope); const magicCards = record(magicScope.cards);
    const luckScope = record(continuous.ruleModifiers[1]!.scope); const luckCards = record(luckScope.cards);
    const magicAttributes = Array.isArray(magicCards.attributesAny) ? magicCards.attributesAny as string[] : [];
    const luckDefinitionIds = Array.isArray(luckCards.definitionIds) ? luckCards.definitionIds as string[] : [];
    const attributes = getEffectiveCardAttributes(state, targetCardInstanceId);
    if (magicAttributes.some((attribute) => attributes.includes(attribute)) || luckDefinitionIds.includes(target.definitionId)) return true;
  }
  return false;
}
export function b03DeploymentAdvantageBonus(state: GameState, playerId: string): number {
  return b03OpponentCardPowerTerrainSources(state).filter((source) => source.controllerPlayerId === playerId).length * 2;
}

export function rememberB03BattleAttributeSnapshot(
  state: GameState, battlePhaseResolutionId: string, battleId: string, resultId: string, battlefieldId: string,
  rootParticipantIds: string[], participantIds: string[], attributes: Record<string, string[]>,
): void {
  const runtime = state.abilityRuntime; if (!runtime) return;
  if (!battlePhaseResolutionId || !battleId || !resultId || !battlefieldId || participantIds.length === 0 ||
      rootParticipantIds.length === 0 || new Set(participantIds).size !== participantIds.length ||
      new Set(rootParticipantIds).size !== rootParticipantIds.length || rootParticipantIds.some((id) => !participantIds.includes(id))) {
    throw new Error('B03_BATTLE_ATTRIBUTE_SNAPSHOT_INVALID');
  }
  const known = new Set(state.players.map((player) => player.id));
  if (participantIds.some((id) => !known.has(id)) || Object.keys(attributes).sort().join('|') !== [...participantIds].sort().join('|') ||
      participantIds.some((id) => !Array.isArray(attributes[id]) || attributes[id]!.some((value) => typeof value !== 'string'))) throw new Error('B03_BATTLE_ATTRIBUTE_SNAPSHOT_INVALID');
  runtime.b03BattleAttributeSnapshots ??= {};
  const snapshot = {
    battlePhaseResolutionId, battleId, resultId, battlefieldId,
    rootParticipantIds: [...rootParticipantIds],
    participantIds: [...participantIds],
    attributes: Object.fromEntries(participantIds.map((id) => [id, [...new Set(attributes[id]!)]])),
  };
  const prior = runtime.b03BattleAttributeSnapshots[resultId];
  if (prior && JSON.stringify(prior) !== JSON.stringify(snapshot)) throw new Error('B03_BATTLE_ATTRIBUTE_SNAPSHOT_COLLISION');
  runtime.b03BattleAttributeSnapshots[resultId] = snapshot;
}
function validatedB03BattleAttributeSnapshot(state: GameState, event: AbilityEvent | undefined) {
  if (!event || event.type !== 'after_battle_result_determined' || typeof event.resultId !== 'string' || event.id !== event.resultId ||
      typeof event.battlefieldId !== 'string' || typeof event.battlePhaseResolutionId !== 'string' || typeof event.battleId !== 'string' ||
      !Array.isArray(event.battleParticipantIds) || new Set(event.battleParticipantIds).size !== event.battleParticipantIds.length) return undefined;
  const runtime = state.abilityRuntime;
  const snapshot = runtime?.b03BattleAttributeSnapshots?.[event.resultId];
  const trusted = runtime?.trustedBattleResultSnapshots?.[event.resultId];
  if (!snapshot || !trusted) return undefined;
  const keys = Object.keys(snapshot.attributes).sort(); const participants = [...snapshot.participantIds];
  const known = new Set(state.players.map((player) => player.id));
  const rootParticipants = event.battleParticipantIds;
  const exactRootParticipants = trusted.battleParticipantIds.length === rootParticipants.length &&
    trusted.battleParticipantIds.every((id, index) => id === rootParticipants[index]);
  const exactFrozenRoot = snapshot.rootParticipantIds.length === participants.length &&
    snapshot.rootParticipantIds.every((id, index) => id === participants[index]);
  if (snapshot.battlePhaseResolutionId !== event.battlePhaseResolutionId || snapshot.battleId !== event.battleId ||
      snapshot.resultId !== event.resultId || snapshot.battlefieldId !== event.battlefieldId || trusted.battlefieldId !== event.battlefieldId ||
      trusted.resultId !== event.resultId || trusted.battleId !== event.battleId || trusted.battlePhaseResolutionId !== event.battlePhaseResolutionId ||
      !exactRootParticipants || !exactFrozenRoot || participants.length === 0 || new Set(participants).size !== participants.length ||
      participants.some((id) => !known.has(id)) || rootParticipants.some((id) => !participants.includes(id)) ||
      keys.length !== participants.length || participants.some((id) => !keys.includes(id) || !Array.isArray(snapshot.attributes[id]) ||
        snapshot.attributes[id]!.some((value) => typeof value !== 'string'))) {
    throw new Error('B03_BATTLE_ATTRIBUTE_SNAPSHOT_STATE_INVALID');
  }
  return snapshot;
}

export function b03TrustedBattlefieldEqualsController(state: GameState, controllerId: string, event: AbilityEvent | undefined): boolean {
  const snapshot = validatedB03BattleAttributeSnapshot(state, event);
  const controller = state.players.find((player) => player.id === controllerId);
  return !!snapshot && !!controller && controller.status === 'active' && controller.locationId === snapshot.battlefieldId &&
    snapshot.rootParticipantIds.includes(controllerId);
}

export function b03TrustedCombatHasAttribute(state: GameState, event: AbilityEvent | undefined, attribute: string): boolean {
  const snapshot = validatedB03BattleAttributeSnapshot(state, event);
  return !!snapshot && snapshot.participantIds.some((id) => snapshot.attributes[id]!.includes(attribute));
}
