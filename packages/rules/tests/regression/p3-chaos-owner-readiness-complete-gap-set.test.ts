import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { playerCombatTotalPowerAdjustment } from '../../src/ability/owner-self-mechanics';
import { terrainAdvantageAtLocation } from '../../src/ability/terrain-advantage-override';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'fixture.definition-side-deck';
const S1 = `${ROOT}.provider`;
const S17 = `${ROOT}.one-shot`;
const ASC = `${ROOT}.ascension`;
const DECK = 'fixture.beasts';
const BEASTS = Array.from({ length: 15 }, (_, i) => `${ROOT}.beast.${i + 2}`);
const [B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13,B14,B15,B16] = BEASTS;
const REMOTE = 'fixture.remote-operation';
const LUCK = 'basic.luck';
const NP = 'fixture.noble-phantasm';

const responseWindow = { order: 'turn_order', passBehavior: 'decline_this_window' };
const execution = { mode: 'automatic', allowedOperations: [] as string[] };
const common = { conditions: [] as any[], targets: [] as any[], cost: [] as any[], ruleModifiers: [] as any[], creates: [] as any[], lifecycle: {}, responseWindow, limit: {}, visibility: {}, execution };
const forced = (id: string, trigger: string, effect: any, conditions: any[] = []) => ({ id, kind: 'forced_trigger', printedClause: id, activation: { trigger }, ...common, conditions, effects: [effect] });
const passive = (id: string, effect: any) => ({ id, kind: 'passive', printedClause: id, activation: { trigger: 'while_active' }, ...common, effects: [effect] });
const action = (id: string, phase: 'advance'|'action'|'combat', effect: any) => ({ id, kind: 'phase_action', printedClause: id, activation: { phase, opens: phase === 'combat' ? 'controller_combat_action_window' : 'controller_action_window' }, ...common, effects: [effect] });
const residual = (id: string, effect: any) => ({ id, kind: 'residual', printedClause: id, activation: { trigger: 'on_card_played' }, ...common, effects: [effect] });
const card = (id: string, abilities: any[], cost = 0, basePower = 0, attributes: string[] = [], cardType = 'master_skill') => ({
  id, aliases: [id.split('.').at(-1)], legacyId: id.split('.').at(-1), name: id, cardType,
  owner: { type: 'master', id: ROOT }, printedText: id,
  cardFace: { typeLabel: attributes[0] ?? '被动', attributes, cost, basePower },
  playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
  verification: { implementationStatus: 'complete' },
});

