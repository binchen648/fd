import type { PhaseName } from '../schema/game';

export type PlayerId = string;
/** Raw JSON nodes are inspected by the loader, never evaluated as executable text. */
export type RuleNode = Record<string, unknown>;
export type Formula = number | { op: 'const'; value: number } | { var: string } |
  { op: 'add' | 'multiply' | 'min' | 'gt' | 'lte'; args: Formula[] } |
  { op: 'count_cards'; zone: string; owner: 'controller'; constraints: RuleNode[] };
export interface CalculationLine { label: string; value: number }
export type ExecutionMode = 'automatic' | 'host_adjudicated' | 'unsupported' | 'text_unconfirmed';
export const hostOperations = ['adjust-mana', 'adjust-victory-points', 'move-card', 'create-status', 'skip-ability'] as const;
export type HostOperation = typeof hostOperations[number];
export interface AdapterReportEntry {
  cardId: string; abilityId?: string; path: string; status: ExecutionMode;
  reason: string; suggestedImplementation: string;
}
export interface AuthoringAbility {
  id: string; kind: string; printedClause: string; activation: RuleNode;
  conditions: RuleNode[]; targets: RuleNode[]; effects: RuleNode[]; cost: RuleNode[];
  ruleModifiers: RuleNode[]; creates: RuleNode[]; lifecycle: RuleNode;
  responseWindow: RuleNode; limit: RuleNode; visibility: RuleNode;
  execution: { mode: ExecutionMode; allowedOperations: HostOperation[] };
}
export interface AuthoringCard {
  id: string; name: string; cardType: string; cardFace: RuleNode;
  playTiming: RuleNode; playRequirements: RuleNode[]; abilities: AuthoringAbility[];
  initialPlacement?: 'outside_game';
  mode: ExecutionMode;
}
export interface ExecutableCardDefinition extends AuthoringCard {
  ownerId?: string;
  playKind: CardPlayKind;
  destinationZone: 'attack_area' | 'field';
  initialZone?: 'skill';
}
export interface ExecutableCharacterDefinition {
  id: string;
  name: string;
  class?: string;
  kind: 'master' | 'servant';
  cardIds: string[];
  publicInformation: RuleNode;
  excludedCards?: Array<{ id: string; name: string; reason?: string }>;
}
export interface ServantPackage {
  id: string; name: string; class: string; publicInformation: RuleNode;
  skillCards: { id: string; name: string; printedText: string; cardFace: RuleNode }[];
  knownCardDefinitions: { id: string; name: string; printedText: string; cardFace: RuleNode }[];
}
export interface AbilityDefinitionPack {
  cards: Record<string, AuthoringCard>;
  schemaVersion?: string;
  characters?: Record<string, ExecutableCharacterDefinition>;
  servantPackage?: ServantPackage;
  contentIdentity?: { packId: string; version: number; definitionHash: string };
}
export interface AuthoringPack extends AbilityDefinitionPack {
  servantPackage: ServantPackage;
  report: AdapterReportEntry[];
}
export type PlayRulesVersion = 'legacy-v0' | 'explicit-v1';
export type CardPlayKind = 'attack' | 'support';
export interface CardPlayClassification {
  playKind: CardPlayKind;
  destinationZone: 'attack_area' | 'field';
}
export interface RoundPlayCounters {
  round: number;
  cardsPlayedByPlayer: Record<PlayerId, number>;
  attacksDeclaredByPlayer: Record<PlayerId, number>;
}
export interface BattleResultData { winners: PlayerId[]; loserIds: PlayerId[] }
export interface BattleResult extends BattleResultData { didWin(playerId: PlayerId): boolean; isSoleWinner(playerId: PlayerId): boolean }
export interface AbilityEvent {
  id: string; type: string; playerId?: PlayerId; sourceCardId?: string; battleResult?: BattleResultData;
  /** Server-owned battle identity facts for battle-derived trigger events. */
  battlePhaseResolutionId?: string;
  battleId?: string;
  resultId?: string;
  battleIds?: string[];
  resultIds?: string[];
  scoringReceiptIds?: string[];
  battleParticipantIds?: PlayerId[];
  /** Trusted frozen effective-Power snapshot for the exact pre-scoring battle response gateway. */
  battleParticipantPowers?: Record<PlayerId, number>;
  /** Frozen phase-terminal battle outcome facts used by exact terminal consumers. */
  battleOutcomes?: Array<{ battlefieldId: string; winnerPlayerIds: PlayerId[] }>;
  battlefieldId?: string;
  lossOrdinal?: number;
  /** Trusted backend snapshot of the simultaneous play batch, never a client-supplied condition. */
  playedCards?: { instanceId: string; controllerId: string; cardType: string; faceDown: boolean }[];
  revealedKind?: 'situation' | 'event';
  revealedId?: string;
  locationId?: string;
}
export interface TriggeredAbility { cardInstanceId: string; abilityId: string; controllerId: PlayerId }
export interface UniqueTriggerGroup { groupId: string; policy: 'only_one_effect_may_activate_per_window' }
export interface ResponseWindow {
  id: string; kind: 'choose_unique_trigger' | 'response'; opens: string;
  controllerId: PlayerId; choices: TriggeredAbility[]; group?: UniqueTriggerGroup;
  event: AbilityEvent; passBehavior: 'decline_this_window'; order: 'turn_order';
}
export interface RuleModifier { sourceCardId: string; controllerId: PlayerId; definition: RuleNode }
export interface OngoingEffect {
  id: string; sourceCardId: string; abilityId: string; controllerId: PlayerId;
  starts: 'immediate'; duration: string; startRound: number; expiresAtRound?: number;
  cleanup: string; ruleModifiers: RuleModifier[]; publicZones: string[]; sourceMustRemainActive?: boolean;
  policyKey?: string; sourceDefinitionIdAtInstall?: string; sourceValidityPolicyId?: string; installedRevision?: number;
}
export interface LifecycleTransition {
  transitionId: string; lifecycleId: string; kind: 'install' | 'source_invalidated';
  causationId: string; createdRevision: number; roundId: number;
}
export interface EffectContext {
  controllerId: PlayerId; sourceCardId: string; abilityId: string;
  variables: Record<string, number>; selections: Record<string, string[]>;
  event?: AbilityEvent;
}
export interface PrivateOptionalHandPlayInteractionMetadata {
  kind: 'private_optional_hand_play_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  constraints: { kind: 'target'; targetKind: 'card'; min: number; max: number; distinct: true };
}
export interface AlterEgoAttributeChoiceInteractionMetadata {
  kind: 'alter_ego_attribute_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  triggerEventId: string; targetCardInstanceId: string; variant: 'regular' | 'ex';
  constraints: { kind: 'target'; targetKind: 'attribute'; min: 0; max: 3; distinct: true };
}
export interface SameBattlefieldPrivateHandReturnInteractionMetadata {
  kind: 'same_battlefield_private_hand_return_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  playerTargetId: string; selectedPlayerId: PlayerId;
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: 1; distinct: true };
}
export interface RulerSealMoveInteractionMetadata {
  kind: 'ruler_seal_move_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  sealId: string; issuerPlayerId: PlayerId; boundPlayerId: PlayerId; destinations: string[];
  constraints: { kind: 'target'; targetKind: 'location'; min: 1; max: 1; distinct: true };
}
export interface RulerSealFreePlayInteractionMetadata {
  kind: 'ruler_seal_free_play_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  sealId: string; issuerPlayerId: PlayerId; boundPlayerId: PlayerId; rewardVp: number;
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: 1; distinct: true };
}
export type PendingInteractionMetadata =
  PrivateOptionalHandPlayInteractionMetadata | AlterEgoAttributeChoiceInteractionMetadata | SameBattlefieldPrivateHandReturnInteractionMetadata |
  RulerSealMoveInteractionMetadata | RulerSealFreePlayInteractionMetadata;
