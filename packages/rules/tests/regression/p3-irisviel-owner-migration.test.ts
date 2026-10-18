import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.irisviel';
const IDS = ['ascension', 's1', 's2'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.irisviel.json', 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const decisions = JSON.parse(readFileSync('data/phase3/full-roster-rule-decisions.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function add(state: GameState, definitionId: string, zone: any = 'skill') {
  const instanceId = `irisviel:${definitionId.split('.').at(-1)}:${state.cards.length}`;
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

describe('P3 Irisviel owner migration boundary', () => {
  it('restores the exact canonical three identities and removes the stale exclusion', () => {
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive).not.toHaveProperty('excludedCards');
    expect(archive.cards.map((card: any) => [card.id, card.name])).toEqual([
      [`${ROOT}.skill.ascension`, '生命赋予'], [`${ROOT}.skill.s1`, '代理御主'], [`${ROOT}.skill.s2`, '转换魔术'],
    ]);
    expect(archive.cards.map((card: any) => card.printedText)).toEqual([
      '（升华技，将此牌加入你的技能区）\n你每回合只能使用此攻击的其中一项能力。\n行动阶段：本回合的一张基础攻击可以保持激活至下回合结束。\n战斗阶段：你的攻击获得魔术属性并且威力+1。',
      '令咒改为在前哨阶段使用。',
      '弃置所有手牌，每1张获得1点魔力。',
    ]);
    for (const id of IDS) {
      const source = [...inventory.staticSkills, ...inventory.dynamicSkills].find((entry: any) => entry.canonicalAbilityId === id);
      expect(source?.printedText).toBe(archive.cards.find((card: any) => card.id === id).printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[id]).toBe(`legacy-content.json#master/master.irisviel/${id.split('.').at(-1)}`);
    }
  });

  it('retains the accepted generated hashes and source decisions', () => {
    const generated = archive.sourcePolicy.sourceLocators.generated;
    expect(generated[`${ROOT}.skill.ascension`]).toContain('764186a6e18e6809aae2fac1606962feda161ba0f7e5a91e9d5a2a4575f2d0f2');
    expect(generated[`${ROOT}.skill.ascension`]).toContain('ce2524bda62f58881683da59bf06a5ee7bab5a8ff7d3820b074b8401ccb861c2');
    expect(generated[`${ROOT}.skill.s1`]).toContain('d880afd3807b56ddd0ae4c2ad35829fc7991428aee15438515ade2ade66bf9fd');
    expect(generated[`${ROOT}.skill.s2`]).toContain('75fa71628bf0f1ce128eb156a6b7bd1d3e49bf1e155e3e11978d342190548304');
    const evidencePacket = decisions.sourceEvidencePackets.find((entry: any) =>
      IDS.every((id) => entry.affectedAbilityIds.includes(id)));
    expect(evidencePacket?.packetType).toBe('SOURCE_EVIDENCE');
  });

  it('loads all three cards as host_adjudicated and never executes legacy handlers', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort())
      .toEqual(IDS.sort());
    expect(loaded.report.filter((entry) => entry.status === 'unsupported').map((entry) => entry.cardId).sort())
      .toEqual(IDS.sort());
    for (const id of IDS) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');

    const value = state();
    for (const id of IDS) add(value, id);
    rules.processAbilityEvent(value, { id: 'irisviel-game-start', type: 'game_start' });
    rules.processAbilityEvent(value, { id: 'irisviel-ascension', type: 'after_master_ascension_unlocked' });
    rules.processAbilityEvent(value, { id: 'irisviel-round-start', type: 'round_start' });
    rules.processAbilityEvent(value, { id: 'irisviel-round-end', type: 'round_end' });
    expect((value as any).modeState?.masterDirectives ?? []).toEqual([]);
    expect(rules.getLegalActions(value, 'p1').some((action) => action.type === 'activate_ability' && action.cardInstanceId.startsWith('irisviel:'))).toBe(false);
  });

  it('documents unsupported attack lifecycle, command-seal timing, and dynamic conversion semantics', () => {
    expect(archive.sourcePolicy.note).toMatch(/基础攻击跨回合激活生命周期/);
    expect(archive.sourcePolicy.note).toMatch(/令咒时序重写/);
    expect(archive.sourcePolicy.note).toMatch(/动态结算合同/);
    expect(archive.sourcePolicy.note).toMatch(/不能伪装成 complete/);
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });
});
