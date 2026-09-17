import { describe, expect, it } from "vitest";

import { stepGameLoop } from "../../src/core/game-loop";
import { createSeededGameState } from "../../src/tools/seeded-state";

describe("game loop battle and cleanup phases", () => {
  it("resolves contested battlefields during the battle phase", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town" }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-1a-instance"
        ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
        : card.instanceId === "servant-2b-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p2" }
          : card,
    );

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.battleResults).toHaveLength(0);
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "miyama_town",
      winnerPlayerId: "p2",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.log).toContainEqual(
      expect.objectContaining({
        type: "battle_resolved",
        message: "battlefield:miyama_town",
      }),
    );
  });

  it("applies queued battle scoring during cleanup and clears pending battle results", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "cleanup";
    state.players = state.players.map((player) =>
      player.id === "p2" ? { ...player, militaryResult: -7 } : player,
    );
    state.battleResults = [
      {
        battlefieldId: "miyama_town",
        winnerPlayerId: "p1",
        margin: 1,
        vpReward: 1,
        militaryAdjustments: [
          { playerId: "p1", delta: 1 },
          { playerId: "p2", delta: -1 },
        ],
        participantBreakdowns: [],
      },
    ];

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("round_end");
    expect(result.nextState.players.find((player) => player.id === "p1")).toMatchObject({
      vp: 1,
      militaryResult: 1,
      status: "active",
    });
    expect(result.nextState.players.find((player) => player.id === "p2")).toMatchObject({
      militaryResult: -8,
      status: "eliminated",
      eliminationOrder: 1,
    });
    expect(result.nextState.battleResults).toHaveLength(0);
    expect(result.nextState.log).toContainEqual(
      expect.objectContaining({
        type: "battle_scored",
        message: "scored:miyama_town",
      }),
    );
  });

  it("applies battle timing combat modifiers from the effect stack before battle resolution", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town" }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-1a-instance"
        ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
        : card.instanceId === "servant-2b-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p2" }
          : card,
    );
    state.effectStack = [
      {
        sourceCardId: "card-battle-buff",
        controllerPlayerId: "p1",
        effect: {
          id: "effect-battle-buff",
          timing: "battle",
          handler: "grant_combat_modifier",
          payload: {
            targetPlayerId: "p1",
            sourceCardDefinitionId: "servant-1c",
            skillId: "servant-1c",
            targetTag: "infantry",
            value: 2,
          },
        },
      },
    ];

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "miyama_town",
      winnerPlayerId: "p1",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.battleSkillEffects).toHaveLength(1);
  });

  it("clears temporary battle skill effects during cleanup", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "cleanup";
    state.battleSkillEffects = [
      {
        ownerPlayerId: "p1",
        sourceCardDefinitionId: "servant-1c",
        skillId: "servant-1c",
        combatModifiers: [
          {
            sourceId: "servant-1c",
            targetTag: "infantry",
            value: 2,
          },
        ],
      },
    ];

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("round_end");
    expect(result.nextState.battleSkillEffects).toEqual([]);
  });


  it("auto-enqueues public servant skill battle effects from card data before resolution", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town" }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-1a-instance"
        ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
        : card.instanceId === "servant-1d-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
          : card.instanceId === "servant-2b-instance"
            ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p2" }
            : card,
    );

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "miyama_town",
      winnerPlayerId: "p1",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.effectStack).toEqual([]);
    expect(result.nextState.log).toContainEqual(
      expect.objectContaining({
        type: "combat_modifier_granted",
        message: "player:p1:combat_modifier:servant-1d",
      }),
    );
  });


  it("does not auto-enqueue battle skill effects from a different location", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town" }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player.id === "p3"
            ? { ...player, locationId: "shinto" }
            : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-1a-instance"
        ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
        : card.instanceId === "servant-1d-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p3" }
          : card.instanceId === "servant-2b-instance"
            ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p2" }
            : card,
    );

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "miyama_town",
      winnerPlayerId: "p2",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.log).not.toContainEqual(
      expect.objectContaining({
        type: "combat_modifier_granted",
        message: "player:p3:combat_modifier:servant-1d",
      }),
    );
  });


  it("does not auto-enqueue battle skill effects when the holder has no public attack card in that battle", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town" }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-1a-instance"
        ? { ...card, zone: "discard", controllerPlayerId: "p1" }
        : card.instanceId === "servant-1d-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
          : card.instanceId === "servant-2b-instance"
            ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p2" }
            : card,
    );

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "miyama_town",
      winnerPlayerId: "p2",
      margin: 3,
      vpReward: 1,
    });
    expect(result.nextState.log).not.toContainEqual(
      expect.objectContaining({
        type: "combat_modifier_granted",
        message: "player:p1:combat_modifier:servant-1d",
      }),
    );
  });


  it("resolves only declared battlefields when battle declarations are present", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town" }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player.id === "p3"
            ? { ...player, locationId: "shinto" }
            : player.id === "p4"
              ? { ...player, locationId: "shinto" }
              : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-1a-instance"
        ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
        : card.instanceId === "servant-2b-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p2" }
          : card.instanceId === "servant-3c-instance"
            ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p3" }
            : card.instanceId === "servant-4b-instance"
              ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p4" }
              : card,
    );

    const declaredState = Object.assign(state, {
      battleDeclarations: [{ battlefieldId: "miyama_town" }],
    });
    const result = stepGameLoop(declaredState);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.battleResults).toHaveLength(0);
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "miyama_town",
      winnerPlayerId: "p2",
      margin: 1,
      vpReward: 1,
    });
  });

  it("does not trigger requires_declared_battle effects without a matching declaration", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p1"
        ? { ...player, locationId: "miyama_town" }
        : player.id === "p2"
          ? { ...player, locationId: "miyama_town" }
          : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-1a-instance"
        ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p1" }
        : card.instanceId === "servant-2b-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p2" }
          : card,
    );
    state.effectStack = [
      {
        sourceCardId: "card-declared-buff",
        controllerPlayerId: "p1",
        effect: {
          id: "effect-declared-buff",
          timing: "battle",
          handler: "grant_combat_modifier",
          conditions: ["same_battlefield", "requires_public_attack", "requires_declared_battle"],
          payload: {
            targetPlayerId: "p1",
            sourceCardDefinitionId: "servant-1d",
            skillId: "servant-1d",
            targetTag: "infantry",
            value: 2,
          },
        },
      },
    ];

    const result = stepGameLoop(state);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "miyama_town",
      winnerPlayerId: "p2",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.log).not.toContainEqual(
      expect.objectContaining({
        type: "combat_modifier_granted",
        message: "player:p1:combat_modifier:servant-1d",
      }),
    );
  });

  it("auto-enqueues declared-battle servant skills from card data when conditions match", () => {
    const state = createSeededGameState({ activeSeats: [1, 2, 3, 4] });
    state.round.activePhase = "battle";
    state.players = state.players.map((player) =>
      player.id === "p3"
        ? { ...player, locationId: "shinto" }
        : player.id === "p4"
          ? { ...player, locationId: "shinto" }
          : player,
    );
    state.cards = state.cards.map((card) =>
      card.instanceId === "servant-3c-instance"
        ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p3" }
        : card.instanceId === "servant-4b-instance"
          ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p4" }
          : card.instanceId === "servant-4c-instance"
            ? { ...card, zone: "field", visibility: { scope: "public" }, controllerPlayerId: "p4" }
            : card,
    );

    const declaredState = Object.assign(state, {
      battleDeclarations: [{ battlefieldId: "shinto" }],
    });
    const result = stepGameLoop(declaredState);

    expect(result.transition.to).toBe("cleanup");
    expect(result.nextState.log.findLast((entry) => entry.type === "battle_scored")?.payload).toMatchObject({
      battlefieldId: "shinto",
      winnerPlayerId: "p4",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.log).toContainEqual(
      expect.objectContaining({
        type: "combat_modifier_granted",
        message: "player:p4:combat_modifier:servant-4c",
      }),
    );
  });

});
