import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, PlayerId, RuleNode } from './types';

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
function standardPhaseAction(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' &&
    ability.ruleModifiers.length === 0 &&
    ability.creates.length === 0 &&
    empty(ability.lifecycle) &&
    empty(ability.limit) &&
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
    return standardPhaseAction(ability) && ability.conditions.length === 0 && ability.targets.length === 0 &&
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
function flags(state: GameState, playerId: PlayerId): Record<string, boolean | string | number> {
  const all = runtime(state).structuredPlayerFlagsByPlayer ??= {};
  return all[playerId] ??= {};
}
function roundKeys(state: GameState, playerId: PlayerId): Record<string, number> {
  const all = runtime(state).structuredRoundFlagKeysByPlayer ??= {};
  return all[playerId] ??= {};
}
function readFlags(state: GameState, playerId: PlayerId): Readonly<Record<string, boolean | string | number>> {
  return state.abilityRuntime?.structuredPlayerFlagsByPlayer?.[playerId] ?? {};
}
function readRoundKeys(state: GameState, playerId: PlayerId): Readonly<Record<string, number>> {
  return state.abilityRuntime?.structuredRoundFlagKeysByPlayer?.[playerId] ?? {};
}
function key(stateKey: string, suffix: string): string { return `${PREFIX}${stateKey}:${suffix}`; }
function setRoundFlag(state: GameState, playerId: PlayerId, stateKey: string, suffix: string, value: boolean | string | number): void {
  const k = key(stateKey, suffix);
  flags(state, playerId)[k] = value;
  roundKeys(state, playerId)[k] = state.round.roundNumber;
}
function clearFlag(state: GameState, playerId: PlayerId, stateKey: string, suffix: string): void {
  const k = key(stateKey, suffix);
  delete flags(state, playerId)[k];
  delete roundKeys(state, playerId)[k];
}
function getRoundFlag(state: GameState, playerId: PlayerId, stateKey: string, suffix: string): boolean | string | number | undefined {
  const k = key(stateKey, suffix);
  return readRoundKeys(state, playerId)[k] === state.round.roundNumber ? readFlags(state, playerId)[k] : undefined;
}
function profilePrefix(stateKey: string): string { return `${PREFIX}${stateKey}:`; }
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
    if (getRoundFlag(state, ctx.controllerId, stateKey, `profile:${profileKey}`) === true) return false;
    if (getRoundFlag(state, ctx.controllerId, stateKey, `mode:${mode}`) === true) return false;
    if (effect.requireHigherVictoryPointTarget === true &&
        !higherVpSelectedTarget(state, ctx, String(effect.target)) &&
        !hasHigherVpTarget(state, ctx.controllerId)) return false;
    const definition = runtime(state).pack.cards[String(effect.enhancedDefinitionId)];
    const controller = state.players.find((entry) => entry.id === ctx.controllerId);
    return !!definition && !!controller && definition.cardType === 'master_skill' && (definition as { ownerId?: string }).ownerId === controller.masterCardId;
  }
  if (terrainEffect(effect)) {
    return sourceActive(state, ctx.controllerId, ctx.sourceCardId) &&
      !!currentBattlefield(state, ctx.controllerId) && !assignedTerrainAtCurrentLocation(state, ctx.controllerId);
  }
  if (skillPowerEffect(effect)) {
    const controller = state.players.find((entry) => entry.id === ctx.controllerId && entry.status === 'active');
    return sourceActive(state, ctx.controllerId, ctx.sourceCardId) && !!controller && controller.mana >= 1;
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
    const enhancedId = findOrCreateEnhancedCard(state, ctx, effect);
    setRoundFlag(state, ctx.controllerId, stateKey, `mode:${mode}`, true);
    setRoundFlag(state, ctx.controllerId, stateKey, `profile:${profileKey}`, true);
    setRoundFlag(state, ctx.controllerId, stateKey, `suppress:${String(effect.suppress)}`, true);
    setRoundFlag(state, ctx.controllerId, stateKey, `enhanced:${profileKey}`, enhancedId);
    setRoundFlag(state, ctx.controllerId, stateKey, `provider:${profileKey}`, ctx.sourceCardId);
    setRoundFlag(state, ctx.controllerId, stateKey, `providerAbility:${profileKey}`, ctx.abilityId);
    if (effect.requireHigherVictoryPointTarget === true) {
      const targetId = higherVpSelectedTarget(state, ctx, String(effect.target));
      if (!targetId) return false;
      setRoundFlag(state, ctx.controllerId, stateKey, `target:${profileKey}`, targetId);
    }
    if (effect.mode === 'action') setRoundFlag(state, ctx.controllerId, stateKey, 'actionPenaltyMana', 4);
    if (effect.mode === 'ascension') setRoundFlag(state, ctx.controllerId, stateKey, 'ascensionLossVp', 2);
    runtime(state).events.push({
      type: 'round_skill_profile_switched',
      playerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      cardInstanceId: enhancedId,
      roundNumber: state.round.roundNumber,
    });
    return true;
  }
  if (terrainEffect(effect)) {
    const locationId = currentBattlefield(state, ctx.controllerId);
    if (!locationId || assignedTerrainAtCurrentLocation(state, ctx.controllerId)) return false;
    setRoundFlag(state, ctx.controllerId, String(effect.stateKey), 'terrainLocation', locationId);
    setRoundFlag(state, ctx.controllerId, String(effect.stateKey), 'terrainAmount', 2);
    return true;
  }
  if (skillPowerEffect(effect)) {
    const stateKey = String(effect.stateKey);
    const prior = getRoundFlag(state, ctx.controllerId, stateKey, 'skillPowerBonus');
    const value = prior === undefined ? 0 : Number(prior);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('ROUND_SKILL_PROFILE_POWER_STATE_INVALID');
    setRoundFlag(state, ctx.controllerId, stateKey, 'skillPowerBonus', value + 1);
    return true;
  }
  if (determinationEffect(effect)) return true;
  return false;
}

