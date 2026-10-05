import type { GameState } from '../schema/game';
import { clearTransientCardTransformState } from './card-instance-state';
import { grantMana, spendMana } from '../core/rule-overrides';
import type { AbilityEvent, AuthoringAbility, EffectContext, PendingDecision, RuleNode, WitherPainStakeInteractionMetadata } from './types';

export const BATTLE_WITHER_APPLY_WINNERS_EFFECT = 'battle_wither_apply_to_winners' as const;
export const BATTLE_WITHER_STEAL_PARTICIPANTS_EFFECT = 'battle_wither_steal_from_participants' as const;
export const WITHER_PAIN_STAKE_ACTION_EFFECT = 'wither_pain_stake_action' as const;
export const LOCATION_BATTLE_END_RESOURCE_ADJUSTMENT_EFFECT = 'location_battle_end_resource_adjustment' as const;

const PREFIX = '__fd_battle_wither:';
const privileged = new Set<string>([
  BATTLE_WITHER_APPLY_WINNERS_EFFECT,
  BATTLE_WITHER_STEAL_PARTICIPANTS_EFFECT,
  WITHER_PAIN_STAKE_ACTION_EFFECT,
  LOCATION_BATTLE_END_RESOURCE_ADJUSTMENT_EFFECT,
]);

