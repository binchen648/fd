import type { VisionResponse } from "@fd/contracts";

export function repairVisionResponse(
  input: unknown,
  requestJobId: string,
  provider: string,
  model: string,
): VisionResponse | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }

  const record = input as Record<string, unknown>;
  if (typeof record.fields !== "object" || record.fields === null || Array.isArray(record.fields)) {
    return null;
  }

  const fields = record.fields as Record<string, unknown>;
  const classification = record.classification;
  const needsRepair =
    typeof record.jobId !== "string" ||
    record.artifactVersion !== "vision-response-v1" ||
    (record.status !== "ok" && record.status !== "error") ||
    !isRecord(classification) ||
    !isRecord(record.text) ||
    !Array.isArray(fields.numericSlots) ||
    !Array.isArray(fields.iconTags) ||
    !isRecord(record.source) ||
    typeof classification?.familyConfidence !== "number";

  if (!needsRepair) {
    return null;
  }

  return {
    jobId: typeof record.jobId === "string" ? record.jobId : requestJobId,
    artifactVersion: "vision-response-v1",
    status: record.status === "error" ? "error" : "ok",
    classification: readClassification(record.classification),
    text: readText(record.text),
    fields: {
      code: readNullableString(fields.code),
      costMarker: typeof fields.costMarker === "number" ? fields.costMarker : null,
      powerMarker: typeof fields.powerMarker === "number" ? fields.powerMarker : null,
      numericSlots: readNumberArray(fields.numericSlots),
      iconTags: readStringArray(fields.iconTags),
      rarity: readNullableString(fields.rarity),
      classTag: readNullableString(fields.classTag),
    },
    blocks: Array.isArray(record.blocks) ? record.blocks : [],
    uncertainSpans: Array.isArray(record.uncertainSpans) ? record.uncertainSpans : [],
    overallConfidence: typeof record.overallConfidence === "number" ? record.overallConfidence : 0,
    source: {
      provider,
      model,
    },
  };
}

function readClassification(value: unknown): VisionResponse["classification"] {
  if (!isRecord(value)) {
    return {
      cardTypeGuess: null,
      subtypeGuess: null,
      familyConfidence: 0,
    };
  }

  const fc = value.familyConfidence;
  let familyConf = 0;
  if (typeof fc === "number") {
    familyConf = fc;
  } else if (typeof fc === "string" && fc.length > 0) {
    const parsed = Number(fc);
    if (!Number.isNaN(parsed)) {
      familyConf = parsed;
    }
  }

  return {
    cardTypeGuess: typeof value.cardTypeGuess === "string" ? value.cardTypeGuess : null,
    subtypeGuess: typeof value.subtypeGuess === "string" ? value.subtypeGuess : null,
    familyConfidence: familyConf,
  };
}

function readText(value: unknown): VisionResponse["text"] {
  if (!isRecord(value)) {
    return {
      cardName: "unknown-card",
      rawText: "",
      normalizedText: "",
    };
  }

  return {
    cardName: typeof value.cardName === "string" ? value.cardName : "unknown-card",
    rawText: typeof value.rawText === "string" ? value.rawText : "",
    normalizedText: typeof value.normalizedText === "string" ? value.normalizedText : "",
  };
}

function readNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === "number") : [];
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
