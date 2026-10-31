import {execFileSync} from 'node:child_process';
import {createMatchServer} from '../../apps/server/src/match-server';
const server=createMatchServer();const port=await server.listen(0);const hub=server.hub;
const roomId=`round-transition-${process.pid}`;
hub.createRoom({roomId,hostClientId:'round-1',seed:20260904});
for(let seat=1;seat<=7;seat++) {const id=`round-${seat}`;if(seat!==1)hub.joinRoom(roomId,{clientId:id,displayName:id,role:'player'});hub.selectSeat(roomId,id,seat);}
hub.startMatch(roomId,'round-1');const room=hub.getRoom(roomId);const session=room.session!;
// Bounded cleanup boundary fixture; commands, server and browser are production paths.
Object.assign(session.state.round,{roundNumber:1,activePhase:'battle',prioritySeat:7,startingSeat:1});
session.state.players.forEach(p=>p.locationId='magic_workshop');
session.state.abilityRuntime!.hostRequests=[];session.state.abilityRuntime!.responseWindows=[];delete session.state.abilityRuntime!.pendingDecision;
console.log(JSON.stringify({sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),roomId,httpBase:`http://127.0.0.1:${port}`,wsBase:`ws://127.0.0.1:${port}`,clients:[2,7].map(seat=>({clientId:`round-${seat}`,token:room.getIssuedCredential(`round-${seat}`)}))}));
const shutdown=async()=>{await server.close();process.exit(0)};process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
