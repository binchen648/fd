import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { simulateSeededMatch } from "../../src/tools/simulate";
import type { GameState } from "../../src/schema/game";
import type { SimulationInput } from "../../src/tools/simulate";

const scenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/moon-holy-grail-threshold-scenario.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: GameState;
  steps: SimulationInput["steps"];
};

describe("moon holy grail seeded scenario", () => {
  it("awards Moon Holy Grail VP and reduces remaining players after elimination", () => {
    const result = simulateSeededMatch({
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    const winner = result.finalState.players.find((player) => player.id === "p1");
    const defeated = result.finalState.players.find((player) => player.id === "p2");

    expect(winner).toMatchObject({
      vp: 2,
      militaryResult: 3,
      status: "active",
    });
    expect(defeated).toMatchObject({
      militaryResult: -9,
      status: "eliminated",
    });
    expect(result.frames.at(-1)?.activePlayers).toBe(3);
    expect(result.finalState.log.some((entry) => entry.message === "active_players:3")).toBe(true);
    expect(result.finalState.scoringBreakdown?.[0]).toMatchObject({
      playerId: "p1",
      vpDelta: 2,
      militaryDelta: 3,
    });
  });
});
