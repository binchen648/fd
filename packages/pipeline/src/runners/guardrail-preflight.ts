import { assert } from "../validators/assert";
import type {
  GuardrailIssue,
  GuardrailResponse,
  SmokeTestSuggestion,
  StructuredCard,
} from "@fd/contracts";

const supportedEngineCapabilityVersions: readonly string[] = ["fd-engine-capability-v1"];
const supportedTimingWindows = new Set([
  "passive",
  "round_start",
  "preparation",
  "advance",
  "action",
  "battle",
  "after_battle",
  "cleanup",
  "round_end",
]);
const supportedVisibilityModes = new Set([
  "public",
  "owner_only",
  "battlefield_only",
  "hidden_until_trigger",
  "revealed_after_declaration",
]);
const supportedCardTypes = new Set([
  "master_identity",
  "master_skill",
  "command_spell",
  "servant_attack",
  "servant_skill",
  "situation",
  "event",
  "status",
  "generated",
]);
const supportedConditionTypes = new Set([
  "location_is",
  "round_threshold_at_most",
  "round_threshold_at_least",
  "active_players_at_most",
  "active_players_at_least",
]);
const supportedTargetTypes = new Set([
  "self_player",
  "battlefield_location",
  "self_battlefield",
]);
const supportedEffectTypes = new Set([
  "gain_mana",
  "gain_card",
  "lose_command_spell",
  "reveal_hidden_event",
  "battle_power_bonus_if_shared_attribute",
  "swap_master_identity",
  "swap_servant_identity",
  "view_deck_bottom",
  "discard_card",
  "move_along_arrow",
  "play_attack",
  "attack_half_power",
  "view_hidden_attack",
  "defeat_in_battle",
  "select_option",
  "see_through",
  "forbid_special_attack_on_battlefield",
  "lock_battlefield_movement",
]);
const reviewOnlyEffectTypes = new Set<string>();
const reviewTagSet = new Set([
  "moon_holy_grail",
  "replacement",
  "flip",
  "rewrite",
  "reincarnation",
  "container_swap",
  "hidden_true_name",
]);

export interface CapabilityAssessment {
  engineOk: boolean;
  decision: "approve" | "review" | "reject";
  issues: GuardrailIssue[];
  smokeTests: SmokeTestSuggestion[];
}

export function getSupportedEngineCapabilityVersions(): string[] {
  return [...supportedEngineCapabilityVersions];
}

export function assertSupportedEngineCapabilityVersion(version: string): void {
  assert(
    supportedEngineCapabilityVersions.includes(version),
    `Unsupported engine capability version: ${version}`,
  );
}

