import type {AuthoringAbility,RuleNode} from './types';
import {node} from './loader';
const only=(n:RuleNode,ks:string[])=>Object.keys(n).every(k=>ks.includes(k));
const eq=(a:unknown,b:unknown):boolean=>JSON.stringify(a)===JSON.stringify(b);
const one=(v:unknown)=>v===1||(node(v).min===1&&node(v).max===1&&only(node(v),['min','max']));
export interface SquareAccelPlan {kind:'close_then_activate';closeTarget:string;activateTarget:string;}
export function normalizeSquareAccelPlan(a:AuthoringAbility):SquareAccelPlan|undefined {
 if(a.id!=='square-accel.combat'||a.kind!=='phase_action'||a.execution.mode!=='automatic'||!only(a.execution,['mode','allowedOperations'])||a.bindings?.length||a.activation.phase!=='combat'||a.activation.opens!=='controller_combat_action_window'||!only(a.activation,['phase','opens'])||a.conditions.length||a.cost.length||a.creates.length||a.ruleModifiers.length||Object.keys(a.lifecycle).length||Object.keys(a.limit).length||Object.keys(a.visibility).length||!only(a.responseWindow,['order','passBehavior'])||a.targets.length!==2||a.effects.length!==2)return;
 const [close,bullet]=a.targets;
 for(const t of [close!,bullet!])if(t.type!=='card_instance'||!only(t,['id','type','count','scope','constraints'])||!one(t.count)||!eq(t.scope,{zone:'attack_area',controller:'self'}))return;
 if(close!.id!=='attack_to_close'||bullet!.id!=='bullet_to_activate'||!eq(close!.constraints,[{type:'is_attack'},{type:'card_active'}])||!eq(bullet!.constraints,[{type:'has_card_id',cardId:'master.kiritsugu.deck.origin-bullet'},{type:'card_face_down'}])||!eq(a.effects,[{type:'move_card',target:'attack_to_close',to:{zone:'attack_area'},deactivate:true},{type:'move_card',target:'bullet_to_activate',to:{zone:'attack_area'},activate:true}]))return;
 return {kind:'close_then_activate',closeTarget:'attack_to_close',activateTarget:'bullet_to_activate'};
}
