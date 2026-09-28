import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { MatchSession, restoreMatchSession } from '../../src/match-session';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.stheno.json';
const ROOT = 'servant.stheno';
const SC1 = `${ROOT}.skill.sc-stheno-1`;
const SC2 = `${ROOT}.skill.sc-stheno-2`;
const SC3 = `${ROOT}.skill.sc-stheno-3`;
const SC1_OBJECT_SHA = '201bbac3a5181d19d4d162936bcc0b5bc422a0aef341657bb2ac028a2aa97229';
const SC2_TEXT_SHA = 'edc8e5b95f81153ebace50f23ed1e9a1342bd380891b07b35f74c1948eaac702';
const SC3_TEXT_SHA = '1f24c0d49af558844049e6245e39fd4de29688afeae0bf3bf5808e855ff6e0fc';
const LUCK = 'formal.stheno.luck';
const P2_ATTACK = 'formal.stheno.p2-attack';
const P3_ATTACK = 'formal.stheno.p3-attack';
const P2_DRAW = 'formal.stheno.p2-draw';
const P3_DRAW = 'formal.stheno.p3-draw';
const DRAW_ACTION = 'formal.stheno.drawn-action';

const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function pack() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, zone: string, active = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field','attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function definition(id: string, cost: number, attributes: string[] = ['力量'], abilities: any[] = []) {
  return { id, name: id, cardType: 'basic_attack', cardFace: { typeLabel: '攻击', attributes, cost, basePower: cost || 1 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities, mode: 'automatic' } as any;
}
function actionAbility() {
  return { id: DRAW_ACTION, kind: 'phase_action', printedClause: DRAW_ACTION,
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' }, conditions: [], targets: [],
    effects: [{ type: 'adjust_mana', amount: 1 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] } } as any;
}
function setupSkillPlay(cardId: string, mana: number) {
  const loaded = pack();
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1; state.players[0]!.mana = mana;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260928 });
  const source = add(state, cardId, 'p1', 'skill', false);
  return { state, source };
}
function setupSc2() {
  const loaded = pack();
  const state = createSeededGameState({ activeSeats: [1,2,3] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1; state.players[0]!.mana = 8;
  for (const player of state.players) player.locationId = 'miyama_town';
  const loc = state.map.locations.find((entry) => entry.id === 'miyama_town')! as any;
  loc.rewardHooks = ['battle_rewards','competition_rewards','location_rewards'];
  loc.vpRewardRules = { battle: 2, competition: 3, location: 4 };
  state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: 'formal.stheno.event', victoryPoints: 2, visibility: { scope: 'public' } }];
  state.battleResults = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260928 });
  const source = add(state, SC2, 'p1', 'skill', false);
  const play = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === source);
  expect(play).toBeDefined(); expect(rules.dispatchAbilityCommand(state, 'p1', play!).ok).toBe(true);
  state.round.activePhase = 'battle';
  return { state, source };
}
function setupSc3() {
  const loaded = pack();
  loaded.cards[LUCK] = definition(LUCK, 0, ['幸运']);
  loaded.cards[P2_ATTACK] = definition(P2_ATTACK, 2);
  loaded.cards[P3_ATTACK] = definition(P3_ATTACK, 3);
  loaded.cards[P2_DRAW] = definition(P2_DRAW, 1, ['魔术'], [actionAbility()]);
  loaded.cards[P3_DRAW] = definition(P3_DRAW, 1);
  const state = createSeededGameState({ activeSeats: [1,2,3] });
  state.cards = []; state.round.activePhase = 'battle'; state.round.prioritySeat = 1;
  state.players[0]!.locationId = 'shinto'; state.players[1]!.locationId = 'shinto'; state.players[2]!.locationId = 'shinto';
  state.players[0]!.mana = 10; state.players[1]!.mana = 0; state.players[2]!.mana = 0;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260928 });
  const source = add(state, SC3, 'p1', 'field', true);
  const luck = add(state, LUCK, 'p1', 'hand');
  const p2Attack = add(state, P2_ATTACK, 'p2', 'attack_area', true);
  const p3Attack = add(state, P3_ATTACK, 'p3', 'attack_area', true);
  const p2Draw = add(state, P2_DRAW, 'p2', 'deck');
  const p3Draw = add(state, P3_DRAW, 'p3', 'deck');
  return { state, source, luck, p2Attack, p3Attack, p2Draw, p3Draw };
}
function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function sessionFor(state: GameState) {
  const session = new MatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1','p2','p3'], restorePackKind: 'trusted_authoring_fixture' }, false);
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 owner-complete Stheno migration', () => {
  it('materializes exactly sc1 + sc2 + sc3, preserves historical sc1, and binds sc2/sc3 only to accepted current seams', () => {
    const raw = rawArchive(); const loaded = pack();
    expect(raw).toMatchObject({ id: ROOT, name: '斯忒诺', class: 'Assassin' });
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(sha(JSON.stringify(raw.cards[0]))).toBe(SC1_OBJECT_SHA);
    expect(sha(raw.cards[1].printedText)).toBe(SC2_TEXT_SHA);
    expect(sha(raw.cards[2].printedText)).toBe(SC3_TEXT_SHA);
    expect(raw.cards.map((card: any) => [card.cardFace.typeLabel, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['迅捷',3,4], ['宝具',0,3], ['特殊',2,4],
    ]);
    expect(raw.cards.map((card: any) => card.playRequirements)).toEqual([
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
      [{ type: 'skill_zone_mana_at_least', value: 8 }],
    ]);
    const sc2 = loaded.cards[SC2]!; const sc3 = loaded.cards[SC3]!;
    expect(sc2.abilities.find((ability) => ability.id === 'true-name-release')!.visibility).toMatchObject({ revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' });
    expect(sc2.abilities.some(rules.isAcceptedFullRewardEachAbility)).toBe(true);
    expect(sc3.abilities.some(rules.isAcceptedBattleLuckCloseDrawPlayAbility)).toBe(true);
  });

  it('enforces final Rule 9.4 eight-mana skill-zone gate and pays each printed card cost', () => {
    for (const [cardId, printedCost] of [[SC2,0],[SC3,2]] as const) {
      const low = setupSkillPlay(cardId, 7);
      expect(rules.getLegalActions(low.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === low.source)).toBe(false);
      const exact = setupSkillPlay(cardId, 8);
      const action = rules.getLegalActions(exact.state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === exact.source);
      expect(action).toBeDefined();
      expect(rules.dispatchAbilityCommand(exact.state, 'p1', action!).ok).toBe(true);
      expect(exact.state.players[0]!.mana).toBe(8 - printedCost);
    }
  });

  it('runs real sc2 full-reward settlement and its separate +1 VP win trigger', () => {
    const { state } = setupSc2();
    const result = rules.resolveBattlefield(state, { battlefieldId: 'miyama_town', participants: [
      { playerId: 'p1', totalPower: 5 }, { playerId: 'p2', totalPower: 5 }, { playerId: 'p3', totalPower: 1 },
    ] }).nextState.battleResults.at(-1)!;
    expect(result.winnerPlayerIds).toEqual(['p1','p2']);
    expect(result.vpReward).toBe(2); expect(result.baseVpPerWinner).toBe(5);
    expect(result.vpAdjustments).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId:'p1', delta:3, source:'competition_vp' }),
      expect.objectContaining({ playerId:'p2', delta:3, source:'competition_vp' }),
      expect.objectContaining({ playerId:'p1', delta:4, source:'location_vp' }),
      expect.objectContaining({ playerId:'p2', delta:4, source:'location_vp' }),
    ]));
    const before = state.players[0]!.vp;
    rules.processAbilityEvent(state, { id:'formal-stheno-win', type:'after_controller_wins_battle', playerId:'p1' });
    expect(state.players[0]!.vp).toBe(before + 1);
    const snapshot = structuredClone(state);
    rules.processAbilityEvent(state, { id:'formal-stheno-win', type:'after_controller_wins_battle', playerId:'p1' });
    expect(state).toEqual(snapshot);
  });

  it('runs real sc3 Luck discard -> close/refund/draw -> turn-order exact drawn optional play with combat Action permission', () => {
    const b = setupSc3();
    const abilityId = 'sc-stheno-3.goddess-conceit';
    const legal = rules.getLegalActions(b.state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === b.source && entry.abilityId === abilityId);
    expect(legal).toBeDefined(); expect(rules.dispatchAbilityCommand(b.state, 'p1', legal!).ok).toBe(true);
    expect(b.state.cards.find((c) => c.instanceId === b.luck)!.zone).toBe('discard');
    expect(b.state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind:'battle_opponent_close_reward_choice_v1', opponentId:'p2' });
    choose(b.state, 'p1', [b.p2Attack]);
    expect(b.state.players[1]!.mana).toBe(2);
    expect(b.state.cards.find((c) => c.instanceId === b.p2Draw)!.zone).toBe('hand');
    expect(b.state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind:'battle_opponent_close_reward_choice_v1', opponentId:'p3' });
    choose(b.state, 'p1', []);
    expect(b.state.cards.find((c) => c.instanceId === b.p3Draw)!.zone).toBe('deck');
    expect(b.state.abilityRuntime!.pendingDecision!.interaction).toMatchObject({ kind:'battle_drawn_card_optional_play_v1', playerId:'p2', drawnCardId:b.p2Draw });
    choose(b.state, 'p2', [b.p2Draw]);
    expect(b.state.cards.find((c) => c.instanceId === b.p2Draw)!.zone).toBe('attack_area');
    expect(b.state.abilityRuntime!.cardState[b.p2Draw]!.actionAbilityAllowedInCombatRound).toBe(b.state.round.roundNumber);
    expect(b.state.abilityRuntime!.pendingBattleCloseDrawPlayTransaction).toBeUndefined();
    b.state.round.prioritySeat = 2;
    expect(rules.getLegalActions(b.state, 'p2').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === b.p2Draw && entry.abilityId === DRAW_ACTION)).toBe(true);
    expect(() => restoreMatchSession(sessionFor(b.state).serializeSession(), { restorePackKind:'trusted_authoring_fixture' })).not.toThrow();
  });

  it('keeps the formal owner archive isolated from identity-routed production runtime', () => {
    const changedRuntime = ['packages/rules/src/ability/interpreter.ts','packages/rules/src/ability/loader.ts','packages/rules/src/core/combat-resolver.ts']
      .map((path) => readFileSync(path,'utf8')).join('\n');
    expect(changedRuntime).not.toContain('servant.stheno');
    expect(changedRuntime).not.toContain('sc-stheno');
    expect(changedRuntime).not.toContain('斯忒诺');
    expect(changedRuntime).not.toContain('SkillLib');
  });
});
