import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { GuardrailResponse, SmokeTestSuggestion, StructuredCard, StructuringResponse } from "../packages/contracts/src";
import {
  artifactPath,
  readJsonArtifact,
  repairStructureResponse,
  validateGuardrailResponse,
  validateStructureResponse,
  writeJsonArtifact,
} from "../packages/pipeline/src";
import type { ReplayScenarioInput, ScenarioMatrixCase } from "../packages/rules/src/index";

export const DEFAULT_SCENARIO_TEMPLATE_PATHS = {
  default: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\minimal-7p-seeded-scenario.json",
  event: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\shinto-hidden-event-scenario.json",
  moon: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\moon-holy-grail-threshold-scenario.json",
  situation: "D:\\fd\\packages\\rules\\src\\data\\scenarios\\climax-situation-card.json",
} as const;

export const DEFAULT_OUTPUT_ROOT_DIR = "D:\\fd\\data\\staged\\generated-scenarios";

export interface SmokeScenarioExportInput {
  namespace: string;
  fileStem: string;
  structuredCard: StructuredCard;
  smokeTests: SmokeTestSuggestion[];
  outputRootDir?: string;
}

export interface SmokeScenarioExport {
  smokeTest: SmokeTestSuggestion;
  templatePath: string;
  templateScenario: ReplayScenarioInput;
  outputPath: string;
  scenario: ReplayScenarioInput;
  familyLabel: string;
}

interface GeneratedScenarioMatrixManifest {
  comparisons: ScenarioMatrixCase[];
}

export function selectTemplateScenarioPath(
  structuredCard: StructuredCard,
  smokeTest: SmokeTestSuggestion,
): string {
  if (isMoonRelated(structuredCard, smokeTest)) {
    return DEFAULT_SCENARIO_TEMPLATE_PATHS.moon;
  }

  if (structuredCard.cardType === "situation") {
    return DEFAULT_SCENARIO_TEMPLATE_PATHS.situation;
  }

  if (structuredCard.cardType === "event") {
    return DEFAULT_SCENARIO_TEMPLATE_PATHS.event;
  }

  return DEFAULT_SCENARIO_TEMPLATE_PATHS.default;
}

export function buildSmokeScenario(args: {
  namespace: string;
  fileStem: string;
  structuredCard: StructuredCard;
  smokeTest: SmokeTestSuggestion;
  templateScenario: ReplayScenarioInput;
}): ReplayScenarioInput {
  const scenario = cloneScenario(args.templateScenario);
  const smokeName = slugify(args.smokeTest.name);

  scenario.id = `smoke-${slugify(args.namespace)}-${slugify(args.fileStem)}-${smokeName}`;
  scenario.seed = `smoke-seed-${slugify(args.namespace)}-${slugify(args.fileStem)}-${smokeName}`;

  if (args.structuredCard.cardType === "situation") {
    scenario.steps = scenario.steps.map((step, index) => {
      if (index !== 0 || step.type !== "apply_situation") {
        return step;
      }

      return {
        ...step,
        card: {
          ...step.card,
          cardId: args.structuredCard.id,
        },
      };
    });
  }

  if (args.structuredCard.cardType === "event") {
    applyEventScenarioSemantics(scenario, args.structuredCard);
  }

  // Apply master/servant card semantics - inject effects into initial state
  if (args.structuredCard.cardType === "master_skill" || args.structuredCard.cardType === "servant_skill") {
    applyMasterServantScenarioSemantics(scenario, args.structuredCard);
    ensureScenarioEffectWindows(scenario, args.structuredCard.timing);
  }

  return scenario;
}

