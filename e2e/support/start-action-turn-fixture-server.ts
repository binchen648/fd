import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createMatchServer } from '../../apps/server/src/match-server';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `dr-p01-${process.pid}`;
const hub = server.hub;
hub.createRoom({ roomId, hostClientId: 'action-human-1', seed: 20260904 });
for (let seat = 1; seat <= 7; seat++) {
  const clientId = `action-human-${seat}`;
  if (seat !== 1) hub.joinRoom(roomId, { clientId, displayName: clientId, role: 'player' });
  hub.selectSeat(roomId, clientId, seat);
}
hub.startMatch(roomId, 'action-human-1');
const room = hub.getRoom(roomId);
const session = room.session!;
while (session.state.round.activePhase === 'preparation') {
  const player = session.state.players.find(p => p.seat === session.state.round.prioritySeat)!;
  assert.equal(session.passPriority(player.id).ok, true);
}
while (session.state.round.activePhase === 'advance') {
  const player = session.state.players.find(p => p.seat === session.state.round.prioritySeat)!;
  const target = player.seat === 1 ? 'magic_workshop' : player.seat % 2 === 0 ? 'miyama_town' : 'shinto';
  assert.equal(session.dispatchPlayerCommand(player.id, { type: 'deploy_player', locationId: target }).ok, true);
}
assert.equal(session.state.round.activePhase, 'action');
assert.equal(session.state.round.prioritySeat, 1);
process.stdout.write(`${JSON.stringify({
  cwd: process.cwd(),
  sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  pid: process.pid,
  roomId,
  httpBase: `http://127.0.0.1:${port}`,
  wsBase: `ws://127.0.0.1:${port}`,
  clients: Array.from({ length: 7 }, (_, i) => ({ clientId: `action-human-${i + 1}`, reconnectToken: room.getIssuedCredential(`action-human-${i + 1}`) })),
})}\n`);
const shutdown = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
