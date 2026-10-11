import type { GameState, PlayerState } from "../domain/state/types.ts";
import type { CardDefinition } from "./content-types.ts";
import { gainMana } from "./resources.ts";
import { gainCommandSeals } from "./command-seals.ts";

/** Authored effects for the twenty physical Fuyuki objectives. */
export const FUYUKI_EFFECT_TAGS: Record<string, string[]> = Object.fromEntries(
  Object.entries({ 1: "no-extra-effect", 2: "trailing-power", 3: "trailing-power", 7: "low-base-five",
    8: "double-terrain", 9: "zero-terrain", 13: "high-card-plus-one", 14: "hidden-name-five",
    15: "hidden-name-five", 16: "shared-attribute-four", 17: "bounded-field", 18: "bounded-field",
    19: "after-combat-mana-two", 20: "after-combat-mana-two" })
    .map(([number, effect]) => [`event.fuyuki.${number}`, [`fuyuki:${effect}`]]),
);
// Correct legacy shorthand against the actual Chinese card faces.
export const FUYUKI_TEXT_OVERRIDES: Record<string, string> = {
  "event.fuyuki.1": "无额外效果。",
  "event.fuyuki.13": "基本威力4及以上的攻击于此战场获得+1威力。此战场的胜者可以恢复1枚令咒。",
};

export function countFuyukiEffect(state: GameState, locationId: string | null | undefined,
  cards: Record<string, CardDefinition>, effect: string): number {
  if (!locationId) return 0;
  return (state.board.currentEvents[locationId] ?? []).filter((id) =>
    state.board.eventVisibility[id] !== "down" && cards[id]?.tags?.includes(`fuyuki:${effect}`)).length;
}

export function fuyukiBasePower(state: GameState, player: PlayerState, cards: Record<string, CardDefinition>, value: number): number {
  return (value === 1 || value === 2) && countFuyukiEffect(state, player.locationId, cards, "low-base-five") ? 5 : value;
}

export function fuyukiTerrain(state: GameState, locationId: string | null | undefined,
  cards: Record<string, CardDefinition>, value: number): number {
  return value * 2 ** countFuyukiEffect(state, locationId, cards, "double-terrain");
}

export function fuyukiTotalBonus(state: GameState, player: PlayerState, cards: Record<string, CardDefinition>,
  locationId: string | null | undefined, sharedAttribute: boolean): number {
  const count = (effect: string) => countFuyukiEffect(state, locationId, cards, effect);
  const scores = state.modeState.fuyukiSettlementScores as Record<string, number> | undefined;
  const ownScore = scores?.[player.id] ?? player.victoryPoints;
  // Equal scores share the same rank; reward changes in a previous battlefield
  // cannot change this round's objective ranking.
  const lowerCount = Object.values(state.players).filter((other) => !other.eliminated
    && (scores?.[other.id] ?? other.victoryPoints) < ownScore).length;
  return count("trailing-power") * Math.max(0, 12 - lowerCount * 4)
    + (player.trueNameRevealed ? 0 : count("hidden-name-five") * 5)
    + (sharedAttribute ? count("shared-attribute-four") * 4 : 0);
}

export function fuyukiMovementBlocked(state: GameState, from: string, to: string, cards: Record<string, CardDefinition>): boolean {
  return from !== to && (countFuyukiEffect(state, from, cards, "bounded-field") > 0
    || countFuyukiEffect(state, to, cards, "bounded-field") > 0);
}

export function rewardFuyukiWinner(state: GameState, playerId: string, locationId: string, cards: Record<string, CardDefinition>): void {
  const player = state.players[playerId];
  for (let i = 0; i < countFuyukiEffect(state, locationId, cards, "high-card-plus-one"); i += 1) {
    if (player.commandSeals < Number(player.flags.commandSealMaximum ?? 3)) gainCommandSeals(state, playerId, 1);
  }
}

export function rewardFuyukiAfterCombat(state: GameState, cards: Record<string, CardDefinition>): void {
  for (const player of Object.values(state.players)) {
    if (player.eliminated || !player.locationId) continue;
    gainMana(player, countFuyukiEffect(state, player.locationId, cards, "after-combat-mana-two") * 2);
  }
}
