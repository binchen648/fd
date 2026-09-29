import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import { playerHasLinkedOwnerLossImmunity } from './linked-owner-combat';
import { PLAYER_COMBAT_TOTAL_POWER_RULE } from './owner-self-mechanics';
import { playerIgnoresAbilityFromController } from './player-ability-immunity';
import type { AuthoringAbility, RuleNode } from './types';

export const SAME_LOCATION_MANA_SPEND_REWARD_EFFECT = 'same_location_other_player_mana_spend_reward' as const;
export const SELF_MANA_OVERFLOW_POWER_CLOSE_EFFECT = 'self_mana_overflow_round_power_close' as const;
export const OPPONENT_MANA_OVERFLOW_DEFEAT_EFFECT = 'opponent_mana_overflow_defeat' as const;
export const LOSE_ALL_MANA_ROUND_POWER_EFFECT = 'lose_all_controller_mana_add_round_power' as const;
export const GRANT_SAME_LOCATION_OPPONENTS_MANA_EFFECT = 'grant_same_location_opponents_mana' as const;

const privilegedTypes = new Set<string>([
  SAME_LOCATION_MANA_SPEND_REWARD_EFFECT,
  SELF_MANA_OVERFLOW_POWER_CLOSE_EFFECT,
  OPPONENT_MANA_OVERFLOW_DEFEAT_EFFECT,
  LOSE_ALL_MANA_ROUND_POWER_EFFECT,
  GRANT_SAME_LOCATION_OPPONENTS_MANA_EFFECT,
]);
const PRESENT_SOURCE_ZONES = new Set(['skill', 'field', 'attack_area']);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function automatic(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function emptyCommon(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && empty(ability.lifecycle) && empty(ability.limit) && automatic(ability);
}
function emptyResponse(ability: AuthoringAbility): boolean { return empty(ability.responseWindow); }
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function emptyVisibility(ability: AuthoringAbility): boolean { return empty(ability.visibility); }
function exactReveal(ability: AuthoringAbility): boolean {
  return exactKeys(ability.visibility, ['revealsTrueName', 'revealTiming', 'revealScope']) && ability.visibility.revealsTrueName === true &&
    ability.visibility.revealTiming === 'on_use_declared' && ability.visibility.revealScope === 'servant_package';
}

export function isSameLocationManaSpendRewardEffect(value: RuleNode): boolean {
  return value.type === SAME_LOCATION_MANA_SPEND_REWARD_EFFECT && value.minimumSpent === 2 && value.rewardMana === 2 &&
    exactKeys(value, ['type', 'minimumSpent', 'rewardMana']);
}
export function isSelfManaOverflowPowerCloseEffect(value: RuleNode): boolean {
  return value.type === SELF_MANA_OVERFLOW_POWER_CLOSE_EFFECT && value.powerBonus === 5 && value.closeAfterBattle === true &&
    exactKeys(value, ['type', 'powerBonus', 'closeAfterBattle']);
}
export function isOpponentManaOverflowDefeatEffect(value: RuleNode): boolean {
  return value.type === OPPONENT_MANA_OVERFLOW_DEFEAT_EFFECT && value.sameBattlefield === true &&
    exactKeys(value, ['type', 'sameBattlefield']);
}
export function isLoseAllManaRoundPowerEffect(value: RuleNode): boolean {
  return value.type === LOSE_ALL_MANA_ROUND_POWER_EFFECT && value.powerPerMana === 1 && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'powerPerMana', 'duration']);
}
export function isGrantSameLocationOpponentsManaEffect(value: RuleNode): boolean {
  return value.type === GRANT_SAME_LOCATION_OPPONENTS_MANA_EFFECT && value.amount === 2 && value.mandatory === true &&
    exactKeys(value, ['type', 'amount', 'mandatory']);
}

