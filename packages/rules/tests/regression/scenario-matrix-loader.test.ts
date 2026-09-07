import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadScenarioMatrix } from "../../src/index";

describe("scenario matrix loader", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("merges generated scenario directories into self-compare matrix entries", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "fd-scenario-matrix-"));
    tempDirs.push(rootDir);

    const generatedDir = join(rootDir, "generated", "master_skill");
    mkdirSync(generatedDir, { recursive: true });

    const generatedScenarioPath = join(generatedDir, "sample-card--base-smoke.json");
    writeFileSync(
      generatedScenarioPath,
      JSON.stringify({ id: "smoke-test-001", seed: "smoke-seed-001", initialState: {}, steps: [] }),
      "utf8",
    );

    const configPath = join(rootDir, "scenario-matrix.config.json");
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          scenarios: [
            {
              label: "static-self",
              baselinePath: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\minimal-7p-seeded-scenario.json",
              candidatePath: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\minimal-7p-seeded-scenario.json",
              expectedIdentical: true,
            },
          ],
          generatedScenarioDirs: [join(rootDir, "generated")],
        },
        null,
        2,
      ),
      "utf8",
    );

    const matrix = await loadScenarioMatrix(configPath);

    expect(matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "static-self",
          expectedIdentical: true,
        }),
        expect.objectContaining({
          label: "generated-master-skill-sample-card-base-smoke-self",
          baselinePath: generatedScenarioPath,
          candidatePath: generatedScenarioPath,
          expectedIdentical: true,
        }),
      ]),
    );
  });

  it("prefers generated manifest baseline-candidate entries over derived self-check entries", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "fd-scenario-matrix-manifest-"));
    tempDirs.push(rootDir);

    const generatedDir = join(rootDir, "generated", "event");
    mkdirSync(generatedDir, { recursive: true });

    const generatedScenarioPath = join(generatedDir, "sample-card--base-smoke.json");
    writeFileSync(
      generatedScenarioPath,
      JSON.stringify({ id: "smoke-test-002", seed: "smoke-seed-002", initialState: {}, steps: [] }),
      "utf8",
    );

    const manifestPath = join(generatedDir, "sample-card.matrix.json");
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          comparisons: [
            {
              label: "generated-event-sample-card-base-smoke-candidate",
              baselinePath: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\shinto-hidden-event-scenario.json",
              candidatePath: generatedScenarioPath,
              expectedIdentical: false,
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    const configPath = join(rootDir, "scenario-matrix.config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ scenarios: [], generatedScenarioDirs: [join(rootDir, "generated")] }, null, 2),
      "utf8",
    );

    const matrix = await loadScenarioMatrix(configPath);

    expect(matrix).toEqual([
      {
        label: "generated-event-sample-card-base-smoke-candidate",
        baselinePath: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\shinto-hidden-event-scenario.json",
        candidatePath: generatedScenarioPath,
        expectedIdentical: false,
      },
    ]);
  });
});
