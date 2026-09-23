import type { GameState } from '../schema/game';
import type { LocationId } from '../schema/location';
import { getLocationById } from '../core/map-engine';
import type { AbilityEvent, AuthoringAbility, RuleNode } from './types';
import { trustedControllerDefeatedFacts } from './controller-defeated-vp-reward';

export const B04_FIRST_MOVEMENT_CONDITION = 'b04_controller_first_movement_this_round';
export const B04_FIRST_MOVEMENT_SOURCE_POWER_EFFECT = 'b04_accumulate_source_power_from_movement';
export const B04_ROUND_DOUBLE_EFFECT = 'b04_double_source_power_this_round';
export const B04_EVENT_PLAYER_MANA_EFFECT = 'b04_adjust_event_player_mana';
export const B04_SAME_LOCATION_MANA_EFFECT = 'b04_grant_same_location_mana';

function record(value: unknown): Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}
function exactKeys(value: unknown, expected: readonly string[]): boolean {
  const keys = Object.keys(record(value)).sort(); const wanted = [...expected].sort();
  return keys.length === wanted.length && keys.every((key, index) => key === wanted[index]);
}
function empty(value: unknown): boolean { return exactKeys(value, []); }
function exactCondition(value: unknown, type: string): boolean {
  return record(value).type === type && exactKeys(value, ['type']);
}
function automatic(a: AuthoringAbility): boolean {
  return a.execution.mode === 'automatic' && Array.isArray(a.execution.allowedOperations) && a.execution.allowedOperations.length === 0;
}
function exactResponseWindow(value: unknown): boolean {
  return empty(value) || (record(value).order === 'turn_order' && record(value).passBehavior === 'decline_this_window' && exactKeys(value, ['order', 'passBehavior']));
}
function commonEmpty(a: AuthoringAbility): boolean {
  return a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 && a.ruleModifiers.length === 0 &&
    exactResponseWindow(a.responseWindow) && empty(a.visibility);
}

export function isAcceptedB04FirstMovementSourcePowerAbility(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'after_controller_enters_location' &&
    a.conditions.length === 3 && exactCondition(a.conditions[0], 'source_active') &&
    exactCondition(a.conditions[1], 'event_player_is_controller') && exactCondition(a.conditions[2], B04_FIRST_MOVEMENT_CONDITION) &&
    a.effects.length === 1 && record(a.effects[0]).type === B04_FIRST_MOVEMENT_SOURCE_POWER_EFFECT && exactKeys(a.effects[0], ['type']) &&
    empty(a.lifecycle) && empty(a.limit) && commonEmpty(a) && automatic(a);
}

export function isAcceptedB04SourcePlayRoundDoubleAbility(a: AuthoringAbility): boolean {
  const effect = record(a.effects[0]);
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'on_card_played' &&
    a.conditions.length === 1 && exactCondition(a.conditions[0], 'source_active') &&
    a.effects.length === 1 && effect.type === B04_ROUND_DOUBLE_EFFECT && effect.amount === 'printed_base_power' && exactKeys(effect, ['type', 'amount']) &&
    empty(a.lifecycle) && empty(a.limit) && commonEmpty(a) && automatic(a);
}

export function isAcceptedB04OpponentEntryManaDrainAbility(a: AuthoringAbility): boolean {
  const effect = record(a.effects[0]);
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'after_controller_enters_location' &&
    a.conditions.length === 3 && exactCondition(a.conditions[0], 'source_active') &&
    exactCondition(a.conditions[1], 'event_player_is_opponent') && exactCondition(a.conditions[2], 'event_location_equals_controller') &&
    a.effects.length === 1 && effect.type === B04_EVENT_PLAYER_MANA_EFFECT && effect.amount === -2 && exactKeys(effect, ['type', 'amount']) &&
    exactKeys(a.lifecycle, ['duration', 'starts', 'cleanup']) && a.lifecycle.duration === 'while_active' && a.lifecycle.starts === 'immediate' && a.lifecycle.cleanup === 'remain_active' &&
    empty(a.limit) && commonEmpty(a) && automatic(a);
}

