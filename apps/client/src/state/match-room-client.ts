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
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private retryAttempt = 0;
  private stopped = true;

  constructor(private connection: RemoteRoomConnection) {}

  connect(): void {
    this.stopped = false;
    clearTimeout(this.retryTimer);
    const previous = this.socket;
    this.socket = null;
    previous?.close();
    this.connected = false;
    const url = `${this.connection.wsBaseUrl}/rooms/${encodeURIComponent(this.connection.roomId)}?clientId=${encodeURIComponent(this.connection.clientId)}&reconnectToken=${encodeURIComponent(this.connection.reconnectToken)}`;
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.addEventListener('close', (event) => {
      if (this.socket !== socket || this.stopped) return;
      this.connected = false;
      if (event.code === 1008) { this.stopped = true; return; }
      this.retryTimer = setTimeout(() => this.connect(), Math.min(500 * 2 ** Math.min(this.retryAttempt++, 4), 8000));
    });
    socket.addEventListener('message', (event) => {
      if (this.socket !== socket || this.stopped) return;
      const message = JSON.parse(String(event.data)) as ServerRoomMessage;
      if (message.type === 'server:projection') {
        this.projection = message.projection;
        this.connected = true;
        this.retryAttempt = 0;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  close(): void {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    this.connected = false;
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }

  send(message: ClientRoomMessage): void {
    if (!this.connected || this.socket?.readyState !== 1) return;
    if ((message.type === 'client:dispatch_command' || message.type === 'client:end_turn')
      && (!Number.isSafeInteger(message.expectedRevision) || message.expectedRevision < 0)) return;
    this.socket?.send(JSON.stringify(message));
  }

  subscribe(listener: RemoteRoomListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
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
