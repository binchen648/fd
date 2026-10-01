import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, MasterAscensionEventPowerState, PlayerId, RuleNode } from './types';
import { isAcceptedMasterAscensionUnlockAbility } from './master-ascension-unlock-capability';

export const ASCENSION_UNLOCK_OPPONENT_SEAL_LOSS_EFFECT = 'ascension_unlock_opponents_lose_command_seals' as const;
export const NAMED_EVENT_BASIC_POWER_BONUS_EFFECT = 'named_event_basic_attack_power_bonus' as const;
const PRIVILEGED = new Set<string>([ASCENSION_UNLOCK_OPPONENT_SEAL_LOSS_EFFECT, NAMED_EVENT_BASIC_POWER_BONUS_EFFECT]);

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
export function isAcceptedMasterAscensionEventPowerAbility(ability: AuthoringAbility): boolean { return isSealLossAbility(ability)||isNamedEventPowerAbility(ability); }
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
  if(!isNamedEventPowerAbility(ability))return undefined;
  const event=ctx.event; const eventDefinitionId=String(ability.activation.eventDefinitionId);
  if(!event||event.type!=='event_activated'||event.revealedKind!=='event'||event.revealedId!==eventDefinitionId||!event.sourceCardId||!event.locationId)return undefined;
  const record:MasterAscensionEventPowerState={controllerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,sourceAbilityId:ctx.abilityId,eventDefinitionId,eventRuleInstanceId:event.sourceCardId,locationId:event.locationId,triggerEventId:event.id,round:state.round.roundNumber,amount:4};
  if(!eventPlacementValid(state,record))return undefined;
  (runtime(state).masterAscensionEventPowerByPlayer??={})[ctx.controllerId]=record;
  runtime(state).events.push({type:'named_event_basic_power_bonus_activated',playerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId,triggerEventId:event.id,delta:4});
  return [];
}
export function masterAscensionNamedEventBasicPowerBonus(state: GameState, cardInstanceId: string): number {
  const physical=state.cards.find((entry)=>entry.instanceId===cardInstanceId); if(!physical)return 0;
  const definition=runtime(state).pack.cards[physical.definitionId]; if(!definition||definition.cardType!=='basic_attack')return 0;
  const record=runtime(state).masterAscensionEventPowerByPlayer?.[physical.controllerPlayerId]; if(!record)return 0;
  if(record.controllerId!==physical.controllerPlayerId||physical.ownerPlayerId!==record.controllerId||record.round!==state.round.roundNumber||record.amount!==4||!eventPlacementValid(state,record))throw new Error('MASTER_ASCENSION_EVENT_POWER_INVALID_RUNTIME');
  const source=state.cards.find((entry)=>entry.instanceId===record.sourceCardId); const ability=source&&runtime(state).pack.cards[source.definitionId]?.abilities.find((entry)=>entry.id===record.sourceAbilityId);
  if(!ascensionProviderValid(state,record.controllerId,record.sourceCardId)||!ability||!isNamedEventPowerAbility(ability)||ability.activation.eventDefinitionId!==record.eventDefinitionId)throw new Error('MASTER_ASCENSION_EVENT_POWER_INVALID_PROVIDER');
  return 4;
}
export function reconcileMasterAscensionEventPowerAuthority(state: GameState): void { const map=runtime(state).masterAscensionEventPowerByPlayer; if(!map)return; for(const [id,record] of Object.entries(map))if(record.round!==state.round.roundNumber||!eventPlacementValid(state,record))delete map[id]; }
export function cleanupMasterAscensionEventPowerAtRoundEnd(state: GameState): void { const map=runtime(state).masterAscensionEventPowerByPlayer; if(!map)return; for(const [id,record] of Object.entries(map))if(record.round<=state.round.roundNumber)delete map[id]; }
export function isMasterAscensionEventPowerRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try{for(const [controllerId,record] of Object.entries(runtime(state).masterAscensionEventPowerByPlayer??{})){
    if(controllerId!==record.controllerId||record.round!==state.round.roundNumber||record.amount!==4||!runtime(state).processedEvents.includes(record.triggerEventId)||!eventPlacementValid(state,record))return false;
    const source=state.cards.find((entry)=>entry.instanceId===record.sourceCardId); const definition=source&&runtime(state).pack.cards[source.definitionId]; const ability=definition?.abilities.find((entry)=>entry.id===record.sourceAbilityId);
    if(!ascensionProviderValid(state,controllerId,record.sourceCardId)||!ability||!isNamedEventPowerAbility(ability)||ability.activation.eventDefinitionId!==record.eventDefinitionId)return false;
  } return true;}catch{return false;}
}
