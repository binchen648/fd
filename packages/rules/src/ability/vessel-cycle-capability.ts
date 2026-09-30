import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, PlayerId, RuleNode } from './types';
import { terrainAdvantageAtLocation } from './terrain-advantage-override';

export const VESSEL_CYCLE_INITIALIZE_EFFECT = 'vessel_cycle_initialize' as const;
export const VESSEL_CYCLE_SCHEDULE_EFFECT = 'vessel_cycle_schedule_reincarnation' as const;
export const VESSEL_CYCLE_RESOLVE_EFFECT = 'vessel_cycle_resolve_reincarnation' as const;
export const VESSEL_CYCLE_RECON_BONUS_EFFECT = 'vessel_cycle_recon_vp_bonus' as const;
export const VESSEL_CYCLE_SKILL_AURA_EFFECT = 'vessel_cycle_skill_aura' as const;
export const VESSEL_CYCLE_PLAY_EXCEPTION_EFFECT = 'vessel_cycle_definition_play_exception' as const;
export const VESSEL_CYCLE_DOUBLE_ACTIVE_EFFECT = 'vessel_cycle_double_active_definition_base_power' as const;
export const VESSEL_CYCLE_PLAYED_DEFINITION_EFFECT = 'vessel_cycle_played_definition_lifecycle' as const;
export const VESSEL_CYCLE_JOIN_LOCATION_EFFECT = 'vessel_cycle_join_location_definition_cards' as const;
export const VESSEL_CYCLE_ASCENSION_EFFECT = 'vessel_cycle_ascension_round_start' as const;

const PREFIX = '__fd_vessel_cycle:';
const privilegedTypes = new Set<string>([
  VESSEL_CYCLE_INITIALIZE_EFFECT, VESSEL_CYCLE_SCHEDULE_EFFECT, VESSEL_CYCLE_RESOLVE_EFFECT,
  VESSEL_CYCLE_RECON_BONUS_EFFECT, VESSEL_CYCLE_SKILL_AURA_EFFECT, VESSEL_CYCLE_PLAY_EXCEPTION_EFFECT,
  VESSEL_CYCLE_DOUBLE_ACTIVE_EFFECT, VESSEL_CYCLE_PLAYED_DEFINITION_EFFECT,
  VESSEL_CYCLE_JOIN_LOCATION_EFFECT, VESSEL_CYCLE_ASCENSION_EFFECT,
]);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function key(value: unknown): value is string { return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value); }
function id(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 160; }
function commonEmpty(a: AuthoringAbility): boolean {
  return a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 && a.ruleModifiers.length === 0 &&
    a.creates.length === 0 && empty(a.lifecycle) && empty(a.limit) && empty(a.visibility) &&
    exactKeys(a.responseWindow, ['order','passBehavior']) && a.responseWindow.order === 'turn_order' &&
    a.responseWindow.passBehavior === 'decline_this_window' && a.execution.mode === 'automatic' &&
    Array.isArray(a.execution.allowedOperations) && a.execution.allowedOperations.length === 0;
}
function markerCommon(a: AuthoringAbility): boolean {
  return a.kind === 'passive' && empty(a.activation) && commonEmpty(a) && a.effects.length === 1;
}
function forced(a: AuthoringAbility, trigger: string): boolean {
  return a.kind === 'forced_trigger' && a.activation.trigger === trigger && exactKeys(a.activation, ['trigger']) && commonEmpty(a) && a.effects.length === 1;
}
function phaseAction(a: AuthoringAbility): boolean {
  return a.kind === 'phase_action' && a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    exactKeys(a.activation, ['phase','opens']) && commonEmpty(a) && a.effects.length === 1;
}
function optionalDeploy(a: AuthoringAbility): boolean {
  return a.kind === 'optional_trigger' && a.activation.trigger === 'after_player_deployed_to_battlefield' && exactKeys(a.activation, ['trigger']) &&
    a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 && a.ruleModifiers.length === 0 && a.creates.length === 0 &&
    empty(a.lifecycle) && empty(a.limit) && empty(a.visibility) && exactKeys(a.responseWindow, ['opens','order','passBehavior']) &&
    a.responseWindow.opens === 'after_player_deployed_to_battlefield' && a.responseWindow.order === 'turn_order' &&
    a.responseWindow.passBehavior === 'decline_this_window' && a.execution.mode === 'automatic' &&
    a.execution.allowedOperations.length === 0 && a.effects.length === 1;
}
function ascensionShape(a: AuthoringAbility): boolean {
  if (a.kind !== 'optional_trigger' || a.activation.trigger !== 'round_start' || !exactKeys(a.activation, ['trigger']) ||
      a.conditions.length !== 0 || a.targets.length !== 1 || a.cost.length !== 0 || a.ruleModifiers.length !== 0 || a.creates.length !== 0 ||
      !empty(a.lifecycle) || !empty(a.limit) || !empty(a.visibility) || !exactKeys(a.responseWindow, ['opens','order','passBehavior']) ||
      a.responseWindow.opens !== 'round_start' || a.responseWindow.order !== 'turn_order' ||
      a.responseWindow.passBehavior !== 'decline_this_window' || a.execution.mode !== 'automatic' ||
      a.execution.allowedOperations.length !== 0 || a.effects.length !== 1) return false;
  const t = a.targets[0]!; const count = t.count as RuleNode;
  return t.type === 'location' && id(t.id) && exactKeys(t, ['id','type','count','constraints']) &&
    count.min === 1 && count.max === 1 && exactKeys(count, ['min','max']) && Array.isArray(t.constraints) && t.constraints.length === 1 &&
    (t.constraints[0] as RuleNode).type === 'any_battlefield' && exactKeys(t.constraints[0] as RuleNode, ['type']);
}

