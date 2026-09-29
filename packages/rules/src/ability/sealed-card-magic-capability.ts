import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

export const ROUND_DEFINITION_ATTRIBUTE_REPLACEMENT_EFFECT = 'round_definition_attribute_replacement' as const;
export const ATTACK_ATTRIBUTE_OTHER_PLAYER_PROTECTION_EFFECT = 'attack_attribute_other_player_protection' as const;
export const ARM_AFTER_BATTLE_SEAL_EFFECT = 'arm_after_battle_seal_basic_attack' as const;
export const PLAY_SEALED_ATTACKS_EFFECT = 'play_all_sealed_attacks' as const;

const PRESENT_SOURCE_ZONES = new Set(['hand', 'skill', 'field', 'attack_area']);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function safeKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value);
}
function safeDefinitionIds(value: unknown, exactCount: number): value is string[] {
  return Array.isArray(value) && value.length === exactCount && new Set(value).size === value.length &&
    value.every((entry) => safeKey(entry));
}
function exactStringList(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((entry, index) => entry === expected[index]);
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function emptyCommon(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && empty(ability.lifecycle) &&
    empty(ability.limit) && automaticNoHost(ability) && standardResponse(ability);
}
function phaseAction(ability: AuthoringAbility, phase: 'action' | 'combat', requireActive: boolean): boolean {
  const expected = requireActive ? ['phase', 'opens', 'requiresSourceState'] : ['phase', 'opens'];
  const opens = phase === 'combat' ? 'controller_combat_action_window' : 'controller_action_window';
  return ability.kind === 'phase_action' && ability.activation.phase === phase && ability.activation.opens === opens &&
    (!requireActive || ability.activation.requiresSourceState === 'active') && exactKeys(ability.activation, expected);
}
function exactReveal(ability: AuthoringAbility): boolean {
  return ability.visibility.revealsTrueName === true && ability.visibility.revealTiming === 'on_use_declared' &&
    ability.visibility.revealScope === 'servant_package' && exactKeys(ability.visibility, ['revealsTrueName', 'revealTiming', 'revealScope']);
}

export function isRoundDefinitionAttributeReplacementEffect(value: RuleNode): boolean {
  return value.type === ROUND_DEFINITION_ATTRIBUTE_REPLACEMENT_EFFECT && safeDefinitionIds(value.targetDefinitionIds, 2) &&
    exactStringList(value.replaceAttributes, ['魔术']) && value.duration === 'this_round' &&
    exactKeys(value, ['type', 'targetDefinitionIds', 'replaceAttributes', 'duration']);
}
export function isAttackAttributeOtherPlayerProtectionEffect(value: RuleNode): boolean {
  return value.type === ATTACK_ATTRIBUTE_OTHER_PLAYER_PROTECTION_EFFECT && value.attribute === '魔术' &&
    value.sourcePlayers === 'other_players' && exactStringList(value.prevent, ['deactivation', 'power_reduction']) &&
    value.duration === 'while_source_present' &&
    exactKeys(value, ['type', 'attribute', 'sourcePlayers', 'prevent', 'duration']);
}
export function isArmAfterBattleSealEffect(value: RuleNode): boolean {
  return value.type === ARM_AFTER_BATTLE_SEAL_EFFECT && safeKey(value.sealKey) && value.cardKind === 'basic_attack' &&
    value.eligibleAttribute === '魔术' && safeDefinitionIds(value.eligibleDefinitionIds, 2) && value.sameLocation === true &&
    value.trigger === 'after_battle_ended' && exactKeys(value, [
      'type', 'sealKey', 'cardKind', 'eligibleAttribute', 'eligibleDefinitionIds', 'sameLocation', 'trigger',
    ]);
}
export function isPlaySealedAttacksEffect(value: RuleNode): boolean {
  return value.type === PLAY_SEALED_ATTACKS_EFFECT && safeKey(value.sealKey) && value.payCardCosts === true &&
    value.resealMana === 1 && value.discardDestination === 'controller_discard' && value.dispositionTrigger === 'after_battle_ended' &&
    exactKeys(value, ['type', 'sealKey', 'payCardCosts', 'resealMana', 'discardDestination', 'dispositionTrigger']);
}

export function isAcceptedRoundDefinitionAttributeReplacementAbility(ability: AuthoringAbility): boolean {
  return phaseAction(ability, 'action', false) && ability.effects.length === 1 &&
    isRoundDefinitionAttributeReplacementEffect(ability.effects[0]!) && emptyCommon(ability) && empty(ability.visibility);
}
export function isAcceptedAttackAttributeOtherPlayerProtectionAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' && empty(ability.activation) && ability.effects.length === 1 &&
    isAttackAttributeOtherPlayerProtectionEffect(ability.effects[0]!) && emptyCommon(ability) && empty(ability.visibility);
}
export function isAcceptedAfterBattleSealAbility(ability: AuthoringAbility): boolean {
  return phaseAction(ability, 'combat', true) && ability.effects.length === 1 && isArmAfterBattleSealEffect(ability.effects[0]!) &&
    emptyCommon(ability) && exactReveal(ability);
}
export function isAcceptedPlaySealedAttacksAbility(ability: AuthoringAbility): boolean {
  return phaseAction(ability, 'action', true) && ability.effects.length === 1 && isPlaySealedAttacksEffect(ability.effects[0]!) &&
    emptyCommon(ability) && exactReveal(ability);
}
export function isAcceptedSealedCardMagicAbility(ability: AuthoringAbility): boolean {
  return isAcceptedRoundDefinitionAttributeReplacementAbility(ability) ||
    isAcceptedAttackAttributeOtherPlayerProtectionAbility(ability) ||
    isAcceptedAfterBattleSealAbility(ability) || isAcceptedPlaySealedAttacksAbility(ability);
}

