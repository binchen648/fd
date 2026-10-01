import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';
import { persistentLocationTerrainAdvantage } from './persistent-location-terrain-capability';

export const EFFECTIVE_LOCATION_SAME_LOCATION_RESTRICTIONS_EFFECT = 'effective_location_same_location_restrictions' as const;

function rec(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): boolean { if (!rec(value)) return false; const actual=Object.keys(value); return actual.length===keys.length&&actual.every((key)=>keys.includes(key)); }
function standard(ability: AuthoringAbility): boolean {
  return ability.execution.mode==='automatic'&&Array.isArray(ability.execution.allowedOperations)&&ability.execution.allowedOperations.length===0&&
    ability.conditions.length===0&&ability.targets.length===0&&ability.cost.length===0&&ability.creates.length===0&&ability.ruleModifiers.length===0&&
    Object.keys(ability.lifecycle).length===0&&Object.keys(ability.limit).length===0&&Object.keys(ability.visibility).length===0&&
    exact(ability.responseWindow,['order','passBehavior'])&&ability.responseWindow.order==='turn_order'&&ability.responseWindow.passBehavior==='decline_this_window';
}
function exactEffect(effect: RuleNode): boolean {
  return effect.type===EFFECTIVE_LOCATION_SAME_LOCATION_RESTRICTIONS_EFFECT&&
    effect.effectiveLocationKind==='workshop'&&effect.persistentTerrainMinimum===5&&typeof effect.persistentTerrainProviderDefinitionId==='string'&&effect.persistentTerrainProviderDefinitionId.length>0&&
    typeof effect.persistentTerrainProviderAbilityId==='string'&&effect.persistentTerrainProviderAbilityId.length>0&&effect.blockOpponentExit===true&&effect.requireFaceDownStandardAttack===true&&
    exact(effect,['type','effectiveLocationKind','persistentTerrainMinimum','persistentTerrainProviderDefinitionId','persistentTerrainProviderAbilityId','blockOpponentExit','requireFaceDownStandardAttack']);
}
export function isAcceptedEffectiveLocationRestrictionAbility(ability: AuthoringAbility): boolean {
  return standard(ability)&&ability.kind==='passive'&&Object.keys(ability.activation).length===0&&ability.effects.length===1&&exactEffect(ability.effects[0]!);
}
export function containsEffectiveLocationRestrictionPrivilegedNode(value: unknown): boolean {
  if(Array.isArray(value))return value.some(containsEffectiveLocationRestrictionPrivilegedNode);
  if(!rec(value))return false;
  if(value.type===EFFECTIVE_LOCATION_SAME_LOCATION_RESTRICTIONS_EFFECT)return true;
  return Object.values(value).some(containsEffectiveLocationRestrictionPrivilegedNode);
}
function runtime(state: GameState){ if(!state.abilityRuntime)throw new Error('EFFECTIVE_LOCATION_RUNTIME_REQUIRED'); return state.abilityRuntime; }
function liveProviders(state: GameState, controllerId: string): Array<{sourceCardId:string;ability:AuthoringAbility}> {
  const out:Array<{sourceCardId:string;ability:AuthoringAbility}>=[];
  for(const source of state.cards){
    if(source.ownerPlayerId!==controllerId||source.controllerPlayerId!==controllerId||source.zone!=='skill')continue;
    const definition=runtime(state).pack.cards[source.definitionId]; if(!definition)continue;
    for(const ability of definition.abilities)if(isAcceptedEffectiveLocationRestrictionAbility(ability))out.push({sourceCardId:source.instanceId,ability});
  }
  return out;
}
function boundPersistentTerrainReady(state: GameState, controllerId: string, locationId: string, effect: RuleNode): boolean {
  const entry=state.abilityRuntime?.persistentLocationTerrainByPlayer?.[controllerId]?.[locationId];
  if(!entry||entry.value<Number(effect.persistentTerrainMinimum)||entry.abilityId!==effect.persistentTerrainProviderAbilityId)return false;
  const source=state.cards.find((card)=>card.instanceId===entry.sourceCardId);
  return !!source&&source.ownerPlayerId===controllerId&&source.controllerPlayerId===controllerId&&source.definitionId===effect.persistentTerrainProviderDefinitionId&&
    persistentLocationTerrainAdvantage(state,controllerId,locationId)!==undefined;
}
export function effectiveLocationRestrictionAuthority(state: GameState, controllerId: string): {sourceCardId:string;abilityId:string;actualLocationId:string;effectiveLocationKind:'workshop'} | undefined {
  const player=state.players.find((entry)=>entry.id===controllerId&&entry.status==='active');
  if(!player?.locationId)return undefined;
  const providers=liveProviders(state,controllerId); if(providers.length!==1)return undefined;
  const provider=providers[0]!; const effect=provider.ability.effects[0]!;
  const actualWorkshop=player.locationId==='magic_workshop';
  if(!actualWorkshop&&!boundPersistentTerrainReady(state,controllerId,player.locationId,effect))return undefined;
  return {sourceCardId:provider.sourceCardId,abilityId:provider.ability.id,actualLocationId:player.locationId,effectiveLocationKind:'workshop'};
}
export function isPlayerAtEffectiveLocationKind(state: GameState, playerId: string, kind: string): boolean {
  const player=state.players.find((entry)=>entry.id===playerId&&entry.status==='active'); if(!player?.locationId)return false;
  if(kind==='workshop'&&player.locationId==='magic_workshop')return true;
  if(kind!=='workshop')return false;
  return effectiveLocationRestrictionAuthority(state,playerId)?.effectiveLocationKind==='workshop';
}
function controllingRestrictionAtSameLocation(state: GameState, opponentId: string): boolean {
  const opponent=state.players.find((entry)=>entry.id===opponentId&&entry.status==='active'); if(!opponent?.locationId)return false;
  return state.players.some((controller)=>controller.status==='active'&&controller.id!==opponentId&&controller.locationId===opponent.locationId&&
    effectiveLocationRestrictionAuthority(state,controller.id)?.actualLocationId===opponent.locationId);
}
export function effectiveLocationRestrictionBlocksMovement(state: GameState, playerId: string): boolean {
  return controllingRestrictionAtSameLocation(state,playerId);
}
export function effectiveLocationRestrictionRequiresFaceDownStandardAttack(state: GameState, playerId: string): boolean {
  return controllingRestrictionAtSameLocation(state,playerId);
}
export function isEffectiveLocationRestrictionRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try{
    if(!state.abilityRuntime)return true;
    const activePlayers=new Set(state.players.filter((entry)=>entry.status==='active').map((entry)=>entry.id));
    for(const source of state.cards){
      const definition=runtime(state).pack.cards[source.definitionId]; if(!definition)continue;
      const accepted=definition.abilities.filter(isAcceptedEffectiveLocationRestrictionAbility);
      if(accepted.length>1)return false;
      if(accepted.length===1&&source.zone==='skill'&&(source.ownerPlayerId!==source.controllerPlayerId||!activePlayers.has(source.controllerPlayerId)))return false;
    }
    for(const controller of state.players){
      const providers=liveProviders(state,controller.id);
      if(providers.length>1)return false;
      const authority=effectiveLocationRestrictionAuthority(state,controller.id);
      if(authority&&(!controller.locationId||authority.actualLocationId!==controller.locationId))return false;
    }
    return true;
  }catch{return false;}
}