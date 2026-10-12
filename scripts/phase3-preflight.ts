import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { authorizationSha, finalSourcePaths, implementationBaseSha, mainSha, repairPaths, sha256, validateFinalBinding,
  buildContinuationBinding, validateContinuationBinding, continuationPaths, continuationTaskId,
  buildContinuationReviews, validateContinuationReviews, validateContinuationReceipt, type ContinuationReceipt } from './phase3-e08-b11-coverage-sync';
import { validateContinuationReceiptReference, type ReceiptReference } from './phase3-e08-b11-coverage-sync';
import { ancestor, array, cliError, commitExists, fields, git, hash, InputError, inputFile, json, object, output, parseArgs, parseReference, readReference, safePath, sha, string, type Issue } from './phase3-tooling-common';

const b11Task = 'P3-E08-B11-RESULT-BINDING-CURRENT-MAIN-REPLAY';

export const e09CandidateSha = '0f62210a2e007a15e28f945c546ccd00c345942a';
export const e09ReviewSha = '4d5b76be9d5459cc0c40e50fae8513bc59cd5d21';
export const e09RepairAuthorizationSha = '69002b6a13f733cfdae586aeb4e19408e1ee592b';
const e09BaseSha = '463facb109cc4d19c4fda7af936fb4546fb86091';
const e09TestedSha = '88dcd441a17584b4a2a6d1ba78e588ac6a818ed1';
const e09RuntimePaths = ['packages', 'apps', 'e2e', 'data', 'package.json', 'package-lock.json', 'playwright.config.ts', 'tsconfig.json', 'scripts/phase3-coverage.ts'];
const e09References = [
  [e09ReviewSha, 'docs/reviews/phase3/P3-E09-B11-TRANSPORT-SECURITY-REPAIR-0f62210-reviewer-b.json'],
  ['e247a9a2c07c83652234c42e95f1d74548f1a6a3', 'docs/agents/P3-E09-B11-TRANSPORT-SECURITY-REPAIR.md'],
  ['2806e25c74337ff9cc5fb088cee4dd7b8674440f', 'docs/agents/P3-E09-B11-COMPATIBILITY-AND-VALIDATION.md'],
  [e09RepairAuthorizationSha, 'docs/agents/P3-E09-B11-FINAL-EVIDENCE-CONTRACT-REPAIR.md'],
  [e09CandidateSha, 'artifacts/phase3-e09-b11-transport-security-repair.json'],
] as const;

export function buildE09FinalBinding(root: string) {
  const references = e09References.map(([commit, path]) => ({ commit, path,
    sha256: hash(git(root, ['show', `${commit}:${path}`])) }));
  const objects = git(root, ['rev-parse', ...e09RuntimePaths.map(path => `${e09CandidateSha}:${path}`)]).toString().trim().split('\n');
  return { schemaVersion: 'fd-p3-e09-final-binding-v1', taskId: 'P3-E09-B11-FINAL-EVIDENCE-CONTRACT-REPAIR',
    candidateSha: e09CandidateSha, runtimeBaseSha: e09BaseSha, combinationTestedSha: e09TestedSha,
    references, sourceObjects: Object.fromEntries(e09RuntimePaths.map((path, index) => [path, objects[index]])),
    historicalAcceptanceInherited: false, mainCreditDelta: 0 };
}

export function validateE09RawStreams(value: unknown): number {
  let count = 0;
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    const row = value as Record<string, unknown>;
    if (row.encoding === 'base64' && typeof row.raw === 'string' && typeof row.sha256 === 'string') {
      const bytes = Buffer.from(row.raw, 'base64');
      if (bytes.toString('base64') !== row.raw || bytes.length !== row.bytes || hash(bytes).toLowerCase() !== row.sha256) throw new InputError('Tampered raw receipt');
      count++;
    }
    for (const item of Object.values(row)) visit(item);
  };
  visit(value); return count;
}

export function validateE09FinalBinding(root: string, input: ReturnType<typeof buildE09FinalBinding>) {
  return validateE09TechnicalBinding(root, input);
}

