import { createMatchServer } from './match-server';

const port = Number(process.env.PORT ?? 8787);
const matchServer = createMatchServer();

matchServer.listen(port).then(() => {
  console.log(`FD match server listening on http://127.0.0.1:${port}`);
});
