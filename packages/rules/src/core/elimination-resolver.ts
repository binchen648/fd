import type { GameState } from '../schema/game';

export const ELIMINATION_MILITARY_THRESHOLD = -8;

export interface EliminationCandidate {
  playerId: string;
  seat: number;
  militaryResult: number;
}

export interface ResolvedEliminationCandidate extends EliminationCandidate {
  eliminationOrder: number;
}

/** Pure military-threshold projection for the current authoritative battle ledger. */
export function projectBattleEliminationCandidatePlayerIds(state: GameState): string[] {
  const prevented = new Set((state.abilityRuntime?.eliminationRescueRecords ?? [])
    .filter((entry) => entry.round === state.round.roundNumber && !entry.scoringSettled)
    .map((entry) => entry.targetPlayerId));
  return state.players
    .filter((player) => player.status === 'active' && !prevented.has(player.id))
    .filter((player) => {
      let militaryResult = player.militaryResult;
      for (const result of state.battleResults) {
        const adjustment = result.militaryAdjustments.find((entry) => entry.playerId === player.id);
        if (!adjustment) continue;
        militaryResult += adjustment.delta;
        if (militaryResult <= ELIMINATION_MILITARY_THRESHOLD) return true;
      }
      return false;
    })
    .sort((left, right) => left.seat - right.seat || left.id.localeCompare(right.id))
    .map((player) => player.id);
}

export function resolveEliminationBatch(
  candidates: EliminationCandidate[],
): ResolvedEliminationCandidate[] {
  return [...candidates]
    .sort((left, right) => {
      if (left.militaryResult !== right.militaryResult) {
        return left.militaryResult - right.militaryResult;
      }

      if (left.seat !== right.seat) {
        return left.seat - right.seat;
      }

      return left.playerId.localeCompare(right.playerId);
    })
    .map((candidate, index) => ({
      ...candidate,
      eliminationOrder: index + 1,
    }));
}