function validateE09TechnicalBinding(root: string, input: ReturnType<typeof buildE09FinalBinding>, preservedPaths: ReadonlySet<string> = new Set()) {
  const expected = buildE09FinalBinding(root);
  assertFinalTaskCheck(input, expected);
  git(root, ['merge-base', '--is-ancestor', e09CandidateSha, 'HEAD']);
  if (git(root, ['rev-parse', `${e09ReviewSha}^`]).toString().trim() !== e09CandidateSha) throw new InputError('Reviewer parent mismatch');
  const review = JSON.parse(git(root, ['show', `${e09ReviewSha}:${e09References[0][1]}`]).toString());
  if (review.reviewedSha !== e09CandidateSha || review.verdict !== 'PASS' || review.overallReadiness !== 'BLOCKED' ||
      review.reviewerIdentity !== 'Codex Reviewer B' || review.combinationTestedSha !== e09TestedSha ||
      review.verdictScope !== 'Scoped transport security repair and existing B11/Golden Eater/socket composition only') throw new InputError('Scoped reviewer binding mismatch');
  const sourceBytes = git(root, ['show', `${e09CandidateSha}:${e09References[4][1]}`]);
  if (hash(sourceBytes).toLowerCase() !== review.packet.sha256) throw new InputError('Reviewer packet hash mismatch');
  const packet = JSON.parse(sourceBytes.toString());
  const rawStreams = validateE09RawStreams(packet);
  if (rawStreams !== 26) throw new InputError('Missing raw receipts');
  const entries = Object.entries(input.sourceObjects);
  const boundObjects = git(root, ['rev-parse', ...['HEAD', e09TestedSha].flatMap(commit => entries.map(([path]) => `${commit}:${path}`))]).toString().trim().split('\n');
  entries.forEach(([path, object], index) => { if (boundObjects[index] !== object || boundObjects[index + entries.length] !== object) throw new InputError(`Current source drift: ${path}`); });
  if (git(root, ['diff', 'HEAD', '--', ...e09RuntimePaths]).length || git(root, ['ls-files', '--others', '--exclude-standard', '--', ...e09RuntimePaths]).length) throw new InputError('Dirty current provider');
  const read = (index: number) => git(root, ['show', `${e09References[index][0]}:${e09References[index][1]}`]).toString();
  const declaredPaths = (text: string) => [...text.matchAll(/^- ([\w./-]+)(?: \([^\r\n]*\))?(?:\r?\n|$)/gm)].map(match => match[1]);
  const transportPaths = new Set([...declaredPaths(read(1)), ...declaredPaths(read(2))]);
  for (const path of changedPaths(root, e09BaseSha, e09CandidateSha)) if (!transportPaths.has(path)) throw new InputError(`Unauthorized transport delta: ${path}`);
  const repairPaths = new Set(declaredPaths(read(3)));
  for (const path of changedPaths(root, e09ReviewSha, 'HEAD')) {
    if (!repairPaths.has(path) && !preservedPaths.has(path) && path !== 'artifacts/phase3-e09-b11-final-binding-diagnostic.json' && path !== 'docs/reports/2026-10-12-p3-e09-b11-final-binding-diagnostic.md') throw new InputError(`Unexpected evidence delta: ${path}`);
  }
  const sourceBlobs = git(root, ['rev-parse', ...packet.sourceBinding.files.map((row: any) => `${e09CandidateSha}:${row.path}`)]).toString().trim().split('\n');
  const sourceHashes = batchReferences(root, packet.sourceBinding.files.map((row: any) => ({ commit: e09CandidateSha, path: row.path })));
  for (const [index, row] of packet.sourceBinding.files.entries()) {
    if (sourceHashes[index].sha256.toLowerCase() !== row.sha256 || sourceBlobs[index] !== row.gitBlob) throw new InputError('Transport source hash mismatch');
  }
  const issues: Issue[] = [{ code: 'FINAL_REVIEWER_A_PENDING', path: 'current carrier', message: 'Scoped RB review is not final evidence acceptance' },
    { code: 'ROOM_ID_REPAIR_AUTHORITY_UNBOUND', path: 'd9d8a6a480710afba20ee7371ecdedb09de77de1', message: 'Read dispatch authorizes paths but does not explicitly bind the subsequent room-ID semantic repair; Planner must provide exact authority disposition' },
    { code: 'SOURCE_ASSETS_MISSING', path: 'source-assets', message: '93 MISSING_IMAGE retained' },
    { code: 'GOVERNANCE_PENDING', path: 'Epoch 09/main publication and promotion', message: 'Not granted by evidence contract' }];
  return { status: 'BLOCKED', rawStreams, review, packet, issues, sourceObjects: input.sourceObjects,
    authenticHistoricalCi: packet.receipts.find((row: any) => row.id === '13-current-combination-default-ci'),
    acceptanceGranted: false, creditDelta: 0 };
}

export const e09AssemblySha = 'da57179a3d7c8a9f407a4ea986ab834cdd0acf25';
export const e09IntegrationMainSha = '1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce';
const e09PreviousMainSha = '9a1689d2ec5b56b67d1483d2593b4ab809d6c15c';
const e09TechnicalCarrierSha = '086a86a24f5cf0991b3743ceb28b34a767252070';
const e09FinalRaSha = '28875202695d43e580ddd637f1721e3a1dddbc8a';
const e09IntegrationAuthoritySha = 'ab3540aa07c9a02f7879d96e042b8e2a0a41e728';
const e09ControlPaths = [
  'docs/agents/FD-P3-CONTROL-EPOCH-09.md', 'docs/agents/PHASE3-TASK-INDEX.md',
  'docs/agents/manifests/governance/P3-E09-B11-LIMITED-ADOPTION-ATTESTATION.json',
  'docs/agents/manifests/governance/P3-E09-B11-ROOM-ID-ADOPTION.json',
  'docs/reports/2026-10-12-p3-e09-b11-limited-adoption-governance.md',
  'docs/reports/2026-10-12-p3-e09-b11-room-id-adoption.md',
] as const;
const e09IntegrationPaths = [
  'scripts/phase3-preflight.ts', 'scripts/tests/phase3-e09-b11-final-binding.test.ts',
  'scripts/tests/phase3-readiness-preflight.test.ts', 'scripts/fixtures/phase3-e09-b11-integration-binding.json',
  'artifacts/phase3-e09-b11-integration-evidence-binding.json',
  'docs/reports/2026-10-12-p3-e09-b11-integration-evidence-binding.md',
] as const;
const e09PromotionPaths = [
  'docs/reviews/phase3/P3-E09-B11-promotion-attestation.json',
  'docs/agents/manifests/governance/P3-E09-B11-PROMOTION-GOVERNANCE-INPUTS.json',
  'docs/reports/2026-10-12-p3-e09-b11-promotion-attestation.md',
] as const;

