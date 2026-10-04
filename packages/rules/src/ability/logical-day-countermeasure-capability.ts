import type { GameState } from '../schema/game';
import type { AbilityEvent, AuthoringAbility, EffectContext, PlayerId, RuleNode } from './types';

export const LOGICAL_DAY_CYCLE_INITIALIZE_EFFECT = 'logical_day_cycle_initialize' as const;
export const LOGICAL_DAY_CYCLE_ADVANCE_EFFECT = 'logical_day_cycle_advance' as const;
export const LOGICAL_DAY_CYCLE_SCHEDULE_RESET_EFFECT = 'logical_day_cycle_schedule_reset' as const;
export const LOGICAL_DAY_CYCLE_RESOLVE_RESET_EFFECT = 'logical_day_cycle_resolve_reset' as const;
export const LOGICAL_DAY_CYCLE_AWAKEN_EFFECT = 'logical_day_cycle_awaken' as const;
export const LOGICAL_DAY_DEFINITION_PLAY_OVERRIDE_EFFECT = 'logical_day_definition_play_override' as const;
export const SOURCE_BOUND_DEFINITION_PERSISTENCE_OVERRIDE_EFFECT = 'source_bound_definition_persistence_override' as const;
export const ARM_NEXT_OPPONENT_ATTRIBUTE_USE_DEFEAT_EFFECT = 'arm_next_opponent_attribute_use_defeat' as const;
export const RESTORE_COMMAND_SEALS_RETURN_DEFINITION_EFFECT = 'restore_command_seals_return_definition_to_skill' as const;
export const JOIN_SOURCE_SKILL_TO_ATTACK_ZERO_COST_EFFECT = 'join_source_skill_card_to_attack_zero_cost' as const;

const PREFIX = '__fd_logical_day_cycle:';
const ARM_PREFIX = '__fd_armed_attribute_use:';
const privilegedTypes = new Set<string>([
  LOGICAL_DAY_CYCLE_INITIALIZE_EFFECT,
  LOGICAL_DAY_CYCLE_ADVANCE_EFFECT,
  LOGICAL_DAY_CYCLE_SCHEDULE_RESET_EFFECT,
  LOGICAL_DAY_CYCLE_RESOLVE_RESET_EFFECT,
  LOGICAL_DAY_CYCLE_AWAKEN_EFFECT,
  LOGICAL_DAY_DEFINITION_PLAY_OVERRIDE_EFFECT,
  SOURCE_BOUND_DEFINITION_PERSISTENCE_OVERRIDE_EFFECT,
  ARM_NEXT_OPPONENT_ATTRIBUTE_USE_DEFEAT_EFFECT,
  RESTORE_COMMAND_SEALS_RETURN_DEFINITION_EFFECT,
  JOIN_SOURCE_SKILL_TO_ATTACK_ZERO_COST_EFFECT,
]);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function key(value: unknown): value is string { return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value); }
function id(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 180; }
function safePositive(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) > 0; }
function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('LOGICAL_DAY_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function flags(state: GameState, playerId: PlayerId): Record<string, boolean | string | number> {
  const r = runtime(state);
  return (r.structuredPlayerFlagsByPlayer ??= {})[playerId] ??= {};
}
function cycleFlag(cycleKey: string, field: string): string { return `${PREFIX}${cycleKey}:${field}`; }
function armFlag(sourceCardId: string, abilityId: string): string { return `${ARM_PREFIX}${sourceCardId}:${abilityId}`; }

function standardAuto(ability: AuthoringAbility): boolean {
  return ability.targets.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) &&
    exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window' &&
    ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function forced(ability: AuthoringAbility, trigger: string, conditionCount = 0): boolean {
  return ability.kind === 'forced_trigger' && ability.activation.trigger === trigger && exactKeys(ability.activation, ['trigger']) &&
    standardAuto(ability) && ability.conditions.length === conditionCount && ability.effects.length === 1;
}
function passive(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' && empty(ability.activation) && standardAuto(ability) && ability.conditions.length === 0 && ability.effects.length === 1;
}
function phaseAction(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' &&
    exactKeys(ability.activation, ['phase', 'opens']) && standardAuto(ability) && ability.conditions.length === 0 && ability.effects.length === 1;
}

