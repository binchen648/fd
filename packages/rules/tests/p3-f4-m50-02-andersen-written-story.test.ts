import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const SOURCE_DEF='fixture.andersen.written-story';
const SPECIAL_DEF='fixture.andersen.basic-special';
const OTHER_DEF='fixture.andersen.basic-other';
const SOURCE='andersen-source';

function grantedIgnoreDefeat(): any {
  return {
    id:'written-story-ignore-defeat',kind:'phase_action',printedClause:'combat: ignore defeat',
    activation:{phase:'combat',opens:'controller_combat_action_window',requiresSourceState:'active'},
    conditions:[],targets:[],cost:[],effects:[],creates:[],
    ruleModifiers:[{
      id:'ignore-defeat-this-round',printedClause:'combat: ignore defeat',operation:'ignore',rule:'defeat',scope:{subject:'controller'},
      lifecycle:{duration:'this_round'},priority:{tier:'card_text',specificity:'explicit_exception'},conflictPolicy:'explicit_exception_over_general',
    }],
    lifecycle:{},responseWindow:{},limit:{type:'per_round',uses:1,scope:'this_card'},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
  };
}
function writtenStoryCard(): any {
  return {
    id:SOURCE_DEF,name:'fixture written story',cardType:'servant_skill',owner:{type:'servant',id:'servant.fixture-andersen'},
    cardFace:{typeLabel:'fixture',cost:8,basePower:{type:'formula',op:'ceil_divide',args:[{type:'metric',metric:'victory_points'},5]},attributes:['fixture-magic','fixture-np']},
    playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
    abilities:[{
      id:'written-story-residual',kind:'residual',printedClause:'fixture',markers:['m50_structured_v1'],
      activation:{requiresSourceState:'active'},conditions:[{type:'source_active'}],targets:[],effects:[],cost:[],creates:[],
      ruleModifiers:[{
        id:'effects-only-victory-points',printedClause:'effects only',operation:'forbid',rule:'non_effect_victory_point_gain',scope:{subject:'controller'},
        lifecycle:{duration:'while_active'},priority:{tier:'card_text',specificity:'explicit_exception'},conflictPolicy:'explicit_exception_over_general',
      }],
      transforms:[{
        id:'basic-special-becomes-luck',printedClause:'fixture',type:'card',target:{subject:'controller',cards:{basic:true,attributesAny:['fixture-special']}},
        set:{name:'Fixture Lucky'},grantAbilities:[grantedIgnoreDefeat()],lifecycle:{duration:'while_active'},
      }],
      lifecycle:{starts:'immediate',duration:'while_active',cleanup:'remain_active'},responseWindow:{},limit:{},
      visibility:{revealsTrueName:true,revealTiming:'on_use_declared',revealScope:'servant_package'},execution:{mode:'automatic',allowedOperations:[]},
    }],
  };
}
function archive(card=writtenStoryCard()): any {
  return {schemaVersion:'fd-card-authoring-v1',archiveType:'servant_skill_card_archive',id:'servant.fixture-andersen',name:'fixture',class:'Caster',cards:[card]};
}
function basic(id:string,attrs:string[]):AuthoringCard {
  return {id,name:id,cardType:'basic_attack',cardFace:{cost:0,basePower:2,attributes:attrs},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};
}
function pack():any {
  const loaded=rules.loadAuthoringJson(archive()); expect(loaded.report).toEqual([]);
  loaded.cards[SPECIAL_DEF]=basic(SPECIAL_DEF,['fixture-special']); loaded.cards[OTHER_DEF]=basic(OTHER_DEF,['fixture-other']);
  return loaded;
}
function setup():GameState {
  const s=createSeededGameState({activeSeats:[1,2]}); s.cards=[]; s.players[0]!.locationId='miyama_town'; s.players[1]!.locationId='miyama_town';
  s.round.activePhase='combat'; s.round.prioritySeat=s.players[0]!.seat; rules.initializeAbilityRuntime(s,pack(),{seed:20260924});
  s.cards.push({instanceId:SOURCE,definitionId:SOURCE_DEF,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}});
  s.abilityRuntime!.cardState[SOURCE]={active:true,faceDown:false,playedRound:s.round.roundNumber};
  return s;
}
function addAttack(s:GameState,definitionId:string,controller='p1'):string {
  const instanceId=`${definitionId}:${controller}:${s.cards.length}`;
  s.cards.push({instanceId,definitionId,ownerPlayerId:controller,controllerPlayerId:controller,zone:'attack_area',visibility:{scope:'public'}});
  s.abilityRuntime!.cardState[instanceId]={active:true,faceDown:false,playedRound:s.round.roundNumber}; return instanceId;
}
function activate(s:GameState,instanceId:string){return rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:instanceId,abilityId:'written-story-ignore-defeat'});}

