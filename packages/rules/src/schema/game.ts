import type { CardInstance } from "./card";
import type { CombatModifierRule, EffectStackItem } from "./effect";
import type { LocationId, MatchLocationConfig, MapDefinition } from "./location";
import type { VisibilityState } from "./visibility";

export const playerStatuses = ["active", "eliminated"] as const;
export type PlayerStatus = (typeof playerStatuses)[number];

export const phaseNames = [
  "round_start",
  "preparation",
  "advance",
  "action",
  "battle",
  "cleanup",
  "round_end",
] as const;

export type PhaseName = (typeof phaseNames)[number];

export interface PlayerState {
  id: string;
  seat: number;
  status: PlayerStatus;
  masterCardId: string;
  servantCardId: string;
  locationId?: LocationId;
  vp: number;
  militaryResult: number;
  mana: number;
  eliminationOrder?: number;
}

export interface RoundState {
  roundNumber: number;
  activePhase: PhaseName;
  prioritySeat: number;
}

export interface GameLogEntry {
  type: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface EventPlacementState {
  locationId: LocationId;
  eventCardId: string;
  /** Stable server-owned source identity when this physical placement carries an executable event rule. */
  ruleInstanceId?: string;
  /** Optional explicit issuer/controller for owned event rules; neutral events leave this absent. */
  ruleControllerPlayerId?: string;
  /** Authoritative printed VP from the content layer; missing is unknown, never zero. */
  victoryPoints?: number;
  visibility: VisibilityState;
  battleModifiers?: CombatModifierRule[];
}

export interface EventDiscardState {
  eventCardId: string;
  locationId?: LocationId;
  ruleInstanceId?: string;
  ruleControllerPlayerId?: string;
  victoryPoints?: number;
  visibility: VisibilityState;
  battleModifiers?: CombatModifierRule[];
}

export interface BattleAdjustment {
  playerId: string;
  delta: number;
}

export type VpReasonSource = "battle_vp" | "location_vp" | "recon_vp" | "competition_vp";

export interface VpAdjustment {
  playerId: string;
  delta: number;
  source: VpReasonSource;
  label: string;
}

export interface BattleModifierBreakdown {
  source: "situation" | "event" | "location" | "skill";
  label: string;
  value: number;
  payload: BattleModifierPayload;
}

export interface BattleModifierPayload {
  kind: "modifier";
  sourceType: BattleModifierBreakdown["source"];
  sourceId: string;
  targetTag: string;
}

export interface ExternalSkillEffect {
  sourceCardDefinitionId: string;
  ownerPlayerId: string;
  skillId: string;
  combatModifiers?: CombatModifierRule[];
}

export interface BattleParticipantBreakdown {
  playerId: string;
  basePower: number;
  totalModifier: number;
  effectivePower: number;
  modifiers: BattleModifierBreakdown[];
}

export interface ScheduledSituationState {
  round: number;
  cardId: string;
  minimumRemainingPlayers?: number;
  sharedManaReward?: number;
  battleModifiers?: CombatModifierRule[];
  notes?: string[];
}

export interface ScheduledEventDrawState {
  round: number;
  locationId: LocationId;
  eventCardId: string;
  victoryPoints?: number;
  battleModifiers?: CombatModifierRule[];
  notes?: string[];
}

export interface ContentRuntimeState {
  situations: ScheduledSituationState[];
  eventDraws: ScheduledEventDrawState[];
}

export interface BattleDeclarationState {
  battlefieldId: LocationId;
}

export interface BattleResultState {
  battlefieldId: LocationId;
  winnerPlayerIds: string[];
  tied: boolean;
  excludedPlayerIds?: string[];
  /** Battle-local Presence Concealment defeats applied before winner/scoring settlement. */
  presenceConcealmentDefeatedPlayerIds?: string[];
  /** Participants who lost but whose battle-loss effects are suppressed for this result. */
  lossEffectSuppressedPlayerIds?: string[];
  winnerPlayerId: string | null;
  margin: number;
  vpReward: number;
  baseVpPerWinner?: number;
  eventVpPool?: number;
  competitionVpPool?: number;
  vpAdjustments?: VpAdjustment[];
  militaryAdjustments: BattleAdjustment[];
  participantBreakdowns: BattleParticipantBreakdown[];
}

export interface ScoringReasonBreakdown {
  source: VpReasonSource | "military_result" | "elimination";
  label: string;
  value: number;
}

export interface PlayerScoringBreakdown {
  playerId: string;
  vpDelta: number;
  militaryDelta: number;
  eliminated: boolean;
  eliminationOrder?: number;
  reasons: ScoringReasonBreakdown[];
}

export interface RuleOverrideState {
  occupancyLimitByLocation?: Partial<Record<LocationId, number | null>>;
  ignoreMovementLinkPlayerIds?: string[];
  reverseArrowMovementPlayerIds?: string[];
  ignoreOccupancyLimitPlayerIds?: string[];
  engagedPlayerIds?: string[];
  ignoreEngagementForMovementPlayerIds?: string[];
  mustDeployToBattlefieldPlayerIds?: string[];

  /** Typed Phase-3 game-start persistent rule overrides. Never an arbitrary string flag bag. */
  logicalDayByPlayer?: Record<string, number>;
  firstLogicalDayTotalPowerAdjustmentByPlayer?: Record<string, number>;
  nonClimaxSituationManaGainCapByPlayer?: Record<string, number>;
  movementLockedOwnActionCombatPlayerIds?: string[];
  roundTotalManaGainCapByPlayer?: Record<string, { regular: number; climax: number }>;
  lowerVpBattleTotalPowerAdjustmentByPlayer?: Record<string, number>;
  masterSkillPowerLockIfSituationForbidsByPlayer?: Record<string, { attribute: string; value: number }>;
  commandSpellPhaseOverrideByPlayer?: Record<string, PhaseName>;
  viewOpponentDiscardPlayerIds?: string[];
  extraAttackPlayAllowanceByManaByPlayer?: Record<string, { threshold: number; amount: number }>;
  viewFaceDownEventsPlayerIds?: string[];
  ignoreSituationPlayForbidAttributesByPlayer?: Record<string, string[]>;
  /** Current-round movement lock installed by a consumed Ruler Seal command. */
  rulerSealMovementLockRoundByPlayer?: Record<string, number>;
}

export interface GameState {
  abilityRuntime?: import('../ability/types').AbilityRuntime;
  id: string;
  players: PlayerState[];
  round: RoundState;
  map: MapDefinition;
  locationConfig: MatchLocationConfig;
  cards: CardInstance[];
  eventDeck?: string[];
  /** Explicit physical event definitions currently outside the game. Duplicates represent multiple copies. */
  eventOutsideGame?: string[];
  situationDeck?: string[];
  situationDiscardPile?: string[];
  burnedSituationCardIds?: string[];
  currentSituationCardId?: string;
  currentSituationModifiers?: CombatModifierRule[];
  eventPlacements: EventPlacementState[];
  /** Physical events removed by an ability, retained for later deck recycling. */
  eventDiscardPile?: EventDiscardState[];
  battleDeclarations?: BattleDeclarationState[];
  battleSkillEffects?: ExternalSkillEffect[];
  battleResults: BattleResultState[];
  contentRuntime?: ContentRuntimeState;
  scoringBreakdown?: PlayerScoringBreakdown[];
  ruleOverrides?: RuleOverrideState;
  effectStack: EffectStackItem[];
  log: GameLogEntry[];
}
