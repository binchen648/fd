import type { GuardrailResponse } from "@fd/contracts";
import { assert, assertArray, assertBoolean, assertObject, assertString } from "./assert";

const guardrailStatuses: readonly string[] = ["approve", "review", "reject", "error"];
const reviewDecisions: readonly string[] = ["approve", "review", "reject"];
const ambiguityLevels: readonly string[] = ["low", "medium", "high"];
const smokeTestSources: readonly string[] = ["model", "capability"];

export function validateGuardrailResponse(input: unknown): GuardrailResponse {
  assertObject(input, "guardrail response");
  assertString(input.jobId, "jobId");
  assert(input.artifactVersion === "guardrail-response-v1", "artifactVersion must be 'guardrail-response-v1'");
  assertString(input.status, "status");
  assert(
    guardrailStatuses.includes(input.status),
    "status must be one of approve, review, reject, error",
  );
  assertBoolean(input.schemaOk, "schemaOk");
  assertBoolean(input.engineOk, "engineOk");
  assertString(input.decision, "decision");
  assert(
    reviewDecisions.includes(input.decision),
    "decision must be one of approve, review, reject",
  );
  assertString(input.ambiguityLevel, "ambiguityLevel");
  assert(
    ambiguityLevels.includes(input.ambiguityLevel),
    "ambiguityLevel must be one of low, medium, high",
  );
  assertObject(input.coverageReport, "coverageReport");
  assertArray(input.issues, "issues");
  assertBoolean(input.requiredHumanReview, "requiredHumanReview");
  assertArray(input.smokeTests, "smokeTests");
  assertObject(input.source, "source");
  assertString(input.source.structureJobId, "source.structureJobId");

  assert(input.status === input.decision || input.status === "error", "decision must match status unless status is error");

  if (input.decision === "review") {
    assert(input.requiredHumanReview, "requiredHumanReview must be true when decision is review");
  }

  if (input.decision === "approve") {
    assert(input.schemaOk, "schemaOk must be true when decision is approve");
    assert(input.engineOk, "engineOk must be true when decision is approve");
    assert(!input.requiredHumanReview, "requiredHumanReview must be false when decision is approve");
  }

  input.smokeTests.forEach((smokeTest, index) => {
    assertObject(smokeTest, `smokeTests[${index}]`);
    assertString(smokeTest.name, `smokeTests[${index}].name`);
    assertString(smokeTest.setup, `smokeTests[${index}].setup`);
    assertString(smokeTest.expect, `smokeTests[${index}].expect`);
    assertString(smokeTest.source, `smokeTests[${index}].source`);
    assert(
      smokeTestSources.includes(smokeTest.source),
      `smokeTests[${index}].source must be one of model, capability`,
    );
  });

  return input as unknown as GuardrailResponse;
}
