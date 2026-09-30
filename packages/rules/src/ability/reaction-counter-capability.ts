import type { GameState } from '../schema/game';
import type { AbilityEvent, AuthoringAbility, PlayerId, RuleNode } from './types';

export const ARM_OPPONENT_ACTION_REACTION_COUNTER_EFFECT = 'arm_opponent_action_reaction_counter' as const;
export const HALVE_REACTION_COUNTER_AFTER_BATTLE_EFFECT = 'halve_reaction_counter_after_battle' as const;
export const SPEND_REACTION_COUNTER_MOVE_ONE_EFFECT = 'spend_reaction_counter_move_one' as const;
export const SPEND_REACTION_COUNTER_PLAY_TOP_EFFECT = 'spend_reaction_counter_play_top' as const;
export const SPEND_REACTION_COUNTER_PLAY_HAND_FREE_EFFECT = 'spend_reaction_counter_play_hand_free' as const;
export const PAY_MANA_GAIN_REACTION_COUNTER_EFFECT = 'pay_mana_gain_reaction_counter' as const;
export const DOUBLE_SOURCE_BASE_POWER_IF_MOVED_EFFECT = 'double_source_base_power_if_moved_at_least' as const;

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function counterKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value);
}
function commonEmpty(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && empty(ability.lifecycle) &&
    empty(ability.limit) && empty(ability.visibility) && standardResponse(ability) && automaticNoHost(ability);
}

export function isArmOpponentActionReactionCounterEffect(value: RuleNode): boolean {
  return value.type === ARM_OPPONENT_ACTION_REACTION_COUNTER_EFFECT && counterKey(value.counterKey) &&
    value.skillPlayGain === 1 && value.commandSealUseGain === 1 && value.moveToControllerBattlefieldGain === 1 &&
    value.moveAwardOncePerPlayerPerRound === true &&
    exactKeys(value, ['type', 'counterKey', 'skillPlayGain', 'commandSealUseGain', 'moveToControllerBattlefieldGain', 'moveAwardOncePerPlayerPerRound']);
}
export function isHalveReactionCounterAfterBattleEffect(value: RuleNode): boolean {
  return value.type === HALVE_REACTION_COUNTER_AFTER_BATTLE_EFFECT && counterKey(value.counterKey) && value.rounding === 'ceil_loss' &&
    exactKeys(value, ['type', 'counterKey', 'rounding']);
}
export function isSpendReactionCounterMoveOneEffect(value: RuleNode): boolean {
  return value.type === SPEND_REACTION_COUNTER_MOVE_ONE_EFFECT && counterKey(value.counterKey) &&
    ((value.direction === 'backward' && value.amount === 1) || (value.direction === 'forward' && value.amount === 2)) &&
    exactKeys(value, ['type', 'counterKey', 'amount', 'direction']);
}
export function isSpendReactionCounterPlayTopEffect(value: RuleNode): boolean {
  return value.type === SPEND_REACTION_COUNTER_PLAY_TOP_EFFECT && counterKey(value.counterKey) && value.amount === 4 &&
    value.sourceZone === 'deck' && value.payCardCosts === true && exactKeys(value, ['type', 'counterKey', 'amount', 'sourceZone', 'payCardCosts']);
}
export function isSpendReactionCounterPlayHandFreeEffect(value: RuleNode): boolean {
  return value.type === SPEND_REACTION_COUNTER_PLAY_HAND_FREE_EFFECT && counterKey(value.counterKey) && value.amount === 7 &&
    value.sourceZone === 'hand' && value.payCardCosts === false && typeof value.target === 'string' && value.target.length > 0 &&
    exactKeys(value, ['type', 'counterKey', 'amount', 'sourceZone', 'payCardCosts', 'target']);
}
export function isPayManaGainReactionCounterEffect(value: RuleNode): boolean {
  return value.type === PAY_MANA_GAIN_REACTION_COUNTER_EFFECT && counterKey(value.counterKey) && value.manaCost === 1 && value.gain === 2 &&
    exactKeys(value, ['type', 'counterKey', 'manaCost', 'gain']);
}
export function isDoubleSourceBasePowerIfMovedEffect(value: RuleNode): boolean {
  return value.type === DOUBLE_SOURCE_BASE_POWER_IF_MOVED_EFFECT && value.minimumMovementDistance === 3 && value.multiplier === 2 &&
    value.duration === 'while_source_active' && exactKeys(value, ['type', 'minimumMovementDistance', 'multiplier', 'duration']);
}

