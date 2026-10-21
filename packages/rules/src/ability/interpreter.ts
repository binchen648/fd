import type { GameState, PhaseName } from '../schema/game';
import type { CardInstance } from '../schema/card';
import type { LocationId } from '../schema/location';
import { canOccupyLocation, getEnabledLocations } from '../core/map-engine';
import { ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID, evaluateCardSourceValidity, isActiveCardSource } from '../core/card-source-state';
import { isPrivateOptionalHandPlayInteractionCandidate, isPrivateOptionalHandPlayInteractionSemantic } from './interaction-gateway';
import { isCardCloseForbidden } from './card-close-forbid';
import { checkExtendedCondition, resolveExtendedEffect } from './extended-effects';
import { clearTransientCardTransformState, getEffectiveCardAttributes } from './card-instance-state';
import { commandSpellPhaseOverride, grantMana, ignoresSituationPlayForbid, installGameStartRuleOverride, isExactGameStartRuleOverrideEffect, movementLockedByPersistentRule, persistentExtraAttackAllowance, situationForbidsAttribute } from '../core/rule-overrides';
import { hasActiveZoukenAscension } from '../core/zouken-ascension';
import { hasActiveZoukenFounder } from '../core/zouken-founder';
import { node, nodes, str } from './loader';
import { isGameStartSkillProvisioningCandidate, isGameStartSkillProvisioningSemantic } from './game-start-skill-provisioning';
import { hasRequiredAdditionalPlayMarker } from './required-additional-play';
import {
  isAcceptedOpponentCloseToOneAbility,
  isOpponentCloseToOneCandidate,
} from './opponent-close-to-one';
import {
  advanceOpponentCloseToOneServerAuthority,
  clearOpponentCloseToOneServerAuthority,
  copyOpponentCloseToOneServerAuthority,
  getOpponentCloseToOneServerAuthority,
  installOpponentCloseToOneServerAuthority,
} from './opponent-close-to-one-authority';
export { isGameStartSkillProvisioningSemantic } from './game-start-skill-provisioning';
import {
  DataFlowValidationError,
  normalizeResolutionDataFlowNodes,
  executeResolution,
  ResolutionRuntimeError,
  type KnownEffectResult,
} from './resolution-dataflow';
import type {
  AbilityCommand, AbilityDefinitionPack, AbilityEvent, AbilityPlayerView, AbilityRuntime, AuthoringAbility, AuthoringCard,
  BattleResult, BattleResultData, CalculationLine, CardPlayClassification, CardRuntimeState, DispatchResult, EffectContext, ExecutableCardDefinition,
  LegalAction, OngoingEffect, PendingDecision, PendingOpponentCloseToOne, RuleNode, TriggeredAbility,
  AbilityInteractionClassification,
  PlayCardAction,
} from './types';

class RuleRejection extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}
function reject(code: string, message: string): never { throw new RuleRejection(code, message); }
function runtime(s: GameState): AbilityRuntime {
  if (!s.abilityRuntime) reject('not_initialized', 'Ability runtime is not initialized');
  return s.abilityRuntime;
}
function modeState(s: GameState): Record<string, any> {
  const carrier = s as unknown as { modeState?: Record<string, any> };
  carrier.modeState ??= {};
  return carrier.modeState;
}
function stagedAttacks(s: GameState): Record<string, PlayCardAction[]> {
  const store = modeState(s);
  store.stagedAttacks ??= {};
  return store.stagedAttacks;
}
function pushModeDirective(s: GameState, entry: Record<string, unknown>): void {
  const store = modeState(s);
  store.masterDirectives ??= [];
  store.masterDirectives.push(entry);
}
function player(s: GameState, id: string) {
  const p = s.players.find(p => p.id === id); if (!p) reject('invalid_player', 'Unknown player'); return p;
}
function card(s: GameState, id: string): CardInstance {
  const c = s.cards.find(c => c.instanceId === id); if (!c) reject('illegal_action', 'Card is not available'); return c;
}
function definition(s: GameState, id: string): AuthoringCard | undefined { return runtime(s).pack.cards[card(s, id).definitionId]; }
function abilityDefinition(s: GameState, source: string, abilityId: string): AuthoringAbility {
  const a = definition(s, source)?.abilities.find(a => a.id === abilityId);
  if (!a) reject('illegal_action', 'Ability is not available'); return a;
}
function nextId(s: GameState, label: string): string { return `${label}-${++runtime(s).sequence}`; }
function active(s: GameState, id: string): boolean {
  card(s, id);
  return isActiveCardSource(s, id);
}
function phase(s: GameState): string { return s.round.activePhase === 'battle' ? 'combat' : s.round.activePhase; }
function isAttack(d: AuthoringCard | undefined): boolean {
  return !!d && ['servant_skill', 'servant_deck_card', 'servant_attack', 'basic_attack'].includes(d.cardType);
}
function legacyCardPlayClassification(d: AuthoringCard | undefined): CardPlayClassification {
  if (!d) return { playKind: 'support', destinationZone: 'field' };
  const attributes = d.cardFace.attributes;
  const hasPowerFormula = typeof d.cardFace.basePower === 'object' && d.cardFace.basePower !== null;
  const hasOnPlayResidual = d.abilities.some(a => a.kind === 'residual' && a.activation.trigger === 'on_card_played');
  const attack = ['servant_deck_card', 'servant_attack', 'basic_attack', 'master_deck_card'].includes(d.cardType) ||
    hasOnPlayResidual ||
    ((Number(d.cardFace.basePower ?? 0) > 0 || hasPowerFormula) && Array.isArray(attributes) && attributes.length > 0) ||
    d.abilities.some(a => a.effects.some(effect => effect.type === 'append_only_rule'));
  return attack ? { playKind: 'attack', destinationZone: 'attack_area' } : { playKind: 'support', destinationZone: 'field' };
}
/** Stable play classification. Card type, rather than power or effects, owns destination semantics. */
export function classifyCardPlay(d: AuthoringCard | undefined): CardPlayClassification {
  if (hasRequiredAdditionalPlayMarker(d)) return { playKind: 'attack', destinationZone: 'attack_area' };
  if (d && 'playKind' in d && 'destinationZone' in d) {
    return {
      playKind: d.playKind as CardPlayClassification['playKind'],
      destinationZone: d.destinationZone as CardPlayClassification['destinationZone'],
    };
  }
  const attack = !!d && ['servant_skill', 'servant_deck_card', 'servant_attack', 'basic_attack', 'master_deck_card'].includes(d.cardType);
  return attack ? { playKind: 'attack', destinationZone: 'attack_area' } : { playKind: 'support', destinationZone: 'field' };
}
function cardPlayClassification(s: GameState, sourceId: string): CardPlayClassification {
  const d = definition(s, sourceId);
  return runtime(s).playRulesVersion === 'legacy-v0' ? legacyCardPlayClassification(d) : classifyCardPlay(d);
}
function entersAttackArea(s: GameState, sourceId: string): boolean {
  return cardPlayClassification(s, sourceId).playKind === 'attack';
}
function isCommandSpellCard(s: GameState, sourceId: string): boolean {
  return definition(s, sourceId)?.cardType === 'command_spell';
}
function isRequiredAdditionalPlayCard(s: GameState, sourceId: string): boolean {
  return hasRequiredAdditionalPlayMarker(definition(s, sourceId));
}
function legacyAttackAreaCardsPlayedThisRound(s: GameState, playerId: string): number {
  return s.cards.filter(c =>
    c.controllerPlayerId === playerId &&
    c.zone === 'attack_area' &&
    runtime(s).cardState[c.instanceId]?.playedRound === s.round.roundNumber &&
    !isRequiredAdditionalPlayCard(s, c.instanceId)).length;
}
function attacksDeclaredThisRound(s: GameState, playerId: string): number {
  const r = runtime(s);
  if (r.playRulesVersion === 'legacy-v0') return legacyAttackAreaCardsPlayedThisRound(s, playerId);
  return r.playCounters?.round === s.round.roundNumber ? r.playCounters.attacksDeclaredByPlayer[playerId] ?? 0 : 0;
}
function extraAttackPlayAllowance(s: GameState, playerId: string): number {
  const entries = modeState(s).extraAttackPlaysThisRound;
  if (!entries || typeof entries !== 'object') return 0;
  const value = (entries as Record<string, unknown>)[playerId];
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : 0;
}
function attackPlayAllowance(s: GameState, playerId: string): number {
  const normalAttackCount = runtime(s).playRulesVersion === 'legacy-v0' ? 1 : 2;
  return normalAttackCount + extraAttackPlayAllowance(s, playerId) + persistentExtraAttackAllowance(s, playerId);
}
function attackPlayLimitReached(s: GameState, playerId: string, sourceId: string, ignoreStaged = false): boolean {
  if (!entersAttackArea(s, sourceId) || isRequiredAdditionalPlayCard(s, sourceId)) return false;
  const staged = ignoreStaged ? 0 : (stagedAttacks(s)[playerId] ?? []).filter(choice =>
    entersAttackArea(s, choice.cardInstanceId) && !isRequiredAdditionalPlayCard(s, choice.cardInstanceId)).length;
  return attacksDeclaredThisRound(s, playerId) + staged >= attackPlayAllowance(s, playerId);
}
function expectedPhaseWindow(abilityPhase: string): string | undefined {
  if (abilityPhase === 'combat') return 'controller_combat_action_window';
  if (abilityPhase === 'preparation' || abilityPhase === 'advance' || abilityPhase === 'action') return 'controller_action_window';
  return undefined;
}
function phaseClassification(abilityPhase: string): Pick<AbilityInteractionClassification, 'phase'> {
  return abilityPhase === 'preparation' || abilityPhase === 'advance' || abilityPhase === 'action' || abilityPhase === 'combat' ? { phase: abilityPhase } : {};
}
export function classifyAbilityInteraction(a: AuthoringAbility): AbilityInteractionClassification {
  const activation = node(a.activation);
  const response = node(a.responseWindow);
  const abilityPhase = str(activation.phase);
  const opens = str(activation.opens);
  const trigger = str(activation.trigger);
  const executionMode = str(a.execution?.mode || 'automatic');
  const phasePart = phaseClassification(abilityPhase);
  if (executionMode !== 'automatic') {
    return { kind: executionMode === 'host_adjudicated' ? 'host_directive' : 'unsupported', ...phasePart, window: opens, trigger, reason: executionMode };
  }
  if (a.kind === 'phase_action') {
    const expected = expectedPhaseWindow(abilityPhase);
    if (!expected) return { kind: 'unsupported', window: opens, reason: 'phase_action_missing_or_unknown_phase' };
    if (opens !== expected) return { kind: 'unsupported', ...phasePart, window: opens, reason: 'phase_action_window_mismatch' };
    return { kind: 'phase_activation', ...phasePart, window: opens, commandType: 'activate_ability' };
  }
  if (a.kind === 'passive' && abilityPhase) {
    const expected = expectedPhaseWindow(abilityPhase);
    if (!expected) return { kind: 'unsupported', window: opens, reason: 'passive_phase_missing_or_unknown_phase' };
    if (opens && opens !== expected) return { kind: 'unsupported', ...phasePart, window: opens, reason: 'passive_phase_window_mismatch' };
    return { kind: 'phase_activation', ...phasePart, window: opens || expected, commandType: 'activate_ability' };
  }
  if (a.kind === 'passive' && trigger && trigger !== 'while_active' && trigger !== 'when_play_requirements_checked') {
    return { kind: 'response_window', ...phasePart, window: str(response.opens) || trigger, trigger, commandType: 'resolve_response' };
  }
  if (a.kind === 'optional_trigger' || a.kind === 'response') {
    return { kind: 'response_window', ...phasePart, window: str(response.opens) || opens, trigger, commandType: 'resolve_response' };
  }
  if (a.kind === 'forced_trigger') return { kind: 'automatic_trigger', ...phasePart, window: opens, trigger };
  if (['passive', 'residual', 'declaration_reveal', 'conditional_reveal', 'continuous_formula'].includes(a.kind)) {
    return { kind: 'automatic_rule', ...phasePart, window: opens, trigger };
  }
  return { kind: 'unsupported', ...phasePart, window: opens, trigger, reason: `unknown_kind:${a.kind}` };
}
function isBattlefield(s: GameState, locationId: string | undefined): boolean {
  return !!locationId && getEnabledLocations(s.map, s.locationConfig).some(l => l.id === locationId && l.tags.includes('battlefield'));
}
function sameBattlefield(s: GameState, a: string | undefined, b: string | undefined): boolean {
  return !!a && a === b && isBattlefield(s, a);
}
function context(s: GameState, sourceCardId: string, abilityId: string, event?: AbilityEvent): EffectContext {
  return { sourceCardId, abilityId, controllerId: card(s, sourceCardId).controllerPlayerId, variables: {}, selections: {}, ...(event ? { event } : {}) };
}
export function initializeAbilityRuntime(s: GameState, pack: AbilityDefinitionPack, options: { seed?: number; roomMode?: 'standard' | 'development'; playRulesVersion?: 'legacy-v0' | 'explicit-v1' } = {}): void {
  if (s.abilityRuntime) reject('already_initialized', 'Ability runtime already exists');
  s.abilityRuntime = { pack: structuredClone(pack), revision: 0, sequence: 0, randomState: (options.seed ?? 1) >>> 0 || 1,
    cardState: {}, ongoingEffects: [], lifecycleTransitions: [], responseWindows: [], pendingDelayedActivations: [], pendingPresenceConcealmentDefeats: [], pendingPostBattleEvents: [], usedAbilities: {}, processedEvents: [], revealedServants: [],
    events: [], calculations: [], preventEffects: false, manaCaps: {}, manaGainBlocked: [], hostRequests: [], roomMode: options.roomMode ?? 'standard',
    abilityUsage: {}, noblePhantasmCostsThisRound: {}, consecutivePlayRounds: {},
    movementDistanceThisRound: {}, battlefieldsPassedOrStayedThisRound: {},
    manaGainedThisRound: { round: s.round.roundNumber, byPlayer: {} },
    zoukenS4RoundSettledBySource: {}, zoukenS4BattleSettledBySource: {},
    playRulesVersion: options.playRulesVersion ?? 'explicit-v1',
    playCounters: { round: s.round.roundNumber, cardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} } };
}
export function createBattleResult(data: BattleResultData): BattleResult {
  const winners = [...new Set(data.winners)]; const loserIds = [...new Set(data.loserIds)];
  return { winners, loserIds, didWin: id => winners.includes(id), isSoleWinner: id => winners.length === 1 && winners[0] === id };
}
function hasReverseArrowMovement(s: GameState, playerId: string | undefined): boolean {
  if (!playerId) return false;
  if (s.ruleOverrides?.reverseArrowMovementPlayerIds?.includes(playerId)) return true;
  return s.cards.some(c => c.controllerPlayerId === playerId && active(s, c.instanceId) &&
    (runtime(s).pack.cards[c.definitionId]?.abilities ?? []).some(a =>
      [...a.effects, ...a.creates].some(effect => effect.type === 'movement_rule_override' && effect.rule === 'reverse_arrow_movement')));
}

/** Directed breadth-first traversal; disabled nodes are never traversed. */
export function getReachableLocationsAlongArrows(s: GameState, from: string, maxSteps: number, movingPlayerId?: string): LocationId[] {
  if (!Number.isInteger(maxSteps) || maxSteps < 0 || maxSteps > s.map.locations.length) reject('invalid_path', 'Invalid maximum steps');
  const locations = getEnabledLocations(s.map, s.locationConfig); const visited = new Set([from]);
  const queue = [{ id: from, distance: 0 }]; const result: LocationId[] = [];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!; if (current.distance >= maxSteps) continue;
    const directLinks = locations.find(l => l.id === current.id)?.movementLinks ?? [];
    const reverseLinks = hasReverseArrowMovement(s, movingPlayerId)
      ? locations.filter(l => l.movementLinks.includes(current.id as LocationId)).map(l => l.id)
      : [];
    for (const link of [...directLinks, ...reverseLinks]) {
      if (visited.has(link) || !locations.some(l => l.id === link)) continue;
      visited.add(link); result.push(link); queue.push({ id: link, distance: current.distance + 1 });
    }
  }
  return result;
}
function constraint(s: GameState, ctx: EffectContext, candidate: CardInstance, c: RuleNode): boolean {
  const d = runtime(s).pack.cards[candidate.definitionId];
  switch (c.type) {
    case 'base_power_at_most': return !!d && d.mode === 'automatic' && d.abilities.every(a => a.execution.mode === 'automatic') &&
      d.cardFace.basePower !== undefined && evaluateFormula(d.cardFace.basePower, s, ctx.controllerId, candidate.instanceId).value <= Number(c.value);
    case 'has_card_id': return candidate.definitionId === c.cardId;
    case 'not_card_id': return candidate.definitionId !== c.cardId;
    case 'has_attribute': return getEffectiveCardAttributes(s, candidate.instanceId).includes(str(c.attribute));
    case 'not_source_card': return candidate.instanceId !== ctx.sourceCardId;
    case 'played_this_round': return runtime(s).cardState[candidate.instanceId]?.playedRound === s.round.roundNumber;
    case 'not_card_type': return !!d && d.cardType !== c.cardType;
    case 'is_attack': return isAttack(d) && (c.face !== 'face_down' || runtime(s).cardState[candidate.instanceId]?.faceDown === true);
    case 'or': return nodes(c.conditions).some(x => constraint(s, ctx, candidate, x));
    case 'and': return nodes(c.conditions).every(x => constraint(s, ctx, candidate, x));
    case 'not': return !constraint(s, ctx, candidate, node(c.condition));
    default: return reject('unsupported', `Unsupported target constraint: ${str(c.type)}`);
  }
}
function locationConstraint(location: { id: string; tags: string[] }, c: RuleNode): boolean {
  switch (c.type) {
    case 'any_enabled_location': return true;
    case 'not_location_kind': {
      const kind = str(c.locationKind);
      if (kind === 'workshop') return location.id !== 'magic_workshop';
      if (kind === 'battlefield') return !location.tags.includes('battlefield');
      return true;
    }
    default: return reject('unsupported', `Unsupported location constraint: ${str(c.type)}`);
  }
}

/** A bounded AST walker: no eval, Function, dynamic property traversal or expression strings. */
export function evaluateFormula(input: unknown, s: GameState, controllerId: string, sourceCardId: string,
  variables: Record<string, number> = {}): { value: number; lines: CalculationLine[] } {
  const lines: CalculationLine[] = []; let budget = 128;
  const ctx: EffectContext = { controllerId, sourceCardId, abilityId: '', variables, selections: {} };
  const visit = (value: unknown): number => {
    if (--budget < 0) reject('unsupported', 'Formula AST budget exceeded');
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) reject('invalid_formula', 'Formula value must be finite'); return value;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) reject('unsupported', 'Formula must be a controlled AST');
    const n = node(value);
    if (n.formula !== undefined) return visit(n.formula);
    if (n.formulaRef === 'cardFace.basePower') return visit(definition(s, sourceCardId)?.cardFace.basePower ?? 0);
    if (n.var !== undefined || n.op === 'var') {
      const name = str(n.var ?? n.name);
      // Check standard variables first
      if (name === 'controller.availableMana') return player(s, controllerId).mana;
      if (name === 'game.round_number') return s.round.roundNumber;
      if (name === 'consecutive_play_rounds') {
        const r = runtime(s);
        return r.consecutivePlayRounds[sourceCardId] ?? 1;
      }
      if (name === 'controller.movement_distance_this_round') return runtime(s).movementDistanceThisRound[controllerId] ?? 0;
      if (name === 'controller.battlefields_passed_or_stayed_this_round') return runtime(s).battlefieldsPassedOrStayedThisRound[controllerId] ?? 0;
      const result = Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : undefined;
      if (typeof result !== 'number' || !Number.isFinite(result)) reject('invalid_variable', `Missing or invalid variable: ${name}`);
      return result;
    }
    if (n.op === 'const') return visit(n.value);
    if (n.op === 'count_cards') {
      if (n.owner !== 'controller') reject('unsupported', 'Unsupported formula owner');
      const count = s.cards.filter(c => c.ownerPlayerId === controllerId && c.zone === n.zone && nodes(n.constraints).every(x => constraint(s, ctx, c, x))).length;
      lines.push({ label: n.zone === 'discard' ? '弃牌堆 Luck 数量' : `${str(n.zone)} 卡牌数量`, value: count }); return count;
    }
    const args = Array.isArray(n.args) ? n.args.map(visit) : n.left !== undefined ? [visit(n.left), visit(n.right)] : [];
    if (!args.length) reject('invalid_formula', 'Formula operands are required');
    let result: number;
    switch (n.op) {
      case 'add': result = args.reduce((a, b) => a + b, 0); break;
      case 'multiply': result = args.reduce((a, b) => a * b, 1); break;
      case 'min': result = Math.min(...args); break;
      case 'gt': if (args.length !== 2) reject('invalid_formula', 'Comparison requires two operands'); result = Number(args[0]! > args[1]!); break;
      case 'lte': if (args.length !== 2) reject('invalid_formula', 'Comparison requires two operands'); result = Number(args[0]! <= args[1]!); break;
      default: return reject('unsupported', `Unsupported formula operation: ${str(n.op)}`);
    }
    if (!Number.isFinite(result)) reject('invalid_formula', 'Nonfinite formula result');
    lines.push({ label: n.op === 'min' ? `至多 ${args[args.length - 1]}` : args.join(n.op === 'multiply' ? ' × ' : n.op === 'add' ? ' + ' : ` ${str(n.op)} `), value: result }); return result;
  };
  return { value: visit(input), lines };
}
function numeric(s: GameState, ctx: EffectContext, input: unknown): number {
  return evaluateFormula(input, s, ctx.controllerId, ctx.sourceCardId, ctx.variables).value;
}
function sourceBoundOngoingIsLive(s: GameState, ongoing: OngoingEffect): boolean {
  if (!ongoing.sourceValidityPolicyId) return ongoing.sourceMustRemainActive === false || active(s, ongoing.sourceCardId);
  if (!ongoing.sourceDefinitionIdAtInstall || !ongoing.policyKey || !Number.isInteger(ongoing.installedRevision)) {
    reject('resolution_failed', 'Corrupt source-bound lifecycle state');
  }
  const installTransition = lifecycleTransitions(s).find((entry) =>
    entry.lifecycleId === ongoing.id && entry.kind === 'install');
  if (!installTransition) reject('resolution_failed', 'Source-bound lifecycle install transition is missing');
  const validity = evaluateCardSourceValidity(s, {
    policyId: ongoing.sourceValidityPolicyId,
    sourceCardInstanceId: ongoing.sourceCardId,
    sourceAbilityId: ongoing.abilityId,
    controllerPlayerId: ongoing.controllerId,
    sourceDefinitionIdAtInstall: ongoing.sourceDefinitionIdAtInstall,
  });
  if (!validity.supported) reject('resolution_failed', 'Unknown lifecycle source-validity policy');
  return validity.valid;
}
function liveOngoing(s: GameState): OngoingEffect[] {
  return runtime(s).ongoingEffects.filter(o =>
    sourceBoundOngoingIsLive(s, o) &&
    (o.expiresAtRound === undefined || s.round.roundNumber < o.expiresAtRound));
}
function modifierControllerApplies(s: GameState, modifierControllerId: string, source: CardInstance, scope: RuleNode): boolean {
  const scoped = str(scope.controller);
  if (!scoped || scoped === 'self' || scoped === 'controller') return modifierControllerId === source.controllerPlayerId;
  if (['engaged_opponents_same_battlefield', 'opponents_at_same_battlefield'].includes(scoped)) {
    return modifierControllerId !== source.controllerPlayerId &&
      sameBattlefield(s, player(s, modifierControllerId).locationId, player(s, source.controllerPlayerId).locationId);
  }
  return false;
}
export function calculateCardPower(s: GameState, sourceId: string): { value: number; lines: CalculationLine[] } {
  if (runtime(s).cardState[sourceId]?.faceDown) return { value: 0, lines: [{ label: '暗置攻击无伤害结算', value: 0 }] };
  const source = card(s, sourceId); const d = definition(s, sourceId);
  const persistentLock = s.ruleOverrides?.masterSkillPowerLockIfSituationForbidsByPlayer?.[source.controllerPlayerId];
  if (d?.cardType === 'master_skill' && persistentLock && situationForbidsAttribute(s, persistentLock.attribute)) {
    return { value: persistentLock.value, lines: [{ label: 'persistent_situation_attribute_power_lock', value: persistentLock.value }] };
  }
  const result = evaluateFormula(d?.cardFace.basePower ?? 0, s, source.controllerPlayerId, sourceId);
  for (const modifier of ((source as unknown as { powerModifiers?: Array<Record<string, unknown>> }).powerModifiers ?? [])) {
    const value = Number(modifier.value ?? 0);
    if (!Number.isFinite(value)) reject('invalid_modifier', 'Card power modifier must be finite');
    if (modifier.kind === 'set') result.value = value;
    else if (modifier.kind === 'add') result.value += value;
    else if (modifier.kind === 'reverse_situation_event') continue;
    else reject('unsupported', `Unsupported card power modifier: ${str(modifier.kind)}`);
    result.lines.push({ label: str(modifier.sourceId) || str(modifier.id) || 'card_power_modifier', value: result.value });
  }
  const modifiers = liveOngoing(s).flatMap(o => o.ruleModifiers).sort((a, b) =>
    Number(node(a.definition.priority).tier === 'explicit_exception') - Number(node(b.definition.priority).tier === 'explicit_exception'));
  for (const modifier of modifiers) {
    const m = modifier.definition; const scope = node(m.scope); if (m.rule === 'effect_prevention' || m.rule === 'card_close') continue;
    if (!modifierControllerApplies(s, modifier.controllerId, source, scope)) continue;
    if (scope.object === 'source_card' && modifier.sourceCardId !== sourceId) continue;
    if (scope.object === 'attack_card' && !isAttack(d)) continue;
    const ctx = context(s, modifier.sourceCardId, '');
    if (!nodes(scope.constraints).every(c => constraint(s, ctx, source, c))) continue;
    const amount = numeric(s, ctx, m.value);
    if (m.operation === 'set') result.value = amount;
    else if (m.operation === 'add') result.value += amount;
    else reject('unsupported', 'Unsupported power operation');
    result.lines.push({ label: str(m.printedClause) || str(m.id), value: result.value });
  }
  return result;
}

function lockedBattlefieldIdsForMovement(s: GameState, playerId: string): Set<string> {
  const locked = new Set<string>();
  for (const ongoing of liveOngoing(s)) {
    for (const modifier of ongoing.ruleModifiers) {
      const definition = modifier.definition;
      if (definition.operation !== 'forbid' || definition.rule !== 'enter_or_leave_current_battlefield') continue;
      const controllerLocation = player(s, modifier.controllerId).locationId;
      const source = card(s, modifier.sourceCardId);
      if (!controllerLocation || !active(s, source.instanceId)) continue;
      const scope = node(definition.scope);
      const subject = scope.subject;
      const appliesToAll = subject === 'all_players';
      const appliesToDuelPair = Array.isArray(subject) && (subject.includes('controller') || subject.includes('single_opponent'));
      const sameBattlefield = player(s, playerId).locationId === controllerLocation;
      if (appliesToAll || (appliesToDuelPair && sameBattlefield)) locked.add(controllerLocation);
    }
  }
  return locked;
}
function abilityExplicitlyIgnoresCardMovementRestrictions(a: AuthoringAbility): boolean {
  return a.ruleModifiers.some((modifier) =>
    modifier.operation === 'ignore' && modifier.rule === 'enter_or_leave_current_battlefield');
}
function persistentMovementLockBlocksTarget(s: GameState, ctx: EffectContext, target: RuleNode): boolean {
  if (!movementLockedByPersistentRule(s, ctx.controllerId)) return false;
  const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  const isMovementTarget = a.effects.some((effect) => effect.type === 'move_player' && str(effect.to) === str(target.id));
  return isMovementTarget && !abilityExplicitlyIgnoresCardMovementRestrictions(a);
}
function candidates(s: GameState, ctx: EffectContext, target: RuleNode): string[] {
  if (nodes(target.conditions).some(c => !condition(s, ctx, c))) return [];
  if (target.type === 'choice') {
    // Return the option IDs as candidates
    const options = Array.isArray(target.options) ? target.options : [];
    return options.map((opt: any) => opt.id || '');
  }
  if (target.type === 'player') {
    return s.players.filter(candidate =>
      candidate.status === 'active' &&
      nodes(target.constraints).every(c => {
        if (c.type === 'not_controller') return candidate.id !== ctx.controllerId;
        if (c.type === 'at_battlefield') return isBattlefield(s, candidate.locationId);
        if (c.type === 'zouken_same_battlefield_opponent') {
          return candidate.id !== ctx.controllerId && sameBattlefield(s, player(s, ctx.controllerId).locationId, candidate.locationId);
        }
        if (c.type === 'zouken_command_seals_at_least') {
          return Number((candidate as unknown as { commandSpells?: number }).commandSpells ?? 3) >= Number(c.amount);
        }
        if (c.type === 'existing_attack_controlled_by_target') {
          return s.cards.some(card =>
            card.controllerPlayerId === candidate.id &&
            ['field', 'attack_area'].includes(card.zone) &&
            active(s, card.instanceId) &&
            isAttack(definition(s, card.instanceId)));
        }
        return condition(s, { ...ctx, controllerId: candidate.id }, c);
      }))
      .map(candidate => candidate.id);
  }
  if (target.type === 'location') {
    if (persistentMovementLockBlocksTarget(s, ctx, target)) return [];
    if (nodes(target.constraints).some(c => c.type === 'any_enabled_location')) {
      const from = player(s, ctx.controllerId).locationId;
      const enabled = getEnabledLocations(s.map, s.locationConfig);
      if (!from || !enabled.some(l => l.id === from)) return [];
      const locked = lockedBattlefieldIdsForMovement(s, ctx.controllerId);
      if (locked.has(from)) return [];
      const constraints = nodes(target.constraints);
      return enabled.filter(l => l.id !== from && !locked.has(l.id) && constraints.every(c => locationConstraint(l, c)) && canOccupyLocation({
        map: s.map, config: s.locationConfig, locationId: l.id, movingPlayerId: ctx.controllerId,
        occupyingPlayerIds: s.players.filter(p => p.status === 'active' && p.id !== ctx.controllerId && p.locationId === l.id).map(p => p.id),
        ...(s.ruleOverrides ? { ruleOverrides: s.ruleOverrides } : {}),
      })).map(l => l.id);
    }
    const path = nodes(target.constraints).find(c => c.type === 'reachable_along_arrows');
    if (!path) reject('unsupported', 'Location selection requires a path constraint');
    const locked = lockedBattlefieldIdsForMovement(s, ctx.controllerId);
    const from = player(s, ctx.controllerId).locationId ?? '';
    if (locked.has(from)) return [];
    return getReachableLocationsAlongArrows(s, player(s, ctx.controllerId).locationId ?? '', Number(path.maxSteps), ctx.controllerId)
      .filter(id => { const l = s.map.locations.find(l => l.id === id)!;
        if (locked.has(id)) return false;
        return !l.occupancyLimit || s.players.filter(p => p.status === 'active' && p.id !== ctx.controllerId && p.locationId === id).length < l.occupancyLimit;
      });
  }
  const scope = node(target.scope); const zone = scope.zone === 'battle_area' ? 'attack_area' : scope.zone;
  const alreadySelected = new Set(Object.values(ctx.selections).flat());
  return s.cards.filter(c =>
    !alreadySelected.has(c.instanceId) &&
    (scope.controller === 'any' || c.controllerPlayerId === ctx.controllerId) &&
    (scope.owner === 'any' || c.ownerPlayerId === ctx.controllerId || !scope.owner) &&
    c.zone === zone &&
    nodes(target.constraints).every(x => constraint(s, ctx, c, x))).map(c => c.instanceId);
}
function trustedBattlePowerSnapshot(event: AbilityEvent | undefined): { participantIds: string[]; powers: Record<string, number> } | undefined {
  const participantIds = event?.battleParticipantIds;
  const powers = event?.battleParticipantPowers;
  if (!Array.isArray(participantIds) || !powers || new Set(participantIds).size !== participantIds.length) return undefined;
  if (Object.keys(powers).length !== participantIds.length || participantIds.some((playerId) => !Number.isFinite(powers[playerId]))) return undefined;
  return { participantIds: [...participantIds], powers: { ...powers } };
}

function controllerIsStrictSecondBattlePower(event: AbilityEvent | undefined, controllerId: string): boolean {
  const snapshot = trustedBattlePowerSnapshot(event);
  if (!snapshot || snapshot.participantIds.length < 3 || !snapshot.participantIds.includes(controllerId)) return false;
  const opponents = snapshot.participantIds.filter((playerId) => playerId !== controllerId);
  const ownPower = snapshot.powers[controllerId]!;
  const highest = Math.max(...opponents.map((playerId) => snapshot.powers[playerId]!));
  if (!Number.isFinite(ownPower) || !Number.isFinite(highest) || ownPower >= highest) return false;
  return !opponents.some((playerId) => snapshot.powers[playerId] !== highest && snapshot.powers[playerId]! > ownPower);
}

function highestPowerOpponents(event: AbilityEvent, controllerId: string): string[] {
  const snapshot = trustedBattlePowerSnapshot(event);
  if (!snapshot || !controllerIsStrictSecondBattlePower(event, controllerId)) reject('invalid_event', 'Presence Concealment requires a trusted strict-second battle Power snapshot');
  const opponents = snapshot.participantIds.filter((playerId) => playerId !== controllerId);
  const highest = Math.max(...opponents.map((playerId) => snapshot.powers[playerId]!));
  return opponents.filter((playerId) => snapshot.powers[playerId] === highest);
}