export function isVesselCycleInitializeEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_INITIALIZE_EFFECT && key(e.cycleKey) && id(e.initialVessel) && id(e.middleVessel) && id(e.finalVessel) &&
    e.firstMaxVp === 5 && e.middleMaxVp === 10 && e.firstVpMultiplier === 2 && e.middleVpDivisor === 2 && e.middleVpRounding === 'ceil' &&
    e.repeatPenaltyVp === 3 && e.lossMargin === 5 && id(e.temporaryDefinitionId) && id(e.ascensionDefinitionId) && e.temporaryKeep === 2 &&
    exactKeys(e, ['type','cycleKey','initialVessel','middleVessel','finalVessel','firstMaxVp','middleMaxVp','firstVpMultiplier','middleVpDivisor','middleVpRounding','repeatPenaltyVp','lossMargin','temporaryDefinitionId','ascensionDefinitionId','temporaryKeep']);
}
function simpleCycle(e: RuleNode, type: string): boolean { return e.type === type && key(e.cycleKey) && exactKeys(e, ['type','cycleKey']); }
export function isVesselCycleScheduleEffect(e: RuleNode): boolean { return simpleCycle(e, VESSEL_CYCLE_SCHEDULE_EFFECT); }
export function isVesselCycleResolveEffect(e: RuleNode): boolean { return simpleCycle(e, VESSEL_CYCLE_RESOLVE_EFFECT); }
export function isVesselCycleReconBonusEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_RECON_BONUS_EFFECT && key(e.cycleKey) && id(e.vessel) && e.amount === 1 && exactKeys(e,['type','cycleKey','vessel','amount']);
}
export function isVesselCycleSkillAuraEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_SKILL_AURA_EFFECT && key(e.cycleKey) && id(e.vessel) && id(e.requiredDefinitionId) &&
    e.targetCardType === 'master_skill' && e.costDelta === -1 && e.powerDelta === 1 &&
    exactKeys(e,['type','cycleKey','vessel','requiredDefinitionId','targetCardType','costDelta','powerDelta']);
}
export function isVesselCyclePlayExceptionEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_PLAY_EXCEPTION_EFFECT && key(e.cycleKey) && id(e.vessel) && id(e.targetDefinitionId) &&
    e.requirementType === 'skill_zone_mana_at_least' && e.threshold === 8 &&
    exactKeys(e,['type','cycleKey','vessel','targetDefinitionId','requirementType','threshold']);
}
export function isVesselCycleDoubleActiveEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_DOUBLE_ACTIVE_EFFECT && key(e.cycleKey) && id(e.vessel) && id(e.targetDefinitionId) && e.multiplier === 2 &&
    exactKeys(e,['type','cycleKey','vessel','targetDefinitionId','multiplier']);
}
export function isVesselCyclePlayedDefinitionEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_PLAYED_DEFINITION_EFFECT && key(e.cycleKey) && id(e.vessel) && id(e.targetDefinitionId) &&
    e.lowManaThreshold === 8 && e.lowManaPowerBonus === 3 && e.normalClose === true && e.createTemporaryAtControllerLocation === true &&
    exactKeys(e,['type','cycleKey','vessel','targetDefinitionId','lowManaThreshold','lowManaPowerBonus','normalClose','createTemporaryAtControllerLocation']);
}
export function isVesselCycleJoinLocationEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_JOIN_LOCATION_EFFECT && key(e.cycleKey) && id(e.targetDefinitionId) && e.powerBonus === 2 && e.requiresPositiveTerrain === true &&
    exactKeys(e,['type','cycleKey','targetDefinitionId','powerBonus','requiresPositiveTerrain']);
}
export function isVesselCycleAscensionEffect(e: RuleNode): boolean {
  return e.type === VESSEL_CYCLE_ASCENSION_EFFECT && key(e.cycleKey) && id(e.targetDefinitionId) && id(e.target) && e.oncePerRound === true &&
    exactKeys(e,['type','cycleKey','targetDefinitionId','target','oncePerRound']);
}

