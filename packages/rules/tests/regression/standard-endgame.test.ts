import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadAuthoringJson } from '../../src/index';
import { describe, expect, it } from 'vitest';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';
import { resolveStandardRoundEnd } from '../../src/core/elimination-resolver';
import { applyBattleScoring } from '../../src/core/scoring-resolver';

function ending(round = 8) {
  const session = createMatchSession({ seed: 20260904, humanPlayerIds: ['p1','p2','p3','p4','p5','p6','p7'] });
  session.state.round = { roundNumber: round, activePhase: 'round_end', prioritySeat: 1 };
  session.state.players.forEach((p, i) => { p.vp = 7-i; p.militaryResult = 0; });
  return session;
}

describe('seven-player standard terminal contract', () => {
  it('does not eliminate a standard Session player for military -8', () => {
    const s = ending(7); s.state.players[0]!.militaryResult = -9;
    s.runUntilHumanInputOrRoundEnd();
    expect(s.state.players[0]!.status).toBe('active');
  });
  it.each([[8,4],[9,3],[10,2]])('round %s keeps VP cutoff %s', (round, keep) => {
    const s = ending(round); s.runUntilHumanInputOrRoundEnd();
    expect(s.state.players.filter(p=>p.status==='active').map(p=>p.id)).toEqual(s.state.players.slice(0,keep).map(p=>p.id));
    const once = structuredClone(s.state.players); s.runUntilHumanInputOrRoundEnd(); expect(s.state.players).toEqual(once);
    const restored = restoreMatchSession(s.serializeSession()); restored.runUntilHumanInputOrRoundEnd(); expect(restored.state.players).toEqual(once);
  });
  it('keeps everyone tied at cutoff and ignores military/seat as tiebreak', () => {
    const s = ending(); s.state.players[4]!.vp=4; s.state.players[4]!.militaryResult=-99;
    s.runUntilHumanInputOrRoundEnd(); expect(s.state.players.filter(p=>p.status==='active')).toHaveLength(5);
  });
  it('declares only the unique highest active VP as winner', () => {
    const s = ending(11); s.state.players[0]!.status='eliminated';
    s.runUntilHumanInputOrRoundEnd();
    expect(s.projectToClientState('p2').outcome).toMatchObject({kind:'winner',winnerPlayerId:'p2',reason:'highest_vp'});
  });
  it('declares overflow when top VP ties and Miyama cannot uniquely break it', () => {
    const s = ending(11); s.state.players[1]!.vp=7;
    s.runUntilHumanInputOrRoundEnd(); expect(s.projectToClientState().outcome).toMatchObject({kind:'grail_overflow',reason:'unresolved_tie'});
  });
  it('does not fabricate a final result from runRound before round11', () => {
    const s = ending(8); s.runRound(); expect(s.projectToClientState().outcome).toBeUndefined();
    expect(s.logs.some(l=>l.type==='final_scoring')).toBe(false);
  });
});


