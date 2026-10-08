import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.goetia';
const S1 = ROOT + '.skill.s1';
const S2 = ROOT + '.skill.s2';
const ASC = ROOT + '.skill.ascension';
const STATE_KEY = 'goetia.linked-suite';
const PATH = 'data/authoring/masters/master.goetia.json';
const HELPERS = [
  'card.goetia.demon-god.baal',
  'card.goetia.demon-god.phenex',
  'card.goetia.demon-god.forneus',
  'card.goetia.demon-god.flauros',
  'card.goetia.demon-god.zepar',
  'card.goetia.demon-god.raum',
  'card.goetia.demon-god.barbatos',
] as const;

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;
const ability = (id: string, abilityId: string) =>
  card(id).abilities.find((entry) => entry.id === abilityId)!;

function add(state: GameState, definitionId: string, zone = 'skill', active = false): string {
  const instanceId = 'goetia-owner:' + definitionId.split('.').at(-1) + ':' + state.cards.length;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: zone === 'attack_area'
      ? { scope: 'public' }
      : { scope: 'owner_only', ownerPlayerId: 'p1' },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = {
    active,
    faceDown: false,
    playedRound: state.round.roundNumber,
  };
  return instanceId;
}

function setup(): GameState {
  for (const definition of Object.values(loaded.cards) as any[]) definition.ownerId = ROOT;
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  state.players[0]!.masterCardId = ROOT;
  state.players[0]!.mana = 6;
  state.players[0]!.vp = 1;
  state.players[0]!.locationId = 'recon';
  (state.players[0] as any).commandSpells = 3;
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261008 });
  add(state, S1);
  add(state, S2);
  add(state, ASC, 'removed_from_game');
  return state;
}

function helper(state: GameState, definitionId: string) {
  return state.cards.find((entry) => entry.definitionId === definitionId)!;
}

function choose(state: GameState, selectedIds: string[]) {
  const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', {
    type: 'choose_target',
    decisionId: decision.id,
    selectedIds,
  });
}

