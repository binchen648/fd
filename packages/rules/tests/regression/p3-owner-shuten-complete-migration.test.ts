import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import {
  advanceAbilityPhase,
  dispatchAbilityCommand,
  effectiveCardPlayCost,
  getLegalActions,
  initializeAbilityRuntime,
  playAbilityCardBatch,
  processAbilityEvent,
  projectAbilityState,
} from '../../src/ability/interpreter';
import type { AuthoringCard } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createMatchSession, restoreMatchSession } from '../../src/match-session';

const archivePath = 'data/authoring/servants/servant.shuten.json';
const skill = (n: number) => `servant.shuten.skill.sc-shuten-${n}`;

function rawArchive() { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup(options: { targetDeck?: number } = {}) {
  const raw = rawArchive();
  const pack = loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.players[0]!.servantCardId = 'servant.shuten';
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[0]!.mana = 20;
  state.players[1]!.mana = 20;
  const targetDeck = options.targetDeck ?? 0;
  for (let index = 0; index < targetDeck; index++) {
    const definitionId = `basic.shuten-target-${index}`;
    const def: AuthoringCard = { id: definitionId, name: definitionId, cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower: 2 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
    pack.cards[definitionId] = def;
    state.cards.push({ instanceId: `p2-deck-${index}`, definitionId, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'deck', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } });
  }
  initializeAbilityRuntime(state, pack, { seed: 20260926 });
  return { raw, pack, state };
}
function addCard(state: GameState, definitionId: string, ownerPlayerId = 'p1', zone = 'skill', controllerPlayerId = ownerPlayerId, faceDown = false) {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId, zone, visibility: ['field','attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId } });
  state.abilityRuntime!.cardState[instanceId] = { active: ['field','attack_area'].includes(zone) && !faceDown, faceDown, playedRound: state.round.roundNumber };
  return state.cards[state.cards.length - 1]!;
}
function addBasic(state: GameState, id: string, owner = 'p1', zone = 'hand', cost = 0) {
  const def: AuthoringCard = { id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost, basePower: 3 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
  state.abilityRuntime!.pack.cards[id] = def;
  return addCard(state, id, owner, zone, owner, false);
}
function addSupport(state: GameState, id: string, owner = 'p2', zone = 'hand', cost = 1) {
  const def: AuthoringCard = { id, name: id, cardType: 'master_skill', cardFace: { attributes: [], cost, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' };
  state.abilityRuntime!.pack.cards[id] = def;
  return addCard(state, id, owner, zone, owner, false);
}

describe('P3 owner-complete Shuten migration', () => {
  it('loads exactly all three frozen Shuten skills with no unsupported mechanics', () => {
    const { pack } = setup();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    expect([1,2,3].map((n) => pack.cards[skill(n)]?.name)).toEqual(['放荡之宴','神便鬼毒酒','百花缭乱·我爱你']);
  });

  it('fails closed when a battlefield-source mechanic is widened', () => {
    const raw = rawArchive();
    raw.cards[0].abilities[0].effects[0].extra = 'near-match';
    const pack = loadAuthoringJson(raw);
    expect(pack.report.some((entry) => entry.cardId === skill(1) && entry.abilityId === 'sc-shuten-1.place-banquet' && entry.status === 'unsupported')).toBe(true);
  });

  it('places Banquet at one battlefield, taxes only other players there, rewards occupants, then returns at round end', () => {
    const { state } = setup();
    const banquet = addCard(state, skill(1));
    const ownAttack = addBasic(state, 'basic.shuten-own', 'p1', 'hand', 1);
    const otherAttack = addBasic(state, 'basic.shuten-other', 'p2', 'hand', 1);
    const awayAttack = addBasic(state, 'basic.shuten-away', 'p3', 'hand', 1);
    const otherSupport = addSupport(state, 'support.shuten-other', 'p2', 'hand', 1);
    state.players[2]!.locationId = 'miyama_town';
    state.round.activePhase = 'preparation'; state.round.prioritySeat = 1;
    const beforeMana = state.players[0]!.mana;
    const start = dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: banquet.instanceId, abilityId: 'sc-shuten-1.place-banquet' });
    expect(start.ok).toBe(true);
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(decision.candidates).toEqual(expect.arrayContaining(['shinto','miyama_town']));
    expect(decision.candidates).not.toContain('magic_workshop');
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['shinto'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(beforeMana - 2);
    expect(state.cards.find((card) => card.instanceId === banquet.instanceId)).toMatchObject({ zone: 'field', visibility: { scope: 'public' } });
    expect(state.abilityRuntime!.cardState[banquet.instanceId]).toMatchObject({ active: true, placedAtLocationId: 'shinto' });
    expect(effectiveCardPlayCost(state, 'p1', ownAttack.instanceId)).toBe(1);
    expect(effectiveCardPlayCost(state, 'p2', otherAttack.instanceId)).toBe(3);
    expect(effectiveCardPlayCost(state, 'p2', otherSupport.instanceId)).toBe(3);
    expect(effectiveCardPlayCost(state, 'p3', awayAttack.instanceId)).toBe(1);
    const p1Vp = state.players[0]!.vp; const p2Vp = state.players[1]!.vp; const p3Vp = state.players[2]!.vp;
    processAbilityEvent(state, { id: 'trusted:battle-terminal:shuten', type: 'after_battle_ended', battlePhaseResolutionId: 'phase:1', battleParticipantIds: ['p1','p2'], battleOutcomes: [{ battlefieldId: 'shinto', winnerPlayerIds: ['p1'] }] });
    expect(state.players[0]!.vp).toBe(p1Vp + 1);
    expect(state.players[1]!.vp).toBe(p2Vp + 1);
    expect(state.players[2]!.vp).toBe(p3Vp);
    processAbilityEvent(state, { id: 'trusted:round-end:shuten', type: 'round_end', playerId: 'p1' });
    expect(state.cards.find((card) => card.instanceId === banquet.instanceId)!.zone).toBe('skill');
    expect(state.abilityRuntime!.cardState[banquet.instanceId]!.active).toBe(false);
    expect(state.abilityRuntime!.cardState[banquet.instanceId]!.placedAtLocationId).toBeUndefined();
  });

  it('plays Noxious Sake only as an additional low-mana attack and grants one-play-per-game to every active basic attack in the fight', () => {
    const { state } = setup();
    const sake = addCard(state, skill(2), 'p1', 'skill');
    const ownBasic = addBasic(state, 'basic.shuten-fight-own', 'p1', 'hand');
    const opposingBasic = addBasic(state, 'basic.shuten-fight-opponent', 'p2', 'attack_area');
    state.abilityRuntime!.cardState[opposingBasic.instanceId]!.active = true;
    state.round.activePhase = 'action'; state.round.prioritySeat = 1; state.players[0]!.mana = 4;
    expect(() => playAbilityCardBatch(state, 'p1', [{ cardInstanceId: sake.instanceId }])).toThrow();
    playAbilityCardBatch(state, 'p1', [{ cardInstanceId: ownBasic.instanceId }, { cardInstanceId: sake.instanceId }]);
    expect(state.players[0]!.mana).toBe(2);
    expect(state.cards.find((card) => card.instanceId === sake.instanceId)!.zone).toBe('attack_area');
    advanceAbilityPhase(state, 'battle');
    expect(state.abilityRuntime!.grantedPerGamePlayLimitCardIds).toEqual(expect.arrayContaining([ownBasic.instanceId, opposingBasic.instanceId]));
    ownBasic.zone = 'hand'; ownBasic.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' }; state.abilityRuntime!.cardState[ownBasic.instanceId]!.active = false;
    expect(getLegalActions(state, 'p1').some((action) => action.type === 'play_card' && action.cardInstanceId === ownBasic.instanceId)).toBe(false);
  });

  it('uses immutable starting deck size for Bone Collector and defeats only when the target deck is empty afterwards', () => {
    const { state } = setup({ targetDeck: 9 });
    const noble = addCard(state, skill(3));
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: noble.instanceId }).ok).toBe(true);
    expect(projectAbilityState(state, 'p2').players.find((player) => player.id === 'p1')?.servantPackage?.id).toBe('servant.shuten');
    advanceAbilityPhase(state, 'battle');
    const start = dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: noble.instanceId, abilityId: 'sc-shuten-3.bone-collector' });
    expect(start.ok).toBe(true);
    const d = state.abilityRuntime!.pendingDecision!;
    expect(d.candidates).toContain('p2');
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p2' && card.zone === 'removed_from_game')).toHaveLength(3);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p2' && card.zone === 'deck')).toHaveLength(6);
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBeUndefined();
  });

  it('round-trips the trusted battlefield binding and new per-game bookkeeping through MatchSession restore', () => {
    const session = createMatchSession({ seed: 1, humanPlayerId: 'p3', humanPlayerIds: ['p3'] });
    const shuten = session.pairings.find((pairing) => pairing.servant.id === 'servant.shuten')!;
    expect(shuten).toBeTruthy();
    session.state.round.activePhase = 'preparation';
    session.state.round.prioritySeat = shuten.seat;
    const source = session.state.cards.find((card) => card.ownerPlayerId === shuten.playerId && card.definitionId === skill(1))!;
    session.state.players.find((player) => player.id === shuten.playerId)!.mana = 12;
    expect(session.dispatchPlayerAction(shuten.playerId, { type: 'activate_ability', cardInstanceId: source.instanceId, abilityId: 'sc-shuten-1.place-banquet' }).ok).toBe(true);
    const decision = session.state.abilityRuntime!.pendingDecision!;
    expect(session.dispatchPlayerAction(shuten.playerId, { type: 'choose_target', decisionId: decision.id, selectedIds: ['shinto'] }).ok).toBe(true);
    session.state.abilityRuntime!.cardPlayCountByInstance![source.instanceId] = 1;
    session.state.abilityRuntime!.grantedPerGamePlayLimitCardIds!.push(source.instanceId);
    expect(session.state.abilityRuntime!.startingDeckSizeByPlayer?.[shuten.playerId]).toBe(12);
    const durable = session.serializeSession();
    const restored = restoreMatchSession(durable);
    expect(restored.state.abilityRuntime!.cardState[source.instanceId]?.placedAtLocationId).toBe('shinto');
    expect(restored.state.abilityRuntime!.startingDeckSizeByPlayer?.[shuten.playerId]).toBe(12);
    expect(restored.state.abilityRuntime!.cardPlayCountByInstance?.[source.instanceId]).toBe(1);
    expect(restored.state.abilityRuntime!.grantedPerGamePlayLimitCardIds).toContain(source.instanceId);
    const corrupted: any = structuredClone(durable);
    corrupted.state.abilityRuntime.cardState[source.instanceId].placedAtLocationId = 'forged-location';
    expect(() => restoreMatchSession(corrupted)).toThrow('Invalid MatchSession state container');
  });

  it('Bone Collector defeats when the post-removal deck is empty while still using the original starting cardinality', () => {
    const { state } = setup({ targetDeck: 4 });
    const noble = addCard(state, skill(3));
    const p2Deck = state.cards.filter((card) => card.ownerPlayerId === 'p2' && card.zone === 'deck');
    for (const card of p2Deck.slice(1)) { card.zone = 'discard'; card.visibility = { scope: 'owner_only', ownerPlayerId: 'p2' }; }
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId: noble.instanceId }).ok).toBe(true);
    advanceAbilityPhase(state, 'battle');
    expect(dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: noble.instanceId, abilityId: 'sc-shuten-3.bone-collector' }).ok).toBe(true);
    const d = state.abilityRuntime!.pendingDecision!;
    expect(dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.cards.filter((card) => card.ownerPlayerId === 'p2' && card.zone === 'deck')).toHaveLength(0);
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.events.some((event) => event.type === 'player_defeated_by_effect' && event.playerId === 'p2')).toBe(true);
  });
});
