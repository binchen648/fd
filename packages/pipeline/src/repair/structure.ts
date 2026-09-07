import type {
  AmbiguityRecord,
  RuleCondition,
  RuleEffect,
  RuleTarget,
  StructuringResponse,
} from "@fd/contracts";

type RuleEntryRepair<T> = {
  items: T[];
  ambiguities: AmbiguityRecord[];
  parseNotes: string[];
  timings: string[];
};

type SynergyRepair = {
  applied: boolean;
  targets: RuleTarget[];
  effects: RuleEffect[];
  timings: string[];
  parseNotes: string[];
  clearedSpans: string[];
};

type RestrictionRepair = SynergyRepair;
type TargetAmbiguityRepair = {
  applied: boolean;
  targets: RuleTarget[];
  parseNotes: string[];
  clearedSpans: string[];
};

type CardTypeRepair = {
  value: string;
  applied: boolean;
  parseNote: string | null;
};

const locationMap = new Map<string, string>([
  ["深山町", "miyama_town"],
  ["新都", "shinto"],
  ["月之圣杯", "moon_holy_grail"],
  ["miyama town", "miyama_town"],
  ["deep mountain town", "miyama_town"],
  ["shinto", "shinto"],
  ["new capital", "shinto"],
  ["moon holy grail", "moon_holy_grail"],
]);

export function repairStructureResponse(
  input: unknown,
  requestJobId: string,
  provider: string,
  model: string,
): StructuringResponse | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }

  const record = input as Record<string, unknown>;
  if (typeof record.card !== "object" || record.card === null || Array.isArray(record.card)) {
    return null;
  }

  const card = record.card as Record<string, unknown>;
  const rawConditions = Array.isArray(card.conditions) ? card.conditions : [];
  const rawTargets = Array.isArray(card.targets) ? card.targets : [];
  const rawEffects = Array.isArray(card.effects) ? card.effects : [];
  const baseAmbiguities = readAmbiguities(card.ambiguities);

  const repairedConditions = repairConditions(rawConditions);
  const repairedTargets = repairTargets(rawTargets);
  const repairedEffects = repairEffects(rawEffects);
  const repairedCardType = repairCardType(card.cardType, card.id);
  const derivedAmbiguities = baseAmbiguities.concat(repairedEffects.ambiguities);
  const targetAmbiguityRepair = repairSituationBattlefieldTargets(card, derivedAmbiguities, repairedTargets.items);
  const synergyRepair = repairSynergyCard(
    card,
    derivedAmbiguities,
    targetAmbiguityRepair.applied ? targetAmbiguityRepair.targets : repairedTargets.items,
    repairedEffects.items,
  );
  const restrictionRepair = repairRealityMarbleCard(
    card,
    derivedAmbiguities,
    synergyRepair.applied
      ? synergyRepair.targets
      : targetAmbiguityRepair.applied
        ? targetAmbiguityRepair.targets
        : repairedTargets.items,
    synergyRepair.applied ? synergyRepair.effects : repairedEffects.items,
  );
  const normalizedTimingBase = normalizeTiming(
    readStringArray(card.timing),
    repairedConditions.timings.concat(
      repairedEffects.timings,
      synergyRepair.timings,
      restrictionRepair.timings,
    ),
  );
  const normalizedTiming = restrictionRepair.applied
    ? restrictionRepair.timings
    : normalizedTimingBase;

  if (
    !needsTimingRepair(readStringArray(card.timing), normalizedTiming) &&
    !needsRuleArrayRepair(rawConditions, repairedConditions.items) &&
    !needsRuleArrayRepair(rawTargets, repairedTargets.items) &&
    !needsRuleArrayRepair(rawEffects, repairedEffects.items) &&
    !repairedCardType.applied &&
    !synergyRepair.applied &&
    !restrictionRepair.applied
  ) {
    return null;
  }

  const mergedAmbiguities = [
    ...derivedAmbiguities.filter(
      (entry) =>
        !targetAmbiguityRepair.clearedSpans.includes(entry.span) &&
        !synergyRepair.clearedSpans.includes(entry.span) &&
        !restrictionRepair.clearedSpans.includes(entry.span),
    ),
    ...repairedConditions.ambiguities,
    ...repairedTargets.ambiguities,
  ];
  const mergedParseNotes = [
    ...readStringArray(record.parseNotes),
    ...repairedConditions.parseNotes,
    ...repairedTargets.parseNotes,
    ...repairedEffects.parseNotes,
    ...(repairedCardType.parseNote ? [repairedCardType.parseNote] : []),
    ...targetAmbiguityRepair.parseNotes,
    ...synergyRepair.parseNotes,
    ...restrictionRepair.parseNotes,
  ];
  const repairedTargetsFinal = restrictionRepair.applied
    ? restrictionRepair.targets
    : synergyRepair.applied
      ? synergyRepair.targets
      : targetAmbiguityRepair.applied
        ? targetAmbiguityRepair.targets
        : repairedTargets.items;
  const repairedEffectsFinal = restrictionRepair.applied
    ? restrictionRepair.effects
    : synergyRepair.applied
      ? synergyRepair.effects
      : repairedEffects.items;

  const repairedCard: StructuringResponse["card"] = {
    id: typeof card.id === "string" ? card.id : requestJobId.replace(/^structure-/, ""),
    name: typeof card.name === "string" ? card.name : "unknown-card",
    cardType: repairedCardType.value,
    timing: normalizedTiming,
    conditions: repairedConditions.items,
    targets: repairedTargetsFinal,
    effects: repairedEffectsFinal,
    duration: typeof card.duration === "string" ? card.duration : null,
    visibility: typeof card.visibility === "string" ? card.visibility : "public",
    tags: readStringArray(card.tags),
    ambiguities: mergedAmbiguities,
  };

  if (typeof card.owner === "string") {
    repairedCard.owner = card.owner;
  }

  return {
    jobId: typeof record.jobId === "string" ? record.jobId : requestJobId,
    artifactVersion: "structure-response-v1",
    status: record.status === "error" ? "error" : "ok",
    card: repairedCard,
    parseNotes: mergedParseNotes,
    coverage: readCoverage(record.coverage),
    source: readSource(record.source, requestJobId, provider, model),
  };
}

