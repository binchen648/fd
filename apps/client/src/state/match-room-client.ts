import type {
  ClientRoomMessage,
  CreateRoomHttpRequest,
  JoinRoomHttpRequest,
  RoomHttpResponse,
  ServerRoomMessage,
} from '@fd/rules/match-room-protocol';
import type { MatchRoomProjection } from '@fd/rules/match-room';

export interface RemoteRoomConnection {
  httpBaseUrl: string;
  wsBaseUrl: string;
  roomId: string;
  clientId: string;
  reconnectToken: string;
}

export type RemoteRoomListener = (message: ServerRoomMessage) => void;

export class RemoteMatchRoomClient {
  projection: MatchRoomProjection | null = null;
  connected = false;
  private socket: WebSocket | null = null;
  private listeners = new Set<RemoteRoomListener>();

  constructor(private connection: RemoteRoomConnection) {}

  connect(): void {
    const url = `${this.connection.wsBaseUrl}/rooms/${encodeURIComponent(this.connection.roomId)}?clientId=${encodeURIComponent(this.connection.clientId)}&reconnectToken=${encodeURIComponent(this.connection.reconnectToken)}`;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => {
      this.connected = true;
    });
    this.socket.addEventListener('close', () => {
      this.connected = false;
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as ServerRoomMessage;
      if (message.type === 'server:projection') this.projection = message.projection;
      for (const listener of this.listeners) listener(message);
    });
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
  }

  send(message: ClientRoomMessage): boolean {
    if (isMutationCommand(message) && typeof message.expectedRevision !== 'number') return false;
    if (!this.socket) return false;
    this.socket?.send(JSON.stringify(message));
    return true;
  }

  subscribe(listener: RemoteRoomListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function isMutationCommand(message: ClientRoomMessage): message is Extract<ClientRoomMessage, { type: 'client:dispatch_command' | 'client:end_turn' }> {
  return message.type === 'client:dispatch_command' || message.type === 'client:end_turn';
}

export async function createRemoteRoom(httpBaseUrl: string, request: CreateRoomHttpRequest): Promise<RoomHttpResponse> {
  return postJson(`${httpBaseUrl}/rooms`, request);
}

export async function joinRemoteRoom(httpBaseUrl: string, roomId: string, request: JoinRoomHttpRequest): Promise<RoomHttpResponse> {
  return postJson(`${httpBaseUrl}/rooms/${encodeURIComponent(roomId)}/join`, request);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}
