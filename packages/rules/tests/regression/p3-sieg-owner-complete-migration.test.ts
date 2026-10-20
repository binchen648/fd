import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { advanceAbilityPhase, calculateCardPower, createAbilitySession, dispatchAbilityCommand, initializeAbilityRuntime, playAbilityCardBatch, processAbilityEvent } from '../../src/ability/interpreter';
import { persistentExtraAttackAllowance, spendMana } from '../../src/core/rule-overrides';
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
    expect(calculateCardPower(state, basic).value).toBe(2);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'set_sieg_sync_state', providerCardInstanceId: asc, active: true }).ok).toBe(true);
    expect(calculateCardPower(state, basic).value).toBe(5);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'set_sieg_sync_state', providerCardInstanceId: asc, active: false }).ok).toBe(true);
    expect(calculateCardPower(state, basic).value).toBe(2);
  });

  it('fails closed when sync provider state is lost and rejects cross-owner/session mutation', () => {
    const { state } = setup();
    const asc = add(state, 'master.sieg.skill.ascension', 'p1', 'field', true);
    const basicDef: AuthoringCard = { id: 'fixture.sieg.basic.provider', name: 'fixture', cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 2 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
    state.abilityRuntime!.pack.cards[basicDef.id] = basicDef;
    const basic = add(state, basicDef.id, 'p1', 'attack_area', true);
    expect(dispatchAbilityCommand(state, 'p2', { type: 'set_sieg_sync_state', providerCardInstanceId: asc, active: true }).ok).toBe(false);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'set_sieg_sync_state', providerCardInstanceId: asc, active: true }).ok).toBe(true);
    expect(calculateCardPower(state, basic).value).toBe(5);
    state.abilityRuntime!.cardState[asc]!.active = false;
    expect(calculateCardPower(state, basic).value).toBe(2);
    state.abilityRuntime!.cardState[asc]!.active = true;
    state.cards.find((card) => card.instanceId === asc)!.ownerPlayerId = 'p2';
    expect(calculateCardPower(state, basic).value).toBe(2);

    state.cards.find((card) => card.instanceId === asc)!.ownerPlayerId = 'p1';
    state.abilityRuntime!.cardState[asc]!.active = true;
    state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1 = {};
    const isolated = createAbilitySession(state);
    expect(isolated.dispatch('p1', { type: 'set_sieg_sync_state', providerCardInstanceId: asc, active: true }).ok).toBe(true);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer!.p1?.__fd_sieg_sync_active).toBeUndefined();
  });

  it('keeps the overdrive mana threshold exact at 10/11 across a new round', () => {
    const { state } = setup();
    add(state, 'master.sieg.skill.s1', 'p1', 'skill');
    processAbilityEvent(state, { id: 'sieg-overdrive-game-start', type: 'game_start' });
    state.players[0]!.mana = 10;
    expect(persistentExtraAttackAllowance(state, 'p1')).toBe(0);
    state.players[0]!.mana = 11;
    expect(persistentExtraAttackAllowance(state, 'p1')).toBe(1);
    advanceAbilityPhase(state, 'action', state.round.roundNumber + 1, state.round.roundNumber);
    state.players[0]!.mana = 10;
    expect(persistentExtraAttackAllowance(state, 'p1')).toBe(0);
    state.players[0]!.mana = 11;
    expect(persistentExtraAttackAllowance(state, 'p1')).toBe(1);
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