export interface PendingDecision {
  id: string; controllerId: PlayerId; target: RuleNode; candidates: string[];
  min: number; max: number; context: EffectContext; remainingEffects: RuleNode[];
  interaction?: PendingInteractionMetadata;
}
export interface PendingPresenceConcealmentDefeat {
  controllerId: PlayerId; sourceCardId: string; abilityId: string; triggerEventId: string;
  resultId: string; battlefieldId: string; participantIds: PlayerId[]; participantPowers: Record<PlayerId, number>; targetPlayerIds: PlayerId[];
}
export interface PendingDelayedActivation {
  controllerId: PlayerId;
  sourceCardId: string;
  abilityId: string;
  definitionId: string;
  triggerEventId: string;
  round: number;
}
export type AbilityInteractionKind =
  'phase_activation' |
  'response_window' |
  'automatic_trigger' |
  'automatic_rule' |
  'host_directive' |
  'unsupported';
export interface AbilityInteractionClassification {
  kind: AbilityInteractionKind;
  phase?: 'preparation' | 'advance' | 'action' | 'combat';
  window?: string;
  trigger?: string;
  commandType?: 'activate_ability' | 'resolve_response';
  reason?: string;
}
export interface SafeEvent {
  type: string;
  playerId?: PlayerId;
  sourceCardId?: string;
  abilityId?: string;
  unpreventable?: boolean;
  visibility?: PlayerId;
  sourceAbilityId?: string;
  controllerId?: PlayerId;
  resource?: 'mana' | 'command_seals' | 'victory_points';
  delta?: number;
  before?: number;
  after?: number;
  requestedDelta?: number;
  qualifyingPlayerIds?: PlayerId[];
  battlePhaseResolutionId?: string;
  battleId?: string;
  battlefieldId?: string;
  rewardBranch?: 'mana' | 'victory_points';
  resultId?: string;
  triggerEventId?: string;
  fromState?: string;
  toState?: string;
  revision?: number;
  cardInstanceId?: string;
  fromZone?: string;
  toZone?: string;
  movedCount?: number;
}
export interface CardRuntimeState {
  active: boolean; faceDown: boolean; playedRound: number;
  reversed?: boolean; attributeOverrides?: string[];
}
export interface RulerSealBinding {
  id: string; issuerPlayerId: PlayerId; boundPlayerId: PlayerId; sourceCardId: string; abilityId: string;
  grantedRound: number; spent: boolean; spentRound?: number;
}
export interface PendingRulerSealReward {
  sealId: string; issuerPlayerId: PlayerId; boundPlayerId: PlayerId; sourceCardId: string; abilityId: string;
  round: number; rewardVp: number;
}
export interface AbilityRuntime {
  pack: AbilityDefinitionPack; revision: number; sequence: number; randomState: number;
  cardState: Record<string, CardRuntimeState>;
  ongoingEffects: OngoingEffect[]; lifecycleTransitions?: LifecycleTransition[]; responseWindows: ResponseWindow[]; pendingDecision?: PendingDecision;
  pendingDelayedActivations?: PendingDelayedActivation[];
  /** Server-owned pre-scoring battle-local defeat requests staged by the exact Presence Concealment response. */
  pendingPresenceConcealmentDefeats?: PendingPresenceConcealmentDefeat[];
  /** Server-owned post-scoring battle events waiting for Trigger Gateway settlement. */
  pendingPostBattleEvents?: AbilityEvent[];
  /** Server-owned once-per-battle-phase terminal event, staged until ordinary post-battle work is settled. */
  pendingBattleTerminalEvent?: AbilityEvent;
  /** Source-bound state for the exact Soul Drag -> Return Silence transform family. */
  transformedReturnSilenceSourceCardIds?: string[];
  /** FB2-27 identity-free Ruler issuer -> bound-player relationship state. */
  rulerSealBindings: RulerSealBinding[];
  /** Game-long bind counts scoped by issuer; spending a seal never decrements this history. */
  rulerSealBindingHistory: Record<PlayerId, Record<PlayerId, number>>;
  /** One-shot delayed rewards armed by the free-play Ruler seal branch. */
  pendingRulerSealRewards: PendingRulerSealReward[];
  usedAbilities: Record<string, number>; processedEvents: string[]; revealedServants: PlayerId[];
  events: SafeEvent[]; calculations: { controllerId: PlayerId; lines: CalculationLine[] }[];
  preventEffects: boolean; manaCaps: Record<PlayerId, number>; manaGainBlocked: PlayerId[];
  hostRequests: { controllerId: PlayerId; sourceCardId: string; abilityId: string; allowedOperations: HostOperation[] }[];
  roomMode: 'standard' | 'development';
  // Usage tracking for per-game limits
  abilityUsage: Record<string, number>;
  // Noble Phantasm cost tracking for this round
  noblePhantasmCostsThisRound: Record<PlayerId, Array<{ cardId: string; cost: number }>>;
  // Consecutive play round tracking for cards
  consecutivePlayRounds: Record<string, number>;
  movementDistanceThisRound: Record<PlayerId, number>;
  battlefieldsPassedOrStayedThisRound: Record<PlayerId, number>;
  /** Successful positive mana gained in the current authoritative round. */
  manaGainedThisRound: { round: number; byPlayer: Record<PlayerId, number> };
  playRulesVersion: PlayRulesVersion;
  playCounters: RoundPlayCounters;
}
export interface PlayCardAction { type: 'play_card'; cardInstanceId: string; faceDown?: boolean }
export interface StageAttackCardAction { type: 'stage_attack_card'; cardInstanceId: string; faceDown?: boolean }
export interface ConfirmStagedAttackAction { type: 'confirm_staged_attack' }
export interface CancelStagedAttackAction { type: 'cancel_staged_attack' }
export interface ActivateAbilityAction { type: 'activate_ability'; cardInstanceId: string; abilityId: string; variableCosts?: { name: string; min: number; max: number }[] }
export interface ChooseTargetAction { type: 'choose_target'; decisionId: string; candidates: string[]; min: number; max: number }
export interface ResolveResponseAction { type: 'resolve_response'; windowId: string; cardInstanceId: string; abilityId: string }
export interface DeclineWindowAction { type: 'decline_this_window'; windowId: string }
export interface DeployPlayerAction { type: 'deploy_player'; locationId: string }
export type LegalAction = PlayCardAction | StageAttackCardAction | ConfirmStagedAttackAction | CancelStagedAttackAction |
  ActivateAbilityAction | ChooseTargetAction | ResolveResponseAction | DeclineWindowAction | DeployPlayerAction;
