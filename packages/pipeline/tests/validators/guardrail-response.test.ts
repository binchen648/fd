import { describe, expect, it } from "vitest";

import { validateGuardrailResponse } from "../../src/validators/guardrail-response.ts";

function createValidResponse() {
  return {
    jobId: "guardrail-0001",
    artifactVersion: "guardrail-response-v1",
    status: "approve",
    schemaOk: true,
    engineOk: true,
    decision: "approve",
    ambiguityLevel: "low",
    coverageReport: {
      originalClauses: 1,
      missingClauses: 0,
    },
    issues: [],
    requiredHumanReview: false,
    smokeTests: [
      {
        name: "gain_mana_on_enter_miyama",
        setup: "player enters Miyama Town",
        expect: "player mana +1",
        source: "model",
      },
    ],
    source: {
      structureJobId: "structure-0001",
      provider: "siliconflow",
      model: "Qwen/Qwen3-VL-32B-Thinking",
    },
  };
}

describe("validateGuardrailResponse", () => {
  it("accepts a well-formed approve response", () => {
    expect(validateGuardrailResponse(createValidResponse()).decision).toBe("approve");
  });

  it("rejects unsupported ambiguity levels", () => {
    const response = createValidResponse();
    response.ambiguityLevel = "unclear";

    expect(() => validateGuardrailResponse(response)).toThrow(/ambiguityLevel/);
  });

  it("rejects inconsistent decision and status values", () => {
    const response = createValidResponse();
    response.status = "approve";
    response.decision = "reject";

    expect(() => validateGuardrailResponse(response)).toThrow(/decision/);
  });

  it("requires human review when decision is review", () => {
    const response = createValidResponse();
    response.status = "review";
    response.decision = "review";
    response.requiredHumanReview = false;

    expect(() => validateGuardrailResponse(response)).toThrow(/requiredHumanReview/);
  });

  it("rejects smoke tests with unsupported source tags", () => {
    const response = createValidResponse();
    response.smokeTests[0]!.source = "manual";

    expect(() => validateGuardrailResponse(response)).toThrow(/smokeTests\[0\]\.source/);
  });
});
