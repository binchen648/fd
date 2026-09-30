import type { GameState } from '../schema/game';
import type { AuthoringAbility, ManaContributionChoice, PlayerId, RuleNode } from './types';
import { getBloodlustContributionAuthority, isBloodlustContributionServerAuthorityConsistent } from './bloodlust-contribution-authority';

export const BLOODLUST_INITIALIZE_EFFECT = 'bloodlust_initialize' as const;
export const BLOODLUST_CAGING_CONTRIBUTION_EFFECT = 'bloodlust_same_battlefield_mana_contribution' as const;
export const BLOODLUST_SPEND_TRACKER_EFFECT = 'bloodlust_track_controller_mana_spend' as const;
export const BLOODLUST_COMBAT_DECAY_EFFECT = 'bloodlust_decay_after_battle' as const;
export const BLOODLUST_THRESHOLD_EFFECT = 'bloodlust_threshold_rules' as const;
export const BLOODLUST_ACTION_EFFECT = 'bloodlust_low_threshold_action' as const;
export const BLOODLUST_TRANSFORM_EFFECT = 'bloodlust_transform_at_round_end' as const;
export const BLOODLUST_ASCENSION_EFFECT = 'bloodlust_ascension_modifier_and_plunder' as const;

const PREFIX = '__fd_bloodlust:';
const privileged = new Set<string>([
  BLOODLUST_INITIALIZE_EFFECT, BLOODLUST_CAGING_CONTRIBUTION_EFFECT, BLOODLUST_SPEND_TRACKER_EFFECT,
  BLOODLUST_COMBAT_DECAY_EFFECT, BLOODLUST_THRESHOLD_EFFECT, BLOODLUST_ACTION_EFFECT,
  BLOODLUST_TRANSFORM_EFFECT, BLOODLUST_ASCENSION_EFFECT,
]);
function exactKeys(v: RuleNode, keys: readonly string[]): boolean { const a=Object.keys(v); return a.length===keys.length&&a.every(k=>keys.includes(k)); }
function empty(v: RuleNode): boolean { return Object.keys(v).length===0; }
function key(v: unknown): v is string { return typeof v==='string'&&/^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(v); }
function id(v: unknown): v is string { return typeof v==='string'&&v.length>0&&v.length<=160; }
function auto(a: AuthoringAbility): boolean { return a.execution.mode==='automatic'&&Array.isArray(a.execution.allowedOperations)&&a.execution.allowedOperations.length===0; }
function common(a: AuthoringAbility): boolean { return a.conditions.length===0&&a.targets.length===0&&a.cost.length===0&&a.ruleModifiers.length===0&&a.creates.length===0&&empty(a.lifecycle)&&empty(a.limit)&&empty(a.visibility)&&exactKeys(a.responseWindow,['order','passBehavior'])&&a.responseWindow.order==='turn_order'&&a.responseWindow.passBehavior==='decline_this_window'&&auto(a); }
function marker(a: AuthoringAbility): boolean { return a.kind==='passive'&&empty(a.activation)&&common(a)&&a.effects.length===1; }
function forced(a: AuthoringAbility, trigger: string): boolean { return a.kind==='forced_trigger'&&a.activation.trigger===trigger&&exactKeys(a.activation,['trigger'])&&common(a)&&a.effects.length===1; }
function phaseAction(a: AuthoringAbility): boolean { return a.kind==='phase_action'&&a.activation.phase==='action'&&a.activation.opens==='controller_action_window'&&exactKeys(a.activation,['phase','opens'])&&common(a)&&a.effects.length===1; }