export function buildE09IntegrationBinding(root: string) {
  const refs = batchReferences(root, [
    { commit: e09IntegrationAuthoritySha, path: 'docs/agents/P3-E09-B11-INTEGRATION-CONTRACT-AND-ATTESTATION.md' },
    { commit: '76133b6dbfc09318143df37b24b0e2e4a2de3a17', path: 'docs/agents/P3-E09-I-B11-PROMOTION-AUTHORIZATION.md' },
    { commit: e09FinalRaSha, path: 'docs/reviews/phase3/P3-E09-B11-086a86a-final-contract-reviewer-a.json' },
    { commit: e09TechnicalCarrierSha, path: 'artifacts/phase3-e09-b11-final-evidence-binding.json' },
    { commit: e09TechnicalCarrierSha, path: 'artifacts/phase3-e09-b11-final-coverage.json' },
    ...e09ControlPaths.map(path => ({ commit: e09IntegrationMainSha, path })),
  ]);
  const blobs = git(root, ['rev-parse', ...e09ControlPaths.map(path => `${e09IntegrationMainSha}:${path}`)]).toString().trim().split('\n');
  return { schemaVersion: 'fd-p3-e09-integration-binding-v1', taskId: 'P3-E09-B11-INTEGRATION-EVIDENCE-CONTRACT',
    controlEpoch: 'FD-P3-2026-09-23-09', assemblySha: e09AssemblySha, observedMainSha: e09IntegrationMainSha,
    previousMainSha: e09PreviousMainSha, technicalCarrierSha: e09TechnicalCarrierSha,
    technical: buildE09FinalBinding(root), authorization: refs[0], promotionAuthority: refs[1], finalReviewerA: refs[2],
    acceptedPacket: refs[3], acceptedCoverage: refs[4],
    preservedControlFiles: refs.slice(5).map((ref, index) => ({ ...ref, gitBlob: blobs[index] })),
    promotionEvidence: [] as Array<{ commit: string; path: string; sha256: string }>,
    formalCredit: { mainCoverageCreditDelta: 0, migrationCreditDelta: 0, denominatorDelta: 0, promotedOnMain: false },
    acceptanceGranted: false };
}

