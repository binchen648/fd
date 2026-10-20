import type { GameState } from '../schema/game';
import type { AbilityEvent, WodimeGodLegacyLocationState } from './types';
import type { LocationId } from '../schema/location';
import { terrainAdvantageAtLocation } from './terrain-advantage-override';

const SOURCE_DEFINITION = 'master.wodime.skill.s3';
const SOURCE_ABILITY = 'wodime.god-legacy';
const ATLANTIS_EVENT = 'event.wodime.atlantis.hephaestus';

function runtime(state: GameState) { return state.abilityRuntime!; }

function source(state: GameState): { cardId: string; playerId: string } | undefined {
  for (const physical of state.cards) {
    if (physical.definitionId !== SOURCE_DEFINITION || physical.zone !== 'skill') continue;
    const owner = state.players.find((player) => player.id === physical.ownerPlayerId);
    if (!owner || owner.status !== 'eliminated' || physical.ownerPlayerId !== physical.controllerPlayerId) continue;
    const ability = runtime(state).pack.cards[physical.definitionId]?.abilities.find((entry) => entry.id === SOURCE_ABILITY);
    if (!ability) continue;
    return { cardId: physical.instanceId, playerId: owner.id };
  }
  return undefined;
}

function ensureActivated(state: GameState): boolean {
  const origin = source(state);
  if (!origin) return false;
  const r = runtime(state);
  r.wodimeGodLegacyByLocation ??= {};
  r.wodimeGodLegacyByPlayer ??= {};
  if (Object.values(r.wodimeGodLegacyByLocation).some((entry) => entry.sourceCardId === origin.cardId)) return true;
  for (const placement of state.eventPlacements) {
    if (placement.eventCardId !== ATLANTIS_EVENT) continue;
    const entry: WodimeGodLegacyLocationState = {
      locationId: placement.locationId,
      tokens: 3,
      sourceCardId: origin.cardId,
      abilityId: SOURCE_ABILITY,
      activatedRound: state.round.roundNumber,
      lifecycle: 'game',
    };
    r.wodimeGodLegacyByLocation[placement.locationId] = entry;
  }
  // The state is still authoritative even when no Hephaestus card is currently placed;
  // later event resolution may add a location entry through the same source contract.
  return true;
}

function audit(state: GameState, event: AbilityEvent, playerId: string, sourceCardId: string): void {
  runtime(state).events.push({
    type: event.type === 'after_battle_result_determined' ? 'wodime_god_legacy_battle_transfer' : 'wodime_god_legacy_location_carry',
    playerId,
    controllerId: playerId,
    sourceCardId,
    abilityId: SOURCE_ABILITY,
    visibility: playerId,
  });
}

export function settleWodimeGodLegacyEvent(state: GameState, event: AbilityEvent): void {
  if (!['after_battle_result_determined', 'after_controller_enters_location'].includes(event.type)) return;
  if (!ensureActivated(state)) return;
  const r = runtime(state);
  const origin = source(state);
  if (!origin) return;
  r.wodimeGodLegacyByPlayer ??= {};
  if (event.type === 'after_battle_result_determined' && event.battlefieldId && event.battleResult?.winners?.length === 1) {
    const location = r.wodimeGodLegacyByLocation?.[event.battlefieldId];
    const winner = event.battleResult.winners[0]!;
    if (location && location.tokens > 0 && state.players.some((player) => player.id === winner && player.status === 'active')) {
      r.wodimeGodLegacyByPlayer[winner] = (r.wodimeGodLegacyByPlayer[winner] ?? 0) + location.tokens;
      location.tokens = 0;
      audit(state, event, winner, origin.cardId);
    }
  }
  if (event.type === 'after_controller_enters_location' && event.playerId && event.previousLocationId) {
    const location = r.wodimeGodLegacyByLocation?.[event.previousLocationId];
    const player = state.players.find((candidate) => candidate.id === event.playerId);
    if (!location || !player || location.tokens <= 0) return;
    if (!state.map.locations.some((candidate) => candidate.id === event.previousLocationId)) return;
    const carry = Math.max(0, Math.min(location.tokens, Math.floor(terrainAdvantageAtLocation(state, event.playerId, event.previousLocationId as LocationId))));
    if (carry > 0) {
      location.tokens -= carry;
      r.wodimeGodLegacyByPlayer[event.playerId] = (r.wodimeGodLegacyByPlayer[event.playerId] ?? 0) + carry;
      audit(state, event, event.playerId, origin.cardId);
    }
  }
}

export function isWodimeGodLegacyRuntimeStateValid(state: GameState): boolean {
  const r = state.abilityRuntime;
  if (!r) return true;
  const players = new Set(state.players.map((player) => player.id));
  const locations = new Set<string>(state.map.locations.map((location) => location.id));
  if (r.wodimeGodLegacyByPlayer && Object.entries(r.wodimeGodLegacyByPlayer).some(([id, value]) => !players.has(id) || !Number.isSafeInteger(value) || value < 0)) return false;
  if (!r.wodimeGodLegacyByLocation) return true;
  return Object.entries(r.wodimeGodLegacyByLocation).every(([id, entry]) => id === entry.locationId && locations.has(id) &&
    Number.isSafeInteger(entry.tokens) && entry.tokens >= 0 && typeof entry.sourceCardId === 'string' && entry.abilityId === SOURCE_ABILITY &&
    entry.lifecycle === 'game' && Number.isSafeInteger(entry.activatedRound) && entry.activatedRound >= 1 &&
    state.cards.some((card) => card.instanceId === entry.sourceCardId && card.definitionId === SOURCE_DEFINITION));
}
