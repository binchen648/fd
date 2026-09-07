import type { VisionRequest, VisionResponse } from "@fd/contracts";
import { artifactPath, toFileStem, toNamespace, writeJsonArtifact, writeLogArtifact } from "..";
import { normalizePipelineError } from "../errors";
import { maybeWriteMasterMainCardArtifact } from "../master-main-card-postprocess";
import { repairVisionResponse } from "../repair/vision";
import { validateVisionResponse } from "../validators";
import { maybeWriteServantRecognitionBundle } from "../servant-main-card-postprocess";
import { createRunnerContext } from "./context";

export async function runVision(configPath: string, request: VisionRequest): Promise<VisionResponse> {
  await writeLogArtifact("vision", request.jobId, "request", request);
  const ctx = await createRunnerContext(configPath);

  if (!ctx.provider.runVision) {
    const error = new Error("Provider does not support runVision");
    await writeLogArtifact("vision", request.jobId, "error", { message: error.message });
    throw error;
  }

  try {
    const rawResponse = await ctx.provider.runVision(request);
    const repairedResponse = repairVisionResponse(
      rawResponse,
      request.jobId,
      request.provider.name,
      request.provider.model,
    );
    const response = validateVisionResponse(repairedResponse ?? rawResponse);
    const fileStem = toFileStem(request.input.imagePath);
    const namespace = toNamespace(request.input.sourceSet, request.input.familyHint);
    await writeJsonArtifact(artifactPath("ocr", namespace, fileStem), response);
    const recognitionBundlePath = await maybeWriteServantRecognitionBundle({ request, response });
    const masterMainCardPath = await maybeWriteMasterMainCardArtifact({ request, response });
    await writeLogArtifact("vision", request.jobId, "response", {
      ...response,
      ...(recognitionBundlePath ? { recognitionBundlePath } : {}),
      ...(masterMainCardPath ? { masterMainCardPath } : {}),
    });
    return response;
  } catch (error) {
    const wrapped = normalizePipelineError(error, "vision");
    await writeLogArtifact("vision", request.jobId, "error", {
      message: wrapped.message,
      code: wrapped.code,
      details: wrapped.details,
    });
    throw wrapped;
  }
}
