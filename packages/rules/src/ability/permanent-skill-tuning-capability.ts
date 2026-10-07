import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, RuleNode } from './types';
import { settleInjuryWarpCommandSealSpend } from './injury-warp-capability';

export const PERMANENT_RETURNED_SKILL_TUNING_EFFECT = 'permanent_returned_skill_tuning' as const;
export const COMMAND_SEAL_SPENT_THIS_ROUND_CONDITION = 'controller_spent_command_seal_this_round' as const;
export const RETURNED_SKILL_THIS_ROUND_CONSTRAINT = 'returned_to_skill_this_round' as const;
export const PERMANENT_SKILL_TUNING_PROVENANCE = 'permanent_skill_tuning_v1' as const;

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('PERMANENT_SKILL_TUNING_RUNTIME_MISSING');
  return state.abilityRuntime;
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
export function isControllerSpentCommandSealThisRoundCondition(value: RuleNode): boolean {
  return value.type === COMMAND_SEAL_SPENT_THIS_ROUND_CONDITION && exactKeys(value, ['type']);
}
export function isReturnedSkillThisRoundConstraint(value: RuleNode): boolean {
  return value.type === RETURNED_SKILL_THIS_ROUND_CONSTRAINT && exactKeys(value, ['type']);
}
export function isPermanentReturnedSkillTuningEffect(value: RuleNode): boolean {
  return value.type === PERMANENT_RETURNED_SKILL_TUNING_EFFECT &&
    value.target === 'returned_skill' && value.powerDelta === 1 && value.costDelta === -1 &&
    value.minPrintedFraction === 0.5 &&
    exactKeys(value, ['type', 'target', 'powerDelta', 'costDelta', 'minPrintedFraction']);
}
function emptyObject(value: unknown): boolean {
  return record(value) && Object.keys(value).length === 0;
}
function standardResponse(value: unknown): boolean {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return keys.every((key) => ['order', 'passBehavior'].includes(key)) &&
    (value.order === undefined || value.order === 'turn_order') &&
    (value.passBehavior === undefined || value.passBehavior === 'decline_this_window');
}
function automaticNoOps(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}
export function isAcceptedPermanentReturnedSkillTuningAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'forced_trigger' ||
      ability.activation.trigger !== 'round_end' ||
      !exactKeys(ability.activation as unknown as Record<string, unknown>, ['trigger'])) return false;
  if (ability.conditions.length !== 1 || !isControllerSpentCommandSealThisRoundCondition(ability.conditions[0]!)) return false;
  if (ability.targets.length !== 1) return false;
  const target = ability.targets[0]!;
  const scope = target.scope as Record<string, unknown> | undefined;
  const count = target.count as Record<string, unknown> | undefined;
  if (target.id !== 'returned_skill' || target.type !== 'card_instance' ||
      !record(scope) || scope.zone !== 'skill' || scope.owner !== 'controller' || scope.controller !== 'self' ||
      !exactKeys(scope, ['zone', 'owner', 'controller']) ||
      !record(count) || count.min !== 1 || count.max !== 1 || !exactKeys(count, ['min', 'max']) ||
      !Array.isArray(target.constraints) || target.constraints.length !== 1 ||
      !isReturnedSkillThisRoundConstraint(target.constraints[0]!)) return false;
  if (ability.effects.length !== 1 || !isPermanentReturnedSkillTuningEffect(ability.effects[0]!)) return false;
  if (ability.cost.length || ability.ruleModifiers.length || ability.creates.length) return false;
  if (!emptyObject(ability.lifecycle) || !standardResponse(ability.responseWindow) || !emptyObject(ability.visibility)) return false;
  if (!record(ability.limit) || ability.limit.type !== 'per_round' || ability.limit.uses !== 1 || ability.limit.scope !== 'this_card' ||
      !exactKeys(ability.limit as Record<string, unknown>, ['type', 'uses', 'scope'])) return false;
  return automaticNoOps(ability);
}
const packHasPermanentReturnedSkillTuning = new WeakMap<object, boolean>();
export function runtimePackHasPermanentReturnedSkillTuning(state: GameState): boolean {
  const pack = state.abilityRuntime?.pack;
  if (!pack) return false;
  const key = pack as object;
  const cached = packHasPermanentReturnedSkillTuning.get(key);
  if (cached !== undefined) return cached;
  const found = Object.values(pack.cards).some((definition) => definition.abilities.some(isAcceptedPermanentReturnedSkillTuningAbility));
  packHasPermanentReturnedSkillTuning.set(key, found);
  return found;
}
function controllerHasPermanentReturnedSkillTuningProvider(state: GameState, controllerId: string): boolean {
  const r = state.abilityRuntime;
  if (!r || !runtimePackHasPermanentReturnedSkillTuning(state)) return false;
  return state.cards.some((card) => card.ownerPlayerId === controllerId && card.controllerPlayerId === controllerId && card.zone === 'skill' &&
    r.pack.cards[card.definitionId]?.abilities.some(isAcceptedPermanentReturnedSkillTuningAbility));
}

