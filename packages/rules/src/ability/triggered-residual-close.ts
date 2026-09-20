import { isAcceptedCurrentRoundCombatLossAbsenceCondition } from './current-round-combat-loss-condition';
import { hostOperations, type AuthoringAbility } from './types';

export function isBattleEndResidualCloseCandidate(ability: AuthoringAbility): boolean {
  const hasActiveSource = ability.conditions.some((condition) => condition.type === 'source_active');
  const hasCombatLossCondition = ability.conditions.some((condition) =>
    condition.type === 'player_flag_number_not_current_round' && condition.key === 'combatLossRound');
  const closesSource = ability.effects.some((effect) => effect.type === 'close_source_card');
  return (hasActiveSource && hasCombatLossCondition) ||
    (ability.activation.trigger === 'after_battle_ended' &&
      (closesSource || (hasActiveSource && ability.conditions.some((condition) =>
        condition.type === 'player_flag_number_not_current_round'))));
}

export function isBattleEndResidualCloseSemantic(ability: AuthoringAbility): boolean {
  if (!isBattleEndResidualCloseCandidate(ability)) return false;
  if (ability.kind !== 'residual' || ability.activation.phase !== 'combat' || ability.activation.trigger !== 'after_battle_ended' ||
      ability.activation.requiresSourceState !== 'active' || ability.activation.opens !== undefined ||
      Object.keys(ability.activation).some((key) => !['phase', 'trigger', 'requiresSourceState'].includes(key))) return false;
  if (ability.conditions.length !== 2 || ability.conditions[0]?.type !== 'source_active' ||
      Object.keys(ability.conditions[0]).length !== 1 ||
      !isAcceptedCurrentRoundCombatLossAbsenceCondition(ability.conditions[1]!)) return false;
  if (ability.targets.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length ||
      ability.effects.length !== 1 || ability.effects[0]?.type !== 'close_source_card' ||
      Object.keys(ability.effects[0]).some((key) => !['type', 'id', 'printedClause'].includes(key))) return false;
  if (ability.lifecycle.duration !== 'while_active' || ability.lifecycle.starts !== 'immediate' ||
      ability.lifecycle.cleanup !== 'remain_active' || Object.keys(ability.lifecycle).length !== 3) return false;
  if (Object.keys(ability.responseWindow).some((key) => !['order', 'passBehavior'].includes(key)) ||
      (ability.responseWindow.order !== undefined && ability.responseWindow.order !== 'turn_order') ||
      (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== 'decline_this_window') ||
      Object.keys(ability.limit).length ||
      Object.keys(ability.visibility).length || ability.execution.mode !== 'automatic') return false;
  const allowedOperations = ability.execution.allowedOperations;
  if (!Array.isArray(allowedOperations) ||
      (allowedOperations.length !== 0 &&
        (allowedOperations.length !== hostOperations.length ||
          !hostOperations.every((operation, index) => allowedOperations[index] === operation)))) return false;
  return true;
}
