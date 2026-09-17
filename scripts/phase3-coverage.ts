import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonObject = Record<string, unknown>;

export interface AuthoringArchiveLike {
  id: string;
  cards?: AuthoringCardLike[];
}

interface AuthoringCardLike {
  id: string;
  abilities?: AuthoringAbilityLike[];
}

interface AuthoringAbilityLike {
  id: string;
  kind?: string;
  activation?: JsonObject;
  requirements?: JsonObject[];
  targets?: JsonObject[];
  cost?: JsonObject[];
  creates?: JsonObject[];
  effects?: JsonObject[];
  lifecycle?: JsonObject;
  limit?: JsonObject;
  ruleModifiers?: JsonObject[];
  powerModifiers?: JsonObject[];
  printedClause?: string;
  [key: string]: unknown;
}

interface AbilityCoverageRow {
  archiveId: string;
  cardId: string;
  abilityId: string;
  abilityKey: string;
  abilityKind: string[];
  timingWindows: string[];
  domainEventTriggers: string[];
  requirements: string[];
  targets: string[];
  costs: string[];
  interactions: string[];
  strictPendingInteractions: string[];
  effectPrimitiveFamilies: string[];
  exactEffectPrimitives: string[];
  modifiers: string[];
  lifecyclePolicies: string[];
  hiddenInformation: string[];
  resultBinding: string[];
  battleIntegration: string[];
  specialSubsystems: string[];
  runtimeRoute: RuntimeRoute;
  semanticRoutes: string[];
  taxonomyWarnings: string[];
  unclassifiedReasons: string[];
}

type RuntimeRoute =
  | 'NEW_RUNTIME_SEMANTIC_ROUTED'
  | 'LEGACY_RESOLVE_EFFECT'
  | 'LEGACY_EXECUTE_ABILITY'
  | 'DUAL_COMPATIBLE'
  | 'NOT_CLASSIFIABLE';

interface CoverageOptions {
  generatedAt?: string;
  workspaceRoot?: string;
  baseline?: Partial<LegacyMetricsSnapshot>;
  runtimeSourceText?: string;
}

interface LegacyMetricsSnapshot {
  legacyExecuteAbilityConsumers: number;
  legacyResolveEffectConsumers: number;
  dualRuntimeConsumers: number;
  pilotAllowlistEntries: number;
  unsupportedNodes: number;
}

interface CounterWithDelta {
  before: number;
  after: number;
  delta: number;
}

const authoringRoots = ['data/authoring/masters', 'data/authoring/servants'];

const strictDomainTriggers = new Set([
  'after_battle_ended',
  'after_battle_result_determined',
  'after_controller_enters_location',
  'after_controller_first_loses_battle',
  'after_controller_gains_victory',
  'after_controller_loses_all_command_seals',
  'after_controller_loses_battle',
  'after_controller_wins_battle',
  'after_player_deployed_to_battlefield',
  'before_situation_or_event_resolves',
  'game_start',
  'on_card_played',
  'on_use_declared',
]);

const nonTriggerTimingHooks = new Set([
  'controller_combat_action_window',
  'phase_action',
  'when_formula_condition_met',
  'when_play_requirements_checked',
  'when_power_calculation_applied',
  'while_active',
]);

const directResourceTypes = new Set(['adjust_mana', 'adjust_command_seals', 'adjust_victory_points']);
const cardZoneTypes = new Set([
  'create_card',
  'create_independent_deck',
  'draw_cards',
  'draw_from_independent_deck',
  'look_at_deck_top',
  'look_at_match_deck_bottoms',
  'move_all_remaining',
  'move_card',
  'replace_card_in_deck',
  'shuffle_zone_into_deck',
  'swap_revealed_with_deck_bottom',
]);
const cardActionTypes = new Set([
  'activate_card_by_id',
  'append_only_rule',
  'attach_card_to_player_attack',
  'close_source_card',
  'play_selected_cards',
  'play_source_card',
]);
const modifierTypes = new Set([
  'combat_power_modifier',
  'create_modifier',
  'create_status',
  'reduce_opponents_power',
  'reverse_situation_and_event_power_modifiers',
  'set_opponent_power_to_zero',
  'soul_drag_power_bonus',
  'terrain_multiplier',
]);
const hiddenTypes = new Set([
  'reveal_information',
  'set_zone_visibility',
  'look_at_deck_top',
  'look_at_match_deck_bottoms',
]);
const specialTypes = new Set([
  'create_independent_deck',
  'draw_from_independent_deck',
  'false_attendant_book_replacement',
  'record_master_directive',
  'replace_card_in_deck',
  'return_silence_battle_start',
  'swap_revealed_with_deck_bottom',
  'transform_to_return_silence_on_loss',
]);
const knownPrimitiveTypes = new Set([
  ...directResourceTypes,
  'pay_mana',
  ...cardZoneTypes,
  ...cardActionTypes,
  ...modifierTypes,
  ...hiddenTypes,
  ...specialTypes,
  'branch',
  'move_player',
  'movement_rule_override',
  'no_operation',
  'remove_advantage_position',
  'fail_invariant',
]);
const legacyCompatibleTypes = new Set([
  ...directResourceTypes,
  'move_card',
  'draw_cards',
  'create_card',
  'move_player',
  'reveal_information',
  'record_master_directive',
  'branch',
  ...cardActionTypes,
  ...modifierTypes,
  ...specialTypes,
]);

