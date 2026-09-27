import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  advanceAbilityPhase,
  calculateCardPower,
  dispatchAbilityCommand,
  getLegalActions,
  initializeAbilityRuntime,
  playAbilityCardBatch,
  processAbilityEvent,
} from '../../src/ability/interpreter';
import { getEffectiveCardAttributes } from '../../src/ability/card-instance-state';
import { GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID } from '../../src/ability/revealed-card-mechanics';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const archivePath = 'data/authoring/servants/servant.sigurd.json';
const ROOT = 'servant.sigurd';
const skill = (n: number) => `${ROOT}.skill.sc-sigurd-${n}`;

function rawArchive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = rawArchive();
  const pack = loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'miyama_town';
  state.players[0]!.mana = 30;
  state.players[0]!.vp = 10;
  initializeAbilityRuntime(state, pack, { seed: 20260927 });
  return { raw, pack, state };
}

function addCard(state: GameState, definitionId: string, owner = 'p1', zone = 'skill', active = false) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area', 'removed_from_game'].includes(zone)
      ? { scope: 'public' }
      : { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}

function addBasic(state: GameState, id: string, owner = 'p1', zone = 'hand', basePower = 4) {
  const def: AuthoringCard = {
    id, name: id, cardType: 'basic_attack',
    cardFace: { attributes: ['力量'], cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities: [], mode: 'automatic',
  };
  state.abilityRuntime!.pack.cards[id] = def;
  return addCard(state, id, owner, zone, zone === 'attack_area');
}

function markRevealed(state: GameState, instanceId: string) {
  state.abilityRuntime!.cardPlayCountByInstance![instanceId] = 1;
  state.abilityRuntime!.cardState[instanceId]!.faceDown = false;
}

describe('P3 owner-complete Sigurd migration', () => {
  it('loads exactly all three frozen Sigurd skills with source-grounded card metadata and no unsupported mechanics', () => {
    const { raw, pack } = setup();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect([1, 2, 3].map((n) => pack.cards[skill(n)]?.name)).toEqual(['破灭之黎明', '坏劫之天轮', '里迪尔·赫萝蒂']);
    expect(raw.deck.reduce((sum: number, entry: { count?: number }) => sum + Number(entry.count ?? 1), 0)).toBe(12);
    expect(raw.deck.flatMap((entry: { cardId: string; count?: number }) => Array(Number(entry.count ?? 1)).fill(entry.cardId))).toEqual([
      'card.cardb2', 'card.cardb2', 'card.cardb3', 'card.cardq1', 'card.cardq2', 'card.cardq2',
      'card.cardq3', 'card.cardq3', 'card.cardq4', 'card.cardluck', 'card.cardsurveil', 'card.cardsurveil',
    ]);
    expect(raw.cards.map((card: any) => [card.cardFace.cost, card.cardFace.basePower, card.playRequirements[0]?.value])).toEqual([
      [11, 3, 11],
      [0, 5, 8],
      [3, 5, 3],
    ]);
  });

  it('fails closed when the accepted revealed-source consumer marker shapes are widened', () => {
    const grant = rawArchive();
    grant.cards[1].abilities[1].effects[0].extra = 'near-match';
    const grantPack = loadAuthoringJson(grant);
    expect(grantPack.report.some((entry) => entry.abilityId === 'sc-sigurd-2.blade-storm' && entry.status === 'unsupported')).toBe(true);

    const attributes = rawArchive();
    attributes.cards[2].abilities[1].effects[0].extra = 'near-match';
    const attributesPack = loadAuthoringJson(attributes);
    expect(attributesPack.report.some((entry) => entry.abilityId === 'sc-sigurd-3.revealed-attributes' && entry.status === 'unsupported')).toBe(true);
  });

  it('reveals Gram II on play and applies its curse only after the physical card has been revealed', () => {
    const { state } = setup();
    const gram = addCard(state, skill(1));
    processAbilityEvent(state, { id: 'round-start:before-gram', type: 'round_start' });
    expect(state.players[0]!.vp).toBe(10);

    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: gram.instanceId }).ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[gram.instanceId]).toBe(1);

    const live = state.cards.find((card) => card.instanceId === gram.instanceId)!;
    live.zone = 'discard'; live.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    state.abilityRuntime!.cardState[gram.instanceId]!.active = false;
    advanceAbilityPhase(state, 'round_end');
    advanceAbilityPhase(state, 'preparation', state.round.roundNumber + 1);
    expect(state.players[0]!.vp).toBe(9);
  });

  it('refunds exactly one current-round attack paid cost from an opponent in Sigurd fight after battle', () => {
    const { state } = setup();
    const gram = addCard(state, skill(1), 'p1', 'discard');
    markRevealed(state, gram.instanceId);
    const opponent = addBasic(state, 'basic.sigurd-refund-opponent', 'p2', 'attack_area', 6);
    const otherOpponent = addBasic(state, 'basic.sigurd-refund-other', 'p3', 'attack_area', 5);
    state.players[2]!.locationId = 'shinto';
    state.abilityRuntime!.cardState[opponent.instanceId]!.paidManaOnPlay = 5;
    state.abilityRuntime!.cardState[opponent.instanceId]!.playedRound = state.round.roundNumber;
    state.abilityRuntime!.cardState[otherOpponent.instanceId]!.paidManaOnPlay = 7;
    state.abilityRuntime!.cardState[otherOpponent.instanceId]!.playedRound = state.round.roundNumber;
    state.players[0]!.mana = 1;

    processAbilityEvent(state, {
      id: `battle-phase:${state.round.roundNumber}:after_battle_ended`,
      type: 'after_battle_ended',
      battlePhaseResolutionId: `battle-phase:${state.round.roundNumber}`,
      battleParticipantIds: ['p1', 'p2', 'p3'],
    });
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual([opponent.instanceId, otherOpponent.instanceId]);
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: [opponent.instanceId] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(6);
  });

  it('grants Blade Storm only after Bölverk Gram was physically revealed and removes the transformed basic only at canonical battle terminal', () => {
    const { state } = setup();
    const bolverk = addCard(state, skill(2));
    const basic = addBasic(state, 'basic.sigurd-blade-storm', 'p1', 'attack_area', 4);
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    expect(getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === basic.instanceId && entry.abilityId === GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID)).toBe(false);

    expect(dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: bolverk.instanceId }).ok).toBe(true);
    const vpBeforeCurse = state.players[0]!.vp;
    processAbilityEvent(state, { id: 'round-start:bolverk-revealed', type: 'round_start' });
    expect(state.players[0]!.vp).toBe(vpBeforeCurse - 1);
    expect(getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === basic.instanceId && entry.abilityId === GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID)).toBe(true);
    const manaBefore = state.players[0]!.mana;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: basic.instanceId, abilityId: GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(manaBefore - 2);
    expect(calculateCardPower(state, basic.instanceId).value).toBe(8);

    processAbilityEvent(state, { id: 'not-a-terminal', type: 'after_battle_ended' });
    expect(state.cards.find((card) => card.instanceId === basic.instanceId)?.zone).toBe('attack_area');
    processAbilityEvent(state, {
      id: `battle-phase:${state.round.roundNumber}:after_battle_ended`, type: 'after_battle_ended',
      battlePhaseResolutionId: `battle-phase:${state.round.roundNumber}`, battleParticipantIds: ['p1', 'p2'],
    });
    expect(state.cards.find((card) => card.instanceId === basic.instanceId)?.zone).toBe('removed_from_game');
  });

  it('requires Ridill Hrotti to be an additional play and grants attributes from the two physically revealed Gram cards', () => {
    const solo = setup();
    const soloRidill = addCard(solo.state, skill(3));
    solo.state.round.activePhase = 'action'; solo.state.round.prioritySeat = 1;
    expect(() => playAbilityCardBatch(solo.state, 'p1', [{ cardInstanceId: soloRidill.instanceId }])).toThrow();

    const { state } = setup();
    const gram = addCard(state, skill(1), 'p1', 'discard');
    const bolverk = addCard(state, skill(2), 'p1', 'discard');
    const ridill = addCard(state, skill(3));
    const basic = addBasic(state, 'basic.sigurd-ridill-lead', 'p1', 'hand');
    expect(getEffectiveCardAttributes(state, ridill.instanceId)).toEqual(['力量']);
    markRevealed(state, bolverk.instanceId);
    expect(getEffectiveCardAttributes(state, ridill.instanceId)).toEqual(['力量', '迅捷']);
    markRevealed(state, gram.instanceId);
    expect(getEffectiveCardAttributes(state, ridill.instanceId)).toEqual(['力量', '迅捷', '魔术']);

    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: basic.instanceId }, { cardInstanceId: ridill.instanceId }]);
    expect(state.cards.find((card) => card.instanceId === ridill.instanceId)?.zone).toBe('attack_area');
  });
});