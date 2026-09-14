import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertOutputOutsideReference } from './build-full-roster-inventory';
import { verifyReferenceRoot } from './verify-reference';

const DEFAULT_INVENTORY_PATH = 'data/phase3/full-roster-ability-inventory.json';
const DEFAULT_CATALOG_PATH = 'data/phase3/full-roster-capability-catalog.json';
const DEFAULT_RULE_DECISIONS_PATH = 'data/phase3/full-roster-rule-decisions.json';
const DEFAULT_RUNTIME_REQUESTS_PATH = 'data/phase3/full-roster-runtime-capability-requests.json';
const DEFAULT_RULE_REPORT_PATH = 'docs/reports/phase3-full-roster-rule-decisions.md';
const DEFAULT_RUNTIME_REPORT_PATH = 'docs/reports/phase3-full-roster-runtime-capability-requests.md';

interface SourceReference {
  abilityId: string;
  document: string;
  locator: string;
  sha256?: string;
}

interface ReferenceBehaviorSummary {
  authority: 'NON_AUTHORITATIVE';
  routeCounts: Record<string, number>;
  handlerCount: number;
  note: string;
}

export interface RuleDecisionPacket {
  packetId: string;
  packetType: 'USER_RULE_DECISION';
  affectedAbilityIds: string[];
  sourceReferences: SourceReference[];
  exactPrintedText: Array<{ abilityId: string; text: string | null }>;
  ambiguity: string;
  ambiguityKey: string;
  options: Array<{ id: string; description: string }>;
  recommendation: string;
  referenceBehavior: ReferenceBehaviorSummary;
  runtimeImpact: string;
}

export interface SourceEvidencePacket {
  packetId: string;
  packetType: 'SOURCE_EVIDENCE';
  affectedAbilityIds: string[];
  sourceReferences: SourceReference[];
  missingEvidence: string[];
  recommendation: string;
  referenceBehavior: ReferenceBehaviorSummary;
  runtimeImpact: string;
}

export interface ExternalDependencyRecord {
  abilityId: string;
  route: string;
  dependency: string;
  sourceReferences: SourceReference[];
}

export interface FullRosterRuleDecisions {
  schemaVersion: 1;
  kind: 'phase3-full-roster-rule-decisions';
  provenance: {
    referenceRepository: string;
    referenceCommit: string;
  };
  summary: {
    blockedIdentityCount: number;
    coveredBlockedIdentityCount: number;
    uncoveredBlockedIdentityCount: number;
    ruleDecisionPacketCount: number;
    sourceEvidencePacketCount: number;
    externalDependencyCount: number;
  };
  decisionPackets: RuleDecisionPacket[];
  sourceEvidencePackets: SourceEvidencePacket[];
  externalDependencies: ExternalDependencyRecord[];
}

export interface RuntimeCapabilityRequest {
  requestId: string;
  requestType: 'GENERIC_CAPABILITY_REQUEST' | 'REVIEWED_SPECIAL_REQUEST';
  capabilityId: string;
  mechanicFamily: string;
  affectedAbilityIds: string[];
  sourceReferences: SourceReference[];
  capabilityGap: string;
  requiredContract: {
    input: string[];
    output: string[];
    events: string[];
    resultBinding: string[];
    transactionBehavior: string;
    eligibilityAxes: string[];
    invalidatingAxes: string[];
  };
  recommendation: string;
  referenceBehavior: ReferenceBehaviorSummary;
  runtimeImpact: string;
  acceptanceVehicle: string;
  representatives: string[];
}

export interface FullRosterRuntimeCapabilityRequests {
  schemaVersion: 1;
  kind: 'phase3-full-roster-runtime-capability-requests';
  provenance: {
    referenceRepository: string;
    referenceCommit: string;
  };
  summary: {
    runtimeRequestCount: number;
    genericCapabilityRequestCount: number;
    reviewedSpecialRequestCount: number;
    affectedIdentityCount: number;
  };
  requests: RuntimeCapabilityRequest[];
}

interface InventoryEntry {
  canonicalAbilityId: string;
  printedText?: string | null;
  sources?: Array<{ document?: string; locator?: string }>;
  clauses?: Array<{
    source?: { document?: string; locator?: string; sha256?: string };
  }>;
  reference?: {
    executionRoute?: string | null;
    handlerId?: string;
  };
  semanticNormalization?: {
    source?: { document?: string; locator?: string } | null;
    blocks?: string[];
  };
  phase3?: {
    classificationRoute?: string;
    mappingStatus?: string;
    blockedBy?: string[];
    requiredCapabilities?: string[];
  };
}

