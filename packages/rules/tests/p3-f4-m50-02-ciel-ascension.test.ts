import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import type { AuthoringCard } from '../src/ability/types';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const ASC='master.ciel.skill.ascension';
const FUNERAL='master.ciel.skill.s2';
const STRENGTH='fixture.ciel.strength';
const OTHER='fixture.ciel.other';
const BASIC_A='fixture.ciel.basic-a';
const BASIC_B='fixture.ciel.basic-b';
const LUCK='basic.luck';

function grantedSoulCrush(): any {
  return {
    id:'expanded-soul-crush', kind:'phase_action', printedClause:'fixture granted soul crush',
    activation:{phase:'combat',opens:'controller_combat_action_window'},
    conditions:[{type:'source_active'},{type:'at_battlefield'}], targets:[], cost:[],
    effects:[{type:'suppress_next_round_situation_benefits',target:{scope:'same_battlefield_opponents',where:[{
      type:'does_not_control_card_definition',definitionIds:['card.cardluck'],zones:['attack'],activeOnly:true,face:'up',
    }]},roundOffset:1,benefits:['situation_mana_gain','situation_power_bonus']}],
    creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},limit:{},visibility:{},
    execution:{mode:'automatic',allowedOperations:[]},
  };
}
function ascensionCard(): any {
  return {
    id:ASC,name:'fixture ascension',cardType:'master_skill',owner:{type:'master',id:'master.ciel'},
    cardFace:{typeLabel:'passive',cost:0,basePower:0,attributes:[]},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],
    abilities:[
      {
        id:'expanded-seventh-scripture-strength',kind:'passive',printedClause:'fixture',markers:['m50_structured_v1'],activation:{},conditions:[{type:'source_owned'}],targets:[],effects:[],cost:[],creates:[],
        ruleModifiers:[{id:'strength-attack-power-plus-four',operation:'add',rule:'card_power',scope:{subject:'controller',cards:{attributesAny:['力量']}},value:4,lifecycle:{duration:'permanent'}}],
        transforms:[{id:'grant-expanded-soul-crush',type:'card',target:{subject:'controller',cards:{attributesAny:['力量']}},grantAbilities:[grantedSoulCrush()],lifecycle:{duration:'permanent'}}],
        lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
      },
      {
        id:'append-funeral-rite',kind:'passive',printedClause:'fixture',markers:['m50_structured_v1'],activation:{},conditions:[{type:'source_owned'},{type:'mana_at_least',amount:8}],targets:[],effects:[],cost:[],creates:[],
        ruleModifiers:[
          {id:'allow-funeral-rite-append',operation:'allow',rule:'standard_append',scope:{subject:'controller',cards:{definitionIds:[FUNERAL]}},lifecycle:{duration:'permanent'}},
          {id:'funeral-rite-append-surcharge',operation:'add',rule:'standard_append_cost',scope:{subject:'controller',cards:{definitionIds:[FUNERAL]}},value:2,lifecycle:{duration:'permanent'}},
        ],
        lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
      },
    ],
  };
}
function ascensionArchive(card=ascensionCard()): any {
  return {schemaVersion:'fd-card-authoring-v1',archiveType:'master_skill_card_archive',id:'master.ciel',name:'fixture',class:'Master',cards:[card]};
}
function basic(id:string, attrs:string[], cost=0, power=3): AuthoringCard {
  return {id,name:id,cardType:'basic_attack',cardFace:{cost,basePower:power,attributes:attrs},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[],mode:'automatic'};
}
function loadPack(): any {
  const existing=rules.loadAuthoringJson(JSON.parse(readFileSync('data/authoring/masters/master.ciel.json','utf8')));
  const asc=rules.loadAuthoringJson(ascensionArchive());
  expect(existing.report).toEqual([]); expect(asc.report).toEqual([]);
  const pack=structuredClone(existing); Object.assign(pack.cards,asc.cards);
  pack.cards[STRENGTH]=basic(STRENGTH,['力量']); pack.cards[OTHER]=basic(OTHER,['魔术']);
  pack.cards[BASIC_A]=basic(BASIC_A,['fixture'],0,1); pack.cards[BASIC_B]=basic(BASIC_B,['fixture'],0,1);
  return pack;
}
function setup(mana=8): GameState {
  const s=createSeededGameState({activeSeats:[1,2,3]}); s.cards=[]; s.round.activePhase='action'; s.round.prioritySeat=s.players[0]!.seat;
  s.players[0]!.masterCardId='master.ciel'; s.players[0]!.mana=mana;
  s.players[0]!.locationId='miyama_town'; s.players[1]!.locationId='miyama_town'; s.players[2]!.locationId='miyama_town';
  rules.initializeAbilityRuntime(s,loadPack(),{seed:20260924});
  s.cards.push({instanceId:'asc-source',definitionId:ASC,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:'p1'}});
  return s;
}
function add(s:GameState,id:string,zone:'hand'|'skill'|'attack_area'='hand',controller='p1'):string {
  const instanceId=`${id}:${s.cards.length}`; s.cards.push({instanceId,definitionId:id,ownerPlayerId:controller,controllerPlayerId:controller,zone,visibility:zone==='attack_area'?{scope:'public'}:{scope:'owner_only',ownerPlayerId:controller}} as any); return instanceId;
}
function activate(s:GameState,instanceId:string,abilityId:string){
  return rules.dispatchAbilityCommand(s,'p1',{type:'activate_ability',cardInstanceId:instanceId,abilityId});
}

