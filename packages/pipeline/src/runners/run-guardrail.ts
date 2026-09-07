import type { GuardrailRequest, GuardrailResponse } from "@fd/contracts";
import { artifactPath, writeJsonArtifact, writeLogArtifact } from "..";
import { normalizePipelineError } from "../errors";
import { repairGuardrailResponse } from "../repair/guardrail";
import { repairStructureResponse } from "../repair/structure";
import { readJsonArtifact } from "../artifacts";
import { validateGuardrailResponse, validateStructureResponse } from "../validators";
import {
  applyCapabilityAssessmentToGuardrail,
  assertSupportedEngineCapabilityVersion,
  evaluateStructuredCardCapability,
} from "./guardrail-preflight";
import { createRunnerContext } from "./context";

export async function runGuardrail(
  configPath: string,
  request: GuardrailRequest,
  namespace: string,
  fileStem: string,
): Promise<GuardrailResponse> {
  await writeLogArtifact("guardrail", request.jobId, "request", request);

  try {
    assertSupportedEngineCapabilityVersion(request.input.engineCapabilityVersion);
  } catch (error) {
    await writeLogArtifact("guardrail", request.jobId, "error", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const rawStructuredArtifact = await readJsonArtifact(request.input.structureResultPath);
  const structuredArtifact = validateStructureResponse(
    repairStructureResponse(
      rawStructuredArtifact,
      request.jobId.replace(/^guardrail-/, "structure-"),
      request.provider.name,
      request.provider.model,
    ) ?? rawStructuredArtifact,
  );
  const capabilityAssessment = evaluateStructuredCardCapability(structuredArtifact.card);

  const ctx = await createRunnerContext(configPath);

  if (!ctx.provider.runReview) {
    const error = new Error("Provider does not support runReview");
    await writeLogArtifact("guardrail", request.jobId, "error", { message: error.message });
    throw error;
  }

  let rawResponse: unknown;
  try {
    rawResponse = await ctx.provider.runReview(request);
    const repairedResponse = repairGuardrailResponse(
      rawResponse,
      request.jobId,
      request.provider.name,
      request.provider.model,
    );
    const response = applyCapabilityAssessmentToGuardrail(
      validateGuardrailResponse(repairedResponse ?? rawResponse),
      capabilityAssessment,
    );
    await writeJsonArtifact(artifactPath("guardrail", namespace, fileStem), response);
    await writeLogArtifact("guardrail", request.jobId, "response", response);
    return response;
  } catch (error) {
    const wrapped = normalizePipelineError(error, "guardrail");
    await writeLogArtifact("guardrail", request.jobId, "error", {
      message: wrapped.message,
      code: wrapped.code,
      details: wrapped.details,
      rawResponse,
    });
    throw wrapped;
  }
}