function currentFlag(state: GameState, playerId: string, fullKey: string): boolean | string | number | undefined {
  return readRoundKeys(state, playerId)[fullKey] === state.round.roundNumber ? readFlags(state, playerId)[fullKey] : undefined;
}

export function roundSkillProfileSuppressed(
  state: GameState,
  playerId: string,
  suppression: RoundSkillProfileSuppression,
): boolean {
  const suffix = `:suppress:${suppression}`;
  return Object.keys(readFlags(state, playerId)).some((fullKey) =>
    fullKey.startsWith(PREFIX) && fullKey.endsWith(suffix) && currentFlag(state, playerId, fullKey) === true);
}

export function roundSkillCardPowerBonus(state: GameState, playerId: string): number {
  let total = 0;
  for (const [fullKey, value] of Object.entries(readFlags(state, playerId))) {
    if (!fullKey.startsWith(PREFIX) || !fullKey.endsWith(':skillPowerBonus') || currentFlag(state, playerId, fullKey) === undefined) continue;
    if (!Number.isSafeInteger(value) || Number(value) < 0) throw new Error('ROUND_SKILL_PROFILE_POWER_STATE_INVALID');
    total += Number(value);
  }
  return total;
}

export function roundCurrentLocationTerrainBonus(state: GameState, playerId: string, locationId: string): number {
  let total = 0;
  const playerFlags = readFlags(state, playerId);
  for (const fullKey of Object.keys(playerFlags)) {
    if (!fullKey.startsWith(PREFIX) || !fullKey.endsWith(':terrainLocation')) continue;
    if (currentFlag(state, playerId, fullKey) !== locationId) continue;
    const stateKey = fullKey.slice(PREFIX.length, -':terrainLocation'.length);
    const amount = getRoundFlag(state, playerId, stateKey, 'terrainAmount');
    if (!Number.isSafeInteger(amount) || Number(amount) < 0) throw new Error('ROUND_SKILL_PROFILE_TERRAIN_STATE_INVALID');
    total += Number(amount);
  }
  return total;
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
    const playerFlags = readFlags(state, controller.id);
    const currentKeys = Object.keys(playerFlags).filter((fullKey) =>
      fullKey.startsWith(PREFIX) && readRoundKeys(state, controller.id)[fullKey] === state.round.roundNumber);

    if (event.type === 'after_battle_result_determined' && event.battleResult && Array.isArray(event.battleParticipantIds)) {
      const participants = new Set(event.battleParticipantIds);
      const winners = new Set(event.battleResult.winners);
      const losers = new Set(event.battleResult.loserIds);

      for (const fullKey of currentKeys.filter((entry) => entry.includes(':target:'))) {
        const marker = fullKey.slice(PREFIX.length);
        const split = marker.indexOf(':target:');
        if (split < 1) continue;
        const stateKey = marker.slice(0, split);
        const profileKey = marker.slice(split + ':target:'.length);
        if (getRoundFlag(state, controller.id, stateKey, `rewarded:${profileKey}`) === true) continue;
        const targetId = String(currentFlag(state, controller.id, fullKey) ?? '');
        const enhancedId = getRoundFlag(state, controller.id, stateKey, `enhanced:${profileKey}`);
        if (!targetId || typeof enhancedId !== 'string') continue;
        const provider = matchingDeterminationProvider(state, controller.id, stateKey, profileKey, enhancedId);
        if (!provider) continue;
        if (participants.has(controller.id) && participants.has(targetId) && winners.has(controller.id) && losers.has(targetId)) {
          const before = controller.vp;
          controller.vp += 2;
          setRoundFlag(state, controller.id, stateKey, `rewarded:${profileKey}`, true);
          runtime(state).events.push({
            type: 'round_profile_determination_rewarded',
            playerId: controller.id,
            sourceCardId: provider.sourceCardId,
            abilityId: provider.abilityId,
            resource: 'victory_points',
            delta: 2,
            before,
            after: controller.vp,
            roundNumber: state.round.roundNumber,
          });
        }
      }

      for (const fullKey of currentKeys.filter((entry) => entry.endsWith(':ascensionLossVp'))) {
        const stateKey = fullKey.slice(PREFIX.length, -':ascensionLossVp'.length);
        const amount = Number(currentFlag(state, controller.id, fullKey));
        if (amount !== 2 || !participants.has(controller.id) || !losers.has(controller.id)) continue;
        const before = controller.vp;
        controller.vp = Math.max(0, controller.vp - amount);
        clearFlag(state, controller.id, stateKey, 'ascensionLossVp');
        runtime(state).events.push({
          type: 'round_profile_ascension_loss_penalty',
          playerId: controller.id,
          resource: 'victory_points',
          delta: controller.vp - before,
          before,
          after: controller.vp,
          roundNumber: state.round.roundNumber,
        });
      }
    }

    if (event.type === 'after_battle_ended') {
      for (const fullKey of currentKeys.filter((entry) => entry.endsWith(':actionPenaltyMana'))) {
        const stateKey = fullKey.slice(PREFIX.length, -':actionPenaltyMana'.length);
        const amount = Number(currentFlag(state, controller.id, fullKey));
        if (amount !== 4) continue;
        const before = controller.mana;
        controller.mana = Math.max(0, controller.mana - amount);
        clearFlag(state, controller.id, stateKey, 'actionPenaltyMana');
        runtime(state).events.push({
          type: 'round_profile_action_mana_penalty',
          playerId: controller.id,
          resource: 'mana',
          delta: controller.mana - before,
          before,
          after: controller.mana,
          roundNumber: state.round.roundNumber,
        });
      }
    }
  }
}

