import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { SemanticAxes } from '../phase3-reference/normalize-semantic-axes';
import {
  acceptanceContractsForCurrentAbilities,
  classifyCurrentRoute,
  contractIsEligible,
  mapStructuredCapabilityNeeds,
  referenceRouteOf,
  type CapabilityStructuredAbility,
} from '../phase3-reference/map-phase3-capabilities';

function emptyAxes(): SemanticAxes {
  return {
    timing: [],
    trigger: [],
    condition: [],
    cost: [],
    target: [],
    effect: [],
    interaction: [],
    lifecycle: [],
    modifier: [],
    visibility: [],
    binding: [],
    battle: [],
  };
}

describe('Phase 3 full-roster capability mapping', () => {
  it('keeps PLAY, ADD_TO_ATTACK, CREATE_AND_ACTIVATE, ACTIVATE, and CLOSE as independent action contracts', () => {
    const cases: Array<[CapabilityStructuredAbility, string]> = [
      [
        {
          id: 'play',
          printedClause: 'fixture',
          effects: [{ type: 'play_selected_cards' }],
        },
        'CARD_ACTION_PLAY',
      ],
      [
        {
          id: 'add',
          printedClause: 'fixture',
          effects: [{ type: 'transfer_selected_cards', destination: 'attack' }],
        },
        'CARD_ACTION_ADD_TO_ATTACK',
      ],
      [
        {
          id: 'create',
          printedClause: 'fixture',
          creates: [{ type: 'card', active: true, zone: 'attack' }],
        },
        'CARD_ACTION_CREATE_AND_ACTIVATE',
      ],
      [
        {
          id: 'activate',
          printedClause: 'fixture',
          effects: [{ type: 'activate_card_by_id' }],
        },
        'CARD_ACTION_ACTIVATE',
      ],
      [
        {
          id: 'close',
          printedClause: 'fixture',
          effects: [{ type: 'close_source_card' }],
        },
        'CARD_ACTION_CLOSE',
      ],
    ];

    for (const [ability, expected] of cases) {
      const mapped = mapStructuredCapabilityNeeds(ability, emptyAxes());
      expect(mapped.requiredCapabilities).toContain(expected);
    }
    expect(new Set(cases.map(([, capability]) => capability)).size).toBe(5);
  });

  it('uses invalidating semantic axes to prevent unsafe acceptance-contract inheritance', () => {
    const directResource = emptyAxes();
    directResource.effect = ['GAIN_MANA'];
    expect(contractIsEligible('RESOURCE_NUMERIC_CORE_DIRECT_ACTION', directResource)).toBe(true);

    const triggeredResource = emptyAxes();
    triggeredResource.effect = ['GAIN_MANA'];
    triggeredResource.trigger = ['combat.resolved'];
    triggeredResource.battle = ['COMBAT_EVENT'];
    expect(contractIsEligible('RESOURCE_NUMERIC_CORE_DIRECT_ACTION', triggeredResource)).toBe(false);

    const commandSealResource = emptyAxes();
    commandSealResource.effect = ['ADJUST_COMMAND_SEALS'];
    expect(contractIsEligible('RESOURCE_NUMERIC_CORE_DIRECT_ACTION', commandSealResource)).toBe(false);

    const mappedCommandSeals = mapStructuredCapabilityNeeds(
      {
        id: 'restore-command-seals-fixture',
        printedClause: 'fixture',
        effects: [{ type: 'adjust_command_seals', operation: 'restore_all', scope: 'controller' }],
      },
      commandSealResource,
    );
    expect(mappedCommandSeals.requiredCapabilities).toContain('GENERIC_RESOURCE_NUMERIC');
  });

  it('classifies current routes only as legacy, new, dual, or none', () => {
    expect(classifyCurrentRoute([])).toBe('none');
    expect(classifyCurrentRoute(['legacy.only'])).toBe('legacy');
    expect(classifyCurrentRoute(['time-alter.action'])).toBe('new');
    expect(classifyCurrentRoute(['time-alter.action', 'legacy.other'])).toBe('dual');
  });

  it('keeps Reference execution route observational and does not derive capabilities from handler names', () => {
    expect(referenceRouteOf({ executionRoute: 'specific_handler', handlerId: 'core.play-and-battle-everything' })).toBe('specific_handler');
    expect(referenceRouteOf({ executionRoute: 'deterministic' })).toBe('deterministic');
    expect(referenceRouteOf({ executionRoute: null })).toBe('none');

    const mapped = mapStructuredCapabilityNeeds(
      { id: 'plain', printedClause: 'fixture', effects: [{ type: 'gain_mana' }] },
      { ...emptyAxes(), effect: ['GAIN_MANA'] },
    );
    expect(mapped.requiredCapabilities).not.toContain('core.play-and-battle-everything');
  });

  it('maps matching-card zone mutation and explicit trigger suppression as dependencies', () => {
    const axes = emptyAxes();
    axes.effect = ['GAIN_MANA', 'MOVE_MATCHING_CARDS'];
    const mapped = mapStructuredCapabilityNeeds(
      {
        id: 'chaos-devourer-fixture',
        printedClause: 'fixture',
        effects: [
          { type: 'move_matching_cards', sourceZone: 'beast_hand', destination: 'beast_discard' },
          { type: 'gain_mana', amount: 2, suppressTrigger: 'fixture.trigger' },
        ],
      },
      axes,
    );

    expect(mapped.requiredCapabilities).toContain('GENERIC_CARD_ZONE');
    expect(mapped.requiredCapabilities).toContain('GENERIC_RESOURCE_NUMERIC');
    expect(mapped.requiredCapabilities).toContain('GENERIC_TRIGGER_GATEWAY');
  });

  it('maps structural card-play-mode and play-permission modifiers to Card Action Play without an identity branch', () => {
    const axes = emptyAxes();
    axes.modifier = ['rule:card_play_mode:allow_additional_play'];
    const mapped = mapStructuredCapabilityNeeds(
      {
        id: 'additional-play-fixture',
        printedClause: 'fixture',
        ruleModifiers: [{ rule: 'card_play_mode', operation: 'allow_additional_play' }],
      },
      axes,
    );
    expect(mapped.requiredCapabilities).toContain('CARD_ACTION_PLAY');
    expect(mapped.requiredCapabilities).toContain('GENERIC_MODIFIER');

    const permissionAxes = emptyAxes();
    permissionAxes.modifier = ['rule:card_play_permission:prohibit'];
    const permissionMapped = mapStructuredCapabilityNeeds(
      {
        id: 'play-permission-fixture',
        printedClause: 'fixture',
        ruleModifiers: [{ rule: 'card_play_permission', operation: 'prohibit' }],
      },
      permissionAxes,
    );
    expect(permissionMapped.requiredCapabilities).toContain('CARD_ACTION_PLAY');
    expect(permissionMapped.requiredCapabilities).toContain('GENERIC_MODIFIER');
  });

  it('maps structural deployment requirements to Movement without an identity branch', () => {
    const axes = emptyAxes();
    axes.modifier = ['rule:deployment_requirement:require_battlefield'];
    const mapped = mapStructuredCapabilityNeeds(
      {
        id: 'deployment-requirement-fixture',
        printedClause: 'fixture',
        ruleModifiers: [{ rule: 'deployment_requirement', operation: 'require_battlefield' }],
      },
      axes,
    );
    expect(mapped.requiredCapabilities).toContain('GENERIC_MOVEMENT');
    expect(mapped.requiredCapabilities).toContain('GENERIC_MODIFIER');
  });

  it('maps structural source-card movement to the generic Card Zone dependency', () => {
    const axes = emptyAxes();
    axes.effect = ['MOVE_SOURCE_CARD'];
    const mapped = mapStructuredCapabilityNeeds(
      {
        id: 'source-card-zone-fixture',
        printedClause: 'fixture',
        effects: [{ type: 'move_source_card', destination: 'skill' }],
      },
      axes,
    );
    expect(mapped.requiredCapabilities).toContain('GENERIC_CARD_ZONE');
  });

  it('keeps structured transforms reviewed-special while exposing their card-zone and power dependencies', () => {
    const axes = emptyAxes();
    const mapped = mapStructuredCapabilityNeeds(
      {
        id: 'ordered-transform-fixture',
        printedClause: 'fixture',
        transforms: [{
          sourceZone: 'deck',
          selection: { filter: 'basic_attacks', orderBy: 'printed_power_desc', count: 2 },
          intoDefinitionId: 'card.fixture',
        }],
      },
      axes,
    );
    expect(mapped.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_CARD_ZONE', 'GENERIC_POWER', 'REVIEWED_SPECIAL_TRANSFORM']),
    );
    expect(mapped.specialReasons).toContain('STRUCTURED_TRANSFORM_REQUIRES_REVIEW');
  });

  it('maps structural charged-card insertion to Card Zone while keeping the lifecycle reviewed-special', () => {
    const axes = emptyAxes();
    axes.effect = ['CHARGE_SELECTED_SKILL_ATTACK'];
    const mapped = mapStructuredCapabilityNeeds(
      {
        id: 'charge-selected-skill-attack-fixture',
        printedClause: 'fixture',
        effects: [{
          type: 'charge_selected_skill_attack',
          sourceZone: 'servant_skills',
          destination: 'deck',
          deckPositionFormula: 'selected_card_printed_mana_cost + 1',
        }],
      },
      axes,
    );
    expect(mapped.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_CARD_ZONE', 'REVIEWED_SPECIAL_HANDLER']),
    );
    expect(mapped.specialReasons).toContain('SPECIAL_EFFECT:charge_selected_skill_attack');
  });

  it('maps Lostbelt and event-card special semantics to the Event Deck dependency without granting acceptance', () => {
    const axes = emptyAxes();
    axes.effect = ['EVENT_CARD_RULE', 'LOSTBELT_EXPANSION'];
    const mapped = mapStructuredCapabilityNeeds(
      {
        id: 'lostbelt-event-fixture',
        printedClause: 'fixture',
        effects: [
          { type: 'event_card_rule', operation: 'define_event_card' },
          { type: 'lostbelt_expansion', operation: 'expand' },
        ],
      },
      axes,
    );

    expect(mapped.requiredCapabilities).toContain('GENERIC_EVENT_DECK');
    expect(mapped.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
    expect(mapped.specialReasons).toContain('SPECIAL_EFFECT:event_card_rule');
    expect(mapped.specialReasons).toContain('SPECIAL_EFFECT:lostbelt_expansion');
  });

  it('inherits only named contracts carried by exact current routed subabilities', () => {
    expect(acceptanceContractsForCurrentAbilities(['time-alter.action'])).toEqual([
      'CARD_ACTION_SEMANTICS_MINIMAL_PLAY',
    ]);
    expect(acceptanceContractsForCurrentAbilities(['command-spell.gain-mana'])).toEqual([
      'RESOURCE_NUMERIC_CORE_DIRECT_ACTION',
    ]);
    expect(acceptanceContractsForCurrentAbilities(['legacy.only'])).toEqual([]);
  });

  it('keeps the checked-in 944-identity catalog complete, fail-closed, and route-enum constrained', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const catalog = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-capability-catalog.json'), 'utf8'),
    ) as any;
    const markdown = readFileSync(
      resolve('docs/audits/fd-full-roster-capability-catalog.md'),
      'utf8',
    );
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];

    expect(inventory.capabilitySummary.totalIdentityCount).toBe(944);
    expect(inventory.capabilitySummary.contractMappedCount).toBe(944);
    expect(inventory.capabilitySummary.explicitBlockCount).toBe(0);
    expect(inventory.capabilitySummary.zeroSilentFallback).toBe(true);
    expect(catalog.coverage.mappedAbilities).toHaveLength(944);
    expect(catalog.coverage.blockedAbilities).toHaveLength(0);
    expect(catalog.coverage.mappedAbilities.length + catalog.coverage.blockedAbilities.length).toBe(944);

    const allowedCurrentRoutes = new Set(['legacy', 'new', 'dual', 'none']);
    const allowedReferenceRoutes = new Set(['deterministic', 'shared_handler', 'specific_handler', 'none']);
    for (const entry of entries) {
      expect(allowedCurrentRoutes.has(entry.phase3.currentRoute)).toBe(true);
      expect(allowedReferenceRoutes.has(entry.phase3.referenceRoute)).toBe(true);
      expect(['CONTRACT_MAPPED', 'EXPLICIT_BLOCK']).toContain(entry.phase3.mappingStatus);
    }

    expect(markdown).toContain('totalIdentityCount=944');
    expect(markdown).toContain('contractMappedCount=944');
    expect(markdown).toContain('explicitBlockCount=0');
    expect(markdown).toContain('zeroSilentFallback=true');
  });

  it('maps the Chaos evidence slice without fabricating runtime acceptance', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const byId = new Map(entries.map((entry: any) => [entry.canonicalAbilityId, entry]));

    expect(byId.get('master.chaos.skill.s1').phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
    expect(byId.get('master.chaos.skill.s3').phase3.requiredCapabilities).toContain('GENERIC_TRIGGER_GATEWAY');
    expect(byId.get('master.chaos.skill.s11').phase3.requiredCapabilities).toContain('CARD_ACTION_CLOSE');
    expect(byId.get('master.chaos.skill.s16').phase3.requiredCapabilities).toContain('GENERIC_CARD_ZONE');
    expect(byId.get('master.chaos.skill.s8').phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
    expect(byId.get('master.chaos.skill.s8').phase3.blockedBy).toContain('SPECIAL_EFFECT:defeat_player');
    expect(byId.get('master.chaos.skill.s17').phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
    expect(byId.get('master.chaos.skill.s17').phase3.blockedBy).toContain('SPECIAL_EFFECT:repeat_skill_effect_rule');
    expect(byId.get('master.chaos.skill.ascension').phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
  });

  it('maps the Bazett evidence slice while keeping Fragarach special and command seals generic', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const byId = new Map(entries.map((entry: any) => [entry.canonicalAbilityId, entry]));

    expect(byId.get('master.bazett.skill.s2').phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
    expect(byId.get('master.bazett.skill.s2').phase3.blockedBy).toContain('SPECIAL_EFFECT:defeat_player');
    expect(byId.get('master.bazett.skill.s5').phase3.requiredCapabilities).toContain('CARD_ACTION_ADD_TO_ATTACK');
    expect(byId.get('master.bazett.skill.s4').phase3.requiredCapabilities).toContain('GENERIC_RESOURCE_NUMERIC');
    expect(byId.get('master.bazett.skill.s4').phase3.inheritedAcceptanceContracts).not.toContain('RESOURCE_NUMERIC_CORE_DIRECT_ACTION');
    for (const id of [
      'master.bazett.skill.s1a',
      'master.bazett.skill.s1d',
      'master.bazett.skill.s3',
      'master.bazett.skill.s4',
      'master.bazett.skill.s5',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(byId.get(id).phase3.blockedBy).toContain('SPECIAL_EFFECT:cycle_state_transition');
    }
    expect(byId.get('master.bazett.skill.ascension').phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
  });

  it('routes all eleven Wodime identities to reviewed-special without inheriting runtime acceptance', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const wodime = entries.filter((entry: any) => entry.canonicalAbilityId.startsWith('master.wodime.skill.'));

    expect(wodime).toHaveLength(11);
    for (const entry of wodime) {
      expect(entry.phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(entry.phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
      expect(entry.phase3.inheritedAcceptanceContracts).toEqual([]);
    }

    const byId = new Map(wodime.map((entry: any) => [entry.canonicalAbilityId, entry]));
    expect(byId.get('master.wodime.skill.s1').phase3.blockedBy).toContain('SPECIAL_EFFECT:lostbelt_expansion');
    expect(byId.get('master.wodime.skill.s1a').phase3.blockedBy).toContain('SPECIAL_EFFECT:secret_round_binding');
    expect(byId.get('master.wodime.skill.s2').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['CARD_ACTION_PLAY', 'GENERIC_BATTLE_INTEGRATION', 'GENERIC_CONDITION_EVALUATION', 'GENERIC_MODIFIER', 'REVIEWED_SPECIAL_HANDLER']),
    );
    expect(byId.get('master.wodime.skill.s3').phase3.requiredCapabilities).toContain('GENERIC_RESOURCE_NUMERIC');
    expect(byId.get('master.wodime.skill.s4').phase3.requiredCapabilities).toContain('GENERIC_EVENT_DECK');
    expect(byId.get('master.wodime.skill.s5').phase3.requiredCapabilities).toContain('GENERIC_EVENT_DECK');
    for (const id of ['master.wodime.skill.s7', 'master.wodime.skill.s8', 'master.wodime.skill.s9']) {
      expect(byId.get(id).phase3.requiredCapabilities).toEqual(
        expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_CONDITION_EVALUATION', 'GENERIC_EVENT_DECK', 'GENERIC_TRIGGER_GATEWAY', 'REVIEWED_SPECIAL_HANDLER']),
      );
      expect(byId.get(id).phase3.blockedBy).toContain('SPECIAL_EFFECT:defeat_player');
    }
    expect(byId.get('master.wodime.skill.s7').phase3.requiredCapabilities).toContain('GENERIC_MODIFIER');
    expect(byId.get('master.wodime.skill.ascension').phase3.blockedBy).toContain('SPECIAL_EFFECT:secret_round_binding');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
  });

  it('maps the ten-ID Ophelia slice with three generic extensions and seven reviewed-special event rules', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ophelia = entries.filter((entry: any) => entry.canonicalAbilityId.startsWith('master.ophelia.skill.'));
    const byId = new Map(ophelia.map((entry: any) => [entry.canonicalAbilityId, entry]));

    expect(ophelia).toHaveLength(10);
    for (const entry of ophelia) expect(entry.phase3.inheritedAcceptanceContracts).toEqual([]);

    for (const id of ['master.ophelia.skill.s1a', 'master.ophelia.skill.s1b', 'master.ophelia.skill.s2']) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
    }
    for (const id of [
      'master.ophelia.skill.s1',
      'master.ophelia.skill.s3',
      'master.ophelia.skill.s4',
      'master.ophelia.skill.s5',
      'master.ophelia.skill.s6',
      'master.ophelia.skill.s7',
      'master.ophelia.skill.ascension',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(byId.get(id).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
    }

    expect(byId.get('master.ophelia.skill.s2').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_COST_PAYMENT', 'GENERIC_LIFECYCLE_POLICY', 'GENERIC_MODIFIER', 'GENERIC_POWER']),
    );
    expect(byId.get('master.ophelia.skill.s3').phase3.requiredCapabilities).toContain('GENERIC_EVENT_DECK');
    expect(byId.get('master.ophelia.skill.s4').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_EVENT_DECK', 'GENERIC_TRIGGER_GATEWAY', 'REVIEWED_SPECIAL_HANDLER']),
    );
    for (const id of ['master.ophelia.skill.s5', 'master.ophelia.skill.s6', 'master.ophelia.skill.s7']) {
      expect(byId.get(id).phase3.requiredCapabilities).toEqual(
        expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_EVENT_DECK', 'GENERIC_MODIFIER', 'GENERIC_POWER', 'REVIEWED_SPECIAL_HANDLER']),
      );
    }
    expect(byId.get('master.ophelia.skill.ascension').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_CARD_ZONE', 'GENERIC_EVENT_DECK', 'GENERIC_MODIFIER', 'GENERIC_POWER', 'GENERIC_RESULT_BINDING', 'GENERIC_TRIGGER_GATEWAY', 'REVIEWED_SPECIAL_HANDLER']),
    );
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the nine-ID Fiore slice with four generic extensions and five reviewed-special transcend rules', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const fiore = entries.filter((entry: any) => entry.canonicalAbilityId.startsWith('master.fiore.skill.'));
    const byId = new Map(fiore.map((entry: any) => [entry.canonicalAbilityId, entry]));

    expect(fiore).toHaveLength(9);
    for (const entry of fiore) expect(entry.phase3.inheritedAcceptanceContracts).toEqual([]);

    for (const id of [
      'master.fiore.skill.s2',
      'master.fiore.skill.s3',
      'master.fiore.skill.s4',
      'master.fiore.skill.s7',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect(byId.get(id).phase3.blockedBy).toEqual([]);
    }
    for (const id of [
      'master.fiore.skill.s1',
      'master.fiore.skill.s1a',
      'master.fiore.skill.s5',
      'master.fiore.skill.s6',
      'master.fiore.skill.ascension',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(byId.get(id).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
    }

    expect(byId.get('master.fiore.skill.s2').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_MODIFIER', 'GENERIC_MOVEMENT']),
    );
    expect(byId.get('master.fiore.skill.s3').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_MODIFIER', 'GENERIC_RESOURCE_NUMERIC']),
    );
    expect(byId.get('master.fiore.skill.s4').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_CONDITION_EVALUATION', 'GENERIC_MODIFIER', 'GENERIC_POWER']),
    );
    expect(byId.get('master.fiore.skill.s5').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_CARD_ZONE', 'GENERIC_COST_PAYMENT', 'GENERIC_MOVEMENT', 'GENERIC_TRIGGER_GATEWAY', 'REVIEWED_SPECIAL_HANDLER']),
    );
    expect(byId.get('master.fiore.skill.s6').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_CONDITION_EVALUATION', 'GENERIC_LIFECYCLE_POLICY', 'GENERIC_PENDING_INTERACTION', 'GENERIC_RESULT_BINDING', 'GENERIC_TARGET_SELECTION', 'GENERIC_TRIGGER_GATEWAY', 'REVIEWED_SPECIAL_HANDLER']),
    );
    expect(byId.get('master.fiore.skill.s7').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_CARD_ZONE', 'GENERIC_COST_PAYMENT', 'GENERIC_MODIFIER', 'GENERIC_POWER', 'GENERIC_TRIGGER_GATEWAY']),
    );
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the thirteen-ID Kadoc and Hinako slice with explicit ordinary dependencies and zero inherited contracts', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const slice = entries.filter((entry: any) =>
      entry.canonicalAbilityId.startsWith('master.kadoc.skill.') ||
      entry.canonicalAbilityId.startsWith('master.hinako.skill.'),
    );
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));

    expect(slice).toHaveLength(13);
    for (const entry of slice) expect(entry.phase3.inheritedAcceptanceContracts).toEqual([]);

    for (const id of [
      'master.kadoc.skill.s1a',
      'master.hinako.skill.s1a',
      'master.hinako.skill.s2',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect(byId.get(id).phase3.blockedBy).toEqual([]);
    }

    expect(byId.get('master.kadoc.skill.ascension').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_PENDING_INTERACTION', 'GENERIC_RESULT_BINDING', 'GENERIC_TARGET_SELECTION', 'REVIEWED_SPECIAL_HANDLER']),
    );
    expect(byId.get('master.hinako.skill.s2').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['CARD_ACTION_PLAY', 'GENERIC_BATTLE_INTEGRATION', 'GENERIC_LIFECYCLE_POLICY', 'GENERIC_MODIFIER', 'GENERIC_POWER']),
    );
    expect(byId.get('master.hinako.skill.s3').phase3.requiredCapabilities).not.toContain('GENERIC_LIFECYCLE_POLICY');
    expect(byId.get('master.hinako.skill.s4').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['CARD_ACTION_PLAY', 'GENERIC_BATTLE_INTEGRATION', 'GENERIC_CONDITION_EVALUATION', 'GENERIC_EVENT_DECK', 'GENERIC_MODIFIER', 'GENERIC_POWER', 'GENERIC_TRIGGER_GATEWAY', 'REVIEWED_SPECIAL_HANDLER']),
    );
    expect(byId.get('master.hinako.skill.s4').semanticNormalization.axes.condition).toEqual(
      expect.arrayContaining([
        'PLAYER_FACE_UP_ATTACKS_PLAYED_THIS_ROUND_EQUALS',
        'PLAYER_USED_DECLARATION_REVEAL_THIS_ROUND',
        'PLAYER_ALL_ATTACKS_PRINTED_POWER_EVEN',
      ]),
    );
  });

  it('maps the ten-ID Goredolf and Peperoncino slice with four generic extensions and six reviewed-special rules', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const slice = entries.filter((entry: any) =>
      entry.canonicalAbilityId.startsWith('master.goredolf.skill.') ||
      entry.canonicalAbilityId.startsWith('master.peperoncino.skill.'),
    );
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));

    expect(slice).toHaveLength(10);
    for (const entry of slice) expect(entry.phase3.inheritedAcceptanceContracts).toEqual([]);

    for (const id of [
      'master.goredolf.skill.s1a',
      'master.goredolf.skill.ascension',
      'master.peperoncino.skill.s1a',
      'master.peperoncino.skill.s1b',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect(byId.get(id).phase3.blockedBy).toEqual([]);
    }
    for (const id of [
      'master.goredolf.skill.s1',
      'master.peperoncino.skill.s1',
      'master.peperoncino.skill.s2',
      'master.peperoncino.skill.s3',
      'master.peperoncino.skill.s4',
      'master.peperoncino.skill.ascension',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
    }

    expect(byId.get('master.goredolf.skill.s1').phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_TRANSFORM');
    expect(byId.get('master.goredolf.skill.s1a').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining([
        'CARD_ACTION_PLAY',
        'GENERIC_BATTLE_INTEGRATION',
        'GENERIC_CONDITION_EVALUATION',
        'GENERIC_LIFECYCLE_POLICY',
        'GENERIC_MODIFIER',
        'GENERIC_MOVEMENT',
        'GENERIC_POWER',
        'GENERIC_RESOURCE_NUMERIC',
        'GENERIC_TRIGGER_GATEWAY',
      ]),
    );
    expect(byId.get('master.peperoncino.skill.s1a').phase3.requiredCapabilities).toContain('GENERIC_VISIBILITY');
    expect(byId.get('master.peperoncino.skill.s1b').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining([
        'GENERIC_BATTLE_INTEGRATION',
        'GENERIC_COST_PAYMENT',
        'GENERIC_LIFECYCLE_POLICY',
        'GENERIC_MODIFIER',
        'GENERIC_MOVEMENT',
        'GENERIC_POWER',
      ]),
    );
    expect(byId.get('master.peperoncino.skill.s3').semanticNormalization.axes.timing).toContain('PREPARATION');
    expect(byId.get('master.peperoncino.skill.s3').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining([
        'GENERIC_CONDITION_EVALUATION',
        'GENERIC_EVENT_DECK',
        'GENERIC_LIFECYCLE_POLICY',
        'GENERIC_PENDING_INTERACTION',
        'GENERIC_POWER',
        'GENERIC_RESULT_BINDING',
        'GENERIC_TARGET_SELECTION',
        'GENERIC_TRIGGER_GATEWAY',
        'REVIEWED_SPECIAL_HANDLER',
      ]),
    );
    expect(byId.get('master.peperoncino.skill.s4').semanticNormalization.axes.condition).toEqual(
      expect.arrayContaining([
        'ATTACK_PLAYED_FROM_HAND_THIS_ROUND',
        'ATTACK_ATTRIBUTE_MATCHES_SOURCE_EVENT',
        'ATTACK_NOT_PLAYED_BY_EFFECT',
      ]),
    );
    expect(byId.get('master.peperoncino.skill.s4').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining([
        'GENERIC_PENDING_INTERACTION',
        'GENERIC_RESULT_BINDING',
        'GENERIC_TARGET_SELECTION',
        'GENERIC_TRIGGER_GATEWAY',
        'REVIEWED_SPECIAL_HANDLER',
      ]),
    );
  });

  it('maps the two-ID Artoira charge slice as reviewed-special with explicit ordinary dependencies', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const slice = entries.filter((entry: any) => entry.canonicalAbilityId.startsWith('master.artoira.skill.'));
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));

    expect(slice).toHaveLength(2);
    for (const entry of slice) {
      expect(entry.phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(entry.phase3.inheritedAcceptanceContracts).toEqual([]);
    }
    expect(byId.get('master.artoira.skill.s1').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining([
        'CARD_ACTION_ADD_TO_ATTACK',
        'GENERIC_CARD_ZONE',
        'GENERIC_CONDITION_EVALUATION',
        'GENERIC_PENDING_INTERACTION',
        'GENERIC_RESULT_BINDING',
        'GENERIC_TARGET_SELECTION',
        'GENERIC_TRIGGER_GATEWAY',
        'GENERIC_VISIBILITY',
        'REVIEWED_SPECIAL_HANDLER',
      ]),
    );
    expect(byId.get('master.artoira.skill.s1').phase3.blockedBy).toContain(
      'SPECIAL_EFFECT:charge_selected_skill_attack',
    );
    expect(byId.get('master.artoira.skill.ascension').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining([
        'GENERIC_BATTLE_INTEGRATION',
        'GENERIC_CARD_ZONE',
        'GENERIC_CONDITION_EVALUATION',
        'GENERIC_MODIFIER',
        'GENERIC_TRIGGER_GATEWAY',
        'REVIEWED_SPECIAL_HANDLER',
      ]),
    );
    expect(byId.get('master.artoira.skill.ascension').phase3.blockedBy).toContain('SPECIAL_EFFECT:finish_game');
  });

  it('maps the eight-ID Arcueid/Darnic/Amakusa/Fou batch as three generic extensions and five reviewed-special identities', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.arcueid.skill.s2',
      'master.arcueid.skill.ascension',
      'master.darnic.skill.s1',
      'master.darnic.skill.ascension',
      'master.amakusa.skill.s3',
      'master.amakusa.skill.ascension',
      'master.fou.skill.s1',
      'master.fou.skill.ascension',
    ];
    const slice = entries.filter((entry: any) => ids.includes(entry.canonicalAbilityId));
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));
    expect(slice).toHaveLength(8);
    expect(slice.every((entry: any) => entry.phase3.inheritedAcceptanceContracts.length === 0)).toBe(true);

    for (const id of ['master.arcueid.skill.ascension', 'master.amakusa.skill.ascension', 'master.fou.skill.s1']) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect(byId.get(id).phase3.blockedBy).toEqual([]);
    }
    for (const id of ['master.arcueid.skill.s2', 'master.darnic.skill.s1', 'master.darnic.skill.ascension', 'master.amakusa.skill.s3', 'master.fou.skill.ascension']) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(byId.get(id).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
    }

    expect(byId.get('master.arcueid.skill.s2').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['CARD_ACTION_ADD_TO_ATTACK', 'CARD_ACTION_CLOSE', 'GENERIC_CARD_ZONE', 'GENERIC_PENDING_INTERACTION', 'GENERIC_RESULT_BINDING', 'GENERIC_TARGET_SELECTION']),
    );
    expect(byId.get('master.amakusa.skill.s3').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION', 'GENERIC_COST_PAYMENT', 'GENERIC_MOVEMENT', 'GENERIC_RESOURCE_NUMERIC', 'GENERIC_TRIGGER_GATEWAY']),
    );
    expect(byId.get('master.fou.skill.ascension').phase3.requiredCapabilities).toEqual(
      expect.arrayContaining(['GENERIC_LIFECYCLE_POLICY', 'GENERIC_RESOURCE_NUMERIC', 'GENERIC_RESULT_BINDING', 'GENERIC_TRIGGER_GATEWAY']),
    );
    expect(byId.get('master.darnic.skill.ascension').phase3.blockedBy).toContain('SPECIAL_EFFECT:terrain_position_adjustment');
    expect(byId.get('master.arcueid.skill.s2').phase3.blockedBy).toEqual(expect.arrayContaining(['SPECIAL_EFFECT:repeat_replacement_window', 'SPECIAL_EFFECT:schedule_phase_effect']));
    expect(byId.get('master.amakusa.skill.s3').phase3.blockedBy).toEqual(expect.arrayContaining(['SPECIAL_EFFECT:linked_player_battle_reward', 'SPECIAL_EFFECT:linked_player_mana_contribution']));
    expect(byId.get('master.fou.skill.ascension').phase3.blockedBy).toEqual(expect.arrayContaining(['SPECIAL_EFFECT:prevent_elimination', 'SPECIAL_EFFECT:shared_victory_link', 'SPECIAL_EFFECT:swap_victory_points']));

    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the nine-ID Ciel/Celenike/Dan batch as seven generic extensions and two reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.ciel.skill.ascension', 'master.ciel.skill.s1', 'master.ciel.skill.s1a',
      'master.celenike.skill.ascension', 'master.celenike.skill.s1', 'master.celenike.skill.s1a',
      'master.dan.skill.ascension', 'master.dan.skill.s1', 'master.dan.skill.s1a',
    ];
    const slice = entries.filter((entry: any) => ids.includes(entry.canonicalAbilityId));
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));
    expect(slice).toHaveLength(9);
    expect(slice.every((entry: any) => entry.phase3.inheritedAcceptanceContracts.length === 0)).toBe(true);

    for (const id of ['master.ciel.skill.s1','master.ciel.skill.s1a','master.celenike.skill.ascension','master.celenike.skill.s1','master.celenike.skill.s1a','master.dan.skill.s1','master.dan.skill.s1a']) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect(byId.get(id).phase3.blockedBy).toEqual([]);
    }
    for (const id of ['master.ciel.skill.ascension','master.dan.skill.ascension']) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(byId.get(id).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
    }

    expect(byId.get('master.ciel.skill.ascension').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['CARD_ACTION_PLAY','GENERIC_CONDITION_EVALUATION','GENERIC_LIFECYCLE_POLICY','GENERIC_MODIFIER','GENERIC_POWER','REVIEWED_SPECIAL_HANDLER']));
    expect(byId.get('master.ciel.skill.ascension').phase3.blockedBy).toContain('SPECIAL_EFFECT:grant_linked_ability_to_attribute_attacks');
    expect(byId.get('master.celenike.skill.ascension').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CARD_ZONE','GENERIC_COST_PAYMENT','GENERIC_PENDING_INTERACTION','GENERIC_RESULT_BINDING','GENERIC_TARGET_SELECTION']));
    expect(byId.get('master.celenike.skill.s1').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION','GENERIC_RESOURCE_NUMERIC','GENERIC_STATUS_STATE','GENERIC_TRIGGER_GATEWAY']));
    expect(byId.get('master.dan.skill.ascension').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['CARD_ACTION_ADD_TO_ATTACK','GENERIC_CARD_ZONE','GENERIC_COST_PAYMENT','GENERIC_RESULT_BINDING','GENERIC_TARGET_SELECTION','REVIEWED_SPECIAL_HANDLER']));
    expect(byId.get('master.dan.skill.ascension').phase3.blockedBy).toContain('SPECIAL_EFFECT:seed_attached_supply');
    expect(byId.get('master.dan.skill.s1').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_MOVEMENT','GENERIC_MODIFIER','GENERIC_TRIGGER_GATEWAY']));
    expect(byId.get('master.dan.skill.s1a').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION','GENERIC_MODIFIER','GENERIC_STATUS_STATE','GENERIC_TRIGGER_GATEWAY']));

    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the nine-ID Goetia/Magical Ruby/Irisviel batch as one existing contract, five generic extensions, and three reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.goetia.skill.s1', 'master.goetia.skill.s2', 'master.goetia.skill.ascension',
      'master.illya-mahou.skill.s1', 'master.illya-mahou.skill.s1a', 'master.illya-mahou.skill.ascension',
      'master.irisviel.skill.s1', 'master.irisviel.skill.s2', 'master.irisviel.skill.ascension',
    ];
    const slice = entries.filter((entry: any) => ids.includes(entry.canonicalAbilityId));
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));
    expect(slice).toHaveLength(9);

    expect(byId.get('master.irisviel.skill.s2').phase3.classificationRoute).toBe('READY_EXISTING_CONTRACT');
    expect(byId.get('master.irisviel.skill.s2').phase3.inheritedAcceptanceContracts).toEqual(['CARD_ZONE_CORE_DIRECT_ACTION']);
    for (const id of ['master.goetia.skill.ascension','master.illya-mahou.skill.s1a','master.illya-mahou.skill.ascension','master.irisviel.skill.s1','master.irisviel.skill.ascension']) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect(byId.get(id).phase3.blockedBy).toEqual([]);
    }
    for (const id of ['master.goetia.skill.s1','master.goetia.skill.s2','master.illya-mahou.skill.s1']) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(byId.get(id).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
    }

    expect(byId.get('master.goetia.skill.s1').phase3.blockedBy).toContain('SPECIAL_EFFECT:demon_god_rule');
    expect(byId.get('master.goetia.skill.s2').phase3.blockedBy).toEqual(expect.arrayContaining(['SPECIAL_EFFECT:demon_god_rule','SPECIAL_EFFECT:retrigger_card_play_effects']));
    expect(byId.get('master.goetia.skill.s2').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['CARD_ACTION_CLOSE','CARD_ACTION_PLAY','GENERIC_CARD_ZONE','GENERIC_MOVEMENT','GENERIC_RESOURCE_NUMERIC','GENERIC_TRIGGER_GATEWAY']));
    expect(byId.get('master.illya-mahou.skill.s1').phase3.blockedBy).toContain('SPECIAL_EFFECT:deck_entry_replacement');
    expect(byId.get('master.illya-mahou.skill.s1a').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CARD_ZONE','GENERIC_COST_PAYMENT','GENERIC_PENDING_INTERACTION','GENERIC_RESULT_BINDING','GENERIC_TARGET_SELECTION']));
    expect(byId.get('master.irisviel.skill.ascension').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CARD_ZONE','GENERIC_LIFECYCLE_POLICY','GENERIC_MODIFIER','GENERIC_PENDING_INTERACTION','GENERIC_POWER','GENERIC_TARGET_SELECTION']));

    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fourteen-ID Araya/Kayneth/Leonardo/Taiga/Tokiomi batch as nine generic extensions and five reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.araya.skill.s1', 'master.araya.skill.ascension',
      'master.kayneth.skill.s1', 'master.kayneth.skill.s2', 'master.kayneth.skill.ascension',
      'master.leonardo.skill.s1', 'master.leonardo.skill.s1a', 'master.leonardo.skill.ascension',
      'master.taiga.skill.s1', 'master.taiga.skill.s1a', 'master.taiga.skill.ascension',
      'master.tokiomi.skill.s1', 'master.tokiomi.skill.s2', 'master.tokiomi.skill.ascension',
    ];
    const slice = entries.filter((entry: any) => ids.includes(entry.canonicalAbilityId));
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));
    expect(slice).toHaveLength(14);

    for (const id of [
      'master.kayneth.skill.s1','master.kayneth.skill.ascension',
      'master.leonardo.skill.s1','master.leonardo.skill.s1a','master.leonardo.skill.ascension',
      'master.taiga.skill.s1','master.taiga.skill.s1a',
      'master.tokiomi.skill.s1','master.tokiomi.skill.ascension',
    ]) {
      expect(byId.get(id).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect(byId.get(id).phase3.blockedBy).toEqual([]);
    }
    const special = new Map([
      ['master.araya.skill.s1','SPECIAL_EFFECT:terrain_position_adjustment'],
      ['master.araya.skill.ascension','SPECIAL_EFFECT:terrain_position_adjustment'],
      ['master.kayneth.skill.s2','SPECIAL_EFFECT:independent_deck_rule'],
      ['master.taiga.skill.ascension','SPECIAL_EFFECT:location_token_rule'],
      ['master.tokiomi.skill.s2','SPECIAL_EFFECT:item_rule'],
    ]);
    for (const [id, reason] of special) {
      expect(byId.get(id).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect(byId.get(id).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
      expect(byId.get(id).phase3.blockedBy).toContain(reason);
    }
    expect(byId.get('master.araya.skill.ascension').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CONDITION_EVALUATION','GENERIC_LIFECYCLE_POLICY','GENERIC_MODIFIER','GENERIC_MOVEMENT']));
    expect(byId.get('master.taiga.skill.ascension').phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CARD_ZONE','GENERIC_LIFECYCLE_POLICY']));

    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the nineteen-ID Julius/Kuzuki/Waver/Sieg/Illya slice as thirteen generic and six reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.julius.skill.s1','master.julius.skill.s1a','master.julius.skill.ascension',
      'master.kuzuki.skill.s1','master.kuzuki.skill.s3','master.kuzuki.skill.ascension',
      'master.waver.skill.s1','master.waver.skill.s2','master.waver.skill.s3','master.waver.skill.ascension',
      'master.sieg.skill.s1','master.sieg.skill.s1a','master.sieg.skill.s2','master.sieg.skill.ascension',
      'master.iliya.skill.s1','master.iliya.skill.s2','master.iliya.skill.s3','master.iliya.skill.s4','master.iliya.skill.ascension',
    ];
    const slice = entries.filter((entry: any) => ids.includes(entry.canonicalAbilityId));
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));
    expect(slice).toHaveLength(19);
    for (const id of [
      'master.julius.skill.s1a','master.kuzuki.skill.s1','master.kuzuki.skill.s3',
      'master.waver.skill.s1','master.waver.skill.s2','master.waver.skill.s3',
      'master.sieg.skill.s1','master.sieg.skill.s1a','master.sieg.skill.ascension',
      'master.iliya.skill.s1','master.iliya.skill.s2','master.iliya.skill.s3','master.iliya.skill.s4',
    ]) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);
    }
    const special = new Map([
      ['master.julius.skill.s1','SPECIAL_EFFECT:deferred_deployment_rule'],
      ['master.julius.skill.ascension','SPECIAL_EFFECT:deferred_deployment_rule'],
      ['master.kuzuki.skill.ascension','SPECIAL_EFFECT:grant_linked_ability_to_definition'],
      ['master.waver.skill.ascension','SPECIAL_EFFECT:winner_prediction_rule'],
      ['master.sieg.skill.s2','SPECIAL_EFFECT:grant_opponent_action_rule'],
      ['master.iliya.skill.ascension','SPECIAL_EFFECT:finish_game'],
    ]);
    for (const [id, reason] of special) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
      expect((byId.get(id) as any).phase3.blockedBy).toContain(reason);
    }
    expect((byId.get('master.kuzuki.skill.ascension') as any).phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CARD_ZONE','GENERIC_MODIFIER','GENERIC_POWER','GENERIC_TRIGGER_GATEWAY']));
    expect((byId.get('master.iliya.skill.ascension') as any).phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CARD_ZONE','GENERIC_MODIFIER','GENERIC_POWER','GENERIC_TRIGGER_GATEWAY']));
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the nineteen-ID Rin/Sakura/Shinji/Kirei batch as thirteen generic and six reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.rin.skill.s1','master.rin.skill.s2','master.rin.skill.s3','master.rin.skill.s4','master.rin.skill.ascension',
      'master.sakura.skill.s1','master.sakura.skill.s2','master.sakura.skill.s3','master.sakura.skill.s4','master.sakura.skill.ascension',
      'master.shinji.skill.s1','master.shinji.skill.s2','master.shinji.skill.s3','master.shinji.skill.s4','master.shinji.skill.ascension',
      'master.kirei.skill.s1','master.kirei.skill.s2','master.kirei.skill.s3','master.kirei.skill.ascension',
    ];
    const slice = entries.filter((entry: any) => ids.includes(entry.canonicalAbilityId));
    const byId = new Map(slice.map((entry: any) => [entry.canonicalAbilityId, entry]));
    expect(slice).toHaveLength(19);
    for (const id of [
      'master.rin.skill.s2','master.rin.skill.s4','master.rin.skill.ascension',
      'master.sakura.skill.s1','master.sakura.skill.s2','master.sakura.skill.s3','master.sakura.skill.ascension',
      'master.shinji.skill.s1','master.shinji.skill.s2','master.shinji.skill.s3',
      'master.kirei.skill.s1','master.kirei.skill.s2','master.kirei.skill.s3',
    ]) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);
    }
    const special = new Map([
      ['master.rin.skill.s1','SPECIAL_EFFECT:gem_resource_rule'],
      ['master.rin.skill.s3','SPECIAL_EFFECT:gem_resource_rule'],
      ['master.sakura.skill.s4','SPECIAL_EFFECT:infinite_mana_rule'],
      ['master.shinji.skill.s4','SPECIAL_EFFECT:roster_replacement_rule'],
      ['master.shinji.skill.ascension','SPECIAL_EFFECT:servant_ownership_rule'],
      ['master.kirei.skill.ascension','SPECIAL_EFFECT:defeat_player'],
    ]);
    for (const [id, reason] of special) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
      expect((byId.get(id) as any).phase3.blockedBy).toContain(reason);
    }
    expect((byId.get('master.rin.skill.s3') as any).phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_CARD_ZONE','GENERIC_PENDING_INTERACTION','GENERIC_RESOURCE_NUMERIC','GENERIC_RESULT_BINDING','GENERIC_TARGET_SELECTION']));
    expect((byId.get('master.kirei.skill.ascension') as any).phase3.requiredCapabilities).toEqual(expect.arrayContaining(['GENERIC_BATTLE_INTEGRATION','GENERIC_CONDITION_EVALUATION','GENERIC_MODIFIER','GENERIC_POWER']));
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the twenty-ID Kariya/Kiritsugu/Shirou/Maiya/Ryuunosuke batch as one existing, twelve generic, and seven reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.kariya.skill.s1','master.kariya.skill.s2','master.kariya.skill.s3','master.kariya.skill.s4','master.kariya.skill.ascension',
      'master.kiritsugu.skill.s1','master.kiritsugu.skill.s2','master.kiritsugu.skill.s3','master.kiritsugu.skill.s4','master.kiritsugu.skill.ascension',
      'master.shirou-emiya.skill.s1','master.shirou-emiya.skill.s2','master.shirou-emiya.skill.s3','master.shirou-emiya.skill.ascension',
      'master.maiya.skill.s1','master.maiya.skill.s2','master.maiya.skill.ascension',
      'master.ryuunosuke.skill.s1','master.ryuunosuke.skill.s2','master.ryuunosuke.skill.ascension',
    ];
    const slice = entries.filter((e: any) => ids.includes(e.canonicalAbilityId));
    const byId = new Map(slice.map((e: any) => [e.canonicalAbilityId,e]));
    expect(slice).toHaveLength(20);
    expect((byId.get('master.kiritsugu.skill.s2') as any).phase3.classificationRoute).toBe('READY_EXISTING_CONTRACT');
    expect((byId.get('master.kiritsugu.skill.s2') as any).phase3.inheritedAcceptanceContracts).toEqual(['CARD_ACTION_SEMANTICS_MINIMAL_PLAY']);
    for (const id of ['master.kariya.skill.ascension','master.kariya.skill.s1','master.kiritsugu.skill.ascension','master.kiritsugu.skill.s3','master.maiya.skill.ascension','master.maiya.skill.s1','master.maiya.skill.s2','master.ryuunosuke.skill.s1','master.ryuunosuke.skill.s2','master.shirou-emiya.skill.ascension','master.shirou-emiya.skill.s1','master.shirou-emiya.skill.s2']) expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
    const special = new Map([
      ['master.kariya.skill.s2','SPECIAL_EFFECT:nemesis_rule'],['master.kariya.skill.s3','SPECIAL_EFFECT:nemesis_rule'],['master.kariya.skill.s4','SPECIAL_EFFECT:collapse_random_play_rule'],
      ['master.kiritsugu.skill.s1','STRUCTURED_TRANSFORM_REQUIRES_REVIEW'],['master.kiritsugu.skill.s4','SPECIAL_EFFECT:origin_bullet_rule'],
      ['master.ryuunosuke.skill.ascension','SPECIAL_EFFECT:event_battlefield_penalty'],['master.shirou-emiya.skill.s3','SPECIAL_EFFECT:prevent_elimination'],
    ]);
    for (const [id, reason] of special) { expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE'); expect((byId.get(id) as any).phase3.blockedBy).toContain(reason); }
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the eighteen-ID Zouken/Caren/Miyu/Shirou Meal batch as nine generic and nine reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.zouken.skill.s1','master.zouken.skill.s2','master.zouken.skill.s3','master.zouken.skill.s4','master.zouken.skill.s5','master.zouken.skill.ascension',
      'master.caren.skill.s1','master.caren.skill.s1a','master.caren.skill.s2','master.caren.skill.s3','master.caren.skill.ascension',
      'master.miyu.skill.s1','master.miyu.skill.s2','master.miyu.skill.s3','master.miyu.skill.ascension',
      'master.shirou-meal.skill.s1','master.shirou-meal.skill.s2','master.shirou-meal.skill.ascension',
    ];
    const slice = entries.filter((e: any) => ids.includes(e.canonicalAbilityId));
    const byId = new Map(slice.map((e: any) => [e.canonicalAbilityId,e]));
    expect(slice).toHaveLength(18);
    for (const id of [
      'master.zouken.skill.s1','master.zouken.skill.s2','master.zouken.skill.s4','master.zouken.skill.s5','master.zouken.skill.ascension',
      'master.caren.skill.s1','master.caren.skill.s1a','master.caren.skill.ascension','master.miyu.skill.ascension',
    ]) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);
    }
    const special = new Map([
      ['master.zouken.skill.s3','SPECIAL_EFFECT:linked_player_battle_reward'],
      ['master.caren.skill.s2','SPECIAL_EFFECT:reactive_resource_rule'],
      ['master.caren.skill.s3','SPECIAL_EFFECT:bound_opponent_rule'],
      ['master.miyu.skill.s1','SPECIAL_EFFECT:roster_skill_draft_rule'],
      ['master.miyu.skill.s2','SPECIAL_EFFECT:roster_skill_draft_rule'],
      ['master.miyu.skill.s3','SPECIAL_EFFECT:dream_summon_rule'],
      ['master.shirou-meal.skill.s1','SPECIAL_EFFECT:food_resource_rule'],
      ['master.shirou-meal.skill.s2','SPECIAL_EFFECT:food_resource_rule'],
      ['master.shirou-meal.skill.ascension','SPECIAL_EFFECT:food_resource_rule'],
    ]);
    for (const [id, reason] of special) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
      expect((byId.get(id) as any).phase3.blockedBy).toContain(reason);
    }
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the twenty-ID Reines/Caules/Shishigou batch as nine generic and eleven reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.reines.skill.s1','master.reines.skill.s1a','master.reines.skill.s2','master.reines.skill.s3','master.reines.skill.s4','master.reines.skill.ascension',
      'master.caules.skill.s1','master.caules.skill.s1a','master.caules.skill.s2','master.caules.skill.s3','master.caules.skill.ascension',
      'master.caules-yggdmillennia.skill.s1','master.caules-yggdmillennia.skill.s1a','master.caules-yggdmillennia.skill.s2','master.caules-yggdmillennia.skill.s3','master.caules-yggdmillennia.skill.ascension',
      'master.shishigou.skill.s1','master.shishigou.skill.s2','master.shishigou.skill.s3','master.shishigou.skill.ascension',
    ];
    const slice = entries.filter((e: any) => ids.includes(e.canonicalAbilityId));
    const byId = new Map(slice.map((e: any) => [e.canonicalAbilityId,e]));
    expect(slice).toHaveLength(20);
    for (const id of ['master.reines.skill.s1','master.reines.skill.s1a','master.reines.skill.s2','master.reines.skill.s3','master.caules.skill.s1','master.caules.skill.s1a','master.caules-yggdmillennia.skill.s1','master.caules-yggdmillennia.skill.s1a','master.caules-yggdmillennia.skill.s2']) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);
    }
    const special = new Map([
      ['master.reines.skill.ascension','SPECIAL_EFFECT:trimmau_growth_rule'],['master.reines.skill.s4','SPECIAL_EFFECT:trimmau_confession_rule'],
      ['master.caules.skill.s2','SPECIAL_EFFECT:crafted_tree_rule'],['master.caules.skill.s3','SPECIAL_EFFECT:crafted_tree_rule'],['master.caules.skill.ascension','SPECIAL_EFFECT:crafted_tree_rule'],
      ['master.caules-yggdmillennia.skill.s3','SPECIAL_EFFECT:declared_attribute_rule'],['master.caules-yggdmillennia.skill.ascension','SPECIAL_EFFECT:declared_attribute_rule'],
      ['master.shishigou.skill.s1','SPECIAL_EFFECT:necromancy_rite_rule'],['master.shishigou.skill.s2','SPECIAL_EFFECT:necromancy_rite_rule'],['master.shishigou.skill.s3','SPECIAL_EFFECT:necromancy_rite_rule'],['master.shishigou.skill.ascension','SPECIAL_EFFECT:necromancy_rite_rule'],
    ]);
    for (const [id, reason] of special) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect((byId.get(id) as any).phase3.blockedBy).toContain(reason);
    }
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the twenty-ID Extra Hakuno/Rani/Jinako/Alice batch as four generic and sixteen reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.hakuno-f.skill.s1','master.hakuno-f.skill.s2','master.hakuno-f.skill.s3','master.hakuno-f.skill.s4','master.hakuno-f.skill.s5','master.hakuno-f.skill.ascension',
      'master.hakuno-m.skill.s1','master.hakuno-m.skill.s2','master.hakuno-m.skill.s3','master.hakuno-m.skill.ascension',
      'master.rani.skill.s1','master.rani.skill.s2','master.rani.skill.s3','master.rani.skill.ascension',
      'master.jinako.skill.s1','master.jinako.skill.s2','master.jinako.skill.ascension',
      'master.alice.skill.s1','master.alice.skill.s2','master.alice.skill.ascension',
    ];
    const slice=entries.filter((e:any)=>ids.includes(e.canonicalAbilityId)); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(20);
    for(const id of ['master.hakuno-f.skill.s2','master.hakuno-f.skill.s4','master.hakuno-f.skill.s5','master.jinako.skill.s1']) { expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(id) as any).phase3.blockedBy).toEqual([]); }
    const specialIds=ids.filter(id=>!['master.hakuno-f.skill.s2','master.hakuno-f.skill.s4','master.hakuno-f.skill.s5','master.jinako.skill.s1'].includes(id));
    for(const id of specialIds) expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
    expect((byId.get('master.hakuno-f.skill.s4') as any).phase3.requiredCapabilities).toContain('GENERIC_RESOURCE_NUMERIC');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the nineteen-ID Akiha/Kiara/Fujino batch as two generic and seventeen reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.akiha.skill.s1','master.akiha.skill.s1a','master.akiha.skill.s2','master.akiha.skill.s3','master.akiha.skill.ascension',
      'master.kiara.skill.s1','master.kiara.skill.s1a','master.kiara.skill.s2','master.kiara.skill.s3','master.kiara.skill.s4','master.kiara.skill.s5','master.kiara.skill.s6','master.kiara.skill.ascension',
      'master.fujino.skill.s1','master.fujino.skill.s1a','master.fujino.skill.s2','master.fujino.skill.s3','master.fujino.skill.s4','master.fujino.skill.ascension',
    ];
    const slice = entries.filter((e:any) => ids.includes(e.canonicalAbilityId));
    const byId = new Map(slice.map((e:any) => [e.canonicalAbilityId,e]));
    expect(slice).toHaveLength(19);
    for (const id of ['master.fujino.skill.s1','master.fujino.skill.s3']) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
      expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);
    }
    for (const id of ids.filter(id => !['master.fujino.skill.s1','master.fujino.skill.s3'].includes(id))) {
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
    }
    expect((byId.get('master.fujino.skill.s1') as any).phase3.requiredCapabilities).toContain('GENERIC_CARD_CREATE');
    expect((byId.get('master.fujino.skill.s3') as any).phase3.requiredCapabilities).toContain('CARD_ACTION_ACTIVATE');
    expect((byId.get('master.kiara.skill.s6') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:defeat_player');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the seventeen-ID Shiki trio batch as six generic and eleven reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.shiki-nanaya.skill.s1','master.shiki-nanaya.skill.s1a','master.shiki-nanaya.skill.s1b','master.shiki-nanaya.skill.s2','master.shiki-nanaya.skill.ascension',
      'master.shiki-ryougi.skill.s1','master.shiki-ryougi.skill.s1a','master.shiki-ryougi.skill.s1b','master.shiki-ryougi.skill.s2','master.shiki-ryougi.skill.s3','master.shiki-ryougi.skill.ascension',
      'master.shiki-tohno.skill.s1','master.shiki-tohno.skill.s1a','master.shiki-tohno.skill.s2','master.shiki-tohno.skill.s3','master.shiki-tohno.skill.s4','master.shiki-tohno.skill.ascension',
    ];
    const generic = ['master.shiki-nanaya.skill.s1','master.shiki-nanaya.skill.s1a','master.shiki-ryougi.skill.s1','master.shiki-ryougi.skill.s1a','master.shiki-ryougi.skill.s3','master.shiki-tohno.skill.s1'];
    const slice=entries.filter((e:any)=>ids.includes(e.canonicalAbilityId)); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(17);
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))) expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
    expect((byId.get('master.shiki-ryougi.skill.s3') as any).phase3.requiredCapabilities).toContain('GENERIC_CARD_ZONE');
    expect((byId.get('master.shiki-nanaya.skill.s2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:deck_top_manipulation_rule');
    expect((byId.get('master.shiki-tohno.skill.s2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:base_card_exchange_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the twenty-one-ID Akasha/Hisui Detective/Wallachia batch as reviewed-special identities', () => {
    const inventory = JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8')) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const ids = [
      'master.akasha.skill.ascension','master.akasha.skill.s1a','master.akasha.skill.s2','master.akasha.skill.s3','master.akasha.skill.s4','master.akasha.skill.s5','master.akasha.skill.s6',
      'master.hisui-detective.skill.ascension','master.hisui-detective.skill.s1','master.hisui-detective.skill.s1a','master.hisui-detective.skill.s2','master.hisui-detective.skill.s3',
      'master.wallachia.skill.ascension','master.wallachia.skill.s1','master.wallachia.skill.s2','master.wallachia.skill.s3','master.wallachia.skill.s4','master.wallachia.skill.s5','master.wallachia.skill.s6','master.wallachia.skill.s7','master.wallachia.skill.s8',
    ];
    const slice=entries.filter((e:any)=>ids.includes(e.canonicalAbilityId)); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e]));
    expect(slice).toHaveLength(21);
    for(const id of ids){ expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE'); expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER'); }
    expect((byId.get('master.akasha.skill.s2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:reincarnation_rule');
    expect((byId.get('master.hisui-detective.skill.s3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:detective_accusation_rule');
    expect((byId.get('master.wallachia.skill.s8') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:tatari_deterioration_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the seventeen-ID Sion evidence batch as two generic and fifteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=['master.sion.skill.ascension','master.sion.skill.s1','master.sion.skill.s10','master.sion.skill.s11','master.sion.skill.s12','master.sion.skill.s14','master.sion.skill.s15','master.sion.skill.s16','master.sion.skill.s17','master.sion.skill.s2','master.sion.skill.s3','master.sion.skill.s4','master.sion.skill.s5','master.sion.skill.s6','master.sion.skill.s7','master.sion.skill.s8','master.sion.skill.s9']; const generic=['master.sion.skill.s6','master.sion.skill.s16'];
    const slice=entries.filter((e:any)=>ids.includes(e.canonicalAbilityId)); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(17);
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('master.sion.skill.s1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:training_skill_overlay_rule'); expect((byId.get('master.sion.skill.s15') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:moon_holy_grail_reset_rule'); expect((byId.get('master.sion.skill.s17') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:luck_reveal_defeat_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the seventeen-ID Da Vinci batch as six generic and eleven reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=Array.from({length:17},(_,i)=>`servant.davinci.skill.sc-davinci-${i+1}`); const generic=['servant.davinci.skill.sc-davinci-4','servant.davinci.skill.sc-davinci-7','servant.davinci.skill.sc-davinci-8','servant.davinci.skill.sc-davinci-10','servant.davinci.skill.sc-davinci-14','servant.davinci.skill.sc-davinci-16'];
    const slice=entries.filter((e:any)=>ids.includes(e.canonicalAbilityId));const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e]));expect(slice).toHaveLength(17);
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.davinci.skill.sc-davinci-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:temporary_card_copy_rule'); expect((byId.get('servant.davinci.skill.sc-davinci-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:shop_auction_rule'); expect((byId.get('servant.davinci.skill.sc-davinci-17') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:upgrade_attachment_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the twenty-seven-ID Illya/Artoria Caster/Koyanskaya/Avicebron batch as three generic and twenty-four reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const prefixes=['servant.illya.skill.','servant.artoriac.skill.','servant.koyanskaya.skill.','servant.avicebron.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p)));
    const generic=['servant.illya.skill.sc-illya-2','servant.artoriac.skill.sc-artoriac-1','servant.avicebron.skill.sc-avicebron-3']; const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(27);
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const entry of slice.filter((e:any)=>!generic.includes(e.canonicalAbilityId))){expect(entry.phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect(entry.phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.avicebron.skill.sc-avicebron-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:golem_rule');
    expect((byId.get('servant.illya.skill.sc-illya-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:dream_summon_rule');
    expect((byId.get('servant.artoriac.skill.sc-artoriac-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:discard_luck_state_rule');
    expect((byId.get('servant.koyanskaya.skill.sc-koyanskaya-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:cargo_box_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the seven-ID Sherlock batch as reviewed-special deduction identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const slice=entries.filter((e:any)=>e.canonicalAbilityId.startsWith('servant.sherlock.skill.')); expect(slice).toHaveLength(7);
    for(const entry of slice){expect(entry.phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect(entry.phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');expect(entry.phase3.blockedBy).toContain('SPECIAL_EFFECT:deduction_rule');}
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Abigail/BB/Bikuni/Hokusai batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const prefixes=['servant.abigail.skill.','servant.bb.skill.','servant.bikuni.skill.','servant.hokusai.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p))); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(16);
    for(const entry of slice){expect(entry.phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect(entry.phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.bb.skill.sc-bb-4') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:moon_holy_grail_rule');
    expect((byId.get('servant.abigail.skill.sc-abigail-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:foreign_life_rule');
    expect((byId.get('servant.hokusai.skill.sc-hokusai-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:color_marker_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the twelve-ID Mash/Oberon/Voyager batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const prefixes=['servant.mash.skill.','servant.oberon.skill.','servant.voyager.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p))); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(12);
    for(const entry of slice){expect(entry.phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect(entry.phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.mash.skill.sc-mash-4') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:guard_rule');
    expect((byId.get('servant.oberon.skill.sc-oberon-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:ruler_seal_rule');
    expect((byId.get('servant.voyager.skill.sc-voyager-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:visitor_card_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the eight-ID Kagetora/Martha batch as two generic and six reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const prefixes=['servant.kagetora.skill.','servant.martha.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p))); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(8);
    for(const id of ['servant.kagetora.skill.sc-kagetora-3','servant.martha.skill.sc-martha-3']){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of slice.map((e:any)=>e.canonicalAbilityId).filter((id:string)=>!['servant.kagetora.skill.sc-kagetora-3','servant.martha.skill.sc-martha-3'].includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.kagetora.skill.sc-kagetora-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:opponent_mana_borrow_rule');
    expect((byId.get('servant.martha.skill.sc-martha-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:deferred_deployment_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the twelve-ID Okita/Molay/Lakshmibai batch as two generic and ten reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const prefixes=['servant.okita.skill.','servant.molay.skill.','servant.lakshmibai.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p))); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(12);
    for(const id of ['servant.okita.skill.sc-okita-1','servant.lakshmibai.skill.sc-lakshmibai-3']){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of slice.map((e:any)=>e.canonicalAbilityId).filter((id:string)=>!['servant.okita.skill.sc-okita-1','servant.lakshmibai.skill.sc-lakshmibai-3'].includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.lakshmibai.skill.sc-lakshmibai-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:reactive_card_action_rule');
    expect((byId.get('servant.molay.skill.sc-molay-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:foreign_life_rule');
    expect((byId.get('servant.okita.skill.sc-okita-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:temporary_attack_creation_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Saber five batch as five generic and ten reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const prefixes=['servant.altera.skill.','servant.gawain.skill.','servant.bedivere.skill.','servant.arthur.skill.','servant.artoria-alt.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p))); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(15);
    const generic=['servant.altera.skill.sc-altera-3','servant.gawain.skill.sc-gawain-3','servant.bedivere.skill.sc-bedivere-1','servant.arthur.skill.sc-arthur-3','servant.artoria-alt.skill.sc-artoria-alt-3'];
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of slice.map((e:any)=>e.canonicalAbilityId).filter((id:string)=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.gawain.skill.sc-gawain-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:event_challenge_attack_multiplier_rule');
    expect((byId.get('servant.bedivere.skill.sc-bedivere-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:deck_recycle_power_rule');
    expect((byId.get('servant.arthur.skill.sc-arthur-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:skill_sacrifice_scaling_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the twelve-ID Saber follow-up batch as one generic and eleven reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=[
      'servant.mordred.skill.sc-mordred-1','servant.mordred.skill.sc-mordred-2','servant.mordred.skill.sc-mordred-3',
      'servant.muramasa.skill.sc-muramasa-1','servant.muramasa.skill.sc-muramasa-2','servant.muramasa.skill.sc-muramasa-3',
      'servant.nero.skill.sc-nero-3','servant.siegfried.skill.sc-siegfried-1','servant.siegfried.skill.sc-siegfried-3',
      'servant.sigurd.skill.sc-sigurd-1','servant.sigurd.skill.sc-sigurd-2','servant.sigurd.skill.sc-sigurd-3'
    ]; const slice=entries.filter((e:any)=>ids.includes(e.canonicalAbilityId)); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(12);
    expect((byId.get('servant.mordred.skill.sc-mordred-3') as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get('servant.mordred.skill.sc-mordred-3') as any).phase3.blockedBy).toEqual([]);
    for(const id of ids.filter(id=>id!=='servant.mordred.skill.sc-mordred-3')){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.mordred.skill.sc-mordred-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:true_name_hide_and_action_replay_rule');
    expect((byId.get('servant.muramasa.skill.sc-muramasa-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:removed_card_memory_power_rule');
    expect((byId.get('servant.nero.skill.sc-nero-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:turn_order_reposition_rule');
    expect((byId.get('servant.sigurd.skill.sc-sigurd-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:curse_basic_card_modifier_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Saber/Archer five batch as two generic and thirteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const prefixes=['servant.charlemagne.skill.','servant.deon.skill.','servant.musashi.skill.','servant.robin.skill.','servant.chiron.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p))); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(15);
    const generic=['servant.charlemagne.skill.sc-charlemagne-3','servant.musashi.skill.sc-musashi-3']; for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of slice.map((e:any)=>e.canonicalAbilityId).filter((id:string)=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE'); expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.charlemagne.skill.sc-charlemagne-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:event_attribute_infusion_rule');
    expect((byId.get('servant.deon.skill.sc-deon-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:block_counter_rule');
    expect((byId.get('servant.musashi.skill.sc-musashi-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:counter_threshold_power_rule');
    expect((byId.get('servant.robin.skill.sc-robin-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:independent_action_rule');
    expect((byId.get('servant.chiron.skill.sc-chiron-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:self_play_cost_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(2); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Archer five batch as reviewed-special identities with shared rule families', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const prefixes=['servant.arjuna-archer.skill.','servant.emiya-alt.skill.','servant.euryale.skill.','servant.ishtar.skill.','servant.jason.skill.']; const slice=entries.filter((e:any)=>prefixes.some(p=>e.canonicalAbilityId.startsWith(p))); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(15);
    for(const e of slice){expect(e.phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE'); expect(e.phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    for(const id of ['servant.emiya-alt.skill.sc-emiya-alt-1','servant.euryale.skill.sc-euryale-1','servant.ishtar.skill.sc-ishtar-3']) expect((byId.get(id) as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:independent_action_rule');
    for(const id of ['servant.jason.skill.sc-jason-1','servant.jason.skill.sc-jason-2','servant.jason.skill.sc-jason-3']) expect((byId.get(id) as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:dispatch_quest_rule');
    expect((byId.get('servant.arjuna-archer.skill.sc-arjuna-archer-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:judgment_luck_defeat_rule'); expect((byId.get('servant.ishtar.skill.sc-ishtar-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:offboard_battle_takeover_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fourteen-ID Achilles/Albion/Amakusa/Amor/Anastasia/Andersen batch as two generic and twelve reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.achilles.skill.sc-achilles-1","servant.achilles.skill.sc-achilles-2","servant.achilles.skill.sc-achilles-3","servant.albion.skill.sc-albion-3","servant.amakusa.skill.sc-amakusa-2","servant.amakusa.skill.sc-amakusa-3","servant.amor.skill.sc-amor-1","servant.amor.skill.sc-amor-2","servant.amor.skill.sc-amor-3","servant.anastasia.skill.sc-anastasia-2","servant.anastasia.skill.sc-anastasia-3","servant.andersen.skill.sc-andersen-3","servant.anastasia.skill.sc-anastasia-1","servant.andersen.skill.sc-andersen-1"]; const slice=entries.filter((e:any)=>ids.includes(e.canonicalAbilityId)); const byId=new Map(slice.map((e:any)=>[e.canonicalAbilityId,e])); expect(slice).toHaveLength(14);
    for(const id of ['servant.anastasia.skill.sc-anastasia-1','servant.andersen.skill.sc-andersen-1']){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!['servant.anastasia.skill.sc-anastasia-1','servant.andersen.skill.sc-andersen-1'].includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE'); expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    for(const id of ['servant.amakusa.skill.sc-amakusa-3','servant.amor.skill.sc-amor-1']) expect((byId.get(id) as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:ruler_seal_rule');
    expect((byId.get('servant.achilles.skill.sc-achilles-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:hero_duel_field_rule'); expect((byId.get('servant.anastasia.skill.sc-anastasia-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:viy_power_protection_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the thirteen-ID Arash/Arcueid/ArjunaAlter/Ashva/Astolfo batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=['servant.arash.skill.sc-arash-1','servant.arash.skill.sc-arash-2','servant.arash.skill.sc-arash-3','servant.arcueid.skill.sc-arcueid-1','servant.arcueid.skill.sc-arcueid-2','servant.arcueid.skill.sc-arcueid-3','servant.arjuna.skill.sc-arjuna-2','servant.arjuna.skill.sc-arjuna-3','servant.ashva.skill.sc-ashva-1','servant.ashva.skill.sc-ashva-2','servant.ashva.skill.sc-ashva-3','servant.astolfo.skill.sc-astolfo-2','servant.astolfo.skill.sc-astolfo-3']; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e])); for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.arash.skill.sc-arash-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:stella_servant_death_rule'); expect((byId.get('servant.arjuna.skill.sc-arjuna-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:world_reset_event_rule'); expect((byId.get('servant.astolfo.skill.sc-astolfo-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:attribute_attack_close_choice_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the thirteen-ID Angra/Astraea/Atalanta/Baobhan/Barghest batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.angra.skill.sc-angra-1","servant.angra.skill.sc-angra-2","servant.angra.skill.sc-angra-3","servant.astraea.skill.sc-astraea-1","servant.astraea.skill.sc-astraea-2","servant.astraea.skill.sc-astraea-3","servant.atalanta.skill.sc-atalanta-3","servant.baobhan.skill.sc-baobhan-1","servant.baobhan.skill.sc-baobhan-2","servant.baobhan.skill.sc-baobhan-3","servant.barghest.skill.sc-barghest-1","servant.barghest.skill.sc-barghest-2","servant.barghest.skill.sc-barghest-3"]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e])); for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    for(const id of ['servant.atalanta.skill.sc-atalanta-3','servant.baobhan.skill.sc-baobhan-3']) expect((byId.get(id) as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:independent_action_rule'); expect((byId.get('servant.angra.skill.sc-angra-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:avenger_discard_vp_steal_rule'); expect((byId.get('servant.barghest.skill.sc-barghest-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:drawn_cards_play_lock_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Benkei/Billy/Boudica/Bradamante/Brynhildr batch as four generic and eleven reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.benkei.skill.sc-benkei-1","servant.benkei.skill.sc-benkei-2","servant.benkei.skill.sc-benkei-3","servant.billy.skill.sc-billy-1","servant.billy.skill.sc-billy-2","servant.billy.skill.sc-billy-3","servant.boudica.skill.sc-boudica-1","servant.boudica.skill.sc-boudica-2","servant.boudica.skill.sc-boudica-3","servant.bradamante.skill.sc-bradamante-1","servant.bradamante.skill.sc-bradamante-2","servant.bradamante.skill.sc-bradamante-3","servant.brynhildr.skill.sc-brynhildr-1","servant.brynhildr.skill.sc-brynhildr-2","servant.brynhildr.skill.sc-brynhildr-3"]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e])); const generic=['servant.benkei.skill.sc-benkei-1','servant.boudica.skill.sc-boudica-3','servant.bradamante.skill.sc-bradamante-1','servant.brynhildr.skill.sc-brynhildr-1']; for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);} for(const id of ids.filter((id:string)=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.benkei.skill.sc-benkei-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:skill_copy_lifecycle_rule'); expect((byId.get('servant.billy.skill.sc-billy-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:repeat_hidden_play_draw_rule'); expect((byId.get('servant.brynhildr.skill.sc-brynhildr-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:love_bond_vp_rule'); expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the thirteen-ID Caenis/Caligula/Carmilla/Chloe/Clytie batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any;
    const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=[
      'servant.caenis.skill.sc-caenis-1','servant.caenis.skill.sc-caenis-2','servant.caenis.skill.sc-caenis-3',
      'servant.caligula.skill.sc-caligula-2','servant.caligula.skill.sc-caligula-3',
      'servant.carmilla.skill.sc-carmilla-1','servant.carmilla.skill.sc-carmilla-2','servant.carmilla.skill.sc-carmilla-3',
      'servant.chloe.skill.sc-chloe-2','servant.chloe.skill.sc-chloe-3',
      'servant.clytie.skill.sc-clytie-1','servant.clytie.skill.sc-clytie-2','servant.clytie.skill.sc-clytie-4',
    ];
    const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of ids){
      expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');
      expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');
    }
    expect((byId.get('servant.caenis.skill.sc-caenis-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:caenis_poseidon_favor_rule');
    expect((byId.get('servant.caligula.skill.sc-caligula-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:caligula_madness_spread_rule');
    expect((byId.get('servant.carmilla.skill.sc-carmilla-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:carmilla_torture_rule');
    expect((byId.get('servant.chloe.skill.sc-chloe-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:chloe_kanshou_bakuya_rule');
    expect((byId.get('servant.clytie.skill.sc-clytie-4') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:foreign_life_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Constantine/Corday/Cu/Cu Alter/Dantes batch with two reusable generics and thirteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any;
    const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=[
      'servant.constantine.skill.sc-constantine-1','servant.constantine.skill.sc-constantine-2','servant.constantine.skill.sc-constantine-3',
      'servant.corday.skill.sc-corday-1','servant.corday.skill.sc-corday-2','servant.corday.skill.sc-corday-3',
      'servant.cu-alter.skill.sc-cu-alter-1','servant.cu-alter.skill.sc-cu-alter-2','servant.cu-alter.skill.sc-cu-alter-3',
      'servant.cu.skill.sc-cu-1','servant.cu.skill.sc-cu-2','servant.cu.skill.sc-cu-np',
      'servant.dantes.skill.sc-dantes-1','servant.dantes.skill.sc-dantes-2','servant.dantes.skill.sc-dantes-3',
    ];
    const generic=['servant.constantine.skill.sc-constantine-1','servant.cu.skill.sc-cu-2'];
    const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.constantine.skill.sc-constantine-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:constantine_triple_walls_rule');
    expect((byId.get('servant.corday.skill.sc-corday-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule');
    expect((byId.get('servant.cu-alter.skill.sc-cu-alter-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:cu_alter_curruid_residual_rule');
    expect((byId.get('servant.cu.skill.sc-cu-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:cu_gae_bolg_rule');
    expect((byId.get('servant.dantes.skill.sc-dantes-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:dantes_enfer_reveal_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Danzou/Darius/Diarmuid/Dioscuri/DonQuixote/Douman batch with two reusable generics and thirteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.danzou.skill.sc-danzou-1","servant.danzou.skill.sc-danzou-2","servant.danzou.skill.sc-danzou-3","servant.darius.skill.sc-darius-4","servant.diarmuid.skill.sc-diarmuid-2","servant.diarmuid.skill.sc-diarmuid-3","servant.dioscuri.skill.sc-dioscuri-1","servant.dioscuri.skill.sc-dioscuri-2","servant.dioscuri.skill.sc-dioscuri-3","servant.donquixote.skill.sc-donquixote-1","servant.donquixote.skill.sc-donquixote-2","servant.donquixote.skill.sc-donquixote-3","servant.douman.skill.sc-douman-1","servant.douman.skill.sc-douman-2","servant.douman.skill.sc-douman-3"]; const generic=['servant.diarmuid.skill.sc-diarmuid-3','servant.donquixote.skill.sc-donquixote-3']; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.danzou.skill.sc-danzou-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:hand_discard_sum_defeat_rule'); expect((byId.get('servant.danzou.skill.sc-danzou-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule');
    expect((byId.get('servant.darius.skill.sc-darius-4') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:undead_army_half_close_rule'); expect((byId.get('servant.diarmuid.skill.sc-diarmuid-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:noble_phantasm_suppression_rule');
    expect((byId.get('servant.dioscuri.skill.sc-dioscuri-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:dual_servant_rule'); expect((byId.get('servant.donquixote.skill.sc-donquixote-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:event_printed_vp_adjustment_rule'); expect((byId.get('servant.douman.skill.sc-douman-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:reverse_effect_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Drake/Edison/Elizabeth/EMIYA/Enkidu/Ereshkigal/Frank batch as four reusable generics and twelve reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any;
    const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=["servant.drake.skill.sc-drake-1","servant.edison.skill.sc-edison-1","servant.elizabeth.skill.sc-elizabeth-1","servant.elizabeth.skill.sc-elizabeth-2","servant.elizabeth.skill.sc-elizabeth-3","servant.emiya.skill.sc-emiya-1","servant.emiya.skill.sc-emiya-2","servant.enkidu.skill.sc-enkidu-1","servant.enkidu.skill.sc-enkidu-2","servant.enkidu.skill.sc-enkidu-3","servant.ereshkigal.skill.sc-ereshkigal-1","servant.ereshkigal.skill.sc-ereshkigal-2","servant.ereshkigal.skill.sc-ereshkigal-3","servant.frank.skill.sc-frank-1","servant.frank.skill.sc-frank-2","servant.frank.skill.sc-frank-3"];
    const generic=["servant.drake.skill.sc-drake-1","servant.emiya.skill.sc-emiya-1","servant.enkidu.skill.sc-enkidu-3","servant.ereshkigal.skill.sc-ereshkigal-1"];
    const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.elizabeth.skill.sc-elizabeth-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:volume_counter_rule');
    expect((byId.get('servant.enkidu.skill.sc-enkidu-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:bound_opponent_rule');
    expect((byId.get('servant.ereshkigal.skill.sc-ereshkigal-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:netherworld_blessing_rule');
    expect((byId.get('servant.frank.skill.sc-frank-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:played_attack_cost_sum_power_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Gareth/Georgios/Gil/Gilles/Gorgon/Hassan batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any;
    const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=["servant.gareth.skill.sc-gareth-1","servant.gareth.skill.sc-gareth-2","servant.gareth.skill.sc-gareth-3","servant.georgios.skill.sc-georgios-1","servant.georgios.skill.sc-georgios-2","servant.georgios.skill.sc-georgios-3","servant.gil.skill.sc-gil-1","servant.gil.skill.sc-gil-2","servant.gil.skill.sc-gil-np","servant.gilles.skill.sc-gilles-1","servant.gilles.skill.sc-gilles-2","servant.gilles.skill.sc-gilles-np","servant.gorgon.skill.sc-gorgon-1","servant.hassan.skill.sc-hassan-1","servant.hassan.skill.sc-hassan-2","servant.hassan.skill.sc-hassan-np"];
    const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.gil.skill.sc-gil-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:gate_of_babylon_rule');
    expect((byId.get('servant.hassan.skill.sc-hassan-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule');
    expect((byId.get('servant.gareth.skill.sc-gareth-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:gareth_wolf_never_sleeps_rule');
    expect((byId.get('servant.gilles.skill.sc-gilles-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:territory_construction_scaling_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID HassanHF/HassanSer/Helena/Hephaistion/Herc/Hijikata batch as one reusable generic and fifteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.hassanhf.skill.sc-hassanhf-1","servant.hassanhf.skill.sc-hassanhf-2","servant.hassanhf.skill.sc-hassanhf-3","servant.hassanser.skill.sc-hassanser-1","servant.hassanser.skill.sc-hassanser-2","servant.hassanser.skill.sc-hassanser-3","servant.helena.skill.sc-helena-2","servant.hephaistion.skill.sc-hephaistion-1","servant.hephaistion.skill.sc-hephaistion-2","servant.hephaistion.skill.sc-hephaistion-3","servant.herc.skill.sc-herc-1","servant.herc.skill.sc-herc-2","servant.herc.skill.sc-herc-3","servant.hijikata.skill.sc-hijikata-1","servant.hijikata.skill.sc-hijikata-2","servant.hijikata.skill.sc-hijikata-3"]; const generic=['servant.hephaistion.skill.sc-hephaistion-3']; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.hephaistion.skill.sc-hephaistion-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:domination_wheel_command_spell_rule');
    expect((byId.get('servant.herc.skill.sc-herc-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:twelve_labors_rule');
    expect((byId.get('servant.hijikata.skill.sc-hijikata-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:hijikata_code_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Himiko/Ibaraki/Iskandar/Ivan/Izou/Jack batch as two reusable generics and fourteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=["servant.himiko.skill.sc-himiko-1","servant.himiko.skill.sc-himiko-2","servant.himiko.skill.sc-himiko-3","servant.ibaraki.skill.sc-ibaraki-2","servant.ibaraki.skill.sc-ibaraki-3","servant.iskandar.skill.sc-iskandar-1","servant.iskandar.skill.sc-iskandar-np","servant.ivan.skill.sc-ivan-1","servant.ivan.skill.sc-ivan-2","servant.ivan.skill.sc-ivan-3","servant.izou.skill.sc-izou-1","servant.izou.skill.sc-izou-2","servant.izou.skill.sc-izou-3","servant.jack.skill.sc-jack-1","servant.jack.skill.sc-jack-2","servant.jack.skill.sc-jack-3"];
    const generic=['servant.iskandar.skill.sc-iskandar-1','servant.ivan.skill.sc-ivan-3']; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.izou.skill.sc-izou-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule');
    expect((byId.get('servant.iskandar.skill.sc-iskandar-np') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:temporary_attack_creation_rule');
    expect((byId.get('servant.himiko.skill.sc-himiko-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:oracle_choice_rule');
    expect((byId.get('servant.jack.skill.sc-jack-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:maria_the_ripper_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Jaguarman/Jeanne/JeanneAlter/Jekyll/Kagekiyo/Kama batch as one reusable generic and fourteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.jaguarman.skill.sc-jaguarman-1","servant.jaguarman.skill.sc-jaguarman-2","servant.jaguarman.skill.sc-jaguarman-3","servant.jeanne.skill.sc-jeanne-1","servant.jeanne.skill.sc-jeanne-2","servant.jeanne.skill.sc-jeanne-3","servant.jeanne-alter.skill.sc-jeanne-alter-1","servant.jeanne-alter.skill.sc-jeanne-alter-2","servant.jeanne-alter.skill.sc-jeanne-alter-3","servant.jekyll.skill.sc-jekyll-1","servant.jekyll.skill.sc-jekyll-2","servant.jekyll.skill.sc-jekyll-3","servant.kagekiyo.skill.sc-kagekiyo-1","servant.kagekiyo.skill.sc-kagekiyo-3","servant.kama.skill.sc-kama-3"]; const generic=['servant.jaguarman.skill.sc-jaguarman-1']; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.blockedBy).toEqual([]);}
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.jekyll.skill.sc-jekyll-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule');
    expect((byId.get('servant.jeanne.skill.sc-jeanne-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:ruler_command_spell_binding_rule');
    expect((byId.get('servant.jeanne-alter.skill.sc-jeanne-alter-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:avenger_movement_vp_rule');
    expect((byId.get('servant.kagekiyo.skill.sc-kagekiyo-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:kagekiyo_hidden_attack_vengeance_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Karna/KingGil/KingHassan/Kingprotea/Kintoki/Kiritsugu batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.karna.skill.sc-karna-1","servant.karna.skill.sc-karna-2","servant.karna.skill.sc-karna-3","servant.kinggil.skill.sc-kinggil-1","servant.kinggil.skill.sc-kinggil-2","servant.kinggil.skill.sc-kinggil-3","servant.kinghassan.skill.sc-kinghassan-1","servant.kinghassan.skill.sc-kinghassan-2","servant.kinghassan.skill.sc-kinghassan-3","servant.kingprotea.skill.sc-kingprotea-1","servant.kingprotea.skill.sc-kingprotea-2","servant.kingprotea.skill.sc-kingprotea-3","servant.kintoki.skill.sc-kintoki-1","servant.kintoki.skill.sc-kintoki-2","servant.kintoki.skill.sc-kintoki-3","servant.kiritsugu.skill.sc-kiritsugu-1"]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.karna.skill.sc-karna-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:karna_armor_rule');
    expect((byId.get('servant.kinggil.skill.sc-kinggil-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:territory_construction_scaling_rule');
    expect((byId.get('servant.kinghassan.skill.sc-kinghassan-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:azrael_rule');
    expect((byId.get('servant.kingprotea.skill.sc-kingprotea-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:kingprotea_growth_rule');
    expect((byId.get('servant.kintoki.skill.sc-kintoki-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:kintoki_golden_eater_rule');
    expect((byId.get('servant.kiritsugu.skill.sc-kiritsugu-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Kiyohime/Kotarou/Koyo/Kriemhild/LadyAvalon batch as reviewed-special identities with shared class-rule reuse', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills];
    const ids=["servant.kiyohime.skill.sc-kiyohime-1","servant.kiyohime.skill.sc-kiyohime-2","servant.kiyohime.skill.sc-kiyohime-3","servant.kotarou.skill.sc-kotarou-1","servant.kotarou.skill.sc-kotarou-2","servant.kotarou.skill.sc-kotarou-3","servant.koyo.skill.sc-koyo-1","servant.koyo.skill.sc-koyo-2","servant.koyo.skill.sc-koyo-3","servant.kriemhild.skill.sc-kriemhild-1","servant.kriemhild.skill.sc-kriemhild-2","servant.kriemhild.skill.sc-kriemhild-3","servant.ladyavalon.skill.sc-ladyavalon-1","servant.ladyavalon.skill.sc-ladyavalon-2","servant.ladyavalon.skill.sc-ladyavalon-3"]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.kotarou.skill.sc-kotarou-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule');
    expect((byId.get('servant.ladyavalon.skill.sc-ladyavalon-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:territory_construction_scaling_rule');
    expect((byId.get('servant.kriemhild.skill.sc-kriemhild-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:kriemhild_balmung_transfer_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Lance/Leonidas/LionKing/LiShuwen/Lobo/LuBu batch as one reusable generic and fifteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    const generic='servant.lishuwen.skill.sc-lishuwen-3'; const special=["servant.lance.skill.sc-lance-1","servant.lance.skill.sc-lance-2","servant.lance.skill.sc-lance-3","servant.leonidas.skill.sc-leonidas-2","servant.leonidas.skill.sc-leonidas-3","servant.lionking.skill.sc-lionking-1","servant.lionking.skill.sc-lionking-2","servant.lishuwen.skill.sc-lishuwen-1","servant.lishuwen.skill.sc-lishuwen-2","servant.lobo.skill.sc-lobo-1","servant.lobo.skill.sc-lobo-2","servant.lobo.skill.sc-lobo-3","servant.lubu.skill.sc-lubu-1","servant.lubu.skill.sc-lubu-2","servant.lubu.skill.sc-lubu-3"];
    expect((byId.get(generic) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(generic) as any).phase3.requiredCapabilities).toContain('GENERIC_MOVEMENT');
    for(const id of special){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.lance.skill.sc-lance-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:temporary_card_copy_rule');
    expect((byId.get('servant.lionking.skill.sc-lionking-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:alternate_vp_cost_mount_rule');
    expect((byId.get('servant.lobo.skill.sc-lobo-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:death_entangle_forced_move_rule');
    expect((byId.get('servant.lubu.skill.sc-lubu-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:noble_weapon_power_transform_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Mandricardo/Maxwell/MechaEli/Medb/Medea/Medusa batch as four generic and eleven reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    const generic=['servant.mandricardo.skill.sc-mandricardo-2','servant.mandricardo.skill.sc-mandricardo-3','servant.medb.skill.sc-medb-1','servant.medusa.skill.sc-medusa-1']; const special=['servant.mandricardo.skill.sc-mandricardo-1','servant.maxwell.skill.sc-maxwell-1','servant.maxwell.skill.sc-maxwell-2','servant.maxwell.skill.sc-maxwell-3','servant.mechaeli.skill.sc-mechaeli-1','servant.mechaeli.skill.sc-mechaeli-3','servant.medb.skill.sc-medb-2','servant.medb.skill.sc-medb-3','servant.medea.skill.sc-medea-1','servant.medea.skill.sc-medea-2','servant.medea.skill.sc-medea-np'];
    for(const id of generic) expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); for(const id of special){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.mandricardo.skill.sc-mandricardo-3') as any).phase3.requiredCapabilities).toContain('CARD_ACTION_PLAY'); expect((byId.get('servant.medb.skill.sc-medb-1') as any).phase3.requiredCapabilities).toContain('CARD_ACTION_PLAY');
    expect((byId.get('servant.maxwell.skill.sc-maxwell-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:territory_construction_scaling_rule'); expect((byId.get('servant.medea.skill.sc-medea-np') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:medea_rule_breaker_command_spell_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the fifteen-ID Meltryllis/Melusine/Mephisto/Merlin/MHX/Morgan batch as reviewed-special with shared-family reuse', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.meltryllis.skill.sc-meltryllis-1","servant.meltryllis.skill.sc-meltryllis-2","servant.meltryllis.skill.sc-meltryllis-3","servant.melusine.skill.sc-melusine-1","servant.melusine.skill.sc-melusine-2","servant.melusine.skill.sc-melusine-3","servant.mephisto.skill.sc-mephisto-1","servant.merlin.skill.sc-merlin-1","servant.merlin.skill.sc-merlin-2","servant.mhx.skill.sc-mhx-1","servant.mhx.skill.sc-mhx-2","servant.mhx.skill.sc-mhx-3","servant.morgan.skill.sc-morgan-1","servant.morgan.skill.sc-morgan-2","servant.morgan.skill.sc-morgan-3"]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.melusine.skill.sc-melusine-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:melusine_albion_replacement_rule');
    expect((byId.get('servant.melusine.skill.sc-melusine-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:dragon_heart_penalty_rule');
    expect((byId.get('servant.mephisto.skill.sc-mephisto-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:territory_construction_scaling_rule');
    expect((byId.get('servant.morgan.skill.sc-morgan-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:ruler_command_spell_binding_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Moriarty/Mozart/Napoleon/Nemo/Nightingale/Nitocris/Nobunaga batch as reviewed-special with shared-family reuse', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const ids=["servant.moriarty.skill.sc-moriarty-1","servant.moriarty.skill.sc-moriarty-2","servant.moriarty.skill.sc-moriarty-3","servant.mozart.skill.sc-mozart-3","servant.napoleon.skill.sc-napoleon-3","servant.nemo.skill.sc-nemo-1","servant.nemo.skill.sc-nemo-2","servant.nemo.skill.sc-nemo-3","servant.nightingale.skill.sc-nightingale-1","servant.nightingale.skill.sc-nightingale-2","servant.nightingale.skill.sc-nightingale-3","servant.nitocris.skill.sc-nitocris-1","servant.nitocris.skill.sc-nitocris-2","servant.nitocris.skill.sc-nitocris-3","servant.nobunaga.skill.sc-nobunaga-1","servant.nobunaga.skill.sc-nobunaga-2"]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.mozart.skill.sc-mozart-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:territory_construction_scaling_rule');
    expect((byId.get('servant.napoleon.skill.sc-napoleon-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:independent_action_rule');
    expect((byId.get('servant.moriarty.skill.sc-moriarty-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:moriarty_ultimate_crime_rule');
    expect((byId.get('servant.nobunaga.skill.sc-nobunaga-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:nobunaga_three_line_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });

  it('maps the sixteen-ID Nursery/Odysseus/OkitaAlter/Orion/Osakabe/Ozymandias batch as one Rider generic and fifteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    const generic='servant.odysseus.skill.sc-odysseus-3'; const special=["servant.nursery.skill.sc-nursery-1","servant.nursery.skill.sc-nursery-3","servant.odysseus.skill.sc-odysseus-1","servant.odysseus.skill.sc-odysseus-2","servant.okita-alt.skill.sc-okita-alt-1","servant.okita-alt.skill.sc-okita-alt-2","servant.okita-alt.skill.sc-okita-alt-3","servant.orion.skill.sc-orion-1","servant.orion.skill.sc-orion-2","servant.orion.skill.sc-orion-3","servant.osakabe.skill.sc-osakabe-1","servant.osakabe.skill.sc-osakabe-2","servant.osakabe.skill.sc-osakabe-3","servant.ozymandias.skill.sc-ozymandias-1","servant.ozymandias.skill.sc-ozymandias-3"];
    expect((byId.get(generic) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(generic) as any).phase3.requiredCapabilities).toContain('CARD_ACTION_PLAY'); expect((byId.get(generic) as any).phase3.requiredCapabilities).toContain('GENERIC_CARD_ZONE');
    for(const id of special){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.okita-alt.skill.sc-okita-alt-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:reverse_effect_rule');
    expect((byId.get('servant.nursery.skill.sc-nursery-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:nursery_round_reset_rule');
    expect((byId.get('servant.ozymandias.skill.sc-ozymandias-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:ozymandias_dendera_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the fifteen-ID Parvati/Passionlip/Penthesilea/Quetzalcoatl/Raikou/Roberts batch as one Rider generic and fourteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    const generic='servant.roberts.skill.sc-roberts-3'; const special=["servant.parvati.skill.sc-parvati-1","servant.parvati.skill.sc-parvati-2","servant.passionlip.skill.sc-passionlip-1","servant.passionlip.skill.sc-passionlip-2","servant.passionlip.skill.sc-passionlip-3","servant.penthesilea.skill.sc-penthesilea-1","servant.penthesilea.skill.sc-penthesilea-2","servant.penthesilea.skill.sc-penthesilea-3","servant.quetzalcoatl.skill.sc-quetzalcoatl-1","servant.quetzalcoatl.skill.sc-quetzalcoatl-2","servant.quetzalcoatl.skill.sc-quetzalcoatl-3","servant.raikou.skill.sc-raikou-1","servant.raikou.skill.sc-raikou-2","servant.raikou.skill.sc-raikou-3"];
    expect((byId.get(generic) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(generic) as any).phase3.requiredCapabilities).toContain('CARD_ACTION_PLAY');
    for(const id of special){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.passionlip.skill.sc-passionlip-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:reverse_effect_rule'); expect((byId.get('servant.quetzalcoatl.skill.sc-quetzalcoatl-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:quetzalcoatl_winged_move_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the fifteen-ID Romulus/Ryouma/Saber/Saitou/Salieri batch as three generics and twelve reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    const generic=['servant.romulus.skill.sc-romulus-3','servant.saber.skill.sc-saber-1','servant.saitou.skill.sc-saitou-1']; const special=["servant.romulus.skill.sc-romulus-1","servant.romulus.skill.sc-romulus-2","servant.ryouma.skill.sc-ryouma-1","servant.ryouma.skill.sc-ryouma-2","servant.ryouma.skill.sc-ryouma-3","servant.saber.skill.sc-saber-2","servant.saber.skill.sc-saber-np","servant.saitou.skill.sc-saitou-2","servant.saitou.skill.sc-saitou-3","servant.salieri.skill.sc-salieri-1","servant.salieri.skill.sc-salieri-2","servant.salieri.skill.sc-salieri-3"];
    for(const id of generic) expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
    expect((byId.get('servant.romulus.skill.sc-romulus-3') as any).phase3.requiredCapabilities).toContain('GENERIC_MOVEMENT');
    for(const id of ['servant.saber.skill.sc-saber-1','servant.saitou.skill.sc-saitou-1']) { expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('GENERIC_POWER'); expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('GENERIC_RESOURCE_NUMERIC'); }
    for(const id of special){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.romulus.skill.sc-romulus-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:romulus_roman_disarm_rule'); expect((byId.get('servant.saber.skill.sc-saber-np') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:saber_excalibur_climax_rule'); expect((byId.get('servant.salieri.skill.sc-salieri-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:salieri_oblivion_correction_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the fifteen-ID Sanson/Sanzang/Sasaki/Scathach/Sei batch as reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e])); const ids=["servant.sanson.skill.sc-sanson-1","servant.sanson.skill.sc-sanson-2","servant.sanson.skill.sc-sanson-3","servant.sanzang.skill.sc-sanzang-1","servant.sanzang.skill.sc-sanzang-2","servant.sanzang.skill.sc-sanzang-3","servant.sasaki.skill.sc-sasaki-1","servant.sasaki.skill.sc-sasaki-2","servant.sasaki.skill.sc-sasaki-3","servant.scathach.skill.sc-scathach-1","servant.scathach.skill.sc-scathach-2","servant.scathach.skill.sc-scathach-3","servant.sei.skill.sc-sei-1","servant.sei.skill.sc-sei-2","servant.sei.skill.sc-sei-3"];
    for(const id of ids){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.sanson.skill.sc-sanson-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:sanson_judgment_day_rule'); expect((byId.get('servant.sanzang.skill.sc-sanzang-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:sanzang_golden_cicada_rule'); expect((byId.get('servant.scathach.skill.sc-scathach-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:scathach_wisdom_rule'); expect((byId.get('servant.sei.skill.sc-sei-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:sei_pillow_book_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the fifteen-ID Semiramis/Shakespeare/Shuten/Sitonai/Skadi batch as two generics and thirteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e])); const generic=['servant.semiramis.skill.sc-semiramis-2','servant.shakespeare.skill.sc-shakespeare-1']; const special=["servant.semiramis.skill.sc-semiramis-1","servant.semiramis.skill.sc-semiramis-3","servant.shakespeare.skill.sc-shakespeare-2","servant.shakespeare.skill.sc-shakespeare-3","servant.shuten.skill.sc-shuten-1","servant.shuten.skill.sc-shuten-2","servant.shuten.skill.sc-shuten-3","servant.sitonai.skill.sc-sitonai-1","servant.sitonai.skill.sc-sitonai-2","servant.sitonai.skill.sc-sitonai-3","servant.skadi.skill.sc-skadi-1","servant.skadi.skill.sc-skadi-2","servant.skadi.skill.sc-skadi-3"];
    for(const id of generic){expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('GENERIC_RESOURCE_NUMERIC');}
    for(const id of special){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.semiramis.skill.sc-semiramis-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule'); expect((byId.get('servant.sitonai.skill.sc-sitonai-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:reverse_effect_rule'); expect((byId.get('servant.skadi.skill.sc-skadi-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:skadi_castle_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the sixteen-ID Spartacus/Stheno/Suzuka/Taisui/Tamamo/Teach batch as one Rider generic and fifteen reviewed-special identities', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    const generic='servant.teach.skill.sc-teach-3'; const special=["servant.spartacus.skill.sc-spartacus-1","servant.spartacus.skill.sc-spartacus-3","servant.stheno.skill.sc-stheno-1","servant.stheno.skill.sc-stheno-3","servant.suzuka.skill.sc-suzuka-1","servant.suzuka.skill.sc-suzuka-2","servant.suzuka.skill.sc-suzuka-3","servant.taisui.skill.sc-taisui-1","servant.taisui.skill.sc-taisui-2","servant.taisui.skill.sc-taisui-3","servant.tamamo.skill.sc-tamamo-1","servant.tamamo.skill.sc-tamamo-2","servant.tamamo.skill.sc-tamamo-3","servant.teach.skill.sc-teach-1","servant.teach.skill.sc-teach-2"];
    expect((byId.get(generic) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION'); expect((byId.get(generic) as any).phase3.requiredCapabilities).toContain('CARD_ACTION_PLAY');
    for(const id of special){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    expect((byId.get('servant.stheno.skill.sc-stheno-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:presence_concealment_assassination_rule'); expect((byId.get('servant.taisui.skill.sc-taisui-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:reverse_effect_rule'); expect((byId.get('servant.spartacus.skill.sc-spartacus-1') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:spartacus_rebellion_rule'); expect((byId.get('servant.tamamo.skill.sc-tamamo-3') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:tamamo_transcendence_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688);
  });
  it('maps the final twenty-three-ID batch as two generics and twenty-one reviewed-special identities with zero evidence blockers', () => {
    const inventory=JSON.parse(readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'),'utf8')) as any; const entries=[...inventory.staticSkills,...inventory.dynamicSkills]; const byId=new Map(entries.map((e:any)=>[e.canonicalAbilityId,e]));
    const ids=["servant.tesla.skill.sc-tesla-1","servant.tesla.skill.sc-tesla-2","servant.tesla.skill.sc-tesla-3","servant.tezcat.skill.sc-tezcat-1","servant.tezcat.skill.sc-tezcat-2","servant.tezcat.skill.sc-tezcat-3","servant.tomoe.skill.sc-tomoe-1","servant.tomoe.skill.sc-tomoe-2","servant.tomoe.skill.sc-tomoe-3","servant.tristan.skill.sc-tristan-1","servant.tristan.skill.sc-tristan-2","servant.tristan.skill.sc-tristan-3","servant.ushiwakamaru.skill.sc-ushiwakamaru-1","servant.ushiwakamaru.skill.sc-ushiwakamaru-2","servant.ushiwakamaru.skill.sc-ushiwakamaru-3","servant.valkyrie.skill.sc-valkyrie-1","servant.valkyrie.skill.sc-valkyrie-2","servant.vlad.skill.sc-vlad-1","servant.vlad.skill.sc-vlad-2","servant.vlad.skill.sc-vlad-3","servant.xiangyu.skill.sc-xiangyu-1","servant.xiangyu.skill.sc-xiangyu-2","servant.xiangyu.skill.sc-xiangyu-3"]; const generic=['servant.ushiwakamaru.skill.sc-ushiwakamaru-3','servant.vlad.skill.sc-vlad-3'];
    for(const id of generic) expect((byId.get(id) as any).phase3.classificationRoute).toBe('READY_GENERIC_EXTENSION');
    for(const id of ids.filter(id=>!generic.includes(id))){expect((byId.get(id) as any).phase3.classificationRoute).toBe('SPECIAL_HANDLER_CANDIDATE');expect((byId.get(id) as any).phase3.requiredCapabilities).toContain('REVIEWED_SPECIAL_HANDLER');}
    for(const id of ['servant.tomoe.skill.sc-tomoe-1','servant.tristan.skill.sc-tristan-3']) expect((byId.get(id) as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:independent_action_rule');
    expect((byId.get('servant.tesla.skill.sc-tesla-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:tesla_lightning_descent_rule'); expect((byId.get('servant.xiangyu.skill.sc-xiangyu-2') as any).phase3.blockedBy).toContain('SPECIAL_EFFECT:xiangyu_overlord_martial_rule');
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(254); expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(688); expect(inventory.capabilitySummary.classificationRouteCounts.SOURCE_EVIDENCE_REQUIRED).toBe(0);
  });
  it('bridges current semantic card IDs to stable canonical IDs only by exact ID or unique owner/name identity', () => {
    const inventory = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-ability-inventory.json'), 'utf8'),
    ) as any;
    const entries = [...inventory.staticSkills, ...inventory.dynamicSkills];
    const byId = new Map(entries.map((entry: any) => [entry.canonicalAbilityId, entry]));

    const conversion = byId.get('master.irisviel.skill.s2') as any;
    const timeAlter = byId.get('master.kiritsugu.skill.s2') as any;
    expect(conversion.phase3.currentRoute).toBe('new');
    expect(conversion.phase3.routeEvidence.currentIdentityMatch).toBe('owner_name');
    expect(conversion.phase3.routeEvidence.currentAcceptanceContracts).toEqual([
      'CARD_ZONE_CORE_DIRECT_ACTION',
    ]);
    expect(conversion.phase3.inheritedAcceptanceContracts).toEqual([
      'CARD_ZONE_CORE_DIRECT_ACTION',
    ]);
    expect(conversion.phase3.classificationRoute).toBe('READY_EXISTING_CONTRACT');
    expect(timeAlter.phase3.currentRoute).toBe('new');
    expect(timeAlter.phase3.routeEvidence.currentIdentityMatch).toBe('owner_name');
    expect(timeAlter.phase3.routeEvidence.currentAcceptanceContracts).toEqual([
      'CARD_ACTION_SEMANTICS_MINIMAL_PLAY',
    ]);
    expect(timeAlter.phase3.inheritedAcceptanceContracts).toEqual(['CARD_ACTION_SEMANTICS_MINIMAL_PLAY']);
    expect(timeAlter.phase3.classificationRoute).toBe('READY_EXISTING_CONTRACT');
  });

  it('keeps all five independent Card Action capabilities and tracks all grounded Card Action Activate users', () => {
    const catalog = JSON.parse(
      readFileSync(resolve('data/phase3/full-roster-capability-catalog.json'), 'utf8'),
    ) as any;
    const capabilityIds = new Set(catalog.capabilities.map((entry: any) => entry.id));

    for (const capability of [
      'CARD_ACTION_PLAY',
      'CARD_ACTION_ADD_TO_ATTACK',
      'CARD_ACTION_CREATE_AND_ACTIVATE',
      'CARD_ACTION_ACTIVATE',
      'CARD_ACTION_CLOSE',
    ]) {
      expect(capabilityIds.has(capability)).toBe(true);
    }
    expect(
      catalog.capabilities.find((entry: any) => entry.id === 'CARD_ACTION_ACTIVATE').eligibleAbilities,
    ).toEqual(['master.caules-yggdmillennia.skill.s2','master.fujino.skill.s3','master.iliya.skill.s2','master.kariya.skill.s3','master.kiara.skill.s1','master.maiya.skill.s1','master.ryuunosuke.skill.s1','master.sakura.skill.s1','master.sakura.skill.s2','master.shinji.skill.s2']);
  });
});
