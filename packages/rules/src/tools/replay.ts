import type {
  BattleParticipantBreakdown,
  BattleResultState,
  EventPlacementState,
  GameLogEntry,
  GameState,
  PlayerScoringBreakdown,
} from "../schema/game";
import type { ResolvedEliminationCandidate } from "../core/elimination-resolver";
import { countActivePlayers } from "../core/scoring-resolver";

import {
  applySimulationStep,
  type SimulationInput,
  type SimulationStep,
} from "./simulate";

export interface ReplaySnapshot {
  roundNumber: number;
  activePhase: GameState["round"]["activePhase"];
  activePlayers: number;
  thresholdBucket: "two_or_less" | "three_or_less" | "four_or_less" | "default";
  currentSituationCardId: string | null;
  playerMana: Array<{
    playerId: string;
    mana: number;
  }>;
  eventPlacements: Array<{
    locationId: EventPlacementState["locationId"];
    eventCardId: string;
    visibilityScope: EventPlacementState["visibility"]["scope"];
  }>;
  lastBattle: {
    battlefieldId: BattleResultState["battlefieldId"];
    winnerPlayerIds: string[];
    tied: boolean;
    winnerPlayerId: string | null;
    margin: number;
    participantBreakdowns: BattleParticipantBreakdown[];
  } | null;
  lastScoring: {
    players: PlayerScoringBreakdown[];
  } | null;
  lastEliminationBatch: {
    candidates: ResolvedEliminationCandidate[];
    finalOrder: string[];
  } | null;
}

export interface ReplayFrame {
  step: number;
  simulationStep: SimulationStep;
  appliedLogEntries: string[];
  snapshot: ReplaySnapshot;
}

export interface ReplayLog {
  matchId: string;
  seed: string;
  frames: ReplayFrame[];
  finalSnapshot: ReplaySnapshot;
  roundTimeline: ReplayRoundTimeline[];
}

export interface ReplayScenarioInput {
  id: string;
  seed: string;
  initialState: SimulationInput["initialState"];
  steps: SimulationInput["steps"];
}

export interface ReplayLogSnapshot {
  step: number;
  type: string;
  message: string;
}

export interface ReplayDivergence {
  step: number;
  field:
    | "roundNumber"
    | "activePhase"
    | "activePlayers"
    | "thresholdBucket"
    | "currentSituationCardId"
    | "playerMana"
    | "eventPlacements"
    | "lastBattle"
    | "lastScoring"
    | "lastEliminationBatch";
  baseline: unknown;
  candidate: unknown;
}

export interface ReplayComparisonReport {
  baselineMatchId: string;
  baselineSeed: string;
  candidateMatchId: string;
  candidateSeed: string;
  identical: boolean;
  firstDivergence: ReplayDivergence | null;
  finalDifferences: Array<ReplayDivergence["field"]>;
}

export interface ReplayComparisonMatrixEntry {
  label: string;
  expectedIdentical: boolean;
  report: ReplayComparisonReport;
}

export interface ReplayComparisonMatrixItem extends ReplayComparisonMatrixEntry {
  passed: boolean;
}

export interface ReplayComparisonMatrixSummary {
  total: number;
  passed: number;
  failed: number;
  items: ReplayComparisonMatrixItem[];
}

export interface ReplayRoundTimelineEntry {
  step: number;
  kind: "phase" | "situation" | "effect_window" | "battle" | "scoring" | "elimination_batch";
  phase: ReplaySnapshot["activePhase"];
  appliedLogEntries: string[];
  situationCardId?: string;
  effectWindow?: Extract<SimulationStep, { type: "resolve_effects" }>["window"];
  battlefieldId?: BattleResultState["battlefieldId"];
  winnerPlayerIds?: string[];
  tied?: boolean;
  winnerPlayerId?: string | null;
  margin?: number;
  scoringPlayerIds?: string[];
  eliminatedPlayerIds?: string[];
  candidatePlayerIds?: string[];
  finalOrder?: string[];
}

export interface ReplayRoundTimeline {
  roundNumber: number;
  entries: ReplayRoundTimelineEntry[];
}

