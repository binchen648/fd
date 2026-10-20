import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { calculateCardPower, dispatchAbilityCommand, initializeAbilityRuntime, playAbilityCardBatch, processAbilityEvent } from '../../src/ability/interpreter';
import { spendMana } from '../../src/core/rule-overrides';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const archivePath = 'data/authoring/masters/master.sieg.json';
const raw = () => JSON.parse(readFileSync(archivePath, 'utf8'));
function setup() {
  const pack = loadAuthoringJson(raw());
  const state = createSeededGameState(); state.cards = [];
  state.players[0]!.masterCardId = 'master.sieg'; state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'shinto';
  state.players[0]!.mana = 0; state.players[1]!.mana = 8; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  initializeAbilityRuntime(state, pack, { seed: 20261020 });
  return { state, pack };
}
function add(state: GameState, definitionId: string, owner: string, zone: string, active = false, controller = owner) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: controller, zone, visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}

describe('P3 owner-complete master.sieg', () => {
  it('loads the four frozen cards and applies same-location mana threshold plus sync strength', () => {
    const { state, pack } = setup();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const asc = add(state, 'master.sieg.skill.ascension', 'p1', 'field', true);
    expect(asc).toBeTruthy();
    spendMana(state, 'p2', 3); expect((state.players[0] as any).commandSpells ?? 3).toBe(3);
    spendMana(state, 'p2', 4); expect((state.players[0] as any).commandSpells ?? 3).toBe(4);
    const basicDef: AuthoringCard = { id: 'fixture.sieg.basic', name: 'fixture', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 2 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
    state.abilityRuntime!.pack.cards[basicDef.id] = basicDef;
    const basic = add(state, basicDef.id, 'p1', 'attack_area', true);
    expect(calculateCardPower(state, basic).value).toBe(5);
  });

  it('provisions Dragon Command below eight mana, plays Balmung for free, and expires its opponent actions', () => {
    const { state } = setup();
    const dragon = add(state, 'master.sieg.skill.s1a', 'p1', 'skill');
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: dragon }]);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: dragon, abilityId: 'master.sieg.skill.s1a.dragon-command' }).ok).toBe(true);
    const balmung = state.cards.find((entry) => entry.definitionId === 'master.sieg.skill.s2' && entry.generatedBy === dragon)!;
    expect(balmung.zone).toBe('skill'); expect(state.players[0]!.mana).toBe(2); expect((state.players[0] as any).commandSpells).toBe(2);
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: balmung.instanceId }]);
    const penalty = state.cards.find((entry) => entry.definitionId === 'master.sieg.skill.s2.penalty' && entry.ownerPlayerId === 'p2')!;
    expect(penalty).toBeTruthy(); expect(state.players[0]!.mana).toBe(2);
    const agilityDef: AuthoringCard = { id: 'fixture.sieg.agility', name: 'fixture', cardType: 'basic_attack', cardFace: { attributes: ['迅捷'], cost: 0, basePower: 5 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
    state.abilityRuntime!.pack.cards[agilityDef.id] = agilityDef;
    const agility = add(state, agilityDef.id, 'p2', 'attack_area', true);
    state.round.prioritySeat = state.players.find((entry) => entry.id === 'p2')!.seat;
    const penaltyActivation = dispatchAbilityCommand(state, 'p2', { type: 'activate_ability', cardInstanceId: penalty.instanceId, abilityId: 'master.sieg.skill.s2.penalty.activate' });
    expect(penaltyActivation.ok).toBe(true);
    expect(dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: state.abilityRuntime!.pendingDecision!.id, selectedIds: [agility] }).ok).toBe(true);
    expect(state.cards.find((entry) => entry.instanceId === agility)?.zone).toBe('skill');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p1).toBe(state.round.roundNumber);
    processAbilityEvent(state, { id: 'sieg-round-end', type: 'round_end' });
    expect(state.cards.find((entry) => entry.instanceId === balmung.instanceId)?.zone).toBe('removed_from_game');
    expect(state.cards.find((entry) => entry.instanceId === penalty.instanceId)?.zone).toBe('removed_from_game');
  });
});
