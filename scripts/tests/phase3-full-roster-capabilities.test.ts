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
    expect(inventory.capabilitySummary.contractMappedCount).toBe(290);
    expect(inventory.capabilitySummary.explicitBlockCount).toBe(654);
    expect(inventory.capabilitySummary.zeroSilentFallback).toBe(true);
    expect(catalog.coverage.mappedAbilities).toHaveLength(290);
    expect(catalog.coverage.blockedAbilities).toHaveLength(654);
    expect(catalog.coverage.mappedAbilities.length + catalog.coverage.blockedAbilities.length).toBe(944);

    const allowedCurrentRoutes = new Set(['legacy', 'new', 'dual', 'none']);
    const allowedReferenceRoutes = new Set(['deterministic', 'shared_handler', 'specific_handler', 'none']);
    for (const entry of entries) {
      expect(allowedCurrentRoutes.has(entry.phase3.currentRoute)).toBe(true);
      expect(allowedReferenceRoutes.has(entry.phase3.referenceRoute)).toBe(true);
      expect(['CONTRACT_MAPPED', 'EXPLICIT_BLOCK']).toContain(entry.phase3.mappingStatus);
    }

    expect(markdown).toContain('totalIdentityCount=944');
    expect(markdown).toContain('contractMappedCount=290');
    expect(markdown).toContain('explicitBlockCount=654');
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
    expect(byId.get('master.chaos.skill.s17').phase3.classificationRoute).toBe('SOURCE_EVIDENCE_REQUIRED');
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(180);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(108);
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
    ).toEqual(['master.caules-yggdmillennia.skill.s2','master.iliya.skill.s2','master.kariya.skill.s3','master.maiya.skill.s1','master.ryuunosuke.skill.s1','master.sakura.skill.s1','master.sakura.skill.s2','master.shinji.skill.s2']);
  });
});
