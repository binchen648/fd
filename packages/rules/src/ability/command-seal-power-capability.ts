import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import type { AuthoringAbility, NormalCommandSealUseRecord, PlayerId, RuleNode, RulerSealBinding } from './types';

export const ENGAGED_SEAL_USER_THIS_ROUND_CONDITION = 'controller_has_engaged_opponent_command_or_ruler_seal_user_this_round' as const;
export const ADD_ENGAGED_SEAL_USER_FORMULA_POWER_EFFECT = 'add_controller_round_power_from_engaged_seal_users' as const;
export const SPEND_NORMAL_SEAL_FOR_ROUND_POWER_EFFECT = 'spend_controller_normal_command_seal_for_round_power' as const;
export const SPEND_OWNED_RULER_SEAL_FOR_ROUND_POWER_EFFECT = 'spend_controller_owned_ruler_seal_for_round_power' as const;
export const ENABLE_ENGAGED_OPPONENT_UNUSED_SEAL_POWER_EFFECT = 'enable_engaged_opponent_unused_owned_seal_round_power' as const;
export const DYNAMIC_UNUSED_SEAL_POWER_RULE = 'player.combatTotalPowerPerEngagedOpponentUnusedOwnedSeal' as const;

const privilegedTypes = new Set<string>([
  ENGAGED_SEAL_USER_THIS_ROUND_CONDITION,
  ADD_ENGAGED_SEAL_USER_FORMULA_POWER_EFFECT,
  SPEND_NORMAL_SEAL_FOR_ROUND_POWER_EFFECT,
  SPEND_OWNED_RULER_SEAL_FOR_ROUND_POWER_EFFECT,
  ENABLE_ENGAGED_OPPONENT_UNUSED_SEAL_POWER_EFFECT,
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
  return ability.targets.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    empty(ability.lifecycle) && empty(ability.visibility) && standardResponse(ability);
}
function exactActionActivation(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' &&
    exactKeys(ability.activation, ['phase', 'opens']);
}
function exactCombatActivation(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && ability.activation.phase === 'combat' && ability.activation.opens === 'controller_combat_action_window' &&
    ability.activation.requiresSourceState === 'active' && exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']);
}

export function isEngagedSealUserThisRoundCondition(value: RuleNode): boolean {
  return value.type === ENGAGED_SEAL_USER_THIS_ROUND_CONDITION && value.includeRulerSeals === true &&
    exactKeys(value, ['type', 'includeRulerSeals']);
}
export function isAddEngagedSealUserFormulaPowerEffect(value: RuleNode): boolean {
  return value.type === ADD_ENGAGED_SEAL_USER_FORMULA_POWER_EFFECT && value.basePerOpponent === 6 &&
    value.ownNormalSealMultiplier === -2 && value.includeRulerSeals === true && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'basePerOpponent', 'ownNormalSealMultiplier', 'includeRulerSeals', 'duration']);
}
export function isSpendNormalSealForRoundPowerEffect(value: RuleNode): boolean {
  return value.type === SPEND_NORMAL_SEAL_FOR_ROUND_POWER_EFFECT && value.amount === 4 && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'amount', 'duration']);
}
export function isSpendOwnedRulerSealForRoundPowerEffect(value: RuleNode): boolean {
  return value.type === SPEND_OWNED_RULER_SEAL_FOR_ROUND_POWER_EFFECT && value.amount === 4 && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'amount', 'duration']);
}
export function isEnableEngagedOpponentUnusedSealPowerEffect(value: RuleNode): boolean {
  return value.type === ENABLE_ENGAGED_OPPONENT_UNUSED_SEAL_POWER_EFFECT && value.perSeal === 1 && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'perSeal', 'duration']);
}

export function containsCommandSealPowerPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsCommandSealPowerPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const record = value as RuleNode;
  if (privilegedTypes.has(String(record.type))) return true;
  return Object.values(record).some(containsCommandSealPowerPrivilegedNode);
}

