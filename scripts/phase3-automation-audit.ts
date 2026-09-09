import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCoverageFromArchives, loadAuthoringArchives } from './phase3-coverage';

type CoverageArtifact = ReturnType<typeof buildCoverageFromArchives>;
type RuntimeRoute = 'LEGACY_RESOLVE_EFFECT' | 'LEGACY_EXECUTE_ABILITY' | 'NOT_CLASSIFIABLE';

interface ReportText {
  path: string;
  text: string;
}

interface LegacyOwnerRow {
  owner: string;
  runtimeRoute: RuntimeRoute;
  abilityCount: number;
  abilities: Array<{
    archiveId: string;
    cardId: string;
    abilityId: string;
    exactEffectPrimitives: string[];
    unclassifiedReasons: string[];
  }>;
}

function increment(map: Map<string, LegacyOwnerRow>, key: string, row: LegacyOwnerRow['abilities'][number], runtimeRoute: RuntimeRoute): void {
  const current = map.get(key) ?? {
    owner: key,
    runtimeRoute,
    abilityCount: 0,
    abilities: [],
  };
  current.abilityCount += 1;
  current.abilities.push(row);
  map.set(key, current);
}

function legacyOwnerFor(row: CoverageArtifact['semanticAxes'][number]): string {
  const primitive = row.exactEffectPrimitives[0];
  if (primitive) return `primitive:${primitive}`;
  const family = row.effectPrimitiveFamilies[0];
  if (family) return `family:${family}`;
  return `ability_kind:${row.abilityKind[0] ?? 'UNKNOWN'}`;
}

function unclassifiedOwnerFor(reason: string): string {
  return `unclassified:${reason.replace(/^NOT_CLASSIFIABLE:/, '')}`;
}

export function summarizeLegacyOwners(coverage: CoverageArtifact) {
  const ownerMap = new Map<string, LegacyOwnerRow>();
  const totals = {
    legacyResolveEffect: 0,
    legacyExecuteAbility: 0,
    notClassifiable: 0,
  };

  for (const row of coverage.semanticAxes) {
    const ability = {
      archiveId: row.archiveId,
      cardId: row.cardId,
      abilityId: row.abilityId,
      exactEffectPrimitives: row.exactEffectPrimitives,
      unclassifiedReasons: row.unclassifiedReasons,
    };

    if (row.runtimeRoute === 'LEGACY_RESOLVE_EFFECT') {
      totals.legacyResolveEffect += 1;
      increment(ownerMap, legacyOwnerFor(row), ability, row.runtimeRoute);
    } else if (row.runtimeRoute === 'LEGACY_EXECUTE_ABILITY') {
      totals.legacyExecuteAbility += 1;
      increment(ownerMap, legacyOwnerFor(row), ability, row.runtimeRoute);
    } else if (row.runtimeRoute === 'NOT_CLASSIFIABLE') {
      totals.notClassifiable += 1;
      const reasons = row.unclassifiedReasons.length > 0 ? row.unclassifiedReasons : ['NOT_CLASSIFIABLE:runtime_route_unknown'];
      for (const reason of reasons) increment(ownerMap, unclassifiedOwnerFor(reason), ability, row.runtimeRoute);
    }
  }

  return {
    totals,
    owners: [...ownerMap.values()].sort((left, right) =>
      right.abilityCount - left.abilityCount
      || left.runtimeRoute.localeCompare(right.runtimeRoute)
      || left.owner.localeCompare(right.owner),
    ),
  };
}

