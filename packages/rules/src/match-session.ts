import {
  advanceAbilityPhase,
  dispatchAbilityCommand,
  initializeAbilityRuntime,
  processAbilityEvent,
  projectAbilityState,
} from './ability/interpreter';
import {
  resolveOpponentCloseToOnePersistenceSecret,
  persistOpponentCloseToOneServerAuthority,
  restoreOpponentCloseToOneServerAuthority,
  type OpponentCloseToOneServerAuthoritySeal,
} from './ability/opponent-close-to-one-authority';
import { clearTransientCardTransformState } from './ability/card-instance-state';
import { assertExecutableCardPack, type ExecutableCardPack } from './ability/executable-card-pack';
import { isAcceptedLowerVpLoneBattlefieldDeploymentAbility } from './ability/deployment-destinations';
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
import { canViewFaceDownEvents, canViewOpponentDiscard, grantMana, rulerSealMovementLocked } from './core/rule-overrides';
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

export interface MatchSessionConfig {
  seed?: number;
  humanPlayerId?: string;
  humanPlayerIds?: string[];
  maxActionsPerPlayer?: number;
  /** Server/local-host persistence secret; never serialized inside MatchSessionSnapshot. */
  persistenceSecret?: string;
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

export interface MatchReplayStateSnapshot {
  checkpointId: string;
  state: GameState;
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
  /** Authenticated FB2-49 frozen continuation; sealing secret is outside this snapshot. */
  opponentCloseToOneServerAuthority?: OpponentCloseToOneServerAuthoritySeal;
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

function persistedOpponentCloseToOneAuthorityField(
  state: GameState,
  persistenceSecret: string,
): { opponentCloseToOneServerAuthority?: OpponentCloseToOneServerAuthoritySeal } {
  const seal = persistOpponentCloseToOneServerAuthority(state, persistenceSecret);
  return seal ? { opponentCloseToOneServerAuthority: seal } : {};
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

  constructor(config: MatchSessionConfig = {}) {
    this.seed = config.seed ?? 20260904;
    this.humanPlayerId = config.humanPlayerId ?? 'p1';
    this.humanPlayerIds = [...new Set(config.humanPlayerIds ?? [this.humanPlayerId])];
    this.maxActionsPerPlayer = config.maxActionsPerPlayer ?? 2;
    this.persistenceSecret = config.persistenceSecret ?? resolveOpponentCloseToOnePersistenceSecret();
    const built = this.buildInitialState();
    this.state = built.state;
    this.pairings = built.pairings;
    this.rawCards = built.rawCards;
    this.record('session_start', '7-player authoring match session started', { seed: this.seed, pairings: this.pairings.map((p) => ({ playerId: p.playerId, master: p.master.id, servant: p.servant.id })) });
    this.consumeAppliedDirectives();
    this.checkpoint('game start');
  }

  getPlayerView(playerId = this.humanPlayerId): AbilityPlayerView {
    return this.projectAbilityView(playerId);
  }

  getState(): GameState {
    return structuredClone(this.state);
  }

  getClientProjection(playerId = this.humanPlayerId): MatchClientState {
    return this.projectToClientState(playerId);
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
    if (!player || this.state.round.activePhase !== 'advance' || this.priorityPlayer()?.id !== playerId || player.locationId || rulerSealMovementLocked(this.state, playerId)) return [];
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
    const replacementLocations = this.structuralDeploymentReplacementLocations(playerId, legalLocations.map((location) => location.id));
    const mustBattlefield = this.state.ruleOverrides?.mustDeployToBattlefieldPlayerIds?.includes(playerId);
    const filteredLocations = mustBattlefield ? legalLocations.filter((location) => location.tags.includes('battlefield')) : legalLocations;
    return (replacementLocations.length
      ? filteredLocations.filter((location) => replacementLocations.includes(location.id))
      : filteredLocations)
      .map((location) => ({ type: 'deploy_player' as const, locationId: location.id }));
  }

  private structuralDeploymentReplacementLocations(playerId: string, legalLocationIds: LocationId[]): LocationId[] {
    const player = this.state.players.find((candidate) => candidate.id === playerId);
    if (!player) return [];
    const hasReplacement = this.state.cards.some((card) =>
      card.controllerPlayerId === playerId &&
      ['skill', 'field'].includes(card.zone) &&
      (this.state.abilityRuntime?.pack.cards[card.definitionId]?.abilities ?? []).some((ability) =>
        (card.ownerPlayerId === playerId && isAcceptedLowerVpLoneBattlefieldDeploymentAbility(ability)) ||
        ability.effects.some((effect) =>
          effect.type === 'deployment_rule_override' &&
          effect.rule === 'must_deploy_to_lower_vp_lone_battlefield')));
    if (!hasReplacement) return [];
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
    return {
      version: 1,
      seed: this.seed,
      humanPlayerId: this.humanPlayerId,
      humanPlayerIds: [...this.humanPlayerIds],
      maxActionsPerPlayer: this.maxActionsPerPlayer,
      state: structuredClone(this.state),
      ...persistedOpponentCloseToOneAuthorityField(this.state, this.persistenceSecret),
      logs: structuredClone(this.logs),
      replay: structuredClone(this.replay),
      replaySnapshots: structuredClone(this.replaySnapshots),
      battleHistory: structuredClone(this.battleHistory),
      ...(this.stopReason ? { stopReason: this.stopReason } : {}),
      ...(this.rejection ? { rejection: structuredClone(this.rejection) } : {}),
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
    this.state = structuredClone(snapshot.state);
    restoreOpponentCloseToOneServerAuthority(this.state, snapshot.opponentCloseToOneServerAuthority, this.persistenceSecret);
    this.logs = structuredClone(snapshot.logs);
    this.battleHistory = structuredClone(snapshot.battleHistory);
    this.consumedDirectiveCount = snapshot.consumedDirectiveCount;
    this.stopReason = snapshot.stopReason;
    this.rejection = snapshot.rejection ? structuredClone(snapshot.rejection) : undefined;
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
        battleParticipantPowers: Object.fromEntries((battle.participantBreakdowns ?? []).filter((participant) => participants.includes(participant.playerId)).map((participant) => [participant.playerId, participant.effectivePower])),
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
      battleOutcomes: battles.map((battle) => ({
        battlefieldId: battle.battlefieldId,
        participantPlayerIds: battle.participantBreakdowns?.map((participant) => participant.playerId) ??
          [...new Set([...battle.winnerPlayerIds, ...this.battleLoserIds(battle)])],
        winnerPlayerIds: [...battle.winnerPlayerIds],
      })),
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
    const revision = state.abilityRuntime?.revision ?? 0;
    const checkpoint = {
      id: `checkpoint:${this.replay.length + 1}`,
      round: state.round.roundNumber,
      phase: state.round.activePhase,
      revision,
      label,
    };
    this.replay.push(checkpoint);
    this.replaySnapshots.push({
      checkpointId: checkpoint.id,
      state: structuredClone(state),
      ...persistedOpponentCloseToOneAuthorityField(state, this.persistenceSecret),
      logs: structuredClone(this.logs),
      battleHistory: structuredClone(this.battleHistory),
      consumedDirectiveCount: this.consumedDirectiveCount,
      ...(this.stopReason ? { stopReason: this.stopReason } : {}),
      ...(this.rejection ? { rejection: structuredClone(this.rejection) } : {}),
    });
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
  config: Pick<MatchSessionConfig, 'persistenceSecret'> = {},
): MatchSession {
  if (snapshot.version !== 1) throw new Error(`Unsupported MatchSession snapshot version: ${snapshot.version}`);
  const persistenceSecret = config.persistenceSecret ?? resolveOpponentCloseToOnePersistenceSecret();
  const session = new MatchSession({
    seed: snapshot.seed,
    humanPlayerId: snapshot.humanPlayerId,
    humanPlayerIds: snapshot.humanPlayerIds ?? [snapshot.humanPlayerId],
    maxActionsPerPlayer: snapshot.maxActionsPerPlayer,
    persistenceSecret,
  });
  session.state = structuredClone(snapshot.state);
  restoreOpponentCloseToOneServerAuthority(
    session.state, snapshot.opponentCloseToOneServerAuthority, persistenceSecret,
  );
  session.logs = structuredClone(snapshot.logs);
  session.replay = structuredClone(snapshot.replay);
  session.replaySnapshots = structuredClone(snapshot.replaySnapshots ?? []);
  session.battleHistory = structuredClone(snapshot.battleHistory);
  session.stopReason = snapshot.stopReason;
  session.rejection = snapshot.rejection ? structuredClone(snapshot.rejection) : undefined;
  return session;
}

export const restoreSession = restoreMatchSession;
