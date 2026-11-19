import type {GameState} from '../schema/game';
import type {AuthoringAbility,AuthoringCard,PhaseAbilityReplacement,RuleNode,EffectContext} from './types';
const record=(n:unknown):n is RuleNode=>!!n&&typeof n==='object'&&!Array.isArray(n);
const effectList=(n:unknown):n is RuleNode[]=>Array.isArray(n)&&n.length>0&&n.every(e=>record(e)&&typeof e.type==='string');
const safeId=(s:unknown):s is string=>typeof s==='string'&&s.length>0&&!['__proto__','constructor','prototype'].includes(s);
export function phaseTemplateIssue(a:AuthoringAbility):string|undefined{
 const hasTemplate=(v:unknown):boolean=>Array.isArray(v)?v.some(hasTemplate):record(v)&&(['replace_phase_abilities','schedule_at_player_action_end'].includes(String(v.type))||Object.values(v).some(hasTemplate));
 if(a.creates.some(hasTemplate))return 'Phase templates must be declared under native effects';
 if(a.effects.filter(e=>e.type==='schedule_at_player_action_end').length>1)return 'Only one action-end schedule template is supported per ability';
 const validate=(effects:RuleNode[],inReplacement=false):string|undefined=>{
  for(const e of effects){
   if(e.type==='replace_phase_abilities'){
    const t=a.targets.find(t=>t.id===e.target);
    if(inReplacement||!safeId(e.id)||!t||t.type!=='card_instance'||e.phase!=='action'||e.duration!=='this_round'||!effectList(e.then)||
      Object.keys(e).some(k=>!['type','id','target','phase','duration','then'].includes(k)))return 'Unsupported phase replacement template';
    const issue=validate(e.then,true);if(issue)return issue;
   }else if(e.type==='schedule_at_player_action_end'){
    if(!effectList(e.then)||Object.keys(e).some(k=>!['type','then'].includes(k)))return 'Action-end schedule requires a canonical then template';
    const hasInteractive=(value:unknown):boolean=>Array.isArray(value)?value.some(hasInteractive):record(value)&&
      (['replace_phase_abilities','schedule_at_player_action_end','play_selected_cards','play_revealed_card','play_card_group','move_player'].includes(String(value.type))||
       (typeof value.targetRef==='string')||(typeof value.target==='string'&&!['this_card','source_card'].includes(value.target))||Object.values(value).some(hasInteractive));
    if(hasInteractive(e.then))return 'Action-end template cannot introduce target choices or nested schedules';
   }else if(e.type==='branch'){
    const nested=(v:unknown):boolean=>Array.isArray(v)?v.some(nested):record(v)&&(['replace_phase_abilities','schedule_at_player_action_end'].includes(String(v.type))||Object.values(v).some(nested));
    if(nested(e.branches))return 'Phase templates must be top-level or directly inside replacement';
   }
  }
 };
 return validate(a.effects);
}
export function replacementId(record:Omit<PhaseAbilityReplacement,'id'>):string{
 return `phase-replacement:${JSON.stringify([record.round,record.sourceCardId,record.sourceAbilityId,record.templateId,record.targetCardId])}`;
}
export function replacementTemplate(s:GameState,r:PhaseAbilityReplacement):RuleNode|undefined{
 const physical=s.cards.find(c=>c.instanceId===r.sourceCardId);
 const ability=physical&&s.abilityRuntime?.pack.cards[physical.definitionId]?.abilities.find(a=>a.id===r.sourceAbilityId);
 if(!ability||phaseTemplateIssue(ability))return;
 return ability.effects.find(e=>e.type==='replace_phase_abilities'&&e.id===r.templateId);
}
export function phaseSourceActive(s:GameState,id:string,controllerId:string):boolean{
 const card=s.cards.find(c=>c.instanceId===id),st=s.abilityRuntime?.cardState[id];
 return !!card&&card.controllerPlayerId===controllerId&&['attack_area','field'].includes(card.zone)&&st?.active===true&&!st.faceDown&&s.players.some(p=>p.id===controllerId&&p.status==='active');
}
export function replacementLive(s:GameState,r:PhaseAbilityReplacement):boolean{
 return r.round===s.round.roundNumber&&!!replacementTemplate(s,r)&&phaseSourceActive(s,r.sourceCardId,r.controllerId)&&phaseSourceActive(s,r.targetCardId,r.controllerId);
}
export function replacementAbility(s:GameState,r:PhaseAbilityReplacement):AuthoringAbility|undefined{
 const template=replacementTemplate(s,r);if(!template||!effectList(template.then))return;
 return {id:r.id,kind:'phase_action',printedClause:'行动阶段：执行已替换的主动能力。',activation:{phase:template.phase,opens:'controller_action_window',requiresSourceState:'active'},
  conditions:[],targets:[],cost:[],effects:template.then,creates:[],ruleModifiers:[],lifecycle:{},responseWindow:{},limit:{},visibility:{},execution:{mode:'automatic',allowedOperations:[]}};
}
/** Definitions stay immutable; only this instance reads an active template overlay. */
export function withPhaseReplacement(s:GameState,id:string,base:AuthoringCard|undefined):AuthoringCard|undefined{
 if(!base)return base;
 const replacements=s.abilityRuntime?.phaseAbilityReplacements;
 if(!replacements?.length)return base;
 const r=[...replacements].reverse().find(r=>r.targetCardId===id&&replacementLive(s,r));
 const generated=r&&replacementAbility(s,r);if(!generated)return base;
 return {...base,abilities:[...base.abilities.filter(a=>a.kind!=='phase_action'||a.activation.phase!==generated.activation.phase),generated]};
}
export function replacementWasUsed(s:GameState,targetId:string,phase:unknown):boolean{
 return (s.abilityRuntime?.phaseAbilityReplacements??[]).some(r=>r.round===s.round.roundNumber&&r.targetCardId===targetId&&replacementTemplate(s,r)?.phase===phase&&s.abilityRuntime!.usedAbilities[`${targetId}:${r.id}`]===r.round);
}
export function actionEndTemplate(s:GameState,ctx:EffectContext):RuleNode|undefined{
 const r=s.abilityRuntime?.phaseAbilityReplacements?.find(r=>r.id===ctx.abilityId&&r.targetCardId===ctx.sourceCardId);
 const physical=s.cards.find(c=>c.instanceId===ctx.sourceCardId);
 const a=r?replacementAbility(s,r):physical&&s.abilityRuntime?.pack.cards[physical.definitionId]?.abilities.find(a=>a.id===ctx.abilityId);
 if(!a||phaseTemplateIssue(a))return;
 const schedules=a.effects.filter(e=>e.type==='schedule_at_player_action_end');return schedules.length===1?schedules[0]:undefined;
}
export function validPhaseTemplateState(s:GameState):boolean{
 const runtime=s.abilityRuntime;if(!runtime)return false;
 const replacements=runtime.phaseAbilityReplacements??[];
 if(!Array.isArray(replacements)||!Array.isArray(runtime.pendingPlayerActionEnds??[])||!record(runtime.playerActionEnds??{}))return false;
 const ids=new Set<string>();
 for(const r of replacements){
  if(!record(r)||Object.keys(r).some(k=>!['id','sourceCardId','sourceAbilityId','templateId','targetCardId','controllerId','round'].includes(k))||
    !['id','sourceCardId','sourceAbilityId','templateId','targetCardId','controllerId'].every(k=>safeId(r[k]))||!Number.isSafeInteger(r.round)||r.round<1||r.round>s.round.roundNumber||
    r.id!==replacementId(r)||ids.has(r.id)||!s.players.some(p=>p.id===r.controllerId)||!s.cards.some(c=>c.instanceId===r.targetCardId)||!replacementTemplate(s,r))return false;
  ids.add(r.id);
 }
 if(!Object.entries(runtime.playerActionEnds??{}).every(([id,round])=>s.players.some(p=>p.id===id)&&Number.isSafeInteger(round)&&round>=1&&round<=s.round.roundNumber))return false;
 const pendingIds=new Set<string>();
 for(const p of runtime.pendingPlayerActionEnds??[]){
  if(!record(p)||Object.keys(p).some(k=>!['id','round','controllerId','context'].includes(k))||!safeId(p.id)||p.round!==s.round.roundNumber||
    !record(p.context)||p.controllerId!==p.context.controllerId||typeof p.context.sourceCardId!=='string'||typeof p.context.abilityId!=='string'||
    !record(p.context.variables)||Object.keys(p.context.variables).length||!record(p.context.selections)||Object.keys(p.context.selections).length||p.context.bindings!==undefined||
    p.id!==`action-end:${p.round}:${p.controllerId}:${p.context.sourceCardId}:${p.context.abilityId}`||pendingIds.has(p.id)||!actionEndTemplate(s,p.context)||runtime.playerActionEnds?.[p.controllerId]===p.round)return false;
  pendingIds.add(p.id);
 }
 return true;
}
