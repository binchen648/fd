import type { GameState } from '../schema/game';
import type {
  AuthoringAbility,
  EffectContext,
  PlayerId,
  RoundSkillProfileRuntimeState,
  RoundSkillProfileSkillPowerActivationState,
  RoundSkillProfileTerrainActivationState,
  RuleNode,
  SafeEvent,
} from './types';

export const SWITCH_ROUND_SKILL_PROFILE_EFFECT = 'switch_round_skill_profile' as const;
export const ROUND_CURRENT_LOCATION_TERRAIN_BONUS_EFFECT = 'round_current_location_terrain_bonus' as const;
export const ROUND_SKILL_CARD_POWER_BONUS_EFFECT = 'round_skill_card_power_bonus' as const;
export const ROUND_PROFILE_DETERMINATION_REWARD_EFFECT = 'round_profile_determination_reward' as const;

export type RoundSkillProfileSuppression = 'movement_lock' | 'gentle_penalties' | 'round_mana_cap';

const PREFIX = '__fd_rsp:';
const MODES = ['advance', 'action', 'ascension'] as const;
const SUPPRESSIONS: readonly RoundSkillProfileSuppression[] = ['movement_lock', 'gentle_penalties', 'round_mana_cap'];

function rec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exact(value: unknown, keys: readonly string[]): boolean {
  if (!rec(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function empty(value: unknown): boolean { return rec(value) && Object.keys(value).length === 0; }
function token(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(value);
}
function definitionId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,160}$/.test(value);
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exact(ability.responseWindow, ['order', 'passBehavior']) &&
    ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function standardExecution(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' &&
    Array.isArray(ability.execution.allowedOperations) &&
    ability.execution.allowedOperations.length === 0;
}
function oncePerRoundThisCard(ability: AuthoringAbility): boolean {
  return exact(ability.limit, ['type', 'uses', 'scope']) &&
    ability.limit.type === 'per_round' &&
    ability.limit.uses === 1 &&
    ability.limit.scope === 'this_card';
}
function standardPhaseAction(ability: AuthoringAbility, requireOncePerRound = false): boolean {
  return ability.kind === 'phase_action' &&
    ability.ruleModifiers.length === 0 &&
    ability.creates.length === 0 &&
    empty(ability.lifecycle) &&
    (requireOncePerRound ? oncePerRoundThisCard(ability) : empty(ability.limit)) &&
    empty(ability.visibility) &&
    standardResponse(ability) &&
    standardExecution(ability);
}
function switchEffect(effect: RuleNode | undefined): boolean {
  if (!effect || effect.type !== SWITCH_ROUND_SKILL_PROFILE_EFFECT ||
      !token(effect.stateKey) || !token(effect.profileKey) || !definitionId(effect.enhancedDefinitionId) ||
      !SUPPRESSIONS.includes(effect.suppress as RoundSkillProfileSuppression) ||
      !MODES.includes(effect.mode as typeof MODES[number])) return false;
  const mode = effect.mode as typeof MODES[number];
  const target = effect.target;
  const targetRequired = effect.requireHigherVictoryPointTarget === true;
  const expected = ['type', 'stateKey', 'profileKey', 'enhancedDefinitionId', 'suppress', 'mode'];
  if (targetRequired) expected.push('target', 'requireHigherVictoryPointTarget');
  if (mode === 'action') expected.push('afterBattleManaLoss');
  if (mode === 'ascension') expected.push('onBattleLossVictoryPointLoss');
  if (!exact(effect, expected)) return false;
  if (targetRequired && (!token(target) || effect.requireHigherVictoryPointTarget !== true)) return false;
  if (!targetRequired && (target !== undefined || effect.requireHigherVictoryPointTarget !== undefined)) return false;
  if (mode === 'action' && effect.afterBattleManaLoss !== 4) return false;
  if (mode === 'ascension' && effect.onBattleLossVictoryPointLoss !== 2) return false;
  return true;
}
function terrainEffect(effect: RuleNode | undefined): boolean {
  return !!effect && effect.type === ROUND_CURRENT_LOCATION_TERRAIN_BONUS_EFFECT &&
    token(effect.stateKey) && effect.amount === 2 && effect.requireBattlefield === true &&
    effect.requireNoAssignedTerrain === true &&
    exact(effect, ['type', 'stateKey', 'amount', 'requireBattlefield', 'requireNoAssignedTerrain']);
}
function skillPowerEffect(effect: RuleNode | undefined): boolean {
  return !!effect && effect.type === ROUND_SKILL_CARD_POWER_BONUS_EFFECT &&
    token(effect.stateKey) && effect.amount === 1 && effect.duration === 'this_round' &&
    Array.isArray(effect.cardTypes) && effect.cardTypes.length === 2 &&
    effect.cardTypes[0] === 'master_skill' && effect.cardTypes[1] === 'servant_skill' &&
    exact(effect, ['type', 'stateKey', 'amount', 'duration', 'cardTypes']);
}
function determinationEffect(effect: RuleNode | undefined): boolean {
  return !!effect && effect.type === ROUND_PROFILE_DETERMINATION_REWARD_EFFECT &&
    token(effect.stateKey) && token(effect.profileKey) && effect.amount === 2 &&
    exact(effect, ['type', 'stateKey', 'profileKey', 'amount']);
}

function exactHigherVpTarget(ability: AuthoringAbility, targetId: string): boolean {
  if (ability.targets.length !== 1) return false;
  const target = ability.targets[0]!;
  if (target.id !== targetId || target.type !== 'player') return false;
  const count = rec(target.count) ? target.count : {};
  const constraints = Array.isArray(target.constraints) ? target.constraints : [];
  return exact(count, ['min', 'max']) && count.min === 1 && count.max === 1 &&
    constraints.length === 2 &&
    rec(constraints[0]) && constraints[0]!.type === 'not_controller' && exact(constraints[0], ['type']) &&
    rec(constraints[1]) && constraints[1]!.type === 'victory_points_greater_than_controller' && exact(constraints[1], ['type']) &&
    exact(target, ['id', 'type', 'count', 'constraints']);
}

export function isAcceptedRoundSkillProfileAbility(ability: AuthoringAbility): boolean {
  if (!standardExecution(ability)) return false;
  if (ability.effects.length !== 1) return false;
  const effect = ability.effects[0]!;
  if (switchEffect(effect)) {
    if (!standardPhaseAction(ability) || ability.conditions.length !== 0 || ability.cost.length !== 0) return false;
    const expectedPhase = effect.mode === 'advance' ? 'advance' : 'action';
    const expectedWindow = 'controller_action_window';
    if (!exact(ability.activation, ['phase', 'opens']) ||
        ability.activation.phase !== expectedPhase ||
        ability.activation.opens !== expectedWindow) return false;
    return effect.requireHigherVictoryPointTarget === true
      ? exactHigherVpTarget(ability, String(effect.target))
      : ability.targets.length === 0;
  }
  if (terrainEffect(effect)) {
    return standardPhaseAction(ability) && ability.conditions.length === 0 && ability.targets.length === 0 &&
      ability.cost.length === 0 && exact(ability.activation, ['phase', 'opens', 'requiresSourceState']) &&
      ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' &&
      ability.activation.requiresSourceState === 'active';
  }
  if (skillPowerEffect(effect)) {
    return standardPhaseAction(ability, true) && ability.conditions.length === 0 && ability.targets.length === 0 &&
      ability.cost.length === 1 && rec(ability.cost[0]) && ability.cost[0]!.type === 'pay_mana' &&
      ability.cost[0]!.amount === 1 && exact(ability.cost[0], ['type', 'amount']) &&
      exact(ability.activation, ['phase', 'opens', 'requiresSourceState']) &&
      ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' &&
      ability.activation.requiresSourceState === 'active';
  }
  if (determinationEffect(effect)) {
    return ability.kind === 'passive' && empty(ability.activation) && ability.conditions.length === 0 &&
      ability.targets.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 &&
      ability.creates.length === 0 && empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) &&
      standardResponse(ability);
  }
  return false;
}

export function containsRoundSkillProfilePrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRoundSkillProfilePrivilegedNode);
  if (!rec(value)) return false;
  if ([SWITCH_ROUND_SKILL_PROFILE_EFFECT, ROUND_CURRENT_LOCATION_TERRAIN_BONUS_EFFECT,
       ROUND_SKILL_CARD_POWER_BONUS_EFFECT, ROUND_PROFILE_DETERMINATION_REWARD_EFFECT].includes(String(value.type) as never)) return true;
  return Object.values(value).some(containsRoundSkillProfilePrivilegedNode);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('ROUND_SKILL_PROFILE_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function profileStates(state: GameState): RoundSkillProfileRuntimeState[] {
  return runtime(state).roundSkillProfiles ??= [];
}
function skillPowerStates(state: GameState): RoundSkillProfileSkillPowerActivationState[] {
  return runtime(state).roundSkillProfileSkillPowerActivations ??= [];
}
function terrainStates(state: GameState): RoundSkillProfileTerrainActivationState[] {
  return runtime(state).roundSkillProfileTerrainActivations ??= [];
}
function currentProfiles(state: GameState, playerId: PlayerId): RoundSkillProfileRuntimeState[] {
  return (state.abilityRuntime?.roundSkillProfiles ?? []).filter((entry) =>
    entry.controllerId === playerId && entry.round === state.round.roundNumber);
}
function activationUsageKey(
  state: GameState,
  kind: 'skillPower' | 'terrain',
  sourceCardId: string,
  abilityId: string,
): string {
  return `round-skill-profile:${kind}:${sourceCardId}:${abilityId}:round:${state.round.roundNumber}`;
}
function acceptedActivationCount(
  state: GameState,
  kind: 'skillPower' | 'terrain',
  sourceCardId: string,
  abilityId: string,
): number {
  const r = runtime(state);
  return r.abilityUsage[activationUsageKey(state, kind, sourceCardId, abilityId)] ?? 0;
}
function exactEvent(event: SafeEvent, keys: readonly string[]): boolean {
  return exact(event, keys);
}
function sourceAbility(state: GameState, sourceCardId: string, abilityId: string): AuthoringAbility | undefined {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  return source ? runtime(state).pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === abilityId) : undefined;
}
function sourceOwned(state: GameState, playerId: string, sourceCardId: string): boolean {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  return !!source && source.ownerPlayerId === playerId && source.controllerPlayerId === playerId &&
    runtime(state).cardState[sourceCardId]?.faceDown !== true;
}
function sourceActive(state: GameState, playerId: string, sourceCardId: string): boolean {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  return sourceOwned(state, playerId, sourceCardId) && !!source && ['field', 'attack_area'].includes(source.zone) &&
    runtime(state).cardState[sourceCardId]?.active === true;
}
function assignedTerrainAtCurrentLocation(state: GameState, playerId: string): boolean {
  const player = state.players.find((entry) => entry.id === playerId && entry.status === 'active');
  if (!player?.locationId) return false;
  const location = state.map.locations.find((entry) => entry.id === player.locationId);
  if (!location?.tags.includes('battlefield') || (location.terrainBonuses?.length ?? 0) < 1) return false;
  const mode = (state as unknown as { modeState?: { terrainAssignments?: Record<string, string[]>; terrainAssignmentSlots?: Record<string, Record<string, number>> } }).modeState;
  const assigned = mode?.terrainAssignments?.[player.locationId] ?? [];
  const explicit = mode?.terrainAssignmentSlots?.[player.locationId]?.[playerId];
  const slot = Number.isSafeInteger(explicit) ? Number(explicit) : assigned.indexOf(playerId);
  return assigned.includes(playerId) && slot >= 0 && slot < (location.terrainBonuses?.length ?? 0);
}
function currentBattlefield(state: GameState, playerId: string): string | undefined {
  const player = state.players.find((entry) => entry.id === playerId && entry.status === 'active');
  if (!player?.locationId) return undefined;
  const location = state.map.locations.find((entry) => entry.id === player.locationId);
  return location?.tags.includes('battlefield') ? player.locationId : undefined;
}
function higherVpSelectedTarget(state: GameState, ctx: EffectContext, targetId: string): string | undefined {
  const selected = ctx.selections[targetId];
  if (!Array.isArray(selected) || selected.length !== 1) return undefined;
  const controller = state.players.find((entry) => entry.id === ctx.controllerId && entry.status === 'active');
  const target = state.players.find((entry) => entry.id === selected[0] && entry.status === 'active');
  if (!controller || !target || target.id === controller.id || target.vp <= controller.vp) return undefined;
  return target.id;
}
function hasHigherVpTarget(state: GameState, controllerId: string): boolean {
  const controller = state.players.find((entry) => entry.id === controllerId && entry.status === 'active');
  return !!controller && state.players.some((entry) =>
    entry.status === 'active' && entry.id !== controller.id && entry.vp > controller.vp);
}
function findOrCreateEnhancedCard(state: GameState, ctx: EffectContext, effect: RuleNode): string {
  const definition = runtime(state).pack.cards[String(effect.enhancedDefinitionId)];
  const controller = state.players.find((entry) => entry.id === ctx.controllerId);
  if (!definition || !controller || definition.cardType !== 'master_skill' || (definition as { ownerId?: string }).ownerId !== controller.masterCardId) {
    throw new Error('ROUND_SKILL_PROFILE_ENHANCED_DEFINITION_INVALID');
  }
  const existing = state.cards.filter((entry) =>
    entry.definitionId === definition.id && entry.ownerPlayerId === ctx.controllerId &&
    entry.controllerPlayerId === ctx.controllerId && entry.zone !== 'removed');
  if (existing.length > 1) throw new Error('ROUND_SKILL_PROFILE_ENHANCED_DUPLICATE');
  if (existing[0]) return existing[0].instanceId;
  let ordinal = 1;
  let instanceId = `round-profile:${ctx.controllerId}:${effect.stateKey}:${effect.profileKey}:${state.round.roundNumber}:${ordinal}`;
  const ids = new Set(state.cards.map((entry) => entry.instanceId));
  while (ids.has(instanceId)) {
    ordinal += 1;
    instanceId = `round-profile:${ctx.controllerId}:${effect.stateKey}:${effect.profileKey}:${state.round.roundNumber}:${ordinal}`;
  }
  state.cards.push({
    instanceId,
    definitionId: definition.id,
    ownerPlayerId: ctx.controllerId,
    controllerPlayerId: ctx.controllerId,
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId },
    generatedBy: ctx.sourceCardId,
  });
  runtime(state).cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

