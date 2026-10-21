import type { GameState } from '../schema/game';
import type { AbilityEvent } from './types';
import { canonicalEventPlacementMetadata } from './canonical-event-placement';

const SOURCE_DEFINITION = 'master.wodime.skill.s4';
const SOURCE_ABILITY = 'wodime.atlantis';
const ATLANTIS_PREFIX = 'event.wodime.atlantis.';

function runtime(state: GameState) { return state.abilityRuntime!; }

function sourceCard(state: GameState): { instanceId: string; controllerId: string } | undefined {
  for (const card of state.cards) {
    if (card.definitionId !== SOURCE_DEFINITION || card.zone !== 'skill') continue;
    const ability = runtime(state).pack.cards[card.definitionId]?.abilities.find((entry) => entry.id === SOURCE_ABILITY);
    if (ability && card.ownerPlayerId === card.controllerPlayerId) return { instanceId: card.instanceId, controllerId: card.controllerPlayerId };
  }
  return undefined;
}

function shuffleInPlace(items: string[], seed: number): void {
  let x = (seed >>> 0) || 1;
  for (let i = items.length - 1; i > 0; i--) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const j = x % (i + 1);
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
}

function isBattlefield(state: GameState, locationId: string): boolean {
  return state.map.locations.some((location) => location.id === locationId && location.tags.includes('battlefield'));
}

function replacementPlacement(state: GameState, old: GameState['eventPlacements'][number], eventCardId: string): GameState['eventPlacements'][number] {
  const ruleInstanceId = `wodime-atlantis-replacement:${++runtime(state).sequence}`;
  return { ...old, ...canonicalEventPlacementMetadata(eventCardId), locationId: old.locationId, eventCardId, ruleInstanceId, visibility: { scope: 'public', revealReason: 'wodime_atlantis_replacement' } };
}

function replaceAtLocation(state: GameState, old: GameState['eventPlacements'][number]): AbilityEvent | undefined {
  const source = sourceCard(state);
  if (!source) return undefined;
  state.eventDeck ??= [];
  // Return the consumed physical card to the deck only after drawing. This
  // prevents an immediate redraw of the same physical card while preserving
  // normal shuffled draws for every other card. If it is the only card, the
  // new placement still receives a fresh physical ruleInstanceId and a real
  // event_activated dispatch; the bounded pending queue is the explicit
  // continuation boundary rather than a silent terminal.
  const sameCardIndex = state.eventDeck.indexOf(old.eventCardId);
  if (sameCardIndex >= 0) state.eventDeck.splice(sameCardIndex, 1);
  shuffleInPlace(state.eventDeck, state.round.roundNumber + state.eventPlacements.length + runtime(state).revision);
  const replacementId = state.eventDeck.shift() ?? old.eventCardId;
  state.eventDeck.push(old.eventCardId);
  const replacement = replacementPlacement(state, old, replacementId);
  state.eventPlacements.push(replacement);
  const sourceCardId = replacement.ruleInstanceId;
  if (!sourceCardId) return undefined;
  return { id: `${old.ruleInstanceId ?? 'wodime-atlantis'}:replacement:${++runtime(state).sequence}`, type: 'event_activated', sourceCardId,
    revealedKind: 'event', revealedId: replacement.eventCardId, locationId: replacement.locationId };
}

export function settleWodimeAtlantisEvent(state: GameState, event: AbilityEvent): AbilityEvent[] {
  const source = sourceCard(state);
  if (!source) return [];
  const r = runtime(state);
  r.wodimeAtlantisHandledEventPlacementIds ??= {};
  r.wodimeAtlantisPendingBattlefieldRemovalIds ??= {};
  r.wodimeAtlantisConsumedEventPlacementIds ??= {};
  r.wodimeAtlantisPlacementProvenance ??= {};
  if (event.type === 'event_activated') {
    if (!event.revealedId?.startsWith(ATLANTIS_PREFIX) || !event.locationId || !event.sourceCardId) return [];
    const placement = state.eventPlacements.find((entry) => entry.ruleInstanceId === event.sourceCardId);
    if (!placement || placement.eventCardId !== event.revealedId || placement.locationId !== event.locationId || r.wodimeAtlantisHandledEventPlacementIds[event.sourceCardId]) return [];
    r.wodimeAtlantisHandledEventPlacementIds[event.sourceCardId] = true;
    r.wodimeAtlantisPlacementProvenance[event.sourceCardId] = {
      eventCardId: placement.eventCardId, locationId: placement.locationId,
      sourceCardId: source.instanceId, controllerId: source.controllerId,
    };
    r.events.push({ type: 'wodime_atlantis_placement_handled', sourceCardId: source.instanceId,
      abilityId: SOURCE_ABILITY, controllerId: source.controllerId, visibility: 'public',
      wodimePlacementId: event.sourceCardId, wodimePlacementLocationId: placement.locationId,
      wodimePlacementEventCardId: placement.eventCardId });
    if (isBattlefield(state, placement.locationId)) {
      // Keep the placement through combat so its authored modifiers resolve; remove it at battle close.
      r.wodimeAtlantisPendingBattlefieldRemovalIds[event.sourceCardId] = true;
      return [];
    }
    const index = state.eventPlacements.findIndex((entry) => entry.ruleInstanceId === event.sourceCardId);
    if (index < 0) return [];
    const [removed] = state.eventPlacements.splice(index, 1);
    r.wodimeAtlantisConsumedEventPlacementIds[event.sourceCardId] = true;
    const replacement = replaceAtLocation(state, removed!);
    return replacement ? [replacement] : [];
  }
  if (event.type === 'after_battle_ended' && event.battlefieldId) {
    const replacements: AbilityEvent[] = [];
    for (const placement of [...state.eventPlacements]) {
      if (placement.locationId !== event.battlefieldId || !placement.ruleInstanceId || !r.wodimeAtlantisPendingBattlefieldRemovalIds[placement.ruleInstanceId]) continue;
      state.eventPlacements = state.eventPlacements.filter((entry) => entry.ruleInstanceId !== placement.ruleInstanceId);
      delete r.wodimeAtlantisPendingBattlefieldRemovalIds[placement.ruleInstanceId];
      r.wodimeAtlantisConsumedEventPlacementIds[placement.ruleInstanceId] = true;
      const replacement = replaceAtLocation(state, placement);
      if (replacement) replacements.push(replacement);
    }
    return replacements;
  }
  return [];
}

