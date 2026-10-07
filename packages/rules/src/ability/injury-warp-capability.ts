import { clearTransientCardTransformState } from './card-instance-state';
import type { GameState } from '../schema/game';
import type {
  AuthoringAbility,
  EffectContext,
  InjuryWarpRuntimeState,
  PendingDecision,
  PlayerId,
  RuleNode,
} from './types';

export const INJURY_WARP_RULESET_EFFECT = 'injury_warp_ruleset' as const;
export const INJURY_WARP_DRAW_CHOICE_EFFECT = 'injury_warp_draw_choice' as const;
export const INJURY_WARP_ACTION_DISCARD_EFFECT = 'injury_warp_action_discard' as const;
export const INJURY_WARP_BATTLE_END_PAIN_EFFECT = 'injury_warp_battle_end_pain' as const;
export const ACTIVATE_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT = 'activate_movement_topology_override' as const;
export const REPAIR_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT = 'repair_movement_topology_override' as const;
export const ASCENSION_COPY_LINKED_SKILL_EFFECT = 'ascension_copy_linked_skill' as const;

type RulesetEffect = RuleNode & {
  type: typeof INJURY_WARP_RULESET_EFFECT;
  stateKey: string;
  injuryKeys: string[];
  immediateRandomDiscardKey: string;
  recurringRandomDiscardKey: string;
  basicPowerPenaltyKey: string;
  basicPowerDelta: -1;
  forbiddenTerrainKey: string;
  forbiddenTerrainValues: [2, 3];
  sealVpLossKey: string;
  vpLossPerSeal: 1;
  movementManaLossKey: string;
  manaLossPerOwnTurnMove: 1;
  conversionKey: string;
  linkedAttackDefinitionId: string;
  painSkillCostDelta: -1;
  painDiscardPerBattleEnd: 1;
  ascensionPainRewardVp: 4;
};

type DrawEffect = RuleNode & {
  type: typeof INJURY_WARP_DRAW_CHOICE_EFFECT;
  stateKey: string;
  allowedLocationIds: string[];
  drawCount: 2;
  chooseCount: 1;
};

type ActionDiscardEffect = RuleNode & {
  type: typeof INJURY_WARP_ACTION_DISCARD_EFFECT;
  stateKey: string;
};

type BattleEndPainEffect = RuleNode & {
  type: typeof INJURY_WARP_BATTLE_END_PAIN_EFFECT;
  stateKey: string;
};

type RepairTopologyEffect = RuleNode & {
  type: typeof REPAIR_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT;
  stateKey: string;
};

type ActivateTopologyEffect = RuleNode & {
  type: typeof ACTIVATE_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT;
  stateKey: string;
  linkedOverrideDefinitionId: string;
  replacements: Array<{ from: string; to: string }>;
};

type AscensionCopyEffect = RuleNode & {
  type: typeof ASCENSION_COPY_LINKED_SKILL_EFFECT;
  stateKey: string;
  linkedDefinitionId: string;
  maxCopies: 2;
  destination: 'skill';
};

const PRESENT_ZONES = new Set(['skill', 'field', 'attack_area']);

