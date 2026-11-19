import {describe,expect,it} from 'vitest';
import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';
import {advanceAbilityPhase,initializeActionTurns} from '../../src/ability/interpreter';
import {createMatchSession,restoreMatchSession,type MatchSession} from '../../src/match-session';

const rules=contentLibrary.rules;
const role='servant.euryale';
const skill1='servant.euryale.skill.sc-euryale-1';
const skill2='servant.euryale.skill.sc-euryale-2';
const skill3='servant.euryale.skill.sc-euryale-3';
const core='card.x-divine-core';

function productionSession(seed=20260904):MatchSession {
 const session=createMatchSession({seed,humanPlayerIds:Array.from({length:7},(_,i)=>`p${i+1}`)});
 for(let i=0;i<20;i++){
  const window=session.state.abilityRuntime!.responseWindows[0];
  if(!window)break;
  const declined=session.dispatchPlayerAction(window.controllerId,{type:'decline_this_window',windowId:window.id});
  expect(declined.ok,JSON.stringify(declined.rejection)).toBe(true);
 }
 expect(session.state.abilityRuntime!.responseWindows).toEqual([]);
 expect(session.state.abilityRuntime!.pendingDecision).toBeUndefined();
 expect(session.state.abilityRuntime!.hostRequests).toEqual([]);
 session.state.round.startingSeat=1;
 session.state.eventPlacements=[];
 session.state.currentSituationModifiers=[];
 session.state.modeState={...session.state.modeState,masterDirectives:[],cardPlayForbids:[],closedLocations:[],eventBattleRules:[],participationEvents:[],terrainAssignments:{}};
 expect(session.state.abilityRuntime!.pack.contentIdentity).toEqual({packId:contentLibrary.pack.id,version:contentLibrary.pack.version,definitionHash:rules.definitionHash});
 expect(session.state.abilityRuntime!.pack.cards[skill1]).toEqual(rules.cards[skill1]);
 expect(rules.characters[role]!.cardIds).toEqual([skill1,skill3,skill2,core]);
 expect(rules.decks[role]).toHaveLength(12);
 const owner=session.state.players.find(p=>p.servantCardId===role);
 expect(owner).toBeDefined();
 const owned=session.state.cards.filter(c=>c.ownerPlayerId===owner!.id);
 expect(owned.filter(c=>c.zone==='skill'&&[skill1,skill2,skill3].includes(c.definitionId))).toHaveLength(3);
 expect(owned.filter(c=>c.definitionId===core)).toHaveLength(2);
 return session;
}

function player(session:MatchSession,servantId:string){
 const found=session.state.players.find(p=>p.servantCardId===servantId);
 if(!found)throw new Error(`Production constructor did not initialize ${servantId}`);
 return found;
}

function source(session:MatchSession,ownerId:string,definitionId:string){
 const found=session.state.cards.find(c=>c.ownerPlayerId===ownerId&&c.definitionId===definitionId);
 if(!found)throw new Error(`Missing production instance ${ownerId}:${definitionId}`);
 return found;
}

function setAction(session:MatchSession,ownerId:string,round=3){
 advanceAbilityPhase(session.state,'action',round);
 initializeActionTurns(session.state);
 session.state.round.prioritySeat=session.state.players.find(p=>p.id===ownerId)!.seat;
}

function playSkillForAction(session:MatchSession,ownerId:string,cardId:string){
 const sourceCard=source(session,ownerId,cardId);
 const companion=session.state.cards.find(c=>c.ownerPlayerId===ownerId&&c.zone==='hand'&&session.state.abilityRuntime!.pack.cards[c.definitionId]!.cardFace.cost===0)!;
 expect(companion).toBeDefined();
 expect(session.dispatchPlayerAction(ownerId,{type:'skip_normal_move'}).ok).toBe(true);
 for(const cardInstanceId of [sourceCard.instanceId,companion.instanceId]){
  const staged=session.dispatchPlayerAction(ownerId,{type:'stage_attack_card',cardInstanceId,faceDown:false});
  expect(staged.ok,JSON.stringify(staged.rejection)).toBe(true);
 }
 const played=session.dispatchPlayerAction(ownerId,{type:'confirm_staged_attack'});
 expect(played.ok,JSON.stringify(played.rejection)).toBe(true);
 return sourceCard;
}

