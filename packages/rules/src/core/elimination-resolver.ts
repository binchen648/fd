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


export type StandardMatchOutcome =
  | { kind: 'winner'; round: 11; winnerPlayerId: string; tiedTopPlayerIds: string[]; reason: 'highest_vp' | 'miyama_tiebreak' }
  | { kind: 'grail_overflow'; round: 11; tiedTopPlayerIds: string[]; reason: 'unresolved_tie' | 'no_eligible_player' };

/** Canonical sections14.2/14.3. Call only after end-of-round effects have finished. */
export function resolveStandardRoundEnd(
  players: readonly { id: string; vp: number; status: 'active' | 'eliminated' }[],
  round: number,
  miyamaWinnerIds: readonly string[] = [],
): { round: number; eliminatedPlayerIds: string[]; cutoffVp?: number; outcome?: StandardMatchOutcome } {
  if (!Number.isSafeInteger(round) || round < 1 || round > 11 ||
    new Set(players.map(p => p.id)).size !== players.length ||
    players.some(p => !p.id || !Number.isSafeInteger(p.vp) || p.vp < 0 || !['active','eliminated'].includes(p.status)) ||
    new Set(miyamaWinnerIds).size !== miyamaWinnerIds.length || miyamaWinnerIds.some(id => !players.some(p => p.id === id))) {
    throw new Error('Invalid standard round-end input');
  }
  const active = players.filter(p => p.status === 'active');
  const keep = ({ 8: 4, 9: 3, 10: 2 } as Record<number,number>)[round];
  if (keep && active.length > keep) {
    const cutoffVp = [...active].sort((a,b) => b.vp-a.vp)[keep-1]!.vp;
    return { round, cutoffVp, eliminatedPlayerIds: active.filter(p => p.vp < cutoffVp).map(p => p.id) };
  }
  if (round !== 11) return { round, eliminatedPlayerIds: [] };
  const highest = Math.max(...active.map(p=>p.vp));
  const tiedTopPlayerIds = active.filter(p=>p.vp===highest).map(p=>p.id);
  const miyamaTop = tiedTopPlayerIds.filter(id => miyamaWinnerIds.includes(id));
  const winnerPlayerId = tiedTopPlayerIds.length === 1 ? tiedTopPlayerIds[0] : miyamaTop.length === 1 ? miyamaTop[0] : undefined;
  const outcome: StandardMatchOutcome = winnerPlayerId
    ? { kind:'winner', round:11, winnerPlayerId, tiedTopPlayerIds, reason:tiedTopPlayerIds.length===1?'highest_vp':'miyama_tiebreak' }
    : { kind:'grail_overflow', round:11, tiedTopPlayerIds, reason:active.length?'unresolved_tie':'no_eligible_player' };
  return { round, eliminatedPlayerIds: [], outcome };
}
