import path from "node:path";

import type { VisionResponse } from "@fd/contracts";

export interface ServantMainCardAnalysis {
  character_name: string;
  red_cards: number[];
  green_cards: number[];
  blue_cards: number[];
  special_cards: string[];
  red_count: number;
  green_count: number;
  blue_count: number;
  special_count: number;
  total_count: number;
}

export interface ServantRecognitionBundle {
  artifactVersion: "recognition-bundle-v1";
  status: "recognized";
  familyId: string;
  displayName: string;
  sourceHtm: string;
  images: string[];
  visionArtifactPath: string;
  classificationRule: {
    method: "fd-card-recognition-v1";
    legend: {
      red: "red_cards numeric entries";
      green: "green_cards numeric entries";
      blue: "blue_cards numeric entries";
      white: "special_cards repeated text entries";
    };
  };
  mainCardfaceAnalysis: ServantMainCardAnalysis & {
    imageFile: string;
  };
}

const CLASSIFICATION_RULE: ServantRecognitionBundle["classificationRule"] = {
  method: "fd-card-recognition-v1",
  legend: {
    red: "red_cards numeric entries",
    green: "green_cards numeric entries",
    blue: "blue_cards numeric entries",
    white: "special_cards repeated text entries",
  },
};

export function parseServantMainCardAnalysis(artifact: VisionResponse): ServantMainCardAnalysis {
  const lines = extractRelevantLines(artifact);
  const zones = {
    red_cards: [] as number[],
    green_cards: [] as number[],
    blue_cards: [] as number[],
  };
  const specials: string[] = [];
  const zoneKeys: Array<keyof typeof zones> = ["red_cards", "green_cards", "blue_cards"];
  let zoneIndex = 0;

  for (const line of lines) {
    const parsed = parseContentLine(line);

    if (parsed.numbers.length > 0 && zoneIndex < zoneKeys.length) {
      zones[zoneKeys[zoneIndex]!] = parsed.numbers;
      zoneIndex += 1;
    }

    specials.push(...parsed.specials);
  }

  return finalizeAnalysis(artifact.text.cardName, zones.red_cards, zones.green_cards, zones.blue_cards, specials);
}

export function extractImageSourcesFromHtml(html: string): string[] {
  const matches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  return Array.from(matches, (match) => path.basename(match[1] ?? "")).filter((fileName) => /^(ScreenShot_|图片).*\.(png|jpg|jpeg)$/i.test(fileName));
}

export function buildServantRecognitionBundle(input: {
  familyId: string;
  sourceHtm: string;
  sourceHtml: string;
  visionArtifact: VisionResponse;
  mainImageFile: string;
  visionArtifactPath: string;
}): ServantRecognitionBundle {
  const sourceHtm = normalizePath(input.sourceHtm);
  const imageDir = `${sourceHtm.slice(0, sourceHtm.lastIndexOf("/"))}/图包`;

  return {
    artifactVersion: "recognition-bundle-v1",
    status: "recognized",
    familyId: input.familyId,
    displayName: input.visionArtifact.text.cardName,
    sourceHtm,
    images: extractImageSourcesFromHtml(input.sourceHtml).map((fileName) => `${imageDir}/${fileName}`),
    visionArtifactPath: normalizePath(input.visionArtifactPath),
    classificationRule: CLASSIFICATION_RULE,
    mainCardfaceAnalysis: {
      imageFile: input.mainImageFile,
      ...parseServantMainCardAnalysis(input.visionArtifact),
    },
  };
}

function extractRelevantLines(artifact: VisionResponse): string[] {
  const classTags = new Set(
    [artifact.fields.classTag, artifact.classification.subtypeGuess]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim().toLowerCase()),
  );
  const cardName = artifact.text.cardName.trim();

  return artifact.text.rawText
    .split(/\r?\n/g)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length > 0)
    .filter((line) => line !== cardName)
    .filter((line) => !classTags.has(line.toLowerCase()));
}

function parseContentLine(line: string): { numbers: number[]; specials: string[] } {
  const normalizedLine = line.replace(/[，、]/g, ",");
  const numberMatches = normalizedLine.match(/\d+(?:\s*,\s*\d+)*/g) ?? [];
  const numbers = numberMatches.flatMap((match) =>
    match
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => Number.parseInt(item, 10)),
  );
  const withoutNumbers = normalizeWhitespace(
    normalizedLine.replace(/\d+(?:\s*,\s*\d+)*/g, " ").replace(/[+]/g, " "),
  );
  const specials = expandSpecialEntries(withoutNumbers);

  return { numbers, specials };
}

function expandSpecialEntries(input: string): string[] {
  const normalized = normalizeWhitespace(input);

  if (normalized.length === 0) {
    return [];
  }

  const repeated = normalized.match(/^(.+?)\s*[xX×]\s*(\d+)$/);
  if (repeated) {
    const count = Number.parseInt(repeated[2] ?? "0", 10);
    const label = normalizeWhitespace(repeated[1] ?? "");
    return count > 0 && label.length > 0 ? Array.from({ length: count }, () => label) : [];
  }

  return normalized
    .split(/\s*,\s*/)
    .map((entry) => normalizeWhitespace(entry))
    .filter((entry) => entry.length > 0);
}

function finalizeAnalysis(
  characterName: string,
  redCards: number[],
  greenCards: number[],
  blueCards: number[],
  specialCards: string[],
): ServantMainCardAnalysis {
  return {
    character_name: characterName,
    red_cards: redCards,
    green_cards: greenCards,
    blue_cards: blueCards,
    special_cards: specialCards,
    red_count: redCards.length,
    green_count: greenCards.length,
    blue_count: blueCards.length,
    special_count: specialCards.length,
    total_count: redCards.length + greenCards.length + blueCards.length + specialCards.length,
  };
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizePath(filePath: string): string {
  return filePath.split("\\").join("/");
}