const raw = {
  schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: ROOT, name: ROOT, class: 'Master',
  publicInformation: { type: 'master_package', initialMana: 4 },
  cards: [
    card(S1, [
      forced('fixture.setup', 'game_start', { type: 'definition_side_deck_setup', deckKey: DECK, definitionIds: BEASTS, shuffle: true, recycleDiscard: true, replaceOrdinaryCommandSealsWithVirtual: true }),
      passive('fixture.mana-draw', { type: 'definition_side_deck_mana_draw_rule', deckKey: DECK, divisor: 2, rounding: 'floor', excludedSourceDefinitionIds: [B3, S17] }),
      action('fixture.play-beast', 'advance', { type: 'definition_side_deck_play_action', deckKey: DECK, usageKey: 'fixture.play', maxUsesPerRound: 1, costSource: 'printed_cost' }),
    ]),
    card(S17, [action('fixture.one-shot', 'action', { type: 'definition_side_deck_one_shot_choice', deckKey: DECK, oncePerGame: true, manaGain: 2, directDraw: 1, victoryPointReward: 2, allowAdjacentMove: true, allowBonusSideDeckPlay: true })]),
    card(ASC, [
      passive('fixture.unlimited', { type: 'definition_side_deck_unlimited_play', deckKey: DECK, unlimited: true }),
      action('fixture.pay-draw', 'action', { type: 'definition_side_deck_pay_mana_draw', deckKey: DECK, manaCost: 4, drawCount: 1, suppressManaDrawObserver: true }),
    ]),
    card(B2, [passive('fixture.b2', { type: 'source_opponent_count_power', amountPerOpponent: 1, requireSameBattlefield: true })], 0, 0, ['力量']),
    card(B3, [action('fixture.b3', 'action', { type: 'definition_side_deck_discard_for_mana', deckKey: DECK, maxDiscard: 3, manaPerCard: 2, suppressManaDrawObserver: true })], 0, 2, ['迅捷']),
    card(B4, [residual('fixture.b4', { type: 'definition_side_deck_delayed_draw_discard', deckKey: DECK, delayRounds: 1, drawCount: 3, discardCount: 2 })], 0, 1, ['魔术']),
    card(B5, [forced('fixture.b5', 'after_controller_enters_location', { type: 'entering_opponent_power_penalty_round', amount: 5, duration: 'this_round', requireSameLocation: true }, [{ type: 'event_player_is_opponent' }])], 0, 0, ['特殊']),
    card(B6, [forced('fixture.b6', 'after_controller_loses_battle', { type: 'definition_side_deck_battle_loss_draw', deckKey: DECK, count: 2 })], 0, 3, ['力量']),
    card(B7, [forced('fixture.b7', 'after_controller_wins_battle', { type: 'battle_win_vp_swing', controllerGain: 2, loserLoss: 2, scope: 'battle_losers' })], 2, 3, ['力量']),
    card(B8, [action('fixture.b8', 'combat', { type: 'defeat_engaged_definition_controller', requiredControlledDefinitionId: REMOTE, targetCount: 1 })], 1, 2, ['迅捷']),
    card(B9, [passive('fixture.b9', { type: 'same_battlefield_definition_power_zero', targetDefinitionId: LUCK, value: 0 })], 1, 2, ['魔术']),
    {
      ...card(B10, [], 1, 1, ['特殊']), abilities: [{
        id: 'fixture.b10', kind: 'phase_action', printedClause: 'fixture.b10', activation: { phase: 'action', opens: 'controller_action_window' },
        conditions: [{ type: 'source_owned' }], targets: [], effects: [{ type: 'double_controller_terrain_this_round', multiplier: 2, duration: 'this_round' }],
        cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow, limit: {}, visibility: {}, execution,
      }],
    },
    card(B11, [residual('fixture.b11', { type: 'definition_side_deck_virtual_command_seal', deckKey: DECK, closeSourceAfterUse: true })], 1, 1, ['力量']),
    card(B12, [action('fixture.b12', 'action', { type: 'forward_move_source_power', minX: 1, maxX: 8, powerBase: 1, powerPerX: 1, followMovementArrows: true })], 0, 0, ['力量']),
    card(B13, [action('fixture.b13', 'action', { type: 'discard_location_event_by_vp', minimumX: 0, vpOffset: 2, requireControllerLocation: true })], 0, 0, ['迅捷']),
    card(B14, [passive('fixture.b14', { type: 'controller_attribute_power_bonus', attribute: '宝具', amount: 2 })], 3, 3, ['魔术']),
    card(B15, [passive('fixture.b15', { type: 'unsealed_engaged_opponent_power_penalty', amount: 3, requireNoCommandSealSpendOrUseThisRound: true })], 3, 4, ['特殊']),
    card(B16, [residual('fixture.b16', { type: 'definition_side_deck_discard_all_source_power', deckKey: DECK, multiplier: 2, maximum: 10 })], 0, 0, ['特殊']),
    card(REMOTE, []), card(LUCK, [], 0, 4, ['特殊'], 'basic_attack'), card(NP, [], 0, 5, ['宝具'], 'basic_attack'),
  ], sources: [],
};

