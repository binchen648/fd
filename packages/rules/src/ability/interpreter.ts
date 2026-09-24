import type { GameState, PhaseName } from '../schema/game';
import type { CardInstance } from '../schema/card';
import type { LocationId } from '../schema/location';
import starterPack from '../data/cards/starter-pack.json';
import { canOccupyLocation, getEnabledLocations } from '../core/map-engine';
import { movePlayer as movePlayerCore } from '../core/movement';
import { ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID, evaluateCardSourceValidity, isActiveCardSource } from '../core/card-source-state';
import {
  isPrivateOptionalHandPlayInteractionCandidate, isPrivateOptionalHandPlayInteractionSemantic,
  isSameBattlefieldPrivateHandReturnInteractionCandidate, isSameBattlefieldPrivateHandReturnInteractionSemantic,
} from './interaction-gateway';
import { checkExtendedCondition, resolveExtendedEffect } from './extended-effects';
import { clearTransientCardTransformState, getEffectiveCardAttributes } from './card-instance-state';
import { commandSpellPhaseOverride, grantMana, ignoresSituationPlayForbid, installGameStartRuleOverride, installRulerSealMovementLock, isExactGameStartRuleOverrideEffect, movementLockedByPersistentRule, persistentExtraAttackAllowance, rulerSealMovementLocked, situationForbidsAttribute, structuredCardDrawForbidden, structuredCloseWhenHandEmptySources, structuredStandardAttackCardMaximum } from '../core/rule-overrides';
import { node, nodes, str } from './loader';
import { isAcceptedCommandSealLossConditionalDefeatAbility } from './command-seal-loss-conditional-defeat';
import { isGameStartSkillProvisioningCandidate, isGameStartSkillProvisioningSemantic } from './game-start-skill-provisioning';
import { hasRequiredAdditionalPlayMarker } from './required-additional-play';
import {
  eligibleLeastBoundPlayerIds, isLeastBoundSelection, isRulerSealBindingCandidate, isRulerSealBindingSemantic,
  isRulerSealUseCandidate, isRulerSealUseSemantic, unspentRulerSealBindings,
} from './ruler-seal';
import { currentDeploymentBonus, multiplyDeploymentBonus } from '../core/terrain-advantage';
import { eventRulePlacementByInstance, initializeEventRulePlacements, listEventRuleCandidates, moveEventRuleCandidate, moveEventRuleCandidates, replaceSelectedEventRuleFromDeck, swapSelectedEventRuleLocations, type EventRuleZone } from './event-rule';
import { applyOuterGodLifeUse, isOuterGodLifeAbilityCandidate, isOuterGodLifeAbilitySemantic, settlePendingSourceCardReturns } from './outer-god-life';
import { sequesterRandomInactiveServantSkill } from './m50-sequestration';
import { classifyAcceptedSkillUseForbidModifier, definitionHasStructuralTrueNameRelease, isAcceptedStaticWhileActiveSkillUseForbidAbility } from './skill-use-forbid';
import { isCardCloseForbidden } from './card-close-forbid';
import { faceUpCardPlayLimitReached, faceUpCardsPlayedThisRound, recordCompletedFaceUpCardPlay } from './face-up-cards-per-round';
import { currentRoundCombatLossAbsent, isAcceptedCurrentRoundCombatLossAbsenceCondition } from './current-round-combat-loss-condition';
import { eventLocationEqualsController, isAcceptedEventLocationEqualsControllerCondition } from './event-location-equals-controller';
import {
  isAcceptedOpponentRoundVpGainThresholdAbility,
  isOpponentRoundVpGainThresholdCondition,
  OPPONENT_ROUND_VP_GAIN_THRESHOLD,
  OPPONENT_ROUND_VP_GAIN_TRIGGER,
} from './opponent-round-vp-gain-threshold';
import {
  NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT,
  applyNextRoundSituationBenefitSuppression,
  isAcceptedNextRoundSituationBenefitSuppressionAbility,
  isNextRoundSituationBenefitSuppressionCandidate,
  nextRoundSituationSuppressionQualifyingOpponentIds,
} from './next-round-situation-benefit-suppression';
import { isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility, isAcceptedDeploymentLocationOpponentDefeatAbility, isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility, isAcceptedPreBattleDefeatAbility, isAcceptedSelectedSameBattlefieldDefeatAbility, isAcceptedStructuredChosenOpponentDefeatAbility, isPreBattleDefeatCandidate, preBattleDefeatAttribute } from './pre-battle-defeat';
import {
  battleLossVpWinnerRewardAmounts,
  isAcceptedBattleLossVpWinnerRewardAbility,
  isBattleLossVpWinnerRewardCandidate,
  trustedBattleLossVpWinnerRewardFacts,
} from './battle-loss-vp-winner-reward';
import {
  CONTROLLER_DEFEATED_TRIGGER,
  controllerDefeatedVpRewardAmount,
  isAcceptedControllerDefeatedVpRewardAbility,
  isControllerDefeatedVpRewardCandidate,
  trustedControllerDefeatedFacts,
} from './controller-defeated-vp-reward';
import {
  COMBAT_OPPONENT_POWER_VP_REWARD_DIVISOR,
  isAcceptedCombatOpponentPowerVpRewardAbility,
  isCombatOpponentPowerVpRewardCandidate,
  trustedCombatOpponentPowerRewardFacts,
} from './combat-opponent-power-vp-reward';
import {
  isAcceptedOpponentCloseToOneAbility,
  isAcceptedOpponentCloseOneNonResidualAbility,
  isOpponentCloseToOneCandidate,
} from './opponent-close-to-one';
import {
  SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT,
  SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_POLICY,
  isAcceptedSelectedPlayedAttackTemporaryCopyAbility,
  isSelectedPlayedAttackTemporaryCopyCandidate,
} from './selected-played-attack-temporary-copy';
import {
  BASIC_STRENGTH_ATTACK_CONSTRAINT,
  SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT,
  SET_SELECTED_CARD_FACE_DOWN_EFFECT,
  isAcceptedBasicStrengthOpponentSkillFaceDownAbility,
  isBasicStrengthOpponentSkillFaceDownCandidate,
} from './basic-strength-opponent-skill-face-down';
import {
  EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION,
  EVENT_POWER_ENTRY_TRIGGERS,
  EVENT_POWER_SOURCE_BONUS_POLICY,
  SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT,
  classifyAcceptedEventPowerUncontestedWinRewardAbility,
  isAcceptedEventBattleOpponentCountEqualsCondition,
  isAcceptedEventPowerUncontestedWinRewardAbility,
  isEventPowerUncontestedWinRewardCandidate,
} from './event-power-uncontested-win-reward';
import {
  BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER,
  BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST,
  cardRequiresSoloPlay,
  isAcceptedBatchPassiveFamilyAbility,
  isAcceptedCrowdedBattleCloseAbility,
  isBatchPassiveFamilyCandidate,
  ownedDefinitionCardRuleAdjustment,
  skillDefinitionForbiddenByOwnedDefinitionCardRule,
  trustedCrowdedBattleEventMatches,
} from './batch-passive-card-rules';
import { b02OwnedBasicAttackAdjustment, b02SkillDefinitionForbidden, b02SourceOwned, isAcceptedB02RoundEndVpLossAbility } from './batch-owned-passive-rules';
import { m50AdditiveCardAdjustment, m50IgnoresCardEffectPlayRestrictions, m50StructuredStandardAppendRule, m50StructuredStandardAppendTargetIsAttack } from './m50-structural-card-modifiers';
import { m50LinkedPlayerCardMultipliers } from './m50-linked-player-card-modifiers';
import { isAcceptedM50BladeStormGrantedAbility, isAcceptedM50BoundaryBottomDiscardAbility, isAcceptedM50FreeSourceCardCombatPlayAbility, isAcceptedM50GrantedRoundDefeatIgnoreAbility, isAcceptedM50SourceCardCombatJoinAbility, m50GrantedAbilitiesForCard, m50GrantedAbilityForCard } from './m50-granted-card-abilities';
import { M50_CLOSE_SELECTED_FACE_DOWN_ATTACKS, M50_DRAW_AND_PLAY_FACE_DOWN, isAcceptedM50DrawAndPlayFaceDownAttackAbility, isAcceptedM50FaceDownAttackCloseAbility, m50FaceDownAttackPrintedBasePowerOverride, revealM50FaceDownAttackResidualSources } from './m50-face-down-attack-rules';
import { M50_EFFECT_INSTALLED_COMBAT_SETTLEMENT_POLICY, M50_EFFECT_INSTALLED_MANA_SPENDING_FORBID_POLICY, isAcceptedEffectInstalledCombatSettlementBundle, isAcceptedEffectInstalledCombatSettlementModifier, isAcceptedEffectInstalledControllerManaSpendingForbidModifier, m50ManaSpendingForbidden } from './m50-effect-installed-rule-modifiers';
import { isAcceptedM50SourceBattlefieldLockdownAbility, m50SourceBattlefieldCardPlayForbidden } from './m50-source-battlefield-lockdown';
import { M50_BATTLE_TERMINAL_ACTIVE_ATTACK_VP_ATTRITION, isAcceptedM50BattleTerminalActiveAttackVpAttritionAbility } from './m50-battle-terminal-attrition';
import { m50OpponentDefeatManaCost } from './m50-defeat-cost';
import { M50_PLAYER_FLAG_GREATER_THAN_MANA_RATIO, isAcceptedM50RatioFilteredDefeatAbility, parseM50PlayerFlagManaRatioPredicate } from './m50-ratio-defeat';
import {
  B03_EVENT_COMBAT_HAS_ATTRIBUTE, B03_SCHEDULE_EFFECT, advanceB03RoundSchedules, armB03NextRoundCardPowerSchedule,
  b03OpponentCardPowerSetZero, b03ScheduledCardPowerBonus, b03TrustedBattlefieldEqualsController, b03TrustedCombatHasAttribute,
  isAcceptedB03CombatAttributeCloseAbility, isAcceptedB03ModifierLifecycleAbility, isB03ModifierLifecycleCandidate,
} from './batch-modifier-lifecycle-rules';
import {
  B04_FIRST_MOVEMENT_SOURCE_POWER_EFFECT, B04_EVENT_PLAYER_MANA_EFFECT, B04_FIRST_MOVEMENT_CONDITION, B04_ROUND_DOUBLE_EFFECT, B04_SAME_LOCATION_MANA_EFFECT,
  b04EntryLocationEqualsController, b04FirstMovementCondition, b04SameLocationDefeatPlayerIds, b04SourcePowerBonus, b04TrustedControllerDefeat, b04TrustedOpponentEntry,
  installB04FirstMovementSourcePower, installB04RoundDouble, isAcceptedB04FirstMovementSourcePowerAbility, isAcceptedB04EventSourcePowerAbility,
  isAcceptedB04ControllerDefeatManaReleaseAbility, isAcceptedB04OpponentEntryManaDrainAbility, isAcceptedB04SourcePlayRoundDoubleAbility, isB04EventSourcePowerCandidate,
  rememberB04MovementReceipt,
} from './batch-event-source-power-rules';import {
  B05_CONTROLLER_MANA_BELOW_TWO_CONDITION, B05_EVENT_LOCATION_IS_WORKSHOP_CONDITION, B05_OTHER_NON_WORKSHOP_BATTLEFIELD_ENTRY_CONDITION,
  B05_DEPLOYMENT_RESOURCE_EXCHANGE_EFFECT, B05_TRANSFER_VP_ARM_ROUND_CLOSE_EFFECT, B05_SOURCE_TRIGGERED_THIS_ROUND_CONDITION, B05_CLOSE_TRIGGERED_SOURCE_EFFECT,
  armB05RoundClose, b05OtherBattlefieldEntryTarget, b05SourceTriggeredThisRound, b05WorkshopDeploymentTarget, consumeB05RoundCloseArm,
  isAcceptedB05EventResourceLifecycleAbility, isAcceptedB05LowManaCloseAbility, isAcceptedB05OtherBattlefieldVpTransferAbility,
  isAcceptedB05RoundEndCloseAbility, isAcceptedB05WorkshopDeploymentExchangeAbility, isB05EventResourceLifecycleCandidate, rememberB05DeploymentEntryReceipt,
} from './batch-event-resource-lifecycle-rules';
import {
  B06_SOURCE_PLAYED_FACE_UP_CONDITION, B06_ARM_ROUND_PUNISHMENT_EFFECT, B06_SOURCE_ARMED_THIS_ROUND_CONDITION,
  B06_PUNISH_BATTLE_LOSERS_EFFECT, B06_EVENT_BURST_EFFECT, armB06RoundPunishment, b06BattleLoserPenaltyFacts,
  b06SourceArmedThisRound, b06SourcePlayedFaceUp, b06SourcePowerBonus, installB06EventBurst,
  isAcceptedB06RoundArmAbility, isAcceptedB06BattlePunishAbility, isAcceptedB06EventBurstAbility,
} from './batch-card-play-combat-event-burst-rules';
import {
  advanceOpponentCloseToOneServerAuthority,
  clearOpponentCloseToOneServerAuthority,
  copyOpponentCloseToOneServerAuthority,
  getOpponentCloseToOneServerAuthority,
  installOpponentCloseToOneServerAuthority,
} from './opponent-close-to-one-authority';
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
  playerHasStatus,
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
  AbilityCommand, AbilityDefinitionPack, AbilityEvent, AbilityPlayerView, AbilityRuntime, AuthoringAbility, AuthoringCard, PlayerId,
  BattleResult, BattleResultData, CalculationLine, CardPlayClassification, CardRuntimeState, DispatchResult, EffectContext, ExecutableCardDefinition,
  LegalAction, OngoingEffect, PendingDecision, PendingOpponentCloseToOne, PendingStructuredEachPlayerOption, ResponseWindow, RuleNode, TriggeredAbility,
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
  const native = definition(s, source)?.abilities.find(a => a.id === abilityId);
  const physical = s.cards.some((candidate) => candidate.instanceId === source);
  const granted = physical ? m50GrantedAbilityForCard(s, source, abilityId) : undefined;
  if (native && granted) reject('invalid_state', 'Granted ability collides with a native ability id');
  const a = native ?? granted;
  if (!a) reject('illegal_action', 'Ability is not available'); return a;
}
function cardActivationAbilities(s: GameState, sourceId: string): AuthoringAbility[] {
  const native = definition(s, sourceId)?.abilities ?? [];
  const granted = m50GrantedAbilitiesForCard(s, sourceId);
  const nativeIds = new Set(native.map((ability) => ability.id));
  if (granted.some((ability) => nativeIds.has(ability.id))) reject('invalid_state', 'Granted ability collides with a native ability id');
  return [...native, ...granted];
}
function nextId(s: GameState, label: string): string { return `${label}-${++runtime(s).sequence}`; }
function recordAuthoritativeManaSpend(s: GameState, playerId: string, amount: number, locationId?: string): string | undefined {
  if (amount === 0) return undefined;
  if (!Number.isSafeInteger(amount) || amount < 0) reject('invalid_amount', 'Mana spend must be a nonnegative safe integer');
  const payer = player(s, playerId);
  const effectiveLocationId = locationId ?? payer.locationId;
  const id = nextId(s, 'mana-spent');
  const facts = { playerId, resource: 'mana' as const, amount, ...(effectiveLocationId ? { locationId: effectiveLocationId } : {}), roundNumber: s.round.roundNumber };
  (runtime(s).trustedManaSpentSnapshots ??= {})[id] = facts;
  processEvent(s, { id, type: 'm50_player_mana_spent', ...facts });
  return id;
}
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
  if (runtime(s).playRulesVersion === 'legacy-v0') return legacyCardPlayClassification(d);
  const physical = s.cards.find((candidate) => candidate.instanceId === sourceId);
  if (physical && m50StructuredStandardAppendTargetIsAttack(s, physical.controllerPlayerId, sourceId)) {
    return { playKind: 'attack', destinationZone: 'attack_area' };
  }
  return classifyCardPlay(d);
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
  const replaced = structuredStandardAttackCardMaximum(s, playerId);
  return (replaced ?? normalAttackCount) + extraAttackPlayAllowance(s, playerId) + persistentExtraAttackAllowance(s, playerId);
}
function attackPlayLimitReached(s: GameState, playerId: string, sourceId: string, ignoreStaged = false): boolean {
  if (!entersAttackArea(s, sourceId) || isRequiredAdditionalPlayCard(s, sourceId)) return false;
  const staged = ignoreStaged ? 0 : (stagedAttacks(s)[playerId] ?? []).filter(choice =>
    entersAttackArea(s, choice.cardInstanceId) && !isRequiredAdditionalPlayCard(s, choice.cardInstanceId)).length;
  return attacksDeclaredThisRound(s, playerId) + staged >= attackPlayAllowance(s, playerId);
}
interface RegularAttackSelectionPlan {
  regularAttackCount: number;
  structuredAppendId?: string;
  structuredAppendExtraCost?: number;
}
function regularAttackSelectionPlan(s: GameState, playerId: string, choices: PlayCardAction[]): RegularAttackSelectionPlan | undefined {
  const requiredAdditionalIds = new Set(choices.filter((choice) => isRequiredAdditionalPlayCard(s, choice.cardInstanceId)).map((choice) => choice.cardInstanceId));
  const ordinaryAttackChoices = choices.filter((choice) => entersAttackArea(s, choice.cardInstanceId) && !requiredAdditionalIds.has(choice.cardInstanceId));
  const remainingAllowance = Math.max(0, attackPlayAllowance(s, playerId) - attacksDeclaredThisRound(s, playerId));
  if (ordinaryAttackChoices.length <= remainingAllowance) return { regularAttackCount: ordinaryAttackChoices.length };
  if (requiredAdditionalIds.size > 0 || remainingAllowance < 1 || ordinaryAttackChoices.length !== remainingAllowance + 1) return undefined;
  const candidates = ordinaryAttackChoices.flatMap((choice) => {
    if (choice.faceDown === true) return [];
    const rule = m50StructuredStandardAppendRule(s, playerId, choice.cardInstanceId);
    return rule ? [{ id: choice.cardInstanceId, extraCost: rule.extraCost }] : [];
  });
  if (candidates.length !== 1) return undefined;
  return { regularAttackCount: ordinaryAttackChoices.length - 1, structuredAppendId: candidates[0]!.id, structuredAppendExtraCost: candidates[0]!.extraCost };
}
function canStageAttackChoice(s: GameState, playerId: string, choice: PlayCardAction, currentStaged: PlayCardAction[]): boolean {
  if (!entersAttackArea(s, choice.cardInstanceId)) return false;
  const hasOrdinaryStagedAttack = currentStaged.some((entry) => entersAttackArea(s, entry.cardInstanceId) && !isRequiredAdditionalPlayCard(s, entry.cardInstanceId));
  const allowRequiredAdditional = hasOrdinaryStagedAttack && isRequiredAdditionalPlayCard(s, choice.cardInstanceId);
  if (playFailure(s, playerId, choice.cardInstanceId, choice.faceDown === true, false, true, false, allowRequiredAdditional)) return false;
  return regularAttackSelectionPlan(s, playerId, [...currentStaged, choice]) !== undefined;
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
  if (isGenericScheduledRankedSelfDefeatSequence(a)) {
    return { kind: 'automatic_trigger', ...phasePart, window: opens, trigger };
  }
  const containsStructuredChoiceSyntax = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(containsStructuredChoiceSyntax);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (['choose_cards','choose_one','choose_locations','choose_events','choose_players','choose_each_player_option'].includes(str(current.type))) return true;
    return Object.values(current).some(containsStructuredChoiceSyntax);
  };
  const m50StructuredAutomaticPassiveTrigger = a.kind === 'passive' && trigger &&
    trigger !== 'while_active' && trigger !== 'when_play_requirements_checked' &&
    a.markers?.includes('m50_structured_v1') === true && !str(response.opens) &&
    executionMode === 'automatic' && Array.isArray(a.execution.allowedOperations) && a.execution.allowedOperations.length === 0 &&
    !containsStructuredChoiceSyntax([...a.effects, ...a.creates]);
  if (m50StructuredAutomaticPassiveTrigger) {
    return { kind: 'automatic_trigger', ...phasePart, window: opens, trigger };
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
    cardState: {}, playerStatusKeysByPlayer: {}, structuredPlayerFlagsByPlayer: {}, structuredRoundFlagKeysByPlayer: {}, ongoingEffects: [], lifecycleTransitions: [], responseWindows: [], pendingDelayedActivations: [], pendingPresenceConcealmentDefeats: [], pendingPreBattleDefeats: [], pendingPostBattleEvents: [], trustedBattleResultSnapshots: {},
    eventRuleZoneRevision: 0, rulerSealBindings: [], rulerSealBindingHistory: {}, pendingRulerSealRewards: [],
    roundTotalPowerAdjustments: { round: s.round.roundNumber, byPlayer: {} }, pendingSourceCardReturns: [], sequesteredServantSkills: [],
    usedAbilities: {}, processedEvents: [], revealedServants: [],
    events: [], calculations: [], preventEffects: false, manaCaps: {}, manaGainBlocked: [], hostRequests: [], roomMode: options.roomMode ?? 'standard',
    abilityUsage: {}, noblePhantasmCostsThisRound: {}, consecutivePlayRounds: {},
    movementDistanceThisRound: {}, battlefieldsPassedOrStayedThisRound: {},
    manaGainedThisRound: { round: s.round.roundNumber, byPlayer: {} },
    trustedVictoryPointChanges: {}, trustedManaSpentSnapshots: {}, roundPositiveVictoryPointGain: { round: s.round.roundNumber, byPlayer: {} },
    situationBenefitsSuppressedRoundByPlayer: {},
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
    case BASIC_STRENGTH_ATTACK_CONSTRAINT: {
      const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      return isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled') &&
        candidate.ownerPlayerId === ctx.controllerId && candidate.controllerPlayerId === ctx.controllerId && candidate.zone === 'hand' &&
        d?.cardType === 'basic_attack' && getEffectiveCardAttributes(s, candidate.instanceId).includes('力量') &&
        !playFailure(s, ctx.controllerId, candidate.instanceId, false, true, true, true, false, false);
    }
    case SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT: {
      const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      const controller = player(s, ctx.controllerId);
      const targetPlayer = s.players.find((entry) => entry.id === candidate.controllerPlayerId);
      const state = runtime(s).cardState[candidate.instanceId];
      return isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled') &&
        candidate.controllerPlayerId !== ctx.controllerId && candidate.ownerPlayerId === candidate.controllerPlayerId &&
        !!targetPlayer && targetPlayer.status === 'active' && !!controller.locationId && targetPlayer.locationId === controller.locationId &&
        candidate.zone === 'skill' && d?.cardType === 'servant_skill' && state?.faceDown === false;
    }
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
    if (n.type === 'formula' || n.type === 'metric') return numeric(s, ctx, n);
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
    lines.push({ label: n.op === 'min' ? `\u81f3\u591a ${args[args.length - 1]}` : args.join(n.op === 'multiply' ? ' × ' : n.op === 'add' ? ' + ' : ` ${str(n.op)} `), value: result }); return result;
  };
  return { value: visit(input), lines };
}
function structuredMetricValue(s: GameState, ctx: EffectContext, metric: RuleNode): number {
  const kind = str(metric.metric);
  if (kind === 'round_number') {
    if (metric.source !== 'controller' || Object.keys(metric).some((key) => !['type', 'metric', 'source'].includes(key))) {
      reject('invalid_formula', 'Round-number metric requires exact controller source shape');
    }
    const value = s.round.roundNumber;
    if (!Number.isSafeInteger(value) || value < 1) reject('invalid_formula', 'Round-number metric state is invalid');
    return value;
  }
  if (kind === 'victory_points') return player(s, ctx.controllerId).vp;
  if (kind === 'source_card_current_power') {
    card(s, ctx.sourceCardId);
    const value = calculateCardPower(s, ctx.sourceCardId).value;
    if (!Number.isSafeInteger(value) || value < 0) reject('invalid_formula', 'Source-card current power is invalid');
    return value;
  }
  if (kind === 'combat_power') {
    const trusted = ctx.event?.battleParticipantPowers?.[ctx.controllerId];
    if (Number.isFinite(trusted)) return Number(trusted);
    return s.cards.filter((entry) => entry.controllerPlayerId === ctx.controllerId && entry.zone === 'attack_area' && active(s, entry.instanceId))
      .reduce((sum, entry) => sum + calculateCardPower(s, entry.instanceId).value, 0);
  }
  if (kind === 'selected_card_count') return (ctx.selections[str(metric.payloadKey) || 'selectedInstanceIds'] ?? []).length;
  if (kind === 'selected_card_printed_cost') {
    const selected = ctx.selections[str(metric.payloadKey) || 'selectedInstanceIds'] ?? [];
    if (selected.length !== 1) reject('invalid_formula', 'Selected-card printed cost requires exactly one selected card');
    const value = Number(definition(s, selected[0]!)?.cardFace.cost ?? Number.NaN);
    if (!Number.isSafeInteger(value) || value < 0) reject('invalid_formula', 'Selected-card printed cost is invalid');
    return value;
  }
  if (kind === 'selected_event_victory_points') {
    const selected = ctx.selections[str(metric.payloadKey) || 'selectedEventIds'] ?? [];
    if (selected.length !== 1) reject('invalid_formula', 'Selected-event VP metric requires exactly one selected event');
    const candidate = listEventRuleCandidates(s, runtime(s).pack, ['event_deck', 'event_discard', 'event_outside_game', 'event_battlefield'])
      .find((entry) => entry.token === selected[0]);
    const value = candidate ? Number(runtime(s).pack.eventCatalog?.[candidate.eventCardId]?.printedReward) : Number.NaN;
    if (!Number.isSafeInteger(value) || value < 0) reject('invalid_formula', 'Selected-event printed VP is invalid');
    return value;
  }
  if (kind === 'face_up_definition_count') {
    const definitionId = str(metric.key); if (!definitionId) reject('invalid_formula', 'Face-up definition count requires key');
    return s.cards.filter((entry) => entry.definitionId === definitionId && runtime(s).cardState[entry.instanceId]?.faceDown !== true && entry.zone !== 'removed_from_game').length;
  }
  if (kind === 'players_with_status_count') {
    const status = str(metric.status);
    if (!status || (metric.source !== undefined && metric.source !== 'controller') || Object.keys(metric).some((key) => !['type', 'metric', 'source', 'status'].includes(key))) reject('invalid_formula', 'Players-with-status metric shape is invalid');
    return s.players.filter((entry) => playerHasStatus(s, entry.id, status)).length;
  }
  return reject('unsupported', `Unsupported structured metric: ${kind}`);
}

function numeric(s: GameState, ctx: EffectContext, input: unknown): number {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const value = node(input); const type = str(value.type);
    if (type === 'constant') {
      const result = Number(value.value); if (!Number.isFinite(result)) reject('invalid_formula', 'Structured constant must be finite'); return result;
    }
    if (type === 'current_round') {
      const offset = Number(value.offset ?? 0);
      if (!Number.isInteger(offset)) reject('invalid_formula', 'Structured current-round offset must be an integer');
      const result = s.round.roundNumber + offset;
      if (!Number.isSafeInteger(result) || result < 1) reject('invalid_formula', 'Structured current-round value is invalid');
      return result;
    }
    if (type === 'metric') return structuredMetricValue(s, ctx, value);
    if (type === 'payload_count') {
      const count = (ctx.selections[str(value.key)] ?? []).length;
      const result = count * Number(value.multiply ?? 1) + Number(value.add ?? 0);
      const min = value.min === undefined ? 0 : Number(value.min); const max = value.max === undefined ? Number.POSITIVE_INFINITY : Number(value.max);
      if (!Number.isSafeInteger(result) || result < min || result > max) reject('invalid_formula', 'Structured payload count is invalid');
      return result;
    }
    if (type === 'payload_number' || type === 'payload_number_plus') {
      const key = str(value.key); const raw = ctx.variables[key];
      if (!Number.isSafeInteger(raw)) reject('invalid_formula', `Missing structured numeric payload: ${key}`);
      const result = raw! * Number(value.multiply ?? 1) + Number(value.add ?? 0);
      const min = value.min === undefined ? 0 : Number(value.min); const max = value.max === undefined ? Number.POSITIVE_INFINITY : Number(value.max);
      if (!Number.isSafeInteger(result) || result < min || result > max) reject('invalid_formula', 'Structured numeric payload is invalid');
      return result;
    }
    if (type === 'formula') {
      const args = Array.isArray(value.args) ? (value.args as unknown[]).map((entry) => numeric(s, ctx, entry)) : [];
      let result: number;
      switch (str(value.op)) {
        case 'add': result = args.reduce((sum, entry) => sum + entry, 0); break;
        case 'subtract': if (args.length !== 2) reject('invalid_formula', 'Subtract requires two operands'); result = args[0]! - args[1]!; break;
        case 'multiply': result = args.reduce((product, entry) => product * entry, 1); break;
        case 'floor_divide': if (args.length !== 2 || args[1] === 0) reject('invalid_formula', 'Floor divide requires nonzero divisor'); result = Math.floor(args[0]! / args[1]!); break;
        case 'ceil_divide': if (args.length !== 2 || args[1] === 0) reject('invalid_formula', 'Ceil divide requires nonzero divisor'); result = Math.ceil(args[0]! / args[1]!); break;
        case 'min': if (!args.length) reject('invalid_formula', 'Min requires operands'); result = Math.min(...args); break;
        case 'max': if (!args.length) reject('invalid_formula', 'Max requires operands'); result = Math.max(...args); break;
        case 'abs': if (args.length !== 1) reject('invalid_formula', 'Abs requires one operand'); result = Math.abs(args[0]!); break;
        default: return reject('unsupported', `Unsupported structured formula operation: ${str(value.op)}`);
      }
      if (!Number.isFinite(result)) reject('invalid_formula', 'Structured formula result must be finite'); return result;
    }
  }
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
function fb254SourcePowerOngoingId(rootEventId: string, sourceCardId: string, abilityId: string): string {
  return `${EVENT_POWER_SOURCE_BONUS_POLICY}:${JSON.stringify([rootEventId, sourceCardId, abilityId])}`;
}
function parseFb254SourcePowerOngoingId(id: string): [string, string, string] | undefined {
  const prefix = `${EVENT_POWER_SOURCE_BONUS_POLICY}:`;
  if (!id.startsWith(prefix)) return undefined;
  try {
    const parsed = JSON.parse(id.slice(prefix.length));
    if (!Array.isArray(parsed) || parsed.length !== 3 || parsed.some((value) => typeof value !== 'string' || value.length === 0)) return undefined;
    const tuple = parsed as [string, string, string];
    return id === fb254SourcePowerOngoingId(tuple[0], tuple[1], tuple[2]) ? tuple : undefined;
  } catch {
    return undefined;
  }
}
function assertFb254SourcePowerOngoingState(s: GameState, ongoing: OngoingEffect): void {
  if (ongoing.policyKey !== EVENT_POWER_SOURCE_BONUS_POLICY) return;
  const r = runtime(s);
  const source = s.cards.find((candidate) => candidate.instanceId === ongoing.sourceCardId);
  const sourceDefinition = source ? r.pack.cards[source.definitionId] : undefined;
  const sourceAbility = sourceDefinition?.abilities.find((ability) => ability.id === ongoing.abilityId);
  const rootIdentity = parseFb254SourcePowerOngoingId(ongoing.id);
  const receipt = r.fb254SourcePowerInstallReceipts?.[ongoing.id];
  const receiptKeys = receipt ? Object.keys(receipt).sort() : [];
  const expectedReceiptKeys = ['abilityId', 'controllerId', 'eventLocationId', 'eventPlayerId', 'eventType', 'installedRevision', 'ongoingId', 'rootEventId', 'sourceCardId', 'sourceDefinitionId'].sort();
  const modifier = ongoing.ruleModifiers[0];
  const definition = modifier?.definition ?? {};
  const scope = node(definition.scope);
  const definitionKeys = Object.keys(definition).sort();
  const expectedDefinitionKeys = ['id', 'operation', 'rule', 'scope', 'value'].sort();
  if (!source || source.controllerPlayerId !== ongoing.controllerId ||
      source.definitionId !== ongoing.sourceDefinitionIdAtInstall || !sourceAbility ||
      classifyAcceptedEventPowerUncontestedWinRewardAbility(sourceAbility, 'compiled') !== 'opponent_entry_power' ||
      ongoing.starts !== 'immediate' || ongoing.duration !== 'while_active' || ongoing.cleanup !== 'remain_active' ||
      ongoing.sourceMustRemainActive !== true || ongoing.expiresAtRound !== undefined ||
      !Number.isInteger(ongoing.installedRevision) || ongoing.installedRevision! < 0 ||
      !rootIdentity || typeof ongoing.fb254EntryRootEventId !== 'string' || ongoing.fb254EntryRootEventId.length === 0 ||
      rootIdentity[0] !== ongoing.fb254EntryRootEventId || rootIdentity[1] !== ongoing.sourceCardId || rootIdentity[2] !== ongoing.abilityId ||
      !r.processedEvents.includes(ongoing.fb254EntryRootEventId) || !receipt ||
      receiptKeys.length !== expectedReceiptKeys.length || receiptKeys.some((key, index) => key !== expectedReceiptKeys[index]) ||
      receipt.ongoingId !== ongoing.id || receipt.rootEventId !== ongoing.fb254EntryRootEventId ||
      !isFb254EntryEventType(receipt.eventType) || receipt.eventType !== sourceAbility.activation.trigger ||
      typeof receipt.eventPlayerId !== 'string' || receipt.eventPlayerId.length === 0 || receipt.eventPlayerId === ongoing.controllerId ||
      !s.players.some((candidate) => candidate.id === receipt.eventPlayerId) ||
      typeof receipt.eventLocationId !== 'string' || receipt.eventLocationId.length === 0 || !isBattlefield(s, receipt.eventLocationId) ||
      receipt.sourceCardId !== ongoing.sourceCardId || receipt.sourceDefinitionId !== ongoing.sourceDefinitionIdAtInstall ||
      receipt.abilityId !== ongoing.abilityId || receipt.controllerId !== ongoing.controllerId ||
      receipt.installedRevision !== ongoing.installedRevision ||
      ongoing.publicZones.length !== 0 || ongoing.ruleModifiers.length !== 1 || !modifier ||
      modifier.sourceCardId !== ongoing.sourceCardId || modifier.controllerId !== ongoing.controllerId ||
      definitionKeys.length !== expectedDefinitionKeys.length || definitionKeys.some((key, index) => key !== expectedDefinitionKeys[index]) ||
      definition.id !== EVENT_POWER_SOURCE_BONUS_POLICY || definition.operation !== 'add' || definition.rule !== 'card.currentPower' ||
      definition.value !== 2 || scope.object !== 'source_card' || Object.keys(scope).length !== 1) {
    reject('invalid_state', 'Malformed FB2-54 source-card combat-power bonus state');
  }
}
function liveOngoing(s: GameState): OngoingEffect[] {
  const seenFb254Roots = new Set<string>();
  for (const ongoing of runtime(s).ongoingEffects) {
    if (ongoing.policyKey !== EVENT_POWER_SOURCE_BONUS_POLICY && ongoing.fb254EntryRootEventId !== undefined) {
      reject('invalid_state', 'FB2-54 entry-root metadata is forbidden on unrelated ongoing state');
    }
    assertFb254SourcePowerOngoingState(s, ongoing);
    if (ongoing.policyKey !== EVENT_POWER_SOURCE_BONUS_POLICY) continue;
    if (seenFb254Roots.has(ongoing.id)) reject('invalid_state', 'Duplicate FB2-54 trusted entry root for source ability');
    seenFb254Roots.add(ongoing.id);
  }
  for (const [ongoingId, receipt] of Object.entries(runtime(s).fb254SourcePowerInstallReceipts ?? {})) {
    if (receipt.ongoingId !== ongoingId || !runtime(s).ongoingEffects.some((ongoing) => ongoing.id === ongoingId && ongoing.policyKey === EVENT_POWER_SOURCE_BONUS_POLICY)) {
      reject('invalid_state', 'Malformed FB2-54 source-power install receipt state');
    }
  }
  return runtime(s).ongoingEffects.filter((ongoing) =>
    sourceBoundOngoingIsLive(s, ongoing) &&
    (ongoing.expiresAtRound === undefined || s.round.roundNumber < ongoing.expiresAtRound));
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
  const faceDown = runtime(s).cardState[sourceId]?.faceDown === true;
  const faceDownPrintedPowerOverride = faceDown ? m50FaceDownAttackPrintedBasePowerOverride(s, sourceId) : undefined;
  if (faceDown && faceDownPrintedPowerOverride === undefined) return { value: 0, lines: [{ label: '暗置攻击无伤害结算', value: 0 }] };
  const source = card(s, sourceId); const d = definition(s, sourceId);
  const persistentLock = s.ruleOverrides?.masterSkillPowerLockIfSituationForbidsByPlayer?.[source.controllerPlayerId];
  if (d?.cardType === 'master_skill' && persistentLock && situationForbidsAttribute(s, persistentLock.attribute)) {
    return { value: persistentLock.value, lines: [{ label: 'persistent_situation_attribute_power_lock', value: persistentLock.value }] };
  }
  const result = evaluateFormula(faceDownPrintedPowerOverride ?? d?.cardFace.basePower ?? 0, s, source.controllerPlayerId, sourceId);
  if (faceDownPrintedPowerOverride !== undefined) result.lines.push({ label: 'm50_face_down_printed_base_power', value: result.value });
  const physicalMultiplier = runtime(s).cardState[sourceId]?.basePowerMultiplier ?? 1;
  if (!Number.isSafeInteger(physicalMultiplier) || physicalMultiplier < 1) reject('invalid_modifier', 'Physical-card base-power multiplier is invalid');
  if (physicalMultiplier !== 1) {
    result.value *= physicalMultiplier;
    if (!Number.isSafeInteger(result.value)) reject('invalid_modifier', 'Physical-card base-power multiplier overflow');
    result.lines.push({ label: 'physical_card_base_power_multiplier', value: result.value });
  }
  const linkedPlayerMultipliers = m50LinkedPlayerCardMultipliers(s, sourceId);
  if (linkedPlayerMultipliers.basePower !== 1) {
    result.value *= linkedPlayerMultipliers.basePower;
    if (!Number.isFinite(result.value)) reject('invalid_modifier', 'Linked-player base-power multiplier overflow');
    result.lines.push({ label: 'm50_linked_player_base_power_multiplier', value: result.value });
  }
  const ownedDefinitionAdjustment = ownedDefinitionCardRuleAdjustment(s, sourceId);
  const b02BasicAdjustment = b02OwnedBasicAttackAdjustment(s, sourceId);
  const m50StructuralAdjustment = m50AdditiveCardAdjustment(s, sourceId);
  if (ownedDefinitionAdjustment.power !== 0) {
    result.value += ownedDefinitionAdjustment.power;
    result.lines.push({ label: 'active_source_owned_definition_base_power', value: result.value });
  }
  if (b02BasicAdjustment.power !== 0) {
    result.value += b02BasicAdjustment.power;
    result.lines.push({ label: 'owned_passive_basic_attack_power', value: result.value });
  }
  if (m50StructuralAdjustment.power !== 0) {
    result.value += m50StructuralAdjustment.power;
    result.lines.push({ label: 'm50_structural_card_power', value: result.value });
  }
  for (const modifier of ((source as unknown as { powerModifiers?: Array<Record<string, unknown>> }).powerModifiers ?? [])) {
    const value = Number(modifier.value ?? 0);
    if (!Number.isFinite(value)) reject('invalid_modifier', 'Card power modifier must be finite');
    if (modifier.kind === 'set') result.value = value;
    else if (modifier.kind === 'add') result.value += value;
    else if (modifier.kind === 'reverse_situation_event') continue;
    else reject('unsupported', `Unsupported card power modifier: ${str(modifier.kind)}`);
    result.lines.push({ label: str(modifier.sourceId) || str(modifier.id) || 'card_power_modifier', value: result.value });
  }
  const scheduledB03Bonus = b03ScheduledCardPowerBonus(s, sourceId);
  if (scheduledB03Bonus !== 0) { result.value += scheduledB03Bonus; result.lines.push({ label: 'f4_b03_scheduled_card_power', value: result.value }); }
  const b04Bonus = b04SourcePowerBonus(s, sourceId);
  if (b04Bonus !== 0) { result.value += b04Bonus; result.lines.push({ label: 'f4_b04_source_power', value: result.value }); }
  const b06Bonus = b06SourcePowerBonus(s, sourceId);
  if (b06Bonus !== 0) { result.value += b06Bonus; result.lines.push({ label: 'f4_b06_event_burst_source_power', value: result.value }); }
  const modifiers = liveOngoing(s).flatMap(o => o.ruleModifiers).sort((a, b) =>
    Number(node(a.definition.priority).tier === 'explicit_exception') - Number(node(b.definition.priority).tier === 'explicit_exception'));
  for (const modifier of modifiers) {
    const m = modifier.definition; const scope = node(m.scope); if (m.rule === 'effect_prevention' || m.rule === 'card_close' || m.rule === 'movement_destinations' || m.rule === 'card_cost') continue;
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
  if (b03OpponentCardPowerSetZero(s, sourceId)) { result.value = 0; result.lines.push({ label: 'f4_b03_opponent_card_power_set_zero', value: 0 }); }
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
function normalizeStructuredZone(zone: unknown): string {
  const value = str(zone);
  if (value === 'attack') return 'attack_area';
  if (value === 'servant-skills' || value === 'master-skills') return 'skill';
  if (value === 'removed') return 'removed_from_game';
  return value;
}

function normalizeStructuredLocationId(locationId: unknown): string {
  const value = str(locationId);
  const aliases: Record<string, string> = {
    scouting: 'recon', workshop: 'magic_workshop', mountain: 'miyama_town', city: 'shinto',
  };
  return aliases[value] ?? value;
}

function structuredChoiceSelectionKey(effect: RuleNode): string {
  if (str(effect.payloadKey)) return str(effect.payloadKey);
  if (effect.type === 'choose_locations') return 'targetLocationId';
  if (effect.type === 'choose_events') return 'selectedEventIds';
  if (effect.type === 'choose_players') return 'targetPlayerId';
  if (effect.type === 'choose_one') return str(effect.id) || 'selectedOptionId';
  return 'selectedInstanceIds';
}

function structuredCountTargetPlayerIds(s: GameState, ctx: EffectContext, rawTarget: unknown): PlayerId[] {
  const target = node(rawTarget); const scope = str(target.scope);
  if (scope === 'turn_order_after_controller') {
    const ordered = s.players.slice().sort((left, right) => left.seat - right.seat);
    const index = ordered.findIndex((entry) => entry.id === ctx.controllerId);
    if (index < 0) reject('invalid_state', 'Structured turn-order count target controller is missing');
    return ordered.slice(index + 1).filter((entry) => entry.status === 'active').map((entry) => entry.id);
  }
  if (scope === 'same_battlefield_players') {
    const locationId = player(s, ctx.controllerId).locationId;
    if (!isBattlefield(s, locationId)) return [];
    return s.players.filter((entry) => entry.status === 'active' && entry.locationId === locationId).map((entry) => entry.id);
  }
  return structuredChoiceTargetPlayers(s, ctx, rawTarget);
}

function deployedThisRoundAtControllerLocation(s: GameState, ctx: EffectContext, playerId: PlayerId): boolean {
  const here=player(s,ctx.controllerId).locationId; if(!here) return false;
  return s.log.some((entry)=>entry.type==='player_deployment_recorded'&&entry.payload?.playerId===playerId&&entry.payload?.locationId===here&&entry.payload?.roundNumber===s.round.roundNumber);
}
function commandSealCount(s: GameState, playerId: PlayerId): number {
  const value = Number((player(s, playerId) as unknown as { commandSpells?: number }).commandSpells ?? 3);
  if (!Number.isSafeInteger(value) || value < 0) reject('invalid_state', 'Command-seal count is invalid');
  return value;
}
function structuredPlayerCandidateConditionMatches(s: GameState, ctx: EffectContext, candidateId: PlayerId, entry: RuleNode): boolean {
  if (entry.type === 'lacks_status') {
    const status = str(entry.status); if (!status || Object.keys(entry).some((key) => !['type','status'].includes(key))) reject('unsupported', 'Candidate lacks-status condition is invalid');
    return !playerHasStatus(s, candidateId, status);
  }
  if (entry.type === 'has_status') {
    const status = str(entry.status); if (!status || Object.keys(entry).some((key) => !['type','status'].includes(key))) reject('unsupported', 'Candidate has-status condition is invalid');
    return playerHasStatus(s, candidateId, status);
  }
  if (entry.type === 'command_seals_less_than_controller') {
    if (Object.keys(entry).some((key) => key !== 'type')) reject('unsupported', 'Candidate command-seal comparison shape is invalid');
    return commandSealCount(s, candidateId) < commandSealCount(s, ctx.controllerId);
  }
  if (entry.type === 'can_pay_mana') {
    const amount = Number(entry.amount);
    if (!Number.isSafeInteger(amount) || amount < 0 || Object.keys(entry).some((key) => !['type', 'amount'].includes(key))) {
      reject('unsupported', 'Candidate mana-payment condition is invalid');
    }
    return player(s, candidateId).mana >= amount;
  }
  if (entry.type === 'can_effect_move_to_controller_location') {
    if (Object.keys(entry).some((key) => key !== 'type')) reject('unsupported', 'Candidate effect-movement condition is invalid');
    const controller = player(s, ctx.controllerId);
    const candidate = player(s, candidateId);
    if (!controller.locationId || candidate.locationId === controller.locationId) return false;
    const probe = movePlayerCore(structuredClone(s), { playerId: candidateId, to: controller.locationId, movementKind: 'effect', ignorePathForEffect: true });
    return probe.moved;
  }
  if (entry.type === 'lacks_linked_skill_card') {
    const linkedSkillId = str(entry.linkedSkillId);
    const rawZones = Array.isArray(entry.zones) ? entry.zones : [];
    const zones = rawZones.map(normalizeStructuredZone);
    if (!linkedSkillId || !rawZones.length || zones.some((zone) => !zone) ||
        Object.keys(entry).some((key) => !['type', 'linkedSkillId', 'zones'].includes(key))) {
      reject('unsupported', 'Candidate linked-skill absence condition is invalid');
    }
    return !s.cards.some((candidate) => candidate.controllerPlayerId === candidateId && candidate.definitionId === linkedSkillId && zones.includes(candidate.zone));
  }
  if (entry.type === 'victory_points_not_first') {
    if (Object.keys(entry).some((key) => key !== 'type')) reject('unsupported', 'Candidate victory-point rank condition is invalid');
    const active = s.players.filter((candidate) => candidate.status === 'active');
    if (!active.length) reject('invalid_state', 'Victory-point rank requires at least one active player');
    const highest = Math.max(...active.map((candidate) => candidate.vp));
    return player(s, candidateId).vp < highest;
  }
  return condition(s, { ...ctx, controllerId: candidateId }, entry);
}
function structuredPlayerWhereMatches(s: GameState, ctx: EffectContext, playerId: PlayerId, predicate: RuleNode): boolean {
  if (predicate.type === 'deployed_this_round_at_controller_location' && Object.keys(predicate).length === 1) return deployedThisRoundAtControllerLocation(s, ctx, playerId);
  if (predicate.type === M50_PLAYER_FLAG_GREATER_THAN_MANA_RATIO) {
    const parsed = parseM50PlayerFlagManaRatioPredicate(predicate);
    if (!parsed) reject('unsupported', 'Player-flag/mana ratio target predicate is invalid');
    const target = player(s, playerId);
    const rawFlagValue = structuredFlagValue(s, playerId, parsed.key);
    const flagValue = rawFlagValue === undefined ? 0 : Number(rawFlagValue);
    if (!Number.isSafeInteger(flagValue) || flagValue < 0 || !Number.isSafeInteger(target.mana) || target.mana < 0) {
      reject('invalid_state', 'Player-flag/mana ratio requires nonnegative safe-integer server state');
    }
    const left = flagValue * parsed.denominator;
    const right = target.mana * parsed.numerator;
    if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) reject('invalid_state', 'Player-flag/mana ratio comparison exceeds safe integer range');
    return left > right;
  }  if (predicate.type === 'face_up_cards_played_this_round_at_least') {
    const count = Number(predicate.count);
    if (Object.keys(predicate).some((key) => !['type', 'count'].includes(key)) || !Number.isSafeInteger(count) || count < 0) {
      reject('unsupported', 'Face-up play-count target predicate is invalid');
    }
    return faceUpCardsPlayedThisRound(s, playerId) >= count;
  }
  reject('unsupported','Unsupported structured player target predicate');
}

function structuredChoiceTargetPlayers(s: GameState, ctx: EffectContext, rawTarget: unknown): PlayerId[] {
  if (rawTarget === undefined || rawTarget === null || rawTarget === '' || rawTarget === 'controller' || rawTarget === 'self') return [ctx.controllerId];
  if (typeof rawTarget === 'string') return structuredTargetPlayerIds(s, ctx, rawTarget);
  const target = node(rawTarget);
  const scope = str(target.scope);
  if (scope === 'same_battlefield_opponents' || scope === 'same_location_opponents') {
    const here = player(s, ctx.controllerId).locationId;
    const where=nodes(target.where);
    return s.players.filter((entry) => entry.status === 'active' && entry.id !== ctx.controllerId && entry.locationId === here && where.every((predicate)=>structuredPlayerWhereMatches(s,ctx,entry.id,predicate))).map((entry) => entry.id);
  }
  if (scope === 'same_location_players') {
    const here = player(s, ctx.controllerId).locationId;
    return s.players.filter((entry) => entry.status === 'active' && entry.locationId === here).map((entry) => entry.id);
  }
  if (scope === 'all_opponents') {
    if (Object.keys(target).some((key) => key !== 'scope')) reject('unsupported', 'Structured all-opponents target contains unsupported fields');
    return s.players.filter((entry) => entry.status === 'active' && entry.id !== ctx.controllerId).map((entry) => entry.id);
  }
  if (scope === 'all_players') {
    const where = nodes(target.where);
    if (Object.keys(target).some((key) => !['scope','where'].includes(key))) reject('unsupported', 'Structured all-players target contains unsupported fields');
    return s.players.filter((entry) => entry.status === 'active' && where.every((predicate) => structuredPlayerWhereMatches(s, ctx, entry.id, predicate))).map((entry) => entry.id);
  }
  if (scope === 'players_with_status') {
    const status = str(target.status);
    if (!status || Object.keys(target).some((key) => !['scope','status'].includes(key))) reject('unsupported', 'Structured status-scoped choice target is invalid');
    return s.players.filter((entry) => entry.status === 'active' && playerHasStatus(s, entry.id, status)).map((entry) => entry.id);
  }
  if (scope === 'selected_card_owners') {
    const payloadKey = str(target.payloadKey); const ids = ctx.selections[payloadKey] ?? [];
    return [...new Set(ids.map((instanceId) => s.cards.find((entry) => entry.instanceId === instanceId)?.ownerPlayerId).filter((id): id is PlayerId => !!id))];
  }
  if (scope === 'selected_same_battlefield_player' || scope === 'selected_any_player') {
    const known = new Set(s.players.map((entry) => entry.id));
    const selected = Object.values(ctx.selections).flat().filter((id) => known.has(id));
    if (scope === 'selected_same_battlefield_player') {
      const here = player(s, ctx.controllerId).locationId;
      return [...new Set(selected.filter((id) => player(s, id).locationId === here))];
    }
    return [...new Set(selected)];
  }
  return structuredTargetPlayerIds(s, ctx, rawTarget);
}

function structuredChoiceCandidates(s: GameState, ctx: EffectContext, effect: RuleNode): string[] {
  if (effect.type === 'choose_one') {
    return nodes(effect.options).filter((option) => nodes(option.conditions).every((entry) => condition(s, ctx, entry))).map((option) => str(option.id)).filter(Boolean);
  }
  if (effect.type === 'choose_players') {
    if (Number(effect.minCount ?? 1) !== 1 || Number(effect.maxCount ?? 1) !== 1) reject('unsupported', 'Structured player choice currently requires exactly one target');
    const rawTarget = effect.candidateTarget;
    let target: RuleNode;
    if (rawTarget === 'all_opponents') target = { type: 'player', constraints: [{ type: 'not_controller' }] };
    else if (rawTarget === 'same_location_opponents' || rawTarget === 'same_battlefield_opponents' || rawTarget === 'engaged_opponents') target = { type: 'player', constraints: [{ type: 'not_controller' }, { type: 'same_battlefield_as_controller' }] };
    else if (rawTarget && typeof rawTarget === 'object' && ['same_location_opponents','same_battlefield_opponents'].includes(str(node(rawTarget).scope))) target = { type: 'player', constraints: [{ type: 'not_controller' }, { type: 'same_battlefield_as_controller' }] };
    else if (rawTarget && typeof rawTarget === 'object' && str(node(rawTarget).scope) === 'event_combat_opponents') {
      const ids = structuredChoiceTargetPlayers(s, ctx, rawTarget);
      const extra = nodes(effect.candidateConditions);
      return extra.length ? ids.filter((playerId) => extra.every((entry) => structuredPlayerCandidateConditionMatches(s, ctx, playerId, entry))) : ids;
    }
    else reject('unsupported', 'Structured player choice target scope is unsupported');
    let ids = candidates(s, ctx, target);
    const extra = nodes(effect.candidateConditions);
    if (extra.length) ids = ids.filter((playerId) => extra.every((entry) => structuredPlayerCandidateConditionMatches(s, ctx, playerId, entry)));
    return ids;
  }
  if (effect.type === 'choose_locations') {
    const current = player(s, ctx.controllerId).locationId ?? '';
    const allowed = Array.isArray(effect.allowedLocationIds) ? (effect.allowedLocationIds as unknown[]).map(normalizeStructuredLocationId) : [];
    let ids = getEnabledLocations(s.map, s.locationConfig).map((entry) => entry.id).filter((id) => !allowed.length || allowed.includes(id));
    if (effect.excludeCurrent === true) ids = ids.filter((id) => id !== current);
    if (effect.adjacentOnly === true) {
      const reachable = new Set(getReachableLocationsAlongArrows(s, current, 1, ctx.controllerId)); ids = ids.filter((id) => reachable.has(id));
    }
    if (effect.forwardOnly === true) {
      const maxSteps = numeric(s, ctx, effect.maxForwardSteps ?? 1); const minSteps = numeric(s, ctx, effect.minForwardSteps ?? 1);
      if (!Number.isSafeInteger(maxSteps) || !Number.isSafeInteger(minSteps) || minSteps < 1 || maxSteps < minSteps) reject('unsupported', 'Structured forward movement bounds are invalid');
      const maxReachable = new Set(getReachableLocationsAlongArrows(s, current, maxSteps, ctx.controllerId));
      ids = ids.filter((id) => maxReachable.has(id));
      if (minSteps > 1) { const tooNear = new Set(getReachableLocationsAlongArrows(s, current, minSteps - 1, ctx.controllerId)); ids = ids.filter((id) => !tooNear.has(id)); }
    }
    return ids.filter((id) => canOccupyLocation({ map: s.map, config: s.locationConfig, locationId: id, movingPlayerId: ctx.controllerId,
      occupyingPlayerIds: s.players.filter((entry) => entry.status === 'active' && entry.id !== ctx.controllerId && entry.locationId === id).map((entry) => entry.id),
      ...(s.ruleOverrides ? { ruleOverrides: s.ruleOverrides } : {}) }));
  }
  if (effect.type === 'choose_events') {
    const locationId = effect.locationId === 'controller_location' ? player(s, ctx.controllerId).locationId : normalizeStructuredLocationId(effect.locationId);
    const sourceZone = str(effect.sourceZone);
    const zones: EventRuleZone[] = sourceZone === 'current' ? ['event_battlefield'] : sourceZone === 'deck' ? ['event_deck'] :
      sourceZone === 'discard' ? ['event_discard'] : sourceZone === 'outside_game' ? ['event_outside_game'] :
      sourceZone === 'all' || !sourceZone ? ['event_battlefield', 'event_deck', 'event_discard', 'event_outside_game'] : [];
    if (!zones.length) reject('unsupported', 'Structured event choice source zone is unsupported');
    const visibility = str(effect.visibility);
    if (visibility && !['up', 'down'].includes(visibility)) reject('unsupported', 'Structured event choice visibility is unsupported');
    let candidates = listEventRuleCandidates(s, runtime(s).pack, zones)
      .filter((entry) => !locationId || entry.locationId === locationId)
      .filter((entry) => !visibility || entry.visibility === (visibility === 'up' ? 'public' : 'hidden_until_trigger'))
      .filter((entry) => effect.victoryPoints === undefined || runtime(s).pack.eventCatalog?.[entry.eventCardId]?.printedReward === numeric(s, ctx, effect.victoryPoints));
    if (effect.topCount !== undefined) {
      const topCount = Number(effect.topCount);
      if (sourceZone !== 'deck' || !Number.isSafeInteger(topCount) || topCount < 0) reject('unsupported', 'Structured top-event choice requires a nonnegative deck topCount');
      candidates = candidates.slice(0, topCount);
    }
    return candidates.map((entry) => entry.token);
  }
  if (effect.type !== 'choose_cards') return [];
  const targetPlayers = new Set(structuredChoiceTargetPlayers(s, ctx, effect.target));
  const zones = (Array.isArray(effect.zones) ? effect.zones : [effect.zone]).map(normalizeStructuredZone).filter(Boolean);
  const definitions = new Set((Array.isArray(effect.definitionIds) ? effect.definitionIds : effect.definitionId ? [effect.definitionId] : []).map(str));
  const linkedSkillId = str(effect.linkedSkillId);
  const source = card(s, ctx.sourceCardId);
  return s.cards.filter((candidate) => {
    if (!targetPlayers.has(candidate.controllerPlayerId) && !targetPlayers.has(candidate.ownerPlayerId)) return false;
    if (zones.length && !zones.includes(candidate.zone)) return false;
    if (definitions.size && !definitions.has(candidate.definitionId)) return false;
    if (linkedSkillId && candidate.definitionId !== linkedSkillId) return false;
    const cardState = runtime(s).cardState[candidate.instanceId];
    if (effect.face === 'up' && cardState?.faceDown === true) return false;
    if (effect.face === 'down' && cardState?.faceDown !== true) return false;
    const def = definition(s, candidate.instanceId);
    if (effect.basicOnly === true && def?.cardType !== 'basic_attack') return false;
    if (effect.attackOnly === true && !isAttack(def)) return false;
    if (effect.activeOnly === true && !active(s, candidate.instanceId)) return false;
    if (effect.attackZoneActiveOnly === true && candidate.zone === 'attack_area' && !active(s, candidate.instanceId)) return false;
    if (effect.attackZoneNonSkillOnly === true && candidate.zone === 'attack_area' && def?.cardType === 'servant_skill') return false;
    if (effect.matchesControlledAttack === true && !s.cards.some((entry) => entry.controllerPlayerId === ctx.controllerId && entry.zone === 'attack_area' && entry.definitionId === candidate.definitionId)) return false;
    if (effect.playableOnly === true && (!def || def.mode !== 'automatic')) return false;
    const sameBasePayload = str(effect.sameBasePowerAsPayloadKey);
    if (sameBasePayload) {
      const selected = ctx.selections[sameBasePayload]?.[0]; const selectedDef = selected ? definition(s, selected) : undefined;
      if (!selectedDef || Number(selectedDef.cardFace.basePower ?? 0) !== Number(def?.cardFace.basePower ?? 0)) return false;
    }
    const sameAttributePayload = str(effect.sameAttributeAsPayloadKey);
    if (sameAttributePayload) {
      const selected = ctx.selections[sameAttributePayload]?.[0]; if (!selected) return false;
      const attrs = getEffectiveCardAttributes(s, selected); if (!attrs.some((attribute) => getEffectiveCardAttributes(s, candidate.instanceId).includes(attribute))) return false;
    }
    return candidate.instanceId !== source.instanceId;
  }).map((entry) => entry.instanceId);
}

function isStructuredEachPlayerOptionEffect(effect: RuleNode): boolean {
  if (effect.type !== 'choose_each_player_option') return false;
  const target = node(effect.candidateTarget); const scope = str(target.scope);
  if (!['same_location_opponents', 'same_battlefield_opponents', 'all_opponents'].includes(scope) || Object.keys(target).some((key) => key !== 'scope')) return false;
  const options = nodes(effect.options);
  if (options.length < 2 || options.length > 8) return false;
  const ids = options.map((option) => str(option.id));
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return false;
  if (options.some((option) => Object.keys(option).some((key) => !['id','label','effects'].includes(key)) ||
      (option.label !== undefined && typeof option.label !== 'string') || !Array.isArray(option.effects) ||
      nodes(option.effects).some((entry) => ['choose_each_player_option','choose_cards','choose_one','choose_locations','choose_events','choose_players'].includes(str(entry.type))))) return false;
  if (effect.candidateConditions !== undefined && !Array.isArray(effect.candidateConditions)) return false;
  if (effect.skipIfNoCandidates !== undefined && effect.skipIfNoCandidates !== true && effect.skipIfNoCandidates !== false) return false;
  return Object.keys(effect).every((key) => ['type','candidateTarget','options','candidateConditions','skipIfNoCandidates'].includes(key));
}
function isStructuredEachPlayerOptionAbility(a: AuthoringAbility): boolean {
  return a.effects.some((effect) => isStructuredEachPlayerOptionEffect(effect));
}
function structuredEachPlayerOptionCandidates(s: GameState, ctx: EffectContext, effect: RuleNode): PlayerId[] {
  if (!isStructuredEachPlayerOptionEffect(effect)) reject('unsupported', 'Structured each-player option shape is invalid');
  const extra = nodes(effect.candidateConditions);
  return structuredChoiceTargetPlayers(s, ctx, effect.candidateTarget)
    .filter((id) => extra.every((entry) => structuredPlayerCandidateConditionMatches(s, ctx, id, entry)))
    .sort((left, right) => player(s, left).seat - player(s, right).seat);
}
function stageNextStructuredEachPlayerOptionDecision(s: GameState): void {
  const r = runtime(s); const pending = r.pendingStructuredEachPlayerOption;
  if (!pending) return;
  while (pending.remainingDecisionPlayerIds.length && player(s, pending.remainingDecisionPlayerIds[0]!).status !== 'active') pending.remainingDecisionPlayerIds.shift();
  if (!pending.remainingDecisionPlayerIds.length) {
    const tail = pending.remainingEffects; const ctx = structuredClone(pending.context);
    delete r.pendingStructuredEachPlayerOption;
    if (tail.length) executeEffects(s, ctx, tail);
    return;
  }
  const decisionPlayerId = pending.remainingDecisionPlayerIds[0]!;
  const id = nextId(s, 'm50-each-player-option');
  const decisionContext = structuredClone(pending.context);
  decisionContext.selections.decisionPlayerId = [decisionPlayerId];
  const target: RuleNode = { id: 'm50_each_player_option', type: 'choice', options: pending.optionIds.map((optionId) => ({ id: optionId })) };
  r.pendingDecision = {
    id, controllerId: decisionPlayerId, target, candidates: [...pending.optionIds], min: 1, max: 1,
    context: decisionContext, remainingEffects: [],
    interaction: {
      kind: 'structured_each_player_option_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: pending.sourceCardId, abilityId: pending.abilityId, createdRevision: r.revision + 1,
      continuationRef: `${id}:continuation`, initiatingControllerId: pending.initiatingControllerId, decisionPlayerId,
      remainingDecisionPlayerIds: [...pending.remainingDecisionPlayerIds], optionIds: [...pending.optionIds],
      constraints: { kind: 'target', targetKind: 'option', min: 1, max: 1, distinct: true },
    },
  };
}
function stageStructuredEachPlayerOption(s: GameState, ctx: EffectContext, effect: RuleNode, remainingEffects: RuleNode[]): boolean {
  if (!isStructuredEachPlayerOptionEffect(effect)) reject('unsupported', 'Structured each-player option shape is invalid');
  const candidates = structuredEachPlayerOptionCandidates(s, ctx, effect);
  if (!candidates.length) {
    if (effect.skipIfNoCandidates === true) return false;
    reject('no_legal_target', 'No legal each-player option chooser remains');
  }
  const optionIds = nodes(effect.options).map((option) => str(option.id));
  runtime(s).pendingStructuredEachPlayerOption = {
    initiatingControllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
    choice: structuredClone(effect), remainingEffects: structuredClone(remainingEffects), context: structuredClone(ctx),
    remainingDecisionPlayerIds: [...candidates], optionIds: [...optionIds],
  };
  stageNextStructuredEachPlayerOptionDecision(s);
  return true;
}

function structuredChoicePending(s: GameState, ctx: EffectContext, effect: RuleNode, remainingEffects: RuleNode[]): PendingDecision | undefined {
  if (!['choose_cards', 'choose_one', 'choose_locations', 'choose_events', 'choose_players'].includes(str(effect.type))) return undefined;
  const key = structuredChoiceSelectionKey(effect);
  if (Object.prototype.hasOwnProperty.call(ctx.selections, key)) return undefined;
  const options = structuredChoiceCandidates(s, ctx, effect);
  let min = Number(effect.minCount ?? (effect.allowCancel === true ? 0 : 1));
  let maxRaw = effect.maxCount ?? 1;
  let max = maxRaw === 'all' ? options.length : Number(maxRaw);
  if (effect.type === 'choose_one') { min = effect.allowCancel === true ? 0 : 1; max = 1; }
  if (!Number.isSafeInteger(min) || min < 0 || !Number.isSafeInteger(max) || max < min) reject('unsupported', 'Structured choice count bounds are invalid');
  max = Math.min(max, options.length);
  if (options.length < min) {
    if (effect.skipIfNoCandidates === true || min === 0) { ctx.selections[key] = []; return undefined; }
    reject('no_legal_target', 'No legal structured choice remains');
  }
  const target: RuleNode = { type: 'm50_structured_choice', id: key, effect: structuredClone(effect), count: { min, max } };
  return { id: nextId(s, 'decision'), controllerId: ctx.controllerId, target, candidates: options, min, max, context: structuredClone(ctx), remainingEffects };
}

function candidates(s: GameState, ctx: EffectContext, target: RuleNode): string[] {
  if (target.type === 'm50_structured_choice') return structuredChoiceCandidates(s, ctx, node(target.effect));
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

function isFb254EntryEventType(type: unknown): type is (typeof EVENT_POWER_ENTRY_TRIGGERS)[number] {
  return EVENT_POWER_ENTRY_TRIGGERS.includes(type as (typeof EVENT_POWER_ENTRY_TRIGGERS)[number]);
}
function rememberTrustedFb254EntryEvent(s: GameState, event: AbilityEvent): void {
  if (!isFb254EntryEventType(event.type)) reject('invalid_event', 'FB2-54 trusted entry producer received an unsupported event type');
  const keys = Object.keys(event).sort();
  const expectedKeys = ['id', 'locationId', 'playerId', 'type'].sort();
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index]) ||
      typeof event.id !== 'string' || event.id.length === 0 || typeof event.playerId !== 'string' ||
      typeof event.locationId !== 'string' || event.locationId.length === 0) {
    reject('invalid_event', 'FB2-54 trusted entry producer requires exact event shape');
  }
  const snapshots = runtime(s).trustedEntryEventSnapshots ??= {};
  const existing = snapshots[event.id];
  if (existing && (existing.type !== event.type || existing.playerId !== event.playerId || existing.locationId !== event.locationId)) {
    reject('invalid_state', 'FB2-54 trusted entry event id is already bound to different facts');
  }
  snapshots[event.id] = { type: event.type, playerId: event.playerId, locationId: event.locationId };
}
function forgetTrustedFb254EntryEvent(s: GameState, eventId: string): void {
  const snapshots = runtime(s).trustedEntryEventSnapshots;
  if (!snapshots) return;
  delete snapshots[eventId];
  if (Object.keys(snapshots).length === 0) delete runtime(s).trustedEntryEventSnapshots;
}
function fb254EntryEventMatches(s: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  const event = ctx.event;
  if (!event || !isFb254EntryEventType(event.type) || event.type !== ability.activation.trigger) return false;
  const keys = Object.keys(event).sort();
  const expectedKeys = ['id', 'locationId', 'playerId', 'type'].sort();
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index]) ||
      typeof event.id !== 'string' || event.id.length === 0 || typeof event.playerId !== 'string' ||
      typeof event.locationId !== 'string' || event.locationId.length === 0 || event.playerId === ctx.controllerId) return false;
  const trusted = runtime(s).trustedEntryEventSnapshots?.[event.id];
  const affected = s.players.find((candidate) => candidate.id === event.playerId);
  const controller = s.players.find((candidate) => candidate.id === ctx.controllerId);
  if (!trusted || trusted.type !== event.type || trusted.playerId !== event.playerId || trusted.locationId !== event.locationId ||
      !affected || !controller || affected.status !== 'active' || controller.status !== 'active' ||
      affected.locationId !== event.locationId || controller.locationId !== event.locationId || !isBattlefield(s, event.locationId)) return false;
  return true;
}

function exactStringArray(left: unknown, right: unknown): boolean {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
    left.every((value, index) => typeof value === 'string' && value === right[index]);
}
function exactPowerSnapshot(left: unknown, right: unknown): boolean {
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) || Array.isArray(right)) return false;
  const a = left as Record<string, unknown>; const b = right as Record<string, unknown>;
  const aKeys = Object.keys(a).sort(); const bKeys = Object.keys(b).sort();
  return aKeys.length === bKeys.length && aKeys.every((key, index) => key === bKeys[index] &&
    Number.isFinite(a[key]) && a[key] === b[key]);
}
function fb254TrustedControllerWinEventMatches(s: GameState, ctx: EffectContext): boolean {
  const event = ctx.event;
  if (!event || event.type !== 'after_controller_wins_battle' || event.playerId !== ctx.controllerId ||
      typeof event.resultId !== 'string' || typeof event.battleId !== 'string' ||
      typeof event.battlePhaseResolutionId !== 'string' || typeof event.battlefieldId !== 'string' ||
      event.id !== `${event.resultId}:win:${ctx.controllerId}`) return false;
  const keys = Object.keys(event).sort();
  const expectedKeys = ['battleId', 'battleParticipantIds', 'battleParticipantPowers', 'battlePhaseResolutionId', 'battleResult', 'battlefieldId', 'id', 'playerId', 'resultId', 'type'].sort();
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) return false;
  const trusted = runtime(s).trustedBattleResultSnapshots?.[event.resultId];
  const knownPlayerIds = new Set(s.players.map((candidate) => candidate.id));
  if (!trusted || trusted.battlePhaseResolutionId !== event.battlePhaseResolutionId || trusted.battleId !== event.battleId ||
      trusted.resultId !== event.resultId || trusted.battlefieldId !== event.battlefieldId ||
      !exactStringArray(event.battleParticipantIds, trusted.battleParticipantIds) ||
      !exactStringArray(event.battleResult?.winners, trusted.winners) || !exactStringArray(event.battleResult?.loserIds, trusted.loserIds) ||
      !exactPowerSnapshot(event.battleParticipantPowers, trusted.battleParticipantPowers) ||
      !Array.isArray(event.battleParticipantIds) || new Set(event.battleParticipantIds).size !== event.battleParticipantIds.length ||
      event.battleParticipantIds.some((playerId) => !knownPlayerIds.has(playerId)) ||
      !event.battleParticipantIds.includes(ctx.controllerId) || !trusted.winners.includes(ctx.controllerId)) return false;
  const controller = s.players.find((candidate) => candidate.id === ctx.controllerId);
  return !!controller && controller.locationId === event.battlefieldId && isBattlefield(s, event.battlefieldId);
}

function fb254LocationCondition(s: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  const variant = classifyAcceptedEventPowerUncontestedWinRewardAbility(ability, 'compiled');
  if (variant === 'opponent_entry_power') return fb254EntryEventMatches(s, ctx, ability);
  if (variant === 'uncontested_win_reward') return fb254TrustedControllerWinEventMatches(s, ctx);
  return eventLocationEqualsController(s, ctx.controllerId, ctx.event);
}

function fb254BattleOpponentCountCondition(s: GameState, ctx: EffectContext, conditionNode: RuleNode): boolean {
  if (!isAcceptedEventBattleOpponentCountEqualsCondition(conditionNode)) {
    reject('unsupported', 'Unsupported FB2-54 battle opponent-count condition shape');
  }
  const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  if (classifyAcceptedEventPowerUncontestedWinRewardAbility(ability, 'compiled') !== 'uncontested_win_reward') {
    reject('unsupported', 'FB2-54 battle opponent-count condition requires the exact uncontested-win parent');
  }
  if (!fb254TrustedControllerWinEventMatches(s, ctx) || !Array.isArray(ctx.event?.battleParticipantIds)) return false;
  return ctx.event.battleParticipantIds.filter((playerId) => playerId !== ctx.controllerId).length === 0;
}

function roundVpGainCrossingCondition(s: GameState, ctx: EffectContext, c: RuleNode): boolean {
  if (!isOpponentRoundVpGainThresholdCondition(c)) reject('unsupported', 'Unsupported round VP-gain crossing condition shape');
  const event = ctx.event;
  return !!event && event.type === OPPONENT_ROUND_VP_GAIN_TRIGGER &&
    runtime(s).trustedVictoryPointChanges?.[event.id]?.crossed === true;
}

export function isSourceStateCondition(c: RuleNode): boolean {
  return ['source_active', 'source_owned', 'source_owned_live', 'source_revealed'].includes(str(c.type)) &&
    Object.keys(c).every((key) => key === 'type');
}

function sourceStateCondition(s: GameState, ctx: EffectContext, c: RuleNode): boolean {
  if (!isSourceStateCondition(c)) reject('unsupported', 'Unsupported source-state condition shape');
  const source = s.cards.find((candidate) => candidate.instanceId === ctx.sourceCardId);
  if (!source) return false;
  if (c.type === 'source_active') return active(s, source.instanceId);
  if (c.type === 'source_revealed') {
    const sourceState = runtime(s).cardState[source.instanceId];
    return source.ownerPlayerId === ctx.controllerId && source.controllerPlayerId === ctx.controllerId &&
      ['skill', 'attack_area'].includes(source.zone) && source.visibility.scope === 'public' && sourceState?.faceDown !== true;
  }
  if (c.type === 'source_owned_live') {
    return source.ownerPlayerId === ctx.controllerId && source.controllerPlayerId === ctx.controllerId &&
      ['skill', 'hand', 'attack_area'].includes(source.zone);
  }
  const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  return isAcceptedB02RoundEndVpLossAbility(ability)
    ? b02SourceOwned(s, source.instanceId, ctx.controllerId)
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

function structuredPlayerFlags(s: GameState, playerId: PlayerId): Record<string, boolean | string | number> {
  const r = runtime(s);
  const all = r.structuredPlayerFlagsByPlayer ??= {};
  const flags = all[playerId] ??= {};
  const roundKeys = (r.structuredRoundFlagKeysByPlayer ??= {})[playerId] ??= {};
  for (const [key, round] of Object.entries(roundKeys)) {
    if (round === s.round.roundNumber) continue;
    delete roundKeys[key];
    delete flags[key];
  }
  return flags;
}

function structuredFlagValue(s: GameState, playerId: PlayerId, key: string): boolean | string | number | undefined {
  return structuredPlayerFlags(s, playerId)[key];
}

function setStructuredFlag(s: GameState, playerId: PlayerId, key: string, value: boolean | string | number, thisRound: boolean): void {
  if (!key) reject('invalid_state', 'Structured player flag key must be nonempty');
  structuredPlayerFlags(s, playerId)[key] = value;
  const roundKeys = (runtime(s).structuredRoundFlagKeysByPlayer ??= {})[playerId] ??= {};
  if (thisRound) roundKeys[key] = s.round.roundNumber;
  else delete roundKeys[key];
}

function markCommandSealSpendRound(s: GameState, playerId: PlayerId, directive: string, before: number, after: number): void {
  if (directive !== 'spend_command_spell' || !Number.isSafeInteger(before) || !Number.isSafeInteger(after) || after >= before) return;
  setStructuredFlag(s, playerId, 'commandSealUsedRound', s.round.roundNumber, true);
}

function structuredEventDefinitionId(s: GameState, event: AbilityEvent | undefined): string | undefined {
  if (!event?.sourceCardId) return undefined;
  const instance = s.cards.find((candidate) => candidate.instanceId === event.sourceCardId);
  return instance?.definitionId;
}

function structuredEventFace(s: GameState, event: AbilityEvent | undefined): 'face_up' | 'face_down' | undefined {
  if (!event?.sourceCardId) return undefined;
  const played = event.playedCards?.find((entry) => entry.instanceId === event.sourceCardId);
  if (played) return played.faceDown ? 'face_down' : 'face_up';
  const state = runtime(s).cardState[event.sourceCardId];
  return state ? (state.faceDown ? 'face_down' : 'face_up') : undefined;
}

function trustedStructuredBattleResultTargets(s: GameState, ctx: EffectContext): { winners: PlayerId[]; losers: PlayerId[]; participants: PlayerId[] } | undefined {
  const event = ctx.event;
  if (!event || typeof event.resultId !== 'string' || typeof event.battleId !== 'string' ||
      typeof event.battlePhaseResolutionId !== 'string' || typeof event.battlefieldId !== 'string' ||
      !Array.isArray(event.battleParticipantIds) || !Array.isArray(event.battleResult?.winners) || !Array.isArray(event.battleResult?.loserIds)) return undefined;
  const trusted = runtime(s).trustedBattleResultSnapshots?.[event.resultId];
  if (!trusted || trusted.resultId !== event.resultId || trusted.battleId !== event.battleId ||
      trusted.battlePhaseResolutionId !== event.battlePhaseResolutionId || trusted.battlefieldId !== event.battlefieldId ||
      !exactStringArray(event.battleParticipantIds, trusted.battleParticipantIds) ||
      !exactStringArray(event.battleResult.winners, trusted.winners) || !exactStringArray(event.battleResult.loserIds, trusted.loserIds)) return undefined;
  const known = new Set(s.players.map((entry) => entry.id));
  if (new Set(trusted.battleParticipantIds).size !== trusted.battleParticipantIds.length ||
      trusted.battleParticipantIds.some((id) => !known.has(id)) ||
      trusted.winners.some((id) => !trusted.battleParticipantIds.includes(id)) ||
      trusted.loserIds.some((id) => !trusted.battleParticipantIds.includes(id))) return undefined;
  const expectedId = event.type === 'after_battle_result_determined' ? event.resultId :
    event.type === 'after_controller_wins_battle' && event.playerId ? `${event.resultId}:win:${event.playerId}` :
    event.type === 'after_controller_gains_victory' && event.playerId ? `${event.resultId}:victory:${event.playerId}` :
    event.type === 'after_controller_loses_battle' && event.playerId ? `${event.resultId}:lose:${event.playerId}` :
    undefined;
  if (!expectedId || event.id !== expectedId) return undefined;
  const winners = trusted.winners.filter((id): id is PlayerId => known.has(id));
  const losers = trusted.loserIds.filter((id): id is PlayerId => known.has(id) && !winners.includes(id));
  if (event.type === 'after_controller_wins_battle' && (!event.playerId || !winners.includes(event.playerId))) return undefined;
  if (event.type === 'after_controller_loses_battle' && (!event.playerId || !losers.includes(event.playerId))) return undefined;
  return { winners, losers, participants: trusted.battleParticipantIds.filter((id): id is PlayerId => known.has(id)) };
}

function structuredTargetPlayerIds(s: GameState, ctx: EffectContext, target: unknown): PlayerId[] {
  if (target === undefined || target === null || target === '' || target === 'controller' || target === 'self') return [ctx.controllerId];
  if (target === 'decision_player') {
    const selected = ctx.selections.decisionPlayerId ?? [];
    if (selected.length !== 1) return [];
    const candidate = s.players.find((entry) => entry.id === selected[0]);
    return candidate && candidate.status === 'active' ? [candidate.id] : [];
  }
  if (target === 'selected_player') {
    const selected = ctx.selections.targetPlayerId ?? [];
    if (selected.length !== 1) return [];
    const candidate = s.players.find((entry) => entry.id === selected[0]);
    return candidate && candidate.status === 'active' && candidate.id !== ctx.controllerId ? [candidate.id] : [];
  }
  if (target === 'event_player') return ctx.event?.playerId && s.players.some((entry) => entry.id === ctx.event!.playerId) ? [ctx.event.playerId] : [];
  if (target === 'opponents') return s.players.filter((entry) => entry.id !== ctx.controllerId && entry.status === 'active').map((entry) => entry.id);
  if (target === 'all_players') return s.players.filter((entry) => entry.status === 'active').map((entry) => entry.id);
  if (typeof target === 'string') {
    const selected = ctx.selections[target] ?? [];
    if (selected.length) return selected.filter((id): id is PlayerId => s.players.some((entry) => entry.id === id));
    return s.players.some((entry) => entry.id === target) ? [target] : [];
  }
  if (target && typeof target === 'object') {
    const scope = str((target as RuleNode).scope || (target as RuleNode).type);
    if (scope === 'controller' || scope === 'self') return [ctx.controllerId];
    if (scope === 'event_player') return structuredTargetPlayerIds(s, ctx, 'event_player');
    if (scope === 'opponents') return structuredTargetPlayerIds(s, ctx, 'opponents');
    if (scope === 'all_players') return structuredTargetPlayerIds(s, ctx, 'all_players');
    if (scope === 'same_location_players') {
      if (Object.keys(target as RuleNode).some((key) => key !== 'scope')) reject('unsupported', 'Same-location player target shape is invalid');
      const here = player(s, ctx.controllerId).locationId;
      return s.players.filter((entry) => entry.status === 'active' && entry.locationId === here).map((entry) => entry.id);
    }
    if (scope === 'event_combat_opponents') {
      if (Object.keys(target as RuleNode).some((key) => key !== 'scope')) reject('unsupported', 'Event-combat-opponent target shape is invalid');
      const trusted = trustedStructuredBattleResultTargets(s, ctx);
      if (!trusted || !trusted.participants.includes(ctx.controllerId)) return [];
      return trusted.participants.filter((id) => id !== ctx.controllerId && player(s, id).status === 'active');
    }
    if (scope === 'players_with_status') {
      const status = str((target as RuleNode).status);
      if (!status || Object.keys(target as RuleNode).some((key) => !['scope','status'].includes(key))) reject('unsupported', 'Status-scoped player target shape is invalid');
      return s.players.filter((entry) => entry.status === 'active' && playerHasStatus(s, entry.id, status)).map((entry) => entry.id);
    }
    if (scope === 'selected_card_owners') {
      const payloadKey = str((target as RuleNode).payloadKey);
      if (!payloadKey || Object.keys(target as RuleNode).some((key) => !['scope','payloadKey'].includes(key))) reject('unsupported', 'Selected-card-owner target shape is invalid');
      const selected = ctx.selections[payloadKey] ?? [];
      const owners = selected.map((instanceId) => s.cards.find((entry) => entry.instanceId === instanceId)?.ownerPlayerId)
        .filter((id): id is PlayerId => typeof id === 'string' && s.players.some((entry) => entry.id === id && entry.status === 'active'));
      return [...new Set(owners)];
    }
    if (scope === 'selected_same_battlefield_player') {
      const selected = Object.values(ctx.selections).flat().filter((id) => s.players.some((entry) => entry.id === id));
      const here = player(s, ctx.controllerId).locationId;
      return [...new Set(selected.filter((id) => player(s, id).status === 'active' && player(s, id).locationId === here))];
    }
    if (scope === 'source_card_creator') {
      const linkedSkillId = str((target as RuleNode).linkedSkillId);
      if (!linkedSkillId || Object.keys(target as RuleNode).some((key) => !['scope','linkedSkillId'].includes(key))) reject('unsupported', 'Source-card creator target shape is invalid');
      const sourceInstance = s.cards.find((entry) =>
        entry.ownerPlayerId === ctx.controllerId && entry.controllerPlayerId === ctx.controllerId &&
        ['attack_area','skill','hand'].includes(entry.zone) && entry.definitionId === linkedSkillId);
      const creatorId = sourceInstance?.createdByPlayerId;
      const creator = creatorId ? s.players.find((entry) => entry.id === creatorId) : undefined;
      if (!creatorId || creatorId === ctx.controllerId || !creator || creator.status !== 'active') reject('invalid_state', 'Source-card creator provenance is missing or invalid');
      return [creatorId];
    }
    if (scope === 'event_defeated_players') {
      const trusted = trustedStructuredBattleResultTargets(s, ctx);
      return trusted ? trusted.losers : [];
    }
    if (scope === 'event_combat_winners' || scope === 'event_combat_losers') {
      const trusted = trustedStructuredBattleResultTargets(s, ctx);
      return trusted ? (scope === 'event_combat_winners' ? trusted.winners : trusted.losers) : [];
    }
    const ref = str((target as RuleNode).targetRef || (target as RuleNode).selectionRef);
    if (ref) return structuredTargetPlayerIds(s, ctx, ref);
  }
  return [];
}

function condition(s: GameState, ctx: EffectContext, c: RuleNode): boolean {
  if (!c || typeof c !== 'object') reject('unsupported', 'Unsupported condition');
  if (c.negated === true) return !condition(s, ctx, { ...c, negated: undefined });
  const p = player(s, ctx.controllerId);
  switch (c.type) {
    case 'phase_is': return typeof c.phase === 'string' && phase(s) === c.phase;
    case 'has_status':
    case 'lacks_status': {
      const status = str(c.status);
      if (!status || Object.keys(c).some((key) => !['type', 'status', 'target'].includes(key))) reject('unsupported', 'Player-status condition is invalid');
      const targets = structuredTargetPlayerIds(s, ctx, c.target ?? 'controller');
      if (targets.length !== 1) reject('unsupported', 'Player-status condition requires exactly one target');
      const has = playerHasStatus(s, targets[0]!, status);
      return c.type === 'has_status' ? has : !has;
    }
    case 'target_command_seals_at_most':
    case 'target_command_seals_equals': {
      const targets = structuredTargetPlayerIds(s, ctx, c.target ?? 'controller');
      const value = Number(c.value);
      if (targets.length !== 1 || !Number.isSafeInteger(value) || value < 0 || Object.keys(c).some((key) => !['type', 'target', 'value'].includes(key))) reject('unsupported', 'Pre-loss command-seal condition shape is invalid');
      const record = ctx.commandSealLosses?.[targets[0]!];
      if (!record || !Number.isSafeInteger(record.before) || record.before < 0 || !Number.isSafeInteger(record.lost) || record.lost < 0 || record.lost > record.before) reject('invalid_state', 'Pre-loss command-seal provenance is missing or invalid');
      return c.type === 'target_command_seals_at_most' ? record.before <= value : record.before === value;
    }
    case 'command_seals_at_least': {
      const targets = structuredTargetPlayerIds(s, ctx, c.target ?? 'controller');
      const value = numeric(s, ctx, c.value ?? 1);
      if (targets.length < 1 || !Number.isSafeInteger(value) || value < 0 || Object.keys(c).some((key) => !['type', 'target', 'value'].includes(key))) reject('unsupported', 'Command-seal threshold condition is invalid');
      return targets.every((id) => commandSealCount(s, id) >= value);
    }
    case 'scheduled_payload_present': {
      if (Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Scheduled-payload condition is invalid');
      return ctx.scheduledPayload === true;
    }
    case 'mana_at_least': {
      const amount = Number(c.amount);
      if (Object.keys(c).some((key) => !['type', 'amount'].includes(key)) || !Number.isSafeInteger(amount) || amount < 0) reject('unsupported', 'Mana threshold condition is invalid');
      return p.mana >= amount;
    }
    case 'location_is': {
      const expected = normalizeStructuredLocationId(c.locationId);
      if (Object.keys(c).some((key) => !['type', 'locationId'].includes(key)) || !expected) reject('unsupported', 'Location condition is invalid');
      return normalizeStructuredLocationId(p.locationId) === expected;
    }
    case 'current_situation_id_is': {
      const situationId = str(c.situationId);
      if (Object.keys(c).some((key) => !['type', 'situationId'].includes(key)) || !situationId) reject('unsupported', 'Current-situation condition is invalid');
      return modeState(s).currentSituationId === situationId;
    }
    case 'same_location_player_count_equals': {
      const value = Number(c.value);
      if (Object.keys(c).some((key) => !['type', 'value'].includes(key)) || !Number.isSafeInteger(value) || value < 0) reject('unsupported', 'Same-location player-count condition is invalid');
      if (!p.locationId) return value === 0;
      return s.players.filter((entry) => entry.status === 'active' && entry.locationId === p.locationId).length === value;
    }
    case 'round_victory_points_gained_equals': {
      const value = Number(c.value);
      if (Object.keys(c).some((key) => !['type', 'value'].includes(key)) || !Number.isSafeInteger(value) || value < 0) reject('unsupported', 'Round VP-gain condition is invalid');
      const ledger = runtime(s).roundPositiveVictoryPointGain;
      const gained = ledger?.round === s.round.roundNumber ? (ledger.byPlayer[p.id] ?? 0) : 0;
      return Number.isSafeInteger(gained) && gained >= 0 && gained === value;
    }
    case 'face_up_cards_played_this_round_at_least': {
      const count = Number(c.count);
      if (Object.keys(c).some((key) => !['type', 'count'].includes(key)) || !Number.isSafeInteger(count) || count < 0) reject('unsupported', 'Face-up play-count condition is invalid');
      return faceUpCardsPlayedThisRound(s, p.id) >= count;
    }
    case 'owned_active_card_by_definition': { const id=str(c.definitionId); if(!id) reject('unsupported','Owned-active definition condition requires definitionId'); return s.cards.some((entry)=>entry.definitionId===id&&entry.ownerPlayerId===ctx.controllerId&&entry.controllerPlayerId===ctx.controllerId&&active(s,entry.instanceId)); }
    case 'deployed_this_round_at_controller_location': return deployedThisRoundAtControllerLocation(s,ctx,ctx.controllerId);
    case 'selected_cards_all_have_attribute': {
      const key = str(c.payloadKey) || 'selectedInstanceIds'; const attribute = str(c.attribute);
      if (!attribute) reject('unsupported', 'Selected-card attribute condition requires a nonempty attribute');
      const selected = ctx.selections[key] ?? [];
      return selected.length > 0 && selected.every((instanceId) => getEffectiveCardAttributes(s, instanceId).includes(attribute));
    }
    case 'card_count_at_least': {
      const targetIds = structuredTargetPlayerIds(s, ctx, c.target);
      const zone = normalizeStructuredZone(c.zone);
      const minimum = Number(c.value ?? c.count);
      if (targetIds.length !== 1 || !zone || !Number.isSafeInteger(minimum) || minimum < 0) reject('unsupported', 'Structured card-count condition is invalid');
      const definitionIds = new Set<string>([
        ...(str(c.definitionId) ? [str(c.definitionId)] : []),
        ...(Array.isArray(c.definitionIds) ? c.definitionIds.map(str).filter(Boolean) : []),
      ]);
      const face = str(c.face);
      if (face && !['up', 'down'].includes(face)) reject('unsupported', 'Structured card-count face filter is invalid');
      const count = s.cards.filter((entry) => {
        if (entry.ownerPlayerId !== targetIds[0] || entry.zone !== zone) return false;
        if (definitionIds.size && !definitionIds.has(entry.definitionId)) return false;
        if (c.basicOnly === true && definition(s, entry.instanceId)?.cardType !== 'basic_attack') return false;
        if (c.activeOnly === true && !active(s, entry.instanceId)) return false;
        if (face === 'up' && runtime(s).cardState[entry.instanceId]?.faceDown === true) return false;
        if (face === 'down' && runtime(s).cardState[entry.instanceId]?.faceDown !== true) return false;
        return true;
      }).length;
      return count >= minimum;
    }
    case 'event_count_at_least': {
      const minimum = Number(c.value ?? c.count);
      if (!Number.isSafeInteger(minimum) || minimum < 0) reject('unsupported', 'Structured event-count threshold is invalid');
      const sourceZone = str(c.sourceZone);
      const zones: EventRuleZone[] = sourceZone === 'current' ? ['event_battlefield'] :
        sourceZone === 'deck' ? ['event_deck'] : sourceZone === 'discard' ? ['event_discard'] : sourceZone === 'outside_game' ? ['event_outside_game'] : [];
      if (!zones.length) reject('unsupported', 'Structured event-count source zone is unsupported');
      const locationId = c.locationId === 'controller_location' ? player(s, ctx.controllerId).locationId : normalizeStructuredLocationId(c.locationId);
      const visibility = str(c.visibility);
      if (visibility && !['up', 'down'].includes(visibility)) reject('unsupported', 'Structured event-count visibility is unsupported');
      return listEventRuleCandidates(s, runtime(s).pack, zones)
        .filter((entry) => !locationId || entry.locationId === locationId)
        .filter((entry) => !visibility || entry.visibility === (visibility === 'up' ? 'public' : 'hidden_until_trigger')).length >= minimum;
    }
    case 'player_flag_equals': {
      const key = str(c.key); if (!key) reject('unsupported', 'Structured player flag condition requires key');
      return structuredFlagValue(s, ctx.controllerId, key) === c.value;
    }
    case 'player_flag_number_at_least': {
      const key = str(c.key); const expected = Number(c.value);
      if (!key || !Number.isFinite(expected)) reject('unsupported', 'Structured numeric player flag condition is invalid');
      const value = Number(structuredFlagValue(s, ctx.controllerId, key));
      return Number.isFinite(value) && value >= expected;
    }
    case 'player_flag_number_current_round': {
      const key = str(c.key); if (!key) reject('unsupported', 'Structured current-round player flag condition requires key');
      return Number(structuredFlagValue(s, ctx.controllerId, key)) === s.round.roundNumber;
    }
    case 'player_flag_number_equals_event_field':
    case 'player_flag_number_not_event_field': {
      const key = str(c.key); const field = str(c.field);
      if (!key || field !== 'round' || ctx.event?.type !== 'round_end') {
        return reject('unsupported', 'Structured event-field player flag condition requires exact round_end/round provenance');
      }
      const value = Number(structuredFlagValue(s, ctx.controllerId, key));
      const equals = Number.isSafeInteger(value) && value === s.round.roundNumber;
      return c.type === 'player_flag_number_equals_event_field' ? equals : !equals;
    }
    case 'event_definition_is_self': {
      const sourceDefinitionId = s.cards.find((entry) => entry.instanceId === ctx.sourceCardId)?.definitionId;
      return !!sourceDefinitionId && structuredEventDefinitionId(s, ctx.event) === sourceDefinitionId;
    }
    case 'event_face_is': return typeof c.face === 'string' && structuredEventFace(s, ctx.event) === c.face;
    case 'event_eliminated_same_battlefield_player': {
      if (ctx.event?.type !== 'round_end') return false;
      const ledger = runtime(s).structuredRoundEliminations;
      if (!ledger || ledger.round !== s.round.roundNumber) return false;
      const controller = player(s, ctx.controllerId);
      if (!isBattlefield(s, controller.locationId)) return false;
      return ledger.entries.some((entry) => entry.playerId !== controller.id && entry.locationId === controller.locationId &&
        s.players.some((candidate) => candidate.id === entry.playerId && candidate.status === 'eliminated'));
    }
    case 'metric_compare': {
      const left = numeric(s, ctx, c.left); const right = numeric(s, ctx, c.right); const op = str(c.operator || c.op);
      if (op === 'eq') return left === right; if (op === 'ne') return left !== right; if (op === 'lt') return left < right;
      if (op === 'lte') return left <= right; if (op === 'gt') return left > right; if (op === 'gte') return left >= right;
      return reject('unsupported', 'Unsupported structured metric comparison');
    }
    case 'target_count_at_least': {
      const count = Number(c.count); if (!Number.isSafeInteger(count) || count < 0) reject('unsupported', 'Structured target-count condition is invalid');
      return structuredChoiceTargetPlayers(s, ctx, c.target ?? { scope: c.scope }).length >= count;
    }
    case 'target_count_equals': {
      const count = Number(c.count); if (!Number.isSafeInteger(count) || count < 0) reject('unsupported', 'Structured exact target-count condition is invalid');
      return structuredCountTargetPlayerIds(s, ctx, c.target ?? { scope: c.scope }).length === count;
    }
    case 'skill_zone_mana_at_least': {
      const cardDef = definition(s, ctx.sourceCardId);
      if (cardDef && hasPlayRuleException(cardDef, 'skill_zone_mana_at_least')) return true;
      return card(s, ctx.sourceCardId).zone !== 'skill' || p.mana >= Number(c.value);
    }
    case BATCH_EVENT_BATTLEFIELD_EQUALS_CONTROLLER: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedCrowdedBattleCloseAbility(ability)) reject('unsupported', 'Battlefield/controller relation requires exact F4 B01 crowded-battle parent');
      return trustedCrowdedBattleEventMatches(s, ctx.controllerId, ctx.event);
    }
    case BATCH_EVENT_BATTLE_OPPONENT_COUNT_AT_LEAST: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (c.count !== 2 || !isAcceptedCrowdedBattleCloseAbility(ability)) reject('unsupported', 'Battle opponent-count condition requires exact F4 B01 crowded-battle parent');
      return trustedCrowdedBattleEventMatches(s, ctx.controllerId, ctx.event);
    }
    case 'event_location_is_source_event_battlefield': return !!ctx.eventSource &&
      (ctx.event?.locationId ?? ctx.event?.battlefieldId) === ctx.eventSource.locationId;
    case 'combat_occurs_at_source_event_battlefield': return !!ctx.eventSource &&
      (ctx.event?.battlefieldId ?? ctx.event?.locationId) === ctx.eventSource.locationId;
    case 'controller_at_battlefield': return isBattlefield(s, p.locationId);
    case 'engaged_opponent_victory_points_greater_than_controller': return isBattlefield(s, p.locationId) &&
      s.players.some(other => other.status === 'active' && other.id !== p.id && other.locationId === p.locationId && other.vp > p.vp);
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
    case 'controller_at_location_kind': return c.locationKind === '\u4fa6\u5bdf' || c.locationKind === '\u4fa6\u67e5' ? p.locationId === 'recon' : false;
    case 'controller_servant_revealed': return runtime(s).revealedServants.includes(ctx.controllerId);
    case 'source_reversed': return runtime(s).cardState[ctx.sourceCardId]?.reversed === true;
    case 'can_adjust_mana': return !runtime(s).manaGainBlocked.includes(p.id) && p.mana < (runtime(s).manaCaps[p.id] ?? 12);
    case 'controller_strict_second_battle_power': return controllerIsStrictSecondBattlePower(ctx.event, p.id);
    case 'controller_won_battle': return ctx.event?.battleResult?.winners.includes(p.id) ?? false;
    case 'controller_loses_battle': return !(ctx.event?.battleResult?.winners.includes(p.id) ?? true);
    case 'controller_sole_winner': return ctx.event?.battleResult?.winners.length === 1 && ctx.event.battleResult.winners[0] === p.id;
    case 'event_player_is_controller':
    case 'event_player_is_opponent': return eventPlayerRelationCondition(s, ctx, c);
    case 'event_player_same_location_as_controller': {
      if (Object.keys(c).some((key) => key !== 'type') || ctx.event?.type !== 'm50_player_mana_spent' || !ctx.event.playerId || !ctx.event.locationId) return false;
      const controller = player(s, ctx.controllerId);
      return !!controller.locationId && ctx.event.locationId === controller.locationId;
    }
    case 'event_mana_spent_at_least': {
      const amount = Number(c.amount);
      return Object.keys(c).every((key) => ['type', 'amount'].includes(key)) && Number.isSafeInteger(amount) && amount > 0 &&
        ctx.event?.type === 'm50_player_mana_spent' && ctx.event.resource === 'mana' && Number.isSafeInteger(ctx.event.amount) && Number(ctx.event.amount) >= amount;
    }
    case 'event_location_is': {
      const expected = normalizeStructuredLocationId(c.locationId);
      return !!expected && normalizeStructuredLocationId(ctx.event?.locationId ?? ctx.event?.battlefieldId) === expected;
    }
    case 'situation_forbids_attribute': {
      const attribute = str(c.attribute); if (!attribute) reject('unsupported', 'Situation forbid condition requires attribute');
      const forbids = Array.isArray(modeState(s).cardPlayForbids) ? modeState(s).cardPlayForbids as Array<Record<string, unknown>> : [];
      return forbids.some((entry) => entry.sourceType === 'situation' && entry.attribute === attribute);
    }
    case 'event_scouting_rewarded_controller': {
      const event = ctx.event as (AbilityEvent & { scoutingPlayerId?: string; victoryPoints?: Record<string, number> }) | undefined;
      const gain = event?.victoryPoints?.[ctx.controllerId];
      return event?.scoutingPlayerId === ctx.controllerId && Number.isFinite(gain) && Number(gain) > 0;
    }
    case 'location_in': {
      const locations = Array.isArray(c.locationIds) ? c.locationIds.map(normalizeStructuredLocationId) : [];
      return !!p.locationId && locations.includes(normalizeStructuredLocationId(p.locationId));
    }
    case 'victory_points_is_first': {
      if (Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Victory-point first-place condition shape is invalid');
      const active = s.players.filter((candidate) => candidate.status === 'active');
      if (!active.length) reject('invalid_state', 'Victory-point rank requires at least one active player');
      return p.vp === Math.max(...active.map((candidate) => candidate.vp));
    }
    case 'event_round_victory_points_gain_crosses': return roundVpGainCrossingCondition(s, ctx, c);
    case 'source_active':
    case 'source_owned':
    case 'source_owned_live':
    case 'source_revealed': return sourceStateCondition(s, ctx, c);    case B05_CONTROLLER_MANA_BELOW_TWO_CONDITION: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedB05LowManaCloseAbility(ability) || Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Unsupported F4 B05 low-mana condition shape');
      return p.mana < 2;
    }
    case B05_EVENT_LOCATION_IS_WORKSHOP_CONDITION: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedB05WorkshopDeploymentExchangeAbility(ability) || Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Unsupported F4 B05 workshop-deployment condition shape');
      return !!b05WorkshopDeploymentTarget(s, ctx.controllerId, ability, ctx.event);
    }
    case B05_OTHER_NON_WORKSHOP_BATTLEFIELD_ENTRY_CONDITION: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedB05OtherBattlefieldVpTransferAbility(ability) || Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Unsupported F4 B05 other-battlefield entry condition shape');
      try { return !!b05OtherBattlefieldEntryTarget(s, ctx.controllerId, ability, ctx.event); }
      catch (error) { return reject('invalid_state', error instanceof Error ? error.message : 'F4 B05 entry provenance invalid'); }
    }
    case B05_SOURCE_TRIGGERED_THIS_ROUND_CONDITION: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedB05RoundEndCloseAbility(ability) || Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Unsupported F4 B05 round-close condition shape');
      try { return b05SourceTriggeredThisRound(s, ctx.controllerId, ctx.sourceCardId, ability); }
      catch (error) { return reject('invalid_state', error instanceof Error ? error.message : 'F4 B05 round-close arm invalid'); }
    }
    case B06_SOURCE_PLAYED_FACE_UP_CONDITION: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if ((!isAcceptedB06RoundArmAbility(ability) && !isAcceptedB06EventBurstAbility(ability)) || Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Unsupported F4 B06 source-play condition shape');
      return b06SourcePlayedFaceUp(s, ctx.controllerId, ctx.sourceCardId, ability, ctx.event);
    }
    case B06_SOURCE_ARMED_THIS_ROUND_CONDITION: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedB06BattlePunishAbility(ability) || Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Unsupported F4 B06 armed-round condition shape');
      try { return b06SourceArmedThisRound(s, ctx.controllerId, ctx.sourceCardId, ability); }
      catch (error) { return reject('invalid_state', error instanceof Error ? error.message : 'F4 B06 round arm invalid'); }
    }
    case B04_FIRST_MOVEMENT_CONDITION: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedB04FirstMovementSourcePowerAbility(ability) || Object.keys(c).some((key) => key !== 'type')) reject('unsupported', 'Unsupported F4 B04 first-movement condition shape');
      return b04FirstMovementCondition(s, ctx.controllerId, ctx.sourceCardId, ability, ctx.event);
    }
    case 'event_player_won_combat':
    case 'event_player_lost_combat': return eventCombatOutcomeCondition(s, ctx, c);
    case B03_EVENT_COMBAT_HAS_ATTRIBUTE: {
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (!isAcceptedB03CombatAttributeCloseAbility(ability) || c.attribute !== '魔术' || Object.keys(c).some((key) => !['type', 'attribute'].includes(key))) {
        return reject('unsupported', 'Unsupported F4 B03 combat-attribute condition shape');
      }
      return b03TrustedCombatHasAttribute(s, ctx.event, '魔术');
    }
    case 'event_location_equals_controller': {
      if (!isAcceptedEventLocationEqualsControllerCondition(c)) {
        return reject('unsupported', 'Unsupported event-location relation condition shape');
      }
      const ability = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
      if (isAcceptedB03CombatAttributeCloseAbility(ability)) return b03TrustedBattlefieldEqualsController(s, ctx.controllerId, ctx.event);
      if (isAcceptedB04OpponentEntryManaDrainAbility(ability)) return b04EntryLocationEqualsController(s, ctx.controllerId, ability, ctx.event);
      return isAcceptedEventPowerUncontestedWinRewardAbility(ability, 'compiled')
        ? fb254LocationCondition(s, ctx, ability)
        : eventLocationEqualsController(s, ctx.controllerId, ctx.event);
    }
    case EVENT_BATTLE_OPPONENT_COUNT_EQUALS_CONDITION:
      return fb254BattleOpponentCountCondition(s, ctx, c);
    case 'player_flag_number_not_current_round': {
      if (isAcceptedCurrentRoundCombatLossAbsenceCondition(c)) return currentRoundCombatLossAbsent(s, ctx.controllerId, ctx.event);
      if (isAcceptedCurrentRoundCombatWinAbsenceCondition(c)) return currentRoundCombatWinAbsent(s, ctx.controllerId, ctx.event);
      if (c.key === 'combatWinRound' || c.key === 'combatLossRound') return reject('unsupported', c.key === 'combatWinRound'
        ? 'Unsupported current-round combat-win absence condition shape'
        : 'Unsupported current-round combat-loss absence condition shape');
      const key = str(c.key); if (!key) reject('unsupported', 'Structured not-current-round player flag condition requires key');
      return Number(structuredFlagValue(s, ctx.controllerId, key)) !== s.round.roundNumber;
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
const M50_EFFECT_INSTALLED_SKILL_USE_FORBID_POLICY = 'm50-effect-installed-skill-use-forbid-v1';
function effectInstalledSelectedSkillUseForbidApplies(s: GameState, ongoing: OngoingEffect, targetPlayerId: string, targetSourceId: string): boolean {
  if (ongoing.policyKey !== M50_EFFECT_INSTALLED_SKILL_USE_FORBID_POLICY) return false;
  if (ongoing.duration !== 'this_round' || ongoing.cleanup !== 'expire_after_duration' || ongoing.sourceMustRemainActive !== false ||
      ongoing.expiresAtRound !== ongoing.startRound + 1 || ongoing.ruleModifiers.length !== 1 || ongoing.publicZones.length !== 0) {
    reject('invalid_state', 'Malformed effect-installed skill-use forbid ongoing state');
  }
  const modifier = ongoing.ruleModifiers[0]!;
  const m = modifier.definition; const scope = node(m.scope);
  if (modifier.sourceCardId !== ongoing.sourceCardId || modifier.controllerId !== ongoing.controllerId ||
      m.operation !== 'forbid' || m.rule !== 'skill_use' ||
      Object.keys(m).some((key) => !['id','operation','rule','scope'].includes(key)) ||
      scope.subject !== 'selected_player' || typeof scope.playerId !== 'string' || typeof scope.definitionId !== 'string' ||
      Object.keys(scope).some((key) => !['subject','playerId','definitionId'].includes(key))) {
    reject('invalid_state', 'Malformed effect-installed skill-use forbid modifier state');
  }
  const targetCard = s.cards.find((candidate) => candidate.instanceId === targetSourceId);
  if (!targetCard) return false;
  return targetPlayerId === scope.playerId && targetCard.definitionId === scope.definitionId;
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
  const ongoingRules = liveOngoing(s).flatMap(o => o.ruleModifiers.flatMap(({ controllerId, sourceCardId, definition: m }) => {
    if (o.policyKey === M50_EFFECT_INSTALLED_SKILL_USE_FORBID_POLICY) {
      return effectInstalledSelectedSkillUseForbidApplies(s, o, playerId, sourceId) ? ['skill_use'] : [];
    }
    const controller = player(s, controllerId); const scope = node(m.scope);
    const appliesToSameBattlefieldOpponent = ['opponents_at_same_battlefield', 'engaged_opponents_same_battlefield'].includes(str(scope.subject)) ||
      ['opponents_at_same_battlefield', 'engaged_opponents_same_battlefield'].includes(str(scope.object));
    if (appliesToSameBattlefieldOpponent && (controllerId === playerId || !sameBattlefield(s, controller.locationId, targetPlayer.locationId))) return [];
    if (m.operation !== 'forbid') return [];
    if (m.rule === 'card_play' && scope.subject === 'controller' && controllerId === playerId) return ['card_play'];
    if (m.rule === 'skill_use' && acceptedSkillUseForbidApplies(s, controllerId, sourceCardId, playerId, sourceId, m)) return ['skill_use'];
    if (m.rule === 'situation_restrictions' || m.rule === 'situation_play_forbid') return [str(m.rule)];
    if (m.rule === 'use_skill_card') return d.cardType === 'servant_skill' ? [str(m.rule)] : [];
    if (m.rule === 'play_card_attribute') {
      const attribute = str(m.attribute ?? scope.attribute);
      return Array.isArray(d.cardFace.attributes) && d.cardFace.attributes.includes(attribute) ? [str(m.rule)] : [];
    }
    return [];
  }));
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
  if (isPlayActionStructuralCandidate(a) && !isPlayActionRouteCandidate(a) &&
      !isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled')) return false;
  if (isPlaySourceCardWithCostResponseStructuralCandidate(a) && !isPlaySourceCardWithCostResponseRouteCandidate(a)) return false;
  if (isAddToAttackStructuralCandidate(a) && !isAddToAttackRouteCandidate(a)) return false;
  if (isFixedControllerAdvanceDrawActionCandidate(a) && !isFixedControllerAdvanceDrawActionSemantic(a)) return false;
  if (isAnyLocationExceptWorkshopMovementCandidate(a) && !isAnyLocationExceptWorkshopMovementSemantic(a)) return false;
  if (isMagicResistancePowerModifierCandidate(a) && !isMagicResistancePowerModifierSemantic(a)) return false;
  if (isPresenceConcealmentAssassinationCandidate(a) && !isPresenceConcealmentAssassinationSemantic(a)) return false;
  if (isPreBattleDefeatCandidate(a) && !isAcceptedPreBattleDefeatAbility(a, 'compiled') && !isAcceptedSelectedSameBattlefieldDefeatAbility(a, 'compiled') && !isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(a, 'compiled') && !isAcceptedStructuredChosenOpponentDefeatAbility(a, 'compiled') && !isAcceptedDeploymentLocationOpponentDefeatAbility(a, 'compiled') && !isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility(a, 'compiled') && !isGenericScheduledRankedSelfDefeatSequence(a) && !isAcceptedCommandSealLossConditionalDefeatAbility(a) && !isAcceptedM50RatioFilteredDefeatAbility(a)) return false;
  if (isBattleLossVpWinnerRewardCandidate(a) && !isAcceptedBattleLossVpWinnerRewardAbility(a, 'compiled')) return false;
  if (isControllerDefeatedVpRewardCandidate(a) && !isAcceptedControllerDefeatedVpRewardAbility(a, 'compiled') && !isAcceptedB04ControllerDefeatManaReleaseAbility(a)) return false;
  if (isCombatOpponentPowerVpRewardCandidate(a) && !isAcceptedCombatOpponentPowerVpRewardAbility(a, 'compiled')) return false;
  if (isAcceptedCombatOpponentPowerVpRewardAbility(a, 'compiled') &&
    !trustedCombatOpponentPowerRewardFacts(s, card(s, sourceId).controllerPlayerId, event)) return false;
  if (isNextRoundSituationBenefitSuppressionCandidate(a) &&
    !isAcceptedNextRoundSituationBenefitSuppressionAbility(a, 'compiled')) return false;
  if (isAlterEgoTransformCandidate(a) && !isAlterEgoTransformSemantic(a)) return false;
  if (isGameStartRuleOverrideCandidate(a) && !isGameStartRuleOverrideSemantic(a)) return false;
  if (isGameStartFixedControllerManaSetCandidate(a) && !isGameStartFixedControllerManaSetSemantic(a)) return false;
  if (isGameStartSkillProvisioningCandidate(a) &&
    (!isGameStartSkillProvisioningSemantic(a) || !gameStartSkillProvisioningPreflight(s, sourceId, a))) return false;
  if (isGameStartPlayerStatusAssignmentCandidate(a) && !isStructuredEachPlayerOptionAbility(a) &&
    (!isGameStartPlayerStatusAssignmentSemantic(a) ||
      !gameStartPlayerStatusAssignments(s, card(s, sourceId).controllerPlayerId, a))) return false;
  if (isOuterGodLifeAbilityCandidate(a) && !isOuterGodLifeAbilitySemantic(a)) return false;
  if (isBasicStrengthOpponentSkillFaceDownCandidate(a) && !isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled')) return false;
  if (isEventPowerUncontestedWinRewardCandidate(a) && !isAcceptedEventPowerUncontestedWinRewardAbility(a, 'compiled')) return false;
  if (isBatchPassiveFamilyCandidate(a) && !isAcceptedBatchPassiveFamilyAbility(a) && !isAcceptedM50GrantedRoundDefeatIgnoreAbility(a) &&
      !isAcceptedEffectInstalledCombatSettlementBundle(a.ruleModifiers)) return false;
  if (isAcceptedOpponentCloseOneNonResidualAbility(a, 'compiled') && !opponentCloseSelectedOneFacts(s, sourceId)) return false;
  if (isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled') &&
      !hasMandatoryTargetAvailability(s, context(s, sourceId, a.id, event), a)) return false;
  if (hasControllerMasterSkillDefinitionReturnCandidate(a) && !isAcceptedOpponentRoundVpGainThresholdAbility(a, 'compiled')) return false;
  if (a.activation.requiresSourceState === 'active' && !active(s, sourceId)) return false;
  if (isAcceptedPreBattleDefeatAbility(a, 'compiled')) {
    const controller = player(s, card(s, sourceId).controllerPlayerId);
    if (controller.status !== 'active' || !isBattlefield(s, controller.locationId)) return false;
  }
  if (runtime(s).cardState[sourceId]?.faceDown && !isAcceptedM50DrawAndPlayFaceDownAttackAbility(a)) return false;
  const sourceDefinitionForForbid = definition(s, sourceId);
  if (sourceDefinitionForForbid && (skillDefinitionForbiddenByOwnedDefinitionCardRule(s, card(s, sourceId).controllerPlayerId, sourceDefinitionForForbid.id) ||
      b02SkillDefinitionForbidden(s, card(s, sourceId).controllerPlayerId, sourceDefinitionForForbid.id))) return false;
  const activationPhase = effectiveActivationPhase(s, sourceId, a);
  if (activationPhase && activationPhase !== phase(s)) return false;
  if (definition(s, sourceId)?.cardType === 'command_spell' &&
    Number((player(s, card(s, sourceId).controllerPlayerId) as unknown as { commandSpells?: number }).commandSpells ?? 3) <= 0) return false;
  if (isBattleLossResourceTriggerSemantic(a) &&
    Number((player(s, card(s, sourceId).controllerPlayerId) as unknown as { commandSpells?: number }).commandSpells ?? 3) <= 0) return false;
  if (!isRulerSealUseSemantic(a) && !isCommandSpellCard(s, sourceId) && a.kind === 'phase_action' && runtime(s).usedAbilities[`${sourceId}:${a.id}`] === s.round.roundNumber) return false;
  if (abilityLimitReached(s, sourceId, a)) return false;
  const physicalAbilitySource = s.cards.find((candidate) => candidate.instanceId === sourceId);
  if (physicalAbilitySource && m50ManaSpendingForbidden(s, physicalAbilitySource.controllerPlayerId) &&
      a.cost.some((cost) => cost.type === 'pay_mana' && typeof cost.amount === 'number' && cost.amount > 0)) return false;
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
  const activationContext = context(s, sourceId, a.id, event);
  if (isAcceptedCombatOpponentPowerVpRewardAbility(a, 'compiled')) return !faceUpEffectPlayLimitReached(s, activationContext, a);
  if (!a.conditions.every(c => condition(s, activationContext, c))) return false;
  if (isAcceptedNextRoundSituationBenefitSuppressionAbility(a, 'compiled') &&
      nextRoundSituationSuppressionQualifyingOpponentIds(s, activationContext.controllerId).length === 0) return false;
  if (isAcceptedM50SourceCardCombatJoinAbility(a)) {
    const source = card(s, sourceId);
    if (source.ownerPlayerId !== activationContext.controllerId || source.controllerPlayerId !== activationContext.controllerId ||
        !['hand', 'skill'].includes(source.zone) || player(s, activationContext.controllerId).mana < 6) return false;
  }
  if (isAcceptedM50FreeSourceCardCombatPlayAbility(a)) {
    const source = card(s, sourceId);
    if (source.ownerPlayerId !== activationContext.controllerId || source.controllerPlayerId !== activationContext.controllerId || source.zone !== 'hand') return false;
    return !playFailure(s, activationContext.controllerId, sourceId, false, true, true, true, false, false, ['hand'], true);
  }
  return !faceUpEffectPlayLimitReached(s, activationContext, a);
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
function effectiveCardManaCost(s: GameState, sourceId: string): number | undefined {
  const d = definition(s, sourceId); if (!d) return undefined;
  const additive = Number(d.cardFace.cost ?? 0) + ownedDefinitionCardRuleAdjustment(s, sourceId).cost + b02OwnedBasicAttackAdjustment(s, sourceId).cost +
    m50AdditiveCardAdjustment(s, sourceId).cost + structuredOngoingCardCostAdjustment(s, sourceId);
  const value = additive * m50LinkedPlayerCardMultipliers(s, sourceId).cost;
  return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function playFailure(s: GameState, p: string, sourceId: string, faceDown = false, ignoreStagedAttackLimit = false, ignoreAttackLimit = false, ignoreTiming = false, allowRequiredAdditionalPlay = false, ignoreManaCost = false, allowedSourceZones: readonly string[] = ['hand', 'skill'], ignoreFaceUpPlayLimit = false): string | undefined {
  const c = card(s, sourceId); const d = definition(s, sourceId); if (!d) return 'unsupported';
  if (d.mode !== 'automatic') return d.mode;
  if (c.controllerPlayerId !== p || !allowedSourceZones.includes(c.zone) || player(s, p).status !== 'active') return 'illegal_action';
  if (runtime(s).structuredDefeatRoundByPlayer?.[p] === s.round.roundNumber) return 'player_defeated';
  if (c.zone === 'skill' && isActivationOnlyDefinition(s, c.definitionId)) return 'activation_only';
  const hasLegacyAppendOnlyMarker = d.abilities.some(a => a.effects.some(effect => effect.type === 'append_only_rule' && effect.rule !== 'ignore_battle_loss_effects'));
  const requiredAdditionalPlay = hasRequiredAdditionalPlayMarker(d);
  if (hasLegacyAppendOnlyMarker && (!allowRequiredAdditionalPlay || !requiredAdditionalPlay)) return 'append_only';
  if (!ignoreTiming && (phase(s) !== d.playTiming.phase || s.round.prioritySeat !== player(s, p).seat)) return 'illegal_timing';
  if (faceDown && (!isAttack(d) || d.cardType === 'servant_skill')) return 'illegal_face_down';
  const forbidRules = ongoingCardPlayForbidRules(s, p, sourceId);
  const ignoresAuthoredCardPlayForbids = m50IgnoresCardEffectPlayRestrictions(s, p);
  if (forbidRules.some(rule => !hasPlayRuleException(d, rule) && !(rule === 'card_play' && ignoresAuthoredCardPlayForbids))) return 'play_forbidden';
  if (m50SourceBattlefieldCardPlayForbidden(s, p, sourceId) && !hasPlayRuleException(d, 'card_play') && !ignoresAuthoredCardPlayForbids) return 'play_forbidden';
  if (!faceDown && !ignoreFaceUpPlayLimit && faceUpCardPlayLimitReached(s, p)) return 'face_up_card_play_limit_reached';
  const limit = perGamePlayLimit(d);
  if (limit && (runtime(s).abilityUsage[`play:${sourceId}:${limit.key}`] ?? 0) >= limit.uses) return 'card_limit_reached';
  if (!ignoreAttackLimit && attackPlayLimitReached(s, p, sourceId, ignoreStagedAttackLimit)) return 'attack_play_limit_reached';
  const requirements = d.playRequirements.concat(nodes(d.cardFace.requirements)).filter(r =>
    str(r.type) && !(str(r.type) === 'skill_zone_mana_at_least' && hasPlayRuleException(d, 'skill_zone_mana_at_least')));
  if (!requirements.every(r => condition(s, context(s, sourceId, ''), r))) return 'play_requirement';
  
  const effectiveManaCost = effectiveCardManaCost(s, sourceId);
  if (effectiveManaCost === undefined) return 'invalid_cost';
  if (!ignoreManaCost && !faceDown && effectiveManaCost > 0 && m50ManaSpendingForbidden(s, p)) return 'mana_spending_forbidden';
  if (!ignoreManaCost && !faceDown && player(s, p).mana < effectiveManaCost) return 'insufficient_mana';
  const unconfirmed = d.abilities.find(a => ['unsupported', 'text_unconfirmed'].includes(a.execution.mode));
  if (unconfirmed) return unconfirmed.execution.mode;
  if (!faceDown) {
    const blocked = d.abilities.find(a => a.execution.mode !== 'automatic'); if (blocked) return blocked.execution.mode;
  }
  return undefined;
}
function responseWindowChoiceStillStructurallyAvailable(s: GameState, window: ResponseWindow, choice: TriggeredAbility): boolean {
  if (choice.controllerId !== window.controllerId) return false;
  const controller = s.players.find((entry) => entry.id === choice.controllerId);
  if (!controller || controller.status !== 'active') return false;
  const source = s.cards.find((entry) => entry.instanceId === choice.cardInstanceId);
  if (!source || source.controllerPlayerId !== choice.controllerId || source.zone === 'removed_from_game') return false;
  const ability = runtime(s).pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === choice.abilityId);
  if (!ability || ability.execution.mode !== 'automatic') return false;
  const interaction = classifyAbilityInteraction(ability);
  return interaction.kind === 'response_window';
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
    ...window.choices.filter(c => responseWindowChoiceStillStructurallyAvailable(s, window, c))
      .map(c => ({ type: 'resolve_response' as const, windowId: window.id, cardInstanceId: c.cardInstanceId, abilityId: c.abilityId })),
    { type: 'decline_this_window', windowId: window.id },
  ] : [];
  if (r.hostRequests.length) return [];
  const result: LegalAction[] = [];
  const staged = stagedAttacks(s)[playerId] ?? [];
  if (staged.length && s.round.prioritySeat === p.seat) {
    result.push({ type: 'confirm_staged_attack' }, { type: 'cancel_staged_attack' });
    for (const c of s.cards.filter(c => c.controllerPlayerId === playerId && !staged.some(entry => entry.cardInstanceId === c.instanceId))) {
      if (canStageAttackChoice(s, playerId, { type: 'play_card', cardInstanceId: c.instanceId }, staged)) {
        result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId });
      }
      if (canStageAttackChoice(s, playerId, { type: 'play_card', cardInstanceId: c.instanceId, faceDown: true }, staged)) {
        result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId, faceDown: true });
      }
    }
    return result;
  }
  for (const c of s.cards.filter(c => c.controllerPlayerId === playerId)) {
    const alreadyStaged = staged.some((entry) => entry.cardInstanceId === c.instanceId);
    if (!alreadyStaged && !playFailure(s, playerId, c.instanceId)) {
      result.push({ type: 'play_card', cardInstanceId: c.instanceId });
    }
    if (!alreadyStaged && s.round.prioritySeat === p.seat && canStageAttackChoice(s, playerId, { type: 'play_card', cardInstanceId: c.instanceId }, staged)) {
      result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId });
    }
    if (!alreadyStaged && !playFailure(s, playerId, c.instanceId, true)) {
      result.push({ type: 'play_card', cardInstanceId: c.instanceId, faceDown: true });
    }
    if (!alreadyStaged && s.round.prioritySeat === p.seat && canStageAttackChoice(s, playerId, { type: 'play_card', cardInstanceId: c.instanceId, faceDown: true }, staged)) {
      result.push({ type: 'stage_attack_card', cardInstanceId: c.instanceId, faceDown: true });
    }
    for (const a of cardActivationAbilities(s, c.instanceId)) {
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
    ['after_battle_result_determined', 'after_controller_wins_battle', 'after_controller_loses_battle', CONTROLLER_DEFEATED_TRIGGER, 'after_controller_first_loses_battle', 'after_controller_gains_victory'].includes(event.type);
  const phaseTerminalScoped = !!event.battlePhaseResolutionId && event.type === 'after_battle_ended';
  return (perBattleScoped || phaseTerminalScoped) && event.battleParticipantIds?.includes(controllerId) === true;
}

function structuredScheduleTrigger(raw: unknown): 'after_battle_ended' | 'm50_round_started' | undefined {
  if (raw === 'combat.ending') return 'after_battle_ended';
  if (raw === 'round.started') return 'm50_round_started';
  return undefined;
}

function isGenericStructuredScheduleEffect(effect: RuleNode): boolean {
  const trigger = structuredScheduleTrigger(effect.triggerEventType);
  const offset = Number(effect.triggerRoundOffset ?? 0);
  const captureKey = str(effect.captureCardPowerFromPayloadKey);
  const variableKey = str(effect.payloadVariableKey);
  const captureShapeValid = (!captureKey && !variableKey) || (!!captureKey && !!variableKey);
  const payloadKeys = effect.capturePayloadKeys === undefined ? [] : Array.isArray(effect.capturePayloadKeys) ? effect.capturePayloadKeys : [null];
  const payloadShapeValid = payloadKeys.length <= 4 && payloadKeys.every((key) => typeof key === 'string' && key.length > 0) && new Set(payloadKeys).size === payloadKeys.length;
  const hasPayloadLifecycle = effect.capturePayloadKeys !== undefined || effect.expiresAfterRoundOffset !== undefined || effect.once !== undefined;
  const payloadLifecycleValid = !hasPayloadLifecycle || (effect.once === true && Number(effect.expiresAfterRoundOffset) === offset);
  return effect.type === 'schedule_effect' && typeof effect.abilityId === 'string' && effect.abilityId.length > 0 && !!trigger &&
    Number.isSafeInteger(offset) && offset >= 0 && offset <= 1 && captureShapeValid && payloadShapeValid && payloadLifecycleValid &&
    Object.keys(effect).every((key) => ['type', 'abilityId', 'triggerEventType', 'triggerRoundOffset', 'captureCardPowerFromPayloadKey', 'payloadVariableKey', 'capturePayloadKeys', 'expiresAfterRoundOffset', 'once'].includes(key));
}

function containsGenericStructuredScheduleTarget(value: unknown, abilityId: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => containsGenericStructuredScheduleTarget(entry, abilityId));
  if (!value || typeof value !== 'object') return false;
  const current = node(value);
  if (current.type === 'schedule_effect' && current.abilityId === abilityId && isGenericStructuredScheduleEffect(current)) return true;
  return Object.values(current).some((entry) => containsGenericStructuredScheduleTarget(entry, abilityId));
}

function isGenericStructuredScheduleArm(a: AuthoringAbility): boolean {
  const visit = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(visit);
    if (!value || typeof value !== 'object') return false;
    const current = node(value);
    if (isGenericStructuredScheduleEffect(current)) return true;
    return Object.values(current).some(visit);
  };
  return !isAcceptedB03ModifierLifecycleAbility(a) && visit(a.effects);
}

function isGenericScheduledSelfDefeat(a: AuthoringAbility): boolean {
  return a.kind === 'passive' && a.activation.trigger === 'm50_round_started' && a.conditions.length === 0 && a.effects.length === 1 &&
    a.effects[0]?.type === 'defeat_player' && a.effects[0]?.target === 'controller' && Object.keys(a.effects[0]!).every((key) => ['type', 'target'].includes(key));
}
function isGenericScheduledRankedSelfDefeatSequence(a: AuthoringAbility): boolean {
  if (a.kind !== 'passive' || a.activation.trigger !== 'm50_round_started' || a.conditions.length !== 2 || a.effects.length < 2) return false;
  if (a.conditions[0]?.type !== 'source_active' || Object.keys(a.conditions[0]!).some((key) => key !== 'type')) return false;
  if (a.conditions[1]?.type !== 'victory_points_is_first' || Object.keys(a.conditions[1]!).some((key) => key !== 'type')) return false;
  const first = a.effects[0];
  return first?.type === 'defeat_player' && first.target === 'controller' && Object.keys(first).every((key) => ['type', 'target'].includes(key));
}

function isM50ScheduledPayloadStatusTarget(a: AuthoringAbility): boolean {
  return a.kind === 'passive' && a.activation.trigger === 'm50_round_started' &&
    a.conditions.length === 1 && a.conditions[0]?.type === 'scheduled_payload_present' &&
    Object.keys(a.conditions[0]!).every((key) => key === 'type') &&
    a.effects.length > 0 && a.effects.every((effect) => effect.type === 'add_status' && effect.target === 'selected_player' &&
      typeof effect.status === 'string' && effect.status.length > 0 &&
      Object.keys(effect).every((key) => ['type', 'target', 'status'].includes(key)));
}

function isGenericStructuredScheduleTarget(abilities: AuthoringAbility[], abilityId: string): boolean {
  return abilities.some((candidate) => candidate.id !== abilityId && containsGenericStructuredScheduleTarget(candidate.effects, abilityId));
}

function armGenericStructuredSchedule(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  if (!isGenericStructuredScheduleEffect(effect)) reject('resolution_failed', 'Unsupported structured schedule envelope');
  const source = card(s, ctx.sourceCardId);
  if (source.controllerPlayerId !== ctx.controllerId) reject('resolution_failed', 'Structured schedule source controller changed');
  const sourceDefinition = definition(s, ctx.sourceCardId);
  const targetAbilityId = str(effect.abilityId);
  const targetAbility = sourceDefinition?.abilities.find((candidate) => candidate.id === targetAbilityId);
  const triggerEventType = structuredScheduleTrigger(effect.triggerEventType);
  const triggerRound = s.round.roundNumber + Number(effect.triggerRoundOffset ?? 0);
  if (!sourceDefinition || !targetAbility || !triggerEventType || targetAbility.activation.trigger !== triggerEventType ||
      !isGenericStructuredScheduleTarget(sourceDefinition.abilities, targetAbilityId)) {
    reject('resolution_failed', 'Structured schedule target must be a same-card explicitly scheduled ability');
  }
  const captureKey = str(effect.captureCardPowerFromPayloadKey);
  const variableKey = str(effect.payloadVariableKey);
  let variables: Record<string, number> | undefined;
  let selections: Record<string, string[]> | undefined;
  const payloadKeys = Array.isArray(effect.capturePayloadKeys) ? effect.capturePayloadKeys.map(str) : [];
  if (payloadKeys.length) {
    selections = {};
    for (const key of payloadKeys) {
      const selected = ctx.selections[key] ?? [];
      if (!key || !selected.length || new Set(selected).size !== selected.length || selected.some((value) => !value)) reject('invalid_target', 'Structured schedule captured selection is missing or invalid');
      selections[key] = [...selected];
    }
  }
  if (captureKey || variableKey) {
    if (!captureKey || !variableKey) reject('resolution_failed', 'Structured schedule capture requires both payload and variable keys');
    const selected = ctx.selections[captureKey] ?? [];
    if (selected.length !== 1) reject('invalid_target', 'Structured schedule card-power capture requires exactly one selected card');
    const selectedCard = s.cards.find((candidate) => candidate.instanceId === selected[0]);
    if (!selectedCard || selectedCard.zone !== 'attack_area' || !active(s, selectedCard.instanceId) || selectedCard.controllerPlayerId === ctx.controllerId ||
        !sameBattlefield(s, player(s, selectedCard.controllerPlayerId).locationId, player(s, ctx.controllerId).locationId) || !isAttack(definition(s, selectedCard.instanceId))) {
      reject('invalid_target', 'Structured schedule card-power capture target is no longer a legal same-battlefield opponent attack');
    }
    const amount = calculateCardPower(s, selectedCard.instanceId).value;
    if (!Number.isSafeInteger(amount) || amount < 0) reject('invalid_state', 'Structured schedule captured card power must be a nonnegative safe integer');
    variables = { [variableKey]: amount };
  }
  const entry = {
    sourceCardId: ctx.sourceCardId, sourceDefinitionId: source.definitionId, controllerId: ctx.controllerId,
    armAbilityId: ctx.abilityId, targetAbilityId, triggerEventType, armedRound: s.round.roundNumber, triggerRound, once: true as const,
    ...(variables ? { variables } : {}),
    ...(selections ? { selections } : {}),
  };
  const schedules = runtime(s).structuredScheduledEffects ??= [];
  const duplicate = schedules.find((candidate) => candidate.sourceCardId === entry.sourceCardId && candidate.armAbilityId === entry.armAbilityId &&
    candidate.targetAbilityId === entry.targetAbilityId && candidate.triggerEventType === entry.triggerEventType && candidate.triggerRound === entry.triggerRound);
  if (!duplicate) schedules.push(entry);
}

function settleGenericStructuredSchedules(s: GameState, triggerEventType: string, event?: AbilityEvent): void {
  const r = runtime(s); const schedules = r.structuredScheduledEffects ?? [];
  const stale = schedules.some((entry) => entry.triggerRound < s.round.roundNumber);
  if (stale) reject('invalid_state', 'Structured scheduled effect missed its authoritative trigger round');
  const due = schedules.filter((entry) => entry.triggerRound === s.round.roundNumber && entry.triggerEventType === triggerEventType);
  if (!due.length) return;
  const dueKeys = new Set(due.map((entry) => `${entry.sourceCardId}:${entry.armAbilityId}:${entry.targetAbilityId}:${entry.triggerEventType}:${entry.triggerRound}`));
  r.structuredScheduledEffects = schedules.filter((entry) => !dueKeys.has(`${entry.sourceCardId}:${entry.armAbilityId}:${entry.targetAbilityId}:${entry.triggerEventType}:${entry.triggerRound}`));
  for (const entry of due) {
    const source = s.cards.find((candidate) => candidate.instanceId === entry.sourceCardId);
    const sourceDefinition = source ? r.pack.cards[source.definitionId] : undefined;
    const targetAbility = sourceDefinition?.abilities.find((candidate) => candidate.id === entry.targetAbilityId);
    if (!source || source.definitionId !== entry.sourceDefinitionId || source.controllerPlayerId !== entry.controllerId || !sourceDefinition || !targetAbility ||
        targetAbility.activation.trigger !== entry.triggerEventType || !isGenericStructuredScheduleTarget(sourceDefinition.abilities, entry.targetAbilityId)) {
      reject('invalid_state', 'Structured scheduled effect source or target changed before settlement');
    }
    const scheduledEvent = event ?? { id: nextId(s, 'structured-schedule'), type: triggerEventType };
    const scheduledContext = context(s, entry.sourceCardId, entry.targetAbilityId, scheduledEvent);
    scheduledContext.scheduledPayload = true;
    if (entry.selections) {
      for (const [key, selected] of Object.entries(entry.selections)) {
        if (!key || !selected.length || new Set(selected).size !== selected.length || selected.some((value) => !value)) reject('invalid_state', 'Structured scheduled selection payload is malformed');
        scheduledContext.selections[key] = [...selected];
      }
    }
    if (entry.variables) {
      for (const [key, value] of Object.entries(entry.variables)) {
        if (!key || !Number.isSafeInteger(value)) reject('invalid_state', 'Structured scheduled payload is malformed');
        scheduledContext.variables[key] = value;
      }
    }
    executeAbility(s, scheduledContext);
  }
}

export function collectTriggeredAbilities(s: GameState, event: AbilityEvent): TriggeredAbility[] {
  const found: TriggeredAbility[] = [];
  for (const c of s.cards) {
    const sourceAbilities = definition(s, c.instanceId)?.abilities ?? [];
    const b06GlobalBattleObserver = event.type === 'after_battle_result_determined' && sourceAbilities.some(isAcceptedB06BattlePunishAbility);
    if (!b06GlobalBattleObserver && !battleEventControllerEligibleAfterScoring(s, event, c.controllerPlayerId)) continue;
    for (const a of sourceAbilities) {
      if (isGenericStructuredScheduleTarget(sourceAbilities, a.id)) continue;
      const b04DeploymentEntryAlias = event.type === 'after_player_deployed_to_battlefield' && isAcceptedB04OpponentEntryManaDrainAbility(a);
      const b05DeploymentEntryAlias = event.type === 'after_player_deployed_to_battlefield' && isAcceptedB05OtherBattlefieldVpTransferAbility(a);
      const matches = a.activation.trigger === event.type || b04DeploymentEntryAlias || b05DeploymentEntryAlias || (!a.activation.trigger && a.kind === 'phase_action' && a.activation.opens === event.type);
      if (event.type === 'while_active') {
        const transformed = runtime(s).transformedReturnSilenceSourceCardIds?.includes(c.instanceId) === true;
        const isSoulDragState = a.effects.some((effect) => effect.type === 'soul_drag_power_bonus');
        const isReturnSilenceState = a.effects.some((effect) => effect.type === 'return_silence_battle_start');
        if ((transformed && isSoulDragState) || (!transformed && isReturnSilenceState)) continue;
      }
      if (event.type === 'm50_skill_unlocked' && (event.sourceCardId !== c.instanceId || event.playerId !== c.controllerPlayerId)) continue;
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
function closeStructuredSelectedCard(s: GameState, ctx: EffectContext, instanceId: string, effect: RuleNode): void {
  const target = card(s, instanceId);
  const definitionEntry = definition(s, instanceId);
  const state = runtime(s).cardState[instanceId];
  const expectedZone = normalizeStructuredZone(effect.zone || 'attack');
  if (!definitionEntry || !state || target.zone !== expectedZone || state.active !== true || state.faceDown === true) {
    reject('resolution_failed', 'Structured close target is no longer a face-up active card in the declared zone');
  }
  if (effect.basicOnly === true && definitionEntry.cardType !== 'basic_attack') {
    reject('resolution_failed', 'Structured close target is not a basic attack');
  }
  const requiredAttributes = Array.isArray(effect.attributes) ? effect.attributes.map(str).filter(Boolean) : [];
  if (requiredAttributes.length && !requiredAttributes.every((attribute) => getEffectiveCardAttributes(s, instanceId).includes(attribute))) {
    reject('resolution_failed', 'Structured close target no longer matches required attributes');
  }
  if (effect.nonResidualOnly === true && isResidualAttackCardDefinition(definitionEntry)) {
    reject('resolution_failed', 'Structured close target is residual');
  }
  const targetController = s.players.find((entry) => entry.id === target.controllerPlayerId);
  const controller = player(s, ctx.controllerId);
  if (effect.scope === 'same_battlefield' && (!targetController || targetController.locationId !== controller.locationId || !isBattlefield(s, controller.locationId))) {
    reject('resolution_failed', 'Structured close target is no longer at the controller battlefield');
  }
  if (effect.ownerScope === 'same_location_players' && (!targetController || targetController.locationId !== controller.locationId)) {
    reject('resolution_failed', 'Structured close target owner is no longer at the controller location');
  }
  if (effect.ownerScope === 'same_battlefield_opponents' && (!targetController || targetController.id === ctx.controllerId ||
      targetController.locationId !== controller.locationId || !isBattlefield(s, controller.locationId))) {
    reject('resolution_failed', 'Structured close target owner is no longer a same-battlefield opponent');
  }
  if (isCardCloseForbidden(s, instanceId)) reject('resolution_failed', 'Structured close target is protected from closing');
  state.active = false;
  clearTransientCardTransformState(s, instanceId);
  if (['servant_skill', 'master_skill'].includes(definitionEntry.cardType)) {
    target.zone = 'skill';
    target.controllerPlayerId = target.ownerPlayerId;
    target.visibility = { scope: 'owner_only', ownerPlayerId: target.ownerPlayerId };
    state.faceDown = false;
  } else {
    state.faceDown = true;
    target.visibility = { scope: 'owner_only', ownerPlayerId: target.ownerPlayerId };
  }
}

function installStructuredSourceCardPowerBonus(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  const source = card(s, ctx.sourceCardId);
  if (source.controllerPlayerId !== ctx.controllerId) reject('resolution_failed', 'Structured source-card power controller changed');
  const amount = numeric(s, ctx, effect.amount);
  if (!Number.isSafeInteger(amount) || amount < 0) reject('resolution_failed', 'Structured source-card power bonus must be a nonnegative safe integer');
  const duration = str(effect.duration) || 'while_active';
  if (!['while_active', 'this_round', 'game'].includes(duration)) reject('resolution_failed', 'Unsupported structured source-card power duration');
  const maxTotal = effect.maxTotal === undefined ? undefined : Number(effect.maxTotal);
  if (maxTotal !== undefined && (!Number.isSafeInteger(maxTotal) || maxTotal < 0)) reject('resolution_failed', 'Structured source-card power maxTotal is invalid');
  const effectKey = str(effect.id) || 'default';
  const policyKey = `m50-source-card-power:${ctx.sourceCardId}:${ctx.abilityId}:${effectKey}`;
  const r = runtime(s);
  const existing = r.ongoingEffects.find((entry) => entry.policyKey === policyKey);
  if (existing) {
    if (existing.sourceCardId !== ctx.sourceCardId || existing.controllerId !== ctx.controllerId || existing.ruleModifiers.length !== 1 ||
        existing.ruleModifiers[0]!.definition.rule !== 'card.currentPower' || existing.ruleModifiers[0]!.definition.operation !== 'add' ||
        node(existing.ruleModifiers[0]!.definition.scope).object !== 'source_card') {
      reject('invalid_state', 'Malformed structured source-card power state');
    }
    const current = Number(existing.ruleModifiers[0]!.definition.value);
    if (!Number.isSafeInteger(current) || current < 0) reject('invalid_state', 'Malformed structured source-card power value');
    const next = maxTotal === undefined ? current + amount : Math.min(maxTotal, current + amount);
    if (!Number.isSafeInteger(next)) reject('invalid_state', 'Structured source-card power would exceed safe integer range');
    existing.ruleModifiers[0]!.definition.value = next;
    return;
  }
  const initial = maxTotal === undefined ? amount : Math.min(maxTotal, amount);
  const modifierId = `m50-source-card-power:${effectKey}`;
  r.ongoingEffects.push({
    id: nextId(s, 'm50-source-power'), sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, controllerId: ctx.controllerId,
    starts: 'immediate', duration, startRound: s.round.roundNumber,
    ...(duration === 'this_round' ? { expiresAtRound: s.round.roundNumber + 1 } : {}),
    cleanup: duration === 'this_round' ? 'expire_after_duration' : 'remain_active',
    sourceMustRemainActive: duration !== 'game', policyKey,
    ruleModifiers: [{ sourceCardId: ctx.sourceCardId, controllerId: ctx.controllerId,
      definition: { id: modifierId, operation: 'add', rule: 'card.currentPower', scope: { object: 'source_card' }, value: initial } }],
    publicZones: [],
  });
}

function installStructuredCardCostModifier(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  const definitionId = str(effect.definitionId);
  const duration = str(effect.duration);
  const amount = numeric(s, ctx, effect.amount);
  const maxTotal = effect.maxTotal === undefined ? undefined : Number(effect.maxTotal);
  if (!definitionId || duration !== 'game' || !Number.isSafeInteger(amount) || amount < 0 ||
      (maxTotal !== undefined && (!Number.isSafeInteger(maxTotal) || maxTotal < 0))) {
    reject('resolution_failed', 'Structured card-cost modifier requires exact definitionId, game duration, and nonnegative safe-integer amount/maxTotal');
  }
  const source = card(s, ctx.sourceCardId);
  if (source.controllerPlayerId !== ctx.controllerId) reject('resolution_failed', 'Structured card-cost modifier source controller changed');
  const knownDefinition = runtime(s).pack.cards[definitionId] || starterPack.servants.find((entry) => entry.id === definitionId);
  if (!knownDefinition) reject('resolution_failed', 'Structured card-cost modifier references an unknown definition');
  const effectKey = str(effect.id) || 'default';
  const policyKey = `m50-card-cost:${ctx.sourceCardId}:${ctx.abilityId}:${effectKey}`;
  const r = runtime(s);
  const existing = r.ongoingEffects.find((entry) => entry.policyKey === policyKey);
  if (existing) {
    if (existing.sourceCardId !== ctx.sourceCardId || existing.controllerId !== ctx.controllerId || existing.ruleModifiers.length !== 1) {
      reject('invalid_state', 'Malformed structured card-cost state');
    }
    const definition = existing.ruleModifiers[0]!.definition; const scope = node(definition.scope);
    if (definition.rule !== 'card_cost' || definition.operation !== 'add' || scope.controller !== 'self' || scope.definitionId !== definitionId) {
      reject('invalid_state', 'Malformed structured card-cost state');
    }
    const current = Number(definition.value); const storedMax = definition.maxTotal === undefined ? undefined : Number(definition.maxTotal);
    if (!Number.isSafeInteger(current) || current < 0 || storedMax !== maxTotal ||
        (storedMax !== undefined && (!Number.isSafeInteger(storedMax) || storedMax < 0 || current > storedMax))) {
      reject('invalid_state', 'Malformed structured card-cost accumulated value');
    }
    const next = maxTotal === undefined ? current + amount : Math.min(maxTotal, current + amount);
    if (!Number.isSafeInteger(next)) reject('invalid_state', 'Structured card-cost modifier would exceed safe integer range');
    definition.value = next;
    return;
  }
  const initial = maxTotal === undefined ? amount : Math.min(maxTotal, amount);
  r.ongoingEffects.push({
    id: nextId(s, 'm50-card-cost'), sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, controllerId: ctx.controllerId,
    starts: 'immediate', duration: 'game', startRound: s.round.roundNumber, cleanup: 'remain_active', sourceMustRemainActive: false, policyKey,
    ruleModifiers: [{ sourceCardId: ctx.sourceCardId, controllerId: ctx.controllerId, definition: {
      id: `m50-card-cost:${effectKey}`, operation: 'add', rule: 'card_cost', scope: { controller: 'self', definitionId }, value: initial,
      ...(maxTotal === undefined ? {} : { maxTotal }),
    } }], publicZones: [],
  });
}

function structuredOngoingCardCostAdjustment(s: GameState, targetCardInstanceId: string): number {
  const target = card(s, targetCardInstanceId);
  let total = 0;
  for (const ongoing of liveOngoing(s)) {
    if (!ongoing.policyKey?.startsWith('m50-card-cost:')) continue;
    if (ongoing.duration !== 'game' || ongoing.cleanup !== 'remain_active' || ongoing.sourceMustRemainActive !== false ||
        ongoing.expiresAtRound !== undefined || ongoing.ruleModifiers.length !== 1 || ongoing.publicZones.length !== 0) {
      reject('invalid_state', 'Malformed structured card-cost ongoing state');
    }
    const modifier = ongoing.ruleModifiers[0]!; const definition = modifier.definition; const scope = node(definition.scope);
    const definitionKeys = Object.keys(definition).sort();
    const expectedKeys = (definition.maxTotal === undefined ? ['id','operation','rule','scope','value'] : ['id','maxTotal','operation','rule','scope','value']).sort();
    const scopeKeys = Object.keys(scope).sort(); const expectedScopeKeys = ['controller','definitionId'].sort();
    if (modifier.sourceCardId !== ongoing.sourceCardId || modifier.controllerId !== ongoing.controllerId ||
        definitionKeys.length !== expectedKeys.length || definitionKeys.some((key, index) => key !== expectedKeys[index]) ||
        scopeKeys.length !== expectedScopeKeys.length || scopeKeys.some((key, index) => key !== expectedScopeKeys[index]) ||
        definition.operation !== 'add' || definition.rule !== 'card_cost' || scope.controller !== 'self' ||
        typeof scope.definitionId !== 'string' || scope.definitionId.length === 0 ||
        !Number.isSafeInteger(definition.value) || Number(definition.value) < 0 ||
        (definition.maxTotal !== undefined && (!Number.isSafeInteger(definition.maxTotal) || Number(definition.maxTotal) < 0 || Number(definition.value) > Number(definition.maxTotal)))) {
      reject('invalid_state', 'Malformed structured card-cost modifier state');
    }
    if (ongoing.controllerId !== target.controllerPlayerId || scope.definitionId !== target.definitionId) continue;
    total += Number(definition.value);
    if (!Number.isSafeInteger(total)) reject('invalid_state', 'Structured card-cost adjustment exceeds safe integer range');
  }
  return total;
}

function structuredKnownCardBasePower(s: GameState, instanceId: string): number {
  const physical = card(s, instanceId);
  const authored = runtime(s).pack.cards[physical.definitionId];
  const legacy = starterPack.servants.find((entry) => entry.id === physical.definitionId);
  const raw = authored?.cardFace.basePower ?? legacy?.basePower;
  if (typeof raw !== 'number' || !Number.isSafeInteger(raw) || raw < 0) {
    reject('resolution_failed', 'Selected card lacks a nonnegative printed base power');
  }
  return raw;
}

function setOwnedSkillZoneActiveState(s: GameState, ctx: EffectContext, definitionId: string, activeState: boolean): void {
  if (!definitionId) reject('resolution_failed', 'Owned skill activation requires definitionId');
  const matches = s.cards.filter((entry) => entry.definitionId === definitionId && entry.ownerPlayerId === ctx.controllerId);
  if (matches.length !== 1) reject('resolution_failed', 'Owned skill activation requires exactly one controller-owned physical card');
  const target = matches[0]!;
  if (target.controllerPlayerId !== ctx.controllerId || target.zone !== 'skill') {
    reject('resolution_failed', 'Owned skill activation target must remain in the controller skill zone');
  }
  target.visibility = { scope: 'owner_only', ownerPlayerId: target.ownerPlayerId };
  const r = runtime(s);
  const prior = r.cardState[target.instanceId];
  const wasActive = prior?.active === true;
  r.cardState[target.instanceId] = {
    ...(prior ?? { playedRound: s.round.roundNumber }),
    active: activeState,
    faceDown: false,
  };
  if (activeState && !wasActive) {
    processEvent(s, { id: nextId(s, 'skill-unlocked'), type: 'm50_skill_unlocked', playerId: ctx.controllerId, sourceCardId: target.instanceId });
  }
}

function createStructuredCardInstances(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  const definitionId = str(effect.definitionId);
  const count = Number(effect.count ?? 1);
  const zone = normalizeStructuredZone(effect.zone);
  if (!definitionId || !Number.isSafeInteger(count) || count < 0 || count > 50 || !['hand', 'attack_area', 'skill'].includes(zone)) {
    reject('resolution_failed', 'Structured create-card-instances requires a bounded controller hand/attack-area/skill destination');
  }
  const activeState = effect.active === true;
  const faceDown = effect.face === 'down';
  const temporary = effect.temporary === true;
  const lifecycle = node(effect.lifecycle);
  const untilCombatWinSkill = zone === 'skill' && temporary && effect.face === 'up' && !activeState && effect.residual === false &&
    lifecycle.duration === 'until_condition_met' && lifecycle.cleanup === 'remain_active' && Array.isArray(lifecycle.expiresOn) &&
    lifecycle.expiresOn.length === 1 && lifecycle.expiresOn[0] === 'combat.win' &&
    Object.keys(lifecycle).every((key) => ['duration','cleanup','expiresOn'].includes(key));
  if (zone === 'attack_area' && (effect.face !== 'up' || !activeState)) {
    reject('resolution_failed', 'Structured attack-area creation requires exact face-up active shape');
  }
  if (zone === 'skill' && !untilCombatWinSkill) reject('resolution_failed', 'Structured skill-zone creation requires exact temporary-until-combat-win shape');
  if (temporary && !untilCombatWinSkill && lifecycle.duration !== 'this_round') {
    reject('resolution_failed', 'Structured temporary card creation requires exact this-round or until-combat-win lifecycle');
  }
  const known = !!runtime(s).pack.cards[definitionId] || starterPack.servants.some((entry) => entry.id === definitionId);
  if (!known) reject('resolution_failed', 'Structured create-card-instances references an unknown definition');
  for (let index = 0; index < count; index++) {
    const instanceId = nextId(s, 'm50-created');
    s.cards.push({ instanceId, definitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId,
      zone: zone as CardInstance['zone'], visibility: ['hand','skill'].includes(zone) ? { scope: 'owner_only', ownerPlayerId: ctx.controllerId } : { scope: 'public' }, generatedBy: ctx.sourceCardId });
    runtime(s).cardState[instanceId] = { active: zone === 'attack_area' ? activeState : false, faceDown, playedRound: s.round.roundNumber };
    if (temporary && !untilCombatWinSkill) (runtime(s).structuredTemporaryGeneratedCards ??= []).push({ instanceId, createdRound: s.round.roundNumber, sourceCardId: ctx.sourceCardId });
    runtime(s).events.push({ type: 'card_created', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
      cardInstanceId: instanceId, toZone: zone, movedCount: 1 });
  }
}

function transferStructuredSelectedCards(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  if (effect.target !== 'controller' || normalizeStructuredZone(effect.destination) !== 'attack_area' || effect.face !== 'up' || effect.active !== true) {
    reject('resolution_failed', 'Unsupported structured transfer-selected-cards shape');
  }
  const key = str(effect.payloadKey) || 'selectedInstanceIds';
  const selected = ctx.selections[key] ?? [];
  if (!selected.length || new Set(selected).size !== selected.length) reject('invalid_target', 'Structured transfer selection is empty or duplicated');
  for (const instanceId of selected) {
    const target = card(s, instanceId);
    if (target.ownerPlayerId !== ctx.controllerId || target.controllerPlayerId !== ctx.controllerId || target.zone !== 'deck') {
      reject('invalid_target', 'Structured transfer target is no longer a controller-owned deck card');
    }
  }
  for (const instanceId of selected) {
    const target = card(s, instanceId);
    moveCard(s, instanceId, 'attack_area');
    runtime(s).cardState[instanceId] = { active: true, faceDown: false, playedRound: s.round.roundNumber };
    target.visibility = { scope: 'public' };
  }
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
  if (value > 0 && m50ManaSpendingForbidden(s, p.id)) reject('mana_spending_forbidden', 'Mana spending is forbidden this round');
  p.mana -= value;
  if (value > 0) recordAuthoritativeManaSpend(s, p.id, value);
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
function shuffleStructuredEventDeck(s: GameState): void {
  const r = runtime(s); const deck = s.eventDeck ??= [];
  for (let i = deck.length - 1; i > 0; i--) {
    let x = r.randomState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; r.randomState = x >>> 0;
    const j = Math.floor((r.randomState / 0x100000000) * (i + 1)); [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  r.eventRuleZoneRevision++;
}
function expireStructuredTemporaryGeneratedCards(s: GameState, nextRound: number): void {
  const r = runtime(s); const receipts = r.structuredTemporaryGeneratedCards ?? [];
  if (!receipts.length) return;
  const keep: typeof receipts = [];
  for (const receipt of receipts) {
    if (receipt.createdRound >= nextRound) { keep.push(receipt); continue; }
    const generated = s.cards.find((candidate) => candidate.instanceId === receipt.instanceId);
    if (!generated) reject('invalid_state', 'Structured temporary generated-card receipt references a missing card');
    if (generated.generatedBy !== receipt.sourceCardId) reject('invalid_state', 'Structured temporary generated-card provenance changed');
    if (generated.zone !== 'removed_from_game') moveCard(s, generated.instanceId, 'removed_from_game');
  }
  r.structuredTemporaryGeneratedCards = keep;
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
function recordMovementForAbilityRuntime(s: GameState, playerId: string, from: string | undefined, to: string | undefined, movementKind = 'effect', appendLog = true): number {
  if (!from || !to || from === to) return 0;
  const path = shortestPath(s, from, to);
  const distance = Math.max(0, path.length - 1);
  const r = runtime(s);
  r.movementDistanceThisRound[playerId] = (r.movementDistanceThisRound[playerId] ?? 0) + distance;
  const battlefields = path.slice(1).filter(locationId => isBattlefield(s, locationId)).length;
  r.battlefieldsPassedOrStayedThisRound[playerId] = (r.battlefieldsPassedOrStayedThisRound[playerId] ?? 0) + battlefields;
  if (appendLog) s.log.push({ type: 'movement', message: `player:${playerId}:effect_move:${from}->${to}`, payload: { playerId, from, to, movementKind, manaSpent: 0, roundNumber: s.round.roundNumber } });
  return distance;
}
function processTrustedMovementEntryEvent(s: GameState, event: AbilityEvent, from: string, to: string, movementKind = 'effect', appendLog = true): void {
  const distance = recordMovementForAbilityRuntime(s, event.playerId!, from, to, movementKind, appendLog);
  rememberB04MovementReceipt(s, event, from, to, distance);
  processTrustedFb254EntryEvent(s, event);
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
function isExactSelectedPlayedAttackTemporaryCopyPersistedDecision(value: unknown): value is PendingDecision {
  if (!isPlainRecord(value)) return false;
  const contextValue: unknown = value.context;
  const targetValue: unknown = value.target;
  const remainingEffectsValue: unknown = value.remainingEffects;
  const candidatesValue: unknown = value.candidates;
  const interactionValue: unknown = value.interaction;
  if (!isPlainRecord(contextValue) || !isPlainRecord(contextValue.variables) || !isPlainRecord(contextValue.selections) ||
      !isPlainRecord(targetValue) || !Array.isArray(remainingEffectsValue) || !remainingEffectsValue.every(isPlainRecord) ||
      !Array.isArray(candidatesValue) || !candidatesValue.every((candidate) => typeof candidate === 'string' && candidate.length > 0) ||
      !isPlainRecord(interactionValue) || interactionValue.kind !== 'selected_played_attack_temporary_copy_v1') return false;
  const constraintsValue: unknown = interactionValue.constraints;
  const candidateIdsValue: unknown = interactionValue.candidateIds;
  if (!isPlainRecord(constraintsValue) || !Array.isArray(candidateIdsValue) ||
      !candidateIdsValue.every((candidate) => typeof candidate === 'string' && candidate.length > 0)) return false;
  const rootKeys = Object.keys(value).sort();
  const interactionKeys = Object.keys(interactionValue).sort();
  const constraintKeys = Object.keys(constraintsValue).sort();
  if (!exactPlayerArray(rootKeys, ['candidates', 'context', 'controllerId', 'id', 'interaction', 'max', 'min', 'remainingEffects', 'target']) ||
      !exactPlayerArray(interactionKeys, ['abilityId', 'cancelPolicy', 'candidateIds', 'constraints', 'continuationRef', 'createdRevision', 'kind', 'sourceCardInstanceId', 'targetId', 'template', 'visibility']) ||
      !exactPlayerArray(constraintKeys, ['distinct', 'kind', 'max', 'min', 'targetKind'])) return false;
  return typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.controllerId === 'string' && value.controllerId.length > 0 &&
    Number.isSafeInteger(value.min) && Number.isSafeInteger(value.max) &&
    typeof contextValue.controllerId === 'string' && contextValue.controllerId.length > 0 &&
    typeof contextValue.sourceCardId === 'string' && contextValue.sourceCardId.length > 0 &&
    typeof contextValue.abilityId === 'string' && contextValue.abilityId.length > 0 &&
    typeof interactionValue.sourceCardInstanceId === 'string' && interactionValue.sourceCardInstanceId.length > 0 &&
    typeof interactionValue.abilityId === 'string' && interactionValue.abilityId.length > 0 &&
    typeof interactionValue.continuationRef === 'string' && interactionValue.continuationRef.length > 0 &&
    Number.isSafeInteger(interactionValue.createdRevision);
}
function selectedPlayedAttackTemporaryCopyCandidateIds(s: GameState, ctx: EffectContext): string[] {
  return s.cards.filter((candidate) => {
    if (candidate.instanceId === ctx.sourceCardId || candidate.ownerPlayerId !== ctx.controllerId ||
        candidate.controllerPlayerId !== ctx.controllerId || candidate.zone !== 'attack_area') return false;
    const definition = runtime(s).pack.cards[candidate.definitionId];
    const state = runtime(s).cardState[candidate.instanceId];
    return classifyCardPlay(definition).playKind === 'attack' && state?.playedRound === s.round.roundNumber;
  }).map((candidate) => candidate.instanceId);
}
function createSelectedPlayedAttackTemporaryCopyDecision(s: GameState, ctx: EffectContext, a: AuthoringAbility): PendingDecision {
  if (!isAcceptedSelectedPlayedAttackTemporaryCopyAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported selected played-attack temporary-copy semantic shape');
  }
  const candidates = selectedPlayedAttackTemporaryCopyCandidateIds(s, ctx);
  if (!candidates.length) reject('no_legal_target', 'No legal target remains');
  const id = nextId(s, 'interaction');
  return {
    id, controllerId: ctx.controllerId, target: structuredClone(a.targets[0]!), candidates: [...candidates], min: 1, max: 1,
    context: structuredClone(ctx), remainingEffects: structuredClone(a.effects),
    interaction: {
      kind: 'selected_played_attack_temporary_copy_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1,
      continuationRef: `${id}:continuation`, targetId: 'selected_attack', candidateIds: [...candidates],
      constraints: { kind: 'target', targetKind: 'card', min: 1, max: 1, distinct: true },
    },
  };
}
function resolveSelectedPlayedAttackTemporaryCopy(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  if (!isAcceptedSelectedPlayedAttackTemporaryCopyAbility(a, 'compiled') ||
      effect.type !== SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT || effect.target !== 'selected_attack' ||
      Object.keys(effect).some((key) => !['type', 'target'].includes(key))) {
    reject('resolution_failed', 'Unsupported selected played-attack temporary-copy semantic shape');
  }
  if (!a.conditions.every((candidate) => condition(s, ctx, candidate))) {
    reject('invalid_state', 'Selected attack copy source conditions no longer hold');
  }
  const selectedIds = ctx.selections[str(effect.target)] ?? [];
  if (selectedIds.length !== 1 || new Set(selectedIds).size !== 1) reject('invalid_target', 'Selected attack copy requires exactly one target');
  const selectedId = selectedIds[0]!;
  const selected = s.cards.find((candidate) => candidate.instanceId === selectedId);
  const selectedDefinition = selected ? runtime(s).pack.cards[selected.definitionId] : undefined;
  const selectedState = selected ? runtime(s).cardState[selected.instanceId] : undefined;
  if (!selected || !selectedDefinition || selected.instanceId === ctx.sourceCardId ||
      selected.ownerPlayerId !== ctx.controllerId || selected.controllerPlayerId !== ctx.controllerId ||
      selected.zone !== 'attack_area' || classifyCardPlay(selectedDefinition).playKind !== 'attack' ||
      selectedState?.playedRound !== s.round.roundNumber) {
    reject('invalid_target', 'Selected attack copy target is stale or no longer eligible');
  }

  const copyId = nextId(s, 'temporary-attack-copy');
  s.cards.push({
    instanceId: copyId, definitionId: selected.definitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId,
    zone: 'attack_area', visibility: { scope: 'public' }, generatedBy: ctx.sourceCardId,
  });
  runtime(s).cardState[copyId] = { active: true, faceDown: false, playedRound: 0 };
  runtime(s).ongoingEffects.push({
    id: `temporary-copy:${copyId}`, sourceCardId: copyId, abilityId: ctx.abilityId, controllerId: ctx.controllerId,
    starts: 'immediate', duration: 'this_round', startRound: s.round.roundNumber, expiresAtRound: s.round.roundNumber + 1,
    cleanup: 'remove_from_game', ruleModifiers: [], publicZones: [], sourceMustRemainActive: false,
    policyKey: SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_POLICY, sourceDefinitionIdAtInstall: selected.definitionId, installedRevision: runtime(s).revision,
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
    cleanup: str(a.lifecycle.cleanup), ruleModifiers, publicZones: [],
    ...(isAcceptedM50GrantedRoundDefeatIgnoreAbility(a) ? { sourceMustRemainActive: false } : {}) });
}
function cleanupOngoing(s: GameState): void {
  const r = runtime(s);
  for (const o of r.ongoingEffects) {
    if (o.policyKey === SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_POLICY) {
      if (o.duration !== 'this_round' || o.cleanup !== 'remove_from_game' || o.sourceMustRemainActive !== false ||
          o.expiresAtRound !== o.startRound + 1) reject('resolution_failed', 'Corrupt temporary attack-copy lifecycle state');
      if (s.round.roundNumber >= o.expiresAtRound) {
        const temporary = s.cards.find((candidate) => candidate.instanceId === o.sourceCardId);
        const generator = temporary?.generatedBy ? s.cards.find((candidate) => candidate.instanceId === temporary.generatedBy) : undefined;
        const generatorAbility = generator ? runtime(s).pack.cards[generator.definitionId]?.abilities.find((candidate) => candidate.id === o.abilityId) : undefined;
        if (!temporary || !generator || !generatorAbility || !isAcceptedSelectedPlayedAttackTemporaryCopyAbility(generatorAbility, 'compiled') ||
            temporary.definitionId !== o.sourceDefinitionIdAtInstall || temporary.controllerPlayerId !== o.controllerId ||
            temporary.ownerPlayerId !== o.controllerId || !Number.isInteger(o.installedRevision) || o.installedRevision! < 0) {
          reject('resolution_failed', 'Corrupt temporary attack-copy card state');
        }
        if (temporary.zone !== 'removed_from_game') moveCard(s, temporary.instanceId, 'removed_from_game');
      }
      continue;
    }
    if ([M50_EFFECT_INSTALLED_MANA_SPENDING_FORBID_POLICY, M50_EFFECT_INSTALLED_COMBAT_SETTLEMENT_POLICY].includes(o.policyKey ?? '')) {
      continue;
    }
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
  processEvent(s, { id: nextId(s, 'true-name-revealed'), type: 'm50_servant_true_name_revealed', playerId: controllerId });
}
function playerHasRoundAttackWithAttribute(s: GameState, playerId: string, attribute: string): boolean {
  return s.cards.some((candidate) => {
    if (candidate.controllerPlayerId !== playerId) return false;
    const state = runtime(s).cardState[candidate.instanceId];
    if (state?.playedRound !== s.round.roundNumber) return false;
    const d = definition(s, candidate.instanceId);
    return classifyCardPlay(d).playKind === 'attack' && Array.isArray(d?.cardFace.attributes) && d.cardFace.attributes.includes(attribute);
  });
}

function payableEffectDefeatTargets(s: GameState, controllerId: string, targetPlayerIds: string[]): string[] {
  const controller = player(s, controllerId);
  const payable: string[] = [];
  for (const targetId of [...new Set(targetPlayerIds)]) {
    if (targetId === controllerId) { payable.push(targetId); continue; }
    const cost = m50OpponentDefeatManaCost(s, targetId);
    if (cost <= 0) { payable.push(targetId); continue; }
    if (m50ManaSpendingForbidden(s, controllerId) || controller.mana < cost) continue;
    controller.mana -= cost;
    recordAuthoritativeManaSpend(s, controllerId, cost);
    payable.push(targetId);
  }
  return payable;
}

function stagePreBattleDefeat(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAcceptedPreBattleDefeatAbility(a, 'compiled')) reject('resolution_failed', 'Unsupported pre-battle defeat semantic shape');
  const attribute = preBattleDefeatAttribute(a);
  const controller = player(s, ctx.controllerId);
  if (!attribute || controller.status !== 'active' || !controller.locationId || !isBattlefield(s, controller.locationId)) {
    reject('invalid_state', 'Pre-battle defeat requires an active controller at a battlefield');
  }
  const targetPlayerIds = s.players
    .filter((candidate) => candidate.status === 'active' && candidate.id !== ctx.controllerId && candidate.locationId === controller.locationId)
    .filter((candidate) => !playerHasRoundAttackWithAttribute(s, candidate.id, attribute))
    .map((candidate) => candidate.id);
  if (!targetPlayerIds.length) return;
  const ledger = runtime(s).pendingPreBattleDefeats ??= [];
  const existing = ledger.find((entry) => entry.round === s.round.roundNumber && entry.battlefieldId === controller.locationId &&
    entry.controllerId === ctx.controllerId && entry.sourceCardId === ctx.sourceCardId && entry.abilityId === ctx.abilityId);
  if (existing) {
    const newTargets = targetPlayerIds.filter((targetId) => !existing.targetPlayerIds.includes(targetId));
    existing.targetPlayerIds = [...existing.targetPlayerIds, ...payableEffectDefeatTargets(s, ctx.controllerId, newTargets)];
    return;
  }
  const payableTargets = payableEffectDefeatTargets(s, ctx.controllerId, targetPlayerIds);
  if (!payableTargets.length) return;
  ledger.push({
    round: s.round.roundNumber, battlefieldId: controller.locationId, controllerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, targetPlayerIds: payableTargets,
  });
}

function stageDeploymentLocationOpponentDefeat(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if(!isAcceptedDeploymentLocationOpponentDefeatAbility(a,'compiled')) reject('resolution_failed','Unsupported deployment-location opponent defeat semantic shape');
  const controller=player(s,ctx.controllerId); if(controller.status!=='active'||!controller.locationId||!isBattlefield(s,controller.locationId)) reject('invalid_state','Deployment-location defeat requires active battlefield controller');
  const target=nodes(a.effects)[0]?.target; const targetPlayerIds=structuredChoiceTargetPlayers(s,ctx,target);
  if(!targetPlayerIds.length) reject('invalid_target','Deployment-location defeat requires at least one authoritative target');
  const r=runtime(s); const pending=r.pendingPreBattleDefeats ??= []; if(pending.some((entry)=>entry.round===s.round.roundNumber&&entry.controllerId===ctx.controllerId&&entry.sourceCardId===ctx.sourceCardId&&entry.abilityId===ctx.abilityId)) reject('invalid_state','Deployment-location defeat is already staged this round');
  const payableTargets=payableEffectDefeatTargets(s,ctx.controllerId,targetPlayerIds); if(!payableTargets.length) return;
  pending.push({round:s.round.roundNumber,battlefieldId:controller.locationId,controllerId:ctx.controllerId,sourceCardId:ctx.sourceCardId,abilityId:ctx.abilityId,targetPlayerIds:payableTargets});
}

function stageSelectedSameBattlefieldDefeat(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  const commandSealGuarded = isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(a, 'compiled');
  const structuredChosen = isAcceptedStructuredChosenOpponentDefeatAbility(a, 'compiled');
  if (!isAcceptedSelectedSameBattlefieldDefeatAbility(a, 'compiled') && !commandSealGuarded && !structuredChosen) {
    reject('resolution_failed', 'Unsupported selected same-battlefield defeat semantic shape');
  }
  const controller = player(s, ctx.controllerId); const targetId = structuredChosen ? 'targetPlayerId' : str(a.targets[0]?.id); const selected = ctx.selections[targetId] ?? [];
  if (controller.status !== 'active' || !controller.locationId || !isBattlefield(s, controller.locationId) || selected.length !== 1) {
    reject('invalid_state', 'Selected same-battlefield defeat requires one target and an active battlefield controller');
  }
  const target = s.players.find((candidate) => candidate.id === selected[0] && candidate.status === 'active');
  if (!target || target.id === controller.id || target.locationId !== controller.locationId) reject('invalid_target', 'Selected defeat target is no longer an active same-battlefield opponent');
  if (commandSealGuarded && Number(structuredFlagValue(s, target.id, 'commandSealUsedRound')) === s.round.roundNumber) {
    reject('invalid_target', 'Selected defeat target already spent a Command Seal this round');
  }
  const ledger = runtime(s).pendingPreBattleDefeats ??= [];
  const existing = ledger.find((entry) => entry.round === s.round.roundNumber && entry.battlefieldId === controller.locationId &&
    entry.controllerId === ctx.controllerId && entry.sourceCardId === ctx.sourceCardId && entry.abilityId === ctx.abilityId);
  if (existing) reject('invalid_state', 'Selected same-battlefield defeat was already staged for this source ability');
  const payableTargets = payableEffectDefeatTargets(s, ctx.controllerId, [target.id]);
  if (!payableTargets.length) return;
  ledger.push({ round: s.round.roundNumber, battlefieldId: controller.locationId, controllerId: ctx.controllerId,
    sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, targetPlayerIds: payableTargets });
}

function settleBattleLossVpWinnerReward(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAcceptedBattleLossVpWinnerRewardAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported battle-loss VP winner-reward semantic shape');
  }
  const amounts = battleLossVpWinnerRewardAmounts(a);
  const facts = trustedBattleLossVpWinnerRewardFacts(s, ctx.controllerId, ctx.event);
  if (!amounts || !facts) reject('invalid_event', 'Battle-loss VP winner reward requires trusted same-battle result provenance');

  const r = runtime(s);
  if (r.preventEffects) {
    r.events.push({ type: 'effect_prevented', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    return;
  }

  const controller = player(s, ctx.controllerId);
  if (!Number.isSafeInteger(controller.vp) || controller.vp < 0) reject('invalid_state', 'Controller VP must be a nonnegative safe integer');
  const controllerBefore = controller.vp;
  const controllerAfter = Math.max(0, controllerBefore - amounts.lossAmount);
  const actualLoss = controllerBefore - controllerAfter;

  const winnerBalances = facts.winnerPlayerIds.map((winnerPlayerId) => {
    const winner = player(s, winnerPlayerId);
    if (!Number.isSafeInteger(winner.vp) || winner.vp < 0) reject('invalid_state', 'Winner VP must be a nonnegative safe integer');
    const after = actualLoss > 0 ? winner.vp + amounts.winnerRewardAmount : winner.vp;
    if (!Number.isSafeInteger(after)) reject('invalid_state', 'Winner VP reward would exceed safe integer range');
    return { winner, before: winner.vp, after };
  });

  controller.vp = controllerAfter;
  recordAuthoritativeVictoryPointChange(s, controller.id, controllerBefore, controllerAfter, 'battle-loss-vp');
  r.events.push({
    type: 'victory_points_adjusted', playerId: controller.id, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
    resource: 'victory_points', delta: actualLoss === 0 ? 0 : -actualLoss, requestedDelta: -amounts.lossAmount, before: controllerBefore, after: controllerAfter,
    triggerEventId: ctx.event!.id, battlePhaseResolutionId: facts.battlePhaseResolutionId, battleId: facts.battleId,
    battlefieldId: facts.battlefieldId, resultId: facts.resultId,
  });
  if (actualLoss === 0) return;

  for (const { winner, before, after } of winnerBalances) {
    winner.vp = after;
    recordAuthoritativeVictoryPointChange(s, winner.id, before, after, 'battle-loss-winner-vp');
    r.events.push({
      type: 'victory_points_adjusted', playerId: winner.id, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
      resource: 'victory_points', delta: amounts.winnerRewardAmount, requestedDelta: amounts.winnerRewardAmount,
      before, after, triggerEventId: ctx.event!.id, battlePhaseResolutionId: facts.battlePhaseResolutionId,
      battleId: facts.battleId, battlefieldId: facts.battlefieldId, resultId: facts.resultId,
    });
  }
}

function settleControllerDefeatedVpReward(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAcceptedControllerDefeatedVpRewardAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported controller-defeated VP reward semantic shape');
  }
  const amount = controllerDefeatedVpRewardAmount(a);
  const facts = trustedControllerDefeatedFacts(s, ctx.controllerId, ctx.event);
  if (!amount || !facts) reject('invalid_event', 'Controller-defeated VP reward requires trusted actual-defeat provenance');

  const r = runtime(s);
  if (r.preventEffects) {
    r.events.push({ type: 'effect_prevented', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    return;
  }

  const controller = player(s, ctx.controllerId);
  if (!Number.isSafeInteger(controller.vp) || controller.vp < 0) reject('invalid_state', 'Controller VP must be a nonnegative safe integer');
  const before = controller.vp;
  const after = before + amount;
  if (!Number.isSafeInteger(after)) reject('invalid_state', 'Controller VP reward would exceed safe integer range');

  controller.vp = after;
  recordAuthoritativeVictoryPointChange(s, controller.id, before, after, 'defeated-reward-vp');
  r.events.push({
    type: 'victory_points_adjusted', playerId: controller.id, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
    resource: 'victory_points', delta: amount, requestedDelta: amount, before, after,
    triggerEventId: ctx.event!.id, battlePhaseResolutionId: facts.battlePhaseResolutionId, battleId: facts.battleId,
    battlefieldId: facts.battlefieldId, resultId: facts.resultId,
  });
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
    case 'info_note': break;
    case M50_BATTLE_TERMINAL_ACTIVE_ATTACK_VP_ATTRITION: {
      if (!isAcceptedM50BattleTerminalActiveAttackVpAttritionAbility(a)) {
        reject('unsupported', 'Battle-terminal active-attack VP attrition requires the exact accepted structured ability');
      }
      const event = ctx.event;
      const phaseId = `battle-phase:${s.round.roundNumber}`;
      if (!event || event.type !== 'after_battle_ended' || event.id !== `${phaseId}:after_battle_ended` ||
          event.battlePhaseResolutionId !== phaseId || !Array.isArray(event.battleParticipantIds) || !Array.isArray(event.battleOutcomes)) {
        reject('invalid_event', 'Battle-terminal active-attack VP attrition requires authoritative terminal provenance');
      }
      const participantIds = event.battleParticipantIds;
      if (participantIds.some((playerId) => !s.players.some((candidate) => candidate.id === playerId)) ||
          new Set(participantIds).size !== participantIds.length) {
        reject('invalid_event', 'Battle-terminal active-attack VP attrition participant provenance is malformed');
      }
      const controllerOutcomes = event.battleOutcomes.filter((outcome) =>
        Array.isArray(outcome.participantPlayerIds) && outcome.participantPlayerIds.includes(ctx.controllerId));
      if (controllerOutcomes.length === 0) break;
      if (controllerOutcomes.length !== 1) reject('invalid_event', 'Battle-terminal controller appears in multiple battle outcomes');
      const outcome = controllerOutcomes[0]!;
      const frozenParticipants = outcome.participantPlayerIds!;
      if (!outcome.battlefieldId || frozenParticipants.some((playerId) => !participantIds.includes(playerId)) ||
          new Set(frozenParticipants).size !== frozenParticipants.length || !outcome.winnerPlayerIds.every((playerId) => frozenParticipants.includes(playerId))) {
        reject('invalid_event', 'Battle-terminal active-attack VP attrition outcome provenance is malformed');
      }
      const offset = Number(effect.offset);
      const maxAmount = Number(effect.maxAmount);
      for (const targetId of frozenParticipants) {
        if (targetId === ctx.controllerId) continue;
        const targetPlayer = player(s, targetId);
        if (targetPlayer.status !== 'active') continue;
        const activeAttackCount = s.cards.filter((candidate) => {
          if (candidate.controllerPlayerId !== targetId || candidate.zone !== 'attack_area') return false;
          const state = r.cardState[candidate.instanceId];
          return state?.active === true && state.faceDown !== true && cardPlayClassification(s, candidate.instanceId).playKind === 'attack';
        }).length;
        const loss = Math.min(maxAmount, Math.max(0, activeAttackCount + offset));
        if (loss <= 0) continue;
        const before = targetPlayer.vp;
        const after = Math.max(0, before - loss);
        targetPlayer.vp = after;
        recordAuthoritativeVictoryPointChange(s, targetId, before, after, 'battle-terminal-active-attack-attrition');
      }
      break;
    }
    case 'set_player_flag': {
      const key = str(effect.key); if (!key) reject('resolution_failed', 'Structured player flag effect requires key');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured player flag effect has no authoritative target');
      let value: boolean | string | number;
      const rawValue = effect.value;
      if (rawValue && typeof rawValue === 'object' && str(node(rawValue).type) === 'current_round') {
        const offset = Number(node(rawValue).offset ?? 0);
        if (!Number.isInteger(offset)) reject('resolution_failed', 'Structured current-round flag offset must be an integer');
        value = s.round.roundNumber + offset;
      } else if (typeof rawValue === 'boolean' || typeof rawValue === 'string' || Number.isFinite(rawValue)) value = rawValue as boolean | string | number;
      else value = true;
      const thisRound = node(effect.lifecycle).duration === 'this_round';
      for (const targetId of targetIds) setStructuredFlag(s, targetId, key, value, thisRound);
      break;
    }
    case 'add_status': {
      const status = str(effect.status);
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      if (!status || !targetIds.length || Object.keys(effect).some((key) => !['type', 'target', 'status'].includes(key))) reject('resolution_failed', 'Structured add-status effect is invalid');
      const store = runtime(s).playerStatusKeysByPlayer ??= {};
      for (const targetId of targetIds) {
        const statuses = store[targetId] ??= [];
        if (!statuses.includes(status)) statuses.push(status);
      }
      break;
    }
    case 'add_linked_status': {
      const status = str(effect.status);
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      if (!status || !targetIds.length || Object.keys(effect).some((key) => !['type', 'target', 'status'].includes(key))) reject('resolution_failed', 'Structured linked-status add effect is invalid');
      const linkedStatus = `${status}:${ctx.sourceCardId}`;
      const store = runtime(s).playerStatusKeysByPlayer ??= {};
      for (const targetId of targetIds) { const statuses = store[targetId] ??= []; if (!statuses.includes(linkedStatus)) statuses.push(linkedStatus); }
      break;
    }
    case 'remove_linked_status': {
      const status = str(effect.status);
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? { scope: 'all_players' });
      if (!status || !targetIds.length || Object.keys(effect).some((key) => !['type', 'target', 'status'].includes(key))) reject('resolution_failed', 'Structured linked-status remove effect is invalid');
      const linkedStatus = `${status}:${ctx.sourceCardId}`;
      const store = runtime(s).playerStatusKeysByPlayer ??= {};
      for (const targetId of targetIds) store[targetId] = (store[targetId] ?? []).filter((entry) => entry !== linkedStatus);
      break;
    }
    case 'remove_status': {
      const status = str(effect.status);
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      if (!status || !targetIds.length || Object.keys(effect).some((key) => !['type', 'target', 'status'].includes(key))) reject('resolution_failed', 'Structured remove-status effect is invalid');
      const store = runtime(s).playerStatusKeysByPlayer ??= {};
      for (const targetId of targetIds) store[targetId] = (store[targetId] ?? []).filter((entry) => entry !== status);
      break;
    }    case 'clear_player_flag': {
      const key = str(effect.key); if (!key) reject('resolution_failed', 'Structured clear-player-flag effect requires key');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured clear-player-flag effect has no authoritative target');
      for (const targetId of targetIds) {
        delete structuredPlayerFlags(s, targetId)[key];
        const roundKeys = runtime(s).structuredRoundFlagKeysByPlayer?.[targetId];
        if (roundKeys) delete roundKeys[key];
      }
      break;
    }
    case 'add_player_flag_number': {
      const key = str(effect.key); if (!key) reject('resolution_failed', 'Structured numeric player flag effect requires key');
      const amount = numeric(s, ctx, effect.amount ?? 1);
      if (!Number.isSafeInteger(amount)) reject('resolution_failed', 'Structured numeric player flag amount must be a safe integer');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured numeric player flag effect has no authoritative target');
      const thisRound = node(effect.lifecycle).duration === 'this_round';
      for (const targetId of targetIds) {
        const prior = structuredFlagValue(s, targetId, key);
        const current = prior === undefined ? 0 : Number(prior);
        if (!Number.isSafeInteger(current)) reject('invalid_state', 'Structured numeric player flag is not a safe integer');
        const next = current + amount;
        if (!Number.isSafeInteger(next)) reject('invalid_state', 'Structured numeric player flag would exceed safe integer range');
        setStructuredFlag(s, targetId, key, next, thisRound);
      }
      break;
    }
    case 'clear_player_status_and_source_card_power_bonus': {
      const status = str(effect.status); const flagKey = str(effect.flagKey);
      if (!status && !flagKey) reject('resolution_failed', 'Structured status cleanup requires status or flagKey');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? { scope: 'all_players' });
      if (!targetIds.length) reject('resolution_failed', 'Structured status cleanup has no authoritative targets');
      let removedCount = 0;
      for (const targetId of targetIds) {
        let removed = false;
        if (status) {
          const statuses = r.playerStatusKeysByPlayer?.[targetId] ?? [];
          if (statuses.includes(status)) {
            (r.playerStatusKeysByPlayer ??= {})[targetId] = statuses.filter((entry) => entry !== status);
            removed = true;
          }
        }
        if (flagKey) {
          const flags = structuredPlayerFlags(s, targetId);
          if (Object.prototype.hasOwnProperty.call(flags, flagKey)) {
            delete flags[flagKey];
            const roundKeys = r.structuredRoundFlagKeysByPlayer?.[targetId];
            if (roundKeys) delete roundKeys[flagKey];
            removed = true;
          }
        }
        if (removed) removedCount++;
      }
      const amountPerTarget = numeric(s, ctx, effect.amountPerTarget ?? 0);
      const maxAmount = effect.maxAmount === undefined ? Number.MAX_SAFE_INTEGER : Number(effect.maxAmount);
      if (!Number.isSafeInteger(amountPerTarget) || amountPerTarget < 0 || !Number.isSafeInteger(maxAmount) || maxAmount < 0) {
        reject('resolution_failed', 'Structured status-cleanup power amount is invalid');
      }
      const amount = Math.min(removedCount * amountPerTarget, maxAmount);
      if (!Number.isSafeInteger(amount)) reject('resolution_failed', 'Structured status-cleanup power amount exceeds safe integer range');
      if (amount > 0) installStructuredSourceCardPowerBonus(s, ctx, {
        type: 'source_card_power_bonus', id: str(effect.id) || 'status-clear-power', amount,
        duration: str(effect.duration) || 'this_round',
      });
      break;
    }
    case 'finish_game': {
      const winnerIds = [...new Set(structuredTargetPlayerIds(s, ctx, effect.target))];
      if (!winnerIds.length) reject('resolution_failed', 'Structured finish-game effect requires at least one winner');
      const reason = str(effect.reason) || card(s, ctx.sourceCardId).definitionId;
      const next = { winnerIds, reason, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
        unpreventable: effect.unpreventable === true, round: s.round.roundNumber };
      if (r.structuredInstantVictory && JSON.stringify(r.structuredInstantVictory) !== JSON.stringify(next)) {
        reject('invalid_state', 'Conflicting structured instant-victory state');
      }
      r.structuredInstantVictory = next;
      break;
    }
    case 'transfer_mana': {
      const sourceIds = structuredTargetPlayerIds(s, ctx, effect.from ?? effect.source);
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      const amount = numeric(s, ctx, effect.amount ?? 0);
      if (sourceIds.length !== 1 || targetIds.length !== 1 || sourceIds[0] === targetIds[0] || !Number.isSafeInteger(amount) || amount < 0 ||
          Object.keys(effect).some((key) => !['type','from','source','target','amount','requireExact'].includes(key)) ||
          (effect.requireExact !== undefined && effect.requireExact !== true)) reject('unsupported', 'Structured mana transfer shape is invalid');
      const sourceId = sourceIds[0]!, targetId = targetIds[0]!;
      const transferOn = (state: GameState): number => {
        const source = player(state, sourceId);
        if (!Number.isSafeInteger(source.mana) || source.mana < 0) reject('invalid_state', 'Mana transfer source balance is invalid');
        const available = Math.min(amount, source.mana);
        if (available <= 0) return 0;
        const result = grantMana(state, targetId, available, { source: 'generic' });
        if (result.actualAmount > 0) source.mana -= result.actualAmount;
        return result.actualAmount;
      };
      if (effect.requireExact === true) {
        const draft = structuredClone(s);
        const transferred = transferOn(draft);
        if (transferred !== amount) reject('insufficient_mana', 'Exact mana transfer amount is unavailable');
      }
      transferOn(s);
      break;
    }
    case 'transfer_victory_points': {
      const sourceIds = structuredTargetPlayerIds(s, ctx, effect.from ?? effect.source);
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      const amount = numeric(s, ctx, effect.amount);
      if (!sourceIds.length || targetIds.length !== 1 || !Number.isSafeInteger(amount) || amount < 0 ||
          Object.keys(effect).some((key) => !['type','from','source','target','amount'].includes(key))) reject('unsupported', 'Structured victory-point transfer shape is invalid');
      const targetId = targetIds[0]!; let total = 0;
      for (const sourceId of sourceIds) {
        if (sourceId === targetId) continue;
        const source = player(s, sourceId);
        if (!Number.isSafeInteger(source.vp) || source.vp < 0) reject('invalid_state', 'Victory-point transfer source balance is invalid');
        const actual = Math.min(amount, source.vp);
        if (actual <= 0) continue;
        const before = source.vp; source.vp -= actual; total += actual;
        recordAuthoritativeVictoryPointChange(s, source.id, before, source.vp, 'structured-vp-transfer-source');
      }
      const target = player(s, targetId); const before = target.vp; const after = before + total;
      if (!Number.isSafeInteger(before) || before < 0 || !Number.isSafeInteger(after)) reject('invalid_state', 'Victory-point transfer target balance is invalid');
      if (total > 0) { target.vp = after; recordAuthoritativeVictoryPointChange(s, target.id, before, after, 'structured-vp-transfer-target'); }
      break;
    }
    case 'gain_mana': {
      const amount = numeric(s, ctx, effect.amount);
      if (!Number.isSafeInteger(amount) || amount < 0) reject('resolution_failed', 'Structured mana gain must be a nonnegative safe integer');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured mana gain has no authoritative target');
      for (const targetId of targetIds) grantMana(s, targetId, amount, { source: 'generic' });
      break;
    }
    case 'combat_power_bonus': {
      const amount = numeric(s, ctx, effect.amount);
      if (!Number.isSafeInteger(amount) || amount < 0) reject('resolution_failed', 'Structured combat-power bonus must be a nonnegative safe integer');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured combat-power bonus has no authoritative target');
      if (r.roundTotalPowerAdjustments.round !== s.round.roundNumber) r.roundTotalPowerAdjustments = { round: s.round.roundNumber, byPlayer: {} };
      for (const targetId of targetIds) {
        const before = r.roundTotalPowerAdjustments.byPlayer[targetId] ?? 0;
        const after = before + amount;
        if (!Number.isSafeInteger(after)) reject('invalid_state', 'Structured combat-power bonus would exceed safe integer range');
        r.roundTotalPowerAdjustments.byPlayer[targetId] = after;
      }
      break;
    }
    case 'multiply_deployment_bonus': {
      const multiplier = numeric(s, ctx, effect.multiplier ?? 2);
      if (!Number.isSafeInteger(multiplier) || multiplier < 1) reject('resolution_failed', 'Structured deployment multiplier must be a positive safe integer');
      if (effect.target !== 'controller') reject('unsupported', 'Structured deployment multiplier currently requires controller target');
      try { multiplyDeploymentBonus(s, ctx.controllerId, multiplier); }
      catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Structured deployment multiplier failed'); }
      break;
    }
    case 'source_card_power_bonus': {
      installStructuredSourceCardPowerBonus(s, ctx, effect);
      break;
    }
    case 'add_card_cost_modifier': {
      installStructuredCardCostModifier(s, ctx, effect);
      break;
    }
    case 'exile_source_card': {
      if (Object.keys(effect).some((key) => key !== 'type')) reject('unsupported', 'Structured exile-source-card effect is invalid');
      const source = card(s, ctx.sourceCardId);
      moveCard(s, source.instanceId, 'removed_from_game');
      const sourceState = runtime(s).cardState[source.instanceId];
      if (sourceState) { sourceState.active = false; sourceState.faceDown = false; }
      processEvent(s, { id: nextId(s, 'card-exiled'), type: 'm50_card_exiled', sourceCardId: source.instanceId, playerId: source.controllerPlayerId });
      break;
    }
    case 'sequester_random_inactive_servant_skill': {
      const target = node(effect.target);
      if (str(target.scope) !== 'event_defeated_players' || effect.returnOn !== 'controller_elimination' ||
          Object.keys(effect).some((key) => !['type','target','returnOn'].includes(key)) || Object.keys(target).some((key) => key !== 'scope')) {
        reject('unsupported', 'Structured servant-skill sequestration shape is invalid');
      }
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      for (const targetPlayerId of targetIds) sequesterRandomInactiveServantSkill(s, targetPlayerId, ctx.controllerId, ctx.sourceCardId);
      break;
    }
    case 'remove_selected_cards': {
      const key = str(effect.payloadKey) || 'selectedInstanceIds';
      const selected = ctx.selections[key] ?? [];
      if (new Set(selected).size !== selected.length) reject('invalid_target', 'Structured removal selection contains duplicate cards');
      const exactCount = effect.count === undefined ? undefined : Number(effect.count);
      const minCount = effect.minCount === undefined ? (exactCount ?? selected.length) : Number(effect.minCount);
      const maxCount = effect.maxCount === undefined ? (exactCount ?? selected.length) : Number(effect.maxCount);
      if (!Number.isSafeInteger(minCount) || !Number.isSafeInteger(maxCount) || minCount < 0 || maxCount < minCount ||
          selected.length < minCount || selected.length > maxCount || (exactCount !== undefined && selected.length !== exactCount)) {
        reject('invalid_target', 'Structured removal selection count is invalid');
      }
      const expectedZone = normalizeStructuredZone(effect.zone);
      if (!expectedZone) reject('resolution_failed', 'Structured removal requires a source zone');
      for (const instanceId of selected) {
        const selectedCard = card(s, instanceId);
        if (selectedCard.zone !== expectedZone) reject('invalid_target', 'Structured removal target left the declared source zone');
      }
      for (const instanceId of selected) moveCard(s, instanceId, 'removed_from_game');
      break;
    }
    case 'remove_cards_in_zone': {
      const sourceZone = normalizeStructuredZone(effect.zone);
      if (!['hand', 'deck', 'discard'].includes(sourceZone)) reject('unsupported', 'Structured zone removal requires hand, deck, or discard');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured zone removal has no authoritative target');
      const definitionIds = new Set(Array.isArray(effect.definitionIds) ? effect.definitionIds.map(str).filter(Boolean) : []);
      const attributesAny = Array.isArray(effect.attributesAny) ? effect.attributesAny.map(str).filter(Boolean) : [];
      const attributesAll = Array.isArray(effect.attributesAll) ? effect.attributesAll.map(str).filter(Boolean) : [];
      const targetSet = new Set(targetIds);
      const instanceIds = s.cards.filter((candidate) => {
        if (!targetSet.has(candidate.controllerPlayerId) || candidate.zone !== sourceZone) return false;
        if (definitionIds.size && !definitionIds.has(candidate.definitionId)) return false;
        const def = definition(s, candidate.instanceId);
        const attrs = Array.isArray(def?.cardFace.attributes) ? def.cardFace.attributes : [];
        if (attributesAny.length && !attributesAny.some((attribute) => attrs.includes(attribute))) return false;
        if (attributesAll.length && !attributesAll.every((attribute) => attrs.includes(attribute))) return false;
        return true;
      }).map((candidate) => candidate.instanceId);
      for (const instanceId of instanceIds) moveCard(s, instanceId, 'removed_from_game');
      break;
    }
    case 'close_selected_card': {
      const key = str(effect.payloadKey) || 'selectedInstanceIds';
      const selected = ctx.selections[key] ?? [];
      const count = Number(effect.count ?? 1);
      if (!Number.isSafeInteger(count) || count < 1 || selected.length !== count || new Set(selected).size !== selected.length) {
        reject('invalid_target', 'Structured close selection count is invalid');
      }
      for (const instanceId of selected) closeStructuredSelectedCard(s, ctx, instanceId, effect);
      break;
    }
    case 'activate_owned_skill_card': {
      setOwnedSkillZoneActiveState(s, ctx, str(effect.definitionId), true);
      break;
    }
    case 'deactivate_owned_skill_card': {
      setOwnedSkillZoneActiveState(s, ctx, str(effect.definitionId), false);
      break;
    }
    case 'copy_selected_card': {
      const payloadKey = str(effect.payloadKey) || 'selectedInstanceIds';
      const selectedIds = ctx.selections[payloadKey] ?? [];
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      const lifecycle = node(effect.lifecycle);
      const allowedKeys = ['type','id','printedClause','source','payloadKey','target','zone','face','active','temporary','lifecycle','residual'];
      const permanentAttack = normalizeStructuredZone(effect.zone) === 'attack_area' && effect.face === 'up' && effect.active === true &&
        effect.temporary === false && effect.residual === true && lifecycle.duration === 'permanent' &&
        Object.keys(lifecycle).every((key) => key === 'duration');
      const temporarySkill = normalizeStructuredZone(effect.zone) === 'skill' && effect.target === 'controller' && effect.face === 'up' &&
        effect.active === false && effect.temporary === true && effect.residual === false && lifecycle.duration === 'this_round' &&
        lifecycle.cleanup === 'remove_from_game' && Object.keys(lifecycle).every((key) => ['duration','cleanup'].includes(key));
      if (selectedIds.length !== 1 || targetIds.length !== 1 || effect.source !== 'selected_card' ||
          Object.keys(effect).some((key) => !allowedKeys.includes(key)) || (!permanentAttack && !temporarySkill)) {
        reject('unsupported', 'Structured selected-card copy shape is invalid');
      }
      const source = card(s, selectedIds[0]!);
      if (source.zone !== 'skill') reject('invalid_target', 'Structured copy source must remain in a skill zone');
      const sourceState = runtime(s).cardState[source.instanceId];
      const definition = runtime(s).pack.cards[source.definitionId];
      if (!definition || definition.cardType !== 'servant_skill' || sourceState?.faceDown === true) {
        reject('invalid_target', 'Structured copy source must be a face-up servant skill card');
      }
      if (permanentAttack && (source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId)) {
        reject('invalid_target', 'Structured permanent attack copy source must be controller-owned');
      }
      const targetId = targetIds[0]!;
      const copyId = nextId(s, 'm50-copy');
      s.cards.push({
        instanceId: copyId, definitionId: source.definitionId, ownerPlayerId: targetId, controllerPlayerId: targetId,
        zone: permanentAttack ? 'attack_area' : 'skill', visibility: permanentAttack ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: targetId },
        generatedBy: ctx.sourceCardId, createdByPlayerId: ctx.controllerId, derivedFromInstanceId: source.instanceId,
      });
      runtime(s).cardState[copyId] = { active: permanentAttack, faceDown: false, playedRound: s.round.roundNumber };
      if (temporarySkill) (runtime(s).structuredTemporaryGeneratedCards ??= []).push({
        instanceId: copyId, createdRound: s.round.roundNumber, sourceCardId: ctx.sourceCardId,
      });
      runtime(s).events.push({ type: 'card_created', playerId: targetId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId,
        cardInstanceId: copyId, toZone: permanentAttack ? 'attack_area' : 'skill', movedCount: 1 });
      break;
    }
    case 'install_ability_rule_modifier': {
      const abilityId = str(effect.abilityId); const modifierId = str(effect.modifierId); const payloadKey = str(effect.payloadKey);
      if (!abilityId || abilityId !== ctx.abilityId || !modifierId ||
          Object.keys(effect).some((key) => !['type','abilityId','modifierId','target','payloadKey'].includes(key))) {
        reject('unsupported', 'Effect-installed ability rule modifier shape is invalid');
      }
      const ability = abilityDefinition(s, ctx.sourceCardId, abilityId);
      const modifier = ability.ruleModifiers.find((candidate) => str(candidate.id) === modifierId);
      const scope = node(modifier?.scope); const modifierLifecycle = node(modifier?.lifecycle);
      if (modifier && isAcceptedEffectInstalledControllerManaSpendingForbidModifier(modifier)) {
        if (payloadKey || effect.target !== 'decision_player' ||
            Object.keys(effect).some((key) => !['type','abilityId','modifierId','target'].includes(key))) {
          reject('unsupported', 'Effect-installed mana-spending modifier shape is invalid');
        }
        const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
        if (targetIds.length !== 1) reject('invalid_target', 'Effect-installed mana-spending modifier requires one decision player');
        const targetId = targetIds[0]!;
        const policyKey = M50_EFFECT_INSTALLED_MANA_SPENDING_FORBID_POLICY;
        const exact = runtime(s).ongoingEffects.find((ongoing) => ongoing.policyKey === policyKey && ongoing.startRound === s.round.roundNumber &&
          ongoing.ruleModifiers.some((entry) => node(entry.definition.scope).playerId === targetId));
        if (!exact) runtime(s).ongoingEffects.push({
          id: nextId(s, 'm50-mana-spending-forbid'), sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, controllerId: ctx.controllerId,
          starts: 'immediate', duration: 'this_round', startRound: s.round.roundNumber, expiresAtRound: s.round.roundNumber + 1,
          cleanup: 'expire_after_duration', sourceMustRemainActive: false, policyKey, publicZones: [],
          ruleModifiers: [{ sourceCardId: ctx.sourceCardId, controllerId: ctx.controllerId, definition: {
            id: modifierId, operation: 'forbid', rule: 'mana_spending', scope: { subject: 'selected_player', playerId: targetId },
          } }],
        });
        break;
      }
      if (modifier && isAcceptedEffectInstalledCombatSettlementModifier(modifier)) {
        if (payloadKey || effect.target !== 'controller' ||
            Object.keys(effect).some((key) => !['type','abilityId','modifierId','target'].includes(key))) {
          reject('unsupported', 'Effect-installed combat-settlement modifier shape is invalid');
        }
        const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
        if (targetIds.length !== 1 || targetIds[0] !== ctx.controllerId) {
          reject('invalid_target', 'Effect-installed combat-settlement modifier requires the controller');
        }
        const targetId = targetIds[0]!;
        const policyKey = M50_EFFECT_INSTALLED_COMBAT_SETTLEMENT_POLICY;
        let ongoing = runtime(s).ongoingEffects.find((candidate) => candidate.policyKey === policyKey &&
          candidate.sourceCardId === ctx.sourceCardId && candidate.abilityId === ctx.abilityId &&
          candidate.controllerId === ctx.controllerId && candidate.startRound === s.round.roundNumber);
        if (!ongoing) {
          ongoing = {
            id: nextId(s, 'm50-combat-settlement'), sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, controllerId: ctx.controllerId,
            starts: 'immediate', duration: 'this_round', startRound: s.round.roundNumber, expiresAtRound: s.round.roundNumber + 1,
            cleanup: 'remain_active', sourceMustRemainActive: false, policyKey, publicZones: [], ruleModifiers: [],
          };
          runtime(s).ongoingEffects.push(ongoing);
        }
        if (ongoing.ruleModifiers.some((entry) => entry.definition.rule === modifier.rule)) {
          reject('invalid_state', 'Duplicate effect-installed combat-settlement rule');
        }
        const baseScope = node(modifier.scope);
        const installedScope = modifier.rule === 'combat_reward_distribution'
          ? { subject: 'selected_player', playerId: targetId, whenControllerWins: true, mode: 'full_reward_each' }
          : { subject: 'selected_player', playerId: targetId };
        if (baseScope.subject !== 'controller') reject('unsupported', 'Combat-settlement modifier controller scope is invalid');
        ongoing.ruleModifiers.push({ sourceCardId: ctx.sourceCardId, controllerId: ctx.controllerId, definition: {
          id: modifierId, operation: modifier.operation, rule: modifier.rule, scope: installedScope,
        } });
        break;
      }
      if (!modifier || modifier.installation !== 'effect' || modifier.operation !== 'forbid' || modifier.rule !== 'skill_use' ||
          scope.subject !== 'controller' || scope.skillDefinitionIdsFromSelectedCard !== true ||
          Object.keys(scope).some((key) => !['subject','skillDefinitionIdsFromSelectedCard'].includes(key)) ||
          modifierLifecycle.duration !== 'this_round' || Object.keys(modifierLifecycle).some((key) => key !== 'duration') ||
          Object.keys(modifier).some((key) => !['id','printedClause','installation','operation','rule','scope','lifecycle'].includes(key))) {
        reject('unsupported', 'Effect-installed selected-definition skill-use modifier is invalid');
      }
      const selectedIds = ctx.selections[payloadKey] ?? []; const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (selectedIds.length !== 1 || targetIds.length !== 1) reject('invalid_target', 'Effect-installed skill-use modifier requires one selected card owner');
      const selected = card(s, selectedIds[0]!); const selectedDefinition = runtime(s).pack.cards[selected.definitionId]; const targetId = targetIds[0]!;
      if (selected.ownerPlayerId !== targetId || selected.controllerPlayerId !== targetId || selected.zone !== 'skill' ||
          runtime(s).cardState[selected.instanceId]?.faceDown === true || selectedDefinition?.cardType !== 'servant_skill') {
        reject('invalid_target', 'Effect-installed skill-use modifier selection provenance is stale or invalid');
      }
      const policyKey = M50_EFFECT_INSTALLED_SKILL_USE_FORBID_POLICY;
      const exact = runtime(s).ongoingEffects.find((ongoing) => ongoing.policyKey === policyKey && ongoing.startRound === s.round.roundNumber &&
        ongoing.ruleModifiers.some((entry) => node(entry.definition.scope).playerId === targetId && node(entry.definition.scope).definitionId === selected.definitionId));
      if (!exact) runtime(s).ongoingEffects.push({
        id: nextId(s, 'm50-skill-use-forbid'), sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, controllerId: ctx.controllerId,
        starts: 'immediate', duration: 'this_round', startRound: s.round.roundNumber, expiresAtRound: s.round.roundNumber + 1,
        cleanup: 'expire_after_duration', sourceMustRemainActive: false, policyKey, publicZones: [],
        ruleModifiers: [{ sourceCardId: ctx.sourceCardId, controllerId: ctx.controllerId, definition: {
          id: modifierId, operation: 'forbid', rule: 'skill_use', scope: { subject: 'selected_player', playerId: targetId, definitionId: selected.definitionId },
        } }],
      });
      break;
    }
    case 'join_source_card_to_attack': {
      if (!isAcceptedM50SourceCardCombatJoinAbility(a)) reject('unsupported', 'Source-card combat join requires the exact accepted M50 granted ability');
      const zones = Array.isArray(effect.allowedSourceZones) ? effect.allowedSourceZones.map(str) : [];
      if (JSON.stringify(zones) !== JSON.stringify(['hand', 'skill']) ||
          Object.keys(effect).some((key) => !['type', 'allowedSourceZones'].includes(key))) {
        reject('unsupported', 'Source-card combat join effect shape is invalid');
      }
      const source = card(s, ctx.sourceCardId);
      if (source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId || !zones.includes(source.zone)) {
        reject('invalid_state', 'Source card is no longer an owned hand/skill card eligible to join the attack');
      }
      moveCard(s, ctx.sourceCardId, 'attack_area');
      const sourceState = runtime(s).cardState[ctx.sourceCardId] ??= { active: false, faceDown: false, playedRound: s.round.roundNumber };
      sourceState.active = true; sourceState.faceDown = false; sourceState.playedRound = s.round.roundNumber;
      break;
    }
    case 'double_source_base_power_remove_after_battle': {
      if (!isAcceptedM50BladeStormGrantedAbility(a) || Object.keys(effect).some((key) => key !== 'type')) {
        reject('unsupported', 'Source-card base-power doubling requires the exact accepted M50 granted ability');
      }
      const source = card(s, ctx.sourceCardId); const sourceDefinition = definition(s, ctx.sourceCardId);
      const sourceState = runtime(s).cardState[ctx.sourceCardId];
      if (source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId || source.zone !== 'attack_area' ||
          sourceDefinition?.cardType !== 'basic_attack' || sourceState?.active !== true || sourceState.faceDown === true) {
        reject('invalid_source', 'Granted base-power doubling requires an active face-up basic attack');
      }
      const before = sourceState.basePowerMultiplier ?? 1;
      const after = before * 2;
      if (!Number.isSafeInteger(before) || before < 1 || !Number.isSafeInteger(after)) {
        reject('invalid_state', 'Physical-card base-power multiplier overflow');
      }
      sourceState.basePowerMultiplier = after;
      sourceState.removeAfterBattleRound = s.round.roundNumber;
      break;
    }
    case 'create_card_instances': {
      createStructuredCardInstances(s, ctx, effect);
      break;
    }
    case 'remove_owned_cards_by_linked_skill': {
      const linkedSkillId = str(effect.linkedSkillId);
      const zones = Array.isArray(effect.zones) ? effect.zones.map(normalizeStructuredZone) : [];
      if (effect.target !== 'controller' || !linkedSkillId || zones.length !== 1 || zones[0] !== 'skill' ||
          Object.keys(effect).some((key) => !['type','target','linkedSkillId','zones'].includes(key))) {
        reject('unsupported', 'Structured linked-skill cleanup shape is invalid');
      }
      const targets = s.cards.filter((candidate) => candidate.ownerPlayerId === ctx.controllerId && candidate.controllerPlayerId === ctx.controllerId &&
        candidate.definitionId === linkedSkillId && candidate.zone === 'skill');
      for (const target of targets) {
        moveCard(s, target.instanceId, 'removed_from_game');
        const state = runtime(s).cardState[target.instanceId]; if (state) { state.active = false; state.faceDown = false; }
      }
      break;
    }
    case 'retrigger_card_play_effects': {
      const definitionIds = Array.isArray(effect.definitionIds) ? effect.definitionIds.map(str).filter(Boolean) : [];
      if (!definitionIds.length || new Set(definitionIds).size !== definitionIds.length ||
          Object.keys(effect).some((key) => !['type', 'definitionIds'].includes(key))) {
        reject('resolution_failed', 'Structured card-play retrigger requires an exact nonempty definition set');
      }
      const allowed = new Set(definitionIds);
      const sources = s.cards.filter((candidate) => candidate.controllerPlayerId === ctx.controllerId && candidate.zone === 'attack_area' &&
        allowed.has(candidate.definitionId) && active(s, candidate.instanceId) && runtime(s).cardState[candidate.instanceId]?.faceDown !== true);
      for (const source of sources) {
        const sourceDefinition = definition(s, source.instanceId);
        if (!sourceDefinition) reject('invalid_state', 'Structured card-play retrigger source definition is missing');
        const playedEvent: AbilityEvent = {
          id: nextId(s, 'retrigger-play'), type: 'on_card_played', playerId: ctx.controllerId, sourceCardId: source.instanceId,
          playedCards: [{ instanceId: source.instanceId, controllerId: ctx.controllerId, cardType: sourceDefinition.cardType, faceDown: false }],
        };
        for (const triggeredAbility of sourceDefinition.abilities.filter((candidate) => candidate.activation.trigger === 'on_card_played')) {
          const interaction = classifyAbilityInteraction(triggeredAbility);
          if (!['automatic_trigger', 'automatic_rule'].includes(interaction.kind)) {
            reject('unsupported', 'Structured card-play retrigger cannot replay an interactive on-play ability');
          }
          if (!canActivate(s, source.instanceId, triggeredAbility, playedEvent) || !triggerEventScopeMatches(triggeredAbility, playedEvent)) continue;
          executeAbility(s, context(s, source.instanceId, triggeredAbility.id, playedEvent));
        }
      }
      break;
    }
    case 'discard_bottom_card': {
      if (!isAcceptedM50BoundaryBottomDiscardAbility(a)) reject('unsupported', 'Structured bottom-card discard is reserved to the exact granted boundary ability');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (targetIds.length !== 1) reject('invalid_target', 'Boundary bottom discard requires exactly one selected player');
      const targetId = targetIds[0]!;
      const acceptedTargetIds = candidates(s, ctx, a.targets[0]!);
      if (!acceptedTargetIds.includes(targetId)) reject('invalid_target', 'Boundary bottom discard target is no longer eligible');
      const deck = s.cards.filter((candidate) => candidate.ownerPlayerId === targetId && candidate.zone === 'deck');
      const bottom = deck.at(-1);
      if (!bottom) reject('resolution_failed', 'Boundary bottom discard target deck is empty');
      moveCard(s, bottom.instanceId, 'discard');
      break;
    }
    case 'gain_mana_from_selected_card_base_power': {
      const key = str(effect.payloadKey) || 'selectedInstanceIds';
      const selected = ctx.selections[key] ?? [];
      if (selected.length !== 1) reject('invalid_target', 'Selected-card base-power mana gain requires exactly one card');
      const amount = structuredKnownCardBasePower(s, selected[0]!);
      grantMana(s, ctx.controllerId, amount, { source: 'generic' });
      break;
    }
    case 'gain_victory_points_if_selected_card_base_power_greater': {
      const leftKey = str(effect.leftPayloadKey); const rightKey = str(effect.rightPayloadKey);
      const amount = Number(effect.amount);
      if (!leftKey || !rightKey || leftKey === rightKey || !Number.isSafeInteger(amount) || amount < 0) {
        reject('resolution_failed', 'Selected-card base-power VP comparison has an invalid envelope');
      }
      const left = ctx.selections[leftKey] ?? []; const right = ctx.selections[rightKey] ?? [];
      if (left.length !== 1 || right.length !== 1 || left[0] === right[0]) {
        reject('invalid_target', 'Selected-card base-power VP comparison requires two distinct singleton selections');
      }
      const leftPower = structuredKnownCardBasePower(s, left[0]!);
      const rightPower = structuredKnownCardBasePower(s, right[0]!);
      if (leftPower > rightPower) {
        const controller = player(s, ctx.controllerId); const before = controller.vp; const after = before + amount;
        if (!Number.isSafeInteger(before) || before < 0 || !Number.isSafeInteger(after)) {
          reject('invalid_state', 'Selected-card base-power VP reward would exceed the valid score range');
        }
        controller.vp = after;
        recordAuthoritativeVictoryPointChange(s, controller.id, before, after, 'structured-selected-card-base-power-vp');
      }
      break;
    }
    case 'transfer_selected_cards': {
      transferStructuredSelectedCards(s, ctx, effect);
      break;
    }
    case 'discard_all_hand': {
      const targetIds = structuredChoiceTargetPlayers(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured discard-all-hand has no authoritative target');
      for (const targetId of targetIds) {
        for (const held of s.cards.filter((entry) => entry.ownerPlayerId === targetId && entry.zone === 'hand')) moveCard(s, held.instanceId, 'discard');
      }
      break;
    }
    case 'lose_mana': {
      const amount = numeric(s, ctx, effect.amount);
      if (!Number.isSafeInteger(amount) || amount < 0) reject('resolution_failed', 'Structured mana loss must be a nonnegative safe integer');
      const targetIds = structuredChoiceTargetPlayers(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured mana loss has no authoritative target');
      for (const targetId of targetIds) { const target = player(s, targetId); target.mana = Math.max(0, target.mana - amount); }
      break;
    }
    case 'ensure_event_deck_count': {
      const count = numeric(s, ctx, effect.count);
      if (!Number.isSafeInteger(count) || count < 0) reject('resolution_failed', 'Structured event-deck count must be a nonnegative safe integer');
      const deck = s.eventDeck ??= [];
      if (deck.length < count && (s.eventDiscardPile?.length ?? 0) > 0) {
        const recycled = s.eventDiscardPile!.map((entry) => entry.eventCardId);
        s.eventDiscardPile = [];
        deck.push(...recycled);
        shuffleStructuredEventDeck(s);
      }
      if (deck.length < count) reject('no_legal_target', 'Structured event deck does not contain enough events after recycling discard');
      break;
    }
    case 'shuffle_event_deck': {
      shuffleStructuredEventDeck(s);
      break;
    }
    case 'swap_selected_event_locations': {
      const key = str(effect.payloadKey) || 'selectedEventIds';
      const selected = ctx.selections[key] ?? [];
      if (selected.length !== 2 || new Set(selected).size !== 2 || Object.keys(effect).some((field) => !['type','payloadKey'].includes(field))) {
        reject('invalid_target', 'Structured event swap requires exactly two distinct selected event tokens');
      }
      try { swapSelectedEventRuleLocations(s, runtime(s).pack, selected); }
      catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Structured event swap failed'); }
      break;
    }
    case 'replace_selected_event_from_deck': {
      const key = str(effect.payloadKey) || 'selectedEventIds';
      const selected = ctx.selections[key] ?? [];
      if (selected.length !== 1 || Object.keys(effect).some((field) => !['type','payloadKey'].includes(field))) {
        reject('invalid_target', 'Structured event replacement requires exactly one selected event token');
      }
      try { replaceSelectedEventRuleFromDeck(s, runtime(s).pack, selected[0]!); }
      catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Structured event replacement failed'); }
      break;
    }
    case 'move_selected_events': {
      const key = str(effect.payloadKey) || 'selectedEventIds';
      const selected = ctx.selections[key] ?? [];
      if (!selected.length || new Set(selected).size !== selected.length) reject('invalid_target', 'Structured event move selection is empty or duplicated');
      const destination = str(effect.destination);
      const zone: EventRuleZone = destination === 'discard' ? 'event_discard' :
        destination === 'outside_game' || destination === 'removed' || destination === 'removed_from_game' ? 'event_outside_game' :
        destination === 'deck' ? 'event_deck' : 'event_battlefield';
      if (!['discard', 'outside_game', 'removed', 'removed_from_game', 'deck', 'battlefield', 'current'].includes(destination)) reject('unsupported', 'Structured event move destination is unsupported');
      const locationId = effect.locationId === 'controller_location' ? player(s, ctx.controllerId).locationId : normalizeStructuredLocationId(effect.locationId);
      const visibility = effect.visibility === 'up' || effect.visibility === 'public' ? 'public' as const :
        effect.visibility === 'hidden_until_trigger' ? 'hidden_until_trigger' as const : undefined;
      if (zone === 'event_battlefield' && !locationId) reject('resolution_failed', 'Structured event battlefield move requires an authoritative location');
      try { moveEventRuleCandidates(s, runtime(s).pack, selected, zone, {
        ...(locationId ? { locationId } : {}), ...(visibility ? { visibility } : {}),
      }); }
      catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Structured event move failed'); }
      break;
    }
    case 'close_owned_active_cards_by_definition': {
      const sourceDefinitionId = card(s, ctx.sourceCardId).definitionId;
      const definitionId = effect.definitionId === 'self' ? sourceDefinitionId : str(effect.definitionId);
      if (!definitionId) reject('resolution_failed', 'Structured close-by-definition requires definitionId');
      let candidates = s.cards.filter((entry) => entry.ownerPlayerId === ctx.controllerId && entry.controllerPlayerId === ctx.controllerId &&
        entry.definitionId === definitionId && entry.zone === 'attack_area' && runtime(s).cardState[entry.instanceId]?.active === true &&
        runtime(s).cardState[entry.instanceId]?.faceDown !== true);
      if (effect.residualOnly === true) candidates = candidates.filter((entry) => { const d = definition(s, entry.instanceId); return !!d && isResidualAttackCardDefinition(d); });
      candidates.sort((a, b) => a.instanceId.localeCompare(b.instanceId));
      let count: number;
      if (effect.countFormula === 'half_up') count = Math.ceil(candidates.length / 2);
      else count = Number(effect.count ?? candidates.length);
      if (!Number.isSafeInteger(count) || count < 0 || count > candidates.length) reject('resolution_failed', 'Structured close-by-definition count is invalid');
      for (const target of candidates.slice(0, count)) closeStructuredSelectedCard(s, ctx, target.instanceId, { type: 'close_selected_card', zone: 'attack' });
      break;
    }
    case 'move_matching_events': {
      const sourceZone = str(effect.sourceZone);
      const zones: EventRuleZone[] = sourceZone === 'current' ? ['event_battlefield'] : sourceZone === 'deck' ? ['event_deck'] : sourceZone === 'discard' ? ['event_discard'] : [];
      if (!zones.length) reject('unsupported', 'Structured matching-event source zone is unsupported');
      const locationId = effect.locationId === 'controller_location' ? player(s, ctx.controllerId).locationId : normalizeStructuredLocationId(effect.locationId);
      const tokens = listEventRuleCandidates(s, runtime(s).pack, zones).filter((entry) => !locationId || entry.locationId === locationId).map((entry) => entry.token);
      if (!tokens.length) break;
      const destination = str(effect.destination);
      const targetZone: EventRuleZone = destination === 'removed' || destination === 'removed_from_game' || destination === 'outside_game' ? 'event_outside_game' :
        destination === 'discard' ? 'event_discard' : destination === 'deck' ? 'event_deck' : 'event_battlefield';
      if (!['removed', 'removed_from_game', 'outside_game', 'discard', 'deck', 'battlefield'].includes(destination)) reject('unsupported', 'Structured matching-event destination is unsupported');
      try { moveEventRuleCandidates(s, runtime(s).pack, tokens, targetZone); }
      catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Structured matching-event move failed'); }
      break;
    }
    case 'gain_current_battlefield_competition_reward': {
      const controller = player(s, ctx.controllerId); const locationId = controller.locationId;
      const location = locationId ? getEnabledLocations(s.map, s.locationConfig).find((entry) => entry.id === locationId) : undefined;
      const reward = location?.vpRewardRules?.competition;
      if (!location || !location.tags.includes('battlefield') || !location.rewardHooks.includes('competition_rewards') ||
          typeof reward !== 'number' || !Number.isSafeInteger(reward) || reward < 0) {
        reject('resolution_failed', 'Structured battlefield competition reward requires an enabled battlefield with an authoritative competition reward');
      }
      const before = controller.vp; const after = before + reward;
      if (!Number.isSafeInteger(after)) reject('invalid_state', 'Structured battlefield competition reward exceeds safe integer range');
      controller.vp = after; recordAuthoritativeVictoryPointChange(s, controller.id, before, after, 'structured-battlefield-competition-reward');
      break;
    }
    case 'lose_victory_points_per_matching_cards': {
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'all_players');
      const zone = normalizeStructuredZone(effect.zone ?? 'discard');
      const definitionIds = Array.isArray(effect.definitionIds) ? effect.definitionIds.map(str).filter(Boolean) : [];
      const uniqueDefinitionIds = new Set(definitionIds);
      const amountPerCard = numeric(s, ctx, effect.amountPerCard ?? 0);
      const maxAmount = Number(effect.maxAmount ?? Number.MAX_SAFE_INTEGER);
      if (zone !== 'discard' || !definitionIds.length || uniqueDefinitionIds.size !== definitionIds.length ||
          !Number.isSafeInteger(amountPerCard) || amountPerCard < 0 || !Number.isSafeInteger(maxAmount) || maxAmount < 0 ||
          Object.keys(effect).some((key) => !['type','target','zone','definitionIds','amountPerCard','maxAmount'].includes(key))) {
        reject('unsupported', 'Structured matching-card VP loss requires exact discard-zone shape');
      }
      for (const targetId of targetIds) {
        const target = player(s, targetId);
        const count = s.cards.filter((entry) => entry.ownerPlayerId === targetId && entry.zone === 'discard' && uniqueDefinitionIds.has(entry.definitionId)).length;
        const requested = Math.min(count * amountPerCard, maxAmount);
        if (!Number.isSafeInteger(requested)) reject('invalid_state', 'Structured matching-card VP loss exceeds safe integer range');
        const before = target.vp; const actual = Math.min(Math.max(0, before), requested); const after = before - actual;
        target.vp = after; recordAuthoritativeVictoryPointChange(s, targetId, before, after, 'structured-matching-card-vp-loss');
      }
      break;
    }
    case 'transfer_matching_cards': {
      const sourceIds = structuredTargetPlayerIds(s, ctx, effect.sourceTarget ?? 'all_players');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      const definitionIds = Array.isArray(effect.definitionIds) ? effect.definitionIds.map(str).filter(Boolean) : [];
      const uniqueDefinitionIds = new Set(definitionIds);
      if (targetIds.length !== 1 || normalizeStructuredZone(effect.zone ?? 'discard') !== 'discard' || effect.destination !== 'hand' ||
          !definitionIds.length || uniqueDefinitionIds.size !== definitionIds.length ||
          Object.keys(effect).some((key) => !['type','sourceTarget','target','zone','destination','definitionIds'].includes(key))) {
        reject('unsupported', 'Structured matching-card transfer requires exact discard-to-hand shape');
      }
      const recipientId = targetIds[0]!;
      const sourceSet = new Set(sourceIds);
      for (const entry of s.cards.filter((candidate) => sourceSet.has(candidate.ownerPlayerId) && candidate.zone === 'discard' && uniqueDefinitionIds.has(candidate.definitionId))) {
        entry.ownerPlayerId = recipientId; entry.controllerPlayerId = recipientId; entry.zone = 'hand';
        entry.visibility = { scope: 'owner_only', ownerPlayerId: recipientId };
        const cardState = r.cardState[entry.instanceId] ??= { active: false, faceDown: true, playedRound: s.round.roundNumber };
        cardState.active = false; cardState.faceDown = true;
      }
      break;
    }
    case 'gain_victory_points': {
      const amount = numeric(s, ctx, effect.amount);
      if (!Number.isSafeInteger(amount) || amount < 0) reject('resolution_failed', 'Structured VP gain must be a nonnegative safe integer');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured VP gain has no authoritative target');
      for (const targetId of targetIds) {
        const target = player(s, targetId); const before = target.vp; const after = before + amount;
        if (!Number.isSafeInteger(after)) reject('invalid_state', 'Structured VP gain would exceed safe integer range');
        target.vp = after; recordAuthoritativeVictoryPointChange(s, targetId, before, after, 'structured-skill-vp');
      }
      break;
    }
    case 'pay_victory_points': {
      const amount = numeric(s, ctx, effect.amount);
      if (!Number.isSafeInteger(amount) || amount < 0) reject('resolution_failed', 'Structured VP payment must be a nonnegative safe integer');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured VP payment has no authoritative target');
      const targets = targetIds.map((targetId) => player(s, targetId));
      if (targets.some((target) => !Number.isSafeInteger(target.vp) || target.vp < amount)) reject('insufficient_victory_points', 'Cannot pay victory points');
      for (const target of targets) {
        const before = target.vp; const after = before - amount;
        target.vp = after; recordAuthoritativeVictoryPointChange(s, target.id, before, after, 'structured-skill-vp-payment');
      }
      break;
    }
    case 'gain_victory_points_per_target': {
      const amountPerTarget = numeric(s, ctx, effect.amountPerTarget ?? 1);
      if (!Number.isSafeInteger(amountPerTarget) || amountPerTarget < 0) reject('resolution_failed', 'Structured per-target VP amount must be a nonnegative safe integer');
      const counted = structuredCountTargetPlayerIds(s, ctx, effect.countTarget);
      const amount = counted.length * amountPerTarget;
      if (!Number.isSafeInteger(amount)) reject('resolution_failed', 'Structured per-target VP total exceeds safe integer range');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured per-target VP gain has no authoritative recipient');
      for (const targetId of targetIds) {
        const target = player(s, targetId); const before = target.vp; const after = before + amount;
        if (!Number.isSafeInteger(after)) reject('invalid_state', 'Structured per-target VP gain would exceed safe integer range');
        target.vp = after; recordAuthoritativeVictoryPointChange(s, targetId, before, after, 'structured-skill-vp-per-target');
      }
      break;
    }
    case 'lose_victory_points': {
      const amount = numeric(s, ctx, effect.amount);
      if (!Number.isSafeInteger(amount) || amount < 0) reject('resolution_failed', 'Structured VP loss must be a nonnegative safe integer');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured VP loss has no authoritative target');
      for (const targetId of targetIds) {
        const target = player(s, targetId); const before = target.vp; const after = Math.max(0, before - amount);
        target.vp = after; recordAuthoritativeVictoryPointChange(s, targetId, before, after, 'structured-skill-vp-loss');
      }
      break;
    }
    case 'if_condition': {
      const conditions = nodes(effect.conditions);
      if (!conditions.length) reject('resolution_failed', 'Structured conditional effect requires conditions');
      const matched = conditions.every((entry) => condition(s, ctx, entry));
      const nested = nodes(matched ? effect.then : effect.else);
      for (const entry of nested) resolveEffect(s, ctx, entry);
      break;
    }
    case 'defeat_player': {
      if (isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility(a, 'compiled')) {
        const targetIds = payableEffectDefeatTargets(s, ctx.controllerId, structuredChoiceTargetPlayers(s, ctx, effect.target));
        const defeatRounds = r.structuredDefeatRoundByPlayer ??= {};
        for (const targetId of targetIds) defeatRounds[targetId] = s.round.roundNumber;
      } else if (isAcceptedM50RatioFilteredDefeatAbility(a)) {
        const targetIds = payableEffectDefeatTargets(s, ctx.controllerId, structuredChoiceTargetPlayers(s, ctx, effect.target));
        const defeatRounds = r.structuredDefeatRoundByPlayer ??= {};
        for (const targetId of targetIds) defeatRounds[targetId] = s.round.roundNumber;
      } else if (isGenericScheduledSelfDefeat(a) || isGenericScheduledRankedSelfDefeatSequence(a)) {
        const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
        if (targetIds.length !== 1 || targetIds[0] !== ctx.controllerId) reject('resolution_failed', 'Scheduled self-defeat requires exact controller target');
        (r.structuredDefeatRoundByPlayer ??= {})[ctx.controllerId] = s.round.roundNumber;
      } else if (isAcceptedCommandSealLossConditionalDefeatAbility(a)) {
        const selectedTargetIds = structuredTargetPlayerIds(s, ctx, effect.target);
        if (selectedTargetIds.length !== 1) reject('resolution_failed', 'Command-seal conditional defeat requires exactly one authoritative selected target');
        const targetIds = payableEffectDefeatTargets(s, ctx.controllerId, selectedTargetIds);
        if (targetIds.length === 1) (r.structuredDefeatRoundByPlayer ??= {})[targetIds[0]!] = s.round.roundNumber;
      } else if (isAcceptedDeploymentLocationOpponentDefeatAbility(a, 'compiled')) {
        stageDeploymentLocationOpponentDefeat(s, ctx, a);
      } else if (isAcceptedSelectedSameBattlefieldDefeatAbility(a, 'compiled') || isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(a, 'compiled') || isAcceptedStructuredChosenOpponentDefeatAbility(a, 'compiled')) {
        stageSelectedSameBattlefieldDefeat(s, ctx, a);
      } else stagePreBattleDefeat(s, ctx, a);
      break;
    }
    case 'defeat_highest_power_opponents': {
      if (!isPresenceConcealmentAssassinationSemantic(a)) reject('resolution_failed', 'Unsupported Presence Concealment semantic shape');
      const event = ctx.event;
      const snapshot = trustedBattlePowerSnapshot(event);
      if (!event || event.type !== 'after_battle_power_calculated' || !event.resultId || !event.battlefieldId || !snapshot) {
        reject('invalid_event', 'Presence Concealment requires trusted pre-scoring battle identity and Power facts');
      }
      const rawTargetPlayerIds = highestPowerOpponents(event, ctx.controllerId);
      const pending = r.pendingPresenceConcealmentDefeats ??= [];
      if (!pending.some((entry) => entry.triggerEventId === event.id && entry.sourceCardId === ctx.sourceCardId && entry.abilityId === ctx.abilityId)) {
        const targetPlayerIds = payableEffectDefeatTargets(s, ctx.controllerId, rawTargetPlayerIds);
        if (!targetPlayerIds.length) break;
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
      const before = p.vp;
      p.vp = Math.max(0, p.vp + total);
      recordAuthoritativeVictoryPointChange(s, p.id, before, p.vp, 'event-claim-vp');
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
    case 'return_card_by_definition': {
      if (isControllerExistingServantSkillDefinitionReturnComponent(effect)) resolveControllerExistingServantSkillDefinitionReturn(s, ctx, effect);
      else if (isControllerOwnedLinkedSkillAttackReturnComponent(effect)) resolveControllerOwnedLinkedSkillAttackReturn(s, ctx, effect);
      else resolveControllerMasterSkillDefinitionReturn(s, ctx, effect);
      break;
    }
    case 'return_cards_by_definitions': {
      resolveControllerExistingCardsByDefinitionsReturn(s, ctx, effect);
      break;
    }
    case SET_SELECTED_CARD_FACE_DOWN_EFFECT: {
      const accepted = isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled');
      const selected = ctx.selections['opponent_servant_skill'] ?? [];
      if (!accepted || effect.target !== 'opponent_servant_skill' || Object.keys(effect).some((key) => !['type', 'target'].includes(key)) ||
          selected.length !== 1 || new Set(selected).size !== 1) {
        reject('resolution_failed', 'Unsupported selected opponent servant-skill face-down effect');
      }
      const target = card(s, selected[0]!);
      if (!constraint(s, ctx, target, { type: SAME_LOCATION_OPPONENT_FACE_UP_SERVANT_SKILL_CONSTRAINT })) {
        reject('illegal_target', 'Selected opponent servant skill is no longer a legal face-down target');
      }
      const state = runtime(s).cardState[target.instanceId];
      if (!state) reject('invalid_state', 'Selected opponent servant skill is missing runtime card state');
      state.faceDown = true; state.active = false;
      target.visibility = { scope: 'owner_only', ownerPlayerId: target.ownerPlayerId };
      runtime(s).events.push({
        type: 'card_set_face_down', playerId: target.controllerPlayerId, controllerId: ctx.controllerId,
        sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, cardInstanceId: target.instanceId,
      });
      break;
    }
    case B03_SCHEDULE_EFFECT: {
      if (isAcceptedB03ModifierLifecycleAbility(a) && isB03ModifierLifecycleCandidate(a)) {
        armB03NextRoundCardPowerSchedule(s, ctx.sourceCardId, ctx.controllerId, a, effect);
      } else {
        armGenericStructuredSchedule(s, ctx, effect);
      }
      break;
    }
    case B04_FIRST_MOVEMENT_SOURCE_POWER_EFFECT: {
      if (!isAcceptedB04FirstMovementSourcePowerAbility(a) || Object.keys(effect).some((key) => key !== 'type')) reject('resolution_failed', 'Unsupported F4 B04 first-movement source-power envelope');
      try { installB04FirstMovementSourcePower(s, ctx.controllerId, ctx.sourceCardId, a, ctx.event); } catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B04 first-movement source-power install failed'); }
      break;
    }
    case B04_ROUND_DOUBLE_EFFECT: {
      if (!isAcceptedB04SourcePlayRoundDoubleAbility(a) || effect.amount !== 'printed_base_power' || Object.keys(effect).some((key) => !['type', 'amount'].includes(key))) reject('resolution_failed', 'Unsupported F4 B04 round-double envelope');
      try { installB04RoundDouble(s, ctx.controllerId, ctx.sourceCardId, a, ctx.event); } catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B04 round-double install failed'); }
      break;
    }
    case B04_EVENT_PLAYER_MANA_EFFECT: {
      if (!isAcceptedB04OpponentEntryManaDrainAbility(a) || effect.amount !== -2 || Object.keys(effect).some((key) => !['type', 'amount'].includes(key))) reject('resolution_failed', 'Unsupported F4 B04 event-player mana envelope');
      const affectedId = b04TrustedOpponentEntry(s, ctx.controllerId, a, ctx.event);
      if (!affectedId) reject('resolution_failed', 'F4 B04 opponent entry lacks authoritative provenance');
      const affected = player(s, affectedId); affected.mana = Math.max(0, affected.mana - 2);
      break;
    }
    case B04_SAME_LOCATION_MANA_EFFECT: {
      if (!isAcceptedB04ControllerDefeatManaReleaseAbility(a) || effect.amount !== 3 || Object.keys(effect).some((key) => !['type', 'amount'].includes(key)) || !b04TrustedControllerDefeat(s, ctx.controllerId, a, ctx.event)) {
        reject('resolution_failed', 'F4 B04 defeat release lacks authoritative provenance');
      }
      for (const playerId of b04SameLocationDefeatPlayerIds(s, ctx.controllerId, a, ctx.event)) grantMana(s, playerId, 3, { source: 'generic' });
      break;
    }
    case B05_DEPLOYMENT_RESOURCE_EXCHANGE_EFFECT: {
      if (!isAcceptedB05WorkshopDeploymentExchangeAbility(a) || Object.keys(effect).some((key) => key !== 'type')) reject('resolution_failed', 'Unsupported F4 B05 deployment-resource envelope');
      let affectedId: string | undefined;
      try { affectedId = b05WorkshopDeploymentTarget(s, ctx.controllerId, a, ctx.event); }
      catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B05 deployment provenance invalid'); }
      if (!affectedId) reject('resolution_failed', 'F4 B05 deployment exchange lacks authoritative provenance');
      grantMana(s, affectedId, 1, { source: 'generic' });
      if (!Number.isSafeInteger(p.vp) || p.vp < 0 || !Number.isSafeInteger(p.mana) || p.mana < 0) reject('invalid_state', 'F4 B05 controller resources must be nonnegative safe integers');
      const vpBefore = p.vp; const vpAfter = vpBefore + 2;
      if (!Number.isSafeInteger(vpAfter)) reject('invalid_state', 'F4 B05 controller VP reward would exceed safe integer range');
      p.vp = vpAfter; recordAuthoritativeVictoryPointChange(s, p.id, vpBefore, vpAfter, 'b05-deployment-vp');
      p.mana = Math.max(0, p.mana - 3);
      break;
    }
    case B05_TRANSFER_VP_ARM_ROUND_CLOSE_EFFECT: {
      if (!isAcceptedB05OtherBattlefieldVpTransferAbility(a) || effect.amount !== 1 || Object.keys(effect).some((key) => !['type', 'amount'].includes(key))) reject('resolution_failed', 'Unsupported F4 B05 VP-transfer envelope');
      let affectedId: string | undefined;
      try { affectedId = b05OtherBattlefieldEntryTarget(s, ctx.controllerId, a, ctx.event); }
      catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B05 entry provenance invalid'); }
      if (!affectedId) reject('resolution_failed', 'F4 B05 VP transfer lacks authoritative entry provenance');
      const affected = player(s, affectedId);
      if (![affected.vp, p.vp].every((value) => Number.isSafeInteger(value) && value >= 0)) reject('invalid_state', 'F4 B05 VP balances must be nonnegative safe integers');
      const actual = Math.min(1, affected.vp);
      if (actual > 0) {
        const fromBefore = affected.vp; const toBefore = p.vp; const toAfter = toBefore + actual;
        if (!Number.isSafeInteger(toAfter)) reject('invalid_state', 'F4 B05 VP transfer would exceed safe integer range');
        affected.vp = fromBefore - actual; p.vp = toAfter;
        recordAuthoritativeVictoryPointChange(s, affected.id, fromBefore, affected.vp, 'b05-transfer-vp-out');
        recordAuthoritativeVictoryPointChange(s, p.id, toBefore, p.vp, 'b05-transfer-vp-in');
      }
      try { armB05RoundClose(s, ctx.controllerId, ctx.sourceCardId, a, ctx.event); }
      catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B05 round-close arm failed'); }
      break;
    }
    case B05_CLOSE_TRIGGERED_SOURCE_EFFECT: {
      if (!isAcceptedB05RoundEndCloseAbility(a) || Object.keys(effect).some((key) => key !== 'type')) reject('resolution_failed', 'Unsupported F4 B05 triggered-close envelope');
      try {
        if (!b05SourceTriggeredThisRound(s, ctx.controllerId, ctx.sourceCardId, a)) reject('resolution_failed', 'F4 B05 source was not armed this round');
        if (isCardCloseForbidden(s, ctx.sourceCardId)) reject('resolution_failed', 'Close source card is forbidden by a live rule modifier.');
        resolveExtendedEffect(s, ctx.controllerId, { type: 'close_source_card' }, { sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, selections: ctx.selections, ...(ctx.event ? { event: ctx.event } : {}) });
        consumeB05RoundCloseArm(s, ctx.controllerId, ctx.sourceCardId, a);
      } catch (error) {
        if (error instanceof RuleRejection) throw error;
        reject('invalid_state', error instanceof Error ? error.message : 'F4 B05 triggered close failed');
      }
      break;
    }
    case B06_ARM_ROUND_PUNISHMENT_EFFECT: {
      if (!isAcceptedB06RoundArmAbility(a) || Object.keys(effect).some((key) => key !== 'type')) reject('resolution_failed', 'Unsupported F4 B06 round-arm envelope');
      try { armB06RoundPunishment(s, ctx.controllerId, ctx.sourceCardId, a, ctx.event); }
      catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B06 round arm failed'); }
      break;
    }
    case B06_EVENT_BURST_EFFECT: {
      if (!isAcceptedB06EventBurstAbility(a) || Object.keys(effect).some((key) => key !== 'type')) reject('resolution_failed', 'Unsupported F4 B06 event-burst envelope');
      try { installB06EventBurst(s, ctx.controllerId, ctx.sourceCardId, a, ctx.event); }
      catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B06 event burst failed'); }
      break;
    }
    case B06_PUNISH_BATTLE_LOSERS_EFFECT: {
      if (!isAcceptedB06BattlePunishAbility(a) || Object.keys(effect).some((key) => key !== 'type')) reject('resolution_failed', 'Unsupported F4 B06 battle-punishment envelope');
      let facts: ReturnType<typeof b06BattleLoserPenaltyFacts>;
      try { facts = b06BattleLoserPenaltyFacts(s, ctx.controllerId, ctx.sourceCardId, a, ctx.event); }
      catch (error) { reject('invalid_state', error instanceof Error ? error.message : 'F4 B06 battle-punishment provenance invalid'); }
      for (const playerId of facts.loserIds) {
        const target = player(s, playerId);
        if (!Number.isSafeInteger(target.vp) || target.vp < 0) reject('invalid_state', 'F4 B06 loser VP must be a nonnegative safe integer');
        const before = target.vp; const after = Math.max(0, before - facts.amount);
        if (after !== before) { target.vp = after; recordAuthoritativeVictoryPointChange(s, target.id, before, after, 'b06-battle-event-vp-penalty'); }
      }
      break;
    }
    case SOURCE_CARD_COMBAT_POWER_BONUS_EFFECT: {
      if (classifyAcceptedEventPowerUncontestedWinRewardAbility(a, 'compiled') !== 'opponent_entry_power' ||
          effect.amount !== 2 || Object.keys(effect).some((key) => !['type', 'amount'].includes(key)) ||
          !fb254EntryEventMatches(s, ctx, a)) {
        reject('resolution_failed', 'FB2-54 source-card combat-power bonus requires exact accepted event provenance');
      }
      const source = card(s, ctx.sourceCardId);
      const r = runtime(s);
      const trusted = r.trustedEntryEventSnapshots?.[ctx.event!.id];
      if (!trusted) reject('resolution_failed', 'FB2-54 trusted qualifying entry provenance disappeared before install');
      const ongoingId = fb254SourcePowerOngoingId(ctx.event!.id, source.instanceId, a.id);
      const receipts = r.fb254SourcePowerInstallReceipts ??= {};
      if (receipts[ongoingId]) reject('invalid_state', 'FB2-54 trusted entry root install receipt collision');
      receipts[ongoingId] = {
        ongoingId, rootEventId: ctx.event!.id, eventType: trusted.type, eventPlayerId: trusted.playerId, eventLocationId: trusted.locationId,
        sourceCardId: source.instanceId, sourceDefinitionId: source.definitionId, abilityId: a.id, controllerId: ctx.controllerId, installedRevision: r.revision,
      };
      r.ongoingEffects.push({
        id: ongoingId,
        sourceCardId: source.instanceId, abilityId: a.id, controllerId: ctx.controllerId,
        starts: 'immediate', duration: 'while_active', startRound: s.round.roundNumber, cleanup: 'remain_active',
        sourceMustRemainActive: true, policyKey: EVENT_POWER_SOURCE_BONUS_POLICY,
        sourceDefinitionIdAtInstall: source.definitionId, installedRevision: r.revision,
        fb254EntryRootEventId: ctx.event!.id,
        ruleModifiers: [{
          sourceCardId: source.instanceId, controllerId: ctx.controllerId,
          definition: { id: EVENT_POWER_SOURCE_BONUS_POLICY, operation: 'add', rule: 'card.currentPower', scope: { object: 'source_card' }, value: 2 },
        }],
        publicZones: [],
      });
      break;
    }
    case NEXT_ROUND_SITUATION_BENEFIT_SUPPRESSION_EFFECT: {
      if (!isAcceptedNextRoundSituationBenefitSuppressionAbility(a, 'compiled')) {
        reject('resolution_failed', 'Suppression effect requires the exact accepted FB2-52 whole-ability envelope');
      }
      try {
        applyNextRoundSituationBenefitSuppression(s, ctx.controllerId);
      } catch (error) {
        reject('invalid_state', error instanceof Error ? error.message : 'Next-round situation-benefit suppression failed');
      }
      break;
    }
    case M50_DRAW_AND_PLAY_FACE_DOWN: {
      if (!isAcceptedM50DrawAndPlayFaceDownAttackAbility(a) || effect.target !== 'controller' || effect.count !== 2 ||
          Object.keys(effect).some((key) => !['type','target','count'].includes(key))) {
        reject('unsupported', 'Draw-and-play face-down attacks requires the exact accepted M50 ability');
      }
      const targetId = ctx.controllerId;
      if (structuredCardDrawForbidden(s, targetId)) break;
      const playedIds: string[] = [];
      for (let index = 0; index < 2; index += 1) {
        if (!s.cards.some((candidate) => candidate.ownerPlayerId === targetId && candidate.zone === 'deck')) {
          s.cards.filter((candidate) => candidate.ownerPlayerId === targetId && candidate.zone === 'discard')
            .forEach((candidate) => moveCard(s, candidate.instanceId, 'deck'));
          shuffle(s, targetId);
        }
        const top = s.cards.find((candidate) => candidate.ownerPlayerId === targetId && candidate.zone === 'deck');
        if (!top) break;
        if (!definition(s, top.instanceId)) reject('invalid_state', 'Draw-and-play card has no executable definition');
        moveCard(s, top.instanceId, 'attack_area');
        runtime(s).cardState[top.instanceId] = { active: false, faceDown: true, playedRound: s.round.roundNumber, paidManaOnPlay: 0 };
        top.visibility = { scope: 'owner_only', ownerPlayerId: top.ownerPlayerId };
        playedIds.push(top.instanceId);
        const playedCards = [{ instanceId: top.instanceId, controllerId: targetId, cardType: definition(s, top.instanceId)!.cardType, faceDown: true }];
        processTrustedCardPlayEvent(s, { id: nextId(s, 'play'), type: 'on_card_played', playerId: targetId, sourceCardId: top.instanceId, playedCards });
      }
      const counters = runtime(s).playCounters;
      if (counters.round !== s.round.roundNumber) reject('invalid_state', 'Play counters are stale during draw-and-play resolution');
      counters.cardsPlayedByPlayer[targetId] = (counters.cardsPlayedByPlayer[targetId] ?? 0) + playedIds.length;
      break;
    }
    case M50_CLOSE_SELECTED_FACE_DOWN_ATTACKS: {
      if (!isAcceptedM50FaceDownAttackCloseAbility(a) || effect.target !== 'face_down_attacks' ||
          Object.keys(effect).some((key) => !['type','target'].includes(key))) {
        reject('unsupported', 'Face-down attack close requires the exact accepted M50 round-end response');
      }
      const selected = ctx.selections.face_down_attacks ?? [];
      if (selected.length < 1 || selected.length > 50 || new Set(selected).size !== selected.length) {
        reject('invalid_target', 'Face-down attack close requires a nonempty distinct selection');
      }
      for (const instanceId of selected) {
        const target = card(s, instanceId); const targetDefinition = definition(s, instanceId); const targetState = runtime(s).cardState[instanceId];
        if (target.ownerPlayerId !== ctx.controllerId || target.controllerPlayerId !== ctx.controllerId || target.zone !== 'attack_area' ||
            !targetDefinition || !isAttack(targetDefinition) || targetState?.faceDown !== true || targetState.active === true) {
          reject('invalid_target', 'Selected face-down attack can no longer be closed');
        }
      }
      for (const instanceId of selected) {
        moveCard(s, instanceId, 'discard');
        const targetState = runtime(s).cardState[instanceId];
        if (targetState) { targetState.active = false; targetState.faceDown = false; }
      }
      break;
    }
    case 'draw_cards': {
      const count = numeric(s, ctx, effect.count ?? effect.amount);
      if (!Number.isSafeInteger(count) || count < 0) reject('invalid_count', 'Invalid draw count');
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target);
      if (!targetIds.length) reject('resolution_failed', 'Structured draw has no authoritative target');
      const destination = normalizeStructuredZone(effect.destination) || 'hand';
      if (!['hand', 'attack_area'].includes(destination)) reject('unsupported', 'Structured draw destination is unsupported');
      if (destination === 'attack_area' && (effect.face !== 'down' || effect.active !== false)) {
        reject('unsupported', 'Structured attack-area draw requires exact face-down inactive shape');
      }
      for (const targetId of targetIds) {
        if (structuredCardDrawForbidden(s, targetId)) continue;
        for (let i = 0; i < count; i++) {
          if (!s.cards.some(c => c.ownerPlayerId === targetId && c.zone === 'deck')) {
            s.cards.filter(c => c.ownerPlayerId === targetId && c.zone === 'discard').forEach(c => moveCard(s, c.instanceId, 'deck'));
            shuffle(s, targetId);
          }
          const top = s.cards.find(c => c.ownerPlayerId === targetId && c.zone === 'deck');
          if (!top) break;
          moveCard(s, top.instanceId, destination);
          if (destination === 'attack_area') {
            runtime(s).cardState[top.instanceId] = { active: false, faceDown: true, playedRound: s.round.roundNumber };
            top.visibility = { scope: 'owner_only', ownerPlayerId: top.ownerPlayerId };
          }
        }
      }
      break;
    }
    case 'play_selected_cards': {
      const payloadKey = str(effect.payloadKey);
      const selectionKey = payloadKey || str(effect.target);
      if (!selectionKey) reject('resolution_failed', 'Structured effect play requires a target or payload key');
      const selected = ctx.selections[selectionKey] ?? [];
      if (payloadKey) {
        const producer = a.effects.find(candidate => candidate.type === 'choose_cards' && str(candidate.payloadKey) === payloadKey);
        if (!producer || (effect.target !== undefined && !['controller', 'self'].includes(str(effect.target)))) {
          reject('resolution_failed', 'Structured payload effect play is not bound to an authoritative card choice');
        }
        if (selected.length === 0) {
          const producerMin = Number(producer.minCount ?? (producer.allowCancel === true ? 0 : 1));
          if (!(producer.skipIfNoCandidates === true || producerMin === 0)) reject('invalid_target', 'Structured effect play requires at least one selected card');
          break;
        }
        const rawSourceZones = Array.isArray(effect.sourceZones) ? effect.sourceZones : effect.sourceZone ? [effect.sourceZone] :
          Array.isArray(producer.zones) ? producer.zones : producer.zone ? [producer.zone] : ['hand'];
        const sourceZones = [...new Set(rawSourceZones.map(normalizeStructuredZone).filter(Boolean))];
        if (!sourceZones.length || sourceZones.some(zone => !['hand', 'skill', 'deck', 'discard'].includes(zone))) {
          reject('unsupported', 'Structured effect play source zone is unsupported');
        }
        const fixedCount = effect.count === undefined ? undefined : Number(effect.count);
        const min = fixedCount ?? Number(effect.minCount ?? producer.minCount ?? 0);
        const maxRaw = effect.maxCount ?? producer.maxCount ?? fixedCount ?? selected.length;
        const max = maxRaw === 'all' ? selected.length : Number(maxRaw);
        if (!Number.isSafeInteger(min) || min < 0 || !Number.isSafeInteger(max) || max < min || selected.length < min || selected.length > max) {
          reject('invalid_target', 'Structured effect play selection count is outside the declared bounds');
        }
        if (new Set(selected).size !== selected.length || selected.some(instanceId => {
          const chosen = s.cards.find(candidate => candidate.instanceId === instanceId);
          return !chosen || chosen.controllerPlayerId !== p.id || !sourceZones.includes(chosen.zone);
        })) reject('invalid_target', 'Structured effect play selection is stale or outside its authoritative source zone');
        playBatch(s, p.id, selected.map(cardInstanceId =>
          ({ type: 'play_card', cardInstanceId, ...(effect.face === 'face_down' ? { faceDown: true } : {}) })),
          'effect', effect.payCost === false, sourceZones);
        break;
      }
      playBatch(s, p.id, selected.map(cardInstanceId =>
        ({ type: 'play_card', cardInstanceId, ...(effect.face === 'face_down' ? { faceDown: true } : {}) })), 'effect');
      break;
    }
    case 'play_source_card': {
      if (isAcceptedM50FreeSourceCardCombatPlayAbility(a)) {
        if (effect.face !== 'face_up') reject('unsupported', 'Granted combat hand-play requires face-up play');
        playBatch(s, p.id, [{ type: 'play_card', cardInstanceId: ctx.sourceCardId }], 'effect', false, ['hand'], true);
        break;
      }
      const source = card(s, ctx.sourceCardId);
      if (source.controllerPlayerId !== p.id || source.zone !== 'hand') reject('illegal_action', 'Source card is not playable from hand');
      if (isRequiredAdditionalPlayCard(s, ctx.sourceCardId)) reject('append_only', 'Required additional-play cards are not effect-playable');
      if (effect.face !== 'face_down' && faceUpCardPlayLimitReached(s, p.id)) reject('face_up_card_play_limit_reached', 'Face-up card play limit reached for this round');
      moveCard(s, ctx.sourceCardId, cardPlayClassification(s, ctx.sourceCardId).destinationZone);
      r.cardState[ctx.sourceCardId] = { active: effect.face === 'face_down' ? false : true, faceDown: effect.face === 'face_down', playedRound: s.round.roundNumber };
      if (effect.face === 'face_down') source.visibility = { scope: 'owner_only', ownerPlayerId: p.id };
      else recordCompletedFaceUpCardPlay(s, p.id);
      processEvent(s, { id: nextId(s, 'declare'), type: 'on_use_declared', playerId: p.id, sourceCardId: ctx.sourceCardId, playedCards: [{ instanceId: ctx.sourceCardId, controllerId: p.id, cardType: definition(s, ctx.sourceCardId)!.cardType, faceDown: effect.face === 'face_down' }] });
      processTrustedCardPlayEvent(s, { id: nextId(s, 'play'), type: 'on_card_played', playerId: p.id, sourceCardId: ctx.sourceCardId, playedCards: [{ instanceId: ctx.sourceCardId, controllerId: p.id, cardType: definition(s, ctx.sourceCardId)!.cardType, faceDown: effect.face === 'face_down' }] });
      break;
    }
    case 'reveal_information': if (effect.scope !== 'servant_package') reject('unsupported', 'Unknown reveal scope'); reveal(s, p.id); break;
    case 'hide_servant_true_name': {
      const keys = Object.keys(effect).sort();
      const exactControllerTarget = effect.target === 'controller' && JSON.stringify(keys) === JSON.stringify(['target', 'type']);
      const exactLegacyImmediate = effect.target === undefined && JSON.stringify(keys) === JSON.stringify(['type']);
      const exactLegacyRound = effect.target === undefined && effect.duration === 'until_round_end' && JSON.stringify(keys) === JSON.stringify(['duration', 'type']);
      if (!exactControllerTarget && !exactLegacyImmediate && !exactLegacyRound) {
        reject('unsupported', 'Servant true-name hide requires an accepted exact shape');
      }
      const index = r.revealedServants.indexOf(p.id);
      if (index >= 0) {
        r.revealedServants.splice(index, 1);
        r.events.push({ type: 'servant_package_hidden', playerId: p.id });
      }
      break;
    }
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
    case 'move_selected_cards': {
      const key = str(effect.payloadKey) || 'selectedInstanceIds';
      const selected = ctx.selections[key] ?? [];
      const count = Number(effect.count ?? selected.length);
      if (!Number.isSafeInteger(count) || count < 0 || selected.length < count) reject('invalid_target', 'Structured selected-card move count is invalid');
      const destination = normalizeStructuredZone(effect.destination);
      if (!destination) reject('resolution_failed', 'Structured selected-card move requires destination');
      for (const instanceId of selected.slice(0, count)) moveCard(s, instanceId, destination);
      if (destination === 'deck' && effect.position === 'shuffle') shuffle(s, ctx.controllerId);
      break;
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
    case 'lose_command_seals': {
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      const amount = numeric(s, ctx, effect.amount ?? 1);
      if (!targetIds.length || !Number.isSafeInteger(amount) || amount < 0 || Object.keys(effect).some((key) => !['type', 'target', 'amount', 'then'].includes(key))) reject('resolution_failed', 'Command-seal loss shape is invalid');
      const losses: Record<PlayerId, { before: number; lost: number }> = {};
      for (const id of targetIds) {
        const targetPlayer = player(s, id); const before = commandSealCount(s, id); const lost = Math.min(before, amount); const after = Math.max(0, before - amount);
        (targetPlayer as unknown as { commandSpells: number }).commandSpells = after;
        losses[id] = { before, lost };
        if (before > 0 && after === 0) processEvent(s, { id: nextId(s, 'empty-seals'), type: 'after_controller_loses_all_command_seals', playerId: id });
      }
      const nestedCtx: EffectContext = { ...ctx, commandSealLosses: losses };
      for (const nested of nodes(effect.then)) resolveEffect(s, nestedCtx, nested);
      break;
    }
    case 'pay_command_seals': {
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      const amount = numeric(s, ctx, effect.amount ?? 1);
      if (!targetIds.length || !Number.isSafeInteger(amount) || amount < 0 || Object.keys(effect).some((key) => !['type', 'target', 'amount'].includes(key))) reject('resolution_failed', 'Command-seal payment shape is invalid');
      for (const id of targetIds) if (commandSealCount(s, id) < amount) reject('insufficient_command_seals', 'Cannot pay command seals');
      for (const id of targetIds) {
        const targetPlayer = player(s, id); const before = commandSealCount(s, id); const after = before - amount;
        (targetPlayer as unknown as { commandSpells: number }).commandSpells = after;
        markCommandSealSpendRound(s, id, 'pay_command_seals', before, after);
        if (before > 0 && after === 0) processEvent(s, { id: nextId(s, 'empty-seals'), type: 'after_controller_loses_all_command_seals', playerId: id });
      }
      break;
    }
    case 'adjust_command_seals': {
      const current = Number((p as unknown as { commandSpells?: number }).commandSpells ?? 3);
      const amount = numeric(s, ctx, effect.amount);
      const next = Math.max(0, current + amount);
      const directive = str(effect.directive) || 'adjust_command_seals';
      (p as unknown as { commandSpells: number }).commandSpells = next;
      markCommandSealSpendRound(s, p.id, directive, current, next);
      pushModeDirective(s, {
        controllerId: p.id,
        directive,
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
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      if (targetIds.length !== 1) reject('resolution_failed', 'Mana payment requires exactly one authoritative target');
      const payer = player(s, targetIds[0]!);
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > payer.mana) reject('insufficient_mana', 'Cannot pay mana');
      if (amount > 0 && m50ManaSpendingForbidden(s, payer.id)) reject('mana_spending_forbidden', 'Mana spending is forbidden this round');
      payer.mana -= amount;
      if (amount > 0) recordAuthoritativeManaSpend(s, payer.id, amount);
      break;
    }
    case 'adjust_victory_points': {
      const before = p.vp;
      p.vp = Math.max(0, p.vp + numeric(s, ctx, effect.amount));
      recordAuthoritativeVictoryPointChange(s, p.id, before, p.vp, 'ability-vp');
      break;
    }
    case 'claim_all_location_advantages': {
      const targetIds = structuredTargetPlayerIds(s, ctx, effect.target ?? 'controller');
      if (targetIds.length !== 1) reject('resolution_failed', 'Structured claim-all-advantages requires exactly one target player');
      const target = player(s, targetIds[0]!);
      const locationId = normalizeStructuredLocationId(effect.locationId) || target.locationId;
      const location = locationId ? getEnabledLocations(s.map, s.locationConfig).find((candidate) => candidate.id === locationId) : undefined;
      if (!location || !location.tags.includes('battlefield') || !location.terrainBonuses?.length || target.locationId !== locationId) {
        reject('resolution_failed', 'Structured claim-all-advantages requires target at an enabled battlefield with terrain slots');
      }
      const host = s as unknown as { modeState?: Record<string, unknown> }; host.modeState ??= {};
      const assignments = (host.modeState.terrainAssignments ??= {}) as Partial<Record<LocationId, string[]>>;
      assignments[locationId as LocationId] = Array(location.terrainBonuses.length).fill(target.id);
      break;
    }
    case 'move_player': {
      if (effect.movementKind === 'effect') {
        if (effect.target !== 'decision_player' || effect.to !== 'controller_location' ||
            Object.keys(effect).some((key) => !['type', 'target', 'to', 'movementKind'].includes(key))) {
          reject('unsupported', 'Structured effect movement requires exact decision-player/controller-location shape');
        }
        const targetIds = structuredTargetPlayerIds(s, ctx, 'decision_player');
        const destination = player(s, ctx.controllerId).locationId;
        if (targetIds.length !== 1 || !destination) reject('invalid_target', 'Structured effect movement target or destination is unavailable');
        const target = player(s, targetIds[0]!);
        const from = target.locationId;
        if (!from || from === destination) reject('invalid_target', 'Structured effect movement requires a different current location');
        const moved = movePlayerCore(s, { playerId: target.id, to: destination, movementKind: 'effect', ignorePathForEffect: true });
        if (!moved.moved) reject('invalid_target', `Structured effect movement is no longer legal: ${moved.reason ?? 'unknown'}`);
        Object.assign(s, moved.nextState);
        processTrustedMovementEntryEvent(s, { id: nextId(s, 'enter-location'), type: 'after_controller_enters_location', playerId: target.id, locationId: destination }, from, destination, 'effect', false);
        break;
      }
      const explicit = normalizeStructuredLocationId(effect.locationId);
      const selected = ctx.selections[str(effect.to)]?.[0] ?? ctx.selections.targetLocationId?.[0];
      const to = explicit || selected;
      if (to) {
        const from = p.locationId;
        p.locationId = to as LocationId;
        processTrustedMovementEntryEvent(s, { id: nextId(s, 'enter-location'), type: 'after_controller_enters_location', playerId: p.id, locationId: to }, from!, to);
      }
      break;
    }
    case 'shuffle_zone_into_deck':
      s.cards.filter(c => c.ownerPlayerId === p.id && c.zone === node(effect.from).zone).forEach(c => moveCard(s, c.instanceId, 'deck'));
      shuffle(s, p.id); break;
    case 'shuffle_deck': shuffle(s, p.id); break;
    case SELECTED_PLAYED_ATTACK_TEMPORARY_COPY_EFFECT: {
      resolveSelectedPlayedAttackTemporaryCopy(s, ctx, effect);
      break;
    }
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
      const vpBefore = new Map(s.players.map((candidate) => [candidate.id, candidate.vp]));
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
      for (const changed of s.players) {
        const before = vpBefore.get(changed.id);
        if (before !== undefined && before !== changed.vp) {
          recordAuthoritativeVictoryPointChange(s, changed.id, before, changed.vp, 'extended-effect-vp');
        }
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
  for (let effectIndex = 0; effectIndex < effects.length; effectIndex++) {
    const effect = effects[effectIndex]!;
    const structuredPending = structuredChoicePending(s, ctx, effect, effects.slice(effectIndex));
    if (structuredPending) return structuredPending;
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

function createBasicStrengthAttackPlayDecision(s: GameState, ctx: EffectContext, a: AuthoringAbility): PendingDecision {
  if (!isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported FB2-53 whole-ability semantic shape');
  }
  const target = a.targets[0]!;
  const snapshot = candidates(s, ctx, target);
  if (snapshot.length < 1) reject('no_legal_target', 'No playable basic Strength attack remains');
  const id = nextId(s, 'fb2-53-strength');
  return {
    id, controllerId: ctx.controllerId, target: structuredClone(target), candidates: [...snapshot], min: 1, max: 1,
    context: structuredClone(ctx), remainingEffects: structuredClone(a.effects),
    interaction: {
      kind: 'basic_strength_attack_play_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1,
      continuationRef: `${id}:continuation`, targetId: 'strength_basic_attack', candidateIds: [...snapshot],
      constraints: { kind: 'target', targetKind: 'card', min: 1, max: 1, distinct: true },
    },
  };
}

function createBasicStrengthOpponentSkillDecision(
  s: GameState, ctx: EffectContext, a: AuthoringAbility, selectedAttackId: string,
): PendingDecision {
  if (!isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled') ||
      ctx.selections.strength_basic_attack?.length !== 1 || ctx.selections.strength_basic_attack[0] !== selectedAttackId) {
    reject('resolution_failed', 'Unsupported FB2-53 stage-two continuation context');
  }
  const target = a.targets[1]!;
  const snapshot = candidates(s, ctx, target);
  if (snapshot.length < 1) reject('no_legal_target', 'No same-location opponent face-up servant skill remains');
  const id = nextId(s, 'fb2-53-opponent-skill');
  return {
    id, controllerId: ctx.controllerId, target: structuredClone(target), candidates: [...snapshot], min: 1, max: 1,
    context: structuredClone(ctx), remainingEffects: [structuredClone(a.effects[1]!)],
    interaction: {
      kind: 'basic_strength_opponent_skill_face_down_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1,
      continuationRef: `${id}:continuation`, targetId: 'opponent_servant_skill', candidateIds: [...snapshot], selectedAttackId,
      constraints: { kind: 'target', targetKind: 'card', min: 1, max: 1, distinct: true },
    },
  };
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
      recordAuthoritativeVictoryPointChange(s, recipient.id, before, recipient.vp, 'ruler-seal-reward-vp');
      r.events.push({ type: 'victory_points_adjusted', playerId: reward.issuerPlayerId, sourceCardId: reward.sourceCardId, abilityId: reward.abilityId, delta: reward.rewardVp, before, after: recipient.vp, triggerEventId: event.id });
    }
  }
  r.pendingRulerSealRewards = remaining;
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
function hasExactBasicStrengthDecisionRootKeys(value: unknown): boolean {
  return isPlainRecord(value) &&
    exactPlayerArray(Object.keys(value).sort(), ['candidates', 'context', 'controllerId', 'id', 'interaction', 'max', 'min', 'remainingEffects', 'target']);
}
function isExactBasicStrengthInteractionConstraints(value: unknown): boolean {
  if (!isPlainRecord(value)) return false;
  return exactPlayerArray(Object.keys(value).sort(), ['distinct', 'kind', 'max', 'min', 'targetKind']) &&
    value.kind === 'target' && value.targetKind === 'card' && value.min === 1 && value.max === 1 && value.distinct === true;
}
function isExactBasicStrengthCandidateList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length >= 1 && value.every((id) => typeof id === 'string' && id.length > 0) &&
    new Set(value).size === value.length;
}
function hasExactBasicStrengthStageOneInteractionKeys(value: unknown): boolean {
  return isPlainRecord(value) && exactPlayerArray(Object.keys(value).sort(), [
    'abilityId', 'cancelPolicy', 'candidateIds', 'constraints', 'continuationRef', 'createdRevision', 'kind',
    'sourceCardInstanceId', 'targetId', 'template', 'visibility',
  ]);
}
function hasExactBasicStrengthStageTwoInteractionKeys(value: unknown): boolean {
  return isPlainRecord(value) && exactPlayerArray(Object.keys(value).sort(), [
    'abilityId', 'cancelPolicy', 'candidateIds', 'constraints', 'continuationRef', 'createdRevision', 'kind',
    'selectedAttackId', 'sourceCardInstanceId', 'targetId', 'template', 'visibility',
  ]);
}
function isExactBasicStrengthDecisionContext(value: unknown, selectedAttackId?: string): value is EffectContext {
  if (!isPlainRecord(value) || !isPlainRecord(value.variables) || !isPlainRecord(value.selections)) return false;
  if (!exactPlayerArray(Object.keys(value).sort(), ['abilityId', 'controllerId', 'selections', 'sourceCardId', 'variables']) ||
      Object.keys(value.variables).length !== 0) return false;
  const selectionKeys = Object.keys(value.selections);
  if (selectedAttackId === undefined) return selectionKeys.length === 0;
  const selected = value.selections.strength_basic_attack;
  return exactPlayerArray(selectionKeys, ['strength_basic_attack']) && Array.isArray(selected) && selected.length === 1 &&
    selected[0] === selectedAttackId;
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
function isExactOpponentCloseSelectedOneTarget(value: unknown): value is RuleNode {
  if (!isPlainRecord(value) || !isPlainRecord(value.count)) return false;
  const keys = Object.keys(value).sort();
  const countKeys = Object.keys(value.count).sort();
  return exactPlayerArray(keys, ['count', 'id', 'type']) && exactPlayerArray(countKeys, ['max', 'min']) &&
    value.id === 'frozen_non_residual_attack_to_close' && value.type === 'card_instance' &&
    value.count.min === 1 && value.count.max === 1;
}
function hasExactOpponentCloseSelectedOneInteractionRootKeys(value: unknown): boolean {
  if (!isPlainRecord(value)) return false;
  return exactPlayerArray(Object.keys(value).sort(), [
    'abilityId', 'battlefieldId', 'cancelPolicy', 'candidateIds', 'candidateOwners', 'constraints', 'continuationRef', 'createdRevision',
    'decisionPlayerId', 'initiatingControllerId', 'kind', 'sourceCardInstanceId', 'template', 'visibility',
  ]);
}
function exactPlayerPowerMap(left: Record<string, number>, right: Record<string, number>, ids: readonly string[]): boolean {
  return Object.keys(left).length === ids.length && Object.keys(right).length === ids.length &&
    ids.every((id) => Object.prototype.hasOwnProperty.call(left, id) && Object.prototype.hasOwnProperty.call(right, id) && left[id] === right[id]);
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
function stageNextCombatOpponentPowerVpRewardDecision(s: GameState): void {
  const r = runtime(s);
  if (r.pendingDecision) return;
  const pending = r.pendingCombatOpponentPowerVpRewards?.[0];
  if (!pending) return;
  const id = nextId(s, 'combat-opponent-power-vp-reward');
  const target: RuleNode = { id: 'resolved_battle_opponent', type: 'player', count: { min: 1, max: 1 } };
  r.pendingDecision = {
    id, controllerId: pending.controllerId, target, candidates: [...pending.opponentIds], min: 1, max: 1,
    context: { controllerId: pending.controllerId, sourceCardId: pending.sourceCardId, abilityId: pending.abilityId, variables: {}, selections: {} },
    remainingEffects: [],
    interaction: {
      kind: 'combat_opponent_power_vp_reward_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: pending.sourceCardId, abilityId: pending.abilityId, createdRevision: r.revision + 1,
      continuationRef: `${id}:continuation`, triggerEventId: pending.triggerEventId,
      battlePhaseResolutionId: pending.battlePhaseResolutionId, battleId: pending.battleId, resultId: pending.resultId, battlefieldId: pending.battlefieldId,
      participantIds: [...pending.participantIds], participantPowers: { ...pending.participantPowers }, opponentIds: [...pending.opponentIds],
      divisor: COMBAT_OPPONENT_POWER_VP_REWARD_DIVISOR,
      constraints: { kind: 'target', targetKind: 'player', min: 1, max: 1, distinct: true },
    },
  };
}
function stageCombatOpponentPowerVpReward(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (!isAcceptedCombatOpponentPowerVpRewardAbility(a, 'compiled')) reject('resolution_failed', 'Unsupported frozen combat-opponent power VP reward semantic shape');
  const facts = trustedCombatOpponentPowerRewardFacts(s, ctx.controllerId, ctx.event);
  if (!facts) reject('invalid_event', 'Combat-opponent power reward requires a trusted resolved-battle root snapshot');
  const r = runtime(s);
  const queue = r.pendingCombatOpponentPowerVpRewards ??= [];
  if (queue.some((entry) => entry.sourceCardId === ctx.sourceCardId && entry.abilityId === ctx.abilityId && entry.triggerEventId === ctx.event!.id)) return;
  queue.push({
    controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, triggerEventId: ctx.event!.id,
    battlePhaseResolutionId: facts.battlePhaseResolutionId, battleId: facts.battleId, resultId: facts.resultId, battlefieldId: facts.battlefieldId,
    participantIds: [...facts.participantIds], participantPowers: { ...facts.participantPowers }, opponentIds: [...facts.opponentIds],
  });
  stageNextCombatOpponentPowerVpRewardDecision(s);
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
function opponentCloseSelectedOneFacts(s: GameState, sourceId: string): {
  controllerId: PlayerId; decisionPlayerId: PlayerId; battlefieldId: string; candidateIds: string[]; candidateOwners: Record<string, PlayerId>;
} | undefined {
  const r = runtime(s);
  const source = s.cards.find((candidate) => candidate.instanceId === sourceId);
  if (!source || source.ownerPlayerId !== source.controllerPlayerId) return undefined;
  const controller = s.players.find((candidate) => candidate.id === source.controllerPlayerId);
  const sourceState: unknown = r.cardState[sourceId];
  if (!controller || controller.status !== 'active' || !isBattlefield(s, controller.locationId) ||
      !isValidOpponentCloseToOneSourceCardState(sourceState) || sourceState.active !== true || sourceState.faceDown !== false) return undefined;
  const opponents = s.players.filter((candidate) => candidate.id !== controller.id && candidate.status === 'active' &&
    candidate.locationId === controller.locationId).sort((left, right) => left.seat - right.seat);
  if (opponents.length !== 1) return undefined;
  const decisionPlayerId = opponents[0]!.id;
  const candidateIds = qualifyingOpponentCloseToOneCardIds(s, decisionPlayerId);
  if (candidateIds.length < 1) return undefined;
  const candidateOwners = Object.fromEntries(candidateIds.map((instanceId) => [instanceId, card(s, instanceId).ownerPlayerId])) as Record<string, PlayerId>;
  return { controllerId: controller.id, decisionPlayerId, battlefieldId: controller.locationId!, candidateIds, candidateOwners };
}
function createOpponentCloseSelectedOneDecision(s: GameState, ctx: EffectContext, a: AuthoringAbility): PendingDecision {
  if (!isAcceptedOpponentCloseOneNonResidualAbility(a, 'compiled')) reject('resolution_failed', 'Unsupported opponent close-selected-one interaction semantic shape');
  const facts = opponentCloseSelectedOneFacts(s, ctx.sourceCardId);
  if (!facts || facts.controllerId !== ctx.controllerId) reject('no_legal_target', 'Opponent close-selected-one has no legal chooser or card');
  const id = nextId(s, 'opponent-close-selected-one');
  const target: RuleNode = { id: 'frozen_non_residual_attack_to_close', type: 'card_instance', count: { min: 1, max: 1 } };
  return {
    id, controllerId: facts.decisionPlayerId, target, candidates: [...facts.candidateIds], min: 1, max: 1,
    context: { controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, variables: {}, selections: {} },
    remainingEffects: [],
    interaction: {
      kind: 'opponent_close_selected_one_non_residual_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
      sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1,
      continuationRef: `${id}:continuation`, initiatingControllerId: ctx.controllerId, decisionPlayerId: facts.decisionPlayerId,
      battlefieldId: facts.battlefieldId, candidateIds: [...facts.candidateIds], candidateOwners: { ...facts.candidateOwners },
      constraints: { kind: 'target', targetKind: 'card', min: 1, max: 1, distinct: true },
    },
  };
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

function isControllerExistingServantSkillDefinitionReturnComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (str(effect.type) !== 'return_card_by_definition' || !str(effect.definitionId) || str(effect.linkedSkillId)) return false;
  if (effect.target !== undefined || effect.fromZone !== 'removed_from_game' || effect.destination !== 'skill' ||
      effect.face !== 'up' || effect.createIfMissing !== undefined || effect.active !== undefined) return false;
  const keys = Object.keys(effect).sort(); const expected = ['definitionId', 'destination', 'face', 'fromZone', 'type'].sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
}

function isControllerOwnedLinkedSkillAttackReturnComponent(effect: AuthoringAbility['effects'][number]): boolean {
  if (str(effect.type) !== 'return_card_by_definition' || str(effect.definitionId) || !str(effect.linkedSkillId)) return false;
  if (effect.target !== undefined || effect.fromZone !== 'skill' || effect.destination !== 'attack_area' ||
      effect.face !== 'up' || effect.active !== true || effect.residual !== false || effect.createIfMissing !== undefined) return false;
  const keys = Object.keys(effect).sort();
  const expected = ['active', 'destination', 'face', 'fromZone', 'linkedSkillId', 'residual', 'type'].sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
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
  if (str(current.type) === 'return_card_by_definition') {
    return !isControllerExistingServantSkillDefinitionReturnComponent(current) &&
      !isControllerOwnedLinkedSkillAttackReturnComponent(current);
  }
  return Object.values(current).some(containsControllerMasterSkillDefinitionReturnCandidate);
}

function hasControllerMasterSkillDefinitionReturnCandidate(a: AuthoringAbility): boolean {
  return containsControllerMasterSkillDefinitionReturnCandidate(a.effects) ||
    containsControllerMasterSkillDefinitionReturnCandidate(a.creates);
}

function resolveControllerExistingCardsByDefinitionsReturn(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  const definitionIds = Array.isArray(effect.definitionIds)
    ? effect.definitionIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];
  const uniqueDefinitionIds = [...new Set(definitionIds)];
  const count = numeric(s, ctx, effect.count ?? 1);
  const minCount = effect.minCount === undefined ? count : numeric(s, ctx, effect.minCount);
  const payloadKey = str(effect.payloadKey) || 'returnedCardCount';
  const nested = nodes(effect.then);
  if (!definitionIds.length || uniqueDefinitionIds.length !== definitionIds.length || !Number.isSafeInteger(count) || count < 0 ||
      !Number.isSafeInteger(minCount) || minCount < 0 || minCount > count || effect.fromZone !== 'removed_from_game' ||
      effect.destination !== 'skill' || effect.face !== 'up' || effect.target !== undefined || !payloadKey ||
      Object.keys(effect).some((key) => !['type','definitionIds','count','minCount','fromZone','destination','face','payloadKey','then'].includes(key))) {
    reject('resolution_failed', 'Unsupported existing-card multi-definition return shape');
  }
  // Nested payload use is deliberately bounded to non-interactive effects. Kintoki's
  // locked Reference uses only a VP gain from the returned-card count.
  if (nested.some((entry) => ['choose_cards','choose_one','choose_locations','choose_events','play_selected_cards'].includes(str(entry.type)))) {
    reject('resolution_failed', 'Existing-card multi-definition return does not permit interactive nested effects');
  }
  const controller = player(s, ctx.controllerId);
  const found = uniqueDefinitionIds.flatMap((definitionId) => s.cards
    .filter((candidate) => candidate.ownerPlayerId === controller.id && candidate.definitionId === definitionId && candidate.zone === 'removed_from_game')
    .map((candidate) => candidate.instanceId)).slice(0, count);
  if (found.length < minCount) reject('invalid_target', 'Existing-card multi-definition return lacks the required removed physical cards');
  const r = runtime(s);
  for (const instanceId of found) {
    const target = card(s, instanceId);
    target.controllerPlayerId = controller.id; target.zone = 'skill';
    target.visibility = { scope: 'owner_only', ownerPlayerId: controller.id };
    clearTransientCardTransformState(s, instanceId);
    r.cardState[instanceId] = {
      ...(r.cardState[instanceId] ?? { active: false, faceDown: false, playedRound: s.round.roundNumber }),
      active: false, faceDown: false,
    };
    r.events.push({ type: 'card_returned_by_definition', playerId: controller.id, sourceCardId: ctx.sourceCardId,
      abilityId: ctx.abilityId, cardInstanceId: instanceId, fromZone: 'removed_from_game', toZone: 'skill', movedCount: 1 });
  }
  const hadPrior = Object.prototype.hasOwnProperty.call(ctx.variables, payloadKey);
  const prior = ctx.variables[payloadKey];
  ctx.variables[payloadKey] = found.length;
  try { for (const entry of nested) resolveEffect(s, ctx, entry); }
  finally { if (hadPrior) ctx.variables[payloadKey] = prior!; else delete ctx.variables[payloadKey]; }
}

function resolveControllerOwnedLinkedSkillAttackReturn(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  if (!isControllerOwnedLinkedSkillAttackReturnComponent(effect)) {
    reject('resolution_failed', 'Unsupported controller-owned linked-skill attack return component shape');
  }
  const r = runtime(s); const controller = player(s, ctx.controllerId); const source = card(s, ctx.sourceCardId);
  const linkedSkillId = str(effect.linkedSkillId);
  const sourceDefinition = r.pack.cards[source.definitionId] as ExecutableCardDefinition | undefined;
  const packageOwnerId = sourceDefinition?.cardType === 'master_skill' ? controller.masterCardId :
    sourceDefinition?.cardType === 'servant_skill' ? controller.servantCardId : undefined;
  if (!sourceDefinition || !packageOwnerId || sourceDefinition.ownerId !== packageOwnerId ||
      source.ownerPlayerId !== controller.id || source.controllerPlayerId !== controller.id || source.zone !== 'skill' ||
      source.definitionId !== linkedSkillId) {
    reject('invalid_source', 'Linked-skill attack return requires the controller-owned source skill itself in the skill zone');
  }
  const physical = s.cards.filter((candidate) => candidate.definitionId === linkedSkillId && candidate.ownerPlayerId === controller.id);
  if (physical.length !== 1 || physical[0]!.instanceId !== source.instanceId) {
    reject('invalid_target', 'Linked-skill attack return requires exactly one controller-owned physical source skill');
  }
  const prior = r.cardState[source.instanceId];
  moveCard(s, source.instanceId, 'attack_area');
  r.cardState[source.instanceId] = {
    ...(prior ?? { active: false, faceDown: false, playedRound: -1 }),
    active: true,
    faceDown: false,
  };
  source.visibility = { scope: 'public' };
  r.events.push({ type: 'card_returned_by_definition', playerId: controller.id, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, cardInstanceId: source.instanceId, fromZone: 'skill', toZone: 'attack_area', movedCount: 1 });
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

function resolveControllerExistingServantSkillDefinitionReturn(s: GameState, ctx: EffectContext, effect: RuleNode): void {
  if (!isControllerExistingServantSkillDefinitionReturnComponent(effect)) {
    reject('resolution_failed', 'Unsupported existing servant-skill definition-return component shape');
  }
  const r = runtime(s); const controller = player(s, ctx.controllerId); const source = card(s, ctx.sourceCardId);
  const sourceDefinition = r.pack.cards[source.definitionId] as ExecutableCardDefinition | undefined;
  if (source.ownerPlayerId !== controller.id || source.controllerPlayerId !== controller.id ||
      !sourceDefinition || sourceDefinition.cardType !== 'servant_skill' || sourceDefinition.ownerId !== controller.servantCardId) {
    reject('invalid_source', 'Existing servant-skill return source must belong to the controller servant package');
  }
  const targetDefinitionId = str(effect.definitionId);
  const physical = s.cards.filter((candidate) => candidate.definitionId === targetDefinitionId &&
    candidate.ownerPlayerId === controller.id && candidate.zone === 'removed_from_game');
  if (physical.length !== 1) reject('invalid_target', 'Existing servant-skill return requires exactly one controller-owned removed physical instance');
  const target = physical[0]!; const fromZone = target.zone;
  target.controllerPlayerId = controller.id; target.zone = 'skill';
  target.visibility = { scope: 'owner_only', ownerPlayerId: controller.id };
  clearTransientCardTransformState(s, target.instanceId);
  r.cardState[target.instanceId] = {
    ...(r.cardState[target.instanceId] ?? { active: false, faceDown: false, playedRound: s.round.roundNumber }),
    active: false, faceDown: false,
  };
  r.events.push({ type: 'card_returned_by_definition', playerId: controller.id, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, cardInstanceId: target.instanceId, fromZone, toZone: 'skill', movedCount: 1 });
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
    for (const envelope of result.results) {
      if (envelope.effectType === 'adjust_victory_points') {
        recordAuthoritativeVictoryPointChange(s, envelope.payload.playerId, envelope.payload.before, envelope.payload.after, 'ability-vp');
      }
    }
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
  if (!Number.isSafeInteger(total)) return false;
  if (total > 0 && m50ManaSpendingForbidden(s, ctx.controllerId)) return false;
  return player(s, ctx.controllerId).mana >= total;
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
    if (result.effectType === 'pay_mana') {
      if (result.payload.actualAmount > 0) recordAuthoritativeManaSpend(s, result.payload.playerId, result.payload.actualAmount);
      continue;
    }
    if (result.effectType !== 'adjust_command_seals') continue;
    const directive = result.payload.directive ?? 'adjust_command_seals';
    markCommandSealSpendRound(s, result.payload.playerId, directive, result.payload.before, result.payload.after);
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
          const enterEventId = nextId(state, 'enter-location');
          processTrustedMovementEntryEvent(state, { id: enterEventId, type: 'after_controller_enters_location', playerId, locationId: toLocationId }, fromLocationId, toLocationId);
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
      if (envelope.effectType === 'adjust_victory_points') {
        recordAuthoritativeVictoryPointChange(s, envelope.payload.playerId, envelope.payload.before, envelope.payload.after, 'ability-vp');
      }
    }
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
  if (isBasicStrengthOpponentSkillFaceDownCandidate(a)) {
    if (!isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled') ||
        effects.length !== a.effects.length || effects.some((effect, index) => JSON.stringify(effect) !== JSON.stringify(a.effects[index]))) {
      reject('resolution_failed', 'Unsupported FB2-53 whole-ability semantic shape');
    }
    if (Object.keys(ctx.selections).length !== 0 || Object.keys(ctx.variables).length !== 0) {
      reject('resolution_failed', 'FB2-53 activation requires a fresh server context');
    }
    runtime(s).pendingDecision = createBasicStrengthAttackPlayDecision(s, ctx, a);
    return;
  }
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
  if (isAcceptedOpponentCloseToOneAbility(a, 'compiled')) {
    stageOpponentCloseToOne(s, ctx, a);
    return;
  }
  if (isAcceptedOpponentCloseOneNonResidualAbility(a, 'compiled')) {
    runtime(s).pendingDecision = createOpponentCloseSelectedOneDecision(s, ctx, a);
    return;
  }
  if (isOpponentCloseToOneCandidate(a)) reject('resolution_failed', 'Unsupported opponent close-to-one interaction semantic shape');
  if (isAcceptedSelectedPlayedAttackTemporaryCopyAbility(a, 'compiled')) {
    runtime(s).pendingDecision = createSelectedPlayedAttackTemporaryCopyDecision(s, ctx, a);
    return;
  }
  if (isSelectedPlayedAttackTemporaryCopyCandidate(a)) {
    reject('resolution_failed', 'Unsupported selected played-attack temporary-copy semantic shape');
  }
  if (isBasicStrengthOpponentSkillFaceDownCandidate(a)) {
    if (!isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled')) {
      reject('resolution_failed', 'Unsupported basic-Strength play -> opponent servant-skill face-down semantic shape');
    }
    const pending = findPendingTarget(s, ctx, a, effects);
    if (pending) { runtime(s).pendingDecision = pending; return; }
    for (const effect of effects) resolveEffect(s, ctx, effect);
    return;
  }
  if (isBattleEndMobilePlayersRewardSemantic(a)) {
    settleBattleEndMobilePlayersReward(s, ctx);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isAcceptedBattleLossVpWinnerRewardAbility(a, 'compiled')) {
    settleBattleLossVpWinnerReward(s, ctx, a);
    installOngoing(s, ctx, a);
    cleanupOngoing(s);
    return;
  }
  if (isAcceptedControllerDefeatedVpRewardAbility(a, 'compiled')) {
    settleControllerDefeatedVpReward(s, ctx, a);
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
  if (isSameBattlefieldPrivateHandReturnInteractionCandidate(a) && !isAcceptedSelectedSameBattlefieldDefeatAbility(a, 'compiled') && !isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(a, 'compiled') && !isAcceptedCommandSealLossConditionalDefeatAbility(a)) {
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
    const structuredEffect = effects[i]!;
    if (structuredEffect.type === 'choose_each_player_option') {
      if (stageStructuredEachPlayerOption(s, ctx, structuredEffect, effects.slice(i + 1))) return;
      executeEffects(s, ctx, effects.slice(i + 1)); return;
    }
    if (['choose_cards', 'choose_one', 'choose_locations', 'choose_events', 'choose_players'].includes(str(structuredEffect.type))) {
      const key = structuredChoiceSelectionKey(structuredEffect);
      if (!Object.prototype.hasOwnProperty.call(ctx.selections, key)) {
        const choicePending = structuredChoicePending(s, ctx, structuredEffect, effects.slice(i));
        if (choicePending) { runtime(s).pendingDecision = choicePending; return; }
      }
      if (structuredEffect.type === 'choose_one') {
        const selected = ctx.selections[key] ?? [];
        const option = nodes(structuredEffect.options).find((entry) => selected.includes(str(entry.id)));
        if (selected.length && !option) reject('invalid_target', 'Structured option selection is no longer valid');
        if (option) { executeEffects(s, ctx, [...nodes(option.effects), ...effects.slice(i + 1)]); return; }
        executeEffects(s, ctx, effects.slice(i + 1)); return;
      }
      executeEffects(s, ctx, [...nodes(structuredEffect.then), ...effects.slice(i + 1)]); return;
    }
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
function preflightFaceUpSelectedCount(a: AuthoringAbility, ctx: EffectContext, targetRef: string): number {
  if (Object.prototype.hasOwnProperty.call(ctx.selections, targetRef)) return (ctx.selections[targetRef] ?? []).length;
  const target = a.targets.find(candidate => candidate.id === targetRef);
  if (!target) return 0;
  const min = Number(node(target.count).min ?? 1);
  return Number.isSafeInteger(min) && min > 0 ? min : 0;
}

function countPreflightFaceUpEffectPlays(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): number {
  let additionalFaceUpCards = 0;
  for (const effect of effects) {
    if (effect.type === 'play_source_card' && effect.face !== 'face_down') {
      additionalFaceUpCards += 1;
      continue;
    }
    if (effect.type === 'play_selected_cards' && effect.face !== 'face_down') {
      additionalFaceUpCards += preflightFaceUpSelectedCount(a, ctx, str(effect.target));
      continue;
    }
    if (effect.type === 'branch') {
      const branch = nodes(effect.branches).find(b => b.else !== undefined || condition(s, ctx, node(b.if)));
      if (branch) additionalFaceUpCards += countPreflightFaceUpEffectPlays(s, ctx, a, nodes(branch.then ?? branch.else));
    }
  }
  return additionalFaceUpCards;
}

function guaranteedPreflightFaceUpEffectPlays(s: GameState, ctx: EffectContext, a: AuthoringAbility, effects: RuleNode[]): number {
  const unresolvedChoice = a.targets.find(target => target.type === 'choice' &&
    !Object.prototype.hasOwnProperty.call(ctx.selections, str(target.id)));
  if (!unresolvedChoice) return countPreflightFaceUpEffectPlays(s, ctx, a, effects);

  const choiceCount = node(unresolvedChoice.count);
  const min = Number(choiceCount.min ?? 1); const max = Number(choiceCount.max ?? 1);
  if (min !== 1 || max !== 1) return 0;
  const options = candidates(s, ctx, unresolvedChoice);
  if (!options.length) return 0;

  let guaranteed = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const choiceContext = structuredClone(ctx);
    choiceContext.selections[str(unresolvedChoice.id)] = [option];
    guaranteed = Math.min(guaranteed, guaranteedPreflightFaceUpEffectPlays(s, choiceContext, a, effects));
  }
  return Number.isFinite(guaranteed) ? guaranteed : 0;
}

function faceUpEffectPlayLimitReached(s: GameState, ctx: EffectContext, a: AuthoringAbility): boolean {
  const additionalFaceUpCards = guaranteedPreflightFaceUpEffectPlays(s, ctx, a, [...a.effects, ...a.creates]);
  return additionalFaceUpCards > 0 && faceUpCardPlayLimitReached(s, ctx.controllerId, additionalFaceUpCards);
}

function preflightFaceUpEffectPlays(s: GameState, ctx: EffectContext, a: AuthoringAbility): void {
  if (faceUpEffectPlayLimitReached(s, ctx, a)) {
    reject('face_up_card_play_limit_reached', 'Face-up card play limit reached for this round');
  }
}

function hasPotentialFaceUpEffectPlay(effects: RuleNode[]): boolean {
  for (const effect of effects) {
    if ((effect.type === 'play_source_card' || effect.type === 'play_selected_cards') && effect.face !== 'face_down') return true;
    if (effect.type !== 'branch') continue;
    for (const branch of nodes(effect.branches)) {
      if (hasPotentialFaceUpEffectPlay([...nodes(branch.then), ...nodes(branch.else)])) return true;
    }
  }
  return false;
}

function preflightFaceUpEffectPlaysAfterPreEffectMutations(
  s: GameState,
  ctx: EffectContext,
  a: AuthoringAbility,
  manaCost: number,
  fixedControllerManaCost: boolean,
  names: string[],
  limitType: string,
): void {
  if (!hasPotentialFaceUpEffectPlay([...a.effects, ...a.creates])) return;
  const preview = structuredClone(s);
  const previewPlayer = player(preview, ctx.controllerId);
  previewPlayer.mana -= manaCost;
  if (fixedControllerManaCost && isAddToAttackRouteCandidate(a)) executeFixedControllerManaCost(preview, ctx, a);
  if (names.length) runtime(preview).calculations.push({ controllerId: previewPlayer.id, lines: names.map(name => ({ label: name, value: ctx.variables[name]! })) });
  for (const cost of a.cost.filter(c => c.type === 'move_source_card')) moveCard(preview, ctx.sourceCardId, str(node(cost.to).zone));
  if (a.visibility.revealTiming === 'on_use_declared') reveal(preview, previewPlayer.id);
  if (!isRulerSealUseSemantic(a) && !isCommandSpellCard(preview, ctx.sourceCardId) && classifyAbilityInteraction(a).kind === 'phase_activation') {
    runtime(preview).usedAbilities[`${ctx.sourceCardId}:${a.id}`] = preview.round.roundNumber;
  }
  if (limitType === 'per_game' || limitType === 'per_round') {
    const usageKey = limitType === 'per_round' ? `${ctx.sourceCardId}:${a.id}:round:${preview.round.roundNumber}` : `${ctx.sourceCardId}:${a.id}`;
    runtime(preview).abilityUsage[usageKey] = (runtime(preview).abilityUsage[usageKey] ?? 0) + 1;
  }
  installOngoing(preview, ctx, a);
  preflightFaceUpEffectPlays(preview, ctx, a);
}
export function executeAbility(s: GameState, ctx: EffectContext): void {
  const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  if (!hasPotentialFaceUpEffectPlay([...a.effects, ...a.creates])) {
    executeAbilityMutable(s, ctx);
    reconcileStructuredHandEmptyClosures(s);
    return;
  }
  const transactional = structuredClone(s);
  executeAbilityMutable(transactional, ctx);
  reconcileStructuredHandEmptyClosures(transactional);
  Object.assign(s, transactional);
}

function executeAbilityMutable(s: GameState, ctx: EffectContext): void {
  const a = abilityDefinition(s, ctx.sourceCardId, ctx.abilityId);
  if (a.execution.mode !== 'automatic') reject(a.execution.mode, 'Ability requires an adapter or host ruling');
  if (isRulerSealBindingCandidate(a) && !isRulerSealBindingSemantic(a)) reject('resolution_failed', 'Unsupported Ruler seal binding semantic shape');
  if (isRulerSealUseCandidate(a) && !isRulerSealUseSemantic(a)) reject('resolution_failed', 'Unsupported Ruler seal use semantic shape');
  if (isOuterGodLifeAbilityCandidate(a) && !isOuterGodLifeAbilitySemantic(a)) reject('resolution_failed', 'Unsupported Outer-God-Life relational semantic shape');
  if (isBasicStrengthOpponentSkillFaceDownCandidate(a) && !isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported basic-Strength play -> opponent servant-skill face-down semantic shape');
  }
  if (isEventPowerUncontestedWinRewardCandidate(a) && !isAcceptedEventPowerUncontestedWinRewardAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported FB2-54 event-power / uncontested-win reward semantic shape');
  }
  if (isB03ModifierLifecycleCandidate(a) && !isAcceptedB03ModifierLifecycleAbility(a) && !isGenericStructuredScheduleArm(a) && !isAcceptedM50SourceBattlefieldLockdownAbility(a)) {
    reject('resolution_failed', 'Unsupported F4 B03 modifier/lifecycle semantic shape');
  }
  if (isB04EventSourcePowerCandidate(a) && !isAcceptedB04EventSourcePowerAbility(a)) {
    reject('resolution_failed', 'Unsupported F4 B04 event/source-power semantic shape');
  }  if (isB05EventResourceLifecycleCandidate(a) && !isAcceptedB05EventResourceLifecycleAbility(a)) {
    reject('resolution_failed', 'Unsupported F4 B05 event/resource/lifecycle semantic shape');
  }
  if (isNextRoundSituationBenefitSuppressionCandidate(a) && !isAcceptedNextRoundSituationBenefitSuppressionAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported next-round situation-benefit suppression semantic shape');
  }
  if (isAcceptedOpponentRoundVpGainThresholdAbility(a, 'compiled')) {
    resolveControllerMasterSkillDefinitionReturn(s, ctx, a.effects[0]!);
    return;
  }
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
  if (isPreBattleDefeatCandidate(a) && !isAcceptedPreBattleDefeatAbility(a, 'compiled') && !isAcceptedSelectedSameBattlefieldDefeatAbility(a, 'compiled') && !isAcceptedCommandSealUnusedSameBattlefieldDefeatAbility(a, 'compiled') && !isAcceptedStructuredChosenOpponentDefeatAbility(a, 'compiled') && !isAcceptedDeploymentLocationOpponentDefeatAbility(a, 'compiled') && !isAcceptedFaceUpPlayThresholdSameBattlefieldDefeatAbility(a, 'compiled') && !isGenericScheduledSelfDefeat(a) && !isGenericScheduledRankedSelfDefeatSequence(a) && !isAcceptedCommandSealLossConditionalDefeatAbility(a) && !isAcceptedM50RatioFilteredDefeatAbility(a)) {
    reject('resolution_failed', 'Unsupported pre-battle defeat semantic shape');
  }
  if (isBattleLossVpWinnerRewardCandidate(a) && !isAcceptedBattleLossVpWinnerRewardAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported battle-loss VP winner-reward semantic shape');
  }
  if (isControllerDefeatedVpRewardCandidate(a) && !isAcceptedControllerDefeatedVpRewardAbility(a, 'compiled') && !isAcceptedB04ControllerDefeatManaReleaseAbility(a)) {
    reject('resolution_failed', 'Unsupported controller-defeated VP reward semantic shape');
  }
  if (isCombatOpponentPowerVpRewardCandidate(a) && !isAcceptedCombatOpponentPowerVpRewardAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported frozen combat-opponent power VP reward semantic shape');
  }
  if (isOpponentCloseToOneCandidate(a) && !isAcceptedOpponentCloseToOneAbility(a, 'compiled') &&
      !isAcceptedOpponentCloseOneNonResidualAbility(a, 'compiled')) {
    reject('resolution_failed', 'Unsupported opponent close-to-one interaction semantic shape');
  }
  if (isAcceptedCombatOpponentPowerVpRewardAbility(a, 'compiled')) {
    stageCombatOpponentPowerVpReward(s, ctx, a);
    return;
  }
  if (isAcceptedPreBattleDefeatAbility(a, 'compiled')) {
    const controller = player(s, ctx.controllerId);
    if (controller.status !== 'active' || !isBattlefield(s, controller.locationId)) {
      reject('invalid_state', 'Pre-battle defeat requires an active controller at a battlefield');
    }
  }
  if (isGameStartRuleOverrideCandidate(a) && !isGameStartRuleOverrideSemantic(a)) {
    reject('resolution_failed', 'Unsupported persistent RuleOverride semantic shape');
  }
  if (isGameStartFixedControllerManaSetCandidate(a) && !isGameStartFixedControllerManaSetSemantic(a)) {
    reject('resolution_failed', 'Unsupported game-start fixed set-mana semantic shape');
  }
  if (isGameStartPlayerStatusAssignmentCandidate(a)) {
    if (isGameStartPlayerStatusAssignmentSemantic(a)) {
      if (!assignGameStartPlayerStatuses(s, ctx.controllerId, a)) {
        reject('resolution_failed', 'Unsupported game-start player-status assignment semantic shape or target topology');
      }
      return;
    }
    if (!(ctx.scheduledPayload === true && isM50ScheduledPayloadStatusTarget(a)) && !isStructuredEachPlayerOptionAbility(a)) {
      reject('resolution_failed', 'Unsupported non-game-start player-status assignment semantic shape');
    }
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
  if (!isAcceptedM50FreeSourceCardCombatPlayAbility(a)) preflightFaceUpEffectPlays(s, ctx, a);
  const p = player(s, ctx.controllerId); let manaCost = 0;
  const fixedControllerManaCost = usesAcceptedFixedControllerManaCostComponent(a);
  
  // Check usage limits
  const limitType = str(a.limit?.type);
  if ((limitType === 'per_game' || limitType === 'per_round') && abilityLimitReached(s, ctx.sourceCardId, a)) {
    reject('ability_limit_reached', 'Ability has been used the maximum number of times this game');
  }
  
  const names = a.cost.filter(c => c.type === 'pay_mana').map(c => str(node(c.amount).var)).filter(Boolean);
  const scheduledPayloadNames = new Set<string>();
  if (a.activation.trigger === 'm50_round_started') {
    const collectScheduledPayloadNames = (value: unknown): void => {
      if (Array.isArray(value)) { for (const entry of value) collectScheduledPayloadNames(entry); return; }
      if (!value || typeof value !== 'object') return;
      const current = node(value);
      if (current.type === 'payload_number' || current.type === 'payload_number_plus') {
        const key = str(current.key); if (key) scheduledPayloadNames.add(key);
      }
      for (const child of Object.values(current)) collectScheduledPayloadNames(child);
    };
    collectScheduledPayloadNames(a.effects);
  }
  if (Object.keys(ctx.variables).some(name => !names.includes(name) && !scheduledPayloadNames.has(name))) reject('invalid_variable', 'Unexpected variable');
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
  if (manaCost > 0 && m50ManaSpendingForbidden(s, p.id)) reject('mana_spending_forbidden', 'Mana spending is forbidden this round');
  if (fixedControllerManaCost && isFixedControllerAdvanceDrawActionSemantic(a) &&
    !hasAvailableManaForFixedCosts(s, ctx, a)) reject(m50ManaSpendingForbidden(s, p.id) ? 'mana_spending_forbidden' : 'insufficient_mana', m50ManaSpendingForbidden(s, p.id) ? 'Mana spending is forbidden this round' : 'Insufficient mana');
  if (!isAcceptedM50FreeSourceCardCombatPlayAbility(a)) {
    preflightFaceUpEffectPlaysAfterPreEffectMutations(s, ctx, a, manaCost, fixedControllerManaCost, names, limitType);
  }
  p.mana -= manaCost;
  if (manaCost > 0) recordAuthoritativeManaSpend(s, p.id, manaCost);
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

function rememberTrustedBattleResultSnapshot(r: AbilityRuntime, event: AbilityEvent): void {
  if (event.type !== 'after_battle_result_determined' || event.id !== event.resultId ||
      typeof event.battlePhaseResolutionId !== 'string' || typeof event.battleId !== 'string' ||
      typeof event.resultId !== 'string' || typeof event.battlefieldId !== 'string' ||
      !Array.isArray(event.battleParticipantIds) || !Array.isArray(event.battleResult?.winners) ||
      !Array.isArray(event.battleResult?.loserIds)) return;
  const snapshots = r.trustedBattleResultSnapshots ??= {};
  if (snapshots[event.resultId]) return;
  snapshots[event.resultId] = {
    battlePhaseResolutionId: event.battlePhaseResolutionId,
    battleId: event.battleId,
    resultId: event.resultId,
    battlefieldId: event.battlefieldId,
    battleParticipantIds: [...event.battleParticipantIds],
    ...(event.battleParticipantPowers && typeof event.battleParticipantPowers === 'object' && !Array.isArray(event.battleParticipantPowers)
      ? { battleParticipantPowers: { ...event.battleParticipantPowers } } : {}),
    winners: [...event.battleResult.winners],
    loserIds: [...event.battleResult.loserIds],
  };
}

function processTrustedFb254EntryEvent(s: GameState, event: AbilityEvent): void {
  rememberTrustedFb254EntryEvent(s, event);
  try { processEvent(s, event); } finally { forgetTrustedFb254EntryEvent(s, event.id); }
}

function processTrustedCardPlayEvent(s: GameState, event: AbilityEvent): void {
  if (event.type !== 'on_card_played' || !/^play-[1-9]\d*$/.test(event.id) || typeof event.playerId !== 'string' || typeof event.sourceCardId !== 'string') {
    reject('invalid_event', 'Trusted card-play producer received malformed event');
  }
  const source = s.cards.find((candidate) => candidate.instanceId === event.sourceCardId);
  const sourceState = source ? runtime(s).cardState[source.instanceId] : undefined;
  const played = event.playedCards?.find((entry) => entry.instanceId === event.sourceCardId);
  if (!source || source.controllerPlayerId !== event.playerId || !sourceState || sourceState.playedRound !== s.round.roundNumber ||
      !played || played.controllerId !== event.playerId || typeof played.faceDown !== 'boolean') {
    reject('invalid_event', 'Trusted card-play event lacks exact applied source-play facts');
  }
  const snapshots = runtime(s).trustedCardPlaySnapshots ??= {};
  const next = { eventId: event.id, playerId: event.playerId, sourceCardId: event.sourceCardId, round: s.round.roundNumber, faceDown: played.faceDown };
  const prior = snapshots[event.id];
  if (prior && JSON.stringify(prior) !== JSON.stringify(next)) reject('invalid_state', 'Trusted card-play event id collision');
  snapshots[event.id] = next;
  processEvent(s, event);
}

function settlePhysicalCardsScheduledAfterBattle(s: GameState, event: AbilityEvent): void {
  if (event.type !== 'after_battle_ended') return;
  const r = runtime(s);
  for (const [instanceId, cardState] of Object.entries(r.cardState)) {
    const dueRound = cardState.removeAfterBattleRound;
    if (dueRound === undefined) continue;
    if (!Number.isSafeInteger(dueRound) || dueRound < 1) reject('invalid_state', 'Physical-card battle-removal round is invalid');
    if (dueRound > s.round.roundNumber) continue;
    const physical = s.cards.find((candidate) => candidate.instanceId === instanceId);
    if (!physical) reject('invalid_state', 'Scheduled physical-card battle removal lost its card instance');
    if (physical.zone !== 'removed_from_game') {
      moveCard(s, instanceId, 'removed_from_game');
      physical.controllerPlayerId = physical.ownerPlayerId;
    }
    delete cardState.removeAfterBattleRound;
  }
}

function reconcileB05LowManaClosures(s: GameState): void {
  for (const source of s.cards) {
    if (!active(s, source.instanceId)) continue;
    const controller = s.players.find((player) => player.id === source.controllerPlayerId);
    if (!controller || controller.status !== 'active' || !Number.isSafeInteger(controller.mana) || controller.mana < 0 || controller.mana >= 2) continue;
    const ability = definition(s, source.instanceId)?.abilities.find(isAcceptedB05LowManaCloseAbility);
    if (!ability || isCardCloseForbidden(s, source.instanceId)) continue;
    resolveEffect(s, context(s, source.instanceId, ability.id), ability.effects[0]!);
  }
}
function processEvent(s: GameState, event: AbilityEvent): void {
  const r = runtime(s); if (r.processedEvents.includes(event.id)) return;
  if (!event.id) reject('invalid_event', 'Events require stable ids');
  if (event.type === 'm50_player_mana_spent') {
    const trusted = r.trustedManaSpentSnapshots?.[event.id];
    const expectedKeys = ['amount', 'id', 'playerId', 'resource', 'roundNumber', 'type', ...(event.locationId ? ['locationId'] : [])].sort();
    const keys = Object.keys(event).sort();
    if (!trusted || keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index]) ||
        event.resource !== 'mana' || !event.playerId || event.roundNumber !== s.round.roundNumber ||
        !Number.isSafeInteger(event.amount) || Number(event.amount) <= 0 ||
        trusted.playerId !== event.playerId || trusted.resource !== event.resource || trusted.amount !== event.amount ||
        trusted.locationId !== event.locationId || trusted.roundNumber !== event.roundNumber) {
      reject('invalid_event', 'Mana-spent event lacks exact current authoritative provenance');
    }
  }
  if (event.type === OPPONENT_ROUND_VP_GAIN_TRIGGER) {
    const trusted = r.trustedVictoryPointChanges?.[event.id];
    const keys = Object.keys(event).sort();
    const expectedKeys = ['after', 'before', 'delta', 'id', 'playerId', 'resource', 'roundNumber', 'type'].sort();
    const affected = event.playerId && s.players.find((candidate) => candidate.id === event.playerId);
    if (!trusted || keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index]) ||
      !affected || event.resource !== 'victory_points' || event.roundNumber !== s.round.roundNumber ||
      !Number.isSafeInteger(event.delta) || !Number.isSafeInteger(event.before) || !Number.isSafeInteger(event.after) ||
      event.before! < 0 || event.after! < 0 || event.before! + event.delta! !== event.after || affected.vp !== event.after ||
      trusted.playerId !== event.playerId || trusted.resource !== event.resource || trusted.delta !== event.delta ||
      trusted.before !== event.before || trusted.after !== event.after || trusted.roundNumber !== event.roundNumber) {
      reject('invalid_event', 'VP-change event lacks exact current authoritative provenance');
    }
    const ledger = r.roundPositiveVictoryPointGain ??= { round: s.round.roundNumber, byPlayer: {} };
    if (ledger.round !== s.round.roundNumber) reject('invalid_state', 'VP-gain ledger round is stale');
    const previous = ledger.byPlayer[event.playerId!] ?? 0;
    const next = event.delta! > 0 ? previous + event.delta! : previous;
    if (!Number.isSafeInteger(next)) reject('invalid_state', 'VP-gain ledger overflow');
    ledger.byPlayer[event.playerId!] = next;
    trusted.crossed = previous < OPPONENT_ROUND_VP_GAIN_THRESHOLD && next >= OPPONENT_ROUND_VP_GAIN_THRESHOLD;
  }
  r.processedEvents.push(event.id);
  rememberTrustedBattleResultSnapshot(r, event);
  settlePendingRulerSealRewards(s, event);
  try { settlePendingSourceCardReturns(s, event); } catch (error) { reject('resolution_failed', error instanceof Error ? error.message : 'Source-card return failed'); }
  if (event.type === 'after_battle_result_determined') recordCurrentRoundCombatWinsFromBattleResult(s, event);
  if (event.type === 'round_end') consumeDelayedActivations(s, event);
  settleGenericStructuredSchedules(s, event.type, event);
  if (event.type === 'round_end') revealM50FaceDownAttackResidualSources(s);
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

    // FB2-47: actual defeat is a distinct server fact and must settle before battle-loss triggers.
    // The trusted root event already excludes loss-effect-suppressed participants from loserIds.
    for (const id of losers) processEvent(s, { ...event, id: `${event.id}:defeat:${id}`, type: CONTROLLER_DEFEATED_TRIGGER, playerId: id });
    for (const id of winners) processEvent(s, { ...event, id: `${event.id}:win:${id}`, type: 'after_controller_wins_battle', playerId: id });
    for (const id of winners) processEvent(s, { ...event, id: `${event.id}:victory:${id}`, type: 'after_controller_gains_victory', playerId: id });
    for (const id of losers) processEvent(s, { ...event, id: `${event.id}:lose:${id}`, type: 'after_controller_loses_battle', playerId: id });
  }
  // Scheduled physical-card removal is a battle-terminal cleanup. Resolve it only
  // after all authored after_battle_ended abilities had a chance to observe the card.
  settlePhysicalCardsScheduledAfterBattle(s, event);
  reconcileB05LowManaClosures(s);
  reconcileStructuredHandEmptyClosures(s);
  checkFormulaTriggers(s);
}
function reconcileStructuredHandEmptyClosures(s: GameState): void {
  for (const target of s.players) {
    for (const sourceCardId of structuredCloseWhenHandEmptySources(s, target.id)) {
      if (isCardCloseForbidden(s, sourceCardId)) continue;
      resolveExtendedEffect(s, target.id, { type: 'close_source_card' }, {
        sourceCardId, abilityId: 'm50_hand_empty_close', selections: {},
      });
    }
  }
}
/** Trusted backend event hook. Events are not part of AbilityCommand. */
export function processAbilityEvent(s: GameState, event: AbilityEvent): void {
  if (runtime(s).processedEvents.includes(event.id)) return;
  const copy = structuredClone(s);
  // FB2-54 entry provenance is transaction-local server authority, never replay/persistence authority.
  delete runtime(copy).trustedEntryEventSnapshots;
  processEvent(copy, event); runtime(copy).revision++;
  Object.assign(s, copy);
}
/** Trusted backend producer for an already-committed positive mana payment. */
export function processAuthoritativeManaSpentAbilityEvent(s: GameState, playerId: string, amount: number, locationId?: string): void {
  const copy = structuredClone(s);
  recordAuthoritativeManaSpend(copy, playerId, amount, locationId);
  runtime(copy).revision++;
  Object.assign(s, copy);
}
/** Trusted backend producer helper. Allocates event identity inside the same cloned transaction. */
export function processAbilitySystemEvent(s: GameState, label: string, event: Omit<AbilityEvent, 'id'>): void {
  const copy = structuredClone(s);
  delete runtime(copy).trustedEntryEventSnapshots;
  const fullEvent = { ...event, id: nextId(copy, label) } as AbilityEvent;
  if (isFb254EntryEventType(fullEvent.type)) processTrustedFb254EntryEvent(copy, fullEvent);
  else processEvent(copy, fullEvent);
  runtime(copy).revision++;
  Object.assign(s, copy);
}
/** Trusted backend producer for an already-applied player movement. Records movement metrics and exact B04 provenance before dispatch. */
export function processAuthoritativeMovementAbilityEvent(s: GameState, event: Omit<AbilityEvent, 'id'>, fromLocationId: string, toLocationId: string, movementKind = 'normal'): void {
  if (event.type !== 'after_controller_enters_location' || !event.playerId || event.locationId !== toLocationId || !fromLocationId || fromLocationId === toLocationId) reject('invalid_event', 'Authoritative movement event is malformed');
  const affected = s.players.find((candidate) => candidate.id === event.playerId);
  const lastLog = s.log.at(-1);
  const payload = lastLog?.payload as Record<string, unknown> | undefined;
  const expectedMessage = `player:${event.playerId}:${movementKind}_move:${fromLocationId}->${toLocationId}`;
  if (!affected || affected.locationId !== toLocationId || lastLog?.type !== 'movement' || lastLog.message !== expectedMessage ||
      payload?.playerId !== event.playerId || payload.from !== fromLocationId || payload.to !== toLocationId ||
      payload.movementKind !== movementKind || !Number.isSafeInteger(payload.manaSpent) || Number(payload.manaSpent) < 0) {
    reject('invalid_event', 'Authoritative movement event lacks the exact applied movement receipt');
  }
  const copy = structuredClone(s);
  delete runtime(copy).trustedEntryEventSnapshots;
  const fullEvent = { ...event, id: nextId(copy, 'enter-location') } as AbilityEvent;
  processTrustedMovementEntryEvent(copy, fullEvent, fromLocationId, toLocationId, movementKind, false);
  runtime(copy).revision++; Object.assign(s, copy);
}
/** FB2-54 trusted backend producer for an already-applied exact movement/deployment entry. */
export function processAuthoritativeEntryAbilityEvent(s: GameState, event: AbilityEvent): void {
  if (!isFb254EntryEventType(event.type)) reject('invalid_event', 'Authoritative entry helper accepts only FB2-54 entry roots');
  if (runtime(s).processedEvents.includes(event.id)) return;
  const copy = structuredClone(s);
  delete runtime(copy).trustedEntryEventSnapshots;
  try { rememberB05DeploymentEntryReceipt(copy, event); } catch (error) { reject('invalid_event', error instanceof Error ? error.message : 'F4 B05 deployment receipt failed'); }
  processTrustedFb254EntryEvent(copy, event);
  runtime(copy).revision++;
  Object.assign(s, copy);
}

/** B05-only server route for support-location deployment. Historical generic deployment triggers remain battlefield-only. */
export function processAuthoritativeB05SupportDeploymentAbilityEvent(s: GameState, event: AbilityEvent): void {
  if (event.type !== 'after_player_deployed_to_battlefield' || typeof event.playerId !== 'string' || typeof event.locationId !== 'string' ||
      event.id !== `deploy:${s.round.roundNumber}:${event.playerId}`) {
    reject('invalid_event', 'F4 B05 support deployment event is malformed');
  }
  const entered = s.players.find((candidate) => candidate.id === event.playerId);
  const location = getEnabledLocations(s.map, s.locationConfig).find((candidate) => candidate.id === event.locationId);
  if (!entered || entered.status !== 'active' || entered.locationId !== event.locationId || !location || location.tags.includes('battlefield')) {
    reject('invalid_event', 'F4 B05 support deployment event lacks exact support-location provenance');
  }
  if (runtime(s).processedEvents.includes(event.id)) return;
  const copy = structuredClone(s);
  delete runtime(copy).trustedEntryEventSnapshots;
  rememberTrustedFb254EntryEvent(copy, event);
  try {
    const r = runtime(copy);
    r.processedEvents.push(event.id);
    for (const c of copy.cards) {
      for (const a of definition(copy, c.instanceId)?.abilities ?? []) {
        if (!isAcceptedB05WorkshopDeploymentExchangeAbility(a) || a.activation.trigger !== event.type) continue;
        if (!canActivate(copy, c.instanceId, a, event) || !triggerEventScopeMatches(a, event)) continue;
        executeAbility(copy, context(copy, c.instanceId, a.id, event));
      }
    }
    reconcileB05LowManaClosures(copy);
  } finally {
    forgetTrustedFb254EntryEvent(copy, event.id);
  }
  runtime(copy).revision++;
  Object.assign(s, copy);
}

/** Records and dispatches a VP transition that an existing trusted runtime path has already applied. */
export function recordAuthoritativeVictoryPointChange(
  s: GameState, playerId: string, before: number, after: number, label = 'vp-change',
): string {
  const affected = player(s, playerId);
  if (![before, after, affected.vp].every((value) => Number.isSafeInteger(value) && value >= 0) || affected.vp !== after) {
    reject('invalid_state', 'Authoritative VP transition must match the current nonnegative safe-integer balance');
  }
  const r = runtime(s);
  const requestedDelta = after - before;
  const multiplierReceipt = r.structuredNextRoundVpGainMultipliers?.[playerId];
  if (requestedDelta > 0 && multiplierReceipt?.round === s.round.roundNumber) {
    const multipliedDelta = requestedDelta * multiplierReceipt.multiplier;
    const multipliedAfter = before + multipliedDelta;
    if (!Number.isSafeInteger(multipliedDelta) || !Number.isSafeInteger(multipliedAfter)) reject('invalid_state', 'Structured VP multiplier would exceed safe integer range');
    affected.vp = multipliedAfter;
    after = multipliedAfter;
  }
  const delta = after - before;
  const id = nextId(s, label);
  const facts = { playerId, resource: 'victory_points' as const, delta, before, after, roundNumber: s.round.roundNumber };
  if (r.roundPositiveVictoryPointGain?.round !== s.round.roundNumber) {
    r.roundPositiveVictoryPointGain = { round: s.round.roundNumber, byPlayer: {} };
  }
  (r.trustedVictoryPointChanges ??= {})[id] = facts;
  processEvent(s, { id, type: OPPONENT_ROUND_VP_GAIN_TRIGGER, ...facts });
  return id;
}

/** Authoritative server VP producer. External event ingestion cannot manufacture this provenance. */
export function adjustVictoryPointsAuthoritatively(s: GameState, playerId: string, requestedDelta: number): string {
  if (!Number.isSafeInteger(requestedDelta)) reject('invalid_amount', 'VP adjustment must be a safe integer');
  const copy = structuredClone(s);
  const affected = player(copy, playerId);
  if (!Number.isSafeInteger(affected.vp) || affected.vp < 0) reject('invalid_state', 'Player VP must be a nonnegative safe integer');
  const before = affected.vp;
  const after = Math.max(0, before + requestedDelta);
  if (!Number.isSafeInteger(after)) reject('invalid_amount', 'VP adjustment result must be a safe integer');
  affected.vp = after;
  const delta = after - before;
  const id = recordAuthoritativeVictoryPointChange(copy, playerId, before, after);
  runtime(copy).events.push({ type: 'victory_points_adjusted', playerId, resource: 'victory_points', delta, before, after, triggerEventId: id });
  runtime(copy).revision++;
  Object.assign(s, copy);
  return id;
}
export function advanceAbilityPhase(s: GameState, next: PhaseName, round = s.round.roundNumber): void {
  const r = runtime(s);
  if (r.pendingDecision || r.responseWindows.length || r.hostRequests.length) reject('pending_resolution', 'Resolve the current decision before advancing');
  if (!Number.isInteger(round) || round < s.round.roundNumber) reject('invalid_round', 'Round cannot move backwards');
  const copy = structuredClone(s);
  if (round > s.round.roundNumber) {
    expireStructuredTemporaryGeneratedCards(copy, round);
    runtime(copy).movementDistanceThisRound = {};
    runtime(copy).battlefieldsPassedOrStayedThisRound = {};
    runtime(copy).pendingRulerSealRewards = runtime(copy).pendingRulerSealRewards.filter((reward) => reward.round >= round);
    runtime(copy).roundTotalPowerAdjustments = { round, byPlayer: {} };
    runtime(copy).pendingSourceCardReturns = runtime(copy).pendingSourceCardReturns.filter((entry) => entry.round >= round);
    runtime(copy).pendingPreBattleDefeats = [];
    runtime(copy).manaGainedThisRound = { round, byPlayer: {} };
    runtime(copy).roundPositiveVictoryPointGain = { round, byPlayer: {} };
    const vpMultipliers = runtime(copy).structuredNextRoundVpGainMultipliers;
    if (vpMultipliers) for (const [playerId, receipt] of Object.entries(vpMultipliers)) if (receipt.round < round) delete vpMultipliers[playerId];
    const defeatRounds = runtime(copy).structuredDefeatRoundByPlayer;
    if (defeatRounds) for (const [playerId, defeatRound] of Object.entries(defeatRounds)) if (defeatRound < round) delete defeatRounds[playerId];
    runtime(copy).playCounters = { round, cardsPlayedByPlayer: {}, faceUpCardsPlayedByPlayer: {}, attacksDeclaredByPlayer: {} };
  }
  copy.round.activePhase = next; copy.round.roundNumber = round;
  if (round > s.round.roundNumber) {
    advanceB03RoundSchedules(copy, round);
    if (next === 'preparation') {
      settleGenericStructuredSchedules(copy, 'm50_round_started');
      processEvent(copy, { id: nextId(copy, 'round-start'), type: 'm50_round_started' });
    }
  }
  cleanupOngoing(copy);
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
      if (!entersAttackArea(s, command.cardInstanceId)) reject('not_attack_card', 'Only attack cards can be staged');
      const hasOrdinaryStagedAttack = currentStaged.some((entry) => entersAttackArea(s, entry.cardInstanceId) && !isRequiredAdditionalPlayCard(s, entry.cardInstanceId));
      const allowRequiredAdditional = hasOrdinaryStagedAttack && isRequiredAdditionalPlayCard(s, command.cardInstanceId);
      const stageFailure = playFailure(s, playerId, command.cardInstanceId, command.faceDown === true, false, true, false, allowRequiredAdditional);
      if (stageFailure) reject(stageFailure, 'Card cannot be staged in the current state');
      if (!canStageAttackChoice(s, playerId, { type: 'play_card', cardInstanceId: command.cardInstanceId, ...(command.faceDown ? { faceDown: true } : {}) }, currentStaged)) {
        reject('attack_play_limit_reached', 'Card cannot be staged in the current state');
      }
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
      const decisionValue: unknown = r.pendingDecision;
      if (!isPlainRecord(decisionValue)) reject('illegal_decision', 'Decision is not available');
      const d = decisionValue as unknown as PendingDecision;
      if (d.controllerId !== playerId || d.id !== command.decisionId) reject('illegal_decision', 'Decision is not available');
      const selected = command.selectedIds;
      const interactionValue: unknown = d.interaction;
      if (interactionValue !== undefined) {
        if (!isPlainRecord(interactionValue)) reject('resolution_failed', 'Corrupt pending interaction state');
        const meta = interactionValue as unknown as NonNullable<PendingDecision['interaction']>;
        if (meta.kind === 'basic_strength_attack_play_v1') {
          const source = s.cards.find((candidate) => candidate.instanceId === meta.sourceCardInstanceId);
          const a = source ? abilityDefinition(s, meta.sourceCardInstanceId, meta.abilityId) : undefined;
          const currentTarget = a?.targets[0];
          const currentAllowed = a && currentTarget ? candidates(s, d.context, currentTarget) : [];
          const exactTarget = !!currentTarget && JSON.stringify(d.target) === JSON.stringify(currentTarget);
          const exactEffects = !!a && d.remainingEffects.length === 2 &&
            d.remainingEffects.every((effect, index) => JSON.stringify(effect) === JSON.stringify(a.effects[index]));
          if (!hasExactBasicStrengthDecisionRootKeys(decisionValue) || !hasExactBasicStrengthStageOneInteractionKeys(interactionValue) ||
              !a || !isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled') || !source ||
              source.ownerPlayerId !== playerId || source.controllerPlayerId !== playerId || d.controllerId !== playerId ||
              d.context.controllerId !== playerId || d.context.sourceCardId !== meta.sourceCardInstanceId || d.context.abilityId !== meta.abilityId ||
              !isExactBasicStrengthDecisionContext(d.context) || !exactTarget || !exactEffects ||
              meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
              meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== r.revision ||
              meta.targetId !== 'strength_basic_attack' || !isExactBasicStrengthInteractionConstraints(meta.constraints) ||
              !isExactBasicStrengthCandidateList(meta.candidateIds) || !exactPlayerArray(d.candidates, meta.candidateIds) ||
              d.min !== 1 || d.max !== 1 || !Array.isArray(selected) || selected.length !== 1 || new Set(selected).size !== 1 ||
              !meta.candidateIds.includes(selected[0]!) || !currentAllowed.includes(selected[0]!)) {
            reject('resolution_failed', 'Corrupt or stale FB2-53 stage-one interaction state');
          }
          const selectedAttackId = selected[0]!;
          const authoritativeContext = context(s, meta.sourceCardInstanceId, meta.abilityId);
          authoritativeContext.selections[meta.targetId] = [selectedAttackId];
          delete r.pendingDecision;
          resolveEffect(s, authoritativeContext, a.effects[0]!);
          r.pendingDecision = createBasicStrengthOpponentSkillDecision(s, authoritativeContext, a, selectedAttackId);
          break;
        }
        if (meta.kind === 'basic_strength_opponent_skill_face_down_v1') {
          const source = s.cards.find((candidate) => candidate.instanceId === meta.sourceCardInstanceId);
          const a = source ? abilityDefinition(s, meta.sourceCardInstanceId, meta.abilityId) : undefined;
          const currentTarget = a?.targets[1];
          const currentAllowed = a && currentTarget ? candidates(s, d.context, currentTarget) : [];
          const exactTarget = !!currentTarget && JSON.stringify(d.target) === JSON.stringify(currentTarget);
          const exactEffects = !!a && d.remainingEffects.length === 1 && JSON.stringify(d.remainingEffects[0]) === JSON.stringify(a.effects[1]);
          const playedCard = s.cards.find((candidate) => candidate.instanceId === meta.selectedAttackId);
          const playedDefinition = playedCard ? definition(s, playedCard.instanceId) : undefined;
          const playedState = playedCard ? r.cardState[playedCard.instanceId] : undefined;
          const printedCost = Number(playedDefinition?.cardFace.cost ?? NaN);
          const exactPlayedProvenance = !!playedCard && playedCard.ownerPlayerId === playerId && playedCard.controllerPlayerId === playerId &&
            playedDefinition?.cardType === 'basic_attack' && Number.isSafeInteger(printedCost) && printedCost >= 0 &&
            !!playedState && playedState.faceDown === false && playedState.playedRound === s.round.roundNumber &&
            playedState.paidManaOnPlay === printedCost;
          if (!hasExactBasicStrengthDecisionRootKeys(decisionValue) || !hasExactBasicStrengthStageTwoInteractionKeys(interactionValue) ||
              !a || !isAcceptedBasicStrengthOpponentSkillFaceDownAbility(a, 'compiled') || !source ||
              source.ownerPlayerId !== playerId || source.controllerPlayerId !== playerId || d.controllerId !== playerId ||
              d.context.controllerId !== playerId || d.context.sourceCardId !== meta.sourceCardInstanceId || d.context.abilityId !== meta.abilityId ||
              !isExactBasicStrengthDecisionContext(d.context, meta.selectedAttackId) || !exactPlayedProvenance || !exactTarget || !exactEffects ||
              meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
              meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== r.revision ||
              meta.targetId !== 'opponent_servant_skill' || !isExactBasicStrengthInteractionConstraints(meta.constraints) ||
              !isExactBasicStrengthCandidateList(meta.candidateIds) || !exactPlayerArray(d.candidates, meta.candidateIds) ||
              d.min !== 1 || d.max !== 1 || !Array.isArray(selected) || selected.length !== 1 || new Set(selected).size !== 1 ||
              !meta.candidateIds.includes(selected[0]!) || !currentAllowed.includes(selected[0]!)) {
            reject('resolution_failed', 'Corrupt or stale FB2-53 stage-two interaction state');
          }
          const authoritativeContext = context(s, meta.sourceCardInstanceId, meta.abilityId);
          authoritativeContext.selections.strength_basic_attack = [meta.selectedAttackId];
          authoritativeContext.selections[meta.targetId] = [...selected];
          delete r.pendingDecision;
          resolveEffect(s, authoritativeContext, a.effects[1]!);
          break;
        }
        if (meta.kind === 'selected_played_attack_temporary_copy_v1') {
          if (!isExactSelectedPlayedAttackTemporaryCopyPersistedDecision(decisionValue)) {
            reject('resolution_failed', 'Corrupt or stale selected played-attack temporary-copy interaction state');
          }
          const source = s.cards.find((candidate) => candidate.instanceId === meta.sourceCardInstanceId);
          const a = source ? abilityDefinition(s, meta.sourceCardInstanceId, meta.abilityId) : undefined;
          const target = a?.targets[0];
          const effect = a?.effects[0];
          const currentAllowed = a ? selectedPlayedAttackTemporaryCopyCandidateIds(s, d.context) : [];
          const contextKeys = Object.keys(d.context).sort();
          const variables = d.context.variables; const selections = d.context.selections;
          const exactContext = exactPlayerArray(contextKeys, ['abilityId', 'controllerId', 'selections', 'sourceCardId', 'variables']) &&
            variables && typeof variables === 'object' && !Array.isArray(variables) && Object.keys(variables).length === 0 &&
            selections && typeof selections === 'object' && !Array.isArray(selections) && Object.keys(selections).length === 0;
          const exactTarget = !!target && JSON.stringify(d.target) === JSON.stringify(target);
          const exactEffects = !!effect && d.remainingEffects.length === 1 && JSON.stringify(d.remainingEffects[0]) === JSON.stringify(effect);
          if (!a || !isAcceptedSelectedPlayedAttackTemporaryCopyAbility(a, 'compiled') || !source ||
              source.ownerPlayerId !== playerId || source.controllerPlayerId !== playerId || d.controllerId !== playerId ||
              d.context.controllerId !== playerId || d.context.sourceCardId !== meta.sourceCardInstanceId || d.context.abilityId !== meta.abilityId ||
              !exactContext || !exactTarget || !exactEffects || meta.template !== 'target' || meta.visibility !== 'owner_only' ||
              meta.cancelPolicy !== 'forbidden' || meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== r.revision ||
              meta.targetId !== 'selected_attack' || meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'card' ||
              meta.constraints.min !== 1 || meta.constraints.max !== 1 || meta.constraints.distinct !== true || d.min !== 1 || d.max !== 1 ||
              !exactPlayerArray(d.candidates, meta.candidateIds) || new Set(meta.candidateIds).size !== meta.candidateIds.length ||
              !Array.isArray(selected) || selected.length !== 1 || new Set(selected).size !== 1 ||
              !meta.candidateIds.includes(selected[0]!) || !currentAllowed.includes(selected[0]!)) {
            reject('resolution_failed', 'Corrupt or stale selected played-attack temporary-copy interaction state');
          }
          const authoritativeContext = context(s, meta.sourceCardInstanceId, meta.abilityId);
          authoritativeContext.selections[meta.targetId] = [...selected];
          delete r.pendingDecision;
          resolveSelectedPlayedAttackTemporaryCopy(s, authoritativeContext, effect);
          break;
        }
        if (meta.kind === 'structured_each_player_option_v1') {
          const pending = r.pendingStructuredEachPlayerOption;
          const source = s.cards.find((candidate) => candidate.instanceId === meta.sourceCardInstanceId);
          const a = source ? abilityDefinition(s, meta.sourceCardInstanceId, meta.abilityId) : undefined;
          const currentChoice = a?.effects.find((effect) => JSON.stringify(effect) === JSON.stringify(pending?.choice));
          const expectedRemaining = pending?.remainingDecisionPlayerIds ?? [];
          const exactTarget = d.target.type === 'choice' && d.target.id === 'm50_each_player_option' &&
            exactPlayerArray(nodes(d.target.options).map((option) => str(option.id)), meta.optionIds);
          if (!pending || !a || !source || !currentChoice || !isStructuredEachPlayerOptionEffect(currentChoice) ||
              pending.sourceCardId !== meta.sourceCardInstanceId || pending.abilityId !== meta.abilityId ||
              pending.initiatingControllerId !== meta.initiatingControllerId || source.controllerPlayerId !== meta.initiatingControllerId ||
              d.controllerId !== meta.decisionPlayerId || d.context.controllerId !== meta.initiatingControllerId ||
              !exactPlayerArray(expectedRemaining, meta.remainingDecisionPlayerIds) || expectedRemaining[0] !== meta.decisionPlayerId ||
              !exactPlayerArray(pending.optionIds, meta.optionIds) || !exactPlayerArray(d.candidates, meta.optionIds) ||
              meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
              meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== r.revision ||
              meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'option' || meta.constraints.min !== 1 || meta.constraints.max !== 1 || meta.constraints.distinct !== true ||
              d.min !== 1 || d.max !== 1 || d.remainingEffects.length !== 0 || !exactTarget ||
              !Array.isArray(selected) || selected.length !== 1 || !meta.optionIds.includes(selected[0]!)) {
            reject('resolution_failed', 'Corrupt or stale structured each-player option state');
          }
          const option = nodes(currentChoice.options).find((candidate) => str(candidate.id) === selected[0]);
          if (!option) reject('illegal_target', 'Structured each-player option is no longer valid');
          const nestedContext = structuredClone(pending.context);
          nestedContext.selections.decisionPlayerId = [meta.decisionPlayerId];
          nestedContext.selections.choiceId = [selected[0]!];
          nestedContext.selections.optionId = [selected[0]!];
          delete r.pendingDecision;
          for (const nestedEffect of nodes(option.effects)) resolveEffect(s, nestedContext, nestedEffect);
          pending.remainingDecisionPlayerIds.shift();
          stageNextStructuredEachPlayerOptionDecision(s);
          break;
        }
        if (meta.kind === 'opponent_close_selected_one_non_residual_v1') {
          if (!hasExactOpponentCloseToOneDecisionRootKeys(d) || !hasExactOpponentCloseSelectedOneInteractionRootKeys(meta)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-selected-one interaction state');
          }
          const decisionContext: unknown = d.context;
          const decisionTarget: unknown = d.target;
          if (!isExactOpponentCloseToOneContext(decisionContext) || !isExactOpponentCloseSelectedOneTarget(decisionTarget)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-selected-one interaction state');
          }
          const source = s.cards.find((candidate) => candidate.instanceId === meta.sourceCardInstanceId);
          const ability = source ? abilityDefinition(s, meta.sourceCardInstanceId, meta.abilityId) : undefined;
          const facts = source ? opponentCloseSelectedOneFacts(s, source.instanceId) : undefined;
          const candidateIds = meta.candidateIds;
          const exactCandidates = Array.isArray(candidateIds) && candidateIds.length >= 1 &&
            candidateIds.every((id) => typeof id === 'string' && id.length > 0) && new Set(candidateIds).size === candidateIds.length;
          const exactOwners = exactCandidates && isExactPlayerOwnerMap(meta.candidateOwners, candidateIds) &&
            !!facts && Object.keys(facts.candidateOwners).length === candidateIds.length &&
            candidateIds.every((id) => facts.candidateOwners[id] === meta.candidateOwners[id]);
          if (!ability || !isAcceptedOpponentCloseOneNonResidualAbility(ability, 'compiled') || !source || !facts ||
              facts.controllerId !== meta.initiatingControllerId || facts.decisionPlayerId !== meta.decisionPlayerId || facts.battlefieldId !== meta.battlefieldId ||
              !exactCandidates || !exactOwners || !exactPlayerArray(facts.candidateIds, candidateIds) ||
              d.controllerId !== meta.decisionPlayerId || playerId !== meta.decisionPlayerId || decisionContext.controllerId !== meta.initiatingControllerId ||
              decisionContext.sourceCardId !== meta.sourceCardInstanceId || decisionContext.abilityId !== meta.abilityId ||
              meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
              meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== r.revision ||
              !isExactOpponentCloseToOneConstraints(meta.constraints) || d.min !== 1 || d.max !== 1 ||
              !Array.isArray(d.remainingEffects) || d.remainingEffects.length !== 0 || !exactPlayerArray(d.candidates, candidateIds) ||
              !Array.isArray(selected) || selected.length !== 1 || !candidateIds.includes(selected[0]!)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-selected-one interaction state');
          }
          const selectedCardId = selected[0]!;
          closeOpponentCardForCloseToOne(s, meta.decisionPlayerId, selectedCardId);
          delete r.pendingDecision;
          const closed = card(s, selectedCardId);
          r.events.push({ type: 'opponent_card_closed_selected_one', playerId: meta.decisionPlayerId, controllerId: meta.initiatingControllerId,
            sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, cardInstanceId: selectedCardId, toZone: closed.zone });
          break;
        }
        if (meta.kind === 'opponent_close_non_residual_to_one_v1') {
          if (!hasExactOpponentCloseToOneDecisionRootKeys(d) || !hasExactOpponentCloseToOneInteractionRootKeys(meta)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-to-one interaction state');
          }
          const decisionContext: unknown = d.context;
          const decisionTarget: unknown = d.target;
          if (!isExactOpponentCloseToOneContext(decisionContext) || !isExactOpponentCloseToOneTarget(decisionTarget)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-to-one interaction state');
          }
          const a = abilityDefinition(s, decisionContext.sourceCardId, decisionContext.abilityId);
          const pendingQueueValue: unknown = r.pendingOpponentCloseToOne;
          if (!isExactOpponentCloseToOneQueue(s, pendingQueueValue)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-to-one queue state');
          }
          const pendingQueue = pendingQueueValue;
          const pending = pendingQueue[0]!;
          if (!opponentCloseToOneQueueMatchesServerAuthority(s, pendingQueue)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-to-one server authority');
          }
          const source = s.cards.find((candidate) => candidate.instanceId === decisionContext.sourceCardId);
          const sourceState: unknown = source ? r.cardState[source.instanceId] : undefined;
          const initiatingController = s.players.find((candidate) => candidate.id === meta.initiatingControllerId);
          const decisionPlayer = s.players.find((candidate) => candidate.id === meta.decisionPlayerId);
          const exactSyntheticTarget = true;
          const pendingQualifyingCardIds: unknown = pending?.qualifyingCardIds;
          const metaQualifyingCardIds: unknown = meta.qualifyingCardIds;
          const metaConstraints: unknown = meta.constraints;
          const metaRemainingDecisionPlayerIds: unknown = meta.remainingDecisionPlayerIds;
          const decisionCandidates: unknown = d.candidates;
          if (!isAcceptedOpponentCloseToOneAbility(a, 'compiled') || !pending || !source || !initiatingController || !decisionPlayer ||
              initiatingController.status !== 'active' || decisionPlayer.status !== 'active' ||
              initiatingController.locationId !== meta.battlefieldId || decisionPlayer.locationId !== meta.battlefieldId ||
              !isBattlefield(s, meta.battlefieldId) || source.ownerPlayerId !== meta.initiatingControllerId ||
              source.controllerPlayerId !== meta.initiatingControllerId || !isValidOpponentCloseToOneSourceCardState(sourceState) || sourceState.faceDown ||
              d.controllerId !== meta.decisionPlayerId || decisionContext.controllerId !== meta.initiatingControllerId ||
              pending.initiatingControllerId !== meta.initiatingControllerId || pending.decisionPlayerId !== meta.decisionPlayerId ||
              pending.sourceCardId !== meta.sourceCardInstanceId || pending.abilityId !== meta.abilityId ||
              pending.battlefieldId !== meta.battlefieldId || !exactFrozenCardIdList(pendingQualifyingCardIds, metaQualifyingCardIds) ||
              !exactPlayerOwnerMap(pending.qualifyingCardOwners, meta.qualifyingCardOwners, metaQualifyingCardIds) ||
              !isExactNonEmptyPlayerIdList(metaRemainingDecisionPlayerIds) ||
              !exactPlayerArray(pending.remainingDecisionPlayerIds, metaRemainingDecisionPlayerIds) ||
              !exactPlayerArray(metaRemainingDecisionPlayerIds, pendingQueue.map((entry) => entry.decisionPlayerId)) ||
              meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
              meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== r.revision ||
              meta.sourceCardInstanceId !== decisionContext.sourceCardId || meta.abilityId !== decisionContext.abilityId ||
              !isExactOpponentCloseToOneConstraints(metaConstraints) || !exactSyntheticTarget || !Array.isArray(d.remainingEffects) || d.remainingEffects.length !== 0 ||
              d.min !== 1 || d.max !== 1 || !exactFrozenCardIdList(decisionCandidates, metaQualifyingCardIds) ||
              !Array.isArray(selected) || selected.length !== 1 || !d.candidates.includes(selected[0]!) ||
              !exactFrozenCardIdList(qualifyingOpponentCloseToOneCardIds(s, meta.decisionPlayerId), metaQualifyingCardIds) ||
              !livePlayerOwnersMatchFrozen(s, meta.qualifyingCardOwners, metaQualifyingCardIds)) {
            reject('resolution_failed', 'Corrupt or stale opponent close-to-one interaction state');
          }
          const selectedCardId = selected[0]!;
          const closeIds = meta.qualifyingCardIds.filter((instanceId) => instanceId !== selectedCardId);
          if (closeIds.some((instanceId) => isCardCloseForbidden(s, instanceId))) {
            reject('resolution_failed', 'Opponent close-to-one contains a card protected from closing');
          }
          for (const instanceId of closeIds) closeOpponentCardForCloseToOne(s, meta.decisionPlayerId, instanceId);
          delete r.pendingDecision;
          pendingQueue.shift();
          advanceOpponentCloseToOneServerAuthority(s);
          if (pendingQueue.length === 0) clearOpponentCloseToOneServerAuthority(s);
          for (const instanceId of closeIds) {
            const closed = card(s, instanceId);
            r.events.push({ type: 'opponent_card_closed_to_one', playerId: meta.decisionPlayerId, controllerId: meta.initiatingControllerId,
              sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, cardInstanceId: instanceId, toZone: closed.zone });
          }
          stageNextOpponentCloseToOneDecision(s);
          break;
        }
        const a = abilityDefinition(s, d.context.sourceCardId, d.context.abilityId);
        if (meta.kind === 'combat_opponent_power_vp_reward_v1') {
          const pendingQueue = r.pendingCombatOpponentPowerVpRewards;
          const pending = pendingQueue?.[0];
          const source = s.cards.find((candidate) => candidate.instanceId === d.context.sourceCardId);
          const frozenRoot = r.trustedBattleResultSnapshots?.[meta.resultId];
          const exactSyntheticTarget = d.target.id === 'resolved_battle_opponent' && d.target.type === 'player' &&
            Number(node(d.target.count).min) === 1 && Number(node(d.target.count).max) === 1;
          const rootPowers = frozenRoot?.battleParticipantPowers;
          if (!isAcceptedCombatOpponentPowerVpRewardAbility(a, 'compiled') || !pending ||
            !source || source.controllerPlayerId !== d.controllerId || !active(s, source.instanceId) ||
            d.context.controllerId !== d.controllerId || pending.controllerId !== d.controllerId ||
            meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' ||
            meta.continuationRef !== `${d.id}:continuation` || meta.createdRevision !== r.revision ||
            meta.sourceCardInstanceId !== d.context.sourceCardId || meta.abilityId !== d.context.abilityId ||
            pending.sourceCardId !== meta.sourceCardInstanceId || pending.abilityId !== meta.abilityId ||
            pending.triggerEventId !== meta.triggerEventId || pending.battlePhaseResolutionId !== meta.battlePhaseResolutionId ||
            pending.battleId !== meta.battleId || pending.resultId !== meta.resultId || pending.battlefieldId !== meta.battlefieldId ||
            !exactPlayerArray(pending.participantIds, meta.participantIds) || !exactPlayerArray(pending.opponentIds, meta.opponentIds) ||
            !exactPlayerPowerMap(pending.participantPowers, meta.participantPowers, meta.participantIds) ||
            !frozenRoot || frozenRoot.battlePhaseResolutionId !== meta.battlePhaseResolutionId || frozenRoot.battleId !== meta.battleId ||
            frozenRoot.resultId !== meta.resultId || frozenRoot.battlefieldId !== meta.battlefieldId ||
            !exactPlayerArray(frozenRoot.battleParticipantIds, meta.participantIds) || !rootPowers ||
            !exactPlayerPowerMap(rootPowers, meta.participantPowers, meta.participantIds) ||
            meta.divisor !== COMBAT_OPPONENT_POWER_VP_REWARD_DIVISOR ||
            meta.constraints.kind !== 'target' || meta.constraints.targetKind !== 'player' || meta.constraints.min !== 1 ||
            meta.constraints.max !== 1 || meta.constraints.distinct !== true || !exactSyntheticTarget ||
            d.min !== 1 || d.max !== 1 || !exactPlayerArray(d.candidates, meta.opponentIds) ||
            new Set(d.candidates).size !== d.candidates.length || meta.opponentIds.includes(d.controllerId) ||
            meta.opponentIds.length !== meta.participantIds.length - 1 ||
            !meta.participantIds.includes(d.controllerId) || meta.participantIds.some((id) =>
              id === d.controllerId ? meta.opponentIds.includes(id) : !meta.opponentIds.includes(id)) ||
            !Array.isArray(selected) || selected.length !== 1 || !meta.opponentIds.includes(selected[0]!) ||
            !Number.isSafeInteger(meta.participantPowers[selected[0]!] ?? NaN) || Number(meta.participantPowers[selected[0]!]) < 0) {
            reject('resolution_failed', 'Corrupt or stale combat-opponent power reward interaction state');
          }
          const selectedPlayerId = selected[0]!;
          const rewardVp = Math.floor(meta.participantPowers[selectedPlayerId]! / COMBAT_OPPONENT_POWER_VP_REWARD_DIVISOR);
          const recipient = player(s, d.controllerId);
          const before = recipient.vp;
          delete r.pendingDecision;
          pendingQueue.shift();
          recipient.vp += rewardVp;
          recordAuthoritativeVictoryPointChange(s, recipient.id, before, recipient.vp, 'combat-power-reward-vp');
          r.events.push({
            type: 'victory_points_adjusted', playerId: d.controllerId, sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId,
            delta: rewardVp, before, after: recipient.vp, triggerEventId: meta.triggerEventId,
          });
          stageNextCombatOpponentPowerVpRewardDecision(s);
          break;
        }
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
          delete r.pendingDecision; targetPlayer.locationId = to;
          processTrustedMovementEntryEvent(s, { id: nextId(s, 'ruler-seal-enter-location'), type: 'after_controller_enters_location', playerId: meta.boundPlayerId, locationId: to }, from, to);
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
      if (d.target.type === 'm50_structured_choice') {
        const structuredChoice = node(d.target.effect);
        if (structuredChoice.distinctBasePower === true) {
          const powers = selected.map((instanceId) => Number(definition(s, instanceId)?.cardFace.basePower));
          if (powers.some((power) => !Number.isSafeInteger(power)) || new Set(powers).size !== powers.length) {
            reject('illegal_target', 'Structured card choice requires distinct printed base power');
          }
        }
        if (structuredChoice.totalPlayCostAtMostMana === true) {
          let total = 0;
          for (const instanceId of selected) {
            const value = effectiveCardManaCost(s, instanceId);
            if (value === undefined) reject('invalid_cost', 'Structured selected-card play cost is invalid');
            total += value;
            if (!Number.isSafeInteger(total)) reject('invalid_cost', 'Structured selected-card play cost exceeds safe integer range');
          }
          if (total > player(s, d.context.controllerId).mana) {
            reject('illegal_target', 'Structured selected cards exceed authoritative available mana');
          }
        }
      }
      d.context.selections[str(d.target.id)] = selected; delete r.pendingDecision;
      executeEffects(s, d.context, d.remainingEffects); break;
    }
    case 'resolve_response': {
      const w = r.responseWindows[0];
      if (!w || w.controllerId !== playerId || w.id !== command.windowId || !legal.some(a => a.type === command.type && a.cardInstanceId === command.cardInstanceId && a.abilityId === command.abilityId)) reject('illegal_response', 'Response is not available');
      try {
        executeAbility(s, context(s, command.cardInstanceId, command.abilityId, w.event));
      } catch (error) {
        const responseAbility = abilityDefinition(s, command.cardInstanceId, command.abilityId);
        if (error instanceof RuleRejection && isPlaySourceCardWithCostResponseRouteCandidate(responseAbility)) {
          reject('illegal_response', error.message);
        }
        throw error;
      }
      runtime(s).responseWindows.shift(); break;
    }
    case 'pass': case 'decline_this_window': {
      const w = r.responseWindows[0]; if (!w || w.controllerId !== playerId || w.id !== command.windowId) reject('illegal_response', 'Window is not available');
      r.responseWindows.shift(); break;
    }
    default: reject('illegal_action', 'Unsupported client command');
  }
  reconcileB05LowManaClosures(s); cleanupOngoing(s); checkFormulaTriggers(s);
}
/** All eligibility/costs are checked against the pre-payment state; all cards activate before triggers. */
function playBatch(s: GameState, playerId: string, choices: PlayCardAction[], quota: 'regular' | 'effect' = 'regular', waiveManaCost = false, allowedSourceZones: readonly string[] = ['hand', 'skill'], bypassFaceUpPlayLimit = false): void {
  if (new Set(choices.map(c => c.cardInstanceId)).size !== choices.length) reject('illegal_action', 'Duplicate card in play batch');
  if (choices.length > 1 && choices.some((choice) => cardRequiresSoloPlay(s, choice.cardInstanceId))) {
    reject('play_forbidden', 'This card must be played alone');
  }
  const faceUpChoiceCount = choices.filter((choice) => choice.faceDown !== true).length;
  if (!bypassFaceUpPlayLimit && faceUpChoiceCount > 0 && faceUpCardPlayLimitReached(s, playerId, faceUpChoiceCount)) {
    reject('face_up_card_play_limit_reached', 'Face-up card play limit reached for this round');
  }
  const requiredAdditionalIds = new Set(choices
    .filter(c => isRequiredAdditionalPlayCard(s, c.cardInstanceId))
    .map(c => c.cardInstanceId));
  const regularPlan = quota === 'regular' ? regularAttackSelectionPlan(s, playerId, choices) : undefined;
  const rawRegularAttackChoices = choices.filter(c => entersAttackArea(s, c.cardInstanceId) && !requiredAdditionalIds.has(c.cardInstanceId)).length;
  const regularAttackChoices = quota === 'regular' ? regularPlan?.regularAttackCount ?? rawRegularAttackChoices : rawRegularAttackChoices;
  if (quota === 'regular' && !regularPlan) reject('attack_play_limit_reached', 'Attack play limit reached for this round');
  if (quota === 'regular' && requiredAdditionalIds.size > 0 && regularAttackChoices === 0) {
    reject('append_only', 'Required additional-play cards need a regular attack in the same batch');
  }
  let cost = 0;
  const paidManaByCard = new Map<string, number>();
  for (const c of choices) {
    const allowRequiredAdditional = quota === 'regular' && requiredAdditionalIds.has(c.cardInstanceId) && regularAttackChoices > 0;
    const failure = playFailure(s, playerId, c.cardInstanceId, c.faceDown === true, true, quota === 'effect', quota === 'effect', allowRequiredAdditional, waiveManaCost, allowedSourceZones, bypassFaceUpPlayLimit);
    if (failure) reject(failure, 'Card cannot be played in this batch');
    const printedCost = Number(definition(s, c.cardInstanceId)!.cardFace.cost ?? 0);
    const appendSurcharge = quota === 'regular' && regularPlan?.structuredAppendId === c.cardInstanceId ? regularPlan.structuredAppendExtraCost ?? 0 : 0;
    const cardCostBeforeMultiplier = printedCost + ownedDefinitionCardRuleAdjustment(s, c.cardInstanceId).cost + b02OwnedBasicAttackAdjustment(s, c.cardInstanceId).cost + m50AdditiveCardAdjustment(s, c.cardInstanceId).cost + structuredOngoingCardCostAdjustment(s, c.cardInstanceId);
    const paidMana = !waiveManaCost && !c.faceDown ? cardCostBeforeMultiplier * m50LinkedPlayerCardMultipliers(s, c.cardInstanceId).cost + appendSurcharge : 0;
    if (!Number.isSafeInteger(paidMana) || paidMana < 0) reject('invalid_cost', 'Card paid mana provenance must be a nonnegative safe integer');
    paidManaByCard.set(c.cardInstanceId, paidMana);
    cost += paidMana;
  }
  if (cost > player(s, playerId).mana) reject('insufficient_mana', 'Cannot pay aggregate batch cost');
  const playedCards = choices.map(c => ({ instanceId: c.cardInstanceId, controllerId: playerId,
    cardType: definition(s, c.cardInstanceId)!.cardType, faceDown: !!c.faceDown }));
  player(s, playerId).mana -= cost;
  if (cost > 0) recordAuthoritativeManaSpend(s, playerId, cost);
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
        const cardCost = paidManaByCard.get(c.cardInstanceId) ?? Number(d.cardFace.cost ?? 0);
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
    processTrustedCardPlayEvent(s, { id: nextId(s, 'play'), type: 'on_card_played', playerId, sourceCardId: c.cardInstanceId, playedCards });
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
