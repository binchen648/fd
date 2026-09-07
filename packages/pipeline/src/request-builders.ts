import type {
  GuardrailRequest,
  ProviderRuntimeConfig,
  SampleCardManifestItem,
  StructuringRequest,
  VisionRequest,
} from "@fd/contracts";
import { artifactPath, toFileStem, toNamespace } from ".";

const DEFAULT_PROVIDER = "siliconflow";
const DEFAULT_MODELS = {
  vision: "Qwen/Qwen3-VL-235B-A22B-Thinking",
  structure: "Qwen/Qwen3-VL-235B-A22B-Thinking",
  review: "Qwen/Qwen3-VL-235B-A22B-Thinking",
} as const;

type ProviderStage = keyof typeof DEFAULT_MODELS;
type RequestBuilderStage = "vision" | "structure" | "guardrail";

const providerStageByRequestStage: Record<RequestBuilderStage, ProviderStage> = {
  vision: "vision",
  structure: "structure",
  guardrail: "review",
};

export interface RequestBuilderProviderDefaults {
  providerName?: string;
  models?: Partial<Record<ProviderStage, string>>;
  timeoutMs?: Partial<Record<ProviderStage, number>>;
}

export function providerDefaultsFromConfig(
  config: ProviderRuntimeConfig,
): RequestBuilderProviderDefaults {
  return {
    providerName: config.provider,
    models: {
      vision: config.models.vision,
      structure: config.models.structure,
      review: config.models.review,
    },
    timeoutMs: {
      vision: config.timeouts.visionMs,
      structure: config.timeouts.structureMs,
      review: config.timeouts.reviewMs,
    },
  };
}

export function buildAgentProviderSelection(
  stage: RequestBuilderStage,
  mode: VisionRequest["provider"]["mode"],
  defaults: RequestBuilderProviderDefaults = {},
): VisionRequest["provider"] {
  const providerStage = providerStageByRequestStage[stage];
  const timeoutMs = defaults.timeoutMs?.[providerStage];

  return {
    name: defaults.providerName ?? DEFAULT_PROVIDER,
    model: defaults.models?.[providerStage] ?? DEFAULT_MODELS[providerStage],
    mode,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  };
}

export function buildVisionRequestFromManifest(
  item: SampleCardManifestItem,
  defaults: RequestBuilderProviderDefaults = {},
): VisionRequest {
  const input: VisionRequest["input"] = {
    imagePath: item.imagePath,
    sourceSet: item.sourceSet,
    language: item.language,
  };

  if (item.sourcePage !== undefined) {
    input.sourcePage = item.sourcePage;
  }

  if (item.familyHint !== undefined) {
    input.familyHint = item.familyHint;
  }

  if (item.layoutHint !== undefined) {
    input.layoutHint = item.layoutHint;
  }

  return {
    jobId: `vision-${item.id}`,
    artifactVersion: "vision-request-v1",
    input,
    provider: buildAgentProviderSelection("vision", "accuracy", defaults),
  };
}

export function buildStructureRequestFromManifest(
  item: SampleCardManifestItem,
  defaults: RequestBuilderProviderDefaults = {},
): StructuringRequest {
  const fileStem = toFileStem(item.imagePath);
  const ocrNamespace = toNamespace(item.sourceSet, item.familyHint);

  return {
    jobId: `structure-${item.id}`,
    artifactVersion: "structure-request-v1",
    input: {
      visionResultPath: artifactPath("ocr", ocrNamespace, fileStem),
      schemaVersion: "fd-card-schema-v1",
      keywordDictionaryVersion: "fd-keywords-v1",
      targetNamespace: item.targetNamespace,
      ...(item.familyHint === undefined ? {} : { familyHint: item.familyHint }),
    },
    provider: buildAgentProviderSelection("structure", "accuracy", defaults),
  };
}

export function buildGuardrailRequestFromManifest(
  item: SampleCardManifestItem,
  defaults: RequestBuilderProviderDefaults = {},
): GuardrailRequest {
  const fileStem = toFileStem(item.imagePath);
  const ocrNamespace = toNamespace(item.sourceSet, item.familyHint);

  return {
    jobId: `guardrail-${item.id}`,
    artifactVersion: "guardrail-request-v1",
    input: {
      visionResultPath: artifactPath("ocr", ocrNamespace, fileStem),
      structureResultPath: artifactPath("structured", item.targetNamespace, fileStem),
      schemaVersion: "fd-card-schema-v1",
      engineCapabilityVersion: "fd-engine-capability-v1",
    },
    provider: buildAgentProviderSelection("guardrail", "review", defaults),
  };
}
