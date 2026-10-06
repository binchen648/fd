import { getEnabledLocations } from '../core/map-engine';
import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

export const UNCLAIMED_BATTLEFIELD_TERRAIN_BONUS_EFFECT = 'unclaimed_battlefield_terrain_bonus' as const;
export const SAME_BATTLEFIELD_TERRAIN_UPKEEP_EFFECT = 'same_battlefield_opponent_terrain_upkeep' as const;

function rec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exact(value: unknown, keys: readonly string[]): boolean {
  if (!rec(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function empty(value: unknown): boolean {
  return rec(value) && Object.keys(value).length === 0;
}
function standard(a: AuthoringAbility): boolean {
  return a.conditions.length === 0 &&
    a.targets.length === 0 &&
    a.cost.length === 0 &&
    a.creates.length === 0 &&
    a.ruleModifiers.length === 0 &&
    empty(a.lifecycle) &&
    empty(a.limit) &&
    empty(a.visibility) &&
    exact(a.responseWindow, ['order', 'passBehavior']) &&
    a.responseWindow.order === 'turn_order' &&
    a.responseWindow.passBehavior === 'decline_this_window' &&
    a.execution.mode === 'automatic' &&
    Array.isArray(a.execution.allowedOperations) &&
    a.execution.allowedOperations.length === 0;
}
function bonusEffect(effect: RuleNode): boolean {
  return effect.type === UNCLAIMED_BATTLEFIELD_TERRAIN_BONUS_EFFECT &&
    exact(effect, ['type']);
}
function upkeepEffect(effect: RuleNode): boolean {
  return effect.type === SAME_BATTLEFIELD_TERRAIN_UPKEEP_EFFECT &&
    effect.victoryPointCost === 2 &&
    exact(effect, ['type', 'victoryPointCost']);
}

export function isAcceptedUnclaimedTerrainUpkeepAbility(a: AuthoringAbility): boolean {
  if (!standard(a) || a.kind !== 'passive' || !empty(a.activation) || a.effects.length !== 1) return false;
  return bonusEffect(a.effects[0]!) || upkeepEffect(a.effects[0]!);
}

export function containsUnclaimedTerrainUpkeepPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsUnclaimedTerrainUpkeepPrivilegedNode);
  if (!rec(value)) return false;
  if (value.type === UNCLAIMED_BATTLEFIELD_TERRAIN_BONUS_EFFECT ||
      value.type === SAME_BATTLEFIELD_TERRAIN_UPKEEP_EFFECT) return true;
  return Object.values(value).some(containsUnclaimedTerrainUpkeepPrivilegedNode);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('UNCLAIMED_TERRAIN_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function enabledLocation(state: GameState, locationId: string) {
  return getEnabledLocations(state.map, state.locationConfig).find((entry) => entry.id === locationId);
}
function isBattlefield(state: GameState, locationId: string): boolean {
  const location = enabledLocation(state, locationId);
  return !!location && (location.tags.includes('battlefield') || location.rewardHooks.includes('battle_rewards'));
}
function providerCards(
  state: GameState,
  playerId: string,
  effectType: typeof UNCLAIMED_BATTLEFIELD_TERRAIN_BONUS_EFFECT | typeof SAME_BATTLEFIELD_TERRAIN_UPKEEP_EFFECT,
): Array<{ sourceCardId: string; ability: AuthoringAbility }> {
  const out: Array<{ sourceCardId: string; ability: AuthoringAbility }> = [];
  for (const physical of state.cards) {
    if (physical.ownerPlayerId !== playerId || physical.controllerPlayerId !== playerId || physical.zone !== 'skill' ||
        runtime(state).cardState[physical.instanceId]?.faceDown === true) continue;
    const definition = runtime(state).pack.cards[physical.definitionId];
    if (!definition) continue;
    for (const ability of definition.abilities) {
      if (!isAcceptedUnclaimedTerrainUpkeepAbility(ability) || ability.effects[0]?.type !== effectType) continue;
      out.push({ sourceCardId: physical.instanceId, ability });
    }
  }
  return out;
}
function modeState(state: GameState): {
  terrainAssignments?: Record<string, string[]>;
  terrainAssignmentSlots?: Record<string, Record<string, number>>;
} {
  const carrier = state as unknown as {
    modeState?: {
      terrainAssignments?: Record<string, string[]>;
      terrainAssignmentSlots?: Record<string, Record<string, number>>;
    };
  };
  carrier.modeState ??= {};
  return carrier.modeState;
}
function assignedSlot(
  state: GameState,
  locationId: string,
  playerId: string,
  assigned = modeState(state).terrainAssignments?.[locationId] ?? [],
): number | undefined {
  const location = enabledLocation(state, locationId);
  const explicit = modeState(state).terrainAssignmentSlots?.[locationId]?.[playerId];
  if (Number.isSafeInteger(explicit) && Number(explicit) >= 0 && Number(explicit) < (location?.terrainBonuses?.length ?? 0)) {
    return Number(explicit);
  }
  const index = assigned.indexOf(playerId);
  return index >= 0 && index < (location?.terrainBonuses?.length ?? 0) ? index : undefined;
}
function occupiedTerrainSlots(state: GameState, locationId: string): Set<number> {
  const location = enabledLocation(state, locationId);
  const bonuses = location?.terrainBonuses ?? [];
  const used = new Set<number>();
  const assigned = modeState(state).terrainAssignments?.[locationId] ?? [];
  for (const playerId of assigned) {
    const player = state.players.find((entry) => entry.id === playerId && entry.status === 'active' && entry.locationId === locationId);
    if (!player) continue;
    const slot = assignedSlot(state, locationId, playerId, assigned);
    if (slot !== undefined) used.add(slot);
  }

  // Multi-presence deployment authority reserves the printed slot chosen at deployment.
  for (const presence of runtime(state).extraPlayerPresences ?? []) {
    if (presence.deployedAtLocationId !== locationId) continue;
    const slot = bonuses.findIndex((value, index) => !used.has(index) && value === presence.terrainAdvantage);
    if (slot >= 0) used.add(slot);
  }
  return used;
}

export function unclaimedBattlefieldTerrainBonus(
  state: GameState,
  playerId: string,
  locationId: string,
): number {
  const player = state.players.find((entry) => entry.id === playerId && entry.status === 'active');
  if (!player || player.locationId !== locationId || !isBattlefield(state, locationId)) return 0;
  if (providerCards(state, playerId, UNCLAIMED_BATTLEFIELD_TERRAIN_BONUS_EFFECT).length !== 1) return 0;
  const location = enabledLocation(state, locationId);
  const used = occupiedTerrainSlots(state, locationId);
  return (location?.terrainBonuses ?? []).reduce((sum, value, index) => sum + (used.has(index) ? 0 : Math.max(0, Number(value) || 0)), 0);
}

export function playerHasAssignedTerrain(state: GameState, playerId: string, locationId: string): boolean {
  const assigned = modeState(state).terrainAssignments?.[locationId] ?? [];
  return assigned.includes(playerId) && assignedSlot(state, locationId, playerId, assigned) !== undefined;
}

export function revokeAssignedTerrain(state: GameState, playerId: string, locationId: string): boolean {
  const mode = modeState(state);
  const assigned = mode.terrainAssignments?.[locationId] ?? [];
  const index = assigned.indexOf(playerId);
  if (index < 0) return false;

  const previousSlots = new Map<string, number>();
  for (const id of assigned) {
    const slot = assignedSlot(state, locationId, id, assigned);
    if (slot !== undefined) previousSlots.set(id, slot);
  }
  const retained = assigned.filter((id) => id !== playerId);
  mode.terrainAssignments ??= {};
  mode.terrainAssignmentSlots ??= {};
  if (retained.length === 0) {
    delete mode.terrainAssignments[locationId];
    delete mode.terrainAssignmentSlots[locationId];
    return true;
  }
  mode.terrainAssignments[locationId] = retained;
  mode.terrainAssignmentSlots[locationId] = Object.fromEntries(
    retained.flatMap((id) => previousSlots.has(id) ? [[id, previousSlots.get(id)!]] : []),
  );
  if (Object.keys(mode.terrainAssignmentSlots[locationId]!).length === 0) delete mode.terrainAssignmentSlots[locationId];
  return true;
}

export function settleSameBattlefieldTerrainUpkeepForPriorityPlayer(
  state: GameState,
  priorityPlayerId: string,
): number {
  if (state.round.activePhase !== 'action') return 0;
  const r = runtime(state);
  if (r.events.some((entry) =>
    entry.type === 'terrain_upkeep_turn_started' &&
    entry.playerId === priorityPlayerId &&
    entry.roundNumber === state.round.roundNumber)) return 0;
  r.events.push({ type: 'terrain_upkeep_turn_started', playerId: priorityPlayerId, roundNumber: state.round.roundNumber });
  const target = state.players.find((entry) => entry.id === priorityPlayerId && entry.status === 'active');
  if (!target?.locationId || !isBattlefield(state, target.locationId) ||
      !playerHasAssignedTerrain(state, target.id, target.locationId)) return 0;

  const providers = state.players
    .filter((entry) => entry.status === 'active' && entry.id !== target.id && entry.locationId === target.locationId)
    .flatMap((controller) => providerCards(state, controller.id, SAME_BATTLEFIELD_TERRAIN_UPKEEP_EFFECT)
      .map((provider) => ({ ...provider, controllerId: controller.id, controllerSeat: controller.seat })))
    .sort((left, right) => left.controllerSeat - right.controllerSeat || left.sourceCardId.localeCompare(right.sourceCardId));

  let resolved = 0;
  for (const provider of providers) {
    if (!target.locationId || !playerHasAssignedTerrain(state, target.id, target.locationId)) break;
    const effect = provider.ability.effects[0]!;
    if (!upkeepEffect(effect)) continue;
    const cost = Number(effect.victoryPointCost);
    if (target.vp >= cost) {
      const before = target.vp;
      target.vp -= cost;
      r.events.push({
        type: 'terrain_upkeep_victory_points_paid',
        playerId: target.id,
        controllerId: provider.controllerId,
        sourceCardId: provider.sourceCardId,
        abilityId: provider.ability.id,
        resource: 'victory_points',
        requestedDelta: -cost,
        delta: -cost,
        before,
        after: target.vp,
      });
    } else {
      const locationId = target.locationId;
      revokeAssignedTerrain(state, target.id, locationId);
      r.events.push({
        type: 'terrain_upkeep_assignment_released',
        playerId: target.id,
        controllerId: provider.controllerId,
        sourceCardId: provider.sourceCardId,
        abilityId: provider.ability.id,
        battlefieldId: locationId,
      });
    }
    resolved += 1;
  }
  return resolved;
}