export function isAcceptedSameLocationManaSpendRewardAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'residual' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    ability.activation.trigger === 'after_player_spends_mana' && ability.activation.requiresSourceState === 'active' &&
    ability.effects.length === 1 && isSameLocationManaSpendRewardEffect(ability.effects[0]!) && emptyCommon(ability) &&
    standardResponse(ability) && emptyVisibility(ability);
}
export function isAcceptedSelfManaOverflowPowerCloseAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'residual' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    ability.activation.trigger === 'after_controller_mana_overflow' && ability.activation.requiresSourceState === 'active' &&
    ability.effects.length === 1 && isSelfManaOverflowPowerCloseEffect(ability.effects[0]!) && emptyCommon(ability) &&
    standardResponse(ability) && emptyVisibility(ability);
}
export function isAcceptedOpponentManaOverflowDefeatAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    ability.activation.trigger === 'after_player_mana_overflow' && ability.activation.requiresSourceState === 'active' &&
    ability.effects.length === 1 && isOpponentManaOverflowDefeatEffect(ability.effects[0]!) && emptyCommon(ability) &&
    standardResponse(ability) && emptyVisibility(ability);
}
export function isAcceptedLoseAllManaRoundPowerAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'forced_trigger' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    ability.activation.trigger === 'on_card_played' && ability.activation.requiresSourceState === 'active' &&
    ability.effects.length === 1 && isLoseAllManaRoundPowerEffect(ability.effects[0]!) && emptyCommon(ability) &&
    standardResponse(ability) && emptyVisibility(ability);
}
export function isAcceptedGrantSameLocationOpponentsManaAbility(ability: AuthoringAbility): boolean {
  if (ability.effects.length !== 1 || !isGrantSameLocationOpponentsManaEffect(ability.effects[0]!) || !emptyCommon(ability)) return false;
  const playTrigger = ability.kind === 'forced_trigger' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    ability.activation.trigger === 'on_card_played' && ability.activation.requiresSourceState === 'active' && standardResponse(ability) && emptyVisibility(ability);
  const combatAction = ability.kind === 'phase_action' && exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) &&
    ability.activation.phase === 'combat' && ability.activation.opens === 'controller_combat_action_window' &&
    ability.activation.requiresSourceState === 'active' && standardResponse(ability) && exactReveal(ability);
  return playTrigger || combatAction;
}
export function isAcceptedManaTransactionAbility(ability: AuthoringAbility): boolean {
  return isAcceptedSameLocationManaSpendRewardAbility(ability) || isAcceptedSelfManaOverflowPowerCloseAbility(ability) ||
    isAcceptedOpponentManaOverflowDefeatAbility(ability) || isAcceptedLoseAllManaRoundPowerAbility(ability) ||
    isAcceptedGrantSameLocationOpponentsManaAbility(ability);
}
export function containsManaTransactionPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsManaTransactionPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const current = value as RuleNode;
  if (privilegedTypes.has(String(current.type))) return true;
  return Object.values(current).some(containsManaTransactionPrivilegedNode);
}

function sourcePresent(state: GameState, sourceCardId: string, controllerId: string): boolean {
  const source = state.cards.find((candidate) => candidate.instanceId === sourceCardId);
  const runtimeState = state.abilityRuntime?.cardState[sourceCardId];
  if (!source || !runtimeState || source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId ||
      !PRESENT_SOURCE_ZONES.has(source.zone) || runtimeState.faceDown) return false;
  return runtimeState.active === true;
}
function sourceAbilities(state: GameState, predicate: (ability: AuthoringAbility) => boolean) {
  const runtime = state.abilityRuntime;
  if (!runtime) return [] as Array<{ sourceCardId: string; controllerId: string; ability: AuthoringAbility }>;
  const out: Array<{ sourceCardId: string; controllerId: string; ability: AuthoringAbility }> = [];
  for (const source of state.cards) {
    if (!sourcePresent(state, source.instanceId, source.controllerPlayerId)) continue;
    const definition = runtime.pack.cards[source.definitionId];
    if (!definition) continue;
    for (const ability of definition.abilities) if (predicate(ability)) out.push({ sourceCardId: source.instanceId, controllerId: source.controllerPlayerId, ability });
  }
  return out;
}
function battlefield(state: GameState, locationId: string | undefined): boolean {
  return !!locationId && getEnabledLocations(state.map, state.locationConfig).some((entry) => entry.id === locationId && entry.tags.includes('battlefield'));
}
function playerIgnoresDefeatAtLocation(state: GameState, playerId: string, locationId: string): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  if (runtime.battleLossIgnoreRoundByPlayer?.[playerId] === state.round.roundNumber) return true;
  if (playerHasLinkedOwnerLossImmunity(state, playerId, locationId)) return true;
  return state.cards.some((candidate) => {
    if (candidate.controllerPlayerId !== playerId || !['field', 'attack_area'].includes(candidate.zone) || !sourcePresent(state, candidate.instanceId, playerId)) return false;
    const definition = runtime.pack.cards[candidate.definitionId];
    return !!definition?.abilities.some((ability) => ability.effects.some((effect) => effect.type === 'append_only_rule' && effect.rule === 'ignore_battle_loss_effects'));
  });
}

