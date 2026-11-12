import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertOutputOutsideReference,
} from './build-full-roster-inventory';
import {
  assertFullRosterInventory,
  type FullRosterAbilityInventory,
  type FullRosterDynamicSkillEntry,
  type FullRosterStaticSkillEntry,
} from './inventory-schema';
import { verifyReferenceRoot } from './verify-reference';

const AUTHORING_CARDS_PATH = 'src/content/authoring/cards.json';
const DEFAULT_INVENTORY_PATH = 'data/phase3/full-roster-ability-inventory.json';
const DEFAULT_MARKDOWN_PATH = 'docs/audits/fd-full-roster-semantic-axis-matrix.md';
const DEFAULT_SOURCE_EVIDENCE_OVERLAY_PATH = 'data/phase3/full-roster-source-evidence-overlays.json';

export type StructuredSourceEvidence =
  | {
      authority: 'FATE_DOMINATION_WIKI';
      document: 'Fate/Domination Wiki';
      locator: string;
      url: string;
    }
  | {
      authority: 'DEVELOPMENT_TEXT';
      document:
        | 'Fate_Domination-开发版/data_masters.js'
        | 'Fate_Domination-开发版/data_servants.js'
        | 'Fate_Domination-开发版/index.html';
      locator: string;
      sourceFileSha256: string;
      sourceText: string;
      sourceTextSha256: string;
    };

export interface StructuredAbility {
  id: string;
  printedClause: string;
  kind?: string;
  activation?: Record<string, unknown>;
  conditions?: unknown[];
  effects?: unknown[];
  lifecycle?: unknown;
  limit?: unknown;
  ruleModifiers?: unknown[];
  powerModifiers?: unknown[];
  visibility?: unknown;
  creates?: unknown[];
  transforms?: unknown[];
  execution?: Record<string, unknown>;
  source?: StructuredSourceEvidence;
  [key: string]: unknown;
}

export interface StructuredAuthoringCard {
  id: string;
  printedText: string;
  abilities: StructuredAbility[];
  sourceIndex?: number;
  source?: StructuredSourceEvidence;
  referencePrintedTextSha256?: string;
}

interface SourceEvidenceOverlayFile {
  schemaVersion: 1;
  kind: 'phase3-full-roster-source-evidence-overlays';
  cards: StructuredAuthoringCard[];
}

interface AuthoringCardsFile {
  skillCards: StructuredAuthoringCard[];
}

export interface SemanticAxes {
  timing: string[];
  trigger: string[];
  condition: string[];
  cost: string[];
  target: string[];
  effect: string[];
  interaction: string[];
  lifecycle: string[];
  modifier: string[];
  visibility: string[];
  binding: string[];
  battle: string[];
}

export interface NormalizedStructuredAbility {
  sourceAbilityId: string;
  kind: string;
  source: {
    document: string;
    locator: string;
  };
  axes: SemanticAxes;
}

export interface SemanticNormalizationRecord {
  status: 'SOURCE_GROUNDED' | 'BLOCKED';
  source: {
    document: string;
    locator: string;
  } | null;
  axes: SemanticAxes;
  abilities: NormalizedStructuredAbility[];
  blocks: string[];
  observedBehavior: {
    executionRoute: string | null;
    handlerId?: string;
  };
}

export type SemanticStaticSkillEntry = FullRosterStaticSkillEntry & {
  semanticNormalization: SemanticNormalizationRecord;
};

export type SemanticDynamicSkillEntry = FullRosterDynamicSkillEntry & {
  semanticNormalization: SemanticNormalizationRecord;
};

export type SemanticNormalizedInventory = Omit<FullRosterAbilityInventory, 'staticSkills' | 'dynamicSkills'> & {
  semanticSummary: {
    totalIdentityCount: number;
    sourceGroundedCount: number;
    blockedCount: number;
    unclassifiedCount: number;
    structuredAbilityCount: number;
  };
  staticSkills: SemanticStaticSkillEntry[];
  dynamicSkills: SemanticDynamicSkillEntry[];
};