interface PacketInventory {
  kind?: string;
  provenance?: { repository?: string; commit?: string };
  staticSkills?: InventoryEntry[];
  dynamicSkills?: InventoryEntry[];
}

interface CapabilityCatalogEntry {
  id: string;
  category: 'existing_contract' | 'generic_request' | 'reviewed_special';
  mechanicFamily: string;
  input: string[];
  output: string[];
  events: string[];
  resultBinding: string[];
  transactionBehavior: string;
  eligibilityAxes: string[];
  invalidatingAxes: string[];
  representatives: string[];
  acceptanceVehicle: string;
  eligibleAbilities: string[];
  partialAbilities: string[];
  skippedAbilities: Array<{ abilityId: string; reason: string }>;
}

interface PacketCatalog {
  kind?: string;
  provenance?: {
    referenceRepository?: string;
    referenceCommit?: string;
  };
  capabilities?: CapabilityCatalogEntry[];
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function stableId(prefix: string, key: string): string {
  const digest = createHash('sha256').update(key).digest('hex').slice(0, 12);
  return `${prefix}-${digest}`;
}

function allEntries(inventory: PacketInventory): InventoryEntry[] {
  return [...(inventory.staticSkills ?? []), ...(inventory.dynamicSkills ?? [])];
}

function sourceReferencesFor(entry: InventoryEntry): SourceReference[] {
  const byKey = new Map<string, SourceReference>();
  const add = (document: unknown, locator: unknown, sha256?: unknown): void => {
    if (typeof document !== 'string' || document.length === 0) return;
    if (typeof locator !== 'string' || locator.length === 0) return;
    const key = `${entry.canonicalAbilityId}\u0000${document}\u0000${locator}`;
    const existing = byKey.get(key);
    const nextSha = typeof sha256 === 'string' && sha256.length > 0 ? sha256 : existing?.sha256;
    byKey.set(key, {
      abilityId: entry.canonicalAbilityId,
      document,
      locator,
      ...(nextSha ? { sha256: nextSha } : {}),
    });
  };

  const semanticSource = entry.semanticNormalization?.source;
  if (semanticSource) add(semanticSource.document, semanticSource.locator);
  for (const source of entry.sources ?? []) add(source.document, source.locator);
  for (const clause of entry.clauses ?? []) {
    add(clause.source?.document, clause.source?.locator, clause.source?.sha256);
  }

  return [...byKey.values()].sort((left, right) => {
    const leftKey = `${left.abilityId}\u0000${left.document}\u0000${left.locator}\u0000${left.sha256 ?? ''}`;
    const rightKey = `${right.abilityId}\u0000${right.document}\u0000${right.locator}\u0000${right.sha256 ?? ''}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
}

function referenceBehaviorFor(entries: InventoryEntry[]): ReferenceBehaviorSummary {
  const routeCounts: Record<string, number> = {};
  const handlers = new Set<string>();
  for (const entry of entries) {
    const route = entry.reference?.executionRoute ?? 'none';
    routeCounts[route] = (routeCounts[route] ?? 0) + 1;
    if (entry.reference?.handlerId) handlers.add(entry.reference.handlerId);
  }
  return {
    authority: 'NON_AUTHORITATIVE',
    routeCounts: Object.fromEntries(Object.entries(routeCounts).sort(([left], [right]) => left.localeCompare(right))),
    handlerCount: handlers.size,
    note: 'Reference execution routes and handlers are observations only; they do not determine canonical rules or Phase 3 capability semantics.',
  };
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function blockSignature(entry: InventoryEntry): string {
  const blocks = uniq([
    ...(entry.phase3?.blockedBy ?? []),
    ...(entry.semanticNormalization?.blocks ?? []),
  ]);
  return blocks.length > 0 ? blocks.join('|') : entry.phase3?.classificationRoute ?? 'UNSPECIFIED_BLOCK';
}

function makeRuleDecisionPackets(entries: InventoryEntry[]): RuleDecisionPacket[] {
  const candidates = entries.filter(
    (entry) =>
      entry.phase3?.mappingStatus === 'EXPLICIT_BLOCK' &&
      entry.phase3?.classificationRoute === 'RULE_DECISION_REQUIRED',
  );
  const groups = groupBy(candidates, blockSignature);
  const packets: RuleDecisionPacket[] = [];

  for (const [ambiguityKey, group] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const ordered = [...group].sort((left, right) => left.canonicalAbilityId.localeCompare(right.canonicalAbilityId));
    packets.push({
      packetId: stableId('rule-decision', ambiguityKey),
      packetType: 'USER_RULE_DECISION',
      affectedAbilityIds: ordered.map((entry) => entry.canonicalAbilityId),
      sourceReferences: ordered.flatMap(sourceReferencesFor),
      exactPrintedText: ordered.map((entry) => ({
        abilityId: entry.canonicalAbilityId,
        text: entry.printedText ?? null,
      })),
      ambiguity: `Canonical rule interpretation is unresolved for the grouped block signature: ${ambiguityKey}.`,
      ambiguityKey,
      options: [
        {
          id: 'CONFIRM_PRINTED_SOURCE_INTERPRETATION',
          description: 'Confirm one source-grounded interpretation for every affected ability in this identical dispute group.',
        },
        {
          id: 'SUPPLY_ALTERNATE_RULE_INTERPRETATION',
          description: 'Supply an alternate canonical ruling, citing the authoritative source or explicit user ruling that overrides the current ambiguity.',
        },
        {
          id: 'DEFER_RULE_DECISION',
          description: 'Keep the affected abilities blocked until sufficient rule authority is available.',
        },
      ],
      recommendation: 'Keep the group blocked unless the user can confirm a source-grounded canonical rule; do not infer from Reference runtime behavior.',
      referenceBehavior: referenceBehaviorFor(ordered),
      runtimeImpact: 'No runtime capability or migration work should consume these abilities until the canonical rule decision is resolved.',
    });
  }
  return packets;
}

function makeSourceEvidencePackets(entries: InventoryEntry[]): SourceEvidencePacket[] {
  const candidates = entries.filter((entry) => {
    if (entry.phase3?.mappingStatus !== 'EXPLICIT_BLOCK') return false;
    const route = entry.phase3?.classificationRoute;
    return route !== 'RULE_DECISION_REQUIRED' && route !== 'PHASE_DEPENDENCY_BLOCKED';
  });
  const groups = groupBy(candidates, (entry) => `${entry.phase3?.classificationRoute ?? 'BLOCKED'}|${blockSignature(entry)}`);
  const packets: SourceEvidencePacket[] = [];

  for (const [key, group] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const ordered = [...group].sort((left, right) => left.canonicalAbilityId.localeCompare(right.canonicalAbilityId));
    const missingEvidence = uniq(
      ordered.flatMap((entry) => [
        ...(entry.phase3?.blockedBy ?? []),
        ...(entry.semanticNormalization?.blocks ?? []),
      ]),
    );
    packets.push({
      packetId: stableId('source-evidence', key),
      packetType: 'SOURCE_EVIDENCE',
      affectedAbilityIds: ordered.map((entry) => entry.canonicalAbilityId),
      sourceReferences: ordered.flatMap(sourceReferencesFor),
      missingEvidence,
      recommendation: 'Obtain source-aligned structured rule evidence before semantic normalization; do not fill the gap from handler names, Reference FULL status, or runtime behavior.',
      referenceBehavior: referenceBehaviorFor(ordered),
      runtimeImpact: 'These identities remain ineligible for capability inheritance or migration until source evidence closes the semantic block.',
    });
  }
  return packets;
}

function makeExternalDependencies(entries: InventoryEntry[]): ExternalDependencyRecord[] {
  return entries
    .filter(
      (entry) =>
        entry.phase3?.mappingStatus === 'EXPLICIT_BLOCK' &&
        entry.phase3?.classificationRoute === 'PHASE_DEPENDENCY_BLOCKED',
    )
    .map((entry) => ({
      abilityId: entry.canonicalAbilityId,
      route: 'PHASE_DEPENDENCY_BLOCKED',
      dependency: uniq(entry.phase3?.blockedBy ?? []).join('|') || 'UNSPECIFIED_PHASE_DEPENDENCY',
      sourceReferences: sourceReferencesFor(entry),
    }))
    .sort((left, right) => left.abilityId.localeCompare(right.abilityId));
}

function makeRuntimeRequests(
  entries: InventoryEntry[],
  catalog: PacketCatalog,
): RuntimeCapabilityRequest[] {
  const byId = new Map(entries.map((entry) => [entry.canonicalAbilityId, entry] as const));
  const requests: RuntimeCapabilityRequest[] = [];

  for (const capability of [...(catalog.capabilities ?? [])].sort((left, right) => left.id.localeCompare(right.id))) {
    if (capability.category === 'existing_contract') continue;
    if (capability.eligibleAbilities.length === 0) continue;

    const affectedEntries = capability.eligibleAbilities
      .map((id) => byId.get(id))
      .filter((entry): entry is InventoryEntry => Boolean(entry))
      .sort((left, right) => left.canonicalAbilityId.localeCompare(right.canonicalAbilityId));
    if (affectedEntries.length === 0) continue;

    const requestType =
      capability.category === 'reviewed_special'
        ? 'REVIEWED_SPECIAL_REQUEST'
        : 'GENERIC_CAPABILITY_REQUEST';
    requests.push({
      requestId: stableId('runtime-capability', capability.id),
      requestType,
      capabilityId: capability.id,
      mechanicFamily: capability.mechanicFamily,
      affectedAbilityIds: affectedEntries.map((entry) => entry.canonicalAbilityId),
      sourceReferences: affectedEntries.flatMap(sourceReferencesFor),
      capabilityGap:
        requestType === 'REVIEWED_SPECIAL_REQUEST'
          ? `Source-grounded semantics require reviewed-special handling for ${capability.id}; no generic accepted current capability is declared for this pattern.`
          : `Source-grounded semantics require ${capability.id}, but the catalog classifies it as a generic capability request rather than an accepted current contract.`,
      requiredContract: {
        input: [...capability.input],
        output: [...capability.output],
        events: [...capability.events],
        resultBinding: [...capability.resultBinding],
        transactionBehavior: capability.transactionBehavior,
        eligibilityAxes: [...capability.eligibilityAxes],
        invalidatingAxes: [...capability.invalidatingAxes],
      },
      recommendation:
        requestType === 'REVIEWED_SPECIAL_REQUEST'
          ? 'B/R should review whether the pattern can be reduced to reusable generic capabilities before approving any dedicated handler.'
          : 'Specify and independently accept one reusable Phase 3 capability contract, then select representative Gate A/B/C evidence before migration.',
      referenceBehavior: referenceBehaviorFor(affectedEntries),
      runtimeImpact: 'This is a technical runtime request only. It is not a user rule question and does not authorize runtime implementation or Gate promotion.',
      acceptanceVehicle: capability.acceptanceVehicle,
      representatives: [...capability.representatives].sort(),
    });
  }

  return requests;
}

function coveredBlockedIds(ruleDecisions: FullRosterRuleDecisions): string[] {
  return [
    ...ruleDecisions.decisionPackets.flatMap((packet) => packet.affectedAbilityIds),
    ...ruleDecisions.sourceEvidencePackets.flatMap((packet) => packet.affectedAbilityIds),
    ...ruleDecisions.externalDependencies.map((dependency) => dependency.abilityId),
  ];
}

function assertUniqueBlockedCoverage(ruleDecisions: FullRosterRuleDecisions): void {
  const covered = coveredBlockedIds(ruleDecisions);
  const seen = new Set<string>();
  for (const id of covered) {
    if (seen.has(id)) throw new Error(`Blocked identity appears in more than one decision/evidence/dependency packet: ${id}`);
    seen.add(id);
  }
}

export function assertPacketSeparation(
  ruleDecisions: FullRosterRuleDecisions,
  runtimeRequests: FullRosterRuntimeCapabilityRequests,
): void {
  const technicalPattern = /\b(?:handler|primitive|runtime|implementation|typescript|api|schema|hot[ -]?file)\b/i;
  for (const packet of ruleDecisions.decisionPackets) {
    if (packet.packetType !== 'USER_RULE_DECISION') {
      throw new Error(`Invalid user rule decision packet type: ${packet.packetType}`);
    }
    if (technicalPattern.test(packet.ambiguity)) {
      throw new Error(`Technical implementation question leaked into user rule decision packet ${packet.packetId}.`);
    }
    for (const option of packet.options) {
      if (technicalPattern.test(option.description)) {
        throw new Error(`Technical implementation option leaked into user rule decision packet ${packet.packetId}.`);
      }
    }
  }

  const decisionIds = new Set(ruleDecisions.decisionPackets.flatMap((packet) => packet.affectedAbilityIds));
  const evidenceIds = new Set(ruleDecisions.sourceEvidencePackets.flatMap((packet) => packet.affectedAbilityIds));
  for (const id of decisionIds) {
    if (evidenceIds.has(id)) throw new Error(`Ability is both a user rule decision and source-evidence request: ${id}`);
  }

  const runtimeIds = new Set(runtimeRequests.requests.flatMap((request) => request.affectedAbilityIds));
  for (const id of decisionIds) {
    if (runtimeIds.has(id)) throw new Error(`Rule-blocked ability leaked into a runtime capability request: ${id}`);
  }

  assertUniqueBlockedCoverage(ruleDecisions);
}

export function buildDecisionPackets(
  inventory: PacketInventory,
  catalog: PacketCatalog,
): {
  ruleDecisions: FullRosterRuleDecisions;
  runtimeRequests: FullRosterRuntimeCapabilityRequests;
} {
  const entries = allEntries(inventory);
  const blocked = entries.filter((entry) => entry.phase3?.mappingStatus === 'EXPLICIT_BLOCK');
  const decisionPackets = makeRuleDecisionPackets(entries);
  const sourceEvidencePackets = makeSourceEvidencePackets(entries);
  const externalDependencies = makeExternalDependencies(entries);

  const provenance = {
    referenceRepository: inventory.provenance?.repository ?? catalog.provenance?.referenceRepository ?? '',
    referenceCommit: inventory.provenance?.commit ?? catalog.provenance?.referenceCommit ?? '',
  };

  const covered = new Set([
    ...decisionPackets.flatMap((packet) => packet.affectedAbilityIds),
    ...sourceEvidencePackets.flatMap((packet) => packet.affectedAbilityIds),
    ...externalDependencies.map((dependency) => dependency.abilityId),
  ]);
  const uncovered = blocked
    .map((entry) => entry.canonicalAbilityId)
    .filter((id) => !covered.has(id));

  const ruleDecisions: FullRosterRuleDecisions = {
    schemaVersion: 1,
    kind: 'phase3-full-roster-rule-decisions',
    provenance,
    summary: {
      blockedIdentityCount: blocked.length,
      coveredBlockedIdentityCount: blocked.length - uncovered.length,
      uncoveredBlockedIdentityCount: uncovered.length,
      ruleDecisionPacketCount: decisionPackets.length,
      sourceEvidencePacketCount: sourceEvidencePackets.length,
      externalDependencyCount: externalDependencies.length,
    },
    decisionPackets,
    sourceEvidencePackets,
    externalDependencies,
  };

  if (uncovered.length > 0) {
    throw new Error(`Blocked identities are not covered by a decision/evidence/dependency packet: ${uncovered.slice(0, 8).join(', ')}`);
  }

  const requests = makeRuntimeRequests(entries, catalog);
  const requestAffectedIds = uniq(requests.flatMap((request) => request.affectedAbilityIds));
  const runtimeRequests: FullRosterRuntimeCapabilityRequests = {
    schemaVersion: 1,
    kind: 'phase3-full-roster-runtime-capability-requests',
    provenance,
    summary: {
      runtimeRequestCount: requests.length,
      genericCapabilityRequestCount: requests.filter((request) => request.requestType === 'GENERIC_CAPABILITY_REQUEST').length,
      reviewedSpecialRequestCount: requests.filter((request) => request.requestType === 'REVIEWED_SPECIAL_REQUEST').length,
      affectedIdentityCount: requestAffectedIds.length,
    },
    requests,
  };

  assertPacketSeparation(ruleDecisions, runtimeRequests);
  return { ruleDecisions, runtimeRequests };
}

function markdownRefs(refs: SourceReference[]): string {
  if (refs.length === 0) return '`NONE`';
  return refs
    .map((ref) => `\`${ref.abilityId}\` ->\`${ref.document}#${ref.locator}\`${ref.sha256 ? ` (sha256=${ref.sha256})` : ''}`)
    .join('<br>');
}

export function renderRuleDecisionReport(data: FullRosterRuleDecisions): string {
  const lines: string[] = [];
  lines.push('# Phase 3 Full-Roster Rule Decisions And Source Evidence', '');
  lines.push('- Document Role: REVIEW INPUT');
  lines.push('- User Decision Boundary: only `USER_RULE_DECISION` packets ask the user to rule on game semantics.');
  lines.push('- Technical Boundary: source evidence gaps and runtime capability design are not user rule questions.');
  lines.push('- Reference Policy: Reference runtime behavior is non-authoritative throughout this report.', '');
  lines.push(`blockedIdentityCount=${data.summary.blockedIdentityCount}`);
  lines.push(`coveredBlockedIdentityCount=${data.summary.coveredBlockedIdentityCount}`);
  lines.push(`uncoveredBlockedIdentityCount=${data.summary.uncoveredBlockedIdentityCount}`);
  lines.push(`ruleDecisionPacketCount=${data.summary.ruleDecisionPacketCount}`);
  lines.push(`sourceEvidencePacketCount=${data.summary.sourceEvidencePacketCount}`);
  lines.push(`externalDependencyCount=${data.summary.externalDependencyCount}`, '');

  lines.push('## User Rule Decision Packets', '');
  if (data.decisionPackets.length === 0) {
    lines.push('No user rule decision is currently identified by the source-grounded full-roster pipeline.', '');
  } else {
    for (const packet of data.decisionPackets) {
      lines.push(`### ${packet.packetId}`, '');
      lines.push(`Affected: ${packet.affectedAbilityIds.map((id) => `\`${id}\``).join(', ')}`);
      lines.push(`Ambiguity: ${packet.ambiguity}`);
      lines.push(`Recommendation: ${packet.recommendation}`);
      lines.push(`Runtime impact: ${packet.runtimeImpact}`);
      lines.push(`Reference behavior: **${packet.referenceBehavior.authority}**  - ${packet.referenceBehavior.note}`);
      lines.push('Options:');
      for (const option of packet.options) lines.push(`- \`${option.id}\`: ${option.description}`);
      lines.push(`Sources: ${markdownRefs(packet.sourceReferences)}`, '');
    }
  }

