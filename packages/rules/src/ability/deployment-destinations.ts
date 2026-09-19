import type { RuleNode } from './types';

function object(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function objects(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(object) : []; }
function exactKeys(value: RuleNode, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function isAcceptedLowerVpLoneBattlefieldDeploymentModifier(modifier: RuleNode): boolean {
  const scope = object(modifier.scope);
  const filter = object(scope.destinationFilter);
  const lifecycle = object(modifier.lifecycle);
  const priority = object(modifier.priority);
  return modifier.operation === 'replace' &&
    modifier.rule === 'deployment_destinations' &&
    text(scope.subject) === 'controller' &&
    text(filter.locationKind) === 'battlefield' &&
    typeof filter.opponentCountEquals === 'number' && filter.opponentCountEquals === 1 &&
    text(filter.opponentVictoryPoints) === 'less_than_controller' &&
    text(lifecycle.duration) === 'permanent' &&
    text(priority.tier) === 'card_text' &&
    text(priority.specificity) === 'explicit_exception' &&
    text(modifier.conflictPolicy) === 'explicit_exception_over_general' &&
    exactKeys(scope, ['subject', 'destinationFilter']) &&
    exactKeys(filter, ['locationKind', 'opponentCountEquals', 'opponentVictoryPoints']) &&
    exactKeys(lifecycle, ['duration']) &&
    exactKeys(priority, ['tier', 'specificity']) &&
    exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'lifecycle', 'priority', 'conflictPolicy']);
}

export function isAcceptedLowerVpLoneBattlefieldDeploymentAbility(ability: RuleNode): boolean {
  const activation = object(ability.activation);
  const conditions = objects(ability.conditions);
  const modifiers = objects(ability.ruleModifiers);
  const execution = object(ability.execution);
  return text(ability.kind) === 'passive' &&
    Object.keys(activation).length === 0 &&
    conditions.length === 1 && text(conditions[0]?.type) === 'source_owned' && exactKeys(conditions[0]!, ['type']) &&
    objects(ability.targets).length === 0 && objects(ability.effects).length === 0 &&
    objects(ability.cost).length === 0 && objects(ability.creates).length === 0 &&
    modifiers.length === 1 && isAcceptedLowerVpLoneBattlefieldDeploymentModifier(modifiers[0]!) &&
    Object.keys(object(ability.lifecycle)).length === 0 && Object.keys(object(ability.responseWindow)).length === 0 &&
    Object.keys(object(ability.limit)).length === 0 && Object.keys(object(ability.visibility)).length === 0 &&
    text(execution.mode || 'automatic') === 'automatic' &&
    exactKeys(execution, ['mode', 'hostOps', 'allowedOperations']);
}