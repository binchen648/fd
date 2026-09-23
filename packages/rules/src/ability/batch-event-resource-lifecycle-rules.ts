import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import type { AbilityEvent, AuthoringAbility, RuleNode } from './types';

export const B05_CONTROLLER_MANA_BELOW_TWO_CONDITION = 'b05_controller_mana_below_two';
export const B05_EVENT_LOCATION_IS_WORKSHOP_CONDITION = 'b05_event_location_is_workshop';
export const B05_OTHER_NON_WORKSHOP_BATTLEFIELD_ENTRY_CONDITION = 'b05_other_non_workshop_battlefield_entry';
export const B05_DEPLOYMENT_RESOURCE_EXCHANGE_EFFECT = 'b05_deployment_resource_exchange';
export const B05_TRANSFER_VP_ARM_ROUND_CLOSE_EFFECT = 'b05_transfer_vp_arm_round_close';
export const B05_SOURCE_TRIGGERED_THIS_ROUND_CONDITION = 'b05_source_triggered_this_round';
export const B05_CLOSE_TRIGGERED_SOURCE_EFFECT = 'b05_close_triggered_source';

const WORKSHOP = 'magic_workshop';

function record(value: unknown): Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}
function exactKeys(value: unknown, expected: readonly string[]): boolean {
  const actual = Object.keys(record(value)).sort(); const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}
function empty(value: unknown): boolean { return exactKeys(value, []); }
function exactCondition(value: unknown, type: string): boolean { return record(value).type === type && exactKeys(value, ['type']); }
function exactLifecycle(value: unknown): boolean {
  const v = record(value);
  return exactKeys(v, ['duration', 'starts', 'cleanup']) && v.duration === 'while_active' && v.starts === 'immediate' && v.cleanup === 'remain_active';
}
function whileActive(value: unknown): boolean { const v = record(value); return exactKeys(v, ['duration']) && v.duration === 'while_active'; }
function automatic(a: AuthoringAbility): boolean {
  return a.execution.mode === 'automatic' && Array.isArray(a.execution.allowedOperations) && a.execution.allowedOperations.length === 0;
}
function commonEmpty(a: AuthoringAbility, visibility = 'empty'): boolean {
  const visibilityOk = visibility === 'empty'
    ? empty(a.visibility)
    : exactKeys(a.visibility, ['revealsTrueName', 'revealTiming', 'revealScope']) && a.visibility.revealsTrueName === true &&
      a.visibility.revealTiming === 'on_use_declared' && a.visibility.revealScope === 'servant_package';
  return a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 && a.ruleModifiers.length === 0 &&
    (empty(a.responseWindow) || (exactKeys(a.responseWindow, ['order', 'passBehavior']) && a.responseWindow.order === 'turn_order' && a.responseWindow.passBehavior === 'decline_this_window')) &&
    empty(a.limit) && visibilityOk && automatic(a);
}

export function isAcceptedB05LowManaCloseAbility(a: AuthoringAbility): boolean {
  return a.kind === 'residual' && empty(a.activation) && a.conditions.length === 2 && exactCondition(a.conditions[0], 'source_active') &&
    exactCondition(a.conditions[1], B05_CONTROLLER_MANA_BELOW_TWO_CONDITION) && a.effects.length === 1 &&
    exactCondition(a.effects[0], 'close_source_card') && exactLifecycle(a.lifecycle) && commonEmpty(a);
}

export function isAcceptedB05WorkshopDeploymentExchangeAbility(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'after_player_deployed_to_battlefield' &&
    a.conditions.length === 3 && exactCondition(a.conditions[0], 'source_active') && exactCondition(a.conditions[1], 'event_player_is_opponent') &&
    exactCondition(a.conditions[2], B05_EVENT_LOCATION_IS_WORKSHOP_CONDITION) && a.effects.length === 1 &&
    exactCondition(a.effects[0], B05_DEPLOYMENT_RESOURCE_EXCHANGE_EFFECT) && exactLifecycle(a.lifecycle) && commonEmpty(a);
}

