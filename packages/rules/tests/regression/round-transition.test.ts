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
  it('keeps bounded round simulation at round_end and does not rotate the final outcome', () => {
    const s=ending(); expect(s.runRound()).toBe('round_end'); expect(s.state.round.roundNumber).toBe(1);
    const final=ending(11,4); final.state.players.forEach((p,i)=>p.vp=i);
    expect(final.runUntilHumanInputOrStop()).toBe('match_complete');
    expect(final.state.round.roundNumber).toBe(11);
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
