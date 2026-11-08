import {expect,it}from'vitest';
import {createMatchRoom}from'@fd/rules/match-room';
import {projectRemoteRoomFixture}from'./remote-room-fixture';
it('renders distinct server-authorized deployment destinations in the outpost phase',()=>{
 const room=createMatchRoom({seed:20260904,hostClientId:'seat-1'});
 for(let seat=1;seat<=7;seat++){const id=`seat-${seat}`;if(seat>1)room.joinRoom({clientId:id,displayName:id,role:'player'});room.selectSeat(id,seat);}
 room.startMatch('seat-1');
 for(let i=0;room.session!.state.round.activePhase==='round_start'&&i<12;i++){
  const owner=room.getProjection('seat-1').match!.priorityPlayerId;
  const client=room.getProjection('seat-1').seats.find(seat=>seat.playerId===owner)!.clientId!;
  const action=room.getProjection(client).match!.view.legalActions.find(action=>action.type==='decline_this_window')!;
  expect(action).toBeDefined();expect(room.dispatchClientCommand(client,action).ok).toBe(true);
 }
 for(let seat=1;seat<=7;seat++)expect(room.endClientTurn(`seat-${seat}`).ok).toBe(true);
 const projection=room.getProjection('seat-1'),fixture=projectRemoteRoomFixture(projection)!;
 const actions=fixture.availableActions.filter(a=>a.backendCommand?.type==='deploy_player');
 expect(actions.length).toBeGreaterThan(1);expect(actions.every(a=>a.kind==='deploy')).toBe(true);
 expect(actions.map(a=>a.label)).toEqual(expect.arrayContaining(['部署至 魔术工房','部署至 深山町','部署至 新都']));
 expect(fixture.match.phase).toContain('前哨阶段');
 expect(actions.map(a=>a.backendCommand)).toEqual(projection.match!.view.legalActions.filter(a=>a.type==='deploy_player'));
});

import type { MatchRoomProjection } from "@fd/rules/match-room";


type Participation = { locationId: string; sourceId: string; declined: boolean; canDeclare: boolean };

const buildProjection = (participation?: Participation): MatchRoomProjection => ({
  viewer: { playerId: 'p1' },
  seats: [{ playerId: 'p1', displayName: 'P1', ready: true }],
  match: {
    round: 3,
    phase: 'action',
    priorityPlayerId: 'p1',
    view: { players: [{ id: 'p1', seat: 1, vp: 2, mana: 4, masterCardId: 'master.test', handCount: 0, deckCount: 0 }], cards: [], legalActions: [], stagedAttacks: [] },
    interactionWindows: [],
    directives: [],
    zones: [],
    logs: [],
    replay: [],
    ...(participation ? { battleParticipation: participation } : {}),
  },
} as unknown as MatchRoomProjection);

const participationActions = (projection: MatchRoomProjection) =>
  (projectRemoteRoomFixture(projection)?.availableActions ?? []).filter((action) => action.actionId.startsWith('declare_battle_participation'));

it('shows the exact VP cost and preserves the server-authorized deployment payment', () => {
  const projection = buildProjection();
  projection.match!.view.legalActions = [{ type: 'deploy_player', locationId: 'miyama_town', terrainBid: 2, maxTerrainBid: 5 }];
  const action = projectRemoteRoomFixture(projection)!.availableActions[0]!;
  expect(action.label).toBe('部署至 深山町 · 2 战果');
  expect(action.backendCommand).toEqual(projection.match!.view.legalActions[0]);
});

it('does not expose a participation command from an old room projection', () => {
  const oldProjection = buildProjection({ locationId: 'miyama_town', sourceId: 'event.waxing_moon_ritual.resistance', declined: false, canDeclare: true });
  expect(participationActions(oldProjection)).toEqual([]);
});

it('preserves authoritative public terrain holes rather than assigning by player order',()=>{const p=buildProjection();p.match!.view.terrainSlots={miyama_town:{bonuses:[3,1],occupants:[null,'p1']}};const f=projectRemoteRoomFixture(p)!;const l=f.locations.find(l=>l.id==='miyama_town')!;expect(l.terrainOccupants).toEqual([null,'p1']);});
