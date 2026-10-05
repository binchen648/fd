import type { GameState } from '../schema/game';

/**
 * Shared authoritative deck-order seam for ability-runtime cards.
 *
 * Deck order is the physical `state.cards` order among one owner's `deck` cards.
 * This preserves the interpreter's established xorshift32/Fisher-Yates semantics
 * while letting bounded capabilities rebuild and shuffle a deck without creating
 * a second RNG contract.
 */
export function shuffleOwnedDeckDeterministically(state: GameState, ownerPlayerId: string): void {
  const runtime = state.abilityRuntime;
  if (!runtime) throw new Error('ABILITY_RUNTIME_REQUIRED_FOR_DECK_SHUFFLE');
  const indexes = state.cards
    .map((card, index) => card.ownerPlayerId === ownerPlayerId && card.zone === 'deck' ? index : -1)
    .filter((index) => index >= 0);
  const deck = indexes.map((index) => state.cards[index]!);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    let randomState = runtime.randomState;
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    runtime.randomState = randomState >>> 0;
    const swapIndex = Math.floor((runtime.randomState / 0x100000000) * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex]!, deck[index]!];
  }
  indexes.forEach((physicalIndex, deckIndex) => {
    state.cards[physicalIndex] = deck[deckIndex]!;
  });
}
