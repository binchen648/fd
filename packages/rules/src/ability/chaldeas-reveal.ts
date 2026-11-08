import type { GameState } from '../schema/game';
import type { LocationId } from '../schema/location';
import type { AbilityEvent } from './types';

const fixedClimax = new Set(['situation.fate_night', 'situation.gate_of_hell', 'situation.heavens_cup']);
export const CHALDEAS_REVEAL = 'before_situation_or_event_resolves';
export const CHALDEAS_SWAP = 'chaldeas.swap-before-resolve';

export type MatchReveal = {
  eventId: string;
  round: number;
  originalId: string;
  bottomId: string;
  controllerId: string;
  sourceId: string;
  chosenId: string;
} & (
  | { kind: 'situation' }
  | { kind: 'event'; locationId: LocationId; placementIndex?: number }
);

export function ordinarySituationDeck(state: GameState): string[] {
  // Older snapshots append the fixed climax schedule to the ordinary deck.
  return (state.situationDeck ?? []).filter(id => !fixedClimax.has(id));
}

function bottomIndex(state: GameState, kind: MatchReveal['kind']): number {
  const deck = kind === 'event' ? state.eventDeck : state.situationDeck;
  if (!deck) return -1;
  for (let i = deck.length - 1; i >= 0; i--) {
    if (kind === 'event' || !fixedClimax.has(deck[i]!)) return i;
  }
  return -1;
}

export function currentMatchDeckBottom(state: GameState, kind: MatchReveal['kind']): string | undefined {
  return (kind === 'event' ? state.eventDeck : state.situationDeck)?.[bottomIndex(state, kind)];
}

export function chaldeasSource(state: GameState, playerId: string, abilityId: string) {
  if (!state.players.some(p => p.id === playerId && p.status === 'active' && p.masterCardId === 'master.olga-marie')) return undefined;
  return state.cards.find(card => {
    if (card.definitionId !== 'master.olga-marie.skill.chaldeas' ||
        card.ownerPlayerId !== playerId || card.controllerPlayerId !== playerId) return false;
    const source = state.abilityRuntime?.cardState[card.instanceId];
    const available = card.zone === 'skill' ||
      ((card.zone === 'field' || card.zone === 'attack_area') && source?.active === true);
    if (!available || source?.faceDown) return false;
    const effect = abilityId === CHALDEAS_SWAP ? 'swap_revealed_with_deck_bottom' : 'look_at_match_deck_bottoms';
    return state.abilityRuntime?.pack.cards[card.definitionId]?.abilities.some(ability =>
      ability.id === abilityId && ability.execution.mode === 'automatic' && ability.effects.some(node => node.type === effect));
  });
}

export function matchReveal(state: GameState): MatchReveal | undefined {
  return (state as GameState & { modeState?: { matchReveal?: MatchReveal } }).modeState?.matchReveal;
}

export function maySwapMatchReveal(state: GameState, sourceId: string, event?: AbilityEvent): boolean {
  const reveal = matchReveal(state);
  if (!reveal || !event || event.type !== CHALDEAS_REVEAL || event.id !== reveal.eventId ||
      reveal.round !== state.round.roundNumber || reveal.sourceId !== sourceId ||
      reveal.originalId !== reveal.chosenId || event.revealedId !== reveal.originalId || event.revealedKind !== reveal.kind ||
      event.playerId !== reveal.controllerId || chaldeasSource(state, reveal.controllerId, CHALDEAS_SWAP)?.instanceId !== sourceId ||
      currentMatchDeckBottom(state, reveal.kind) !== reveal.bottomId) return false;
  if (reveal.kind === 'situation') return state.round.activePhase === 'round_start' && !fixedClimax.has(reveal.originalId);
  if (event.locationId !== reveal.locationId) return false;
  if (reveal.placementIndex === undefined) return state.round.activePhase === 'round_start';
  const original = state.eventPlacements[reveal.placementIndex];
  return state.round.activePhase === 'action' && original?.eventCardId === reveal.originalId &&
    original.locationId === reveal.locationId && original.visibility.scope === 'hidden_until_trigger';
}

export function swapMatchReveal(state: GameState, sourceId: string, event?: AbilityEvent): void {
  if (!maySwapMatchReveal(state, sourceId, event)) throw new Error('The revealed card or its deck bottom is no longer available');
  const reveal = matchReveal(state)!;
  const deck = reveal.kind === 'event' ? state.eventDeck! : state.situationDeck!;
  deck[bottomIndex(state, reveal.kind)] = reveal.originalId;
  reveal.chosenId = reveal.bottomId;
}
