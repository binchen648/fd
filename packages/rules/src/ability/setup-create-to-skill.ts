import type { AuthoringAbility, ExecutableCardDefinition } from './types';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isEmptyRecord(value: unknown): boolean {
  return Object.keys(record(value)).length === 0;
}

function containsCreateCard(value: unknown, seen = new Set<object>()): boolean {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((entry) => containsCreateCard(entry, seen));
  const node = value as Record<string, unknown>;
  if (node.type === 'create_card') return true;
  return Object.values(node).some((entry) => containsCreateCard(entry, seen));
}

// Claim malformed members of this family before the legacy executor can see them.
export function isSetupCreateToSkillCandidate(ability: AuthoringAbility): boolean {
  return containsCreateCard(ability.effects) ||
    (ability.activation.trigger === 'game_start' && containsCreateCard(ability.creates));
}

export function isSetupCreateToSkillSemantic(ability: AuthoringAbility): boolean {
  if (!isSetupCreateToSkillCandidate(ability)) return false;
  if (ability.kind !== 'forced_trigger' || ability.activation.trigger !== 'game_start') return false;
  if (Object.keys(ability.activation).some((key) => key !== 'trigger')) return false;
  if (ability.conditions.length || ability.targets.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length) return false;
  if (ability.effects.length !== 1 || ability.execution.mode !== 'automatic') return false;
  if (!isEmptyRecord(ability.lifecycle) || !isEmptyRecord(ability.limit) || !isEmptyRecord(ability.visibility)) return false;
  const responseKeys = Object.keys(ability.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (ability.responseWindow.order !== undefined && ability.responseWindow.order !== 'turn_order') ||
    (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== 'decline_this_window')) return false;

  const effect = ability.effects[0]!;
  const destination = record(effect.to);
  return typeof effect.cardId === 'string' && effect.cardId.length > 0 &&
    destination.zone === 'skill' &&
    Object.keys(destination).every((key) => key === 'zone') &&
    effect.owner === undefined &&
    effect.then === undefined &&
    Object.keys(effect).every((key) => ['type', 'cardId', 'to'].includes(key));
}

/**
 * Setup creation may only point at a deferred, automatic master skill owned by
 * the same master definition as the source. `initialPlacement: outside_game`
 * is the authoring marker for that deferred entry and is intentionally allowed;
 * `initialZone` is the compiled marker for cards that would enter at setup.
 */
export function isSetupCreateToSkillTargetDefinition(
  source: ExecutableCardDefinition | undefined,
  target: ExecutableCardDefinition | undefined,
): boolean {
  return !!source && !!target &&
    source.cardType === 'master_skill' && typeof source.ownerId === 'string' &&
    target.cardType === 'master_skill' && target.mode === 'automatic' &&
    target.ownerId === source.ownerId && target.initialZone === undefined;
}
