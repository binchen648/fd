import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertOutputOutsideReference } from './build-full-roster-inventory';
import { assertFullRosterInventory } from './inventory-schema';
import {
  loadSourceEvidenceOverlayCards,
  type SemanticAxes,
  type SemanticNormalizedInventory,
  type StructuredAbility,
  type StructuredAuthoringCard,
} from './normalize-semantic-axes';
import { verifyReferenceRoot } from './verify-reference';

const AUTHORING_CARDS_PATH = 'src/content/authoring/cards.json';
const DEFAULT_INVENTORY_PATH = 'data/phase3/full-roster-ability-inventory.json';
const DEFAULT_CATALOG_PATH = 'data/phase3/full-roster-capability-catalog.json';
const DEFAULT_MARKDOWN_PATH = 'docs/audits/fd-full-roster-capability-catalog.md';
const CURRENT_AUTHORING_ROOTS = ['data/authoring/masters', 'data/authoring/servants'];

export type CapabilityStructuredAbility = StructuredAbility;
export type CurrentRoute = 'legacy' | 'new' | 'dual' | 'none';
export type ReferenceRoute = 'deterministic' | 'shared_handler' | 'specific_handler' | 'none';
export type MappingRoute =
  | 'READY_EXISTING_CONTRACT'
  | 'READY_GENERIC_EXTENSION'
  | 'SPECIAL_HANDLER_CANDIDATE'
  | 'RULE_DECISION_REQUIRED'
  | 'SOURCE_EVIDENCE_REQUIRED'
  | 'PHASE_DEPENDENCY_BLOCKED'
  | 'REFERENCE_RUNTIME_CONFLICT';

interface CurrentAuthoringCard {
  id: string;
  ownerId: string;
  name: string;
  abilityIds: string[];
}

interface CapabilityNeedResult {
  requiredCapabilities: string[];
  mechanicFamilies: string[];
  specialReasons: string[];
}

interface Phase3MappingRecord {
  mechanicFamilies: string[];
  requiredCapabilities: string[];
  currentRoute: CurrentRoute;
  referenceRoute: ReferenceRoute;
  inheritedAcceptanceContracts: string[];
  partialAcceptanceContracts: string[];
  classificationRoute: MappingRoute;
  mappingStatus: 'CONTRACT_MAPPED' | 'EXPLICIT_BLOCK';
  blockedBy: string[];
  routeEvidence: {
    currentAbilityIds: string[];
    currentAcceptanceContracts: string[];
    currentIdentityMatch?: 'exact_id' | 'owner_name';
    referenceHandlerId?: string;
  };
}

interface CapabilityMappedEntry {
  canonicalAbilityId: string;
  canonicalCardId: string;
  [key: string]: unknown;
  phase3: Phase3MappingRecord;
}

export interface CapabilityMappedInventory {
  [key: string]: unknown;
  capabilitySummary: {
    totalIdentityCount: number;
    contractMappedCount: number;
    explicitBlockCount: number;
    currentRouteCounts: Record<CurrentRoute, number>;
    referenceRouteCounts: Record<ReferenceRoute, number>;
    classificationRouteCounts: Record<MappingRoute, number>;
    zeroSilentFallback: true;
  };
  staticSkills: CapabilityMappedEntry[];
  dynamicSkills: CapabilityMappedEntry[];
}

interface CapabilityTemplate {
  id: string;
  category: 'existing_contract' | 'generic_request' | 'reviewed_special';
  mechanicFamily: string;
  input: string[];
  output: string[];
  events: string[];
  resultBinding: string[];
  transactionBehavior: string;
  eligibilityAxes: string[];
  invalidatingAxes: string[];
  representatives: string[];
  acceptanceVehicle: string;
}

interface CapabilityCatalogEntry extends CapabilityTemplate {
  eligibleAbilities: string[];
  partialAbilities: string[];
  skippedAbilities: Array<{ abilityId: string; reason: string }>;
}

export interface FullRosterCapabilityCatalog {
  schemaVersion: 1;
  kind: 'phase3-full-roster-capability-catalog';
  provenance: {
    referenceRepository: string;
    referenceCommit: string;
    inventoryKind: string;
  };
  summary: CapabilityMappedInventory['capabilitySummary'] & {
    capabilityCount: number;
  };
  capabilities: CapabilityCatalogEntry[];
  coverage: {
    mappedAbilities: string[];
    blockedAbilities: Array<{ abilityId: string; route: MappingRoute; blockedBy: string[] }>;
    specialCandidates: string[];
  };
}

const CURRENT_CONTRACT_BY_ABILITY: Readonly<Record<string, string>> = Object.freeze({
  'command-spell.gain-mana': 'RESOURCE_NUMERIC_CORE_DIRECT_ACTION',
  'conversion-magic.preparation': 'CARD_ZONE_CORE_DIRECT_ACTION',
  'time-alter.action': 'CARD_ACTION_SEMANTICS_MINIMAL_PLAY',
  'volumen.extra-play': 'CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE',
  'astronomical-science.first-loss': 'CARD_ACTION_SEMANTICS_MINIMAL_ACTIVATE',
  'military.attach-support-shot': 'CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK',
  'sc-artoria-alt-2.angra-mainyu-embrace': 'CARD_ACTION_SEMANTICS_MINIMAL_CLOSE',
  'sc-kintoki-3.golden-eater': 'RESULT_BINDING_PHASE3A',
  'sc-tomoe-1.independent-action': 'RESOURCE_NUMERIC_CORE_DIRECT_ACTION',
});

const RESOURCE_EFFECTS = new Set([
  'GAIN_MANA',
  'LOSE_MANA',
  'SET_MANA',
  'TRANSFER_MANA',
  'GAIN_VICTORY_POINTS',
  'LOSE_VICTORY_POINTS',
  'TRANSFER_VICTORY_POINTS',
  'SWAP_VICTORY_POINTS',
  'ADJUST_COMMAND_SEALS',
]);

const DIRECT_RESOURCE_CONTRACT_EFFECTS = new Set([
  'GAIN_MANA',
  'LOSE_MANA',
  'SET_MANA',
  'TRANSFER_MANA',
  'GAIN_VICTORY_POINTS',
  'LOSE_VICTORY_POINTS',
  'TRANSFER_VICTORY_POINTS',
]);

const CARD_ZONE_EFFECTS = new Set([
  'CHARGE_SELECTED_SKILL_ATTACK',
  'DRAW_CARDS',
  'MOVE_MATCHING_CARDS',
  'MOVE_SOURCE_CARD',
  'MOVE_SELECTED_CARDS',
  'MOVE_MATCHING_EVENTS',
  'MOVE_SELECTED_EVENTS',
  'REMOVE_CARDS_IN_ZONE',
  'REMOVE_SELECTED_CARDS',
  'RETURN_CARD_BY_DEFINITION',
  'SHUFFLE_EVENT_DECK',
  'SET_SELECTED_CARDS_FACE',
  'TRANSFER_MATCHING_CARDS',
  'TRANSFER_SELECTED_CARDS',
  'REPLACE_SELECTED_EVENT_FROM_DECK',
]);

