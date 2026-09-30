import type { AuthoringAbility, RuleNode } from './types';

export const RELOCATE_DEFINITION_SET_WITHOUT_PLAY_EFFECT = 'relocate_definition_set_without_play_triggers' as const;
export const RECALL_ACTIVE_DEFINITION_AND_JOIN_SOURCE_EFFECT = 'pay_source_current_cost_recall_active_definition_and_join_source' as const;
export const RETRIGGER_ACTIVE_DEFINITION_SET_PLAY_EFFECTS = 'retrigger_card_play_effects' as const;

const privilegedTypes = new Set<string>([
  RELOCATE_DEFINITION_SET_WITHOUT_PLAY_EFFECT,
  RECALL_ACTIVE_DEFINITION_AND_JOIN_SOURCE_EFFECT,
  RETRIGGER_ACTIVE_DEFINITION_SET_PLAY_EFFECTS,
]);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function strings(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length < 1 || value.some((entry) => typeof entry !== 'string' || !entry)) return undefined;
  const result = value as string[];
  return new Set(result).size === result.length ? result : undefined;
}
function sameStrings(left: unknown, right: unknown): boolean {
  const a = strings(left); const b = strings(right);
  return !!a && !!b && a.length === b.length && a.every((entry, index) => entry === b[index]);
}
function standardResponse(ability: AuthoringAbility): boolean {
  return ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window' &&
    exactKeys(ability.responseWindow, ['order', 'passBehavior']);
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function commonEmpty(ability: AuthoringAbility): boolean {
  return ability.cost.length === 0 && ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    empty(ability.lifecycle) && standardResponse(ability) && automaticNoHost(ability);
}
function exactReveal(value: RuleNode): boolean {
  return value.revealsTrueName === true && value.revealTiming === 'on_use_declared' && value.revealScope === 'servant_package' &&
    exactKeys(value, ['revealsTrueName', 'revealTiming', 'revealScope']);
}
function exactDefinitionOrConstraint(value: RuleNode, definitionIds: string[]): boolean {
  if (value.type !== 'or' || !exactKeys(value, ['type', 'conditions'])) return false;
  const conditions = Array.isArray(value.conditions) ? value.conditions as RuleNode[] : [];
  return conditions.length === definitionIds.length && conditions.every((entry, index) =>
    entry.type === 'has_card_id' && entry.cardId === definitionIds[index] && exactKeys(entry, ['type', 'cardId']));
}

export function containsCommanderLifecyclePrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsCommanderLifecyclePrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const record = value as RuleNode;
  if (privilegedTypes.has(String(record.type))) return true;
  return Object.values(record).some(containsCommanderLifecyclePrivilegedNode);
}

export function isDefinitionSetActiveCardCountAtLeastCondition(value: RuleNode): boolean {
  const ids = strings(value.definitionIds);
  return value.type === 'card_count_at_least' && value.target === 'controller' && value.zone === 'attack' &&
    value.activeOnly === true && value.face === 'up' && !!ids && Number.isSafeInteger(value.value) && Number(value.value) >= 1 &&
    exactKeys(value, ['type', 'target', 'zone', 'activeOnly', 'face', 'definitionIds', 'value']);
}

export function isAcceptedDefinitionSetRelocationAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'advance' || ability.activation.opens !== 'controller_action_window' ||
      !exactKeys(ability.activation, ['phase', 'opens']) || !commonEmpty(ability) || ability.conditions.length !== 1 ||
      ability.conditions[0]?.type !== 'source_owned' || !exactKeys(ability.conditions[0]!, ['type']) || ability.effects.length !== 1 ||
      ability.targets.length !== 1 || !exactReveal(ability.visibility)) return false;
  const effect = ability.effects[0]!; const ids = strings(effect.definitionIds);
  if (effect.type !== RELOCATE_DEFINITION_SET_WITHOUT_PLAY_EFFECT || effect.target !== 'definition_destinations' || !ids ||
      !exactKeys(effect, ['type', 'target', 'definitionIds'])) return false;
  const target = ability.targets[0]!; const count = target.count && typeof target.count === 'object' && !Array.isArray(target.count) ? target.count as RuleNode : {};
  const options = Array.isArray(target.options) ? target.options as RuleNode[] : [];
  if (target.id !== 'definition_destinations' || target.type !== 'choice' || target.visibility !== 'owner_only' ||
      count.min !== ids.length || count.max !== ids.length || !exactKeys(count, ['min', 'max']) || options.length !== ids.length * 2 ||
      !exactKeys(target, ['id', 'type', 'options', 'count', 'visibility'])) return false;
  const expected = ids.flatMap((id) => [`${id}::hand`, `${id}::attack_area`]);
  return options.every((option, index) => option.id === expected[index] && typeof option.label === 'string' && option.label.length > 0 &&
    exactKeys(option, ['id', 'label'])) && ability.limit.type === 'per_game' && ability.limit.uses === 1 && ability.limit.scope === 'this_card' &&
    exactKeys(ability.limit, ['type', 'uses', 'scope']);
}

export function isAcceptedRecallActiveDefinitionJoinSourceAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'combat' || ability.activation.opens !== 'controller_combat_action_window' ||
      !exactKeys(ability.activation, ['phase', 'opens']) || !commonEmpty(ability) || ability.conditions.length !== 1 ||
      ability.conditions[0]?.type !== 'source_owned' || !exactKeys(ability.conditions[0]!, ['type']) || ability.effects.length !== 1 ||
      ability.targets.length !== 1 || !empty(ability.visibility) || !empty(ability.limit)) return false;
  const effect = ability.effects[0]!; const ids = strings(effect.definitionIds);
  if (effect.type !== RECALL_ACTIVE_DEFINITION_AND_JOIN_SOURCE_EFFECT || effect.target !== 'active_definition_card' || !ids ||
      effect.sourceZone !== 'skill' || effect.destinationZone !== 'attack_area' || !exactKeys(effect, ['type','target','definitionIds','sourceZone','destinationZone'])) return false;
  const target = ability.targets[0]!; const scope = target.scope && typeof target.scope === 'object' && !Array.isArray(target.scope) ? target.scope as RuleNode : {};
  const count = target.count && typeof target.count === 'object' && !Array.isArray(target.count) ? target.count as RuleNode : {};
  const constraints = Array.isArray(target.constraints) ? target.constraints as RuleNode[] : [];
  return target.id === 'active_definition_card' && target.type === 'card_instance' && target.visibility === 'public' &&
    scope.zone === 'attack_area' && scope.controller === 'self' && scope.owner === 'controller' && exactKeys(scope, ['zone','controller','owner']) &&
    count.min === 1 && count.max === 1 && exactKeys(count, ['min','max']) && constraints.length === 1 && exactDefinitionOrConstraint(constraints[0]!, ids) &&
    exactKeys(target, ['id','type','scope','count','visibility','constraints']);
}

export function isAcceptedRetriggerActiveDefinitionSetAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'action' || ability.activation.opens !== 'controller_action_window' ||
      !exactKeys(ability.activation, ['phase','opens']) || !commonEmpty(ability) || ability.targets.length !== 0 || ability.effects.length !== 1 ||
      ability.conditions.length !== 2 || ability.conditions[0]?.type !== 'source_owned' || !exactKeys(ability.conditions[0]!, ['type']) ||
      !isDefinitionSetActiveCardCountAtLeastCondition(ability.conditions[1]!) || !empty(ability.limit) || !exactReveal(ability.visibility)) return false;
  const effect = ability.effects[0]!;
  return effect.type === RETRIGGER_ACTIVE_DEFINITION_SET_PLAY_EFFECTS && sameStrings(effect.definitionIds, ability.conditions[1]!.definitionIds) &&
    exactKeys(effect, ['type','definitionIds']);
}

export function isAcceptedCommanderLifecyclePrivilegedAbility(ability: AuthoringAbility): boolean {
  return isAcceptedDefinitionSetRelocationAbility(ability) || isAcceptedRecallActiveDefinitionJoinSourceAbility(ability) ||
    isAcceptedRetriggerActiveDefinitionSetAbility(ability);
}