const AXIS_KEYS: Array<keyof SemanticAxes> = [
  'timing',
  'trigger',
  'condition',
  'cost',
  'target',
  'effect',
  'interaction',
  'lifecycle',
  'modifier',
  'visibility',
  'binding',
  'battle',
];

function emptyAxes(): SemanticAxes {
  return {
    timing: [],
    trigger: [],
    condition: [],
    cost: [],
    target: [],
    effect: [],
    interaction: [],
    lifecycle: [],
    modifier: [],
    visibility: [],
    binding: [],
    battle: [],
  };
}

function uniqSorted(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function token(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function numericValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function collectConditionRecords(value: unknown, output: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) collectConditionRecords(item, output);
    return output;
  }
  if (!isRecord(value)) return output;

  if (typeof value.type === 'string') output.push(value);
  for (const [key, child] of Object.entries(value)) {
    if (key === 'effects' || key === 'ruleModifiers' || key === 'powerModifiers') continue;
    if (Array.isArray(child) || isRecord(child)) collectConditionRecords(child, output);
  }
  return output;
}

function collectEffectRecords(effects: unknown): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = [];

  const walkEffect = (value: unknown): void => {
    if (!isRecord(value)) return;
    if (typeof value.type === 'string') output.push(value);

    for (const [key, child] of Object.entries(value)) {
      if (
        key === 'conditions' ||
        key === 'condition' ||
        key === 'target' ||
        key === 'candidateTarget' ||
        key === 'scope' ||
        key === 'lifecycle' ||
        key === 'priority' ||
        key === 'ruleModifiers' ||
        key === 'powerModifiers'
      ) {
        continue;
      }

      if (key === 'effects' || key.endsWith('Effects')) {
        if (Array.isArray(child)) child.forEach(walkEffect);
        continue;
      }

      if (key === 'options' || key === 'branches' || key === 'choices') {
        if (!Array.isArray(child)) continue;
        for (const item of child) {
          if (!isRecord(item)) continue;
          const nestedEffects = item.effects;
          if (Array.isArray(nestedEffects)) nestedEffects.forEach(walkEffect);
        }
      }
    }
  };

  if (Array.isArray(effects)) effects.forEach(walkEffect);
  return output;
}

function collectLifecycle(value: unknown, output: string[] = [], prefix = ''): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        if (prefix) output.push(`${prefix}:${String(item)}`);
      } else {
        collectLifecycle(item, output, prefix);
      }
    }
    return output;
  }
  if (!isRecord(value)) return output;

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
      output.push(`${path}:${String(child)}`);
    } else {
      collectLifecycle(child, output, path);
    }
  }
  return output;
}

function collectNamedObjects(value: unknown, keyName: string, output: unknown[] = []): unknown[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNamedObjects(item, keyName, output));
    return output;
  }
  if (!isRecord(value)) return output;

  for (const [key, child] of Object.entries(value)) {
    if (key === keyName) {
      if (Array.isArray(child)) output.push(...child);
      else if (child != null) output.push(child);
    }
    if (Array.isArray(child) || isRecord(child)) collectNamedObjects(child, keyName, output);
  }
  return output;
}

function collectBindings(value: unknown, output: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectBindings(item, output));
    return output;
  }
  if (!isRecord(value)) return output;

  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string') {
      if (key === 'payloadKey') output.push(`payload:${child}`);
      if (key === 'resultVar') output.push(`result:${child}`);
      if (key === 'bindingField' || key === 'binding_field') output.push(`binding:${child}`);
      if (key === 'bind') output.push(`bind:${child}`);
    }
    if (key === 'printedClause' || key === 'name' || key === 'label') continue;
    if (Array.isArray(child) || isRecord(child)) collectBindings(child, output);
  }
  return output;
}

