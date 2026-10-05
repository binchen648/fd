import type { GameState } from "../schema/game";
import type { ManaContributionChoice } from '../ability/types';
import type { LocationId, MapDefinition, MatchLocationConfig } from "../schema/location";

import { canOccupyLocation, getLocationById } from "./map-engine";
import { movementLockedByPersistentRule, resolveManaContributionPaymentPlan, rulerSealMovementLocked, spendMana } from "./rule-overrides";
import { applyLinkedRoleEntrySealCost, linkedRoleEntrySealAuthority } from '../ability/linked-role-core-capability';
import { effectiveLocationRestrictionBlocksMovement } from '../ability/effective-location-restriction-capability';
import { boundOpponentRoundMovementLocked } from '../ability/definition-resource-binding-capability';

const STARTING_LOCATION_BY_SEAT: Record<number, LocationId> = {
  1: "miyama_town",
  2: "shinto",
  3: "magic_workshop",
  4: "recon",
  5: "miyama_town",
  6: "shinto",
  7: "moon_holy_grail",
};

export interface MovementResult {
  nextState: GameState;
  placedPlayerIds: string[];
}

export interface MovePlayerInput {
  playerId: string;
  to: LocationId;
  movementKind: "normal" | "effect";
  /** Explicit trusted exception for an already-authorized effect that ignores card movement restrictions. */
  ignoreCardMovementRestrictions?: boolean;
  /** Explicit server-validated linked mana contribution choices for this positive movement payment. */
  manaContributions?: ManaContributionChoice[];
}

export interface MovePlayerResult extends MovementResult {
  moved: boolean;
  manaSpent: number;
  reason?:
    | "player_not_found"
    | "inactive"
    | "no_location"
    | "not_in_action_phase"
    | "engaged"
    | "movement_locked"
    | "invalid_path"
    | "insufficient_mana"
    | "insufficient_command_seals"
    | "destination_blocked";
}

export function assignInitialPlayerLocations(state: GameState): MovementResult {
  const placedPlayerIds: string[] = [];

  const nextState: GameState = {
    ...state,
    players: state.players.map((player) => {
      if (player.status !== "active") {
        return player;
      }

      const targetLocation = STARTING_LOCATION_BY_SEAT[player.seat];
      if (!targetLocation) {
        return player;
      }

      placedPlayerIds.push(player.id);

      return {
        ...player,
        locationId: targetLocation,
      };
    }),
    log: state.log.concat(
      placedPlayerIds.map((playerId) => ({
        type: "movement",
        message: `player:${playerId}:initial_placement`,
      })),
    ),
  };

  return {
    nextState,
    placedPlayerIds,
  };
}

export function movePlayer(state: GameState, input: MovePlayerInput): MovePlayerResult {
  const player = state.players.find((entry) => entry.id === input.playerId);
  if (!player) {
    return failure(state, "player_not_found");
  }

  if (player.status !== "active") {
    return failure(state, "inactive");
  }

  if (!player.locationId) {
    return failure(state, "no_location");
  }

  if (input.movementKind === "normal" && state.round.activePhase !== "action") {
    return failure(state, "not_in_action_phase");
  }

  if ((movementLockedByPersistentRule(state, player.id) || rulerSealMovementLocked(state, player.id) || effectiveLocationRestrictionBlocksMovement(state, player.id) ||
      (input.movementKind === "normal" && boundOpponentRoundMovementLocked(state, player.id))) && input.ignoreCardMovementRestrictions !== true) {
    return failure(state, "movement_locked");
  }
  if (input.movementKind === "normal" && isPlayerEngaged(state, player.id)) {
    return failure(state, "engaged");
  }

  const path = findMovementPath(state.map, state.locationConfig, player.locationId, input.to);
  if (!path) {
    return failure(state, "invalid_path");
  }

  const manaSpent = input.movementKind === "normal"
    ? calculateMovementCost(state.map, state.locationConfig, path)
    : 0;

  let paymentPlan: ReturnType<typeof resolveManaContributionPaymentPlan> | undefined;
  if (input.movementKind === "normal" && manaSpent > 0) {
    try { paymentPlan = resolveManaContributionPaymentPlan(state, player.id, manaSpent, input.manaContributions); }
    catch { return failure(state, "insufficient_mana"); }
  } else if (input.manaContributions?.length) return failure(state, "insufficient_mana");
  const entrySealAuthority = input.movementKind === "normal" ? linkedRoleEntrySealAuthority(state, player.id, input.to) : undefined;
  if (entrySealAuthority) {
    const available = Number((player as typeof player & { commandSpells?: number }).commandSpells ?? 3);
    if (!Number.isSafeInteger(available) || available < entrySealAuthority.cost) return failure(state, "insufficient_command_seals");
  }

  const occupyingPlayerIds = state.players
    .filter((entry) => entry.id !== player.id && entry.status === "active" && entry.locationId === input.to)
    .map((entry) => entry.id);

  const occupancyAllowed = canOccupyLocation({
    map: state.map,
    config: state.locationConfig,
    locationId: input.to,
    movingPlayerId: input.playerId,
    occupyingPlayerIds,
    ...(state.ruleOverrides ? { ruleOverrides: state.ruleOverrides } : {}),
  });

  if (!occupancyAllowed) {
    return failure(state, "destination_blocked");
  }

  let nextState: GameState = {
    ...state,
    players: state.players.map((entry) =>
      entry.id === input.playerId
        ? {
            ...entry,
            locationId: input.to,
            mana: entry.mana,
          }
        : entry,
    ),
    log: state.log.concat({
      type: "movement",
      message: `player:${input.playerId}:${input.movementKind}_move:${player.locationId}->${input.to}`,
      payload: {
        playerId: input.playerId,
        from: player.locationId,
        to: input.to,
        movementKind: input.movementKind,
        manaSpent,
      },
    }),
  };
  if (manaSpent > 0 || entrySealAuthority) {
    // `movePlayer` is a pure reducer. Payment observers and linked-role seal tax can mutate
    // runtime/player ledgers, so detach every mutable branch they may touch first.
    nextState = {
      ...nextState,
      players: nextState.players.map((entry) => ({ ...entry })),
      ...(nextState.abilityRuntime ? { abilityRuntime: structuredClone(nextState.abilityRuntime) } : {}),
    };
    // Both costs settle while the entrant is still at the authoritative origin.
    const movedPlayer = nextState.players.find((entry) => entry.id === input.playerId)!;
    const destination = movedPlayer.locationId;
    const origin = player.locationId;
    movedPlayer.locationId = origin;
    if (entrySealAuthority) applyLinkedRoleEntrySealCost(nextState, input.playerId, input.to);
    if (manaSpent > 0) spendMana(nextState, input.playerId, manaSpent, input.manaContributions);
    if (destination) movedPlayer.locationId = destination;
  }

  return {
    nextState,
    placedPlayerIds: [input.playerId],
    moved: true,
    manaSpent,
  };
}