const STATUS_EFFECTS = new Set([
  'ADD_LINKED_STATUS',
  'ADD_STATUS',
  'REMOVE_LINKED_STATUS',
  'REMOVE_STATUS',
  'SET_PLAYER_FLAG',
  'CLEAR_PLAYER_FLAG',
  'ADD_PLAYER_FLAG_NUMBER',
]);

const SPECIAL_EFFECTS = new Set([
  'CHARGE_SELECTED_SKILL_ATTACK',
  'CYCLE_STATE_TRANSITION',
  'LINKED_PLAYER_BATTLE_REWARD',
  'LINKED_PLAYER_MANA_CONTRIBUTION',
  'PREVENT_ELIMINATION',
  'REPEAT_REPLACEMENT_WINDOW',
  'SCHEDULE_PHASE_EFFECT',
  'SHARED_VICTORY_LINK',
  'SWAP_VICTORY_POINTS',
  'DEFEAT_PLAYER',
  'EVENT_CARD_RULE',
  'FINISH_GAME',
  'GRANT_LINKED_ABILITY_TO_ATTRIBUTE_ATTACKS',
  'SEED_ATTACHED_SUPPLY',
  'DEMON_GOD_RULE',
  'DECK_ENTRY_REPLACEMENT',
  'LOCATION_TOKEN_RULE',
  'LOSTBELT_EXPANSION',
  'NPC_RULE',
  'SECRET_ROUND_BINDING',
  'SERVANT_OWNERSHIP_RULE',
  'ASTRONOMICAL_SPHERE_RULE',
  'TERRAIN_POSITION_ADJUSTMENT',
  'RETRIGGER_CARD_PLAY_EFFECTS',
  'SEQUESTER_RANDOM_INACTIVE_SERVANT_SKILL',
]);

const EVENT_DECK_EFFECTS = new Set([
  'ENSURE_EVENT_DECK_COUNT',
  'EVENT_CARD_RULE',
  'LOSTBELT_EXPANSION',
  'MOVE_MATCHING_EVENTS',
  'MOVE_SELECTED_EVENTS',
  'REPLACE_SELECTED_EVENT_FROM_DECK',
  'SHUFFLE_EVENT_DECK',
  'SWAP_SELECTED_EVENT_LOCATIONS',
]);

const EXISTING_CONTRACT_INVALIDATORS: Readonly<Record<string, Array<keyof SemanticAxes>>> = Object.freeze({
  RESOURCE_NUMERIC_CORE_DIRECT_ACTION: [
    'trigger',
    'cost',
    'target',
    'interaction',
    'lifecycle',
    'modifier',
    'visibility',
    'binding',
    'battle',
  ],
  CARD_ZONE_CORE_DIRECT_ACTION: ['trigger', 'cost', 'lifecycle', 'modifier', 'battle'],
  CARD_ACTION_SEMANTICS_MINIMAL_PLAY: ['trigger', 'lifecycle', 'modifier', 'battle'],
  CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE: ['battle', 'modifier'],
  CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK: ['trigger', 'lifecycle', 'modifier', 'battle'],
  CARD_ACTION_SEMANTICS_MINIMAL_ACTIVATE: ['interaction', 'modifier'],
  CARD_ACTION_SEMANTICS_MINIMAL_CLOSE: ['interaction', 'modifier'],
  RESULT_BINDING_PHASE3A: ['lifecycle', 'modifier', 'battle'],
});

