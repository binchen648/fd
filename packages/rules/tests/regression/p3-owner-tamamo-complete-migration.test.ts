import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import { resolveExtendedEffect } from '../../src/ability/extended-effects';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.tamamo.json';
const ROOT = 'servant.tamamo';
const SC1 = `${ROOT}.skill.sc-tamamo-1`;
const SC2 = `${ROOT}.skill.sc-tamamo-2`;
const SC3 = `${ROOT}.skill.sc-tamamo-3`;
const LUCK = 'card.cardluck';
const PREP = 'card.cardpreparation';
const MAGIC = 'fixture.basic.magic';
const PLAIN = 'fixture.basic.plain';
const SEAL = 'servant.tamamo:sealed-attacks';
const TEXT_SHA = [
  'd87ffe12c2ac0153c0250b9d4a2b4fd6f659d3e0a3634056710264e9b58060c3',
  '3573158cd81ae003ae94af624137b48622313f41bc233ab24edd4c312acce6f2',
  '923260d5337a8d55a1b6b321bb53d2a5c269d2db94e342777310007072d5a221',
];

const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function basic(id: string, attributes: string[], cost: number, basePower: number) {
  return { id, name: id, cardType: 'basic_attack', printedText: id,
    cardFace: { typeLabel: '基础攻击', attributes, cost, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], verification: { implementationStatus: 'complete' } } as any;
}
function pack() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  (loaded.cards as any)[LUCK] = basic(LUCK, ['特殊'], 2, 1);
  (loaded.cards as any)[PREP] = basic(PREP, ['特殊'], 1, 1);
  (loaded.cards as any)[MAGIC] = basic(MAGIC, ['魔术'], 2, 5);
  (loaded.cards as any)[PLAIN] = basic(PLAIN, ['近战'], 1, 4);
  return loaded;
}
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone = 'attack_area', active = true) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area', 'sealed'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack();
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = []; state.round.activePhase = 'action'; state.round.prioritySeat = 1;
  state.players[0]!.mana = 20; state.players[1]!.mana = 20; state.players[2]!.mana = 20;
  state.players[0]!.locationId = 'miyama_town'; state.players[1]!.locationId = 'miyama_town'; state.players[2]!.locationId = 'shinto';
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260929 });
  return { state, loaded };
}
function activate(state: GameState, source: string, abilityId: string) {
  const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === abilityId);
  expect(action).toBeDefined();
  const out = rules.dispatchAbilityCommand(state, 'p1', action!);
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function resolvePending(state: GameState, selectedIds: string[]) {
  const pending = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, pending.controllerId, { type: 'choose_target', decisionId: pending.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}
function battleEnded(state: GameState, id: string) {
  rules.processAbilityEvent(state, { id, type: 'after_battle_ended', battlePhaseResolutionId: `phase-${id}` });
}
function sessionFor(state: GameState) {
  const session = rules.createMatchSession({ humanPlayerId: 'p1', humanPlayerIds: ['p1', 'p2', 'p3'], restorePackKind: 'trusted_authoring_fixture' });
  session.state = state; session.logs = []; session.replay = []; session.replaySnapshots = []; session.battleHistory = [];
  return session;
}

describe('P3 owner-complete Tamamo migration', () => {
  it('materializes all three frozen Tamamo skills with exact F1 text/static metadata and only accepted generic seams', () => {
    const raw = rawArchive(); const loaded = pack();
    expect(raw).toMatchObject({ id: ROOT, name: '玉藻前', class: 'Caster' });
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(raw.cards.map((card: any) => sha(card.printedText))).toEqual(TEXT_SHA);
    expect(raw.cards.map((card: any) => [card.cardFace.typeLabel, card.cardFace.attributes, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['魔术/宝具', ['魔术', '宝具'], 1, 1], ['魔术', ['魔术'], 0, 4], ['魔术', ['魔术'], 3, 6],
    ]);
    expect(raw.cards.map((card: any) => card.playRequirements)).toEqual([
      [{ type: 'skill_zone_mana_at_least', value: 8 }], [], [{ type: 'skill_zone_mana_at_least', value: 8 }],
    ]);
    expect(loaded.cards[SC1]!.abilities.some(rules.isAcceptedPlaySealedAttacksAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedRoundDefinitionAttributeReplacementAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(rules.isAcceptedAttackAttributeOtherPlayerProtectionAbility)).toBe(true);
    expect(loaded.cards[SC3]!.abilities.some(rules.isAcceptedAfterBattleSealAbility)).toBe(true);
  });

  it('enforces the final 8-mana skill-zone gate for sc1/sc3 while retaining sc2 legacy zero requirement', () => {
    for (const [cardId, printedCost] of [[SC1, 1], [SC3, 3]] as const) {
      const low = setup(); low.state.players[0]!.mana = 7; const lowId = add(low.state, cardId, 'p1', `${cardId}:low`, 'skill', false);
      expect(rules.getLegalActions(low.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === lowId)).toBe(false);
      const exact = setup(); exact.state.players[0]!.mana = 8; const id = add(exact.state, cardId, 'p1', `${cardId}:exact`, 'skill', false);
      const action = rules.getLegalActions(exact.state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === id);
      expect(action).toBeDefined(); expect(rules.dispatchAbilityCommand(exact.state, 'p1', action!).ok).toBe(true);
      expect(exact.state.players[0]!.mana).toBe(8 - printedCost);
    }
    const zero = setup(); zero.state.players[0]!.mana = 0; const sc2 = add(zero.state, SC2, 'p1', 'tamamo-sc2-zero', 'skill', false);
    expect(rules.getLegalActions(zero.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === sc2)).toBe(true);
  });

  it('runs real sc2 Weirding Hex and Magic protection through production Power reducers', () => {
    const { state } = setup();
    const sc2 = add(state, SC2, 'p1', 'tamamo-sc2', 'skill', false);
    const luck = add(state, LUCK, 'p1', 'tamamo-luck', 'hand', false);
    const prep = add(state, PREP, 'p1', 'tamamo-prep', 'hand', false);
    const magic = add(state, MAGIC, 'p1', 'tamamo-magic');
    const enemy = add(state, PLAIN, 'p2', 'tamamo-enemy-source');
    activate(state, sc2, 'sc-tamamo-2.weirding-hex');
    expect(rules.getEffectiveCardAttributes(state, luck)).toEqual(['魔术']);
    expect(rules.getEffectiveCardAttributes(state, prep)).toEqual(['魔术']);
    resolveExtendedEffect(state, 'p2', { type: 'reduce_opponents_power', amount: 3, condition: 'opponent_has_no_terrain', scope: 'same_battlefield' },
      { sourceCardId: enemy, abilityId: 'formal.enemy-reduce' });
    expect(rules.calculateCardPower(state, magic).value).toBe(5);
    const carrier = state.cards.find((entry) => entry.instanceId === magic) as any;
    carrier.powerModifiers = [{ id: 'self-reduce', sourceId: sc2, controllerId: 'p1', kind: 'add', value: -2, duration: 'round' }];
    expect(rules.calculateCardPower(state, magic).value).toBe(3);
  });

  it('runs real sc3 Transcendence after battle and seals a qualifying physical attack under the sc3 host', () => {
    const { state } = setup();
    const sc3 = add(state, SC3, 'p1', 'tamamo-sc3');
    const magic = add(state, MAGIC, 'p2', 'tamamo-opponent-magic');
    const luck = add(state, LUCK, 'p1', 'tamamo-controller-luck');
    state.round.activePhase = 'battle'; state.round.prioritySeat = 1;
    activate(state, sc3, 'sc-tamamo-3.transcendence');
    expect(state.abilityRuntime!.revealedServants).toContain('p1');
    battleEnded(state, 'tamamo-seal-one');
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('sealed_card_choice_v1');
    expect(new Set(state.abilityRuntime!.pendingDecision!.candidates)).toEqual(new Set([magic, luck]));
    resolvePending(state, [magic]);
    expect(state.cards.find((entry) => entry.instanceId === magic)).toMatchObject({ zone: 'sealed', ownerPlayerId: 'p2' });
    expect(state.abilityRuntime!.sealedCardBindings?.[magic]).toMatchObject({ sealKey: SEAL, controllerId: 'p1', hostSourceCardId: sc3, originalOwnerPlayerId: 'p2' });
  });

  it('runs real sc1 Cascade atomically, pays normal card cost, then resolves the post-battle reseal choice', () => {
    const { state } = setup();
    const sc1 = add(state, SC1, 'p1', 'tamamo-sc1');
    const sc3 = add(state, SC3, 'p1', 'tamamo-sc3');
    const magic = add(state, MAGIC, 'p2', 'tamamo-borrowed-magic');
    state.round.activePhase = 'battle'; state.round.prioritySeat = 1; activate(state, sc3, 'sc-tamamo-3.transcendence'); battleEnded(state, 'tamamo-auto-seal');
    expect(state.cards.find((entry) => entry.instanceId === magic)?.zone).toBe('sealed');
    const before = state.players[0]!.mana;
    state.round.activePhase = 'action'; state.round.prioritySeat = 1; activate(state, sc1, 'sc-tamamo-1.cascade');
    expect(state.players[0]!.mana).toBe(before - 2);
    expect(state.cards.find((entry) => entry.instanceId === magic)).toMatchObject({ zone: 'attack_area', ownerPlayerId: 'p2', controllerPlayerId: 'p1' });
    state.round.activePhase = 'battle'; battleEnded(state, 'tamamo-cascade-disposition');
    expect(state.abilityRuntime!.pendingDecision?.interaction?.kind).toBe('sealed_card_disposition_v1');
    const beforeReseal = state.players[0]!.mana; resolvePending(state, [magic]);
    expect(state.players[0]!.mana).toBe(beforeReseal - 1);
    expect(state.cards.find((entry) => entry.instanceId === magic)).toMatchObject({ zone: 'sealed', ownerPlayerId: 'p2', controllerPlayerId: 'p1' });
  });

  it('round-trips real Tamamo sealed provenance and keeps production runtime free of Tamamo identity routing', () => {
    const { state } = setup();
    const sc3 = add(state, SC3, 'p1', 'tamamo-sc3');
    const magic = add(state, MAGIC, 'p2', 'tamamo-restore-magic');
    state.round.activePhase = 'battle'; state.round.prioritySeat = 1; activate(state, sc3, 'sc-tamamo-3.transcendence'); battleEnded(state, 'tamamo-restore-seal');
    expect(state.cards.find((entry) => entry.instanceId === magic)?.zone).toBe('sealed');
    const restored = rules.restoreMatchSession(JSON.parse(JSON.stringify(sessionFor(state).serializeSession())), { restorePackKind: 'trusted_authoring_fixture' });
    expect(restored.state.abilityRuntime!.sealedCardBindings?.[magic]).toMatchObject({ sealKey: SEAL, hostSourceCardId: sc3, originalOwnerPlayerId: 'p2' });

    const production = ['packages/rules/src/ability/sealed-card-magic-capability.ts', 'packages/rules/src/ability/extended-effects.ts', 'packages/rules/src/ability/card-instance-state.ts',
      'packages/rules/src/ability/card-close-forbid.ts', 'packages/rules/src/ability/interpreter.ts', 'packages/rules/src/ability/loader.ts', 'packages/rules/src/match-session.ts']
      .map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.tamamo', 'sc-tamamo', '玉藻', '水天日光天照八野镇石', '荼枳尼天法', 'core.tamamo-cascade', 'core.tamamo-witchcraft', 'core.tamamo-transcendence', 'SkillLib']) expect(production).not.toContain(needle);
  });
});