const loaded = rules.loadAuthoringJson(raw);
function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill', active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area','field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup(options: { ascension?: boolean; drawAll?: boolean } = {}) {
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1,2,3] }); state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261006 });
  const provider = add(state, S1); const scramble = add(state, S17); const asc = add(state, ASC, 'p1', options.ascension ? 'skill' : 'outside_game');
  state.players[0]!.masterCardId = ROOT; state.players[0]!.mana = 10; state.players[0]!.vp = 0; state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.mana = 10; state.players[1]!.vp = 5; state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.mana = 10; state.players[2]!.vp = 5; state.players[2]!.locationId = 'shinto';
  state.round.roundNumber = 1; state.round.activePhase = 'preparation'; state.round.prioritySeat = state.players[0]!.seat;
  rules.processAbilityEvent(state, { id: 'fixture:start', type: 'game_start', playerId: 'p1' });
  if (options.drawAll) rules.drawDefinitionSideDeck(state, 'p1', DECK, 15);
  return { state, provider, scramble, asc };
}
function sideState(state: GameState) { return rules.definitionSideDeckState(state, 'p1', DECK)!; }
function choose(state: GameState, selectedIds: string[], playerId = 'p1') {
  const d = rules.projectAbilityState(state, playerId).pendingDecision!;
  expect(d).toBeTruthy();
  return rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: d.id, selectedIds });
}
function playBeast(state: GameState, provider: string, definitionId: string) {
  state.round.activePhase = 'advance'; state.round.prioritySeat = state.players[0]!.seat;
  const physical = state.cards.find((entry) => entry.definitionId === definitionId && entry.definitionSideDeckKey === DECK)!;
  expect(sideState(state).hand).toContain(physical.instanceId);
  expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: provider, abilityId: 'fixture.play-beast' }).ok).toBe(true);
  expect(choose(state, [physical.instanceId]).ok).toBe(true);
  const cost = Number(loaded.cards[definitionId]!.cardFace.cost ?? 0);
  if (cost > 0) {
    const payment = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(payment).toBeTruthy();
    expect(choose(state, payment.candidates.slice(0, cost)).ok).toBe(true);
  }
  expect(state.cards.find((entry) => entry.instanceId === physical.instanceId)?.zone).toBe('attack_area');
  return physical.instanceId;
}
function battle(state: GameState, winners: string[], losers: string[]) {
  const resultId = `result:${state.abilityRuntime!.revision}:${winners.join('-')}`;
  rules.processAbilityEvent(state, { id: resultId, type: 'after_battle_result_determined', battlePhaseResolutionId: `battle-phase:${state.round.roundNumber}`,
    battleId: `battle:${resultId}`, resultId, battlefieldId: 'miyama_town', battleResult: { winners, loserIds: losers },
    battleParticipantIds: [...new Set([...winners,...losers])] });
}