function unique(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function increment(map: Record<string, number>, key: string, amount = 1): void {
  map[key] = (map[key] ?? 0) + amount;
}

function effectNodes(effects: unknown[] = []): JsonObject[] {
  const rows: JsonObject[] = [];
  const walk = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    const node = value as JsonObject;
    if (typeof node.type === 'string') rows.push(node);
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === 'object') walk(child);
    }
  };
  effects.forEach(walk);
  return rows;
}

function targetShape(target: JsonObject): string {
  const count = target.count as JsonObject | undefined;
  if (target.type === 'card_instance') {
    if (count?.exact || count?.min || count?.max) return 'CHOOSE_N_CARDS';
    return 'CHOOSE_ONE_CARD';
  }
  if (target.type === 'player') return 'CHOOSE_ONE_PLAYER';
  if (target.type === 'location') return 'CHOOSE_LOCATION';
  if (target.type === 'choice') return 'BRANCH_CHOICE';
  return target.type ? `CHOOSE_${String(target.type).toUpperCase()}` : 'UNKNOWN_TARGET';
}

function collectLifecycle(prefix: string, policy: unknown, out: string[]): void {
  if (!policy || typeof policy !== 'object') return;
  for (const [key, value] of Object.entries(policy as JsonObject)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out.push(`${prefix}:${key}:${String(value)}`);
    } else if (value && typeof value === 'object') {
      collectLifecycle(`${prefix}:${key}`, value, out);
    }
  }
}

function rawText(value: unknown): string {
  return JSON.stringify(value);
}

function hasDataFlowSyntax(ability: AuthoringAbilityLike): boolean {
  const raw = rawText(ability);
  return raw.includes('"bind"') || raw.includes('"resultVar"') || raw.includes('"binding_field"');
}

function noTargetsCostOrCreates(ability: AuthoringAbilityLike): boolean {
  return (ability.targets ?? []).length === 0 && (ability.cost ?? []).length === 0 && (ability.creates ?? []).length === 0;
}

function isFixedManaCost(costs: JsonObject[] | undefined, amount: number): boolean {
  if ((costs ?? []).length !== 1) return false;
  const cost = costs?.[0];
  if (cost?.type !== 'pay_mana') return false;
  if (cost.amount === amount) return true;
  const amountNode = cost.amount as JsonObject | undefined;
  return typeof amountNode === 'object'
    && (amountNode?.expr === 'literal' || amountNode?.op === 'literal' || amountNode?.op === 'const')
    && amountNode.value === amount;
}

function conditionsOf(ability: AuthoringAbilityLike): JsonObject[] {
  return Array.isArray(ability.conditions) ? ability.conditions as JsonObject[] : [];
}

function hasNotControllerAtBattlefieldCondition(ability: AuthoringAbilityLike): boolean {
  return conditionsOf(ability).some((condition) => {
    const nested = condition.condition as JsonObject | undefined;
    return condition.type === 'not' && nested?.type === 'controller_at_battlefield';
  });
}

function hasSingleNonControllerPlayerTarget(targets: JsonObject[] | undefined, targetId: string | undefined): boolean {
  if (!targetId) return false;
  const target = (targets ?? []).find((candidate) => candidate.id === targetId);
  if (!target || target.type !== 'player') return false;
  const count = target.count as JsonObject | undefined;
  const constraints = Array.isArray(target.constraints) ? target.constraints as JsonObject[] : [];
  return (count?.min ?? 1) === 1
    && (count?.max ?? 1) === 1
    && constraints.some((constraint) => constraint.type === 'not_controller');
}

function hasSourceCardInFieldCondition(ability: AuthoringAbilityLike): boolean {
  return conditionsOf(ability).some((condition) =>
    condition.type === 'source_card_in_zone' && condition.zone === 'field');
}

function hasEventPlayedCardNoblePhantasmCondition(ability: AuthoringAbilityLike): boolean {
  return conditionsOf(ability).some((condition) =>
    condition.type === 'event_played_card_has_attribute' && condition.attribute === '宝具');
}

function hasSourceCloseLifecycle(ability: AuthoringAbilityLike): boolean {
  const lifecycle = ability.lifecycle as JsonObject | undefined;
  return (!lifecycle?.duration || lifecycle.duration === 'while_card_active')
    && (!lifecycle?.cleanup || lifecycle.cleanup === 'when_card_leaves_active_area');
}

function isResourceNumericDirectAction(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  return ability.kind === 'phase_action'
    && ability.activation?.phase === 'action'
    && noTargetsCostOrCreates(ability)
    && topLevelTypes.length > 0
    && topLevelTypes.every((type) => directResourceTypes.has(type));
}

