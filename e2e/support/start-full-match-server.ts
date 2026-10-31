import {createMatchServer}from'../../apps/server/src/match-server';
const server=createMatchServer();const port=await server.listen(0);
// Empty real server only. The browser test creates/joins/seats/starts via public HTTP/WS.
console.log(JSON.stringify({httpBase:`http://127.0.0.1:${port}`,wsBase:`ws://127.0.0.1:${port}`}));
const stop=async()=>{await server.close();process.exit(0)};process.once('SIGINT',stop);process.once('SIGTERM',stop);
