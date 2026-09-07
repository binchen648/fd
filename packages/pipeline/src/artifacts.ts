import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PipelineStage = "ocr" | "structured" | "guardrail";

export function artifactPath(stage: PipelineStage, namespace: string, fileStem: string): string {
  return path.join("D:\\fd", "data", "staged", stage, namespace, `${fileStem}.json`);
}

export async function ensureArtifactDir(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeJsonArtifact<T>(filePath: string, payload: T): Promise<void> {
  await ensureArtifactDir(filePath);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readJsonArtifact<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}
