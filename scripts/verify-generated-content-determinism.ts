import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, resolve } from 'node:path';

import { compilePlaytestContentPack } from './compile-playtest-content-pack';

const workspaceRoot = resolve('.');
const checkedInDirectory = resolve(workspaceRoot, 'data/generated');
const firstDirectory = mkdtempSync(resolve(tmpdir(), 'fd-generated-first-'));
const secondDirectory = mkdtempSync(resolve(tmpdir(), 'fd-generated-second-'));

function digest(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function compile(outputDirectory: string) {
  return compilePlaytestContentPack({
    packPath: resolve(workspaceRoot, 'data/packs/fd-playtest-v1/pack.json'),
    outputDirectory,
    workspaceRoot,
  });
}

try {
  const first = compile(firstDirectory);
  const second = compile(secondDirectory);
  const outputs = Object.values(first.outputPaths);

  for (const firstPath of outputs) {
    const name = basename(firstPath);
    const firstHash = digest(firstPath);
    const secondHash = digest(resolve(secondDirectory, name));
    const checkedInHash = digest(resolve(checkedInDirectory, name));
    if (firstHash !== secondHash) throw new Error(`${name} is not deterministic across two clean compilations`);
    if (firstHash !== checkedInHash) throw new Error(`${name} differs from the checked-in generated artifact`);
    process.stdout.write(`${name}: ${firstHash}\n`);
  }
} finally {
  rmSync(firstDirectory, { recursive: true, force: true });
  rmSync(secondDirectory, { recursive: true, force: true });
}