describe('P3 Goetia owner-complete migration', () => {
  it('materializes exact 3/3 frozen owner scope plus seven physical Demon Gods with locked static metadata', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('盖提亚');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });

    const frozen = raw.cards
      .filter((entry: any) => entry.id.startsWith(ROOT + '.skill.'))
      .map((entry: any) => entry.id);
    expect(new Set(frozen)).toEqual(new Set([S1, S2, ASC]));
    expect(raw.cards.filter((entry: any) => HELPERS.includes(entry.id))).toHaveLength(7);
    expect(Object.keys(loaded.cards)).toHaveLength(10);
    expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);

    expect(card(S1).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
    expect(card(S2).cardFace).toMatchObject({ typeLabel: '被动', cost: 0, basePower: 0 });
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
    expect(card(ASC).cardFace).toMatchObject({ typeLabel: '特殊', attributes: ['特殊'], cost: 13, basePower: 0 });
    expect(card(ASC).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 13 }]);

    const expected = new Map([
      [HELPERS[0], { cost: 13, basePower: 1, typeLabel: '', attributes: [] }],
      [HELPERS[1], { cost: 13, basePower: 1, typeLabel: '', attributes: [] }],
      [HELPERS[2], { cost: 5, basePower: 0, typeLabel: '力量', attributes: ['力量'] }],
      [HELPERS[3], { cost: 4, basePower: 0, typeLabel: '迅捷', attributes: ['迅捷'] }],
      [HELPERS[4], { cost: 6, basePower: 0, typeLabel: '魔术', attributes: ['魔术'] }],
      [HELPERS[5], { cost: 2, basePower: 0, typeLabel: '特殊', attributes: ['特殊'] }],
      [HELPERS[6], { cost: 3, basePower: 0, typeLabel: '', attributes: [] }],
    ]);
    for (const [id, face] of expected) {
      expect(card(id).cardType).toBe('basic_attack');
      expect(card(id).cardFace).toMatchObject(face);
      for (const entry of card(id).abilities) {
        if (entry.effects.some((effect) => effect.type === 'linked_auxiliary_suite')) {
          expect(rules.isAcceptedLinkedAuxiliarySuiteAbility(entry), entry.id).toBe(true);
        }
      }
    }
    for (const entry of card(S1).abilities) expect(rules.isAcceptedLinkedAuxiliarySuiteAbility(entry), entry.id).toBe(true);
    for (const entry of card(ASC).abilities.filter((candidate) =>
      candidate.effects.some((effect) => effect.type === 'linked_auxiliary_suite'))) {
      expect(rules.isAcceptedLinkedAuxiliarySuiteAbility(entry), entry.id).toBe(true);
    }
    expect(card(ASC).abilities.find((entry) => entry.id === 'goetia.ascension.residual')?.kind).toBe('residual');

    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    expect(pack.authoringMasterFiles.at(-1)).toBe(PATH);
  });

  it('runs real game-start setup and Phenex decision through production command dispatch', () => {
    const state = setup();
    rules.processAbilityEvent(state, { id: 'goetia-owner-game-start', type: 'game_start' });

    const suite = rules.linkedAuxiliarySuiteState(state, 'p1', STATE_KEY)!;
    expect(suite).toBeDefined();
    expect(suite.definitionIds).toEqual([...HELPERS]);
    expect(suite.cardInstanceIds).toHaveLength(7);
    expect((state.players[0] as any).commandSpells).toBe(0);
    for (const id of HELPERS) {
      const physical = helper(state, id);
      expect(physical).toMatchObject({
        ownerPlayerId: 'p1',
        controllerPlayerId: 'p1',
        zone: 'attack_area',
      });
      expect(state.abilityRuntime!.cardState[physical.instanceId]).toMatchObject({
        active: true,
        faceDown: false,
      });
    }

    const baal = helper(state, HELPERS[0]);
    const forneus = helper(state, HELPERS[2]);
    expect(rules.linkedAuxiliaryRequiresAdditionalPlay(state, forneus.instanceId)).toBe(true);
    expect(rules.linkedAuxiliaryPowerImmutable(state, baal.instanceId)).toBe(true);

    const phenex = helper(state, HELPERS[1]);
    const before = state.players[0]!.mana;
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability',
      cardInstanceId: phenex.instanceId,
      abilityId: 'goetia.phenex.remove-for-mana',
    }).ok).toBe(true);
    const decision = rules.projectAbilityState(state, 'p1').pendingDecision!;
    expect(decision.candidates).not.toContain(phenex.instanceId);
    expect(decision.candidates).toHaveLength(6);
    const removed = decision.candidates.find((id) => id !== baal.instanceId)!;
    expect(choose(state, [removed]).ok).toBe(true);
    expect(state.cards.find((entry) => entry.instanceId === removed)!.zone).toBe('removed_from_game');
    expect(state.players[0]!.mana).toBe(before + 6);
  });

  it('activates Barbatos exceptions and the ascension Temple through real runtime authority', () => {
    const state = setup();
    rules.processAbilityEvent(state, { id: 'goetia-owner-game-start-2', type: 'game_start' });

    const barbatos = helper(state, HELPERS[6]);
    expect(rules.linkedAuxiliarySealManaSubstitution(state, 'p1')).toBe(4);
    expect(rules.dispatchAbilityCommand(state, 'p1', {
      type: 'activate_ability',
      cardInstanceId: barbatos.instanceId,
      abilityId: 'goetia.barbatos.round-exceptions',
    }).ok).toBe(true);
    expect(rules.linkedAuxiliaryRoundPlayExceptionsActive(state, 'p1')).toBe(true);
    expect(helper(state, HELPERS[6]).zone).toBe('deck');

    const ascension = helper(state, ASC);
    rules.processAbilityEvent(state, {
      id: 'goetia-owner-ascension',
      type: 'after_master_ascension_unlocked',
      playerId: 'p1',
      sourceCardId: ascension.instanceId,
    });
    const liveAscension = helper(state, ASC);
    expect(liveAscension.zone).toBe('attack_area');
    expect(state.abilityRuntime!.cardState[liveAscension.instanceId]).toMatchObject({
      active: true,
      faceDown: false,
    });
    const suite = rules.linkedAuxiliarySuiteState(state, 'p1', STATE_KEY)!;
    expect(suite.ascensionActive).toBe(true);
    expect(suite.ascensionSourceCardId).toBe(liveAscension.instanceId);

    const forneus = helper(state, HELPERS[2]);
    expect(rules.calculateCardPower(state, forneus.instanceId).value).toBe(4);
    const baal = helper(state, HELPERS[0]);
    expect(rules.calculateCardPower(state, baal.instanceId).value).toBe(1);
    expect(card(ASC).abilities.some((entry) => entry.kind === 'residual' && entry.lifecycle.cleanup === undefined)).toBe(true);
  });

  it('honors battle-win upkeep skip, eliminates with no remaining active members, and rejects forged restore provenance', () => {
    const won = setup();
    rules.processAbilityEvent(won, { id: 'goetia-owner-game-start-3', type: 'game_start' });
    const before = rules.linkedAuxiliarySuiteState(won, 'p1', STATE_KEY)!.cardInstanceIds
      .filter((id) => won.cards.find((entry) => entry.instanceId === id)!.zone === 'attack_area').length;
    rules.processAbilityEvent(won, {
      id: 'goetia-owner-win',
      type: 'after_controller_wins_battle',
      playerId: 'p1',
    });
    rules.processAbilityEvent(won, { id: 'goetia-owner-round-end', type: 'round_end' });
    const after = rules.linkedAuxiliarySuiteState(won, 'p1', STATE_KEY)!.cardInstanceIds
      .filter((id) => won.cards.find((entry) => entry.instanceId === id)!.zone === 'attack_area').length;
    expect(after).toBe(before);

    const empty = setup();
    rules.processAbilityEvent(empty, { id: 'goetia-owner-game-start-4', type: 'game_start' });
    const suite = rules.linkedAuxiliarySuiteState(empty, 'p1', STATE_KEY)!;
    for (const id of suite.cardInstanceIds) {
      empty.cards.find((entry) => entry.instanceId === id)!.zone = 'removed_from_game';
      empty.abilityRuntime!.cardState[id]!.active = false;
    }
    rules.processAbilityEvent(empty, { id: 'goetia-owner-round-end-empty', type: 'round_end' });
    expect(empty.players[0]!.status).toBe('eliminated');

    const valid = setup();
    rules.processAbilityEvent(valid, { id: 'goetia-owner-game-start-5', type: 'game_start' });
    expect(rules.isLinkedAuxiliarySuiteRuntimeProvenanceValidForRestore(structuredClone(valid))).toBe(true);
    const forged = structuredClone(valid);
    forged.abilityRuntime!.linkedAuxiliarySuites!['p1:' + STATE_KEY]!.definitionIds.push('forged.definition');
    expect(rules.isLinkedAuxiliarySuiteRuntimeProvenanceValidForRestore(forged)).toBe(false);
  });

  it('keeps production runtime identity-free for Goetia consumers', () => {
    const production = [
      'packages/rules/src/ability/linked-auxiliary-suite-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/match-session.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n').toLowerCase();

    for (const needle of [
      'master.goetia', '盖提亚', '冠位时间神殿', '集体意识', '魔神柱',
      'card.goetia.demon-god', 'core.goetia-',
    ]) {
      expect(production).not.toContain(needle.toLowerCase());
    }
  });
});