export function canExecuteRoundSkillProfileEffect(
  state: GameState,
  ctx: EffectContext,
  ability: AuthoringAbility,
): boolean {
  if (!isAcceptedRoundSkillProfileAbility(ability) || !sourceOwned(state, ctx.controllerId, ctx.sourceCardId)) return false;
  const effect = ability.effects[0]!;
  if (switchEffect(effect)) {
    const stateKey = String(effect.stateKey), profileKey = String(effect.profileKey), mode = String(effect.mode);
    const liveProfiles = currentProfiles(state, ctx.controllerId).filter((entry) => entry.stateKey === stateKey);
    if (liveProfiles.some((entry) => entry.profileKey === profileKey)) return false;
    if (liveProfiles.some((entry) => entry.mode === mode)) return false;
    if (effect.requireHigherVictoryPointTarget === true &&
        !higherVpSelectedTarget(state, ctx, String(effect.target)) &&
        !hasHigherVpTarget(state, ctx.controllerId)) return false;
    const definition = runtime(state).pack.cards[String(effect.enhancedDefinitionId)];
    const controller = state.players.find((entry) => entry.id === ctx.controllerId);
    return !!definition && !!controller && definition.cardType === 'master_skill' && (definition as { ownerId?: string }).ownerId === controller.masterCardId;
  }
  if (terrainEffect(effect)) {
    const alreadyUsed = (state.abilityRuntime?.roundSkillProfileTerrainActivations ?? []).some((entry) =>
      entry.controllerId === ctx.controllerId && entry.sourceCardId === ctx.sourceCardId &&
      entry.abilityId === ctx.abilityId && entry.round === state.round.roundNumber);
    return !alreadyUsed && sourceActive(state, ctx.controllerId, ctx.sourceCardId) &&
      !!currentBattlefield(state, ctx.controllerId) && !assignedTerrainAtCurrentLocation(state, ctx.controllerId);
  }
  if (skillPowerEffect(effect)) {
    const controller = state.players.find((entry) => entry.id === ctx.controllerId && entry.status === 'active');
    const alreadyUsed = acceptedActivationCount(state, 'skillPower', ctx.sourceCardId, ctx.abilityId) >= 1;
    return !alreadyUsed && sourceActive(state, ctx.controllerId, ctx.sourceCardId) && !!controller && controller.mana >= 1;
  }
  if (determinationEffect(effect)) return true;
  return false;
}

