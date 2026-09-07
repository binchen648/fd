export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertString(value: unknown, field: string): asserts value is string {
  assert(typeof value === "string" && value.length > 0, `${field} must be a non-empty string`);
}

export function assertNumber(value: unknown, field: string): asserts value is number {
  assert(typeof value === "number" && Number.isFinite(value), `${field} must be a finite number`);
}

export function assertBoolean(value: unknown, field: string): asserts value is boolean {
  assert(typeof value === "boolean", `${field} must be a boolean`);
}

export function assertArray(value: unknown, field: string): asserts value is unknown[] {
  assert(Array.isArray(value), `${field} must be an array`);
}

export function assertObject(value: unknown, field: string): asserts value is Record<string, unknown> {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), `${field} must be an object`);
}
