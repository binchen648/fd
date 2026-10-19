import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.kariya';
const IDS = ['ascension', 's1', 's2', 's3', 's4'].map((skill) => `${ROOT}.skill.${skill}`);
const PATH = 'data/authoring/masters/master.kariya.json';
const archive = JSON.parse(readFileSync(PATH, 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function addSkill(state: GameState, definitionId: string): void {
  const instanceId = `kariya:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active: false, faceDown: false, playedRound: state.round.roundNumber,
  };
}

function state(): GameState {
  const value = createSeededGameState({ activeSeats: [1, 2] });
  value.cards = [];
  value.players[0]!.masterCardId = ROOT;
  value.players[0]!.locationId = 'magic_workshop';
  value.players[1]!.locationId = 'shinto';
  value.round.activePhase = 'action';
  value.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(value, loaded, { seed: 20261019 });
  return value;
}

describe('P3 Kariya owner migration boundary', () => {
  it('materializes exactly the five frozen identities and preserves inventory text/source evidence', () => {
    expect(archive.id).toBe(ROOT);
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    const inventoryRows = [...inventory.staticSkills, ...inventory.dynamicSkills]
      .filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(inventoryRows).toHaveLength(5);
    for (const entry of inventoryRows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.kariya/${entry.canonicalAbilityId.split('.').at(-1)}`);
      for (const clause of entry.clauses) {
        expect(archive.sourcePolicy.sourceLocators.generated[entry.canonicalAbilityId])
          .toContain(`sha256=${clause.source.sha256}`);
      }
    }
  });

  it('keeps every frozen skill host-adjudicated and refuses legacy-handler execution', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort())
      .toEqual(IDS.sort());
    for (const id of IDS) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);

    const value = state();
    for (const id of IDS) addSkill(value, id);
    for (const event of [
      { id: 'kariya-game-start', type: 'game_start', playerId: 'p1' },
      { id: 'kariya-round-start', type: 'round_start', playerId: 'p1' },
      { id: 'kariya-win', type: 'after_controller_wins_battle', playerId: 'p1' },
      { id: 'kariya-battle-end', type: 'after_battle_ended', playerId: 'p1' },
    ]) rules.processAbilityEvent(value, event as any);
    expect((value as any).modeState?.masterDirectives ?? []).toEqual([]);
    expect(rules.getLegalActions(value, 'p1').some((action) =>
      action.type === 'activate_ability' && action.cardInstanceId.startsWith('kariya:'))).toBe(false);
  });

  it('documents unsupported card, movement, enemy, combat, elimination, deck, and preparation boundaries', () => {
    expect(archive.sourcePolicy.note).toMatch(/基础牌魔力费用\/威力修正/);
    expect(archive.sourcePolicy.note).toMatch(/牌堆顶加入攻击/);
    expect(archive.sourcePolicy.note).toMatch(/准备阶段随机展示与强制出牌/);
    expect(archive.sourcePolicy.note).toMatch(/宿敌关系绑定/);
    expect(archive.sourcePolicy.note).toMatch(/战斗淘汰\/战果联动/);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
  });

  it('registers Kariya exactly once at the end of the canonical master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
  });
});
