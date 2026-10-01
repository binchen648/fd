import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, PersistentLocationTerrainState, RuleNode } from './types';

export const PERSISTENT_LOCATION_TERRAIN_REPLACE_INCREMENT_EFFECT = 'persistent_location_terrain_replace_increment' as const;

function rec(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): boolean { if (!rec(value)) return false; const actual=Object.keys(value); return actual.length===keys.length&&actual.every((key)=>keys.includes(key)); }
function standard(ability: AuthoringAbility): boolean {
  return ability.execution.mode==='automatic'&&Array.isArray(ability.execution.allowedOperations)&&ability.execution.allowedOperations.length===0&&
    ability.conditions.length===0&&ability.targets.length===0&&ability.cost.length===0&&ability.creates.length===0&&ability.ruleModifiers.length===0&&
    Object.keys(ability.lifecycle).length===0&&Object.keys(ability.limit).length===0&&Object.keys(ability.visibility).length===0&&
    exact(ability.responseWindow,['order','passBehavior'])&&ability.responseWindow.order==='turn_order'&&ability.responseWindow.passBehavior==='decline_this_window';
}
function exactEffect(effect: RuleNode): boolean {
  return effect.type===PERSISTENT_LOCATION_TERRAIN_REPLACE_INCREMENT_EFFECT&&effect.amount===1&&effect.max===5&&exact(effect,['type','amount','max']);
}
export function isAcceptedPersistentLocationTerrainAbility(ability: AuthoringAbility): boolean {
  return standard(ability)&&ability.kind==='forced_trigger'&&exact(ability.activation,['trigger'])&&
    ability.activation.trigger==='after_player_deployed_to_battlefield'&&ability.effects.length===1&&exactEffect(ability.effects[0]!);
}
export function containsPersistentLocationTerrainPrivilegedNode(value: unknown): boolean {
  if(Array.isArray(value)) return value.some(containsPersistentLocationTerrainPrivilegedNode);
  if(!rec(value)) return false;
  if(value.type===PERSISTENT_LOCATION_TERRAIN_REPLACE_INCREMENT_EFFECT) return true;
  return Object.values(value).some(containsPersistentLocationTerrainPrivilegedNode);
}
function runtime(state: GameState){ if(!state.abilityRuntime) throw new Error('PERSISTENT_TERRAIN_RUNTIME_REQUIRED'); return state.abilityRuntime; }
function definitionAbility(state: GameState, sourceCardId: string, abilityId: string): AuthoringAbility | undefined {
  const source=state.cards.find((entry)=>entry.instanceId===sourceCardId); if(!source)return undefined;
  return runtime(state).pack.cards[source.definitionId]?.abilities.find((entry)=>entry.id===abilityId);
}
function providerDefinitionValid(state: GameState, playerId: string, sourceCardId: string, abilityId: string): boolean {
  const source=state.cards.find((entry)=>entry.instanceId===sourceCardId); const ability=definitionAbility(state,sourceCardId,abilityId);
  return !!source&&source.ownerPlayerId===playerId&&source.controllerPlayerId===playerId&&!!ability&&isAcceptedPersistentLocationTerrainAbility(ability);
}
function liveProviderValid(state: GameState, playerId: string, sourceCardId: string, abilityId: string): boolean {
  const source=state.cards.find((entry)=>entry.instanceId===sourceCardId);
  return providerDefinitionValid(state,playerId,sourceCardId,abilityId)&&source?.zone==='skill';
}
function assignedTerrainSlot(state: GameState, playerId: string, locationId: string): boolean {
  const player=state.players.find((entry)=>entry.id===playerId&&entry.status==='active'); if(!player||player.locationId!==locationId)return false;
  const location=state.map.locations.find((entry)=>entry.id===locationId); const slotCount=location?.terrainBonuses?.length??0; if(slotCount<1)return false;
  const mode=(state as unknown as {modeState?:{terrainAssignments?:Record<string,string[]>;terrainAssignmentSlots?:Record<string,Record<string,number>>}}).modeState;
  const assigned=mode?.terrainAssignments?.[locationId]??[]; const explicit=mode?.terrainAssignmentSlots?.[locationId]?.[playerId];
  const slot=Number.isSafeInteger(explicit)?Number(explicit):assigned.indexOf(playerId);
  return slot>=0&&slot<slotCount&&assigned.includes(playerId);
}
function states(state: GameState){ return runtime(state).persistentLocationTerrainByPlayer??={}; }
function byLocation(state: GameState, playerId: string){ return states(state)[playerId]??={}; }
export function persistentLocationTerrainAdvantage(state: GameState, playerId: string, locationId: string): number | undefined {
  if(state.players.find((entry)=>entry.id===playerId)?.locationId!==locationId)return undefined;
  const entry=runtime(state).persistentLocationTerrainByPlayer?.[playerId]?.[locationId];
  return entry&&entry.value>=1&&entry.value<=5?entry.value:undefined;
}
export function canExecutePersistentLocationTerrainEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  const event=ctx.event;
  return isAcceptedPersistentLocationTerrainAbility(ability)&&liveProviderValid(state,ctx.controllerId,ctx.sourceCardId,ctx.abilityId)&&
    event?.type==='after_player_deployed_to_battlefield'&&event.playerId===ctx.controllerId&&typeof event.locationId==='string'&&
    assignedTerrainSlot(state,ctx.controllerId,event.locationId);
}
export function resolvePersistentLocationTerrainEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if(!canExecutePersistentLocationTerrainEffect(state,ctx,ability)||!ctx.event||typeof ctx.event.locationId!=='string')return false;
  const locationId=ctx.event.locationId; const eventId=ctx.event.id; const store=byLocation(state,ctx.controllerId); const current=store[locationId];
  if(current&&(current.sourceCardId!==ctx.sourceCardId||current.abilityId!==ctx.abilityId))throw new Error('PERSISTENT_TERRAIN_PROVIDER_CONFLICT');
  const entry:PersistentLocationTerrainState=current??{playerId:ctx.controllerId,locationId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId,value:0,triggerEventIds:[]};
  if(entry.triggerEventIds.includes(eventId))return true;
  if(entry.value<5){entry.value+=1;entry.triggerEventIds.push(eventId);}
  store[locationId]=entry;
  return true;
}
export function isPersistentLocationTerrainRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try{
    const r=state.abilityRuntime;if(!r)return true;const all=r.persistentLocationTerrainByPlayer??{};const players=new Set(state.players.map((entry)=>entry.id));const locations=new Set<string>(state.map.locations.map((entry)=>entry.id));
    for(const [playerId,locationMap] of Object.entries(all)){
      if(!players.has(playerId)||!rec(locationMap))return false;
      for(const [locationId,entry] of Object.entries(locationMap)){
        if(!locations.has(locationId)||!entry||entry.playerId!==playerId||entry.locationId!==locationId||!providerDefinitionValid(state,playerId,entry.sourceCardId,entry.abilityId))return false;
        if(!Number.isSafeInteger(entry.value)||entry.value<1||entry.value>5||!Array.isArray(entry.triggerEventIds)||entry.triggerEventIds.length!==entry.value||new Set(entry.triggerEventIds).size!==entry.triggerEventIds.length)return false;
        if(entry.triggerEventIds.some((id)=>typeof id!=='string'||!r.processedEvents.includes(id)))return false;
      }
    }
    return true;
  }catch{return false;}
}
