import type { AuthoringAbility, AuthoringCard, RuleNode } from './types';

export type AcceptedSkillUseForbidSelector =
  | 'same_location_true_name_off_attack'
  | 'same_location_opponent_facedown_skill';

function record(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function exactKeys(value: RuleNode, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
function exactZonePair(value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== 2 || value.some((entry) => typeof entry !== 'string')) return false;
  return new Set(value).size === 2 && value.includes('master-skills') && value.includes('servant-skills');
}

export function classifyAcceptedSkillUseForbidModifier(modifier: RuleNode): AcceptedSkillUseForbidSelector | undefined {
  if (modifier.operation !== 'forbid' || modifier.rule !== 'skill_use') return undefined;
  if (!exactKeys(modifier, ['id', 'printedClause', 'operation', 'rule', 'scope', 'lifecycle'])) return undefined;
  const scope = record(modifier.scope);
  const skillCard = record(scope.skillCard);
  const lifecycle = record(modifier.lifecycle);
  if (!exactKeys(scope, ['subject', 'skillCard']) || !exactKeys(lifecycle, ['duration'])) return undefined;

  if (scope.subject === 'players_at_source_location' && lifecycle.duration === 'while_active' &&
      exactKeys(skillCard, ['notInAttack', 'trueNameRelease']) &&
      skillCard.notInAttack === true && skillCard.trueNameRelease === true) {
    return 'same_location_true_name_off_attack';
  }

  if (scope.subject === 'opponents_at_source_location' && lifecycle.duration === 'this_round' &&
      exactKeys(skillCard, ['zones', 'face']) && exactZonePair(skillCard.zones) && skillCard.face === 'down') {
    return 'same_location_opponent_facedown_skill';
  }

  return undefined;
}

export function isAcceptedStaticWhileActiveSkillUseForbidAbility(ability: AuthoringAbility): boolean {
  if (ability.execution.mode !== 'automatic' || ability.kind !== 'passive') return false;
  if (ability.lifecycle.duration !== 'while_active' || !exactKeys(ability.lifecycle, ['duration'])) return false;
  if (ability.ruleModifiers.length !== 1 || classifyAcceptedSkillUseForbidModifier(ability.ruleModifiers[0]!) !== 'same_location_true_name_off_attack') return false;
  return ability.conditions.length === 1 && ability.conditions[0]!.type === 'source_active';
}

export function definitionHasStructuralTrueNameRelease(definition: AuthoringCard | undefined): boolean {
  return definition?.abilities.some((ability) => ability.visibility.revealsTrueName === true) === true;
}