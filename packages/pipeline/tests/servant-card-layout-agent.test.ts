import { describe, expect, it } from "vitest";

import type { VisionResponse } from "@fd/contracts";
import { buildDraftFromServantCardLayoutRecognition, recognizeServantCardLayout } from "../src/servant-card-layout-agent";

function makeVisionResponse(rawText: string, cardName: string): VisionResponse {
  return {
    jobId: "vision-layout-test",
    artifactVersion: "vision-response-v1",
    status: "ok",
    classification: {
      cardTypeGuess: "servant_skill",
      subtypeGuess: "Berserker",
      familyConfidence: 0.9,
    },
    text: {
      cardName,
      rawText,
      normalizedText: rawText.replace(/\n/g, " "),
    },
    fields: {
      code: null,
      costMarker: null,
      powerMarker: null,
      numericSlots: [],
      iconTags: [],
      rarity: null,
      classTag: "Berserker",
    },
    blocks: [],
    uncertainSpans: [],
    overallConfidence: 0.9,
    source: {
      provider: "test",
      model: "test-model",
    },
  };
}

describe("servant card layout agent", () => {
  it("extracts a stable card name, attributes, and visible A/B pair from fixed-layout OCR text", () => {
    const recognition = recognizeServantCardLayout(
      makeVisionResponse("力量\n魔术\n飞鸟\n4\n7\n[作品]\n遗憾-当你以常规出牌以外的方式激活或令此牌入场后\n失去2点魔力。", "飞鸟"),
    );

    expect(recognition).toMatchObject({
      card_name: "飞鸟",
      mana_cost: 4,
      attack_power: 7,
      attributes: ["力量", "魔术"],
      uncertain_fields: [],
    });
    expect(recognition.rules_text).toContain("遗憾");
  });

  it("marks card_name uncertain when visible title conflicts with body skill name", () => {
    const recognition = recognizeServantCardLayout(
      makeVisionResponse("力量\n魔术\n宝具\n生命\n10\n18\n[真名解放]\n遗蜕-打出时：你本回合使用伽拉忒亚的技能牌的阶段能力时的魔力消耗减少共计至多10点。", "遗蜕"),
    );

    expect(recognition.card_name).toBe("生命");
    expect(recognition.mana_cost).toBe(10);
    expect(recognition.attack_power).toBe(18);
    expect(recognition.uncertain_fields).toContain("card_name");
  });

  it("keeps merged numeric OCR ambiguous instead of guessing", () => {
    const recognition = recognizeServantCardLayout(
      makeVisionResponse("魔术\n飞鸟\n43\n7\n[作品]\n羽翼-打出时：此牌获得+3威力。", "飞鸟"),
    );

    expect(recognition.mana_cost).toBeNull();
    expect(recognition.attack_power).toBeNull();
    expect(recognition.uncertain_fields).toEqual(expect.arrayContaining(["mana_cost", "attack_power"]));
  });

  it("builds a draft that can still keep (A/B) confirmed even if another field needs review", () => {
    const visionArtifact = makeVisionResponse("力量\n魔术\n宝具\n生命\n10\n18\n[真名解放]\n遗蜕-打出时：你本回合使用伽拉忒亚的技能牌的阶段能力时的魔力消耗减少共计至多10点。", "遗蜕");
    const draft = buildDraftFromServantCardLayoutRecognition({
      visionArtifact,
      recognition: recognizeServantCardLayout(visionArtifact),
    });

    expect(draft.card_name).toBe("生命");
    expect(draft.cost).toBe(10);
    expect(draft.power).toBe(18);
    expect(draft.displayed_cost_power_confirmed).toBe(true);
    expect(draft.needs_human_review).toBe(true);
    expect(draft.uncertain_fields).toContain("card_name");
  });

  it("normalizes three-digit OCR noise back to a two-digit power", () => {
    const visionArtifact = makeVisionResponse("力量\n魔术\n宝具\n生命\n10\n184\n[真名解放]", "遗蜕");
    const draft = buildDraftFromServantCardLayoutRecognition({
      visionArtifact,
      recognition: recognizeServantCardLayout(visionArtifact),
    });

    expect(draft.cost).toBe(10);
    expect(draft.power).toBe(18);
    expect(draft.displayed_cost_power_confirmed).toBe(true);
  });
});
