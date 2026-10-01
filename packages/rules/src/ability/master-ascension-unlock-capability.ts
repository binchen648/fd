import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, ExecutableCardDefinition, RuleNode } from './types';

export const MASTER_ASCENSION_UNLOCK_EFFECT = 'unlock_controller_master_ascension' as const;

function exactKeys(value: RuleNode, keys: readonly string[]): boolean { const actual=Object.keys(value); return actual.length===keys.length&&actual.every(k=>keys.includes(k)); }
function empty(value: RuleNode): boolean { return Object.keys(value).length===0; }
export function isMasterAscensionUnlockEffect(effect: RuleNode): boolean { return effect.type===MASTER_ASCENSION_UNLOCK_EFFECT&&exactKeys(effect,['type']); }
function common(a: AuthoringAbility): boolean {
  const responseKeys=Object.keys(a.responseWindow); const responseOk=responseKeys.every(k=>['order','passBehavior'].includes(k))&&(a.responseWindow.order===undefined||a.responseWindow.order==='turn_order')&&(a.responseWindow.passBehavior===undefined||a.responseWindow.passBehavior==='decline_this_window');
  return a.effects.length===1&&isMasterAscensionUnlockEffect(a.effects[0]!)&&a.conditions.length===0&&a.targets.length===0&&a.cost.length===0&&a.ruleModifiers.length===0&&a.creates.length===0&&empty(a.lifecycle)&&responseOk&&empty(a.limit)&&empty(a.visibility)&&a.execution.mode==='automatic'&&a.execution.allowedOperations.length===0;
}
export function isAcceptedMasterAscensionUnlockAbility(a: AuthoringAbility): boolean {
  if(!common(a)) return false;
  if(a.kind==='forced_trigger') return exactKeys(a.activation,['trigger'])&&a.activation.trigger==='round_start';
  if(a.kind==='phase_action') return exactKeys(a.activation,['phase','opens'])&&a.activation.phase==='action'&&a.activation.opens==='controller_action_window';
  return false;
}
export function containsMasterAscensionUnlockPrivilegedNode(value: unknown): boolean {
  if(Array.isArray(value)) return value.some(containsMasterAscensionUnlockPrivilegedNode);
  if(!value||typeof value!=='object') return false;
  const node=value as Record<string,unknown>; if(node.type===MASTER_ASCENSION_UNLOCK_EFFECT)return true;
  return Object.values(node).some(containsMasterAscensionUnlockPrivilegedNode);
}
function runtime(state: GameState){ if(!state.abilityRuntime) throw new Error('MASTER_ASCENSION_UNLOCK_RUNTIME_REQUIRED'); return state.abilityRuntime; }
export function canExecuteMasterAscensionUnlock(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if(!isAcceptedMasterAscensionUnlockAbility(ability)) return false;
  const player=state.players.find(p=>p.id===ctx.controllerId); const source=state.cards.find(c=>c.instanceId===ctx.sourceCardId); if(!player||!source)return false;
  const sourceDefinition=runtime(state).pack.cards[source.definitionId] as ExecutableCardDefinition|undefined;
  if(source.ownerPlayerId!==player.id||source.controllerPlayerId!==player.id||source.zone!=='skill'||sourceDefinition?.cardType!=='servant_skill'||sourceDefinition.ownerId!==player.servantCardId)return false;
  const expectedId=player.masterCardId+'.skill.ascension';
  const target=runtime(state).pack.cards[expectedId] as ExecutableCardDefinition|undefined;
  if(!target)return true;
  if(target.cardType!=='master_skill'||target.ownerId!==player.masterCardId||target.initialPlacement!=='outside_game'||target.mode!=='automatic')return false;
  const existing=state.cards.filter(c=>c.definitionId===expectedId);
  return existing.length<=1&&existing.every(c=>c.ownerPlayerId===player.id&&c.controllerPlayerId===player.id);
}
export function resolveMasterAscensionUnlock(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if(!isAcceptedMasterAscensionUnlockAbility(ability)) return false;
  const player=state.players.find(p=>p.id===ctx.controllerId); const source=state.cards.find(c=>c.instanceId===ctx.sourceCardId); if(!player||!source)return false;
  const sourceDefinition=runtime(state).pack.cards[source.definitionId] as ExecutableCardDefinition|undefined;
  if(source.ownerPlayerId!==player.id||source.controllerPlayerId!==player.id||source.zone!=='skill'||sourceDefinition?.cardType!=='servant_skill'||sourceDefinition.ownerId!==player.servantCardId)return false;
  const expectedId=player.masterCardId+'.skill.ascension';
  const candidates=Object.values(runtime(state).pack.cards).filter((raw): raw is ExecutableCardDefinition=>{
    const d=raw as ExecutableCardDefinition; return d.id===expectedId&&d.cardType==='master_skill'&&d.ownerId===player.masterCardId&&d.initialPlacement==='outside_game'&&d.mode==='automatic';
  });
  if(candidates.length===0)return true;
  if(candidates.length!==1)throw new Error('MASTER_ASCENSION_UNLOCK_AMBIGUOUS_TARGET');
  const target=candidates[0]!; const existing=state.cards.filter(c=>c.definitionId===target.id);
  if(existing.length>1)throw new Error('MASTER_ASCENSION_UNLOCK_DUPLICATE_TARGET');
  if(existing.length===1){const card=existing[0]!; if(card.ownerPlayerId!==player.id||card.controllerPlayerId!==player.id)throw new Error('MASTER_ASCENSION_UNLOCK_WRONG_OWNER'); return true;}
  const instanceId='master-ascension:'+player.id+':'+target.id;
  state.cards.push({instanceId,definitionId:target.id,ownerPlayerId:player.id,controllerPlayerId:player.id,zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:player.id},generatedBy:ctx.sourceCardId});
  runtime(state).cardState[instanceId]={active:false,faceDown:false,playedRound:state.round.roundNumber};
  runtime(state).events.push({type:'card_created',playerId:player.id,sourceCardId:ctx.sourceCardId,abilityId:ability.id,cardInstanceId:instanceId,toZone:'skill',movedCount:1});
  return true;
}
