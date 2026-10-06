import type { GameState } from '../schema/game';
import { getEnabledLocations } from '../core/map-engine';
import { spendMana } from '../core/rule-overrides';
import { shuffleOwnedDeckDeterministically } from './deterministic-deck-order';
import { isNormalCardDrawSuppressed } from './timed-resource-suppression';
import type {
  AttachedSupplyState,
  AuthoringAbility,
  EffectContext,
  MovementCompetitionSuppressionState,
  PlayerId,
  RoundLocationTerrainReplacementState,
  RuleNode,
} from './types';

export const ROUND_LOCATION_TERRAIN_REPLACEMENTS_EFFECT = 'round_location_terrain_replacements' as const;
export const ARM_MOVEMENT_COMPETITION_SUPPRESSION_EFFECT = 'arm_movement_competition_suppression' as const;
export const SEED_ATTACHED_SUPPLY_EFFECT = 'seed_attached_supply' as const;
export const PLAY_ATTACHED_SUPPLY_DEFINITION_EFFECT = 'play_attached_supply_definition' as const;

const PRIVILEGED = new Set<string>([
  ROUND_LOCATION_TERRAIN_REPLACEMENTS_EFFECT,
  ARM_MOVEMENT_COMPETITION_SUPPRESSION_EFFECT,
  SEED_ATTACHED_SUPPLY_EFFECT,
  PLAY_ATTACHED_SUPPLY_DEFINITION_EFFECT,
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
function id(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]{0,191}$/i.test(value);
}
function common(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && empty(ability.lifecycle) &&
    empty(ability.limit) && empty(ability.visibility) &&
    exact(ability.responseWindow, ['order', 'passBehavior']) &&
    ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window' &&
    ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) &&
    ability.execution.allowedOperations.length === 0 && ability.effects.length === 1;
}
function forced(ability: AuthoringAbility, trigger: string): boolean {
  return common(ability) && ability.kind === 'forced_trigger' &&
    exact(ability.activation, ['trigger']) && ability.activation.trigger === trigger;
}
function phaseAction(ability: AuthoringAbility): boolean {
  return common(ability) && ability.kind === 'phase_action' &&
    exact(ability.activation, ['phase', 'opens']) &&
    ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window';
}

export function isRoundLocationTerrainReplacementsEffect(effect: RuleNode): boolean {
  if (effect.type !== ROUND_LOCATION_TERRAIN_REPLACEMENTS_EFFECT ||
      effect.triggerLocationId !== 'magic_workshop' ||
      !Array.isArray(effect.replacements) || effect.replacements.length !== 2 ||
      !exact(effect, ['type', 'triggerLocationId', 'replacements'])) return false;
  const values = new Map<string, number>();
  for (const raw of effect.replacements) {
    if (!exact(raw, ['locationId', 'value']) || typeof raw.locationId !== 'string' ||
        !Number.isSafeInteger(raw.value)) return false;
    values.set(raw.locationId, Number(raw.value));
  }
  return values.size === 2 && values.get('miyama_town') === 3 && values.get('shinto') === 5;
}

export function isArmMovementCompetitionSuppressionEffect(effect: RuleNode): boolean {
  return effect.type === ARM_MOVEMENT_COMPETITION_SUPPRESSION_EFFECT &&
    effect.opponentCount === 2 && effect.suppresses === 'competition_vp' &&
    exact(effect, ['type', 'opponentCount', 'suppresses']);
}

export function isSeedAttachedSupplyEffect(effect: RuleNode): boolean {
  if (effect.type !== SEED_ATTACHED_SUPPLY_EFFECT || !Array.isArray(effect.cards) ||
      effect.cards.length !== 2 || !exact(effect, ['type', 'cards'])) return false;
  const entries = new Map<string, number>();
  for (const raw of effect.cards) {
    if (!exact(raw, ['definitionId', 'count']) || !id(raw.definitionId) ||
        !Number.isSafeInteger(raw.count) || Number(raw.count) < 1) return false;
    entries.set(String(raw.definitionId), Number(raw.count));
  }
  return entries.size === 2 && entries.get('basic.preparation') === 3 && entries.get('basic.surveil') === 2;
}

