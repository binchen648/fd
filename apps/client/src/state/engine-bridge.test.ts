import { describe, expect, it } from "vitest";

import type { ContentLibraryIndex } from '@fd/content/schema';
import { createSeededGameState, createSeededGameStateFromContentLibrary, stepGameLoop } from '@fd/rules/client';
import { deriveClientGameState, deriveLocationOccupancy } from "./engine-bridge";

function createContentLibrary(): ContentLibraryIndex {
  const cards: ContentLibraryIndex['cards'] = {};

  for (let seat = 1; seat <= 7; seat += 1) {
    cards[`content-master-${seat}`] = {
      id: `content-master-${seat}`,
      name: `Content Master ${seat}`,
      language: 'zh-CN',
      sourceSet: 'master',
      namespace: 'master',
      approvedAt: '2026-04-14T00:00:00.000Z',
      guardrailJobId: `job-master-${seat}`,
      tags: ['master'],
      cardType: 'master_identity',
      initialMana: 4,
      commandSpells: 3,
    };
    cards[`content-servant-${seat}`] = {
      id: `content-servant-${seat}`,
      name: `Content Servant ${seat}`,
      language: 'zh-CN',
      sourceSet: 'servant',
      namespace: 'servant',
      approvedAt: '2026-04-14T00:00:00.000Z',
      guardrailJobId: `job-servant-${seat}`,
      tags: ['servant'],
      cardType: 'servant_overview',
      classTag: 'archer',
      attackCardsCount: 12,
      skillCardsCount: 3,
    };
  }

  cards['content-situation-1'] = {
    id: 'content-situation-1',
    name: 'Content Situation',
    language: 'zh-CN',
    sourceSet: 'situation',
    namespace: 'situation',
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-situation-1',
    tags: ['situation'],
    cardType: 'situation',
    situationType: 'regular',
    manaGrantToAll: 1,
    hasInstantEffect: true,
    hasPersistentEffect: true,
    applicableRounds: [2],
    specialNames: ['modifier:magic:+2', 'Lingering haze'],
  };

  cards['content-event-shinto'] = {
    id: 'content-event-shinto',
    name: 'Shinto Event',
    language: 'zh-CN',
    sourceSet: 'event',
    namespace: 'event',
    approvedAt: '2026-04-14T00:00:00.000Z',
    guardrailJobId: 'job-event-shinto',
    tags: ['event'],
    cardType: 'event',
    battlefield: 'new_capital',
    competitionReward: 3,
    display: 'hidden',
    specialRules: ['modifier:moon:+3', 'Concealed omen'],
  };

  return {
    version: '1.0.0',
    lastUpdated: '2026-04-14T00:00:00.000Z',
    stats: {
      totalCards: Object.keys(cards).length,
      bySourceSet: { master: 7, servant: 7, situation: 1, event: 1 },
      byNamespace: { master: 7, servant: 7, situation: 1, event: 1 },
    },
    cards,
  };
}

describe("engine bridge", () => {
  it("creates a client game state from a seeded rules state", () => {
    const state = createSeededGameState({
      enabledLocationIds: ["miyama_town", "shinto", "magic_workshop", "recon", "moon_holy_grail"],
    });

    const clientState = deriveClientGameState(state);

    expect(clientState.id).toBe("seeded-match-7p");
    expect(clientState.players).toHaveLength(7);
    expect(clientState.map.locations.some((location) => location.id === "moon_holy_grail")).toBe(true);
    expect(clientState.eventPlacements).toEqual([]);
  });

  it("derives stable occupancy buckets from the enabled map", () => {
    const state = createSeededGameState({
      enabledLocationIds: ["miyama_town", "shinto", "magic_workshop", "recon", "moon_holy_grail"],
    });
    state.players[0].locationId = "miyama_town";
    state.players[1].locationId = "moon_holy_grail";

    expect(deriveLocationOccupancy(state)).toEqual({
      miyama_town: ["p1"],
      shinto: [],
      magic_workshop: [],
      recon: [],
      moon_holy_grail: ["p2"],
    });
  });

  it("keeps the client phase in sync after a rules phase advance", () => {
    const state = createSeededGameState({
      enabledLocationIds: ["miyama_town", "shinto", "magic_workshop", "recon", "moon_holy_grail"],
    });
    state.players[0].locationId = "miyama_town";
    state.players[1].locationId = "moon_holy_grail";

    const stepped = stepGameLoop(state);
    const clientState = deriveClientGameState(stepped.nextState);

    expect(clientState.round.activePhase).toBe("round_start");
    expect(clientState.round.roundNumber).toBe(2);
    expect(clientState.log).toContainEqual(
      expect.objectContaining({
        type: "scoring_checkpoint",
      }),
    );
    expect(clientState.log[clientState.log.length - 1]).toEqual(
      expect.objectContaining({
        type: "movement",
        message: "player:p7:initial_placement",
      }),
    );
  });

  it("preserves tied battle winners in client battle projections", () => {
    const state = createSeededGameState({
      enabledLocationIds: ["miyama_town", "shinto", "magic_workshop", "recon", "moon_holy_grail"],
    });
    state.battleResults = [
      {
        battlefieldId: "shinto",
        winnerPlayerIds: ["p1", "p2"],
        tied: true,
        winnerPlayerId: null,
        margin: 0,
        vpReward: 1,
        participantBreakdowns: [],
        militaryAdjustments: [
          { playerId: "p1", delta: 0 },
          { playerId: "p2", delta: 0 },
        ],
      },
    ];

    const clientState = deriveClientGameState(state);

    expect(clientState.battleResults[0]).toMatchObject({
      battlefieldId: "shinto",
      winnerPlayerIds: ["p1", "p2"],
      tied: true,
      winnerPlayerId: null,
    });
  });

  it("preserves content-backed identities and load logs in client state", () => {
    const state = createSeededGameStateFromContentLibrary(createContentLibrary(), {
      enabledLocationIds: ["miyama_town", "shinto", "magic_workshop", "recon", "moon_holy_grail"],
    });

    const clientState = deriveClientGameState(state);

    expect(clientState.id).toBe("seeded-match-7p-content");
    expect(clientState.players[0]?.masterCardId).toBe("content-master-1");
    expect(clientState.players[0]?.servantCardId).toBe("content-servant-1");
    expect(clientState.cards.some((card) => card.id === "content-event-shinto-instance")).toBe(true);
    expect(clientState.log).toContainEqual(
      expect.objectContaining({
        type: "content_library_loaded",
      }),
    );
  });
});
