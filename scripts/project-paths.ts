import path from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

export function resolveRepositoryPath(...segments: string[]): string {
  return path.resolve(repositoryRoot, ...segments);
}

export function pathSegments(filePath: string): string[] {
  return filePath.split(/[\\/]+/).filter(Boolean);
}

export function portableBasename(filePath: string): string {
  return pathSegments(filePath).at(-1) ?? "";
}

export function portableDirBasename(filePath: string): string {
  const segments = pathSegments(filePath);
  return segments.at(-2) ?? "";
}

export function portableStem(filePath: string): string {
  const basename = portableBasename(filePath);
  const extensionIndex = basename.lastIndexOf(".");
  return extensionIndex > 0 ? basename.slice(0, extensionIndex) : basename;
}
