import {
  createMatchRoom,
  restoreMatchRoom,
  type MatchRoom,
  type MatchRoomConfig,
  type MatchRoomProjection,
  type MatchRoomSnapshot,
} from './match-room';
import type { AbilityCommand, DispatchResult } from './ability/types';

export interface MatchRoomHubSnapshot {
  version: 1;
  rooms: MatchRoomSnapshot[];
}

export interface MatchRoomHubEvent {
  roomId: string;
  version: number;
  type: 'room_created' | 'client_joined' | 'seat_selected' | 'match_started' | 'command_dispatched' | 'client_disconnected' | 'client_reconnected' | 'directive_consumed' | 'replay_restored' | 'room_restored';
}

export class MatchRoomHub {
  private rooms = new Map<string, MatchRoom>();
  private roomVersions = new Map<string, number>();

  createRoom(config: MatchRoomConfig = {}): MatchRoomProjection {
    const room = createMatchRoom(config);
    this.rooms.set(room.roomId, room);
    this.bump(room.roomId, 'room_created');
    return room.getProjection(room.hostClientId);
  }

  getRoom(roomId: string): MatchRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Unknown room: ${roomId}`);
    return room;
  }

  joinRoom(roomId: string, input: Parameters<MatchRoom['joinRoom']>[0]): MatchRoomProjection {
    const room = this.getRoom(roomId);
    room.joinRoom(input);
    this.bump(roomId, 'client_joined');
    return room.getProjection(input.clientId);
  }

  selectSeat(roomId: string, clientId: string, seatNumber: number): MatchRoomProjection {
    const room = this.getRoom(roomId);
    room.selectSeat(clientId, seatNumber);
    this.bump(roomId, 'seat_selected');
    return room.getProjection(clientId);
  }

  startMatch(roomId: string, clientId: string): MatchRoomProjection {
    const room = this.getRoom(roomId);
    room.startMatch(clientId);
    this.bump(roomId, 'match_started');
    return room.getProjection(clientId);
  }

  dispatchCommand(roomId: string, clientId: string, command: AbilityCommand, expectedRevision?: number): { result: DispatchResult; projection: MatchRoomProjection } {
    const room = this.getRoom(roomId);
    this.assertExpectedRevision(room, clientId, expectedRevision, true);
    const result = room.dispatchClientCommand(clientId, command);
    if (result.ok) this.bump(roomId, 'command_dispatched');
    return { result, projection: room.getProjection(clientId) };
  }

  endTurn(roomId: string, clientId: string, expectedRevision?: number): { result: DispatchResult; projection: MatchRoomProjection } {
    const room = this.getRoom(roomId);
    this.assertExpectedRevision(room, clientId, expectedRevision);
    const result = room.endClientTurn(clientId);
    this.bump(roomId, 'command_dispatched');
    return { result, projection: room.getProjection(clientId) };
  }

  disconnect(roomId: string, clientId: string): MatchRoomProjection {
    const room = this.getRoom(roomId);
    room.disconnect(clientId);
    this.bump(roomId, 'client_disconnected');
    return room.getProjection(clientId);
  }

  reconnect(roomId: string, reconnectToken: string): MatchRoomProjection {
    const room = this.getRoom(roomId);
    const client = room.reconnect(reconnectToken);
    this.bump(roomId, 'client_reconnected');
    return room.getProjection(client.id);
  }

  consumeDirective(roomId: string, clientId: string, directiveId: string): MatchRoomProjection {
    const room = this.getRoom(roomId);
    room.consumeDirective(clientId, directiveId);
    this.bump(roomId, 'directive_consumed');
    return room.getProjection(clientId);
  }

  restoreReplay(roomId: string, clientId: string, checkpointId: string): MatchRoomProjection {
    const room = this.getRoom(roomId);
    if (!room.restoreToReplayCheckpoint(clientId, checkpointId)) {
      throw new Error(`Replay restore failed: ${checkpointId}`);
    }
    this.bump(roomId, 'replay_restored');
    return room.getProjection(clientId);
  }

  project(roomId: string, clientId: string): MatchRoomProjection {
    return this.getRoom(roomId).getProjection(clientId);
  }

  version(roomId: string): number {
    return this.roomVersions.get(roomId) ?? 0;
  }

  serialize(): MatchRoomHubSnapshot {
    return {
      version: 1,
      rooms: [...this.rooms.values()].map((room) => room.serializeRoom()),
    };
  }

  restoreRoom(roomId: string, snapshot: MatchRoomSnapshot): MatchRoomProjection {
    if (snapshot.roomId !== roomId) throw new Error(`Restore room id mismatch: expected ${roomId}, got ${snapshot.roomId}`);
    const existing = this.getRoom(roomId);
    const restored = restoreMatchRoom(snapshot, existing.getPersistenceContext());
    this.rooms.set(roomId, restored);
    this.bump(roomId, 'room_restored');
    return restored.getProjection(restored.hostClientId);
  }

  restore(snapshot: MatchRoomHubSnapshot): void {
    if (snapshot.version !== 1) throw new Error(`Unsupported MatchRoomHub snapshot version: ${snapshot.version}`);
    const restoredRooms = new Map<string, MatchRoom>();
    for (const roomSnapshot of snapshot.rooms) {
      const existing = this.rooms.get(roomSnapshot.roomId);
      const room = restoreMatchRoom(roomSnapshot, existing?.getPersistenceContext());
      if (restoredRooms.has(room.roomId)) throw new Error(`Duplicate room in restore snapshot: ${room.roomId}`);
      restoredRooms.set(room.roomId, room);
    }
    this.rooms = restoredRooms;
    this.roomVersions = new Map();
    for (const roomId of this.rooms.keys()) this.bump(roomId, 'room_restored');
  }

  private bump(roomId: string, type: MatchRoomHubEvent['type']): MatchRoomHubEvent {
    const version = (this.roomVersions.get(roomId) ?? 0) + 1;
    this.roomVersions.set(roomId, version);
    return { roomId, version, type };
  }

  private assertExpectedRevision(room: MatchRoom, clientId: string, expectedRevision?: number, required = false): void {
    if (expectedRevision === undefined) {
      if (required) throw new Error('missing_expected_revision: interaction command requires expectedRevision');
      return;
    }
    const actualRevision = room.getProjection(clientId).match?.view.revision;
    if (actualRevision !== expectedRevision) {
      throw new Error(`Stale command revision: expected ${expectedRevision}, current ${actualRevision ?? 'unavailable'}`);
    }
  }
}

export function createMatchRoomHub(): MatchRoomHub {
  return new MatchRoomHub();
}