function rec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exact(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function key(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
function uniqueStrings(value: unknown, length?: number): value is string[] {
  return Array.isArray(value) && (length === undefined || value.length === length) &&
    value.every(key) && new Set(value).size === value.length;
}
function standard(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    Object.keys(ability.lifecycle).length === 0 && Object.keys(ability.limit).length === 0 &&
    Object.keys(ability.visibility).length === 0 &&
    ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}
function responseOk(ability: AuthoringAbility): boolean {
  const keys = Object.keys(ability.responseWindow);
  return keys.length === 0 || (keys.every((item) => item === 'order' || item === 'passBehavior') &&
    ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window');
}
function single(ability: AuthoringAbility): RuleNode | undefined {
  return ability.effects.length === 1 ? ability.effects[0] : undefined;
}

export function isInjuryWarpRulesetEffect(value: RuleNode): value is RulesetEffect {
  const injuries = value.injuryKeys;
  return value.type === INJURY_WARP_RULESET_EFFECT &&
    key(value.stateKey) && uniqueStrings(injuries, 6) &&
    key(value.immediateRandomDiscardKey) && injuries.includes(value.immediateRandomDiscardKey) &&
    key(value.recurringRandomDiscardKey) && value.recurringRandomDiscardKey === value.immediateRandomDiscardKey &&
    key(value.basicPowerPenaltyKey) && injuries.includes(value.basicPowerPenaltyKey) && value.basicPowerDelta === -1 &&
    key(value.forbiddenTerrainKey) && injuries.includes(value.forbiddenTerrainKey) &&
    Array.isArray(value.forbiddenTerrainValues) && value.forbiddenTerrainValues.length === 2 &&
    value.forbiddenTerrainValues[0] === 2 && value.forbiddenTerrainValues[1] === 3 &&
    key(value.sealVpLossKey) && injuries.includes(value.sealVpLossKey) && value.vpLossPerSeal === 1 &&
    key(value.movementManaLossKey) && injuries.includes(value.movementManaLossKey) && value.manaLossPerOwnTurnMove === 1 &&
    key(value.conversionKey) && injuries.includes(value.conversionKey) &&
    key(value.linkedAttackDefinitionId) && value.painSkillCostDelta === -1 &&
    value.painDiscardPerBattleEnd === 1 && value.ascensionPainRewardVp === 4 &&
    exact(value, [
      'type','stateKey','injuryKeys','immediateRandomDiscardKey','recurringRandomDiscardKey',
      'basicPowerPenaltyKey','basicPowerDelta','forbiddenTerrainKey','forbiddenTerrainValues',
      'sealVpLossKey','vpLossPerSeal','movementManaLossKey','manaLossPerOwnTurnMove',
      'conversionKey','linkedAttackDefinitionId','painSkillCostDelta','painDiscardPerBattleEnd',
      'ascensionPainRewardVp',
    ]);
}
export function isInjuryWarpDrawChoiceEffect(value: RuleNode): value is DrawEffect {
  return value.type === INJURY_WARP_DRAW_CHOICE_EFFECT && key(value.stateKey) &&
    uniqueStrings(value.allowedLocationIds, 2) && value.drawCount === 2 && value.chooseCount === 1 &&
    exact(value, ['type','stateKey','allowedLocationIds','drawCount','chooseCount']);
}
export function isInjuryWarpActionDiscardEffect(value: RuleNode): value is ActionDiscardEffect {
  return value.type === INJURY_WARP_ACTION_DISCARD_EFFECT && key(value.stateKey) && exact(value, ['type','stateKey']);
}
export function isInjuryWarpBattleEndPainEffect(value: RuleNode): value is BattleEndPainEffect {
  return value.type === INJURY_WARP_BATTLE_END_PAIN_EFFECT && key(value.stateKey) && exact(value, ['type','stateKey']);
}
export function isActivateMovementTopologyOverrideEffect(value: RuleNode): value is ActivateTopologyEffect {
  if (value.type !== ACTIVATE_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT || !key(value.stateKey) ||
      !key(value.linkedOverrideDefinitionId) || !Array.isArray(value.replacements) || value.replacements.length !== 3 ||
      !exact(value, ['type','stateKey','linkedOverrideDefinitionId','replacements'])) return false;
  const pairs = value.replacements;
  return pairs.every((entry) => rec(entry) && key(entry.from) && key(entry.to) && entry.from !== entry.to &&
      exact(entry, ['from','to'])) &&
    new Set(pairs.map((entry) => entry.from)).size === pairs.length;
}
export function isRepairMovementTopologyOverrideEffect(value: RuleNode): value is RepairTopologyEffect {
  return value.type === REPAIR_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT && key(value.stateKey) &&
    exact(value, ['type','stateKey']);
}
export function isAscensionCopyLinkedSkillEffect(value: RuleNode): value is AscensionCopyEffect {
  return value.type === ASCENSION_COPY_LINKED_SKILL_EFFECT && key(value.stateKey) && key(value.linkedDefinitionId) &&
    value.maxCopies === 2 && value.destination === 'skill' &&
    exact(value, ['type','stateKey','linkedDefinitionId','maxCopies','destination']);
}

export function isAcceptedInjuryWarpAbility(ability: AuthoringAbility): boolean {
  if (!standard(ability) || !responseOk(ability)) return false;
  const effect = single(ability);
  if (!effect) return false;
  if (isInjuryWarpRulesetEffect(effect)) {
    return ability.kind === 'passive' && ability.activation.trigger === 'while_active' &&
      exact(ability.activation as unknown as Record<string, unknown>, ['trigger']);
  }
  if (isInjuryWarpDrawChoiceEffect(effect)) {
    return ability.kind === 'forced_trigger' && ability.activation.trigger === 'controller_combat_action_window' &&
      exact(ability.activation as unknown as Record<string, unknown>, ['trigger']);
  }
  if (isInjuryWarpActionDiscardEffect(effect)) {
    return ability.kind === 'forced_trigger' && ability.activation.trigger === 'controller_action_window' &&
      exact(ability.activation as unknown as Record<string, unknown>, ['trigger']);
  }
  if (isInjuryWarpBattleEndPainEffect(effect)) {
    return ability.kind === 'forced_trigger' && ability.activation.trigger === 'after_battle_ended' &&
      exact(ability.activation as unknown as Record<string, unknown>, ['trigger']);
  }
  if (isActivateMovementTopologyOverrideEffect(effect) || isRepairMovementTopologyOverrideEffect(effect)) {
    return ability.kind === 'phase_action' && ability.activation.phase === 'action' &&
      ability.activation.opens === 'controller_action_window' && ability.activation.requiresSourceState === 'active' &&
      exact(ability.activation as unknown as Record<string, unknown>, ['phase','opens','requiresSourceState']);
  }
  if (isAscensionCopyLinkedSkillEffect(effect)) {
    return ability.kind === 'forced_trigger' && ability.activation.trigger === 'after_master_ascension_unlocked' &&
      exact(ability.activation as unknown as Record<string, unknown>, ['trigger']);
  }
  return false;
}

export function containsInjuryWarpPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsInjuryWarpPrivilegedNode);
  if (!rec(value)) return false;
  if ([
    INJURY_WARP_RULESET_EFFECT, INJURY_WARP_DRAW_CHOICE_EFFECT, INJURY_WARP_ACTION_DISCARD_EFFECT,
    INJURY_WARP_BATTLE_END_PAIN_EFFECT, ACTIVATE_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT,
    REPAIR_MOVEMENT_TOPOLOGY_OVERRIDE_EFFECT, ASCENSION_COPY_LINKED_SKILL_EFFECT,
  ].includes(String(value.type) as any)) return true;
  return Object.values(value).some(containsInjuryWarpPrivilegedNode);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('INJURY_WARP_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function stateId(controllerId: PlayerId, stateKey: string): string {
  return controllerId + ':' + stateKey;
}
function sourceAbilities(state: GameState, controllerId: PlayerId, predicate: (ability: AuthoringAbility) => boolean) {
  const r = runtime(state);
  return state.cards.flatMap((card) => {
    if (card.ownerPlayerId !== controllerId || card.controllerPlayerId !== controllerId || !PRESENT_ZONES.has(card.zone)) return [];
    const definition = r.pack.cards[card.definitionId];
    return (definition?.abilities ?? []).filter(predicate).map((ability) => ({ sourceCardId: card.instanceId, ability }));
  });
}
function rulesetProvider(state: GameState, controllerId: PlayerId, stateKey: string) {
  const matches = sourceAbilities(state, controllerId, (ability) => {
    const effect = single(ability);
    return isAcceptedInjuryWarpAbility(ability) && !!effect && isInjuryWarpRulesetEffect(effect) && effect.stateKey === stateKey;
  });
  return matches.length === 1 ? matches[0] : undefined;
}
function ruleset(state: GameState, controllerId: PlayerId, stateKey: string): RulesetEffect | undefined {
  const provider = rulesetProvider(state, controllerId, stateKey);
  const effect = provider && single(provider.ability);
  return effect && isInjuryWarpRulesetEffect(effect) ? effect : undefined;
}
function ensureState(state: GameState, controllerId: PlayerId, stateKey: string): InjuryWarpRuntimeState {
  const provider = rulesetProvider(state, controllerId, stateKey);
  const effect = ruleset(state, controllerId, stateKey);
  if (!provider || !effect) throw new Error('INJURY_WARP_PROVIDER_INVALID');
  const r = runtime(state);
  const store = r.injuryWarpStates ??= {};
  const id = stateId(controllerId, stateKey);
  const existing = store[id];
  if (existing) return existing;
  return store[id] = {
    controllerId, stateKey, providerSourceCardId: provider.sourceCardId, providerAbilityId: provider.ability.id,
    deck: [...effect.injuryKeys], activeInjuries: [], painCount: 0,
    spinalOccurred: false, ascensionUnlocked: false, rewardGranted: false,
  };
}
function nextRandomIndex(state: GameState, length: number): number {
  if (!Number.isSafeInteger(length) || length <= 0) throw new Error('INJURY_WARP_RANDOM_RANGE_INVALID');
  const r = runtime(state);
  let x = r.randomState >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  r.randomState = x >>> 0;
  return Math.floor((r.randomState / 0x100000000) * length);
}
function randomDiscardOne(state: GameState, controllerId: PlayerId, sourceCardId: string, abilityId: string): string | undefined {
  const candidates = state.cards.filter((card) =>
    card.ownerPlayerId === controllerId && card.controllerPlayerId === controllerId && card.zone === 'hand');
  if (!candidates.length) return undefined;
  const physical = candidates[nextRandomIndex(state, candidates.length)]!;
  physical.zone = 'discard';
  physical.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
  const cardState = runtime(state).cardState[physical.instanceId];
  if (cardState) { cardState.active = false; cardState.faceDown = false; delete cardState.paidManaOnPlay; }
  clearTransientCardTransformState(state, physical.instanceId);
  runtime(state).events.push({ type: 'injury_random_discard', playerId: controllerId, cardInstanceId: physical.instanceId, sourceCardId, abilityId } as any);
  return physical.instanceId;
}
function physicalByDefinition(state: GameState, controllerId: PlayerId, definitionId: string) {
  return state.cards.filter((card) => card.ownerPlayerId === controllerId && card.controllerPlayerId === controllerId &&
    card.definitionId === definitionId && card.zone !== 'removed');
}
function addLinkedAttackToCombat(state: GameState, controllerId: PlayerId, definitionId: string): string {
  const cards = physicalByDefinition(state, controllerId, definitionId);
  const preferred = ['skill','hand','discard','attack_area'];
  const physical = [...cards].sort((left, right) =>
    preferred.indexOf(left.zone) - preferred.indexOf(right.zone) || left.instanceId.localeCompare(right.instanceId))[0];
  if (!physical) throw new Error('INJURY_WARP_LINKED_ATTACK_MISSING');
  physical.zone = 'attack_area';
  physical.visibility = { scope: 'public' };
  const cardState = runtime(state).cardState[physical.instanceId] ??= { active: true, faceDown: false, playedRound: state.round.roundNumber };
  cardState.active = true; cardState.faceDown = false; cardState.playedRound = state.round.roundNumber; cardState.paidManaOnPlay = 0;
  return physical.instanceId;
}
function applyInjury(state: GameState, controllerId: PlayerId, stateKey: string, injuryKey: string, sourceCardId: string, abilityId: string): boolean {
  const effect = ruleset(state, controllerId, stateKey);
  const iw = ensureState(state, controllerId, stateKey);
  if (!effect || !iw.deck.includes(injuryKey)) return false;
  iw.deck = iw.deck.filter((item) => item !== injuryKey);
  iw.activeInjuries = [...new Set([...iw.activeInjuries, injuryKey])];
  if (injuryKey === effect.immediateRandomDiscardKey) randomDiscardOne(state, controllerId, sourceCardId, abilityId);
  if (injuryKey === effect.conversionKey) {
    const pain = iw.activeInjuries.length;
    const linkedCardInstanceId = addLinkedAttackToCombat(state, controllerId, effect.linkedAttackDefinitionId);
    iw.deck = [];
    iw.painCount = pain;
    iw.spinalOccurred = true;
    iw.activeInjuries = [];
    runtime(state).events.push({ type: 'injury_converted_to_pain', playerId: controllerId, stateKey, painCount: pain, linkedCardInstanceId } as any);
  } else {
    runtime(state).events.push({ type: 'injury_applied', playerId: controllerId, stateKey, injuryKey } as any);
  }
  return true;
}

function stageChoice(state: GameState, ctx: EffectContext, ability: AuthoringAbility, effect: DrawEffect): boolean {
  const player = state.players.find((candidate) => candidate.id === ctx.controllerId);
  if (!player || state.round.prioritySeat !== player.seat || !player.locationId || !effect.allowedLocationIds.includes(player.locationId)) return false;
  const r = runtime(state);
  const iw = ensureState(state, ctx.controllerId, effect.stateKey);
  if (!iw.deck.length) return false;
  if (iw.deck.length === 1) return applyInjury(state, ctx.controllerId, effect.stateKey, iw.deck[0]!, ctx.sourceCardId, ability.id);
  if (r.pendingDecision) throw new Error('INJURY_WARP_PENDING_DECISION_CONFLICT');
  const firstIndex = nextRandomIndex(state, iw.deck.length);
  const first = iw.deck[firstIndex]!;
  const remaining = iw.deck.filter((_, index) => index !== firstIndex);
  const second = remaining[nextRandomIndex(state, remaining.length)]!;
  const candidates = [first, second];
  const id = 'injury-warp:' + (++r.sequence);
  r.pendingDecision = {
    id, controllerId: ctx.controllerId,
    target: { id: 'injury_choice', type: 'choice', options: candidates.map((value) => ({ id: value })), count: { min: 1, max: 1 } },
    candidates: [...candidates], min: 1, max: 1, context: structuredClone(ctx), remainingEffects: [],
    interaction: {
      kind: 'injury_warp_choice_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ability.id, createdRevision: r.revision + 1,
      continuationRef: id + ':continuation', controllerId: ctx.controllerId, stateKey: effect.stateKey,
      candidateInjuryKeys: [...candidates],
      constraints: { kind: 'target', targetKind: 'choice', min: 1, max: 1, distinct: true },
    },
  };
  return true;
}

export function isInjuryWarpPendingDecisionLiveValid(state: GameState, decision: PendingDecision): boolean {
  try {
    const meta = decision.interaction;
    if (meta?.kind !== 'injury_warp_choice_v1') return false;
    const r = runtime(state);
    const source = state.cards.find((card) => card.instanceId === meta.sourceCardInstanceId &&
      card.ownerPlayerId === meta.controllerId && card.controllerPlayerId === meta.controllerId && PRESENT_ZONES.has(card.zone));
    const ability = source ? r.pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === meta.abilityId) : undefined;
    const effect = ability && single(ability);
    const iw = r.injuryWarpStates?.[stateId(meta.controllerId, meta.stateKey)];
    const target = decision.target as Record<string, unknown>;
    const count = rec(target.count) ? target.count : undefined;
    const options = Array.isArray(target.options) ? target.options : [];
    return !!source && !!ability && isAcceptedInjuryWarpAbility(ability) && !!effect && isInjuryWarpDrawChoiceEffect(effect) &&
      effect.stateKey === meta.stateKey && !!rulesetProvider(state, meta.controllerId, meta.stateKey) && !!iw &&
      meta.createdRevision === r.revision && meta.continuationRef === decision.id + ':continuation' &&
      decision.controllerId === meta.controllerId && decision.context.controllerId === meta.controllerId &&
      decision.context.sourceCardId === meta.sourceCardInstanceId && decision.context.abilityId === meta.abilityId &&
      decision.remainingEffects.length === 0 && decision.min === 1 && decision.max === 1 &&
      target.id === 'injury_choice' && target.type === 'choice' && count?.min === 1 && count?.max === 1 &&
      meta.constraints.kind === 'target' && meta.constraints.targetKind === 'choice' && meta.constraints.min === 1 &&
      meta.constraints.max === 1 && meta.constraints.distinct === true &&
      uniqueStrings(meta.candidateInjuryKeys, 2) && meta.candidateInjuryKeys.every((item) => iw.deck.includes(item)) &&
      decision.candidates.length === 2 && decision.candidates.every((item, index) => item === meta.candidateInjuryKeys[index]) &&
      options.length === 2 && options.every((option, index) => rec(option) && option.id === meta.candidateInjuryKeys[index]);
  } catch { return false; }
}

export function resolveInjuryWarpDecision(state: GameState, decision: PendingDecision, selectedIds: string[]): boolean {
  if (!isInjuryWarpPendingDecisionLiveValid(state, decision) || selectedIds.length !== 1 ||
      !decision.candidates.includes(selectedIds[0]!)) return false;
  const meta = decision.interaction!;
  if (meta.kind !== 'injury_warp_choice_v1') return false;
  delete runtime(state).pendingDecision;
  return applyInjury(state, meta.controllerId, meta.stateKey, selectedIds[0]!, meta.sourceCardInstanceId, meta.abilityId);
}

function sourceActive(state: GameState, sourceCardId: string): boolean {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const cardState = source ? runtime(state).cardState[sourceCardId] : undefined;
  return !!source && source.zone === 'attack_area' && cardState?.active === true && cardState.faceDown !== true;
}

function activateTopology(state: GameState, ctx: EffectContext, ability: AuthoringAbility, effect: ActivateTopologyEffect): boolean {
  if (!sourceActive(state, ctx.sourceCardId)) return false;
  const rule = ruleset(state, ctx.controllerId, effect.stateKey);
  if (!rule || rule.linkedAttackDefinitionId !== state.cards.find((card) => card.instanceId === ctx.sourceCardId)?.definitionId) return false;
  const linked = physicalByDefinition(state, ctx.controllerId, effect.linkedOverrideDefinitionId)
    .find((card) => !['discard','removed'].includes(card.zone));
  if (!linked) return false;
  const r = runtime(state);
  for (const pair of effect.replacements) {
    if (!state.map.locations.some((location) => location.id === pair.from) || !state.map.locations.some((location) => location.id === pair.to)) return false;
  }
  const cardState = r.cardState[linked.instanceId] ??= { active: false, faceDown: false, playedRound: state.round.roundNumber };
  cardState.active = true; cardState.faceDown = false;
  const iw = ensureState(state, ctx.controllerId, effect.stateKey);
  iw.movementOverride = {
    sourceCardId: ctx.sourceCardId, abilityId: ability.id, linkedCardInstanceId: linked.instanceId,
    replacements: Object.fromEntries(effect.replacements.map((pair) => [pair.from, pair.to])),
  };
  return true;
}
function repairTopology(state: GameState, ctx: EffectContext, effect: RuleNode): boolean {
  if (!isRepairMovementTopologyOverrideEffect(effect)) return false;
  const iw = runtime(state).injuryWarpStates?.[stateId(ctx.controllerId, effect.stateKey)];
  if (!iw?.movementOverride) return false;
  const linked = state.cards.find((card) => card.instanceId === iw.movementOverride!.linkedCardInstanceId);
  if (!linked || linked.instanceId !== ctx.sourceCardId) return false;
  const cardState = runtime(state).cardState[linked.instanceId];
  if (!cardState?.active) return false;
  cardState.active = false;
  delete iw.movementOverride;
  return true;
}
function ascensionCopy(state: GameState, ctx: EffectContext, effect: AscensionCopyEffect): boolean {
  const iw = ensureState(state, ctx.controllerId, effect.stateKey);
  const definition = runtime(state).pack.cards[effect.linkedDefinitionId];
  if (!definition || definition.cardType !== 'master_skill') return false;
  iw.ascensionUnlocked = true;
  const existing = physicalByDefinition(state, ctx.controllerId, effect.linkedDefinitionId);
  if (existing.length >= effect.maxCopies) return true;
  const r = runtime(state);
  let suffix = 1;
  let instanceId = ctx.controllerId + ':injury-warp-copy:' + effect.stateKey + ':' + suffix;
  while (state.cards.some((card) => card.instanceId === instanceId)) instanceId = ctx.controllerId + ':injury-warp-copy:' + effect.stateKey + ':' + (++suffix);
  state.cards.push({
    instanceId, definitionId: effect.linkedDefinitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId,
    zone: effect.destination, visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId }, generatedBy: ctx.sourceCardId,
  });
  r.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return true;
}

export function canExecuteInjuryWarpEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedInjuryWarpAbility(ability)) return false;
  const effect = single(ability)!;
  if (isInjuryWarpRulesetEffect(effect)) return true;
  if (isInjuryWarpDrawChoiceEffect(effect)) {
    const player = state.players.find((candidate) => candidate.id === ctx.controllerId);
    const iw = state.abilityRuntime?.injuryWarpStates?.[stateId(ctx.controllerId, effect.stateKey)];
    return ctx.event?.type === 'controller_combat_action_window' && !!player &&
      state.round.prioritySeat === player.seat && !!player.locationId && effect.allowedLocationIds.includes(player.locationId) &&
      (iw?.deck.length ?? effect.drawCount) > 0 && !!rulesetProvider(state, ctx.controllerId, effect.stateKey);
  }
  if (isInjuryWarpActionDiscardEffect(effect)) {
    const rule = ruleset(state, ctx.controllerId, effect.stateKey);
    const iw = state.abilityRuntime?.injuryWarpStates?.[stateId(ctx.controllerId, effect.stateKey)];
    return ctx.event?.type === 'controller_action_window' && !!rule && !!iw && iw.activeInjuries.includes(rule.recurringRandomDiscardKey);
  }
  if (isInjuryWarpBattleEndPainEffect(effect)) {
    const iw = state.abilityRuntime?.injuryWarpStates?.[stateId(ctx.controllerId, effect.stateKey)];
    return ctx.event?.type === 'after_battle_ended' && !!iw && iw.painCount > 0;
  }
  if (isActivateMovementTopologyOverrideEffect(effect)) return state.round.activePhase === 'action' && sourceActive(state, ctx.sourceCardId);
  if (isRepairMovementTopologyOverrideEffect(effect)) {
    const iw = state.abilityRuntime?.injuryWarpStates?.[stateId(ctx.controllerId, effect.stateKey)];
    return state.round.activePhase === 'action' && !!iw?.movementOverride &&
      iw.movementOverride.linkedCardInstanceId === ctx.sourceCardId && runtime(state).cardState[ctx.sourceCardId]?.active === true;
  }
  if (isAscensionCopyLinkedSkillEffect(effect)) return ctx.event?.type === 'after_master_ascension_unlocked' &&
    ctx.event.playerId === ctx.controllerId && !!rulesetProvider(state, ctx.controllerId, effect.stateKey);
  return false;
}

