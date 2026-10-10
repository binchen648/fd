import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertFinalTaskCheck, buildFinalTaskCheck, runPreflight } from '../phase3-preflight';
import { git, gitText, hash, InputError } from '../phase3-tooling-common';
import { publicationSha, reference } from '../phase3-b11-tooling-inputs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const taskId = 'P3-E08-B11-RESULT-BINDING-CURRENT-MAIN-REPLAY';
const manifestPath = `docs/agents/manifests/tasks/${taskId}.json`;
const sourcePath = 'packages/rules/src/ability/resolution-dataflow.ts';
const rulesPath = 'docs/rules/FD-Game-Rules-Final.md';
const directories: string[] = [];

function fixture(mode: 'normal' | 'delete' | 'rename') {
  const cwd = mkdtempSync(join(tmpdir(), 'fd-readiness-test-')); directories.push(cwd);
  git(cwd, ['init']); git(cwd, ['config', 'user.name', 'Automation Fixture']); git(cwd, ['config', 'user.email', 'fixture@example.invalid']);
  const common = resolve(root, gitText(root, ['rev-parse', '--git-common-dir']));
  writeFileSync(join(cwd, '.git/objects/info/alternates'), `${join(common, 'objects').replaceAll('\\', '/')}\n`);
  const write = (path: string, text: string) => { mkdirSync(dirname(join(cwd, path)), { recursive: true }); writeFileSync(join(cwd, path), text); };
  write(sourcePath, 'base\n'); write(rulesPath, '# Fixture canonical rules\n'); write('apps/client/outside.txt', 'outside\n');
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'base']); const base = gitText(cwd, ['rev-parse', 'HEAD']);
  write(sourcePath, 'candidate\n');
  write(manifestPath, JSON.stringify({ taskId, owner: 'Codex B', baseCommit: base }));
  if (mode === 'delete') rmSync(join(cwd, 'apps/client/outside.txt'));
  if (mode === 'rename') {
    git(cwd, ['mv', sourcePath, 'apps/client/renamed.txt']);
  }
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'candidate']); const candidate = gitText(cwd, ['rev-parse', 'HEAD']);
  write('review.json', JSON.stringify({ schemaVersion: 'fd-p3-task-review-v1', taskId, controlEpoch: 'FD-P3-2026-09-23-08', reviewedSha: candidate, verdict: 'PASS', reviewer: 'Codex Reviewer B' }));
  write('execution.json', JSON.stringify({ schemaVersion: 'fd-p3-execution-check-v1', testedSha: candidate, command: 'fixture-check', exitCode: 0, producer: 'test fixture only' }));
  git(cwd, ['add', '.']); git(cwd, ['commit', '-m', 'fixture review and execution']); const review = gitText(cwd, ['rev-parse', 'HEAD']);
  const input = {
    schemaVersion: 'fd-p3-task-check-v1', taskId: 'P3-E08-B11-COMBINATION-READINESS', controlEpoch: 'FD-P3-2026-09-23-08', baseSha: base, candidateSha: candidate,
    contract: reference(cwd, publicationSha, 'docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md', '## phase3:preflight'),
    segments: [{ adapter: 'b11-v1', role: 'B', taskId, scope: 'RESULT_BINDING_B11', baseSha: base, candidateSha: candidate,
      authorizedPaths: [sourcePath, manifestPath], record: reference(cwd, candidate, manifestPath),
      references: [reference(cwd, candidate, rulesPath, '# Fixture canonical rules')],
      dependencies: [{ taskId, candidateSha: candidate, state: 'ACCEPTED', review: reference(cwd, review, 'review.json') }],
    }],
    checks: [{ id: 'fixture-check', command: 'fixture-check', state: 'EXECUTED', testedSha: candidate, evidence: reference(cwd, review, 'execution.json') }],
  };
  return { cwd, base, candidate, review, input };
}

let normal: ReturnType<typeof fixture>;
let deleted: ReturnType<typeof fixture>;
let renamed: ReturnType<typeof fixture>;
let finalTask: ReturnType<typeof buildFinalTaskCheck>;
const evaluate = (context: ReturnType<typeof fixture>, input: unknown = context.input, candidate = context.candidate) => runPreflight(context.cwd, input, candidate, context.base, hash(JSON.stringify(input)));

