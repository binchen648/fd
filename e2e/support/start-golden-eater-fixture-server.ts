import { createMatchServer } from '../../apps/server/src/match-server';
import { prepareGoldenEaterRoom, goldenEaterHostClientId } from './prepare-golden-eater-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-golden-eater-${process.pid}`;
const projection = server.hub.createRoom({
  roomId,
  hostClientId: goldenEaterHostClientId,
  hostName: 'Golden Eater Host',
  seed: 20261003,
});
const room = server.hub.getRoom(roomId);
prepareGoldenEaterRoom(room);
const client = projection.clients.find((candidate) => candidate.id === goldenEaterHostClientId);
if (!client) throw new Error('Golden Eater E2E fixture host is missing');

process.stdout.write(`${JSON.stringify({
  httpBase: `http://127.0.0.1:${port}`,
  wsBase: `ws://127.0.0.1:${port}`,
  roomId,
  clientId: goldenEaterHostClientId,
  reconnectToken: client.reconnectToken,
})}\n`);

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