export function isPlayAttachedSupplyDefinitionEffect(effect: RuleNode): boolean {
  return effect.type === PLAY_ATTACHED_SUPPLY_DEFINITION_EFFECT && id(effect.definitionId) &&
    ['basic.preparation', 'basic.surveil'].includes(String(effect.definitionId)) &&
    effect.drawAfterPlay === 1 && effect.maxPerRound === 1 &&
    exact(effect, ['type', 'definitionId', 'drawAfterPlay', 'maxPerRound']);
}

export function isAcceptedRoundLocationSupplyAbility(ability: AuthoringAbility): boolean {
  const effect = ability.effects[0]; if (!effect) return false;
  if (isRoundLocationTerrainReplacementsEffect(effect)) return forced(ability, 'after_player_deployed_to_location');
  if (isArmMovementCompetitionSuppressionEffect(effect)) return forced(ability, 'after_controller_enters_location');
  if (isSeedAttachedSupplyEffect(effect)) return forced(ability, 'after_master_ascension_unlocked');
  if (isPlayAttachedSupplyDefinitionEffect(effect)) return phaseAction(ability);
  return false;
}

export function containsRoundLocationSupplyPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRoundLocationSupplyPrivilegedNode);
  if (!rec(value)) return false;
  if (PRIVILEGED.has(String(value.type))) return true;
  return Object.values(value).some(containsRoundLocationSupplyPrivilegedNode);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('ROUND_LOCATION_SUPPLY_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function abilityFor(state: GameState, sourceCardId: string, abilityId: string): AuthoringAbility | undefined {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  return source ? runtime(state).pack.cards[source.definitionId]?.abilities.find((ability) => ability.id === abilityId) : undefined;
}
function providerValid(
  state: GameState,
  controllerId: PlayerId,
  sourceCardId: string,
  abilityId: string,
  predicate?: (ability: AuthoringAbility) => boolean,
): boolean {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const ability = abilityFor(state, sourceCardId, abilityId);
  if (!source || source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId ||
      source.zone !== 'skill' || !ability || !isAcceptedRoundLocationSupplyAbility(ability)) return false;
  return predicate ? predicate(ability) : true;
}
function isBattlefield(state: GameState, locationId: string | undefined): boolean {
  return !!locationId && !!getEnabledLocations(state.map, state.locationConfig)
    .find((location) => location.id === locationId)?.tags.includes('battlefield');
}

function terrainStates(state: GameState): RoundLocationTerrainReplacementState[] {
  return runtime(state).roundLocationTerrainReplacements ??= [];
}
function honorStates(state: GameState): Record<PlayerId, MovementCompetitionSuppressionState> {
  return runtime(state).movementCompetitionSuppressions ??= {};
}
function supplyStates(state: GameState): Record<PlayerId, AttachedSupplyState> {
  return runtime(state).attachedSupplyByPlayer ??= {};
}

function terrainEffect(ability: AuthoringAbility): RuleNode | undefined {
  const effect = ability.effects[0]; return effect && isRoundLocationTerrainReplacementsEffect(effect) ? effect : undefined;
}
function honorEffect(ability: AuthoringAbility): RuleNode | undefined {
  const effect = ability.effects[0]; return effect && isArmMovementCompetitionSuppressionEffect(effect) ? effect : undefined;
}
function seedEffect(ability: AuthoringAbility): RuleNode | undefined {
  const effect = ability.effects[0]; return effect && isSeedAttachedSupplyEffect(effect) ? effect : undefined;
}
function playEffect(ability: AuthoringAbility): RuleNode | undefined {
  const effect = ability.effects[0]; return effect && isPlayAttachedSupplyDefinitionEffect(effect) ? effect : undefined;
}

function qualifyingOpponentCount(state: GameState, controllerId: PlayerId, locationId: string): number {
  return state.players.filter((player) => player.id !== controllerId && player.status === 'active' &&
    player.locationId === locationId).length;
}

function supplyRecordValid(state: GameState, record: AttachedSupplyState): boolean {
  if (!providerValid(state, record.controllerId, record.sourceCardId, record.seedAbilityId, (ability) => !!seedEffect(ability))) return false;
  if (record.definitionIds.length !== 5 ||
      record.definitionIds.filter((id) => id === 'basic.preparation').length !== 3 ||
      record.definitionIds.filter((id) => id === 'basic.surveil').length !== 2 ||
      record.cardInstanceIds.length !== 5 || new Set(record.cardInstanceIds).size !== 5) return false;
  for (let index = 0; index < record.cardInstanceIds.length; index += 1) {
    const card = state.cards.find((candidate) => candidate.instanceId === record.cardInstanceIds[index]);
    if (!card || card.definitionId !== record.definitionIds[index] ||
        card.ownerPlayerId !== record.controllerId || card.controllerPlayerId !== record.controllerId ||
        card.generatedBy !== record.sourceCardId) return false;
  }
  return record.lastPlayRound === undefined ||
    (Number.isSafeInteger(record.lastPlayRound) && record.lastPlayRound >= 1 && record.lastPlayRound <= state.round.roundNumber);
}

