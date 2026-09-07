import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ReplayScenarioInput } from "./replay";

export interface ScenarioMatrixCase {
  label: string;
  baselinePath: string;
  candidatePath: string;
  expectedIdentical: boolean;
}

export interface ScenarioMatrixConfig {
  scenarios: ScenarioMatrixCase[];
  generatedScenarioDirs?: string[];
}

interface GeneratedScenarioMatrixManifest {
  comparisons: ScenarioMatrixCase[];
}

export async function readScenario(filePath: string): Promise<ReplayScenarioInput> {
  const raw = await readFile(resolve(filePath), "utf8");
  return JSON.parse(raw) as ReplayScenarioInput;
}

export async function loadScenarioMatrix(filePath: string): Promise<ScenarioMatrixCase[]> {
  const raw = await readFile(resolve(filePath), "utf8");
  const config = JSON.parse(raw) as ScenarioMatrixConfig;
  const generatedEntries = await loadGeneratedScenarioEntries(config.generatedScenarioDirs ?? []);

  return config.scenarios.concat(generatedEntries);
}

async function loadGeneratedScenarioEntries(rootDirs: string[]): Promise<ScenarioMatrixCase[]> {
  const entries = await Promise.all(rootDirs.map((rootDir) => loadGeneratedScenarioEntriesFromDir(rootDir)));
  return entries.flat();
}

async function loadGeneratedScenarioEntriesFromDir(rootDir: string): Promise<ScenarioMatrixCase[]> {
  const manifestEntries = await loadGeneratedManifestEntries(rootDir);
  const manifestManagedCandidatePaths = new Set(manifestEntries.map((entry) => resolve(entry.candidatePath)));
  const scenarioPaths = await collectScenarioPaths(rootDir);
  const unmanagedScenarioPaths = scenarioPaths.filter(
    (scenarioPath) => !manifestManagedCandidatePaths.has(resolve(scenarioPath)),
  );

  return manifestEntries.concat(
    unmanagedScenarioPaths.map((scenarioPath) => ({
      label: `generated-${toScenarioMatrixLabel(rootDir, scenarioPath)}-self`,
      baselinePath: scenarioPath,
      candidatePath: scenarioPath,
      expectedIdentical: true,
    })),
  );
}

async function loadGeneratedManifestEntries(rootDir: string): Promise<ScenarioMatrixCase[]> {
  const manifestPaths = await collectManifestPaths(rootDir);
  const manifests = await Promise.all(manifestPaths.map(async (manifestPath) => {
    const raw = await readFile(resolve(manifestPath), "utf8");
    return JSON.parse(raw) as GeneratedScenarioMatrixManifest;
  }));

  return manifests.flatMap((manifest) => manifest.comparisons);
}

async function collectScenarioPaths(rootDir: string): Promise<string[]> {
  let dirEntries;

  try {
    dirEntries = await readdir(rootDir, { withFileTypes: true });
  } catch (error) {
    if (isMissingDirectoryError(error)) {
      return [];
    }

    throw error;
  }

  const nestedEntries = await Promise.all(
    dirEntries.map(async (entry) => {
      const entryPath = resolve(rootDir, entry.name);

      if (entry.isDirectory()) {
        return collectScenarioPaths(entryPath);
      }

      if (entry.isFile() && entry.name.endsWith(".json") && !entry.name.endsWith(".matrix.json")) {
        return [entryPath];
      }

      return [];
    }),
  );

  return nestedEntries.flat().sort();
}

async function collectManifestPaths(rootDir: string): Promise<string[]> {
  let dirEntries;

  try {
    dirEntries = await readdir(rootDir, { withFileTypes: true });
  } catch (error) {
    if (isMissingDirectoryError(error)) {
      return [];
    }

    throw error;
  }

  const nestedEntries = await Promise.all(
    dirEntries.map(async (entry) => {
      const entryPath = resolve(rootDir, entry.name);

      if (entry.isDirectory()) {
        return collectManifestPaths(entryPath);
      }

      if (entry.isFile() && entry.name.endsWith(".matrix.json")) {
        return [entryPath];
      }

      return [];
    }),
  );

  return nestedEntries.flat().sort();
}

function toScenarioMatrixLabel(rootDir: string, scenarioPath: string): string {
  const relativePath = scenarioPath.slice(resolve(rootDir).length).replace(/^[/\\]+/, "");

  return relativePath
    .replace(/\.json$/i, "")
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isMissingDirectoryError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
}
