import type { CardInstance } from '../schema/card';
import type { GameState } from '../schema/game';
import type {
  AuthoringAbility,
  EffectContext,
  LinkedAuxiliarySuiteInteractionMetadata,
  LinkedAuxiliarySuiteState,
  PendingDecision,
  PlayerId,
  RuleNode,
} from './types';

export const LINKED_AUXILIARY_SUITE_EFFECT = 'linked_auxiliary_suite' as const;

type SuiteOp =
  | 'setup'
  | 'mark_win'
  | 'round_end_upkeep'
  | 'append_cost_rule'
  | 'power_immutable'
  | 'remove_other_for_mana'
  | 'shuffle_close_play'
  | 'shuffle_round_power'
  | 'loss_reward'
  | 'battle_end_return'
  | 'discard_move'
  | 'seal_mana_substitution'
  | 'round_play_exceptions'
  | 'ascension_activate'
  | 'ascension_play_power'
  | 'ascension_redraw';

type SuiteEffect = RuleNode & {
  type: typeof LINKED_AUXILIARY_SUITE_EFFECT;
  op: SuiteOp;
  stateKey: string;
};

export interface LinkedAuxiliarySuiteOps {
  moveCard(cardInstanceId: string, zone: 'hand' | 'deck' | 'discard' | 'attack_area' | 'removed_from_game'): void;
  shuffleDeck(playerId: PlayerId): void;
  grantMana(playerId: PlayerId, amount: number): void;
  spendMana(playerId: PlayerId, amount: number): boolean;
  closeControlledActiveCard(playerId: PlayerId, cardInstanceId: string, effectControllerId: PlayerId): boolean;
  closableControlledCardIds(playerId: PlayerId, effectControllerId: PlayerId): string[];
  playableHandCardIds(playerId: PlayerId): string[];
  playHandCardDuringCombat(playerId: PlayerId, cardInstanceId: string, sourceCardId: string, abilityId: string): boolean;
  movePlayer(playerId: PlayerId, locationId: string, sourceCardId: string, abilityId: string): boolean;
  drawCards(playerId: PlayerId, count: number, ctx: EffectContext): boolean;
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('LINKED_AUXILIARY_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function rec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exact(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((entry, index) => entry === expected[index]);
}
function id(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
function int(value: unknown, min = 0): value is number {
  return Number.isSafeInteger(value) && Number(value) >= min;
}
function uniqueIds(value: unknown, min = 1): value is string[] {
  return Array.isArray(value) && value.length >= min && value.every(id) && new Set(value).size === value.length;
}
function empty(value: Record<string, unknown>): boolean {
  return Object.keys(value).length === 0;
}
function commonAbility(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) &&
    ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}
function responseOk(ability: AuthoringAbility): boolean {
  const keys = Object.keys(ability.responseWindow);
  if (keys.length === 0) return true;
  if (!keys.every((key) => key === 'opens' || key === 'order' || key === 'passBehavior')) return false;
  if ('order' in ability.responseWindow && ability.responseWindow.order !== 'turn_order') return false;
  if ('passBehavior' in ability.responseWindow && ability.responseWindow.passBehavior !== 'decline_this_window') return false;
  return true;
}
function effectOf(ability: AuthoringAbility): SuiteEffect | undefined {
  return ability.effects.length === 1 && isLinkedAuxiliarySuiteEffect(ability.effects[0]!) ? ability.effects[0]! : undefined;
}
function suiteKey(controllerId: PlayerId, stateKey: string): string {
  return controllerId + ':' + stateKey;
}
export function linkedAuxiliarySuiteState(state: GameState, controllerId: PlayerId, stateKey: string): LinkedAuxiliarySuiteState | undefined {
  return runtime(state).linkedAuxiliarySuites?.[suiteKey(controllerId, stateKey)];
}
function requiredSuite(state: GameState, controllerId: PlayerId, stateKey: string): LinkedAuxiliarySuiteState {
  const found = linkedAuxiliarySuiteState(state, controllerId, stateKey);
  if (!found) throw new Error('LINKED_AUXILIARY_SUITE_STATE_REQUIRED');
  return found;
}
function physical(state: GameState, instanceId: string): CardInstance | undefined {
  return state.cards.find((entry) => entry.instanceId === instanceId);
}
function abilityAt(state: GameState, sourceCardId: string, abilityId: string): AuthoringAbility | undefined {
  const card = physical(state, sourceCardId);
  return card ? runtime(state).pack.cards[card.definitionId]?.abilities.find((ability) => ability.id === abilityId) : undefined;
}
function providerValid(state: GameState, suite: LinkedAuxiliarySuiteState): boolean {
  const source = physical(state, suite.providerSourceCardId);
  const ability = source ? abilityAt(state, source.instanceId, suite.providerAbilityId) : undefined;
  const effect = ability && effectOf(ability);
  return !!source && source.ownerPlayerId === suite.controllerId && source.controllerPlayerId === suite.controllerId &&
    !!effect && effect.op === 'setup' && effect.stateKey === suite.stateKey;
}
function memberIds(state: GameState, suite: LinkedAuxiliarySuiteState): string[] {
  return suite.cardInstanceIds.filter((instanceId) => {
    const card = physical(state, instanceId);
    return !!card && card.ownerPlayerId === suite.controllerId && card.controllerPlayerId === suite.controllerId &&
      suite.definitionIds.includes(card.definitionId);
  });
}
function activeMemberIds(state: GameState, suite: LinkedAuxiliarySuiteState): string[] {
  return memberIds(state, suite).filter((instanceId) => {
    const card = physical(state, instanceId);
    const cardState = runtime(state).cardState[instanceId];
    return card?.zone === 'attack_area' && cardState?.active === true && cardState.faceDown !== true;
  });
}
function memberOfSuite(state: GameState, suite: LinkedAuxiliarySuiteState, instanceId: string): boolean {
  return suite.cardInstanceIds.includes(instanceId) && memberIds(state, suite).includes(instanceId);
}
function markerAbility(
  state: GameState,
  suite: LinkedAuxiliarySuiteState,
  op: SuiteOp,
): { source: CardInstance; ability: AuthoringAbility; effect: SuiteEffect } | undefined {
  for (const instanceId of activeMemberIds(state, suite)) {
    const source = physical(state, instanceId)!;
    const definition = runtime(state).pack.cards[source.definitionId];
    for (const ability of definition?.abilities ?? []) {
      const effect = effectOf(ability);
      if (effect?.op === op && effect.stateKey === suite.stateKey && isAcceptedLinkedAuxiliarySuiteAbility(ability)) {
        return { source, ability, effect };
      }
    }
  }
  return undefined;
}
function sourceBelongsToSuite(state: GameState, ctx: EffectContext, effect: SuiteEffect): LinkedAuxiliarySuiteState | undefined {
  const suite = linkedAuxiliarySuiteState(state, ctx.controllerId, effect.stateKey);
  if (!suite || !providerValid(state, suite) || !memberOfSuite(state, suite, ctx.sourceCardId)) return undefined;
  return suite;
}
function sourceActiveMember(state: GameState, ctx: EffectContext, effect: SuiteEffect): LinkedAuxiliarySuiteState | undefined {
  const suite = sourceBelongsToSuite(state, ctx, effect);
  return suite && activeMemberIds(state, suite).includes(ctx.sourceCardId) ? suite : undefined;
}
function stage(
  state: GameState,
  ctx: EffectContext,
  suite: LinkedAuxiliarySuiteState,
  stageName: LinkedAuxiliarySuiteInteractionMetadata['stage'],
  candidates: string[],
  targetKind: 'card' | 'choice' | 'location',
  min = 1,
  max = 1,
): boolean {
  if (runtime(state).pendingDecision || candidates.length < min) return false;
  const decisionId = 'linked-auxiliary-' + (++runtime(state).sequence);
  const interaction: LinkedAuxiliarySuiteInteractionMetadata = {
    kind: 'linked_auxiliary_suite_choice_v1',
    template: 'target',
    visibility: 'owner_only',
    cancelPolicy: 'forbidden',
    sourceCardInstanceId: ctx.sourceCardId,
    abilityId: ctx.abilityId,
    createdRevision: runtime(state).revision + 1,
    continuationRef: decisionId + ':continuation',
    controllerId: ctx.controllerId,
    stateKey: suite.stateKey,
    stage: stageName,
    candidateIds: [...candidates],
    constraints: { kind: 'target', targetKind, min, max, distinct: true },
  };
  runtime(state).pendingDecision = {
    id: decisionId,
    controllerId: ctx.controllerId,
    target: { id: 'linked_auxiliary_choice', type: targetKind === 'card' ? 'card_instance' : 'choice', count: { min, max } },
    candidates: [...candidates],
    min,
    max,
    context: structuredClone(ctx),
    remainingEffects: [],
    interaction,
  };
  return true;
}

export function isLinkedAuxiliarySuiteEffect(value: RuleNode): value is SuiteEffect {
  if (value.type !== LINKED_AUXILIARY_SUITE_EFFECT || !id(value.op) || !id(value.stateKey)) return false;
  const op = value.op as SuiteOp;
  if (op === 'setup') return exact(value, ['type','op','stateKey','definitionIds','destination','zeroCommandSeals']) &&
    uniqueIds(value.definitionIds, 2) && value.destination === 'attack_area' && value.zeroCommandSeals === true;
  if (op === 'remove_other_for_mana') return exact(value, ['type','op','stateKey','manaGain']) && int(value.manaGain, 1);
  if (op === 'shuffle_round_power') return exact(value, ['type','op','stateKey','amount']) && int(value.amount, 1);
  if (op === 'loss_reward') return exact(value, ['type','op','stateKey','vpGain']) && int(value.vpGain, 1);
  if (op === 'battle_end_return') return exact(value, ['type','op','stateKey','requiredLocationId']) && id(value.requiredLocationId);
  if (op === 'seal_mana_substitution') return exact(value, ['type','op','stateKey','manaPerSeal']) && int(value.manaPerSeal, 1);
  if (op === 'round_play_exceptions') return exact(value, ['type','op','stateKey','waiveRequirementType','ignoreNoblePhantasmSituationForbid']) &&
    value.waiveRequirementType === 'skill_zone_mana_at_least' && value.ignoreNoblePhantasmSituationForbid === true;
  if (op === 'ascension_play_power') return exact(value, ['type','op','stateKey','amount']) && int(value.amount, 1);
  if (op === 'ascension_redraw') return exact(value, ['type','op','stateKey','manaCost','drawCount']) &&
    int(value.manaCost, 1) && int(value.drawCount, 1);
  return [
    'mark_win','round_end_upkeep','append_cost_rule','power_immutable','shuffle_close_play',
    'discard_move','ascension_activate',
  ].includes(op) && exact(value, ['type','op','stateKey']);
}

export function containsLinkedAuxiliarySuitePrivilegedNode(ability: AuthoringAbility): boolean {
  return ability.effects.some((effect) => effect.type === LINKED_AUXILIARY_SUITE_EFFECT);
}

export function isAcceptedLinkedAuxiliarySuiteAbility(ability: AuthoringAbility): boolean {
  if (!commonAbility(ability) || !responseOk(ability)) return false;
  const effect = effectOf(ability);
  if (!effect) return false;
  const activation = ability.activation;
  if (effect.op === 'setup') return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'game_start';
  if (effect.op === 'mark_win') return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'after_controller_wins_battle';
  if (effect.op === 'round_end_upkeep') return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'round_end';
  if (['append_cost_rule','power_immutable','seal_mana_substitution','ascension_play_power'].includes(effect.op)) {
    return ability.kind === 'passive' && (empty(activation) || (exact(activation, ['trigger']) && activation.trigger === 'while_active'));
  }
  if (effect.op === 'remove_other_for_mana' || effect.op === 'discard_move') {
    return ability.kind === 'phase_action' && exact(activation, ['phase','opens']) &&
      activation.phase === 'action' && activation.opens === 'controller_action_window';
  }
  if (effect.op === 'shuffle_close_play') {
    return ability.kind === 'phase_action' && exact(activation, ['phase','opens']) &&
      activation.phase === 'combat' && activation.opens === 'controller_combat_action_window';
  }
  if (effect.op === 'shuffle_round_power' || effect.op === 'ascension_redraw') {
    return ability.kind === 'phase_action' && exact(activation, ['phase','opens']) &&
      activation.phase === 'preparation' && activation.opens === 'controller_action_window';
  }
  if (effect.op === 'round_play_exceptions') {
    return ability.kind === 'phase_action' && exact(activation, ['phase','opens']) &&
      activation.phase === 'action' && activation.opens === 'controller_action_window';
  }
  if (effect.op === 'loss_reward') {
    return ability.kind === 'response' && exact(activation, ['trigger']) && activation.trigger === 'after_controller_loses_battle' &&
      ability.responseWindow.opens === 'after_controller_loses_battle';
  }
  if (effect.op === 'battle_end_return') {
    return ability.kind === 'response' && exact(activation, ['trigger']) && activation.trigger === 'after_battle_ended' &&
      ability.responseWindow.opens === 'after_battle_ended';
  }
  if (effect.op === 'ascension_activate') {
    return ability.kind === 'forced_trigger' && exact(activation, ['trigger']) && activation.trigger === 'after_master_ascension_unlocked';
  }
  return false;
}

function initialize(state: GameState, ctx: EffectContext, effect: SuiteEffect): boolean {
  const definitions = effect.definitionIds as string[];
  const key = suiteKey(ctx.controllerId, effect.stateKey);
  if ((runtime(state).linkedAuxiliarySuites ?? {})[key]) return false;
  if (definitions.some((definitionId) => !runtime(state).pack.cards[definitionId])) return false;
  if (state.cards.some((card) => card.controllerPlayerId === ctx.controllerId && definitions.includes(card.definitionId))) return false;
  const created: string[] = [];
  for (const definitionId of definitions) {
    const instanceId = 'linked-auxiliary-' + (++runtime(state).sequence);
    state.cards.push({
      instanceId,
      definitionId,
      ownerPlayerId: ctx.controllerId,
      controllerPlayerId: ctx.controllerId,
      zone: 'attack_area',
      visibility: { scope: 'public' },
      generatedBy: ctx.sourceCardId,
    });
    runtime(state).cardState[instanceId] = { active: true, faceDown: false, playedRound: state.round.roundNumber, paidManaOnPlay: 0 };
    created.push(instanceId);
  }
  const player = state.players.find((entry) => entry.id === ctx.controllerId);
  if (!player) return false;
  (player as unknown as { commandSpells?: number }).commandSpells = 0;
  runtime(state).linkedAuxiliarySuites ??= {};
  runtime(state).linkedAuxiliarySuites![key] = {
    controllerId: ctx.controllerId,
    stateKey: effect.stateKey,
    providerSourceCardId: ctx.sourceCardId,
    providerAbilityId: ctx.abilityId,
    definitionIds: [...definitions],
    cardInstanceIds: created,
    initializedRevision: runtime(state).revision + 1,
  };
  runtime(state).events.push({ type: 'linked_auxiliary_suite_initialized', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
  return true;
}
function eliminateForMissingUpkeep(state: GameState, suite: LinkedAuxiliarySuiteState, sourceCardId: string, abilityId: string): void {
  const player = state.players.find((entry) => entry.id === suite.controllerId);
  if (!player || player.status !== 'active') return;
  player.status = 'eliminated';
  const prior = state.players.map((entry) => entry.eliminationOrder ?? 0).filter((value) => Number.isSafeInteger(value));
  player.eliminationOrder = Math.max(0, ...prior) + 1;
  runtime(state).events.push({ type: 'player_eliminated_by_linked_auxiliary_upkeep', playerId: suite.controllerId, sourceCardId, abilityId });
}
function setupUpkeep(state: GameState, ctx: EffectContext, suite: LinkedAuxiliarySuiteState, ops: LinkedAuxiliarySuiteOps): boolean {
  if (suite.wonRound === state.round.roundNumber || suite.skipUpkeepRound === state.round.roundNumber) return true;
  const active = activeMemberIds(state, suite);
  if (active.length === 0) { eliminateForMissingUpkeep(state, suite, ctx.sourceCardId, ctx.abilityId); return true; }
  if (active.length === 1) { ops.moveCard(active[0]!, 'removed_from_game'); return true; }
  return stage(state, ctx, suite, 'upkeep_remove', active, 'card');
}
function sourceCanUseHandOrActive(state: GameState, ctx: EffectContext, suite: LinkedAuxiliarySuiteState): boolean {
  const source = physical(state, ctx.sourceCardId);
  const sourceState = runtime(state).cardState[ctx.sourceCardId];
  return !!source && memberOfSuite(state, suite, source.instanceId) &&
    ((source.zone === 'hand' && sourceState?.faceDown !== true) ||
      (source.zone === 'attack_area' && sourceState?.active === true && sourceState.faceDown !== true));
}
function allEnabledLocations(state: GameState): string[] {
  return state.map.locations.map((location) => location.id);
}

export function canExecuteLinkedAuxiliarySuiteEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility, ops?: LinkedAuxiliarySuiteOps): boolean {
  if (!isAcceptedLinkedAuxiliarySuiteAbility(ability)) return false;
  const effect = effectOf(ability)!;
  if (effect.op === 'setup') return !linkedAuxiliarySuiteState(state, ctx.controllerId, effect.stateKey);
  if (effect.op === 'mark_win') return !!linkedAuxiliarySuiteState(state, ctx.controllerId, effect.stateKey) && ctx.event?.type === 'after_controller_wins_battle' && ctx.event.playerId === ctx.controllerId;
  const suite = linkedAuxiliarySuiteState(state, ctx.controllerId, effect.stateKey);
  if (!suite || !providerValid(state, suite)) return false;
  if (effect.op === 'round_end_upkeep') return ctx.event?.type === 'round_end';
  if (effect.op === 'ascension_activate') return ctx.event?.type === 'after_master_ascension_unlocked' &&
    ctx.event.playerId === ctx.controllerId && ctx.event.sourceCardId === ctx.sourceCardId;
  if (['append_cost_rule','seal_mana_substitution','ascension_play_power'].includes(effect.op)) return true;
  if (effect.op === 'power_immutable') return !!sourceActiveMember(state, ctx, effect);
  if (effect.op === 'remove_other_for_mana') return !!sourceActiveMember(state, ctx, effect) && activeMemberIds(state, suite).some((id) => id !== ctx.sourceCardId);
  if (effect.op === 'shuffle_close_play') return !!ops && !!sourceActiveMember(state, ctx, effect) &&
    ops.closableControlledCardIds(ctx.controllerId, ctx.controllerId).some((id) => id !== ctx.sourceCardId) &&
    ops.playableHandCardIds(ctx.controllerId).length > 0;
  if (effect.op === 'shuffle_round_power' || effect.op === 'round_play_exceptions') return !!sourceActiveMember(state, ctx, effect);
  if (effect.op === 'loss_reward') return !!sourceActiveMember(state, ctx, effect) && ctx.event?.type === 'after_controller_loses_battle' && ctx.event.playerId === ctx.controllerId;
  if (effect.op === 'battle_end_return') return !!sourceActiveMember(state, ctx, effect) && ctx.event?.type === 'after_battle_ended' &&
    state.players.find((entry) => entry.id === ctx.controllerId)?.locationId === effect.requiredLocationId;
  if (effect.op === 'discard_move') return sourceCanUseHandOrActive(state, ctx, suite) && allEnabledLocations(state).length > 0;
  if (effect.op === 'ascension_redraw') return !!ops && suite.ascensionActive === true &&
    state.players.find((entry) => entry.id === ctx.controllerId)!.mana >= Number(effect.manaCost) &&
    !state.cards.some((card) => memberOfSuite(state, suite, card.instanceId) && card.zone === 'hand');
  return false;
}

export function resolveLinkedAuxiliarySuiteEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility, ops: LinkedAuxiliarySuiteOps): boolean {
  if (!canExecuteLinkedAuxiliarySuiteEffect(state, ctx, ability, ops)) return false;
  const effect = effectOf(ability)!;
  if (effect.op === 'setup') return initialize(state, ctx, effect);
  const suite = requiredSuite(state, ctx.controllerId, effect.stateKey);
  if (effect.op === 'mark_win') { suite.wonRound = state.round.roundNumber; return true; }
  if (effect.op === 'round_end_upkeep') return setupUpkeep(state, ctx, suite, ops);
  if (['append_cost_rule','power_immutable','seal_mana_substitution','ascension_play_power'].includes(effect.op)) return true;
  if (effect.op === 'remove_other_for_mana') {
    return stage(state, ctx, suite, 'remove_other', activeMemberIds(state, suite).filter((id) => id !== ctx.sourceCardId), 'card');
  }
  if (effect.op === 'shuffle_close_play') {
    return stage(state, ctx, suite, 'close_other', ops.closableControlledCardIds(ctx.controllerId, ctx.controllerId).filter((id) => id !== ctx.sourceCardId), 'card');
  }
  if (effect.op === 'shuffle_round_power') {
    ops.moveCard(ctx.sourceCardId, 'deck'); ops.shuffleDeck(ctx.controllerId);
    suite.roundPowerBonus = { round: state.round.roundNumber, amount: Number(effect.amount), sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId };
    runtime(state).roundPlayerPowerAdjustments ??= [];
    runtime(state).roundPlayerPowerAdjustments!.push({ playerId: ctx.controllerId, amount: Number(effect.amount), round: state.round.roundNumber, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    return true;
  }
  if (effect.op === 'loss_reward') {
    ops.moveCard(ctx.sourceCardId, 'deck'); ops.shuffleDeck(ctx.controllerId);
    const player = state.players.find((entry) => entry.id === ctx.controllerId)!;
    player.vp += Number(effect.vpGain); suite.skipUpkeepRound = state.round.roundNumber; return true;
  }
  if (effect.op === 'battle_end_return') {
    ops.moveCard(ctx.sourceCardId, 'hand'); suite.skipUpkeepRound = state.round.roundNumber; return true;
  }
  if (effect.op === 'discard_move') {
    return stage(state, ctx, suite, 'move_location', allEnabledLocations(state), 'location');
  }
  if (effect.op === 'round_play_exceptions') { suite.roundExceptionRound = state.round.roundNumber; ops.moveCard(ctx.sourceCardId, 'deck'); ops.shuffleDeck(ctx.controllerId); return true; }
  if (effect.op === 'ascension_activate') {
    const source = physical(state, ctx.sourceCardId); const sourceState = runtime(state).cardState[ctx.sourceCardId];
    if (!source || source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId) return false;
    ops.moveCard(ctx.sourceCardId, 'attack_area'); source.visibility = { scope: 'public' };
    const liveState = runtime(state).cardState[ctx.sourceCardId] ?? sourceState;
    if (!liveState) return false;
    liveState.active = true; liveState.faceDown = false; liveState.playedRound = state.round.roundNumber; liveState.paidManaOnPlay = 0;
    suite.ascensionSourceCardId = ctx.sourceCardId; suite.ascensionAbilityId = ctx.abilityId; suite.ascensionActive = true;
    return true;
  }
  if (effect.op === 'ascension_redraw') {
    if (!ops.spendMana(ctx.controllerId, Number(effect.manaCost))) return false;
    for (const card of state.cards.filter((entry) => entry.ownerPlayerId === ctx.controllerId && entry.controllerPlayerId === ctx.controllerId && entry.zone === 'hand')) {
      ops.moveCard(card.instanceId, 'discard');
    }
    return ops.drawCards(ctx.controllerId, Number(effect.drawCount), ctx);
  }
  return false;
}

function sourceAbilityForDecision(state: GameState, decision: PendingDecision): { ability: AuthoringAbility; effect: SuiteEffect } | undefined {
  const meta = decision.interaction;
  if (!meta || meta.kind !== 'linked_auxiliary_suite_choice_v1') return undefined;
  const ability = abilityAt(state, meta.sourceCardInstanceId, meta.abilityId);
  const effect = ability && effectOf(ability);
  return ability && effect && isAcceptedLinkedAuxiliarySuiteAbility(ability) ? { ability, effect } : undefined;
}
function liveCandidatesForDecision(state: GameState, decision: PendingDecision, ops: LinkedAuxiliarySuiteOps): string[] {
  const meta = decision.interaction as LinkedAuxiliarySuiteInteractionMetadata;
  const suite = linkedAuxiliarySuiteState(state, meta.controllerId, meta.stateKey);
  if (!suite) return [];
  if (meta.stage === 'upkeep_remove') return activeMemberIds(state, suite);
  if (meta.stage === 'remove_other') return activeMemberIds(state, suite).filter((id) => id !== meta.sourceCardInstanceId);
  if (meta.stage === 'close_other') return ops.closableControlledCardIds(meta.controllerId, meta.controllerId).filter((id) => id !== meta.sourceCardInstanceId);
  if (meta.stage === 'play_hand') return ops.playableHandCardIds(meta.controllerId);
  if (meta.stage === 'move_location') return allEnabledLocations(state);
  return [];
}
export function isLinkedAuxiliarySuitePendingDecisionLiveValid(state: GameState, decision: PendingDecision, ops: LinkedAuxiliarySuiteOps): boolean {
  const meta = decision.interaction;
  if (!meta || meta.kind !== 'linked_auxiliary_suite_choice_v1' || meta.template !== 'target' || meta.visibility !== 'owner_only' ||
      meta.cancelPolicy !== 'forbidden' || meta.createdRevision !== runtime(state).revision ||
      meta.continuationRef !== decision.id + ':continuation' || decision.controllerId !== meta.controllerId ||
      decision.context.controllerId !== meta.controllerId || decision.context.sourceCardId !== meta.sourceCardInstanceId ||
      decision.context.abilityId !== meta.abilityId || decision.remainingEffects.length !== 0) return false;
  const found = sourceAbilityForDecision(state, decision); if (!found) return false;
  const suite = linkedAuxiliarySuiteState(state, meta.controllerId, meta.stateKey); if (!suite || !providerValid(state, suite)) return false;
  const live = liveCandidatesForDecision(state, decision, ops);
  return live.length === decision.candidates.length && live.every((id) => decision.candidates.includes(id)) &&
    decision.candidates.every((id) => live.includes(id)) &&
    meta.candidateIds.length === live.length && meta.candidateIds.every((id) => live.includes(id)) &&
    decision.min === meta.constraints.min && decision.max === meta.constraints.max;
}

export function resolveLinkedAuxiliarySuiteDecision(
  state: GameState,
  playerId: string,
  decision: PendingDecision,
  selected: readonly string[],
  ops: LinkedAuxiliarySuiteOps,
): boolean {
  if (!isLinkedAuxiliarySuitePendingDecisionLiveValid(state, decision, ops) || decision.controllerId !== playerId ||
      selected.length < decision.min || selected.length > decision.max || new Set(selected).size !== selected.length ||
      selected.some((id) => !decision.candidates.includes(id))) return false;
  const meta = decision.interaction as LinkedAuxiliarySuiteInteractionMetadata;
  const found = sourceAbilityForDecision(state, decision)!; const effect = found.effect;
  const suite = requiredSuite(state, meta.controllerId, meta.stateKey);
  delete runtime(state).pendingDecision;
  if (meta.stage === 'upkeep_remove') { ops.moveCard(selected[0]!, 'removed_from_game'); return true; }
  if (meta.stage === 'remove_other') { ops.moveCard(selected[0]!, 'removed_from_game'); ops.grantMana(meta.controllerId, Number(effect.manaGain)); return true; }
  if (meta.stage === 'close_other') {
    if (!ops.closeControlledActiveCard(meta.controllerId, selected[0]!, meta.controllerId)) return false;
    ops.moveCard(meta.sourceCardInstanceId, 'deck'); ops.shuffleDeck(meta.controllerId);
    return stage(state, decision.context, suite, 'play_hand', ops.playableHandCardIds(meta.controllerId), 'card');
  }
  if (meta.stage === 'play_hand') {
    const cardId = selected[0]!;
    if (!ops.playHandCardDuringCombat(meta.controllerId, cardId, meta.sourceCardInstanceId, meta.abilityId)) return false;
    suite.combatActionGrant = { round: state.round.roundNumber, cardInstanceId: cardId, sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId };
    const cardState = runtime(state).cardState[cardId]; if (!cardState) return false;
    cardState.actionAbilityAllowedInCombatRound = state.round.roundNumber;
    return true;
  }
  if (meta.stage === 'move_location') {
    ops.moveCard(meta.sourceCardInstanceId, 'discard');
    return ops.movePlayer(meta.controllerId, selected[0]!, meta.sourceCardInstanceId, meta.abilityId);
  }
  return false;
}

export function linkedAuxiliaryRequiresAdditionalPlay(state: GameState, cardInstanceId: string): boolean {
  const card = physical(state, cardInstanceId); if (!card) return false;
  for (const suite of Object.values(runtime(state).linkedAuxiliarySuites ?? {})) {
    if (suite.controllerId !== card.controllerPlayerId || !memberOfSuite(state, suite, cardInstanceId)) continue;
    if (markerAbility(state, suite, 'append_cost_rule')) return true;
  }
  return false;
}
export function linkedAuxiliarySameBatchReductionEligible(state: GameState, cardInstanceId: string): boolean {
  return linkedAuxiliaryRequiresAdditionalPlay(state, cardInstanceId);
}
export function linkedAuxiliaryPowerImmutable(state: GameState, cardInstanceId: string): boolean {
  const card = physical(state, cardInstanceId); if (!card) return false;
  for (const suite of Object.values(runtime(state).linkedAuxiliarySuites ?? {})) {
    if (!memberOfSuite(state, suite, cardInstanceId) || !activeMemberIds(state, suite).includes(cardInstanceId)) continue;
    const definition = runtime(state).pack.cards[card.definitionId];
    if ((definition?.abilities ?? []).some((ability) => {
      const effect = effectOf(ability); return effect?.op === 'power_immutable' && effect.stateKey === suite.stateKey && isAcceptedLinkedAuxiliarySuiteAbility(ability);
    })) return true;
  }
  return false;
}
export function linkedAuxiliaryOnPlayPowerBonus(state: GameState, cardInstanceId: string): number {
  const card = physical(state, cardInstanceId); const cardState = runtime(state).cardState[cardInstanceId];
  if (!card || card.zone !== 'attack_area' || cardState?.active !== true || cardState.faceDown === true ||
      linkedAuxiliaryPowerImmutable(state, cardInstanceId)) return 0;
  for (const suite of Object.values(runtime(state).linkedAuxiliarySuites ?? {})) {
    if (!memberOfSuite(state, suite, cardInstanceId) || suite.ascensionActive !== true || !suite.ascensionSourceCardId) continue;
    const ascension = physical(state, suite.ascensionSourceCardId);
    if (!ascension || ascension.zone !== 'attack_area' || runtime(state).cardState[ascension.instanceId]?.active !== true) continue;
    const definition = runtime(state).pack.cards[ascension.definitionId];
    const marker = (definition?.abilities ?? []).map((ability) => ({ ability, effect: effectOf(ability) }))
      .find((entry) => entry.effect?.op === 'ascension_play_power' && entry.effect.stateKey === suite.stateKey && isAcceptedLinkedAuxiliarySuiteAbility(entry.ability));
    if (marker) return Number(marker.effect!.amount);
  }
  return 0;
}
export function linkedAuxiliaryRoundPlayExceptionsActive(state: GameState, playerId: string): boolean {
  return Object.values(runtime(state).linkedAuxiliarySuites ?? {}).some((suite) =>
    suite.controllerId === playerId && suite.roundExceptionRound === state.round.roundNumber);
}
export function linkedAuxiliarySealManaSubstitution(state: GameState, playerId: string): number | undefined {
  for (const suite of Object.values(runtime(state).linkedAuxiliarySuites ?? {})) {
    if (suite.controllerId !== playerId) continue;
    const marker = markerAbility(state, suite, 'seal_mana_substitution');
    if (marker) return Number(marker.effect.manaPerSeal);
  }
  return undefined;
}

export function isLinkedAuxiliarySuiteRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const suites = Object.values(runtime(state).linkedAuxiliarySuites ?? {});
    for (const suite of suites) {
      if (!id(suite.controllerId) || !id(suite.stateKey) || !providerValid(state, suite) ||
          !uniqueIds(suite.definitionIds, 2) || suite.cardInstanceIds.length !== suite.definitionIds.length ||
          new Set(suite.cardInstanceIds).size !== suite.cardInstanceIds.length || memberIds(state, suite).length !== suite.cardInstanceIds.length ||
          !Number.isSafeInteger(suite.initializedRevision) || suite.initializedRevision < 1 || suite.initializedRevision > runtime(state).revision + 1) return false;
      const definitions = suite.cardInstanceIds.map((instanceId) => physical(state, instanceId)!.definitionId);
      if (new Set(definitions).size !== suite.definitionIds.length || !suite.definitionIds.every((definitionId) => definitions.includes(definitionId))) return false;
      if (suite.wonRound !== undefined && (!Number.isSafeInteger(suite.wonRound) || suite.wonRound > state.round.roundNumber)) return false;
      if (suite.skipUpkeepRound !== undefined && (!Number.isSafeInteger(suite.skipUpkeepRound) || suite.skipUpkeepRound > state.round.roundNumber)) return false;
      if (suite.roundExceptionRound !== undefined && suite.roundExceptionRound !== state.round.roundNumber) return false;
      if (suite.roundPowerBonus) {
        const marker = abilityAt(state, suite.roundPowerBonus.sourceCardId, suite.roundPowerBonus.abilityId);
        const effect = marker && effectOf(marker);
        if (!marker || effect?.op !== 'shuffle_round_power' || effect.stateKey !== suite.stateKey ||
            suite.roundPowerBonus.round !== state.round.roundNumber || suite.roundPowerBonus.amount !== Number(effect.amount) ||
            !(runtime(state).roundPlayerPowerAdjustments ?? []).some((entry) => entry.playerId === suite.controllerId &&
              entry.sourceCardId === suite.roundPowerBonus!.sourceCardId && entry.abilityId === suite.roundPowerBonus!.abilityId &&
              entry.round === suite.roundPowerBonus!.round && entry.amount === suite.roundPowerBonus!.amount)) return false;
      }
      if (suite.combatActionGrant) {
        const marker = abilityAt(state, suite.combatActionGrant.sourceCardId, suite.combatActionGrant.abilityId);
        const effect = marker && effectOf(marker); const granted = physical(state, suite.combatActionGrant.cardInstanceId);
        if (!marker || effect?.op !== 'shuffle_close_play' || effect.stateKey !== suite.stateKey || !granted ||
            suite.combatActionGrant.round !== state.round.roundNumber ||
            runtime(state).cardState[granted.instanceId]?.actionAbilityAllowedInCombatRound !== state.round.roundNumber) return false;
      }
      if (suite.ascensionActive) {
        const source = suite.ascensionSourceCardId ? physical(state, suite.ascensionSourceCardId) : undefined;
        const ability = source && suite.ascensionAbilityId ? abilityAt(state, source.instanceId, suite.ascensionAbilityId) : undefined;
        const effect = ability && effectOf(ability);
        if (!source || source.controllerPlayerId !== suite.controllerId || source.zone !== 'attack_area' ||
            runtime(state).cardState[source.instanceId]?.active !== true || effect?.op !== 'ascension_activate' || effect.stateKey !== suite.stateKey) return false;
      }
    }
    return true;
  } catch { return false; }
}

export function linkedAuxiliaryRoundPowerAdjustmentRestoreValid(
  state: GameState,
  entry: { playerId: string; amount: number; round: number; sourceCardId: string; abilityId: string },
): boolean {
  return Object.values(runtime(state).linkedAuxiliarySuites ?? {}).some((suite) =>
    suite.controllerId === entry.playerId && suite.roundPowerBonus?.round === entry.round &&
    suite.roundPowerBonus.amount === entry.amount && suite.roundPowerBonus.sourceCardId === entry.sourceCardId &&
    suite.roundPowerBonus.abilityId === entry.abilityId && entry.round === state.round.roundNumber);
}

export function linkedAuxiliaryCombatActionGrantRestoreValid(state: GameState, cardInstanceId: string, round: number): boolean {
  return Object.values(runtime(state).linkedAuxiliarySuites ?? {}).some((suite) =>
    suite.combatActionGrant?.cardInstanceId === cardInstanceId && suite.combatActionGrant.round === round &&
    round === state.round.roundNumber);
}