export function isAcceptedVesselCycleAbility(a: AuthoringAbility): boolean {
  const e=a.effects[0]; if(!e) return false;
  if (isVesselCycleInitializeEffect(e)) return forced(a,'game_start');
  if (isVesselCycleScheduleEffect(e)) return forced(a,'after_controller_loses_battle');
  if (isVesselCycleResolveEffect(e)) return forced(a,'round_start');
  if (isVesselCycleReconBonusEffect(e) || isVesselCycleSkillAuraEffect(e) || isVesselCyclePlayExceptionEffect(e)) return markerCommon(a);
  if (isVesselCycleDoubleActiveEffect(e)) return phaseAction(a);
  if (isVesselCyclePlayedDefinitionEffect(e)) return forced(a,'on_card_played');
  if (isVesselCycleJoinLocationEffect(e)) return optionalDeploy(a);
  if (isVesselCycleAscensionEffect(e)) return ascensionShape(a) && e.target === a.targets[0]!.id;
  return false;
}
export function containsVesselCyclePrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsVesselCyclePrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const n=value as RuleNode; if(privilegedTypes.has(String(n.type))) return true;
  return Object.values(n).some(containsVesselCyclePrivilegedNode);
}

type InitEffect = RuleNode & { cycleKey:string; initialVessel:string; middleVessel:string; finalVessel:string; temporaryDefinitionId:string; ascensionDefinitionId:string };
function flags(state: GameState, playerId: PlayerId): Record<string, boolean|string|number> {
  const r=state.abilityRuntime; if(!r) throw new Error('VESSEL_CYCLE_RUNTIME_REQUIRED');
  return (r.structuredPlayerFlagsByPlayer ??= {})[playerId] ??= {};
}
function k(cycle:string, field:string){ return `${PREFIX}${cycle}:${field}`; }
function provider(state: GameState, controllerId: PlayerId, cycleKey: string): { sourceId:string; ability:AuthoringAbility; effect:InitEffect }|undefined {
  const r=state.abilityRuntime; if(!r) return undefined;
  for(const c of state.cards){
    if(c.ownerPlayerId!==controllerId || c.controllerPlayerId!==controllerId || ['discard','removed_from_game'].includes(c.zone)) continue;
    const d=r.pack.cards[c.definitionId]; if(!d) continue;
    for(const a of d.abilities){ const e=a.effects[0]; if(e && isVesselCycleInitializeEffect(e) && e.cycleKey===cycleKey && isAcceptedVesselCycleAbility(a)) return {sourceId:c.instanceId,ability:a,effect:e as InitEffect}; }
  }
  return undefined;
}
function current(state:GameState,p:PlayerId,cycle:string): string|undefined { const v=flags(state,p)[k(cycle,'current')]; return typeof v==='string'?v:undefined; }
function boolFlag(state:GameState,p:PlayerId,cycle:string,field:string):boolean { return flags(state,p)[k(cycle,field)]===true; }
function setVisited(state:GameState,p:PlayerId,cycle:string,vessel:string){ flags(state,p)[k(cycle,`visited:${vessel}`)]=true; }
function allVisited(state:GameState,p:PlayerId,e:InitEffect):boolean { return [e.initialVessel,e.middleVessel,e.finalVessel].every(v=>boolFlag(state,p,e.cycleKey,`visited:${v}`)); }
function points(state:GameState,p:PlayerId,cycle:string):number { const v=Number(flags(state,p)[k(cycle,'points')]??0); if(!Number.isSafeInteger(v)||v<0) throw new Error('VESSEL_CYCLE_POINTS_INVALID'); return v; }
function setPoints(state:GameState,p:PlayerId,cycle:string,v:number){ if(!Number.isSafeInteger(v)||v<0) throw new Error('VESSEL_CYCLE_POINTS_INVALID'); flags(state,p)[k(cycle,'points')]=v; }
function baseline(state:GameState,p:PlayerId,cycle:string):number|undefined { const v=flags(state,p)[k(cycle,'vpBaseline')]; return typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:undefined; }

