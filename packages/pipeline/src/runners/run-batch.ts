import type {
  BatchArtifactResult,
  BatchRequest,
  BatchResponse,
  SampleCardManifest,
} from "@fd/contracts";
import { readJsonArtifact, writeLogArtifact, withRetries } from "..";
import { normalizePipelineError } from "../errors";
import {
  buildGuardrailRequestFromManifest,
  buildStructureRequestFromManifest,
  buildVisionRequestFromManifest,
} from "../request-builders";
import { runGuardrail } from "./run-guardrail";
import { runStructure } from "./run-structure";
import { runVision } from "./run-vision";
import { toFileStem } from "../file-stems";
import { validateSampleManifest } from "../validators";

export async function runBatch(configPath: string, request: BatchRequest): Promise<BatchResponse> {
  await writeLogArtifact("batch", request.jobId, "request", request);
  const artifacts: BatchArtifactResult[] = [];
  let approved = 0;
  let reviewRequired = 0;
  let rejected = 0;

  for (const manifestPath of request.inputs) {
    const manifest = validateSampleManifest(await readJsonArtifact<SampleCardManifest>(manifestPath));

    for (const item of manifest.items) {
      const fileStem = toFileStem(item.imagePath);
      const maxAttempts = request.retryPolicy?.maxAttempts ?? 1;
      const backoffMs = request.retryPolicy?.backoffMs ?? 0;

      try {
        const visionRequest = buildVisionRequestFromManifest(item);
        if (request.timeoutOverridesMs?.vision !== undefined) {
          visionRequest.provider = {
            ...visionRequest.provider,
            timeoutMs: request.timeoutOverridesMs.vision,
          };
        }
        const visionStep = request.retryPolicy?.retryableStages?.includes("vision")
          ? await withRetries(() => runVision(configPath, visionRequest), maxAttempts, "vision", backoffMs)
          : { result: await runVision(configPath, visionRequest), attempts: 1 };
        const visionResponse = visionStep.result;

        const structureRequest = buildStructureRequestFromManifest(item);
        if (request.timeoutOverridesMs?.structure !== undefined) {
          structureRequest.provider = {
            ...structureRequest.provider,
            timeoutMs: request.timeoutOverridesMs.structure,
          };
        }
        const structureStep = request.retryPolicy?.retryableStages?.includes("structure")
          ? await withRetries(
              () => runStructure(configPath, structureRequest, item.targetNamespace, fileStem),
              maxAttempts,
              "structure",
              backoffMs,
            )
          : {
              result: await runStructure(configPath, structureRequest, item.targetNamespace, fileStem),
              attempts: 1,
            };
        const structureResponse = structureStep.result;

        const guardrailRequest = buildGuardrailRequestFromManifest(item);
        if (request.timeoutOverridesMs?.guardrail !== undefined) {
          guardrailRequest.provider = {
            ...guardrailRequest.provider,
            timeoutMs: request.timeoutOverridesMs.guardrail,
          };
        }
        const guardrailStep = request.retryPolicy?.retryableStages?.includes("guardrail")
          ? await withRetries(
              () => runGuardrail(configPath, guardrailRequest, item.targetNamespace, fileStem),
              maxAttempts,
              "guardrail",
              backoffMs,
            )
          : {
              result: await runGuardrail(configPath, guardrailRequest, item.targetNamespace, fileStem),
              attempts: 1,
            };
        const guardrailResponse = guardrailStep.result;

        const finalState =
          guardrailResponse.decision === "approve"
            ? "approved"
            : guardrailResponse.decision === "review"
              ? "review_required"
              : "rejected";

        if (finalState === "approved") approved += 1;
        if (finalState === "review_required") reviewRequired += 1;
        if (finalState === "rejected") rejected += 1;

        artifacts.push({
          input: item.imagePath,
          finalState,
          attempts: Math.max(visionStep.attempts, structureStep.attempts, guardrailStep.attempts),
          visionPath: structureRequest.input.visionResultPath,
          structurePath: guardrailRequest.input.structureResultPath,
          guardrailPath: guardrailRequest.input.structureResultPath.replace("\\structured\\", "\\guardrail\\"),
        });
      } catch (error) {
        artifacts.push({
          input: item.imagePath,
          finalState: "error",
          attempts: maxAttempts,
          errorCode: normalizePipelineError(error, "batch").code,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        if (request.failurePolicy === "stop_on_error") {
          const result: BatchResponse = {
            jobId: request.jobId,
            artifactVersion: "batch-response-v1",
            status: "error",
            summary: {
              total: artifacts.length,
              approved,
              reviewRequired,
              rejected,
            },
            artifacts,
            errorMessage: error instanceof Error ? error.message : String(error),
          };
          await writeLogArtifact("batch", request.jobId, "error", result);
          return result;
        }
      }
    }
  }

  const result: BatchResponse = {
    jobId: request.jobId,
    artifactVersion: "batch-response-v1",
    status: approved + reviewRequired + rejected === artifacts.length ? "ok" : "partial_success",
    summary: {
      total: artifacts.length,
      approved,
      reviewRequired,
      rejected,
    },
    artifacts,
  };
  await writeLogArtifact("batch", request.jobId, "response", result);
  return result;
}
