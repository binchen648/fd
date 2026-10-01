import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadAuthoringJson } from '../../src/ability/loader';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { calculateCardPower, dispatchAbilityCommand, effectiveCardPlayCost, initializeAbilityRuntime, playAbilityCardBatch, processAbilityEvent } from '../../src/ability/interpreter';
import { bloodlustPlayRequirementWaived, bloodlustValue, setBloodlustValue } from '../../src/ability/bloodlust-cycle-capability';
import { grantMana } from '../../src/core/rule-overrides';
import { playerCombatTotalPowerAdjustment } from '../../src/ability/owner-self-mechanics';
import type { GameState } from '../../src/schema/game';

const ROOT='master.akiha';
const RESOURCE='akiha.bloodlust';
const IDS=['master.akiha.skill.ascension','master.akiha.skill.s1','master.akiha.skill.s1a','master.akiha.skill.s2','master.akiha.skill.s3'];
const path='data/authoring/masters/master.akiha.json';
const raw=JSON.parse(readFileSync(path,'utf8'));
const loaded=loadAuthoringJson(raw);
const card=(id:string)=>loaded.cards[id]!;
const effectTypes=(id:string)=>card(id).abilities.flatMap(a=>a.effects.map(e=>e.type));

function addPhysical(state:GameState,definitionId:string,zone='skill',active=false){
  const instanceId=`akiha:${definitionId}:${state.cards.length}`;
  state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',zone,visibility:['field','attack_area'].includes(zone)?{scope:'public'}:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
  state.abilityRuntime!.cardState[instanceId]={active,faceDown:false,playedRound:state.round.roundNumber};
  return instanceId;
}
function runtimeSetup(){
  const state=createSeededGameState({activeSeats:[1,2,3]}); state.cards=[]; initializeAbilityRuntime(state,loaded,{seed:20261001});
  state.players.forEach(p=>{p.mana=10;p.vp=4;p.locationId='miyama_town';(p as any).commandSpells=3;});
  state.players[0]!.masterCardId=ROOT; state.round.activePhase='action'; state.round.prioritySeat=state.players[0]!.seat;
  const ids={s1:addPhysical(state,'master.akiha.skill.s1'),s1a:addPhysical(state,'master.akiha.skill.s1a'),s2:addPhysical(state,'master.akiha.skill.s2'),s3:addPhysical(state,'master.akiha.skill.s3'),ascension:addPhysical(state,'master.akiha.skill.ascension')};
  processAbilityEvent(state,{id:'akiha-game-start',type:'game_start',playerId:'p1'}); return {state,ids};
}