function repairCardType(cardType: unknown, cardId: unknown): CardTypeRepair {
  if (typeof cardType !== "string") {
    return {
      value: "generated",
      applied: false,
      parseNote: null,
    };
  }

  const normalized = normalizeCardTypeToken(cardType);
  if (normalized === null) {
    return {
      value: cardType,
      applied: false,
      parseNote: null,
    };
  }

  const servantSubtype = inferServantSubtypeFromCardId(cardId);
  const repairedValue = normalized === "servant" && servantSubtype ? `servant_${servantSubtype}` : normalized;

  if (repairedValue === cardType) {
    return {
      value: cardType,
      applied: false,
      parseNote: null,
    };
  }

  return {
    value: repairedValue,
    applied: true,
    parseNote: `Repaired cardType '${cardType}' -> ${repairedValue}`,
  };
}

function normalizeCardTypeToken(value: string): string | null {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "event_card":
      return "event";
    case "situation_card":
      return "situation";
    default:
      return normalized.length > 0 ? normalized : null;
  }
}

function inferServantSubtypeFromCardId(cardId: unknown): "attack" | "skill" | null {
  if (typeof cardId !== "string") {
    return null;
  }

  const normalizedId = cardId.toLowerCase();
  if (/(?:^|[._-])attack(?:$|[._-])/.test(normalizedId)) {
    return "attack";
  }

  if (/(?:^|[._-])skill(?:$|[._-])/.test(normalizedId)) {
    return "skill";
  }

  return null;
}