describe('readiness preflight, independent from promotion policy', () => {
  beforeAll(() => {
    normal = fixture('normal'); deleted = fixture('delete'); renamed = fixture('rename');
    const input = JSON.parse(readFileSync(join(root, 'scripts/fixtures/phase3-b11-task-check.json'), 'utf8'));
    finalTask = buildFinalTaskCheck(root, input.finalBinding.sourceSha);
  }, 60_000);
  afterAll(() => { for (const path of directories) rmSync(path, { recursive: true, force: true }); });
  it('binds every original uncovered path without converting registration into acceptance', () => {
    expect(finalTask.provenance).toHaveLength(40);
    expect(new Set(finalTask.provenance.map(row => row.path)).size).toBe(40);
    for (const row of finalTask.provenance) {
      expect(row.introducingSha).toMatch(/^[0-9a-f]{40}$/);
      expect(row.introducingDelta.sha256).toMatch(/^[0-9A-F]{64}$/);
      expect(row.finalContent.sha256).toMatch(/^[0-9A-F]{64}$/);
      expect(row.acceptedScope).toBe('NOT_ACCEPTED_WHOLESALE');
      expect(row.finalReviewState).toBe('PENDING_RA_RB_FINAL_COMBINATION');
      if (row.role === 'B') expect(row.originalAuthorization).toBeNull();
    }
    assertFinalTaskCheck(finalTask, structuredClone(finalTask));
  });
  it('rejects altered introducing SHA, hashes, original authority, scope, checks and credit', () => {
    for (const mutate of [
      (v: any) => { v.provenance[0].introducingSha = '0'.repeat(40); },
      (v: any) => { v.provenance[0].finalContent.sha256 = '0'.repeat(64); },
      (v: any) => { v.provenance[0].originalAuthorization = v.authorization; },
      (v: any) => { v.provenance[0].acceptedScope = 'ACCEPTED'; },
      (v: any) => { v.provenance.pop(); },
      (v: any) => { v.provenance[0].path = 'packages/rules/src/**'; },
      (v: any) => { v.checks[0].state = 'PASS'; },
      (v: any) => { v.formalCredit.mainCoverageCreditDelta = 1; },
    ]) {
      const actual = structuredClone(finalTask); mutate(actual);
      expect(() => assertFinalTaskCheck(actual, finalTask)).toThrow('Final provenance evidence mismatch');
    }
  });
  it('verifies exact committed input, role-scoped paths, review and execution binding', () => {
    const result = evaluate(normal);
    expect(result.status).toBe('PASS'); expect(result.issues).toEqual([]);
    expect(result.acceptanceGranted).toBe(false); expect(result.reviewReadyChanged).toBe(false);
  }, 15_000);
  it('rejects stale candidate, pending or missing dependency evidence', () => {
    expect(evaluate(normal, normal.input, normal.review).issues.map(issue => issue.code)).toContain('EXACT_SHA_MISMATCH');
    const pending = structuredClone(normal.input) as any;
    pending.segments[0].dependencies[0] = { taskId, candidateSha: normal.candidate, state: 'PENDING' };
    expect(evaluate(normal, pending).issues.map(issue => issue.code)).toContain('DEPENDENCY_PENDING');
    const missing = structuredClone(normal.input);
    missing.segments[0].dependencies[0].review.path = 'missing.json';
    expect(evaluate(normal, missing).issues.map(issue => issue.code)).toContain('REFERENCE_BINDING_FAILED');
  }, 30_000);
  it('rejects unauthorized deleted and renamed paths, not just surviving files', () => {
    expect(evaluate(deleted).issues.some(issue => issue.code === 'UNAUTHORIZED_CHANGED_PATH' && issue.path === 'apps/client/outside.txt')).toBe(true);
    const result = evaluate(renamed);
    expect(result.changedPaths).toContain(sourcePath);
    expect(result.issues.some(issue => issue.code === 'UNAUTHORIZED_CHANGED_PATH' && issue.path === 'apps/client/renamed.txt')).toBe(true);
  }, 15_000);
  it('rejects unsupported schemas, arbitrary adapter shapes and role expansion', () => {
    expect(() => evaluate(normal, { ...normal.input, schemaVersion: 'contractVersion=1' })).toThrow(InputError);
    const bad = structuredClone(normal.input); bad.segments[0].adapter = '__proto__';
    expect(() => evaluate(normal, bad)).toThrow(InputError);
    const expanded = structuredClone(normal.input); expanded.segments[0].role = 'A';
    expect(evaluate(normal, expanded).issues.map(issue => issue.code)).toContain('ADAPTER_OWNER_SCOPE_MISMATCH');
  }, 15_000);
  it('rejects digest drift and never treats the dirty working tree as the tested commit', () => {
    const input = structuredClone(normal.input); input.segments[0].record.sha256 = '0'.repeat(64);
    expect(evaluate(normal, input).issues.map(issue => issue.code)).toContain('REFERENCE_BINDING_FAILED');
    writeFileSync(join(normal.cwd, 'dirty.txt'), 'dirty\n');
    const result = evaluate(normal); expect(result.worktree.dirty).toBe(true); expect(result.worktree.inspectedWorkingTree).toBe(false);
    expect(readFileSync(join(normal.cwd, sourcePath), 'utf8')).toBe('candidate\n');
  }, 15_000);
});