function startPrelude(session:MatchSession,ownerId:string){
 const source2=source(session,ownerId,skill2);
 const companion=source(session,ownerId,skill1);
 advanceAbilityPhase(session.state,'advance',3);
 session.state.round.prioritySeat=session.state.players.find(p=>p.id!==ownerId)!.seat;
 const activated=session.dispatchPlayerAction(ownerId,{type:'activate_ability',cardInstanceId:source2.instanceId,abilityId:'sc-euryale-2.prelude'});
 expect(activated.ok,JSON.stringify(activated.rejection)).toBe(true);
 expect(session.state.abilityRuntime!.pendingDecision!.candidates).toEqual([companion.instanceId]);
 return {source2,companion,decision:session.state.abilityRuntime!.pendingDecision!};
}

function playPair(session:MatchSession,ownerId:string,instanceIds:string[]){
 expect(instanceIds).toHaveLength(2);
 // The different production roster changes the opening shuffle. Establish the
 // named hand preconditions while keeping the constructor's physical instances.
 for(const instanceId of instanceIds){
  const instance=session.state.cards.find(c=>c.instanceId===instanceId)!;
  expect(instance.ownerPlayerId).toBe(ownerId);
  if(instance.zone==='deck'){
   instance.zone='hand';
   instance.visibility={scope:'owner_only',ownerPlayerId:ownerId};
  }
  expect(['hand','skill']).toContain(instance.zone);
 }
 expect(session.dispatchPlayerAction(ownerId,{type:'skip_normal_move'}).ok).toBe(true);
 for(const cardInstanceId of instanceIds){
  const staged=session.dispatchPlayerAction(ownerId,{type:'stage_attack_card',cardInstanceId,faceDown:false});
  expect(staged.ok,JSON.stringify(staged.rejection)).toBe(true);
 }
 const played=session.dispatchPlayerAction(ownerId,{type:'confirm_staged_attack'});
 expect(played.ok,JSON.stringify(played.rejection)).toBe(true);
}

function playFirstLegalHandPair(session:MatchSession,ownerId:string){
 expect(session.dispatchPlayerAction(ownerId,{type:'skip_normal_move'}).ok).toBe(true);
 const handIds=new Set(session.state.cards.filter(c=>c.ownerPlayerId===ownerId&&c.zone==='hand').map(c=>c.instanceId));
 const pair=session.getPlayerView(ownerId).legalActions.filter(a=>a.type==='stage_attack_card'&&!a.faceDown&&handIds.has(a.cardInstanceId)).slice(0,2);
 expect(pair).toHaveLength(2);
 for(const action of pair){
  const staged=session.dispatchPlayerAction(ownerId,action);
  expect(staged.ok,JSON.stringify(staged.rejection)).toBe(true);
 }
 const played=session.dispatchPlayerAction(ownerId,{type:'confirm_staged_attack'});
 expect(played.ok,JSON.stringify(played.rejection)).toBe(true);
}

function completeActionTurns(session:MatchSession,plannedPairs:Map<string,string[]>,alreadyComplete:string[]=[]){
 const completed=new Set(alreadyComplete);
 for(let guard=0;guard<14&&session.state.round.activePhase==='action';guard++){
  const actorId=session.projectToClientState().priorityPlayerId;
  expect(actorId).toBeDefined();
  if(!completed.has(actorId!)){
   const pair=plannedPairs.get(actorId!);
   if(pair)playPair(session,actorId!,pair);
   else playFirstLegalHandPair(session,actorId!);
   completed.add(actorId!);
  }
  const passed=session.passPriority(actorId!);
  expect(passed.ok,JSON.stringify(passed.rejection)).toBe(true);
 }
 expect(session.state.round.activePhase).toBe('battle');
 expect(completed).toHaveLength(session.state.players.length);
}

function resolveBattleAndDeclineResponses(session:MatchSession){
 for(let guard=0;guard<session.state.players.length&&session.state.round.activePhase==='battle';guard++){
  const actorId=session.projectToClientState().priorityPlayerId;
  expect(actorId).toBeDefined();
  const passed=session.passPriority(actorId!);
  expect(passed.ok,JSON.stringify(passed.rejection)).toBe(true);
 }
 for(let i=0;i<20&&session.state.abilityRuntime!.responseWindows.length;i++){
  const window=session.state.abilityRuntime!.responseWindows[0]!;
  const decline=session.getPlayerView(window.controllerId).legalActions.find(a=>a.type==='decline_this_window');
  expect(decline).toBeDefined();
  expect(session.dispatchPlayerAction(window.controllerId,decline!).ok).toBe(true);
 }
 expect(session.state.abilityRuntime!.responseWindows).toEqual([]);
 expect(session.runUntilHumanInputOrRoundEnd()).toBe('round_end');
}