function repairConditions(entries: unknown[]): RuleEntryRepair<RuleCondition> {
  const items: RuleCondition[] = [];
  const ambiguities: AmbiguityRecord[] = [];
  const parseNotes: string[] = [];
  const timings: string[] = [];

  entries.forEach((entry, index) => {
    if (isRuleObject(entry)) {
      items.push(entry);
      return;
    }

    if (typeof entry !== "string") {
      ambiguities.push(createAmbiguity(`condition-${index}`, "Unrecognized non-string condition entry."));
      return;
    }

    const timing = inferTimingFromClause(entry);
    if (timing) {
      timings.push(timing);
      parseNotes.push(`Repaired timing '${entry}' -> ${timing}`);
    }

    const location = inferLocationCondition(entry);
    if (location) {
      items.push(location);
      parseNotes.push(`Repaired condition '${entry}' -> ${location.type}(${String(location.value)})`);
      return;
    }

    if (!timing) {
      ambiguities.push(createAmbiguity(entry, "Could not map condition clause to a supported engine predicate."));
    }
  });

  return { items, ambiguities, parseNotes, timings };
}

function repairTargets(entries: unknown[]): RuleEntryRepair<RuleTarget> {
  const items: RuleTarget[] = [];
  const ambiguities: AmbiguityRecord[] = [];
  const parseNotes: string[] = [];

  entries.forEach((entry, index) => {
    if (isRuleObject(entry)) {
      items.push(entry);
      return;
    }

    if (entry === "自己" || entry === "自身") {
      items.push({ type: "self_player" });
      parseNotes.push(`Repaired target '${entry}' -> self_player`);
      return;
    }

    if (typeof entry === "string") {
      const locationValue = mapLocation(entry);
      if (locationValue) {
        items.push({ type: "battlefield_location", value: locationValue });
        parseNotes.push(`Repaired target '${entry}' -> battlefield_location(${locationValue})`);
        return;
      }
    }

    ambiguities.push(createAmbiguity(`target-${index}`, `Could not map target '${String(entry)}' to a supported engine target.`));
  });

  return { items, ambiguities, parseNotes, timings: [] };
}