function condition(s: GameState, ctx: EffectContext, c: RuleNode): boolean {
  if (!c || typeof c !== 'object') reject('unsupported', 'Unsupported condition');
  if (c.negated === true) return !condition(s, ctx, { ...c, negated: undefined });
  const p = player(s, ctx.controllerId);
  switch (c.type) {
    case 'skill_zone_mana_at_least': {
      const cardDef = definition(s, ctx.sourceCardId);
      if (cardDef && hasPlayRuleException(cardDef, 'skill_zone_mana_at_least')) return true;
      return card(s, ctx.sourceCardId).zone !== 'skill' || p.mana >= Number(c.value);
    }
    case 'controller_at_battlefield': return isBattlefield(s, p.locationId);
    case 'controller_at_battlefield_with_exactly_one_opponent': return isBattlefield(s, p.locationId) &&
      s.players.filter(other => other.id !== p.id && other.status === 'active' && sameBattlefield(s, p.locationId, other.locationId)).length === 1;
    case 'controller_alone_at_battlefield': return isBattlefield(s, p.locationId) &&
      !s.players.some(other => other.id !== p.id && other.status === 'active' && other.locationId === p.locationId) &&
      !s.ruleOverrides?.engagedPlayerIds?.includes(p.id);
    case 'played_with_basic_attack': return ctx.event?.playedCards?.some(c => c.instanceId !== ctx.sourceCardId &&
      c.controllerId === ctx.controllerId && c.cardType === 'basic_attack' && !c.faceDown) ?? false;
    case 'event_played_card_has_attribute': return ctx.event?.playedCards?.some((played) => {
      if (played.instanceId === ctx.sourceCardId || played.controllerId !== ctx.controllerId || played.faceDown) return false;
      return getEffectiveCardAttributes(s, played.instanceId).includes(str(c.attribute));
    }) ?? false;
    case 'controller_mana_at_least': case 'min_mana': return p.mana >= Number(c.value);
    case 'source_card_in_zone': return card(s, ctx.sourceCardId).zone === c.zone || (c.zone === 'field' && card(s, ctx.sourceCardId).zone === 'attack_area');
    case 'card_not_on_board': return !s.cards.some(candidate => candidate.definitionId === c.cardId && candidate.zone === 'field');
    case 'controller_at_location_kind': return c.locationKind === '侦察' || c.locationKind === '侦查' ? p.locationId === 'recon' : false;
    case 'controller_servant_revealed': return runtime(s).revealedServants.includes(ctx.controllerId);
    case 'source_reversed': return runtime(s).cardState[ctx.sourceCardId]?.reversed === true;
    case 'can_adjust_mana': return !runtime(s).manaGainBlocked.includes(p.id) && p.mana < (runtime(s).manaCaps[p.id] ?? 12);
    case 'controller_strict_second_battle_power': return controllerIsStrictSecondBattlePower(ctx.event, p.id);
    case 'controller_won_battle': return ctx.event?.battleResult?.winners.includes(p.id) ?? false;
    case 'controller_loses_battle': return !(ctx.event?.battleResult?.winners.includes(p.id) ?? true);
    case 'controller_sole_winner': return ctx.event?.battleResult?.winners.length === 1 && ctx.event.battleResult.winners[0] === p.id;
    case 'controller_seat_in_first_half': {
      const activePlayers = s.players.filter(candidate => candidate.status === 'active').sort((a, b) => a.seat - b.seat);
      const firstHalfCount = Math.floor(activePlayers.length / 2);
      const playerIndex = activePlayers.findIndex(candidate => candidate.id === ctx.controllerId);
      return playerIndex >= 0 && playerIndex < firstHalfCount;
    }
    case 'exists_target': {
      const t = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId).targets.find(t => t.id === c.targetRef);
      return !!t && candidates(s, ctx, t).length > 0;
    }
    case 'not': return !condition(s, ctx, node(c.condition));
    case 'or': return nodes(c.conditions).some(x => condition(s, ctx, x));
    case 'and': return nodes(c.conditions).every(x => condition(s, ctx, x));
    case 'not_controller': return true;
    case 'at_battlefield': return isBattlefield(s, p.locationId);
    case 'selected_count_at_least': return (ctx.selections[str(c.targetRef)] ?? []).length >= Number(c.value ?? 1);
    case 'choice_is': return (ctx.selections[str(c.choiceId)] ?? []).includes(str(c.value));
    case 'controller_played_highest_cost_noble_phantasm_in_battle_this_round': {
      const costs = runtime(s).noblePhantasmCostsThisRound[ctx.controllerId] ?? [];
      return costs.length > 0 && costs.some(entry => entry.cost === Math.max(...costs.map(entry => entry.cost)));
    }
    case 'highest_cost_noble_phantasm_cost_at_least': {
      const costs = runtime(s).noblePhantasmCostsThisRound[ctx.controllerId] ?? [];
      return costs.length > 0 && Math.max(...costs.map(entry => entry.cost)) >= Number(c.value ?? 0);
    }
    case 'gt': case 'lte': {
      const left = typeof c.left === 'string' ? { var: c.left } : c.left;
      const right = typeof c.right === 'string' ? { var: c.right } : c.right;
      return numeric(s, ctx, { op: c.type, args: [left, right] }) === 1;
    }
    default: {
      // Try extended conditions handler
      if (checkExtendedCondition(s, ctx.controllerId, c)) return true;
      return reject('unsupported', `Unsupported condition: ${str(c.type)}`);
    }
  }
}
function hasPlayRuleException(d: AuthoringCard, rule: string): boolean {
  const equivalent = rule === 'skill_zone_mana_at_least' ? ['skill_zone_mana_at_least', 'skill_zone_mana_requirement'] : [rule];
  return d.abilities.some(a => a.execution.mode === 'automatic' && a.ruleModifiers.some(m =>
    m.operation === 'ignore' && equivalent.includes(str(m.rule)) && ['this_card', 'source_card', ''].includes(str(node(m.scope).object))));
}
function perGamePlayLimit(d: AuthoringCard): { key: string; uses: number } | undefined {
  const limiter = d.abilities.find(a => a.execution.mode === 'automatic' && node(a.limit).type === 'per_game' && node(a.limit).scope === 'this_card');
  return limiter ? { key: limiter.id, uses: Number(node(limiter.limit).uses ?? 1) } : undefined;
}
function ongoingCardPlayForbidRules(s: GameState, playerId: string, sourceId: string): string[] {
  const d = definition(s, sourceId); if (!d) return ['missing_definition'];
  const targetPlayer = player(s, playerId);
  const ongoingRules = liveOngoing(s).flatMap(o => o.ruleModifiers).flatMap(({ controllerId, definition: m }) => {
    const controller = player(s, controllerId); const scope = node(m.scope);
    const appliesToSameBattlefieldOpponent = ['opponents_at_same_battlefield', 'engaged_opponents_same_battlefield'].includes(str(scope.subject)) ||
      ['opponents_at_same_battlefield', 'engaged_opponents_same_battlefield'].includes(str(scope.object));
    if (appliesToSameBattlefieldOpponent && (controllerId === playerId || !sameBattlefield(s, controller.locationId, targetPlayer.locationId))) return [];
    if (m.operation !== 'forbid') return [];
    if (m.rule === 'situation_restrictions' || m.rule === 'situation_play_forbid') return [str(m.rule)];
    if (m.rule === 'use_skill_card') return d.cardType === 'servant_skill' ? [str(m.rule)] : [];
    if (m.rule === 'play_card_attribute') {
      const attribute = str(m.attribute ?? scope.attribute);
      return Array.isArray(d.cardFace.attributes) && d.cardFace.attributes.includes(attribute) ? [str(m.rule)] : [];
    }
    return [];
  });
  const matchRules = Array.isArray((s as unknown as { modeState?: { cardPlayForbids?: unknown[] } }).modeState?.cardPlayForbids)
    ? (s as unknown as { modeState: { cardPlayForbids: Array<{ sourceId?: string; sourceType?: string; locationId?: string; attribute?: string; rule?: string }> } }).modeState.cardPlayForbids.flatMap((entry) => {
        if (entry.locationId && entry.locationId !== targetPlayer.locationId) return [];
        if (!entry.attribute || !Array.isArray(d.cardFace.attributes) || !d.cardFace.attributes.includes(entry.attribute)) return [];
        if (entry.sourceType === 'situation' && ignoresSituationPlayForbid(s, playerId, entry.attribute)) return [];
        return [entry.rule ?? (entry.sourceType === 'situation' ? 'situation_play_forbid' : 'play_card_attribute')];
      })
    : [];
  return ongoingRules.concat(matchRules);
}
function abilityLimitReached(s: GameState, sourceId: string, a: AuthoringAbility): boolean {
  const limitType = str(a.limit?.type);
  if (limitType !== 'per_game' && limitType !== 'per_round') return false;
  const usageKey = limitType === 'per_round' ? `${sourceId}:${a.id}:round:${s.round.roundNumber}` : `${sourceId}:${a.id}`;
  return (runtime(s).abilityUsage[usageKey] ?? 0) >= Number(a.limit?.uses ?? 1);
}
function effectiveActivationPhase(s: GameState, sourceId: string, a: AuthoringAbility): string {
  const basePhase = str(a.activation.phase);
  if (definition(s, sourceId)?.cardType !== 'command_spell' || basePhase !== 'action') return basePhase;
  const controllerId = card(s, sourceId).controllerPlayerId;
  const persistentPhase = commandSpellPhaseOverride(s, controllerId);
  if (persistentPhase) return persistentPhase;
  const usesAdvanceCommandSpells = s.cards.some((candidate) =>
    candidate.controllerPlayerId === controllerId &&
    ['skill', 'field', 'attack_area'].includes(candidate.zone) &&
    (runtime(s).pack.cards[candidate.definitionId]?.abilities ?? []).some((ability) =>
      ability.execution.mode === 'automatic' &&
      ability.effects.some((effect) =>
        effect.type === 'record_master_directive' &&
        effect.directive === 'command_spells_used_in_preparation_phase')));
  return usesAdvanceCommandSpells ? 'advance' : basePhase;
}
function canActivateAcceptedOpponentCloseToOne(s: GameState, sourceId: string, a: AuthoringAbility): boolean {
  if (!isAcceptedOpponentCloseToOneAbility(a, 'compiled')) return false;
  const source = s.cards.find((candidate) => candidate.instanceId === sourceId);
  if (!source) return false;
  const controller = s.players.find((candidate) => candidate.id === source.controllerPlayerId);
  const sourceState: unknown = runtime(s).cardState[sourceId];
  return !!controller && controller.status === 'active' && isBattlefield(s, controller.locationId) &&
    source.ownerPlayerId === controller.id && source.controllerPlayerId === controller.id &&
    isValidOpponentCloseToOneSourceCardState(sourceState) && sourceState.faceDown === false;
}
function canActivate(s: GameState, sourceId: string, a: AuthoringAbility, event?: AbilityEvent): boolean {
  if (a.execution.mode !== 'automatic') return false;
  if (isPlayActionStructuralCandidate(a) && !isPlayActionRouteCandidate(a)) return false;
  if (isPlaySourceCardWithCostResponseStructuralCandidate(a) && !isPlaySourceCardWithCostResponseRouteCandidate(a)) return false;
  if (isAddToAttackStructuralCandidate(a) && !isAddToAttackRouteCandidate(a)) return false;
  if (isFixedControllerAdvanceDrawActionCandidate(a) && !isFixedControllerAdvanceDrawActionSemantic(a)) return false;
  if (isAnyLocationExceptWorkshopMovementCandidate(a) && !isAnyLocationExceptWorkshopMovementSemantic(a) && !isZoukenS4MoveSemantic(a)) return false;
  if (isMagicResistancePowerModifierCandidate(a) && !isMagicResistancePowerModifierSemantic(a)) return false;
  if (isPresenceConcealmentAssassinationCandidate(a) && !isPresenceConcealmentAssassinationSemantic(a)) return false;
  if (isAlterEgoTransformCandidate(a) && !isAlterEgoTransformSemantic(a)) return false;
  if (isOpponentCloseToOneCandidate(a) && !isAcceptedOpponentCloseToOneAbility(a, 'compiled')) return false;
  if (isZoukenManaBootstrapCandidate(a) && !isZoukenManaBootstrapSemantic(a)) return false;
  if (isZoukenS2AbilityCandidate(a) && (!isZoukenS2Source(s, sourceId) || !isZoukenS2Semantic(a) || !gameStartSkillProvisioningPreflight(s, sourceId, a))) return false;
  if (isZoukenAscensionAbilityCandidate(a) && (!isZoukenAscensionSource(s, sourceId) || !isZoukenAscensionSemantic(a))) return false;
  if (isZoukenS3AbilityCandidate(a) && (!isZoukenS3Source(s, sourceId) || !isZoukenS3Semantic(a))) return false;
  if (isZoukenS4AbilityCandidate(a) && (!isZoukenS4Source(s, sourceId) || !isZoukenS4Semantic(a))) return false;
  if (isAbigailS3aCandidate(a) && (!isAbigailS3aSource(s, sourceId) || !isAbigailS3aSemantic(a))) return false;
  if (isAbigailS3bCandidate(a) && (!isAbigailS3aSource(s, sourceId) || !isAbigailS3bSemantic(a))) return false;
  if (isAbigailS1Candidate(a) && (!isAbigailS1Source(s, sourceId) || !isAbigailS1Semantic(a))) return false;
  if (isGameStartRuleOverrideCandidate(a) && !isGameStartRuleOverrideSemantic(a)) return false;
  if (isGameStartSkillProvisioningCandidate(a) &&
    (!isGameStartSkillProvisioningSemantic(a) || !gameStartSkillProvisioningPreflight(s, sourceId, a))) return false;
  if (a.activation.requiresSourceState === 'active' && !active(s, sourceId)) return false;
  if (runtime(s).cardState[sourceId]?.faceDown) return false;
  const activationPhase = effectiveActivationPhase(s, sourceId, a);
  if (activationPhase && activationPhase !== phase(s)) return false;
  if (definition(s, sourceId)?.cardType === 'command_spell' && effectiveCommandSpells(s, card(s, sourceId).controllerPlayerId) <= 0 &&
      !hasActiveZoukenFounder(s, card(s, sourceId).controllerPlayerId)) return false;
  if (isBattleLossResourceTriggerSemantic(a) && effectiveCommandSpells(s, card(s, sourceId).controllerPlayerId) <= 0 &&
      !hasActiveZoukenFounder(s, card(s, sourceId).controllerPlayerId)) return false;
  if (!isCommandSpellCard(s, sourceId) && a.kind === 'phase_action' && runtime(s).usedAbilities[`${sourceId}:${a.id}`] === s.round.roundNumber) return false;
  if (abilityLimitReached(s, sourceId, a)) return false;
  if ((isPlayActionRouteCandidate(a) || isAddToAttackRouteCandidate(a) || isAnyLocationExceptWorkshopMovementSemantic(a)) &&
    !hasMandatoryTargetAvailability(s, context(s, sourceId, a.id, event), a)) return false;
  if (isPlaySourceCardWithCostResponseRouteCandidate(a)) {
    const ctx = context(s, sourceId, a.id, event);
    if (!hasPlayableSourceCardInHand(s, ctx)) return false;
    if (playFailure(s, ctx.controllerId, sourceId, false, true, true, true)) return false;
    if (!hasAvailableManaForFixedCosts(s, ctx, a)) return false;
  }
  if (isFixedControllerAdvanceDrawActionSemantic(a) &&
    !hasAvailableManaForFixedCosts(s, context(s, sourceId, a.id, event), a)) return false;
  if (isZoukenS4MoveSemantic(a) && !hasAvailableManaForFixedCosts(s, context(s, sourceId, a.id, event), a)) return false;
  if (isZoukenAscensionActionSemantic(a)) {
    const ctx = context(s, sourceId, a.id, event);
    if (!hasAvailableManaForFixedCosts(s, ctx, a) || !hasMandatoryTargetAvailability(s, ctx, a)) return false;
  }
  if (isAbigailS3aSemantic(a)) {
    const ctx = context(s, sourceId, a.id, event);
    if (!isAbigailS3aSource(s, sourceId) || !active(s, sourceId) || phase(s) !== 'action' || abigailS3aTargetCandidates(s, ctx, a).length < 1) return false;
  }
  if (isAbigailS3bActionSemantic(a)) {
    const ctx = context(s, sourceId, a.id, event);
    if (!isAbigailS3aSource(s, sourceId) || !active(s, sourceId) || phase(s) !== 'action') return false;
  }
  if (isAbigailS1DistributeSemantic(a) &&
      (!isAbigailS1Source(s, sourceId) || !active(s, sourceId) || phase(s) !== 'action' ||
       s.round.prioritySeat !== player(s, card(s, sourceId).controllerPlayerId).seat ||
       player(s, card(s, sourceId).controllerPlayerId).locationId === undefined)) return false;
  if (isAbigailS1WinSemantic(a) && !isAbigailS1Source(s, sourceId)) return false;
  if (isZoukenS3ActionSemantic(a)) {
    const controller = player(s, card(s, sourceId).controllerPlayerId);
    if (controller.mana < 2) return false;
  }
  if (isCloseSourceCardOnPlayedTrigger(a) && closeSourceStateError(s, sourceId, card(s, sourceId).controllerPlayerId)) return false;
  if (isAlterEgoTransformSemantic(a)) {
    const ctx = context(s, sourceId, a.id, event);
    if (!alterEgoTriggerTarget(s, sourceId, event)) return false;
    if (classifyAlterEgoTransformVariant(a) === 'ex' && !hasAvailableManaForFixedCosts(s, ctx, a)) return false;
  }
  if (isAcceptedOpponentCloseToOneAbility(a, 'compiled')) return canActivateAcceptedOpponentCloseToOne(s, sourceId, a);
  return a.conditions.every(c => condition(s, context(s, sourceId, a.id, event), c));
}
function isGameStartRuleOverrideCandidate(a: AuthoringAbility): boolean {
  return a.effects.some((effect) => effect.type === 'install_rule_override');
}

