import { describe, expect, it } from 'vitest';
import { advanceAbilityPhase, calculateCardPower, processAbilityEvent } from '../../src/ability/interpreter';
import { resolveBattlefield, projectCurrentPlayerPowers } from '../../src/core/combat-resolver';
import { currentDeploymentBonus } from '../../src/core/terrain-advantage';
import { readFileSync } from 'node:fs';
import { loadAuthoringJson } from '../../src/ability/loader';
import { restoreMatchSession } from '../../src/match-session';
import { fixture, player, playPair, dispatch, rejectAtomically, activate, active, choose } from './seven-roster-test-helpers';

describe('B field closeout: actual Session authoring consumers', () => {
  it.each(['servant.artoria-alt','servant.kintoki'])('keeps %s source-card-only exceptions separate from controller-wide exceptions', owner => {
    const archive=JSON.parse(readFileSync(`data/authoring/servants/${owner}.json`,'utf8'));
    const loaded=loadAuthoringJson(archive);
    expect(loaded.report).toEqual([]);
    expect(Object.values(loaded.cards).flatMap(c=>c.abilities).every(a=>a.execution.mode==='automatic')).toBe(true);
  });
  it.each(['selector','lifecycle'])('raw authoring cannot widen the controller mana exception through %s', variant => {
    const archive=JSON.parse(readFileSync('data/authoring/masters/master.kayneth.json','utf8'));
    const a=archive.cards.find((c:any)=>c.id==='master.kayneth.skill.double-master').abilities[0];
    if(variant==='selector')a.ruleModifiers[0].scope.onlyDefinitionId='different.skill';
    else a.lifecycle={expiresAtRound:0};
    expect(loadAuthoringJson(archive).report.some(r=>r.reason.includes('controller skill mana exception'))).toBe(true);
  });
  it.each(['basic.luck', 'card.luck', 'mixed'])('Caster counts %s once per owned discard instance and recomputes after restore', kind => {
    const { session, playerId, sourceId } = fixture('servant.artoriac.skill.sc-artoriac-3');
    const other = session.state.players.find(p => p.id !== playerId)!.id;
    session.state.cards.push({ instanceId: 'other-luck', definitionId: 'basic.luck', ownerPlayerId: other,
      controllerPlayerId: other, zone: 'discard', visibility: { scope: 'public' } });
    playPair(session, playerId, sourceId);
    expect(calculateCardPower(session.state, sourceId).value).toBe(0);
    for (let i = 0; i < 4; i++) {
      session.state.cards.push({ instanceId: `counted-luck-${i}`, definitionId: kind === 'mixed' ? (i % 2 ? 'card.luck' : 'basic.luck') : kind,
        ownerPlayerId: playerId, controllerPlayerId: playerId, zone: 'discard', visibility: { scope: 'public' } });
      expect(calculateCardPower(session.state, sourceId).value).toBe(Math.min((i + 1) * 5, 15));
    }
    const restored = restoreMatchSession(session.serializeSession());
    expect(calculateCardPower(restored.state, sourceId).value).toBe(15);
    for (const c of restored.state.cards.filter(c => c.instanceId.startsWith('counted-luck-'))) c.zone = 'hand';
    expect(calculateCardPower(restored.state, sourceId).value).toBe(0);
  });

  it.each([1, 2, 3, 4, 5, 6, 7])('Tomoe stage projection and direct admission use rotated first half, starting seat %i', startingSeat => {
    const { session, playerId, sourceId } = fixture('servant.tomoe.skill.sc-tomoe-1');
    session.state.round.startingSeat = startingSeat;
    const order = [...session.state.players].sort((a,b) => Number(a.seat < startingSeat) - Number(b.seat < startingSeat) || a.seat-b.seat);
    const allowed = order.findIndex(p => p.id === playerId) < 3;
    const offered = session.getPlayerView(playerId).legalActions.some(a => a.type === 'stage_attack_card' && a.cardInstanceId === sourceId && !a.faceDown);
    expect(offered).toBe(allowed);
    if (allowed) dispatch(session, playerId, { type: 'stage_attack_card', cardInstanceId: sourceId });
    else rejectAtomically(session, playerId, { type: 'stage_attack_card', cardInstanceId: sourceId });
  });

  it('Tomoe confirm rechecks changed order after staging and restored state', () => {
    const { session, playerId, sourceId } = fixture('servant.tomoe.skill.sc-tomoe-1');
    const seat = player(session, playerId).seat;
    session.state.round.startingSeat = seat;
    dispatch(session, playerId, { type: 'stage_attack_card', cardInstanceId: sourceId });
    const supplement = session.getPlayerView(playerId).legalActions.find(a => a.type === 'stage_attack_card' && a.faceDown)!;
    expect(supplement).toBeDefined();
    dispatch(session, playerId, supplement);
    const restored = restoreMatchSession(session.serializeSession());
    restored.state.round.startingSeat = seat % 7 + 1;
    rejectAtomically(restored, playerId, { type: 'confirm_staged_attack' });
  });
});