export function isAcceptedB05OtherBattlefieldVpTransferAbility(a: AuthoringAbility): boolean {
  const effect = record(a.effects[0]);
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'after_controller_enters_location' &&
    a.conditions.length === 4 && exactCondition(a.conditions[0], 'source_active') && exactCondition(a.conditions[1], 'at_battlefield') &&
    exactCondition(a.conditions[2], 'event_player_is_opponent') && exactCondition(a.conditions[3], B05_OTHER_NON_WORKSHOP_BATTLEFIELD_ENTRY_CONDITION) &&
    a.effects.length === 1 && effect.type === B05_TRANSFER_VP_ARM_ROUND_CLOSE_EFFECT && effect.amount === 1 && exactKeys(effect, ['type', 'amount']) &&
    whileActive(a.lifecycle) && commonEmpty(a, 'true-name');
}

export function isAcceptedB05RoundEndCloseAbility(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'round_end' &&
    a.conditions.length === 2 && exactCondition(a.conditions[0], 'source_active') && exactCondition(a.conditions[1], B05_SOURCE_TRIGGERED_THIS_ROUND_CONDITION) &&
    a.effects.length === 1 && exactCondition(a.effects[0], B05_CLOSE_TRIGGERED_SOURCE_EFFECT) && whileActive(a.lifecycle) && commonEmpty(a);
}

export function isB05EventResourceLifecycleCandidate(a: AuthoringAbility | RuleNode): boolean {
  const raw = record(a);
  const conditions = Array.isArray(raw.conditions) ? raw.conditions : [];
  const effects = Array.isArray(raw.effects) ? raw.effects : [];
  const tokens = [B05_CONTROLLER_MANA_BELOW_TWO_CONDITION, B05_EVENT_LOCATION_IS_WORKSHOP_CONDITION,
    B05_OTHER_NON_WORKSHOP_BATTLEFIELD_ENTRY_CONDITION, B05_SOURCE_TRIGGERED_THIS_ROUND_CONDITION];
  const effectTokens = [B05_DEPLOYMENT_RESOURCE_EXCHANGE_EFFECT, B05_TRANSFER_VP_ARM_ROUND_CLOSE_EFFECT, B05_CLOSE_TRIGGERED_SOURCE_EFFECT];
  return conditions.some((entry) => tokens.includes(String(record(entry).type ?? ''))) ||
    effects.some((entry) => effectTokens.includes(String(record(entry).type ?? '')));
}
export function isAcceptedB05EventResourceLifecycleAbility(a: AuthoringAbility): boolean {
  return isAcceptedB05LowManaCloseAbility(a) || isAcceptedB05WorkshopDeploymentExchangeAbility(a) ||
    isAcceptedB05OtherBattlefieldVpTransferAbility(a) || isAcceptedB05RoundEndCloseAbility(a);
}

function sourceAndAbility(state: GameState, sourceCardId: string, abilityId: string) {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const def = source ? state.abilityRuntime?.pack.cards[source.definitionId] : undefined;
  const ability = def?.abilities.find((candidate) => candidate.id === abilityId);
  return { source, def, ability };
}
function isBattlefield(state: GameState, locationId: string | undefined): boolean {
  return !!locationId && getEnabledLocations(state.map, state.locationConfig)
    .some((location) => location.id === locationId && location.tags.includes('battlefield'));
}
function trustedEntry(state: GameState, event: AbilityEvent | undefined) {
  if (!event || !['after_controller_enters_location', 'after_player_deployed_to_battlefield'].includes(event.type) ||
      typeof event.id !== 'string' || typeof event.playerId !== 'string' || typeof event.locationId !== 'string') return undefined;
  const trusted = state.abilityRuntime?.trustedEntryEventSnapshots?.[event.id];
  if (!trusted || trusted.type !== event.type || trusted.playerId !== event.playerId || trusted.locationId !== event.locationId) return undefined;
  return trusted;
}

function hasActivePersistentDeploymentConsumer(state: GameState): boolean {
  return state.cards.some((source) => {
    const sourceState = state.abilityRuntime?.cardState[source.instanceId];
    const def = state.abilityRuntime?.pack.cards[source.definitionId];
    const controller = state.players.find((player) => player.id === source.controllerPlayerId);
    return !!def && !!controller && controller.status === 'active' && ['field', 'attack_area'].includes(source.zone) &&
      sourceState?.active === true && sourceState.faceDown !== true && def.abilities.some(isAcceptedB05OtherBattlefieldVpTransferAbility);
  });
}