function drawOne(state: GameState, controllerId: PlayerId): void {
  if (isNormalCardDrawSuppressed(state, controllerId)) return;
  if (!state.cards.some((card) => card.ownerPlayerId === controllerId && card.zone === 'deck')) {
    const discard = state.cards.filter((card) => card.ownerPlayerId === controllerId && card.zone === 'discard');
    if (!discard.length) return;
    for (const card of discard) {
      card.zone = 'deck';
      card.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
    }
    shuffleOwnedDeckDeterministically(state, controllerId);
  }
  const drawn = state.cards.find((card) => card.ownerPlayerId === controllerId && card.zone === 'deck');
  if (!drawn) return;
  drawn.zone = 'hand';
  drawn.controllerPlayerId = controllerId;
  drawn.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
  runtime(state).events.push({
    type: 'card_drawn',
    playerId: controllerId,
    cardInstanceId: drawn.instanceId,
  });
}

export function canExecuteRoundLocationSupplyEffect(
  state: GameState,
  ctx: EffectContext,
  ability: AuthoringAbility,
): boolean {
  if (!isAcceptedRoundLocationSupplyAbility(ability) ||
      !providerValid(state, ctx.controllerId, ctx.sourceCardId, ctx.abilityId)) return false;
  const effect = ability.effects[0]!;
  if (isRoundLocationTerrainReplacementsEffect(effect)) {
    return ctx.event?.type === 'after_player_deployed_to_location' &&
      ctx.event.playerId === ctx.controllerId && ctx.event.locationId === effect.triggerLocationId;
  }
  if (isArmMovementCompetitionSuppressionEffect(effect)) {
    return ctx.event?.type === 'after_controller_enters_location' &&
      ctx.event.playerId === ctx.controllerId && typeof ctx.event.locationId === 'string' &&
      (ctx.event.movementKind === 'normal' || ctx.event.movementKind === 'effect');
  }
  if (isSeedAttachedSupplyEffect(effect)) {
    return ctx.event?.type === 'after_master_ascension_unlocked' &&
      ctx.event.playerId === ctx.controllerId && ctx.event.sourceCardId === ctx.sourceCardId;
  }
  if (isPlayAttachedSupplyDefinitionEffect(effect)) {
    const controller = state.players.find((player) => player.id === ctx.controllerId && player.status === 'active');
    const record = runtime(state).attachedSupplyByPlayer?.[ctx.controllerId];
    if (!controller || !record || !supplyRecordValid(state, record) ||
        record.sourceCardId !== ctx.sourceCardId || record.lastPlayRound === state.round.roundNumber ||
        state.round.activePhase !== 'action') return false;
    const target = state.cards.find((card) =>
      record.cardInstanceIds.includes(card.instanceId) && card.definitionId === effect.definitionId &&
      card.zone === 'attached_supply');
    const definition = target ? runtime(state).pack.cards[target.definitionId] : undefined;
    const printedCost = Number(definition?.cardFace.cost ?? Number.NaN);
    return !!target && definition?.cardType === 'basic_attack' &&
      Number.isSafeInteger(printedCost) && printedCost >= 0 && controller.mana >= printedCost;
  }
  return false;
}

export interface RoundLocationSupplyResolution {
  handled: boolean;
  playedCardInstanceId?: string;
}

