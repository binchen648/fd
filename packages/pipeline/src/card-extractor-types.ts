export interface CardExtractionDraft {
  card_name: string;
  card_type: string;
  ocr_text_raw: string;
  ocr_text_draft: string;
  rules_text: string;
  effect_text: string;
  effect_explanation: string;
  cost: number | null;
  power: number | null;
  displayed_cost_power_confirmed: boolean;
  tags: string[];
  attributes: string[];
  confidence: number;
  needs_human_review: boolean;
  uncertain_fields: string[];
  review_notes: string[];
}

export function createCardExtractionDraft(input: CardExtractionDraft): CardExtractionDraft {
  assertCardExtractionDraft(input);
  return {
    ...input,
    tags: [...input.tags],
    review_notes: [...input.review_notes],
  };
}

export function isCardExtractionDraft(value: unknown): value is CardExtractionDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.card_name === "string" &&
    typeof value.card_type === "string" &&
    typeof value.ocr_text_raw === "string" &&
    typeof value.ocr_text_draft === "string" &&
    typeof value.rules_text === "string" &&
    typeof value.effect_text === "string" &&
    typeof value.effect_explanation === "string" &&
    isNullableNumber(value.cost) &&
    isNullableNumber(value.power) &&
    typeof value.displayed_cost_power_confirmed === "boolean" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    Array.isArray(value.attributes) &&
    value.attributes.every((attribute) => typeof attribute === "string") &&
    typeof value.confidence === "number" &&
    value.confidence >= 0 &&
    value.confidence <= 1 &&
    typeof value.needs_human_review === "boolean" &&
    Array.isArray(value.uncertain_fields) &&
    value.uncertain_fields.every((field) => typeof field === "string") &&
    Array.isArray(value.review_notes) &&
    value.review_notes.every((note) => typeof note === "string")
  );
}

export function assertCardExtractionDraft(value: unknown, label = "card extraction draft"): asserts value is CardExtractionDraft {
  if (!isCardExtractionDraft(value)) {
    throw new Error(`Invalid ${label} structure`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}
