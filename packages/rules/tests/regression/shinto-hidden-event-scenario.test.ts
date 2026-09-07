import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createReplayLog, replayFromLog } from "../../src/tools/replay";
import { simulateSeededMatch } from "../../src/tools/simulate";
import type { GameState } from "../../src/schema/game";
import type { SimulationInput } from "../../src/tools/simulate";

const scenario = JSON.parse(
  readFileSync(
    join(__dirname, "../../src/data/scenarios/shinto-hidden-event-scenario.json"),
    "utf8",
  ),
) as {
  id: string;
  seed: string;
  initialState: GameState;
  steps: SimulationInput["steps"];
};

describe("shinto hidden event scenario", () => {
  it("keeps the Shinto event hidden until battle reveal and replays deterministically", () => {
    const result = simulateSeededMatch({
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });

    expect(result.frames[0]?.activePhase).toBe("battle");
    expect(result.finalState.eventPlacements[0]?.visibility.scope).toBe("public");

    const replay = createReplayLog({
      matchId: scenario.id,
      seed: scenario.seed,
      initialState: scenario.initialState,
      steps: scenario.steps,
    });
    const replayed = replayFromLog(scenario.initialState, replay);

    expect(replayed.finalSnapshot).toEqual(replay.finalSnapshot);
    expect(replay.finalSnapshot.eventPlacements[0]?.visibilityScope).toBe("public");
  });
});
