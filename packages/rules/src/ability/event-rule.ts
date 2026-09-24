import type { GameState, EventDiscardState, EventPlacementState } from '../schema/game';
import type { LocationId } from '../schema/location';
import { getEnabledLocations } from '../core/map-engine';
import type { VisibilityState } from '../schema/visibility';
import type { AbilityDefinitionPack, AuthoringCard } from './types';

export type EventRuleZone = 'event_deck' | 'event_discard' | 'event_outside_game' | 'event_battlefield';

export interface EventRuleCandidate {
  token: string;
  zone: EventRuleZone;
  eventCardId: string;
  tags: string[];
  eventSetIds: string[];
  locationId?: string;
  visibility?: 'public' | 'hidden_until_trigger';
  ruleInstanceId?: string;
  ruleControllerPlayerId?: string;
}

export interface MoveEventRuleOptions {
  locationId?: string;
  ruleControllerPlayerId?: string;
  visibility?: 'public' | 'hidden_until_trigger';
}

interface ResolvedEventCandidate {
  candidate: EventRuleCandidate;
  placement?: EventPlacementState | EventDiscardState;
  index: number;
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('Event-rule lifecycle requires initialized ability runtime');
  return state.abilityRuntime;
}

function eventRule(pack: AbilityDefinitionPack, eventCardId: string): AuthoringCard {
  const definition = pack.eventRules?.[eventCardId];
  if (!definition || definition.cardType !== 'event') throw new Error(`Unknown executable event rule definition: ${eventCardId}`);
  return definition;
}

function eventMetadata(pack: AbilityDefinitionPack, eventCardId: string) {
  const metadata = pack.eventCatalog?.[eventCardId];
  if (!metadata) throw new Error(`Unknown event definition metadata: ${eventCardId}`);
  return metadata;
}

function candidateBase(pack: AbilityDefinitionPack, eventCardId: string) {
  const metadata = eventMetadata(pack, eventCardId);
  return { eventCardId, tags: [...metadata.tags], eventSetIds: [...metadata.eventSetIds] };
}

function allocateRuleInstanceId(state: GameState): string {
  return `event-rule-${++runtime(state).sequence}`;
}

export function initializeEventRulePlacements(state: GameState, pack: AbilityDefinitionPack): void {
  const seen = new Set<string>();
  for (const placement of state.eventPlacements) {
    if (!pack.eventRules?.[placement.eventCardId]) continue;
    eventRule(pack, placement.eventCardId);
    placement.ruleInstanceId ??= allocateRuleInstanceId(state);
    if (seen.has(placement.ruleInstanceId)) throw new Error(`Duplicate event rule instance id: ${placement.ruleInstanceId}`);
    seen.add(placement.ruleInstanceId);
    if (placement.ruleControllerPlayerId && !state.players.some((player) => player.id === placement.ruleControllerPlayerId)) {
      throw new Error(`Unknown event rule placement controller: ${placement.ruleControllerPlayerId}`);
    }
  }
}

function indexedToken(revision: number, zone: Exclude<EventRuleZone, 'event_battlefield'>, index: number, eventCardId: string, ruleInstanceId?: string): string {
  return `${zone}:${revision}:${index}:${eventCardId}:${ruleInstanceId ?? ''}`;
}
function battlefieldToken(revision: number, index: number, eventCardId: string, ruleInstanceId?: string): string {
  return `event_battlefield:${revision}:${index}:${eventCardId}:${ruleInstanceId ?? ''}`;
}