export function rememberB05DeploymentEntryReceipt(state: GameState, event: AbilityEvent): void {
  const runtime = state.abilityRuntime;
  if (!runtime || event.type !== 'after_player_deployed_to_battlefield') return;
  if (!hasActivePersistentDeploymentConsumer(state)) return;
  if (typeof event.playerId !== 'string' || typeof event.locationId !== 'string' ||
      event.id !== `deploy:${state.round.roundNumber}:${event.playerId}`) throw new Error('B05_DEPLOYMENT_RECEIPT_INVALID');
  if (!isBattlefield(state, event.locationId)) return;
  const player = state.players.find((candidate) => candidate.id === event.playerId);
  if (!player || player.status !== 'active' || player.locationId !== event.locationId) throw new Error('B05_DEPLOYMENT_RECEIPT_INVALID');
  runtime.b05DeploymentEntryReceipts ??= {};
  const next = { eventId: event.id, eventType: 'after_player_deployed_to_battlefield' as const, playerId: event.playerId, locationId: event.locationId, round: state.round.roundNumber };
  const prior = runtime.b05DeploymentEntryReceipts[event.id];
  if (prior && JSON.stringify(prior) !== JSON.stringify(next)) throw new Error('B05_DEPLOYMENT_RECEIPT_COLLISION');
  runtime.b05DeploymentEntryReceipts[event.id] = next;
}

function validatedDeploymentReceipt(state: GameState, rootEventId: string) {
  const receipt = state.abilityRuntime?.b05DeploymentEntryReceipts?.[rootEventId];
  const trusted = state.abilityRuntime?.trustedEntryEventSnapshots?.[rootEventId];
  if (!receipt || receipt.eventId !== rootEventId || receipt.eventType !== 'after_player_deployed_to_battlefield' ||
      rootEventId !== `deploy:${receipt.round}:${receipt.playerId}` || !Number.isSafeInteger(receipt.round) || receipt.round < 1 ||
      !state.players.some((player) => player.id === receipt.playerId) || !isBattlefield(state, receipt.locationId) ||
      !state.abilityRuntime?.processedEvents.includes(rootEventId) || !trusted || trusted.type !== receipt.eventType ||
      trusted.playerId !== receipt.playerId || trusted.locationId !== receipt.locationId) throw new Error('B05_DEPLOYMENT_RECEIPT_STATE_INVALID');
  return receipt;
}

export function b05WorkshopDeploymentTarget(state: GameState, controllerId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): string | undefined {
  if (!isAcceptedB05WorkshopDeploymentExchangeAbility(ability) || event?.type !== 'after_player_deployed_to_battlefield' || !trustedEntry(state, event) ||
      event.playerId === controllerId || event.locationId !== WORKSHOP) return undefined;
  return event.playerId;
}

export function b05OtherBattlefieldEntryTarget(state: GameState, controllerId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): string | undefined {
  if (!isAcceptedB05OtherBattlefieldVpTransferAbility(ability) || !trustedEntry(state, event) || !event?.playerId || event.playerId === controllerId ||
      !event.locationId || event.locationId === WORKSHOP || !isBattlefield(state, event.locationId)) return undefined;
  const controller = state.players.find((player) => player.id === controllerId);
  const entered = state.players.find((player) => player.id === event.playerId);
  if (!controller || controller.status !== 'active' || !isBattlefield(state, controller.locationId) || controller.locationId === event.locationId ||
      !entered || entered.status !== 'active' || entered.locationId !== event.locationId) return undefined;
  if (event.type === 'after_controller_enters_location') {
    const receipt = state.abilityRuntime?.b04MovementEventReceipts?.[event.id];
    if (!receipt || receipt.eventId !== event.id || receipt.playerId !== event.playerId || receipt.toLocationId !== event.locationId ||
        receipt.round !== state.round.roundNumber || receipt.distance < 1) return undefined;
  } else if (event.type === 'after_player_deployed_to_battlefield') {
    const receipt = validatedDeploymentReceipt(state, event.id);
    if (receipt.playerId !== event.playerId || receipt.locationId !== event.locationId || receipt.round !== state.round.roundNumber) return undefined;
  } else return undefined;
  return event.playerId;
}

