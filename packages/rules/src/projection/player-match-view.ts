import type {
  AvailableAction,
  PlayerMatchView,
  PublicPlayerView,
  ResponseWindowView,
  SelfPlayerView,
  ViewerIdentity,
  VisibleCardView,
  HostRulingRequest,
} from '@fd/game-contracts';
import type { CapabilityProfile } from '@fd/content/playtest-pack';

import scenario from '../data/scenarios/fd-playtest-v1-7p.json';
import defaultMap from '../data/maps/default-7p-map.json';
import type { CardInstance } from '../schema/card';
import type { GameState, PlayerState } from '../schema/game';
import type { MapDefinition } from '../schema/location';

export interface ProjectionOptions {
  revision: number;
  responseWindow?: ResponseWindowView;
}

export interface HostRulingCapabilityInput {
  matchId: string;
  playerId: string;
  sourceDefinitionId: string;
  capability: CapabilityProfile;
  requestedDimension: string;
}

export function createHostRulingRequestForCapability(
  input: HostRulingCapabilityInput,
): HostRulingRequest | null {
  const isCovered =
    input.capability.status === 'FULL' ||
    (input.capability.status === 'PARTIAL' &&
      input.capability.supportedDimensions?.includes(input.requestedDimension));

  if (isCovered) {
    return null;
  }

  const stablePart = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');
  return {
    id: [
      'host-ruling',
      stablePart(input.matchId),
      stablePart(input.playerId),
      stablePart(input.sourceDefinitionId),
      stablePart(input.requestedDimension),
    ].join(':'),
    matchId: input.matchId,
    requestingPlayerId: input.playerId,
    sourceDefinitionId: input.sourceDefinitionId,
    prompt: `Capability dimension "${input.requestedDimension}" is not covered by ${input.capability.status}; request a host ruling.`,
    status: 'pending',
  };
}

function visibleCard(card: CardInstance): VisibleCardView {
  return {
    instanceId: card.instanceId,
    definitionId: card.definitionId,
    ownerPlayerId: card.ownerPlayerId,
    controllerPlayerId: card.controllerPlayerId,
    zone: card.zone,
  };
}

function privateCards(state: GameState, playerId: string, zone: string): CardInstance[] {
  return state.cards.filter((card) => card.ownerPlayerId === playerId && card.zone === zone);
}

function publicPlayer(state: GameState, player: PlayerState): PublicPlayerView {
  return {
    id: player.id,
    seat: player.seat,
    status: player.status,
    masterCardId: player.masterCardId,
    servantCardId: player.servantCardId,
    ...(player.locationId ? { locationId: player.locationId } : {}),
    vp: player.vp,
    militaryResult: player.militaryResult,
    mana: player.mana,
    hand: { count: privateCards(state, player.id, 'hand').length },
    faceDownSkills: { count: privateCards(state, player.id, 'skill').length },
  };
}

function selfPlayer(state: GameState, player: PlayerState): SelfPlayerView {
  const projected = publicPlayer(state, player);
  return {
    ...projected,
    hand: privateCards(state, player.id, 'hand').map(visibleCard),
    faceDownSkills: privateCards(state, player.id, 'skill').map(visibleCard),
  };
}

function priorityActions(state: GameState, player: PlayerState): AvailableAction[] {
  if (
    player.status !== 'active' ||
    state.round.activePhase !== 'action' ||
    player.seat !== state.round.prioritySeat
  ) {
    return [];
  }

  const playActions = privateCards(state, player.id, 'hand').map((card) => ({
    actionId: `play:${card.instanceId}`,
    kind: 'play_card' as const,
    ownerPlayerId: player.id,
    label: '打出卡牌',
    sourceCardInstanceId: card.instanceId,
  }));
  const moveActions = state.map.locations.map((location) => ({
    actionId: `move:${player.id}:${location.id}`,
    kind: 'move' as const,
    ownerPlayerId: player.id,
    label: `移动至 ${location.displayName}`,
    targetId: location.id,
  }));

  return [...playActions, ...moveActions];
}

function responseActions(
  viewer: ViewerIdentity,
  responseWindow?: ResponseWindowView,
): AvailableAction[] {
  if (
    viewer.kind !== 'player' ||
    !responseWindow?.eligiblePlayerIds.includes(viewer.playerId)
  ) {
    return [];
  }

  return [
    {
      actionId: `respond:${responseWindow.id}:${viewer.playerId}`,
      kind: 'respond',
      ownerPlayerId: viewer.playerId,
      label: '响应',
      responseWindowId: responseWindow.id,
    },
    {
      actionId: `pass:${responseWindow.id}:${viewer.playerId}`,
      kind: 'pass',
      ownerPlayerId: viewer.playerId,
      label: '放弃响应',
      responseWindowId: responseWindow.id,
    },
  ];
}

export function projectPlayerMatchView(
  state: GameState,
  viewer: ViewerIdentity,
  options: ProjectionOptions,
): PlayerMatchView {
  const viewingPlayer = viewer.kind === 'player'
    ? state.players.find((player) => player.id === viewer.playerId)
    : undefined;
  const actions = viewingPlayer
    ? [...priorityActions(state, viewingPlayer), ...responseActions(viewer, options.responseWindow)]
    : [];

  return {
    matchId: state.id,
    revision: options.revision,
    viewer,
    round: {
      number: state.round.roundNumber,
      phase: state.round.activePhase,
      prioritySeat: state.round.prioritySeat,
    },
    self: viewingPlayer ? selfPlayer(state, viewingPlayer) : null,
    players: state.players.map((player) => publicPlayer(state, player)),
    publicCards: state.cards
      .filter((card) => card.visibility.scope === 'public')
      .map(visibleCard),
    availableActions: actions,
    interactions: actions.map((action) => ({
      id: action.actionId,
      kind: action.kind === 'respond' || action.kind === 'pass' ? 'response' : 'action',
      status: 'available',
      label: action.label,
    })),
    responseWindow: options.responseWindow ?? null,
  };
}

export function createFdPlaytestV1FivePlayerState(): GameState {
  return {
    id: scenario.id,
    players: scenario.seats.map((seat) => ({
      id: seat.playerId,
      seat: seat.seat,
      status: 'active',
      masterCardId: seat.masterId,
      servantCardId: seat.servantId,
      vp: 0,
      militaryResult: 0,
      mana: 4,
    })),
    round: {
      roundNumber: 1,
      activePhase: 'action',
      prioritySeat: 1,
    },
    map: defaultMap as MapDefinition,
    locationConfig: { enabledLocationIds: [] },
    cards: [],
    eventPlacements: [],
    battleResults: [],
    effectStack: [],
    log: [],
  };
}

export const createFdPlaytestV1SevenPlayerState = createFdPlaytestV1FivePlayerState;
