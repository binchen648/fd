import { access, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { reviewPendingPageDir, writeReviewPendingPageManifest } from "../src/servant-review-routing";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe("servant review routing", () => {
  it("routes ambiguous HTM pages into review-pending/<htm>/page-manifest.json", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "fd-servant-review-"));
    const htmPath = "D:/fd/chm-extract/阿尔托莉雅·潘德拉贡(Lancer).htm";
    const reviewDir = reviewPendingPageDir(root, htmPath);

    const manifestPath = await writeReviewPendingPageManifest({
      projectRoot: root,
      htmPath,
      pageName: "阿尔托莉雅·潘德拉贡(Lancer)",
      reason: "multiple-main-card-candidates",
      pngFiles: ["ScreenShot_001.png", "ScreenShot_002.png"],
      candidateSummaries: [
        { imageFile: "ScreenShot_001.png", isMainCard: true, confidence: "high" },
        { imageFile: "ScreenShot_002.png", isMainCard: true, confidence: "high" },
      ],
    });

    expect(reviewDir).toBe(path.join(root, "data", "staged", "review-pending", "阿尔托莉雅·潘德拉贡(Lancer)"));
    expect(manifestPath).toBe(path.join(reviewDir, "page-manifest.json"));
    expect(await exists(manifestPath)).toBe(true);
    expect(await exists(path.join(root, "data", "staged", "servants", "阿尔托莉雅·潘德拉贡"))).toBe(false);
    expect(await exists(path.join(root, "data", "staged", "servants", "阿尔托莉雅·潘德拉贡", "阿尔托莉雅·潘德拉贡(2/3).png"))).toBe(false);

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest).toMatchObject({
      status: "review_required",
      pageName: "阿尔托莉雅·潘德拉贡(Lancer)",
      reason: "multiple-main-card-candidates",
      pngFiles: ["ScreenShot_001.png", "ScreenShot_002.png"],
    });
  });
});
