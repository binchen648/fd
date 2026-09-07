import type { RuleOverrideState } from "../schema/game";
import type {
  LocationDefinition,
  LocationId,
  MapDefinition,
  MatchLocationConfig,
} from "../schema/location";

export interface MovementCheckInput {
  map: MapDefinition;
  config: MatchLocationConfig;
  from: LocationId;
  to: LocationId;
  movingPlayerId?: string;
  occupyingPlayerIds?: string[];
  ruleOverrides?: RuleOverrideState;
}

export interface OccupancyCheckInput {
  map: MapDefinition;
  config: MatchLocationConfig;
  locationId: LocationId;
  movingPlayerId?: string;
  occupyingPlayerIds: string[];
  ruleOverrides?: RuleOverrideState;
}

export function getEnabledLocations(
  map: MapDefinition,
  config: MatchLocationConfig,
): LocationDefinition[] {
  return map.locations.filter(
    (location) =>
      location.enabledByDefault || config.enabledLocationIds.includes(location.id),
  );
}

export function getLocationById(
  map: MapDefinition,
  config: MatchLocationConfig,
  locationId: LocationId,
): LocationDefinition | undefined {
  return getEnabledLocations(map, config).find((location) => location.id === locationId);
}

export function canOccupyLocation(input: OccupancyCheckInput): boolean {
  const location = getLocationById(input.map, input.config, input.locationId);

  if (!location) {
    return false;
  }

  if (hasPlayerOverride(input.ruleOverrides?.ignoreOccupancyLimitPlayerIds, input.movingPlayerId)) {
    return true;
  }

  const occupancyLimit = getOccupancyLimit(location, input.locationId, input.ruleOverrides);

  if (occupancyLimit === null) {
    return true;
  }

  return input.occupyingPlayerIds.length < occupancyLimit;
}

export function canMoveToLocation(input: MovementCheckInput): boolean {
  const fromLocation = getLocationById(input.map, input.config, input.from);
  const toLocation = getLocationById(input.map, input.config, input.to);

  if (!fromLocation || !toLocation) {
    return false;
  }

  if (
    hasPlayerOverride(input.ruleOverrides?.engagedPlayerIds, input.movingPlayerId) &&
    !hasPlayerOverride(input.ruleOverrides?.ignoreEngagementForMovementPlayerIds, input.movingPlayerId)
  ) {
    return false;
  }

  if (
    !fromLocation.movementLinks.includes(toLocation.id) &&
    !hasPlayerOverride(input.ruleOverrides?.ignoreMovementLinkPlayerIds, input.movingPlayerId)
  ) {
    return false;
  }

  return canOccupyLocation({
    map: input.map,
    config: input.config,
    locationId: input.to,
    occupyingPlayerIds: input.occupyingPlayerIds ?? [],
    ...(input.movingPlayerId !== undefined ? { movingPlayerId: input.movingPlayerId } : {}),
    ...(input.ruleOverrides !== undefined ? { ruleOverrides: input.ruleOverrides } : {}),
  });
}

function getOccupancyLimit(
  location: LocationDefinition,
  locationId: LocationId,
  ruleOverrides?: RuleOverrideState,
): number | null {
  const overrideLimit = ruleOverrides?.occupancyLimitByLocation;
  if (overrideLimit && Object.prototype.hasOwnProperty.call(overrideLimit, locationId)) {
    return overrideLimit[locationId] ?? null;
  }

  switch (location.occupancyMode) {
    case "single":
      return 1;
    case "multi":
      return null;
    case "policy_defined":
      return location.occupancyLimit ?? null;
  }
}

function hasPlayerOverride(playerIds: string[] | undefined, playerId: string | undefined): boolean {
  return playerId !== undefined && playerIds?.includes(playerId) === true;
}
