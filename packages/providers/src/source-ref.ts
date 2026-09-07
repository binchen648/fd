import type { SourceRef } from "@fd/contracts";

export interface SourceRefRuntimeFields {
  provider: string;
  model: string;
  requestId?: string;
}

export function mergeSourceRef(base: SourceRef | undefined, runtime: SourceRefRuntimeFields): SourceRef {
  const safeBase = isSourceRefRecord(base) ? base : undefined;
  const merged: SourceRef = {
    ...(safeBase ?? {}),
    provider: runtime.provider,
    model: runtime.model,
  };

  if (runtime.requestId !== undefined) {
    merged.requestId = runtime.requestId;
  }

  return merged;
}

function isSourceRefRecord(value: unknown): value is SourceRef {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
