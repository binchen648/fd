import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

function isRuleNode(value: unknown): value is RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function node(value: unknown): RuleNode {
  return isRuleNode(value) ? value : {};
}
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function str(value: unknown): string { return typeof value === 'string' ? value : ''; }
function exactKeys(value: RuleNode, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function isPreBattleDefeatCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const raw = ability as RuleNode;
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (current.type === 'defeat_player' || current.type === 'no_attack_played_this_round_with_attribute') return true;
    return Object.values(current).some(visit);
  };
  return visit(raw);
}

/** M50-02 exact combat defeat of every same-battlefield opponent with at least N face-up plays this round. */
export function isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw=ability as RuleNode; if(raw.kind!=='phase_action') return false;
  const activation=node(raw.activation);
  if(!exactKeys(activation,['phase','requiresSourceState','opens'])||activation.phase!=='combat'||activation.requiresSourceState!=='active'||activation.opens!=='controller_combat_action_window') return false;
  const conditions=nodes(raw.conditions); if(conditions.length!==1||conditions[0]?.type!=='source_active'||!exactKeys(conditions[0]!,['type'])) return false;
  const effects=nodes(raw.effects); if(effects.length!==1||effects[0]?.type!=='defeat_player'||!exactKeys(effects[0]!,['type','target'])) return false;
  const target=node(effects[0]!.target); const where=nodes(target.where);
  if(target.scope!=='same_battlefield_opponents'||!exactKeys(target,['scope','where'])||where.length!==1) return false;
  const predicate=where[0]!;
  if(predicate.type!=='face_up_cards_played_this_round_at_least'||!Number.isSafeInteger(predicate.count)||Number(predicate.count)<1||
      !exactKeys(predicate,['type','count'])) return false;
  for(const key of ['targets','cost','creates','ruleModifiers']){const value=raw[key]; if(value!==undefined&&(!Array.isArray(value)||value.length!==0)) return false;}
  for(const key of ['lifecycle','limit','visibility']){const value=raw[key]; if(value!==undefined&&(!isRuleNode(value)||Object.keys(value).length!==0)) return false;}
  const response=node(raw.responseWindow); if(form==='authoring'){if(Object.keys(response).length)return false;} else if(!(response.order==='turn_order'&&response.passBehavior==='decline_this_window'&&exactKeys(response,['order','passBehavior']))) return false;
  const execution=node(raw.execution); if(execution.mode!=='automatic'||!exactKeys(execution,['mode','hostOps','allowedOperations'])) return false;
  for(const key of ['hostOps','allowedOperations']){const value=execution[key]; if(value===undefined)continue; if(!Array.isArray(value))return false; if(form==='authoring'&&value.length!==0)return false; if(form==='compiled'){const empty=value.length===0;const defaults=value.length===hostOperations.length&&hostOperations.every((op,index)=>value[index]===op); if(!empty&&!defaults)return false;}}
  return true;
}

/** M50-02 exact identity-free defeat of same-battlefield opponents deployed here this round. */
export function isAcceptedDeploymentLocationOpponentDefeatAbility(
  ability: AuthoringAbility | RuleNode, form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw=ability as RuleNode; if(raw.kind!=='phase_action') return false;
  const activation=node(raw.activation);
  if(activation.phase!=='combat'||activation.opens!=='controller_combat_action_window'||activation.requiresSourceState!=='active'||
      !exactKeys(activation,['phase','opens','requiresSourceState'])) return false;
  const conditions=nodes(raw.conditions); if(conditions.length!==4) return false;
  if(conditions[0]?.type!=='at_battlefield'||!exactKeys(conditions[0]!,['type'])||conditions[1]?.type!=='source_active'||!exactKeys(conditions[1]!,['type'])) return false;
  const required=conditions[2]!; if(required.type!=='owned_active_card_by_definition'||typeof required.definitionId!=='string'||!required.definitionId||!exactKeys(required,['type','definitionId'])) return false;
  const targetCount=conditions[3]!; if(targetCount.type!=='target_count_at_least'||Number(targetCount.count)!==1||!exactKeys(targetCount,['type','count','target'])) return false;
  const validTarget=(value:unknown):boolean=>{ const target=node(value); const where=nodes(target.where); return target.scope==='same_battlefield_opponents'&&exactKeys(target,['scope','where'])&&where.length===1&&where[0]?.type==='deployed_this_round_at_controller_location'&&exactKeys(where[0]!,['type']); };
  if(!validTarget(targetCount.target)) return false;
  const effects=nodes(raw.effects); if(effects.length!==1||effects[0]?.type!=='defeat_player'||!exactKeys(effects[0]!,['type','target'])||!validTarget(effects[0]!.target)) return false;
  for(const key of ['targets','cost','creates','ruleModifiers']){const value=raw[key];if(value!==undefined&&(!Array.isArray(value)||value.length!==0))return false;}
  for(const key of ['lifecycle','limit','visibility']){const value=raw[key];if(value!==undefined&&(!isRuleNode(value)||Object.keys(value).length!==0))return false;}
  const response=node(raw.responseWindow); if(form==='authoring'){if(Object.keys(response).length)return false;} else if(!(response.order==='turn_order'&&response.passBehavior==='decline_this_window'&&exactKeys(response,['order','passBehavior'])))return false;
  const execution=node(raw.execution); if(execution.mode!=='automatic'||!exactKeys(execution,['mode','hostOps','allowedOperations']))return false;
  for(const key of ['hostOps','allowedOperations']){const value=execution[key];if(value===undefined)continue;if(!Array.isArray(value))return false;if(form==='authoring'&&value.length!==0)return false;if(form==='compiled'){const empty=value.length===0;const defaults=value.length===hostOperations.length&&hostOperations.every((op,index)=>value[index]===op);if(!empty&&!defaults)return false;}}
  return true;
}

