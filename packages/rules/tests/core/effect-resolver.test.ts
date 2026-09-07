import { describe, expect, it } from "vitest";

import { resolveEffectsForWindow } from "../../src/core/effect-resolver";
import { applyReplacementEffect } from "../../src/core/replacement-pipeline";
import type { GameState } from "../../src/schema/game";

describe("effect resolver", () => {
  it("resolves only effects for the requested timing window", () => {
    const state: GameState = {
      id: "match-1",
      players: [],
      round: {
        roundNumber: 1,
        activePhase: "action",
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
      effectStack: [
        {
          sourceCardId: "card-a",
          controllerPlayerId: "p1",
          effect: {
            id: "effect-a",
            timing: "action",
            handler: "noop",
          },
        },
        {
          sourceCardId: "card-b",
          controllerPlayerId: "p1",
          effect: {
            id: "effect-b",
            timing: "battle",
            handler: "noop",
          },
        },
      ],
      log: [],
    };

    const result = resolveEffectsForWindow(state, "action");

    expect(result.appliedLogEntries).toEqual(["effect-a@action"]);
    expect(result.nextState.effectStack).toHaveLength(1);
    expect(result.nextState.effectStack[0]?.effect.id).toBe("effect-b");
  });

  it("stores battle timing combat modifiers as temporary skill effects", () => {
    const state: GameState = {
      id: "match-battle-modifier",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "master-1",
          servantCardId: "servant-1",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
      ],
      round: {
        roundNumber: 1,
        activePhase: "battle",
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
      effectStack: [
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
      ],
      log: [],
    };

    const result = resolveEffectsForWindow(state, "battle");

    expect(result.nextState.battleSkillEffects).toEqual([
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
    ]);
    expect(result.nextState.log).toEqual([
      expect.objectContaining({
        type: "combat_modifier_granted",
        message: "player:p1:combat_modifier:servant-1c",
      }),
      expect.objectContaining({
        type: "effect_resolved",
        message: "effect-battle-buff@battle",
      }),
    ]);
  });

it("routes identity replacement effects through a dedicated replacement pipeline", () => {
  const state: GameState = {
    id: "match-1",
    players: [
      {
        id: "p1",
        seat: 1,
        status: "active",
        masterCardId: "master-1",
        servantCardId: "servant-1",
        vp: 0,
        militaryResult: 0,
        mana: 0,
      },
      {
        id: "p2",
        seat: 2,
        status: "active",
        masterCardId: "master-2",
        servantCardId: "servant-2",
        vp: 0,
        militaryResult: 0,
        mana: 0,
      },
    ],
    round: {
      roundNumber: 1,
      activePhase: "action",
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
    effectStack: [
      {
        sourceCardId: "card-swap-master",
        controllerPlayerId: "p1",
        effect: {
          id: "effect-swap-master",
          timing: "action",
          handler: "swap_master_identity",
          payload: {
            targetPlayerId: "p1",
            newCardId: "master-99",
          },
        },
      },
      {
        sourceCardId: "card-swap-servant",
        controllerPlayerId: "p2",
        effect: {
          id: "effect-swap-servant",
          timing: "action",
          handler: "swap_servant_identity",
          payload: {
            targetPlayerId: "p2",
            newCardId: "servant-77",
          },
        },
      },
    ],
    log: [],
  };

  const result = resolveEffectsForWindow(state, "action");

  expect(result.nextState.players).toEqual([
    expect.objectContaining({
      id: "p1",
      masterCardId: "master-99",
      servantCardId: "servant-1",
    }),
    expect.objectContaining({
      id: "p2",
      masterCardId: "master-2",
      servantCardId: "servant-77",
    }),
  ]);
  expect(result.nextState.effectStack).toHaveLength(0);
  expect(result.appliedLogEntries).toEqual([
    "effect-swap-master@action",
    "effect-swap-servant@action",
  ]);
  expect(result.nextState.log).toEqual([
    expect.objectContaining({
      type: "identity_replaced",
      message: "player:p1:master->master-99",
      payload: expect.objectContaining({
        playerId: "p1",
        role: "master",
        previousCardId: "master-1",
        newCardId: "master-99",
        effectId: "effect-swap-master",
        carriedGeneratedCardInstanceIds: [],
      }),
    }),
    expect.objectContaining({
      type: "identity_replaced",
      message: "player:p2:servant->servant-77",
      payload: expect.objectContaining({
        playerId: "p2",
        role: "servant",
        previousCardId: "servant-2",
        newCardId: "servant-77",
        effectId: "effect-swap-servant",
        carriedGeneratedCardInstanceIds: [],
      }),
    }),
    expect.objectContaining({
      type: "effect_resolved",
      message: "effect-swap-master@action",
    }),
    expect.objectContaining({
      type: "effect_resolved",
      message: "effect-swap-servant@action",
    }),
  ]);
});

it("carries over same-player generated cards when a master identity is replaced", () => {
  const state: GameState = {
    id: "match-2",
    players: [
      {
        id: "p1",
        seat: 1,
        status: "active",
        masterCardId: "master-1",
        servantCardId: "servant-1",
        vp: 0,
        militaryResult: 0,
        mana: 0,
      },
      {
        id: "p2",
        seat: 2,
        status: "active",
        masterCardId: "master-2",
        servantCardId: "servant-2",
        vp: 0,
        militaryResult: 0,
        mana: 0,
      },
    ],
    round: {
      roundNumber: 1,
      activePhase: "action",
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
    cards: [
      {
        instanceId: "generated-owned-by-p1",
        definitionId: "generated-token",
        ownerPlayerId: "p1",
        controllerPlayerId: "p1",
        zone: "support",
        visibility: {
          scope: "owner_only",
          ownerPlayerId: "p1",
        },
        generatedBy: "master-1",
      },
      {
        instanceId: "generated-from-other-role",
        definitionId: "generated-token",
        ownerPlayerId: "p1",
        controllerPlayerId: "p1",
        zone: "support",
        visibility: {
          scope: "owner_only",
          ownerPlayerId: "p1",
        },
        generatedBy: "servant-1",
      },
      {
        instanceId: "generated-but-transferred-away",
        definitionId: "generated-token",
        ownerPlayerId: "p2",
        controllerPlayerId: "p2",
        zone: "support",
        visibility: {
          scope: "owner_only",
          ownerPlayerId: "p2",
        },
        generatedBy: "master-1",
      },
    ],
    eventPlacements: [],
    battleResults: [],
    scoringBreakdown: [],
    effectStack: [
      {
        sourceCardId: "card-swap-master",
        controllerPlayerId: "p1",
        effect: {
          id: "effect-swap-master",
          timing: "action",
          handler: "swap_master_identity",
          payload: {
            targetPlayerId: "p1",
            newCardId: "master-99",
          },
        },
      },
    ],
    log: [],
  };

  const result = resolveEffectsForWindow(state, "action");

  expect(result.nextState.cards).toEqual([
    expect.objectContaining({
      instanceId: "generated-owned-by-p1",
      ownerPlayerId: "p1",
      controllerPlayerId: "p1",
      generatedBy: "master-99",
    }),
    expect.objectContaining({
      instanceId: "generated-from-other-role",
      ownerPlayerId: "p1",
      controllerPlayerId: "p1",
      generatedBy: "servant-1",
    }),
    expect.objectContaining({
      instanceId: "generated-but-transferred-away",
      ownerPlayerId: "p2",
      controllerPlayerId: "p2",
      generatedBy: "master-99",
    }),
  ]);
  expect(result.nextState.log).toEqual([
    expect.objectContaining({
      type: "identity_replaced",
      payload: expect.objectContaining({
        playerId: "p1",
        role: "master",
        previousCardId: "master-1",
        newCardId: "master-99",
        carriedGeneratedCardInstanceIds: [
          "generated-owned-by-p1",
          "generated-but-transferred-away",
        ],
      }),
    }),
    expect.objectContaining({
      type: "effect_resolved",
      message: "effect-swap-master@action",
    }),
  ]);
});

it("rewrites transferred generated cards to the new identity source and normalizes owner-only visibility", () => {
  const state: GameState = {
    id: "match-3",
    players: [
      {
        id: "p1",
        seat: 1,
        status: "active",
        masterCardId: "master-1",
        servantCardId: "servant-1",
        vp: 0,
        militaryResult: 0,
        mana: 0,
      },
      {
        id: "p2",
        seat: 2,
        status: "active",
        masterCardId: "master-2",
        servantCardId: "servant-2",
        vp: 0,
        militaryResult: 0,
        mana: 0,
      },
    ],
    round: {
      roundNumber: 1,
      activePhase: "action",
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
    cards: [
      {
        instanceId: "transferred-owner-only-card",
        definitionId: "generated-token",
        ownerPlayerId: "p2",
        controllerPlayerId: "p2",
        zone: "support",
        visibility: {
          scope: "owner_only",
          ownerPlayerId: "p1",
        },
        generatedBy: "master-1",
      },
      {
        instanceId: "transferred-public-card",
        definitionId: "generated-token",
        ownerPlayerId: "p2",
        controllerPlayerId: "p1",
        zone: "support",
        visibility: {
          scope: "public",
          ownerPlayerId: "p1",
        },
        generatedBy: "master-1",
      },
    ],
    eventPlacements: [],
    battleResults: [],
    scoringBreakdown: [],
    effectStack: [
      {
        sourceCardId: "card-swap-master",
        controllerPlayerId: "p1",
        effect: {
          id: "effect-swap-master",
          timing: "action",
          handler: "swap_master_identity",
          payload: {
            targetPlayerId: "p1",
            newCardId: "master-99",
          },
        },
      },
    ],
    log: [],
  };

  const result = resolveEffectsForWindow(state, "action");

  expect(result.nextState.cards).toEqual([
    expect.objectContaining({
      instanceId: "transferred-owner-only-card",
      ownerPlayerId: "p2",
      controllerPlayerId: "p2",
      generatedBy: "master-99",
      visibility: {
        scope: "owner_only",
        ownerPlayerId: "p2",
      },
    }),
    expect.objectContaining({
      instanceId: "transferred-public-card",
      ownerPlayerId: "p2",
      controllerPlayerId: "p1",
      generatedBy: "master-99",
      visibility: {
        scope: "public",
        ownerPlayerId: "p1",
      },
    }),
  ]);
  expect(result.nextState.log).toEqual([
    expect.objectContaining({
      type: "identity_replaced",
      payload: expect.objectContaining({
        playerId: "p1",
        role: "master",
        previousCardId: "master-1",
        newCardId: "master-99",
        carriedGeneratedCardInstanceIds: [
          "transferred-owner-only-card",
          "transferred-public-card",
        ],
      }),
    }),
    expect.objectContaining({
      type: "effect_resolved",
      message: "effect-swap-master@action",
    }),
  ]);
});

it("carries generated cards through consecutive chain identity swaps", () => {
  const afterFirstSwap: GameState = {
    id: "match-chain-1",
    players: [
      {
        id: "p1",
        seat: 1,
        status: "active",
        masterCardId: "master-2",
        servantCardId: "servant-1",
        vp: 0,
        militaryResult: 0,
        mana: 0,
      },
    ],
    round: {
      roundNumber: 1,
      activePhase: "action",
      prioritySeat: 1,
    },
    map: { id: "default-7p", playerCount: 7, locations: [] },
    locationConfig: { enabledLocationIds: [] },
    cards: [
      {
        instanceId: "generated-card-1",
        definitionId: "generated-token",
        ownerPlayerId: "p1",
        controllerPlayerId: "p1",
        zone: "support",
        visibility: { scope: "public" },
        generatedBy: "master-2",
      },
      {
        instanceId: "generated-card-2",
        definitionId: "generated-token",
        ownerPlayerId: "p1",
        controllerPlayerId: "p1",
        zone: "support",
        visibility: { scope: "owner_only", ownerPlayerId: "p1" },
        generatedBy: "master-2",
      },
    ],
    eventPlacements: [],
    battleResults: [],
    scoringBreakdown: [],
    effectStack: [],
    log: [],
  };

  const afterSecondSwap = applyReplacementEffect(afterFirstSwap, {
    sourceCardId: "card-swap-to-master3",
    controllerPlayerId: "p1",
    effect: {
      id: "effect-swap-2",
      timing: "action",
      handler: "swap_master_identity",
      payload: { targetPlayerId: "p1", newCardId: "master-3" },
    },
  });

  const p1After = afterSecondSwap.players[0];
  expect(p1After).toBeDefined();
  expect(p1After?.masterCardId).toBe("master-3");

  const generatedCards = afterSecondSwap.cards.filter((c) => c.instanceId.startsWith("generated-"));
  expect(generatedCards).toHaveLength(2);
  expect(generatedCards.every((c) => c.generatedBy === "master-3")).toBe(true);

  const logEntry = afterSecondSwap.log.find((e) => e.type === "identity_replaced");
  expect(logEntry).toBeDefined();
  expect(logEntry?.payload).toMatchObject({
    carriedGeneratedCardInstanceIds: ["generated-card-1", "generated-card-2"],
  });
});

  it("applies gain_mana to the controlling player and records the transaction", () => {
    const state: GameState = {
      id: "match-gain-mana",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "master-1",
          servantCardId: "servant-1",
          vp: 0,
          militaryResult: 0,
          mana: 1,
        },
        {
          id: "p2",
          seat: 2,
          status: "active",
          masterCardId: "master-2",
          servantCardId: "servant-2",
          vp: 0,
          militaryResult: 0,
          mana: 4,
        },
      ],
      round: {
        roundNumber: 1,
        activePhase: "action",
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
      effectStack: [
        {
          sourceCardId: "card-gain-mana",
          controllerPlayerId: "p1",
          effect: {
            id: "effect-gain-mana",
            timing: "action",
            handler: "gain_mana",
            payload: {
              amount: 2,
            },
          },
        },
      ],
      log: [],
    };

    const result = resolveEffectsForWindow(state, "action");

    expect(result.nextState.players).toEqual([
      expect.objectContaining({
        id: "p1",
        mana: 3,
      }),
      expect.objectContaining({
        id: "p2",
        mana: 4,
      }),
    ]);
    expect(result.nextState.log).toEqual([
      expect.objectContaining({
        type: "mana_gained",
        message: "player:p1:mana+2",
        payload: {
          playerId: "p1",
          amount: 2,
          effectId: "effect-gain-mana",
        },
      }),
      expect.objectContaining({
        type: "effect_resolved",
        message: "effect-gain-mana@action",
      }),
    ]);
  });
});
