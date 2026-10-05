import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.caules';
const S1 = `${ROOT}.skill.s1`;
const S1A = `${ROOT}.skill.s1a`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const ASC = `${ROOT}.skill.ascension`;
const IDS = [ASC, S1, S1A, S2, S3];
const PATH = 'data/authoring/masters/master.caules.json';
const SERVANT = 'servant.fixture-caules-unlock';
const UNLOCK = `${SERVANT}.skill.unlock`;
const BASIC = 'fixture.caules.basic';

const raw = JSON.parse(readFileSync(PATH, 'utf8'));
const loaded = rules.loadAuthoringJson(raw);
const card = (id: string) => loaded.cards[id]!;
const effectTypes = (id: string) => card(id).abilities.flatMap((ability) => ability.effects.map((effect) => effect.type));

function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill', active = false, faceDown = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({
    instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field', 'attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner },
  } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
  return instanceId;
}

function installActionDefinition(state: GameState, id: string, cardType: string, attributes: string[], power = 1) {
  const template = structuredClone(state.abilityRuntime!.pack.cards[S3]!) as any;
  template.id = id;
  template.name = id;
  template.cardType = cardType;
  template.ownerId = 'fixture.owner';
  template.initialPlacement = undefined;
  template.cardFace = { attributes, cost: 0, basePower: power };
  template.playRequirements = [];
  template.abilities = [{
    id: `${id}.action`, kind: 'phase_action', printedClause: id,
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [], targets: [], effects: [{ type: 'adjust_mana', amount: 0 }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  }];
  template.playKind = cardType === 'command_spell' ? 'support' : 'attack';
  template.destinationZone = cardType === 'command_spell' ? 'field' : 'attack_area';
  state.abilityRuntime!.pack.cards[id] = template;
}

function installUnlockDefinition(state: GameState) {
  const template = structuredClone(state.abilityRuntime!.pack.cards[S1]!) as any;
  template.id = UNLOCK;
  template.name = UNLOCK;
  template.cardType = 'servant_skill';
  template.ownerId = SERVANT;
  template.initialPlacement = undefined;
  template.cardFace = { attributes: [], cost: 0, basePower: 0 };
  template.playRequirements = [];
  template.abilities = [{
    id: 'fixture.caules.unlock', kind: 'phase_action', printedClause: 'unlock',
    activation: { phase: 'action', opens: 'controller_action_window' },
    conditions: [], targets: [], effects: [{ type: 'unlock_controller_master_ascension' }], cost: [], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  }];
  template.playKind = 'support';
  template.destinationZone = 'skill';
  state.abilityRuntime!.pack.cards[UNLOCK] = template;
}

function setup() {
  expect(loaded.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2, 3] });
  state.cards = [];
  rules.initializeAbilityRuntime(state, loaded, { seed: 20261006 });
  const [p1, p2, p3] = state.players;
  p1!.masterCardId = ROOT;
  p1!.mana = 10;
  p1!.vp = 4;
  p1!.locationId = 'magic_workshop';
  p2!.mana = 10;
  p2!.locationId = 'magic_workshop';
  p3!.mana = 10;
  p3!.locationId = 'miyama_town';
  state.round.roundNumber = 2;
  state.round.prioritySeat = p1!.seat;
  state.round.activePhase = 'advance';
  const ids = { s1: add(state, S1), s1a: add(state, S1A), s2: add(state, S2) };
  rules.processAbilityEvent(state, { id: 'caules-formal-game-start', type: 'game_start', playerId: 'p1' });
  return { state, ids };
}

function activate(state: GameState, cardInstanceId: string, abilityId: string) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId, abilityId });
}

function resolveChoice(state: GameState, selectedId: string) {
  const pending = rules.projectAbilityState(state, 'p1').pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [selectedId] });
}