const CAPABILITY_TEMPLATES: Readonly<Record<string, CapabilityTemplate>> = Object.freeze({
  RESOURCE_NUMERIC_CORE_DIRECT_ACTION: {
    id: 'RESOURCE_NUMERIC_CORE_DIRECT_ACTION',
    category: 'existing_contract',
    mechanicFamily: 'RESOURCE_NUMERIC',
    input: ['controller', 'numeric resource delta'],
    output: ['typed resource result envelope'],
    events: ['resource mutation event'],
    resultBinding: ['typed before/after/delta/resultId'],
    transactionBehavior: 'atomic direct-action resource mutation; no silent legacy fallback',
    eligibilityAxes: ['direct timing', 'resource numeric effect only'],
    invalidatingAxes: ['trigger', 'cost', 'target', 'interaction', 'lifecycle', 'modifier', 'visibility', 'binding', 'battle'],
    representatives: ['master.gatou.command-spell', 'master.olga-marie.command-spell', 'servant.tomoe.skill.sc-tomoe-1'],
    acceptanceVehicle: 'Mechanic Batch Gate A/B/C representative evidence',
  },
  CARD_ZONE_CORE_DIRECT_ACTION: {
    id: 'CARD_ZONE_CORE_DIRECT_ACTION',
    category: 'existing_contract',
    mechanicFamily: 'CARD_ZONE',
    input: ['source zone', 'destination zone', 'card selection/result binding'],
    output: ['typed moved/drawn count'],
    events: ['card-zone mutation event'],
    resultBinding: ['actual moved/drawn count'],
    transactionBehavior: 'atomic zone mutation with rollback on later-node failure',
    eligibilityAxes: ['direct card-zone action'],
    invalidatingAxes: ['trigger', 'cost', 'lifecycle', 'modifier', 'battle'],
    representatives: ['master.irisviel.skill.conversion-magic', 'master.kiritsugu.skill.time-alter'],
    acceptanceVehicle: 'Mechanic Batch Gate A/B/C representative evidence',
  },
  CARD_ACTION_SEMANTICS_MINIMAL_PLAY: {
    id: 'CARD_ACTION_SEMANTICS_MINIMAL_PLAY',
    category: 'existing_contract',
    mechanicFamily: 'CARD_ACTION_SEMANTICS',
    input: ['selected existing card', 'legal play destination'],
    output: ['played card state'],
    events: ['card played'],
    resultBinding: ['playedCount'],
    transactionBehavior: 'shared playBatch legality; no standalone fallback executor',
    eligibilityAxes: ['PLAY semantics'],
    invalidatingAxes: ['trigger', 'lifecycle', 'modifier', 'battle'],
    representatives: ['master.kiritsugu.skill.time-alter'],
    acceptanceVehicle: 'Time Alter Gate A/B/C candidate',
  },
  CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE: {
    id: 'CARD_ACTION_SEMANTICS_MINIMAL_PLAY_SOURCE_CARD_WITH_COST_RESPONSE',
    category: 'existing_contract',
    mechanicFamily: 'CARD_ACTION_SEMANTICS',
    input: ['source card', 'response window', 'mana payment'],
    output: ['source card played'],
    events: ['source_card_played'],
    resultBinding: ['playedCount'],
    transactionBehavior: 'response-window source play with typed cost and fail-closed legality',
    eligibilityAxes: ['PLAY source card', 'response', 'mana cost'],
    invalidatingAxes: ['battle', 'modifier'],
    representatives: ['master.kayneth.deck.volumen-hydrargyrum'],
    acceptanceVehicle: 'Volumen Gate A/B/C candidate',
  },
  CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK: {
    id: 'CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK',
    category: 'existing_contract',
    mechanicFamily: 'CARD_ACTION_SEMANTICS',
    input: ['existing card', 'target attack'],
    output: ['attached attack card'],
    events: ['attack_added'],
    resultBinding: ['affected count'],
    transactionBehavior: 'append/attach without inheriting normal play counters',
    eligibilityAxes: ['ADD_TO_ATTACK semantics'],
    invalidatingAxes: ['trigger', 'lifecycle', 'modifier', 'battle'],
    representatives: ['master.maiya.skill.military'],
    acceptanceVehicle: 'Maiya Gate A/B/C candidate',
  },
  CARD_ACTION_SEMANTICS_MINIMAL_ACTIVATE: {
    id: 'CARD_ACTION_SEMANTICS_MINIMAL_ACTIVATE',
    category: 'existing_contract',
    mechanicFamily: 'CARD_ACTION_SEMANTICS',
    input: ['existing inactive card'],
    output: ['active card state'],
    events: ['card_activated'],
    resultBinding: ['activatedCount'],
    transactionBehavior: 'activate existing card with source-zone and duplicate-activation rejection',
    eligibilityAxes: ['ACTIVATE semantics'],
    invalidatingAxes: ['interaction', 'modifier'],
    representatives: ['master.olga-marie.skill.astronomical-science'],
    acceptanceVehicle: 'Olga first-loss Gate A/B/C candidate',
  },
  CARD_ACTION_SEMANTICS_MINIMAL_CLOSE: {
    id: 'CARD_ACTION_SEMANTICS_MINIMAL_CLOSE',
    category: 'existing_contract',
    mechanicFamily: 'CARD_ACTION_SEMANTICS',
    input: ['active source card'],
    output: ['closed card state'],
    events: ['source_card_closed'],
    resultBinding: ['closedCount'],
    transactionBehavior: 'close source and apply lifecycle destination without stale duplicate settlement',
    eligibilityAxes: ['CLOSE semantics'],
    invalidatingAxes: ['interaction', 'modifier'],
    representatives: ['servant.artoria-alt.skill.sc-artoria-alt-2'],
    acceptanceVehicle: 'Artoria Alter Gate A/B/C candidate',
  },
  RESULT_BINDING_PHASE3A: {
    id: 'RESULT_BINDING_PHASE3A',
    category: 'existing_contract',
    mechanicFamily: 'RESULT_BINDING',
    input: ['typed producer result'],
    output: ['validated downstream bound value'],
    events: ['resolution result envelope'],
    resultBinding: ['EffectResultEnvelope', 'binding field'],
    transactionBehavior: 'producer/consumer graph validated before and during atomic resolution',
    eligibilityAxes: ['explicit structured result binding'],
    invalidatingAxes: ['lifecycle', 'modifier', 'battle'],
    representatives: ['servant.kintoki.skill.sc-kintoki-3'],
    acceptanceVehicle: 'Golden Eater Gate A/B/C candidate',
  },
  GENERIC_RESOURCE_NUMERIC: genericTemplate('GENERIC_RESOURCE_NUMERIC', 'RESOURCE_NUMERIC', 'typed numeric resource mutation'),
  GENERIC_COST_PAYMENT: genericTemplate('GENERIC_COST_PAYMENT', 'COST_PAYMENT', 'typed cost/payment transaction'),
  GENERIC_CARD_ZONE: genericTemplate('GENERIC_CARD_ZONE', 'CARD_ZONE', 'typed card-zone movement/draw/return'),
  CARD_ACTION_PLAY: genericTemplate('CARD_ACTION_PLAY', 'CARD_ACTION_SEMANTICS', 'PLAY: normal/explicit play into legal destination'),
  CARD_ACTION_ADD_TO_ATTACK: genericTemplate('CARD_ACTION_ADD_TO_ATTACK', 'CARD_ACTION_SEMANTICS', 'ADD_TO_ATTACK: append without normal play semantics'),
  CARD_ACTION_CREATE_AND_ACTIVATE: genericTemplate('CARD_ACTION_CREATE_AND_ACTIVATE', 'CARD_ACTION_SEMANTICS', 'CREATE_AND_ACTIVATE: create identity and immediately activate'),
  CARD_ACTION_ACTIVATE: genericTemplate('CARD_ACTION_ACTIVATE', 'CARD_ACTION_SEMANTICS', 'ACTIVATE: activate an existing card/effect'),
  CARD_ACTION_CLOSE: genericTemplate('CARD_ACTION_CLOSE', 'CARD_ACTION_SEMANTICS', 'CLOSE: close active source/target and process lifecycle'),
  GENERIC_CARD_CREATE: genericTemplate('GENERIC_CARD_CREATE', 'CARD_ZONE', 'create card/token without immediate activation'),
  GENERIC_TARGET_SELECTION: genericTemplate('GENERIC_TARGET_SELECTION', 'TARGET_SELECTION', 'typed target candidate and selection contract'),
  GENERIC_PENDING_INTERACTION: genericTemplate('GENERIC_PENDING_INTERACTION', 'INTERACTION', 'pending interaction/reconnect contract'),
  GENERIC_RESULT_BINDING: genericTemplate('GENERIC_RESULT_BINDING', 'RESULT_BINDING', 'typed result producer/consumer binding'),
  GENERIC_TRIGGER_GATEWAY: genericTemplate('GENERIC_TRIGGER_GATEWAY', 'TRIGGER', 'closed domain-event trigger gateway'),
  GENERIC_LIFECYCLE_POLICY: genericTemplate('GENERIC_LIFECYCLE_POLICY', 'LIFECYCLE', 'source/duration/cleanup/reset persistence policy'),
  GENERIC_MODIFIER: genericTemplate('GENERIC_MODIFIER', 'MODIFIER', 'typed rule/power modifier owner and priority'),
  GENERIC_VISIBILITY: genericTemplate('GENERIC_VISIBILITY', 'HIDDEN_INFORMATION', 'visibility/reveal/face-state projection contract'),
  GENERIC_BATTLE_INTEGRATION: genericTemplate('GENERIC_BATTLE_INTEGRATION', 'BATTLE_RESULT', 'battle event/result/defeat/winner integration'),
  GENERIC_MOVEMENT: genericTemplate('GENERIC_MOVEMENT', 'MOVEMENT', 'domain player movement/deployment contract'),
  GENERIC_CONDITION_EVALUATION: genericTemplate('GENERIC_CONDITION_EVALUATION', 'CONDITION', 'structured condition evaluation contract'),
  GENERIC_POWER: genericTemplate('GENERIC_POWER', 'POWER', 'canonical power-layer calculation/modifier contract'),
  GENERIC_STATUS_STATE: genericTemplate('GENERIC_STATUS_STATE', 'LIFECYCLE', 'typed status/flag state with lifecycle ownership'),
  GENERIC_EVENT_DECK: genericTemplate('GENERIC_EVENT_DECK', 'SPECIAL_SUBSYSTEM', 'event deck selection/movement/replacement contract'),
  REVIEWED_SPECIAL_TRANSFORM: specialTemplate('REVIEWED_SPECIAL_TRANSFORM', 'SPECIAL_SUBSYSTEM', 'copy/transform/granted-ability semantics require reviewed special handling'),
  REVIEWED_SPECIAL_HANDLER: specialTemplate('REVIEWED_SPECIAL_HANDLER', 'SPECIAL_SUBSYSTEM', 'non-generic structured effect requires reviewed special handling'),
});

