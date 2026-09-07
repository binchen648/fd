import type {
  AmbiguityRecord,
  ArtifactVersion,
  JobStatus,
  NumericMarkerFields,
  SourceRef,
  TextBlock,
} from "./common";

export interface VisionRequestInput {
  imagePath: string;
  sourcePage?: string;
  sourceSet?: string;
  familyHint?: string;
  layoutHint?: string;
  language: string;
}

export interface AgentProviderSelection {
  name: string;
  model: string;
  mode: "economy" | "accuracy" | "review";
  timeoutMs?: number;
}

export interface VisionRequest {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "vision-request-v1">;
  input: VisionRequestInput;
  provider: AgentProviderSelection;
}

export interface VisionClassification {
  cardTypeGuess: string | null;
  subtypeGuess: string | null;
  familyConfidence: number;
}

export interface VisionTextPayload {
  cardName: string;
  rawText: string;
  normalizedText: string;
}

export interface VisionResponse {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "vision-response-v1">;
  status: Extract<JobStatus, "ok" | "error">;
  classification: VisionClassification;
  text: VisionTextPayload;
  fields: NumericMarkerFields;
  blocks: TextBlock[];
  uncertainSpans: AmbiguityRecord[];
  overallConfidence: number;
  source: SourceRef;
  errorMessage?: string;
}
