import type { GameState } from '../schema/game';
import type { AbilityEvent, WodimeGodLegacyLocationState } from './types';
import type { LocationId } from '../schema/location';
import { terrainAdvantageAtLocation } from './terrain-advantage-override';
import { grantMana } from '../core/rule-overrides';

const SOURCE_DEFINITION = 'master.wodime.skill.s3';
const SOURCE_ABILITY = 'wodime.god-legacy';
const ATLANTIS_EVENT = 'event.wodime.atlantis.hephaestus';

function runtime(state: GameState) { return state.abilityRuntime!; }

function source(state: GameState): { cardId: string; playerId: string } | undefined {
  const activation = runtime(state).wodimeGodLegacyActivation;
  if (activation) {
    const physical = state.cards.find((candidate) => candidate.instanceId === activation.sourceCardId);
    if (!physical || physical.definitionId !== SOURCE_DEFINITION || physical.ownerPlayerId !== activation.controllerId ||
        physical.controllerPlayerId !== activation.controllerId || activation.abilityId !== SOURCE_ABILITY || activation.lifecycle !== 'game') return undefined;
    return { cardId: activation.sourceCardId, playerId: activation.controllerId };
  }
  for (const physical of state.cards) {
    if (physical.definitionId !== SOURCE_DEFINITION || physical.zone !== 'skill') continue;
    const owner = state.players.find((player) => player.id === physical.ownerPlayerId);
    if (!owner || physical.ownerPlayerId !== physical.controllerPlayerId) continue;
    const ability = runtime(state).pack.cards[physical.definitionId]?.abilities.find((entry) => entry.id === SOURCE_ABILITY);
    if (!ability) continue;
    return { cardId: physical.instanceId, playerId: owner.id };
  }
  return undefined;
}

function ensureActivated(state: GameState, triggerEventId?: string, provisionPlacements = true): boolean {
  const origin = source(state);
  if (!origin) return false;
  const r = runtime(state);
  r.wodimeGodLegacyByLocation ??= {};
  r.wodimeGodLegacyByPlayer ??= {};
  r.wodimeGodLegacyProcessedPlacementIds ??= {};
  r.wodimeGodLegacyPlacementProvenance ??= {};
  r.wodimeGodLegacyPlacementLineage ??= {};
  if (!r.wodimeGodLegacyActivation) {
    r.wodimeGodLegacyActivation = { sourceCardId: origin.cardId, controllerId: origin.playerId, abilityId: SOURCE_ABILITY, activatedRound: state.round.roundNumber, lifecycle: 'game' };
  }
  if (!provisionPlacements || !triggerEventId) return true;
  for (const [index, placement] of state.eventPlacements.entries()) {
    if (placement.eventCardId !== ATLANTIS_EVENT) continue;
    const placementId = placement.ruleInstanceId ?? `wodime-god-legacy:${placement.eventCardId}:${placement.locationId}:${index}`;
    if (!placement.ruleInstanceId) placement.ruleInstanceId = placementId;
    if (r.wodimeGodLegacyProcessedPlacementIds[placementId]) {
      // A restored runtime may contain the legacy boolean marker but not the
      // richer record. Reconstruct it only from the currently present,
      // canonical Hephaestus placement; arbitrary IDs are never accepted by
      // the restore validator below.
      r.wodimeGodLegacyPlacementLineage[placementId] ??= {
        locationId: placement.locationId, eventCardId: placement.eventCardId,
        sourceCardId: origin.cardId, controllerId: origin.playerId, grantedTokens: 3,
        activatedRound: r.wodimeGodLegacyActivation.activatedRound, triggerEventId,
      };
      r.wodimeGodLegacyPlacementProvenance[placementId] ??= {
        locationId: placement.locationId, eventCardId: placement.eventCardId,
        sourceCardId: origin.cardId, controllerId: origin.playerId, grantedTokens: 3,
        activatedRound: r.wodimeGodLegacyActivation.activatedRound, triggerEventId,
      };
      if (triggerEventId && !r.events.some((event) => event.type === 'wodime_god_legacy_placement_provisioned' &&
          event.wodimePlacementId === placementId)) {
        r.events.push({ type: 'wodime_god_legacy_placement_provisioned', sourceCardId: origin.cardId,
          abilityId: SOURCE_ABILITY, controllerId: origin.playerId, visibility: 'public',
          wodimePlacementId: placementId, wodimePlacementLocationId: placement.locationId,
          wodimePlacementEventCardId: placement.eventCardId, grantedTokens: 3, triggerEventId });
      }
      continue;
    }
    const entry = r.wodimeGodLegacyByLocation[placement.locationId] ?? {
      locationId: placement.locationId, tokens: 0, sourceCardId: origin.cardId, abilityId: SOURCE_ABILITY,
      activatedRound: state.round.roundNumber, lifecycle: 'game' as const,
    };
    entry.tokens += 3;
    r.wodimeGodLegacyByLocation[placement.locationId] = entry;
    r.wodimeGodLegacyProcessedPlacementIds[placementId] = true;
    r.wodimeGodLegacyPlacementLineage[placementId] = {
      locationId: placement.locationId, eventCardId: placement.eventCardId,
      sourceCardId: origin.cardId, controllerId: origin.playerId, grantedTokens: 3,
      activatedRound: r.wodimeGodLegacyActivation.activatedRound, triggerEventId,
    };
    r.wodimeGodLegacyPlacementProvenance[placementId] = {
      locationId: placement.locationId, eventCardId: placement.eventCardId,
      sourceCardId: origin.cardId, controllerId: origin.playerId, grantedTokens: 3,
      activatedRound: r.wodimeGodLegacyActivation.activatedRound, triggerEventId,
    };
    r.events.push({ type: 'wodime_god_legacy_placement_provisioned', sourceCardId: origin.cardId,
      abilityId: SOURCE_ABILITY, controllerId: origin.playerId, visibility: 'public',
      wodimePlacementId: placementId, wodimePlacementLocationId: placement.locationId,
      wodimePlacementEventCardId: placement.eventCardId, grantedTokens: 3, triggerEventId });
  }
  // The state is still authoritative even when no Hephaestus card is currently placed;
  // later event resolution may add a location entry through the same source contract.
  return true;
}