export function resolveInjuryWarpEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedInjuryWarpAbility(ability)) return false;
  const effect = single(ability)!;
  if (isInjuryWarpRulesetEffect(effect)) { ensureState(state, ctx.controllerId, effect.stateKey); return true; }
  if (isInjuryWarpDrawChoiceEffect(effect)) return stageChoice(state, ctx, ability, effect);
  if (isInjuryWarpActionDiscardEffect(effect)) {
    const rule = ruleset(state, ctx.controllerId, effect.stateKey);
    const iw = state.abilityRuntime?.injuryWarpStates?.[stateId(ctx.controllerId, effect.stateKey)];
    if (!rule || !iw?.activeInjuries.includes(rule.recurringRandomDiscardKey)) return false;
    randomDiscardOne(state, ctx.controllerId, ctx.sourceCardId, ability.id);
    return true;
  }
  if (isInjuryWarpBattleEndPainEffect(effect)) {
    const rule = ruleset(state, ctx.controllerId, effect.stateKey);
    const iw = state.abilityRuntime?.injuryWarpStates?.[stateId(ctx.controllerId, effect.stateKey)];
    if (!rule || !iw || iw.painCount <= 0) return false;
    iw.painCount -= rule.painDiscardPerBattleEnd;
    if (iw.painCount === 0 && iw.spinalOccurred && iw.ascensionUnlocked && !iw.rewardGranted) {
      const player = state.players.find((candidate) => candidate.id === ctx.controllerId);
      if (!player) return false;
      player.vp += rule.ascensionPainRewardVp;
      iw.rewardGranted = true;
      runtime(state).events.push({ type: 'injury_pain_reward', playerId: ctx.controllerId, amount: rule.ascensionPainRewardVp } as any);
    }
    return true;
  }
  if (isActivateMovementTopologyOverrideEffect(effect)) return activateTopology(state, ctx, ability, effect);
  if (isRepairMovementTopologyOverrideEffect(effect)) return repairTopology(state, ctx, effect);
  if (isAscensionCopyLinkedSkillEffect(effect)) return ascensionCopy(state, ctx, effect);
  return false;
}

