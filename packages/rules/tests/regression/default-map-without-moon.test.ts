import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { simulateSeededMatch } from "../../src/tools/simulate";
import type { GameState } from "../../src/schema/game";
import type { SimulationInput } from "../../src/tools/simulate";

const scenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/default-map-without-moon.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: GameState;
  steps: SimulationInput["steps"];
};

describe("default map without moon holy grail", () => {
  it("ignores moon holy grail battle steps when the optional location is disabled", () => {
    const result = simulateSeededMatch({
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    expect(result.finalState.locationConfig.enabledLocationIds).not.toContain("moon_holy_grail");
    expect(result.finalState.battleResults).toHaveLength(0);
    expect(result.finalState.players[0]?.vp).toBe(0);
    expect(result.finalState.log.some((entry) => entry.message === "battlefield_skipped:moon_holy_grail")).toBe(true);
  });
});
