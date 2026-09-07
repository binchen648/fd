import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  GuardrailRequest,
  GuardrailResponse,
  ModelProvider,
  ProviderRuntimeConfig,
  StructuringRequest,
  StructuringResponse,
  VisionRequest,
  VisionResponse,
} from "@fd/contracts";
import { buildReviewMessages, buildStructureMessages, buildVisionMessages } from "./prompts";
import { ProviderError } from "./errors";
import { mergeSourceRef } from "./source-ref";

type ChatMessage = {
  role: "system" | "user";
  content: unknown;
};

type SiliconFlowChatRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  response_format?: {
    type: "json_object";
  };
};

type SiliconFlowChatResponse = {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

async function readApiKey(apiKeyFile: string): Promise<string> {
  const raw = await readFile(apiKeyFile, "utf8");
  return raw.trim();
}

async function readUtf8(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

const execFileAsync = promisify(execFile);

function mimeTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function toWebpBuffer(filePath: string): Promise<Buffer> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "fd-webp-"));
  const outPath = path.join(tempDir, "image.webp");

  try {
    await execFileAsync("magick", [filePath, outPath]);
    return await readFile(outPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function toImageDataUrl(filePath: string): Promise<string> {
  try {
    const webp = await toWebpBuffer(filePath);
    return `data:image/webp;base64,${webp.toString("base64")}`;
  } catch {
    const buffer = await readFile(filePath);
    const mimeType = mimeTypeFor(filePath);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }
}

async function postJson<T>(
  baseUrl: string,
  apiKey: string,
  timeoutMs: number,
  payload: SiliconFlowChatRequest,
): Promise<{ requestId?: string; data: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new ProviderError(
        "HTTP_ERROR",
        `SiliconFlow request failed: ${response.status} ${response.statusText}`,
        response.status >= 500 || response.status === 429,
        { status: response.status, responseBody },
      );
    }

    const requestId = response.headers.get("x-request-id") ?? undefined;
    const data = (await response.json()) as T;
    return requestId === undefined ? { data } : { requestId, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError("REQUEST_TIMEOUT", `SiliconFlow request timed out after ${timeoutMs}ms`, true, {
        timeoutMs,
      });
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function extractJsonContent(response: SiliconFlowChatResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new ProviderError(
      "RESPONSE_INVALID",
      "SiliconFlow response did not include message content",
      false,
    );
  }

  return content;
}

export class SiliconFlowProvider implements ModelProvider {
  readonly name = "siliconflow";

  constructor(private readonly config: ProviderRuntimeConfig) {}

  private async requestJson<T>(payload: SiliconFlowChatRequest, timeoutMs: number): Promise<{ requestId?: string; parsed: T }> {
    const apiKey = await readApiKey(this.config.auth.apiKeyFile);
    const { requestId, data } = await postJson<SiliconFlowChatResponse>(
      this.config.baseUrl,
      apiKey,
      timeoutMs,
      payload,
    );

    const rawContent = extractJsonContent(data);
    let parsed: T;

    try {
      parsed = JSON.parse(rawContent) as T;
    } catch (error) {
      throw new ProviderError(
        "JSON_PARSE_FAILED",
        error instanceof Error ? error.message : String(error),
        false,
      );
    }
    return requestId === undefined ? { parsed } : { requestId, parsed };
  }

  async runVision(input: VisionRequest): Promise<VisionResponse> {
    const timeoutMs = input.provider.timeoutMs ?? this.config.timeouts.visionMs;
    const imageDataUrl = await toImageDataUrl(input.input.imagePath);
    const { requestId, parsed } = await this.requestJson<VisionResponse>(
      {
        model: this.config.models.vision,
        messages: buildVisionMessages(input, imageDataUrl) as ChatMessage[],
        temperature: 0.1,
      },
      timeoutMs,
    );

    return {
      ...parsed,
      source: mergeSourceRef(
        parsed.source,
        requestId === undefined
          ? {
              provider: this.name,
              model: this.config.models.vision,
            }
          : {
              provider: this.name,
              model: this.config.models.vision,
              requestId,
            },
      ),
    };
  }

  async runStructure(input: StructuringRequest): Promise<StructuringResponse> {
    const timeoutMs = input.provider.timeoutMs ?? this.config.timeouts.structureMs;
    const visionArtifact = await readUtf8(input.input.visionResultPath);
    const { parsed } = await this.requestJson<StructuringResponse>(
      {
        model: this.config.models.structure,
        messages: buildStructureMessages(input, visionArtifact) as ChatMessage[],
        temperature: 0.1,
        response_format: { type: "json_object" },
      },
      timeoutMs,
    );

    return parsed;
  }

  async runReview(input: GuardrailRequest): Promise<GuardrailResponse> {
    const timeoutMs = input.provider.timeoutMs ?? this.config.timeouts.reviewMs;
    const visionArtifact = await readUtf8(input.input.visionResultPath);
    const structureArtifact = await readUtf8(input.input.structureResultPath);
    const { parsed } = await this.requestJson<GuardrailResponse>(
      {
        model: this.config.models.review,
        messages: buildReviewMessages(input, visionArtifact, structureArtifact) as ChatMessage[],
        temperature: 0.1,
        response_format: { type: "json_object" },
      },
      timeoutMs,
    );

    return parsed;
  }
}