export function buildSmokeScenarioExports(
  input: SmokeScenarioExportInput,
  templatesByPath: Record<string, ReplayScenarioInput>,
): SmokeScenarioExport[] {
  const outputRootDir = input.outputRootDir ?? DEFAULT_OUTPUT_ROOT_DIR;

  return input.smokeTests.map((smokeTest) => {
    const templatePath = selectTemplateScenarioPath(input.structuredCard, smokeTest);
    const templateScenario = templatesByPath[templatePath];

    if (!templateScenario) {
      throw new Error(`Missing scenario template: ${templatePath}`);
    }

    return {
      smokeTest,
      templatePath,
      templateScenario,
      outputPath: path.join(outputRootDir, input.namespace, `${input.fileStem}--${slugify(smokeTest.name)}.json`),
      familyLabel: slugify(normalizeCardFamily(input.structuredCard.cardType, input.namespace)),
      scenario: buildSmokeScenario({
        namespace: input.namespace,
        fileStem: input.fileStem,
        structuredCard: input.structuredCard,
        smokeTest,
        templateScenario,
      }),
    };
  });
}

export function buildGeneratedScenarioMatrixEntries(
  exports: SmokeScenarioExport[],
): ScenarioMatrixCase[] {
  return exports.map((entry) => ({
    label: `generated-${toGeneratedComparisonLabel(entry.outputPath, entry.familyLabel)}-candidate`,
    baselinePath: entry.templatePath,
    candidatePath: entry.outputPath,
    expectedIdentical: areReplayComparableContentsEqual(entry.templateScenario, entry.scenario),
  }));
}

export function normalizeStructuredResponseForSmokeExport(
  input: StructuringResponse,
): StructuringResponse {
  return validateStructureResponse(
    repairStructureResponse(
      input,
      input.jobId,
      input.source.provider,
      input.source.model,
    ) ?? input,
  );
}

async function main() {
  const namespace = process.argv[2];
  const fileStem = process.argv[3];
  const outputRootDir = process.argv[4] ?? DEFAULT_OUTPUT_ROOT_DIR;

  if (!namespace || !fileStem) {
    throw new Error("Usage: tsx scripts/export-smoke-scenarios.ts <namespace> <fileStem> [outputRootDir]");
  }

  const structured = normalizeStructuredResponseForSmokeExport(
    await readJsonArtifact<StructuringResponse>(artifactPath("structured", namespace, fileStem)),
  );
  const guardrail = validateGuardrailResponse(
    await readJsonArtifact<GuardrailResponse>(artifactPath("guardrail", namespace, fileStem)),
  );

  const templatePaths = Array.from(
    new Set(guardrail.smokeTests.map((smokeTest) => selectTemplateScenarioPath(structured.card, smokeTest))),
  );
  const templatesByPath = Object.fromEntries(
    await Promise.all(templatePaths.map(async (templatePath) => [templatePath, await readScenarioTemplate(templatePath)])),
  ) as Record<string, ReplayScenarioInput>;

  const scenarioExports = buildSmokeScenarioExports(
    {
      namespace,
      fileStem,
      structuredCard: structured.card,
      smokeTests: guardrail.smokeTests,
      outputRootDir,
    },
    templatesByPath,
  );

  await Promise.all(
    scenarioExports.map((entry) => writeJsonArtifact(entry.outputPath, entry.scenario)),
  );

  const manifestPath = path.join(outputRootDir, namespace, `${fileStem}.matrix.json`);
  const manifest: GeneratedScenarioMatrixManifest = {
    comparisons: buildGeneratedScenarioMatrixEntries(scenarioExports),
  };
  await writeJsonArtifact(manifestPath, manifest);

  console.log(
    JSON.stringify(
      {
        namespace,
        fileStem,
        exported: scenarioExports.length,
        manifestPath,
        scenarios: scenarioExports.map((entry) => ({
          smokeTest: entry.smokeTest.name,
          templatePath: entry.templatePath,
          outputPath: entry.outputPath,
          scenarioId: entry.scenario.id,
        })),
      },
      null,
      2,
    ),
  );
}

async function readScenarioTemplate(filePath: string): Promise<ReplayScenarioInput> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ReplayScenarioInput;
}

