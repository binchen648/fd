import { describe, expect, it } from "vitest";

import {
  applyBattleScoring,
  applyEliminationAndThresholdLog,
  countActivePlayers,
} from "../../src/core/scoring-resolver";
import type { GameState } from "../../src/schema/game";

describe("scoring resolver", () => {
  it("counts remaining active players for climax threshold checks", () => {
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
          mana: 0,
        },
        {
          id: "p2",
          seat: 2,
          status: "eliminated",
          masterCardId: "m2",
          servantCardId: "s2",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
        {
          id: "p3",
          seat: 3,
          status: "active",
          masterCardId: "m3",
          servantCardId: "s3",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
      ],
      round: {
        roundNumber: 1,
        activePhase: "cleanup",
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

    expect(countActivePlayers(state)).toBe(2);

    const result = applyEliminationAndThresholdLog(state);
    expect(result.appliedLogEntries).toContain("threshold:two_or_less");
  });

  it("applies VP, military result, and elimination from recorded battle results", () => {
    const state: GameState = {
      id: "match-2",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
        {
          id: "p2",
          seat: 2,
          status: "active",
          masterCardId: "m2",
          servantCardId: "s2",
          vp: 0,
          militaryResult: -6,
          mana: 0,
        },
      ],
      round: {
        roundNumber: 1,
        activePhase: "cleanup",
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
      battleResults: [
        {
          battlefieldId: "moon_holy_grail",
          winnerPlayerId: "p1",
          margin: 3,
          vpReward: 2,
          participantBreakdowns: [],
          militaryAdjustments: [
            { playerId: "p1", delta: 3 },
            { playerId: "p2", delta: -3 },
          ],
        },
      ],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = applyBattleScoring(state);

    expect(result.nextState.players[0]).toMatchObject({
      vp: 2,
      militaryResult: 3,
      status: "active",
    });
    expect(result.nextState.players[1]).toMatchObject({
      militaryResult: -9,
      status: "eliminated",
    });
    expect(result.nextState.battleResults).toHaveLength(0);
    expect(result.nextState.scoringBreakdown).toEqual([
      {
        playerId: "p1",
        vpDelta: 2,
        militaryDelta: 3,
        eliminated: false,
        reasons: [
          { source: "battle_vp", value: 2, label: "moon_holy_grail.vp" },
          { source: "military_result", value: 3, label: "moon_holy_grail.margin" },
        ],
      },
      {
        playerId: "p2",
        vpDelta: 0,
        militaryDelta: -3,
        eliminated: true,
        eliminationOrder: 1,
        reasons: [
          { source: "military_result", value: -3, label: "moon_holy_grail.margin" },
          { source: "elimination", value: -9, label: "military_threshold" },
        ],
      },
    ]);
    expect(result.nextState.log.at(-3)?.payload).toMatchObject({
      battlefieldId: "moon_holy_grail",
    });
    expect(result.nextState.log.at(-3)?.payload).toEqual(
      expect.objectContaining({
        scoringBreakdown: expect.arrayContaining([
          expect.objectContaining({
            playerId: "p1",
            vpDelta: 2,
          }),
        ]),
      }),
    );
    expect(result.nextState.log.at(-1)).toMatchObject({
      type: "scoring_checkpoint",
    });
    expect(result.nextState.log.at(-2)).toMatchObject({
      type: "elimination_batch_resolved",
      message: "elimination_batch:1",
      payload: {
        finalOrder: ["p2"],
      },
    });
  });


  it("separates VP sources for battle, location control, recon, and competition rewards", () => {
    const state: GameState = {
      id: "match-3",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
        {
          id: "p2",
          seat: 2,
          status: "active",
          masterCardId: "m2",
          servantCardId: "s2",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
      ],
      round: {
        roundNumber: 1,
        activePhase: "cleanup",
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
      battleResults: [
        {
          battlefieldId: "miyama_town",
          winnerPlayerId: "p1",
          margin: 2,
          vpReward: 1,
          vpAdjustments: [
            {
              playerId: "p1",
              delta: 2,
              source: "location_vp",
              label: "miyama_town.control",
            },
            {
              playerId: "p1",
              delta: 2,
              source: "competition_vp",
              label: "miyama_town.competition",
            },
            {
              playerId: "p2",
              delta: 2,
              source: "recon_vp",
              label: "recon.scout",
            },
          ],
          participantBreakdowns: [],
          militaryAdjustments: [
            { playerId: "p1", delta: 2 },
            { playerId: "p2", delta: -2 },
          ],
        },
      ],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = applyBattleScoring(state);

    expect(result.nextState.players[0]).toMatchObject({
      vp: 5,
      militaryResult: 2,
    });
    expect(result.nextState.players[1]).toMatchObject({
      vp: 2,
      militaryResult: -2,
    });
    expect(result.nextState.scoringBreakdown).toEqual([
      {
        playerId: "p1",
        vpDelta: 5,
        militaryDelta: 2,
        eliminated: false,
        reasons: [
          { source: "battle_vp", value: 1, label: "miyama_town.vp" },
          { source: "location_vp", value: 2, label: "miyama_town.control" },
          { source: "competition_vp", value: 2, label: "miyama_town.competition" },
          { source: "military_result", value: 2, label: "miyama_town.margin" },
        ],
      },
      {
        playerId: "p2",
        vpDelta: 2,
        militaryDelta: -2,
        eliminated: false,
        reasons: [
          { source: "recon_vp", value: 2, label: "recon.scout" },
          { source: "military_result", value: -2, label: "miyama_town.margin" },
        ],
      },
    ]);
  });

  it("scores every tied battle winner from canonical winnerPlayerIds", () => {
    const state: GameState = {
      id: "match-tied-winners",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
        {
          id: "p2",
          seat: 2,
          status: "active",
          masterCardId: "m2",
          servantCardId: "s2",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
      ],
      round: {
        roundNumber: 1,
        activePhase: "cleanup",
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
      battleResults: [
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
      ],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = applyBattleScoring(state);

    expect(result.nextState.players[0]).toMatchObject({ vp: 1, militaryResult: 0 });
    expect(result.nextState.players[1]).toMatchObject({ vp: 1, militaryResult: 0 });
    expect(result.nextState.log.at(-2)?.payload).toEqual(
      expect.objectContaining({
        battlefieldId: "shinto",
        winnerPlayerIds: ["p1", "p2"],
        tied: true,
        winnerPlayerId: null,
        scoringBreakdown: expect.arrayContaining([
          expect.objectContaining({ playerId: "p1", vpDelta: 1 }),
          expect.objectContaining({ playerId: "p2", vpDelta: 1 }),
        ]),
      }),
    );
  });

  it("settles multiple battle results in one scoring pass", () => {
    const state: GameState = {
      id: "match-4",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
        {
          id: "p2",
          seat: 2,
          status: "active",
          masterCardId: "m2",
          servantCardId: "s2",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
        {
          id: "p3",
          seat: 3,
          status: "active",
          masterCardId: "m3",
          servantCardId: "s3",
          vp: 0,
          militaryResult: -7,
          mana: 0,
        },
      ],
      round: {
        roundNumber: 2,
        activePhase: "cleanup",
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
      battleResults: [
        {
          battlefieldId: "moon_holy_grail",
          winnerPlayerId: "p1",
          margin: 3,
          vpReward: 2,
          participantBreakdowns: [],
          militaryAdjustments: [
            { playerId: "p1", delta: 3 },
            { playerId: "p2", delta: -3 },
          ],
        },
        {
          battlefieldId: "miyama_town",
          winnerPlayerId: "p2",
          margin: 1,
          vpReward: 1,
          participantBreakdowns: [],
          militaryAdjustments: [
            { playerId: "p2", delta: 1 },
            { playerId: "p3", delta: -1 },
          ],
        },
      ],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = applyBattleScoring(state);

    expect(result.nextState.players[0]).toMatchObject({ vp: 2, militaryResult: 3 });
    expect(result.nextState.players[1]).toMatchObject({ vp: 1, militaryResult: -2, status: "active" });
    expect(result.nextState.players[2]).toMatchObject({ militaryResult: -8, status: "eliminated" });
    expect(result.appliedLogEntries).toContain("scored:moon_holy_grail");
    expect(result.appliedLogEntries).toContain("scored:miyama_town");
  });

  it("assigns deterministic elimination order when multiple players are eliminated in one scoring pass", () => {
    const state: GameState = {
      id: "match-5",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          vp: 0,
          militaryResult: 0,
          mana: 0,
        },
        {
          id: "p2",
          seat: 2,
          status: "active",
          masterCardId: "m2",
          servantCardId: "s2",
          vp: 0,
          militaryResult: -7,
          mana: 0,
        },
        {
          id: "p3",
          seat: 3,
          status: "active",
          masterCardId: "m3",
          servantCardId: "s3",
          vp: 0,
          militaryResult: -7,
          mana: 0,
        },
      ],
      round: {
        roundNumber: 2,
        activePhase: "cleanup",
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
      battleResults: [
        {
          battlefieldId: "shinto",
          winnerPlayerId: "p1",
          margin: 1,
          vpReward: 1,
          participantBreakdowns: [],
          militaryAdjustments: [
            { playerId: "p1", delta: 1 },
            { playerId: "p2", delta: -1 },
            { playerId: "p3", delta: -1 },
          ],
        },
      ],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = applyBattleScoring(state);

    expect(result.nextState.players[1]).toMatchObject({
      militaryResult: -8,
      status: "eliminated",
      eliminationOrder: 1,
    });
    expect(result.nextState.players[2]).toMatchObject({
      militaryResult: -8,
      status: "eliminated",
      eliminationOrder: 2,
    });
    expect(result.nextState.log.at(-2)).toMatchObject({
      type: "elimination_batch_resolved",
      message: "elimination_batch:2",
      payload: {
        finalOrder: ["p2", "p3"],
      },
    });
  });
});