export function buildReplaySnapshots(log: GameLogEntry[]): ReplayLogSnapshot[] {
  return log.map((entry, index) => ({
    step: index + 1,
    type: entry.type,
    message: entry.message,
  }));
}

export function buildRoundTimelineSummary(replay: ReplayLog): ReplayRoundTimeline[] {
  return buildRoundTimelineFromFrames(replay.frames);
}

export function compareReplayLogs(baseline: ReplayLog, candidate: ReplayLog): ReplayComparisonReport {
  const stepCount = Math.max(baseline.frames.length, candidate.frames.length);

  for (let index = 0; index < stepCount; index += 1) {
    const baselineSnapshot = baseline.frames[index]?.snapshot;
    const candidateSnapshot = candidate.frames[index]?.snapshot;
    const divergence = compareSnapshots(index + 1, baselineSnapshot, candidateSnapshot);

    if (divergence) {
      return {
        baselineMatchId: baseline.matchId,
        baselineSeed: baseline.seed,
        candidateMatchId: candidate.matchId,
        candidateSeed: candidate.seed,
        identical: false,
        firstDivergence: divergence,
        finalDifferences: diffSnapshotFields(baseline.finalSnapshot, candidate.finalSnapshot),
      };
    }
  }

  return {
    baselineMatchId: baseline.matchId,
    baselineSeed: baseline.seed,
    candidateMatchId: candidate.matchId,
    candidateSeed: candidate.seed,
    identical: true,
    firstDivergence: null,
    finalDifferences: [],
  };
}

export function compareReplayScenarios(
  baseline: ReplayScenarioInput,
  candidate: ReplayScenarioInput,
): ReplayComparisonReport {
  return compareReplayLogs(createReplayLogFromScenario(baseline), createReplayLogFromScenario(candidate));
}

export function formatReplayComparisonReport(report: ReplayComparisonReport): string {
  if (report.identical) {
    return [
      `Baseline replay: ${report.baselineMatchId} (seed ${report.baselineSeed})`,
      `Candidate replay: ${report.candidateMatchId} (seed ${report.candidateSeed})`,
      "Replay logs are identical.",
    ].join("\n");
  }

  const lines = [
    `Baseline replay: ${report.baselineMatchId} (seed ${report.baselineSeed})`,
    `Candidate replay: ${report.candidateMatchId} (seed ${report.candidateSeed})`,
    `First divergence: step ${report.firstDivergence?.step}, field ${report.firstDivergence?.field}`,
  ];

  if (report.firstDivergence) {
    lines.push(`Baseline: ${JSON.stringify(report.firstDivergence.baseline)}`);
    lines.push(`Candidate: ${JSON.stringify(report.firstDivergence.candidate)}`);
  }

  lines.push(`Final differences: ${report.finalDifferences.join(", ")}`);
  return lines.join("\n");
}

export function evaluateReplayComparisonMatrix(
  entries: ReplayComparisonMatrixEntry[],
): ReplayComparisonMatrixSummary {
  const items = entries.map((entry) => ({
    ...entry,
    passed: entry.report.identical === entry.expectedIdentical,
  }));
  const passed = items.filter((item) => item.passed).length;

  return {
    total: items.length,
    passed,
    failed: items.length - passed,
    items,
  };
}

export function formatReplayComparisonMatrixReport(summary: ReplayComparisonMatrixSummary): string {
  const lines = [
    `Scenario matrix summary: ${summary.passed}/${summary.total} checks passed`,
  ];

  for (const item of summary.items) {
    lines.push(
      `[${item.passed ? "PASS" : "FAIL"}] ${item.label} -> identical=${item.report.identical}, expected=${item.expectedIdentical}`,
    );
  }

  return lines.join("\n");
}

export function formatReplayComparisonMatrixJson(summary: ReplayComparisonMatrixSummary): string {
  return JSON.stringify(summary, null, 2);
}

export function createReplayLog(input: {
  matchId: string;
  seed: string;
  initialState: SimulationInput["initialState"];
  steps: SimulationInput["steps"];
}): ReplayLog {
  let state = input.initialState;
  const frames: ReplayFrame[] = [];

  input.steps.forEach((step, index) => {
    const result = applySimulationStep(state, step);
    state = result.nextState;

    frames.push({
      step: index + 1,
      simulationStep: step,
      appliedLogEntries: result.appliedLogEntries,
      snapshot: snapshotFromState(state),
    });
  });

  return {
    matchId: input.matchId,
    seed: input.seed,
    frames,
    finalSnapshot: snapshotFromState(state),
    roundTimeline: buildRoundTimelineFromFrames(frames),
  };
}

