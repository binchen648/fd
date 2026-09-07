import { describe, expect, it } from "vitest";

import {
  assertCardExtractionDraft,
  createCardExtractionDraft,
  isCardExtractionDraft,
} from "../src/card-extractor-types";

describe("card extractor draft types", () => {
  it("builds a stable per-card extraction draft schema", () => {
    const draft = createCardExtractionDraft({
      card_name: "魔力放出",
      card_type: "servant_skill",
      ocr_text_raw: "魔力放出\n行动阶段：你的攻击威力+2。",
      ocr_text_draft: "魔力放出 行动阶段：你的攻击威力+2。",
      rules_text: "行动阶段：你的攻击威力+2。",
      effect_text: "行动阶段：你的攻击威力+2。",
      effect_explanation: "Buffs attack power this turn.",
      cost: null,
      power: null,
      displayed_cost_power_confirmed: false,
      tags: ["servant", "skill"],
      attributes: ["魔术"],
      confidence: 0.83,
      needs_human_review: true,
      uncertain_fields: ["mana_cost", "attack_power"],
      review_notes: ["Cost/power not visibly displayed on card face."],
    });

    expect(draft).toEqual({
      card_name: "魔力放出",
      card_type: "servant_skill",
      ocr_text_raw: "魔力放出\n行动阶段：你的攻击威力+2。",
      ocr_text_draft: "魔力放出 行动阶段：你的攻击威力+2。",
      rules_text: "行动阶段：你的攻击威力+2。",
      effect_text: "行动阶段：你的攻击威力+2。",
      effect_explanation: "Buffs attack power this turn.",
      cost: null,
      power: null,
      displayed_cost_power_confirmed: false,
      tags: ["servant", "skill"],
      attributes: ["魔术"],
      confidence: 0.83,
      needs_human_review: true,
      uncertain_fields: ["mana_cost", "attack_power"],
      review_notes: ["Cost/power not visibly displayed on card face."],
    });
    expect(isCardExtractionDraft(draft)).toBe(true);
    expect(() => assertCardExtractionDraft(draft)).not.toThrow();
  });
});