/** M50-02 exact identity-free combat-phase choice of one engaged opponent to stage defeat. */
export function isAcceptedStructuredChosenOpponentDefeatAbility(
  ability: AuthoringAbility | RuleNode, form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'phase_action') return false;
  const activation = node(raw.activation);
  if (!exactKeys(activation, ['phase', 'opens']) || activation.phase !== 'combat' || activation.opens !== 'controller_combat_action_window') return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 2 || conditions[0]?.type !== 'source_active' || !exactKeys(conditions[0]!, ['type'])) return false;
  const flag = conditions[1]!;
  if (flag.type !== 'player_flag_number_current_round' || typeof flag.key !== 'string' || !flag.key || !exactKeys(flag, ['type', 'key'])) return false;
  const targets = nodes(raw.targets); if (targets.length !== 0) return false;
  const effects = nodes(raw.effects); if (effects.length !== 1) return false;
  const choose = effects[0]!;
  if (choose.type !== 'choose_players' || choose.candidateTarget !== 'engaged_opponents' || Number(choose.minCount) !== 1 || Number(choose.maxCount) !== 1 ||
      choose.payloadKey !== 'targetPlayerId' || !exactKeys(choose, ['type','candidateTarget','minCount','maxCount','payloadKey','then'])) return false;
  const then = nodes(choose.then);
  if (then.length !== 1 || then[0]?.type !== 'defeat_player' || then[0]?.target !== 'targetPlayerId' || !exactKeys(then[0]!, ['type','target'])) return false;
  for (const key of ['cost','creates','ruleModifiers']) { const value=raw[key]; if (value !== undefined && (!Array.isArray(value) || value.length !== 0)) return false; }
  for (const key of ['lifecycle','limit','visibility']) { const value=raw[key]; if (value !== undefined && (!isRuleNode(value) || Object.keys(value).length !== 0)) return false; }
  const response=node(raw.responseWindow);
  if (form==='authoring') { if (Object.keys(response).length) return false; }
  else if (!(response.order==='turn_order' && response.passBehavior==='decline_this_window' && exactKeys(response,['order','passBehavior']))) return false;
  const execution=node(raw.execution); if (execution.mode!=='automatic' || !exactKeys(execution,['mode','hostOps','allowedOperations'])) return false;
  for (const key of ['hostOps','allowedOperations']) { const value=execution[key]; if(value===undefined) continue; if(!Array.isArray(value)) return false;
    if(form==='authoring'&&value.length!==0)return false; if(form==='compiled'){const empty=value.length===0;const defaults=value.length===hostOperations.length&&hostOperations.every((op,index)=>value[index]===op);if(!empty&&!defaults)return false;} }
  return true;
}

