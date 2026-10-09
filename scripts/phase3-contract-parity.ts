import { execFile } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { ancestor, array, cliError, commitExists, fields, git, gitText, hash, InputError, inputFile, json, object, output, parseArgs, parseReference, readReference, sha, string, type Issue, type Obj } from './phase3-tooling-common';

export const adapterClosurePaths = ['scripts/phase3-contract-parity.ts', 'scripts/phase3-contract-parity-worker.ts', 'scripts/phase3-tooling-common.ts'];
const execute = promisify(execFile);

// Bind the entire installed tree, a superset of the loader's transitive imports
// and native binaries. Directory links may only point into this isolated checkout.
export async function dependencyClosure(root: string) {
  const entries: { path: string; sha256?: string; target?: string }[] = [];
  let visited = 0;
  const walk = async (path: string) => {
    if (++visited % 64 === 0) await new Promise<void>(resume => setImmediate(resume));
    const name = relative(root, path).replaceAll('\\', '/');
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      const target = relative(root, realpathSync(path));
      if (isAbsolute(target) || target === '..' || target.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
        throw new InputError(`Dependency link escapes isolated checkout: ${name}`);
      }
      entries.push({ path: name, target: target.replaceAll('\\', '/') });
      if (lstatSync(realpathSync(path)).isFile()) entries.push({ path: `${name}:content`, sha256: hash(readFileSync(path)) });
    } else if (stat.isDirectory()) {
      for (const child of readdirSync(path).sort()) await walk(join(path, child));
    } else if (stat.isFile()) entries.push({ path: name, sha256: hash(readFileSync(path)) });
    else throw new InputError(`Unsupported dependency entry: ${name}`);
  };
  await walk(join(root, 'node_modules'));
  return { sha256: hash(JSON.stringify(entries)), fileCount: entries.length };
}

export async function verifyDependencyClosure(root: string, expected: Awaited<ReturnType<typeof dependencyClosure>>) {
  if (JSON.stringify(await dependencyClosure(root)) !== JSON.stringify(expected)) throw new InputError('Execution dependency closure drift');
}

export function verifyAdapterClosure(root: string, raw: unknown, issues: Issue[]) {
  const refs = array(raw, 'executionAdapter');
  const parsed = refs.map((ref, index) => parseReference(ref, `executionAdapter[${index}]`));
  if (parsed.length !== adapterClosurePaths.length || new Set(parsed.map(ref => ref.path)).size !== parsed.length ||
      adapterClosurePaths.some(path => !parsed.some(ref => ref.path === path)) || new Set(parsed.map(ref => ref.commit)).size !== 1) {
    throw new InputError('Execution adapter must bind the complete controller/worker/common closure at one exact commit');
  }
  const files = parsed.map(ref => {
    const bytes = readReference(root, ref, issues);
    if (bytes) {
      try {
        const localObject = gitText(root, ['hash-object', `--path=${ref.path}`, ref.path]);
        if (localObject !== gitText(root, ['rev-parse', `${ref.commit}:${ref.path}`])) throw new Error('Local adapter content differs from bound Git blob');
      } catch (error) { issues.push({ code: 'EXECUTION_ADAPTER_DRIFT', path: ref.path, message: String(error) }); }
    }
    return { ref, bytes };
  });
  return { commit: parsed[0].commit, files };
}

const ownerNames = ['runtime', 'compiler', 'inventory', 'coverage'];
const requiredFields: Record<string, string[]> = {
  runtime: ['routeCandidate', 'exactEligible'], compiler: ['compileOutcome'],
  inventory: ['routeCandidate', 'exactEligible'], coverage: ['exactEligible'],
};

