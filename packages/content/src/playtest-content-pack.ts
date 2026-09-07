export type AttackAttribute = 'strength' | 'agility' | 'magecraft' | 'special';

export type CapabilityStatus = 'FULL' | 'PARTIAL' | 'HOST_ADJUDICATED';

export type CardTiming =
  | 'round_start'
  | 'preparation'
  | 'advance'
  | 'action'
  | 'battle'
  | 'after_battle'
  | 'cleanup'
  | 'round_end';

export type CardInteractionKind =
  | 'automatic'
  | 'activated'
  | 'triggered'
  | 'response'
  | 'choice'
  | 'host_ruling';

export interface CardInteraction {
  kind: CardInteractionKind;
  visibility: 'public' | 'private' | 'owner_only';
  responseTo?: string[];
  targetTypes?: string[];
  optional?: boolean;
}

export interface DeckEntry {
  entryType: 'basic' | 'named';
  attribute: AttackAttribute;
  printedValue?: number;
  cardId?: string;
  copies: number;
}

export interface SourceEvidence {
  htmPath: string;
  imagePath: string;
  imageIndex: number;
  reviewedAgainstImage: boolean;
}

export interface CapabilityProfile {
  status: CapabilityStatus;
  supportedDimensions?: string[];
  hostRulingReason?: string;
}

export interface AmbiguityRecord {
  field: string;
  description: string;
  source: SourceEvidence;
  requiresConfirmation: true;
}

export interface LinkedCards {
  transformations?: string[];
  generated?: string[];
  replacements?: string[];
  referenceOnly?: string[];
}

export interface AttributeCounts {
  strength: number;
  agility: number;
  magecraft: number;
  special: number;
}

export interface ServantDefinition {
  id: string;
  name: string;
  classTag: string;
  overviewCardId: string;
  startingDeck: {
    size: 12;
    entries: DeckEntry[];
    attributeCounts: AttributeCounts;
  };
  skillCardIds: [string, string, string];
  linkedCards: LinkedCards;
  capability: CapabilityProfile;
  source: SourceEvidence;
  ambiguities?: AmbiguityRecord[];
}

export interface RuleOverride {
  dimension: string;
  description: string;
  capability: CapabilityProfile;
}

export interface MasterDefinition {
  id: string;
  name: string;
  overviewCardId: string;
  initialMana: number;
  commandSpellCardIds: string[];
  skillCardIds: string[];
  linkedCards: LinkedCards;
  independentDeck?: {
    entries: Array<{
      cardId: string;
      copies: number;
    }>;
  };
  ruleOverrides?: RuleOverride[];
  capability: CapabilityProfile;
  source: SourceEvidence;
  ambiguities?: AmbiguityRecord[];
}

export type NamedCardType =
  | 'servant_overview'
  | 'servant_skill'
  | 'master_overview'
  | 'master_skill'
  | 'command_spell'
  | 'named_attack'
  | 'transformation'
  | 'generated'
  | 'replacement'
  | 'reference'
  | 'event'
  | 'situation';

export interface EffectPrimitive {
  type: string;
  [key: string]: unknown;
}

export interface NamedCardDefinition {
  id: string;
  name: string;
  cardType: NamedCardType;
  attribute?: AttackAttribute;
  attributes?: AttackAttribute[];
  printedValue?: number;
  printedCost?: number;
  printedValueExpression?: string;
  printedText?: string;
  timing?: CardTiming[];
  interactions?: CardInteraction[];
  traits?: string[];
  effects?: EffectPrimitive[];
  printedReward?: number;
  applicableLocations?: Array<'deep_mountain' | 'new_capital'>;
  relatedEventSetIds?: string[];
  capability: CapabilityProfile;
  source: SourceEvidence;
  ambiguities?: AmbiguityRecord[];
}

export interface EventSetDefinition {
  id: string;
  name: string;
  cardIds: string[];
  capability: CapabilityProfile;
  source: SourceEvidence;
  ambiguities?: AmbiguityRecord[];
}

export interface ContentPack {
  id: string;
  name: string;
  version: number;
  servants: ServantDefinition[];
  masters: MasterDefinition[];
  cards: NamedCardDefinition[];
  eventSets: EventSetDefinition[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  entityId?: string;
  field?: string;
}

const ATTACK_ATTRIBUTES: AttackAttribute[] = [
  'strength',
  'agility',
  'magecraft',
  'special',
];

const CAPABILITY_STATUSES: CapabilityStatus[] = [
  'FULL',
  'PARTIAL',
  'HOST_ADJUDICATED',
];

export function computeAttributeCounts(entries: DeckEntry[]): AttributeCounts {
  const counts: AttributeCounts = {
    strength: 0,
    agility: 0,
    magecraft: 0,
    special: 0,
  };

  for (const entry of entries) {
    if (ATTACK_ATTRIBUTES.includes(entry.attribute)) {
      counts[entry.attribute] += entry.copies;
    }
  }

  return counts;
}

function validateCapability(
  capability: CapabilityProfile,
  entityId: string,
): ValidationIssue[] {
  if (!CAPABILITY_STATUSES.includes(capability.status)) {
    return [
      {
        code: 'CAPABILITY_STATUS',
        message: `Unsupported capability status: ${String(capability.status)}`,
        entityId,
        field: 'capability.status',
      },
    ];
  }

  return [];
}

function validateSource(source: SourceEvidence, entityId: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const field of ['htmPath', 'imagePath'] as const) {
    if (typeof source[field] !== 'string' || source[field].trim().length === 0) {
      issues.push({
        code: 'SOURCE_PATH',
        message: `${field} must be a non-empty workspace-relative path`,
        entityId,
        field: `source.${field}`,
      });
    }
  }

