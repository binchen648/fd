import type { AuthoringAbility, AuthoringCard, AuthoringPack, ExecutionMode, RuleNode, AdapterReportEntry } from './types';
import { hostOperations } from './types';
import { ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID } from '../core/card-source-state';
import { isPrivateOptionalHandPlayInteractionCandidate, isPrivateOptionalHandPlayInteractionSemantic } from './interaction-gateway';
import { isAcceptedControlledCardCloseForbidModifier } from './card-close-forbid';
import {
  OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT,
  OPPONENT_CLOSE_ONE_NON_RESIDUAL_EFFECT,
  isAcceptedOpponentCloseToOneAbility,
  isAcceptedOpponentCloseOneNonResidualAbility,
  isOpponentCloseToOneCandidate,
} from './opponent-close-to-one';
export function node(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
export function nodes(value: unknown): RuleNode[] { return Array.isArray(value) ? value.map(node) : []; }
export function str(value: unknown): string { return typeof value === 'string' ? value : ''; }
function isAcceptedMagicResistanceIndependentModifierLifecycle(rawAbility: RuleNode, modifier: RuleNode): boolean {
  if (str(rawAbility.kind) !== 'phase_action') return false;
  const activation = node(rawAbility.activation);
  if (str(activation.phase) !== 'combat' || str(activation.opens) !== 'controller_combat_action_window' ||
    str(activation.requiresSourceState) !== 'active' ||
    !Object.keys(activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key))) return false;
  if (nodes(rawAbility.conditions).length !== 0 || nodes(rawAbility.targets).length !== 0 ||
    (Array.isArray(rawAbility.cost) ? nodes(rawAbility.cost).length !== 0 : rawAbility.cost !== undefined) ||
    nodes(rawAbility.effects).length !== 0 || nodes(rawAbility.creates).length !== 0 || nodes(rawAbility.ruleModifiers).length !== 1 ||
    Object.keys(node(rawAbility.lifecycle)).length !== 0 || Object.keys(node(rawAbility.responseWindow)).length !== 0 ||
    Object.keys(node(rawAbility.limit)).length !== 0 || Object.keys(node(rawAbility.visibility)).length !== 0) return false;
  const scope = node(modifier.scope); const constraints = nodes(scope.constraints); const lifecycle = node(modifier.lifecycle);
  return str(modifier.type) === 'combat_power_modifier' && modifier.operation === 'set' && modifier.rule === 'attack.currentPower' &&
    Number(modifier.value) === 0 && Number.isFinite(Number(modifier.value)) &&
    str(scope.controller) === 'engaged_opponents_same_battlefield' && str(scope.object) === 'attack_card' &&
    Object.keys(scope).every((key) => ['controller', 'object', 'constraints'].includes(key)) &&
    constraints.length === 1 && str(constraints[0]!.type) === 'has_attribute' && str(constraints[0]!.attribute) === '魔术' &&
    Object.keys(constraints[0]!).every((key) => ['type', 'attribute'].includes(key)) &&
    str(lifecycle.duration) === 'this_round' && Object.keys(lifecycle).every((key) => key === 'duration') &&
    Object.keys(modifier).every((key) => ['id', 'printedClause', 'type', 'operation', 'rule', 'scope', 'value', 'lifecycle'].includes(key));
}
const supportedTypes = new Set([
  'controller_alone_at_battlefield', 'claim_and_discard_location_events', 'any_enabled_location',
  'skill_zone_mana_at_least', 'played_with_basic_attack', 'draw_cards', 'play_selected_cards', 'base_power_at_most',
  'reveal_information', 'set_zone_visibility', 'look_at_deck_top', 'move_card', 'move_all_remaining',
  'shuffle_zone_into_deck', 'shuffle_deck', 'adjust_mana', 'adjust_victory_points', 'move_player', 'branch',
  'create_card', 'pay_mana', 'move_source_card', 'integer', 'lte', 'gt', 'exists_target', 'played_this_round',
  'or', 'and', 'not', 'not_card_type', 'is_attack', 'has_attribute', 'not_source_card', 'has_card_id',
  'source_card_in_zone', 'controller_at_location_kind', 'reachable_along_arrows', 'can_adjust_mana',
  'event_played_card_has_attribute', 'source_reversed', 'source_active', 'source_owned',
  'event_player_won_combat', 'event_player_lost_combat',
  'target_count_equals', 'gain_victory_points_per_target', 'transform_event_source_card',
  'controller_won_battle', 'controller_sole_winner', 'controller_mana_at_least', 'min_mana',
  // New types for 5 servants
  'opponents_random_discard', 'lock_battlefield', 'exclude_from_terrain_and_external_effects',
  'choice', 'set_opponent_power_to_zero', 'forbid_opponents_noble_phantasm',
  'create_status', 'terrain_multiplier', 'controller_seat_in_first_half',
  'reduce_opponents_power', 'move_card_from_zone_to_skill', 'controller_at_battlefield',
  'controller_servant_revealed', 'choice_is', 'hide_servant_true_name', 'close_source_card',
  'controller_at_battlefield_with_exactly_one_opponent',
  'reverse_situation_event_power_modifiers', 'reverse_situation_and_event_power_modifiers',
  'controller_played_highest_cost_noble_phantasm_in_battle_this_round',
  'controller_strict_second_battle_power', 'defeat_highest_power_opponents',
  'highest_cost_noble_phantasm_cost_at_least', 'selected_count_at_least',
  'create_modifier', 'not_location_kind', 'power_bonus', 'card_not_on_board', 'not_card_id',
  // Master authoring adapters
  'record_master_directive', 'adjust_command_seals', 'set_mana', 'create_independent_deck',
  'draw_from_independent_deck', 'activate_card_by_id', 'replace_card_in_deck',
  'movement_rule_override', 'deployment_rule_override', 'play_source_card',
  'attach_card_to_player_attack', 'append_only_rule', 'transfer_vp_to_owner',
  'look_at_match_deck_bottoms', 'swap_revealed_with_deck_bottom',
  'soul_drag_power_bonus', 'transform_to_return_silence_on_loss', 'return_silence_battle_start',
  'false_attendant_book_replacement', 'existing_attack_controlled_by_target', 'not_controller', 'at_battlefield',
  // Phase 3A resolution/data-flow infrastructure
  'remove_advantage_position', 'noop', 'fail_invariant', 'install_rule_override', 'provision_skill_cards',
  OPPONENT_CLOSE_NON_RESIDUAL_TO_ONE_EFFECT, OPPONENT_CLOSE_ONE_NON_RESIDUAL_EFFECT,
]);
const formulaOps = new Set(['const', 'var', 'add', 'multiply', 'min', 'count_cards', 'gt', 'lte']);
const triggers = new Set(['on_use_declared', 'on_card_played', 'controller_action_window', 'controller_combat_action_window',
  'after_battle_result_determined', 'after_controller_wins_battle', 'after_controller_gains_victory', 'when_formula_condition_met',
  // New triggers for 5 servants
  'after_controller_loses_battle', 'while_active', 'when_power_calculation_applied',
  'after_battle_ended', 'after_player_deployed_to_battlefield', 'when_play_requirements_checked',
  // Master triggers
  'game_start', 'after_controller_enters_location', 'after_controller_loses_all_command_seals',
  'round_end', 'after_controller_first_loses_battle', 'after_battle_power_calculated',
  'before_situation_or_event_resolves', 'when_movement_options_requested',
]);
const mechanicKeys = new Set(['type', 'id', 'printedClause', 'scope', 'subject', 'owner', 'player', 'target', 'amount', 'count',
  'resultZone', 'visibility', 'to', 'from', 'optional', 'excluding', 'branches', 'if', 'then', 'else', 'cardId', 'zone',
  'var', 'op', 'args', 'left', 'right', 'formula', 'formulaRef', 'printedExpression', 'constraints', 'value', 'min', 'max',
  'targetRef', 'resultVar', 'optionalCost', 'uses', 'conditions', 'locationKind', 'maxSteps', 'cardType', 'face', 'attribute', 'sourceCard',
  'countTarget', 'amountPerTarget',
  'object', 'controller', 'location', 'negated', 'tier', 'specificity',
  'source', 'interpretation', 'name',
  // New mechanic keys for 5 servants
  'options', 'label', 'condition', 'targets', 'duration', 'scope', 'statusId', 'choiceId', 'value',
  'modifier', 'kind', 'rule',
  // Master mechanic keys
  'directive', 'payload', 'deckId', 'definitionId', 'quantity', 'rounding', 'targetPlayer',
  'oncePerRound', 'replacement', 'deckKinds', 'revealedKind', 'targetKind', 'controllerCannotWinStatus',
  'returnAtRoundEnd', 'preserveVictoryPoints', 'sakuraMasterId', 'fallbackServantPool',
  // Phase 3A resolution/data-flow infrastructure
  'bind', 'expr', 'binding', 'field', 'valueType', 'ids', 'reason', 'message', 'enabled', 'regular', 'climax', 'threshold', 'phase', 'targetDefinitionIds',
]);

