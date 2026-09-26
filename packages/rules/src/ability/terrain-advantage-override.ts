import type { GameState } from '../schema/game';
import type { LocationId } from '../schema/location';
import { getLocationById } from '../core/map-engine';

interface TerrainOverrideEntry {
  playerId: string;
  locationId: LocationId;
  round: number;
  value: number;
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

function baseTerrain(state: GameState, playerId: string, locationId: LocationId): number {
  const assignments = mode(state).terrainAssignments?.[locationId] ?? [];
  const slot = assignments.indexOf(playerId);
  if (slot < 0) return 0;
  const location = getLocationById(state.map, state.locationConfig, locationId);
  const base = location?.terrainBonuses?.[slot];
  if (typeof base !== 'number') return 0;
  const multiplier = (mode(state).terrainMultipliers ?? []).reduce((value, entry) =>
    entry.playerId === playerId && typeof entry.multiplier === 'number' ? value * entry.multiplier : value, 1);
  return base * multiplier;
}

export function terrainAdvantageAtLocation(state: GameState, playerId: string, locationId: LocationId): number {
  const override = [...(mode(state).terrainAdvantageOverrides ?? [])].reverse().find((entry) =>
    entry.playerId === playerId && entry.locationId === locationId && entry.round === state.round.roundNumber);
  return override?.value ?? baseTerrain(state, playerId, locationId);
}

export function hasTerrainAdvantageOverride(state: GameState, playerId: string, locationId: LocationId): boolean {
  return (mode(state).terrainAdvantageOverrides ?? []).some((entry) =>
    entry.playerId === playerId && entry.locationId === locationId && entry.round === state.round.roundNumber);
}

export function setTerrainAdvantageOverride(
  state: GameState,
  playerId: string,
  locationId: LocationId,
  value: number,
  sourceCardId: string,
): void {
  if (!Number.isFinite(value)) throw new Error('Terrain advantage override must be finite');
  const store = mode(state);
  store.terrainAdvantageOverrides ??= [];
  store.terrainAdvantageOverrides = store.terrainAdvantageOverrides.filter((entry) =>
    !(entry.playerId === playerId && entry.locationId === locationId && entry.round === state.round.roundNumber));
  store.terrainAdvantageOverrides.push({ playerId, locationId, round: state.round.roundNumber, value, sourceCardId });
}
