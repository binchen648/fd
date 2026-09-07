import { PipelineError, normalizePipelineError, type PipelineStage } from "./errors";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  stage: PipelineStage,
  backoffMs = 0,
): Promise<{ result: T; attempts: number }> {
  let attempt = 0;
  let lastError: PipelineError | undefined;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      const result = await fn();
      return { result, attempts: attempt };
    } catch (error) {
      lastError = normalizePipelineError(error, stage);

      if (!lastError.retryable || attempt >= maxAttempts) {
        break;
      }

      if (backoffMs > 0) {
        await sleep(backoffMs * attempt);
      }
    }
  }

  throw lastError ?? new PipelineError("UNKNOWN_ERROR", "Retry loop exited without result", stage, false);
}
