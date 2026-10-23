import { createMatchServer } from '../../apps/server/src/match-server';
import { artoriaAltExtraHostClientId, prepareArtoriaAltNobleBloomExtraRoom } from './prepare-artoria-alt-noble-bloom-extra-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-b19-noble-bloom-extra-${process.pid}`;
const projection = server.hub.createRoom({ roomId, hostClientId: artoriaAltExtraHostClientId, hostName: '房主', seed: 20260914 });
const room = server.hub.getRoom(roomId); prepareArtoriaAltNobleBloomExtraRoom(room);
const client = projection.clients.find((candidate) => candidate.id === artoriaAltExtraHostClientId);
if (!client) throw new Error('Artoria Alter B19 E2E fixture host is missing');
process.stdout.write(`${JSON.stringify({ httpBase: `http://127.0.0.1:${port}`, wsBase: `ws://127.0.0.1:${port}`, roomId, clientId: client.id, reconnectToken: room.getIssuedCredential(client.id) })}\n`);
const shutdown = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