function selectionShape(effect: Record<string, unknown>): string | undefined {
  const type = stringValue(effect.type);
  if (!type) return undefined;
  const min = numericValue(effect.minCount);
  const max = numericValue(effect.maxCount);
  const exactlyOne = max === 1 && (min == null || min <= 1);

  if (type === 'choose_cards') return exactlyOne ? 'CHOOSE_ONE_CARD' : 'CHOOSE_N_CARDS';
  if (type === 'choose_players') return exactlyOne ? 'CHOOSE_ONE_PLAYER' : 'CHOOSE_N_PLAYERS';
  if (type === 'choose_locations') return exactlyOne ? 'CHOOSE_ONE_LOCATION' : 'CHOOSE_N_LOCATIONS';
  if (type === 'choose_events') return exactlyOne ? 'CHOOSE_ONE_EVENT' : 'CHOOSE_N_EVENTS';
  if (type === 'choose_number') return 'CHOOSE_NUMBER';
  if (type === 'choose_each_player_cards') return 'CHOOSE_EACH_PLAYER_CARDS';
  if (type === 'choose_each_player_option') return 'CHOOSE_EACH_PLAYER_OPTION';
  if (type === 'choose_one') return 'BRANCH_CHOICE';
  return undefined;
}

function collectLifecycleObjects(ability: StructuredAbility): unknown[] {
  return collectNamedObjects(ability, 'lifecycle');
}

export function normalizeStructuredAbility(ability: StructuredAbility): SemanticAxes {
  const axes = emptyAxes();
  const activation = isRecord(ability.activation) ? ability.activation : {};

  const addConditionAxes = (condition: Record<string, unknown>): void => {
    const type = stringValue(condition.type);
    if (!type) return;
    if (type === 'event_type_is') {
      const eventType = stringValue(condition.eventType);
      if (eventType) {
        axes.trigger.push(eventType);
        if (eventType.startsWith('combat.')) axes.battle.push('COMBAT_EVENT');
      }
      return;
    }
    axes.condition.push(token(type));
    if (/combat|battle/i.test(type)) axes.battle.push('COMBAT_CONDITION');
  };

  const phase = stringValue(activation.phase);
  if (phase) axes.timing.push(token(phase));
  if (Array.isArray(activation.phases)) {
    for (const value of activation.phases) {
      const phaseValue = stringValue(value);
      if (phaseValue) axes.timing.push(token(phaseValue));
    }
  }

  const conditionRecords = collectConditionRecords(ability.conditions ?? []);
  for (const condition of conditionRecords) {
    addConditionAxes(condition);
  }

  const effects = collectEffectRecords(ability.effects ?? []);
  for (const effect of effects) {
    const type = stringValue(effect.type);
    if (!type) continue;

    for (const condition of collectConditionRecords([effect.conditions, effect.condition])) {
      addConditionAxes(condition);
    }

    const shape = selectionShape(effect);
    if (shape) {
      axes.interaction.push(shape);
      axes.target.push(shape);
    }

    if (type === 'pay_mana') axes.cost.push('MANA');
    if (type === 'pay_command_seals') axes.cost.push('COMMAND_SEAL');
    if (type === 'pay_victory_points') axes.cost.push('VICTORY_POINTS');
    if (type === 'pay_discard_cards') axes.cost.push('DISCARD_CARDS');

    if (!type.startsWith('choose_') && !type.startsWith('pay_')) {
      axes.effect.push(token(type));
    }
    if (/combat|battle/i.test(type)) axes.battle.push('COMBAT_EFFECT');
    if (type === 'combat_power_bonus' || type === 'source_card_power_bonus') {
      axes.modifier.push(`effect:${type}`);
    }

    const face = stringValue(effect.face);
    if (face === 'down') axes.visibility.push('FACE_DOWN');
    if (face === 'up') axes.visibility.push('FACE_UP');
  }

  const ruleModifiers = collectNamedObjects(ability, 'ruleModifiers');
  for (const candidate of ruleModifiers) {
    if (!isRecord(candidate)) continue;
    const rule = stringValue(candidate.rule) ?? stringValue(candidate.id);
    const operation = stringValue(candidate.operation) ?? 'modify';
    if (rule) axes.modifier.push(`rule:${rule}:${operation}`);
    if (rule && /combat|battle|defeat/i.test(rule)) axes.battle.push('COMBAT_RULE_MODIFIER');
  }

  const powerModifiers = collectNamedObjects(ability, 'powerModifiers');
  for (const candidate of powerModifiers) {
    if (!isRecord(candidate)) continue;
    const id = stringValue(candidate.type) ?? stringValue(candidate.id) ?? 'structured';
    axes.modifier.push(`power:${id}`);
  }

  for (const lifecycle of collectLifecycleObjects(ability)) {
    collectLifecycle(lifecycle, axes.lifecycle);
  }
  if (typeof ability.limit === 'string') axes.lifecycle.push(`limit:${ability.limit}`);
  if (isRecord(ability.limit)) collectLifecycle(ability.limit, axes.lifecycle, 'limit');

  if (isRecord(ability.visibility)) {
    if (ability.visibility.revealsTrueName === true) axes.visibility.push('REVEALS_TRUE_NAME');
    const revealTiming = stringValue(ability.visibility.revealTiming);
    const revealScope = stringValue(ability.visibility.revealScope);
    if (revealTiming) axes.visibility.push(`revealTiming:${revealTiming}`);
    if (revealScope) axes.visibility.push(`revealScope:${revealScope}`);
    if (Array.isArray(ability.visibility.inspectZones)) {
      for (const value of ability.visibility.inspectZones) {
        const zone = stringValue(value);
        if (zone) axes.visibility.push(`inspectZone:${zone}`);
      }
    }
  }

  collectBindings(ability, axes.binding);

  for (const key of AXIS_KEYS) axes[key] = uniqSorted(axes[key]);
  return axes;
}

