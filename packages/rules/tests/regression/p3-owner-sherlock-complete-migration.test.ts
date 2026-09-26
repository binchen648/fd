import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { dispatchAbilityCommand, effectiveCardPlayCost, initializeAbilityRuntime, processAbilityEvent } from '../../src/ability/interpreter';
import { deductionRecordAttribute } from '../../src/ability/deduction-record';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';

const archivePath = 'data/authoring/servants/servant.sherlock.json';
const skill = (n: number) => `servant.sherlock.skill.sc-sherlock-${n}`;
const attrs = ['力量','迅捷','魔术','特殊'] as const;

function setup() {
  const raw = JSON.parse(readFileSync(archivePath, 'utf8'));
  const pack = loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = 'servant.sherlock';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[0]!.mana = 20;
  initializeAbilityRuntime(state, pack, { seed: 20260926 });
  return { raw, pack, state };
}
function addCard(state: GameState, definitionId: string, ownerPlayerId: string, zone = 'skill', controllerPlayerId = ownerPlayerId, faceDown = false) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId, zone, visibility: zone === 'hand' ? { scope: 'owner_only', ownerPlayerId } : { scope: 'public' } });
  state.abilityRuntime!.cardState[instanceId] = { active: zone === 'attack_area' && !faceDown, faceDown, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}
function addBasic(state: GameState, id: string, attribute: string, owner = 'p2', zone = 'hand', faceDown = false) {
  const def: AuthoringCard = { id, name: id, cardType: 'basic_attack', cardFace: { attributes: [attribute], cost: 0, basePower: 3 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
  state.abilityRuntime!.pack.cards[id] = def;
  return addCard(state, id, owner, zone, owner, faceDown);
}
function setRecord(state: GameState, attribute: typeof attrs[number]) {
  state.round.activePhase = 'advance';
  state.round.prioritySeat = 1;
  const sc2 = state.cards.find((c) => c.definitionId === skill(2)) ?? addCard(state, skill(2), 'p1', 'attack_area');
  const activate = dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: sc2.instanceId, abilityId: 'sc-sherlock-2.memory-palace' });
  expect(activate.ok).toBe(true);
  const d = state.abilityRuntime!.pendingDecision!;
  const choose = dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: [attribute] });
  expect(choose.ok).toBe(true);
  expect(state.abilityRuntime!.deductionRecordsByPlayer?.p1?.attribute).toBe(attribute);
}

