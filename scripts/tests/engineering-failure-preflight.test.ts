import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { preflight, rankCases, runCli, validateTask, type KnowledgeReference } from '../engineering/historical-failure-preflight';

const roots: string[] = [];
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const task = (base: string) => ({ taskId: 'SYNTHETIC_UNIT_ONLY', capabilityFamily: 'MATCH', semanticContracts: ['MATCH'],
  expectedChangedFiles: ['src/a.ts'], runtimeDomains: ['domain'], exactBaseSha: base,
  selectedIdentities: ['synthetic.identity'], reservationReference: 'docs/reservation.json' });
function fixture(settings: { count?: number; badSourceHash?: boolean; missingSource?: boolean; badVerdict?: boolean } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fd-k02-unit-')); roots.push(root);
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root }).toString().trim();
  const put = (path: string, value: string) => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), value); };
  const commit = () => { git('add', '.'); git('commit', '-qm', 'synthetic evidence only'); return git('rev-parse', 'HEAD'); };
  git('init', '-q'); git('config', 'user.name', 'Synthetic'); git('config', 'user.email', 'synthetic@example.invalid');
  git('config', 'core.autocrlf', 'false');
  put('.gitignore', '.cache/\n');
  put('source.json', '{"scope":"SYNTHETIC_ONLY"}'); put('src/a.ts', 'export const n = 1;'); put('tests/a.test.ts', '// synthetic test path, not a historical regression');
  const source = commit();
  const doc = '# Case\n## Prevention\n- Required invariant: atomic rejection.\n- Forbidden pattern: silent fallback.\n- Required negative test: corrupt input.\n- Relevant command: `DO_NOT_EXECUTE_SYNTHETIC`\n';
  put('docs/case.md', doc);
  const entry = { id: 'SYNTHETIC-001', path: 'docs/case.md', state: 'SOURCE_VERIFIED_DRAFT', risk: 'HIGH',
    files: ['src/a.ts'], contracts: ['MATCH'], domains: ['domain'], source: { commit: settings.missingSource ? 'f'.repeat(40) : source,
      path: 'source.json', sha256: settings.badSourceHash ? '0'.repeat(64) : hash('{"scope":"SYNTHETIC_ONLY"}') },
    tests: ['tests/a.test.ts', 'tests/missing.test.ts'], testStatusAt: source, testStatus: 'MISSING_ENFORCING_NEGATIVE_NOT_MISSING_ALL_TEST_FILES', currentMainTestCoverage: 'NOT_VERIFIED' };
  const entries = Array.from({ length: settings.count ?? 1 }, (_, i) => ({ ...entry, id: `SYNTHETIC-${String(i + 1).padStart(3, '0')}`, risk: 'CRITICAL' }));
  const catalog = { schemaVersion: 'fd-engineering-failure-catalog-v1', entries, candidateTriage: [{ id: 'UNKNOWN-002', decision: 'NOT_ADDED_UNKNOWN' }] };
  const bytes = JSON.stringify(catalog);
  put('docs/catalog.json', bytes);
  const audit = { catalogSha256: hash(bytes), entries: entries.map(row => ({ id: row.id, source: row.source })), lessonDocumentDigests: [{ path: entry.path, sha256: hash(doc) }] };
  put('docs/audit.json', JSON.stringify(audit));
  const candidate = commit();
  const review = { taskId: 'P3-EFP-K01', controlEpoch: 'FD-P3-2026-09-23-09', candidateSha: candidate, reviewedSha: candidate, finalVerdict: 'PASS', reviewer: 'Synthetic Reviewer',
    acceptedScope: 'EXACT_K01_HISTORICAL_SOURCE_EXTRACTION_PROVENANCE_AND_REGRESSION_GAP_DOCUMENTATION_ONLY',
    boundAudit: { path: 'docs/audit.json', sha256: hash(JSON.stringify(audit)) },
    caseVerdicts: entries.map(row => ({ id: row.id, verdict: settings.badVerdict ? 'UNKNOWN' : 'PASS_SCOPED_EXTRACTION' })) };
  put('docs/review.json', JSON.stringify(review)); const base = commit();
  const reference: KnowledgeReference = { commit: base, candidate, path: 'docs/review.json', sha256: hash(JSON.stringify(review)), synthetic: true };
  return { root, git, put, commit, entry, catalog, base, reference, invoke: (input = task(base)) => preflight(input, { root, catalogPath: 'docs/catalog.json', reference, cachePath: '.cache/historical-failure-preflight/unit.json' }) };
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('standalone historical preflight (synthetic integrity fixtures only)', () => {
  it('validates required metadata and rejects unknown fields and unsafe paths', () => {
    expect(() => validateTask({ ...task('a'.repeat(40)), runtimeDomains: [] })).toThrow();
    expect(() => validateTask({ ...task('a'.repeat(40)), waiver: true })).toThrow();
    for (const path of ['../a', '/a', 'C:\\a', 'src/../a', '.git/config']) {
      expect(() => validateTask({ ...task('a'.repeat(40)), expectedChangedFiles: [path] })).toThrow();
    }
  });
  it('scores exact matches, normalizes separators and breaks ties by risk then ID', () => {
    const input = validateTask({ ...task('a'.repeat(40)), expectedChangedFiles: ['src\\a.ts'] });
    const shape = { path: 'docs/a.md', files: ['src/a.ts'], contracts: ['MATCH'], domains: ['domain'] };
    const ranked = rankCases([{ ...shape, id: 'B', risk: 'HIGH' }, { ...shape, id: 'C', risk: 'CRITICAL' }, { ...shape, id: 'A', risk: 'HIGH' }], input);
    expect(ranked.map((row) => row.id)).toEqual(['C', 'A', 'B']);
    expect(ranked[0]!.score).toBe(19);
  });
  it('retains overflow and critical visibility while enforcing max five', () => {
    const f = fixture({ count: 7 }); const result = f.invoke();
    expect(result.selected.length).toBe(3); expect(result.overflow.length).toBe(4);
    expect(result.criticalOverflow).toHaveLength(4); expect(result.scopeSplittingAlert).toBe(true);
    expect(preflight(task(f.base), { root: f.root, catalogPath: 'docs/catalog.json', reference: f.reference, limit: 6 }).status).toBe('INPUT_INCOMPLETE');
  });
  it('supports exactly five results without hiding two remaining critical matches', () => {
    const f = fixture({ count: 7 });
    const result = preflight(task(f.base), { root: f.root, catalogPath: 'docs/catalog.json', reference: f.reference, limit: 5 });
    expect(result.selected).toHaveLength(5); expect(result.overflow).toHaveLength(2); expect(result.criticalOverflow).toHaveLength(2);
  });
  it('returns verified extraction but not execution, retaining MISSING and UNKNOWN', () => {
    const f = fixture(); const result = f.invoke();
    expect(result.status).toBe('CHECKED'); expect(result.synthetic).toBe(true);
    expect(result.selected[0]!.knowledgeState).toBe('ACCEPTED_EXTRACTION_ONLY');
    expect(result.selected[0]!.currentBaseCoverage).toBe('NOT_VERIFIED');
    expect(result.selected[0]!.regressions.map((r) => r.currentBase.presence)).toEqual(['PRESENT_STATIC_ONLY', 'MISSING']);
    expect(result.selected[0]!.historicalTestStatus).toContain('MISSING_ENFORCING');
    expect(result.unknown.length).toBe(1); expect(result.acceptanceGranted).toBe(false);
  });
  it('no-match is UNKNOWN risk, not LOW or proof of absence', () => {
    const f = fixture(); const result = f.invoke({ ...task(f.base), expectedChangedFiles: ['unrelated.ts'], semanticContracts: ['OTHER'], runtimeDomains: ['OTHER'], capabilityFamily: 'OTHER' });
    expect(result.status).toBe('NO_MATCH'); expect(result.historicalRisk).toBe('UNKNOWN');
  });
  it('missing historical source is a controlled error', () => {
    const f = fixture(); f.git('update-ref', '-d', 'refs/heads/does-not-exist');
    const result = preflight(task(f.base), { root: f.root, catalogPath: 'docs/catalog.json', reference: { ...f.reference, commit: 'f'.repeat(40) } });
    expect(result.status).toBe('SOURCE_UNAVAILABLE');
  });
  it('rejects catalog drift and source hash tampering without caching success', () => {
    const f = fixture(); f.put('docs/catalog.json', JSON.stringify({ ...f.catalog, entries: [{ ...f.entry, source: { ...f.entry.source, sha256: '0'.repeat(64) } }] }));
    expect(f.invoke().status).toBe('EVIDENCE_INVALID');
  });
  it('rejects exact review mismatch', () => {
    const f = fixture(); const result = preflight(task(f.base), { root: f.root, catalogPath: 'docs/catalog.json', reference: { ...f.reference, candidate: 'e'.repeat(40) } });
    expect(result.status).toBe('EVIDENCE_INVALID');
  });
  it('reuses the stable cache within a task', () => {
    const f = fixture(); expect(f.invoke().cacheHit).toBe(false); expect(f.invoke().cacheHit).toBe(true);
  });
  it('does not invalidate cache for ordinary report commits', () => {
    const f = fixture();
    const input = { ...task(f.base), expectedChangedFiles: ['src/a.ts', 'docs/reports/report.md'] };
    expect(f.invoke(input).cacheHit).toBe(false);
    f.put('docs/reports/report.md', 'ordinary report'); const reportBase = f.commit();
    const reportResult = f.invoke({ ...input, exactBaseSha: reportBase });
    expect(reportResult.cacheHit).toBe(true); expect(reportResult.exactBaseSha).toBe(reportBase);
  });
  it('invalidates cache for relevant source commits', () => {
    const f = fixture(); expect(f.invoke().cacheHit).toBe(false);
    f.put('src/a.ts', 'export const n = 2;'); const sourceBase = f.commit();
    expect(f.invoke(task(sourceBase)).cacheHit).toBe(false);
  });
  it('invalidates cache when scope changes', () => {
    const f = fixture(); expect(f.invoke().cacheHit).toBe(false);
    expect(f.invoke({ ...task(f.base), semanticContracts: ['MATCH', 'NEW'] }).cacheHit).toBe(false);
  });
  it('invalidates cache for dirty relevant source without pretending the base commit moved', () => {
    const f = fixture(); expect(f.invoke().cacheHit).toBe(false);
    f.put('src/a.ts', 'export const n = 99;');
    const result = f.invoke(); expect(result.cacheHit).toBe(false); expect(result.exactBaseSha).toBe(f.base);
  });
  it('fails closed on an audit-bound incorrect source hash', () => {
    const f = fixture({ badSourceHash: true }); expect(f.invoke().status).toBe('EVIDENCE_INVALID');
  });
  it('fails closed on an audit-bound unavailable source', () => {
    const f = fixture({ missingSource: true }); expect(f.invoke().status).toBe('SOURCE_UNAVAILABLE');
  });
  it('rejects an external review that did not accept the selected case', () => {
    const f = fixture({ badVerdict: true }); expect(f.invoke().status).toBe('EVIDENCE_INVALID');
  });
  it('rejects malformed JSON and does not import runtime or execute regression commands', () => {
    const f = fixture(); const before = f.git('status', '--porcelain'); const result = f.invoke();
    expect(result.selected[0]!.commands).toContain('DO_NOT_EXECUTE_SYNTHETIC');
    expect(f.git('status', '--porcelain')).toBe(before);
    f.put('docs/catalog.json', '{broken'); expect(f.invoke().status).toBe('EVIDENCE_INVALID');
  });
  it('records changed case knowledge as invalid instead of returning a cached success', () => {
    const f = fixture(); f.invoke(); f.put('docs/case.md', 'tampered lesson');
    expect(f.invoke().status).toBe('EVIDENCE_INVALID');
  });
  it('rejects malformed or modified cached payloads', () => {
    const f = fixture(); f.invoke(); const path = '.cache/historical-failure-preflight/unit.json';
    const cached = JSON.parse(readFileSync(join(f.root, path), 'utf8')); cached.payload.selected = [];
    f.put(path, JSON.stringify(cached)); expect(f.invoke().cacheHit).toBe(false);
  });
  it('CLI rejects aliases, duplicate flags, missing values and absent task input', () => {
    for (const args of [['--waiver', 'true'], ['--task'], [], ['--task', 'a', '--task', 'b']]) {
      expect(runCli(args)).toBe(1);
    }
  });
  it('rejects malformed nested task metadata instead of throwing a raw TypeError', () => {
    const f = fixture(); const result = preflight({ ...task(f.base), semanticContracts: [null] }, { root: f.root });
    expect(result.status).toBe('INPUT_INCOMPLETE'); expect(result.selected).toHaveLength(0);
  });
});
