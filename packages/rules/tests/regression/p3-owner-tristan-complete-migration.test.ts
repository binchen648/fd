import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as rules from '../../src/index';
import {
  isAcceptedDiscardShuffleSourceXAbility,
  isAcceptedDuplicateBasePowerCloseAbility,
} from '../../src/ability/battle-discard-binding-capability';
import { createSeededGameState } from '../../src/tools/seeded-state';
import type { GameState } from '../../src/schema/game';

const ARCHIVE = 'data/authoring/servants/servant.tristan.json';
const ROOT = 'servant.tristan';
const SC1 = `${ROOT}.skill.sc-tristan-1`;
const SC2 = `${ROOT}.skill.sc-tristan-2`;
const SC3 = `${ROOT}.skill.sc-tristan-3`;
const SC1_SHA = '778a206e13d82a0be79c92273404968006c7e1a393ce88212f876160a42487e3';
const SC2_SHA = 'f9746f59500104bdf2fe8c0db78dc60f514629e372e92c4ed82f211578264ade';
const SC3_SHA = '792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5';

const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function rawArchive(): any { return JSON.parse(readFileSync(ARCHIVE, 'utf8')); }
function pack() {
  const loaded = rules.loadAuthoringJson(rawArchive());
  expect(loaded.report).toEqual([]);
  return loaded;
}
function addDefinition(state: GameState, id: string, basePower: number, residual = false) {
  state.abilityRuntime!.pack.cards[id] = {
    id, name: id, cardType: 'basic_attack', cardFace: { attributes: ['力量'], cost: 0, basePower },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
    abilities: residual ? [{
      id: `${id}.residual`, kind: 'residual', printedClause: 'residual', activation: { trigger: 'while_active' },
      conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      execution: { mode: 'automatic', allowedOperations: [] },
    } as any] : [], mode: 'automatic', playKind: 'attack', destinationZone: 'attack_area',
  } as any;
}
function add(state: GameState, definitionId: string, owner: string, instanceId: string, zone = 'field', active = true) {
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function setup() {
  const loaded = pack();
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.servantCardId = ROOT;
  state.players[0]!.locationId = 'shinto';
  state.players[1]!.locationId = 'shinto';
  state.players[2]!.locationId = 'miyama_town';
  state.players[0]!.mana = 12;
  state.round.activePhase = 'battle';
  state.round.prioritySeat = 1;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20260930 });
  return { state, loaded };
}
function choose(state: GameState, selectedIds: string[]) {
  const d = state.abilityRuntime!.pendingDecision!;
  const out = rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: d.id, selectedIds });
  expect(out, JSON.stringify(out)).toMatchObject({ ok: true });
}

