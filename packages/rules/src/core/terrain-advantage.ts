import type { GameState } from '../schema/game';
import type { LocationId } from '../schema/location';
import { getLocationById } from './map-engine';
import { roundLocationTerrainReplacement } from '../ability/round-location-supply-capability';
import { unclaimedBattlefieldTerrainBonus } from '../ability/unclaimed-terrain-upkeep-capability';

function modeState(state: GameState): Record<string, unknown> {
  return (state as unknown as { modeState?: Record<string, unknown> }).modeState ?? {};
}

function hasActiveBasicCardAtBattlefield(
  state: GameState,
  playerId: string,
  battlefieldId: LocationId,
  definitionId: string,
): boolean {
  return state.cards.some((card) =>
    card.controllerPlayerId === playerId &&
    card.definitionId === definitionId &&
    card.zone === 'attack_area' &&
    state.players.some((player) => player.id === playerId && player.locationId === battlefieldId) &&
    state.abilityRuntime?.cardState[card.instanceId]?.active === true &&
    state.abilityRuntime.cardState[card.instanceId]?.faceDown !== true);
}

export function hasRemoteOperationBonus(state: GameState, playerId: string, battlefieldId: LocationId): boolean {
  return hasActiveBasicCardAtBattlefield(state, playerId, battlefieldId, 'basic.preparation');
}

function terrainMultiplierForPlayer(state: GameState, playerId: string): number {
  const entries = modeState(state).terrainMultipliers;
  const authoredMultiplier = !Array.isArray(entries) ? 1 : entries.reduce((multiplier, entry) => {
    if (!entry || typeof entry !== 'object') return multiplier;
    const candidate = entry as { playerId?: string; multiplier?: number };
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
  const assignments = modeState(state).terrainAssignments;
  if (!assignments || typeof assignments !== 'object') return undefined;
  const assigned = (assignments as Partial<Record<string, string[]>>)[battlefieldId];
  if (!Array.isArray(assigned)) return undefined;
  const location = getLocationById(state.map, state.locationConfig, battlefieldId);
  const slots = modeState(state).terrainAssignmentSlots;
  const explicit = slots && typeof slots === 'object'
    ? (slots as Partial<Record<string, Record<string, number>>>)[battlefieldId]?.[playerId]
    : undefined;
  if (Number.isSafeInteger(explicit) && Number(explicit) >= 0 && Number(explicit) < (location?.terrainBonuses?.length ?? 0)) return Number(explicit);
  const index = assigned.indexOf(playerId);
  if (index < 0) return undefined;
  return index < (location?.terrainBonuses?.length ?? 0) ? index : undefined;
}

export function terrainBonusAt(
  state: GameState,
  battlefieldId: LocationId,
  playerId: string,
  terrainSlotIndex?: number,
): number | undefined {
  const location = getLocationById(state.map, state.locationConfig, battlefieldId);
  if (!location?.terrainBonuses?.length || isTerrainSuppressedByAuthoredDuel(state, battlefieldId, playerId)) return undefined;
  if (terrainSlotIndex !== undefined && (terrainSlotIndex < 0 || terrainSlotIndex >= location.terrainBonuses.length)) return undefined;
  const fixedRoundValue = roundLocationTerrainReplacement(state, playerId, battlefieldId);
  const assignedValue = terrainSlotIndex === undefined ? 0 : Number(location.terrainBonuses[terrainSlotIndex] ?? 0);
  const baseValue = (fixedRoundValue ?? assignedValue) + unclaimedBattlefieldTerrainBonus(state, playerId, battlefieldId);
  return typeof baseValue === 'number' ? baseValue * terrainMultiplierForPlayer(state, playerId) : undefined;
}

export function currentDeploymentBonus(state: GameState, playerId: string): number {
  const battlefieldId = state.players.find((player) => player.id === playerId)?.locationId;
  if (!battlefieldId) return 0;
  const location = getLocationById(state.map, state.locationConfig, battlefieldId);
  if (!location?.tags.includes('battlefield')) return 0;
  const fixedRoundValue = roundLocationTerrainReplacement(state, playerId, battlefieldId);
  const terrainSlotIndex = assignedTerrainSlotIndex(state, battlefieldId, playerId);
  const unclaimedBonus = unclaimedBattlefieldTerrainBonus(state, playerId, battlefieldId);
  if (terrainSlotIndex === undefined && fixedRoundValue === undefined && unclaimedBonus === 0) return 0;
  return terrainBonusAt(state, battlefieldId, playerId, terrainSlotIndex) ?? 0;
}