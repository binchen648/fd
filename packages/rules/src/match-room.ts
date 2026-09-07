import {
  createMatchSession,
  restoreMatchSession,
  type MatchClientState,
  type MatchSession,
  type MatchSessionConfig,
  type MatchSessionSnapshot,
} from './match-session';
import type { AbilityCommand, DispatchResult } from './ability/types';

export type RoomStatus = 'lobby' | 'running' | 'ended';
export type RoomClientRole = 'host' | 'player' | 'spectator';
export type SeatController = 'human' | 'ai';

export interface RoomClient {
  id: string;
  displayName: string;
  role: RoomClientRole;
  connected: boolean;
  reconnectToken: string;
}

export interface RoomSeat {
  seat: number;
  playerId: string;
  controller: SeatController;
  clientId?: string;
  displayName: string;
}

export interface MatchRoomConfig extends MatchSessionConfig {
  roomId?: string;
  hostClientId?: string;
  hostName?: string;
}

export interface MatchRoomProjection {
  roomId: string;
  status: RoomStatus;
  viewer: { clientId: string; role: RoomClientRole; playerId?: string; isHost: boolean };
  hostClientId: string;
  clients: RoomClient[];
  seats: RoomSeat[];
  match: MatchClientState | null;
}

export interface MatchRoomSnapshot {
  version: 1;
  roomId: string;
  hostClientId: string;
  seed: number;
  status: RoomStatus;
  clients: RoomClient[];
  seats: RoomSeat[];
  session?: MatchSessionSnapshot;
}

function stableToken(input: string): string {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `reconnect-${(hash >>> 0).toString(36)}`;
}

function defaultSeats(): RoomSeat[] {
  return Array.from({ length: 7 }, (_, index) => {
    const seat = index + 1;
    return {
      seat,
      playerId: `p${seat}`,
      controller: 'ai',
      displayName: `AI ${seat}`,
    };
  });
}

export class MatchRoom {
  readonly roomId: string;
  readonly seed: number;
  hostClientId: string;
  status: RoomStatus = 'lobby';
  clients: RoomClient[];
  seats: RoomSeat[];
  session: MatchSession | undefined;

  constructor(config: MatchRoomConfig = {}) {
    this.roomId = config.roomId ?? `fd-room-${config.seed ?? 20260904}`;
    this.seed = config.seed ?? 20260904;
    this.hostClientId = config.hostClientId ?? 'host';
    this.clients = [{
      id: this.hostClientId,
      displayName: config.hostName ?? '房主',
      role: 'host',
      connected: true,
      reconnectToken: stableToken(`${this.roomId}:${this.hostClientId}`),
    }];
    this.seats = defaultSeats();
  }

  joinRoom(input: { clientId: string; displayName: string; role?: RoomClientRole }): RoomClient {
    const existing = this.clients.find((client) => client.id === input.clientId);
    if (existing) {
      existing.connected = true;
      existing.displayName = input.displayName;
      existing.role = input.role ?? existing.role;
      return existing;
    }
    const client: RoomClient = {
      id: input.clientId,
      displayName: input.displayName,
      role: input.role ?? 'player',
      connected: true,
      reconnectToken: stableToken(`${this.roomId}:${input.clientId}`),
    };
    this.clients.push(client);
    return client;
  }

  selectSeat(clientId: string, seatNumber: number): RoomSeat {
    if (this.status !== 'lobby') throw new Error('Seats can only be selected in the lobby');
    const client = this.requireClient(clientId);
    if (client.role === 'spectator') throw new Error('Spectators cannot select seats');
    const seat = this.seats.find((candidate) => candidate.seat === seatNumber);
    if (!seat) throw new Error(`Unknown seat: ${seatNumber}`);
    if (seat.controller === 'human' && seat.clientId !== clientId) throw new Error('Seat is already occupied');
    for (const candidate of this.seats) {
      if (candidate.clientId === clientId) {
        candidate.controller = 'ai';
        delete candidate.clientId;
        candidate.displayName = `AI ${candidate.seat}`;
      }
    }
    seat.controller = 'human';
    seat.clientId = clientId;
    seat.displayName = client.displayName;
    return seat;
  }

  assignAiToEmptySeats(): void {
    for (const seat of this.seats) {
      if (seat.controller === 'human') continue;
      seat.controller = 'ai';
      delete seat.clientId;
      seat.displayName = `AI ${seat.seat}`;
    }
  }

  startMatch(clientId: string): MatchClientState {
    this.requireHost(clientId);
    if (this.status !== 'lobby') throw new Error('Match has already started');
    this.assignAiToEmptySeats();
    const humanPlayerIds = this.seats
      .filter((seat) => seat.controller === 'human')
      .map((seat) => seat.playerId);
    const primaryHuman = humanPlayerIds[0] ?? 'p1';
    this.session = createMatchSession({
      seed: this.seed,
      humanPlayerId: primaryHuman,
      humanPlayerIds: humanPlayerIds.length ? humanPlayerIds : [primaryHuman],
    });
    this.status = 'running';
    this.session.runUntilHumanInputOrRoundEnd();
    return this.session.projectToClientState(primaryHuman);
  }

