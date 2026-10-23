import { createMatchServer } from '../../apps/server/src/match-server';
import { artoriaCasterLuckHostClientId, prepareArtoriaCasterLuckOnWinRoom } from './prepare-artoria-caster-luck-on-win-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-b20-artoriac-luck-${process.pid}`;
const projection = server.hub.createRoom({ roomId, hostClientId: artoriaCasterLuckHostClientId, hostName: '房主', seed: 202620 });
const room = server.hub.getRoom(roomId);
prepareArtoriaCasterLuckOnWinRoom(room);
const client = projection.clients.find((candidate) => candidate.id === artoriaCasterLuckHostClientId);
if (!client) throw new Error('B20 E2E fixture host is missing');
process.stdout.write(`${JSON.stringify({ httpBase: `http://127.0.0.1:${port}`, wsBase: `ws://127.0.0.1:${port}`, roomId, clientId: client.id, reconnectToken: room.getIssuedCredential(client.id) })}\n`);
const shutdown = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