export function resolveRoundSkillProfileEffect(
  state: GameState,
  ctx: EffectContext,
  ability: AuthoringAbility,
): boolean {
  if (!canExecuteRoundSkillProfileEffect(state, ctx, ability)) return false;
  const effect = ability.effects[0]!;
  if (switchEffect(effect)) {
    const stateKey = String(effect.stateKey), profileKey = String(effect.profileKey), mode = String(effect.mode);
    const controller = state.players.find((entry) => entry.id === ctx.controllerId && entry.status === 'active');
    if (!controller) return false;
    const targetId = effect.requireHigherVictoryPointTarget === true
      ? higherVpSelectedTarget(state, ctx, String(effect.target))
      : undefined;
    if (effect.requireHigherVictoryPointTarget === true && !targetId) return false;
    const target = targetId ? state.players.find((entry) => entry.id === targetId && entry.status === 'active') : undefined;
    const enhancedId = findOrCreateEnhancedCard(state, ctx, effect);
    const record: RoundSkillProfileRuntimeState = {
      controllerId: ctx.controllerId,
      stateKey,
      profileKey,
      mode: mode as RoundSkillProfileRuntimeState['mode'],
      suppression: String(effect.suppress) as RoundSkillProfileSuppression,
      enhancedCardInstanceId: enhancedId,
      providerSourceCardId: ctx.sourceCardId,
      providerAbilityId: ctx.abilityId,
      round: state.round.roundNumber,
      createdRevision: runtime(state).revision,
    };
    if (targetId && target) {
      record.targetPlayerId = targetId;
      record.controllerVpAtSelection = controller.vp;
      record.targetVpAtSelection = target.vp;
      record.determinationRewarded = false;
    }
    if (mode === 'action') record.actionPenaltyPending = true;
    if (mode === 'ascension') record.ascensionLossPending = true;
    profileStates(state).push(record);
    const receipt: SafeEvent = {
      type: 'round_skill_profile_switched',
      playerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      cardInstanceId: enhancedId,
      roundNumber: state.round.roundNumber,
      revision: runtime(state).revision,
    };
    if (targetId && target) {
      receipt.qualifyingPlayerIds = [ctx.controllerId, targetId];
      receipt.before = controller.vp;
      receipt.after = target.vp;
    }
    runtime(state).events.push(receipt);
    return true;
  }
  if (terrainEffect(effect)) {
    const stateKey = String(effect.stateKey);
    const locationId = currentBattlefield(state, ctx.controllerId);
    if (!locationId || assignedTerrainAtCurrentLocation(state, ctx.controllerId)) return false;
    const prior = terrainStates(state).filter((entry) =>
      entry.controllerId === ctx.controllerId && entry.sourceCardId === ctx.sourceCardId &&
      entry.abilityId === ctx.abilityId && entry.round === state.round.roundNumber).length;
    const ordinal = prior + 1;
    runtime(state).abilityUsage[activationUsageKey(state, 'terrain', ctx.sourceCardId, ctx.abilityId)] = ordinal;
    terrainStates(state).push({
      controllerId: ctx.controllerId,
      stateKey,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      round: state.round.roundNumber,
      createdRevision: runtime(state).revision,
      ordinal,
      locationId,
    });
    runtime(state).events.push({
      type: 'round_current_location_terrain_activated',
      playerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      battlefieldId: locationId,
      delta: 2,
      roundNumber: state.round.roundNumber,
      revision: runtime(state).revision,
    });
    return true;
  }
  if (skillPowerEffect(effect)) {
    const stateKey = String(effect.stateKey);
    const prior = skillPowerStates(state).filter((entry) =>
      entry.controllerId === ctx.controllerId && entry.sourceCardId === ctx.sourceCardId &&
      entry.abilityId === ctx.abilityId && entry.round === state.round.roundNumber).length;
    const ordinal = prior + 1;
    runtime(state).abilityUsage[activationUsageKey(state, 'skillPower', ctx.sourceCardId, ctx.abilityId)] = ordinal;
    skillPowerStates(state).push({
      controllerId: ctx.controllerId,
      stateKey,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      round: state.round.roundNumber,
      createdRevision: runtime(state).revision,
      ordinal,
    });
    runtime(state).events.push({
      type: 'round_skill_card_power_activated',
      playerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      resource: 'mana',
      requestedDelta: -1,
      delta: 1,
      before: ordinal - 1,
      after: ordinal,
      roundNumber: state.round.roundNumber,
      revision: runtime(state).revision,
    });
    return true;
  }
  if (determinationEffect(effect)) return true;
  return false;
}