function exactPhaseAction(ability: AuthoringAbility, phase: 'action' | 'combat'): boolean {
  const opens = phase === 'action' ? 'controller_action_window' : 'controller_combat_action_window';
  return ability.kind === 'phase_action' && ability.activation.phase === phase && ability.activation.opens === opens &&
    exactKeys(ability.activation, ['phase', 'opens']) && commonEmpty(ability) && ability.effects.length === 1;
}
export function isAcceptedReactionCounterArmAbility(ability: AuthoringAbility): boolean {
  return exactPhaseAction(ability, 'action') && isArmOpponentActionReactionCounterEffect(ability.effects[0]!);
}
export function isAcceptedReactionCounterHalveAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'forced_trigger' && ability.activation.trigger === 'after_battle_ended' &&
    exactKeys(ability.activation, ['trigger']) && commonEmpty(ability) && ability.effects.length === 1 &&
    isHalveReactionCounterAfterBattleEffect(ability.effects[0]!);
}
export function isAcceptedReactionCounterMoveAbility(ability: AuthoringAbility): boolean {
  return exactPhaseAction(ability, 'combat') && isSpendReactionCounterMoveOneEffect(ability.effects[0]!);
}
export function isAcceptedReactionCounterPlayTopAbility(ability: AuthoringAbility): boolean {
  return exactPhaseAction(ability, 'combat') && isSpendReactionCounterPlayTopEffect(ability.effects[0]!);
}
function exactSingleControllerHandTarget(value: RuleNode): boolean {
  const scope = value.scope && typeof value.scope === 'object' && !Array.isArray(value.scope) ? value.scope as RuleNode : {};
  const count = value.count && typeof value.count === 'object' && !Array.isArray(value.count) ? value.count as RuleNode : {};
  return value.type === 'card_instance' && typeof value.id === 'string' && value.id.length > 0 &&
    scope.zone === 'hand' && scope.owner === 'controller' && exactKeys(scope, ['zone', 'owner']) &&
    count.min === 1 && count.max === 1 && exactKeys(count, ['min', 'max']) && Array.isArray(value.constraints) && value.constraints.length === 1 &&
    (value.constraints[0] as RuleNode).type === 'effect_playable_face_up' && exactKeys(value.constraints[0] as RuleNode, ['type']) &&
    exactKeys(value, ['id', 'type', 'scope', 'count', 'constraints']);
}
export function isAcceptedReactionCounterPlayHandAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.activation.phase !== 'combat' || ability.activation.opens !== 'controller_combat_action_window' ||
      !exactKeys(ability.activation, ['phase', 'opens']) || ability.targets.length !== 1 || !exactSingleControllerHandTarget(ability.targets[0]!) ||
      ability.conditions.length !== 0 || ability.cost.length !== 0 || ability.ruleModifiers.length !== 0 || ability.creates.length !== 0 ||
      !empty(ability.lifecycle) || !empty(ability.limit) || !empty(ability.visibility) || !standardResponse(ability) || !automaticNoHost(ability) || ability.effects.length !== 1) return false;
  return isSpendReactionCounterPlayHandFreeEffect(ability.effects[0]!) && ability.effects[0]!.target === ability.targets[0]!.id;
}

