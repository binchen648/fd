import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const OWNER = 'servant.tezcat';
const SC1 = `${OWNER}.skill.sc-tezcat-1`;
const SC2 = `${OWNER}.skill.sc-tezcat-2`;
const SC3 = `${OWNER}.skill.sc-tezcat-3`;
const BASIC = 'fixture.tezcat.basic';

function archive() {
  return JSON.parse(readFileSync('data/authoring/servants/servant.tezcat.json', 'utf8'));
}
function basic() {
  return { id: BASIC, name: BASIC, cardType: 'basic_attack', printedText: 'fixture', cardFace: { typeLabel: '基础攻击', attributes: ['力量'], cost: 2, basePower: 2 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], verification: { implementationStatus: 'complete' } } as any;
}
function pack() {
  const loaded = rules.loadAuthoringJson(archive());
  (loaded.cards as any)[BASIC] = basic();
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone: string, active: boolean) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['attack_area', 'field'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack();
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.round.activePhase = 'action';
  state.round.prioritySeat = 1;
  state.players[0]!.servantCardId = OWNER;
  state.players[0]!.locationId = 'miyama_town';
  state.players[1]!.locationId = 'miyama_town';
  state.players[2]!.locationId = 'shinto';
  for (const player of state.players) { player.mana = 12; player.vp = 4; (player as any).commandSpells = 3; }
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  state.abilityRuntime!.playRulesVersion = 'explicit-v1';
  return { state, loaded };
}
function activate(state: GameState, playerId: string, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, playerId).find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined();
  const out = rules.dispatchAbilityCommand(state, playerId, action!);
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function choose(state: GameState, playerId: string, selectedIds: string[]) {
  const decision = state.abilityRuntime!.pendingDecision;
  expect(decision).toBeDefined();
  const out = rules.dispatchAbilityCommand(state, playerId, { type: 'choose_target', decisionId: decision!.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}

describe('P3 Tezcat owner-complete migration', () => {
  it('loads the exact three-card owner archive with final skill-zone thresholds and accepted generic shapes', () => {
    const loaded = rules.loadAuthoringJson(archive());
    expect(loaded.report).toEqual([]);
    expect(Object.keys(loaded.cards).sort()).toEqual([SC1, SC2, SC3].sort());
    expect(loaded.cards[SC1]!.cardFace).toMatchObject({ cost: 0, basePower: 3, attributes: ['力量'] });
    expect(loaded.cards[SC2]!.cardFace).toMatchObject({ cost: 2, basePower: 4, attributes: ['力量'] });
    expect(loaded.cards[SC3]!.cardFace).toMatchObject({ cost: 5, basePower: 5, attributes: ['宝具'] });
    for (const id of [SC1, SC2, SC3]) expect(loaded.cards[id]!.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
    expect(loaded.cards[SC1]!.abilities.some(rules.isAcceptedJointOtherAttackModifierAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedSameBattlefieldTurnOrderAttackAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedCardPlayCommandSealCostAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedDefeatAllEngagedOpponentsAbility)).toBe(true);
  });

  it('executes sc1 as additional-only and applies the accepted sibling cost/power modifier to real attacks', () => {
    const { state } = setup();
    const source = add(state, SC1, 'p1', 'tezcat-sc1', 'skill', false);
    add(state, BASIC, 'p1', 'tezcat-basic-a', 'hand', false);
    add(state, BASIC, 'p1', 'tezcat-basic-b', 'hand', false);
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: source }])).toThrow();
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: source }, { cardInstanceId: 'tezcat-basic-a' }, { cardInstanceId: 'tezcat-basic-b' }]);
    expect(state.players[0]!.mana).toBe(4);
    expect(state.abilityRuntime!.cardState[source]!.paidManaOnPlay).toBe(0);
    expect(state.abilityRuntime!.cardState['tezcat-basic-a']!.paidManaOnPlay).toBe(4);
    expect(state.abilityRuntime!.cardState['tezcat-basic-b']!.paidManaOnPlay).toBe(4);
    expect(rules.calculateCardPower(state, source).value).toBe(3);
    expect(rules.calculateCardPower(state, 'tezcat-basic-a').value).toBe(3);
    expect(rules.calculateCardPower(state, 'tezcat-basic-b').value).toBe(3);
  });

  it('executes sc2 through the accepted authenticated turn-order offer and settles only an actual losing participant', () => {
    const { state } = setup();
    const source = add(state, SC2, 'p1', 'tezcat-sc2', 'attack_area', true);
    add(state, BASIC, 'p1', 'tezcat-p1-basic', 'hand', false);
    add(state, BASIC, 'p2', 'tezcat-p2-basic', 'hand', false);
    state.players[1]!.mana = 8;
    state.players[0]!.vp = 1;
    state.players[1]!.vp = 5;
    activate(state, 'p1', source, 'sc-tezcat-2.battlefield-offer');
    choose(state, 'p1', []);
    choose(state, 'p2', ['tezcat-p2-basic']);
    expect(state.players[1]!.mana).toBe(6);
    expect(state.abilityRuntime!.battlefieldAttackOfferSettlements).toMatchObject([{ playedPlayerIds: ['p2'] }]);
    rules.processAbilityEvent(state, { id: 'tezcat-battle-result', type: 'after_battle_result_determined', battlefieldId: 'miyama_town',
      battleParticipantIds: ['p1', 'p2'], battleResult: { winners: ['p1'], loserIds: ['p2'] } } as any);
    expect(state.players[1]!.vp).toBe(3);
    expect(state.players[0]!.vp).toBe(3);
    expect(state.abilityRuntime!.battlefieldAttackOfferSettlements).toEqual([]);
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === 'sc-tezcat-2.battlefield-offer')).toBe(false);
  });

  it('executes sc3 with one ordinary Command Seal play cost, true-name reveal, per-game play lock, and Black Sun defeat', () => {
    const { state } = setup();
    const source = add(state, SC3, 'p1', 'tezcat-sc3', 'skill', false);
    (state.players[0] as any).commandSpells = 1;
    state.players[0]!.mana = 12;
    rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: source }]);
    expect((state.players[0] as any).commandSpells).toBe(0);
    expect(state.players[0]!.mana).toBe(7);
    expect(state.abilityRuntime!.normalCommandSealUseHistory ?? []).toEqual([]);
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    expect(state.abilityRuntime!.cardPlayCountByInstance?.[source]).toBe(1);

    state.round.activePhase = 'combat';
    state.players[2]!.locationId = 'miyama_town';
    state.abilityRuntime!.battleLossIgnoreRoundByPlayer = { p3: state.round.roundNumber };
    activate(state, 'p1', source, 'sc-tezcat-3.defeat-engaged');
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p2).toBe(state.round.roundNumber);
    expect(state.abilityRuntime!.battleDefeatRoundByPlayer?.p3).toBeUndefined();

    const physical = state.cards.find((entry) => entry.instanceId === source)!;
    physical.zone = 'skill';
    state.abilityRuntime!.cardState[source]!.active = false;
    (state.players[0] as any).commandSpells = 1;
    state.players[0]!.mana = 12;
    state.round.activePhase = 'action';
    expect(rules.getLegalActions(state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === source)).toBe(false);
  });

  it('keeps formal Tezcat consumer migration out of production identity routing', () => {
    const production = [
      'packages/rules/src/ability/joint-battlefield-attack-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/ability/types.ts',
      'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.tezcat', 'sc-tezcat', '泰兹卡特里波卡', '群豹之王', '战士之司', '第一太阳纪', 'core.tezcat-', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
