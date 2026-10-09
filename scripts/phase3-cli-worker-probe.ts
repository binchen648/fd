import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { AppServerJsonRpcTransport, ThreadDispatchAdapter, type DispatchRegistry } from './phase3-thread-dispatch';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' ? value as RecordValue : {};

export function verifyWorkerAck(threadId: string, turnId: string, dispatchId: string,
  completion: unknown, items: unknown[]): boolean {
  const payload = record(completion);
  const turn = record(payload.turn);
  const messages = items.map(record).filter((item) => item.type === 'agentMessage');
  return payload.threadId === threadId && turn.id === turnId && turn.status === 'completed'
    && messages.length === 1 && messages[0].text === `ACK:${dispatchId}`;
}

async function main(): Promise<void> {
  const executable = process.env.FD_C01_CODEX_EXE;
  if (!executable) throw new Error('Set FD_C01_CODEX_EXE to the explicitly selected local Codex executable');
  const cwd = mkdtempSync(join(tmpdir(), 'fd-c01-worker-'));
  const registryPath = join(cwd, 'registry.json');
  const dispatchId = `fd-c01-${randomUUID()}`;
  const transport = new AppServerJsonRpcTransport(executable, ['app-server', '--stdio']);
  let threadId: string | undefined;
  let turnId: string | undefined;
  let sendAttempts = 0;
  const evidence: RecordValue = { mode: 'dedicated-cli-worker', dispatchId, sendAttempts: 0,
    transportAccepted: false, completed: false, ackMatched: false, ephemeral: true, sandbox: 'read-only' };
  const save = () => writeFileSync(join(cwd, 'evidence.json'), JSON.stringify(evidence, null, 2), { mode: 0o600 });
  try {
    await transport.initialize();
    const started = record(await transport.request('thread/start', {
      cwd, ephemeral: true, sandbox: 'read-only', approvalPolicy: 'never', environments: [],
      baseInstructions: 'You are a connectivity probe. Reply only with the exact ACK requested. Do not call tools, access files, or execute tasks.',
      developerInstructions: 'No tools. Return only the requested ACK text.',
    }));
    threadId = typeof record(started.thread).id === 'string' ? String(record(started.thread).id) : undefined;
    if (!threadId) throw new Error('thread/start returned no thread ID');
    const registry: DispatchRegistry = { threads: [{ threadId, allowed: true }], sentDispatchIds: [] };
    const persist = (value: DispatchRegistry) => writeFileSync(registryPath, JSON.stringify(value), { mode: 0o600 });
    persist(registry);
    const countingTransport = {
      request: (method: string, params?: unknown) => {
        if (method === 'turn/start') {
          sendAttempts++;
          evidence.sendAttempts = sendAttempts;
          save();
        }
        return transport.request(method, params);
      },
      close: () => transport.close(),
    };
    const adapter = new ThreadDispatchAdapter(countingTransport, registry, persist);
    const status = await adapter.readStatus(threadId);
    evidence.initialStatus = status;
    if (!status.ok || status.value.kind !== 'idle' || !status.value.canAcceptDirectInput) {
      evidence.result = 'BLOCKED_STATUS';
      return;
    }
    const send = await adapter.sendProbe(threadId, dispatchId);
    if (!send.ok) {
      evidence.result = 'SEND_FAILED_OR_UNCERTAIN';
      evidence.reconciledStatus = await adapter.readStatus(threadId);
      return;
    }
    const turn = record(record(send.value.turnResponse).turn);
    turnId = typeof turn.id === 'string' ? turn.id : undefined;
    evidence.transportAccepted = true;
    if (!turnId) throw new Error('turn/start accepted without a turn ID');
    const completion = await transport.waitForNotification((method, params) => {
      const payload = record(params);
      return method === 'turn/completed' && payload.threadId === threadId && record(payload.turn).id === turnId;
    }, 45_000);
    let completedPayload = completion;
    let items = transport.notifications.filter(({ method, params }) => {
      const payload = record(params);
      return method === 'item/completed' && payload.threadId === threadId && payload.turnId === turnId;
    }).map(({ params }) => record(params).item);
    if (!completion) {
      evidence.reconciledStatus = await adapter.readStatus(threadId);
      // One bounded reconciliation query; never resend after a timeout.
      const read = record(await transport.request('thread/read', { threadId, includeTurns: true }));
      const turns = record(read.thread).turns;
      const found = Array.isArray(turns) ? turns.map(record).find((entry) => entry.id === turnId) : undefined;
      completedPayload = found ? { threadId, turn: found } : null;
      if (found && Array.isArray(found.items)) items = found.items;
    }
    const payloadTurn = record(record(completedPayload).turn);
    if (!items.length && Array.isArray(payloadTurn.items)) items = payloadTurn.items;
    evidence.completed = payloadTurn.status === 'completed';
    evidence.toolItemTypes = items.map(record).map((item) => item.type)
      .filter((type) => !['agentMessage', 'userMessage', 'reasoning'].includes(String(type)));
    evidence.ackMatched = verifyWorkerAck(threadId, turnId, dispatchId, completedPayload, items);
    evidence.result = evidence.ackMatched && (evidence.toolItemTypes as unknown[]).length === 0
      ? 'CLI_WORKER_ONLY_VERIFIED' : 'BLOCKED';
    evidence.finalStatus = await adapter.readStatus(threadId);
    const duplicate = await adapter.sendProbe(threadId, dispatchId);
    evidence.duplicateRefused = duplicate.ok === false && duplicate.code === 'DUPLICATE_DISPATCH';
    if (!evidence.duplicateRefused || sendAttempts !== 1) evidence.result = 'BLOCKED';
  } catch {
    evidence.result = 'BLOCKED_PROTOCOL_OR_TRANSPORT';
    if (threadId) {
      try { evidence.reconciledStatus = await new ThreadDispatchAdapter(transport,
        { threads: [{ threadId, allowed: true }] }).readStatus(threadId); } catch {}
    }
  } finally {
    if (threadId && turnId && evidence.completed !== true) {
      try { await transport.request('turn/interrupt', { threadId, turnId }); } catch {}
    }
    save();
    transport.close();
    console.log(JSON.stringify(evidence, null, 2));
    if (evidence.result !== 'CLI_WORKER_ONLY_VERIFIED') process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(() => { console.error('Worker probe setup failed'); process.exitCode = 1; });
}
