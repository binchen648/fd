import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RemoteMatchRoomClient } from './match-room-client';

class FakeSocket extends EventTarget {
  static sockets: FakeSocket[] = [];
  readyState = 0; sent: string[] = [];
  constructor(public url: string) { super(); FakeSocket.sockets.push(this); }
  send(data: string) { this.sent.push(data); }
  close(code = 1000) { this.readyState = 3; this.dispatchEvent(Object.assign(new Event('close'), { code })); }
  open() { this.readyState = 1; this.dispatchEvent(new Event('open')); }
  project() { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'server:projection', projection: { roomId: 'r' } }) })); }
}
const connection = { httpBaseUrl: 'http://localhost', wsBaseUrl: 'ws://localhost', roomId: 'r', clientId: 'c', reconnectToken: 'private-token' };
beforeEach(() => { vi.useFakeTimers(); FakeSocket.sockets = []; vi.stubGlobal('WebSocket', FakeSocket); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
it('reconnects without replay and waits for a fresh authenticated projection before sending', () => {
  const client = new RemoteMatchRoomClient(connection); client.connect();
  const first = FakeSocket.sockets[0]!; first.open(); first.project();
  client.send({ type: 'client:end_turn', expectedRevision: 1 }); expect(first.sent).toHaveLength(1);
  first.close(1006); expect(client.connected).toBe(false);
  vi.advanceTimersByTime(500); expect(FakeSocket.sockets).toHaveLength(2);
  const second = FakeSocket.sockets[1]!; second.open();
  client.send({ type: 'client:end_turn', expectedRevision: 1 }); expect(second.sent).toEqual([]);
  second.project(); expect(client.connected).toBe(true);
  first.close(1006); expect(client.connected).toBe(true);
  client.send({ type: 'client:end_turn', expectedRevision: 2 }); expect(second.sent).toHaveLength(1);
  client.close(); vi.advanceTimersByTime(60000); expect(FakeSocket.sockets).toHaveLength(2);
});
it('stops retrying after authentication rejection and cancels pending retries on intentional close', () => {
  const client = new RemoteMatchRoomClient(connection); client.connect(); FakeSocket.sockets[0]!.close(1008);
  vi.advanceTimersByTime(60000); expect(FakeSocket.sockets).toHaveLength(1);
  client.connect(); FakeSocket.sockets[1]!.close(1006); client.close();
  vi.advanceTimersByTime(60000); expect(FakeSocket.sockets).toHaveLength(2);
});