export function isLogicalDayCycleInitializeEffect(effect: RuleNode): boolean {
  return effect.type === LOGICAL_DAY_CYCLE_INITIALIZE_EFFECT && key(effect.cycleKey) && effect.initialDay === 1 && effect.maxDay === 4 &&
    id(effect.stageDefinitionId) && effect.stageDay === 3 && id(effect.awakenDefinitionId) &&
    exactKeys(effect, ['type', 'cycleKey', 'initialDay', 'maxDay', 'stageDefinitionId', 'stageDay', 'awakenDefinitionId']);
}
export function isLogicalDayCycleAdvanceEffect(effect: RuleNode): boolean {
  return effect.type === LOGICAL_DAY_CYCLE_ADVANCE_EFFECT && key(effect.cycleKey) && exactKeys(effect, ['type', 'cycleKey']);
}
export function isLogicalDayCycleScheduleResetEffect(effect: RuleNode): boolean {
  return effect.type === LOGICAL_DAY_CYCLE_SCHEDULE_RESET_EFFECT && key(effect.cycleKey) && exactKeys(effect, ['type', 'cycleKey']);
}
export function isLogicalDayCycleResolveResetEffect(effect: RuleNode): boolean {
  return effect.type === LOGICAL_DAY_CYCLE_RESOLVE_RESET_EFFECT && key(effect.cycleKey) && effect.rewardVp === 1 && id(effect.closeDefinitionId) &&
    exactKeys(effect, ['type', 'cycleKey', 'rewardVp', 'closeDefinitionId']);
}
export function isLogicalDayCycleAwakenEffect(effect: RuleNode): boolean {
  return effect.type === LOGICAL_DAY_CYCLE_AWAKEN_EFFECT && key(effect.cycleKey) && effect.day === 4 &&
    exactKeys(effect, ['type', 'cycleKey', 'day']);
}
export function isLogicalDayDefinitionPlayOverrideEffect(effect: RuleNode): boolean {
  return effect.type === LOGICAL_DAY_DEFINITION_PLAY_OVERRIDE_EFFECT && key(effect.cycleKey) && safePositive(effect.day) &&
    id(effect.targetDefinitionId) && effect.requirementType === 'skill_zone_mana_at_least' && safePositive(effect.requirementValue) &&
    effect.ignorePerGamePlayLimit === true &&
    exactKeys(effect, ['type', 'cycleKey', 'day', 'targetDefinitionId', 'requirementType', 'requirementValue', 'ignorePerGamePlayLimit']);
}
export function isSourceBoundDefinitionPersistenceOverrideEffect(effect: RuleNode): boolean {
  return effect.type === SOURCE_BOUND_DEFINITION_PERSISTENCE_OVERRIDE_EFFECT && id(effect.targetDefinitionId) &&
    effect.ignorePerGamePlayLimit === true && effect.grantResidual === true &&
    exactKeys(effect, ['type', 'targetDefinitionId', 'ignorePerGamePlayLimit', 'grantResidual']);
}
export function isArmNextOpponentAttributeUseDefeatEffect(effect: RuleNode): boolean {
  return effect.type === ARM_NEXT_OPPONENT_ATTRIBUTE_USE_DEFEAT_EFFECT && id(effect.attribute) && effect.requireSameLocation === true &&
    exactKeys(effect, ['type', 'attribute', 'requireSameLocation']);
}
export function isRestoreCommandSealsReturnDefinitionEffect(effect: RuleNode): boolean {
  return effect.type === RESTORE_COMMAND_SEALS_RETURN_DEFINITION_EFFECT && key(effect.cycleKey) && id(effect.definitionId) && effect.commandSeals === 3 &&
    exactKeys(effect, ['type', 'cycleKey', 'definitionId', 'commandSeals']);
}
export function isJoinSourceSkillToAttackZeroCostEffect(effect: RuleNode): boolean {
  return effect.type === JOIN_SOURCE_SKILL_TO_ATTACK_ZERO_COST_EFFECT && key(effect.cycleKey) && effect.day === 3 &&
    exactKeys(effect, ['type', 'cycleKey', 'day']);
}

