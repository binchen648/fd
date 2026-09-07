import type { VisionResponse } from "@fd/contracts";

import { parseServantMainCardAnalysis } from "./servant-main-card";

export type MainCardEntityType = "servant" | "master";
export type MainCardConfidence = "low" | "medium" | "high";

export interface MainCardLocatorInput {
  entityType: MainCardEntityType;
  pageName: string;
  visionArtifact: VisionResponse;
}

export interface MainCardLocatorResult {
  isMainCard: boolean;
  entityType: MainCardEntityType;
  confidence: MainCardConfidence;
  matchedSignals: string[];
  rejectedReasons: string[];
}

export function isConfirmedMainCard(result: MainCardLocatorResult): boolean {
  return result.isMainCard && result.confidence === "high";
}

const COMMON_SPECIAL_MARKERS = ["luck", "surveil", "preparation"];
const EFFECT_KEYWORDS = ["【真名解放】", "行动阶段", "战斗阶段", "被动", "打出时", "宝具"];

export function locateMainCard(input: MainCardLocatorInput): MainCardLocatorResult {
  return input.entityType === "servant" ? locateServantMainCard(input) : locateMasterMainCard(input);
}

function locateServantMainCard(input: MainCardLocatorInput): MainCardLocatorResult {
  const matchedSignals: string[] = [];
  const rejectedReasons: string[] = [];
  const pageName = normalizeName(input.pageName);
  const cardName = normalizeName(input.visionArtifact.text.cardName);
  const normalizedText = input.visionArtifact.text.normalizedText.toLowerCase();
  const numericRowCount = countNumericRows(input.visionArtifact.text.rawText);
  const specialMarkerCount = COMMON_SPECIAL_MARKERS.filter((marker) => normalizedText.includes(marker)).length;
  const hasEffectText = EFFECT_KEYWORDS.some((keyword) => input.visionArtifact.text.rawText.includes(keyword));
  const analysis = parseServantMainCardAnalysis(input.visionArtifact);

  if (pageName.length > 0 && cardName.includes(pageName)) {
    matchedSignals.push("page-name-match");
  } else {
    rejectedReasons.push("page-name-mismatch");
  }

  if (numericRowCount >= 2 || analysis.total_count >= 8) {
    matchedSignals.push("numeric-hand-rows");
  }

  if (specialMarkerCount > 0) {
    matchedSignals.push("special-card-markers");
  }

  if (analysis.total_count >= 8 && analysis.total_count <= 12) {
    matchedSignals.push("plausible-servant-total");
  } else {
    rejectedReasons.push("implausible-servant-total");
  }

  if (specialMarkerCount >= 2 || (analysis.total_count === 12 && numericRowCount >= 1)) {
    matchedSignals.push("strong-servant-layout");
  }

  if (hasEffectText && analysis.total_count < 8) {
    rejectedReasons.push("effect-text-dominant");
  }

  const isMainCard =
    (matchedSignals.includes("page-name-match") || matchedSignals.includes("strong-servant-layout")) &&
    matchedSignals.includes("numeric-hand-rows") &&
    matchedSignals.includes("plausible-servant-total") &&
    !rejectedReasons.includes("effect-text-dominant");

  return {
    isMainCard,
    entityType: "servant",
    confidence: isMainCard ? "high" : matchedSignals.includes("page-name-match") ? "medium" : "low",
    matchedSignals,
    rejectedReasons,
  };
}

function locateMasterMainCard(input: MainCardLocatorInput): MainCardLocatorResult {
  const matchedSignals: string[] = [];
  const rejectedReasons: string[] = [];
  const pageName = normalizeName(input.pageName);
  const cardName = normalizeName(input.visionArtifact.text.cardName);
  const lines = extractLines(input.visionArtifact.text.rawText);
  const normalizedText = input.visionArtifact.text.normalizedText;

  if (pageName.length > 0 && cardName.includes(pageName)) {
    matchedSignals.push("page-name-match");
  } else {
    rejectedReasons.push("page-name-mismatch");
  }

  if (countNumericRows(input.visionArtifact.text.rawText) === 0 && lines.length <= 4) {
    matchedSignals.push("master-identity-shape");
  }

  if (normalizedText.length > 140 || EFFECT_KEYWORDS.some((keyword) => input.visionArtifact.text.rawText.includes(keyword))) {
    rejectedReasons.push("effect-text-dominant");
  }

  const isMainCard =
    matchedSignals.includes("page-name-match") &&
    matchedSignals.includes("master-identity-shape") &&
    !rejectedReasons.includes("effect-text-dominant");

  return {
    isMainCard,
    entityType: "master",
    confidence: isMainCard ? "medium" : matchedSignals.includes("page-name-match") ? "medium" : "low",
    matchedSignals,
    rejectedReasons,
  };
}

function extractLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function countNumericRows(rawText: string): number {
  return extractLines(rawText).filter((line) => /^\d+(?:\s*,\s*\d+)+$/.test(line)).length;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\s・·\[\]\(\)【】]/g, "")
    .toLowerCase();
}