export function parseParityInput(raw: unknown): Obj {
  const input = object(raw, 'contract');
  fields(input, ['schemaVersion', 'taskId', 'controlEpoch', 'contractId', 'contractVersion', 'adapterVersion', 'executionAdapter', 'candidateSha', 'contract', 'fixtures', 'owners', 'expectationReview'], 'contract');
  if (input.schemaVersion !== 'fd-p3-contract-parity-v1' || input.contractVersion !== 1 || input.adapterVersion !== 'b11-api-observations-v1' ||
      input.contractId !== 'B11_RESULT_BINDING_DIAGNOSTIC_V1' || input.taskId !== 'P3-E08-B11-CONTRACT-PARITY' || input.controlEpoch !== 'FD-P3-2026-09-23-08') {
    throw new InputError('Unsupported parity contract/task/epoch/adapter');
  }
  sha(input.candidateSha, 'candidateSha');
  for (const ref of array(input.executionAdapter, 'executionAdapter')) parseReference(ref, 'executionAdapter');
  parseReference(input.contract, 'contract', true); parseReference(input.fixtures, 'fixtures');
  const owners = object(input.owners, 'owners');
  fields(owners, ownerNames, 'owners');
  for (const owner of ownerNames) {
    const declaration = object(owners[owner], owner);
    fields(declaration, ['required', 'meaning'], owner);
    if (declaration.required !== true) throw new InputError(`${owner}: version 1 requires all applicable owner observations; no waiver switch`);
    string(declaration.meaning, `${owner}.meaning`);
  }
  const review = object(input.expectationReview, 'expectationReview');
  fields(review, ['state', 'artifact'], 'expectationReview');
  if (!['PENDING', 'ACCEPTED'].includes(review.state)) throw new InputError('Unsupported expectation review state');
  if (review.state === 'PENDING' && review.artifact !== undefined) throw new InputError('Pending fixture review cannot claim an artifact');
  if (review.state === 'ACCEPTED') parseReference(review.artifact, 'expectation review artifact');
  return input;
}

export function parseFixtures(raw: unknown): Obj {
  const input = object(raw, 'fixtures');
  fields(input, ['schemaVersion', 'references', 'fixtures'], 'fixtures');
  if (input.schemaVersion !== 'fd-p3-b11-parity-fixtures-v1') throw new InputError('Unsupported fixture schema');
  const references = array(input.references, 'references');
  if (!references.length) throw new InputError('Canonical/contract references required');
  for (const ref of references) parseReference(ref, 'fixture reference', true);
  const fixtures = array(input.fixtures, 'fixtures');
  const ids = new Set<string>();
  for (const rawFixture of fixtures) {
    const fixture = object(rawFixture, 'fixture');
    fields(fixture, ['id', 'family', 'category', 'source', 'mutations', 'renameIdentity', 'expected'], 'fixture');
    string(fixture.id, 'fixture.id');
    if (ids.has(fixture.id)) throw new InputError('Duplicate fixture ID');
    ids.add(fixture.id);
    if (!['golden-eater', 'conversion-magic'].includes(fixture.family) || !['positive', 'owned-malformed', 'outside-scope', 'identity-variation'].includes(fixture.category)) {
      throw new InputError('Unsupported fixture family/category');
    }
    const source = object(fixture.source, 'fixture source');
    fields(source, ['archiveId', 'cardId', 'abilityId', 'abilitySha256'], 'fixture source');
    for (const key of ['archiveId', 'cardId', 'abilityId']) string(source[key], `source.${key}`);
    if (!/^[0-9A-F]{64}$/.test(source.abilitySha256)) throw new InputError('Invalid canonical ability digest');
    for (const mutation of array(fixture.mutations, 'mutations')) {
      const value = object(mutation, 'mutation'); fields(value, ['path', 'value'], 'mutation'); string(value.path, 'mutation.path');
      if (!Object.hasOwn(value, 'value') || value.path.split('.').some((part: string) => !part || ['__proto__', 'prototype', 'constructor'].includes(part))) throw new InputError('Invalid/unsafe fixture mutation');
    }
    if (fixture.renameIdentity) {
      const rename = object(fixture.renameIdentity, 'renameIdentity'); fields(rename, ['cardId', 'abilityId'], 'renameIdentity');
      string(rename.cardId, 'renamed cardId'); string(rename.abilityId, 'renamed abilityId');
      if (rename.cardId === source.cardId || rename.abilityId === source.abilityId) throw new InputError('Identity variation must change both identities');
    }
    if (fixture.category === 'identity-variation' && !fixture.renameIdentity) throw new InputError('Identity fixture must vary identities');
    const expected = object(fixture.expected, 'expected'); fields(expected, ownerNames, 'expected');
    for (const owner of ownerNames) {
      const values = object(expected[owner], `expected.${owner}`);
      fields(values, requiredFields[owner], `expected.${owner}`);
      for (const field of requiredFields[owner]) {
        if (field === 'compileOutcome' ? !['ACCEPT', 'REJECT'].includes(values[field]) : typeof values[field] !== 'boolean') throw new InputError(`Missing/invalid expectation ${owner}.${field}`);
      }
    }
  }
  for (const category of ['positive', 'owned-malformed', 'outside-scope', 'identity-variation']) {
    if (!fixtures.some(fixture => fixture.category === category)) throw new InputError(`Required fixture category missing: ${category}`);
  }
  for (const family of ['golden-eater', 'conversion-magic']) {
    if (!fixtures.some(fixture => fixture.family === family && fixture.category === 'positive')) throw new InputError(`Required positive family fixture missing: ${family}`);
  }
  return input;
}

