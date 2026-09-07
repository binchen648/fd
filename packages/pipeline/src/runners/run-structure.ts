import type { StructuringRequest, StructuringResponse } from "@fd/contracts";
import { artifactPath, toFileStem, writeJsonArtifact, writeLogArtifact } from "..";
import { normalizePipelineError } from "../errors";
import { repairStructureResponse } from "../repair/structure";
import { validateStructureResponse } from "../validators";
import { createRunnerContext } from "./context";

export async function runStructure(
  configPath: string,
  request: StructuringRequest,
  namespace: string,
  fileStem: string,
): Promise<StructuringResponse> {
  await writeLogArtifact("structure", request.jobId, "request", request);
  const ctx = await createRunnerContext(configPath);

  if (!ctx.provider.runStructure) {
    const error = new Error("Provider does not support runStructure");
    await writeLogArtifact("structure", request.jobId, "error", { message: error.message });
    throw error;
  }

  try {
    const rawResponse = await ctx.provider.runStructure(request);
    const repairedResponse = repairStructureResponse(
      rawResponse,
      request.jobId,
      request.provider.name,
      request.provider.model,
    );
    const response = validateStructureResponse(repairedResponse ?? rawResponse);
    await writeJsonArtifact(artifactPath("structured", namespace, fileStem), response);
    await writeLogArtifact("structure", request.jobId, "response", response);
    return response;
  } catch (error) {
    const wrapped = normalizePipelineError(error, "structure");
    await writeLogArtifact("structure", request.jobId, "error", {
      message: wrapped.message,
      code: wrapped.code,
      details: wrapped.details,
    });
    throw wrapped;
  }
}

export function defaultStructureFileStem(visionResultPath: string): string {
  return toFileStem(visionResultPath);
}