type CardRoundMarker = { round:number; amount:number; sourceCardId:string; abilityId:string; definitionId:string };
function encodeMarker(marker:CardRoundMarker):string { return JSON.stringify(marker); }
function decodeMarker(value:unknown):CardRoundMarker|undefined {
  if(typeof value!=='string') return undefined; try { const v=JSON.parse(value) as Record<string,unknown>; const keys=Object.keys(v).sort();
    if(keys.join('|')!=='abilityId|amount|definitionId|round|sourceCardId' || !Number.isSafeInteger(v.round) || !Number.isSafeInteger(v.amount) || typeof v.sourceCardId!=='string' || typeof v.abilityId!=='string' || typeof v.definitionId!=='string') return undefined;
    return v as unknown as CardRoundMarker; } catch { return undefined; }
}
function cardMarkerKey(cycle:string,kind:'bonus'|'multiplier'|'lowMana',instanceId:string){ return k(cycle,`card:${kind}:${instanceId}`); }
function setCardMarker(state:GameState,p:PlayerId,cycle:string,kind:'bonus'|'multiplier'|'lowMana',instanceId:string,amount:number,sourceCardId:string,abilityId:string,definitionId:string){ flags(state,p)[cardMarkerKey(cycle,kind,instanceId)]=encodeMarker({round:state.round.roundNumber,amount,sourceCardId,abilityId,definitionId}); }
function liveCardMarker(state:GameState,p:PlayerId,cycle:string,kind:'bonus'|'multiplier'|'lowMana',instanceId:string):CardRoundMarker|undefined { const m=decodeMarker(flags(state,p)[cardMarkerKey(cycle,kind,instanceId)]); return m?.round===state.round.roundNumber?m:undefined; }

export function reconcileVesselCycleVictoryPoints(state:GameState):void {
  if(!state.abilityRuntime) return;
  for(const p of state.players){
    const bag=state.abilityRuntime.structuredPlayerFlagsByPlayer?.[p.id]; if(!bag) continue;
    for(const raw of Object.keys(bag).filter(x=>x.startsWith(PREFIX)&&x.endsWith(':current'))){
      const cycle=raw.slice(PREFIX.length,-':current'.length); if(!provider(state,p.id,cycle)) continue;
      const before=baseline(state,p.id,cycle); if(before===undefined){ bag[k(cycle,'vpBaseline')]=p.vp; continue; }
      if(!Number.isSafeInteger(p.vp)||p.vp<0) throw new Error('VESSEL_CYCLE_VP_INVALID');
      if(p.vp>before) setPoints(state,p.id,cycle,points(state,p.id,cycle)+(p.vp-before));
      bag[k(cycle,'vpBaseline')]=p.vp;
    }
  }
}

