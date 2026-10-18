import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { hasRequiredAdditionalPlayMarker } from '../../src/ability/required-additional-play';

const ROOT = 'master.hinako';
const IDS = ['ascension', 's1', 's1a', 's2', 's3', 's4'].map((skill) => `${ROOT}.skill.${skill}`);
const archive = JSON.parse(readFileSync('data/authoring/masters/master.hinako.json', 'utf8')) as any;

function load(withAttack = false) {
  const value = structuredClone(archive);
  if (withAttack) value.cards.push({
    id: 'fixture.hinako.basic', aliases: ['fixture-hinako-basic'], legacyId: 'fixture-hinako-basic', name: '测试基础攻击',
    cardType: 'basic_attack', owner: { type: 'master', id: ROOT }, printedText: '',
    cardFace: { typeLabel: '力量', attributes: [], cost: 0, basePower: 5 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
    verification: { implementationStatus: 'complete' },
  });
  return rules.loadAuthoringJson(value);
}

function add(state: GameState, definitionId: string, playerId = 'p1', zone: any = 'skill') {
  const instanceId = `hinako:${definitionId.split('.').at(-1)}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: playerId, controllerPlayerId: playerId, zone,
    visibility: ['attack_area', 'field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: playerId } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: ['attack_area', 'field'].includes(zone), faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

function state(withAttack = false) {
  const loaded = load(withAttack);
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  expect(loaded.report.filter((entry) => entry.path === 'verification.implementationStatus').map((entry) => entry.cardId).sort())
    .toEqual([`${ROOT}.skill.s1`, `${ROOT}.skill.s3`, `${ROOT}.skill.s4`]);
  const value = createSeededGameState({ activeSeats: [1, 2] });
  value.cards = [];
  value.players[0]!.masterCardId = ROOT;
  value.players[0]!.locationId = 'miyama_town';
  value.players[1]!.locationId = 'miyama_town';
  value.round.activePhase = 'battle';
  value.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(value, loaded, { seed: 20261019 });
  return { value, loaded };
}

describe('P3 Hinako owner-complete canonical migration', () => {
  it('loads exactly the frozen six skills and preserves locked text', () => {
    const loaded = load();
    expect(Object.keys(loaded.cards).sort()).toEqual(IDS.sort());
    expect(loaded.cards[`${ROOT}.skill.s2`]!.abilities[0]!.effects[0]).toEqual({ type: 'hinako_blood_song', amount: -2, duration: 'round' });
    expect(loaded.cards[`${ROOT}.skill.s1`]!.mode).toBe('host_adjudicated');
    expect(loaded.cards[`${ROOT}.skill.s3`]!.mode).toBe('host_adjudicated');
    expect(loaded.cards[`${ROOT}.skill.s4`]!.mode).toBe('host_adjudicated');
    // The shared marker means “must be additional”, while Hinako's text says
    // “may be additional”; no stronger semantics are invented here.
    expect(hasRequiredAdditionalPlayMarker(loaded.cards[`${ROOT}.skill.s2`])).toBe(false);
    expect(archive.cards.find((card: any) => card.id === `${ROOT}.skill.s4`).printedText).toContain('【风暴帝都】战果7');
  });

  it('provisions Eternal Lament at game start and returns an outside copy after a battle loss', () => {
    const { value } = state();
    add(value, `${ROOT}.skill.s1a`);
    rules.processAbilityEvent(value, { id: 'hinako-start', type: 'game_start' });
    const eternal = value.cards.find((card) => card.definitionId === `${ROOT}.skill.s2`);
    expect(eternal?.zone).toBe('skill');
    expect(eternal).toBeDefined();
    const eternalId = eternal!.instanceId;
    const handTwin = add(value, `${ROOT}.skill.s2`, 'p1', 'hand');
    const fieldTwin = add(value, `${ROOT}.skill.s2`, 'p1', 'field');
    value.cards.find((card) => card.instanceId === eternalId)!.zone = 'removed_from_game';
    rules.processAbilityEvent(value, { id: 'hinako-loss', type: 'after_controller_loses_battle', playerId: 'p1' });
    expect(value.cards.find((card) => card.instanceId === eternalId)?.zone).toBe('skill');
    expect(value.cards.find((card) => card.instanceId === handTwin)?.zone).toBe('hand');
    expect(value.cards.find((card) => card.instanceId === fieldTwin)?.zone).toBe('field');
  });

  it('applies Blood Song -2 to every active engaged opponent attack and only once per card', () => {
    const { value } = state(true);
    const source = add(value, `${ROOT}.skill.s2`, 'p1', 'attack_area');
    const attack = add(value, 'fixture.hinako.basic', 'p2', 'attack_area');
    expect(rules.calculateCardPower(value, attack).value).toBe(5);
    const action = rules.getLegalActions(value, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === source && candidate.abilityId === 'hinako.blood-song.combat');
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(value, 'p1', action!).ok).toBe(true);
    expect(rules.calculateCardPower(value, attack).value).toBe(3);
    expect(value.cards.find((card) => card.instanceId === attack)?.powerModifiers).toHaveLength(1);
    value.round.roundNumber += 1;
    expect(rules.calculateCardPower(value, attack).value).toBe(5);
    delete value.abilityRuntime!.abilityUsage[`${source}:hinako.blood-song.combat`];
    const nextRound = rules.getLegalActions(value, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === source && candidate.abilityId === 'hinako.blood-song.combat');
    expect(nextRound).toBeDefined();
    expect(rules.dispatchAbilityCommand(value, 'p1', nextRound!).ok).toBe(true);
    expect(rules.calculateCardPower(value, attack).value).toBe(3);
  });

  it('is a safe no-op when no engaged active attack exists', () => {
    const { value } = state();
    const source = add(value, `${ROOT}.skill.s2`, 'p1', 'attack_area');
    const action = rules.getLegalActions(value, 'p1').find((candidate) => candidate.type === 'activate_ability' && candidate.cardInstanceId === source && candidate.abilityId === 'hinako.blood-song.combat');
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(value, 'p1', action!).ok).toBe(true);
    expect(value.cards.every((card) => !(card as any).powerModifiers)).toBe(true);
  });

  it('does not execute NPC/Lostbelt directives while those cards are host-adjudicated', () => {
    const { value } = state();
    add(value, `${ROOT}.skill.s1`);
    add(value, `${ROOT}.skill.s3`);
    add(value, `${ROOT}.skill.s4`);
    rules.processAbilityEvent(value, { id: 'hinako-host-only-start', type: 'game_start' });
    rules.processAbilityEvent(value, { id: 'hinako-host-only-win', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect((value as any).modeState?.masterDirectives ?? []).toEqual([]);
  });
});
