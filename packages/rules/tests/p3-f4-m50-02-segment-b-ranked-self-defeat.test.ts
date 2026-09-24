import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD='servant.fixture.skill.ranked-self-defeat';
const SOURCE='ranked-self-defeat-source';
const ABILITY='ranked-self-defeat';
function archive():any{return {schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture',name:'fixture',class:'Caster',cards:[{
 id:CARD,name:'fixture',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{
  id:ABILITY,kind:'passive',printedClause:'fixture',markers:['m50_structured_v1'],activation:{trigger:'m50_round_started'},
  conditions:[{type:'source_active'},{type:'victory_points_is_first'}],targets:[],cost:[],effects:[
   {type:'defeat_player',target:'controller'},
   {type:'gain_victory_points',target:'controller',amount:2},
  ],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}
 }]
}]};}
function setup():GameState{const pack=rules.loadAuthoringJson(archive());expect(pack.report).toEqual([]);const s=createSeededGameState({activeSeats:[1,2,3]});s.cards=[{instanceId:SOURCE,definitionId:CARD,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}}];s.abilityRuntime=undefined;rules.initializeAbilityRuntime(s,pack,{seed:20260924});s.abilityRuntime!.cardState[SOURCE]={active:true,faceDown:false,playedRound:s.round.roundNumber};return s;}
describe('P3 F4 M50-02 ranked round-start self defeat sequence',()=>{
 it('marks the tied-first controller defeated for the round and continues later effects',()=>{const s=setup();s.players[0]!.vp=5;s.players[1]!.vp=5;s.players[2]!.vp=3;rules.processAbilitySystemEvent(s,'ranked-start',{type:'m50_round_started'} as any);expect(s.abilityRuntime!.structuredDefeatRoundByPlayer?.p1).toBe(s.round.roundNumber);expect(s.players[0]!.vp).toBe(7);});
 it('does nothing when the controller is not first',()=>{const s=setup();s.players[0]!.vp=4;s.players[1]!.vp=5;s.players[2]!.vp=3;rules.processAbilitySystemEvent(s,'ranked-start',{type:'m50_round_started'} as any);expect(s.abilityRuntime!.structuredDefeatRoundByPlayer?.p1).toBeUndefined();expect(s.players[0]!.vp).toBe(4);});
});