import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, MasterAscensionEventPowerState, MasterAscensionSourceDefinitionPowerState, PlayerId, RuleNode } from './types';
import { isAcceptedMasterAscensionUnlockAbility } from './master-ascension-unlock-capability';

export const ASCENSION_UNLOCK_OPPONENT_SEAL_LOSS_EFFECT = 'ascension_unlock_opponents_lose_command_seals' as const;
export const NAMED_EVENT_BASIC_POWER_BONUS_EFFECT = 'named_event_basic_attack_power_bonus' as const;
export const SOURCE_DEFINITION_BASIC_POWER_BONUS_EFFECT = 'source_definition_basic_attack_power_bonus' as const;
const PRIVILEGED = new Set<string>([ASCENSION_UNLOCK_OPPONENT_SEAL_LOSS_EFFECT, NAMED_EVENT_BASIC_POWER_BONUS_EFFECT, SOURCE_DEFINITION_BASIC_POWER_BONUS_EFFECT]);

function rec(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): boolean { if (!rec(value)) return false; const actual=Object.keys(value); return actual.length===keys.length&&actual.every((key)=>keys.includes(key)); }
function key(value: unknown): value is string { return typeof value==='string'&&/^[a-z0-9][a-z0-9:._-]{0,127}$/i.test(value); }
function runtime(state: GameState){ if(!state.abilityRuntime) throw new Error('MASTER_ASCENSION_EVENT_POWER_RUNTIME_REQUIRED'); return state.abilityRuntime; }
function standard(ability: AuthoringAbility): boolean {
  return ability.execution.mode==='automatic'&&Array.isArray(ability.execution.allowedOperations)&&ability.execution.allowedOperations.length===0&&
    ability.conditions.length===0&&ability.targets.length===0&&ability.cost.length===0&&ability.ruleModifiers.length===0&&ability.creates.length===0&&
    Object.keys(ability.lifecycle).length===0&&Object.keys(ability.visibility).length===0&&Object.keys(ability.limit).length===0&&
    exact(ability.responseWindow,['order','passBehavior'])&&ability.responseWindow.order==='turn_order'&&ability.responseWindow.passBehavior==='decline_this_window';
}
function isSealLossAbility(ability: AuthoringAbility): boolean {
  const effect=ability.effects[0];
  return standard(ability)&&ability.kind==='forced_trigger'&&ability.effects.length===1&&exact(ability.activation,['trigger'])&&
    ability.activation.trigger==='after_master_ascension_unlocked'&&!!effect&&effect.type===ASCENSION_UNLOCK_OPPONENT_SEAL_LOSS_EFFECT&&
    effect.amount===2&&effect.floor===0&&exact(effect,['type','amount','floor']);
}
function isNamedEventPowerAbility(ability: AuthoringAbility): boolean {
  const effect=ability.effects[0]; const eventDefinitionId=ability.activation.eventDefinitionId;
  return standard(ability)&&ability.kind==='forced_trigger'&&ability.effects.length===1&&exact(ability.activation,['trigger','eventDefinitionId'])&&
    ability.activation.trigger==='event_activated'&&key(eventDefinitionId)&&!!effect&&effect.type===NAMED_EVENT_BASIC_POWER_BONUS_EFFECT&&
    effect.amount===4&&effect.duration==='while_event_active'&&exact(effect,['type','amount','duration']);
}
export function isAcceptedMasterAscensionSourceDefinitionPowerAbility(ability: AuthoringAbility): boolean {
  const effect=ability.effects[0]; const sourceDefinitionId=ability.activation.sourceDefinitionId;
  return standard(ability)&&ability.kind==='forced_trigger'&&ability.effects.length===1&&exact(ability.activation,['trigger','sourceDefinitionId'])&&
    ability.activation.trigger==='on_card_played'&&key(sourceDefinitionId)&&!!effect&&effect.type===SOURCE_DEFINITION_BASIC_POWER_BONUS_EFFECT&&
    effect.amount===4&&effect.duration==='while_source_active'&&exact(effect,['type','amount','duration']);
}
export function isAcceptedMasterAscensionEventPowerAbility(ability: AuthoringAbility): boolean { return isSealLossAbility(ability)||isNamedEventPowerAbility(ability)||isAcceptedMasterAscensionSourceDefinitionPowerAbility(ability); }
export function containsMasterAscensionEventPowerPrivilegedNode(value: unknown): boolean {
  if(Array.isArray(value))return value.some(containsMasterAscensionEventPowerPrivilegedNode); if(!rec(value))return false;
  if(typeof value.type==='string'&&PRIVILEGED.has(value.type))return true; return Object.values(value).some(containsMasterAscensionEventPowerPrivilegedNode);
}
function ascensionProviderValid(state: GameState, controllerId: string, sourceCardId: string): boolean {
  const player=state.players.find((entry)=>entry.id===controllerId); const source=state.cards.find((entry)=>entry.instanceId===sourceCardId);
  const definition=source&&runtime(state).pack.cards[source.definitionId] as any;
  const unlockSource=source?.generatedBy?state.cards.find((entry)=>entry.instanceId===source.generatedBy):undefined;
  const unlockDefinition=unlockSource&&runtime(state).pack.cards[unlockSource.definitionId] as any;
  const unlockAbility=unlockDefinition?.abilities?.find((entry:AuthoringAbility)=>isAcceptedMasterAscensionUnlockAbility(entry));
  return !!player&&!!source&&!!definition&&source.ownerPlayerId===controllerId&&source.controllerPlayerId===controllerId&&source.zone==='skill'&&
    definition.cardType==='master_skill'&&definition.ownerId===player.masterCardId&&definition.id===player.masterCardId+'.skill.ascension'&&
    !!unlockSource&&unlockSource.ownerPlayerId===controllerId&&unlockSource.controllerPlayerId===controllerId&&unlockSource.zone==='skill'&&
    unlockDefinition?.cardType==='servant_skill'&&unlockDefinition.ownerId===player.servantCardId&&!!unlockAbility;
}
function providerValid(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  return isAcceptedMasterAscensionEventPowerAbility(ability)&&ascensionProviderValid(state,ctx.controllerId,ctx.sourceCardId);
}
function eventPlacementValid(state: GameState, record: MasterAscensionEventPowerState): boolean {
  return state.eventPlacements.filter((placement)=>(placement as typeof placement & {ruleInstanceId?:string}).ruleInstanceId===record.eventRuleInstanceId&&
    placement.eventCardId===record.eventDefinitionId&&placement.locationId===record.locationId&&placement.visibility.scope==='public').length===1;
}
export function masterAscensionSourceDefinitionTriggerMatches(state: GameState, controllerId: string, ability: AuthoringAbility, event: EffectContext['event']): boolean {
  if(!isAcceptedMasterAscensionSourceDefinitionPowerAbility(ability)||!event||event.type!=='on_card_played'||event.playerId!==controllerId||!event.sourceCardId)return false;
  const sourceDefinitionId=String(ability.activation.sourceDefinitionId); const physical=state.cards.find((entry)=>entry.instanceId===event.sourceCardId);
  const cardState=physical?runtime(state).cardState[physical.instanceId]:undefined; const played=event.playedCards?.find((entry)=>entry.instanceId===event.sourceCardId);
  return !!physical&&physical.ownerPlayerId===controllerId&&physical.controllerPlayerId===controllerId&&physical.definitionId===sourceDefinitionId&&
    !!cardState&&cardState.active===true&&cardState.faceDown!==true&&['field','attack_area'].includes(physical.zone)&&
    !!played&&played.controllerId===controllerId&&played.faceDown===false&&played.cardType===runtime(state).pack.cards[sourceDefinitionId]?.cardType;
}
function sourceDefinitionRecordIdentityValid(state: GameState, record: MasterAscensionSourceDefinitionPowerState): boolean {
  const provider=state.cards.find((entry)=>entry.instanceId===record.providerSourceCardId); const ability=provider&&runtime(state).pack.cards[provider.definitionId]?.abilities.find((entry)=>entry.id===record.providerAbilityId);
  const trigger=state.cards.find((entry)=>entry.instanceId===record.triggerCardInstanceId);
  return record.amount===4&&record.round===state.round.roundNumber&&record.playCount>=1&&Number.isSafeInteger(record.playCount)&&
    ascensionProviderValid(state,record.controllerId,record.providerSourceCardId)&&!!ability&&isAcceptedMasterAscensionSourceDefinitionPowerAbility(ability)&&
    ability.activation.sourceDefinitionId===record.sourceDefinitionId&&!!trigger&&trigger.ownerPlayerId===record.controllerId&&
    trigger.controllerPlayerId===record.controllerId&&trigger.definitionId===record.sourceDefinitionId;
}
function sourceDefinitionRecordLive(state: GameState, record: MasterAscensionSourceDefinitionPowerState): boolean {
  if(!sourceDefinitionRecordIdentityValid(state,record))return false; const trigger=state.cards.find((entry)=>entry.instanceId===record.triggerCardInstanceId)!;
  const cardState=runtime(state).cardState[trigger.instanceId];
  return !!cardState&&cardState.active===true&&cardState.faceDown!==true&&cardState.playedRound===record.round&&
    ['field','attack_area'].includes(trigger.zone)&&(runtime(state).cardPlayCountByInstance?.[trigger.instanceId]??0)===record.playCount;
}
export function retireMasterAscensionSourceDefinitionPowerByTrigger(state: GameState, triggerCardInstanceId: string): void {
  const map=runtime(state).masterAscensionSourceDefinitionPowerByPlayer;if(!map)return;
  for(const [controllerId,record] of Object.entries(map))if(record.triggerCardInstanceId===triggerCardInstanceId)delete map[controllerId];
}
export function resolveMasterAscensionEventPowerEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): PlayerId[] | undefined {
  if(!providerValid(state,ctx,ability))return undefined;
  if(isSealLossAbility(ability)){
    if(ctx.event?.type!=='after_master_ascension_unlocked'||ctx.event.playerId!==ctx.controllerId||ctx.event.sourceCardId!==ctx.sourceCardId)return undefined;
    const zeroed:PlayerId[]=[];
    for(const opponent of state.players.filter((entry)=>entry.id!==ctx.controllerId&&entry.status==='active')){
      const carrier=opponent as typeof opponent & {commandSpells?:number}; const before=Number(carrier.commandSpells??3);
      if(!Number.isSafeInteger(before)||before<0)return undefined; const after=Math.max(0,before-2); carrier.commandSpells=after;
      runtime(state).events.push({type:'command_seals_adjusted',playerId:opponent.id,controllerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId,resource:'command_seals',requestedDelta:-2,delta:after-before,before,after});
      if(before>0&&after===0)zeroed.push(opponent.id);
    }
    return zeroed;
  }
  if(isNamedEventPowerAbility(ability)){
    const event=ctx.event; const eventDefinitionId=String(ability.activation.eventDefinitionId);
    if(!event||event.type!=='event_activated'||event.revealedKind!=='event'||event.revealedId!==eventDefinitionId||!event.sourceCardId||!event.locationId)return undefined;
    const record:MasterAscensionEventPowerState={controllerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,sourceAbilityId:ctx.abilityId,eventDefinitionId,eventRuleInstanceId:event.sourceCardId,locationId:event.locationId,triggerEventId:event.id,round:state.round.roundNumber,amount:4};
    if(!eventPlacementValid(state,record))return undefined;
    (runtime(state).masterAscensionEventPowerByPlayer??={})[ctx.controllerId]=record;
    runtime(state).events.push({type:'named_event_basic_power_bonus_activated',playerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId,triggerEventId:event.id,delta:4});
    return [];
  }
  if(!masterAscensionSourceDefinitionTriggerMatches(state,ctx.controllerId,ability,ctx.event))return undefined;
  const triggerCardInstanceId=ctx.event!.sourceCardId!; const sourceDefinitionId=String(ability.activation.sourceDefinitionId);
  const playCount=runtime(state).cardPlayCountByInstance?.[triggerCardInstanceId]??0;if(!Number.isSafeInteger(playCount)||playCount<1)return undefined;
  const record:MasterAscensionSourceDefinitionPowerState={controllerId:ctx.controllerId,providerSourceCardId:ctx.sourceCardId,providerAbilityId:ctx.abilityId,triggerCardInstanceId,sourceDefinitionId,triggerEventId:ctx.event!.id,round:state.round.roundNumber,playCount,amount:4};
  (runtime(state).masterAscensionSourceDefinitionPowerByPlayer??={})[ctx.controllerId]=record;
  runtime(state).events.push({type:'source_definition_basic_power_bonus_activated',playerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId,cardInstanceId:triggerCardInstanceId,triggerEventId:ctx.event!.id,delta:4});
  return [];
}
export function masterAscensionNamedEventBasicPowerBonus(state: GameState, cardInstanceId: string): number {
  const physical=state.cards.find((entry)=>entry.instanceId===cardInstanceId); if(!physical)return 0;
  const definition=runtime(state).pack.cards[physical.definitionId]; if(!definition||definition.cardType!=='basic_attack')return 0;
  const eventRecord=runtime(state).masterAscensionEventPowerByPlayer?.[physical.controllerPlayerId];
  if(eventRecord){
    if(eventRecord.controllerId!==physical.controllerPlayerId||physical.ownerPlayerId!==eventRecord.controllerId||eventRecord.round!==state.round.roundNumber||eventRecord.amount!==4||!eventPlacementValid(state,eventRecord))throw new Error('MASTER_ASCENSION_EVENT_POWER_INVALID_RUNTIME');
    const source=state.cards.find((entry)=>entry.instanceId===eventRecord.sourceCardId); const ability=source&&runtime(state).pack.cards[source.definitionId]?.abilities.find((entry)=>entry.id===eventRecord.sourceAbilityId);
    if(!ascensionProviderValid(state,eventRecord.controllerId,eventRecord.sourceCardId)||!ability||!isNamedEventPowerAbility(ability)||ability.activation.eventDefinitionId!==eventRecord.eventDefinitionId)throw new Error('MASTER_ASCENSION_EVENT_POWER_INVALID_PROVIDER');
    return 4;
  }
  const definitionRecord=runtime(state).masterAscensionSourceDefinitionPowerByPlayer?.[physical.controllerPlayerId];if(!definitionRecord)return 0;
  if(physical.ownerPlayerId!==definitionRecord.controllerId||definitionRecord.controllerId!==physical.controllerPlayerId)return 0;
  if(!sourceDefinitionRecordIdentityValid(state,definitionRecord))throw new Error('MASTER_ASCENSION_SOURCE_DEFINITION_POWER_INVALID_PROVIDER');
  return sourceDefinitionRecordLive(state,definitionRecord)?4:0;
}
export function reconcileMasterAscensionEventPowerAuthority(state: GameState): void { const map=runtime(state).masterAscensionEventPowerByPlayer; if(!map)return; for(const [id,record] of Object.entries(map))if(record.round!==state.round.roundNumber||!eventPlacementValid(state,record))delete map[id]; }
export function cleanupMasterAscensionEventPowerAtRoundEnd(state: GameState): void {
  const map=runtime(state).masterAscensionEventPowerByPlayer;if(map)for(const [id,record] of Object.entries(map))if(record.round<=state.round.roundNumber)delete map[id];
  const definitionMap=runtime(state).masterAscensionSourceDefinitionPowerByPlayer;if(definitionMap)for(const [id,record] of Object.entries(definitionMap))if(record.round<=state.round.roundNumber)delete definitionMap[id];
}
export function isMasterAscensionEventPowerRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try{
    for(const [controllerId,record] of Object.entries(runtime(state).masterAscensionEventPowerByPlayer??{})){
      if(controllerId!==record.controllerId||record.round!==state.round.roundNumber||record.amount!==4||!runtime(state).processedEvents.includes(record.triggerEventId)||!eventPlacementValid(state,record))return false;
      const source=state.cards.find((entry)=>entry.instanceId===record.sourceCardId); const definition=source&&runtime(state).pack.cards[source.definitionId]; const ability=definition?.abilities.find((entry)=>entry.id===record.sourceAbilityId);
      if(!ascensionProviderValid(state,controllerId,record.sourceCardId)||!ability||!isNamedEventPowerAbility(ability)||ability.activation.eventDefinitionId!==record.eventDefinitionId)return false;
    }
    for(const [controllerId,record] of Object.entries(runtime(state).masterAscensionSourceDefinitionPowerByPlayer??{})){
      if(controllerId!==record.controllerId||!runtime(state).processedEvents.includes(record.triggerEventId)||!sourceDefinitionRecordLive(state,record))return false;
    }
    return true;
  }catch{return false;}
}