function repairEffects(entries: unknown[]): RuleEntryRepair<RuleEffect> {
  const items: RuleEffect[] = [];
  const ambiguities: AmbiguityRecord[] = [];
  const parseNotes: string[] = [];
  const timings: string[] = [];

  entries.forEach((entry, index) => {
    if (isRuleObject(entry)) {
      items.push(entry);
      return;
    }

    if (typeof entry !== "string") {
      ambiguities.push(createAmbiguity(`effect-${index}`, "Unrecognized non-string effect entry."));
      return;
    }

    // Check for special attack ban patterns BEFORE generic pattern matching
    if (/特殊攻击.*禁止|特殊攻击于此战场/.test(entry)) {
      ambiguities.push(createAmbiguity(entry, "Special attack ban detected - requires review-only handling."));
      return;
    }

    // Check for movement lock patterns BEFORE generic pattern matching
    if (/不能移动至此地点|不能离开此地点/.test(entry)) {
      ambiguities.push(createAmbiguity(entry, "Movement lock detected - requires review-only handling."));
      return;
    }

    const gainMana = entry.match(/获得(\d+)点魔力/);
    if (gainMana) {
      items.push({ type: "gain_mana", value: Number(gainMana[1]) });
      parseNotes.push(`Repaired effect '${entry}' -> gain_mana(${gainMana[1]})`);
      return;
    }

    const gainCard = entry.match(/获得[【\[]?(.+?)[】\]]/);
    const cardName = gainCard?.[1];
    if (cardName) {
      items.push({ type: "gain_card", value: cardName });
      parseNotes.push(`Repaired effect '${entry}' -> gain_card(${cardName})`);
      return;
    }

    if (/失去[一1]枚令咒/.test(entry)) {
      items.push({ type: "lose_command_spell", value: 1 });
      parseNotes.push(`Repaired effect '${entry}' -> lose_command_spell(1)`);
      return;
    }

    if (/显露|揭示|公开隐藏事件/.test(entry)) {
      items.push({ type: "reveal_hidden_event", value: null });
      parseNotes.push(`Repaired effect '${entry}' -> reveal_hidden_event`);
      return;
    }

    if (/查看.*牌库底部|view.*deck.*bottom|牌库底/.test(entry)) {
      items.push({ type: "view_deck_bottom", value: true });
      parseNotes.push(`Repaired effect '${entry}' -> view_deck_bottom`);
      return;
    }

    if (/弃置.*张牌|丢弃|discard/.test(entry)) {
      const match = entry.match(/弃置[了]?(\d+)张牌|丢弃(\d+)/);
      const count = match ? (match[1] || match[2]) : 1;
      items.push({ type: "discard_card", value: Number(count) });
      parseNotes.push(`Repaired effect '${entry}' -> discard_card(${count})`);
      return;
    }

    if (/移动|沿.*箭头|move.*arrow/.test(entry)) {
      items.push({ type: "move_along_arrow", value: true });
      parseNotes.push(`Repaired effect '${entry}' -> move_along_arrow`);
      return;
    }

    if (/打出.*攻击|攻击.*威力|attack.*power/.test(entry)) {
      const match = entry.match(/威力减半|power.*half/i);
      if (match) {
        items.push({ type: "attack_half_power", value: true });
        parseNotes.push(`Repaired effect '${entry}' -> attack_half_power`);
        return;
      }
      items.push({ type: "play_attack", value: true });
      parseNotes.push(`Repaired effect '${entry}' -> play_attack`);
      return;
    }

    if (/查看.*暗置|view.*hidden.*attack/.test(entry)) {
      items.push({ type: "view_hidden_attack", value: true });
      parseNotes.push(`Repaired effect '${entry}' -> view_hidden_attack`);
      return;
    }

    if (/战败时|upon.*defeat|败北/.test(entry)) {
      items.push({ type: "defeat_in_battle", value: true });
      parseNotes.push(`Repaired effect '${entry}' -> defeat_in_battle`);
      return;
    }

    if (/选择一项|choose.*option|选择/.test(entry)) {
      items.push({ type: "select_option", value: true });
      parseNotes.push(`Repaired effect '${entry}' -> select_option`);
      return;
    }

    if (/净眼|clear.*eyes|透视/.test(entry)) {
      items.push({ type: "see_through", value: true });
      parseNotes.push(`Repaired effect '${entry}' -> see_through`);
      return;
    }

    ambiguities.push(createAmbiguity(entry, "Could not map effect clause to a supported engine effect."));
  });

  return { items, ambiguities, parseNotes, timings: [] };
}

function repairSynergyCard(
  card: Record<string, unknown>,
  ambiguities: AmbiguityRecord[],
  targets: RuleTarget[],
  effects: RuleEffect[],
): SynergyRepair {
  if (targets.length > 0 || effects.length > 0) {
    return {
      applied: false,
      targets,
      effects,
      timings: [],
      parseNotes: [],
      clearedSpans: [],
    };
  }

  const parsedBonus = ambiguities
    .map((entry) => entry.span.match(/威力[+＋]?(\d+)/))
    .find((match): match is RegExpMatchArray => match !== null);
  const bonus = parsedBonus ? Number(parsedBonus[1]) : null;
  const hasSharedAttributeClause = ambiguities.some((entry) => /属性相同/.test(entry.span));

  if (!hasSharedAttributeClause || bonus === null || Number.isNaN(bonus)) {
    return {
      applied: false,
      targets,
      effects,
      timings: [],
      parseNotes: [],
      clearedSpans: [],
    };
  }

  return {
    applied: true,
    targets: [{ type: "self_battlefield" }],
    effects: [{ type: "battle_power_bonus_if_shared_attribute", value: bonus }],
    timings: ["battle"],
    parseNotes: [
      `Repaired synergy card into battle_power_bonus_if_shared_attribute(${bonus}) on self_battlefield.`,
    ],
    clearedSpans: ambiguities.map((entry) => entry.span),
  };
}