export function validateE09IntegrationBinding(root: string, input: ReturnType<typeof buildE09IntegrationBinding>) {
  const expected = buildE09IntegrationBinding(root);
  assertFinalTaskCheck({ ...input, promotionEvidence: [] }, expected);
  if (!Array.isArray(input.promotionEvidence)) throw new InputError('Explicit promotion evidence references required');
  for (const [base, tip] of [[e09PreviousMainSha, e09IntegrationMainSha], [e09IntegrationMainSha, e09AssemblySha],
    [e09CandidateSha, e09TechnicalCarrierSha], [e09TechnicalCarrierSha, e09FinalRaSha], [e09FinalRaSha, e09AssemblySha], [e09AssemblySha, 'HEAD']]) {
    git(root, ['merge-base', '--is-ancestor', base, tip]);
  }
  if (git(root, ['rev-parse', `${e09FinalRaSha}^`]).toString().trim() !== e09TechnicalCarrierSha) throw new InputError('Final RA parent mismatch');
  assertFinalTaskCheck(changedPaths(root, e09PreviousMainSha, e09IntegrationMainSha), [...e09ControlPaths].sort());
  assertFinalTaskCheck(changedPaths(root, e09FinalRaSha, e09AssemblySha), [...e09ControlPaths].sort());
  const read = (ref: { commit: string; path: string; sha256: string }) => {
    const bytes = git(root, ['show', `${ref.commit}:${ref.path}`]);
    if (hash(bytes) !== ref.sha256) throw new InputError('Integration reference hash mismatch');
    return bytes;
  };
  const authorityText = read(input.authorization).toString();
  for (const path of [...e09IntegrationPaths, ...e09PromotionPaths]) {
    if (!authorityText.includes(`- ${path}\n`)) throw new InputError('Integration path authority missing');
  }
  const controlFiles = input.preservedControlFiles;
  const actualBlobs = git(root, ['rev-parse', ...controlFiles.map(ref => `HEAD:${ref.path}`)]).toString().trim().split('\n');
  controlFiles.forEach((ref, index) => { if (actualBlobs[index] !== ref.gitBlob) throw new InputError(`Preserved main blob drift: ${ref.path}`); });
  if (git(root, ['diff', 'HEAD', '--', ...e09ControlPaths]).length) throw new InputError('Dirty preserved main control');
  const ra = JSON.parse(read(input.finalReviewerA).toString());
  const technicalRefs = [input.finalReviewerA, input.acceptedPacket, input.acceptedCoverage];
  const technicalBlobs = git(root, ['rev-parse', ...technicalRefs.flatMap(ref => [`${ref.commit}:${ref.path}`, `HEAD:${ref.path}`])]).toString().trim().split('\n');
  technicalRefs.forEach((ref, index) => {
    if (technicalBlobs[index * 2] !== technicalBlobs[index * 2 + 1]) throw new InputError(`Accepted technical artifact drift: ${ref.path}`);
  });
  if (git(root, ['diff', 'HEAD', '--', ...technicalRefs.map(ref => ref.path)]).length) throw new InputError('Dirty accepted technical artifact');
  if (ra.reviewedSha !== e09TechnicalCarrierSha || ra.runtimeCandidateSha !== e09CandidateSha || ra.finalVerdict !== 'PASS' ||
    ra.reviewer !== 'Reviewer A' || ra.controlEpoch !== input.controlEpoch ||
    ra.acceptedScope !== 'EXACT_FOUR_HISTORICAL_TEST_CONTRACT_REPAIRS_CURRENT_BINDING_VALIDATOR_COVERAGE_AND_AUTHENTIC_EXECUTION_EVIDENCE_ONLY' ||
    ra.boundPacket.sha256 !== input.acceptedPacket.sha256 || ra.boundCoverage.sha256 !== input.acceptedCoverage.sha256) throw new InputError('Final RA scope binding mismatch');
  const acceptedPacket = JSON.parse(read(input.acceptedPacket).toString());
  read(input.acceptedCoverage);
  if (acceptedPacket.implementationSha !== ra.implementationSha || acceptedPacket.binding.candidateSha !== e09CandidateSha ||
    acceptedPacket.formalCredit.promotedOnMain !== false || acceptedPacket.acceptanceGranted !== false) throw new InputError('Accepted technical packet mismatch');
  const rawStreams = validateE09RawStreams(acceptedPacket);
  if (rawStreams !== 24 || validateE09RawStreams(acceptedPacket.validationReceipts) !== 20 ||
    acceptedPacket.validationReceipts.length !== ra.independentEvidenceVerification.newValidationRecords) throw new InputError('Missing accepted historical/current receipts');
  const limited = JSON.parse(read(controlFiles[2]).toString());
  const room = JSON.parse(read(controlFiles[3]).toString());
  for (const ref of [limited.authority, room.authority]) read(ref);
  if (limited.controlEpoch !== input.controlEpoch || room.controlEpoch !== input.controlEpoch ||
    limited.boundaries.creditDelta !== undefined && limited.boundaries.creditDelta !== 0 ||
    limited.boundaries.coverageCreditDelta !== 0 || room.boundaries.creditDelta !== 0 ||
    room.delta.finalRuntimeCarrierSha !== e09CandidateSha || room.delta.finalEvidenceCarrierSha !== e09TechnicalCarrierSha ||
    room.decision.status !== 'EXACT_ROOM_ID_PROSPECTIVE_AUTHORITY_BOUND') throw new InputError('Prospective adoption scope mismatch');
  assertFinalTaskCheck(room.reviewerA.commit, e09FinalRaSha);
  assertFinalTaskCheck(room.reviewerB.commit, e09ReviewSha);
  read(room.reviewerA); read(room.reviewerB);
  const roomPaths = room.delta.pathTable.map((row: any) => row.path).sort();
  assertFinalTaskCheck(changedPaths(root, room.delta.baseSha, room.delta.implementationSha), roomPaths);
  const adopted = [...room.delta.pathTable.flatMap((row: any) => [
    { source: `${room.delta.implementationSha}:${row.path}`, blob: row.implementationBlob },
    { source: `${e09CandidateSha}:${row.path}`, blob: row.implementationBlob },
  ]), ...limited.prospectiveAdoption.authorityDecision.pathTable.map((row: any) => ({ source: `${e09CandidateSha}:${row.path}`, blob: row.finalBlob }))];
  const adoptionBlobs = git(root, ['rev-parse', ...adopted.map(row => row.source)]).toString().trim().split('\n');
  adopted.forEach((row, index) => { if (adoptionBlobs[index] !== row.blob) throw new InputError('Adopted blob mismatch'); });
  const promotionAuthority = read(input.promotionAuthority).toString();
  const packageBlob = input.technical.sourceObjects['package.json'];
  const packageHash = hash(git(root, ['show', `${e09CandidateSha}:package.json`]));
  if (!promotionAuthority.includes(`Final package.json blob: ${packageBlob}.`) || !promotionAuthority.includes(`Final SHA-256: ${packageHash}.`)) throw new InputError('Package prospective authority mismatch');
  const preservedPaths = new Set<string>([...e09ControlPaths, ...e09IntegrationPaths, input.finalReviewerA.path]);
  const newEvidence = new Set<string>();
  for (const raw of input.promotionEvidence) {
    const ref = parseReference(raw, 'promotion evidence');
    if (!(e09PromotionPaths as readonly string[]).includes(ref.path) || newEvidence.has(ref.path)) throw new InputError('Unknown or duplicate promotion evidence path');
    git(root, ['merge-base', '--is-ancestor', e09AssemblySha, ref.commit]);
    git(root, ['merge-base', '--is-ancestor', ref.commit, 'HEAD']);
    read(ref);
    if (git(root, ['rev-parse', `${ref.commit}:${ref.path}`]).toString().trim() !== git(root, ['rev-parse', `HEAD:${ref.path}`]).toString().trim() ||
      git(root, ['diff', 'HEAD', '--', ref.path]).length) throw new InputError('Promotion evidence source drift');
    newEvidence.add(ref.path); preservedPaths.add(ref.path);
  }
  for (const path of changedPaths(root, e09AssemblySha, 'HEAD')) if (!preservedPaths.has(path) || (e09ControlPaths as readonly string[]).includes(path)) throw new InputError(`Unknown integration delta: ${path}`);
  const technical = validateE09TechnicalBinding(root, input.technical, preservedPaths);
  assertFinalTaskCheck(acceptedPacket.preservedHistoricalTransportReceipts.receipts, technical.packet.receipts);
  return { schemaVersion: 'fd-p3-e09-integration-result-v1', status: 'BLOCKED', taskId: input.taskId,
    controlEpoch: input.controlEpoch, assemblySha: input.assemblySha, observedMainSha: input.observedMainSha,
    preservedControlFiles: controlFiles, technical, acceptedRawStreams: rawStreams,
    effectiveRoomIdAdoption: 'EXACT_PROSPECTIVE_AUTHORITY_BOUND_NOT_HISTORICAL_PROOF',
    effectivePackageAdoption: 'EXACT_PROSPECTIVE_PLANNER_AUTHORITY_BOUND_NOT_HISTORICAL_RESERVATION',
    issues: [{ code: 'INTEGRATION_REVIEWER_A_PENDING', path: 'new exact carrier', message: 'Existing RA applies only to its accepted technical source' },
      { code: 'PROMOTION_GOVERNANCE_PENDING', path: 'real GitHub attestation and actual-head required checks', message: 'Preserved main control does not satisfy new promotion policy evidence' },
      { code: 'SOURCE_ASSETS_MISSING', path: 'source-assets', message: '93 MISSING_IMAGE retained' }],
    historicalIssuesRewritten: false, acceptanceGranted: false, promotionAllowed: false, creditDelta: 0,
    reviewReadyChanged: false, promotionPolicyChanged: false };
}
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

