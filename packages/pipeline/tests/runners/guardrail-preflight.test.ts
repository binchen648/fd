import { describe, expect, it } from "vitest";

import {
  applyCapabilityAssessmentToGuardrail,
  assertSupportedEngineCapabilityVersion,
  evaluateStructuredCardCapability,
  getSupportedEngineCapabilityVersions,
} from "../../src/runners/guardrail-preflight.ts";

describe("guardrail capability preflight", () => {
  it("lists the current supported engine capability version", () => {
    expect(getSupportedEngineCapabilityVersions()).toContain("fd-engine-capability-v1");
  });

  it("rejects unsupported engine capability versions", () => {
    expect(() => assertSupportedEngineCapabilityVersion("fd-engine-capability-v999")).toThrow(
      /engine capability/i,
    );
  });

  it("marks simple supported cards as engine-safe", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.shinji.absorb_command",
      name: "吸魔命令",
      cardType: "master_skill",
      timing: ["advance"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: ["resource"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues).toHaveLength(0);
  });

  it("routes Moon Holy Grail interactions to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.moon.touch",
      name: "月之触发",
      cardType: "master_skill",
      timing: ["battle"],
      conditions: [{ type: "location_is", value: "moon_holy_grail" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: ["moon_holy_grail"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_TAG")).toBe(true);
  });

  it("approves hidden-event reveal cards that stay within supported battle hooks", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.shinto.reveal_signal",
      name: "显露信号",
      cardType: "event",
      timing: ["battle", "after_battle"],
      conditions: [{ type: "location_is", value: "shinto" }],
      targets: [{ type: "battlefield_location", value: "shinto" }],
      effects: [{ type: "reveal_hidden_event", value: "shinto" }],
      duration: null,
      visibility: "hidden_until_trigger",
      tags: ["battlefield"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
  });

  it("rejects cards with unsupported condition and target types", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.bad.unknown_selector",
      name: "未知选择",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [{ type: "weather_is", value: "rain" }],
      targets: [{ type: "random_enemy_cluster" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("reject");
    expect(result.issues.some((issue) => issue.code === "ENGINE_UNSUPPORTED_CONDITION")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "ENGINE_UNSUPPORTED_TARGET")).toBe(true);
  });

  it("approves deterministic generated-card flows when they stay inside supported primitives", () => {
    const result = evaluateStructuredCardCapability({
      id: "generated.token.echo",
      name: "回响衍生",
      cardType: "generated",
      timing: ["action"],
      conditions: [{ type: "round_threshold_at_most", value: 4 }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "owner_only",
      tags: ["generated"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues).toHaveLength(0);
  });

  it("keeps replacement-tagged generated cards in review-only capability handling", () => {
    const result = evaluateStructuredCardCapability({
      id: "generated.token.rewrite",
      name: "改写衍生",
      cardType: "generated",
      timing: ["action"],
      conditions: [{ type: "round_threshold_at_most", value: 4 }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_card", value: "token-copy" }],
      duration: null,
      visibility: "owner_only",
      tags: ["generated", "replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_TAG")).toBe(true);
  });

  it("approves explicit self-targeted identity swap effects even when the card is replacement-tagged", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.replacement.identity_swap",
      name: "身份置换",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "swap_master_identity",
          args: {
            newCardId: "master.alt.identity",
          },
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues).toHaveLength(0);
    expect(result.smokeTests).toEqual([
      expect.objectContaining({
        name: "capability_approve_swap_master_identity_card_effects_0_type",
        source: "capability",
      }),
    ]);
  });

  it("routes master identity swap with wrong target to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.replacement.target_swap",
      name: "目标置换",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_battlefield" }],
      effects: [
        {
          type: "swap_master_identity",
          args: {
            newCardId: "master.alt.target",
          },
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_EFFECT")).toBe(true);
  });

  it("routes master identity swap with missing newCardId to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.replacement.incomplete",
      name: "不完整置换",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "swap_master_identity",
          args: {},
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_EFFECT")).toBe(true);
  });

  it("approves servant identity swap with correct self_player target and newCardId", () => {
    const result = evaluateStructuredCardCapability({
      id: "servant.replacement.contract_swap",
      name: "契约转换",
      cardType: "servant_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "swap_servant_identity",
          args: {
            newCardId: "servant.alt.contract",
          },
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues).toHaveLength(0);
    expect(result.smokeTests).toEqual([
      expect.objectContaining({
        name: "capability_approve_swap_servant_identity_card_effects_0_type",
        source: "capability",
      }),
    ]);
  });

  it("routes servant identity swap with wrong target to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "servant.replacement.location_swap",
      name: "位置交换",
      cardType: "servant_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "battlefield_location", value: "shinto" }],
      effects: [
        {
          type: "swap_servant_identity",
          args: {
            newCardId: "servant.alt.location",
          },
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_EFFECT")).toBe(true);
  });

  it("routes servant identity swap with missing newCardId to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "servant.replacement.incomplete_swap",
      name: "不完整交换",
      cardType: "servant_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "swap_servant_identity",
          args: {},
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_EFFECT")).toBe(true);
  });

  it("approves card with multiple identity swap effects when all are valid", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.replacement.dual_swap",
      name: "双重置换",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "swap_master_identity",
          args: {
            newCardId: "master.alt.form_a",
          },
        },
        {
          type: "swap_servant_identity",
          args: {
            newCardId: "servant.alt.form_a",
          },
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues).toHaveLength(0);
    expect(result.smokeTests).toHaveLength(2);
  });

  it("routes card with mixed identity swap effects to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.replacement.mixed_swap",
      name: "混合置换",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "swap_master_identity",
          args: {
            newCardId: "master.alt.form_a",
          },
        },
        {
          type: "swap_servant_identity",
          args: {},
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_EFFECT")).toBe(true);
  });

  it("routes owner-sensitive cards to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.owner.transfer",
      name: "所有权转移",
      cardType: "event",
      owner: "opponent",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_OWNER_REVIEW")).toBe(true);
  });

  it("routes non-immediate durations to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "status.round.lock",
      name: "回合封锁",
      cardType: "status",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "shinto" }],
      targets: [{ type: "battlefield_location", value: "shinto" }],
      effects: [{ type: "reveal_hidden_event", value: "shinto" }],
      duration: "until_round_end",
      visibility: "public",
      tags: [],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_DURATION_REVIEW")).toBe(true);
  });

  it("approves card with null duration", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.immediate",
      name: "即时生效",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues.some((issue) => issue.code === "ENGINE_DURATION_REVIEW")).toBe(false);
  });

  it("routes all non-null durations to review", () => {
    const durations = ["until_round_end", "until_next_turn", "permanent", "3_rounds"];
    for (const dur of durations) {
      const result = evaluateStructuredCardCapability({
        id: `status.${dur}`,
        name: `持续效果`,
        cardType: "status",
        timing: ["action"],
        conditions: [],
        targets: [{ type: "self_player" }],
        effects: [{ type: "gain_mana", value: 1 }],
        duration: dur,
        visibility: "public",
        tags: [],
        ambiguities: [],
      });

      expect(result.decision).toBe("review");
      expect(result.issues.some((issue) => issue.code === "ENGINE_DURATION_REVIEW")).toBe(true);
    }
  });

  it("rejects unknown card types", () => {
    const result = evaluateStructuredCardCapability({
      id: "weird.future.card",
      name: "未来区域",
      cardType: "ritual_zone",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("reject");
    expect(result.issues.some((issue) => issue.code === "ENGINE_UNSUPPORTED_CARD_TYPE")).toBe(true);
  });

  it("routes medium ambiguity to review and high ambiguity to reject", () => {
    const medium = evaluateStructuredCardCapability({
      id: "event.medium.ambiguity",
      name: "可疑事件",
      cardType: "event",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [
        {
          span: "you may gain 1 or 2 mana",
          category: "numeric_resolution",
          severity: "medium",
          options: ["1", "2"],
          recommendedAction: "human_review",
        },
      ],
    });
    const high = evaluateStructuredCardCapability({
      id: "event.high.ambiguity",
      name: "高危事件",
      cardType: "event",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [
        {
          span: "do something unresolved",
          category: "effect_mapping",
          severity: "high",
          options: ["a", "b"],
          recommendedAction: "reject",
        },
      ],
    });

    expect(medium.decision).toBe("review");
    expect(medium.issues.some((issue) => issue.code === "ENGINE_AMBIGUITY_REVIEW")).toBe(true);
    expect(high.decision).toBe("reject");
    expect(high.issues.some((issue) => issue.code === "ENGINE_AMBIGUITY_REJECT")).toBe(true);
  });

  it("routes card with multiple medium ambiguities to review", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.multi_ambiguity",
      name: "多重歧义",
      cardType: "event",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [
        {
          span: "choose A or B",
          category: "effect_mapping",
          severity: "medium",
          options: ["A", "B"],
          recommendedAction: "human_review",
        },
        {
          span: "1 or 2 mana",
          category: "numeric_resolution",
          severity: "medium",
          options: ["1", "2"],
          recommendedAction: "human_review",
        },
      ],
    });

    expect(result.decision).toBe("review");
    expect(result.issues.filter((i) => i.code === "ENGINE_AMBIGUITY_REVIEW")).toHaveLength(2);
  });

  it("rejects card with high ambiguity regardless of other factors", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.high_with_other",
      name: "高危加其他",
      cardType: "event",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [
        {
          span: "unclear effect",
          category: "effect_mapping",
          severity: "high",
          options: ["X", "Y"],
          recommendedAction: "reject",
        },
      ],
    });

    expect(result.decision).toBe("reject");
    expect(result.issues.some((issue) => issue.code === "ENGINE_AMBIGUITY_REJECT")).toBe(true);
  });

  it("approves card with low ambiguity", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.low_ambiguity",
      name: "低歧义",
      cardType: "event",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "miyama_town" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [
        {
          span: "gain 1 mana",
          category: "effect_mapping",
          severity: "low",
          options: [],
          recommendedAction: "approve",
        },
      ],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
  });

  it("rejects cards with unsupported timings or effect types", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.bad.future_math",
      name: "未来算式",
      cardType: "master_skill",
      timing: ["victory_phase"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [{ type: "free_form_math", value: null }],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("reject");
    expect(result.issues.some((issue) => issue.code === "ENGINE_UNSUPPORTED_TIMING")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "ENGINE_UNSUPPORTED_EFFECT")).toBe(true);
  });

  it("rejects card with multiple error issues (unsupported + review)", () => {
    const result = evaluateStructuredCardCapability({
      id: "master.bad Combo",
      name: "组合错误",
      cardType: "master_skill",
      timing: ["victory_phase"],
      conditions: [],
      targets: [{ type: "random_enemy_cluster" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: null,
      visibility: "public",
      tags: ["moon_holy_grail"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("reject");
    expect(result.issues.some((issue) => issue.code === "ENGINE_UNSUPPORTED_TIMING")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "ENGINE_UNSUPPORTED_TARGET")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_TAG")).toBe(true);
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
  });

  it("reviews card with mixed warning issues", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.mixed_warning",
      name: "混合警告",
      cardType: "event",
      timing: ["action"],
      conditions: [{ type: "location_is", value: "moon_holy_grail" }],
      targets: [{ type: "self_player" }],
      effects: [{ type: "gain_mana", value: 1 }],
      duration: "until_round_end",
      visibility: "public",
      tags: [],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(false);
    expect(result.decision).toBe("review");
    expect(result.issues.some((issue) => issue.code === "ENGINE_DURATION_REVIEW")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "ENGINE_REVIEW_TAG")).toBe(true);
  });

  it("approves deterministic battlefield synergy modifiers", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.synergy.001",
      name: "协同",
      cardType: "event",
      timing: ["battle"],
      conditions: [],
      targets: [{ type: "self_battlefield" }],
      effects: [{ type: "battle_power_bonus_if_shared_attribute", value: 4 }],
      duration: null,
      visibility: "public",
      tags: ["synergy", "event"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues).toHaveLength(0);
  });

  it("approves deterministic reality-marble battlefield restrictions", () => {
    const result = evaluateStructuredCardCapability({
      id: "event.reality_marble.field",
      name: "固有结界",
      cardType: "event",
      timing: ["advance", "battle"],
      conditions: [],
      targets: [{ type: "self_battlefield" }],
      effects: [
        { type: "forbid_special_attack_on_battlefield", value: true },
        { type: "lock_battlefield_movement", value: "all_players" },
      ],
      duration: null,
      visibility: "public",
      tags: ["field"],
      ambiguities: [],
    });

    expect(result.engineOk).toBe(true);
    expect(result.decision).toBe("approve");
    expect(result.issues).toHaveLength(0);
  });

  it("downgrades an approve response when capability assessment requires review", () => {
    const response = applyCapabilityAssessmentToGuardrail(
      {
        jobId: "guardrail-1",
        artifactVersion: "guardrail-response-v1",
        status: "approve",
        schemaOk: true,
        engineOk: true,
        decision: "approve",
        ambiguityLevel: "low",
        coverageReport: { originalClauses: 1, missingClauses: 0 },
        issues: [],
        requiredHumanReview: false,
        smokeTests: [{ name: "smoke", setup: "x", expect: "y" }],
        source: { structureJobId: "s1", provider: "siliconflow", model: "m" },
      },
      {
        engineOk: false,
        decision: "review",
        issues: [
          {
            code: "ENGINE_REVIEW_TAG",
            severity: "warning",
            message: "Moon Holy Grail interactions require review.",
          },
        ],
      },
    );

    expect(response.decision).toBe("review");
    expect(response.status).toBe("review");
    expect(response.engineOk).toBe(false);
    expect(response.requiredHumanReview).toBe(true);
  });

  it("promotes minimal model review to approve when deterministic capability assessment is clean", () => {
    const response = applyCapabilityAssessmentToGuardrail(
      {
        jobId: "guardrail-synergy-1",
        artifactVersion: "guardrail-response-v1",
        status: "review",
        schemaOk: false,
        engineOk: false,
        decision: "review",
        ambiguityLevel: "medium",
        coverageReport: { originalClauses: 0, mappedClauses: 0, missingClauses: 0 },
        issues: [
          {
            code: "MODEL_RETURNED_MINIMAL_REVIEW",
            severity: "warning",
            message: "Model returned a minimal review response.",
          },
        ],
        requiredHumanReview: true,
        smokeTests: [],
        source: { structureJobId: "structure-synergy-1", provider: "siliconflow", model: "m" },
      },
      {
        engineOk: true,
        decision: "approve",
        issues: [],
      },
    );

    expect(response.decision).toBe("approve");
    expect(response.status).toBe("approve");
    expect(response.engineOk).toBe(true);
    expect(response.requiredHumanReview).toBe(false);
    expect(response.issues).toHaveLength(0);
  });

  it("adds deterministic capability smoke tests for approved reality-marble restrictions", () => {
    const assessment = evaluateStructuredCardCapability({
      id: "event.reality_marble.field",
      name: "固有结界",
      cardType: "event",
      timing: ["advance", "battle"],
      conditions: [],
      targets: [{ type: "self_battlefield" }],
      effects: [
        { type: "forbid_special_attack_on_battlefield", value: true },
        { type: "lock_battlefield_movement", value: "all_players" },
      ],
      duration: null,
      visibility: "public",
      tags: ["field"],
      ambiguities: [],
    });

    expect(assessment.engineOk).toBe(true);
    expect(assessment.decision).toBe("approve");
    expect(assessment.smokeTests.map((entry) => entry.name)).toEqual([
      "capability_approve_forbid_special_attack_on_battlefield_card_effects_0_type",
      "capability_approve_lock_battlefield_movement_card_effects_1_type",
    ]);
  });

  it("adds deterministic capability smoke tests for approved battlefield synergy primitives", () => {
    const assessment = {
      engineOk: true,
      decision: "approve" as const,
      issues: [],
      smokeTests: [
        {
          name: "capability_approve_battle_power_bonus_if_shared_attribute_card_effects_0_type",
          setup: "Run a seeded battle where both attacks share at least one attribute on the same battlefield.",
          expect: "Replay resolves the shared-attribute battle modifier deterministically.",
          source: "capability" as const,
        },
      ],
    };

    const response = applyCapabilityAssessmentToGuardrail(
      {
        jobId: "guardrail-synergy-approve-1",
        artifactVersion: "guardrail-response-v1",
        status: "approve",
        schemaOk: true,
        engineOk: true,
        decision: "approve",
        ambiguityLevel: "low",
        coverageReport: { originalClauses: 1, mappedClauses: 1, missingClauses: 0 },
        issues: [],
        requiredHumanReview: false,
        smokeTests: [],
        source: { structureJobId: "structure-synergy-approve-1", provider: "siliconflow", model: "m" },
      },
      assessment,
    );

    expect(response.decision).toBe("approve");
    expect(response.status).toBe("approve");
    expect(response.smokeTests.map((entry) => entry.name)).toContain(
      "capability_approve_battle_power_bonus_if_shared_attribute_card_effects_0_type",
    );
    expect(
      response.smokeTests.find(
        (entry) => entry.name === "capability_approve_battle_power_bonus_if_shared_attribute_card_effects_0_type",
      )?.source,
    ).toBe("capability");
  });

  it("adds capability-driven smoke tests for review and reject issues", () => {
    const response = applyCapabilityAssessmentToGuardrail(
      {
        jobId: "guardrail-2",
        artifactVersion: "guardrail-response-v1",
        status: "approve",
        schemaOk: true,
        engineOk: true,
        decision: "approve",
        ambiguityLevel: "low",
        coverageReport: { originalClauses: 1, missingClauses: 0 },
        issues: [],
        requiredHumanReview: false,
        smokeTests: [{ name: "base_smoke", setup: "base", expect: "base", source: "model" }],
        source: { structureJobId: "s2", provider: "siliconflow", model: "m" },
      },
      {
        engineOk: false,
        decision: "reject",
        issues: [
          {
            code: "ENGINE_REVIEW_TAG",
            severity: "warning",
            message: "Moon Holy Grail interactions require review.",
            fieldPath: "card.tags",
          },
          {
            code: "ENGINE_UNSUPPORTED_EFFECT",
            severity: "error",
            message: "Unsupported effect type: free_form_math",
            fieldPath: "card.effects.0.type",
          },
        ],
      },
    );

    expect(response.smokeTests.map((entry) => entry.name)).toContain(
      "capability_review_tag_card_tags",
    );
    expect(response.smokeTests.map((entry) => entry.name)).toContain(
      "capability_reject_unsupported_effect_card_effects_0_type",
    );
    expect(response.smokeTests.find((entry) => entry.name === "base_smoke")?.source).toBe("model");
    expect(
      response.smokeTests.find((entry) => entry.name === "capability_review_tag_card_tags")?.source,
    ).toBe("capability");
  });
});
