import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { SampleCardManifest } from "@fd/contracts";
import { resolveRepositoryPath } from "../../../../scripts/project-paths";
import { validateSampleManifest } from "../../src/validators";

const SAMPLE_MANIFEST_PATH = resolveRepositoryPath("data", "manifests", "sample-cards.json");

function loadManifest(): SampleCardManifest {
  const raw = readFileSync(SAMPLE_MANIFEST_PATH, "utf8");
  return validateSampleManifest(JSON.parse(raw) as SampleCardManifest);
}

function countByTag(manifest: SampleCardManifest, tag: string): number {
  return manifest.items.filter((item) => item.tags?.includes(tag)).length;
}

describe("sample manifest representative coverage", () => {
  it("keeps the real-sample set in the 10-20 card representative range", () => {
    const manifest = loadManifest();

    expect(manifest.items.length).toBeGreaterThanOrEqual(10);
    expect(manifest.items.length).toBeLessThanOrEqual(20);
  });

  it("covers the minimum representative card categories for Window B validation", () => {
    const manifest = loadManifest();

    expect(countByTag(manifest, "sample:simple_master")).toBeGreaterThanOrEqual(2);
    expect(countByTag(manifest, "sample:complex_master")).toBeGreaterThanOrEqual(2);
    expect(countByTag(manifest, "sample:servant_timing_complex")).toBeGreaterThanOrEqual(2);
    expect(countByTag(manifest, "sample:event")).toBeGreaterThanOrEqual(2);
    expect(countByTag(manifest, "sample:situation")).toBeGreaterThanOrEqual(2);
    expect(countByTag(manifest, "sample:transform_or_replacement")).toBeGreaterThanOrEqual(1);
    expect(countByTag(manifest, "sample:hidden_or_reveal")).toBeGreaterThanOrEqual(1);
    expect(countByTag(manifest, "sample:moon_cancer")).toBeGreaterThanOrEqual(1);
  });
});