function matchingMarkerAbilities(state:GameState, controllerId:PlayerId, predicate:(e:RuleNode)=>boolean):Array<{sourceId:string;ability:AuthoringAbility;effect:RuleNode}>{
  const r=state.abilityRuntime; if(!r)return[]; const out=[] as Array<{sourceId:string;ability:AuthoringAbility;effect:RuleNode}>;
  for(const c of state.cards){ if(c.ownerPlayerId!==controllerId||c.controllerPlayerId!==controllerId||['discard','removed_from_game'].includes(c.zone))continue; const d=r.pack.cards[c.definitionId]; if(!d)continue;
    for(const a of d.abilities){const e=a.effects[0]; if(e&&predicate(e)&&isAcceptedVesselCycleAbility(a))out.push({sourceId:c.instanceId,ability:a,effect:e});}
  } return out;
}
export function vesselCycleReconBonus(state:GameState,controllerId:PlayerId):number {
  let total=0; for(const m of matchingMarkerAbilities(state,controllerId,isVesselCycleReconBonusEffect)){ if(current(state,controllerId,String(m.effect.cycleKey))===m.effect.vessel) total+=Number(m.effect.amount); } return total;
}
function controlsDefinition(state:GameState,p:PlayerId,definitionId:string):boolean { return state.cards.some(c=>c.controllerPlayerId===p&&c.definitionId===definitionId&&!['discard','removed_from_game'].includes(c.zone)); }
export function vesselCycleSkillAura(state:GameState,controllerId:PlayerId,definitionId:string,cardType:string):{costDelta:number;powerDelta:number}{
  let costDelta=0,powerDelta=0; for(const m of matchingMarkerAbilities(state,controllerId,isVesselCycleSkillAuraEffect)){const e=m.effect; if(cardType!==e.targetCardType||current(state,controllerId,String(e.cycleKey))!==e.vessel||!controlsDefinition(state,controllerId,String(e.requiredDefinitionId)))continue; costDelta+=Number(e.costDelta);powerDelta+=Number(e.powerDelta);} return {costDelta,powerDelta};
}
export function vesselCyclePlayRequirementWaived(state:GameState,controllerId:PlayerId,definitionId:string,requirementType:string,requirementValue:number):boolean {
  return Number.isSafeInteger(requirementValue) && matchingMarkerAbilities(state,controllerId,isVesselCyclePlayExceptionEffect).some(m=>m.effect.targetDefinitionId===definitionId&&m.effect.requirementType===requirementType&&Number(m.effect.threshold)===requirementValue&&current(state,controllerId,String(m.effect.cycleKey))===m.effect.vessel);
}
export function rememberVesselCyclePlayProvenance(state:GameState,controllerId:PlayerId,instanceId:string,prePaymentMana:number):void {
  if(!Number.isSafeInteger(prePaymentMana)||prePaymentMana<0) throw new Error('VESSEL_CYCLE_PREPAY_MANA_INVALID');
  const c=state.cards.find(x=>x.instanceId===instanceId); if(!c)return;
  for(const m of matchingMarkerAbilities(state,controllerId,isVesselCyclePlayExceptionEffect)){
    if(m.effect.targetDefinitionId!==c.definitionId||current(state,controllerId,String(m.effect.cycleKey))!==m.effect.vessel)continue;
    if(prePaymentMana<Number(m.effect.threshold)) setCardMarker(state,controllerId,String(m.effect.cycleKey),'lowMana',instanceId,1,m.sourceId,m.ability.id,c.definitionId);
  }
}
function temporaryCards(state:GameState,p:PlayerId,definitionId:string){ return state.cards.filter(c=>c.ownerPlayerId===p&&c.definitionId===definitionId&&!!c.generatedBy&&!['removed_from_game'].includes(c.zone)); }
function createTemp(state:GameState,p:PlayerId,cycle:string,definitionId:string,generatedBy:string,locationId:string):string{
  const r=state.abilityRuntime!; const seq=Number(flags(state,p)[k(cycle,'serial')]??0)+1; flags(state,p)[k(cycle,'serial')]=seq; const instanceId=`${p}:vessel-generated:${seq}`;
  state.cards.push({instanceId,definitionId,ownerPlayerId:p,controllerPlayerId:p,zone:'field',visibility:{scope:'public'},generatedBy});
  r.cardState[instanceId]={active:true,faceDown:false,playedRound:state.round.roundNumber,placedAtLocationId:locationId}; return instanceId;
}
function closeToSkill(state:GameState,instanceId:string){ const c=state.cards.find(x=>x.instanceId===instanceId); const st=state.abilityRuntime?.cardState[instanceId]; if(!c||!st)return; c.zone='skill';c.controllerPlayerId=c.ownerPlayerId;c.visibility={scope:'owner_only',ownerPlayerId:c.ownerPlayerId};st.active=false;st.faceDown=false;delete st.basePowerMultiplier; }

export function canExecuteVesselCycleEffect(state:GameState,ctx:EffectContext,e:RuleNode):boolean {
  if(!key(e.cycleKey)||!provider(state,ctx.controllerId,String(e.cycleKey)))return false;
  if(isVesselCycleDoubleActiveEffect(e)) return current(state,ctx.controllerId,String(e.cycleKey))===e.vessel && state.cards.some(c=>c.controllerPlayerId===ctx.controllerId&&c.definitionId===e.targetDefinitionId&&c.zone==='attack_area'&&state.abilityRuntime?.cardState[c.instanceId]?.active===true);
  if(isVesselCycleAscensionEffect(e)) return boolFlag(state,ctx.controllerId,String(e.cycleKey),'ultimate') && Number(flags(state,ctx.controllerId)[k(String(e.cycleKey),'climaxRound')]??0)!==state.round.roundNumber && ((state as unknown as {modeState?:{currentSituationIsClimax?:boolean}}).modeState?.currentSituationIsClimax===true || state.round.roundNumber>=9);
  return true;
}

