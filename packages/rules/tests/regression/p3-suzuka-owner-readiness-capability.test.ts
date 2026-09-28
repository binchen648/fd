import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ROOT = 'servant.fixture-recycle-replay';
const WISDOM = `${ROOT}.skill.wisdom`;
const REPLAY = `${ROOT}.skill.replay`;
const GROWTH = `${ROOT}.skill.growth`;
const DRAW = `${ROOT}.skill.draw`;
const COUNTER = 'fixture:wisdom';

const baseAbility = (id: string) => ({
  id, printedClause: 'fixture', conditions: [], targets: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
  responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
});
function recycleAbility() {
  return { ...baseAbility('fixture.recycle'), kind: 'passive', activation: {},
    effects: [{ type: rules.AUTOMATIC_RECYCLE_KEEP_GAIN_COUNTER_EFFECT, counterKey: COUNTER, keepMax: 3, gain: 1, reason: 'automatic_recycle' }] } as any;
}
function ignoreAbility() {
  return { ...baseAbility('fixture.ignore-loss'), kind: 'phase_action', activation: { phase: 'advance', opens: 'controller_action_window' },
    effects: [{ type: rules.SPEND_COUNTER_IGNORE_BATTLE_LOSS_EFFECT, counterKey: COUNTER, amount: 1, duration: 'this_round' }],
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' } } as any;
}
function replayAbility() {
  return { ...baseAbility('fixture.replay-discard'), kind: 'phase_action', activation: { phase: 'action', opens: 'controller_action_window' },
    effects: [{ type: rules.DISCARD_BASIC_REPLAY_COUNTER_EFFECT, counterKey: COUNTER, maxSpend: 2, baseCount: 3,
      sourceZone: 'discard', cardKind: 'basic_attack', payCardCosts: true, returnAfter: 'after_battle_ended' }],
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' } } as any;
}
function growthAbility() {
  return { ...baseAbility('fixture.growth-on-play'), kind: 'forced_trigger', activation: { trigger: 'on_card_played', requiresSourceState: 'active' },
    effects: [{ type: rules.PHYSICAL_CARD_REPLAY_GROWTH_EFFECT, costIncreasePerPlay: 1, costDuration: 'game', revealDiscardTop: 3,
      printedPowerEquals: 4, powerBonus: 'effective_play_cost', powerDuration: 'this_round' }] } as any;
}
function drawAbility() {
  return { ...baseAbility('fixture.draw-one'), kind: 'phase_action', activation: { phase: 'action', opens: 'controller_action_window' },
    effects: [{ type: 'draw_cards', count: 1 }], responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' } } as any;
}
function card(id: string, abilities: any[], cost = 0, basePower = 0) {
  return { id, name: id, cardType: 'servant_skill', owner: { type: 'servant', id: ROOT },
    cardFace: { typeLabel: 'fixture', attributes: [], cost, basePower }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
    playRequirements: [], abilities, verification: { implementationStatus: 'complete' } } as any;
}
function archive(overrides?: { recycle?: any; ignore?: any; replay?: any; growth?: any }) {
  return { schemaVersion: 'fd-card-authoring-v1', id: ROOT, name: 'Fixture', class: 'Saber', cards: [
    card(WISDOM, [overrides?.recycle ?? recycleAbility(), overrides?.ignore ?? ignoreAbility()]),
    card(REPLAY, [overrides?.replay ?? replayAbility()]),
    card(GROWTH, [overrides?.growth ?? growthAbility()], 2, 4),
    card(DRAW, [drawAbility()]),
  ] } as any;
}
function basic(id: string, cost: number, basePower = cost || 1) {
  return { id, name: id, cardType: 'basic_attack', cardFace: { typeLabel: 'basic', attributes: ['力量'], cost, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any;
}
function add(state: GameState, definitionId: string, owner: string, zone: string, instanceId = `${definitionId}:${state.cards.length}`) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field','attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active: ['field','attack_area'].includes(zone), faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  for (let i = 1; i <= 8; i++) pack.cards[`fixture.basic.${i}`] = basic(`fixture.basic.${i}`, i % 3, i === 4 ? 4 : 2);
  const state = createSeededGameState({ activeSeats: [1,2] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1; state.players[0]!.mana = 30;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260929 });
  const wisdom = add(state, WISDOM, 'p1', 'skill', 'wisdom-source');
  const replay = add(state, REPLAY, 'p1', 'skill', 'replay-source');
  const growth = add(state, GROWTH, 'p1', 'hand', 'growth-source');
  const draw = add(state, DRAW, 'p1', 'skill', 'draw-source');
  return { state, pack, wisdom, replay, growth, draw };
}
function activate(state: GameState, source: string, abilityId: string) {
  const out = rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: source, abilityId });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function choose(state: GameState, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, decision.controllerId, { type: 'choose_target', decisionId: decision.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}

describe('P3 Suzuka owner-readiness capability', () => {
  it('accepts only the exact identity-free whole-ability shells and fails closed on near matches', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report.some((entry) => entry.status === 'unsupported')).toBe(false);
    expect(rules.isAcceptedAutomaticRecycleKeepGainCounterAbility(loaded.cards[WISDOM]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedSpendCounterIgnoreBattleLossAbility(loaded.cards[WISDOM]!.abilities[1]!)).toBe(true);
    expect(rules.isAcceptedDiscardBasicReplayCounterAbility(loaded.cards[REPLAY]!.abilities[0]!)).toBe(true);
    expect(rules.isAcceptedPhysicalCardReplayGrowthAbility(loaded.cards[GROWTH]!.abilities[0]!)).toBe(true);
    const mutations: Array<[keyof NonNullable<Parameters<typeof archive>[0]>, (value: any) => void]> = [
      ['recycle', (a) => { a.effects[0].keepMax = 4; }],
      ['ignore', (a) => { a.effects[0].duration = 'game'; }],
      ['replay', (a) => { a.effects[0].maxSpend = 3; }],
      ['growth', (a) => { a.effects[0].printedPowerEquals = 5; }],
    ];
    for (const [key, mutate] of mutations) {
      const value = key === 'recycle' ? recycleAbility() : key === 'ignore' ? ignoreAbility() : key === 'replay' ? replayAbility() : growthAbility();
      mutate(value);
      expect(rules.loadAuthoringJson(archive({ [key]: value } as any)).report.some((entry) => entry.status === 'unsupported')).toBe(true);
    }
  });

  it('turns automatic empty-deck recycle into an owner-only keep choice, then gains one persistent counter and continues the draw', () => {
    const { state, draw } = setup();
    const discard = [1,2,3,4].map((i) => add(state, `fixture.basic.${i}`, 'p1', 'discard', `discard-${i}`));
    activate(state, draw, 'fixture.draw-one');
    expect(state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'automatic_recycle_keep_v1', counterKey: COUNTER, remainingDraws: 1 });
    expect(state.abilityRuntime!.pendingDecision?.candidates).toEqual(discard);
    choose(state, discard.slice(0,3));
    expect(state.cards.filter((c) => discard.slice(0,3).includes(c.instanceId)).every((c) => c.zone === 'discard')).toBe(true);
    expect(state.cards.find((c) => c.instanceId === discard[3])!.zone).toBe('hand');
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.[COUNTER]).toBe(1);
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
  });

  it('spends one counter in the advance phase and installs a current-round authoritative battle-loss ignore marker', () => {
    const { state, wisdom } = setup();
    state.abilityRuntime!.structuredPlayerFlagsByPlayer = { p1: { [COUNTER]: 2 } };
    state.round.activePhase = 'advance';
    activate(state, wisdom, 'fixture.ignore-loss');
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.[COUNTER]).toBe(1);
    expect(state.abilityRuntime!.battleLossIgnoreRoundByPlayer?.p1).toBe(state.round.roundNumber);
    state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.round.activePhase = 'battle';
    const first = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 1 }, { playerId: 'p2', totalPower: 5 },
    ] }).nextState;
    expect(first.battleResults.at(-1)!.lossEffectSuppressedPlayerIds).toContain('p1');
    first.round.roundNumber += 1;
    const second = rules.resolveBattlefield(first, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 1 }, { playerId: 'p2', totalPower: 5 },
    ] }).nextState;
    expect(second.battleResults.at(-1)!.lossEffectSuppressedPlayerIds ?? []).not.toContain('p1');
  });

  it('chooses X=2, plays up to five exact basic attacks from discard with normal costs, and returns only those cards to deck after battle', () => {
    const { state, replay } = setup();
    state.abilityRuntime!.structuredPlayerFlagsByPlayer = { p1: { [COUNTER]: 2 } };
    const ids = [1,2,3,4,5].map((i) => add(state, `fixture.basic.${i}`, 'p1', 'discard', `replay-${i}`));
    const beforeMana = state.players[0]!.mana;
    activate(state, replay, 'fixture.replay-discard');
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('counter_spend_choice_v1');
    choose(state, ['counter:2']);
    expect(state.abilityRuntime!.pendingDecision?.interaction).toMatchObject({ kind: 'discard_basic_replay_choice_v1', counterSpent: 2 });
    expect(state.abilityRuntime!.pendingDecision?.max).toBe(5);
    choose(state, ids);
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.[COUNTER]).toBe(0);
    expect(ids.every((id) => state.cards.find((c) => c.instanceId === id)!.zone === 'attack_area')).toBe(true);
    const expectedCost = ids.reduce((sum, _, i) => sum + ((i + 1) % 3), 0);
    expect(state.players[0]!.mana).toBe(beforeMana - expectedCost);
    expect(ids.every((id) => state.abilityRuntime!.cardState[id]!.returnToDeckAfterBattle?.round === state.round.roundNumber)).toBe(true);
    rules.processAbilityEvent(state, { id: 'fixture-battle-ended', type: 'after_battle_ended', playerId: 'p1' } as any);
    expect(ids.every((id) => state.cards.find((c) => c.instanceId === id)!.zone === 'deck')).toBe(true);
    expect(ids.every((id) => state.abilityRuntime!.cardState[id]!.returnToDeckAfterBattle === undefined)).toBe(true);
  });

  it('makes physical-card cost growth permanent per instance and uses the post-increment effective cost for the current-round top-three Power bonus', () => {
    const { state, growth } = setup();
    const top = [1,4,2].map((i, index) => add(state, `fixture.basic.${i}`, 'p1', 'deck', `top-${index}`));
    const beforeMana = state.players[0]!.mana;
    const play = rules.getLegalActions(state, 'p1').find((a) => a.type === 'play_card' && a.cardInstanceId === growth)!;
    expect(rules.dispatchAbilityCommand(state, 'p1', play).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(beforeMana - 2);
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[growth]).toBe(1);
    expect(rules.effectiveCardPlayCost(state, 'p1', growth)).toBe(3);
    expect(state.abilityRuntime!.cardState[growth]!.roundPowerBonus).toMatchObject({ amount: 3, round: state.round.roundNumber });
    expect(rules.calculateCardPower(state, growth).value).toBe(7);
    expect(top.every((id) => state.cards.find((c) => c.instanceId === id)!.zone === 'discard')).toBe(true);
    const growthSession = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1','p2'], restorePackKind: 'trusted_authoring_fixture' });
    growthSession.state = state; growthSession.logs = []; growthSession.replay = []; growthSession.replaySnapshots = []; growthSession.battleHistory = [];
    expect(() => rules.restoreMatchSession(growthSession.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).not.toThrow();
    state.round.roundNumber += 1; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
    state.cards.find((c) => c.instanceId === growth)!.zone = 'hand';
    state.abilityRuntime!.cardState[growth]!.active = false;
    state.abilityRuntime!.cardState[growth]!.faceDown = false;
    const mana2 = state.players[0]!.mana;
    const second = rules.getLegalActions(state, 'p1').find((a) => a.type === 'play_card' && a.cardInstanceId === growth)!;
    expect(rules.dispatchAbilityCommand(state, 'p1', second).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(mana2 - 3);
    expect(rules.effectiveCardPlayCost(state, 'p1', growth)).toBe(4);
  });

  it('keeps old automatic recycle behavior unchanged when no provider exists', () => {
    const { state, draw, wisdom } = setup();
    state.cards.find((c) => c.instanceId === wisdom)!.zone = 'removed_from_game';
    const id = add(state, 'fixture.basic.1', 'p1', 'discard', 'default-recycle');
    activate(state, draw, 'fixture.draw-one');
    expect(state.abilityRuntime!.pendingDecision).toBeUndefined();
    expect(state.cards.find((c) => c.instanceId === id)!.zone).toBe('hand');
    expect(state.abilityRuntime!.structuredPlayerFlagsByPlayer?.p1?.[COUNTER]).toBeUndefined();
  });

  it('round-trips live recycle and replay markers through trusted MatchSession restore and rejects forged pending candidates', () => {
    const recycleSetup = setup();
    const discard = [1,2,3,4].map((i) => add(recycleSetup.state, `fixture.basic.${i}`, 'p1', 'discard', `restore-discard-${i}`));
    activate(recycleSetup.state, recycleSetup.draw, 'fixture.draw-one');
    const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1','p2'], restorePackKind: 'trusted_authoring_fixture' });
    session.state = recycleSetup.state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
    const snapshot: any = JSON.parse(JSON.stringify(session.serializeSession()));
    const restored = rules.restoreMatchSession(snapshot, { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('automatic_recycle_keep_v1');
    const forged = structuredClone(snapshot);
    forged.state.abilityRuntime.pendingDecision.interaction.candidateIds = discard.slice(1);
    expect(() => rules.restoreMatchSession(forged, { restorePackKind: 'trusted_authoring_fixture' })).toThrow();

    const replaySetup = setup();
    replaySetup.state.abilityRuntime!.structuredPlayerFlagsByPlayer = { p1: { [COUNTER]: 1 } };
    const replayed = add(replaySetup.state, 'fixture.basic.1', 'p1', 'discard', 'restore-replayed');
    activate(replaySetup.state, replaySetup.replay, 'fixture.replay-discard'); choose(replaySetup.state, ['counter:0']); choose(replaySetup.state, [replayed]);
    const markedSession = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1','p2'], restorePackKind: 'trusted_authoring_fixture' });
    markedSession.state = replaySetup.state; markedSession.logs = []; markedSession.replay = []; markedSession.replaySnapshots = []; markedSession.battleHistory = [];
    expect(() => rules.restoreMatchSession(markedSession.serializeSession(), { restorePackKind: 'trusted_authoring_fixture' })).not.toThrow();
  });
  it('contains no production identity route for the owner-specific legacy package', () => {
    const production = [
      'packages/rules/src/ability/deck-recycle-replay-growth-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/core/combat-resolver.ts',
    ].map((path) => require('node:fs').readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.suzuka','sc-suzuka','铃鹿御前','core.suzuka-package','SkillLib']) expect(production).not.toContain(needle);
  });
});