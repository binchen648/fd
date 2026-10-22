import { createMatchServer } from '../../apps/server/src/match-server';
import { achillesHostClientId, prepareAchillesBattleLossRevealRoom } from './prepare-achilles-battle-loss-reveal-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-b16-achilles-reveal-${process.pid}`;
const projection = server.hub.createRoom({ roomId, hostClientId: achillesHostClientId, hostName: '房主', seed: 20260904 });
const room = server.hub.getRoom(roomId);
prepareAchillesBattleLossRevealRoom(room);
const client = projection.clients.find((candidate) => candidate.id === achillesHostClientId);
if (!client) throw new Error('Achilles B16 E2E fixture host is missing');
process.stdout.write(`${JSON.stringify({ httpBase: `http://127.0.0.1:${port}`, wsBase: `ws://127.0.0.1:${port}`, roomId, clientId: client.id, reconnectToken: room.getIssuedCredential(client.id) })}\n`);
const shutdown = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