function isConversionMagicCardZoneShape(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  return ability.kind === 'phase_action'
    && ability.activation?.phase === 'advance'
    && ability.activation?.opens === 'controller_action_window'
    && topLevelTypes.length === 2
    && topLevelTypes.includes('move_all_remaining')
    && topLevelTypes.includes('adjust_mana')
    && hasDataFlowSyntax(ability);
}

function isTimeAlterPlayShape(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  return ability.kind === 'phase_action'
    && ability.activation?.phase === 'action'
    && (ability.targets ?? []).length === 1
    && topLevelTypes.length === 2
    && topLevelTypes.includes('play_selected_cards')
    && topLevelTypes.includes('draw_cards');
}

function isPlaySourceResponseShape(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  const responseWindow = ability.responseWindow as JsonObject | undefined;
  const effects = ability.effects ?? [];
  return ability.kind === 'response'
    && ability.activation?.trigger === 'controller_combat_action_window'
    && responseWindow?.opens === 'controller_combat_action_window'
    && (ability.targets ?? []).length === 0
    && (ability.creates ?? []).length === 0
    && effects.length === 1
    && topLevelTypes.length === 1
    && topLevelTypes[0] === 'play_source_card'
    && effects[0]?.face === 'face_up'
    && isFixedManaCost(ability.cost, 2);
}

function isAddToAttackShape(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  const effects = ability.effects ?? [];
  const effect = effects[0];
  return ability.kind === 'phase_action'
    && ability.activation?.phase === 'advance'
    && ability.activation?.opens === 'controller_action_window'
    && hasNotControllerAtBattlefieldCondition(ability)
    && (ability.targets ?? []).length === 1
    && (ability.creates ?? []).length === 0
    && effects.length === 1
    && topLevelTypes.length === 1
    && topLevelTypes[0] === 'attach_card_to_player_attack'
    && effect?.cardId === 'master.maiya.deck.support-shot'
    && typeof effect?.target === 'string'
    && hasSingleNonControllerPlayerTarget(ability.targets, effect.target)
    && effect.returnAtRoundEnd === true
    && effect.controllerCannotWinStatus === 'maiya_cannot_win_battle_this_round'
    && isFixedManaCost(ability.cost, 2);
}

function isActivateShape(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  const effects = ability.effects ?? [];
  const effect = effects[0];
  return ability.kind === 'forced_trigger'
    && ability.activation?.trigger === 'after_controller_first_loses_battle'
    && (ability.targets ?? []).length === 0
    && (ability.cost ?? []).length === 0
    && (ability.creates ?? []).length === 0
    && effects.length === 1
    && topLevelTypes.length === 1
    && topLevelTypes[0] === 'activate_card_by_id'
    && effect?.definitionId === 'master.olga-marie.skill.trismegistus-grief';
}

function isCloseShape(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  const effects = ability.effects ?? [];
  const opens = ability.activation?.opens;
  return ability.kind === 'residual'
    && ability.activation?.trigger === 'on_card_played'
    && (!opens || opens === 'immediate')
    && hasSourceCardInFieldCondition(ability)
    && hasEventPlayedCardNoblePhantasmCondition(ability)
    && hasSourceCloseLifecycle(ability)
    && (ability.targets ?? []).length === 0
    && (ability.cost ?? []).length === 0
    && (ability.creates ?? []).length === 0
    && effects.length === 1
    && topLevelTypes.length === 1
    && topLevelTypes[0] === 'close_source_card'
    && effects[0]?.type === 'close_source_card';
}

function isSetupCreateToSkillShape(ability: AuthoringAbilityLike, topLevelTypes: string[]): boolean {
  const conditions = Array.isArray(ability.conditions) ? ability.conditions : [];
  const effects = ability.effects ?? [];
  const effect = effects[0];
  const destination = effect?.to && typeof effect.to === 'object' ? effect.to as JsonObject : undefined;
  const execution = ability.execution && typeof ability.execution === 'object' ? ability.execution as JsonObject : undefined;
  return ability.kind === 'forced_trigger'
    && ability.activation?.trigger === 'game_start'
    && conditions.length === 0
    && noTargetsCostOrCreates(ability)
    && effects.length === 1
    && topLevelTypes.length === 1
    && topLevelTypes[0] === 'create_card'
    && typeof effect?.cardId === 'string'
    && destination?.zone === 'skill'
    && effect.owner === undefined
    && destination.owner === undefined
    && effect.then === undefined
    && execution?.mode === 'automatic';
}