export function resolveRoundLocationSupplyEffect(
  state: GameState,
  ctx: EffectContext,
  ability: AuthoringAbility,
): RoundLocationSupplyResolution {
  if (!canExecuteRoundLocationSupplyEffect(state, ctx, ability)) return { handled: false };
  const effect = ability.effects[0]!;
  if (isRoundLocationTerrainReplacementsEffect(effect)) {
    const replacements = Object.fromEntries((effect.replacements as RuleNode[])
      .map((entry) => [String(entry.locationId), Number(entry.value)]));
    const records = terrainStates(state).filter((entry) =>
      !(entry.controllerId === ctx.controllerId && entry.sourceCardId === ctx.sourceCardId &&
        entry.abilityId === ctx.abilityId && entry.round === state.round.roundNumber));
    records.push({
      controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
      round: state.round.roundNumber, triggerEventId: ctx.event!.id, replacements,
    });
    runtime(state).roundLocationTerrainReplacements = records;
    return { handled: true };
  }
  if (isArmMovementCompetitionSuppressionEffect(effect)) {
    const store = honorStates(state);
    delete store[ctx.controllerId];
    const locationId = String(ctx.event!.locationId);
    if (isBattlefield(state, locationId) &&
        qualifyingOpponentCount(state, ctx.controllerId, locationId) === Number(effect.opponentCount)) {
      store[ctx.controllerId] = {
        controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
        round: state.round.roundNumber, battlefieldId: locationId, movementEventId: ctx.event!.id,
      };
    }
    return { handled: true };
  }
  if (isSeedAttachedSupplyEffect(effect)) {
    const existing = runtime(state).attachedSupplyByPlayer?.[ctx.controllerId];
    if (existing) {
      if (!supplyRecordValid(state, existing) || existing.sourceCardId !== ctx.sourceCardId) {
        throw new Error('ATTACHED_SUPPLY_PROVIDER_CONFLICT');
      }
      return { handled: true };
    }
    const definitionIds = (effect.cards as RuleNode[]).flatMap((entry) =>
      Array.from({ length: Number(entry.count) }, () => String(entry.definitionId)));
    for (const definitionId of definitionIds) {
      const definition = runtime(state).pack.cards[definitionId];
      if (!definition || definition.cardType !== 'basic_attack') throw new Error('ATTACHED_SUPPLY_DEFINITION_INVALID');
    }
    const cardInstanceIds = definitionIds.map((definitionId, index) => {
      const instanceId = `${ctx.sourceCardId}:attached-supply:${index + 1}`;
      if (state.cards.some((card) => card.instanceId === instanceId)) throw new Error('ATTACHED_SUPPLY_INSTANCE_COLLISION');
      state.cards.push({
        instanceId, definitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId,
        zone: 'attached_supply', visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId },
        generatedBy: ctx.sourceCardId,
      });
      runtime(state).cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
      return instanceId;
    });
    supplyStates(state)[ctx.controllerId] = {
      controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, seedAbilityId: ctx.abilityId,
      definitionIds, cardInstanceIds, initializedRevision: runtime(state).revision,
    };
    return { handled: true };
  }
  if (isPlayAttachedSupplyDefinitionEffect(effect)) {
    const record = supplyStates(state)[ctx.controllerId]!;
    const target = state.cards.find((card) =>
      record.cardInstanceIds.includes(card.instanceId) && card.definitionId === effect.definitionId &&
      card.zone === 'attached_supply');
    if (!target) throw new Error('ATTACHED_SUPPLY_TARGET_MISSING');
    const definition = runtime(state).pack.cards[target.definitionId]!;
    const printedCost = Number(definition.cardFace.cost ?? 0);
    spendMana(state, ctx.controllerId, printedCost);
    target.zone = 'attack_area';
    target.visibility = { scope: 'public' };
    runtime(state).cardState[target.instanceId] = {
      ...(runtime(state).cardState[target.instanceId] ?? { active: false, faceDown: false }),
      active: true, faceDown: false, playedRound: state.round.roundNumber,
    };
    runtime(state).cardPlayCountByInstance ??= {};
    runtime(state).cardPlayCountByInstance![target.instanceId] =
      (runtime(state).cardPlayCountByInstance![target.instanceId] ?? 0) + 1;
    if (runtime(state).playCounters.round !== state.round.roundNumber) {
      runtime(state).playCounters = { round: state.round.roundNumber, cardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} };
    }
    runtime(state).playCounters.cardsPlayedByPlayer[ctx.controllerId] =
      (runtime(state).playCounters.cardsPlayedByPlayer[ctx.controllerId] ?? 0) + 1;
    record.lastPlayRound = state.round.roundNumber;
    if (Number(effect.drawAfterPlay) === 1) drawOne(state, ctx.controllerId);
    return { handled: true, playedCardInstanceId: target.instanceId };
  }
  return { handled: false };
}

