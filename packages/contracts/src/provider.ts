import type { VisionRequest, VisionResponse } from "./vision";
import type { StructuringRequest, StructuringResponse } from "./structure";
import type { GuardrailRequest, GuardrailResponse } from "./guardrail";

export interface ProviderTimeouts {
  visionMs: number;
  structureMs: number;
  reviewMs: number;
}

export interface ProviderAuthConfig {
  apiKeyFile: string;
}

export interface ProviderRuntimeConfig {
  provider: string;
  baseUrl: string;
  models: {
    vision: string;
    structure: string;
    review: string;
  };
  auth: ProviderAuthConfig;
  timeouts: ProviderTimeouts;
}

export interface ModelProvider {
  name: string;
  runVision?(input: VisionRequest): Promise<VisionResponse>;
  runStructure?(input: StructuringRequest): Promise<StructuringResponse>;
  runReview?(input: GuardrailRequest): Promise<GuardrailResponse>;
}
