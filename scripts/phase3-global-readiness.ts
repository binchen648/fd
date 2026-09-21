import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type ClassificationRoute =
  | 'READY_GENERIC_EXTENSION'
  | 'SOURCE_EVIDENCE_REQUIRED'
  | 'SPECIAL_HANDLER_CANDIDATE';

export type GlobalReadinessState =
  | 'MIGRATED_CONFIRMED'
  | 'S_READY_NOW'
  | 'ONE_SHARED_GAP'
  | 'TRANSITIVE_DEPENDENCY'
  | 'MULTI_GAP'
  | 'SOURCE_EVIDENCE_REQUIRED'
  | 'RULE_DECISION_REQUIRED'
  | 'SPECIAL_HANDLER_REVIEW'
  | 'COMPLETE_CARD_PROBE_REQUIRED'
  | 'ACTIVE_TASK_RESERVED';

export interface GlobalReadinessInventoryEntry {
  canonicalAbilityId: string;
  ownerId: string;
  classificationRoute: ClassificationRoute;
  mechanicFamilies: string[];
  requiredCapabilities: string[];
}

export interface AcceptedMigrationEntry {
  identity: string;
  candidateCommit: string;
  reviewDecision: 'MIGRATION_ACCEPTED';
  reviewUrl?: string;
  coordinatorVerdictRef?: string;
  synchronizationCommit: string;
  creditDelta: 0 | 1;
}

export interface AcceptedMigrationEvidence {
  schemaVersion: 'fd-phase3-accepted-migration-evidence-v1';
  baseline: {
    commit: string;
    denominator: number;
    acceptedCount: number;
    authoringFingerprint: string;
    identitySetSha256: string;
  };
  entries: AcceptedMigrationEntry[];
}

export interface AcceptedCapabilityEntry {
  capabilityId: string;
  candidateCommit: string;
  reviewDecision: 'IMPLEMENTATION_ACCEPTED_CANDIDATE';
  reviewUrl: string;
  synchronizationCommit: string;
}

export interface AcceptedCapabilityEvidence {
  schemaVersion: 'fd-phase3-accepted-capability-evidence-v1';
  entries: AcceptedCapabilityEntry[];
}

export interface GlobalReadinessDecision {
  identity: string;
  state: Exclude<
    GlobalReadinessState,
    | 'MIGRATED_CONFIRMED'
    | 'SOURCE_EVIDENCE_REQUIRED'
    | 'SPECIAL_HANDLER_REVIEW'
    | 'COMPLETE_CARD_PROBE_REQUIRED'
    | 'ACTIVE_TASK_RESERVED'
  >;
  reasonCodes: string[];
  sourceSha256: string;
  runtimeEvidenceFingerprint: string;
  evidenceRefs: string[];
  dependencyIds: string[];
  missingCapabilityId?: string;
  closureYield?: number;
  completeCardProbe?: {
    loaderReportEmpty: boolean;
    compilerReportEmpty: boolean;
    transitiveDefinitionsRegistered: boolean;
    positivePath: boolean;
    canonicalNegatives: boolean;
    malformedFailClosed: boolean;
  };
  risk?: {
    hiddenInformation: boolean;
    interaction: boolean;
    lifecycle: boolean;
    battleOrdering: boolean;
  };
}

export interface GlobalReadinessDecisionFile {
  schemaVersion: 'fd-phase3-global-readiness-decisions-v1';
  baselineCommit: string;
  inventorySha256: string;
  authoringFingerprint: string;
  formalLedger: { accepted: number; denominator: number };
  activeReservations: Array<{ task: string; identity: string }>;
  decisions: GlobalReadinessDecision[];
  fm09TargetIds: string[];
}

export interface GlobalReadinessInput {
  baselineCommit: string;
  inventorySha256: string;
  authoringFingerprint: string;
  inventory: GlobalReadinessInventoryEntry[];
  authoredFrozenIds: string[];
  migrationEvidence: AcceptedMigrationEvidence;
  capabilityEvidence: AcceptedCapabilityEvidence;
  decisions: GlobalReadinessDecisionFile;
}

