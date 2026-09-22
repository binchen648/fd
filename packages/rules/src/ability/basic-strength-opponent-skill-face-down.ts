import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

export const BASIC_STRENGTH_ATTACK_CONSTRAINT = 'basic_strength_attack';
export const SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT = 'same_location_opponent_face_up_servant_skill';
export const SET_SELECTED_CARD_FACE_DOWN_EFFECT = 'set_selected_card_face_down';

function isNode(value: unknown): value is RuleNode { return !!value && typeof value === 'object' && !Array.isArray(value); }
function node(value: unknown): RuleNode { return isNode(value) ? value : {}; }
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function exactKeys(value: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function emptyObject(value: unknown): boolean { return isNode(value) && Object.keys(value).length === 0; }
function emptyArray(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function exactCount(value: RuleNode): boolean { return value.min === 1 && value.max === 1 && exactKeys(value, ['min', 'max']); }
function exactConstraint(value: RuleNode, type: string): boolean { return value.type === type && exactKeys(value, ['type']); }
function exactFirstTarget(value: RuleNode): boolean {
  const scope=node(value.scope), count=node(value.count), constraints=nodes(value.constraints);
  return value.id === 'strength_basic_attack' && value.type === 'card_instance' &&
    exactKeys(value, ['id','type','scope','constraints','count']) &&
    scope.zone === 'hand' && scope.controller === 'self' && exactKeys(scope, ['zone','controller']) &&
    exactCount(count) && constraints.length === 1 && exactConstraint(constraints[0]!, BASIC_STRENGTH_ATTACK_CONSTRAINT);
}
function exactSecondTarget(value: RuleNode): boolean {
  const scope=node(value.scope), count=node(value.count), constraints=nodes(value.constraints);
  return value.id === 'opponent_servant_skill' && value.type === 'card_instance' &&
    exactKeys(value, ['id','type','scope','constraints','count']) &&
    scope.zone === 'skill' && scope.controller === 'any' && exactKeys(scope, ['zone','controller']) &&
    exactCount(count) && constraints.length === 1 && exactConstraint(constraints[0]!, SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT);
}
function containsVocabulary(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsVocabulary);
  if (!isNode(value)) return false;
  if ([BASIC_STRENGTH_ATTACK_CONSTRAINT, SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT, SET_SELECTED_CARD_FACE_DOWN_EFFECT].includes(String(value.type))) return true;
  return Object.values(value).some(containsVocabulary);
}

/** Reserves FB2-53 vocabulary so wrong-slot/near-match uses fail closed. */
export function isBasicStrengthOpponentSkillFaceDownCandidate(ability: AuthoringAbility | RuleNode): boolean {
  return containsVocabulary(ability);
}

/** Exact identity-free FB2-53 whole envelope. No generic selector or face setter is exposed. */
export function isAcceptedBasicStrengthOpponentSkillFaceDownAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'authoring',
): boolean {
  const raw=ability as RuleNode;
  if (!Object.keys(raw).every((key) => [
    'id','kind','printedClause','markers','activation','conditions','targets','effects','cost','creates',
    'ruleModifiers','lifecycle','responseWindow','limit','visibility','execution',
  ].includes(key))) return false;
  if (raw.kind !== 'phase_action') return false;
  const activation=node(raw.activation);
  if (activation.phase !== 'action' || activation.opens !== 'controller_action_window' || !exactKeys(activation,['phase','opens'])) return false;
  if (!emptyArray(raw.conditions) || !emptyArray(raw.cost) || !emptyArray(raw.creates) || !emptyArray(raw.ruleModifiers)) return false;
  if (!emptyObject(raw.lifecycle) || !emptyObject(raw.limit) || !emptyObject(raw.visibility)) return false;
  const targets=nodes(raw.targets); if(targets.length!==2 || !exactFirstTarget(targets[0]!) || !exactSecondTarget(targets[1]!)) return false;
  const effects=nodes(raw.effects);
  if(effects.length!==2 || effects[0]!.type!=='play_selected_cards' || effects[0]!.target!=='strength_basic_attack' || !exactKeys(effects[0]!,['type','target']) ||
    effects[1]!.type!==SET_SELECTED_CARD_FACE_DOWN_EFFECT || effects[1]!.target!=='opponent_servant_skill' || !exactKeys(effects[1]!,['type','target'])) return false;
  const response=node(raw.responseWindow);
  if(form==='authoring') { if(Object.keys(response).length!==0) return false; }
  else if(response.order!=='turn_order' || response.passBehavior!=='decline_this_window' || !exactKeys(response,['order','passBehavior'])) return false;
  if(raw.markers!==undefined && (!Array.isArray(raw.markers) || raw.markers.length!==0)) return false;
  const execution=node(raw.execution);
  if(execution.mode!=='automatic' || !Object.keys(execution).every(key=>['mode','hostOps','allowedOperations'].includes(key))) return false;
  for(const key of ['hostOps','allowedOperations']) {
    const value=execution[key]; if(value===undefined) continue; if(!Array.isArray(value)) return false;
    if(form==='authoring' && value.length!==0) return false;
    if(form==='compiled' && value.length!==0 && !(value.length===hostOperations.length && hostOperations.every((op,i)=>value[i]===op))) return false;
  }
  return true;
}
