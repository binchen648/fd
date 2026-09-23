import type { GameState, PlayerScoringBreakdown } from "../schema/game";
import type { ResolverResult } from "./resolver-contracts";
import { resolveEliminationBatch } from "./elimination-resolver";
import { consumeB02EliminationReplacement, consumeM50NextRoundVpEliminationReplacement } from "../ability/batch-owned-passive-rules";

export const ELIMINATION_MILITARY_THRESHOLD = -8;

export type ThresholdBucket = "default" | "four_or_less" | "three_or_less" | "two_or_less";

export function countActivePlayers(state: GameState): number {
  return state.players.filter((player) => player.status === "active").length;
}

export function getThresholdBucket(activePlayers: number): ThresholdBucket {
  return activePlayers <= 2
    ? "two_or_less"
    : activePlayers <= 3
      ? "three_or_less"
      : activePlayers <= 4
        ? "four_or_less"
        : "default";
}

export function applyEliminationAndThresholdLog(state: GameState): ResolverResult {
  const activePlayers = countActivePlayers(state);
  const thresholdBucket = getThresholdBucket(activePlayers);

  return {
    nextState: {
      ...state,
      scoringBreakdown: state.scoringBreakdown ?? [],
      log: state.log.concat({
        type: "scoring_checkpoint",
        message: `active_players:${activePlayers}`,
        payload: {
          thresholdBucket,
        },
      }),
    },
    appliedLogEntries: [`active_players:${activePlayers}`, `threshold:${thresholdBucket}`],
  };
}

export function applyOccupiedLocationRewards(state: GameState): ResolverResult {
  const scoringBreakdown: PlayerScoringBreakdown[] = [];

  const nextPlayers = state.players.map((player) => {
    if (player.status !== "active" || !player.locationId) {
      return player;
    }

    const location = state.map.locations.find((entry) => entry.id === player.locationId);
    if (!location) {
      return player;
    }

    let vpDelta = 0;
    const reasons: PlayerScoringBreakdown["reasons"] = [];

    if (location.rewardHooks.includes("location_rewards") && location.vpRewardRules?.location) {
      vpDelta += location.vpRewardRules.location;
      reasons.push({
        source: "location_vp",
        value: location.vpRewardRules.location,
        label: `${location.id}.location`,
      });
    }

    if (location.rewardHooks.includes("recon_rewards") && location.vpRewardRules?.recon) {
      vpDelta += location.vpRewardRules.recon;
      reasons.push({
        source: "recon_vp",
        value: location.vpRewardRules.recon,
        label: `${location.id}.scout`,
      });
    }

    if (vpDelta === 0) {
      return player;
    }

    const nextPlayer = {
      ...player,
      vp: player.vp + vpDelta,
    };

    scoringBreakdown.push({
      playerId: player.id,
      vpDelta,
      militaryDelta: 0,
      eliminated: false,
      reasons,
    });

    return nextPlayer;
  });

  if (scoringBreakdown.length === 0) {
    return {
      nextState: state,
      appliedLogEntries: [],
    };
  }

  return {
    nextState: {
      ...state,
      players: nextPlayers,
      scoringBreakdown,
      log: state.log.concat(
        scoringBreakdown.map((entry) => ({
          type: "location_reward_scored",
          message: `location_reward:${entry.playerId}`,
          payload: {
            playerId: entry.playerId,
            vpDelta: entry.vpDelta,
            militaryDelta: entry.militaryDelta,
            eliminated: entry.eliminated,
            reasons: entry.reasons,
          },
        })),
      ),
    },
    appliedLogEntries: scoringBreakdown.map((entry) => `location_reward:${entry.playerId}`),
  };
}

