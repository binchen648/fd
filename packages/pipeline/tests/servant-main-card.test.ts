import { describe, expect, it } from "vitest";

import type { VisionResponse } from "@fd/contracts";
import {
  buildServantRecognitionBundle,
  extractImageSourcesFromHtml,
  parseServantMainCardAnalysis,
} from "../src/servant-main-card";

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
      provider: "siliconflow",
      model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
    },
  };
}

describe("parseServantMainCardAnalysis", () => {
  it("parses Nobunaga main-card OCR into red cards and repeated preparations", () => {
    const analysis = parseServantMainCardAnalysis(
      makeVisionResponse(
        "织田信长\n3,3,3,4,4,4,5,5,5\nPreparation\nPreparation\nPreparation\nAvenger",
        "织田信长",
        "Avenger",
      ),
    );

    expect(analysis).toEqual({
      character_name: "织田信长",
      red_cards: [3, 3, 3, 4, 4, 4, 5, 5, 5],
      green_cards: [],
      blue_cards: [],
      special_cards: ["Preparation", "Preparation", "Preparation"],
      red_count: 9,
      green_count: 0,
      blue_count: 0,
      special_count: 3,
      total_count: 12,
    });
  });

  it("parses Galatea main-card OCR into three color zones and white specials", () => {
    const analysis = parseServantMainCardAnalysis(
      makeVisionResponse(
        "Berserker\n伽拉忒亚\n2,3,3,4,4\n2,3\n2,2,4\nPreparation\nPreparation",
        "伽拉忒亚",
        "Berserker",
      ),
    );

    expect(analysis).toEqual({
      character_name: "伽拉忒亚",
      red_cards: [2, 3, 3, 4, 4],
      green_cards: [2, 3],
      blue_cards: [2, 2, 4],
      special_cards: ["Preparation", "Preparation"],
      red_count: 5,
      green_count: 2,
      blue_count: 3,
      special_count: 2,
      total_count: 12,
    });
  });

  it("parses Babbage main-card OCR into a balanced 12-card spread", () => {
    const analysis = parseServantMainCardAnalysis(
      makeVisionResponse(
        "查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5",
        "查尔斯·巴贝奇",
        "Caster",
      ),
    );

    expect(analysis).toEqual({
      character_name: "查尔斯·巴贝奇",
      red_cards: [2, 3, 3, 5],
      green_cards: [2, 2, 4, 4],
      blue_cards: [2, 3, 3, 5],
      special_cards: [],
      red_count: 4,
      green_count: 4,
      blue_count: 4,
      special_count: 0,
      total_count: 12,
    });
  });

  it("keeps servant-specific special cards embedded inside a color row", () => {
    const analysis = parseServantMainCardAnalysis(
      makeVisionResponse(
        "谜之女主角X[Alter]\n2,5,7\n2,5,7 + Shadowless Blade\n2,5,7\nLuck\nSurveil",
        "谜之女主角X[Alter]",
        "Avenger",
      ),
    );

    expect(analysis).toEqual({
      character_name: "谜之女主角X[Alter]",
      red_cards: [2, 5, 7],
      green_cards: [2, 5, 7],
      blue_cards: [2, 5, 7],
      special_cards: ["Shadowless Blade", "Luck", "Surveil"],
      red_count: 3,
      green_count: 3,
      blue_count: 3,
      special_count: 3,
      total_count: 12,
    });
  });
});

describe("extractImageSourcesFromHtml", () => {
  it("ignores template navigation images and keeps only screenshot assets", () => {
    const html = `<div><img src="../template2/btn_prev_n.gif"><img src="图包/ScreenShot_2025-11-02_130454_353.png"><img src="图包/ScreenShot_2025-11-02_130514_577.png"></div>`;

    expect(extractImageSourcesFromHtml(html)).toEqual([
      "ScreenShot_2025-11-02_130454_353.png",
      "ScreenShot_2025-11-02_130514_577.png",
    ]);
  });

  it("extracts screenshot file names from servant source pages in document order", () => {
    const html = `<P><IMG alt="" src="图包/ScreenShot_2025-11-01_211944_712.png"><IMG alt="" src="图包/ScreenShot_2025-11-01_211959_889.png"></P>`;

    expect(extractImageSourcesFromHtml(html)).toEqual([
      "ScreenShot_2025-11-01_211944_712.png",
      "ScreenShot_2025-11-01_211959_889.png",
    ]);
  });
});

describe("buildServantRecognitionBundle", () => {
  it("builds a review-pending bundle from source html and a main-card vision artifact", () => {
    const vision = makeVisionResponse(
      "查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5",
      "查尔斯·巴贝奇",
      "Caster",
    );
    const html = `<P><IMG alt="" src="图包/ScreenShot_2025-11-01_211944_712.png"><IMG alt="" src="图包/ScreenShot_2025-11-01_211959_889.png"></P>`;

    expect(
      buildServantRecognitionBundle({
        familyId: "servant.babbage",
        sourceHtm: "D:/fd/chm-extract/查尔斯·巴贝奇.htm",
        sourceHtml: html,
        visionArtifact: vision,
        mainImageFile: "ScreenShot_2025-11-01_211944_712.png",
        visionArtifactPath: "D:/fd/data/staged/ocr/caster/ScreenShot_2025-11-01_211944_712.json",
      }),
    ).toEqual({
      artifactVersion: "recognition-bundle-v1",
      status: "recognized",
      familyId: "servant.babbage",
      displayName: "查尔斯·巴贝奇",
      sourceHtm: "D:/fd/chm-extract/查尔斯·巴贝奇.htm",
      images: [
        "D:/fd/chm-extract/图包/ScreenShot_2025-11-01_211944_712.png",
        "D:/fd/chm-extract/图包/ScreenShot_2025-11-01_211959_889.png",
      ],
      visionArtifactPath: "D:/fd/data/staged/ocr/caster/ScreenShot_2025-11-01_211944_712.json",
      classificationRule: {
        method: "fd-card-recognition-v1",
        legend: {
          red: "red_cards numeric entries",
          green: "green_cards numeric entries",
          blue: "blue_cards numeric entries",
          white: "special_cards repeated text entries",
        },
      },
      mainCardfaceAnalysis: {
        imageFile: "ScreenShot_2025-11-01_211944_712.png",
        character_name: "查尔斯·巴贝奇",
        red_cards: [2, 3, 3, 5],
        green_cards: [2, 2, 4, 4],
        blue_cards: [2, 3, 3, 5],
        special_cards: [],
        red_count: 4,
        green_count: 4,
        blue_count: 4,
        special_count: 0,
        total_count: 12,
      },
    });
  });
});
