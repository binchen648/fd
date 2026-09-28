import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonRecord = Record<string, any>;

const DEFAULT_MANIFEST = 'artifacts/phase3-e04-statistics-freeze.json';

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function git(root: string, args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) throw new Error(`FREEZE_MISMATCH: ${label}: expected ${String(expected)}, got ${String(actual)}`);
}

function assertFileHash(root: string, path: string, expected: string, label: string): void {
  const fullPath = resolve(root, path);
  if (!existsSync(fullPath)) throw new Error(`FREEZE_MISSING: ${label}: ${path}`);
  assertEqual(sha256File(fullPath), expected, `${label} SHA-256`);
}

function assertCommitRef(root: string, checkpoint: JsonRecord): void {
  assertEqual(git(root, ['rev-parse', checkpoint.contentCommit]), checkpoint.contentCommit, `${checkpoint.taskId} contentCommit`);
  assertEqual(git(root, ['rev-parse', checkpoint.frozenRef]), checkpoint.contentCommit, `${checkpoint.taskId} frozenRef`);
}

function verifyCheckpoint(root: string, checkpoint: JsonRecord, matrix: JsonRecord, decomposition?: JsonRecord): void {
  assertCommitRef(root, checkpoint);
  assertEqual(matrix.taskId, 'P3-E04-A111', 'A111 source taskId');
  assertEqual(matrix.controlEpoch, checkpoint.controlEpoch, `${checkpoint.taskId} controlEpoch`);
  assertEqual(matrix.mainSha, checkpoint.mainSha, `${checkpoint.taskId} mainSha`);
  assertEqual(matrix.frozenDenominator, checkpoint.accounting.denominator, `${checkpoint.taskId} denominator`);
  assertEqual(matrix.acceptedIdentityCount, checkpoint.accounting.accepted, `${checkpoint.taskId} accepted count`);
  assertEqual(matrix.remainingIdentityCount, checkpoint.accounting.remaining, `${checkpoint.taskId} remaining count`);
  assertEqual(matrix.identities.length, checkpoint.accounting.accepted, `${checkpoint.taskId} identity count`);
  assertEqual(matrix.duplicateAcceptedIds.length, checkpoint.accounting.duplicateAcceptedIds ?? 0, `${checkpoint.taskId} duplicate count`);
  assertEqual(matrix.missingAcceptedIds.length, checkpoint.accounting.missingAcceptedIds ?? 0, `${checkpoint.taskId} missing count`);
  assertFileHash(root, checkpoint.matrixArtifact, checkpoint.matrixSha256, `${checkpoint.taskId} matrix`);
  assertFileHash(root, checkpoint.reportArtifact, checkpoint.reportSha256, `${checkpoint.taskId} report`);
  if (!decomposition) return;
  assertFileHash(root, checkpoint.decompositionArtifact, checkpoint.decompositionSha256, `${checkpoint.taskId} decomposition`);
  assertEqual(decomposition.taskId, checkpoint.taskId, 'A112 decomposition taskId');
  assertEqual(decomposition.sourceMatrixSha256, checkpoint.matrixSha256, 'A112 source matrix SHA-256');
  assertEqual(decomposition.acceptedIdentityCount, checkpoint.accounting.accepted, 'A112 accepted count');
  assertEqual(decomposition.frozenDenominator, checkpoint.accounting.denominator, 'A112 denominator');
  assertEqual(decomposition.remainingIdentityCount, checkpoint.accounting.remaining, 'A112 remaining count');
  assertEqual(decomposition.accounting.mainCoverageCreditDelta, checkpoint.accounting.mainCoverageCreditDelta, 'A112 main credit delta');
  for (const [key, expected] of Object.entries(checkpoint.gapCounts)) assertEqual(decomposition.gapCounts[key], expected, `A112 gap count ${key}`);
  for (const [key, expected] of Object.entries(checkpoint.primaryGapCounts)) assertEqual(decomposition.primaryGapCounts[key], expected, `A112 primary gap count ${key}`);
  for (const [key, expected] of Object.entries(checkpoint.registryDiagnosisCounts)) assertEqual(decomposition.registryDiagnosisCounts[key], expected, `A112 registry diagnosis ${key}`);
  assertEqual(JSON.stringify(decomposition.registryDiagnosisNotEvaluated), JSON.stringify(checkpoint.registryDiagnosisNotEvaluated), 'A112 not-evaluated registry diagnoses');
}

export function verifyFrozenState(options: { workspaceRoot?: string; manifestPath?: string } = {}): JsonRecord {
  const workspaceRoot = resolve(options.workspaceRoot ?? process.cwd());
  const manifestPath = resolve(workspaceRoot, options.manifestPath ?? DEFAULT_MANIFEST);
  const manifest = readJson<JsonRecord>(manifestPath);
  assertEqual(manifest.schemaVersion, 'fd-phase3-e04-statistics-freeze-v1', 'freeze schema');
  assertEqual(manifest.controlEpoch, 'FD-P3-2026-09-23-04', 'freeze controlEpoch');
  assertEqual(manifest.policy.statisticsImmutable, true, 'statisticsImmutable');
  assertEqual(manifest.policy.migrationCreditImmutable, true, 'migrationCreditImmutable');
  const a111 = manifest.checkpoints.A111;
  const a112 = manifest.checkpoints.A112;
  const matrix = readJson<JsonRecord>(resolve(workspaceRoot, a111.matrixArtifact));
  const decomposition = readJson<JsonRecord>(resolve(workspaceRoot, a112.decompositionArtifact));
  verifyCheckpoint(workspaceRoot, a111, matrix);
  verifyCheckpoint(workspaceRoot, a112, matrix, decomposition);
  assertEqual(git(workspaceRoot, ['merge-base', '--is-ancestor', a111.contentCommit, a112.contentCommit]) === '', true, 'A111 ancestor of A112');
  return { freezeId: manifest.freezeId, A111: a111.contentCommit, A112: a112.contentCommit, matrixSha256: a111.matrixSha256, decompositionSha256: a112.decompositionSha256 };
}

function main(): void {
  const index = process.argv.indexOf('--manifest');
  const manifestPath = index >= 0 ? process.argv[index + 1] : undefined;
  process.stdout.write(`${JSON.stringify(verifyFrozenState({ manifestPath }), null, 2)}\n`);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invoked === resolve(fileURLToPath(import.meta.url))) main();