export function listEventRuleCandidates(
  state: GameState,
  pack: AbilityDefinitionPack,
  zones: readonly EventRuleZone[],
): EventRuleCandidate[] {
  const allowed = new Set(zones);
  const result: EventRuleCandidate[] = [];
  const revision = runtime(state).eventRuleZoneRevision;
  if (allowed.has('event_deck')) {
    (state.eventDeck ?? []).forEach((eventCardId, index) => {
      if (!pack.eventCatalog?.[eventCardId]) return;
      result.push({ token: indexedToken(revision, 'event_deck', index, eventCardId), zone: 'event_deck', ...candidateBase(pack, eventCardId) });
    });
  }
  if (allowed.has('event_outside_game')) {
    (state.eventOutsideGame ?? []).forEach((eventCardId, index) => {
      if (!pack.eventCatalog?.[eventCardId]) return;
      result.push({ token: indexedToken(revision, 'event_outside_game', index, eventCardId), zone: 'event_outside_game', ...candidateBase(pack, eventCardId) });
    });
  }
  if (allowed.has('event_discard')) {
    (state.eventDiscardPile ?? []).forEach((entry, index) => {
      if (!pack.eventCatalog?.[entry.eventCardId]) return;
      result.push({ token: indexedToken(revision, 'event_discard', index, entry.eventCardId, entry.ruleInstanceId), zone: 'event_discard',
        ...candidateBase(pack, entry.eventCardId), ...(entry.locationId ? { locationId: entry.locationId } : {}),
        ...(entry.visibility.scope === 'public' || entry.visibility.scope === 'hidden_until_trigger' ? { visibility: entry.visibility.scope } : {}),
        ...(entry.ruleInstanceId ? { ruleInstanceId: entry.ruleInstanceId } : {}),
        ...(entry.ruleControllerPlayerId ? { ruleControllerPlayerId: entry.ruleControllerPlayerId } : {}) });
    });
  }
  if (allowed.has('event_battlefield')) {
    state.eventPlacements.forEach((placement, index) => {
      if (!pack.eventCatalog?.[placement.eventCardId]) return;
      result.push({ token: battlefieldToken(revision, index, placement.eventCardId, placement.ruleInstanceId), zone: 'event_battlefield',
        ...candidateBase(pack, placement.eventCardId), locationId: placement.locationId,
        ...(placement.visibility.scope === 'public' || placement.visibility.scope === 'hidden_until_trigger' ? { visibility: placement.visibility.scope } : {}),
        ...(placement.ruleInstanceId ? { ruleInstanceId: placement.ruleInstanceId } : {}),
        ...(placement.ruleControllerPlayerId ? { ruleControllerPlayerId: placement.ruleControllerPlayerId } : {}) });
    });
  }
  return result;
}

function resolveCandidate(state: GameState, pack: AbilityDefinitionPack, token: string): ResolvedEventCandidate {
  const listed = listEventRuleCandidates(state, pack, ['event_deck', 'event_discard', 'event_outside_game', 'event_battlefield']);
  const candidate = listed.find((entry) => entry.token === token);
  if (!candidate) throw new Error(`Stale or illegal event-rule selection: ${token}`);
  if (candidate.zone === 'event_battlefield') {
    const index = state.eventPlacements.findIndex((entry, i) => battlefieldToken(runtime(state).eventRuleZoneRevision, i, entry.eventCardId, entry.ruleInstanceId) === token);
    const placement = state.eventPlacements[index];
    if (index < 0 || !placement) throw new Error(`Stale event-rule battlefield selection: ${token}`);
    return { candidate, placement, index };
  }
  if (candidate.zone === 'event_discard') {
    const index = (state.eventDiscardPile ?? []).findIndex((entry, i) => indexedToken(runtime(state).eventRuleZoneRevision, 'event_discard', i, entry.eventCardId, entry.ruleInstanceId) === token);
    const placement = state.eventDiscardPile?.[index];
    if (index < 0 || !placement) throw new Error(`Stale event-rule discard selection: ${token}`);
    return { candidate, placement, index };
  }
  const parts = token.split(':');
  const index = Number(parts[2]);
  if (!Number.isInteger(index) || index < 0) throw new Error(`Invalid event-rule selection: ${token}`);
  return { candidate, index };
}

