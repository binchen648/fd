import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { VisionRequest, VisionResponse } from "@fd/contracts";
import { maybeWriteMasterMainCardArtifact } from "../src/master-main-card-postprocess";

function makeVisionResponse(rawText: string, cardName: string): VisionResponse {
  return {
    jobId: "vision-test",
    artifactVersion: "vision-response-v1",
    status: "ok",
    classification: {
      cardTypeGuess: "master_skill",
      subtypeGuess: null,
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
      classTag: null,
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

function makeVisionRequest(imagePath: string): VisionRequest {
  return {
    jobId: "vision-master.matou_shinji.001",
    artifactVersion: "vision-request-v1",
    input: {
      imagePath,
      sourcePage: imagePath.replace(/图包\[^\]+$/, "间桐慎二.htm"),
      sourceSet: "master",
      language: "zh-CN",
    },
    provider: {
      name: "siliconflow",
      model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
      mode: "accuracy",
    },
  };
}

describe("maybeWriteMasterMainCardArtifact", () => {
  it("writes metadata for master identity cards that match the page identity", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-master-maincard-"));
    const imagePath = path.join(root, "chm-extract", "图包", "ScreenShot_2025-10-30_194536_066.png");
    const sourcePage = path.join(root, "chm-extract", "间桐慎二.htm");

    await mkdir(path.dirname(imagePath), { recursive: true });
    await writeFile(imagePath, "", "utf8");
    await writeFile(sourcePage, '<P><IMG alt="" src="图包/ScreenShot_2025-10-30_194536_066.png"></P>', "utf8");

    const outputPath = await maybeWriteMasterMainCardArtifact({
      request: { ...makeVisionRequest(imagePath), input: { ...makeVisionRequest(imagePath).input, sourcePage } },
      response: makeVisionResponse(
        "间桐慎二\n吸魔命令-进入深山町时，获得1点魔力。\n无用之人-游戏开始时，获得【伪臣之书】。\n小丑-当你战败时，失去一枚令咒。",
        "间桐慎二",
      ),
      projectRoot: root,
    });

    expect(outputPath).toBe(path.join(root, "data", "staged", "review-pending", "master-main-card-ScreenShot_2025-10-30_194536_066.json"));
    const artifact = JSON.parse(await readFile(outputPath!, "utf8"));
    expect(artifact).toMatchObject({
      artifactVersion: "master-main-card-v1",
      displayName: "间桐慎二",
      locator: {
        isMainCard: true,
        entityType: "master",
      },
    });
  });

  it("skips master skill cards whose visible title is not the identity name", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-master-maincard-"));
    const imagePath = path.join(root, "chm-extract", "图包", "ScreenShot_2025-10-30_194540_736.png");
    const sourcePage = path.join(root, "chm-extract", "间桐慎二.htm");

    await mkdir(path.dirname(imagePath), { recursive: true });
    await writeFile(imagePath, "", "utf8");
    await writeFile(sourcePage, '<P><IMG alt="" src="图包/ScreenShot_2025-10-30_194540_736.png"></P>', "utf8");

    const outputPath = await maybeWriteMasterMainCardArtifact({
      request: { ...makeVisionRequest(imagePath), input: { ...makeVisionRequest(imagePath).input, sourcePage } },
      response: makeVisionResponse(
        "伪臣之书\n(间桐樱不在场)\n替代品-当你第一次失去所有令咒时，在该回合结束时，将你的御主替换为【间桐樱】。重置你的魔力，获得2令咒，保持战果不变。",
        "伪臣之书",
      ),
      projectRoot: root,
    });

    expect(outputPath).toBeNull();
  });
});