export type AbilityCommand = PlayCardAction | (ActivateAbilityAction & { variables?: Record<string, number> }) |
  { type: 'choose_target'; decisionId: string; selectedIds: string[] } | ResolveResponseAction | DeclineWindowAction |
  { type: 'pass'; windowId: string } | DeployPlayerAction | StageAttackCardAction | ConfirmStagedAttackAction | CancelStagedAttackAction;
export interface AbilityPlayerView {
  revision: number; phase: PhaseName; round: number; legalActions: LegalAction[];
  players: { id: PlayerId; seat: number; mana: number; vp: number; commandSpells?: number; locationId?: string; masterCardId: string; handCount: number; deckCount: number; servantPackage?: ServantPackage }[];
  cards: { instanceId: string; definitionId?: string; ownerPlayerId: PlayerId; zone: string; faceDown?: boolean; reversed?: boolean; attributeOverrides?: string[] }[];
  stagedAttacks?: { playerId: PlayerId; cards: PlayCardAction[] }[];
  pendingDecision?: {
    id: string; candidates: string[]; min: number; max: number;
    template?: 'target'; sourceCardInstanceId?: string; abilityId?: string; createdRevision?: number;
    visibility?: 'owner_only'; cancelPolicy?: 'forbidden';
  };
  responseWindow?: { id: string; kind: string; opens: string };
  waitingLabel?: string;
  /** Owner-only diagnostics. Clients must not use these reasons as rule authority. */
  playDiagnostics?: {
    cardInstanceId: string;
    faceDown: boolean;
    playKind: CardPlayKind;
    destinationZone: 'attack_area' | 'field';
    reasonCode?: string;
  }[];
  playSummary?: {
    cardsPlayedThisRound: number;
    attacksDeclaredThisRound: number;
    attackAreaOccupancy: number;
    attackAllowance: number;
  };
}
/** Only this projection crosses the transport boundary; authority is owned by the server session. */
export interface DispatchResult {
  ok: boolean; view: AbilityPlayerView; events: SafeEvent[]; calculations: CalculationLine[];
  rejection?: { code: string; message: string; allowedOperations?: HostOperation[] };
}
