import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import * as rules from "../../src/index";
import type { GameState } from "../../src/schema/game";
import { createSeededGameState } from "../../src/tools/seeded-state";

const artoriaCasterRaw = JSON.parse(readFileSync("data/authoring/servants/servant.artoriac.json", "utf8"));

function setupBattleWinnerScenario(): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round = {
    roundNumber: 4,
    activePhase: "action",
    prioritySeat: 1,
  };
  state.players[0] = {
    ...state.players[0]!,
    servantCardId: artoriaCasterRaw.id,
    locationId: "shinto",
    mana: 12,
    vp: 0,
    militaryResult: 0,
  };
  state.players[1] = {
    ...state.players[1]!,
    locationId: "shinto",
    vp: 0,
    militaryResult: 0,
  };
  state.players[2] = {
    ...state.players[2]!,
    locationId: "shinto",
    vp: 0,
    militaryResult: 0,
  };
  (state as unknown as { activeStatuses: Array<Record<string, unknown>> }).activeStatuses = [
    {
      id: "maiya_cannot_win_battle_this_round",
      sourceControllerId: "p3",
      duration: "this_round",
    },
  ];

  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(artoriaCasterRaw), { seed: 42 });
  const destinyCardId = "artoria-caster-destiny";
  state.cards.push({
    instanceId: destinyCardId,
    definitionId: "servant.artoriac.skill.sc-artoriac-6",
    ownerPlayerId: "p1",
    controllerPlayerId: "p1",
    zone: "skill",
    visibility: { scope: "owner_only", ownerPlayerId: "p1" },
  });
  const playResult = rules.dispatchAbilityCommand(state, "p1", {
    type: "play_card",
    cardInstanceId: destinyCardId,
  });
  expect(playResult.ok).toBe(true);

  rules.advanceAbilityPhase(state, "battle");
  return state;
}

describe("Battle Winner conformance Gate B", () => {
  it("preserves tied eligible winners through resolver, trigger dispatch, event trace, and VP scoring", () => {
    const state = setupBattleWinnerScenario();

    const resolved = rules.resolveBattlefield(state, {
      battlefieldId: "shinto",
      participants: [
        { playerId: "p1", totalPower: 5 },
        { playerId: "p2", totalPower: 5 },
        { playerId: "p3", totalPower: 9 },
      ],
    }).nextState;

    const battleResult = resolved.battleResults.at(-1)!;
    expect(battleResult).toMatchObject({
      battlefieldId: "shinto",
      winnerPlayerIds: ["p1", "p2"],
      tied: true,
      excludedPlayerIds: ["p3"],
      winnerPlayerId: null,
      margin: 0,
      vpReward: 1,
      baseVpPerWinner: 2,
      eventVpPool: 1,
      competitionVpPool: 3,
      vpAdjustments: [
        { playerId: "p1", delta: 1, source: "competition_vp", label: "shinto.competition" },
        { playerId: "p2", delta: 1, source: "competition_vp", label: "shinto.competition" },
      ],
      militaryAdjustments: [
        { playerId: "p3", delta: 0 },
        { playerId: "p1", delta: 0 },
        { playerId: "p2", delta: 0 },
      ],
    });
    expect(battleResult.participantBreakdowns.map((entry) => entry.playerId)).toEqual(["p3", "p1", "p2"]);

    const battleLog = resolved.log.findLast((entry) => entry.type === "battle_resolved")!;
    expect(battleLog.payload).toMatchObject({
      winnerPlayerIds: ["p1", "p2"],
      tied: true,
      excludedPlayerIds: ["p3"],
      winnerPlayerId: null,
      baseVpPerWinner: 2,
      eventVpPool: 1,
      competitionVpPool: 3,
    });

    expect(resolved.players.find((player) => player.id === "p1")?.vp).toBe(2);
    expect(resolved.players.find((player) => player.id === "p2")?.vp).toBe(0);
    expect(resolved.players.find((player) => player.id === "p3")?.vp).toBe(0);

    const scored = rules.applyBattleScoring(resolved).nextState;
    expect(scored.players.find((player) => player.id === "p1")).toMatchObject({ vp: 4, militaryResult: 0 });
    expect(scored.players.find((player) => player.id === "p2")).toMatchObject({ vp: 2, militaryResult: 0 });
    expect(scored.players.find((player) => player.id === "p3")).toMatchObject({ vp: 0, militaryResult: 0 });

    const p1Breakdown = scored.scoringBreakdown.find((entry) => entry.playerId === "p1")!;
    const p2Breakdown = scored.scoringBreakdown.find((entry) => entry.playerId === "p2")!;
    expect(p1Breakdown.reasons).toEqual(expect.arrayContaining([
      { source: "battle_vp", value: 1, label: "shinto.vp" },
      { source: "competition_vp", value: 1, label: "shinto.competition" },
    ]));
    expect(p2Breakdown.reasons).toEqual(expect.arrayContaining([
      { source: "battle_vp", value: 1, label: "shinto.vp" },
      { source: "competition_vp", value: 1, label: "shinto.competition" },
    ]));

    const scoredLog = scored.log.findLast((entry) => entry.type === "battle_scored")!;
    expect(scoredLog.payload).toMatchObject({
      battlefieldId: "shinto",
      winnerPlayerIds: ["p1", "p2"],
      tied: true,
      winnerPlayerId: null,
      vpReward: 1,
      margin: 0,
    });
  });
});
