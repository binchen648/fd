import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { changedPaths } from './phase3-preflight';
import { adapterClosurePaths } from './phase3-contract-parity';
import { git, hash, parseArgs, sha } from './phase3-tooling-common';

export const combinationSha = '9eaa0e0c417486adf7b0449e3d32fb90b7d362f9';
export const diagnosticCandidateSha = '7ec91bbc26be0f63332d5cc8421b2c7c014906c5';
export const sourceMainSha = '9a1689d2ec5b56b67d1483d2593b4ab809d6c15c';
export const publicationSha = 'e65503e601d7a3a4d1265d87a09484cb8295f2c2';
export const fixturePath = 'scripts/fixtures/phase3-b11-parity-fixtures.json';

export function reference(root: string, commit: string, path: string, section?: string) {
  return { commit, path, sha256: hash(git(root, ['show', `${commit}:${path}`])), ...(section ? { section } : {}) };
}

export function buildFixtures(root: string) {
  const definitions = [
    { family: 'golden-eater', path: 'data/authoring/servants/servant.kintoki.json', archiveId: 'servant.kintoki', cardId: 'servant.kintoki.skill.sc-kintoki-3', abilityId: 'sc-kintoki-3.golden-eater' },
    { family: 'conversion-magic', path: 'data/authoring/masters/master.irisviel.json', archiveId: 'master.irisviel', cardId: 'master.irisviel.skill.conversion-magic', abilityId: 'conversion-magic.preparation' },
  ];
  const seeds = definitions.map(source => {
    const archive = JSON.parse(git(root, ['show', `${diagnosticCandidateSha}:${source.path}`]).toString('utf8'));
    const ability = archive.cards.find((card: any) => card.id === source.cardId).abilities.find((item: any) => item.id === source.abilityId);
    return { source: { archiveId: source.archiveId, cardId: source.cardId, abilityId: source.abilityId, abilitySha256: hash(`${JSON.stringify(ability)}\n`) }, family: source.family };
  });
  const fixture = (seed: number, id: string, category: string, routeCandidate: boolean, eligible: boolean, compilation: string, mutations: any[] = [], renameIdentity?: any) => ({
    id, ...seeds[seed], category, mutations, ...(renameIdentity ? { renameIdentity } : {}),
    expected: {
      runtime: { routeCandidate, exactEligible: eligible },
      compiler: { compileOutcome: compilation },
      inventory: { routeCandidate, exactEligible: eligible }, coverage: { exactEligible: eligible },
    },
  });
  return {
    schemaVersion: 'fd-p3-b11-parity-fixtures-v1',
    references: [
      ...definitions.map(source => reference(root, diagnosticCandidateSha, source.path, source.abilityId)),
      reference(root, diagnosticCandidateSha, 'docs/plans/2026-09-12-p3-b11-result-binding-production-bridge-design.md', '## Fail-Closed And Legacy Boundary'),
    ],
    fixtures: [
      fixture(0, 'golden-positive', 'positive', true, true, 'ACCEPT'),
      fixture(0, 'golden-renamed-identities', 'identity-variation', true, true, 'ACCEPT', [], { cardId: 'diagnostic.golden.source', abilityId: 'diagnostic.golden.binding' }),
      fixture(0, 'golden-invalid-result-field', 'owned-malformed', true, false, 'REJECT', [{ path: 'effects.1.branches.0.then.0.amount.args.0.field', value: 'unavailableCount' }]),
      fixture(0, 'golden-missing-target-reference', 'owned-malformed', true, false, 'REJECT', [{ path: 'effects.0.target', value: 'missingTarget' }]),
      fixture(0, 'golden-wrong-payment', 'owned-malformed', true, false, 'REJECT', [{ path: 'effects.2.amount', value: 8 }]),
      fixture(0, 'golden-outside-combat', 'outside-scope', false, false, 'ACCEPT', [{ path: 'activation.phase', value: 'action' }, { path: 'activation.opens', value: 'controller_action_window' }]),
      fixture(1, 'conversion-positive', 'positive', true, true, 'ACCEPT'),
      fixture(1, 'conversion-renamed-identities', 'identity-variation', true, true, 'ACCEPT', [], { cardId: 'diagnostic.conversion.source', abilityId: 'diagnostic.conversion.binding' }),
      fixture(1, 'conversion-unknown-binding', 'owned-malformed', true, false, 'REJECT', [{ path: 'effects.1.amount.var', value: 'missingBinding' }]),
      fixture(1, 'conversion-outside-advance', 'outside-scope', false, false, 'ACCEPT', [{ path: 'activation.phase', value: 'action' }]),
    ],
  };
}

