import type { GameState } from '../schema/game';

export type TerrainSlots = Array<string | null>;
type TerrainStore = {
  terrainAssignments?: Record<string, TerrainSlots>;
  terrainStateVersion?: number;
  terrainCompatibility?: { strategy: 'saved-index-only'; historicalIdentityVerified: false };
};
const peek = (s: GameState) => (s as unknown as { modeState?: TerrainStore }).modeState;
const store = (s: GameState) => ((s as unknown as { modeState?: TerrainStore }).modeState ??= {});

/** Pure compatibility read. Saved indexes cannot prove a legacy array's historical slot identities. */
export function terrainSlots(s: GameState, locationId: string): TerrainSlots {
  const location = s.map.locations.find(l => l.id === locationId);
  const count = location?.terrainBonuses?.length ?? 0;
  const saved = peek(s)?.terrainAssignments?.[locationId];
  if ((!location && saved !== undefined) || saved === null) throw new Error(`Invalid terrain snapshot at ${locationId}; manual review required`);
  const raw = saved ?? [];
  if (!Array.isArray(raw) || raw.length > count || raw.some(id => id !== null &&
    (typeof id !== 'string' || !s.players.some(p => p.id === id)))) throw new Error(`Invalid terrain snapshot at ${locationId}; manual review required`);
  return Array.from({ length: count }, (_, i) => raw[i] ?? null);
}
export function occupiedTerrainSlots(s: GameState, locationId: string): TerrainSlots {
  return terrainSlots(s, locationId).map(id => id && s.players.some(p => p.id === id && p.status === 'active' && p.locationId === locationId) ? id : null);
}
export function terrainIndexes(s: GameState, playerId: string, locationId: string): number[] {
  return occupiedTerrainSlots(s, locationId).flatMap((id, i) => id === playerId ? [i] : []);
}
/** Validate everything before changing any state; never guess missing historical positions. */
export function normalizeTerrainState(s: GameState): void {
  const previous = peek(s);
  if (previous?.terrainStateVersion !== undefined && previous.terrainStateVersion !== 1) throw new Error('Unsupported terrain snapshot version');
  if (previous?.terrainAssignments !== undefined && (!previous.terrainAssignments ||
    typeof previous.terrainAssignments !== 'object' || Array.isArray(previous.terrainAssignments))) throw new Error('Invalid terrain snapshot assignments');
  const normalized = Object.fromEntries(Object.keys(previous?.terrainAssignments ?? {}).map(id => [id, occupiedTerrainSlots(s, id)]));
  const target = store(s);
  if (previous?.terrainStateVersion === undefined && Object.keys(normalized).length) {
    target.terrainCompatibility = { strategy: 'saved-index-only', historicalIdentityVerified: false };
  }
  target.terrainAssignments = normalized;
  target.terrainStateVersion = 1;
}
export function releaseTerrain(s: GameState, playerId: string): boolean {
  const assignments = peek(s)?.terrainAssignments;
  if (!assignments) return false;
  const changes = Object.keys(assignments).map(id => {
    const slots = terrainSlots(s, id);
    return { id, had: slots.includes(playerId), slots: slots.map(p => p === playerId ? null : p) };
  });
  for (const entry of changes) if (entry.had) assignments[entry.id] = entry.slots;
  return changes.some(entry => entry.had);
}
/** Ordinary deployment only: a future NP cannot use this to bypass its separate ruling. */
export function assignDeploymentTerrain(s: GameState, playerId: string, locationId: string, allowed: number[]): number | undefined {
  const slots = occupiedTerrainSlots(s, locationId);
  const values = s.map.locations.find(l => l.id === locationId)?.terrainBonuses ?? [];
  const existing = slots.indexOf(playerId);
  if (existing >= 0) return existing;
  const index = allowed.filter(i => Number.isInteger(i) && i >= 0 && i < slots.length && slots[i] === null)
    .sort((a, b) => values[b]! - values[a]! || a - b)[0];
  if (index === undefined) return undefined;
  slots[index] = playerId;
  normalizeTerrainState(s);
  store(s).terrainAssignments![locationId] = slots;
  return index;
}
export function resetTerrain(s: GameState): void {
  store(s).terrainAssignments = {};
  store(s).terrainStateVersion = 1;
}
