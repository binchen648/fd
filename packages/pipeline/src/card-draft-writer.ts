import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { CardExtractionDraft } from "./card-extractor-types";
import { writeJsonArtifact } from "./artifacts";
import { buildRenamedCardFileName } from "./card-rename-policy";

export async function writeCardDraftArtifacts(input: {
  outputDir: string;
  sourceImagePath: string;
  draft: CardExtractionDraft;
}): Promise<{ pngPath: string; jsonPath: string }> {
  await mkdir(input.outputDir, { recursive: true });

  const pngFileName = buildRenamedCardFileName(input.draft);
  const pngPath = path.join(input.outputDir, pngFileName);
  const jsonPath = path.join(input.outputDir, `${path.basename(pngFileName, path.extname(pngFileName))}.json`);

  await copyFile(input.sourceImagePath, pngPath);
  await writeJsonArtifact(jsonPath, input.draft);

  return { pngPath, jsonPath };
}