export function buildTaskInput(root: string) {
  const boundaries = [
    { adapter: 'b11-v1', role: 'B', taskId: 'P3-E08-B11-RESULT-BINDING-CURRENT-MAIN-REPLAY', scope: 'RESULT_BINDING_B11', baseSha: sourceMainSha, candidateSha: '7868b82949e3e17e64218755e0efe3ed478ff778' },
    { adapter: 'shared-socket-v1', role: 'B', taskId: 'P3-E08-SHARED-SOCKET-LIFECYCLE-FIX', scope: 'SHARED_SOCKET_LIFECYCLE', baseSha: '7868b82949e3e17e64218755e0efe3ed478ff778', candidateSha: 'd13ab485dc54398581568a5a66bd696d4459862d' },
    { adapter: 'a-coverage-v1', role: 'A', taskId: 'P3-E08-B11-COVERAGE-EVIDENCE-SYNC', scope: 'COVERAGE_EVIDENCE', baseSha: 'd13ab485dc54398581568a5a66bd696d4459862d', candidateSha: combinationSha },
  ];
  return {
    schemaVersion: 'fd-p3-task-check-v1', taskId: 'P3-E08-B11-COMBINATION-READINESS', controlEpoch: 'FD-P3-2026-09-23-08',
    baseSha: sourceMainSha, candidateSha: combinationSha,
    contract: reference(root, publicationSha, 'docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md', '## phase3:preflight'),
    segments: boundaries.map(segment => ({ ...segment,
      authorizedPaths: changedPaths(root, segment.baseSha, segment.candidateSha),
      record: reference(root, segment.candidateSha, segment.adapter === 'a-coverage-v1' ? 'artifacts/phase3-e08-b11-coverage-sync.json' : `docs/agents/manifests/tasks/${segment.taskId}.json`),
      references: [reference(root, segment.candidateSha, 'docs/rules/FD-Game-Rules-Final.md', '### 1.2')],
      dependencies: [{ taskId: segment.taskId, candidateSha: segment.candidateSha, state: 'PENDING' }],
    })),
    checks: [
      { id: 'b11-component-scenario', command: 'npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/regression/production-resolution-bridge.test.ts', state: 'PENDING', testedSha: combinationSha },
      { id: 'socket-boundary', command: 'npm run test --workspace @fd/server -- src/match-server.test.ts', state: 'PENDING', testedSha: combinationSha },
      { id: 'browser', command: 'npx playwright test e2e/fd-golden-eater-result-binding.spec.ts e2e/fd-conversion-magic-core-primitive.spec.ts --repeat-each=5', state: 'PENDING', testedSha: combinationSha },
    ],
  };
}

export function buildParityInput(root: string, fixtureCommit: string, adapterCommit = fixtureCommit) {
  sha(fixtureCommit, '--fixture-commit');
  return {
    schemaVersion: 'fd-p3-contract-parity-v1', taskId: 'P3-E08-B11-CONTRACT-PARITY', controlEpoch: 'FD-P3-2026-09-23-08',
    contractId: 'B11_RESULT_BINDING_DIAGNOSTIC_V1', contractVersion: 1, adapterVersion: 'b11-api-observations-v1', candidateSha: diagnosticCandidateSha,
    executionAdapter: adapterClosurePaths.map(path => reference(root, adapterCommit, path)),
    contract: reference(root, publicationSha, 'docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md', '## phase3:contract-parity'),
    fixtures: reference(root, fixtureCommit, fixturePath),
    owners: {
      runtime: { required: true, meaning: 'Candidate exported structural ownership and exact semantic eligibility for both shapes; Conversion ownership checks phase/window/envelope and ordered effect types, never binding validity; malformed bindings are owned and exact-ineligible' },
      compiler: { required: true, meaning: 'compileExecutableCardPack ACCEPT/REJECT only; neither ownership nor exact family eligibility inferred' },
      inventory: { required: true, meaning: 'classifyB11InventoryAbility evaluates raw authoring structural envelope and exact target/effect/binding shape; Conversion binding declarations and references are validated only in exactEligible, not ownership; does not consume runtime/compiler/fixture verdicts' },
      coverage: { required: true, meaning: 'classifyB11CoverageEligibility evaluates raw authoring exact shape using the shared read-only diagnostic contract; retain separate actual classifyAbilityForCoverage taxonomy without changing KPI' },
    },
    expectationReview: { state: 'PENDING' },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve('.');
  if (process.argv.includes('--fixtures-only')) {
    writeFileSync(resolve(root, fixturePath), `${JSON.stringify(buildFixtures(root), null, 2)}\n`);
  } else {
    const args = parseArgs(process.argv.slice(2), ['--fixture-commit', '--adapter-commit'], ['--fixture-commit', '--adapter-commit']);
    writeFileSync(resolve(root, 'scripts/fixtures/phase3-b11-task-check.json'), `${JSON.stringify(buildTaskInput(root), null, 2)}\n`);
    writeFileSync(resolve(root, 'scripts/fixtures/phase3-b11-parity-contract.json'), `${JSON.stringify(buildParityInput(root, args['--fixture-commit'], args['--adapter-commit']), null, 2)}\n`);
  }
}