export function evaluateStructuredCardCapability(card: StructuredCard): CapabilityAssessment {
  const issues: GuardrailIssue[] = [];

  if (!supportedCardTypes.has(card.cardType)) {
    issues.push({
      code: "ENGINE_UNSUPPORTED_CARD_TYPE",
      severity: "error",
      message: `Unsupported card type: ${card.cardType}`,
      fieldPath: "card.cardType",
    });
  }

  if (card.owner !== undefined) {
    issues.push({
      code: "ENGINE_OWNER_REVIEW",
      severity: "warning",
      message: "Owner-sensitive cards require human review in the current engine slice.",
      fieldPath: "card.owner",
    });
  }

  if (card.duration !== null) {
    issues.push({
      code: "ENGINE_DURATION_REVIEW",
      severity: "warning",
      message: `Duration requires review: ${card.duration}`,
      fieldPath: "card.duration",
    });
  }

  card.timing.forEach((timing, index) => {
    if (!supportedTimingWindows.has(timing)) {
      issues.push({
        code: "ENGINE_UNSUPPORTED_TIMING",
        severity: "error",
        message: `Unsupported timing window: ${timing}`,
        fieldPath: `card.timing.${index}`,
      });
    }
  });

  if (!supportedVisibilityModes.has(card.visibility)) {
    issues.push({
      code: "ENGINE_UNSUPPORTED_VISIBILITY",
      severity: "error",
      message: `Unsupported visibility mode: ${card.visibility}`,
      fieldPath: "card.visibility",
    });
  }

  card.conditions.forEach((condition, index) => {
    if (!supportedConditionTypes.has(condition.type)) {
      issues.push({
        code: "ENGINE_UNSUPPORTED_CONDITION",
        severity: "error",
        message: `Unsupported condition type: ${condition.type}`,
        fieldPath: `card.conditions.${index}.type`,
      });
    }
  });

  card.targets.forEach((target, index) => {
    if (!supportedTargetTypes.has(target.type)) {
      issues.push({
        code: "ENGINE_UNSUPPORTED_TARGET",
        severity: "error",
        message: `Unsupported target type: ${target.type}`,
        fieldPath: `card.targets.${index}.type`,
      });
    }
  });

  card.effects.forEach((effect, index) => {
    if (isIdentitySwapEffectType(effect.type)) {
      if (!isSupportedIdentitySwapEffect(card, effect)) {
        issues.push({
          code: "ENGINE_REVIEW_EFFECT",
          severity: "warning",
          message: `Identity swap effect requires self_player targeting and args.newCardId: ${effect.type}`,
          fieldPath: `card.effects.${index}.type`,
        });
      }
      return;
    }

    if (reviewOnlyEffectTypes.has(effect.type)) {
      issues.push({
        code: "ENGINE_REVIEW_EFFECT",
        severity: "warning",
        message: `Effect requires review-only handling: ${effect.type}`,
        fieldPath: `card.effects.${index}.type`,
      });
      return;
    }

    if (!supportedEffectTypes.has(effect.type)) {
      issues.push({
        code: "ENGINE_UNSUPPORTED_EFFECT",
        severity: "error",
        message: `Unsupported effect type: ${effect.type}`,
        fieldPath: `card.effects.${index}.type`,
      });
    }
  });

  if (
    card.tags.some((tag) => isReviewTagActiveForCard(card, tag)) ||
    card.conditions.some((condition) => condition.value === "moon_holy_grail")
  ) {
    issues.push({
      code: "ENGINE_REVIEW_TAG",
      severity: "warning",
      message: "Card touches review-only engine territory and requires human review.",
      fieldPath: "card.tags",
    });
  }

  card.ambiguities.forEach((ambiguity, index) => {
    if (ambiguity.severity === "high" || ambiguity.recommendedAction === "reject") {
      issues.push({
        code: "ENGINE_AMBIGUITY_REJECT",
        severity: "error",
        message: `High ambiguity requires rejection: ${ambiguity.span}`,
        fieldPath: `card.ambiguities.${index}`,
      });
      return;
    }

    if (ambiguity.severity === "medium" || ambiguity.recommendedAction === "human_review") {
      issues.push({
        code: "ENGINE_AMBIGUITY_REVIEW",
        severity: "warning",
        message: `Ambiguity requires review: ${ambiguity.span}`,
        fieldPath: `card.ambiguities.${index}`,
      });
    }
  });

  const hasError = issues.some((issue) => issue.severity === "error");
  const hasWarning = issues.some((issue) => issue.severity === "warning");

  return {
    engineOk: !hasError && !hasWarning,
    decision: hasError ? "reject" : hasWarning ? "review" : "approve",
    issues,
    smokeTests: hasError || hasWarning ? [] : synthesizeCapabilitySmokeTests(card),
  };
}

export function applyCapabilityAssessmentToGuardrail(
  response: GuardrailResponse,
  assessment: CapabilityAssessment,
): GuardrailResponse {
  const capabilitySmokeTests = assessment.smokeTests ?? [];

  if (isMinimalModelReview(response) && assessment.decision === "approve" && assessment.engineOk) {
    return {
      ...response,
      status: "approve",
      schemaOk: true,
      engineOk: true,
      decision: "approve",
      ambiguityLevel: "low",
      issues: [],
      smokeTests: mergeSmokeTests(
        response.smokeTests.map((entry) => ({
          ...entry,
          source: entry.source ?? "model",
        })),
        capabilitySmokeTests,
      ),
      requiredHumanReview: false,
    };
  }

  const decision = downgradeDecision(response.decision, assessment.decision);
  const smokeTests = mergeSmokeTests(
    response.smokeTests.map((entry) => ({
      ...entry,
      source: entry.source ?? "model",
    })),
    capabilitySmokeTests.concat(
      assessment.issues.map(issueToSmokeTest).filter((entry): entry is SmokeTestSuggestion => entry !== null),
    ),
  );

  return {
    ...response,
    status: response.status === "error" ? "error" : decision,
    decision,
    engineOk: response.engineOk && assessment.engineOk,
    issues: response.issues.concat(assessment.issues),
    smokeTests,
    requiredHumanReview:
      response.requiredHumanReview ||
      decision === "review" ||
      assessment.issues.some((issue) => issue.severity === "warning"),
  };
}

