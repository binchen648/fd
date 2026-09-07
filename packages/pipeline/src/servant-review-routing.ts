import path from "node:path";

import { writeJsonArtifact } from "./artifacts";

export interface ReviewPendingCandidateSummary {
  imageFile: string;
  isMainCard: boolean;
  confidence: "low" | "medium" | "high";
}

export interface ReviewPendingPageManifest {
  artifactVersion: "servant-review-pending-page-v1";
  status: "review_required";
  sourceHtm: string;
  pageName: string;
  reason: string;
  pngFiles: string[];
  candidateSummaries: ReviewPendingCandidateSummary[];
}

export function reviewPendingPageDir(projectRoot: string, htmPath: string): string {
  return path.join(projectRoot, "data", "staged", "review-pending", path.basename(htmPath, path.extname(htmPath)));
}

export async function writeReviewPendingPageManifest(input: {
  projectRoot: string;
  htmPath: string;
  pageName: string;
  reason: string;
  pngFiles: string[];
  candidateSummaries: ReviewPendingCandidateSummary[];
}): Promise<string> {
  const manifestPath = path.join(reviewPendingPageDir(input.projectRoot, input.htmPath), "page-manifest.json");
  const manifest: ReviewPendingPageManifest = {
    artifactVersion: "servant-review-pending-page-v1",
    status: "review_required",
    sourceHtm: input.htmPath.split("\\").join("/"),
    pageName: input.pageName,
    reason: input.reason,
    pngFiles: input.pngFiles,
    candidateSummaries: input.candidateSummaries,
  };

  await writeJsonArtifact(manifestPath, manifest);
  return manifestPath;
}
