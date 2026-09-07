import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { SampleCardManifest } from "../packages/contracts/src";
import { loadProviderConfig } from "../packages/providers/src";
import {
  buildGuardrailRequestFromManifest,
  buildStructureRequestFromManifest,
  buildVisionRequestFromManifest,
  providerDefaultsFromConfig,
  readJsonArtifact,
  runGuardrail,
  runStructure,
  runVision,
  validateSampleManifest,
} from "../packages/pipeline/src";
import { toFileStem } from "../packages/pipeline/src/file-stems";

const CONFIG_PATH = "D:\\fd\\config\\providers\\siliconflow.json";

async function assertExists(filePath: string, label: string): Promise<void> {
  try {
    await access(filePath);
  } catch {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function resolveFromProjectRoot(filePath: string): string {
  if (/^[a-zA-Z]:\\/.test(filePath)) {
    return filePath;
  }

  return path.join("D:\\fd", filePath);
}

async function main() {
  const manifestPath = process.argv[2];
  const itemId = process.argv[3];

  if (!manifestPath || !itemId) {
    throw new Error("Usage: tsx scripts/run-sample-card.ts <manifestPath> <itemId>");
  }

  const resolvedManifestPath = resolveFromProjectRoot(manifestPath);
  await assertExists(CONFIG_PATH, "Provider config");
  await assertExists(resolvedManifestPath, "Manifest");

  const providerDefaults = providerDefaultsFromConfig(await loadProviderConfig(CONFIG_PATH));

  const raw = await readFile(resolvedManifestPath, "utf8");
  const manifest = validateSampleManifest(JSON.parse(raw) as SampleCardManifest);
  const item = manifest.items.find((entry) => entry.id === itemId);

  if (!item) {
    throw new Error(`Sample item not found: ${itemId}`);
  }

  const resolvedImagePath = resolveFromProjectRoot(item.imagePath);
  await assertExists(resolvedImagePath, "Sample card image");

  const runnableItem = {
    ...item,
    imagePath: resolvedImagePath,
  };

  const fileStem = toFileStem(runnableItem.imagePath);
  const visionRequest = buildVisionRequestFromManifest(runnableItem, providerDefaults);
  const vision = await runVision(CONFIG_PATH, visionRequest);

  const structureRequest = buildStructureRequestFromManifest(runnableItem, providerDefaults);
  const structured = await runStructure(CONFIG_PATH, structureRequest, runnableItem.targetNamespace, fileStem);

  const guardrailRequest = buildGuardrailRequestFromManifest(runnableItem, providerDefaults);
  const guardrail = await runGuardrail(CONFIG_PATH, guardrailRequest, runnableItem.targetNamespace, fileStem);

  console.log(
    JSON.stringify(
      {
        itemId,
        decision: guardrail.decision,
        visionName: vision.text.cardName,
        structuredId: structured.card.id,
        ambiguityLevel: guardrail.ambiguityLevel,
      },
      null,
      2,
    ),
  );
}

void main();
