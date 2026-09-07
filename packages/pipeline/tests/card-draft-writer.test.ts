import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { writeCardDraftArtifacts } from "../src/card-draft-writer";

describe("card draft writer", () => {
  it("writes renamed PNG targets and same-stem JSON draft artifacts", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-card-draft-"));
    const servantDir = path.join(root, "data", "staged", "servants", "查尔斯·巴贝奇");
    const sourceImagePath = path.join(root, "data", "staged", "staging", "查尔斯·巴贝奇", "ScreenShot_002.png");

    await mkdir(path.dirname(sourceImagePath), { recursive: true });
    await writeFile(sourceImagePath, "png-binary", "utf8");

    const result = await writeCardDraftArtifacts({
      outputDir: servantDir,
      sourceImagePath,
      draft: {
        card_name: "魔力放出",
        card_type: "servant_skill",
        ocr_text_raw: "魔力放出",
        ocr_text_draft: "魔力放出",
        rules_text: "行动阶段：你的攻击威力+2。",
        effect_text: "你的攻击威力+2。",
        effect_explanation: "Buff this turn.",
        cost: 2,
        power: 4,
        displayed_cost_power_confirmed: true,
        tags: ["servant", "skill"],
        attributes: ["魔术"],
        confidence: 0.88,
        needs_human_review: false,
        uncertain_fields: [],
        review_notes: [],
      },
    });

    expect(result.pngPath).toBe(path.join(servantDir, "魔力放出(2／4).png"));
    expect(result.jsonPath).toBe(path.join(servantDir, "魔力放出(2／4).json"));

    const storedDraft = JSON.parse(await readFile(result.jsonPath, "utf8"));
    expect(storedDraft).toMatchObject({
      card_name: "魔力放出",
      needs_human_review: false,
    });
  });
});
