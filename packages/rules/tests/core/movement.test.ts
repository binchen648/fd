import { describe, expect, it } from "vitest";

import { movePlayer } from "../../src/core/movement";
import { createSeededGameState } from "../../src/tools/seeded-state";

describe("movement", () => {
  it("spends default path mana for normal movement during the action phase", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p3"
        ? { ...player, locationId: "magic_workshop", mana: 7 }
        : player,
    );

    const result = movePlayer(state, {
      playerId: "p3",
      to: "recon",
      movementKind: "normal",
    });

    expect(result.moved).toBe(true);
    expect(result.manaSpent).toBe(5);
    expect(result.nextState.players.find((player) => player.id === "p3")).toMatchObject({
      locationId: "recon",
      mana: 2,
    });
  });

  it("blocks normal movement while engaged", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town", mana: 4 }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );

    const result = movePlayer(state, {
      playerId: "p1",
      to: "shinto",
      movementKind: "normal",
    });

    expect(result.moved).toBe(false);
    expect(result.reason).toBe("engaged");
    expect(result.nextState.players.find((player) => player.id === "p1")).toMatchObject({
      locationId: "miyama_town",
      mana: 4,
    });
  });

  it("allows effect movement to bypass engagement and mana cost", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town", mana: 0 }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );

    const result = movePlayer(state, {
      playerId: "p1",
      to: "shinto",
      movementKind: "effect",
    });

    expect(result.moved).toBe(true);
    expect(result.manaSpent).toBe(0);
    expect(result.nextState.players.find((player) => player.id === "p1")).toMatchObject({
      locationId: "shinto",
      mana: 0,
    });
  });
});
