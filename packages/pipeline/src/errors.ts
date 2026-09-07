export type PipelineStage = "vision" | "structure" | "guardrail" | "batch";

export type PipelineErrorCode =
  | "CONFIG_INVALID"
  | "MANIFEST_INVALID"
  | "REQUEST_TIMEOUT"
  | "HTTP_ERROR"
  | "RESPONSE_INVALID"
  | "JSON_PARSE_FAILED"
  | "UNSUPPORTED_PROVIDER"
  | "PROVIDER_CAPABILITY_MISSING"
  | "UNKNOWN_ERROR";

export class PipelineError extends Error {
  constructor(
    public readonly code: PipelineErrorCode,
    message: string,
    public readonly stage: PipelineStage,
    public readonly retryable: boolean,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

export function normalizePipelineError(error: unknown, stage: PipelineStage): PipelineError {
  if (error instanceof PipelineError) {
    return error;
  }

  if (typeof error === "object" && error !== null && "code" in error && "message" in error) {
    const maybe = error as {
      code?: unknown;
      message?: unknown;
      retryable?: unknown;
      details?: unknown;
    };

    if (typeof maybe.code === "string" && typeof maybe.message === "string") {
      return new PipelineError(
        [
          "CONFIG_INVALID",
          "MANIFEST_INVALID",
          "REQUEST_TIMEOUT",
          "HTTP_ERROR",
          "RESPONSE_INVALID",
          "JSON_PARSE_FAILED",
          "UNSUPPORTED_PROVIDER",
          "PROVIDER_CAPABILITY_MISSING",
          "UNKNOWN_ERROR",
        ].includes(maybe.code)
          ? (maybe.code as PipelineErrorCode)
          : "UNKNOWN_ERROR",
        maybe.message,
        stage,
        typeof maybe.retryable === "boolean" ? maybe.retryable : false,
        typeof maybe.details === "object" && maybe.details !== null
          ? (maybe.details as Record<string, unknown>)
          : undefined,
      );
    }
  }

  if (error instanceof Error) {
    return new PipelineError("UNKNOWN_ERROR", error.message, stage, false);
  }

  return new PipelineError("UNKNOWN_ERROR", String(error), stage, false);
}
