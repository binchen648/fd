export type InventoryOwnerType = 'master' | 'servant';
export type ReferenceExecutionRoute = 'deterministic' | 'shared_handler' | 'specific_handler';
export type InventoryClauseClassification = 'DISCOVERED' | 'SOURCE_GROUNDED';
export type InventoryClauseDerivation =
  | 'reference_structured_clause'
  | 'v2_printed_clause'
  | 'mechanical_line_split';

export interface InventorySourceRef {
  kind: string;
  document: string;
  locator: string;
  [key: string]: unknown;
}

export interface InventoryClauseRecord {
  text: string;
  classification: InventoryClauseClassification;
  derivation: InventoryClauseDerivation;
  source: {
    document: string;
    locator: string;
    sha256: string;
  };
  sourceAbilityId?: string;
}

export interface FullRosterStaticSkillEntry {
  canonicalAbilityId: string;
  canonicalCardId: string;
  ownerId: string;
  ownerType: InventoryOwnerType;
  ownerName: string;
  skillName: string;
  printedText: string;
  clauses: InventoryClauseRecord[];
  sources: InventorySourceRef[];
  reference: {
    skillId: string;
    legacySkillId?: string;
    handlerId?: string;
    executionRoute: ReferenceExecutionRoute;
    hasAuthoringCard: boolean;
    hasConfirmedOverride: boolean;
    dynamic: false;
  };
  classification: 'DISCOVERED' | 'SOURCE_GROUNDED';
  blockedBy: string[];
}

export interface FullRosterDynamicSkillEntry {
  canonicalAbilityId: string;
  canonicalCardId: string;
  ownerId: string;
  ownerType: InventoryOwnerType;
  ownerName: string;
  skillName: null;
  printedText: null;
  clauses: InventoryClauseRecord[];
  sources: InventorySourceRef[];
  reference: {
    skillId: string;
    executionRoute: null;
    hasAuthoringCard: false;
    hasConfirmedOverride: false;
    dynamic: true;
  };
  classification: 'DISCOVERED';
  blockedBy: string[];
}

