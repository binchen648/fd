import { describe, expect, it } from "vitest";

import type { VisionRequest } from "@fd/contracts";
import { buildVisionMessages } from "../src/prompts";

describe("vision prompt", () => {
  it("injects servant fixed-layout extraction rules when requested", () => {
    const request: VisionRequest = {
      jobId: "vision-servant-layout-test",
      artifactVersion: "vision-request-v1",
      input: {
        imagePath: "D:/fd/chm-extract/图包/test.png",
        sourceSet: "servant",
        familyHint: "caster",
        layoutHint: "servant-fixed-layout-v1",
        language: "zh-CN",
      },
      provider: {
        name: "siliconflow",
        model: "Qwen/Qwen3-VL-32B-Thinking",
        mode: "accuracy",
      },
    };

    const messages = buildVisionMessages(request, "data:image/png;base64,abc");
    expect(messages[0]?.content).toContain("card layout directed recognition agent");
    expect(messages[0]?.content).toContain("mana_cost is the digit inside the green circular region");
    expect(messages[0]?.content).toContain("attack_power is the digit next to the blue attack marker");
  });
});
