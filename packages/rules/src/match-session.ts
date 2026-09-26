import {
  advanceAbilityPhase,
  dispatchAbilityCommand,
  initializeAbilityRuntime,
  isCanonicalGenericPendingDecisionForRestore,
  isDeferredAbilityRuntimeProvenanceValidForRestore,
  processAbilityEvent,
  projectAbilityState,
} from './ability/interpreter';
import {
  createOpponentCloseToOnePersistenceScope,
  hasOpponentCloseToOneOmittedTrustedReplayAuthority,
  hasOpponentCloseToOneTrustedReplayAuthority,
  rememberOpponentCloseToOneTrustedReplayLineage,
  resolveOpponentCloseToOnePersistenceSecret,
  persistOpponentCloseToOneReplayManifest,
  persistOpponentCloseToOneServerAuthority,
  pruneOpponentCloseToOneTrustedReplayTransactions,
  rememberOpponentCloseToOneTrustedReplayCheckpoint,
  restoreOpponentCloseToOneServerAuthority,
  synchronizeOpponentCloseToOneCurrentTrust,
  synchronizeOpponentCloseToOneTrustedReplayCheckpoints,
  verifyOpponentCloseToOneReplayManifest,
  verifyOpponentCloseToOneTrustedReplayCheckpoints,
  verifyOpponentCloseToOneTrustedReplayLineage,
  type OpponentCloseToOneReplayManifestEntry,
  type OpponentCloseToOneReplayManifestSeal,
  type OpponentCloseToOneServerAuthoritySeal,
} from './ability/opponent-close-to-one-authority';
import { hmacSha256Hex, sha256Hex } from './ability/portable-sha256';
import { clearTransientCardTransformState } from './ability/card-instance-state';
import { settleLinkedOwnerCardsAfterBattles } from './ability/linked-owner-combat';
import { assertExecutableCardPack, type ExecutableCardPack } from './ability/executable-card-pack';
import { flushBattleTerminalEvent, stageBattleTerminalEvent } from './ability/battle-terminal';
import type {
  AbilityCommand,
  AbilityEvent,
  AbilityPlayerView,
  DispatchResult,
  ExecutableCardDefinition,
  ExecutableCharacterDefinition,
  LegalAction,
} from './ability/types';
import type { GameState, PhaseName } from './schema/game';
import type { CompiledPlaytestContentLibrary } from '@fd/content';
import { resolveBattlefield } from './core/combat-resolver';
import { applyBattleScoring } from './core/scoring-resolver';
import { canOccupyLocation, getEnabledLocations } from './core/map-engine';
import { canViewFaceDownEvents, canViewOpponentDiscard, grantMana } from './core/rule-overrides';
import { createSeededGameState } from './tools/seeded-state';

import contentLibrary from '../../../data/generated/fd-playtest-v1.content-library.json';

type RuntimeRawCard = ExecutableCardDefinition;

const interactivePhases: PhaseName[] = ['preparation', 'advance', 'action', 'battle'];
const workshopDeploymentManaSlots = [2, 1, 1, 1] as const;

type LocationId = GameState['players'][number]['locationId'] & string;

interface MatchSituationDefinition {
  id: string;
  name: string;
  mana: number;
  desc: string;
  isClimax?: boolean;
  minimumRemainingPlayers?: number;
  battleModifiers?: Array<{ sourceId: string; targetTag: string; value: number; condition?: 'has_attribute' | 'lacks_attribute' | 'has_repeated_attribute' }>;
  extraEvents?: Array<{ locationId: LocationId; visibility: 'public' | 'hidden' }>;
  forbidAttributes?: string[];
  deploymentLimitOnly?: Partial<Record<LocationId, number>>;
  closedLocations?: LocationId[];
}

interface RuntimeEventCard {
  id: string;
  name: string;
  printedReward?: number;
  effects?: Array<Record<string, unknown>>;
}

export type MatchSessionRestorePackKind = 'production_executable' | 'trusted_authoring_fixture';

export interface MatchSessionConfig {
  seed?: number;
  humanPlayerId?: string;
  humanPlayerIds?: string[];
  maxActionsPerPlayer?: number;
  /** Server/local-host persistence secret; never serialized inside MatchSessionSnapshot. */
  persistenceSecret?: string;
  /** Server-authoritative room/match scope; never serialized inside MatchSessionSnapshot. */
  persistenceScope?: string;
  /** Server-owned restore context. Production defaults to canonical executable-pack validation; tests may bind an authoring fixture explicitly. Never serialized. */
  restorePackKind?: MatchSessionRestorePackKind;
}

export type MatchPauseReason =
  | 'human_input'
  | 'host_directive'
  | 'backend_rejection'
  | 'round_end'
  | 'match_complete'
  | 'state_loop'
  | 'no_legal_action';