export interface ManaSpendRewardInstruction { controllerId: string; sourceCardId: string; abilityId: string; amount: 2 }
export function collectSameLocationManaSpendRewards(state: GameState, spenderId: string, amount: number): ManaSpendRewardInstruction[] {
  if (!Number.isSafeInteger(amount) || amount < 2) return [];
  const spender = state.players.find((candidate) => candidate.id === spenderId && candidate.status === 'active');
  if (!spender?.locationId) return [];
  return sourceAbilities(state, isAcceptedSameLocationManaSpendRewardAbility)
    .filter(({ controllerId }) => controllerId !== spenderId && state.players.some((candidate) =>
      candidate.id === controllerId && candidate.status === 'active' && candidate.locationId === spender.locationId))
    .map(({ controllerId, sourceCardId, ability }) => ({ controllerId, sourceCardId, abilityId: ability.id, amount: 2 as const }));
}

export function applyStorageManaOverflowReactions(state: GameState, recipientId: string, storageOverflowAmount: number): void {
  const runtime = state.abilityRuntime;
  if (!runtime || !Number.isSafeInteger(storageOverflowAmount) || storageOverflowAmount <= 0) return;
  const recipient = state.players.find((candidate) => candidate.id === recipientId && candidate.status === 'active');
  if (!recipient) return;

  for (const { sourceCardId, controllerId, ability } of sourceAbilities(state, isAcceptedSelfManaOverflowPowerCloseAbility)) {
    if (controllerId !== recipientId) continue;
    runtime.ongoingEffects.push({
      id: `resource-overflow-power:${state.round.roundNumber}:${++runtime.sequence}`,
      sourceCardId, abilityId: ability.id, controllerId,
      starts: 'immediate', duration: 'this_round', startRound: state.round.roundNumber, expiresAtRound: state.round.roundNumber + 1,
      cleanup: 'expire_after_duration', publicZones: [], sourceMustRemainActive: false,
      ruleModifiers: [{ sourceCardId, controllerId,
        definition: { operation: 'add', rule: PLAYER_COMBAT_TOTAL_POWER_RULE, scope: { controller: 'self' }, value: 5 } }],
    });
    runtime.cardState[sourceCardId]!.manaOverflowCloseAfterBattle = { round: state.round.roundNumber, sourceAbilityId: ability.id };
    runtime.events.push({ type: 'mana_storage_overflow_power_added', playerId: controllerId, sourceCardId, abilityId: ability.id,
      resource: 'mana', requestedDelta: storageOverflowAmount, delta: 5 });
  }

  for (const { sourceCardId, controllerId, ability } of sourceAbilities(state, isAcceptedOpponentManaOverflowDefeatAbility)) {
    if (controllerId === recipientId) continue;
    const controller = state.players.find((candidate) => candidate.id === controllerId && candidate.status === 'active');
    if (!controller?.locationId || controller.locationId !== recipient.locationId || !battlefield(state, controller.locationId)) continue;
    if (playerIgnoresAbilityFromController(state, recipientId, controllerId) || playerIgnoresDefeatAtLocation(state, recipientId, controller.locationId)) continue;
    (runtime.battleDefeatRoundByPlayer ??= {})[recipientId] = state.round.roundNumber;
    runtime.events.push({ type: 'player_defeated_by_mana_overflow', playerId: recipientId, controllerId,
      sourceCardId, abilityId: ability.id, resource: 'mana', requestedDelta: storageOverflowAmount });
  }
}

export function acceptedManaTransactionAbilityAtSource(
  state: GameState,
  sourceCardId: string,
  abilityId: string,
  predicate: (ability: AuthoringAbility) => boolean,
): AuthoringAbility | undefined {
  const source = state.cards.find((candidate) => candidate.instanceId === sourceCardId);
  const definition = source ? state.abilityRuntime?.pack.cards[source.definitionId] : undefined;
  const ability = definition?.abilities.find((candidate) => candidate.id === abilityId);
  return ability && predicate(ability) ? ability : undefined;
}
