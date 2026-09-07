import path from "node:path";

import type { VisionRequest, VisionResponse } from "@fd/contracts";

import { writeJsonArtifact } from "./artifacts";
import { toFileStem, toNamespace } from "./file-stems";
import { locateMainCard } from "./main-card-locator";

export interface MasterMainCardArtifact {
  artifactVersion: "master-main-card-v1";
  status: "recognized";
  displayName: string;
  imageFile: string;
  sourcePage: string;
  visionArtifactPath: string;
  locator: ReturnType<typeof locateMainCard>;
}

const MAIN_CARD_EXCLUDED_HINTS = new Set(["master_skill"]);

export async function maybeWriteMasterMainCardArtifact(input: {
  request: VisionRequest;
  response: VisionResponse;
  projectRoot?: string;
}): Promise<string | null> {
  const projectRoot = input.projectRoot ?? "D:/fd";
  const { request, response } = input;

  if (request.input.sourceSet !== "master") {
    return null;
  }

  if (request.input.familyHint && MAIN_CARD_EXCLUDED_HINTS.has(request.input.familyHint)) {
    return null;
  }

  if (!request.input.sourcePage) {
    return null;
  }

  const sourcePage = toAbsoluteProjectPath(projectRoot, request.input.sourcePage);
  const imageFile = path.basename(request.input.imagePath);
  const fileStem = toFileStem(request.input.imagePath);
  const namespace = toNamespace(request.input.sourceSet, request.input.familyHint);
  const locator = locateMainCard({
    entityType: "master",
    pageName: path.basename(sourcePage, path.extname(sourcePage)),
    visionArtifact: response,
  });

  if (!locator.isMainCard) {
    return null;
  }

  const outputPath = path.join(projectRoot, "data", "staged", "review-pending", `master-main-card-${fileStem}.json`);
  const artifact: MasterMainCardArtifact = {
    artifactVersion: "master-main-card-v1",
    status: "recognized",
    displayName: response.text.cardName,
    imageFile,
    sourcePage: normalizePath(sourcePage),
    visionArtifactPath: normalizePath(path.join(projectRoot, "data", "staged", "ocr", namespace, `${fileStem}.json`)),
    locator,
  };

  await writeJsonArtifact(outputPath, artifact);
  return outputPath;
}

function toAbsoluteProjectPath(projectRoot: string, filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.join(projectRoot, filePath);
}

function normalizePath(filePath: string): string {
  return filePath.split("\\").join("/");
}