export function isAcceptedEngagedSealUserFormulaPowerAbility(ability: AuthoringAbility): boolean {
  return exactCombatActivation(ability) && automaticNoHost(ability) && emptyCommon(ability) && empty(ability.limit) &&
    ability.conditions.length === 1 && isEngagedSealUserThisRoundCondition(ability.conditions[0]!) &&
    ability.effects.length === 1 && isAddEngagedSealUserFormulaPowerEffect(ability.effects[0]!);
}
export function isAcceptedNormalSealPowerReplacementAbility(ability: AuthoringAbility): boolean {
  return exactActionActivation(ability) && automaticNoHost(ability) && emptyCommon(ability) && empty(ability.limit) &&
    ability.conditions.length === 0 && ability.effects.length === 1 && isSpendNormalSealForRoundPowerEffect(ability.effects[0]!);
}
export function isAcceptedRulerSealPowerReplacementAbility(ability: AuthoringAbility): boolean {
  return exactActionActivation(ability) && automaticNoHost(ability) && emptyCommon(ability) && empty(ability.limit) &&
    ability.conditions.length === 0 && ability.effects.length === 1 && isSpendOwnedRulerSealForRoundPowerEffect(ability.effects[0]!);
}
export function isAcceptedUnusedEngagedSealPowerAbility(ability: AuthoringAbility): boolean {
  const limit = ability.limit;
  return exactActionActivation(ability) && automaticNoHost(ability) && emptyCommon(ability) &&
    ability.conditions.length === 0 && ability.effects.length === 1 && isEnableEngagedOpponentUnusedSealPowerEffect(ability.effects[0]!) &&
    limit.type === 'per_round' && limit.uses === 1 && limit.scope === 'this_card' && exactKeys(limit, ['type', 'uses', 'scope']);
}
export function isAcceptedCommandSealPowerPrivilegedAbility(ability: AuthoringAbility): boolean {
  return isAcceptedEngagedSealUserFormulaPowerAbility(ability) || isAcceptedNormalSealPowerReplacementAbility(ability) ||
    isAcceptedRulerSealPowerReplacementAbility(ability) || isAcceptedUnusedEngagedSealPowerAbility(ability);
}
export function isRepeatableSealPowerReplacementAbility(ability: AuthoringAbility): boolean {
  return isAcceptedNormalSealPowerReplacementAbility(ability) || isAcceptedRulerSealPowerReplacementAbility(ability);
}

export function controllerHasSealPowerReplacementProvider(
  state: GameState,
  controllerId: PlayerId,
  kind: 'normal' | 'ruler',
): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  const predicate = kind === 'normal' ? isAcceptedNormalSealPowerReplacementAbility : isAcceptedRulerSealPowerReplacementAbility;
  return state.cards.some((source) => {
    if (source.controllerPlayerId !== controllerId || !['skill', 'field', 'attack_area'].includes(source.zone)) return false;
    if (runtime.cardState[source.instanceId]?.faceDown === true) return false;
    const definition = runtime.pack.cards[source.definitionId];
    return !!definition && definition.abilities.some(predicate);
  });
}

function isBattlefield(state: GameState, locationId: string | undefined): boolean {
  return !!locationId && getEnabledLocations(state.map, state.locationConfig)
    .some((location) => location.id === locationId && location.tags.includes('battlefield'));
}
function activeEngagedOpponentIds(state: GameState, controllerId: PlayerId): PlayerId[] {
  const controller = state.players.find((player) => player.id === controllerId && player.status === 'active');
  if (!controller?.locationId || !isBattlefield(state, controller.locationId)) return [];
  return state.players.filter((player) => player.id !== controllerId && player.status === 'active' && player.locationId === controller.locationId)
    .map((player) => player.id);
}