export function isWodimeAtlantisRuntimeStateValid(state: GameState): boolean {
  const r = state.abilityRuntime;
  if (!r) return true;
  const hasLineage = [r.wodimeAtlantisHandledEventPlacementIds, r.wodimeAtlantisPendingBattlefieldRemovalIds, r.wodimeAtlantisConsumedEventPlacementIds]
    .some((record) => record && Object.keys(record).length > 0);
  if (hasLineage && !sourceCard(state)) return false;
  const source = sourceCard(state);
  const provenance = r.wodimeAtlantisPlacementProvenance ?? {};
  const handled = r.wodimeAtlantisHandledEventPlacementIds ?? {};
  if (Object.keys(handled).some((id) => !provenance[id]) || Object.keys(provenance).some((id) => !handled[id])) return false;
  const auditIds = new Set(r.events.filter((event) => event.type === 'wodime_atlantis_placement_handled')
    .map((event) => event.wodimePlacementId).filter((id): id is string => typeof id === 'string'));
  for (const [id, record] of Object.entries(provenance)) {
    if (!source || record.sourceCardId !== source.instanceId || record.controllerId !== source.controllerId ||
        !record.eventCardId.startsWith(ATLANTIS_PREFIX) || !state.map.locations.some((location) => location.id === record.locationId)) return false;
    const live = state.eventPlacements.some((placement) => placement.ruleInstanceId === id && placement.eventCardId === record.eventCardId && placement.locationId === record.locationId);
    if (!live && !auditIds.has(id)) return false;
  }
  for (const record of [r.wodimeAtlantisHandledEventPlacementIds, r.wodimeAtlantisPendingBattlefieldRemovalIds, r.wodimeAtlantisConsumedEventPlacementIds]) {
    if (record && Object.values(record).some((value) => value !== true)) return false;
    if (record === r.wodimeAtlantisPendingBattlefieldRemovalIds && record && Object.keys(record).some((id) => {
      const placement = state.eventPlacements.find((candidate) => candidate.ruleInstanceId === id);
      return !placement || !isBattlefield(state, placement.locationId) || placement.eventCardId !== provenance[id]?.eventCardId;
    })) return false;
  }
  const terminalIds = r.wodimeAtlantisReplacementTerminalIds ?? {};
  const terminalAudits = r.events.filter((event) => event.type === 'wodime_atlantis_replacement_terminal');
  for (const id of Object.keys(terminalIds)) {
    const provenanceRecord = provenance[id];
    if (terminalIds[id] !== true || !provenanceRecord || !r.wodimeAtlantisConsumedEventPlacementIds?.[id] ||
        state.eventPlacements.some((placement) => placement.ruleInstanceId === id)) return false;
    const audit = terminalAudits.filter((event) => event.wodimePlacementId === id);
    if (audit.length !== 1 || audit[0]!.sourceCardId !== source?.instanceId || audit[0]!.abilityId !== SOURCE_ABILITY ||
        audit[0]!.controllerId !== source?.controllerId || audit[0]!.visibility !== 'public' ||
        audit[0]!.wodimePlacementLocationId !== provenanceRecord.locationId ||
        audit[0]!.wodimePlacementEventCardId !== provenanceRecord.eventCardId) return false;
  }
  if (terminalAudits.some((event) => typeof event.wodimePlacementId !== 'string' || !terminalIds[event.wodimePlacementId])) return false;
  if (r.wodimeAtlantisPendingReplacementEvents !== undefined) {
    const pendingIds = new Set<string>();
    const pendingPlacementIds = new Set<string>();
    for (const event of r.wodimeAtlantisPendingReplacementEvents) {
      if (event.type !== 'event_activated' || typeof event.id !== 'string' || pendingIds.has(event.id) ||
          typeof event.sourceCardId !== 'string' || typeof event.revealedId !== 'string' || typeof event.locationId !== 'string' ||
          !event.sourceCardId.startsWith('wodime-atlantis-replacement:') || pendingPlacementIds.has(event.sourceCardId) ||
          !Number.isSafeInteger(event.wodimeReplacementDepth) || Number(event.wodimeReplacementDepth) < 9 ||
          handled[event.sourceCardId] ||
          !state.eventPlacements.some((placement) => placement.ruleInstanceId === event.sourceCardId &&
            placement.eventCardId === event.revealedId && placement.locationId === event.locationId)) return false;
      pendingIds.add(event.id);
      pendingPlacementIds.add(event.sourceCardId);
    }
  }
  return true;
}