export function compareObservations(fixtures: Obj, results: Obj[], issues: Issue[]): void {
  if (new Set(results.map(row => row.fixtureId)).size !== results.length || results.length !== fixtures.fixtures.length) {
    issues.push({ code: 'EXECUTION_RECEIPT_SCOPE_MISMATCH', path: 'results', message: 'Missing/duplicate/extra execution fixtures' }); return;
  }
  for (const fixture of fixtures.fixtures) {
    const result = results.find(row => row.fixtureId === fixture.id);
    if (!result || result.fixtureSha256 !== hash(`${JSON.stringify(fixture)}\n`)) {
      issues.push({ code: 'EXECUTION_FIXTURE_DIGEST_MISMATCH', path: fixture.id, message: 'Receipt does not match executed fixture' }); continue;
    }
    for (const owner of ownerNames) for (const field of requiredFields[owner]) {
      const actual = result.observations[owner]?.[field];
      if (actual === null || actual === undefined) {
        issues.push({ code: 'REQUIRED_OBSERVATION_NOT_EVALUATED', path: `${fixture.id}:${owner}.${field}`, message: result.observations[owner]?.unavailable?.[field] ?? 'Comparable API unavailable' });
      } else if (actual !== fixture.expected[owner][field]) {
        issues.push({ code: 'API_EXPECTATION_DISAGREEMENT', path: `${fixture.id}:${owner}.${field}`, message: `actual=${JSON.stringify(actual)} declared=${JSON.stringify(fixture.expected[owner][field])}` });
      }
    }
  }
}

