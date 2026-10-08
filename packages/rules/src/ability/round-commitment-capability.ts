import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, RuleNode } from './types';

export const REPLACE_HIGHEST_BASIC_ATTACKS_EFFECT = 'replace_highest_basic_attacks_with_definition' as const;
export const ACTIVATE_ROUND_COMMITMENT_EFFECT = 'activate_round_commitment' as const;
export const ROUND_COMMITMENT_LOSS_VP_EFFECT = 'round_commitment_loss_vp_penalty' as const;
export const ROUND_COMMITMENT_DEFINITION_POWER_EFFECT = 'round_commitment_definition_power_bonus' as const;
export const ROUND_COMMITMENT_WIN_LOSERS_VP_EFFECT = 'round_commitment_win_losers_vp_penalty' as const;
export const ROUND_COMMITMENT_FIST_WIN_VP_EFFECT = 'round_commitment_fist_win_vp' as const;
export const ROUND_COMMITMENT_FIST_DOUBLE_EFFECT = 'round_commitment_fist_discard_other_double_power' as const;

type CommitmentEffect = RuleNode;

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('ROUND_COMMITMENT_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function exact(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((entry, index) => entry === expected[index]);
}
function empty(value: Record<string, unknown>): boolean { return Object.keys(value).length === 0; }
function key(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256 && !/\s/.test(value);
}
function common(ability: AuthoringAbility): boolean {
  const double = ability.effects.length === 1 && fistDoubleEffect(ability.effects[0]!);
  const validTarget = double && ability.targets.length === 1 && (() => { const t = ability.targets[0]!; const scope = t.scope as Record<string, unknown>; const count = t.count as Record<string, unknown>; return t.id === 'other_fist' && t.type === 'card_instance' && exact(t, ['id','type','scope','count','constraints']) && exact(scope,['zone','owner','controller']) && scope.zone === 'hand' && scope.owner === 'controller' && scope.controller === 'self' && exact(count,['min','max']) && count.min===1 && count.max===1 && Array.isArray(t.constraints) && t.constraints.length===0; })();
  return ability.conditions.length === 0 && (ability.targets.length === 0 || validTarget === true) && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) &&
    ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}
function responseOk(ability: AuthoringAbility): boolean {
  const response = ability.responseWindow as unknown as Record<string, unknown>;
  if (Object.keys(response).length === 0) return true;
  if (!exact(response, ['order','passBehavior'])) return false;
  return response.order === 'turn_order' && response.passBehavior === 'decline_this_window';
}

function replacementEffect(effect: RuleNode): boolean {
  return effect.type === REPLACE_HIGHEST_BASIC_ATTACKS_EFFECT &&
    key(effect.definitionId) && effect.count === 2 && effect.ranking === 'printed_base_power_desc_deck_order' &&
    exact(effect, ['type','definitionId','count','ranking']);
}
function activationEffect(effect: RuleNode): boolean {
  return effect.type === ACTIVATE_ROUND_COMMITMENT_EFFECT && key(effect.stateKey) && effect.powerBonus === 2 &&
    effect.mustDeployToBattlefield === true && effect.lockMovement === true &&
    exact(effect, ['type','stateKey','powerBonus','mustDeployToBattlefield','lockMovement']);
}
function lossEffect(effect: RuleNode): boolean {
  return effect.type === ROUND_COMMITMENT_LOSS_VP_EFFECT && key(effect.stateKey) && effect.amount === 2 &&
    exact(effect, ['type','stateKey','amount']);
}
function definitionPowerEffect(effect: RuleNode): boolean {
  return effect.type === ROUND_COMMITMENT_DEFINITION_POWER_EFFECT && key(effect.definitionId) && effect.amount === 6 &&
    exact(effect, ['type','definitionId','amount']);
}
function winnerLosersEffect(effect: RuleNode): boolean {
  return effect.type === ROUND_COMMITMENT_WIN_LOSERS_VP_EFFECT && key(effect.stateKey) && effect.amount === 2 &&
    exact(effect, ['type','stateKey','amount']);
}
function fistWinEffect(effect: RuleNode): boolean {
  return effect.type === ROUND_COMMITMENT_FIST_WIN_VP_EFFECT && effect.amount === 4 &&
    exact(effect, ['type','amount']);
}
function fistDoubleEffect(effect: RuleNode): boolean {
  return effect.type === ROUND_COMMITMENT_FIST_DOUBLE_EFFECT && effect.target === 'other_fist' && effect.multiplier === 2 &&
    exact(effect, ['type','target','multiplier']);
}
function acceptedEffect(effect: RuleNode): boolean {
  return replacementEffect(effect) || activationEffect(effect) || lossEffect(effect) ||
    definitionPowerEffect(effect) || winnerLosersEffect(effect) || fistWinEffect(effect) || fistDoubleEffect(effect);
}
function effectOf(ability: AuthoringAbility): CommitmentEffect | undefined {
  return ability.effects.length === 1 && acceptedEffect(ability.effects[0]!) ? ability.effects[0]! : undefined;
}