/** M50 exact identity-free combat-phase selected same-battlefield defeat + state transition. */
export function isAcceptedSelectedSameBattlefieldDefeatAbility(
  ability: AuthoringAbility | RuleNode, form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode; if (raw.kind !== 'phase_action') return false;
  const activation = node(raw.activation);
  if (!exactKeys(activation, ['phase','opens']) || activation.phase !== 'combat' || activation.opens !== 'controller_combat_action_window') return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 2 || conditions[0]?.type !== 'source_active' || !exactKeys(conditions[0]!, ['type'])) return false;
  const flagCondition = conditions[1]!;
  if (flagCondition.type !== 'player_flag_equals' || typeof flagCondition.key !== 'string' || !flagCondition.key ||
      typeof flagCondition.value !== 'string' || !flagCondition.value || !exactKeys(flagCondition, ['type','key','value'])) return false;
  const targets = nodes(raw.targets); if (targets.length !== 1) return false;
  const target = targets[0]!; const constraints = nodes(target.constraints);
  if (target.type !== 'player' || typeof target.id !== 'string' || !target.id || !exactKeys(target, ['id','type','constraints']) ||
      constraints.length !== 2 || constraints[0]?.type !== 'not_controller' || constraints[1]?.type !== 'same_battlefield_as_controller' ||
      !constraints.every((entry) => exactKeys(entry, ['type']))) return false;
  const effects = nodes(raw.effects); if (effects.length !== 2) return false;
  const defeat = effects[0]!, transition = effects[1]!;
  if (defeat.type !== 'defeat_player' || defeat.target !== target.id || !exactKeys(defeat, ['type','target'])) return false;
  if (transition.type !== 'set_player_flag' || transition.key !== flagCondition.key || typeof transition.value !== 'string' || !transition.value ||
      transition.value === flagCondition.value || !exactKeys(transition, ['type','key','value'])) return false;
  for (const key of ['cost','creates','ruleModifiers']) { const value=raw[key]; if (value !== undefined && (!Array.isArray(value) || value.length !== 0)) return false; }
  for (const key of ['lifecycle','limit']) { const value=raw[key]; if (value !== undefined && (!isRuleNode(value) || Object.keys(value).length !== 0)) return false; }
  const visibility=node(raw.visibility); const exactReveal=exactKeys(visibility,['revealsTrueName','revealTiming','revealScope']) &&
    visibility.revealsTrueName===true && visibility.revealTiming==='on_resolve' && visibility.revealScope==='servant_package';
  if (Object.keys(visibility).length && !exactReveal) return false;
  const response=node(raw.responseWindow);
  if (form==='authoring') { if (Object.keys(response).length) return false; }
  else if (!(response.order==='turn_order' && response.passBehavior==='decline_this_window' && exactKeys(response,['order','passBehavior']))) return false;
  const execution=node(raw.execution); if (execution.mode!=='automatic' || !exactKeys(execution,['mode','hostOps','allowedOperations'])) return false;
  for (const key of ['hostOps','allowedOperations']) { const value=execution[key]; if (value===undefined) continue; if (!Array.isArray(value)) return false;
    if (form==='authoring' && value.length!==0) return false; if (form==='compiled') { const empty=value.length===0; const defaults=value.length===hostOperations.length && hostOperations.every((op,index)=>value[index]===op); if(!empty&&!defaults)return false; } }
  return true;
}

/** M50 exact identity-free combat defeat of one selected same-battlefield opponent that has not spent a Command Seal this round. */
export function isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(
  ability: AuthoringAbility | RuleNode, form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'phase_action') return false;
  const activation = node(raw.activation);
  if (!exactKeys(activation, ['phase', 'opens']) || activation.phase !== 'combat' || activation.opens !== 'controller_combat_action_window') return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || conditions[0]?.type !== 'phase_is' || conditions[0]?.phase !== 'combat' ||
      !exactKeys(conditions[0]!, ['type', 'phase'])) return false;

  const targets = nodes(raw.targets);
  if (targets.length !== 1) return false;
  const target = targets[0]!; const count = node(target.count); const constraints = nodes(target.constraints);
  if (target.type !== 'player' || typeof target.id !== 'string' || !target.id ||
      !exactKeys(target, ['id', 'type', 'count', 'constraints']) ||
      !exactKeys(count, ['min', 'max']) || Number(count.min) !== 1 || Number(count.max) !== 1 || constraints.length !== 3) return false;
  if (constraints[0]?.type !== 'not_controller' || !exactKeys(constraints[0]!, ['type']) ||
      constraints[1]?.type !== 'same_battlefield_as_controller' || !exactKeys(constraints[1]!, ['type'])) return false;
  const seal = constraints[2]!;
  if (seal.type !== 'player_flag_number_not_current_round' || seal.key !== 'commandSealUsedRound' ||
      !exactKeys(seal, ['type', 'key'])) return false;

  const effects = nodes(raw.effects);
  if (effects.length !== 1 || effects[0]?.type !== 'defeat_player' || effects[0]?.target !== target.id ||
      !exactKeys(effects[0]!, ['type', 'target'])) return false;
  for (const key of ['cost', 'creates', 'ruleModifiers']) {
    const value = raw[key]; if (value !== undefined && (!Array.isArray(value) || value.length !== 0)) return false;
  }
  for (const key of ['lifecycle', 'limit', 'visibility']) {
    const value = raw[key]; if (value !== undefined && (!isRuleNode(value) || Object.keys(value).length !== 0)) return false;
  }
  const response = node(raw.responseWindow);
  if (form === 'authoring') { if (Object.keys(response).length) return false; }
  else if (!(response.order === 'turn_order' && response.passBehavior === 'decline_this_window' && exactKeys(response, ['order', 'passBehavior']))) return false;
  const execution = node(raw.execution);
  if (execution.mode !== 'automatic' || !exactKeys(execution, ['mode', 'hostOps', 'allowedOperations'])) return false;
  for (const key of ['hostOps', 'allowedOperations']) {
    const value = execution[key]; if (value === undefined) continue; if (!Array.isArray(value)) return false;
    if (form === 'authoring' && value.length !== 0) return false;
    if (form === 'compiled') {
      const empty = value.length === 0;
      const defaults = value.length === hostOperations.length && hostOperations.every((op, index) => value[index] === op);
      if (!empty && !defaults) return false;
    }
  }
  return true;
}