  return issues;
}

function validateEntityMetadata(
  entity: { id: string; capability: CapabilityProfile; source: SourceEvidence },
): ValidationIssue[] {
  return [
    ...validateCapability(entity.capability, entity.id),
    ...validateSource(entity.source, entity.id),
  ];
}

export function validateServantDefinition(
  servant: ServantDefinition,
): ValidationIssue[] {
  const issues = validateEntityMetadata(servant);
  const physicalDeckSize = servant.startingDeck.entries.reduce(
    (total, entry) => total + entry.copies,
    0,
  );

  if (servant.startingDeck.size !== 12 || physicalDeckSize !== 12) {
    issues.push({
      code: 'SERVANT_DECK_SIZE',
      message: `Servant deck must contain exactly 12 physical cards; found ${physicalDeckSize}`,
      entityId: servant.id,
      field: 'startingDeck.entries',
    });
  }

  if (servant.skillCardIds.length !== 3) {
    issues.push({
      code: 'SERVANT_SKILL_COUNT',
      message: 'Servant must reference exactly three skill cards',
      entityId: servant.id,
      field: 'skillCardIds',
    });
  }

  if (new Set(servant.skillCardIds).size !== servant.skillCardIds.length) {
    issues.push({
      code: 'SERVANT_SKILL_IDS_UNIQUE',
      message: 'Servant skill card IDs must be unique',
      entityId: servant.id,
      field: 'skillCardIds',
    });
  }

  const computedCounts = computeAttributeCounts(servant.startingDeck.entries);
  if (ATTACK_ATTRIBUTES.some(
    (attribute) => computedCounts[attribute] !== servant.startingDeck.attributeCounts[attribute],
  )) {
    issues.push({
      code: 'SERVANT_ATTRIBUTE_COUNTS',
      message: 'Servant attribute counts do not match its deck entries',
      entityId: servant.id,
      field: 'startingDeck.attributeCounts',
    });
  }

  return issues;
}

const CARD_TIMINGS: CardTiming[] = [
  'round_start',
  'preparation',
  'advance',
  'action',
  'battle',
  'after_battle',
  'cleanup',
  'round_end',
];

const CARD_INTERACTION_KINDS: CardInteractionKind[] = [
  'automatic',
  'activated',
  'triggered',
  'response',
  'choice',
  'host_ruling',
];

export function validateNamedCardDefinition(
  card: NamedCardDefinition,
): ValidationIssue[] {
  const issues = validateEntityMetadata(card);

  if ((card.effects?.length ?? 0) > 0 && (card.timing?.length ?? 0) === 0) {
    issues.push({
      code: 'CARD_TIMING_REQUIRED',
      message: 'Effect-bearing cards must declare at least one operation timing',
      entityId: card.id,
      field: 'timing',
    });
  }

  for (const timing of card.timing ?? []) {
    if (!CARD_TIMINGS.includes(timing)) {
      issues.push({
        code: 'CARD_TIMING',
        message: `Unsupported card timing: ${String(timing)}`,
        entityId: card.id,
        field: 'timing',
      });
    }
  }

  for (const interaction of card.interactions ?? []) {
    if (!CARD_INTERACTION_KINDS.includes(interaction.kind)) {
      issues.push({
        code: 'CARD_INTERACTION_KIND',
        message: `Unsupported interaction kind: ${String(interaction.kind)}`,
        entityId: card.id,
        field: 'interactions.kind',
      });
    }
  }

  return issues;
}

export function validateContentPack(pack: ContentPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entities = [
    ...pack.servants,
    ...pack.masters,
    ...pack.cards,
    ...pack.eventSets,
  ];
  const seenIds = new Set<string>();

  for (const entity of entities) {
    if (seenIds.has(entity.id)) {
      issues.push({
        code: 'DUPLICATE_ENTITY_ID',
        message: `Duplicate entity ID: ${entity.id}`,
        entityId: entity.id,
        field: 'id',
      });
    }
    seenIds.add(entity.id);
  }

  for (const servant of pack.servants) {
    issues.push(...validateServantDefinition(servant));
  }

  for (const entity of [...pack.masters, ...pack.eventSets]) {
    issues.push(...validateEntityMetadata(entity));
  }

  for (const card of pack.cards) {
    issues.push(...validateNamedCardDefinition(card));
  }

  return issues;
}