export function roundCommitmentFistDoubleCandidateIds(state: GameState, controllerId: string, sourceCardId: string): string[] {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  if (!source || source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId) return [];
  return state.cards.filter((entry) => entry.instanceId !== sourceCardId &&
    entry.ownerPlayerId === controllerId && entry.controllerPlayerId === controllerId &&
    entry.definitionId === source.definitionId && entry.zone === 'hand').map((entry) => entry.instanceId);
}

export function isRoundCommitmentFistDoubleAbility(ability: AuthoringAbility): boolean {
  return ability.effects.length === 1 && fistDoubleEffect(ability.effects[0]!) &&
    isAcceptedRoundCommitmentAbility(ability);
}

export function containsRoundCommitmentPrivilegedNode(ability: AuthoringAbility): boolean {
  return ability.effects.some((effect) => [
    REPLACE_HIGHEST_BASIC_ATTACKS_EFFECT,
    ACTIVATE_ROUND_COMMITMENT_EFFECT,
    ROUND_COMMITMENT_LOSS_VP_EFFECT,
    ROUND_COMMITMENT_DEFINITION_POWER_EFFECT,
    ROUND_COMMITMENT_WIN_LOSERS_VP_EFFECT,
    ROUND_COMMITMENT_FIST_WIN_VP_EFFECT,
    ROUND_COMMITMENT_FIST_DOUBLE_EFFECT,
  ].includes(String(effect.type) as never));
}

export function isAcceptedRoundCommitmentAbility(ability: AuthoringAbility): boolean {
  if (!common(ability) || !responseOk(ability)) return false;
  const effect = effectOf(ability); if (!effect) return false;
  const activation = ability.activation as unknown as Record<string, unknown>;
  if (replacementEffect(effect)) {
    return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'game_start';
  }
  if (activationEffect(effect)) {
    return ability.kind === 'phase_action' && exact(activation, ['phase','opens']) &&
      activation.phase === 'advance' && activation.opens === 'controller_action_window';
  }
  if (lossEffect(effect)) {
    return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'after_controller_loses_battle';
  }
  if (definitionPowerEffect(effect)) {
    return ability.kind === 'passive' && (empty(activation) || (exact(activation, ['trigger']) && activation.trigger === 'while_active'));
  }
  if (fistDoubleEffect(effect)) return ability.kind === 'phase_action' && exact(activation,['phase','opens']) && activation.phase === 'combat' && activation.opens === 'controller_combat_action_window';
  if (fistWinEffect(effect)) {
    return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'after_controller_wins_battle';
  }
  if (winnerLosersEffect(effect)) {
    return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'after_controller_wins_battle';
  }
  return false;
}

function sourceAndAbility(state: GameState, sourceCardId: string, abilityId: string) {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const definition = source ? runtime(state).pack.cards[source.definitionId] : undefined;
  const ability = definition?.abilities.find((entry) => entry.id === abilityId);
  return { source, definition, ability };
}
function belongsToControllerMaster(state: GameState, controllerId: string, sourceCardId: string): boolean {
  const player = state.players.find((entry) => entry.id === controllerId);
  const { source, definition } = sourceAndAbility(state, sourceCardId, '');
  if (!player || !source || !definition || definition.cardType !== 'master_skill' ||
      source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId) return false;
  const ownerId = (definition as unknown as { owner?: { id?: string } }).owner?.id;
  return ownerId === player.masterCardId || source.definitionId.startsWith(player.masterCardId + '.skill.');
}
function liveMasterSkillSource(state: GameState, controllerId: string, sourceCardId: string): boolean {
  if (!belongsToControllerMaster(state, controllerId, sourceCardId)) return false;
  const source = state.cards.find((card) => card.instanceId === sourceCardId)!;
  const cardState = runtime(state).cardState[sourceCardId];
  if (cardState?.faceDown === true) return false;
  if (source.zone === 'skill') return true;
  return ['field','attack_area'].includes(source.zone) && cardState?.active === true;
}