function validateDestination(state: GameState, destination: EventRuleZone, options: MoveEventRuleOptions): void {
  if (!['event_deck', 'event_discard', 'event_outside_game', 'event_battlefield'].includes(destination)) {
    throw new Error(`Unsupported event-rule destination: ${destination}`);
  }
  if (destination === 'event_battlefield') {
    if (options.ruleControllerPlayerId && !state.players.some((player) => player.id === options.ruleControllerPlayerId)) {
      throw new Error(`Unknown event rule controller: ${options.ruleControllerPlayerId}`);
    }
    if (options.visibility && !['public', 'hidden_until_trigger'].includes(options.visibility)) {
      throw new Error(`Unsupported event visibility: ${options.visibility}`);
    }
  }
}

function battlefieldDestinationLocation(
  state: GameState,
  source: ResolvedEventCandidate,
  options: MoveEventRuleOptions,
): LocationId {
  const locationId = options.locationId ?? source.candidate.locationId ?? source.placement?.locationId;
  const location = locationId
    ? getEnabledLocations(state.map, state.locationConfig).find((candidate) => candidate.id === locationId)
    : undefined;
  if (!location || location.eventPolicy === 'none' || !location.tags.includes('battlefield')) {
    throw new Error('Event battlefield destination requires an enabled event battlefield locationId');
  }
  return locationId as LocationId;
}

function placementVisibility(options: MoveEventRuleOptions, prior: EventPlacementState | EventDiscardState | undefined): VisibilityState {
  if (options.visibility === 'hidden_until_trigger') return { scope: 'hidden_until_trigger' };
  if (options.visibility === 'public') return { scope: 'public' };
  return prior?.visibility ? structuredClone(prior.visibility) : { scope: 'public' };
}

function refreshEventForbids(state: GameState, pack: AbilityDefinitionPack): void {
  const carrier = state as unknown as { modeState?: { cardPlayForbids?: Array<Record<string, unknown>> } };
  carrier.modeState ??= {};
  const preserved = Array.isArray(carrier.modeState.cardPlayForbids)
    ? carrier.modeState.cardPlayForbids.filter((entry) => entry.sourceType !== 'event')
    : [];
  const eventForbids = state.eventPlacements
    .filter((placement) => placement.visibility.scope === 'public')
    .flatMap((placement) => (pack.eventCatalog?.[placement.eventCardId]?.forbiddenAttributes ?? []).map((attribute) => ({
      sourceId: placement.eventCardId,
      sourceType: 'event',
      locationId: placement.locationId,
      attribute,
      rule: 'play_card_attribute',
    })));
  carrier.modeState.cardPlayForbids = [...preserved, ...eventForbids];
}

function removeResolvedSources(state: GameState, resolved: ResolvedEventCandidate[]): void {
  const descending = (zone: EventRuleZone) => resolved.filter((entry) => entry.candidate.zone === zone).sort((a, b) => b.index - a.index);
  for (const entry of descending('event_deck')) state.eventDeck!.splice(entry.index, 1);
  for (const entry of descending('event_outside_game')) state.eventOutsideGame!.splice(entry.index, 1);
  for (const entry of descending('event_discard')) state.eventDiscardPile!.splice(entry.index, 1);
  for (const entry of descending('event_battlefield')) state.eventPlacements.splice(entry.index, 1);
}

