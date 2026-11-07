import type { GameState } from '../schema/game';
import type { LocationId } from '../schema/location';
import { getLocationById } from './map-engine';

function modeState(state: GameState): Record<string, unknown> {
  return (state as unknown as { modeState?: Record<string, unknown> }).modeState ?? {};
}
function liveTerrainEntry(state: GameState, entry: Record<string, unknown>): boolean {
  if (typeof entry.expiresAtRound === 'number' && state.round.roundNumber >= entry.expiresAtRound) return false;
  if (entry.sourceMustRemainActive !== true) return true;
  const source = state.cards.find(c => c.instanceId === entry.sourceCardId);
  return !!source && ['field','attack_area'].includes(source.zone) && source.controllerPlayerId === entry.playerId &&
    state.abilityRuntime?.cardState[source.instanceId]?.active === true && state.abilityRuntime.cardState[source.instanceId]?.faceDown !== true;
}

function hasActiveBasicCardAtBattlefield(
  state: GameState,
  playerId: string,
  battlefieldId: LocationId,
  rule: string,
): boolean {
  return state.cards.some((card) =>
    card.controllerPlayerId === playerId &&
    state.abilityRuntime?.pack.cards[card.definitionId]?.abilities.some((ability) =>
      ability.ruleModifiers.some((modifier) => modifier.rule === rule)) &&
    card.zone === 'attack_area' &&
    state.players.some((player) => player.id === playerId && player.locationId === battlefieldId) &&
    state.abilityRuntime?.cardState[card.instanceId]?.active === true &&
    state.abilityRuntime.cardState[card.instanceId]?.faceDown !== true);
}

export function hasRemoteOperationBonus(state: GameState, playerId: string, battlefieldId: LocationId): boolean {
  return hasActiveBasicCardAtBattlefield(state, playerId, battlefieldId, 'terrain.multiplier');
}

function terrainMultiplierForPlayer(state: GameState, playerId: string): number {
  const entries = modeState(state).terrainMultipliers;
  const authoredMultiplier = !Array.isArray(entries) ? 1 : entries.reduce((multiplier, entry) => {
    if (!entry || typeof entry !== 'object') return multiplier;
    if (!liveTerrainEntry(state, entry)) return multiplier;
    const candidate = entry as { playerId?: string; multiplier?: number; expiresAtRound?: number };
    if (candidate.expiresAtRound !== undefined && state.round.roundNumber >= candidate.expiresAtRound) return multiplier;
    return candidate.playerId === playerId && typeof candidate.multiplier === 'number'
      ? multiplier * candidate.multiplier
      : multiplier;
  }, 1);
  const currentBattlefieldId = state.players.find((player) => player.id === playerId)?.locationId;
  return currentBattlefieldId && hasRemoteOperationBonus(state, playerId, currentBattlefieldId)
    ? authoredMultiplier * 2
    : authoredMultiplier;
}

function isTerrainSuppressedByAuthoredDuel(state: GameState, battlefieldId: LocationId, playerId: string): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  for (const ongoing of runtime.ongoingEffects) {
    const sourceCard = state.cards.find((card) => card.instanceId === ongoing.sourceCardId);
    const controller = state.players.find((player) => player.id === ongoing.controllerId);
    if (!sourceCard || !['field', 'attack_area'].includes(sourceCard.zone) || !runtime.cardState[sourceCard.instanceId]?.active) continue;
    if (controller?.locationId !== battlefieldId) continue;
    const blocksTerrain = ongoing.ruleModifiers.some((modifier) =>
      modifier.definition.operation === 'ignore' &&
      modifier.definition.rule === 'terrain_and_external_servant_or_npc_effects');
    if (!blocksTerrain) continue;
    if (playerId === ongoing.controllerId) return true;
    const player = state.players.find((candidate) => candidate.id === playerId);
    if (player?.locationId === battlefieldId) return true;
  }
  return false;
}

export function assignedTerrainSlotIndex(state: GameState, battlefieldId: LocationId, playerId: string): number | undefined {
  // This metric is a defensive pure read, not snapshot admission. Invalid other
  // slots do not change the identity/value of this player's printed slot.
  const assignments=modeState(state).terrainAssignments;
  if (!assignments || typeof assignments!=='object') return undefined;
  const slots=(assignments as Record<string,unknown>)[battlefieldId];
  if (!Array.isArray(slots)) return undefined;
  const actor=state.players.find(p=>p.id===playerId && p.status==='active' && p.locationId===battlefieldId);
  if (!actor) return undefined;
  const index=slots.indexOf(playerId),count=getLocationById(state.map,state.locationConfig,battlefieldId)?.terrainBonuses?.length??0;
  return index>=0 && index<count ? index : undefined;
}

export function terrainBonusAt(
  state: GameState,
  battlefieldId: LocationId,
  playerId: string,
  terrainSlotIndex: number,
): number | undefined {
  const location = getLocationById(state.map, state.locationConfig, battlefieldId);
  if (!location?.terrainBonuses?.length || isTerrainSuppressedByAuthoredDuel(state, battlefieldId, playerId)) return undefined;
  const baseValue = terrainSlotIndex === -1 ? 0 : location.terrainBonuses[terrainSlotIndex];
  const entries = modeState(state).terrainBonuses;
  const sumBonuses = (layer: 'base' | 'final'): number => !Array.isArray(entries) ? 0 : entries.reduce((sum, entry) => {
    if (!entry || typeof entry !== 'object') return sum;
    if (!liveTerrainEntry(state, entry) || (entry.layer === 'base' ? 'base' : 'final') !== layer) return sum;
    const candidate = entry as { playerId?: string; bonus?: number; locationId?: string; expiresAtRound?: number };
    if (candidate.playerId !== playerId || typeof candidate.bonus !== 'number') return sum;
    if (candidate.locationId !== undefined && candidate.locationId !== battlefieldId) return sum;
    if (candidate.expiresAtRound !== undefined && state.round.roundNumber >= candidate.expiresAtRound) return sum;
    return sum + candidate.bonus;
  }, 0);
  if (terrainSlotIndex === -1 && sumBonuses('base') === 0) return undefined;
  return typeof baseValue === 'number' ? (baseValue + sumBonuses('base')) * terrainMultiplierForPlayer(state, playerId) + sumBonuses('final') : undefined;
}

export function currentDeploymentBonus(state: GameState, playerId: string): number {
  const battlefieldId = state.players.find((player) => player.id === playerId)?.locationId;
  if (!battlefieldId) return 0;
  const location = getLocationById(state.map, state.locationConfig, battlefieldId);
  if (!location?.tags.includes('battlefield')) return 0;
  const terrainSlotIndex = assignedTerrainSlotIndex(state, battlefieldId, playerId);
  return terrainBonusAt(state, battlefieldId, playerId, terrainSlotIndex ?? -1) ?? 0;
}