/** FB2-45 exact identity-free action-phase pre-battle defeat semantic shape. */
export function isAcceptedPreBattleDefeatAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'compiled',
): boolean {
  const raw = ability as RuleNode;
  if (raw.kind !== 'phase_action') return false;
  const activation = node(raw.activation);
  if (!exactKeys(activation, ['phase', 'opens']) || activation.phase !== 'action' || activation.opens !== 'controller_action_window') return false;

  const conditions = nodes(raw.conditions);
  if (conditions.length !== 1 || conditions[0]!.type !== 'source_active' || !exactKeys(conditions[0]!, ['type'])) return false;
  for (const key of ['targets', 'cost', 'creates', 'ruleModifiers']) {
    const value = raw[key];
    if (value !== undefined && (!Array.isArray(value) || value.length !== 0)) return false;
  }

  const effects = nodes(raw.effects);
  if (effects.length !== 1) return false;
  const effect = effects[0]!;
  if (effect.type !== 'defeat_player' || !exactKeys(effect, ['type', 'target'])) return false;
  const target = node(effect.target);
  if (target.scope !== 'engaged_opponents' || !exactKeys(target, ['scope', 'where'])) return false;
  const where = nodes(target.where);
  if (where.length !== 1) return false;
  const predicate = where[0]!;
  const attribute = str(predicate.attribute).trim();
  if (predicate.type !== 'no_attack_played_this_round_with_attribute' || !attribute || !exactKeys(predicate, ['type', 'attribute'])) return false;

  for (const key of ['lifecycle', 'limit']) {
    const value = raw[key];
    if (value !== undefined && (!isRuleNode(value) || Object.keys(value).length !== 0)) return false;
  }
  const rawVisibility = raw.visibility;
  if (rawVisibility !== undefined && !isRuleNode(rawVisibility)) return false;
  const visibility = node(rawVisibility);
  const emptyVisibility = Object.keys(visibility).length === 0;
  const exactTrueNameReveal = exactKeys(visibility, ['revealsTrueName', 'revealTiming', 'revealScope']) &&
    visibility.revealsTrueName === true && visibility.revealTiming === 'on_use_declared' && visibility.revealScope === 'servant_package';
  if (!emptyVisibility && !exactTrueNameReveal) return false;

  const rawResponse = raw.responseWindow;
  if (form === 'authoring') {
    if (rawResponse !== undefined && (!isRuleNode(rawResponse) || Object.keys(rawResponse).length !== 0)) return false;
  } else {
    if (!isRuleNode(rawResponse)) return false;
    if (!(rawResponse.order === 'turn_order' && rawResponse.passBehavior === 'decline_this_window' &&
        exactKeys(rawResponse, ['order', 'passBehavior']))) return false;
  }

  const execution = node(raw.execution);
  if (execution.mode !== 'automatic' || !exactKeys(execution, ['mode', 'hostOps', 'allowedOperations'])) return false;
  for (const key of ['hostOps', 'allowedOperations']) {
    if (!Object.prototype.hasOwnProperty.call(execution, key)) continue;
    const value = execution[key];
    if (!Array.isArray(value)) return false;
    if (form === 'authoring' && value.length !== 0) return false;
    if (form === 'compiled') {
      const exactEmpty = value.length === 0;
      const exactDefault = value.length === hostOperations.length && hostOperations.every((operation, index) => value[index] === operation);
      if (!exactEmpty && !exactDefault) return false;
    }
  }
  return true;
}

export function preBattleDefeatAttribute(ability: AuthoringAbility | RuleNode): string | undefined {
  if (!isAcceptedPreBattleDefeatAbility(ability, 'compiled')) return undefined;
  const effect = nodes((ability as RuleNode).effects)[0]!;
  return str(nodes(node(effect.target).where)[0]!.attribute).trim() || undefined;
}