describe('Anchored placement actual consumers', () => {
  it('ordinary off-battlefield play creates no deployment reward from a missing anchor or event location', () => {
    const f=fixture('servant.ereshkigal.skill.sc-ereshkigal-2');
    player(f.session,f.playerId).locationId='recon';player(f.session,f.playerId).mana=8;
    playPair(f.session,f.playerId,f.sourceId);
    const before=player(f.session,f.playerId).mana;
    const other=f.session.state.players.find(p=>p.id!==f.playerId)!.id;
    processAbilityEvent(f.session.state,{id:'no-anchor-no-location',type:'after_player_deployed_to_battlefield',playerId:other});
    expect(player(f.session,f.playerId).mana).toBe(before);
    processAbilityEvent(f.session.state,{id:'no-anchor-real-location',type:'after_player_deployed_to_battlefield',playerId:other,locationId:'shinto'});
    expect(player(f.session,f.playerId).mana).toBe(before);
  });
  it.each(['false','string','selector'])('raw authoring rejects malformed source-bound aggregate %s', variant => {
    const archive=JSON.parse(readFileSync('data/authoring/servants/servant.ereshkigal.json','utf8'));
    const m=archive.cards[2].abilities[1].effects[0].branches[1].then[0].modifier;
    if(variant==='false')m.sourceMustRemainActive=false;
    if(variant==='string')m.sourceMustRemainActive='true';
    if(variant==='selector')m.scope.onlyDefinitionId='irrelevant';
    expect(loadAuthoringJson(archive).report.some(r=>r.reason.includes('source-bound aggregate'))).toBe(true);
  });
  it('Bloom aggregate bonus ends when the granting source closes without changing per-card power', () => {
    const f=fixture('servant.ereshkigal.skill.sc-ereshkigal-3');
    const protection=f.session.state.cards.find(c=>c.definitionId==='servant.ereshkigal.skill.sc-ereshkigal-2')!;
    playPair(f.session,f.playerId,protection.instanceId);active(f.session,f.sourceId);
    const baselineClosed=structuredClone(f.session.state);baselineClosed.abilityRuntime!.cardState[f.sourceId]!.active=false;
    const expectedAfterClose=projectCurrentPlayerPowers(baselineClosed,[f.playerId])[f.playerId]!;
    const before=projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!;
    const cardPower=calculateCardPower(f.session.state,f.sourceId).value;
    activate(f.session,f.playerId,f.sourceId,'sc-ereshkigal-3.blooming-netherworld');
    expect(projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!-before).toBe(6);
    expect(calculateCardPower(f.session.state,f.sourceId).value).toBe(cardPower);
    f.session.state.abilityRuntime!.cardState[f.sourceId]!.active=false;
    expect(projectCurrentPlayerPowers(f.session.state,[f.playerId])[f.playerId]!).toBe(expectedAfterClose);
  });
  it('placement reverses actual field modifiers through restore and movement, rewards only later deployment, and cleans up', () => {
    const f = fixture('servant.ereshkigal.skill.sc-ereshkigal-3');
    active(f.session, f.sourceId);
    player(f.session,f.playerId).mana = 8;
    const beforeEvents = f.session.state.abilityRuntime!.events.length;
    activate(f.session,f.playerId,f.sourceId,'sc-ereshkigal-3.blooming-netherworld');
    expect(player(f.session,f.playerId).mana).toBe(8);
    expect(f.session.state.abilityRuntime!.events.slice(beforeEvents).some(e => e.type === 'card_played')).toBe(false);
    const source = f.session.state.cards.find(c => c.definitionId === 'servant.ereshkigal.skill.sc-ereshkigal-2')!;
    const other = f.session.state.players.find(p => p.id !== f.playerId)!.id;
    expect(f.session.getPlayerView(other).cards.find(c => c.instanceId === source.instanceId)).toMatchObject({zone:'field',definitionId:source.definitionId,boardLocationId:'miyama_town'});
    const restored = restoreMatchSession(f.session.serializeSession());
    player(restored,f.playerId).locationId = 'shinto';
    player(restored,other).locationId = 'miyama_town';
    restored.state.currentSituationModifiers = [{sourceId:'actual-field-test',targetTag:'特殊',value:2}];
    const power = () => resolveBattlefield(restored.state,{battlefieldId:'miyama_town',participants:[{playerId:other,totalPower:4,attackTags:['特殊']}]}).nextState.battleResults.at(-1)!.participantBreakdowns[0]!.modifiers.filter(m => m.source === 'situation').reduce((sum,m) => sum+m.value,0);
    expect(power()).toBe(-2);
    processAbilityEvent(restored.state,{id:'placement-deploy',type:'after_player_deployed_to_battlefield',playerId:other,locationId:'miyama_town'});
    expect(player(restored,f.playerId).mana).toBe(9);
    processAbilityEvent(restored.state,{id:'placement-deploy',type:'after_player_deployed_to_battlefield',playerId:other,locationId:'miyama_town'});
    expect(player(restored,f.playerId).mana).toBe(9);
    const ended = restoreMatchSession(restored.serializeSession());
    ended.state.round.activePhase = 'battle';
    processAbilityEvent(ended.state,{id:'placement-end',type:'after_battle_ended',battlePhaseResolutionId:'bounded-placement-terminal',battleOutcomes:[],battleParticipantIds:ended.state.players.map(p=>p.id)});
    expect(ended.state.cards.find(c => c.instanceId === source.instanceId)!.zone).toBe('skill');
    expect(ended.state.abilityRuntime!.cardState[source.instanceId]!.boardLocationId).toBeUndefined();
    restored.state.abilityRuntime!.cardState[source.instanceId]!.active = false;
    expect(power()).toBe(2);
  });
  it('does not offer impossible workshop placement', () => {
    const f=fixture('servant.ereshkigal.skill.sc-ereshkigal-3');active(f.session,f.sourceId);
    player(f.session,f.playerId).locationId='magic_workshop';
    expect(f.session.getPlayerView(f.playerId).legalActions.some(a=>a.type==='activate_ability'&&a.cardInstanceId===f.sourceId)).toBe(false);
    rejectAtomically(f.session,f.playerId,{type:'activate_ability',cardInstanceId:f.sourceId,abilityId:'sc-ereshkigal-3.blooming-netherworld'});
  });
  it.each(['hand','discard','removed_from_game'])('absent field source in %s is refused by projection and dispatch', zone => {
    const f=fixture('servant.ereshkigal.skill.sc-ereshkigal-3');active(f.session,f.sourceId);
    f.session.state.cards.find(c=>c.definitionId==='servant.ereshkigal.skill.sc-ereshkigal-2')!.zone=zone;
    expect(f.session.getPlayerView(f.playerId).legalActions.some(a=>a.type==='activate_ability'&&a.cardInstanceId===f.sourceId)).toBe(false);
    rejectAtomically(f.session,f.playerId,{type:'activate_ability',cardInstanceId:f.sourceId,abilityId:'sc-ereshkigal-3.blooming-netherworld'});
  });
});

