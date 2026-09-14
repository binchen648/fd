import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SmokeTestSuggestion } from "@fd/contracts";
import type { StructuredCard } from "@fd/contracts";
import type { ReplayScenarioInput } from "../../../../packages/rules/src/index";
import type { ScenarioMatrixCase } from "../../../../packages/rules/src/index";
import { describe, expect, it } from "vitest";

import {
  buildSmokeScenario,
  buildSmokeScenarioExports,
  buildGeneratedScenarioMatrixEntries,
  DEFAULT_OUTPUT_ROOT_DIR,
  DEFAULT_SCENARIO_TEMPLATE_PATHS,
  normalizeStructuredResponseForSmokeExport,
  selectTemplateScenarioPath,
} from "../../../../scripts/export-smoke-scenarios";

function readScenarioFixture(filePath: string): ReplayScenarioInput {
  return JSON.parse(readFileSync(filePath, "utf8")) as ReplayScenarioInput;
}

const scenarioDir = join(__dirname, "../../../../packages/rules/src/data/scenarios");

const defaultTemplate = readScenarioFixture(join(scenarioDir, "minimal-7p-seeded-scenario.json"));
const moonTemplate = readScenarioFixture(join(scenarioDir, "moon-holy-grail-threshold-scenario.json"));
const situationTemplate = readScenarioFixture(join(scenarioDir, "climax-situation-card.json"));
const eventTemplate = readScenarioFixture(join(scenarioDir, "shinto-hidden-event-scenario.json"));

