import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.kadoc';
const IDS = ['ascension', 's1', 's1a', 's2', 's3', 's4', 's5'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.kadoc.json', 'utf8')) as any;
const inventory = JSON.parse(readFileSync('data/phase3/full-roster-ability-inventory.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function addSkill(state: GameState, definitionId: string): string {
  const instanceId = `kadoc:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active: false, faceDown: false, playedRound: state.round.roundNumber,
  };
  return instanceId;
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

describe('P3 Kadoc owner migration boundary', () => {
  it('materializes exactly the seven frozen identities and preserves canonical inventory text', () => {
    expect(archive.id).toBe(ROOT);
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive.cards.map((card: any) => card.id)).toEqual(IDS);
    const inventoryRows = [...inventory.staticSkills, ...inventory.dynamicSkills]
      .filter((entry: any) => IDS.includes(entry.canonicalAbilityId));
    expect(inventoryRows).toHaveLength(7);
    for (const entry of inventoryRows) {
      const card = archive.cards.find((candidate: any) => candidate.id === entry.canonicalAbilityId);
      expect(card.printedText).toBe(entry.printedText);
      expect(archive.sourcePolicy.sourceLocators.legacy[entry.canonicalAbilityId])
        .toBe(`legacy-content.json#master/master.kadoc/${entry.canonicalAbilityId.split('.').at(-1)}`);
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
      { id: 'kadoc-game-start', type: 'game_start', playerId: 'p1' },
      { id: 'kadoc-win', type: 'after_controller_wins_battle', playerId: 'p1' },
      { id: 'kadoc-round-end', type: 'round_end', playerId: 'p1' },
      { id: 'kadoc-battle-end', type: 'after_battle_ended', playerId: 'p1' },
    ]) rules.processAbilityEvent(value, event as any);
    expect((value as any).modeState?.masterDirectives ?? []).toEqual([]);
    expect(rules.getLegalActions(value, 'p1').some((action) =>
      action.type === 'activate_ability' && action.cardInstanceId.startsWith('kadoc:'))).toBe(false);
  });

  it('documents all expansion, event, battlefield, and victory-point boundaries as HOST_ADJUDICATED', () => {
    expect(archive.sourcePolicy.note).toMatch(/俄罗斯事件牌扩张与替换同步/);
    expect(archive.sourcePolicy.note).toMatch(/俄罗斯事件免疫/);
    expect(archive.sourcePolicy.note).toMatch(/战场部署\/进入\/离开\/战败效果/);
    expect(archive.sourcePolicy.note).toMatch(/回合结束战果扣除/);
    expect(archive.sourcePolicy.note).toMatch(/失去本回合战果/);
    expect(archive.sourcePolicy.note).toMatch(/HOST_ADJUDICATED/);
  });

  it('registers Kadoc exactly once at the end of the canonical master pack', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8')) as any;
    const path = 'data/authoring/masters/master.kadoc.json';
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === path)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(path);
  });
});