export function isAcceptedLogicalDayCountermeasureAbility(ability: AuthoringAbility): boolean {
  const effect = ability.effects[0];
  if (!effect) return false;
  if (isLogicalDayCycleInitializeEffect(effect)) return forced(ability, 'game_start');
  if (isLogicalDayCycleAdvanceEffect(effect)) return forced(ability, 'round_end');
  if (isLogicalDayCycleScheduleResetEffect(effect)) return forced(ability, 'after_controller_loses_battle');
  if (isLogicalDayCycleResolveResetEffect(effect)) return forced(ability, 'round_start');
  if (isLogicalDayCycleAwakenEffect(effect)) return forced(ability, 'after_controller_wins_battle');
  if (isLogicalDayDefinitionPlayOverrideEffect(effect) || isSourceBoundDefinitionPersistenceOverrideEffect(effect)) return passive(ability);
  if (isArmNextOpponentAttributeUseDefeatEffect(effect)) {
    if (!forced(ability, 'on_card_played', 2)) return false;
    return ability.conditions.some((condition) => condition.type === 'source_active' && exactKeys(condition, ['type'])) &&
      ability.conditions.some((condition) => condition.type === 'event_source_card_is_source' && exactKeys(condition, ['type']));
  }
  if (isRestoreCommandSealsReturnDefinitionEffect(effect)) return forced(ability, 'after_logical_day_cycle_awakened');
  if (isJoinSourceSkillToAttackZeroCostEffect(effect)) return phaseAction(ability);
  return false;
}

export function containsLogicalDayCountermeasurePrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsLogicalDayCountermeasurePrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const node = value as RuleNode;
  if (privilegedTypes.has(String(node.type))) return true;
  return Object.values(node).some(containsLogicalDayCountermeasurePrivilegedNode);
}

export function canExecuteLogicalDayCountermeasureEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedLogicalDayCountermeasureAbility(ability)) return false;
  const effect = ability.effects[0]!;
  if (isJoinSourceSkillToAttackZeroCostEffect(effect)) {
    const source = state.cards.find((card) => card.instanceId === ctx.sourceCardId);
    const definition = source && state.abilityRuntime?.pack.cards[source.definitionId];
    return !!source && !!definition && definition.cardType === 'master_skill' &&
      source.ownerPlayerId === ctx.controllerId && source.controllerPlayerId === ctx.controllerId && source.zone === 'skill' &&
      logicalDayCycleMatches(state, ctx.controllerId, String(effect.cycleKey), Number(effect.day));
  }
  if (isRestoreCommandSealsReturnDefinitionEffect(effect)) {
    return ctx.event?.type === 'after_logical_day_cycle_awakened' && ctx.event.playerId === ctx.controllerId &&
      logicalDayCycleAwake(state, ctx.controllerId, String(effect.cycleKey));
  }
  return true;
}