function semanticRoutesForAbility(ability: AuthoringAbilityLike, topLevelTypes: string[]): string[] {
  const routes: string[] = [];
  if (isResourceNumericDirectAction(ability, topLevelTypes)) routes.push('RESOURCE_NUMERIC_CORE_DIRECT_ACTION');
  if (isConversionMagicCardZoneShape(ability, topLevelTypes)) routes.push('CARD_ZONE_CORE_DIRECT_ACTION:MOVE_ALL_REMAINING_PLUS_ADJUST_MANA');
  if (isTimeAlterPlayShape(ability, topLevelTypes)) {
    routes.push('CARD_ACTION_SEMANTICS_MINIMAL:PLAY');
  }
  if (isPlaySourceResponseShape(ability, topLevelTypes)) routes.push('CARD_ACTION_SEMANTICS_MINIMAL:PLAY_SOURCE_CARD_WITH_COST_RESPONSE');
  if (isAddToAttackShape(ability, topLevelTypes)) routes.push('CARD_ACTION_SEMANTICS_MINIMAL:ADD_TO_ATTACK');
  if (isActivateShape(ability, topLevelTypes)) routes.push('CARD_ACTION_SEMANTICS_MINIMAL:ACTIVATE');
  if (isCloseShape(ability, topLevelTypes)) routes.push('CARD_ACTION_SEMANTICS_MINIMAL:CLOSE');
  if (isSetupCreateToSkillShape(ability, topLevelTypes)) routes.push('SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL');
  return unique(routes);
}

function classifyRuntimeRoute(ability: AuthoringAbilityLike, topLevelTypes: string[], semanticRoutes: string[], hasUnknownPrimitive: boolean): RuntimeRoute {
  if (hasUnknownPrimitive) return 'NOT_CLASSIFIABLE';
  if (semanticRoutes.length > 0 || hasDataFlowSyntax(ability)) return 'NEW_RUNTIME_SEMANTIC_ROUTED';
  if (topLevelTypes.some((type) => legacyCompatibleTypes.has(type))) return 'LEGACY_RESOLVE_EFFECT';
  if ((ability.requirements ?? []).length > 0 || (ability.targets ?? []).length > 0 || (ability.cost ?? []).length > 0) {
    return 'LEGACY_EXECUTE_ABILITY';
  }
  return 'NOT_CLASSIFIABLE';
}

