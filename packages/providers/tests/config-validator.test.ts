import { describe, expect, it } from "vitest";

import { validateProviderConfig } from "../src/config-validator";

describe("provider config validator", () => {
  it("accepts a valid provider runtime config", () => {
    const result = validateProviderConfig({
      provider: "siliconflow",
      baseUrl: "https://api.siliconflow.cn/v1",
      models: {
        vision: "vision-model",
        structure: "structure-model",
        review: "review-model",
      },
      auth: {
        apiKeyFile: "D:/fd/api_key.txt",
      },
      timeouts: {
        visionMs: 1000,
        structureMs: 1000,
        reviewMs: 1000,
      },
    });

    expect(result.provider).toBe("siliconflow");
  });

  it("rejects configs missing required timeout fields", () => {
    expect(() =>
      validateProviderConfig({
        provider: "siliconflow",
        baseUrl: "https://api.siliconflow.cn/v1",
        models: {
          vision: "vision-model",
          structure: "structure-model",
          review: "review-model",
        },
        auth: {
          apiKeyFile: "D:/fd/api_key.txt",
        },
        timeouts: {
          visionMs: 1000,
          structureMs: 1000,
        },
      }),
    ).toThrow(/timeouts.reviewMs/);
  });
});
