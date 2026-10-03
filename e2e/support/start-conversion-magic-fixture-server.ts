import { createMatchServer } from '../../apps/server/src/match-server';
import { conversionMagicHostClientId, prepareConversionMagicRoom } from './prepare-conversion-magic-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-conversion-magic-${process.pid}`;
const projection = server.hub.createRoom({
  roomId,
  hostClientId: conversionMagicHostClientId,
  hostName: 'Conversion Magic Host',
  seed: 20260909,
});
const room = server.hub.getRoom(roomId);
prepareConversionMagicRoom(room);
const client = projection.clients.find((candidate) => candidate.id === conversionMagicHostClientId);
if (!client) throw new Error('Conversion Magic E2E fixture host is missing');

process.stdout.write(`${JSON.stringify({
  httpBase: `http://127.0.0.1:${port}`,
  wsBase: `ws://127.0.0.1:${port}`,
  roomId,
  clientId: conversionMagicHostClientId,
  reconnectToken: client.reconnectToken,
})}\n`);

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
