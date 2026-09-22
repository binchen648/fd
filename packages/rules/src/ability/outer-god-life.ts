import type { GameState } from '../schema/game';
import { clearTransientCardTransformState } from './card-instance-state';
import type { AbilityEvent, AuthoringAbility, AuthoringCard, EffectContext, ExecutableCardDefinition, PlayerId } from './types';

export const OUTER_GOD_LIFE_CATEGORY = 'outer_god_life' as const;

function keysAre(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort(); const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}
export function hasOuterGodLifeCategory(card: AuthoringCard | undefined): boolean {
  return card?.cardFace.semanticCategory === OUTER_GOD_LIFE_CATEGORY;
}
export function isOuterGodLifeAbilityCandidate(ability: AuthoringAbility): boolean {
  return ability.effects.some((effect) => effect.type === 'adjust_round_total_power' || effect.type === 'schedule_source_card_return');
}
export function isOuterGodLifeAbilitySemantic(ability: AuthoringAbility): boolean {
  if (!isOuterGodLifeAbilityCandidate(ability) || ability.kind !== 'phase_action' || ability.execution.mode !== 'automatic' || ability.execution.allowedOperations.length) return false;
  if (ability.activation.phase !== 'combat' || ability.activation.opens !== 'controller_combat_action_window' || ability.activation.requiresSourceState !== 'active' ||
    !keysAre(ability.activation, ['phase', 'opens', 'requiresSourceState'])) return false;
  if (ability.conditions.length || ability.targets.length || ability.cost.length || ability.creates.length || ability.ruleModifiers.length ||
    Object.keys(ability.lifecycle).length || Object.keys(ability.limit).length) return false;
  const responseKeys = Object.keys(ability.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (ability.responseWindow.order !== undefined && ability.responseWindow.order !== 'turn_order') ||
    (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== 'decline_this_window')) return false;
  if (ability.effects.length !== 2) return false;
  const power = ability.effects[0]!; const returned = ability.effects[1]!;
  return power.type === 'adjust_round_total_power' && power.amount === 6 && power.dedupe === true &&
    Array.isArray(power.recipients) && power.recipients.length === 2 && power.recipients[0] === 'controller' && power.recipients[1] === 'source_servant_owner' &&
    keysAre(power, ['type', 'recipients', 'amount', 'dedupe']) &&
    returned.type === 'schedule_source_card_return' && returned.recipient === 'source_servant_owner' &&
    keysAre(returned, ['type', 'recipient']);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('Outer-God-Life requires initialized ability runtime');
  return state.abilityRuntime;
}
function sourceAndRecipient(state: GameState, sourceCardId: string, requireLiveRecipient = false) {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  if (!source) throw new Error('Outer-God-Life source card is missing');
  const definition = runtime(state).pack.cards[source.definitionId] as ExecutableCardDefinition | undefined;
  if (!definition || definition.cardType !== 'servant_skill' || !hasOuterGodLifeCategory(definition) || !definition.ownerId) {
    throw new Error('Outer-God-Life source definition is not structurally eligible');
  }
  const recipients = state.players.filter((player) =>
    player.servantCardId === definition.ownerId && (!requireLiveRecipient || player.status === 'active'));
  if (recipients.length !== 1) throw new Error('Outer-God-Life source servant owner relationship is invalid');
  return { source, definition, recipient: recipients[0]! };
}

export function applyOuterGodLifeUse(state: GameState, ctx: EffectContext, ability: AuthoringAbility): void {
  if (!isOuterGodLifeAbilitySemantic(ability)) throw new Error('Unsupported Outer-God-Life semantic shape');
  const r = runtime(state); const { source, recipient } = sourceAndRecipient(state, ctx.sourceCardId, true);
  const sourceState = r.cardState[source.instanceId];
  if (!['field', 'attack_area'].includes(source.zone) || sourceState?.active !== true || sourceState.faceDown) {
    throw new Error('Outer-God-Life source must remain active');
  }
  if (source.controllerPlayerId !== ctx.controllerId) throw new Error('Outer-God-Life controller changed before resolution');
  if (r.roundTotalPowerAdjustments.round !== state.round.roundNumber) r.roundTotalPowerAdjustments = { round: state.round.roundNumber, byPlayer: {} };
  for (const playerId of new Set<PlayerId>([ctx.controllerId, recipient.id])) {
    r.roundTotalPowerAdjustments.byPlayer[playerId] = (r.roundTotalPowerAdjustments.byPlayer[playerId] ?? 0) + 6;
  }
  if (!source.generatedBy && !r.pendingSourceCardReturns.some((entry) => entry.sourceCardId === source.instanceId && entry.round === state.round.roundNumber)) {
    r.pendingSourceCardReturns.push({ sourceCardId: source.instanceId, abilityId: ability.id, recipientPlayerId: recipient.id, round: state.round.roundNumber });
  }
}

export function roundTotalPowerAdjustment(state: GameState, playerId: PlayerId): number {
  const ledger = state.abilityRuntime?.roundTotalPowerAdjustments;
  return ledger?.round === state.round.roundNumber ? ledger.byPlayer[playerId] ?? 0 : 0;
}

export function settlePendingSourceCardReturns(state: GameState, event: AbilityEvent): void {
  if (event.type !== 'after_battle_ended') return;
  const r = runtime(state); const due = r.pendingSourceCardReturns.filter((entry) => entry.round === state.round.roundNumber);
  if (!due.length) return;
  if (!event.battlePhaseResolutionId) throw new Error('Outer-God-Life return requires authoritative battle-terminal provenance');
  for (const entry of due) {
    const { source, definition, recipient } = sourceAndRecipient(state, entry.sourceCardId);
    if (recipient.id !== entry.recipientPlayerId || definition.ownerId !== recipient.servantCardId) throw new Error('Outer-God-Life return recipient relationship changed');
    if (source.generatedBy) throw new Error('Derived Outer-God-Life sources do not use the ordinary return path');
    const sourceState = r.cardState[source.instanceId];
    if (!['field', 'attack_area'].includes(source.zone) || sourceState?.active !== true || sourceState.faceDown) throw new Error('Outer-God-Life return source is stale');
    source.ownerPlayerId = recipient.id; source.controllerPlayerId = recipient.id; source.zone = 'discard';
    source.visibility = { scope: 'owner_only', ownerPlayerId: recipient.id };
    sourceState.active = false;
    clearTransientCardTransformState(state, source.instanceId);
  }
  r.pendingSourceCardReturns = r.pendingSourceCardReturns.filter((entry) => entry.round !== state.round.roundNumber);
}