export interface MatchSessionLogEntry {
  id: string;
  round: number;
  phase: PhaseName;
  type: string;
  playerId?: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface MatchDirectiveView {
  id: string;
  controllerId?: string;
  kind: 'display' | 'player_confirmation' | 'host_adjudicated' | 'persistent_rule' | 'resource_deck';
  status: 'pending' | 'consumed';
  label: string;
  payload?: Record<string, unknown>;
}

export interface MatchInteractionWindow {
  id: string;
  kind: 'payment' | 'target' | 'response' | 'mode' | 'variable';
  title: string;
  controllerId: string;
  sourceCardInstanceId?: string;
  abilityId?: string;
  sourceLabel?: string;
  min?: number;
  max?: number;
  currentMana?: number;
  variableCosts?: Array<{ name: string; min: number; max: number }>;
  candidates?: Array<{ id: string; label: string; kind: 'card' | 'player' | 'location' | 'option'; zone?: string }>;
  legalActions: LegalAction[];
  template?: 'target';
  createdRevision?: number;
  visibility?: 'owner_only';
  cancelPolicy?: 'forbidden';
}

export interface MatchZoneProjection {
  id: string;
  label: string;
  cardIds: string[];
  count: number;
  status: 'enabled' | 'empty' | 'disabled' | 'host_adjudicated';
}

export interface MatchClientState {
  matchId: string;
  contentPack: { id: string; version: number; definitionHash: string };
  seed: number;
  humanPlayerId: string;
  round: number;
  phase: PhaseName;
  priorityPlayerId: string;
  view: AbilityPlayerView;
  interactionWindows: MatchInteractionWindow[];
  directives: MatchDirectiveView[];
  zones: MatchZoneProjection[];
  logs: MatchSessionLogEntry[];
  replay: Array<{ id: string; round: number; phase: PhaseName; revision: number; label: string }>;
  battleBreakdowns: GameState['battleResults'];
  finalRanking: Array<{ playerId: string; seat: number; vp: number; militaryResult: number; rank: number }>;
  stopReason?: MatchPauseReason;
  rejection?: DispatchResult['rejection'];
}

export interface DeferredRuntimeStateSeal {
  version: 2;
  checkpointId: string | null;
  authorityDigest: string;
  mac: string;
}

export interface MatchReplayStateSnapshot {
  checkpointId: string;
  state: GameState;
  /** Host-authenticated binding for generic continuations / delayed executable authority. */
  deferredRuntimeStateSeal?: DeferredRuntimeStateSeal;
  /** Authenticated FB2-49 frozen continuation; sealing secret is outside this snapshot. */
  opponentCloseToOneServerAuthority?: OpponentCloseToOneServerAuthoritySeal;
  logs: MatchSessionLogEntry[];
  battleHistory: GameState['battleResults'];
  consumedDirectiveCount: number;
  stopReason?: MatchPauseReason;
  rejection?: DispatchResult['rejection'];
}

export interface MatchSessionSnapshot {
  version: 1;
  seed: number;
  humanPlayerId: string;
  humanPlayerIds: string[];
  maxActionsPerPlayer: number;
  state: GameState;
  /** Host-authenticated binding for generic continuations / delayed executable authority. */
  deferredRuntimeStateSeal?: DeferredRuntimeStateSeal;
  /** Authenticated FB2-49 frozen continuation; sealing secret is outside this snapshot. */
  opponentCloseToOneServerAuthority?: OpponentCloseToOneServerAuthoritySeal;
  /** Authenticated replay membership for durable host/room persistence; host scope and secret remain external. */
  opponentCloseToOneReplayManifest?: OpponentCloseToOneReplayManifestSeal;
  logs: MatchSessionLogEntry[];
  replay: MatchClientState['replay'];
  replaySnapshots: MatchReplayStateSnapshot[];
  battleHistory: GameState['battleResults'];
  stopReason?: MatchPauseReason;
  rejection?: DispatchResult['rejection'];
}

type RuntimeContentLibrary = {
  pack: { id: string; name: string; version: number };
  rules: ExecutableCardPack;
};

const uncheckedContent = contentLibrary as unknown as CompiledPlaytestContentLibrary & { rules: unknown };
assertExecutableCardPack(uncheckedContent.rules, uncheckedContent);
const runtimeContent: RuntimeContentLibrary = { pack: uncheckedContent.pack, rules: uncheckedContent.rules };
const trustedDeferredRestoreContextByMac = new Map<string, { persistenceSecret: string; persistenceScope: string }>();

function persistedOpponentCloseToOneAuthorityField(
  state: GameState,
  persistenceSecret: string,
  persistenceScope: string,
  replayCheckpointId?: string,
): { opponentCloseToOneServerAuthority?: OpponentCloseToOneServerAuthoritySeal } {
  const seal = persistOpponentCloseToOneServerAuthority(state, persistenceSecret, persistenceScope, replayCheckpointId);
  return seal ? { opponentCloseToOneServerAuthority: seal } : {};
}

function deferredRuntimeStateSealPayload(
  persistenceScope: string,
  checkpointId: string | null,
  authorityDigest: string,
): string {
  return `fd-deferred-runtime-state-v2\n${persistenceScope}\n${checkpointId ?? ''}\n${authorityDigest}`;
}

function persistDeferredRuntimeStateSeal(
  authorityPayload: unknown,
  persistenceSecret: string,
  persistenceScope: string,
  checkpointId?: string,
): { deferredRuntimeStateSeal: DeferredRuntimeStateSeal } {
  const normalizedCheckpointId = checkpointId ?? null;
  const authorityDigest = sha256Hex(JSON.stringify(authorityPayload));
  const mac = hmacSha256Hex(
    persistenceSecret,
    deferredRuntimeStateSealPayload(persistenceScope, normalizedCheckpointId, authorityDigest),
  );
  trustedDeferredRestoreContextByMac.set(mac, { persistenceSecret, persistenceScope });
  return {
    deferredRuntimeStateSeal: {
      version: 2,
      checkpointId: normalizedCheckpointId,
      authorityDigest,
      mac,
    },
  };
}

function verifyDeferredRuntimeStateSeal(
  authorityPayload: unknown,
  seal: DeferredRuntimeStateSeal | undefined,
  persistenceSecret: string,
  persistenceScope: string,
  checkpointId?: string,
): boolean {
  const expectedCheckpointId = checkpointId ?? null;
  if (!seal || seal.version !== 2 || seal.checkpointId !== expectedCheckpointId ||
      typeof seal.authorityDigest !== 'string' || typeof seal.mac !== 'string') return false;
  const authorityDigest = sha256Hex(JSON.stringify(authorityPayload));
  return seal.authorityDigest === authorityDigest &&
    seal.mac === hmacSha256Hex(
      persistenceSecret,
      deferredRuntimeStateSealPayload(persistenceScope, expectedCheckpointId, authorityDigest),
    );
}

function currentDeferredAuthorityPayload(input: Pick<MatchSessionSnapshot,
  'version' | 'seed' | 'humanPlayerId' | 'humanPlayerIds' | 'maxActionsPerPlayer' |
  'state' | 'logs' | 'battleHistory' | 'stopReason' | 'rejection'>): unknown {
  return {
    version: input.version,
    seed: input.seed,
    humanPlayerId: input.humanPlayerId,
    humanPlayerIds: input.humanPlayerIds,
    maxActionsPerPlayer: input.maxActionsPerPlayer,
    state: input.state,
    logs: input.logs,
    battleHistory: input.battleHistory,
    stopReason: input.stopReason ?? null,
    rejection: input.rejection ?? null,
  };
}

function replayDeferredAuthorityPayload(input: Pick<MatchReplayStateSnapshot,
  'checkpointId' | 'state' | 'logs' | 'battleHistory' | 'consumedDirectiveCount' | 'stopReason' | 'rejection'>): unknown {
  return {
    checkpointId: input.checkpointId,
    state: input.state,
    logs: input.logs,
    battleHistory: input.battleHistory,
    consumedDirectiveCount: input.consumedDirectiveCount,
    stopReason: input.stopReason ?? null,
    rejection: input.rejection ?? null,
  };
}

function replayCheckpointDigest(snapshot: MatchReplayStateSnapshot): string {
  return sha256Hex(JSON.stringify(snapshot));
}

function replayManifestEntries(snapshots: readonly MatchReplayStateSnapshot[]): OpponentCloseToOneReplayManifestEntry[] {
  return snapshots.map((snapshot) => ({
    checkpointId: snapshot.checkpointId,
    checkpointDigest: replayCheckpointDigest(snapshot),
  }));
}

function hasOpponentCloseToOneReplayAuthority(
  currentSeal: OpponentCloseToOneServerAuthoritySeal | undefined,
  snapshots: readonly MatchReplayStateSnapshot[],
): boolean {
  return currentSeal !== undefined || snapshots.some((snapshot) => snapshot.opponentCloseToOneServerAuthority !== undefined);
}

const validReplayPhases = new Set<string>([
  'round_start', 'preparation', 'advance', 'action', 'battle', 'cleanup', 'round_end',
]);
const validVisibilityScopes = new Set<string>([
  'public', 'owner_only', 'battlefield_only', 'hidden_until_trigger', 'revealed_after_declaration',
]);
const validPauseReasons = new Set<string>([
  'human_input', 'host_directive', 'backend_rejection', 'round_end', 'match_complete', 'state_loop', 'no_legal_action',
]);

function isRestoreRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRestoreStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isRestoreVisibilityState(value: unknown): boolean {
  if (!isRestoreRecord(value) || typeof value.scope !== 'string' || !validVisibilityScopes.has(value.scope)) return false;
  if (value.ownerPlayerId !== undefined && typeof value.ownerPlayerId !== 'string') return false;
  if (value.revealedToPlayerIds !== undefined && !isRestoreStringArray(value.revealedToPlayerIds)) return false;
  return value.revealReason === undefined || typeof value.revealReason === 'string';
}

function isRestorePlayerState(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.id === 'string' && value.id.length > 0 &&
    Number.isSafeInteger(value.seat) && (value.seat as number) > 0 &&
    (value.status === 'active' || value.status === 'eliminated') &&
    typeof value.masterCardId === 'string' && typeof value.servantCardId === 'string' &&
    (value.locationId === undefined || typeof value.locationId === 'string') &&
    typeof value.vp === 'number' && Number.isFinite(value.vp) &&
    typeof value.militaryResult === 'number' && Number.isFinite(value.militaryResult) &&
    typeof value.mana === 'number' && Number.isFinite(value.mana) &&
    (value.eliminationOrder === undefined || Number.isSafeInteger(value.eliminationOrder));
}

function isRestoreCardInstance(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.instanceId === 'string' && value.instanceId.length > 0 &&
    typeof value.definitionId === 'string' && typeof value.ownerPlayerId === 'string' &&
    typeof value.controllerPlayerId === 'string' && typeof value.zone === 'string' &&
    isRestoreVisibilityState(value.visibility) &&
    (value.generatedBy === undefined || typeof value.generatedBy === 'string');
}

function isRestoreMapDefinition(value: unknown): boolean {
  if (!isRestoreRecord(value) || typeof value.id !== 'string' || !Number.isSafeInteger(value.playerCount) ||
      (value.playerCount as number) < 1 || !Array.isArray(value.locations)) return false;
  return value.locations.every((location) => isRestoreRecord(location) && typeof location.id === 'string' &&
    typeof location.displayName === 'string' && typeof location.enabledByDefault === 'boolean' &&
    typeof location.optional === 'boolean' && typeof location.occupancyMode === 'string' &&
    typeof location.eventPolicy === 'string' && isRestoreStringArray(location.movementLinks) &&
    isRestoreStringArray(location.rewardHooks) && isRestoreStringArray(location.visibilityHooks) &&
    isRestoreStringArray(location.tags));
}

function isRestoreLocationConfig(value: unknown): boolean {
  return isRestoreRecord(value) && isRestoreStringArray(value.enabledLocationIds);
}

function isRestoreFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRestoreSafeInteger(value: unknown, minimum = 0): value is number {
  return Number.isSafeInteger(value) && (value as number) >= minimum;
}

function isRestoreFiniteNumberMap(value: unknown): value is Record<string, number> {
  return isRestoreRecord(value) && Object.values(value).every(isRestoreFiniteNumber);
}

function isRestoreNonNegativeIntegerMap(value: unknown): value is Record<string, number> {
  return isRestoreRecord(value) && Object.values(value).every((entry) => isRestoreSafeInteger(entry));
}

function isRestoreStringArrayMap(value: unknown): value is Record<string, string[]> {
  return isRestoreRecord(value) && Object.values(value).every(isRestoreStringArray);
}
function isRestoreStructuredPlayerFlags(value: unknown): boolean {
  return isRestoreRecord(value) && Object.values(value).every((flags) =>
    isRestoreRecord(flags) && Object.entries(flags).every(([key, flag]) => key.length > 0 &&
      (typeof flag === 'boolean' || typeof flag === 'string' || (typeof flag === 'number' && Number.isFinite(flag)))));
}
function isRestoreStructuredRoundFlagKeys(value: unknown): boolean {
  return isRestoreRecord(value) && Object.values(value).every((keys) =>
    isRestoreRecord(keys) && Object.entries(keys).every(([key, round]) => key.length > 0 && isRestoreSafeInteger(round, 1)));
}

function isRestoreNestedNonNegativeIntegerMap(value: unknown): boolean {
  return isRestoreRecord(value) && Object.values(value).every(isRestoreNonNegativeIntegerMap);
}

function isRestoreRoundByPlayerNumberState(value: unknown): boolean {
  return isRestoreRecord(value) && isRestoreSafeInteger(value.round, 1) && isRestoreFiniteNumberMap(value.byPlayer);
}

function isRestoreAbilityEvent(value: unknown): boolean {
  if (!isRestoreRecord(value) || typeof value.id !== 'string' || typeof value.type !== 'string') return false;
  const optionalStrings = ['playerId', 'sourceCardId', 'battlePhaseResolutionId', 'battleId', 'resultId', 'battlefieldId', 'revealedId', 'locationId'];
  if (optionalStrings.some((key) => value[key] !== undefined && typeof value[key] !== 'string')) return false;
  if (value.revealedKind !== undefined && value.revealedKind !== 'situation' && value.revealedKind !== 'event') return false;
  if (value.lossOrdinal !== undefined && !isRestoreSafeInteger(value.lossOrdinal)) return false;
  for (const key of ['battleIds', 'resultIds', 'scoringReceiptIds', 'battleParticipantIds'] as const) {
    if (value[key] !== undefined && !isRestoreStringArray(value[key])) return false;
  }
  if (value.battleParticipantPowers !== undefined && !isRestoreFiniteNumberMap(value.battleParticipantPowers)) return false;
  if (value.battleResult !== undefined) {
    if (!isRestoreRecord(value.battleResult) || !isRestoreStringArray(value.battleResult.winners) || !isRestoreStringArray(value.battleResult.loserIds)) return false;
  }
  if (value.battleOutcomes !== undefined && (!Array.isArray(value.battleOutcomes) || !value.battleOutcomes.every((entry) =>
      isRestoreRecord(entry) && typeof entry.battlefieldId === 'string' && isRestoreStringArray(entry.winnerPlayerIds) &&
      (entry.participantPlayerIds === undefined || isRestoreStringArray(entry.participantPlayerIds))))) return false;
  if (value.playedCards !== undefined && (!Array.isArray(value.playedCards) || !value.playedCards.every((entry) =>
      isRestoreRecord(entry) && typeof entry.instanceId === 'string' && typeof entry.controllerId === 'string' &&
      typeof entry.cardType === 'string' && typeof entry.faceDown === 'boolean'))) return false;
  return true;
}

function isRestoreOngoingEffect(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.id === 'string' && typeof value.sourceCardId === 'string' &&
    typeof value.abilityId === 'string' && typeof value.controllerId === 'string' && value.starts === 'immediate' &&
    typeof value.duration === 'string' && isRestoreSafeInteger(value.startRound, 1) &&
    (value.expiresAtRound === undefined || isRestoreSafeInteger(value.expiresAtRound, 1)) &&
    typeof value.cleanup === 'string' && Array.isArray(value.ruleModifiers) && value.ruleModifiers.every((entry) =>
      isRestoreRecord(entry) && typeof entry.sourceCardId === 'string' && typeof entry.controllerId === 'string' && isRestoreRecord(entry.definition)) &&
    isRestoreStringArray(value.publicZones) &&
    (value.sourceMustRemainActive === undefined || typeof value.sourceMustRemainActive === 'boolean') &&
    (value.policyKey === undefined || typeof value.policyKey === 'string') &&
    (value.sourceDefinitionIdAtInstall === undefined || typeof value.sourceDefinitionIdAtInstall === 'string') &&
    (value.sourceValidityPolicyId === undefined || typeof value.sourceValidityPolicyId === 'string') &&
    (value.installedRevision === undefined || isRestoreSafeInteger(value.installedRevision));
}

function isRestoreLifecycleTransition(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.transitionId === 'string' && typeof value.lifecycleId === 'string' &&
    (value.kind === 'install' || value.kind === 'source_invalidated') && typeof value.causationId === 'string' &&
    isRestoreSafeInteger(value.createdRevision) && isRestoreSafeInteger(value.roundId, 1);
}

function isRestoreResponseWindow(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.id === 'string' && (value.kind === 'choose_unique_trigger' || value.kind === 'response') &&
    typeof value.opens === 'string' && typeof value.controllerId === 'string' && Array.isArray(value.choices) && value.choices.every((choice) =>
      isRestoreRecord(choice) && typeof choice.cardInstanceId === 'string' && typeof choice.abilityId === 'string' && typeof choice.controllerId === 'string') &&
    (value.group === undefined || (isRestoreRecord(value.group) && typeof value.group.groupId === 'string' &&
      value.group.policy === 'only_one_effect_may_activate_per_window')) && isRestoreAbilityEvent(value.event) &&
    value.passBehavior === 'decline_this_window' && value.order === 'turn_order';
}

function isRestoreSafeEvent(value: unknown): boolean {
  if (!isRestoreRecord(value) || typeof value.type !== 'string') return false;
  for (const key of ['playerId','sourceCardId','abilityId','visibility','sourceAbilityId','controllerId','battlePhaseResolutionId','battleId','battlefieldId','resultId','triggerEventId','fromState','toState','cardInstanceId','fromZone','toZone'] as const) {
    if (value[key] !== undefined && typeof value[key] !== 'string') return false;
  }
  if (value.unpreventable !== undefined && typeof value.unpreventable !== 'boolean') return false;
  if (value.resource !== undefined && !['mana','command_seals','victory_points'].includes(String(value.resource))) return false;
  if (value.rewardBranch !== undefined && value.rewardBranch !== 'mana' && value.rewardBranch !== 'victory_points') return false;
  for (const key of ['delta','before','after','requestedDelta'] as const) if (value[key] !== undefined && !isRestoreFiniteNumber(value[key])) return false;
  for (const key of ['revision','movedCount'] as const) if (value[key] !== undefined && !isRestoreSafeInteger(value[key])) return false;
  if (value.qualifyingPlayerIds !== undefined && !isRestoreStringArray(value.qualifyingPlayerIds)) return false;
  return true;
}

function isRestoreCalculation(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.controllerId === 'string' && Array.isArray(value.lines) &&
    value.lines.every((line) => isRestoreRecord(line) && typeof line.label === 'string' && isRestoreFiniteNumber(line.value));
}

function isRestoreRulerSealBinding(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.id === 'string' && typeof value.issuerPlayerId === 'string' &&
    typeof value.boundPlayerId === 'string' && typeof value.sourceCardId === 'string' && typeof value.abilityId === 'string' &&
    isRestoreSafeInteger(value.grantedRound, 1) && typeof value.spent === 'boolean' &&
    (value.spentRound === undefined || isRestoreSafeInteger(value.spentRound, 1));
}

function isRestoreRulerSealReward(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.sealId === 'string' && typeof value.issuerPlayerId === 'string' &&
    typeof value.boundPlayerId === 'string' && typeof value.sourceCardId === 'string' && typeof value.abilityId === 'string' &&
    isRestoreSafeInteger(value.round, 1) && isRestoreFiniteNumber(value.rewardVp);
}

function isRestoreSourceCardReturn(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.sourceCardId === 'string' && typeof value.abilityId === 'string' &&
    typeof value.recipientPlayerId === 'string' && isRestoreSafeInteger(value.round, 1);
}

function isRestorePendingDelayedActivation(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.controllerId === 'string' && typeof value.sourceCardId === 'string' &&
    typeof value.abilityId === 'string' && typeof value.definitionId === 'string' && typeof value.triggerEventId === 'string' &&
    isRestoreSafeInteger(value.round, 1);
}

function isRestorePendingPresenceConcealmentDefeat(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.controllerId === 'string' && typeof value.sourceCardId === 'string' &&
    typeof value.abilityId === 'string' && typeof value.triggerEventId === 'string' && typeof value.resultId === 'string' &&
    typeof value.battlefieldId === 'string' && isRestoreStringArray(value.participantIds) &&
    isRestoreFiniteNumberMap(value.participantPowers) && isRestoreStringArray(value.targetPlayerIds);
}

function isRestorePendingPreBattleDefeat(value: unknown): boolean {
  return isRestoreRecord(value) && isRestoreSafeInteger(value.round, 1) && typeof value.battlefieldId === 'string' &&
    typeof value.controllerId === 'string' && typeof value.sourceCardId === 'string' && typeof value.abilityId === 'string' &&
    isRestoreStringArray(value.targetPlayerIds);
}

function isRestorePendingCombatOpponentPowerVpReward(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.controllerId === 'string' && typeof value.sourceCardId === 'string' &&
    typeof value.abilityId === 'string' && typeof value.triggerEventId === 'string' && typeof value.battlePhaseResolutionId === 'string' &&
    typeof value.battleId === 'string' && typeof value.resultId === 'string' && typeof value.battlefieldId === 'string' &&
    isRestoreStringArray(value.participantIds) && isRestoreFiniteNumberMap(value.participantPowers) && isRestoreStringArray(value.opponentIds);
}

function isRestorePendingOpponentCloseToOne(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.initiatingControllerId === 'string' && typeof value.decisionPlayerId === 'string' &&
    typeof value.sourceCardId === 'string' && typeof value.abilityId === 'string' && typeof value.battlefieldId === 'string' &&
    isRestoreStringArray(value.qualifyingCardIds) && new Set(value.qualifyingCardIds).size === value.qualifyingCardIds.length &&
    isRestoreRecord(value.qualifyingCardOwners) && Object.values(value.qualifyingCardOwners).every((owner) => typeof owner === 'string') &&
    Object.keys(value.qualifyingCardOwners).length === value.qualifyingCardIds.length &&
    value.qualifyingCardIds.every((id) => Object.prototype.hasOwnProperty.call(value.qualifyingCardOwners, id)) &&
    isRestoreStringArray(value.remainingDecisionPlayerIds);
}

function hasExactRestoreKeys(value: unknown, expected: readonly string[]): value is Record<string, unknown> {
  if (!isRestoreRecord(value)) return false;
  const actual = Object.keys(value).sort(); const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function isRestoreInteractionConstraints(value: unknown, targetKinds: readonly string[]): boolean {
  return isRestoreRecord(value) && value.kind === 'target' && typeof value.targetKind === 'string' && targetKinds.includes(value.targetKind) &&
    isRestoreFiniteNumber(value.min) && isRestoreFiniteNumber(value.max) && value.distinct === true;
}

function isRestorePendingInteraction(value: unknown): boolean {
  if (!isRestoreRecord(value) || value.template !== 'target' || value.visibility !== 'owner_only' || value.cancelPolicy !== 'forbidden' ||
      typeof value.kind !== 'string' || typeof value.sourceCardInstanceId !== 'string' || typeof value.abilityId !== 'string' ||
      !isRestoreSafeInteger(value.createdRevision) || typeof value.continuationRef !== 'string') return false;
  switch (value.kind) {
    case 'private_optional_hand_play_v1':
      return isRestoreInteractionConstraints(value.constraints, ['card']);
    case 'alter_ego_attribute_choice_v1':
      return typeof value.triggerEventId === 'string' && typeof value.targetCardInstanceId === 'string' &&
        (value.variant === 'regular' || value.variant === 'ex') && isRestoreInteractionConstraints(value.constraints, ['attribute']);
    case 'same_battlefield_private_hand_return_v1':
      return typeof value.playerTargetId === 'string' && typeof value.selectedPlayerId === 'string' &&
        isRestoreInteractionConstraints(value.constraints, ['card']);
    case 'ruler_seal_move_v1':
      return typeof value.sealId === 'string' && typeof value.issuerPlayerId === 'string' && typeof value.boundPlayerId === 'string' &&
        isRestoreStringArray(value.destinations) && isRestoreInteractionConstraints(value.constraints, ['location']);
    case 'ruler_seal_free_play_v1':
      return typeof value.sealId === 'string' && typeof value.issuerPlayerId === 'string' && typeof value.boundPlayerId === 'string' &&
        isRestoreFiniteNumber(value.rewardVp) && isRestoreInteractionConstraints(value.constraints, ['card']);
    case 'combat_opponent_power_vp_reward_v1':
      return typeof value.triggerEventId === 'string' && typeof value.battlePhaseResolutionId === 'string' && typeof value.battleId === 'string' &&
        typeof value.resultId === 'string' && typeof value.battlefieldId === 'string' && isRestoreStringArray(value.participantIds) &&
        isRestoreFiniteNumberMap(value.participantPowers) && isRestoreStringArray(value.opponentIds) && value.divisor === 5 &&
        isRestoreInteractionConstraints(value.constraints, ['player']);
    case 'opponent_close_non_residual_to_one_v1':
      return typeof value.initiatingControllerId === 'string' && typeof value.decisionPlayerId === 'string' &&
        typeof value.battlefieldId === 'string' && isRestoreStringArray(value.qualifyingCardIds) &&
        isRestoreRecord(value.qualifyingCardOwners) && Object.values(value.qualifyingCardOwners).every((owner) => typeof owner === 'string') &&
        isRestoreStringArray(value.remainingDecisionPlayerIds) && isRestoreInteractionConstraints(value.constraints, ['card']);
    case 'opponent_close_selected_one_non_residual_v1': {
      if (!hasExactRestoreKeys(value, [
        'kind', 'template', 'visibility', 'cancelPolicy', 'sourceCardInstanceId', 'abilityId', 'createdRevision', 'continuationRef',
        'initiatingControllerId', 'decisionPlayerId', 'battlefieldId', 'candidateIds', 'candidateOwners', 'constraints',
      ]) || typeof value.initiatingControllerId !== 'string' || typeof value.decisionPlayerId !== 'string' ||
          value.decisionPlayerId === value.initiatingControllerId || typeof value.battlefieldId !== 'string') return false;
      const candidateIds = value.candidateIds;
      if (!Array.isArray(candidateIds) || candidateIds.length < 1 ||
          !candidateIds.every((id) => typeof id === 'string' && id.length > 0) || new Set(candidateIds).size !== candidateIds.length) return false;
      const owners = value.candidateOwners;
      if (!hasExactRestoreKeys(owners, candidateIds) || !candidateIds.every((id) => typeof owners[id] === 'string')) return false;
      const constraints = value.constraints;
      if (!hasExactRestoreKeys(constraints, ['kind', 'targetKind', 'min', 'max', 'distinct'])) return false;
      return isRestoreInteractionConstraints(constraints, ['card']) && constraints.min === 1 && constraints.max === 1;
    }    default:
      return false;
  }
}

function isRestoreEffectContext(value: unknown): boolean {
  if (!isRestoreRecord(value) || typeof value.controllerId !== 'string' || typeof value.sourceCardId !== 'string' ||
      typeof value.abilityId !== 'string' || !isRestoreFiniteNumberMap(value.variables) || !isRestoreStringArrayMap(value.selections)) return false;
  if (value.event !== undefined && !isRestoreAbilityEvent(value.event)) return false;
  return value.eventSource === undefined || (isRestoreRecord(value.eventSource) && typeof value.eventSource.ruleInstanceId === 'string' &&
    typeof value.eventSource.definitionId === 'string' && typeof value.eventSource.locationId === 'string');
}

function isRestoreCardRuntimeState(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.active === 'boolean' && typeof value.faceDown === 'boolean' &&
    Number.isSafeInteger(value.playedRound) && (value.paidManaOnPlay === undefined ||
      (typeof value.paidManaOnPlay === 'number' && Number.isFinite(value.paidManaOnPlay))) &&
    (value.reversed === undefined || typeof value.reversed === 'boolean') &&
    (value.attributeOverrides === undefined || isRestoreStringArray(value.attributeOverrides));
}

function isRestoreAbilityDefinition(value: unknown): boolean {
  if (!isRestoreRecord(value) || typeof value.id !== 'string' || typeof value.kind !== 'string' ||
      typeof value.printedClause !== 'string' || !isRestoreRecord(value.activation) ||
      !Array.isArray(value.conditions) || !value.conditions.every(isRestoreRecord) ||
      !Array.isArray(value.targets) || !value.targets.every(isRestoreRecord) ||
      !Array.isArray(value.effects) || !value.effects.every(isRestoreRecord) ||
      !Array.isArray(value.cost) || !value.cost.every(isRestoreRecord) ||
      !Array.isArray(value.ruleModifiers) || !value.ruleModifiers.every(isRestoreRecord) ||
      !Array.isArray(value.creates) || !value.creates.every(isRestoreRecord) ||
      !isRestoreRecord(value.lifecycle) || !isRestoreRecord(value.responseWindow) ||
      !isRestoreRecord(value.limit) || !isRestoreRecord(value.visibility) || !isRestoreRecord(value.execution)) return false;
  return typeof value.execution.mode === 'string' && isRestoreStringArray(value.execution.allowedOperations);
}

function isRestoreAbilityCardDefinition(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    typeof value.cardType === 'string' && isRestoreRecord(value.cardFace) && isRestoreRecord(value.playTiming) &&
    Array.isArray(value.playRequirements) && value.playRequirements.every(isRestoreRecord) &&
    Array.isArray(value.abilities) && value.abilities.every(isRestoreAbilityDefinition);
}

function isRestoreCharacterDefinition(value: unknown, cards: Record<string, unknown>): boolean {
  if (!isRestoreRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
      (value.kind !== 'master' && value.kind !== 'servant') || !isRestoreStringArray(value.cardIds) ||
      !isRestoreRecord(value.publicInformation) || (value.class !== undefined && typeof value.class !== 'string')) return false;
  return value.cardIds.every((cardId) => isRestoreAbilityCardDefinition(cards[cardId]));
}

function isRestoreServantPackage(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRestoreRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
      typeof value.class !== 'string' || !isRestoreRecord(value.publicInformation) ||
      !Array.isArray(value.skillCards) || !Array.isArray(value.knownCardDefinitions)) return false;
  const validCard = (entry: unknown) => isRestoreRecord(entry) && typeof entry.id === 'string' &&
    typeof entry.name === 'string' && typeof entry.printedText === 'string' && isRestoreRecord(entry.cardFace);
  return value.skillCards.every(validCard) && value.knownCardDefinitions.every(validCard);
}

function isRestoreAbilityPack(value: unknown, packKind: MatchSessionRestorePackKind): boolean {
  if (packKind === 'production_executable') {
    // Production MatchSession snapshots always carry the canonical executable pack.
    // Restore input cannot downgrade this boundary by deleting discriminator or integrity fields.
    try {
      assertExecutableCardPack(value, uncheckedContent);
      return true;
    } catch {
      return false;
    }
  }
  // The only non-production route is an explicit server-owned test context. It is
  // intentionally not inferred from snapshot bytes and is never serialized.
  if (!isRestoreRecord(value) || !isRestoreRecord(value.cards)) return false;
  const cards = value.cards;
  if (!Object.values(cards).every(isRestoreAbilityCardDefinition)) return false;
  if (value.characters !== undefined && (!isRestoreRecord(value.characters) ||
      !Object.values(value.characters).every((entry) => isRestoreCharacterDefinition(entry, cards)))) return false;
  return isRestoreServantPackage(value.servantPackage);
}

function isRestoreRoundPlayCounters(value: unknown): boolean {
  if (!isRestoreRecord(value) || !Number.isSafeInteger(value.round) || !isRestoreRecord(value.cardsPlayedByPlayer) ||
      !isRestoreRecord(value.attacksDeclaredByPlayer) ||
      (value.faceUpCardsPlayedByPlayer !== undefined && !isRestoreRecord(value.faceUpCardsPlayedByPlayer))) return false;
  const isCountMap = (candidate: Record<string, unknown>) => Object.values(candidate)
    .every((count) => Number.isSafeInteger(count) && (count as number) >= 0);
  return isCountMap(value.cardsPlayedByPlayer) && isCountMap(value.attacksDeclaredByPlayer) &&
    (value.faceUpCardsPlayedByPlayer === undefined || isCountMap(value.faceUpCardsPlayedByPlayer));
}

function isRestoreAbilityRuntimeBoundary(value: unknown, packKind: MatchSessionRestorePackKind): boolean {
  if (value === undefined) return true;
  if (!isRestoreRecord(value) || !isRestoreAbilityPack(value.pack, packKind) || !isRestoreRecord(value.cardState) ||
      !Object.values(value.cardState).every(isRestoreCardRuntimeState) ||
      !isRestoreSafeInteger(value.revision) || !isRestoreSafeInteger(value.sequence) ||
      typeof value.randomState !== 'number' || !Number.isFinite(value.randomState) ||
      !Array.isArray(value.ongoingEffects) || !value.ongoingEffects.every(isRestoreOngoingEffect) ||
      !Array.isArray(value.responseWindows) || !value.responseWindows.every(isRestoreResponseWindow) ||
      !isRestoreNonNegativeIntegerMap(value.usedAbilities) || !isRestoreStringArray(value.processedEvents) ||
      !isRestoreStringArray(value.revealedServants) || !Array.isArray(value.events) || !value.events.every(isRestoreSafeEvent) ||
      !Array.isArray(value.calculations) || !value.calculations.every(isRestoreCalculation) ||
      typeof value.preventEffects !== 'boolean' || !isRestoreFiniteNumberMap(value.manaCaps) ||
      !isRestoreStringArray(value.manaGainBlocked) || !Array.isArray(value.hostRequests) || !value.hostRequests.every((entry) =>
        isRestoreRecord(entry) && typeof entry.controllerId === 'string' && typeof entry.sourceCardId === 'string' &&
        typeof entry.abilityId === 'string' && isRestoreStringArray(entry.allowedOperations) && entry.allowedOperations.every((op) =>
          ['adjust-mana','adjust-victory-points','move-card','create-status','skip-ability'].includes(op))) ||
      (value.roomMode !== 'standard' && value.roomMode !== 'development') ||
      !isRestoreNonNegativeIntegerMap(value.abilityUsage) || !isRestoreRecord(value.noblePhantasmCostsThisRound) ||
      !Object.values(value.noblePhantasmCostsThisRound).every((entries) => Array.isArray(entries) && entries.every((entry) =>
        isRestoreRecord(entry) && typeof entry.cardId === 'string' && isRestoreFiniteNumber(entry.cost))) ||
      !isRestoreNonNegativeIntegerMap(value.consecutivePlayRounds) || !isRestoreNonNegativeIntegerMap(value.movementDistanceThisRound) ||
      !isRestoreNonNegativeIntegerMap(value.battlefieldsPassedOrStayedThisRound) || !isRestoreRoundByPlayerNumberState(value.manaGainedThisRound) ||
      (value.playRulesVersion !== 'legacy-v0' && value.playRulesVersion !== 'explicit-v1') ||
      !isRestoreRoundPlayCounters(value.playCounters)) return false;

  if (value.playerStatusKeysByPlayer !== undefined && !isRestoreStringArrayMap(value.playerStatusKeysByPlayer)) return false;
  if (value.structuredPlayerFlagsByPlayer !== undefined && !isRestoreStructuredPlayerFlags(value.structuredPlayerFlagsByPlayer)) return false;
  if (value.structuredRoundFlagKeysByPlayer !== undefined && !isRestoreStructuredRoundFlagKeys(value.structuredRoundFlagKeysByPlayer)) return false;
  if (value.combatWinRoundByPlayer !== undefined && !isRestoreNonNegativeIntegerMap(value.combatWinRoundByPlayer)) return false;
  if (value.lifecycleTransitions !== undefined && (!Array.isArray(value.lifecycleTransitions) || !value.lifecycleTransitions.every(isRestoreLifecycleTransition))) return false;
  if (value.pendingDelayedActivations !== undefined && (!Array.isArray(value.pendingDelayedActivations) || !value.pendingDelayedActivations.every(isRestorePendingDelayedActivation))) return false;
  if (value.pendingPresenceConcealmentDefeats !== undefined && (!Array.isArray(value.pendingPresenceConcealmentDefeats) || !value.pendingPresenceConcealmentDefeats.every(isRestorePendingPresenceConcealmentDefeat))) return false;
  if (value.pendingPreBattleDefeats !== undefined && (!Array.isArray(value.pendingPreBattleDefeats) || !value.pendingPreBattleDefeats.every(isRestorePendingPreBattleDefeat))) return false;
  if (value.pendingPostBattleEvents !== undefined && (!Array.isArray(value.pendingPostBattleEvents) || !value.pendingPostBattleEvents.every(isRestoreAbilityEvent))) return false;
  if (value.pendingCombatOpponentPowerVpRewards !== undefined && (!Array.isArray(value.pendingCombatOpponentPowerVpRewards) || !value.pendingCombatOpponentPowerVpRewards.every(isRestorePendingCombatOpponentPowerVpReward))) return false;
  if (value.pendingOpponentCloseToOne !== undefined && (!Array.isArray(value.pendingOpponentCloseToOne) || !value.pendingOpponentCloseToOne.every(isRestorePendingOpponentCloseToOne))) return false;
  if (value.pendingBattleTerminalEvent !== undefined && !isRestoreAbilityEvent(value.pendingBattleTerminalEvent)) return false;
  if (value.transformedReturnSilenceSourceCardIds !== undefined && !isRestoreStringArray(value.transformedReturnSilenceSourceCardIds)) return false;
  if (value.trustedBattleResultSnapshots !== undefined && (!isRestoreRecord(value.trustedBattleResultSnapshots) ||
      !Object.values(value.trustedBattleResultSnapshots).every((entry) => isRestoreRecord(entry) &&
        typeof entry.battlePhaseResolutionId === 'string' && typeof entry.battleId === 'string' && typeof entry.resultId === 'string' &&
        typeof entry.battlefieldId === 'string' && isRestoreStringArray(entry.battleParticipantIds) &&
        (entry.battleParticipantPowers === undefined || isRestoreFiniteNumberMap(entry.battleParticipantPowers)) &&
        isRestoreStringArray(entry.winners) && isRestoreStringArray(entry.loserIds)))) return false;

  if (value.pendingDecision !== undefined) {
    const decision = value.pendingDecision;
    if (!isRestoreRecord(decision) || typeof decision.id !== 'string' || typeof decision.controllerId !== 'string' ||
        !isRestoreRecord(decision.target) || !isRestoreStringArray(decision.candidates) ||
        !isRestoreFiniteNumber(decision.min) || !isRestoreFiniteNumber(decision.max) || !isRestoreEffectContext(decision.context) ||
        !Array.isArray(decision.remainingEffects) || !decision.remainingEffects.every(isRestoreRecord) ||
        (decision.interaction !== undefined && !isRestorePendingInteraction(decision.interaction))) return false;
  }
  return true;
}

function isRestoreEventPlacement(value: unknown, locationIds: Set<string>, playerIds: Set<string>, eventIds: Set<string>, allowMissingLocation = false): boolean {
  if (!isRestoreRecord(value) || typeof value.eventCardId !== 'string' || !eventIds.has(value.eventCardId) || !isRestoreVisibilityState(value.visibility) ||
      (value.locationId === undefined ? !allowMissingLocation : typeof value.locationId !== 'string' || !locationIds.has(value.locationId)) ||
      (value.ruleInstanceId !== undefined && typeof value.ruleInstanceId !== 'string') ||
      (value.ruleControllerPlayerId !== undefined && (typeof value.ruleControllerPlayerId !== 'string' || !playerIds.has(value.ruleControllerPlayerId))) ||
      (value.victoryPoints !== undefined && (typeof value.victoryPoints !== 'number' || !Number.isFinite(value.victoryPoints))) ||
      (value.battleModifiers !== undefined && (!Array.isArray(value.battleModifiers) || !value.battleModifiers.every(isRestoreRecord)))) return false;
  return true;
}

function isRestoreBattleResult(value: unknown, locationIds?: Set<string>, playerIds?: Set<string>): boolean {
  if (!isRestoreRecord(value) || typeof value.battlefieldId !== 'string' ||
      (locationIds && !locationIds.has(value.battlefieldId)) || !isRestoreStringArray(value.winnerPlayerIds) ||
      typeof value.tied !== 'boolean' || (value.winnerPlayerId !== null && typeof value.winnerPlayerId !== 'string') ||
      typeof value.margin !== 'number' || !Number.isFinite(value.margin) || typeof value.vpReward !== 'number' || !Number.isFinite(value.vpReward) ||
      !Array.isArray(value.militaryAdjustments) || !value.militaryAdjustments.every((entry) => isRestoreRecord(entry) &&
        typeof entry.playerId === 'string' && (!playerIds || playerIds.has(entry.playerId)) &&
        typeof entry.delta === 'number' && Number.isFinite(entry.delta)) ||
      !Array.isArray(value.participantBreakdowns) || !value.participantBreakdowns.every((entry) => isRestoreRecord(entry) &&
        typeof entry.playerId === 'string' && (!playerIds || playerIds.has(entry.playerId)) &&
        typeof entry.basePower === 'number' && Number.isFinite(entry.basePower) &&
        typeof entry.totalModifier === 'number' && Number.isFinite(entry.totalModifier) &&
        typeof entry.effectivePower === 'number' && Number.isFinite(entry.effectivePower) && Array.isArray(entry.modifiers))) return false;
  const referencedPlayers = [
    ...value.winnerPlayerIds,
    ...(value.excludedPlayerIds === undefined ? [] : isRestoreStringArray(value.excludedPlayerIds) ? value.excludedPlayerIds : [null]),
    ...(value.presenceConcealmentDefeatedPlayerIds === undefined ? [] : isRestoreStringArray(value.presenceConcealmentDefeatedPlayerIds) ? value.presenceConcealmentDefeatedPlayerIds : [null]),
    ...(value.lossEffectSuppressedPlayerIds === undefined ? [] : isRestoreStringArray(value.lossEffectSuppressedPlayerIds) ? value.lossEffectSuppressedPlayerIds : [null]),
    ...(value.winnerPlayerId === null ? [] : [value.winnerPlayerId]),
  ];
  return referencedPlayers.every((id) => typeof id === 'string' && (!playerIds || playerIds.has(id)));
}

function isRestoreGameLogEntry(value: unknown): boolean {
  return isRestoreRecord(value) && typeof value.type === 'string' && typeof value.message === 'string' &&
    (value.payload === undefined || isRestoreRecord(value.payload));
}

function restoreRecordKeysBelongTo(value: unknown, allowed: Set<string>): boolean {
  return isRestoreRecord(value) && Object.keys(value).every((key) => allowed.has(key));
}

function isRestoreEffectStackItem(value: unknown, playerIds: Set<string>): boolean {
  if (!isRestoreRecord(value) || typeof value.sourceCardId !== 'string' || typeof value.controllerPlayerId !== 'string' ||
      !playerIds.has(value.controllerPlayerId) || !isRestoreRecord(value.effect)) return false;
  const effect = value.effect;
  const timings = new Set(['round_start','preparation','advance','action','battle','after_battle','cleanup','round_end']);
  if (typeof effect.id !== 'string' || typeof effect.timing !== 'string' || !timings.has(effect.timing) || typeof effect.handler !== 'string') return false;
  if (effect.conditions !== undefined && (!Array.isArray(effect.conditions) || !effect.conditions.every((entry) =>
      entry === 'same_battlefield' || entry === 'requires_public_attack' || entry === 'requires_declared_battle'))) return false;
  return effect.payload === undefined || isRestoreRecord(effect.payload);
}

function isRestoreContentRuntime(value: unknown, locationIds: Set<string>, eventIds: Set<string>): boolean {
  if (!isRestoreRecord(value) || !Array.isArray(value.situations) || !Array.isArray(value.eventDraws)) return false;
  if (!value.situations.every((entry) => isRestoreRecord(entry) && isRestoreSafeInteger(entry.round, 1) &&
      typeof entry.cardId === 'string' &&
      (entry.minimumRemainingPlayers === undefined || isRestoreSafeInteger(entry.minimumRemainingPlayers)) &&
      (entry.sharedManaReward === undefined || isRestoreFiniteNumber(entry.sharedManaReward)) &&
      (entry.battleModifiers === undefined || (Array.isArray(entry.battleModifiers) && entry.battleModifiers.every(isRestoreRecord))) &&
      (entry.notes === undefined || isRestoreStringArray(entry.notes)))) return false;
  return value.eventDraws.every((entry) => isRestoreRecord(entry) && isRestoreSafeInteger(entry.round, 1) &&
    typeof entry.locationId === 'string' && locationIds.has(entry.locationId) && typeof entry.eventCardId === 'string' &&
    eventIds.has(entry.eventCardId) && (entry.victoryPoints === undefined || isRestoreFiniteNumber(entry.victoryPoints)) &&
    (entry.battleModifiers === undefined || (Array.isArray(entry.battleModifiers) && entry.battleModifiers.every(isRestoreRecord))) &&
    (entry.notes === undefined || isRestoreStringArray(entry.notes)));
}

function isRestoreScoringBreakdown(value: unknown, playerIds: Set<string>): boolean {
  const validReasons = new Set(['battle_vp','location_vp','recon_vp','competition_vp','military_result','elimination']);
  return Array.isArray(value) && value.every((entry) => isRestoreRecord(entry) && typeof entry.playerId === 'string' &&
    playerIds.has(entry.playerId) && isRestoreFiniteNumber(entry.vpDelta) && isRestoreFiniteNumber(entry.militaryDelta) &&
    typeof entry.eliminated === 'boolean' && (entry.eliminationOrder === undefined || isRestoreSafeInteger(entry.eliminationOrder)) &&
    Array.isArray(entry.reasons) && entry.reasons.every((reason) => isRestoreRecord(reason) && typeof reason.source === 'string' &&
      validReasons.has(reason.source) && typeof reason.label === 'string' && isRestoreFiniteNumber(reason.value)));
}

function isRestoreRuleOverrides(value: unknown, playerIds: Set<string>, locationIds: Set<string>): boolean {
  if (!isRestoreRecord(value)) return false;
  if (value.occupancyLimitByLocation !== undefined) {
    if (!isRestoreRecord(value.occupancyLimitByLocation) || !Object.entries(value.occupancyLimitByLocation).every(([id, limit]) =>
      locationIds.has(id) && (limit === null || isRestoreSafeInteger(limit)))) return false;
  }
  const playerLists = [
    'ignoreMovementLinkPlayerIds','reverseArrowMovementPlayerIds','ignoreOccupancyLimitPlayerIds','engagedPlayerIds',
    'ignoreEngagementForMovementPlayerIds','mustDeployToBattlefieldPlayerIds','movementLockedOwnActionCombatPlayerIds',
    'viewOpponentDiscardPlayerIds','viewFaceDownEventsPlayerIds',
  ] as const;
  for (const key of playerLists) {
    if (value[key] !== undefined && (!isRestoreStringArray(value[key]) || !(value[key] as string[]).every((id) => playerIds.has(id)))) return false;
  }
  const numberMaps = [
    'logicalDayByPlayer','firstLogicalDayTotalPowerAdjustmentByPlayer','nonClimaxSituationManaGainCapByPlayer',
    'lowerVpBattleTotalPowerAdjustmentByPlayer','rulerSealMovementLockRoundByPlayer',
  ] as const;
  for (const key of numberMaps) {
    if (value[key] !== undefined && (!isRestoreFiniteNumberMap(value[key]) || !restoreRecordKeysBelongTo(value[key], playerIds))) return false;
  }
  if (value.roundTotalManaGainCapByPlayer !== undefined && (!isRestoreRecord(value.roundTotalManaGainCapByPlayer) ||
      !restoreRecordKeysBelongTo(value.roundTotalManaGainCapByPlayer, playerIds) ||
      !Object.values(value.roundTotalManaGainCapByPlayer).every((entry) => isRestoreRecord(entry) &&
        isRestoreFiniteNumber(entry.regular) && isRestoreFiniteNumber(entry.climax)))) return false;
  if (value.masterSkillPowerLockIfSituationForbidsByPlayer !== undefined && (!isRestoreRecord(value.masterSkillPowerLockIfSituationForbidsByPlayer) ||
      !restoreRecordKeysBelongTo(value.masterSkillPowerLockIfSituationForbidsByPlayer, playerIds) ||
      !Object.values(value.masterSkillPowerLockIfSituationForbidsByPlayer).every((entry) => isRestoreRecord(entry) &&
        typeof entry.attribute === 'string' && isRestoreFiniteNumber(entry.value)))) return false;
  if (value.commandSpellPhaseOverrideByPlayer !== undefined && (!isRestoreRecord(value.commandSpellPhaseOverrideByPlayer) ||
      !restoreRecordKeysBelongTo(value.commandSpellPhaseOverrideByPlayer, playerIds) ||
      !Object.values(value.commandSpellPhaseOverrideByPlayer).every((phase) => typeof phase === 'string' && validReplayPhases.has(phase)))) return false;
  if (value.extraAttackPlayAllowanceByManaByPlayer !== undefined && (!isRestoreRecord(value.extraAttackPlayAllowanceByManaByPlayer) ||
      !restoreRecordKeysBelongTo(value.extraAttackPlayAllowanceByManaByPlayer, playerIds) ||
      !Object.values(value.extraAttackPlayAllowanceByManaByPlayer).every((entry) => isRestoreRecord(entry) &&
        isRestoreFiniteNumber(entry.threshold) && isRestoreFiniteNumber(entry.amount)))) return false;
  if (value.ignoreSituationPlayForbidAttributesByPlayer !== undefined && (!isRestoreStringArrayMap(value.ignoreSituationPlayForbidAttributesByPlayer) ||
      !restoreRecordKeysBelongTo(value.ignoreSituationPlayForbidAttributesByPlayer, playerIds))) return false;
  return true;
}

function restoreSourceDefinition(
  pack: Record<string, unknown>,
  cardsByInstance: Map<string, Record<string, unknown>>,
  eventPlacements: Array<Record<string, unknown>>,
  sourceCardId: string,
): Record<string, unknown> | undefined {
  const physical = cardsByInstance.get(sourceCardId);
  if (physical && isRestoreRecord(pack.cards)) {
    const definition = pack.cards[physical.definitionId as string];
    if (isRestoreRecord(definition)) return definition;
  }
  const placement = eventPlacements.find((entry) => entry.ruleInstanceId === sourceCardId);
  if (placement && isRestoreRecord(pack.eventRules)) {
    const definition = pack.eventRules[placement.eventCardId as string];
    if (isRestoreRecord(definition)) return definition;
  }
  return undefined;
}

function restoreSourceHasAbility(
  pack: Record<string, unknown>,
  cardsByInstance: Map<string, Record<string, unknown>>,
  eventPlacements: Array<Record<string, unknown>>,
  sourceCardId: string,
  abilityId: string,
): boolean {
  const definition = restoreSourceDefinition(pack, cardsByInstance, eventPlacements, sourceCardId);
  return !!definition && Array.isArray(definition.abilities) && definition.abilities.some((ability) =>
    isRestoreRecord(ability) && ability.id === abilityId);
}

function restoreSourceControllerMatches(
  cardsByInstance: Map<string, Record<string, unknown>>,
  eventPlacements: Array<Record<string, unknown>>,
  sourceCardId: string,
  controllerId: string,
): boolean {
  const physical = cardsByInstance.get(sourceCardId);
  if (physical) return physical.controllerPlayerId === controllerId;
  const placement = eventPlacements.find((entry) => entry.ruleInstanceId === sourceCardId);
  return !!placement && (placement.ruleControllerPlayerId === undefined || placement.ruleControllerPlayerId === controllerId);
}

function restoreIdsBelongTo(ids: unknown, allowed: Set<string>): boolean {
  return isRestoreStringArray(ids) && new Set(ids).size === ids.length && ids.every((id) => allowed.has(id));
}

function isRestoreAbilityEventReferences(
  event: Record<string, unknown>,
  playerIds: Set<string>,
  locationIds: Set<string>,
): boolean {
  if (event.playerId !== undefined && !playerIds.has(event.playerId as string)) return false;
  if (event.battlefieldId !== undefined && !locationIds.has(event.battlefieldId as string)) return false;
  if (event.locationId !== undefined && !locationIds.has(event.locationId as string)) return false;
  if (event.battleParticipantIds !== undefined && !restoreIdsBelongTo(event.battleParticipantIds, playerIds)) return false;
  if (event.battleParticipantPowers !== undefined && (!isRestoreFiniteNumberMap(event.battleParticipantPowers) ||
      !restoreRecordKeysBelongTo(event.battleParticipantPowers, playerIds))) return false;
  if (Array.isArray(event.battleOutcomes) && !event.battleOutcomes.every((outcome) =>
      isRestoreRecord(outcome) && locationIds.has(outcome.battlefieldId as string) &&
      (outcome.participantPlayerIds === undefined || restoreIdsBelongTo(outcome.participantPlayerIds, playerIds)) &&
      restoreIdsBelongTo(outcome.winnerPlayerIds, playerIds))) return false;
  if (Array.isArray(event.playedCards) && !event.playedCards.every((played) =>
      isRestoreRecord(played) && playerIds.has(played.controllerId as string))) return false;
  return true;
}

function isRestoreAbilityRuntimeReferences(
  value: Record<string, unknown>,
  playerIds: Set<string>,
  locationIds: Set<string>,
  cardsByInstance: Map<string, Record<string, unknown>>,
  pack: Record<string, unknown>,
  eventPlacements: Array<Record<string, unknown>>,
): boolean {
  const playerKeyedMaps = [
    'playerStatusKeysByPlayer','structuredPlayerFlagsByPlayer','structuredRoundFlagKeysByPlayer','combatWinRoundByPlayer','manaCaps','noblePhantasmCostsThisRound','movementDistanceThisRound',
    'battlefieldsPassedOrStayedThisRound',
  ] as const;
  for (const key of playerKeyedMaps) if (value[key] !== undefined && !restoreRecordKeysBelongTo(value[key], playerIds)) return false;
  for (const key of ['revealedServants','manaGainBlocked'] as const) {
    if (!(value[key] as string[]).every((id) => playerIds.has(id))) return false;
  }
  for (const key of ['manaGainedThisRound','playCounters'] as const) {
    const container = value[key];
    if (!isRestoreRecord(container)) return false;
    const children = key === 'playCounters' ? ['cardsPlayedByPlayer','attacksDeclaredByPlayer'] : ['byPlayer'];
    for (const child of children) {
      if (container[child] !== undefined && !restoreRecordKeysBelongTo(container[child], playerIds)) return false;
    }
  }
  if (!(value.calculations as Array<Record<string, unknown>>).every((entry) => playerIds.has(entry.controllerId as string))) return false;
  if (!(value.hostRequests as Array<Record<string, unknown>>).every((entry) => playerIds.has(entry.controllerId as string))) return false;
  if (!(value.ongoingEffects as Array<Record<string, unknown>>).every((entry) => playerIds.has(entry.controllerId as string))) return false;
  if (!(value.responseWindows as Array<Record<string, unknown>>).every((entry) => playerIds.has(entry.controllerId as string))) return false;

  if (value.pendingDelayedActivations !== undefined && !(value.pendingDelayedActivations as Array<Record<string, unknown>>).every((entry) =>
      playerIds.has(entry.controllerId as string) &&
      restoreSourceControllerMatches(cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.controllerId as string) &&
      restoreSourceHasAbility(pack, cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.abilityId as string) &&
      isRestoreRecord(pack.cards) && Object.prototype.hasOwnProperty.call(pack.cards, entry.definitionId as string))) return false;
  if (value.pendingPresenceConcealmentDefeats !== undefined && !(value.pendingPresenceConcealmentDefeats as Array<Record<string, unknown>>).every((entry) => {
    if (!playerIds.has(entry.controllerId as string) || !locationIds.has(entry.battlefieldId as string) ||
        !restoreSourceHasAbility(pack, cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.abilityId as string) ||
        !restoreIdsBelongTo(entry.participantIds, playerIds) || !restoreIdsBelongTo(entry.targetPlayerIds, playerIds)) return false;
    const participants = entry.participantIds as string[];
    if ((entry.targetPlayerIds as string[]).some((id) => !participants.includes(id))) return false;
    return isRestoreFiniteNumberMap(entry.participantPowers) &&
      restoreRecordKeysBelongTo(entry.participantPowers, new Set(participants)) && Object.keys(entry.participantPowers).length === participants.length;
  })) return false;
  if (value.pendingPreBattleDefeats !== undefined && !(value.pendingPreBattleDefeats as Array<Record<string, unknown>>).every((entry) =>
      playerIds.has(entry.controllerId as string) && locationIds.has(entry.battlefieldId as string) &&
      restoreSourceControllerMatches(cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.controllerId as string) &&
      restoreSourceHasAbility(pack, cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.abilityId as string) &&
      restoreIdsBelongTo(entry.targetPlayerIds, playerIds))) return false;
  if (value.pendingPostBattleEvents !== undefined && !(value.pendingPostBattleEvents as Array<Record<string, unknown>>).every((entry) =>
      isRestoreAbilityEventReferences(entry, playerIds, locationIds))) return false;
  if (value.pendingCombatOpponentPowerVpRewards !== undefined && !(value.pendingCombatOpponentPowerVpRewards as Array<Record<string, unknown>>).every((entry) => {
    if (!playerIds.has(entry.controllerId as string) || !locationIds.has(entry.battlefieldId as string) ||
        !restoreSourceHasAbility(pack, cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.abilityId as string) ||
        !restoreIdsBelongTo(entry.participantIds, playerIds) || !restoreIdsBelongTo(entry.opponentIds, playerIds)) return false;
    const participants = entry.participantIds as string[];
    const opponents = entry.opponentIds as string[];
    if (!participants.includes(entry.controllerId as string) || opponents.includes(entry.controllerId as string) ||
        opponents.some((id) => !participants.includes(id))) return false;
    return isRestoreFiniteNumberMap(entry.participantPowers) &&
      restoreRecordKeysBelongTo(entry.participantPowers, new Set(participants)) && Object.keys(entry.participantPowers).length === participants.length;
  })) return false;
  if (value.pendingOpponentCloseToOne !== undefined && !(value.pendingOpponentCloseToOne as Array<Record<string, unknown>>).every((entry) =>
      playerIds.has(entry.initiatingControllerId as string) && playerIds.has(entry.decisionPlayerId as string) &&
      locationIds.has(entry.battlefieldId as string) &&
      restoreSourceControllerMatches(cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.initiatingControllerId as string) &&
      restoreSourceHasAbility(pack, cardsByInstance, eventPlacements, entry.sourceCardId as string, entry.abilityId as string) &&
      restoreIdsBelongTo(entry.remainingDecisionPlayerIds, playerIds) &&
      (entry.qualifyingCardIds as string[]).every((id) => cardsByInstance.has(id)) &&
      Object.values(entry.qualifyingCardOwners as Record<string, unknown>).every((owner) => playerIds.has(owner as string)))) return false;
  const pendingDecision = value.pendingDecision;
  if (isRestoreRecord(pendingDecision) && isRestoreRecord(pendingDecision.interaction) &&
      pendingDecision.interaction.kind === 'opponent_close_selected_one_non_residual_v1') {
    const meta = pendingDecision.interaction;
    const candidateIds = meta.candidateIds as string[];
    const owners = meta.candidateOwners as Record<string, unknown>;
    if (!playerIds.has(meta.initiatingControllerId as string) || !playerIds.has(meta.decisionPlayerId as string) ||
        !locationIds.has(meta.battlefieldId as string) || pendingDecision.controllerId !== meta.decisionPlayerId ||
        !restoreSourceControllerMatches(cardsByInstance, eventPlacements, meta.sourceCardInstanceId as string, meta.initiatingControllerId as string) ||
        !restoreSourceHasAbility(pack, cardsByInstance, eventPlacements, meta.sourceCardInstanceId as string, meta.abilityId as string) ||
        !candidateIds.every((id) => cardsByInstance.has(id) &&
          cardsByInstance.get(id)?.ownerPlayerId === owners[id] && owners[id] === meta.decisionPlayerId)) return false;
  }
  if (value.pendingBattleTerminalEvent !== undefined && (!isRestoreRecord(value.pendingBattleTerminalEvent) ||
      !isRestoreAbilityEventReferences(value.pendingBattleTerminalEvent, playerIds, locationIds))) return false;
  if (value.transformedReturnSilenceSourceCardIds !== undefined &&
      !(value.transformedReturnSilenceSourceCardIds as string[]).every((id) => cardsByInstance.has(id))) return false;
  if (value.trustedBattleResultSnapshots !== undefined && !Object.values(value.trustedBattleResultSnapshots as Record<string, unknown>).every((entry) =>
      isRestoreRecord(entry) && locationIds.has(entry.battlefieldId as string) &&
      restoreIdsBelongTo(entry.battleParticipantIds, playerIds) && restoreIdsBelongTo(entry.winners, playerIds) &&
      restoreIdsBelongTo(entry.loserIds, playerIds) &&
      (entry.battleParticipantPowers === undefined || (isRestoreFiniteNumberMap(entry.battleParticipantPowers) &&
        restoreRecordKeysBelongTo(entry.battleParticipantPowers, new Set(entry.battleParticipantIds as string[])))))) return false;
  return value.pendingDecision === undefined || playerIds.has((value.pendingDecision as Record<string, unknown>).controllerId as string);
}

function isRestoreGameState(value: unknown, packKind: MatchSessionRestorePackKind = 'production_executable'): value is GameState {
  if (!isRestoreRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.players) || value.players.length < 1 ||
      !value.players.every(isRestorePlayerState) || !isRestoreRecord(value.round) || !isRestoreMapDefinition(value.map) ||
      !isRestoreLocationConfig(value.locationConfig) || !Array.isArray(value.cards) || !value.cards.every(isRestoreCardInstance) ||
      !Array.isArray(value.eventPlacements) || !Array.isArray(value.battleResults) ||
      !Array.isArray(value.effectStack) || !Array.isArray(value.log) || !value.log.every(isRestoreGameLogEntry) ||
      !isRestoreRecord(value.abilityRuntime) || !isRestoreAbilityRuntimeBoundary(value.abilityRuntime, packKind)) return false;
  const round = value.round;
  if (!isRestoreSafeInteger(round.roundNumber, 1) || typeof round.activePhase !== 'string' || !validReplayPhases.has(round.activePhase) ||
      !isRestoreSafeInteger(round.prioritySeat, 1)) return false;

