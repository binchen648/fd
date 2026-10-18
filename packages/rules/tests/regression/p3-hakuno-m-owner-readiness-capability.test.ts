import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ARCHIVE_PATH = resolve('data/authoring/masters/master.hakuno-m.json');
const ROOT = 'master.hakuno-m';
const ASCENSION = `${ROOT}.skill.ascension`;
const S1 = `${ROOT}.skill.s1`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const YOMI = 'hakuno-m.yomi';
const DEAD_FACE = 'hakuno-m.dead-face-transfer';

function rawArchive() {
  return JSON.parse(readFileSync(ARCHIVE_PATH, 'utf8')) as any;
}

function setup(phase: 'action' | 'combat' = 'action'): GameState {
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = phase;
  state.players[0]!.masterCardId = ROOT;
  state.players[1]!.masterCardId = 'master.artoria';
  state.players[2]!.masterCardId = 'master.irisviel';
  state.players[0]!.mana = 4;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  state.players[0]!.status = 'active';
  state.players[1]!.status = 'active';
  state.players[2]!.status = 'active';
  rules.initializeAbilityRuntime(state, rules.loadAuthoringJson(rawArchive()), { seed: 20261019 });
  return state;
}

function addCard(state: GameState, definitionId: string, owner = 'p1', zone = 'skill') {
  const instanceId = `hakuno-m:${state.cards.length}:${definitionId.split('.').at(-1)}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: owner,
    controllerPlayerId: owner,
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: owner },
  });
  state.abilityRuntime!.cardState[instanceId] = {
    active: false,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

describe('P3 Hakuno-M owner readiness capability', () => {
  it('loads exactly the four frozen skills as executable server-owned abilities', () => {
    const loaded = rules.loadAuthoringJson(rawArchive());
    expect(loaded.report.filter((entry) => entry.cardId === S1 || entry.cardId === S2 || entry.cardId === S3)).toEqual([]);
    expect(loaded.report.some((entry) => entry.abilityId === YOMI && entry.status === 'unsupported')).toBe(false);
    expect(loaded.report.some((entry) => entry.abilityId === DEAD_FACE && entry.status === 'unsupported')).toBe(false);
    expect(Object.keys(loaded.cards).sort()).toEqual([ASCENSION, S1, S2, S3].sort());
    expect(loaded.cards[S1]!.abilities[0]!.effects[0]).toEqual({
      type: 'hakuno_m_yomi', mode: 'analysis_or_challenge', target: 'opponent',
    });
    expect(loaded.cards[ASCENSION]!.abilities[0]!.cost).toEqual([{ type: 'pay_mana', amount: 1 }]);
  });

  it('fails closed for widened Hakuno-M privileged shapes', () => {
    const malformed = rawArchive();
    malformed.cards[1].abilities[0].effects[0].mode = 'challenge';
    const loaded = rules.loadAuthoringJson(malformed);
    expect(loaded.report).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'unsupported', path: 'hakunoMale.gateway' }),
    ]));
  });

  it('rejects missing, extra, and tampered Yomi target/cost envelope fields without throwing', () => {
    const mutations = [
      (archive: any) => { delete archive.cards[1].abilities[0].targets[0].count; },
      (archive: any) => { archive.cards[1].abilities[0].targets[0].count.max = 2; },
      (archive: any) => { archive.cards[1].abilities[0].targets[0].constraints = []; },
      (archive: any) => { archive.cards[1].abilities[0].targets[0].extra = true; },
      (archive: any) => { archive.cards[1].abilities[0].cost = [{ type: 'pay_mana', amount: 1 }]; },
    ];
    for (const mutate of mutations) {
      const malformed = rawArchive();
      mutate(malformed);
      expect(() => rules.loadAuthoringJson(malformed)).not.toThrow();
      expect(rules.loadAuthoringJson(malformed).report).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'hakunoMale.gateway', abilityId: YOMI, status: 'unsupported' }),
      ]));
    }
  });

  it('rejects widened Dead Face cost and target envelopes at the whole-ability gateway', () => {
    const wrongCost = rawArchive();
    wrongCost.cards[0].abilities[0].cost[0].amount = 2;
    expect(rules.loadAuthoringJson(wrongCost).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'hakunoMale.gateway', abilityId: DEAD_FACE, status: 'unsupported' }),
    ]));

    const wrongRecipient = rawArchive();
    wrongRecipient.cards[0].abilities[0].targets[1].constraints = [{ type: 'same_location_as_controller' }];
    expect(rules.loadAuthoringJson(wrongRecipient).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'hakunoMale.gateway', abilityId: DEAD_FACE, status: 'unsupported' }),
    ]));

    const missingAnalysisTarget = rawArchive();
    missingAnalysisTarget.cards[0].abilities[0].targets = [];
    expect(() => rules.loadAuthoringJson(missingAnalysisTarget)).not.toThrow();
    expect(rules.loadAuthoringJson(missingAnalysisTarget).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'hakunoMale.gateway', abilityId: DEAD_FACE, status: 'unsupported' }),
    ]));

    const extraAnalysisTargetField = rawArchive();
    extraAnalysisTargetField.cards[0].abilities[0].targets[0].unexpected = 'tampered';
    expect(() => rules.loadAuthoringJson(extraAnalysisTargetField)).not.toThrow();
    expect(rules.loadAuthoringJson(extraAnalysisTargetField).report).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'hakunoMale.gateway', abilityId: DEAD_FACE, status: 'unsupported' }),
    ]));
  });

  it('executes Yomi analysis branch with a -2 round adjustment and provenance-bound Analysis card', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: source, abilityId: YOMI,
      variables: {}, selections: { opponent: ['p2'] },
    });
    const branch = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: branch.id, selectedIds: ['analysis'] }).ok).toBe(true);

    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({
      playerId: 'p1', amount: -2, sourceCardId: source, abilityId: YOMI,
    }));
    expect(state.cards).toContainEqual(expect.objectContaining({
      definitionId: S3, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill', generatedBy: source,
    }));
  });

  it('runs the three-round Yomi continuation with server-owned alternating choices and S2 settlement', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: YOMI, variables: {}, selections: { opponent: ['p2'] } });
    const choose = (playerId: string, selected: string[]) => {
      const decision = state.abilityRuntime!.pendingDecision!;
      const result = rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision.id, selectedIds: selected });
      expect(result.ok).toBe(true);
    };
    choose('p1', ['challenge']);
    choose('p1', ['rock']); choose('p2', ['scissors']);
    choose('p1', ['paper']); choose('p2', ['rock']);
    choose('p1', ['scissors']); choose('p2', ['rock']);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.abilityRuntime!.roundPlayerPowerAdjustments).toContainEqual(expect.objectContaining({ playerId: 'p1', amount: 3, sourceCardId: source, abilityId: YOMI }));
    expect(state.cards).toContainEqual(expect.objectContaining({ definitionId: S3, ownerPlayerId: 'p2', generatedBy: source }));
    expect(state.abilityRuntime!.events.filter((event) => event.type === 'hakuno_m_challenge_round_resolved')).toHaveLength(3);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'hakuno_m_challenge_result_resolved', challengeWins: 2 }));
  });

  it('settles every direct S2 result branch with exact Power, Analysis, defeat, and audit outcomes', () => {
    const cases = [
      { name: 'zero', initiator: ['rock', 'rock', 'rock'], opponent: ['paper', 'paper', 'paper'], power: undefined, analysis: 0, defeated: 'p1', otherDefeated: undefined, wins: 0 },
      { name: 'one', initiator: ['rock', 'rock', 'rock'], opponent: ['scissors', 'paper', 'paper'], power: 2, analysis: 0, defeated: undefined, otherDefeated: undefined, wins: 1 },
      { name: 'two', initiator: ['rock', 'rock', 'rock'], opponent: ['scissors', 'scissors', 'paper'], power: 3, analysis: 1, defeated: undefined, otherDefeated: undefined, wins: 2 },
      { name: 'three', initiator: ['rock', 'rock', 'rock'], opponent: ['scissors', 'scissors', 'scissors'], power: 3, analysis: 1, defeated: undefined, otherDefeated: 'p2', wins: 3 },
    ] as const;
    for (const scenario of cases) {
      const state = setup('combat');
      const source = addCard(state, S1);
      rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: YOMI, variables: {}, selections: { opponent: ['p2'] } });
      const choose = (playerId: string, selected: string[]) => {
        const decision = state.abilityRuntime!.pendingDecision!;
        expect(rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision.id, selectedIds: selected }).ok).toBe(true);
      };
      choose('p1', ['challenge']);
      for (let index = 0; index < 3; index++) {
        choose('p1', [scenario.initiator[index]!]);
        choose('p2', [scenario.opponent[index]!]);
      }
      const adjustment = state.abilityRuntime!.roundPlayerPowerAdjustments?.find((entry) => entry.sourceCardId === source && entry.abilityId === YOMI);
      if (scenario.power === undefined) expect(adjustment).toBeUndefined();
      else expect(adjustment).toMatchObject({ playerId: 'p1', amount: scenario.power, round: 1 });
      expect(state.cards.filter((entry) => entry.definitionId === S3 && entry.ownerPlayerId === 'p2')).toHaveLength(scenario.analysis);
      expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p1).toBe(scenario.defeated ? 1 : undefined);
      expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(scenario.otherDefeated ? 1 : undefined);
      expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'hakuno_m_challenge_result_resolved', challengeWins: scenario.wins, sourceCardId: source, abilityId: YOMI }));
    }
  });

  it('rejects stale replay, cross-stage, location, identity, and revision tampering without consuming continuation state', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: YOMI, variables: {}, selections: { opponent: ['p2'] } });
    const branch = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: branch.id, selectedIds: ['challenge'] }).ok).toBe(true);
    const throwDecision = state.abilityRuntime!.pendingDecision!;
    const replay = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: branch.id, selectedIds: ['challenge'] });
    expect(replay.ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(throwDecision.id);

    const originalPhase = state.round.activePhase;
    state.round.activePhase = 'action';
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: throwDecision.id, selectedIds: ['rock'] }).ok).toBe(false);
    state.round.activePhase = originalPhase;
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(throwDecision.id);

    const originalLocation = state.players[1]!.locationId;
    state.players[1]!.locationId = 'shinto';
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: throwDecision.id, selectedIds: ['rock'] }).ok).toBe(false);
    state.players[1]!.locationId = originalLocation;
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(throwDecision.id);

    const originalRevision = state.abilityRuntime!.pendingDecision!.interaction!.createdRevision;
    state.abilityRuntime!.pendingDecision!.interaction!.createdRevision = 999;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: throwDecision.id, selectedIds: ['rock'] }).ok).toBe(false);
    state.abilityRuntime!.pendingDecision!.interaction!.createdRevision = originalRevision;
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(throwDecision.id);

    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: throwDecision.id, selectedIds: ['rock'] }).ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(throwDecision.id);
  });

  it('rejects a challenge branch from the wrong participant or with a forged option and preserves the pending state', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: YOMI, variables: {}, selections: { opponent: ['p2'] } });
    const decision = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p2', { type: 'choose_target', decisionId: decision.id, selectedIds: ['challenge'] }).ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(decision.id);
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: decision.id, selectedIds: ['forged'] }).ok).toBe(false);
    expect(state.abilityRuntime!.pendingDecision?.id).toBe(decision.id);
  });

  it('applies the Analysis threshold as an additional challenge win', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    addCard(state, S3, 'p2'); addCard(state, S3, 'p2'); addCard(state, S3, 'p2');
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: YOMI, variables: {}, selections: { opponent: ['p2'] } });
    const choose = (playerId: string, selected: string[]) => {
      const decision = state.abilityRuntime!.pendingDecision!;
      const result = rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision.id, selectedIds: selected });
      expect(result.ok).toBe(true);
    };
    choose('p1', ['challenge']);
    choose('p1', ['rock']); choose('p2', ['scissors']);
    choose('p1', ['rock']); choose('p2', ['scissors']);
    choose('p1', ['rock']); choose('p2', ['scissors']);
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'hakuno_m_challenge_result_resolved', challengeWins: 4, analysisCount: 3 }));
  });

  it('runs Yomi analysis end-to-end and transfers a non-Hakuno holder to the next active opponent', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: YOMI, variables: {}, selections: { opponent: ['p2'] } });
    const branch = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: branch.id, selectedIds: ['analysis'] }).ok).toBe(true);
    const analysis = state.cards.find((entry) => entry.definitionId === S3 && entry.ownerPlayerId === 'p2');
    expect(analysis).toBeDefined();
    state.players[1]!.status = 'eliminated';
    rules.processAbilityEvent(state, { id: 'hakuno-m-elimination', type: 'after_battle_result_determined', battleParticipantIds: ['p2'], battleResult: { winners: [], loserIds: ['p2'] } });
    expect(state.cards.find((entry) => entry.instanceId === analysis!.instanceId)?.ownerPlayerId).toBe('p3');
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'hakuno_analysis_handoff_resolved', playerId: 'p2', controllerId: 'p3', movedCount: 1 }));

    const wrapped = setup('combat');
    wrapped.players[2]!.locationId = 'miyama_town';
    const wrappedSource = addCard(wrapped, S1);
    rules.executeAbility(wrapped, { controllerId: 'p1', sourceCardId: wrappedSource, abilityId: YOMI, variables: {}, selections: { opponent: ['p3'] } });
    const wrappedBranch = wrapped.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(wrapped, 'p1', { type: 'choose_target', decisionId: wrappedBranch.id, selectedIds: ['analysis'] }).ok).toBe(true);
    const wrappedAnalysis = wrapped.cards.find((entry) => entry.definitionId === S3 && entry.ownerPlayerId === 'p3');
    expect(wrappedAnalysis).toBeDefined();
    wrapped.players[0]!.seat = 3;
    wrapped.players[1]!.seat = 1;
    wrapped.players[2]!.seat = 2;
    wrapped.players[2]!.status = 'eliminated';
    rules.processAbilityEvent(wrapped, { id: 'hakuno-m-elimination-wrap', type: 'after_battle_result_determined', battleParticipantIds: ['p3'], battleResult: { winners: [], loserIds: ['p3'] } });
    expect(wrapped.cards.find((entry) => entry.instanceId === wrappedAnalysis!.instanceId)?.ownerPlayerId).toBe('p2');
  });

  it('records a structured no-target handoff when every non-Hakuno opponent is eliminated', () => {
    const state = setup('combat');
    const source = addCard(state, S1);
    rules.executeAbility(state, { controllerId: 'p1', sourceCardId: source, abilityId: YOMI, variables: {}, selections: { opponent: ['p2'] } });
    const branch = state.abilityRuntime!.pendingDecision!;
    expect(rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: branch.id, selectedIds: ['analysis'] }).ok).toBe(true);
    const analysis = state.cards.find((entry) => entry.definitionId === S3 && entry.ownerPlayerId === 'p2');
    expect(analysis).toBeDefined();
    state.players[1]!.status = 'eliminated';
    state.players[2]!.status = 'eliminated';
    rules.processAbilityEvent(state, { id: 'hakuno-m-elimination-no-target', type: 'after_battle_result_determined', battleParticipantIds: ['p2'], battleResult: { winners: [], loserIds: ['p2'] } });
    expect(state.cards.find((entry) => entry.instanceId === analysis!.instanceId)?.ownerPlayerId).toBe('p2');
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'hakuno_analysis_handoff_skipped', playerId: 'p2', movedCount: 1 }));
  });

  it('executes Dead Face as a repeatable paid owner transfer and preserves the Analysis definition', () => {
    const state = setup('action');
    const source = addCard(state, ASCENSION);
    const analysis = addCard(state, S3, 'p2');
    const beforeMana = state.players[0]!.mana;
    rules.executeAbility(state, {
      controllerId: 'p1', sourceCardId: source, abilityId: DEAD_FACE,
      variables: {}, selections: { analysis: [analysis], recipient: ['p3'] },
    });

    const moved = state.cards.find((card) => card.instanceId === analysis)!;
    expect(state.players[0]!.mana).toBe(beforeMana - 1);
    expect(moved).toMatchObject({ definitionId: S3, ownerPlayerId: 'p3', controllerPlayerId: 'p3', zone: 'skill' });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'card_moved', cardInstanceId: analysis, fromZone: 'skill', toZone: 'skill', abilityId: DEAD_FACE,
    }));
  });

  it('never treats challenge-result or Analysis marker effects as successful interpreter no-ops', () => {
    const state = setup('combat');
    for (const [definitionId, abilityId, effectType] of [
      [S2, 'hakuno-m.challenge-result', 'hakuno_m_challenge_result'],
      [S3, 'hakuno-m.analysis', 'hakuno_m_analysis'],
    ] as const) {
      const source = addCard(state, definitionId);
      expect(() => rules.resolveEffect(state, {
        controllerId: 'p1', sourceCardId: source, abilityId,
        variables: {}, selections: {},
      }, { type: effectType })).toThrow(/authenticated continuation or elimination event/);
    }
  });

  it('records the frozen lifecycle marker identities without host-adjudicated execution', () => {
    const raw = rawArchive();
    expect(raw.sourcePolicy.note).toContain('server-owned Yomi continuation');
    expect(raw.cards.find((card: any) => card.id === S2).abilities[0].execution.mode).toBe('automatic');
    expect(raw.cards.find((card: any) => card.id === S3).abilities[0].execution.mode).toBe('automatic');
    expect(raw.cards.find((card: any) => card.id === S2).abilities[0].effects).toEqual([
      { type: 'hakuno_m_challenge_result' },
    ]);
    expect(raw.cards.find((card: any) => card.id === S3).abilities[0].effects).toEqual([
      { type: 'hakuno_m_analysis' },
    ]);
  });
});