/** Called by the scoring transition after a player status changes to eliminated. */
export function activateWodimeGodLegacyOnElimination(state: GameState, playerId: string): void {
  if (!state.abilityRuntime) return;
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.status !== 'eliminated') return;
  // Elimination only establishes the persistent activation. Placement grants
  // still require a real processed event and therefore cannot be forged by a
  // status transition or a saved-state marker.
  ensureActivated(state, undefined, false);
}

function audit(state: GameState, event: AbilityEvent, playerId: string, sourceCardId: string): void {
  runtime(state).events.push({
    type: event.type === 'after_battle_result_determined' ? 'wodime_god_legacy_battle_transfer' : 'wodime_god_legacy_location_carry',
    playerId,
    controllerId: playerId,
    sourceCardId,
    abilityId: SOURCE_ABILITY,
    visibility: playerId,
  });
}

export function settleWodimeGodLegacyEvent(state: GameState, event: AbilityEvent): void {
  if (!['after_battle_result_determined', 'after_controller_enters_location', 'event_activated'].includes(event.type)) return;
  if (!ensureActivated(state, event.id, true)) return;
  const r = runtime(state);
  const origin = source(state);
  if (!origin) return;
  r.wodimeGodLegacyByPlayer ??= {};
  if (event.type === 'after_battle_result_determined' && event.battlefieldId && event.battleResult?.winners?.length === 1) {
    const location = r.wodimeGodLegacyByLocation?.[event.battlefieldId];
    const winner = event.battleResult.winners[0]!;
    if (location && location.tokens > 0 && state.players.some((player) => player.id === winner && player.status === 'active')) {
      r.wodimeGodLegacyByPlayer[winner] = (r.wodimeGodLegacyByPlayer[winner] ?? 0) + location.tokens;
      location.tokens = 0;
      audit(state, event, winner, origin.cardId);
    }
  }
  if (event.type === 'after_controller_enters_location' && event.playerId && event.previousLocationId) {
    const location = r.wodimeGodLegacyByLocation?.[event.previousLocationId];
    const player = state.players.find((candidate) => candidate.id === event.playerId);
    if (!location || !player || location.tokens <= 0) return;
    if (!state.map.locations.some((candidate) => candidate.id === event.previousLocationId)) return;
    const carry = Math.max(0, Math.min(location.tokens, Math.floor(terrainAdvantageAtLocation(state, event.playerId, event.previousLocationId as LocationId))));
    if (carry > 0) {
      location.tokens -= carry;
      r.wodimeGodLegacyByPlayer[event.playerId] = (r.wodimeGodLegacyByPlayer[event.playerId] ?? 0) + carry;
      audit(state, event, event.playerId, origin.cardId);
    }
  }
}