export function applyBattleScoring(state: GameState): ResolverResult {
  const scoringBreakdown: PlayerScoringBreakdown[] = [];
  const replacementState: GameState = {
    ...state,
    cards: structuredClone(state.cards),
    ...(state.abilityRuntime ? { abilityRuntime: structuredClone(state.abilityRuntime) } : {}),
  };
  const eliminationCandidates: Array<{ playerId: string; seat: number; militaryResult: number }> = [];

  const nextPlayers = state.players.map((player) => {
    let nextPlayer = player;
    let vpDelta = 0;
    let militaryDelta = 0;
    const reasons: PlayerScoringBreakdown["reasons"] = [];

    for (const result of state.battleResults) {
      const winnerPlayerIds = result.winnerPlayerIds ?? (result.winnerPlayerId ? [result.winnerPlayerId] : []);
      if (winnerPlayerIds.includes(player.id)) {
        vpDelta += result.vpReward;
        reasons.push({
          source: "battle_vp",
          value: result.vpReward,
          label: `${result.battlefieldId}.vp`,
        });
        nextPlayer = {
          ...nextPlayer,
          vp: nextPlayer.vp + result.vpReward,
        };
      }

      for (const vpAdjustment of result.vpAdjustments ?? []) {
        if (vpAdjustment.playerId !== player.id) {
          continue;
        }

        vpDelta += vpAdjustment.delta;
        reasons.push({
          source: vpAdjustment.source,
          value: vpAdjustment.delta,
          label: vpAdjustment.label,
        });
        nextPlayer = {
          ...nextPlayer,
          vp: nextPlayer.vp + vpAdjustment.delta,
        };
      }

      const adjustment = result.militaryAdjustments.find(
        (entry) => entry.playerId === player.id,
      );

      if (adjustment) {
        militaryDelta += adjustment.delta;
        reasons.push({
          source: "military_result",
          value: adjustment.delta,
          label: `${result.battlefieldId}.margin`,
        });
        const militaryResult = nextPlayer.militaryResult + adjustment.delta;
        const reachedEliminationThreshold = militaryResult <= ELIMINATION_MILITARY_THRESHOLD;
        const replacementConsumed = reachedEliminationThreshold && nextPlayer.status !== "eliminated"
          ? (consumeB02EliminationReplacement(replacementState, nextPlayer.id) || consumeM50NextRoundVpEliminationReplacement(replacementState, nextPlayer.id))
          : false;
        const eliminated = reachedEliminationThreshold && !replacementConsumed;
        const newlyEliminated = eliminated && nextPlayer.status !== "eliminated";
        nextPlayer = {
          ...nextPlayer,
          militaryResult,
          status: eliminated ? "eliminated" : nextPlayer.status,
        };

        if (newlyEliminated) {
          eliminationCandidates.push({
            playerId: nextPlayer.id,
            seat: nextPlayer.seat,
            militaryResult,
          });
        }

        if (eliminated) {
          reasons.push({
            source: "elimination",
            value: militaryResult,
            label: "military_threshold",
          });
        }
      }
    }

    if (vpDelta !== 0 || militaryDelta !== 0 || reasons.length > 0) {
      scoringBreakdown.push({
        playerId: player.id,
        vpDelta,
        militaryDelta,
        eliminated: nextPlayer.status === "eliminated" && player.status !== "eliminated",
        ...(nextPlayer.eliminationOrder !== undefined
          ? { eliminationOrder: nextPlayer.eliminationOrder }
          : {}),
        reasons,
      });
    }

    return nextPlayer;
  });

  const resolvedEliminations = resolveEliminationBatch(eliminationCandidates);
  if (replacementState.abilityRuntime && resolvedEliminations.length > 0) {
    const round = state.round.roundNumber; const runtime = replacementState.abilityRuntime;
    const existing = runtime.structuredRoundEliminations;
    if (existing && existing.round > round) throw new Error('M50_ROUND_ELIMINATION_LEDGER_FUTURE');
    const entries = existing?.round === round ? [...existing.entries] : [];
    for (const eliminated of resolvedEliminations) {
      const locationId = state.players.find((candidate) => candidate.id === eliminated.playerId)?.locationId;
      const prior = entries.find((entry) => entry.playerId === eliminated.playerId);
      if (prior) { if (prior.locationId !== locationId) throw new Error('M50_ROUND_ELIMINATION_LEDGER_COLLISION'); continue; }
      entries.push({ playerId: eliminated.playerId, ...(locationId ? { locationId } : {}) });
    }
    runtime.structuredRoundEliminations = { round, entries };
  }
  const eliminationOrderByPlayerId = new Map(
    resolvedEliminations.map((candidate) => [candidate.playerId, candidate.eliminationOrder]),
  );

  const orderedPlayers = nextPlayers.map((player) => {
    const eliminationOrder = eliminationOrderByPlayerId.get(player.id);
    if (eliminationOrder === undefined) {
      return player;
    }

    return {
      ...player,
      eliminationOrder,
    };
  });

  const orderedScoringBreakdown = scoringBreakdown.map((entry) => {
    const eliminationOrder = eliminationOrderByPlayerId.get(entry.playerId);
    if (eliminationOrder === undefined) {
      return entry;
    }

    return {
      ...entry,
      eliminationOrder,
    };
  });

  const scoredBattleLogs = state.battleResults.map((result) => ({
    type: "battle_scored",
    message: `scored:${result.battlefieldId}`,
    payload: {
      battlefieldId: result.battlefieldId,
      winnerPlayerIds: result.winnerPlayerIds ?? (result.winnerPlayerId ? [result.winnerPlayerId] : []),
      tied: result.tied ?? ((result.winnerPlayerIds?.length ?? (result.winnerPlayerId ? 1 : 0)) > 1),
      winnerPlayerId: result.winnerPlayerId,
      vpReward: result.vpReward,
      margin: result.margin,
      scoringBreakdown: orderedScoringBreakdown.filter((entry) =>
        result.militaryAdjustments.some((adjustment) => adjustment.playerId === entry.playerId) ||
        (result.winnerPlayerIds ?? (result.winnerPlayerId ? [result.winnerPlayerId] : [])).includes(entry.playerId),
      ),
    },
  }));

  const eliminationBatchLog = resolvedEliminations.length > 0
    ? [{
        type: "elimination_batch_resolved",
        message: `elimination_batch:${resolvedEliminations.length}`,
        payload: {
          candidates: resolvedEliminations,
          finalOrder: resolvedEliminations.map((candidate) => candidate.playerId),
        },
      }]
    : [];

  const scoredState: GameState = {
    ...state,
    cards: replacementState.cards,
    ...(replacementState.abilityRuntime ? { abilityRuntime: replacementState.abilityRuntime } : {}),
    players: orderedPlayers,
    battleResults: [],
    scoringBreakdown: orderedScoringBreakdown,
    log: state.log.concat(scoredBattleLogs, eliminationBatchLog),
  };

  const thresholdResult = applyEliminationAndThresholdLog(scoredState);

  return {
    nextState: thresholdResult.nextState,
    appliedLogEntries: state.battleResults
      .map((result) => `scored:${result.battlefieldId}`)
      .concat(resolvedEliminations.length > 0 ? [`elimination_batch:${resolvedEliminations.length}`] : [])
      .concat(thresholdResult.appliedLogEntries),
  };
}
