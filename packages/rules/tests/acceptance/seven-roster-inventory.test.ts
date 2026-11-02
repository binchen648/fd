import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMatchSession } from '../../src/match-session';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

describe('A-ACCEPT-06 inventory (structural evidence, NOT effect execution)', () => {
  it('keeps 14 archives, 46 cards and 92 ability identities separate from executable coverage', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    const paths: string[] = [...pack.authoringMasterFiles, ...pack.authoringServantFiles];
    const archives = paths.map(path => JSON.parse(readFileSync(path, 'utf8')));
    expect(new Set(archives.map(a => a.id)).size).toBe(14);
    const cards = archives.flatMap(a => a.cards);
    expect(cards).toHaveLength(46);
    const identities = cards.flatMap(c => c.abilities.map((a: any) => `${c.id}::${a.id}`));
    expect(identities).toHaveLength(92);
    expect(new Set(identities).size).toBe(92);
    const runtime = createMatchSession({ seed: 20260907 }).state.abilityRuntime!;
    for (const card of cards) {
      const executable = runtime.pack.cards[card.id];
      expect(executable, card.id).toBeDefined();
      for (const ability of card.abilities) {
        const compiled = executable!.abilities.find(a => a.id === ability.id);
        expect(compiled, `${card.id}::${ability.id}`).toBeDefined();
        expect(compiled!.effects).toEqual(ability.effects ?? []);
      }
    }
    // Exclusion is branch-specific. It does not exclude Shinji's other cards.
    expect(identities).toContain('master.shinji.skill.false-attendant-book::false-attendant-book.first-empty-seals');
    expect(identities).toContain('master.shinji.skill.drain-command::drain-command.enter-miyama');
    if (process.env.FD_ACCEPT_EVIDENCE) writeFileSync(join(process.env.FD_ACCEPT_EVIDENCE, 'runtime-inventory.json'), JSON.stringify({
      authoringCards: cards.map(c => c.id), authoringAbilityIdentities: identities,
      runtimeCardCount: Object.keys(runtime.pack.cards).length,
      runtimeAbilities: Object.values(runtime.pack.cards).flatMap(c => c.abilities.map(a => ({
        cardId: c.id, ownerId: c.ownerId, abilityId: a.id, kind: a.kind,
        identity: `${c.id}::${a.id}`, fromFourteenArchives: identities.includes(`${c.id}::${a.id}`),
      }))),
    }, null, 2));
  });
});