  reconnect(reconnectToken: string): RoomClient {
    const client = this.clients.find((candidate) => candidate.reconnectToken === reconnectToken);
    if (!client) throw new Error('Invalid reconnect token');
    client.connected = true;
    return client;
  }

  disconnect(clientId: string): void {
    this.requireClient(clientId).connected = false;
  }

  dispatchClientCommand(clientId: string, command: AbilityCommand): DispatchResult {
    if (!this.session) throw new Error('Match has not started');
    const client = this.requireClient(clientId);
    if (!client.connected) throw new Error('Client is disconnected');
    const seat = this.seats.find((candidate) => candidate.clientId === clientId);
    if (!seat) throw new Error('Client does not control a seat');
    const result = this.session.dispatchPlayerCommand(seat.playerId, command);
    this.session.runUntilHumanInputOrRoundEnd();
    if (this.session.stopReason === 'match_complete') this.status = 'ended';
    return result;
  }

  endClientTurn(clientId: string): DispatchResult {
    if (!this.session) throw new Error('Match has not started');
    const client = this.requireClient(clientId);
    if (!client.connected) throw new Error('Client is disconnected');
    const seat = this.seats.find((candidate) => candidate.clientId === clientId);
    if (!seat) throw new Error('Client does not control a seat');
    const result = this.session.passPriority(seat.playerId);
    if (result.ok) {
      this.session.runUntilHumanInputOrRoundEnd();
      if (this.session.stopReason === 'match_complete') this.status = 'ended';
    }
    return result;
  }

  consumeDirective(clientId: string, directiveId: string): boolean {
    this.requireHost(clientId);
    if (!this.session) throw new Error('Match has not started');
    const consumed = this.session.consumeDirective(directiveId);
    if (consumed) {
      this.session.runUntilHumanInputOrRoundEnd();
      if (this.session.stopReason === 'match_complete') this.status = 'ended';
    }
    return consumed;
  }

  restoreToReplayCheckpoint(clientId: string, checkpointId: string): boolean {
    this.requireHost(clientId);
    if (!this.session) throw new Error('Match has not started');
    const restored = this.session.restoreToCheckpoint(checkpointId);
    if (restored) this.status = this.session.stopReason === 'match_complete' ? 'ended' : 'running';
    return restored;
  }

  getProjection(clientId: string): MatchRoomProjection {
    const client = this.requireClient(clientId);
    const controlledSeat = this.seats.find((seat) => seat.clientId === clientId);
    const viewerId = controlledSeat?.playerId ?? `spectator:${clientId}`;
    return {
      roomId: this.roomId,
      status: this.status,
      viewer: {
        clientId,
        role: client.role,
        ...(controlledSeat ? { playerId: controlledSeat.playerId } : {}),
        isHost: clientId === this.hostClientId,
      },
      hostClientId: this.hostClientId,
      clients: structuredClone(this.clients),
      seats: structuredClone(this.seats),
      match: this.session ? this.session.projectToClientState(viewerId) : null,
    };
  }

  serializeRoom(): MatchRoomSnapshot {
    return {
      version: 1,
      roomId: this.roomId,
      hostClientId: this.hostClientId,
      seed: this.seed,
      status: this.status,
      clients: structuredClone(this.clients),
      seats: structuredClone(this.seats),
      ...(this.session ? { session: this.session.serializeSession() } : {}),
    };
  }

  private requireClient(clientId: string): RoomClient {
    const client = this.clients.find((candidate) => candidate.id === clientId);
    if (!client) throw new Error(`Unknown client: ${clientId}`);
    return client;
  }

  private requireHost(clientId: string): void {
    if (clientId !== this.hostClientId) throw new Error('Host permission required');
  }
}

export function createMatchRoom(config?: MatchRoomConfig): MatchRoom {
  return new MatchRoom(config);
}

export function restoreMatchRoom(snapshot: MatchRoomSnapshot): MatchRoom {
  if (snapshot.version !== 1) throw new Error(`Unsupported MatchRoom snapshot version: ${snapshot.version}`);
  const room = new MatchRoom({
    roomId: snapshot.roomId,
    seed: snapshot.seed,
    hostClientId: snapshot.hostClientId,
  });
  room.status = snapshot.status;
  room.clients = structuredClone(snapshot.clients);
  room.seats = structuredClone(snapshot.seats);
  room.session = snapshot.session ? restoreMatchSession(snapshot.session) : undefined;
  return room;
}