export function cleanupRoundSkillProfilesAtRoundEnd(state: GameState): void {
  if (!state.abilityRuntime) return;
  for (const controller of state.players) {
    const playerFlags = state.abilityRuntime.structuredPlayerFlagsByPlayer?.[controller.id];
    const playerRoundKeys = state.abilityRuntime.structuredRoundFlagKeysByPlayer?.[controller.id];
    if (!playerFlags || !playerRoundKeys) continue;
    const enhancedIds = Object.entries(playerFlags)
      .filter(([fullKey]) => fullKey.startsWith(PREFIX) && fullKey.includes(':enhanced:') && playerRoundKeys[fullKey] === state.round.roundNumber)
      .map(([, value]) => typeof value === 'string' ? value : '')
      .filter(Boolean);
    for (const instanceId of enhancedIds) {
      const physical = state.cards.find((entry) => entry.instanceId === instanceId);
      if (physical && physical.ownerPlayerId === controller.id && physical.controllerPlayerId === controller.id) {
        state.cards.splice(state.cards.indexOf(physical), 1);
        delete runtime(state).cardState[instanceId];
      }
    }
    for (const fullKey of Object.keys(playerFlags)) {
      if (fullKey.startsWith(PREFIX) && playerRoundKeys[fullKey] === state.round.roundNumber) {
        delete playerFlags[fullKey];
        delete playerRoundKeys[fullKey];
      }
    }
  }
}

