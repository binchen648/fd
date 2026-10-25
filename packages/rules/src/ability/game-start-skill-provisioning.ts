import type { AuthoringAbility, RuleNode } from './types';

export function isGameStartSkillProvisioningCandidate(ability: AuthoringAbility): boolean {
  return ability.effects.some((effect) => effect.type === 'provision_skill_cards');
}

function isExactGameStartSkillProvisioningEffect(effect: RuleNode): boolean {
  const targets = effect.targetDefinitionIds;
  return effect.type === 'provision_skill_cards' && effect.player === 'controller' &&
    Array.isArray(targets) && targets.length > 0 &&
    targets.every((target) => typeof target === 'string' && target.length > 0) &&
    new Set(targets).size === targets.length &&
    Object.keys(effect).every((key) => ['type', 'player', 'targetDefinitionIds'].includes(key));
}

export function isGameStartSkillProvisioningSemantic(ability: AuthoringAbility): boolean {
  if (!isGameStartSkillProvisioningCandidate(ability) || ability.kind !== 'forced_trigger' || ability.execution.mode !== 'automatic' ||
    !Array.isArray(ability.execution.allowedOperations) || ability.execution.allowedOperations.length) return false;
  if (ability.activation.trigger !== 'game_start' || Object.keys(ability.activation).some((key) => key !== 'trigger')) return false;
  if (ability.conditions.length || ability.targets.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length) return false;
  const responseKeys = Object.keys(ability.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (ability.responseWindow.order !== undefined && ability.responseWindow.order !== 'turn_order') ||
    (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== 'decline_this_window') ||
    Object.keys(ability.limit).length || Object.keys(ability.visibility).length || Object.keys(ability.lifecycle).length) return false;
  return ability.effects.length === 1 && isExactGameStartSkillProvisioningEffect(ability.effects[0]!);
}

export function gameStartSkillProvisioningTargetDefinitionIds(ability: AuthoringAbility): string[] | undefined {
  if (!isGameStartSkillProvisioningSemantic(ability)) return undefined;
  return ability.effects[0]!.targetDefinitionIds as string[];
}
