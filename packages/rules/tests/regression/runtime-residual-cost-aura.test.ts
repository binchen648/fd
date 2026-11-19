import {expect, it} from 'vitest';
import {loadAuthoringJson} from '../../src/ability/loader';
import {advanceAbilityPhase, cardManaCost, executeAbility, initializeAbilityRuntime, initializeActionTurns} from '../../src/ability/interpreter';
import {createMatchSession} from '../../src/match-session';
import {restoreTrustedAuthoringFixtureSession} from '../trusted-authoring-fixture';

const golems = ['card.x-lessergolem', 'card.x-commongolem'] as const;
const timing = {phase: 'action', window: 'controller_play_card_window'};

function setup() {
  const session = createMatchSession({seed: 20260907});
  const s = session.state;
  const canonical = s.abilityRuntime!.pack;
  const cards = [...golems, 'fixture.non-golem'].map((id, index) => ({
    id, name: id, cardType: 'servant_deck_card',
    cardFace: {cost: 0, basePower: index === 1 ? 3 : 2, attributes: ['力量']},
    playTiming: timing, playRequirements: [],
    abilities: index > 1 ? [] : [{
      id: 'hand-golem-cost-plus1', kind: 'residual', printedClause: '残留：你手牌中的【魔像】魔力消耗+1。',
      activation: {trigger: 'while_active'}, conditions: [], targets: [], effects: [], creates: [], cost: [],
      ruleModifiers: [{rule: 'card.manaCost', operation: 'add', value: 1, scope: {
        subject: 'controller', location: 'source_location', zone: ['hand'],
        constraints: [{type: 'or', conditions: golems.map(cardId => ({type: 'has_card_id', cardId}))}],
      }}],
      lifecycle: {duration: 'while_card_active', cleanup: 'when_card_leaves_active_area'},
      responseWindow: {}, limit: {}, visibility: {}, execution: {mode: 'automatic', allowedOperations: []},
    }],
  }));
  const loaded = loadAuthoringJson({schemaVersion:'fd-card-authoring-v1', id:'fixture.golems', name:'Scoped Golem clauses', cards});
  expect(loaded.report).toEqual([]);
  s.cards = []; s.modeState = {}; s.eventPlacements = []; s.currentSituationModifiers = [];
  delete s.abilityRuntime;
  initializeAbilityRuntime(s, {...canonical, cards: {...canonical.cards, ...loaded.cards}});
  for (const p of s.players) {p.locationId = 'shinto'; p.mana = 10;}
  function add(instanceId: string, definitionId: string, ownerPlayerId = 'p1', zone: 'hand' | 'deck' = 'hand') {
    s.cards.push({instanceId, definitionId, ownerPlayerId, controllerPlayerId: ownerPlayerId, zone,
      visibility: {scope: 'owner_only', ownerPlayerId}});
  }
  add('source', golems[0]); add('first-companion','fixture.non-golem');
  add('next', golems[1], 'p1', 'deck'); add('later', golems[0], 'p1', 'deck');
  add('opponent', golems[0], 'p2'); add('non-golem', 'fixture.non-golem', 'p1', 'deck');
  s.round.activePhase = 'action'; s.round.prioritySeat = 1;
  initializeActionTurns(s);
  return session;
}

function stagedBatch(session: ReturnType<typeof setup>, ids: string[]) {
  for (const cardInstanceId of ids) expect(session.dispatchPlayerAction('p1', {type:'stage_attack_card',cardInstanceId}).ok).toBe(true);
  const confirmed = session.dispatchPlayerAction('p1', {type:'confirm_staged_attack'});
  expect(confirmed.ok, JSON.stringify(confirmed.rejection)).toBe(true);
}

it('reads an actual played residual on restore and charges only its eligible hand targets', () => {
  let session = setup();
  expect(session.dispatchPlayerAction('p1', {type:'skip_normal_move'}).ok).toBe(true);
  stagedBatch(session, ['source','first-companion']);
  expect(session.state.abilityRuntime!.cardState.source).toMatchObject({active:true, faceDown:false, playedRound:1});
  advanceAbilityPhase(session.state,'round_end',1);
  advanceAbilityPhase(session.state,'action',2);
  session.state.round.prioritySeat = 1;
  initializeActionTurns(session.state);
  const next = session.state.cards.find(c => c.instanceId === 'next')!;
  next.zone = 'hand';
  session = restoreTrustedAuthoringFixtureSession(session.serializeSession());
  const s = session.state, before = session.getState();
  expect(s.abilityRuntime!.cardState.source?.active).toBe(true);
  expect(cardManaCost(s,'next')).toBe(1);
  expect(cardManaCost(s,'opponent')).toBe(0);
  expect(cardManaCost(s,'later')).toBe(0);
  expect(cardManaCost(s,'non-golem')).toBe(0);
  expect(session.getPlayerView('p1').cards.find(c => c.instanceId === 'next')?.currentManaCost).toBe(1);
  expect(session.getState()).toEqual(before);
  expect(session.dispatchPlayerAction('p1', {type:'skip_normal_move'}).ok).toBe(true);
  stagedBatch(session, ['next']);
  expect(s.abilityRuntime!.cardState.next!.paidManaOnPlay).toBe(1);
  expect(s.players[0]!.mana).toBe(9);
  const later = s.cards.find(c => c.instanceId === 'later')!;
  later.zone = 'hand';
  expect(cardManaCost(s, 'later')).toBe(2);
  s.abilityRuntime!.cardState.source!.active = false;
  expect(cardManaCost(s, 'later')).toBe(1);
});

it('counts a residual once when its while-active modifier is also installed', () => {
  const session = setup();
  expect(session.dispatchPlayerAction('p1', {type:'skip_normal_move'}).ok).toBe(true);
  stagedBatch(session, ['source','first-companion']);
  session.state.cards.find(c => c.instanceId === 'next')!.zone = 'hand';
  executeAbility(session.state, {controllerId:'p1',sourceCardId:'source',abilityId:'hand-golem-cost-plus1',variables:{},selections:{}});
  expect(session.state.abilityRuntime!.ongoingEffects.some(e => e.sourceCardId === 'source')).toBe(true);
  expect(cardManaCost(session.state,'next')).toBe(1);
});