describe('Euryale against the exact generated production library and normal MatchSession constructor',()=>{
 it('initializes the complete role, all three skills, two Divine Cores and its twelve-card deck',()=>{
  const session=productionSession();
  const euryale=player(session,role);
  expect(session.state.cards.filter(c=>c.ownerPlayerId===euryale.id&&c.zone==='skill'&&[skill1,skill2,skill3].includes(c.definitionId)).map(c=>c.definitionId).sort()).toEqual([skill1,skill2,skill3].sort());
  expect(session.state.cards.filter(c=>c.ownerPlayerId===euryale.id&&c.definitionId===core)).toHaveLength(2);
  const runtimeDeck=session.state.cards.filter(c=>c.ownerPlayerId===euryale.id&&['hand','deck'].includes(c.zone)&&![skill1,skill2,skill3].includes(c.definitionId)).map(c=>c.definitionId).sort();
  expect(runtimeDeck).toEqual([...rules.decks[role]!].sort());
 });

 it('settles Independent Action in first-half priority and atomically refuses it in second-half priority',()=>{
  const early=productionSession(20260904),earlyOwner=player(early,role),earlySource=source(early,earlyOwner.id,skill1);
  early.state.round.startingSeat=earlyOwner.seat;
  for(const p of early.state.players)p.mana=20;
  earlyOwner.vp=0;setAction(early,earlyOwner.id);playSkillForAction(early,earlyOwner.id,skill1);
  const granted=early.dispatchPlayerAction(earlyOwner.id,{type:'activate_ability',cardInstanceId:earlySource.instanceId,abilityId:'servant.euryale.skill.sc-euryale-1.gain-vp'});
  expect(granted.ok,JSON.stringify(granted.rejection)).toBe(true);
  expect(player(early,role).vp).toBe(3);

  const late=productionSession(20260904),lateOwner=player(late,role),lateSource=source(late,lateOwner.id,skill1);
  late.state.round.startingSeat=lateOwner.seat%late.state.players.length+1;
  for(const p of late.state.players)p.mana=20;
  lateOwner.vp=0;setAction(late,lateOwner.id);expect(late.dispatchPlayerAction(lateOwner.id,{type:'skip_normal_move'}).ok).toBe(true);
  const before=late.getState();
  expect(late.dispatchPlayerAction(lateOwner.id,{type:'stage_attack_card',cardInstanceId:lateSource.instanceId,faceDown:false}).ok).toBe(false);
  expect(late.getState()).toEqual(before);
 });

 it('applies the unpreventable five-VP loss once from a real production battle result',()=>{
  const session=productionSession(),owner=player(session,role),challenger=player(session,'servant.achilles');
  for(const p of session.state.players){p.mana=20;p.vp=0;p.locationId='miyama_town';}
  owner.locationId=challenger.locationId='shinto';owner.vp=20;
  session.state.round.startingSeat=owner.seat;
  setAction(session,owner.id);
  const sourceCard=source(session,owner.id,skill1);
  const ownerCompanion=source(session,owner.id,'basic.magecraft.2');
  const challengerCards=['basic.agility.5','basic.agility.4'].map(id=>source(session,challenger.id,id));
  playPair(session,owner.id,[sourceCard.instanceId,ownerCompanion.instanceId]);
  expect(session.state.abilityRuntime!.cardState[sourceCard.instanceId]!.playedRound).toBe(3);
  const gain=session.dispatchPlayerAction(owner.id,{type:'activate_ability',cardInstanceId:sourceCard.instanceId,abilityId:'servant.euryale.skill.sc-euryale-1.gain-vp'});
  expect(gain.ok,JSON.stringify(gain.rejection)).toBe(true);
  expect(player(session,role).vp).toBe(23);

  // The production constructor gives Achilles two legal basic attacks totaling more base power.
  expect(rules.cards[challengerCards[0]!.definitionId]!.cardFace.basePower).toBe(5);
  expect(rules.cards[challengerCards[1]!.definitionId]!.cardFace.basePower).toBe(4);
  const planned=new Map([[challenger.id,challengerCards.map(c=>c.instanceId)]]);
  completeActionTurns(session,planned,[owner.id]);
  session.state.abilityRuntime!.preventEffects=true;
  resolveBattleAndDeclineResponses(session);
  const battle=session.battleHistory.find(b=>b.battlefieldId==='shinto');
  expect(battle).toBeDefined();
  expect(battle!.winnerPlayerIds).toContain(challenger.id);
  expect(battle!.winnerPlayerIds).not.toContain(owner.id);
  expect(player(session,role).vp).toBe(18);
 });

 it('does not apply the battle-loss penalty when the production skill was not played',()=>{
  const session=productionSession(),owner=player(session,role),challenger=player(session,'servant.achilles');
  for(const p of session.state.players){p.mana=20;p.vp=0;p.locationId='miyama_town';}
  owner.locationId=challenger.locationId='shinto';owner.vp=20;
  session.state.round.startingSeat=owner.seat;
  const skill=source(session,owner.id,skill1);
  const lowCards=['basic.magecraft.2','basic.strength.2'].map(id=>source(session,owner.id,id));
  const highCards=['basic.agility.5','basic.agility.4'].map(id=>source(session,challenger.id,id));
  setAction(session,owner.id);
  completeActionTurns(session,new Map([[owner.id,lowCards.map(c=>c.instanceId)],[challenger.id,highCards.map(c=>c.instanceId)]]));
  expect(session.state.abilityRuntime!.cardState[skill.instanceId]?.playedRound).not.toBe(3);
  resolveBattleAndDeclineResponses(session);
  const battle=session.battleHistory.find(b=>b.battlefieldId==='shinto');
  expect(battle).toBeDefined();expect(battle!.winnerPlayerIds).toContain(challenger.id);expect(battle!.winnerPlayerIds).not.toContain(owner.id);
  expect(player(session,role).vp).toBe(20);
 });

 it('restores the advance-phase choice, waives only priority, charges the real group cost and settles the converted action-end ability once',()=>{
  const session=productionSession(),owner=player(session,role),ownerId=owner.id;
  for(const p of session.state.players){p.mana=20;p.vp=0;p.locationId='shinto';}
  const {source2,companion,decision}=startPrelude(session,ownerId);
  expect(session.getPlayerView(ownerId).pendingDecision!.playBudget?.costs[companion.instanceId]).toBe(4);
  const snapshot=session.serializeSession();
  const stale=restoreMatchSession(JSON.parse(JSON.stringify(snapshot)));
  stale.state.cards.find(c=>c.instanceId===companion.instanceId)!.zone='discard';
  const staleBefore=stale.getState();
  expect(stale.dispatchPlayerAction(ownerId,{type:'choose_target',decisionId:decision.id,selectedIds:[companion.instanceId]}).ok).toBe(false);
  expect(stale.getState()).toEqual(staleBefore);

  const restored=restoreMatchSession(JSON.parse(JSON.stringify(snapshot))),other=restored.state.players.find(p=>p.id!==ownerId)!.id;
  const pendingBefore=restored.getState();
  expect(restored.dispatchPlayerAction(other,{type:'choose_target',decisionId:decision.id,selectedIds:[companion.instanceId]}).ok).toBe(false);
  expect(restored.getState()).toEqual(pendingBefore);
  const selected=restored.dispatchPlayerAction(ownerId,{type:'choose_target',decisionId:decision.id,selectedIds:[companion.instanceId]});
  expect(selected.ok,JSON.stringify(selected.rejection)).toBe(true);
  expect(player(restored,role).mana).toBe(16);
  expect(restored.state.abilityRuntime!.cardState[source2.instanceId]!.paidManaOnPlay).toBe(4);
  expect(restored.state.cards.find(c=>c.instanceId===source2.instanceId)!.zone).toBe('attack_area');
  expect(restored.state.cards.find(c=>c.instanceId===companion.instanceId)!.zone).toBe('attack_area');

  setAction(restored,ownerId);
  expect(restored.dispatchPlayerAction(ownerId,{type:'skip_normal_move'}).ok).toBe(true);
  const siren=source(restored,ownerId,skill3),printedCost=rules.cards[skill3]!.cardFace.cost;
  const regularCompanion=restored.state.cards.find(c=>c.ownerPlayerId===ownerId&&c.zone==='hand'&&restored.state.abilityRuntime!.pack.cards[c.definitionId]!.cardFace.cost===0)!;
  expect(regularCompanion).toBeDefined();
  const manaBefore=player(restored,role).mana;
  for(const cardInstanceId of [siren.instanceId,regularCompanion.instanceId]){
   const stage=restored.dispatchPlayerAction(ownerId,{type:'stage_attack_card',cardInstanceId,faceDown:false});
   expect(stage.ok,JSON.stringify(stage.rejection)).toBe(true);
  }
  const confirmed=restored.dispatchPlayerAction(ownerId,{type:'confirm_staged_attack'});
  expect(confirmed.ok,JSON.stringify(confirmed.rejection)).toBe(true);
  expect(restored.state.abilityRuntime!.cardState[siren.instanceId]!.paidManaOnPlay).toBe(Math.max(0,Number(printedCost)-1));
  expect(player(restored,role).mana).toBe(manaBefore-Math.max(0,Number(printedCost)-1));

  const converted=restored.getPlayerView(ownerId).legalActions.find(a=>a.type==='activate_ability'&&a.cardInstanceId===companion.instanceId&&a.abilityId.startsWith('phase-replacement:'));
  expect(converted).toBeDefined();
  const vpBefore=player(restored,role).vp;
  const scheduled=restored.dispatchPlayerAction(ownerId,{type:'activate_ability',cardInstanceId:companion.instanceId,abilityId:converted!.abilityId});
  expect(scheduled.ok,JSON.stringify(scheduled.rejection)).toBe(true);
  expect(player(restored,role).vp).toBe(vpBefore);
  expect(restored.state.abilityRuntime!.pendingPlayerActionEnds).toHaveLength(1);
  const resumed=restoreMatchSession(JSON.parse(JSON.stringify(restored.serializeSession())));
  expect(resumed.passPriority(ownerId).ok).toBe(true);
  expect(player(resumed,role).vp).toBe(vpBefore+7);
  expect(resumed.state.cards.find(c=>c.instanceId===companion.instanceId)!.zone).toBe('removed_from_game');
  expect(resumed.state.cards.find(c=>c.instanceId===source2.instanceId)!.zone).toBe('attack_area');
  expect(resumed.state.abilityRuntime!.pendingPlayerActionEnds).toEqual([]);
 });

 it.each([['same-location',true,5],['different-location',false,6]] as const)('applies Lure of Siren cost reduction to a co-located skill only (%s)',(_,sameLocation,expectedCost)=>{
  const session=productionSession(),owner=player(session,role),target=player(session,'servant.achilles');
  for(const p of session.state.players){p.mana=20;p.locationId='miyama_town';}
  owner.locationId='shinto';target.locationId=sameLocation?'shinto':'miyama_town';
  const {source2,companion,decision}=startPrelude(session,owner.id);
  expect(session.dispatchPlayerAction(owner.id,{type:'choose_target',decisionId:decision.id,selectedIds:[companion.instanceId]}).ok).toBe(true);
  expect(session.state.cards.find(c=>c.instanceId===source2.instanceId)!.zone).toBe('attack_area');
  setAction(session,owner.id);
  session.state.round.prioritySeat=target.seat;
  expect(session.dispatchPlayerAction(target.id,{type:'skip_normal_move'}).ok).toBe(true);
  const challenger=session.state.cards.find(c=>c.ownerPlayerId===target.id&&c.zone==='skill'&&session.state.abilityRuntime!.pack.cards[c.definitionId]!.cardType==='servant_skill'&&Number(session.state.abilityRuntime!.pack.cards[c.definitionId]!.cardFace.cost)===6)!;
  expect(challenger).toBeDefined();
  const freeAttack=session.state.cards.find(c=>c.ownerPlayerId===target.id&&c.zone==='hand'&&session.state.abilityRuntime!.pack.cards[c.definitionId]!.cardFace.cost===0)!;
  expect(freeAttack).toBeDefined();
  for(const cardInstanceId of [challenger.instanceId,freeAttack.instanceId]){
   const staged=session.dispatchPlayerAction(target.id,{type:'stage_attack_card',cardInstanceId,faceDown:false});
   expect(staged.ok,JSON.stringify(staged.rejection)).toBe(true);
  }
  const confirmed=session.dispatchPlayerAction(target.id,{type:'confirm_staged_attack'});
  expect(confirmed.ok,JSON.stringify(confirmed.rejection)).toBe(true);
  expect(session.state.abilityRuntime!.cardState[challenger.instanceId]!.paidManaOnPlay).toBe(expectedCost);
 });
});