export function assignPlayerLocation(
  state: GameState,
  playerId: string,
  locationId: LocationId,
): MovementResult {
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return {
      nextState: state,
      placedPlayerIds: [],
    };
  }

  if (player.status !== "active") {
    return {
      nextState: state,
      placedPlayerIds: [],
    };
  }

  const nextState: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            locationId,
          }
        : p,
    ),
    log: state.log.concat({
      type: "movement",
      message: `player:${playerId}:moved_to:${locationId}`,
    }),
  };

  return {
    nextState,
    placedPlayerIds: [playerId],
  };
}

export function clearPlayerLocation(
  state: GameState,
  playerId: string,
): MovementResult {
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return {
      nextState: state,
      placedPlayerIds: [],
    };
  }

  const { locationId: _, ...playerWithoutLocation } = player;
  const nextState: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? playerWithoutLocation : p,
    ),
    log: state.log.concat({
      type: "movement",
      message: `player:${playerId}:left_location`,
    }),
  };

  return {
    nextState,
    placedPlayerIds: [playerId],
  };
}

function failure(state: GameState, reason: MovePlayerResult["reason"]): MovePlayerResult {
  return {
    nextState: state,
    placedPlayerIds: [],
    moved: false,
    manaSpent: 0,
    ...(reason ? { reason } : {}),
  };
}

function isPlayerEngaged(state: GameState, playerId: string): boolean {
  if (state.ruleOverrides?.ignoreEngagementForMovementPlayerIds?.includes(playerId)) {
    return false;
  }

  if (state.ruleOverrides?.engagedPlayerIds?.includes(playerId)) {
    return true;
  }

  const player = state.players.find((entry) => entry.id === playerId);
  if (!player?.locationId) {
    return false;
  }

  const location = getLocationById(state.map, state.locationConfig, player.locationId);
  if (!location?.tags.includes("battlefield")) {
    return false;
  }

  return state.players.some(
    (entry) =>
      entry.id !== playerId &&
      entry.status === "active" &&
      entry.locationId === player.locationId,
  );
}

function findMovementPath(
  map: MapDefinition,
  config: MatchLocationConfig,
  from: LocationId,
  to: LocationId,
): LocationId[] | null {
  if (from === to) {
    return [from];
  }

  const queue: LocationId[][] = [[from]];
  const visited = new Set<LocationId>([from]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) {
      continue;
    }

    const current = path[path.length - 1];
    if (!current) {
      continue;
    }

    const location = getLocationById(map, config, current);
    if (!location) {
      continue;
    }

    for (const next of location.movementLinks) {
      if (visited.has(next)) {
        continue;
      }

      const nextPath = path.concat(next);
      if (next === to) {
        return nextPath;
      }

      visited.add(next);
      queue.push(nextPath);
    }
  }

  return null;
}

function calculateMovementCost(
  map: MapDefinition,
  config: MatchLocationConfig,
  path: LocationId[],
): number {
  return path.slice(1).reduce((sum, locationId) => {
    const location = getLocationById(map, config, locationId);
    return sum + (location?.movementCost ?? 0);
  }, 0);
}
