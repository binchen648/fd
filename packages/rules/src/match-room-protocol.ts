import type { AbilityCommand } from './ability/types';
import type { MatchRoomProjection, MatchRoomSnapshot } from './match-room';

export type ClientRoomMessage =
  | { type: 'client:select_seat'; requestId?: string; seat: number }
  | { type: 'client:start_match'; requestId?: string }
  | { type: 'client:end_turn'; requestId?: string; expectedRevision: number }
  | { type: 'client:dispatch_command'; requestId?: string; command: AbilityCommand; expectedRevision: number }
  | { type: 'client:consume_directive'; requestId?: string; directiveId: string }
  | { type: 'client:restore_replay'; requestId?: string; checkpointId: string }
  | { type: 'client:request_projection'; requestId?: string };

export type ServerRoomMessage =
  | { type: 'server:projection'; requestId?: string; roomId: string; version: number; projection: MatchRoomProjection }
  | { type: 'server:room_event'; roomId: string; version: number; event: string }
  | { type: 'server:error'; requestId?: string; roomId?: string; code: string; message: string };

export interface CreateRoomHttpRequest {
  roomId?: string;
  seed?: number;
  hostClientId?: string;
  hostName?: string;
}

export interface JoinRoomHttpRequest {
  clientId: string;
  displayName: string;
  role?: 'host' | 'player' | 'spectator';
}

export interface RoomHttpResponse {
  roomId: string;
  clientId: string;
  reconnectToken: string;
  projection: MatchRoomProjection;
}

export interface PersistedRoomHttpRequest {
  snapshot: MatchRoomSnapshot;
}
