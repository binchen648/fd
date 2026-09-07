import { describe, expect, it } from "vitest";

import type { VisionResponse } from "@fd/contracts";
import { locateMainCard } from "../src/main-card-locator";

function makeVisionResponse(rawText: string, cardName: string, classTag?: string): VisionResponse {
  return {
    jobId: "vision-test",
    artifactVersion: "vision-response-v1",
    status: "ok",
    classification: {
      cardTypeGuess: classTag ? "Servant" : "master_skill",
      subtypeGuess: classTag ?? null,
      familyConfidence: 0.95,
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

describe("locateMainCard servant heuristics", () => {
  it("accepts servant main cards when page title and hand-bar signals line up", () => {
    const result = locateMainCard({
      entityType: "servant",
      pageName: "铃鹿御前",
      visionArtifact: makeVisionResponse(
        "Saber\n铃鹿御前\n2,2,3,4\n2,3,3,4,4\n2\nSurveil\nPreparation",
        "铃鹿御前",
        "Saber",
      ),
    });

    expect(result).toMatchObject({
      isMainCard: true,
      entityType: "servant",
      confidence: "high",
    });
    expect(result.matchedSignals).toContain("page-name-match");
    expect(result.matchedSignals).toContain("numeric-hand-rows");
  });

  it("rejects servant skill or NP cards even when they are the page first image", () => {
    const result = locateMainCard({
      entityType: "servant",
      pageName: "伊斯坎达尔",
      visionArtifact: makeVisionResponse(
        "特殊\n宝具\n王之军势\n【真名解放】\n行动阶段：创造并激活5张临时的威力2的★或☆属性的基础攻击直至回合结束。",
        "王之军势",
        "Rider",
      ),
    });

    expect(result).toMatchObject({
      isMainCard: false,
      entityType: "servant",
    });
    expect(result.rejectedReasons).toContain("page-name-mismatch");
    expect(result.rejectedReasons).toContain("effect-text-dominant");
  });
});

describe("locateMainCard master heuristics", () => {
  it("accepts master identity cards without requiring servant-style hand bars", () => {
    const result = locateMainCard({
      entityType: "master",
      pageName: "间桐慎二",
      visionArtifact: makeVisionResponse(
        "间桐慎二\n吸魔命令-进入深山町时，获得1点魔力。\n无用之人-游戏开始时，获得【伪臣之书】。\n小丑-当你战败时，失去一枚令咒。",
        "间桐慎二",
      ),
    });

    expect(result).toMatchObject({
      isMainCard: true,
      entityType: "master",
      confidence: "medium",
    });
    expect(result.matchedSignals).toContain("page-name-match");
    expect(result.matchedSignals).toContain("master-identity-shape");
  });

  it("rejects master skill cards when the visible title is not the master identity", () => {
    const result = locateMainCard({
      entityType: "master",
      pageName: "间桐慎二",
      visionArtifact: makeVisionResponse(
        "伪臣之书\n(间桐樱不在场)\n替代品-当你第一次失去所有令咒时，在该回合结束时，将你的御主替换为【间桐樱】。重置你的魔力，获得2令咒，保持战果不变。",
        "伪臣之书",
      ),
    });

    expect(result).toMatchObject({
      isMainCard: false,
      entityType: "master",
    });
    expect(result.rejectedReasons).toContain("page-name-mismatch");
  });
});