export function isAcceptedB04ControllerDefeatManaReleaseAbility(a: AuthoringAbility): boolean {
  const first = record(a.effects[0]); const second = record(a.effects[1]);
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'after_controller_defeated' &&
    a.conditions.length === 2 && exactCondition(a.conditions[0], 'source_active') && exactCondition(a.conditions[1], 'event_player_is_controller') &&
    a.effects.length === 2 && first.type === B04_SAME_LOCATION_MANA_EFFECT && first.amount === 3 && exactKeys(first, ['type', 'amount']) &&
    second.type === 'close_source_card' && exactKeys(second, ['type']) &&
    exactKeys(a.lifecycle, ['duration', 'starts', 'cleanup']) && a.lifecycle.duration === 'while_active' && a.lifecycle.starts === 'immediate' && a.lifecycle.cleanup === 'remain_active' &&
    empty(a.limit) && commonEmpty(a) && automatic(a);
}

export function isB04EventSourcePowerCandidate(a: AuthoringAbility | RuleNode): boolean {
  const raw = record(a);
  const conditions = Array.isArray(raw.conditions) ? raw.conditions : [];
  const effects = Array.isArray(raw.effects) ? raw.effects : [];
  return conditions.some((condition) => record(condition).type === B04_FIRST_MOVEMENT_CONDITION) ||
    effects.some((effect) => [B04_FIRST_MOVEMENT_SOURCE_POWER_EFFECT, B04_ROUND_DOUBLE_EFFECT, B04_EVENT_PLAYER_MANA_EFFECT, B04_SAME_LOCATION_MANA_EFFECT].includes(String(record(effect).type ?? '')));
}
export function isAcceptedB04EventSourcePowerAbility(a: AuthoringAbility): boolean {
  return isAcceptedB04FirstMovementSourcePowerAbility(a) || isAcceptedB04SourcePlayRoundDoubleAbility(a) ||
    isAcceptedB04OpponentEntryManaDrainAbility(a) || isAcceptedB04ControllerDefeatManaReleaseAbility(a);
}

function definition(state: GameState, sourceCardId: string) {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  return source ? state.abilityRuntime?.pack.cards[source.definitionId] : undefined;
}
function sourceAndAbility(state: GameState, sourceCardId: string, abilityId: string) {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const def = source ? state.abilityRuntime?.pack.cards[source.definitionId] : undefined;
  const ability = def?.abilities.find((candidate) => candidate.id === abilityId);
  return { source, def, ability };
}

export function rememberB04MovementReceipt(
  state: GameState,
  event: AbilityEvent,
  fromLocationId: string,
  toLocationId: string,
  distance: number,
): void {
  const runtime = state.abilityRuntime;
  if (!runtime || event.type !== 'after_controller_enters_location' || typeof event.id !== 'string' || !event.id ||
      typeof event.playerId !== 'string' || event.locationId !== toLocationId || !fromLocationId || !toLocationId || fromLocationId === toLocationId ||
      !Number.isSafeInteger(distance) || distance < 1 || !Number.isSafeInteger(state.round.roundNumber) || state.round.roundNumber < 1) {
    throw new Error('B04_MOVEMENT_RECEIPT_INVALID');
  }
  const lastLog = state.log.at(-1);
  const payload = lastLog?.payload ?? {};
  const movementKind = payload.movementKind;
  const manaSpent = payload.manaSpent;
  const cumulativeDistance = runtime.movementDistanceThisRound[event.playerId];
  const movementLogIndex = state.log.length - 1;
  if (lastLog?.type !== 'movement' || lastLog.message !== `player:${event.playerId}:${movementKind}_move:${fromLocationId}->${toLocationId}` ||
      payload.playerId !== event.playerId || payload.from !== fromLocationId || payload.to !== toLocationId ||
      (movementKind !== 'normal' && movementKind !== 'effect') || !Number.isSafeInteger(manaSpent) || Number(manaSpent) < 0 ||
      !Number.isSafeInteger(cumulativeDistance) || Number(cumulativeDistance) < distance || movementLogIndex < 0) {
    throw new Error('B04_MOVEMENT_RECEIPT_LOG_INVALID');
  }
  const exactMovementKind = movementKind as 'normal' | 'effect';
  runtime.b04MovementEventReceipts ??= {};
  const next = { eventId: event.id, eventType: 'after_controller_enters_location' as const, playerId: event.playerId, fromLocationId, toLocationId, distance,
    cumulativeDistance: Number(cumulativeDistance), round: state.round.roundNumber, movementKind: exactMovementKind, manaSpent: Number(manaSpent), movementLogIndex };
  const prior = runtime.b04MovementEventReceipts[event.id];
  if (prior && JSON.stringify(prior) !== JSON.stringify(next)) throw new Error('B04_MOVEMENT_RECEIPT_COLLISION');
  runtime.b04MovementEventReceipts[event.id] = next;
}

