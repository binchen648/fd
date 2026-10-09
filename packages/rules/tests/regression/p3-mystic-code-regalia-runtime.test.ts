import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

/** Executable physical-source regression; each run must be verified separately.
 * Each mode is an owned physical Skill; only a real acquired ascension permits
 * a live mode bonus. There are no hard-coded Hakuno identities in the runtime.
 */
const master='master.fixture-regalia';
const modes={
  extra:master+'.skill.extra',
  ccc:master+'.skill.ccc',
  extella:master+'.skill.extella',
  link:master+'.skill.link',
};
const ascension=master+'.skill.ascension';
const basic=master+'.attack.basic';
function baseAbility() {
  return {
    id:'moon-cell-regalia',kind:'passive',printedClause:'Four conditional code modifiers',
    activation:{trigger:'while_active'},conditions:[],targets:[],
    effects:[{type:'mystic_code_regalia',codeDefinitionIds:modes}],
    cost:[],creates:[],ruleModifiers:[],lifecycle:{},
    responseWindow:{order:'turn_order',passBehavior:'decline_this_window'},
    limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]},
  };
}
function authoredCard(id:string,cardType:string,abilities:any[],outside=false,power=0) {
  return {
    id,name:id,cardType,owner:{type:'master',id:master},
    printedText:id,cardFace:{typeLabel:'技能',cost:0,basePower:power,attributes:[]},
    playTiming:{phase:'action',window:'controller_play_card_window'},
    playRequirements:[],verification:{implementationStatus:'complete'},
    ...(outside?{initialPlacement:'outside_game'}:{}),abilities,
  };
}
function stateWithMode(mode:keyof typeof modes,hasAscension=true,played=false) {
  const archive={
    schemaVersion:'fd-card-authoring-v1',id:master,name:'Regalia regression fixture',
    cards:[
      authoredCard(ascension,'master_skill',[baseAbility()]),
      ...Object.values(modes).map(id=>authoredCard(id,'master_skill',[],true,3)),
      authoredCard(basic,'basic_attack',[],false,2),
    ],
  };
  const pack=rules.loadAuthoringJson(archive as any);
  expect(pack.report).toEqual([]);
  const state=createSeededGameState({activeSeats:[1,2]});
  state.cards=[];state.players[0]!.masterCardId=master;
  state.round.activePhase='action';
  rules.initializeAbilityRuntime(state,pack,{seed:911});
  const physical=(instanceId:string,definitionId:string,zone:string,active:boolean)=>{
    state.cards.push({instanceId,definitionId,ownerPlayerId:'p1',controllerPlayerId:'p1',
      zone,visibility:{scope:'owner_only',ownerPlayerId:'p1'}} as any);
    state.abilityRuntime!.cardState[instanceId]={
      active,faceDown:false,playedRound:state.round.roundNumber};
  };
  if(hasAscension)physical('ascension',ascension,'skill',false);
  physical('mode',modes[mode],played?'attack_area':'skill',played);
  physical('basic',basic,'attack_area',true);
  return state;
}
describe('Mystic Code Moon Cell Regalia physical source semantics',()=>{
  it('rejects widened mode maps and duplicate mode identities during authoring load',()=>{
    const original=authoredCard(ascension,'master_skill',[baseAbility()]);
    const widened=structuredClone(original);
    (widened.abilities[0].effects[0] as any).codeDefinitionIds.other=master+'.skill.other';
    const duplicates=structuredClone(original);
    (duplicates.abilities[0].effects[0] as any).codeDefinitionIds.link=modes.extra;
    const load=(card:unknown)=>rules.loadAuthoringJson({
      schemaVersion:'fd-card-authoring-v1',id:master,cards:[card],
    } as any);
    expect(load(widened).report.some(item=>item.status==='unsupported')).toBe(true);
    expect(load(duplicates).report.some(item=>item.status==='unsupported')).toBe(true);
  });
  it('Link adds exactly one Power to a controller basic attack while ascension is live',()=>{
    const state=stateWithMode('link');
    expect(rules.calculateCardPower(state,'basic').value).toBe(3);
    state.cards.find(c=>c.instanceId==='ascension')!.zone='removed_from_game';
    expect(rules.calculateCardPower(state,'basic').value).toBe(2);
  });
  it('Extella needs an actually played active attack source for +5 and zero terrain',()=>{
    const state=stateWithMode('extella',true,true);
    expect(rules.calculateCardPower(state,'mode').value).toBe(8);
    expect(rules.mysticCodeTerrainZero(state,'p1')).toBe(true);
    state.abilityRuntime!.cardState.mode!.active=false;
    expect(rules.mysticCodeTerrainZero(state,'p1')).toBe(false);
  });
  it('waives only the exact eight-mana Extra play gate with a physically acquired ascension',()=>{
    for(const [acquired,requirement,expected] of [
      [true,8,true],[false,8,false],[true,9,false],
    ] as const){
      const state=stateWithMode('extra',acquired);
      state.players[0]!.mana=0;
      (state.abilityRuntime!.pack.cards[modes.extra]!.playRequirements as any[]).push({
        type:'skill_zone_mana_at_least',value:requirement,
      });
      const legal=rules.getLegalActions(state,'p1').some(action=>
        action.type==='play_card' && action.cardInstanceId==='mode');
      expect(legal).toBe(expected);
    }
  });

  it('an unacquired ascension never authorizes Link or Extella bonuses',()=>{
    const link=stateWithMode('link',false);
    expect(rules.calculateCardPower(link,'basic').value).toBe(2);
    const extella=stateWithMode('extella',false,true);
    expect(rules.calculateCardPower(extella,'mode').value).toBe(3);
    expect(rules.mysticCodeTerrainZero(extella,'p1')).toBe(false);
  });
});
