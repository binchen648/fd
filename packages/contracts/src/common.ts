export type ArtifactVersion =
  | "vision-request-v1"
  | "vision-response-v1"
  | "structure-request-v1"
  | "structure-response-v1"
  | "guardrail-request-v1"
  | "guardrail-response-v1"
  | "batch-request-v1"
  | "batch-response-v1";

export type JobStatus =
  | "ok"
  | "error"
  | "approve"
  | "review"
  | "reject"
  | "partial_success";

export type AmbiguitySeverity = "low" | "medium" | "high";

export type ReviewDecision = "approve" | "review" | "reject";

export interface SourceRef {
  imagePath?: string;
  sourcePage?: string;
  imageSha256?: string;
  provider?: string;
  model?: string;
  requestId?: string;
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface TextBlock {
  kind: "title" | "subtitle" | "body" | "footer" | "icon" | "stat" | "unknown";
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface AmbiguityRecord {
  span: string;
  category: string;
  severity: AmbiguitySeverity;
  options: string[];
  recommendedAction: "continue" | "human_review" | "reject";
  notes?: string;
}

export interface CoverageReport {
  sourceClauses?: number;
  mappedClauses?: number;
  unmappedClauses?: number;
  originalClauses?: number;
  missingClauses?: number;
}

export interface NumericMarkerFields {
  code: string | null;
  costMarker: number | null;
  powerMarker: number | null;
  numericSlots: number[];
  iconTags: string[];
  rarity: string | null;
  classTag: string | null;
}

export interface SmokeTestSuggestion {
  name: string;
  setup: string;
  expect: string;
  source: "model" | "capability";
}
