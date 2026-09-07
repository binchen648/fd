import { access } from "node:fs/promises";
import path from "node:path";
import type { VisionRequest, VisionResponse } from "../packages/contracts/src";
import {
  maybeWriteServantRecognitionBundle,
  readJsonArtifact,
  writeJsonArtifact,
} from "../packages/pipeline/src";

const PROJECT_ROOT = "D:/fd";
export const BACKFILL_COMPATIBILITY_MODE = "legacy-main-card-only";

type BackfillEntry = {
  jobId: string;
  imagePath: string;
  sourcePage: string;
  familyHint: string;
  existingVisionPath: string;
  seedVision?: VisionResponse;
};

const ENTRIES: BackfillEntry[] = [
  {
    jobId: "vision-servant.oda_nobunaga.mob.001",
    imagePath: "D:/fd/chm-extract/图包/ScreenShot_2025-11-02_130454_353.png",
    sourcePage: "D:/fd/chm-extract/魔王信长.htm",
    familyHint: "mob",
    existingVisionPath: "D:/fd/data/staged/ocr/mob/ScreenShot_2025-11-02_130454_353.json",
  },
  {
    jobId: "vision-servant.galatea.berserker",
    imagePath: "D:/fd/chm-extract/图包/ScreenShot_2025-11-02_113727_595.png",
    sourcePage: "D:/fd/chm-extract/伽拉忒亚.htm",
    familyHint: "berserker",
    existingVisionPath: "D:/fd/data/staged/ocr/berserker/ScreenShot_2025-11-02_113727_595.json",
  },
  {
    jobId: "vision-servant.babbage.001",
    imagePath: "D:/fd/chm-extract/图包/ScreenShot_2025-11-01_211944_712.png",
    sourcePage: "D:/fd/chm-extract/查尔斯·巴贝奇.htm",
    familyHint: "caster",
    existingVisionPath: "D:/fd/data/staged/ocr/caster/ScreenShot_2025-11-01_211944_712.json",
    seedVision: {
      jobId: "vision-servant.babbage.001",
      artifactVersion: "vision-response-v1",
      status: "ok",
      classification: {
        cardTypeGuess: "Servant",
        subtypeGuess: "Caster",
        familyConfidence: 0.99,
      },
      text: {
        cardName: "查尔斯·巴贝奇",
        rawText: "查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5",
        normalizedText: "查尔斯·巴贝奇 2,3,3,5 2,2,4,4 2,3,3,5",
      },
      fields: {
        code: null,
        costMarker: null,
        powerMarker: null,
        numericSlots: [2, 3, 3, 5, 2, 2, 4, 4, 2, 3, 3, 5],
        iconTags: [],
        rarity: null,
        classTag: "Caster",
      },
      blocks: [],
      uncertainSpans: [],
      overallConfidence: 0.99,
      source: {
        provider: "manual-review",
        model: "fd-card-recognition-v1",
      },
    },
  },
];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadOrSeedVision(entry: BackfillEntry): Promise<VisionResponse> {
  if (await fileExists(entry.existingVisionPath)) {
    return readJsonArtifact<VisionResponse>(entry.existingVisionPath);
  }

  if (!entry.seedVision) {
    throw new Error(`Missing vision artifact and no seed supplied: ${entry.existingVisionPath}`);
  }

  await writeJsonArtifact(entry.existingVisionPath, entry.seedVision);
  return entry.seedVision;
}


async function augmentBundleWithStructuredCards(bundlePath: string, classTag: string | null): Promise<void> {
  const bundle = await readJsonArtifact<Record<string, unknown>>(bundlePath);
  const images = Array.isArray(bundle.images) ? bundle.images.filter((value): value is string => typeof value === "string") : [];
  const cards: Array<Record<string, unknown>> = [];

  for (const imagePath of images) {
    const imageFile = path.basename(imagePath);
    const fileStem = imageFile.replace(/\.[^.]+$/, "");
    const structuredPath = `${PROJECT_ROOT}/data/staged/structured/servant/${fileStem}.json`;

    if (!(await fileExists(structuredPath))) {
      continue;
    }

    const structured = await readJsonArtifact<{ card: Record<string, unknown>; parseNotes?: unknown }>(structuredPath);
    const card = structured.card ?? {};
    cards.push({
      id: card.id,
      imageFile,
      name: card.name,
      cardType: card.cardType,
      timing: Array.isArray(card.timing) ? card.timing : [],
      tags: Array.isArray(card.tags) ? card.tags : [],
      parseNotes: Array.isArray(structured.parseNotes) ? structured.parseNotes : [],
    });
  }

  if (cards.length === 0) {
    return;
  }

  const enriched = {
    ...bundle,
    status: "compiled_from_structured",
    imageCount: images.length,
    ...(classTag ? { classTag } : {}),
    cards,
  };

  await writeJsonArtifact(bundlePath, enriched);
}

function buildVisionRequest(entry: BackfillEntry): VisionRequest {
  return {
    jobId: entry.jobId,
    artifactVersion: "vision-request-v1",
    input: {
      imagePath: entry.imagePath,
      sourcePage: entry.sourcePage,
      sourceSet: "servant",
      familyHint: entry.familyHint,
      language: "zh-CN",
    },
    provider: {
      name: "siliconflow",
      model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
      mode: "accuracy",
    },
  };
}

async function main() {
  const results: Array<{ familyHint: string; bundlePath: string | null }> = [];

  for (const entry of ENTRIES) {
    const response = await loadOrSeedVision(entry);
    const bundlePath = await maybeWriteServantRecognitionBundle({
      request: buildVisionRequest(entry),
      response,
      projectRoot: PROJECT_ROOT,
    });

    if (!bundlePath) {
      throw new Error(`Failed to generate servant main-card bundle for ${entry.jobId}`);
    }

    await augmentBundleWithStructuredCards(bundlePath, response.fields.classTag ?? response.classification.subtypeGuess ?? null);
    results.push({ familyHint: entry.familyHint, bundlePath });
  }

  console.log(JSON.stringify({ results }, null, 2));
}

void main();
