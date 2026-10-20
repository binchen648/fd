import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.twice';
const IDS = ['ascension', 's1'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.twice.json', 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function state(): GameState {
  const value = createSeededGameState({ activeSeats: [1, 2] });
  value.cards = [];
  value.players[0]!.masterCardId = ROOT;
  value.round.activePhase = 'action';
  value.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(value, loaded, { seed: 20261021 });
  return value;
}

describe('P3 Twice owner migration boundary', () => {
  it('materializes exactly the frozen identities and preserves inventory text and clause hashes', () => {
    expect(archive.id).toBe(ROOT);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    const rows = [...inventory.staticSkills, ...inventory.dynamicSkills]
      .filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(2);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.twice/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) {
        expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId])
          .toContain(`sha256=${clause.source.sha256}`);
      }
    }
  });

  it('keeps both skills host-adjudicated and does not expose a fake automatic action', () => {
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(loaded.cards[IDS[0]]!.mode).toBe('host_adjudicated');
    expect(loaded.cards[IDS[1]]!.mode).toBe('host_adjudicated');
    const value = state();
    expect(rules.getLegalActions(value, 'p1').some((action: any) =>
      action.type === 'activate_ability' && String(action.cardInstanceId).startsWith('twice:'))).toBe(false);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });

  it('records the exact bounded runtime gaps for host adjudication', () => {
    expect(archive.sourcePolicy.note).toMatch(/lowest-victory-point power projection/);
    expect(archive.sourcePolicy.note).toMatch(/elimination replacement/);
    expect(archive.sourcePolicy.note).toMatch(/event placement swap\/deck replacement/);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
    expect(archive.sourcePolicy.note).toMatch(/not an automatic implementation/);
  });

  it('registers Twice exactly once at the end of the canonical master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    const path = 'data/authoring/masters/master.twice.json';
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === path)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(path);
  });
});
