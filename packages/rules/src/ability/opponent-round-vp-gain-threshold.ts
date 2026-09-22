import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

export const OPPONENT_ROUND_VP_GAIN_TRIGGER = 'player.victory-points.changed';
export const OPPONENT_ROUND_VP_GAIN_THRESHOLD = 7;

function exactKeys(value: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

export function isOpponentRoundVpGainThresholdCondition(value: RuleNode): boolean {
  return value.type === 'event_round_victory_points_gain_crosses' &&
    value.threshold === OPPONENT_ROUND_VP_GAIN_THRESHOLD && exactKeys(value, ['type', 'threshold']);
}

function exactEmpty(value: RuleNode): boolean { return Object.keys(value).length === 0; }

export function isOpponentRoundVpGainThresholdCandidate(ability: AuthoringAbility): boolean {
  const raw = ability as unknown as { activation?: unknown; conditions?: unknown };
  const activation = raw.activation && typeof raw.activation === 'object' ? raw.activation as Record<string, unknown> : {};
  const conditions = Array.isArray(raw.conditions) ? raw.conditions : [];
  return activation.trigger === OPPONENT_ROUND_VP_GAIN_TRIGGER ||
    conditions.some((entry) => !!entry && typeof entry === 'object' && (entry as Record<string, unknown>).type === 'event_round_victory_points_gain_crosses');
}

export function isAcceptedOpponentRoundVpGainThresholdAbility(
  ability: AuthoringAbility,
  form: 'authoring' | 'compiled' = 'authoring',
): boolean {
  const raw = ability as unknown as Record<string, unknown>;
  const activation = raw.activation;
  if (ability.kind !== 'forced_trigger' || !activation || typeof activation !== 'object' || Array.isArray(activation) ||
    (activation as Record<string, unknown>).trigger !== OPPONENT_ROUND_VP_GAIN_TRIGGER ||
    !exactKeys(activation as RuleNode, ['trigger'])) return false;
  if (!Array.isArray(raw.conditions) || ability.conditions.length !== 2 || ability.conditions[0]?.type !== 'event_player_is_opponent' ||
    !exactKeys(ability.conditions[0], ['type']) || !isOpponentRoundVpGainThresholdCondition(ability.conditions[1]!)) return false;
  if (!Array.isArray(raw.targets) || !Array.isArray(raw.cost) || !Array.isArray(raw.creates) || !Array.isArray(raw.ruleModifiers) ||
    ability.targets.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length ||
    !raw.lifecycle || typeof raw.lifecycle !== 'object' || Array.isArray(raw.lifecycle) ||
    !raw.limit || typeof raw.limit !== 'object' || Array.isArray(raw.limit) ||
    !raw.visibility || typeof raw.visibility !== 'object' || Array.isArray(raw.visibility) ||
    !exactEmpty(ability.lifecycle) || !exactEmpty(ability.limit) || !exactEmpty(ability.visibility)) return false;
  if (!Array.isArray(raw.effects) || ability.effects.length !== 1) return false;
  const effect = ability.effects[0]!;
  const definitionId = typeof effect.definitionId === 'string' && effect.definitionId.length > 0;
  const linkedSkillId = typeof effect.linkedSkillId === 'string' && effect.linkedSkillId.length > 0;
  if (effect.type !== 'return_card_by_definition' || definitionId === linkedSkillId || effect.target !== 'controller' ||
    effect.destination !== 'master-skills' || effect.createIfMissing !== true || effect.face !== 'up' || effect.active !== false ||
    !Object.keys(effect).every((key) => ['type', 'target', 'definitionId', 'linkedSkillId', 'destination', 'createIfMissing', 'face', 'active'].includes(key))) return false;
  if (!raw.responseWindow || typeof raw.responseWindow !== 'object' || Array.isArray(raw.responseWindow) ||
    !raw.execution || typeof raw.execution !== 'object' || Array.isArray(raw.execution)) return false;
  const responseKeys = Object.keys(ability.responseWindow);
  if (form === 'authoring' ? responseKeys.length !== 0 :
    (responseKeys.length !== 0 && (responseKeys.length !== 2 || ability.responseWindow.order !== 'turn_order' || ability.responseWindow.passBehavior !== 'decline_this_window'))) return false;
  if (ability.execution.mode !== 'automatic') return false;
  const execution = ability.execution as unknown as Record<string, unknown>;
  if (form === 'authoring') {
    return Object.keys(execution).every((key) => ['mode', 'hostOps', 'allowedOperations'].includes(key)) &&
      ['hostOps', 'allowedOperations'].every((key) => execution[key] === undefined || (Array.isArray(execution[key]) && (execution[key] as unknown[]).length === 0));
  }
  if (execution.hostOps !== undefined || !Array.isArray(execution.allowedOperations)) return false;
  const allowed = execution.allowedOperations as unknown[];
  return allowed.length === 0 || (allowed.length === hostOperations.length && hostOperations.every((operation, index) => allowed[index] === operation));
}