/** Load an object or JSON text. Unsupported mechanics are retained as report entries and disabled. */
export function loadAuthoringJson(input: unknown): AuthoringPack {
  const root = node(typeof input === 'string' ? JSON.parse(input) : structuredClone(input));
  if (root.schemaVersion !== 'fd-card-authoring-v1' || !Array.isArray(root.cards) || !str(root.id)) throw new Error('Invalid authoring archive');
  const report: AdapterReportEntry[] = [];
  const cards: Record<string, AuthoringCard> = Object.create(null) as Record<string, AuthoringCard>;
  for (const raw of nodes(root.cards)) {
    const cardId = str(raw.id);
    if (!cardId || cards[cardId] || !Array.isArray(raw.abilities)) throw new Error('Invalid or duplicate card definition');
    const collectResultVars = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap(collectResultVars);
      if (!value || typeof value !== 'object') return [];
      const n = node(value);
      return [str(n.resultVar), ...Object.values(n).flatMap(collectResultVars)].filter(Boolean);
    };
    const acceptedOpponentCloseToOneAbilityIds = new Set(nodes(raw.abilities)
      .filter(a => isAcceptedOpponentCloseToOneAbility(a, 'authoring'))
      .map(a => str(a.id)).filter(Boolean));
    const boundVariables = new Map(nodes(raw.abilities).map(a => [str(a.id), [
      ...nodes(Array.isArray(a.cost) ? a.cost : a.cost ? [a.cost] : []).filter(c => c.type === 'pay_mana').map(c => str(node(c.amount).var)).filter(Boolean),
      ...collectResultVars(a.effects),
      ...collectResultVars(a.creates),
    ]]));
    const issue = (path: string, reason: string, abilityId?: string, status: ExecutionMode = 'unsupported') => {
      report.push({ cardId, ...(abilityId ? { abilityId } : {}), path, status, reason,
        suggestedImplementation: 'Add a validated handler and behavioral tests for this field before enabling automation.' });
    };
    const scan = (value: unknown, path: string, abilityId?: string): void => {
      if (Array.isArray(value)) { value.forEach((v, i) => scan(v, `${path}[${i}]`, abilityId)); return; }
      if (!value || typeof value !== 'object') return;
      const n = node(value);
      for (const key of Object.keys(n)) if (!mechanicKeys.has(key)) issue(`${path}.${key}`, 'Unmapped mechanic field', abilityId);
      const exactOpponentCloseCondition = !!abilityId && acceptedOpponentCloseToOneAbilityIds.has(abilityId) &&
        ['source_owned', 'at_battlefield'].includes(str(n.type));
      if (n.type && !supportedTypes.has(str(n.type)) && !exactOpponentCloseCondition) issue(`${path}.type`, `Unmapped type: ${str(n.type)}`, abilityId);
      if (['source_active', 'source_owned'].includes(str(n.type))) {
        if (!path.startsWith('conditions')) issue(path, 'Source-state condition is supported only under ability conditions', abilityId);
        if (!Object.keys(n).every((key) => key === 'type')) issue(path, 'Source-state condition must contain only type', abilityId);
      }
      if (['event_player_won_combat', 'event_player_lost_combat'].includes(str(n.type))) {
        if (!path.startsWith('conditions')) issue(path, 'Event combat outcome condition is supported only under ability conditions', abilityId);
        if (!Object.keys(n).every((key) => key === 'type')) issue(path, 'Event combat outcome condition must contain only type', abilityId);
      }
      if (n.type === 'target_count_equals') {
        if (!/^conditions\[\d+\]$/.test(path)) issue(path, 'Exact target-count condition is supported only as a direct ability condition', abilityId);
        if (!Object.keys(n).every((key) => ['type', 'scope', 'count'].includes(key)) ||
          str(n.scope) !== 'same_battlefield_opponents' || !Number.isSafeInteger(n.count) || Number(n.count) < 0) {
          issue(path, 'Exact target-count condition requires same_battlefield_opponents and a nonnegative safe-integer count', abilityId);
        }
      }
      if (n.type === 'gain_victory_points_per_target') {
        const countTarget = node(n.countTarget);
        if (!/^effects\[\d+\]$/.test(path)) issue(path, 'Per-target victory-point gain is supported only as a direct ability effect', abilityId);
        if (!Object.keys(n).every((key) => ['type', 'target', 'countTarget', 'amountPerTarget'].includes(key)) ||
          n.target !== 'controller' || !Object.keys(countTarget).every((key) => key === 'scope') ||
          str(countTarget.scope) !== 'same_battlefield_opponents' ||
          !Number.isSafeInteger(n.amountPerTarget) || Number(n.amountPerTarget) < 0) {
          issue(path, 'Per-target victory-point gain requires controller, same_battlefield_opponents, and a nonnegative safe-integer amountPerTarget', abilityId);
        }
      }
      if (n.op && !formulaOps.has(str(n.op))) issue(`${path}.op`, `Unmapped formula: ${str(n.op)}`, abilityId);
      const serverMetric = ['controller.availableMana', 'consecutive_play_rounds', 'game.round_number',
        'controller.movement_distance_this_round',
        'controller.battlefields_passed_or_stayed_this_round'].includes(str(n.var ?? n.name));
      if ((n.var !== undefined || n.op === 'var') && !serverMetric &&
        !(abilityId && boundVariables.get(abilityId)?.includes(str(n.var ?? n.name)))) {
        issue(`${path}.var`, `Unbound server metric or variable: ${str(n.var ?? n.name)}`, abilityId);
      }
      if (n.formulaRef && n.formulaRef !== 'cardFace.basePower') issue(`${path}.formulaRef`, 'Unmapped formula reference', abilityId);
      if (n.owner && n.owner !== 'controller') issue(`${path}.owner`, 'Only controller ownership is supported', abilityId);
      if (n.player && n.player !== 'controller') issue(`${path}.player`, 'Only controller resource/movement effects are supported', abilityId);
      if (n.type === 'reveal_information' && n.subject !== 'controller.servant') issue(`${path}.subject`, 'Only controller servant reveal is supported', abilityId);
      if (['adjust_mana', 'adjust_victory_points', 'pay_mana', 'can_adjust_mana'].includes(str(n.type)) &&
        (n.amount === undefined || typeof n.amount === 'string' || typeof n.amount === 'boolean')) issue(`${path}.amount`, 'Expected a numeric amount or controlled AST', abilityId);
      if (n.type === 'move_card' && !str(n.target)) issue(`${path}.target`, 'Card movement requires a declared target reference', abilityId);
      if (n.resultVar && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(str(n.resultVar))) issue(`${path}.resultVar`, 'Result variable must be a stable identifier', abilityId);
      if (n.type === 'move_player' && !str(n.to)) issue(`${path}.to`, 'Player movement requires a destination target reference', abilityId);
      if (n.type === 'draw_cards' && (!Number.isSafeInteger(n.count) || Number(n.count) < 0)) issue(`${path}.count`, 'Draw count must be a nonnegative integer', abilityId);
      if (n.type === 'base_power_at_most' && (typeof n.value !== 'number' || !Number.isFinite(n.value))) issue(`${path}.value`, 'Base power bound must be finite', abilityId);
      if (['move_card', 'move_source_card', 'move_all_remaining', 'create_card'].includes(str(n.type)) &&
        !['hand', 'deck', 'discard', 'field', 'skill', 'attack_area', 'removed_from_game'].includes(str(node(n.to).zone))) issue(`${path}.to.zone`, 'Unsupported or missing destination zone', abilityId);
      if (n.optionalCost && str(node(n.optionalCost).type) !== 'pay_mana') issue(`${path}.optionalCost`, 'Only optional mana payment is supported', abilityId);
      if (n.type === 'look_at_deck_top' && (n.resultZone !== 'looked_cards' || n.count === undefined)) issue(`${path}.resultZone`, 'Deck look requires a count and looked_cards temporary zone', abilityId);
      if (n.type === 'set_zone_visibility' && (n.visibility !== 'public' || n.zone !== 'discard')) issue(`${path}.visibility`, 'Only continuous public discard visibility is supported', abilityId);
      if (n.type === 'shuffle_zone_into_deck' && (node(n.from).zone !== 'discard' || node(n.to).zone !== 'deck')) issue(`${path}.from`, 'Only discard-to-deck shuffle is supported', abilityId);
      for (const [key, child] of Object.entries(n)) scan(child, `${path}.${key}`, abilityId);
    };
    const face = node(raw.cardFace);
    scan(face.cost, 'cardFace.cost'); scan(face.basePower, 'cardFace.basePower'); scan(face.requirements, 'cardFace.requirements');
    if (face.hasReversalEffect !== undefined && typeof face.hasReversalEffect !== 'boolean') issue('cardFace.hasReversalEffect', 'Expected boolean reversal metadata');
    if (face.revealsTrueNameOnReverse !== undefined && typeof face.revealsTrueNameOnReverse !== 'boolean') issue('cardFace.revealsTrueNameOnReverse', 'Expected boolean reverse reveal metadata');
    if (face.revealsTrueNameOnReverse === true && face.hasReversalEffect !== true) issue('cardFace.revealsTrueNameOnReverse', 'Reverse reveal requires an authored reversal effect');
    if (typeof face.basePower === 'string') issue('cardFace.basePower', 'String expressions are forbidden; provide a formula AST');
    scan(raw.playRequirements, 'playRequirements');
    if (face.cost !== undefined && (typeof face.cost !== 'number' || !Number.isFinite(face.cost) || face.cost < 0)) issue('cardFace.cost', 'Expected a nonnegative printed mana cost');
    const timing = node(raw.playTiming);
    const initialPlacement = raw.initialPlacement;
    if (initialPlacement !== undefined) {
      if (typeof initialPlacement !== 'string' || initialPlacement !== 'outside_game') {
        issue('initialPlacement', 'Only outside_game initial placement is supported');
      }
      if (str(raw.cardType) !== 'master_skill' || !str(root.id).startsWith('master.')) {
        issue('initialPlacement', 'Outside-game initial placement is supported only for an owned master_skill');
      }
    }
    if (node(raw.verification).implementationStatus && node(raw.verification).implementationStatus !== 'complete') issue('verification.implementationStatus', 'Archive explicitly marks this card as unfinished');
    if (timing.phase !== 'action' || timing.window !== 'controller_play_card_window') issue('playTiming', 'Unsupported card play window');
    const seen = new Set<string>();
    const abilities = nodes(raw.abilities).map((a): AuthoringAbility => {
      const id = str(a.id); if (!id || seen.has(id)) throw new Error('Invalid or duplicate ability id'); seen.add(id);
      const activation = node(a.activation); const lifecycle = node(a.lifecycle);
      const abilityKeys = new Set(['id', 'kind', 'printedClause', 'markers', 'activation', 'conditions', 'targets', 'effects', 'cost',
        'ruleModifiers', 'creates', 'lifecycle', 'responseWindow', 'limit', 'visibility', 'execution', 'copies', 'transforms']);
      for (const key of Object.keys(a)) if (!abilityKeys.has(key)) issue(key, 'Unmapped ability field', id);
      const execution = node(a.execution); const mode = str(execution.mode || 'automatic');
      if (!['automatic', 'host_adjudicated', 'unsupported', 'text_unconfirmed'].includes(mode)) issue('execution.mode', 'Invalid execution mode', id);
      if (activation.trigger && !triggers.has(str(activation.trigger))) issue('activation.trigger', 'Unmapped trigger', id);
      if (activation.phase && !['preparation', 'advance', 'action', 'combat'].includes(str(activation.phase))) issue('activation.phase', 'Unmapped phase', id);
      if (activation.requiresSourceState && activation.requiresSourceState !== 'active') issue('activation.requiresSourceState', 'Unmapped source state', id);
      if (activation.eventLocationId !== undefined && (!str(activation.eventLocationId) || !['after_controller_enters_location', 'after_player_deployed_to_battlefield'].includes(str(activation.trigger)))) issue('activation.eventLocationId', 'Event location requires a supported location-bearing trigger', id);
      if (a.kind === 'phase_action' && !['controller_action_window', 'controller_combat_action_window'].includes(str(activation.opens))) issue('activation.opens', 'Unsupported phase action window', id);
      if (activation.step) issue('activation.step', 'Subphase step mapping is not implemented', id);
      if (!['phase_action', 'passive', 'residual', 'declaration_reveal', 'conditional_reveal', 'forced_trigger', 'optional_trigger', 'response', 'continuous_formula'].includes(str(a.kind))) issue('kind', 'Unmapped ability kind', id);
      if (a.copies || a.transforms) issue('copies/transforms', 'Copy and transformation handlers are not implemented', id);
      if (lifecycle.starts && lifecycle.starts !== 'immediate') issue('lifecycle.starts', 'Only immediate lifecycle starts are supported', id);
      if (lifecycle.duration && !['round_count', 'while_card_active', 'while_active', 'this_round'].includes(str(lifecycle.duration))) issue('lifecycle.duration', 'Unmapped lifecycle', id);
      if (lifecycle.duration === 'round_count' && (!Number.isInteger(lifecycle.rounds) || Number(lifecycle.rounds) < 1)) issue('lifecycle.rounds', 'Expected positive round count', id);
      if (lifecycle.cleanup && !['expire_after_duration', 'when_card_leaves_active_area', 'remain_active', 'close_at_round_end', 'discard_at_round_end', 'remove_from_game'].includes(str(lifecycle.cleanup))) issue('lifecycle.cleanup', 'Unmapped cleanup', id);
      if (lifecycle.sourceValidity !== undefined) {
        const sourceValidity = node(lifecycle.sourceValidity);
        if (sourceValidity.kind !== 'accepted_source_state_policy' || sourceValidity.owner !== 'card_zone_source_state' ||
          sourceValidity.policyId !== ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID) {
          issue('lifecycle.sourceValidity', 'Unsupported Card Zone source-validity policy', id);
        }
        if (lifecycle.duration !== 'while_card_active' || !['when_card_leaves_active_area', 'remain_active'].includes(str(lifecycle.cleanup))) {
          issue('lifecycle.sourceValidity', 'Source-validity policy requires while_card_active with a supported source cleanup policy', id);
        }
      }
      const response = node(a.responseWindow);
      if (['optional_trigger', 'response'].includes(str(a.kind)) && !str(response.opens)) issue('responseWindow.opens', 'Explicit response window is required', id);
      if ((response.order && response.order !== 'turn_order') || (response.priority && response.priority !== 'turn_order')) issue('responseWindow.order', 'Only turn_order is supported', id);
      const limit = node(a.limit);
      if (limit.type === 'unique' && (limit.conflictPolicy !== 'only_one_effect_may_activate_per_window' || !str(limit.groupId))) issue('limit', 'Unmapped activation limit', id);
      else if (limit.type === 'per_game' && (!Number.isInteger(limit.uses) || Number(limit.uses) < 1 || str(limit.scope) !== 'this_card')) issue('limit', 'Per-game limits require positive uses and this_card scope', id);
      else if (limit.type === 'per_round' && (!Number.isInteger(limit.uses) || Number(limit.uses) < 1 || str(limit.scope) !== 'this_card')) issue('limit', 'Per-round limits require positive uses and this_card scope', id);
      else if (limit.type && !['unique', 'per_game', 'per_round'].includes(str(limit.type))) issue('limit', 'Unmapped activation limit', id);
      for (const field of ['effects', 'conditions', 'cost', 'creates']) scan(a[field], field, id);
      for (const effect of nodes(a.effects)) {
        if (effect.type === 'play_selected_cards' && !nodes(a.targets).some(t => t.id === effect.target && t.type === 'card_instance' && node(t.scope).zone === 'hand')) {
          issue('effects.target', 'Effect play requires a declared hand-card target', id);
        }
      }
      for (const target of nodes(a.targets)) {
        if (!['card_instance', 'location', 'choice', 'player'].includes(str(target.type))) issue('targets.type', 'Unmapped target type', id);
        scan(target.conditions, 'targets.conditions', id);
        if (target.type !== 'choice') {
          scan(target.constraints, 'targets.constraints', id);
          if (target.type === 'location' && nodes(target.constraints).some(c => c.type === 'any_enabled_location') &&
            nodes(target.constraints).some(c => !['any_enabled_location', 'not_location_kind'].includes(str(c.type)))) {
            issue('targets.constraints', 'Any-location selection cannot silently ignore additional constraints', id);
          }
          const scope = node(target.scope);
          if (target.type === 'card_instance' && !['battle_area', 'attack_area', 'looked_cards', 'hand', 'deck', 'removed_from_game', 'discard', 'skill'].includes(str(scope.zone))) issue('targets.scope.zone', 'Unmapped target zone', id);
          if (scope.owner && !['controller', 'any'].includes(str(scope.owner))) issue('targets.scope.owner', 'Only controller or any ownership is supported', id);
          if (scope.controller && !['self', 'any'].includes(str(scope.controller))) issue('targets.scope.controller', 'Only self or any controller targets are supported', id);
        }
        const count = node(target.count); const min = Number(count.min ?? 1); const max = Number(count.max ?? 1);
        if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || min > max) issue('targets.count', 'Invalid target cardinality', id);
      }
      for (const m of nodes(a.ruleModifiers)) {
        const acceptedCardCloseForbid = mode === 'automatic' && lifecycle.duration === 'this_round' &&
          isAcceptedControlledCardCloseForbidModifier(m);
        const operationSupported = ['add', 'set', 'ignore', 'lock', 'exclude', 'forbid'].includes(str(m.operation));
        const ruleSupported = ['attack.currentPower', 'card.currentPower', 'effect_prevention', 'battlefield', 'terrain_and_external_effects', 'use_skill_card', 'play_card_attribute', 'enter_or_leave_current_battlefield', 'terrain_and_external_effects_for_controller_and_opponents', 'terrain_and_external_servant_or_npc_effects', 'situation_restrictions', 'situation_play_forbid', 'skill_zone_mana_requirement', 'skill_zone_mana_at_least', 'netherworld_protection'].includes(str(m.rule)) ||
          (acceptedCardCloseForbid && m.rule === 'card_close');
        if (!operationSupported || !ruleSupported) issue('ruleModifiers', 'Unmapped rule or operation', id);
        if (m.rule === 'card_close' && !acceptedCardCloseForbid) issue('ruleModifiers', 'Unsupported card-close forbid selector shape', id);
        if (m.rule === 'effect_prevention' && (m.operation !== 'ignore' || node(m.priority).tier !== 'explicit_exception')) issue('ruleModifiers.priority', 'Prevention exception requires explicit_exception', id);
        const ruleIsPlayException = m.operation === 'ignore' && ['situation_restrictions', 'situation_play_forbid', 'skill_zone_mana_requirement', 'skill_zone_mana_at_least'].includes(str(m.rule));
        const ruleIsStaticException = m.operation === 'ignore' && m.rule === 'netherworld_protection';
        if (m.rule !== 'effect_prevention' && !ruleIsPlayException && !ruleIsStaticException && !lifecycle.duration && !node(m.lifecycle).duration) issue('ruleModifiers.lifecycle', 'Modifier requires lifecycle', id);
        scan(m.value, 'ruleModifiers.value', id); scan(node(m.scope).constraints, 'ruleModifiers.scope.constraints', id);
        scan(m.conditions, 'ruleModifiers.conditions', id);
        if (node(m.scope).object && !['source_card', 'this_card', 'attack_card', 'this_effect', 'engaged_opponents_same_battlefield', 'opponents_at_same_battlefield', 'all_players'].includes(str(node(m.scope).object))) issue('ruleModifiers.scope.object', 'Unmapped modifier scope', id);
        if (node(m.scope).controller && !['self', 'controller', 'engaged_opponents_same_battlefield', 'opponents_at_same_battlefield'].includes(str(node(m.scope).controller))) issue('ruleModifiers.scope.controller', 'Unmapped modifier controller', id);
        if (m.lifecycle && a.lifecycle && JSON.stringify(m.lifecycle) !== JSON.stringify(a.lifecycle) &&
          !isAcceptedMagicResistanceIndependentModifierLifecycle(a, m)) {
          issue('ruleModifiers.lifecycle', 'Independent modifier lifecycles require a separate ongoing handler', id);
        }
      }
      const installsRuleOverride = nodes(a.effects).some(effect => effect.type === 'install_rule_override');
      const provisionsSkillCards = nodes(a.effects).some(effect => effect.type === 'provision_skill_cards');
      if (installsRuleOverride || provisionsSkillCards) {
        const executionKeys = new Set(['mode', 'hostOps', 'allowedOperations']);
        for (const key of Object.keys(execution)) {
          if (!executionKeys.has(key)) issue(`execution.${key}`, 'Unmapped rule-override execution field', id);
        }
        if (Object.prototype.hasOwnProperty.call(execution, 'hostOps') && Object.prototype.hasOwnProperty.call(execution, 'allowedOperations')) {
          issue('execution', 'Rule-override execution cannot declare both hostOps and allowedOperations', id);
        }
        for (const operationsKey of ['hostOps', 'allowedOperations'] as const) {
          if (!Object.prototype.hasOwnProperty.call(execution, operationsKey)) continue;
          const authority = execution[operationsKey];
          if (!Array.isArray(authority) || authority.length !== 0) {
            issue(`execution.${operationsKey}`, 'Automatic rule-override execution authority must be an empty array when declared', id);
          }
        }
      }
      const requested = execution.hostOps ?? execution.allowedOperations;
      const defaultAllowed = mode === 'automatic' && (installsRuleOverride || provisionsSkillCards) ? [] : [...hostOperations];
      const allowed = Array.isArray(requested) ? hostOperations.filter(op => requested.includes(op)) : defaultAllowed;
      if (Array.isArray(requested) && requested.some(op => !hostOperations.includes(op as typeof hostOperations[number]))) issue('execution.hostOps', 'Operation outside the host allowlist', id);
      if (mode !== 'automatic') issue('execution.mode', str(execution.reason) || mode, id, mode as ExecutionMode);
      const candidateAbility: AuthoringAbility = { id, kind: str(a.kind), printedClause: str(a.printedClause), activation,
        conditions: nodes(a.conditions), targets: nodes(a.targets), effects: nodes(a.effects),
        cost: Array.isArray(a.cost) ? nodes(a.cost) : a.cost ? [node(a.cost)] : [],
        ruleModifiers: nodes(a.ruleModifiers), creates: nodes(a.creates), lifecycle,
        responseWindow: { ...response, order: 'turn_order', passBehavior: 'decline_this_window' },
        limit, visibility: node(a.visibility), execution: { mode: mode as ExecutionMode, allowedOperations: allowed } };
      if (isPrivateOptionalHandPlayInteractionCandidate(candidateAbility) && !isPrivateOptionalHandPlayInteractionSemantic(candidateAbility)) {
        issue('interaction.gateway', 'Unsupported private optional hand-play interaction semantic shape', id);
      }
      if (isOpponentCloseToOneCandidate(a) && !isAcceptedOpponentCloseToOneAbility(a, 'authoring') &&
          !isAcceptedOpponentCloseOneNonResidualAbility(a, 'authoring')) {
        issue('opponentCloseToOne.gateway', 'Unsupported opponent close-to-one interaction semantic shape', id);
      }
      const failure = report.find(r => r.abilityId === id && r.status === 'unsupported');
      const visibility = candidateAbility.visibility;
      if (Array.isArray(a.markers) && a.markers.includes('真名解放') && !visibility.revealTiming) {
        visibility.revealsTrueName = true; visibility.revealTiming = 'on_use_declared'; visibility.revealScope = 'servant_package';
      }
      return { ...candidateAbility, visibility,
        execution: { mode: failure ? 'unsupported' : mode as ExecutionMode, allowedOperations: allowed } };
    });
    cards[cardId] = { id: cardId, name: str(raw.name), cardType: str(raw.cardType), cardFace: face,
      playTiming: timing, playRequirements: nodes(raw.playRequirements), abilities,
      ...(initialPlacement === 'outside_game' && str(raw.cardType) === 'master_skill' && str(root.id).startsWith('master.')
        ? { initialPlacement: 'outside_game' as const }
        : {}),
      mode: report.some(r => r.cardId === cardId && !r.abilityId) ? 'unsupported' : 'automatic' };
  }
  const publicCards = nodes(root.cards).map(c => ({ id: str(c.id), name: str(c.name), printedText: str(c.printedText), cardFace: node(c.cardFace) }));
  return { cards, report, servantPackage: { id: str(root.id), name: str(root.name), class: str(root.class),
    publicInformation: node(root.publicInformation), skillCards: publicCards.filter(c => cards[c.id]?.cardType === 'servant_skill'), knownCardDefinitions: publicCards } };
}
