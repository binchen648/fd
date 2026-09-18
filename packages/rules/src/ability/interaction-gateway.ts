import type { AuthoringAbility, RuleNode } from './types';

function node(value: unknown): RuleNode {
  return value && typeof value === 'object' ? value as RuleNode : {};
}
function nodes(value: unknown): RuleNode[] {
  return Array.isArray(value) ? value.filter((entry): entry is RuleNode => !!entry && typeof entry === 'object') : [];
}
function str(value: unknown): string { return typeof value === 'string' ? value : ''; }

/**
 * Structural envelope reserved by P3-TO-13. It intentionally survives one-field
 * mutations of the accepted representative so malformed near-matches fail closed
 * instead of dropping back to legacy PendingDecision handling.
 */
export function isPrivateOptionalHandPlayInteractionCandidate(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || str(ability.activation.phase) !== 'action' ||
    str(ability.activation.opens) !== 'controller_action_window' || ability.targets.length !== 1) return false;
  const target = ability.targets[0]!;
  if (target.type !== 'card_instance') return false;
  const count = node(target.count);
  const hasOptionalPrivateSignature = target.visibility === 'private_to_controller' || Number(count.max) === 3;
  return hasOptionalPrivateSignature;
}

/** Exact semantic contract accepted for the first Interaction Runtime slice. */
export function isPrivateOptionalHandPlayInteractionSemantic(ability: AuthoringAbility): boolean {
  if (!isPrivateOptionalHandPlayInteractionCandidate(ability)) return false;
  if (ability.activation.requiresSourceState !== 'active' || ability.conditions.length !== 0 ||
    ability.cost.length !== 0 || ability.creates.length !== 0 || ability.ruleModifiers.length !== 0) return false;
  if (Object.keys(ability.lifecycle).length !== 0 || str(ability.responseWindow.opens) || Object.keys(ability.limit).length !== 0) return false;
  if (ability.effects.length !== 1) return false;

  const target = ability.targets[0]!;
  const scope = node(target.scope);
  const count = node(target.count);
  const constraints = nodes(target.constraints);
  const effect = ability.effects[0]!;
  return scope.zone === 'hand' && scope.controller === 'self' && !scope.owner &&
    target.visibility === 'private_to_controller' &&
    Number(count.min) === 0 && Number(count.max) === 3 &&
    constraints.length === 1 && constraints[0]!.type === 'base_power_at_most' && Number(constraints[0]!.value) === 3 &&
    effect.type === 'play_selected_cards' && effect.target === target.id && effect.face === undefined;
}

function containsNodeType(value: unknown, type: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => containsNodeType(entry, type));
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.type === type || Object.values(record).some((entry) => containsNodeType(entry, type));
}

/** Reserved structural envelope for the FB2-23 private hand interaction. */
export function isSameBattlefieldPrivateHandReturnInteractionCandidate(ability: AuthoringAbility): boolean {
  return containsNodeType(ability, 'same_battlefield_as_controller') ||
    containsNodeType(ability, 'inspect_target_hand_optional_return_one_to_owner_deck');
}

/** Exact identity-free semantic contract accepted by FB2-23. */
export function isSameBattlefieldPrivateHandReturnInteractionSemantic(ability: AuthoringAbility): boolean {
  if (!isSameBattlefieldPrivateHandReturnInteractionCandidate(ability)) return false;
  if (ability.activation.requiresSourceState !== 'active' || ability.execution.mode !== 'automatic' ||
    ability.conditions.length !== 0 || ability.cost.length !== 0 || ability.creates.length !== 0 || ability.ruleModifiers.length !== 0) return false;
  if (Object.keys(ability.lifecycle).length !== 0 || str(ability.responseWindow.opens) || Object.keys(ability.limit).length !== 0) return false;

  const target = ability.targets[0]!;
  const count = node(target.count);
  const constraints = nodes(target.constraints);
  const effect = ability.effects[0]!;
  return typeof target.id === 'string' && target.id.length > 0 &&
    Object.keys(target).every((key) => ['id', 'type', 'count', 'constraints'].includes(key)) &&
    Object.keys(count).every((key) => ['min', 'max'].includes(key)) && Number(count.min) === 1 && Number(count.max) === 1 &&
    constraints.length === 1 && constraints[0]!.type === 'same_battlefield_as_controller' && Object.keys(constraints[0]!).length === 1 &&
    effect.type === 'inspect_target_hand_optional_return_one_to_owner_deck' && effect.target === target.id &&
    Object.keys(effect).every((key) => ['type', 'target'].includes(key));
}