export function roundSkillProfileSuppressed(
  state: GameState,
  playerId: string,
  suppression: RoundSkillProfileSuppression,
): boolean {
  return currentProfiles(state, playerId).some((entry) => entry.suppression === suppression);
}

export function roundSkillCardPowerBonus(state: GameState, playerId: string): number {
  return (state.abilityRuntime?.roundSkillProfileSkillPowerActivations ?? []).filter((entry) =>
    entry.controllerId === playerId && entry.round === state.round.roundNumber).length;
}

export function roundCurrentLocationTerrainBonus(state: GameState, playerId: string, locationId: string): number {
  return (state.abilityRuntime?.roundSkillProfileTerrainActivations ?? []).filter((entry) =>
    entry.controllerId === playerId && entry.round === state.round.roundNumber && entry.locationId === locationId).length * 2;
}

function matchingDeterminationProvider(
  state: GameState,
  controllerId: string,
  stateKey: string,
  profileKey: string,
  cardInstanceId: string,
): { sourceCardId: string; abilityId: string } | undefined {
  const physical = state.cards.find((entry) => entry.instanceId === cardInstanceId);
  if (!physical || physical.ownerPlayerId !== controllerId || physical.controllerPlayerId !== controllerId) return undefined;
  const definition = runtime(state).pack.cards[physical.definitionId];
  const ability = definition?.abilities.find((entry) =>
    isAcceptedRoundSkillProfileAbility(entry) &&
    determinationEffect(entry.effects[0]) &&
    entry.effects[0]!.stateKey === stateKey &&
    entry.effects[0]!.profileKey === profileKey);
  return ability ? { sourceCardId: physical.instanceId, abilityId: ability.id } : undefined;
}