export function classifyAbilityForCoverage(
  archive: Pick<AuthoringArchiveLike, 'id'>,
  card: Pick<AuthoringCardLike, 'id'>,
  ability: AuthoringAbilityLike,
): AbilityCoverageRow {
  const effects = effectNodes(ability.effects ?? []);
  const topLevelTypes = (ability.effects ?? [])
    .map((effect) => effect.type)
    .filter((type): type is string => typeof type === 'string');
  const allTypes = unique(effects.map((effect) => typeof effect.type === 'string' ? effect.type : undefined));
  const raw = rawText(ability);
  const activation = ability.activation ?? {};
  const targets = ability.targets ?? [];
  const taxonomyWarnings: string[] = [];
  const unclassifiedReasons: string[] = [];

  const abilityKind = [String(ability.kind ?? 'UNSPECIFIED').toUpperCase()];

  const timingWindows: string[] = [];
  if (typeof activation.phase === 'string') timingWindows.push(activation.phase.toUpperCase());
  if (typeof activation.opens === 'string') timingWindows.push(activation.opens.toUpperCase());
  if (typeof activation.trigger === 'string' && nonTriggerTimingHooks.has(activation.trigger)) {
    timingWindows.push(activation.trigger.toUpperCase());
  }

  const domainEventTriggers: string[] = [];
  if (typeof activation.trigger === 'string' && strictDomainTriggers.has(activation.trigger)) {
    domainEventTriggers.push(activation.trigger);
  }
  if (ability.kind === 'phase_action') taxonomyWarnings.push('TAXONOMY_DRIFT_WARNING:phase_action_is_not_domain_trigger');
  if (ability.kind === 'passive') taxonomyWarnings.push('TAXONOMY_DRIFT_WARNING:passive_kind_is_not_lifecycle_policy');
  if (typeof activation.trigger === 'string' && nonTriggerTimingHooks.has(activation.trigger)) {
    taxonomyWarnings.push(`TAXONOMY_DRIFT_WARNING:${activation.trigger}_is_timing_hook_not_domain_trigger`);
  }

  const requirements: string[] = [];
  if (typeof activation.requiresSourceState === 'string') requirements.push(`SOURCE_${activation.requiresSourceState.toUpperCase()}`);
  for (const requirement of ability.requirements ?? []) {
    if (typeof requirement.type === 'string') requirements.push(requirement.type.toUpperCase());
  }
  if (raw.includes('controller_mana_at_least')) requirements.push('MANA');
  if (raw.includes('controller_at_location_kind') || /地点|深山|战场/.test(String(ability.printedClause ?? ''))) requirements.push('LOCATION');
  if (/battle|combat|战斗|交战|败北|战败|获胜|胜者|defeat|wins_battle|loses_battle/.test(raw)) requirements.push('BATTLE_STATE');

  const targetShapes = targets.map(targetShape);
  const costs: string[] = [];
  if (rawText(ability.cost ?? []).includes('pay_mana') || allTypes.includes('pay_mana')) costs.push('MANA');
  if (allTypes.includes('adjust_command_seals') && /令咒|command/i.test(String(ability.printedClause ?? ''))) costs.push('COMMAND_SEAL_OR_RESOURCE');
  if (/discard|弃|关闭|close/i.test(raw)) costs.push('DISCARD_OR_CLOSE');

  const interactions: string[] = [...targetShapes];
  if (ability.kind === 'response' || String(activation.opens ?? '').includes('response')) interactions.push('RESPONSE');
  if (ability.kind === 'optional_trigger' || String(activation.opens ?? '').includes('optional')) interactions.push('YES_NO');

  const strictPendingInteractions = targets.length > 0 ? [...targetShapes] : [];
  if (targets.length === 0 && allTypes.length > 0 && raw.includes('"target"')) {
    taxonomyWarnings.push('TAXONOMY_DRIFT_WARNING:target_reference_without_declared_pending_interaction');
  }

  const primitiveFamilies: string[] = [];
  if (topLevelTypes.some((type) => directResourceTypes.has(type) || type === 'pay_mana')) primitiveFamilies.push('RESOURCE_NUMERIC');
  if (topLevelTypes.some((type) => cardZoneTypes.has(type))) primitiveFamilies.push('CARD_ZONE');
  if (topLevelTypes.some((type) => cardActionTypes.has(type))) primitiveFamilies.push('CARD_ACTION_SEMANTICS');
  if (topLevelTypes.includes('move_player') || topLevelTypes.includes('movement_rule_override')) primitiveFamilies.push('MOVEMENT');
  if (topLevelTypes.some((type) => hiddenTypes.has(type))) primitiveFamilies.push('VISIBILITY');

  const modifiers: string[] = [];
  if ((ability.ruleModifiers ?? []).length > 0) modifiers.push('RULE_MODIFIER');
  if ((ability.powerModifiers ?? []).length > 0) modifiers.push('POWER_MODIFIER');
  if (allTypes.some((type) => modifierTypes.has(type))) modifiers.push('EFFECT_MODIFIER');

  const lifecyclePolicies: string[] = [];
  collectLifecycle('lifecycle', ability.lifecycle, lifecyclePolicies);
  collectLifecycle('limit', ability.limit, lifecyclePolicies);
  for (const effect of effects) collectLifecycle('effect_lifecycle', effect.lifecycle, lifecyclePolicies);

  const hiddenInformation: string[] = [];
  if (allTypes.includes('reveal_information')) hiddenInformation.push('REVEAL');
  if (allTypes.includes('set_zone_visibility')) hiddenInformation.push('ZONE_VISIBILITY');
  if (allTypes.includes('look_at_deck_top') || allTypes.includes('look_at_match_deck_bottoms')) hiddenInformation.push('PRIVATE_LOOK');
  const hasPrivateTarget = targets.some((target) => {
    const declaredVisibility = String(target.visibility ?? '');
    if (declaredVisibility.includes('private')) return true;
    if (target.type !== 'card_instance') return false;
    const scope = (target.scope ?? {}) as JsonObject;
    const privateZone = ['hand', 'deck', 'looked_cards'].includes(String(scope.zone ?? ''));
    const controllerOwned = ['controller', 'self'].includes(String(scope.owner ?? '')) ||
      ['controller', 'self'].includes(String(scope.controller ?? ''));
    return privateZone && controllerOwned;
  });
  if (hasPrivateTarget || raw.includes('face_down') || /暗置|隐藏|真名|查看|展示/.test(String(ability.printedClause ?? ''))) hiddenInformation.push('HIDDEN_OR_PRIVATE');

  const resultBinding: string[] = [];
  if (raw.includes('"resultVar"')) resultBinding.push('RESULT_VAR');
  if (raw.includes('"binding_field"')) resultBinding.push('BINDING_FIELD');
  if (raw.includes('"bind"')) resultBinding.push('BIND');

  const battleIntegration = /battle|combat|战斗|交战|败北|战败|获胜|胜者|defeat|wins_battle|loses_battle/.test(raw)
    ? ['BATTLE_INTEGRATION']
    : [];
  const specialSubsystems = allTypes.some((type) => specialTypes.has(type)) ? ['SPECIAL_SUBSYSTEM'] : [];

  let hasUnknownPrimitive = false;
  for (const primitive of allTypes) {
    if (!knownPrimitiveTypes.has(primitive)) {
      hasUnknownPrimitive = true;
      unclassifiedReasons.push(`NOT_CLASSIFIABLE:unknown_effect_primitive:${primitive}`);
    }
  }

  const semanticRoutes = semanticRoutesForAbility(ability, topLevelTypes);
  const runtimeRoute = classifyRuntimeRoute(ability, topLevelTypes, semanticRoutes, hasUnknownPrimitive);
  if (runtimeRoute === 'NOT_CLASSIFIABLE' && unclassifiedReasons.length === 0) {
    unclassifiedReasons.push('NOT_CLASSIFIABLE:runtime_route_unknown');
  }

  return {
    archiveId: archive.id,
    cardId: card.id,
    abilityId: ability.id,
    abilityKey: `${card.id}::${ability.id}`,
    abilityKind,
    timingWindows: unique(timingWindows),
    domainEventTriggers: unique(domainEventTriggers),
    requirements: unique(requirements),
    targets: unique(targetShapes),
    costs: unique(costs),
    interactions: unique(interactions),
    strictPendingInteractions: unique(strictPendingInteractions),
    effectPrimitiveFamilies: unique(primitiveFamilies),
    exactEffectPrimitives: unique(allTypes),
    modifiers: unique(modifiers),
    lifecyclePolicies: unique(lifecyclePolicies),
    hiddenInformation: unique(hiddenInformation),
    resultBinding: unique(resultBinding),
    battleIntegration: unique(battleIntegration),
    specialSubsystems: unique(specialSubsystems),
    runtimeRoute,
    semanticRoutes,
    taxonomyWarnings: unique(taxonomyWarnings),
    unclassifiedReasons: unique(unclassifiedReasons),
  };
}

