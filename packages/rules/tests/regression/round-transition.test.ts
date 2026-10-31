import { describe, expect, it } from 'vitest';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import { createMatchRoom } from '../../src/match-room';

const humans = Array.from({length: 7}, (_, i) => `p${i + 1}`);
function ending(round = 1, startingSeat = 1) {
  const session = createMatchSession({seed: 20260904, humanPlayerIds: humans});
  Object.assign(session.state.round, {roundNumber: round, activePhase: 'round_end', prioritySeat: 7, startingSeat});
  session.state.abilityRuntime!.hostRequests = [];
  session.state.abilityRuntime!.responseWindows = [];
  delete session.state.abilityRuntime!.pendingDecision;
  return session;
}

describe('A-ROUND-02 standard product round transitions', () => {
  it('rotates once into the next round without moving physical seats', () => {
    const s = ending();
    expect(s.runUntilHumanInputOrStop()).toBe('human_input');
    expect(s.state.round).toMatchObject({roundNumber: 2, activePhase: 'preparation', prioritySeat: 2, startingSeat: 2});
    expect(s.state.players.map(p => p.seat)).toEqual([1,2,3,4,5,6,7]);
    expect(s.runUntilHumanInputOrStop()).toBe('human_input');
    expect(s.state.round.roundNumber).toBe(2);
  });
  it('wraps after seven, skipping eliminated players including the old starter', () => {
    const s = ending(3, 7);
    s.state.players[6]!.status = 'eliminated';
    s.state.players[0]!.status = 'eliminated';
    s.runUntilHumanInputOrStop();
    expect(s.state.round.prioritySeat).toBe(2);
  });
  it('uses rotated order for every phase and visits lower seats before ending', () => {
    const s = ending(); s.runUntilHumanInputOrStop();
    for (const id of ['p2','p3','p4','p5','p6','p7','p1']) {
      expect(s.projectToClientState().priorityPlayerId).toBe(id);
      expect(s.passPriority(id).ok).toBe(true);
    }
    expect(s.state.round).toMatchObject({activePhase: 'advance', prioritySeat: 2});
    for (const id of ['p2','p3','p4','p5','p6','p7','p1']) {
      expect(s.projectToClientState().priorityPlayerId).toBe(id);
      const deployment = s.getPlayerView(id).legalActions.find(a => a.type === 'deploy_player');
      expect(deployment).toBeDefined();
      expect(s.dispatchPlayerAction(id, deployment!)).toMatchObject({ok:true});
    }
    expect(s.state.round).toMatchObject({activePhase: 'action', prioritySeat: 2});
  });
  it('passes the old round to Runtime so cross-round counters actually reset', () => {
    const s = ending(); const r = s.state.abilityRuntime!;
    r.movementDistanceThisRound = {p1: 9};
    r.battlefieldsPassedOrStayedThisRound = {p1: 3};
    r.roundTotalPowerAdjustments = {round: 1, byPlayer: {p1: 12}};
    s.runUntilHumanInputOrStop();
    expect(s.state.abilityRuntime!.movementDistanceThisRound).toEqual({});
    expect(s.state.abilityRuntime!.battlefieldsPassedOrStayedThisRound).toEqual({});
    expect(s.state.abilityRuntime!.roundTotalPowerAdjustments).toEqual({round: 2, byPlayer: {}});
  });
  it('waits on end windows and preserves order when signed/restored', () => {
    const s = ending();
    s.state.abilityRuntime!.responseWindows.push({id:'end',kind:'response',opens:'round_end',controllerId:'p1',choices:[],event:{id:'end-event',type:'round_end'},passBehavior:'decline_this_window',order:'turn_order'});
    expect(s.runUntilHumanInputOrStop()).toBe('human_input'); expect(s.state.round.roundNumber).toBe(1);
    const action=s.getPlayerView('p1').legalActions.find(a=>a.type==='decline_this_window')!;
    expect(s.dispatchPlayerAction('p1',action).ok).toBe(true);
    s.runUntilHumanInputOrStop();
    const restored=restoreMatchSession(s.serializeSession());
    expect(restored.runUntilHumanInputOrStop()).toBe('human_input');
    expect(restored.state.round).toMatchObject({roundNumber:2,prioritySeat:2,startingSeat:2});
    expect(restored.logs.filter(l=>l.type==='round_start'&&l.round===2)).toHaveLength(1);
  });
  it('removes masters during cleanup rather than waiting for next round start', () => {
    const s=ending(); s.state.round.activePhase='battle';
    for(const p of s.state.players) p.locationId='magic_workshop';
    expect(s.passPriority('p7').ok).toBe(true);
    expect(s.state.round.activePhase).toBe('round_end');
    expect(s.state.players.every(p=>p.locationId===undefined)).toBe(true);
  });
  it('resolves round8 cutoff before rotating and never grants an eliminated seat a turn', () => {
    const s=ending(8,7); s.state.players.forEach((p,i)=>p.vp=7-i);
    s.runUntilHumanInputOrStop();
    expect(s.state.players.filter(p=>p.status==='active').map(p=>p.id)).toEqual(['p1','p2','p3','p4']);
    expect(s.state.round).toMatchObject({roundNumber:9,prioritySeat:1,startingSeat:1});
    for(const id of ['p1','p2','p3','p4']) expect(s.passPriority(id).ok).toBe(true);
    expect(s.state.round).toMatchObject({activePhase:'advance',prioritySeat:1});
    const before=s.serializeSession();
    expect(s.passPriority('p7').ok).toBe(false); expect(s.serializeSession()).toEqual(before);
  });
  it('can restore a suspended cleanup window without repeating cleanup or end resolution', () => {
    const s=ending();s.state.round.activePhase='cleanup';
    s.state.abilityRuntime!.responseWindows.push({id:'cleanup',kind:'response',opens:'cleanup',controllerId:'p1',choices:[],event:{id:'cleanup-event',type:'phase_changed'},passBehavior:'decline_this_window',order:'turn_order'});
    s.state.players.forEach(p=>p.locationId='magic_workshop');
    expect(s.runUntilHumanInputOrStop()).toBe('human_input');
    const restored=restoreMatchSession(s.serializeSession());
    const action=restored.getPlayerView('p1').legalActions.find(a=>a.type==='decline_this_window')!;
    expect(restored.dispatchPlayerAction('p1',action).ok).toBe(true);
    expect(restored.runUntilHumanInputOrStop()).toBe('human_input');
    expect(restored.state.round).toMatchObject({roundNumber:2,prioritySeat:2});
    expect(restored.logs.filter(l=>l.type==='round_cards_discarded'&&l.round===1)).toHaveLength(1);
    expect(restored.logs.filter(l=>l.type==='standard_round_end_resolved'&&l.round===1)).toHaveLength(1);
  });
  it('awards workshop slots by deployment occupancy after rotation, not physical seat', () => {
    const s=ending();s.runUntilHumanInputOrStop();
    for(const id of ['p2','p3','p4','p5','p6','p7','p1'])s.passPriority(id);
    const mode=(s.state as any).modeState;mode.closedLocations=[];mode.deploymentLimitOnly={};
    s.state.players.forEach(p=>p.mana=0);
    const gains:number[]=[];
    for(const id of ['p2','p3','p4','p5','p6','p7','p1']) {
      const workshop=!['p5','p6','p7'].includes(id);const player=s.state.players.find(p=>p.id===id)!;const before=player.mana;
      expect(s.dispatchPlayerCommand(id,{type:'deploy_player',locationId:workshop?'magic_workshop':'miyama_town'}).ok).toBe(true);
      if(workshop)gains.push(s.state.players.find(p=>p.id===id)!.mana-before);
    }
    expect(gains).toEqual([2,1,1,1]);
  });
  it('suspends a new-round phase window before preparation setup and resumes it once', () => {
    const s=ending();const runtime=s.state.abilityRuntime!;
    const definition=structuredClone(Object.values(runtime.pack.cards).find(c=>c.abilities.length>0)!);
    definition.id='test.round-transition.phase-changed';
    definition.abilities=[{id:'start-window',kind:'optional_trigger',printedClause:'test',activation:{trigger:'phase_changed'},conditions:[],targets:[],effects:[],cost:[],creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{opens:'phase_changed'},limit:{},visibility:{},execution:{mode:'automatic'}} as any];
    runtime.pack.cards[definition.id]=definition;
    s.state.cards.push({instanceId:'start-window-source',definitionId:definition.id,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'public'}});
    expect(s.runUntilHumanInputOrStop()).toBe('human_input');
    expect(s.state.round).toMatchObject({roundNumber:2,activePhase:'round_start',startingSeat:2,prioritySeat:2});
    expect(s.logs.filter(l=>l.type==='situation_applied'&&l.round===2)).toHaveLength(0);
    // Low-level synthetic phase_changed source is a scheduling fault injection,
    // not a newly accepted production/restore authoring contract.
    const decline=s.getPlayerView('p1').legalActions.find(a=>a.type==='decline_this_window')!;
    expect(s.dispatchPlayerAction('p1',decline).ok).toBe(true);
    expect(s.runUntilHumanInputOrStop()).toBe('human_input');
    expect(s.state.round).toMatchObject({roundNumber:2,activePhase:'preparation',prioritySeat:2});
    expect(s.logs.filter(l=>l.type==='situation_applied'&&l.round===2)).toHaveLength(1);
    expect(s.logs.filter(l=>l.type==='round_start'&&l.round===2)).toHaveLength(1);
  });
  it('signs and restores a pending round_start with preparation setup still deferred', () => {
    const s=ending();Object.assign(s.state.round,{roundNumber:2,activePhase:'round_start',prioritySeat:2,startingSeat:2});
    s.state.abilityRuntime!.responseWindows.push({id:'start',kind:'response',opens:'round_start',controllerId:'p1',choices:[],event:{id:'start-event',type:'phase_changed'},passBehavior:'decline_this_window',order:'turn_order'});
    const restored=restoreMatchSession(s.serializeSession());
    expect(restored.runUntilHumanInputOrStop()).toBe('human_input');
    expect(restored.state.round.activePhase).toBe('round_start');
    const action=restored.getPlayerView('p1').legalActions.find(a=>a.type==='decline_this_window')!;
    expect(restored.dispatchPlayerAction('p1',action).ok).toBe(true);
    expect(restored.runUntilHumanInputOrStop()).toBe('human_input');
    expect(restored.state.round).toMatchObject({roundNumber:2,activePhase:'preparation',prioritySeat:2});
    expect(restored.logs.filter(l=>l.type==='round_start'&&l.round===2)).toHaveLength(1);
  });
  it('keeps bounded round simulation at round_end and does not rotate the final outcome', () => {
    const s=ending(); expect(s.runRound()).toBe('round_end'); expect(s.state.round.roundNumber).toBe(1);
    const final=ending(11,4); final.state.players.forEach((p,i)=>p.vp=i);
    expect(final.runUntilHumanInputOrStop()).toBe('match_complete');
    expect(final.state.round.roundNumber).toBe(11);
  });
  it('host replay restore of the automatic round-end checkpoint resumes the room', () => {
    const room=createMatchRoom({hostClientId:'host',seed:20260904});
    for(let seat=1;seat<=7;seat++){const id=seat===1?'host':`seat-${seat}`;if(seat!==1)room.joinRoom({clientId:id,displayName:id,role:'player'});room.selectSeat(id,seat);}
    room.startMatch('host');const s=room.session!;
    Object.assign(s.state.round,{roundNumber:1,activePhase:'battle',prioritySeat:7,startingSeat:1});
    s.state.players.forEach(p=>delete p.locationId);s.state.abilityRuntime!.hostRequests=[];s.state.abilityRuntime!.responseWindows=[];delete s.state.abilityRuntime!.pendingDecision;
    expect(room.endClientTurn('seat-7').ok).toBe(true);
    const end=s.replay.find(e=>e.label==='round 1 end')!;
    expect(room.restoreToReplayCheckpoint('host',end.id)).toBe(true);
    expect(room.getProjection('host').match).toMatchObject({round:2,phase:'preparation',priorityPlayerId:'p2'});
  });
  it('room existing end-turn command crosses the boundary to the next human seat', () => {
    const room=createMatchRoom({hostClientId:'host',seed:20260904});
    room.selectSeat('host',7); room.startMatch('host');
    const s=room.session!; s.humanPlayerIds.splice(0,s.humanPlayerIds.length,...humans);
    Object.assign(s.state.round,{roundNumber:1,activePhase:'battle',prioritySeat:7,startingSeat:1});
    s.state.abilityRuntime!.responseWindows=[];s.state.abilityRuntime!.hostRequests=[];delete s.state.abilityRuntime!.pendingDecision;
    s.state.players.forEach(p=>delete p.locationId);
    expect(room.endClientTurn('host').ok).toBe(true);
    expect(room.getProjection('host').match).toMatchObject({round:2,phase:'preparation',priorityPlayerId:'p2'});
  });
});