function genericTemplate(id: string, mechanicFamily: string, description: string): CapabilityTemplate {
  return {
    id,
    category: 'generic_request',
    mechanicFamily,
    input: ['source-grounded semantic axes', 'validated runtime inputs'],
    output: [description],
    events: ['typed domain event where applicable'],
    resultBinding: ['typed result envelope when output is consumed'],
    transactionBehavior: 'fail closed, atomic authoritative mutation, no silent legacy fallback',
    eligibilityAxes: [mechanicFamily],
    invalidatingAxes: [],
    representatives: [],
    acceptanceVehicle: 'new Phase 3 capability request + Gate A/B/C representative',
  };
}

function specialTemplate(id: string, mechanicFamily: string, description: string): CapabilityTemplate {
  return {
    ...genericTemplate(id, mechanicFamily, description),
    category: 'reviewed_special',
    acceptanceVehicle: 'B/R reviewed-special exception with explicit deletion/reuse criteria',
  };
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function effectRecords(value: unknown, output: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!Array.isArray(value)) return output;
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (typeof item.type === 'string') output.push(item);
    for (const [key, child] of Object.entries(item)) {
      if (key === 'conditions' || key === 'condition' || key === 'target' || key === 'scope' || key === 'lifecycle') continue;
      if ((key === 'effects' || key.endsWith('Effects')) && Array.isArray(child)) effectRecords(child, output);
      if ((key === 'options' || key === 'branches' || key === 'choices') && Array.isArray(child)) {
        for (const option of child) {
          if (isRecord(option) && Array.isArray(option.effects)) effectRecords(option.effects, output);
        }
      }
    }
  }
  return output;
}

export function acceptanceContractsForCurrentAbilities(abilityIds: string[]): string[] {
  return uniq(abilityIds.map((id) => CURRENT_CONTRACT_BY_ABILITY[id]).filter((value): value is string => Boolean(value)));
}

export function classifyCurrentRoute(abilityIds: string[]): CurrentRoute {
  if (abilityIds.length === 0) return 'none';
  const routed = abilityIds.filter((id) => Boolean(CURRENT_CONTRACT_BY_ABILITY[id])).length;
  if (routed === 0) return 'legacy';
  if (routed === abilityIds.length) return 'new';
  return 'dual';
}

export function referenceRouteOf(reference: { executionRoute: string | null }): ReferenceRoute {
  if (reference.executionRoute === 'deterministic') return 'deterministic';
  if (reference.executionRoute === 'shared_handler') return 'shared_handler';
  if (reference.executionRoute === 'specific_handler') return 'specific_handler';
  return 'none';
}

export function contractIsEligible(contractId: string, axes: SemanticAxes): boolean {
  const invalidating = EXISTING_CONTRACT_INVALIDATORS[contractId];
  if (!invalidating) return false;
  if (invalidating.some((axis) => axes[axis].length > 0)) return false;
  if (contractId === 'RESOURCE_NUMERIC_CORE_DIRECT_ACTION') {
    if (axes.effect.length === 0 || !axes.effect.some((effect) => DIRECT_RESOURCE_CONTRACT_EFFECTS.has(effect))) return false;
    if (axes.effect.some((effect) => !DIRECT_RESOURCE_CONTRACT_EFFECTS.has(effect))) return false;
  }
  return true;
}

function addCapability(result: CapabilityNeedResult, capability: string, family: string): void {
  if (!CAPABILITY_TEMPLATES[capability]) throw new Error(`Unknown Phase 3 capability mapping: ${capability}`);
  result.requiredCapabilities.push(capability);
  result.mechanicFamilies.push(family);
}