function validateArm(state: GameState, arm: NonNullable<NonNullable<GameState['abilityRuntime']>['b05RoundCloseArms']>[number]) {
  const { source, def, ability } = sourceAndAbility(state, arm.sourceCardId, arm.entryAbilityId);
  const closeAbility = def?.abilities.find((candidate) => candidate.id === arm.closeAbilityId);
  if (!source || !def || !ability || !closeAbility || source.definitionId !== arm.sourceDefinitionId || source.controllerPlayerId !== arm.controllerId ||
      !isAcceptedB05OtherBattlefieldVpTransferAbility(ability) || !isAcceptedB05RoundEndCloseAbility(closeAbility) ||
      !Number.isSafeInteger(arm.round) || arm.round < 1 || !state.players.some((player) => player.id === arm.eventPlayerId) ||
      !isBattlefield(state, arm.eventLocationId) || arm.eventLocationId === WORKSHOP || !state.abilityRuntime?.processedEvents.includes(arm.rootEventId)) {
    throw new Error('B05_ROUND_CLOSE_ARM_STATE_INVALID');
  }
  if (arm.eventType === 'after_controller_enters_location') {
    const receipt = state.abilityRuntime?.b04MovementEventReceipts?.[arm.rootEventId];
    if (!receipt || receipt.playerId !== arm.eventPlayerId || receipt.toLocationId !== arm.eventLocationId || receipt.round !== arm.round) {
      throw new Error('B05_ROUND_CLOSE_ARM_STATE_INVALID');
    }
  } else if (arm.eventType === 'after_player_deployed_to_battlefield') {
    const receipt = validatedDeploymentReceipt(state, arm.rootEventId);
    if (receipt.playerId !== arm.eventPlayerId || receipt.locationId !== arm.eventLocationId || receipt.round !== arm.round) {
      throw new Error('B05_ROUND_CLOSE_ARM_STATE_INVALID');
    }
  } else throw new Error('B05_ROUND_CLOSE_ARM_STATE_INVALID');
  return { source, def, ability, closeAbility };
}

export function armB05RoundClose(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): void {
  const target = b05OtherBattlefieldEntryTarget(state, controllerId, ability, event);
  if (!target || !event?.locationId) throw new Error('B05_ROUND_CLOSE_ARM_TRIGGER_INVALID');
  const { source, def } = sourceAndAbility(state, sourceCardId, ability.id);
  const closeAbility = def?.abilities.find(isAcceptedB05RoundEndCloseAbility);
  if (!source || !def || source.controllerPlayerId !== controllerId || !closeAbility) throw new Error('B05_ROUND_CLOSE_ARM_SOURCE_INVALID');
  const arms = state.abilityRuntime!.b05RoundCloseArms ??= [];
  const existing = arms.find((entry) => entry.sourceCardId === sourceCardId && entry.round === state.round.roundNumber);
  if (existing) { validateArm(state, existing); return; }
  const next = { sourceCardId, sourceDefinitionId: source.definitionId, controllerId, entryAbilityId: ability.id, closeAbilityId: closeAbility.id,
    rootEventId: event.id, eventType: event.type as 'after_controller_enters_location' | 'after_player_deployed_to_battlefield',
    eventPlayerId: target, eventLocationId: event.locationId, round: state.round.roundNumber };
  arms.push(next);
  validateArm(state, next);
}

export function b05SourceTriggeredThisRound(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility): boolean {
  if (!isAcceptedB05RoundEndCloseAbility(ability)) return false;
  const arms = state.abilityRuntime?.b05RoundCloseArms ?? [];
  const seen = new Set<string>(); let matched = false;
  for (const arm of arms) {
    validateArm(state, arm);
    const key = JSON.stringify([arm.sourceCardId, arm.round]);
    if (seen.has(key)) throw new Error('B05_ROUND_CLOSE_ARM_DUPLICATE');
    seen.add(key);
    if (arm.sourceCardId === sourceCardId && arm.controllerId === controllerId && arm.closeAbilityId === ability.id && arm.round === state.round.roundNumber) matched = true;
  }
  return matched;
}

export function consumeB05RoundCloseArm(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility): void {
  if (!b05SourceTriggeredThisRound(state, controllerId, sourceCardId, ability)) throw new Error('B05_ROUND_CLOSE_CONSUME_INVALID');
  state.abilityRuntime!.b05RoundCloseArms = (state.abilityRuntime!.b05RoundCloseArms ?? []).filter((entry) =>
    !(entry.sourceCardId === sourceCardId && entry.controllerId === controllerId && entry.closeAbilityId === ability.id && entry.round === state.round.roundNumber));
}
