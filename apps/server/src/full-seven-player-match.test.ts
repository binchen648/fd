import {expect,it}from'vitest';
import {WebSocket}from'ws';
import {createMatchServer}from'./match-server';
import type {MatchRoomProjection,RoomHttpResponse,ServerRoomMessage}from'@fd/rules';
import {chooseFullMatchDecision}from'../../../e2e/support/full-seven-player-driver';

class SeatSocket {
 socket:WebSocket;latest?:Extract<ServerRoomMessage,{type:'server:projection'}>;errors:Extract<ServerRoomMessage,{type:'server:error'}>[]=[];
 private listeners=new Set<()=>void>();
 constructor(url:string){this.socket=new WebSocket(url);this.socket.on('message',raw=>{const message=JSON.parse(raw.toString())as ServerRoomMessage;if(message.type==='server:projection')this.latest=message;if(message.type==='server:error')this.errors.push(message);for(const listener of this.listeners)listener();});}
 async wait(predicate:()=>boolean){if(predicate())return;await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{this.listeners.delete(check);reject(new Error('Expected websocket state did not arrive: '+JSON.stringify({viewer:this.latest?.projection.viewer,status:this.latest?.projection.status,seats:this.latest?.projection.seats.map(s=>({seat:s.seat,clientId:s.clientId})),round:this.latest?.projection.match?.round,phase:this.latest?.projection.match?.phase,errors:this.errors})));},5000);const check=()=>{if(predicate()){clearTimeout(timer);this.listeners.delete(check);resolve();}};this.listeners.add(check);});}
 async close(){if(this.socket.readyState===WebSocket.CLOSED)return;await new Promise<void>(resolve=>{this.socket.once('close',()=>resolve());this.socket.close();});}
}

it('plays an unmodified seven-seat production game over HTTP/WS through save/restore and final outcome',async()=>{
 const server=createMatchServer();const port=await server.listen(0),base=`http://127.0.0.1:${port}`;const roomId='full-wire-match';let sockets:SeatSocket[]=[];
 const credentials:RoomHttpResponse[]=[];
 async function post(path:string,data:unknown){return fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});}
 const connectAll=async()=>{sockets=credentials.map(c=>new SeatSocket(`ws://127.0.0.1:${port}/rooms/${roomId}?clientId=${c.clientId}&reconnectToken=${c.reconnectToken}`));await Promise.all(sockets.map(s=>s.wait(()=>!!s.latest)));};
 try{
  for(let seat=1;seat<=7;seat++){
   const response=await post(seat===1?'/rooms':`/rooms/${roomId}/join`,seat===1?{roomId,seed:20260905,hostClientId:'seat-1'}:{clientId:`seat-${seat}`,displayName:`Seat ${seat}`,role:'player'});
   expect(response.ok).toBe(true);credentials.push(await response.json()as RoomHttpResponse);
  }
  await connectAll();
  for(let i=0;i<7;i++){sockets[i]!.socket.send(JSON.stringify({type:'client:select_seat',seat:i+1}));await sockets[i]!.wait(()=>sockets[i]!.latest!.projection.seats[i]!.clientId===`seat-${i+1}`);}
  sockets[0]!.socket.send(JSON.stringify({type:'client:start_match'}));await Promise.all(sockets.map(s=>s.wait(()=>s.latest?.projection.status==='running')));
  let restored=false,duplicate=false,commands=0;const seenRounds=new Set<number>();
  for(;commands<1200;commands++){
   const projections=sockets.map(s=>s.latest!.projection);const m=projections[0]!.match!;seenRounds.add(m.round);
   if(m.outcome)break;
   const {projection,command}=chooseFullMatchDecision(projections);const index=Number(projection.viewer.playerId!.slice(1))-1,actor=sockets[index]!,revision=projection.match!.view.revision;
   const message=command?{type:'client:dispatch_command',requestId:`step-${commands}`,expectedRevision:revision,command}:{type:'client:end_turn',requestId:`step-${commands}`,expectedRevision:revision};
   actor.socket.send(JSON.stringify(message));
   await Promise.all(sockets.map(s=>s.wait(()=>!!s.latest?.projection.match&&s.latest.projection.match.view.revision>revision||s.errors.some(e=>e.requestId===`step-${commands}`))));
   expect(actor.errors.filter(e=>e.requestId===`step-${commands}`)).toEqual([]);
   if(!duplicate&&command?.type==='stage_attack_card'){
    duplicate=true;const room=server.hub.getRoom(roomId),before=JSON.stringify(room.session!.state),version=server.hub.version(roomId);
    actor.socket.send(JSON.stringify({...message,requestId:'duplicate'}));await actor.wait(()=>actor.errors.some(e=>e.requestId==='duplicate'));
    expect(actor.errors.find(e=>e.requestId==='duplicate')!.message).toContain('Stale');expect(JSON.stringify(room.session!.state)).toBe(before);expect(server.hub.version(roomId)).toBe(version);
   }
   if(!restored&&m.round===4&&command?.type==='stage_attack_card'){
    restored=true;const room=server.hub.getRoom(roomId);const saved=room.serializeRoom();const before=JSON.stringify(room.session!.state);
    const forged=structuredClone(saved);forged.session!.state.round.roundNumber++;
    const bad=await post(`/rooms/${roomId}/restore`,{clientId:'seat-1',reconnectToken:credentials[0]!.reconnectToken,snapshot:forged});
    expect(bad.status).toBe(400);expect(server.hub.getRoom(roomId)).toBe(room);expect(JSON.stringify(room.session!.state)).toBe(before);
    const valid=await post(`/rooms/${roomId}/restore`,{clientId:'seat-1',reconnectToken:credentials[0]!.reconnectToken,snapshot:saved});expect(valid.ok).toBe(true);
    await Promise.all(sockets.map(s=>s.close()));await connectAll();expect(JSON.stringify(server.hub.getRoom(roomId).session!.state)).toBe(before);
   }
   if(commands===20){
    const owner=sockets[0]!.latest!.projection.match!.view.cards.filter(c=>c.ownerPlayerId==='p1'&&c.zone==='hand').map(c=>c.instanceId);
    expect(owner.length).toBeGreaterThan(0);expect(sockets[1]!.latest!.projection.match!.view.cards.some(c=>owner.includes(c.instanceId))).toBe(false);
    expect(JSON.stringify(sockets[1]!.latest!.projection)).not.toContain(credentials[0]!.reconnectToken);
   }
  }
  const final=sockets[0]!.latest!.projection;expect(commands).toBeLessThan(1200);expect(restored&&duplicate).toBe(true);expect(final.status).toBe('ended');
  expect([...seenRounds]).toEqual([1,2,3,4,5,6,7,8,9,10,11]);expect(final.match!.outcome).toBeDefined();expect(final.match!.stopReason).toBe('match_complete');
  const s=server.hub.getRoom(roomId).session!;expect(s.logs.filter(l=>l.type==='standard_round_end_resolved').map(l=>l.round)).toEqual([1,2,3,4,5,6,7,8,9,10,11]);
  const finalOutcome=final.match!.outcome;await sockets[0]!.close();sockets[0]=new SeatSocket(`ws://127.0.0.1:${port}/rooms/${roomId}?clientId=seat-1&reconnectToken=${credentials[0]!.reconnectToken}`);await sockets[0]!.wait(()=>!!sockets[0]!.latest);expect(sockets[0]!.latest!.projection.match!.outcome).toEqual(finalOutcome);
 }finally{await Promise.all(sockets.map(s=>s.close()));await server.close();}
},60_000);
