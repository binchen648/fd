import { describe, expect, it } from "vitest";

import { mergeSourceRef } from "../src/source-ref";

describe("mergeSourceRef", () => {
  it("omits requestId when it is undefined", () => {
    const merged = mergeSourceRef(
      {
        imagePath: "data/raw/cards/master/sample.png",
      },
      {
        provider: "siliconflow",
        model: "vision-model",
      },
    );

    expect(merged).not.toHaveProperty("requestId");
    expect(merged.provider).toBe("siliconflow");
  });

  it("includes requestId when it is present", () => {
    const merged = mergeSourceRef(
      {
        imagePath: "data/raw/cards/master/sample.png",
      },
      {
        provider: "siliconflow",
        model: "vision-model",
        requestId: "req-123",
      },
    );

    expect(merged.requestId).toBe("req-123");
  });

  it("ignores non-object runtime source payloads", () => {
    const merged = mergeSourceRef("间桐慎二.htm" as never, {
      provider: "siliconflow",
      model: "vision-model",
    });

    expect(merged).toEqual({
      provider: "siliconflow",
      model: "vision-model",
    });
  });
});