describe('P3 owner-complete Tristan migration', () => {
  it('materializes the exact frozen owner set, deck, F1 text/static metadata and accepted generic shapes', () => {
    const raw = rawArchive(); const loaded = pack();
    expect(raw).toMatchObject({ id: ROOT, name: '崔斯坦', class: 'Archer' });
    expect(raw.deck).toEqual([
      { cardId: 'card.cardb1', count: 2 }, { cardId: 'card.cardb2' }, { cardId: 'card.cardq1' },
      { cardId: 'card.cardq2', count: 2 }, { cardId: 'card.cardq3', count: 2 }, { cardId: 'card.cardq4' },
      { cardId: 'card.carda1' }, { cardId: 'card.cardsurveil' }, { cardId: 'card.cardpreparation' },
    ]);
    expect(raw.cards.map((card: any) => card.id)).toEqual([SC1, SC2, SC3]);
    expect(raw.cards.map((card: any) => sha(card.printedText))).toEqual([SC1_SHA, SC2_SHA, SC3_SHA]);
    expect(raw.cards.map((card: any) => [card.cardFace.typeLabel, card.cardFace.attributes, card.cardFace.cost, card.cardFace.basePower])).toEqual([
      ['迅捷/宝具', ['迅捷', '宝具'], 5, 7], ['魔术', ['魔术'], 2, 0], ['特殊', ['特殊'], 0, 6],
    ]);
    for (const id of [SC1, SC2, SC3]) expect(loaded.cards[id]!.playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 8 }]);
    expect(loaded.cards[SC1]!.abilities.some(isAcceptedDuplicateBasePowerCloseAbility)).toBe(true);
    expect(loaded.cards[SC2]!.abilities.some(isAcceptedDiscardShuffleSourceXAbility)).toBe(true);
    expect(loaded.cards[SC1]!.abilities.find((ability) => ability.id === 'sc-tristan-1.true-name-release')!.visibility).toMatchObject({ revealsTrueName: true, revealTiming: 'on_use_declared', revealScope: 'servant_package' });
    expect(loaded.cards[SC3]!.abilities.map((ability) => ability.id)).toEqual(['sc-tristan-3.independent-action', 'sc-tristan-3.penalty-on-defeat']);
    expect(raw.cards[1].phase3Evidence.referenceStaticMetadata.basePower).toBe('X');
    expect(raw.cards[1].phase3Evidence.runtimeBasePowerBinding).toMatchObject({ authoringSeed: 0, authority: expect.stringContaining('sourceBoundX') });
  });

  it('reveals Tristan when sc1 is normally played from the skill zone while preserving the 8-mana gate and printed cost', () => {
    const low = setup(); low.state.round.activePhase = 'action'; low.state.players[0]!.mana = 7;
    const lowId = add(low.state, SC1, 'p1', 'tristan-sc1-low', 'skill', false);
    expect(rules.getLegalActions(low.state, 'p1').some((entry) => entry.type === 'play_card' && entry.cardInstanceId === lowId)).toBe(false);
    const exact = setup(); exact.state.round.activePhase = 'action'; exact.state.players[0]!.mana = 8;
    const source = add(exact.state, SC1, 'p1', 'tristan-sc1-play', 'skill', false);
    const action = rules.getLegalActions(exact.state, 'p1').find((entry) => entry.type === 'play_card' && entry.cardInstanceId === source);
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(exact.state, 'p1', action!).ok).toBe(true);
    expect(exact.state.players[0]!.mana).toBe(3);
    expect(exact.state.abilityRuntime!.revealedServants).toContain('p1');
  });

  it('runs real sc1 duplicate-base-Power close while preserving source, residual and unique attacks', () => {
    const { state } = setup(); const source = add(state, SC1, 'p1', 'tristan-sc1');
    addDefinition(state, 'fixture.a', 4); addDefinition(state, 'fixture.b', 4); addDefinition(state, 'fixture.residual', 4, true); addDefinition(state, 'fixture.unique', 5);
    const a = add(state, 'fixture.a', 'p1', 'a', 'attack_area');
    const b = add(state, 'fixture.b', 'p2', 'b', 'attack_area');
    const residual = add(state, 'fixture.residual', 'p2', 'residual', 'attack_area');
    const unique = add(state, 'fixture.unique', 'p2', 'unique', 'attack_area');
    const action = rules.getLegalActions(state, 'p1').find((entry) => entry.type === 'activate_ability' && entry.cardInstanceId === source && entry.abilityId === 'sc-tristan-1.lament-resonance');
    expect(action).toBeDefined();
    expect(rules.dispatchAbilityCommand(state, 'p1', action!).ok).toBe(true);
    expect(state.abilityRuntime!.cardState[a]!.active).toBe(false);
    expect(state.abilityRuntime!.cardState[b]!.active).toBe(false);
    expect(state.abilityRuntime!.cardState[residual]!.active).toBe(true);
    expect(state.abilityRuntime!.cardState[unique]!.active).toBe(true);
    expect(state.abilityRuntime!.cardState[source]!.active).toBe(true);
  });

  it('runs real sc2 discard choice, X base-Power binding, and location-based battle upkeep with zero attacks', () => {
    const { state } = setup(); state.round.activePhase = 'action';
    const source = add(state, SC2, 'p1', 'tristan-sc2');
    addDefinition(state, 'fixture.d1', 1); addDefinition(state, 'fixture.d2', 2); addDefinition(state, 'fixture.d3', 3);
    const d1 = add(state, 'fixture.d1', 'p1', 'd1', 'discard', false);
    const d2 = add(state, 'fixture.d2', 'p1', 'd2', 'discard', false);
    add(state, 'fixture.d3', 'p1', 'd3', 'discard', false);
    rules.processAbilityEvent(state, { id: 'tristan-sc2-play', type: 'on_card_played', playerId: 'p1', sourceCardId: source });
    expect(state.abilityRuntime!.pendingDecision).toMatchObject({ controllerId: 'p1', min: 0, max: 3 });
    choose(state, [d1, d2]);
    expect(state.abilityRuntime!.cardState[source]!.sourceBoundX).toEqual({ value: 4, controllerId: 'p1', sourceAbilityId: 'sc-tristan-2.memory-fades' });
    expect(rules.calculateCardPower(state, source).value).toBe(4);
    expect(state.cards.find((card) => card.instanceId === d1)!.zone).toBe('deck');
    expect(state.cards.find((card) => card.instanceId === d2)!.zone).toBe('deck');
    state.round.activePhase = 'battle'; state.players[0]!.mana = 6;
    rules.resolveMandatoryCombatPhaseActionsForPlayer(state, 'p1');
    expect(state.players[0]!.mana).toBe(2);
    rules.resolveMandatoryCombatPhaseActionsForPlayer(state, 'p1');
    expect(state.players[0]!.mana).toBe(2);
  });

  it('wires Tristan into canonical playtest pack/generated library and keeps runtime identity-free', () => {
    const manifest = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(manifest.authoringServantFiles).toContain(ARCHIVE);
    const generated = readFileSync('data/generated/fd-playtest-v1.content-library.json', 'utf8');
    for (const id of [ROOT, SC1, SC2, SC3]) expect(generated).toContain(id);
    const production = [
      'packages/rules/src/ability/battle-discard-binding-capability.ts',
      'packages/rules/src/ability/card-instance-state.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/ability/types.ts',
      'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n');
    for (const needle of ['servant.tristan', 'sc-tristan', '崔斯坦', '痛哭幻奏', '高声颂爱', 'core.tristan-', 'SkillLib']) expect(production).not.toContain(needle);
  });
});