export function runPreflight(root: string, raw: unknown, candidate: string, base: string, inputSha256: string): {
  status: string; issues: Issue[]; changedPaths: string[]; acceptanceGranted: boolean;
  reviewReadyChanged: boolean; promotionPolicyChanged: boolean; [key: string]: any;
} {
  const input = object(raw, 'task check');
  if (input.schemaVersion === 'fd-p3-e09-integration-binding-v1') {
    if (candidate !== git(root, ['rev-parse', 'HEAD']).toString().trim() || base !== input.observedMainSha) throw new InputError('Integration CLI SHA mismatch');
    return { ...validateE09IntegrationBinding(root, input as ReturnType<typeof buildE09IntegrationBinding>),
      inputs: { testedCandidateSha: candidate, testedBaseSha: base, inputSha256 }, changedPaths: changedPaths(root, base, candidate) };
  }
  if (input.schemaVersion === 'fd-p3-task-check-v3') return runContinuationPreflight(root, input, candidate, base, inputSha256);
  if (input.schemaVersion === 'fd-p3-task-check-v2') return runFinalPreflight(root, input, candidate, base, inputSha256);
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

const originalContract = 'e65503e601d7a3a4d1265d87a09484cb8295f2c2';
const originalContractPath = 'docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md';
const historicalTaskPath = 'scripts/fixtures/phase3-b11-task-check.json';
const firstCoverageSha = '9eaa0e0c417486adf7b0449e3d32fb90b7d362f9';
const scopedReviewSha = 'b81acf2b4749a09b1dfc0a6f292dda442b7fdbd5';

function exactReference(root: string, commit: string, path: string, section?: string) {
  const bytes = git(root, ['show', `${commit}:${path}`]);
  if (section && !bytes.toString('utf8').includes(section)) throw new InputError('Authorization section missing');
  return { commit, path, sha256: sha256(bytes), ...(section ? { section } : {}) };
}

function batchReferences(root: string, refs: Array<{ commit: string; path: string }>) {
  const output = requireGitBatch(root, refs.map(ref => `${ref.commit}:${ref.path}`));
  let offset = 0;
  const result = refs.map(ref => {
    const newline = output.indexOf(10, offset);
    const header = output.subarray(offset, newline).toString('utf8');
    const match = /^[0-9a-f]{40} blob (\d+)$/.exec(header);
    if (newline < 0 || !match) throw new InputError(`Missing provenance Git blob: ${ref.commit}:${ref.path}`);
    const end = newline + 1 + Number(match[1]);
    if (output[end] !== 10) throw new InputError('Truncated provenance Git blob');
    const bytes = output.subarray(newline + 1, end); offset = end + 1;
    return { ...ref, sha256: sha256(bytes) };
  });
  if (offset !== output.length) throw new InputError('Unexpected extra provenance Git bytes');
  return result;
}

function requireGitBatch(root: string, refs: string[]) {
  return execFileSync('git', ['cat-file', '--batch'], { cwd: root, input: `${refs.join('\n')}\n`,
    maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
}

export function buildFinalTaskCheck(root: string, sourceSha: string) {
  sha(sourceSha, 'final source SHA');
  const historicalBytes = git(root, ['show', `${implementationBaseSha}:${historicalTaskPath}`]);
  const historicalInput = json(historicalBytes, 'historical task');
  const historical = runPreflight(root, historicalInput, implementationBaseSha, mainSha, sha256(historicalBytes));
  const unregistered = historical.issues.filter(issue => issue.code === 'UNCOVERED_CHANGED_PATH').map(issue => issue.path).sort();
  if (unregistered.length !== 40 || new Set(unregistered).size !== 40) throw new InputError('Original forty-path baseline drift');
  const authorization = exactReference(root, authorizationSha, 'docs/agents/P3-E08-B11-FINAL-EVIDENCE-REPAIR-AUTHORIZATION.md', '## Authorized Write Paths');
  const toolingAuthorization = exactReference(root, originalContract, originalContractPath, '## Implementation And Handoff');
  const roleAuthorization = exactReference(root, mainSha, 'docs/agents/PHASE3-AGENT-CONTRACT.md', '## Slice And Pull Request Boundary');
  const introductions = new Map<string, { introducingSha: string; introducingBase: string }>();
  const history = git(root, ['log', '--reverse', '--full-history', '--no-merges', '--format=__P3_COMMIT__ %H %P', '--name-only',
    `${mainSha}..${implementationBaseSha}`, '--', ...unregistered]).toString('utf8').split('\n');
  let current: { introducingSha: string; introducingBase: string } | undefined;
  for (const line of history) {
    const match = /^__P3_COMMIT__ ([0-9a-f]{40}) ([0-9a-f]{40})$/.exec(line);
    if (line.startsWith('__P3_COMMIT__')) {
      if (!match) throw new InputError('Invalid introducing commit/parent record');
      current = { introducingSha: match[1], introducingBase: match[2] };
    } else if (unregistered.includes(line) && !introductions.has(line)) {
      if (!current) throw new InputError('Unbound introducing path');
      introductions.set(line, current);
    }
  }
  const introducingReferences = batchReferences(root, unregistered.map(path => {
    const record = introductions.get(path);
    if (!record) throw new InputError(`Missing introducing delta: ${path}`);
    return { commit: record.introducingSha, path };
  }));
  const finalReferences = batchReferences(root, unregistered.map(path => ({ commit: implementationBaseSha, path })));
  const provenance = unregistered.map((path, index) => {
    const { introducingSha, introducingBase } = introductions.get(path)!;
    const role = path.startsWith('packages/rules/') || path.startsWith('docs/agents/manifests/') ? 'B' :
      path.startsWith('docs/reviews/') ? 'R' : 'A';
    // Original scope reference is not retroactive acceptance or proof of a user-only B dispatch.
    const originalAuthorization = role === 'A' ? toolingAuthorization : role === 'R' ? roleAuthorization : null;
    const authorizationState = role === 'B' ? 'UNPROVEN_USER_DISPATCH_NOT_GIT_BOUND' : 'ORIGINAL_ROLE_SCOPE_BOUND_PENDING_PATH_REVIEW';
    return { path, introducingSha, introducingBase, introducingDelta: introducingReferences[index],
      finalContent: finalReferences[index], role, originalAuthorization, authorizationState,
      originalScope: role === 'A' ? 'Tooling files, package script entries, documented task-check fixtures, automation tests and evidence' :
        role === 'R' ? 'Immutable read-only role review artifact' : 'User dispatch claimed by B task record; independent original authorization required',
      acceptedScope: 'NOT_ACCEPTED_WHOLESALE', finalReviewState: 'PENDING_RA_RB_FINAL_COMBINATION' };
  });
  const sourceObjects = Object.fromEntries(finalSourcePaths.map(path => [path, git(root, ['rev-parse', `${sourceSha}:${path}`]).toString('utf8').trim()]));
  const overlap = changedPaths(root, firstCoverageSha, implementationBaseSha).filter(path => !unregistered.includes(path));
  return {
    schemaVersion: 'fd-p3-task-check-v2', taskId: 'P3-E08-B11-COMBINATION-READINESS', controlEpoch: 'FD-P3-2026-09-23-08',
    baseSha: mainSha, candidateSha: sourceSha, authorization,
    scopedReview: exactReference(root, scopedReviewSha, 'docs/reviews/phase3/P3-E08-B11-premise-sync-reviewer-a.json'),
    historicalInput, historicalInputSha256: sha256(historicalBytes), provenance, overlappingSourceChanges: overlap.map(path => ({
      path, originalSource: exactReference(root, firstCoverageSha, path), finalSource: exactReference(root, implementationBaseSha, path),
      authorizationState: 'PENDING_EXACT_DELTA_AUTHORIZATION_AND_REVIEW',
    })),
    repairReservation: { owner: 'Codex A', branch: 'codex/a-p3-e08-b11-final-evidence', paths: repairPaths,
      priorAWorktrees: 'CLEAN_AT_RESERVATION; NO_OTHER_OVERLAPPING_WRITER_OBSERVED', runtimeServerReservation: 'RETAINED_BY_B' },
    finalBinding: { sourceSha, sourceObjects },
    checks: (historicalInput.checks as Array<Record<string, unknown>>).map(check => ({ id: check.id, command: check.command,
      state: 'PENDING_FRESH_EXECUTION_PACKET_BINDING', testedSha: sourceSha })),
    formalCredit: { mainCoverageCreditDelta: 0, migrationCreditDelta: 0, denominatorDelta: 0, promotedOnMain: false },
  };
}

export function assertFinalTaskCheck(actual: unknown, expected: ReturnType<typeof buildFinalTaskCheck>) {
  if (!isDeepStrictEqual(actual, expected)) throw new InputError('Final provenance evidence mismatch');
}

export function buildContinuationTaskCheck(root: string, sourceSha: string) {
  // The exact blocked v2 carrier pins all forty original provenance rows. Do not re-authorize them.
  const historical = JSON.parse(git(root, ['show', '11c1985dc4c72151bbf16298292bf4b7fa29fcab:scripts/fixtures/phase3-b11-task-check.json']).toString('utf8')) as ReturnType<typeof buildFinalTaskCheck>;
  return { ...historical, schemaVersion: 'fd-p3-task-check-v3', taskId: continuationTaskId,
    candidateSha: sourceSha, checks: historical.checks.map(check => ({ id: check.id, command: check.command, sourceSha, state: 'PENDING_FINAL_RA_RB' })),
    finalBinding: buildContinuationBinding(root, sourceSha),
    repairReservation: { ...historical.repairReservation, branch: 'codex/a-p3-e08-b11-evidence-contract-continuation', paths: continuationPaths },
    execution: { schemaVersion: 'fd-p3-continuation-execution-v1', carryingSha: 'RESOLVE_FROM_GIT_HANDOFF_NOT_SELF_REFERENTIAL',
      receipts: [] as ContinuationReceipt[], receiptReference: null as ReceiptReference | null,
      reviews: buildContinuationReviews(root), finalReviewState: 'PENDING_FINAL_RA_RB' },
  };
}

export function validateContinuationTaskCheck(root: string, input: Record<string, any>) {
  const expected = buildContinuationTaskCheck(root, input.finalBinding?.sourceSha);
  fields(input, Object.keys(expected), 'continuation task check');
  fields(object(input.execution, 'execution'), Object.keys(expected.execution), 'continuation execution');
  const receipts = array(input.execution.receipts, 'execution.receipts') as ContinuationReceipt[];
  // Only executed receipts vary. Authorizations, history, scopes and pending acceptance are reconstructed from Git.
  assertFinalTaskCheck({ ...input, execution: { ...input.execution, receipts: [], receiptReference: null } }, expected);
  validateContinuationReviews(root, input.execution.reviews);
  for (const receipt of receipts) validateContinuationReceipt(root, receipt, input.finalBinding);
  validateContinuationReceiptReference(root, input.execution.receiptReference, receipts, input.finalBinding);
  return expected;
}

function runContinuationPreflight(root: string, input: Record<string, any>, candidate: string, base: string, inputSha256: string) {
  const expected = validateContinuationTaskCheck(root, input);
  const receipts = input.execution.receipts as ContinuationReceipt[];
  if (candidate !== input.candidateSha || base !== mainSha) throw new InputError('Continuation CLI SHA mismatch');
  validateContinuationBinding(root, input.finalBinding);
  const issues: Issue[] = [];
  if (receipts.length && input.execution.receiptReference === null) issues.push({ code: 'UNSEALED_EXECUTION_RECEIPTS', path: 'execution.receiptReference', message: 'Bind the recorded packet commit/path/blob/hash before carrier handoff; no acceptance inferred' });
  for (const row of expected.provenance) issues.push({ code: row.role === 'B' ? 'ORIGINAL_AUTHORIZATION_UNPROVEN' : 'PATH_SCOPE_REVIEW_PENDING', path: row.path, message: row.authorizationState });
  for (const row of expected.overlappingSourceChanges) issues.push({ code: 'OVERLAPPING_SOURCE_REVIEW_PENDING', path: row.path, message: row.authorizationState });
  for (const check of expected.checks) {
    const observations = receipts.filter(row => row.command === check.command);
    if (!observations.length) issues.push({ code: 'FRESH_EXECUTION_BINDING_PENDING', path: String(check.id), message: String(check.command) });
    else if (observations.some(row => row.exitCode !== 0)) issues.push({ code: 'EXECUTION_FAILED', path: String(check.id), message: String(check.command) });
  }
  issues.push({ code: 'FINAL_RA_RB_REVIEW_PENDING', path: candidate, message: 'Historical scoped reviews are not final combination acceptance' });
  const changed = changedPaths(root, mainSha, candidate);
  const registered = new Set([...changedPaths(root, mainSha, firstCoverageSha), ...expected.provenance.map(row => row.path),
    ...expected.overlappingSourceChanges.map(row => row.path), ...continuationPaths, 'package.json']);
  for (const path of changed) if (!registered.has(path)) issues.push({ code: 'UNCOVERED_CHANGED_PATH', path, message: 'No pinned authorization or provenance' });
  return { schemaVersion: 'fd-p3-preflight-result-v3', taskId: input.taskId, controlEpoch: input.controlEpoch, status: 'FAIL',
    inputs: { testedCandidateSha: candidate, testedBaseSha: base, inputSha256 }, changedPaths: changed,
    provenance: expected.provenance, overlappingSourceChanges: expected.overlappingSourceChanges,
    authorizations: input.finalBinding.authorizations, execution: input.execution, issues,
    acceptanceGranted: false, reviewReadyChanged: false, promotionPolicyChanged: false };
}

function runFinalPreflight(root: string, input: Record<string, any>, candidate: string, base: string, inputSha256: string) {
  fields(input, ['schemaVersion', 'taskId', 'controlEpoch', 'baseSha', 'candidateSha', 'authorization', 'scopedReview',
    'historicalInput', 'historicalInputSha256', 'provenance', 'overlappingSourceChanges', 'repairReservation', 'finalBinding', 'checks', 'formalCredit'], 'final task check');
  sha(candidate, '--candidate'); sha(base, '--base');
  const issues: Issue[] = [];
  if (candidate !== input.candidateSha || base !== mainSha || input.baseSha !== mainSha) issues.push({ code: 'EXACT_SHA_MISMATCH', path: 'input', message: 'Final CLI/source/main mismatch' });
  const expected = buildFinalTaskCheck(root, input.finalBinding?.sourceSha);
  try { assertFinalTaskCheck(input, expected); }
  catch { issues.push({ code: 'FINAL_PROVENANCE_BINDING_MISMATCH', path: 'input', message: 'Exact source, forty per-path authorizations, scopes, hashes or pending states were changed' }); }
  validateFinalBinding(root, input.finalBinding);
  const reviewRef = parseReference(input.scopedReview, 'scopedReview');
  const reviewBytes = readReference(root, reviewRef, issues);
  if (reviewBytes) {
    const review = json(reviewBytes, 'scoped review');
    if (review.reviewedSha !== implementationBaseSha || review.controlEpoch !== input.controlEpoch || review.finalVerdict !== 'PASS' ||
      review.acceptedScope !== 'EXACT_PREMISE_REVIEW_BINDING_AND_LOCAL_PARITY_EVIDENCE_SYNC_ONLY' ||
      git(root, ['rev-parse', `${reviewRef.commit}^`]).toString('utf8').trim() !== implementationBaseSha) {
      issues.push({ code: 'SCOPED_REVIEW_MISMATCH', path: reviewRef.path, message: 'No final readiness can be inherited' });
    }
  }
  for (const row of expected.provenance) issues.push({ code: row.role === 'B' ? 'ORIGINAL_AUTHORIZATION_UNPROVEN' : 'PATH_SCOPE_REVIEW_PENDING', path: row.path, message: row.authorizationState });
  for (const row of expected.overlappingSourceChanges) issues.push({ code: 'OVERLAPPING_SOURCE_REVIEW_PENDING', path: row.path, message: row.authorizationState });
  for (const check of expected.checks) issues.push({ code: 'FRESH_EXECUTION_BINDING_PENDING', path: String(check.id), message: String(check.command) });
  issues.push({ code: 'FINAL_RA_RB_REVIEW_PENDING', path: candidate, message: 'Registration and passing diagnostics do not grant acceptance' });
  const changed = changedPaths(root, mainSha, candidate);
  const registered = new Set([...changedPaths(root, mainSha, firstCoverageSha), ...expected.provenance.map(row => row.path), ...expected.overlappingSourceChanges.map(row => row.path), ...repairPaths]);
  for (const path of changed) if (!registered.has(path)) issues.push({ code: 'UNCOVERED_CHANGED_PATH', path, message: 'Not in exact provenance or Planner repair authorization' });
  return { schemaVersion: 'fd-p3-preflight-result-v2', taskId: input.taskId, controlEpoch: input.controlEpoch, status: 'FAIL',
    inputs: { testedCandidateSha: candidate, testedBaseSha: base, inputSha256 }, changedPaths: changed,
    provenance: expected.provenance, overlappingSourceChanges: expected.overlappingSourceChanges, issues,
    acceptanceGranted: false, reviewReadyChanged: false, promotionPolicyChanged: false };
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