describe('P3 Chaos complete-owner readiness identity-free definition side-deck family', () => {
  it('accepts one exact structural family without owner identity routing and initializes 15 isolated unique side cards', () => {
    const { state } = setup(); const side = sideState(state);
    expect(side.definitionIds).toEqual(BEASTS); expect(side.drawPile).toHaveLength(15); expect(new Set(side.drawPile).size).toBe(15);
    expect(side.hand).toEqual([]); expect(side.discardPile).toEqual([]);
    expect(state.cards.filter((entry) => entry.definitionSideDeckKey === DECK)).toHaveLength(15);
    expect((state.players[0] as any).commandSpells).toBe(0);
    expect(rules.isDefinitionSideDeckRuntimeProvenanceValidForRestore(state)).toBe(true);
  });

  it('keeps side-deck, side-hand, and side-discard definitions private from opponents', () => {
    const { state } = setup();
    rules.drawDefinitionSideDeck(state, 'p1', DECK, 2);
    const side = sideState(state);
    const first = side.hand[0]!;
    expect(rules.returnDefinitionSideDeckCardToDiscard(state, first)).toBe(true);
    const ownerIds = new Set(rules.projectAbilityState(state, 'p1').cards.map((entry) => entry.instanceId));
    const opponentIds = new Set(rules.projectAbilityState(state, 'p2').cards.map((entry) => entry.instanceId));
    for (const id of [...side.drawPile, ...side.hand, ...side.discardPile]) {
      expect(ownerIds.has(id)).toBe(true);
      expect(opponentIds.has(id)).toBe(false);
    }
  });

  it('draws floor(actual mana gain / 2), while Beast-powered mana paths suppress recursive draws', () => {
    const { state, provider } = setup(); state.players[0]!.mana = 0;
    rules.grantMana(state, 'p1', 5, { source: 'generic' }); rules.settleDefinitionSideDeckManaEvents(state);
    expect(sideState(state).hand).toHaveLength(2);
    rules.drawDefinitionSideDeck(state, 'p1', DECK, 13); const source = playBeast(state, provider, B3); const before = sideState(state).hand.length;
    state.round.activePhase = 'action'; state.players[0]!.mana = 0;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId: 'fixture.b3' }).ok).toBe(true);
    const d = rules.projectAbilityState(state, 'p1').pendingDecision!; expect(choose(state, d.candidates.slice(0, 2)).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4); expect(sideState(state).hand).toHaveLength(before - 2);
  });

  it('pays Beast printed cost by discarding other side-hand cards and returns played Beast cards to the isolated discard', () => {
    const { state, provider } = setup({ drawAll: true }); const before = sideState(state).hand.length;
    const source = playBeast(state, provider, B7);
    expect(sideState(state).hand).toHaveLength(before - 3); expect(sideState(state).discardPile).toHaveLength(2);
    expect(rules.returnDefinitionSideDeckCardToDiscard(state, source)).toBe(true);
    expect(sideState(state).discardPile).toContain(source); expect(rules.isDefinitionSideDeckRuntimeProvenanceValidForRestore(state)).toBe(true);
  });

  it('schedules next-round draw-three/discard-two and fails closed on forged serialized side-deck state', () => {
    const { state, provider } = setup({ drawAll: true }); const source = playBeast(state, provider, B4);
    expect(sideState(state).delayedDrawDiscard).toMatchObject({ targetRound: 2, drawCount: 3, discardCount: 2, sourceCardId: source });
    rules.returnDefinitionSideDeckCardToDiscard(state, source); state.round.roundNumber = 2;
    rules.processAbilityEvent(state, { id: 'round:2', type: 'round_start' });
    const d = rules.projectAbilityState(state, 'p1').pendingDecision!; expect(d.candidates.length).toBeGreaterThanOrEqual(2);
    expect(choose(state, d.candidates.slice(0, 2)).ok).toBe(true); expect(sideState(state).delayedDrawDiscard).toBeUndefined();
    const forged = structuredClone(state); forged.abilityRuntime!.definitionSideDecks![`p1:${DECK}`]!.hand.push('forged-card');
    expect(rules.isDefinitionSideDeckRuntimeProvenanceValidForRestore(forged)).toBe(false);
  });

  it('covers opponent-count Power, entering-opponent -5, loss draw2, and trusted win VP swing', () => {
    const first = setup({ drawAll: true }); const b2 = playBeast(first.state, first.provider, B2);
    expect(rules.calculateCardPower(first.state, b2).value).toBe(1);

    const fifth = setup({ drawAll: true }); playBeast(fifth.state, fifth.provider, B5);
    rules.processAbilityEvent(fifth.state, { id: 'move:p2', type: 'after_controller_enters_location', playerId: 'p2', previousLocationId: 'shinto', locationId: 'miyama_town', movementKind: 'normal' });
    expect(fifth.state.abilityRuntime!.roundPlayerPowerAdjustments?.some((entry) => entry.playerId === 'p2' && entry.amount === -5)).toBe(true);

    const sixth = setup({ drawAll: true }); playBeast(sixth.state, sixth.provider, B6);
    const recycle = sideState(sixth.state).hand.slice(0, 2);
    for (const id of recycle) expect(rules.returnDefinitionSideDeckCardToDiscard(sixth.state, id)).toBe(true);
    const before = sideState(sixth.state).hand.length;
    battle(sixth.state, ['p2'], ['p1']); expect(sideState(sixth.state).hand.length).toBe(before + 2);

    const seventh = setup({ drawAll: true }); playBeast(seventh.state, seventh.provider, B7); battle(seventh.state, ['p1'], ['p2','p3']);
    expect(seventh.state.players.slice(0,3).map((entry) => entry.vp)).toEqual([2,3,3]);
  });

  it('defeats one engaged required-definition controller and forces same-battlefield Luck Power to zero', () => {
    const eighth = setup({ drawAll: true }); const b8 = playBeast(eighth.state, eighth.provider, B8); add(eighth.state, REMOTE, 'p2');
    eighth.state.round.activePhase = 'combat';
    expect(rules.dispatchAbilityCommand(eighth.state, 'p1', { type: 'activate_ability', cardInstanceId: b8, abilityId: 'fixture.b8' }).ok).toBe(true);
    expect(choose(eighth.state, ['p2']).ok).toBe(true); expect(eighth.state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(1);

    const ninth = setup({ drawAll: true }); playBeast(ninth.state, ninth.provider, B9); const luck = add(ninth.state, LUCK, 'p2', 'attack_area', true);
    expect(rules.calculateCardPower(ninth.state, luck).value).toBe(0);
    ninth.state.players[1]!.locationId = 'shinto'; expect(rules.calculateCardPower(ninth.state, luck).value).toBe(4);
  });

  it('reuses the accepted terrain-doubling seam and converts/closes one virtual command seal', () => {
    const tenth = setup({ drawAll: true }); const b10 = playBeast(tenth.state, tenth.provider, B10);
    expect(loaded.cards[B10]!.abilities[0]!.effects[0]!.type).toBe('double_controller_terrain_this_round');
    tenth.state.players[0]!.locationId = 'shinto';
    (tenth.state as any).modeState = { ...((tenth.state as any).modeState ?? {}), terrainAssignments: { shinto: ['p1'] } };
    tenth.state.round.activePhase = 'action'; const manaAfterBeastPlay = tenth.state.players[0]!.mana;
    expect(terrainAdvantageAtLocation(tenth.state, 'p1', 'shinto')).toBe(3);
    const terrainActivation = rules.dispatchAbilityCommand(tenth.state, 'p1', { type: 'activate_ability', cardInstanceId: b10, abilityId: 'fixture.b10' });
    expect(terrainActivation).toMatchObject({ ok: true });
    expect(tenth.state.players[0]!.mana).toBe(manaAfterBeastPlay);
    expect((tenth.state as any).modeState.terrainMultipliers).toContainEqual(expect.objectContaining({
      playerId: 'p1', multiplier: 2, duration: 'this_round', round: 1, sourceCardId: b10, abilityId: 'fixture.b10',
    }));

    const eleventh = setup({ drawAll: true }); const b11 = playBeast(eleventh.state, eleventh.provider, B11);
    expect((eleventh.state.players[0] as any).commandSpells).toBe(1); expect(sideState(eleventh.state).virtualCommandSealSourceCardId).toBe(b11);
    (eleventh.state.players[0] as any).commandSpells = 0; rules.markDefinitionSideDeckCommandSealSpentOrUsed(eleventh.state, 'p1');
    expect(eleventh.state.cards.find((entry) => entry.instanceId === b11)!.zone).toBe('definition_side_discard');
  });

  it('binds rush X to legal arrow movement + 1+X source Power and discards only a same-location event with VP X+2', () => {
    const twelfth = setup({ drawAll: true }); const b12 = playBeast(twelfth.state, twelfth.provider, B12); twelfth.state.round.activePhase = 'action';
    expect(rules.dispatchAbilityCommand(twelfth.state, 'p1', { type: 'activate_ability', cardInstanceId: b12, abilityId: 'fixture.b12' }).ok).toBe(true);
    const rush = rules.projectAbilityState(twelfth.state, 'p1').pendingDecision!; const move = rush.candidates.find((entry) => /^x:1:(?!stay)/.test(entry)) ?? rush.candidates.find((entry) => !entry.endsWith(':stay'))!;
    const x = Number(/^x:(\d+):/.exec(move)![1]); expect(choose(twelfth.state, [move]).ok).toBe(true); expect(rules.calculateCardPower(twelfth.state, b12).value).toBe(1 + x);

    const thirteenth = setup({ drawAll: true }); const b13 = playBeast(thirteenth.state, thirteenth.provider, B13); thirteenth.state.eventPlacements = [
      { locationId: 'miyama_town', eventCardId: 'event.a', victoryPoints: 4, visibility: { scope: 'public' } },
      { locationId: 'shinto', eventCardId: 'event.b', victoryPoints: 4, visibility: { scope: 'public' } },
    ]; thirteenth.state.round.activePhase = 'action';
    expect(rules.dispatchAbilityCommand(thirteenth.state, 'p1', { type: 'activate_ability', cardInstanceId: b13, abilityId: 'fixture.b13' }).ok).toBe(true);
    const eventChoice = rules.projectAbilityState(thirteenth.state, 'p1').pendingDecision!.candidates[0]!; expect(eventChoice).toContain(':x:2');
    expect(choose(thirteenth.state, [eventChoice]).ok).toBe(true); expect(thirteenth.state.eventPlacements.map((entry) => entry.eventCardId)).toEqual(['event.b']);
  });

  it('adds +2 to controller Noble-Phantasm attacks and applies -3 only to engaged opponents with no seal spend/use this round', () => {
    const fourteenth = setup({ drawAll: true }); playBeast(fourteenth.state, fourteenth.provider, B14); const np = add(fourteenth.state, NP, 'p1', 'attack_area', true);
    expect(rules.calculateCardPower(fourteenth.state, np).value).toBe(7);

    const fifteenth = setup({ drawAll: true }); playBeast(fifteenth.state, fifteenth.provider, B15);
    expect(playerCombatTotalPowerAdjustment(fifteenth.state, 'p2')).toBe(-3);
    rules.markDefinitionSideDeckCommandSealSpentOrUsed(fifteenth.state, 'p2'); expect(playerCombatTotalPowerAdjustment(fifteenth.state, 'p2')).toBe(0);
  });

  it('discards the whole Beast hand for 2X Power capped at 10', () => {
    const sixteenth = setup({ drawAll: true }); const b16 = playBeast(sixteenth.state, sixteenth.provider, B16);
    expect(sideState(sixteenth.state).hand).toHaveLength(0); expect(rules.calculateCardPower(sixteenth.state, b16).value).toBe(10);
  });

  it('resolves the once-per-game replacement choice and ascension pay-4 draw/unlimited Beast play without recursive mana draw', () => {
    const oneShot = setup(); oneShot.state.players[0]!.mana = 0; oneShot.state.round.activePhase = 'action';
    expect(rules.dispatchAbilityCommand(oneShot.state, 'p1', { type: 'activate_ability', cardInstanceId: oneShot.scramble, abilityId: 'fixture.one-shot' }).ok).toBe(true);
    expect(choose(oneShot.state, ['mana']).ok).toBe(true); expect(oneShot.state.players[0]!.mana).toBe(2); expect(sideState(oneShot.state).hand).toHaveLength(1); expect(sideState(oneShot.state).oneShotAvailable).toBe(false);

    const ascended = setup({ ascension: true, drawAll: true }); ascended.state.players[0]!.mana = 10; ascended.state.round.activePhase = 'action';
    const before = sideState(ascended.state).hand.length; expect(rules.dispatchAbilityCommand(ascended.state, 'p1', { type: 'activate_ability', cardInstanceId: ascended.asc, abilityId: 'fixture.pay-draw' }).ok).toBe(true);
    expect(ascended.state.players[0]!.mana).toBe(6); expect(sideState(ascended.state).hand.length).toBe(before + 1 > 15 ? 15 : before + 1);
    ascended.state.round.activePhase = 'advance';
    const first = sideState(ascended.state).hand.find((id) => ascended.state.cards.find((entry) => entry.instanceId === id)?.definitionId === B2)!;
    expect(rules.dispatchAbilityCommand(ascended.state, 'p1', { type: 'activate_ability', cardInstanceId: ascended.provider, abilityId: 'fixture.play-beast' }).ok).toBe(true); expect(choose(ascended.state, [first]).ok).toBe(true);
    const pay1 = rules.projectAbilityState(ascended.state, 'p1').pendingDecision; if (pay1) expect(choose(ascended.state, pay1.candidates.slice(0, pay1.min)).ok).toBe(true);
    const second = sideState(ascended.state).hand.find((id) => ascended.state.cards.find((entry) => entry.instanceId === id)?.definitionId === B3)!;
    expect(rules.dispatchAbilityCommand(ascended.state, 'p1', { type: 'activate_ability', cardInstanceId: ascended.provider, abilityId: 'fixture.play-beast' }).ok).toBe(true); expect(choose(ascended.state, [second]).ok).toBe(true);
  });

  it('keeps Scrambled Seal mutually exclusive while supporting win reward and adjacent move branches', () => {
    const victory = setup(); victory.state.round.activePhase = 'action';
    expect(rules.dispatchAbilityCommand(victory.state, 'p1', { type: 'activate_ability', cardInstanceId: victory.scramble, abilityId: 'fixture.one-shot' }).ok).toBe(true);
    expect(choose(victory.state, ['victory']).ok).toBe(true);
    expect(sideState(victory.state).oneShotAvailable).toBe(false);
    battle(victory.state, ['p1'], ['p2']); expect(victory.state.players[0]!.vp).toBe(2);
    battle(victory.state, ['p1'], ['p3']); expect(victory.state.players[0]!.vp).toBe(2);
    expect(rules.dispatchAbilityCommand(victory.state, 'p1', { type: 'activate_ability', cardInstanceId: victory.scramble, abilityId: 'fixture.one-shot' }).ok).toBe(false);

    const movement = setup(); movement.state.round.activePhase = 'action';
    expect(rules.dispatchAbilityCommand(movement.state, 'p1', { type: 'activate_ability', cardInstanceId: movement.scramble, abilityId: 'fixture.one-shot' }).ok).toBe(true);
    const move = rules.projectAbilityState(movement.state, 'p1').pendingDecision!.candidates.find((entry) => entry.startsWith('move:'))!;
    const destination = move.slice(5);
    expect(choose(movement.state, [move]).ok).toBe(true);
    expect(movement.state.players[0]!.locationId).toBe(destination);
    expect(sideState(movement.state).oneShotAvailable).toBe(false);
  });

  it('keeps privileged runtime authority owner-identity-free', () => {
    const text = [
      rules.containsDefinitionSideDeckPrivilegedNode.toString(),
      rules.resolveDefinitionSideDeckEffect.toString(),
      rules.isDefinitionSideDeckRuntimeProvenanceValidForRestore.toString(),
    ].join('\n').toLowerCase();
    for (const needle of ['master.chaos','尼禄','兽王之巢','core.chaos-']) expect(text).not.toContain(needle.toLowerCase());
  });
});
