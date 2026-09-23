import { hostOperations, type AuthoringAbility, type RuleNode } from './types';

export const SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT = 'source_card_combat_power_bonus';
export const EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION = 'event_battle_opponent_count_equals';
export const EVENT_POWER_SOURCE_BONUS_POLICY = 'fb2-54-source-card-combat-power-bonus-v1';
export const EVENT_POWER_ENTRY_TRIGGERS = [
  'after_controller_enters_location',
  'after_player_deployed_to_battlefield',
] as const;
export const UNCONTESTED_CONTROLLER_WIN_TRIGGER = 'after_controller_wins_battle';

export type EventPowerUncontestedWinRewardVariant = 'opponent_entry_power' | 'uncontested_win_reward';

function isNode(value: unknown): value is RuleNode {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function node(value: unknown): RuleNode { return isNode(value) ? value : {}; }
function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
function exactKeys(value: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function emptyObject(value: unknown): boolean { return isNode(value) && Object.keys(value).length === 0; }
function emptyArray(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function typeOnly(value: RuleNode, type: string): boolean { return value.type === type && exactKeys(value, ['type']); }
function exactResponse(value: RuleNode, form: 'authoring' | 'compiled'): boolean {
  if (form === 'authoring') return Object.keys(value).length === 0;
  return value.order === 'turn_order' && value.passBehavior === 'decline_this_window' &&
    exactKeys(value, ['order', 'passBehavior']);
}
function exactExecution(value: RuleNode, form: 'authoring' | 'compiled'): boolean {
  if (value.mode !== 'automatic' || !Object.keys(value).every((key) => ['mode', 'hostOps', 'allowedOperations'].includes(key))) return false;
  for (const key of ['hostOps', 'allowedOperations']) {
    const requested = value[key];
    if (requested === undefined) continue;
    if (!Array.isArray(requested)) return false;
    if (form === 'authoring' && requested.length !== 0) return false;
    if (form === 'compiled' && requested.length !== 0 &&
        !(requested.length === hostOperations.length && hostOperations.every((operation, index) => requested[index] === operation))) return false;
  }
  return true;
}
function exactEmptyEnvelope(raw: RuleNode): boolean {
  return emptyArray(raw.targets) && emptyArray(raw.cost) && emptyArray(raw.creates) && emptyArray(raw.ruleModifiers) &&
    emptyObject(raw.lifecycle) && emptyObject(raw.limit) && emptyObject(raw.visibility) &&
    (raw.markers === undefined || (Array.isArray(raw.markers) && raw.markers.length === 0));
}
function commonAbilityKeys(raw: RuleNode): boolean {
  return Object.keys(raw).every((key) => [
    'id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost', 'creates',
    'ruleModifiers', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution',
  ].includes(key));
}

export function isAcceptedEventBattleOpponentCountEqualsCondition(value: RuleNode): boolean {
  return value.type === EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION && value.count === 0 && exactKeys(value, ['type', 'count']);
}

function exactOpponentEntryPowerAbility(raw: RuleNode, form: 'authoring' | 'compiled'): boolean {
  if (raw.kind !== 'forced_trigger' || !commonAbilityKeys(raw) || !exactEmptyEnvelope(raw)) return false;
  const activation = node(raw.activation);
  if (!EVENT_POWER_ENTRY_TRIGGERS.includes(String(activation.trigger) as (typeof EVENT_POWER_ENTRY_TRIGGERS)[number]) ||
      !exactKeys(activation, ['trigger'])) return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 3 || !typeOnly(conditions[0]!, 'source_active') ||
      !typeOnly(conditions[1]!, 'event_player_is_opponent') ||
      !typeOnly(conditions[2]!, 'event_location_equals_controller')) return false;
  const effects = nodes(raw.effects);
  if (effects.length !== 1 || effects[0]!.type !== SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT ||
      effects[0]!.amount !== 2 || !exactKeys(effects[0]!, ['type', 'amount'])) return false;
  return exactResponse(node(raw.responseWindow), form) && exactExecution(node(raw.execution), form);
}

function exactUncontestedWinRewardAbility(raw: RuleNode, form: 'authoring' | 'compiled'): boolean {
  if (raw.kind !== 'forced_trigger' || !commonAbilityKeys(raw) || !exactEmptyEnvelope(raw)) return false;
  const activation = node(raw.activation);
  if (activation.trigger !== UNCONTESTED_CONTROLLER_WIN_TRIGGER || !exactKeys(activation, ['trigger'])) return false;
  const conditions = nodes(raw.conditions);
  if (conditions.length !== 3 || !typeOnly(conditions[0]!, 'source_active') ||
      !typeOnly(conditions[1]!, 'event_location_equals_controller') ||
      !isAcceptedEventBattleOpponentCountEqualsCondition(conditions[2]!)) return false;
  const effects = nodes(raw.effects);
  if (effects.length !== 1 || effects[0]!.type !== 'adjust_victory_points' || effects[0]!.player !== 'controller' ||
      effects[0]!.amount !== 4 || !exactKeys(effects[0]!, ['type', 'player', 'amount'])) return false;
  return exactResponse(node(raw.responseWindow), form) && exactExecution(node(raw.execution), form);
}

export function classifyAcceptedEventPowerUncontestedWinRewardAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'authoring',
): EventPowerUncontestedWinRewardVariant | undefined {
  const raw = ability as RuleNode;
  if (exactOpponentEntryPowerAbility(raw, form)) return 'opponent_entry_power';
  if (exactUncontestedWinRewardAbility(raw, form)) return 'uncontested_win_reward';
  return undefined;
}

function containsReservedVocabulary(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsReservedVocabulary);
  if (!isNode(value)) return false;
  if ([SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT, EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION].includes(String(value.type))) return true;
  return Object.values(value).some(containsReservedVocabulary);
}

/** Reserves only FB2-54 vocabulary; existing trigger/condition primitives stay independently reusable. */
export function isEventPowerUncontestedWinRewardCandidate(ability: AuthoringAbility | RuleNode): boolean {
  return containsReservedVocabulary(ability);
}

export function isAcceptedEventPowerUncontestedWinRewardAbility(
  ability: AuthoringAbility | RuleNode,
  form: 'authoring' | 'compiled' = 'authoring',
): boolean {
  return classifyAcceptedEventPowerUncontestedWinRewardAbility(ability, form) !== undefined;
}