export function moveEventRuleCandidates(
  state: GameState,
  pack: AbilityDefinitionPack,
  tokens: readonly string[],
  destination: EventRuleZone,
  options: MoveEventRuleOptions = {},
): EventRuleCandidate[] {
  if (!tokens.length || new Set(tokens).size !== tokens.length) throw new Error('Event-rule move requires one or more distinct selections');
  const resolved = tokens.map((token) => resolveCandidate(state, pack, token));
  validateDestination(state, destination, options);
  const battlefieldLocations = destination === 'event_battlefield'
    ? resolved.map((entry) => battlefieldDestinationLocation(state, entry, options))
    : [];
  for (const { candidate } of resolved) eventMetadata(pack, candidate.eventCardId);

  // Every source and destination is validated before any mutation. The batch then commits once.
  removeResolvedSources(state, resolved);
  for (const [resolvedIndex, entry] of resolved.entries()) {
    const source = entry.candidate;
    const prior = entry.placement;
    const metadata = eventMetadata(pack, source.eventCardId);
    if (destination === 'event_deck') {
      state.eventDeck ??= [];
      state.eventDeck.push(source.eventCardId);
      continue;
    }
    if (destination === 'event_outside_game') {
      state.eventOutsideGame ??= [];
      state.eventOutsideGame.push(source.eventCardId);
      continue;
    }
    if (destination === 'event_discard') {
      state.eventDiscardPile ??= [];
      state.eventDiscardPile.push({
        eventCardId: source.eventCardId,
        ...(source.locationId ? { locationId: source.locationId as LocationId } : {}),
        ...(source.ruleInstanceId ? { ruleInstanceId: source.ruleInstanceId } : {}),
        ...(source.ruleControllerPlayerId ? { ruleControllerPlayerId: source.ruleControllerPlayerId } : {}),
        visibility: prior?.visibility ? structuredClone(prior.visibility) : { scope: 'public' },
        ...(prior?.victoryPoints !== undefined ? { victoryPoints: prior.victoryPoints } : metadata.printedReward !== undefined ? { victoryPoints: metadata.printedReward } : {}),
        ...(prior?.battleModifiers ? { battleModifiers: structuredClone(prior.battleModifiers) } : metadata.battleModifiers?.length ? { battleModifiers: structuredClone(metadata.battleModifiers) } : {}),
      });
      continue;
    }
    const ruleInstanceId = source.ruleInstanceId ?? (pack.eventRules?.[source.eventCardId] ? allocateRuleInstanceId(state) : undefined);
    const controllerId = options.ruleControllerPlayerId ?? source.ruleControllerPlayerId;
    state.eventPlacements.push({
      eventCardId: source.eventCardId,
      locationId: battlefieldLocations[resolvedIndex]!,
      ...(ruleInstanceId ? { ruleInstanceId } : {}),
      ...(controllerId ? { ruleControllerPlayerId: controllerId } : {}),
      visibility: placementVisibility(options, prior),
      ...(prior?.victoryPoints !== undefined ? { victoryPoints: prior.victoryPoints } : metadata.printedReward !== undefined ? { victoryPoints: metadata.printedReward } : {}),
      ...(prior?.battleModifiers ? { battleModifiers: structuredClone(prior.battleModifiers) } : metadata.battleModifiers?.length ? { battleModifiers: structuredClone(metadata.battleModifiers) } : {}),
    });
  }
  runtime(state).eventRuleZoneRevision++;
  refreshEventForbids(state, pack);

  const post = listEventRuleCandidates(state, pack, [destination]);
  const used = new Set<string>();
  return resolved.map(({ candidate: source }) => {
    for (let i = post.length - 1; i >= 0; i--) {
      const candidate = post[i]!;
      if (!used.has(candidate.token) && candidate.eventCardId === source.eventCardId) {
        used.add(candidate.token);
        return candidate;
      }
    }
    throw new Error(`Moved event is missing from destination: ${source.eventCardId}`);
  });
}

export function moveEventRuleCandidate(
  state: GameState,
  pack: AbilityDefinitionPack,
  token: string,
  destination: EventRuleZone,
  options: MoveEventRuleOptions = {},
): EventRuleCandidate {
  return moveEventRuleCandidates(state, pack, [token], destination, options)[0]!;
}

function shuffleMainEventDeckDeterministically(state: GameState): void {
  const deck = state.eventDeck ??= [];
  const r = runtime(state);
  for (let index = deck.length - 1; index > 0; index--) {
    let randomState = r.randomState >>> 0;
    randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5;
    r.randomState = randomState >>> 0;
    const swapIndex = Math.floor((r.randomState / 0x100000000) * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex]!, deck[index]!];
  }
}

