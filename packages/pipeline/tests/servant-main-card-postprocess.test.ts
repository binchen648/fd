import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { VisionRequest, VisionResponse } from "@fd/contracts";
import { maybeWriteServantRecognitionBundle } from "../src/servant-main-card-postprocess";

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

function makeVisionRequest(imagePath: string): VisionRequest {
  return {
    jobId: "vision-servant.oda_nobunaga.mob.001",
    artifactVersion: "vision-request-v1",
    input: {
      imagePath,
      sourceSet: "servant",
      familyHint: "mob",
      language: "zh-CN",
    },
    provider: {
      name: "siliconflow",
      model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
      mode: "accuracy",
    },
  };
}

describe("maybeWriteServantRecognitionBundle", () => {
  it("writes a recognition bundle for the first servant image using catalog source-page lookup", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-maincard-"));
    const imagePath = path.join(root, "chm-extract", "图包", "ScreenShot_2025-11-02_130454_353.png");
    const sourcePage = path.join(root, "chm-extract", "魔王信长.htm");
    const catalogPath = path.join(root, "chm-extract", "card_catalog.json");

    await mkdir(path.dirname(imagePath), { recursive: true });
    await writeFile(imagePath, "", "utf8");
    await writeFile(
      sourcePage,
      '<P><IMG alt="" src="图包/ScreenShot_2025-11-02_130454_353.png"><IMG alt="" src="图包/ScreenShot_2025-11-02_130514_577.png"></P>',
      "utf8",
    );
    await writeFile(
      catalogPath,
      JSON.stringify([
        {
          filename: "魔王信长.htm",
          name: "魔王信长",
          title: "魔王信长",
          images: ["ScreenShot_2025-11-02_130454_353.png", "ScreenShot_2025-11-02_130514_577.png"],
        },
      ]),
      "utf8",
    );

    const bundlePath = await maybeWriteServantRecognitionBundle({
      request: makeVisionRequest(imagePath),
      response: makeVisionResponse(
        "织田信长\n3,3,3,4,4,4,5,5,5\nPreparation\nPreparation\nPreparation\nAvenger",
        "织田信长",
        "Avenger",
      ),
      projectRoot: root,
    });

    expect(bundlePath).toBe(path.join(root, "data", "staged", "review-pending", "oda_nobunaga.mob.bundle.json"));
    const bundle = JSON.parse(await readFile(bundlePath!, "utf8"));
    expect(bundle).toMatchObject({
      familyId: "servant.oda_nobunaga.mob",
      visionArtifactPath: path.join(root, "data", "staged", "ocr", "mob", "ScreenShot_2025-11-02_130454_353.json").split("\\").join("/"),
      mainCardfaceAnalysis: {
        red_count: 9,
        special_count: 3,
        total_count: 12,
      },
    });
  });

  it("skips first-page servant images when locator sees a noble phantasm instead of the servant main card", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-maincard-"));
    const imagePath = path.join(root, "chm-extract", "图包", "ScreenShot_2025-11-01_163855_615.png");
    const sourcePage = path.join(root, "chm-extract", "伊斯坎达尔.htm");
    const request = {
      ...makeVisionRequest(imagePath),
      jobId: "vision-servant.伊斯坎达尔.001",
      input: {
        ...makeVisionRequest(imagePath).input,
        sourcePage,
      },
    };

    await mkdir(path.dirname(imagePath), { recursive: true });
    await writeFile(imagePath, "", "utf8");
    await writeFile(
      sourcePage,
      '<P><IMG alt="" src="图包/ScreenShot_2025-11-01_163855_615.png"><IMG alt="" src="图包/ScreenShot_2025-11-01_163900_000.png"></P>',
      "utf8",
    );

    const bundlePath = await maybeWriteServantRecognitionBundle({
      request,
      response: makeVisionResponse(
        `特殊
宝具
王之军势
【真名解放】
行动阶段：创造并激活5张临时的威力2的★或☆属性的基础攻击直至回合结束。`,
        "王之军势",
        "Rider",
      ),
      projectRoot: root,
    });

    expect(bundlePath).toBeNull();
  });

  it("skips non-main-card servant images that are not first on the source page", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-maincard-"));
    const imagePath = path.join(root, "chm-extract", "图包", "ScreenShot_2025-11-02_130514_577.png");
    const sourcePage = path.join(root, "chm-extract", "魔王信长.htm");
    const request = makeVisionRequest(imagePath);

    await mkdir(path.dirname(imagePath), { recursive: true });
    await writeFile(imagePath, "", "utf8");
    await writeFile(
      sourcePage,
      '<P><IMG alt="" src="图包/ScreenShot_2025-11-02_130454_353.png"><IMG alt="" src="图包/ScreenShot_2025-11-02_130514_577.png"></P>',
      "utf8",
    );

    const bundlePath = await maybeWriteServantRecognitionBundle({
      request: {
        ...request,
        input: {
          ...request.input,
          sourcePage,
        },
      },
      response: makeVisionResponse("织田信长", "织田信长", "Avenger"),
      projectRoot: root,
    });

    expect(bundlePath).toBeNull();
  });
});
