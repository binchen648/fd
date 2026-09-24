import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD='servant.fixture.parvati-like'; const SOURCE='parvati-like-source';
function archive(): any { return { schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture',name:'fixture',class:'Lancer',cards:[{
 id:CARD,name:'fixture',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture'},cardFace:{typeLabel:'fixture',attributes:['魔术'],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[
 {id:'arm',kind:'phase_action',printedClause:'fixture',markers:['m50_structured_v1'],activation:{phase:'action',opens:'controller_action_window'},conditions:[{type:'source_active'}],targets:[],effects:[{type:'set_player_flag',target:'controller',key:'fixtureDefeatRound',value:{type:'current_round'},lifecycle:{duration:'this_round'}}],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}},
 {id:'defeat',kind:'phase_action',printedClause:'fixture',markers:['m50_structured_v1'],activation:{phase:'combat',opens:'controller_combat_action_window'},conditions:[{type:'source_active'},{type:'player_flag_number_current_round',key:'fixtureDefeatRound'}],targets:[],effects:[{type:'choose_players',candidateTarget:'engaged_opponents',minCount:1,maxCount:1,payloadKey:'targetPlayerId',then:[{type:'defeat_player',target:'targetPlayerId'}]}],cost:[],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}}
 ]}]}; }
function setup():GameState { const pack=rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]); const s=createSeededGameState({activeSeats:[1,2,3]}); s.cards=[{instanceId:SOURCE,definitionId:CARD,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}}]; s.players[0]!.locationId='miyama_town';s.players[1]!.locationId='miyama_town';s.players[2]!.locationId='shinto';s.round.activePhase='action';s.round.prioritySeat=s.players[0]!.seat;rules.initializeAbilityRuntime(s,pack,{seed:20260924});s.abilityRuntime!.cardState[SOURCE]={active:true,faceDown:false,playedRound:s.round.roundNumber};return s; }

describe('P3 F4 M50-02 chosen engaged-opponent defeat',()=>{
 it('carries a current-round qualification into combat and stages only the authoritative selected opponent',()=>{
  const s=setup(); expect(rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'arm'}).ok).toBe(true);
  s.round.activePhase='battle'; s.round.prioritySeat=s.players[0]!.seat;
  const activation = rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:'defeat'}); expect(activation.ok).toBe(true);
  expect(s.abilityRuntime!.pendingDecision?.candidates).toEqual(['p2']); const d=s.abilityRuntime!.pendingDecision!;
  expect(rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:['p2']}).ok).toBe(true);
  expect(s.abilityRuntime!.pendingPreBattleDefeats).toEqual([expect.objectContaining({controllerId:'p1',sourceCardId:SOURCE,abilityId:'defeat',targetPlayerIds:['p2']})]);
 });
});
