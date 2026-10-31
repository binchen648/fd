import { afterEach, expect, it, vi } from 'vitest';
import type { RoomHttpResponse } from '@fd/rules';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { createCipheriv, randomBytes } from 'node:crypto';
import { WebSocket } from 'ws';
import { createMatchServer, type MatchServerHandle } from './match-server';
import { RoomStore } from './room-store';

const directories: string[] = [];
const servers: MatchServerHandle[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) await server.close();
  for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function stateFile() {
  const dir = mkdtempSync(join(tmpdir(), 'fd-recovery-')); directories.push(dir);
  return join(dir, 'rooms.json');
}
function start(file: string) {
  const server = createMatchServer({ stateFile: file } as Parameters<typeof createMatchServer>[0]);
  servers.push(server); return server;
}
async function post(port: number, path: string, body: unknown) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  expect(response.ok).toBe(true); return response.json() as Promise<RoomHttpResponse>;
}
async function connect(port: number, id: string, token: string) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/rooms/restart?clientId=${id}&reconnectToken=${token}`);
  const inbox: any[] = [];
  ws.on('message', data => inbox.push(JSON.parse(data.toString())));
  await new Promise<void>((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  async function next(predicate: (m: any) => boolean) {
    await expect.poll(() => inbox.findIndex(predicate)).toBeGreaterThanOrEqual(0);
    return inbox.splice(inbox.findIndex(predicate), 1)[0];
  }
  await next(m => m.type === 'server:projection');
  return { ws, next };
}

it('durably restores seven real identities and rejects stale/duplicate commands after a new server instance', async () => {
  const file = stateFile(); const server = start(file); const port = await server.listen();
  const credentials: any[] = [];
  for (let seat = 1; seat <= 7; seat++) {
    const credential = await post(port, seat === 1 ? '/rooms' : '/rooms/restart/join', seat === 1
      ? { roomId: 'restart', hostClientId: 's1', seed: 20260904 }
      : { clientId: `s${seat}`, displayName: `Seat ${seat}` });
    credentials.push(credential);
    const c = await connect(port, credential.clientId, credential.reconnectToken);
    c.ws.send(JSON.stringify({ type: 'client:select_seat', seat }));
    await c.next(m => m.type === 'server:projection' && m.projection.viewer.playerId === `p${seat}`); c.ws.close();
  }
  const host = credentials[0]; const c = await connect(port, host.clientId, host.reconnectToken);
  c.ws.send(JSON.stringify({ type: 'client:start_match' }));
  await c.next(m => m.type === 'server:projection' && m.projection.status === 'running');
  const before = server.hub.project('restart', 's1').match!;
  await server.close(); servers.splice(servers.indexOf(server), 1);
  const restored = start(file); const newPort = await restored.listen();
  expect(restored.hub.hasRoom('restart')).toBe(true);
  expect(restored.hub.project('restart', 's1').seats.map(s => s.clientId)).toEqual(credentials.map(c => c.clientId));
  const after = restored.hub.project('restart', 's1').match!;
  expect(after.round).toBe(before.round); expect(after.phase).toBe(before.phase);
  expect(after.view.legalActions).toEqual(before.view.legalActions);
  expect(restored.hub.project('restart', 's1').clients.every(c => !c.connected)).toBe(true);
  await expect(connect(newPort, host.clientId, 'wrong-token')).rejects.toThrow('401');
  await expect(connect(newPort, 's2', host.reconnectToken)).rejects.toThrow('401');
  const socket = await connect(newPort, host.clientId, host.reconnectToken);
  const revision = restored.hub.project('restart', 's1').match!.view.revision;
  socket.ws.send(JSON.stringify({ type: 'client:end_turn', expectedRevision: revision, requestId: 'accepted' }));
  await socket.next(m => m.type === 'server:projection' && m.projection.match.view.revision > revision);
  const accepted = structuredClone(restored.hub.serialize());
  socket.ws.send(JSON.stringify({ type: 'client:end_turn', expectedRevision: revision, requestId: 'duplicate' }));
  expect((await socket.next(m => m.type === 'server:error' && m.requestId === 'duplicate')).message).toContain('Stale');
  expect(restored.hub.serialize()).toEqual(accepted);
  const publicText = JSON.stringify(restored.hub.project('restart', 's2'));
  expect(publicText).not.toContain(host.reconnectToken); expect(publicText).not.toContain('persistenceSecret');
  for (const card of restored.hub.project('restart', 's1').match!.view.cards.filter(c => c.ownerPlayerId === 'p1' && c.zone === 'hand')) {
    expect(publicText).not.toContain(card.instanceId);
  }
  const disk = readFileSync(file, 'utf8'); expect(disk).not.toContain(host.reconnectToken); expect(disk).not.toContain('persistenceSecret');
  expect(JSON.parse(disk).version).toBe(2);
  expect(Buffer.byteLength(disk)).toBeLessThan(Buffer.byteLength(JSON.stringify(restored.hub.serialize())) / 3);
  socket.ws.close();
});

it('refuses a corrupt durable file instead of silently starting an empty hub', () => {
  const file = stateFile(); writeFileSync(file, '{broken');
  expect(() => start(file)).toThrow(/store|state|persist|JSON|key/i);
  expect(readFileSync(file, 'utf8')).toBe('{broken');
});

it('loads an authenticated v1 file and upgrades to compressed v2 on the next confirmed operation', async () => {
  const file = stateFile(); const server = start(file); const port = await server.listen();
  const host = await post(port, '/rooms', { roomId: 'restart', hostClientId: 'host' });
  const snapshot = server.hub.serialize();
  const contexts = snapshot.rooms.map(r => [r.roomId, server.hub.getRoom(r.roomId).getPersistenceContext()]);
  // Build the original format independently, including its original AAD.
  const iv = randomBytes(12); const legacy = createCipheriv('aes-256-gcm', readFileSync(`${file}.key`), iv);
  legacy.setAAD(Buffer.from('fd-room-store-v1'));
  const data = Buffer.concat([legacy.update(JSON.stringify({ version: 1, snapshot, contexts }), 'utf8'), legacy.final()]);
  await server.close(); servers.splice(servers.indexOf(server), 1);
  writeFileSync(file, JSON.stringify({ version: 1, iv: iv.toString('base64'), tag: legacy.getAuthTag().toString('base64'), data: data.toString('base64') }));
  const restored = start(file); const newPort = await restored.listen();
  expect(restored.hub.getRoom('restart').getIssuedCredential('host')).toBe(host.reconnectToken);
  await post(newPort, '/rooms/restart/join', { clientId: 'new', displayName: 'New' });
  expect(JSON.parse(readFileSync(file, 'utf8')).version).toBe(2);
});

it('rejects concurrent writers and authenticated ciphertext corruption, preserving disk evidence', async () => {
  const file = stateFile(); const server = start(file); const port = await server.listen();
  await post(port, '/rooms', { roomId: 'restart', hostClientId: 'host' });
  expect(() => start(file)).toThrow('active writer');
  await server.close(); servers.splice(servers.indexOf(server), 1);
  const original = JSON.parse(readFileSync(file, 'utf8'));
  const bytes = Buffer.from(original.data, 'base64'); bytes[0] = bytes[0]! ^ 1; original.data = bytes.toString('base64');
  writeFileSync(file, JSON.stringify(original)); const broken = readFileSync(file, 'utf8');
  expect(() => start(file)).toThrow('could not be validated'); expect(readFileSync(file, 'utf8')).toBe(broken);
});

it('does not acknowledge failed saves and blocks later mutations until restart from last durable state', async () => {
  const file = stateFile(); const server = start(file); const port = await server.listen();
  const host = await post(port, '/rooms', { roomId: 'restart', hostClientId: 'host' });
  const before = readFileSync(file, 'utf8');
  const received = new Promise<void>(done => server.server.once('request', () => done()));
  let pending!: ReturnType<typeof httpRequest>;
  const pendingResponse = new Promise<{ status: number; text: string }>(done => {
    pending = httpRequest(`http://127.0.0.1:${port}/rooms/restart/join`, { method: 'POST', headers: { 'content-type': 'application/json' } }, response => {
      let text = ''; response.on('data', part => { text += part; }); response.on('end', () => done({ status: response.statusCode!, text }));
    });
    pending.write('{"clientId":"pending",');
  });
  await received;
  const save = vi.spyOn(RoomStore.prototype, 'save').mockImplementation(() => { throw new Error('simulated disk failure'); });
  try {
    for (const id of ['failed', 'blocked']) {
      const r = await fetch(`http://127.0.0.1:${port}/rooms/restart/join`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId: id, displayName: id }) });
      expect(r.status).toBe(400); expect(await r.text()).toContain('storage unavailable');
    }
    expect((await fetch(`http://127.0.0.1:${port}/health`)).status).toBe(503);
    pending.end('"displayName":"Pending"}');
    expect(await pendingResponse).toMatchObject({ status: 400 });
    expect(server.hub.project('restart', 'host').clients.some(c => c.id === 'pending')).toBe(false);
    expect(server.hub.project('restart', 'host').clients.some(c => c.id === 'blocked')).toBe(false);
    expect(readFileSync(file, 'utf8')).toBe(before);
  } finally { save.mockRestore(); }
  await server.close(); servers.splice(servers.indexOf(server), 1);
  const recovered = start(file); await recovered.listen();
  expect(recovered.hub.project('restart', 'host').clients.map(c => c.id)).toEqual(['host']);
  expect(recovered.hub.getRoom('restart').getIssuedCredential('host')).toBe(host.reconnectToken);
});
