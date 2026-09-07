import type { GuardrailRequest, StructuringRequest, VisionRequest } from "../packages/contracts/src";
import { loadProviderConfig } from "../packages/providers/src";
import {
  buildAgentProviderSelection,
  providerDefaultsFromConfig,
  runSmokeChain,
} from "../packages/pipeline/src";

const CONFIG_PATH = "D:\\fd\\config\\providers\\siliconflow.example.json";

async function main() {
  const providerDefaults = providerDefaultsFromConfig(await loadProviderConfig(CONFIG_PATH));
  const visionRequest: VisionRequest = {
    jobId: "vision-sample-0001",
    artifactVersion: "vision-request-v1",
    input: {
      imagePath: "data/raw/cards/master/sample.png",
      sourcePage: "sample.htm",
      sourceSet: "master",
      familyHint: "master_skill",
      layoutHint: "single_card_vertical",
      language: "zh-CN",
    },
    provider: buildAgentProviderSelection("vision", "accuracy", providerDefaults),
  };

  const result = await runSmokeChain({
    configPath: CONFIG_PATH,
    visionRequest,
    structureRequestFactory: (_vision, visionResultPath): StructuringRequest => ({
      jobId: "structure-sample-0001",
      artifactVersion: "structure-request-v1",
      input: {
        visionResultPath,
        schemaVersion: "fd-card-schema-v1",
        keywordDictionaryVersion: "fd-keywords-v1",
        targetNamespace: "master",
      },
      provider: buildAgentProviderSelection("structure", "accuracy", providerDefaults),
    }),
    guardrailRequestFactory: ({ visionResultPath, structureResultPath }): GuardrailRequest => ({
      jobId: "guardrail-sample-0001",
      artifactVersion: "guardrail-request-v1",
      input: {
        visionResultPath,
        structureResultPath,
        schemaVersion: "fd-card-schema-v1",
        engineCapabilityVersion: "fd-engine-capability-v1",
      },
      provider: buildAgentProviderSelection("guardrail", "review", providerDefaults),
    }),
  });

  console.log(JSON.stringify(result, null, 2));
}

void main();
