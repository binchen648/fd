import { describe, expect, it } from "vitest";

import type { GameState } from "../../src/schema/game";

describe("game schema", () => {
  it("supports a 7-player game shell with optional Moon Holy Grail enabled", () => {
    const game: GameState = {
      id: "match-1",
      players: Array.from({ length: 7 }, (_, index) => ({
        id: `p${index + 1}`,
        seat: index + 1,
        status: "active",
        masterCardId: `master-${index + 1}`,
        servantCardId: `servant-${index + 1}`,
        vp: 0,
        militaryResult: 0,
        mana: 0,
      })),
      round: {
        roundNumber: 1,
        activePhase: "round_start",
        prioritySeat: 1,
      },
      map: {
        id: "default-7p",
        playerCount: 7,
        locations: [],
      },
      locationConfig: {
        enabledLocationIds: ["moon_holy_grail"],
      },
      cards: [],
      eventPlacements: [],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    expect(game.players).toHaveLength(7);
    expect(game.locationConfig.enabledLocationIds).toContain("moon_holy_grail");
  });
});