function commitmentAdjustment(state: GameState, controllerId: string, stateKey?: string) {
  const matches = (runtime(state).roundPlayerPowerAdjustments ?? []).filter((entry) => {
    if (entry.playerId !== controllerId || entry.round !== state.round.roundNumber) return false;
    const { ability } = sourceAndAbility(state, entry.sourceCardId, entry.abilityId);
    const effect = ability && effectOf(ability);
    return !!ability && !!effect && isAcceptedRoundCommitmentAbility(ability) && activationEffect(effect) &&
      entry.amount === Number(effect.powerBonus) && (stateKey === undefined || effect.stateKey === stateKey) &&
      belongsToControllerMaster(state, controllerId, entry.sourceCardId);
  });
  return matches.length === 1 ? matches[0] : undefined;
}
export function roundCommitmentMustDeployToBattlefield(state: GameState, playerId: string): boolean {
  return !!state.abilityRuntime && !!commitmentAdjustment(state, playerId);
}
export function roundCommitmentMovementLocked(state: GameState, playerId: string): boolean {
  return !!state.abilityRuntime && !!commitmentAdjustment(state, playerId);
}

function trustedBattleFacts(
  state: GameState,
  event: EffectContext['event'],
  controllerId: string,
  expectedType: 'after_controller_wins_battle' | 'after_controller_loses_battle',
) {
  if (!event || event.type !== expectedType || event.playerId !== controllerId ||
      typeof event.resultId !== 'string' || typeof event.battleId !== 'string' ||
      typeof event.battlePhaseResolutionId !== 'string' || typeof event.battlefieldId !== 'string') return undefined;
  const root = runtime(state).trustedBattleResultSnapshots?.[event.resultId];
  if (!root || root.resultId !== event.resultId || root.battleId !== event.battleId ||
      root.battlePhaseResolutionId !== event.battlePhaseResolutionId || root.battlefieldId !== event.battlefieldId ||
      !root.battleParticipantIds.includes(controllerId)) return undefined;
  if (expectedType === 'after_controller_wins_battle' && !root.winners.includes(controllerId)) return undefined;
  if (expectedType === 'after_controller_loses_battle' &&
      (root.winners.includes(controllerId) || !root.loserIds.includes(controllerId))) return undefined;
  return root;
}

function replaceHighestBasics(state: GameState, ctx: EffectContext, effect: RuleNode): boolean {
  if (!liveMasterSkillSource(state, ctx.controllerId, ctx.sourceCardId) || ctx.event?.type !== 'game_start') return false;
  const replacement = runtime(state).pack.cards[String(effect.definitionId)];
  if (!replacement || replacement.cardType !== 'basic_attack') return false;
  const candidates = state.cards
    .map((card, index) => ({ card, index, definition: runtime(state).pack.cards[card.definitionId] }))
    .filter((entry) => entry.card.ownerPlayerId === ctx.controllerId && entry.card.controllerPlayerId === ctx.controllerId &&
      entry.card.zone === 'deck' && entry.definition?.cardType === 'basic_attack' &&
      Number.isFinite(Number(entry.definition.cardFace.basePower)))
    .sort((left, right) => Number(right.definition!.cardFace.basePower) - Number(left.definition!.cardFace.basePower) || left.index - right.index);
  if (candidates.length < Number(effect.count)) return false;
  const selected = candidates.slice(0, Number(effect.count));
  for (const entry of selected) entry.card.definitionId = String(effect.definitionId);
  runtime(state).events.push({
    type: 'highest_basic_attacks_replaced',
    playerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId,
  });
  return true;
}