export function resolveVesselCycleEffect(state:GameState,ctx:EffectContext,a:AuthoringAbility,e:RuleNode):boolean {
  if(!privilegedTypes.has(String(e.type)))return false; if(!isAcceptedVesselCycleAbility(a))throw new Error('VESSEL_CYCLE_ABILITY_INVALID');
  const p=state.players.find(x=>x.id===ctx.controllerId); if(!p)throw new Error('VESSEL_CYCLE_CONTROLLER_MISSING');
  if(isVesselCycleInitializeEffect(e)){
    const bag=flags(state,p.id), cycle=String(e.cycleKey); bag[k(cycle,'current')]=String(e.initialVessel);bag[k(cycle,'points')]=0;bag[k(cycle,'vpBaseline')]=p.vp;bag[k(cycle,'providerSource')]=ctx.sourceCardId;bag[k(cycle,'providerAbility')]=ctx.abilityId;setVisited(state,p.id,cycle,String(e.initialVessel));return true;
  }
  const cycle=String(e.cycleKey); const init=provider(state,p.id,cycle); if(!init)throw new Error('VESSEL_CYCLE_PROVIDER_INVALID');
  if(isVesselCycleScheduleEffect(e)){
    const ev=ctx.event; if(!ev||ev.playerId!==p.id)return true; let qualifies=state.abilityRuntime?.battleDefeatRoundByPlayer?.[p.id]===state.round.roundNumber;
    if(ev.battleParticipantPowers&&ev.battleResult?.winners?.length){const own=Number(ev.battleParticipantPowers[p.id]);const winning=Math.max(...ev.battleResult.winners.map(x=>Number(ev.battleParticipantPowers![x])).filter(Number.isFinite));if(Number.isFinite(own)&&Number.isFinite(winning)&&winning-own>=Number(init.effect.lossMargin))qualifies=true;}
    if(qualifies&&!boolFlag(state,p.id,cycle,'ultimate'))flags(state,p.id)[k(cycle,'pendingRound')]=state.round.roundNumber+1; return true;
  }
  if(isVesselCycleResolveEffect(e)){
    const bag=flags(state,p.id); if(Number(bag[k(cycle,'pendingRound')]??-1)!==state.round.roundNumber||boolFlag(state,p.id,cycle,'ultimate'))return true;
    const raw=points(state,p.id,cycle), cur=current(state,p.id,cycle)!; let adjusted=raw;if(cur===init.effect.initialVessel)adjusted*=Number(init.effect.firstVpMultiplier);else if(cur===init.effect.middleVessel)adjusted=Math.ceil(raw/Number(init.effect.middleVpDivisor));
    const next=adjusted<=Number(init.effect.firstMaxVp)?String(init.effect.initialVessel):adjusted<=Number(init.effect.middleMaxVp)?String(init.effect.middleVessel):String(init.effect.finalVessel);
    if(next===cur)p.vp=Math.max(0,p.vp-Number(init.effect.repeatPenaltyVp));bag[k(cycle,'current')]=next;setVisited(state,p.id,cycle,next);setPoints(state,p.id,cycle,0);delete bag[k(cycle,'pendingRound')];bag[k(cycle,'vpBaseline')]=p.vp;
    const temps=temporaryCards(state,p.id,String(init.effect.temporaryDefinitionId)); while(temps.length>Number(init.effect.temporaryKeep)){const c=temps.shift()!;c.zone='removed_from_game';const st=state.abilityRuntime!.cardState[c.instanceId];if(st){st.active=false;st.faceDown=false;}}
    if(allVisited(state,p.id,init.effect)){ bag[k(cycle,'ultimate')]=true; if(!state.cards.some(c=>c.ownerPlayerId===p.id&&c.definitionId===init.effect.ascensionDefinitionId&&c.zone!=='removed_from_game')){ const instanceId=`${p.id}:vessel-ascension:${cycle}`; state.cards.push({instanceId,definitionId:init.effect.ascensionDefinitionId,ownerPlayerId:p.id,controllerPlayerId:p.id,zone:'skill',visibility:{scope:'owner_only',ownerPlayerId:p.id}}); state.abilityRuntime!.cardState[instanceId]={active:false,faceDown:false,playedRound:state.round.roundNumber}; } } return true;
  }
  if(isVesselCycleDoubleActiveEffect(e)){
    if(current(state,p.id,cycle)!==e.vessel)throw new Error('VESSEL_CYCLE_WRONG_VESSEL');const cards=state.cards.filter(c=>c.controllerPlayerId===p.id&&c.definitionId===e.targetDefinitionId&&c.zone==='attack_area'&&state.abilityRuntime!.cardState[c.instanceId]?.active===true&&state.abilityRuntime!.cardState[c.instanceId]?.faceDown!==true);if(!cards.length)throw new Error('VESSEL_CYCLE_NO_ACTIVE_TARGET');
    const cost=cards.reduce((sum,c)=>sum+Number(state.abilityRuntime!.pack.cards[c.definitionId]?.cardFace.cost??0),0);if(!Number.isSafeInteger(cost)||p.mana<cost)throw new Error('VESSEL_CYCLE_INSUFFICIENT_MANA');p.mana-=cost;for(const c of cards)setCardMarker(state,p.id,cycle,'multiplier',c.instanceId,2,ctx.sourceCardId,a.id,c.definitionId);return true;
  }
  if(isVesselCyclePlayedDefinitionEffect(e)){
    if(ctx.event?.sourceCardId!==ctx.sourceCardId||ctx.event.playerId!==p.id)return true;const c=state.cards.find(x=>x.instanceId===ctx.sourceCardId);if(!c||c.definitionId!==e.targetDefinitionId)return true;const low=liveCardMarker(state,p.id,cycle,'lowMana',c.instanceId); delete flags(state,p.id)[cardMarkerKey(cycle,'lowMana',c.instanceId)];
    if(low&&current(state,p.id,cycle)===e.vessel){setCardMarker(state,p.id,cycle,'bonus',c.instanceId,Number(e.lowManaPowerBonus),ctx.sourceCardId,a.id,c.definitionId);return true;}
    closeToSkill(state,c.instanceId);if(p.locationId)createTemp(state,p.id,cycle,c.definitionId,c.instanceId,p.locationId);return true;
  }
  if(isVesselCycleJoinLocationEffect(e)){
    if(ctx.event?.playerId!==p.id||!ctx.event.locationId||p.locationId!==ctx.event.locationId)return true; if(e.requiresPositiveTerrain===true && terrainAdvantageAtLocation(state,p.id,p.locationId as any)<=0)return true; for(const c of state.cards.filter(x=>x.ownerPlayerId===p.id&&x.definitionId===e.targetDefinitionId&&x.zone==='field'&&state.abilityRuntime!.cardState[x.instanceId]?.placedAtLocationId===p.locationId)){c.zone='attack_area';c.visibility={scope:'public'};const st=state.abilityRuntime!.cardState[c.instanceId]!;st.active=true;st.faceDown=false;setCardMarker(state,p.id,cycle,'bonus',c.instanceId,Number(e.powerBonus),ctx.sourceCardId,a.id,c.definitionId);}return true;
  }
  if(isVesselCycleAscensionEffect(e)){
    if(!canExecuteVesselCycleEffect(state,ctx,e))throw new Error('VESSEL_CYCLE_ASCENSION_INACTIVE');const location=ctx.selections[String(e.target)]?.[0];if(!location)throw new Error('VESSEL_CYCLE_ASCENSION_LOCATION_REQUIRED');createTemp(state,p.id,cycle,String(e.targetDefinitionId),ctx.sourceCardId,location);flags(state,p.id)[k(cycle,'climaxRound')]=state.round.roundNumber;return true;
  }
  // Marker effects are queried by shared cost/power/reward gates and never mutate directly.
  if(isVesselCycleReconBonusEffect(e)||isVesselCycleSkillAuraEffect(e)||isVesselCyclePlayExceptionEffect(e))return true;
  return false;
}