export function isWodimeGodLegacyRuntimeStateValid(state: GameState): boolean {
  const r = state.abilityRuntime;
  if (!r) return true;
  const players = new Set(state.players.map((player) => player.id));
  const locations = new Set<string>(state.map.locations.map((location) => location.id));
  if (r.wodimeGodLegacyByPlayer && Object.entries(r.wodimeGodLegacyByPlayer).some(([id, value]) => !players.has(id) || !Number.isSafeInteger(value) || value < 0)) return false;
  if (!r.wodimeGodLegacyByLocation) {
    return Object.keys(r.wodimeGodLegacyProcessedPlacementIds ?? {}).length === 0 &&
      Object.keys(r.wodimeGodLegacyPlacementProvenance ?? {}).length === 0 &&
      Object.keys(r.wodimeGodLegacyByPlayer ?? {}).length === 0 && !r.wodimeGodLegacyActivation;
  }
  const activation = r.wodimeGodLegacyActivation;
  if (!activation && Object.keys(r.wodimeGodLegacyByLocation).length === 0 && Object.keys(r.wodimeGodLegacyByPlayer ?? {}).length === 0 &&
      Object.keys(r.wodimeGodLegacyProcessedPlacementIds ?? {}).length === 0 && Object.keys(r.wodimeGodLegacyPlacementProvenance ?? {}).length === 0) return true;
  if (!activation || activation.abilityId !== SOURCE_ABILITY || activation.lifecycle !== 'game' || !players.has(activation.controllerId) ||
      !Number.isSafeInteger(activation.activatedRound) || activation.activatedRound < 1 ||
      !state.cards.some((card) => card.instanceId === activation.sourceCardId && card.definitionId === SOURCE_DEFINITION &&
        card.ownerPlayerId === activation.controllerId && card.controllerPlayerId === activation.controllerId)) return false;
  const processed = r.wodimeGodLegacyProcessedPlacementIds ?? {};
  const provenance = r.wodimeGodLegacyPlacementProvenance ?? {};
  const lineage = r.wodimeGodLegacyPlacementLineage ?? {};
  if (Object.keys(processed).some((id) => !provenance[id] || !lineage[id]) ||
      Object.keys(provenance).some((id) => !processed[id] || !lineage[id]) ||
      Object.keys(lineage).some((id) => !processed[id] || !provenance[id])) return false;
  const provisionEvents = r.events.filter((event) => event.type === 'wodime_god_legacy_placement_provisioned');
  const provisionIds = new Set<string>();
  for (const event of provisionEvents) {
    const id = event.wodimePlacementId;
    if (typeof id !== 'string' || provisionIds.has(id) || !provenance[id] ||
        event.sourceCardId !== activation.sourceCardId || event.abilityId !== SOURCE_ABILITY ||
        event.controllerId !== activation.controllerId || event.visibility !== 'public' ||
        event.wodimePlacementEventCardId !== provenance[id]!.eventCardId ||
        event.wodimePlacementLocationId !== provenance[id]!.locationId || event.grantedTokens !== 3 ||
        event.triggerEventId !== provenance[id]!.triggerEventId) return false;
    provisionIds.add(id);
  }
  if (provisionIds.size !== Object.keys(provenance).length ||
      Object.entries(provenance).some(([id, record]) => !isAuthenticatedPlacementRecord(state, id, record, activation, provisionEvents, lineage[id]!))) return false;
  const grantedByLocation: Record<string, number> = {};
  for (const record of Object.values(provenance)) grantedByLocation[record.locationId] = (grantedByLocation[record.locationId] ?? 0) + record.grantedTokens;
  return Object.entries(r.wodimeGodLegacyByLocation).every(([id, entry]) => id === entry.locationId && locations.has(id) &&
    Number.isSafeInteger(entry.tokens) && entry.tokens >= 0 && typeof entry.sourceCardId === 'string' && entry.abilityId === SOURCE_ABILITY &&
    entry.lifecycle === 'game' && Number.isSafeInteger(entry.activatedRound) && entry.activatedRound >= 1 &&
    entry.sourceCardId === activation.sourceCardId && grantedByLocation[id] !== undefined && entry.tokens <= grantedByLocation[id]!) &&
    Object.entries(r.wodimeGodLegacyByPlayer ?? {}).every(([id, tokens]) => players.has(id) && Number.isSafeInteger(tokens) && tokens >= 0) &&
    (Object.values(r.wodimeGodLegacyByLocation).reduce((sum, entry) => sum + entry.tokens, 0) +
      Object.values(r.wodimeGodLegacyByPlayer ?? {}).reduce((sum, tokens) => sum + tokens, 0)) <=
      Object.values(provenance).reduce((sum, record) => sum + record.grantedTokens, 0);
}

