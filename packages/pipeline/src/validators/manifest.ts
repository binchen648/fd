import type { SampleCardManifest } from "@fd/contracts";
import { assert, assertArray, assertObject, assertString } from "./assert";

function validateManifestItem(input: unknown, index: number): void {
  assertObject(input, `manifest.items[${index}]`);
  assertString(input.id, `manifest.items[${index}].id`);
  assertString(input.imagePath, `manifest.items[${index}].imagePath`);
  assertString(input.sourceSet, `manifest.items[${index}].sourceSet`);
  assertString(input.language, `manifest.items[${index}].language`);
  assertString(input.targetNamespace, `manifest.items[${index}].targetNamespace`);

  if (input.sourcePage !== undefined) {
    assertString(input.sourcePage, `manifest.items[${index}].sourcePage`);
  }
  if (input.familyHint !== undefined) {
    assertString(input.familyHint, `manifest.items[${index}].familyHint`);
  }
  if (input.layoutHint !== undefined) {
    assertString(input.layoutHint, `manifest.items[${index}].layoutHint`);
  }
  if (input.tags !== undefined) {
    assertArray(input.tags, `manifest.items[${index}].tags`);
  }
}

export function validateSampleManifest(input: unknown): SampleCardManifest {
  assertObject(input, "manifest");
  assert(input.manifestVersion === "sample-manifest-v1", "manifest.manifestVersion must be 'sample-manifest-v1'");
  assertString(input.name, "manifest.name");
  assertArray(input.items, "manifest.items");

  input.items.forEach((item, index) => validateManifestItem(item, index));

  return input as unknown as SampleCardManifest;
}
