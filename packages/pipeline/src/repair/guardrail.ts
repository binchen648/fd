import type { GuardrailResponse, SmokeTestSuggestion } from "@fd/contracts";

export function repairGuardrailResponse(
  input: unknown,
  requestJobId: string,
  provider: string,
  model: string,
): GuardrailResponse | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }

  const record = input as Record<string, unknown>;
  if (record.decision === "review") {
    const reason = typeof record.reason === "string" ? record.reason : "Model returned a minimal review response.";

    return {
      jobId: requestJobId,
      artifactVersion: "guardrail-response-v1",
      status: "review",
      schemaOk: false,
      engineOk: false,
      decision: "review",
      ambiguityLevel: "medium",
      coverageReport: {
        originalClauses: 0,
        mappedClauses: 0,
        missingClauses: 0,
      },
      issues: [
        {
          code: "MODEL_RETURNED_MINIMAL_REVIEW",
          severity: "warning",
          message: reason,
        },
      ],
      requiredHumanReview: true,
      smokeTests: [],
      source: {
        structureJobId: requestJobId.replace(/^guardrail-/, "structure-"),
        provider,
        model,
      },
    };
  }

  if (
    typeof record.jobId === "string" &&
    record.artifactVersion === "guardrail-response-v1" &&
    typeof record.decision === "string"
  ) {
    const decision =
      record.decision === "approve" || record.decision === "review" || record.decision === "reject"
        ? record.decision
        : "review";

    const rawCoverage = typeof record.coverageReport === "object" && record.coverageReport !== null
      ? (record.coverageReport as Record<string, unknown>)
      : {};

    const smokeTests: SmokeTestSuggestion[] = Array.isArray(record.smokeTests)
      ? record.smokeTests.map((entry, index): SmokeTestSuggestion => {
          if (typeof entry === "string") {
            return {
              name: `auto_smoke_${index + 1}`,
              setup: entry,
              expect: entry,
              source: "model",
            };
          }

          if (typeof entry === "object" && entry !== null) {
            const recordEntry = entry as Record<string, unknown>;

            return {
              name:
                typeof recordEntry.name === "string"
                  ? recordEntry.name
                  : `auto_smoke_${index + 1}`,
              setup:
                typeof recordEntry.setup === "string"
                  ? recordEntry.setup
                  : "Review generated smoke test",
              expect:
                typeof recordEntry.expect === "string"
                  ? recordEntry.expect
                  : "Review generated smoke test",
              source:
                recordEntry.source === "capability" || recordEntry.source === "model"
                  ? recordEntry.source
                  : "model",
            };
          }

          return {
            name: `auto_smoke_${index + 1}`,
            setup: "Review generated smoke test",
            expect: String(entry),
            source: "model",
          };
        })
      : [];

    return {
      jobId: record.jobId,
      artifactVersion: "guardrail-response-v1",
      status:
        record.status === "approve" || record.status === "review" || record.status === "reject"
          ? record.status
          : decision,
      schemaOk: record.schemaOk === true,
      engineOk: record.engineOk === true,
      decision,
      ambiguityLevel:
        record.ambiguityLevel === "low" || record.ambiguityLevel === "medium" || record.ambiguityLevel === "high"
          ? record.ambiguityLevel
          : "medium",
      coverageReport: {
        originalClauses:
          typeof rawCoverage.originalClauses === "number" ? rawCoverage.originalClauses : 0,
        mappedClauses:
          typeof rawCoverage.mappedClauses === "number" ? rawCoverage.mappedClauses : 0,
        missingClauses:
          typeof rawCoverage.missingClauses === "number"
            ? rawCoverage.missingClauses
            : Array.isArray(rawCoverage.missingClauses)
              ? rawCoverage.missingClauses.length
              : 0,
      },
      issues: Array.isArray(record.issues) ? (record.issues as GuardrailResponse["issues"]) : [],
      requiredHumanReview:
        typeof record.requiredHumanReview === "boolean"
          ? record.requiredHumanReview
          : decision === "review",
      smokeTests,
      source:
        typeof record.source === "object" && record.source !== null
          ? {
              structureJobId:
                typeof (record.source as Record<string, unknown>).structureJobId === "string"
                  ? ((record.source as Record<string, unknown>).structureJobId as string)
                  : requestJobId.replace(/^guardrail-/, "structure-"),
              provider,
              model,
            }
          : {
              structureJobId: requestJobId.replace(/^guardrail-/, "structure-"),
              provider,
              model,
            },
    };
  }

  return null;
}
