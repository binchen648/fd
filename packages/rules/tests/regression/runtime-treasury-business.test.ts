import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {createMatchSession} from '../../src/match-session';
import {loadAuthoringJson} from '../../src/ability/loader';
import {initializeAbilityRuntime,advanceAbilityPhase,calculateCardPower,resolveEffect} from '../../src/ability/interpreter';
import {getEffectiveCardAttributes} from '../../src/ability/card-instance-state';
import {projectCurrentPlayerPowers,resolveBattlefield} from '../../src/core/combat-resolver';
import {restoreTrustedAuthoringFixtureSession} from '../trusted-authoring-fixture';
const archive=JSON.parse(readFileSync('packages/rules/tests/fixtures/b-kinggil-92cf9004.json','utf8'));
const id='servant.kinggil.skill.sc-kinggil-2';
const action=id+'.discard-attributes',combat=id+'.double-current-power';
const treasuryArchive = {...archive, cards: archive.cards.filter((card: {id: string}) => card.id === id), characters: []};
function setup(failing=false){
 const session=createMatchSession({seed:20260907}),s=session.state,canonical=s.abilityRuntime!.pack,input=structuredClone(treasuryArchive);
 if(failing)input.cards.find((c:any)=>c.id===id).abilities.find((a:any)=>a.id===action).effects.push({type:'pay_mana',amount:999});
 const loaded=loadAuthoringJson(input);expect(loaded.report).toEqual([]);
 const materials=loadAuthoringJson({schemaVersion:'fd-card-authoring-v1',id:'fixture.treasury',name:'disclosed materials',cards:[['力量','力量'],['魔术']].map((attributes,i)=>({id:'fixture.material.'+i,name:'material',cardType:'basic_attack',cardFace:{cost:0,basePower:1,attributes},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[]}))});expect(materials.report).toEqual([]);
 s.cards=[];s.eventPlacements=[];s.currentSituationModifiers=[];
 for(const p of s.players){p.locationId=p.id==='p1'?'shinto':'miyama_town';p.mana=20;}
 delete s.abilityRuntime;initializeAbilityRuntime(s,{...canonical,cards:{...canonical.cards,...loaded.cards,...materials.cards}});
 s.round.activePhase='action';s.round.prioritySeat=1;
 s.cards.push({instanceId:'treasury',definitionId:id,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'hand',visibility:{scope:'owner_only',ownerPlayerId:'p1'}});
 expect(session.dispatchPlayerAction('p1',{type:'skip_normal_move'}).ok).toBe(true);
 const result=session.dispatchPlayerAction('p1',{type:'play_card',cardInstanceId:'treasury',faceDown:false});expect(result.ok,JSON.stringify(result.rejection)).toBe(true);
 expect(s.abilityRuntime!.cardState.treasury).toMatchObject({active:true,faceDown:false,playedRound:1});
 expect(s.players[0]!.mana).toBe(17);expect(s.abilityRuntime!.manaSpentThisRound!.p1).toBe(3);
 return session;
}
function material(session:ReturnType<typeof setup>,instance:string,index=0,owner='p1',zone='hand'){
 session.state.cards.push({instanceId:instance,definitionId:'fixture.material.'+index,ownerPlayerId:owner,controllerPlayerId:owner,zone,visibility:{scope:'owner_only',ownerPlayerId:owner}});
}
function activate(session:ReturnType<typeof setup>,abilityId=action){return session.dispatchPlayerAction('p1',{type:'activate_ability',cardInstanceId:'treasury',abilityId});}
function battle(session:ReturnType<typeof setup>){advanceAbilityPhase(session.state,'battle',1);session.state.round.prioritySeat=1;}
const power=(session:ReturnType<typeof setup>)=>projectCurrentPlayerPowers(session.state,['p1']).p1!;
function eventBonus(session:ReturnType<typeof setup>){session.state.currentSituationModifiers=[{sourceId:'fixture.event-equivalent',targetTag:'宝具',value:2,condition:'has_attribute'}];}
const common={conditions:[],targets:[],cost:[],effects:[],creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};
function host(session:ReturnType<typeof setup>,ability:any,owner='p1'){
 const key='fixture.host.'+ability.id,loaded=loadAuthoringJson({schemaVersion:'fd-card-authoring-v1',id:'fixture.host',name:'disclosed host',cards:[{id:key,name:'disclosed host',cardType:'servant_skill',cardFace:{cost:0,basePower:0,attributes:[]},playTiming:{phase:'action',window:'controller_play_card_window'},playRequirements:[],abilities:[{...common,kind:'phase_action',printedClause:'disclosed consumer probe',activation:{phase:'combat',opens:'controller_combat_action_window',requiresSourceState:'active'},...ability}]}]});expect(loaded.report).toEqual([]);
 Object.assign(session.state.abilityRuntime!.pack.cards,loaded.cards);session.state.cards.push({instanceId:key,definitionId:key,ownerPlayerId:owner,controllerPlayerId:owner,zone:'field',visibility:{scope:'public'}});session.state.abilityRuntime!.cardState[key]={active:true,faceDown:false,playedRound:1};return key;
}
describe('full Treasury runtime business package',()=>{
 it('loads the exact frozen Treasury card and keeps both phase limits',()=>{const p=loadAuthoringJson(treasuryArchive);expect(p.report).toEqual([]);expect(p.cards[id]!.abilities.filter(a=>a.kind==='phase_action').map(a=>a.limit)).toEqual([{type:'per_round',uses:1,scope:'this_card'},{type:'per_round',uses:1,scope:'this_card'}]);});
 it('pays normal cost then discards every own hand card, unions actual attributes only on source',()=>{
  const session=setup();material(session,'a');material(session,'b',1);material(session,'old',1,'p1','discard');material(session,'theirs',1,'p2');
  expect(activate(session).ok).toBe(true);expect(session.state.cards.filter(c=>['a','b'].includes(c.instanceId)).map(c=>c.zone)).toEqual(['discard','discard']);
  expect(getEffectiveCardAttributes(session.state,'treasury')).toEqual(['宝具','力量','魔术']);expect(session.getPlayerView('p2').cards.find(c=>c.instanceId==='treasury')!.attributeOverrides).toEqual(['宝具','力量','魔术']);expect(getEffectiveCardAttributes(session.state,'theirs')).toEqual(['魔术']);expect(session.state.cards.find(c=>c.instanceId==='theirs')!.zone).toBe('hand');
 });
 it('accepts empty hand and preserves printed NP',()=>{const session=setup();expect(activate(session).ok).toBe(true);expect(getEffectiveCardAttributes(session.state,'treasury')).toEqual(['宝具']);});
 it('snapshots effective attributes before discard clears activation-local transforms',()=>{
  const session=setup();material(session,'a');session.state.abilityRuntime!.cardState.a={active:false,faceDown:false,playedRound:1,attributeOverrides:['特殊']};expect(activate(session).ok).toBe(true);expect(getEffectiveCardAttributes(session.state,'treasury')).toEqual(['宝具','特殊']);
 });
 it('quotes (printed3+environment2)*2=10 through state, projection and actual battle',()=>{
  const session=setup();eventBonus(session);expect(session.getPlayerView('p2').players.find(p=>p.id==='p1')!.totalPower).toBe(5);battle(session);expect(activate(session,combat).ok).toBe(true);expect(power(session)).toBe(10);
  // Combat AbilityPlayerView has no total-power quote contract; actual battle reads the shared quote.
  expect(session.getPlayerView('p2').cards.find(c=>c.instanceId==='treasury')).toBeDefined();
  expect(resolveBattlefield(session.state,{battlefieldId:'shinto'}).nextState.battleResults[0]!.participantBreakdowns.find(p=>p.playerId==='p1')!.effectivePower).toBe(10);
 });
 it('limits each same-card phase ability once per round, including reentry and restored state',()=>{
  let session=setup();expect(activate(session).ok).toBe(true);const before=session.getState();expect(activate(session).ok).toBe(false);expect(session.getState()).toEqual(before);
  battle(session);expect(activate(session,combat).ok).toBe(true);session=restoreTrustedAuthoringFixtureSession(session.serializeSession());expect(activate(session,combat).ok).toBe(false);expect(calculateCardPower(session.state,'treasury').value).toBe(6);
 });
 it('rolls back actual discard, overlay and usage when a later effect fails',()=>{const session=setup(true);material(session,'a');const before=session.getState();expect(activate(session).ok).toBe(false);expect(session.getState()).toEqual(before);});
 it('restores acquired attributes and quotes without query side effects',()=>{
  const session=setup();material(session,'a');expect(activate(session).ok).toBe(true);const restored=restoreTrustedAuthoringFixtureSession(session.serializeSession()),before=restored.getState();expect(getEffectiveCardAttributes(restored.state,'treasury')).toEqual(['宝具','力量']);restored.getPlayerView('p1');power(restored);expect(restored.getState()).toEqual(before);
 });
 it('expires overlays at next round and keeps the printed definition immutable',()=>{
  const session=setup();material(session,'a');expect(activate(session).ok).toBe(true);battle(session);expect(activate(session,combat).ok).toBe(true);advanceAbilityPhase(session.state,'round_end',1);advanceAbilityPhase(session.state,'action',2);expect(getEffectiveCardAttributes(session.state,'treasury')).toEqual(['宝具']);expect(session.state.abilityRuntime!.pack.cards[id]!.cardFace.attributes).toEqual(['宝具']);
 });
 it('includes actual event and situation attributes once, leaving other attack and total bonuses unmultiplied',()=>{
  const session=setup();material(session,'a');expect(activate(session).ok).toBe(true);material(session,'other',0,'p1','attack_area');session.state.abilityRuntime!.cardState.other={active:true,faceDown:false,playedRound:1};
  const eventId=session.state.eventDeck!.shift()!;session.state.eventPlacements=[{eventCardId:eventId,locationId:'shinto',visibility:{scope:'public'},battleModifiers:[{sourceId:'test.event',targetTag:'力量',value:2,condition:'has_attribute'}]}] as any;
  session.state.currentSituationModifiers=[{sourceId:'test.situation',targetTag:'力量',value:1,condition:'has_attribute'}];battle(session);expect(activate(session,combat).ok).toBe(true);
  // Source(3+3)*2 + other(1+3); environment applies once to each physical attack.
  expect(power(session)).toBe(16);expect(calculateCardPower(session.state,'other').value).toBe(1);
 });
 it('applies ordinary power doubling after another friendly card adds current attack power',()=>{
  const session=setup();battle(session);expect(activate(session,combat).ok).toBe(true);
  material(session,'other',0,'p1','attack_area');session.state.abilityRuntime!.cardState.other={active:true,faceDown:false,playedRound:1};
  const source=host(session,{id:'friendly-attacks-plus-three',lifecycle:{duration:'this_round'},ruleModifiers:[{operation:'add',rule:'attack.currentPower',value:3,scope:{subject:'controller',object:'attack_card'}}]});
  expect(session.dispatchPlayerAction('p1',{type:'activate_ability',cardInstanceId:source,abilityId:'friendly-attacks-plus-three'}).ok).toBe(true);
  expect(calculateCardPower(session.state,'treasury').value).toBe(12);
  expect(calculateCardPower(session.state,'other').value).toBe(4);
  expect(power(session)).toBe(16);
 });
 it('opponent setting is applied after own multiplier regardless of declaration order',()=>{
  const session=setup();eventBonus(session);session.state.players[1]!.locationId='shinto';battle(session);
  const h=host(session,{id:'set',lifecycle:{duration:'this_round'},ruleModifiers:[{operation:'set',rule:'card.currentPower',value:7,scope:{subject:'opponents_at_same_battlefield',object:'attack_card'}}]},'p2');
  session.state.round.prioritySeat=2;expect(session.dispatchPlayerAction('p2',{type:'activate_ability',cardInstanceId:h,abilityId:'set'}).ok).toBe(true);
  session.state.round.prioritySeat=1;expect(activate(session,combat).ok).toBe(true);expect(power(session)).toBe(7);
 });
 it.each(['amount','scope','binding'])('fails closed on unsigned shape: %s',variant=>{
  const input=structuredClone(treasuryArchive),card=input.cards.find((c:any)=>c.id===id),a=card.abilities.find((a:any)=>a.id===combat),gain=card.abilities.find((a:any)=>a.id===action);
  if(variant==='amount')a.effects[0].modifier.amount=3;if(variant==='scope')a.effects[0].modifier.scope.subject='all_players';if(variant==='binding')gain.effects[0].bind='wrong';expect(loadAuthoringJson(input).report.length).toBeGreaterThan(0);
 });
 it('rejects missing discard binding rather than fabricating empty success',()=>{
  const session=setup(),effect=archive.cards.find((c:any)=>c.id===id).abilities.find((a:any)=>a.id===action).effects[1];expect(()=>resolveEffect(session.state,{controllerId:'p1',sourceCardId:'treasury',abilityId:action,variables:{},selections:{}},effect)).toThrow('discard binding');
 });

 it('does not route lacks-attribute environment through a support placed in attack area',()=>{
  const session=setup();battle(session);const before=power(session),def=session.state.abilityRuntime!.pack.cards['master.ciel.skill.s2']!;
  session.state.cards.push({instanceId:'canonical-support',definitionId:def.id,ownerPlayerId:'p1',controllerPlayerId:'p1',zone:'attack_area',visibility:{scope:'public'}});session.state.abilityRuntime!.cardState['canonical-support']={active:true,faceDown:false,playedRound:1};
  const h=host(session,{id:'own-zero',lifecycle:{duration:'this_round'},ruleModifiers:[{operation:'set',rule:'card.currentPower',value:0,scope:{subject:'controller'}}]});expect(session.dispatchPlayerAction('p1',{type:'activate_ability',cardInstanceId:h,abilityId:'own-zero'}).ok).toBe(true);
  const eventId=session.state.eventDeck!.shift()!;session.state.eventPlacements=[{eventCardId:eventId,locationId:'shinto',visibility:{scope:'public'},battleModifiers:[{sourceId:'support-negative',targetTag:'力量',value:2,condition:'lacks_attribute'}]}] as any;
  // Both genuine attack and supports are set0; environmental +2 on the attack is consumed before own set0.
  // Support contributes zero, never a spurious -2 correction.
  expect(power(session)).toBe(0);expect(before).toBe(3);
 });

 it('does not multiply repeated-attribute or player-total bonuses',()=>{
  const session=setup();material(session,'a');expect(activate(session).ok).toBe(true);material(session,'other',0,'p1','attack_area');session.state.abilityRuntime!.cardState.other={active:true,faceDown:false,playedRound:1};
  session.state.currentSituationModifiers=[{sourceId:'repeated',targetTag:'力量',value:3,condition:'has_repeated_attribute'}];
  battle(session);expect(activate(session,combat).ok).toBe(true);const h=host(session,{id:'total',effects:[{type:'create_modifier',modifier:{type:'power_bonus',operation:'add',aggregate:'total',scope:{subject:'controller'},amount:5,duration:'this_round',sourceMustRemainActive:true}}]});expect(session.dispatchPlayerAction('p1',{type:'activate_ability',cardInstanceId:h,abilityId:'total'}).ok).toBe(true);
  expect(power(session)).toBe(6+1+3+5);
 });
 it('same-round phase reentry never refreshes the multiplier budget',()=>{
  const session=setup();battle(session);expect(activate(session,combat).ok).toBe(true);advanceAbilityPhase(session.state,'battle',1);session.state.round.prioritySeat=1;const before=session.getState();expect(activate(session,combat).ok).toBe(false);expect(session.getState()).toEqual(before);expect(calculateCardPower(session.state,'treasury').value).toBe(6);
 });
 it('does not let another player activate or disclose private hand cards',()=>{
  const session=setup();material(session,'private-material',1,'p2');const before=session.getState();expect(session.dispatchPlayerAction('p2',{type:'activate_ability',cardInstanceId:'treasury',abilityId:action}).ok).toBe(false);expect(session.getState()).toEqual(before);expect(session.getPlayerView('p3').cards.some(c=>c.instanceId==='private-material')).toBe(false);expect(activate(session).ok).toBe(true);expect(getEffectiveCardAttributes(session.state,'treasury')).toEqual(['宝具']);
 });

});
