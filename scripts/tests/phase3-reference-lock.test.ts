import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  verifyReferenceRootAgainst,
  type ReferenceLock,
} from '../phase3-reference/verify-reference';

const temporaryDirectories: string[] = [];
const repositoryUrl = 'https://github.com/example/reference.git';
const requiredFiles = [
  'docs/skill-rule-programs.json',
  'src/content/confirmed-skill-overrides.ts',
  'src/content/authoring/cards.json',
  'src/content/generated/legacy-content.json',
];

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
}

function createReferenceFixture(): { root: string; lock: ReferenceLock } {
  const root = mkdtempSync(join(tmpdir(), 'fd-phase3-reference-'));
  temporaryDirectories.push(root);

  git(root, 'init');
  git(root, 'config', 'user.email', 'phase3-test@example.invalid');
  git(root, 'config', 'user.name', 'Phase 3 Test');
  git(root, 'remote', 'add', 'origin', repositoryUrl);

  for (const relativePath of requiredFiles) {
    const path = join(root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${relativePath}\n`, 'utf8');
  }

  git(root, 'add', '.');
  git(root, 'commit', '-m', 'reference fixture');

  return {
    root,
    lock: {
      repository: repositoryUrl,
      commit: git(root, 'rev-parse', 'HEAD'),
      requiredFiles,
    },
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Phase 3 locked Reference verifier', () => {
  it('verifies repository, exact commit, clean checkout, required files, and SHA-256 digests', () => {
    const { root, lock } = createReferenceFixture();

    const result = verifyReferenceRootAgainst(root, lock);

    expect(result.repository).toBe(repositoryUrl);
    expect(result.commit).toBe(lock.commit);
    expect(result.requiredFiles).toEqual(requiredFiles);
    expect(Object.keys(result.inputDigests)).toEqual(requiredFiles);
    expect(Object.values(result.inputDigests).every((digest) => /^[a-f0-9]{64}$/.test(digest))).toBe(true);
  });

  it('rejects the wrong commit', () => {
    const { root, lock } = createReferenceFixture();

    expect(() =>
      verifyReferenceRootAgainst(root, {
        ...lock,
        commit: '0000000000000000000000000000000000000000',
      }),
    ).toThrow(/commit/i);
  });

  it('rejects a dirty checkout', () => {
    const { root, lock } = createReferenceFixture();
    writeFileSync(join(root, requiredFiles[0]), 'dirty\n', 'utf8');

    expect(() => verifyReferenceRootAgainst(root, lock)).toThrow(/dirty/i);
  });

  it('rejects a non-Git directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'fd-phase3-not-git-'));
    temporaryDirectories.push(root);

    expect(() =>
      verifyReferenceRootAgainst(root, {
        repository: repositoryUrl,
        commit: '0000000000000000000000000000000000000000',
        requiredFiles,
      }),
    ).toThrow(/git/i);
  });

  it('rejects missing required Reference inputs', () => {
    const { root, lock } = createReferenceFixture();

    expect(() =>
      verifyReferenceRootAgainst(root, {
        ...lock,
        requiredFiles: [...lock.requiredFiles, 'missing/required-input.json'],
      }),
    ).toThrow(/required/i);
  });

  it('returns portable metadata without leaking the local absolute Reference path', () => {
    const { root, lock } = createReferenceFixture();

    const serialized = JSON.stringify(verifyReferenceRootAgainst(root, lock));

    expect(serialized).not.toContain(root);
    expect(serialized).toContain(repositoryUrl);
  });
});