type InitEffect = RuleNode & {
  cycleKey: string; initialDay: 1; maxDay: 4; stageDefinitionId: string; stageDay: 3; awakenDefinitionId: string;
};
function provider(state: GameState, controllerId: PlayerId, cycleKey: string): { sourceCardId: string; ability: AuthoringAbility; effect: InitEffect } | undefined {
  const r = state.abilityRuntime;
  if (!r) return undefined;
  const found: Array<{ sourceCardId: string; ability: AuthoringAbility; effect: InitEffect }> = [];
  for (const physical of state.cards) {
    if (physical.ownerPlayerId !== controllerId || physical.controllerPlayerId !== controllerId || ['discard', 'removed_from_game'].includes(physical.zone)) continue;
    const definition = r.pack.cards[physical.definitionId];
    if (!definition) continue;
    for (const ability of definition.abilities) {
      const effect = ability.effects[0];
      if (effect && isLogicalDayCycleInitializeEffect(effect) && effect.cycleKey === cycleKey && isAcceptedLogicalDayCountermeasureAbility(ability)) {
        found.push({ sourceCardId: physical.instanceId, ability, effect: effect as InitEffect });
      }
    }
  }
  if (found.length > 1) throw new Error('LOGICAL_DAY_PROVIDER_CONFLICT');
  return found[0];
}
function dayValue(state: GameState, controllerId: PlayerId, cycleKey: string): number | undefined {
  const providerEntry = provider(state, controllerId, cycleKey);
  if (!providerEntry) return undefined;
  const value = state.ruleOverrides?.logicalDayByPlayer?.[controllerId];
  return Number.isSafeInteger(value) && Number(value) >= 1 && Number(value) <= providerEntry.effect.maxDay ? Number(value) : undefined;
}
export function logicalDayCycleMatches(state: GameState, controllerId: PlayerId, cycleKey: string, day: number): boolean {
  return key(cycleKey) && Number.isSafeInteger(day) && dayValue(state, controllerId, cycleKey) === day && !logicalDayCycleAwake(state, controllerId, cycleKey);
}
export function logicalDayCycleAwake(state: GameState, controllerId: PlayerId, cycleKey: string): boolean {
  if (!provider(state, controllerId, cycleKey)) return false;
  return flags(state, controllerId)[cycleFlag(cycleKey, 'awake')] === true;
}
export function logicalDayCycleResetPending(state: GameState, controllerId: PlayerId, cycleKey: string): boolean {
  if (!provider(state, controllerId, cycleKey)) return false;
  return flags(state, controllerId)[cycleFlag(cycleKey, 'pendingReset')] === true;
}

function ensureDefinitionInSkill(state: GameState, controllerId: PlayerId, definitionId: string, generatedBy: string): void {
  const r = runtime(state);
  const definition = r.pack.cards[definitionId];
  if (!definition || definition.cardType !== 'master_skill') throw new Error('LOGICAL_DAY_STAGE_DEFINITION_INVALID');
  const existing = state.cards.filter((card) => card.ownerPlayerId === controllerId && card.definitionId === definitionId && card.zone !== 'removed_from_game');
  if (existing.length > 1) throw new Error('LOGICAL_DAY_STAGE_DUPLICATE');
  if (existing.length === 1) {
    const physical = existing[0]!;
    if (physical.controllerPlayerId !== controllerId || physical.generatedBy !== generatedBy) throw new Error('LOGICAL_DAY_STAGE_PROVENANCE_INVALID');
    if (physical.zone === 'skill') return;
    if (physical.zone !== 'discard') throw new Error('LOGICAL_DAY_STAGE_ZONE_INVALID');
    physical.zone = 'skill';
    physical.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
    r.cardState[physical.instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
    return;
  }
  const instanceId = `${controllerId}:logical-day:${definitionId}`;
  if (state.cards.some((card) => card.instanceId === instanceId)) throw new Error('LOGICAL_DAY_STAGE_INSTANCE_CONFLICT');
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: controllerId, controllerPlayerId: controllerId, zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: controllerId }, generatedBy,
  });
  r.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
}
function closeOwnedDefinitionToSkill(state: GameState, controllerId: PlayerId, definitionId: string): void {
  const r = runtime(state);
  const matching = state.cards.filter((card) => card.ownerPlayerId === controllerId && card.definitionId === definitionId && card.zone !== 'removed_from_game');
  if (matching.length > 1) throw new Error('LOGICAL_DAY_CLOSE_DEFINITION_DUPLICATE');
  const physical = matching[0];
  if (!physical) return;
  if (physical.controllerPlayerId !== controllerId) throw new Error('LOGICAL_DAY_CLOSE_DEFINITION_CONTROL_INVALID');
  physical.zone = 'skill';
  physical.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
  const cardState = r.cardState[physical.instanceId] ??= { active: false, faceDown: false, playedRound: state.round.roundNumber };
  cardState.active = false; cardState.faceDown = false; delete cardState.paidManaOnPlay;
}

