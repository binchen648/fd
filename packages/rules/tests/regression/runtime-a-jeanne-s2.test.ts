import jeanneArchive from '../../../../data/authoring/servants/servant.jeanne.json';
import { describe, expect, it } from 'vitest';
import {
  advanceAbilityPhase,
  createMatchSession,
  getLegalActions,
  initializeAbilityRuntime,
  initializeActionTurns,
  loadAuthoringJson,
  playAbilityCardBatch,
  restoreMatchSession,
} from '../../src/index';

const jeanneS2Id = 'servant.jeanne.skill.sc-jeanne-2';

function makeJeanneArchive() {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    id: 'fixture.jeanne-s2',
    cards: [
      structuredClone(jeanneArchive.cards.find(card => card.id === jeanneS2Id)!),
      {
        id: 'basic.luck',
        name: '幸运',
        cardType: 'basic_attack',
        cardFace: { cost: 0, basePower: 0, attributes: ['特殊'] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        abilities: [],
      },
      {
        id: 'basic.strength',
        name: '力量',
        cardType: 'basic_attack',
        cardFace: { cost: 0, basePower: 3, attributes: ['力量'] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        abilities: [],
      },

    ],
  };
}

function setup() {
  const session = createMatchSession({ restorePackKind: 'trusted_authoring_fixture', seed: 20261125, humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2'] });
  const state = session.state;
  const loaded = loadAuthoringJson(makeJeanneArchive());
  expect(loaded.report).toEqual([]);
  const pack = state.abilityRuntime!.pack;
  state.players[0]!.mana = 10;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.mana = 10;
  state.players[1]!.locationId = 'miyama_town';
  state.cards = [
    { instanceId: 'jeanne-s2', definitionId: jeanneS2Id, zone: 'skill', ownerPlayerId: 'p1', controllerPlayerId: 'p1', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'p1-deck-luck', definitionId: 'basic.luck', zone: 'deck', ownerPlayerId: 'p1', controllerPlayerId: 'p1', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'p1-hand-str', definitionId: 'basic.strength', zone: 'hand', ownerPlayerId: 'p1', controllerPlayerId: 'p1', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    { instanceId: 'p2-deck-luck', definitionId: 'basic.luck', zone: 'deck', ownerPlayerId: 'p2', controllerPlayerId: 'p2', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
    { instanceId: 'p2-hand-str', definitionId: 'basic.strength', zone: 'hand', ownerPlayerId: 'p2', controllerPlayerId: 'p2', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
  ];
  delete state.abilityRuntime;
  initializeAbilityRuntime(state, { ...pack, cards: { ...pack.cards, ...loaded.cards } });
  state.round = { roundNumber: 1, activePhase: 'action', prioritySeat: 1 };
  state.modeState = {};
  state.eventPlacements = [];
  state.currentSituationModifiers = [];
  return { session, state };
}

describe('Jeanne S2 (JEA-S2-01): multi-player draw, combat playPhase for Luck, public_board Luck power', () => {
  it('draws 1 card for all active players and lets both seats play newly drawn Luck in battle phase', () => {
    const { session, state } = setup();
    initializeActionTurns(state);
    expect(session.dispatchPlayerAction('p1', { type: 'skip_normal_move' }).ok).toBe(true);
    const s1 = session.dispatchPlayerAction('p1', { type: 'stage_attack_card', cardInstanceId: 'jeanne-s2' });
    expect(s1.ok, JSON.stringify(s1.rejection)).toBe(true);
    const s2 = session.dispatchPlayerAction('p1', { type: 'stage_attack_card', cardInstanceId: 'p1-hand-str' });
    expect(s2.ok, JSON.stringify(s2.rejection)).toBe(true);
    const conf = session.dispatchPlayerAction('p1', { type: 'confirm_staged_attack' });
    expect(conf.ok, JSON.stringify(conf.rejection)).toBe(true);
    const activate = session.dispatchPlayerAction('p1', {
      type: 'activate_ability',
      cardInstanceId: 'jeanne-s2',
      abilityId: 'sc-jeanne-2.luck-play',
    });
    expect(activate.ok, JSON.stringify(activate.rejection)).toBe(true);
    // Both p1 and p2 drew their deck Luck cards
    expect(state.cards.find(c => c.instanceId === 'p1-deck-luck')?.zone).toBe('hand');
    expect(state.cards.find(c => c.instanceId === 'p2-deck-luck')?.zone).toBe('hand');

    // Duplicate activation in same round rejected
    const dup = session.dispatchPlayerAction('p1', {
      type: 'activate_ability',
      cardInstanceId: 'jeanne-s2',
      abilityId: 'sc-jeanne-2.luck-play',
    });
    expect(dup.ok).toBe(false);

    // Serialize & restore BEFORE battle phase: proves drawn cards + card.playPhase ongoing survive restore
    const restored = restoreMatchSession(JSON.parse(JSON.stringify(session.serializeSession())), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.cards.find(c => c.instanceId === 'p1-deck-luck')?.zone).toBe('hand');
    expect(restored.state.cards.find(c => c.instanceId === 'p2-deck-luck')?.zone).toBe('hand');

    // Enter battle phase on restored session: p1 can play newly drawn Luck
    restored.state.round.activePhase = 'battle';
    restored.state.round.prioritySeat = 1;
    const p1PlayLuck = restored.dispatchPlayerAction('p1', { type: 'play_card', cardInstanceId: 'p1-deck-luck' });
    expect(p1PlayLuck.ok, JSON.stringify(p1PlayLuck.rejection)).toBe(true);
    expect(restored.state.cards.find(c => c.instanceId === 'p1-deck-luck')?.zone).toBe('attack_area');

    // p2's battle turn on restored session: p2 cannot play Strength, CAN play newly drawn Luck
    restored.state.round.prioritySeat = 2;
    const p2PlayStr = restored.dispatchPlayerAction('p2', { type: 'play_card', cardInstanceId: 'p2-hand-str' });
    expect(p2PlayStr.ok).toBe(false);
    const p2PlayLuck = restored.dispatchPlayerAction('p2', { type: 'play_card', cardInstanceId: 'p2-deck-luck' });
    expect(p2PlayLuck.ok, JSON.stringify(p2PlayLuck.rejection)).toBe(true);
    expect(restored.state.cards.find(c => c.instanceId === 'p2-deck-luck')?.zone).toBe('attack_area');
  });

  it('revokes combat playPhase for Luck when source is closed or after round end', () => {
    const { session, state } = setup();
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'jeanne-s2' }]);
    expect(session.dispatchPlayerAction('p1', {
      type: 'activate_ability',
      cardInstanceId: 'jeanne-s2',
      abilityId: 'sc-jeanne-2.luck-play',
    }).ok).toBe(true);

    // Close source card -> combat playPhase must immediately cease
    state.abilityRuntime!.cardState['jeanne-s2']!.active = false;
    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    expect(session.dispatchPlayerAction('p1', { type: 'play_card', cardInstanceId: 'p1-deck-luck' }).ok).toBe(false);

    // Re-activate and advance to next round -> round end cleanup must revoke
    state.abilityRuntime!.cardState['jeanne-s2']!.active = true;
    advanceAbilityPhase(state, 'round_end');
    state.round = { roundNumber: 2, activePhase: 'battle', prioritySeat: 1 };
    expect(session.dispatchPlayerAction('p1', { type: 'play_card', cardInstanceId: 'p1-deck-luck' }).ok).toBe(false);
  });

  it('counts only face-up public_board Luck cards for +2 total power (excludes face-down and hand Luck)', () => {
    const { session, state } = setup();
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'jeanne-s2' }]);
    // Put 2 face-up Luck on board, 1 face-down Luck on board, 1 Luck in hand
    state.cards.push(
      { instanceId: 'board-luck-1', definitionId: 'basic.luck', zone: 'attack_area', ownerPlayerId: 'p1', controllerPlayerId: 'p1', visibility: { scope: 'public' } },
      { instanceId: 'board-luck-2', definitionId: 'basic.luck', zone: 'attack_area', ownerPlayerId: 'p2', controllerPlayerId: 'p2', visibility: { scope: 'public' } },
      { instanceId: 'board-luck-fd', definitionId: 'basic.luck', zone: 'attack_area', ownerPlayerId: 'p2', controllerPlayerId: 'p2', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } },
      { instanceId: 'hand-luck', definitionId: 'basic.luck', zone: 'hand', ownerPlayerId: 'p1', controllerPlayerId: 'p1', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } },
    );
    state.abilityRuntime!.cardState['board-luck-1'] = { active: true, faceDown: false, playedRound: 1 };
    state.abilityRuntime!.cardState['board-luck-2'] = { active: true, faceDown: false, playedRound: 1 };
    state.abilityRuntime!.cardState['board-luck-fd'] = { active: true, faceDown: true, playedRound: 1 };

    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    const activatePower = session.dispatchPlayerAction('p1', {
      type: 'activate_ability',
      cardInstanceId: 'jeanne-s2',
      abilityId: 'sc-jeanne-2.luck-power',
    });
    expect(activatePower.ok, JSON.stringify(activatePower.rejection)).toBe(true);
    const mod = state.abilityRuntime!.ongoingEffects
      .flatMap(o => o.ruleModifiers)
      .find(m => m.sourceCardId === 'jeanne-s2' && m.definition.rule === 'battle.totalPower');
    // 2 face-up Luck on board * 2 = +4 total power
    expect(mod?.definition.value).toBe(4);
  });

  it('recycles empty deck from discard during all-player draw and allows combat Luck play even after 2 action-phase attacks', () => {
    const { session, state } = setup();
    // Move p2's deck card to discard so p2 must recycle to draw
    state.cards.find(c => c.instanceId === 'p2-deck-luck')!.zone = 'discard';
    // p1 plays jeanne-s2 + strength (2 attacks = reaches regular action-phase attack limit)
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'jeanne-s2' }, { cardInstanceId: 'p1-hand-str' }]);
    const activate = session.dispatchPlayerAction('p1', {
      type: 'activate_ability',
      cardInstanceId: 'jeanne-s2',
      abilityId: 'sc-jeanne-2.luck-play',
    });
    expect(activate.ok, JSON.stringify(activate.rejection)).toBe(true);
    expect(state.cards.find(c => c.instanceId === 'p1-deck-luck')?.zone).toBe('hand');
    expect(state.cards.find(c => c.instanceId === 'p2-deck-luck')?.zone).toBe('hand');

    // Even though p1 already declared 2 attacks this round, combat-phase granted Luck play succeeds
    state.round.activePhase = 'battle';
    state.round.prioritySeat = 1;
    // B2: getLegalActions advertises play_card (not stage_attack_card), and stage_attack_card / faceDown play_card are rejected
    const legal = getLegalActions(state, 'p1');
    expect(legal).toContainEqual({ type: 'play_card', cardInstanceId: 'p1-deck-luck' });
    expect(legal.some(a => a.type === 'stage_attack_card' && a.cardInstanceId === 'p1-deck-luck')).toBe(false);
    expect(session.dispatchPlayerAction('p1', { type: 'stage_attack_card', cardInstanceId: 'p1-deck-luck' }).ok).toBe(false);
    expect(session.dispatchPlayerAction('p1', { type: 'play_card', cardInstanceId: 'p1-deck-luck', faceDown: true }).ok).toBe(false);

    const playLuck = session.dispatchPlayerAction('p1', { type: 'play_card', cardInstanceId: 'p1-deck-luck' });
    expect(playLuck.ok, JSON.stringify(playLuck.rejection)).toBe(true);
    expect(state.cards.find(c => c.instanceId === 'p1-deck-luck')?.zone).toBe('attack_area');
  });

  it('skips eliminated players during all-player draw (F1)', () => {
    const { session, state } = setup();
    state.players[1]!.status = 'eliminated';
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: 'jeanne-s2' }]);
    const activate = session.dispatchPlayerAction('p1', {
      type: 'activate_ability',
      cardInstanceId: 'jeanne-s2',
      abilityId: 'sc-jeanne-2.luck-play',
    });
    expect(activate.ok, JSON.stringify(activate.rejection)).toBe(true);
    expect(state.cards.find(c => c.instanceId === 'p1-deck-luck')?.zone).toBe('hand');
    expect(state.cards.find(c => c.instanceId === 'p2-deck-luck')?.zone).toBe('deck');
  });

});