describe("export smoke scenarios bridge", () => {
  it("selects the moon template when the card touches moon-holy-grail review territory", () => {
    const card: StructuredCard = {
      id: "card-moon-001",
      name: "Moon Review Card",
      cardType: "master_skill",
      timing: ["battle"],
      conditions: [{ type: "location_is", value: "moon_holy_grail" }],
      targets: [],
      effects: [],
      duration: null,
      visibility: "public",
      tags: ["moon_holy_grail"],
      ambiguities: [],
    };
    const smokeTest: SmokeTestSuggestion = {
      name: "capability_review_tag_card_tags",
      setup: "Construct a seeded scenario that exercises moon_holy_grail.",
      expect: "Guardrail keeps the card in review_required.",
      source: "capability",
    };

    expect(selectTemplateScenarioPath(card, smokeTest)).toBe(DEFAULT_SCENARIO_TEMPLATE_PATHS.moon);
  });

  it("injects the structured situation card id into the generated scenario", () => {
    const card: StructuredCard = {
      id: "situation-climax-001",
      name: "Climax Situation",
      cardType: "situation",
      timing: ["preparation"],
      conditions: [],
      targets: [],
      effects: [],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    };
    const smokeTest: SmokeTestSuggestion = {
      name: "base_smoke",
      setup: "Apply the generated situation in a seeded scenario.",
      expect: "Replay remains runnable.",
      source: "model",
    };

    const scenario = buildSmokeScenario({
      namespace: "situation",
      fileStem: "card-climax-sample",
      structuredCard: card,
      smokeTest,
      templateScenario: situationTemplate,
    });

    expect(scenario.id).toBe("smoke-situation-card-climax-sample-base-smoke");
    expect(scenario.seed).toBe("smoke-seed-situation-card-climax-sample-base-smoke");
    expect(scenario.steps[0]).toMatchObject({
      type: "apply_situation",
      card: {
        cardId: "situation-climax-001",
      },
    });
  });

  it("injects event placement semantics and battle tags for event smoke scenarios", () => {
    const card: StructuredCard = {
      id: "event.shared-focus",
      name: "Shared Focus",
      cardType: "event",
      timing: ["battle"],
      conditions: [],
      targets: [],
      effects: [
        {
          type: "battle_power_bonus_if_shared_attribute",
          args: {
            targetTag: "focus",
            value: 2,
          },
        },
      ],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    };
    const smokeTest: SmokeTestSuggestion = {
      name: "event_shared_focus",
      setup: "Preserve the event in a seeded battlefield scenario.",
      expect: "Replay captures the event modifier in battle resolution.",
      source: "model",
    };

    const scenario = buildSmokeScenario({
      namespace: "event",
      fileStem: "shared-focus-sample",
      structuredCard: card,
      smokeTest,
      templateScenario: eventTemplate,
    });

    expect(scenario.initialState.eventPlacements[0]).toMatchObject({
      locationId: "shinto",
      eventCardId: "event.shared-focus",
      battleModifiers: [
        {
          sourceId: "event.shared-focus",
          targetTag: "focus",
          value: 2,
        },
      ],
    });
    expect(scenario.steps[0]).toMatchObject({
      type: "resolve_battle",
      battlefieldId: "shinto",
      participants: [
        {
          playerId: "p1",
          attackTags: ["focus"],
        },
        {
          playerId: "p2",
          attackTags: [],
        },
      ],
    });
  });

  it("normalizes synergy event structure before smoke export so battle semantics can be injected", () => {
    const normalized = normalizeStructuredResponseForSmokeExport({
      jobId: "structure-event-synergy-001",
      artifactVersion: "structure-response-v1",
      status: "ok",
      card: {
        id: "event.synergy",
        name: "协同",
        cardType: "event",
        timing: ["passive"],
        conditions: [],
        targets: [],
        effects: [],
        duration: null,
        visibility: "public",
        tags: ["event"],
        ambiguities: [
          {
            span: "合计威力＋4",
            category: "effect_mapping",
            severity: "medium",
            options: [],
            recommendedAction: "human_review",
            notes: "Could not map effect clause to a supported engine effect.",
          },
          {
            span: "于此战场的玩家，其所有攻击若至少有一种属性相同",
            category: "effect_mapping",
            severity: "medium",
            options: [],
            recommendedAction: "human_review",
            notes: "Could not map condition clause to a supported engine predicate.",
          },
          {
            span: "target-0",
            category: "effect_mapping",
            severity: "medium",
            options: [],
            recommendedAction: "human_review",
            notes: "Could not map target '玩家的所有攻击' to a supported engine target.",
          },
        ],
      },
      parseNotes: [],
      coverage: {
        sourceClauses: 1,
        mappedClauses: 1,
        unmappedClauses: 0,
      },
      source: {
        visionJobId: "vision-event-synergy-001",
        provider: "siliconflow",
        model: "Qwen/Qwen3-VL-235B-A22B-Thinking",
      },
    });

    expect(normalized.card.timing).toEqual(["battle"]);
    expect(normalized.card.targets).toEqual([{ type: "self_battlefield" }]);
    expect(normalized.card.effects).toEqual([
      { type: "battle_power_bonus_if_shared_attribute", value: 4 },
    ]);
    expect(normalized.card.ambiguities).toEqual([]);
  });

  it("preserves existing battle attack tags when an event has no injectable battle modifiers", () => {
    const card: StructuredCard = {
      id: "event.reality-marble",
      name: "Reality Marble",
      cardType: "event",
      timing: ["battle"],
      conditions: [],
      targets: [{ type: "self_battlefield" }],
      effects: [
        {
          type: "forbid_special_attack_on_battlefield",
          value: true,
        },
        {
          type: "lock_battlefield_movement",
          value: "all_players",
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["restriction"],
      ambiguities: [],
    };
    const smokeTest: SmokeTestSuggestion = {
      name: "event_restriction_preserves_template_context",
      setup: "Run the hidden event battle scenario without discarding baseline attack tags.",
      expect: "Replay keeps the template attack context while still injecting the event card.",
      source: "model",
    };
    const templateScenario: ReplayScenarioInput = {
      ...eventTemplate,
      steps: [
        {
          type: "resolve_battle",
          battlefieldId: "shinto",
          revealHiddenEvents: false,
          participants: [
            {
              playerId: "p1",
              totalPower: 6,
              attackTags: ["special", "arcane"],
            },
            {
              playerId: "p2",
              totalPower: 4,
              attackTags: ["guard"],
            },
          ],
        },
        ...eventTemplate.steps.slice(1),
      ],
    };

    const scenario = buildSmokeScenario({
      namespace: "event",
      fileStem: "reality-marble-sample",
      structuredCard: card,
      smokeTest,
      templateScenario,
    });

    expect(scenario.steps[0]).toMatchObject({
      type: "resolve_battle",
      revealHiddenEvents: true,
      participants: [
        {
          playerId: "p1",
          attackTags: ["special", "arcane"],
        },
        {
          playerId: "p2",
          attackTags: ["guard"],
        },
      ],
    });
  });

  it("appends master skill semantics instead of overwriting the template effect stack", () => {
    const card: StructuredCard = {
      id: "master.mana.001",
      name: "Mana Burst",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "gain_mana",
          args: { amount: 2 },
        },
      ],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    };
    const smokeTest: SmokeTestSuggestion = {
      name: "capability_approve_gain_mana_card_effects_0_type",
      setup: "Run a seeded scenario where the controlling player resolves gain_mana.",
      expect: "Replay keeps the template stack and appends the injected semantic effect.",
      source: "capability",
    };

    const scenario = buildSmokeScenario({
      namespace: "master_skill",
      fileStem: "mana-burst",
      structuredCard: card,
      smokeTest,
      templateScenario: defaultTemplate,
    });

    expect(scenario.initialState.effectStack).toHaveLength(2);
    expect(scenario.initialState.effectStack[0]).toEqual(defaultTemplate.initialState.effectStack[0]);
    expect(scenario.initialState.effectStack[1]).toMatchObject({
      sourceCardId: "master.mana.001",
      controllerPlayerId: "p1",
      effect: {
        timing: "action",
        handler: "gain_mana",
        payload: { amount: 2 },
      },
    });

    expect(buildGeneratedScenarioMatrixEntries([
      {
        smokeTest,
        templatePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
        templateScenario: defaultTemplate,
        outputPath: join(DEFAULT_OUTPUT_ROOT_DIR, "master_skill", "mana-burst--capability_approve_gain_mana_card_effects_0_type.json"),
        familyLabel: "master-skill",
        scenario,
      },
    ])).toEqual([
      {
        label: "generated-master-skill-mana-burst-capability-approve-gain-mana-card-effects-0-type-candidate",
        baselinePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
        candidatePath: join(DEFAULT_OUTPUT_ROOT_DIR, "master_skill", "mana-burst--capability_approve_gain_mana_card_effects_0_type.json"),
        expectedIdentical: false,
      },
    ]);
  });

  it("inserts missing effect windows for master skill timings before action resolution", () => {
    const card: StructuredCard = {
      id: "master.advance.001",
      name: "Advance Burst",
      cardType: "master_skill",
      timing: ["advance"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "gain_mana",
          value: 1,
        },
      ],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    };
    const smokeTest: SmokeTestSuggestion = {
      name: "capability_approve_gain_mana_card_effects_0_type",
      setup: "Resolve gain_mana during the advance window.",
      expect: "The generated scenario inserts an advance effect window before action resolution.",
      source: "capability",
    };

    const scenario = buildSmokeScenario({
      namespace: "master_skill",
      fileStem: "advance-burst",
      structuredCard: card,
      smokeTest,
      templateScenario: defaultTemplate,
    });

    const advanceWindowIndex = scenario.steps.findIndex(
      (step) => step.type === "resolve_effects" && step.window === "advance",
    );
    const actionWindowIndex = scenario.steps.findIndex(
      (step) => step.type === "resolve_effects" && step.window === "action",
    );

    expect(advanceWindowIndex).toBeGreaterThan(-1);
    expect(actionWindowIndex).toBeGreaterThan(-1);
    expect(advanceWindowIndex).toBeLessThan(actionWindowIndex);
  });

  it("builds one runnable export per smoke test with deterministic output paths", () => {
    const card: StructuredCard = {
      id: "master-skill-001",
      name: "Guardrail Candidate",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [],
      effects: [],
      duration: null,
      visibility: "public",
      tags: [],
      ambiguities: [],
    };
    const smokeTests: SmokeTestSuggestion[] = [
      {
        name: "base_smoke",
        setup: "Run baseline smoke scenario.",
        expect: "Replay remains runnable.",
        source: "model",
      },
      {
        name: "capability_review_engine_owner_review",
        setup: "Preserve owner-sensitive field in replay candidate.",
        expect: "Guardrail downgrades to review.",
        source: "capability",
      },
    ];

    const exports = buildSmokeScenarioExports(
      {
        namespace: "master_skill",
        fileStem: "sample-card",
        structuredCard: card,
        smokeTests,
        outputRootDir: DEFAULT_OUTPUT_ROOT_DIR,
      },
      {
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.default]: defaultTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.moon]: moonTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.event]: eventTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.situation]: situationTemplate,
      },
    );

    expect(exports).toHaveLength(2);
    expect(exports[0]).toMatchObject({
      templatePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
      outputPath: join(DEFAULT_OUTPUT_ROOT_DIR, "master_skill", "sample-card--base-smoke.json"),
      smokeTest: smokeTests[0],
    });
    expect(exports[1]?.scenario.id).toBe(
      "smoke-master-skill-sample-card-capability-review-engine-owner-review",
    );
  });

  it("builds baseline/candidate matrix entries for generated scenarios", () => {
    const entries: ScenarioMatrixCase[] = buildGeneratedScenarioMatrixEntries([
      {
        smokeTest: {
          name: "base_smoke",
          setup: "Run baseline smoke scenario.",
          expect: "Replay remains runnable.",
          source: "model",
        },
        templatePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
        templateScenario: defaultTemplate,
        outputPath: join(DEFAULT_OUTPUT_ROOT_DIR, "event", "sample-card--base-smoke.json"),
        scenario: defaultTemplate,
      },
    ]);

    expect(entries).toEqual([
      {
        label: "generated-event-sample-card-base-smoke-candidate",
        baselinePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
        candidatePath: join(DEFAULT_OUTPUT_ROOT_DIR, "event", "sample-card--base-smoke.json"),
        expectedIdentical: true,
      },
    ]);
  });

  it("builds identical matrix labels for equivalent Windows and POSIX paths", () => {
    const smokeTest: SmokeTestSuggestion = {
      name: "base_smoke",
      setup: "Run baseline smoke scenario.",
      expect: "Replay remains runnable.",
      source: "model",
    };
    const windowsEntries = buildGeneratedScenarioMatrixEntries([
      {
        smokeTest,
        templatePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
        templateScenario: defaultTemplate,
        outputPath: String.raw`D:\fd\data\staged\generated-scenarios\event\sample-card--base-smoke.json`,
        scenario: defaultTemplate,
      },
    ]);
    const posixEntries = buildGeneratedScenarioMatrixEntries([
      {
        smokeTest,
        templatePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
        templateScenario: defaultTemplate,
        outputPath: "/home/runner/work/fd/fd/data/staged/generated-scenarios/event/sample-card--base-smoke.json",
        scenario: defaultTemplate,
      },
    ]);

    expect(windowsEntries[0]?.label).toBe("generated-event-sample-card-base-smoke-candidate");
    expect(posixEntries[0]?.label).toBe(windowsEntries[0]?.label);
  });

  it("normalizes legacy servant card families for generated matrix labels", () => {
    const card: StructuredCard = {
      id: "servant.bb.skill",
      name: "B.B.",
      cardType: "servant",
      timing: ["action"],
      conditions: [],
      targets: [],
      effects: [],
      duration: null,
      visibility: "public",
      tags: ["Moon Cancer"],
      ambiguities: [],
    };
    const exports = buildSmokeScenarioExports(
      {
        namespace: "servant",
        fileStem: "sample-card",
        structuredCard: card,
        smokeTests: [
          {
            name: "base_smoke",
            setup: "Run baseline smoke scenario.",
            expect: "Replay remains runnable.",
            source: "model",
          },
        ],
        outputRootDir: DEFAULT_OUTPUT_ROOT_DIR,
      },
      {
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.default]: defaultTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.moon]: moonTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.event]: eventTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.situation]: situationTemplate,
      },
    );

    expect(buildGeneratedScenarioMatrixEntries(exports)).toEqual([
      {
        label: "generated-servant-skill-sample-card-base-smoke-candidate",
        baselinePath: DEFAULT_SCENARIO_TEMPLATE_PATHS.default,
        candidatePath: join(DEFAULT_OUTPUT_ROOT_DIR, "servant", "sample-card--base-smoke.json"),
        expectedIdentical: true,
      },
    ]);
  });

  it("generates capability smoke test for explicit identity swap effects", () => {
    const card: StructuredCard = {
      id: "master.identity.swap",
      name: "身份置换",
      cardType: "master_skill",
      timing: ["action"],
      conditions: [],
      targets: [{ type: "self_player" }],
      effects: [
        {
          type: "swap_master_identity",
          args: {
            newCardId: "master.alt.form",
          },
        },
      ],
      duration: null,
      visibility: "public",
      tags: ["replacement"],
      ambiguities: [],
    };
    const smokeTests: SmokeTestSuggestion[] = [
      {
        name: "capability_approve_swap_master_identity_card_effects_0_type",
        setup: "Run a seeded scenario where the card resolves swap_master_identity for the controlling player with the declared replacement identity.",
        expect: "Guardrail approves the explicit identity swap and replay records the deterministic replacement transition.",
        source: "capability",
      },
    ];

    const exports = buildSmokeScenarioExports(
      {
        namespace: "master_skill",
        fileStem: "identity-swap-sample",
        structuredCard: card,
        smokeTests,
        outputRootDir: DEFAULT_OUTPUT_ROOT_DIR,
      },
      {
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.default]: defaultTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.moon]: moonTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.event]: eventTemplate,
        [DEFAULT_SCENARIO_TEMPLATE_PATHS.situation]: situationTemplate,
      },
    );

    expect(exports).toHaveLength(1);
    expect(exports[0]?.smokeTest.name).toBe("capability_approve_swap_master_identity_card_effects_0_type");
    expect(exports[0]?.smokeTest.source).toBe("capability");
    expect(exports[0]?.templatePath).toBe(DEFAULT_SCENARIO_TEMPLATE_PATHS.default);
    expect(exports[0]?.scenario.id).toBe("smoke-master-skill-identity-swap-sample-capability-approve-swap-master-identity-card-effects-0-type");
  });
});
