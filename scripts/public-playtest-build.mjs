import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const digest = directory => createHash('sha256').update(readFileSync(resolve(directory, 'index.html'))).digest('hex');
export function markPublicBuild(directory) {
  writeFileSync(resolve(directory, '.fd-public-build.json'), JSON.stringify({ version: 1, indexSha256: digest(directory) }));
}
export function assertPublicBuild(directory) {
  try {
    const marker = JSON.parse(readFileSync(resolve(directory, '.fd-public-build.json'), 'utf8'));
    if (marker.version !== 1 || marker.indexSha256 !== digest(directory)) throw new Error('Wrong build');
  } catch { throw new Error('Public playtest build missing or changed; run npm run playtest:host without --no-build'); }
}