function repairSituationBattlefieldTargets(
  card: Record<string, unknown>,
  ambiguities: AmbiguityRecord[],
  targets: RuleTarget[],
): TargetAmbiguityRepair {
  if (card.cardType !== "situation" || targets.length > 0) {
    return {
      applied: false,
      targets,
      parseNotes: [],
      clearedSpans: [],
    };
  }

  const repairedTargets = ambiguities.flatMap((entry) => {
    if (!/^target-\d+$/.test(entry.span) || typeof entry.notes !== "string") {
      return [];
    }

    const match = entry.notes.match(/Could not map target '(.+?)'/);
    const rawTarget = match?.[1];
    if (!rawTarget) {
      return [];
    }

    const mapped = mapLocation(rawTarget);
    if (!mapped) {
      return [];
    }

    return [{ type: "battlefield_location", value: mapped, span: entry.span, raw: rawTarget }] as const;
  });

  if (repairedTargets.length === 0) {
    return {
      applied: false,
      targets,
      parseNotes: [],
      clearedSpans: [],
    };
  }

  return {
    applied: true,
    targets: repairedTargets.map((entry) => ({ type: "battlefield_location", value: entry.value })),
    parseNotes: repairedTargets.map((entry) => `Repaired ambiguity target '${entry.raw}' -> battlefield_location(${entry.value})`),
    clearedSpans: repairedTargets.map((entry) => entry.span),
  };
}

function repairRealityMarbleCard(
  card: Record<string, unknown>,
  ambiguities: AmbiguityRecord[],
  targets: RuleTarget[],
  effects: RuleEffect[],
): RestrictionRepair {
  // Only skip if both are already properly structured - raw strings need repair
  if (
    targets.length > 0 &&
    effects.length > 0 &&
    effects.every((e) => typeof e !== "string")
  ) {
    return {
      applied: false,
      targets,
      effects,
      timings: [],
      parseNotes: [],
      clearedSpans: [],
    };
  }

  const hasSpecialAttackBan = ambiguities.some(
    (entry) => /特殊攻击.*禁止/.test(entry.span) || entry.span === "special_attack_banned",
  );
  const hasMovementLock = ambiguities.some(
    (entry) =>
      /(不能|禁止)移动至此地点/.test(entry.span) ||
      /(不能|禁止)离开此地点/.test(entry.span) ||
      entry.span === "no_movement_to_location" ||
      entry.span === "no_movement_from_location",
  );

  if (!hasSpecialAttackBan && !hasMovementLock) {
    return {
      applied: false,
      targets,
      effects,
      timings: [],
      parseNotes: [],
      clearedSpans: [],
    };
  }

  const repairedEffects: RuleEffect[] = [];
  const timings = new Set<string>();
  const parseNotes: string[] = [];
  const clearedSpans: string[] = [];

  if (hasSpecialAttackBan) {
    repairedEffects.push({ type: "forbid_special_attack_on_battlefield", value: true });
    timings.add("battle");
    parseNotes.push("Repaired reality-marble clause into forbid_special_attack_on_battlefield(true).");
    ambiguities
      .filter((entry) => /特殊攻击.*禁止/.test(entry.span) || entry.span === "special_attack_banned")
      .forEach((entry) => clearedSpans.push(entry.span));
  }

  if (hasMovementLock) {
    repairedEffects.push({ type: "lock_battlefield_movement", value: "all_players" });
    timings.add("advance");
    parseNotes.push("Repaired reality-marble clause into lock_battlefield_movement(all_players).");
    ambiguities
      .filter(
        (entry) =>
          /不能移动至此地点.*不能离开此地点/.test(entry.span) ||
          entry.span === "no_movement_to_location" ||
          entry.span === "no_movement_from_location",
      )
      .forEach((entry) => clearedSpans.push(entry.span));
  }

  return {
    applied: repairedEffects.length > 0,
    targets: [{ type: "self_battlefield" }],
    effects: repairedEffects,
    timings: ["advance", "battle"].filter((entry) => timings.has(entry)),
    parseNotes,
    clearedSpans,
  };
}