function applyEventScenarioSemantics(
  scenario: ReplayScenarioInput,
  structuredCard: StructuredCard,
): void {
  const battleModifiers = buildEventBattleModifiers(structuredCard);
  const placement = scenario.initialState.eventPlacements[0];

  if (placement) {
    scenario.initialState.eventPlacements[0] = {
      ...placement,
      eventCardId: structuredCard.id,
      ...(battleModifiers.length > 0 ? { battleModifiers } : {}),
    };
  } else {
    scenario.initialState.eventPlacements.push({
      locationId: "shinto",
      eventCardId: structuredCard.id,
      visibility: {
        scope: "hidden_until_trigger",
      },
      ...(battleModifiers.length > 0 ? { battleModifiers } : {}),
    });
  }

  const supportedTags = battleModifiers.map((modifier) => modifier.targetTag);
  scenario.steps = scenario.steps.map((step, index) => {
    if (index !== 0 || step.type !== "resolve_battle") {
      return step;
    }

    if (supportedTags.length === 0) {
      return {
        ...step,
        revealHiddenEvents: true,
      };
    }

    const [first, second, ...rest] = step.participants ?? [];

    return {
      ...step,
      revealHiddenEvents: true,
      participants: [
        {
          playerId: first?.playerId ?? "p1",
          totalPower: first?.totalPower ?? 6,
          attackTags: supportedTags,
        },
        {
          playerId: second?.playerId ?? "p2",
          totalPower: second?.totalPower ?? 4,
          attackTags: [],
        },
        ...rest,
      ],
    };
  });
}

function buildEventBattleModifiers(structuredCard: StructuredCard): Array<{
  sourceId: string;
  targetTag: string;
  value: number;
}> {
  return structuredCard.effects.flatMap((effect) => {
    if (effect.type !== "battle_power_bonus_if_shared_attribute") {
      return [];
    }

    const targetTag = typeof effect.args?.targetTag === "string"
      ? effect.args.targetTag
      : typeof effect.args?.attribute === "string"
        ? effect.args.attribute
        : "magic";
    const value = typeof effect.args?.value === "number"
      ? effect.args.value
      : typeof effect.value === "number"
        ? effect.value
        : 2;

    return [{
      sourceId: structuredCard.id,
      targetTag,
      value,
    }];
  });
}

function applyMasterServantScenarioSemantics(
  scenario: ReplayScenarioInput,
  structuredCard: StructuredCard,
): void {
  // For master/servant cards, inject effects as effect stack entries
  // This makes the scenario different from the baseline (expectedIdentical: false)
  
  const effectStackEntries = structuredCard.effects.map((effect, index) => ({
    sourceCardId: structuredCard.id,
    controllerPlayerId: "p1",
    effect: {
      id: `effect-${index}-${structuredCard.id}`,
      timing: structuredCard.timing[0] ?? "action",
      handler: effect.type,
      ...(buildReplayEffectPayload(effect, structuredCard) && {
        payload: buildReplayEffectPayload(effect, structuredCard),
      }),
    },
  }));

  if (effectStackEntries.length > 0) {
    scenario.initialState.effectStack = [
      ...(scenario.initialState.effectStack ?? []),
      ...effectStackEntries,
    ];
  }

  // Also add card to the cards array for tracking
  scenario.initialState.cards.push({
    cardId: structuredCard.id,
    ownerPlayerId: "p1",
    location: "hand",
    visibility: "private",
  });
}

const timingWindowOrder = [
  "round_start",
  "preparation",
  "advance",
  "action",
  "battle",
  "after_battle",
  "cleanup",
  "round_end",
] as const;

function ensureScenarioEffectWindows(
  scenario: ReplayScenarioInput,
  timings: StructuredCard["timing"],
): void {
  const uniqueTimings = Array.from(new Set(timings))
    .filter((timing) => timingWindowOrder.includes(timing as typeof timingWindowOrder[number]))
    .sort((left, right) => timingWindowOrder.indexOf(left) - timingWindowOrder.indexOf(right));

  for (const timing of uniqueTimings) {
    const exists = scenario.steps.some(
      (step) => step.type === "resolve_effects" && step.window === timing,
    );

    if (exists) {
      continue;
    }

    const insertIndex = findEffectWindowInsertIndex(scenario.steps, timing);
    scenario.steps.splice(insertIndex, 0, {
      type: "resolve_effects",
      window: timing,
    });
  }
}

