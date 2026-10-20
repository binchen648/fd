import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.wallachia';
const IDS = ['ascension','s1','s2','s3','s4','s5','s6','s7','s8'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.wallachia.json', 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

describe('P3 Wallachia owner migration boundary', () => {
  it('materializes all nine frozen identities and preserves printed text and source hashes', () => {
    expect(archive.id).toBe(ROOT);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills].filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(9);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId]).toBe(`legacy-content.json#master/master.wallachia/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
    }
  });

  it('keeps the shared Tatari route explicitly host-adjudicated without private fake actions', () => {
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) => ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = []; state.players[0]!.masterCardId = ROOT; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    rules.initializeAbilityRuntime(state, loaded, { seed: 20261021 });
    expect(IDS.every((id) => loaded.cards[id]!.mode === 'host_adjudicated')).toBe(true);
    expect(rules.getLegalActions(state, 'p1').some((action: any) => action.type === 'activate_ability' && String(action.cardInstanceId).startsWith('wallachia:'))).toBe(false);
    expect(archive.sourcePolicy.note).toMatch(/core\.wallachia-tatari/);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
  });

  it('registers Wallachia exactly once at the end of the canonical master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    const path = 'data/authoring/masters/master.wallachia.json';
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === path)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(path);
  });
});
