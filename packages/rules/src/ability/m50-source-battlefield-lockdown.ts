import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import { isActiveCardSource } from '../core/card-source-state';
import { getEffectiveCardAttributes } from './card-instance-state';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

function record(value: unknown): RuleNode { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {}; }
function list(value: unknown): RuleNode[] { return Array.isArray(value) ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object' && !Array.isArray(entry)) : []; }
function exactKeys(value: RuleNode, keys: string[]): boolean { const a=Object.keys(value).sort(), b=[...keys].sort(); return a.length===b.length && a.every((key,index)=>key===b[index]); }
function emptyArray(value: unknown): boolean { return Array.isArray(value) && value.length===0; }
function emptyRecord(value: unknown): boolean { return Object.keys(record(value)).length===0; }
function defaultResponse(value: unknown): boolean {
  const response=record(value); return emptyRecord(response) || (exactKeys(response,['order','passBehavior']) && response.order==='turn_order' && response.passBehavior==='decline_this_window');
}
function automatic(raw: RuleNode): boolean { const execution=record(raw.execution); return exactKeys(execution,['mode','allowedOperations']) && execution.mode==='automatic' && Array.isArray(execution.allowedOperations) && execution.allowedOperations.length===0; }
function isBattlefield(state: GameState, locationId: string | undefined): boolean {
  return !!locationId && getEnabledLocations(state.map,state.locationConfig).some((location)=>location.id===locationId && location.tags.includes('battlefield'));
}

export function isAcceptedM50SourceBattlefieldLockdownAbility(ability: AuthoringAbility | RuleNode): boolean {
  const raw=ability as RuleNode; const activation=record(raw.activation); const conditions=list(raw.conditions); const modifiers=list(raw.ruleModifiers);
  const lifecycle=record(raw.lifecycle); const visibility=record(raw.visibility);
  if (!Array.isArray(raw.markers) || !raw.markers.includes('m50_structured_v1') || raw.kind!=='passive' || !automatic(raw) ||
      !exactKeys(activation,['requiresSourceState']) || activation.requiresSourceState!=='active' ||
      conditions.length!==1 || !exactKeys(conditions[0]!,['type']) || conditions[0]!.type!=='source_active' ||
      !emptyArray(raw.targets) || !emptyArray(raw.effects) || !emptyArray(raw.cost) || !emptyArray(raw.creates) || modifiers.length!==2 ||
      !exactKeys(lifecycle,['duration','cleanup']) || lifecycle.duration!=='while_active' || lifecycle.cleanup!=='remain_active' ||
      !exactKeys(visibility,['revealsTrueName','revealTiming','revealScope']) || visibility.revealsTrueName!==true || visibility.revealTiming!=='on_use_declared' || visibility.revealScope!=='servant_package' ||
      !defaultResponse(raw.responseWindow) || !emptyRecord(raw.limit)) return false;
  const play=modifiers[0]!, movement=modifiers[1]!; const playScope=record(play.scope), playCards=record(playScope.cards), playLife=record(play.lifecycle);
  const moveScope=record(movement.scope), moveLife=record(movement.lifecycle);
  return exactKeys(play,['id','operation','rule','scope','lifecycle']) && play.operation==='forbid' && play.rule==='card_play' &&
    exactKeys(playScope,['subject','cards']) && playScope.subject==='players_at_source_battlefield' && exactKeys(playCards,['attributesAny']) &&
    Array.isArray(playCards.attributesAny) && playCards.attributesAny.length===1 && typeof playCards.attributesAny[0]==='string' && playCards.attributesAny[0].length>0 &&
    exactKeys(playLife,['duration']) && playLife.duration==='while_active' &&
    exactKeys(movement,['id','operation','rule','scope','lifecycle']) && movement.operation==='forbid' && movement.rule==='movement_destinations' &&
    exactKeys(moveScope,['subject','sourceLocationBoundary']) && moveScope.subject==='all_players' && moveScope.sourceLocationBoundary===true &&
    exactKeys(moveLife,['duration']) && moveLife.duration==='while_active';
}

function definition(state: GameState, instanceId: string): ExecutableCardDefinition | undefined {
  const instance=state.cards.find((card)=>card.instanceId===instanceId);
  return instance ? state.abilityRuntime?.pack.cards[instance.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
function activeLockdownSources(state: GameState) {
  if (!state.abilityRuntime) return [];
  return state.cards.flatMap((source) => {
    if (!isActiveCardSource(state,source.instanceId)) return [];
    const sourceDefinition=definition(state,source.instanceId); const controller=state.players.find((player)=>player.id===source.controllerPlayerId);
    if (!sourceDefinition || !controller?.locationId || !isBattlefield(state,controller.locationId)) return [];
    const abilities=sourceDefinition.abilities.filter(isAcceptedM50SourceBattlefieldLockdownAbility);
    return abilities.length ? [{source,controller,abilities}] : [];
  });
}

export function m50SourceBattlefieldCardPlayForbidden(state: GameState, playerId: string, targetInstanceId: string): boolean {
  const targetPlayer=state.players.find((player)=>player.id===playerId); const target=state.cards.find((card)=>card.instanceId===targetInstanceId);
  if (!targetPlayer?.locationId || !target || target.controllerPlayerId!==playerId) return false;
  const attributes=getEffectiveCardAttributes(state,targetInstanceId);
  return activeLockdownSources(state).some(({controller,abilities}) => controller.locationId===targetPlayer.locationId &&
    abilities.some((ability)=>{
      const selector=record(record(ability.ruleModifiers[0]!.scope).cards).attributesAny;
      return Array.isArray(selector) && selector.some((attribute)=>typeof attribute==='string' && attributes.includes(attribute));
    }));
}

export function m50SourceBattlefieldMovementForbidden(state: GameState, fromLocationId: string, toLocationId: string): boolean {
  if (fromLocationId===toLocationId) return false;
  return activeLockdownSources(state).some(({controller})=>controller.locationId===fromLocationId || controller.locationId===toLocationId);
}