export function isAcceptedReactionCounterGainAbility(ability: AuthoringAbility): boolean {
  return exactPhaseAction(ability, 'action') && isPayManaGainReactionCounterEffect(ability.effects[0]!);
}
export function isAcceptedMovedSourceDoubleAbility(ability: AuthoringAbility): boolean {
  return exactPhaseAction(ability, 'combat') && isDoubleSourceBasePowerIfMovedEffect(ability.effects[0]!);
}

const privilegedTypes = new Set<string>([
  ARM_OPPONENT_ACTION_REACTION_COUNTER_EFFECT,
  HALVE_REACTION_COUNTER_AFTER_BATTLE_EFFECT,
  SPEND_REACTION_COUNTER_MOVE_ONE_EFFECT,
  SPEND_REACTION_COUNTER_PLAY_TOP_EFFECT,
  SPEND_REACTION_COUNTER_PLAY_HAND_FREE_EFFECT,
  PAY_MANA_GAIN_REACTION_COUNTER_EFFECT,
  DOUBLE_SOURCE_BASE_POWER_IF_MOVED_EFFECT,
]);
export function containsReactionCounterPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsReactionCounterPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const current = value as RuleNode;
  if (privilegedTypes.has(String(current.type))) return true;
  return Object.values(current).some(containsReactionCounterPrivilegedNode);
}
export function isAcceptedReactionCounterCapabilityAbility(ability: AuthoringAbility): boolean {
  return isAcceptedReactionCounterArmAbility(ability) || isAcceptedReactionCounterHalveAbility(ability) ||
    isAcceptedReactionCounterMoveAbility(ability) || isAcceptedReactionCounterPlayTopAbility(ability) ||
    isAcceptedReactionCounterPlayHandAbility(ability) || isAcceptedReactionCounterGainAbility(ability) ||
    isAcceptedMovedSourceDoubleAbility(ability);
}