function mergeAxes(records: NormalizedStructuredAbility[]): SemanticAxes {
  const merged = emptyAxes();
  for (const record of records) {
    for (const key of AXIS_KEYS) merged[key].push(...record.axes[key]);
  }
  for (const key of AXIS_KEYS) merged[key] = uniqSorted(merged[key]);
  return merged;
}

function observedBehavior(
  entry: FullRosterStaticSkillEntry | FullRosterDynamicSkillEntry,
): SemanticNormalizationRecord['observedBehavior'] {
  return {
    executionRoute: entry.reference.executionRoute,
    ...(entry.reference.handlerId ? { handlerId: entry.reference.handlerId } : {}),
  };
}

function blockedRecord(
  entry: FullRosterStaticSkillEntry | FullRosterDynamicSkillEntry,
  blocks: string[],
): SemanticNormalizationRecord {
  return {
    status: 'BLOCKED',
    source: null,
    axes: emptyAxes(),
    abilities: [],
    blocks: uniqSorted(blocks),
    observedBehavior: observedBehavior(entry),
  };
}

function normalizeStaticEntry(
  entry: FullRosterStaticSkillEntry,
  card: StructuredAuthoringCard | undefined,
  sourceIndex: number | undefined,
): SemanticStaticSkillEntry {
  if (!card) {
    return {
      ...entry,
      semanticNormalization: blockedRecord(entry, [
        ...entry.blockedBy,
        'SEMANTIC_SOURCE_REQUIRED',
      ]),
    };
  }

  const externalEvidence = card.source !== undefined;
  if (externalEvidence) {
    const expectedReferenceHash = createHash('sha256').update(entry.printedText, 'utf8').digest('hex');
    if (card.referencePrintedTextSha256 !== expectedReferenceHash) {
      return {
        ...entry,
        semanticNormalization: blockedRecord(entry, [
          ...entry.blockedBy,
          'SEMANTIC_SOURCE_CONFLICT',
        ]),
      };
    }
  }
  if (!externalEvidence && (!entry.reference.hasAuthoringCard || card.printedText !== entry.printedText)) {
    return {
      ...entry,
      semanticNormalization: blockedRecord(entry, [
        ...entry.blockedBy,
        'SEMANTIC_SOURCE_CONFLICT',
      ]),
    };
  }

  const cardIndex = card.sourceIndex ?? sourceIndex ?? 0;
  const cardSource = externalEvidence
    ? { document: card.source!.document, locator: card.source!.locator }
    : { document: AUTHORING_CARDS_PATH, locator: `skillCards[${cardIndex}]` };
  const abilities: NormalizedStructuredAbility[] = card.abilities.map((ability, abilityIndex) => ({
    sourceAbilityId: ability.id,
    kind: stringValue(ability.kind)?.toUpperCase() ?? 'UNSPECIFIED',
    source: ability.source
      ? { document: ability.source.document, locator: ability.source.locator }
      : externalEvidence
        ? { document: card.source!.document, locator: `${card.source!.locator}#ability-${abilityIndex + 1}` }
        : { document: AUTHORING_CARDS_PATH, locator: `skillCards[${cardIndex}].abilities[${abilityIndex}]` },
    axes: normalizeStructuredAbility(ability),
  }));

  if (abilities.length === 0) {
    return {
      ...entry,
      semanticNormalization: blockedRecord(entry, [
        ...entry.blockedBy,
        'SEMANTIC_SOURCE_REQUIRED',
      ]),
    };
  }

  return {
    ...entry,
    semanticNormalization: {
      status: 'SOURCE_GROUNDED',
      source: cardSource,
      axes: mergeAxes(abilities),
      abilities,
      blocks: [],
      observedBehavior: observedBehavior(entry),
    },
  };
}

