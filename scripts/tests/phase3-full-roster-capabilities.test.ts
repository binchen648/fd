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
    expect(inventory.capabilitySummary.contractMappedCount).toBe(120);
    expect(inventory.capabilitySummary.explicitBlockCount).toBe(824);
    expect(inventory.capabilitySummary.zeroSilentFallback).toBe(true);
    expect(catalog.coverage.mappedAbilities).toHaveLength(120);
    expect(catalog.coverage.blockedAbilities).toHaveLength(824);
    expect(catalog.coverage.mappedAbilities.length + catalog.coverage.blockedAbilities.length).toBe(944);

    const allowedCurrentRoutes = new Set(['legacy', 'new', 'dual', 'none']);
    const allowedReferenceRoutes = new Set(['deterministic', 'shared_handler', 'specific_handler', 'none']);
    for (const entry of entries) {
      expect(allowedCurrentRoutes.has(entry.phase3.currentRoute)).toBe(true);
      expect(allowedReferenceRoutes.has(entry.phase3.referenceRoute)).toBe(true);
      expect(['CONTRACT_MAPPED', 'EXPLICIT_BLOCK']).toContain(entry.phase3.mappingStatus);
    }

    expect(markdown).toContain('totalIdentityCount=944');
    expect(markdown).toContain('contractMappedCount=120');
    expect(markdown).toContain('explicitBlockCount=824');
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(0);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(0);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(0);
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
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_EXISTING_CONTRACT).toBe(0);
    expect(inventory.capabilitySummary.classificationRouteCounts.READY_GENERIC_EXTENSION).toBe(89);
    expect(inventory.capabilitySummary.classificationRouteCounts.SPECIAL_HANDLER_CANDIDATE).toBe(31);
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
    expect(conversion.phase3.inheritedAcceptanceContracts).toEqual([]);
    expect(timeAlter.phase3.currentRoute).toBe('new');
    expect(timeAlter.phase3.routeEvidence.currentIdentityMatch).toBe('owner_name');
    expect(timeAlter.phase3.routeEvidence.currentAcceptanceContracts).toEqual([
      'CARD_ACTION_SEMANTICS_MINIMAL_PLAY',
    ]);
    expect(timeAlter.phase3.inheritedAcceptanceContracts).toEqual([]);
  });

  it('keeps all five independent Card Action capabilities in the generated catalog even when one has zero eligible identities', () => {
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
    ).toEqual([]);
  });
});
