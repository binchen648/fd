import path from "node:path";

export function toFileStem(inputPath: string): string {
  return path.basename(inputPath, path.extname(inputPath));
}

export function toNamespace(sourceSet?: string, familyHint?: string): string {
  if (familyHint) {
    return familyHint;
  }

  return sourceSet ?? "unknown";
}
