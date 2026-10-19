import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.kirei';
const IDS = ['s1', 's2', 's3', 'ascension'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.kirei.json', 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function state(): GameState {
  const value = createSeededGameState({ activeSeats: [1, 2] });
  value.cards = [];
  value.players[0]!.masterCardId = ROOT;
  value.round.activePhase = 'action';
  value.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(value, loaded, { seed: 20261019 });
  return value;
}

describe('P3 Kirei owner migration boundary', () => {
  it('preserves exactly the four frozen identities, text, legacy locators, and inventory SHA', () => {
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    const rows = inventory.staticSkills.filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(rows).toHaveLength(4);
    for (const entry of rows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.kirei/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) {
        expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId]).toContain(`sha256=${clause.source.sha256}`);
      }
    }
    expect(archive.cards.find((card: any) => card.id === `${ROOT}.skill.s2`).printedText)
      .toBe('管理者-所有玩家秘密告诉你从者职阶。 中立-行动阶段：你可以无视交战状态，花费2魔力移动至侦察。');
  });

  it('keeps every frozen skill host-adjudicated and blocks legacy-handler execution', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort())
      .toEqual(IDS.sort());
    for (const id of IDS) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);

    const value = state();
    rules.processAbilityEvent(value, { id: 'kirei-game-start', type: 'game_start', playerId: 'p1' });
    rules.processAbilityEvent(value, { id: 'kirei-round-end', type: 'round_end', playerId: 'p1' });
    expect((value as any).modeState?.masterDirectives ?? []).toEqual([]);
    expect(rules.getLegalActions(value, 'p1').some((action) => action.type === 'activate_ability')).toBe(false);
  });

  it('documents unresolved visibility, role, defeat, movement, and power contracts', () => {
    expect(archive.sourcePolicy.note).toMatch(/真名隐藏与角色切换/);
    expect(archive.sourcePolicy.note).toMatch(/秘密职阶信息/);
    expect(archive.sourcePolicy.note).toMatch(/真名解放\/强制败北/);
    expect(archive.sourcePolicy.note).toMatch(/无视交战移动/);
    expect(archive.sourcePolicy.note).toMatch(/角色相关威力修改/);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
  });

  it('registers Kirei exactly once after Kiara in the canonical master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    const path = 'data/authoring/masters/master.kirei.json';
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === path)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(path);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.kiara.json');
  });
});
