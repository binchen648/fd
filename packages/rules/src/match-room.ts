import {
  createMatchSession,
  restoreMatchSession,
  type MatchClientState,
  type MatchSession,
  type MatchSessionConfig,
  type MatchSessionSnapshot,
} from './match-session';
import type { AbilityCommand, DispatchResult } from './ability/types';
import {
  resolveOpponentCloseToOnePersistenceScope,
  resolveOpponentCloseToOnePersistenceSecret,
  rotateOpponentCloseToOnePersistenceScope,
} from './ability/opponent-close-to-one-authority';

export type RoomStatus = 'lobby' | 'running' | 'ended';
export type RoomClientRole = 'host' | 'player' | 'spectator';
export type SeatController = 'human' | 'ai';

export interface RoomClient {
  id: string;
  displayName: string;
  role: RoomClientRole;
  connected: boolean;
}

export interface PersistedRoomClient extends RoomClient {
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

export function resolveMatchRoomId(config: Pick<MatchRoomConfig, 'roomId' | 'seed'>): string {
  if (config.roomId === undefined) return `fd-room-${config.seed ?? 20260904}`;
  if (typeof config.roomId !== 'string' || config.roomId.trim().length === 0) throw new Error('Invalid room id');
  return config.roomId;
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
  clients: PersistedRoomClient[];
  seats: RoomSeat[];
  session?: MatchSessionSnapshot;
}

function randomCredential(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return `reconnect-v2-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
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
  private readonly persistenceSecret: string;
  private readonly persistenceScope: string;
  private readonly restorePackKind: NonNullable<MatchSessionConfig['restorePackKind']>;
  private readonly credentials = new Map<string, string>();

  constructor(config: MatchRoomConfig = {}) {
    this.roomId = resolveMatchRoomId(config);
    this.seed = config.seed ?? 20260904;
    this.hostClientId = config.hostClientId ?? 'host';
    this.persistenceSecret = config.persistenceSecret ?? resolveOpponentCloseToOnePersistenceSecret();
    this.persistenceScope = config.persistenceScope ?? rotateOpponentCloseToOnePersistenceScope(this.roomId);
    this.restorePackKind = config.restorePackKind ?? 'production_executable';
    this.clients = [{
      id: this.hostClientId,
      displayName: config.hostName ?? '房主',
      role: 'host',
      connected: true,
    }];
    this.credentials.set(this.hostClientId, randomCredential());
    this.seats = defaultSeats();
  }

  joinRoom(input: { clientId: string; displayName: string; role?: RoomClientRole }): PersistedRoomClient {
    const existing = this.clients.find((client) => client.id === input.clientId);
    if (existing) throw new Error('Identity already exists; authenticated reconnect required');
    if (typeof input.clientId !== 'string' || !input.clientId || typeof input.displayName !== 'string' || !input.displayName
      || !['player', 'spectator'].includes(input.role ?? 'player')) {
      throw new Error('Invalid new client identity or role');
    }
    const client: RoomClient = {
      id: input.clientId,
      displayName: input.displayName,
      role: input.role ?? 'player',
      connected: true,
    };
    this.credentials.set(client.id, randomCredential());
    this.clients.push(client);
    return { ...client, reconnectToken: this.getIssuedCredential(client.id) };
  }

  // Trusted in-process issuance only; transport must never expose this via projection.
  getIssuedCredential(clientId: string): string {
    this.requireClient(clientId);
    const token = this.credentials.get(clientId);
    if (!token) throw new Error('Missing private client credential');
    return token;
  }

  authenticateClient(clientId: string, token: string): void {
    if (typeof token !== 'string' || !/^reconnect-v2-[0-9a-f]{64}$/.test(token)
      || this.credentials.get(clientId) !== token) throw new Error('Invalid reconnect token for client');
    this.requireClient(clientId);
  }

  restoreClients(clients: PersistedRoomClient[]): void {
    if (!Array.isArray(clients) || !clients.some(client => client?.id === this.hostClientId)) throw new Error('Unknown client: missing host');
    const credentials = new Map<string, string>();
    const publicClients: RoomClient[] = [];
    for (const client of clients) {
      if (!client || typeof client.id !== 'string' || !client.id || typeof client.displayName !== 'string'
        || typeof client.connected !== 'boolean' || !['host', 'player', 'spectator'].includes(client.role)
        || (client.role === 'host') !== (client.id === this.hostClientId) || credentials.has(client.id)
        || typeof client.reconnectToken !== 'string' || !/^reconnect-v2-[0-9a-f]{64}$/.test(client.reconnectToken)
        || [...credentials.values()].includes(client.reconnectToken)) {
        throw new Error('Unsafe or invalid persisted client credentials; legacy reconnect sessions must be recreated');
      }
      credentials.set(client.id, client.reconnectToken);
      publicClients.push({ id: client.id, displayName: client.displayName, role: client.role, connected: client.connected });
    }
    this.credentials.clear();
    for (const [id, token] of credentials) this.credentials.set(id, token);
    this.clients = publicClients;
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
      persistenceSecret: this.persistenceSecret,
      persistenceScope: this.persistenceScope,
    });
    this.status = 'running';
    this.session.runUntilHumanInputOrStop();
    return this.session.projectToClientState(primaryHuman);
  }

  reconnect(reconnectToken: string): RoomClient {
    const client = this.clients.find((candidate) => this.credentials.get(candidate.id) === reconnectToken);
    if (!client) throw new Error('Invalid reconnect token');
    this.authenticateClient(client.id, reconnectToken);
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
    if (result.ok) {
      this.session.runUntilHumanInputOrStop();
      if (this.session.stopReason === 'match_complete') this.status = 'ended';
    }
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
      this.session.runUntilHumanInputOrStop();
      if (this.session.stopReason === 'match_complete') this.status = 'ended';
    }
    return result;
  }

  consumeDirective(clientId: string, directiveId: string): boolean {
    this.requireHost(clientId);
    if (!this.session) throw new Error('Match has not started');
    const consumed = this.session.consumeDirective(directiveId);
    if (consumed) {
      this.session.runUntilHumanInputOrStop();
      if (this.session.stopReason === 'match_complete') this.status = 'ended';
    }
    return consumed;
  }

  restoreToReplayCheckpoint(clientId: string, checkpointId: string): boolean {
    this.requireHost(clientId);
    if (!this.session) throw new Error('Match has not started');
    const restored = this.session.restoreToCheckpoint(checkpointId);
    if (restored) {
      if (['round_end', 'round_start', 'cleanup'].includes(this.session.state.round.activePhase)) this.session.runUntilHumanInputOrStop();
      this.status = this.session.stopReason === 'match_complete' ? 'ended' : 'running';
    }
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
      clients: this.clients.map(({ id, displayName, role, connected }) => ({ id, displayName, role, connected })),
      seats: structuredClone(this.seats),
      match: this.session ? this.session.projectToClientState(viewerId) : null,
    };
  }

  getPersistenceContext(): Pick<MatchSessionConfig, 'persistenceSecret' | 'persistenceScope' | 'restorePackKind'> {
    return {
      persistenceSecret: this.persistenceSecret,
      persistenceScope: this.persistenceScope,
      restorePackKind: this.session?.getRestorePackKind() ?? this.restorePackKind,
    };
  }

  serializeRoom(): MatchRoomSnapshot {
    return {
      version: 1,
      roomId: this.roomId,
      hostClientId: this.hostClientId,
      seed: this.seed,
      status: this.status,
      clients: this.clients.map(client => ({ ...client, reconnectToken: this.getIssuedCredential(client.id) })),
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

export function restoreMatchRoom(
  snapshot: MatchRoomSnapshot,
  persistence: Pick<MatchSessionConfig, 'persistenceSecret' | 'persistenceScope' | 'restorePackKind'> = {},
  reconcileReplayTrust = true,
): MatchRoom {
  if (snapshot.version !== 1) throw new Error(`Unsupported MatchRoom snapshot version: ${snapshot.version}`);
  const persistenceScope = persistence.persistenceScope ?? resolveOpponentCloseToOnePersistenceScope(snapshot.roomId);
  const room = new MatchRoom({
    roomId: snapshot.roomId,
    seed: snapshot.seed,
    hostClientId: snapshot.hostClientId,
    ...persistence,
    persistenceScope,
  });
  const persistenceContext = room.getPersistenceContext();
  room.restoreClients(snapshot.clients);
  const restoredSession = snapshot.session
    ? restoreMatchSession(snapshot.session, persistenceContext, reconcileReplayTrust)
    : undefined;
  room.status = snapshot.status;
  room.seats = structuredClone(snapshot.seats);
  room.session = restoredSession;
  return room;
}
