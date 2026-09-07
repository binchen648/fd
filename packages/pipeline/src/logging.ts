import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type RequestLogStage = "vision" | "structure" | "guardrail" | "batch";
export type RequestLogKind = "request" | "response" | "error";

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function requestLogPath(stage: RequestLogStage, jobId: string, kind: RequestLogKind): string {
  return path.join("D:\\fd", "data", "logs", stage, `${sanitize(jobId)}.${kind}.json`);
}

export async function writeLogArtifact<T>(
  stage: RequestLogStage,
  jobId: string,
  kind: RequestLogKind,
  payload: T,
): Promise<string> {
  const filePath = requestLogPath(stage, jobId, kind);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}