  const players = value.players as Array<Record<string, unknown>>;
  const playerIds = new Set(players.map((player) => player.id as string));
  const seats = new Set(players.map((player) => player.seat as number));
  const map = value.map as Record<string, unknown>;
  if (playerIds.size !== players.length || seats.size !== players.length || map.playerCount !== players.length ||
      !players.every((player) => (player.seat as number) <= (map.playerCount as number)) ||
      !players.some((player) => player.seat === round.prioritySeat)) return false;

  const abilityRuntime = value.abilityRuntime as Record<string, unknown>;
  const pack = abilityRuntime.pack as Record<string, unknown>;
  if (packKind === 'production_executable') {
    const characters = pack.characters as Record<string, unknown>;
    for (const player of players) {
      const master = characters[player.masterCardId as string];
      const servant = characters[player.servantCardId as string];
      if (!isRestoreRecord(master) || master.kind !== 'master' || !isRestoreRecord(servant) || servant.kind !== 'servant') return false;
    }
  }

  const locationConfig = value.locationConfig as Record<string, unknown>;
  const locations = (map.locations as Array<Record<string, unknown>>);
  const locationIds = new Set(locations.map((location) => location.id as string));
  if (locationIds.size !== locations.length) return false;
  for (const location of locations) {
    if (!(location.movementLinks as string[]).every((id) => locationIds.has(id))) return false;
  }
  const enabledLocationIds = locationConfig.enabledLocationIds as string[];
  if (new Set(enabledLocationIds).size !== enabledLocationIds.length || !enabledLocationIds.every((id) => locationIds.has(id))) return false;
  const enabledLocations = new Set(enabledLocationIds);
  if (!players.every((player) => player.locationId === undefined ||
      (typeof player.locationId === 'string' && locationIds.has(player.locationId) &&
        (enabledLocations.size === 0 || enabledLocations.has(player.locationId))))) return false;

