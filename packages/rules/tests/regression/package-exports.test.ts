import { describe, expect, it } from "vitest";

import { collectTriggeredAbilities, createReplayLog, replayFromLog, simulateSeededMatch } from "../../src/index";

describe("rules package exports", () => {
  it("exports seeded simulation and replay helpers", () => {
    expect(typeof simulateSeededMatch).toBe("function");
    expect(typeof createReplayLog).toBe("function");
    expect(typeof replayFromLog).toBe("function");
    expect(typeof collectTriggeredAbilities).toBe("function");
  });

  it("exports the Phase 3A resolution data-flow subpath", async () => {
    const dataflow = await import("@fd/rules/ability-resolution-dataflow");

    expect(typeof dataflow.executeResolution).toBe("function");
    expect(typeof dataflow.validateResolutionDataFlow).toBe("function");
  });
});
