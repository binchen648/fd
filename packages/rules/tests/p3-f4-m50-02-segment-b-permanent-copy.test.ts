import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const GIFT='servant.fixture.gift';
const PARASITE='servant.fixture.parasite';
const SOURCE='gift-source';
const PARASITE_INSTANCE='parasite-original';
function ability(): any { return { id:'gift',kind:'phase_action',printedClause:'fixture',markers:['m50_structured_v1'],activation:{phase:'action',opens:'controller_action_window'},conditions:[],targets:[],cost:[],effects:[
  {type:'choose_cards',target:'controller',zone:'skill',definitionIds:[PARASITE],minCount:1,maxCount:1,payloadKey:'selectedInstanceIds'},
  {type:'choose_players',candidateTarget:'same_location_opponents',minCount:1,maxCount:1,payloadKey:'targetPlayerId'},
  {type:'copy_selected_card',id:'copy',source:'selected_card',payloadKey:'selectedInstanceIds',target:'selected_player',zone:'attack_area',face:'up',active:true,temporary:false,lifecycle:{duration:'permanent'},residual:true},
 ],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]} }; }
function archive(extra:any={}):any { const a=ability(); Object.assign(a.effects[2],extra); return {schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture',name:'fixture',class:'Servant',cards:[
 {id:GIFT,name:'gift',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[a]},
 {id:PARASITE,name:'parasite',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0,residual:true},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[]}
]}; }
function setup(){ const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]); const s=createSeededGameState({activeSeats:[1,2]}); s.players[0]!.locationId='miyama_town'; s.players[1]!.locationId='miyama_town'; s.round.activePhase='action'; s.round.prioritySeat=s.players[0]!.seat; s.cards=[
 {instanceId:SOURCE,definitionId:GIFT,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}},
 {instanceId:PARASITE_INSTANCE,definitionId:PARASITE,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}}
 ]; rules.initializeAbilityRuntime(s,pack,{seed:19}); return s; }
function choose(s:any,id:string){ const d=s.abilityRuntime.pendingDecision; expect(d).toBeTruthy(); return rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[id]}); }
describe('P3 F4 M50-02 selected-card permanent copy',()=>{
 it('creates a permanent active public attack owned by the selected player with creator and derived provenance',()=>{ const s=setup(); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'gift'}).ok).toBe(true); expect(choose(s,PARASITE_INSTANCE).ok).toBe(true); expect(choose(s,'p2').ok).toBe(true); const copies=s.cards.filter((c:any)=>c.instanceId!==PARASITE_INSTANCE&&c.definitionId===PARASITE); expect(copies).toHaveLength(1); const copy=copies[0]!; expect(copy).toMatchObject({ownerPlayerId:'p2',controllerPlayerId:'p2',zone:'attack_area',visibility:{scope:'public'},generatedBy:SOURCE,createdByPlayerId:'p1',derivedFromInstanceId:PARASITE_INSTANCE}); expect(s.abilityRuntime!.cardState[copy.instanceId]).toMatchObject({active:true,faceDown:false,playedRound:s.round.roundNumber}); expect(s.abilityRuntime!.structuredTemporaryGeneratedCards ?? []).toEqual([]); });
 it('does not mutate or move the selected source card',()=>{ const s=setup(); rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'gift'}); choose(s,PARASITE_INSTANCE); choose(s,'p2'); expect(s.cards.find((c:any)=>c.instanceId===PARASITE_INSTANCE)).toMatchObject({ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill'}); });
 it('rejects widened copy authoring at load time',()=>{ const report=rules.loadAuthoringJson(archive({temporary:true})).report; expect(report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:'gift',path:'effects[2]',reason:'Structured selected-card copy requires an exact accepted permanent-attack or temporary-skill shape'})])); });
});
