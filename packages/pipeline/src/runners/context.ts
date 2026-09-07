import { loadProviderConfig, SiliconFlowProvider } from "@fd/providers";
import type { ModelProvider, ProviderRuntimeConfig } from "@fd/contracts";

export interface RunnerContext {
  configPath: string;
  providerConfig: ProviderRuntimeConfig;
  provider: ModelProvider;
}

export async function createRunnerContext(configPath: string): Promise<RunnerContext> {
  const providerConfig = await loadProviderConfig(configPath);

  if (providerConfig.provider !== "siliconflow") {
    throw new Error(`Unsupported provider: ${providerConfig.provider}`);
  }

  return {
    configPath,
    providerConfig,
    provider: new SiliconFlowProvider(providerConfig),
  };
}
