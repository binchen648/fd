import { createMatchServer } from '../../apps/server/src/match-server';
import { prepareShinjiBattleLossRoom, shinjiHostClientId } from './prepare-shinji-battle-loss-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-shinji-battle-loss-${process.pid}`;
const projection = server.hub.createRoom({ roomId, hostClientId: shinjiHostClientId, hostName: '房主', seed: 20260904 });
const room = server.hub.getRoom(roomId);
prepareShinjiBattleLossRoom(room);
const client = projection.clients.find((candidate) => candidate.id === shinjiHostClientId);
if (!client) throw new Error('Shinji battle-loss E2E fixture host is missing');

process.stdout.write(`${JSON.stringify({
  httpBase: `http://127.0.0.1:${port}`,
  wsBase: `ws://127.0.0.1:${port}`,
  roomId,
  clientId: shinjiHostClientId,
  reconnectToken: room.getIssuedCredential(client.id),
})}\n`);

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
