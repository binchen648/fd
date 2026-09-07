import type { ArtifactVersion, JobStatus } from "./common";

export interface BatchRequest {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "batch-request-v1">;
  mode: "sample_validation" | "bulk_import" | "review_retry";
  inputs: string[];
  pipeline: Array<"vision" | "structure" | "guardrail">;
  failurePolicy: "stop_on_error" | "continue_collect_errors";
  retryPolicy?: {
    maxAttempts: number;
    retryableStages: Array<"vision" | "structure" | "guardrail">;
    backoffMs?: number;
  };
  timeoutOverridesMs?: Partial<Record<"vision" | "structure" | "guardrail", number>>;
}

export interface BatchArtifactResult {
  input: string;
  finalState:
    | "vision_done"
    | "structured"
    | "review_required"
    | "approved"
    | "rejected"
    | "error";
  attempts?: number;
  errorCode?: string;
  errorMessage?: string;
  visionPath?: string;
  structurePath?: string;
  guardrailPath?: string;
}

export interface BatchSummary {
  total: number;
  approved: number;
  reviewRequired: number;
  rejected: number;
}

export interface BatchResponse {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "batch-response-v1">;
  status: Extract<JobStatus, "ok" | "partial_success" | "error">;
  summary: BatchSummary;
  artifacts: BatchArtifactResult[];
  errorMessage?: string;
}
