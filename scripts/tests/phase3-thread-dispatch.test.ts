import { describe, expect, it } from 'vitest';
import {
  ThreadDispatchAdapter,
  normalizeThreadStatus,
  probeMessage,
  type DispatchRegistry,
  type ProtocolTransport,
} from '../phase3-thread-dispatch';

class MockTransport implements ProtocolTransport {
  public requests: Array<{ method: string; params: unknown }> = [];

  constructor(private thread: Record<string, unknown>, private completedPayload: unknown = null) {}

  async request(method: string, params?: unknown): Promise<unknown> {
    this.requests.push({ method, params });
    if (method === 'thread/read') return { thread: this.thread };
    if (method === 'thread/items/list') return { data: [{ item: { type: 'agentMessage', text: 'progress' } }], nextCursor: 'cursor-2' };
    if (method === 'turn/start') return { turnId: 'turn-1' };
    throw new Error(`unsupported mock method ${method}`);
  }

  async waitForNotification(predicate: (method: string, params: unknown) => boolean): Promise<unknown | null> {
    if (this.completedPayload && predicate('turn/completed', this.completedPayload)) return this.completedPayload;
    return null;
  }

  close(): void {}
}

const registry = (threadId = 'thread-1', sentDispatchIds: string[] = []): DispatchRegistry => ({
  threads: [{ threadId, allowed: true }],
  sentDispatchIds,
});

describe('phase3 thread dispatch adapter', () => {
  it('refuses unregistered target threads', async () => {
    const transport = new MockTransport({ id: 'thread-1', status: { type: 'idle' }, canAcceptDirectInput: true });
    const adapter = new ThreadDispatchAdapter(transport, registry('other-thread'));

    const result = await adapter.readStatus('thread-1');

    expect(result).toMatchObject({ ok: false, code: 'UNREGISTERED_THREAD' });
    expect(transport.requests).toHaveLength(0);
  });

  it('normalizes active thread statuses into running or waiting', () => {
    expect(normalizeThreadStatus({ status: { type: 'active', activeFlags: [] }, canAcceptDirectInput: true })).toMatchObject({ kind: 'running' });
    expect(normalizeThreadStatus({ status: { type: 'active', activeFlags: ['waitingOnUserInput'] }, canAcceptDirectInput: true })).toMatchObject({ kind: 'waiting' });
  });

  it('refuses running or unknown status before dispatch', () => {
    const transport = new MockTransport({ id: 'thread-1', status: { type: 'idle' }, canAcceptDirectInput: true });
    const adapter = new ThreadDispatchAdapter(transport, registry());

    expect(adapter.previewDispatch('thread-1', { kind: 'running', flags: [], canAcceptDirectInput: true }, 'd1')).toMatchObject({ ok: false, code: 'NOT_IDLE' });
    expect(adapter.previewDispatch('thread-1', { kind: 'unknown', reason: 'notLoaded', canAcceptDirectInput: null }, 'd1')).toMatchObject({ ok: false, code: 'NOT_IDLE' });
  });

  it('does not send a duplicate dispatchId', async () => {
    const transport = new MockTransport({ id: 'thread-1', status: { type: 'idle' }, canAcceptDirectInput: true });
    const adapter = new ThreadDispatchAdapter(transport, registry('thread-1', ['fd-c01-duplicate']));

    const result = await adapter.sendProbe('thread-1', 'fd-c01-duplicate');

    expect(result).toMatchObject({ ok: false, code: 'DUPLICATE_DISPATCH' });
    expect(transport.requests.map((request) => request.method)).not.toContain('turn/start');
  });

  it('refuses idle threads whose direct-input capability is unknown or disabled', async () => {
    for (const canAcceptDirectInput of [null, false]) {
      const transport = new MockTransport({ status: { type: 'idle' }, canAcceptDirectInput });
      const adapter = new ThreadDispatchAdapter(transport, registry());
      expect(await adapter.sendProbe('thread-1', 'fd-c01-capability')).toMatchObject({ ok: false, code: 'NOT_IDLE' });
      expect(transport.requests.map((request) => request.method)).not.toContain('turn/start');
    }
  });

  it('sends the bounded probe once when a registered thread is idle', async () => {
    const transport = new MockTransport({ id: 'thread-1', status: { type: 'idle' }, canAcceptDirectInput: true });
    const adapter = new ThreadDispatchAdapter(transport, registry());

    const result = await adapter.sendProbe('thread-1', 'fd-c01-ok');

    expect(result).toMatchObject({ ok: true });
    expect(transport.requests.filter((request) => request.method === 'turn/start')).toHaveLength(1);
    expect(JSON.stringify(transport.requests.at(-1)?.params)).toContain('ACK:fd-c01-ok');
    expect(probeMessage('fd-c01-ok')).toContain('不要调用工具');
  });

  it('does not treat a mismatched or missing ACK as completion', async () => {
    const transport = new MockTransport(
      { id: 'thread-1', status: { type: 'idle' }, canAcceptDirectInput: true },
      { threadId: 'thread-1', turn: { items: [{ type: 'agentMessage', text: 'ACK:wrong' }] } },
    );
    const adapter = new ThreadDispatchAdapter(transport, registry());

    const result = await adapter.waitForAck('thread-1', 'fd-c01-right', 1);

    expect(result).toMatchObject({ ok: false, code: 'TIMEOUT' });
  });

  it('reads incremental progress through cursor-aware item listing', async () => {
    const transport = new MockTransport({ id: 'thread-1', status: { type: 'idle' }, canAcceptDirectInput: true });
    const adapter = new ThreadDispatchAdapter(transport, registry());

    const result = await adapter.readProgress('thread-1', 'cursor-1');

    expect(result).toMatchObject({ ok: true, value: { nextCursor: 'cursor-2' } });
    expect(transport.requests.at(-1)).toMatchObject({
      method: 'thread/items/list',
      params: { threadId: 'thread-1', cursor: 'cursor-1' },
    });
  });

  it('persists reservation before send and refuses retry after uncertain delivery', async () => {
    const transport = new MockTransport({ status: { type: 'idle' }, canAcceptDirectInput: true });
    const original = transport.request.bind(transport);
    let reserved: DispatchRegistry | undefined;
    transport.request = async (method, params) => {
      if (method === 'turn/start') {
        expect(reserved?.sentDispatchIds).toContain('uncertain');
        transport.requests.push({ method, params });
        throw new Error('connection lost after write');
      }
      return original(method, params);
    };
    const adapter = new ThreadDispatchAdapter(transport, registry(), (value) => { reserved = structuredClone(value); });
    expect(await adapter.sendProbe('thread-1', 'uncertain')).toMatchObject({ ok: false, code: 'TRANSPORT_ERROR' });
    const restarted = new ThreadDispatchAdapter(transport, reserved!);
    expect(await restarted.sendProbe('thread-1', 'uncertain')).toMatchObject({ ok: false, code: 'DUPLICATE_DISPATCH' });
    expect(transport.requests.filter((request) => request.method === 'turn/start')).toHaveLength(1);
    expect(transport.requests.at(-1)?.method).toBe('thread/read');
  });
});
