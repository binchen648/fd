import {hostOperations,type AuthoringAbility,type RuleNode} from './types';
import {node,nodes,str} from './loader';
const only=(n:RuleNode,keys:string[])=>Object.keys(n).every(k=>keys.includes(k));
export type SealPlan={kind:'movement';effects:RuleNode[];directive?:string}|{kind:'total_power';effects:RuleNode[];modifier:RuleNode;directive:string};
/** Closed typed normalization: never infer a permission from a directive alone. */
export function normalizeSealPlan(a:AuthoringAbility,cardType:string|undefined):SealPlan|undefined {
 if(cardType!=='command_spell'||!['command-spell.free-move','command-spell.power-victory'].includes(a.id))return;
 if((a.bindings?.length??0)!==0||!only(a.execution,['mode','allowedOperations'])||a.execution.allowedOperations.some(op=>!hostOperations.includes(op))||a.kind!=='phase_action'||a.execution.mode!=='automatic'||a.activation.phase!=='action'||a.activation.opens!=='controller_action_window'||!only(a.activation,['phase','opens'])||a.conditions.length||a.cost.length||a.ruleModifiers.length||Object.keys(a.lifecycle).length||Object.keys(a.limit).length||Object.keys(a.visibility).length||!only(a.responseWindow,['order','passBehavior']))return;
 const seal=a.effects.filter(e=>e.type==='adjust_command_seals');
 if(seal.length!==1||seal[0]!.amount!==-1||seal[0]!.directive!=='spend_command_spell'||!only(seal[0]!,['type','amount','directive']))return;
 if(a.id==='command-spell.free-move'){
  if(a.targets.length!==1||a.creates.length)return;
  const t=a.targets[0]!,count=typeof t.count==='number'?{min:t.count,max:t.count}:node(t.count), cs=nodes(t.constraints);
  const origin=cs.find(c=>c.type==='from_location_in');
  if(t.type!=='location'||!only(t,['id','type','count','constraints'])||!only(count,['min','max'])||count.min!==1||count.max!==1||cs.length!==3||!cs.some(c=>c.type==='any_enabled_location'&&only(c,['type']))||!cs.some(c=>c.type==='ignore_engagement'&&only(c,['type']))||!origin||!only(origin,['type','locationIds'])||!Array.isArray(origin.locationIds)||origin.locationIds.length!==2||!origin.locationIds.includes('shinto')||!origin.locationIds.includes('miyama_town'))return;
  const move=a.effects.filter(e=>e.type==='move_player');const records=a.effects.filter(e=>e.type==='record_master_directive');
  if(move.length!==1||move[0]!.to!==t.id||(move[0]!.player!==undefined&&move[0]!.player!=='controller')||!only(move[0]!,['type','player','to'])||records.length>1||a.effects.length!==2+records.length)return;
  if(records.some(e=>e.directive!=='move_from_shinto_or_miyama_to_any_location_ignore_engagement'||!only(e,['type','directive'])))return;
  return {kind:'movement',effects:a.effects.filter(e=>e.type!=='record_master_directive'),...(records[0]?{directive:str(records[0].directive)}:{})};
 }
 if(a.targets.length||a.effects.length!==2||a.creates.length!==1)return;
 const record=a.effects[0]!,create=a.creates[0]!,m=node(create.modifier);
 if(record.type!=='record_master_directive'||!['gain_2_vp_if_win_this_round','command_spell_victory_vp'].includes(str(record.directive))||!only(record,['type','directive'])||create.type!=='create_modifier'||!only(create,['type','modifier'])||m.type!=='power_bonus'||m.amount!==2||m.duration!=='this_round'||m.aggregate!=='total'||(m.operation!==undefined&&m.operation!=='add')||!only(m,['type','target','scope','operation','amount','duration','aggregate'])||(m.scope!==undefined&&(!m.scope||typeof m.scope!=='object'||Array.isArray(m.scope)))||!((m.target==='controller'&&Object.keys(node(m.scope)).length===0)||(node(m.scope).subject==='controller'&&only(node(m.scope),['subject'])&&m.target===undefined)))return;
 return {kind:'total_power',effects:seal,modifier:create,directive:'normalized_command_spell_victory'};
}