function isAuthenticatedPlacementRecord(
  state: GameState,
  placementId: string,
  record: NonNullable<NonNullable<GameState['abilityRuntime']>['wodimeGodLegacyPlacementProvenance']>[string],
  activation: NonNullable<NonNullable<GameState['abilityRuntime']>['wodimeGodLegacyActivation']>,
  provisionEvents: Array<NonNullable<GameState['abilityRuntime']>['events'][number]>,
  lineage: NonNullable<NonNullable<GameState['abilityRuntime']>['wodimeGodLegacyPlacementLineage']>[string],
): boolean {
  if (!placementId || record.eventCardId !== ATLANTIS_EVENT || record.sourceCardId !== activation.sourceCardId ||
      record.controllerId !== activation.controllerId || record.grantedTokens !== 3 || !Number.isSafeInteger(record.activatedRound) ||
      record.activatedRound !== activation.activatedRound || !record.triggerEventId || !state.abilityRuntime?.processedEvents.includes(record.triggerEventId) ||
      !state.map.locations.some((location) => location.id === record.locationId)) return false;
  if (JSON.stringify(record) !== JSON.stringify(lineage)) return false;
  const audit = provisionEvents.find((event) => event.wodimePlacementId === placementId);
  if (!audit || audit.sourceCardId !== activation.sourceCardId || audit.abilityId !== SOURCE_ABILITY ||
      audit.controllerId !== activation.controllerId || audit.visibility !== 'public' ||
      audit.wodimePlacementLocationId !== record.locationId || audit.wodimePlacementEventCardId !== record.eventCardId ||
      audit.grantedTokens !== record.grantedTokens || audit.triggerEventId !== record.triggerEventId) return false;
  const live = state.eventPlacements.some((placement) => placement.ruleInstanceId === placementId &&
    placement.eventCardId === record.eventCardId && placement.locationId === record.locationId);
  return live || audit.wodimePlacementId === placementId;
}

export function wodimeGodLegacyActions(state: GameState, playerId: string): Array<{ type: 'wodime_god_legacy_action'; mode: 'power' | 'mana'; amount: number }> {
  if (state.round.activePhase !== 'action' || state.players.find((player) => player.id === playerId)?.status !== 'active' ||
      state.players.find((player) => player.id === playerId)?.seat !== state.players.find((player) => player.seat === state.round.prioritySeat)?.seat) return [];
  const tokens = runtime(state).wodimeGodLegacyByPlayer?.[playerId] ?? 0;
  const result: Array<{ type: 'wodime_god_legacy_action'; mode: 'power' | 'mana'; amount: number }> = [];
  for (let amount = 1; amount <= Math.min(3, Math.floor(tokens / 3)); amount++) result.push({ type: 'wodime_god_legacy_action', mode: 'power', amount });
  for (let amount = 1; amount <= Math.floor(tokens / 4); amount++) result.push({ type: 'wodime_god_legacy_action', mode: 'mana', amount });
  return result;
}

export function executeWodimeGodLegacyAction(state: GameState, playerId: string, mode: 'power' | 'mana', amount: number): boolean {
  const action = wodimeGodLegacyActions(state, playerId).find((candidate) => candidate.mode === mode && candidate.amount === amount);
  if (!action || !Number.isSafeInteger(amount) || amount < 1) return false;
  const r = runtime(state); const tokens = r.wodimeGodLegacyByPlayer?.[playerId] ?? 0; const cost = mode === 'power' ? amount * 3 : amount * 4;
  if (tokens < cost) return false;
  r.wodimeGodLegacyByPlayer![playerId] = tokens - cost;
  if (mode === 'mana') grantMana(state, playerId, amount, {
    source: 'generic', controllerId: r.wodimeGodLegacyActivation!.controllerId,
    sourceCardId: r.wodimeGodLegacyActivation!.sourceCardId, abilityId: SOURCE_ABILITY,
  });
  else {
    r.roundPlayerPowerAdjustments ??= [];
    r.roundPlayerPowerAdjustments.push({ playerId, amount, round: state.round.roundNumber, sourceCardId: r.wodimeGodLegacyActivation!.sourceCardId, abilityId: SOURCE_ABILITY });
  }
  r.events.push({ type: mode === 'power' ? 'wodime_god_legacy_power_paid' : 'wodime_god_legacy_mana_paid', playerId, controllerId: playerId,
    sourceCardId: r.wodimeGodLegacyActivation!.sourceCardId, abilityId: SOURCE_ABILITY, visibility: playerId });
  return true;
}