const B04_ENTRY_EVENT_TYPES = ['after_controller_enters_location', 'after_player_deployed_to_battlefield'] as const;
function trustedEntry(state: GameState, event: AbilityEvent | undefined) {
  if (!event || !B04_ENTRY_EVENT_TYPES.includes(event.type as (typeof B04_ENTRY_EVENT_TYPES)[number]) ||
      typeof event.id !== 'string' || typeof event.playerId !== 'string' || typeof event.locationId !== 'string') return undefined;
  const trusted = state.abilityRuntime?.trustedEntryEventSnapshots?.[event.id];
  if (!trusted || trusted.type !== event.type || trusted.playerId !== event.playerId || trusted.locationId !== event.locationId) return undefined;
  return trusted;
}

export function b04FirstMovementCondition(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): boolean {
  if (!isAcceptedB04FirstMovementSourcePowerAbility(ability) || event?.type !== 'after_controller_enters_location' || !trustedEntry(state, event) || event.playerId !== controllerId) return false;
  const movement = state.abilityRuntime?.b04MovementEventReceipts?.[event!.id];
  if (!movement || movement.playerId !== controllerId || movement.toLocationId !== event!.locationId || movement.round !== state.round.roundNumber || movement.distance < 1) return false;
  const receipts = state.abilityRuntime?.b04FirstMovementSourcePowerReceipts ?? [];
  return !receipts.some((receipt) => receipt.sourceCardId === sourceCardId && receipt.abilityId === ability.id && receipt.round === state.round.roundNumber);
}

export function installB04FirstMovementSourcePower(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): void {
  if (!b04FirstMovementCondition(state, controllerId, sourceCardId, ability, event)) throw new Error('B04_FIRST_MOVEMENT_SOURCE_POWER_TRIGGER_INVALID');
  const movement = state.abilityRuntime!.b04MovementEventReceipts![event!.id]!;
  const { source, def } = sourceAndAbility(state, sourceCardId, ability.id);
  if (!source || !def || source.controllerPlayerId !== controllerId) throw new Error('B04_FIRST_MOVEMENT_SOURCE_POWER_SOURCE_INVALID');
  const receipts = state.abilityRuntime!.b04FirstMovementSourcePowerReceipts ??= [];
  receipts.push({ sourceCardId, sourceDefinitionId: source.definitionId, controllerId, abilityId: ability.id, round: state.round.roundNumber, rootEventId: event!.id, amount: movement.cumulativeDistance });
}

