import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildRoundTimelineSummary,
  compareReplayScenarios,
  compareReplayLogs,
  createReplayLog,
  evaluateReplayComparisonMatrix,
  formatReplayComparisonMatrixReport,
  formatReplayComparisonMatrixJson,
  formatReplayComparisonReport,
  replayFromLog,
} from "../../src/tools/replay";
import type { SimulationInput } from "../../src/tools/simulate";

const scenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/minimal-7p-seeded-scenario.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: SimulationInput["initialState"];
  steps: SimulationInput["steps"];
};

const moonThresholdScenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/moon-holy-grail-threshold-scenario.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: SimulationInput["initialState"];
  steps: SimulationInput["steps"];
};

const moonThresholdDivergentScenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/moon-holy-grail-threshold-scenario-divergent-001.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: SimulationInput["initialState"];
  steps: SimulationInput["steps"];
};

const moonThresholdThresholdShiftedScenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/moon-holy-grail-threshold-scenario-divergent-002.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: SimulationInput["initialState"];
  steps: SimulationInput["steps"];
};

describe("replay tooling", () => {
  it("replays the same seeded script deterministically", () => {
    const replay = createReplayLog({
      matchId: scenario.id,
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    const replayed = replayFromLog(scenario.initialState, replay);

    expect(replayed.finalSnapshot).toEqual(replay.finalSnapshot);
    expect(replayed.frames.map((frame) => frame.snapshot)).toEqual(
      replay.frames.map((frame) => frame.snapshot),
    );
  });

  it("captures hidden event reveal in the replay snapshot", () => {
    const replay = createReplayLog({
      matchId: scenario.id,
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    const shintoPlacement = replay.finalSnapshot.eventPlacements.find(
      (placement) => placement.locationId === "shinto",
    );

    expect(shintoPlacement?.visibilityScope).toBe("public");
  });

  it("captures the final battle modifier breakdown in the replay snapshot", () => {
    const replay = createReplayLog({
      matchId: scenario.id,
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    expect(replay.finalSnapshot.lastBattle?.battlefieldId).toBe("shinto");
    expect(replay.finalSnapshot.lastBattle?.participantBreakdowns).toEqual([
      {
        playerId: "p1",
        basePower: 0,
        totalModifier: 0,
        effectivePower: 0,
        modifiers: [],
      },
    ]);
  });

  it("captures the final scoring breakdown in the replay snapshot", () => {
    const replay = createReplayLog({
      matchId: scenario.id,
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    expect(replay.finalSnapshot.lastScoring?.players).toEqual([
      {
        playerId: "p1",
        vpDelta: 1,
        militaryDelta: 0,
        eliminated: false,
        reasons: [
          { source: "battle_vp", value: 1, label: "shinto.vp" },
          { source: "military_result", value: 0, label: "shinto.margin" },
        ],
      },
    ]);
  });

  it("surfaces player mana changes through replay snapshot comparison", () => {
    const changedScenario = {
      ...scenario,
      initialState: {
        ...scenario.initialState,
        players: scenario.initialState.players.map((player, index) =>
          index === 0 ? { ...player, mana: player.mana + 1 } : player,
        ),
      },
    };

    const report = compareReplayScenarios(scenario, changedScenario);

    expect(report.identical).toBe(false);
    expect(report.firstDivergence?.field).toBe("playerMana");
    expect(report.finalDifferences).toContain("playerMana");
  });

  it("builds a round timeline summary that chains situation, phase, battle, and scoring", () => {
    const replay = createReplayLog({
      matchId: scenario.id,
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    const timeline = buildRoundTimelineSummary(replay);

    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.roundNumber).toBe(1);
    expect(timeline[0]?.entries.map((entry) => ({ kind: entry.kind, phase: entry.phase }))).toEqual([
      { kind: "situation", phase: "round_start" },
      { kind: "phase", phase: "preparation" },
      { kind: "phase", phase: "advance" },
      { kind: "phase", phase: "action" },
      { kind: "effect_window", phase: "action" },
      { kind: "phase", phase: "battle" },
      { kind: "battle", phase: "battle" },
      { kind: "phase", phase: "cleanup" },
      { kind: "scoring", phase: "cleanup" },
    ]);
    expect(timeline[0]?.entries.find((entry) => entry.kind === "situation")).toMatchObject({
      situationCardId: "perfect-flow",
    });
    expect(timeline[0]?.entries.find((entry) => entry.kind === "battle")).toMatchObject({
      battlefieldId: "shinto",
      winnerPlayerIds: ["p1"],
      tied: false,
      winnerPlayerId: "p1",
      margin: 0,
    });
    expect(timeline[0]?.entries.find((entry) => entry.kind === "scoring")).toMatchObject({
      scoringPlayerIds: ["p1"],
    });
  });

  it("reports the first divergent step between two replay logs", () => {
    const baseline = createReplayLog({
      matchId: scenario.id,
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });
    const changed = createReplayLog({
      matchId: scenario.id,
      seed: `${scenario.seed}-changed`,
      initialState: scenario.initialState,
      steps: scenario.steps.map((step, index) =>
        index === 6 && step.type === "resolve_battle"
          ? {
              ...step,
              participants: [{ playerId: "p1", totalPower: 2 }],
            }
          : step,
      ),
    });

    const report = compareReplayLogs(baseline, changed);

    expect(report.identical).toBe(false);
    expect(report.firstDivergence?.step).toBe(7);
    expect(report.firstDivergence?.field).toBe("lastBattle");
    expect(report.finalDifferences).toContain("lastBattle");
    expect(report.finalDifferences).toContain("lastScoring");
  });

  it("formats a human-readable replay comparison report", () => {
    const formatted = formatReplayComparisonReport({
      baselineMatchId: "baseline-match",
      baselineSeed: "baseline-seed",
      candidateMatchId: "candidate-match",
      candidateSeed: "candidate-seed",
      identical: false,
      firstDivergence: {
        step: 7,
        field: "lastBattle",
        baseline: { battlefieldId: "shinto" },
        candidate: { battlefieldId: "moon_holy_grail" },
      },
      finalDifferences: ["lastBattle", "lastScoring"],
    });

    expect(formatted).toContain("Baseline replay: baseline-match (seed baseline-seed)");
    expect(formatted).toContain("Candidate replay: candidate-match (seed candidate-seed)");
    expect(formatted).toContain("First divergence: step 7, field lastBattle");
    expect(formatted).toContain("Final differences: lastBattle, lastScoring");
  });

  it("compares two seeded scenarios by generating replay logs first", () => {
    const changedScenario = {
      ...scenario,
      seed: `${scenario.seed}-changed`,
      steps: scenario.steps.map((step, index) =>
        index === 6 && step.type === "resolve_battle"
          ? {
              ...step,
              participants: [{ playerId: "p1", totalPower: 2 }],
            }
          : step,
      ),
    };

    const report = compareReplayScenarios(scenario, changedScenario);

    expect(report.identical).toBe(false);
    expect(report.firstDivergence?.step).toBe(7);
    expect(report.firstDivergence?.field).toBe("lastBattle");
    expect(report.finalDifferences).toContain("lastBattle");
    expect(report.finalDifferences).toContain("lastScoring");
  });

  it("reports Moon Holy Grail divergence from scenario files", () => {
    const report = compareReplayScenarios(moonThresholdScenario, moonThresholdDivergentScenario);

    expect(report.identical).toBe(false);
    expect(report.firstDivergence?.step).toBe(1);
    expect(report.firstDivergence?.field).toBe("lastBattle");
    expect(report.finalDifferences).toContain("lastBattle");
    expect(report.finalDifferences).toContain("lastScoring");
  });

  it("surfaces elimination order through replay scoring snapshots and timeline", () => {
    const replay = createReplayLog({
      matchId: moonThresholdScenario.id,
      seed: moonThresholdScenario.seed,
      initialState: moonThresholdScenario.initialState,
      steps: moonThresholdScenario.steps,
    });

    expect(replay.finalSnapshot.lastEliminationBatch).toMatchObject({
      finalOrder: ["p2"],
      candidates: [
        expect.objectContaining({
          playerId: "p2",
          eliminationOrder: 1,
        }),
      ],
    });
    expect(replay.finalSnapshot.lastScoring?.players).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          playerId: "p2",
          eliminated: true,
          eliminationOrder: 1,
        }),
      ]),
    );
    expect(replay.roundTimeline[0]?.entries.find((entry) => entry.kind === "scoring")).toMatchObject({
      scoringPlayerIds: ["p1", "p2"],
      eliminatedPlayerIds: ["p2"],
    });
    expect(replay.roundTimeline[0]?.entries.find((entry) => entry.kind === "elimination_batch")).toMatchObject({
      finalOrder: ["p2"],
      candidatePlayerIds: ["p2"],
    });
  });

  it("surfaces threshold bucket divergence in replay snapshots", () => {
    const report = compareReplayScenarios(moonThresholdScenario, moonThresholdThresholdShiftedScenario);

    expect(report.identical).toBe(false);
    expect(report.finalDifferences).toContain("activePlayers");
    expect(report.finalDifferences).toContain("thresholdBucket");
  });

  it("formats a scenario comparison matrix summary", () => {
    const summary = evaluateReplayComparisonMatrix([
      {
        label: "minimal-seeded",
        expectedIdentical: true,
        report: compareReplayScenarios(scenario, scenario),
      },
      {
        label: "moon-threshold-divergent",
        expectedIdentical: false,
        report: compareReplayScenarios(moonThresholdScenario, moonThresholdThresholdShiftedScenario),
      },
    ]);

    const formatted = formatReplayComparisonMatrixReport(summary);

    expect(formatted).toContain("Scenario matrix summary: 2/2 checks passed");
    expect(formatted).toContain("[PASS] minimal-seeded -> identical=true, expected=true");
    expect(formatted).toContain("[PASS] moon-threshold-divergent -> identical=false, expected=false");
  });

  it("formats a scenario comparison matrix as machine-readable json", () => {
    const summary = evaluateReplayComparisonMatrix([
      {
        label: "minimal-seeded",
        expectedIdentical: true,
        report: compareReplayScenarios(scenario, scenario),
      },
    ]);

    const parsed = JSON.parse(formatReplayComparisonMatrixJson(summary)) as {
      total: number;
      passed: number;
      failed: number;
      items: Array<{
        label: string;
        passed: boolean;
        report: {
          baselineMatchId: string;
          baselineSeed: string;
          identical: boolean;
        };
      }>;
    };

    expect(parsed.total).toBe(1);
    expect(parsed.passed).toBe(1);
    expect(parsed.failed).toBe(0);
    expect(parsed.items[0]).toMatchObject({
      label: "minimal-seeded",
      passed: true,
      report: {
        baselineMatchId: scenario.id,
        baselineSeed: scenario.seed,
        identical: true,
      },
    });
  });
});
