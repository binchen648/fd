import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname } from 'node:path';

const [inputPath, outputPath, mainSha] = process.argv.slice(2);
if (!inputPath || !outputPath || !/^[a-f0-9]{40}$/.test(mainSha ?? '')) {
  throw new Error('Usage: node scripts/phase3-colleague-review-inventory.mjs INPUT OUTPUT EXACT_MAIN_SHA');
}
const rows = JSON.parse(readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, ''));
if (!Array.isArray(rows) || rows.length === 0) throw new Error('Empty or invalid inventory');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim();
const exists = (sha) => /^[a-f0-9]{40}$/.test(sha ?? '')
  && spawnSync('git', ['cat-file', '-e', `${sha}^{commit}`], { stdio: 'ignore' }).status === 0;
const ancestor = (a, b) => spawnSync('git', ['merge-base', '--is-ancestor', a, b], { stdio: 'ignore' }).status === 0;
if (!exists(mainSha)) throw new Error('Main object unavailable');
const seen = new Set();
const inventory = [];
for (const row of [...rows].sort((a, b) => a.number - b.number)) {
  if (!Number.isInteger(row.number) || seen.has(row.number)) throw new Error('Invalid/duplicate PR number');
  seen.add(row.number);
  if (row.author?.login !== 'fengling20011118-dotcom') throw new Error('Unexpected contributor');
  if (!/^[a-f0-9]{40}$/.test(row.headRefOid ?? '') || !/^[a-f0-9]{40}$/.test(row.baseRefOid ?? '')) {
    throw new Error(`Missing exact binding for PR ${row.number}`);
  }
  const headAvailable = exists(row.headRefOid);
  const baseAvailable = exists(row.baseRefOid);
  let files = [];
  if (headAvailable && baseAvailable) {
    files = git('diff', '--name-only', row.baseRefOid, row.headRefOid).split(/\r?\n/).filter(Boolean);
  }
  const areas = [...new Set(files.map((path) => {
    if (/^(packages\/rules\/src|apps\/(server|client)\/src)\//.test(path)) return 'RUNTIME';
    if (/^data\/authoring\//.test(path)) return 'AUTHORING';
    if (/^data\/(generated|packs)\//.test(path)) return 'PACK_GENERATED';
    if (/^(e2e|.*\/tests)\//.test(path)) return 'TEST';
    return 'EVIDENCE_OR_OTHER';
  }))];
  inventory.push({
    pr: row.number, url: row.url, title: row.title, author: row.author.login,
    githubState: row.state, updatedAt: row.updatedAt, mergedAt: row.mergedAt,
    headSha: row.headRefOid, baseSha: row.baseRefOid,
    headRef: row.headRefName, baseRef: row.baseRefName,
    mergeSha: row.mergeCommit?.oid ?? null,
    gitFacts: {
      headAvailable, baseAvailable, mainIsAncestor: headAvailable ? ancestor(mainSha, row.headRefOid) : null,
      headInMain: headAvailable ? ancestor(row.headRefOid, mainSha) : null,
      changedPaths: files, areas,
    },
    technicalReview: { state: 'PENDING', verdict: null, reviewerArtifact: null, testsExecuted: [],
      note: 'Git ancestry, GitHub state and historical review labels do not grant technical acceptance.' },
    promotionAuthorized: false, creditDelta: 0,
  });
}
const output = {
  schemaVersion: 'fd-colleague-pr-review-inventory-v1',
  observedDate: '2026-10-09', timezone: 'Asia/Shanghai', repository: 'binchen648/fd',
  contributor: 'fengling20011118-dotcom', mainSha,
  scope: 'All contributor PRs observed on this date, including merged and closed PRs; historical recovery queue is a subset.',
  completeness: { githubSearchTotal: 534, githubSearchIncomplete: false, listedCount: inventory.length,
    completeAtObservation: inventory.length === 534 },
  counts: { total: inventory.length,
    open: inventory.filter((p) => p.githubState === 'OPEN').length,
    merged: inventory.filter((p) => p.githubState === 'MERGED').length,
    closed: inventory.filter((p) => p.githubState === 'CLOSED').length,
    missingGitObjects: inventory.filter((p) => !p.gitFacts.headAvailable || !p.gitFacts.baseAvailable).length,
    reviewed: 0, pending: inventory.length },
  prs: inventory,
};
if (!output.completeness.completeAtObservation) throw new Error('Inventory does not match observed search total; refresh evidence');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output.counts));