function findEffectWindowInsertIndex(
  steps: ReplayScenarioInput["steps"],
  timing: StructuredCard["timing"][number],
): number {
  if (timing === "round_start") {
    const firstPhaseStepIndex = steps.findIndex((step) => step.type === "step_phase");
    return firstPhaseStepIndex === -1 ? 0 : firstPhaseStepIndex;
  }

  if (timing === "preparation" || timing === "advance") {
    const phaseStepTarget = timing === "preparation" ? 1 : 2;
    let seenPhaseSteps = 0;

    for (let index = 0; index < steps.length; index += 1) {
      if (steps[index]?.type !== "step_phase") {
        continue;
      }

      seenPhaseSteps += 1;
      if (seenPhaseSteps === phaseStepTarget) {
        return index + 1;
      }
    }
  }

  if (timing === "action") {
    const actionWindowIndex = steps.findIndex(
      (step) => step.type === "resolve_effects" && step.window === "action",
    );
    if (actionWindowIndex !== -1) {
      return actionWindowIndex;
    }
  }

  if (timing === "battle") {
    const battleIndex = steps.findIndex((step) => step.type === "resolve_battle");
    return battleIndex === -1 ? steps.length : battleIndex;
  }

  if (timing === "after_battle") {
    const battleIndex = steps.findIndex((step) => step.type === "resolve_battle");
    return battleIndex === -1 ? steps.length : battleIndex + 1;
  }

  if (timing === "cleanup") {
    const scoringIndex = steps.findIndex((step) => step.type === "apply_scoring");
    return scoringIndex === -1 ? steps.length : scoringIndex;
  }

  return steps.findIndex((step) => step.type === "resolve_battle") !== -1
    ? steps.findIndex((step) => step.type === "resolve_battle")
    : steps.length;
}

function buildReplayEffectPayload(
  effect: StructuredCard["effects"][number],
  structuredCard: StructuredCard,
): Record<string, unknown> | undefined {
  if (effect.type === "swap_master_identity" || effect.type === "swap_servant_identity") {
    return {
      targetPlayerId: "p1",
      ...(effect.args ?? {}),
    };
  }

  if (effect.args) {
    return effect.args;
  }

  if (effect.type === "gain_mana" && typeof effect.value === "number") {
    return { amount: effect.value };
  }

  if (effect.type === "gain_card" && typeof effect.value === "string") {
    return { cardName: effect.value };
  }

  if (effect.type === "lose_command_spell") {
    return { amount: typeof effect.value === "number" ? effect.value : 1 };
  }

  if (effect.value !== undefined) {
    return { value: effect.value };
  }

  if (structuredCard.targets.some((target) => target.type === "self_player")) {
    return { targetPlayerId: "p1" };
  }

  return undefined;
}

function isMoonRelated(structuredCard: StructuredCard, smokeTest: SmokeTestSuggestion): boolean {
  const fields = [
    structuredCard.name,
    structuredCard.cardType,
    ...structuredCard.tags,
    ...structuredCard.conditions.map((condition) => `${condition.type}:${String(condition.value ?? "")}`),
    smokeTest.name,
    smokeTest.setup,
    smokeTest.expect,
  ];
  const haystack = fields.join(" ").toLowerCase();

  return haystack.includes("moon_holy_grail") || haystack.includes("moon holy grail");
}

function cloneScenario(templateScenario: ReplayScenarioInput): ReplayScenarioInput {
  return JSON.parse(JSON.stringify(templateScenario)) as ReplayScenarioInput;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCardFamily(cardType: string | undefined, namespace: string): string {
  if (cardType === "servant") {
    return "servant_skill";
  }

  if (cardType === "master") {
    return "master_skill";
  }

  return cardType || namespace;
}

function areReplayComparableContentsEqual(
  baseline: ReplayScenarioInput,
  candidate: ReplayScenarioInput,
): boolean {
  return JSON.stringify({ initialState: baseline.initialState, steps: baseline.steps })
    === JSON.stringify({ initialState: candidate.initialState, steps: candidate.steps });
}

function toGeneratedComparisonLabel(outputPath: string, familyLabel?: string): string {
  const parsed = path.parse(outputPath);
  return `${familyLabel ?? slugify(path.basename(parsed.dir))}-${slugify(parsed.name)}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