function exactNodeKeys(nodeValue: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(nodeValue).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isExactZoukenManaSetEffect(effect: RuleNode | undefined): boolean {
  return !!effect && effect.type === 'set_mana' && effect.id === 'set-controller-mana' &&
    effect.player === 'controller' && effect.amount === 10 &&
    exactNodeKeys(effect, ['id', 'type', 'player', 'amount']);
}

function isExactZoukenManaCapEffect(effect: RuleNode | undefined): boolean {
  return !!effect && effect.type === 'set_mana_cap' && effect.id === 'set-controller-mana-cap' &&
    effect.player === 'controller' && effect.amount === 16 &&
    exactNodeKeys(effect, ['id', 'type', 'player', 'amount']);
}

export function isZoukenManaBootstrapCandidate(a: AuthoringAbility): boolean {
  return str(a.activation.trigger) === 'game_start' &&
    a.effects.some((effect) => effect.type === 'set_mana' || effect.type === 'set_mana_cap');
}

export function isZoukenManaBootstrapSemantic(a: AuthoringAbility): boolean {
  if (!isZoukenManaBootstrapCandidate(a) || a.kind !== 'forced_trigger' || a.execution.mode !== 'automatic' ||
    !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length) return false;
  if (str(a.activation.trigger) !== 'game_start' || Object.keys(a.activation).some((key) => key !== 'trigger')) return false;
  if (a.conditions.length || a.targets.length || a.cost.length || a.creates.length || a.ruleModifiers.length) return false;
  const responseKeys = Object.keys(a.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') ||
    (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window') ||
    Object.keys(a.limit).length || Object.keys(a.visibility).length || Object.keys(a.lifecycle).length) return false;
  return a.effects.length === 2 && isExactZoukenManaSetEffect(a.effects[0]) && isExactZoukenManaCapEffect(a.effects[1]);
}

function executeZoukenManaBootstrap(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isZoukenManaBootstrapSemantic(a)) reject('resolution_failed', 'Unsupported Zouken game-start mana bootstrap semantic shape');
  // The typed set_mana primitive supplies cap validation, events, and transaction rollback.
  executeResolutionEffects(s, ctx, [a.effects[0]!]);
  const r = runtime(s);
  const previousCap = r.manaCaps[ctx.controllerId] ?? 12;
  r.manaCaps[ctx.controllerId] = 16;
  if (previousCap !== 16) {
    r.events.push({
      type: 'mana_cap_set', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId, resource: 'mana', before: previousCap, after: 16,
    });
  }
}

const ZOUKEN_S4_SOURCE_ID = 'master.zouken.skill.s4';
const ZOUKEN_S4_ROUND_ABILITY_ID = 'zouken.pseudo-vampire.round-end';
const ZOUKEN_S4_BATTLE_ABILITY_ID = 'zouken.pseudo-vampire.battle-end';
const ZOUKEN_S4_MOVE_ABILITY_ID = 'zouken.pseudo-vampire.bug-body';
const ZOUKEN_S4_ROUND_CLAUSE = '回合结束时，若你本回合获得的魔力少于3点，失去2点战果。';
const ZOUKEN_S4_BATTLE_CLAUSE = '刻印虫-战斗阶段：战斗阶段结束后，如果你赢得一场战斗，从该战斗的一名败者处吸取至多3点魔力；若该战斗没有其他玩家或你位于侦查，你获得3点魔力。';
const ZOUKEN_S4_MOVE_CLAUSE = '虫之身-战斗阶段：花费7点魔力，移动至一处地点。';
const ZOUKEN_ASCENSION_SOURCE_ID = 'master.zouken.skill.ascension';
const ZOUKEN_ASCENSION_PASSIVE_ID = 'zouken.illusive-mastermind';
const ZOUKEN_ASCENSION_ACTION_ID = 'zouken.illusive-mastermind.seal-loss';
const ZOUKEN_ASCENSION_PASSIVE_CLAUSE = '当你移动时，可以无视交战状态。移除【刻印虫】"如果你赢得一场战斗"的触发条件。';
const ZOUKEN_ASCENSION_ACTION_CLAUSE = '行动阶段：花费6点魔力，使与你处于同一战场的对手失去一枚令咒。';
const ZOUKEN_S3_SOURCE_ID = 'master.zouken.skill.s3';
const ZOUKEN_S3_PASSIVE_ID = 'zouken.founder';
const ZOUKEN_S3_ACTION_ID = 'zouken.founder.power-conversion';
const ZOUKEN_S3_WIN_ID = 'zouken.founder.after-win';
const ZOUKEN_S3_PASSIVE_CLAUSE = '你没有令咒。每当你获得令咒时，改为获得4点魔力；当你因其他能力需要花费令咒时，改为花费4点魔力。';
const ZOUKEN_S3_ACTION_CLAUSE = '行动阶段：花费2X魔力，获得X点合计威力，若你于本回合赢得战斗，获得X点战果。';
const ZOUKEN_S2_SOURCE_ID = 'master.zouken.skill.s2';
const ZOUKEN_S2_ABILITY_ID = 'zouken.five-hundred-year-undead';
const ZOUKEN_S2_CLAUSE = '你是大圣杯的【创造者】并怀揣【五百年的执念】。';
const ZOUKEN_S2_TARGET_IDS = ['master.zouken.skill.s3', 'master.zouken.skill.s4'] as const;

const ABIGAIL_S3A_SOURCE_ID = 'servant.abigail.skill.sc-abigail-3';
const ABIGAIL_S3A_ABILITY_ID = 'servant.abigail.skill.sc-abigail-3.banish-outside-life';
const ABIGAIL_S3A_CLAUSE = '被动/行动阶段：移除手牌的一张【领域外生命】。若如此，获得2点魔力。';
const ABIGAIL_OUTSIDE_LIFE_ID = 'servant.abigail.skill.sc-abigail-4';
const ABIGAIL_OUTSIDE_LIFE_GENERATED_BY = 'servant.abigail.skill.sc-abigail-1';
const ABIGAIL_S3B_ACTION_ID = 'servant.abigail.skill.sc-abigail-3.play-outside-life';
const ABIGAIL_S3B_CLEANUP_ID = 'servant.abigail.skill.sc-abigail-3.recycle-active-outside-life';
const ABIGAIL_S3B_ACTION_CLAUSE = '行动阶段：将你的弃牌堆中任意数量的【领域外生命】打出，战斗阶段结束后将你所有激活的【领域外生命】洗入牌库。';
const ABIGAIL_S3B_CLEANUP_CLAUSE = '战斗阶段结束后将你所有激活的【领域外生命】洗入牌库。';
const ABIGAIL_S3B_MAX_PLAY_COUNT = 12;
const ABIGAIL_S4_RELEASE_ID = 'servant.abigail.skill.sc-abigail-4.true-name-release';
const ABIGAIL_S4_CLEANUP_ID = 'servant.abigail.skill.sc-abigail-4.recycle-to-abigail-discard';
const ABIGAIL_S4_RELEASE_CLAUSE = '【真名解放】';
const ABIGAIL_S4_CLEANUP_CLAUSE = '战斗阶段结束后，将此牌加入阿比盖尔的弃牌堆。';
const ABIGAIL_S4_RELEASE_EFFECT_ID = 'abigail-s4-true-name-release';
const ABIGAIL_S4_CLEANUP_EFFECT_ID = 'abigail-s4-recycle-to-abigail-discard';
const ABIGAIL_S4_POWER_AMOUNT = 6;
const ABIGAIL_S1_SOURCE_ID = 'servant.abigail.skill.sc-abigail-1';
const ABIGAIL_S1_DISTRIBUTE_ID = 'servant.abigail.skill.sc-abigail-1.distribute-outside-life';
const ABIGAIL_S1_WIN_ID = 'servant.abigail.skill.sc-abigail-1.win-at-x12';
const ABIGAIL_S1_DISTRIBUTE_CLAUSE = '理智丧失-行动阶段：令所有与你位于同一地点的对手将游戏外的一张【领域外生命】加入手牌。';
const ABIGAIL_S1_WIN_CLAUSE = '打出时：若X为12，你获得游戏胜利。';
const ABIGAIL_S1_EFFECT_ID = 'abigail-s1-distribute-outside-life';
const ABIGAIL_S1_WIN_EFFECT_ID = 'abigail-s1-win-at-x12';
const ABIGAIL_S1_THRESHOLD = 12;

function isAbigailS3aSource(s: GameState, sourceCardId: string): boolean {
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  return definition(s, sourceCardId)?.id === ABIGAIL_S3A_SOURCE_ID &&
    definition(s, sourceCardId)?.cardType === 'servant_skill' && !!source &&
    source.ownerPlayerId === source.controllerPlayerId;
}

function isAbigailS1Source(s: GameState, sourceCardId: string): boolean {
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  const sourceDefinition = source && runtime(s).pack.cards[source.definitionId];
  const owner = source && s.players.find((candidate) => candidate.id === source.controllerPlayerId);
  return !!source && !!sourceDefinition && sourceDefinition.id === ABIGAIL_S1_SOURCE_ID &&
    sourceDefinition.cardType === 'servant_skill' && source.ownerPlayerId === source.controllerPlayerId &&
    owner?.servantCardId === 'servant.abigail' && owner.status === 'active' &&
    ['field', 'attack_area'].includes(source.zone);
}

function isExactAbigailS1Shell(a: AuthoringAbility, kind: string, activationKeys: string[]): boolean {
  return a.kind === kind && a.execution.mode === 'automatic' && Array.isArray(a.execution.allowedOperations) &&
    a.execution.allowedOperations.length === 0 && Object.keys(a.activation).every((key) => activationKeys.includes(key)) &&
    a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 &&
    a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 && Object.keys(a.limit).length === 0 &&
    Object.keys(a.visibility).length === 0 && (Object.keys(a.responseWindow).length === 0 ||
      (exactNodeKeys(a.responseWindow, ['order', 'passBehavior']) && a.responseWindow.order === 'turn_order' &&
       a.responseWindow.passBehavior === 'decline_this_window'));
}

export function isAbigailS1DistributeCandidate(a: AuthoringAbility): boolean { return a.id === ABIGAIL_S1_DISTRIBUTE_ID; }
export function isAbigailS1WinCandidate(a: AuthoringAbility): boolean { return a.id === ABIGAIL_S1_WIN_ID; }
export function isAbigailS1Candidate(a: AuthoringAbility): boolean {
  return isAbigailS1DistributeCandidate(a) || isAbigailS1WinCandidate(a);
}

export function isAbigailS1DistributeSemantic(a: AuthoringAbility): boolean {
  if (!isExactAbigailS1Shell(a, 'phase_action', ['phase', 'opens', 'requiresSourceState']) ||
      a.id !== ABIGAIL_S1_DISTRIBUTE_ID || a.printedClause !== ABIGAIL_S1_DISTRIBUTE_CLAUSE ||
      !exactNodeKeys(a.activation, ['phase', 'opens', 'requiresSourceState']) ||
      a.activation.phase !== 'action' || a.activation.opens !== 'controller_action_window' ||
      a.activation.requiresSourceState !== 'active' || a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return effect.type === 'abigail_s1_distribute_outside_life' && effect.id === ABIGAIL_S1_EFFECT_ID &&
    exactNodeKeys(effect, ['id', 'type']);
}

export function isAbigailS1WinSemantic(a: AuthoringAbility): boolean {
  if (!isExactAbigailS1Shell(a, 'forced_trigger', ['phase', 'trigger', 'requiresSourceState']) ||
      a.id !== ABIGAIL_S1_WIN_ID || a.printedClause !== ABIGAIL_S1_WIN_CLAUSE ||
      !exactNodeKeys(a.activation, ['phase', 'trigger', 'requiresSourceState']) ||
      a.activation.phase !== 'action' || a.activation.trigger !== 'on_card_played' ||
      a.activation.requiresSourceState !== 'active' || a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return effect.type === 'abigail_s1_win_if_x12' && effect.id === ABIGAIL_S1_WIN_EFFECT_ID &&
    exactNodeKeys(effect, ['id', 'type']);
}

export function isAbigailS1Semantic(a: AuthoringAbility): boolean {
  return isAbigailS1DistributeSemantic(a) || isAbigailS1WinSemantic(a);
}

export function isAbigailS3aCandidate(a: AuthoringAbility): boolean {
  return a.id === ABIGAIL_S3A_ABILITY_ID;
}

export function isAbigailS3bCandidate(a: AuthoringAbility): boolean {
  return [ABIGAIL_S3B_ACTION_ID, ABIGAIL_S3B_CLEANUP_ID].includes(a.id);
}

export function isAbigailS3aSemantic(a: AuthoringAbility): boolean {
  if (!isAbigailS3aCandidate(a) || a.kind !== 'phase_action' || a.execution.mode !== 'automatic' ||
      !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length ||
      a.printedClause !== ABIGAIL_S3A_CLAUSE || a.conditions.length || a.cost.length || a.creates.length ||
      a.ruleModifiers.length || a.effects.length !== 2 || Object.keys(a.lifecycle).length ||
      Object.keys(a.responseWindow).some((key) => !['order', 'passBehavior'].includes(key)) ||
      a.responseWindow.order !== 'turn_order' || a.responseWindow.passBehavior !== 'decline_this_window' ||
      Object.keys(a.limit).length || Object.keys(a.visibility).length ||
      !exactNodeKeys(a.activation, ['phase', 'opens', 'requiresSourceState']) ||
      a.activation.phase !== 'action' || a.activation.opens !== 'controller_action_window' ||
      a.activation.requiresSourceState !== 'active' || a.targets.length !== 1) return false;
  const target = a.targets[0]!; const count = node(target.count); const scope = node(target.scope);
  const move = a.effects[0]!; const mana = a.effects[1]!;
  return target.id === 'outside_life' && target.type === 'card_instance' &&
    exactNodeKeys(target, ['id', 'type', 'scope', 'count', 'visibility', 'constraints']) &&
    exactNodeKeys(scope, ['zone', 'controller', 'owner']) && scope.zone === 'hand' &&
    scope.controller === 'self' && scope.owner === 'controller' &&
    exactNodeKeys(count, ['min', 'max']) && Number(count.min) === 1 && Number(count.max) === 1 &&
    target.visibility === 'private_to_controller' && nodes(target.constraints).length === 1 &&
    exactNodeKeys(nodes(target.constraints)[0]!, ['type', 'cardId']) &&
    nodes(target.constraints)[0]!.type === 'has_card_id' && nodes(target.constraints)[0]!.cardId === ABIGAIL_OUTSIDE_LIFE_ID &&
    move.type === 'move_card' && move.id === 'banish-outside-life' && move.target === 'outside_life' &&
    exactNodeKeys(move, ['id', 'type', 'target', 'to']) && exactNodeKeys(node(move.to), ['zone']) && node(move.to).zone === 'removed_from_game' &&
    mana.type === 'adjust_mana' && mana.id === 'gain-two-mana' && mana.player === 'controller' && mana.amount === 2 &&
    exactNodeKeys(mana, ['id', 'type', 'player', 'amount']);
}

function isCanonicalAbigailOutsideLifeCard(s: GameState, controllerId: string, instanceId: string, zones: readonly string[]): boolean {
  const candidate = s.cards.find((entry) => entry.instanceId === instanceId);
  const targetDefinition = candidate && runtime(s).pack.cards[candidate.definitionId];
  return !!candidate && !!targetDefinition && targetDefinition.id === ABIGAIL_OUTSIDE_LIFE_ID &&
    targetDefinition.cardType === 'servant_deck_card' && candidate.ownerPlayerId === controllerId &&
    candidate.controllerPlayerId === controllerId && zones.includes(candidate.zone) &&
    candidate.generatedBy === ABIGAIL_OUTSIDE_LIFE_GENERATED_BY &&
    ((candidate.zone === 'field' || candidate.zone === 'attack_area')
      ? candidate.visibility.scope === 'public'
      : candidate.visibility.scope === 'owner_only' && candidate.visibility.ownerPlayerId === controllerId);
}

function isCanonicalAbigailOutsideLife(s: GameState, controllerId: string, instanceId: string): boolean {
  return isCanonicalAbigailOutsideLifeCard(s, controllerId, instanceId, ['hand']);
}

function abigailS3aTargetCandidates(s: GameState, ctx: EffectContext, a: AuthoringAbility): string[] {
  const target = a.targets[0];
  if (!target || !isAbigailS3aSemantic(a)) return [];
  return candidates(s, ctx, target).filter((instanceId) => isCanonicalAbigailOutsideLife(s, ctx.controllerId, instanceId));
}

function findAbigailS3aPendingTarget(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): PendingDecision | undefined {
  if (!isAbigailS3aSemantic(a) || Object.prototype.hasOwnProperty.call(ctx.selections, 'outside_life')) return undefined;
  const qualifying = abigailS3aTargetCandidates(s, ctx, a);
  if (qualifying.length < 1) reject('no_legal_target', 'No canonical Outside-Life card remains in hand');
  return { id: nextId(s, 'decision'), controllerId: ctx.controllerId, target: a.targets[0]!, candidates: qualifying,
    min: 1, max: 1, context: structuredClone(ctx), remainingEffects: effects };
}

function validateAbigailS3aContinuation(s: GameState, ctx: EffectContext, a: AuthoringAbility, selected: string[]): void {
  if (!isAbigailS3aSemantic(a)) reject('resolution_failed', 'Abigail S3a semantic changed');
  if (!isAbigailS3aSource(s, ctx.sourceCardId)) reject('resolution_failed', 'Abigail S3a source identity changed');
  if (!active(s, ctx.sourceCardId)) reject('resolution_failed', 'Abigail S3a source is no longer active');
  if (phase(s) !== 'action') reject('resolution_failed', 'Abigail S3a action phase ended');
  if (selected.length !== 1 || !isCanonicalAbigailOutsideLife(s, ctx.controllerId, selected[0]!)) {
    reject('resolution_failed', 'Abigail S3a target provenance changed');
  }
}

function executeAbigailS3a(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const selected = ctx.selections.outside_life ?? [];
  validateAbigailS3aContinuation(s, ctx, a, selected);
  const work = structuredClone(s);
  resolveEffect(work, ctx, a.effects[0]!);
  resolveEffect(work, ctx, a.effects[1]!);
  Object.assign(s, work);
}

function isExactAbigailS3bShell(a: AuthoringAbility, kind: string, activationKeys: string[]): boolean {
  if (a.kind !== kind || a.execution.mode !== 'automatic' || !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length) return false;
  if (!Object.keys(a.activation).every((key) => activationKeys.includes(key))) return false;
  if (a.conditions.length || a.cost.length || a.creates.length || a.ruleModifiers.length || Object.keys(a.lifecycle).length ||
      Object.keys(a.limit).length || Object.keys(a.visibility).length) return false;
  const responseKeys = Object.keys(a.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
      (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') ||
      (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window')) return false;
  return true;
}

export function isAbigailS3bActionSemantic(a: AuthoringAbility): boolean {
  if (!isExactAbigailS3bShell(a, 'phase_action', ['phase', 'opens', 'requiresSourceState']) ||
      a.id !== ABIGAIL_S3B_ACTION_ID || a.printedClause !== ABIGAIL_S3B_ACTION_CLAUSE ||
      a.activation.phase !== 'action' || a.activation.opens !== 'controller_action_window' || a.activation.requiresSourceState !== 'active' ||
      a.targets.length !== 1 || a.effects.length !== 1) return false;
  const target = a.targets[0]!; const scope = node(target.scope); const count = node(target.count); const constraints = nodes(target.constraints);
  const effect = a.effects[0]!;
  return target.id === 'outside_life_discard' && target.type === 'card_instance' &&
    exactNodeKeys(target, ['id', 'type', 'scope', 'count', 'visibility', 'constraints']) &&
    exactNodeKeys(scope, ['zone', 'controller', 'owner']) && scope.zone === 'discard' && scope.controller === 'self' && scope.owner === 'controller' &&
    exactNodeKeys(count, ['min', 'max']) && Number(count.min) === 0 && Number(count.max) === ABIGAIL_S3B_MAX_PLAY_COUNT &&
    target.visibility === 'private_to_controller' && constraints.length === 1 &&
    exactNodeKeys(constraints[0]!, ['type', 'cardId']) && constraints[0]!.type === 'has_card_id' && constraints[0]!.cardId === ABIGAIL_OUTSIDE_LIFE_ID &&
    effect.type === 'play_selected_cards' && effect.id === 'play-outside-life-from-discard' && effect.target === 'outside_life_discard' && effect.face === 'face_up' &&
    exactNodeKeys(effect, ['id', 'type', 'target', 'face']);
}

export function isAbigailS3bCleanupSemantic(a: AuthoringAbility): boolean {
  if (!isExactAbigailS3bShell(a, 'forced_trigger', ['trigger', 'requiresSourceState']) ||
      a.id !== ABIGAIL_S3B_CLEANUP_ID || a.printedClause !== ABIGAIL_S3B_CLEANUP_CLAUSE ||
      a.activation.trigger !== 'after_battle_ended' || a.activation.requiresSourceState !== 'active' || a.targets.length || a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return effect.type === 'shuffle_abigail_active_outside_life_into_deck' && effect.id === 'recycle-active-outside-life' &&
    exactNodeKeys(effect, ['id', 'type']);
}

export function isAbigailS3bSemantic(a: AuthoringAbility): boolean {
  return isAbigailS3bActionSemantic(a) || isAbigailS3bCleanupSemantic(a);
}

function abigailS4PlayerId(s: GameState): string | undefined {
  const matches = s.players.filter((candidate) => candidate.status === 'active' && candidate.servantCardId === 'servant.abigail');
  return matches.length === 1 ? matches[0]!.id : undefined;
}

function isAbigailS4Source(s: GameState, sourceCardId: string): boolean {
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  const sourceDefinition = source && runtime(s).pack.cards[source.definitionId];
  const abigailId = abigailS4PlayerId(s);
  const sourceState = runtime(s).cardState[sourceCardId];
  return !!source && !!sourceDefinition && sourceDefinition.id === ABIGAIL_OUTSIDE_LIFE_ID &&
    sourceDefinition.cardType === 'servant_deck_card' && source.generatedBy === ABIGAIL_OUTSIDE_LIFE_GENERATED_BY &&
    source.zone === 'attack_area' && source.visibility.scope === 'public' && sourceState?.active === true &&
    sourceState.faceDown !== true && !!abigailId && (source.ownerPlayerId === source.controllerPlayerId || source.ownerPlayerId === abigailId) &&
    s.players.some((candidate) => candidate.id === source.controllerPlayerId && candidate.status === 'active');
}

function isExactAbigailS4RevealVisibility(a: AuthoringAbility): boolean {
  return exactNodeKeys(a.visibility, ['revealsTrueName', 'revealScope', 'revealTiming']) &&
    a.visibility.revealsTrueName === true && a.visibility.revealScope === 'servant_package' &&
    a.visibility.revealTiming === 'on_use_declared';
}

function isExactAbigailS4ResponseWindow(a: AuthoringAbility): boolean {
  return exactNodeKeys(a.responseWindow, ['order', 'passBehavior']) &&
    a.responseWindow.order === 'turn_order' && a.responseWindow.passBehavior === 'decline_this_window';
}

export function isAbigailS4Candidate(a: AuthoringAbility): boolean {
  return [ABIGAIL_S4_RELEASE_ID, ABIGAIL_S4_CLEANUP_ID].includes(a.id);
}

export function isAbigailS4ReleaseSemantic(a: AuthoringAbility): boolean {
  if (!isAbigailS4Candidate(a) || a.id !== ABIGAIL_S4_RELEASE_ID || a.kind !== 'declaration_reveal' ||
      a.execution.mode !== 'automatic' || !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length ||
      a.printedClause !== ABIGAIL_S4_RELEASE_CLAUSE || !isExactAbigailS4RevealVisibility(a) ||
      !exactNodeKeys(a.activation, ['phase', 'trigger', 'requiresSourceState']) || a.activation.phase !== 'action' ||
      a.activation.trigger !== 'on_use_declared' ||
      a.activation.requiresSourceState !== 'active' || a.conditions.length || a.targets.length || a.cost.length ||
      a.creates.length || a.ruleModifiers.length || Object.keys(a.lifecycle).length || Object.keys(a.limit).length ||
      !isExactAbigailS4ResponseWindow(a) || a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return effect.type === 'abigail_true_name_release' && effect.id === ABIGAIL_S4_RELEASE_EFFECT_ID && exactNodeKeys(effect, ['id', 'type']);
}

export function isAbigailS4CleanupSemantic(a: AuthoringAbility): boolean {
  if (!isAbigailS4Candidate(a) || a.id !== ABIGAIL_S4_CLEANUP_ID || a.kind !== 'forced_trigger' ||
      a.execution.mode !== 'automatic' || !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length ||
      a.printedClause !== ABIGAIL_S4_CLEANUP_CLAUSE || !exactNodeKeys(a.activation, ['trigger', 'requiresSourceState']) ||
      a.activation.trigger !== 'after_battle_ended' || a.activation.requiresSourceState !== 'active' || a.conditions.length ||
      a.targets.length || a.cost.length || a.creates.length || a.ruleModifiers.length || Object.keys(a.lifecycle).length ||
      Object.keys(a.limit).length || Object.keys(a.visibility).length || !isExactAbigailS4ResponseWindow(a) || a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return effect.type === 'abigail_true_name_recycle_to_discard' && effect.id === ABIGAIL_S4_CLEANUP_EFFECT_ID && exactNodeKeys(effect, ['id', 'type']);
}

export function isAbigailS4Semantic(a: AuthoringAbility): boolean {
  return isAbigailS4ReleaseSemantic(a) || isAbigailS4CleanupSemantic(a);
}

function abigailS3bTargetCandidates(s: GameState, ctx: EffectContext, a: AuthoringAbility): string[] {
  const target = a.targets[0];
  if (!target || !isAbigailS3bActionSemantic(a)) return [];
  return candidates(s, ctx, target).filter((instanceId) => isCanonicalAbigailOutsideLifeCard(s, ctx.controllerId, instanceId, ['discard']));
}

function findAbigailS3bPendingTarget(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): PendingDecision | undefined {
  if (!isAbigailS3bActionSemantic(a) || Object.prototype.hasOwnProperty.call(ctx.selections, 'outside_life_discard')) return undefined;
  const qualifying = abigailS3bTargetCandidates(s, ctx, a);
  return { id: nextId(s, 'decision'), controllerId: ctx.controllerId, target: a.targets[0]!, candidates: qualifying,
    min: 0, max: Math.min(ABIGAIL_S3B_MAX_PLAY_COUNT, qualifying.length), context: structuredClone(ctx), remainingEffects: effects };
}

function validateAbigailS3bActionContinuation(s: GameState, ctx: EffectContext, a: AuthoringAbility, selected: string[]): void {
  if (!isAbigailS3bActionSemantic(a) || !isAbigailS3aSource(s, ctx.sourceCardId) || !active(s, ctx.sourceCardId) || phase(s) !== 'action' ||
      s.round.prioritySeat !== player(s, ctx.controllerId).seat || selected.length > ABIGAIL_S3B_MAX_PLAY_COUNT || new Set(selected).size !== selected.length ||
      selected.some((instanceId) => !isCanonicalAbigailOutsideLifeCard(s, ctx.controllerId, instanceId, ['discard']))) {
    reject('resolution_failed', 'Abigail S3b action continuation is stale or forged');
  }
}

function executeAbigailS3bAction(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const selected = ctx.selections.outside_life_discard ?? [];
  validateAbigailS3bActionContinuation(s, ctx, a, selected);
  const work = structuredClone(s);
  playBatch(work, ctx.controllerId, selected.map((instanceId) => ({ type: 'play_card' as const, cardInstanceId: instanceId })), 'effect', true);
  Object.assign(s, work);
}

function executeAbigailS3bCleanup(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAbigailS3bCleanupSemantic(a) || !isAbigailS3aSource(s, ctx.sourceCardId) || !active(s, ctx.sourceCardId) ||
      !ctx.event || ctx.event.type !== 'after_battle_ended' || !ctx.event.battlePhaseResolutionId) {
    reject('invalid_event', 'Abigail S3b cleanup requires its canonical active source and battle-terminal event');
  }
  const work = structuredClone(s);
  const movedCardIds = work.cards.filter((candidate) =>
    isCanonicalAbigailOutsideLifeCard(work, ctx.controllerId, candidate.instanceId, ['field', 'attack_area']) && active(work, candidate.instanceId) &&
    !work.ruleOverrides?.abigailTrueNamePowerBySource?.[candidate.instanceId])
    .map((candidate) => candidate.instanceId);
  for (const instanceId of movedCardIds) moveCard(work, instanceId, 'deck');
  if (movedCardIds.length) shuffle(work, ctx.controllerId);
  runtime(work).events.push({ type: 'abigail_s3b_active_outside_life_recycled', playerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, cardInstanceIds: movedCardIds, movedCount: movedCardIds.length,
    battlePhaseResolutionId: ctx.event.battlePhaseResolutionId, triggerEventId: ctx.event.id });
  Object.assign(s, work);
}

function abigailS1Ledger(s: GameState, controllerId: string): NonNullable<NonNullable<GameState['ruleOverrides']>['abigailSanityLossByPlayer']>[string] | undefined {
  return s.ruleOverrides?.abigailSanityLossByPlayer?.[controllerId];
}

function isCanonicalAbigailS1Ledger(s: GameState, controllerId: string, ledger: NonNullable<NonNullable<GameState['ruleOverrides']>['abigailSanityLossByPlayer']>[string]): boolean {
  const source = s.cards.find((candidate) => candidate.instanceId === ledger.sourceCardId);
  const sourceDefinition = source && runtime(s).pack.cards[source.definitionId];
  if (!source || !sourceDefinition || sourceDefinition.id !== ABIGAIL_S1_SOURCE_ID ||
      source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId ||
      ledger.controllerId !== controllerId || ledger.abilityId !== ABIGAIL_S1_DISTRIBUTE_ID ||
      new Set(ledger.distributed.map((entry) => entry.cardInstanceId)).size !== ledger.distributed.length) return false;
  return ledger.distributed.every((entry) => {
    const created = s.cards.find((candidate) => candidate.instanceId === entry.cardInstanceId);
    const recipient = s.players.find((candidate) => candidate.id === entry.recipientPlayerId);
    const createdDefinition = created && runtime(s).pack.cards[created.definitionId];
    return !!created && !!createdDefinition && !!recipient && recipient.id !== controllerId &&
      createdDefinition.id === ABIGAIL_OUTSIDE_LIFE_ID && created.generatedBy === ABIGAIL_OUTSIDE_LIFE_GENERATED_BY &&
      created.ownerPlayerId === entry.recipientPlayerId && created.controllerPlayerId === entry.recipientPlayerId;
  });
}

function abigailS1SameLocationOpponents(s: GameState, controllerId: string): string[] {
  const controller = player(s, controllerId);
  if (!controller.locationId) return [];
  return s.players.filter((candidate) => candidate.id !== controllerId && candidate.status === 'active' &&
    candidate.locationId === controller.locationId).map((candidate) => candidate.id).sort();
}

function executeAbigailS1Distribution(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAbigailS1DistributeSemantic(a) || !isAbigailS1Source(s, ctx.sourceCardId) ||
      !active(s, ctx.sourceCardId) || phase(s) !== 'action' || player(s, ctx.controllerId).locationId === undefined) {
    reject('resolution_failed', 'Abigail S1 distribution source or action lifecycle is stale');
  }
  const controller = player(s, ctx.controllerId);
  if (!getEnabledLocations(s.map, s.locationConfig).some((location) => location.id === controller.locationId)) {
    reject('resolution_failed', 'Abigail S1 distribution requires a canonical location');
  }
  if (s.round.prioritySeat !== controller.seat) reject('resolution_failed', 'Abigail S1 distribution is not the controller action window');
  const recipients = abigailS1SameLocationOpponents(s, ctx.controllerId);
  const work = structuredClone(s);
  work.ruleOverrides ??= {};
  work.ruleOverrides.abigailSanityLossByPlayer ??= {};
  const previous = work.ruleOverrides.abigailSanityLossByPlayer[ctx.controllerId];
  if (previous && (previous.sourceCardId !== ctx.sourceCardId || previous.controllerId !== ctx.controllerId ||
      previous.abilityId !== ABIGAIL_S1_DISTRIBUTE_ID || !isCanonicalAbigailS1Ledger(work, ctx.controllerId, previous))) {
    reject('resolution_failed', 'Abigail S1 ledger source binding changed');
  }
  const distributed = previous?.distributed ? [...previous.distributed] : [];
  const created: string[] = [];
  for (const recipientId of recipients) {
    const instanceId = nextId(work, 'abigail-s1-outside-life');
    work.cards.push({ instanceId, definitionId: ABIGAIL_OUTSIDE_LIFE_ID, ownerPlayerId: recipientId, controllerPlayerId: recipientId,
      zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: recipientId }, generatedBy: ABIGAIL_OUTSIDE_LIFE_GENERATED_BY });
    distributed.push({ cardInstanceId: instanceId, recipientPlayerId: recipientId });
    created.push(instanceId);
  }
  work.ruleOverrides.abigailSanityLossByPlayer[ctx.controllerId] = {
    sourceCardId: ctx.sourceCardId, abilityId: ABIGAIL_S1_DISTRIBUTE_ID, controllerId: ctx.controllerId, distributed,
  };
  runtime(work).events.push({ type: 'abigail_s1_outside_life_distributed', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, targetPlayerIds: recipients, cardInstanceIds: created, movedCount: created.length });
  Object.assign(s, work);
}

function executeAbigailS1WinIfX12(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAbigailS1WinSemantic(a) || !ctx.event || ctx.event.type !== 'on_card_played' ||
      ctx.event.sourceCardId !== ctx.sourceCardId || ctx.event.playerId !== ctx.controllerId ||
      !isAbigailS1Source(s, ctx.sourceCardId)) {
    reject('resolution_failed', 'Abigail S1 win trigger source or event binding is stale');
  }
  const ledger = abigailS1Ledger(s, ctx.controllerId);
  if (!ledger) return;
  if (ledger.sourceCardId !== ctx.sourceCardId || ledger.controllerId !== ctx.controllerId ||
      ledger.abilityId !== ABIGAIL_S1_DISTRIBUTE_ID || !isCanonicalAbigailS1Ledger(s, ctx.controllerId, ledger)) {
    reject('resolution_failed', 'Abigail S1 win trigger has no canonical ledger');
  }
  const x = ledger.distributed.length;
  if (!Number.isSafeInteger(x) || x !== ABIGAIL_S1_THRESHOLD) return;
  const work = structuredClone(s);
  work.winnerPlayerIds = [ctx.controllerId];
  work.ruleOverrides ??= {};
  work.ruleOverrides.abigailSanityLossVictoryByPlayer ??= {};
  const existing = work.ruleOverrides.abigailSanityLossVictoryByPlayer[ctx.controllerId];
  if (existing && (existing.sourceCardId !== ctx.sourceCardId || existing.controllerId !== ctx.controllerId || existing.x !== ABIGAIL_S1_THRESHOLD)) {
    reject('resolution_failed', 'Abigail S1 victory envelope changed');
  }
  work.ruleOverrides.abigailSanityLossVictoryByPlayer[ctx.controllerId] = {
    sourceCardId: ctx.sourceCardId, abilityId: ABIGAIL_S1_WIN_ID, controllerId: ctx.controllerId, x,
  };
  runtime(work).events.push({ type: 'abigail_s1_game_victory', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, amount: x, targetPlayerIds: [ctx.controllerId] });
  Object.assign(s, work);
}

function executeAbigailS4Release(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAbigailS4ReleaseSemantic(a) || !isAbigailS4Source(s, ctx.sourceCardId) || card(s, ctx.sourceCardId).controllerPlayerId !== ctx.controllerId ||
      phase(s) !== 'action' || !ctx.event || ctx.event.type !== 'on_use_declared' || ctx.event.sourceCardId !== ctx.sourceCardId) {
    reject('resolution_failed', 'Abigail s4 true-name release requires its canonical active source');
  }
  const abigailPlayerId = abigailS4PlayerId(s);
  if (!abigailPlayerId) reject('resolution_failed', 'Abigail s4 requires one active Abigail controller');
  const source = card(s, ctx.sourceCardId);
  const targetPlayerIds = [...new Set([ctx.controllerId, abigailPlayerId])];
  const existing = s.ruleOverrides?.abigailTrueNamePowerBySource?.[source.instanceId];
  if (existing) {
    if (existing.sourceCardId !== source.instanceId || existing.abilityId !== ctx.abilityId ||
        existing.controllerId !== ctx.controllerId || existing.abigailPlayerId !== abigailPlayerId ||
        existing.amount !== ABIGAIL_S4_POWER_AMOUNT || existing.targetPlayerIds.length !== targetPlayerIds.length ||
        existing.targetPlayerIds.some((id, index) => id !== targetPlayerIds[index])) {
      reject('resolution_failed', 'Abigail s4 true-name release envelope is forged');
    }
    return;
  }
  s.ruleOverrides ??= {};
  s.ruleOverrides.abigailTrueNamePowerBySource ??= {};
  s.ruleOverrides.abigailTrueNamePowerBySource[source.instanceId] = {
    sourceCardId: source.instanceId,
    abilityId: ctx.abilityId,
    controllerId: ctx.controllerId,
    abigailPlayerId,
    targetPlayerIds,
    amount: ABIGAIL_S4_POWER_AMOUNT,
  };
  reveal(s, abigailPlayerId);
  runtime(s).events.push({
    type: 'abigail_s4_true_name_released', playerId: ctx.controllerId, sourceCardId: source.instanceId,
    abilityId: ctx.abilityId, targetPlayerIds, amount: ABIGAIL_S4_POWER_AMOUNT,
  });
}

function executeAbigailS4Cleanup(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const event = ctx.event;
  if (!isAbigailS4CleanupSemantic(a) || !isAbigailS4Source(s, ctx.sourceCardId) || card(s, ctx.sourceCardId).controllerPlayerId !== ctx.controllerId ||
      !event || event.type !== 'after_battle_ended' || typeof event.id !== 'string' || !event.battlePhaseResolutionId) {
    reject('invalid_event', 'Abigail s4 cleanup requires its canonical active source and battle-terminal event');
  }
  const abigailPlayerId = abigailS4PlayerId(s);
  if (!abigailPlayerId) reject('resolution_failed', 'Abigail s4 cleanup requires one active Abigail controller');
  const source = card(s, ctx.sourceCardId);
  const envelope = s.ruleOverrides?.abigailTrueNamePowerBySource?.[source.instanceId];
  const expectedTargets = [...new Set([ctx.controllerId, abigailPlayerId])];
  if (!envelope || envelope.sourceCardId !== source.instanceId || envelope.abilityId !== ABIGAIL_S4_RELEASE_ID ||
      envelope.controllerId !== ctx.controllerId || envelope.abigailPlayerId !== abigailPlayerId ||
      envelope.amount !== ABIGAIL_S4_POWER_AMOUNT || envelope.targetPlayerIds.length !== expectedTargets.length ||
      envelope.targetPlayerIds.some((id, index) => id !== expectedTargets[index])) {
    reject('resolution_failed', 'Abigail s4 cleanup requires the installed true-name release envelope');
  }
  const work = structuredClone(s);
  const target = card(work, source.instanceId);
  target.ownerPlayerId = abigailPlayerId;
  target.controllerPlayerId = abigailPlayerId;
  moveCard(work, target.instanceId, 'discard');
  const targetState = runtime(work).cardState[target.instanceId];
  if (!targetState) reject('resolution_failed', 'Abigail s4 source runtime state is missing');
  targetState.active = false;
  targetState.faceDown = false;
  delete work.ruleOverrides!.abigailTrueNamePowerBySource![target.instanceId];
  if (!Object.keys(work.ruleOverrides!.abigailTrueNamePowerBySource!).length) delete work.ruleOverrides!.abigailTrueNamePowerBySource;
  runtime(work).events.push({
    type: 'abigail_s4_true_name_card_recycled', playerId: ctx.controllerId, sourceCardId: target.instanceId,
    abilityId: ctx.abilityId, recipientPlayerId: abigailPlayerId, fromZone: 'attack_area', toZone: 'discard',
    battlePhaseResolutionId: event.battlePhaseResolutionId, triggerEventId: event.id, movedCount: 1,
  });
  Object.assign(s, work);
}

function isZoukenS4Source(s: GameState, sourceCardId: string): boolean {
  return definition(s, sourceCardId)?.id === ZOUKEN_S4_SOURCE_ID;
}

function isZoukenAscensionSource(s: GameState, sourceCardId: string): boolean {
  return definition(s, sourceCardId)?.id === ZOUKEN_ASCENSION_SOURCE_ID;
}

function isExactZoukenS4Directive(effect: RuleNode | undefined, id: string, directive: string): boolean {
  return !!effect && effect.type === 'record_master_directive' && effect.id === id && effect.directive === directive &&
    exactNodeKeys(effect, ['id', 'type', 'directive']);
}

function isExactZoukenS4Shell(a: AuthoringAbility, kind: string, activationKeys: string[], allowActionTargetAndCost = false): boolean {
  if (a.kind !== kind || a.execution.mode !== 'automatic' || !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length) return false;
  if (!Object.keys(a.activation).every((key) => activationKeys.includes(key))) return false;
  if (a.conditions.length || (!allowActionTargetAndCost && (a.targets.length || a.cost.length)) || a.creates.length || a.ruleModifiers.length) return false;
  if (Object.keys(a.lifecycle).length || str(a.responseWindow.opens) || Object.keys(a.limit).length || Object.keys(a.visibility).length) return false;
  const responseKeys = Object.keys(a.responseWindow);
  return responseKeys.every((key) => ['order', 'passBehavior'].includes(key)) &&
    (a.responseWindow.order === undefined || a.responseWindow.order === 'turn_order') &&
    (a.responseWindow.passBehavior === undefined || a.responseWindow.passBehavior === 'decline_this_window');
}

export function isZoukenS4AbilityCandidate(a: AuthoringAbility): boolean {
  return [ZOUKEN_S4_ROUND_ABILITY_ID, ZOUKEN_S4_BATTLE_ABILITY_ID, ZOUKEN_S4_MOVE_ABILITY_ID].includes(a.id);
}

export function isZoukenS4RoundEndSemantic(a: AuthoringAbility): boolean {
  return isExactZoukenS4Shell(a, 'forced_trigger', ['trigger', 'requiresSourceState']) &&
    a.id === ZOUKEN_S4_ROUND_ABILITY_ID && a.printedClause === ZOUKEN_S4_ROUND_CLAUSE &&
    a.activation.trigger === 'round_end' && a.activation.requiresSourceState === 'active' && a.effects.length === 1 &&
    isExactZoukenS4Directive(a.effects[0], 'zouken-s4-round-end', 'zouken_pseudo_vampire_round_end_vp_loss');
}

export function isZoukenS4BattleEndSemantic(a: AuthoringAbility): boolean {
  return isExactZoukenS4Shell(a, 'forced_trigger', ['trigger', 'requiresSourceState']) &&
    a.id === ZOUKEN_S4_BATTLE_ABILITY_ID && a.printedClause === ZOUKEN_S4_BATTLE_CLAUSE &&
    a.activation.trigger === 'after_battle_ended' && a.activation.requiresSourceState === 'active' && a.effects.length === 1 &&
    isExactZoukenS4Directive(a.effects[0], 'zouken-s4-battle-end', 'zouken_pseudo_vampire_battle_end_siphon');
}

export function isZoukenS4MoveSemantic(a: AuthoringAbility): boolean {
  if (!isExactZoukenS4Shell(a, 'phase_action', ['phase', 'opens', 'requiresSourceState'], true) ||
      a.id !== ZOUKEN_S4_MOVE_ABILITY_ID || a.printedClause !== ZOUKEN_S4_MOVE_CLAUSE ||
      a.activation.phase !== 'combat' || a.activation.opens !== 'controller_combat_action_window' || a.activation.requiresSourceState !== 'active' ||
      a.targets.length !== 1 || a.cost.length !== 1 || a.effects.length !== 1) return false;
  const target = a.targets[0]!; const count = node(target.count); const constraints = nodes(target.constraints);
  const cost = a.cost[0]!; const effect = a.effects[0]!;
  return target.id === 'destination' && target.type === 'location' && Number(count.min) === 1 && Number(count.max) === 1 &&
    exactNodeKeys(target, ['id', 'type', 'count', 'constraints']) && constraints.length === 1 && constraints[0]!.type === 'any_enabled_location' &&
    exactNodeKeys(constraints[0]!, ['type']) && cost.type === 'pay_mana' && cost.id === 'zouken-s4-pay-seven' && cost.player === 'controller' && cost.amount === 7 &&
    exactNodeKeys(cost, ['id', 'type', 'player', 'amount']) && effect.type === 'move_player' && effect.id === 'zouken-s4-move' &&
    effect.player === 'controller' && effect.to === 'destination' && exactNodeKeys(effect, ['id', 'type', 'player', 'to']);
}

export function isZoukenS4Semantic(a: AuthoringAbility): boolean {
  return isZoukenS4RoundEndSemantic(a) || isZoukenS4BattleEndSemantic(a) || isZoukenS4MoveSemantic(a);
}

function isExactZoukenAscensionDirective(effect: RuleNode | undefined, id: string, directive: string): boolean {
  return !!effect && effect.type === 'record_master_directive' && effect.id === id && effect.directive === directive &&
    exactNodeKeys(effect, ['id', 'type', 'directive']);
}

export function isZoukenAscensionAbilityCandidate(a: AuthoringAbility): boolean {
  return [ZOUKEN_ASCENSION_PASSIVE_ID, ZOUKEN_ASCENSION_ACTION_ID].includes(a.id);
}

function isExactZoukenAscensionShell(a: AuthoringAbility, kind: string, activationKeys: string[]): boolean {
  if (a.kind !== kind || a.execution.mode !== 'automatic' || !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length) return false;
  if (!Object.keys(a.activation).every((key) => activationKeys.includes(key))) return false;
  if (a.conditions.length || a.creates.length || a.ruleModifiers.length || Object.keys(a.lifecycle).length ||
      Object.keys(a.limit).length || Object.keys(a.visibility).length) return false;
  const responseKeys = Object.keys(a.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
      (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') ||
      (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window')) return false;
  return true;
}

export function isZoukenAscensionPassiveSemantic(a: AuthoringAbility): boolean {
  return isExactZoukenAscensionShell(a, 'passive', ['trigger']) && a.id === ZOUKEN_ASCENSION_PASSIVE_ID &&
    a.printedClause === ZOUKEN_ASCENSION_PASSIVE_CLAUSE && a.activation.trigger === 'while_active' &&
    a.targets.length === 0 && a.cost.length === 0 && a.effects.length === 1 &&
    isExactZoukenAscensionDirective(a.effects[0], 'zouken-illusive-mastermind', 'zouken_illusive_mastermind');
}

export function isZoukenAscensionActionSemantic(a: AuthoringAbility): boolean {
  if (!isExactZoukenAscensionShell(a, 'phase_action', ['phase', 'opens', 'requiresSourceState']) ||
      a.id !== ZOUKEN_ASCENSION_ACTION_ID || a.printedClause !== ZOUKEN_ASCENSION_ACTION_CLAUSE ||
      a.activation.phase !== 'action' || a.activation.opens !== 'controller_action_window' ||
      a.activation.requiresSourceState !== 'active' || a.targets.length !== 1 || a.cost.length !== 1 || a.effects.length !== 1) return false;
  const target = a.targets[0]!; const count = node(target.count); const constraints = nodes(target.constraints);
  const cost = a.cost[0]!; const effect = a.effects[0]!;
  return target.id === 'opponent' && target.type === 'player' && Number(count.min) === 1 && Number(count.max) === 1 &&
    exactNodeKeys(target, ['id', 'type', 'count', 'constraints']) && constraints.length === 2 &&
    constraints[0]!.type === 'zouken_same_battlefield_opponent' && exactNodeKeys(constraints[0]!, ['type']) &&
    constraints[1]!.type === 'zouken_command_seals_at_least' && constraints[1]!.amount === 1 && exactNodeKeys(constraints[1]!, ['type', 'amount']) &&
    cost.type === 'pay_mana' && cost.id === 'zouken-ascension-pay-six' && cost.player === 'controller' && cost.amount === 6 &&
    exactNodeKeys(cost, ['id', 'type', 'player', 'amount']) && effect.type === 'adjust_command_seals' &&
    effect.id === 'zouken-ascension-remove-seal' && effect.player === 'target' && effect.amount === -1 &&
    effect.directive === 'zouken_illusive_mastermind_remove_seal' && effect.target === 'opponent' &&
    exactNodeKeys(effect, ['id', 'type', 'player', 'amount', 'directive', 'target']);
}

export function isZoukenAscensionSemantic(a: AuthoringAbility): boolean {
  return isZoukenAscensionPassiveSemantic(a) || isZoukenAscensionActionSemantic(a);
}

function isZoukenS3Source(s: GameState, sourceCardId: string): boolean {
  return definition(s, sourceCardId)?.id === ZOUKEN_S3_SOURCE_ID;
}

function effectiveCommandSpells(s: GameState, playerId: string): number {
  return hasActiveZoukenFounder(s, playerId) ? 0 : Number((player(s, playerId) as unknown as { commandSpells?: number }).commandSpells ?? 3);
}

function isExactZoukenS3Directive(effect: RuleNode | undefined, id: string, directive: string): boolean {
  return !!effect && effect.type === 'record_master_directive' && effect.id === id && effect.directive === directive &&
    exactNodeKeys(effect, ['id', 'type', 'directive']);
}

export function isZoukenS3AbilityCandidate(a: AuthoringAbility): boolean {
  return [ZOUKEN_S3_PASSIVE_ID, ZOUKEN_S3_ACTION_ID, ZOUKEN_S3_WIN_ID].includes(a.id);
}

export function isZoukenS3PassiveSemantic(a: AuthoringAbility): boolean {
  return isExactZoukenAscensionShell(a, 'passive', ['trigger']) && a.id === ZOUKEN_S3_PASSIVE_ID &&
    a.printedClause === ZOUKEN_S3_PASSIVE_CLAUSE && a.activation.trigger === 'while_active' &&
    a.targets.length === 0 && a.cost.length === 0 && a.effects.length === 1 &&
    isExactZoukenS3Directive(a.effects[0], 'zouken-founder', 'zouken_founder');
}

export function isZoukenS3ActionSemantic(a: AuthoringAbility): boolean {
  if (!isExactZoukenAscensionShell(a, 'phase_action', ['phase', 'opens', 'requiresSourceState']) ||
      a.id !== ZOUKEN_S3_ACTION_ID || a.printedClause !== ZOUKEN_S3_ACTION_CLAUSE ||
      a.activation.phase !== 'action' || a.activation.opens !== 'controller_action_window' ||
      a.activation.requiresSourceState !== 'active' || a.targets.length !== 0 || a.cost.length !== 1 || a.effects.length !== 1) return false;
  const cost = a.cost[0]!;
  return cost.type === 'pay_mana' && cost.id === 'zouken-founder-pay-2x' && cost.player === 'controller' &&
    node(cost.amount).var === 'X' && exactNodeKeys(cost, ['id', 'type', 'player', 'amount']) &&
    isExactZoukenS3Directive(a.effects[0], 'zouken-founder-power', 'zouken_founder_power_conversion');
}

export function isZoukenS3WinSemantic(a: AuthoringAbility): boolean {
  return isExactZoukenAscensionShell(a, 'forced_trigger', ['trigger', 'requiresSourceState']) &&
    a.id === ZOUKEN_S3_WIN_ID && a.printedClause === '若你于本回合赢得战斗，获得X点战果。' &&
    a.activation.trigger === 'after_controller_wins_battle' && a.activation.requiresSourceState === 'active' &&
    a.targets.length === 0 && a.cost.length === 0 && a.effects.length === 1 &&
    isExactZoukenS3Directive(a.effects[0], 'zouken-founder-vp', 'zouken_founder_victory_points');
}

export function isZoukenS3Semantic(a: AuthoringAbility): boolean {
  return isZoukenS3PassiveSemantic(a) || isZoukenS3ActionSemantic(a) || isZoukenS3WinSemantic(a);
}

function isZoukenS2Source(s: GameState, sourceCardId: string): boolean {
  return definition(s, sourceCardId)?.id === ZOUKEN_S2_SOURCE_ID;
}

export function isZoukenS2AbilityCandidate(a: AuthoringAbility): boolean {
  return a.id === ZOUKEN_S2_ABILITY_ID;
}

export function isZoukenS2Semantic(a: AuthoringAbility): boolean {
  if (!isGameStartSkillProvisioningSemantic(a) || a.id !== ZOUKEN_S2_ABILITY_ID || a.printedClause !== ZOUKEN_S2_CLAUSE) return false;
  const targets = a.effects[0]?.targetDefinitionIds;
  return Array.isArray(targets) && targets.length === 2 && targets[0] === ZOUKEN_S2_TARGET_IDS[0] && targets[1] === ZOUKEN_S2_TARGET_IDS[1];
}

function exactZoukenS2TargetPack(s: GameState, sourceCardId: string, ability: AuthoringAbility): boolean {
  if (!isZoukenS2Semantic(ability) || !isZoukenS2Source(s, sourceCardId)) return false;
  const sourceOwner = player(s, card(s, sourceCardId).controllerPlayerId).masterCardId;
  const targets = ability.effects[0]?.targetDefinitionIds as string[];
  return targets.every((targetId, index) => {
    const target = runtime(s).pack.cards[targetId] as ExecutableCardDefinition | undefined;
    if (!target || target.id !== ZOUKEN_S2_TARGET_IDS[index] || target.mode !== 'automatic' || target.cardType !== 'master_skill' ||
        target.ownerId !== sourceOwner || target.initialZone !== undefined) return false;
    const ids = target.abilities.map((candidate) => candidate.id);
    const expected = index === 0 ? ['zouken.founder', 'zouken.founder.power-conversion', 'zouken.founder.after-win'] :
      ['zouken.pseudo-vampire.round-end', 'zouken.pseudo-vampire.battle-end', 'zouken.pseudo-vampire.bug-body'];
    return ids.length === expected.length && ids.every((id, position) => id === expected[position]);
  });
}

function zoukenS4BattleLosers(battle: GameState['battleResults'][number]): string[] {
  const winners = new Set(battle.winnerPlayerIds);
  if (battle.participantBreakdowns?.length) return battle.participantBreakdowns.map((entry) => entry.playerId).filter((id) => !winners.has(id));
  return battle.militaryAdjustments.filter((entry) => entry.delta < 0 && !winners.has(entry.playerId)).map((entry) => entry.playerId);
}

function exactZoukenS4PlayerSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== new Set(left).size || right.length !== new Set(right).size || left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((id) => expected.has(id));
}

function zoukenS4TerminalBattles(s: GameState, event: AbilityEvent): Array<{ battleId: string; battle: GameState['battleResults'][number]; winnerIds: string[]; loserIds: string[]; participantIds: string[] }> {
  if (event.type !== 'after_battle_ended' || !event.battlePhaseResolutionId || !Array.isArray(event.battleIds) || !Array.isArray(event.resultIds) ||
      !Array.isArray(event.battleParticipantIds) || !Array.isArray(event.battleOutcomes) || event.battleIds.length !== event.resultIds.length ||
      event.battleIds.length !== event.battleOutcomes.length) {
    reject('invalid_event', 'Zouken S4 battle settlement requires the complete terminal battle envelope');
  }
  const entries = event.battleIds!.map((battleId, index) => {
    const outcome = event.battleOutcomes![index]!; const prefix = `${event.battlePhaseResolutionId}:battle:${outcome.battlefieldId}:`;
    if (typeof battleId !== 'string' || !battleId.startsWith(prefix)) reject('invalid_event', 'Zouken S4 terminal battle id is not canonical');
    const ordinal = Number(battleId.slice(prefix.length)); const battle = s.battleResults[ordinal - 1];
    if (!Number.isSafeInteger(ordinal) || ordinal < 1 || !battle || battle.battlefieldId !== outcome.battlefieldId ||
        event.resultIds![index] !== `${battleId}:result`) reject('invalid_event', 'Zouken S4 terminal battle provenance does not match battle history');
    const winnerIds = [...outcome.winnerPlayerIds]; const canonicalWinnerIds = [...battle.winnerPlayerIds];
    const loserIds = zoukenS4BattleLosers(battle);
    const participantIds = battle.participantBreakdowns?.map((entry) => entry.playerId) ?? [...new Set([...canonicalWinnerIds, ...loserIds])];
    if (!exactZoukenS4PlayerSet(winnerIds, canonicalWinnerIds) || !exactZoukenS4PlayerSet(participantIds, [...new Set(participantIds)]) ||
        !winnerIds.every((id) => participantIds.includes(id)) || loserIds.some((id) => !participantIds.includes(id)) ||
        participantIds.some((id) => !event.battleParticipantIds!.includes(id))) reject('invalid_event', 'Zouken S4 terminal participant provenance is inconsistent');
    return { battleId, battle, winnerIds, loserIds, participantIds };
  });
  const canonicalParticipants = [...new Set(entries.flatMap((entry) => entry.participantIds))];
  if (!exactZoukenS4PlayerSet(event.battleParticipantIds!, canonicalParticipants)) reject('invalid_event', 'Zouken S4 phase participant provenance is inconsistent');
  if (new Set(entries.map((entry) => entry.battleId)).size !== entries.length || new Set(entries.map((entry) => entry.battle.battlefieldId)).size !== entries.length) {
    reject('invalid_event', 'Zouken S4 terminal battle envelope contains duplicate identities');
  }
  return entries;
}

function settleZoukenS4RoundEnd(s: GameState, ctx: EffectContext): void {
  const event = ctx.event;
  if (!event || event.type !== 'round_end' || !isZoukenS4Source(s, ctx.sourceCardId)) reject('invalid_event', 'Zouken S4 round settlement requires its canonical source and round_end event');
  const r = runtime(s); const settled = r.zoukenS4RoundSettledBySource ??= {};
  if (settled[ctx.sourceCardId] === s.round.roundNumber) return;
  const gained = r.manaGainedThisRound.round === s.round.roundNumber ? (r.manaGainedThisRound.byPlayer[ctx.controllerId] ?? 0) : 0;
  const controller = player(s, ctx.controllerId); const before = controller.vp;
  if (gained < 3) controller.vp = Math.max(0, before - 2);
  settled[ctx.sourceCardId] = s.round.roundNumber;
  runtime(s).events.push({ type: 'zouken_s4_round_vp_loss_settled', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, resource: 'victory_points', requestedDelta: gained < 3 ? -2 : 0, delta: controller.vp - before,
    before, after: controller.vp, roundNumber: s.round.roundNumber, triggerEventId: event.id });
}

function settleZoukenS4BattleEnd(s: GameState, ctx: EffectContext): void {
  const event = ctx.event;
  if (!event || event.type !== 'after_battle_ended' || !event.battlePhaseResolutionId) reject('invalid_event', 'Zouken S4 battle settlement requires a canonical terminal event');
  const battles = zoukenS4TerminalBattles(s, event); const r = runtime(s);
  const settled = r.zoukenS4BattleSettledBySource ??= {}; const prior = settled[ctx.sourceCardId] ?? [];
  if (prior.includes(event.battlePhaseResolutionId!)) return;
  const controller = player(s, ctx.controllerId);
  const ascensionRemovesWinGate = hasActiveZoukenAscension(s, ctx.controllerId);
  for (const entry of battles) {
    if (!entry.winnerIds.includes(ctx.controllerId) && !ascensionRemovesWinGate) continue;
    const atRecon = controller.locationId === 'recon';
    const hasOtherPlayer = entry.participantIds.some((id) => id !== ctx.controllerId);
    const eligibleLosers = entry.loserIds.filter((id) => id !== ctx.controllerId);
    if (!atRecon && hasOtherPlayer && eligibleLosers.length === 0) continue;
    let sourcePlayerId: string | undefined; let requested = 3;
    if (!atRecon && hasOtherPlayer) {
      sourcePlayerId = [...eligibleLosers].sort((left, right) => player(s, left).seat - player(s, right).seat)[0];
      if (sourcePlayerId) requested = Math.min(3, player(s, sourcePlayerId).mana);
    }
    const before = controller.mana;
    const gain = grantMana(s, ctx.controllerId, requested, { source: 'generic' });
    if (sourcePlayerId && gain.actualAmount > 0) player(s, sourcePlayerId).mana -= gain.actualAmount;
    r.events.push({ type: 'zouken_s4_battle_mana_settled', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId, ...(sourcePlayerId ? { sourcePlayerId } : {}), targetPlayerId: ctx.controllerId,
      resource: 'mana', requestedDelta: requested, delta: gain.actualAmount, before, after: controller.mana,
      battlePhaseResolutionId: event.battlePhaseResolutionId, battleId: entry.battleId,
      battlefieldId: entry.battle.battlefieldId, triggerEventId: event.id,
      qualifyingPlayerIds: sourcePlayerId ? [sourcePlayerId] : [] });
  }
  settled[ctx.sourceCardId] = [...prior, event.battlePhaseResolutionId!];
}

function executeZoukenAscensionAction(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isZoukenAscensionActionSemantic(a)) reject('resolution_failed', 'Unsupported Zouken ascension action semantic shape');
  const targetId = ctx.selections.opponent?.[0];
  if (!targetId || targetId === ctx.controllerId || !sameBattlefield(s, player(s, ctx.controllerId).locationId, player(s, targetId).locationId)) {
    reject('illegal_target', 'Zouken ascension requires an opponent at the controller battlefield');
  }
  const target = player(s, targetId);
  const seals = Number((target as unknown as { commandSpells?: number }).commandSpells ?? 3);
  if (target.status !== 'active' || seals < 1) reject('illegal_target', 'Zouken ascension target must have a command seal');
  const before = seals;
  (target as unknown as { commandSpells: number }).commandSpells = before - 1;
  runtime(s).events.push({
    type: 'zouken_ascension_command_seal_removed', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, targetPlayerId: targetId, resource: 'command_seals', requestedDelta: -1,
    delta: -1, before, after: before - 1, roundNumber: s.round.roundNumber,
  });
}

function executeZoukenS3Action(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isZoukenS3ActionSemantic(a) || !isZoukenS3Source(s, ctx.sourceCardId) || !hasActiveZoukenFounder(s, ctx.controllerId)) {
    reject('resolution_failed', 'Unsupported Zouken founder action semantic shape');
  }
  if (phase(s) !== 'action' || !active(s, ctx.sourceCardId) || s.round.prioritySeat !== player(s, ctx.controllerId).seat) {
    reject('resolution_failed', 'Zouken founder action is stale');
  }
  const x = ctx.variables.X;
  const controller = player(s, ctx.controllerId);
  if (typeof x !== 'number' || !Number.isSafeInteger(x) || x < 1 || x * 2 > controller.mana) reject('invalid_cost', 'Zouken founder X must be a positive integer within twice the mana cost');
  const existing = s.ruleOverrides?.zoukenFounderPowerByPlayer?.[ctx.controllerId];
  if (existing?.round === s.round.roundNumber) reject('ability_limit_reached', 'Zouken founder action already used this round');
  const before = controller.mana;
  controller.mana -= x * 2;
  s.ruleOverrides ??= {};
  s.ruleOverrides.zoukenFounderPowerByPlayer = {
    ...(s.ruleOverrides.zoukenFounderPowerByPlayer ?? {}),
    [ctx.controllerId]: { round: s.round.roundNumber, amount: x, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
      controllerId: ctx.controllerId, paidMana: x * 2, manaBefore: before, manaAfter: controller.mana },
  };
  runtime(s).usedAbilities[`${ctx.sourceCardId}:${a.id}`] = s.round.roundNumber;
  runtime(s).events.push({ type: 'zouken_s3_power_conversion', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, resource: 'mana', requestedDelta: -x * 2, delta: -x * 2, before, after: controller.mana,
    roundNumber: s.round.roundNumber });
}

function settleZoukenS3Win(s: GameState, ctx: EffectContext): void {
  const event = ctx.event;
  if (!event || event.type !== 'after_controller_wins_battle' || event.playerId !== ctx.controllerId ||
      !isZoukenS3Source(s, ctx.sourceCardId) || !hasActiveZoukenFounder(s, ctx.controllerId)) {
    reject('invalid_event', 'Zouken founder victory conversion requires its canonical win event');
  }
  const entry = s.ruleOverrides?.zoukenFounderPowerByPlayer?.[ctx.controllerId];
  if (!entry || entry.round !== s.round.roundNumber || !Number.isSafeInteger(entry.amount) || entry.amount < 1) return;
  const settled = modeState(s).zoukenS3VictorySettledBySource ??= {};
  const key = `${ctx.sourceCardId}:${s.round.roundNumber}`;
  if (settled[key]) return;
  const controller = player(s, ctx.controllerId); const before = controller.vp;
  controller.vp += entry.amount; settled[key] = true;
  runtime(s).events.push({ type: 'zouken_s3_victory_points_settled', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, resource: 'victory_points', requestedDelta: entry.amount, delta: entry.amount,
    before, after: controller.vp, roundNumber: s.round.roundNumber, triggerEventId: event.id });
}

function validateZoukenAscensionPendingContinuation(
  s: GameState,
  contextValue: EffectContext,
  ability: AuthoringAbility,
  selected: string[],
): void {
  if (!isZoukenAscensionActionSemantic(ability) || !isZoukenAscensionSource(s, contextValue.sourceCardId)) {
    reject('resolution_failed', 'Unsupported Zouken ascension continuation semantic shape');
  }
  const source = card(s, contextValue.sourceCardId);
  const controller = player(s, contextValue.controllerId);
  if (source.controllerPlayerId !== contextValue.controllerId || !active(s, source.instanceId) ||
      runtime(s).cardState[source.instanceId]?.faceDown === true || phase(s) !== 'action' ||
      s.round.prioritySeat !== controller.seat || controller.mana < 6 || selected.length !== 1) {
    reject('resolution_failed', 'Zouken ascension continuation is stale');
  }
  const targetId = selected[0]!;
  const target = player(s, targetId);
  const seals = Number((target as unknown as { commandSpells?: number }).commandSpells ?? 3);
  if (target.status !== 'active' || targetId === contextValue.controllerId ||
      !sameBattlefield(s, controller.locationId, target.locationId) || !isBattlefield(s, target.locationId) || seals < 1) {
    reject('illegal_target', 'Zouken ascension continuation target is no longer legal');
  }
}

function executeZoukenS4Move(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isZoukenS4MoveSemantic(a) || player(s, ctx.controllerId).mana < 7) reject('insufficient_mana', 'Zouken S4 movement requires seven mana');
  executeResolutionEffects(s, ctx, [...a.cost, ...a.effects]);
}

export function isGameStartRuleOverrideSemantic(a: AuthoringAbility): boolean {
  if (!isGameStartRuleOverrideCandidate(a) || a.kind !== 'forced_trigger' || a.execution.mode !== 'automatic' ||
    !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length) return false;
  if (str(a.activation.trigger) !== 'game_start' || Object.keys(a.activation).some((key) => key !== 'trigger')) return false;
  if (a.conditions.length || a.targets.length || a.cost.length || a.creates.length || a.ruleModifiers.length) return false;
  const responseKeys = Object.keys(a.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') ||
    (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window') ||
    Object.keys(a.limit).length || Object.keys(a.visibility).length || Object.keys(a.lifecycle).length) return false;
  if (!a.effects.length || !a.effects.every((effect) => isExactGameStartRuleOverrideEffect(effect))) return false;
  const rules = a.effects.map((effect) => str(effect.rule));
  return new Set(rules).size === rules.length;
}

function provisionedSkillCardIsValid(s: GameState, instance: CardInstance, controllerId: string, expectedGeneratedBy?: string): boolean {
  const state = runtime(s).cardState[instance.instanceId];
  return instance.ownerPlayerId === controllerId && instance.controllerPlayerId === controllerId &&
    instance.zone === 'skill' && instance.visibility.scope === 'owner_only' &&
    instance.visibility.ownerPlayerId === controllerId &&
    (expectedGeneratedBy === undefined || instance.generatedBy === expectedGeneratedBy) &&
    state?.active !== true && state?.faceDown !== true;
}

function gameStartSkillProvisioningPreflight(s: GameState, sourceId: string, a: AuthoringAbility): boolean {
  const source = card(s, sourceId); const controller = player(s, source.controllerPlayerId);
  const sourceDefinition = definition(s, sourceId) as ExecutableCardDefinition | undefined;
  if (source.ownerPlayerId !== controller.id || source.zone !== 'skill' || sourceDefinition?.mode !== 'automatic' ||
    sourceDefinition?.cardType !== 'master_skill' ||
    sourceDefinition.ownerId !== controller.masterCardId) return false;
  const targets = a.effects[0]?.targetDefinitionIds;
  if (!Array.isArray(targets)) return false;
  if (isZoukenS2AbilityCandidate(a) && !exactZoukenS2TargetPack(s, sourceId, a)) return false;
  for (const definitionId of targets) {
    if (typeof definitionId !== 'string') return false;
    const target = runtime(s).pack.cards[definitionId] as ExecutableCardDefinition | undefined;
    if (!target || target.mode !== 'automatic' || target.cardType !== 'master_skill' ||
      target.ownerId !== controller.masterCardId || target.initialZone !== undefined) return false;
    const existing = s.cards.filter((candidate) => candidate.definitionId === definitionId);
    const expectedGeneratedBy = isZoukenS2AbilityCandidate(a) ? source.instanceId : undefined;
    if (existing.length > 1 || (existing.length === 1 && !provisionedSkillCardIsValid(s, existing[0]!, controller.id, expectedGeneratedBy))) return false;
  }
  return true;
}

function provisionGameStartSkillCards(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isGameStartSkillProvisioningSemantic(a) || !gameStartSkillProvisioningPreflight(s, ctx.sourceCardId, a)) {
    reject('resolution_failed', 'Unsupported game-start skill-provisioning semantic shape');
  }
  const targets = a.effects[0]!.targetDefinitionIds as string[];
  for (const definitionId of targets) {
    if (s.cards.some((candidate) => candidate.definitionId === definitionId)) continue;
    const instanceId = nextId(s, 'provisioned-skill');
    s.cards.push({
      instanceId, definitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId,
      zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId }, generatedBy: ctx.sourceCardId,
    });
    runtime(s).cardState[instanceId] = { active: false, faceDown: false, playedRound: s.round.roundNumber };
    runtime(s).events.push({
      type: 'card_created', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
      cardInstanceId: instanceId, toZone: 'skill', movedCount: 1,
    });
  }
}

function isActivationOnlyDefinition(s: GameState, definitionId: string): boolean {
  return Object.values(runtime(s).pack.cards).some((source) =>
    source.abilities.some((ability) =>
      isActivateCardByIdTrigger(ability) &&
      ability.effects.some((effect) => effect.type === 'activate_card_by_id' && effect.definitionId === definitionId)));
}
function playFailure(s: GameState, p: string, sourceId: string, faceDown = false, ignoreStagedAttackLimit = false, ignoreAttackLimit = false, ignoreTiming = false, allowRequiredAdditionalPlay = false, allowDiscard = false): string | undefined {
  const c = card(s, sourceId); const d = definition(s, sourceId); if (!d) return 'unsupported';
  if (d.mode !== 'automatic') return d.mode;
  if (c.controllerPlayerId !== p || (!['hand', 'skill'].includes(c.zone) && !(allowDiscard && c.zone === 'discard')) || player(s, p).status !== 'active') return 'illegal_action';
  if (c.zone === 'skill' && isActivationOnlyDefinition(s, c.definitionId)) return 'activation_only';
  const hasLegacyAppendOnlyMarker = d.abilities.some(a => a.effects.some(effect => effect.type === 'append_only_rule' && effect.rule !== 'ignore_battle_loss_effects'));
  const requiredAdditionalPlay = hasRequiredAdditionalPlayMarker(d);
  if (hasLegacyAppendOnlyMarker && (!allowRequiredAdditionalPlay || !requiredAdditionalPlay)) return 'append_only';
  if (!ignoreTiming && (phase(s) !== d.playTiming.phase || s.round.prioritySeat !== player(s, p).seat)) return 'illegal_timing';
  if (faceDown && (!isAttack(d) || d.cardType === 'servant_skill')) return 'illegal_face_down';
  const forbidRules = ongoingCardPlayForbidRules(s, p, sourceId);
  if (forbidRules.some(rule => !hasPlayRuleException(d, rule))) return 'play_forbidden';
  const limit = perGamePlayLimit(d);
  if (limit && (runtime(s).abilityUsage[`play:${sourceId}:${limit.key}`] ?? 0) >= limit.uses) return 'card_limit_reached';
  if (!ignoreAttackLimit && attackPlayLimitReached(s, p, sourceId, ignoreStagedAttackLimit)) return 'attack_play_limit_reached';
  const requirements = d.playRequirements.concat(nodes(d.cardFace.requirements)).filter(r =>
    str(r.type) && !(str(r.type) === 'skill_zone_mana_at_least' && hasPlayRuleException(d, 'skill_zone_mana_at_least')));
  if (!requirements.every(r => condition(s, context(s, sourceId, ''), r))) return 'play_requirement';
  
  if (!faceDown && player(s, p).mana < Number(d.cardFace.cost ?? 0)) return 'insufficient_mana';
  const unconfirmed = d.abilities.find(a => ['unsupported', 'text_unconfirmed'].includes(a.execution.mode));
  if (unconfirmed) return unconfirmed.execution.mode;
  if (!faceDown) {
    const blocked = d.abilities.find(a => a.execution.mode !== 'automatic'); if (blocked) return blocked.execution.mode;
  }
  return undefined;
}
export function getLegalActions(s: GameState, playerId: string): LegalAction[] {
  const r = runtime(s); const p = s.players.find(p => p.id === playerId); if (!p || p.status !== 'active') return [];
  const pending = r.pendingDecision;
  if (pending) {
    const projectedCandidates = pending.interaction ? pending.candidates : candidates(s, pending.context, pending.target);
    return pending.controllerId === playerId
      ? [{ type: 'choose_target', decisionId: pending.id, candidates: [...projectedCandidates], min: pending.min, max: pending.max }]
      : [];
  }
  const window = r.responseWindows[0];
  if (window) return window.controllerId === playerId ? [
    ...window.choices.filter(c => canActivate(s, c.cardInstanceId, abilityDefinition(s, c.cardInstanceId, c.abilityId), window.event))
      .map(c => ({ type: 'resolve_response' as const, windowId: window.id, cardInstanceId: c.cardInstanceId, abilityId: c.abilityId })),
    { type: 'decline_this_window', windowId: window.id },
  ] : [];
  if (r.hostRequests.length) return [];
  const result: LegalAction[] = [];
  const staged = stagedAttacks(s)[playerId] ?? [];
  if (staged.length && s.round.prioritySeat === p.seat) {
    result.push({ type: 'confirm_staged_attack' }, { type: 'cancel_staged_attack' });
    const hasOrdinaryStagedAttack = staged.some((entry) =>
      entersAttackArea(s, entry.cardInstanceId) && !isRequiredAdditionalPlayCard(s, entry.cardInstanceId));
    for (const c of s.cards.filter(c => c.controllerPlayerId === playerId && !staged.some(entry => entry.cardInstanceId === c.instanceId))) {
      const allowRequiredAdditional = hasOrdinaryStagedAttack && isRequiredAdditionalPlayCard(s, c.instanceId);
      if (!playFailure(s, playerId, c.instanceId, false, false, false, false, allowRequiredAdditional) && entersAttackArea(s, c.instanceId)) {
        result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId });
      }
      if (!playFailure(s, playerId, c.instanceId, true, false, false, false, allowRequiredAdditional) && entersAttackArea(s, c.instanceId)) {
        result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId, faceDown: true });
      }
    }
    return result;
  }
  for (const c of s.cards.filter(c => c.controllerPlayerId === playerId)) {
    const alreadyStaged = staged.some((entry) => entry.cardInstanceId === c.instanceId);
    if (!alreadyStaged && !playFailure(s, playerId, c.instanceId)) {
      result.push({ type: 'play_card', cardInstanceId: c.instanceId });
      if (s.round.prioritySeat === p.seat && entersAttackArea(s, c.instanceId) && !staged.some((entry) => entry.cardInstanceId === c.instanceId && !entry.faceDown)) {
        result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId });
      }
    }
    if (!alreadyStaged && !playFailure(s, playerId, c.instanceId, true)) {
      result.push({ type: 'play_card', cardInstanceId: c.instanceId, faceDown: true });
      if (s.round.prioritySeat === p.seat && entersAttackArea(s, c.instanceId) && !staged.some((entry) => entry.cardInstanceId === c.instanceId && entry.faceDown === true)) {
        result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId, faceDown: true });
      }
    }
    for (const a of definition(s, c.instanceId)?.abilities ?? []) {
      const interaction = classifyAbilityInteraction(a);
      if (interaction.kind !== 'phase_activation' || effectiveActivationPhase(s, c.instanceId, a) !== phase(s) || s.round.prioritySeat !== p.seat || !canActivate(s, c.instanceId, a)) continue;
      const costs = a.cost.filter(x => x.type === 'pay_mana' && node(x.amount).var).map(x => ({
        name: str(node(x.amount).var), min: isZoukenS3ActionSemantic(a) ? 1 : 0,
        max: isZoukenS3ActionSemantic(a) ? Math.floor(p.mana / 2) : p.mana,
      }));
      result.push({ type: 'activate_ability', cardInstanceId: c.instanceId, abilityId: a.id, ...(costs.length ? { variableCosts: costs } : {}) });
    }
  }
  return result;
}

