import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import * as rules from '../src/index';
import { restoreMatchSession } from '../src/match-session';
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

function twelveRecordSessionSnapshot() {
  const session = rules.createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
  const state = (session as unknown as { state: GameState }).state;
  const sourceCardId = 'restore-victory-s1';
  state.players[0]!.servantCardId = 'servant.abigail';
  state.round.activePhase = 'action';
  state.cards.push({ instanceId: sourceCardId, definitionId: S1, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[sourceCardId] = { active: true, faceDown: false, playedRound: 1 };
  const distributedCardInstanceIds = Array.from({ length: 12 }, (_, index) => `restore-victory-outside-${index}`);
  for (const cardInstanceId of distributedCardInstanceIds) {
    state.cards.push({ instanceId: cardInstanceId, definitionId: S4, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' }, generatedBy: S1 });
  }
  state.ruleOverrides = {
    abigailSanityLossByPlayer: {
      p1: { sourceCardId, abilityId: S1_ACTION, controllerId: 'p1', distributed: distributedCardInstanceIds.map((cardInstanceId) => ({ cardInstanceId, recipientPlayerId: 'p2' })) },
    },
    abigailSanityLossVictoryByPlayer: {
      p1: { sourceCardId, abilityId: S1_WIN, controllerId: 'p1', x: 12, distributedCardInstanceIds: [...distributedCardInstanceIds] },
    },
  };
  for (const cardInstanceId of distributedCardInstanceIds) state.abilityRuntime!.events.push({ type: 'abigail_s1_outside_life_distributed', playerId: 'p1', sourceCardId,
    abilityId: S1_ACTION, targetPlayerIds: ['p2'], cardInstanceIds: [cardInstanceId], movedCount: 1 });
  state.winnerPlayerIds = ['p1'];
  return { session, snapshot: session.serializeSession(), distributedCardInstanceIds };
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

  it('retains the immutable S1 ledger across canonical S4 use and Abigail cleanup', () => {
    const state = setup();
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const firstAction = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === S1_ACTION)!;
    expect(rules.dispatchAbilityCommand(state, 'p1', firstAction as any).ok).toBe(true);
    const outsideLife = state.cards.find((card) => card.definitionId === S4)!;

    state.round.prioritySeat = 2;
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'play_card', cardInstanceId: outsideLife.instanceId }).ok).toBe(true);
    state.round.activePhase = 'battle';
    rules.processAbilityEvent(state, { id: 's1-s4-battle-end', type: 'after_battle_ended', playerId: 'p2', sourceCardId: outsideLife.instanceId, battlePhaseResolutionId: 's1-s4-battle' });
    expect(state.cards.find((card) => card.instanceId === outsideLife.instanceId)).toMatchObject({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'discard', generatedBy: S1 });

    rules.advanceAbilityPhase(state, 'action', 2);
    state.round.prioritySeat = 1;
    const secondAction = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === S1_ACTION);
    expect(secondAction).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', secondAction as any).ok).toBe(true);
    expect(state.ruleOverrides?.abigailSanityLossByPlayer?.p1?.distributed).toHaveLength(2);
  });

  it('rejects a forged recipient-to-Abigail ledger transition without the S4 recycle receipt', () => {
    const state = setup();
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const firstAction = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === S1_ACTION)!;
    expect(rules.dispatchAbilityCommand(state, 'p1', firstAction as any).ok).toBe(true);
    const outsideLife = state.cards.find((card) => card.definitionId === S4)!;
    outsideLife.ownerPlayerId = 'p1';
    outsideLife.controllerPlayerId = 'p1';
    outsideLife.zone = 'discard';
    outsideLife.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    state.abilityRuntime!.cardState[outsideLife.instanceId] = { active: false, faceDown: false, playedRound: 1 };
    rules.advanceAbilityPhase(state, 'action', 2);
    state.round.prioritySeat = 1;
    const secondAction = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === S1_ACTION)!;
    const before = JSON.stringify(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', secondAction as any).ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('rejects cross-record, repeated, and wrong-recipient distribution provenance', () => {
    const state = setup();
    expect(play(state, 'abigail-s1').ok).toBe(true);
    const firstAction = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === S1_ACTION)!;
    expect(rules.dispatchAbilityCommand(state, 'p1', firstAction as any).ok).toBe(true);
    const card = state.cards.find((candidate) => candidate.definitionId === S4)!;
    const distribution = state.abilityRuntime!.events.find((event) => event.type === 'abigail_s1_outside_life_distributed')!;
    state.abilityRuntime!.events.push({ ...distribution, targetPlayerIds: ['p3'] });
    rules.advanceAbilityPhase(state, 'action', 2);
    state.round.prioritySeat = 1;
    const secondAction = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.abilityId === S1_ACTION)!;
    const before = JSON.stringify(state);
    expect(rules.dispatchAbilityCommand(state, 'p1', secondAction as any).ok).toBe(false);
    expect(state.cards.find((candidate) => candidate.instanceId === card.instanceId)).toMatchObject({ ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand' });
    expect(JSON.stringify(state)).toBe(before);
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
    for (const entry of state.ruleOverrides.abigailSanityLossByPlayer.p1!.distributed) state.abilityRuntime!.events.push({ type: 'abigail_s1_outside_life_distributed', playerId: 'p1', sourceCardId: 'abigail-s1',
      abilityId: S1_ACTION, targetPlayerIds: ['p2'], cardInstanceIds: [entry.cardInstanceId], movedCount: 1 });
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
    for (const entry of state.ruleOverrides.abigailSanityLossByPlayer.p1!.distributed) state.abilityRuntime!.events.push({ type: 'abigail_s1_outside_life_distributed', playerId: 'p1', sourceCardId: 'abigail-s1',
      abilityId: S1_ACTION, targetPlayerIds: ['p2'], cardInstanceIds: [entry.cardInstanceId], movedCount: 1 });
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

  it('restores a canonical ledger and rejects forged generated cards', () => {
    const session = rules.createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    const state = (session as unknown as { state: GameState }).state;
    state.players[0]!.servantCardId = 'servant.abigail';
    state.cards.push({ instanceId: 'restore-abigail-s1', definitionId: S1, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    state.cards.push({ instanceId: 'restore-outside-life', definitionId: S4, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: 'p2' }, generatedBy: S1 });
    state.abilityRuntime!.cardState['restore-abigail-s1'] = { active: true, faceDown: false, playedRound: 1 };
    state.ruleOverrides ??= {};
    state.ruleOverrides.abigailSanityLossByPlayer = {
      p1: { sourceCardId: 'restore-abigail-s1', abilityId: S1_ACTION, controllerId: 'p1', distributed: [{ cardInstanceId: 'restore-outside-life', recipientPlayerId: 'p2' }] },
    };
    state.abilityRuntime!.events.push({ type: 'abigail_s1_outside_life_distributed', playerId: 'p1', sourceCardId: 'restore-abigail-s1',
      abilityId: S1_ACTION, targetPlayerIds: ['p2'], cardInstanceIds: ['restore-outside-life'], movedCount: 1 });
    const snapshot = session.serializeSession();
    const restored = restoreMatchSession(snapshot);
    expect(restored.getState().ruleOverrides?.abigailSanityLossByPlayer?.p1?.distributed).toEqual([{ cardInstanceId: 'restore-outside-life', recipientPlayerId: 'p2' }]);
    const forged = structuredClone(snapshot);
    const forgedCard = forged.state.cards.find((card) => card.instanceId === 'restore-outside-life')!;
    forgedCard.generatedBy = 'forged-source';
    expect(() => restoreMatchSession(forged)).toThrow('Invalid MatchSession state container');
  });

  it('requires an exact S1 victory proof and stops immediately on an existing winner', () => {
    const isolated = rules.createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    const isolatedState = (isolated as unknown as { state: GameState }).state;
    isolatedState.winnerPlayerIds = ['p3'];
    expect(() => restoreMatchSession(isolated.serializeSession())).toThrow('Invalid MatchSession state container');
    expect(isolated.runUntilHumanInputOrRoundEnd()).toBe('match_complete');

    const valid = twelveRecordSessionSnapshot();
    expect(restoreMatchSession(valid.snapshot).getState().winnerPlayerIds).toEqual(['p1']);

    const recycledBundle = twelveRecordSessionSnapshot();
    const recycled = recycledBundle.session;
    const recycledCardId = recycledBundle.distributedCardInstanceIds[0]!;
    const recycledCard = recycled.getState().cards.find((card) => card.instanceId === recycledCardId)!;
    recycledCard.ownerPlayerId = 'p1';
    recycledCard.controllerPlayerId = 'p1';
    recycledCard.zone = 'discard';
    recycledCard.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    recycled.getState().abilityRuntime!.cardState[recycledCardId] = { active: false, faceDown: false, playedRound: 1 };
    recycled.getState().abilityRuntime!.events.push({
      type: 'abigail_s4_true_name_card_recycled', playerId: 'p2', sourceCardId: recycledCardId,
      abilityId: 'servant.abigail.skill.sc-abigail-4.recycle-to-abigail-discard', recipientPlayerId: 'p1',
      fromZone: 'attack_area', toZone: 'discard', movedCount: 1,
    });
    expect(restoreMatchSession(recycled.serializeSession()).getState().ruleOverrides?.abigailSanityLossByPlayer?.p1?.distributed).toHaveLength(12);

    const sourceSwap = structuredClone(valid.snapshot);
    sourceSwap.state.cards.push({ instanceId: 'restore-victory-other-s1', definitionId: S1, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area', visibility: { scope: 'public' } });
    sourceSwap.state.abilityRuntime.cardState['restore-victory-other-s1'] = { active: true, faceDown: false, playedRound: 1 };
    sourceSwap.state.ruleOverrides!.abigailSanityLossVictoryByPlayer!.p1!.sourceCardId = 'restore-victory-other-s1';
    expect(() => restoreMatchSession(sourceSwap)).toThrow('Invalid MatchSession state container');

    const recordSwap = structuredClone(valid.snapshot);
    recordSwap.state.ruleOverrides!.abigailSanityLossVictoryByPlayer!.p1!.distributedCardInstanceIds = [
      ...valid.distributedCardInstanceIds.slice(0, 11), 'forged-extra-record',
    ];
    expect(() => restoreMatchSession(recordSwap)).toThrow('Invalid MatchSession state container');

    for (const mutate of [
      (snapshot: ReturnType<typeof twelveRecordSessionSnapshot>['snapshot']) => { snapshot.state.round.activePhase = 'round_end'; },
      (snapshot: ReturnType<typeof twelveRecordSessionSnapshot>['snapshot']) => { snapshot.state.cards.find((card) => card.instanceId === 'restore-victory-s1')!.zone = 'discard'; },
      (snapshot: ReturnType<typeof twelveRecordSessionSnapshot>['snapshot']) => { snapshot.state.cards.find((card) => card.instanceId === 'restore-victory-s1')!.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' }; },
      (snapshot: ReturnType<typeof twelveRecordSessionSnapshot>['snapshot']) => { snapshot.state.players.find((player) => player.id === 'p1')!.servantCardId = 'servant.ereshkigal'; },
      (snapshot: ReturnType<typeof twelveRecordSessionSnapshot>['snapshot']) => { snapshot.state.abilityRuntime.cardState['restore-victory-s1']!.active = false; },
    ]) {
      const forged = structuredClone(valid.snapshot);
      mutate(forged);
      const afterMutation = JSON.stringify(forged.state);
      expect(() => restoreMatchSession(forged)).toThrow('Invalid MatchSession state container');
      expect(JSON.stringify(forged.state)).toBe(afterMutation);
      expect(JSON.stringify(valid.snapshot.state)).not.toBe(JSON.stringify(forged.state));
    }
  });

  it('loads the source-bound S1 contract in a live MatchSession executable pack', () => {
    const session = rules.createMatchSession({ seed: 20261022, humanPlayerId: 'p1' });
    const runtimePack = session.getState().abilityRuntime?.pack;
    expect(runtimePack?.cards[S1]?.abilities.map((ability) => ability.id)).toEqual([S1_ACTION, S1_WIN]);
    expect(runtimePack?.cards[S1]?.abilities.every((ability) => ability.execution.mode === 'automatic')).toBe(true);
  });
});
