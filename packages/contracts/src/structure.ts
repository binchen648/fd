import type {
  AmbiguityRecord,
  ArtifactVersion,
  CoverageReport,
  JobStatus,
} from "./common";
import type { AgentProviderSelection } from "./vision";

export interface StructuringRequestInput {
  visionResultPath: string;
  schemaVersion: string;
  keywordDictionaryVersion: string;
  targetNamespace: string;
  familyHint?: string;
}

export interface StructuringRequest {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "structure-request-v1">;
  input: StructuringRequestInput;
  provider: AgentProviderSelection;
}

export interface RuleCondition {
  type: string;
  value?: string | number | boolean | null;
  values?: Array<string | number | boolean>;
}

export interface RuleTarget {
  type: string;
  value?: string | number | boolean | null;
}

export interface RuleEffect {
  type: string;
  value?: string | number | boolean | null;
  args?: Record<string, string | number | boolean | null | Array<string | number | boolean>>;
}

export interface StructuredCard {
  id: string;
  name: string;
  cardType: string;
  owner?: string;
  timing: string[];
  conditions: RuleCondition[];
  targets: RuleTarget[];
  effects: RuleEffect[];
  duration: string | null;
  visibility: string;
  tags: string[];
  ambiguities: AmbiguityRecord[];
}

export interface StructuringResponseSource {
  visionJobId: string;
  provider: string;
  model: string;
}

export interface StructuringResponse {
  jobId: string;
  artifactVersion: Extract<ArtifactVersion, "structure-response-v1">;
  status: Extract<JobStatus, "ok" | "error">;
  card: StructuredCard;
  parseNotes: string[];
  coverage: CoverageReport;
  source: StructuringResponseSource;
  errorMessage?: string;
}
