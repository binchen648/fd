import { describe, expect, it } from "vitest";

import {
  buildAgentProviderSelection,
  buildGuardrailRequestFromManifest,
  buildStructureRequestFromManifest,
  buildVisionRequestFromManifest,
  providerDefaultsFromConfig,
} from "../src/request-builders";

describe("request builders", () => {
  it("omits undefined optional vision input fields", () => {
    const request = buildVisionRequestFromManifest({
      id: "sample-1",
      imagePath: "data/raw/cards/master/sample.png",
      sourceSet: "master",
      language: "zh-CN",
      targetNamespace: "master",
    });

    expect(request.input).not.toHaveProperty("sourcePage");
    expect(request.input).not.toHaveProperty("familyHint");
    expect(request.input).not.toHaveProperty("layoutHint");
  });

  it("routes structure and guardrail vision inputs through the OCR namespace derived from familyHint", () => {
    const item = {
      id: "event-synergy-001",
      imagePath: "D:/output/fd_chm_extract/ScreenShot_2025-10-27_203404_003.png",
      sourceSet: "event",
      familyHint: "event_card",
      language: "zh-CN",
      targetNamespace: "event",
    };

    const structureRequest = buildStructureRequestFromManifest(item);
    const guardrailRequest = buildGuardrailRequestFromManifest(item);

    expect(structureRequest.input.visionResultPath.replace(/\\/g, "/")).toContain("data/staged/ocr/event_card/");
    expect(guardrailRequest.input.visionResultPath.replace(/\\/g, "/")).toContain("data/staged/ocr/event_card/");
    expect(guardrailRequest.input.structureResultPath.replace(/\\/g, "/")).toContain("data/staged/structured/event/");
  });

  it("threads manifest family hints into structure requests for downstream prompt guidance", () => {
    const structureRequest = buildStructureRequestFromManifest({
      id: "servant-bb-001",
      imagePath: "D:/output/fd_chm_extract/cards/bb.png",
      sourceSet: "servant",
      familyHint: "servant_skill",
      language: "zh-CN",
      targetNamespace: "servant",
    });

    expect(structureRequest.input).toMatchObject({
      targetNamespace: "servant",
      familyHint: "servant_skill",
    });
  });

  it("derives provider selections from runtime config instead of hardcoded model names", () => {
    const defaults = providerDefaultsFromConfig({
      provider: "siliconflow",
      baseUrl: "https://api.siliconflow.cn/v1",
      models: {
        vision: "vision-live-model",
        structure: "structure-live-model",
        review: "review-live-model",
      },
      auth: {
        apiKeyFile: "D:/fd/api_key.txt",
      },
      timeouts: {
        visionMs: 111000,
        structureMs: 222000,
        reviewMs: 333000,
      },
    });

    expect(buildAgentProviderSelection("vision", "accuracy", defaults)).toEqual({
      name: "siliconflow",
      model: "vision-live-model",
      mode: "accuracy",
      timeoutMs: 111000,
    });

    expect(buildAgentProviderSelection("structure", "accuracy", defaults)).toEqual({
      name: "siliconflow",
      model: "structure-live-model",
      mode: "accuracy",
      timeoutMs: 222000,
    });

    expect(buildAgentProviderSelection("guardrail", "review", defaults)).toEqual({
      name: "siliconflow",
      model: "review-live-model",
      mode: "review",
      timeoutMs: 333000,
    });
  });
});
