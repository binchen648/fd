export interface EliminationCandidate {
  playerId: string;
  seat: number;
  militaryResult: number;
}

export interface ResolvedEliminationCandidate extends EliminationCandidate {
  eliminationOrder: number;
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