export interface GlobalReadinessRow {
  id: string;
  ownerId: string;
  state: GlobalReadinessState;
  reasonCodes: string[];
  mechanicFamilies: string[];
  requiredCapabilities: string[];
  evidenceRefs: string[];
  dependencyIds: string[];
  missingCapabilityId?: string;
  closureYield?: number;
  risk?: {
    hiddenInformation: boolean;
    interaction: boolean;
    lifecycle: boolean;
    battleOrdering: boolean;
  };
  fm09Target: boolean;
}

export interface GlobalReadinessResult {
  schemaVersion: 'fd-phase3-global-readiness-v1';
  provenance: {
    baselineCommit: string;
    inventorySha256: string;
    authoringFingerprint: string;
    inputFingerprint: string;
  };
  summary: {
    total: number;
    migrated: number;
    remaining: number;
    formalAccepted: number;
    formalRemaining: number;
    formalMaterialDrift: number;
    stateCounts: Record<GlobalReadinessState, number>;
    coarseMissingCounts: Record<ClassificationRoute, number>;
  };
  fm09: { total: number; present: string[]; missing: string[] };
  rankedCandidates: string[];
  rows: GlobalReadinessRow[];
}

const states: GlobalReadinessState[] = [
  'MIGRATED_CONFIRMED',
  'S_READY_NOW',
  'ONE_SHARED_GAP',
  'TRANSITIVE_DEPENDENCY',
  'MULTI_GAP',
  'SOURCE_EVIDENCE_REQUIRED',
  'RULE_DECISION_REQUIRED',
  'SPECIAL_HANDLER_REVIEW',
  'COMPLETE_CARD_PROBE_REQUIRED',
  'ACTIVE_TASK_RESERVED',
];

const sha40 = /^[0-9a-f]{40}$/;
const sha64 = /^[0-9a-f]{64}$/;

function sorted(values: Iterable<string>): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertSha40(value: string, label: string): void {
  assert(sha40.test(value), `${label} must be an exact 40-character lowercase Git SHA.`);
}

function assertSha64(value: string, label: string): void {
  assert(sha64.test(value), `${label} must be an exact SHA-256 digest.`);
}

