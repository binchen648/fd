import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import type { VisionResponse } from "@fd/contracts";

const execFileAsync = promisify(execFile);

export async function runLocalEasyOcrLines(imagePathOrBasename: string): Promise<string[]> {
  const scriptPath = path.join("D:/fd", "scripts", "local-easyocr-json.py");
  const { stdout } = await execFileAsync("python", ["-X", "utf8", scriptPath, imagePathOrBasename], {
    cwd: "D:/fd",
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
  });

  const parsed: unknown = JSON.parse(stdout.trim());
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Local EasyOCR did not return a string array");
  }

  return parsed;
}

export function buildVisionArtifactFromLocalOcr(input: {
  imagePath: string;
  pagePath: string;
  familyHint?: string;
  lines: string[];
}): VisionResponse {
  const normalizedLines = input.lines.map((line) => normalizeText(line)).filter((line) => line.length > 0);
  const joined = normalizedLines.join("\n");
  const cardName = detectCardName(normalizedLines);
  const numericRows = normalizedLines
    .flatMap((line) => parseNumericLine(line))
    .filter((value) => Number.isFinite(value))
    .map((value) => Number(value));
  const classTag = toClassTag(input.familyHint);

  return {
    jobId: `local-easyocr-${path.basename(input.imagePath, path.extname(input.imagePath))}`,
    artifactVersion: "vision-response-v1",
    status: "ok",
    classification: {
      cardTypeGuess: numericRows.length >= 8 ? "Servant" : "servant_skill",
      subtypeGuess: classTag,
      familyConfidence: 0.5,
    },
    text: {
      cardName,
      rawText: joined,
      normalizedText: normalizedLines.join(" "),
    },
    fields: {
      code: null,
      costMarker: null,
      powerMarker: null,
      numericSlots: numericRows,
      iconTags: [],
      rarity: null,
      classTag,
    },
    blocks: [],
    uncertainSpans: [],
    overallConfidence: 0.55,
    source: {
      imagePath: input.imagePath,
      sourcePage: input.pagePath,
      provider: "local-easyocr",
      model: "easyocr",
    },
  };
}

function detectCardName(lines: string[]): string {
  for (const line of lines) {
    if (isAttribute(line)) continue;
    if (/^\d+[A-Za-z]?$/.test(line)) continue;
    return line;
  }
  return lines[0] ?? "unnamed-card";
}

function parseNumericLine(line: string): number[] {
  const digits = line.match(/\d+/g);
  if (!digits) {
    return [];
  }

  return digits
    .map((token) => {
      const parsed = Number.parseInt(token, 10);
      if (!Number.isFinite(parsed)) {
        return Number.NaN;
      }

      if (parsed > 20) {
        return Number.parseInt(token.slice(0, 1), 10);
      }

      return parsed;
    })
    .filter((value) => Number.isFinite(value));
}

function isAttribute(value: string): boolean {
  return new Set(["力量", "敏捷", "魔术", "特殊", "宝具"]).has(value);
}

function toClassTag(familyHint?: string): string | null {
  if (!familyHint || familyHint.trim().length === 0) {
    return null;
  }
  return familyHint.charAt(0).toUpperCase() + familyHint.slice(1);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