const permanentReturnedSkillTuningNodeCache = new WeakMap<object, boolean>();
export function containsPermanentReturnedSkillTuningNode(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const key = value as object;
  const cached = permanentReturnedSkillTuningNodeCache.get(key);
  if (cached !== undefined) return cached;
  const result = Array.isArray(value)
    ? value.some(containsPermanentReturnedSkillTuningNode)
    : record(value) && (
      [PERMANENT_RETURNED_SKILL_TUNING_EFFECT, COMMAND_SEAL_SPENT_THIS_ROUND_CONDITION, RETURNED_SKILL_THIS_ROUND_CONSTRAINT].includes(String(value.type) as any) ||
      Object.values(value).some(containsPermanentReturnedSkillTuningNode));
  permanentReturnedSkillTuningNodeCache.set(key, result);
  return result;
}

export function markCommandSealSpent(
  state: GameState,
  playerId: string,
  before: number,
  after: number,
  provenance: { sourceCardId?: string; abilityId?: string } = {},
): void {
  if (!Number.isSafeInteger(before) || !Number.isSafeInteger(after) || after < 0 || after >= before) return;
  if (!state.players.some((player) => player.id === playerId)) throw new Error('COMMAND_SEAL_SPEND_PLAYER_INVALID');
  settleInjuryWarpCommandSealSpend(state, playerId, before, after);
  if (!state.abilityRuntime || !controllerHasPermanentReturnedSkillTuningProvider(state, playerId)) return;
  const r = runtime(state);
  (r.commandSealSpentRoundByPlayer ??= {})[playerId] = state.round.roundNumber;
  r.events.push({
    type: 'command_seal_spent',
    playerId,
    resource: 'command_seals',
    delta: after - before,
    before,
    after,
    roundNumber: state.round.roundNumber,
    ...(provenance.sourceCardId ? { sourceCardId: provenance.sourceCardId } : {}),
    ...(provenance.abilityId ? { abilityId: provenance.abilityId } : {}),
  });
}
export function controllerSpentCommandSealThisRound(state: GameState, playerId: string): boolean {
  return state.abilityRuntime?.commandSealSpentRoundByPlayer?.[playerId] === state.round.roundNumber;
}

export function recordSkillReturnedToSkillZone(state: GameState, cardInstanceId: string, fromZone: string): void {
  if (fromZone === 'skill' || !state.abilityRuntime || !runtimePackHasPermanentReturnedSkillTuning(state)) return;
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId);
  if (!physical || !controllerHasPermanentReturnedSkillTuningProvider(state, physical.controllerPlayerId)) return;
  const r = runtime(state);
  const definition = physical && r.pack.cards[physical.definitionId];
  if (!physical || physical.zone !== 'skill' || physical.ownerPlayerId !== physical.controllerPlayerId ||
      !definition || !['master_skill', 'servant_skill'].includes(definition.cardType)) return;
  const cardState = r.cardState[cardInstanceId];
  if (!cardState) throw new Error('SKILL_RETURN_RUNTIME_STATE_MISSING');
  cardState.returnedToSkillZoneRound = state.round.roundNumber;
  r.events.push({
    type: 'skill_card_returned_to_skill_zone',
    playerId: physical.ownerPlayerId,
    controllerId: physical.controllerPlayerId,
    cardInstanceId,
    fromZone,
    toZone: 'skill',
    movedCount: 1,
    roundNumber: state.round.roundNumber,
  });
}
export function cardReturnedToSkillThisRound(state: GameState, cardInstanceId: string, controllerId: string): boolean {
  const r = state.abilityRuntime;
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = physical && r?.pack.cards[physical.definitionId];
  return !!physical && !!definition && physical.ownerPlayerId === controllerId && physical.controllerPlayerId === controllerId &&
    physical.zone === 'skill' && ['master_skill', 'servant_skill'].includes(definition.cardType) &&
    r?.cardState[cardInstanceId]?.returnedToSkillZoneRound === state.round.roundNumber;
}
export function returnedSkillCardIdsThisRound(state: GameState, controllerId: string): string[] {
  return state.cards.filter((card) => cardReturnedToSkillThisRound(state, card.instanceId, controllerId))
    .map((card) => card.instanceId).sort();
}

