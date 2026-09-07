import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { simulateSeededMatch } from "../../src/tools/simulate";
import type { GameState } from "../../src/schema/game";
import type { SimulationInput } from "../../src/tools/simulate";

const scenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/minimal-7p-seeded-scenario.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: GameState;
  steps: SimulationInput["steps"];
};

describe("minimal seeded 7-player scenario", () => {
  it("keeps a 7-player table with Moon Holy Grail enabled", () => {
    expect(scenario.initialState.players).toHaveLength(7);
    expect(scenario.initialState.locationConfig.enabledLocationIds).toContain("moon_holy_grail");
  });

  it("produces deterministic round-one validation output", () => {
    const result = simulateSeededMatch({
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    expect(result.frames).toHaveLength(scenario.steps.length);
    expect(result.finalState.currentSituationCardId).toBe("perfect-flow");
    expect(result.finalState.round.activePhase).toBe("cleanup");
    expect(result.finalState.players.every((player) => player.mana === 2)).toBe(true);
    expect(result.finalState.effectStack).toHaveLength(0);
    expect(result.finalState.log.some((entry) => entry.message === "battlefield:shinto")).toBe(true);
  });
});