describe('P3 F4 M50-02 Ciel ascension',()=>{
  it('loads only the exact structured grant/append envelopes and fails closed when widened',()=>{
    const loaded=rules.loadAuthoringJson(ascensionArchive()); expect(loaded.report).toEqual([]);
    const source=loaded.cards[ASC]!.abilities;
    expect(rules.isAcceptedM50GrantedCardAbilitySource(source[0]!)).toBe(true);
    expect(rules.isAcceptedM50StructuredStandardAppendAbility(source[1]!)).toBe(true);

    const badGrant=ascensionCard(); badGrant.abilities[0].transforms[0].target.cards.attributesAny=[];
    expect(rules.loadAuthoringJson(ascensionArchive(badGrant)).report).toEqual(expect.arrayContaining([expect.objectContaining({abilityId:'expanded-seventh-scripture-strength',path:'copies/transforms'})]));
    const badAppend=ascensionCard(); badAppend.abilities[1].ruleModifiers[1].value=-1;
    expect(rules.loadAuthoringJson(ascensionArchive(badAppend)).report.length).toBeGreaterThan(0);
  });

  it('adds +4 to Strength and projects Soul Crush only onto a matching active physical attack',()=>{
    const s=setup(); const strength=add(s,STRENGTH,'attack_area'); const other=add(s,OTHER,'attack_area');
    s.abilityRuntime!.cardState[strength]={active:true,faceDown:false,playedRound:s.round.roundNumber};
    s.abilityRuntime!.cardState[other]={active:true,faceDown:false,playedRound:s.round.roundNumber};
    expect(rules.calculateCardPower(s,strength).value).toBe(7); expect(rules.calculateCardPower(s,other).value).toBe(3);
    s.round.activePhase='battle';
    const actions=rules.getLegalActions(s,'p1');
    expect(actions).toContainEqual(expect.objectContaining({type:'activate_ability',cardInstanceId:strength,abilityId:'expanded-soul-crush'}));
    expect(actions).not.toContainEqual(expect.objectContaining({type:'activate_ability',cardInstanceId:other,abilityId:'expanded-soul-crush'}));
  });

  it('executes the granted FB2-52 suppression and fails closed when the granting source is no longer owned',()=>{
    const s=setup(); const strength=add(s,STRENGTH,'attack_area'); const other=add(s,OTHER,'attack_area'); const luck=add(s,LUCK,'attack_area','p3');
    s.abilityRuntime!.cardState[strength]={active:true,faceDown:false,playedRound:s.round.roundNumber};
    s.abilityRuntime!.cardState[other]={active:true,faceDown:false,playedRound:s.round.roundNumber};
    s.abilityRuntime!.cardState[luck]={active:true,faceDown:false,playedRound:s.round.roundNumber};
    s.round.activePhase='battle';
    expect(activate(s,strength,'expanded-soul-crush').ok).toBe(true);
    expect(s.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer?.p2).toBe(s.round.roundNumber+1);
    expect(s.abilityRuntime!.situationBenefitsSuppressedRoundByPlayer?.p3).toBeUndefined();

    const stale=setup(); const staleStrength=add(stale,STRENGTH,'attack_area'); stale.abilityRuntime!.cardState[staleStrength]={active:true,faceDown:false,playedRound:stale.round.roundNumber};
    stale.cards.find(c=>c.instanceId==='asc-source')!.zone='removed_from_game'; stale.round.activePhase='battle';
    expect(rules.getLegalActions(stale,'p1')).not.toContainEqual(expect.objectContaining({type:'activate_ability',cardInstanceId:staleStrength,abilityId:'expanded-soul-crush'}));
    expect(activate(stale,staleStrength,'expanded-soul-crush').ok).toBe(false);
  });

  it('keeps Funeral Rite ordinary in a two-card batch without surcharge, even below eight mana',()=>{
    const s=setup(7); const basic=add(s,BASIC_A); const funeral=add(s,FUNERAL,'skill');
    rules.playAbilityCardBatch(s,'p1',[{cardInstanceId:basic},{cardInstanceId:funeral}]);
    expect(s.players[0]!.mana).toBe(6);
    expect(s.cards.find(c=>c.instanceId===funeral)?.zone).toBe('attack_area');
    expect(s.abilityRuntime!.cardState[funeral]?.paidManaOnPlay).toBe(1);
    expect(rules.projectAbilityState(s,'p1').playSummary).toMatchObject({cardsPlayedThisRound:2,attacksDeclaredThisRound:2});
  });

  it('at eight mana permits exactly one extra Funeral Rite slot and charges +2 only to that appended card',()=>{
    const s=setup(8); const first=add(s,BASIC_A); const second=add(s,BASIC_B); const funeral=add(s,FUNERAL,'skill');
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'stage_attack_card',cardInstanceId:funeral}).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'stage_attack_card',cardInstanceId:first}).ok).toBe(true);
    expect(rules.getLegalActions(s,'p1')).toContainEqual({type:'stage_attack_card',cardInstanceId:second});
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'stage_attack_card',cardInstanceId:second}).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'confirm_staged_attack'}).ok).toBe(true);
    expect(s.players[0]!.mana).toBe(5);
    expect(s.abilityRuntime!.cardState[funeral]?.paidManaOnPlay).toBe(3);
    expect(s.abilityRuntime!.cardState[first]?.paidManaOnPlay).toBe(0); expect(s.abilityRuntime!.cardState[second]?.paidManaOnPlay).toBe(0);
    expect(rules.projectAbilityState(s,'p1').playSummary).toMatchObject({cardsPlayedThisRound:3,attacksDeclaredThisRound:2,attackAreaOccupancy:3});
  });

  it('below eight mana rejects the third-card append atomically while preserving the ordinary two slots',()=>{
    const s=setup(7); const first=add(s,BASIC_A); const second=add(s,BASIC_B); const funeral=add(s,FUNERAL,'skill');
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'stage_attack_card',cardInstanceId:first}).ok).toBe(true);
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'stage_attack_card',cardInstanceId:second}).ok).toBe(true);
    expect(rules.getLegalActions(s,'p1')).not.toContainEqual({type:'stage_attack_card',cardInstanceId:funeral});
    const before=structuredClone(s);
    expect(rules.dispatchAbilityCommand(s,'p1',{type:'stage_attack_card',cardInstanceId:funeral}).ok).toBe(false);
    expect(s.players[0]!.mana).toBe(before.players[0]!.mana);
    expect(s.cards.find(c=>c.instanceId===funeral)?.zone).toBe('skill');
  });
});