function uniqueOrThrow(values: string[], label: string): Set<string> {
  const result = new Set<string>();
  for (const value of values) {
    assert(value.length > 0, `${label} contains an empty identity.`);
    assert(!result.has(value), `Duplicate ${label}: ${value}`);
    result.add(value);
  }
  return result;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function compareSets(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return false;
  return [...left].every((value) => right.has(value));
}

export function identitySetSha256(values: Iterable<string>): string {
  return sha256(JSON.stringify(sorted(values)));
}

function validateMigrationEvidence(
  evidence: AcceptedMigrationEvidence,
  inventoryIds: Set<string>,
  authoredIds: Set<string>,
  authoringFingerprint: string,
): Set<string> {
  assert(evidence.schemaVersion === 'fd-phase3-accepted-migration-evidence-v1', 'Unknown migration evidence schema.');
  assertSha40(evidence.baseline.commit, 'Migration baseline commit');
  assertSha64(evidence.baseline.authoringFingerprint, 'Migration baseline authoring fingerprint');
  assert(
    evidence.baseline.authoringFingerprint === authoringFingerprint,
    'Accepted migration baseline is stale for the current authoring fingerprint.',
  );
  assert(evidence.baseline.denominator === inventoryIds.size, 'Migration denominator differs from frozen inventory.');

  assertSha64(evidence.baseline.identitySetSha256, 'Migration baseline identity-set digest');
  assert(evidence.baseline.acceptedCount === authoredIds.size, 'Migration baseline accepted count differs from authored material.');
  assert(
    evidence.baseline.identitySetSha256 === identitySetSha256(authoredIds),
    'Accepted baseline identities differ from authored frozen identities.',
  );
  const accepted = new Set(authoredIds);

  const entryIdentities = new Set<string>();
  for (const entry of evidence.entries) {
    assert(inventoryIds.has(entry.identity), `Migration evidence contains unknown identity: ${entry.identity}`);
    assertSha40(entry.candidateCommit, `Migration Candidate for ${entry.identity}`);
    assertSha40(entry.synchronizationCommit, `Migration synchronization for ${entry.identity}`);
    assert(entry.reviewDecision === 'MIGRATION_ACCEPTED', `Migration evidence is not terminal for ${entry.identity}.`);
    assert(
      (entry.reviewUrl !== undefined && /^https:\/\//.test(entry.reviewUrl)) ||
        (entry.coordinatorVerdictRef !== undefined && entry.coordinatorVerdictRef.length > 0),
      `Migration evidence lacks a stable review URL or coordinator verdict reference for ${entry.identity}.`,
    );
    assert(!entryIdentities.has(entry.identity), `Duplicate migration evidence entry: ${entry.identity}`);
    entryIdentities.add(entry.identity);
    if (accepted.has(entry.identity)) {
      assert(entry.creditDelta === 0, `Duplicate migration credit for baseline identity: ${entry.identity}`);
    } else {
      assert(entry.creditDelta === 1, `New migration identity must contribute exactly +1: ${entry.identity}`);
      accepted.add(entry.identity);
    }
  }

  assert(compareSets(accepted, authoredIds), 'Accepted migration entries differ from authored frozen identities.');
  return accepted;
}

function validateCapabilityEvidence(evidence: AcceptedCapabilityEvidence): Set<string> {
  assert(evidence.schemaVersion === 'fd-phase3-accepted-capability-evidence-v1', 'Unknown capability evidence schema.');
  const ids = new Set<string>();
  for (const entry of evidence.entries) {
    assert(entry.capabilityId.length > 0, 'Capability evidence has an empty ID.');
    assert(!ids.has(entry.capabilityId), `Duplicate capability evidence: ${entry.capabilityId}`);
    assertSha40(entry.candidateCommit, `Capability Candidate for ${entry.capabilityId}`);
    assertSha40(entry.synchronizationCommit, `Capability synchronization for ${entry.capabilityId}`);
    assert(
      entry.reviewDecision === 'IMPLEMENTATION_ACCEPTED_CANDIDATE',
      `Capability evidence is not terminal for ${entry.capabilityId}.`,
    );
    assert(/^https:\/\//.test(entry.reviewUrl), `Capability evidence lacks a stable review URL for ${entry.capabilityId}.`);
    ids.add(entry.capabilityId);
  }
  return ids;
}

function validateDecisionFile(
  file: GlobalReadinessDecisionFile,
  input: Pick<GlobalReadinessInput, 'baselineCommit' | 'inventorySha256' | 'authoringFingerprint'>,
  inventoryIds: Set<string>,
): { reservations: Map<string, string>; decisions: Map<string, GlobalReadinessDecision> } {
  assert(file.schemaVersion === 'fd-phase3-global-readiness-decisions-v1', 'Unknown readiness decision schema.');
  assertSha40(file.baselineCommit, 'Decision baseline commit');
  assertSha64(file.inventorySha256, 'Decision inventory digest');
  assertSha64(file.authoringFingerprint, 'Decision authoring fingerprint');
  assert(
    file.baselineCommit === input.baselineCommit &&
      file.inventorySha256 === input.inventorySha256 &&
      file.authoringFingerprint === input.authoringFingerprint,
    'Stale readiness decision file: baseline or source fingerprint differs.',
  );
  assert(file.formalLedger.denominator === inventoryIds.size, 'Formal ledger denominator differs from frozen inventory.');
  assert(
    Number.isInteger(file.formalLedger.accepted) &&
      file.formalLedger.accepted >= 0 &&
      file.formalLedger.accepted <= file.formalLedger.denominator,
    'Formal accepted count is outside the frozen denominator.',
  );

  const reservations = new Map<string, string>();
  for (const reservation of file.activeReservations) {
    assert(inventoryIds.has(reservation.identity), `Reservation contains unknown identity: ${reservation.identity}`);
    assert(reservation.task.length > 0, `Reservation task is empty for ${reservation.identity}.`);
    assert(!reservations.has(reservation.identity), `Duplicate active reservation: ${reservation.identity}`);
    reservations.set(reservation.identity, reservation.task);
  }

  const decisions = new Map<string, GlobalReadinessDecision>();
  for (const decision of file.decisions) {
    assert(inventoryIds.has(decision.identity), `Decision contains unknown identity: ${decision.identity}`);
    assert(!decisions.has(decision.identity), `Duplicate readiness decision: ${decision.identity}`);
    assert(decision.reasonCodes.length > 0, `Decision lacks reason codes: ${decision.identity}`);
    assert(decision.evidenceRefs.length > 0, `Decision lacks evidence references: ${decision.identity}`);
    assertSha64(decision.sourceSha256, `Decision source digest for ${decision.identity}`);
    assertSha64(decision.runtimeEvidenceFingerprint, `Decision runtime fingerprint for ${decision.identity}`);
    if (decision.state === 'ONE_SHARED_GAP') {
      assert(Boolean(decision.missingCapabilityId), `ONE_SHARED_GAP lacks capability ID: ${decision.identity}`);
      assert((decision.closureYield ?? 0) > 0, `ONE_SHARED_GAP lacks positive closure yield: ${decision.identity}`);
    }
    if (decision.state === 'S_READY_NOW') {
      const probe = decision.completeCardProbe;
      assert(
        probe && Object.values(probe).every(Boolean),
        `S_READY_NOW lacks a complete fail-closed card probe: ${decision.identity}`,
      );
    }
    decisions.set(decision.identity, decision);
  }
  return { reservations, decisions };
}

function defaultState(route: ClassificationRoute): Pick<GlobalReadinessRow, 'state' | 'reasonCodes'> {
  if (route === 'READY_GENERIC_EXTENSION') {
    return { state: 'COMPLETE_CARD_PROBE_REQUIRED', reasonCodes: ['HISTORICAL_GENERIC_LABEL_REQUIRES_FRESH_PROBE'] };
  }
  if (route === 'SOURCE_EVIDENCE_REQUIRED') {
    return { state: 'SOURCE_EVIDENCE_REQUIRED', reasonCodes: ['SEMANTIC_SOURCE_REQUIRED'] };
  }
  return { state: 'SPECIAL_HANDLER_REVIEW', reasonCodes: ['SPECIAL_HANDLER_REQUIRES_INDEPENDENT_REVIEW'] };
}

function rank(row: GlobalReadinessRow): [number, number, number, string] {
  const risk = row.risk
    ? Number(row.risk.hiddenInformation) +
      Number(row.risk.interaction) +
      Number(row.risk.lifecycle) +
      Number(row.risk.battleOrdering)
    : 0;
  if (row.state === 'S_READY_NOW') return [0, 0, 0, row.id];
  if (row.state === 'ONE_SHARED_GAP') return [1, -(row.closureYield ?? 0), risk, row.id];
  if (row.state === 'COMPLETE_CARD_PROBE_REQUIRED') return [2, 0, 0, row.id];
  return [3, 0, 0, row.id];
}

export function compileGlobalReadiness(input: GlobalReadinessInput): GlobalReadinessResult {
  assertSha40(input.baselineCommit, 'Readiness baseline commit');
  assertSha64(input.inventorySha256, 'Readiness inventory digest');
  assertSha64(input.authoringFingerprint, 'Readiness authoring fingerprint');

  const inventoryIds = new Set<string>();
  const inventoryById = new Map<string, GlobalReadinessInventoryEntry>();
  for (const row of input.inventory) {
    assert(row.canonicalAbilityId.length > 0, 'Inventory contains an empty identity.');
    assert(!inventoryIds.has(row.canonicalAbilityId), `Duplicate inventory identity: ${row.canonicalAbilityId}`);
    inventoryIds.add(row.canonicalAbilityId);
    inventoryById.set(row.canonicalAbilityId, row);
  }

  const authoredIds = uniqueOrThrow(input.authoredFrozenIds, 'authored frozen identity');
  for (const identity of authoredIds) {
    assert(inventoryIds.has(identity), `Unknown authored frozen identity: ${identity}`);
  }

  const acceptedMigrationIds = validateMigrationEvidence(
    input.migrationEvidence,
    inventoryIds,
    authoredIds,
    input.authoringFingerprint,
  );
  const acceptedCapabilityIds = validateCapabilityEvidence(input.capabilityEvidence);
  const { reservations, decisions } = validateDecisionFile(input.decisions, input, inventoryIds);
  const fm09 = uniqueOrThrow(input.decisions.fm09TargetIds, 'FM09 target identity');
  for (const identity of fm09) assert(inventoryIds.has(identity), `FM09 target is not frozen: ${identity}`);

  const rows = sorted(inventoryIds).map((id): GlobalReadinessRow => {
    const inventory = inventoryById.get(id)!;
    if (acceptedMigrationIds.has(id)) {
      return {
        id,
        ownerId: inventory.ownerId,
        state: 'MIGRATED_CONFIRMED',
        reasonCodes: ['ACCEPTED_MIGRATION_EVIDENCE'],
        mechanicFamilies: sorted(inventory.mechanicFamilies),
        requiredCapabilities: sorted(inventory.requiredCapabilities),
        evidenceRefs: [],
        dependencyIds: [],
        fm09Target: fm09.has(id),
      };
    }

    const reservation = reservations.get(id);
    if (reservation) {
      return {
        id,
        ownerId: inventory.ownerId,
        state: 'ACTIVE_TASK_RESERVED',
        reasonCodes: [`ACTIVE_TASK:${reservation}`],
        mechanicFamilies: sorted(inventory.mechanicFamilies),
        requiredCapabilities: sorted(inventory.requiredCapabilities),
        evidenceRefs: [],
        dependencyIds: [],
        fm09Target: fm09.has(id),
      };
    }

    const decision = decisions.get(id);
    if (decision) {
      if (decision.state === 'S_READY_NOW') {
        const missing = inventory.requiredCapabilities.filter((capability) => !acceptedCapabilityIds.has(capability));
        assert(missing.length === 0, `S_READY_NOW has unaccepted capability dependencies for ${id}: ${missing.join(', ')}`);
        assert(decision.dependencyIds.every((dependency) => acceptedMigrationIds.has(dependency)), `S_READY_NOW has unresolved transitive dependency: ${id}`);
      }
      if (decision.state === 'ONE_SHARED_GAP') {
        const acceptedOtherCapabilities = inventory.requiredCapabilities.filter(
          (capability) => capability !== decision.missingCapabilityId && !acceptedCapabilityIds.has(capability),
        );
        assert(
          acceptedOtherCapabilities.length === 0,
          `ONE_SHARED_GAP has additional unaccepted capabilities for ${id}: ${acceptedOtherCapabilities.join(', ')}`,
        );
        assert(
          decision.dependencyIds.every((dependency) => acceptedMigrationIds.has(dependency)),
          `ONE_SHARED_GAP has unresolved transitive dependency: ${id}`,
        );
      }
      return {
        id,
        ownerId: inventory.ownerId,
        state: decision.state,
        reasonCodes: sorted(decision.reasonCodes),
        mechanicFamilies: sorted(inventory.mechanicFamilies),
        requiredCapabilities: sorted(inventory.requiredCapabilities),
        evidenceRefs: sorted(decision.evidenceRefs),
        dependencyIds: sorted(decision.dependencyIds),
        ...(decision.missingCapabilityId ? { missingCapabilityId: decision.missingCapabilityId } : {}),
        ...(decision.closureYield ? { closureYield: decision.closureYield } : {}),
        ...(decision.risk ? { risk: decision.risk } : {}),
        fm09Target: fm09.has(id),
      };
    }

    const fallback = defaultState(inventory.classificationRoute);
    return {
      id,
      ownerId: inventory.ownerId,
      ...fallback,
      mechanicFamilies: sorted(inventory.mechanicFamilies),
      requiredCapabilities: sorted(inventory.requiredCapabilities),
      evidenceRefs: [],
      dependencyIds: [],
      fm09Target: fm09.has(id),
    };
  });

  const stateCounts = Object.fromEntries(states.map((state) => [state, 0])) as Record<GlobalReadinessState, number>;
  for (const row of rows) stateCounts[row.state] += 1;

  const coarseMissingCounts: Record<ClassificationRoute, number> = {
    READY_GENERIC_EXTENSION: 0,
    SOURCE_EVIDENCE_REQUIRED: 0,
    SPECIAL_HANDLER_CANDIDATE: 0,
  };
  for (const id of inventoryIds) {
    if (!acceptedMigrationIds.has(id)) coarseMissingCounts[inventoryById.get(id)!.classificationRoute] += 1;
  }

  const rankedCandidates = rows
    .filter((row) => row.state === 'S_READY_NOW' || row.state === 'ONE_SHARED_GAP' || row.state === 'COMPLETE_CARD_PROBE_REQUIRED')
    .sort((a, b) => {
      const left = rank(a);
      const right = rank(b);
      return left[0] - right[0] || left[1] - right[1] || left[2] - right[2] || left[3].localeCompare(right[3]);
    })
    .map((row) => row.id);

  return {
    schemaVersion: 'fd-phase3-global-readiness-v1',
    provenance: {
      baselineCommit: input.baselineCommit,
      inventorySha256: input.inventorySha256,
      authoringFingerprint: input.authoringFingerprint,
      inputFingerprint: sha256(stable(input)),
    },
    summary: {
      total: rows.length,
      migrated: acceptedMigrationIds.size,
      remaining: rows.length - acceptedMigrationIds.size,
      formalAccepted: input.decisions.formalLedger.accepted,
      formalRemaining: rows.length - input.decisions.formalLedger.accepted,
      formalMaterialDrift: input.decisions.formalLedger.accepted - acceptedMigrationIds.size,
      stateCounts,
      coarseMissingCounts,
    },
    fm09: {
      total: fm09.size,
      present: sorted([...fm09].filter((id) => acceptedMigrationIds.has(id))),
      missing: sorted([...fm09].filter((id) => !acceptedMigrationIds.has(id))),
    },
    rankedCandidates,
    rows,
  };
}

function jsonFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...jsonFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(path);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

export function collectAuthoredFrozenIds(
  workspaceRoot: string,
  frozenIds: Set<string>,
): { ids: string[]; fingerprint: string; fileCount: number } {
  const roots = ['data/authoring/masters', 'data/authoring/servants'].map((path) => resolve(workspaceRoot, path));
  const files = roots.flatMap(jsonFiles).sort((a, b) => a.localeCompare(b));
  const ids = new Set<string>();
  const hash = createHash('sha256');

  for (const file of files) {
    const relativePath = relative(workspaceRoot, file).replaceAll('\\', '/');
    const raw = readFileSync(file, 'utf8');
    hash.update(relativePath).update('\0').update(raw).update('\0');
    const archive = JSON.parse(raw) as { cards?: Array<{ id?: unknown }> };
    assert(Array.isArray(archive.cards), `Authoring archive lacks cards array: ${relativePath}`);
    for (const card of archive.cards) {
      if (typeof card.id !== 'string' || !frozenIds.has(card.id)) continue;
      assert(!ids.has(card.id), `Duplicate authored frozen identity: ${card.id}`);
      ids.add(card.id);
    }
  }

  return { ids: sorted(ids), fingerprint: hash.digest('hex'), fileCount: files.length };
}

export function inventoryEntries(raw: unknown): GlobalReadinessInventoryEntry[] {
  const inventory = raw as {
    staticSkills?: Array<Record<string, unknown>>;
    dynamicSkills?: Array<Record<string, unknown>>;
  };
  const rows = [...(inventory.staticSkills ?? []), ...(inventory.dynamicSkills ?? [])];
  return rows.map((row) => {
    const phase3 = (row.phase3 ?? {}) as Record<string, unknown>;
    const route = phase3.classificationRoute;
    assert(
      route === 'READY_GENERIC_EXTENSION' || route === 'SOURCE_EVIDENCE_REQUIRED' || route === 'SPECIAL_HANDLER_CANDIDATE',
      `Unsupported inventory classification for ${String(row.canonicalAbilityId)}: ${String(route)}`,
    );
    return {
      canonicalAbilityId: String(row.canonicalAbilityId),
      ownerId: String(row.ownerId),
      classificationRoute: route,
      mechanicFamilies: Array.isArray(phase3.mechanicFamilies) ? phase3.mechanicFamilies.map(String) : [],
      requiredCapabilities: Array.isArray(phase3.requiredCapabilities) ? phase3.requiredCapabilities.map(String) : [],
    };
  });
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export interface DispatchProposal {
  taskId: string;
  identities: string[];
  fm09TargetIds: string[];
  sameOwnerInseparableException?: {
    documentedEvidenceRef: string;
    ownerIds: Record<string, string>;
  };
  inheritedAcceptance?: Array<{ identity: string; fromIdentity: string }>;
}

export function validateDispatchProposal(proposal: DispatchProposal): void {
  const identities = uniqueOrThrow(proposal.identities, 'dispatch identity');
  assert(identities.size > 0, 'Dispatch must contain at least one frozen identity.');
  assert(!/complete.{0,12}fm09|fm09.{0,12}complete/i.test(proposal.taskId), 'A complete-FM09 task is forbidden.');

  const fm09 = new Set(proposal.fm09TargetIds);
  const fm09Dispatched = [...identities].filter((identity) => fm09.has(identity));
  assert(
    fm09Dispatched.length < proposal.fm09TargetIds.length || proposal.fm09TargetIds.length === 1,
    'Bulk dispatch of all remaining FM09 targets is forbidden.',
  );

  if (identities.size > 1) {
    const exception = proposal.sameOwnerInseparableException;
    assert(exception, 'Dispatch contains more than one frozen identity without an independently documented exception.');
    assert(identities.size === 2, 'Documented same-owner exception is limited to two frozen identities.');
    assert(exception.documentedEvidenceRef.length > 0, 'Same-owner exception lacks an evidence reference.');
    const owners = new Set([...identities].map((identity) => exception.ownerIds[identity]));
    assert(!owners.has(undefined) && owners.size === 1, 'Same-owner exception contains different or missing owners.');
  }

  assert(
    !(identities.has('master.fujino.skill.s3') && identities.has('master.fujino.skill.s2')),
    'Fujino s3 cannot absorb Fujino s2.',
  );
  for (const inherited of proposal.inheritedAcceptance ?? []) {
    assert(identities.has(inherited.identity), `Inherited acceptance refers to an undispatched identity: ${inherited.identity}`);
    assert(
      !(inherited.identity === 'master.shiki-ryougi.skill.s2' && inherited.fromIdentity === 'master.shiki-ryougi.skill.s3'),
      'Ryougi s2 cannot inherit Ryougi s3 acceptance.',
    );
  }
}

function runCli(): void {
  const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const inventoryPath = join(workspaceRoot, 'data/phase3/full-roster-ability-inventory.json');
  const inventoryRaw = readFileSync(inventoryPath, 'utf8');
  const inventory = inventoryEntries(JSON.parse(inventoryRaw));
  const inventorySha256 = sha256(inventoryRaw);
  const authored = collectAuthoredFrozenIds(
    workspaceRoot,
    new Set(inventory.map((row) => row.canonicalAbilityId)),
  );
  const migrationEvidence = readJson<AcceptedMigrationEvidence>(
    join(workspaceRoot, 'data/phase3/accepted-migration-evidence.json'),
  );
  const capabilityEvidence = readJson<AcceptedCapabilityEvidence>(
    join(workspaceRoot, 'data/phase3/accepted-capability-evidence.json'),
  );
  const decisions = readJson<GlobalReadinessDecisionFile>(
    join(workspaceRoot, 'data/phase3/global-readiness-decisions.json'),
  );
  const result = compileGlobalReadiness({
    baselineCommit: decisions.baselineCommit,
    inventorySha256,
    authoringFingerprint: authored.fingerprint,
    inventory,
    authoredFrozenIds: authored.ids,
    migrationEvidence,
    capabilityEvidence,
    decisions,
  });

  if (!process.argv.includes('--validate-only')) {
    const outputPath = join(workspaceRoot, 'artifacts/phase3-global-readiness.json');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  }

  process.stdout.write(
    [
      `total=${result.summary.total}`,
      `materialMigrated=${result.summary.migrated}`,
      `materialRemaining=${result.summary.remaining}`,
      `formalAccepted=${result.summary.formalAccepted}`,
      `formalRemaining=${result.summary.formalRemaining}`,
      `formalMaterialDrift=${result.summary.formalMaterialDrift}`,
      `fm09Present=${result.fm09.present.length}`,
      `fm09Missing=${result.fm09.missing.length}`,
    ].join(' ') + '\n',
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) runCli();
