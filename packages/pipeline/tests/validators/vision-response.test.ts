import { describe, expect, it } from "vitest";

import { repairVisionResponse } from "../../src/repair/vision";
import { validateVisionResponse } from "../../src/validators/vision-response";

describe("vision response repair", () => {
  it("normalizes malformed numeric fields arrays and source payloads", () => {
    const repaired = repairVisionResponse(
      {
        jobId: "vision-master-matou-shinji-001",
        artifactVersion: "vision-response-v1",
        status: "ok",
        classification: {
          cardTypeGuess: "master skill",
          subtypeGuess: "character",
          familyConfidence: 0.9,
        },
        text: {
          cardName: "间桐慎二",
          rawText: "吸魔命令-进入深山町时，获得1点魔力。",
          normalizedText: "吸魔命令-进入深山町时，获得1点魔力。",
        },
        fields: {
          code: null,
          costMarker: null,
          powerMarker: null,
          numericSlots: null,
          iconTags: "none",
          rarity: null,
          classTag: null,
        },
        blocks: [],
        uncertainSpans: [],
        overallConfidence: 0.95,
        source: "间桐慎二.htm",
      },
      "vision-master-matou-shinji-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateVisionResponse(repaired);

    expect(validated.fields.numericSlots).toEqual([]);
    expect(validated.fields.iconTags).toEqual([]);
    expect(validated.source).toEqual({
      provider: "siliconflow",
      model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
    });
  });

  it("repairs non-numeric familyConfidence into valid numbers", () => {
    const repaired = repairVisionResponse(
      {
        jobId: "vision-master-kuonji-alice-001",
        artifactVersion: "vision-response-v1",
        status: "ok",
        classification: {
          cardTypeGuess: "master skill",
          subtypeGuess: "character",
          familyConfidence: "0.8",
        },
        text: {
          cardName: "久远寺有珠",
          rawText: "有珠",
          normalizedText: "有珠",
        },
        fields: {
          code: null,
          costMarker: null,
          powerMarker: null,
          numericSlots: [],
          iconTags: [],
          rarity: null,
          classTag: null,
        },
        blocks: [],
        uncertainSpans: [],
        overallConfidence: 0.95,
        source: {
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "vision-master-kuonji-alice-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateVisionResponse(repaired);

    expect(validated.classification.familyConfidence).toBe(0.8);
  });

  it("repairs null familyConfidence into a valid default", () => {
    const repaired = repairVisionResponse(
      {
        jobId: "vision-master-illyasviel-001",
        artifactVersion: "vision-response-v1",
        status: "ok",
        classification: {
          cardTypeGuess: "master skill",
          subtypeGuess: "character",
          familyConfidence: null,
        },
        text: {
          cardName: "伊莉雅斯菲尔",
          rawText: "伊莉雅的skill",
          normalizedText: "伊莉雅的skill",
        },
        fields: {
          code: null,
          costMarker: null,
          powerMarker: null,
          numericSlots: [],
          iconTags: [],
          rarity: null,
          classTag: null,
        },
        blocks: [],
        uncertainSpans: [],
        overallConfidence: 0.95,
        source: {
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "vision-master-illyasviel-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateVisionResponse(repaired);

    expect(typeof validated.classification.familyConfidence).toBe("number");
  });

  it("fills missing top-level identifiers from the request context", () => {
    const repaired = repairVisionResponse(
      {
        classification: {
          cardTypeGuess: "event",
          subtypeGuess: "",
          familyConfidence: 0.9,
        },
        text: {
          cardName: "协同",
          rawText: "于此战场的玩家，其所有攻击若至少有一种属性相同，则合计威力+4。",
          normalizedText: "于此战场的玩家，其所有攻击若至少有一种属性相同，则合计威力+4。",
        },
        fields: {
          code: null,
          costMarker: "2",
          powerMarker: null,
          numericSlots: [],
          iconTags: [],
          rarity: null,
          classTag: null,
        },
        blocks: [],
        uncertainSpans: [],
        overallConfidence: 0.95,
        source: {
          provider: "siliconflow",
          model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
        },
      },
      "vision-event-synergy-001",
      "siliconflow",
      "Qwen/Qwen3-VL-235B-A22B-Thinking",
    );

    expect(repaired).not.toBeNull();
    const validated = validateVisionResponse(repaired);

    expect(validated.jobId).toBe("vision-event-synergy-001");
    expect(validated.artifactVersion).toBe("vision-response-v1");
    expect(validated.status).toBe("ok");
  });
});
