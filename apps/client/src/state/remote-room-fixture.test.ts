import {expect,it}from'vitest';
import {createMatchRoom}from'@fd/rules/match-room';
import {projectRemoteRoomFixture}from'./remote-room-fixture';
it('renders distinct server-authorized deployment destinations in the outpost phase',()=>{
 const room=createMatchRoom({seed:20260904,hostClientId:'seat-1'});
 for(let seat=1;seat<=7;seat++){const id=`seat-${seat}`;if(seat>1)room.joinRoom({clientId:id,displayName:id,role:'player'});room.selectSeat(id,seat);}
 room.startMatch('seat-1');for(let seat=1;seat<=7;seat++)expect(room.endClientTurn(`seat-${seat}`).ok).toBe(true);
 const projection=room.getProjection('seat-1'),fixture=projectRemoteRoomFixture(projection)!;
 const actions=fixture.availableActions.filter(a=>a.backendCommand?.type==='deploy_player');
 expect(actions.length).toBeGreaterThan(1);expect(actions.every(a=>a.kind==='deploy')).toBe(true);
 expect(actions.map(a=>a.label)).toEqual(expect.arrayContaining(['部署至 魔术工房','部署至 深山町','部署至 新都']));
 expect(fixture.match.phase).toContain('前哨阶段');
 expect(actions.map(a=>a.backendCommand)).toEqual(projection.match!.view.legalActions.filter(a=>a.type==='deploy_player'));
});

it('labels each server-authorized Inferno payment and preserves the exact wire command',()=>{
 const room=createMatchRoom({seed:20260904,hostClientId:'seat-1'});
 for(let seat=1;seat<=7;seat++){const id=`seat-${seat}`;if(seat>1)room.joinRoom({clientId:id,displayName:id,role:'player'});room.selectSeat(id,seat);}
 room.startMatch('seat-1');for(let seat=1;seat<=7;seat++)expect(room.endClientTurn(`seat-${seat}`).ok).toBe(true);
 // Bounded projection fixture. This verifies the client adapter, not effect activation.
 const state=room.session!.state,fireOwner=state.players.find(p=>p.servantCardId==='servant.tomoe')!;
 const actor=state.players.find(p=>p.id!==fireOwner.id)!;actor.vp=3;state.round.prioritySeat=actor.seat;
 (state as any).activeStatuses=[{id:'inferno_fire',sourceControllerId:fireOwner.id,locationId:'miyama_town',duration:'next_round',startsAtRound:state.round.roundNumber,expiresAtRound:state.round.roundNumber+1}];
 const projection=room.getProjection(`seat-${actor.seat}`),fixture=projectRemoteRoomFixture(projection)!;
 const actions=fixture.availableActions.filter(a=>a.backendCommand?.type==='deploy_player'&&a.backendCommand.locationId==='miyama_town');
 expect(actions.map(a=>a.label)).toEqual(['部署至 深山町','部署至 深山町 · 支付 1 战果','部署至 深山町 · 支付 2 战果','部署至 深山町 · 支付 3 战果']);
 expect(actions.map(a=>a.backendCommand)).toEqual(projection.match!.view.legalActions.filter(a=>a.type==='deploy_player'&&a.locationId==='miyama_town'));
});
