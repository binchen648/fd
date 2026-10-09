import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface, type Interface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

type JsonObject = Record<string, unknown>;

export type DispatchStatus =
  | { kind: 'idle'; canAcceptDirectInput: boolean | null }
  | { kind: 'running'; flags: string[]; canAcceptDirectInput: boolean | null }
  | { kind: 'waiting'; flags: string[]; canAcceptDirectInput: boolean | null }
  | { kind: 'unknown'; reason: string; canAcceptDirectInput: boolean | null }
  | { kind: 'unsupported'; reason: string };

export type DispatchResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'UNSUPPORTED' | 'UNREGISTERED_THREAD' | 'NOT_IDLE' | 'DUPLICATE_DISPATCH' | 'TRANSPORT_ERROR' | 'ACK_MISMATCH' | 'TIMEOUT'; message: string };

export type ThreadRegistration = {
  threadId: string;
  role?: string;
  allowed?: boolean;
};

export type DispatchRegistry = {
  threads: ThreadRegistration[];
  sentDispatchIds?: string[];
};

export interface ProtocolTransport {
  request(method: string, params?: unknown): Promise<unknown>;
  waitForNotification?(predicate: (method: string, params: unknown) => boolean, timeoutMs: number): Promise<unknown | null>;
  close(): void;
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

export class AppServerJsonRpcTransport implements ProtocolTransport {
  private child: ChildProcessWithoutNullStreams;
  private lines: Interface;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private notificationWaiters: Array<{
    predicate: (method: string, params: unknown) => boolean;
    resolve: (value: unknown | null) => void;
    timer: NodeJS.Timeout;
  }> = [];

  constructor(command = 'codex', args = ['app-server', '--stdio']) {
    this.child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    this.lines = createInterface({ input: this.child.stdout });
    this.lines.on('line', (line) => this.handleLine(line));
    this.child.stderr.on('data', (chunk) => {
      const text = String(chunk).trim();
      if (text) {
        // Keep stderr available through rejected requests; do not print secrets or full logs.
      }
    });
    this.child.on('exit', () => {
      for (const request of Array.from(this.pending.values())) {
        request.reject(new Error('app-server transport exited'));
      }
      this.pending.clear();
    });
  }

  async initialize(): Promise<unknown> {
    return this.request('initialize', {
      clientInfo: { name: 'fd-c01-thread-dispatch', title: 'FD C01 Thread Dispatch Probe', version: '0.1.0' },
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
        optOutNotificationMethods: [],
      },
    });
  }

  request(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    const message = { jsonrpc: '2.0', id, method, params };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(`${JSON.stringify(message)}\n`, (error) => {
        if (error) {
          this.pending.delete(id);
          reject(error);
        }
      });
    });
  }

  waitForNotification(predicate: (method: string, params: unknown) => boolean, timeoutMs: number): Promise<unknown | null> {
    return new Promise((resolve) => {
      const waiter = {
        predicate,
        resolve,
        timer: setTimeout(() => {
          this.notificationWaiters = this.notificationWaiters.filter((entry) => entry !== waiter);
          resolve(null);
        }, timeoutMs),
      };
      this.notificationWaiters.push(waiter);
    });
  }

  close(): void {
    this.lines.close();
    this.child.stdin.end();
    this.child.kill();
  }

  private handleLine(line: string): void {
    if (!line.trim()) return;
    let message: JsonObject;
    try {
      message = JSON.parse(line) as JsonObject;
    } catch {
      return;
    }

    if (typeof message.id === 'number' && this.pending.has(message.id)) {
      const request = this.pending.get(message.id)!;
      this.pending.delete(message.id);
      if (message.error) {
        request.reject(new Error(JSON.stringify(message.error)));
      } else {
        request.resolve(message.result);
      }
      return;
    }

    if (typeof message.method === 'string') {
      for (const waiter of [...this.notificationWaiters]) {
        if (waiter.predicate(message.method, message.params)) {
          clearTimeout(waiter.timer);
          this.notificationWaiters = this.notificationWaiters.filter((entry) => entry !== waiter);
          waiter.resolve(message.params ?? null);
        }
      }
    }
  }
}

