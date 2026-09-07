import type { VisionResponse } from "@fd/contracts";

import { isConfirmedMainCard, locateMainCard, type MainCardLocatorResult } from "./main-card-locator";

export interface ServantMainCardCandidateInput {
  imageFile: string;
  visionArtifact: VisionResponse;
}

export interface ServantMainCardCandidateSummary extends MainCardLocatorResult {
  imageFile: string;
}

export interface ServantMainCardSelectionResult {
  status: "confirmed" | "review_required";
  reason: "unique-main-card-confirmed" | "multiple-main-card-candidates" | "no-main-card-candidate";
  selectedImageFile: string | null;
  candidateSummaries: ServantMainCardCandidateSummary[];
}

export function selectUniqueServantMainCard(
  pageName: string,
  imageArtifacts: ServantMainCardCandidateInput[],
): ServantMainCardSelectionResult {
  const candidateSummaries = imageArtifacts.map((artifact) => {
    const locator = locateMainCard({
      entityType: "servant",
      pageName,
      visionArtifact: artifact.visionArtifact,
    });

    return {
      imageFile: artifact.imageFile,
      ...locator,
    } satisfies ServantMainCardCandidateSummary;
  });

  const confirmedCandidates = candidateSummaries.filter((candidate) => isConfirmedMainCard(candidate));

  if (confirmedCandidates.length === 1) {
    return {
      status: "confirmed",
      reason: "unique-main-card-confirmed",
      selectedImageFile: confirmedCandidates[0]!.imageFile,
      candidateSummaries,
    };
  }

  return {
    status: "review_required",
    reason: confirmedCandidates.length === 0 ? "no-main-card-candidate" : "multiple-main-card-candidates",
    selectedImageFile: null,
    candidateSummaries,
  };
}