export function settleRoundSkillProfileEvent(state: GameState, event: {
  type: string;
  battleParticipantIds?: string[];
  battleResult?: { winners: string[]; loserIds: string[] };
}): void {
  if (!state.abilityRuntime) return;
  for (const controller of state.players.filter((entry) => entry.status === 'active')) {
    const profiles = currentProfiles(state, controller.id);

    if (event.type === 'after_battle_result_determined' && event.battleResult && Array.isArray(event.battleParticipantIds)) {
      const participants = new Set(event.battleParticipantIds);
      const winners = new Set(event.battleResult.winners);
      const losers = new Set(event.battleResult.loserIds);

      for (const profile of profiles.filter((entry) => entry.targetPlayerId && entry.determinationRewarded !== true)) {
        const targetId = profile.targetPlayerId!;
        const provider = matchingDeterminationProvider(
          state, controller.id, profile.stateKey, profile.profileKey, profile.enhancedCardInstanceId);
        if (!provider) continue;
        if (participants.has(controller.id) && participants.has(targetId) && winners.has(controller.id) && losers.has(targetId)) {
          const before = controller.vp;
          controller.vp += 2;
          profile.determinationRewarded = true;
          runtime(state).events.push({
            type: 'round_profile_determination_rewarded',
            playerId: controller.id,
            sourceCardId: provider.sourceCardId,
            abilityId: provider.abilityId,
            qualifyingPlayerIds: [controller.id, targetId],
            resource: 'victory_points',
            delta: 2,
            before,
            after: controller.vp,
            roundNumber: state.round.roundNumber,
            revision: runtime(state).revision,
          });
        }
      }

      for (const profile of profiles.filter((entry) => entry.ascensionLossPending === true)) {
        if (!participants.has(controller.id) || !losers.has(controller.id)) continue;
        const before = controller.vp;
        controller.vp = Math.max(0, controller.vp - 2);
        profile.ascensionLossPending = false;
        runtime(state).events.push({
          type: 'round_profile_ascension_loss_penalty',
          playerId: controller.id,
          sourceCardId: profile.providerSourceCardId,
          abilityId: profile.providerAbilityId,
          resource: 'victory_points',
          delta: controller.vp - before,
          before,
          after: controller.vp,
          roundNumber: state.round.roundNumber,
          revision: runtime(state).revision,
        });
      }
    }

    if (event.type === 'after_battle_ended') {
      for (const profile of profiles.filter((entry) => entry.actionPenaltyPending === true)) {
        const before = controller.mana;
        controller.mana = Math.max(0, controller.mana - 4);
        profile.actionPenaltyPending = false;
        runtime(state).events.push({
          type: 'round_profile_action_mana_penalty',
          playerId: controller.id,
          sourceCardId: profile.providerSourceCardId,
          abilityId: profile.providerAbilityId,
          resource: 'mana',
          delta: controller.mana - before,
          before,
          after: controller.mana,
          roundNumber: state.round.roundNumber,
          revision: runtime(state).revision,
        });
      }
    }
  }
}

export function cleanupRoundSkillProfilesAtRoundEnd(state: GameState): void {
  if (!state.abilityRuntime) return;
  const r = runtime(state);
  const round = state.round.roundNumber;
  const enhancedIds = (r.roundSkillProfiles ?? [])
    .filter((entry) => entry.round === round)
    .map((entry) => entry.enhancedCardInstanceId);
  for (const instanceId of new Set(enhancedIds)) {
    const physical = state.cards.find((entry) => entry.instanceId === instanceId);
    if (physical) {
      state.cards.splice(state.cards.indexOf(physical), 1);
      delete r.cardState[instanceId];
    }
  }
  r.roundSkillProfiles = (r.roundSkillProfiles ?? []).filter((entry) => entry.round > round);
  r.roundSkillProfileSkillPowerActivations = (r.roundSkillProfileSkillPowerActivations ?? []).filter((entry) => entry.round > round);
  r.roundSkillProfileTerrainActivations = (r.roundSkillProfileTerrainActivations ?? []).filter((entry) => entry.round > round);
}

