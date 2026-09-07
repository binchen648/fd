import { describe, expect, it } from "vitest";

import { createEventPlacement, getEventVisibilityForPolicy } from "../../src/core/event-engine";
import { applySituationAtRoundStart, canUseSituationForRemainingPlayers } from "../../src/core/situation-engine";
import type { GameState } from "../../src/schema/game";

describe("situation and event engines", () => {
  it("gates climax situations by remaining active players", () => {
    expect(
      canUseSituationForRemainingPlayers(4, {
        cardId: "climax-4",
        minimumRemainingPlayers: 4,
      }),
    ).toBe(true);

    expect(
      canUseSituationForRemainingPlayers(3, {
        cardId: "climax-4",
        minimumRemainingPlayers: 4,
      }),
    ).toBe(false);
  });

  it("applies shared situation mana only to active players", () => {
    const state: GameState = {
      id: "match-1",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          vp: 0,
          militaryResult: 0,
          mana: 1,
        },
        {
          id: "p2",
          seat: 2,
          status: "eliminated",
          masterCardId: "m2",
          servantCardId: "s2",
          vp: 0,
          militaryResult: 0,
          mana: 1,
        },
      ],
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
        enabledLocationIds: [],
      },
      cards: [],
      eventPlacements: [],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = applySituationAtRoundStart(state, {
      cardId: "perfect-flow",
      sharedManaReward: 2,
      battleModifiers: [
        {
          sourceId: "perfect-flow",
          targetTag: "magic",
          value: 2,
        },
      ],
    });

    expect(result.nextState.players[0]?.mana).toBe(3);
    expect(result.nextState.players[1]?.mana).toBe(1);
    expect(result.nextState.currentSituationCardId).toBe("perfect-flow");
    expect(result.nextState.currentSituationModifiers).toEqual([
      {
        sourceId: "perfect-flow",
        targetTag: "magic",
        value: 2,
      },
    ]);
  });

  it("maps hidden event policy to hidden visibility state", () => {
    expect(getEventVisibilityForPolicy("hidden").scope).toBe("hidden_until_trigger");

    const placement = createEventPlacement("shinto", "event-1", "hidden", [
      {
        sourceId: "event-1",
        targetTag: "power",
        value: 3,
      },
    ]);
    expect(placement.visibility.scope).toBe("hidden_until_trigger");
    expect(placement.battleModifiers).toEqual([
      {
        sourceId: "event-1",
        targetTag: "power",
        value: 3,
      },
    ]);
  });
});
