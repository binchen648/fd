import type { CombatModifierRule } from "./effect";

export const locationIds = [
  "miyama_town",
  "shinto",
  "magic_workshop",
  "recon",
  "moon_holy_grail",
] as const;

export type LocationId = (typeof locationIds)[number];

export const occupancyModes = ["single", "multi", "policy_defined"] as const;
export type OccupancyMode = (typeof occupancyModes)[number];

export const eventPolicies = ["none", "public", "hidden", "custom"] as const;
export type EventPolicy = (typeof eventPolicies)[number];

export interface LocationVpRewardRules {
  battle?: number;
  location?: number;
  recon?: number;
  competition?: number;
}

export interface LocationDefinition {
  id: LocationId;
  displayName: string;
  enabledByDefault: boolean;
  optional: boolean;
  occupancyMode: OccupancyMode;
  occupancyLimit?: number;
  eventPolicy: EventPolicy;
  customEventCardIds?: string[];
  movementLinks: LocationId[];
  movementCost?: number;
  battleModifiers?: CombatModifierRule[];
  terrainBonuses?: number[];
  vpRewardRules?: LocationVpRewardRules;
  rewardHooks: string[];
  visibilityHooks: string[];
  tags: string[];
}

export interface MapDefinition {
  id: string;
  playerCount: number;
  locations: LocationDefinition[];
}

export interface MatchLocationConfig {
  enabledLocationIds: LocationId[];
}
