import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { hash, InputError, type Obj } from './phase3-tooling-common';
import { verifyDependencyClosure } from './phase3-contract-parity';

function setValue(value: Obj, path: string, replacement: unknown): void {
  const parts = path.split('.');
  if (parts.some(part => !part || ['__proto__', 'prototype', 'constructor'].includes(part))) throw new InputError('Unsafe fixture mutation');
  let parent: any = value;
  for (const part of parts.slice(0, -1)) {
    if (!parent || !Object.hasOwn(parent, part)) throw new InputError(`Fixture mutation path missing: ${path}`);
    parent = parent[part];
  }
  const last = parts.at(-1)!;
  if (!parent || !Object.hasOwn(parent, last)) throw new InputError(`Fixture mutation field missing: ${path}`);
  parent[last] = structuredClone(replacement);
}

function rename(value: any, identities: Record<string, string>): any {
  if (typeof value === 'string') return identities[value] ?? value;
  if (Array.isArray(value)) return value.map(child => rename(child, identities));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [identities[key] ?? key, rename(child, identities)]));
  return value;
}

export async function collectCandidateObservations(snapshot: string, fixtures: Obj) {
  const api = async (path: string): Promise<Obj> => import(pathToFileURL(resolve(snapshot, path)).href);
  const runtime = await api('packages/rules/src/ability/resolution-dataflow.ts');
  const interpreter = await api('packages/rules/src/ability/interpreter.ts');
  const compiler = await api('packages/rules/src/ability/executable-card-pack.ts');
  const loader = await api('packages/rules/src/ability/loader.ts');
  const coverage = await api('scripts/phase3-coverage.ts');
  const content = await api('packages/content/src/playtest-pack-loader.ts');
  const pack = content.loadPlaytestContentPack(resolve(snapshot, 'data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: snapshot });
  const baseLibrary = content.compileLoadedPlaytestPack(pack).library;
  const results = [];
  for (const fixture of fixtures.fixtures) {
    let library = structuredClone(baseLibrary);
    let archive = library.rules.archives.find((item: Obj) => item.id === fixture.source.archiveId);
    let card = archive?.cards.find((item: Obj) => item.id === fixture.source.cardId);
    let ability = card?.abilities.find((item: Obj) => item.id === fixture.source.abilityId);
    if (!ability || hash(`${JSON.stringify(ability)}\n`) !== fixture.source.abilitySha256) throw new InputError(`Canonical fixture seed mismatch: ${fixture.id}`);
    for (const mutation of fixture.mutations) setValue(ability, mutation.path, mutation.value);
    if (fixture.renameIdentity) {
      library = rename(library, { [card.id]: fixture.renameIdentity.cardId, [ability.id]: fixture.renameIdentity.abilityId });
      archive = library.rules.archives.find((item: Obj) => item.id === fixture.source.archiveId);
      card = archive.cards.find((item: Obj) => item.id === fixture.renameIdentity.cardId);
      ability = card.abilities.find((item: Obj) => item.id === fixture.renameIdentity.abilityId);
    }
    const observations: Obj = {};
    const loaded = loader.loadAuthoringJson(archive);
    const normalized = loaded.cards[card.id]?.abilities.find((item: Obj) => item.id === ability.id);
    const rawCalls: Obj = {};
    if (normalized && fixture.family === 'golden-eater') {
      observations.runtime = {
        evaluationStatus: 'EVALUATED',
        routeCandidate: runtime.isResultBindingProductionBridgeRouteCandidate(normalized),
        exactEligible: runtime.isResultBindingProductionBridgeSemantic(normalized),
      };
      rawCalls.runtime = ['isResultBindingProductionBridgeRouteCandidate', 'isResultBindingProductionBridgeSemantic'];
    } else if (normalized && fixture.family === 'conversion-magic') {
      observations.runtime = { evaluationStatus: 'PARTIALLY_EVALUATED', routeCandidate: null, exactEligible: interpreter.isCardZoneCoreDirectActionSemantic(normalized),
        unavailable: { routeCandidate: 'No exported structural routeCandidate API for Conversion Magic; private helper not copied' } };
      rawCalls.runtime = ['isCardZoneCoreDirectActionSemantic'];
    } else {
      observations.runtime = { evaluationStatus: 'NOT_EVALUATED', routeCandidate: null, exactEligible: null, unavailable: {
        routeCandidate: 'Authoring normalization produced no comparable ability', exactEligible: 'Authoring normalization produced no comparable ability',
      } };
    }
    try {
      const compiled = compiler.compileExecutableCardPack(library);
      observations.compiler = { evaluationStatus: 'EVALUATED_COMPILE_ONLY', compileOutcome: 'ACCEPT', definitionHash: compiled.definitionHash, routeCandidate: null, exactEligible: null,
        unavailable: { routeCandidate: 'Executable compiler exports compilation, not standalone route classification', exactEligible: 'Compilation acceptance is not family eligibility' } };
    } catch (error) {
      observations.compiler = { evaluationStatus: 'EVALUATED_COMPILE_ONLY', compileOutcome: 'REJECT', error: String(error), routeCandidate: null, exactEligible: null,
        unavailable: { routeCandidate: 'Executable compiler exports compilation, not standalone route classification', exactEligible: 'Compilation rejection is not structural ownership' } };
    }
    rawCalls.compiler = ['compileExecutableCardPack'];
    const row = coverage.classifyAbilityForCoverage(archive.id, card.id, ability);
    observations.coverage = { evaluationStatus: 'NOT_EVALUATED_EXACT_ELIGIBILITY_RAW_CLASSIFICATION_RETAINED', runtimeRoute: row.runtimeRoute, semanticRoutes: row.semanticRoutes, routeCandidate: null, exactEligible: null,
      unavailable: { routeCandidate: 'Coverage route taxonomy is broader than B11 structural ownership', exactEligible: 'Coverage API does not expose exact B11 eligibility; raw classifications retained' } };
    rawCalls.coverage = ['classifyAbilityForCoverage'];
    observations.inventory = { evaluationStatus: 'NOT_EVALUATED', routeCandidate: null, exactEligible: null,
      unavailable: { routeCandidate: 'No B11 inventory classification API; Card Zone CLI belongs to a different family', exactEligible: 'No B11 inventory classification API; do not reuse runtime or coverage observations' } };
    results.push({ fixtureId: fixture.id, family: fixture.family, category: fixture.category,
      executedInputSha256: hash(`${JSON.stringify({ archiveId: archive.id, cardId: card.id, ability })}\n`),
      fixtureSha256: hash(`${JSON.stringify(fixture)}\n`), actualCardId: card.id, actualAbilityId: ability.id,
      normalizationReport: loaded.report, observations, apiCalls: rawCalls });
  }
  return results;
}

if (process.argv[2] === '--snapshot') {
  try {
    const snapshot = resolve(process.argv[3]);
    const fixtures = JSON.parse(readFileSync(resolve(process.argv[4]), 'utf8'));
    const bindingPath = resolve(process.argv[5]);
    const executionAdapter = JSON.parse(readFileSync(bindingPath, 'utf8'));
    const adapterRoot = resolve(bindingPath, '..');
    for (const file of executionAdapter.files) {
      if (hash(readFileSync(resolve(adapterRoot, file.path))) !== file.sha256) throw new InputError(`Execution adapter digest mismatch: ${file.path}`);
    }
    process.chdir(snapshot);
    await verifyDependencyClosure(snapshot, executionAdapter.dependencyBinding.closure);
    const results = await collectCandidateObservations(snapshot, fixtures);
    await verifyDependencyClosure(snapshot, executionAdapter.dependencyBinding.closure);
    process.stdout.write(`${JSON.stringify({ schemaVersion: 'fd-p3-parity-execution-v1', executionAdapter,
      nodeVersion: process.version, nodeSha256: hash(readFileSync(process.execPath)), results })}\n`);
  } catch (error) { process.stderr.write(`${String(error)}\n`); process.exitCode = 1; }
}