  const cards = value.cards as Array<Record<string, unknown>>;
  const instanceIds = new Set(cards.map((card) => card.instanceId as string));
  const definitions = pack.cards as Record<string, unknown>;
  if (instanceIds.size !== cards.length || !cards.every((card) => playerIds.has(card.ownerPlayerId as string) &&
      playerIds.has(card.controllerPlayerId as string) && (packKind === 'trusted_authoring_fixture' ||
        Object.prototype.hasOwnProperty.call(definitions, card.definitionId as string)))) return false;

  const eventCatalog = isRestoreRecord(pack.eventCatalog) ? pack.eventCatalog : {};
  const eventIds = new Set([...eventCardById.keys(), ...Object.keys(eventCatalog)]);
  const eventArrays = ['eventDeck','eventOutsideGame'] as const;
  for (const key of eventArrays) {
    if (value[key] !== undefined && (!isRestoreStringArray(value[key]) || !(value[key] as string[]).every((id) => eventIds.has(id)))) return false;
  }
  for (const key of ['situationDeck','situationDiscardPile','burnedSituationCardIds'] as const) {
    if (value[key] !== undefined && !isRestoreStringArray(value[key])) return false;
  }
  if (value.currentSituationCardId !== undefined && typeof value.currentSituationCardId !== 'string') return false;
  if (value.currentSituationModifiers !== undefined && (!Array.isArray(value.currentSituationModifiers) || !value.currentSituationModifiers.every(isRestoreRecord))) return false;

  if (!value.eventPlacements.every((entry) => isRestoreEventPlacement(entry, locationIds, playerIds, eventIds))) return false;
  const cardsByInstance = new Map(cards.map((card) => [card.instanceId as string, card] as const));
  const restoredEventPlacements = value.eventPlacements as Array<Record<string, unknown>>;
  if (!isRestoreAbilityRuntimeReferences(abilityRuntime, playerIds, locationIds, cardsByInstance, pack, restoredEventPlacements)) return false;
  if (value.eventDiscardPile !== undefined && (!Array.isArray(value.eventDiscardPile) ||
      !value.eventDiscardPile.every((entry) => isRestoreEventPlacement(entry, locationIds, playerIds, eventIds, true)))) return false;
  if (value.battleDeclarations !== undefined && (!Array.isArray(value.battleDeclarations) || !value.battleDeclarations.every((entry) =>
      isRestoreRecord(entry) && typeof entry.battlefieldId === 'string' && locationIds.has(entry.battlefieldId)))) return false;
  if (value.battleSkillEffects !== undefined && (!Array.isArray(value.battleSkillEffects) || !value.battleSkillEffects.every((entry) =>
      isRestoreRecord(entry) && typeof entry.sourceCardDefinitionId === 'string' && Object.prototype.hasOwnProperty.call(definitions, entry.sourceCardDefinitionId) &&
      typeof entry.ownerPlayerId === 'string' && playerIds.has(entry.ownerPlayerId) && typeof entry.skillId === 'string' &&
      (entry.combatModifiers === undefined || (Array.isArray(entry.combatModifiers) && entry.combatModifiers.every(isRestoreRecord)))))) return false;
  if (!value.battleResults.every((entry) => isRestoreBattleResult(entry, locationIds, playerIds))) return false;
  if (value.contentRuntime !== undefined && !isRestoreContentRuntime(value.contentRuntime, locationIds, eventIds)) return false;
  if (value.scoringBreakdown !== undefined && !isRestoreScoringBreakdown(value.scoringBreakdown, playerIds)) return false;
  if (value.ruleOverrides !== undefined && !isRestoreRuleOverrides(value.ruleOverrides, playerIds, locationIds)) return false;
  if (!value.effectStack.every((entry) => isRestoreEffectStackItem(entry, playerIds))) return false;
  const restoredState = value as unknown as GameState;
  if (!isDeferredAbilityRuntimeProvenanceValidForRestore(restoredState)) return false;
  if (restoredState.abilityRuntime?.pendingDecision &&
      !isCanonicalGenericPendingDecisionForRestore(restoredState, restoredState.abilityRuntime.pendingDecision)) return false;
  return true;
}

function isRestoreLogEntry(value: unknown): value is MatchSessionLogEntry {
  if (!isRestoreRecord(value) || typeof value.id !== 'string' || !Number.isSafeInteger(value.round) ||
      (value.round as number) < 1 || typeof value.phase !== 'string' || !validReplayPhases.has(value.phase) ||
      typeof value.type !== 'string' || typeof value.message !== 'string') return false;
  if (value.playerId !== undefined && typeof value.playerId !== 'string') return false;
  return value.payload === undefined || isRestoreRecord(value.payload);
}

function isRestoreRejection(value: unknown): value is NonNullable<DispatchResult['rejection']> {
  return isRestoreRecord(value) && typeof value.code === 'string' && typeof value.message === 'string' &&
    (value.allowedOperations === undefined || Array.isArray(value.allowedOperations));
}

function exactRestoreUnknown(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
      left.every((entry, index) => exactRestoreUnknown(entry, right[index]));
  }
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key, index) =>
      key === rightKeys[index] && exactRestoreUnknown(leftRecord[key], rightRecord[key]));
  }
  return Object.is(left, right);
}

function restoreBattleLoserIds(battle: GameState['battleResults'][number]): string[] {
  const suppressed = new Set(battle.lossEffectSuppressedPlayerIds ?? []);
  if ((battle.participantBreakdowns?.length ?? 0) > 0) {
    return battle.participantBreakdowns
      .map((participant) => participant.playerId)
      .filter((playerId) => !battle.winnerPlayerIds.includes(playerId) && !suppressed.has(playerId));
  }
  return battle.militaryAdjustments
    .filter((adjustment) => adjustment.delta < 0 && !suppressed.has(adjustment.playerId))
    .map((adjustment) => adjustment.playerId);
}

function stableRestoreUnique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function isRestoreDelayedActivationProvenance(
  state: GameState,
  battleHistory: GameState['battleResults'],
  logs: MatchSessionLogEntry[],
): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return true;
  const delayed = runtime.pendingDelayedActivations ?? [];
  const seen = new Set<string>();
  for (const entry of delayed) {
    const key = `${entry.sourceCardId}:${entry.abilityId}:${entry.round}`;
    if (seen.has(key) || entry.round !== state.round.roundNumber || !runtime.processedEvents.includes(entry.triggerEventId)) return false;
    seen.add(key);

    const dispatchedIndex = logs.findIndex((log) =>
      log.type === 'battle_first_loss_event_dispatched' && log.round === entry.round && log.message === entry.triggerEventId);
    if (dispatchedIndex < 0) return false;
    const dispatched = logs[dispatchedIndex]!;
    if (!isRestoreRecord(dispatched.payload)) return false;
    const phaseId = dispatched.payload.battlePhaseResolutionId;
    const battleId = dispatched.payload.battleId;
    const resultId = dispatched.payload.resultId;
    const battlefieldId = dispatched.payload.battlefieldId;
    const playerId = dispatched.payload.playerId;
    if (phaseId !== `battle-phase:${entry.round}` || typeof battleId !== 'string' || typeof resultId !== 'string' ||
        typeof battlefieldId !== 'string' || playerId !== entry.controllerId ||
        resultId !== `${battleId}:result` || entry.triggerEventId !== `${resultId}:first-loss:${entry.controllerId}`) return false;

    const battlePrefix = `${phaseId}:battle:${battlefieldId}:`;
    if (!battleId.startsWith(battlePrefix)) return false;
    const ordinalText = battleId.slice(battlePrefix.length);
    if (!/^[1-9]\d*$/.test(ordinalText)) return false;
    const ordinal = Number(ordinalText);
    if (!Number.isSafeInteger(ordinal) || ordinal > battleHistory.length) return false;
    const battle = battleHistory[ordinal - 1];
    if (!battle || battle.battlefieldId !== battlefieldId || !restoreBattleLoserIds(battle).includes(entry.controllerId)) return false;
    if (battleHistory.slice(0, ordinal - 1).some((priorBattle) => restoreBattleLoserIds(priorBattle).includes(entry.controllerId))) return false;

    const barrierIndex = logs.findIndex((log) =>
      log.type === 'battle_post_scoring_barrier_open' && log.round === entry.round && log.message === phaseId &&
      isRestoreRecord(log.payload) && log.payload.battlePhaseResolutionId === phaseId &&
      Array.isArray(log.payload.resultIds) && log.payload.resultIds.includes(resultId) &&
      Array.isArray(log.payload.scoredBattlefieldIds) && log.payload.scoredBattlefieldIds.includes(battlefieldId));
    if (barrierIndex < 0 || barrierIndex >= dispatchedIndex) return false;
  }
  return true;
}

function isRestoreDeferredBattleProvenance(
  state: GameState,
  battleHistory: GameState['battleResults'],
  logs: MatchSessionLogEntry[],
): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return true;
  if (!isRestoreDelayedActivationProvenance(state, battleHistory, logs)) return false;
  const pending = runtime.pendingPostBattleEvents ?? [];
  const terminal = runtime.pendingBattleTerminalEvent;
  if (!terminal) return pending.length === 0;
  if (terminal.type !== 'after_battle_ended' || typeof terminal.battlePhaseResolutionId !== 'string' ||
      !Array.isArray(terminal.battleIds) || !Array.isArray(terminal.resultIds) || !Array.isArray(terminal.scoringReceiptIds) ||
      !Array.isArray(terminal.battleParticipantIds) || !Array.isArray(terminal.battleOutcomes) ||
      runtime.processedEvents.includes(terminal.id)) return false;

  const phaseId = `battle-phase:${state.round.roundNumber}`;
  if (terminal.battlePhaseResolutionId !== phaseId || terminal.id !== `${phaseId}:after_battle_ended` ||
      terminal.battleIds.length !== terminal.resultIds.length || terminal.battleIds.length !== terminal.scoringReceiptIds.length ||
      terminal.battleIds.length !== terminal.battleOutcomes.length) return false;

  const canonicalQueue: AbilityEvent[] = [];
  const terminalParticipantIds: string[] = [];
  let firstOrdinal: number | undefined;
  let priorOrdinal = 0;
  const battlefieldIds: string[] = [];
  for (let index = 0; index < terminal.battleIds.length; index += 1) {
    const battleId = terminal.battleIds[index]!;
    const resultId = terminal.resultIds[index]!;
    const receiptId = terminal.scoringReceiptIds[index]!;
    const outcome = terminal.battleOutcomes[index]!;
    const battlefieldId = outcome.battlefieldId;
    if (typeof battlefieldId !== 'string') return false;
    const prefix = `${phaseId}:battle:${battlefieldId}:`;
    if (!battleId.startsWith(prefix)) return false;
    const ordinalText = battleId.slice(prefix.length);
    if (!/^[1-9]\d*$/.test(ordinalText)) return false;
    const ordinal = Number(ordinalText);
    if (!Number.isSafeInteger(ordinal) || ordinal > battleHistory.length || (priorOrdinal !== 0 && ordinal !== priorOrdinal + 1)) return false;
    firstOrdinal ??= ordinal;
    priorOrdinal = ordinal;
    const battle = battleHistory[ordinal - 1];
    if (!battle || battle.battlefieldId !== battlefieldId || resultId !== `${battleId}:result` ||
        receiptId !== `${phaseId}:score:${battlefieldId}`) return false;
    battlefieldIds.push(battlefieldId);

    const loserIds = restoreBattleLoserIds(battle);
    const participants = stableRestoreUnique([...battle.winnerPlayerIds, ...loserIds]);
    const participantBreakdownIds = battle.participantBreakdowns?.map((participant) => participant.playerId) ?? [];
    const terminalParticipants = participantBreakdownIds.length ? participantBreakdownIds : participants;
    terminalParticipantIds.push(...terminalParticipants);
    const outcomeRecord = outcome as unknown as Record<string, unknown>;
    const expectedOutcome: Record<string, unknown> = {
      battlefieldId,
      winnerPlayerIds: stableRestoreUnique(battle.winnerPlayerIds),
    };
    if (Object.prototype.hasOwnProperty.call(outcomeRecord, 'participantPlayerIds')) {
      expectedOutcome.participantPlayerIds = stableRestoreUnique(terminalParticipants);
    }
    if (!exactRestoreUnknown(outcome, expectedOutcome)) return false;

    const resultEvent: AbilityEvent = {
      id: resultId,
      type: 'after_battle_result_determined',
      battlePhaseResolutionId: phaseId,
      battleId,
      resultId,
      battleParticipantIds: participants,
      battlefieldId,
      battleResult: { winners: [...battle.winnerPlayerIds], loserIds },
    };
    const pendingResultEvent = pending.find((event) => event.id === resultId);
    if (pendingResultEvent && Object.prototype.hasOwnProperty.call(pendingResultEvent, 'battleParticipantPowers')) {
      resultEvent.battleParticipantPowers = Object.fromEntries((battle.participantBreakdowns ?? [])
        .filter((participant) => participants.includes(participant.playerId))
        .map((participant) => [participant.playerId, participant.effectivePower]));
    }
    canonicalQueue.push(resultEvent);
    for (const playerId of loserIds) {
      const priorLosses = battleHistory.slice(0, ordinal - 1)
        .filter((priorBattle) => restoreBattleLoserIds(priorBattle).includes(playerId)).length;
      if (priorLosses !== 0) continue;
      canonicalQueue.push({
        id: `${resultId}:first-loss:${playerId}`,
        type: 'after_controller_first_loses_battle',
        battlePhaseResolutionId: phaseId,
        battleId,
        resultId,
        battleParticipantIds: participants,
        playerId,
        battlefieldId,
        lossOrdinal: 1,
      });
    }
  }

  if (terminal.battleIds.length > 0) {
    if (priorOrdinal !== battleHistory.length || firstOrdinal === undefined) return false;
    const barrier = [...logs].reverse().find((entry) =>
      entry.type === 'battle_post_scoring_barrier_open' && entry.round === state.round.roundNumber && entry.message === phaseId);
    if (!barrier || !isRestoreRecord(barrier.payload) || barrier.payload.battlePhaseResolutionId !== phaseId ||
        !exactRestoreUnknown(barrier.payload.resultIds, terminal.resultIds) ||
        !exactRestoreUnknown(barrier.payload.scoredBattlefieldIds, battlefieldIds)) return false;
  }
  if (!exactRestoreUnknown(terminal.battleParticipantIds, stableRestoreUnique(terminalParticipantIds))) return false;
  const remainingCanonical = canonicalQueue.filter((event) => !runtime.processedEvents.includes(event.id));
  return exactRestoreUnknown(pending, remainingCanonical);
}