export function isVesselCycleRuntimeProvenanceValidForRestore(state:GameState):boolean {
  try { const r=state.abilityRuntime; if(!r) return true;
    for(const p of state.players){ const bag=r.structuredPlayerFlagsByPlayer?.[p.id]??{}; const cycleKeys=Object.keys(bag).filter(x=>x.startsWith(PREFIX)&&x.endsWith(':current'));
      for(const currentKey of cycleKeys){ const cycle=currentKey.slice(PREFIX.length,-':current'.length); const prov=provider(state,p.id,cycle); if(!prov)return false; const e=prov.effect; const allowedVessels=[e.initialVessel,e.middleVessel,e.finalVessel];
        if(bag[k(cycle,'providerSource')]!==prov.sourceId||bag[k(cycle,'providerAbility')]!==prov.ability.id||!allowedVessels.includes(String(bag[currentKey])))return false;
        if(!Number.isSafeInteger(bag[k(cycle,'points')])||Number(bag[k(cycle,'points')])<0||!Number.isSafeInteger(bag[k(cycle,'vpBaseline')])||Number(bag[k(cycle,'vpBaseline')])<0)return false;
        const pending=bag[k(cycle,'pendingRound')]; if(pending!==undefined&&(!Number.isSafeInteger(pending)||Number(pending)<state.round.roundNumber||Number(pending)>state.round.roundNumber+1))return false;
        for(const v of allowedVessels){ const seen=bag[k(cycle,`visited:${v}`)]; if(seen!==undefined&&seen!==true)return false; } if(boolFlag(state,p.id,cycle,'ultimate')&&!allVisited(state,p.id,e))return false;
        const serial=bag[k(cycle,'serial')]; if(serial!==undefined&&(!Number.isSafeInteger(serial)||Number(serial)<0))return false; const climax=bag[k(cycle,'climaxRound')]; if(climax!==undefined&&(!Number.isSafeInteger(climax)||Number(climax)<1||Number(climax)>state.round.roundNumber))return false;
        const prefix=k(cycle,'card:'); for(const [flagKey,value] of Object.entries(bag).filter(([x])=>x.startsWith(prefix))){ const rest=flagKey.slice(prefix.length); const sep=rest.indexOf(':'); if(sep<1)return false; const kind=rest.slice(0,sep); const instanceId=rest.slice(sep+1); if(!['bonus','multiplier','lowMana'].includes(kind))return false; const marker=decodeMarker(value); const physical=state.cards.find(c=>c.instanceId===instanceId); const source=marker?state.cards.find(c=>c.instanceId===marker.sourceCardId):undefined; const def=source?r.pack.cards[source.definitionId]:undefined; const ability=def?.abilities.find(a=>a.id===marker?.abilityId); if(!marker||!physical||marker.definitionId!==physical.definitionId||marker.round<state.round.roundNumber-1||marker.round>state.round.roundNumber||!source||source.controllerPlayerId!==p.id||!ability||!isAcceptedVesselCycleAbility(ability))return false; if(kind==='bonus'&&![2,3].includes(marker.amount))return false; if(kind==='multiplier'&&marker.amount!==2)return false; if(kind==='lowMana'&&marker.amount!==1)return false; }
        const legalPrefix=k(cycle,''); for(const flagKey of Object.keys(bag).filter(x=>x.startsWith(legalPrefix))){ const field=flagKey.slice(legalPrefix.length); if(['current','points','vpBaseline','providerSource','providerAbility','pendingRound','ultimate','climaxRound','serial'].includes(field)||field.startsWith('visited:')||field.startsWith('card:'))continue; return false; }
      }
      if(Object.keys(bag).some(x=>x.startsWith(PREFIX)&&!cycleKeys.some(c=>x.startsWith(c.slice(0,-'current'.length))))) { const cycles=new Set(cycleKeys.map(c=>c.slice(0,-'current'.length))); if(Object.keys(bag).some(x=>x.startsWith(PREFIX)&&![...cycles].some(prefix=>x.startsWith(prefix))))return false; }
    } return true; } catch { return false; }
}

export function vesselCycleCardPowerAdjustment(state:GameState,controllerId:PlayerId,instanceId:string):{bonus:number;multiplier:number}{
  let bonus=0,multiplier=1; const bag=state.abilityRuntime?.structuredPlayerFlagsByPlayer?.[controllerId]??{};
  for(const raw of Object.keys(bag).filter(x=>x.startsWith(PREFIX)&&x.endsWith(':current'))){ const cycle=raw.slice(PREFIX.length,-':current'.length);
    const b=liveCardMarker(state,controllerId,cycle,'bonus',instanceId); if(b) bonus+=b.amount; const m=liveCardMarker(state,controllerId,cycle,'multiplier',instanceId); if(m) multiplier*=m.amount; }
  return {bonus,multiplier};
}

export function vesselCycleStateForTest(state:GameState,controllerId:PlayerId,cycle:string){const b=flags(state,controllerId);return {current:b[k(cycle,'current')],points:b[k(cycle,'points')],pendingRound:b[k(cycle,'pendingRound')],ultimate:b[k(cycle,'ultimate')]===true};}
