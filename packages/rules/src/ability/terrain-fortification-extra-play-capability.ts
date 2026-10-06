import type { AuthoringAbility, RuleNode } from './types';

export const CONTROLLER_HAS_POSITIVE_TERRAIN_CONDITION = 'controller_has_positive_terrain' as const;
export const EFFECT_PLAYABLE_FACE_UP_CONSTRAINT = 'effect_playable_face_up' as const;
export const DOUBLE_CONTROLLER_TERRAIN_EFFECT = 'double_controller_terrain_this_round' as const;
export const FORTIFY_MOVED_IN_BATTLEFIELD_EFFECT = 'fortify_moved_in_battlefield_and_arm_next_round_deployment' as const;
export const PLAY_HAND_CARDS_WITH_TERRAIN_EXTRA_EFFECT = 'play_hand_cards_with_terrain_optional_second' as const;

const privilegedTypes = new Set<string>([
  CONTROLLER_HAS_POSITIVE_TERRAIN_CONDITION,
  EFFECT_PLAYABLE_FACE_UP_CONSTRAINT,
  DOUBLE_CONTROLLER_TERRAIN_EFFECT,
  FORTIFY_MOVED_IN_BATTLEFIELD_EFFECT,
  PLAY_HAND_CARDS_WITH_TERRAIN_EXTRA_EFFECT,
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
function commonEmpty(ability: AuthoringAbility): boolean {
  return ability.ruleModifiers.length === 0 && ability.creates.length === 0 && empty(ability.lifecycle) && empty(ability.limit) &&
    empty(ability.visibility) && standardResponse(ability) && automaticNoHost(ability);
}
function sourceOwnedOnly(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 1 && ability.conditions[0]?.type === 'source_owned' && exactKeys(ability.conditions[0]!, ['type']);
}
function fixedManaOne(ability: AuthoringAbility): boolean {
  return ability.cost.length === 1 && ability.cost[0]?.type === 'pay_mana' && ability.cost[0]?.amount === 1 &&
    exactKeys(ability.cost[0]!, ['type', 'amount']);
}

export function containsTerrainFortificationExtraPlayPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsTerrainFortificationExtraPlayPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const record = value as RuleNode;
  if (privilegedTypes.has(String(record.type))) return true;
  return Object.values(record).some(containsTerrainFortificationExtraPlayPrivilegedNode);
}

export function isControllerHasPositiveTerrainCondition(value: RuleNode): boolean {
  return value.type === CONTROLLER_HAS_POSITIVE_TERRAIN_CONDITION && exactKeys(value, ['type']);
}
export function isEffectPlayableFaceUpConstraint(value: RuleNode): boolean {
  return value.type === EFFECT_PLAYABLE_FACE_UP_CONSTRAINT && exactKeys(value, ['type']);
}

export function isAcceptedDoubleControllerTerrainAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'action' || ability.activation.opens !== 'controller_action_window' ||
      !exactKeys(ability.activation, ['phase', 'opens']) || !commonEmpty(ability) || !sourceOwnedOnly(ability) ||
      !(ability.cost.length === 0 || fixedManaOne(ability)) ||
      ability.targets.length !== 0 || ability.effects.length !== 1) return false;
  const effect = ability.effects[0]!;
  return effect.type === DOUBLE_CONTROLLER_TERRAIN_EFFECT && effect.multiplier === 2 && effect.duration === 'this_round' &&
    exactKeys(effect, ['type', 'multiplier', 'duration']);
}

export function isAcceptedFortifyMovedInBattlefieldAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'combat' || ability.activation.opens !== 'controller_combat_action_window' ||
      !exactKeys(ability.activation, ['phase', 'opens']) || !commonEmpty(ability) || !sourceOwnedOnly(ability) || !fixedManaOne(ability) ||
      ability.targets.length !== 0 || ability.effects.length !== 1) return false;
  const effect = ability.effects[0]!;
  return effect.type === FORTIFY_MOVED_IN_BATTLEFIELD_EFFECT && effect.movedPlayerPowerAdjustment === -4 &&
    effect.winDeployment === 'same_battlefield_next_round' &&
    exactKeys(effect, ['type', 'movedPlayerPowerAdjustment', 'winDeployment']);
}

function exactHandTarget(target: RuleNode, id: string, min: number): boolean {
  const scope = target.scope && typeof target.scope === 'object' && !Array.isArray(target.scope) ? target.scope as RuleNode : {};
  const count = target.count && typeof target.count === 'object' && !Array.isArray(target.count) ? target.count as RuleNode : {};
  const constraints = Array.isArray(target.constraints) ? target.constraints as RuleNode[] : [];
  return target.id === id && target.type === 'card_instance' && target.visibility === 'owner_only' &&
    scope.zone === 'hand' && scope.owner === 'controller' && scope.controller === 'self' && exactKeys(scope, ['zone', 'owner', 'controller']) &&
    count.min === min && count.max === 1 && exactKeys(count, ['min', 'max']) && constraints.length === 1 &&
    isEffectPlayableFaceUpConstraint(constraints[0]!) && exactKeys(target, ['id','type','scope','count','visibility','constraints', ...(min === 0 ? ['conditions'] : [])]);
}

export function isAcceptedTerrainExtraHandPlayAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'action' || ability.activation.opens !== 'controller_action_window' ||
      ability.activation.requiresSourceState !== 'active' || !exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) ||
      !commonEmpty(ability) || ability.conditions.length !== 1 || ability.conditions[0]?.type !== 'source_owned' ||
      !exactKeys(ability.conditions[0]!, ['type']) || ability.cost.length !== 0 || ability.targets.length !== 2 || ability.effects.length !== 1) return false;
  const first = ability.targets[0]!; const second = ability.targets[1]!;
  if (!exactHandTarget(first, 'first_hand_card', 1) || !exactHandTarget(second, 'second_hand_card', 0)) return false;
  const secondConditions = Array.isArray(second.conditions) ? second.conditions as RuleNode[] : [];
  if (secondConditions.length !== 1 || !isControllerHasPositiveTerrainCondition(secondConditions[0]!)) return false;
  const effect = ability.effects[0]!;
  return effect.type === PLAY_HAND_CARDS_WITH_TERRAIN_EXTRA_EFFECT && effect.firstTarget === 'first_hand_card' &&
    effect.secondTarget === 'second_hand_card' && effect.extraSecondMana === 2 &&
    exactKeys(effect, ['type', 'firstTarget', 'secondTarget', 'extraSecondMana']);
}

export function isAcceptedTerrainFortificationExtraPlayAbility(ability: AuthoringAbility): boolean {
  return isAcceptedDoubleControllerTerrainAbility(ability) || isAcceptedFortifyMovedInBattlefieldAbility(ability) ||
    isAcceptedTerrainExtraHandPlayAbility(ability);
}