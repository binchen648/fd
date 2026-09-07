import { readFile } from "node:fs/promises";
import type { ProviderRuntimeConfig } from "@fd/contracts";
import { validateProviderConfig } from "./config-validator";
import { ProviderError } from "./errors";

export async function loadProviderConfig(filePath: string): Promise<ProviderRuntimeConfig> {
  try {
    const raw = await readFile(filePath, "utf8");
    return validateProviderConfig(JSON.parse(raw));
  } catch (error) {
    throw new ProviderError(
      "CONFIG_INVALID",
      error instanceof Error ? error.message : String(error),
      false,
      { filePath },
    );
  }
}
