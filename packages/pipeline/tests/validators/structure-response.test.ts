import { describe, expect, it } from "vitest";

import { repairStructureResponse } from "../../src/repair/structure";
import { validateStructureResponse } from "../../src/validators/structure-response";

describe("validateStructureResponse", () => {
  it("normalizes broad servant card types from servant card identifiers", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-servant-bb-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "servant.bb.skill",
          name: "B.B.",
          cardType: "servant",
          timing: ["passive"],
          conditions: [],
          targets: [],
          effects: [],
          duration: null,
          visibility: "public",
          tags: ["Moon Cancer"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 9,
          mappedClauses: 3,
          unmappedClauses: 6,
        },
        source: {
          visionJobId: "vision-servant-bb-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-servant-bb-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.cardType).toBe("servant_skill");
  });

  it("normalizes active timing into the supported action window", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-servant-bb-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "servant.bb.skill",
          name: "B.B.",
          cardType: "servant_skill",
          timing: ["active"],
          conditions: [],
          targets: [],
          effects: [],
          duration: null,
          visibility: "public",
          tags: ["servant", "skill"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 9,
          mappedClauses: 6,
          unmappedClauses: 3,
        },
        source: {
          visionJobId: "vision-servant-bb-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-servant-bb-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toEqual(["action"]);
  });

  it("normalizes start_of_game timing into the supported round_start window", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-servant-ryogi-shiki-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "servant.ryogi_shiki.skill",
          name: "两仪式",
          cardType: "servant_skill",
          timing: ["start_of_game"],
          conditions: [],
          targets: [],
          effects: [],
          duration: null,
          visibility: "public",
          tags: ["servant"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 3,
          mappedClauses: 3,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-servant-ryogi-shiki-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-servant-ryogi-shiki-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toEqual(["round_start"]);
  });

  it("normalizes high_tide timing and other non-standard situation windows", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-situation-lostbelt-expansion-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "situation.lostbelt_expansion",
          name: "异闻带扩张",
          cardType: "situation",
          timing: ["high_tide"],
          conditions: [],
          targets: [],
          effects: [],
          duration: null,
          visibility: "public",
          tags: ["situation"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 2,
          mappedClauses: 2,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-situation-lostbelt-expansion-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-situation-lostbelt-expansion-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toEqual(["advance"]);
  });

  it("normalizes climax timing and bilingual battlefield targets for situation cards", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-situation-blankification-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "situation.blankification",
          name: "白纸化",
          cardType: "situation",
          timing: ["climax"],
          conditions: [],
          targets: [],
          effects: [],
          duration: "this turn",
          visibility: "public",
          tags: ["situation", "event"],
          ambiguities: [
            {
              span: "target-0",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
              notes: "Could not map target 'deep mountain town' to a supported engine target.",
            },
            {
              span: "target-1",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
              notes: "Could not map target 'new capital' to a supported engine target.",
            },
          ],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 4,
          mappedClauses: 4,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-situation-blankification-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-situation-blankification-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toEqual(["action"]);
    expect(validated.card.targets).toEqual([
      { type: "battlefield_location", value: "miyama_town" },
      { type: "battlefield_location", value: "shinto" },
    ]);
    expect(validated.card.ambiguities).toEqual([]);
  });

  it("flags legacy string arrays for repair before validation", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-master-matou-shinji-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "master.matou_shinji.profile",
          name: "间桐慎二",
          cardType: "master_skill",
          timing: ["passive"],
          conditions: ["进入深山町时", "游戏开始时", "当你战败时"],
          targets: ["自己", "自身", "自己"],
          effects: ["获得1点魔力", "获得【伪臣之书】", "失去一枚令咒"],
          duration: null,
          visibility: "public",
          tags: ["master", "profile"],
          ambiguities: [],
        },
        parseNotes: ["Parsed from normalized text with 3 clauses"],
        coverage: {
          sourceClauses: 3,
          mappedClauses: 3,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-master-matou-shinji-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-master-matou-shinji-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    expect(repaired?.card.conditions[0]).toEqual({ type: "location_is", value: "miyama_town" });
  });

  it("accepts repaired legacy string arrays after normalization", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-master-matou-shinji-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "master.matou_shinji.profile",
          name: "间桐慎二",
          cardType: "master_skill",
          timing: ["passive"],
          conditions: ["进入深山町时", "游戏开始时", "当你战败时"],
          targets: ["自己", "自身", "自己"],
          effects: ["获得1点魔力", "获得【伪臣之书】", "失去一枚令咒"],
          duration: null,
          visibility: "public",
          tags: ["master", "profile"],
          ambiguities: [],
        },
        parseNotes: ["Parsed from normalized text with 3 clauses"],
        coverage: {
          sourceClauses: 3,
          mappedClauses: 3,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-master-matou-shinji-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-master-matou-shinji-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toEqual(["advance", "round_start", "after_battle"]);
    expect(validated.card.conditions).toEqual([{ type: "location_is", value: "miyama_town" }]);
    expect(validated.card.targets).toEqual([
      { type: "self_player" },
      { type: "self_player" },
      { type: "self_player" },
    ]);
    expect(validated.card.effects).toEqual([
      { type: "gain_mana", value: 1 },
      { type: "gain_card", value: "伪臣之书" },
      { type: "lose_command_spell", value: 1 },
    ]);
  });

  it("maps synergy event ambiguities into a deterministic battlefield power primitive", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-event-synergy-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "event.synergy.001",
          name: "协同",
          cardType: "event",
          timing: ["passive"],
          conditions: [],
          targets: [],
          effects: [],
          duration: null,
          visibility: "public",
          tags: ["synergy", "event"],
          ambiguities: [
            {
              span: "于此战场的玩家，其所有攻击若至少有一种属性相同",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
            {
              span: "target-0",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
              notes: "Could not map target '玩家的攻击' to a supported engine target.",
            },
            {
              span: "合计威力+4",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
          ],
        },
        parseNotes: [
          "Detected synergy event card with passive timing. Effect applies when player's attacks share at least one attribute.",
        ],
        coverage: {
          sourceClauses: 1,
          mappedClauses: 1,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-event-synergy-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-event-synergy-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toEqual(["battle"]);
    expect(validated.card.targets).toEqual([{ type: "self_battlefield" }]);
    expect(validated.card.effects).toEqual([
      { type: "battle_power_bonus_if_shared_attribute", value: 4 },
    ]);
    expect(validated.card.ambiguities).toEqual([]);
  });

  it("maps synergy event ambiguities when the bonus uses a full-width plus sign", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-event-synergy-002",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "event.synergy.002",
          name: "协同",
          cardType: "event",
          timing: ["passive"],
          conditions: [],
          targets: [],
          effects: [],
          duration: null,
          visibility: "public",
          tags: ["synergy", "event"],
          ambiguities: [
            {
              span: "于此战场的玩家，其所有攻击若至少有一种属性相同",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
            {
              span: "target-0",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
              notes: "Could not map target '玩家的所有攻击' to a supported engine target.",
            },
            {
              span: "合计威力＋4",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
          ],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 1,
          mappedClauses: 1,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-event-synergy-002",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-event-synergy-002",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toEqual(["battle"]);
    expect(validated.card.targets).toEqual([{ type: "self_battlefield" }]);
    expect(validated.card.effects).toEqual([
      { type: "battle_power_bonus_if_shared_attribute", value: 4 },
    ]);
    expect(validated.card.ambiguities).toEqual([]);
  });

  it("maps reality-marble restrictions into review-only battlefield primitives", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-event-reality-marble-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "event.reality_marble.field",
          name: "固有结界",
          cardType: "event",
          timing: [],
          conditions: [],
          targets: [],
          effects: [],
          duration: null,
          visibility: "public",
          tags: ["field"],
          ambiguities: [
            {
              span: "特殊攻击于此战场禁止打出",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
            {
              span: "所有玩家不能移动至此地点也不能离开此地点",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
          ],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 2,
          mappedClauses: 2,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-event-reality-marble-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-event-reality-marble-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.timing).toHaveLength(2);
    expect(validated.card.timing).toEqual(expect.arrayContaining(["advance", "battle"]));
    expect(validated.card.targets).toEqual([{ type: "self_battlefield" }]);
    expect(validated.card.effects).toEqual([
      { type: "forbid_special_attack_on_battlefield", value: true },
      { type: "lock_battlefield_movement", value: "all_players" },
    ]);
    expect(validated.card.ambiguities).toEqual([]);
  });

  it("maps normalized reality-marble ambiguity keys into the same review-only primitives", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-event-reality-marble-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "event.reality_marble",
          name: "固有结界",
          cardType: "event",
          timing: ["immediate"],
          conditions: [],
          targets: [],
          effects: [],
          duration: "permanent",
          visibility: "public",
          tags: ["special_attack"],
          ambiguities: [
            {
              span: "special_attack_banned",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
            {
              span: "no_movement_to_location",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
            {
              span: "no_movement_from_location",
              category: "effect_mapping",
              severity: "medium",
              options: [],
              recommendedAction: "human_review",
            },
          ],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 2,
          mappedClauses: 2,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-event-reality-marble-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-event-reality-marble-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.targets).toEqual([{ type: "self_battlefield" }]);
    expect(validated.card.effects).toEqual([
      { type: "forbid_special_attack_on_battlefield", value: true },
      { type: "lock_battlefield_movement", value: "all_players" },
    ]);
    expect(validated.card.ambiguities).toEqual([]);
  });

  it("maps raw reality-marble effect strings into the same review-only primitives", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-event-reality-marble-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "event.reality_marble",
          name: "固有结界",
          cardType: "event",
          timing: ["immediate"],
          conditions: [],
          targets: [],
          effects: ["特殊攻击于此战场禁止打出", "所有玩家不能移动至此地点也不能离开此地点"],
          duration: "permanent",
          visibility: "public",
          tags: ["event"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 2,
          mappedClauses: 2,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-event-reality-marble-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-event-reality-marble-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.targets).toEqual([{ type: "self_battlefield" }]);
    expect(validated.card.effects).toEqual([
      { type: "forbid_special_attack_on_battlefield", value: true },
      { type: "lock_battlefield_movement", value: "all_players" },
    ]);
    expect(validated.card.ambiguities).toEqual([]);
  });

  it("maps view deck bottom effect into supported engine effect", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-servant-ryogi-shiki-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "servant.ryogi_shiki.skill",
          name: "两仪式",
          cardType: "servant_skill",
          timing: ["round_start"],
          conditions: [],
          targets: [],
          effects: ["你可以查看所有玩家牌库底部的牌"],
          duration: null,
          visibility: "public",
          tags: ["servant"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 3,
          mappedClauses: 3,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-servant-ryogi-shiki-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-servant-ryogi-shiki-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.effects).toEqual([
      { type: "view_deck_bottom", value: true },
    ]);
  });

  it("maps discard card effect into supported engine effect", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-servant-nanaya-shiki-001",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "servant.nanaya_shiki.skill",
          name: "七夜志贵",
          cardType: "servant_skill",
          timing: ["action"],
          conditions: [],
          targets: [],
          effects: ["弃置X张牌"],
          duration: null,
          visibility: "public",
          tags: ["servant"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 3,
          mappedClauses: 3,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-servant-nanaya-shiki-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-servant-nanaya-shiki-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.effects).toEqual([
      { type: "discard_card", value: 1 },
    ]);
  });

  it("maps move along arrow effect into supported engine effect", () => {
    const repaired = repairStructureResponse(
      {
        jobId: "structure-servant-nanaya-shiki-002",
        artifactVersion: "structure-response-v1",
        status: "ok",
        card: {
          id: "servant.nanaya_shiki.skill",
          name: "七夜志贵",
          cardType: "servant_skill",
          timing: ["action"],
          conditions: [],
          targets: [],
          effects: ["沿箭头移动一步"],
          duration: null,
          visibility: "public",
          tags: ["servant"],
          ambiguities: [],
        },
        parseNotes: [],
        coverage: {
          sourceClauses: 3,
          mappedClauses: 3,
          unmappedClauses: 0,
        },
        source: {
          visionJobId: "vision-servant-nanaya-shiki-001",
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "structure-servant-nanaya-shiki-002",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateStructureResponse(repaired);

    expect(validated.card.effects).toEqual([
      { type: "move_along_arrow", value: true },
    ]);
  });
});
