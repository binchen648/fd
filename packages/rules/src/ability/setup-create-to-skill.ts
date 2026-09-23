import type { AuthoringAbility, RuleNode } from './types';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isEmptyRecord(value: unknown): boolean {
  return Object.keys(record(value)).length === 0;
}

function isCreateCardEffect(effect: RuleNode | undefined): boolean {
  return effect?.type === 'create_card';
}

// Candidate ownership intentionally uses only the stable effect vocabulary. This
// keeps malformed members of this family from escaping to the legacy executor.
export function isSetupCreateToSkillCandidate(ability: AuthoringAbility): boolean {
  return ability.effects.some(isCreateCardEffect);
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
    destination.owner === undefined &&
    effect.owner === undefined &&
    effect.then === undefined &&
    Object.keys(effect).every((key) => ['type', 'cardId', 'to'].includes(key));
}