export type LogicalDayResolution = 'handled' | 'awakened' | 'not_handled';
export function resolveLogicalDayCountermeasureEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): LogicalDayResolution {
  const effect = ability.effects[0];
  if (!effect || !privilegedTypes.has(String(effect.type))) return 'not_handled';
  if (!isAcceptedLogicalDayCountermeasureAbility(ability)) throw new Error('LOGICAL_DAY_ABILITY_INVALID');
  const controller = state.players.find((player) => player.id === ctx.controllerId);
  if (!controller) throw new Error('LOGICAL_DAY_CONTROLLER_MISSING');
  const bag = flags(state, controller.id);

  if (isLogicalDayCycleInitializeEffect(effect)) {
    if (provider(state, controller.id, String(effect.cycleKey))?.sourceCardId !== ctx.sourceCardId) throw new Error('LOGICAL_DAY_PROVIDER_INVALID');
    state.ruleOverrides ??= {};
    state.ruleOverrides.logicalDayByPlayer = { ...(state.ruleOverrides.logicalDayByPlayer ?? {}), [controller.id]: 1 };
    bag[cycleFlag(String(effect.cycleKey), 'providerSource')] = ctx.sourceCardId;
    bag[cycleFlag(String(effect.cycleKey), 'providerAbility')] = ability.id;
    bag[cycleFlag(String(effect.cycleKey), 'pendingReset')] = false;
    bag[cycleFlag(String(effect.cycleKey), 'awake')] = false;
    return 'handled';
  }

  const cycleKey = String(effect.cycleKey ?? '');
  const init = key(cycleKey) ? provider(state, controller.id, cycleKey) : undefined;
  if ((isLogicalDayCycleAdvanceEffect(effect) || isLogicalDayCycleScheduleResetEffect(effect) || isLogicalDayCycleResolveResetEffect(effect) ||
      isLogicalDayCycleAwakenEffect(effect) || isRestoreCommandSealsReturnDefinitionEffect(effect) || isJoinSourceSkillToAttackZeroCostEffect(effect)) && !init) {
    throw new Error('LOGICAL_DAY_PROVIDER_INVALID');
  }

  if (isLogicalDayCycleAdvanceEffect(effect)) {
    if (logicalDayCycleAwake(state, controller.id, cycleKey) || logicalDayCycleResetPending(state, controller.id, cycleKey)) return 'handled';
    const current = dayValue(state, controller.id, cycleKey); if (!current) throw new Error('LOGICAL_DAY_VALUE_INVALID');
    if (current >= init!.effect.maxDay) { bag[cycleFlag(cycleKey, 'pendingReset')] = true; return 'handled'; }
    const next = current + 1;
    state.ruleOverrides!.logicalDayByPlayer = { ...(state.ruleOverrides!.logicalDayByPlayer ?? {}), [controller.id]: next };
    if (next === init!.effect.stageDay) ensureDefinitionInSkill(state, controller.id, init!.effect.stageDefinitionId, init!.sourceCardId);
    return 'handled';
  }
  if (isLogicalDayCycleScheduleResetEffect(effect)) {
    if (ctx.event?.playerId === controller.id && !logicalDayCycleAwake(state, controller.id, cycleKey)) bag[cycleFlag(cycleKey, 'pendingReset')] = true;
    return 'handled';
  }
  if (isLogicalDayCycleResolveResetEffect(effect)) {
    if (!logicalDayCycleResetPending(state, controller.id, cycleKey) || logicalDayCycleAwake(state, controller.id, cycleKey)) return 'handled';
    state.ruleOverrides!.logicalDayByPlayer = { ...(state.ruleOverrides!.logicalDayByPlayer ?? {}), [controller.id]: init!.effect.initialDay };
    bag[cycleFlag(cycleKey, 'pendingReset')] = false;
    if (!Number.isSafeInteger(controller.vp) || controller.vp < 0) throw new Error('LOGICAL_DAY_RESET_VP_INVALID');
    controller.vp += Number(effect.rewardVp);
    closeOwnedDefinitionToSkill(state, controller.id, String(effect.closeDefinitionId));
    return 'handled';
  }
  if (isLogicalDayCycleAwakenEffect(effect)) {
    if (ctx.event?.playerId !== controller.id || logicalDayCycleAwake(state, controller.id, cycleKey) || dayValue(state, controller.id, cycleKey) !== effect.day) return 'handled';
    bag[cycleFlag(cycleKey, 'awake')] = true;
    bag[cycleFlag(cycleKey, 'pendingReset')] = false;
    ensureDefinitionInSkill(state, controller.id, init!.effect.awakenDefinitionId, init!.sourceCardId);
    return 'awakened';
  }
  if (isArmNextOpponentAttributeUseDefeatEffect(effect)) {
    if (ctx.event?.type !== 'on_card_played' || ctx.event.sourceCardId !== ctx.sourceCardId || ctx.event.playerId !== controller.id) throw new Error('ARMED_ATTRIBUTE_USE_EVENT_INVALID');
    const source = state.cards.find((card) => card.instanceId === ctx.sourceCardId);
    const sourceState = runtime(state).cardState[ctx.sourceCardId];
    if (!source || source.ownerPlayerId !== controller.id || source.controllerPlayerId !== controller.id || !['field', 'attack_area'].includes(source.zone) || sourceState?.active !== true || sourceState.faceDown) throw new Error('ARMED_ATTRIBUTE_USE_SOURCE_INVALID');
    bag[armFlag(ctx.sourceCardId, ability.id)] = JSON.stringify({ sourceCardId: ctx.sourceCardId, abilityId: ability.id, attribute: String(effect.attribute) });
    return 'handled';
  }
  if (isRestoreCommandSealsReturnDefinitionEffect(effect)) {
    if (ctx.event?.type !== 'after_logical_day_cycle_awakened' || ctx.event.playerId !== controller.id || !logicalDayCycleAwake(state, controller.id, cycleKey)) throw new Error('LOGICAL_DAY_AWAKE_SETTLEMENT_EVENT_INVALID');
    const carrier = controller as unknown as { commandSpells?: number };
    const before = Number(carrier.commandSpells ?? 3);
    if (!Number.isSafeInteger(before) || before < 0 || before > Number(effect.commandSeals)) throw new Error('LOGICAL_DAY_COMMAND_SEALS_INVALID');
    carrier.commandSpells = Number(effect.commandSeals);
    const matching = state.cards.filter((card) => card.ownerPlayerId === controller.id && card.definitionId === effect.definitionId && card.zone !== 'removed_from_game');
    if (matching.length !== 1 || matching[0]!.controllerPlayerId !== controller.id) throw new Error('LOGICAL_DAY_RETURN_DEFINITION_INVALID');
    closeOwnedDefinitionToSkill(state, controller.id, String(effect.definitionId));
    return 'handled';
  }
  if (isJoinSourceSkillToAttackZeroCostEffect(effect)) {
    if (!logicalDayCycleMatches(state, controller.id, cycleKey, Number(effect.day))) throw new Error('LOGICAL_DAY_SOURCE_JOIN_WRONG_DAY');
    const physical = state.cards.find((card) => card.instanceId === ctx.sourceCardId);
    const definition = physical ? runtime(state).pack.cards[physical.definitionId] : undefined;
    if (!physical || !definition || definition.cardType !== 'master_skill' || physical.ownerPlayerId !== controller.id || physical.controllerPlayerId !== controller.id || physical.zone !== 'skill') throw new Error('LOGICAL_DAY_SOURCE_JOIN_INVALID');
    physical.zone = 'attack_area'; physical.visibility = { scope: 'public' };
    runtime(state).cardState[physical.instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber, paidManaOnPlay: 0 };
    return 'handled';
  }
  // Marker-only definition overrides are queried by shared play/cleanup gates.
  if (isLogicalDayDefinitionPlayOverrideEffect(effect) || isSourceBoundDefinitionPersistenceOverrideEffect(effect)) return 'handled';
  return 'not_handled';
}