export function mapStructuredCapabilityNeeds(
  ability: CapabilityStructuredAbility,
  axes: SemanticAxes,
): CapabilityNeedResult {
  const result: CapabilityNeedResult = { requiredCapabilities: [], mechanicFamilies: [], specialReasons: [] };
  const effects = effectRecords(ability.effects ?? []);
  const effectTypes = effects.map((effect) => (typeof effect.type === 'string' ? effect.type : '')).filter(Boolean);
  const effectTokens = new Set(axes.effect);
  const ruleModifiers = Array.isArray(ability.ruleModifiers)
    ? ability.ruleModifiers.filter(isRecord)
    : [];

  if (axes.cost.length > 0) addCapability(result, 'GENERIC_COST_PAYMENT', 'COST_PAYMENT');
  if (axes.target.length > 0) addCapability(result, 'GENERIC_TARGET_SELECTION', 'TARGET_SELECTION');
  if (axes.interaction.length > 0) addCapability(result, 'GENERIC_PENDING_INTERACTION', 'INTERACTION');
  if (axes.binding.length > 0) addCapability(result, 'GENERIC_RESULT_BINDING', 'RESULT_BINDING');
  if (axes.trigger.length > 0) addCapability(result, 'GENERIC_TRIGGER_GATEWAY', 'TRIGGER');
  if (axes.lifecycle.length > 0) addCapability(result, 'GENERIC_LIFECYCLE_POLICY', 'LIFECYCLE');
  if (axes.modifier.length > 0) addCapability(result, 'GENERIC_MODIFIER', 'MODIFIER');
  if (axes.visibility.length > 0) addCapability(result, 'GENERIC_VISIBILITY', 'HIDDEN_INFORMATION');
  if (axes.battle.length > 0) addCapability(result, 'GENERIC_BATTLE_INTEGRATION', 'BATTLE_RESULT');
  if (axes.condition.length > 0) addCapability(result, 'GENERIC_CONDITION_EVALUATION', 'CONDITION');

  if (
    effects.some(
      (effect) => typeof effect.suppressTrigger === 'string' && effect.suppressTrigger.length > 0,
    )
  ) {
    addCapability(result, 'GENERIC_TRIGGER_GATEWAY', 'TRIGGER');
  }

  if ([...effectTokens].some((effect) => RESOURCE_EFFECTS.has(effect))) {
    addCapability(result, 'GENERIC_RESOURCE_NUMERIC', 'RESOURCE_NUMERIC');
  }
  if ([...effectTokens].some((effect) => CARD_ZONE_EFFECTS.has(effect))) {
    addCapability(result, 'GENERIC_CARD_ZONE', 'CARD_ZONE');
  }
  if ([...effectTokens].some((effect) => STATUS_EFFECTS.has(effect))) {
    addCapability(result, 'GENERIC_STATUS_STATE', 'LIFECYCLE');
  }
  if ([...effectTokens].some((effect) => /POWER/.test(effect))) {
    addCapability(result, 'GENERIC_POWER', 'POWER');
  }
  if (effectTokens.has('MOVE_PLAYER')) addCapability(result, 'GENERIC_MOVEMENT', 'MOVEMENT');
  if (
    ruleModifiers.some((modifier) =>
      typeof modifier.rule === 'string' && /movement|deployment/i.test(modifier.rule)
    )
  ) {
    addCapability(result, 'GENERIC_MOVEMENT', 'MOVEMENT');
  }
  if (
    ruleModifiers.some((modifier) =>
      typeof modifier.rule === 'string' && /mana_gain/i.test(modifier.rule)
    )
  ) {
    addCapability(result, 'GENERIC_RESOURCE_NUMERIC', 'RESOURCE_NUMERIC');
  }
  if (
    ruleModifiers.some((modifier) =>
      typeof modifier.rule === 'string' && /power/i.test(modifier.rule)
    )
  ) {
    addCapability(result, 'GENERIC_POWER', 'POWER');
  }
  if (effectTypes.some((type) => EVENT_DECK_EFFECTS.has(type.toUpperCase()))) {
    addCapability(result, 'GENERIC_EVENT_DECK', 'SPECIAL_SUBSYSTEM');
  }

  const hasPlay = effectTypes.includes('play_selected_cards') || effectTypes.includes('play_source_card');
  const modifiesPlaySemantics = ruleModifiers.some(
    (modifier) => modifier.rule === 'card_play_mode' || modifier.rule === 'card_play_permission',
  );
  if (hasPlay || modifiesPlaySemantics) addCapability(result, 'CARD_ACTION_PLAY', 'CARD_ACTION_SEMANTICS');

  const addsToAttack = effects.some((effect) => {
    const type = typeof effect.type === 'string' ? effect.type : '';
    const destination = typeof effect.destination === 'string' ? effect.destination : '';
    return !hasPlay && destination === 'attack' && ['move_card', 'move_selected_cards', 'transfer_selected_cards', 'transfer_matching_cards'].includes(type);
  });
  if (addsToAttack) addCapability(result, 'CARD_ACTION_ADD_TO_ATTACK', 'CARD_ACTION_SEMANTICS');

  if (effectTypes.includes('activate_card_by_id')) addCapability(result, 'CARD_ACTION_ACTIVATE', 'CARD_ACTION_SEMANTICS');
  if (effectTypes.some((type) => type.startsWith('close_'))) addCapability(result, 'CARD_ACTION_CLOSE', 'CARD_ACTION_SEMANTICS');

  const creates = Array.isArray(ability.creates) ? ability.creates.filter(isRecord) : [];
  if (creates.some((create) => create.type === 'card' && create.active === true)) {
    addCapability(result, 'CARD_ACTION_CREATE_AND_ACTIVATE', 'CARD_ACTION_SEMANTICS');
  } else if (creates.some((create) => create.type === 'card')) {
    addCapability(result, 'GENERIC_CARD_CREATE', 'CARD_ZONE');
  }

  if (Array.isArray(ability.transforms) && ability.transforms.length > 0) {
    addCapability(result, 'GENERIC_CARD_ZONE', 'CARD_ZONE');
    if (ability.transforms.some((transform) => {
      if (!isRecord(transform) || !isRecord(transform.selection)) return false;
      const orderBy = typeof transform.selection.orderBy === 'string' ? transform.selection.orderBy : '';
      return /power/i.test(orderBy);
    })) {
      addCapability(result, 'GENERIC_POWER', 'POWER');
    }
    addCapability(result, 'REVIEWED_SPECIAL_TRANSFORM', 'SPECIAL_SUBSYSTEM');
    result.specialReasons.push('STRUCTURED_TRANSFORM_REQUIRES_REVIEW');
  }

  const specialEffects = effectTypes.filter((type) => SPECIAL_EFFECTS.has(type.toUpperCase()));
  if (specialEffects.length > 0) {
    addCapability(result, 'REVIEWED_SPECIAL_HANDLER', 'SPECIAL_SUBSYSTEM');
    result.specialReasons.push(...specialEffects.map((type) => `SPECIAL_EFFECT:${type}`));
  }

  if (result.requiredCapabilities.length === 0) {
    addCapability(result, 'GENERIC_CONDITION_EVALUATION', 'CONDITION');
  }

  result.requiredCapabilities = uniq(result.requiredCapabilities);
  result.mechanicFamilies = uniq(result.mechanicFamilies);
  result.specialReasons = uniq(result.specialReasons);
  return result;
}