describe('Actual mana loss result feeds source power in one typed resolution', () => {
  it.each(['unknown','future','wrong-field','wrong-type'])('rejects %s result binding at raw authoring admission', variant => {
    const archive=JSON.parse(readFileSync('data/authoring/masters/master.kiritsugu.json','utf8'));
    const effects=archive.cards[3].abilities[0].effects;
    const ref=effects[1].modifier.amount.args[0];
    if(variant==='unknown')ref.binding='missing';
    if(variant==='future')effects.reverse();
    if(variant==='wrong-field')ref.field='requestedAmount';
    if(variant==='wrong-type')ref.valueType='player_ids';
    expect(loadAuthoringJson(archive).report.some(r=>r.reason.includes('actual-loss power'))).toBe(true);
  });
  it.each([[0,false],[1,false],[9,false],[12,false],[9,true]] as const)('mana=%i protected=%s, pending restore and repeated choice', (mana,protectedTarget) => {
    const f=fixture('master.gatou.skill.seeker');
    if(protectedTarget){const seal=f.session.state.cards.find(c=>c.controllerPlayerId===f.playerId&&c.definitionId==='master.gatou.command-spell')!;activate(f.session,f.playerId,seal.instanceId,'command-spell.gain-mana');}
    f.session.state.round.activePhase='battle';
    const attacker=f.session.state.players.find(p=>p.masterCardId==='master.kiritsugu')!;
    attacker.locationId=player(f.session,f.playerId).locationId='miyama_town';
    f.session.state.round.prioritySeat=attacker.seat;player(f.session,f.playerId).mana=mana;
    const id='typed-origin-bullet';
    f.session.state.cards.push({instanceId:id,definitionId:'master.kiritsugu.deck.origin-bullet',ownerPlayerId:attacker.id,controllerPlayerId:attacker.id,zone:'attack_area',visibility:{scope:'public'}});
    active(f.session,id);activate(f.session,attacker.id,id,'origin-bullet.cut-bind');
    expect(f.session.getPlayerView(attacker.id).pendingDecision!.candidates).toContain(f.playerId);
    const restored=restoreMatchSession(f.session.serializeSession());
    const oldDecision=restored.getPlayerView(attacker.id).pendingDecision!.id;
    choose(restored,attacker.id,[f.playerId]);
    const loss=protectedTarget?0:Math.ceil(mana/3);
    expect(player(restored,f.playerId).mana).toBe(mana-loss);
    expect(calculateCardPower(restored.state,id).value).toBe(2+loss*2);
    rejectAtomically(restored,attacker.id,{type:'choose_target',decisionId:oldDecision,selectedIds:[f.playerId]});
  });
});