function synthesizeCapabilitySmokeTests(card: StructuredCard): SmokeTestSuggestion[] {
  return card.effects.flatMap((effect, index) => {
    if (effect.type === "swap_master_identity" || effect.type === "swap_servant_identity") {
      return [{
        name: `capability_approve_${effect.type}_card_effects_${index}_type`,
        setup: `Run a seeded scenario where the card resolves ${effect.type} for the controlling player with the declared replacement identity.`,
        expect: "Guardrail approves the explicit identity swap and replay records the deterministic replacement transition.",
        source: "capability",
      }];
    }

    if (effect.type === "battle_power_bonus_if_shared_attribute") {
      return [{
        name: `capability_approve_battle_power_bonus_if_shared_attribute_card_effects_${index}_type`,
        setup: "Run a seeded battle where both attacks share at least one attribute on the same battlefield.",
        expect: "Replay resolves the shared-attribute battle modifier deterministically.",
        source: "capability",
      }];
    }

    if (effect.type === "forbid_special_attack_on_battlefield") {
      return [{
        name: `capability_approve_forbid_special_attack_on_battlefield_card_effects_${index}_type`,
        setup: "Run a seeded battle on the targeted battlefield and attempt to declare a special attack there.",
        expect: "Replay blocks the special attack deterministically while keeping normal battle flow intact.",
        source: "capability",
      }];
    }

    if (effect.type === "lock_battlefield_movement") {
      const scope = typeof effect.value === "string" ? effect.value : "all_players";
      return [{
        name: `capability_approve_lock_battlefield_movement_card_effects_${index}_type`,
        setup: `Run a seeded movement scenario where ${scope} would try to enter or leave the affected battlefield.`,
        expect: "Replay blocks the illegal movement deterministically and preserves the battlefield lock.",
        source: "capability",
      }];
    }

    if (effect.type === "gain_mana") {
      const amount = effect.args?.amount ?? (typeof effect.value === "number" ? effect.value : 0);
      return [{
        name: `capability_approve_gain_mana_card_effects_${index}_type`,
        setup: `Run a seeded scenario where the controlling player resolves the gain_mana effect and gains ${amount} mana.`,
        expect: "Replay deterministically adds the mana to the player's pool and records the transaction.",
        source: "capability",
      }];
    }

    if (effect.type === "reveal_hidden_event") {
      return [{
        name: `capability_approve_reveal_hidden_event_card_effects_${index}_type`,
        setup: "Run a seeded scenario with a hidden event on the battlefield, then apply a reveal_hidden_event effect.",
        expect: "Replay reveals the hidden event and makes it visible to all players during battle resolution.",
        source: "capability",
      }];
    }

    if (effect.type === "gain_card") {
      const cardName = effect.args?.cardName ?? (typeof effect.value === "string" ? effect.value : "a card");
      return [{
        name: `capability_approve_gain_card_card_effects_${index}_type`,
        setup: `Run a seeded scenario where the controlling player resolves the gain_card effect and gains ${cardName}.`,
        expect: "Replay deterministically adds the card to the player's hand and records the transaction.",
        source: "capability",
      }];
    }

    if (effect.type === "lose_command_spell") {
      const amount = effect.args?.amount ?? 1;
      return [{
        name: `capability_approve_lose_command_spell_card_effects_${index}_type`,
        setup: `Run a seeded scenario where the controlling player resolves the lose_command_spell effect and loses ${amount} command spell(s).`,
        expect: "Replay deterministically removes the command spell(s) from the player's pool and records the transaction.",
        source: "capability",
      }];
    }

    return [];
  });
}

function isIdentitySwapEffectType(effectType: string): boolean {
  return effectType === "swap_master_identity" || effectType === "swap_servant_identity";
}

