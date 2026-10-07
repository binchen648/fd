import type { GameState } from '../schema/game';
import { canOccupyLocation, getEnabledLocations } from '../core/map-engine';
import type { AbilityEvent, AuthoringAbility, EffectContext, MultiPresenceState, RuleNode } from './types';
import { effectiveInjuryWarpMovementLinks } from './injury-warp-capability';

export const MULTI_PRESENCE_RECORD_LOSS_EFFECT = 'multi_presence_record_battle_loss' as const;
export const MULTI_PRESENCE_DEPLOY_EFFECT = 'multi_presence_deploy' as const;
export const MULTI_PRESENCE_MIRROR_MOVE_EFFECT = 'multi_presence_mirror_move' as const;
export const MULTI_PRESENCE_POST_PLAY_MANA_LOSS_EFFECT = 'multi_presence_post_play_mana_loss' as const;
export const MULTI_PRESENCE_SHARED_PLAYER_EFFECT = 'multi_presence_shared_player_rule' as const;
export const MULTI_PRESENCE_SHARE_TERRAIN_EFFECT = 'multi_presence_share_terrain' as const;
export const MULTI_PRESENCE_SACRIFICE_DEFEAT_EFFECT = 'multi_presence_sacrifice_defeat' as const;

const privileged = new Set<string>([
  MULTI_PRESENCE_RECORD_LOSS_EFFECT, MULTI_PRESENCE_DEPLOY_EFFECT, MULTI_PRESENCE_MIRROR_MOVE_EFFECT,
  MULTI_PRESENCE_POST_PLAY_MANA_LOSS_EFFECT, MULTI_PRESENCE_SHARED_PLAYER_EFFECT, MULTI_PRESENCE_SHARE_TERRAIN_EFFECT,
  MULTI_PRESENCE_SACRIFICE_DEFEAT_EFFECT,
]);