function liveMarkerAbilities(state: GameState, controllerId: PlayerId): Array<{ sourceCardId: string; ability: AuthoringAbility; effect: RuleNode }> {
  const r = state.abilityRuntime; if (!r) return [];
  const out: Array<{ sourceCardId: string; ability: AuthoringAbility; effect: RuleNode }> = [];
  for (const physical of state.cards) {
    if (physical.ownerPlayerId !== controllerId || physical.controllerPlayerId !== controllerId || ['discard', 'removed_from_game'].includes(physical.zone)) continue;
    const definition = r.pack.cards[physical.definitionId]; if (!definition) continue;
    for (const ability of definition.abilities) {
      const effect = ability.effects[0];
      if (effect && (isLogicalDayDefinitionPlayOverrideEffect(effect) || isSourceBoundDefinitionPersistenceOverrideEffect(effect)) && isAcceptedLogicalDayCountermeasureAbility(ability)) {
        out.push({ sourceCardId: physical.instanceId, ability, effect });
      }
    }
  }
  return out;
}
export function logicalDayDefinitionPlayRequirementWaived(state: GameState, controllerId: PlayerId, definitionId: string, requirementType: string, requirementValue: number): boolean {
  return liveMarkerAbilities(state, controllerId).some(({ effect }) => isLogicalDayDefinitionPlayOverrideEffect(effect) && effect.targetDefinitionId === definitionId &&
    effect.requirementType === requirementType && Number(effect.requirementValue) === requirementValue && logicalDayCycleMatches(state, controllerId, String(effect.cycleKey), Number(effect.day)));
}
export function logicalDayDefinitionPerGamePlayLimitIgnored(state: GameState, controllerId: PlayerId, definitionId: string): boolean {
  return liveMarkerAbilities(state, controllerId).some(({ effect }) =>
    (isLogicalDayDefinitionPlayOverrideEffect(effect) && effect.targetDefinitionId === definitionId && effect.ignorePerGamePlayLimit === true && logicalDayCycleMatches(state, controllerId, String(effect.cycleKey), Number(effect.day))) ||
    (isSourceBoundDefinitionPersistenceOverrideEffect(effect) && effect.targetDefinitionId === definitionId && effect.ignorePerGamePlayLimit === true));
}
export function sourceBoundDefinitionResidualGranted(state: GameState, controllerId: PlayerId, definitionId: string): boolean {
  return liveMarkerAbilities(state, controllerId).some(({ effect }) => isSourceBoundDefinitionPersistenceOverrideEffect(effect) &&
    effect.targetDefinitionId === definitionId && effect.grantResidual === true);
}

