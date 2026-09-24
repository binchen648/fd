import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createMatchSession } from '../src/match-session';

const SOURCE_DEF='fixture.gorgon.pandemonium';
const SOURCE='gorgon-source';
const SPECIAL='fixture.gorgon.special';
const NORMAL='fixture.gorgon.normal';

function lockdownAbility(): any { return {
  id:'blood-fortress-lockdown',kind:'passive',printedClause:'fixture lockdown',markers:['m50_structured_v1'],
  activation:{requiresSourceState:'active'},conditions:[{type:'source_active'}],targets:[],effects:[],cost:[],creates:[],
  ruleModifiers:[
    {id:'forbid-special-attacks-here',operation:'forbid',rule:'card_play',scope:{subject:'players_at_source_battlefield',cards:{attributesAny:['特殊']}},lifecycle:{duration:'while_active'}},
    {id:'lock-source-battlefield-boundary',operation:'forbid',rule:'movement_destinations',scope:{subject:'all_players',sourceLocationBoundary:true},lifecycle:{duration:'while_active'}},
  ],
  lifecycle:{duration:'while_active',cleanup:'remain_active'},visibility:{revealsTrueName:true,revealTiming:'on_use_declared',revealScope:'servant_package'},
  responseWindow:{},limit:{},execution:{mode:'automatic',allowedOperations:[]},
}; }
function eyeAbility(): any { return {
  id:'earth-mother-eye',kind:'phase_action',printedClause:'fixture eye',markers:['m50_structured_v1'],
  activation:{phase:'combat',requiresSourceState:'active',opens:'controller_combat_action_window'},conditions:[{type:'source_active'}],targets:[],cost:[],
  effects:[{type:'defeat_player',target:{scope:'same_battlefield_opponents',where:[{type:'face_up_cards_played_this_round_at_least',count:2}]}}],
  creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
}; }
function archive(lockdown:any=lockdownAbility(), eye:any=eyeAbility()):any { return {
  schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture-gorgon',name:'fixture',class:'Avenger',cards:[{
    id:SOURCE_DEF,name:'fixture',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture-gorgon'},cardFace:{cost:0,basePower:3,attributes:['宝具']},
    playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[lockdown,eye],mode:'automatic',
  }],
}; }
function basic(id:string,attrs:string[]):any { return {id,name:id,cardType:'basic_attack',cardFace:{cost:0,basePower:1,attributes:attrs},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'}; }
function setup(){
  const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const session=createMatchSession({seed:20260924,humanPlayerId:'p1'}); const p1=session.state.players.find(p=>p.id==='p1')!; const p2=session.state.players.find(p=>p.id==='p2')!; const p3=session.state.players.find(p=>p.id==='p3')!;
  Object.assign(session.state.abilityRuntime!.pack.cards,pack.cards,{[SPECIAL]:basic(SPECIAL,['特殊']),[NORMAL]:basic(NORMAL,['力量'])});
  session.state.cards.push({instanceId:SOURCE,definitionId:SOURCE_DEF,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}} as any);
  session.state.abilityRuntime!.cardState[SOURCE]={active:true,faceDown:false,playedRound:session.state.round.roundNumber};
  p1.locationId='shinto'; p2.locationId='shinto'; p3.locationId='miyama_town'; p1.mana=p2.mana=p3.mana=20;
  return {session,p1,p2,p3};
}
function addHand(session:any,playerId:string,definitionId:string){ const id=`${definitionId}:${playerId}:${session.state.cards.length}`; session.state.cards.push({instanceId:id,definitionId,ownerPlayerId:playerId,controllerPlayerId:playerId,zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:playerId}}); return id; }

