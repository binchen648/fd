import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';
import { movePlayer } from '../../src/core/movement';
import contentLibrary from '../../../../data/generated/fd-playtest-v1.content-library.json';

const ARCHIVE = 'data/authoring/masters/master.zouken.json';
const CARD_ID = 'master.zouken.skill.ascension';
const CARD_INSTANCE = 'p1-master.zouken.skill.ascension';
const PASSIVE_ID = 'zouken.illusive-mastermind';
const ACTION_ID = 'zouken.illusive-mastermind.seal-loss';

function setup(): { state: GameState; pack: ReturnType<typeof rules.loadAuthoringJson> } {
  const pack = rules.loadAuthoringJson(JSON.parse(readFileSync(ARCHIVE, 'utf8')));
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [{ instanceId: CARD_INSTANCE, definitionId: CARD_ID, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } }];
  state.players[0]!.masterCardId = 'master.zouken';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[0]!.mana = 10;
  (state.players[1] as unknown as { commandSpells: number }).commandSpells = 2;
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(state, pack, { seed: 20261022 });
  state.abilityRuntime!.cardState[CARD_INSTANCE] = { active: true, faceDown: false, playedRound: 1 };
  return { state, pack };
}

describe('P3 Zouken ascension source-specific contract', () => {
  it('is present in the generated pack and live seven-player MatchSession', () => {
    expect(contentLibrary.rules.cards[CARD_ID]!.abilities.map((a) => a.id)).toEqual([PASSIVE_ID, ACTION_ID]);
    const session = rules.createMatchSession({ seed: 20260904, humanPlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] });
    expect(session.state.abilityRuntime!.pack.cards[CARD_ID]).toEqual(contentLibrary.rules.cards[CARD_ID]);
    const pairing = session.pairings.find((entry) => entry.master.id === 'master.zouken');
    expect(pairing).toBeDefined();
    expect(session.state.cards).toContainEqual(expect.objectContaining({ definitionId: CARD_ID, ownerPlayerId: pairing!.playerId, zone: 'skill' }));
  });

  it('accepts exact passive/action semantics and rejects widened source shapes', () => {
    const raw = JSON.parse(readFileSync(ARCHIVE, 'utf8')) as { cards: Array<{ id: string; cardFace: { typeLabel: string }; phase3Evidence?: { clauseSources?: Array<{ locator: string }> } }> };
    const source = raw.cards.find((card) => card.id === CARD_ID)!;
    expect(source.cardFace.typeLabel).toBe('升华技');
    expect(source.phase3Evidence?.clauseSources?.map((entry) => entry.locator)).toEqual([
      'legacy-content.json#masters[14].skills[5].text#line=1',
      'legacy-content.json#masters[14].skills[5].text#line=2',
    ]);
    const { pack } = setup();
    const abilities = pack.cards[CARD_ID]!.abilities;
    expect(rules.isZoukenAscensionPassiveSemantic(abilities[0]!)).toBe(true);
    expect(rules.isZoukenAscensionActionSemantic(abilities[1]!)).toBe(true);
    const widened = structuredClone(abilities[1]!);
    widened.cost[0]!.amount = 5;
    expect(rules.isZoukenAscensionActionSemantic(widened)).toBe(false);
  });

  it('bypasses engagement only while the exact passive card is active', () => {
    const { state } = setup();
    const moved = movePlayer(state, { playerId: 'p1', to: 'shinto', movementKind: 'normal' });
    expect(moved.moved).toBe(true);
    const inactive = structuredClone(state);
    inactive.abilityRuntime!.cardState[CARD_INSTANCE]!.active = false;
    inactive.players[0]!.locationId = 'miyama_town';
    const blocked = movePlayer(inactive, { playerId: 'p1', to: 'shinto', movementKind: 'normal' });
    expect(blocked.moved).toBe(false);
    expect(blocked.reason).toBe('engaged');
  });

  it('pays six mana and removes one seal from a same-battlefield opponent atomically', () => {
    const { state } = setup();
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === CARD_INSTANCE && entry.abilityId === ACTION_ID);
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action! as never).ok).toBe(true);
    const pending = state.abilityRuntime!.pendingDecision!;
    expect(pending.candidates).toEqual(['p2']);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: ['p2'] }).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(4);
    expect((state.players[1] as unknown as { commandSpells: number }).commandSpells).toBe(1);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'zouken_ascension_command_seal_removed', targetPlayerId: 'p2', delta: -1 }));
  });

  it('removes the pseudo-vampire win gate without allowing self-transfer', () => {
    const { state, pack } = setup();
    const s4 = 'p1-master.zouken.skill.s4';
    state.cards.push({ instanceId: s4, definitionId: 'master.zouken.skill.s4', ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'field', visibility: { scope: 'public' } });
    Object.assign(state.players[2]!, { status: 'active', locationId: 'miyama_town', mana: 5 });
    state.abilityRuntime!.cardState[s4] = { active: true, faceDown: false, playedRound: 1 };
    state.players[0]!.mana = 4;
    state.battleResults = [{ battlefieldId: 'miyama_town', winnerPlayerIds: ['p2'], tied: false, winnerPlayerId: 'p2', margin: 1, vpReward: 1,
      militaryAdjustments: [{ playerId: 'p1', delta: -1 }, { playerId: 'p3', delta: -1 }],
      participantBreakdowns: [
        { playerId: 'p1', basePower: 1, totalModifier: 0, effectivePower: 1, modifiers: [] },
        { playerId: 'p2', basePower: 2, totalModifier: 0, effectivePower: 2, modifiers: [] },
        { playerId: 'p3', basePower: 1, totalModifier: 0, effectivePower: 1, modifiers: [] },
      ] }];
    rules.processAbilityEvent(state, {
      id: 'ascension-win-gate-test', type: 'after_battle_ended', battlePhaseResolutionId: 'battle-phase:1',
      battleIds: ['battle-phase:1:battle:miyama_town:1'], resultIds: ['battle-phase:1:battle:miyama_town:1:result'],
      battleParticipantIds: ['p1', 'p2', 'p3'], battleOutcomes: [{ battlefieldId: 'miyama_town', winnerPlayerIds: ['p2'] }],
    });
    expect(state.players[0]!.mana).toBe(7);
    expect(state.players[2]!.mana).toBe(2);
    expect(state.players[1]!.mana).toBe(4);
    expect(pack.cards[CARD_ID]!.abilities).toHaveLength(2);
  });

  it('does not expose the action without an eligible target and survives JSON restore', () => {
    const { state } = setup();
    (state.players[1] as unknown as { commandSpells: number }).commandSpells = 0;
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === ACTION_ID)).toBe(false);
    const restored = JSON.parse(JSON.stringify(setup().state)) as GameState;
    expect(rules.getLegalActions(restored, 'p1').some((entry) => entry.type === 'activate_ability' && entry.abilityId === ACTION_ID)).toBe(true);
  });
});