export function createReplayLogFromScenario(input: ReplayScenarioInput): ReplayLog {
  return createReplayLog({
    matchId: input.id,
    seed: input.seed,
    initialState: input.initialState,
    steps: input.steps,
  });
}

export function replayFromLog(
  initialState: SimulationInput["initialState"],
  replay: ReplayLog,
): {
  frames: ReplayFrame[];
  finalSnapshot: ReplaySnapshot;
  roundTimeline: ReplayRoundTimeline[];
} {
  let state = initialState;
  const frames: ReplayFrame[] = replay.frames.map((frame) => {
    const result = applySimulationStep(state, frame.simulationStep);
    state = result.nextState;

    return {
      ...frame,
      appliedLogEntries: result.appliedLogEntries,
      snapshot: snapshotFromState(state),
    };
  });

  return {
    frames,
    finalSnapshot: snapshotFromState(state),
    roundTimeline: buildRoundTimelineFromFrames(frames),
  };
}

function buildRoundTimelineFromFrames(frames: ReplayFrame[]): ReplayRoundTimeline[] {
  const rounds = new Map<number, ReplayRoundTimeline>();

  for (const frame of frames) {
    const roundNumber = frame.snapshot.roundNumber;
    const existingRound = rounds.get(roundNumber);

    const round = existingRound ?? {
      roundNumber,
      entries: [],
    };

    round.entries.push(...buildRoundTimelineEntries(frame));

    if (!existingRound) {
      rounds.set(roundNumber, round);
    }
  }

  return Array.from(rounds.values());
}

function buildRoundTimelineEntries(frame: ReplayFrame): ReplayRoundTimelineEntry[] {
  switch (frame.simulationStep.type) {
    case "step_phase":
      return [{
        step: frame.step,
        kind: "phase",
        phase: frame.snapshot.activePhase,
        appliedLogEntries: frame.appliedLogEntries,
      }];
    case "apply_situation":
      return [{
        step: frame.step,
        kind: "situation",
        phase: frame.snapshot.activePhase,
        appliedLogEntries: frame.appliedLogEntries,
        ...(frame.snapshot.currentSituationCardId
          ? { situationCardId: frame.snapshot.currentSituationCardId }
          : {}),
      }];
    case "resolve_effects":
      return [{
        step: frame.step,
        kind: "effect_window",
        phase: frame.snapshot.activePhase,
        appliedLogEntries: frame.appliedLogEntries,
        effectWindow: frame.simulationStep.window,
      }];
    case "resolve_battle": {
      const battleSummary = summarizeBattleOutcome(frame.snapshot.lastBattle);

      return [{
        step: frame.step,
        kind: "battle",
        phase: frame.snapshot.activePhase,
        appliedLogEntries: frame.appliedLogEntries,
        battlefieldId: frame.snapshot.lastBattle?.battlefieldId ?? frame.simulationStep.battlefieldId,
        ...(battleSummary ? {
          winnerPlayerIds: battleSummary.winnerPlayerIds,
          tied: battleSummary.tied,
          winnerPlayerId: battleSummary.winnerPlayerId,
          margin: battleSummary.margin,
        } : {}),
      }];
    }
    case "apply_scoring": {
      const eliminatedPlayers = (frame.snapshot.lastScoring?.players ?? [])
        .filter((player) => player.eliminated)
        .sort((left, right) => (left.eliminationOrder ?? Number.MAX_SAFE_INTEGER) - (right.eliminationOrder ?? Number.MAX_SAFE_INTEGER))
        .map((player) => player.playerId);

      const entries: ReplayRoundTimelineEntry[] = [{
        step: frame.step,
        kind: "scoring",
        phase: frame.snapshot.activePhase,
        appliedLogEntries: frame.appliedLogEntries,
        scoringPlayerIds: frame.snapshot.lastScoring?.players.map((player) => player.playerId) ?? [],
        ...(eliminatedPlayers.length > 0 ? { eliminatedPlayerIds: eliminatedPlayers } : {}),
      }];

      if (frame.snapshot.lastEliminationBatch) {
        entries.push({
          step: frame.step,
          kind: "elimination_batch",
          phase: frame.snapshot.activePhase,
          appliedLogEntries: frame.appliedLogEntries,
          candidatePlayerIds: frame.snapshot.lastEliminationBatch.candidates.map((candidate) => candidate.playerId),
          finalOrder: frame.snapshot.lastEliminationBatch.finalOrder,
        });
      }

      return entries;
    }
  }
}