describe('P3 F4 M50-02 Andersen Written Story',()=>{
  it('loads only the exact structured residual transform envelope and fails closed when widened',()=>{
    const loaded=rules.loadAuthoringJson(archive()); expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedM50GrantedCardAbilitySource(loaded.cards[SOURCE_DEF]!.abilities[0]!)).toBe(true);
    const bad=writtenStoryCard(); bad.abilities[0].transforms[0].target.cards.basic=false;
    expect(rules.loadAuthoringJson(archive(bad)).report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:'written-story-residual',path:'copies/transforms'})]));
  });

  it.each([[0,0],[1,1],[5,1],[6,2],[11,3]])('computes ceil(VP/5) card power at VP %i',(vp,power)=>{
    const s=setup(); s.players[0]!.vp=vp; expect(rules.calculateCardPower(s,SOURCE).value).toBe(power);
  });

  it('renames and grants only controller basic Special cards while the source is active',()=>{
    const s=setup(); const special=addAttack(s,SPECIAL_DEF); const other=addAttack(s,OTHER_DEF); const enemy=addAttack(s,SPECIAL_DEF,'p2');
    expect(rules.m50GrantedCardNameOverride(s,special)).toBe('Fixture Lucky');
    expect(rules.m50GrantedCardNameOverride(s,other)).toBeUndefined(); expect(rules.m50GrantedCardNameOverride(s,enemy)).toBeUndefined();
    expect(rules.getLegalActions(s,'p1')).toContainEqual(expect.objectContaining({type:'activate_ability',cardInstanceId:special,abilityId:'written-story-ignore-defeat'}));
    expect(rules.getLegalActions(s,'p1')).not.toContainEqual(expect.objectContaining({type:'activate_ability',cardInstanceId:other,abilityId:'written-story-ignore-defeat'}));
    s.abilityRuntime!.cardState[SOURCE]!.active=false;
    expect(rules.m50GrantedCardNameOverride(s,special)).toBeUndefined();
    expect(rules.getLegalActions(s,'p1')).not.toContainEqual(expect.objectContaining({type:'activate_ability',cardInstanceId:special,abilityId:'written-story-ignore-defeat'}));
  });

  it('uses the granted active attack ability once per round and suppresses actual battle-loss effects for the rest of the round',()=>{
    const s=setup(); const special=addAttack(s,SPECIAL_DEF);
    expect(activate(s,special).ok).toBe(true); expect(activate(s,special).ok).toBe(false);
    s.abilityRuntime!.cardState[special]!.active=false;
    const resolved=rules.resolveBattlefield(s,{battlefieldId:'miyama_town',participants:[{playerId:'p1',totalPower:1},{playerId:'p2',totalPower:7}]}).nextState;
    const battle=resolved.battleResults.at(-1)!;
    expect(battle.lossEffectSuppressedPlayerIds).toContain('p1');
    expect(battle.militaryAdjustments.find(entry=>entry.playerId==='p1')?.delta).toBe(0);
  });

  it('forbids base battle VP but still permits explicit effect VP adjustments while active',()=>{
    const s=setup(); s.players[0]!.vp=0;
    s.battleResults=[{battlefieldId:'miyama_town',winnerPlayerIds:['p1'],winnerPlayerId:'p1',tied:false,margin:1,vpReward:2,
      vpAdjustments:[{playerId:'p1',delta:3,source:'effect',label:'fixture-effect'}],militaryAdjustments:[{playerId:'p1',delta:1},{playerId:'p2',delta:-1}],participantBreakdowns:[]} as any];
    const scored=rules.applyBattleScoring(s).nextState;
    expect(scored.players[0]!.vp).toBe(3);
    expect(scored.scoringBreakdown?.find(entry=>entry.playerId==='p1')?.reasons.map(reason=>reason.source)).not.toContain('battle_vp');
  });

  it('forbids non-effect location/recon VP while active and restores it when the source becomes inactive',()=>{
    const active=setup(); active.players[0]!.locationId='recon'; active.players[0]!.vp=0;
    const blocked=rules.applyOccupiedLocationRewards(active).nextState; expect(blocked.players[0]!.vp).toBe(0);
    const inactive=setup(); inactive.players[0]!.locationId='recon'; inactive.players[0]!.vp=0; inactive.abilityRuntime!.cardState[SOURCE]!.active=false;
    const restored=rules.applyOccupiedLocationRewards(inactive).nextState; expect(restored.players[0]!.vp).toBeGreaterThan(0);
  });
});
