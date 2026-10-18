import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.hisui-detective';
const IDS = ['ascension', 's1', 's1a', 's2', 's3'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.hisui-detective.json', 'utf8')) as any;
const loaded = rules.loadAuthoringJson(archive);

function add(state: GameState, definitionId: string, zone: any = 'skill') {
  const instanceId = `hisui:${definitionId.split('.').at(-1)}:${state.cards.length}`;
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

describe('P3 Hisui Detective owner migration boundary', () => {
  it('preserves the exact five frozen identities, text, and source locators', () => {
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(archive.cards.map((card: any) => [card.id, card.name])).toEqual([
      [`${ROOT}.skill.s1`, '密室难题'], [`${ROOT}.skill.s1a`, '携闻而至'],
      [`${ROOT}.skill.s2`, '线索'], [`${ROOT}.skill.s3`, '指证'],
      [`${ROOT}.skill.ascension`, '侦探模式'],
    ]);
    expect(archive.cards.map((card: any) => card.verification.implementationStatus)).toEqual([
      'host_adjudicated', 'host_adjudicated', 'host_adjudicated', 'host_adjudicated', 'host_adjudicated',
    ]);
    expect(archive.sourcePolicy.sourceLocators.legacy[`${ROOT}.skill.s1`]).toBe('legacy-content.json#master/master.hisui-detective/s1');
    expect(archive.cards.find((card: any) => card.id === `${ROOT}.skill.s3`).printedText).toContain('第11回合');
  });

  it('compiles all five cards as host_adjudicated and blocks automatic directive execution', () => {
    expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort())
      .toEqual(IDS.sort());
    for (const id of IDS) expect(loaded.cards[id]!.mode).toBe('host_adjudicated');

    const value = state();
    for (const id of IDS) add(value, id);
    rules.processAbilityEvent(value, { id: 'hisui-game-start', type: 'game_start' });
    rules.processAbilityEvent(value, { id: 'hisui-round-end', type: 'round_end' });
    expect((value as any).modeState?.masterDirectives ?? []).toEqual([]);
    expect(rules.getLegalActions(value, 'p1').some((action) => action.type === 'activate_ability' && action.cardInstanceId.startsWith('hisui:'))).toBe(false);
  });

  it('does not claim unsupported clue, investigation, battlefield, suspect, or one-shot state', () => {
    expect(archive.sourcePolicy.note).toMatch(/no authoritative.*固有结界.*clue\/suspect.*investigation/i);
    expect(archive.cards.every((card: any) => card.verification.implementationStatus === 'host_adjudicated')).toBe(true);
    expect(archive.cards.every((card: any) => card.abilities.every((ability: any) =>
      ability.effects.every((effect: any) => effect.type === 'record_master_directive')))).toBe(true);
  });
});
