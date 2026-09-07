export type LocationId =
  | "miyama_town"
  | "shinto"
  | "magic_workshop"
  | "recon"
  | "moon_holy_grail";

export type OccupancyMode = "single" | "multi" | "policy_defined";
export type EventPolicy = "none" | "public" | "hidden" | "custom";

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
  tags: string[];
  rewardHooks: string[];
  visibilityHooks: string[];
}

export interface MapDefinition {
  id: string;
  playerCount: number;
  locations: LocationDefinition[];
}

export interface MatchLocationConfig {
  enabledLocationIds: LocationId[];
}

export type PlayerStatus = "active" | "eliminated";

export interface PlayerState {
  id: string;
  seat: number;
  status: PlayerStatus;
  masterCardId: string;
  servantCardId: string;
  vp: number;
  militaryResult: number;
  mana: number;
  eliminationOrder?: number;
}

export type PhaseName =
  | "round_start"
  | "preparation"
  | "advance"
  | "action"
  | "battle"
  | "cleanup"
  | "round_end";

export interface RoundState {
  roundNumber: number;
  activePhase: PhaseName;
  prioritySeat: number;
}

export interface CardInstance {
  id: string;
  name: string;
  cardType: string;
  visibility: "public" | "owner_only" | "hidden";
  revealed?: boolean;
}

export interface CombatModifierRule {
  source: string;
  targetTag: string;
  value: number;
}

export interface EffectStackItem {
  id: string;
  sourcePlayerId: string;
  effectType: string;
  triggeredAt: number;
  resolved: boolean;
}

export type VisibilityState = "public" | "owner_only" | "hidden";

export interface EventPlacementState {
  locationId: LocationId;
  eventCardId: string;
  visibility: VisibilityState;
  battleModifiers?: CombatModifierRule[];
}

export interface ScheduledSituationState {
  round: number;
  cardId: string;
  sharedManaReward?: number;
  modifiers?: CombatModifierRule[];
  notes?: string[];
}

export interface ScheduledEventDrawState {
  round: number;
  locationId: LocationId;
  eventCardId: string;
  modifiers?: CombatModifierRule[];
  notes?: string[];
}

export interface ContentRuntimeState {
  situations: ScheduledSituationState[];
  eventDraws: ScheduledEventDrawState[];
}

export interface GameLogEntry {
  type: string;
  message: string;
  payload?: Record<string, unknown>;
  timestamp?: number;
}

export interface BattleResultState {
  battlefieldId: LocationId;
  winnerPlayerIds: string[];
  tied: boolean;
  winnerPlayerId: string | null;
  margin: number;
  vpReward: number;
}

export interface PlayerScoringBreakdown {
  playerId: string;
  vpDelta: number;
  militaryDelta: number;
  eliminated: boolean;
  eliminationOrder?: number;
}

export interface GameState {
  id: string;
  players: PlayerState[];
  round: RoundState;
  map: MapDefinition;
  locationConfig: MatchLocationConfig;
  cards: CardInstance[];
  currentSituationCardId?: string;
  currentSituationModifiers?: CombatModifierRule[];
  eventPlacements: EventPlacementState[];
  contentRuntime?: ContentRuntimeState;
  battleResults: BattleResultState[];
  scoringBreakdown?: PlayerScoringBreakdown[];
  effectStack: EffectStackItem[];
  log: GameLogEntry[];
}

export interface MapBoardProps {
  map: MapDefinition;
  locationConfig: MatchLocationConfig;
  locationOccupancy: Record<LocationId, string[]>;
  activeBattlefield?: LocationId;
  showMoonHolyGrail?: boolean;
  debugMode?: boolean;
  onLocationSelect?: (locationId: LocationId) => void;
  selectedLocationId?: LocationId;
}

export interface PlayerSeatsProps {
  players: PlayerState[];
  currentPlayerId?: string;
  debugMode?: boolean;
  selectedPlayerId?: string;
  onPlayerSelect?: (playerId: string) => void;
}

export interface EventPanelProps {
  eventPlacements: EventPlacementState[];
  debugMode?: boolean;
}

export interface SituationPanelProps {
  currentSituationCardId?: string;
  currentSituationModifiers?: CombatModifierRule[];
}

export interface ContentSchedulePanelProps {
  currentRound: number;
  contentRuntime?: ContentRuntimeState;
}

export interface LogPanelProps {
  log: GameLogEntry[];
  filterPlayerId?: string;
  filterType?: string;
}

export interface PhaseIndicatorProps {
  activePhase: PhaseName;
  prioritySeat: number;
  roundNumber: number;
}

export interface MatchDebugProps {
  gameState: GameState;
  debugMode?: boolean;
  onPlayerSelect?: (playerId: string) => void;
  onLocationSelect?: (locationId: LocationId) => void;
  selectedLocationId?: LocationId;
  onAdvancePhase?: () => void;
  onReset?: () => void;
}
