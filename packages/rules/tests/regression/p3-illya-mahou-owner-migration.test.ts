import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.illya-mahou';
const IDS = ['ascension', 's1', 's1a'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.illya-mahou.json', 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function add(state: GameState, definitionId: string, zone: any = 'skill') {
  const instanceId = `illya-mahou:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone,
    visibility: zone === 'field' || zone === 'attack_area'
      ? { scope: 'public' }
      : { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active: zone === 'field' || zone === 'attack_area', faceDown: false, playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function state() {
  const value = createSeededGameState({ activeSeats: [1, 2] });
  value.cards = [];
  value.players[0]!.masterCardId = ROOT;
  value.players[0]!.locationId = 'miyama_town';
  value.players[1]!.locationId = 'shinto';
  value.round.activePhase = 'action';
  value.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(value, loaded, { seed: 20261019 });
  return value;
}

describe('P3 Illya Mahou owner migration boundary', () => {
  it('preserves the exact three frozen identities, text, and source locators', () => {
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive.cards.map((card: any) => [card.id, card.name])).toEqual([
      [`${ROOT}.skill.ascension`, '双生'], [`${ROOT}.skill.s1`, '无限的想象力'], [`${ROOT}.skill.s1a`, '万花筒之杖'],
    ]);
    expect(archive.cards.map((card: any) => card.verification.implementationStatus)).toEqual([
      'host_adjudicated', 'host_adjudicated', 'host_adjudicated',
    ]);
    expect(archive.cards.map((card: any) => card.printedText)).toEqual([
      '回合结束时，花费3点魔力，否则将此牌移除游戏。\n你从局势牌和事件牌受到的影响翻倍。（不包括局势牌的魔力和事件牌的战果）',
      '当有牌将通过万花筒之杖以外的效果进入你的牌库时，改为将其弃置。',
      '准备阶段：抽任意张牌。\n准备阶段：花费你手牌数两倍的魔力，将你弃牌堆的牌洗入牌库。',
    ]);
    for (const id of IDS) {
      const source = [...inventory.staticSkills, ...inventory.dynamicSkills].find((entry: any) => entry.canonicalAbilityId === id);
      expect(source?.printedText).toBe(archive.cards.find((card: any) => card.id === id).printedText);
    }
    expect(archive.sourcePolicy.sourceLocators.generated[`${ROOT}.skill.ascension`]).toContain('261756c8216c3d8d50f197e8d19b9f97adbe08e5aee2de9e04da1fd747a2b67e');
    expect(archive.sourcePolicy.sourceLocators.generated[`${ROOT}.skill.s1`]).toContain('cd9408ccd7d5299c4c1e258a45f11a3cba07991864d28a915fdfa32237c1d8ed');
    expect(archive.sourcePolicy.sourceLocators.generated[`${ROOT}.skill.s1a`]).toContain('7e3ba930644cf954890adb898088c60487c2b87a430e660b2c296a675f1f89c8');
  });

  it('loads all three cards as host_adjudicated without unsupported authoring shapes', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort())
      .toEqual(IDS.sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported').map((entry) => entry.cardId).sort())
      .toEqual(IDS.sort());
    for (const id of IDS) {
      expect(loaded.cards[id]!.mode).toBe('host_adjudicated');
      expect(archive.cards.find((card: any) => card.id === id).abilities[0].effects).toEqual([
        expect.objectContaining({ type: 'record_master_directive' }),
      ]);
    }
  });

  it('blocks automatic directive execution for ascension, passive replacement, and preparation action', () => {
    const value = state();
    for (const id of IDS) add(value, id);
    rules.processAbilityEvent(value, { id: 'illya-mahou-game-start', type: 'game_start' });
    rules.processAbilityEvent(value, { id: 'illya-mahou-ascension', type: 'after_master_ascension_unlocked' });
    rules.processAbilityEvent(value, { id: 'illya-mahou-round-end', type: 'round_end' });
    expect((value as any).modeState?.masterDirectives ?? []).toEqual([]);
    expect(rules.getLegalActions(value, 'p1').some((action) => action.type === 'activate_ability' && action.cardInstanceId.startsWith('illya-mahou:'))).toBe(false);
  });

  it('keeps unsupported dynamic costs, replacement, and deck mutation explicitly host-only', () => {
    expect(archive.sourcePolicy.note).toMatch(/牌库进入替换拦截/);
    expect(archive.sourcePolicy.note).toMatch(/动态费用/);
    expect(archive.sourcePolicy.note).toMatch(/host_adjudicated/);
    expect(archive.sourcePolicy.note).toMatch(/不能伪装成 complete/);
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });
});