export function triggerEventScopeMatches(a: AuthoringAbility, event: AbilityEvent): boolean {
  const eventLocationId = str(a.activation.eventLocationId);
  if (eventLocationId && event.locationId !== eventLocationId) return false;
  return true;
}
function battleEventControllerEligibleAfterScoring(s: GameState, event: AbilityEvent, controllerId: string): boolean {
  if (player(s, controllerId).status === 'active') return true;
  const perBattleScoped = !!event.battlePhaseResolutionId && !!event.battleId && !!event.resultId &&
    ['after_battle_result_determined', 'after_controller_wins_battle', 'after_controller_loses_battle', 'after_controller_first_loses_battle', 'after_controller_gains_victory'].includes(event.type);
  const phaseTerminalScoped = !!event.battlePhaseResolutionId && event.type === 'after_battle_ended';
  return (perBattleScoped || phaseTerminalScoped) && event.battleParticipantIds?.includes(controllerId) === true;
}

export function collectTriggeredAbilities(s: GameState, event: AbilityEvent): TriggeredAbility[] {
  const found: TriggeredAbility[] = [];
  for (const c of s.cards) {
    if (!battleEventControllerEligibleAfterScoring(s, event, c.controllerPlayerId)) continue;
    for (const a of definition(s, c.instanceId)?.abilities ?? []) {
      const matches = a.activation.trigger === event.type || (!a.activation.trigger && a.kind === 'phase_action' && a.activation.opens === event.type);
      if (event.type === 'while_active') {
        const transformed = runtime(s).transformedReturnSilenceSourceCardIds?.includes(c.instanceId) === true;
        const isSoulDragState = a.effects.some((effect) => effect.type === 'soul_drag_power_bonus');
        const isReturnSilenceState = a.effects.some((effect) => effect.type === 'return_silence_battle_start');
        if ((transformed && isSoulDragState) || (!transformed && isReturnSilenceState)) continue;
      }
      if (event.type === 'after_battle_power_calculated' &&
        (!Array.isArray(event.battleParticipantIds) || !event.battleParticipantIds.includes(c.controllerPlayerId))) continue;
      if (event.type === 'after_battle_result_determined' &&
        (isOptionalBattleResultVpTriggerSemantic(a) || isOptionalBattleResultExtraVpTriggerSemantic(a)) &&
        Array.isArray(event.battleParticipantIds) && !event.battleParticipantIds.includes(c.controllerPlayerId)) continue;
      if (event.type === 'after_battle_ended' && isBattleEndSourceReturnCandidate(a) && !battleEndSourceReturnTriggerEligible(s, c.instanceId)) continue;
      if (event.type === 'after_battle_ended' && isBattleEndMobilePlayersRewardSemantic(a) &&
        Array.isArray(event.battleParticipantIds) && !event.battleParticipantIds.includes(c.controllerPlayerId)) continue;
      if (event.type === 'after_battle_ended' && isZoukenS4BattleEndSemantic(a) &&
        Array.isArray(event.battleParticipantIds) && !event.battleParticipantIds.includes(c.controllerPlayerId)) continue;
      if (event.type === 'after_battle_ended' && isAbigailS4CleanupSemantic(a) &&
        !s.ruleOverrides?.abigailTrueNamePowerBySource?.[c.instanceId]) continue;
      if (event.type === 'after_player_deployed_to_battlefield' && isDeploymentResourceRewardCandidate(a) &&
        event.playerId !== c.controllerPlayerId) continue;
      if (event.type === 'after_controller_loses_battle' && isBattleLossStateTransformCandidate(a) &&
        !battleLossStateTransformTriggerEligible(s, c.instanceId)) continue;
      if (event.type === 'on_card_played' && isSourcePlayBasicAttackDrawTriggerCandidate(a) &&
        !sourcePlayBasicAttackDrawEventScopeMatches(event, c.instanceId, c.controllerPlayerId)) continue;
      if (!matches || !canActivate(s, c.instanceId, a, event) || !triggerEventScopeMatches(a, event)) continue;
      if (['on_card_played', 'on_use_declared'].includes(event.type) && event.sourceCardId !== c.instanceId &&
        !a.conditions.some((condition) => condition.type === 'event_played_card_has_attribute') &&
        !isAlterEgoTransformSemantic(a)) continue;
      if (event.type.startsWith('after_controller_') && event.playerId !== c.controllerPlayerId) continue;
      found.push({ cardInstanceId: c.instanceId, abilityId: a.id, controllerId: c.controllerPlayerId });
    }
  }
  const turnSeats = s.players.slice().sort((a, b) => a.seat - b.seat); const start = turnSeats.findIndex(p => p.seat === s.round.prioritySeat);
  const ordered = [...turnSeats.slice(Math.max(0, start)), ...turnSeats.slice(0, Math.max(0, start))];
  return found.sort((a, b) => ordered.findIndex(p => p.id === a.controllerId) - ordered.findIndex(p => p.id === b.controllerId));
}
function moveCard(s: GameState, id: string, zone: string): number {
  if (!['hand', 'deck', 'discard', 'field', 'skill', 'attack_area', 'removed_from_game', 'looked_cards'].includes(zone)) reject('unsupported', 'Unmapped destination zone');
  const c = card(s, id); const moved = c.zone === zone ? 0 : 1; c.zone = zone;
  c.visibility = zone === 'field' || zone === 'attack_area' || zone === 'removed_from_game' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: c.ownerPlayerId };
  if (!['field', 'attack_area'].includes(zone)) {
    if (runtime(s).cardState[id]) runtime(s).cardState[id]!.active = false;
    clearTransientCardTransformState(s, id);
    clearReturnSilenceTransformForSource(s, id);
  }
  return moved;
}
function implicitCardTargets(s: GameState, ctx: EffectContext, target: unknown): string[] {
  const targetId = str(target);
  if (!targetId) return [];
  if (targetId === 'this_card' || targetId === 'source_card') return [ctx.sourceCardId];
  return s.cards.filter(c => c.controllerPlayerId === ctx.controllerId &&
    (c.definitionId === targetId || c.definitionId.endsWith(`.${targetId}`) || c.definitionId.endsWith(`.skill.${targetId}`))).map(c => c.instanceId);
}
function installCreatedPowerModifier(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  const modifier = node(effect.modifier);
  if (modifier.type === 'terrain_multiplier') {
    const store = s as unknown as { modeState?: { terrainMultipliers?: Array<Record<string, unknown>> } };
    store.modeState ??= {};
    store.modeState.terrainMultipliers ??= [];
    store.modeState.terrainMultipliers.push({
      playerId: ctx.controllerId,
      multiplier: Number(modifier.value ?? 2),
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      duration: str(modifier.duration) || 'this_round',
    });
    return;
  }
  if (modifier.type !== 'power_bonus') reject('unsupported', 'Unsupported created modifier');
  const target = str(modifier.target ?? effect.target);
  const amount = numeric(s, ctx, modifier.amount ?? modifier.value ?? 0);
  const scope = target === 'this_card' ? { object: 'source_card' } : target === 'controller' ? { controller: 'self' } : {};
  runtime(s).ongoingEffects.push({
    id: nextId(s, 'created-modifier'),
    sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId,
    controllerId: ctx.controllerId,
    starts: 'immediate',
    duration: str(modifier.duration) || 'this_round',
    startRound: s.round.roundNumber,
    expiresAtRound: s.round.roundNumber + 1,
    cleanup: 'expire_after_duration',
    sourceMustRemainActive: target === 'this_card',
    ruleModifiers: [{
      sourceCardId: ctx.sourceCardId,
      controllerId: ctx.controllerId,
      definition: { id: str(modifier.id) || 'created_power_bonus', operation: 'add', rule: 'card.currentPower', scope, value: amount },
    }],
    publicZones: [],
  });
}
function payEffectCost(s: GameState, ctx: EffectContext, cost: RuleNode, selectedCount: number): void {
  if (!selectedCount) return;
  if (str(cost.type) !== 'pay_mana') reject('unsupported', 'Only optional mana payments are supported');
  const p = player(s, ctx.controllerId);
  const value = numeric(s, ctx, cost.amount);
  if (!Number.isSafeInteger(value) || value < 0 || value > p.mana) reject('insufficient_mana', 'Cannot pay optional mana cost');
  p.mana -= value;
}
function shuffle(s: GameState, ownerId: string): void {
  const r = runtime(s); const indexes = s.cards.map((c, i) => c.ownerPlayerId === ownerId && c.zone === 'deck' ? i : -1).filter(i => i >= 0);
  const deck = indexes.map(i => s.cards[i]!);
  for (let i = deck.length - 1; i > 0; i--) {
    let x = r.randomState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; r.randomState = x >>> 0;
    const j = Math.floor((r.randomState / 0x100000000) * (i + 1)); [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  indexes.forEach((index, i) => { s.cards[index] = deck[i]!; });
}
function shortestPath(s: GameState, from: string, to: string): string[] {
  if (from === to) return [from];
  const locations = getEnabledLocations(s.map, s.locationConfig);
  const queue: string[][] = [[from]];
  const seen = new Set([from]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i]!;
    const current = path[path.length - 1]!;
    for (const next of locations.find(l => l.id === current)?.movementLinks ?? []) {
      if (seen.has(next) || !locations.some(l => l.id === next)) continue;
      const candidate = [...path, next];
      if (next === to) return candidate;
      seen.add(next);
      queue.push(candidate);
    }
  }
  return [from, to];
}
function recordMovementForAbilityRuntime(s: GameState, playerId: string, from: string | undefined, to: string | undefined): void {
  if (!from || !to || from === to) return;
  const path = shortestPath(s, from, to);
  const distance = Math.max(0, path.length - 1);
  const r = runtime(s);
  r.movementDistanceThisRound[playerId] = (r.movementDistanceThisRound[playerId] ?? 0) + distance;
  const battlefields = path.slice(1).filter(locationId => isBattlefield(s, locationId)).length;
  r.battlefieldsPassedOrStayedThisRound[playerId] = (r.battlefieldsPassedOrStayedThisRound[playerId] ?? 0) + battlefields;
  s.log.push({ type: 'movement', message: `player:${playerId}:effect_move:${from}->${to}`, payload: { playerId, from, to, movementKind: 'effect', manaSpent: 0, roundNumber: s.round.roundNumber } });
}
function lifecycleTransitions(s: GameState) {
  const r = runtime(s);
  r.lifecycleTransitions ??= [];
  return r.lifecycleTransitions;
}
function pushLifecycleTransition(s: GameState, ongoing: OngoingEffect, kind: 'install' | 'source_invalidated'): void {
  const transitions = lifecycleTransitions(s);
  if (kind === 'source_invalidated' && transitions.some((entry) => entry.lifecycleId === ongoing.id && entry.kind === kind)) return;
  transitions.push({
    transitionId: nextId(s, `lifecycle-${kind}`),
    lifecycleId: ongoing.id,
    kind,
    causationId: `${ongoing.sourceCardId}:${ongoing.abilityId}:${runtime(s).revision}`,
    createdRevision: runtime(s).revision,
    roundId: s.round.roundNumber,
  });
}
function installOngoing(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const applicableModifiers = a.ruleModifiers.filter(m => m.rule !== 'effect_prevention' && nodes(m.conditions).every(c => condition(s, ctx, c)));
  const duration = str(a.lifecycle.duration) || str(node(applicableModifiers[0]?.lifecycle).duration);
  if (!duration) return;
  const r = runtime(s);
  const sourceValidity = node(a.lifecycle.sourceValidity);
  const usesResolvedSourceValidity = a.lifecycle.sourceValidity !== undefined;
  if (usesResolvedSourceValidity) {
    const cleanup = str(a.lifecycle.cleanup);
    const policyId = str(sourceValidity.policyId);
    if (duration !== 'while_card_active' || !['when_card_leaves_active_area', 'remain_active'].includes(cleanup) ||
      sourceValidity.kind !== 'accepted_source_state_policy' || sourceValidity.owner !== 'card_zone_source_state' ||
      policyId !== ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID) {
      reject('resolution_failed', 'Unsupported resolved source-bound lifecycle policy');
    }
    const source = card(s, ctx.sourceCardId);
    const policyKey = `while_card_active:${cleanup}:${policyId}`;
    if (r.ongoingEffects.some(o =>
      o.sourceCardId === ctx.sourceCardId && o.abilityId === a.id && o.policyKey === policyKey)) return;
    const validity = evaluateCardSourceValidity(s, {
      policyId,
      sourceCardInstanceId: ctx.sourceCardId,
      sourceAbilityId: a.id,
      controllerPlayerId: ctx.controllerId,
      sourceDefinitionIdAtInstall: source.definitionId,
    });
    if (!validity.supported || !validity.valid) reject('resolution_failed', 'Lifecycle source is not valid at installation');
    const ongoing: OngoingEffect = {
      id: nextId(s, 'lifecycle'),
      sourceCardId: ctx.sourceCardId,
      abilityId: a.id,
      controllerId: ctx.controllerId,
      starts: 'immediate',
      duration,
      startRound: s.round.roundNumber,
      cleanup,
      ruleModifiers: applicableModifiers.map(m => ({ sourceCardId: ctx.sourceCardId, controllerId: ctx.controllerId, definition: m })),
      publicZones: [],
      sourceMustRemainActive: true,
      policyKey,
      sourceDefinitionIdAtInstall: source.definitionId,
      sourceValidityPolicyId: policyId,
      installedRevision: r.revision,
    };
    r.ongoingEffects.push(ongoing);
    pushLifecycleTransition(s, ongoing, 'install');
    return;
  }
  const key = `${ctx.sourceCardId}:${a.id}`;
  if (r.ongoingEffects.some(o => o.id === key)) return;
  const rounds = duration === 'this_round' ? 1 : duration === 'round_count' ? Number(a.lifecycle.rounds) : undefined;
  const ruleModifiers = applicableModifiers.map(m => ({ sourceCardId: ctx.sourceCardId, controllerId: ctx.controllerId, definition: m }));
  r.ongoingEffects.push({ id: key, sourceCardId: ctx.sourceCardId, abilityId: a.id, controllerId: ctx.controllerId,
    starts: 'immediate', duration, startRound: s.round.roundNumber, ...(rounds !== undefined ? { expiresAtRound: s.round.roundNumber + rounds } : {}),
    cleanup: str(a.lifecycle.cleanup), ruleModifiers, publicZones: [] });
}
function cleanupOngoing(s: GameState): void {
  const r = runtime(s);
  for (const o of r.ongoingEffects) {
    if (o.sourceValidityPolicyId) {
      if (!o.sourceDefinitionIdAtInstall || !o.policyKey) reject('resolution_failed', 'Corrupt source-bound lifecycle state');
      const validity = evaluateCardSourceValidity(s, {
        policyId: o.sourceValidityPolicyId,
        sourceCardInstanceId: o.sourceCardId,
        sourceAbilityId: o.abilityId,
        controllerPlayerId: o.controllerId,
        sourceDefinitionIdAtInstall: o.sourceDefinitionIdAtInstall,
      });
      if (!validity.supported) reject('resolution_failed', 'Unknown lifecycle source-validity policy');
      if (!validity.valid) pushLifecycleTransition(s, o, 'source_invalidated');
      continue;
    }
    if (o.expiresAtRound !== undefined && s.round.roundNumber >= o.expiresAtRound && active(s, o.sourceCardId) && o.cleanup) {
      moveCard(s, o.sourceCardId, o.cleanup === 'remove_from_game' ? 'removed_from_game' : definition(s, o.sourceCardId)?.cardType === 'servant_skill' ? 'skill' : 'discard');
    }
  }
  r.ongoingEffects = liveOngoing(s);
}
function reveal(s: GameState, controllerId: string): void {
  const r = runtime(s); if (r.revealedServants.includes(controllerId)) return;
  r.revealedServants.push(controllerId); r.events.push({ type: 'servant_package_revealed', playerId: controllerId });
}
function checkFormulaTriggers(s: GameState): void {
  for (const t of collectTriggeredAbilities(s, { id: 'formula-check', type: 'when_formula_condition_met' })) {
    if (runtime(s).revealedServants.includes(t.controllerId)) continue;
    executeAbility(s, context(s, t.cardInstanceId, t.abilityId));
  }
}
/** Executes one validated effect; continuation and choices are managed by executeEffects. Server-only. */
export function resolveEffect(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  const p = player(s, ctx.controllerId); const r = runtime(s); const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  const unpreventable = a.ruleModifiers.some(m => m.rule === 'effect_prevention' && m.operation === 'ignore' && node(m.priority).tier === 'explicit_exception');
  if (r.preventEffects && !unpreventable) { r.events.push({ type: 'effect_prevented', playerId: p.id }); return; }
  switch (effect.type) {
    case 'defeat_highest_power_opponents': {
      if (!isPresenceConcealmentAssassinationSemantic(a)) reject('resolution_failed', 'Unsupported Presence Concealment semantic shape');
      const event = ctx.event;
      const snapshot = trustedBattlePowerSnapshot(event);
      if (!event || event.type !== 'after_battle_power_calculated' || !event.resultId || !event.battlefieldId || !snapshot) {
        reject('invalid_event', 'Presence Concealment requires trusted pre-scoring battle identity and Power facts');
      }
      const targetPlayerIds = highestPowerOpponents(event, ctx.controllerId);
      const pending = r.pendingPresenceConcealmentDefeats ??= [];
      if (!pending.some((entry) => entry.triggerEventId === event.id && entry.sourceCardId === ctx.sourceCardId && entry.abilityId === ctx.abilityId)) {
        pending.push({
          controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, triggerEventId: event.id,
          resultId: event.resultId, battlefieldId: event.battlefieldId, participantIds: snapshot.participantIds, participantPowers: snapshot.powers, targetPlayerIds,
        });
      }
      break;
    }
    case 'claim_and_discard_location_events': {
      const placements = s.eventPlacements.filter(e => e.locationId === p.locationId);
      if (placements.some(e => !Number.isSafeInteger(e.victoryPoints))) reject('missing_event_vp', 'Content layer must supply every event printed VP');
      const total = placements.reduce((sum, e) => sum + e.victoryPoints!, 0);
      p.vp = Math.max(0, p.vp + total);
      r.calculations.push({ controllerId: p.id, lines: [{ label: '当前战场事件牌战果合计', value: total }] });
      s.eventDiscardPile = [...(s.eventDiscardPile ?? []), ...placements];
      s.eventPlacements = s.eventPlacements.filter(e => e.locationId !== p.locationId);
      break;
    }
    case 'draw_cards': {
      const count = numeric(s, ctx, effect.count);
      if (!Number.isSafeInteger(count) || count < 0) reject('invalid_count', 'Invalid draw count');
      for (let i = 0; i < count; i++) {
        if (!s.cards.some(c => c.ownerPlayerId === p.id && c.zone === 'deck')) {
          s.cards.filter(c => c.ownerPlayerId === p.id && c.zone === 'discard').forEach(c => moveCard(s, c.instanceId, 'deck'));
          shuffle(s, p.id);
        }
        const top = s.cards.find(c => c.ownerPlayerId === p.id && c.zone === 'deck');
        if (!top) break;
        moveCard(s, top.instanceId, 'hand');
      }
      break;
    }
    case 'play_selected_cards': playBatch(s, p.id, (ctx.selections[str(effect.target)] ?? []).map(cardInstanceId =>
      ({ type: 'play_card', cardInstanceId, ...(effect.face === 'face_down' ? { faceDown: true } : {}) })), 'effect'); break;
    case 'play_source_card': {
      const source = card(s, ctx.sourceCardId);
      if (source.controllerPlayerId !== p.id || source.zone !== 'hand') reject('illegal_action', 'Source card is not playable from hand');
      if (isRequiredAdditionalPlayCard(s, ctx.sourceCardId)) reject('append_only', 'Required additional-play cards are not effect-playable');
      moveCard(s, ctx.sourceCardId, cardPlayClassification(s, ctx.sourceCardId).destinationZone);
      r.cardState[ctx.sourceCardId] = { active: effect.face === 'face_down' ? false : true, faceDown: effect.face === 'face_down', playedRound: s.round.roundNumber };
      if (effect.face === 'face_down') source.visibility = { scope: 'owner_only', ownerPlayerId: p.id };
      processEvent(s, { id: nextId(s, 'declare'), type: 'on_use_declared', playerId: p.id, sourceCardId: ctx.sourceCardId, playedCards: [{ instanceId: ctx.sourceCardId, controllerId: p.id, cardType: definition(s, ctx.sourceCardId)!.cardType, faceDown: effect.face === 'face_down' }] });
      processEvent(s, { id: nextId(s, 'play'), type: 'on_card_played', playerId: p.id, sourceCardId: ctx.sourceCardId, playedCards: [{ instanceId: ctx.sourceCardId, controllerId: p.id, cardType: definition(s, ctx.sourceCardId)!.cardType, faceDown: effect.face === 'face_down' }] });
      break;
    }
    case 'reveal_information': if (effect.scope !== 'servant_package') reject('unsupported', 'Unknown reveal scope'); reveal(s, p.id); break;
    case 'set_zone_visibility': {
      const ongoing = r.ongoingEffects.find(o => o.sourceCardId === ctx.sourceCardId && o.abilityId === ctx.abilityId);
      if (!ongoing || effect.visibility !== 'public') reject('unsupported', 'Visibility requires an ongoing public effect');
      ongoing.publicZones.push(str(effect.zone)); break;
    }
    case 'look_at_deck_top': {
      const calculated = evaluateFormula(effect.count, s, p.id, ctx.sourceCardId, ctx.variables);
      r.calculations.push({ controllerId: p.id, lines: calculated.lines });
      const count = calculated.value; if (!Number.isSafeInteger(count) || count < 0) reject('invalid_count', 'Invalid deck look count');
      const top = s.cards.filter(c => c.ownerPlayerId === p.id && c.zone === 'deck').slice(0, count);
      top.forEach(c => moveCard(s, c.instanceId, str(effect.resultZone))); break;
    }
    case 'move_card': {
      const selected = ctx.selections[str(effect.target)] ?? implicitCardTargets(s, ctx, effect.target);
      if (effect.optionalCost) payEffectCost(s, ctx, node(effect.optionalCost), selected.length);
      const moved = selected.reduce((sum, id) => sum + moveCard(s, id, str(node(effect.to).zone)), 0);
      if (str(effect.resultVar)) ctx.variables[str(effect.resultVar)] = (ctx.variables[str(effect.resultVar)] ?? 0) + moved;
      break;
    }
    case 'move_all_remaining': {
      const excluded = Array.isArray(effect.excluding) ? effect.excluding.flatMap(x => ctx.selections[str(x)] ?? []) : [];
      const moved = s.cards.filter(c => c.ownerPlayerId === p.id && c.zone === effect.from && !excluded.includes(c.instanceId))
        .reduce((sum, c) => sum + moveCard(s, c.instanceId, str(node(effect.to).zone)), 0);
      if (str(effect.resultVar)) ctx.variables[str(effect.resultVar)] = (ctx.variables[str(effect.resultVar)] ?? 0) + moved;
      break;
    }
    case 'adjust_mana': {
      const amount = numeric(s, ctx, effect.amount);
      if (amount > 0) grantMana(s, p.id, amount, { source: 'generic' });
      else if (amount < 0) p.mana = Math.max(0, p.mana + amount); break;
    }
    case 'install_rule_override': {
      if (!isExactGameStartRuleOverrideEffect(effect)) reject('resolution_failed', 'Unsupported persistent RuleOverride shape');
      installGameStartRuleOverride(s, ctx.controllerId, effect);
      break;
    }
    case 'adjust_command_seals': {
      const current = Number((p as unknown as { commandSpells?: number }).commandSpells ?? 3);
      const amount = numeric(s, ctx, effect.amount);
      if (hasActiveZoukenFounder(s, ctx.controllerId) && p.id === ctx.controllerId && amount !== 0) {
        const replacement = Math.abs(amount) * 4;
        const before = p.mana;
        if (amount < 0) {
          if (before < replacement) reject('insufficient_mana', 'Zouken founder command-seal replacement requires four mana per seal');
          p.mana -= replacement;
        } else {
          grantMana(s, p.id, replacement, { source: 'generic' });
        }
        const after = p.mana;
        pushModeDirective(s, { controllerId: p.id, directive: str(effect.directive) || 'adjust_command_seals', sourceCardId: ctx.sourceCardId,
          abilityId: ctx.abilityId, amount, commandSpells: 0, replacementMana: replacement, consumed: true });
        runtime(s).events.push({ type: 'zouken_s3_command_seal_replaced', playerId: p.id, sourceCardId: ctx.sourceCardId,
          abilityId: ctx.abilityId, resource: 'mana', requestedDelta: amount < 0 ? -replacement : replacement,
          delta: after - before, before, after, roundNumber: s.round.roundNumber });
        break;
      }
      const next = Math.max(0, current + amount);
      (p as unknown as { commandSpells: number }).commandSpells = next;
      pushModeDirective(s, {
        controllerId: p.id,
        directive: str(effect.directive) || 'adjust_command_seals',
        sourceCardId: ctx.sourceCardId,
        abilityId: ctx.abilityId,
        amount,
        commandSpells: next,
        consumed: true,
      });
      if (current > 0 && next === 0) {
        processEvent(s, { id: nextId(s, 'empty-seals'), type: 'after_controller_loses_all_command_seals', playerId: p.id });
      }
      break;
    }
    case 'pay_mana': {
      const amount = numeric(s, ctx, effect.amount);
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > p.mana) reject('insufficient_mana', 'Cannot pay mana');
      p.mana -= amount;
      break;
    }
    case 'adjust_victory_points': p.vp = Math.max(0, p.vp + numeric(s, ctx, effect.amount)); break;
    case 'move_player': {
      const to = ctx.selections[str(effect.to)]?.[0];
      if (to) {
        const from = p.locationId;
        p.locationId = to as LocationId;
        recordMovementForAbilityRuntime(s, p.id, from, to);
        processEvent(s, { id: nextId(s, 'enter-location'), type: 'after_controller_enters_location', playerId: p.id, locationId: to });
      }
      break;
    }
    case 'shuffle_zone_into_deck':
      s.cards.filter(c => c.ownerPlayerId === p.id && c.zone === node(effect.from).zone).forEach(c => moveCard(s, c.instanceId, 'deck'));
      shuffle(s, p.id); break;
    case 'shuffle_deck': shuffle(s, p.id); break;
    case 'create_card': {
      const id = nextId(s, 'created'); const zone = str(node(effect.to).zone);
      s.cards.push({ instanceId: id, definitionId: str(effect.cardId), ownerPlayerId: p.id, controllerPlayerId: p.id,
        zone, visibility: { scope: 'owner_only', ownerPlayerId: p.id }, generatedBy: ctx.sourceCardId });
      for (const next of nodes(effect.then)) resolveEffect(s, ctx, next); break;
    }
    case 'create_modifier': installCreatedPowerModifier(s, ctx, effect); break;
    default: {
      if (effect.type === 'close_source_card' && isCardCloseForbidden(s, ctx.sourceCardId)) {
        reject('resolution_failed', 'Close source card is forbidden by a live rule modifier.');
      }
      // Try extended effects handler
      try {
        resolveExtendedEffect(s, ctx.controllerId, effect, {
          sourceCardId: ctx.sourceCardId,
          abilityId: ctx.abilityId,
          selections: ctx.selections,
          ...(ctx.event ? { event: ctx.event } : {}),
        });
      } catch (e) {
        reject('unsupported', `Unsupported effect: ${str(effect.type)}`);
      }
    }
  }
  r.events.push({ type: 'effect_resolved', playerId: p.id, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, unpreventable,
    ...(effect.type === 'look_at_deck_top' || effect.type === 'move_card' || effect.type === 'move_all_remaining' ? { visibility: p.id } : {}) });
}
interface PendingTargetRestoreSpec {
  target: RuleNode;
  candidates: string[];
  min: number;
  max: number;
  remainingEffects: RuleNode[];
}
function findPendingTargetRestoreSpec(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): PendingTargetRestoreSpec | undefined {
  for (const target of a.targets.filter(t => t.type === 'choice')) {
    const targetRef = str(target.id);
    if (Object.prototype.hasOwnProperty.call(ctx.selections, targetRef)) continue;
    const count = node(target.count); const min = Number(count.min ?? 1); const max = Number(count.max ?? 1);
    const choices = candidates(s, ctx, target);
    if (choices.length < min) reject('no_legal_target', 'No legal target remains');
    return { target, candidates: choices, min, max, remainingEffects: effects };
  }
  for (const effect of effects) {
    if (effect.type === 'branch') {
      const branch = nodes(effect.branches).find(b => b.else !== undefined || condition(s, ctx, node(b.if)));
      return branch ? findPendingTargetRestoreSpec(s, ctx, a, nodes(branch.then ?? branch.else)) : undefined;
    }
    const targetRef = effect.type === 'move_player' ? str(effect.to) : str(effect.target);
    const target = a.targets.find(t => t.id === targetRef);
    if (!target) return undefined;
    if (Object.prototype.hasOwnProperty.call(ctx.selections, targetRef)) continue;
    const count = node(target.count); const min = Number(count.min ?? 1); const max = Number(count.max ?? 1);
    const choices = candidates(s, ctx, target);
    if (choices.length < min) reject('no_legal_target', 'No legal target remains');
    return { target, candidates: choices, min, max, remainingEffects: effects };
  }
  return undefined;
}
function findPendingTarget(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): PendingDecision | undefined {
  const pending = findPendingTargetRestoreSpec(s, ctx, a, effects);
  if (!pending) return undefined;
  return { id: nextId(s, 'decision'), controllerId: ctx.controllerId, target: pending.target, candidates: pending.candidates,
    min: pending.min, max: pending.max, context: structuredClone(ctx), remainingEffects: pending.remainingEffects };
}