describe('standard resolver boundaries and persistence', () => {
  it('keeps military accounting separate from standard elimination', () => {
    const s=ending(7); s.state.players[0]!.militaryResult=-7;
    s.state.battleResults=[{battlefieldId:'miyama_town',winnerPlayerId:'p2',winnerPlayerIds:['p2'],margin:2,vpReward:2,participantBreakdowns:[],militaryAdjustments:[{playerId:'p1',delta:-2}]}];
    const standard=applyBattleScoring(s.state,'standard');
    expect(standard.nextState.players[0]).toMatchObject({militaryResult:-9,status:'active'});
    expect(standard.nextState.players[1]!.vp).toBe(8);
    expect(applyBattleScoring(s.state,'legacy_military').nextState.players[0]!.status).toBe('eliminated');
  });
  it('uses only current round Miyama receipts and uniquely breaks a top-VP tie', () => {
    const s=ending(11); s.state.players[1]!.vp=7;
    s.logs.push({round:10,phase:'battle',type:'battle_resolved',message:'miyama_town',payload:{winnerPlayerIds:['p1']}});
    s.logs.push({round:11,phase:'battle',type:'battle_resolved',message:'miyama_town',payload:{winnerPlayerIds:['p2']}});
    s.runUntilHumanInputOrRoundEnd(); expect(s.projectToClientState().outcome).toMatchObject({winnerPlayerId:'p2',reason:'miyama_tiebreak'});
  });
  it('does not reuse a previous round winner or invent seat/military tiebreaks', () => {
    const s=ending(11); s.state.players[1]!.vp=7; s.state.players[0]!.militaryResult=999;
    s.logs.push({round:10,phase:'battle',type:'battle_resolved',message:'miyama_town',payload:{winnerPlayerIds:['p1']}});
    s.runUntilHumanInputOrRoundEnd(); expect(s.projectToClientState().outcome?.kind).toBe('grail_overflow');
  });
  it('waits for the pending end window before reading final VP', () => {
    const s=ending();
    s.state.abilityRuntime!.responseWindows.push({id:'end-window',kind:'response',opens:'round_end',controllerId:'p1',choices:[],event:{id:'end-event',type:'round_end'},passBehavior:'decline_this_window',order:'turn_order'});
    expect(s.runUntilHumanInputOrRoundEnd()).toBe('human_input');
    expect(s.state.players.every(p=>p.status==='active')).toBe(true);
    s.state.players[6]!.vp=100;
    const action=s.getPlayerView('p1').legalActions.find(a=>a.type==='decline_this_window')!;
    expect(s.dispatchPlayerAction('p1',action).ok).toBe(true); s.runUntilHumanInputOrRoundEnd();
    expect(s.state.players[6]!.status).toBe('active'); expect(s.state.players[3]!.status).toBe('eliminated');
  });
  it('preserves signed final result, rejects edits/deletion and refuses further commands atomically', () => {
    const s=ending(11); s.runUntilHumanInputOrRoundEnd(); const saved=s.serializeSession();
    const restored=restoreMatchSession(saved); expect(restored.runUntilHumanInputOrRoundEnd()).toBe('match_complete');
    expect(restored.projectToClientState().outcome).toEqual(s.projectToClientState().outcome);
    const before=restored.serializeSession(); expect(restored.dispatchPlayerCommand('p1',{type:'skip_normal_move'}).ok).toBe(false);
    expect(restored.serializeSession()).toEqual(before); expect(restored.getPlayerView('p1').legalActions).toEqual([]);
    const projection=restored.projectToClientState(); if(projection.outcome?.kind==='winner') projection.outcome.winnerPlayerId='p7';
    expect(restored.projectToClientState().outcome).toMatchObject({winnerPlayerId:'p1'});
    const edited=structuredClone(saved); edited.logs=edited.logs.filter(l=>l.type!=='standard_round_end_resolved');
    expect(()=>restoreMatchSession(edited)).toThrow();
  });
  it('fails closed on malformed rule input and keeps pre-eliminated players out', () => {
    const s=ending(11); const p=s.state.players;
    expect(()=>resolveStandardRoundEnd([...p,p[0]!],11)).toThrow();
    expect(()=>resolveStandardRoundEnd(p,12)).toThrow();
    expect(()=>resolveStandardRoundEnd(p,11,['unknown'])).toThrow();
    p[0]!.vp=-1; expect(()=>resolveStandardRoundEnd(p,11)).toThrow();
  });
  it('handles ties above survivor count, fewer survivors, and tied Miyama winners', () => {
    const s=ending(); s.state.players.forEach(p=>p.vp=5);
    expect(resolveStandardRoundEnd(s.state.players,8).eliminatedPlayerIds).toEqual([]);
    s.state.players.slice(2).forEach(p=>p.status='eliminated');
    expect(resolveStandardRoundEnd(s.state.players,8).eliminatedPlayerIds).toEqual([]);
    expect(resolveStandardRoundEnd(s.state.players,11,['p1','p2']).outcome?.kind).toBe('grail_overflow');
  });
});


it('uses an actual seventh battle pass and authoritative Miyama result to break a final tie', () => {
 const session=ending(11);session.state.round.activePhase='battle';session.state.eventPlacements=[];session.state.currentSituationModifiers=[];
 session.state.players[1]!.vp=8;session.state.players.forEach(p=>delete p.locationId);session.state.players[0]!.locationId='miyama_town';
 for(const p of session.state.players) expect(session.passPriority(p.id).ok).toBe(true);
 expect(session.logs.some(l=>l.round===11&&l.type==='battle_resolved'&&l.message==='miyama_town')).toBe(true);
 expect(session.projectToClientState().outcome).toMatchObject({kind:'winner',winnerPlayerId:'p1',reason:'miyama_tiebreak'});
 expect(restoreMatchSession(session.serializeSession()).projectToClientState().outcome).toEqual(session.projectToClientState().outcome);
});

it('applies real compiled Darnic round-end VP loss before choosing the round8 cutoff', () => {
 const session=ending(8);session.state.round.activePhase='battle';
 session.state.players.forEach(p=>delete p.locationId);
 const source='endgame-darnic';const definitionId='master.darnic.skill.s1a';
 const authored=loadAuthoringJson(JSON.parse(readFileSync('data/authoring/masters/master.darnic.json','utf8')));
 session.state.abilityRuntime!.pack.cards[definitionId]=authored.cards[definitionId]!;session.state.players[3]!.masterCardId='master.darnic';
 session.state.cards.push({instanceId:source,definitionId,ownerPlayerId:'p4',controllerPlayerId:'p4',zone:'skill',visibility:{scope:'public'}});
 session.state.players[3]!.mana=0;
 for(const p of session.state.players) expect(session.passPriority(p.id).ok).toBe(true);
 expect(session.state.players[3]!.vp).toBe(2);expect(session.state.players[3]!.status).toBe('eliminated');
 expect(session.state.players[4]!.status).toBe('active');
});



