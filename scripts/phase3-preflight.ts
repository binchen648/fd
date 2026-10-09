import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ancestor, array, cliError, commitExists, fields, git, InputError, inputFile, json, object, output, parseArgs, parseReference, readReference, safePath, sha, string, type Issue } from './phase3-tooling-common';

const b11Task = 'P3-E08-B11-RESULT-BINDING-CURRENT-MAIN-REPLAY';
const socketTask = 'P3-E08-SHARED-SOCKET-LIFECYCLE-FIX';
const b11Paths = [
  'data/authoring/servants/servant.kintoki.json', 'data/generated/fd-playtest-v1.content-library.json',
  `docs/agents/manifests/tasks/${b11Task}.json`,
  'e2e/fd-conversion-magic-core-primitive.spec.ts', 'e2e/fd-golden-eater-result-binding.spec.ts',
  'e2e/support/prepare-conversion-magic-room.ts', 'e2e/support/prepare-golden-eater-room.ts',
  'e2e/support/start-conversion-magic-fixture-server.ts', 'e2e/support/start-golden-eater-fixture-server.ts',
  'packages/rules/src/ability/executable-card-pack.ts', 'packages/rules/src/ability/interpreter.ts',
  'packages/rules/src/ability/loader.ts', 'packages/rules/src/ability/resolution-dataflow.ts',
  'packages/rules/tests/regression/production-resolution-bridge.test.ts', 'packages/rules/tests/regression/resolution-dataflow.test.ts',
];
const adapters = {
  'b11-v1': { role: 'B', taskId: b11Task, scope: 'RESULT_BINDING_B11', paths: b11Paths },
  'shared-socket-v1': { role: 'B', taskId: socketTask, scope: 'SHARED_SOCKET_LIFECYCLE', paths: [
    'apps/server/src/match-server.ts', 'apps/server/src/match-server.test.ts', `docs/agents/manifests/tasks/${socketTask}.json`,
  ] },
  'a-coverage-v1': { role: 'A', taskId: 'P3-E08-B11-COVERAGE-EVIDENCE-SYNC', scope: 'COVERAGE_EVIDENCE', paths: [
    'artifacts/phase3-skill-coverage.json', 'artifacts/phase3-e08-b11-coverage-sync.json',
    'docs/reports/2026-10-09-p3-e08-b11-coverage-sync.md', 'scripts/phase3-e08-b11-coverage-sync.ts',
    'scripts/tests/phase3-e06-post-merge-recount.test.ts', 'scripts/tests/phase3-e08-b11-coverage-sync.test.ts',
  ] },
} as const;

export function changedPaths(root: string, base: string, candidate: string): string[] {
  const parts = git(root, ['diff', '--name-status', '-z', '--find-renames', base, candidate, '--']).toString('utf8').split('\0');
  const paths: string[] = [];
  for (let i = 0; i < parts.length - 1;) {
    const status = parts[i++];
    paths.push(parts[i++]);
    if (/^[RC]/.test(status)) paths.push(parts[i++]);
  }
  return [...new Set(paths)].sort();
}

function reviewDependency(root: string, raw: unknown, epoch: string, issues: Issue[]): void {
  const dependency = object(raw, 'dependency');
  fields(dependency, ['taskId', 'candidateSha', 'state', 'review'], 'dependency');
  const taskId = string(dependency.taskId, 'dependency.taskId');
  const candidate = sha(dependency.candidateSha, 'dependency.candidateSha');
  if (!commitExists(root, candidate)) issues.push({ code: 'DEPENDENCY_COMMIT_MISSING', path: candidate, message: taskId });
  if (dependency.state === 'PENDING') {
    if (dependency.review !== undefined) throw new InputError('Pending dependency cannot assert accepted review');
    issues.push({ code: 'DEPENDENCY_PENDING', path: candidate, message: taskId });
    return;
  }
  if (dependency.state !== 'ACCEPTED') throw new InputError('Unsupported dependency state');
  const ref = parseReference(dependency.review, 'dependency.review');
  const bytes = readReference(root, ref, issues);
  if (!bytes) return;
  const review = json(bytes, 'dependency review');
  if (review.schemaVersion !== 'fd-p3-task-review-v1' || review.taskId !== taskId || review.controlEpoch !== epoch ||
      review.reviewedSha !== candidate || review.verdict !== 'PASS' || !/^(github:|Codex Reviewer )/.test(String(review.reviewer))) {
    issues.push({ code: 'DEPENDENCY_REVIEW_MISMATCH', path: ref.path, message: 'Review schema, task, epoch, reviewed SHA, reviewer or conclusion mismatch' });
  }
  if (!ancestor(root, candidate, ref.commit)) issues.push({ code: 'DEPENDENCY_REVIEW_LINEAGE_FAILED', path: ref.commit, message: taskId });
}

