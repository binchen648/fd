import { createMatchServer } from '../../apps/server/src/match-server';
import { artoriaCasterHostClientId, prepareArtoriaCasterSharedVictoryRoom } from './prepare-artoria-caster-shared-victory-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-b14-shared-victory-${process.pid}`;
const projection = server.hub.createRoom({ roomId, hostClientId: artoriaCasterHostClientId, hostName: '房主', seed: 20260904 });
const room = server.hub.getRoom(roomId);
prepareArtoriaCasterSharedVictoryRoom(room);
const client = projection.clients.find((candidate) => candidate.id === artoriaCasterHostClientId);
if (!client) throw new Error('Artoria Caster B14 E2E fixture host is missing');
process.stdout.write(`${JSON.stringify({ httpBase: `http://127.0.0.1:${port}`, wsBase: `ws://127.0.0.1:${port}`, roomId, clientId: client.id, reconnectToken: room.getIssuedCredential(client.id) })}\n`);
const shutdown = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
