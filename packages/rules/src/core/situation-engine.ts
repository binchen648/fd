import type { CombatModifierRule } from "../schema/effect";
import type { GameState } from "../schema/game";

import type { ResolverResult } from "./resolver-contracts";
import { grantMana } from "./rule-overrides";

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
  const nextState = structuredClone(stateWithoutSituationModifiers) as GameState;
  for (const player of nextState.players) {
    if (player.status !== "active") continue;
    grantMana(nextState, player.id, card.sharedManaReward ?? 0, { source: 'situation' });
  }

  return {
    nextState: {
      ...nextState,
      currentSituationCardId: card.cardId,
      ...(card.battleModifiers ? { currentSituationModifiers: card.battleModifiers } : {}),
      log: nextState.log.concat({
        type: "situation_applied",
        message: `situation:${card.cardId}`,
      }),
    },
    appliedLogEntries: [`situation:${card.cardId}`],
  };
}