export function applyPermanentReturnedSkillTuning(
  state: GameState,
  ctx: EffectContext,
  ability: AuthoringAbility,
): boolean {
  if (!isAcceptedPermanentReturnedSkillTuningAbility(ability) || !controllerSpentCommandSealThisRound(state, ctx.controllerId)) return false;
  const targetId = ctx.selections.returned_skill?.[0];
  if (!targetId || !cardReturnedToSkillThisRound(state, targetId, ctx.controllerId)) return false;
  const target = state.cards.find((card) => card.instanceId === targetId)!;
  const existing = target.costModifiers?.filter((modifier) => modifier.provenanceKind === PERMANENT_SKILL_TUNING_PROVENANCE).length ?? 0;
  const id = `permanent-skill-tuning:${ctx.sourceCardId}:${ctx.abilityId}:${targetId}:${existing + 1}`;
  if (target.costModifiers?.some((modifier) => modifier.id === id) || target.powerModifiers?.some((modifier) => modifier.id === id)) return false;
  (target.powerModifiers ??= []).push({
    id, sourceId: ctx.sourceCardId, sourceAbilityId: ctx.abilityId, controllerId: ctx.controllerId, kind: 'add', value: 1,
    duration: 'game', lifecycle: 'game', provenanceKind: PERMANENT_SKILL_TUNING_PROVENANCE,
  });
  (target.costModifiers ??= []).push({
    id, sourceId: ctx.sourceCardId, sourceAbilityId: ctx.abilityId, controllerId: ctx.controllerId, kind: 'add', value: -1,
    duration: 'game', minPrintedFraction: 0.5, provenanceKind: PERMANENT_SKILL_TUNING_PROVENANCE,
  });
  runtime(state).events.push({
    type: 'permanent_skill_tuning_applied',
    playerId: ctx.controllerId,
    controllerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId,
    cardInstanceId: targetId,
    roundNumber: state.round.roundNumber,
  });
  return true;
}

export function applyPhysicalCardCostModifiers(state: GameState, cardInstanceId: string, resolvedBeforePhysical: number, printedReference: number): number {
  if (!runtimePackHasPermanentReturnedSkillTuning(state)) return Math.max(0, resolvedBeforePhysical);
  const card = state.cards.find((entry) => entry.instanceId === cardInstanceId);
  const modifiers = card?.costModifiers?.filter((modifier) => modifier.duration === 'game' ||
    (modifier.duration === 'round' && state.round.roundNumber === state.abilityRuntime?.cardState[cardInstanceId]?.playedRound)) ?? [];
  if (!modifiers.length) return Math.max(0, resolvedBeforePhysical);
  if (modifiers.some((modifier) => modifier.provenanceKind !== PERMANENT_SKILL_TUNING_PROVENANCE ||
      modifier.kind !== 'add' || !Number.isSafeInteger(modifier.value) ||
      (modifier.minPrintedFraction !== undefined && (!Number.isFinite(modifier.minPrintedFraction) || modifier.minPrintedFraction < 0 || modifier.minPrintedFraction > 1)))) {
    throw new Error('PHYSICAL_CARD_COST_MODIFIER_INVALID');
  }
  let resolved = resolvedBeforePhysical + modifiers.reduce((sum, modifier) => sum + modifier.value, 0);
  const floorFraction = Math.max(0, ...modifiers.map((modifier) => modifier.minPrintedFraction ?? 0));
  if (floorFraction > 0) resolved = Math.max(resolved, Math.ceil(Math.max(0, printedReference) * floorFraction));
  return Math.max(0, resolved);
}