function runtime(state: GameState) { return state.abilityRuntime; }
function flagBag(state: GameState, playerId: PlayerId): Record<string, boolean | string | number> {
  const r = runtime(state); if (!r) return {};
  return (r.structuredPlayerFlagsByPlayer ??= {})[playerId] ??= {};
}
function roundKeys(state: GameState, playerId: PlayerId): Record<string, number> {
  const r = runtime(state); if (!r) return {};
  return (r.structuredRoundFlagKeysByPlayer ??= {})[playerId] ??= {};
}
function armKey(counterKey: string) { return '__fd_reaction_arm:' + counterKey; }
function sourceKey(counterKey: string) { return '__fd_reaction_source:' + counterKey; }
function abilityKey(counterKey: string) { return '__fd_reaction_ability:' + counterKey; }
function movedKey(counterKey: string, playerId: string) { return '__fd_reaction_moved:' + counterKey + ':' + playerId; }
function setRoundFlag(state: GameState, playerId: PlayerId, key: string, value: boolean | string | number): void {
  flagBag(state, playerId)[key] = value; roundKeys(state, playerId)[key] = state.round.roundNumber;
}
export function reactionCounterValue(state: GameState, playerId: PlayerId, counterKey: string): number {
  const value = flagBag(state, playerId)[counterKey]; if (value === undefined) return 0;
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new Error('REACTION_COUNTER_INVALID'); return Number(value);
}
export function setReactionCounterValue(state: GameState, playerId: PlayerId, counterKey: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('REACTION_COUNTER_INVALID'); flagBag(state, playerId)[counterKey] = value;
}
export function armReactionCounter(state: GameState, controllerId: PlayerId, sourceCardId: string, ability: AuthoringAbility): void {
  if (!isAcceptedReactionCounterArmAbility(ability)) throw new Error('REACTION_COUNTER_ARM_INVALID');
  const key = String(ability.effects[0]!.counterKey); setRoundFlag(state, controllerId, armKey(key), state.round.roundNumber);
  setRoundFlag(state, controllerId, sourceKey(key), sourceCardId); setRoundFlag(state, controllerId, abilityKey(key), ability.id);
}
function actionPlayerId(state: GameState): string | undefined {
  if (state.round.activePhase !== 'action') return undefined;
  return state.players.find((player) => player.status === 'active' && player.seat === state.round.prioritySeat)?.id;
}
function liveArm(state: GameState, controllerId: PlayerId, counterKey: string): { sourceCardId: string; ability: AuthoringAbility } | undefined {
  const r = runtime(state); if (!r) return undefined; const flags = flagBag(state, controllerId);
  if (flags[armKey(counterKey)] !== state.round.roundNumber) return undefined;
  const sourceCardId = flags[sourceKey(counterKey)]; const abilityId = flags[abilityKey(counterKey)];
  if (typeof sourceCardId !== 'string' || typeof abilityId !== 'string') return undefined;
  const source = state.cards.find((card) => card.instanceId === sourceCardId && card.ownerPlayerId === controllerId && card.controllerPlayerId === controllerId && !['discard','removed_from_game'].includes(card.zone));
  const definition = source ? r.pack.cards[source.definitionId] : undefined; const ability = definition?.abilities.find((candidate) => candidate.id === abilityId);
  if (!source || !ability || !isAcceptedReactionCounterArmAbility(ability) || String(ability.effects[0]!.counterKey) !== counterKey) return undefined;
  return { sourceCardId, ability };
}
function armedControllers(state: GameState): Array<{ controllerId: PlayerId; counterKey: string }> {
  const r = runtime(state); if (!r) return []; const out: Array<{ controllerId: PlayerId; counterKey: string }> = [];
  for (const [controllerId, flags] of Object.entries(r.structuredPlayerFlagsByPlayer ?? {})) {
    for (const [key, value] of Object.entries(flags)) {
      if (!key.startsWith('__fd_reaction_arm:') || value !== state.round.roundNumber) continue;
      const counterKey = key.slice('__fd_reaction_arm:'.length); if (liveArm(state, controllerId, counterKey)) out.push({ controllerId, counterKey });
    }
  }
  return out;
}
function gain(state: GameState, controllerId: PlayerId, counterKey: string, amount: number): void {
  setReactionCounterValue(state, controllerId, counterKey, reactionCounterValue(state, controllerId, counterKey) + amount);
}
export function notifyReactionCounterCommandSealUse(state: GameState, playerId: PlayerId): void {
  if (actionPlayerId(state) !== playerId) return;
  for (const arm of armedControllers(state)) if (arm.controllerId !== playerId) gain(state, arm.controllerId, arm.counterKey, 1);
}
export function settleReactionCounterEvent(state: GameState, event: AbilityEvent): void {
  const actor = event.playerId; if (!actor || actionPlayerId(state) !== actor) return;
  for (const arm of armedControllers(state)) {
    if (arm.controllerId === actor) continue; const controller = state.players.find((player) => player.id === arm.controllerId); if (!controller) continue;
    if (event.type === 'on_card_played') {
      const source = event.sourceCardId ? state.cards.find((entry) => entry.instanceId === event.sourceCardId && entry.controllerPlayerId === actor) : undefined;
      const cardType = source ? runtime(state)?.pack.cards[source.definitionId]?.cardType : undefined;
      if (source && ['servant_skill','master_skill','skill'].includes(String(cardType))) gain(state, arm.controllerId, arm.counterKey, 1);
    } else if (event.type === 'after_controller_enters_location' && event.locationId && event.movementKind && controller.locationId === event.locationId) {
      const location = state.map.locations.find((entry) => entry.id === event.locationId); const key = movedKey(arm.counterKey, actor); const flags = flagBag(state, arm.controllerId);
      if (location?.tags.includes('battlefield') && flags[key] !== state.round.roundNumber) { gain(state, arm.controllerId, arm.counterKey, 1); setRoundFlag(state, arm.controllerId, key, state.round.roundNumber); }
    }
  }
}
