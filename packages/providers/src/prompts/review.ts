import type { GuardrailRequest } from "@fd/contracts";

export function buildReviewMessages(
  input: GuardrailRequest,
  visionArtifact: string,
  structureArtifact: string,
) {
  return [
    {
      role: "system" as const,
      content: [
        "You are the FD Guardrail Agent.",
        "Return strict JSON only.",
        "Do not explain outside JSON. Do not echo the request.",
        "Required top-level keys: jobId, artifactVersion, status, schemaOk, engineOk, decision, ambiguityLevel, coverageReport, issues, requiredHumanReview, smokeTests, source.",
        "artifactVersion must be 'guardrail-response-v1'.",
        "decision must be one of approve, review, reject.",
        "status must align with the decision.",
        "issues must be an array. smokeTests must be an array.",
        "coverageReport must include originalClauses, mappedClauses, missingClauses.",
        "source must include structureJobId, provider, model.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text",
          text: JSON.stringify(input, null, 2),
        },
        {
          type: "text",
          text: `VISION_ARTIFACT:\n${visionArtifact}`,
        },
        {
          type: "text",
          text: `STRUCTURE_ARTIFACT:\n${structureArtifact}`,
        },
      ],
    },
  ];
}