function rec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exact(value: unknown, keys: readonly string[]): boolean {
  if (!rec(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function empty(value: unknown): boolean { return rec(value) && Object.keys(value).length === 0; }
function key(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(value);
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exact(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function common(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.creates.length === 0 && ability.ruleModifiers.length === 0 && empty(ability.lifecycle) && empty(ability.limit) &&
    empty(ability.visibility) && standardResponse(ability) && ability.execution.mode === 'automatic' &&
    Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function forced(ability: AuthoringAbility, trigger: string): boolean {
  return ability.kind === 'forced_trigger' && exact(ability.activation, ['trigger']) && ability.activation.trigger === trigger && common(ability);
}
function action(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && exact(ability.activation, ['phase', 'opens']) && ability.activation.phase === 'action' &&
    ability.activation.opens === 'controller_action_window' && common(ability);
}

export function isBattleWitherApplyWinnersEffect(effect: RuleNode): boolean {
  return effect.type === BATTLE_WITHER_APPLY_WINNERS_EFFECT && key(effect.statusKey) && effect.clearRoundVpGainThreshold === 4 &&
    exact(effect, ['type', 'statusKey', 'clearRoundVpGainThreshold']);
}
export function isBattleWitherStealParticipantsEffect(effect: RuleNode): boolean {
  return effect.type === BATTLE_WITHER_STEAL_PARTICIPANTS_EFFECT && key(effect.statusKey) && effect.amount === 2 &&
    exact(effect, ['type', 'statusKey', 'amount']);
}
export function isWitherPainStakeActionEffect(effect: RuleNode): boolean {
  return effect.type === WITHER_PAIN_STAKE_ACTION_EFFECT && key(effect.statusKey) && effect.manaCost === 2 &&
    effect.discardPolicy === 'all_hand' && exact(effect, ['type', 'statusKey', 'manaCost', 'discardPolicy']);
}
export function isLocationBattleEndResourceAdjustmentEffect(effect: RuleNode): boolean {
  return effect.type === LOCATION_BATTLE_END_RESOURCE_ADJUSTMENT_EFFECT && key(effect.locationId) && effect.manaGain === 2 &&
    effect.vpLoss === 1 && exact(effect, ['type', 'locationId', 'manaGain', 'vpLoss']);
}

export function isAcceptedBattleWitherAbility(ability: AuthoringAbility): boolean {
  if (ability.effects.length !== 1) return false;
  const effect = ability.effects[0]!;
  if (isBattleWitherApplyWinnersEffect(effect)) return forced(ability, 'after_controller_loses_battle');
  if (isBattleWitherStealParticipantsEffect(effect)) return forced(ability, 'after_controller_wins_battle');
  if (isWitherPainStakeActionEffect(effect)) return action(ability);
  if (isLocationBattleEndResourceAdjustmentEffect(effect)) return forced(ability, 'after_battle_ended');
  return false;
}
export function containsBattleWitherPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsBattleWitherPrivilegedNode);
  if (!rec(value)) return false;
  if (typeof value.type === 'string' && privileged.has(value.type)) return true;
  return Object.values(value).some(containsBattleWitherPrivilegedNode);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('BATTLE_WITHER_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function bag(state: GameState, playerId: string): Record<string, boolean | string | number> {
  const r = runtime(state); return (r.structuredPlayerFlagsByPlayer ??= {})[playerId] ??= {};
}
function sourceKey(statusKey: string, sourcePlayerId: string): string { return `${PREFIX}${statusKey}:from:${sourcePlayerId}`; }
function trackerKey(statusKey: string, suffix: 'round' | 'gross' | 'lastVp'): string { return `${PREFIX}${statusKey}:${suffix}`; }
function presentSourceZone(zone: string): boolean { return ['skill', 'field', 'attack_area'].includes(zone); }
function sourceAbilities(state: GameState, playerId: string): Array<{ sourceCardId: string; ability: AuthoringAbility }> {
  const r = runtime(state); const out: Array<{ sourceCardId: string; ability: AuthoringAbility }> = [];
  for (const physical of state.cards) {
    if (physical.ownerPlayerId !== playerId || physical.controllerPlayerId !== playerId || !presentSourceZone(physical.zone)) continue;
    const definition = r.pack.cards[physical.definitionId];
    for (const ability of definition?.abilities ?? []) if (isAcceptedBattleWitherAbility(ability)) out.push({ sourceCardId: physical.instanceId, ability });
  }
  return out;
}
function applyProviders(state: GameState, playerId: string, statusKey: string): Array<{ sourceCardId: string; ability: AuthoringAbility }> {
  return sourceAbilities(state, playerId).filter(({ ability }) => {
    const effect = ability.effects[0]; return !!effect && isBattleWitherApplyWinnersEffect(effect) && effect.statusKey === statusKey;
  });
}
function sourceAbilityValid(state: GameState, controllerId: string, sourceCardId: string, abilityId: string): AuthoringAbility | undefined {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  const ability = source ? runtime(state).pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === abilityId) : undefined;
  return source && source.ownerPlayerId === controllerId && source.controllerPlayerId === controllerId && presentSourceZone(source.zone) &&
    ability && isAcceptedBattleWitherAbility(ability) ? ability : undefined;
}

export function isPlayerBattleWithered(state: GameState, playerId: string): boolean {
  const flags = runtime(state).structuredPlayerFlagsByPlayer?.[playerId] ?? {};
  return Object.entries(flags).some(([name, value]) => name.startsWith(PREFIX) && name.includes(':from:') && value === true);
}
function clearStatusFromSource(state: GameState, statusKey: string, sourcePlayerId: string): void {
  const name = sourceKey(statusKey, sourcePlayerId);
  for (const flags of Object.values(runtime(state).structuredPlayerFlagsByPlayer ?? {})) delete flags[name];
}
function ensureTracker(state: GameState, playerId: string, statusKey: string): { round: number; gross: number; lastVp: number } {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) throw new Error('BATTLE_WITHER_PLAYER_MISSING');
  const flags = bag(state, playerId);
  const roundName = trackerKey(statusKey, 'round'); const grossName = trackerKey(statusKey, 'gross'); const lastName = trackerKey(statusKey, 'lastVp');
  let round = Number(flags[roundName]); let gross = Number(flags[grossName]); let lastVp = Number(flags[lastName]);
  if (!Number.isSafeInteger(round) || round !== state.round.roundNumber || !Number.isSafeInteger(gross) || gross < 0 || !Number.isSafeInteger(lastVp) || lastVp < 0) {
    round = state.round.roundNumber; gross = 0; lastVp = player.vp;
  }
  flags[roundName] = round; flags[grossName] = gross; flags[lastName] = lastVp;
  return { round, gross, lastVp };
}
export function reconcileBattleWitherVictoryPoints(state: GameState): void {
  for (const player of state.players) {
    const byStatus = new Map<string, number>();
    for (const { ability } of sourceAbilities(state, player.id)) {
      const effect = ability.effects[0];
      if (effect && isBattleWitherApplyWinnersEffect(effect)) byStatus.set(String(effect.statusKey), Number(effect.clearRoundVpGainThreshold));
    }
    for (const [statusKey, threshold] of byStatus) {
      if (applyProviders(state, player.id, statusKey).length !== 1) continue;
      const tracker = ensureTracker(state, player.id, statusKey); const flags = bag(state, player.id);
      const positive = Math.max(0, player.vp - tracker.lastVp); const gross = tracker.gross + positive;
      flags[trackerKey(statusKey, 'gross')] = gross; flags[trackerKey(statusKey, 'lastVp')] = player.vp;
      if (gross >= threshold) clearStatusFromSource(state, statusKey, player.id);
    }
  }
}

function trustedBattleFacts(state: GameState, event: AbilityEvent | undefined, controllerId: string, type: 'after_controller_wins_battle' | 'after_controller_loses_battle') {
  if (!event || event.type !== type || event.playerId !== controllerId ||
      typeof event.battlePhaseResolutionId !== 'string' || typeof event.battleId !== 'string' ||
      typeof event.resultId !== 'string' || typeof event.battlefieldId !== 'string') return undefined;
  const root = runtime(state).trustedBattleResultSnapshots?.[event.resultId];
  if (!root || root.battlePhaseResolutionId !== event.battlePhaseResolutionId || root.battleId !== event.battleId ||
      root.resultId !== event.resultId || root.battlefieldId !== event.battlefieldId ||
      !root.battleParticipantIds.includes(controllerId)) return undefined;
  if (type === 'after_controller_wins_battle' && !root.winners.includes(controllerId)) return undefined;
  if (type === 'after_controller_loses_battle' && (root.winners.includes(controllerId) || !root.loserIds.includes(controllerId))) return undefined;
  return root;
}
function stagePainDecision(state: GameState, ctx: EffectContext, effect: RuleNode, remaining: string[]): boolean {
  const r = runtime(state); const statusKey = String(effect.statusKey); const manaCost = Number(effect.manaCost);
  const live = remaining.filter((id) => state.players.some((player) => player.id === id && player.status === 'active') && isPlayerBattleWithered(state, id));
  if (!live.length) { delete r.pendingDecision; return true; }
  const targetPlayerId = live[0]!; const target = state.players.find((player) => player.id === targetPlayerId)!;
  const candidates = target.mana >= manaCost ? ['pay_mana', 'discard_all'] : ['discard_all']; const id = `${ctx.sourceCardId}:${ctx.abilityId}:pain:${r.sequence++}`;
  const interaction: WitherPainStakeInteractionMetadata = {
    kind: 'wither_pain_stake_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
    sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: r.revision + 1, continuationRef: `${id}:continuation`,
    initiatingControllerId: ctx.controllerId, targetPlayerId, remainingTargetPlayerIds: [...live], statusKey, manaCost: 2, discardPolicy: 'all_hand',
    constraints: { kind: 'target', targetKind: 'choice', min: 1, max: 1, distinct: true },
  };
  r.pendingDecision = {
    id, controllerId: targetPlayerId,
    target: { id: 'wither_pain_stake_choice', type: 'choice', options: candidates.map((choice) => ({ id: choice })), count: { min: 1, max: 1 } },
    candidates, min: 1, max: 1, context: structuredClone(ctx), remainingEffects: [], interaction,
  };
  return true;
}
export function isWitherPainStakePendingDecisionLiveValid(state: GameState, decision: PendingDecision): boolean {
  try {
    const meta = decision.interaction;
    if (!meta || meta.kind !== 'wither_pain_stake_v1') return false;
    const ability = sourceAbilityValid(state, meta.initiatingControllerId, meta.sourceCardInstanceId, meta.abilityId);
    const effect = ability?.effects[0]; const target = state.players.find((entry) => entry.id === meta.targetPlayerId && entry.status === 'active');
    if (!ability || !effect || !isWitherPainStakeActionEffect(effect) || effect.statusKey !== meta.statusKey || !target ||
        !isPlayerBattleWithered(state, target.id) || decision.controllerId !== target.id || decision.context.controllerId !== meta.initiatingControllerId ||
        decision.context.sourceCardId !== meta.sourceCardInstanceId || decision.context.abilityId !== meta.abilityId ||
        meta.createdRevision !== runtime(state).revision || meta.continuationRef !== `${decision.id}:continuation` || meta.manaCost !== 2 ||
        meta.discardPolicy !== 'all_hand' || meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
        meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'choice' || meta.constraints.min !== 1 || meta.constraints.max !== 1 ||
        meta.constraints.distinct !== true || decision.target.id !== 'wither_pain_stake_choice' || decision.target.type !== 'choice' ||
        decision.min !== 1 || decision.max !== 1 || decision.remainingEffects.length !== 0 || meta.remainingTargetPlayerIds[0] !== target.id ||
        new Set(meta.remainingTargetPlayerIds).size !== meta.remainingTargetPlayerIds.length ||
        meta.remainingTargetPlayerIds.some((id) => !state.players.some((player) => player.id === id))) return false;
    const expected = target.mana >= 2 ? ['pay_mana', 'discard_all'] : ['discard_all'];
    return decision.candidates.length === expected.length && decision.candidates.every((value, index) => value === expected[index]);
  } catch { return false; }
}
export function resolveWitherPainStakeDecision(state: GameState, playerId: string, decision: PendingDecision, selected: readonly string[]): boolean {
  if (!isWitherPainStakePendingDecisionLiveValid(state, decision) || decision.controllerId !== playerId || selected.length !== 1 ||
      !decision.candidates.includes(selected[0]!)) return false;
  const meta = decision.interaction! as WitherPainStakeInteractionMetadata; const target = state.players.find((entry) => entry.id === playerId)!;
  if (selected[0] === 'pay_mana') spendMana(state, playerId, 2);
  else if (selected[0] === 'discard_all') {
    for (const physical of state.cards.filter((entry) => entry.ownerPlayerId === playerId && entry.controllerPlayerId === playerId && entry.zone === 'hand')) {
      physical.zone = 'discard'; physical.visibility = { scope: 'owner_only', ownerPlayerId: physical.ownerPlayerId };
      const cardState = runtime(state).cardState[physical.instanceId];
      if (cardState) { cardState.active = false; cardState.faceDown = false; delete cardState.paidManaOnPlay; }
      clearTransientCardTransformState(state, physical.instanceId);
    }
  } else return false;
  delete runtime(state).pendingDecision;
  return stagePainDecision(state, decision.context, { type: WITHER_PAIN_STAKE_ACTION_EFFECT, statusKey: meta.statusKey, manaCost: 2, discardPolicy: 'all_hand' }, meta.remainingTargetPlayerIds.slice(1));
}

export function canExecuteBattleWitherEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedBattleWitherAbility(ability) || !sourceAbilityValid(state, ctx.controllerId, ctx.sourceCardId, ctx.abilityId)) return false;
  const effect = ability.effects[0]!; const event = ctx.event;
  if (isBattleWitherApplyWinnersEffect(effect)) return !!trustedBattleFacts(state, event, ctx.controllerId, 'after_controller_loses_battle')?.winners.length;
  if (isBattleWitherStealParticipantsEffect(effect)) return !!trustedBattleFacts(state, event, ctx.controllerId, 'after_controller_wins_battle');
  if (isWitherPainStakeActionEffect(effect)) return state.players.some((entry) => entry.status === 'active' && isPlayerBattleWithered(state, entry.id));
  if (isLocationBattleEndResourceAdjustmentEffect(effect)) return event?.type === 'after_battle_ended' && typeof event.battlePhaseResolutionId === 'string' &&
    state.players.find((entry) => entry.id === ctx.controllerId)?.locationId === effect.locationId;
  return false;
}
export function resolveBattleWitherEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!canExecuteBattleWitherEffect(state, ctx, ability)) return false;
  const r = runtime(state); const effect = ability.effects[0]!; const event = ctx.event;
  if (isBattleWitherApplyWinnersEffect(effect)) {
    const facts = trustedBattleFacts(state, event, ctx.controllerId, 'after_controller_loses_battle'); if (!facts) return false;
    ensureTracker(state, ctx.controllerId, String(effect.statusKey));
    for (const winnerId of facts.winners) if (state.players.some((entry) => entry.id === winnerId && entry.status === 'active')) bag(state, winnerId)[sourceKey(String(effect.statusKey), ctx.controllerId)] = true;
    return true;
  }
  if (isBattleWitherStealParticipantsEffect(effect)) {
    const facts = trustedBattleFacts(state, event, ctx.controllerId, 'after_controller_wins_battle'); if (!facts) return false;
    const controller = state.players.find((entry) => entry.id === ctx.controllerId); if (!controller) return false;
    for (const targetId of facts.battleParticipantIds.filter((id) => id !== ctx.controllerId && isPlayerBattleWithered(state, id))) {
      const target = state.players.find((entry) => entry.id === targetId); if (!target) continue;
      const amount = Math.min(Number(effect.amount), Math.max(0, target.vp)); if (amount <= 0) continue;
      const targetBefore = target.vp; const controllerBefore = controller.vp; target.vp -= amount; controller.vp += amount;
      r.events.push({ type: 'victory_points_adjusted', playerId: target.id, controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, resource: 'victory_points', requestedDelta: -amount, delta: -amount, before: targetBefore, after: target.vp });
      r.events.push({ type: 'victory_points_adjusted', playerId: controller.id, controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, resource: 'victory_points', requestedDelta: amount, delta: amount, before: controllerBefore, after: controller.vp });
    }
    reconcileBattleWitherVictoryPoints(state); return true;
  }
  if (isWitherPainStakeActionEffect(effect)) {
    const order = state.players.filter((entry) => entry.status === 'active' && isPlayerBattleWithered(state, entry.id)).sort((a, b) => a.seat - b.seat).map((entry) => entry.id);
    return stagePainDecision(state, ctx, effect, order);
  }
  if (isLocationBattleEndResourceAdjustmentEffect(effect)) {
    const controller = state.players.find((entry) => entry.id === ctx.controllerId); if (!controller) return false;
    grantMana(state, controller.id, Number(effect.manaGain), { source: 'generic' });
    const before = controller.vp; const actualLoss = Math.min(before, Number(effect.vpLoss)); controller.vp = before - actualLoss;
    r.events.push({ type: 'victory_points_adjusted', playerId: controller.id, controllerId: controller.id, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, resource: 'victory_points', requestedDelta: -Number(effect.vpLoss), delta: -actualLoss, before, after: controller.vp });
    reconcileBattleWitherVictoryPoints(state); return true;
  }
  return false;
}