function summarizeBattleOutcome(
  battle: ReplaySnapshot["lastBattle"],
): { winnerPlayerIds: string[]; tied: boolean; winnerPlayerId: string | null; margin: number } | null {
  if (!battle) {
    return null;
  }

  if (battle.winnerPlayerIds.length > 0 || battle.winnerPlayerId !== null) {
    return {
      winnerPlayerIds: battle.winnerPlayerIds,
      tied: battle.tied,
      winnerPlayerId: battle.winnerPlayerId,
      margin: battle.margin,
    };
  }

  const [winner, runnerUp] = battle.participantBreakdowns;

  if (!winner) {
    return null;
  }

  if (runnerUp && runnerUp.effectivePower === winner.effectivePower) {
    const winnerPlayerIds = battle.participantBreakdowns
      .filter((participant) => participant.effectivePower === winner.effectivePower)
      .map((participant) => participant.playerId);
    return {
      winnerPlayerIds,
      tied: winnerPlayerIds.length > 1,
      winnerPlayerId: null,
      margin: 0,
    };
  }

  return {
    winnerPlayerIds: [winner.playerId],
    tied: false,
    winnerPlayerId: winner.playerId,
    margin: winner.effectivePower - (runnerUp?.effectivePower ?? 0),
  };
}

function snapshotFromState(state: GameState): ReplaySnapshot {
  const scoringBreakdown = state.scoringBreakdown ?? [];

  return {
    roundNumber: state.round.roundNumber,
    activePhase: state.round.activePhase,
    activePlayers: countActivePlayers(state),
    thresholdBucket: thresholdBucketFromActivePlayers(countActivePlayers(state)),
    currentSituationCardId: state.currentSituationCardId ?? null,
    playerMana: state.players.map((player) => ({
      playerId: player.id,
      mana: player.mana,
    })),
    eventPlacements: state.eventPlacements.map((placement) => ({
      locationId: placement.locationId,
      eventCardId: placement.eventCardId,
      visibilityScope: placement.visibility.scope,
    })),
    lastBattle: state.battleResults.length > 0
      ? {
          battlefieldId: state.battleResults[state.battleResults.length - 1]!.battlefieldId,
          winnerPlayerIds: state.battleResults[state.battleResults.length - 1]!.winnerPlayerIds,
          tied: state.battleResults[state.battleResults.length - 1]!.tied,
          winnerPlayerId: state.battleResults[state.battleResults.length - 1]!.winnerPlayerId,
          margin: state.battleResults[state.battleResults.length - 1]!.margin,
          participantBreakdowns:
            state.battleResults[state.battleResults.length - 1]!.participantBreakdowns,
        }
      : extractLastBattleFromLog(state.log),
    lastScoring: scoringBreakdown.length > 0
      ? {
          players: scoringBreakdown,
        }
      : extractLastScoringFromLog(state.log),
    lastEliminationBatch: extractLastEliminationBatchFromLog(state.log),
  };
}

