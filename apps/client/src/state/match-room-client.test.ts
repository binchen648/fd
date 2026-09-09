import { afterEach, describe, expect, it, vi } from 'vitest';

import { RemoteMatchRoomClient } from './match-room-client';

const sentMessages: string[] = [];

class FakeWebSocket extends EventTarget {
  static instances: FakeWebSocket[] = [];

  constructor(readonly url: string) {
    super();
    FakeWebSocket.instances.push(this);
  }

  send(message: string): void {
    sentMessages.push(message);
  }

  close(): void {}
}

afterEach(() => {
  vi.unstubAllGlobals();
  sentMessages.length = 0;
  FakeWebSocket.instances.length = 0;
});

describe('RemoteMatchRoomClient', () => {
  it('does not send remote mutation commands without a numeric expectedRevision', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const client = new RemoteMatchRoomClient({
      httpBaseUrl: 'http://127.0.0.1:8787',
      wsBaseUrl: 'ws://127.0.0.1:8787',
      roomId: 'room-a',
      clientId: 'client-a',
      reconnectToken: 'token-a',
    });
    client.connect();

    const dispatched = client.send({
      type: 'client:dispatch_command',
      command: {
        type: 'activate_ability',
        sourceCardId: 'card-a',
        abilityId: 'ability-a',
      },
      expectedRevision: undefined,
    } as never);
    const ended = client.send({ type: 'client:end_turn', expectedRevision: undefined } as never);
    const synced = client.send({ type: 'client:request_projection' });

    expect(dispatched).toBe(false);
    expect(ended).toBe(false);
    expect(synced).toBe(true);
    expect(sentMessages).toEqual([JSON.stringify({ type: 'client:request_projection' })]);
  });
});