export function injuryWarpCardPowerAdjustment(state: GameState, cardInstanceId: string): number {
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = physical && state.abilityRuntime?.pack.cards[physical.definitionId];
  if (!physical || !definition || definition.cardType !== 'basic_attack') return 0;
  let total = 0;
  for (const iw of Object.values(state.abilityRuntime?.injuryWarpStates ?? {})) {
    if (iw.controllerId !== physical.controllerPlayerId) continue;
    const rule = ruleset(state, iw.controllerId, iw.stateKey);
    if (rule && iw.activeInjuries.includes(rule.basicPowerPenaltyKey)) total += rule.basicPowerDelta;
  }
  return total;
}
export function injuryWarpCardCostAdjustment(state: GameState, cardInstanceId: string): number {
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = physical && state.abilityRuntime?.pack.cards[physical.definitionId];
  if (!physical || !definition || !['master_skill','servant_skill'].includes(definition.cardType)) return 0;
  let total = 0;
  for (const iw of Object.values(state.abilityRuntime?.injuryWarpStates ?? {})) {
    if (iw.controllerId !== physical.controllerPlayerId || iw.painCount <= 0) continue;
    const rule = ruleset(state, iw.controllerId, iw.stateKey);
    if (rule) total += rule.painSkillCostDelta;
  }
  return total;
}
export function injuryWarpForbiddenDeploymentTerrainValues(state: GameState, playerId: PlayerId): number[] {
  const values = new Set<number>();
  for (const iw of Object.values(state.abilityRuntime?.injuryWarpStates ?? {})) {
    if (iw.controllerId !== playerId) continue;
    const rule = ruleset(state, playerId, iw.stateKey);
    if (rule && iw.activeInjuries.includes(rule.forbiddenTerrainKey)) rule.forbiddenTerrainValues.forEach((value) => values.add(value));
  }
  return [...values];
}
export function effectiveInjuryWarpMovementLinks<T extends string>(
  state: GameState,
  fromLocationId: string,
  baseLinks: readonly T[],
): T[] {
  const replacements = new Set<T>();
  for (const iw of Object.values(state.abilityRuntime?.injuryWarpStates ?? {})) {
    const override = iw.movementOverride;
    if (!override) continue;
    const source = state.cards.find((card) => card.instanceId === override.linkedCardInstanceId);
    const sourceState = source && state.abilityRuntime?.cardState[source.instanceId];
    const provider = rulesetProvider(state, iw.controllerId, iw.stateKey);
    if (!source || !sourceState?.active || sourceState.faceDown || !provider) continue;
    const replacement = override.replacements[fromLocationId];
    if (replacement) replacements.add(replacement as T);
  }
  if (!replacements.size) return [...baseLinks];
  if (replacements.size !== 1) throw new Error('INJURY_WARP_TOPOLOGY_CONFLICT');
  return [...replacements];
}
export function settleInjuryWarpMovementPenalty(state: GameState, playerId: PlayerId): number {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.seat !== state.round.prioritySeat) return 0;
  let loss = 0;
  for (const iw of Object.values(state.abilityRuntime?.injuryWarpStates ?? {})) {
    if (iw.controllerId !== playerId) continue;
    const rule = ruleset(state, playerId, iw.stateKey);
    if (rule && iw.activeInjuries.includes(rule.movementManaLossKey)) loss += rule.manaLossPerOwnTurnMove;
  }
  if (!loss) return 0;
  const before = player.mana;
  player.mana = Math.max(0, player.mana - loss);
  const applied = before - player.mana;
  if (applied) runtime(state).events.push({ type: 'injury_movement_mana_loss', playerId, amount: applied, before, after: player.mana } as any);
  return applied;
}
export function settleInjuryWarpCommandSealSpend(state: GameState, playerId: PlayerId, before: number, after: number): number {
  if (!state.abilityRuntime || !Number.isSafeInteger(before) || !Number.isSafeInteger(after) || after >= before || after < 0) return 0;
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return 0;
  let perSeal = 0;
  for (const iw of Object.values(state.abilityRuntime.injuryWarpStates ?? {})) {
    if (iw.controllerId !== playerId) continue;
    const rule = ruleset(state, playerId, iw.stateKey);
    if (rule && iw.activeInjuries.includes(rule.sealVpLossKey)) perSeal += rule.vpLossPerSeal;
  }
  const loss = (before - after) * perSeal;
  if (!loss) return 0;
  const previousVp = player.vp;
  player.vp = Math.max(0, player.vp - loss);
  const applied = previousVp - player.vp;
  if (applied) runtime(state).events.push({ type: 'injury_command_seal_vp_loss', playerId, amount: applied, before: previousVp, after: player.vp } as any);
  return applied;
}

