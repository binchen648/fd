import { readFile } from "node:fs/promises";
import type { GuardrailRequest, SampleCardManifest } from "../packages/contracts/src";
import { loadProviderConfig } from "../packages/providers/src";
import {
  buildGuardrailRequestFromManifest,
  providerDefaultsFromConfig,
  runGuardrail,
  validateSampleManifest,
} from "../packages/pipeline/src";
import { toFileStem } from "../packages/pipeline/src/file-stems";

const CONFIG_PATH = "D:\\fd\\config\\providers\\siliconflow.example.json";

async function main() {
  const manifestPath = process.argv[2];
  const itemId = process.argv[3];

  if (!manifestPath || !itemId) {
    throw new Error("Usage: tsx scripts/run-from-structured-artifact.ts <manifestPath> <itemId>");
  }

  const providerDefaults = providerDefaultsFromConfig(await loadProviderConfig(CONFIG_PATH));

  const raw = await readFile(manifestPath, "utf8");
  const manifest = validateSampleManifest(JSON.parse(raw) as SampleCardManifest);
  const item = manifest.items.find((entry) => entry.id === itemId);

  if (!item) {
    throw new Error(`Sample item not found: ${itemId}`);
  }

  const fileStem = toFileStem(item.imagePath);
  const baseRequest = buildGuardrailRequestFromManifest(item, providerDefaults);
  const guardrailRequest: GuardrailRequest = {
    ...baseRequest,
    provider: {
      ...baseRequest.provider,
      timeoutMs: 300000
    }
  };
  const guardrail = await runGuardrail(CONFIG_PATH, guardrailRequest, item.targetNamespace, fileStem);

  console.log(
    JSON.stringify(
      {
        itemId,
        decision: guardrail.decision,
        ambiguityLevel: guardrail.ambiguityLevel,
        smokeTests: guardrail.smokeTests.length
      },
      null,
      2,
    ),
  );
}

void main();