export interface FullRosterAbilityInventory {
  schemaVersion: 1;
  kind: 'phase3-full-roster-ability-inventory';
  provenance: {
    repository: string;
    commit: string;
    inputDigests: Record<string, string>;
  };
  summary: {
    staticSkillCount: number;
    dynamicSkillCount: number;
    totalIdentityCount: number;
    authoringSkillCount: number;
    confirmedOverrideSkillCount: number;
  };
  staticSkills: FullRosterStaticSkillEntry[];
  dynamicSkills: FullRosterDynamicSkillEntry[];
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function assertClauseArray(
  clauses: unknown,
  blockedBy: unknown,
  skillId: string,
  allowEmptyWhenBlocked: boolean,
): void {
  if (!Array.isArray(clauses)) {
    throw new Error(`Skill clauses must be an array: ${skillId}`);
  }
  if (clauses.length === 0 && allowEmptyWhenBlocked) {
    if (!Array.isArray(blockedBy) || !blockedBy.includes('SOURCE_EVIDENCE_REQUIRED')) {
      throw new Error(`Skill without clauses must carry SOURCE_EVIDENCE_REQUIRED: ${skillId}`);
    }
  }
  if (clauses.length === 0 && !allowEmptyWhenBlocked) {
    throw new Error(`Static skill must preserve printed text as one or more clauses: ${skillId}`);
  }

  for (const clause of clauses) {
    assertRecord(clause, `Clause for ${skillId}`);
    assertRecord(clause.source, `Clause source for ${skillId}`);
    if (typeof clause.text !== 'string' || clause.text.length === 0) {
      throw new Error(`Clause text is required for ${skillId}.`);
    }
    if (clause.classification !== 'DISCOVERED' && clause.classification !== 'SOURCE_GROUNDED') {
      throw new Error(`Unsupported clause classification for ${skillId}.`);
    }
    if (
      clause.derivation !== 'reference_structured_clause' &&
      clause.derivation !== 'v2_printed_clause' &&
      clause.derivation !== 'mechanical_line_split'
    ) {
      throw new Error(`Unsupported clause derivation for ${skillId}.`);
    }
    if (typeof clause.source.document !== 'string' || clause.source.document.length === 0) {
      throw new Error(`Clause source document is required for ${skillId}.`);
    }
    if (typeof clause.source.locator !== 'string' || clause.source.locator.length === 0) {
      throw new Error(`Clause source locator is required for ${skillId}.`);
    }
    if (typeof clause.source.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(clause.source.sha256)) {
      throw new Error(`Clause source SHA-256 is invalid for ${skillId}.`);
    }
  }
}

export function assertFullRosterInventory(value: unknown): asserts value is FullRosterAbilityInventory {
  assertRecord(value, 'Full-roster inventory');

  if (value.schemaVersion !== 1 || value.kind !== 'phase3-full-roster-ability-inventory') {
    throw new Error('Unsupported full-roster inventory schema.');
  }

  assertRecord(value.provenance, 'Inventory provenance');
  if (typeof value.provenance.repository !== 'string' || value.provenance.repository.length === 0) {
    throw new Error('Inventory provenance repository is required.');
  }
  if (typeof value.provenance.commit !== 'string' || !/^[a-f0-9]{40}$/.test(value.provenance.commit)) {
    throw new Error('Inventory provenance commit must be an exact Git SHA-1.');
  }
  assertRecord(value.provenance.inputDigests, 'Inventory inputDigests');
  for (const [relativePath, digest] of Object.entries(value.provenance.inputDigests)) {
    if (!relativePath || typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error(`Invalid SHA-256 provenance digest for ${relativePath || '<empty>'}.`);
    }
  }

  if (!Array.isArray(value.staticSkills) || !Array.isArray(value.dynamicSkills)) {
    throw new Error('Inventory staticSkills and dynamicSkills must be arrays.');
  }
  if (value.staticSkills.length !== 943) {
    throw new Error(`Expected exactly 943 static skills, got ${value.staticSkills.length}.`);
  }
  if (value.dynamicSkills.length !== 1) {
    throw new Error(`Expected exactly 1 dynamic skill, got ${value.dynamicSkills.length}.`);
  }

  const staticIds = value.staticSkills.map((entry) => {
    assertRecord(entry, 'Static skill entry');
    assertRecord(entry.reference, 'Static skill reference');
    if (typeof entry.reference.skillId !== 'string' || entry.reference.skillId.length === 0) {
      throw new Error('Static skill reference.skillId is required.');
    }
    if (entry.canonicalAbilityId !== entry.reference.skillId || entry.canonicalCardId !== entry.reference.skillId) {
      throw new Error(`Canonical identity must preserve the Reference skill ID exactly: ${entry.reference.skillId}`);
    }
    if (entry.reference.dynamic !== false) {
      throw new Error(`Static skill cannot be marked dynamic: ${entry.reference.skillId}`);
    }
    assertClauseArray(entry.clauses, entry.blockedBy, entry.reference.skillId, true);
    return entry.reference.skillId;
  });

  const dynamicIds = value.dynamicSkills.map((entry) => {
    assertRecord(entry, 'Dynamic skill entry');
    assertRecord(entry.reference, 'Dynamic skill reference');
    if (typeof entry.reference.skillId !== 'string' || entry.reference.skillId.length === 0) {
      throw new Error('Dynamic skill reference.skillId is required.');
    }
    if (entry.canonicalAbilityId !== entry.reference.skillId || entry.canonicalCardId !== entry.reference.skillId) {
      throw new Error(`Canonical dynamic identity must preserve the Reference skill ID exactly: ${entry.reference.skillId}`);
    }
    if (entry.reference.dynamic !== true) {
      throw new Error(`Dynamic skill must be marked dynamic: ${entry.reference.skillId}`);
    }
    assertClauseArray(entry.clauses, entry.blockedBy, entry.reference.skillId, true);
    return entry.reference.skillId;
  });

  assertUnique(staticIds, 'static skill ID');
  assertUnique(dynamicIds, 'dynamic skill ID');
  assertUnique([...staticIds, ...dynamicIds], 'canonical skill ID');

  const sortedStaticIds = [...staticIds].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  if (staticIds.some((id, index) => id !== sortedStaticIds[index])) {
    throw new Error('Static skills are not deterministically ordered by Reference skill ID.');
  }

  assertRecord(value.summary, 'Inventory summary');
  if (
    value.summary.staticSkillCount !== 943 ||
    value.summary.dynamicSkillCount !== 1 ||
    value.summary.totalIdentityCount !== 944
  ) {
    throw new Error('Inventory summary counts do not match 943 static + 1 dynamic identities.');
  }
}