export function isRoundSkillProfileRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    if (!state.abilityRuntime) return true;
    const playerIds = new Set(state.players.map((entry) => entry.id));
    for (const [playerId, playerFlags] of Object.entries(state.abilityRuntime.structuredPlayerFlagsByPlayer ?? {})) {
      if (!playerIds.has(playerId)) return false;
      const playerRoundKeys = state.abilityRuntime.structuredRoundFlagKeysByPlayer?.[playerId] ?? {};
      const profileKeys = Object.keys(playerFlags).filter((fullKey) =>
        fullKey.startsWith(PREFIX) && playerRoundKeys[fullKey] === state.round.roundNumber && fullKey.includes(':profile:'));
      for (const profileFullKey of profileKeys) {
        if (playerFlags[profileFullKey] !== true) return false;
        const marker = profileFullKey.slice(PREFIX.length);
        const split = marker.indexOf(':profile:');
        if (split < 1) return false;
        const stateKey = marker.slice(0, split), profileKey = marker.slice(split + ':profile:'.length);
        if (!token(stateKey) || !token(profileKey)) return false;
        const enhancedId = getRoundFlag(state, playerId, stateKey, `enhanced:${profileKey}`);
        const providerId = getRoundFlag(state, playerId, stateKey, `provider:${profileKey}`);
        const providerAbilityId = getRoundFlag(state, playerId, stateKey, `providerAbility:${profileKey}`);
        if (typeof enhancedId !== 'string' || typeof providerId !== 'string' || typeof providerAbilityId !== 'string') return false;
        const enhanced = state.cards.find((entry) => entry.instanceId === enhancedId);
        const provider = state.cards.find((entry) => entry.instanceId === providerId);
        const providerAbility = provider ? sourceAbility(state, providerId, providerAbilityId) : undefined;
        if (!enhanced || enhanced.ownerPlayerId !== playerId || enhanced.controllerPlayerId !== playerId ||
            !provider || provider.ownerPlayerId !== playerId || provider.controllerPlayerId !== playerId ||
            !providerAbility || !isAcceptedRoundSkillProfileAbility(providerAbility) ||
            !switchEffect(providerAbility.effects[0]) ||
            providerAbility.effects[0]!.stateKey !== stateKey ||
            providerAbility.effects[0]!.profileKey !== profileKey ||
            enhanced.definitionId !== providerAbility.effects[0]!.enhancedDefinitionId) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