type ArmMarker = { sourceCardId: string; abilityId: string; attribute: string };
function decodeArmMarker(value: unknown): ArmMarker | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!exactKeys(parsed as RuleNode, ['sourceCardId', 'abilityId', 'attribute']) || !id(parsed.sourceCardId) || !id(parsed.abilityId) || !id(parsed.attribute)) return undefined;
    return parsed as unknown as ArmMarker;
  } catch { return undefined; }
}
export interface ArmedAttributeUseDefeatCandidate { controllerId: PlayerId; targetPlayerId: PlayerId; sourceCardId: string; abilityId: string; attribute: string; }
export function armedAttributeUseDefeatCandidate(state: GameState, event: AbilityEvent, attributesForCard: (instanceId: string) => readonly string[]): ArmedAttributeUseDefeatCandidate | undefined {
  if (!['on_use_declared', 'on_ability_used'].includes(event.type) || !event.playerId || !event.sourceCardId) return undefined;
  const actor = state.players.find((player) => player.id === event.playerId && player.status === 'active');
  const used = state.cards.find((card) => card.instanceId === event.sourceCardId && card.controllerPlayerId === event.playerId);
  if (!actor || !used || !attributesForCard(used.instanceId).length) return undefined;
  const candidates: ArmedAttributeUseDefeatCandidate[] = [];
  for (const controller of state.players.filter((player) => player.status === 'active' && player.id !== actor.id && player.locationId && player.locationId === actor.locationId)) {
    const bag = flags(state, controller.id);
    for (const [flagKey, raw] of Object.entries(bag)) {
      if (!flagKey.startsWith(ARM_PREFIX)) continue;
      const marker = decodeArmMarker(raw); if (!marker) throw new Error('ARMED_ATTRIBUTE_USE_MARKER_INVALID');
      const source = state.cards.find((card) => card.instanceId === marker.sourceCardId);
      const sourceState = source ? runtime(state).cardState[source.instanceId] : undefined;
      const ability = source ? runtime(state).pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === marker.abilityId) : undefined;
      if (!source || source.ownerPlayerId !== controller.id || source.controllerPlayerId !== controller.id || !['field', 'attack_area'].includes(source.zone) || sourceState?.active !== true || sourceState.faceDown || !ability || !isAcceptedLogicalDayCountermeasureAbility(ability) || !isArmNextOpponentAttributeUseDefeatEffect(ability.effects[0]!)) throw new Error('ARMED_ATTRIBUTE_USE_PROVENANCE_INVALID');
      if (attributesForCard(used.instanceId).includes(marker.attribute)) candidates.push({ controllerId: controller.id, targetPlayerId: actor.id, sourceCardId: source.instanceId, abilityId: marker.abilityId, attribute: marker.attribute });
    }
  }
  if (candidates.length > 1) throw new Error('ARMED_ATTRIBUTE_USE_CONFLICT');
  return candidates[0];
}
export function consumeArmedAttributeUseDefeat(state: GameState, candidate: ArmedAttributeUseDefeatCandidate): void {
  delete flags(state, candidate.controllerId)[armFlag(candidate.sourceCardId, candidate.abilityId)];
}

export function isLogicalDayCountermeasureRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const r = state.abilityRuntime; if (!r) return true;
    for (const player of state.players) {
      const bag = r.structuredPlayerFlagsByPlayer?.[player.id] ?? {};
      const providerKeys = Object.keys(bag).filter((entry) => entry.startsWith(PREFIX) && entry.endsWith(':providerSource'));
      for (const providerKey of providerKeys) {
        const cycleKey = providerKey.slice(PREFIX.length, -':providerSource'.length);
        const live = provider(state, player.id, cycleKey); if (!live) return false;
        if (bag[providerKey] !== live.sourceCardId || bag[cycleFlag(cycleKey, 'providerAbility')] !== live.ability.id) return false;
        const day = state.ruleOverrides?.logicalDayByPlayer?.[player.id];
        if (!Number.isSafeInteger(day) || Number(day) < live.effect.initialDay || Number(day) > live.effect.maxDay) return false;
        if (typeof bag[cycleFlag(cycleKey, 'pendingReset')] !== 'boolean' || typeof bag[cycleFlag(cycleKey, 'awake')] !== 'boolean') return false;
      }
      for (const [flagKey, raw] of Object.entries(bag).filter(([entry]) => entry.startsWith(ARM_PREFIX))) {
        const marker = decodeArmMarker(raw); if (!marker || flagKey !== armFlag(marker.sourceCardId, marker.abilityId)) return false;
        const source = state.cards.find((card) => card.instanceId === marker.sourceCardId && card.ownerPlayerId === player.id && card.controllerPlayerId === player.id);
        const ability = source ? r.pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === marker.abilityId) : undefined;
        if (!source || !['field', 'attack_area'].includes(source.zone) || r.cardState[source.instanceId]?.active !== true || r.cardState[source.instanceId]?.faceDown || !ability || !isAcceptedLogicalDayCountermeasureAbility(ability) || !isArmNextOpponentAttributeUseDefeatEffect(ability.effects[0]!) || ability.effects[0]!.attribute !== marker.attribute) return false;
      }
    }
    return true;
  } catch { return false; }
}