describe('P3 F4 M50-02 Gorgon Pandemonium',()=>{
  it('accepts only the exact lockdown + threshold defeat envelopes',()=>{
    const exact=rules.loadAuthoringJson(archive()); expect(exact.report).toEqual([]);
    expect(rules.isAcceptedM50SourceBattlefieldLockdownAbility(exact.cards[SOURCE_DEF]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility(exact.cards[SOURCE_DEF]!.abilities[1]!,'compiled')).toBe(true);
    const bad=lockdownAbility(); bad.ruleModifiers[1].scope.extra=true;
    expect(rules.loadAuthoringJson(archive(bad,eyeAbility())).report.length).toBeGreaterThan(0);
  });

  it('forbids Special card play for every player at the active source battlefield and restores it when source closes',()=>{
    const {session,p1,p2}=setup(); const p1Special=addHand(session,'p1',SPECIAL); const p1Normal=addHand(session,'p1',NORMAL); const p2Special=addHand(session,'p2',SPECIAL);
    session.state.round.activePhase='action'; session.state.round.prioritySeat=p1.seat;
    expect(rules.getLegalActions(session.state,'p1')).not.toContainEqual({type:'play_card',cardInstanceId:p1Special});
    expect(rules.getLegalActions(session.state,'p1')).toContainEqual({type:'play_card',cardInstanceId:p1Normal});
    session.state.round.prioritySeat=p2.seat;
    expect(rules.getLegalActions(session.state,'p2')).not.toContainEqual({type:'play_card',cardInstanceId:p2Special});
    session.state.abilityRuntime!.cardState[SOURCE]!.active=false;
    expect(rules.getLegalActions(session.state,'p2')).toContainEqual({type:'play_card',cardInstanceId:p2Special});
  });

  it('blocks crossing the active source battlefield boundary in both directions for all players',()=>{
    const {session,p2,p3}=setup(); session.state.round.activePhase='action'; session.state.round.prioritySeat=p2.seat;
    expect(rules.movePlayer(session.state,{playerId:'p2',to:'miyama_town',movementKind:'normal'})).toMatchObject({moved:false,reason:'movement_locked'});
    session.state.round.prioritySeat=p3.seat;
    expect(rules.movePlayer(session.state,{playerId:'p3',to:'shinto',movementKind:'normal'})).toMatchObject({moved:false,reason:'movement_locked'});
    session.state.abilityRuntime!.cardState[SOURCE]!.active=false;
    expect(rules.m50SourceBattlefieldMovementForbidden(session.state,'miyama_town','shinto')).toBe(false);
  });

  it('Earth Mother Eye defeats only same-battlefield opponents with at least two face-up plays this round',()=>{
    const {session,p1}=setup(); session.state.round.activePhase='battle'; session.state.round.prioritySeat=p1.seat;
    session.state.abilityRuntime!.playCounters={round:session.state.round.roundNumber,cardsPlayedByPlayer:{p2:2,p3:3},faceUpCardsPlayedByPlayer:{p2:2,p3:3},attacksDeclaredByPlayer:{p2:2,p3:3}};
    const result=rules.dispatchAbilityCommand(session.state,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'earth-mother-eye'});
    expect(result.ok).toBe(true); expect(session.state.abilityRuntime!.structuredDefeatRoundByPlayer?.p2).toBe(session.state.round.roundNumber); expect(session.state.abilityRuntime!.structuredDefeatRoundByPlayer?.p3).toBeUndefined();
  });

  it('does not count one face-up play or face-down-only plays toward Earth Mother Eye',()=>{
    const {session,p1}=setup(); session.state.round.activePhase='battle'; session.state.round.prioritySeat=p1.seat;
    session.state.abilityRuntime!.playCounters={round:session.state.round.roundNumber,cardsPlayedByPlayer:{p2:3},faceUpCardsPlayedByPlayer:{p2:1},attacksDeclaredByPlayer:{p2:3}};
    expect(rules.dispatchAbilityCommand(session.state,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'earth-mother-eye'}).ok).toBe(true);
    expect(session.state.abilityRuntime!.structuredDefeatRoundByPlayer?.p2).toBeUndefined();
  });
});