function reportGateCSection(text: string): string {
  const gateCIndex = text.search(/^##\s+Gate C\b/im);
  if (gateCIndex < 0) return '';
  const rest = text.slice(gateCIndex);
  const nextSection = rest.slice(1).search(/^##\s+/im);
  return nextSection >= 0 ? rest.slice(0, nextSection + 1) : rest;
}

export function auditPromotionEvidence(reports: ReportText[], e2eFiles: Set<string>) {
  const findings: Array<{
    severity: 'BLOCKING' | 'WARNING';
    reportPath: string;
    finding: string;
    reference?: string;
  }> = [];

  for (const report of reports) {
    const gateC = reportGateCSection(report.text);
    if (!gateC) continue;
    const references = [...gateC.matchAll(/e2e\/[\w./-]+\.spec\.ts/g)].map((match) => match[0]!);
    for (const reference of references) {
      if (!e2eFiles.has(reference)) {
        findings.push({
          severity: 'BLOCKING',
          reportPath: report.path,
          finding: 'GATE_C_REFERENCES_MISSING_E2E_SPEC',
          reference,
        });
      }
    }
    const claimsGateC = /Gate C|E2E|browser|WebSocket|expectedRevision|reconnect|stale/i.test(gateC);
    if (claimsGateC && references.length === 0) {
      findings.push({
        severity: 'WARNING',
        reportPath: report.path,
        finding: 'GATE_C_SECTION_WITHOUT_E2E_SPEC_REFERENCE',
      });
    }
  }

  return { findings };
}

export function buildP3A02AutomationAudit(coverage: CoverageArtifact, reports: ReportText[], e2eFiles: Set<string>) {
  return {
    schemaVersion: 'fd-phase3-a02-automation-audit-v1',
    generatedAt: new Date().toISOString(),
    task: 'P3-A02',
    batch: 'LEGACY_OWNER_AND_PROMOTION_EVIDENCE_AUTOMATION',
    claimedAcceptance: 'AUTOMATION_BASELINE_CANDIDATE',
    reviewerAuthorityNotice: 'Automation packet only. It does not promote Gate A/B/C, Phase 3, or Release status.',
    legacyOwnerReport: summarizeLegacyOwners(coverage),
    promotionEvidenceAudit: auditPromotionEvidence(reports, e2eFiles),
    coverageTrendBaseline: {
      totalAbilities: coverage.counts.totalAbilities,
      newRuntimeSemanticRouted: coverage.runtimeRouting.newRuntimeConsumers.after,
      legacyExecuteAbility: coverage.runtimeRouting.legacyExecuteAbilityConsumers.after,
      legacyResolveEffect: coverage.runtimeRouting.legacyResolveEffectConsumers.after,
      dualRuntime: coverage.runtimeRouting.dualRuntimeConsumers.after,
      pilotAllowlist: coverage.runtimeRouting.pilotAllowlistEntries.after,
      notClassifiable: coverage.runtimeRouting.notClassifiable.after,
      sourceFingerprint: coverage.sourceFingerprint,
    },
    gatePromotion: {
      promotedStatuses: [],
      reviewerRequiredForPromotion: true,
    },
    knownLimitations: [
      'Legacy owner grouping is static coverage evidence, not a runtime call graph.',
      'Promotion evidence audit checks report/spec consistency and does not prove semantic correctness.',
      'Codex R remains responsible for Gate A/B/C judgment.',
    ],
  };
}

function listReports(workspaceRoot: string): ReportText[] {
  const reportsRoot = resolve(workspaceRoot, 'docs/reports');
  if (!existsSync(reportsRoot)) return [];
  return readdirSync(reportsRoot)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const path = `docs/reports/${name}`;
      return { path, text: readFileSync(resolve(workspaceRoot, path), 'utf8') };
    });
}

function listE2eFiles(workspaceRoot: string): Set<string> {
  const e2eRoot = resolve(workspaceRoot, 'e2e');
  if (!existsSync(e2eRoot)) return new Set();
  const files = new Set<string>();
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name.endsWith('.spec.ts')) files.add(relative(workspaceRoot, fullPath).replace(/\\/g, '/'));
    }
  };
  walk(e2eRoot);
  return files;
}

function parseOutputPath(argv: string[], workspaceRoot: string): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return resolve(workspaceRoot, argv[index + 1]!);
  return resolve(workspaceRoot, 'artifacts/phase3-a02-automation-audit.json');
}

export function runP3A02AutomationAuditCli(argv = process.argv.slice(2), workspaceRoot = resolve('.')): void {
  const coverage = buildCoverageFromArchives(loadAuthoringArchives(workspaceRoot), { workspaceRoot });
  const packet = buildP3A02AutomationAudit(coverage, listReports(workspaceRoot), listE2eFiles(workspaceRoot));
  const out = parseOutputPath(argv, workspaceRoot);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  process.stdout.write('PHASE_3_A02_AUTOMATION_AUDIT\n');
  process.stdout.write(`legacyResolveEffect=${packet.legacyOwnerReport.totals.legacyResolveEffect}\n`);
  process.stdout.write(`legacyExecuteAbility=${packet.legacyOwnerReport.totals.legacyExecuteAbility}\n`);
  process.stdout.write(`notClassifiable=${packet.legacyOwnerReport.totals.notClassifiable}\n`);
  process.stdout.write(`promotionFindings=${packet.promotionEvidenceAudit.findings.length}\n`);
  process.stdout.write(`artifact=${relative(workspaceRoot, out)}\n`);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  runP3A02AutomationAuditCli();
}
