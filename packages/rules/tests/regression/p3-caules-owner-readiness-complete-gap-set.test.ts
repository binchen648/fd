import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const ROOT = 'master.fixture-definition-variant-battery';
const S1 = `${ROOT}.skill.s1`;
const S2 = `${ROOT}.skill.s2`;
const S3 = `${ROOT}.skill.s3`;
const ASC = `${ROOT}.skill.ascension`;
const SHARED = 'fixture.battery.shared';
const VARIANTS = [
  { id: 'strength', attribute: '力量', excludeDefinitionIds: [], excludeCardTypes: [] },
  { id: 'agility', attribute: '迅捷', excludeDefinitionIds: [], excludeCardTypes: [] },
  { id: 'magic', attribute: '魔术', excludeDefinitionIds: [], excludeCardTypes: [] },
  { id: 'special', attribute: '特殊', excludeDefinitionIds: ['basic.luck'], excludeCardTypes: [] },
  { id: 'typeless', attribute: '无属性', excludeDefinitionIds: [], excludeCardTypes: ['command_spell'] },
] as const;

function base(id: string, kind = 'passive'): AuthoringAbility {
  return {
    id, kind, printedClause: id, activation: {}, conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [],
    lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' }, limit: {}, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}
function passive(id: string, effect: any): AuthoringAbility {
  const ability = base(id); ability.activation = { trigger: 'while_active' }; ability.effects = [effect]; return ability;
}
function action(id: string, phase: string, effect: any, targets: any[] = []): AuthoringAbility {
  const ability = base(id, 'phase_action'); ability.activation = { phase, opens: phase === 'combat' ? 'controller_combat_action_window' : 'controller_action_window' };
  ability.effects = [effect]; ability.targets = targets; return ability;
}
function forced(id: string, trigger: string, effect: any): AuthoringAbility {
  const ability = base(id, 'forced_trigger'); ability.activation = { trigger }; ability.effects = [effect]; return ability;
}
function card(id: string, abilities: AuthoringAbility[], extra: any = {}) {
  return {
    id, name: id, cardType: 'master_skill', owner: { type: 'master', id: ROOT },
    cardFace: { typeLabel: '被动', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
    verification: { implementationStatus: 'complete' }, ...extra,
  };
}
function choice(id: string, options: string[]) {
  return { id, type: 'choice', options: options.map((value) => ({ id: value, label: value })), count: { min: 1, max: 1 } };
}
function commonBattery(extra: Record<string, unknown>) {
  return {
    workshopLocationId: 'magic_workshop', sharedUsageKey: SHARED, accessProviderDefinitionId: S1,
    enhancedProviderDefinitionId: ASC, enhancedAttribute: '魔术', enhancedPowerBonus: 2, ...extra,
  };
}
function archive() {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: ROOT,
    cards: [
      card(S1, [passive('fixture.battery.access', {
        type: 'definition_variant_battery_access_rule', batteryDefinitionId: S2, workshopLocationId: 'magic_workshop', sharedUsageKey: SHARED,
      })]),
      card(S2, [
        action('fixture.battery.recharge', 'advance', {
          type: 'definition_variant_battery_recharge', ...commonBattery({ vpTargetId: 'vp_spend', manaBase: 1, manaPerVp: 2 }),
        }, [choice('vp_spend', ['dynamic'])]),
        action('fixture.battery.overheal', 'advance', {
          type: 'definition_variant_battery_ignore_defeat_round', ...commonBattery({ manaCost: 2 }),
        }),
        action('fixture.battery.overload', 'combat', {
          type: 'definition_variant_battery_overload', ...commonBattery({ variantDefinitionId: S3, variantTargetId: 'definition_variant', variants: VARIANTS }),
        }, [choice('definition_variant', VARIANTS.map((entry) => entry.id))]),
      ]),
      card(S3, [passive('fixture.tree.lock', { type: 'definition_variant_activation_lock', variants: VARIANTS })], {
        initialPlacement: 'outside_game', cardFace: { typeLabel: '魔术', attributes: ['魔术'], cost: 3, basePower: 6 },
        playRequirements: [{ type: 'skill_zone_mana_at_least', value: 3 }],
      }),
      card(ASC, [forced('fixture.asc.stock', 'after_master_ascension_unlocked', {
        type: 'definition_variant_ascension_stock', variantDefinitionId: S3, variants: VARIANTS,
      })], { initialPlacement: 'outside_game' }),
    ],
  } as any;
}

function add(state: GameState, definitionId: string, owner = 'p1', zone = 'skill', active = false, faceDown = false) {
  const instanceId = `${definitionId}:${owner}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId: owner, controllerPlayerId: owner, zone,
    visibility: ['field','attack_area'].includes(zone) ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: owner } } as any);
  state.abilityRuntime!.cardState[instanceId] = { active, faceDown, playedRound: state.round.roundNumber };
  return instanceId;
}
function installActionDefinition(state: GameState, id: string, cardType: string, attributes: string[], power = 1) {
  const template = structuredClone(state.abilityRuntime!.pack.cards[S3]!) as any;
  template.id = id; template.name = id; template.cardType = cardType; template.cardFace = { attributes, cost: 0, basePower: power };
  template.playRequirements = [];
  template.abilities = [action(`${id}.action`, 'action', { type: 'adjust_mana', amount: 0 })];
  template.playKind = cardType === 'command_spell' ? 'support' : 'attack'; template.destinationZone = cardType === 'command_spell' ? 'field' : 'attack_area';
  state.abilityRuntime!.pack.cards[id] = template;
}
function setup() {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1,2,3] }); state.cards = [];
  rules.initializeAbilityRuntime(state, pack, { seed: 20261006 });
  const [p1,p2,p3] = state.players;
  p1!.masterCardId = ROOT; p1!.mana = 10; p1!.vp = 4; p1!.locationId = 'magic_workshop';
  p2!.mana = 10; p2!.vp = 0; p2!.locationId = 'magic_workshop';
  p3!.mana = 10; p3!.vp = 0; p3!.locationId = 'miyama_town';
  state.round.roundNumber = 2; state.round.prioritySeat = p1!.seat; state.round.activePhase = 'advance';
  const s1 = add(state, S1); const s2 = add(state, S2); const asc = add(state, ASC, 'p1', 'outside_game');
  return { state, s1, s2, asc };
}
function activate(state: GameState, cardInstanceId: string, abilityId: string) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId, abilityId });
}
function resolveChoice(state: GameState, selectedId: string) {
  const pending = rules.projectAbilityState(state, 'p1').pendingDecision!;
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'choose_target', decisionId: pending.id, selectedIds: [selectedId] });
}

describe('P3 Caules owner-readiness complete identity-free gap set', () => {
  it('accepts only the exact privileged semantic shapes and fails closed on widening', () => {
    expect(rules.loadAuthoringJson(archive()).report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
    const bad = archive();
    bad.cards.find((entry: any) => entry.id === S2).abilities[0].effects[0].manaPerVp = 3;
    const loaded = rules.loadAuthoringJson(bad);
    expect(loaded.cards[S2]!.abilities.find((ability) => ability.id === 'fixture.battery.recharge')!.execution.mode).toBe('unsupported');
    expect(loaded.report.some((entry) => entry.reason.includes('Definition variant/battery'))).toBe(true);
  });

  it('keeps the accepted FM08 preservation identity isolated from this zero-credit runtime capability', () => {
    const existing = JSON.parse(readFileSync('data/authoring/masters/master.caules.json', 'utf8'));
    const preserved = existing.cards.find((entry: any) => entry.id === 'master.caules.skill.s1a');
    expect(preserved).toBeDefined();
    expect(preserved.phase3Evidence.sourceTextSha256).toBe('16dc09cc37b8a95665d4fb5301e6048b0be422af19b9836d3fff07d9ef7e3c32');
    expect(preserved.abilities[0].effects[0]).toMatchObject({ type: 'install_rule_override', rule: 'non_climax_situation_mana_gain_cap', value: 1 });
  });

  it('requires the live access provider and workshop, exposes exact VP-spend candidates, and resolves 2X+1 mana', () => {
    const { state, s1, s2 } = setup();
    state.players[0]!.mana = 2;
    let result = activate(state, s2, 'fixture.battery.recharge');
    expect(result.ok).toBe(true);
    expect(result.view.pendingDecision?.candidates).toEqual(['vp:0','vp:1','vp:2','vp:3','vp:4']);
    expect(resolveChoice(state, 'vp:3').ok).toBe(true);
    expect(state.players[0]).toMatchObject({ vp: 1, mana: 9 });
    state.round.roundNumber = 3; state.players[0]!.locationId = 'miyama_town';
    expect(activate(state, s2, 'fixture.battery.recharge').ok).toBe(false);
    state.players[0]!.locationId = 'magic_workshop'; state.cards.find((entry) => entry.instanceId === s1)!.zone = 'removed_from_game';
    expect(activate(state, s2, 'fixture.battery.recharge').ok).toBe(false);
  });

  it('shares one battery use per round across recharge, overhaul, and overload', () => {
    const { state, s2 } = setup();
    expect(activate(state, s2, 'fixture.battery.overheal').ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(state.abilityRuntime!.battleLossIgnoreRoundByPlayer!.p1).toBe(2);
    expect(activate(state, s2, 'fixture.battery.recharge').ok).toBe(false);
    state.round.activePhase = 'battle';
    expect(activate(state, s2, 'fixture.battery.overload').ok).toBe(false);
    state.round.roundNumber = 3;
    expect(activate(state, s2, 'fixture.battery.overload').ok).toBe(true);
  });

  it('creates a selected overload variant face-down, owner-visible only, and never offers that variant again', () => {
    const { state, s2 } = setup(); state.round.activePhase = 'battle';
    expect(activate(state, s2, 'fixture.battery.overload').ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').pendingDecision?.candidates).toEqual(VARIANTS.map((entry) => entry.id));
    expect(resolveChoice(state, 'strength').ok).toBe(true);
    const record = Object.entries(state.abilityRuntime!.definitionSkillVariants!)[0]!;
    const instance = state.cards.find((entry) => entry.instanceId === record[0])!;
    expect(record[1]).toMatchObject({ definitionId: S3, variantId: 'strength', attribute: '力量' });
    expect(rules.getEffectiveCardAttributes(state, instance.instanceId)).toEqual(['力量']);
    expect(state.abilityRuntime!.cardState[instance.instanceId]).toMatchObject({ active: false, faceDown: true });
    expect(rules.projectAbilityState(state, 'p1').cards.find((entry) => entry.definitionId === S3)?.definitionVariantId).toBe('strength');
    expect(rules.projectAbilityState(state, 'p2').cards.some((entry) => entry.definitionId === S3 || entry.definitionVariantId === 'strength')).toBe(false);
    state.round.roundNumber = 3;
    expect(activate(state, s2, 'fixture.battery.overload').ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').pendingDecision?.candidates).not.toContain('strength');
  });

  it('classifies the variant skill as an attack and blocks matching same-location action abilities while active', () => {
    const { state, s2 } = setup(); state.round.activePhase = 'battle';
    activate(state, s2, 'fixture.battery.overload'); resolveChoice(state, 'strength');
    const treeId = Object.keys(state.abilityRuntime!.definitionSkillVariants!)[0]!;
    state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat; state.players[0]!.mana = 10;
    const view = rules.projectAbilityState(state, 'p1');
    expect(view.playDiagnostics?.find((entry) => entry.cardInstanceId === treeId && entry.faceDown === false)).toMatchObject({ playKind: 'attack', destinationZone: 'attack_area' });
    expect(() => rules.playAbilityCardBatch(state, 'p1', [{ cardInstanceId: treeId }])).not.toThrow();
    installActionDefinition(state, 'fixture.target.strength', 'basic_attack', ['力量'], 3);
    installActionDefinition(state, 'fixture.target.magic', 'basic_attack', ['魔术'], 3);
    const strength = add(state, 'fixture.target.strength', 'p2', 'skill');
    const magic = add(state, 'fixture.target.magic', 'p2', 'skill');
    expect(rules.definitionVariantAbilityActivationBlocked(state, strength)).toBe(true);
    expect(rules.definitionVariantAbilityActivationBlocked(state, magic)).toBe(false);
    state.round.prioritySeat = state.players[1]!.seat;
    const p2Actions = rules.getLegalActions(state, 'p2');
    expect(p2Actions).not.toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: strength, abilityId: 'fixture.target.strength.action' }));
    expect(p2Actions).toContainEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: magic, abilityId: 'fixture.target.magic.action' }));
    state.players[1]!.locationId = 'miyama_town';
    expect(rules.definitionVariantAbilityActivationBlocked(state, strength)).toBe(false);
  });

  it('honors Special/Luck and Typeless/Command-Seal exclusions exactly', () => {
    const { state } = setup();
    installActionDefinition(state, 'basic.luck', 'basic_attack', ['特殊'], 4);
    installActionDefinition(state, 'fixture.target.special', 'basic_attack', ['特殊'], 3);
    installActionDefinition(state, 'fixture.command', 'command_spell', [], 0);
    installActionDefinition(state, 'fixture.typeless', 'master_skill', [], 0);
    const luck = add(state, 'basic.luck', 'p2', 'skill');
    const special = add(state, 'fixture.target.special', 'p2', 'skill');
    const command = add(state, 'fixture.command', 'p2', 'skill');
    const typeless = add(state, 'fixture.typeless', 'p2', 'skill');
    const treeSpecial = add(state, S3, 'p1', 'attack_area', true);
    const treeTypeless = add(state, S3, 'p1', 'attack_area', true);
    state.abilityRuntime!.definitionSkillVariants = {
      [treeSpecial]: { controllerId: 'p1', definitionId: S3, variantId: 'special', attribute: '特殊', sourceCardId: treeSpecial, sourceAbilityId: 'fixture.tree.lock', createdRound: 2 },
      [treeTypeless]: { controllerId: 'p1', definitionId: S3, variantId: 'typeless', attribute: '无属性', sourceCardId: treeTypeless, sourceAbilityId: 'fixture.tree.lock', createdRound: 2 },
    };
    expect(rules.getEffectiveCardAttributes(state, treeSpecial)).toEqual(['特殊']);
    expect(rules.getEffectiveCardAttributes(state, treeTypeless)).toEqual([]);
    expect(rules.definitionVariantAbilityActivationBlocked(state, luck)).toBe(false);
    expect(rules.definitionVariantAbilityActivationBlocked(state, special)).toBe(true);
    expect(rules.definitionVariantAbilityActivationBlocked(state, command)).toBe(false);
    expect(rules.definitionVariantAbilityActivationBlocked(state, typeless)).toBe(true);
  });

  it('ascension stocks and reveals all five variants, disables overload, and adds +2 to current-round Magic attacks after battery use', () => {
    const { state, s2, asc } = setup();
    const ascCard = state.cards.find((entry) => entry.instanceId === asc)!; ascCard.zone = 'skill';
    rules.processAbilityEvent(state, { id: 'fixture-asc-unlock', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: asc });
    expect(Object.values(state.abilityRuntime!.definitionSkillVariants!)).toHaveLength(5);
    expect(Object.values(state.abilityRuntime!.definitionSkillVariants!).map((entry) => entry.variantId).sort()).toEqual(VARIANTS.map((entry) => entry.id).sort());
    expect(Object.keys(state.abilityRuntime!.definitionSkillVariants!).every((id) => state.abilityRuntime!.cardState[id]!.faceDown === false)).toBe(true);
    state.round.activePhase = 'battle';
    expect(activate(state, s2, 'fixture.battery.overload').ok).toBe(false);
    state.round.activePhase = 'advance'; state.players[0]!.mana = 10;
    expect(activate(state, s2, 'fixture.battery.overheal').ok).toBe(true);
    installActionDefinition(state, 'fixture.attack.magic', 'basic_attack', ['魔术'], 5);
    installActionDefinition(state, 'fixture.attack.strength', 'basic_attack', ['力量'], 5);
    const magic = add(state, 'fixture.attack.magic', 'p1', 'attack_area', true);
    const strength = add(state, 'fixture.attack.strength', 'p1', 'attack_area', true);
    expect(rules.calculateCardPower(state, magic).value).toBe(7);
    expect(rules.calculateCardPower(state, strength).value).toBe(5);
    state.round.roundNumber = 3;
    expect(rules.calculateCardPower(state, magic).value).toBe(5);
  });

  it('accepts genuine deferred provenance and fails restore closed for forged variants or bonuses', () => {
    const { state, s2, asc } = setup();
    state.cards.find((entry) => entry.instanceId === asc)!.zone = 'skill';
    rules.processAbilityEvent(state, { id: 'fixture-asc-restore', type: 'after_master_ascension_unlocked', playerId: 'p1', sourceCardId: asc });
    expect(activate(state, s2, 'fixture.battery.overheal').ok).toBe(true);
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(true);
    const firstId = Object.keys(state.abilityRuntime!.definitionSkillVariants!)[0]!;
    const original = state.abilityRuntime!.definitionSkillVariants![firstId]!.attribute;
    state.abilityRuntime!.definitionSkillVariants![firstId]!.attribute = '伪造';
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(false);
    state.abilityRuntime!.definitionSkillVariants![firstId]!.attribute = original;
    state.abilityRuntime!.roundCardAttributePowerBonuses![0]!.amount = 9;
    expect(rules.isDeferredAbilityRuntimeProvenanceValidForRestore(state)).toBe(false);
  });

  it('keeps production readiness routing identity- and printed-text-free', () => {
    const files = [
      'packages/rules/src/ability/definition-variant-battery-capability.ts',
      'packages/rules/src/ability/interpreter.ts',
      'packages/rules/src/ability/loader.ts',
      'packages/rules/src/ability/executable-card-pack.ts',
    ];
    const text = files.map((file) => readFileSync(file, 'utf8')).join('\n').toLowerCase();
    for (const needle of ['master.caules', '考列斯', '巴格达电池', '绞首刑之雷', 'core.caules-forvedge']) expect(text).not.toContain(needle);
  });
});