describe('P3 owner-complete Sherlock migration', () => {
  it('loads all seven Sherlock skills and exact four outside-game deduction records', () => {
    const { pack } = setup();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    for (let n=1;n<=7;n++) expect(pack.cards[skill(n)]).toBeDefined();
    for (let n=4;n<=7;n++) expect(pack.cards[skill(n)]!.initialPlacement).toBe('outside_game');
    expect([4,5,6,7].map((n) => deductionRecordAttribute(pack.cards[skill(n)]))).toEqual(attrs);
  });

  it('fails closed on widened deduction-record marker shape', () => {
    const { raw } = setup();
    raw.cards[3].abilities[0].markers.push('extra-marker');
    const pack = loadAuthoringJson(raw);
    expect(pack.report.some((entry) => entry.cardId === skill(4) && entry.path === 'deductionRecord.gateway' && entry.status === 'unsupported')).toBe(true);
  });

  it('fails closed when the Noble-Phantasm deduction exception condition is widened', () => {
    const { raw } = setup();
    const trigger = raw.cards[2].abilities.find((ability: { id: string }) => ability.id === 'sc-sherlock-3.trigger');
    const condition = trigger.conditions.find((entry: { type: string }) => entry.type === 'deduction_record_matches_event_attack');
    condition.extra = 'near-match';
    const pack = loadAuthoringJson(raw);
    expect(pack.report.some((entry) => entry.cardId === skill(3) && entry.status === 'unsupported' && entry.reason.toLowerCase().includes('deduction-record'))).toBe(true);
  });

  it('uses active player count minus round as Empty House play cost and records the paid cost', () => {
    const { state } = setup();
    const sc2 = addCard(state, skill(2), 'p1', 'skill');
    state.round.activePhase = 'action'; state.round.prioritySeat = 1; state.round.roundNumber = 4;
    expect(effectiveCardPlayCost(state, 'p1', sc2.instanceId)).toBe(3);
    const before = state.players[0]!.mana;
    const result = dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: sc2.instanceId });
    expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(before - 3);
    expect(state.abilityRuntime!.cardState[sc2.instanceId]!.paidManaOnPlay).toBe(3);
    state.round.roundNumber = 9;
    expect(effectiveCardPlayCost(state, 'p1', sc2.instanceId)).toBe(0);
  });

  it('Memory Palace creates an owner-private exact deduction choice and records one attribute', () => {
    const { state } = setup();
    addCard(state, skill(2), 'p1', 'attack_area');
    setRecord(state, '迅捷');
    expect(state.abilityRuntime!.deductionRecordsByPlayer?.p1?.definitionId).toBe(skill(5));
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('Retroduction triggers only on another player matching face-up basic attack, gains VP, and offers optional re-record', () => {
    const { state } = setup();
    addCard(state, skill(2), 'p1', 'attack_area');
    addCard(state, skill(3), 'p1', 'attack_area');
    setRecord(state, '力量');
    state.round.activePhase = 'action';
    const attack = addBasic(state, 'basic.test.strength', '力量', 'p2', 'attack_area');
    const before = state.players[0]!.vp;
    processAbilityEvent(state, { id: 'p2:play:strength', type: 'on_card_played', playerId: 'p2', sourceCardId: attack.instanceId, playedCards: [{ instanceId: attack.instanceId, controllerId: 'p2', cardType: 'basic_attack', faceDown: false }] });
    expect(state.players[0]!.vp).toBe(before + 1);
    expect(state.abilityRuntime!.deductionRecordsByPlayer?.p1).toBeUndefined();
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('deduction_record_choice_v1');
    const pending = state.abilityRuntime!.pendingDecision!;
    const decline = dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [] });
    expect(decline.ok).toBe(true);
  });

  it('Retroduction accepts a matching non-basic Noble-Phantasm attack but rejects an ordinary matching non-basic attack', () => {
    const { state } = setup();
    addCard(state, skill(2), 'p1', 'attack_area');
    addCard(state, skill(3), 'p1', 'attack_area');
    setRecord(state, '魔术');
    state.round.activePhase = 'action';

    const ordinaryDefinition: AuthoringCard = {
      id: 'test.nonbasic.magecraft', name: 'ordinary non-basic', cardType: 'servant_skill',
      cardFace: { attributes: ['魔术'], cost: 0, basePower: 3 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
    };
    state.abilityRuntime!.pack.cards[ordinaryDefinition.id] = ordinaryDefinition;
    const ordinary = addCard(state, ordinaryDefinition.id, 'p2', 'attack_area');
    const before = state.players[0]!.vp;
    processAbilityEvent(state, { id: 'p2:play:ordinary-nonbasic', type: 'on_card_played', playerId: 'p2', sourceCardId: ordinary.instanceId,
      playedCards: [{ instanceId: ordinary.instanceId, controllerId: 'p2', cardType: 'servant_skill', faceDown: false }] });
    expect(state.players[0]!.vp).toBe(before);
    expect(state.abilityRuntime!.deductionRecordsByPlayer?.p1?.attribute).toBe('魔术');

    const nobleDefinition: AuthoringCard = {
      id: 'test.noble.magecraft', name: 'noble revealed attack', cardType: 'servant_skill',
      cardFace: { attributes: ['魔术', '宝具'], cost: 0, basePower: 4 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic',
    };
    state.abilityRuntime!.pack.cards[nobleDefinition.id] = nobleDefinition;
    const noble = addCard(state, nobleDefinition.id, 'p2', 'attack_area');
    processAbilityEvent(state, { id: 'p2:play:noble-nonbasic', type: 'on_card_played', playerId: 'p2', sourceCardId: noble.instanceId,
      playedCards: [{ instanceId: noble.instanceId, controllerId: 'p2', cardType: 'servant_skill', faceDown: false }] });
    expect(state.players[0]!.vp).toBe(before + 1);
    expect(state.abilityRuntime!.deductionRecordsByPlayer?.p1).toBeUndefined();
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('deduction_record_choice_v1');
  });

  it('Retroduction ignores facedown/nonbasic event plays and unresolved record expires for 3 VP', () => {
    const { state } = setup();
    addCard(state, skill(2), 'p1', 'attack_area'); addCard(state, skill(3), 'p1', 'attack_area');
    state.players[0]!.vp = 5; setRecord(state, '魔术');
    const attack = addBasic(state, 'test.nonbasic', '魔术', 'p2', 'attack_area', true);
    state.abilityRuntime!.pack.cards[attack.definitionId]!.cardType = 'servant_skill';
    processAbilityEvent(state, { id: 'p2:play:no-match', type: 'on_card_played', playerId: 'p2', sourceCardId: attack.instanceId, playedCards: [{ instanceId: attack.instanceId, controllerId: 'p2', cardType: 'servant_skill', faceDown: true }] });
    expect(state.abilityRuntime!.deductionRecordsByPlayer?.p1?.attribute).toBe('魔术');
    processAbilityEvent(state, { id: 'round:end:test', type: 'round_end', playerId: 'p1' });
    expect(state.abilityRuntime!.deductionRecordsByPlayer?.p1).toBeUndefined();
    expect(state.players[0]!.vp).toBe(2);
  });

  it('Elementary reveals target private cards, resolves matching record, flags battle defeat, and offers re-record', () => {
    const { state } = setup();
    addCard(state, skill(2), 'p1', 'attack_area'); const sc1 = addCard(state, skill(1), 'p1', 'attack_area');
    setRecord(state, '特殊');
    addBasic(state, 'basic.test.special', '特殊', 'p2', 'hand');
    addBasic(state, 'basic.test.hidden', '力量', 'p2', 'attack_area', true);
    state.round.activePhase = 'combat'; state.round.prioritySeat = 1;
    const start = dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: sc1.instanceId, abilityId: 'sc-sherlock-1.elementary' });
    expect(start.ok).toBe(true);
    const targetDecision = state.abilityRuntime!.pendingDecision!;
    expect(targetDecision.candidates).toContain('p2');
    const resolve = dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: targetDecision.id, selectedIds: ['p2'] });
    expect(resolve.ok).toBe(true);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    expect(state.players[0]!.vp).toBe(1);
    const revealEvent = state.abilityRuntime!.events.find((e) => e.type === 'deduction_cards_revealed');
    expect(revealEvent?.visibility).toBe('p1');
    expect(revealEvent?.revealedCardDefinitionIds).toEqual(expect.arrayContaining(['basic.test.special','basic.test.hidden']));
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('deduction_record_choice_v1');
  });
});