describe('P3 Caules owner-complete migration', () => {
  it('materializes exactly the frozen five-identity owner scope with frozen static metadata', () => {
    expect(raw.id).toBe(ROOT);
    expect(raw.name).toBe('\u8003\u5217\u65af\u00b7\u5f17\u5c14\u7ef4\u5409');
    expect(raw.publicInformation).toEqual({ type: 'master_package', initialMana: 4 });
    expect(raw.cards.map((entry: any) => entry.id).sort()).toEqual([...IDS].sort());
    expect(Object.keys(loaded.cards).sort()).toEqual([...IDS].sort());
    expect(card(S3).cardFace).toMatchObject({ typeLabel: '\u9b54\u672f', attributes: ['\u9b54\u672f'], cost: 3, basePower: 6 });
    expect(card(S3).playRequirements).toEqual([{ type: 'skill_zone_mana_at_least', value: 3 }]);
    expect(raw.cards.find((entry: any) => entry.id === S3).initialPlacement).toBe('outside_game');
    expect(raw.cards.find((entry: any) => entry.id === ASC).initialPlacement).toBe('outside_game');
  });

  it('preserves the already-credited FM08 s1a contract without changing its semantics', () => {
    const preserved = raw.cards.find((entry: any) => entry.id === S1A);
    expect(preserved).toMatchObject({
      id: S1A,
      name: '\u8d44\u8d28\u5e73\u5eb8',
      printedText: '\u4f60\u6bcf\u6b21\u4ece\u975e\u9ad8\u6f6e\u5c40\u52bf\u724c\u83b7\u5f97\u9b54\u529b\u6700\u591a\u4e3a1\u70b9\u3002',
      phase3Evidence: { acceptedContracts: { gameStartRuleOverrides: 'P3-R39/FB2-14' } },
    });
    expect(preserved.abilities).toHaveLength(1);
    expect(preserved.abilities[0].effects).toEqual([{ type: 'install_rule_override', player: 'controller', rule: 'non_climax_situation_mana_gain_cap', value: 1 }]);
  });

  it('consumes only the accepted identity-free Battery/variant readiness family for the four newly migrated identities', () => {
    expect(effectTypes(S1)).toEqual(['definition_variant_battery_access_rule']);
    expect(effectTypes(S2)).toEqual([
      'definition_variant_battery_recharge',
      'definition_variant_battery_ignore_defeat_round',
      'definition_variant_battery_overload',
    ]);
    expect(effectTypes(S3)).toEqual(['definition_variant_activation_lock']);
    expect(effectTypes(ASC)).toEqual(['definition_variant_ascension_stock']);
    const special = card(S3).abilities[0]!.effects[0]!.variants.find((entry: any) => entry.id === 'special');
    const typeless = card(S3).abilities[0]!.effects[0]!.variants.find((entry: any) => entry.id === 'typeless');
    expect(special).toMatchObject({ attribute: '\u7279\u6b8a', excludeDefinitionIds: ['basic.luck'] });
    expect(typeless).toMatchObject({ attribute: '\u65e0\u5c5e\u6027', excludeCardTypes: ['command_spell'] });
  });

  it('integrates Caules exactly once after Caules Yggdmillennia in the canonical playtest master sequence', () => {
    const pack = JSON.parse(readFileSync('data/packs/fd-playtest-v1/pack.json', 'utf8'));
    expect(pack.authoringMasterFiles.filter((entry: string) => entry === PATH)).toHaveLength(1);
    const index = pack.authoringMasterFiles.indexOf(PATH);
    expect(pack.authoringMasterFiles[index - 1]).toBe('data/authoring/masters/master.caules-yggdmillennia.json');
  });

  it('runs canonical Battery recharge and enforces the shared one-branch-per-round gate', () => {
    const { state, ids } = setup();
    state.players[0]!.mana = 2;
    expect(activate(state, ids.s2, 'caules.s2.recharge').ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').pendingDecision?.candidates).toEqual(['vp:0', 'vp:1', 'vp:2', 'vp:3', 'vp:4']);
    expect(resolveChoice(state, 'vp:2').ok).toBe(true);
    expect(state.players[0]).toMatchObject({ vp: 2, mana: 7 });
    expect(activate(state, ids.s2, 'caules.s2.overhaul').ok).toBe(false);
    state.round.roundNumber = 3;
    expect(activate(state, ids.s2, 'caules.s2.overhaul').ok).toBe(true);
    expect(state.abilityRuntime!.battleLossIgnoreRoundByPlayer!.p1).toBe(3);
  });

  it('creates one hidden canonical Thunder variant and applies its same-location attribute lock after play', () => {
    const { state, ids } = setup();
    state.round.activePhase = 'battle';
    expect(activate(state, ids.s2, 'caules.s2.overload').ok).toBe(true);
    expect(resolveChoice(state, 'strength').ok).toBe(true);
    const treeId = Object.keys(state.abilityRuntime!.definitionSkillVariants!)[0]!;
    expect(state.abilityRuntime!.definitionSkillVariants![treeId]).toMatchObject({ definitionId: S3, variantId: 'strength', attribute: '\u529b\u91cf' });
    expect(state.abilityRuntime!.cardState[treeId]).toMatchObject({ active: false, faceDown: true });
    expect(rules.projectAbilityState(state, 'p1').cards.find((entry) => entry.instanceId === treeId)?.definitionVariantId).toBe('strength');
    expect(rules.projectAbilityState(state, 'p2').cards.some((entry) => entry.instanceId === treeId)).toBe(false);

    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    state.players[0]!.mana = 10;
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: treeId }])).not.toThrow();
    installActionDefinition(state, 'fixture.caules.strength', 'basic_attack', ['\u529b\u91cf'], 3);
    installActionDefinition(state, 'fixture.caules.magic', 'basic_attack', ['\u9b54\u672f'], 3);
    const strength = add(state, 'fixture.caules.strength', 'p2', 'skill');
    const magic = add(state, 'fixture.caules.magic', 'p2', 'skill');
    expect(rules.definitionVariantAbilityActivationBlocked(state, strength)).toBe(true);
    expect(rules.definitionVariantAbilityActivationBlocked(state, magic)).toBe(false);
  });

  it('unlocks the canonical Caules ascension through the accepted generic master-ascension path and stocks all five variants', () => {
    const { state, ids } = setup();
    installUnlockDefinition(state);
    (state.abilityRuntime!.pack.cards[ASC] as any).ownerId = ROOT;
    (state.abilityRuntime!.pack.cards[UNLOCK] as any).ownerId = SERVANT;
    state.players[0]!.servantCardId = SERVANT;
    state.round.activePhase = 'action';
    state.round.prioritySeat = state.players[0]!.seat;
    const unlock = add(state, UNLOCK);
    expect(activate(state, unlock, 'fixture.caules.unlock').ok).toBe(true);
    const ascension = state.cards.find((entry) => entry.definitionId === ASC)!;
    expect(ascension).toMatchObject({ ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', generatedBy: unlock });
    expect(Object.values(state.abilityRuntime!.definitionSkillVariants!)).toHaveLength(5);
    expect(Object.values(state.abilityRuntime!.definitionSkillVariants!).map((entry) => entry.variantId).sort()).toEqual(['agility', 'magic', 'special', 'strength', 'typeless']);
    expect(Object.keys(state.abilityRuntime!.definitionSkillVariants!).every((id) => state.abilityRuntime!.cardState[id]!.faceDown === false)).toBe(true);

    state.round.activePhase = 'battle';
    expect(activate(state, ids.s2, 'caules.s2.overload').ok).toBe(false);
    state.round.activePhase = 'advance';
    state.players[0]!.mana = 10;
    expect(activate(state, ids.s2, 'caules.s2.overhaul').ok).toBe(true);
    installActionDefinition(state, 'fixture.caules.magic-attack', 'basic_attack', ['\u9b54\u672f'], 5);
    installActionDefinition(state, 'fixture.caules.strength-attack', 'basic_attack', ['\u529b\u91cf'], 5);
    const magic = add(state, 'fixture.caules.magic-attack', 'p1', 'attack_area', true);
    const strength = add(state, 'fixture.caules.strength-attack', 'p1', 'attack_area', true);
    expect(rules.calculateCardPower(state, magic).value).toBe(7);
    expect(rules.calculateCardPower(state, strength).value).toBe(5);
    state.round.roundNumber = 3;
    expect(rules.calculateCardPower(state, magic).value).toBe(5);
  });

  it('keeps the formal authoring delta bounded to four newly creditable identities and identity-free runtime authority', () => {
    const production = [
      'packages/rules/src/ability/definition-variant-battery-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/ability/executable-card-pack.ts',
    ].map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.caules', '\u8003\u5217\u65af', '\u5df4\u683c\u8fbe\u7535\u6c60', '\u7ede\u9996\u5211\u4e4b\u96f7', 'core.caules-forvedge']) {
      expect(production).not.toContain(needle.toLowerCase());
    }
    expect(IDS.filter((id) => id !== S1A)).toHaveLength(4);
  });
});