it('suspends the actual round-end trigger, signs/restores its pending window, then cuts off after resolving', () => {
 const session=ending(8);session.state.round.activePhase='battle';session.state.players.forEach(p=>delete p.locationId);
 const authored=loadAuthoringJson(JSON.parse(readFileSync('data/authoring/masters/master.darnic.json','utf8')));
 const def=structuredClone(authored.cards['master.darnic.skill.s1a']!);
 // Explicit trusted-authoring test variant: exercise pausable round-end scheduling, not a production Darnic migration claim.
 def.abilities=def.abilities.filter(a=>a.activation.trigger==='round_end');def.abilities[0]!.kind='optional_trigger';
 session.state.abilityRuntime!.pack.cards[def.id]=def;
 session.state.cards.push({instanceId:'optional-end-source',definitionId:def.id,ownerPlayerId:'p4',controllerPlayerId:'p4',zone:'skill',visibility:{scope:'public'}});
 session.state.players[3]!.masterCardId='master.darnic';session.state.players[3]!.mana=0;
 for(const p of session.state.players)expect(session.passPriority(p.id).ok).toBe(true);
 expect(session.state.round.activePhase).toBe('round_end');expect(session.state.abilityRuntime!.responseWindows).toHaveLength(1);
 expect(session.state.players.every(p=>p.status==='active')).toBe(true);
 const restored=restoreMatchSession(session.serializeSession(),{restorePackKind:'trusted_authoring_fixture'});
 const next=restored.getPlayerView('p4').legalActions.find(a=>a.type==='resolve_response')!;expect(next).toBeDefined();
 expect(restored.dispatchPlayerAction('p4',next).ok).toBe(true);restored.runUntilHumanInputOrRoundEnd();
 expect(restored.state.players[3]!.vp).toBe(2);expect(restored.state.players[3]!.status).toBe('eliminated');
 expect(restored.state.players[4]!.status).toBe('active');
 expect(restored.logs.filter(l=>l.type==='standard_round_end_resolved'&&l.round===8)).toHaveLength(1);
});

it('returns the same terminal outcome on repeated resume without triggering the loop guard', () => {
 const session=ending(11);session.runUntilHumanInputOrRoundEnd();
 const before=session.serializeSession();
 for(let i=0;i<8;i++)expect(session.runUntilHumanInputOrRoundEnd()).toBe('match_complete');
 expect(session.serializeSession()).toEqual(before);
});


it('keeps checkpoint SHA and HMAC bytes compatible with ordinary JSON serialization', () => {
 const secret='0123456789abcdef0123456789abcdef',scope='standard-endgame-checkpoint-parity';
 const s=createMatchSession({seed:20260904,persistenceSecret:secret,persistenceScope:scope});
 s.logs.push({round:1,phase:'preparation',type:'fixture_unicode',message:'中文😀\ud800',payload:{text:'quote"slash\\newline\n',absent:undefined}});
 for(const optional of [false,true]) {
  if(optional){ s.stopReason='human_input';s.rejection={code:'fixture',message:'测试\n😀'}; }
  (s as any).checkpoint('parity');
  const snap=s.replaySnapshots[s.replaySnapshots.length-1]!;
  const payload={checkpointId:snap.checkpointId,state:snap.state,logs:snap.logs,battleHistory:snap.battleHistory,consumedDirectiveCount:snap.consumedDirectiveCount,stopReason:snap.stopReason??null,rejection:snap.rejection??null};
  const digest=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  expect(snap.deferredRuntimeStateSeal!.authorityDigest).toBe(digest);
  expect(snap.deferredRuntimeStateSeal!.mac).toBe(createHmac('sha256',secret).update(`fd-deferred-runtime-state-v2\n${scope}\n${snap.checkpointId}\n${digest}`).digest('hex'));
  const frozenBytes=JSON.stringify(snap);
  s.state.players[0]!.mana=1;s.logs.push({round:1,phase:'preparation',type:'live_only',message:'must not alter checkpoint'});s.battleHistory=[];
  expect(JSON.stringify(snap)).toBe(frozenBytes);
  expect(s.restoreToCheckpoint(snap.checkpointId)).toBe(true);
 }
});


it('takes isolated checkpoints in the existing persisted-JSON data representation', () => {
 const s=createMatchSession({seed:20260904});
 s.logs.push({round:1,phase:'preparation',type:'json-boundary',message:'wire normalization',payload:{missing:undefined,array:[undefined,'中文😀'],date:new Date('2026-01-01T00:00:00Z')}});
 const expected=JSON.parse(JSON.stringify({state:s.state,logs:s.logs,battleHistory:s.battleHistory}));
 (s as any).checkpoint('json-parity'); const snap=s.replaySnapshots[s.replaySnapshots.length-1]!;
 expect({state:snap.state,logs:snap.logs,battleHistory:snap.battleHistory}).toEqual(expected);
 expect(s.logs[s.logs.length-1]!.payload!.date).toBeInstanceOf(Date);
 expect(s.restoreToCheckpoint(snap.checkpointId)).toBe(true);
});