export function installB04RoundDouble(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): void {
  if (!isAcceptedB04SourcePlayRoundDoubleAbility(ability) || !event || event.type !== 'on_card_played' || event.playerId !== controllerId || event.sourceCardId !== sourceCardId) throw new Error('B04_ROUND_DOUBLE_TRIGGER_INVALID');
  const played = event.playedCards ?? [];
  if (!played.some((entry) => entry.instanceId === sourceCardId && entry.controllerId === controllerId && !entry.faceDown)) throw new Error('B04_ROUND_DOUBLE_TRIGGER_INVALID');
  const { source, def } = sourceAndAbility(state, sourceCardId, ability.id);
  const base = Number(def?.cardFace.basePower);
  if (!source || !def || source.controllerPlayerId !== controllerId || !Number.isSafeInteger(base) || base < 0) throw new Error('B04_ROUND_DOUBLE_SOURCE_INVALID');
  const bonuses = state.abilityRuntime!.b04RoundSourcePowerBonuses ??= [];
  const key = bonuses.find((entry) => entry.sourceCardId === sourceCardId && entry.abilityId === ability.id && entry.round === state.round.roundNumber);
  if (key) throw new Error('B04_ROUND_DOUBLE_DUPLICATE');
  bonuses.push({ sourceCardId, sourceDefinitionId: source.definitionId, controllerId, abilityId: ability.id, round: state.round.roundNumber, amount: base });
}

function validatePowerState(state: GameState): void {
  const runtime = state.abilityRuntime; if (!runtime) return;
  const seenMovement = new Set<string>(); const seenMovementLogs = new Set<number>();
  for (const [id, receipt] of Object.entries(runtime.b04MovementEventReceipts ?? {})) {
    const log = state.log[receipt.movementLogIndex]; const payload = log?.payload ?? {};
    const canonicalId = /^(?:enter-location|ruler-seal-enter-location)-[1-9]\d*$/.test(id);
    if (id !== receipt.eventId || receipt.eventType !== 'after_controller_enters_location' || !canonicalId || seenMovement.has(id) ||
        seenMovementLogs.has(receipt.movementLogIndex) || !runtime.processedEvents.includes(id) || !state.players.some((player) => player.id === receipt.playerId) ||
        !receipt.fromLocationId || !receipt.toLocationId || receipt.fromLocationId === receipt.toLocationId || !Number.isSafeInteger(receipt.distance) || receipt.distance < 1 ||
        !Number.isSafeInteger(receipt.cumulativeDistance) || receipt.cumulativeDistance < receipt.distance || !Number.isSafeInteger(receipt.round) || receipt.round < 1 ||
        (receipt.movementKind !== 'normal' && receipt.movementKind !== 'effect') || !Number.isSafeInteger(receipt.manaSpent) || receipt.manaSpent < 0 ||
        !Number.isSafeInteger(receipt.movementLogIndex) || receipt.movementLogIndex < 0 || log?.type !== 'movement' ||
        log.message !== `player:${receipt.playerId}:${receipt.movementKind}_move:${receipt.fromLocationId}->${receipt.toLocationId}` ||
        payload.playerId !== receipt.playerId || payload.from !== receipt.fromLocationId || payload.to !== receipt.toLocationId ||
        payload.movementKind !== receipt.movementKind || payload.manaSpent !== receipt.manaSpent) throw new Error('B04_MOVEMENT_RECEIPT_STATE_INVALID');
    seenMovement.add(id); seenMovementLogs.add(receipt.movementLogIndex);
  }
  const seenFirstMovementSourcePower = new Set<string>();
  for (const receipt of runtime.b04FirstMovementSourcePowerReceipts ?? []) {
    const { source, def, ability } = sourceAndAbility(state, receipt.sourceCardId, receipt.abilityId);
    const movement = runtime.b04MovementEventReceipts?.[receipt.rootEventId];
    const key = JSON.stringify([receipt.sourceCardId, receipt.abilityId, receipt.round]);
    if (seenFirstMovementSourcePower.has(key) || !source || !def || !ability || source.definitionId !== receipt.sourceDefinitionId || source.controllerPlayerId !== receipt.controllerId ||
        !isAcceptedB04FirstMovementSourcePowerAbility(ability) || !movement || movement.playerId !== receipt.controllerId || movement.round !== receipt.round ||
        movement.cumulativeDistance !== receipt.amount || !Number.isSafeInteger(receipt.amount) || receipt.amount < 1) throw new Error('B04_FIRST_MOVEMENT_SOURCE_POWER_STATE_INVALID');
    seenFirstMovementSourcePower.add(key);
  }
  const seenRound = new Set<string>();
  for (const bonus of runtime.b04RoundSourcePowerBonuses ?? []) {
    const { source, def, ability } = sourceAndAbility(state, bonus.sourceCardId, bonus.abilityId);
    const base = Number(def?.cardFace.basePower); const key = JSON.stringify([bonus.sourceCardId, bonus.abilityId, bonus.round]);
    if (seenRound.has(key) || !source || !def || !ability || source.definitionId !== bonus.sourceDefinitionId || source.controllerPlayerId !== bonus.controllerId ||
        !isAcceptedB04SourcePlayRoundDoubleAbility(ability) || !Number.isSafeInteger(bonus.round) || bonus.round < 1 || !Number.isSafeInteger(base) || bonus.amount !== base) {
      throw new Error('B04_ROUND_POWER_STATE_INVALID');
    }
    seenRound.add(key);
  }
}

