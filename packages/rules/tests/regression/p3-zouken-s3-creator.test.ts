import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';
import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';

const ARCHIVE = 'data/authoring/masters/master.zouken.json';
const CARD_ID = 'master.zouken.skill.s3';
const CARD_INSTANCE = 'p1-master.zouken.skill.s3';
const PASSIVE_ID = 'zouken.founder';
const ACTION_ID = 'zouken.founder.power-conversion';
const WIN_ID = 'zouken.founder.after-win';

function setup(): { state: GameState; pack: ReturnType<typeof rules.loadAuthoringJson> } {
  const pack = rules.loadAuthoringJson(JSON.parse(readFileSync(ARCHIVE, 'utf8')));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: CARD_INSTANCE, definitionId: CARD_ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } }];
  state.players[0]!.masterCardId = 'master.zouken';
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town';
  state.players[0]!.mana = 10;
  (state.players[0] as unknown as { commandSpells: number }).commandSpells = 3;
  state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(state, pack, { seed: 20261023 });
  state.abilityRuntime!.cardState[CARD_INSTANCE] = { active: true, faceDown: false, playedRound: 1 };
  return { state, pack };
}

describe('P3 Zouken s3 creator source-specific contract', () => {
  it('is compiled into the generated pack and live seven-player sessions', () => {
    expect(contentLibrary.rules.cards[CARD_ID]!.abilities.map((a) => a.id)).toEqual([PASSIVE_ID, ACTION_ID, WIN_ID]);
    const session = rules.createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    expect(session.state.abilityRuntime!.pack.cards[CARD_ID]).toEqual(contentLibrary.rules.cards[CARD_ID]);
    const pairing = session.pairings.find((entry) => entry.master.id === 'master.zouken');
    expect(pairing).toBeDefined();
    expect(session.state.cards).toContainEqual(expect.objectContaining({ definitionId: CARD_ID, ownerPlayerId: pairing!.playerId, zone: 'skill' }));
  });

  it('accepts exact source shapes and rejects widened costs', () => {
    const { pack } = setup();
    const abilities = pack.cards[CARD_ID]!.abilities;
    expect(rules.isZoukenS3PassiveSemantic(abilities[0]!)).toBe(true);
    expect(rules.isZoukenS3ActionSemantic(abilities[1]!)).toBe(true);
    expect(rules.isZoukenS3WinSemantic(abilities[2]!)).toBe(true);
    const widened = structuredClone(abilities[1]!); widened.cost[0]!.amount = 2;
    expect(rules.isZoukenS3ActionSemantic(widened)).toBe(false);
  });

  it('pays exactly 2X, records X current-round power, and rejects invalid X atomically', () => {
    const { state } = setup();
    expect(rules.projectAbilityState(state, 'p1').players[0]!.commandSpells).toBe(0);
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === ACTION_ID);
    expect(action).toMatchObject({ variableCosts: [{ name: 'X', min: 1, max: 5 }] });
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: CARD_INSTANCE, abilityId: ACTION_ID, variables: { X: 3 } }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.ruleOverrides?.zoukenFounderPowerByPlayer?.p1).toMatchObject({ round: 1, amount: 3, paidMana: 6,
      manaBefore: 10, manaAfter: 4, sourceCardId: CARD_INSTANCE, abilityId: ACTION_ID, controllerId: 'p1' });
    const snapshot = JSON.stringify(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: CARD_INSTANCE, abilityId: ACTION_ID, variables: { X: 6 } }).ok).toBe(false);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('converts a same-round authoritative win to X VP once and survives JSON restore', () => {
    const { state } = setup();
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: CARD_INSTANCE, abilityId: ACTION_ID, variables: { X: 2 } }).ok).toBe(true);
    const restored = JSON.parse(JSON.stringify(state)) as GameState;
    rules.processAbilityEvent(restored, { id: 's3-win', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect(restored.players[0]!.vp).toBe(2);
    rules.processAbilityEvent(restored, { id: 's3-win-replay', type: 'after_controller_wins_battle', playerId: 'p1' });
    expect(restored.players[0]!.vp).toBe(2);
    expect(restored.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'zouken_s3_victory_points_settled', delta: 2 }));
  });

  it('replaces a controller command-seal spend with four mana without mutating seals', () => {
    const { state, pack } = setup();
    const fixtureId = 'fixture.zouken-command-spend';
    pack.cards[fixtureId] = {
      id: fixtureId, name: 'fixture', cardType: 'master_skill', owner: { type: 'master', id: 'master.zouken' },
      printedText: '', cardFace: { typeLabel: '行动阶段', attributes: [], cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{ id: 'spend', kind: 'phase_action', printedClause: '', activation: { phase: 'action', opens: 'controller_action_window' },
        conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        effects: [{ type: 'adjust_command_seals', player: 'controller', amount: -1 }], execution: { mode: 'automatic', allowedOperations: [] } }],
    } as never;
    state.abilityRuntime!.pack.cards[fixtureId] = pack.cards[fixtureId]!;
    const fixtureInstance = 'p1-fixture-command-spend';
    state.cards.push({ instanceId: fixtureInstance, definitionId: fixtureId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState[fixtureInstance] = { active: true, faceDown: false, playedRound: 1 };
    state.players[0]!.mana = 5;
    (state.players[0] as unknown as { commandSpells: number }).commandSpells = 0;
    const result = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: fixtureInstance, abilityId: 'spend' });
    expect(result.ok).toBe(true);
    expect(state.players[0]!.mana).toBe(1);
    expect((state.players[0] as unknown as { commandSpells: number }).commandSpells).toBe(0);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'zouken_s3_command_seal_replaced', delta: -4 }));
  });

  it('keeps the standard mixed command-spell gain path source-bound and seal-stable', () => {
    const { state } = setup();
    const commandInstance = 'p1-gatou-command-spell';
    const definitionId = 'master.zouken.command-spell';
    const commandDefinition = contentLibrary.rules.cards[definitionId]!;
    expect(commandDefinition).toBeDefined();
    state.abilityRuntime!.pack.cards[definitionId] = commandDefinition as never;
    state.cards.push({ instanceId: commandInstance, definitionId, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
    state.abilityRuntime!.cardState[commandInstance] = { active: true, faceDown: false, playedRound: 1 };
    state.players[0]!.mana = 5;
    (state.players[0] as unknown as { commandSpells: number }).commandSpells = 3;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: commandInstance, abilityId: 'command-spell.gain-mana' }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(5);
    expect((state.players[0] as unknown as { commandSpells: number }).commandSpells).toBe(3);
    expect(rules.projectAbilityState(state, 'p1').players[0]!.commandSpells).toBe(0);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'zouken_s3_command_seal_replaced', requestedDelta: -4 }));
  });

  it('rejects forged founder power envelopes during MatchSession restore', () => {
    const session = rules.createMatchSession({ seed: 20261023, humanPlayerId: 'p1' });
    const pairing = session.pairings.find((entry) => entry.master.id === 'master.zouken');
    expect(pairing).toBeDefined();
    const ownerId = pairing!.playerId;
    const source = session.state.cards.find((candidate) => candidate.definitionId === CARD_ID && candidate.ownerPlayerId === ownerId);
    expect(source).toBeDefined();
    source!.zone = 'field';
    session.state.abilityRuntime!.cardState[source!.instanceId] = { active: true, faceDown: false, playedRound: 1 };
    const owner = session.state.players.find((candidate) => candidate.id === ownerId)!;
    session.state.round.activePhase = 'action'; session.state.round.prioritySeat = owner.seat; owner.mana = 10;
    expect(rules.dispatchAbilityCommand(session.state, ownerId, { type: 'activate_ability', cardInstanceId: source!.instanceId, abilityId: ACTION_ID, variables: { X: 2 } }).ok).toBe(true);
    const snapshot = session.serializeSession();
    expect(() => rules.restoreMatchSession(snapshot)).not.toThrow();
    const forged = structuredClone(snapshot);
    forged.state.ruleOverrides!.zoukenFounderPowerByPlayer![ownerId]!.amount = 99;
    expect(() => rules.restoreMatchSession(forged)).toThrow();
  });
});
