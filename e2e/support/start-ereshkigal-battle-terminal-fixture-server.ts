import { createMatchServer } from '../../apps/server/src/match-server';
import { ereshkigalHostClientId, prepareEreshkigalBattleTerminalRoom } from './prepare-ereshkigal-battle-terminal-room';

const server = createMatchServer();
const port = await server.listen(0);
const roomId = `fd-b15-eresh-terminal-${process.pid}`;
const projection = server.hub.createRoom({ roomId, hostClientId: ereshkigalHostClientId, hostName: '房主', seed: 20260904 });
const room = server.hub.getRoom(roomId);
prepareEreshkigalBattleTerminalRoom(room);
const client = projection.clients.find((candidate) => candidate.id === ereshkigalHostClientId);
if (!client) throw new Error('Ereshkigal B15 E2E fixture host is missing');
process.stdout.write(`${JSON.stringify({ httpBase: `http://127.0.0.1:${port}`, wsBase: `ws://127.0.0.1:${port}`, roomId, clientId: client.id, reconnectToken: room.getIssuedCredential(client.id) })}\n`);
const shutdown = async () => { await server.close(); process.exit(0); };
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