function normalizeDynamicEntry(
  entry: FullRosterDynamicSkillEntry,
  card: StructuredAuthoringCard | undefined,
): SemanticDynamicSkillEntry {
  if (!card?.source) {
    return {
      ...entry,
      semanticNormalization: blockedRecord(entry, [
        ...entry.blockedBy,
        'SEMANTIC_SOURCE_REQUIRED',
      ]),
    };
  }

  const expectedEvidenceHash = createHash('sha256').update(card.printedText, 'utf8').digest('hex');
  if (card.referencePrintedTextSha256 !== expectedEvidenceHash) {
    return {
      ...entry,
      semanticNormalization: blockedRecord(entry, [
        ...entry.blockedBy,
        'SEMANTIC_SOURCE_CONFLICT',
      ]),
    };
  }

  const abilities: NormalizedStructuredAbility[] = card.abilities.map((ability, abilityIndex) => ({
    sourceAbilityId: ability.id,
    kind: stringValue(ability.kind)?.toUpperCase() ?? 'UNSPECIFIED',
    source: ability.source
      ? { document: ability.source.document, locator: ability.source.locator }
      : { document: card.source!.document, locator: `${card.source!.locator}#ability-${abilityIndex + 1}` },
    axes: normalizeStructuredAbility(ability),
  }));

  if (abilities.length === 0) {
    return {
      ...entry,
      semanticNormalization: blockedRecord(entry, [
        ...entry.blockedBy,
        'SEMANTIC_SOURCE_REQUIRED',
      ]),
    };
  }

  return {
    ...entry,
    semanticNormalization: {
      status: 'SOURCE_GROUNDED',
      source: { document: card.source.document, locator: card.source.locator },
      axes: mergeAxes(abilities),
      abilities,
      blocks: [],
      observedBehavior: observedBehavior(entry),
    },
  };
}