describe('P3 Akiha owner-complete migration',()=>{
  it('materializes exactly the complete frozen five-identity owner scope',()=>{
    expect(raw.id).toBe(ROOT); expect(raw.name).toBe('远野秋叶'); expect(raw.publicInformation.initialMana).toBe(4);
    expect(raw.cards.map((x:any)=>x.id).sort()).toEqual([...IDS].sort()); expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(loaded.report.filter(x=>x.status==='unsupported')).toEqual([]);
  });
  it('preserves frozen names/text and exact ascension static metadata',()=>{
    expect(raw.cards.map((x:any)=>[x.id,x.name])).toEqual([['master.akiha.skill.s1','槛发'],['master.akiha.skill.s1a','鬼之血脉'],['master.akiha.skill.s2','红赤朱'],['master.akiha.skill.s3','鬼之血脉'],['master.akiha.skill.ascension','璀璨空想']]);
    expect(raw.cards.find((x:any)=>x.id==='master.akiha.skill.ascension').initialPlacement).toBe('outside_game');
    expect(card('master.akiha.skill.ascension').cardFace).toMatchObject({cost:3,basePower:6}); expect(card('master.akiha.skill.ascension').playRequirements).toEqual([{type:'skill_zone_mana_at_least',value:3}]);
  });
  it('consumes only the accepted Bloodlust whole-ability family',()=>{
    expect(effectTypes('master.akiha.skill.s1')).toEqual(['bloodlust_same_battlefield_mana_contribution']);
    expect(effectTypes('master.akiha.skill.s1a')).toEqual(['bloodlust_initialize','bloodlust_track_controller_mana_spend','bloodlust_decay_after_battle']);
    expect(effectTypes('master.akiha.skill.s2')).toEqual(['bloodlust_transform_at_round_end']);
    expect(effectTypes('master.akiha.skill.s3')).toEqual(['bloodlust_threshold_rules','bloodlust_low_threshold_action']);
    expect(effectTypes('master.akiha.skill.ascension')).toEqual(['bloodlust_ascension_modifier_and_plunder']);
  });
  it('preserves exact Bloodlust thresholds and transformed result semantics',()=>{
    expect(card('master.akiha.skill.s1').abilities[0]!.effects[0]).toEqual({type:'bloodlust_same_battlefield_mana_contribution',resourceKey:RESOURCE,amountPerOpponentPerRound:1,minimumOpponentMana:6,requireSameBattlefield:true});
    expect(card('master.akiha.skill.s3').abilities[0]!.effects[0]).toMatchObject({skillPowerThreshold:5,skillPowerBonus:1,playWaiverThreshold:10,playRequirementType:'skill_zone_mana_at_least',playRequirementValue:8,transformThreshold:15});
    expect(card('master.akiha.skill.s2').abilities[0]!.effects[0]).toMatchObject({threshold:15,lockValue:15,removeAllCommandSeals:true,manaGainMultiplier:2,vpGainNumerator:1,vpGainDenominator:2,vpRounding:'floor'});
  });
  it('integrates Akiha exactly once immediately after Akasha',()=>{
    const pack=JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json','utf8')); expect(pack.authoringMasterFiles.filter((x:string)=>x===path)).toHaveLength(1); expect(pack.authoringMasterFiles.slice(-2)).toEqual(['data/authoring/masters/master.akasha.json',path]);
  });
  it('drives the accepted Bloodlust runtime through canonical Akiha definitions',()=>{
    const {state,ids}=runtimeSetup(); expect(bloodlustValue(state,'p1',RESOURCE)).toBe(0);
    const low=dispatchAbilityCommand(state,'p1',{type:'activate_ability',cardInstanceId:ids.s3,abilityId:'akiha.s3.low-action'}); expect(low.ok).toBe(true); expect(bloodlustValue(state,'p1',RESOURCE)).toBe(3);
    setBloodlustValue(state,'p1',RESOURCE,5); state.cards.find(c=>c.instanceId===ids.ascension)!.zone='attack_area'; state.abilityRuntime!.cardState[ids.ascension]!.active=true; expect(calculateCardPower(state,ids.ascension).value).toBe(7);
    expect(bloodlustPlayRequirementWaived(state,'p1','skill_zone_mana_at_least',8)).toBe(false); setBloodlustValue(state,'p1',RESOURCE,10); expect(bloodlustPlayRequirementWaived(state,'p1','skill_zone_mana_at_least',8)).toBe(true);
  });
  it('uses canonical Red Akiha transform and Brilliant Phantasm modifiers',()=>{
    const {state,ids}=runtimeSetup(); setBloodlustValue(state,'p1',RESOURCE,15); processAbilityEvent(state,{id:'akiha-round-end',type:'round_end',playerId:'p1'});
    expect((state.players[0] as any).commandSpells).toBe(0); expect(bloodlustValue(state,'p1',RESOURCE)).toBe(15); expect(effectiveCardPlayCost(state,'p1',ids.ascension)).toBe(6); expect(calculateCardPower(state,ids.ascension).value).toBe(10);
    state.players[0]!.mana=5; grantMana(state,'p1',2,{source:'generic'}); expect(state.players[0]!.mana).toBe(9);
  });
  it('binds canonical Plunder penalty to an actual contributed ascension play',()=>{
    const {state,ids}=runtimeSetup(); state.players[0]!.mana=3; state.players[1]!.mana=6;
    playAbilityCardBatch(state,'p1',[{cardInstanceId:ids.ascension,manaContributions:[{contributorPlayerId:'p2',amount:1}]}]);
    expect(state.players[0]!.mana).toBe(1); expect(state.players[1]!.mana).toBe(5); expect(playerCombatTotalPowerAdjustment(state,'p2')).toBe(-3);
  });
  it('adds no Akiha or Shakespeare identity routing to production runtime',()=>{
    const files=['packages/rules/src/ability/bloodlust-cycle-capability.ts','packages/rules/src/ability/master-ascension-unlock-capability.ts','packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts']; const production=files.map(f=>readFileSync(f,'utf8')).join('\n');
    for(const n of ['master.akiha','远野秋叶','槛发','红赤朱','璀璨空想','servant.shakespeare','莎士比亚','core.akiha-']) expect(production).not.toContain(n);
  });
});
