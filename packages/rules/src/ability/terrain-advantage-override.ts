import type { GameState } from '../schema/game';
import type { LocationId } from '../schema/location';
import { getLocationById } from '../core/map-engine';

interface TerrainOverrideEntry {
  playerId: string;
  locationId: LocationId;
  round: number;
  add: number;
  multiply: number;
  sourceCardId: string;
}

type TerrainModeState = {
  terrainAssignments?: Partial<Record<LocationId, string[]>>;
  terrainMultipliers?: Array<{ playerId?: string; multiplier?: number }>;
  terrainAdvantageOverrides?: TerrainOverrideEntry[];
};

function mode(state: GameState): TerrainModeState {
  const carrier = state as unknown as { modeState?: TerrainModeState };
  carrier.modeState ??= {};
  return carrier.modeState;
}

function rawTerrain(state: GameState, playerId: string, locationId: LocationId): number {
  const assignments = mode(state).terrainAssignments?.[locationId] ?? [];
  const slot = assignments.indexOf(playerId);
  if (slot < 0) return 0;
  const location = getLocationById(state.map, state.locationConfig, locationId);
  const base = location?.terrainBonuses?.[slot];
  return typeof base === 'number' ? base : 0;
}

function currentAdjustment(state: GameState, playerId: string, locationId: LocationId): TerrainOverrideEntry | undefined {
  return [...(mode(state).terrainAdvantageOverrides ?? [])].reverse().find((entry) =>
    entry.playerId === playerId && entry.locationId === locationId && entry.round === state.round.roundNumber);
}

export function applyTerrainAdvantageOverride(
  state: GameState,
  playerId: string,
  locationId: LocationId,
  baseValue: number,
): number {
  const adjustment = currentAdjustment(state, playerId, locationId);
  return adjustment ? (baseValue + adjustment.add) * adjustment.multiply : baseValue;
}

/**
 * Returns authored terrain after the bounded Mash adjustment and generic authored terrain multipliers.
 * Combat-only multipliers such as active basic.preparation remain owned by the shared combat resolver.
 */
export function terrainAdvantageAtLocation(state: GameState, playerId: string, locationId: LocationId): number {
  const adjusted = applyTerrainAdvantageOverride(state, playerId, locationId, rawTerrain(state, playerId, locationId));
  return (mode(state).terrainMultipliers ?? []).reduce((value, entry) =>
    entry.playerId === playerId && typeof entry.multiplier === 'number' ? value * entry.multiplier : value, adjusted);
}

export function hasTerrainAdvantageOverride(state: GameState, playerId: string, locationId: LocationId): boolean {
  return currentAdjustment(state, playerId, locationId) !== undefined;
}

export function setTerrainAdvantageOverride(
  state: GameState,
  playerId: string,
  locationId: LocationId,
  add: number,
  multiply: number,
  sourceCardId: string,
): void {
  if (!Number.isFinite(add) || !Number.isFinite(multiply)) throw new Error('Terrain advantage adjustment must be finite');
  const store = mode(state);
  store.terrainAdvantageOverrides ??= [];
  store.terrainAdvantageOverrides = store.terrainAdvantageOverrides.filter((entry) =>
    !(entry.playerId === playerId && entry.locationId === locationId && entry.round === state.round.roundNumber));
  store.terrainAdvantageOverrides.push({ playerId, locationId, round: state.round.roundNumber, add, multiply, sourceCardId });
}