export function loadRegistry(path: string): DispatchRegistry {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as DispatchRegistry;
  if (!Array.isArray(parsed.threads)) {
    throw new Error('registry must contain a threads array');
  }
  return parsed;
}

export function normalizeThreadStatus(thread: JsonObject | null | undefined): DispatchStatus {
  if (!thread) return { kind: 'unknown', reason: 'thread/read returned no thread', canAcceptDirectInput: null };
  const canAcceptDirectInput = typeof thread.canAcceptDirectInput === 'boolean' ? thread.canAcceptDirectInput : null;
  const status = thread.status as JsonObject | undefined;
  if (!status || typeof status.type !== 'string') {
    return { kind: 'unknown', reason: 'thread status is missing', canAcceptDirectInput };
  }
  if (status.type === 'idle') return { kind: 'idle', canAcceptDirectInput };
  if (status.type === 'active') {
    const flags = Array.isArray(status.activeFlags) ? status.activeFlags.map(String) : [];
    if (flags.includes('waitingOnApproval') || flags.includes('waitingOnUserInput')) {
      return { kind: 'waiting', flags, canAcceptDirectInput };
    }
    return { kind: 'running', flags, canAcceptDirectInput };
  }
  return { kind: 'unknown', reason: `status is ${status.type}`, canAcceptDirectInput };
}

export class ThreadDispatchAdapter {
  constructor(private transport: ProtocolTransport, private registry: DispatchRegistry) {}

  async readStatus(threadId: string): Promise<DispatchResult<DispatchStatus>> {
    if (!this.isRegistered(threadId)) {
      return { ok: false, code: 'UNREGISTERED_THREAD', message: 'thread is not explicitly registered for C01 dispatch' };
    }
    try {
      const response = await this.transport.request('thread/read', { threadId, includeTurns: false }) as JsonObject;
      return { ok: true, value: normalizeThreadStatus(response.thread as JsonObject) };
    } catch (error) {
      return { ok: false, code: 'TRANSPORT_ERROR', message: error instanceof Error ? error.message : String(error) };
    }
  }

  async readProgress(threadId: string, cursor?: string | null): Promise<DispatchResult<{ items: unknown[]; nextCursor: string | null }>> {
    if (!this.isRegistered(threadId)) {
      return { ok: false, code: 'UNREGISTERED_THREAD', message: 'thread is not explicitly registered for C01 dispatch' };
    }
    try {
      const response = await this.transport.request('thread/items/list', {
        threadId,
        cursor: cursor ?? null,
        limit: 20,
        sortDirection: 'asc',
      }) as JsonObject;
      return {
        ok: true,
        value: {
          items: Array.isArray(response.data) ? response.data : [],
          nextCursor: typeof response.nextCursor === 'string' ? response.nextCursor : null,
        },
      };
    } catch (error) {
      return { ok: false, code: 'TRANSPORT_ERROR', message: error instanceof Error ? error.message : String(error) };
    }
  }

  previewDispatch(threadId: string, status: DispatchStatus, dispatchId: string): DispatchResult<{ threadId: string; dispatchId: string; message: string }> {
    if (!this.isRegistered(threadId)) {
      return { ok: false, code: 'UNREGISTERED_THREAD', message: 'thread is not explicitly registered for C01 dispatch' };
    }
    if ((this.registry.sentDispatchIds ?? []).includes(dispatchId)) {
      return { ok: false, code: 'DUPLICATE_DISPATCH', message: 'dispatchId has already been recorded as sent' };
    }
    if (status.kind !== 'idle' || status.canAcceptDirectInput === false) {
      return { ok: false, code: 'NOT_IDLE', message: `thread status is ${status.kind}; refusing to send` };
    }
    return { ok: true, value: { threadId, dispatchId, message: probeMessage(dispatchId) } };
  }

  async sendProbe(threadId: string, dispatchId: string): Promise<DispatchResult<{ accepted: true; turnResponse: unknown }>> {
    const status = await this.readStatus(threadId);
    if (status.ok === false) return { ok: false, code: status.code, message: status.message };
    const preview = this.previewDispatch(threadId, status.value, dispatchId);
    if (preview.ok === false) return { ok: false, code: preview.code, message: preview.message };
    try {
      const turnResponse = await this.transport.request('turn/start', {
        threadId,
        input: [{ type: 'text', text: preview.value.message, text_elements: [] }],
        responsesapiClientMetadata: { fdDispatchId: dispatchId, fdTask: 'P3-C01-THREAD-DISPATCH-FEASIBILITY' },
      });
      this.registry.sentDispatchIds = [...(this.registry.sentDispatchIds ?? []), dispatchId];
      return { ok: true, value: { accepted: true, turnResponse } };
    } catch (error) {
      return { ok: false, code: 'TRANSPORT_ERROR', message: error instanceof Error ? error.message : String(error) };
    }
  }

