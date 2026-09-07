import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { VisionResponse } from "@fd/contracts";

import { writeJsonArtifact } from "./artifacts";
import { parseServantMainCardAnalysis } from "./servant-main-card";

export function buildServantFolderPath(projectRoot: string, characterName: string): string {
  return path.join(projectRoot, "data", "staged", "servants", characterName);
}

export async function writeMainCardJson(input: {
  servantDir: string;
  imageFile: string;
  visionArtifact: VisionResponse;
}): Promise<string> {
  const analysis = parseServantMainCardAnalysis(input.visionArtifact);
  const outputPath = path.join(input.servantDir, `${analysis.character_name}.main-card.json`);
  await writeJsonArtifact(outputPath, {
    imageFile: input.imageFile,
    ...analysis,
  });
  return outputPath;
}

export async function materializeConfirmedServantFolder(input: {
  projectRoot: string;
  stagedImagePaths: string[];
  selectedImageFile: string;
  visionArtifact: VisionResponse;
}): Promise<{ servantDir: string; mainCardJsonPath: string; copiedImagePaths: string[] }> {
  const analysis = parseServantMainCardAnalysis(input.visionArtifact);
  const servantDir = buildServantFolderPath(input.projectRoot, analysis.character_name);
  const copiedImagePaths: string[] = [];

  await mkdir(servantDir, { recursive: true });

  for (const stagedImagePath of input.stagedImagePaths) {
    const targetPath = path.join(servantDir, path.basename(stagedImagePath));
    await copyFile(stagedImagePath, targetPath);
    copiedImagePaths.push(targetPath);
  }

  const mainCardJsonPath = await writeMainCardJson({
    servantDir,
    imageFile: input.selectedImageFile,
    visionArtifact: input.visionArtifact,
  });

  return {
    servantDir,
    mainCardJsonPath,
    copiedImagePaths,
  };
}
