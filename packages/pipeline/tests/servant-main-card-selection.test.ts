import { describe, expect, it } from "vitest";

import type { VisionResponse } from "@fd/contracts";
import { selectUniqueServantMainCard } from "../src/servant-main-card-selection";

function makeVisionResponse(rawText: string, cardName: string, classTag?: string): VisionResponse {
  return {
    jobId: "vision-test",
    artifactVersion: "vision-response-v1",
    status: "ok",
    classification: {
      cardTypeGuess: "Servant",
      subtypeGuess: classTag ?? null,
      familyConfidence: 0.99,
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
      classTag: classTag ?? null,
    },
    blocks: [],
    uncertainSpans: [],
    overallConfidence: 0.95,
    source: {
      provider: "test",
      model: "test-model",
    },
  };
}

describe("selectUniqueServantMainCard", () => {
  it("accepts one unique high-confidence main card on the page", () => {
    const result = selectUniqueServantMainCard("铃鹿御前", [
      {
        imageFile: "ScreenShot_001.png",
        visionArtifact: makeVisionResponse(
          "Saber\n铃鹿御前\n2,2,3,4\n2,3,3,4,4\n2\nSurveil\nPreparation",
          "铃鹿御前",
          "Saber",
        ),
      },
      {
        imageFile: "ScreenShot_002.png",
        visionArtifact: makeVisionResponse(
          "凤鸣一闪\n行动阶段：本回合你的攻击威力+2。",
          "凤鸣一闪",
          "Saber",
        ),
      },
    ]);

    expect(result).toMatchObject({
      status: "confirmed",
      reason: "unique-main-card-confirmed",
      selectedImageFile: "ScreenShot_001.png",
    });
    expect(result.candidateSummaries).toHaveLength(2);
  });

  it("rejects the page when two plausible main-card candidates exist", () => {
    const result = selectUniqueServantMainCard("查尔斯·巴贝奇", [
      {
        imageFile: "ScreenShot_001.png",
        visionArtifact: makeVisionResponse("查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5", "查尔斯·巴贝奇", "Caster"),
      },
      {
        imageFile: "ScreenShot_002.png",
        visionArtifact: makeVisionResponse("查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5", "查尔斯·巴贝奇", "Caster"),
      },
    ]);

    expect(result).toMatchObject({
      status: "review_required",
      reason: "multiple-main-card-candidates",
      selectedImageFile: null,
    });
    expect(result.candidateSummaries.filter((candidate) => candidate.isMainCard)).toHaveLength(2);
  });

  it("rejects the page when no plausible main-card candidate exists", () => {
    const result = selectUniqueServantMainCard("伊斯坎达尔", [
      {
        imageFile: "ScreenShot_001.png",
        visionArtifact: makeVisionResponse(
          "特殊\n宝具\n王之军势\n【真名解放】\n行动阶段：创造并激活5张临时的威力2的★或☆属性的基础攻击直至回合结束。",
          "王之军势",
          "Rider",
        ),
      },
    ]);

    expect(result).toMatchObject({
      status: "review_required",
      reason: "no-main-card-candidate",
      selectedImageFile: null,
    });
    expect(result.candidateSummaries[0]).toMatchObject({
      imageFile: "ScreenShot_001.png",
      isMainCard: false,
    });
  });
});