function exactRestoreValue(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((entry, index) => exactRestoreValue(entry, right[index]));
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const l = left as Record<string, unknown>; const r = right as Record<string, unknown>;
    const lk = Object.keys(l).sort(); const rk = Object.keys(r).sort();
    return lk.length === rk.length && lk.every((key, index) => key === rk[index] && exactRestoreValue(l[key], r[key]));
  }
  return Object.is(left, right);
}
function restoredPhysicalSource(s: GameState, sourceCardId: string, controllerId?: string): CardInstance | undefined {
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  if (!source || (controllerId !== undefined && source.controllerPlayerId !== controllerId)) return undefined;
  return source;
}
function restoredAbility(s: GameState, sourceCardId: string, abilityId: string): AuthoringAbility | undefined {
  try { return abilityDefinition(s, sourceCardId, abilityId); } catch { return undefined; }
}
function runtimeContinuationSequenceMatches(s: GameState, ctx: EffectContext, effects: RuleNode[], remainingEffects: RuleNode[], depth = 0): boolean {
  if (depth > 32) return false;
  for (let index = 0; index < effects.length; index += 1) {
    const suffix = effects.slice(index);
    if (exactRestoreValue(suffix, remainingEffects)) return true;
    const effect = effects[index]!;
    if (effect.type !== 'branch') continue;
    const branch = nodes(effect.branches).find((candidate) => candidate.else !== undefined || condition(s, ctx, node(candidate.if)));
    if (!branch) continue;
    const expanded = [...nodes(branch.then ?? branch.else), ...effects.slice(index + 1)];
    if (runtimeContinuationSequenceMatches(s, ctx, expanded, remainingEffects, depth + 1)) return true;
  }
  return false;
}
function contextVariablesBelongToAbility(ability: AuthoringAbility, ctx: EffectContext): boolean {
  const allowed = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (typeof record.var === 'string' && record.var.length > 0) allowed.add(record.var);
    if (typeof record.resultVar === 'string' && record.resultVar.length > 0) allowed.add(record.resultVar);
    Object.values(record).forEach(visit);
  };
  visit(ability);
  return Object.keys(ctx.variables).every((name) => allowed.has(name));
}
function inputVariableCalculationsMatch(s: GameState, ability: AuthoringAbility, ctx: EffectContext): boolean {
  const names = ability.cost.filter((cost) => cost.type === 'pay_mana').map((cost) => str(node(cost.amount).var)).filter(Boolean);
  if (!names.length) return true;
  if (names.some((name) => !Object.prototype.hasOwnProperty.call(ctx.variables, name))) return false;
  const latest = [...runtime(s).calculations].reverse().find((entry) => entry.controllerId === ctx.controllerId && entry.lines.length === names.length && entry.lines.every((line, index) => line.label === names[index]));
  return !!latest && latest.lines.every((line) => ctx.variables[line.label] === line.value);
}
export function isCanonicalGenericPendingDecisionForRestore(s: GameState, decision: PendingDecision): boolean {
  if (decision.interaction) return true;
  try {
    if (decision.controllerId !== decision.context.controllerId) return false;
    const source = restoredPhysicalSource(s, decision.context.sourceCardId, decision.context.controllerId);
    if (!source) return false;
    const ability = restoredAbility(s, decision.context.sourceCardId, decision.context.abilityId);
    if (!ability || !contextVariablesBelongToAbility(ability, decision.context) || !inputVariableCalculationsMatch(s, ability, decision.context)) return false;
    if (isAbigailS3aSemantic(ability)) {
      if (!isAbigailS3aSource(s, decision.context.sourceCardId) || !active(s, decision.context.sourceCardId) || phase(s) !== 'action') return false;
      const expectedCandidates = abigailS3aTargetCandidates(s, decision.context, ability);
      return decision.min === 1 && decision.max === 1 && exactRestoreValue(decision.target, ability.targets[0]) &&
        exactRestoreValue(decision.candidates, expectedCandidates) && expectedCandidates.length > 0 &&
        exactRestoreValue(decision.remainingEffects, ability.effects);
    }
    if (isAbigailS3bActionSemantic(ability)) {
      if (!isAbigailS3aSource(s, decision.context.sourceCardId) || !active(s, decision.context.sourceCardId) || phase(s) !== 'action' ||
          s.round.prioritySeat !== player(s, decision.context.controllerId).seat) return false;
      const contextKeys = Object.keys(decision.context).sort();
      if (contextKeys.join(',') !== 'abilityId,controllerId,selections,sourceCardId,variables' ||
          Object.keys(decision.context.variables).length !== 0 || Object.keys(decision.context.selections).length !== 0) return false;
      const expectedCandidates = abigailS3bTargetCandidates(s, decision.context, ability);
      return decision.min === 0 && decision.max === Math.min(ABIGAIL_S3B_MAX_PLAY_COUNT, expectedCandidates.length) &&
        exactRestoreValue(decision.target, ability.targets[0]) && exactRestoreValue(decision.candidates, expectedCandidates) &&
        exactRestoreValue(decision.remainingEffects, ability.effects);
    }
    const targetIds = new Set(ability.targets.map((target) => str(target.id)).filter(Boolean));
    if (Object.entries(decision.context.selections).some(([targetId, selectedIds]) => !targetIds.has(targetId) || !Array.isArray(selectedIds) || new Set(selectedIds).size !== selectedIds.length)) return false;
    const canonicalEffects = [...ability.effects, ...ability.creates];
    if (!runtimeContinuationSequenceMatches(s, decision.context, canonicalEffects, decision.remainingEffects)) return false;
    const expected = findPendingTargetRestoreSpec(s, structuredClone(decision.context), ability, decision.remainingEffects);
    return !!expected && decision.min === expected.min && decision.max === expected.max && exactRestoreValue(decision.target, expected.target) && exactRestoreValue(decision.candidates, expected.candidates) && exactRestoreValue(decision.remainingEffects, expected.remainingEffects);
  } catch { return false; }
}
export function isDeferredAbilityRuntimeProvenanceValidForRestore(s: GameState): boolean {
  try {
    const r = runtime(s); const playerIds = new Set(s.players.map((candidate) => candidate.id));
    const locationIds = new Set<string>(s.map.locations.map((candidate) => candidate.id));
    const hasPlayers = (ids: readonly string[]) => ids.every((id) => playerIds.has(id)) && new Set(ids).size === ids.length;
    if (!(r.pendingDelayedActivations ?? []).every((entry) => {
      const source = restoredPhysicalSource(s, entry.sourceCardId, entry.controllerId);
      const ability = restoredAbility(s, entry.sourceCardId, entry.abilityId);
      const suffix = ':first-loss:' + entry.controllerId;
      if (!source || source.ownerPlayerId !== entry.controllerId || !ability || !isActivateCardByIdTrigger(ability) || str(ability.effects[0]?.definitionId) !== entry.definitionId || entry.round !== s.round.roundNumber || !r.processedEvents.includes(entry.triggerEventId) || !entry.triggerEventId.endsWith(suffix)) return false;
      const prefix = entry.triggerEventId.slice(0, -suffix.length);
      return new RegExp('^battle-phase:' + entry.round + ':battle:[^:]+:[1-9]\d*:result$').test(prefix);
    })) return false;
    if (!(r.pendingPresenceConcealmentDefeats ?? []).every((entry) => {
      const source = restoredPhysicalSource(s, entry.sourceCardId, entry.controllerId); const ability = restoredAbility(s, entry.sourceCardId, entry.abilityId);
      if (!source || !ability || !isPresenceConcealmentAssassinationSemantic(ability) || !locationIds.has(entry.battlefieldId) || !hasPlayers(entry.participantIds) || !hasPlayers(entry.targetPlayerIds) || !entry.participantIds.includes(entry.controllerId)) return false;
      const powers = entry.participantPowers; if (Object.keys(powers).length !== entry.participantIds.length || entry.participantIds.some((id) => !Number.isFinite(powers[id]))) return false;
      const opponents = entry.participantIds.filter((id) => id !== entry.controllerId); if (opponents.length < 2) return false;
      const ownPower = powers[entry.controllerId]!; const highest = Math.max(...opponents.map((id) => powers[id]!));
      const expectedTargets = opponents.filter((id) => powers[id] === highest);
      return ownPower < highest && exactRestoreValue(entry.targetPlayerIds, expectedTargets) && r.processedEvents.includes(entry.triggerEventId);
    })) return false;
    if (!(r.pendingOpponentCloseToOne ?? []).every((entry) => {
      const source = restoredPhysicalSource(s, entry.sourceCardId, entry.initiatingControllerId); const ability = restoredAbility(s, entry.sourceCardId, entry.abilityId);
      return !!source && source.ownerPlayerId === entry.initiatingControllerId && !!ability && isAcceptedOpponentCloseToOneAbility(ability, 'compiled') && locationIds.has(entry.battlefieldId) && playerIds.has(entry.decisionPlayerId) && hasPlayers(entry.remainingDecisionPlayerIds);
    })) return false;
    if ((r.transformedReturnSilenceSourceCardIds ?? []).some((id) => !s.cards.some((card) => card.instanceId === id))) return false;
    return true;
  } catch { return false; }
}

function createPrivateOptionalHandPlayInteraction(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): PendingDecision {
  if (!isPrivateOptionalHandPlayInteractionSemantic(a)) reject('resolution_failed', 'Unsupported private optional hand-play interaction semantic shape');
  const target = a.targets[0]!;
  const count = node(target.count);
  const min = Number(count.min); const max = Number(count.max);
  const snapshot = candidates(s, ctx, target);
  const id = nextId(s, 'interaction');
  return {
    id, controllerId: ctx.controllerId, target, candidates: [...snapshot], min, max,
    context: structuredClone(ctx), remainingEffects: effects,
    interaction: {
      kind: 'private_optional_hand_play_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1,
      continuationRef: `${id}:continuation`,
      constraints: { kind: 'target', targetKind: 'card', min, max, distinct: true },
    },
  };
}

function exactPlayerArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isExactFrozenCardIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length >= 2 &&
    value.every((id) => typeof id === 'string' && id.length > 0) && new Set(value).size === value.length;
}

function exactFrozenCardIdList(left: unknown, right: unknown): boolean {
  return isExactFrozenCardIdList(left) && isExactFrozenCardIdList(right) && exactPlayerArray(left, right);
}

function isExactOpponentCloseToOneConstraints(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return exactPlayerArray(keys, ['distinct', 'kind', 'max', 'min', 'targetKind']) &&
    record.kind === 'target' && record.targetKind === 'card' && record.min === 1 && record.max === 1 && record.distinct === true;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isExactOpponentCloseToOneContext(value: unknown): value is EffectContext {
  if (!isPlainRecord(value) || !isPlainRecord(value.variables) || !isPlainRecord(value.selections)) return false;
  const keys = Object.keys(value).sort();
  return exactPlayerArray(keys, ['abilityId', 'controllerId', 'selections', 'sourceCardId', 'variables']) &&
    typeof value.controllerId === 'string' && value.controllerId.length > 0 &&
    typeof value.sourceCardId === 'string' && value.sourceCardId.length > 0 &&
    typeof value.abilityId === 'string' && value.abilityId.length > 0 &&
    Object.keys(value.variables).length === 0 && Object.keys(value.selections).length === 0;
}

function isExactOpponentCloseToOneTarget(value: unknown): value is RuleNode {
  if (!isPlainRecord(value) || !isPlainRecord(value.count)) return false;
  const keys = Object.keys(value).sort();
  const countKeys = Object.keys(value.count).sort();
  return exactPlayerArray(keys, ['count', 'id', 'type']) && exactPlayerArray(countKeys, ['max', 'min']) &&
    value.id === 'frozen_non_residual_attack_to_keep' && value.type === 'card_instance' &&
    value.count.min === 1 && value.count.max === 1;
}

function isExactPlayerOwnerMap(value: unknown, ids: readonly string[]): value is Record<string, string> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === ids.length && ids.every((id) =>
    Object.prototype.hasOwnProperty.call(record, id) && typeof record[id] === 'string' && record[id]!.length > 0);
}

function exactPlayerOwnerMap(left: unknown, right: unknown, ids: unknown): boolean {
  if (!isExactFrozenCardIdList(ids)) return false;
  return isExactPlayerOwnerMap(left, ids) && isExactPlayerOwnerMap(right, ids) && ids.every((id) => left[id] === right[id]);
}

function livePlayerOwnersMatchFrozen(s: GameState, frozen: unknown, ids: unknown): boolean {
  if (!isExactFrozenCardIdList(ids) || !isExactPlayerOwnerMap(frozen, ids)) return false;
  return ids.every((instanceId) => {
    const current = s.cards.find((candidate) => candidate.instanceId === instanceId);
    return !!current && current.ownerPlayerId === frozen[instanceId];
  });
}

function isExactNonEmptyPlayerIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length >= 1 &&
    value.every((id) => typeof id === 'string' && id.length > 0) && new Set(value).size === value.length;
}

function isValidOpponentCloseToOneSourceCardState(value: unknown): value is CardRuntimeState {
  return isPlainRecord(value) && typeof value.active === 'boolean' && typeof value.faceDown === 'boolean' &&
    Number.isSafeInteger(value.playedRound);
}

function opponentCloseToOneQueueMatchesServerAuthority(s: GameState, queue: PendingOpponentCloseToOne[]): boolean {
  const authority = getOpponentCloseToOneServerAuthority(s);
  if (!authority || !Number.isSafeInteger(authority.nextIndex) || authority.nextIndex < 0 || authority.nextIndex >= authority.entries.length) return false;
  const remaining = authority.entries.slice(authority.nextIndex);
  if (remaining.length !== queue.length) return false;
  const remainingPlayerIds = remaining.map((entry) => entry.decisionPlayerId);
  if (!exactPlayerArray(queue.map((entry) => entry.decisionPlayerId), remainingPlayerIds)) return false;
  return queue.every((entry, index) => {
    const frozen = remaining[index]!;
    return entry.initiatingControllerId === frozen.initiatingControllerId &&
      entry.decisionPlayerId === frozen.decisionPlayerId && entry.sourceCardId === frozen.sourceCardId &&
      entry.abilityId === frozen.abilityId && entry.battlefieldId === frozen.battlefieldId &&
      exactFrozenCardIdList(entry.qualifyingCardIds, frozen.qualifyingCardIds) &&
      exactPlayerOwnerMap(entry.qualifyingCardOwners, frozen.qualifyingCardOwners, frozen.qualifyingCardIds) &&
      exactPlayerArray(entry.remainingDecisionPlayerIds, remainingPlayerIds.slice(index));
  });
}

function hasExactOpponentCloseToOneDecisionRootKeys(value: unknown): boolean {
  if (!isPlainRecord(value)) return false;
  return exactPlayerArray(Object.keys(value).sort(), ['candidates', 'context', 'controllerId', 'id', 'interaction', 'max', 'min', 'remainingEffects', 'target']);
}

function hasExactOpponentCloseToOneInteractionRootKeys(value: unknown): boolean {
  if (!isPlainRecord(value)) return false;
  return exactPlayerArray(Object.keys(value).sort(), ['abilityId', 'battlefieldId', 'cancelPolicy', 'constraints', 'continuationRef', 'createdRevision', 'decisionPlayerId', 'initiatingControllerId', 'kind', 'qualifyingCardIds', 'qualifyingCardOwners', 'remainingDecisionPlayerIds', 'sourceCardInstanceId', 'template', 'visibility']);
}

function isExactOpponentCloseToOneQueueEntry(value: unknown): value is PendingOpponentCloseToOne {
  if (!isPlainRecord(value)) return false;
  const keys = Object.keys(value).sort();
  return exactPlayerArray(keys, ['abilityId', 'battlefieldId', 'decisionPlayerId', 'initiatingControllerId', 'qualifyingCardIds', 'qualifyingCardOwners', 'remainingDecisionPlayerIds', 'sourceCardId']) &&
    typeof value.initiatingControllerId === 'string' && value.initiatingControllerId.length > 0 &&
    typeof value.decisionPlayerId === 'string' && value.decisionPlayerId.length > 0 && value.decisionPlayerId !== value.initiatingControllerId &&
    typeof value.sourceCardId === 'string' && value.sourceCardId.length > 0 &&
    typeof value.abilityId === 'string' && value.abilityId.length > 0 &&
    typeof value.battlefieldId === 'string' && value.battlefieldId.length > 0 &&
    isExactFrozenCardIdList(value.qualifyingCardIds) && isExactPlayerOwnerMap(value.qualifyingCardOwners, value.qualifyingCardIds) &&
    isExactNonEmptyPlayerIdList(value.remainingDecisionPlayerIds);
}

function isExactOpponentCloseToOneQueue(s: GameState, value: unknown): value is PendingOpponentCloseToOne[] {
  if (!Array.isArray(value) || value.length < 1) return false;
  let priorSeat = -Infinity;
  const decisionPlayerIds = new Set<string>();
  let first: PendingOpponentCloseToOne | undefined;
  for (const rawEntry of value) {
    if (!isExactOpponentCloseToOneQueueEntry(rawEntry)) return false;
    const entry = rawEntry;
    first ??= entry;
    if (entry.initiatingControllerId !== first.initiatingControllerId || entry.sourceCardId !== first.sourceCardId ||
        entry.abilityId !== first.abilityId || entry.battlefieldId !== first.battlefieldId ||
        decisionPlayerIds.has(entry.decisionPlayerId)) return false;
    const decisionPlayer = s.players.find((candidate) => candidate.id === entry.decisionPlayerId);
    if (!decisionPlayer || decisionPlayer.status !== 'active' || decisionPlayer.locationId !== entry.battlefieldId ||
        decisionPlayer.seat <= priorSeat ||
        !exactFrozenCardIdList(qualifyingOpponentCloseToOneCardIds(s, entry.decisionPlayerId), entry.qualifyingCardIds) ||
        !livePlayerOwnersMatchFrozen(s, entry.qualifyingCardOwners, entry.qualifyingCardIds)) return false;
    priorSeat = decisionPlayer.seat;
    decisionPlayerIds.add(entry.decisionPlayerId);
  }
  const queueDecisionPlayerIds = value.map((entry) => entry.decisionPlayerId);
  if (value.some((entry, index) => !exactPlayerArray(entry.remainingDecisionPlayerIds, queueDecisionPlayerIds.slice(index)))) return false;
  const initiatingController = s.players.find((candidate) => candidate.id === first!.initiatingControllerId);
  return !!initiatingController && initiatingController.status === 'active' && initiatingController.locationId === first!.battlefieldId;
}

function isResidualAttackCardDefinition(cardDefinition: AuthoringCard | undefined): boolean {
  return !!cardDefinition && cardDefinition.abilities.some((ability) =>
    ability.kind === 'residual' && !['discard_at_round_end', 'close_at_round_end'].includes(str(ability.lifecycle?.cleanup)));
}

function qualifyingOpponentCloseToOneCardIds(s: GameState, decisionPlayerId: string): string[] {
  const r = runtime(s);
  return s.cards.filter((candidate) => {
    if (candidate.controllerPlayerId !== decisionPlayerId || candidate.zone !== 'attack_area') return false;
    const cardDefinition = r.pack.cards[candidate.definitionId];
    if (!cardDefinition || isResidualAttackCardDefinition(cardDefinition)) return false;
    const state: unknown = r.cardState[candidate.instanceId];
    if (!isValidOpponentCloseToOneSourceCardState(state)) {
      reject('resolution_failed', 'Malformed opponent close-to-one qualifying card runtime state');
    }
    return state.active === true && state.faceDown === false;
  }).map((candidate) => candidate.instanceId);
}

function stageNextOpponentCloseToOneDecision(s: GameState): void {
  const r = runtime(s);
  if (r.pendingDecision) return;
  const queue: unknown = r.pendingOpponentCloseToOne;
  if (queue === undefined) return;
  if (!Array.isArray(queue)) reject('resolution_failed', 'Corrupt opponent close-to-one queue state');
  if (queue.length === 0) return;
  if (!isExactOpponentCloseToOneQueue(s, queue)) reject('resolution_failed', 'Corrupt or stale opponent close-to-one queue state');
  if (!opponentCloseToOneQueueMatchesServerAuthority(s, queue)) {
    reject('resolution_failed', 'Corrupt or stale opponent close-to-one server authority');
  }
  const pending = queue[0]!;
  const id = nextId(s, 'opponent-close-to-one');
  const target: RuleNode = { id: 'frozen_non_residual_attack_to_keep', type: 'card_instance', count: { min: 1, max: 1 } };
  r.pendingDecision = {
    id, controllerId: pending.decisionPlayerId, target, candidates: [...pending.qualifyingCardIds], min: 1, max: 1,
    context: { controllerId: pending.initiatingControllerId, sourceCardId: pending.sourceCardId, abilityId: pending.abilityId, variables: {}, selections: {} },
    remainingEffects: [],
    interaction: {
      kind: 'opponent_close_non_residual_to_one_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: pending.sourceCardId, abilityId: pending.abilityId, createdRevision: r.revision + 1,
      continuationRef: `${id}:continuation`, initiatingControllerId: pending.initiatingControllerId,
      decisionPlayerId: pending.decisionPlayerId, battlefieldId: pending.battlefieldId, qualifyingCardIds: [...pending.qualifyingCardIds],
      qualifyingCardOwners: { ...pending.qualifyingCardOwners }, remainingDecisionPlayerIds: [...pending.remainingDecisionPlayerIds],
      constraints: { kind: 'target', targetKind: 'card', min: 1, max: 1, distinct: true },
    },
  };
}

function stageOpponentCloseToOne(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAcceptedOpponentCloseToOneAbility(a, 'compiled')) reject('resolution_failed', 'Unsupported opponent close-to-one interaction semantic shape');
  const controller = player(s, ctx.controllerId);
  const source = s.cards.find((candidate) => candidate.instanceId === ctx.sourceCardId);
  const r = runtime(s);
  const sourceState: unknown = source ? r.cardState[source.instanceId] : undefined;
  if (controller.status !== 'active' || !isBattlefield(s, controller.locationId) || !source ||
      !isValidOpponentCloseToOneSourceCardState(sourceState) ||
      source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId || sourceState.faceDown) {
    reject('invalid_state', 'Opponent close-to-one requires a controller-owned source at an active battlefield');
  }
  const battlefieldId = controller.locationId!;
  const existingQueue: unknown = r.pendingOpponentCloseToOne;
  if (existingQueue !== undefined && !Array.isArray(existingQueue)) reject('resolution_failed', 'Corrupt opponent close-to-one queue state');
  if (getOpponentCloseToOneServerAuthority(s)) reject('pending_resolution', 'Opponent close-to-one server authority is already active');
  const queue = r.pendingOpponentCloseToOne ??= [];
  if (queue.length) reject('pending_resolution', 'Opponent close-to-one queue is already active');
  const opponents = s.players.filter((candidate) => candidate.id !== controller.id && candidate.status === 'active' &&
    candidate.locationId === battlefieldId).sort((left, right) => left.seat - right.seat);
  const frozenEntries: Array<Omit<PendingOpponentCloseToOne, 'remainingDecisionPlayerIds'>> = [];
  for (const opponent of opponents) {
    const qualifyingCardIds = qualifyingOpponentCloseToOneCardIds(s, opponent.id);
    if (qualifyingCardIds.length < 2) continue;
    const qualifyingCardOwners = Object.fromEntries(qualifyingCardIds.map((instanceId) =>
      [instanceId, card(s, instanceId).ownerPlayerId]));
    frozenEntries.push({ initiatingControllerId: controller.id, decisionPlayerId: opponent.id, sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId, battlefieldId, qualifyingCardIds, qualifyingCardOwners });
  }
  const frozenDecisionPlayerIds = frozenEntries.map((entry) => entry.decisionPlayerId);
  for (const [index, entry] of frozenEntries.entries()) {
    queue.push({ ...entry, remainingDecisionPlayerIds: frozenDecisionPlayerIds.slice(index) });
  }
  installOpponentCloseToOneServerAuthority(s, queue);
  stageNextOpponentCloseToOneDecision(s);
}