function rec(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): boolean { if (!rec(value)) return false; const actual=Object.keys(value); return actual.length===keys.length&&actual.every((key)=>keys.includes(key)); }
function key(value: unknown): value is string { return typeof value==='string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value); }
function empty(value: unknown): boolean { return rec(value) && Object.keys(value).length===0; }
function standardResponse(a: AuthoringAbility): boolean {
  const keys=Object.keys(a.responseWindow); return keys.every((entry)=>['order','passBehavior'].includes(entry)) &&
    (a.responseWindow.order===undefined||a.responseWindow.order==='turn_order') &&
    (a.responseWindow.passBehavior===undefined||a.responseWindow.passBehavior==='decline_this_window');
}
function common(a: AuthoringAbility): boolean {
  return a.conditions.length===0&&a.cost.length===0&&a.creates.length===0&&a.ruleModifiers.length===0&&
    empty(a.lifecycle)&&empty(a.limit)&&empty(a.visibility)&&standardResponse(a)&&
    a.execution.mode==='automatic'&&Array.isArray(a.execution.allowedOperations)&&a.execution.allowedOperations.length===0;
}
function effectKey(effect: RuleNode): string | undefined { return key(effect.presenceKey) ? String(effect.presenceKey) : undefined; }
function marker(effect: RuleNode, type: string): boolean { return effect.type===type&&key(effect.presenceKey)&&exact(effect,['type','presenceKey']); }
function deployEffect(effect: RuleNode): boolean {
  return effect.type===MULTI_PRESENCE_DEPLOY_EFFECT&&key(effect.presenceKey)&&typeof effect.target==='string'&&effect.target.length>0&&
    exact(effect,['type','presenceKey','target']);
}
function postPlayEffect(effect: RuleNode): boolean {
  return effect.type===MULTI_PRESENCE_POST_PLAY_MANA_LOSS_EFFECT&&key(effect.presenceKey)&&effect.numerator===1&&effect.denominator===2&&effect.rounding==='ceil'&&
    exact(effect,['type','presenceKey','numerator','denominator','rounding']);
}
function deployTarget(a: AuthoringAbility): boolean {
  if(a.targets.length!==1)return false; const target=a.targets[0]!; const count=rec(target.count)?target.count:{}; const constraints=Array.isArray(target.constraints)?target.constraints:[];
  return typeof target.id==='string'&&target.id===a.effects[0]?.target&&target.type==='location'&&count.min===1&&count.max===1&&
    constraints.length===1&&rec(constraints[0])&&constraints[0]!.type==='any_battlefield';
}
export function isAcceptedMultiPresenceAbility(a: AuthoringAbility): boolean {
  if(!common(a)||a.effects.length!==1)return false; const effect=a.effects[0]!;
  if(marker(effect,MULTI_PRESENCE_RECORD_LOSS_EFFECT)) return a.kind==='forced_trigger'&&exact(a.activation,['trigger'])&&a.activation.trigger==='after_controller_loses_battle'&&a.targets.length===0;
  if(deployEffect(effect)) return a.kind==='phase_action'&&exact(a.activation,['phase','opens'])&&a.activation.phase==='preparation'&&a.activation.opens==='controller_action_window'&&deployTarget(a);
  if(marker(effect,MULTI_PRESENCE_MIRROR_MOVE_EFFECT)) return a.kind==='forced_trigger'&&exact(a.activation,['trigger'])&&a.activation.trigger==='after_controller_enters_location'&&a.targets.length===0;
  if(postPlayEffect(effect)) return a.kind==='forced_trigger'&&exact(a.activation,['trigger'])&&a.activation.trigger==='after_card_batch_played'&&a.targets.length===0;
  if(marker(effect,MULTI_PRESENCE_SHARED_PLAYER_EFFECT)||marker(effect,MULTI_PRESENCE_SHARE_TERRAIN_EFFECT)) return a.kind==='passive'&&empty(a.activation)&&a.targets.length===0;
  if(marker(effect,MULTI_PRESENCE_SACRIFICE_DEFEAT_EFFECT)) return a.kind==='phase_action'&&exact(a.activation,['phase','opens'])&&a.activation.phase==='action'&&a.activation.opens==='controller_action_window'&&a.targets.length===0;
  return false;
}
export function containsMultiPresencePrivilegedNode(value: unknown): boolean {
  if(Array.isArray(value))return value.some(containsMultiPresencePrivilegedNode); if(!rec(value))return false;
  if(typeof value.type==='string'&&privileged.has(value.type))return true; return Object.values(value).some(containsMultiPresencePrivilegedNode);
}
function runtime(state: GameState){ if(!state.abilityRuntime)throw new Error('MULTI_PRESENCE_RUNTIME_REQUIRED'); return state.abilityRuntime; }
function cardDef(state: GameState, instanceId: string) { const card=state.cards.find((entry)=>entry.instanceId===instanceId); return card ? runtime(state).pack.cards[card.definitionId] : undefined; }
function abilityAt(state: GameState, instanceId: string, abilityId: string): AuthoringAbility|undefined { return cardDef(state,instanceId)?.abilities.find((entry)=>entry.id===abilityId); }
function sourceValid(state: GameState, playerId: string, sourceCardId: string, abilityId: string): AuthoringAbility|undefined {
  const physical=state.cards.find((entry)=>entry.instanceId===sourceCardId); const ability=abilityAt(state,sourceCardId,abilityId);
  if(!physical||physical.ownerPlayerId!==playerId||physical.controllerPlayerId!==playerId||physical.zone!=='skill'||!ability||!isAcceptedMultiPresenceAbility(ability))return undefined;
  return ability;
}
function providers(state: GameState, playerId: string, presenceKey: string, type: string): Array<{sourceCardId:string; ability:AuthoringAbility}> {
  const found:Array<{sourceCardId:string;ability:AuthoringAbility}>=[];
  for(const physical of state.cards){ if(physical.ownerPlayerId!==playerId||physical.controllerPlayerId!==playerId||physical.zone!=='skill')continue;
    const def=runtime(state).pack.cards[physical.definitionId]; if(!def)continue;
    for(const ability of def.abilities){ if(!isAcceptedMultiPresenceAbility(ability))continue; const effect=ability.effects[0]!; if(effect.type===type&&effectKey(effect)===presenceKey)found.push({sourceCardId:physical.instanceId,ability}); }
  }
  return found;
}
function uniqueProvider(state: GameState, playerId: string, presenceKey: string, type: string){ const found=providers(state,playerId,presenceKey,type); return found.length===1?found[0]:undefined; }
function enabledLocation(state: GameState, locationId: string){ return getEnabledLocations(state.map,state.locationConfig).find((entry)=>entry.id===locationId); }
function isBattlefield(state: GameState, locationId: string): boolean { const loc=enabledLocation(state,locationId); return !!loc&&(loc.tags.includes('battlefield')||loc.rewardHooks.includes('battle_rewards')); }
function primaryTerrainSlot(state: GameState, playerId: string, locationId: string): number|undefined {
  const mode=(state as unknown as {modeState?:{terrainAssignments?:Record<string,string[]>;terrainAssignmentSlots?:Record<string,Record<string,number>>}}).modeState;
  const explicit=mode?.terrainAssignmentSlots?.[locationId]?.[playerId]; if(Number.isSafeInteger(explicit)&&Number(explicit)>=0)return Number(explicit);
  const assigned=mode?.terrainAssignments?.[locationId]; const index=Array.isArray(assigned)?assigned.indexOf(playerId):-1; return index>=0?index:undefined;
}
function deploymentTerrainAdvantage(state: GameState, locationId: string): number {
  const loc=enabledLocation(state,locationId); if(!loc?.terrainBonuses?.length)return 0;
  const used=new Set<number>(); const mode=(state as unknown as {modeState?:{terrainAssignments?:Record<string,string[]>;terrainAssignmentSlots?:Record<string,Record<string,number>>}}).modeState;
  for(const playerId of mode?.terrainAssignments?.[locationId]??[]){ const slot=primaryTerrainSlot(state,playerId,locationId); if(slot!==undefined)used.add(slot); }
  for(const presence of runtime(state).extraPlayerPresences??[]){ if(presence.deployedAtLocationId!==locationId)continue; const idx=loc.terrainBonuses.findIndex((value,index)=>!used.has(index)&&value===presence.terrainAdvantage); if(idx>=0)used.add(idx); }
  const slot=loc.terrainBonuses.findIndex((_,index)=>!used.has(index)); return slot>=0?Number(loc.terrainBonuses[slot]??0):0;
}
export function listExtraPlayerPresences(state: GameState): MultiPresenceState[] { return (state.abilityRuntime?.extraPlayerPresences??[]).map((entry)=>({...entry})); }
export function getPlayerExtraPresences(state: GameState, playerId: string): MultiPresenceState[] { return listExtraPlayerPresences(state).filter((entry)=>entry.playerId===playerId); }
function liveMultiPresenceFor(state: GameState, playerId: string, presenceKey: string): MultiPresenceState|undefined { return (runtime(state).extraPlayerPresences??[]).find((entry)=>entry.playerId===playerId&&entry.presenceKey===presenceKey); }
export function multiPresenceFor(state: GameState, playerId: string, presenceKey: string): MultiPresenceState|undefined { const found=liveMultiPresenceFor(state,playerId,presenceKey); return found?{...found}:undefined; }
export function multiPresenceSharedPlayerEnabled(state: GameState, playerId: string, presenceKey: string): boolean { return providers(state,playerId,presenceKey,MULTI_PRESENCE_SHARED_PLAYER_EFFECT).length===1; }
export function multiPresenceShareTerrainEnabled(state: GameState, playerId: string, presenceKey: string): boolean { return providers(state,playerId,presenceKey,MULTI_PRESENCE_SHARE_TERRAIN_EFFECT).length===1; }
export function getPlayerPresenceLocationIds(state: GameState, playerId: string): string[] {
  const player=state.players.find((entry)=>entry.id===playerId&&entry.status==='active'); if(!player)return[]; const out=new Set<string>(); if(player.locationId)out.add(player.locationId);
  for(const presence of getPlayerExtraPresences(state,playerId)){ if(multiPresenceSharedPlayerEnabled(state,playerId,presence.presenceKey))out.add(presence.locationId); }
  return [...out];
}
export function getPlayerIdsPresentAtLocation(state: GameState, locationId: string): string[] {
  return state.players.filter((entry)=>entry.status==='active'&&getPlayerPresenceLocationIds(state,entry.id).includes(locationId)).map((entry)=>entry.id);
}
export function isPlayerPresentAtLocation(state: GameState, playerId: string, locationId: string): boolean { return getPlayerPresenceLocationIds(state,playerId).includes(locationId); }
export function multiPresenceResolutionLocationOptions(state: GameState, playerId: string, presenceKey: string): string[] {
  if(!multiPresenceSharedPlayerEnabled(state,playerId,presenceKey))return state.players.find((entry)=>entry.id===playerId)?.locationId?[state.players.find((entry)=>entry.id===playerId)!.locationId!]:[];
  return getPlayerPresenceLocationIds(state,playerId);
}
export function isMultiPresenceLocationBattleAbility(ability: AuthoringAbility): boolean {
  return /交战|地点|战斗|战场/.test(ability.printedClause);
}
export function multiPresenceLocationContextAuthority(state: GameState, playerId: string): { presenceKey: string; locationIds: string[] }|undefined {
  const live=getPlayerExtraPresences(state,playerId).filter((entry)=>multiPresenceSharedPlayerEnabled(state,playerId,entry.presenceKey));
  const keys=[...new Set(live.map((entry)=>entry.presenceKey))]; if(keys.length!==1)return undefined;
  const presenceKey=keys[0]!; const locationIds=multiPresenceResolutionLocationOptions(state,playerId,presenceKey);
  return locationIds.length>1?{presenceKey,locationIds}:undefined;
}
function primaryTerrainAdvantage(state: GameState, playerId: string, locationId: string): number { const slot=primaryTerrainSlot(state,playerId,locationId); const loc=enabledLocation(state,locationId); return slot===undefined?0:Number(loc?.terrainBonuses?.[slot]??0); }
export function multiPresenceTerrainAdvantageAtLocation(state: GameState, playerId: string, locationId: string): number {
  const player=state.players.find((entry)=>entry.id===playerId); if(!player)return 0;
  const own=player.locationId===locationId?primaryTerrainAdvantage(state,playerId,locationId):getPlayerExtraPresences(state,playerId).filter((entry)=>entry.locationId===locationId).reduce((sum,entry)=>sum+Math.max(0,entry.terrainAdvantage),0);
  const share=getPlayerExtraPresences(state,playerId).some((entry)=>multiPresenceShareTerrainEnabled(state,playerId,entry.presenceKey));
  if(!share)return own;
  let total=player.locationId?primaryTerrainAdvantage(state,playerId,player.locationId):0; for(const entry of getPlayerExtraPresences(state,playerId))total+=Math.max(0,entry.terrainAdvantage); return total;
}
function presenceEngaged(state: GameState, presence: MultiPresenceState): boolean { return isBattlefield(state,presence.locationId)&&getPlayerIdsPresentAtLocation(state,presence.locationId).some((id)=>id!==presence.playerId); }
function shortestDirected(state: GameState, from: string, to: string): string[]|undefined {
  if(from===to)return[from]; const queue:[[string,string[]]]|Array<[string,string[]]>= [[from,[from]]]; const seen=new Set([from]);
  while(queue.length){ const [current,path]=queue.shift()!; const loc=enabledLocation(state,current); for(const next of effectiveInjuryWarpMovementLinks(state,current,loc?.movementLinks??[])){ if(seen.has(next))continue; const n=[...path,next]; if(next===to)return n; seen.add(next); queue.push([next,n]); } } return undefined;
}
function mirroredTarget(state: GameState, current: string, from: string, to: string): string|undefined {
  const forward=shortestDirected(state,from,to); if(forward){ let target=current; for(let i=1;i<forward.length;i+=1){ const loc=enabledLocation(state,target); const links=effectiveInjuryWarpMovementLinks(state,target,loc?.movementLinks??[]); if(links.length!==1)return undefined; target=links[0]!; } return target; }
  const backward=shortestDirected(state,to,from); if(!backward)return undefined; let target=current; for(let i=1;i<backward.length;i+=1){ const predecessors=getEnabledLocations(state.map,state.locationConfig).filter((loc)=>effectiveInjuryWarpMovementLinks(state,loc.id,loc.movementLinks).includes(target as NonNullable<GameState['players'][number]['locationId']>)); if(predecessors.length!==1)return undefined; target=predecessors[0]!.id; } return target;
}
function canPresenceOccupy(state: GameState, playerId: string, locationId: string): boolean { const occupying=getPlayerIdsPresentAtLocation(state,locationId).filter((id)=>id!==playerId); return canOccupyLocation({map:state.map,config:state.locationConfig,locationId: locationId as NonNullable<GameState['players'][number]['locationId']>,movingPlayerId:playerId,occupyingPlayerIds:occupying,...(state.ruleOverrides?{ruleOverrides:state.ruleOverrides}:{})}); }
function primaryPresenceEngaged(state: GameState, playerId: string): boolean { const primary=state.players.find((entry)=>entry.id===playerId&&entry.status==='active'); return !!primary?.locationId&&isBattlefield(state,primary.locationId)&&getPlayerIdsPresentAtLocation(state,primary.locationId).some((id)=>id!==playerId); }
export function moveMultiPresenceExtraPresence(state: GameState, playerId: string, presenceKey: string, toLocationId: string): { fromLocationId:string; toLocationId:string; mirroredPrimary:boolean }|undefined {
  const presence=liveMultiPresenceFor(state,playerId,presenceKey); const primary=state.players.find((entry)=>entry.id===playerId&&entry.status==='active');
  if(!presence||!primary?.locationId||!multiPresenceSharedPlayerEnabled(state,playerId,presenceKey)||presence.locationId===toLocationId||!enabledLocation(state,toLocationId)||!canPresenceOccupy(state,playerId,toLocationId))return undefined;
  const fromLocationId=presence.locationId; presence.locationId=toLocationId; presence.updatedRevision=runtime(state).revision;
  let mirroredPrimary=false;
  if(!primaryPresenceEngaged(state,playerId)){ const mirror=mirroredTarget(state,primary.locationId,fromLocationId,toLocationId); if(mirror&&mirror!==primary.locationId&&enabledLocation(state,mirror)&&canPresenceOccupy(state,playerId,mirror)){ primary.locationId=mirror as NonNullable<GameState['players'][number]['locationId']>; mirroredPrimary=true; } }
  runtime(state).events.push({type:'extra_player_presence_moved',playerId,sourceCardId:presence.sourceCardId,abilityId:presence.sourceAbilityId});
  return {fromLocationId,toLocationId,mirroredPrimary};
}
function removePresence(state: GameState, playerId: string, presenceKey: string): MultiPresenceState|undefined { const r=runtime(state); const found=(r.extraPlayerPresences??[]).find((entry)=>entry.playerId===playerId&&entry.presenceKey===presenceKey); if(!found)return undefined; r.extraPlayerPresences=(r.extraPlayerPresences??[]).filter((entry)=>entry!==found); return found; }
export function multiPresenceSacrificeTargets(state: GameState, playerId: string, presenceKey: string): {locationId:string;targetPlayerIds:string[]}|undefined { const removed=removePresence(state,playerId,presenceKey); if(!removed)return undefined; return {locationId:removed.locationId,targetPlayerIds:getPlayerIdsPresentAtLocation(state,removed.locationId)}; }

export function canExecuteMultiPresenceEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if(!isAcceptedMultiPresenceAbility(ability))return false; const effect=ability.effects[0]!; const presenceKey=effectKey(effect); if(!presenceKey||!sourceValid(state,ctx.controllerId,ctx.sourceCardId,ctx.abilityId))return false;
  const event=ctx.event;
  if(effect.type===MULTI_PRESENCE_RECORD_LOSS_EFFECT)return event?.type==='after_controller_loses_battle'&&event.playerId===ctx.controllerId&&event.battleResult?.loserIds.includes(ctx.controllerId)===true;
  if(effect.type===MULTI_PRESENCE_DEPLOY_EFFECT){ const last=runtime(state).multiPresenceLastBattleLossRoundByPlayer?.[ctx.controllerId]?.[presenceKey]; return multiPresenceSharedPlayerEnabled(state,ctx.controllerId,presenceKey)&&!multiPresenceFor(state,ctx.controllerId,presenceKey)&&last!==state.round.roundNumber-1&&getEnabledLocations(state.map,state.locationConfig).some((loc)=>isBattlefield(state,loc.id)); }
  if(effect.type===MULTI_PRESENCE_MIRROR_MOVE_EFFECT)return !!multiPresenceFor(state,ctx.controllerId,presenceKey)&&event?.type==='after_controller_enters_location'&&event.playerId===ctx.controllerId&&typeof event.previousLocationId==='string'&&typeof event.locationId==='string';
  if(effect.type===MULTI_PRESENCE_POST_PLAY_MANA_LOSS_EFFECT)return event?.type==='after_card_batch_played'&&event.playerId===ctx.controllerId&&Array.isArray(event.playedCards)&&event.playedCards.length>0;
  if(effect.type===MULTI_PRESENCE_SHARED_PLAYER_EFFECT||effect.type===MULTI_PRESENCE_SHARE_TERRAIN_EFFECT)return true;
  if(effect.type===MULTI_PRESENCE_SACRIFICE_DEFEAT_EFFECT)return !!multiPresenceFor(state,ctx.controllerId,presenceKey);
  return false;
}
export function resolveMultiPresenceEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if(!canExecuteMultiPresenceEffect(state,ctx,ability))return false; const effect=ability.effects[0]!; const presenceKey=effectKey(effect)!; const r=runtime(state); const event=ctx.event;
  if(effect.type===MULTI_PRESENCE_RECORD_LOSS_EFFECT){ (r.multiPresenceLastBattleLossRoundByPlayer??={})[ctx.controllerId]??={}; r.multiPresenceLastBattleLossRoundByPlayer[ctx.controllerId]![presenceKey]=state.round.roundNumber; return true; }
  if(effect.type===MULTI_PRESENCE_DEPLOY_EFFECT){ const target=ctx.selections[String(effect.target)]?.[0]; if(!target||!isBattlefield(state,target)||!canPresenceOccupy(state,ctx.controllerId,target))return false; const presence:MultiPresenceState={id:`${ctx.controllerId}:${presenceKey}`,playerId:ctx.controllerId,presenceKey,locationId:target as NonNullable<GameState['players'][number]['locationId']>,deployedAtLocationId:target,terrainAdvantage:deploymentTerrainAdvantage(state,target),sourceCardId:ctx.sourceCardId,sourceAbilityId:ctx.abilityId,createdRound:state.round.roundNumber,updatedRevision:r.revision}; (r.extraPlayerPresences??=[]).push(presence); r.events.push({type:'extra_player_presence_deployed',playerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId}); return true; }
  if(effect.type===MULTI_PRESENCE_MIRROR_MOVE_EFFECT){ const presence=liveMultiPresenceFor(state,ctx.controllerId,presenceKey)!; if(presenceEngaged(state,presence))return true; const target=mirroredTarget(state,presence.locationId,event!.previousLocationId!,event!.locationId!); if(!target||!enabledLocation(state,target)||!canPresenceOccupy(state,ctx.controllerId,target))return true; presence.locationId=target; presence.updatedRevision=r.revision; r.events.push({type:'extra_player_presence_moved',playerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId}); return true; }
  if(effect.type===MULTI_PRESENCE_POST_PLAY_MANA_LOSS_EFFECT){ const ids=new Set((event!.playedCards??[]).filter((entry)=>entry.controllerId===ctx.controllerId).map((entry)=>entry.instanceId)); let paid=0; for(const id of ids){const stateEntry=r.cardState[id]; if(stateEntry?.playedRound!==state.round.roundNumber||!Number.isSafeInteger(stateEntry.paidManaOnPlay)||Number(stateEntry.paidManaOnPlay)<0)return false; paid+=Number(stateEntry.paidManaOnPlay); } const requested=Math.ceil(paid/2); const player=state.players.find((entry)=>entry.id===ctx.controllerId)!; const before=player.mana; const lost=Math.min(before,requested); player.mana=before-lost; r.events.push({type:'multi_presence_post_play_mana_lost',playerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId,resource:'mana',requestedDelta:-requested,delta:-lost,before,after:player.mana}); return true; }
  if(effect.type===MULTI_PRESENCE_SHARED_PLAYER_EFFECT||effect.type===MULTI_PRESENCE_SHARE_TERRAIN_EFFECT)return true;
  return effect.type===MULTI_PRESENCE_SACRIFICE_DEFEAT_EFFECT;
}

