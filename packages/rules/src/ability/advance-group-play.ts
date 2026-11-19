import type {AuthoringAbility, RuleNode} from './types';

const record=(value:unknown):value is RuleNode=>!!value&&typeof value==='object'&&!Array.isArray(value);
export function isApprovedAdvanceGroupEffect(effect: RuleNode): boolean {
  return effect.type==='play_card_group' && Object.keys(effect).length===6 &&
    Object.keys(effect).every(k=>['type','target','includeSource','phase','ignorePriority','ignoreRequirements'].includes(k)) &&
    typeof effect.target==='string' && effect.target.length>0 && effect.includeSource===true && effect.phase==='advance' &&
    effect.ignorePriority===true && Array.isArray(effect.ignoreRequirements) && effect.ignoreRequirements.length===1 && effect.ignoreRequirements[0]==='controller_seat_in_first_half';
}
export function advanceGroupContractIssue(a: AuthoringAbility): string | undefined {
  const nested=(value:unknown):boolean=>Array.isArray(value)?value.some(nested):record(value)&&(value.type==='play_card_group'||Object.values(value).some(nested));
  if(a.effects.some(e=>Object.entries(e).some(([k,v])=>k!=='type'&&nested(v)))||a.creates.some(nested))return 'Grouped play must be a top-level native effect';
  const grouped=a.effects.filter(e=>e.type==='play_card_group');
  if(!grouped.length)return a.activation.ignorePriority!==undefined?'Priority override requires approved advance grouped play':undefined;
  if(grouped.length!==1 || a.kind!=='passive' || a.activation.phase!=='advance' || a.activation.ignorePriority!==true ||
    a.activation.opens!=='controller_action_window' || a.activation.requiresSourceState!==undefined) return 'Grouped play requires an advance passive window with exact priority override';
  const effect=grouped[0]!;
  if(!isApprovedAdvanceGroupEffect(effect))return 'Unsupported advance grouped play exception';
  const target=a.targets.find(t=>t.id===effect.target),count=target?.count,scope=target?.scope;
  if(!target || target.type!=='card_instance' || !record(count) || count.min!==1 || count.max!==1 || !record(scope) ||
    !['self','controller'].includes(String(scope.controller)) || scope.owner!=='controller' ||
    !Array.isArray(scope.zone) || scope.zone.length!==2 || !scope.zone.includes('hand') || !scope.zone.includes('skill')) return 'Group companion requires one controlled owned card in hand/skill';
  return undefined;
}
export function approvedAdvanceGroup(a: AuthoringAbility): RuleNode | undefined {
  return advanceGroupContractIssue(a)===undefined ? a.effects.find(isApprovedAdvanceGroupEffect) : undefined;
}
