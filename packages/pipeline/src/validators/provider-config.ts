import type { ProviderRuntimeConfig } from "@fd/contracts";
import { assertNumber, assertObject, assertString } from "./assert";

export function validateProviderConfig(input: unknown): ProviderRuntimeConfig {
  assertObject(input, "provider config");
  assertString(input.provider, "provider");
  assertString(input.baseUrl, "baseUrl");

  assertObject(input.models, "models");
  assertString(input.models.vision, "models.vision");
  assertString(input.models.structure, "models.structure");
  assertString(input.models.review, "models.review");

  assertObject(input.auth, "auth");
  assertString(input.auth.apiKeyFile, "auth.apiKeyFile");

  assertObject(input.timeouts, "timeouts");
  assertNumber(input.timeouts.visionMs, "timeouts.visionMs");
  assertNumber(input.timeouts.structureMs, "timeouts.structureMs");
  assertNumber(input.timeouts.reviewMs, "timeouts.reviewMs");

  return input as unknown as ProviderRuntimeConfig;
}
