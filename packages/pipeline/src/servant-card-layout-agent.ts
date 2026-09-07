import type { VisionResponse } from "@fd/contracts";

import type { CardExtractionDraft } from "./card-extractor-types";
import { createCardExtractionDraft } from "./card-extractor-types";

const ATTRIBUTE_LABELS = new Set(["力量", "敏捷", "魔术", "特殊", "宝具"]);

export interface ServantCardLayoutRecognition {
  card_name: string | null;
  mana_cost: number | null;
  attack_power: number | null;
  attributes: string[];
  rules_text: string;
  uncertain_fields: string[];
  confidence: number;
}

export function recognizeServantCardLayout(visionArtifact: VisionResponse): ServantCardLayoutRecognition {
  const lines = visionArtifact.text.rawText
    .split(/\r?\n/g)
    .map((line) => normalizeText(line))
    .filter((line) => line.length > 0);

  const attributes: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line === undefined || !ATTRIBUTE_LABELS.has(line)) {
      break;
    }
    attributes.push(line);
    index += 1;
  }

  const cardName = lines[index] ?? (normalizeText(visionArtifact.text.cardName) || null);
  if (index < lines.length) {
    index += 1;
  }

  const numericCandidates: Array<{ value: number | null; raw: string }> = [];
  while (index < lines.length && numericCandidates.length < 2) {
    const line = lines[index];
    if (line === undefined) {
      break;
    }
    const parsed = parseDisplayedNumeric(line);
    if (parsed !== undefined) {
      numericCandidates.push({ value: parsed, raw: line });
      index += 1;
      continue;
    }
    break;
  }

  const rulesText = lines.slice(index).join("\n");
  const uncertain_fields: string[] = [];

  const firstNumericCandidate = numericCandidates[0];
  const secondNumericCandidate = numericCandidates[1];
  if (
    firstNumericCandidate !== undefined &&
    secondNumericCandidate !== undefined &&
    looksLikeMergedDisplayedPair(firstNumericCandidate, secondNumericCandidate)
  ) {
    firstNumericCandidate.value = null;
    secondNumericCandidate.value = null;
  }

  const mana_cost = numericCandidates[0]?.value ?? visionArtifact.fields.costMarker;
  const attack_power = numericCandidates[1]?.value ?? visionArtifact.fields.powerMarker;

  if (cardName === null || cardName.length === 0) {
    uncertain_fields.push("card_name");
  }

  if (numericCandidates.length === 0 && visionArtifact.fields.costMarker === null) {
    uncertain_fields.push("mana_cost");
  }

  if (numericCandidates.length < 2 && visionArtifact.fields.powerMarker === null) {
    uncertain_fields.push("attack_power");
  }

  if (numericCandidates.some((candidate) => candidate.value === null)) {
    if (!uncertain_fields.includes("mana_cost")) {
      uncertain_fields.push("mana_cost");
    }
    if (!uncertain_fields.includes("attack_power")) {
      uncertain_fields.push("attack_power");
    }
  }

  if (cardName !== null && rulesText.includes("遗蜕") && !rulesText.startsWith(cardName) && cardName !== "遗蜕") {
    uncertain_fields.push("card_name");
  }

  const confidence = deriveConfidence({
    hasCardName: cardName !== null && cardName.length > 0,
    mana_cost,
    attack_power,
    uncertainCount: uncertain_fields.length,
  });

  return {
    card_name: cardName,
    mana_cost,
    attack_power,
    attributes,
    rules_text: rulesText,
    uncertain_fields,
    confidence,
  };
}

export function buildDraftFromServantCardLayoutRecognition(input: {
  visionArtifact: VisionResponse;
  recognition: ServantCardLayoutRecognition;
}): CardExtractionDraft {
  const review_notes = input.recognition.uncertain_fields.map((field) => `Uncertain field: ${field}`);
  const fallbackCardName = normalizeText(input.visionArtifact.text.cardName) || "unnamed-card";
  const cardName = input.recognition.card_name ?? fallbackCardName;

  return createCardExtractionDraft({
    card_name: cardName,
    card_type: normalizeCardType(input.visionArtifact.classification.cardTypeGuess),
    ocr_text_raw: input.visionArtifact.text.rawText,
    ocr_text_draft: input.visionArtifact.text.normalizedText,
    rules_text: input.recognition.rules_text,
    effect_text: input.recognition.rules_text,
    effect_explanation: "",
    cost: input.recognition.mana_cost,
    power: input.recognition.attack_power,
    displayed_cost_power_confirmed:
      input.recognition.mana_cost !== null &&
      input.recognition.attack_power !== null &&
      !input.recognition.uncertain_fields.includes("mana_cost") &&
      !input.recognition.uncertain_fields.includes("attack_power"),
    tags: [
      ...input.recognition.attributes,
      ...(input.visionArtifact.classification.subtypeGuess ? [input.visionArtifact.classification.subtypeGuess] : []),
      ...(input.visionArtifact.fields.classTag ? [input.visionArtifact.fields.classTag] : []),
    ].filter((value, index, array) => value.length > 0 && array.indexOf(value) === index),
    attributes: input.recognition.attributes,
    confidence: input.recognition.confidence,
    needs_human_review: input.recognition.uncertain_fields.length > 0,
    uncertain_fields: input.recognition.uncertain_fields,
    review_notes,
  });
}

function parseDisplayedNumeric(line: string): number | null | undefined {
  const normalized = line.replace(/\s+/g, "");
  if (!/[0-9]/.test(normalized)) {
    return undefined;
  }

  const exactDigits = normalized.match(/^\d{1,3}$/);
  if (exactDigits) {
    if (exactDigits[0].length === 3) {
      return Number.parseInt(exactDigits[0].slice(0, 2), 10);
    }

    return Number.parseInt(exactDigits[0], 10);
  }

  const digitsWithNoise = normalized.match(/^(\d{1,3})[^\d]+$/);
  if (digitsWithNoise) {
    return Number.parseInt(digitsWithNoise[1]!, 10);
  }

  return null;
}

function deriveConfidence(input: {
  hasCardName: boolean;
  mana_cost: number | null;
  attack_power: number | null;
  uncertainCount: number;
}): number {
  let score = 0.4;
  if (input.hasCardName) score += 0.2;
  if (input.mana_cost !== null) score += 0.15;
  if (input.attack_power !== null) score += 0.15;
  score -= Math.min(input.uncertainCount * 0.1, 0.3);
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

function looksLikeMergedDisplayedPair(
  first: { value: number | null; raw: string },
  second: { value: number | null; raw: string },
): boolean {
  if (first.value === null || second.value === null) {
    return false;
  }

  return /^\d{2,3}$/.test(first.raw) && /^\d$/.test(second.raw) && first.value > 20;
}

function normalizeText(value: string): string {
  return value.replace(/[\[\]{}|]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeCardType(cardTypeGuess: string | null): string {
  return cardTypeGuess && cardTypeGuess.trim().length > 0 ? cardTypeGuess : "servant_skill";
}
