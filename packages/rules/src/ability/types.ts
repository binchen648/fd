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
  id: string; kind: string; printedClause: string; markers?: string[]; activation: RuleNode;
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
  /** Trusted movement provenance for location-enter events. */
  previousLocationId?: string;
  movementKind?: 'normal' | 'effect';
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
export interface ManaContributionChoice { contributorPlayerId: PlayerId; amount: number; sourceCardInstanceId?: string }
export interface EffectContext {
  controllerId: PlayerId; sourceCardId: string; abilityId: string;
  variables: Record<string, number>; selections: Record<string, string[]>;
  /** Server-owned selected physical presence location for one location/battle-related ability transaction. */
  resolutionLocationId?: string;
  manaContributions?: ManaContributionChoice[];
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
export interface OpponentCloseToOneInteractionMetadata {
  kind: 'opponent_close_non_residual_to_one_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  initiatingControllerId: PlayerId; decisionPlayerId: PlayerId; battlefieldId: string; qualifyingCardIds: string[];
  qualifyingCardOwners: Record<string, PlayerId>; remainingDecisionPlayerIds: PlayerId[];
  constraints: { kind: 'target'; targetKind: 'card'; min: 1; max: 1; distinct: true };
}
export interface PendingOpponentCloseToOne {
  initiatingControllerId: PlayerId; decisionPlayerId: PlayerId; sourceCardId: string; abilityId: string;
  battlefieldId: string; qualifyingCardIds: string[]; qualifyingCardOwners: Record<string, PlayerId>;
  remainingDecisionPlayerIds: PlayerId[];
}
export interface OpponentCloseSelectedOneInteractionMetadata {
  kind: 'opponent_close_selected_one_non_residual_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  initiatingControllerId: PlayerId; decisionPlayerId: PlayerId; battlefieldId: string;
  candidateIds: string[]; candidateOwners: Record<string, PlayerId>;
  constraints: { kind: 'target'; targetKind: 'card'; min: 1; max: 1; distinct: true };
}
export interface DeductionRecordChoiceInteractionMetadata {
  kind: 'deduction_record_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  optional: boolean; definitionByAttribute: Record<string, string>;
  constraints: { kind: 'target'; targetKind: 'attribute'; min: 0 | 1; max: 1; distinct: true };
}
export interface PostDrawHandShuffleInteractionMetadata {
  kind: 'post_draw_hand_shuffle_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  constraints: { kind: 'target'; targetKind: 'card'; min: 2; max: 2; distinct: true };
}
export interface DiscardShuffleSourceXInteractionMetadata {
  kind: 'discard_shuffle_source_x_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; candidateIds: string[]; base: 2;
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: number; distinct: true };
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
export interface OwnedRulerSealPowerInteractionMetadata {
  kind: 'owned_ruler_seal_power_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  issuerPlayerId: PlayerId; sealIds: string[]; amount: 4;
  constraints: { kind: 'target'; targetKind: 'ruler_seal'; min: 1; max: 1; distinct: true };
}
export interface CombatOpponentPowerVpRewardInteractionMetadata {
  kind: 'combat_opponent_power_vp_reward_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string; triggerEventId: string;
  battlePhaseResolutionId: string; battleId: string; resultId: string; battlefieldId: string;
  participantIds: PlayerId[]; participantPowers: Record<PlayerId, number>; opponentIds: PlayerId[]; divisor: 5;
  constraints: { kind: 'target'; targetKind: 'player'; min: 1; max: 1; distinct: true };
}
export interface PendingCombatOpponentPowerVpReward {
  controllerId: PlayerId; sourceCardId: string; abilityId: string; triggerEventId: string;
  battlePhaseResolutionId: string; battleId: string; resultId: string; battlefieldId: string;
  participantIds: PlayerId[]; participantPowers: Record<PlayerId, number>; opponentIds: PlayerId[];
}
export interface DeductionRecordState { definitionId: string; attribute: '力量' | '迅捷' | '魔术' | '特殊'; recordedRound: number }
export interface AutomaticRecycleKeepInteractionMetadata {
  kind: 'automatic_recycle_keep_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; counterKey: string; candidateIds: string[]; keepMax: 3; gain: 1; remainingDraws: number;
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: number; distinct: true };
}
export interface CounterSpendChoiceInteractionMetadata {
  kind: 'counter_spend_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; counterKey: string; maxSpend: 2; baseCount: 3; options: string[];
  constraints: { kind: 'target'; targetKind: 'choice'; min: 1; max: 1; distinct: true };
}
export interface DiscardBasicReplayChoiceInteractionMetadata {
  kind: 'discard_basic_replay_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; counterKey: string; counterSpent: number; baseCount: 3; candidateIds: string[];
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: number; distinct: true };
}
export interface SealedCardChoiceInteractionMetadata {
  kind: 'sealed_card_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; sealKey: string; candidateIds: string[];
  constraints: { kind: 'target'; targetKind: 'card'; min: 1; max: 1; distinct: true };
}
export interface SealedCardDispositionInteractionMetadata {
  kind: 'sealed_card_disposition_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; sealKey: string; hostSourceCardId: string; candidateIds: string[]; resealMana: 1;
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: number; distinct: true };
}
export interface BattlePlunderChoiceInteractionMetadata {
  kind: 'battle_plunder_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; recordKey: string; stage: 'loser' | 'remove' | 'reorder'; triggerEventId: string;
  battlePhaseResolutionId: string; battleId: string; resultId: string; battlefieldId: string;
  loserIds: PlayerId[]; targetPlayerId?: PlayerId; topCardIds?: string[]; keptCardIds?: string[];
  constraints: { kind: 'target'; targetKind: 'player' | 'card'; min: number; max: number; distinct: true };
}
export interface RecordedRemovedReplayChoiceInteractionMetadata {
  kind: 'recorded_removed_replay_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; recordKey: string; candidateIds: string[]; minimumManaCost: 2;
  constraints: { kind: 'target'; targetKind: 'card'; min: 1; max: 1; distinct: true };
}
export interface BattleLuckDiscardInteractionMetadata {
  kind: 'battle_luck_discard_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; luckCardIds: string[];
  constraints: { kind: 'target'; targetKind: 'card'; min: 1; max: 1; distinct: true };
}
export interface BattleOpponentCloseRewardInteractionMetadata {
  kind: 'battle_opponent_close_reward_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; opponentId: PlayerId; candidateIds: string[];
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: 1; distinct: true };
}
export interface BattleDrawnCardOptionalPlayInteractionMetadata {
  kind: 'battle_drawn_card_optional_play_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  playerId: PlayerId; drawnCardId: string;
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: 1; distinct: true };
}
export interface BattlefieldAttackOfferChoiceInteractionMetadata {
  kind: 'battlefield_attack_offer_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  initiatingControllerId: PlayerId; decisionPlayerId: PlayerId; battlefieldId: string; round: number; candidateIds: string[];
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: 1; distinct: true };
}
export interface DeploymentTerrainVpChoiceInteractionMetadata {
  kind: 'deployment_terrain_vp_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  sourceControllerId: PlayerId; decisionPlayerId: PlayerId; battlefieldId: string; round: number; statusCreatedRound: number;
  maxSpend: 5; options: string[];
  constraints: { kind: 'target'; targetKind: 'choice'; min: 1; max: 1; distinct: true };
}
export interface OneShotAbilityReuseChoiceInteractionMetadata {
  kind: 'one_shot_ability_reuse_choice_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; targetCardId: string; candidateAbilityIds: string[];
  constraints: { kind: 'target'; targetKind: 'ability'; min: 1; max: 1; distinct: true };
}
export interface PendingBattlefieldAttackOfferTransaction {
  transactionId: string; controllerId: PlayerId; sourceCardId: string; abilityId: string; round: number; battlefieldId: string;
  orderPlayerIds: PlayerId[]; nextIndex: number; playedPlayerIds: PlayerId[];
}
export interface BattlefieldAttackOfferSettlement {
  transactionId: string; controllerId: PlayerId; sourceCardId: string; abilityId: string; round: number; battlefieldId: string; playedPlayerIds: PlayerId[];
}
export interface BattleCloseDrawPlayReward {
  playerId: PlayerId; closedCardId: string; refundMana: number; drawnCardId?: string;
}
export interface BattleCloseDrawImmediatePlayRecord {
  controllerId: PlayerId; playerId: PlayerId; cardInstanceId: string; sourceCardId: string; abilityId: string; round: number;
}
export interface PendingBattleCloseDrawPlayTransaction {
  transactionId: string; controllerId: PlayerId; sourceCardId: string; abilityId: string; round: number; battlefieldId: string;
  discardedLuckCardId?: string;
  opponentIds: PlayerId[]; closeIndex: number; playIndex: number; rewards: BattleCloseDrawPlayReward[];
}
export interface GlobalDefinitionRevealRewardInteractionMetadata {
  kind: 'global_definition_reveal_reward_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  initiatingControllerId: PlayerId; definitionId: string; rewardVp: 2; decisionPlayerIds: PlayerId[]; nextIndex: number; candidateIds: string[];
  constraints: { kind: 'target'; targetKind: 'card'; min: 0; max: 1; distinct: true };
}
export interface DiscardDefinitionPlayAllInteractionMetadata {
  kind: 'discard_definition_play_all_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; targetPlayerId: PlayerId; definitionId: string; transferVp: 2;
  revealedDiscardIds: string[]; matchingCardIds: string[]; options: ['skip', 'play_all'];
  constraints: { kind: 'target'; targetKind: 'choice'; min: 1; max: 1; distinct: true };
}
export interface MultiPresenceLocationContextInteractionMetadata {
  kind: 'multi_presence_location_context_v1'; template: 'target'; visibility: 'owner_only'; cancelPolicy: 'forbidden';
  sourceCardInstanceId: string; abilityId: string; createdRevision: number; continuationRef: string;
  controllerId: PlayerId; presenceKey: string; candidateLocationIds: string[];
  constraints: { kind: 'target'; targetKind: 'location'; min: 1; max: 1; distinct: true };
}
export type PendingInteractionMetadata = PrivateOptionalHandPlayInteractionMetadata | AlterEgoAttributeChoiceInteractionMetadata |
  OpponentCloseToOneInteractionMetadata | OpponentCloseSelectedOneInteractionMetadata | DeductionRecordChoiceInteractionMetadata |
  PostDrawHandShuffleInteractionMetadata | DiscardShuffleSourceXInteractionMetadata | RulerSealMoveInteractionMetadata | RulerSealFreePlayInteractionMetadata |
  OwnedRulerSealPowerInteractionMetadata | CombatOpponentPowerVpRewardInteractionMetadata | AutomaticRecycleKeepInteractionMetadata |
  CounterSpendChoiceInteractionMetadata | DiscardBasicReplayChoiceInteractionMetadata | SealedCardChoiceInteractionMetadata |
  SealedCardDispositionInteractionMetadata | BattlePlunderChoiceInteractionMetadata | RecordedRemovedReplayChoiceInteractionMetadata |
  BattleLuckDiscardInteractionMetadata | BattleOpponentCloseRewardInteractionMetadata |
  BattleDrawnCardOptionalPlayInteractionMetadata | BattlefieldAttackOfferChoiceInteractionMetadata |
  DeploymentTerrainVpChoiceInteractionMetadata | OneShotAbilityReuseChoiceInteractionMetadata |
  GlobalDefinitionRevealRewardInteractionMetadata | DiscardDefinitionPlayAllInteractionMetadata | MultiPresenceLocationContextInteractionMetadata;
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
  revealedCardDefinitionIds?: string[];
  revealedCardInstanceIds?: string[];
}
export interface CardRuntimeState {
  active: boolean; faceDown: boolean; playedRound: number; paidManaOnPlay?: number;
  /** Exact linked-player mana contributions consumed by this physical play. */
  playManaContributions?: Array<{ playerId: PlayerId; amount: number }>;
  reversed?: boolean; attributeOverrides?: string[];
  /** Instance-local base-power multiplier granted by a validated card action. */
  basePowerMultiplier?: number;
  /** Round whose battle-terminal event must remove this physical card from the game. */
  removeAfterBattleRound?: number;
  /** Trusted battlefield binding for source cards explicitly placed onto a battlefield. */
  placedAtLocationId?: string;
  /** Source-bound current-round choice that doubles matching basic-card base Power at the source controller's location. */
  /** Exact physical card granted this-round permission to use authored action-phase abilities during combat. */
  actionAbilityAllowedInCombatRound?: number;
  sourceLocationBasicBasePowerMultiplier?: {
    attribute: '力量' | '迅捷' | '魔术' | '特殊';
    multiplier: 2;
    round: number;
  };
  /** Source-provenance marker for a generated card that returns to its exact generator owner's discard after battle. */
  generatedCardReturnAfterBattle?: { round: number; generatorSourceCardId: string; generatorOwnerPlayerId: PlayerId; generatedControllerPlayerId: PlayerId; sourceAbilityId: string; powerRecipientPlayerIds: PlayerId[] };
  /** Exact physical-card marker for cards replayed from discard that must return to deck after this battle. */
  returnToDeckAfterBattle?: { round: number; controllerId: PlayerId; sourceCardId: string; abilityId: string };
  /** Source-card current-round Power bonus, persisted by physical instance. */
  roundPowerBonus?: { round: number; amount: number; sourceAbilityId: string };
  /** Source-owned mana-overflow close request for the canonical battle terminal. */
  manaOverflowCloseAfterBattle?: { round: number; sourceAbilityId: string };
  /** Physical-source binding created from an authenticated discard->deck selection. */
  sourceBoundX?: { value: number; controllerId: PlayerId; sourceAbilityId: string };
  /** Round whose battle participation upkeep for sourceBoundX has already settled. */
  sourceBoundXBattleUpkeepRound?: number;
}
export interface RulerSealBinding {
  id: string; issuerPlayerId: PlayerId; boundPlayerId: PlayerId; sourceCardId: string; abilityId: string;
  grantedRound: number; spent: boolean; spentRound?: number;
}
export interface NormalCommandSealUseRecord {
  playerId: PlayerId; sourceCardId: string; abilityId: string;
  round: number; before: number; after: number;
}
export interface PendingRulerSealReward {
  sealId: string; issuerPlayerId: PlayerId; boundPlayerId: PlayerId; sourceCardId: string; abilityId: string;
  round: number; rewardVp: number;
}
export interface LocationMarkerState {
  markerKey: string; controllerId: PlayerId; providerSourceCardId: string; providerAbilityId: string;
  locationId: string; placedRevision: number; updatedRevision: number;
}
export interface RoundDefinitionAttributeReplacementState {
  controllerId: PlayerId; sourceCardId: string; abilityId: string; round: number;
  targetDefinitionIds: string[]; replaceAttributes: string[]; createdRevision: number;
}
export interface SealedCardBindingState {
  sealKey: string; controllerId: PlayerId; hostSourceCardId: string; sealAbilityId: string;
  cardInstanceId: string; originalOwnerPlayerId: PlayerId; sealedRevision: number;
}
export interface ArmedSealedCardActionState {
  sealKey: string; controllerId: PlayerId; sourceCardId: string; abilityId: string; round: number; createdRevision: number;
}
export interface SealedCardReplayState {
  sealKey: string; controllerId: PlayerId; cascadeSourceCardId: string; cascadeAbilityId: string; hostSourceCardId: string; sealAbilityId: string;
  cardInstanceId: string; originalOwnerPlayerId: PlayerId; round: number; playedRevision: number;
}
export interface RecordedRemovedCardState {
  recordKey: string; controllerId: PlayerId; sourceCardId: string; sourceAbilityId: string; cardInstanceId: string;
  originalOwnerPlayerId: PlayerId; removedRevision: number; triggerResultId: string; triggerEventId: string;
}
export interface CrossPhaseActionProviderRecord {
  controllerId: PlayerId; sourceCardId: string; sourceAbilityId: string; round: number;
}
export interface OneShotAbilityReuseGrantRecord {
  controllerId: PlayerId; providerSourceCardId: string; providerSourceAbilityId: string;
  targetCardId: string; targetAbilityId: string; round: number; consumed: boolean;
}
export interface TrustedBattleResultSnapshot {
  battlePhaseResolutionId: string;
  battleId: string;
  resultId: string;
  battlefieldId: string;
  battleParticipantIds: PlayerId[];
  battleParticipantPowers?: Record<PlayerId, number>;
  winners: PlayerId[];
  loserIds: PlayerId[];
}
export interface MultiPresenceState {
  id: string;
  playerId: PlayerId;
  presenceKey: string;
  locationId: string;
  deployedAtLocationId: string;
  terrainAdvantage: number;
  sourceCardId: string;
  sourceAbilityId: string;
  createdRound: number;
  updatedRevision: number;
}
export interface LinkedRoleSkillCopyState {
  copyCardInstanceId: string; originalCardInstanceId: string; originalOwnerPlayerId: PlayerId; leaderPlayerId: PlayerId;
  relationshipKey: string; providerSourceCardId: string; providerAbilityId: string; round: number; used: boolean;
}
export interface MasterAscensionEventPowerState {
  controllerId: PlayerId; sourceCardId: string; sourceAbilityId: string; eventDefinitionId: string; eventRuleInstanceId: string;
  locationId: string; triggerEventId: string; round: number; amount: 4;
}
export interface AbilityRuntime {
  pack: AbilityDefinitionPack; revision: number; sequence: number; randomState: number;
  cardState: Record<string, CardRuntimeState>;
  /** Identity-free extra physical presences owned by one logical player. */
  extraPlayerPresences?: MultiPresenceState[];
  /** Last authoritative battle-loss round recorded by structural multi-presence providers. */
  multiPresenceLastBattleLossRoundByPlayer?: Record<PlayerId, Record<string, number>>;
  /** Live source-bound providers that permit the controller's action abilities during combat. */
  crossPhaseActionProviders?: CrossPhaseActionProviderRecord[];
  /** One-shot exact physical-card + ability reuse grants with source provenance. */
  oneShotAbilityReuseGrants?: OneShotAbilityReuseGrantRecord[];
  /** Identity-free authoritative location markers, keyed by controller + authored marker key. */
  locationMarkers?: Record<string, LocationMarkerState>;
  /** Identity-free current-round definition-level attribute replacements, keyed by controller. */
  roundDefinitionAttributeReplacements?: Record<PlayerId, RoundDefinitionAttributeReplacementState>;
  /** Identity-free physical cards sealed under an authored source, keyed by physical card instance. */
  sealedCardBindings?: Record<string, SealedCardBindingState>;
  /** Identity-free combat actions armed to seal one qualifying card after battle. */
  armedSealedCardActions?: ArmedSealedCardActionState[];
  /** Identity-free current-round replay provenance for cards released from a seal. */
  sealedCardReplays?: Record<string, SealedCardReplayState>;
  /** Identity-free physical cards removed by an accepted battle-plunder record, keyed by physical card instance. */
  recordedRemovedCards?: Record<string, RecordedRemovedCardState>;
  /** Identity-free temporary copied servant-skill physical cards, keyed by generated copy instance. */
  linkedRoleSkillCopies?: Record<string, LinkedRoleSkillCopyState>;
  /** Current-round use lock on the exact original physical servant-skill card after its copy is used. */
  linkedRoleOriginalSkillLocks?: Record<string, number>;
  /** Source-bound current-round +4 basic-card Power authority from an exact activated event. */
  masterAscensionEventPowerByPlayer?: Record<PlayerId, MasterAscensionEventPowerState>;
  /** Identity-free server-owned structured player flags. */
  structuredPlayerFlagsByPlayer?: Record<PlayerId, Record<string, boolean | string | number>>;
  /** Round marker for flags whose authored lifecycle is exactly this_round. */
  structuredRoundFlagKeysByPlayer?: Record<PlayerId, Record<string, number>>;
  /** Server-owned one-per-player deduction record selected from exact outside-game marker definitions. */
  deductionRecordsByPlayer?: Record<PlayerId, DeductionRecordState>;
  /** Round marker for players defeated by a source-grounded effect for battle-winner eligibility. */
  battleDefeatRoundByPlayer?: Record<PlayerId, number>;
  /** Round marker for players whose battle-loss effects are ignored by an accepted paid ability. */
  battleLossIgnoreRoundByPlayer?: Record<PlayerId, number>;
  /** Immutable server-owned opening deck cardinality, captured before the first-round draw. */
  startingDeckSizeByPlayer?: Record<PlayerId, number>;
  /** Total physical plays by card instance. */
  cardPlayCountByInstance?: Record<string, number>;
  /** Physical cards that acquired a one-play-per-game limit from a source-grounded effect. */
  grantedPerGamePlayLimitCardIds?: string[];
  /** Play-count snapshot captured when a physical card first acquires the dynamic per-game limit. */
  grantedPerGamePlayLimitBaselineByCardId?: Record<string, number>;
  /** Actual movement-entry rounds by player/location; deployments do not write this authority. */
  locationEntryRoundByPlayer?: Record<PlayerId, Record<string, number>>;
  /** Round-local generic total-Power adjustments produced by accepted structural abilities. */
  roundPlayerPowerAdjustments?: Array<{ playerId: PlayerId; amount: number; round: number; sourceCardId: string; abilityId: string }>;
  /** Armed same-battlefield win checks created by an accepted fortification action. */
  pendingBattlefieldFortifications?: Array<{ controllerId: PlayerId; battlefieldId: string; round: number; sourceCardId: string; abilityId: string }>;
  /** Exact next-round deployment destination authority created by an accepted fortification win. */
  forcedDeploymentLocations?: Array<{ playerId: PlayerId; locationId: string; round: number; sourceCardId: string; abilityId: string }>;
  ongoingEffects: OngoingEffect[]; lifecycleTransitions?: LifecycleTransition[]; responseWindows: ResponseWindow[]; pendingDecision?: PendingDecision;
  pendingDelayedActivations?: PendingDelayedActivation[];
  /** Server-owned pre-scoring battle-local defeat requests staged by the exact Presence Concealment response. */
  pendingPresenceConcealmentDefeats?: PendingPresenceConcealmentDefeat[];
  /** Server-owned post-scoring battle events waiting for Trigger Gateway settlement. */
  pendingPostBattleEvents?: AbilityEvent[];
  /** FB2-48 immutable first-seen authoritative root result facts, keyed by exact result id. */
  trustedBattleResultSnapshots?: Record<string, TrustedBattleResultSnapshot>;
  /** FB2-48 serialized frozen-battle opponent-power rewards awaiting owner choice. */
  pendingCombatOpponentPowerVpRewards?: PendingCombatOpponentPowerVpReward[];
  /** FB2-49 serialized same-battlefield opponent keep-one card decisions. */
  pendingOpponentCloseToOne?: PendingOpponentCloseToOne[];
  /** Identity-free server-owned transaction for battle close/refund/draw/optional-immediate-play resolution. */
  pendingBattleCloseDrawPlayTransaction?: PendingBattleCloseDrawPlayTransaction;
  /** Identity-free serialized same-battlefield turn-order optional attack transaction. */
  pendingBattlefieldAttackOfferTransaction?: PendingBattlefieldAttackOfferTransaction;
  /** Completed attack-offer participation awaiting authoritative battle-result settlement. */
  battlefieldAttackOfferSettlements?: BattlefieldAttackOfferSettlement[];
  /** Provenance for exact drawn cards whose action-phase abilities are permitted in combat for one round. */
  battleCloseDrawImmediatePlayHistory?: BattleCloseDrawImmediatePlayRecord[];
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
  /** Authoritative round of the most recent ordinary Command Seal ability use by player. Paying a seal as a cost does not write this fact. */
  normalCommandSealUseRoundByPlayer?: Record<PlayerId, number>;
  /** Append-only provenance for ordinary Command Seal ability/replacement use. */
  normalCommandSealUseHistory?: NormalCommandSealUseRecord[];
  /** Authoritative round of the most recent Ruler Seal ability/replacement use by issuer. Paying a seal as a cost does not write this fact. */
  rulerCommandSealUseRoundByPlayer?: Record<PlayerId, number>;
  usedAbilities: Record<string, number>; processedEvents: string[]; revealedServants: PlayerId[];
  events: SafeEvent[]; calculations: { controllerId: PlayerId; lines: CalculationLine[] }[];
  preventEffects: boolean; manaCaps: Record<PlayerId, number>; manaGainBlocked: PlayerId[];
  /** Inclusive round through which ordinary card draws are blocked for each player. */
  normalCardDrawBlockedThroughRoundByPlayer?: Record<PlayerId, number>;
  /** Inclusive round through which positive mana gains are blocked for each player. */
  manaGainBlockedThroughRoundByPlayer?: Record<PlayerId, number>;
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
export interface PlayCardAction { type: 'play_card'; cardInstanceId: string; faceDown?: boolean; manaContributions?: ManaContributionChoice[] }
export interface StageAttackCardAction { type: 'stage_attack_card'; cardInstanceId: string; faceDown?: boolean }
export interface ConfirmStagedAttackAction { type: 'confirm_staged_attack' }
export interface CancelStagedAttackAction { type: 'cancel_staged_attack' }
export interface ActivateAbilityAction { type: 'activate_ability'; cardInstanceId: string; abilityId: string; variableCosts?: { name: string; min: number; max: number }[]; manaContributions?: ManaContributionChoice[] }
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
