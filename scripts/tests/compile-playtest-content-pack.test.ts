import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { compilePlaytestContentPack } from '../compile-playtest-content-pack';

const temporaryDirectories: string[] = [];
const tsxCliArguments = [
  resolve('node_modules/tsx/dist/cli.mjs'),
  resolve('scripts/compile-playtest-content-pack.ts'),
];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('compile playtest content pack CLI', () => {
  it('runs through the real tsx CLI entry point', () => {
    const output = execFileSync(
      process.execPath,
      [
        ...tsxCliArguments,
        '--pack',
        'data/packs/fd-playtest-v1/pack.json',
        '--validate-only',
      ],
      { cwd: resolve('.'), encoding: 'utf8' },
    );

    expect(output.trim()).toBe('7 masters, 7 servants, 20 events, 0 blocking issues');
  });

  it('rejects invalid source asset validation modes', () => {
    const result = spawnSync(
      process.execPath,
      [
        ...tsxCliArguments,
        '--pack',
        'data/packs/fd-playtest-v1/pack.json',
        '--validate-only',
        '--source-assets',
        'typo',
      ],
      { cwd: resolve('.'), encoding: 'utf8' },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Invalid --source-assets mode "typo"');
  });

  it('rejects missing source asset validation mode values', () => {
    const result = spawnSync(
      process.execPath,
      [
        ...tsxCliArguments,
        '--pack',
        'data/packs/fd-playtest-v1/pack.json',
        '--validate-only',
        '--source-assets',
      ],
      { cwd: resolve('.'), encoding: 'utf8' },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('--source-assets requires one of: required, metadata_only');
  });

  it('writes deterministic library, fixture and evidence artifacts without absolute paths', () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), 'fd-playtest-compile-'));
    temporaryDirectories.push(outputDirectory);
    const options = {
      packPath: resolve('data/packs/fd-playtest-v1/pack.json'),
      outputDirectory,
      workspaceRoot: resolve('.'),
    };

    const first = compilePlaytestContentPack(options);
    const firstLibrary = readFileSync(first.outputPaths.library, 'utf8');
    const firstFixture = readFileSync(first.outputPaths.fixture, 'utf8');
    const firstEvidence = readFileSync(first.outputPaths.evidence, 'utf8');

    const second = compilePlaytestContentPack(options);

    expect(readFileSync(second.outputPaths.library, 'utf8')).toBe(firstLibrary);
    expect(readFileSync(second.outputPaths.fixture, 'utf8')).toBe(firstFixture);
    expect(readFileSync(second.outputPaths.evidence, 'utf8')).toBe(firstEvidence);
    expect(first.summary).toEqual({ masters: 7, servants: 7, events: 20, blockingIssues: 0 });
    expect(JSON.parse(firstLibrary).rules).toMatchObject({
      schemaVersion: 'fd-executable-card-pack-v1',
      definitionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(firstLibrary).not.toContain(resolve('.'));
    expect(firstFixture).not.toContain(resolve('.'));
    expect(firstEvidence).not.toContain(resolve('.'));
  });
});
