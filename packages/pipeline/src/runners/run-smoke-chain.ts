import type {
  GuardrailRequest,
  StructuringRequest,
  VisionRequest,
  VisionResponse,
  StructuringResponse,
  GuardrailResponse,
} from "@fd/contracts";
import { artifactPath, readJsonArtifact, toFileStem, toNamespace } from "..";
import { runGuardrail } from "./run-guardrail";
import { runStructure } from "./run-structure";
import { runVision } from "./run-vision";

export interface SmokeChainInput {
  configPath: string;
  visionRequest: VisionRequest;
  structureRequestFactory: (vision: VisionResponse, visionResultPath: string) => StructuringRequest;
  guardrailRequestFactory: (args: {
    vision: VisionResponse;
    structured: StructuringResponse;
    visionResultPath: string;
    structureResultPath: string;
  }) => GuardrailRequest;
}

export interface SmokeChainResult {
  namespace: string;
  fileStem: string;
  visionResultPath: string;
  structureResultPath: string;
  guardrailResultPath: string;
  vision: VisionResponse;
  structured: StructuringResponse;
  guardrail: GuardrailResponse;
}

export async function runSmokeChain(input: SmokeChainInput): Promise<SmokeChainResult> {
  const fileStem = toFileStem(input.visionRequest.input.imagePath);
  const namespace = toNamespace(input.visionRequest.input.sourceSet, input.visionRequest.input.familyHint);

  const vision = await runVision(input.configPath, input.visionRequest);
  const visionResultPath = artifactPath("ocr", namespace, fileStem);
  const structureRequest = input.structureRequestFactory(vision, visionResultPath);
  const structured = await runStructure(input.configPath, structureRequest, namespace, fileStem);
  const structureResultPath = artifactPath("structured", namespace, fileStem);
  const guardrailRequest = input.guardrailRequestFactory({
    vision,
    structured,
    visionResultPath,
    structureResultPath,
  });
  const guardrail = await runGuardrail(input.configPath, guardrailRequest, namespace, fileStem);
  const guardrailResultPath = artifactPath("guardrail", namespace, fileStem);

  return {
    namespace,
    fileStem,
    visionResultPath,
    structureResultPath,
    guardrailResultPath,
    vision,
    structured,
    guardrail,
  };
}

export async function readSmokeArtifacts<T1, T2, T3>(paths: {
  visionResultPath: string;
  structureResultPath: string;
  guardrailResultPath: string;
}): Promise<{ vision: T1; structured: T2; guardrail: T3 }> {
  const vision = await readJsonArtifact<T1>(paths.visionResultPath);
  const structured = await readJsonArtifact<T2>(paths.structureResultPath);
  const guardrail = await readJsonArtifact<T3>(paths.guardrailResultPath);

  return { vision, structured, guardrail };
}
