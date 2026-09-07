import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

interface ScenarioMatrixConfig {
  generatedScenarioDirs?: string[];
  scenarios: Array<{
    label: string;
    baselinePath: string;
    candidatePath: string;
    expectedIdentical: boolean;
  }>;
}

describe("scenario matrix config", () => {
  it("defines the extracted matrix and includes default-map-without-moon coverage", () => {
    const config = JSON.parse(
      readFileSync(join(__dirname, "../../../../config/scenario-matrix.config.json"), "utf8"),
    ) as ScenarioMatrixConfig;

    expect(config.scenarios).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "minimal-seeded-self",
          expectedIdentical: true,
        }),
        expect.objectContaining({
          label: "default-map-without-moon-self",
          baselinePath: expect.stringContaining("default-map-without-moon.json"),
          candidatePath: expect.stringContaining("default-map-without-moon.json"),
          expectedIdentical: true,
        }),
        expect.objectContaining({
          label: "moon-threshold-divergent-002",
          expectedIdentical: false,
        }),
        expect.objectContaining({
          label: "climax-situation-card-self",
          baselinePath: expect.stringContaining("climax-situation-card.json"),
          candidatePath: expect.stringContaining("climax-situation-card.json"),
          expectedIdentical: true,
        }),
      ]),
    );

    expect(config.generatedScenarioDirs).toEqual([
      "D:\\fd\\data\\staged\\generated-scenarios",
    ]);
  });
});