function isSupportedIdentitySwapEffect(card: StructuredCard, effect: StructuredCard["effects"][number]): boolean {
  return (
    isIdentitySwapEffectType(effect.type)
    && card.targets.length === 1
    && card.targets[0]?.type === "self_player"
    && typeof effect.args?.newCardId === "string"
    && effect.args.newCardId.length > 0
  );
}

function isReviewTagActiveForCard(card: StructuredCard, tag: string): boolean {
  if (!reviewTagSet.has(tag)) {
    return false;
  }

  if (tag !== "replacement") {
    return true;
  }

  return !card.effects.every((effect) => isSupportedIdentitySwapEffect(card, effect));
}

function downgradeDecision(
  current: GuardrailResponse["decision"],
  assessed: CapabilityAssessment["decision"],
): GuardrailResponse["decision"] {
  if (current === "reject" || assessed === "reject") {
    return "reject";
  }

  if (current === "review" || assessed === "review") {
    return "review";
  }

  return "approve";
}

function isMinimalModelReview(response: GuardrailResponse): boolean {
  return (
    response.decision === "review" &&
    response.issues.length === 1 &&
    response.issues[0]?.code === "MODEL_RETURNED_MINIMAL_REVIEW"
  );
}

function issueToSmokeTest(issue: GuardrailIssue): SmokeTestSuggestion | null {
  const suffix = normalizeFieldPath(issue.fieldPath);

  switch (issue.code) {
    case "ENGINE_REVIEW_TAG":
      return {
        name: `capability_review_tag_${suffix}`,
        setup: `Construct a seeded scenario that exercises ${issue.fieldPath ?? "the tagged rule surface"}.`,
        expect: "Guardrail keeps the card in review_required and replay captures the risky interaction.",
        source: "capability",
      };
    case "ENGINE_UNSUPPORTED_EFFECT":
      return {
        name: `capability_reject_unsupported_effect_${suffix}`,
        setup: `Feed the structured card into guardrail with ${issue.fieldPath ?? "the unsupported effect"} preserved.`,
        expect: "Guardrail rejects the card before integration and emits the unsupported-effect issue.",
        source: "capability",
      };
    case "ENGINE_UNSUPPORTED_CONDITION":
    case "ENGINE_UNSUPPORTED_TARGET":
    case "ENGINE_UNSUPPORTED_TIMING":
    case "ENGINE_UNSUPPORTED_CARD_TYPE":
    case "ENGINE_UNSUPPORTED_VISIBILITY":
      return {
        name: `capability_reject_${issue.code.toLowerCase()}_${suffix}`,
        setup: `Run guardrail on a structured card that still contains ${issue.fieldPath ?? issue.code}.`,
        expect: "Guardrail rejects the card and surfaces the exact unsupported capability issue.",
        source: "capability",
      };
    case "ENGINE_DURATION_REVIEW":
    case "ENGINE_OWNER_REVIEW":
    case "ENGINE_AMBIGUITY_REVIEW":
    case "ENGINE_REVIEW_EFFECT":
      return {
        name: `capability_review_${issue.code.toLowerCase()}_${suffix}`,
        setup: `Preserve ${issue.fieldPath ?? issue.code} in a seeded guardrail input and replay candidate scenario.`,
        expect: "Guardrail downgrades to review and keeps the card out of auto-integration.",
        source: "capability",
      };
    case "ENGINE_AMBIGUITY_REJECT":
      return {
        name: `capability_reject_ambiguity_${suffix}`,
        setup: `Run guardrail against a structured card with the same high-ambiguity span still unresolved.`,
        expect: "Guardrail rejects the card and records the ambiguity as a blocking issue.",
        source: "capability",
      };
    default:
      return null;
  }
}

function mergeSmokeTests(
  base: SmokeTestSuggestion[],
  extras: SmokeTestSuggestion[],
): SmokeTestSuggestion[] {
  const merged = new Map<string, SmokeTestSuggestion>();

  for (const entry of base.concat(extras)) {
    merged.set(entry.name, entry);
  }

  return [...merged.values()];
}

function normalizeFieldPath(fieldPath: string | undefined): string {
  if (!fieldPath) {
    return "general";
  }

  return fieldPath.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}