export function isRoundSkillProfileRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    if (!state.abilityRuntime) return true;
    const r = runtime(state);
    const playerIds = new Set(state.players.map((entry) => entry.id));
    const locationIds = new Set<string>(state.map.locations.map((entry) => entry.id));

    for (const [playerId, playerFlags] of Object.entries(r.structuredPlayerFlagsByPlayer ?? {})) {
      if (!playerIds.has(playerId)) return false;
      if (Object.keys(playerFlags).some((fullKey) => fullKey.startsWith(PREFIX))) return false;
    }
    for (const [playerId, playerRoundKeys] of Object.entries(r.structuredRoundFlagKeysByPlayer ?? {})) {
      if (!playerIds.has(playerId)) return false;
      if (Object.keys(playerRoundKeys).some((fullKey) => fullKey.startsWith(PREFIX))) return false;
    }

    const profiles = r.roundSkillProfiles ?? [];
    const skillPowerActivations = r.roundSkillProfileSkillPowerActivations ?? [];
    const terrainActivations = r.roundSkillProfileTerrainActivations ?? [];
    const profileIds = new Set<string>();
    const modeIds = new Set<string>();
    const enhancedIds = new Set<string>();

    const switchReceipts = r.events.filter((event) =>
      event.type === 'round_skill_profile_switched' && event.roundNumber === state.round.roundNumber);
    if (switchReceipts.length !== profiles.length) return false;

    for (const profile of profiles) {
      if (!playerIds.has(profile.controllerId) || !token(profile.stateKey) || !token(profile.profileKey) ||
          !MODES.includes(profile.mode) || !SUPPRESSIONS.includes(profile.suppression) ||
          profile.round !== state.round.roundNumber || !Number.isSafeInteger(profile.createdRevision) ||
          profile.createdRevision < 0 || profile.createdRevision > r.revision) return false;

      const profileId = `${profile.controllerId}\u0000${profile.stateKey}\u0000${profile.profileKey}`;
      const modeId = `${profile.controllerId}\u0000${profile.stateKey}\u0000${profile.mode}`;
      if (profileIds.has(profileId) || modeIds.has(modeId) || enhancedIds.has(profile.enhancedCardInstanceId)) return false;
      profileIds.add(profileId);
      modeIds.add(modeId);
      enhancedIds.add(profile.enhancedCardInstanceId);

      const provider = state.cards.find((entry) => entry.instanceId === profile.providerSourceCardId);
      const providerAbility = provider
        ? sourceAbility(state, profile.providerSourceCardId, profile.providerAbilityId)
        : undefined;
      const effect = providerAbility?.effects[0];
      const enhanced = state.cards.find((entry) => entry.instanceId === profile.enhancedCardInstanceId);
      if (!provider || !sourceOwned(state, profile.controllerId, profile.providerSourceCardId) ||
          !providerAbility || !isAcceptedRoundSkillProfileAbility(providerAbility) ||
          !switchEffect(effect) || effect!.stateKey !== profile.stateKey ||
          effect!.profileKey !== profile.profileKey || effect!.mode !== profile.mode ||
          effect!.suppress !== profile.suppression ||
          !enhanced || enhanced.ownerPlayerId !== profile.controllerId ||
          enhanced.controllerPlayerId !== profile.controllerId ||
          enhanced.generatedBy !== profile.providerSourceCardId ||
          enhanced.definitionId !== effect!.enhancedDefinitionId ||
          !r.cardState[profile.enhancedCardInstanceId] ||
          r.cardState[profile.enhancedCardInstanceId]!.playedRound !== profile.round) return false;

      const targetRequired = effect!.requireHigherVictoryPointTarget === true;
      const determinationProvider = targetRequired
        ? matchingDeterminationProvider(
            state, profile.controllerId, profile.stateKey, profile.profileKey, profile.enhancedCardInstanceId)
        : undefined;
      if (targetRequired) {
        if (typeof profile.targetPlayerId !== 'string' || profile.targetPlayerId === profile.controllerId ||
            !playerIds.has(profile.targetPlayerId) ||
            !Number.isSafeInteger(profile.controllerVpAtSelection) || Number(profile.controllerVpAtSelection) < 0 ||
            !Number.isSafeInteger(profile.targetVpAtSelection) || Number(profile.targetVpAtSelection) < 0 ||
            Number(profile.targetVpAtSelection) <= Number(profile.controllerVpAtSelection) ||
            typeof profile.determinationRewarded !== 'boolean' ||
            !determinationProvider) return false;
      } else if (profile.targetPlayerId !== undefined || profile.controllerVpAtSelection !== undefined ||
                 profile.targetVpAtSelection !== undefined || profile.determinationRewarded !== undefined) {
        return false;
      }

      if (profile.mode === 'action') {
        if (typeof profile.actionPenaltyPending !== 'boolean' || profile.ascensionLossPending !== undefined) return false;
      } else if (profile.actionPenaltyPending !== undefined) {
        return false;
      }
      if (profile.mode === 'ascension') {
        if (typeof profile.ascensionLossPending !== 'boolean') return false;
      } else if (profile.ascensionLossPending !== undefined) {
        return false;
      }

      const matchingSwitchReceipts = switchReceipts.filter((event) => {
        if (event.playerId !== profile.controllerId ||
            event.sourceCardId !== profile.providerSourceCardId ||
            event.abilityId !== profile.providerAbilityId ||
            event.cardInstanceId !== profile.enhancedCardInstanceId ||
            event.roundNumber !== profile.round ||
            event.revision !== profile.createdRevision) return false;
        if (targetRequired) {
          return exactEvent(event, [
            'type','playerId','sourceCardId','abilityId','cardInstanceId','roundNumber','revision',
            'qualifyingPlayerIds','before','after',
          ]) &&
            Array.isArray(event.qualifyingPlayerIds) &&
            event.qualifyingPlayerIds.length === 2 &&
            event.qualifyingPlayerIds[0] === profile.controllerId &&
            event.qualifyingPlayerIds[1] === profile.targetPlayerId &&
            event.before === profile.controllerVpAtSelection &&
            event.after === profile.targetVpAtSelection;
        }
        return exactEvent(event, [
          'type','playerId','sourceCardId','abilityId','cardInstanceId','roundNumber','revision',
        ]);
      });
      if (matchingSwitchReceipts.length !== 1) return false;

      const determinationReceipts = r.events.filter((event) =>
        exactEvent(event, [
          'type','playerId','sourceCardId','abilityId','qualifyingPlayerIds','resource','delta',
          'before','after','roundNumber','revision',
        ]) &&
        event.type === 'round_profile_determination_rewarded' &&
        event.roundNumber === profile.round &&
        event.playerId === profile.controllerId &&
        event.sourceCardId === determinationProvider?.sourceCardId &&
        event.abilityId === determinationProvider?.abilityId &&
        Array.isArray(event.qualifyingPlayerIds) &&
        event.qualifyingPlayerIds.length === 2 &&
        event.qualifyingPlayerIds[0] === profile.controllerId &&
        event.qualifyingPlayerIds[1] === profile.targetPlayerId &&
        event.resource === 'victory_points' &&
        event.delta === 2 &&
        Number.isSafeInteger(event.revision) && Number(event.revision) <= r.revision &&
        Number.isSafeInteger(event.before) && Number.isSafeInteger(event.after) &&
        Number(event.after) === Number(event.before) + 2);
      if (targetRequired && profile.determinationRewarded === true) {
        if (determinationReceipts.length !== 1) return false;
      } else if (determinationReceipts.length !== 0) {
        return false;
      }

      const actionPenaltyReceipts = r.events.filter((event) =>
        exactEvent(event, [
          'type','playerId','sourceCardId','abilityId','resource','delta','before','after','roundNumber','revision',
        ]) &&
        event.type === 'round_profile_action_mana_penalty' &&
        event.roundNumber === profile.round &&
        event.playerId === profile.controllerId &&
        event.sourceCardId === profile.providerSourceCardId &&
        event.abilityId === profile.providerAbilityId &&
        event.resource === 'mana' &&
        Number.isSafeInteger(event.revision) && Number(event.revision) <= r.revision &&
        Number.isSafeInteger(event.before) && Number.isSafeInteger(event.after) &&
        Number(event.after) === Math.max(0, Number(event.before) - 4) &&
        event.delta === Number(event.after) - Number(event.before));
      if (profile.mode === 'action' && profile.actionPenaltyPending === false) {
        if (actionPenaltyReceipts.length !== 1) return false;
      } else if (actionPenaltyReceipts.length !== 0) {
        return false;
      }

      const ascensionLossReceipts = r.events.filter((event) =>
        exactEvent(event, [
          'type','playerId','sourceCardId','abilityId','resource','delta','before','after','roundNumber','revision',
        ]) &&
        event.type === 'round_profile_ascension_loss_penalty' &&
        event.roundNumber === profile.round &&
        event.playerId === profile.controllerId &&
        event.sourceCardId === profile.providerSourceCardId &&
        event.abilityId === profile.providerAbilityId &&
        event.resource === 'victory_points' &&
        Number.isSafeInteger(event.revision) && Number(event.revision) <= r.revision &&
        Number.isSafeInteger(event.before) && Number.isSafeInteger(event.after) &&
        Number(event.after) === Math.max(0, Number(event.before) - 2) &&
        event.delta === Number(event.after) - Number(event.before));
      if (profile.mode === 'ascension' && profile.ascensionLossPending === false) {
        if (ascensionLossReceipts.length !== 1) return false;
      } else if (ascensionLossReceipts.length !== 0) {
        return false;
      }
    }

    const generatedProfileCards = state.cards
      .filter((entry) => entry.instanceId.startsWith('round-profile:') && r.cardState[entry.instanceId]?.playedRound === state.round.roundNumber)
      .map((entry) => entry.instanceId);
    if (generatedProfileCards.length !== enhancedIds.size ||
        generatedProfileCards.some((instanceId) => !enhancedIds.has(instanceId))) return false;

    const skillPowerReceipts = r.events.filter((event) =>
      event.type === 'round_skill_card_power_activated' && event.roundNumber === state.round.roundNumber);
    if (skillPowerReceipts.length !== skillPowerActivations.length) return false;
    const skillPowerGroups = new Map<string, RoundSkillProfileSkillPowerActivationState[]>();
    for (const activation of skillPowerActivations) {
      if (!playerIds.has(activation.controllerId) || !token(activation.stateKey) ||
          activation.round !== state.round.roundNumber || !Number.isSafeInteger(activation.createdRevision) ||
          activation.createdRevision < 0 || activation.createdRevision > r.revision ||
          !Number.isSafeInteger(activation.ordinal) || activation.ordinal < 1 ||
          !enhancedIds.has(activation.sourceCardId)) return false;
      const source = state.cards.find((entry) => entry.instanceId === activation.sourceCardId);
      const ability = source ? sourceAbility(state, activation.sourceCardId, activation.abilityId) : undefined;
      if (!source || source.ownerPlayerId !== activation.controllerId || source.controllerPlayerId !== activation.controllerId ||
          !ability || !isAcceptedRoundSkillProfileAbility(ability) || !skillPowerEffect(ability.effects[0]) ||
          ability.effects[0]!.stateKey !== activation.stateKey) return false;
      const groupKey = `${activation.controllerId}\u0000${activation.sourceCardId}\u0000${activation.abilityId}`;
      const group = skillPowerGroups.get(groupKey) ?? [];
      group.push(activation);
      skillPowerGroups.set(groupKey, group);
      const receipts = skillPowerReceipts.filter((event) =>
        exactEvent(event, ['type','playerId','sourceCardId','abilityId','resource','requestedDelta','delta','before','after','roundNumber','revision']) &&
        event.playerId === activation.controllerId &&
        event.sourceCardId === activation.sourceCardId &&
        event.abilityId === activation.abilityId &&
        event.resource === 'mana' &&
        event.requestedDelta === -1 &&
        event.delta === 1 &&
        event.before === activation.ordinal - 1 &&
        event.after === activation.ordinal &&
        event.roundNumber === activation.round &&
        event.revision === activation.createdRevision);
      if (receipts.length !== 1) return false;
    }
    for (const group of skillPowerGroups.values()) {
      const ordered = [...group].sort((a, b) => a.ordinal - b.ordinal);
      if (ordered.length !== 1 || ordered.some((entry, index) => entry.ordinal !== index + 1)) return false;
      const first = ordered[0]!;
      if (ordered.length !== acceptedActivationCount(
        state, 'skillPower', first.sourceCardId, first.abilityId)) return false;
    }

    const terrainReceipts = r.events.filter((event) =>
      event.type === 'round_current_location_terrain_activated' && event.roundNumber === state.round.roundNumber);
    if (terrainReceipts.length !== terrainActivations.length) return false;
    const terrainGroups = new Map<string, RoundSkillProfileTerrainActivationState[]>();
    for (const activation of terrainActivations) {
      if (!playerIds.has(activation.controllerId) || !token(activation.stateKey) ||
          activation.round !== state.round.roundNumber || !Number.isSafeInteger(activation.createdRevision) ||
          activation.createdRevision < 0 || activation.createdRevision > r.revision ||
          !Number.isSafeInteger(activation.ordinal) || activation.ordinal < 1 ||
          !enhancedIds.has(activation.sourceCardId) || !locationIds.has(activation.locationId) ||
          !state.map.locations.find((entry) => entry.id === activation.locationId)?.tags.includes('battlefield')) return false;
      const source = state.cards.find((entry) => entry.instanceId === activation.sourceCardId);
      const ability = source ? sourceAbility(state, activation.sourceCardId, activation.abilityId) : undefined;
      if (!source || source.ownerPlayerId !== activation.controllerId || source.controllerPlayerId !== activation.controllerId ||
          !ability || !isAcceptedRoundSkillProfileAbility(ability) || !terrainEffect(ability.effects[0]) ||
          ability.effects[0]!.stateKey !== activation.stateKey) return false;
      const groupKey = `${activation.controllerId}\u0000${activation.sourceCardId}\u0000${activation.abilityId}`;
      const group = terrainGroups.get(groupKey) ?? [];
      group.push(activation);
      terrainGroups.set(groupKey, group);
      const receipts = terrainReceipts.filter((event) =>
        exactEvent(event, ['type','playerId','sourceCardId','abilityId','battlefieldId','delta','roundNumber','revision']) &&
        event.playerId === activation.controllerId &&
        event.sourceCardId === activation.sourceCardId &&
        event.abilityId === activation.abilityId &&
        event.battlefieldId === activation.locationId &&
        event.delta === 2 &&
        event.roundNumber === activation.round &&
        event.revision === activation.createdRevision);
      if (receipts.length !== 1) return false;
    }
    for (const group of terrainGroups.values()) {
      const ordered = [...group].sort((a, b) => a.ordinal - b.ordinal);
      if (ordered.some((entry, index) => entry.ordinal !== index + 1)) return false;
      const first = ordered[0]!;
      if (ordered.length !== acceptedActivationCount(
        state, 'terrain', first.sourceCardId, first.abilityId)) return false;
    }

    for (const enhancedId of enhancedIds) {
      const definition = state.cards.find((entry) => entry.instanceId === enhancedId);
      const abilities = definition ? runtime(state).pack.cards[definition.definitionId]?.abilities ?? [] : [];
      for (const ability of abilities.filter(isAcceptedRoundSkillProfileAbility)) {
        const effect = ability.effects[0];
        if (!effect || (!skillPowerEffect(effect) && !terrainEffect(effect))) continue;
        const expected = acceptedActivationCount(
          state, skillPowerEffect(effect) ? 'skillPower' : 'terrain', enhancedId, ability.id);
        const actual = skillPowerEffect(effect)
          ? skillPowerActivations.filter((entry) =>
              entry.controllerId === definition!.controllerPlayerId && entry.sourceCardId === enhancedId &&
              entry.abilityId === ability.id && entry.round === state.round.roundNumber).length
          : terrainActivations.filter((entry) =>
              entry.controllerId === definition!.controllerPlayerId && entry.sourceCardId === enhancedId &&
              entry.abilityId === ability.id && entry.round === state.round.roundNumber).length;
        if (actual !== expected) return false;
      }
    }

    const expectedUsage = new Map<string, number>();
    for (const activation of skillPowerActivations) {
      const usageKey = activationUsageKey(state, 'skillPower', activation.sourceCardId, activation.abilityId);
      expectedUsage.set(usageKey, (expectedUsage.get(usageKey) ?? 0) + 1);
    }
    for (const activation of terrainActivations) {
      const usageKey = activationUsageKey(state, 'terrain', activation.sourceCardId, activation.abilityId);
      expectedUsage.set(usageKey, (expectedUsage.get(usageKey) ?? 0) + 1);
    }
    const currentUsageEntries = Object.entries(r.abilityUsage).filter(([usageKey]) =>
      usageKey.startsWith('round-skill-profile:') &&
      usageKey.endsWith(`:round:${state.round.roundNumber}`));
    if (currentUsageEntries.length !== expectedUsage.size) return false;
    for (const [usageKey, count] of currentUsageEntries) {
      if (expectedUsage.get(usageKey) !== count) return false;
    }

    return true;
  } catch {
    return false;
  }
}
