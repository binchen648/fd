import { describe, expect, it } from "vitest";

import { stepGameLoop } from "../../src/core/game-loop";
import { createSeededGameState } from "../../src/tools/seeded-state";

describe("game loop action phase", () => {
  it("executes a normal movement action during the action phase", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p3"
        ? { ...player, locationId: "magic_workshop", mana: 7 }
        : player,
    );

    const result = stepGameLoop(state, {
      action: {
        type: "move",
        playerId: "p3",
        to: "recon",
        movementKind: "normal",
      },
    });

    expect(result.transition.to).toBe("battle");
    expect(result.nextState.players.find((player) => player.id === "p3")).toMatchObject({
      locationId: "recon",
      mana: 2,
    });
    expect(result.nextState.log).toContainEqual(
      expect.objectContaining({
        type: "movement",
        message: "player:p3:normal_move:magic_workshop->recon",
      }),
    );
  });

  it("keeps the player in place when the action movement is illegal", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town", mana: 4 }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );

    const result = stepGameLoop(state, {
      action: {
        type: "move",
        playerId: "p1",
        to: "shinto",
        movementKind: "normal",
      },
    });

    expect(result.transition.to).toBe("battle");
    expect(result.nextState.players.find((player) => player.id === "p1")).toMatchObject({
      locationId: "miyama_town",
      mana: 4,
    });
  });
});