export function b04SourcePowerBonus(state: GameState, sourceCardId: string): number {
  validatePowerState(state);
  const runtime = state.abilityRuntime; if (!runtime) return 0;
  const permanent = (runtime.b04FirstMovementSourcePowerReceipts ?? []).filter((entry) => entry.sourceCardId === sourceCardId).reduce((sum, entry) => sum + entry.amount, 0);
  const round = (runtime.b04RoundSourcePowerBonuses ?? []).filter((entry) => entry.sourceCardId === sourceCardId && entry.round === state.round.roundNumber).reduce((sum, entry) => sum + entry.amount, 0);
  return permanent + round;
}

export function b04EntryLocationEqualsController(state: GameState, controllerId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): boolean {
  if (!isAcceptedB04OpponentEntryManaDrainAbility(ability) || !trustedEntry(state, event) || !event?.locationId) return false;
  const controller = state.players.find((player) => player.id === controllerId);
  const location = getLocationById(state.map, state.locationConfig, event.locationId as LocationId);
  return !!controller && controller.status === 'active' && controller.locationId === event.locationId && location?.tags.includes('battlefield') === true;
}

export function b04TrustedOpponentEntry(state: GameState, controllerId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): string | undefined {
  if (!isAcceptedB04OpponentEntryManaDrainAbility(ability) || !trustedEntry(state, event) || !event?.playerId || event.playerId === controllerId ||
      !b04EntryLocationEqualsController(state, controllerId, ability, event)) return undefined;
  const affected = state.players.find((player) => player.id === event.playerId);
  if (!affected || affected.status !== 'active' || affected.locationId !== event.locationId) return undefined;
  if (event.type === 'after_controller_enters_location') {
    const movement = state.abilityRuntime?.b04MovementEventReceipts?.[event.id];
    if (!movement || movement.eventId !== event.id || movement.playerId !== event.playerId || movement.toLocationId !== event.locationId ||
        movement.round !== state.round.roundNumber || movement.distance < 1) return undefined;
  } else if (event.type !== 'after_player_deployed_to_battlefield') return undefined;
  return event.playerId;
}

export function b04TrustedControllerDefeat(state: GameState, controllerId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): boolean {
  return isAcceptedB04ControllerDefeatManaReleaseAbility(ability) && !!trustedControllerDefeatedFacts(state, controllerId, event);
}
export function b04SameLocationDefeatPlayerIds(state: GameState, controllerId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): string[] {
  if (!isAcceptedB04ControllerDefeatManaReleaseAbility(ability)) return [];
  const facts = trustedControllerDefeatedFacts(state, controllerId, event);
  if (!facts) return [];
  const frozenRoot = state.abilityRuntime?.trustedBattleResultSnapshots?.[facts.resultId];
  if (!frozenRoot || frozenRoot.battlefieldId !== facts.battlefieldId || !frozenRoot.loserIds.includes(controllerId)) return [];
  const freshLosers = new Set(frozenRoot.loserIds);
  return state.players.filter((player) => player.locationId === facts.battlefieldId && (player.status === 'active' || freshLosers.has(player.id))).map((player) => player.id);
}