export function isBloodlustInitializeEffect(e: RuleNode): boolean { return e.type===BLOODLUST_INITIALIZE_EFFECT&&key(e.resourceKey)&&e.initial===0&&exactKeys(e,['type','resourceKey','initial']); }
export function isBloodlustCagingContributionEffect(e: RuleNode): boolean { return e.type===BLOODLUST_CAGING_CONTRIBUTION_EFFECT&&key(e.resourceKey)&&e.amountPerOpponentPerRound===1&&e.minimumOpponentMana===6&&e.requireSameBattlefield===true&&exactKeys(e,['type','resourceKey','amountPerOpponentPerRound','minimumOpponentMana','requireSameBattlefield']); }
export function isBloodlustSpendTrackerEffect(e: RuleNode): boolean { return e.type===BLOODLUST_SPEND_TRACKER_EFFECT&&key(e.resourceKey)&&e.gainPerManaSpent===1&&exactKeys(e,['type','resourceKey','gainPerManaSpent']); }
export function isBloodlustCombatDecayEffect(e: RuleNode): boolean { return e.type===BLOODLUST_COMBAT_DECAY_EFFECT&&key(e.resourceKey)&&e.minLoss===1&&e.maxLoss===3&&e.workshopMultiplier===2&&exactKeys(e,['type','resourceKey','minLoss','maxLoss','workshopMultiplier']); }
export function isBloodlustThresholdEffect(e: RuleNode): boolean { return e.type===BLOODLUST_THRESHOLD_EFFECT&&key(e.resourceKey)&&e.skillPowerThreshold===5&&e.skillPowerBonus===1&&e.playWaiverThreshold===10&&e.playRequirementType==='skill_zone_mana_at_least'&&e.playRequirementValue===8&&e.transformThreshold===15&&exactKeys(e,['type','resourceKey','skillPowerThreshold','skillPowerBonus','playWaiverThreshold','playRequirementType','playRequirementValue','transformThreshold']); }
export function isBloodlustActionEffect(e: RuleNode): boolean { return e.type===BLOODLUST_ACTION_EFFECT&&key(e.resourceKey)&&e.maximumResourceExclusive===5&&e.manaGain===1&&e.roundPowerGain===2&&e.resourceGain===3&&e.blockDecayThisRound===true&&exactKeys(e,['type','resourceKey','maximumResourceExclusive','manaGain','roundPowerGain','resourceGain','blockDecayThisRound']); }
export function isBloodlustTransformEffect(e: RuleNode): boolean { return e.type===BLOODLUST_TRANSFORM_EFFECT&&key(e.resourceKey)&&e.threshold===15&&e.lockValue===15&&e.removeAllCommandSeals===true&&e.manaGainMultiplier===2&&e.vpGainNumerator===1&&e.vpGainDenominator===2&&e.vpRounding==='floor'&&exactKeys(e,['type','resourceKey','threshold','lockValue','removeAllCommandSeals','manaGainMultiplier','vpGainNumerator','vpGainDenominator','vpRounding']); }
export function isBloodlustAscensionEffect(e: RuleNode): boolean { return e.type===BLOODLUST_ASCENSION_EFFECT&&key(e.resourceKey)&&e.transformedCostAdd===3&&e.transformedPowerAdd===4&&e.contributorPowerPenalty===-3&&exactKeys(e,['type','resourceKey','transformedCostAdd','transformedPowerAdd','contributorPowerPenalty']); }

export function isAcceptedBloodlustAbility(a: AuthoringAbility): boolean {
  const e=a.effects[0]; if(!e) return false;
  if(isBloodlustInitializeEffect(e)) return forced(a,'game_start');
  if(isBloodlustCagingContributionEffect(e)||isBloodlustSpendTrackerEffect(e)||isBloodlustThresholdEffect(e)||isBloodlustAscensionEffect(e)) return marker(a);
  if(isBloodlustCombatDecayEffect(e)) return forced(a,'after_battle_ended');
  if(isBloodlustActionEffect(e)) return phaseAction(a);
  if(isBloodlustTransformEffect(e)) return forced(a,'round_end');
  return false;
}
export function containsBloodlustPrivilegedNode(v: unknown): boolean { if(Array.isArray(v))return v.some(containsBloodlustPrivilegedNode); if(!v||typeof v!=='object')return false; const r=v as RuleNode; if(privileged.has(String(r.type)))return true; return Object.values(r).some(containsBloodlustPrivilegedNode); }

