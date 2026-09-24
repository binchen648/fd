import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const OWNER='master.fixture.arcueid';
const MOON='master.fixture.arcueid.skill.s1a';
const THIRST='master.arcueid.skill.s3';
const SOURCE='moon-princess-source';

function moonAbilityCard(): any {
  return {
    id:MOON,name:'Moon Princess fixture',cardType:'master_skill',owner:{type:'master',id:OWNER},
    cardFace:{typeLabel:'action',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
    abilities:[
      {id:'moon-princess-grant-thirst',printedClause:'fixture',kind:'phase_action',activation:{phase:'advance',opens:'controller_action_window'},conditions:[{type:'source_owned'}],effects:[{type:'set_player_flag',target:'controller',key:'moonPrincessThirstActive',value:true}],creates:[{type:'create_card_instances',definitionId:THIRST,count:1,zone:'skill',face:'up',active:false,residual:false,temporary:true,lifecycle:{duration:'until_condition_met',cleanup:'remain_active',expiresOn:['combat.win']}}],markers:['m50_structured_v1'],targets:[],cost:[],ruleModifiers:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}},
      {id:'moon-princess-steal-on-win',printedClause:'fixture',kind:'passive',activation:{trigger:'after_battle_result_determined'},conditions:[{type:'player_flag_equals',key:'moonPrincessThirstActive',value:true},{type:'event_player_won_combat'},{type:'target_count_at_least',count:1,target:{scope:'event_combat_opponents'}}],effects:[{type:'choose_players',candidateTarget:{scope:'event_combat_opponents'},minCount:1,maxCount:1,allowCancel:false,then:[{type:'choose_one',allowCancel:false,options:[
        {id:'0',label:'0',effects:[{type:'transfer_mana',from:'selected_player',target:'controller',amount:0}]},
        {id:'1',label:'1',effects:[{type:'transfer_mana',from:'selected_player',target:'controller',amount:1}]},
        {id:'2',label:'2',effects:[{type:'transfer_mana',from:'selected_player',target:'controller',amount:2}]},
      ]}]}],markers:['m50_structured_v1'],targets:[],cost:[],creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}},
      {id:'moon-princess-end-thirst-on-win',printedClause:'fixture',kind:'passive',activation:{trigger:'after_battle_result_determined'},conditions:[{type:'player_flag_equals',key:'moonPrincessThirstActive',value:true},{type:'event_player_won_combat'}],effects:[{type:'remove_owned_cards_by_linked_skill',target:'controller',linkedSkillId:THIRST,zones:['skill']},{type:'clear_player_flag',target:'controller',key:'moonPrincessThirstActive'}],markers:['m50_structured_v1'],targets:[],cost:[],creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}},
    ],
  };
}
function support(): any { return {id:THIRST,name:'Blood Thirst support',cardType:'master_skill',owner:{type:'master',id:OWNER},cardFace:{typeLabel:'passive',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[]}; }
function archive(): any { return {schemaVersion:'fd-card-authoring-v1',archiveType:'master_skill_card_archive',id:OWNER,name:'fixture',class:'Master',cards:[moonAbilityCard(),support()]}; }
function setup(): GameState {
  const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const s=createSeededGameState({activeSeats:[1,2]}); s.cards=[{instanceId:SOURCE,definitionId:MOON,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}}];
  s.players[0]!.masterCardId=OWNER; s.players[0]!.locationId='miyama_town'; s.players[1]!.locationId='miyama_town';
  s.players[0]!.mana=3; s.players[1]!.mana=5; s.round.activePhase='advance'; s.round.prioritySeat=s.players[0]!.seat;
  rules.initializeAbilityRuntime(s,pack,{seed:20260924}); return s;
}
function grant(s:GameState){ return rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'moon-princess-grant-thirst'}); }
function winEvent(){ return {id:'battle-phase:1:battle:miyama_town:1:result',type:'after_battle_result_determined',playerId:'p1',battlePhaseResolutionId:'battle-phase:1',battleId:'battle-phase:1:battle:miyama_town:1',resultId:'battle-phase:1:battle:miyama_town:1:result',battlefieldId:'miyama_town',battleParticipantIds:['p1','p2'],battleParticipantPowers:{p1:8,p2:5},battleResult:{winners:['p1'],loserIds:['p2']}} as any; }
function choose(s:GameState,id:string){ const d=s.abilityRuntime!.pendingDecision!; return rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[id]}); }

