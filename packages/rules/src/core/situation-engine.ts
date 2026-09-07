import type { CombatModifierRule } from "../schema/effect";
import type { GameState } from "../schema/game";

import type { ResolverResult } from "./resolver-contracts";

export interface SituationCardRuntime {
  cardId: string;
  minimumRemainingPlayers?: number;
  sharedManaReward?: number;
  battleModifiers?: CombatModifierRule[];
}

export function canUseSituationForRemainingPlayers(
  activePlayerCount: number,
  card: SituationCardRuntime,
): boolean {
  if (card.minimumRemainingPlayers === undefined) {
    return true;
  }

  return activePlayerCount >= card.minimumRemainingPlayers;
}

export function applySituationAtRoundStart(
  state: GameState,
  card: SituationCardRuntime,
): ResolverResult {
  const { currentSituationModifiers: _previousSituationModifiers, ...stateWithoutSituationModifiers } = state;
  const nextPlayers = state.players.map((player) => {
    if (player.status !== "active") {
      return player;
    }

    return {
      ...player,
      mana: player.mana + (card.sharedManaReward ?? 0),
    };
  });

  return {
    nextState: {
      ...stateWithoutSituationModifiers,
      players: nextPlayers,
      currentSituationCardId: card.cardId,
      ...(card.battleModifiers ? { currentSituationModifiers: card.battleModifiers } : {}),
      log: state.log.concat({
        type: "situation_applied",
        message: `situation:${card.cardId}`,
      }),
    },
    appliedLogEntries: [`situation:${card.cardId}`],
  };
}
