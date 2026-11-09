import { it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error plain Node launcher module, intentionally no emitted TS dependency
import { markPublicBuild, assertPublicBuild } from '../public-playtest-build.mjs';

it('rejects an ordinary or changed build rather than silently hosting local-game mode', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fd-build-marker-'));
  try {
    writeFileSync(join(dir, 'index.html'), 'local'); expect(() => assertPublicBuild(dir)).toThrow('Public playtest build');
    writeFileSync(join(dir, 'index.html'), 'public'); markPublicBuild(dir); expect(() => assertPublicBuild(dir)).not.toThrow();
    writeFileSync(join(dir, 'index.html'), 'local rebuilt'); expect(() => assertPublicBuild(dir)).toThrow('Public playtest build');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
