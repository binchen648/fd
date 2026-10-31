import { createMatchServer } from './match-server';
import { resolve } from 'node:path';

const port = Number(process.env.PORT ?? 8787);
const matchServer = createMatchServer({ stateFile: resolve(process.env.FD_STATE_FILE ?? '.fd-server/rooms.json') });

matchServer.listen(port).then((actualPort) => {
  console.log(`FD match server listening on http://127.0.0.1:${actualPort}`);
});

const stop = async () => { await matchServer.close(); process.exit(0); };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
