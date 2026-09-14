import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import type { ReferenceLock, VerifiedReference } from './types';

export type { ReferenceLock, VerifiedReference } from './types';

export const LOCKED_REFERENCE: ReferenceLock = {
  repository: 'https://github.com/fengling20011118-dotcom/fate-domination.git',
  commit: 'b2f9fa15fba07c63530bbf4612b03b8b704755f9',
  requiredFiles: [
    'docs/skill-audit.json',
    'docs/skill-rule-programs.json',
    'src/content/confirmed-skill-overrides.ts',
    'src/content/authoring/cards.json',
    'src/content/generated/legacy-content.json',
  ],
};

function git(root: string, ...args: string[]): string {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new Error('Reference root is not a usable Git checkout.');
  }
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function portableRelativePath(path: string): string {
  return path.split(sep).join('/');
}

function isInsideRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (!isAbsolute(rel) && !rel.startsWith(`..${sep}`) && rel !== '..');
}

function resolveLocalImport(root: string, importer: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;

  const base = resolve(dirname(importer), specifier);
  const candidates = extname(base)
    ? [base]
    : [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.mts`,
        `${base}.cts`,
        `${base}.json`,
        resolve(base, 'index.ts'),
        resolve(base, 'index.tsx'),
      ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    if (!statSync(candidate).isFile()) continue;
    if (!isInsideRoot(root, candidate)) {
      throw new Error(`Reference input imports a local file outside the checkout: ${specifier}`);
    }
    return candidate;
  }

  throw new Error(`Required Reference dependency is missing for import: ${specifier}`);
}

function discoverReferenceInputClosure(root: string, requiredFiles: string[]): string[] {
  const rootAbsolute = resolve(root);
  const ordered = [...requiredFiles];
  const seen = new Set(ordered);
  const queue = [...ordered];

  while (queue.length > 0) {
    const relativePath = queue.shift()!;
    const absolutePath = resolve(rootAbsolute, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Required Reference input is missing: ${relativePath}`);
    }

    if (!/\.(?:[cm]?ts|tsx)$/i.test(relativePath)) continue;
    const source = readFileSync(absolutePath, 'utf8');
    const imports = ts.preProcessFile(source, true, true).importedFiles.map((entry) => entry.fileName);

    for (const specifier of imports) {
      const dependency = resolveLocalImport(rootAbsolute, absolutePath, specifier);
      if (!dependency) continue;
      const dependencyRelative = portableRelativePath(relative(rootAbsolute, dependency));
      if (seen.has(dependencyRelative)) continue;
      seen.add(dependencyRelative);
      ordered.push(dependencyRelative);
      queue.push(dependencyRelative);
    }
  }

  return ordered;
}

export function verifyReferenceRootAgainst(root: string, lock: ReferenceLock): VerifiedReference {
  const repository = git(root, 'config', '--get', 'remote.origin.url');
  if (repository !== lock.repository) {
    throw new Error(`Reference repository mismatch: expected ${lock.repository}, got ${repository || '<missing>'}`);
  }

  const commit = git(root, 'rev-parse', 'HEAD');
  if (commit !== lock.commit) {
    throw new Error(`Reference commit mismatch: expected ${lock.commit}, got ${commit}`);
  }

  const status = git(root, 'status', '--porcelain');
  if (status.length > 0) {
    throw new Error('Reference checkout is dirty; FS00 requires a clean read-only input checkout.');
  }

  const requiredFiles = discoverReferenceInputClosure(root, lock.requiredFiles);
  const inputDigests: Record<string, string> = {};

  for (const relativePath of requiredFiles) {
    const absolutePath = resolve(root, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Required Reference input is missing: ${relativePath}`);
    }
    inputDigests[relativePath] = sha256(absolutePath);
  }

  return {
    repository: lock.repository,
    commit: lock.commit,
    requiredFiles,
    inputDigests,
  };
}

export function verifyReferenceRoot(root: string): VerifiedReference {
  return verifyReferenceRootAgainst(root, LOCKED_REFERENCE);
}

function parseReferenceRoot(args: string[]): string {
  const index = args.indexOf('--reference-root');
  const root = index >= 0 ? args[index + 1] : undefined;
  if (!root || root.startsWith('--')) {
    throw new Error('Usage: phase3:reference:verify -- --reference-root <clean-reference-checkout>');
  }
  return root;
}

function main(): void {
  const root = parseReferenceRoot(process.argv.slice(2));
  const result = verifyReferenceRoot(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));

if (invokedPath === modulePath) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