export function isPermanentSkillTuningRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const r = state.abilityRuntime;
    if (!r) return true;
    const spentRounds = r.commandSealSpentRoundByPlayer ?? {};
    const hasReturnedSkill = Object.values(r.cardState).some((entry) => entry.returnedToSkillZoneRound !== undefined);
    const hasTuningModifiers = state.cards.some((card) =>
      (card.costModifiers?.some((modifier) => modifier.provenanceKind === PERMANENT_SKILL_TUNING_PROVENANCE) ?? false) ||
      (card.powerModifiers?.some((modifier) => modifier.provenanceKind === PERMANENT_SKILL_TUNING_PROVENANCE) ?? false));
    if (!Object.keys(spentRounds).length && !hasReturnedSkill && !hasTuningModifiers) return true;

    const playerIds = new Set(state.players.map((player) => player.id));
    const spentEvents = new Set(r.events
      .filter((event) => event.type === 'command_seal_spent' && typeof event.playerId === 'string' &&
        Number.isSafeInteger(event.roundNumber) && Number.isSafeInteger(event.before) && Number.isSafeInteger(event.after) &&
        Number(event.after) < Number(event.before))
      .map((event) => `${event.playerId}:${event.roundNumber}`));
    const returnEvents = new Set(r.events
      .filter((event) => event.type === 'skill_card_returned_to_skill_zone' && typeof event.cardInstanceId === 'string' &&
        Number.isSafeInteger(event.roundNumber) && event.toZone === 'skill' && event.movedCount === 1)
      .map((event) => `${event.cardInstanceId}:${event.roundNumber}`));
    const cardById = new Map(state.cards.map((card) => [card.instanceId, card] as const));
    for (const [playerId, round] of Object.entries(spentRounds)) {
      if (!playerIds.has(playerId) || !Number.isSafeInteger(round) || round < 1 || round > state.round.roundNumber ||
          !spentEvents.has(`${playerId}:${round}`)) return false;
    }
    for (const physical of state.cards) {
      const cardState = r.cardState[physical.instanceId];
      if (cardState?.returnedToSkillZoneRound !== undefined) {
        const round = cardState.returnedToSkillZoneRound;
        if (!Number.isSafeInteger(round) || round < 1 || round > state.round.roundNumber ||
            !returnEvents.has(`${physical.instanceId}:${round}`)) return false;
      }
      const allCosts = physical.costModifiers ?? [];
      if (allCosts.some((modifier) => modifier.provenanceKind !== PERMANENT_SKILL_TUNING_PROVENANCE)) return false;
      const costs = allCosts;
      const powers = physical.powerModifiers?.filter((modifier) => modifier.provenanceKind === PERMANENT_SKILL_TUNING_PROVENANCE) ?? [];
      if (costs.length !== powers.length) return false;
      const powerById = new Map(powers.map((modifier) => [modifier.id, modifier] as const));
      for (const cost of costs) {
        const power = powerById.get(cost.id);
        if (!power || cost.kind !== 'add' || cost.value !== -1 || cost.duration !== 'game' || cost.minPrintedFraction !== 0.5 ||
            power.kind !== 'add' || power.value !== 1 || power.duration !== 'game' || power.lifecycle !== 'game' ||
            cost.sourceId !== power.sourceId || cost.sourceAbilityId !== power.sourceAbilityId || cost.controllerId !== power.controllerId || !cost.controllerId ||
            physical.ownerPlayerId !== cost.controllerId) return false;
        const source = cardById.get(cost.sourceId);
        const ability = source && cost.sourceAbilityId
          ? r.pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === cost.sourceAbilityId)
          : undefined;
        if (!source || source.ownerPlayerId !== cost.controllerId || source.controllerPlayerId !== cost.controllerId ||
            !ability || !isAcceptedPermanentReturnedSkillTuningAbility(ability)) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