export function isInjuryWarpRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const r = runtime(state);
    for (const [id, iw] of Object.entries(r.injuryWarpStates ?? {})) {
      const rule = ruleset(state, iw.controllerId, iw.stateKey);
      const provider = rulesetProvider(state, iw.controllerId, iw.stateKey);
      if (!rule || !provider || id !== stateId(iw.controllerId, iw.stateKey) ||
          iw.providerSourceCardId !== provider.sourceCardId || iw.providerAbilityId !== provider.ability.id ||
          !Number.isSafeInteger(iw.painCount) || iw.painCount < 0 ||
          new Set(iw.deck).size !== iw.deck.length || new Set(iw.activeInjuries).size !== iw.activeInjuries.length ||
          iw.deck.some((item) => !rule.injuryKeys.includes(item)) || iw.activeInjuries.some((item) => !rule.injuryKeys.includes(item)) ||
          iw.deck.some((item) => iw.activeInjuries.includes(item)) ||
          typeof iw.spinalOccurred !== 'boolean' || typeof iw.ascensionUnlocked !== 'boolean' || typeof iw.rewardGranted !== 'boolean') return false;
      if (iw.spinalOccurred && (iw.deck.length !== 0 || iw.activeInjuries.length !== 0)) return false;
      if (!iw.spinalOccurred && new Set([...iw.deck, ...iw.activeInjuries]).size !== rule.injuryKeys.length) return false;
      if (!iw.spinalOccurred && iw.painCount !== 0) return false;
      if (iw.rewardGranted && (!iw.ascensionUnlocked || !iw.spinalOccurred || iw.painCount !== 0)) return false;
      if (iw.movementOverride) {
        const override = iw.movementOverride;
        const source = state.cards.find((card) => card.instanceId === override.sourceCardId && card.controllerPlayerId === iw.controllerId);
        const ability = source && r.pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === override.abilityId);
        const effect = ability && single(ability);
        const linked = state.cards.find((card) => card.instanceId === override.linkedCardInstanceId &&
          card.ownerPlayerId === iw.controllerId && card.controllerPlayerId === iw.controllerId);
        const linkedState = linked && r.cardState[linked.instanceId];
        if (!source || !ability || !effect || !isAcceptedInjuryWarpAbility(ability) || !isActivateMovementTopologyOverrideEffect(effect) ||
            effect.stateKey !== iw.stateKey || !linked || linked.definitionId !== effect.linkedOverrideDefinitionId ||
            !linkedState?.active || linkedState.faceDown || Object.keys(override.replacements).length !== effect.replacements.length ||
            effect.replacements.some((pair) => override.replacements[pair.from] !== pair.to)) return false;
      }
    }
    if (r.pendingDecision?.interaction?.kind === 'injury_warp_choice_v1' && !isInjuryWarpPendingDecisionLiveValid(state, r.pendingDecision)) return false;
    return true;
  } catch { return false; }
}