function applyVpLoss(state: GameState, targetPlayerId: string, amount: number, ctx: EffectContext): void {
  const target = state.players.find((entry) => entry.id === targetPlayerId); if (!target) return;
  const before = target.vp; const after = Math.max(0, before - amount); target.vp = after;
  runtime(state).events.push({
    type: 'victory_points_adjusted',
    playerId: targetPlayerId,
    controllerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId,
    resource: 'victory_points',
    requestedDelta: -amount,
    delta: after - before,
    before,
    after,
  });
}

export function canExecuteRoundCommitmentEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedRoundCommitmentAbility(ability)) return false;
  const effect = effectOf(ability)!;
  if (replacementEffect(effect)) return liveMasterSkillSource(state, ctx.controllerId, ctx.sourceCardId) && ctx.event?.type === 'game_start';
  if (activationEffect(effect)) return liveMasterSkillSource(state, ctx.controllerId, ctx.sourceCardId) &&
    state.round.activePhase === 'advance' && !commitmentAdjustment(state, ctx.controllerId, String(effect.stateKey));
  if (lossEffect(effect)) return !!commitmentAdjustment(state, ctx.controllerId, String(effect.stateKey)) &&
    !!trustedBattleFacts(state, ctx.event, ctx.controllerId, 'after_controller_loses_battle');
  if (definitionPowerEffect(effect)) return liveMasterSkillSource(state, ctx.controllerId, ctx.sourceCardId);
  if (fistDoubleEffect(effect)) {
    const source = state.cards.find((entry) => entry.instanceId === ctx.sourceCardId);
    const cardState = source && runtime(state).cardState[source.instanceId];
    if (!source || source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId ||
        source.zone !== 'attack_area' || !cardState?.active || cardState.faceDown === true ||
        cardState.basePowerMultiplier !== undefined && cardState.basePowerMultiplier !== 1 ||
        state.round.activePhase !== 'battle') return false;
    return state.cards.some((candidate) => candidate.instanceId !== source.instanceId &&
      candidate.definitionId === source.definitionId && candidate.ownerPlayerId === ctx.controllerId &&
      candidate.controllerPlayerId === ctx.controllerId && candidate.zone === 'hand');
  }
  if (fistWinEffect(effect)) {
    const source = state.cards.find((entry) => entry.instanceId === ctx.sourceCardId);
    const def = source ? runtime(state).pack.cards[source.definitionId] : undefined;
    const cardState = source ? runtime(state).cardState[source.instanceId] : undefined;
    return !!source && !!def && def.cardType === 'basic_attack' &&
      source.ownerPlayerId === ctx.controllerId && source.controllerPlayerId === ctx.controllerId &&
      source.zone === 'attack_area' && cardState?.active === true && cardState.faceDown !== true &&
      !state.cards.some((other) => other.instanceId !== source.instanceId &&
        other.definitionId === source.definitionId && other.controllerPlayerId === ctx.controllerId &&
        other.ownerPlayerId === ctx.controllerId && other.zone === 'attack_area' &&
        runtime(state).cardState[other.instanceId]?.active === true &&
        runtime(state).cardState[other.instanceId]?.faceDown !== true &&
        state.cards.indexOf(other) < state.cards.indexOf(source)) &&
      !!trustedBattleFacts(state, ctx.event, ctx.controllerId, 'after_controller_wins_battle');
  }
  if (winnerLosersEffect(effect)) return liveMasterSkillSource(state, ctx.controllerId, ctx.sourceCardId) &&
    !!commitmentAdjustment(state, ctx.controllerId, String(effect.stateKey)) &&
    !!trustedBattleFacts(state, ctx.event, ctx.controllerId, 'after_controller_wins_battle');
  return false;
}

