import { ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID } from '../core/card-source-state';
import type { AuthoringAbility, RuleNode } from './types';

export const CROSS_PHASE_ACTION_PROVIDER_EFFECT = 'grant_controller_action_abilities_in_combat_while_source_active' as const;
export const ONE_SHOT_USED_ATTACK_ABILITY_REUSE_EFFECT = 'grant_one_extra_used_attack_ability_activation_this_round' as const;
export const STRICT_POWER_REDEPLOY_SWAP_EFFECT = 'compare_current_total_power_and_swap_locations_if_strictly_higher' as const;

const privilegedTypes = new Set<string>([
  CROSS_PHASE_ACTION_PROVIDER_EFFECT,
  ONE_SHOT_USED_ATTACK_ABILITY_REUSE_EFFECT,
  STRICT_POWER_REDEPLOY_SWAP_EFFECT,
]);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function standardResponse(ability: AuthoringAbility): boolean {
  return ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window' &&
    exactKeys(ability.responseWindow, ['order', 'passBehavior']);
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function emptyCommon(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 &&
    ability.creates.length === 0 && empty(ability.visibility) && standardResponse(ability);
}
function exactActiveSourceLifecycle(value: RuleNode): boolean {
  const sourceValidity = value.sourceValidity && typeof value.sourceValidity === 'object' && !Array.isArray(value.sourceValidity)
    ? value.sourceValidity as RuleNode : {};
  return value.starts === 'immediate' && value.duration === 'while_card_active' && value.cleanup === 'when_card_leaves_active_area' &&
    sourceValidity.kind === 'accepted_source_state_policy' && sourceValidity.owner === 'card_zone_source_state' &&
    sourceValidity.policyId === ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID &&
    exactKeys(sourceValidity, ['kind', 'owner', 'policyId']) && exactKeys(value, ['starts', 'duration', 'cleanup', 'sourceValidity']);
}

export function isCrossPhaseActionProviderEffect(value: RuleNode): boolean {
  return value.type === CROSS_PHASE_ACTION_PROVIDER_EFFECT && exactKeys(value, ['type']);
}
export function isOneShotUsedAttackAbilityReuseEffect(value: RuleNode): boolean {
  return value.type === ONE_SHOT_USED_ATTACK_ABILITY_REUSE_EFFECT && value.target === 'reused_attack_ability_source' &&
    exactKeys(value, ['type', 'target']);
}
export function isStrictPowerRedeploySwapEffect(value: RuleNode): boolean {
  return value.type === STRICT_POWER_REDEPLOY_SWAP_EFFECT && value.target === 'power_comparison_opponent' &&
    exactKeys(value, ['type', 'target']);
}

export function containsCrossPhaseRedeploymentPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsCrossPhaseRedeploymentPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const record = value as RuleNode;
  if (privilegedTypes.has(String(record.type))) return true;
  return Object.values(record).some(containsCrossPhaseRedeploymentPrivilegedNode);
}

export function isAcceptedCrossPhaseActionProviderAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' && ability.activation.trigger === 'while_active' &&
    ability.activation.requiresSourceState === 'active' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    emptyCommon(ability) && ability.targets.length === 0 && ability.effects.length === 1 &&
    isCrossPhaseActionProviderEffect(ability.effects[0]!) && exactActiveSourceLifecycle(ability.lifecycle) &&
    empty(ability.limit) && automaticNoHost(ability);
}

export function isAcceptedOneShotUsedAttackAbilityReuseAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'combat' ||
      ability.activation.opens !== 'controller_combat_action_window' || ability.activation.requiresSourceState !== 'active' ||
      !exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) || !emptyCommon(ability) ||
      !empty(ability.lifecycle) || !automaticNoHost(ability)) return false;
  const target = ability.targets[0];
  if (!target || ability.targets.length !== 1 || target.id !== 'reused_attack_ability_source' || target.type !== 'card_instance') return false;
  const scope = target.scope && typeof target.scope === 'object' && !Array.isArray(target.scope) ? target.scope as RuleNode : {};
  const count = target.count && typeof target.count === 'object' && !Array.isArray(target.count) ? target.count as RuleNode : {};
  const constraints = Array.isArray(target.constraints) ? target.constraints as RuleNode[] : [];
  if (scope.zone !== 'attack_area' || scope.controller !== 'self' || scope.owner !== 'controller' ||
      !exactKeys(scope, ['zone', 'controller', 'owner']) || count.min !== 1 || count.max !== 1 || !exactKeys(count, ['min', 'max']) ||
      constraints.length !== 1 || constraints[0]!.type !== 'is_attack' || !exactKeys(constraints[0]!, ['type']) ||
      !exactKeys(target, ['id', 'type', 'scope', 'count', 'visibility', 'constraints']) || target.visibility !== 'public') return false;
  return ability.effects.length === 1 && isOneShotUsedAttackAbilityReuseEffect(ability.effects[0]!) &&
    ability.limit.type === 'unique' && ability.limit.scope === 'unique_keyword_group' && typeof ability.limit.groupId === 'string' && ability.limit.groupId.length > 0 &&
    ability.limit.window === 'controller_combat_action_window' && ability.limit.conflictPolicy === 'only_one_effect_may_activate_per_window' &&
    exactKeys(ability.limit, ['type', 'scope', 'groupId', 'window', 'conflictPolicy']);
}

export function isAcceptedStrictPowerRedeploySwapAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'action' ||
      ability.activation.opens !== 'controller_action_window' || ability.activation.requiresSourceState !== 'active' ||
      !exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) || !emptyCommon(ability) ||
      !empty(ability.lifecycle) || !empty(ability.limit) || !automaticNoHost(ability)) return false;
  const target = ability.targets[0];
  if (!target || ability.targets.length !== 1 || target.id !== 'power_comparison_opponent' || target.type !== 'player') return false;
  const count = target.count && typeof target.count === 'object' && !Array.isArray(target.count) ? target.count as RuleNode : {};
  const constraints = Array.isArray(target.constraints) ? target.constraints as RuleNode[] : [];
  if (count.min !== 1 || count.max !== 1 || !exactKeys(count, ['min', 'max']) || constraints.length !== 1 ||
      constraints[0]!.type !== 'not_controller' || !exactKeys(constraints[0]!, ['type']) ||
      !exactKeys(target, ['id', 'type', 'count', 'visibility', 'constraints']) || target.visibility !== 'public') return false;
  return ability.effects.length === 1 && isStrictPowerRedeploySwapEffect(ability.effects[0]!);
}

export function isAcceptedCrossPhaseRedeploymentPrivilegedAbility(ability: AuthoringAbility): boolean {
  return isAcceptedCrossPhaseActionProviderAbility(ability) || isAcceptedOneShotUsedAttackAbilityReuseAbility(ability) ||
    isAcceptedStrictPowerRedeploySwapAbility(ability);
}
