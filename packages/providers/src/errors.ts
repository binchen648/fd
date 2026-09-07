export type ProviderErrorCode =
  | "CONFIG_INVALID"
  | "REQUEST_TIMEOUT"
  | "HTTP_ERROR"
  | "RESPONSE_INVALID"
  | "JSON_PARSE_FAILED"
  | "UNKNOWN_ERROR";

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
