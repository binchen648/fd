import { describe, expect, it } from "vitest";

import { stepGameLoop } from "../../src/core/game-loop";
import { createSeededGameState } from "../../src/tools/seeded-state";

describe("game loop action phase card play", () => {
  it("allows a battlefield play only when at least one of the two cards is revealed", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1" ? { ...player, locationId: "miyama_town" } : player,
    );

    const p1Hand = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .slice(0, 2)
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: p1Hand,
        revealedCardInstanceIds: [p1Hand[0]!],
      },
    });

    const played = result.nextState.cards.filter((card) => p1Hand.includes(card.instanceId));
    expect(result.transition.to).toBe("battle");
    expect(played.every((card) => card.zone === "field")).toBe(true);
    expect(played.find((card) => card.instanceId === p1Hand[0])?.visibility.scope).toBe("public");
    expect(played.find((card) => card.instanceId === p1Hand[1])?.visibility.scope).toBe("owner_only");
  });

  it("rejects a battlefield play when both cards are concealed", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1" ? { ...player, locationId: "miyama_town" } : player,
    );

    const p1Hand = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .slice(0, 2)
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: p1Hand,
        revealedCardInstanceIds: [],
      },
    });

    const unchanged = result.nextState.cards.filter((card) => p1Hand.includes(card.instanceId));
    expect(unchanged.every((card) => card.zone === "hand")).toBe(true);
  });

  it("allows a non-battlefield play with both cards concealed", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p3" ? { ...player, locationId: "magic_workshop", mana: 8 } : player,
    );

    const p3Hand = state.cards
      .filter((card) => card.ownerPlayerId === "p3" && card.zone === "hand")
      .slice(0, 2)
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p3",
        cardInstanceIds: p3Hand,
        revealedCardInstanceIds: [],
      },
    });

    const played = result.nextState.cards.filter((card) => p3Hand.includes(card.instanceId));
    expect(played.every((card) => card.zone === "field")).toBe(true);
    expect(played.every((card) => card.visibility.scope === "owner_only")).toBe(true);
  });


  it("rejects servant_skill pair play when the player has less than eight mana", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "magic_workshop", mana: 7 }
        : player,
    );

    const skillPair = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .filter((card) => {
        const defId = card.definitionId;
        return defId === "servant-1c" || defId === "servant-1d";
      })
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: skillPair,
        revealedCardInstanceIds: [],
      },
    });

    const unchanged = result.nextState.cards.filter((card) => skillPair.includes(card.instanceId));
    expect(unchanged.every((card) => card.zone === "hand")).toBe(true);
  });

  it("allows servant_skill pair play once the player has eight mana", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "magic_workshop", mana: 8 }
        : player,
    );

    const skillPair = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .filter((card) => {
        const defId = card.definitionId;
        return defId === "servant-1c" || defId === "servant-1d";
      })
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: skillPair,
        revealedCardInstanceIds: [],
      },
    });

    const played = result.nextState.cards.filter((card) => skillPair.includes(card.instanceId));
    expect(played.every((card) => card.zone === "field")).toBe(true);
  });


  it("deducts the total cost of a normal attack pair on success", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1" ? { ...player, locationId: "miyama_town", mana: 4 } : player,
    );

    const attackPair = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .filter((card) => {
        const defId = card.definitionId;
        return defId === "servant-1a" || defId === "servant-1b";
      })
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: attackPair,
        revealedCardInstanceIds: [attackPair[0]!],
      },
    });

    expect(result.nextState.players.find((player) => player.id === "p1")?.mana).toBe(2);
  });

  it("rejects pair play when the player cannot pay total card cost", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1" ? { ...player, locationId: "miyama_town", mana: 1 } : player,
    );

    const attackPair = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .filter((card) => {
        const defId = card.definitionId;
        return defId === "servant-1a" || defId === "servant-1b";
      })
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: attackPair,
        revealedCardInstanceIds: [attackPair[0]!],
      },
    });

    const unchanged = result.nextState.cards.filter((card) => attackPair.includes(card.instanceId));
    expect(unchanged.every((card) => card.zone === "hand")).toBe(true);
    expect(result.nextState.players.find((player) => player.id === "p1")?.mana).toBe(1);
  });

  it("deducts cost after a valid servant_skill pair play", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "magic_workshop", mana: 8 }
        : player,
    );

    const skillPair = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .filter((card) => {
        const defId = card.definitionId;
        return defId === "servant-1c" || defId === "servant-1d";
      })
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: skillPair,
        revealedCardInstanceIds: [],
      },
    });

    expect(result.nextState.players.find((player) => player.id === "p1")?.mana).toBe(5);
  });

  it("ignores an invalid pair and keeps cards in hand", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "action";

    const p1Hand = state.cards
      .filter((card) => card.ownerPlayerId === "p1" && card.zone === "hand")
      .slice(0, 1)
      .map((card) => card.instanceId);

    const result = stepGameLoop(state, {
      action: {
        type: "play",
        playerId: "p1",
        cardInstanceIds: p1Hand,
        revealedCardInstanceIds: p1Hand,
      },
    });

    const unchanged = result.nextState.cards.filter((card) => p1Hand.includes(card.instanceId));
    expect(result.transition.to).toBe("battle");
    expect(unchanged.every((card) => card.zone === "hand")).toBe(true);
  });
});
