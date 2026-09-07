import { describe, expect, it } from "vitest";

import { deriveBattleParticipantsFromState, resolveBattlefield } from "../../src/core/combat-resolver";
import type { GameState } from "../../src/schema/game";

describe("combat resolver", () => {

  it("derives battle participants from field cards while ignoring concealed cards and servant skills", () => {
    const state: GameState = {
      id: "match-derived-1",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          locationId: "miyama_town",
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
          locationId: "miyama_town",
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
        locations: [
          {
            id: "miyama_town",
            displayName: "Miyama Town",
            enabledByDefault: true,
            optional: false,
            occupancyMode: "multi",
            eventPolicy: "public",
            movementLinks: ["shinto"],
            rewardHooks: ["battle_rewards", "competition_rewards"],
            visibilityHooks: [],
            tags: ["battlefield"],
          },
        ],
      },
      locationConfig: { enabledLocationIds: [] },
      cards: [
        {
          instanceId: "a-public",
          definitionId: "servant-1a",
          ownerPlayerId: "p1",
          controllerPlayerId: "p1",
          zone: "field",
          visibility: { scope: "public" },
        },
        {
          instanceId: "a-hidden",
          definitionId: "servant-1b",
          ownerPlayerId: "p1",
          controllerPlayerId: "p1",
          zone: "field",
          visibility: { scope: "owner_only", ownerPlayerId: "p1" },
        },
        {
          instanceId: "skill-public",
          definitionId: "servant-1c",
          ownerPlayerId: "p1",
          controllerPlayerId: "p1",
          zone: "field",
          visibility: { scope: "public" },
        },
      ],
      eventPlacements: [],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    expect(deriveBattleParticipantsFromState(state, "miyama_town")).toEqual([
      {
        playerId: "p1",
        totalPower: 2,
        attackTags: ["infantry", "defense"],
        externalSkillEffects: [
          {
            sourceCardDefinitionId: "servant-1c",
            ownerPlayerId: "p1",
            skillId: "servant-1c",
            combatModifiers: [
              {
                sourceId: "servant-1c",
                targetTag: "infantry",
                value: 1,
              },
            ],
          },
        ],
      },
      {
        playerId: "p2",
        totalPower: 0,
        attackTags: [],
        externalSkillEffects: [],
      },
    ]);
  });


  it("uses derived battle participants when explicit participants are omitted", () => {
    const state: GameState = {
      id: "match-derived-2",
      players: [
        {
          id: "p1",
          seat: 1,
          status: "active",
          masterCardId: "m1",
          servantCardId: "s1",
          locationId: "miyama_town",
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
          locationId: "miyama_town",
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
        locations: [
          {
            id: "miyama_town",
            displayName: "Miyama Town",
            enabledByDefault: true,
            optional: false,
            occupancyMode: "multi",
            eventPolicy: "public",
            movementLinks: ["shinto"],
            rewardHooks: ["battle_rewards", "competition_rewards"],
            visibilityHooks: [],
            tags: ["battlefield"],
            vpRewardRules: { battle: 1, competition: 2 },
          },
        ],
      },
      locationConfig: { enabledLocationIds: [] },
      cards: [
        {
          instanceId: "p1-public-attack",
          definitionId: "servant-1a",
          ownerPlayerId: "p1",
          controllerPlayerId: "p1",
          zone: "field",
          visibility: { scope: "public" },
        },
        {
          instanceId: "p2-public-attack",
          definitionId: "servant-4b",
          ownerPlayerId: "p2",
          controllerPlayerId: "p2",
          zone: "field",
          visibility: { scope: "public" },
        },
      ],
      eventPlacements: [],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = resolveBattlefield(state, {
      battlefieldId: "miyama_town",
    });

    expect(result.nextState.battleResults[0]).toMatchObject({
      winnerPlayerId: "p2",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.battleResults[0]?.participantBreakdowns).toEqual([
      {
        playerId: "p2",
        basePower: 3,
        totalModifier: 0,
        effectivePower: 3,
        modifiers: [],
      },
      {
        playerId: "p1",
        basePower: 2,
        totalModifier: 0,
        effectivePower: 2,
        modifiers: [],
      },
    ]);
  });

  it("reveals hidden events only when battle flow requests it", () => {
    const state: GameState = {
      id: "match-1",
      players: [],
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
      eventPlacements: [
        {
          locationId: "shinto",
          eventCardId: "event-1",
          visibility: {
            scope: "hidden_until_trigger",
          },
        },
      ],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const hiddenResult = resolveBattlefield(state, {
      battlefieldId: "shinto",
      revealHiddenEvents: false,
    });
    expect(hiddenResult.nextState.eventPlacements[0]?.visibility.scope).toBe("hidden_until_trigger");

    const revealedResult = resolveBattlefield(state, {
      battlefieldId: "shinto",
      revealHiddenEvents: true,
    });
    expect(revealedResult.nextState.eventPlacements[0]?.visibility.scope).toBe("public");
  });

  it("records winner and margin for the minimal numeric battle resolution", () => {
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
        enabledLocationIds: ["moon_holy_grail"],
      },
      cards: [],
      eventPlacements: [],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = resolveBattlefield(state, {
      battlefieldId: "moon_holy_grail",
      participants: [
        { playerId: "p1", totalPower: 7 },
        { playerId: "p2", totalPower: 4 },
      ],
    });

    expect(result.nextState.battleResults).toHaveLength(1);
    expect(result.nextState.battleResults[0]).toMatchObject({
      battlefieldId: "moon_holy_grail",
      winnerPlayerId: "p1",
      margin: 3,
      vpReward: 2,
    });
    expect(result.nextState.battleResults[0]?.participantBreakdowns).toEqual([
      {
        playerId: "p1",
        basePower: 7,
        totalModifier: 0,
        effectivePower: 7,
        modifiers: [],
      },
      {
        playerId: "p2",
        basePower: 4,
        totalModifier: 0,
        effectivePower: 4,
        modifiers: [],
      },
    ]);
  });

  it("records a tie battle without winner, vp reward, or military adjustments", () => {
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
      effectStack: [],
      log: [],
    };

    const result = resolveBattlefield(state, {
      battlefieldId: "shinto",
      participants: [
        { playerId: "p1", totalPower: 5 },
        { playerId: "p2", totalPower: 5 },
      ],
    });

    expect(result.nextState.battleResults[0]).toMatchObject({
      battlefieldId: "shinto",
      winnerPlayerIds: ["p1", "p2"],
      tied: true,
      winnerPlayerId: null,
      margin: 0,
      vpReward: 1,
      militaryAdjustments: [
        { playerId: "p1", delta: 0 },
        { playerId: "p2", delta: 0 },
      ],
    });
  });

  it("applies situation, event, and moon hook modifiers to participant power", () => {
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
      ],
      round: {
        roundNumber: 2,
        activePhase: "battle",
        prioritySeat: 1,
      },
      map: {
        id: "default-7p",
        playerCount: 7,
        locations: [
          {
            id: "moon_holy_grail",
            displayName: "Moon Holy Grail",
            enabledByDefault: false,
            optional: true,
            occupancyMode: "policy_defined",
            eventPolicy: "custom",
            movementLinks: ["shinto"],
            rewardHooks: ["moon_trigger_hooks", "score_hooks"],
            battleModifiers: [
              {
                sourceId: "lunar-amplifier",
                targetTag: "moon",
                value: 2,
              },
            ],
            visibilityHooks: ["moon_visibility_hooks"],
            tags: ["optional_location", "moon_cancer_support"],
          },
        ],
      },
      locationConfig: {
        enabledLocationIds: ["moon_holy_grail"],
      },
      cards: [],
      currentSituationCardId: "surging-aether",
      currentSituationModifiers: [
        {
          sourceId: "surging-aether",
          targetTag: "ritual",
          value: 4,
        },
      ],
      eventPlacements: [
        {
          locationId: "moon_holy_grail",
          eventCardId: "mirror-match",
          battleModifiers: [
            {
              sourceId: "mirror-match",
              targetTag: "focus",
              value: 1,
            },
          ],
          visibility: {
            scope: "public",
          },
        },
      ],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = resolveBattlefield(state, {
      battlefieldId: "moon_holy_grail",
      participants: [
        { playerId: "p1", totalPower: 4, attackTags: ["ritual", "focus", "moon"] },
        { playerId: "p2", totalPower: 8, attackTags: [] },
      ],
    });

    expect(result.nextState.battleResults[0]).toMatchObject({
      battlefieldId: "moon_holy_grail",
      winnerPlayerId: "p1",
      margin: 3,
      vpReward: 2,
    });
    expect(result.nextState.battleResults[0]?.participantBreakdowns).toEqual([
      {
        playerId: "p1",
        basePower: 4,
        totalModifier: 7,
        effectivePower: 11,
        modifiers: [
          {
            source: "situation",
            value: 4,
            label: "surging-aether.ritual",
            payload: {
              kind: "modifier",
              sourceId: "surging-aether",
              sourceType: "situation",
              targetTag: "ritual",
            },
          },
          {
            source: "event",
            value: 1,
            label: "mirror-match.focus",
            payload: {
              kind: "modifier",
              sourceId: "mirror-match",
              sourceType: "event",
              targetTag: "focus",
            },
          },
          {
            source: "location",
            value: 2,
            label: "lunar-amplifier.moon",
            payload: {
              kind: "modifier",
              sourceId: "lunar-amplifier",
              sourceType: "location",
              targetTag: "moon",
            },
          },
        ],
      },
      {
        playerId: "p2",
        basePower: 8,
        totalModifier: 0,
        effectivePower: 8,
        modifiers: [],
      },
    ]);
    expect(result.nextState.log.at(-1)?.payload).toMatchObject({
      winnerPlayerId: "p1",
      margin: 3,
    });
    expect(
      (result.nextState.log.at(-1)?.payload as { participantBreakdowns?: Array<{ playerId: string; effectivePower: number }> })
        .participantBreakdowns?.[0],
    ).toMatchObject({
      playerId: "p1",
      effectivePower: 11,
    });
  });


  it("auto-generates competition VP adjustments from location reward data", () => {
    const state: GameState = {
      id: "match-4b",
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
        activePhase: "battle",
        prioritySeat: 1,
      },
      map: {
        id: "default-7p",
        playerCount: 7,
        locations: [
          {
            id: "miyama_town",
            displayName: "Miyama Town",
            enabledByDefault: true,
            optional: false,
            occupancyMode: "multi",
            eventPolicy: "public",
            movementLinks: ["shinto"],
            rewardHooks: ["battle_rewards", "competition_rewards"],
            vpRewardRules: {
              battle: 1,
              competition: 2,
            },
            visibilityHooks: [],
            tags: ["battlefield"],
          },
        ],
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

    const result = resolveBattlefield(state, {
      battlefieldId: "miyama_town",
      participants: [
        { playerId: "p1", totalPower: 6 },
        { playerId: "p2", totalPower: 4 },
      ],
    });

    expect(result.nextState.battleResults[0]).toMatchObject({
      winnerPlayerId: "p1",
      vpReward: 1,
      vpAdjustments: [
        {
          playerId: "p1",
          delta: 2,
          source: "competition_vp",
          label: "miyama_town.competition",
        },
      ],
    });
  });

  it("applies terrain slot bonuses from location data during combat resolution", () => {
    const state: GameState = {
      id: "match-4c",
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
        activePhase: "battle",
        prioritySeat: 1,
      },
      map: {
        id: "default-7p",
        playerCount: 7,
        locations: [
          {
            id: "moon_holy_grail",
            displayName: "Moon Holy Grail",
            enabledByDefault: false,
            optional: true,
            occupancyMode: "policy_defined",
            eventPolicy: "custom",
            movementLinks: ["shinto"],
            rewardHooks: ["battle_rewards"],
            vpRewardRules: {
              battle: 2,
            },
            terrainBonuses: [4, 2, 1],
            visibilityHooks: ["moon_visibility_hooks"],
            tags: ["optional_location", "moon_cancer_support"],
          },
        ],
      },
      locationConfig: {
        enabledLocationIds: ["moon_holy_grail"],
      },
      cards: [],
      eventPlacements: [],
      battleResults: [],
      scoringBreakdown: [],
      effectStack: [],
      log: [],
    };

    const result = resolveBattlefield(state, {
      battlefieldId: "moon_holy_grail",
      participants: [
        { playerId: "p1", totalPower: 4, terrainSlotIndex: 0 },
        { playerId: "p2", totalPower: 7 },
      ],
    });

    expect(result.nextState.battleResults[0]).toMatchObject({
      winnerPlayerId: "p1",
      margin: 1,
      vpReward: 2,
    });
    expect(result.nextState.battleResults[0]?.participantBreakdowns[0]).toMatchObject({
      playerId: "p1",
      totalModifier: 4,
      effectivePower: 8,
    });
  });

  it("skips Moon Holy Grail battle resolution when the optional location is disabled", () => {
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
      ],
      round: {
        roundNumber: 1,
        activePhase: "battle",
        prioritySeat: 1,
      },
      map: {
        id: "default-7p",
        playerCount: 7,
        locations: [
          {
            id: "moon_holy_grail",
            displayName: "Moon Holy Grail",
            enabledByDefault: false,
            optional: true,
            occupancyMode: "policy_defined",
            eventPolicy: "custom",
            movementLinks: ["shinto"],
            rewardHooks: ["moon_trigger_hooks", "score_hooks"],
            visibilityHooks: ["moon_visibility_hooks"],
            tags: ["optional_location", "moon_cancer_support"],
          },
        ],
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

    const result = resolveBattlefield(state, {
      battlefieldId: "moon_holy_grail",
      participants: [{ playerId: "p1", totalPower: 9 }],
    });

    expect(result.nextState.battleResults).toHaveLength(0);
    expect(result.appliedLogEntries).toContain("battlefield_skipped:moon_holy_grail");
  });

  it("applies external skill combat modifiers and records them in participant breakdown", () => {
    const state: GameState = {
      id: "match-external-skill",
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
        activePhase: "battle",
        prioritySeat: 1,
      },
      map: {
        id: "default-7p",
        playerCount: 7,
        locations: [
          {
            id: "miyama_town",
            displayName: "Miyama Town",
            enabledByDefault: true,
            optional: false,
            occupancyMode: "multi",
            eventPolicy: "public",
            movementLinks: ["shinto"],
            rewardHooks: ["battle_rewards", "competition_rewards"],
            visibilityHooks: [],
            tags: ["battlefield"],
            vpRewardRules: { battle: 1, competition: 2 },
          },
        ],
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

    const result = resolveBattlefield(state, {
      battlefieldId: "miyama_town",
      participants: [
        {
          playerId: "p1",
          totalPower: 2,
          attackTags: ["infantry"],
          externalSkillEffects: [
            {
              sourceCardDefinitionId: "servant-1c",
              ownerPlayerId: "p1",
              skillId: "servant-1c",
              combatModifiers: [
                {
                  sourceId: "servant-1c",
                  targetTag: "infantry",
                  value: 3,
                },
              ],
            },
          ],
        },
        { playerId: "p2", totalPower: 4, attackTags: [] },
      ],
    });

    expect(result.nextState.battleResults[0]).toMatchObject({
      winnerPlayerId: "p1",
      margin: 1,
      vpReward: 1,
    });
    expect(result.nextState.battleResults[0]?.participantBreakdowns[0]).toEqual({
      playerId: "p1",
      basePower: 2,
      totalModifier: 3,
      effectivePower: 5,
      modifiers: [
        {
          source: "skill",
          value: 3,
          label: "servant-1c.infantry",
          payload: {
            kind: "modifier",
            sourceId: "servant-1c",
            sourceType: "skill",
            targetTag: "infantry",
          },
        },
      ],
    });
  });

});
