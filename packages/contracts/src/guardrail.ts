import type {
  ArtifactVersion,
  CoverageReport,
  JobStatus,
  ReviewDecision,
  SmokeTestSuggestion,
} from "./common";
import type { AgentProviderSelection } from "./vision";

export interface GuardrailRequestInput {
  visionResultPath: string;
  structureResultPath: string;
  schemaVersion: string;
  engineCapabilityVersion: string;
}

export interface GuardrailRequest {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "guardrail-request-v1">;
  input: GuardrailRequestInput;
  provider: AgentProviderSelection;
}

export interface GuardrailIssue {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  fieldPath?: string;
}

export interface GuardrailResponseSource {
  structureJobId: string;
  provider: string;
  model: string;
}

export interface GuardrailResponse {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "guardrail-response-v1">;
  status: Extract<JobStatus, "approve" | "review" | "reject" | "error">;
  schemaOk: boolean;
  engineOk: boolean;
  decision: ReviewDecision;
  ambiguityLevel: "low" | "medium" | "high";
  coverageReport: CoverageReport;
  issues: GuardrailIssue[];
  requiredHumanReview: boolean;
  smokeTests: SmokeTestSuggestion[];
  source: GuardrailResponseSource;
  errorMessage?: string;
}