function normalizeTiming(existing: string[], inferred: string[]): string[] {
  const normalized = existing
    .map((entry) => normalizeTimingToken(entry))
    .filter((entry): entry is string => entry !== null);
  const merged = normalized.includes("passive") && inferred.length > 0 ? inferred : normalized.concat(inferred);
  return [...new Set(merged)].filter((entry) => entry.length > 0);
}

function normalizeTimingToken(value: string): string | null {
  switch (value) {
    case "active":
    case "action_phase":
      return "action";
    case "start_of_game":
    case "game_start":
      return "round_start";
    case "on_enter_location":
      return "advance";
    case "on_battle_lost":
      return "after_battle";
    case "climax":
      return "action";
    case "high_tide":
      return "advance";
    case "hightide":
      return "advance";
    case "rising_tide":
      return "advance";
    default:
      return value;
  }
}

function mapLocation(value: string): string | null {
  const trimmed = value.trim();
  return locationMap.get(trimmed) ?? locationMap.get(trimmed.toLowerCase()) ?? null;
}

function needsTimingRepair(rawTiming: string[], normalizedTiming: string[]): boolean {
  if (rawTiming.length !== normalizedTiming.length) {
    return true;
  }

  return rawTiming.some((entry, index) => entry !== normalizedTiming[index]);
}

function inferTimingFromClause(value: string): string | null {
  if (/进入.+时/.test(value)) {
    return "advance";
  }

  if (/游戏开始时/.test(value)) {
    return "round_start";
  }

  if (/战败时/.test(value)) {
    return "after_battle";
  }

  return null;
}

function inferLocationCondition(value: string): RuleCondition | null {
  const match = value.match(/进入(.+?)时/);
  if (!match) {
    return null;
  }

  const rawLocation = match[1];
  if (!rawLocation) {
    return null;
  }

  const mapped = mapLocation(rawLocation);
  if (!mapped) {
    return null;
  }

  return {
    type: "location_is",
    value: mapped,
  };
}

function isRuleObject(value: unknown): value is RuleCondition | RuleTarget | RuleEffect {
  return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as { type?: unknown }).type === "string";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function readAmbiguities(value: unknown): AmbiguityRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is AmbiguityRecord =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { span?: unknown }).span === "string" &&
          typeof (entry as { category?: unknown }).category === "string" &&
          typeof (entry as { severity?: unknown }).severity === "string" &&
          Array.isArray((entry as { options?: unknown }).options) &&
          typeof (entry as { recommendedAction?: unknown }).recommendedAction === "string",
      )
    : [];
}

function readCoverage(value: unknown): StructuringResponse["coverage"] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      sourceClauses: 0,
      mappedClauses: 0,
      unmappedClauses: 0,
    };
  }

  const record = value as Record<string, unknown>;
  return {
    sourceClauses: typeof record.sourceClauses === "number" ? record.sourceClauses : 0,
    mappedClauses: typeof record.mappedClauses === "number" ? record.mappedClauses : 0,
    unmappedClauses: typeof record.unmappedClauses === "number" ? record.unmappedClauses : 0,
  };
}

function readSource(
  value: unknown,
  requestJobId: string,
  provider: string,
  model: string,
): StructuringResponse["source"] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      visionJobId: requestJobId.replace(/^structure-/, "vision-"),
      provider,
      model,
    };
  }

  const record = value as Record<string, unknown>;
  return {
    visionJobId:
      typeof record.visionJobId === "string"
        ? record.visionJobId
        : requestJobId.replace(/^structure-/, "vision-"),
    provider,
    model,
  };
}

function createAmbiguity(span: string, notes: string): AmbiguityRecord {
  return {
    span,
    category: "effect_mapping",
    severity: "medium",
    options: [],
    recommendedAction: "human_review",
    notes,
  };
}

function needsRuleArrayRepair(rawEntries: unknown[], repairedEntries: unknown[]): boolean {
  return rawEntries.some((entry) => typeof entry === "string") || repairedEntries.length !== rawEntries.length;
}
