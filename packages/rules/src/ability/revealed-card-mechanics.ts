import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

export const GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID = 'granted-basic-double-base-remove-after-battle';

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

export function isSourceRevealedCondition(value: RuleNode): boolean {
  return value.type === 'source_revealed' && exactKeys(value, ['type']);
}

export function isGrantBasicDoubleRemoveEffect(value: RuleNode): boolean {
  return value.type === 'grant_controller_basic_attack_double_base_remove_action_while_source_revealed' &&
    value.manaCost === 2 && value.basePowerMultiplier === 2 && value.removeAfter === 'after_battle_ended' &&
    exactKeys(value, ['type', 'manaCost', 'basePowerMultiplier', 'removeAfter']);
}

export function isConditionalAttributeGrantEffect(value: RuleNode): boolean {
  return value.type === 'gain_attribute_if_owned_definition_revealed' &&
    typeof value.definitionId === 'string' && value.definitionId.length > 0 &&
    ['力量', '迅捷', '魔术', '特殊', '宝具'].includes(String(value.attribute)) &&
    exactKeys(value, ['type', 'definitionId', 'attribute']);
}

export function isGainManaEqualSelectedPaidCostEffect(value: RuleNode): boolean {
  return value.type === 'gain_mana_equal_selected_card_paid_cost' && typeof value.target === 'string' && value.target.length > 0 &&
    exactKeys(value, ['type', 'target']);
}

export function isEventBattleOpponentAttackConstraint(value: RuleNode): boolean {
  return value.type === 'controlled_by_event_battle_opponent_at_controller_location' && exactKeys(value, ['type']);
}

export function isGrantedBasicDoubleRemoveEffect(value: RuleNode): boolean {
  return value.type === 'double_source_base_power_and_remove_after_battle' &&
    value.basePowerMultiplier === 2 && value.removeAfter === 'after_battle_ended' &&
    exactKeys(value, ['type', 'basePowerMultiplier', 'removeAfter']);
}

export function physicalCardWasRevealed(state: GameState, cardInstanceId: string): boolean {
  const runtime = state.abilityRuntime;
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  const cardState = runtime?.cardState[cardInstanceId];
  return !!runtime && !!card && !!cardState && cardState.faceDown === false &&
    Number(runtime.cardPlayCountByInstance?.[cardInstanceId] ?? 0) > 0;
}

export function ownedDefinitionWasRevealed(state: GameState, controllerId: string, definitionId: string): boolean {
  return state.cards.some((candidate) => candidate.definitionId === definitionId &&
    candidate.ownerPlayerId === controllerId && candidate.controllerPlayerId === controllerId &&
    physicalCardWasRevealed(state, candidate.instanceId));
}

export function conditionalRevealedSourceAttributes(state: GameState, cardInstanceId: string): string[] {
  const runtime = state.abilityRuntime;
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  const definition = card && runtime?.pack.cards[card.definitionId];
  if (!runtime || !card || !definition) return [];
  const attributes: string[] = [];
  for (const ability of definition.abilities) {
    for (const effect of ability.effects) {
      if (!isConditionalAttributeGrantEffect(effect)) continue;
      if (ownedDefinitionWasRevealed(state, card.controllerPlayerId, String(effect.definitionId))) {
        const attribute = String(effect.attribute);
        if (!attributes.includes(attribute)) attributes.push(attribute);
      }
    }
  }
  return attributes;
}

function controllerHasRevealedGrantSource(state: GameState, controllerId: string): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  return state.cards.some((candidate) => candidate.ownerPlayerId === controllerId && candidate.controllerPlayerId === controllerId &&
    physicalCardWasRevealed(state, candidate.instanceId) &&
    runtime.pack.cards[candidate.definitionId]?.abilities.some((ability) =>
      ability.effects.some(isGrantBasicDoubleRemoveEffect)) === true);
}

export function grantedBasicDoubleRemoveAbility(state: GameState, cardInstanceId: string): AuthoringAbility | undefined {
  const runtime = state.abilityRuntime;
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  const definition = card && runtime?.pack.cards[card.definitionId];
  if (!runtime || !card || !definition || definition.cardType !== 'basic_attack' ||
      card.ownerPlayerId !== card.controllerPlayerId || !controllerHasRevealedGrantSource(state, card.controllerPlayerId)) return undefined;
  return {
    id: GRANTED_BASIC_DOUBLE_REMOVE_ABILITY_ID,
    kind: 'phase_action',
    printedClause: 'Action: Pay 2 mana. Double this card base power. Remove it from the game after battle.',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [],
    effects: [{ type: 'double_source_base_power_and_remove_after_battle', basePowerMultiplier: 2, removeAfter: 'after_battle_ended' }],
    cost: [{ type: 'pay_mana', amount: 2 }], ruleModifiers: [], creates: [], lifecycle: {},
    responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

export function effectiveAbilitiesForPhysicalCard(state: GameState, cardInstanceId: string): AuthoringAbility[] {
  const runtime = state.abilityRuntime;
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  const authored = card && runtime?.pack.cards[card.definitionId]?.abilities;
  if (!authored) return [];
  const granted = grantedBasicDoubleRemoveAbility(state, cardInstanceId);
  return granted ? [...authored, granted] : authored;
}