function closeOpponentCardForCloseToOne(s: GameState, decisionPlayerId: string, instanceId: string): void {
  const target = card(s, instanceId);
  const r = runtime(s);
  const cardDefinition = r.pack.cards[target.definitionId];
  const state: unknown = r.cardState[instanceId];
  if (target.controllerPlayerId !== decisionPlayerId || target.zone !== 'attack_area' || !cardDefinition ||
      !isValidOpponentCloseToOneSourceCardState(state) || state.active !== true || state.faceDown !== false ||
      isResidualAttackCardDefinition(cardDefinition) || isCardCloseForbidden(s, instanceId)) {
    reject('resolution_failed', 'Opponent close-to-one target can no longer be closed');
  }
  state.active = false;
  clearTransientCardTransformState(s, instanceId);
  if (['servant_skill', 'master_skill'].includes(cardDefinition.cardType)) {
    target.zone = 'skill';
    target.controllerPlayerId = target.ownerPlayerId;
    target.visibility = { scope: 'owner_only', ownerPlayerId: target.ownerPlayerId };
    state.faceDown = false;
  } else {
    state.faceDown = true;
    target.visibility = { scope: 'owner_only', ownerPlayerId: target.ownerPlayerId };
  }
}


const directResourcePrimitiveTypes = new Set(['adjust_mana', 'adjust_victory_points']);
const fixedControllerResourcePrimitiveTypes = new Set(['adjust_mana', 'adjust_victory_points']);

export function isFixedControllerResourceAdjustmentComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (!fixedControllerResourcePrimitiveTypes.has(str(effect.type))) return false;
  if (effect.player !== undefined && effect.player !== 'controller') return false;
  if (!Number.isSafeInteger(effect.amount)) return false;
  return Object.keys(effect).every((key) => ['type', 'player', 'amount'].includes(key));
}

export function isFixedControllerCommandSealAdjustmentComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (str(effect.type) !== 'adjust_command_seals') return false;
  if (effect.player !== undefined && effect.player !== 'controller') return false;
  if (!Number.isSafeInteger(effect.amount) || Number(effect.amount) === 0) return false;
  if (effect.directive !== undefined && (typeof effect.directive !== 'string' || effect.directive.length === 0)) return false;
  return Object.keys(effect).every((key) => ['type', 'player', 'amount', 'directive'].includes(key));
}

export function isFixedControllerManaSetComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (str(effect.type) !== 'set_mana') return false;
  if (effect.player !== undefined && effect.player !== 'controller') return false;
  if (!Number.isSafeInteger(effect.amount) || Number(effect.amount) < 0) return false;
  return Object.keys(effect).every((key) => ['type', 'player', 'amount'].includes(key));
}

export function isFixedControllerDrawCardsComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (str(effect.type) !== 'draw_cards') return false;
  if (effect.owner !== undefined && effect.owner !== 'controller') return false;
  if (effect.player !== undefined && effect.player !== 'controller') return false;
  if (effect.owner !== undefined && effect.player !== undefined) return false;
  if (!Number.isSafeInteger(effect.count) || Number(effect.count) <= 0) return false;
  return Object.keys(effect).every((key) => ['type', 'owner', 'player', 'count'].includes(key));
}

export function isFixedControllerSourceRemovalComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (str(effect.type) !== 'move_source_card') return false;
  const destination = node(effect.to);
  if (str(destination.zone) !== 'removed_from_game') return false;
  if (destination.owner !== undefined && destination.owner !== 'controller') return false;
  if (!Object.keys(destination).every((key) => ['zone', 'owner'].includes(key))) return false;
  return Object.keys(effect).every((key) => ['type', 'to'].includes(key));
}

function isSourcePlayBasicAttackDrawTriggerCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'on_card_played' &&
    str(a.activation.requiresSourceState) === 'active' &&
    (a.conditions.some((condition) => str(condition.type) === 'played_with_basic_attack') ||
      a.effects.some((effect) => str(effect.type) === 'draw_cards'));
}

export function isSourcePlayBasicAttackDrawTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isSourcePlayBasicAttackDrawTriggerCandidate(a)) return false;
  if (!Object.keys(a.activation).every((key) => ['trigger', 'requiresSourceState'].includes(key))) return false;
  if (a.conditions.length !== 1 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0 || Object.keys(a.visibility).length !== 0) return false;
  const conditionNode = a.conditions[0]!;
  if (str(conditionNode.type) !== 'played_with_basic_attack' || Object.keys(conditionNode).some((key) => key !== 'type')) return false;
  if (a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return isFixedControllerDrawCardsComponent(effect) && Number(effect.count) === 1;
}

function sourcePlayBasicAttackDrawEventScopeMatches(event: AbilityEvent, sourceCardId: string, controllerId: string): boolean {
  if (event.type !== 'on_card_played' || event.sourceCardId !== sourceCardId || event.playerId !== controllerId) return false;
  const playedCards = event.playedCards ?? [];
  const sourcePlayedFaceUp = playedCards.some((played) =>
    played.instanceId === sourceCardId && played.controllerId === controllerId && !played.faceDown);
  const basicCompanion = playedCards.some((played) =>
    played.instanceId !== sourceCardId && played.controllerId === controllerId && played.cardType === 'basic_attack' && !played.faceDown);
  return sourcePlayedFaceUp && basicCompanion;
}

function isDeploymentResourceRewardCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_player_deployed_to_battlefield' &&
    !!str(a.activation.eventLocationId);
}

export function isDeploymentResourceRewardSemantic(a: AuthoringAbility): boolean {
  if (!isDeploymentResourceRewardCandidate(a)) return false;
  if (str(a.activation.phase) || str(a.activation.opens) || str(a.activation.requiresSourceState)) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;
  if (a.effects.length < 1 || a.effects.length > 2) return false;
  return a.effects.every((effect) =>
    isFixedControllerResourceAdjustmentComponent(effect) && Number(effect.amount) > 0);
}

function isResourceNumericTriggerCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_controller_enters_location' &&
    !!str(a.activation.eventLocationId);
}

export function isResourceNumericTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isResourceNumericTriggerCandidate(a)) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;
  if (a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return effect.type === 'adjust_mana' && isFixedControllerResourceAdjustmentComponent(effect);
}

export function isMagicResistancePowerModifierCandidate(a: AuthoringAbility): boolean {
  if (a.kind !== 'phase_action' || a.ruleModifiers.length === 0) return false;
  return a.ruleModifiers.some((modifier) => {
    const scope = node(modifier.scope);
    return str(modifier.type) === 'combat_power_modifier' ||
      (str(modifier.operation) === 'set' && str(modifier.rule) === 'attack.currentPower' &&
        str(scope.controller) === 'engaged_opponents_same_battlefield');
  });
}

export function isMagicResistancePowerModifierSemantic(a: AuthoringAbility): boolean {
  if (!isMagicResistancePowerModifierCandidate(a)) return false;
  if (str(a.activation.phase) !== 'combat' || str(a.activation.opens) !== 'controller_combat_action_window' ||
    str(a.activation.requiresSourceState) !== 'active') return false;
  if (!Object.keys(a.activation).every((key) => ['phase', 'opens', 'requiresSourceState'].includes(key))) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.effects.length !== 0 || a.creates.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || Object.keys(a.limit).length !== 0 || Object.keys(a.visibility).length !== 0) return false;
  if (str(a.responseWindow.opens) ||
    (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') ||
    (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window') ||
    !Object.keys(a.responseWindow).every((key) => ['order', 'passBehavior'].includes(key))) return false;
  if (a.ruleModifiers.length !== 1) return false;

  const modifier = a.ruleModifiers[0]!;
  const scope = node(modifier.scope);
  const constraints = nodes(scope.constraints);
  const modifierLifecycle = node(modifier.lifecycle);
  if (str(modifier.type) !== 'combat_power_modifier' || modifier.operation !== 'set' || modifier.rule !== 'attack.currentPower' ||
    Number(modifier.value) !== 0 || !Number.isFinite(Number(modifier.value))) return false;
  if (str(scope.controller) !== 'engaged_opponents_same_battlefield' || str(scope.object) !== 'attack_card' ||
    !Object.keys(scope).every((key) => ['controller', 'object', 'constraints'].includes(key))) return false;
  if (constraints.length !== 1 || str(constraints[0]!.type) !== 'has_attribute' || str(constraints[0]!.attribute) !== '魔术' ||
    !Object.keys(constraints[0]!).every((key) => ['type', 'attribute'].includes(key))) return false;
  if (str(modifierLifecycle.duration) !== 'this_round' ||
    !Object.keys(modifierLifecycle).every((key) => key === 'duration')) return false;
  return Object.keys(modifier).every((key) =>
    ['id', 'printedClause', 'type', 'operation', 'rule', 'scope', 'value', 'lifecycle'].includes(key));
}

function isBattleLossResourceTriggerCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_controller_loses_battle' &&
    a.effects.length === 1 &&
    str(a.effects[0]?.type) === 'adjust_command_seals';
}

export function isBattleLossResourceTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isBattleLossResourceTriggerCandidate(a)) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;
  if (a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return isFixedControllerCommandSealAdjustmentComponent(effect);
}

function isBattleLossUnpreventableVpTriggerCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_controller_loses_battle' &&
    a.effects.length === 1 &&
    str(a.effects[0]?.type) === 'adjust_victory_points';
}

export function isBattleLossUnpreventableVpTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isBattleLossUnpreventableVpTriggerCandidate(a)) return false;
  if (str(a.activation.phase) || str(a.activation.opens) || str(a.activation.requiresSourceState)) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;

  const effect = a.effects[0]!;
  const effectKeys = Object.keys(effect);
  if (effect.type !== 'adjust_victory_points' || effect.player !== 'controller' || effect.amount !== -5 ||
    effectKeys.some((key) => !['type', 'player', 'amount'].includes(key))) return false;

  if (a.ruleModifiers.length !== 1) return false;
  const modifier = a.ruleModifiers[0]!;
  const scope = node(modifier.scope); const priority = node(modifier.priority);
  if (modifier.operation !== 'ignore' || modifier.rule !== 'effect_prevention' ||
    scope.object !== 'this_effect' || Object.keys(scope).length !== 1 ||
    priority.tier !== 'explicit_exception' || Object.keys(priority).length !== 1) return false;
  return Object.keys(modifier).every((key) => ['id', 'printedClause', 'operation', 'rule', 'scope', 'priority'].includes(key));
}

function isBattleLossServantRevealCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_controller_loses_battle' &&
    a.effects.length === 1 &&
    str(a.effects[0]?.type) === 'reveal_information';
}

export function isBattleLossServantRevealSemantic(a: AuthoringAbility): boolean {
  if (!isBattleLossServantRevealCandidate(a)) return false;
  if (str(a.activation.phase) || str(a.activation.opens) || str(a.activation.requiresSourceState)) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;
  const effect = a.effects[0]!;
  return str(effect.scope) === 'servant_package' && str(effect.subject) === 'controller.servant';
}

function isSharedVictoryVpTriggerCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_battle_result_determined' &&
    a.effects.length === 1 &&
    str(a.effects[0]?.type) === 'adjust_victory_points';
}

function hasSharedVictoryConditions(a: AuthoringAbility): boolean {
  if (a.conditions.length !== 2) return false;
  const hasWon = a.conditions.some((condition) => str(condition.type) === 'controller_won_battle');
  const hasNotSole = a.conditions.some((condition) =>
    str(condition.type) === 'not' && str(node(condition.condition).type) === 'controller_sole_winner');
  return hasWon && hasNotSole;
}

export function isSharedVictoryVpTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isSharedVictoryVpTriggerCandidate(a)) return false;
  if (str(a.activation.phase) !== 'combat' || str(a.activation.opens) !== 'immediate' || str(a.activation.requiresSourceState) !== 'active') return false;
  if (!hasSharedVictoryConditions(a) || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;
  const effect = a.effects[0]!;
  return effect.type === 'adjust_victory_points' &&
    (effect.player === undefined || effect.player === 'controller') &&
    effect.amount === 2 && Number.isSafeInteger(effect.amount);
}

const ALTER_EGO_MUTABLE_ATTRIBUTES = ['力量', '迅捷', '魔术'] as const;
export type AlterEgoTransformVariant = 'regular' | 'ex';

function isExactAlterEgoTransformEffect(effect: RuleNode | undefined): boolean {
  return !!effect && str(effect.type) === 'transform_event_source_card' && Object.keys(effect).every((key) => key === 'type');
}
function isExactCloseSourceEffect(effect: RuleNode | undefined): boolean {
  return !!effect && str(effect.type) === 'close_source_card' && Object.keys(effect).every((key) => key === 'type');
}
function isAlterEgoTransformCandidate(a: AuthoringAbility): boolean {
  return a.effects.some((effect) => str(effect.type) === 'transform_event_source_card');
}
export function classifyAlterEgoTransformVariant(a: AuthoringAbility): AlterEgoTransformVariant | undefined {
  if (!isAlterEgoTransformCandidate(a)) return undefined;
  const activationKeys = Object.keys(a.activation);
  const responseKeys = Object.keys(a.responseWindow);
  if (a.kind !== 'optional_trigger' || str(a.activation.phase) !== 'action' ||
    str(a.activation.trigger) !== 'on_card_played' || str(a.activation.requiresSourceState) !== 'active' ||
    activationKeys.some((key) => !['phase', 'trigger', 'requiresSourceState'].includes(key)) ||
    a.conditions.length !== 0 || a.targets.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0 ||
    Object.keys(a.lifecycle).length !== 0 || Object.keys(a.visibility).length !== 0 ||
    str(a.responseWindow.opens) !== 'on_card_played' || str(a.responseWindow.order) !== 'turn_order' ||
    str(a.responseWindow.passBehavior) !== 'decline_this_window' ||
    responseKeys.some((key) => !['opens', 'order', 'passBehavior'].includes(key)) ||
    !isExactAlterEgoTransformEffect(a.effects[0])) return undefined;

  if (a.effects.length === 2 && isExactCloseSourceEffect(a.effects[1]) && a.cost.length === 0 && Object.keys(a.limit).length === 0) return 'regular';
  const limitKeys = Object.keys(a.limit);
  if (a.effects.length === 1 && isFixedControllerManaCostComponent(a) && Number(a.cost[0]?.amount) === 3 &&
    str(a.limit.type) === 'per_round' && Number(a.limit.uses) === 1 && str(a.limit.scope) === 'this_card' &&
    limitKeys.every((key) => ['type', 'uses', 'scope'].includes(key))) return 'ex';
  return undefined;
}
export function isAlterEgoTransformSemantic(a: AuthoringAbility): boolean {
  return classifyAlterEgoTransformVariant(a) !== undefined;
}

function alterEgoTriggerTarget(s: GameState, sourceCardId: string, event: AbilityEvent | undefined): CardInstance | undefined {
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  if (!source || !event || event.type !== 'on_card_played' || event.playerId !== source.controllerPlayerId ||
    !event.sourceCardId || event.sourceCardId === sourceCardId) return undefined;
  const played = event.playedCards?.find((candidate) =>
    candidate.instanceId === event.sourceCardId && candidate.controllerId === source.controllerPlayerId && !candidate.faceDown);
  if (!played) return undefined;
  const target = s.cards.find((candidate) => candidate.instanceId === event.sourceCardId);
  const targetState = target ? runtime(s).cardState[target.instanceId] : undefined;
  if (!target || target.controllerPlayerId !== source.controllerPlayerId || target.zone !== 'attack_area' ||
    !targetState?.active || targetState.faceDown || targetState.playedRound !== s.round.roundNumber ||
    !runtime(s).pack.cards[target.definitionId]) return undefined;
  return target;
}

function alterEgoSourceSettlementError(s: GameState, ctx: EffectContext, a: AuthoringAbility): string | undefined {
  const variant = classifyAlterEgoTransformVariant(a);
  if (!variant) return 'Unsupported Alter Ego transform semantic shape.';
  if (!active(s, ctx.sourceCardId)) return 'Alter Ego source must remain active and face up.';
  if (!alterEgoTriggerTarget(s, ctx.sourceCardId, ctx.event)) return 'Trusted just-played Alter Ego target is no longer valid.';
  if (variant === 'ex') {
    if (abilityLimitReached(s, ctx.sourceCardId, a)) return 'Alter Ego EX was already used this round.';
    if (!hasAvailableManaForFixedCosts(s, ctx, a)) return 'Insufficient mana for Alter Ego EX.';
  } else {
    const closeError = closeSourceStateError(s, ctx.sourceCardId, ctx.controllerId);
    if (closeError) return closeError;
  }
  return undefined;
}

function applyAlterEgoTransform(s: GameState, ctx: EffectContext, a: AuthoringAbility, attributes?: string[]): void {
  const variant = classifyAlterEgoTransformVariant(a);
  const settlementError = alterEgoSourceSettlementError(s, ctx, a);
  if (!variant || settlementError) reject('resolution_failed', settlementError ?? 'Unsupported Alter Ego transform semantic shape.');
  let target = alterEgoTriggerTarget(s, ctx.sourceCardId, ctx.event)!;
  let targetDefinition = runtime(s).pack.cards[target.definitionId]!;
  const hasReversalEffect = targetDefinition.cardFace.hasReversalEffect === true;
  if (hasReversalEffect) {
    if (attributes !== undefined && attributes.length !== 0) reject('illegal_target', 'Reversal targets do not accept attribute selections.');
  } else if (!Array.isArray(attributes) || attributes.length > 3 || new Set(attributes).size !== attributes.length ||
    attributes.some((attribute) => !(ALTER_EGO_MUTABLE_ATTRIBUTES as readonly string[]).includes(attribute))) {
    reject('illegal_target', 'Alter Ego attributes must be a distinct subset of the mutable attribute domain.');
  }

  if (variant === 'ex') {
    executeFixedControllerManaCost(s, ctx, a);
    const usageKey = `${ctx.sourceCardId}:${a.id}:round:${s.round.roundNumber}`;
    runtime(s).abilityUsage[usageKey] = (runtime(s).abilityUsage[usageKey] ?? 0) + 1;
    // Resolution data-flow replaces the working state atomically; reacquire the authoritative physical target after payment.
    target = alterEgoTriggerTarget(s, ctx.sourceCardId, ctx.event)!;
    targetDefinition = runtime(s).pack.cards[target.definitionId]!;
  }
  const targetState = runtime(s).cardState[target.instanceId]!;
  if (hasReversalEffect) {
    targetState.reversed = true;
    delete targetState.attributeOverrides;
    if (targetDefinition.cardFace.revealsTrueNameOnReverse === true) reveal(s, ctx.controllerId);
  } else {
    targetState.attributeOverrides = [...attributes!];
    delete targetState.reversed;
  }
  runtime(s).events.push({
    type: hasReversalEffect ? 'card_reversed' : 'card_attributes_overridden',
    playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, cardInstanceId: target.instanceId,
  });
  if (variant === 'regular') executeResolutionEffects(s, ctx, [a.effects[1]!]);
}

function stageAlterEgoAttributeChoice(s: GameState, ctx: EffectContext, a: AuthoringAbility, target: CardInstance): void {
  const variant = classifyAlterEgoTransformVariant(a);
  if (!variant) reject('resolution_failed', 'Unsupported Alter Ego transform semantic shape.');
  const id = nextId(s, 'interaction');
  const targetNode: RuleNode = {
    id: 'alter_ego_attributes', type: 'choice',
    options: ALTER_EGO_MUTABLE_ATTRIBUTES.map((attribute) => ({ id: attribute })), count: { min: 0, max: 3 },
  };
  runtime(s).pendingDecision = {
    id, controllerId: ctx.controllerId, target: targetNode, candidates: [...ALTER_EGO_MUTABLE_ATTRIBUTES], min: 0, max: 3,
    context: structuredClone(ctx), remainingEffects: [],
    interaction: {
      kind: 'alter_ego_attribute_choice_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1,
      continuationRef: `${id}:continuation`, triggerEventId: ctx.event!.id, targetCardInstanceId: target.instanceId, variant,
      constraints: { kind: 'target', targetKind: 'attribute', min: 0, max: 3, distinct: true },
    },
  };
}

function resolveAlterEgoTransformResponse(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const settlementError = alterEgoSourceSettlementError(s, ctx, a);
  if (settlementError) reject('resolution_failed', settlementError);
  const target = alterEgoTriggerTarget(s, ctx.sourceCardId, ctx.event)!;
  const targetDefinition = runtime(s).pack.cards[target.definitionId]!;
  if (targetDefinition.cardFace.hasReversalEffect === true) applyAlterEgoTransform(s, ctx, a);
  else stageAlterEgoAttributeChoice(s, ctx, a, target);
}

function isPresenceConcealmentAssassinationCandidate(a: AuthoringAbility): boolean {
  return (a.kind === 'optional_trigger' && str(a.activation.trigger) === 'after_battle_power_calculated') ||
    a.effects.some((effect) => str(effect.type) === 'defeat_highest_power_opponents');
}

export function isPresenceConcealmentAssassinationSemantic(a: AuthoringAbility): boolean {
  if (!isPresenceConcealmentAssassinationCandidate(a)) return false;
  const activationKeys = Object.keys(a.activation);
  const responseKeys = Object.keys(a.responseWindow);
  const limitKeys = Object.keys(a.limit);
  return a.kind === 'optional_trigger' &&
    str(a.activation.phase) === 'combat' &&
    str(a.activation.trigger) === 'after_battle_power_calculated' &&
    str(a.activation.requiresSourceState) === 'active' &&
    activationKeys.every((key) => ['phase', 'trigger', 'requiresSourceState'].includes(key)) &&
    a.conditions.length === 1 && str(a.conditions[0]!.type) === 'controller_strict_second_battle_power' &&
    Object.keys(a.conditions[0]!).every((key) => key === 'type') &&
    a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 && a.ruleModifiers.length === 0 &&
    Object.keys(a.lifecycle).length === 0 && Object.keys(a.visibility).length === 0 &&
    a.effects.length === 1 && str(a.effects[0]!.type) === 'defeat_highest_power_opponents' &&
    Object.keys(a.effects[0]!).every((key) => key === 'type') &&
    str(a.responseWindow.opens) === 'post_power_response' &&
    str(a.responseWindow.order) === 'turn_order' &&
    str(a.responseWindow.passBehavior) === 'decline_this_window' &&
    responseKeys.every((key) => ['opens', 'order', 'passBehavior'].includes(key)) &&
    str(a.limit.type) === 'per_round' && Number(a.limit.uses) === 1 && str(a.limit.scope) === 'this_card' &&
    limitKeys.every((key) => ['type', 'uses', 'scope'].includes(key));
}

function isOptionalBattleResultVpTriggerCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'optional_trigger' &&
    str(a.activation.phase) === 'combat' &&
    str(a.activation.trigger) === 'after_battle_result_determined' &&
    a.conditions.some((condition) => str(condition.type) === 'controller_played_highest_cost_noble_phantasm_in_battle_this_round') &&
    a.effects.some((effect) => str(effect.type) === 'adjust_victory_points');
}

function hasExactOptionalBattleResultVpActivation(a: AuthoringAbility): boolean {
  const responseKeys = Object.keys(a.responseWindow);
  return !str(a.activation.opens) &&
    !str(a.activation.requiresSourceState) &&
    str(a.responseWindow.opens) === 'after_battle_result_determined' &&
    (!str(a.responseWindow.order) || str(a.responseWindow.order) === 'turn_order') &&
    (!str(a.responseWindow.passBehavior) || str(a.responseWindow.passBehavior) === 'decline_this_window') &&
    responseKeys.every((key) => ['opens', 'order', 'passBehavior'].includes(key));
}

export function isOptionalBattleResultExtraVpTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isOptionalBattleResultVpTriggerCandidate(a) || !hasExactOptionalBattleResultVpActivation(a)) return false;
  if (a.conditions.length !== 2 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || Object.keys(a.limit).length !== 0 || a.effects.length !== 1) return false;
  const hasHighest = a.conditions.some((condition) => str(condition.type) === 'controller_played_highest_cost_noble_phantasm_in_battle_this_round');
  const hasThreshold = a.conditions.some((condition) =>
    str(condition.type) === 'highest_cost_noble_phantasm_cost_at_least' && Number(condition.value) === 4);
  const effect = a.effects[0]!;
  return hasHighest && hasThreshold &&
    effect.type === 'adjust_victory_points' &&
    (effect.player === undefined || effect.player === 'controller') &&
    effect.amount === 1 && Number.isSafeInteger(effect.amount);
}

export function isOptionalBattleResultVpTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isOptionalBattleResultVpTriggerCandidate(a) || !hasExactOptionalBattleResultVpActivation(a)) return false;
  if (a.conditions.length !== 1 || str(a.conditions[0]?.type) !== 'controller_played_highest_cost_noble_phantasm_in_battle_this_round') return false;
  if (a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || Object.keys(a.limit).length !== 0 || a.effects.length !== 1) return false;
  const effect = a.effects[0]!;
  return effect.type === 'adjust_victory_points' &&
    (effect.player === undefined || effect.player === 'controller') &&
    effect.amount === 1 && Number.isSafeInteger(effect.amount);
}

function isUniqueWinCreateCardTriggerCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'optional_trigger' &&
    a.activation.trigger === 'after_controller_wins_battle' &&
    a.conditions.some((condition) => str(condition.type) === 'source_card_in_zone') &&
    a.cost.some((cost) => str(cost.type) === 'move_source_card') &&
    a.creates.some((create) => str(create.type) === 'create_card');
}

export function isUniqueWinCreateCardTriggerSemantic(a: AuthoringAbility): boolean {
  if (!isUniqueWinCreateCardTriggerCandidate(a)) return false;
  if (str(a.activation.opens) !== 'post_battle_optional_trigger_window') return false;
  const response = node(a.responseWindow);
  const eligible = Array.isArray(response.eligiblePlayers) ? response.eligiblePlayers : [];
  if (str(response.opens) !== 'post_battle_optional_trigger_window' ||
    eligible.length !== 1 || eligible[0] !== 'controller' ||
    (response.order !== undefined && response.order !== 'turn_order') ||
    (response.passBehavior !== undefined && response.passBehavior !== 'decline_this_window') ||
    (response.passDefault !== undefined && response.passDefault !== 'decline_this_window')) return false;

  const limit = node(a.limit);
  if (limit.type !== 'unique' || limit.scope !== 'unique_keyword_group' ||
    !str(limit.groupId) || limit.window !== 'trigger_window' ||
    limit.conflictPolicy !== 'only_one_effect_may_activate_per_window') return false;

  if (nodes(a.conditions).length !== 1 || nodes(a.targets).length !== 0 || nodes(a.effects).length !== 0 ||
    nodes(a.cost).length !== 1 || nodes(a.creates).length !== 1 || nodes(a.ruleModifiers).length !== 0 || Object.keys(node(a.lifecycle)).length !== 0) return false;
  const conditionNode = a.conditions[0]!;
  if (conditionNode.type !== 'source_card_in_zone' || conditionNode.zone !== 'hand' || conditionNode.owner !== 'controller') return false;

  const cost = a.cost[0]!;
  const from = node(cost.from); const to = node(cost.to);
  if (cost.type !== 'move_source_card' || from.zone !== 'hand' || from.owner !== 'controller' ||
    to.zone !== 'removed_from_game' || to.owner !== 'controller') return false;

  const create = a.creates[0]!;
  const destination = node(create.to); const then = nodes(create.then);
  return create.type === 'create_card' && !!str(create.cardId) &&
    destination.zone === 'deck' && destination.owner === 'controller' &&
    then.length === 1 && then[0]?.type === 'shuffle_deck' && then[0]?.owner === 'controller';
}

/** Backward-compatible B20 test/export alias; routing is the generic structural family above. */
export const isUniqueLuckOnBattleWinSemantic = isUniqueWinCreateCardTriggerSemantic;

function isBattleEndMobilePlayersRewardCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_battle_ended' &&
    a.effects.length === 1 &&
    str(a.effects[0]?.type) === 'record_master_directive';
}

export function isBattleEndMobilePlayersRewardSemantic(a: AuthoringAbility): boolean {
  if (!isBattleEndMobilePlayersRewardCandidate(a)) return false;
  if (str(a.activation.phase) || str(a.activation.opens) || str(a.activation.requiresSourceState)) return false;
  if (a.conditions.length || a.targets.length || a.cost.length || a.creates.length || a.ruleModifiers.length) return false;
  if (Object.keys(a.lifecycle).length || str(a.responseWindow.opens) || Object.keys(a.limit).length) return false;
  const effect = a.effects[0]!;
  if (effect.type !== 'record_master_directive' || str(effect.directive) !== 'gatou_battle_end_mobile_players_reward') return false;
  return Object.keys(effect).every((key) => ['type', 'directive', 'id', 'printedClause'].includes(key));
}

function currentRoundMovementLogs(s: GameState): Array<{ playerId: string; to: string }> {
  let boundary = 0;
  for (let index = s.log.length - 1; index >= 0; index -= 1) {
    const entry = s.log[index]!;
    if (entry.type === 'phase_transition' && entry.message.endsWith('-> round_start')) {
      boundary = index + 1;
      break;
    }
  }
  const results: Array<{ playerId: string; to: string }> = [];
  for (const entry of s.log.slice(boundary)) {
    if (entry.type !== 'movement') continue;
    const payload = entry.payload ?? {};
    const payloadRound = typeof payload.roundNumber === 'number' ? payload.roundNumber : undefined;
    if (payloadRound !== undefined && payloadRound !== s.round.roundNumber) continue;
    const playerId = typeof payload.playerId === 'string' ? payload.playerId : '';
    const to = typeof payload.to === 'string' ? payload.to : '';
    if (playerId && to) results.push({ playerId, to });
  }
  return results;
}

function settleBattleEndMobilePlayersReward(s: GameState, ctx: EffectContext): void {
  const event = ctx.event;
  if (!event || event.type !== 'after_battle_ended' || !event.battlePhaseResolutionId || !Array.isArray(event.battleOutcomes)) {
    reject('resolution_failed', 'Battle-end mobile-player reward requires frozen terminal battle provenance');
  }
  if (!event.battleParticipantIds?.includes(ctx.controllerId)) {
    reject('resolution_failed', 'Battle-end mobile-player reward controller must be a frozen battle participant');
  }
  const controller = player(s, ctx.controllerId);
  const locationId = controller.locationId;
  if (!locationId) reject('resolution_failed', 'Battle-end mobile-player reward controller has no current location');

  const movedIntoLocation = new Set(currentRoundMovementLogs(s)
    .filter((movement) => movement.playerId !== ctx.controllerId && movement.to === locationId)
    .map((movement) => movement.playerId));
  const qualifyingPlayerIds = s.players
    .filter((candidate) => candidate.id !== ctx.controllerId && candidate.locationId === locationId && movedIntoLocation.has(candidate.id))
    .map((candidate) => candidate.id);
  const outcome = event.battleOutcomes.find((candidate) => candidate.battlefieldId === locationId);
  const won = outcome?.winnerPlayerIds.includes(ctx.controllerId) === true;
  const rewardBranch = won ? 'victory_points' as const : 'mana' as const;
  const requestedDelta = qualifyingPlayerIds.length;
  const before = won ? controller.vp : controller.mana;

  if (requestedDelta > 0) {
    const synthetic: RuleNode = won
      ? { id: 'battle-end-mobile-player-vp', type: 'adjust_victory_points', player: 'controller', amount: requestedDelta }
      : { id: 'battle-end-mobile-player-mana', type: 'adjust_mana', player: 'controller', amount: requestedDelta };
    const normalized = normalizeResolutionDataFlowNodes([synthetic], `cards.${ctx.sourceCardId}.abilities.${ctx.abilityId}.terminalReward`);
    const result = executeResolution({
      state: s,
      controllerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      effects: normalized,
      selections: {},
      resolutionId: `${event.id}:${ctx.sourceCardId}:${ctx.abilityId}`,
      causationId: event.id,
    });
    Object.assign(s, result.nextState);
    runtime(s).events.push(...result.emittedEvents);
  }

  const afterController = player(s, ctx.controllerId);
  const after = won ? afterController.vp : afterController.mana;
  runtime(s).events.push({
    type: 'battle_end_mobile_players_reward_settled',
    playerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId,
    resource: rewardBranch,
    requestedDelta,
    delta: after - before,
    before,
    after,
    qualifyingPlayerIds,
    battlePhaseResolutionId: event.battlePhaseResolutionId,
    battlefieldId: locationId,
    rewardBranch,
  });
}

function isBattleLossStateTransformCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_controller_loses_battle' &&
    a.effects.length === 1 &&
    str(a.effects[0]?.type) === 'transform_to_return_silence_on_loss';
}

