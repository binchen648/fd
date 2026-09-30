import type { GameState } from '../schema/game';
import { canOccupyLocation, getEnabledLocations } from './map-engine';

export interface AtomicRedeploymentSwapResult {
  swapped: boolean;
  leftPlayerId: string;
  rightPlayerId: string;
  leftFromLocationId?: string;
  rightFromLocationId?: string;
}

type TerrainAssignments = Record<string, string[]>;
type TerrainSlots = Record<string, Record<string, number>>;

function modeState(state: GameState): Record<string, unknown> {
  const carrier = state as unknown as { modeState?: Record<string, unknown> };
  carrier.modeState ??= {};
  return carrier.modeState;
}
function exactStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string') && new Set(value).size === value.length;
}
function finiteSlotMap(value: unknown): value is Record<string, number> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every((slot) => Number.isSafeInteger(slot) && Number(slot) >= 0);
}
function cloneTerrainAuthority(state: GameState): { assignments: TerrainAssignments; slots: TerrainSlots } | undefined {
  const mode = modeState(state);
  const rawAssignments = mode.terrainAssignments;
  const rawSlots = mode.terrainAssignmentSlots;
  if (rawAssignments !== undefined && (!rawAssignments || typeof rawAssignments !== 'object' || Array.isArray(rawAssignments))) return undefined;
  if (rawSlots !== undefined && (!rawSlots || typeof rawSlots !== 'object' || Array.isArray(rawSlots))) return undefined;
  const assignments: TerrainAssignments = {};
  for (const [locationId, assigned] of Object.entries((rawAssignments ?? {}) as Record<string, unknown>)) {
    if (!exactStringArray(assigned)) return undefined;
    assignments[locationId] = [...assigned];
  }
  const slots: TerrainSlots = {};
  for (const [locationId, rawMap] of Object.entries((rawSlots ?? {}) as Record<string, unknown>)) {
    if (!finiteSlotMap(rawMap)) return undefined;
    slots[locationId] = { ...rawMap };
  }
  return { assignments, slots };
}
function swapOccupantAtLocation(assignments: TerrainAssignments, slots: TerrainSlots, locationId: string, fromId: string, toId: string): boolean {
  const assigned = assignments[locationId];
  if (assigned) {
    const fromIndex = assigned.indexOf(fromId);
    if (fromIndex >= 0) {
      if (assigned.includes(toId)) return false;
      assigned[fromIndex] = toId;
    }
  }
  const slotMap = slots[locationId];
  if (slotMap && Object.prototype.hasOwnProperty.call(slotMap, fromId)) {
    if (Object.prototype.hasOwnProperty.call(slotMap, toId)) return false;
    const slot = slotMap[fromId]!;
    delete slotMap[fromId];
    slotMap[toId] = slot;
  }
  return true;
}

/**
 * Atomically exchanges two active players' current deployment positions.
 * Terrain occupancy/slot authority stays attached to the physical position: the incoming
 * player replaces the outgoing occupant at that location and inherits that exact slot.
 * No rewards/events are fabricated here; callers may layer ordinary deployment hooks only
 * after this transaction succeeds.
 */
export function swapActivePlayerDeploymentPositions(state: GameState, leftPlayerId: string, rightPlayerId: string): AtomicRedeploymentSwapResult | undefined {
  if (!leftPlayerId || !rightPlayerId || leftPlayerId === rightPlayerId) return undefined;
  const left = state.players.find((player) => player.id === leftPlayerId && player.status === 'active');
  const right = state.players.find((player) => player.id === rightPlayerId && player.status === 'active');
  if (!left || !right || !left.locationId || !right.locationId) return undefined;
  const leftFrom = left.locationId;
  const rightFrom = right.locationId;
  if (leftFrom === rightFrom) return { swapped: false, leftPlayerId, rightPlayerId, leftFromLocationId: leftFrom, rightFromLocationId: rightFrom };
  const enabled = new Set(getEnabledLocations(state.map, state.locationConfig).map((location) => location.id));
  if (!enabled.has(leftFrom) || !enabled.has(rightFrom)) return undefined;
  const activeAtLeft = state.players.filter((player) => player.status === 'active' && player.locationId === leftFrom && player.id !== leftPlayerId).map((player) => player.id);
  const activeAtRight = state.players.filter((player) => player.status === 'active' && player.locationId === rightFrom && player.id !== rightPlayerId).map((player) => player.id);
  if (!canOccupyLocation({ map: state.map, config: state.locationConfig, locationId: rightFrom as any, movingPlayerId: leftPlayerId,
        occupyingPlayerIds: activeAtRight, ...(state.ruleOverrides !== undefined ? { ruleOverrides: state.ruleOverrides } : {}) }) ||
      !canOccupyLocation({ map: state.map, config: state.locationConfig, locationId: leftFrom as any, movingPlayerId: rightPlayerId,
        occupyingPlayerIds: activeAtLeft, ...(state.ruleOverrides !== undefined ? { ruleOverrides: state.ruleOverrides } : {}) })) return undefined;

  const authority = cloneTerrainAuthority(state);
  if (!authority) return undefined;
  // Preflight all existing terrain occupant authority against current locations before any mutation.
  for (const [locationId, assigned] of Object.entries(authority.assignments)) {
    if (assigned.some((playerId) => state.players.find((player) => player.id === playerId && player.status === 'active')?.locationId !== locationId)) return undefined;
    const slotMap = authority.slots[locationId];
    if (slotMap && Object.keys(slotMap).some((playerId) => !assigned.includes(playerId))) return undefined;
  }
  if (Object.keys(authority.slots).some((locationId) => !authority.assignments[locationId])) return undefined;

  if (!swapOccupantAtLocation(authority.assignments, authority.slots, leftFrom, leftPlayerId, rightPlayerId)) return undefined;
  if (!swapOccupantAtLocation(authority.assignments, authority.slots, rightFrom, rightPlayerId, leftPlayerId)) return undefined;

  // Commit only after every endpoint/authority check and both replacement simulations pass.
  left.locationId = rightFrom;
  right.locationId = leftFrom;
  const mode = modeState(state);
  mode.terrainAssignments = authority.assignments;
  mode.terrainAssignmentSlots = authority.slots;
  return { swapped: true, leftPlayerId, rightPlayerId, leftFromLocationId: leftFrom, rightFromLocationId: rightFrom };
}
