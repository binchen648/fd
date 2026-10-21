import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { GameState } from '../src/schema/game';

const raw = JSON.parse(readFileSync('data/authoring/servants/servant.abigail.json', 'utf8'));
const S1 = 'servant.abigail.skill.sc-abigail-1';
const S1_ACTION = `${S1}.distribute-outside-life`;
const S1_WIN = `${S1}.win-at-x12`;
const S4 = 'servant.abigail.skill.sc-abigail-4';

function setup(activeSeats = [1, 2, 3]): GameState {
  const state = createSeededGameState({ activeSeats });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.servantCardId = 'servant.abigail';
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  const pack = rules.loadAuthoringJson(raw);
  expect(pack.report).toEqual([]);
  rules.initializeAbilityRuntime(state, pack, { seed: 20261022 });
  state.cards.push({ instanceId: 'abigail-s1', definitionId: S1, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } });
  return state;
}

function play(state: GameState, cardInstanceId: string) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'play_card', cardInstanceId });
}

describe('Abigail S1 source-bound X ledger', () => {
  it('deals one canonical Outside-Life to each same-location active opponent atomically', () => {
    const state = setup();
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === 'abigail-s1' && entry.abilityId === S1_ACTION);
    expect(action).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', action as any).ok).toBe(true);
    const created = state.cards.filter((card) => card.definitionId === S4);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', generatedBy: S1, visibility: { scope: 'owner_only', ownerPlayerId: 'p2' } });
    expect(state.ruleOverrides?.abigailSanityLossByPlayer?.p1?.distributed).toEqual([{ cardInstanceId: created[0]!.instanceId, recipientPlayerId: 'p2' }]);
  });

  it('is once-per-round, excludes eliminated/different-location players, and replay is idempotent', () => {
    const state = setup();
    state.players[2]!.status = 'eliminated';
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === S1_ACTION)!;
    expect(rules.dispatchAbilityCommand(state, 'p1', action as any).ok).toBe(true);
    const snapshot = JSON.stringify(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', action as any).ok).toBe(false);
    expect(state.cards.filter((card) => card.definitionId === S4)).toHaveLength(1);
    expect(JSON.stringify(state)).toBe(snapshot);
    rules.processAbilityEvent(state, { id: 'duplicate-play', type: 'on_card_played', playerId: 'p1', sourceCardId: 'abigail-s1' });
    rules.processAbilityEvent(state, { id: 'duplicate-play', type: 'on_card_played', playerId: 'p1', sourceCardId: 'abigail-s1' });
    expect(state.ruleOverrides?.abigailSanityLossByPlayer?.p1?.distributed).toHaveLength(1);
  });

  it('wins only at exact X=12 and records only a canonical ledger', () => {
    const state = setup([1, 2]);
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const ledger = state.ruleOverrides ??= {};
    ledger.abigailSanityLossByPlayer = { p1: { sourceCardId: 'abigail-s1', abilityId: S1_ACTION, controllerId: 'p1', distributed: [] } };
    for (let index = 0; index < 12; index++) {
      const id = `seeded-outside-life-${index}`;
      state.cards.push({ instanceId: id, definitionId: S4, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' }, generatedBy: S1 });
      ledger.abigailSanityLossByPlayer.p1!.distributed.push({ cardInstanceId: id, recipientPlayerId: 'p2' });
    }
    rules.processAbilityEvent(state, { id: 's1-win', type: 'on_card_played', playerId: 'p1', sourceCardId: 'abigail-s1' });
    expect(state.winnerPlayerIds).toEqual(['p1']);
    expect(state.ruleOverrides?.abigailSanityLossVictoryByPlayer?.p1).toMatchObject({ x: 12, sourceCardId: 'abigail-s1' });
  });

  it('does not award victory when X exceeds the exact twelve-card threshold', () => {
    const state = setup([1, 2]);
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const ledger = state.ruleOverrides ??= {};
    ledger.abigailSanityLossByPlayer = { p1: { sourceCardId: 'abigail-s1', abilityId: S1_ACTION, controllerId: 'p1', distributed: [] } };
    for (let index = 0; index < 13; index++) {
      const id = `over-threshold-outside-life-${index}`;
      state.cards.push({ instanceId: id, definitionId: S4, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' }, generatedBy: S1 });
      ledger.abigailSanityLossByPlayer.p1!.distributed.push({ cardInstanceId: id, recipientPlayerId: 'p2' });
    }
    rules.processAbilityEvent(state, { id: 's1-over-threshold', type: 'on_card_played', playerId: 'p1', sourceCardId: 'abigail-s1' });
    expect(state.winnerPlayerIds).toBeUndefined();
    expect(state.ruleOverrides?.abigailSanityLossVictoryByPlayer).toBeUndefined();
  });

  it('rejects forged ledger entries without mutating the authoritative state', () => {
    const state = setup([1, 2]);
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const ledger = state.ruleOverrides ??= {};
    ledger.abigailSanityLossByPlayer = { p1: { sourceCardId: 'abigail-s1', abilityId: S1_ACTION, controllerId: 'p1', distributed: Array.from({ length: 12 }, (_, index) => ({ cardInstanceId: `forged-${index}`, recipientPlayerId: 'p2' })) } };
    const before = JSON.stringify(state);
    expect(() => rules.processAbilityEvent(state, { id: 's1-forged-ledger', type: 'on_card_played', playerId: 'p1', sourceCardId: 'abigail-s1' })).toThrow(/canonical ledger/);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('loads the source-bound S1 contract in a live MatchSession executable pack', () => {
    const session = rules.createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    const runtimePack = session.getState().abilityRuntime?.pack;
    expect(runtimePack?.cards[S1]?.abilities.map((ability) => ability.id)).toEqual([S1_ACTION, S1_WIN]);
    expect(runtimePack?.cards[S1]?.abilities.every((ability) => ability.execution.mode === 'automatic')).toBe(true);
  });
});