export function markNormalCommandSealUsedThisRound(
  state: GameState,
  playerId: PlayerId,
  provenance?: Pick<NormalCommandSealUseRecord, 'sourceCardId' | 'abilityId' | 'before' | 'after'>,
): void {
  if (!state.players.some((player) => player.id === playerId)) return;
  const runtime = state.abilityRuntime;
  if (!runtime) return;
  (runtime.normalCommandSealUseRoundByPlayer ??= {})[playerId] = state.round.roundNumber;
  if (provenance) {
    (runtime.normalCommandSealUseHistory ??= []).push({
      playerId,
      sourceCardId: provenance.sourceCardId,
      abilityId: provenance.abilityId,
      round: state.round.roundNumber,
      before: provenance.before,
      after: provenance.after,
    });
    const usageKey = `normal-seal-use:${provenance.sourceCardId}:${provenance.abilityId}:round:${state.round.roundNumber}`;
    runtime.abilityUsage[usageKey] = (runtime.abilityUsage[usageKey] ?? 0) + 1;
  }
}
export function markRulerCommandSealUsedThisRound(state: GameState, playerId: PlayerId): void {
  if (!state.players.some((player) => player.id === playerId)) return;
  const runtime = state.abilityRuntime;
  if (!runtime) return;
  (runtime.rulerCommandSealUseRoundByPlayer ??= {})[playerId] = state.round.roundNumber;
}
export function engagedSealUserIdsThisRound(state: GameState, controllerId: PlayerId, includeRulerSeals = true): PlayerId[] {
  const runtime = state.abilityRuntime;
  if (!runtime) return [];
  return activeEngagedOpponentIds(state, controllerId).filter((playerId) =>
    runtime.normalCommandSealUseRoundByPlayer?.[playerId] === state.round.roundNumber ||
    (includeRulerSeals && runtime.rulerCommandSealUseRoundByPlayer?.[playerId] === state.round.roundNumber));
}
export function controllerHasEngagedSealUserThisRound(state: GameState, controllerId: PlayerId, condition: RuleNode): boolean {
  return isEngagedSealUserThisRoundCondition(condition) && engagedSealUserIdsThisRound(state, controllerId, true).length > 0;
}
export function engagedSealUserFormulaPower(state: GameState, controllerId: PlayerId): number | undefined {
  const controller = state.players.find((player) => player.id === controllerId && player.status === 'active') as
    (GameState['players'][number] & { commandSpells?: number }) | undefined;
  if (!controller) return undefined;
  const opponents = engagedSealUserIdsThisRound(state, controllerId, true);
  if (opponents.length === 0) return undefined;
  const seals = Number(controller.commandSpells ?? 3);
  if (!Number.isSafeInteger(seals) || seals < 0) return undefined;
  const perOpponent = 6 - (2 * seals);
  const total = perOpponent * opponents.length;
  return Number.isSafeInteger(total) ? total : undefined;
}

export function unspentOwnedRulerSealBindings(state: GameState, controllerId: PlayerId): RulerSealBinding[] {
  return [...(state.abilityRuntime?.rulerSealBindings ?? [])]
    .filter((binding) => !binding.spent && binding.issuerPlayerId === controllerId)
    .sort((left, right) => left.id.localeCompare(right.id));
}
export function engagedOpponentUnusedOwnedSealCount(state: GameState, controllerId: PlayerId): number {
  return activeEngagedOpponentIds(state, controllerId).reduce((sum, opponentId) => {
    const opponent = state.players.find((player) => player.id === opponentId) as
      (GameState['players'][number] & { commandSpells?: number }) | undefined;
    const normal = Number(opponent?.commandSpells ?? 3);
    if (!Number.isSafeInteger(normal) || normal < 0) return sum;
    return sum + normal + unspentOwnedRulerSealBindings(state, opponentId).length;
  }, 0);
}
export function dynamicUnusedEngagedSealPowerAdjustment(state: GameState, controllerId: PlayerId): number {
  const runtime = state.abilityRuntime;
  if (!runtime) return 0;
  let enabled = false;
  for (const ongoing of runtime.ongoingEffects) {
    if (ongoing.controllerId !== controllerId || (ongoing.expiresAtRound !== undefined && state.round.roundNumber >= ongoing.expiresAtRound)) continue;
    if (ongoing.ruleModifiers.some((modifier) => {
      const value = modifier.definition;
      return value.operation === 'add' && value.rule === DYNAMIC_UNUSED_SEAL_POWER_RULE && value.perSeal === 1 &&
        value.scope && typeof value.scope === 'object' && !Array.isArray(value.scope) &&
        (value.scope as RuleNode).controller === 'self' && exactKeys(value.scope as RuleNode, ['controller']) &&
        exactKeys(value, ['operation', 'rule', 'scope', 'perSeal']);
    })) enabled = true;
  }
  return enabled ? engagedOpponentUnusedOwnedSealCount(state, controllerId) : 0;
}

export function isDynamicUnusedEngagedSealPowerModifier(value: RuleNode): boolean {
  const scope = value.scope && typeof value.scope === 'object' && !Array.isArray(value.scope) ? value.scope as RuleNode : {};
  return value.operation === 'add' && value.rule === DYNAMIC_UNUSED_SEAL_POWER_RULE && value.perSeal === 1 &&
    scope.controller === 'self' && exactKeys(scope, ['controller']) && exactKeys(value, ['operation', 'rule', 'scope', 'perSeal']);
}