function runtime(s: GameState){ return s.abilityRuntime; }
function bag(s: GameState,p:PlayerId):Record<string,boolean|string|number>{ const r=runtime(s); if(!r)return {}; return (r.structuredPlayerFlagsByPlayer??={})[p]??={}; }
function rounds(s: GameState,p:PlayerId):Record<string,number>{ const r=runtime(s); if(!r)return {}; return (r.structuredRoundFlagKeysByPlayer??={})[p]??={}; }
function k(resource:string,suffix:string){return PREFIX+resource+':'+suffix;}
function presentSourceZones(zone:string){return ['skill','field','attack_area'].includes(zone);}
function sourceAbilities(s:GameState,p:PlayerId,pred:(a:AuthoringAbility)=>boolean){ const r=runtime(s); if(!r)return [] as Array<{sourceCardId:string;ability:AuthoringAbility}>; return s.cards.flatMap(c=>{if(c.ownerPlayerId!==p||c.controllerPlayerId!==p||!presentSourceZones(c.zone))return []; const d=r.pack.cards[c.definitionId]; return (d?.abilities??[]).filter(pred).map(ability=>({sourceCardId:c.instanceId,ability}));}); }
function provider(s:GameState,p:PlayerId,resource:string,pred:(a:AuthoringAbility)=>boolean){ return sourceAbilities(s,p,a=>pred(a)&&String(a.effects[0]?.resourceKey)===resource)[0]; }
export function bloodlustValue(s:GameState,p:PlayerId,resource:string):number{ const v=bag(s,p)[k(resource,'value')]; if(v===undefined)return 0; if(!Number.isSafeInteger(v)||Number(v)<0)throw new Error('BLOODLUST_INVALID'); return Number(v); }
export function bloodlustTransformed(s:GameState,p:PlayerId,resource:string):boolean{ return bag(s,p)[k(resource,'transformed')]===true; }
export function setBloodlustValue(s:GameState,p:PlayerId,resource:string,value:number){ if(!Number.isSafeInteger(value)||value<0)throw new Error('BLOODLUST_INVALID'); bag(s,p)[k(resource,'value')]=bloodlustTransformed(s,p,resource)?15:value; }
export function initializeBloodlust(s:GameState,p:PlayerId,sourceCardId:string,a:AuthoringAbility):void{ if(!isAcceptedBloodlustAbility(a)||!isBloodlustInitializeEffect(a.effects[0]!))throw new Error('BLOODLUST_INIT_INVALID'); const resource=String(a.effects[0]!.resourceKey); const b=bag(s,p); const player=s.players.find(x=>x.id===p); if(!player)throw new Error('BLOODLUST_PLAYER_MISSING'); b[k(resource,'value')]=0;b[k(resource,'providerSource')]=sourceCardId;b[k(resource,'providerAbility')]=a.id;b[k(resource,'vpBaseline')]=player.vp; }
export function notifyBloodlustManaSpent(s:GameState,p:PlayerId,amount:number):void{ if(amount<=0)return; for(const {ability} of sourceAbilities(s,p,isAcceptedBloodlustAbility)){ const e=ability.effects[0]!; if(!isBloodlustSpendTrackerEffect(e))continue; const resource=String(e.resourceKey); if(bloodlustTransformed(s,p,resource))continue; setBloodlustValue(s,p,resource,bloodlustValue(s,p,resource)+amount); } }
export function bloodlustManaGainMultiplier(s:GameState,p:PlayerId):number{ for(const {ability} of sourceAbilities(s,p,isAcceptedBloodlustAbility)){const e=ability.effects[0]!; if(isBloodlustTransformEffect(e)&&bloodlustTransformed(s,p,String(e.resourceKey)))return Number(e.manaGainMultiplier);} return 1; }
export function bloodlustVpGainAdjustment(s:GameState,p:PlayerId,amount:number):number{ if(amount<=0)return amount; for(const {ability} of sourceAbilities(s,p,isAcceptedBloodlustAbility)){const e=ability.effects[0]!; if(isBloodlustTransformEffect(e)&&bloodlustTransformed(s,p,String(e.resourceKey)))return Math.floor(amount*Number(e.vpGainNumerator)/Number(e.vpGainDenominator));} return amount; }
export function bloodlustPlayRequirementWaived(s:GameState,p:PlayerId,requirementType:string,value:number):boolean{ for(const {ability} of sourceAbilities(s,p,isAcceptedBloodlustAbility)){const e=ability.effects[0]!; if(!isBloodlustThresholdEffect(e))continue; const resource=String(e.resourceKey); if(!bloodlustTransformed(s,p,resource)&&bloodlustValue(s,p,resource)>=Number(e.playWaiverThreshold)&&requirementType===e.playRequirementType&&value===Number(e.playRequirementValue))return true;} return false; }
export function bloodlustSkillPowerBonus(s:GameState,p:PlayerId):number{ for(const {ability} of sourceAbilities(s,p,isAcceptedBloodlustAbility)){const e=ability.effects[0]!; if(isBloodlustThresholdEffect(e)){const resource=String(e.resourceKey); if(!bloodlustTransformed(s,p,resource)&&bloodlustValue(s,p,resource)>=Number(e.skillPowerThreshold))return Number(e.skillPowerBonus);}} return 0; }
export function bloodlustAscensionAdjustments(s:GameState,p:PlayerId,definitionId:string):{costAdd:number;powerAdd:number}|undefined{ const r=runtime(s); if(!r)return; for(const {sourceCardId,ability} of sourceAbilities(s,p,isAcceptedBloodlustAbility)){const e=ability.effects[0]!; if(!isBloodlustAscensionEffect(e))continue; const source=s.cards.find(c=>c.instanceId===sourceCardId); if(!source)return; const sourceDef=r.pack.cards[source.definitionId]; if(sourceDef?.id!==definitionId)continue; const resource=String(e.resourceKey); if(bloodlustTransformed(s,p,resource))return {costAdd:Number(e.transformedCostAdd),powerAdd:Number(e.transformedPowerAdd)};} }
export function bloodlustCanContribute(s:GameState,beneficiary:PlayerId,contributor:PlayerId):boolean{ const b=s.players.find(x=>x.id===beneficiary),c=s.players.find(x=>x.id===contributor); if(!b||!c||b.id===c.id||!b.locationId||b.locationId!==c.locationId)return false; for(const {ability} of sourceAbilities(s,beneficiary,isAcceptedBloodlustAbility)){const e=ability.effects[0]!; if(!isBloodlustCagingContributionEffect(e))continue; const resource=String(e.resourceKey); if(bloodlustTransformed(s,beneficiary,resource))continue; if(c.mana<Number(e.minimumOpponentMana))continue; const rk=k(resource,'contrib:'+contributor); if(rounds(s,beneficiary)[rk]===s.round.roundNumber)continue; return true;} return false; }
export function markBloodlustContribution(s:GameState,beneficiary:PlayerId,contributor:PlayerId,resource:string):void{ const rk=k(resource,'contrib:'+contributor); rounds(s,beneficiary)[rk]=s.round.roundNumber; bag(s,beneficiary)[rk]=true; }
function bloodlustContributionAuthority(s:GameState,beneficiary:PlayerId):{resourceKey:string;providerSourceCardId:string;providerAbilityId:string}|undefined{ for(const {sourceCardId,ability} of sourceAbilities(s,beneficiary,isAcceptedBloodlustAbility)){const e=ability.effects[0]!; if(isBloodlustCagingContributionEffect(e)&&!bloodlustTransformed(s,beneficiary,String(e.resourceKey)))return {resourceKey:String(e.resourceKey),providerSourceCardId:sourceCardId,providerAbilityId:ability.id};} }
export function bloodlustContributionResource(s:GameState,beneficiary:PlayerId):string|undefined{ return bloodlustContributionAuthority(s,beneficiary)?.resourceKey; }
export function buildBloodlustPlayContributionSeal(s:GameState,beneficiary:PlayerId,choices:readonly ManaContributionChoice[]|undefined):BloodlustPlayContributionSeal|undefined{
  if(!choices?.length)return; const authority=bloodlustContributionAuthority(s,beneficiary); if(!authority)throw new Error('BLOODLUST_CONTRIBUTION_NOT_ALLOWED');
  const contributors=choices.map(x=>({playerId:x.contributorPlayerId,amount:1 as const}));
  return {beneficiaryPlayerId:beneficiary,resourceKey:authority.resourceKey,providerSourceCardId:authority.providerSourceCardId,providerAbilityId:authority.providerAbilityId,round:s.round.roundNumber,contributors};
}

