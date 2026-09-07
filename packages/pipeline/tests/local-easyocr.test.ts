import { describe, expect, it } from "vitest";

import { buildVisionArtifactFromLocalOcr } from "../src/local-easyocr";

describe("local easyocr bridge", () => {
  it("builds a usable VisionResponse from local OCR lines", () => {
    const artifact = buildVisionArtifactFromLocalOcr({
      imagePath: "D:/fd/data/staged/staging/查尔斯·巴贝奇/ScreenShot_001.png",
      pagePath: "D:/fd/chm-extract/查尔斯·巴贝奇.htm",
      familyHint: "caster",
      lines: ["力量", "魔术", "生命", "10", "18", "遗蜕-打出时：测试文本"],
    });

    expect(artifact.text.cardName).toBe("生命");
    expect(artifact.classification.subtypeGuess).toBe("Caster");
    expect(artifact.text.rawText).toContain("遗蜕-打出时");
  });

  it("treats a two-digit OCR pair as a cost-power split when the first value is a plausible card cost", () => {
    const artifact = buildVisionArtifactFromLocalOcr({
      imagePath: "D:/fd/data/staged/staging/弗朗西斯·德雷克/ScreenShot_001.png",
      pagePath: "D:/fd/chm-extract/弗朗西斯·德雷克.htm",
      familyHint: "rider",
      lines: ["宝具", "黄金鹿与暴风夜", "7", "13", "[真名解放]"],
    });

    expect(artifact.text.cardName).toBe("黄金鹿与暴风夜");
    expect(artifact.fields.numericSlots).toEqual([7, 13]);
  });

  it("normalizes an over-large numeric noise token back to a plausible card cost", () => {
    const artifact = buildVisionArtifactFromLocalOcr({
      imagePath: "D:/fd/data/staged/staging/弗朗西斯·德雷克/ScreenShot_001.png",
      pagePath: "D:/fd/chm-extract/弗朗西斯·德雷克.htm",
      familyHint: "rider",
      lines: ["宝具", "黄金鹿与暴风夜", "73", "13", "[真名解放]"],
    });

    expect(artifact.fields.numericSlots).toEqual([7, 13]);
    expect(artifact.text.cardName).toBe("黄金鹿与暴风夜");
  });
});