const privilegedTypes = new Set<string>([
  ROUND_DEFINITION_ATTRIBUTE_REPLACEMENT_EFFECT,
  ATTACK_ATTRIBUTE_OTHER_PLAYER_PROTECTION_EFFECT,
  ARM_AFTER_BATTLE_SEAL_EFFECT,
  PLAY_SEALED_ATTACKS_EFFECT,
]);
export function containsSealedCardMagicPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSealedCardMagicPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const current = value as RuleNode;
  if (privilegedTypes.has(String(current.type))) return true;
  return Object.values(current).some(containsSealedCardMagicPrivilegedNode);
}

export function sealedCardMagicKeyFromAbility(ability: AuthoringAbility): string | undefined {
  if (!isAcceptedAfterBattleSealAbility(ability) && !isAcceptedPlaySealedAttacksAbility(ability)) return undefined;
  const key = ability.effects[0]?.sealKey;
  return safeKey(key) ? key : undefined;
}
export function isValidSealedCardMagicKey(value: unknown): value is string { return safeKey(value); }

export function roundDefinitionReplacementForCard(state: GameState, cardInstanceId: string): string[] | undefined {
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!card) return undefined;
  const record = state.abilityRuntime?.roundDefinitionAttributeReplacements?.[card.controllerPlayerId];
  if (!record || record.round !== state.round.roundNumber || !record.targetDefinitionIds.includes(card.definitionId)) return undefined;
  return [...record.replaceAttributes];
}

export function sourcePresentForAcceptedCapability(state: GameState, sourceCardId: string, controllerId: string): boolean {
  const source = state.cards.find((candidate) => candidate.instanceId === sourceCardId);
  return !!source && source.ownerPlayerId === controllerId && source.controllerPlayerId === controllerId && PRESENT_SOURCE_ZONES.has(source.zone);
}

export function controllerHasOtherPlayerAttackProtection(
  state: GameState,
  targetCardInstanceId: string,
  effectControllerId: string,
  effectiveAttributes: readonly string[],
): boolean {
  const target = state.cards.find((candidate) => candidate.instanceId === targetCardInstanceId);
  if (!target || target.controllerPlayerId === effectControllerId || target.zone !== 'attack_area') return false;
  const protectedControllerId = target.controllerPlayerId;
  return state.cards.some((source) => {
    if (!sourcePresentForAcceptedCapability(state, source.instanceId, protectedControllerId)) return false;
    const definition = state.abilityRuntime?.pack.cards[source.definitionId];
    return !!definition?.abilities.some((ability) => {
      if (!isAcceptedAttackAttributeOtherPlayerProtectionAbility(ability)) return false;
      const effect = ability.effects[0]!;
      return effectiveAttributes.includes(String(effect.attribute));
    });
  });
}
