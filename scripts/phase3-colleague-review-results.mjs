import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function bindReviews(inventory, batch, artifactPath) {
  if (batch.mainSha !== inventory.mainSha) throw new Error('Review main binding mismatch');
  const result = structuredClone(inventory);
  const seen = new Set();
  for (const review of batch.reviews) {
    if (seen.has(review.pr)) throw new Error('Duplicate review');
    seen.add(review.pr);
    const row = result.prs.find((candidate) => candidate.pr === review.pr);
    if (!row) throw new Error('Unregistered PR');
    if (row.headSha !== review.headSha || row.baseSha !== review.baseSha) throw new Error('Exact candidate binding mismatch');
    if (!['PASS', 'FAILED', 'BLOCKED', 'NOT_VERIFIED'].includes(review.verdict)) throw new Error('Invalid verdict');
    if (!review.producer || !review.scope || !Array.isArray(review.evidence) || !review.evidence.length) {
      throw new Error('Missing reviewer provenance');
    }
    for (const entry of review.evidence) {
      if (!entry.producer || !entry.command || !entry.targetSha || !entry.result || !entry.artifactIdentity) {
        throw new Error('Incomplete evidence provenance');
      }
      if (entry.kind === 'TEST' && entry.targetSha !== review.headSha) throw new Error('Test target mismatch');
    }
    if (review.runtimeAcceptanceGranted !== false || review.promotionAuthorized !== false || review.creditDelta !== 0) {
      throw new Error('Review cannot grant acceptance, promotion or credit');
    }
    row.technicalReview = {
      state: ['PASS', 'FAILED'].includes(review.verdict) ? 'REVIEWED' : review.verdict,
      verdict: review.verdict, scope: review.scope, producer: review.producer,
      reviewerArtifact: artifactPath, testsExecuted: review.evidence.filter((entry) => entry.kind === 'TEST'),
      note: 'Historical candidate technical disposition only; independent current-main gates remain separate.',
    };
  }
  result.counts.reviewed = result.prs.filter((row) => row.technicalReview.state === 'REVIEWED').length;
  result.counts.blocked = result.prs.filter((row) => row.technicalReview.state === 'BLOCKED').length;
  result.counts.notVerified = result.prs.filter((row) => row.technicalReview.state === 'NOT_VERIFIED').length;
  result.counts.pending = result.prs.filter((row) => row.technicalReview.state === 'PENDING').length;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [inventoryPath, artifactPath] = process.argv.slice(2);
  const read = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  const result = bindReviews(read(inventoryPath), read(artifactPath), artifactPath.replaceAll('\\', '/'));
  writeFileSync(inventoryPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result.counts));
}
