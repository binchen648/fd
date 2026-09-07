import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { VisionResponse } from "@fd/contracts";

import type { CardExtractionDraft } from "../card-extractor-types";
import { writeCardDraftArtifacts } from "../card-draft-writer";
import { buildVisionArtifactFromLocalOcr } from "../local-easyocr";
import { buildDraftFromServantCardLayoutRecognition, recognizeServantCardLayout, type ServantCardLayoutRecognition } from "../servant-card-layout-agent";
import { materializeConfirmedServantFolder } from "../servant-folder-materializer";
import { buildServantStagingPaths, parseServantHtmUnit } from "../servant-page-orchestrator";
import { writeReviewPendingPageManifest } from "../servant-review-routing";
import { selectUniqueServantMainCard } from "../servant-main-card-selection";

export async function runServantPageWorkflow(input: {
  projectRoot: string;
  htmPath: string;
  artifactsByImage?: Record<string, { visionArtifact: VisionResponse; draft?: CardExtractionDraft; layoutRecognition?: ServantCardLayoutRecognition }>;
  localOcrFallback?: (imagePath: string) => Promise<string[]>;
}): Promise<{ status: "confirmed" | "review_required"; outputPath: string }> {
  const html = await readFile(input.htmPath, "utf8");
  const unit = parseServantHtmUnit(input.htmPath, html);
  const stagingPaths = buildServantStagingPaths(input.projectRoot, input.htmPath);

  await mkdir(stagingPaths.stagingDir, { recursive: true });

  const stagedImagePaths: string[] = [];
  for (const pngPath of unit.png_paths) {
    const targetPath = path.join(stagingPaths.stagingDir, path.basename(pngPath));
    await copyFile(pngPath, targetPath);
    stagedImagePaths.push(targetPath);
  }

  const candidateInputs = await Promise.all(stagedImagePaths.map(async (stagedImagePath) => {
    const imageFile = path.basename(stagedImagePath);
    const artifact = await resolveImageArtifact({
      imageFile,
      stagedImagePath,
      htmPath: input.htmPath,
      artifactsByImage: input.artifactsByImage,
      localOcrFallback: input.localOcrFallback,
    });
    if (!artifact) {
      throw new Error(`Missing artifact for servant page image: ${imageFile}`);
    }

    return {
      imageFile,
      visionArtifact: artifact.visionArtifact,
    };
  }));

  const selection = selectUniqueServantMainCard(unit.htm_name, candidateInputs);
  if (selection.status === "review_required") {
    const outputPath = await writeReviewPendingPageManifest({
      projectRoot: input.projectRoot,
      htmPath: input.htmPath,
      pageName: unit.page_title ?? unit.htm_name,
      reason: selection.reason,
      pngFiles: stagedImagePaths.map((filePath) => path.basename(filePath)),
      candidateSummaries: selection.candidateSummaries.map((candidate) => ({
        imageFile: candidate.imageFile,
        isMainCard: candidate.isMainCard,
        confidence: candidate.confidence,
      })),
    });
    return { status: "review_required", outputPath };
  }

  const selectedArtifact = input.artifactsByImage?.[selection.selectedImageFile ?? ""];
  if (!selectedArtifact || !selection.selectedImageFile) {
    throw new Error("Missing selected main-card artifact");
  }

  const folderResult = await materializeConfirmedServantFolder({
    projectRoot: input.projectRoot,
    stagedImagePaths,
    selectedImageFile: selection.selectedImageFile,
    visionArtifact: selectedArtifact.visionArtifact,
  });

  for (const stagedImagePath of stagedImagePaths) {
    const imageFile = path.basename(stagedImagePath);
    if (imageFile === selection.selectedImageFile) {
      continue;
    }

    const artifact = await resolveImageArtifact({
      imageFile,
      stagedImagePath,
      htmPath: input.htmPath,
      artifactsByImage: input.artifactsByImage,
      localOcrFallback: input.localOcrFallback,
    });
    if (!artifact) {
      throw new Error(`Missing draft artifact for non-main card image: ${imageFile}`);
    }

    const draft = artifact.draft ?? createFallbackDraft(artifact.visionArtifact, artifact.layoutRecognition);
    await writeCardDraftArtifacts({
      outputDir: folderResult.servantDir,
      sourceImagePath: stagedImagePath,
      draft,
    });
  }

  return {
    status: "confirmed",
    outputPath: folderResult.servantDir,
  };
}

async function resolveImageArtifact(input: {
  imageFile: string;
  stagedImagePath: string;
  htmPath: string;
  artifactsByImage?: Record<string, { visionArtifact: VisionResponse; draft?: CardExtractionDraft; layoutRecognition?: ServantCardLayoutRecognition }> | undefined;
  localOcrFallback?: ((imagePath: string) => Promise<string[]>) | undefined;
}): Promise<{ visionArtifact: VisionResponse; draft?: CardExtractionDraft; layoutRecognition?: ServantCardLayoutRecognition } | undefined> {
  const existing = input.artifactsByImage?.[input.imageFile];
  if (existing) {
    return existing;
  }

  if (!input.localOcrFallback) {
    return undefined;
  }

  const lines = await input.localOcrFallback(input.stagedImagePath);
  const visionArtifact = buildVisionArtifactFromLocalOcr({
    imagePath: input.stagedImagePath,
    pagePath: input.htmPath,
    lines,
  });
  return { visionArtifact };
}

function createFallbackDraft(
  visionArtifact: VisionResponse,
  layoutRecognition?: ServantCardLayoutRecognition,
): CardExtractionDraft {
  const recognition = layoutRecognition ?? recognizeServantCardLayout(visionArtifact);
  return buildDraftFromServantCardLayoutRecognition({
    visionArtifact,
    recognition,
  });
}