/** Swap exactly two currently placed events without changing either event's face/visibility. */
export function swapSelectedEventRuleLocations(state: GameState, pack: AbilityDefinitionPack, tokens: readonly string[]): void {
  if (tokens.length !== 2 || new Set(tokens).size !== 2) throw new Error('Event-rule swap requires exactly two distinct selections');
  const resolved = tokens.map((token) => resolveCandidate(state, pack, token));
  if (resolved.some((entry) => entry.candidate.zone !== 'event_battlefield' || !entry.placement)) {
    throw new Error('Event-rule swap selections must be current battlefield events');
  }
  const left = resolved[0]!; const right = resolved[1]!;
  const leftPlacement = state.eventPlacements[left.index];
  const rightPlacement = state.eventPlacements[right.index];
  if (!leftPlacement || !rightPlacement) throw new Error('Event-rule swap selection became stale');
  if (leftPlacement.locationId === rightPlacement.locationId) {
    [state.eventPlacements[left.index], state.eventPlacements[right.index]] = [rightPlacement, leftPlacement];
  } else {
    const leftLocation = leftPlacement.locationId;
    leftPlacement.locationId = rightPlacement.locationId;
    rightPlacement.locationId = leftLocation;
  }
  runtime(state).eventRuleZoneRevision++;
  refreshEventForbids(state, pack);
}

/** Return one current event to the main event deck, shuffle, then draw its replacement at the same place and visibility. */
export function replaceSelectedEventRuleFromDeck(state: GameState, pack: AbilityDefinitionPack, token: string): EventRuleCandidate {
  const resolved = resolveCandidate(state, pack, token);
  if (resolved.candidate.zone !== 'event_battlefield' || !resolved.placement) {
    throw new Error('Event-rule replacement selection must be a current battlefield event');
  }
  const prior = structuredClone(resolved.placement);
  const priorLocationId = prior.locationId;
  if (!priorLocationId) throw new Error('Event-rule replacement battlefield location is missing');
  if (!['public', 'hidden_until_trigger'].includes(prior.visibility.scope)) throw new Error('Event-rule replacement visibility is unsupported');
  state.eventPlacements.splice(resolved.index, 1);
  state.eventDeck ??= [];
  state.eventDeck.push(resolved.candidate.eventCardId);
  shuffleMainEventDeckDeterministically(state);
  const replacementEventId = state.eventDeck.shift();
  if (!replacementEventId) throw new Error('Event-rule replacement deck is empty');
  const metadata = eventMetadata(pack, replacementEventId);
  const ruleInstanceId = pack.eventRules?.[replacementEventId] ? allocateRuleInstanceId(state) : undefined;
  state.eventPlacements.push({
    eventCardId: replacementEventId, locationId: priorLocationId,
    ...(ruleInstanceId ? { ruleInstanceId } : {}),
    visibility: structuredClone(prior.visibility),
    ...(metadata.printedReward !== undefined ? { victoryPoints: metadata.printedReward } : {}),
    ...(metadata.battleModifiers?.length ? { battleModifiers: structuredClone(metadata.battleModifiers) } : {}),
  });
  runtime(state).eventRuleZoneRevision++;
  refreshEventForbids(state, pack);
  const candidate = listEventRuleCandidates(state, pack, ['event_battlefield']).find((entry) =>
    entry.eventCardId === replacementEventId && entry.locationId === priorLocationId);
  if (!candidate) throw new Error('Event-rule replacement placement is missing after commit');
  return candidate;
}

export function eventRulePlacementByInstance(state: GameState, ruleInstanceId: string): EventPlacementState | undefined {
  return state.eventPlacements.find((placement) => placement.ruleInstanceId === ruleInstanceId);
}