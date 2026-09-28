import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { verifyFrozenState } from '../phase3-e04-freeze-verify';

describe('P3-E04 A111/A112 statistics freeze', () => {
  it('verifies exact frozen refs, artifacts, accounting, and A111/A112 lineage', () => {
    const result = verifyFrozenState();
    expect(result.A111).toBe('b7f88c7197859e7203eada1dad4f4ac4e9f1d6fa');
    expect(result.A112).toBe('79f5ebaaaa4f2a89ab8b953afbaa7c7c82e8b681');
  });

  it('fails closed when the freeze manifest changes an expected artifact hash', () => {
    const sourcePath = 'artifacts/phase3-e04-statistics-freeze.json';
    const manifest = JSON.parse(readFileSync(sourcePath, 'utf8')) as Record<string, any>;
    manifest.checkpoints.A112.decompositionSha256 = '0'.repeat(64);
    const tempRoot = mkdtempSync(join(tmpdir(), 'fd-freeze-'));
    try {
      const manifestPath = join(tempRoot, 'tampered-freeze.json');
      writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');
      expect(() => verifyFrozenState({ manifestPath })).toThrow(/FREEZE_MISMATCH/);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