export function isBattleLossStateTransformSemantic(a: AuthoringAbility): boolean {
  if (!isBattleLossStateTransformCandidate(a)) return false;
  if (Object.keys(a.activation).some((key) => key !== 'trigger')) return false;
  if (a.conditions.length || a.targets.length || a.cost.length || a.creates.length || a.ruleModifiers.length) return false;
  if (Object.keys(a.lifecycle).length || str(a.responseWindow.opens) || Object.keys(a.limit).length) return false;
  const responseKeys = Object.keys(a.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') ||
    (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window')) return false;
  const effect = a.effects[0]!;
  return effect.type === 'transform_to_return_silence_on_loss' &&
    Object.keys(effect).every((key) => ['type', 'id', 'printedClause'].includes(key));
}

function transformedReturnSilenceSourceIds(s: GameState): string[] {
  const r = runtime(s);
  r.transformedReturnSilenceSourceCardIds ??= [];
  return r.transformedReturnSilenceSourceCardIds;
}

function battleLossStateTransformTriggerEligible(s: GameState, sourceId: string): boolean {
  return active(s, sourceId) && !(runtime(s).transformedReturnSilenceSourceCardIds ?? []).includes(sourceId);
}

function clearReturnSilenceTransformForSource(s: GameState, sourceId: string): void {
  const r = runtime(s);
  if (!r.transformedReturnSilenceSourceCardIds?.includes(sourceId)) return;
  const source = card(s, sourceId);
  r.transformedReturnSilenceSourceCardIds = r.transformedReturnSilenceSourceCardIds.filter((id) => id !== sourceId);
  const controllerId = source.controllerPlayerId;
  const hasOtherLiveSource = r.transformedReturnSilenceSourceCardIds.some((id) => {
    const candidate = s.cards.find((entry) => entry.instanceId === id);
    const state = r.cardState[id];
    return candidate?.controllerPlayerId === controllerId &&
      ['field', 'attack_area'].includes(candidate.zone) && state?.active === true && state.faceDown !== true;
  });
  if (!hasOtherLiveSource && s.ruleOverrides?.mustDeployToBattlefieldPlayerIds) {
    s.ruleOverrides.mustDeployToBattlefieldPlayerIds = s.ruleOverrides.mustDeployToBattlefieldPlayerIds.filter((id) => id !== controllerId);
  }
}

function settleBattleLossStateTransform(s: GameState, ctx: EffectContext): void {
  const event = ctx.event;
  if (!event || event.type !== 'after_controller_loses_battle' || event.playerId !== ctx.controllerId ||
    !event.battlePhaseResolutionId || !event.battleId || !event.resultId || !event.battlefieldId ||
    !event.battleParticipantIds?.includes(ctx.controllerId) || !event.battleResult?.loserIds.includes(ctx.controllerId)) {
    reject('resolution_failed', 'Battle-loss state transform requires authoritative losing-participant provenance');
  }
  if (!active(s, ctx.sourceCardId)) {
    reject('resolution_failed', 'Battle-loss state transform source must be face-up and active');
  }
  const transformed = transformedReturnSilenceSourceIds(s);
  if (transformed.includes(ctx.sourceCardId)) return;

  const r = runtime(s);
  r.ongoingEffects = r.ongoingEffects.filter((ongoing) => !(
    ongoing.sourceCardId === ctx.sourceCardId &&
    ongoing.controllerId === ctx.controllerId &&
    ongoing.ruleModifiers.some((modifier) => str(modifier.definition.id) === 'soul_drag_power_bonus')
  ));
  transformed.push(ctx.sourceCardId);
  s.ruleOverrides ??= {};
  s.ruleOverrides.mustDeployToBattlefieldPlayerIds = [...new Set([
    ...(s.ruleOverrides.mustDeployToBattlefieldPlayerIds ?? []),
    ctx.controllerId,
  ])];
  r.events.push({
    type: 'battle_loss_state_transformed',
    playerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId,
    triggerEventId: event.id,
    battlePhaseResolutionId: event.battlePhaseResolutionId,
    battleId: event.battleId,
    resultId: event.resultId,
    battlefieldId: event.battlefieldId,
    fromState: 'soul_drag',
    toState: 'return_silence',
  });
}

function isBattleEndSourceReturnCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' &&
    str(a.activation.trigger) === 'after_battle_ended' &&
    a.effects.length === 1 &&
    str(a.effects[0]?.type) === 'move_card';
}

function battleEndSourceReturnTriggerEligible(s: GameState, sourceId: string): boolean {
  const source = card(s, sourceId);
  const sourceState = runtime(s).cardState[sourceId];
  return ['field', 'attack_area'].includes(source.zone) && !!sourceState?.active && !sourceState.faceDown;
}

export function isBattleEndSourceReturnSemantic(a: AuthoringAbility): boolean {
  if (!isBattleEndSourceReturnCandidate(a)) return false;
  if (str(a.activation.phase) !== 'combat' || str(a.activation.opens) || str(a.activation.requiresSourceState)) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;
  const effect = a.effects[0]!;
  const destination = node(effect.to);
  return effect.type === 'move_card' &&
    str(effect.target) === 'this_card' &&
    str(destination.zone) === 'skill' &&
    (destination.owner === undefined || destination.owner === 'controller');
}

export function isAnyLocationExceptWorkshopMovementCandidate(a: AuthoringAbility): boolean {
  if (a.kind !== 'phase_action' || str(a.activation.phase) !== 'action' ||
    str(a.activation.opens) !== 'controller_action_window' || a.targets.length !== 1) return false;
  const target = a.targets[0]!;
  const constraints = nodes(target.constraints);
  return target.type === 'location' &&
    a.effects.some((effect) => effect.type === 'move_player') &&
    constraints.some((constraint) => constraint.type === 'any_enabled_location' ||
      (constraint.type === 'not_location_kind' && constraint.locationKind === 'workshop'));
}

export function isAnyLocationExceptWorkshopMovementSemantic(a: AuthoringAbility): boolean {
  if (!isAnyLocationExceptWorkshopMovementCandidate(a)) return false;
  if (a.activation.requiresSourceState !== 'active' || a.conditions.length !== 0 || a.cost.length !== 0 ||
    a.creates.length !== 0 || a.ruleModifiers.length !== 0 || Object.keys(a.lifecycle).length !== 0 ||
    str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0 || Object.keys(a.visibility).length !== 0 ||
    a.effects.length !== 1) return false;
  const target = a.targets[0]!;
  const count = node(target.count);
  const constraints = nodes(target.constraints);
  const effect = a.effects[0]!;
  const anyEnabled = constraints.filter((constraint) => constraint.type === 'any_enabled_location');
  const notWorkshop = constraints.filter((constraint) => constraint.type === 'not_location_kind' && constraint.locationKind === 'workshop');
  return Number(count.min) === 1 && Number(count.max) === 1 &&
    constraints.length === 2 && anyEnabled.length === 1 && notWorkshop.length === 1 &&
    nodes(target.conditions).length === 0 &&
    effect.type === 'move_player' && str(effect.to) === str(target.id) &&
    (effect.player === undefined || effect.player === 'controller');
}

export function isResourceNumericDirectActionSemantic(a: AuthoringAbility): boolean {
  return a.kind === 'phase_action' &&
    str(a.activation.phase) === 'action' &&
    str(a.activation.opens) === 'controller_action_window' &&
    a.targets.length === 0 &&
    a.cost.length === 0 &&
    a.creates.length === 0 &&
    a.effects.length > 0 &&
    a.effects.every((effect) =>
      directResourcePrimitiveTypes.has(str(effect.type)) ||
      isFixedControllerCommandSealAdjustmentComponent(effect));
}

export function isCardZoneCoreDirectActionSemantic(a: AuthoringAbility): boolean {
  return isMoveAllRemainingManaBindingSemantic(a);
}

export function isPlayActionDirectAction(a: AuthoringAbility): boolean {
  return isPlayActionRouteCandidate(a);
}

export function isPlaySourceCardWithCostResponse(a: AuthoringAbility): boolean {
  return isPlaySourceCardWithCostResponseRouteCandidate(a);
}

function isPlayActionRouteCandidate(a: AuthoringAbility): boolean {
  if (!isPlayActionStructuralCandidate(a)) return false;
  const [play, draw] = a.effects;
  return str(play?.face) === 'face_down' &&
    Number(draw?.count) === 1 &&
    hasSingleControllerHandAttackTarget(a.targets, str(play?.target));
}

function isPlayActionStructuralCandidate(a: AuthoringAbility): boolean {
  if (a.kind !== 'phase_action' || str(a.activation.phase) !== 'action' || str(a.activation.opens) !== 'controller_action_window') return false;
  if (a.targets.length !== 1 || a.cost.length || a.creates.length || a.effects.length !== 2) return false;
  const [play, draw] = a.effects;
  return str(play?.type) === 'play_selected_cards' &&
    typeof play?.target === 'string' &&
    str(draw?.type) === 'draw_cards';
}

function isPlaySourceCardWithCostResponseRouteCandidate(a: AuthoringAbility): boolean {
  return isPlaySourceCardWithCostResponseStructuralCandidate(a) && str(a.effects[0]?.face) === 'face_up';
}

function isPlaySourceCardWithCostResponseStructuralCandidate(a: AuthoringAbility): boolean {
  if (a.kind !== 'response' || str(a.activation.trigger) !== 'controller_combat_action_window') return false;
  if (str(a.responseWindow.opens) !== 'controller_combat_action_window') return false;
  if (a.targets.length || a.creates.length || a.effects.length !== 1) return false;
  return hasFixedManaCost(a.cost, 2) && str(a.effects[0]?.type) === 'play_source_card';
}

function isCardZoneCoreDirectActionRouteCandidate(a: AuthoringAbility): boolean {
  if (a.kind !== 'phase_action' || str(a.activation.phase) !== 'advance' || str(a.activation.opens) !== 'controller_action_window') return false;
  if (a.targets.length || a.cost.length || a.creates.length || a.effects.length !== 2) return false;
  const [move, mana] = a.effects;
  const binding = str(move?.resultVar ?? move?.bind);
  return str(move?.type) === 'move_all_remaining' &&
    !!binding &&
    str(mana?.type) === 'adjust_mana' &&
    referencesMovedCountBinding(mana?.amount, binding);
}


function isFixedControllerAdvanceDrawActionCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'phase_action' &&
    str(a.activation.phase) === 'advance' &&
    str(a.activation.opens) === 'controller_action_window' &&
    a.cost.length === 1 && str(a.cost[0]?.type) === 'pay_mana' &&
    a.effects.length === 1 && str(a.effects[0]?.type) === 'draw_cards';
}

export function isFixedControllerAdvanceDrawActionSemantic(a: AuthoringAbility): boolean {
  if (!isFixedControllerAdvanceDrawActionCandidate(a)) return false;
  if (str(a.activation.requiresSourceState) || str(a.activation.trigger)) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (Object.keys(a.lifecycle).length !== 0 || str(a.responseWindow.opens) || Object.keys(a.limit).length !== 0) return false;
  return isFixedControllerManaCostComponent(a) && Number(a.cost[0]?.amount) === 1 &&
    isFixedControllerDrawCardsComponent(a.effects[0]!) && Number(a.effects[0]?.count) === 2;
}

export function isActivateCardByIdTrigger(a: AuthoringAbility): boolean {
  if (a.kind !== 'forced_trigger' || str(a.activation.trigger) !== 'after_controller_first_loses_battle') return false;
  if (a.conditions.length || a.targets.length || a.cost.length || a.creates.length || a.effects.length !== 1) return false;
  const [effect] = a.effects;
  return str(effect?.type) === 'activate_card_by_id' && typeof effect?.definitionId === 'string' && effect.definitionId.length > 0;
}

export function isCloseSourceCardOnPlayedTrigger(a: AuthoringAbility): boolean {
  if (a.kind !== 'residual' || str(a.activation.trigger) !== 'on_card_played' || str(a.activation.opens) !== 'immediate') return false;
  if (a.conditions.length !== 2 || a.targets.length || a.cost.length || a.creates.length || a.effects.length !== 1) return false;
  if (str(a.effects[0]?.type) !== 'close_source_card') return false;
  const sourceZone = a.conditions.some((condition) => str(condition.type) === 'source_card_in_zone' && str(condition.zone) === 'field');
  const noblePlay = a.conditions.some((condition) => str(condition.type) === 'event_played_card_has_attribute' && str(condition.attribute) === '宝具');
  return sourceZone && noblePlay;
}

function closeSourceStateError(s: GameState, sourceCardId: string, controllerId: string): string | undefined {
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  if (!source) return 'Close source card is missing.';
  if (source.controllerPlayerId !== controllerId) return 'Close source card is not controlled by the ability controller.';
  if (!['field', 'attack_area'].includes(source.zone)) return 'Close source card must be active on the board.';
  if (!runtime(s).pack.cards[source.definitionId]) return 'Close source card has no compiled definition.';
  const state = runtime(s).cardState[source.instanceId];
  if (!state?.active) return 'Close source card is not active.';
  if (state.faceDown) return 'Close source card must be face up.';
  return undefined;
}

function assertCloseSourceState(s: GameState, sourceCardId: string, controllerId: string): void {
  const error = closeSourceStateError(s, sourceCardId, controllerId);
  if (error) reject('resolution_failed', error);
}

export function isAddToAttackDirectAction(a: AuthoringAbility): boolean {
  return isAddToAttackSemantic(a);
}

function isAddToAttackRouteCandidate(a: AuthoringAbility): boolean {
  return isAddToAttackStructuralCandidate(a) &&
    hasNotControllerAtBattlefieldCondition(a);
}

function isAddToAttackStructuralCandidate(a: AuthoringAbility): boolean {
  if (a.kind !== 'phase_action' || str(a.activation.phase) !== 'advance' || str(a.activation.opens) !== 'controller_action_window') return false;
  if (a.targets.length !== 1 || a.cost.length !== 1 || a.creates.length || a.effects.length !== 1) return false;
  const [effect] = a.effects;
  return str(effect?.type) === 'attach_card_to_player_attack' &&
    typeof effect?.cardId === 'string' &&
    typeof effect?.target === 'string' &&
    hasFixedManaCost(a.cost, 2) &&
    hasSingleNonControllerPlayerTarget(a.targets, str(effect.target));
}

function isAddToAttackSemantic(a: AuthoringAbility): boolean {
  if (!isAddToAttackRouteCandidate(a)) return false;
  const [effect] = a.effects;
  return effect?.returnAtRoundEnd === true &&
    str(effect?.controllerCannotWinStatus) === 'maiya_cannot_win_battle_this_round';
}

function isMoveAllRemainingManaBindingSemantic(a: AuthoringAbility): boolean {
  if (a.kind !== 'phase_action' || str(a.activation.phase) !== 'advance' || str(a.activation.opens) !== 'controller_action_window') return false;
  if (a.targets.length || a.cost.length || a.creates.length || a.effects.length !== 2) return false;
  const [move, mana] = a.effects;
  const binding = str(move?.resultVar ?? move?.bind);
  return str(move?.type) === 'move_all_remaining' &&
    str(move?.from) === 'hand' &&
    str(node(move?.to).zone) === 'discard' &&
    !!binding &&
    str(mana?.type) === 'adjust_mana' &&
    referencesMovedCountBinding(mana?.amount, binding);
}

function hasSingleControllerHandAttackTarget(targets: RuleNode[], targetId: string): boolean {
  const target = targets.find((candidate) => str(candidate.id) === targetId);
  if (!target || str(target.type) !== 'card_instance') return false;
  const scope = node(target.scope);
  const count = node(target.count);
  return str(scope.zone) === 'hand' &&
    str(scope.owner) === 'controller' &&
    Number(count.min ?? 1) === 1 &&
    Number(count.max ?? 1) === 1 &&
    nodes(target.constraints).some((constraint) => str(constraint.type) === 'is_attack');
}

function hasPlayableSourceCardInHand(s: GameState, ctx: EffectContext): boolean {
  const source = s.cards.find((candidate) => candidate.instanceId === ctx.sourceCardId);
  return !!source && source.controllerPlayerId === ctx.controllerId && source.zone === 'hand';
}

function hasAvailableManaForFixedCosts(s: GameState, ctx: EffectContext, a: AuthoringAbility): boolean {
  const abilityCost = a.cost
    .filter((cost) => str(cost.type) === 'pay_mana')
    .reduce((sum, cost) => sum + Number(cost.amount ?? 0), 0);
  const sourcePlay = a.effects.find((effect) => str(effect.type) === 'play_source_card');
  const printedPlayCost = sourcePlay && str(sourcePlay.face) !== 'face_down'
    ? Number(definition(s, ctx.sourceCardId)?.cardFace.cost ?? 0)
    : 0;
  const total = abilityCost + printedPlayCost;
  return Number.isSafeInteger(total) && player(s, ctx.controllerId).mana >= total;
}

function hasMandatoryTargetAvailability(s: GameState, ctx: EffectContext, a: AuthoringAbility): boolean {
  for (const target of a.targets) {
    const count = node(target.count);
    const min = Number(count.min ?? 1);
    if (min > 0 && candidates(s, ctx, target).length < min) return false;
  }
  return true;
}

function containsEffectLevelOptionalCost(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsEffectLevelOptionalCost);
  if (!value || typeof value !== 'object') return false;
  const current = value as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(current, 'optionalCost')) return true;
  return Object.values(current).some(containsEffectLevelOptionalCost);
}

export function isFixedControllerManaCostComponent(a: AuthoringAbility): boolean {
  if (a.cost.length !== 1 || str(a.cost[0]?.type) !== 'pay_mana') return false;
  const cost = a.cost[0]!;
  if (cost.player !== undefined && cost.player !== 'controller') return false;
  if (containsEffectLevelOptionalCost([...a.effects, ...a.creates])) return false;
  const amount = cost.amount;
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount > 0;
}

function usesAcceptedFixedControllerManaCostComponent(a: AuthoringAbility): boolean {
  if (!isFixedControllerManaCostComponent(a)) return false;
  return isPlaySourceCardWithCostResponseRouteCandidate(a) ||
    isAddToAttackRouteCandidate(a) ||
    isFixedControllerAdvanceDrawActionSemantic(a) ||
    classifyAlterEgoTransformVariant(a) === 'ex' ||
    isZoukenS4MoveSemantic(a) ||
    isZoukenAscensionActionSemantic(a);
}

function hasFixedManaCost(costs: RuleNode[], amount: number): boolean {
  if (costs.length !== 1 || str(costs[0]?.type) !== 'pay_mana') return false;
  const amountNode = node(costs[0]?.amount);
  return Number(costs[0]?.amount) === amount ||
    ((str(amountNode.expr) === 'literal' || str(amountNode.op) === 'literal' || str(amountNode.op) === 'const') && Number(amountNode.value) === amount);
}

function hasSingleNonControllerPlayerTarget(targets: RuleNode[], targetId: string): boolean {
  const target = targets.find((candidate) => str(candidate.id) === targetId);
  if (!target || str(target.type) !== 'player') return false;
  const count = node(target.count);
  return Number(count.min ?? 1) === 1 &&
    Number(count.max ?? 1) === 1 &&
    nodes(target.constraints).some((constraint) => str(constraint.type) === 'not_controller');
}

function hasNotControllerAtBattlefieldCondition(a: AuthoringAbility): boolean {
  return a.conditions.some((condition) => str(condition.type) === 'not' && str(node(condition.condition).type) === 'controller_at_battlefield');
}

function assertAddToAttackSupportAvailable(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const [effect] = a.effects;
  const support = s.cards.find((candidate) =>
    candidate.ownerPlayerId === ctx.controllerId &&
    candidate.definitionId === str(effect?.cardId) &&
    candidate.zone === 'skill');
  if (!support) reject('resolution_failed', `Missing skill-zone support card '${str(effect?.cardId)}'.`);
}

function referencesMovedCountBinding(value: unknown, binding: string): boolean {
  const current = node(value);
  return str(current.var) === binding ||
    (str(current.expr) === 'binding_field' && str(current.binding) === binding && str(current.field) === 'movedCount' && str(current.valueType) === 'number');
}

function pushResourceDirectives(s: GameState, ctx: EffectContext, results: KnownEffectResult[]): void {
  for (const result of results) {
    if (result.effectType !== 'adjust_command_seals') continue;
    const directive = result.payload.directive ?? 'adjust_command_seals';
    pushModeDirective(s, {
      controllerId: result.payload.playerId,
      directive,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      amount: result.payload.actualAmount,
      commandSpells: result.payload.after,
      consumed: true,
    });
    if (result.payload.before > 0 && result.payload.after === 0) {
      processEvent(s, { id: nextId(s, 'empty-seals'), type: 'after_controller_loses_all_command_seals', playerId: result.payload.playerId });
    }
  }
}

function executeResolutionEffects(s: GameState, ctx: EffectContext, effects: RuleNode[]): void {
  try {
    const normalized = normalizeResolutionDataFlowNodes(effects, `cards.${ctx.sourceCardId}.abilities.${ctx.abilityId}.effects`);
    const result = executeResolution({
      state: s,
      controllerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId,
      effects: normalized,
      selections: ctx.selections,
      hooks: {
        movePlayer: ({ state, playerId, targetId, toLocationId }) => {
          const movementAbility = abilityDefinition(state, ctx.sourceCardId, ctx.abilityId);
          const movementTarget = movementAbility.targets.find((target) => str(target.id) === targetId);
          if (!movementTarget || movementTarget.type !== 'location') reject('resolution_failed', 'Movement target definition is missing.');
          const liveCandidates = candidates(state, { ...ctx, controllerId: playerId }, movementTarget);
          if (!liveCandidates.includes(toLocationId)) reject('resolution_failed', 'Movement destination is no longer legal.');
          const movingPlayer = player(state, playerId);
          const fromLocationId = movingPlayer.locationId;
          if (!fromLocationId || fromLocationId === toLocationId) reject('resolution_failed', 'Movement requires a different current location.');
          movingPlayer.locationId = toLocationId as LocationId;
          recordMovementForAbilityRuntime(state, playerId, fromLocationId, toLocationId);
          const enterEventId = nextId(state, 'enter-location');
          processEvent(state, { id: enterEventId, type: 'after_controller_enters_location', playerId, locationId: toLocationId });
          return { fromLocationId, toLocationId, movedCount: 1, emittedEventIds: [enterEventId] };
        },
        playSelectedCards: ({ state, playerId, cardInstanceIds, faceDown }) => {
          playBatch(state, playerId, cardInstanceIds.map((cardInstanceId) => ({ type: 'play_card', cardInstanceId, faceDown })), 'effect');
          return { playedCount: cardInstanceIds.length };
        },
        playSourceCard: ({ state, playerId, sourceCardId, faceDown }) => {
          const source = card(state, sourceCardId);
          if (source.controllerPlayerId !== playerId || source.zone !== 'hand') reject('resolution_failed', 'Source card must still be in the controller hand.');
          playBatch(state, playerId, [{ type: 'play_card', cardInstanceId: sourceCardId, ...(faceDown ? { faceDown: true } : {}) }], 'effect');
          return {
            playedCount: 1,
            destinationZone: card(state, sourceCardId).zone,
          };
        },
      },
      resolutionId: nextId(s, 'resolution'),
      causationId: `${ctx.sourceCardId}:${ctx.abilityId}:${runtime(s).revision}`,
    });
    Object.assign(s, result.nextState);
    runtime(s).events.push(...result.emittedEvents);
    for (const envelope of result.results) {
      runtime(s).events.push({
        type: 'effect_resolved',
        playerId: ctx.controllerId,
        sourceCardId: ctx.sourceCardId,
        abilityId: ctx.abilityId,
        resultId: `${result.context.resolutionId}.${envelope.effectId}`,
      });
    }
    pushResourceDirectives(s, ctx, result.results);
  } catch (error) {
    if (error instanceof DataFlowValidationError || error instanceof ResolutionRuntimeError) {
      reject('resolution_failed', error.message);
    }
    throw error;
  }
}

function executeFixedControllerManaCost(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  executeResolutionEffects(s, ctx, a.cost);
}

