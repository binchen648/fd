import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '../../../content/src/playtest-pack-loader';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';

const frozenBytes = readFileSync('packages/rules/tests/fixtures/b-euryale-771ae323.json');
const frozen = JSON.parse(frozenBytes.toString('utf8'));
const coreId = 'card.x-divine-core';

function compile(archive = structuredClone(frozen)) {
  const pack = loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: resolve('.') });
  const { library } = compileLoadedPlaytestPack(pack);
  // Exercise the A compiler's archive input. Production manifest loading is owned by B.
  library.rules.archives = library.rules.archives.filter(existing => existing.id !== archive.id);
  library.rules.archives.push(archive);
  return compileExecutableCardPack(library);
}

describe('same-archive named deck identity in the executable compiler', () => {
  it('compiles the exact frozen archive to three skills and twelve cards including two Divine Cores', () => {
    expect(createHash('sha256').update(frozenBytes).digest('hex')).toBe('12b8db78accb4bff677f7d19fe8bd736f46c12172c0047826693e207bcea977a');
    const pack = compile();
    expect(pack.characters[frozen.id]!.cardIds.filter(id => pack.cards[id]?.cardType === 'servant_skill')).toHaveLength(3);
    expect(pack.decks[frozen.id]).toHaveLength(12);
    expect(pack.decks[frozen.id]!.filter(id => id === coreId)).toHaveLength(2);
  });

  it.each(['missing', 'foreign', 'wrong-type', 'ambiguous'] as const)('rejects %s named identity', variant => {
    const archive = structuredClone(frozen), card = archive.cards.find((entry: {id: string}) => entry.id === coreId);
    if (variant === 'missing') archive.cards = archive.cards.filter((entry: {id: string}) => entry.id !== coreId);
    if (variant === 'foreign') for (const entry of archive.deck) {
      if (entry.cardId === coreId) entry.cardId = 'servant.drake.skill.sc-drake-1';
    }
    if (variant === 'wrong-type') card.cardType = 'event';
    if (variant === 'ambiguous') archive.cards.push(structuredClone(card));
    expect(() => compile(archive)).toThrow(variant === 'ambiguous' ? /duplicate card definition/i : variant === 'wrong-type' ? /Event rule-shaped archive/ : /Unknown deck entry/);
  });
});
