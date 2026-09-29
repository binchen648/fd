import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER = 'servant.fixture-plunder';
const SC1 = `${OWNER}.skill.plunder`;
const SC2 = `${OWNER}.skill.replay`;
const RECORD = 'fixture:plundered-cards';
const PLUNDER = 'fixture.battle-plunder';
const REPLAY = 'fixture.removed-replay';
const BASIC1 = 'fixture.basic.one';
const BASIC2 = 'fixture.basic.two';
const BASIC3 = 'fixture.basic.three';
const BASIC4 = 'fixture.basic.four';

function standardResponse() { return { order: 'turn_order', passBehavior: 'decline_this_window' }; }
function plunderAbility() {
  return {
    id: PLUNDER, kind: 'forced_trigger', printedClause: 'fixture plunder', activation: { trigger: 'after_controller_wins_battle' },
    conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: standardResponse(), limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
    effects: [{ type: 'battle_competition_reward_plunder', recordKey: RECORD, competitionReward: 'replace', peekCount: 3,
      vpCap: 5, removedZone: 'removed_from_game', trigger: 'after_controller_wins_battle' }],
  } as any;
}
function replayAbility() {
  return {
    id: REPLAY, kind: 'phase_action', printedClause: 'fixture replay',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: standardResponse(), limit: {},
    visibility: { revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' },
    execution: { mode: 'automatic', allowedOperations: [] },
    effects: [{ type: 'play_recorded_removed_card', recordKey: RECORD, sourceZone: 'removed_from_game', minimumManaCost: 2, removeSourceAfterBattle: true }],
  } as any;
}
function archive(a1 = plunderAbility(), a2 = replayAbility()) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: OWNER, name: 'Fixture', class: 'Rider', cards: [
      { id: SC1, name: 'Plunder', cardType: 'servant_skill', owner: { type: 'servant', id: OWNER }, printedText: 'fixture',
        cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [], abilities: [a1], verification: { implementationStatus: 'complete' } },
      { id: SC2, name: 'Replay', cardType: 'servant_skill', owner: { type: 'servant', id: OWNER }, printedText: 'fixture',
        cardFace: { typeLabel: '力量/宝具', attributes: ['力量', '宝具'], cost: 4, basePower: 6 }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [{ type: 'skill_zone_mana_at_least', value: 8 }], abilities: [a2], verification: { implementationStatus: 'complete' } },
    ],
  } as any;
}
function basic(id: string, cost: number, basePower: number) {
  return { id, name: id, cardType: 'basic_attack', printedText: id, cardFace: { typeLabel: '基础攻击', attributes: ['力量'], cost, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], verification: { implementationStatus: 'complete' }, mode: 'automatic' } as any;
}
function pack() {
  const loaded = rules.loadAuthoringJson(archive());
  expect(loaded.report).toEqual([]);
  (loaded.cards as any)[BASIC1] = basic(BASIC1, 0, 1);
  (loaded.cards as any)[BASIC2] = basic(BASIC2, 1, 6);
  (loaded.cards as any)[BASIC3] = basic(BASIC3, 3, 3);
  (loaded.cards as any)[BASIC4] = basic(BASIC4, 2, 2);
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone: string, active = false) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'removed_from_game'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack(); const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players[0]!.mana = 20; state.players[0]!.vp = 0; state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.mana = 20; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  const sc1 = add(state, SC1, 'p1', 'fixture-sc1', 'skill', false);
  const cards = [
    add(state, BASIC1, 'p2', 'p2-top-1', 'deck'), add(state, BASIC2, 'p2', 'p2-top-2', 'deck'),
    add(state, BASIC3, 'p2', 'p2-top-3', 'deck'), add(state, BASIC4, 'p2', 'p2-top-4', 'deck'),
  ];
  return { state, sc1, cards };
}
function rootBattle(state: GameState) {
  rules.processAbilityEvent(state, {
    id: 'result-1', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:1', battleId: 'battle-1', resultId: 'result-1',
    battlefieldId: 'miyama_town', battleParticipantIds: ['p1', 'p2'], battleParticipantPowers: { p1: 6, p2: 3 },
    battleResult: { winners: ['p1'], loserIds: ['p2'] },
  });
}
function choose(state: GameState, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, pending.controllerId, { type: 'choose_target', decisionId: pending.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function sessionFor(state: GameState) {
  const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 Teach owner-readiness generic battle-plunder/replay capability', () => {
  it('accepts only exact privileged whole-ability shapes and rejects widened near matches', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(rules.isAcceptedBattleCompetitionPlunderAbility(loaded.cards[SC1]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedPlayRecordedRemovedCardAbility(loaded.cards[SC2]!.abilities[0]!)).toBe(true);
    const mutations: Array<[0 | 1, (a: any) => void]> = [
      [0, (a) => { a.effects[0].peekCount = 4; }], [0, (a) => { a.effects[0].vpCap = 6; }],
      [0, (a) => { a.effects[0].competitionReward = 'add'; }], [0, (a) => { a.effects[0].extra = true; }],
      [1, (a) => { a.effects[0].minimumManaCost = 1; }], [1, (a) => { a.effects[0].removeSourceAfterBattle = false; }],
      [1, (a) => { a.activation.requiresSourceState = 'present'; }], [1, (a) => { a.visibility.revealsTrueName = false; }],
    ];
    for (const [index, mutate] of mutations) {
      const abilities = [plunderAbility(), replayAbility()]; mutate(abilities[index]);
      expect(rules.loadAuthoringJson(archive(abilities[0], abilities[1])).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('replaces only the controller competition VP while preserving other winners and location rewards', () => {
    const { state } = setup(); state.round.activePhase = 'battle';
    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
    location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards']; location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
    const result = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 5 }, { playerId: 'p3', totalPower: 1 },
    ] }).nextState.battleResults.at(-1)!;
    const adjustment = (playerId: string, source: string) => result.vpAdjustments?.find((entry) => entry.playerId === playerId && entry.source === source)?.delta ?? 0;
    expect(adjustment('p1', 'competition_vp')).toBe(0);
    expect(adjustment('p2', 'competition_vp')).toBeGreaterThan(0);
    expect(adjustment('p1', 'location_vp')).toBeGreaterThan(0);
  });

  it('keeps competition VP when every contested participant is a winner and no authoritative loser exists', () => {
    const { state } = setup(); state.round.activePhase = 'battle';
    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
    location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards']; location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
    const resolved = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 5 },
    ] }).nextState;
    const result = resolved.battleResults.at(-1)!;
    const adjustment = (playerId: string, source: string) => result.vpAdjustments?.find((entry) => entry.playerId === playerId && entry.source === source)?.delta ?? 0;
    expect(result.winnerPlayerIds).toEqual(['p1', 'p2']);
    expect(adjustment('p1', 'competition_vp')).toBeGreaterThan(0);
    expect(resolved.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(() => rules.processAbilityEvent(resolved, {
      id: 'all-winner-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:tie', battleId: 'battle-tie', resultId: 'all-winner-result',
      battlefieldId: 'miyama_town', battleParticipantIds: ['p1', 'p2'], battleParticipantPowers: { p1: 5, p2: 5 },
      battleResult: { winners: ['p1', 'p2'], loserIds: [] },
    })).not.toThrow();
    expect(resolved.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('keeps competition VP when every non-winner is authoritatively loss-suppressed', () => {
    const { state } = setup(); state.round.activePhase = 'battle';
    state.abilityRuntime!.battleLossIgnoreRoundByPlayer = { p2: state.round.roundNumber };
    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
    location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards']; location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
    const resolved = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 1 },
    ] }).nextState;
    const result = resolved.battleResults.at(-1)!;
    const adjustment = (playerId: string, source: string) => result.vpAdjustments?.find((entry) => entry.playerId === playerId && entry.source === source)?.delta ?? 0;
    expect(result.winnerPlayerIds).toEqual(['p1']);
    expect(result.lossEffectSuppressedPlayerIds).toEqual(['p2']);
    expect(adjustment('p1', 'competition_vp')).toBeGreaterThan(0);
    expect(() => rules.processAbilityEvent(resolved, {
      id: 'suppressed-loser-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:suppressed',
      battleId: 'battle-suppressed', resultId: 'suppressed-loser-result', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleParticipantPowers: { p1: 5, p2: 1 },
      battleResult: { winners: ['p1'], loserIds: [] },
    })).not.toThrow();
    expect(resolved.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('still replaces competition VP when a non-winner is excluded from winning but remains an authoritative loser', () => {
    const { state } = setup(); state.round.activePhase = 'battle';
    state.abilityRuntime!.battleDefeatRoundByPlayer = { p2: state.round.roundNumber };
    const location = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
    location.rewardHooks = ['battle_rewards', 'competition_rewards', 'location_rewards']; location.vpRewardRules = { battle: 2, competition: 3, location: 4 };
    const resolved = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 3 }, { playerId: 'p2', totalPower: 7 },
    ] }).nextState;
    const result = resolved.battleResults.at(-1)!;
    const adjustment = (playerId: string, source: string) => result.vpAdjustments?.find((entry) => entry.playerId === playerId && entry.source === source)?.delta ?? 0;
    expect(result.winnerPlayerIds).toEqual(['p1']);
    expect(result.excludedPlayerIds).toContain('p2');
    expect(result.lossEffectSuppressedPlayerIds ?? []).not.toContain('p2');
    expect(adjustment('p1', 'competition_vp')).toBe(0);
    rules.processAbilityEvent(resolved, {
      id: 'excluded-loser-result', type: 'after_battle_result_determined', battlePhaseResolutionId: 'battle-phase:excluded',
      battleId: 'battle-excluded', resultId: 'excluded-loser-result', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleParticipantPowers: { p1: 3, p2: 7 },
      battleResult: { winners: ['p1'], loserIds: ['p2'] },
    });
    expect(resolved.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'battle_plunder_choice_v1', stage: 'loser', loserIds: ['p2'] });
  });

  it('uses authoritative winner/loser facts, removes one physical top-three card, caps printed Power at 5, and preserves chosen deck order', () => {
    const { state, cards } = setup(); rootBattle(state);
    expect(state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'battle_plunder_choice_v1', stage: 'loser', loserIds: ['p2'] });
    choose(state, ['p2']);
    expect(state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'battle_plunder_choice_v1', stage: 'remove', topCardIds: cards.slice(0, 3) });
    choose(state, [cards[1]!]);
    expect(state.players[0]!.vp).toBe(5);
    expect(state.cards.find((card) => card.instanceId === cards[1])!.zone).toBe('removed_from_game');
    expect(state.abilityRuntime!.recordedRemovedCards?.[cards[1]!]).toMatchObject({
      recordKey: RECORD, controllerId: 'p1', originalOwnerPlayerId: 'p2', triggerResultId: 'result-1', triggerEventId: 'result-1:win:p1',
    });
    expect(state.abilityRuntime!.events.find((event) => event.type === 'battle_plunder_card_removed')).toMatchObject({
      controllerId: 'p1', cardInstanceId: cards[1], resultId: 'result-1', triggerEventId: 'result-1:win:p1',
      fromZone: 'deck', toZone: 'removed_from_game', qualifyingPlayerIds: ['p2'], revealedCardInstanceIds: cards.slice(0, 3),
    });
    expect(state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'battle_plunder_choice_v1', stage: 'reorder', keptCardIds: [cards[0], cards[2]] });
    choose(state, [cards[2]!, cards[0]!]);
    const deck = state.cards.filter((card) => card.ownerPlayerId === 'p2' && card.zone === 'deck').map((card) => card.instanceId);
    expect(deck).toEqual([cards[2], cards[0], cards[3]]);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('replays only recorded removed physical cards at normal cost floored to 2, preserves ownership, and removes the source after battle', () => {
    const { state, sc1, cards } = setup(); rootBattle(state); choose(state, ['p2']); choose(state, [cards[1]!]); choose(state, [cards[0]!, cards[2]!]);
    state.cards.find((card) => card.instanceId === sc1)!.zone = 'discard';
    state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    const sc2 = add(state, SC2, 'p1', 'fixture-sc2', 'attack_area', true);
    const beforeMana = state.players[0]!.mana;
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === sc2 && entry.abilityId === REPLAY);
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!)).toMatchObject({ ok: true });
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual([cards[1]]);
    choose(state, [cards[1]!]);
    const replayed = state.cards.find((card) => card.instanceId === cards[1])!;
    expect(replayed).toMatchObject({ ownerPlayerId: 'p2', controllerPlayerId: 'p1', zone: 'attack_area' });
    expect(state.players[0]!.mana).toBe(beforeMana - 2);
    expect(state.abilityRuntime!.cardState[cards[1]!]!.paidManaOnPlay).toBe(2);
    expect(state.abilityRuntime!.cardState[sc2]!.removeAfterBattleRound).toBe(state.round.roundNumber);
    const terminal = `battle-phase:${state.round.roundNumber}`;
    rules.processAbilityEvent(state, { id: `${terminal}:after_battle_ended`, type: 'after_battle_ended', battlePhaseResolutionId: terminal });
    expect(state.cards.find((card) => card.instanceId === sc2)!.zone).toBe('removed_from_game');
  });

  it('round-trips pending/private provenance and rejects forged removed-card authority', () => {
    const pendingSetup = setup(); rootBattle(pendingSetup.state);
    const pendingRestored = rules.restoreMatchSession(
      JSON.parse(JSON.stringify(sessionFor(pendingSetup.state).serializeSession())),
      { restorePackKind: 'trusted_authoring_fixture' },
    );
    expect(pendingRestored.state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({
      kind: 'battle_plunder_choice_v1', stage: 'loser', recordKey: RECORD, loserIds: ['p2'],
    });

    const { state, cards } = setup(); rootBattle(state); choose(state, ['p2']); choose(state, [cards[1]!]); choose(state, [cards[0]!, cards[2]!]);
    const restored = rules.restoreMatchSession(JSON.parse(JSON.stringify(sessionFor(state).serializeSession())), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.recordedRemovedCards?.[cards[1]!]?.recordKey).toBe(RECORD);
    const forged = JSON.parse(JSON.stringify(sessionFor(state).serializeSession()));
    forged.state.abilityRuntime.recordedRemovedCards[cards[1]].recordKey = 'forged:key';
    expect(() => rules.restoreMatchSession(forged, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();

    const decoyId = add(state, BASIC4, 'p2', 'p2-decoy-removed', 'removed_from_game');
    const forgedState = structuredClone(state);
    const realRecord = forgedState.abilityRuntime!.recordedRemovedCards![cards[1]!]!;
    delete forgedState.abilityRuntime!.recordedRemovedCards![cards[1]!];
    forgedState.abilityRuntime!.recordedRemovedCards![decoyId] = { ...realRecord, cardInstanceId: decoyId };
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(forgedState)).toBe(false);
    const independentlySealedForged = JSON.parse(JSON.stringify(sessionFor(forgedState).serializeSession()));
    expect(() => rules.restoreMatchSession(independentlySealedForged, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();
  });

  it('keeps the production implementation identity-free', () => {
    const production = [
      'packages/rules/src/ability/battle-plunder-replay-capability.ts', 'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts', 'packages/rules/src/core/combat-resolver.ts', 'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.teach', 'sc-teach', '爱德华', '绅士之爱', '安妮女王', 'core.teach-', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