function borrowedSupport(vp: number) {
  const f = fixture('master.maiya.skill.military');
  player(f.session, f.playerId).locationId = 'recon';
  f.session.state.round.activePhase = 'advance';
  const borrower = f.session.state.players.find(p => p.id !== f.playerId)!.id;
  activate(f.session, f.playerId, f.sourceId, 'military.attach-support-shot');
  choose(f.session, f.playerId, [borrower]);
  const source = f.session.state.cards.find(c => c.definitionId === 'master.maiya.deck.support-shot')!;
  f.session.state.round.activePhase = 'action';
  f.session.state.round.prioritySeat = player(f.session, borrower).seat;
  player(f.session, borrower).locationId = 'miyama_town';
  player(f.session, borrower).vp = vp;
  dispatch(f.session, borrower, { type: 'skip_normal_move' });
  return { ...f, borrower, support: source.instanceId };
}

describe('Exact VP cost and base terrain, actual Session', () => {
  it.each(['bogus', 'base-with-selector', 'base-power'])('compiler rejects an unaccepted terrain layer: %s', variant => {
    const archive = JSON.parse(readFileSync('data/authoring/masters/master.maiya.json', 'utf8'));
    const modifier = archive.cards[1].abilities[1].effects[0].modifier;
    if (variant === 'bogus') modifier.layer = 'bogus';
    if (variant === 'base-with-selector') modifier.scope.onlyDefinitionId = 'irrelevant';
    if (variant === 'base-power') modifier.type = 'power_bonus';
    expect(loadAuthoringJson(archive).report.some(r => r.reason.includes('terrain layer'))).toBe(true);
  });
  it.each([0, 1])('balance %i is omitted from projection and atomically refused', vp => {
    const f = borrowedSupport(vp);
    expect(f.session.getPlayerView(f.borrower).legalActions.some(a => a.type === 'activate_ability' && a.cardInstanceId === f.support && a.abilityId === 'support-shot.suppress')).toBe(false);
    rejectAtomically(f.session, f.borrower, { type: 'activate_ability', cardInstanceId: f.support, abilityId: 'support-shot.suppress' });
  });
  it.each([0, 3])('pays exactly once and computes (base %i +1)*2 through restore and expiry', base => {
    const f = borrowedSupport(2);
    const ownerVP = player(f.session, f.playerId).vp;
    f.session.state.map.locations.find(l => l.id === 'miyama_town')!.terrainBonuses = [base];
    (f.session.state as any).modeState.terrainAssignments = { miyama_town: [f.borrower] };
    activate(f.session, f.borrower, f.support, 'support-shot.suppress');
    expect(player(f.session, f.borrower).vp).toBe(0);
    expect(player(f.session, f.playerId).vp).toBe(ownerVP + 2);
    expect(currentDeploymentBonus(f.session.state, f.borrower)).toBe((base + 1) * 2);
    const restored = restoreMatchSession(f.session.serializeSession());
    expect(currentDeploymentBonus(restored.state, f.borrower)).toBe((base + 1) * 2);
    rejectAtomically(restored, f.borrower, { type: 'activate_ability', cardInstanceId: f.support, abilityId: 'support-shot.suppress' });
    advanceAbilityPhase(restored.state, 'action', restored.state.round.roundNumber + 1);
    expect(currentDeploymentBonus(restored.state, f.borrower)).toBe(base);
  });
  it('self-use is exempt but a missing or changed recipient is never replaced by source ownership', () => {
    const f = fixture('master.maiya.deck.support-shot');
    active(f.session, f.sourceId);
    player(f.session, f.playerId).vp = 0;
    activate(f.session, f.playerId, f.sourceId, 'support-shot.suppress');
    expect(player(f.session, f.playerId).vp).toBe(0);
    const g = borrowedSupport(2);
    player(g.session, g.playerId).masterCardId = 'master.shinji';
    rejectAtomically(g.session, g.borrower, { type: 'activate_ability', cardInstanceId: g.support, abilityId: 'support-shot.suppress' });
  });
  it('base terrain bonus works without allocating a terrain slot and ends when its source closes', () => {
    const f = borrowedSupport(2);
    (f.session.state as any).modeState.terrainAssignments = { miyama_town: [] };
    activate(f.session, f.borrower, f.support, 'support-shot.suppress');
    expect(currentDeploymentBonus(f.session.state, f.borrower)).toBe(2);
    expect((f.session.state as any).modeState.terrainAssignments.miyama_town).toEqual([]);
    f.session.state.abilityRuntime!.cardState[f.support]!.active = false;
    expect(currentDeploymentBonus(f.session.state, f.borrower)).toBe(0);
  });
  it.each(['duplicate-recipient','inactive-recipient','wrong-owner','balance-changed'])('revalidates exact payment when %s', variant => {
    const f=borrowedSupport(2);
    expect(f.session.getPlayerView(f.borrower).legalActions.some(a=>a.type==='activate_ability'&&a.cardInstanceId===f.support&&a.abilityId==='support-shot.suppress')).toBe(true);
    if(variant==='duplicate-recipient')player(f.session,f.borrower).masterCardId='master.maiya';
    if(variant==='inactive-recipient')player(f.session,f.playerId).status='eliminated';
    if(variant==='wrong-owner')f.session.state.cards.find(c=>c.instanceId===f.support)!.ownerPlayerId=f.borrower;
    if(variant==='balance-changed')player(f.session,f.borrower).vp=1;
    rejectAtomically(f.session,f.borrower,{type:'activate_ability',cardInstanceId:f.support,abilityId:'support-shot.suppress'});
  });
  it('rolls back a valid exact fee when a downstream effect fails', () => {
    const f=borrowedSupport(2);
    // Deliberate executor fault injection tests Session atomicity, not a reachable authoring vulnerability.
    f.session.state.abilityRuntime!.pack.cards['master.maiya.deck.support-shot']!.abilities[1]!.effects.push({type:'unregistered-test-effect'});
    rejectAtomically(f.session,f.borrower,{type:'activate_ability',cardInstanceId:f.support,abilityId:'support-shot.suppress'});
  });
});
