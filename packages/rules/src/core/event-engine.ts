import type { CombatModifierRule } from "../schema/effect";
import type { EventPlacementState } from "../schema/game";
import type { EventPolicy, LocationId } from "../schema/location";
import type { VisibilityState } from "../schema/visibility";

import { getLocationById } from "./map-engine";

export function getEventVisibilityForPolicy(policy: EventPolicy): VisibilityState {
  if (policy === "hidden") {
    return {
      scope: "hidden_until_trigger",
    };
  }

  return {
    scope: "public",
  };
}

export function createEventPlacement(
  locationId: LocationId,
  eventCardId: string,
  policy: EventPolicy,
  battleModifiers?: CombatModifierRule[],
  victoryPoints?: number,
): EventPlacementState {
  return {
    locationId,
    eventCardId,
    visibility: getEventVisibilityForPolicy(policy),
    ...(battleModifiers ? { battleModifiers } : {}),
    ...(victoryPoints !== undefined ? { victoryPoints } : {}),
  };
}

export interface RoundStartEventDraw {
  locationId: LocationId;
  eventCardId: string;
  victoryPoints?: number;
  battleModifiers?: CombatModifierRule[];
}

export function createRoundStartEventPlacements(
  state: Pick<EventPlacementState, never> & {
    map: Parameters<typeof getLocationById>[0];
    locationConfig: Parameters<typeof getLocationById>[1];
  },
  draws: RoundStartEventDraw[],
): EventPlacementState[] {
  const placements: EventPlacementState[] = [];

  for (const draw of draws) {
    const location = getLocationById(state.map, state.locationConfig, draw.locationId);

    if (!location || location.eventPolicy === "none") {
      continue;
    }

    if (location.eventPolicy === "custom") {
      if (!location.customEventCardIds?.includes(draw.eventCardId)) {
        continue;
      }

      placements.push(createEventPlacement(draw.locationId, draw.eventCardId, "public", draw.battleModifiers, draw.victoryPoints));
      continue;
    }

    placements.push(createEventPlacement(draw.locationId, draw.eventCardId, location.eventPolicy, draw.battleModifiers, draw.victoryPoints));
  }

  return placements;
}
