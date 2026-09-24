import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const CARD='servant.fixture.skill.command-seal-conditional-defeat';
const SOURCE='command-seal-conditional-source';
const ABILITY='command-seal-conditional';
function archive():any{return {schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture',name:'fixture',class:'Caster',cards:[{
 id:CARD,name:'fixture',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture'},cardFace:{typeLabel:'fixture',attributes:[],cost:0,basePower:0},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{
  id:ABILITY,kind:'phase_action',printedClause:'fixture',markers:['m50_structured_v1'],activation:{phase:'action',opens:'controller_action_window',requiresSourceState:'active'},
  conditions:[{type:'at_battlefield'}],targets:[{id:'targetPlayerId',type:'player',constraints:[{type:'same_battlefield_as_controller'}]}],cost:[],effects:[{
   type:'lose_command_seals',target:'targetPlayerId',amount:1,then:[
    {type:'if_condition',conditions:[{type:'target_command_seals_at_most',target:'targetPlayerId',value:1}],then:[{type:'defeat_player',target:'targetPlayerId'}]},
    {type:'if_condition',conditions:[{type:'target_command_seals_equals',target:'targetPlayerId',value:0}],then:[{type:'combat_power_bonus',amount:10}]},
   ]
  }],ruleModifiers:[],creates:[],lifecycle:{},responseWindow:{},limit:{type:'per_game',uses:1,scope:'this_card'},visibility:{},execution:{mode:'automatic',allowedOperations:[]}
 }]
}]};}
function setup(seals=2):GameState{const pack=rules.loadAuthoringJson(archive());expect(pack.report).toEqual([]);const s=createSeededGameState({activeSeats:[1,2,3]});s.cards=[{instanceId:SOURCE,definitionId:CARD,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}}];for(const p of s.players)p.locationId='miyama_town';(s.players[1] as any).commandSpells=seals;(s.players[0] as any).commandSpells=1;(s.players[2] as any).commandSpells=3;s.round.activePhase='action';s.round.prioritySeat=s.players[0]!.seat;rules.initializeAbilityRuntime(s,pack,{seed:20260924});s.abilityRuntime!.cardState[SOURCE]={active:true,faceDown:false,playedRound:s.round.roundNumber};return s;}
function activate(s:GameState){return rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:SOURCE,abilityId:ABILITY});}
function choose(s:GameState,targetId:string){const d=s.abilityRuntime!.pendingDecision!;return rules.dispatchAbilityCommand(s,'p1',{type:'choose_target',decisionId:d.id,selectedIds:[targetId]});}

describe('P3 F4 M50-02 command-seal loss conditional defeat family',()=>{
 it('offers all active same-battlefield players including the controller',()=>{const s=setup(2);expect(activate(s).ok).toBe(true);expect(s.abilityRuntime!.pendingDecision!.candidates).toEqual(['p1','p2','p3']);});
 it('with two pre-loss seals loses one but does not defeat or grant power',()=>{const s=setup(2);expect(activate(s).ok).toBe(true);expect(choose(s,'p2').ok).toBe(true);expect((s.players[1] as any).commandSpells).toBe(1);expect(s.abilityRuntime!.structuredDefeatRoundByPlayer?.p2).toBeUndefined();expect(s.abilityRuntime!.roundTotalPowerAdjustments.byPlayer.p1??0).toBe(0);});
 it('with one pre-loss seal loses it and defeats without the zero-seal power branch',()=>{const s=setup(1);expect(activate(s).ok).toBe(true);expect(choose(s,'p2').ok).toBe(true);expect((s.players[1] as any).commandSpells).toBe(0);expect(s.abilityRuntime!.structuredDefeatRoundByPlayer?.p2).toBe(s.round.roundNumber);expect(s.abilityRuntime!.roundTotalPowerAdjustments.byPlayer.p1??0).toBe(0);});
 it('with zero pre-loss seals defeats and grants controller +10 total power',()=>{const s=setup(0);expect(activate(s).ok).toBe(true);expect(choose(s,'p2').ok).toBe(true);expect((s.players[1] as any).commandSpells).toBe(0);expect(s.abilityRuntime!.structuredDefeatRoundByPlayer?.p2).toBe(s.round.roundNumber);expect(s.abilityRuntime!.roundTotalPowerAdjustments.byPlayer.p1).toBe(10);});
 it('can legally select and defeat the controller itself',()=>{const s=setup(2);expect(activate(s).ok).toBe(true);expect(choose(s,'p1').ok).toBe(true);expect((s.players[0] as any).commandSpells).toBe(0);expect(s.abilityRuntime!.structuredDefeatRoundByPlayer?.p1).toBe(s.round.roundNumber);});
 it('enforces the exact once-per-game activation limit',()=>{const s=setup(2);expect(activate(s).ok).toBe(true);expect(choose(s,'p2').ok).toBe(true);expect(activate(s).ok).toBe(false);});
});