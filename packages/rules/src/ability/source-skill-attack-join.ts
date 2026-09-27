import type { AuthoringAbility, RuleNode } from './types';
import { isExactActiveAttackAttributePairCondition } from './timed-resource-suppression';

export const SOURCE_SKILL_ATTACK_JOIN_EFFECT = 'join_source_skill_card_to_attack';

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

function emptyRecord(value: RuleNode): boolean { return Object.keys(value).length === 0; }

export function isSourceSkillAttackJoinEffect(value: RuleNode): boolean {
  return value.type === SOURCE_SKILL_ATTACK_JOIN_EFFECT && exactKeys(value, ['type']);
}

/** Find the privileged join primitive through nested wrappers so loader/runtime gates cannot be bypassed. */
export function containsSourceSkillAttackJoinNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSourceSkillAttackJoinNode);
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.type === SOURCE_SKILL_ATTACK_JOIN_EFFECT) return true;
  return Object.values(record).some(containsSourceSkillAttackJoinNode);
}

function isFixedPositiveControllerManaCost(ability: AuthoringAbility): boolean {
  if (ability.cost.length !== 1) return false;
  const cost = ability.cost[0]!;
  return cost.type === 'pay_mana' &&
    (cost.player === undefined || cost.player === 'controller') &&
    typeof cost.amount === 'number' && Number.isSafeInteger(cost.amount) && cost.amount > 0 &&
    Object.keys(cost).every((key) => ['type', 'player', 'amount'].includes(key));
}

/**
 * Generic data-driven whole-ability shell for "pay a fixed mana ability cost and join this owned
 * skill-zone physical card to the current attack". Joining is intentionally not a card play:
 * consumers do not fire on_use_declared/on_card_played and the joined card has paid play cost 0.
 */
export function isAcceptedSourceSkillAttackJoinAbility(ability: AuthoringAbility): boolean {
  const activation = ability.activation;
  const response = ability.responseWindow;
  return ability.kind === 'phase_action' && ability.execution.mode === 'automatic' &&
    ability.execution.allowedOperations.length === 0 &&
    activation.phase === 'action' && activation.opens === 'controller_action_window' &&
    Object.keys(activation).length === 2 && Object.keys(activation).every((key) => ['phase', 'opens'].includes(key)) &&
    ability.conditions.length === 1 && isExactActiveAttackAttributePairCondition(ability.conditions[0]!) &&
    ability.targets.length === 0 && isFixedPositiveControllerManaCost(ability) &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    emptyRecord(ability.lifecycle) && emptyRecord(ability.limit) && emptyRecord(ability.visibility) &&
    Object.keys(response).length === 2 && response.order === 'turn_order' && response.passBehavior === 'decline_this_window' &&
    ability.effects.length === 1 && isSourceSkillAttackJoinEffect(ability.effects[0]!);
}
