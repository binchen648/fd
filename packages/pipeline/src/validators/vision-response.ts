import type { VisionResponse } from "@fd/contracts";
import { assertArray, assertNumber, assertObject, assertString } from "./assert";

export function validateVisionResponse(input: unknown): VisionResponse {
  assertObject(input, "vision response");
  assertString(input.jobId, "jobId");
  assertString(input.artifactVersion, "artifactVersion");
  assertString(input.status, "status");

  assertObject(input.classification, "classification");
  assertNumber(input.classification.familyConfidence, "classification.familyConfidence");

  assertObject(input.text, "text");
  assertString(input.text.cardName, "text.cardName");
  assertString(input.text.rawText, "text.rawText");
  assertString(input.text.normalizedText, "text.normalizedText");

  assertObject(input.fields, "fields");
  assertArray(input.fields.numericSlots, "fields.numericSlots");
  assertArray(input.fields.iconTags, "fields.iconTags");

  assertArray(input.blocks, "blocks");
  assertArray(input.uncertainSpans, "uncertainSpans");
  assertNumber(input.overallConfidence, "overallConfidence");
  assertObject(input.source, "source");

  return input as unknown as VisionResponse;
}