export function resolveRoundCommitmentEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!canExecuteRoundCommitmentEffect(state, ctx, ability)) return false;
  const effect = effectOf(ability)!;
  if (replacementEffect(effect)) return replaceHighestBasics(state, ctx, effect);
  if (activationEffect(effect)) {
    runtime(state).roundPlayerPowerAdjustments ??= [];
    runtime(state).roundPlayerPowerAdjustments!.push({
      playerId: ctx.controllerId,
      amount: Number(effect.powerBonus),
      round: state.round.roundNumber,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
    });
    runtime(state).events.push({
      type: 'round_commitment_activated',
      playerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      roundNumber: state.round.roundNumber,
    });
    return true;
  }
  if (lossEffect(effect)) {
    applyVpLoss(state, ctx.controllerId, Number(effect.amount), ctx);
    return true;
  }
  if (definitionPowerEffect(effect)) return true;
  if (fistDoubleEffect(effect)) {
    const source = state.cards.find((entry) => entry.instanceId === ctx.sourceCardId);
    const selected = ctx.selections.other_fist;
    if (!source || !selected || selected.length !== 1) return false;
    const other = state.cards.find((entry) => entry.instanceId === selected[0]);
    if (!other || other.instanceId === source.instanceId || other.definitionId !== source.definitionId ||
        other.ownerPlayerId !== ctx.controllerId || other.controllerPlayerId !== ctx.controllerId || other.zone !== 'hand') return false;
    other.zone = 'discard';
    other.visibility = { scope: 'owner_only', ownerPlayerId: other.ownerPlayerId };
    const otherState = runtime(state).cardState[other.instanceId];
    if (otherState) { otherState.active = false; otherState.faceDown = false; delete otherState.basePowerMultiplier; }
    const stateOfSource = runtime(state).cardState[source.instanceId];
    if (!stateOfSource) return false;
    stateOfSource.basePowerMultiplier = 2;
    runtime(state).events.push({ type: 'round_commitment_fist_doubled', playerId: ctx.controllerId,
      sourceCardId: source.instanceId, abilityId: ctx.abilityId });
    return true;
  }
  if (fistWinEffect(effect)) {
    const p = state.players.find((entry) => entry.id === ctx.controllerId);
    if (!p || !Number.isSafeInteger(p.vp) || !Number.isSafeInteger(p.vp + 4)) return false;
    const before = p.vp; p.vp += 4;
    runtime(state).events.push({ type: 'victory_points_adjusted', playerId: p.id, controllerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, resource: 'victory_points',
      delta: 4, before, after: p.vp });
    return true;
  }
  if (winnerLosersEffect(effect)) {
    const facts = trustedBattleFacts(state, ctx.event, ctx.controllerId, 'after_controller_wins_battle'); if (!facts) return false;
    for (const loserId of facts.loserIds.filter((id) => !facts.winners.includes(id))) applyVpLoss(state, loserId, Number(effect.amount), ctx);
    return true;
  }
  return false;
}

export function roundCommitmentDefinitionPowerBonus(state: GameState, cardInstanceId: string): number {
  const runtimeState = state.abilityRuntime; if (!runtimeState) return 0;
  const target = state.cards.find((entry) => entry.instanceId === cardInstanceId); if (!target) return 0;
  const providers: number[] = [];
  for (const source of state.cards) {
    if (source.ownerPlayerId !== target.ownerPlayerId || source.controllerPlayerId !== target.controllerPlayerId) continue;
    if (!liveMasterSkillSource(state, source.controllerPlayerId, source.instanceId)) continue;
    const definition = runtimeState.pack.cards[source.definitionId];
    for (const ability of definition?.abilities ?? []) {
      const effect = effectOf(ability);
      if (effect && definitionPowerEffect(effect) && isAcceptedRoundCommitmentAbility(ability) &&
          effect.definitionId === target.definitionId) providers.push(Number(effect.amount));
    }
  }
  return providers.length === 1 ? providers[0]! : 0;
}

export function isRoundCommitmentPowerAdjustmentValidForRestore(
  state: GameState,
  entry: { playerId: string; amount: number; round: number; sourceCardId: string; abilityId: string },
): boolean {
  if (entry.round !== state.round.roundNumber || !belongsToControllerMaster(state, entry.playerId, entry.sourceCardId)) return false;
  const { ability } = sourceAndAbility(state, entry.sourceCardId, entry.abilityId);
  const effect = ability && effectOf(ability);
  return !!ability && !!effect && isAcceptedRoundCommitmentAbility(ability) && activationEffect(effect) &&
    entry.amount === Number(effect.powerBonus);
}