export function loadSourceEvidenceOverlayCards(
  projectRoot = process.cwd(),
  overlayPath = DEFAULT_SOURCE_EVIDENCE_OVERLAY_PATH,
): StructuredAuthoringCard[] {
  const absolutePath = resolve(projectRoot, overlayPath);
  if (!existsSync(absolutePath)) return [];

  const file = JSON.parse(readFileSync(absolutePath, 'utf8')) as SourceEvidenceOverlayFile;
  if (file.schemaVersion !== 1 || file.kind !== 'phase3-full-roster-source-evidence-overlays' || !Array.isArray(file.cards)) {
    throw new Error('Unsupported full-roster source-evidence overlay schema.');
  }

  const seen = new Set<string>();
  for (const card of file.cards) {
    if (!card || typeof card.id !== 'string' || card.id.length === 0 || seen.has(card.id)) {
      throw new Error(`Invalid or duplicate source-evidence overlay card ID: ${String(card?.id ?? '<missing>')}`);
    }
    seen.add(card.id);
    if (typeof card.printedText !== 'string' || card.printedText.length === 0 || !Array.isArray(card.abilities) || card.abilities.length === 0) {
      throw new Error(`Source-evidence overlay must preserve printed text and structured abilities: ${card.id}`);
    }
    const source = card.source;
    if (typeof source?.locator !== 'string' || source.locator.length === 0) {
      throw new Error(`Source-evidence overlay has no stable locator: ${card.id}`);
    }
    if (typeof card.referencePrintedTextSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(card.referencePrintedTextSha256)) {
      throw new Error(`Source-evidence overlay is not bound to locked Reference text: ${card.id}`);
    }

    if (source.authority === 'FATE_DOMINATION_WIKI') {
      let parsedUrl: URL | undefined;
      try {
        parsedUrl = new URL(source.url);
      } catch {
        parsedUrl = undefined;
      }
      if (
        source.document !== 'Fate/Domination Wiki' ||
        parsedUrl?.protocol !== 'https:' ||
        parsedUrl.hostname !== 'fatedomination.fandom.com' ||
        !parsedUrl.pathname.startsWith('/wiki/')
      ) {
        throw new Error(`Source-evidence overlay is not from the allowed Fate/Domination Wiki: ${card.id}`);
      }
    } else if (source.authority === 'DEVELOPMENT_TEXT') {
      const allowedDevelopmentDocuments = new Set([
        'Fate_Domination-开发版/data_masters.js',
        'Fate_Domination-开发版/data_servants.js',
        'Fate_Domination-开发版/index.html',
      ]);
      if (
        !allowedDevelopmentDocuments.has(source.document) ||
        !/^[a-f0-9]{64}$/.test(source.sourceFileSha256) ||
        typeof source.sourceText !== 'string' ||
        source.sourceText.length === 0 ||
        !/^[a-f0-9]{64}$/.test(source.sourceTextSha256) ||
        createHash('sha256').update(source.sourceText, 'utf8').digest('hex') !== source.sourceTextSha256 ||
        source.sourceText !== card.printedText ||
        source.sourceTextSha256 !== card.referencePrintedTextSha256
      ) {
        throw new Error(`Source-evidence overlay is not a valid locked development-text snapshot: ${card.id}`);
      }
    } else {
      throw new Error(`Unsupported source-evidence authority: ${card.id}`);
    }
    for (const ability of card.abilities) {
      if (typeof ability.id !== 'string' || ability.id.length === 0 || typeof ability.printedClause !== 'string' || ability.printedClause.length === 0) {
        throw new Error(`Source-evidence overlay has an invalid structured ability: ${card.id}`);
      }
    }
  }
  return file.cards;
}