function extractLastBattleFromLog(
  log: GameLogEntry[],
): {
  battlefieldId: BattleResultState["battlefieldId"];
  winnerPlayerIds: string[];
  tied: boolean;
  winnerPlayerId: string | null;
  margin: number;
  participantBreakdowns: BattleParticipantBreakdown[];
} | null {
  for (let index = log.length - 1; index >= 0; index -= 1) {
    const entry = log[index];
    if (!entry || entry.type !== "battle_resolved") {
      continue;
    }

    const payload = entry.payload;
    const battlefieldId = (typeof payload?.battlefieldId === "string"
      ? payload.battlefieldId
      : entry.message.replace("battlefield:", "").replace("return_silence:", "")) as BattleResultState["battlefieldId"];
    const winnerPlayerIds = Array.isArray(payload?.winnerPlayerIds)
      ? payload.winnerPlayerIds.filter((playerId): playerId is string => typeof playerId === "string")
      : typeof payload?.winnerPlayerId === "string" ? [payload.winnerPlayerId] : [];
    const winnerPlayerId = typeof payload?.winnerPlayerId === "string" ? payload.winnerPlayerId : null;
    const tied = typeof payload?.tied === "boolean" ? payload.tied : winnerPlayerIds.length > 1;
    const margin = typeof payload?.margin === "number" ? payload.margin : 0;
    const participantBreakdowns = Array.isArray(payload?.participantBreakdowns)
      ? (payload.participantBreakdowns as BattleParticipantBreakdown[])
      : [];

    return {
      battlefieldId,
      winnerPlayerIds,
      tied,
      winnerPlayerId,
      margin,
      participantBreakdowns,
    };
  }

  return null;
}

function extractLastScoringFromLog(
  log: GameLogEntry[],
): {
  players: PlayerScoringBreakdown[];
} | null {
  for (let index = log.length - 1; index >= 0; index -= 1) {
    const entry = log[index];
    if (!entry || entry.type !== "battle_scored") {
      continue;
    }

    const payload = entry.payload;
    const players = Array.isArray(payload?.scoringBreakdown)
      ? (payload.scoringBreakdown as PlayerScoringBreakdown[])
      : [];

    return {
      players,
    };
  }

  return null;
}

function extractLastEliminationBatchFromLog(
  log: GameLogEntry[],
): {
  candidates: ResolvedEliminationCandidate[];
  finalOrder: string[];
} | null {
  for (let index = log.length - 1; index >= 0; index -= 1) {
    const entry = log[index];
    if (!entry || entry.type !== "elimination_batch_resolved") {
      continue;
    }

    const payload = entry.payload;
    const candidates = Array.isArray(payload?.candidates)
      ? (payload.candidates as ResolvedEliminationCandidate[])
      : [];
    const finalOrder = Array.isArray(payload?.finalOrder)
      ? payload.finalOrder.filter((value): value is string => typeof value === "string")
      : [];

    return {
      candidates,
      finalOrder,
    };
  }

  return null;
}

function compareSnapshots(
  step: number,
  baseline: ReplaySnapshot | undefined,
  candidate: ReplaySnapshot | undefined,
): ReplayDivergence | null {
  const fields: ReplayDivergence["field"][] = [
    "roundNumber",
    "activePhase",
    "activePlayers",
    "thresholdBucket",
    "currentSituationCardId",
    "playerMana",
    "eventPlacements",
    "lastBattle",
    "lastScoring",
    "lastEliminationBatch",
  ];

  for (const field of fields) {
    const baselineValue = baseline?.[field];
    const candidateValue = candidate?.[field];

    if (JSON.stringify(baselineValue) !== JSON.stringify(candidateValue)) {
      return {
        step,
        field,
        baseline: baselineValue,
        candidate: candidateValue,
      };
    }
  }

  return null;
}

function diffSnapshotFields(
  baseline: ReplaySnapshot,
  candidate: ReplaySnapshot,
): Array<ReplayDivergence["field"]> {
  const fields: ReplayDivergence["field"][] = [
    "roundNumber",
    "activePhase",
    "activePlayers",
    "thresholdBucket",
    "currentSituationCardId",
    "playerMana",
    "eventPlacements",
    "lastBattle",
    "lastScoring",
    "lastEliminationBatch",
  ];

  return fields.filter((field) => JSON.stringify(baseline[field]) !== JSON.stringify(candidate[field]));
}

function thresholdBucketFromActivePlayers(activePlayers: number): ReplaySnapshot["thresholdBucket"] {
  if (activePlayers <= 2) {
    return "two_or_less";
  }

  if (activePlayers <= 3) {
    return "three_or_less";
  }

  if (activePlayers <= 4) {
    return "four_or_less";
  }

  return "default";
}
