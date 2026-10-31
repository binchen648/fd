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