export function normalizeFullRosterSemantics(
  inventory: FullRosterAbilityInventory,
  authoringCards: StructuredAuthoringCard[],
): SemanticNormalizedInventory {
  assertFullRosterInventory(inventory);

  const authoringById = new Map<string, { card: StructuredAuthoringCard; index: number }>();
  for (const [index, card] of authoringCards.entries()) {
    if (authoringById.has(card.id)) throw new Error(`Duplicate structured authoring card ID: ${card.id}`);
    authoringById.set(card.id, { card, index });
  }

  const staticSkills = inventory.staticSkills.map((entry) => {
    const source = authoringById.get(entry.reference.skillId);
    return normalizeStaticEntry(entry, source?.card, source?.index);
  });

  const dynamicSkills = inventory.dynamicSkills.map((entry) => {
    const source = authoringById.get(entry.reference.skillId);
    return normalizeDynamicEntry(entry, source?.card);
  });

  const all = [...staticSkills, ...dynamicSkills];
  const sourceGroundedCount = all.filter(
    (entry) => entry.semanticNormalization.status === 'SOURCE_GROUNDED',
  ).length;
  const blockedCount = all.filter(
    (entry) => entry.semanticNormalization.status === 'BLOCKED',
  ).length;
  const structuredAbilityCount = all.reduce(
    (total, entry) => total + entry.semanticNormalization.abilities.length,
    0,
  );
  const totalIdentityCount = all.length;
  const unclassifiedCount = totalIdentityCount - sourceGroundedCount - blockedCount;

  if (unclassifiedCount !== 0) {
    throw new Error(`Semantic normalization left ${unclassifiedCount} identities unclassified.`);
  }

  return {
    ...inventory,
    semanticSummary: {
      totalIdentityCount,
      sourceGroundedCount,
      blockedCount,
      unclassifiedCount,
      structuredAbilityCount,
    },
    staticSkills,
    dynamicSkills,
  };
}

function markdownCell(values: string[]): string {
  if (values.length === 0) return '`NONE`';
  return values.map((value) => `\`${value.replace(/`/g, '\\`')}\``).join(', ');
}

