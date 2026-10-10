import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
const HEAD = 'a1b8f274c8f3fb0859540de9dc08ca3a97a5f8cc';
const BASE = '4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f';
const FRONTIER = '8b26c9d0aa294c065ae6c7f3a2b062f19cdff196';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30000000 }).trim();
const cache = new Map();
function at(sha, path) { const key = `${sha}:${path}`; if (!cache.has(key)) cache.set(key, JSON.parse(git('show', key).replace(/^\uFEFF/, ''))); return cache.get(key); }
const artifact = at(HEAD, 'artifacts/phase3-frontier-reconciliation.json');
const results = [];
function check(name, fn) { try { results.push({ name, pass: true, observations: fn() }); } catch (error) { results.push({ name, pass: false, detail: String(error) }); } }
const inventory = at(FRONTIER, 'data/phase3/full-roster-ability-inventory.json');
const frozen = new Set([...inventory.staticSkills, ...inventory.dynamicSkills].map(row => row.canonicalAbilityId));
function material(sha) {
  const paths = git('ls-tree', '-r', '--name-only', sha, 'data/authoring').split('\n').filter(path => path.endsWith('.json'));
  return paths.flatMap(path => (at(sha, path).cards ?? []).map(card => card.id)).filter(id => frozen.has(id));
}
const before = material(BASE), after = material(FRONTIER);
check('Exact historical lineage and complete material/formal-only union', () => {
  assert.equal(artifact.mainSha, BASE); assert.equal(artifact.frontierSha, FRONTIER);
  assert.equal(git('merge-base', BASE, FRONTIER), artifact.mergeBase);
  assert.notEqual(artifact.mergeBase, BASE); assert.notEqual(artifact.mergeBase, FRONTIER);
  assert.deepEqual(git('diff', '--name-only', BASE, HEAD).split('\n').sort(), ['artifacts/phase3-frontier-reconciliation.json', 'docs/reports/phase3-diverged-lineage-reconciliation.md']);
  assert.equal(frozen.size, 944); assert.equal(before.length, 111); assert.equal(new Set(before).size, 111);
  assert.equal(after.length, 265); assert.equal(new Set(after).size, 265);
  assert.deepEqual(before.filter(id => !after.includes(id)), []);
  const added = after.filter(id => !before.includes(id)); assert.equal(added.length, 154);
  const ledgerOnly = ['master.kadoc.skill.s3', 'master.ophelia.skill.s5', 'master.ophelia.skill.s6', 'master.ophelia.skill.s7'];
  assert.deepEqual(artifact.entries.map(row => row.identityId).sort(), [...added, ...ledgerOnly].sort());
  assert.equal(new Set(artifact.entries.map(row => row.identityId)).size, 158);
  assert.equal(artifact.frontierFormal - artifact.mainAccepted, 158);
  for (const id of ledgerOnly) { assert.ok(!after.includes(id)); assert.equal(artifact.entries.find(row => row.identityId === id).classification, 'NOT_VERIFIED'); }
  return { historicalMainMaterial: 111, frontierMaterial: 265, added: 154, formalOnly: 4, runtimeAcceptance: false };
});
check('All158 classification/identity/material/source definitions are reproducibly bound', () => {
  const discrepancies = []; const counts = {};
  for (const row of artifact.entries) {
    counts[row.classification] = (counts[row.classification] ?? 0) + 1;
    if (!frozen.has(row.identityId) || row.canonicalCardId !== row.identityId || row.currentMainStatus.mainSha !== BASE) discrepancies.push({ id: row.identityId, kind: 'identity/main' });
    const sha = row.materialAuthoringEvidence.status === 'MATERIALIZED_AT_FRONTIER' ? FRONTIER : row.acceptedCandidateCommit;
    const location = row.normalizedDefinitionLocation;
    const raw = at(sha, location.path); const card = (raw.cards ?? []).find(card => card.id === location.cardId);
    if (!card) { discrepancies.push({ id: row.identityId, kind: 'missing card' }); continue; }
    const abilities = (card.abilities ?? []).map(ability => ability.id).sort();
    if (JSON.stringify(abilities) !== JSON.stringify([...row.abilityIds].sort()) || JSON.stringify(abilities) !== JSON.stringify([...location.abilityIds].sort())) discrepancies.push({ id: row.identityId, kind: 'ability IDs', actual: abilities, claimed: row.abilityIds });
    if (before.includes(row.identityId)) discrepancies.push({ id: row.identityId, kind: 'unexpected main material' });
    if (row.acceptedCandidateCommit) {
      const sourceCard = (at(row.acceptedCandidateCommit, location.path).cards ?? []).find(card => card.id === row.identityId);
      if (!sourceCard) discrepancies.push({ id: row.identityId, kind: 'candidate source missing' });
    }
    const missingEvidence = !row.reviewerEvidence;
    if (missingEvidence && row.classification !== 'NOT_VERIFIED') discrepancies.push({ id: row.identityId, kind: 'missing evidence not fail-closed' });
  }
  assert.deepEqual(counts, artifact.inventory.classificationCounts);
  assert.deepEqual(discrepancies, []);
  return { identities: 158, counts, nullReviewerEvidence: artifact.entries.filter(row => !row.reviewerEvidence).length };
});
check('All runtime introduction/batch path lists bind real changed Git paths', () => {
  const checked = new Set(); const discrepancies = [];
  for (const row of artifact.entries) for (const evidence of [...row.runtimeIntroductions, ...(row.batchRuntimeEvidence ? [row.batchRuntimeEvidence] : [])]) {
    const key = `${evidence.firstIntroducingCommit}:${evidence.taskBase ?? ''}:${evidence.acceptedCandidateCommit ?? ''}`;
    if (checked.has(key)) continue; checked.add(key);
    const changed = new Set(evidence.taskBase
      ? git('diff', '--name-only', evidence.taskBase, evidence.acceptedCandidateCommit).split('\n')
      : git('diff-tree', '--no-commit-id', '--name-only', '-r', evidence.firstIntroducingCommit).split('\n'));
    for (const field of ['changedHotFiles', 'changedProductionFiles', 'representativeTests']) for (const path of evidence[field] ?? []) if (!changed.has(path)) discrepancies.push({ contract: evidence.contract, field, path });
  }
  assert.deepEqual(discrepancies, []); return { uniqueRanges: checked.size };
});
check('Reproduction: Mozart S2 binds B03 candidate that does not contain it, B06 does', () => {
  const row = artifact.entries.find(row => row.identityId === 'servant.mozart.skill.sc-mozart-2');
  assert.equal(row.sourcePr, '#436');
  assert.equal(row.acceptedCandidateCommit, '4589924f0cae86dc58bd75a4794e2b2caef0f3ec');
  const path = row.normalizedDefinitionLocation.path;
  assert.ok(!at(row.acceptedCandidateCommit, path).cards.some(card => card.id === row.identityId));
  assert.ok(at('3fefa0cdb02cf9ff81cec64732cb67e5d6513549', path).cards.some(card => card.id === row.identityId));
  return { identity: row.identityId, wrongPr: 436, actualMaterialPr: 439, runtimeAcceptance: false };
});
check('Ibaraki historical source is structurally unchanged, not a new runtime defect', () => {
  const id = 'servant.ibaraki.skill.sc-ibaraki-1'; const row = artifact.entries.find(row => row.identityId === id);
  const path = row.normalizedDefinitionLocation.path;
  const original = at('78ab99ce3136f654e53ec922466c26d4751b1917', path).cards.find(card => card.id === id);
  const inherited = at(row.acceptedCandidateCommit, path).cards.find(card => card.id === id);
  assert.deepEqual(original, inherited);
  return { identity: id, identicalCard: true, historicalReviewedSha: '78ab99ce3136f654e53ec922466c26d4751b1917', artifactCandidateSha: row.acceptedCandidateCommit, fullRuntimeParityVerified: false };
});
if (process.argv.includes('--github')) check('Historical reviewer links bind exact candidate, preserve attributed producer rather than rerun claims', () => {
  const links = [...new Set(artifact.entries.map(row => row.reviewerEvidence).filter(Boolean))]; const summaries = [];
  for (const link of links) {
    const match = link.match(/\/pull\/(\d+)#issuecomment-(\d+)$/); assert.ok(match);
    const response = spawnSync('gh', ['api', `repos/binchen648/fd/issues/comments/${match[2]}`], { encoding: 'utf8', maxBuffer: 2000000 }); assert.equal(response.status, 0, response.stderr);
    const comment = JSON.parse(response.stdout); assert.equal(comment.html_url, link);
    const sha = [...new Set(artifact.entries.filter(row => row.reviewerEvidence === link).map(row => row.acceptedCandidateCommit))];
    const bound = sha.every(value => comment.body.includes(value));
    summaries.push({ pr: Number(match[1]), commentId: comment.id, updatedAt: comment.updated_at, candidateMentioned: bound, verdictMentioned: /ACCEPTED|PASS/.test(comment.body) });
  }
  const unbound = summaries.filter(summary => !summary.candidateMentioned);
  assert.deepEqual(unbound, []); return { links: summaries };
});
process.stdout.write(`${JSON.stringify({ candidateSha: HEAD, baseSha: BASE, frontierSha: FRONTIER, producer: 'Independent takeover reviewer', results }, null, 2)}\n`);
if (results.some(result => !result.pass)) process.exitCode = 1;