  async waitForAck(threadId: string, dispatchId: string, timeoutMs = 60_000): Promise<DispatchResult<{ completed: true; turn: unknown }>> {
    const expected = `ACK:${dispatchId}`;
    const notification = await this.transport.waitForNotification?.((method, params) => {
      if (method !== 'turn/completed') return false;
      const record = params as JsonObject | null;
      if (!record || record.threadId !== threadId) return false;
      return JSON.stringify(record).includes(expected);
    }, timeoutMs);
    if (!notification) {
      return { ok: false, code: 'TIMEOUT', message: 'no matching turn/completed ACK before timeout; reconcile status before retry' };
    }
    if (!JSON.stringify(notification).includes(expected)) {
      return { ok: false, code: 'ACK_MISMATCH', message: 'turn completed but ACK did not match dispatchId' };
    }
    return { ok: true, value: { completed: true, turn: notification } };
  }

  private isRegistered(threadId: string): boolean {
    return this.registry.threads.some((thread) => thread.threadId === threadId && thread.allowed !== false);
  }
}

export function probeMessage(dispatchId: string): string {
  return [
    '这是 FD C01 调度连通性探针。',
    `dispatchId：${dispatchId}`,
    `请仅回复 ACK:${dispatchId}。`,
    '不要调用工具、读取或修改文件，也不要执行工程任务。',
  ].join('\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (command === 'protocol-probe') {
    const transport = new AppServerJsonRpcTransport();
    try {
      const init = await transport.initialize();
      const cwdArg = valueAfter(args, '--cwd');
      const list = await transport.request('thread/list', {
        limit: Number(valueAfter(args, '--limit') ?? '5'),
        cwd: cwdArg ?? undefined,
        useStateDbOnly: true,
      }) as JsonObject;
      const data = Array.isArray(list.data) ? list.data as JsonObject[] : [];
      console.log(JSON.stringify({
        initialized: true,
        userAgent: (init as JsonObject).userAgent,
        listedThreads: data.length,
        nextCursor: list.nextCursor ?? null,
        threads: data.map((thread) => ({
          id: thread.id,
          source: thread.source,
          status: thread.status,
          canAcceptDirectInput: thread.canAcceptDirectInput ?? null,
          cwd: thread.cwd,
          cliVersion: thread.cliVersion,
        })),
      }, null, 2));
    } finally {
      transport.close();
    }
    return;
  }

  if (command === 'probe') {
    const registryPath = requiredValue(args, '--registry');
    const threadId = requiredValue(args, '--thread-id');
    const dispatchId = valueAfter(args, '--dispatch-id') ?? `fd-c01-${randomUUID()}`;
    if (!existsSync(registryPath)) throw new Error(`registry not found: ${registryPath}`);
    const transport = new AppServerJsonRpcTransport();
    try {
      await transport.initialize();
      const adapter = new ThreadDispatchAdapter(transport, loadRegistry(registryPath));
      const send = await adapter.sendProbe(threadId, dispatchId);
      console.log(JSON.stringify({ dispatchId, send }, null, 2));
      if (!send.ok) return;
      const ack = await adapter.waitForAck(threadId, dispatchId);
      console.log(JSON.stringify({ dispatchId, ack }, null, 2));
    } finally {
      transport.close();
    }
    return;
  }

  console.log('Usage: tsx scripts/phase3-thread-dispatch.ts protocol-probe [--cwd PATH] [--limit N]');
  console.log('   or: tsx scripts/phase3-thread-dispatch.ts probe --registry local.json --thread-id ID [--dispatch-id ID]');
}

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function requiredValue(args: string[], name: string): string {
  const value = valueAfter(args, name);
  if (!value) throw new Error(`missing ${name}`);
  return value;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