export interface BloodlustManaContributionPart { contributorPlayerId: PlayerId; amount: number; sourceCardInstanceId?: string; resourceKey: string }
export interface BloodlustManaPaymentPlan { payerAmount: number; contributions: BloodlustManaContributionPart[] }
export interface BloodlustPlayContributionSeal { beneficiaryPlayerId: PlayerId; resourceKey: string; providerSourceCardId: string; providerAbilityId: string; round: number; contributors: Array<{playerId:PlayerId;amount:1}> }
export function bloodlustMaximumContributionAmount(s:GameState,beneficiary:PlayerId):number{
  const resource=bloodlustContributionResource(s,beneficiary); if(!resource)return 0;
  return s.players.filter(p=>p.id!==beneficiary&&bloodlustCanContribute(s,beneficiary,p.id)).length;
}
export function resolveBloodlustManaPayment(s:GameState,beneficiary:PlayerId,total:number,choices:readonly ManaContributionChoice[]|undefined):BloodlustManaPaymentPlan{
  if(!Number.isSafeInteger(total)||total<0)throw new Error('BLOODLUST_PAYMENT_INVALID');
  const selected=choices??[]; if(selected.length===0)return {payerAmount:total,contributions:[]};
  const resource=bloodlustContributionResource(s,beneficiary); if(!resource)throw new Error('BLOODLUST_CONTRIBUTION_NOT_ALLOWED');
  const seen=new Set<string>(); const contributions:BloodlustManaContributionPart[]=[]; let contributed=0;
  for(const choice of selected){
    if(!choice||typeof choice.contributorPlayerId!=='string'||choice.contributorPlayerId===beneficiary||choice.amount!==1||seen.has(choice.contributorPlayerId))throw new Error('BLOODLUST_CONTRIBUTION_INVALID');
    if(choice.sourceCardInstanceId!==undefined&&(typeof choice.sourceCardInstanceId!=='string'||choice.sourceCardInstanceId.length===0))throw new Error('BLOODLUST_CONTRIBUTION_INVALID');
    if(!bloodlustCanContribute(s,beneficiary,choice.contributorPlayerId))throw new Error('BLOODLUST_CONTRIBUTION_NOT_ALLOWED');
    seen.add(choice.contributorPlayerId);contributed+=choice.amount;
    contributions.push({contributorPlayerId:choice.contributorPlayerId,amount:choice.amount,resourceKey:resource,...(choice.sourceCardInstanceId?{sourceCardInstanceId:choice.sourceCardInstanceId}:{})});
  }
  if(contributed>total)throw new Error('BLOODLUST_CONTRIBUTION_EXCEEDS_PAYMENT');
  const payer=s.players.find(p=>p.id===beneficiary); if(!payer||payer.mana<total-contributed)throw new Error('BLOODLUST_INSUFFICIENT_MANA');
  return {payerAmount:total-contributed,contributions};
}
export function commitBloodlustManaPayment(s:GameState,beneficiary:PlayerId,plan:BloodlustManaPaymentPlan):void{
  for(const part of plan.contributions){const contributor=s.players.find(p=>p.id===part.contributorPlayerId);if(!contributor||contributor.mana<part.amount)throw new Error('BLOODLUST_CONTRIBUTOR_STATE_CHANGED');}
  for(const part of plan.contributions){const contributor=s.players.find(p=>p.id===part.contributorPlayerId)!;contributor.mana-=part.amount;markBloodlustContribution(s,beneficiary,part.contributorPlayerId,part.resourceKey);}
}
export function bloodlustContributorPenalty(s:GameState,p:PlayerId):number{ let total=0; const r=runtime(s); if(!r)return 0; for(const source of s.cards){if(!['field','attack_area'].includes(source.zone))continue;const st=r.cardState[source.instanceId];if(!st?.active||st.faceDown)continue;const def=r.pack.cards[source.definitionId];if(!def)continue;for(const ability of def.abilities){const e=ability.effects[0];if(!e||!isAcceptedBloodlustAbility(ability)||!isBloodlustAscensionEffect(e))continue;const resource=String(e.resourceKey);if(bloodlustTransformed(s,source.controllerPlayerId,resource))continue;const seal=getBloodlustContributionAuthority(s,source.instanceId);if(!seal||seal.beneficiaryPlayerId!==source.controllerPlayerId)continue;const contributors=[...new Set(seal.contributors.map(x=>x.playerId))];if(contributors.includes(p))total+=Number(e.contributorPowerPenalty);}}return total; }
export function bloodlustTransformIfEligible(s:GameState,p:PlayerId,sourceCardId:string,a:AuthoringAbility):boolean{ const e=a.effects[0]!; if(!isBloodlustTransformEffect(e))return false; const resource=String(e.resourceKey); if(bloodlustTransformed(s,p,resource)||bloodlustValue(s,p,resource)<Number(e.threshold))return false; const b=bag(s,p); const player=s.players.find(x=>x.id===p); if(!player)return false; b[k(resource,'transformed')]=true;b[k(resource,'value')]=Number(e.lockValue);b[k(resource,'transformSource')]=sourceCardId;b[k(resource,'transformAbility')]=a.id;b[k(resource,'vpBaseline')]=player.vp; const carrier=player as unknown as {commandSpells?:number}; const before=Number(carrier.commandSpells??3); if(Number.isSafeInteger(before)&&before>0){carrier.commandSpells=0;runtime(s)?.events.push({type:'command_seals_adjusted',playerId:p,resource:'command_seals',delta:-before,before,after:0});} return true; }
export function useBloodlustAction(s:GameState,p:PlayerId,sourceCardId:string,a:AuthoringAbility):boolean{ const e=a.effects[0]!; if(!isBloodlustActionEffect(e))return false; const resource=String(e.resourceKey); if(bloodlustTransformed(s,p,resource)||bloodlustValue(s,p,resource)>=Number(e.maximumResourceExclusive))return false; const player=s.players.find(x=>x.id===p); if(!player)return false; player.mana+=Number(e.manaGain); setBloodlustValue(s,p,resource,bloodlustValue(s,p,resource)+Number(e.resourceGain)); const r=runtime(s); if(r){r.roundPlayerPowerAdjustments??=[];r.roundPlayerPowerAdjustments=r.roundPlayerPowerAdjustments.filter(x=>!(x.sourceCardId===sourceCardId&&x.abilityId===a.id&&x.round===s.round.roundNumber));r.roundPlayerPowerAdjustments.push({playerId:p,amount:Number(e.roundPowerGain),round:s.round.roundNumber,sourceCardId,abilityId:a.id});} const rk=k(resource,'decayBlocked');bag(s,p)[rk]=true;rounds(s,p)[rk]=s.round.roundNumber; return true; }
export function settleBloodlustDecay(s:GameState,p:PlayerId,a:AuthoringAbility):number{ const e=a.effects[0]!; if(!isBloodlustCombatDecayEffect(e))return 0; const resource=String(e.resourceKey); if(bloodlustTransformed(s,p,resource))return 0; const blocked=rounds(s,p)[k(resource,'decayBlocked')]===s.round.roundNumber; if(blocked)return 0; const player=s.players.find(x=>x.id===p);const r=runtime(s); if(!player||!r)return 0; let x=r.randomState>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;r.randomState=x>>>0; const span=Number(e.maxLoss)-Number(e.minLoss)+1; const roll=Number(e.minLoss)+(r.randomState%span); const loss=roll*(player.locationId==='magic_workshop'?Number(e.workshopMultiplier):1); setBloodlustValue(s,p,resource,Math.max(0,bloodlustValue(s,p,resource)-loss)); return loss; }
export function reconcileBloodlustVictoryPoints(s:GameState):void{const r=runtime(s);if(!r)return;for(const p of s.players){const b=r.structuredPlayerFlagsByPlayer?.[p.id];if(!b)continue;for(const raw of Object.keys(b).filter(x=>x.startsWith(PREFIX)&&x.endsWith(':vpBaseline'))){const resource=raw.slice(PREFIX.length,-':vpBaseline'.length);const baseline=Number(b[raw]);if(!Number.isSafeInteger(baseline)||baseline<0){continue;}if(p.vp>baseline&&bloodlustTransformed(s,p.id,resource)){const gain=p.vp-baseline;p.vp=baseline+Math.floor(gain/2);}b[raw]=p.vp;}}}
export function canExecuteBloodlustEffect(s:GameState,p:PlayerId,a:AuthoringAbility):boolean{const e=a.effects[0];if(!e||!isAcceptedBloodlustAbility(a))return false;if(isBloodlustActionEffect(e)){const resource=String(e.resourceKey);return !bloodlustTransformed(s,p,resource)&&bloodlustValue(s,p,resource)<Number(e.maximumResourceExclusive);}return true;}
export function resolveBloodlustEffect(s:GameState,p:PlayerId,sourceCardId:string,a:AuthoringAbility):boolean{const e=a.effects[0];if(!e||!isAcceptedBloodlustAbility(a))return false;if(isBloodlustInitializeEffect(e)){initializeBloodlust(s,p,sourceCardId,a);return true;}if(isBloodlustCombatDecayEffect(e)){settleBloodlustDecay(s,p,a);return true;}if(isBloodlustActionEffect(e)){return useBloodlustAction(s,p,sourceCardId,a);}if(isBloodlustTransformEffect(e)){bloodlustTransformIfEligible(s,p,sourceCardId,a);return true;}if(isBloodlustCagingContributionEffect(e)||isBloodlustSpendTrackerEffect(e)||isBloodlustThresholdEffect(e)||isBloodlustAscensionEffect(e))return true;return false;}
function bloodlustResourceFromPrefixedKey(name:string):string|undefined{
  if(!name.startsWith(PREFIX))return; const tail=name.slice(PREFIX.length);
  const fixed=['value','providerSource','providerAbility','vpBaseline','transformed','transformSource','transformAbility','decayBlocked'];
  for(const suffix of fixed){const marker=':'+suffix;if(tail.endsWith(marker))return tail.slice(0,-marker.length)||undefined;}
  const contrib=tail.lastIndexOf(':contrib:'); if(contrib>0&&tail.slice(contrib+9).length>0)return tail.slice(0,contrib);
  return undefined;
}
export function isBloodlustRuntimeProvenanceValidForRestore(s:GameState, requireContributionAuthority=true):boolean{
  const r=runtime(s); if(!r)return true; const playerIds=new Set(s.players.map(p=>p.id));
  for(const p of s.players){
    const b=r.structuredPlayerFlagsByPlayer?.[p.id]??{}; const roundBag=r.structuredRoundFlagKeysByPlayer?.[p.id]??{};
    const prefixed=[...Object.keys(b),...Object.keys(roundBag)].filter(name=>name.startsWith(PREFIX));
    const resources=[...new Set(prefixed.map(bloodlustResourceFromPrefixedKey).filter((x):x is string=>!!x))];
    if(prefixed.some(name=>!bloodlustResourceFromPrefixedKey(name)))return false;
    for(const resource of resources){
      const value=b[k(resource,'value')]; const baseline=b[k(resource,'vpBaseline')];
      if(!Number.isSafeInteger(value)||Number(value)<0||Number(value)>15||!Number.isSafeInteger(baseline)||Number(baseline)<0)return false;
      const sourceId=b[k(resource,'providerSource')], abilityId=b[k(resource,'providerAbility')];
      if(typeof sourceId!=='string'||typeof abilityId!=='string')return false;
      const source=s.cards.find(c=>c.instanceId===sourceId&&c.ownerPlayerId===p.id&&c.controllerPlayerId===p.id&&presentSourceZones(c.zone));
      const def=source?r.pack.cards[source.definitionId]:undefined; const ability=def?.abilities.find(a=>a.id===abilityId);
      if(!source||!ability||!isAcceptedBloodlustAbility(ability)||!isBloodlustInitializeEffect(ability.effects[0]!)||String(ability.effects[0]!.resourceKey)!==resource)return false;
      const transformed=b[k(resource,'transformed')];
      if(transformed!==undefined&&transformed!==true)return false;
      if(transformed===true){
        if(Number(value)!==15)return false;
        const transformSource=b[k(resource,'transformSource')], transformAbility=b[k(resource,'transformAbility')];
        if(typeof transformSource!=='string'||typeof transformAbility!=='string')return false;
        const physical=s.cards.find(c=>c.instanceId===transformSource&&c.ownerPlayerId===p.id&&c.controllerPlayerId===p.id&&presentSourceZones(c.zone));
        const a=physical?r.pack.cards[physical.definitionId]?.abilities.find(x=>x.id===transformAbility):undefined;
        if(!physical||!a||!isAcceptedBloodlustAbility(a)||!isBloodlustTransformEffect(a.effects[0]!)||String(a.effects[0]!.resourceKey)!==resource)return false;
        if(Number((p as unknown as {commandSpells?:number}).commandSpells??0)!==0)return false;
      }
    }
  }
  for(const [instanceId,st] of Object.entries(r.cardState)){
    if(!st.playManaContributions?.length)continue; const physical=s.cards.find(c=>c.instanceId===instanceId); if(!physical)return false;
    const ids=st.playManaContributions.map(x=>x.playerId); if(new Set(ids).size!==ids.length)return false;
    if(st.playManaContributions.some(x=>!playerIds.has(x.playerId)||x.playerId===physical.controllerPlayerId||x.amount!==1))return false;
    if(!requireContributionAuthority)continue;
    const seal=getBloodlustContributionAuthority(s,instanceId); if(!seal||seal.beneficiaryPlayerId!==physical.controllerPlayerId||seal.round!==st.playedRound||seal.contributors.length!==st.playManaContributions.length)return false;
    if(seal.contributors.some((x,i)=>x.playerId!==st.playManaContributions![i]!.playerId||x.amount!==1))return false;
    const providerPhysical=s.cards.find(c=>c.instanceId===seal.providerSourceCardId&&c.ownerPlayerId===seal.beneficiaryPlayerId&&c.controllerPlayerId===seal.beneficiaryPlayerId&&presentSourceZones(c.zone));
    const providerAbility=providerPhysical?r.pack.cards[providerPhysical.definitionId]?.abilities.find(a=>a.id===seal.providerAbilityId):undefined;
    if(!providerPhysical||!providerAbility||!isAcceptedBloodlustAbility(providerAbility)||!isBloodlustCagingContributionEffect(providerAbility.effects[0]!)||String(providerAbility.effects[0]!.resourceKey)!==seal.resourceKey)return false;
    for(const x of seal.contributors){if(rounds(s,seal.beneficiaryPlayerId)[k(seal.resourceKey,'contrib:'+x.playerId)]!==seal.round||bag(s,seal.beneficiaryPlayerId)[k(seal.resourceKey,'contrib:'+x.playerId)]!==true)return false;}
  }
  if(requireContributionAuthority&&!isBloodlustContributionServerAuthorityConsistent(s))return false;
  for(const [pid,roundsByKey] of Object.entries(r.structuredRoundFlagKeysByPlayer??{})){
    if(!playerIds.has(pid))return false; for(const [name,round] of Object.entries(roundsByKey)){if(name.startsWith(PREFIX)&&(!Number.isSafeInteger(round)||round<1||round>s.round.roundNumber))return false;}
  }
  return true;
}
