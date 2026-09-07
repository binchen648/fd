import { access, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { VisionResponse } from "@fd/contracts";
import { runServantPageWorkflow } from "../src/runners/run-servant-page";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function makeVisionResponse(rawText: string, cardName: string, classTag?: string): VisionResponse {
  return {
    jobId: "vision-test",
    artifactVersion: "vision-response-v1",
    status: "ok",
    classification: {
      cardTypeGuess: classTag ? "Servant" : "servant_skill",
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

describe("runServantPageWorkflow", () => {
  it("runs the confirmed servant-page workflow end to end", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-servant-page-"));
    const htmPath = path.join(root, "chm-extract", "查尔斯·巴贝奇.htm");
    const imageDir = path.join(root, "chm-extract", "图包");
    const mainImage = path.join(imageDir, "ScreenShot_001.png");
    const skillImage = path.join(imageDir, "ScreenShot_002.png");

    await mkdir(imageDir, { recursive: true });
    await writeFile(mainImage, "main", "utf8");
    await writeFile(skillImage, "skill", "utf8");
    await writeFile(
      htmPath,
      '<html><head><title>查尔斯·巴贝奇</title></head><body><img src="图包/ScreenShot_001.png"><img src="图包/ScreenShot_002.png"></body></html>',
      "utf8",
    );

    const result = await runServantPageWorkflow({
      projectRoot: root,
      htmPath,
      artifactsByImage: {
        "ScreenShot_001.png": {
          visionArtifact: makeVisionResponse("查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5", "查尔斯·巴贝奇", "Caster"),
        },
        "ScreenShot_002.png": {
          visionArtifact: makeVisionResponse("魔力放出\n行动阶段：你的攻击威力+2。", "魔力放出"),
          draft: {
            card_name: "魔力放出",
            card_type: "servant_skill",
            ocr_text_raw: "魔力放出\n行动阶段：你的攻击威力+2。",
            ocr_text_draft: "魔力放出 行动阶段：你的攻击威力+2。",
            rules_text: "行动阶段：你的攻击威力+2。",
            effect_text: "行动阶段：你的攻击威力+2。",
            effect_explanation: "Buff this turn.",
            cost: null,
            power: null,
            displayed_cost_power_confirmed: false,
            tags: ["servant", "skill"],
            attributes: ["魔术"],
            confidence: 0.85,
            needs_human_review: false,
            uncertain_fields: [],
            review_notes: [],
          },
        },
      },
    });

    expect(result.status).toBe("confirmed");
    expect(await exists(path.join(root, "data", "staged", "staging", "查尔斯·巴贝奇"))).toBe(true);
    expect(await exists(path.join(root, "data", "staged", "servants", "查尔斯·巴贝奇", "查尔斯·巴贝奇.main-card.json"))).toBe(true);
    expect(await exists(path.join(root, "data", "staged", "servants", "查尔斯·巴贝奇", "魔力放出.json"))).toBe(true);
    expect(await exists(path.join(root, "data", "staged", "review-pending", "查尔斯·巴贝奇", "page-manifest.json"))).toBe(false);
  });

  it("routes ambiguous pages into review pending", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-servant-page-"));
    const htmPath = path.join(root, "chm-extract", "查尔斯·巴贝奇.htm");
    const imageDir = path.join(root, "chm-extract", "图包");

    await mkdir(imageDir, { recursive: true });
    await writeFile(path.join(imageDir, "ScreenShot_001.png"), "one", "utf8");
    await writeFile(path.join(imageDir, "ScreenShot_002.png"), "two", "utf8");
    await writeFile(
      htmPath,
      '<html><body><img src="图包/ScreenShot_001.png"><img src="图包/ScreenShot_002.png"></body></html>',
      "utf8",
    );

    const result = await runServantPageWorkflow({
      projectRoot: root,
      htmPath,
      artifactsByImage: {
        "ScreenShot_001.png": { visionArtifact: makeVisionResponse("查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5", "查尔斯·巴贝奇", "Caster") },
        "ScreenShot_002.png": { visionArtifact: makeVisionResponse("查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5", "查尔斯·巴贝奇", "Caster") },
      },
    });

    expect(result.status).toBe("review_required");
    expect(await exists(path.join(root, "data", "staged", "review-pending", "查尔斯·巴贝奇", "page-manifest.json"))).toBe(true);
  });

  it("uses local OCR fallback when image artifacts are missing", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-servant-page-"));
    const htmPath = path.join(root, "chm-extract", "查尔斯·巴贝奇.htm");
    const imageDir = path.join(root, "chm-extract", "图包");

    await mkdir(imageDir, { recursive: true });
    await writeFile(path.join(imageDir, "ScreenShot_001.png"), "one", "utf8");
    await writeFile(path.join(imageDir, "ScreenShot_002.png"), "two", "utf8");
    await writeFile(
      htmPath,
      '<html><body><img src="图包/ScreenShot_001.png"><img src="图包/ScreenShot_002.png"></body></html>',
      "utf8",
    );

    const result = await runServantPageWorkflow({
      projectRoot: root,
      htmPath,
      artifactsByImage: {
        "ScreenShot_001.png": { visionArtifact: makeVisionResponse("查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5", "查尔斯·巴贝奇", "Caster") },
      },
      localOcrFallback: async (imageFile) => {
        if (path.basename(imageFile) === "ScreenShot_002.png") {
          return ["力量", "魔术", "生命", "10", "18", "遗蜕-打出时：测试文本"];
        }
        throw new Error(`Unexpected image: ${imageFile}`);
      },
    });

    expect(result.status).toBe("confirmed");
    expect(await exists(path.join(root, "data", "staged", "servants", "查尔斯·巴贝奇", "生命(10／18).json"))).toBe(true);
  });
});
