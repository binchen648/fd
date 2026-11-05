import {expect,it,describe}from'vitest';
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

import type { MatchRoomProjection } from "@fd/rules/match-room";


/**
 * D5 · 抵御：远程房间投影里的"参战声明"必须变成一个可点击的动作。
 * 这个测试钉住三件事：没牌没有按钮、按钮是开关、开关发出去的命令与标签一致。
 */
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

describe('remote room fixture · battle participation toggle (D5)', () => {
  it('adds no action when the viewer has no participation event', () => {
    expect(participationActions(buildProjection())).toEqual([]);
    expect(participationActions(buildProjection({ locationId: 'miyama_town', sourceId: 'event.x', declined: false, canDeclare: false }))).toEqual([]);
  });

  it('offers "decline" while the viewer is still participating', () => {
    const actions = participationActions(buildProjection({ locationId: 'miyama_town', sourceId: 'event.x', declined: false, canDeclare: true }));
    expect(actions).toHaveLength(1);
    expect(actions[0]!.label).toBe('不参与本次战斗结算');
    expect(actions[0]!.backendCommand).toEqual({ type: 'declare_battle_participation', participate: false });
  });

  it('offers "participate" once the viewer has declined', () => {
    const actions = participationActions(buildProjection({ locationId: 'miyama_town', sourceId: 'event.x', declined: true, canDeclare: true }));
    expect(actions).toHaveLength(1);
    expect(actions[0]!.label).toBe('参与本次战斗结算');
    expect(actions[0]!.backendCommand).toEqual({ type: 'declare_battle_participation', participate: true });
  });

  it('keeps the toggle independent from the ability action list', () => {
    const projection = buildProjection({ locationId: 'miyama_town', sourceId: 'event.x', declined: false, canDeclare: true });
    const fixture = projectRemoteRoomFixture(projection)!;
    expect(fixture.availableActions.some((action) => action.kind === 'respond')).toBe(true);
    expect(fixture.availableActions.every((action) => action.ownerPlayerId === 'p1')).toBe(true);
  });
});
