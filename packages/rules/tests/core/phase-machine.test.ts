import { describe, expect, it } from "vitest";

import { stepGameLoop } from "../../src/core/game-loop";
import { getEligibleActionSeats, getInitialPhase, getNextPhase } from "../../src/core/phase-machine";
import type { GameState } from "../../src/schema/game";

describe("phase machine", () => {
  it("walks through one full round and returns to round_start", () => {
    let phase = getInitialPhase();

    phase = getNextPhase(phase);
    phase = getNextPhase(phase);
    phase = getNextPhase(phase);
    phase = getNextPhase(phase);
    phase = getNextPhase(phase);
    phase = getNextPhase(phase);
    phase = getNextPhase(phase);

    expect(phase).toBe("round_start");
  });

  it("excludes eliminated players from action seats", () => {
    const eligible = getEligibleActionSeats({
      activePlayerSeats: [1, 2, 3, 4, 5, 6, 7],
      eliminatedPlayerSeats: [3, 6],
    });

    expect(eligible).toEqual([1, 2, 4, 5, 7]);
  });

  it("increments round number only after round_end cycles back", () => {
    const state: GameState = {
      id: "match-1",
      players: [],
      round: {
        roundNumber: 1,
        activePhase: "round_end",
        prioritySeat: 1,
      },
      map: {
        id: "default-7p",
        playerCount: 7,
        locations: [],
      },
      locationConfig: {
        enabledLocationIds: [],
      },
      cards: [],
      eventPlacements: [],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("round_start");
    expect(result.nextState.round.roundNumber).toBe(2);
  });
});
