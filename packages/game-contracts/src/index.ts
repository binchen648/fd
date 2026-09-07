export type ViewerIdentity =
  | { kind: 'player'; playerId: string }
  | { kind: 'spectator' };

export interface VisibleCardView {
  instanceId: string;
  definitionId: string;
  ownerPlayerId: string;
  controllerPlayerId: string;
  zone: string;
}

export interface HiddenCardCollectionView {
  count: number;
}

export interface PublicPlayerView {
  id: string;
  seat: number;
  status: 'active' | 'eliminated';
  masterCardId: string;
  servantCardId: string;
  locationId?: string;
  vp: number;
  militaryResult: number;
  mana: number;
  hand: HiddenCardCollectionView;
  faceDownSkills: HiddenCardCollectionView;
}

export interface SelfPlayerView extends Omit<PublicPlayerView, 'hand' | 'faceDownSkills'> {
  hand: VisibleCardView[];
  faceDownSkills: VisibleCardView[];
}

export type AvailableActionKind = 'play_card' | 'move' | 'respond' | 'pass';

export interface AvailableAction {
  actionId: string;
  kind: AvailableActionKind;
  ownerPlayerId: string;
  label: string;
  sourceCardInstanceId?: string;
  targetId?: string;
  responseWindowId?: string;
}

export interface InteractionView {
  id: string;
  kind: 'action' | 'response' | 'host_ruling' | 'proxy_consent';
  status: 'available' | 'pending' | 'resolved';
  label: string;
}

export interface ResponseWindowView {
  id: string;
  reason: string;
  eligiblePlayerIds: string[];
}

export interface PlayerMatchView {
  matchId: string;
  revision: number;
  viewer: ViewerIdentity;
  round: {
    number: number;
    phase: string;
    prioritySeat: number;
  };
  self: SelfPlayerView | null;
  players: PublicPlayerView[];
  publicCards: VisibleCardView[];
  availableActions: AvailableAction[];
  interactions: InteractionView[];
  responseWindow: ResponseWindowView | null;
}

export interface ClientCommand {
  clientCommandId: string;
  expectedRevision: number;
  actionId: string;
  payload?: Record<string, unknown>;
}

export type CommandResult =
  | { accepted: true; revision: number }
  | { accepted: false; revision: number; code: string; message: string };

export interface HostRulingRequest {
  id: string;
  matchId: string;
  requestingPlayerId: string;
  sourceDefinitionId: string;
  prompt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ProxyConsentRecord {
  id: string;
  matchId: string;
  playerId: string;
  proxyPlayerId: string;
  scope: 'single_action' | 'response_window';
  granted: boolean;
}