  lines.push('## Source Evidence Packets', '');
  for (const packet of data.sourceEvidencePackets) {
    lines.push(`### ${packet.packetId}`, '');
    lines.push(`Affected count: ${packet.affectedAbilityIds.length}`);
    lines.push(`Missing evidence: ${packet.missingEvidence.map((value) => `\`${value}\``).join(', ') || '`UNSPECIFIED`'}`);
    lines.push(`Recommendation: ${packet.recommendation}`);
    lines.push(`Runtime impact: ${packet.runtimeImpact}`);
    lines.push(`Reference behavior: **${packet.referenceBehavior.authority}**  - ${packet.referenceBehavior.note}`);
    lines.push(`Sources: ${markdownRefs(packet.sourceReferences)}`, '');
  }

  lines.push('## External Dependencies', '');
  if (data.externalDependencies.length === 0) lines.push('None.', '');
  else {
    for (const dependency of data.externalDependencies) {
      lines.push(`- \`${dependency.abilityId}\`: \`${dependency.dependency}\` (${dependency.route})`);
    }
    lines.push('');
  }
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

export function renderRuntimeCapabilityReport(data: FullRosterRuntimeCapabilityRequests): string {
  const lines: string[] = [];
  lines.push('# Phase 3 Full-Roster Runtime Capability Requests', '');
  lines.push('- Document Role: TECHNICAL REVIEW INPUT');
  lines.push('- User Rule Boundary: these are technical runtime requests, not game-rule questions for the user.');
  lines.push('- Gate Boundary: no request authorizes implementation, migration, KPI change, or Gate promotion.');
  lines.push('- Reference Policy: Reference runtime behavior is non-authoritative.', '');
  lines.push(`runtimeRequestCount=${data.summary.runtimeRequestCount}`);
  lines.push(`genericCapabilityRequestCount=${data.summary.genericCapabilityRequestCount}`);
  lines.push(`reviewedSpecialRequestCount=${data.summary.reviewedSpecialRequestCount}`);
  lines.push(`affectedIdentityCount=${data.summary.affectedIdentityCount}`, '');

  for (const request of data.requests) {
    lines.push(`## ${request.capabilityId}`, '');
    lines.push(`Request type: \`${request.requestType}\``);
    lines.push(`Mechanic family: \`${request.mechanicFamily}\``);
    lines.push(`Affected count: ${request.affectedAbilityIds.length}`);
    lines.push(`Capability gap: ${request.capabilityGap}`);
    lines.push(`Recommendation: ${request.recommendation}`);
    lines.push(`Transaction behavior: ${request.requiredContract.transactionBehavior}`);
    lines.push(`Eligibility axes: ${request.requiredContract.eligibilityAxes.map((value) => `\`${value}\``).join(', ') || '`NONE`'}`);
    lines.push(`Invalidating axes: ${request.requiredContract.invalidatingAxes.map((value) => `\`${value}\``).join(', ') || '`NONE`'}`);
    lines.push(`Acceptance vehicle: ${request.acceptanceVehicle}`);
    lines.push(`Reference behavior: **${request.referenceBehavior.authority}**  - ${request.referenceBehavior.note}`);
    lines.push(`Runtime impact: ${request.runtimeImpact}`);
    lines.push(`Sources: ${markdownRefs(request.sourceReferences)}`, '');
  }
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function parseArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith('--')) return undefined;
  return value;
}

function main(): void {
  const args = process.argv.slice(2);
  const referenceRootArgument = parseArgument(args, '--reference-root');
  if (!referenceRootArgument) {
    throw new Error('Usage: build-decision-packets --reference-root <clean-reference-checkout> [--inventory <inventory.json>] [--catalog <catalog.json>]');
  }

  const referenceRoot = resolve(referenceRootArgument);
  const inventoryPath = resolve(parseArgument(args, '--inventory') ?? DEFAULT_INVENTORY_PATH);
  const catalogPath = resolve(parseArgument(args, '--catalog') ?? DEFAULT_CATALOG_PATH);
  const ruleDecisionsPath = resolve(parseArgument(args, '--rule-output') ?? DEFAULT_RULE_DECISIONS_PATH);
  const runtimeRequestsPath = resolve(parseArgument(args, '--runtime-output') ?? DEFAULT_RUNTIME_REQUESTS_PATH);
  const ruleReportPath = resolve(parseArgument(args, '--rule-report') ?? DEFAULT_RULE_REPORT_PATH);
  const runtimeReportPath = resolve(parseArgument(args, '--runtime-report') ?? DEFAULT_RUNTIME_REPORT_PATH);

  for (const output of [ruleDecisionsPath, runtimeRequestsPath, ruleReportPath, runtimeReportPath]) {
    assertOutputOutsideReference(referenceRoot, output);
  }

  const verifiedReference = verifyReferenceRoot(referenceRoot);
  const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as PacketInventory;
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as PacketCatalog;
  if (
    inventory.provenance?.repository !== verifiedReference.repository ||
    inventory.provenance?.commit !== verifiedReference.commit
  ) {
    throw new Error('Inventory provenance does not match the locked Reference checkout.');
  }
  if (
    catalog.provenance?.referenceRepository !== verifiedReference.repository ||
    catalog.provenance?.referenceCommit !== verifiedReference.commit
  ) {
    throw new Error('Capability catalog provenance does not match the locked Reference checkout.');
  }

  const result = buildDecisionPackets(inventory, catalog);
  const ruleReport = renderRuleDecisionReport(result.ruleDecisions);
  const runtimeReport = renderRuntimeCapabilityReport(result.runtimeRequests);

  for (const output of [ruleDecisionsPath, runtimeRequestsPath, ruleReportPath, runtimeReportPath]) {
    mkdirSync(dirname(output), { recursive: true });
  }
  writeFileSync(ruleDecisionsPath, `${JSON.stringify(result.ruleDecisions, null, 2)}\n`, 'utf8');
  writeFileSync(runtimeRequestsPath, `${JSON.stringify(result.runtimeRequests, null, 2)}\n`, 'utf8');
  writeFileSync(ruleReportPath, ruleReport, 'utf8');
  writeFileSync(runtimeReportPath, runtimeReport, 'utf8');

  process.stdout.write(`${JSON.stringify({ ruleDecisions: result.ruleDecisions.summary, runtimeRequests: result.runtimeRequests.summary }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));
if (invokedPath === modulePath) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
