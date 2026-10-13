import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

type ObjectValue = Record<string, unknown>;
const SCOPE = 'EXACT_K01_HISTORICAL_SOURCE_EXTRACTION_PROVENANCE_AND_REGRESSION_GAP_DOCUMENTATION_ONLY';
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const encode = (value: unknown) => JSON.stringify(value);
export interface KnowledgeReference { commit: string; candidate: string; path: string; sha256: string; synthetic?: boolean }
export const K01_REVIEW: KnowledgeReference = {
  commit: '2470f00902bd650bc3122f518b18333afed323f3', candidate: 'ccbdf647a545e08f09a8067c8f2c4659f849889a',
  path: 'docs/reviews/phase3/P3-EFP-K01-ccbdf647-reviewer-a.json',
  sha256: 'da0f45fded94f1dc941a3a6b7a91da586d2de36b0188ec8f3662fcbaf9b98687',
};
export interface Task {
  taskId: string; capabilityFamily: string; semanticContracts: string[]; expectedChangedFiles: string[];
  runtimeDomains: string[]; exactBaseSha: string; selectedIdentities: string[]; reservationReference: string;
}
class ControlledError extends Error {
  constructor(readonly status: string, message: string) { super(message); }
}
function demand(condition: unknown, message: string, status = 'EVIDENCE_INVALID'): asserts condition {
  if (!condition) throw new ControlledError(status, message);
}
function object(value: unknown): ObjectValue {
  demand(value !== null && typeof value === 'object' && !Array.isArray(value), 'object required');
  return value as ObjectValue;
}
function string(value: unknown): string { demand(typeof value === 'string' && value.trim().length > 0, 'nonempty string required'); return value; }
function list(value: unknown): unknown[] { demand(Array.isArray(value), 'array required'); return value; }
function strings(value: unknown): string[] { return list(value).map(string); }
function sha(value: unknown): string { const result = string(value); demand(/^[0-9a-f]{40}$/.test(result), 'exact SHA required'); return result; }
function hash(value: unknown): string { const result = string(value).toLowerCase(); demand(/^[0-9a-f]{64}$/.test(result), 'SHA-256 required'); return result; }
export function safePath(value: unknown): string {
  const path = string(value).replace(/\\/g, '/');
  demand(!path.startsWith('/') && !path.includes(':') && !/[\x00-\x1f]/.test(path), 'unsafe repository-relative path');
  demand(path.split('/').every((part) => part !== '' && part !== '.' && part !== '..' && part.toLowerCase() !== '.git'), 'unsafe path segment');
  return path;
}
function safeLocal(root: string, path: string): string {
  const normalized = safePath(path);
  let current = root;
  for (const part of normalized.split('/')) {
    current = resolve(current, part);
    try { demand(!lstatSync(current).isSymbolicLink(), 'symlink input/output rejected'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  return current;
}
export function validateTask(value: unknown): Task {
  try {
    const raw = object(value);
    const fields = ['taskId', 'capabilityFamily', 'semanticContracts', 'expectedChangedFiles', 'runtimeDomains', 'exactBaseSha', 'selectedIdentities', 'reservationReference'];
    demand(Object.keys(raw).length === fields.length && fields.every((key) => Object.hasOwn(raw, key)), 'missing/unknown task metadata');
    const array = (key: string) => { const result = strings(raw[key]); demand(result.length > 0, `empty ${key}`); return [...new Set(result)].sort(); };
    return { taskId: string(raw.taskId), capabilityFamily: string(raw.capabilityFamily), semanticContracts: array('semanticContracts'),
      expectedChangedFiles: array('expectedChangedFiles').map(safePath).sort(), runtimeDomains: array('runtimeDomains'),
      exactBaseSha: sha(raw.exactBaseSha), selectedIdentities: array('selectedIdentities'), reservationReference: safePath(raw.reservationReference) };
  } catch (error) { throw new ControlledError('INPUT_INCOMPLETE', error instanceof Error ? error.message : 'malformed task'); }
}
const riskOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
interface Match { id: string; score: number; risk: string; reasons: string[] }
export function rankCases(entries: unknown[], task: Task): Match[] {
  return entries.map((value) => {
    const entry = object(value), id = string(entry.id), risk = string(entry.risk);
    demand(Object.hasOwn(riskOrder, risk), 'unknown risk');
    const files = strings(entry.files).map(safePath), contracts = strings(entry.contracts), domains = strings(entry.domains);
    let score = 0; const reasons: string[] = [];
    for (const file of files) if (task.expectedChangedFiles.includes(file)) { score += 8; reasons.push(`file:${file}:+8`); }
    for (const contract of contracts) if (task.semanticContracts.includes(contract)) { score += 6; reasons.push(`contract:${contract}:+6`); }
    for (const domain of domains) if (task.runtimeDomains.includes(domain)) { score += 3; reasons.push(`domain:${domain}:+3`); }
    if (contracts.includes(task.capabilityFamily)) { score += 2; reasons.push(`family:${task.capabilityFamily}:+2`); }
    return { id, score, risk, reasons };
  }).filter((match) => match.score > 0).sort((a, b) => b.score - a.score || riskOrder[a.risk]! - riskOrder[b.risk]! || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
interface Presence { path: string; presence: 'PRESENT_STATIC_ONLY' | 'MISSING'; blob: string | null }
interface Selected extends Match {
  knowledgeState: string; catalogState: string; invariants: string[]; forbiddenPatterns: string[];
  commands: string[]; negativeObligations: string[]; historicalTestStatus: string; currentBaseCoverage: string;
  regressions: { path: string; pinnedSha: string; pinned: Presence; currentBase: Presence; role: string }[];
  source: ObjectValue; sourceRelationship: string; constraintsState: string;
}
interface Result {
  status: string; automationAvailable: boolean; acceptanceGranted: false; runtimeTestsExecuted: 0;
  taskId: string | null; exactBaseSha: string | null; selected: Selected[]; overflow: Match[];
  unknown: unknown[]; historicalRisk: string; cacheHit: boolean; elapsedMs: number; synthetic: boolean;
  [key: string]: unknown;
}
interface Options { root: string; catalogPath?: string; reference?: KnowledgeReference; limit?: number; cachePath?: string }
function sections(doc: string) {
  const values = (prefix: string) => [...doc.matchAll(new RegExp(`^- ${prefix}: (.+)$`, 'gm'))].map((match) => match[1]!);
  const block = doc.match(/^## Invariants And Negative Obligations\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1]?.trim();
  const invariants = values('Required invariant'), forbiddenPatterns = values('Forbidden pattern');
  const negativeObligations = values('Required negative test');
  // Preserve the reviewed prose when it was not written as labelled bullets; do not invent a machine policy.
  if (block) { invariants.push(block); forbiddenPatterns.push(`REVIEWED_PROSE_CONSTRAINT: ${block}`); negativeObligations.push(block); }
  const commands = [...doc.matchAll(/`(npx vitest run [^`]+|node [^`]+|DO_NOT_EXECUTE_SYNTHETIC)`/g)].map((match) => match[1]!);
  return { invariants, forbiddenPatterns, negativeObligations, commands,
    constraintsState: invariants.length && forbiddenPatterns.length ? 'PINNED_DOCUMENT_CONSTRAINTS' : 'NOT_VERIFIED' };
}

export function preflight(input: unknown, options: Options): Result {
  const started = performance.now();
  let task: Task | null = null;
  const result: Result = { status: 'INPUT_INCOMPLETE', automationAvailable: true, acceptanceGranted: false, runtimeTestsExecuted: 0,
    taskId: null, exactBaseSha: null, selected: [], overflow: [], unknown: [], historicalRisk: 'UNKNOWN', cacheHit: false,
    elapsedMs: 0, synthetic: options.reference?.synthetic === true };
  try {
    task = validateTask(input); result.taskId = task.taskId; result.exactBaseSha = task.exactBaseSha;
    const limit = options.limit ?? 3;
    demand(Number.isInteger(limit) && limit >= 3 && limit <= 5, 'limit must be 3..5', 'INPUT_INCOMPLETE');
    const root = resolve(options.root), reference = options.reference ?? K01_REVIEW;
    demand(!options.reference || reference.synthetic === true, 'custom review references only allowed for synthetic API unit fixtures');
    const git = (...args: string[]) => {
      try { return execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch { throw new ControlledError('SOURCE_UNAVAILABLE', `git source unavailable: ${args.join(' ')}`); }
    };
    const sourceCache = new Map<string, Buffer>();
    const source = (commit: string, path: string) => {
      sha(commit); safePath(path); const key = `${commit}:${path}`;
      if (!sourceCache.has(key)) sourceCache.set(key, git('show', key));
      return sourceCache.get(key)!;
    };
    const parse = (bytes: Buffer) => { try { return object(JSON.parse(bytes.toString('utf8'))); } catch { throw new ControlledError('EVIDENCE_INVALID', 'malformed evidence JSON'); } };
    const knownCommits = new Set<string>(), presenceCache = new Map<string, Presence>();
    const presence = (commit: string, path: string): Presence => {
      sha(commit); path = safePath(path); const key = `${commit}:${path}`;
      if (presenceCache.has(key)) return presenceCache.get(key)!;
      if (!knownCommits.has(commit)) { git('cat-file', '-e', `${commit}^{commit}`); knownCommits.add(commit); }
      const files = git('ls-tree', '-r', '--name-only', commit, '--', path).toString('utf8').trim().split('\n');
      const result: Presence = { path, presence: files.includes(path) ? 'PRESENT_STATIC_ONLY' : 'MISSING',
        blob: files.includes(path) ? git('rev-parse', `${commit}:${path}`).toString().trim() : null };
      presenceCache.set(key, result); return result;
    };
    git('cat-file', '-e', `${task.exactBaseSha}^{commit}`);
    const reviewBytes = source(reference.commit, reference.path);
    demand(digest(reviewBytes) === hash(reference.sha256), 'external K01 review hash mismatch');
    const review = parse(reviewBytes);
    demand(review.taskId === 'P3-EFP-K01' && review.candidateSha === reference.candidate && review.reviewedSha === reference.candidate &&
      review.finalVerdict === 'PASS' && review.acceptedScope === SCOPE && string(review.reviewer).trim().length > 0 &&
      review.controlEpoch === 'FD-P3-2026-09-23-09', 'external K01 exact review mismatch');
    demand(git('show', '-s', '--format=%P', reference.commit).toString().trim() === reference.candidate, 'K01 review direct parent mismatch');
    const auditRef = object(review.boundAudit), auditBytes = source(reference.candidate, safePath(auditRef.path));
    demand(digest(auditBytes) === hash(auditRef.sha256), 'K01 audit hash mismatch');
    const audit = parse(auditBytes);
    const catalogPath = safePath(options.catalogPath ?? 'docs/engineering/lessons/catalog.json');
    let catalogBytes: Buffer;
    try { catalogBytes = readFileSync(safeLocal(root, catalogPath)); } catch { throw new ControlledError('SOURCE_UNAVAILABLE', 'catalog unavailable'); }
    demand(digest(catalogBytes) === hash(audit.catalogSha256), 'catalog not bound by accepted K01 audit');
    const catalog = parse(catalogBytes);
    demand(catalog.schemaVersion === 'fd-engineering-failure-catalog-v1', 'unsupported catalog schema');
    const entries = list(catalog.entries).map(object), ids = entries.map((entry) => string(entry.id));
    demand(new Set(ids).size === ids.length, 'duplicate case identity');
    const verdicts = list(review.caseVerdicts).map(object);
    demand(verdicts.length === ids.length && new Set(verdicts.map((entry) => entry.id)).size === ids.length &&
      entries.every((entry) => verdicts.some((row) => row.id === entry.id && row.verdict === 'PASS_SCOPED_EXTRACTION')), 'K01 case review scope mismatch');
    const docBindings = list(audit.lessonDocumentDigests).map(object), docs = new Map<string, string>();
    const knowledgeParts: unknown[] = [digest(reviewBytes), digest(auditBytes), digest(catalogBytes)];
    for (const entry of entries) {
      const path = safePath(entry.path), binding = docBindings.find((row) => row.path === path);
      demand(binding, `case document unbound: ${path}`);
      let bytes: Buffer;
      try { bytes = readFileSync(safeLocal(root, path)); } catch { throw new ControlledError('SOURCE_UNAVAILABLE', `case document unavailable: ${path}`); }
      demand(digest(bytes) === hash(binding.sha256), `case document hash drift: ${path}`);
      docs.set(string(entry.id), bytes.toString('utf8')); knowledgeParts.push({ path, digest: digest(bytes) });
    }
    const reportOutput = (path: string) => path.startsWith('docs/reports/') || path.startsWith('artifacts/') ||
      ['docs/engineering/lessons/K02-HANDOFF.md', 'docs/engineering/lessons/K02-EXECUTION.json'].includes(path);
    // Output reports are not source inputs. A matched case explicitly naming one adds it back below.
    const ranked = rankCases(entries, task), bindings: unknown[] = [], relevantPaths = new Set(task.expectedChangedFiles.filter((path) => !reportOutput(path)));
    const auditEntries = list(audit.entries).map(object);
    const selected: Selected[] = [];
    // Verify overflow sources too; an omitted critical failure must not become a silent successful lookup.
    for (const match of ranked) {
      const entry = entries.find((row) => row.id === match.id)!, ref = object(entry.source);
      const accepted = auditEntries.find((row) => row.id === match.id);
      demand(accepted, 'source audit case missing');
      const acceptedSource = object(accepted.source);
      const commit = sha(ref.commit), path = safePath(ref.path), expectedHash = hash(ref.sha256);
      demand(acceptedSource.commit === commit && acceptedSource.path === path && hash(acceptedSource.sha256) === expectedHash, 'case source identity mismatch');
      const bytes = source(commit, path);
      demand(digest(bytes) === expectedHash, `source hash drift: ${match.id}`);
      const sourceBinding = { commit, path, sha256: expectedHash, availability: 'VERIFIED_PINNED_BYTES',
        sourceReviewRelationship: typeof entry.sourceReviewRelationship === 'string' ? entry.sourceReviewRelationship : 'HISTORICAL_REVIEW_ONLY_NO_CURRENT_ACCEPTANCE' };
      bindings.push(sourceBinding);
      for (const file of strings(entry.files)) relevantPaths.add(safePath(file));
      const regressions = strings(entry.tests).map((path) => {
        path = safePath(path); relevantPaths.add(path);
        const pinnedSha = sha(entry.testStatusAt), pinned = presence(pinnedSha, path), currentBase = presence(task!.exactBaseSha, path);
        return { path, pinnedSha, pinned, currentBase, role: path.startsWith('docs/reviews/probes/') ? 'REVIEWER_PROBE_NOT_ENFORCING_REGRESSION' : 'STATIC_FILE_NOT_SEMANTIC_EXECUTION_PROOF' };
      });
      bindings.push(regressions.map((regression) => ({ pinnedSha: regression.pinnedSha, pinned: regression.pinned })));
      selected.push({ ...match, catalogState: string(entry.state), knowledgeState: 'ACCEPTED_EXTRACTION_ONLY', ...sections(docs.get(match.id)!),
        source: sourceBinding, sourceRelationship: sourceBinding.sourceReviewRelationship, historicalTestStatus: string(entry.testStatus),
        currentBaseCoverage: 'NOT_VERIFIED', regressions });
    }
    const relevantSourceObjects = [...relevantPaths].sort().map((path) => presence(task!.exactBaseSha, path));
    const workingTreeRelevantObjects = [...relevantPaths].sort().map((path) => {
      const file = safeLocal(root, path);
      if (!existsSync(file)) return { path, presence: 'MISSING', sha256: null };
      demand(lstatSync(file).isFile(), `relevant source must be a regular file: ${path}`);
      return { path, presence: 'PRESENT_STATIC_ONLY', sha256: digest(readFileSync(file)) };
    });
    const { exactBaseSha: _ignored, ...stableTask } = task;
    const inputDigest = digest(encode(stableTask)), knowledgeDigest = digest(encode(knowledgeParts));
    const sourceDigest = digest(encode({ bindings, relevantSourceObjects, workingTreeRelevantObjects }));
    const engineDigest = digest(readFileSync(fileURLToPath(import.meta.url)));
    const cacheKey = digest(encode({ inputDigest, knowledgeDigest, sourceDigest, engineDigest, limit }));
    result.overflow = ranked.slice(limit); result.selected = selected.slice(0, limit);
    result.unknown = list(catalog.candidateTriage ?? []).filter((row) => String(object(row).decision).includes('UNKNOWN'));
    result.status = ranked.length ? 'CHECKED' : 'NO_MATCH';
    result.historicalRisk = ranked.length ? [...ranked].sort((a, b) => riskOrder[a.risk]! - riskOrder[b.risk]!)[0]!.risk : 'UNKNOWN';
    const payload = { selected: result.selected, overflow: result.overflow, unknown: result.unknown, historicalRisk: result.historicalRisk, status: result.status };
    const cachePath = options.cachePath;
    if (cachePath) {
      const normalized = safePath(cachePath);
      demand(normalized.startsWith('.cache/historical-failure-preflight/') && normalized.endsWith('.json'), 'unsafe cache destination', 'INPUT_INCOMPLETE');
      const file = safeLocal(root, normalized), expectedPayload = encode(payload);
      if (existsSync(file)) {
        try {
          const cached = JSON.parse(readFileSync(file, 'utf8'));
          // Cache is never an evidence authority: revalidated bytes and derived output must agree.
          if (cached.key === cacheKey && cached.payloadDigest === digest(expectedPayload) && encode(cached.payload) === expectedPayload) {
            Object.assign(result, cached.payload); result.cacheHit = true;
          }
        } catch { /* A damaged cache is recomputed, not accepted as evidence. */ }
      }
      if (!result.cacheHit) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, `${encode({ key: cacheKey, payloadDigest: digest(expectedPayload), payload })}\n`); }
    }
    Object.assign(result, { inputDigest, knowledgeDigest, sourceDigest, engineDigest, cacheKey, relevantSourceObjects, workingTreeRelevantObjects,
      reportOnlyTaskOutputs: task.expectedChangedFiles.filter(reportOutput),
      knowledgeReview: { ...reference, acceptedScope: SCOPE, currentBaseExecutionAccepted: false },
      controlEpoch: review.controlEpoch,
      criticalOverflow: result.overflow.filter((row) => row.risk === 'CRITICAL'), scopeSplittingAlert: result.overflow.length > 0,
      missingCoverage: result.selected.map((row) => ({ id: row.id, historical: row.historicalTestStatus, currentBase: row.currentBaseCoverage,
        missingPaths: row.regressions.filter((regression) => regression.currentBase.presence === 'MISSING').map((regression) => regression.path) })),
      sourceAvailability: ranked.length ? 'VERIFIED_PINNED_BYTES' : 'NO_MATCHED_SOURCES', execution: 'NO_REGRESSIONS_OR_RUNTIME_EXECUTED', creditDelta: 0 });
  } catch (error) {
    result.status = error instanceof ControlledError ? error.status : 'EVIDENCE_INVALID';
    result.selected = []; result.cacheHit = false; result.error = error instanceof Error ? error.message : 'unknown controlled failure';
  }
  result.elapsedMs = Math.round((performance.now() - started) * 100) / 100;
  return result;
}

export function runCli(argv: string[], root = resolve('.')): number {
  let outputPath: string | undefined;
  try {
    const args: Record<string, string> = {};
    for (let i = 0; i < argv.length; i += 2) {
      const key = argv[i]!;
      demand(['--task', '--catalog', '--out', '--cache', '--limit'].includes(key) && !Object.hasOwn(args, key) && Boolean(argv[i + 1]) && !argv[i + 1]!.startsWith('--'), 'unknown/duplicate/missing CLI argument', 'INPUT_INCOMPLETE');
      args[key] = argv[i + 1]!;
    }
    demand(args['--task'], '--task required', 'INPUT_INCOMPLETE');
    if (args['--out']) {
      outputPath = safePath(args['--out']);
      demand(outputPath.startsWith('artifacts/') && outputPath.endsWith('.json'), 'output must be an artifacts JSON receipt', 'INPUT_INCOMPLETE');
      // Do not overwrite an existing tracked artifact; historical evidence is immutable.
      let tracked = true;
      try { execFileSync('git', ['ls-files', '--error-unmatch', outputPath], { cwd: root, stdio: 'pipe' }); } catch { tracked = false; }
      demand(!tracked, 'tracked output refused', 'INPUT_INCOMPLETE');
    }
    let input: unknown;
    try { input = JSON.parse(readFileSync(safeLocal(root, safePath(args['--task'])), 'utf8')); }
    catch { throw new ControlledError('INPUT_INCOMPLETE', 'task file missing/malformed'); }
    const result = preflight(input, { root, catalogPath: args['--catalog'],
      limit: args['--limit'] === undefined ? 3 : Number(args['--limit']), cachePath: args['--cache'] ?? '.cache/historical-failure-preflight/default.json' });
    const bytes = `${JSON.stringify(result, null, 2)}\n`;
    if (outputPath) { const file = safeLocal(root, outputPath); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, bytes); }
    process.stdout.write(bytes);
    return ['CHECKED', 'NO_MATCH'].includes(result.status) ? 0 : 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: error instanceof ControlledError ? error.status : 'EVIDENCE_INVALID',
      error: error instanceof Error ? error.message : 'unknown failure', automationAvailable: true, acceptanceGranted: false, creditDelta: 0 })}\n`);
    return 1;
  }
}
if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