function countAxis(rows: AbilityCoverageRow[], axis: keyof AbilityCoverageRow): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const values = row[axis];
    if (!Array.isArray(values)) continue;
    for (const value of values) increment(counts, String(value));
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function counter(before: number, after: number): CounterWithDelta {
  return { before, after, delta: after - before };
}

function flattenAbilities(archives: AuthoringArchiveLike[]): AbilityCoverageRow[] {
  const rows: AbilityCoverageRow[] = [];
  for (const archive of archives) {
    for (const card of archive.cards ?? []) {
      for (const ability of card.abilities ?? []) rows.push(classifyAbilityForCoverage(archive, card, ability));
    }
  }
  return rows;
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function extractPilotAllowlistCount(runtimeSourceText?: string): number {
  if (!runtimeSourceText) return 0;
  const match = runtimeSourceText.match(/phase3ReferenceVerticalPilotAbilityIds\s*=\s*new Set<[^>]+>\(\s*\[([\s\S]*?)\]\s*\)/);
  if (!match) return 0;
  return [...match[1]!.matchAll(/['"`]([^'"`]+)['"`]/g)].length;
}

function detectRuntimeCardSpecificHandlers(workspaceRoot?: string): Array<{ file: string; line: number; id: string; confidence: 'STATIC_LITERAL' }> {
  if (!workspaceRoot) return [];
  const runtimeFiles = [
    'packages/rules/src/ability/interpreter.ts',
    'packages/rules/src/ability/resolution-dataflow.ts',
    'packages/rules/src/match-session.ts',
    'packages/rules/src/core/combat-resolver.ts',
    'packages/rules/src/core/effect-resolver.ts',
  ];
  const rows: Array<{ file: string; line: number; id: string; confidence: 'STATIC_LITERAL' }> = [];
  const idRegex = /['"`]((?:master|servant|command-spell|sc-|volumen|time-alter|conversion-magic|military|astronomical-science)[^'"`]*?)['"`]/g;
  for (const file of runtimeFiles) {
    const fullPath = resolve(workspaceRoot, file);
    if (!existsSync(fullPath)) continue;
    const lines = readFileSync(fullPath, 'utf8').split(/\r?\n/);
    lines.forEach((lineText, index) => {
      for (const match of lineText.matchAll(idRegex)) {
        if ((match[1] ?? '').includes('::')) continue;
        rows.push({ file, line: index + 1, id: match[1]!, confidence: 'STATIC_LITERAL' });
      }
    });
  }
  return rows;
}

function runtimeSource(workspaceRoot?: string): string {
  if (!workspaceRoot) return '';
  const file = resolve(workspaceRoot, 'packages/rules/src/ability/resolution-dataflow.ts');
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

export function buildCoverageFromArchives(archives: AuthoringArchiveLike[], options: CoverageOptions = {}) {
  const rows = flattenAbilities(archives);
  const totalCards = archives.reduce((total, archive) => total + (archive.cards ?? []).length, 0);
  const runtimeText = options.runtimeSourceText ?? runtimeSource(options.workspaceRoot);
  const pilotAllowlist = extractPilotAllowlistCount(runtimeText);
  const unclassifiedItems = rows.flatMap((row) =>
    row.unclassifiedReasons.map((reason) => ({
      archiveId: row.archiveId,
      cardId: row.cardId,
      abilityId: row.abilityId,
      reason,
    })),
  );

  const routeCounts = rows.reduce<Record<RuntimeRoute, number>>((acc, row) => {
    acc[row.runtimeRoute] = (acc[row.runtimeRoute] ?? 0) + 1;
    return acc;
  }, {
    NEW_RUNTIME_SEMANTIC_ROUTED: 0,
    LEGACY_RESOLVE_EFFECT: 0,
    LEGACY_EXECUTE_ABILITY: 0,
    DUAL_COMPATIBLE: 0,
    NOT_CLASSIFIABLE: 0,
  });

  const baseline: LegacyMetricsSnapshot = {
    legacyExecuteAbilityConsumers: options.baseline?.legacyExecuteAbilityConsumers ?? routeCounts.LEGACY_EXECUTE_ABILITY,
    legacyResolveEffectConsumers: options.baseline?.legacyResolveEffectConsumers ?? routeCounts.LEGACY_RESOLVE_EFFECT,
    dualRuntimeConsumers: options.baseline?.dualRuntimeConsumers ?? routeCounts.DUAL_COMPATIBLE,
    pilotAllowlistEntries: options.baseline?.pilotAllowlistEntries ?? pilotAllowlist,
    unsupportedNodes: options.baseline?.unsupportedNodes ?? unclassifiedItems.length,
  };

  const exactPrimitiveCounts = countAxis(rows, 'exactEffectPrimitives');
  const unknownPrimitiveCounts: Record<string, number> = {};
  for (const [primitive, count] of Object.entries(exactPrimitiveCounts)) {
    if (!knownPrimitiveTypes.has(primitive)) unknownPrimitiveCounts[primitive] = count;
  }

  const semanticRouteCounts: Record<string, number> = {};
  for (const row of rows) {
    for (const route of row.semanticRoutes) increment(semanticRouteCounts, route);
  }

  const artifact = {
    schemaVersion: 'fd-phase3-skill-coverage-v1',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    sourceFingerprint: fingerprint(archives),
    counts: {
      totalArchives: archives.length,
      totalCards,
      totalAbilities: rows.length,
      abilityKindCounts: countAxis(rows, 'abilityKind'),
      timingCounts: countAxis(rows, 'timingWindows'),
      domainEventTriggerCounts: countAxis(rows, 'domainEventTriggers'),
      requirementCounts: countAxis(rows, 'requirements'),
      targetCounts: countAxis(rows, 'targets'),
      costCounts: countAxis(rows, 'costs'),
      interactionCounts: countAxis(rows, 'interactions'),
      strictPendingInteractionCounts: countAxis(rows, 'strictPendingInteractions'),
      effectPrimitiveFamilyCounts: countAxis(rows, 'effectPrimitiveFamilies'),
      modifierCounts: countAxis(rows, 'modifiers'),
      lifecyclePolicyCounts: countAxis(rows, 'lifecyclePolicies'),
      hiddenInformationCounts: countAxis(rows, 'hiddenInformation'),
      resultBindingCounts: countAxis(rows, 'resultBinding'),
      battleIntegrationCounts: countAxis(rows, 'battleIntegration'),
      specialSubsystemCounts: countAxis(rows, 'specialSubsystems'),
    },
    semanticAxes: rows,
    runtimeRouting: {
      semanticRouteCounts: Object.fromEntries(Object.entries(semanticRouteCounts).sort(([left], [right]) => left.localeCompare(right))),
      newRuntimeConsumers: counter(0, routeCounts.NEW_RUNTIME_SEMANTIC_ROUTED),
      legacyExecuteAbilityConsumers: counter(baseline.legacyExecuteAbilityConsumers, routeCounts.LEGACY_EXECUTE_ABILITY),
      legacyResolveEffectConsumers: counter(baseline.legacyResolveEffectConsumers, routeCounts.LEGACY_RESOLVE_EFFECT),
      dualRuntimeConsumers: counter(baseline.dualRuntimeConsumers, routeCounts.DUAL_COMPATIBLE),
      notClassifiable: counter(baseline.unsupportedNodes, routeCounts.NOT_CLASSIFIABLE),
      pilotAllowlistEntries: counter(baseline.pilotAllowlistEntries, pilotAllowlist),
      cardSpecificRuntimeHandlers: detectRuntimeCardSpecificHandlers(options.workspaceRoot),
    },
    legacyMetrics: {
      legacyExecuteAbilityConsumers: counter(baseline.legacyExecuteAbilityConsumers, routeCounts.LEGACY_EXECUTE_ABILITY),
      legacyResolveEffectConsumers: counter(baseline.legacyResolveEffectConsumers, routeCounts.LEGACY_RESOLVE_EFFECT),
      dualRuntimeConsumers: counter(baseline.dualRuntimeConsumers, routeCounts.DUAL_COMPATIBLE),
      pilotAllowlistEntries: counter(baseline.pilotAllowlistEntries, pilotAllowlist),
      unsupportedNodes: counter(baseline.unsupportedNodes, unclassifiedItems.length),
      kpiNote: 'KPI tracks routing/legacy consumers and unsupported nodes, not raw ability count.',
    },
    primitiveCoverage: {
      exactPrimitiveCounts,
      primitiveFamilyCounts: countAxis(rows, 'effectPrimitiveFamilies'),
      unknownPrimitiveCounts,
    },
    gateEvidenceMetadata: {
      authority: 'IMPLEMENTER_EVIDENCE_ONLY',
      allowedClaim: 'AUTOMATION_BASELINE_CANDIDATE',
      reviewerRequiredForPromotion: true,
      promotedStatuses: [],
    },
    taxonomyDriftProtections: {
      warnings: rows.flatMap((row) =>
        row.taxonomyWarnings.map((warning) => ({
          archiveId: row.archiveId,
          cardId: row.cardId,
          abilityId: row.abilityId,
          warning,
        })),
      ),
      rules: [
        'phase/timing values such as phase_action are not Domain Event Trigger counts',
        'ability kinds such as passive are not Lifecycle Policy counts',
        'on_card_played is not Interaction unless the ability asks for additional player input',
        'target references do not imply PendingInteraction without declared targets',
        'unknown primitive/runtime routing is preserved as NOT_CLASSIFIABLE',
      ],
    },
    unclassifiedItems,
  };

  return artifact;
}

export function loadAuthoringArchives(workspaceRoot: string): AuthoringArchiveLike[] {
  const archives: AuthoringArchiveLike[] = [];
  for (const root of authoringRoots) {
    const directory = resolve(workspaceRoot, root);
    for (const fileName of readdirSync(directory).filter((name) => name.endsWith('.json')).sort()) {
      archives.push(JSON.parse(readFileSync(join(directory, fileName), 'utf8')) as AuthoringArchiveLike);
    }
  }
  return archives;
}

async function compiledPackSummary(workspaceRoot: string) {
  const [{ loadPlaytestContentPack, validateLoadedPlaytestPack, compileLoadedPlaytestPack }, { compileExecutableCardPack }] = await Promise.all([
    import('../packages/content/src/playtest-pack-loader'),
    import('../packages/rules/src/ability/executable-card-pack'),
  ]);
  const pack = loadPlaytestContentPack(resolve(workspaceRoot, 'data/packs/fd-playtest-v1/pack.json'), { workspaceRoot });
  const issues = validateLoadedPlaytestPack(pack, { workspaceRoot });
  const library = compileLoadedPlaytestPack(pack, issues).library;
  library.rules = compileExecutableCardPack(library);
  return {
    packId: library.pack.id,
    version: library.pack.version,
    definitionHash: library.rules.definitionHash,
    compiledCards: Object.keys(library.rules.cards).length,
    compiledCharacters: Object.keys(library.rules.characters).length,
    blockingIssues: issues.filter((issue) => issue.blocking).length,
  };
}

function printSummary(artifact: ReturnType<typeof buildCoverageFromArchives>, compiled?: Awaited<ReturnType<typeof compiledPackSummary>>): void {
  process.stdout.write('PHASE_3_COVERAGE_AND_EVIDENCE_AUTOMATION\n');
  process.stdout.write(`archives=${artifact.counts.totalArchives} cards=${artifact.counts.totalCards} abilities=${artifact.counts.totalAbilities}\n`);
  if (compiled) {
    process.stdout.write(`compiledPack=${compiled.packId}@${compiled.version} definitionHash=${compiled.definitionHash}\n`);
    process.stdout.write(`compiledCards=${compiled.compiledCards} compiledCharacters=${compiled.compiledCharacters} blockingIssues=${compiled.blockingIssues}\n`);
  }
  process.stdout.write(`newRuntimeSemanticRouted=${artifact.runtimeRouting.newRuntimeConsumers.after}\n`);
  process.stdout.write(`legacyExecuteAbility=${artifact.runtimeRouting.legacyExecuteAbilityConsumers.after}\n`);
  process.stdout.write(`legacyResolveEffect=${artifact.runtimeRouting.legacyResolveEffectConsumers.after}\n`);
  process.stdout.write(`dualRuntime=${artifact.runtimeRouting.dualRuntimeConsumers.after}\n`);
  process.stdout.write(`pilotAllowlist=${artifact.runtimeRouting.pilotAllowlistEntries.after}\n`);
  process.stdout.write(`notClassifiable=${artifact.runtimeRouting.notClassifiable.after}\n`);
  process.stdout.write(`taxonomyWarnings=${artifact.taxonomyDriftProtections.warnings.length}\n`);
}

function parseOutputPath(argv: string[], workspaceRoot: string): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return resolve(workspaceRoot, argv[index + 1]!);
  return resolve(workspaceRoot, 'artifacts/phase3-skill-coverage.json');
}

export async function runPhase3CoverageCli(argv = process.argv.slice(2), workspaceRoot = resolve('.')): Promise<void> {
  const archives = loadAuthoringArchives(workspaceRoot);
  const artifact = buildCoverageFromArchives(archives, { workspaceRoot });
  const compiled = await compiledPackSummary(workspaceRoot);
  const outputPath = parseOutputPath(argv, workspaceRoot);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify({ ...artifact, compiledDefinitions: compiled }, null, 2)}\n`, 'utf8');
  printSummary(artifact, compiled);
  process.stdout.write(`artifact=${relative(workspaceRoot, outputPath)}\n`);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  runPhase3CoverageCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
