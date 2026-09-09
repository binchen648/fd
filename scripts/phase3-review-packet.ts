import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCoverageFromArchives, loadAuthoringArchives } from './phase3-coverage';

interface PacketArgs {
  task: string;
  batch: string;
  out: string;
  diffBase: string;
}

function parseArgs(argv: string[], workspaceRoot: string): PacketArgs {
  const readValue = (name: string, fallback: string): string => {
    const index = argv.indexOf(name);
    return index >= 0 && argv[index + 1] ? argv[index + 1]! : fallback;
  };
  const task = readValue('--task', argv.find((arg) => !arg.startsWith('--')) ?? 'P3-A01');
  return {
    task,
    batch: readValue('--batch', 'PHASE_3_COVERAGE_AND_EVIDENCE_AUTOMATION'),
    out: resolve(workspaceRoot, readValue('--out', `artifacts/phase3-review-packet-${task.toLowerCase()}.json`)),
    diffBase: readValue('--diff-base', 'origin/main'),
  };
}

export function loadCoverage(workspaceRoot: string) {
  return buildCoverageFromArchives(loadAuthoringArchives(workspaceRoot), { workspaceRoot });
}

function semanticPrimitiveSummary(coverage: ReturnType<typeof buildCoverageFromArchives>): string[] {
  return Object.entries(coverage.runtimeRouting.semanticRouteCounts)
    .map(([route, count]) => `${route}:${count}`)
    .sort();
}

export function buildReviewPacket(
  coverage: ReturnType<typeof buildCoverageFromArchives>,
  args: Pick<PacketArgs, 'task' | 'batch'>,
  hotRuntimeFiles = hotRuntimeTouchSummary([]),
) {
  const affectedAbilities = coverage.semanticAxes
    .filter((row) => row.semanticRoutes.length > 0)
    .map((row) => ({
      archiveId: row.archiveId,
      cardId: row.cardId,
      abilityId: row.abilityId,
      semanticRoutes: row.semanticRoutes,
      runtimeRoute: row.runtimeRoute,
    }));

  return {
    schemaVersion: 'fd-phase3-review-packet-v1',
    generatedAt: new Date().toISOString(),
    task: args.task,
    batch: args.batch,
    claimedAcceptance: 'AUTOMATION_BASELINE_CANDIDATE',
    reviewerAuthorityNotice: 'Implementation packet only. It does not promote Gate A/B/C, Phase 3, or Release status.',
    hotRuntimeFilesTouched: hotRuntimeFiles,
    changedSemanticPrimitives: args.task === 'P3-A01' ? [] : semanticPrimitiveSummary(coverage),
    affectedAbilities,
    runtimeRoutingBeforeAfter: coverage.runtimeRouting,
    legacyBurnDown: coverage.legacyMetrics,
    suggestedTestCommands: [
      'npx vitest run scripts/tests/phase3-coverage.test.ts',
      'npm run phase3:coverage',
      `npm run phase3:review-packet -- --task ${args.task}`,
      'npm run typecheck',
    ],
    negativeEvidence: {
      taxonomyDriftProtections: coverage.taxonomyDriftProtections.rules,
      unclassifiedItems: coverage.unclassifiedItems,
    },
    remainingLegacy: {
      legacyExecuteAbilityConsumers: coverage.legacyMetrics.legacyExecuteAbilityConsumers.after,
      legacyResolveEffectConsumers: coverage.legacyMetrics.legacyResolveEffectConsumers.after,
      dualRuntimeConsumers: coverage.legacyMetrics.dualRuntimeConsumers.after,
      notClassifiable: coverage.runtimeRouting.notClassifiable.after,
    },
    knownLimitations: [
      'Runtime routing classification is conservative static evidence, not a complete call graph.',
      'Card-specific handler detection is static literal scanning only.',
      'Gate A/B/C promotion remains reviewer-owned and is not decided by this packet.',
      'Content blocking issues in compiled definitions remain release-gate evidence, not automation acceptance.',
    ],
    areasNotVerified: [
      'Independent reviewer promotion.',
      'Complete runtime call graph ownership.',
      'Full roster migration.',
      'Release readiness.',
    ],
    unclassifiedItems: coverage.unclassifiedItems,
  };
}

const hotRuntimeFiles = new Set([
  'packages/rules/src/ability/interpreter.ts',
  'packages/rules/src/ability/resolution-dataflow.ts',
  'packages/rules/src/ability/executable-card-pack.ts',
  'packages/rules/src/ability/types.ts',
  'packages/rules/src/match-session.ts',
  'packages/rules/src/core/combat-resolver.ts',
  'packages/rules/src/core/effect-resolver.ts',
]);

export function hotRuntimeTouchSummary(changedFiles: string[]) {
  const files = changedFiles
    .map((file) => file.replace(/\\/g, '/'))
    .filter((file) => hotRuntimeFiles.has(file))
    .sort();
  return { status: files.length > 0 ? 'YES' : 'NO', files };
}

function diffFiles(workspaceRoot: string, diffBase: string): string[] {
  const commands = [
    ['diff', '--name-only', `${diffBase}...HEAD`],
    ['diff', '--name-only', `${diffBase}..HEAD`],
  ];
  for (const args of commands) {
    try {
      return execFileSync('git', args, { cwd: workspaceRoot, encoding: 'utf8' })
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    } catch {
      // Try the next diff form before giving up.
    }
  }
  return [];
}

export function runReviewPacketCli(argv = process.argv.slice(2), workspaceRoot = resolve('.')): void {
  const args = parseArgs(argv, workspaceRoot);
  const coverage = loadCoverage(workspaceRoot);
  const changedFiles = diffFiles(workspaceRoot, args.diffBase);
  const packet = buildReviewPacket(coverage, args, hotRuntimeTouchSummary(changedFiles));
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  process.stdout.write('PHASE_3_REVIEW_PACKET\n');
  process.stdout.write(`task=${args.task}\n`);
  process.stdout.write(`batch=${args.batch}\n`);
  process.stdout.write(`diffBase=${args.diffBase}\n`);
  process.stdout.write(`hotRuntimeFilesTouched=${packet.hotRuntimeFilesTouched.status}\n`);
  process.stdout.write(`affectedSemanticAbilities=${packet.affectedAbilities.length}\n`);
  process.stdout.write(`remainingLegacyResolveEffect=${packet.remainingLegacy.legacyResolveEffectConsumers}\n`);
  process.stdout.write(`notClassifiable=${packet.remainingLegacy.notClassifiable}\n`);
  process.stdout.write(`artifact=${relative(workspaceRoot, args.out)}\n`);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  runReviewPacketCli();
}
