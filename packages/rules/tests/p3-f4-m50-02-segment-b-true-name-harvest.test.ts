import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF='servant.fixture.clytie';
const MATCH='card.x-foreign-life';
const SOURCE='clytie-source';
function baseAbility(id:string,kind:string,activation:any,effects:any[],conditions:any[]=[]):any { return {id,kind,printedClause:'fixture',markers:['m50_structured_v1'],activation,conditions,targets:[],cost:[],effects,ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}}; }
function archive(extraHarvest:any={}):any { return {schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture',name:'fixture',class:'Servant',cards:[
 {id:SOURCE_DEF,name:'fixture',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[
  baseAbility('reveal-now','phase_action',{phase:'action',opens:'controller_action_window'},[{type:'reveal_information',scope:'servant_package',subject:'controller.servant'}]),
  baseAbility('harvest','forced_trigger',{trigger:'m50_servant_true_name_revealed'},[
   {type:'lose_victory_points_per_matching_cards',target:'all_players',zone:'discard',definitionIds:[MATCH],amountPerCard:2,maxAmount:6,...extraHarvest},
   {type:'transfer_matching_cards',sourceTarget:'all_players',target:'controller',zone:'discard',destination:'hand',definitionIds:[MATCH]},
   {type:'exile_source_card'},
  ],[{type:'event_player_is_controller'}]),
 ]},
 {id:MATCH,name:'foreign',cardType:'servant_attack',owner:{type:'servant',id:'servant.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[]}
]}; }
function setup(){ const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]); const s=createSeededGameState({activeSeats:[1,2]}); s.players[0]!.vp=5; s.players[1]!.vp=10; s.round.activePhase='action'; s.round.prioritySeat=s.players[0]!.seat; s.cards=[{instanceId:SOURCE,definitionId:SOURCE_DEF,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}}]; let n=0; for(const owner of ['p1','p2','p2','p2','p2']) s.cards.push({instanceId:'foreign-'+(++n),definitionId:MATCH,ownerPlayerId:owner,controllerPlayerId:owner,zone:'discard',visibility:{scope:'public'}}); rules.initializeAbilityRuntime(s,pack,{seed:5}); s.abilityRuntime!.cardState[SOURCE]={active:false,faceDown:false,playedRound:s.round.roundNumber}; return s; }

describe('P3 F4 M50-02 Segment B true-name harvest',()=>{
 it('routes a real reveal through the forced trigger, caps each player loss, transfers matching cards, then exiles the source',()=>{ const s=setup(); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'reveal-now'}).ok).toBe(true); expect(s.abilityRuntime!.revealedServants).toContain('p1'); expect(s.players[0]!.vp).toBe(3); expect(s.players[1]!.vp).toBe(4); const moved=s.cards.filter(c=>c.definitionId===MATCH); expect(moved).toHaveLength(5); expect(moved.every(c=>c.ownerPlayerId==='p1'&&c.controllerPlayerId==='p1'&&c.zone==='hand')).toBe(true); expect(moved.every(c=>c.visibility.scope==='owner_only')).toBe(true); for(const c of moved) expect(s.abilityRuntime!.cardState[c.instanceId]).toMatchObject({active:false,faceDown:true}); expect(s.cards.find(c=>c.instanceId===SOURCE)).toMatchObject({zone:'removed_from_game'}); expect(s.abilityRuntime!.processedEvents.some(id=>id.includes('true-name-revealed'))).toBe(true); });
 it('does not fire the controller-only harvest for another player reveal event',()=>{ const s=setup(); rules.processAbilityEvent(s,{id:'other-reveal',type:'m50_servant_true_name_revealed',playerId:'p2'}); expect(s.players[0]!.vp).toBe(5); expect(s.players[1]!.vp).toBe(10); expect(s.cards.find(c=>c.instanceId===SOURCE)!.zone).toBe('skill'); });
 it('rejects widened matching-card VP-loss authoring',()=>{ const bad=archive({target:'controller'}); const report=rules.loadAuthoringJson(bad).report; expect(report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:'harvest',reason:'Structured matching-card VP loss requires exact discard-zone shape'})])); });
});
