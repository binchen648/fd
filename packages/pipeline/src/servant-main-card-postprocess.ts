import { readFile } from "node:fs/promises";
import path from "node:path";

import type { VisionRequest, VisionResponse } from "@fd/contracts";

import { writeJsonArtifact } from "./artifacts";
import { locateMainCard } from "./main-card-locator";
import { toFileStem, toNamespace } from "./file-stems";
import {
  buildServantRecognitionBundle,
  extractImageSourcesFromHtml,
  type ServantRecognitionBundle,
  parseServantMainCardAnalysis,
} from "./servant-main-card";

const MAIN_CARD_EXCLUDED_HINTS = new Set(["servant_overview", "servant_attack", "servant_skill"]);

interface CatalogEntry {
  filename: string;
  images?: string[];
}

export async function maybeWriteServantRecognitionBundle(input: {
  request: VisionRequest;
  response: VisionResponse;
  projectRoot?: string;
}): Promise<string | null> {
  const projectRoot = input.projectRoot ?? "D:/fd";
  const { request, response } = input;

  if (request.input.sourceSet !== "servant") {
    return null;
  }

  if (request.input.familyHint && MAIN_CARD_EXCLUDED_HINTS.has(request.input.familyHint)) {
    return null;
  }

  const familyId = deriveServantFamilyId(request.jobId);
  if (!familyId) {
    return null;
  }

  const sourcePagePath = await resolveSourcePagePath(projectRoot, request);
  if (!sourcePagePath) {
    return null;
  }

  const sourceHtml = await readFile(sourcePagePath, "utf8");
  const imageFiles = extractImageSourcesFromHtml(sourceHtml);
  const imageFile = path.basename(request.input.imagePath);

  if (imageFiles[0] !== imageFile) {
    return null;
  }

  const locatorResult = locateMainCard({
    entityType: "servant",
    pageName: path.basename(sourcePagePath, path.extname(sourcePagePath)),
    visionArtifact: response,
  });

  if (!locatorResult.isMainCard) {
    return null;
  }

  const analysis = parseServantMainCardAnalysis(response);
  if (analysis.total_count <= 0 || analysis.total_count > 12) {
    return null;
  }

  const namespace = toNamespace(request.input.sourceSet, request.input.familyHint);
  const fileStem = toFileStem(request.input.imagePath);
  const bundlePath = reviewPendingBundlePath(projectRoot, familyId);
  const bundle = buildServantRecognitionBundle({
    familyId,
    sourceHtm: sourcePagePath,
    sourceHtml,
    visionArtifact: response,
    mainImageFile: imageFile,
    visionArtifactPath: ocrArtifactPath(projectRoot, namespace, fileStem),
  });

  await writeServantRecognitionBundleArtifact(bundlePath, bundle);
  return bundlePath;
}

export async function writeServantRecognitionBundleArtifact(
  bundlePath: string,
  bundle: ServantRecognitionBundle,
): Promise<string> {
  await writeJsonArtifact(bundlePath, bundle);
  return bundlePath;
}

export function deriveServantFamilyId(jobId: string): string | null {
  const raw = jobId.startsWith("vision-") ? jobId.slice("vision-".length) : jobId;
  const trimmed = raw.replace(/\.\d+$/, "");

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.startsWith("servant.") ? trimmed : `servant.${trimmed}`;
}

export function reviewPendingBundlePath(projectRoot: string, familyId: string): string {
  return path.join(projectRoot, "data", "staged", "review-pending", `${familyId.replace(/^servant\./, "")}.bundle.json`);
}

async function resolveSourcePagePath(projectRoot: string, request: VisionRequest): Promise<string | null> {
  if (request.input.sourcePage) {
    return toAbsoluteProjectPath(projectRoot, request.input.sourcePage);
  }

  const catalogPath = path.join(projectRoot, "chm-extract", "card_catalog.json");

  try {
    const raw = await readFile(catalogPath, "utf8");
    const catalog = JSON.parse(raw) as CatalogEntry[];
    const imageFile = path.basename(request.input.imagePath);
    const match = catalog.find((entry) => entry.images?.includes(imageFile));
    return match ? path.join(projectRoot, "chm-extract", match.filename) : null;
  } catch {
    return null;
  }
}

function toAbsoluteProjectPath(projectRoot: string, filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.join(projectRoot, filePath);
}

function ocrArtifactPath(projectRoot: string, namespace: string, fileStem: string): string {
  return path.join(projectRoot, "data", "staged", "ocr", namespace, `${fileStem}.json`);
}
