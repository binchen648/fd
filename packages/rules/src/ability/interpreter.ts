import type { GameState, PhaseName } from '../schema/game';
import type { CardInstance } from '../schema/card';
import type { LocationId } from '../schema/location';
import { canOccupyLocation, getEnabledLocations } from '../core/map-engine';
import { ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID, evaluateCardSourceValidity, isActiveCardSource } from '../core/card-source-state';
import {
  isPrivateOptionalHandPlayInteractionCandidate, isPrivateOptionalHandPlayInteractionSemantic,
  isSameBattlefieldPrivateHandReturnInteractionCandidate, isSameBattlefieldPrivateHandReturnInteractionSemantic,
} from './interaction-gateway';
import { checkExtendedCondition, resolveExtendedEffect } from './extended-effects';
import { clearTransientCardTransformState, getEffectiveCardAttributes } from './card-instance-state';
import { commandSpellPhaseOverride, grantMana, ignoresSituationPlayForbid, installGameStartRuleOverride, installRulerSealMovementLock, isExactGameStartRuleOverrideEffect, movementLockedByPersistentRule, persistentExtraAttackAllowance, rulerSealMovementLocked, situationForbidsAttribute } from '../core/rule-overrides';
import { node, nodes, str } from './loader';
import { isGameStartSkillProvisioningCandidate, isGameStartSkillProvisioningSemantic } from './game-start-skill-provisioning';
import { hasRequiredAdditionalPlayMarker } from './required-additional-play';
import {
  eligibleLeastBoundPlayerIds, isLeastBoundSelection, isRulerSealBindingCandidate, isRulerSealBindingSemantic,
  isRulerSealUseCandidate, isRulerSealUseSemantic, unspentRulerSealBindings,
} from './ruler-seal';
import { currentDeploymentBonus } from '../core/terrain-advantage';
import { eventRulePlacementByInstance, initializeEventRulePlacements, listEventRuleCandidates, moveEventRuleCandidate, moveEventRuleCandidates, type EventRuleZone } from './event-rule';
import { applyOuterGodLifeUse, isOuterGodLifeAbilityCandidate, isOuterGodLifeAbilitySemantic, settlePendingSourceCardReturns } from './outer-god-life';
import { classifyAcceptedSkillUseForbidModifier, definitionHasStructuralTrueNameRelease, isAcceptedStaticWhileActiveSkillUseForbidAbility } from './skill-use-forbid';
import { isCardCloseForbidden } from './card-close-forbid';
import { faceUpCardPlayLimitReached, recordCompletedFaceUpCardPlay } from './face-up-cards-per-round';
import { currentRoundCombatLossAbsent, isAcceptedCurrentRoundCombatLossAbsenceCondition } from './current-round-combat-loss-condition';
import { eventLocationEqualsController, isAcceptedEventLocationEqualsControllerCondition } from './event-location-equals-controller';
import {
  currentRoundCombatWinAbsent,
  isAcceptedCurrentRoundCombatWinAbsenceCondition,
  recordCurrentRoundCombatWinsFromBattleResult,
} from './current-round-combat-win-condition';
import {
  assignGameStartPlayerStatuses,
  gameStartPlayerStatusAssignments,
  isGameStartPlayerStatusAssignmentCandidate,
  isGameStartPlayerStatusAssignmentSemantic,
} from './game-start-player-status-assignment';
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
  BattleResult, BattleResultData, CalculationLine, CardPlayClassification, DispatchResult, EffectContext, ExecutableCardDefinition,
  LegalAction, OngoingEffect, PendingDecision, RuleNode, TriggeredAbility,
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
function definition(s: GameState, id: string): AuthoringCard | undefined {
  const physical = s.cards.find((candidate) => candidate.instanceId === id);
  if (physical) return runtime(s).pack.cards[physical.definitionId];
  const eventPlacement = eventRulePlacementByInstance(s, id);
  return eventPlacement ? runtime(s).pack.eventRules?.[eventPlacement.eventCardId] : undefined;
}
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
  const physical = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  if (physical) return { sourceCardId, abilityId, controllerId: physical.controllerPlayerId, variables: {}, selections: {}, ...(event ? { event } : {}) };
  const placement = eventRulePlacementByInstance(s, sourceCardId);
  if (!placement) reject('illegal_action', 'Ability source is not available');
  const ability = abilityDefinition(s, sourceCardId, abilityId);
  const controllerSource = str(ability.activation.eventController);
  const controllerId = controllerSource === 'placement_controller' ? placement.ruleControllerPlayerId :
    controllerSource === 'event_player' ? event?.playerId : undefined;
  if (!controllerId || !s.players.some((candidate) => candidate.id === controllerId)) {
    reject('invalid_event', 'Event rule requires a valid structural controller context');
  }
  return { sourceCardId, abilityId, controllerId, variables: {}, selections: {}, ...(event ? { event } : {}),
    eventSource: { ruleInstanceId: sourceCardId, definitionId: placement.eventCardId, locationId: placement.locationId } };
}
export function initializeAbilityRuntime(s: GameState, pack: AbilityDefinitionPack, options: { seed?: number; roomMode?: 'standard' | 'development'; playRulesVersion?: 'legacy-v0' | 'explicit-v1' } = {}): void {
  if (s.abilityRuntime) reject('already_initialized', 'Ability runtime already exists');
  s.abilityRuntime = { pack: structuredClone(pack), revision: 0, sequence: 0, randomState: (options.seed ?? 1) >>> 0 || 1,
    cardState: {}, playerStatusKeysByPlayer: {}, ongoingEffects: [], lifecycleTransitions: [], responseWindows: [], pendingDelayedActivations: [], pendingPresenceConcealmentDefeats: [], pendingPostBattleEvents: [],
    eventRuleZoneRevision: 0, rulerSealBindings: [], rulerSealBindingHistory: {}, pendingRulerSealRewards: [],
    roundTotalPowerAdjustments: { round: s.round.roundNumber, byPlayer: {} }, pendingSourceCardReturns: [],
    usedAbilities: {}, processedEvents: [], revealedServants: [],
    events: [], calculations: [], preventEffects: false, manaCaps: {}, manaGainBlocked: [], hostRequests: [], roomMode: options.roomMode ?? 'standard',
    abilityUsage: {}, noblePhantasmCostsThisRound: {}, consecutivePlayRounds: {},
    movementDistanceThisRound: {}, battlefieldsPassedOrStayedThisRound: {},
    manaGainedThisRound: { round: s.round.roundNumber, byPlayer: {} },
    playRulesVersion: options.playRulesVersion ?? 'explicit-v1',
    playCounters: { round: s.round.roundNumber, cardsPlayedByPlayer: {}, faceUpCardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} } };
  initializeEventRulePlacements(s, pack);
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
      if (name === 'controller.deployment_bonus') return currentDeploymentBonus(s, controllerId);
      if (name === 'game.round_number') return s.round.roundNumber;
      if (name === 'source_card_active_round_count') {
        const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
        const sourceState = runtime(s).cardState[sourceCardId];
        const currentRound = s.round.roundNumber;
        const playedRound = sourceState?.playedRound;
        if (!source || !['field', 'attack_area'].includes(source.zone) || sourceState?.active !== true || sourceState.faceDown === true ||
          !Number.isSafeInteger(currentRound) || currentRound < 1 || !Number.isSafeInteger(playedRound) ||
          (playedRound as number) < 1 || (playedRound as number) > currentRound) {
          reject('invalid_variable', 'source_card_active_round_count requires a valid active source-card round state');
        }
        return currentRound - (playedRound as number) + 1;
      }
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
  if (!movementLockedByPersistentRule(s, ctx.controllerId) && !rulerSealMovementLocked(s, ctx.controllerId)) return false;
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
  if (target.type === 'event_card') {
    const rawZones = node(target.scope).zones;
    const zones = (Array.isArray(rawZones) ? rawZones : []).map((zone: unknown) => str(zone)) as EventRuleZone[];
    if (!zones.length || zones.some((zone) => !['event_deck', 'event_discard', 'event_outside_game', 'event_battlefield'].includes(zone))) {
      reject('unsupported', 'Event-card selection requires supported event zones');
    }
    return listEventRuleCandidates(s, runtime(s).pack, zones)
      .filter((candidate) => nodes(target.constraints).every((entry) => {
        if (entry.type === 'event_has_tag') return candidate.tags.includes(str(entry.tag));
        if (entry.type === 'event_in_set') return candidate.eventSetIds.includes(str(entry.eventSetId));
        return reject('unsupported', `Unsupported event-card constraint: ${str(entry.type)}`);
      }))
      .map((candidate) => candidate.token);
  }
  if (target.type === 'player') {
    return s.players.filter(candidate =>
      candidate.status === 'active' &&
      nodes(target.constraints).every(c => {
        if (c.type === 'not_controller') return candidate.id !== ctx.controllerId;
        if (c.type === 'least_ruler_binding_count') return eligibleLeastBoundPlayerIds(s, ctx.controllerId, 2).includes(candidate.id);
        if (c.type === 'bound_by_controller_ruler_seal') return unspentRulerSealBindings(s, ctx.controllerId, candidate.id).length > 0;
        if (c.type === 'at_battlefield') return isBattlefield(s, candidate.locationId);
        if (c.type === 'same_battlefield_as_controller') {
          const controllerLocationId = player(s, ctx.controllerId).locationId;
          return isBattlefield(s, controllerLocationId) && candidate.locationId === controllerLocationId;
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

export function isEventPlayerRelationCondition(c: RuleNode): boolean {
  return ['event_player_is_controller', 'event_player_is_opponent'].includes(str(c.type)) &&
    Object.keys(c).every((key) => key === 'type');
}

function eventPlayerRelationCondition(s: GameState, ctx: EffectContext, c: RuleNode): boolean {
  if (!isEventPlayerRelationCondition(c)) reject('unsupported', 'Unsupported event-player relation condition shape');
  const eventPlayerId = ctx.event?.playerId;
  if (!eventPlayerId || !s.players.some((candidate) => candidate.id === eventPlayerId)) return false;
  return c.type === 'event_player_is_controller'
    ? eventPlayerId === ctx.controllerId
    : eventPlayerId !== ctx.controllerId;
}

export function isSourceStateCondition(c: RuleNode): boolean {
  return ['source_active', 'source_owned'].includes(str(c.type)) &&
    Object.keys(c).every((key) => key === 'type');
}

function sourceStateCondition(s: GameState, ctx: EffectContext, c: RuleNode): boolean {
  if (!isSourceStateCondition(c)) reject('unsupported', 'Unsupported source-state condition shape');
  const source = s.cards.find((candidate) => candidate.instanceId === ctx.sourceCardId);
  if (!source) return false;
  return c.type === 'source_active'
    ? active(s, source.instanceId)
    : source.ownerPlayerId === ctx.controllerId;
}

export function isEventCombatOutcomeCondition(c: RuleNode): boolean {
  return ['event_player_won_combat', 'event_player_lost_combat'].includes(str(c.type)) &&
    Object.keys(c).every((key) => key === 'type');
}

function eventCombatOutcomeCondition(s: GameState, ctx: EffectContext, c: RuleNode): boolean {
  if (!isEventCombatOutcomeCondition(c)) reject('unsupported', 'Unsupported event combat outcome condition shape');
  const eventPlayerId = ctx.event?.playerId;
  const result = ctx.event?.battleResult;
  if (!eventPlayerId || !s.players.some((candidate) => candidate.id === eventPlayerId) || !result ||
    !Array.isArray(result.winners) || !Array.isArray(result.loserIds)) return false;
  const knownPlayerIds = new Set(s.players.map((candidate) => candidate.id));
  const winners = result.winners;
  const losers = result.loserIds;
  if ([...winners, ...losers].some((playerId) => !knownPlayerIds.has(playerId)) ||
    new Set(winners).size !== winners.length || new Set(losers).size !== losers.length ||
    winners.some((playerId) => losers.includes(playerId))) return false;
  return c.type === 'event_player_won_combat'
    ? winners.includes(eventPlayerId)
    : losers.includes(eventPlayerId);
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
    case 'event_location_is_source_event_battlefield': return !!ctx.eventSource &&
      (ctx.event?.locationId ?? ctx.event?.battlefieldId) === ctx.eventSource.locationId;
    case 'combat_occurs_at_source_event_battlefield': return !!ctx.eventSource &&
      (ctx.event?.battlefieldId ?? ctx.event?.locationId) === ctx.eventSource.locationId;
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
    case 'event_player_is_controller':
    case 'event_player_is_opponent': return eventPlayerRelationCondition(s, ctx, c);
    case 'source_active':
    case 'source_owned': return sourceStateCondition(s, ctx, c);
    case 'event_player_won_combat':
    case 'event_player_lost_combat': return eventCombatOutcomeCondition(s, ctx, c);
    case 'event_location_equals_controller': {
      if (!isAcceptedEventLocationEqualsControllerCondition(c)) {
        return reject('unsupported', 'Unsupported event-location relation condition shape');
      }
      return eventLocationEqualsController(s, ctx.controllerId, ctx.event);
    }
    case 'player_flag_number_not_current_round': {
      if (isAcceptedCurrentRoundCombatLossAbsenceCondition(c)) return currentRoundCombatLossAbsent(s, ctx.controllerId, ctx.event);
      if (isAcceptedCurrentRoundCombatWinAbsenceCondition(c)) return currentRoundCombatWinAbsent(s, ctx.controllerId, ctx.event);
      return reject('unsupported', c.key === 'combatWinRound'
        ? 'Unsupported current-round combat-win absence condition shape'
        : 'Unsupported current-round combat-loss absence condition shape');
    }
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
function acceptedSkillUseForbidApplies(s: GameState, modifierControllerId: string, modifierSourceId: string, targetPlayerId: string, targetSourceId: string, modifier: RuleNode): boolean {
  const variant = classifyAcceptedSkillUseForbidModifier(modifier);
  if (!variant) return false;
  const source = s.cards.find((candidate) => candidate.instanceId === modifierSourceId);
  const target = s.cards.find((candidate) => candidate.instanceId === targetSourceId);
  const targetDefinition = definition(s, targetSourceId);
  if (!source || !target || !targetDefinition || !['master_skill', 'servant_skill'].includes(targetDefinition.cardType)) return false;
  if (source.controllerPlayerId !== modifierControllerId) return false;
  const sourceLocation = player(s, source.controllerPlayerId).locationId;
  const targetLocation = player(s, targetPlayerId).locationId;
  if (!sourceLocation || targetLocation !== sourceLocation) return false;
  if (variant === 'same_location_true_name_off_attack') {
    return target.zone !== 'attack_area' && definitionHasStructuralTrueNameRelease(targetDefinition);
  }
  return targetPlayerId !== modifierControllerId && target.zone === 'skill' && runtime(s).cardState[targetSourceId]?.faceDown === true;
}
function staticWhileActiveSkillUseForbidRules(s: GameState, playerId: string, sourceId: string): string[] {
  const rules: string[] = [];
  for (const source of s.cards) {
    if (!active(s, source.instanceId)) continue;
    const sourceDefinition = definition(s, source.instanceId);
    if (!sourceDefinition) continue;
    for (const ability of sourceDefinition.abilities) {
      if (!isAcceptedStaticWhileActiveSkillUseForbidAbility(ability)) continue;
      const modifier = ability.ruleModifiers[0]!;
      if (acceptedSkillUseForbidApplies(s, source.controllerPlayerId, source.instanceId, playerId, sourceId, modifier)) rules.push('skill_use');
    }
  }
  return rules;
}
function ongoingCardPlayForbidRules(s: GameState, playerId: string, sourceId: string): string[] {
  const d = definition(s, sourceId); if (!d) return ['missing_definition'];
  const targetPlayer = player(s, playerId);
  const ongoingRules = liveOngoing(s).flatMap(o => o.ruleModifiers).flatMap(({ controllerId, sourceCardId, definition: m }) => {
    const controller = player(s, controllerId); const scope = node(m.scope);
    const appliesToSameBattlefieldOpponent = ['opponents_at_same_battlefield', 'engaged_opponents_same_battlefield'].includes(str(scope.subject)) ||
      ['opponents_at_same_battlefield', 'engaged_opponents_same_battlefield'].includes(str(scope.object));
    if (appliesToSameBattlefieldOpponent && (controllerId === playerId || !sameBattlefield(s, controller.locationId, targetPlayer.locationId))) return [];
    if (m.operation !== 'forbid') return [];
    if (m.rule === 'skill_use' && acceptedSkillUseForbidApplies(s, controllerId, sourceCardId, playerId, sourceId, m)) return ['skill_use'];
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
  return staticWhileActiveSkillUseForbidRules(s, playerId, sourceId).concat(ongoingRules, matchRules);
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
function canActivate(s: GameState, sourceId: string, a: AuthoringAbility, event?: AbilityEvent): boolean {
  if (a.execution.mode !== 'automatic') return false;
  if (isPlayActionStructuralCandidate(a) && !isPlayActionRouteCandidate(a)) return false;
  if (isPlaySourceCardWithCostResponseStructuralCandidate(a) && !isPlaySourceCardWithCostResponseRouteCandidate(a)) return false;
  if (isAddToAttackStructuralCandidate(a) && !isAddToAttackRouteCandidate(a)) return false;
  if (isFixedControllerAdvanceDrawActionCandidate(a) && !isFixedControllerAdvanceDrawActionSemantic(a)) return false;
  if (isAnyLocationExceptWorkshopMovementCandidate(a) && !isAnyLocationExceptWorkshopMovementSemantic(a)) return false;
  if (isMagicResistancePowerModifierCandidate(a) && !isMagicResistancePowerModifierSemantic(a)) return false;
  if (isPresenceConcealmentAssassinationCandidate(a) && !isPresenceConcealmentAssassinationSemantic(a)) return false;
  if (isAlterEgoTransformCandidate(a) && !isAlterEgoTransformSemantic(a)) return false;
  if (isGameStartRuleOverrideCandidate(a) && !isGameStartRuleOverrideSemantic(a)) return false;
  if (isGameStartFixedControllerManaSetCandidate(a) && !isGameStartFixedControllerManaSetSemantic(a)) return false;
  if (isGameStartSkillProvisioningCandidate(a) &&
    (!isGameStartSkillProvisioningSemantic(a) || !gameStartSkillProvisioningPreflight(s, sourceId, a))) return false;
  if (isGameStartPlayerStatusAssignmentCandidate(a) &&
    (!isGameStartPlayerStatusAssignmentSemantic(a) ||
      !gameStartPlayerStatusAssignments(s, card(s, sourceId).controllerPlayerId, a))) return false;
  if (isOuterGodLifeAbilityCandidate(a) && !isOuterGodLifeAbilitySemantic(a)) return false;
  if (hasControllerMasterSkillDefinitionReturnCandidate(a)) return false;
  if (a.activation.requiresSourceState === 'active' && !active(s, sourceId)) return false;
  if (runtime(s).cardState[sourceId]?.faceDown) return false;
  const activationPhase = effectiveActivationPhase(s, sourceId, a);
  if (activationPhase && activationPhase !== phase(s)) return false;
  if (definition(s, sourceId)?.cardType === 'command_spell' &&
    Number((player(s, card(s, sourceId).controllerPlayerId) as unknown as { commandSpells?: number }).commandSpells ?? 3) <= 0) return false;
  if (isBattleLossResourceTriggerSemantic(a) &&
    Number((player(s, card(s, sourceId).controllerPlayerId) as unknown as { commandSpells?: number }).commandSpells ?? 3) <= 0) return false;
  if (!isRulerSealUseSemantic(a) && !isCommandSpellCard(s, sourceId) && a.kind === 'phase_action' && runtime(s).usedAbilities[`${sourceId}:${a.id}`] === s.round.roundNumber) return false;
  if (abilityLimitReached(s, sourceId, a)) return false;
  if ((isPlayActionRouteCandidate(a) || isAddToAttackRouteCandidate(a) || isAnyLocationExceptWorkshopMovementSemantic(a) ||
    isRulerSealBindingSemantic(a) || isRulerSealUseSemantic(a)) &&
    !hasMandatoryTargetAvailability(s, context(s, sourceId, a.id, event), a)) return false;
  if (isPlaySourceCardWithCostResponseRouteCandidate(a)) {
    const ctx = context(s, sourceId, a.id, event);
    if (!hasPlayableSourceCardInHand(s, ctx)) return false;
    if (playFailure(s, ctx.controllerId, sourceId, false, true, true, true)) return false;
    if (!hasAvailableManaForFixedCosts(s, ctx, a)) return false;
  }
  if (isFixedControllerAdvanceDrawActionSemantic(a) &&
    !hasAvailableManaForFixedCosts(s, context(s, sourceId, a.id, event), a)) return false;
  if (isCloseSourceCardOnPlayedTrigger(a) && closeSourceStateError(s, sourceId, card(s, sourceId).controllerPlayerId)) return false;
  if (isAlterEgoTransformSemantic(a)) {
    const ctx = context(s, sourceId, a.id, event);
    if (!alterEgoTriggerTarget(s, sourceId, event)) return false;
    if (classifyAlterEgoTransformVariant(a) === 'ex' && !hasAvailableManaForFixedCosts(s, ctx, a)) return false;
  }
  return a.conditions.every(c => condition(s, context(s, sourceId, a.id, event), c));
}
function isGameStartRuleOverrideCandidate(a: AuthoringAbility): boolean {
  return a.effects.some((effect) => effect.type === 'install_rule_override');
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

function provisionedSkillCardIsValid(s: GameState, instance: CardInstance, controllerId: string): boolean {
  const state = runtime(s).cardState[instance.instanceId];
  return instance.ownerPlayerId === controllerId && instance.controllerPlayerId === controllerId &&
    instance.zone === 'skill' && instance.visibility.scope === 'owner_only' &&
    instance.visibility.ownerPlayerId === controllerId && state?.active !== true && state?.faceDown !== true;
}

function gameStartSkillProvisioningPreflight(s: GameState, sourceId: string, a: AuthoringAbility): boolean {
  const source = card(s, sourceId); const controller = player(s, source.controllerPlayerId);
  const sourceDefinition = definition(s, sourceId) as ExecutableCardDefinition | undefined;
  if (source.ownerPlayerId !== controller.id || source.zone !== 'skill' || sourceDefinition?.cardType !== 'master_skill' ||
    sourceDefinition.ownerId !== controller.masterCardId) return false;
  const targets = a.effects[0]?.targetDefinitionIds;
  if (!Array.isArray(targets)) return false;
  for (const definitionId of targets) {
    if (typeof definitionId !== 'string') return false;
    const target = runtime(s).pack.cards[definitionId] as ExecutableCardDefinition | undefined;
    if (!target || target.mode !== 'automatic' || target.cardType !== 'master_skill' ||
      target.ownerId !== controller.masterCardId || target.initialZone !== undefined) return false;
    const existing = s.cards.filter((candidate) => candidate.definitionId === definitionId);
    if (existing.length > 1 || (existing.length === 1 && !provisionedSkillCardIsValid(s, existing[0]!, controller.id))) return false;
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
function playFailure(s: GameState, p: string, sourceId: string, faceDown = false, ignoreStagedAttackLimit = false, ignoreAttackLimit = false, ignoreTiming = false, allowRequiredAdditionalPlay = false, ignoreManaCost = false): string | undefined {
  const c = card(s, sourceId); const d = definition(s, sourceId); if (!d) return 'unsupported';
  if (d.mode !== 'automatic') return d.mode;
  if (c.controllerPlayerId !== p || !['hand', 'skill'].includes(c.zone) || player(s, p).status !== 'active') return 'illegal_action';
  if (c.zone === 'skill' && isActivationOnlyDefinition(s, c.definitionId)) return 'activation_only';
  const hasLegacyAppendOnlyMarker = d.abilities.some(a => a.effects.some(effect => effect.type === 'append_only_rule' && effect.rule !== 'ignore_battle_loss_effects'));
  const requiredAdditionalPlay = hasRequiredAdditionalPlayMarker(d);
  if (hasLegacyAppendOnlyMarker && (!allowRequiredAdditionalPlay || !requiredAdditionalPlay)) return 'append_only';
  if (!ignoreTiming && (phase(s) !== d.playTiming.phase || s.round.prioritySeat !== player(s, p).seat)) return 'illegal_timing';
  if (faceDown && (!isAttack(d) || d.cardType === 'servant_skill')) return 'illegal_face_down';
  const forbidRules = ongoingCardPlayForbidRules(s, p, sourceId);
  if (forbidRules.some(rule => !hasPlayRuleException(d, rule))) return 'play_forbidden';
  if (!faceDown && faceUpCardPlayLimitReached(s, p)) return 'face_up_card_play_limit_reached';
  const limit = perGamePlayLimit(d);
  if (limit && (runtime(s).abilityUsage[`play:${sourceId}:${limit.key}`] ?? 0) >= limit.uses) return 'card_limit_reached';
  if (!ignoreAttackLimit && attackPlayLimitReached(s, p, sourceId, ignoreStagedAttackLimit)) return 'attack_play_limit_reached';
  const requirements = d.playRequirements.concat(nodes(d.cardFace.requirements)).filter(r =>
    str(r.type) && !(str(r.type) === 'skill_zone_mana_at_least' && hasPlayRuleException(d, 'skill_zone_mana_at_least')));
  if (!requirements.every(r => condition(s, context(s, sourceId, ''), r))) return 'play_requirement';
  
  if (!ignoreManaCost && !faceDown && player(s, p).mana < Number(d.cardFace.cost ?? 0)) return 'insufficient_mana';
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
      const costs = a.cost.filter(x => x.type === 'pay_mana' && node(x.amount).var).map(x => ({ name: str(node(x.amount).var), min: 0, max: p.mana }));
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
      const allowsOpponentMovementEvent = event.type === 'after_controller_enters_location' &&
        a.conditions.some((entry) => isEventPlayerRelationCondition(entry) && entry.type === 'event_player_is_opponent');
      if (event.type.startsWith('after_controller_') && event.playerId !== c.controllerPlayerId &&
        !allowsOpponentMovementEvent) continue;
      found.push({ cardInstanceId: c.instanceId, abilityId: a.id, controllerId: c.controllerPlayerId });
    }
  }
  const turnSeats = s.players.slice().sort((a, b) => a.seat - b.seat); const start = turnSeats.findIndex(p => p.seat === s.round.prioritySeat);
  const ordered = [...turnSeats.slice(Math.max(0, start)), ...turnSeats.slice(0, Math.max(0, start))];
  return found.sort((a, b) => ordered.findIndex(p => p.id === a.controllerId) - ordered.findIndex(p => p.id === b.controllerId));
}
function collectTriggeredEventRuleAbilities(s: GameState, event: AbilityEvent): Array<{ ruleInstanceId: string; abilityId: string; controllerId: string }> {
  const found: Array<{ ruleInstanceId: string; abilityId: string; controllerId: string }> = [];
  for (const placement of s.eventPlacements) {
    if (!placement.ruleInstanceId) continue;
    const eventDefinition = runtime(s).pack.eventRules?.[placement.eventCardId];
    if (!eventDefinition) continue;
    for (const ability of eventDefinition.abilities) {
      if (ability.activation.trigger !== event.type) continue;
      const interaction = classifyAbilityInteraction(ability);
      if (!['automatic_trigger', 'automatic_rule'].includes(interaction.kind)) {
        reject('unsupported', 'Executable event rules currently require an automatic trigger/rule interaction');
      }
      const ctx = context(s, placement.ruleInstanceId, ability.id, event);
      if (event.type.startsWith('after_controller_') && event.playerId !== ctx.controllerId) continue;
      if (!ability.conditions.every((entry) => condition(s, ctx, entry))) continue;
      found.push({ ruleInstanceId: placement.ruleInstanceId, abilityId: ability.id, controllerId: ctx.controllerId });
    }
  }
  return found.sort((a, b) => a.ruleInstanceId.localeCompare(b.ruleInstanceId) || a.abilityId.localeCompare(b.abilityId));
}

function executeEventRuleAbility(s: GameState, sourceId: string, abilityId: string, event: AbilityEvent): void {
  const ability = abilityDefinition(s, sourceId, abilityId);
  if (ability.execution.mode !== 'automatic') reject(ability.execution.mode, 'Event rule requires automatic execution');
  if (ability.cost.length || ability.targets.length || ability.creates.length || ability.ruleModifiers.length || Object.keys(ability.lifecycle).length) {
    reject('unsupported', 'FB2-28 event-rule bridge currently accepts trigger/condition/effect rules without card-interaction or ongoing lifecycle fields');
  }
  const ctx = context(s, sourceId, abilityId, event);
  if (!ability.conditions.every((entry) => condition(s, ctx, entry))) return;
  for (const effect of ability.effects) resolveEffect(s, ctx, effect);
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
    case 'move_source_event': {
      if (!ctx.eventSource || ctx.eventSource.ruleInstanceId !== ctx.sourceCardId) reject('invalid_event', 'move_source_event requires an event-rule source');
      const to = node(effect.to);
      const destination = str(to.zone) as EventRuleZone;
      const token = listEventRuleCandidates(s, r.pack, ['event_battlefield'])
        .find((candidate) => candidate.ruleInstanceId === ctx.eventSource!.ruleInstanceId)?.token;
      if (!token) reject('invalid_event', 'Event-rule source placement is no longer active');
      let locationId = str(to.locationId);
      const locationRef = str(to.locationRef);
      if (locationRef) locationId = ctx.selections[locationRef]?.[0] ?? '';
      if (!locationId && str(to.location) === 'controller') locationId = player(s, ctx.controllerId).locationId ?? '';
      moveEventRuleCandidate(s, r.pack, token, destination, {
        ...(locationId ? { locationId } : {}),
        ...(['self', 'controller'].includes(str(to.controller)) ? { ruleControllerPlayerId: ctx.controllerId } : {}),
        ...(['public', 'hidden_until_trigger'].includes(str(to.visibility)) ? { visibility: str(to.visibility) as 'public' | 'hidden_until_trigger' } : {}),
      });
      break;
    }
    case 'move_event_card': {
      const selected = ctx.selections[str(effect.target)] ?? [];
      if (!selected.length) reject('invalid_target', 'move_event_card requires one or more selected events');
      const to = node(effect.to);
      const destination = str(to.zone) as EventRuleZone;
      let locationId = str(to.locationId);
      const locationRef = str(to.locationRef);
      if (locationRef) locationId = ctx.selections[locationRef]?.[0] ?? '';
      if (!locationId && str(to.location) === 'controller') locationId = player(s, ctx.controllerId).locationId ?? '';
      const assignController = ['self', 'controller'].includes(str(to.controller));
      moveEventRuleCandidates(s, r.pack, selected, destination, {
        ...(locationId ? { locationId } : {}),
        ...(assignController ? { ruleControllerPlayerId: ctx.controllerId } : {}),
        ...(['public', 'hidden_until_trigger'].includes(str(to.visibility)) ? { visibility: str(to.visibility) as 'public' | 'hidden_until_trigger' } : {}),
      });
      break;
    }
    case 'return_card_by_definition': resolveControllerMasterSkillDefinitionReturn(s, ctx, effect); break;
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
      if (effect.face !== 'face_down' && faceUpCardPlayLimitReached(s, p.id)) reject('face_up_card_play_limit_reached', 'Face-up card play limit reached for this round');
      moveCard(s, ctx.sourceCardId, cardPlayClassification(s, ctx.sourceCardId).destinationZone);
      r.cardState[ctx.sourceCardId] = { active: effect.face === 'face_down' ? false : true, faceDown: effect.face === 'face_down', playedRound: s.round.roundNumber };
      if (effect.face === 'face_down') source.visibility = { scope: 'owner_only', ownerPlayerId: p.id };
      else recordCompletedFaceUpCardPlay(s, p.id);
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
function findPendingTarget(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): PendingDecision | undefined {
  for (const target of a.targets.filter(t => t.type === 'choice')) {
    const targetRef = str(target.id);
    if (Object.prototype.hasOwnProperty.call(ctx.selections, targetRef)) continue;
    const count = node(target.count); const min = Number(count.min ?? 1); const max = Number(count.max ?? 1);
    const choices = candidates(s, ctx, target);
    if (choices.length < min) reject('no_legal_target', 'No legal target remains');
    return { id: nextId(s, 'decision'), controllerId: ctx.controllerId, target, candidates: choices, min, max,
      context: structuredClone(ctx), remainingEffects: effects };
  }
  for (const effect of effects) {
    if (effect.type === 'branch') {
      const branch = nodes(effect.branches).find(b => b.else !== undefined || condition(s, ctx, node(b.if)));
      const pending = branch ? findPendingTarget(s, ctx, a, nodes(branch.then ?? branch.else)) : undefined;
      if (pending) return pending;
      return undefined;
    }
    const targetRef = effect.type === 'move_player' ? str(effect.to) : str(effect.target);
    const target = a.targets.find(t => t.id === targetRef);
    if (!target) return undefined;
    if (Object.prototype.hasOwnProperty.call(ctx.selections, targetRef)) continue;
    const count = node(target.count); const min = Number(count.min ?? 1); const max = Number(count.max ?? 1);
    const choices = candidates(s, ctx, target);
    if (choices.length < min) reject('no_legal_target', 'No legal target remains');
    return { id: nextId(s, 'decision'), controllerId: ctx.controllerId, target, candidates: choices, min, max,
      context: structuredClone(ctx), remainingEffects: effects };
  }
  return undefined;
}

function createSameBattlefieldPrivateHandReturnInteraction(s: GameState, ctx: EffectContext, a: AuthoringAbility): PendingDecision {
  if (!isSameBattlefieldPrivateHandReturnInteractionSemantic(a)) reject('resolution_failed', 'Unsupported same-battlefield private hand-return interaction semantic shape');
  const playerTarget = a.targets[0]!;
  const playerTargetId = str(playerTarget.id);
  const selectedPlayerIds = ctx.selections[playerTargetId] ?? [];
  if (selectedPlayerIds.length !== 1) reject('resolution_failed', 'Private hand inspection requires exactly one selected player');
  const selectedPlayerId = selectedPlayerIds[0]!;
  const selectedPlayer = s.players.find((candidate) => candidate.id === selectedPlayerId && candidate.status === 'active');
  const controllerLocationId = player(s, ctx.controllerId).locationId;
  if (!selectedPlayer || !isBattlefield(s, controllerLocationId) || selectedPlayer.locationId !== controllerLocationId) {
    reject('illegal_target', 'Selected player is no longer at the controller battlefield');
  }
  const snapshot = s.cards.filter((candidate) => candidate.ownerPlayerId === selectedPlayerId && candidate.zone === 'hand').map((candidate) => candidate.instanceId);
  const id = nextId(s, 'interaction');
  const target: RuleNode = {
    id: 'inspected_hand_card', type: 'card_instance', scope: { zone: 'hand', owner: 'any', controller: 'any' },
    count: { min: 0, max: 1 }, visibility: 'private_to_controller',
  };
  return {
    id, controllerId: ctx.controllerId, target, candidates: [...snapshot], min: 0, max: 1,
    context: structuredClone(ctx), remainingEffects: [],
    interaction: {
      kind: 'same_battlefield_private_hand_return_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1,
      continuationRef: `${id}:continuation`, playerTargetId, selectedPlayerId,
      constraints: { kind: 'target', targetKind: 'card', min: 0, max: 1, distinct: true },
    },
  };
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

function rulerFreePlayCandidates(s: GameState, boundPlayerId: string): string[] {
  return s.cards.filter((candidate) => candidate.controllerPlayerId === boundPlayerId && candidate.zone === 'hand' &&
    !playFailure(s, boundPlayerId, candidate.instanceId, false, true, true, true, false, true)).map((candidate) => candidate.instanceId);
}

function grantRulerSealBindings(s: GameState, ctx: EffectContext): void {
  const selected = ctx.selections.bound_players ?? [];
  if (!isLeastBoundSelection(s, ctx.controllerId, selected, 2)) reject('illegal_target', 'Ruler binding must select exactly the two least-bound eligible players');
  const r = runtime(s);
  for (const boundPlayerId of selected) {
    const id = nextId(s, 'ruler-seal');
    r.rulerSealBindings.push({ id, issuerPlayerId: ctx.controllerId, boundPlayerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, grantedRound: s.round.roundNumber, spent: false });
    const issuerHistory = r.rulerSealBindingHistory[ctx.controllerId] ??= {};
    issuerHistory[boundPlayerId] = (issuerHistory[boundPlayerId] ?? 0) + 1;
    r.events.push({ type: 'ruler_seal_granted', playerId: boundPlayerId, controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
  }
}

function settleRulerSealUse(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const option = ctx.selections.ruler_seal_option ?? []; const bound = ctx.selections.bound_player ?? [];
  if (option.length !== 1 || bound.length !== 1) reject('resolution_failed', 'Ruler seal use requires one option and one bound player');
  const boundPlayerId = bound[0]!; const branch = option[0]!;
  const binding = unspentRulerSealBindings(s, ctx.controllerId, boundPlayerId)[0];
  if (!binding) reject('illegal_target', 'No unspent Ruler seal exists for this issuer and bound player');
  const effect = a.effects[0]!; const destinations = Array.isArray(effect.moveDestinations) ? effect.moveDestinations.filter((entry): entry is string => typeof entry === 'string') : [];
  const r = runtime(s);
  if (branch === 'move') {
    if (rulerSealMovementLocked(s, boundPlayerId)) reject('movement_locked', 'Bound player cannot move this round');
    const enabled = getEnabledLocations(s.map, s.locationConfig).map((location) => location.id);
    const legalDestinations = destinations.filter((id) => enabled.includes(id as LocationId));
    if (legalDestinations.length !== 2) reject('resolution_failed', 'Ruler seal move destinations are unavailable');
    binding.spent = true; binding.spentRound = s.round.roundNumber;
    const id = nextId(s, 'ruler-seal-move');
    r.pendingDecision = {
      id, controllerId: ctx.controllerId, target: { id: 'ruler_seal_destination', type: 'choice', count: { min: 1, max: 1 }, options: legalDestinations.map((destination) => ({ id: destination })) },
      candidates: legalDestinations, min: 1, max: 1, context: structuredClone(ctx), remainingEffects: [],
      interaction: { kind: 'ruler_seal_move_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
        sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: r.revision + 1, continuationRef: `${id}:continuation`,
        sealId: binding.id, issuerPlayerId: ctx.controllerId, boundPlayerId, destinations: legalDestinations,
        constraints: { kind: 'target', targetKind: 'location', min: 1, max: 1, distinct: true } },
    };
  } else if (branch === 'lock_movement') {
    binding.spent = true; binding.spentRound = s.round.roundNumber;
    installRulerSealMovementLock(s, boundPlayerId);
  } else if (branch === 'free_play_reward') {
    binding.spent = true; binding.spentRound = s.round.roundNumber;
    const rewardVp = Number(effect.rewardVp);
    if (rewardVp !== 2) reject('resolution_failed', 'Ruler seal reward must be exactly 2 VP');
    if (r.pendingRulerSealRewards.some((entry) => entry.sealId === binding.id)) reject('resolution_failed', 'Ruler seal reward already armed');
    r.pendingRulerSealRewards.push({ sealId: binding.id, issuerPlayerId: ctx.controllerId, boundPlayerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, round: s.round.roundNumber, rewardVp });
    const id = nextId(s, 'ruler-seal-free-play'); const snapshot = rulerFreePlayCandidates(s, boundPlayerId);
    r.pendingDecision = { id, controllerId: boundPlayerId, target: { id: 'ruler_free_play_card', type: 'card_instance', scope: { zone: 'hand', controller: 'self' }, count: { min: 0, max: 1 }, visibility: 'private_to_controller' },
      candidates: snapshot, min: 0, max: 1, context: structuredClone(ctx), remainingEffects: [],
      interaction: { kind: 'ruler_seal_free_play_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
        sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: r.revision + 1, continuationRef: `${id}:continuation`,
        sealId: binding.id, issuerPlayerId: ctx.controllerId, boundPlayerId, rewardVp, constraints: { kind: 'target', targetKind: 'card', min: 0, max: 1, distinct: true } },
    };
  } else reject('resolution_failed', 'Unsupported Ruler seal option');
  r.events.push({ type: 'ruler_seal_spent', playerId: boundPlayerId, controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
}

function settlePendingRulerSealRewards(s: GameState, event: AbilityEvent): void {
  if (event.type !== 'after_battle_result_determined' || !event.battleResult) return;
  const r = runtime(s); const participants = new Set(event.battleParticipantIds ?? [...event.battleResult.winners, ...event.battleResult.loserIds]);
  const remaining = [];
  for (const reward of r.pendingRulerSealRewards) {
    if (reward.round !== s.round.roundNumber || !participants.has(reward.boundPlayerId)) { remaining.push(reward); continue; }
    if (event.battleResult.winners.includes(reward.boundPlayerId)) {
      const recipient = player(s, reward.issuerPlayerId); const before = recipient.vp; recipient.vp += reward.rewardVp;
      r.events.push({ type: 'victory_points_adjusted', playerId: reward.issuerPlayerId, sourceCardId: reward.sourceCardId, abilityId: reward.abilityId, delta: reward.rewardVp, before, after: recipient.vp, triggerEventId: event.id });
    }
  }
  r.pendingRulerSealRewards = remaining;
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

function isGameStartFixedControllerManaSetCandidate(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' && a.effects.some((effect) => str(effect.type) === 'set_mana');
}

export function isGameStartFixedControllerManaSetSemantic(a: AuthoringAbility): boolean {
  if (!isGameStartFixedControllerManaSetCandidate(a) || a.execution.mode !== 'automatic' ||
    !Array.isArray(a.execution.allowedOperations) || a.execution.allowedOperations.length !== 0) return false;
  if (str(a.activation.trigger) !== 'game_start' || Object.keys(a.activation).some((key) => key !== 'trigger')) return false;
  if (a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  const responseKeys = Object.keys(a.responseWindow);
  if (responseKeys.some((key) => !['order', 'passBehavior'].includes(key)) ||
    (a.responseWindow.order !== undefined && a.responseWindow.order !== 'turn_order') ||
    (a.responseWindow.passBehavior !== undefined && a.responseWindow.passBehavior !== 'decline_this_window') ||
    Object.keys(a.lifecycle).length !== 0 || Object.keys(a.limit).length !== 0 || Object.keys(a.visibility).length !== 0) return false;
  return a.effects.length === 1 && isFixedControllerManaSetComponent(a.effects[0]!);
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

export function isControllerMasterSkillDefinitionReturnComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (str(effect.type) !== 'return_card_by_definition') return false;
  const definitionId = str(effect.definitionId);
  const linkedSkillId = str(effect.linkedSkillId);
  if (Boolean(definitionId) === Boolean(linkedSkillId)) return false;
  if (effect.target !== 'controller' || effect.destination !== 'master-skills' || effect.createIfMissing !== true ||
    effect.face !== 'up' || effect.active !== false) return false;
  return Object.keys(effect).every((key) =>
    ['type', 'target', 'definitionId', 'linkedSkillId', 'destination', 'createIfMissing', 'face', 'active'].includes(key));
}

function containsControllerMasterSkillDefinitionReturnCandidate(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsControllerMasterSkillDefinitionReturnCandidate);
  if (!value || typeof value !== 'object') return false;
  const current = node(value);
  if (str(current.type) === 'return_card_by_definition') return true;
  return Object.values(current).some(containsControllerMasterSkillDefinitionReturnCandidate);
}

function hasControllerMasterSkillDefinitionReturnCandidate(a: AuthoringAbility): boolean {
  return containsControllerMasterSkillDefinitionReturnCandidate(a.effects) ||
    containsControllerMasterSkillDefinitionReturnCandidate(a.creates);
}

function resolveControllerMasterSkillDefinitionReturn(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  if (!isControllerMasterSkillDefinitionReturnComponent(effect)) {
    reject('resolution_failed', 'Unsupported controller master-skill definition-return component shape');
  }
  const r = runtime(s); const controller = player(s, ctx.controllerId); const source = card(s, ctx.sourceCardId);
  const sourceDefinition = r.pack.cards[source.definitionId] as ExecutableCardDefinition | undefined;
  if (source.ownerPlayerId !== controller.id || source.controllerPlayerId !== controller.id || source.zone !== 'skill' ||
    !sourceDefinition || sourceDefinition.cardType !== 'master_skill' || sourceDefinition.ownerId !== controller.masterCardId) {
    reject('invalid_source', 'Definition-return source must be a current controller-owned master_skill in the skill zone');
  }
  const targetDefinitionId = str(effect.definitionId) || str(effect.linkedSkillId);
  const targetDefinition = r.pack.cards[targetDefinitionId] as ExecutableCardDefinition | undefined;
  if (!targetDefinition || targetDefinition.cardType !== 'master_skill' || targetDefinition.ownerId !== controller.masterCardId) {
    reject('invalid_target', 'Definition-return target must be a controller-owned master_skill definition');
  }
  const physical = s.cards.filter((candidate) => candidate.definitionId === targetDefinitionId && candidate.ownerPlayerId === controller.id);
  if (physical.length > 1) reject('invalid_target', 'Definition-return target has duplicate controller-owned physical instances');
  if (physical.length === 1) {
    const target = physical[0]!;
    const fromZone = target.zone;
    target.ownerPlayerId = controller.id;
    target.controllerPlayerId = controller.id;
    target.zone = 'skill';
    target.visibility = { scope: 'owner_only', ownerPlayerId: controller.id };
    clearTransientCardTransformState(s, target.instanceId);
    r.cardState[target.instanceId] = { ...(r.cardState[target.instanceId] ?? { active: false, faceDown: false, playedRound: s.round.roundNumber }), active: false, faceDown: false };
    r.events.push({ type: 'card_returned_by_definition', playerId: controller.id, sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId, cardInstanceId: target.instanceId, fromZone, toZone: 'skill', movedCount: fromZone === 'skill' ? 0 : 1 });
    return;
  }
  const instanceId = nextId(s, 'definition-return');
  s.cards.push({ instanceId, definitionId: targetDefinitionId, ownerPlayerId: controller.id, controllerPlayerId: controller.id,
    zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: controller.id }, generatedBy: ctx.sourceCardId });
  r.cardState[instanceId] = { active: false, faceDown: false, playedRound: s.round.roundNumber };
  r.events.push({ type: 'card_created', playerId: controller.id, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
    cardInstanceId: instanceId, toZone: 'skill', movedCount: 1 });
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
    classifyAlterEgoTransformVariant(a) === 'ex';
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
  if (isRulerSealBindingCandidate(a)) {
    if (!isRulerSealBindingSemantic(a)) reject('resolution_failed', 'Unsupported Ruler seal binding semantic shape');
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    grantRulerSealBindings(s, ctx); return;
  }
  if (isRulerSealUseCandidate(a)) {
    if (!isRulerSealUseSemantic(a)) reject('resolution_failed', 'Unsupported Ruler seal use semantic shape');
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    settleRulerSealUse(s, ctx, a); return;
  }
  if (isOuterGodLifeAbilityCandidate(a)) {
    if (!isOuterGodLifeAbilitySemantic(a)) reject('resolution_failed', 'Unsupported Outer-God-Life relational semantic shape');
    try { applyOuterGodLifeUse(s, ctx, a); } catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Outer-God-Life resolution failed'); }
    return;
  }
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
  if (isResourceNumericDirectActionSemantic(a) || isResourceNumericTriggerSemantic(a) || isGameStartFixedControllerManaSetSemantic(a) || isDeploymentResourceRewardSemantic(a) || isBattleLossResourceTriggerSemantic(a) || isBattleLossServantRevealSemantic(a) || isSharedVictoryVpTriggerSemantic(a) || isOptionalBattleResultVpTriggerSemantic(a) || isOptionalBattleResultExtraVpTriggerSemantic(a) || isBattleEndSourceReturnSemantic(a) || isSourcePlayBasicAttackDrawTriggerSemantic(a)) {
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
  if (isGameStartFixedControllerManaSetCandidate(a)) reject('resolution_failed', 'Unsupported game-start fixed set-mana semantic shape');
  if (isSourcePlayBasicAttackDrawTriggerCandidate(a)) reject('resolution_failed', 'Unsupported source-play basic-attack draw trigger semantic shape');
  if (isDeploymentResourceRewardCandidate(a)) reject('resolution_failed', 'Unsupported deployment resource reward semantic shape');
  if (isBattleLossResourceTriggerCandidate(a)) reject('resolution_failed', 'Unsupported battle-loss resource semantic shape');
  if (isBattleLossUnpreventableVpTriggerCandidate(a)) reject('resolution_failed', 'Unsupported unpreventable battle-loss VP semantic shape');
  if (isBattleLossServantRevealCandidate(a)) reject('resolution_failed', 'Unsupported battle-loss servant reveal semantic shape');
  if (isSharedVictoryVpTriggerCandidate(a)) reject('resolution_failed', 'Unsupported shared-victory VP semantic shape');
  if (isOptionalBattleResultVpTriggerCandidate(a)) reject('resolution_failed', 'Unsupported optional battle-result VP semantic shape');
  if (isBattleEndSourceReturnCandidate(a)) reject('resolution_failed', 'Unsupported battle-end source-return semantic shape');
  if (isBattleEndMobilePlayersRewardCandidate(a)) reject('resolution_failed', 'Unsupported battle-end mobile-player reward semantic shape');
  if (isSameBattlefieldPrivateHandReturnInteractionCandidate(a)) {
    if (!isSameBattlefieldPrivateHandReturnInteractionSemantic(a)) reject('resolution_failed', 'Unsupported same-battlefield private hand-return interaction semantic shape');
    const playerTargetId = str(a.targets[0]?.id);
    if (!Object.prototype.hasOwnProperty.call(ctx.selections, playerTargetId)) {
      const pending = findPendingTarget(s, ctx, a, effects);
      if (!pending) reject('resolution_failed', 'Private hand inspection requires a player selection');
      runtime(s).pendingDecision = pending;
      return;
    }
    runtime(s).pendingDecision = createSameBattlefieldPrivateHandReturnInteraction(s, ctx, a);
    return;
  }
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
function countPreflightFaceUpEffectPlays(s: GameState, ctx: EffectContext, effects: RuleNode[]): number {
  let additionalFaceUpCards = 0;
  for (const effect of effects) {
    if (effect.type === 'play_source_card' && effect.face !== 'face_down') {
      additionalFaceUpCards += 1;
      continue;
    }
    if (effect.type === 'play_selected_cards' && effect.face !== 'face_down') {
      additionalFaceUpCards += (ctx.selections[str(effect.target)] ?? []).length;
      continue;
    }
    if (effect.type === 'branch') {
      const branch = nodes(effect.branches).find(b => b.else !== undefined || condition(s, ctx, node(b.if)));
      if (branch) additionalFaceUpCards += countPreflightFaceUpEffectPlays(s, ctx, nodes(branch.then ?? branch.else));
    }
  }
  return additionalFaceUpCards;
}

function preflightFaceUpEffectPlays(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const additionalFaceUpCards = countPreflightFaceUpEffectPlays(s, ctx, [...a.effects, ...a.creates]);
  if (additionalFaceUpCards > 0 && faceUpCardPlayLimitReached(s, ctx.controllerId, additionalFaceUpCards)) {
    reject('face_up_card_play_limit_reached', 'Face-up card play limit reached for this round');
  }
}
export function executeAbility(s: GameState, ctx: EffectContext): void {
  const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  if (a.execution.mode !== 'automatic') reject(a.execution.mode, 'Ability requires an adapter or host ruling');
  if (isRulerSealBindingCandidate(a) && !isRulerSealBindingSemantic(a)) reject('resolution_failed', 'Unsupported Ruler seal binding semantic shape');
  if (isRulerSealUseCandidate(a) && !isRulerSealUseSemantic(a)) reject('resolution_failed', 'Unsupported Ruler seal use semantic shape');
  if (isOuterGodLifeAbilityCandidate(a) && !isOuterGodLifeAbilitySemantic(a)) reject('resolution_failed', 'Unsupported Outer-God-Life relational semantic shape');
  if (hasControllerMasterSkillDefinitionReturnCandidate(a)) reject('resolution_failed', 'Definition-return component requires an independently accepted parent route');
  if (isFixedControllerAdvanceDrawActionCandidate(a) && !isFixedControllerAdvanceDrawActionSemantic(a)) {
    reject('resolution_failed', 'Unsupported fixed controller advance-draw semantic shape');
  }
  if (isAnyLocationExceptWorkshopMovementCandidate(a) && !isAnyLocationExceptWorkshopMovementSemantic(a)) {
    reject('resolution_failed', 'Unsupported any-location-except-workshop movement semantic shape');
  }
  if (isMagicResistancePowerModifierCandidate(a) && !isMagicResistancePowerModifierSemantic(a)) {
    reject('resolution_failed', 'Unsupported magic-resistance power modifier semantic shape');
  }
  if (isPresenceConcealmentAssassinationCandidate(a) && !isPresenceConcealmentAssassinationSemantic(a)) {
    reject('resolution_failed', 'Unsupported Presence Concealment semantic shape');
  }
  if (isGameStartRuleOverrideCandidate(a) && !isGameStartRuleOverrideSemantic(a)) {
    reject('resolution_failed', 'Unsupported persistent RuleOverride semantic shape');
  }
  if (isGameStartFixedControllerManaSetCandidate(a) && !isGameStartFixedControllerManaSetSemantic(a)) {
    reject('resolution_failed', 'Unsupported game-start fixed set-mana semantic shape');
  }
  if (isGameStartPlayerStatusAssignmentCandidate(a)) {
    if (!assignGameStartPlayerStatuses(s, ctx.controllerId, a)) {
      reject('resolution_failed', 'Unsupported game-start player-status assignment semantic shape or target topology');
    }
    return;
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
  if (isCardZoneCoreDirectActionRouteCandidate(a) || isFixedControllerAdvanceDrawActionSemantic(a) || isAnyLocationExceptWorkshopMovementSemantic(a) || isPlayActionRouteCandidate(a) || isPlaySourceCardWithCostResponseStructuralCandidate(a) || isAddToAttackRouteCandidate(a) || isActivateCardByIdTrigger(a) || isCloseSourceCardOnPlayedTrigger(a)) {
    try {
      normalizeResolutionDataFlowNodes([...a.effects, ...a.creates], `cards.${ctx.sourceCardId}.abilities.${ctx.abilityId}.effects`);
    } catch (error) {
      if (error instanceof DataFlowValidationError) reject('resolution_failed', error.message);
      throw error;
    }
  }
  if (isAddToAttackRouteCandidate(a)) assertAddToAttackSupportAvailable(s, ctx, a);
  preflightFaceUpEffectPlays(s, ctx, a);
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
  if (!isRulerSealUseSemantic(a) && !isCommandSpellCard(s, ctx.sourceCardId) && classifyAbilityInteraction(a).kind === 'phase_activation') runtime(s).usedAbilities[`${ctx.sourceCardId}:${a.id}`] = s.round.roundNumber;
  
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
  settlePendingRulerSealRewards(s, event);
  try { settlePendingSourceCardReturns(s, event); } catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Source-card return failed'); }
  if (event.type === 'after_battle_result_determined') recordCurrentRoundCombatWinsFromBattleResult(s, event);
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
  for (const triggeredEventRule of collectTriggeredEventRuleAbilities(s, event)) {
    executeEventRuleAbility(s, triggeredEventRule.ruleInstanceId, triggeredEventRule.abilityId, event);
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
/** Trusted backend event hook. Events are not part of AbilityCommand. */
export function processAbilityEvent(s: GameState, event: AbilityEvent): void {
  if (runtime(s).processedEvents.includes(event.id)) return;
  const copy = structuredClone(s); processEvent(copy, event); runtime(copy).revision++;
  Object.assign(s, copy);
}
/** Trusted backend producer helper. Allocates event identity inside the same cloned transaction. */
export function processAbilitySystemEvent(s: GameState, label: string, event: Omit<AbilityEvent, 'id'>): void {
  const copy = structuredClone(s);
  processEvent(copy, { ...event, id: nextId(copy, label) });
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
    runtime(copy).pendingRulerSealRewards = runtime(copy).pendingRulerSealRewards.filter((reward) => reward.round >= round);
    runtime(copy).roundTotalPowerAdjustments = { round, byPlayer: {} };
    runtime(copy).pendingSourceCardReturns = runtime(copy).pendingSourceCardReturns.filter((entry) => entry.round >= round);
    runtime(copy).manaGainedThisRound = { round, byPlayer: {} };
    runtime(copy).playCounters = { round, cardsPlayedByPlayer: {}, faceUpCardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} };
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
      return { id: p.id, seat: p.seat, mana: p.mana, vp: p.vp, commandSpells: Number((p as unknown as { commandSpells?: number }).commandSpells ?? 3), masterCardId: p.masterCardId,
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
  const d = r.pendingDecision;
  const privatelyInspectedCardIds = new Set(
    d?.interaction?.kind === 'same_battlefield_private_hand_return_v1' && d.controllerId === viewerId ? d.candidates : [],
  );
  for (const c of s.cards) {
    if (c.zone === 'deck') continue;
    const privateZone = ['hand', 'skill', 'looked_cards'].includes(c.zone);
    const isPublic = !privateZone && (c.visibility.scope === 'public' || ongoing.some(o => o.controllerId === c.ownerPlayerId && o.publicZones.includes(c.zone)));
    const own = c.ownerPlayerId === viewerId;
    const privatelyInspected = privatelyInspectedCardIds.has(c.instanceId) && c.zone === 'hand';
    if (!own && !privatelyInspected && !isPublic && !['field', 'attack_area'].includes(c.zone)) continue;
    const hidden = !own && !privatelyInspected && (!isPublic || runtime(s).cardState[c.instanceId]?.faceDown);
    // Opaque battlefield slot ids do not reveal definition ids embedded in legacy instance ids.
    const physicalState = runtime(s).cardState[c.instanceId];
    view.cards.push({ instanceId: hidden ? `hidden-field-${s.cards.indexOf(c)}` : c.instanceId,
      ...(!hidden && (own || privatelyInspected || isPublic) ? { definitionId: c.definitionId } : {}), ownerPlayerId: c.ownerPlayerId, zone: c.zone,
      ...(physicalState?.faceDown ? { faceDown: true } : {}),
      ...(!hidden && physicalState?.reversed ? { reversed: true } : {}),
      ...(!hidden && physicalState?.attributeOverrides !== undefined ? { attributeOverrides: [...physicalState.attributeOverrides] } : {}) });
  }
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
        const a = abilityDefinition(s, d.context.sourceCardId, d.context.abilityId);
        if (meta.kind === 'ruler_seal_move_v1') {
          const a = abilityDefinition(s, d.context.sourceCardId, d.context.abilityId); const binding = r.rulerSealBindings.find((entry) => entry.id === meta.sealId);
          const currentEnabled = getEnabledLocations(s.map, s.locationConfig).map((location) => location.id);
          if (!isRulerSealUseSemantic(a) || d.controllerId !== meta.issuerPlayerId || d.context.controllerId !== meta.issuerPlayerId ||
            meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' || meta.continuationRef !== `${d.id}:continuation` ||
            meta.createdRevision !== r.revision || meta.sourceCardInstanceId !== d.context.sourceCardId || meta.abilityId !== d.context.abilityId ||
            !binding || !binding.spent || binding.issuerPlayerId !== meta.issuerPlayerId || binding.boundPlayerId !== meta.boundPlayerId ||
            meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'location' || meta.constraints.min !== 1 || meta.constraints.max !== 1 || !meta.constraints.distinct ||
            meta.destinations.length !== 2 || new Set(meta.destinations).size !== 2 || d.min !== 1 || d.max !== 1 ||
            !Array.isArray(selected) || selected.length !== 1 || !meta.destinations.includes(selected[0]!) || !currentEnabled.includes(selected[0]! as LocationId)) {
            reject('resolution_failed', 'Corrupt or stale Ruler seal move interaction state');
          }
          if (movementLockedByPersistentRule(s, meta.boundPlayerId) || rulerSealMovementLocked(s, meta.boundPlayerId)) reject('movement_locked', 'Bound player cannot move this round');
          const targetPlayer = player(s, meta.boundPlayerId); const from = targetPlayer.locationId; const to = selected[0]! as LocationId;
          if (!from || from === to) reject('illegal_target', 'Ruler seal movement requires a different current location');
          const movementLockedLocations = lockedBattlefieldIdsForMovement(s, meta.boundPlayerId);
          if (movementLockedLocations.has(from) || movementLockedLocations.has(to)) reject('movement_locked', 'Card movement restriction blocks the Ruler seal move');
          const occupyingPlayerIds = s.players.filter((candidate) => candidate.id !== meta.boundPlayerId && candidate.status === 'active' && candidate.locationId === to).map((candidate) => candidate.id);
          if (!canOccupyLocation({ map: s.map, config: s.locationConfig, locationId: to, movingPlayerId: meta.boundPlayerId, occupyingPlayerIds,
            ...(s.ruleOverrides ? { ruleOverrides: s.ruleOverrides } : {}) })) reject('illegal_target', 'Ruler seal movement destination is not occupiable');
          delete r.pendingDecision; targetPlayer.locationId = to; recordMovementForAbilityRuntime(s, meta.boundPlayerId, from, to);
          processEvent(s, { id: nextId(s, 'ruler-seal-enter-location'), type: 'after_controller_enters_location', playerId: meta.boundPlayerId, locationId: to });
          break;
        }
        if (meta.kind === 'ruler_seal_free_play_v1') {
          const a = abilityDefinition(s, d.context.sourceCardId, d.context.abilityId); const binding = r.rulerSealBindings.find((entry) => entry.id === meta.sealId);
          const currentAllowed = rulerFreePlayCandidates(s, meta.boundPlayerId);
          if (!isRulerSealUseSemantic(a) || d.controllerId !== meta.boundPlayerId || d.context.controllerId !== meta.issuerPlayerId ||
            meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' || meta.continuationRef !== `${d.id}:continuation` ||
            meta.createdRevision !== r.revision || meta.sourceCardInstanceId !== d.context.sourceCardId || meta.abilityId !== d.context.abilityId ||
            !binding || !binding.spent || binding.issuerPlayerId !== meta.issuerPlayerId || binding.boundPlayerId !== meta.boundPlayerId || meta.rewardVp !== 2 ||
            meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'card' || meta.constraints.min !== 0 || meta.constraints.max !== 1 || !meta.constraints.distinct ||
            d.min !== 0 || d.max !== 1 || !Array.isArray(selected) || selected.length > 1 || new Set(selected).size !== selected.length ||
            selected.some((id) => !d.candidates.includes(id) || !currentAllowed.includes(id))) {
            reject('resolution_failed', 'Corrupt or stale Ruler seal free-play interaction state');
          }
          delete r.pendingDecision;
          if (selected.length === 1) playBatch(s, meta.boundPlayerId, [{ type: 'play_card', cardInstanceId: selected[0]! }], 'effect', true);
          break;
        }
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
        if (meta.kind === 'same_battlefield_private_hand_return_v1') {
          const source = s.cards.find((candidate) => candidate.instanceId === d.context.sourceCardId);
          const exactSyntheticTarget = d.target.id === 'inspected_hand_card' && d.target.type === 'card_instance' &&
            node(d.target.scope).zone === 'hand' && node(d.target.scope).owner === 'any' && node(d.target.scope).controller === 'any' &&
            Number(node(d.target.count).min) === 0 && Number(node(d.target.count).max) === 1 && d.target.visibility === 'private_to_controller';
          if (!isSameBattlefieldPrivateHandReturnInteractionSemantic(a) || d.context.controllerId !== d.controllerId ||
            !source || source.controllerPlayerId !== d.controllerId || !active(s, source.instanceId) || !exactSyntheticTarget ||
            meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
            meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== runtime(s).revision ||
            meta.sourceCardInstanceId !== d.context.sourceCardId || meta.abilityId !== d.context.abilityId ||
            meta.playerTargetId !== str(a.targets[0]?.id) || d.context.selections[meta.playerTargetId]?.length !== 1 ||
            d.context.selections[meta.playerTargetId]?.[0] !== meta.selectedPlayerId ||
            meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'card' || meta.constraints.min !== 0 ||
            meta.constraints.max !== 1 || meta.constraints.distinct !== true || d.min !== 0 || d.max !== 1 ||
            new Set(d.candidates).size !== d.candidates.length || d.candidates.some((id) => {
              const candidate = s.cards.find((card) => card.instanceId === id);
              return !candidate || candidate.ownerPlayerId !== meta.selectedPlayerId || candidate.zone !== 'hand';
            })) {
            reject('resolution_failed', 'Corrupt private hand-return interaction state');
          }
          const selectedPlayer = s.players.find((candidate) => candidate.id === meta.selectedPlayerId && candidate.status === 'active');
          const controllerLocationId = player(s, d.context.controllerId).locationId;
          if (!selectedPlayer || !isBattlefield(s, controllerLocationId) || selectedPlayer.locationId !== controllerLocationId) {
            reject('illegal_target', 'Selected player is no longer at the controller battlefield');
          }
          const currentAllowed = s.cards.filter((candidate) =>
            candidate.ownerPlayerId === meta.selectedPlayerId && candidate.zone === 'hand').map((candidate) => candidate.instanceId);
          if (!Array.isArray(selected) || selected.length < d.min || selected.length > d.max ||
            new Set(selected).size !== selected.length || selected.some((id) => !d.candidates.includes(id) || !currentAllowed.includes(id))) {
            reject('illegal_target', 'Selected private hand card is not legal');
          }
          delete r.pendingDecision;
          if (selected.length === 1) {
            const selectedCard = card(s, selected[0]!);
            if (selectedCard.ownerPlayerId !== meta.selectedPlayerId || selectedCard.zone !== 'hand') {
              reject('illegal_target', 'Selected private hand card no longer belongs to the selected player hand');
            }
            moveCard(s, selectedCard.instanceId, 'deck');
            shuffle(s, meta.selectedPlayerId);
            r.events.push({ type: 'deck_shuffled', playerId: meta.selectedPlayerId, sourceCardId: d.context.sourceCardId, abilityId: d.context.abilityId });
          }
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
function playBatch(s: GameState, playerId: string, choices: PlayCardAction[], quota: 'regular' | 'effect' = 'regular', waiveManaCost = false): void {
  if (new Set(choices.map(c => c.cardInstanceId)).size !== choices.length) reject('illegal_action', 'Duplicate card in play batch');
  const faceUpChoiceCount = choices.filter((choice) => choice.faceDown !== true).length;
  if (faceUpChoiceCount > 0 && faceUpCardPlayLimitReached(s, playerId, faceUpChoiceCount)) {
    reject('face_up_card_play_limit_reached', 'Face-up card play limit reached for this round');
  }
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
  const paidManaByCard = new Map<string, number>();
  for (const c of choices) {
    const allowRequiredAdditional = quota === 'regular' && requiredAdditionalIds.has(c.cardInstanceId) && regularAttackChoices > 0;
    const failure = playFailure(s, playerId, c.cardInstanceId, c.faceDown === true, true, quota === 'effect', quota === 'effect', allowRequiredAdditional, waiveManaCost);
    if (failure) reject(failure, 'Card cannot be played in this batch');
    const paidMana = !waiveManaCost && !c.faceDown ? Number(definition(s, c.cardInstanceId)!.cardFace.cost ?? 0) : 0;
    if (!Number.isSafeInteger(paidMana) || paidMana < 0) reject('invalid_cost', 'Card paid mana provenance must be a nonnegative safe integer');
    paidManaByCard.set(c.cardInstanceId, paidMana);
    cost += paidMana;
  }
  if (cost > player(s, playerId).mana) reject('insufficient_mana', 'Cannot pay aggregate batch cost');
  const playedCards = choices.map(c => ({ instanceId: c.cardInstanceId, controllerId: playerId,
    cardType: definition(s, c.cardInstanceId)!.cardType, faceDown: !!c.faceDown }));
  player(s, playerId).mana -= cost;
  for (const c of choices) {
    moveCard(s, c.cardInstanceId, cardPlayClassification(s, c.cardInstanceId).destinationZone);
    const limit = perGamePlayLimit(definition(s, c.cardInstanceId)!);
    if (limit) runtime(s).abilityUsage[`play:${c.cardInstanceId}:${limit.key}`] = (runtime(s).abilityUsage[`play:${c.cardInstanceId}:${limit.key}`] ?? 0) + 1;
    runtime(s).cardState[c.cardInstanceId] = { active: !c.faceDown, faceDown: !!c.faceDown, playedRound: s.round.roundNumber, paidManaOnPlay: paidManaByCard.get(c.cardInstanceId)! };
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
    counters.faceUpCardsPlayedByPlayer = {};
    counters.attacksDeclaredByPlayer = {};
  }
  counters.cardsPlayedByPlayer[playerId] = (counters.cardsPlayedByPlayer[playerId] ?? 0) + choices.length;
  counters.faceUpCardsPlayedByPlayer ??= {};
  counters.faceUpCardsPlayedByPlayer[playerId] = (counters.faceUpCardsPlayedByPlayer[playerId] ?? 0) + faceUpChoiceCount;
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
  try {
    dispatch(copy, playerId, command); runtime(copy).revision++; Object.assign(s, copy);
    return { ok: true, view: projectAbilityState(s, playerId),
      events: runtime(s).events.slice(before).filter(e => !e.visibility || e.visibility === playerId).map(({ visibility: _, ...e }) => e),
      calculations: runtime(s).calculations.slice(beforeCalculations).filter(c => c.controllerId === playerId).flatMap(c => c.lines) };
  } catch (error) {
    if (!(error instanceof RuleRejection)) throw error;
    const sourceId = command && 'cardInstanceId' in command ? command.cardInstanceId : undefined;
    const source = s.cards.find(c => c.instanceId === sourceId && c.controllerPlayerId === playerId);
    const blocked = source ? definition(s, source.instanceId)?.abilities.find(a => a.execution.mode === 'host_adjudicated') : undefined;
    return { ok: false, view: projectAbilityState(s, playerId), events: [], calculations: [], rejection: { code: error.code, message: error.message,
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