export function roundLocationTerrainReplacement(
  state: GameState,
  controllerId: PlayerId,
  locationId: string,
): number | undefined {
  const entries = (state.abilityRuntime?.roundLocationTerrainReplacements ?? []).filter((entry) =>
    entry.controllerId === controllerId && entry.round === state.round.roundNumber &&
    providerValid(state, entry.controllerId, entry.sourceCardId, entry.abilityId, (ability) => !!terrainEffect(ability)));
  if (entries.length !== 1) return undefined;
  const value = entries[0]!.replacements[locationId];
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : undefined;
}

export function movementCompetitionRewardSuppressed(
  state: GameState,
  controllerId: PlayerId,
  battlefieldId: string,
): boolean {
  const marker = state.abilityRuntime?.movementCompetitionSuppressions?.[controllerId];
  return !!marker && marker.round === state.round.roundNumber && marker.battlefieldId === battlefieldId &&
    providerValid(state, marker.controllerId, marker.sourceCardId, marker.abilityId, (ability) => !!honorEffect(ability));
}

export function settleMovementCompetitionSuppression(
  state: GameState,
  event: { type: string; battlefieldId?: string; battleParticipantIds?: PlayerId[] },
): void {
  if (event.type !== 'after_battle_result_determined' || !event.battlefieldId || !state.abilityRuntime) return;
  const participants = new Set(event.battleParticipantIds ?? []);
  for (const [controllerId, marker] of Object.entries(state.abilityRuntime.movementCompetitionSuppressions ?? {})) {
    if (marker.round === state.round.roundNumber && marker.battlefieldId === event.battlefieldId &&
        participants.has(controllerId)) delete state.abilityRuntime.movementCompetitionSuppressions![controllerId];
  }
}

export function cleanupRoundLocationSupplyAtRoundEnd(state: GameState): void {
  const r = state.abilityRuntime;
  if (!r) return;
  const round = state.round.roundNumber;
  r.roundLocationTerrainReplacements = (r.roundLocationTerrainReplacements ?? [])
    .filter((entry) => entry.round > round);
  for (const [controllerId, marker] of Object.entries(r.movementCompetitionSuppressions ?? {})) {
    if (marker.round <= round) delete r.movementCompetitionSuppressions![controllerId];
  }
}

export function attachedSupplyStateForPlayer(state: GameState, controllerId: PlayerId): AttachedSupplyState | undefined {
  const record = state.abilityRuntime?.attachedSupplyByPlayer?.[controllerId];
  return record && supplyRecordValid(state, record) ? record : undefined;
}

export function isRoundLocationSupplyRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const r = state.abilityRuntime; if (!r) return true;
    const players = new Set(state.players.map((player) => player.id));
    const locations = new Set<string>(getEnabledLocations(state.map, state.locationConfig).map((location) => location.id));
    for (const entry of r.roundLocationTerrainReplacements ?? []) {
      if (!players.has(entry.controllerId) || !providerValid(state, entry.controllerId, entry.sourceCardId, entry.abilityId, (a) => !!terrainEffect(a)) ||
          !Number.isSafeInteger(entry.round) || entry.round < state.round.roundNumber - 1 || entry.round > state.round.roundNumber ||
          typeof entry.triggerEventId !== 'string' || !r.processedEvents.includes(entry.triggerEventId) ||
          Object.keys(entry.replacements).length !== 2 || entry.replacements.miyama_town !== 3 || entry.replacements.shinto !== 5) return false;
    }
    for (const [controllerId, entry] of Object.entries(r.movementCompetitionSuppressions ?? {})) {
      if (controllerId !== entry.controllerId || !players.has(controllerId) || !locations.has(entry.battlefieldId) ||
          !isBattlefield(state, entry.battlefieldId) ||
          !providerValid(state, controllerId, entry.sourceCardId, entry.abilityId, (a) => !!honorEffect(a)) ||
          !Number.isSafeInteger(entry.round) || entry.round !== state.round.roundNumber ||
          typeof entry.movementEventId !== 'string' || !r.processedEvents.includes(entry.movementEventId)) return false;
    }
    for (const [controllerId, entry] of Object.entries(r.attachedSupplyByPlayer ?? {})) {
      if (controllerId !== entry.controllerId || !players.has(controllerId) || !supplyRecordValid(state, entry) ||
          !Number.isSafeInteger(entry.initializedRevision) || entry.initializedRevision < 0 ||
          entry.initializedRevision > r.revision) return false;
    }
    return true;
  } catch {
    return false;
  }
}
