import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';

const ARCHIVE_PATH = 'data/authoring/masters/master.zouken.json';
const PACK_PATH = 'data/packs/fd-playtest-v1/pack.json';
const IDs = [
  'master.zouken.skill.ascension',
  'master.zouken.skill.s1',
  'master.zouken.skill.s2',
  'master.zouken.skill.s3',
  'master.zouken.skill.s4',
  'master.zouken.skill.s5',
] as const;
const TEXT_SHA: Record<string, string> = {
  ascension: '6bec5e2443f416546ea830907c255e87b2ad2d9cad9ddb12dfd8436c0b0ee7b7',
  s1: '2d006d8244b028397a5c341b2a37dd634616152d15afcd708aea3163e2b88945',
  s2: '8b8f4b24424a8600807fd42c0965fad94bd6f9dcdc9917efe10f1bff8b17f3e3',
  s3: 'cea95dc5010d588158e85f29d23cbbfa92f4a3211825312a12d0f641b7648b44',
  s4: '3b66cc0b2d7c1e95bdd02b34e62de54f5383e53b20a736b69cb023f3388f2f49',
  s5: '1bfe9fda4911dd95b0e6ef1462140b1d7e20cdacdd03df524fae374509bc668f',
};

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('Zouken Builder owner provenance and runtime boundary', () => {
  it('binds exactly six source-grounded cards with stable text hashes and art provenance', () => {
    const archive = readJson(ARCHIVE_PATH);
    expect(archive.id).toBe('master.zouken');
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDs);
    expect(archive.sourcePolicy.textSource.sha256).toBe('C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825');
    expect(archive.sourcePolicy.artSource.sha256).toBe('4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9');
    for (const card of archive.cards) {
      expect(createHash('sha256').update(card.printedText, 'utf8').digest('hex')).toBe(TEXT_SHA[card.legacyId]);
      expect(card.phase3Evidence.sourceReferences).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'development-text', sha256: archive.sourcePolicy.textSource.sha256 }),
        expect.objectContaining({ kind: 'development-image', sha256: archive.sourcePolicy.artSource.sha256 }),
      ]));
      expect(card.phase3Evidence.sourceTextSha256).toBe(TEXT_SHA[card.legacyId]);
    }
  });

  it('keeps unsupported mechanics explicit while retaining the accepted s5 automatic contract', () => {
    const archive = readJson(ARCHIVE_PATH);
    const pack = rules.loadAuthoringJson(archive);
    expect(pack.cards['master.zouken.skill.s5']!.abilities[0]!.execution.mode).toBe('automatic');
    expect(rules.isGameStartRuleOverrideSemantic(pack.cards['master.zouken.skill.s5']!.abilities[0]!)).toBe(true);
    expect(IDs.slice(0, 5).every((id) => pack.cards[id]!.abilities[0]!.execution.mode === 'host_adjudicated')).toBe(true);
    expect(pack.report.some((entry) => entry.status === 'unsupported')).toBe(true);
    const manifest = readJson(PACK_PATH);
    expect(manifest.authoringMasterFiles).toContain(ARCHIVE_PATH);
  });
});