function isRestoreReplayEntry(value: unknown): value is MatchClientState['replay'][number] {
  return isRestoreRecord(value) && typeof value.id === 'string' && /^checkpoint:\d+$/.test(value.id) &&
    Number.isSafeInteger(value.round) && (value.round as number) >= 1 &&
    typeof value.phase === 'string' && validReplayPhases.has(value.phase) &&
    Number.isSafeInteger(value.revision) && (value.revision as number) >= 0 &&
    typeof value.label === 'string';
}

function isRestoreReplaySnapshot(value: unknown, packKind: MatchSessionRestorePackKind): value is MatchReplayStateSnapshot {
  if (!isRestoreRecord(value) || typeof value.checkpointId !== 'string' || !/^checkpoint:\d+$/.test(value.checkpointId) ||
      !isRestoreGameState(value.state, packKind) || !Array.isArray(value.logs) || !value.logs.every(isRestoreLogEntry) ||
      !Array.isArray(value.battleHistory) || !value.battleHistory.every((entry) => isRestoreBattleResult(entry)) ||
      !Number.isSafeInteger(value.consumedDirectiveCount) || (value.consumedDirectiveCount as number) < 0) return false;
  if (value.stopReason !== undefined && (typeof value.stopReason !== 'string' || !validPauseReasons.has(value.stopReason))) return false;
  if (value.rejection !== undefined && !isRestoreRejection(value.rejection)) return false;
  if (!isRestoreDeferredBattleProvenance(
    value.state as GameState,
    value.battleHistory as GameState['battleResults'],
    value.logs as MatchSessionLogEntry[],
  )) return false;
  return true;
}

function hasCoherentReplayRestoreEnvelope(
  replay: unknown,
  replaySnapshots: unknown,
  packKind: MatchSessionRestorePackKind,
): replay is MatchClientState['replay'] {
  if (!Array.isArray(replay) || !Array.isArray(replaySnapshots) || replay.length !== replaySnapshots.length) return false;
  if (!replay.every(isRestoreReplayEntry) || !replaySnapshots.every((entry) => isRestoreReplaySnapshot(entry, packKind))) return false;
  for (let index = 0; index < replay.length; index++) {
    const replayEntry = replay[index]!;
    const replaySnapshot = replaySnapshots[index]! as MatchReplayStateSnapshot;
    const expectedId = `checkpoint:${index + 1}`;
    const expectedRevision = replaySnapshot.state.abilityRuntime?.revision ?? 0;
    if (replayEntry.id !== expectedId || replaySnapshot.checkpointId !== expectedId ||
        replayEntry.round !== replaySnapshot.state.round.roundNumber ||
        replayEntry.phase !== replaySnapshot.state.round.activePhase ||
        replayEntry.revision !== expectedRevision) return false;
  }
  return true;
}
const masterCharacters = Object.values(runtimeContent.rules.characters).filter((character) => character.kind === 'master');
const servantCharacters = Object.values(runtimeContent.rules.characters).filter((character) => character.kind === 'servant');

const attributeTags = {
  strength: '力量',
  agility: '敏捷',
  magecraft: '魔术',
  magic: '魔术',
  special: '特殊',
  noble_phantasm: '宝具',
} as const;

const nonClimaxSituations: MatchSituationDefinition[] = [
  { id: 'situation.turning_point', name: '转机', mana: 2, desc: '于深山町和新都各增加一张正面事件牌。恢复2点魔力', extraEvents: [{ locationId: 'miyama_town', visibility: 'public' }, { locationId: 'shinto', visibility: 'public' }] },
  { id: 'situation.battle_of_shinto', name: '新都之战', mana: 2, desc: '于新都增加一张正面事件牌。恢复2点魔力', extraEvents: [{ locationId: 'shinto', visibility: 'public' }] },
  { id: 'situation.miyama_murderer', name: '深山町的杀人魔', mana: 2, desc: '于深山町增加一张正面事件牌。恢复2点魔力', extraEvents: [{ locationId: 'miyama_town', visibility: 'public' }] },
  { id: 'situation.furious', name: '怒不可遏', mana: 2, desc: '力量攻击于深山町和新都获得威力+2。恢复两点魔力', battleModifiers: [{ sourceId: 'situation.furious', targetTag: '力量', value: 2 }] },
  { id: 'situation.calm_before_storm', name: '暴风雨前的宁静', mana: 2, desc: '敏捷攻击于深山町和新都获得威力+2。恢复两点魔力', battleModifiers: [{ sourceId: 'situation.calm_before_storm', targetTag: '敏捷', value: 2 }] },
  { id: 'situation.perfect_flow', name: '完美的流动', mana: 2, desc: '魔术攻击于深山町和新都获得威力+2。恢复两点魔力', battleModifiers: [{ sourceId: 'situation.perfect_flow', targetTag: '魔术', value: 2 }] },
  { id: 'situation.angra_mainyu_substance', name: '安哥拉·曼纽的实质', mana: 0, desc: '魔术攻击于深山町和新都获得威力+1。宝具禁止使用', battleModifiers: [{ sourceId: 'situation.angra_mainyu_substance', targetTag: '魔术', value: 1 }], forbidAttributes: ['宝具'] },
  { id: 'situation.angra_mainyu_shadow', name: '安哥拉·曼纽的阴影', mana: 0, desc: '敏捷攻击于深山町和新都获得威力+1。宝具禁止使用', battleModifiers: [{ sourceId: 'situation.angra_mainyu_shadow', targetTag: '敏捷', value: 1 }], forbidAttributes: ['宝具'] },
  { id: 'situation.angra_mainyu_curse', name: '安哥拉·曼纽的诅咒', mana: 0, desc: '力量攻击于深山町和新都获得威力+1。宝具禁止使用', battleModifiers: [{ sourceId: 'situation.angra_mainyu_curse', targetTag: '力量', value: 1 }], forbidAttributes: ['宝具'] },
  { id: 'situation.longing_for_future', name: '对未来的憧憬', mana: 0, desc: '位于深山町和新都的玩家，若其所有攻击至少有一种属性相同，则合计威力+3。', battleModifiers: [{ sourceId: 'situation.longing_for_future', targetTag: 'same_attribute', value: 3, condition: 'has_repeated_attribute' }] },
];

const climaxSituations: MatchSituationDefinition[] = [
  { id: 'situation.fate_night', name: '命运之夜', mana: 4, isClimax: true, minimumRemainingPlayers: 4, desc: '高潮：剩余4+人。于深山町和新都增加一张正面事件牌。恢复魔力4点', extraEvents: [{ locationId: 'miyama_town', visibility: 'public' }, { locationId: 'shinto', visibility: 'public' }] },
  { id: 'situation.gate_of_hell', name: '身处地狱之门', mana: 4, isClimax: true, minimumRemainingPlayers: 3, desc: '高潮：剩余3+人。无法部署/进入新都与侦察。魔术工房仅限一人部署。于深山町增加一张正面事件牌。恢复魔力4点', extraEvents: [{ locationId: 'miyama_town', visibility: 'public' }], deploymentLimitOnly: { magic_workshop: 1 }, closedLocations: ['shinto', 'recon'] },
  { id: 'situation.heavens_cup', name: '天之杯', mana: 6, isClimax: true, minimumRemainingPlayers: 2, desc: '高潮：剩余2+人。关闭新都，无法部署/进入新都与侦察。魔术工房仅限一人部署。于深山町增加两张正面事件牌。恢复魔力6点', extraEvents: [{ locationId: 'miyama_town', visibility: 'public' }, { locationId: 'miyama_town', visibility: 'public' }], deploymentLimitOnly: { magic_workshop: 1 }, closedLocations: ['shinto', 'recon'] },
];

const situationById = new Map([...nonClimaxSituations, ...climaxSituations].map((situation) => [situation.id, situation] as const));
const eventCards = (contentLibrary as { cards?: RuntimeEventCard[] }).cards ?? [];
const eventCardById = new Map(eventCards.filter((card) => card.id.startsWith('event.')).map((card) => [card.id, card] as const));
const eventDeckTemplate = ((contentLibrary as { eventSets?: Array<{ id: string; cardIds: string[] }> }).eventSets ?? [])
  .find((set) => set.id === 'event-set.waxing_moon_ritual')?.cardIds ?? [];

function nextRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const random = nextRandom(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

function modeStateOf(state: GameState): Record<string, unknown> {
  const carrier = state as unknown as { modeState?: Record<string, unknown> };
  carrier.modeState ??= {};
  return carrier.modeState;
}

function eventVictoryPoints(eventCardId: string): number | undefined {
  const reward = eventCardById.get(eventCardId)?.printedReward;
  return typeof reward === 'number' ? reward : undefined;
}

function eventBattleModifiers(eventCardId: string): Array<{ sourceId: string; targetTag: string; value: number; condition?: 'has_attribute' | 'lacks_attribute' }> {
  const effects = eventCardById.get(eventCardId)?.effects ?? [];
  const modifiers: Array<{ sourceId: string; targetTag: string; value: number; condition?: 'has_attribute' | 'lacks_attribute' }> = [];
  for (const effect of effects) {
    const type = String(effect.type ?? '');
    const sourceId = eventCardId;
    const targetTag = attributeTags[String(effect.attribute ?? '') as keyof typeof attributeTags];
    const amount = Number(effect.amount ?? 0);
    if (!targetTag || !amount) continue;
    if (type === 'attribute_power_bonus' && !effect.condition) modifiers.push({ sourceId, targetTag, value: amount, condition: 'has_attribute' });
    if (type === 'non_attribute_power_modifier') modifiers.push({ sourceId, targetTag, value: amount, condition: 'lacks_attribute' });
  }
  return modifiers;
}

function eventForbiddenAttributes(eventCardId: string): string[] {
  const effects = eventCardById.get(eventCardId)?.effects ?? [];
  return effects.flatMap((effect) => {
    if (String(effect.type ?? '') !== 'forbid_basic_attack_attribute_use') return [];
    const tag = attributeTags[String(effect.attribute ?? '') as keyof typeof attributeTags];
    return tag ? [tag] : [];
  });
}

function eventReturnsToDeck(eventCardId: string): boolean {
  return (eventCardById.get(eventCardId)?.effects ?? [])
    .some((effect) => String(effect.type ?? '') === 'return_to_event_deck_instead_of_discard_or_removal');
}

function eventHasHostAdjudicatedEffects(eventCardId: string): boolean {
  const automatic = new Set(['attribute_power_bonus', 'non_attribute_power_modifier', 'forbid_basic_attack_attribute_use', 'return_to_event_deck_instead_of_discard_or_removal']);
  return (eventCardById.get(eventCardId)?.effects ?? [])
    .some((effect) => !automatic.has(String(effect.type ?? '')));
}

function visibleScope(zone: string, ownerPlayerId: string) {
  return zone === 'field' || zone === 'attack_area' || zone === 'master'
    ? { scope: 'public' as const }
    : { scope: 'owner_only' as const, ownerPlayerId };
}

function actionFingerprint(state: GameState): string {
  return JSON.stringify({
    round: state.round.roundNumber,
    phase: state.round.activePhase,
    prioritySeat: state.round.prioritySeat,
    pendingDecision: state.abilityRuntime?.pendingDecision?.id,
    responseWindow: state.abilityRuntime?.responseWindows[0]?.id,
    hostRequests: state.abilityRuntime?.hostRequests.length ?? 0,
    cards: state.cards.map((card) => [card.instanceId, card.zone, card.visibility.scope]).sort(),
    players: state.players.map((player) => [player.id, player.mana, player.vp, player.militaryResult, player.locationId]),
    stagedAttacks: modeStateOf(state).stagedAttacks,
  });
}

function legalActionToCommand(action: LegalAction): AbilityCommand {
  if (action.type === 'choose_target') {
    return { type: 'choose_target', decisionId: action.decisionId, selectedIds: action.candidates.slice(0, action.min) };
  }
  if (action.type === 'activate_ability') {
    const variables = Object.fromEntries((action.variableCosts ?? []).map((cost) => [cost.name, cost.min]));
    return { ...action, ...(Object.keys(variables).length ? { variables } : {}) };
  }
  return action;
}

function chooseAiAction(actions: LegalAction[]): LegalAction | undefined {
  return actions.find((action) => action.type === 'deploy_player')
    ?? actions.find((action) => action.type === 'choose_target')
    ?? actions.find((action) => action.type === 'decline_this_window')
    ?? actions.find((action) => action.type === 'play_card' && !action.faceDown)
    ?? actions.find((action) => action.type === 'play_card')
    ?? actions.find((action) => action.type === 'activate_ability' && /mana|command-spell/i.test(action.abilityId));
}

function hasStagedAttacks(state: GameState, playerId: string): boolean {
  const staged = modeStateOf(state).stagedAttacks as Record<string, unknown[]> | undefined;
  return Array.isArray(staged?.[playerId]) && staged[playerId]!.length > 0;
}

function classifyDirective(entry: Record<string, unknown>, consumed: boolean): MatchDirectiveView {
  const directive = String(entry.directive ?? entry.type ?? 'directive');
  const resourceDeck = ['create_independent_deck', 'draw_from_independent_deck', 'adjust_command_seals', 'set_mana']
    .some((token) => directive.includes(token));
  const persistent = ['movement', 'deploy', 'replacement', 'extra_play', 'reverse_dash'].some((token) => directive.includes(token));
  return {
    id: String(entry.id ?? `${entry.controllerId ?? 'host'}:${directive}:${JSON.stringify(entry).length}`),
    ...(typeof entry.controllerId === 'string' ? { controllerId: entry.controllerId } : {}),
    kind: resourceDeck ? 'resource_deck' : persistent ? 'persistent_rule' : consumed ? 'display' : 'host_adjudicated',
    status: consumed ? 'consumed' : 'pending',
    label: directive,
    payload: entry,
  };
}

function zone(state: GameState, id: string, label: string, predicate: (card: GameState['cards'][number]) => boolean, status: MatchZoneProjection['status'] = 'enabled'): MatchZoneProjection {
  const cardIds = state.cards.filter(predicate).map((card) => card.instanceId);
  return { id, label, cardIds, count: cardIds.length, status: cardIds.length ? status : status === 'disabled' ? 'disabled' : 'empty' };
}

function labelCandidate(state: GameState, id: string): { id: string; label: string; kind: 'card' | 'player' | 'location' | 'option'; zone?: string } {
  const card = state.cards.find((candidate) => candidate.instanceId === id);
  if (card) return { id, label: state.abilityRuntime?.pack.cards[card.definitionId]?.name ?? card.definitionId, kind: 'card', zone: card.zone };
  const player = state.players.find((candidate) => candidate.id === id);
  if (player) return { id, label: `Seat ${player.seat}`, kind: 'player' };
  const location = state.map.locations.find((candidate) => candidate.id === id);
  if (location) return { id, label: location.displayName, kind: 'location' };
  return { id, label: id, kind: 'option' };
}

function deploymentLimitFor(state: GameState, locationId: LocationId): number | undefined {
  return (modeStateOf(state).deploymentLimitOnly as Partial<Record<LocationId, number>> | undefined)?.[locationId];
}

function terrainAssignmentsOf(state: GameState): Partial<Record<LocationId, string[]>> {
  const store = modeStateOf(state) as { terrainAssignments?: Partial<Record<LocationId, string[]>> };
  store.terrainAssignments ??= {};
  return store.terrainAssignments;
}

function terrainSlotCount(state: GameState, locationId: LocationId): number {
  return getEnabledLocations(state.map, state.locationConfig)
    .find((location) => location.id === locationId)?.terrainBonuses?.length ?? 0;
}

function assignedTerrainOccupants(state: GameState, locationId: LocationId): string[] {
  const assigned = terrainAssignmentsOf(state)[locationId] ?? [];
  return assigned.filter((playerId) =>
    state.players.some((player) => player.id === playerId && player.status === 'active' && player.locationId === locationId));
}

function projectInteractionWindows(state: GameState, viewerId: string): MatchInteractionWindow[] {
  const view = projectAbilityState(state, viewerId);
  const windows: MatchInteractionWindow[] = [];
  const variableAction = view.legalActions.find((action) => action.type === 'activate_ability' && action.variableCosts?.length);
  if (variableAction?.type === 'activate_ability') {
    windows.push({
      id: `payment:${variableAction.cardInstanceId}:${variableAction.abilityId}`,
      kind: 'payment',
      title: '支付窗口',
      controllerId: viewerId,
      sourceCardInstanceId: variableAction.cardInstanceId,
      min: Math.min(...variableAction.variableCosts!.map((cost) => cost.min)),
      max: Math.max(...variableAction.variableCosts!.map((cost) => cost.max)),
      currentMana: state.players.find((player) => player.id === viewerId)?.mana ?? 0,
      ...(variableAction.variableCosts ? { variableCosts: variableAction.variableCosts } : {}),
      legalActions: [variableAction],
    });
  }
  const fixedPaymentAction = view.legalActions.find((action) => action.type === 'play_card' && !action.faceDown);
  if (fixedPaymentAction?.type === 'play_card') {
    const card = state.cards.find((candidate) => candidate.instanceId === fixedPaymentAction.cardInstanceId);
    const cost = card ? Number(state.abilityRuntime?.pack.cards[card.definitionId]?.cardFace.cost ?? 0) : 0;
    if (cost > 0) {
      windows.push({
        id: `fixed-payment:${fixedPaymentAction.cardInstanceId}`,
        kind: 'payment',
        title: '固定额外支付',
        controllerId: viewerId,
        sourceCardInstanceId: fixedPaymentAction.cardInstanceId,
        min: cost,
        max: cost,
        currentMana: state.players.find((player) => player.id === viewerId)?.mana ?? 0,
        legalActions: [fixedPaymentAction],
      });
    }
  }
  if (view.pendingDecision) {
    windows.push({
      id: view.pendingDecision.id,
      kind: 'target',
      title: '选择目标',
      controllerId: viewerId,
      min: view.pendingDecision.min,
      max: view.pendingDecision.max,
      candidates: view.pendingDecision.candidates.map((id) => labelCandidate(state, id)),
      legalActions: view.legalActions.filter((action) => action.type === 'choose_target'),
      ...(view.pendingDecision.template ? {
        template: view.pendingDecision.template, createdRevision: view.pendingDecision.createdRevision,
        visibility: view.pendingDecision.visibility, cancelPolicy: view.pendingDecision.cancelPolicy,
        sourceCardInstanceId: view.pendingDecision.sourceCardInstanceId, abilityId: view.pendingDecision.abilityId,
      } : {}),
    });
  }
  if (view.responseWindow) {
    const runtimeWindow = state.abilityRuntime?.responseWindows.find((candidate) => candidate.id === view.responseWindow?.id);
    const responseCandidates = runtimeWindow?.choices.map((choice) => {
      const card = state.cards.find((candidate) => candidate.instanceId === choice.cardInstanceId);
      const definitionName = card?.definitionId ? state.abilityRuntime?.pack.cards[card.definitionId]?.name : undefined;
      return {
        id: `${choice.cardInstanceId}:${choice.abilityId}`,
        label: `${definitionName ?? choice.cardInstanceId} / ${choice.abilityId}`,
        kind: 'option' as const,
        ...(card?.zone ? { zone: card.zone } : {}),
      };
    });
    windows.push({
      id: view.responseWindow.id,
      kind: 'response',
      title: view.responseWindow.kind === 'choose_unique_trigger' ? '唯一触发选择' : '响应窗口',
      controllerId: viewerId,
      sourceLabel: view.responseWindow.opens,
      ...(responseCandidates?.length ? { candidates: responseCandidates } : {}),
      legalActions: view.legalActions.filter((action) => action.type === 'resolve_response' || action.type === 'decline_this_window'),
    });
  }
  return windows;
}

export class MatchSession {
  readonly seed: number;
  readonly humanPlayerId: string;
  readonly humanPlayerIds: string[];
  readonly maxActionsPerPlayer: number;
  private readonly persistenceSecret: string;
  private readonly persistenceScope: string;
  private readonly restorePackKind: MatchSessionRestorePackKind;
  state: GameState;
  pairings: Array<{ playerId: string; seat: number; master: ExecutableCharacterDefinition; servant: ExecutableCharacterDefinition }>;
  rawCards: Map<string, RuntimeRawCard>;
  logs: MatchSessionLogEntry[] = [];
  replay: MatchClientState['replay'] = [];
  replaySnapshots: MatchReplayStateSnapshot[] = [];
  battleHistory: GameState['battleResults'] = [];
  stopReason: MatchPauseReason | undefined;
  rejection: DispatchResult['rejection'] | undefined;
  private consumedDirectiveCount = 0;
  private seenFingerprints = new Map<string, number>();
  private replayCaptureEnabled = true;

  constructor(
    config: MatchSessionConfig = {},
    initializeReplay = true,
  ) {
    this.replayCaptureEnabled = initializeReplay;
    this.seed = config.seed ?? 20260904;
    this.humanPlayerId = config.humanPlayerId ?? 'p1';
    this.humanPlayerIds = [...new Set(config.humanPlayerIds ?? [this.humanPlayerId])];
    this.maxActionsPerPlayer = config.maxActionsPerPlayer ?? 2;
    this.persistenceSecret = config.persistenceSecret ?? resolveOpponentCloseToOnePersistenceSecret();
    this.persistenceScope = config.persistenceScope ?? createOpponentCloseToOnePersistenceScope();
    this.restorePackKind = config.restorePackKind ?? 'production_executable';
    const built = this.buildInitialState();
    this.state = built.state;
    this.pairings = built.pairings;
    this.rawCards = built.rawCards;
    this.record('session_start', '7-player authoring match session started', { seed: this.seed, pairings: this.pairings.map((p) => ({ playerId: p.playerId, master: p.master.id, servant: p.servant.id })) });
    this.consumeAppliedDirectives();
    if (initializeReplay) this.checkpoint('game start');
    this.replayCaptureEnabled = true;
  }

  getPlayerView(playerId = this.humanPlayerId): AbilityPlayerView {
    return this.projectAbilityView(playerId);
  }

  getState(): GameState {
    return structuredClone(this.state);
  }

  getRestorePackKind(): MatchSessionRestorePackKind {
    return this.restorePackKind;
  }

  getClientProjection(playerId = this.humanPlayerId): MatchClientState {
    return this.projectToClientState(playerId);
  }

  reconcileReplayPersistenceTrust(): void {
    synchronizeOpponentCloseToOneTrustedReplayCheckpoints(
      this.persistenceScope,
      this.replaySnapshots.map((snapshot) => ({
        checkpointId: snapshot.checkpointId,
        checkpointDigest: replayCheckpointDigest(snapshot),
        seal: snapshot.opponentCloseToOneServerAuthority,
      })),
    );
  }

  dispatchPlayerAction(playerId: string, command: AbilityCommand): DispatchResult {
    if (command.type === 'deploy_player') return this.dispatchDeployPlayer(playerId, command.locationId as LocationId);
    const privateInteractionMutation = command.type === 'choose_target' &&
      this.state.abilityRuntime?.pendingDecision?.interaction?.visibility === 'owner_only';
    const result = dispatchAbilityCommand(this.state, playerId, command);
    if (!result.ok && privateInteractionMutation) return result;
    this.rejection = result.rejection;
    const sharedCommand = privateInteractionMutation
      ? { type: 'choose_target', privateSelection: 'redacted' }
      : command as Record<string, unknown>;
    this.record(result.ok ? 'dispatch_ok' : 'dispatch_rejected', `${playerId}:${command.type}`, {
      command: sharedCommand,
      ...(result.events.length ? { events: result.events as unknown as Record<string, unknown>[] } : {}),
      rejection: result.rejection,
    });
    this.consumeAppliedDirectives();
    this.checkpoint(`${playerId}:${command.type}`);
    return result;
  }

  dispatchPlayerCommand(playerId: string, command: AbilityCommand): DispatchResult {
    return this.dispatchPlayerAction(playerId, command);
  }

  legalDeploymentActions(playerId: string): LegalAction[] {
    const player = this.state.players.find((candidate) => candidate.id === playerId && candidate.status === 'active');
    if (!player || this.state.round.activePhase !== 'advance' || this.priorityPlayer()?.id !== playerId || player.locationId) return [];
    const closedLocations = new Set((modeStateOf(this.state).closedLocations as LocationId[] | undefined) ?? []);
    const legalLocations = getEnabledLocations(this.state.map, this.state.locationConfig)
      .filter((location) => !closedLocations.has(location.id))
      .filter((location) => location.id !== 'recon')
      .filter((location) => {
        const occupyingPlayerIds = this.state.players
          .filter((candidate) => candidate.id !== playerId && candidate.status === 'active' && candidate.locationId === location.id)
          .map((candidate) => candidate.id);
        const deploymentLimit = deploymentLimitFor(this.state, location.id);
        if (deploymentLimit !== undefined && occupyingPlayerIds.length >= deploymentLimit) return false;
        return canOccupyLocation({
          map: this.state.map,
          config: this.state.locationConfig,
          locationId: location.id,
          movingPlayerId: playerId,
          occupyingPlayerIds,
          ...(this.state.ruleOverrides ? { ruleOverrides: this.state.ruleOverrides } : {}),
        });
      });
    const prideLocations = this.kaynethPrideDeploymentLocations(playerId, legalLocations.map((location) => location.id));
    const mustBattlefield = this.state.ruleOverrides?.mustDeployToBattlefieldPlayerIds?.includes(playerId);
    const filteredLocations = mustBattlefield ? legalLocations.filter((location) => location.tags.includes('battlefield')) : legalLocations;
    return (prideLocations.length
      ? filteredLocations.filter((location) => prideLocations.includes(location.id))
      : filteredLocations)
      .map((location) => ({ type: 'deploy_player' as const, locationId: location.id }));
  }

  private kaynethPrideDeploymentLocations(playerId: string, legalLocationIds: LocationId[]): LocationId[] {
    const player = this.state.players.find((candidate) => candidate.id === playerId);
    if (!player) return [];
    const hasPride = this.state.cards.some((card) =>
      card.controllerPlayerId === playerId &&
      ['skill', 'field'].includes(card.zone) &&
      (this.state.abilityRuntime?.pack.cards[card.definitionId]?.abilities ?? []).some((ability) =>
        ability.effects.some((effect) =>
          effect.type === 'deployment_rule_override' &&
          effect.rule === 'must_deploy_to_lower_vp_lone_battlefield')));
    if (!hasPride) return [];
    const enabledBattlefields = getEnabledLocations(this.state.map, this.state.locationConfig)
      .filter((location) => location.tags.includes('battlefield'))
      .map((location) => location.id);
    return [...new Set(this.state.players
      .filter((candidate) =>
        candidate.id !== playerId &&
        candidate.status === 'active' &&
        candidate.locationId &&
        enabledBattlefields.includes(candidate.locationId) &&
        legalLocationIds.includes(candidate.locationId) &&
        candidate.vp < player.vp &&
        this.state.players.filter((other) =>
          other.status === 'active' &&
          other.locationId === candidate.locationId).length === 1)
      .map((candidate) => candidate.locationId as LocationId))];
  }

  private projectAbilityView(playerId: string): AbilityPlayerView {
    const view = projectAbilityState(this.state, playerId);
    const deploymentActions = this.legalDeploymentActions(playerId);
    return deploymentActions.length
      ? { ...view, legalActions: [...deploymentActions, ...view.legalActions] }
      : view;
  }

  private dispatchDeployPlayer(playerId: string, locationId: LocationId): DispatchResult {
    const view = () => this.projectAbilityView(playerId);
    const rejection = (code: string, message: string): DispatchResult => {
      this.rejection = { code, message };
      this.record('dispatch_rejected', `${playerId}:deploy_player`, { locationId, rejection: this.rejection });
      return {
        ok: false,
        view: view(),
        events: this.state.abilityRuntime?.events ?? [],
        calculations: this.state.abilityRuntime?.calculations.find((entry) => entry.controllerId === playerId)?.lines ?? [],
        rejection: this.rejection,
      };
    };
    const priority = this.priorityPlayer();
    if (!priority || priority.id !== playerId) return rejection('not_priority_player', 'Only the current priority player can deploy');
    if (this.state.round.activePhase !== 'advance') return rejection('wrong_phase', 'Deployment is only available during the advance phase');
    if (this.state.abilityRuntime?.pendingDecision || this.state.abilityRuntime?.responseWindows.length || this.pendingHostDirectives().length) {
      return rejection('pending_window', 'Resolve the current interaction window or host directive before deployment');
    }
    if (!this.legalDeploymentActions(playerId).some((action) => action.type === 'deploy_player' && action.locationId === locationId)) {
      return rejection('illegal_deployment', 'Selected deployment location is not legal');
    }
    const player = this.state.players.find((candidate) => candidate.id === playerId)!;
    player.locationId = locationId;
    this.rejection = undefined;
    this.record('player_deployed', `${playerId}:deployed to ${locationId}`, { playerId, locationId });
    this.applyDeploymentLocationReward(playerId, locationId);
    const deployedLocation = getEnabledLocations(this.state.map, this.state.locationConfig).find((location) => location.id === locationId);
    if (deployedLocation?.tags.includes('battlefield')) {
      this.assignTerrainOnDeployment(playerId, locationId);
      processAbilityEvent(this.state, { id: `deploy:${this.state.round.roundNumber}:${playerId}`, type: 'after_player_deployed_to_battlefield', playerId, locationId });
    }
    this.consumeAppliedDirectives();
    this.advanceToNextDecision();
    this.checkpoint(`${playerId}:deploy_player`);
    return {
      ok: true,
      view: view(),
      events: this.state.abilityRuntime?.events ?? [],
      calculations: this.state.abilityRuntime?.calculations.find((entry) => entry.controllerId === playerId)?.lines ?? [],
    };
  }

  private assignTerrainOnDeployment(playerId: string, locationId: LocationId): void {
    const slotCount = terrainSlotCount(this.state, locationId);
    if (!slotCount) return;
    const assignments = terrainAssignmentsOf(this.state);
    const current = assignedTerrainOccupants(this.state, locationId).slice(0, slotCount);
    if (current.includes(playerId) || current.length >= slotCount) {
      assignments[locationId] = current;
      return;
    }
    assignments[locationId] = [...current, playerId];
  }

  passPriority(playerId: string): DispatchResult {
    const priority = this.priorityPlayer();
    const rejection = (code: string, message: string): DispatchResult => {
      this.rejection = { code, message };
      this.record('dispatch_rejected', `${playerId}:pass_priority`, { rejection: this.rejection });
      return {
        ok: false,
        view: projectAbilityState(this.state, playerId),
        events: this.state.abilityRuntime?.events ?? [],
        calculations: this.state.abilityRuntime?.calculations.find((entry) => entry.controllerId === playerId)?.lines ?? [],
        rejection: this.rejection,
      };
    };
    if (!priority || priority.id !== playerId) {
      return rejection('not_priority_player', 'Only the current priority player can end this decision');
    }
    if (!interactivePhases.includes(this.state.round.activePhase)) {
      return rejection('wrong_phase', 'Ending the player decision is only available during preparation, advance, action, or battle phases');
    }
    if (this.state.abilityRuntime?.pendingDecision || this.state.abilityRuntime?.responseWindows.length || this.pendingHostDirectives().length || hasStagedAttacks(this.state, playerId)) {
      return rejection('pending_window', 'Resolve the current interaction window or host directive before ending the decision');
    }
    this.rejection = undefined;
    this.record('player_passed', `${playerId}:ended decision`);
    this.advanceToNextDecision();
    this.checkpoint(`${playerId}:pass_priority`);
    return {
      ok: true,
      view: projectAbilityState(this.state, playerId),
      events: this.state.abilityRuntime?.events ?? [],
      calculations: this.state.abilityRuntime?.calculations.find((entry) => entry.controllerId === playerId)?.lines ?? [],
    };
  }

  runAiTurn(playerId: string): MatchPauseReason | undefined {
    const player = this.state.players.find((candidate) => candidate.id === playerId && candidate.status === 'active');
    if (!player) return undefined;
    let hadAnyAction = false;
    for (let attempt = 0; attempt < this.maxActionsPerPlayer; attempt++) {
      const view = this.projectAbilityView(playerId);
      const actions = view.legalActions.filter((action) => action.type === 'deploy_player' || action.type === 'play_card' || action.type === 'activate_ability');
      hadAnyAction ||= actions.length > 0;
      const action = chooseAiAction(actions);
      if (!action) break;
      this.record('ai_decision', `${playerId}:${action.type}`, action as unknown as Record<string, unknown>);
      const result = this.dispatchPlayerAction(playerId, legalActionToCommand(action));
      if (!result.ok) return this.pause('backend_rejection');
      const windowPause = this.autoResolveNonInteractiveWindows();
      if (windowPause) return this.pause(windowPause);
    }
    if (!hadAnyAction) this.record('ai_passed', `${playerId}:no legal action`);
    return undefined;
  }

  autoResolveNonInteractiveWindows(): MatchPauseReason | undefined {
    for (let index = 0; index < 100; index++) {
      if (this.pendingHostDirectives().length) return 'host_directive';
      const owner = this.state.players.find((player) => {
        const view = projectAbilityState(this.state, player.id);
        return view.pendingDecision || view.responseWindow;
      });
      if (!owner) return undefined;
      if (this.isHumanPlayer(owner.id)) return 'human_input';
      const action = chooseAiAction(this.projectAbilityView(owner.id).legalActions);
      if (!action) return 'no_legal_action';
      this.record('ai_decision', `${owner.id}:${action.type}`, action as unknown as Record<string, unknown>);
      const result = this.dispatchPlayerAction(owner.id, legalActionToCommand(action));
      if (!result.ok) return 'backend_rejection';
    }
    return 'state_loop';
  }

  runUntilHumanInputOrRoundEnd(): MatchPauseReason {
    this.stopReason = undefined;
    for (let guard = 0; guard < 300; guard++) {
      const fingerprint = actionFingerprint(this.state);
      const seen = (this.seenFingerprints.get(fingerprint) ?? 0) + 1;
      this.seenFingerprints.set(fingerprint, seen);
      if (seen > 3) return this.pause('state_loop');

      const windowPause = this.autoResolveNonInteractiveWindows();
      if (windowPause) return this.pause(windowPause);
      if (this.state.round.activePhase === 'round_end') return this.pause('round_end');
      if (this.state.round.roundNumber > 11) return this.pause('match_complete');

      if (interactivePhases.includes(this.state.round.activePhase)) {
        const priority = this.priorityPlayer();
        if (!priority) {
          if (this.advanceToNextActiveSeat()) continue;
          this.advanceToNextDecision();
          continue;
        }
        if (this.isHumanPlayer(priority.id)) return this.pause('human_input');
        const aiPause = this.runAiTurn(priority.id);
        if (aiPause) return aiPause;
        this.advanceToNextDecision();
        continue;
      }

      if (this.state.round.activePhase === 'battle') {
        this.resolveBattlePhase();
        continue;
      }

      this.advanceToNextDecision();
    }
    return this.pause('state_loop');
  }

  runFullMatch(options: { maxRounds?: number } = {}): MatchPauseReason {
    const maxRounds = options.maxRounds ?? 11;
    for (let guard = 0; guard < 2000; guard++) {
      const reason = this.runUntilHumanInputOrRoundEnd();
      if (reason === 'human_input') {
        const player = this.priorityPlayer();
        if (!player || player.id !== this.humanPlayerId) return reason;
        const action = chooseAiAction(this.projectAbilityView(this.humanPlayerId).legalActions);
        if (!action) {
          this.record('human_auto_passed', `${this.humanPlayerId}:no legal action`);
          this.advanceToNextDecision();
          continue;
        }
        const result = this.dispatchPlayerAction(this.humanPlayerId, legalActionToCommand(action));
        if (!result.ok) return this.pause('backend_rejection');
        continue;
      }
      if (reason === 'round_end') {
        if (this.state.round.roundNumber >= maxRounds) {
          this.ensureFinalScoring();
          return this.pause('match_complete');
        }
        this.state.round.roundNumber += 1;
        this.startRound(this.state.round.roundNumber);
        continue;
      }
      return reason;
    }
    return this.pause('state_loop');
  }

  runUntilHumanInputOrStop(): MatchPauseReason {
    return this.runUntilHumanInputOrRoundEnd();
  }

  runRound(): MatchPauseReason {
    const targetRound = this.state.round.roundNumber;
    return this.runFullMatch({ maxRounds: targetRound });
  }

  advanceToNextDecision(): void {
    if (this.state.abilityRuntime?.pendingDecision || this.state.abilityRuntime?.responseWindows.length || this.pendingHostDirectives().length) return;
    if (interactivePhases.includes(this.state.round.activePhase)) {
      if (this.advanceToNextActiveSeat()) return;
      if (this.state.round.activePhase === 'preparation') {
        this.state.round.activePhase = 'advance';
        this.state.round.prioritySeat = 1;
        advanceAbilityPhase(this.state, 'advance', this.state.round.roundNumber);
        this.record('phase_started', `round ${this.state.round.roundNumber} advance phase`);
        return;
      }
      if (this.state.round.activePhase === 'advance') {
        this.state.round.activePhase = 'action';
        this.state.round.prioritySeat = 1;
        this.revealShintoEventsAtActionStart(this.state);
        advanceAbilityPhase(this.state, 'action', this.state.round.roundNumber);
        this.record('phase_started', `round ${this.state.round.roundNumber} action phase`);
        return;
      }
      this.resolveBattlePhase();
      return;
    }
    if (this.state.round.activePhase === 'round_end' || this.state.round.activePhase === 'battle') return;
    this.state.round.activePhase = 'action';
  }

  projectToClientState(playerId = this.humanPlayerId): MatchClientState {
    const view = this.projectAbilityView(playerId);
    return {
      matchId: this.state.id,
      contentPack: {
        id: runtimeContent.pack.id,
        version: runtimeContent.pack.version,
        definitionHash: runtimeContent.rules.definitionHash,
      },
      seed: this.seed,
      humanPlayerId: this.humanPlayerId,
      round: this.state.round.roundNumber,
      phase: this.state.round.activePhase,
      priorityPlayerId: this.priorityPlayer()?.id ?? this.humanPlayerId,
      view,
      interactionWindows: projectInteractionWindows(this.state, playerId),
      directives: this.directiveViews(),
      zones: this.projectZones(playerId),
      logs: this.logs.slice(-80),
      replay: this.replay.slice(-40),
      battleBreakdowns: this.battleHistory,
      finalRanking: this.finalRanking(),
      ...(this.stopReason ? { stopReason: this.stopReason } : {}),
      ...(this.rejection ? { rejection: this.rejection } : {}),
    };
  }

  serializeSession(): MatchSessionSnapshot {
    const authorityField = persistedOpponentCloseToOneAuthorityField(this.state, this.persistenceSecret, this.persistenceScope);
    const currentSeal = authorityField.opponentCloseToOneServerAuthority;
    const replayEntries = replayManifestEntries(this.replaySnapshots);
    rememberOpponentCloseToOneTrustedReplayLineage(this.persistenceScope, this.state, replayEntries);
    const replaySensitive = hasOpponentCloseToOneReplayAuthority(currentSeal, this.replaySnapshots);
    const snapshot: MatchSessionSnapshot = {
      version: 1,
      seed: this.seed,
      humanPlayerId: this.humanPlayerId,
      humanPlayerIds: [...this.humanPlayerIds],
      maxActionsPerPlayer: this.maxActionsPerPlayer,
      state: structuredClone(this.state),
      ...authorityField,
      ...(replaySensitive ? {
        opponentCloseToOneReplayManifest: persistOpponentCloseToOneReplayManifest(
          this.state,
          replayEntries,
          this.persistenceSecret,
          this.persistenceScope,
        ),
      } : {}),
      logs: structuredClone(this.logs),
      replay: structuredClone(this.replay),
      replaySnapshots: structuredClone(this.replaySnapshots),
      battleHistory: structuredClone(this.battleHistory),
      ...(this.stopReason ? { stopReason: this.stopReason } : {}),
      ...(this.rejection ? { rejection: structuredClone(this.rejection) } : {}),
    };
    return {
      ...snapshot,
      ...persistDeferredRuntimeStateSeal(
        currentDeferredAuthorityPayload(snapshot),
        this.persistenceSecret,
        this.persistenceScope,
      ),
    };
  }

  consumeDirective(id: string): boolean {
    if (id.startsWith('host:')) {
      const index = Number(id.slice('host:'.length)) - 1;
      const hostRequests = this.state.abilityRuntime?.hostRequests;
      const directive = hostRequests?.[index];
      if (!hostRequests || !directive) return false;
      hostRequests.splice(index, 1);
      this.record('directive_consumed', id, directive as unknown as Record<string, unknown>);
      this.checkpoint(`consume ${id}`);
      return true;
    }
    const directives = this.modeState().masterDirectives as Array<Record<string, unknown>> | undefined;
    const directive = directives?.find((entry, index) => {
      const viewId = classifyDirective({ id: `directive:${index + 1}`, ...entry }, Boolean(entry.consumed)).id;
      const rawId = String(entry.id ?? `${entry.controllerId ?? 'host'}:${entry.directive ?? entry.type}:${JSON.stringify(entry).length}`);
      return viewId === id || rawId === id;
    });
    if (!directive) return false;
    directive.consumed = true;
    this.record('directive_consumed', id, directive);
    this.checkpoint(`consume ${id}`);
    return true;
  }

  restoreToCheckpoint(checkpointId: string): boolean {
    const snapshot = this.replaySnapshots.find((candidate) => candidate.checkpointId === checkpointId);
    if (!snapshot) return false;
    if (!verifyDeferredRuntimeStateSeal(
      replayDeferredAuthorityPayload(snapshot),
      snapshot.deferredRuntimeStateSeal,
      this.persistenceSecret,
      this.persistenceScope,
      checkpointId,
    )) return false;
    const candidateState = structuredClone(snapshot.state);
    const candidateLogs = structuredClone(snapshot.logs);
    const candidateBattleHistory = structuredClone(snapshot.battleHistory);
    const candidateRejection = snapshot.rejection ? structuredClone(snapshot.rejection) : undefined;
    const checkpointDigest = replayCheckpointDigest(snapshot);
    if (!restoreOpponentCloseToOneServerAuthority(
      candidateState,
      snapshot.opponentCloseToOneServerAuthority,
      this.persistenceSecret,
      this.persistenceScope,
      checkpointId,
      checkpointDigest,
    )) return false;
    this.state = candidateState;
    this.logs = candidateLogs;
    this.battleHistory = candidateBattleHistory;
    this.consumedDirectiveCount = snapshot.consumedDirectiveCount;
    this.stopReason = snapshot.stopReason;
    this.rejection = candidateRejection;
    synchronizeOpponentCloseToOneCurrentTrust(this.state, this.persistenceScope);
    this.record('replay_restored', checkpointId);
    return true;
  }

  private buildInitialState(): { state: GameState; pairings: MatchSession['pairings']; rawCards: MatchSession['rawCards'] } {
    const masters = shuffle(masterCharacters, this.seed);
    const servants = shuffle(servantCharacters, this.seed ^ 0x9e3779b9);
    const pairings = masters.map((master, index) => ({ playerId: `p${index + 1}`, seat: index + 1, master, servant: servants[index]! }));
    const pack = runtimeContent.rules;
    const rawCards = new Map<string, RuntimeRawCard>(Object.values(pack.cards).map((card) => [card.id, card] as const));
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4, 5, 6, 7] });
    state.cards = [];
    state.round = { roundNumber: 1, activePhase: 'preparation', prioritySeat: 1 };
    state.id = 'fd-semi-auto-7p';
    this.prepareSituationDeck(state);
    state.eventDeck = shuffle(eventDeckTemplate, this.seed ^ 0x45564e54);
    state.eventDiscardPile = [];
    for (const pairing of pairings) {
      const player = state.players.find((candidate) => candidate.id === pairing.playerId)!;
      player.masterCardId = pairing.master.id;
      player.servantCardId = pairing.servant.id;
      player.mana = 4;
      (player as unknown as { commandSpells: number }).commandSpells = 3;
      for (const character of [pairing.master, pairing.servant]) {
        for (const cardId of character.cardIds) {
          const card = pack.cards[cardId];
          if (!card) throw new Error(`Compiled character ${character.id} references missing card ${cardId}`);
          const zoneName = card.initialZone;
          if (!zoneName) continue;
          state.cards.push({
            instanceId: `${pairing.playerId}-${card.id}`,
            definitionId: card.id,
            ownerPlayerId: pairing.playerId,
            controllerPlayerId: pairing.playerId,
            zone: zoneName,
            visibility: visibleScope(zoneName, pairing.playerId),
          });
        }
      }
      const fallbackCommandSpellId = runtimeContent.rules.fallbackCommandSpells[pairing.master.id];
      if (fallbackCommandSpellId) {
        state.cards.push({
          instanceId: `${pairing.playerId}-${fallbackCommandSpellId}`,
          definitionId: fallbackCommandSpellId,
          ownerPlayerId: pairing.playerId,
          controllerPlayerId: pairing.playerId,
          zone: 'skill',
          visibility: visibleScope('skill', pairing.playerId),
        });
      }
      const compiledDeck = runtimeContent.rules.decks[pairing.servant.id];
      if (!compiledDeck) throw new Error(`Compiled deck missing for ${pairing.servant.id}`);
      const starterDeck = shuffle(compiledDeck, this.seed ^ pairing.seat ^ 0x41545441);
      const copyCountByDefinition = new Map<string, number>();
      for (const definitionId of starterDeck) {
        const copy = (copyCountByDefinition.get(definitionId) ?? 0) + 1;
        copyCountByDefinition.set(definitionId, copy);
        state.cards.push({
          instanceId: `${pairing.playerId}-${definitionId}-${copy}`,
          definitionId,
          ownerPlayerId: pairing.playerId,
          controllerPlayerId: pairing.playerId,
          zone: 'deck',
          visibility: visibleScope('deck', pairing.playerId),
        });
      }
    }
    initializeAbilityRuntime(state, pack, { seed: this.seed });
    processAbilityEvent(state, { id: 'match-session-game-start', type: 'game_start' });
    this.startRound(1, state);
    return { state, pairings, rawCards };
  }

  private prepareSituationDeck(targetState: GameState): void {
    const shuffled = shuffle(nonClimaxSituations.map((situation) => situation.id), this.seed ^ 0x51545541);
    targetState.burnedSituationCardIds = shuffled.slice(0, 2);
    targetState.situationDeck = shuffled.slice(2).concat(climaxSituations.map((situation) => situation.id));
    targetState.situationDiscardPile = [...targetState.burnedSituationCardIds];
    this.record('situation_pre_discard', 'burn two non-climax situations', { burned: targetState.burnedSituationCardIds }, targetState);
  }

  private drawEventCard(targetState: GameState): string | undefined {
    targetState.eventDeck ??= [];
    targetState.eventDiscardPile ??= [];
    if (!targetState.eventDeck.length && targetState.eventDiscardPile.length) {
      targetState.eventDeck = shuffle(targetState.eventDiscardPile.map((event) => event.eventCardId), this.seed ^ targetState.round.roundNumber ^ targetState.eventDiscardPile.length);
      targetState.eventDiscardPile = [];
      this.record('event_deck_recycled', 'event discard shuffled back into deck', { count: targetState.eventDeck.length }, targetState);
    }
    const cardId = targetState.eventDeck.shift();
    if (!cardId) {
      this.record('event_deck_empty', 'no event card available to draw', {}, targetState);
      return undefined;
    }
    this.record('event_drawn', cardId, { remaining: targetState.eventDeck.length }, targetState);
    return cardId;
  }

  private placeEvent(targetState: GameState, locationId: LocationId, visibility: 'public' | 'hidden'): void {
    const eventCardId = this.drawEventCard(targetState);
    if (!eventCardId) return;
    const placement = {
      locationId,
      eventCardId,
      visibility: visibility === 'public' ? { scope: 'public' as const } : { scope: 'hidden_until_trigger' as const },
      battleModifiers: eventBattleModifiers(eventCardId),
    };
    const victoryPoints = eventVictoryPoints(eventCardId);
    if (victoryPoints !== undefined) Object.assign(placement, { victoryPoints });
    targetState.eventPlacements.push(placement);
    this.record('event_placed', `${locationId}:${eventCardId}`, { placement }, targetState);
    if (eventHasHostAdjudicatedEffects(eventCardId)) {
      const modeState = modeStateOf(targetState);
      const masterDirectives = Array.isArray(modeState.masterDirectives) ? modeState.masterDirectives : [];
      masterDirectives.push({
        directive: 'event_effect_host_review',
        eventCardId,
        locationId,
        timing: 'on_event_placed_or_revealed',
        consumed: true,
      });
      modeState.masterDirectives = masterDirectives;
    }
  }

  private applySituation(targetState: GameState, round: number): MatchSituationDefinition {
    const situationId = round <= 8
      ? targetState.situationDeck?.shift()
      : climaxSituations[round - 9]?.id;
    const situation = situationById.get(situationId ?? '') ?? nonClimaxSituations[0]!;
    targetState.currentSituationCardId = situation.id;
    const resolvedSituation = situationById.get(targetState.currentSituationCardId ?? situation.id) ?? situation;
    delete targetState.currentSituationModifiers;
    if (resolvedSituation.battleModifiers) targetState.currentSituationModifiers = resolvedSituation.battleModifiers;
    for (const player of targetState.players) {
      if (player.status === 'active') {
        grantMana(targetState, player.id, resolvedSituation.mana, {
          source: 'situation',
          isClimaxSituation: Boolean(resolvedSituation.isClimax),
        });
      }
    }
    this.record('situation_applied', resolvedSituation.id, {
      name: resolvedSituation.name,
      mana: resolvedSituation.mana,
      isClimax: Boolean(resolvedSituation.isClimax),
      remaining: targetState.situationDeck?.length ?? 0,
    }, targetState);
    return resolvedSituation;
  }

  private applySituationModeState(targetState: GameState, situation: MatchSituationDefinition): void {
    const modeState = modeStateOf(targetState);
    modeState.cardPlayForbids = (situation.forbidAttributes ?? []).map((attribute) => ({
      sourceId: situation.id,
      sourceType: 'situation',
      attribute,
      rule: 'situation_play_forbid',
    }));
    modeState.closedLocations = situation.closedLocations ?? [];
    modeState.deploymentLimitOnly = situation.deploymentLimitOnly ?? {};
  }

  private placeRoundEvents(targetState: GameState, situation: MatchSituationDefinition, round: number): void {
    targetState.eventPlacements = [];
    if (round === 11) {
      this.placeEvent(targetState, 'miyama_town', 'public');
      this.placeEvent(targetState, 'miyama_town', 'public');
      this.placeEvent(targetState, 'miyama_town', 'public');
    } else if (round >= 9) {
      this.placeEvent(targetState, 'miyama_town', 'public');
      this.placeEvent(targetState, 'miyama_town', 'public');
      this.placeEvent(targetState, 'shinto', 'public');
      this.placeEvent(targetState, 'shinto', 'hidden');
    } else {
      this.placeEvent(targetState, 'miyama_town', 'public');
      this.placeEvent(targetState, 'shinto', 'hidden');
    }
    if (round <= 8) {
      for (const extraEvent of situation.extraEvents ?? []) {
        if ((situation.closedLocations ?? []).includes(extraEvent.locationId)) continue;
        this.placeEvent(targetState, extraEvent.locationId, extraEvent.visibility);
      }
    }
    this.refreshEventForbids(targetState);
  }

  private revealShintoEventsAtActionStart(targetState: GameState): void {
    let revealed = 0;
    targetState.eventPlacements = targetState.eventPlacements.map((placement) => {
      if (placement.locationId !== 'shinto' || placement.visibility.scope !== 'hidden_until_trigger') return placement;
      revealed++;
      return { ...placement, visibility: { scope: 'public' as const, revealReason: 'action_start' } };
    });
    if (revealed) this.record('event_revealed', 'shinto action start reveal', { locationId: 'shinto', count: revealed }, targetState);
    this.refreshEventForbids(targetState);
  }

  private refreshEventForbids(targetState: GameState): void {
    const modeState = modeStateOf(targetState);
    const situationForbids = Array.isArray(modeState.cardPlayForbids)
      ? modeState.cardPlayForbids.filter((entry) => (entry as { sourceType?: string }).sourceType === 'situation')
      : [];
    const eventForbids = targetState.eventPlacements
      .filter((placement) => placement.visibility.scope === 'public')
      .flatMap((placement) => eventForbiddenAttributes(placement.eventCardId).map((attribute) => ({
        sourceId: placement.eventCardId,
        sourceType: 'event',
        locationId: placement.locationId,
        attribute,
        rule: 'play_card_attribute',
      })));
    modeState.cardPlayForbids = situationForbids.concat(eventForbids);
  }

  private discardRoundSituationAndEvents(): void {
    if (this.state.currentSituationCardId) {
      this.state.situationDiscardPile = [...(this.state.situationDiscardPile ?? []), this.state.currentSituationCardId];
    }
    const returning = this.state.eventPlacements.filter((placement) => eventReturnsToDeck(placement.eventCardId)).map((placement) => placement.eventCardId);
    const discarding = this.state.eventPlacements.filter((placement) => !eventReturnsToDeck(placement.eventCardId));
    this.state.eventDiscardPile = [...(this.state.eventDiscardPile ?? []), ...discarding];
    this.state.eventDeck = [...(this.state.eventDeck ?? []), ...returning];
    this.record('round_cards_discarded', 'situation and event cards cleaned up', {
      situation: this.state.currentSituationCardId,
      eventDiscarded: discarding.map((event) => event.eventCardId),
      eventReturned: returning,
    });
    delete this.state.currentSituationCardId;
    delete this.state.currentSituationModifiers;
    this.state.eventPlacements = [];
    this.returnRoundEndAttachedCards();
    this.discardRoundAttackAreaCards();
    this.refreshEventForbids(this.state);
  }

  private returnRoundEndAttachedCards(): void {
    const attachments = (modeStateOf(this.state).supportShotAttachments as Array<Record<string, unknown>> | undefined) ?? [];
    const remaining: Array<Record<string, unknown>> = [];
    for (const attachment of attachments) {
      const cardInstanceId = String(attachment.cardInstanceId ?? '');
      const sourceOwnerId = String(attachment.sourceOwnerId ?? '');
      const card = this.state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
      if (!card || attachment.returnAtRoundEnd === false) {
        remaining.push(attachment);
        continue;
      }
      card.zone = 'skill';
      card.controllerPlayerId = sourceOwnerId || card.ownerPlayerId;
      card.visibility = visibleScope('skill', card.ownerPlayerId);
      if (this.state.abilityRuntime?.cardState[card.instanceId]) {
        this.state.abilityRuntime.cardState[card.instanceId]!.active = false;
      }
      clearTransientCardTransformState(this.state, card.instanceId);
      this.record('attached_card_returned', `${card.instanceId}:skill`, { attachment });
    }
    modeStateOf(this.state).supportShotAttachments = remaining;
  }

  private discardRoundAttackAreaCards(): void {
    for (const card of this.state.cards.filter((candidate) => candidate.zone === 'attack_area')) {
      const definition = this.rawCards.get(card.definitionId);
      const abilities = (Array.isArray(definition?.abilities) ? definition.abilities : []) as Array<{ kind?: string; lifecycle?: { cleanup?: string } }>;
      const shouldRemainActive = abilities.some((ability) =>
        ability.kind === 'residual' &&
        !['discard_at_round_end', 'close_at_round_end'].includes(String(ability.lifecycle?.cleanup ?? ''))) ?? false;
      if (shouldRemainActive) continue;
      card.zone = 'discard';
      card.controllerPlayerId = card.ownerPlayerId;
      card.visibility = visibleScope('discard', card.ownerPlayerId);
      if (this.state.abilityRuntime?.cardState[card.instanceId]) {
        this.state.abilityRuntime.cardState[card.instanceId]!.active = false;
      }
      clearTransientCardTransformState(this.state, card.instanceId);
      this.record('attack_area_card_discarded', `${card.instanceId}:discard`, {
        cardInstanceId: card.instanceId,
        definitionId: card.definitionId,
        ownerPlayerId: card.ownerPlayerId,
      });
    }
  }

  private drawToHandLimit(targetState: GameState, playerId: string, limit = 3): void {
    const handCount = targetState.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === 'hand').length;
    const drawCount = Math.max(0, limit - handCount);
    if (!drawCount) return;
    const deck = targetState.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === 'deck');
    const drawn = deck.slice(0, drawCount);
    for (const card of drawn) {
      card.zone = 'hand';
      card.visibility = visibleScope('hand', playerId);
    }
    this.record('cards_drawn', `${playerId}:draw to ${limit}`, { playerId, drawn: drawn.map((card) => card.instanceId), handLimit: limit }, targetState);
  }

  private applyDeploymentLocationReward(playerId: string, locationId: LocationId): void {
    if (locationId !== 'magic_workshop') return;
    const workshopPlayers = this.state.players
      .filter((candidate) => candidate.status === 'active' && candidate.locationId === 'magic_workshop')
      .sort((left, right) => left.seat - right.seat);
    const slotIndex = workshopPlayers.findIndex((candidate) => candidate.id === playerId);
    const manaReward = workshopDeploymentManaSlots[slotIndex] ?? 0;
    if (!manaReward) return;
    const result = grantMana(this.state, playerId, manaReward, { source: 'deployment' });
    this.record('workshop_deployment_mana_awarded', `${playerId}:magic_workshop mana +${result.actualAmount}`, {
      playerId,
      locationId,
      slotIndex,
      printedManaReward: manaReward,
      manaBefore: result.before,
      manaAfter: result.after,
      requestedManaReward: result.requestedAmount,
      appliedManaReward: result.actualAmount,
      overflowManaReward: result.overflowAmount,
    });
  }

  private startRound(round: number, targetState = this.state): void {
    targetState.round = { roundNumber: round, activePhase: 'preparation', prioritySeat: 1 };
    for (const player of targetState.players) {
      delete player.locationId;
    }
    terrainAssignmentsOf(targetState);
    (modeStateOf(targetState) as { terrainAssignments?: Partial<Record<LocationId, string[]>> }).terrainAssignments = {};
    const situation = this.applySituation(targetState, round);
    this.applySituationModeState(targetState, situation);
    this.placeRoundEvents(targetState, situation, round);
    for (const player of targetState.players) {
      if (player.status === 'active') this.drawToHandLimit(targetState, player.id);
    }
    if (targetState.abilityRuntime) advanceAbilityPhase(targetState, 'preparation', round);
    this.record('round_start', `round ${round} started`, { situation: targetState.currentSituationCardId, events: targetState.eventPlacements, closedLocations: modeStateOf(targetState).closedLocations }, targetState);
    this.checkpoint(`round ${round} start`, targetState);
  }

  private battleLoserIds(battle: GameState['battleResults'][number]): string[] {
    const suppressed = new Set(battle.lossEffectSuppressedPlayerIds ?? []);
    if ((battle.participantBreakdowns?.length ?? 0) > 0) {
      return battle.participantBreakdowns!
        .map((participant) => participant.playerId)
        .filter((playerId) => !battle.winnerPlayerIds.includes(playerId) && !suppressed.has(playerId));
    }
    // Compatibility for older/synthetic battle fixtures without participant breakdowns.
    return battle.militaryAdjustments
      .filter((adjustment) => adjustment.delta < 0 && !suppressed.has(adjustment.playerId))
      .map((adjustment) => adjustment.playerId);
  }

  private queuePostScoringBattleEvents(
    battles: GameState['battleResults'],
    freshScoringLogs: GameState['log'],
  ): void {
    const runtime = this.state.abilityRuntime;
    if (!runtime) return;
    const round = this.state.round.roundNumber;
    const battlePhaseResolutionId = `battle-phase:${round}`;
    const scoredBattlefieldIds = freshScoringLogs
      .filter((entry) => entry.type === 'battle_scored')
      .map((entry) => String(entry.payload?.battlefieldId ?? ''))
      .filter(Boolean);
    const expectedBattlefieldIds = battles.map((battle) => battle.battlefieldId);
    if (expectedBattlefieldIds.some((battlefieldId) => !scoredBattlefieldIds.includes(battlefieldId))) {
      throw new Error('Post-scoring battle barrier requires every resolved battlefield scoring receipt');
    }

    const historyBeforePhase = structuredClone(this.battleHistory);
    const pending = runtime.pendingPostBattleEvents ??= [];
    const resultIds: string[] = [];
    const battleIds: string[] = [];
    const battleParticipantIds: string[] = [];
    for (const [index, battle] of battles.entries()) {
      const battleOrdinal = historyBeforePhase.length + index + 1;
      const battleId = `${battlePhaseResolutionId}:battle:${battle.battlefieldId}:${battleOrdinal}`;
      const resultId = `${battleId}:result`;
      battleIds.push(battleId);
      resultIds.push(resultId);
      const loserIds = this.battleLoserIds(battle);
      const participants = [...new Set([...battle.winnerPlayerIds, ...loserIds])];
      const terminalParticipants = battle.participantBreakdowns?.map((participant) => participant.playerId) ?? participants;
      battleParticipantIds.push(...terminalParticipants);
      const resultEvent: AbilityEvent = {
        id: resultId,
        type: 'after_battle_result_determined',
        battlePhaseResolutionId,
        battleId,
        resultId,
        battleParticipantIds: participants,
        battlefieldId: battle.battlefieldId,
        battleResult: { winners: [...battle.winnerPlayerIds], loserIds },
      };
      if (!runtime.processedEvents.includes(resultId) && !pending.some((event) => event.id === resultId)) {
        pending.push(resultEvent);
      }

      for (const playerId of loserIds) {
        const priorLosses = historyBeforePhase
          .concat(battles.slice(0, index))
          .filter((priorBattle) => this.battleLoserIds(priorBattle).includes(playerId)).length;
        if (priorLosses !== 0) continue;
        const firstLossEvent: AbilityEvent = {
          id: `${resultId}:first-loss:${playerId}`,
          type: 'after_controller_first_loses_battle',
          battlePhaseResolutionId,
          battleId,
          resultId,
          battleParticipantIds: participants,
          playerId,
          battlefieldId: battle.battlefieldId,
          lossOrdinal: 1,
        };
        if (!runtime.processedEvents.includes(firstLossEvent.id) && !pending.some((event) => event.id === firstLossEvent.id)) {
          pending.push(firstLossEvent);
        }
      }
      this.battleHistory.push(structuredClone(battle));
    }

    if (battles.length > 0) {
      this.record('battle_post_scoring_barrier_open', battlePhaseResolutionId, {
        battlePhaseResolutionId,
        scoredBattlefieldIds,
        resultIds,
      });
    }
    stageBattleTerminalEvent(this.state, {
      battlePhaseResolutionId,
      battleIds,
      resultIds,
      scoringReceiptIds: battles.map((battle) => `${battlePhaseResolutionId}:score:${battle.battlefieldId}`),
      battleParticipantIds: [...new Set(battleParticipantIds)],
      battleOutcomes: battles.map((battle) => ({ battlefieldId: battle.battlefieldId, winnerPlayerIds: [...battle.winnerPlayerIds] })),
    });
  }

  private flushPostScoringBattleEvents(): void {
    if (!this.state.abilityRuntime) return;
    this.state.abilityRuntime.pendingPostBattleEvents ??= [];
    while ((this.state.abilityRuntime?.pendingPostBattleEvents?.length ?? 0) > 0) {
      const runtime = this.state.abilityRuntime!;
      if (runtime.pendingDecision || runtime.responseWindows.length || runtime.hostRequests.length) return;
      const event = structuredClone(runtime.pendingPostBattleEvents![0]!);
      processAbilityEvent(this.state, event);
      this.state.abilityRuntime!.pendingPostBattleEvents!.shift();
      this.record(
        event.type === 'after_controller_first_loses_battle'
          ? 'battle_first_loss_event_dispatched'
          : 'battle_result_event_dispatched',
        event.id,
        {
          battlePhaseResolutionId: event.battlePhaseResolutionId,
          battleId: event.battleId,
          resultId: event.resultId,
          battlefieldId: event.battlefieldId,
          ...(event.playerId ? { playerId: event.playerId } : {}),
        },
      );
      this.autoResolveNonInteractiveWindows();
    }
    const terminal = flushBattleTerminalEvent(this.state);
    if (terminal) {
      this.record('battle_terminal_event_dispatched', terminal.id, {
        battlePhaseResolutionId: terminal.battlePhaseResolutionId,
        battleIds: terminal.battleIds,
        resultIds: terminal.resultIds,
        scoringReceiptIds: terminal.scoringReceiptIds,
        battleParticipantIds: terminal.battleParticipantIds,
      });
      this.autoResolveNonInteractiveWindows();
    }
  }

  private resolveBattlePhase(): void {
    if (this.state.round.activePhase !== 'battle') {
      advanceAbilityPhase(this.state, 'battle', this.state.round.roundNumber);
    }
    this.flushPostScoringBattleEvents();
    if (this.state.abilityRuntime?.pendingDecision || this.state.abilityRuntime?.responseWindows.length ||
      this.state.abilityRuntime?.hostRequests.length || this.state.abilityRuntime?.pendingPostBattleEvents?.length) return;

    const resolvedBattles: GameState['battleResults'] = [];
    const battlefields = getEnabledLocations(this.state.map, this.state.locationConfig)
      .filter((location) => !((modeStateOf(this.state).closedLocations as string[] | undefined) ?? []).includes(location.id))
      .filter((location) => location.tags.includes('battlefield') || location.rewardHooks.includes('battle_rewards'));
    for (const battlefield of battlefields) {
      if (this.state.abilityRuntime?.pendingDecision || this.state.abilityRuntime?.responseWindows.length) break;
      const before = this.state.battleResults.length;
      Object.assign(this.state, resolveBattlefield(this.state, { battlefieldId: battlefield.id, revealHiddenEvents: true }).nextState);
      if (this.state.battleResults.length > before) {
        const battle = this.state.battleResults[this.state.battleResults.length - 1]!;
        resolvedBattles.push(structuredClone(battle));
        this.record('battle_resolved', battlefield.id, battle as unknown as Record<string, unknown>);
      }
      this.autoResolveNonInteractiveWindows();
    }
    if (!this.state.abilityRuntime?.pendingDecision && !this.state.abilityRuntime?.responseWindows.length) {
      // Linked-owner cards must settle while the resolved battle ledger is still available.
      // applyBattleScoring consumes battleResults, so doing this afterwards would lose owner-loss information.
      Object.assign(this.state, settleLinkedOwnerCardsAfterBattles(this.state, resolvedBattles));
      const scoringLogStart = this.state.log.length;
      Object.assign(this.state, applyBattleScoring(this.state).nextState);
      const freshScoringLogs = this.state.log.slice(scoringLogStart);
      this.queuePostScoringBattleEvents(resolvedBattles, freshScoringLogs);
      this.flushPostScoringBattleEvents();
      if (this.state.abilityRuntime?.pendingDecision || this.state.abilityRuntime?.responseWindows.length ||
        this.state.abilityRuntime?.hostRequests.length || this.state.abilityRuntime?.pendingPostBattleEvents?.length) return;
      advanceAbilityPhase(this.state, 'cleanup', this.state.round.roundNumber);
      this.discardRoundSituationAndEvents();
      advanceAbilityPhase(this.state, 'round_end', this.state.round.roundNumber);
      this.record('round_end', `round ${this.state.round.roundNumber} ended`);
      this.checkpoint(`round ${this.state.round.roundNumber} end`);
    }
  }

  private projectZones(playerId: string): MatchZoneProjection[] {
    const s = this.state;
    const pairing = this.pairings.find((candidate) => candidate.playerId === playerId);
    const ascensionCardIds = (pairing?.master.excludedCards ?? [])
      .map((card) => card.id);
    const own = (zoneName: string) => (card: GameState['cards'][number]) => card.ownerPlayerId === playerId && card.zone === zoneName;
    const mayViewHiddenEvents = canViewFaceDownEvents(s, playerId);
    const visibleEventPlacementIds = s.eventPlacements
      .filter((event) => event.visibility.scope !== 'hidden_until_trigger' || mayViewHiddenEvents)
      .map((event) => event.eventCardId);
    const mayViewOpponentDiscards = canViewOpponentDiscard(s, playerId);
    const opponentDiscardIds = mayViewOpponentDiscards
      ? s.cards.filter((card) => card.ownerPlayerId !== playerId && card.zone === 'discard').map((card) => card.instanceId)
      : [];
    return [
      zone(s, 'master_main', '御主主卡', (card) => card.definitionId === s.players.find((player) => player.id === playerId)?.masterCardId),
      zone(s, 'servant_identity', '从者身份', (card) => card.definitionId === s.players.find((player) => player.id === playerId)?.servantCardId, 'host_adjudicated'),
      zone(s, 'hand', '手牌', own('hand')),
      zone(s, 'servant_deck', '牌库', own('deck')),
      zone(s, 'master_skill', '御主技能区', (card) => own('skill')(card) && this.rawCards.get(card.definitionId)?.cardType === 'master_skill'),
      zone(s, 'servant_skill', '从者技能区', (card) => own('skill')(card) && this.rawCards.get(card.definitionId)?.cardType === 'servant_skill'),
      zone(s, 'command_spell', '令咒区', (card) => own('skill')(card) && this.rawCards.get(card.definitionId)?.cardType === 'command_spell'),
      { id: 'ascension_skill', label: '升华技', cardIds: ascensionCardIds, count: ascensionCardIds.length, status: ascensionCardIds.length ? 'host_adjudicated' : 'empty' },
      zone(s, 'field', '场上', own('field')),
      zone(s, 'attack_area', '攻击区', (card) => own('attack_area')(card) || (card.ownerPlayerId === playerId && card.zone === 'attack_area')),
      zone(s, 'battlefield', '战斗参与区', (card) => ['field', 'attack_area'].includes(card.zone) && card.ownerPlayerId === playerId && ['miyama_town', 'shinto'].includes(s.players.find((player) => player.id === card.controllerPlayerId)?.locationId ?? '')),
      zone(s, 'discard', '弃牌', own('discard')),
      ...(mayViewOpponentDiscards ? [{ id: 'opponent_discard', label: '对手弃牌', cardIds: opponentDiscardIds, count: opponentDiscardIds.length, status: opponentDiscardIds.length ? 'enabled' as const : 'empty' as const }] : []),
      zone(s, 'removed_from_game', '移除', own('removed_from_game')),
      { id: 'event_deck', label: '事件牌库', cardIds: s.eventDeck ?? [], count: (s.eventDeck ?? []).length, status: 'enabled' },
      { id: 'event_placements', label: '事件放置', cardIds: visibleEventPlacementIds, count: s.eventPlacements.length, status: s.eventPlacements.length ? 'enabled' : 'empty' },
      { id: 'event_discard', label: '事件弃牌', cardIds: (s.eventDiscardPile ?? []).map((event) => event.eventCardId), count: s.eventDiscardPile?.length ?? 0, status: s.eventDiscardPile?.length ? 'enabled' : 'empty' },
      { id: 'situation_deck', label: '局势牌库', cardIds: s.situationDeck ?? [], count: (s.situationDeck ?? []).length, status: 'enabled' },
      { id: 'current_situation', label: '当前局势', cardIds: s.currentSituationCardId ? [s.currentSituationCardId] : [], count: s.currentSituationCardId ? 1 : 0, status: s.currentSituationCardId ? 'enabled' : 'empty' },
      { id: 'situation_discard', label: '局势弃牌/烧毁', cardIds: s.situationDiscardPile ?? [], count: (s.situationDiscardPile ?? []).length, status: s.situationDiscardPile?.length ? 'enabled' : 'empty' },
      zone(s, 'generated_cards', '生成牌', (card) => card.zone === 'generated' || card.zone === 'looked_cards'),
      zone(s, 'independent_deck', '独立牌堆', (card) => card.ownerPlayerId === playerId && card.zone === 'independent_deck'),
      { id: 'unowned_servant_pool', label: '无主从者池', cardIds: [], count: 0, status: 'host_adjudicated' },
      { id: 'host_directive_queue', label: 'host/directive 队列', cardIds: [], count: this.pendingHostDirectives().length, status: this.pendingHostDirectives().length ? 'host_adjudicated' : 'empty' },
    ];
  }

  private directiveViews(): MatchDirectiveView[] {
    const directives = (this.modeState().masterDirectives as Array<Record<string, unknown>> | undefined) ?? [];
    const applied = directives.map((entry, index) => classifyDirective({ id: `directive:${index + 1}`, ...entry }, true));
    const host = (this.state.abilityRuntime?.hostRequests ?? []).map((entry, index) => ({
      id: `host:${index + 1}`,
      controllerId: entry.controllerId,
      kind: 'host_adjudicated' as const,
      status: 'pending' as const,
      label: `${entry.sourceCardId}:${entry.abilityId}`,
      payload: entry as unknown as Record<string, unknown>,
    }));
    return [...applied, ...host].filter((entry) => entry.status === 'pending' || entry.id.startsWith('directive:'));
  }

  private pendingHostDirectives(): MatchDirectiveView[] {
    return this.directiveViews().filter((directive) => directive.status === 'pending' && directive.kind === 'host_adjudicated');
  }

  private consumeAppliedDirectives(): void {
    const directives = (this.modeState().masterDirectives as Array<Record<string, unknown>> | undefined) ?? [];
    for (let index = this.consumedDirectiveCount; index < directives.length; index++) {
      this.record('directive_recorded', String(directives[index]!.directive ?? 'directive'), directives[index]);
    }
    this.consumedDirectiveCount = directives.length;
  }

  private priorityPlayer() {
    return this.state.players.find((player) => player.seat === this.state.round.prioritySeat && player.status === 'active');
  }

  private isHumanPlayer(playerId: string): boolean {
    return this.humanPlayerIds.includes(playerId);
  }

  private ensureFinalScoring(): void {
    if (this.logs.some((entry) => entry.type === 'final_scoring')) return;
    this.record('final_scoring', 'match_end', { ranking: this.finalRanking() });
    this.checkpoint('match end');
  }

  private finalRanking(): MatchClientState['finalRanking'] {
    return this.state.players
      .map((player) => ({
        playerId: player.id,
        seat: player.seat,
        vp: player.vp,
        militaryResult: player.militaryResult,
      }))
      .sort((left, right) => right.vp - left.vp || right.militaryResult - left.militaryResult || left.seat - right.seat)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }

  private advanceToNextActiveSeat(): boolean {
    const currentSeat = this.state.round.prioritySeat;
    const next = this.state.players
      .filter((player) => player.status === 'active' && player.seat > currentSeat)
      .sort((left, right) => left.seat - right.seat)[0];
    if (!next) return false;
    this.state.round.prioritySeat = next.seat;
    this.record('priority_changed', `priority seat ${next.seat}`);
    return true;
  }

  private pause(reason: MatchPauseReason): MatchPauseReason {
    this.stopReason = reason;
    this.record('paused', reason);
    return reason;
  }

  private record(type: string, message: string, payload?: Record<string, unknown>, state = this.state): void {
    this.logs.push({
      id: `log:${this.logs.length + 1}`,
      round: state?.round.roundNumber ?? 1,
      phase: state?.round.activePhase ?? 'action',
      type,
      message,
      ...(payload ? { payload } : {}),
    });
  }

  private checkpoint(label: string, state = this.state): void {
    if (!this.replayCaptureEnabled) return;
    const revision = state.abilityRuntime?.revision ?? 0;
    const checkpoint = {
      id: `checkpoint:${this.replay.length + 1}`,
      round: state.round.roundNumber,
      phase: state.round.activePhase,
      revision,
      label,
    };
    this.replay.push(checkpoint);
    const replaySnapshotBase: MatchReplayStateSnapshot = {
      checkpointId: checkpoint.id,
      state: structuredClone(state),
      ...persistedOpponentCloseToOneAuthorityField(state, this.persistenceSecret, this.persistenceScope, checkpoint.id),
      logs: structuredClone(this.logs),
      battleHistory: structuredClone(this.battleHistory),
      consumedDirectiveCount: this.consumedDirectiveCount,
      ...(this.stopReason ? { stopReason: this.stopReason } : {}),
      ...(this.rejection ? { rejection: structuredClone(this.rejection) } : {}),
    };
    const replaySnapshot: MatchReplayStateSnapshot = {
      ...replaySnapshotBase,
      ...persistDeferredRuntimeStateSeal(
        replayDeferredAuthorityPayload(replaySnapshotBase),
        this.persistenceSecret,
        this.persistenceScope,
        checkpoint.id,
      ),
    };
    this.replaySnapshots.push(replaySnapshot);
    rememberOpponentCloseToOneTrustedReplayCheckpoint(
      this.persistenceScope,
      checkpoint.id,
      replayCheckpointDigest(replaySnapshot),
      replaySnapshot.opponentCloseToOneServerAuthority,
    );
    pruneOpponentCloseToOneTrustedReplayTransactions(
      this.persistenceScope,
      this.replaySnapshots.map((candidate) => candidate.checkpointId),
    );
  }

  private modeState(): Record<string, unknown> {
    const state = this.state as unknown as { modeState?: Record<string, unknown> };
    state.modeState ??= {};
    return state.modeState;
  }
}