describe('P3 F4 M50-02 Arcueid Moon Princess',()=>{
  it('creates Blood Thirst until a trusted combat win, offers only frozen combat opponents, steals chosen mana, then clears thirst state',()=>{
    const s=setup(); expect(grant(s).ok).toBe(true);
    const thirst=s.cards.find(c=>c.definitionId===THIRST)!; expect(thirst).toMatchObject({ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'},generatedBy:SOURCE});
    expect(s.abilityRuntime!.cardState[thirst.instanceId]).toMatchObject({active:false,faceDown:false});
    expect(s.abilityRuntime!.structuredTemporaryGeneratedCards ?? []).toEqual([]);
    expect(s.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.moonPrincessThirstActive).toBe(true);
    s.round.activePhase='battle'; rules.processAbilityEvent(s,winEvent());
    const window=s.abilityRuntime!.responseWindows[0]!; expect(window.choices).toEqual([expect.objectContaining({cardInstanceId:SOURCE,abilityId:'moon-princess-steal-on-win'})]);
    expect(s.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(s.cards.find(c=>c.instanceId===thirst.instanceId)?.zone).toBe('removed_from_game');
    expect(s.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.moonPrincessThirstActive).toBeUndefined();
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'resolve_response',windowId:window.id,cardInstanceId:SOURCE,abilityId:'moon-princess-steal-on-win'}).ok).toBe(true);
    expect(s.abilityRuntime!.pendingDecision).toMatchObject({controllerId:'p1',candidates:['p2'],min:1,max:1});
    expect(choose(s,'p2').ok).toBe(true); expect(s.abilityRuntime!.pendingDecision?.candidates).toEqual(['0','1','2']);
    expect(choose(s,'2').ok).toBe(true); expect(s.players[0]!.mana).toBe(5); expect(s.players[1]!.mana).toBe(3);
  });
  it('fails closed transactionally if the frozen opponent becomes inactive before the target response',()=>{
    const s=setup(); expect(grant(s).ok).toBe(true); s.round.activePhase='battle'; rules.processAbilityEvent(s,winEvent());
    const window=s.abilityRuntime!.responseWindows[0]!; expect(rules.dispatchAbilityCommand(s,'p1',{type:'resolve_response',windowId:window.id,cardInstanceId:SOURCE,abilityId:'moon-princess-steal-on-win'}).ok).toBe(true);
    s.players[1]!.status='eliminated'; const before=[s.players[0]!.mana,s.players[1]!.mana]; const result=choose(s,'p2');
    expect(result.ok).toBe(false); expect([s.players[0]!.mana,s.players[1]!.mana]).toEqual(before);
  });
  it('drops the latched response if its source is structurally unavailable before resolution',()=>{
    const s=setup(); expect(grant(s).ok).toBe(true); s.round.activePhase='battle'; rules.processAbilityEvent(s,winEvent());
    const window=s.abilityRuntime!.responseWindows[0]!; const source=s.cards.find(c=>c.instanceId===SOURCE)!; source.controllerPlayerId='p2';
    expect(rules.getLegalActions(s,'p1')).not.toContainEqual(expect.objectContaining({type:'resolve_response',windowId:window.id}));
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'resolve_response',windowId:window.id,cardInstanceId:SOURCE,abilityId:'moon-princess-steal-on-win'}).ok).toBe(false);
  });
  it('rejects widened selected-player transfer and widened until-win lifecycle at load time',()=>{
    const badTransfer=archive(); badTransfer.cards[0].abilities[1].effects[0].then[0].options[2].effects[0].requireExact=true;
    expect(rules.loadAuthoringJson(badTransfer).report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:'moon-princess-steal-on-win',reason:'Structured mana transfer requires exact creator or selected-player shape'})]));
    const badLife=archive(); badLife.cards[0].abilities[0].creates[0].lifecycle.expiresOn=['combat.loss'];
    const pack=rules.loadAuthoringJson(badLife); expect(pack.report).toEqual([]);
    const s=createSeededGameState({activeSeats:[1,2]}); s.cards=[{instanceId:SOURCE,definitionId:MOON,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}}]; s.players[0]!.masterCardId=OWNER; s.round.activePhase='advance'; s.round.prioritySeat=s.players[0]!.seat; rules.initializeAbilityRuntime(s,pack,{seed:1});
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'moon-princess-grant-thirst'}).ok).toBe(false);
  });
});