export function isMultiPresenceRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try { const r=runtime(state); const ids=new Set<string>(); const pairs=new Set<string>();
    for(const presence of r.extraPlayerPresences??[]){ if(!presence||typeof presence.id!=='string'||!key(presence.presenceKey)||typeof presence.playerId!=='string'||typeof presence.locationId!=='string'||typeof presence.deployedAtLocationId!=='string'||!Number.isSafeInteger(presence.terrainAdvantage)||presence.terrainAdvantage<0||!Number.isSafeInteger(presence.createdRound)||presence.createdRound<1||presence.createdRound>state.round.roundNumber||!Number.isSafeInteger(presence.updatedRevision)||presence.updatedRevision<0||presence.updatedRevision>r.revision)return false;
      if(ids.has(presence.id)||pairs.has(`${presence.playerId}:${presence.presenceKey}`)||presence.id!==`${presence.playerId}:${presence.presenceKey}`)return false; ids.add(presence.id);pairs.add(`${presence.playerId}:${presence.presenceKey}`);
      const player=state.players.find((entry)=>entry.id===presence.playerId&&entry.status==='active'); const ability=sourceValid(state,presence.playerId,presence.sourceCardId,presence.sourceAbilityId); if(!player||!ability||ability.effects[0]?.type!==MULTI_PRESENCE_DEPLOY_EFFECT||effectKey(ability.effects[0]!)!==presence.presenceKey||!isBattlefield(state,presence.deployedAtLocationId)||!enabledLocation(state,presence.locationId))return false;
      const bonuses=enabledLocation(state,presence.deployedAtLocationId)?.terrainBonuses??[]; if(presence.terrainAdvantage!==0&&!bonuses.includes(presence.terrainAdvantage))return false; if(!multiPresenceSharedPlayerEnabled(state,presence.playerId,presence.presenceKey))return false;
    }
    for(const [playerId,bag] of Object.entries(r.multiPresenceLastBattleLossRoundByPlayer??{})){ if(!state.players.some((entry)=>entry.id===playerId)||!rec(bag))return false; for(const [presenceKey,round] of Object.entries(bag)){ if(!key(presenceKey)||!Number.isSafeInteger(round)||Number(round)<1||Number(round)>state.round.roundNumber||providers(state,playerId,presenceKey,MULTI_PRESENCE_RECORD_LOSS_EFFECT).length!==1)return false; } }
    return true;
  } catch { return false; }
}