export function createMatchSession(config?: MatchSessionConfig): MatchSession {
  return new MatchSession(config);
}

export function restoreMatchSession(
  snapshot: MatchSessionSnapshot,
  config: Pick<MatchSessionConfig, 'persistenceSecret' | 'persistenceScope' | 'restorePackKind'> = {},
  reconcileReplayTrust = true,
): MatchSession {
  if (snapshot.version !== 1) throw new Error(`Unsupported MatchSession snapshot version: ${snapshot.version}`);
  const restorePackKind = config.restorePackKind ?? 'production_executable';
  if (!isRestoreGameState(snapshot.state, restorePackKind)) throw new Error('Invalid MatchSession state container');
  if (!hasCoherentReplayRestoreEnvelope(snapshot.replay, snapshot.replaySnapshots, restorePackKind)) {
    throw new Error('Invalid FB2-49 replay snapshot container');
  }
  if (!Array.isArray(snapshot.logs) || !snapshot.logs.every(isRestoreLogEntry) ||
      !Array.isArray(snapshot.battleHistory) || !snapshot.battleHistory.every((entry) => isRestoreBattleResult(entry)) ||
      typeof snapshot.seed !== 'number' || !Number.isFinite(snapshot.seed) || typeof snapshot.humanPlayerId !== 'string' ||
      !isRestoreStringArray(snapshot.humanPlayerIds) || new Set(snapshot.humanPlayerIds).size !== snapshot.humanPlayerIds.length ||
      !snapshot.humanPlayerIds.includes(snapshot.humanPlayerId) ||
      !snapshot.humanPlayerIds.every((playerId) => snapshot.state.players.some((player) => player.id === playerId)) ||
      !Number.isSafeInteger(snapshot.maxActionsPerPlayer) || snapshot.maxActionsPerPlayer < 1 ||
      (snapshot.stopReason !== undefined && (typeof snapshot.stopReason !== 'string' || !validPauseReasons.has(snapshot.stopReason))) ||
      (snapshot.rejection !== undefined && !isRestoreRejection(snapshot.rejection)) ||
      !isRestoreDeferredBattleProvenance(snapshot.state, snapshot.battleHistory, snapshot.logs)) {
    throw new Error('Invalid MatchSession snapshot container');
  }
  const trustedDeferredContext = snapshot.deferredRuntimeStateSeal
    ? trustedDeferredRestoreContextByMac.get(snapshot.deferredRuntimeStateSeal.mac)
    : undefined;
  const persistenceSecret = config.persistenceSecret ?? trustedDeferredContext?.persistenceSecret ?? resolveOpponentCloseToOnePersistenceSecret();
  const persistenceScope = config.persistenceScope ?? trustedDeferredContext?.persistenceScope ?? createOpponentCloseToOnePersistenceScope();
  const candidateState = structuredClone(snapshot.state);
  if (!restoreOpponentCloseToOneServerAuthority(
    candidateState,
    snapshot.opponentCloseToOneServerAuthority,
    persistenceSecret,
    persistenceScope,
  )) throw new Error('Invalid or missing FB2-49 persisted authority');
  const replayCheckpointIds = snapshot.replaySnapshots.map((entry) => entry.checkpointId);
  const replayEntries = replayManifestEntries(snapshot.replaySnapshots);
  const suppliedReplayManifest = snapshot.opponentCloseToOneReplayManifest !== undefined;
  const omittedTrustedSensitiveReplay = hasOpponentCloseToOneOmittedTrustedReplayAuthority(persistenceScope, replayCheckpointIds);
  if (!suppliedReplayManifest && omittedTrustedSensitiveReplay &&
      !verifyOpponentCloseToOneTrustedReplayLineage(persistenceScope, candidateState, replayEntries)) {
    throw new Error('Invalid FB2-49 replay checkpoint lineage');
  }
  if (!suppliedReplayManifest && !verifyOpponentCloseToOneTrustedReplayCheckpoints(persistenceScope, replayEntries)) {
    throw new Error('Invalid FB2-49 replay checkpoint lineage');
  }
  const replaySensitive = suppliedReplayManifest || hasOpponentCloseToOneReplayAuthority(
    snapshot.opponentCloseToOneServerAuthority,
    snapshot.replaySnapshots,
  ) || hasOpponentCloseToOneTrustedReplayAuthority(persistenceScope, replayCheckpointIds);
  if (replaySensitive && !verifyOpponentCloseToOneReplayManifest(
    candidateState,
    replayEntries,
    snapshot.opponentCloseToOneReplayManifest,
    persistenceSecret,
    persistenceScope,
  )) throw new Error('Invalid or missing FB2-49 replay manifest');
  // Preserve the dedicated FB2-49 restore error precedence above, then enforce the generic
  // host-owned state binding for every current/replay state, including snapshots that try to
  // downgrade by deleting both a continuation and its seal.
  if (!verifyDeferredRuntimeStateSeal(
    currentDeferredAuthorityPayload(snapshot),
    snapshot.deferredRuntimeStateSeal,
    persistenceSecret,
    persistenceScope,
  )) {
    throw new Error('Invalid or missing deferred runtime state authority');
  }
  if (!snapshot.replaySnapshots.every((entry) => verifyDeferredRuntimeStateSeal(
    replayDeferredAuthorityPayload(entry),
    entry.deferredRuntimeStateSeal,
    persistenceSecret,
    persistenceScope,
    entry.checkpointId,
  ))) throw new Error('Invalid or missing replay deferred runtime state authority');
  const session = new MatchSession({
    seed: snapshot.seed,
    humanPlayerId: snapshot.humanPlayerId,
    humanPlayerIds: snapshot.humanPlayerIds ?? [snapshot.humanPlayerId],
    maxActionsPerPlayer: snapshot.maxActionsPerPlayer,
    persistenceSecret,
    persistenceScope,
    restorePackKind,
  }, false);
  session.state = candidateState;
  session.logs = structuredClone(snapshot.logs);
  session.replay = structuredClone(snapshot.replay);
  session.replaySnapshots = structuredClone(snapshot.replaySnapshots ?? []);
  session.battleHistory = structuredClone(snapshot.battleHistory);
  session.stopReason = snapshot.stopReason;
  session.rejection = snapshot.rejection ? structuredClone(snapshot.rejection) : undefined;
  if (reconcileReplayTrust) session.reconcileReplayPersistenceTrust();
  return session;
}

export const restoreSession = restoreMatchSession;