export async function runParity(root: string, raw: unknown, candidate: string, inputSha256: string) {
  const input = parseParityInput(raw); sha(candidate, '--candidate');
  const issues: Issue[] = [];
  const adapter = verifyAdapterClosure(root, input.executionAdapter, issues);
  if (!ancestor(root, candidate, adapter.commit)) issues.push({ code: 'EXECUTION_ADAPTER_LINEAGE_FAILED', path: adapter.commit, message: 'Adapter must descend from tested candidate' });
  const contract = parseReference(input.contract, 'contract', true);
  readReference(root, contract, issues);
  if (contract.commit !== 'e65503e601d7a3a4d1265d87a09484cb8295f2c2' || contract.path !== 'docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md' || contract.section !== '## phase3:contract-parity') {
    issues.push({ code: 'CONTRACT_REFERENCE_MISMATCH', path: contract.path, message: 'Wrong published minimum contract' });
  }
  if (input.candidateSha !== candidate) issues.push({ code: 'EXACT_SHA_MISMATCH', path: 'input.candidateSha', message: 'CLI/candidate mismatch' });
  if (!commitExists(root, candidate)) issues.push({ code: 'COMMIT_MISSING', path: candidate, message: 'Exact candidate unavailable' });
  const fixtureRef = parseReference(input.fixtures, 'fixtures');
  const fixtureBytes = readReference(root, fixtureRef, issues);
  if (!ancestor(root, candidate, fixtureRef.commit)) issues.push({ code: 'FIXTURE_PRODUCER_LINEAGE_FAILED', path: fixtureRef.commit, message: 'Fixture producer must descend from tested candidate' });
  const fixtures = fixtureBytes ? parseFixtures(json(fixtureBytes, 'fixture artifact')) : undefined;
  if (fixtures) for (const rawRef of fixtures.references) {
    const ref = parseReference(rawRef, 'fixture reference', true);
    readReference(root, ref, issues);
    if (ref.commit !== candidate) issues.push({ code: 'FIXTURE_SOURCE_STALE', path: ref.path, message: 'Canonical references must use tested candidate' });
  }
  const premiseSha256 = hash(`${JSON.stringify({ contractId: input.contractId, contractVersion: input.contractVersion,
    adapterVersion: input.adapterVersion, executionAdapter: input.executionAdapter, candidateSha: candidate, contract, fixtures: fixtureRef, owners: input.owners })}\n`);
  if (input.expectationReview.state === 'PENDING') issues.push({ code: 'EXPECTATIONS_NOT_INDEPENDENTLY_REVIEWED', path: 'expectationReview', message: 'Agreement is not an acceptance premise' });
  else {
    const ref = parseReference(input.expectationReview.artifact, 'expectation artifact');
    const bytes = readReference(root, ref, issues);
    if (!ancestor(root, fixtureRef.commit, ref.commit)) issues.push({ code: 'EXPECTATION_REVIEW_LINEAGE_FAILED', path: ref.commit, message: 'Review must descend from exact fixture producer' });
    if (bytes) {
      const review = json(bytes, 'expectation artifact');
      if (review.schemaVersion !== 'fd-p3-parity-expectation-review-v1' || review.verdict !== 'PASS' ||
          review.candidateSha !== candidate || review.premiseSha256 !== premiseSha256 ||
          review.reviewedFixtureCommit !== fixtureRef.commit || !/^(github:|Codex Reviewer )/.test(String(review.reviewer))) {
        issues.push({ code: 'EXPECTATION_REVIEW_BINDING_FAILED', path: ref.path, message: 'Independent review does not bind exact fixture/owner/SHA premise' });
      }
    }
  }
  let results: Obj[] = [];
  let executionDependencies: Obj | undefined;
  const sourceObjects: Record<string, string> = {};
  const blockingInput = issues.some(issue => !['EXPECTATIONS_NOT_INDEPENDENTLY_REVIEWED', 'EXPECTATION_REVIEW_BINDING_FAILED'].includes(issue.code)) || !fixtures || !fixtureBytes;
  if (!blockingInput && fixtures && fixtureBytes) {
    for (const path of ['packages', 'apps', 'scripts/phase3-coverage.ts', 'package.json', 'package-lock.json', 'tsconfig.json']) {
      const bound = gitText(root, ['rev-parse', `${candidate}:${path}`]);
      sourceObjects[path] = bound;
      // Tooling adds CLI scripts locally; installation reads package.json only
      // from the detached candidate, never from this controller checkout.
      if (path === 'package.json') continue;
      if (gitText(root, ['rev-parse', `HEAD:${path}`]) !== bound || gitText(root, ['diff', 'HEAD', '--', path]) || gitText(root, ['ls-files', '--others', '--exclude-standard', '--', path])) {
        throw new InputError(`Dependency provider differs from candidate: ${path}`);
      }
    }
    const temporary = mkdtempSync(join(tmpdir(), 'fd-b11-parity-'));
    try {
      // Git checkout preserves repository Unicode paths on Windows, unlike system tar.
      await execute('git', ['clone', '--shared', '--no-checkout', '--', root, temporary]);
      await execute('git', ['checkout', '--detach', candidate], { cwd: temporary });
      const environment = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', TSX_DISABLE_CACHE: '1',
        ESBUILD_BINARY_PATH: '', TSX_TSCONFIG_PATH: join(temporary, 'tsconfig.json') };
      const npmCli = process.env.npm_execpath && process.env.npm_execpath.endsWith('npm-cli.js')
        ? process.env.npm_execpath : join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
      await execute(process.execPath, [npmCli, 'ci', '--ignore-scripts', '--include=dev', '--include=optional',
        '--no-audit', '--no-fund', '--cache', join(temporary, 'npm-cache')], {
        cwd: temporary, env: environment, timeout: 120_000, maxBuffer: 32 * 1024 * 1024,
      });
      const dependencyBinding = {
        lockfileSha256: hash(readFileSync(join(temporary, 'package-lock.json'))),
        closure: await dependencyClosure(temporary), nodeVersion: process.version,
        nodeSha256: hash(readFileSync(process.execPath)), npmCliSha256: hash(readFileSync(npmCli)),
      };
      if (dependencyBinding.lockfileSha256 !== hash(git(root, ['show', `${candidate}:package-lock.json`]))) {
        throw new InputError('Isolated installation changed bound lockfile');
      }
      const adapterBinding = { commit: adapter.commit, files: adapter.files.map(({ ref }) => ({ path: ref.path, sha256: ref.sha256 })) };
      const adapterRoot = join(temporary, 'execution-adapter');
      for (const { ref, bytes } of adapter.files) {
        const path = join(adapterRoot, ref.path); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes!);
      }
      const bindingPath = join(adapterRoot, 'binding.json'); writeFileSync(bindingPath, JSON.stringify({ ...adapterBinding, dependencyBinding }));
      const loaderPath = join(temporary, 'node_modules/tsx/dist/loader.mjs');
      const fixtureFile = join(temporary, 'executed-fixtures.json'); writeFileSync(fixtureFile, fixtureBytes);
      const execution = await execute(process.execPath, ['--import', pathToFileURL(loaderPath).href,
        join(adapterRoot, 'scripts/phase3-contract-parity-worker.ts'), '--snapshot', temporary, fixtureFile, bindingPath], {
        cwd: temporary, env: environment, timeout: 120_000, maxBuffer: 32 * 1024 * 1024,
      });
      const receipt = json(execution.stdout, 'execution receipt');
      if (receipt.schemaVersion !== 'fd-p3-parity-execution-v1') throw new Error('Unexpected execution receipt');
      if (JSON.stringify(receipt.executionAdapter) !== JSON.stringify({ ...adapterBinding, dependencyBinding }) ||
          receipt.nodeVersion !== dependencyBinding.nodeVersion || receipt.nodeSha256 !== dependencyBinding.nodeSha256) throw new Error('Execution adapter/dependency receipt binding mismatch');
      await verifyDependencyClosure(temporary, dependencyBinding.closure);
      executionDependencies = dependencyBinding;
      results = array(receipt.results, 'execution results');
      compareObservations(fixtures, results, issues);
    } finally {
      if (!resolve(temporary).startsWith(`${resolve(tmpdir())}\\`) && !resolve(temporary).startsWith(`${resolve(tmpdir())}/`)) throw new Error('Unsafe temporary cleanup path');
      await rm(temporary, { recursive: true, force: true });
    }
  }
  return { schemaVersion: 'fd-p3-contract-parity-result-v1', taskId: input.taskId, controlEpoch: input.controlEpoch,
    status: issues.length ? 'FAIL' : 'PASS', testedCandidateSha: candidate, inputSha256, premiseSha256,
    fixtureBinding: fixtureRef, executionAdapter: { commit: adapter.commit, files: adapter.files.map(({ ref }) => ref) }, sourceObjects, executionDependencies, executionPerformed: results.length > 0,
    executionMethod: results.length ? 'ISOLATED_SHARED_GIT_CLONE_REAL_API_SUBPROCESS' : 'NOT_EXECUTED_INPUT_REJECTED',
    dependencyProvider: 'ISOLATED_NPM_CI_BOUND_LOCKFILE; COMPLETE_INSTALLED_TREE_AND_NODE_IDENTITY_BOUND',
    results, issues, acceptanceGranted: false, effectCorrectnessVerified: false, fallbackClosureVerified: false, browserAcceptanceVerified: false };
}

export async function runParityCli(argv: string[], root = resolve('.')): Promise<void> {
  const args = parseArgs(argv, ['--contract', '--candidate', '--out'], ['--contract', '--candidate']);
  const input = inputFile(args['--contract']);
  const result = await runParity(root, input.value, args['--candidate'], input.sha256);
  output(result, args['--out']); process.exitCode = result.status === 'PASS' ? 0 : 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runParityCli(process.argv.slice(2)).catch(cliError);
}