function executeEffects(s: GameState, ctx: EffectContext, effects: RuleNode[]): void {
  const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  if (isAcceptedOpponentCloseToOneAbility(a, 'compiled')) { stageOpponentCloseToOne(s, ctx, a); return; }
  if (isOpponentCloseToOneCandidate(a)) reject('resolution_failed', 'Unsupported opponent close-to-one interaction semantic shape');
  if (isBattleEndMobilePlayersRewardSemantic(a)) {
    settleBattleEndMobilePlayersReward(s, ctx);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isBattleLossUnpreventableVpTriggerSemantic(a)) {
    const beforeEvents = runtime(s).events.length;
    executeResolutionEffects(s, ctx, effects);
    for (const event of runtime(s).events.slice(beforeEvents)) {
      if (event.sourceCardId === ctx.sourceCardId && event.abilityId === ctx.abilityId &&
        (event.type === 'victory_points_adjusted' || event.type === 'effect_resolved')) event.unpreventable = true;
    }
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isZoukenManaBootstrapSemantic(a)) {
    executeZoukenManaBootstrap(s, ctx, a);
    return;
  }
  if (isZoukenS3WinSemantic(a)) {
    settleZoukenS3Win(s, ctx);
    return;
  }
  if (isZoukenS3ActionSemantic(a)) {
    executeZoukenS3Action(s, ctx, a);
    return;
  }
  if (hasActiveZoukenFounder(s, ctx.controllerId) && effects.some((effect) => effect.type === 'adjust_command_seals') &&
      effects.every((effect) => effect.type === 'adjust_command_seals' && (effect.player === undefined || effect.player === 'controller') && effect.target === undefined)) {
    for (const effect of effects) resolveEffect(s, ctx, effect);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isZoukenS4RoundEndSemantic(a)) {
    settleZoukenS4RoundEnd(s, ctx);
    return;
  }
  if (isZoukenS4BattleEndSemantic(a)) {
    settleZoukenS4BattleEnd(s, ctx);
    return;
  }
  if (isZoukenS4MoveSemantic(a)) {
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeZoukenS4Move(s, ctx, a);
    return;
  }
  if (isZoukenAscensionActionSemantic(a)) {
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeResolutionEffects(s, ctx, a.cost);
    executeZoukenAscensionAction(s, ctx, a);
    return;
  }
  if (isAbigailS3aSemantic(a)) {
    const pending = findAbigailS3aPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeAbigailS3a(s, ctx, a);
    return;
  }
  if (isAbigailS3bActionSemantic(a)) {
    const pending = findAbigailS3bPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeAbigailS3bAction(s, ctx, a);
    return;
  }
  if (isAbigailS1DistributeSemantic(a)) {
    executeAbigailS1Distribution(s, ctx, a);
    return;
  }
  if (isAbigailS1WinSemantic(a)) {
    executeAbigailS1WinIfX12(s, ctx, a);
    return;
  }
  if (isAbigailS3bCleanupSemantic(a)) {
    executeAbigailS3bCleanup(s, ctx, a);
    return;
  }
  if (isAbigailS4ReleaseSemantic(a)) {
    executeAbigailS4Release(s, ctx, a);
    return;
  }
  if (isAbigailS4CleanupSemantic(a)) {
    executeAbigailS4Cleanup(s, ctx, a);
    return;
  }
  if (isResourceNumericDirectActionSemantic(a) || isResourceNumericTriggerSemantic(a) || isDeploymentResourceRewardSemantic(a) || isBattleLossResourceTriggerSemantic(a) || isBattleLossServantRevealSemantic(a) || isSharedVictoryVpTriggerSemantic(a) || isOptionalBattleResultVpTriggerSemantic(a) || isOptionalBattleResultExtraVpTriggerSemantic(a) || isBattleEndSourceReturnSemantic(a) || isSourcePlayBasicAttackDrawTriggerSemantic(a)) {
    executeResolutionEffects(s, ctx, effects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isMagicResistancePowerModifierSemantic(a)) {
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isGameStartRuleOverrideSemantic(a)) {
    for (const effect of effects) resolveEffect(s, ctx, effect);
    return;
  }
  if (isAnyLocationExceptWorkshopMovementSemantic(a)) {
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeResolutionEffects(s, ctx, effects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isPresenceConcealmentAssassinationCandidate(a)) {
    if (!isPresenceConcealmentAssassinationSemantic(a)) reject('resolution_failed', 'Unsupported Presence Concealment semantic shape');
  }
  if (isAnyLocationExceptWorkshopMovementCandidate(a)) reject('resolution_failed', 'Unsupported any-location-except-workshop movement semantic shape');
  if (isMagicResistancePowerModifierCandidate(a)) reject('resolution_failed', 'Unsupported magic-resistance power modifier semantic shape');
  if (isResourceNumericTriggerCandidate(a)) reject('resolution_failed', 'Unsupported trigger resource semantic shape');
  if (isSourcePlayBasicAttackDrawTriggerCandidate(a)) reject('resolution_failed', 'Unsupported source-play basic-attack draw trigger semantic shape');
  if (isDeploymentResourceRewardCandidate(a)) reject('resolution_failed', 'Unsupported deployment resource reward semantic shape');
  if (isBattleLossResourceTriggerCandidate(a)) reject('resolution_failed', 'Unsupported battle-loss resource semantic shape');
  if (isBattleLossUnpreventableVpTriggerCandidate(a)) reject('resolution_failed', 'Unsupported unpreventable battle-loss VP semantic shape');
  if (isBattleLossServantRevealCandidate(a)) reject('resolution_failed', 'Unsupported battle-loss servant reveal semantic shape');
  if (isSharedVictoryVpTriggerCandidate(a)) reject('resolution_failed', 'Unsupported shared-victory VP semantic shape');
  if (isOptionalBattleResultVpTriggerCandidate(a)) reject('resolution_failed', 'Unsupported optional battle-result VP semantic shape');
  if (isBattleEndSourceReturnCandidate(a)) reject('resolution_failed', 'Unsupported battle-end source-return semantic shape');
  if (isBattleEndMobilePlayersRewardCandidate(a)) reject('resolution_failed', 'Unsupported battle-end mobile-player reward semantic shape');
  if (isPrivateOptionalHandPlayInteractionCandidate(a)) {
    if (!isPrivateOptionalHandPlayInteractionSemantic(a)) reject('resolution_failed', 'Unsupported private optional hand-play interaction semantic shape');
    const interactionTargetId = str(a.targets[0]?.id);
    if (!Object.prototype.hasOwnProperty.call(ctx.selections, interactionTargetId)) {
      runtime(s).pendingDecision = createPrivateOptionalHandPlayInteraction(s, ctx, a, effects);
      return;
    }
  }
  if (isFixedControllerAdvanceDrawActionCandidate(a)) {
    if (!isFixedControllerAdvanceDrawActionSemantic(a)) reject('resolution_failed', 'Unsupported fixed controller advance-draw semantic shape');
    executeResolutionEffects(s, ctx, [...a.cost, ...effects]);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isCardZoneCoreDirectActionRouteCandidate(a)) {
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeResolutionEffects(s, ctx, effects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isPlayActionRouteCandidate(a)) {
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeResolutionEffects(s, ctx, effects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isPlaySourceCardWithCostResponseRouteCandidate(a)) {
    const resolutionEffects = usesAcceptedFixedControllerManaCostComponent(a) ? [...a.cost, ...effects] : effects;
    executeResolutionEffects(s, ctx, resolutionEffects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isActivateCardByIdTrigger(a)) {
    executeResolutionEffects(s, ctx, effects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isCloseSourceCardOnPlayedTrigger(a)) {
    assertCloseSourceState(s, ctx.sourceCardId, ctx.controllerId);
    executeResolutionEffects(s, ctx, effects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isAddToAttackRouteCandidate(a)) {
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    executeResolutionEffects(s, ctx, effects);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isPlayActionStructuralCandidate(a)) reject('resolution_failed', 'Unsupported play action semantic shape.');
  if (isPlaySourceCardWithCostResponseStructuralCandidate(a)) reject('resolution_failed', 'Unsupported source-card response play semantic shape.');
  if (isAddToAttackStructuralCandidate(a)) reject('resolution_failed', 'Unsupported add-to-attack semantic shape.');
  const pending = findPendingTarget(s, ctx, a, effects);
  if (pending) { runtime(s).pendingDecision = pending; return; }
  for (let i = 0; i < effects.length; i++) {
    const nextPending = findPendingTarget(s, ctx, a, effects.slice(i));
    if (nextPending) { runtime(s).pendingDecision = nextPending; return; }
    const effect = effects[i]!;
    if (effect.type === 'branch') {
      const branch = nodes(effect.branches).find(b => b.else !== undefined || condition(s, ctx, node(b.if)));
      if (branch) executeEffects(s, ctx, [...nodes(branch.then ?? branch.else), ...effects.slice(i + 1)]);
      return;
    }
    resolveEffect(s, ctx, effect);
  }
  installOngoing(s, ctx, a);
  cleanupOngoing(s);
}
/** Server-only execution after discovery/trigger validation. Never accept an effect or context from the client. */
export function executeAbility(s: GameState, ctx: EffectContext): void {
  const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  if (a.execution.mode !== 'automatic') reject(a.execution.mode, 'Ability requires an adapter or host ruling');
  if (isFixedControllerAdvanceDrawActionCandidate(a) && !isFixedControllerAdvanceDrawActionSemantic(a)) {
    reject('resolution_failed', 'Unsupported fixed controller advance-draw semantic shape');
  }
  if (isAnyLocationExceptWorkshopMovementCandidate(a) && !isAnyLocationExceptWorkshopMovementSemantic(a) && !isZoukenS4MoveSemantic(a)) {
    reject('resolution_failed', 'Unsupported any-location-except-workshop movement semantic shape');
  }
  if (isMagicResistancePowerModifierCandidate(a) && !isMagicResistancePowerModifierSemantic(a)) {
    reject('resolution_failed', 'Unsupported magic-resistance power modifier semantic shape');
  }
  if (isPresenceConcealmentAssassinationCandidate(a) && !isPresenceConcealmentAssassinationSemantic(a)) {
    reject('resolution_failed', 'Unsupported Presence Concealment semantic shape');
  }
  if (isOpponentCloseToOneCandidate(a) && !isAcceptedOpponentCloseToOneAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported opponent close-to-one interaction semantic shape');
  }
  if (isZoukenManaBootstrapCandidate(a) && !isZoukenManaBootstrapSemantic(a)) {
    reject('resolution_failed', 'Unsupported Zouken game-start mana bootstrap semantic shape');
  }
  if (isZoukenS2AbilityCandidate(a) && (!isZoukenS2Source(s, ctx.sourceCardId) || !isZoukenS2Semantic(a) || !gameStartSkillProvisioningPreflight(s, ctx.sourceCardId, a))) {
    reject('resolution_failed', 'Unsupported Zouken s2 owner-bound provisioning semantic shape');
  }
  if (isZoukenAscensionAbilityCandidate(a) && (!isZoukenAscensionSource(s, ctx.sourceCardId) || !isZoukenAscensionSemantic(a))) {
    reject('resolution_failed', 'Unsupported Zouken ascension semantic shape');
  }
  if (isZoukenS3AbilityCandidate(a) && (!isZoukenS3Source(s, ctx.sourceCardId) || !isZoukenS3Semantic(a))) {
    reject('resolution_failed', 'Unsupported Zouken S3 semantic shape');
  }
  if (isZoukenS4AbilityCandidate(a) && (!isZoukenS4Source(s, ctx.sourceCardId) || !isZoukenS4Semantic(a))) {
    reject('resolution_failed', 'Unsupported Zouken S4 semantic shape');
  }
  if (isAbigailS3aCandidate(a) && (!isAbigailS3aSource(s, ctx.sourceCardId) || !isAbigailS3aSemantic(a))) {
    reject('resolution_failed', 'Unsupported Abigail S3a source-bound semantic shape');
  }
  if (isAbigailS3bCandidate(a) && (!isAbigailS3aSource(s, ctx.sourceCardId) || !isAbigailS3bSemantic(a))) {
    reject('resolution_failed', 'Unsupported Abigail S3b source-bound semantic shape');
  }
  if (isAbigailS1Candidate(a) && (!isAbigailS1Source(s, ctx.sourceCardId) || !isAbigailS1Semantic(a))) {
    reject('resolution_failed', 'Unsupported Abigail S1 source-bound semantic shape');
  }
  if (isAbigailS4Candidate(a) && (!isAbigailS4Source(s, ctx.sourceCardId) || !isAbigailS4Semantic(a))) {
    reject('resolution_failed', 'Unsupported Abigail S4 source-bound semantic shape');
  }
  if (isGameStartRuleOverrideCandidate(a) && !isGameStartRuleOverrideSemantic(a)) {
    reject('resolution_failed', 'Unsupported persistent RuleOverride semantic shape');
  }
  if (isGameStartSkillProvisioningCandidate(a)) {
    provisionGameStartSkillCards(s, ctx, a);
    return;
  }
  if (isAlterEgoTransformCandidate(a)) {
    if (!isAlterEgoTransformSemantic(a)) reject('resolution_failed', 'Unsupported Alter Ego transform semantic shape');
    resolveAlterEgoTransformResponse(s, ctx, a);
    return;
  }
  if (isBattleLossStateTransformCandidate(a)) {
    if (!isBattleLossStateTransformSemantic(a)) reject('resolution_failed', 'Unsupported battle-loss state-transform semantic shape');
    settleBattleLossStateTransform(s, ctx);
    return;
  }
  if (isUniqueWinCreateCardTriggerCandidate(a)) {
    if (!isUniqueWinCreateCardTriggerSemantic(a)) reject('resolution_failed', 'Unsupported unique win create-card semantic shape');
    const source = card(s, ctx.sourceCardId);
    if (source.zone !== 'hand' || source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId) {
      reject('invalid_cost', 'Unique win create-card source must remain in the controller hand');
    }
    const fromZone = source.zone;
    moveCard(s, ctx.sourceCardId, 'removed_from_game');
    runtime(s).events.push({
      type: 'source_card_removed_from_game', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId, cardInstanceId: ctx.sourceCardId, fromZone, toZone: 'removed_from_game', movedCount: 1,
    });
    const create = a.creates[0]!;
    const createdCardId = nextId(s, 'created');
    s.cards.push({
      instanceId: createdCardId, definitionId: str(create.cardId), ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId,
      zone: 'deck', visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId }, generatedBy: ctx.sourceCardId,
    });
    runtime(s).events.push({
      type: 'card_created', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
      cardInstanceId: createdCardId, toZone: 'deck', movedCount: 1,
    });
    shuffle(s, ctx.controllerId);
    runtime(s).events.push({
      type: 'deck_shuffled', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
    });
    return;
  }
  if (isCardZoneCoreDirectActionRouteCandidate(a) || isFixedControllerAdvanceDrawActionSemantic(a) || isAnyLocationExceptWorkshopMovementSemantic(a) || isZoukenS4MoveSemantic(a) || isPlayActionRouteCandidate(a) || isPlaySourceCardWithCostResponseStructuralCandidate(a) || isAddToAttackRouteCandidate(a) || isActivateCardByIdTrigger(a) || isCloseSourceCardOnPlayedTrigger(a)) {
    try {
      normalizeResolutionDataFlowNodes([...a.effects, ...a.creates], `cards.${ctx.sourceCardId}.abilities.${ctx.abilityId}.effects`);
    } catch (error) {
      if (error instanceof DataFlowValidationError) reject('resolution_failed', error.message);
      throw error;
    }
  }
  if (isAddToAttackRouteCandidate(a)) assertAddToAttackSupportAvailable(s, ctx, a);
  if (isZoukenS3ActionSemantic(a)) {
    executeZoukenS3Action(s, ctx, a);
    return;
  }
  if (isAbigailS3aSemantic(a)) {
    const sourceCtx = context(s, ctx.sourceCardId, ctx.abilityId, ctx.event);
    if (!isAbigailS3aSource(s, ctx.sourceCardId) || !active(s, ctx.sourceCardId) || phase(s) !== 'action' ||
        abigailS3aTargetCandidates(s, sourceCtx, a).length < 1) {
      reject('resolution_failed', 'Abigail S3a source or target lifecycle is stale');
    }
  }
  if (isAbigailS3bActionSemantic(a)) {
    if (!isAbigailS3aSource(s, ctx.sourceCardId) || !active(s, ctx.sourceCardId) || phase(s) !== 'action' ||
        s.round.prioritySeat !== player(s, ctx.controllerId).seat) {
      reject('resolution_failed', 'Abigail S3b source or action lifecycle is stale');
    }
  }
  const p = player(s, ctx.controllerId); let manaCost = 0;
  const fixedControllerManaCost = usesAcceptedFixedControllerManaCostComponent(a);
  
  // Check usage limits
  const limitType = str(a.limit?.type);
  if ((limitType === 'per_game' || limitType === 'per_round') && abilityLimitReached(s, ctx.sourceCardId, a)) {
    reject('ability_limit_reached', 'Ability has been used the maximum number of times this game');
  }
  
  const names = a.cost.filter(c => c.type === 'pay_mana').map(c => str(node(c.amount).var)).filter(Boolean);
  if (Object.keys(ctx.variables).some(name => !names.includes(name))) reject('invalid_variable', 'Unexpected variable');
  for (const cost of a.cost) {
    if (cost.type === 'pay_mana' && fixedControllerManaCost) {
      continue;
    }
    if (cost.type === 'pay_mana') {
      const value = numeric(s, ctx, cost.amount);
      if (!Number.isSafeInteger(value) || value < 0 || value > p.mana) reject('invalid_cost', 'Variable cost must be an integer within available mana');
      for (const c of nodes(node(cost.amount).constraints)) {
        if (c.type === 'integer' && (value < Number(c.min ?? 0) || (c.max !== undefined && value > Number(c.max)))) reject('invalid_cost', 'Variable outside allowed range');
        if (c.type === 'lte' && !condition(s, ctx, c)) reject('invalid_cost', 'Variable exceeds available mana');
      }
      manaCost += value;
    } else if (cost.type === 'move_source_card') {
      if (card(s, ctx.sourceCardId).zone !== node(cost.from).zone) reject('invalid_cost', 'Source is not in required zone');
    } else reject('unsupported', 'Unsupported ability cost');
  }
  if (manaCost > p.mana) reject('insufficient_mana', 'Insufficient mana');
  if (fixedControllerManaCost && isFixedControllerAdvanceDrawActionSemantic(a) &&
    !hasAvailableManaForFixedCosts(s, ctx, a)) reject('insufficient_mana', 'Insufficient mana');
  p.mana -= manaCost;
  if (fixedControllerManaCost && isAddToAttackRouteCandidate(a)) executeFixedControllerManaCost(s, ctx, a);
  if (names.length) runtime(s).calculations.push({ controllerId: p.id, lines: names.map(name => ({ label: name, value: ctx.variables[name]! })) });
  for (const cost of a.cost.filter(c => c.type === 'move_source_card')) moveCard(s, ctx.sourceCardId, str(node(cost.to).zone));
  if (a.visibility.revealTiming === 'on_use_declared') reveal(s, p.id);
  if (!isCommandSpellCard(s, ctx.sourceCardId) && classifyAbilityInteraction(a).kind === 'phase_activation') runtime(s).usedAbilities[`${ctx.sourceCardId}:${a.id}`] = s.round.roundNumber;
  
  // Update usage count
  if (limitType === 'per_game' || limitType === 'per_round') {
    const usageKey = limitType === 'per_round' ? `${ctx.sourceCardId}:${a.id}:round:${s.round.roundNumber}` : `${ctx.sourceCardId}:${a.id}`;
    runtime(s).abilityUsage[usageKey] = (runtime(s).abilityUsage[usageKey] ?? 0) + 1;
  }
  
  installOngoing(s, ctx, a);
  executeEffects(s, ctx, [...a.effects, ...a.creates]);
}

function stageDelayedActivation(s: GameState, trigger: TriggeredAbility, ability: AuthoringAbility, event: AbilityEvent): void {
  if (event.playerId !== trigger.controllerId || event.lossOrdinal !== 1 || !event.battlefieldId) {
    reject('invalid_event', 'First-loss activation requires authoritative battle identity and first-loss ordinal');
  }
  const effect = ability.effects[0]!;
  const pending = runtime(s).pendingDelayedActivations ??= [];
  if (pending.some((entry) =>
    entry.sourceCardId === trigger.cardInstanceId &&
    entry.abilityId === trigger.abilityId &&
    entry.round === s.round.roundNumber)) return;
  pending.push({
    controllerId: trigger.controllerId,
    sourceCardId: trigger.cardInstanceId,
    abilityId: trigger.abilityId,
    definitionId: str(effect.definitionId),
    triggerEventId: event.id,
    round: s.round.roundNumber,
  });
}

function consumeDelayedActivations(s: GameState, event: AbilityEvent): void {
  const r = runtime(s);
  const pending = r.pendingDelayedActivations ?? [];
  const due = pending.filter((entry) => entry.round === s.round.roundNumber);
  if (due.length === 0) return;
  r.pendingDelayedActivations = pending.filter((entry) => entry.round !== s.round.roundNumber);
  for (const entry of due) {
    const source = card(s, entry.sourceCardId);
    if (source.controllerPlayerId !== entry.controllerId) reject('resolution_failed', 'Delayed activation source controller changed before round end');
    const ability = abilityDefinition(s, entry.sourceCardId, entry.abilityId);
    if (!isActivateCardByIdTrigger(ability) || str(ability.effects[0]?.definitionId) !== entry.definitionId) {
      reject('resolution_failed', 'Delayed activation semantic contract changed before round end');
    }
    executeAbility(s, context(s, entry.sourceCardId, entry.abilityId, event));
  }
}

function processEvent(s: GameState, event: AbilityEvent): void {
  const r = runtime(s); if (r.processedEvents.includes(event.id)) return;
  if (!event.id) reject('invalid_event', 'Events require stable ids');
  r.processedEvents.push(event.id);
  if (event.type === 'round_end') consumeDelayedActivations(s, event);
  const triggered = collectTriggeredAbilities(s, event);
  for (const t of triggered) {
    const a = abilityDefinition(s, t.cardInstanceId, t.abilityId);
    if (a.kind === 'phase_action') continue; // phase windows expose a choice, never auto-spend a phase ability
    if (event.type === 'after_controller_first_loses_battle' && isActivateCardByIdTrigger(a)) {
      stageDelayedActivation(s, t, a, event);
      continue;
    }
    const interaction = classifyAbilityInteraction(a);
    if (interaction.kind === 'response_window') {
      const groupId = str(a.limit.groupId);
      const key = `${event.id}:${t.controllerId}:${groupId || a.id}`;
      let w = r.responseWindows.find(w => w.id === key);
      if (!w) {
        w = { id: key, kind: groupId ? 'choose_unique_trigger' : 'response', controllerId: t.controllerId,
          opens: interaction.window || str(a.responseWindow.opens), choices: [], event, order: 'turn_order', passBehavior: 'decline_this_window',
          ...(groupId ? { group: { groupId, policy: 'only_one_effect_may_activate_per_window' as const } } : {}) };
        r.responseWindows.push(w);
      }
      w.choices.push(t);
    } else executeAbility(s, context(s, t.cardInstanceId, t.abilityId, event));
  }
  if (event.type === 'after_battle_result_determined' && event.battleResult) {
    const battleResult = createBattleResult(event.battleResult);
    const winners = battleResult.winners;
    const losers = battleResult.loserIds.filter(id => !winners.includes(id));
    
    for (const id of winners) processEvent(s, { ...event, id: `${event.id}:win:${id}`, type: 'after_controller_wins_battle', playerId: id });
    for (const id of winners) processEvent(s, { ...event, id: `${event.id}:victory:${id}`, type: 'after_controller_gains_victory', playerId: id });
    for (const id of losers) processEvent(s, { ...event, id: `${event.id}:lose:${id}`, type: 'after_controller_loses_battle', playerId: id });
  }
  checkFormulaTriggers(s);
}

/**
 * S2 provisioning is a source-specific automatic game_start transaction.  A
 * malformed retained card or mutated source must be rejected before the
 * normal event ledger records the event; otherwise a failed trigger would
 * still consume the event id/revision and make the rejection observable.
 */
function zoukenS2GameStartPreflight(s: GameState, event: AbilityEvent): boolean {
  if (event.type !== 'game_start') return true;
  for (const source of s.cards) {
    for (const ability of definition(s, source.instanceId)?.abilities ?? []) {
      if (isZoukenS2AbilityCandidate(ability) && str(ability.activation.trigger) === 'game_start' &&
        !gameStartSkillProvisioningPreflight(s, source.instanceId, ability)) return false;
    }
  }
  return true;
}
function abigailS4ReleasePreflight(s: GameState, event: AbilityEvent): boolean {
  if (event.type !== 'on_use_declared' || phase(s) === 'action' || !event.sourceCardId) return true;
  return !(definition(s, event.sourceCardId)?.abilities ?? []).some((ability) =>
    isAbigailS4ReleaseSemantic(ability));
}
/** Trusted backend event hook. Events are not part of AbilityCommand. */
export function processAbilityEvent(s: GameState, event: AbilityEvent): void {
  if (runtime(s).processedEvents.includes(event.id)) return;
  if (!zoukenS2GameStartPreflight(s, event)) return;
  if (!abigailS4ReleasePreflight(s, event)) return;
  const copy = structuredClone(s); processEvent(copy, event); runtime(copy).revision++;
  Object.assign(s, copy);
}
/** Trusted backend producer helper. Allocates event identity inside the same cloned transaction. */
export function processAbilitySystemEvent(s: GameState, label: string, event: Omit<AbilityEvent, 'id'>): void {
  const copy = structuredClone(s);
  const materialized = { ...event, id: nextId(copy, label) } as AbilityEvent;
  if (!zoukenS2GameStartPreflight(s, materialized)) return;
  if (!abigailS4ReleasePreflight(s, materialized)) return;
  processEvent(copy, materialized);
  runtime(copy).revision++;
  Object.assign(s, copy);
}
export function advanceAbilityPhase(s: GameState, next: PhaseName, round = s.round.roundNumber): void {
  const r = runtime(s);
  if (r.pendingDecision || r.responseWindows.length || r.hostRequests.length) reject('pending_resolution', 'Resolve the current decision before advancing');
  if (!Number.isInteger(round) || round < s.round.roundNumber) reject('invalid_round', 'Round cannot move backwards');
  const copy = structuredClone(s);
  if (round > s.round.roundNumber) {
    runtime(copy).movementDistanceThisRound = {};
    runtime(copy).battlefieldsPassedOrStayedThisRound = {};
    runtime(copy).manaGainedThisRound = { round, byPlayer: {} };
    runtime(copy).playCounters = { round, cardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} };
  }
  copy.round.activePhase = next; copy.round.roundNumber = round; cleanupOngoing(copy);
  const type = next === 'battle' ? 'controller_combat_action_window' : next === 'action' ? 'controller_action_window' : next === 'round_end' ? 'round_end' : 'phase_changed';
  processEvent(copy, { id: nextId(copy, 'phase'), type }); runtime(copy).revision++; Object.assign(s, copy);
}

export function projectAbilityState(s: GameState, viewerId: string): AbilityPlayerView {
  const r = runtime(s); const ongoing = liveOngoing(s); const exists = s.players.some(p => p.id === viewerId);
  const staged = Object.entries(stagedAttacks(s))
    .filter(([playerId]) => playerId === viewerId || s.cards.some((card) => card.controllerPlayerId === playerId && card.zone === 'attack_area' && card.visibility.scope === 'public'))
    .map(([playerId, cards]) => ({ playerId, cards: cards.map((entry) => ({ ...entry })) }));
  const view: AbilityPlayerView = { revision: r.revision, phase: s.round.activePhase, round: s.round.roundNumber,
    legalActions: exists ? getLegalActions(s, viewerId) : [],
    players: s.players.map(p => {
      const character = r.pack.characters?.[p.servantCardId];
      const servantPackage = character ? {
        id: character.id,
        name: character.name,
        class: character.class ?? 'Servant',
        publicInformation: structuredClone(character.publicInformation),
        skillCards: character.cardIds.filter(cardId => r.pack.cards[cardId]?.cardType === 'servant_skill').map(cardId => ({
          id: cardId, name: r.pack.cards[cardId]!.name,
          printedText: r.pack.cards[cardId]!.abilities.map(ability => ability.printedClause).filter(Boolean).join('\n'),
          cardFace: r.pack.cards[cardId]!.cardFace,
        })),
        knownCardDefinitions: character.cardIds.map(cardId => ({
          id: cardId, name: r.pack.cards[cardId]!.name,
          printedText: r.pack.cards[cardId]!.abilities.map(ability => ability.printedClause).filter(Boolean).join('\n'),
          cardFace: r.pack.cards[cardId]!.cardFace,
        })),
      } : r.pack.servantPackage;
      return { id: p.id, seat: p.seat, mana: p.mana, vp: p.vp, commandSpells: effectiveCommandSpells(s, p.id), masterCardId: p.masterCardId,
        ...(p.locationId ? { locationId: p.locationId } : {}), handCount: s.cards.filter(c => c.ownerPlayerId === p.id && c.zone === 'hand').length,
        deckCount: s.cards.filter(c => c.ownerPlayerId === p.id && c.zone === 'deck').length,
        ...(r.revealedServants.includes(p.id) && servantPackage && p.servantCardId === servantPackage.id
          ? { servantPackage: structuredClone(servantPackage) } : {}) };
    }), cards: [],
    ...(staged.length ? { stagedAttacks: staged } : {}),
    ...(exists ? { playSummary: {
      cardsPlayedThisRound: r.playCounters?.round === s.round.roundNumber ? r.playCounters.cardsPlayedByPlayer[viewerId] ?? 0 : 0,
      attacksDeclaredThisRound: attacksDeclaredThisRound(s, viewerId),
      attackAreaOccupancy: s.cards.filter(c => c.controllerPlayerId === viewerId && c.zone === 'attack_area').length,
      attackAllowance: attackPlayAllowance(s, viewerId),
    }, playDiagnostics: s.cards
      .filter(c => c.controllerPlayerId === viewerId && ['hand', 'skill'].includes(c.zone))
      .flatMap(c => [false, true].map(faceDown => {
        const classification = cardPlayClassification(s, c.instanceId);
        const reasonCode = playFailure(s, viewerId, c.instanceId, faceDown);
        return { cardInstanceId: c.instanceId, faceDown, ...classification, ...(reasonCode ? { reasonCode } : {}) };
      })) } : {}) };
  for (const c of s.cards) {
    if (c.zone === 'deck') continue;
    const privateZone = ['hand', 'skill', 'looked_cards'].includes(c.zone);
    const isPublic = !privateZone && (c.visibility.scope === 'public' || ongoing.some(o => o.controllerId === c.ownerPlayerId && o.publicZones.includes(c.zone)));
    const own = c.ownerPlayerId === viewerId;
    if (!own && !isPublic && !['field', 'attack_area'].includes(c.zone)) continue;
    const hidden = !own && (!isPublic || runtime(s).cardState[c.instanceId]?.faceDown);
    // Opaque battlefield slot ids do not reveal definition ids embedded in legacy instance ids.
    const physicalState = runtime(s).cardState[c.instanceId];
    view.cards.push({ instanceId: hidden ? `hidden-field-${s.cards.indexOf(c)}` : c.instanceId,
      ...(!hidden && (own || isPublic) ? { definitionId: c.definitionId } : {}), ownerPlayerId: c.ownerPlayerId, zone: c.zone,
      ...(physicalState?.faceDown ? { faceDown: true } : {}),
      ...(!hidden && physicalState?.reversed ? { reversed: true } : {}),
      ...(!hidden && physicalState?.attributeOverrides !== undefined ? { attributeOverrides: [...physicalState.attributeOverrides] } : {}) });
  }
  const d = r.pendingDecision;
  if (d) {
    if (d.controllerId === viewerId) {
      const projectedCandidates = d.interaction ? d.candidates : candidates(s, d.context, d.target);
      view.pendingDecision = { id: d.id, candidates: [...projectedCandidates], min: d.min, max: d.max,
        ...(d.interaction ? {
          template: d.interaction.template, sourceCardInstanceId: d.interaction.sourceCardInstanceId, abilityId: d.interaction.abilityId,
          createdRevision: d.interaction.createdRevision, visibility: d.interaction.visibility, cancelPolicy: d.interaction.cancelPolicy,
        } : {}) };
    } else view.waitingLabel = '等待响应结算';
  } else if (r.responseWindows[0]) {
    const w = r.responseWindows[0];
    if (w.controllerId === viewerId) view.responseWindow = { id: w.id, kind: w.kind, opens: w.opens };
    else view.waitingLabel = '等待响应结算';
  } else if (r.hostRequests.length) view.waitingLabel = '等待主持人裁定';
  return view;
}
function dispatch(s: GameState, playerId: string, command: AbilityCommand): void {
  const r = runtime(s); const legal = getLegalActions(s, playerId);
  if (!command || typeof command !== 'object') reject('illegal_action', 'Invalid command');
  switch (command.type) {
    case 'play_card': {
      const owned = s.cards.find(c => c.instanceId === command.cardInstanceId && c.controllerPlayerId === playerId);
      if (!owned) reject('illegal_action', 'Card is not available');
      const failure = playFailure(s, playerId, command.cardInstanceId, command.faceDown === true);
      if (failure) reject(failure, 'Card cannot be played in the current state');
      if (!legal.some(a => a.type === 'play_card' && a.cardInstanceId === command.cardInstanceId && !!a.faceDown === !!command.faceDown)) reject('illegal_action', 'Card play is not available');
      playBatch(s, playerId, [command]);
      break;
    }
    case 'stage_attack_card': {
      const owned = s.cards.find(c => c.instanceId === command.cardInstanceId && c.controllerPlayerId === playerId);
      if (!owned) reject('illegal_action', 'Card is not available');
      const currentStaged = stagedAttacks(s)[playerId] ?? [];
      const allowRequiredAdditional = isRequiredAdditionalPlayCard(s, command.cardInstanceId) && currentStaged.some((entry) =>
        entersAttackArea(s, entry.cardInstanceId) && !isRequiredAdditionalPlayCard(s, entry.cardInstanceId));
      const failure = playFailure(s, playerId, command.cardInstanceId, command.faceDown === true, false, false, false, allowRequiredAdditional);
      if (failure) reject(failure, 'Card cannot be staged in the current state');
      if (!entersAttackArea(s, command.cardInstanceId)) reject('not_attack_card', 'Only attack cards can be staged');
      if (!legal.some(a => a.type === command.type && a.cardInstanceId === command.cardInstanceId && !!a.faceDown === !!command.faceDown)) reject('illegal_action', 'Card staging is not available');
      const staged = stagedAttacks(s);
      staged[playerId] = [...(staged[playerId] ?? []), { type: 'play_card', cardInstanceId: command.cardInstanceId, ...(command.faceDown ? { faceDown: true } : {}) }];
      break;
    }
    case 'confirm_staged_attack': {
      const staged = stagedAttacks(s);
      const choices = staged[playerId] ?? [];
      if (!choices.length || !legal.some(a => a.type === 'confirm_staged_attack')) reject('illegal_action', 'No staged attack can be confirmed');
      playBatch(s, playerId, choices);
      delete staged[playerId];
      break;
    }
    case 'cancel_staged_attack': {
      const staged = stagedAttacks(s);
      if (!staged[playerId]?.length || !legal.some(a => a.type === 'cancel_staged_attack')) reject('illegal_action', 'No staged attack can be cancelled');
      delete staged[playerId];
      break;
    }
    case 'activate_ability': {
      if (!legal.some(a => a.type === command.type && a.cardInstanceId === command.cardInstanceId && a.abilityId === command.abilityId)) reject('illegal_action', 'Ability is not available');
      const ctx = context(s, command.cardInstanceId, command.abilityId); ctx.variables = command.variables ?? {};
      executeAbility(s, ctx); break;
    }
    case 'choose_target': {
      const d = r.pendingDecision;
      if (!d || d.controllerId !== playerId || d.id !== command.decisionId) reject('illegal_decision', 'Decision is not available');
      const selected = command.selectedIds;
      if (d.interaction) {
        const meta = d.interaction;
        if (meta.kind === 'opponent_close_non_residual_to_one_v1') {
          if (!hasExactOpponentCloseToOneDecisionRootKeys(d) || !hasExactOpponentCloseToOneInteractionRootKeys(meta)) reject('resolution_failed', 'Corrupt or stale opponent close-to-one interaction state');
          const decisionContext: unknown = d.context; const decisionTarget: unknown = d.target;
          if (!isExactOpponentCloseToOneContext(decisionContext) || !isExactOpponentCloseToOneTarget(decisionTarget)) reject('resolution_failed', 'Corrupt or stale opponent close-to-one interaction state');
          const a = abilityDefinition(s, decisionContext.sourceCardId, decisionContext.abilityId);
          const pendingQueueValue: unknown = r.pendingOpponentCloseToOne;
          if (!isExactOpponentCloseToOneQueue(s, pendingQueueValue)) reject('resolution_failed', 'Corrupt or stale opponent close-to-one queue state');
          const pendingQueue = pendingQueueValue; const pending = pendingQueue[0]!;
          if (!opponentCloseToOneQueueMatchesServerAuthority(s, pendingQueue)) reject('resolution_failed', 'Corrupt or stale opponent close-to-one server authority');
          const source = s.cards.find((candidate) => candidate.instanceId === decisionContext.sourceCardId);
          const sourceState: unknown = source ? r.cardState[source.instanceId] : undefined;
          const initiatingController = s.players.find((candidate) => candidate.id === meta.initiatingControllerId);
          const decisionPlayer = s.players.find((candidate) => candidate.id === meta.decisionPlayerId);
          const pendingQualifyingCardIds: unknown = pending?.qualifyingCardIds; const metaQualifyingCardIds: unknown = meta.qualifyingCardIds;
          const metaConstraints: unknown = meta.constraints; const metaRemainingDecisionPlayerIds: unknown = meta.remainingDecisionPlayerIds; const decisionCandidates: unknown = d.candidates;
          if (!isAcceptedOpponentCloseToOneAbility(a, 'compiled') || !pending || !source || !initiatingController || !decisionPlayer ||
              initiatingController.status !== 'active' || decisionPlayer.status !== 'active' || initiatingController.locationId !== meta.battlefieldId || decisionPlayer.locationId !== meta.battlefieldId ||
              !isBattlefield(s, meta.battlefieldId) || source.ownerPlayerId !== meta.initiatingControllerId || source.controllerPlayerId !== meta.initiatingControllerId ||
              !isValidOpponentCloseToOneSourceCardState(sourceState) || sourceState.faceDown || d.controllerId !== meta.decisionPlayerId || decisionContext.controllerId !== meta.initiatingControllerId ||
              pending.initiatingControllerId !== meta.initiatingControllerId || pending.decisionPlayerId !== meta.decisionPlayerId || pending.sourceCardId !== meta.sourceCardInstanceId || pending.abilityId !== meta.abilityId ||
              pending.battlefieldId !== meta.battlefieldId || !exactFrozenCardIdList(pendingQualifyingCardIds, metaQualifyingCardIds) || !exactPlayerOwnerMap(pending.qualifyingCardOwners, meta.qualifyingCardOwners, metaQualifyingCardIds) ||
              !isExactNonEmptyPlayerIdList(metaRemainingDecisionPlayerIds) || !exactPlayerArray(pending.remainingDecisionPlayerIds, metaRemainingDecisionPlayerIds) ||
              !exactPlayerArray(metaRemainingDecisionPlayerIds, pendingQueue.map((entry) => entry.decisionPlayerId)) || meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
              meta.continuationRef !== d.id + ':continuation' || meta.createdRevision !== r.revision || meta.sourceCardInstanceId !== decisionContext.sourceCardId || meta.abilityId !== decisionContext.abilityId ||
              !isExactOpponentCloseToOneConstraints(metaConstraints) || !Array.isArray(d.remainingEffects) || d.remainingEffects.length !== 0 || d.min !== 1 || d.max !== 1 ||
              !exactFrozenCardIdList(decisionCandidates, metaQualifyingCardIds) || !Array.isArray(selected) || selected.length !== 1 || !d.candidates.includes(selected[0]!) ||
              !exactFrozenCardIdList(qualifyingOpponentCloseToOneCardIds(s, meta.decisionPlayerId), metaQualifyingCardIds) || !livePlayerOwnersMatchFrozen(s, meta.qualifyingCardOwners, metaQualifyingCardIds)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-to-one interaction state');
          }
          const selectedCardId = selected[0]!; const closeIds = meta.qualifyingCardIds.filter((instanceId) => instanceId !== selectedCardId);
          if (closeIds.some((instanceId) => isCardCloseForbidden(s, instanceId))) reject('resolution_failed', 'Opponent close-to-one contains a card protected from closing');
          for (const instanceId of closeIds) closeOpponentCardForCloseToOne(s, meta.decisionPlayerId, instanceId);
          delete r.pendingDecision; pendingQueue.shift(); advanceOpponentCloseToOneServerAuthority(s); if (pendingQueue.length === 0) clearOpponentCloseToOneServerAuthority(s);
          for (const instanceId of closeIds) { const closed = card(s, instanceId); r.events.push({ type: 'opponent_card_closed_to_one', playerId: meta.decisionPlayerId, controllerId: meta.initiatingControllerId, sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, cardInstanceId: instanceId, toZone: closed.zone }); }
          stageNextOpponentCloseToOneDecision(s); break;
        }
        const a = abilityDefinition(s, d.context.sourceCardId, d.context.abilityId);
        if (meta.kind === 'alter_ego_attribute_choice_v1') {
          const variant = classifyAlterEgoTransformVariant(a);
          const target = alterEgoTriggerTarget(s, d.context.sourceCardId, d.context.event);
          const currentAllowed = candidates(s, d.context, d.target);
          if (meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
            meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== runtime(s).revision ||
            meta.sourceCardInstanceId !== d.context.sourceCardId || meta.abilityId !== d.context.abilityId ||
            meta.triggerEventId !== d.context.event?.id || meta.targetCardInstanceId !== target?.instanceId || meta.variant !== variant ||
            meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'attribute' || meta.constraints.min !== 0 ||
            meta.constraints.max !== 3 || meta.constraints.distinct !== true || d.min !== 0 || d.max !== 3 ||
            d.candidates.length !== ALTER_EGO_MUTABLE_ATTRIBUTES.length ||
            ALTER_EGO_MUTABLE_ATTRIBUTES.some((attribute) => !d.candidates.includes(attribute)) ||
            !Array.isArray(selected) || selected.length < d.min || selected.length > d.max ||
            new Set(selected).size !== selected.length || selected.some((id) => !d.candidates.includes(id) || !currentAllowed.includes(id))) {
            reject('resolution_failed', 'Corrupt or stale Alter Ego attribute interaction state');
          }
          d.context.selections[str(d.target.id)] = [...selected];
          delete r.pendingDecision;
          applyAlterEgoTransform(s, d.context, a, selected);
          break;
        }
        if (meta.kind !== 'private_optional_hand_play_v1' || meta.template !== 'target' || meta.visibility !== 'owner_only' ||
          meta.cancelPolicy !== 'forbidden' || meta.continuationRef !== `${d.id}:continuation` ||
          meta.createdRevision !== runtime(s).revision || meta.sourceCardInstanceId !== d.context.sourceCardId ||
          meta.abilityId !== d.context.abilityId || meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'card' ||
          meta.constraints.min !== d.min || meta.constraints.max !== d.max || meta.constraints.distinct !== true ||
          !isPrivateOptionalHandPlayInteractionSemantic(a)) {
          reject('resolution_failed', 'Corrupt private optional hand-play interaction state');
        }
        const currentAllowed = candidates(s, d.context, d.target);
        if (!Array.isArray(selected) || selected.length < d.min || selected.length > d.max || new Set(selected).size !== selected.length ||
          selected.some(id => !d.candidates.includes(id) || !currentAllowed.includes(id))) {
          reject('illegal_target', 'Selected targets are not legal');
        }
      } else {
        const allowed = candidates(s, d.context, d.target);
        if (!Array.isArray(selected) || selected.length < d.min || selected.length > d.max || new Set(selected).size !== selected.length || selected.some(id => !allowed.includes(id))) reject('illegal_target', 'Selected targets are not legal');
      }
      const continuationAbility = abilityDefinition(s, d.context.sourceCardId, d.context.abilityId);
      if (!d.interaction && isAbigailS3aSemantic(continuationAbility)) {
        if (!exactRestoreValue(d.candidates, abigailS3aTargetCandidates(s, d.context, continuationAbility))) {
          reject('resolution_failed', 'Abigail S3a pending target provenance changed');
        }
        validateAbigailS3aContinuation(s, d.context, continuationAbility, selected);
      }
      if (!d.interaction && isAbigailS3bActionSemantic(continuationAbility)) {
        if (!exactRestoreValue(d.candidates, abigailS3bTargetCandidates(s, d.context, continuationAbility)) ||
            d.min !== 0 || d.max !== Math.min(ABIGAIL_S3B_MAX_PLAY_COUNT, d.candidates.length)) {
          reject('resolution_failed', 'Abigail S3b pending target provenance changed');
        }
        validateAbigailS3bActionContinuation(s, d.context, continuationAbility, selected);
      }
      if (!d.interaction && isZoukenAscensionActionSemantic(continuationAbility)) {
        validateZoukenAscensionPendingContinuation(s, d.context, continuationAbility, selected);
      }
      d.context.selections[str(d.target.id)] = selected; delete r.pendingDecision;
      executeEffects(s, d.context, d.remainingEffects); break;
    }
    case 'resolve_response': {
      const w = r.responseWindows[0];
      if (!w || w.controllerId !== playerId || w.id !== command.windowId || !legal.some(a => a.type === command.type && a.cardInstanceId === command.cardInstanceId && a.abilityId === command.abilityId)) reject('illegal_response', 'Response is not available');
      executeAbility(s, context(s, command.cardInstanceId, command.abilityId, w.event)); runtime(s).responseWindows.shift(); break;
    }
    case 'pass': case 'decline_this_window': {
      const w = r.responseWindows[0]; if (!w || w.controllerId !== playerId || w.id !== command.windowId) reject('illegal_response', 'Window is not available');
      r.responseWindows.shift(); break;
    }
    default: reject('illegal_action', 'Unsupported client command');
  }
  cleanupOngoing(s); checkFormulaTriggers(s);
}
/** All eligibility/costs are checked against the pre-payment state; all cards activate before triggers. */
function playBatch(s: GameState, playerId: string, choices: PlayCardAction[], quota: 'regular' | 'effect' = 'regular', allowDiscard = false): void {
  if (new Set(choices.map(c => c.cardInstanceId)).size !== choices.length) reject('illegal_action', 'Duplicate card in play batch');
  const requiredAdditionalIds = new Set(choices
    .filter(c => isRequiredAdditionalPlayCard(s, c.cardInstanceId))
    .map(c => c.cardInstanceId));
  const regularAttackChoices = choices.filter(c =>
    entersAttackArea(s, c.cardInstanceId) && !requiredAdditionalIds.has(c.cardInstanceId)).length;
  if (quota === 'regular' && requiredAdditionalIds.size > 0 && regularAttackChoices === 0) {
    reject('append_only', 'Required additional-play cards need a regular attack in the same batch');
  }
  if (quota === 'regular' && attacksDeclaredThisRound(s, playerId) + regularAttackChoices > attackPlayAllowance(s, playerId)) {
    reject('attack_play_limit_reached', 'Attack play limit reached for this round');
  }
  let cost = 0;
  for (const c of choices) {
    const allowRequiredAdditional = quota === 'regular' && requiredAdditionalIds.has(c.cardInstanceId) && regularAttackChoices > 0;
    const discardAllowed = allowDiscard && quota === 'effect';
    const failure = playFailure(s, playerId, c.cardInstanceId, c.faceDown === true, true, quota === 'effect', quota === 'effect', allowRequiredAdditional, discardAllowed);
    if (failure) reject(failure, 'Card cannot be played in this batch');
    if (!c.faceDown) cost += Number(definition(s, c.cardInstanceId)!.cardFace.cost ?? 0);
  }
  if (cost > player(s, playerId).mana) reject('insufficient_mana', 'Cannot pay aggregate batch cost');
  const playedCards = choices.map(c => ({ instanceId: c.cardInstanceId, controllerId: playerId,
    cardType: definition(s, c.cardInstanceId)!.cardType, faceDown: !!c.faceDown }));
  player(s, playerId).mana -= cost;
  for (const c of choices) {
    moveCard(s, c.cardInstanceId, cardPlayClassification(s, c.cardInstanceId).destinationZone);
    const limit = perGamePlayLimit(definition(s, c.cardInstanceId)!);
    if (limit) runtime(s).abilityUsage[`play:${c.cardInstanceId}:${limit.key}`] = (runtime(s).abilityUsage[`play:${c.cardInstanceId}:${limit.key}`] ?? 0) + 1;
    runtime(s).cardState[c.cardInstanceId] = { active: !c.faceDown, faceDown: !!c.faceDown, playedRound: s.round.roundNumber };
    if (c.faceDown) card(s, c.cardInstanceId).visibility = { scope: 'owner_only', ownerPlayerId: playerId };
    
    // Track noble phantasm costs for cards with 宝具 attribute
    const d = definition(s, c.cardInstanceId);
    if (d && !c.faceDown) {
      const attributes = Array.isArray(d.cardFace.attributes) ? d.cardFace.attributes : [];
      if (attributes.includes('宝具')) {
        const cardCost = Number(d.cardFace.cost ?? 0);
        if (!runtime(s).noblePhantasmCostsThisRound[playerId]) {
          runtime(s).noblePhantasmCostsThisRound[playerId] = [];
        }
        runtime(s).noblePhantasmCostsThisRound[playerId]!.push({
          cardId: c.cardInstanceId,
          cost: cardCost
        });
      }
      // Track consecutive play rounds for this card definition
      const defId = d.id;
      const prevRound = runtime(s).consecutivePlayRounds[defId];
      if (prevRound === s.round.roundNumber - 1) {
        runtime(s).consecutivePlayRounds[defId] = (runtime(s).consecutivePlayRounds[defId] ?? 1) + 1;
      } else {
        runtime(s).consecutivePlayRounds[defId] = 1;
      }
    }
  }
  const counters = runtime(s).playCounters ??= {
    round: s.round.roundNumber,
    cardsPlayedByPlayer: {},
    attacksDeclaredByPlayer: {},
  };
  if (counters.round !== s.round.roundNumber) {
    counters.round = s.round.roundNumber;
    counters.cardsPlayedByPlayer = {};
    counters.attacksDeclaredByPlayer = {};
  }
  counters.cardsPlayedByPlayer[playerId] = (counters.cardsPlayedByPlayer[playerId] ?? 0) + choices.length;
  if (quota === 'regular') {
    counters.attacksDeclaredByPlayer[playerId] = (counters.attacksDeclaredByPlayer[playerId] ?? 0) + regularAttackChoices;
  }
  for (const c of choices.filter(c => !c.faceDown)) {
    processEvent(s, { id: nextId(s, 'declare'), type: 'on_use_declared', playerId, sourceCardId: c.cardInstanceId, playedCards });
    processEvent(s, { id: nextId(s, 'play'), type: 'on_card_played', playerId, sourceCardId: c.cardInstanceId, playedCards });
  }
}
/** Trusted server hook after the enclosing action validates its normal/effect play quota. Not an AbilityCommand. */
export function playAbilityCardBatch(s: GameState, playerId: string, choices: Omit<PlayCardAction, 'type'>[]): void {
  const r = runtime(s);
  if (r.pendingDecision || r.responseWindows.length || r.hostRequests.length) reject('pending_resolution', 'Resolve current decision first');
  const copy = structuredClone(s);
  playBatch(copy, playerId, choices.map(c => ({ ...c, type: 'play_card' })));
  runtime(copy).revision++; Object.assign(s, copy);
}
/** Transactional mutation of server state; only a safe DTO is returned, even on rejection. */
export function dispatchAbilityCommand(s: GameState, playerId: string, command: AbilityCommand): DispatchResult {
  const before = runtime(s).events.length; const beforeCalculations = runtime(s).calculations.length; const copy = structuredClone(s);
  copyOpponentCloseToOneServerAuthority(s, copy);
  try {
    dispatch(copy, playerId, command); runtime(copy).revision++; Object.assign(s, copy);
    copyOpponentCloseToOneServerAuthority(copy, s);
    return { ok: true, view: projectAbilityState(s, playerId),
      events: runtime(s).events.slice(before).filter(e => !e.visibility || e.visibility === playerId).map(({ visibility: _, ...e }) => e),
      calculations: runtime(s).calculations.slice(beforeCalculations).filter(c => c.controllerId === playerId).flatMap(c => c.lines) };
  } catch (error) {
    if (!(error instanceof RuleRejection)) throw error;
    const sourceId = command && 'cardInstanceId' in command ? command.cardInstanceId : undefined;
    const source = s.cards.find(c => c.instanceId === sourceId && c.controllerPlayerId === playerId);
    const blocked = source ? definition(s, source.instanceId)?.abilities.find(a => a.execution.mode === 'host_adjudicated') : undefined;
    return { ok: false, view: projectAbilityState(structuredClone(s), playerId), events: [], calculations: [], rejection: { code: error.code, message: error.message,
      ...(error.code === 'host_adjudicated' && blocked ? { allowedOperations: blocked.execution.allowedOperations } : {}) } };
  }
}
/** The transport should expose only dispatch/view; phase and event hooks are trusted server operations. */
export function createAbilitySession(initialState: GameState) {
  const authority = structuredClone(initialState);
  return {
    dispatch: (authenticatedPlayerId: string, command: AbilityCommand) => dispatchAbilityCommand(authority, authenticatedPlayerId, command),
    view: (authenticatedPlayerId: string) => projectAbilityState(authority, authenticatedPlayerId),
    processEvent: (event: AbilityEvent) => processAbilityEvent(authority, event),
    advancePhase: (next: PhaseName, round?: number) => advanceAbilityPhase(authority, next, round),
  };
}
