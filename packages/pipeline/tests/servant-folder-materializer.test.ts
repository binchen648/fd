import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { VisionResponse } from "@fd/contracts";
import { materializeConfirmedServantFolder } from "../src/servant-folder-materializer";

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

describe("servant folder materializer", () => {
  it("creates servants/<character_name>/ and writes the confirmed main-card json", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-servant-folder-"));
    const stagingDir = path.join(root, "data", "staged", "staging", "查尔斯·巴贝奇");
    const mainImagePath = path.join(stagingDir, "ScreenShot_001.png");
    const otherImagePath = path.join(stagingDir, "ScreenShot_002.png");

    await mkdir(stagingDir, { recursive: true });
    await writeFile(mainImagePath, "main", "utf8");
    await writeFile(otherImagePath, "other", "utf8");

    const result = await materializeConfirmedServantFolder({
      projectRoot: root,
      stagedImagePaths: [mainImagePath, otherImagePath],
      selectedImageFile: "ScreenShot_001.png",
      visionArtifact: makeVisionResponse("查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5", "查尔斯·巴贝奇", "Caster"),
    });

    const servantDir = path.join(root, "data", "staged", "servants", "查尔斯·巴贝奇");
    const mainCardJsonPath = path.join(servantDir, "查尔斯·巴贝奇.main-card.json");
    expect(result.servantDir).toBe(servantDir);
    expect(await exists(path.join(servantDir, "ScreenShot_001.png"))).toBe(true);
    expect(await exists(path.join(servantDir, "ScreenShot_002.png"))).toBe(true);
    expect(await exists(mainCardJsonPath)).toBe(true);

    const mainCardJson = JSON.parse(await readFile(mainCardJsonPath, "utf8"));
    expect(mainCardJson).toMatchObject({
      character_name: "查尔斯·巴贝奇",
      total_count: 12,
      imageFile: "ScreenShot_001.png",
    });
  });
});