export function renderSemanticAxisMatrix(inventory: SemanticNormalizedInventory): string {
  const lines: string[] = [];
  lines.push('# FD Full-Roster Semantic Axis Matrix', '');
  lines.push('- Document Role: AUDIT');
  lines.push('- Status: PHASE_3_FS03_NORMALIZED');
  lines.push('- Authority: V2 structured authoring is canonical only when source-aligned; Reference handler shape is observed behavior only.');
  lines.push('- Interaction Policy: interaction is derived only from explicit structured interaction fields/effects, never timing or printed wording.');
  lines.push('');
  lines.push(`totalIdentityCount=${inventory.semanticSummary.totalIdentityCount}`);
  lines.push(`sourceGroundedCount=${inventory.semanticSummary.sourceGroundedCount}`);
  lines.push(`blockedCount=${inventory.semanticSummary.blockedCount}`);
  lines.push(`unclassifiedCount=${inventory.semanticSummary.unclassifiedCount}`);
  lines.push(`structuredAbilityCount=${inventory.semanticSummary.structuredAbilityCount}`);
  lines.push('');
  lines.push('## Axis Value Counts', '');
  lines.push('| Axis | Value | Identity Count |');
  lines.push('|---|---|---:|');

  const allEntries = [...inventory.staticSkills, ...inventory.dynamicSkills];
  for (const axis of AXIS_KEYS) {
    const counts = new Map<string, number>();
    for (const entry of allEntries) {
      for (const value of entry.semanticNormalization.axes[axis]) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
    const ordered = [...counts.entries()].sort(
      (left, right) => right[1] - left[1] || (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0),
    );
    if (ordered.length === 0) {
      lines.push(`| ${axis} | \`NONE\` | 0 |`);
    } else {
      for (const [value, count] of ordered) lines.push(`| ${axis} | \`${value}\` | ${count} |`);
    }
  }

  lines.push('', '## Identity-Level Matrix', '');
  lines.push('| Canonical Ability | Status | Blocks | Timing | Trigger | Condition | Cost | Target | Effect | Interaction | Lifecycle | Modifier | Visibility | Binding | Battle | Observed Handler |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const entry of allEntries) {
    const semantic = entry.semanticNormalization;
    lines.push(
      `| \`${entry.canonicalAbilityId}\` | \`${semantic.status}\` | ${markdownCell(semantic.blocks)} | ${markdownCell(semantic.axes.timing)} | ${markdownCell(semantic.axes.trigger)} | ${markdownCell(semantic.axes.condition)} | ${markdownCell(semantic.axes.cost)} | ${markdownCell(semantic.axes.target)} | ${markdownCell(semantic.axes.effect)} | ${markdownCell(semantic.axes.interaction)} | ${markdownCell(semantic.axes.lifecycle)} | ${markdownCell(semantic.axes.modifier)} | ${markdownCell(semantic.axes.visibility)} | ${markdownCell(semantic.axes.binding)} | ${markdownCell(semantic.axes.battle)} | ${semantic.observedBehavior.handlerId ? `\`${semantic.observedBehavior.handlerId}\`` : '`NONE`'} |`,
    );
  }

  return `${lines.join('\n')}\n`;
}

function parseArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith('--')) return undefined;
  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const referenceRootArgument = parseArgument(args, '--reference-root');
  if (!referenceRootArgument) {
    throw new Error('Usage: normalize-semantic-axes --reference-root <clean-reference-checkout> [--inventory <inventory.json>] [--output <inventory.json>] [--markdown-output <matrix.md>] [--source-evidence-overlay <overlay.json>]');
  }

  const referenceRoot = resolve(referenceRootArgument);
  const inventoryPath = resolve(parseArgument(args, '--inventory') ?? DEFAULT_INVENTORY_PATH);
  const outputPath = resolve(parseArgument(args, '--output') ?? inventoryPath);
  const markdownPath = resolve(parseArgument(args, '--markdown-output') ?? DEFAULT_MARKDOWN_PATH);
  assertOutputOutsideReference(referenceRoot, outputPath);
  assertOutputOutsideReference(referenceRoot, markdownPath);

  const verifiedReference = verifyReferenceRoot(referenceRoot);
  const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as unknown;
  assertFullRosterInventory(inventory);
  if (
    inventory.provenance.repository !== verifiedReference.repository ||
    inventory.provenance.commit !== verifiedReference.commit
  ) {
    throw new Error('Inventory provenance does not match the locked Reference checkout.');
  }

  const authoringFile = JSON.parse(
    readFileSync(resolve(referenceRoot, AUTHORING_CARDS_PATH), 'utf8'),
  ) as AuthoringCardsFile;
  if (!Array.isArray(authoringFile.skillCards)) {
    throw new Error('Reference authoring cards are missing skillCards.');
  }

  const cards = authoringFile.skillCards.map((card, sourceIndex) => ({ ...card, sourceIndex }));
  const overlayCards = loadSourceEvidenceOverlayCards(
    process.cwd(),
    parseArgument(args, '--source-evidence-overlay') ?? DEFAULT_SOURCE_EVIDENCE_OVERLAY_PATH,
  );
  const normalized = normalizeFullRosterSemantics(inventory, [...cards, ...overlayCards]);
  const serialized = `${JSON.stringify(normalized, null, 2)}\n`;
  const markdown = renderSemanticAxisMatrix(normalized);

  mkdirSync(dirname(outputPath), { recursive: true });
  mkdirSync(dirname(markdownPath), { recursive: true });
  writeFileSync(outputPath, serialized, 'utf8');
  writeFileSync(markdownPath, markdown, 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        ...normalized.semanticSummary,
        output: DEFAULT_INVENTORY_PATH,
        markdown: DEFAULT_MARKDOWN_PATH,
      },
      null,
      2,
    )}\n`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));

if (invokedPath === modulePath) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
