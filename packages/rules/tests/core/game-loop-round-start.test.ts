import { describe, expect, it } from "vitest";

import { stepGameLoop } from "../../src/core/game-loop";
import { createSeededGameState } from "../../src/tools/seeded-state";

describe("game loop round start", () => {
  it("seeds active players with the CHM baseline starting mana", () => {
    const state = createSeededGameState({
      activeSeats: [1, 2, 3, 4],
    });

    expect(state.players[0]?.mana).toBe(4);
    expect(state.players[3]?.mana).toBe(4);
    expect(state.players[4]?.mana).toBe(4);
  });

  it("applies threshold log, situation reward, and default event placements on round_start", () => {
    const state = createSeededGameState({
      enabledLocationIds: ["moon_holy_grail"],
      activeSeats: [1, 2, 3, 4],
    });

    const result = stepGameLoop(state, {
      situationCard: {
        cardId: "climax-4",
        minimumRemainingPlayers: 4,
        sharedManaReward: 2,
      },
      eventDraws: [
        {
          locationId: "miyama_town",
          eventCardId: "event-public-1",
        },
        {
          locationId: "shinto",
          eventCardId: "event-hidden-1",
        },
        {
          locationId: "moon_holy_grail",
          eventCardId: "event-custom-skip",
        },
      ],
    });

    expect(result.transition.to).toBe("round_start");
    expect(result.nextState.round.roundNumber).toBe(2);
    expect(result.nextState.currentSituationCardId).toBe("climax-4");
    expect(result.nextState.players[0]?.mana).toBe(6);
    expect(result.nextState.players[4]?.mana).toBe(4);
    expect(result.nextState.eventPlacements).toHaveLength(2);
    expect(result.nextState.eventPlacements[0]?.visibility.scope).toBe("public");
    expect(result.nextState.eventPlacements[1]?.visibility.scope).toBe("hidden_until_trigger");
    expect(result.nextState.log.map((entry) => entry.type)).toContain("scoring_checkpoint");
    expect(result.nextState.log.map((entry) => entry.type)).toContain("situation_applied");
    expect(result.nextState.log.map((entry) => entry.type)).toContain("event_placed");
  });


  it("awards default location and recon VP from occupied positions on round_start", () => {
    const state = createSeededGameState({
      enabledLocationIds: ["moon_holy_grail"],
      activeSeats: [1, 2, 3, 4],
    });

    state.players = state.players.map((player) => {
      if (player.id === "p1") {
        return { ...player, locationId: "magic_workshop" };
      }
      if (player.id === "p2") {
        return { ...player, locationId: "recon" };
      }
      if (player.id === "p3") {
        return { ...player, locationId: "moon_holy_grail" };
      }
      return player;
    });

    state.map.locations = state.map.locations.map((location) => {
      if (location.id === "magic_workshop") {
        return {
          ...location,
          rewardHooks: ["location_rewards"],
          vpRewardRules: {
            location: 1,
          },
        };
      }
      if (location.id === "recon") {
        return {
          ...location,
          rewardHooks: ["recon_rewards"],
          vpRewardRules: {
            recon: 2,
          },
        };
      }
      if (location.id === "moon_holy_grail") {
        return {
          ...location,
          rewardHooks: ["location_rewards"],
          vpRewardRules: {
            location: 1,
          },
        };
      }
      return location;
    });

    const result = stepGameLoop(state);
    const byPlayer = new Map(result.nextState.players.map((player) => [player.id, player]));

    expect(byPlayer.get("p1")?.vp).toBe(1);
    expect(byPlayer.get("p2")?.vp).toBe(2);
    expect(byPlayer.get("p3")?.vp).toBe(1);
    expect(result.nextState.scoringBreakdown).toEqual([
      {
        playerId: "p1",
        vpDelta: 1,
        militaryDelta: 0,
        eliminated: false,
        reasons: [{ source: "location_vp", value: 1, label: "magic_workshop.location" }],
      },
      {
        playerId: "p2",
        vpDelta: 2,
        militaryDelta: 0,
        eliminated: false,
        reasons: [{ source: "recon_vp", value: 2, label: "recon.scout" }],
      },
      {
        playerId: "p3",
        vpDelta: 1,
        militaryDelta: 0,
        eliminated: false,
        reasons: [{ source: "location_vp", value: 1, label: "moon_holy_grail.location" }],
      },
    ]);
  });

  it("allows location-defined custom events at Moon Holy Grail while still skipping normal events", () => {
    const state = createSeededGameState({
      enabledLocationIds: ["moon_holy_grail"],
      activeSeats: [1, 2, 3, 4],
    });

    state.map.locations = state.map.locations.map((location) =>
      location.id === "moon_holy_grail"
        ? {
            ...location,
            customEventCardIds: ["moon-event-1"],
          }
        : location,
    );

    const result = stepGameLoop(state, {
      eventDraws: [
        {
          locationId: "moon_holy_grail",
          eventCardId: "event-custom-skip",
        },
        {
          locationId: "moon_holy_grail",
          eventCardId: "moon-event-1",
        },
      ],
    });

    expect(result.nextState.eventPlacements).toEqual([
      expect.objectContaining({
        locationId: "moon_holy_grail",
        eventCardId: "moon-event-1",
      }),
    ]);
  });
});