function parseStatusFlag(name: string): { statusKey: string; sourcePlayerId: string } | undefined {
  if (!name.startsWith(PREFIX)) return undefined;
  const tail = name.slice(PREFIX.length); const marker = ':from:'; const index = tail.indexOf(marker);
  if (index <= 0) return undefined; const statusKey = tail.slice(0, index); const sourcePlayerId = tail.slice(index + marker.length);
  return key(statusKey) && sourcePlayerId ? { statusKey, sourcePlayerId } : undefined;
}
function trackerStatus(name: string): { statusKey: string; suffix: 'round' | 'gross' | 'lastVp' } | undefined {
  if (!name.startsWith(PREFIX)) return undefined;
  const tail = name.slice(PREFIX.length);
  for (const suffix of ['round', 'gross', 'lastVp'] as const) {
    const marker = `:${suffix}`; if (tail.endsWith(marker)) { const statusKey = tail.slice(0, -marker.length); return key(statusKey) ? { statusKey, suffix } : undefined; }
  }
  return undefined;
}
export function isBattleWitherRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const r = runtime(state); const playerIds = new Set(state.players.map((entry) => entry.id));
    for (const [playerId, flags] of Object.entries(r.structuredPlayerFlagsByPlayer ?? {})) {
      if (!playerIds.has(playerId)) return false;
      const trackerStatuses = new Set<string>();
      for (const [name, value] of Object.entries(flags)) {
        if (!name.startsWith(PREFIX)) continue;
        const status = parseStatusFlag(name);
        if (status) {
          if (value !== true || !playerIds.has(status.sourcePlayerId) || applyProviders(state, status.sourcePlayerId, status.statusKey).length !== 1) return false;
          continue;
        }
        const tracker = trackerStatus(name); if (!tracker) return false; trackerStatuses.add(tracker.statusKey);
      }
      for (const statusKey of trackerStatuses) {
        if (applyProviders(state, playerId, statusKey).length !== 1) return false;
        const round = flags[trackerKey(statusKey, 'round')]; const gross = flags[trackerKey(statusKey, 'gross')]; const lastVp = flags[trackerKey(statusKey, 'lastVp')];
        if (!Number.isSafeInteger(round) || Number(round) < 1 || Number(round) > state.round.roundNumber || !Number.isSafeInteger(gross) || Number(gross) < 0 || !Number.isSafeInteger(lastVp) || Number(lastVp) < 0) return false;
      }
    }
    if (r.pendingDecision?.interaction?.kind === 'wither_pain_stake_v1' && !isWitherPainStakePendingDecisionLiveValid(state, r.pendingDecision)) return false;
    return true;
  } catch { return false; }
}