function loadCurrentAuthoringCards(projectRoot: string): CurrentAuthoringCard[] {
  const cards: CurrentAuthoringCard[] = [];
  for (const root of CURRENT_AUTHORING_ROOTS) {
    const absoluteRoot = resolve(projectRoot, root);
    for (const name of readdirSync(absoluteRoot).filter((file) => file.endsWith('.json')).sort()) {
      const archive = JSON.parse(readFileSync(join(absoluteRoot, name), 'utf8')) as {
        id?: string;
        cards?: Array<{ id?: string; name?: string; abilities?: Array<{ id?: string }> }>;
      };
      if (typeof archive.id !== 'string' || archive.id.length === 0) continue;
      for (const card of archive.cards ?? []) {
        if (typeof card.id !== 'string' || typeof card.name !== 'string' || card.name.length === 0) continue;
        cards.push({
          id: card.id,
          ownerId: archive.id,
          name: card.name,
          abilityIds: (card.abilities ?? [])
            .map((ability) => ability.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        });
      }
    }
  }
  return cards.sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

function linkCurrentCardsToCanonicalIdentities(
  currentCards: CurrentAuthoringCard[],
  inventoryEntries: Array<Record<string, unknown>>,
): Map<string, { card: CurrentAuthoringCard; match: 'exact_id' | 'owner_name' }> {
  const result = new Map<string, { card: CurrentAuthoringCard; match: 'exact_id' | 'owner_name' }>();
  const inventoryIds = new Set(inventoryEntries.map((entry) => String(entry.canonicalAbilityId ?? '')));

  for (const card of currentCards) {
    if (inventoryIds.has(card.id)) {
      if (result.has(card.id)) throw new Error(`Duplicate current authoring identity match for ${card.id}.`);
      result.set(card.id, { card, match: 'exact_id' });
      continue;
    }

    const matches = inventoryEntries.filter(
      (entry) => entry.ownerId === card.ownerId && entry.skillName === card.name,
    );
    if (matches.length > 1) {
      throw new Error(`Ambiguous current authoring owner/name identity bridge: ${card.ownerId} / ${card.name}`);
    }
    if (matches.length === 1) {
      const canonicalId = String(matches[0].canonicalAbilityId ?? '');
      if (!canonicalId) throw new Error(`Current authoring bridge resolved an empty canonical identity for ${card.id}.`);
      if (result.has(canonicalId)) {
        throw new Error(`Multiple current authoring cards resolve to canonical identity ${canonicalId}.`);
      }
      result.set(canonicalId, { card, match: 'owner_name' });
    }
  }

  return result;
}

function loadReferenceAuthoringCards(referenceRoot: string): StructuredAuthoringCard[] {
  const file = JSON.parse(readFileSync(resolve(referenceRoot, AUTHORING_CARDS_PATH), 'utf8')) as {
    skillCards?: StructuredAuthoringCard[];
  };
  if (!Array.isArray(file.skillCards)) throw new Error('Reference authoring cards are missing skillCards.');
  return file.skillCards.map((card, sourceIndex) => ({ ...card, sourceIndex }));
}

function blockRoute(blocks: string[]): MappingRoute {
  if (blocks.includes('RULE_DECISION_REQUIRED')) return 'RULE_DECISION_REQUIRED';
  if (blocks.includes('REFERENCE_RUNTIME_CONFLICT')) return 'REFERENCE_RUNTIME_CONFLICT';
  if (blocks.includes('PHASE_DEPENDENCY_BLOCKED')) return 'PHASE_DEPENDENCY_BLOCKED';
  return 'SOURCE_EVIDENCE_REQUIRED';
}

function semanticAxesForEntry(entry: Record<string, unknown>): SemanticAxes | undefined {
  const semantic = entry.semanticNormalization;
  if (!isRecord(semantic) || semantic.status !== 'SOURCE_GROUNDED') return undefined;
  const axes = semantic.axes;
  if (!isRecord(axes)) return undefined;
  return axes as unknown as SemanticAxes;
}

function semanticAbilityAxes(entry: Record<string, unknown>): Map<string, SemanticAxes> {
  const result = new Map<string, SemanticAxes>();
  const semantic = entry.semanticNormalization;
  if (!isRecord(semantic) || !Array.isArray(semantic.abilities)) return result;
  for (const ability of semantic.abilities) {
    if (!isRecord(ability) || typeof ability.sourceAbilityId !== 'string' || !isRecord(ability.axes)) continue;
    result.set(ability.sourceAbilityId, ability.axes as unknown as SemanticAxes);
  }
  return result;
}

function semanticBlocks(entry: Record<string, unknown>): string[] {
  const semantic = entry.semanticNormalization;
  if (!isRecord(semantic) || !Array.isArray(semantic.blocks)) return [];
  return semantic.blocks.filter((value): value is string => typeof value === 'string');
}

function mapEntries(
  inventory: SemanticNormalizedInventory,
  referenceCards: StructuredAuthoringCard[],
  currentCards: CurrentAuthoringCard[],
): CapabilityMappedInventory {
  const referenceById = new Map(referenceCards.map((card) => [card.id, card] as const));
  const allInput = [...inventory.staticSkills, ...inventory.dynamicSkills] as unknown as Array<Record<string, unknown>>;
  const currentByCanonicalId = linkCurrentCardsToCanonicalIdentities(currentCards, allInput);

  const mapped: CapabilityMappedEntry[] = allInput.map((rawEntry) => {
    const id = String(rawEntry.canonicalAbilityId ?? '');
    if (!id) throw new Error('Capability mapping encountered an identity without canonicalAbilityId.');
    const reference = isRecord(rawEntry.reference) ? rawEntry.reference : {};
    const currentMatch = currentByCanonicalId.get(id);
    const currentAbilityIds = currentMatch?.card.abilityIds ?? [];
    const currentRoute = classifyCurrentRoute(currentAbilityIds);
    const exactContracts = acceptanceContractsForCurrentAbilities(currentAbilityIds);
    const inheritedAcceptanceContracts = currentRoute === 'new' ? exactContracts : [];
    const partialAcceptanceContracts = currentRoute === 'dual' ? exactContracts : [];
    const referenceRoute = referenceRouteOf({
      executionRoute: typeof reference.executionRoute === 'string' ? reference.executionRoute : null,
    });
    const referenceHandlerId = typeof reference.handlerId === 'string' ? reference.handlerId : undefined;
    const axes = semanticAxesForEntry(rawEntry);

    if (!axes) {
      const blocks = uniq([
        ...semanticBlocks(rawEntry),
        'SEMANTIC_SOURCE_REQUIRED',
      ]);
      return {
        ...rawEntry,
        phase3: {
          mechanicFamilies: [],
          requiredCapabilities: [],
          currentRoute,
          referenceRoute,
          inheritedAcceptanceContracts: [],
          partialAcceptanceContracts,
          classificationRoute: blockRoute(blocks),
          mappingStatus: 'EXPLICIT_BLOCK',
          blockedBy: blocks,
          routeEvidence: {
            currentAbilityIds: [...currentAbilityIds].sort(),
            currentAcceptanceContracts: exactContracts,
            ...(currentMatch ? { currentIdentityMatch: currentMatch.match } : {}),
            ...(referenceHandlerId ? { referenceHandlerId } : {}),
          },
        },
      } as CapabilityMappedEntry;
    }

    const card = referenceById.get(id);
    if (!card) {
      const blocks = ['SOURCE_EVIDENCE_REQUIRED'];
      return {
        ...rawEntry,
        phase3: {
          mechanicFamilies: [],
          requiredCapabilities: [],
          currentRoute,
          referenceRoute,
          inheritedAcceptanceContracts: [],
          partialAcceptanceContracts,
          classificationRoute: 'SOURCE_EVIDENCE_REQUIRED',
          mappingStatus: 'EXPLICIT_BLOCK',
          blockedBy: blocks,
          routeEvidence: {
            currentAbilityIds: [...currentAbilityIds].sort(),
            currentAcceptanceContracts: exactContracts,
            ...(currentMatch ? { currentIdentityMatch: currentMatch.match } : {}),
            ...(referenceHandlerId ? { referenceHandlerId } : {}),
          },
        },
      } as CapabilityMappedEntry;
    }

    const abilityAxes = semanticAbilityAxes(rawEntry);
    const capabilityNeeds = card.abilities.map((ability) =>
      mapStructuredCapabilityNeeds(ability, abilityAxes.get(ability.id) ?? axes),
    );
    const requiredCapabilities = uniq(capabilityNeeds.flatMap((need) => need.requiredCapabilities));
    const mechanicFamilies = uniq(capabilityNeeds.flatMap((need) => need.mechanicFamilies));
    const specialReasons = uniq(capabilityNeeds.flatMap((need) => need.specialReasons));
    if (requiredCapabilities.length === 0) throw new Error(`No capability mapping for source-grounded ability ${id}.`);

    const fullyInherited = inheritedAcceptanceContracts.filter((contract) => contractIsEligible(contract, axes));
    const allInheritedEligible =
      inheritedAcceptanceContracts.length > 0 && fullyInherited.length === inheritedAcceptanceContracts.length;
    const classificationRoute: MappingRoute =
      specialReasons.length > 0
        ? 'SPECIAL_HANDLER_CANDIDATE'
        : allInheritedEligible
          ? 'READY_EXISTING_CONTRACT'
          : 'READY_GENERIC_EXTENSION';

    return {
      ...rawEntry,
      classification: 'CONTRACT_MAPPED',
      phase3: {
        mechanicFamilies,
        requiredCapabilities: uniq([...requiredCapabilities, ...fullyInherited]),
        currentRoute,
        referenceRoute,
        inheritedAcceptanceContracts: fullyInherited,
        partialAcceptanceContracts,
        classificationRoute,
        mappingStatus: 'CONTRACT_MAPPED',
        blockedBy: specialReasons,
        routeEvidence: {
          currentAbilityIds: [...currentAbilityIds].sort(),
          currentAcceptanceContracts: exactContracts,
          ...(currentMatch ? { currentIdentityMatch: currentMatch.match } : {}),
          ...(referenceHandlerId ? { referenceHandlerId } : {}),
        },
      },
    } as CapabilityMappedEntry;
  });

  const staticSkills = mapped.slice(0, inventory.staticSkills.length);
  const dynamicSkills = mapped.slice(inventory.staticSkills.length);
  const all = [...staticSkills, ...dynamicSkills];
  const currentRouteCounts: Record<CurrentRoute, number> = { legacy: 0, new: 0, dual: 0, none: 0 };
  const referenceRouteCounts: Record<ReferenceRoute, number> = { deterministic: 0, shared_handler: 0, specific_handler: 0, none: 0 };
  const classificationRouteCounts: Record<MappingRoute, number> = {
    READY_EXISTING_CONTRACT: 0,
    READY_GENERIC_EXTENSION: 0,
    SPECIAL_HANDLER_CANDIDATE: 0,
    RULE_DECISION_REQUIRED: 0,
    SOURCE_EVIDENCE_REQUIRED: 0,
    PHASE_DEPENDENCY_BLOCKED: 0,
    REFERENCE_RUNTIME_CONFLICT: 0,
  };
  for (const entry of all) {
    currentRouteCounts[entry.phase3.currentRoute] += 1;
    referenceRouteCounts[entry.phase3.referenceRoute] += 1;
    classificationRouteCounts[entry.phase3.classificationRoute] += 1;
  }
  const contractMappedCount = all.filter((entry) => entry.phase3.mappingStatus === 'CONTRACT_MAPPED').length;
  const explicitBlockCount = all.length - contractMappedCount;

  return {
    ...(inventory as unknown as Record<string, unknown>),
    capabilitySummary: {
      totalIdentityCount: all.length,
      contractMappedCount,
      explicitBlockCount,
      currentRouteCounts,
      referenceRouteCounts,
      classificationRouteCounts,
      zeroSilentFallback: true,
    },
    staticSkills,
    dynamicSkills,
  };
}

function buildCatalog(inventory: CapabilityMappedInventory): FullRosterCapabilityCatalog {
  const all = [...inventory.staticSkills, ...inventory.dynamicSkills];
  const used = new Set<string>(Object.keys(CAPABILITY_TEMPLATES));
  for (const entry of all) {
    entry.phase3.requiredCapabilities.forEach((capability) => used.add(capability));
    entry.phase3.inheritedAcceptanceContracts.forEach((capability) => used.add(capability));
    entry.phase3.partialAcceptanceContracts.forEach((capability) => used.add(capability));
  }

  const capabilities: CapabilityCatalogEntry[] = [...used]
    .sort()
    .map((id) => {
      const template = CAPABILITY_TEMPLATES[id];
      if (!template) throw new Error(`Capability catalog has no declared template for ${id}.`);
      const eligibleAbilities = all
        .filter(
          (entry) =>
            entry.phase3.requiredCapabilities.includes(id) ||
            entry.phase3.inheritedAcceptanceContracts.includes(id),
        )
        .map((entry) => entry.canonicalAbilityId)
        .sort();
      const partialAbilities = all
        .filter((entry) => entry.phase3.partialAcceptanceContracts.includes(id))
        .map((entry) => entry.canonicalAbilityId)
        .sort();
      const skippedAbilities = all
        .filter(
          (entry) =>
            entry.phase3.mappingStatus === 'CONTRACT_MAPPED' &&
            entry.phase3.mechanicFamilies.includes(template.mechanicFamily) &&
            !eligibleAbilities.includes(entry.canonicalAbilityId) &&
            !partialAbilities.includes(entry.canonicalAbilityId),
        )
        .map((entry) => ({
          abilityId: entry.canonicalAbilityId,
          reason:
            template.category === 'existing_contract'
              ? 'NO_EXACT_ACCEPTED_CURRENT_ROUTE_OR_INVALIDATING_AXIS'
              : 'DIFFERENT_CAPABILITY_WITHIN_MECHANIC_FAMILY',
        }));
      return {
        ...template,
        eligibleAbilities,
        partialAbilities,
        skippedAbilities,
      };
    });

  const mappedAbilities = all
    .filter((entry) => entry.phase3.mappingStatus === 'CONTRACT_MAPPED')
    .map((entry) => entry.canonicalAbilityId)
    .sort();
  const blockedAbilities = all
    .filter((entry) => entry.phase3.mappingStatus === 'EXPLICIT_BLOCK')
    .map((entry) => ({
      abilityId: entry.canonicalAbilityId,
      route: entry.phase3.classificationRoute,
      blockedBy: entry.phase3.blockedBy,
    }))
    .sort((left, right) => (left.abilityId < right.abilityId ? -1 : left.abilityId > right.abilityId ? 1 : 0));
  const specialCandidates = all
    .filter((entry) => entry.phase3.classificationRoute === 'SPECIAL_HANDLER_CANDIDATE')
    .map((entry) => entry.canonicalAbilityId)
    .sort();

  if (mappedAbilities.length + blockedAbilities.length !== inventory.capabilitySummary.totalIdentityCount) {
    throw new Error('Capability catalog coverage does not partition every canonical identity.');
  }

  return {
    schemaVersion: 1,
    kind: 'phase3-full-roster-capability-catalog',
    provenance: {
      referenceRepository: String((inventory.provenance as Record<string, unknown>)?.repository ?? ''),
      referenceCommit: String((inventory.provenance as Record<string, unknown>)?.commit ?? ''),
      inventoryKind: String(inventory.kind ?? ''),
    },
    summary: {
      ...inventory.capabilitySummary,
      capabilityCount: capabilities.length,
    },
    capabilities,
    coverage: {
      mappedAbilities,
      blockedAbilities,
      specialCandidates,
    },
  };
}

export function renderCapabilityCatalogMarkdown(
  inventory: CapabilityMappedInventory,
  catalog: FullRosterCapabilityCatalog,
): string {
  const lines: string[] = [];
  lines.push('# FD Full-Roster Phase 3 Capability Catalog', '');
  lines.push('- Document Role: AUDIT');
  lines.push('- Status: PHASE_3_FS04_CONTRACT_MAPPED');
  lines.push('- Reference Policy: Reference handler names/routes are observational only and never create capabilities.');
  lines.push('- Card Action Policy: PLAY, ADD_TO_ATTACK, CREATE_AND_ACTIVATE, ACTIVATE, and CLOSE remain independent contracts.');
  lines.push('- Fallback Policy: zero silent fallback; every canonical identity is mapped or explicitly blocked.');
  lines.push('');
  lines.push(`totalIdentityCount=${catalog.summary.totalIdentityCount}`);
  lines.push(`contractMappedCount=${catalog.summary.contractMappedCount}`);
  lines.push(`explicitBlockCount=${catalog.summary.explicitBlockCount}`);
  lines.push(`capabilityCount=${catalog.summary.capabilityCount}`);
  lines.push(`zeroSilentFallback=${catalog.summary.zeroSilentFallback}`);
  lines.push('');
  lines.push('## Capability Summary', '');
  lines.push('| Capability | Category | Family | Eligible | Partial | Skipped | Acceptance Vehicle |');
  lines.push('|---|---|---|---:|---:|---:|---|');
  for (const capability of catalog.capabilities) {
    lines.push(`| \`${capability.id}\` | \`${capability.category}\` | \`${capability.mechanicFamily}\` | ${capability.eligibleAbilities.length} | ${capability.partialAbilities.length} | ${capability.skippedAbilities.length} | ${capability.acceptanceVehicle} |`);
  }
  lines.push('', '## Identity Mapping', '');
  lines.push('| Canonical Ability | Mapping Route | Current Route | Reference Route | Mechanic Families | Required Capabilities | Inherited Contracts | Partial Contracts | Blocks |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const entry of [...inventory.staticSkills, ...inventory.dynamicSkills]) {
    const cell = (values: string[]) => (values.length ? values.map((value) => `\`${value}\``).join(', ') : '`NONE`');
    lines.push(`| \`${entry.canonicalAbilityId}\` | \`${entry.phase3.classificationRoute}\` | \`${entry.phase3.currentRoute}\` | \`${entry.phase3.referenceRoute}\` | ${cell(entry.phase3.mechanicFamilies)} | ${cell(entry.phase3.requiredCapabilities)} | ${cell(entry.phase3.inheritedAcceptanceContracts)} | ${cell(entry.phase3.partialAcceptanceContracts)} | ${cell(entry.phase3.blockedBy)} |`);
  }
  return `${lines.join('\n')}\n`;
}

export function mapFullRosterCapabilities(
  inventory: SemanticNormalizedInventory,
  referenceCards: StructuredAuthoringCard[],
  currentCards: CurrentAuthoringCard[],
): { inventory: CapabilityMappedInventory; catalog: FullRosterCapabilityCatalog; markdown: string } {
  const mappedInventory = mapEntries(inventory, referenceCards, currentCards);
  const catalog = buildCatalog(mappedInventory);
  return {
    inventory: mappedInventory,
    catalog,
    markdown: renderCapabilityCatalogMarkdown(mappedInventory, catalog),
  };
}

function parseArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value || value.startsWith('--')) return undefined;
  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const referenceRootArgument = parseArgument(args, '--reference-root');
  if (!referenceRootArgument) {
    throw new Error('Usage: map-phase3-capabilities --reference-root <clean-reference-checkout> [--inventory <inventory.json>] [--output <inventory.json>] [--catalog-output <catalog.json>] [--markdown-output <catalog.md>]');
  }

  const projectRoot = process.cwd();
  const referenceRoot = resolve(referenceRootArgument);
  const inventoryPath = resolve(parseArgument(args, '--inventory') ?? DEFAULT_INVENTORY_PATH);
  const outputPath = resolve(parseArgument(args, '--output') ?? inventoryPath);
  const catalogPath = resolve(parseArgument(args, '--catalog-output') ?? DEFAULT_CATALOG_PATH);
  const markdownPath = resolve(parseArgument(args, '--markdown-output') ?? DEFAULT_MARKDOWN_PATH);
  assertOutputOutsideReference(referenceRoot, outputPath);
  assertOutputOutsideReference(referenceRoot, catalogPath);
  assertOutputOutsideReference(referenceRoot, markdownPath);

  const verifiedReference = verifyReferenceRoot(referenceRoot);
  const rawInventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as unknown;
  assertFullRosterInventory(rawInventory);
  const inventory = rawInventory as SemanticNormalizedInventory;
  if (!inventory.semanticSummary || inventory.semanticSummary.unclassifiedCount !== 0) {
    throw new Error('FS04 requires the FS03 normalized inventory with unclassifiedCount=0.');
  }
  if (
    inventory.provenance.repository !== verifiedReference.repository ||
    inventory.provenance.commit !== verifiedReference.commit
  ) {
    throw new Error('Inventory provenance does not match the locked Reference checkout.');
  }

  const referenceCards = loadReferenceAuthoringCards(referenceRoot);
  const overlayCards = loadSourceEvidenceOverlayCards(projectRoot);
  const currentCards = loadCurrentAuthoringCards(projectRoot);
  const result = mapFullRosterCapabilities(inventory, [...referenceCards, ...overlayCards], currentCards);

  mkdirSync(dirname(outputPath), { recursive: true });
  mkdirSync(dirname(catalogPath), { recursive: true });
  mkdirSync(dirname(markdownPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result.inventory, null, 2)}\n`, 'utf8');
  writeFileSync(catalogPath, `${JSON.stringify(result.catalog, null, 2)}\n`, 'utf8');
  writeFileSync(markdownPath, result.markdown, 'utf8');

  process.stdout.write(`${JSON.stringify(result.catalog.summary, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
const modulePath = resolve(fileURLToPath(import.meta.url));
if (invokedPath === modulePath) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