export function runPreflight(root: string, raw: unknown, candidate: string, base: string, inputSha256: string) {
  const input = object(raw, 'task check');
  fields(input, ['schemaVersion', 'taskId', 'controlEpoch', 'baseSha', 'candidateSha', 'contract', 'segments', 'checks'], 'task check');
  if (input.schemaVersion !== 'fd-p3-task-check-v1') throw new InputError('Unsupported task-check schema');
  const taskId = string(input.taskId, 'taskId');
  const epoch = string(input.controlEpoch, 'controlEpoch');
  if (epoch !== 'FD-P3-2026-09-23-08' || taskId !== 'P3-E08-B11-COMBINATION-READINESS') throw new InputError('Unsupported task or epoch');
  sha(input.baseSha, 'baseSha'); sha(input.candidateSha, 'candidateSha'); sha(candidate, '--candidate'); sha(base, '--base');
  const issues: Issue[] = [];
  const contract = parseReference(input.contract, 'contract', true);
  readReference(root, contract, issues);
  if (contract.commit !== 'e65503e601d7a3a4d1265d87a09484cb8295f2c2' || contract.path !== 'docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md' || contract.section !== '## phase3:preflight') {
    issues.push({ code: 'CONTRACT_REFERENCE_MISMATCH', path: contract.path, message: 'Wrong minimum contract/section' });
  }
  if (input.baseSha !== base || input.candidateSha !== candidate) issues.push({ code: 'EXACT_SHA_MISMATCH', path: 'input', message: 'CLI/base/candidate mismatch' });
  for (const value of [base, candidate]) if (!commitExists(root, value)) issues.push({ code: 'COMMIT_MISSING', path: value, message: 'Exact commit unavailable' });
  if (!ancestor(root, base, candidate)) issues.push({ code: 'BASE_NOT_ANCESTOR', path: candidate, message: base });
  const segments = array(input.segments, 'segments');
  if (!segments.length) throw new InputError('At least one authorization segment required');
  let previous = base;
  const covered = new Set<string>();
  const inspectedSegments = segments.map((rawSegment, index) => {
    const segment = object(rawSegment, `segment[${index}]`);
    fields(segment, ['adapter', 'role', 'taskId', 'scope', 'baseSha', 'candidateSha', 'authorizedPaths', 'record', 'references', 'dependencies'], 'segment');
    if (!Object.hasOwn(adapters, String(segment.adapter))) throw new InputError(`Unsupported adapter ${segment.adapter}`);
    const adapter = adapters[segment.adapter as keyof typeof adapters];
    const start = sha(segment.baseSha, 'segment.baseSha'); const end = sha(segment.candidateSha, 'segment.candidateSha');
    if (start !== previous || !ancestor(root, start, end)) issues.push({ code: 'SEGMENT_LINEAGE_FAILED', path: `segments[${index}]`, message: 'Authorization chain gap or invalid ancestry' });
    previous = end;
    if (segment.role !== adapter.role || segment.taskId !== adapter.taskId || segment.scope !== adapter.scope) {
      issues.push({ code: 'ADAPTER_OWNER_SCOPE_MISMATCH', path: `segments[${index}]`, message: 'Adapter cannot expand role/task/scope authority' });
    }
    const authorized = array(segment.authorizedPaths, 'authorizedPaths').map(path => safePath(path, 'authorizedPath'));
    if (new Set(authorized).size !== authorized.length || !authorized.length) throw new InputError('Authorization must be unique nonempty literal paths');
    for (const path of authorized) if (!(adapter.paths as readonly string[]).includes(path)) issues.push({ code: 'AUTHORIZATION_EXCEEDS_ADAPTER', path, message: segment.adapter });
    const ref = parseReference(segment.record, 'record');
    if (ref.commit !== end) issues.push({ code: 'TASK_RECORD_STALE', path: ref.path, message: 'Record must come from segment candidate' });
    const recordBytes = readReference(root, ref, issues);
    if (recordBytes) {
      const record = json(recordBytes, 'task record');
      const expectedPath = segment.adapter === 'a-coverage-v1' ? 'artifacts/phase3-e08-b11-coverage-sync.json' : `docs/agents/manifests/tasks/${adapter.taskId}.json`;
      if (ref.path !== expectedPath || record.taskId !== adapter.taskId ||
          (segment.adapter !== 'a-coverage-v1' && (!String(record.owner).startsWith('Codex B') || record.baseCommit !== start)) ||
          (segment.adapter === 'a-coverage-v1' && record.controlEpoch !== epoch)) {
        issues.push({ code: 'TASK_RECORD_MISMATCH', path: ref.path, message: 'Documented adapter rejected task/owner/base/epoch' });
      }
    }
    const references = array(segment.references, 'references');
    if (!references.length) throw new InputError('Canonical file/section references required');
    for (const rawRef of references) {
      const canonical = parseReference(rawRef, 'canonical reference', true);
      readReference(root, canonical, issues);
      if (canonical.commit !== end) issues.push({ code: 'CANONICAL_REFERENCE_STALE', path: canonical.path, message: 'Reference must use segment candidate' });
      if (!['docs/rules/FD-Game-Rules-Final.md', 'docs/plans/2026-09-12-p3-b11-result-binding-production-bridge-design.md', ...adapter.paths].includes(canonical.path)) {
        issues.push({ code: 'CANONICAL_REFERENCE_OUTSIDE_SCOPE', path: canonical.path, message: segment.adapter });
      }
    }
    const dependencies = array(segment.dependencies, 'dependencies');
    if (!dependencies.length) throw new InputError('Explicit review dependency required; no implicit accepted state');
    if (!dependencies.some(dependency => dependency.taskId === adapter.taskId && dependency.candidateSha === end)) {
      issues.push({ code: 'REQUIRED_REVIEW_DEPENDENCY_MISSING', path: `segments[${index}]`, message: 'Exact segment review dependency must be declared' });
    }
    for (const dependency of dependencies) reviewDependency(root, dependency, epoch, issues);
    const changed = ancestor(root, start, end) ? changedPaths(root, start, end) : [];
    for (const path of changed) {
      covered.add(path);
      if (!authorized.includes(path)) issues.push({ code: 'UNAUTHORIZED_CHANGED_PATH', path, message: segment.adapter });
    }
    return { adapter: segment.adapter, role: segment.role, taskId: segment.taskId, testedBaseSha: start, testedCandidateSha: end, changedPaths: changed };
  });
  if (previous !== candidate) issues.push({ code: 'SEGMENT_CHAIN_INCOMPLETE', path: 'segments', message: 'Final segment must end at exact candidate' });
  const allChanges = ancestor(root, base, candidate) ? changedPaths(root, base, candidate) : [];
  for (const path of allChanges) if (!covered.has(path)) issues.push({ code: 'UNCOVERED_CHANGED_PATH', path, message: 'Not covered by any authorization segment' });
  const checks = array(input.checks, 'checks');
  if (!checks.length) throw new InputError('Declared checks required');
  for (const rawCheck of checks) {
    const check = object(rawCheck, 'check');
    fields(check, ['id', 'command', 'state', 'testedSha', 'evidence'], 'check');
    string(check.id, 'check.id'); string(check.command, 'check.command'); sha(check.testedSha, 'check.testedSha');
    if (check.testedSha !== candidate) issues.push({ code: 'CHECK_SHA_STALE', path: check.id, message: 'Check is not bound to tested candidate' });
    if (check.state === 'PENDING') { issues.push({ code: 'CHECK_PENDING', path: check.id, message: check.command }); continue; }
    if (check.state !== 'EXECUTED') throw new InputError('Unsupported check state');
    const ref = parseReference(check.evidence, 'check evidence');
    const bytes = readReference(root, ref, issues);
    if (bytes) {
      const evidence = json(bytes, 'check evidence');
      if (evidence.schemaVersion !== 'fd-p3-execution-check-v1' || evidence.testedSha !== candidate || evidence.command !== check.command ||
          evidence.exitCode !== 0 || !String(evidence.producer).trim()) issues.push({ code: 'CHECK_EVIDENCE_MISMATCH', path: ref.path, message: check.id });
      if (!ancestor(root, candidate, ref.commit)) issues.push({ code: 'CHECK_PRODUCER_LINEAGE_FAILED', path: ref.path, message: ref.commit });
    }
  }
  const dirty = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).toString('utf8').split('\0').filter(Boolean);
  return { schemaVersion: 'fd-p3-preflight-result-v1', taskId, controlEpoch: epoch, status: issues.length ? 'FAIL' : 'PASS',
    inputs: { testedCandidateSha: candidate, testedBaseSha: base, inputSha256, contract },
    executionMethod: 'EXACT_COMMIT_GIT_BLOBS_AND_FULL_NAME_STATUS_DIFF', segments: inspectedSegments, changedPaths: allChanges,
    worktree: { dirty: dirty.length > 0, statusEntries: dirty, inspectedWorkingTree: false, claim: 'COMMIT_BASED_ONLY' },
    issues, acceptanceGranted: false, reviewReadyChanged: false, promotionPolicyChanged: false };
}

export function runPreflightCli(argv: string[], root = resolve('.')): void {
  const args = parseArgs(argv, ['--manifest', '--candidate', '--base', '--out'], ['--manifest', '--candidate', '--base']);
  const input = inputFile(args['--manifest']);
  const result = runPreflight(root, input.value, args['--candidate'], args['--base'], input.sha256);
  output(result, args['--out']); process.exitCode = result.status === 'PASS' ? 0 : 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runPreflightCli(process.argv.slice(2)); } catch (error) { cliError(error); }
}
