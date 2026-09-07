import type { StructuringResponse } from "@fd/contracts";
import { assertArray, assertObject, assertString } from "./assert";

export function validateStructureResponse(input: unknown): StructuringResponse {
  assertObject(input, "structure response");
  assertString(input.jobId, "jobId");
  assertString(input.artifactVersion, "artifactVersion");
  assertString(input.status, "status");

  assertObject(input.card, "card");
  assertString(input.card.id, "card.id");
  assertString(input.card.name, "card.name");
  assertString(input.card.cardType, "card.cardType");
  assertArray(input.card.timing, "card.timing");
  assertArray(input.card.conditions, "card.conditions");
  assertArray(input.card.targets, "card.targets");
  assertArray(input.card.effects, "card.effects");
  assertArray(input.card.tags, "card.tags");
  assertArray(input.card.ambiguities, "card.ambiguities");

  assertArray(input.parseNotes, "parseNotes");
  assertObject(input.coverage, "coverage");
  assertObject(input.source, "source");
  assertString(input.source.visionJobId, "source.visionJobId");

  input.card.timing.forEach((timing, index) => {
    assertString(timing, `card.timing.${index}`);
  });
  input.card.conditions.forEach((condition, index) => {
    assertObject(condition, `card.conditions.${index}`);
    assertString(condition.type, `card.conditions.${index}.type`);
  });
  input.card.targets.forEach((target, index) => {
    assertObject(target, `card.targets.${index}`);
    assertString(target.type, `card.targets.${index}.type`);
  });
  input.card.effects.forEach((effect, index) => {
    assertObject(effect, `card.effects.${index}`);
    assertString(effect.type, `card.effects.${index}.type`);
  });
  input.card.tags.forEach((tag, index) => {
    assertString(tag, `card.tags.${index}`);
  });
  input.parseNotes.forEach((note, index) => {
    assertString(note, `parseNotes.${index}`);
  });

  return input as unknown as StructuringResponse;
}
