import type { GameState } from '../schema/game';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

export const CONTROLLER_ATTACK_ATTRIBUTE_POWER_BONUS_EFFECT = 'controller_attack_attribute_power_bonus' as const;
export const CONDITIONAL_DEFINITION_ADDITIONAL_PLAY_EFFECT = 'conditional_definition_additional_play' as const;

function rec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exact(value: unknown, keys: readonly string[]): boolean {
  if (!rec(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function empty(value: unknown): boolean { return rec(value) && Object.keys(value).length === 0; }
function def(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]{0,191}$/i.test(value);
}

export function isControllerAttackAttributePowerBonusEffect(value: RuleNode): boolean {
  return value.type === CONTROLLER_ATTACK_ATTRIBUTE_POWER_BONUS_EFFECT &&
    value.attribute === '力量' && value.amount === 4 &&
    exact(value, ['type', 'attribute', 'amount']);
}

export function isConditionalDefinitionAdditionalPlayEffect(value: RuleNode): boolean {
  return value.type === CONDITIONAL_DEFINITION_ADDITIONAL_PLAY_EFFECT &&
    def(value.definitionId) && value.minimumControllerMana === 8 && value.additionalManaCost === 2 &&
    exact(value, ['type', 'definitionId', 'minimumControllerMana', 'additionalManaCost']);
}

function passiveShell(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' &&
    exact(ability.activation, ['trigger']) && ability.activation.trigger === 'while_active' &&
    ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && ability.effects.length === 1 &&
    empty(ability.lifecycle) && empty(ability.limit) && empty(ability.visibility) &&
    exact(ability.responseWindow, ['order', 'passBehavior']) &&
    ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window' &&
    ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}

export function isAcceptedConditionalAdditionalPlayAbility(ability: AuthoringAbility): boolean {
  if (!passiveShell(ability)) return false;
  const effect = ability.effects[0]!;
  return isControllerAttackAttributePowerBonusEffect(effect) || isConditionalDefinitionAdditionalPlayEffect(effect);
}

export function containsConditionalAdditionalPlayPrivilegedNode(ability: AuthoringAbility): boolean {
  return ability.effects.some((effect) =>
    effect.type === CONTROLLER_ATTACK_ATTRIBUTE_POWER_BONUS_EFFECT ||
    effect.type === CONDITIONAL_DEFINITION_ADDITIONAL_PLAY_EFFECT);
}

function liveProvider(state: GameState, sourceId: string, ability: AuthoringAbility): ExecutableCardDefinition | undefined {
  const runtime = state.abilityRuntime;
  if (!runtime || !isAcceptedConditionalAdditionalPlayAbility(ability)) return undefined;
  const source = state.cards.find((card) => card.instanceId === sourceId);
  const sourceState = source ? runtime.cardState[source.instanceId] : undefined;
  if (!source || source.ownerPlayerId !== source.controllerPlayerId || !['field', 'attack_area'].includes(source.zone) ||
      !sourceState?.active || sourceState.faceDown) return undefined;
  const definition = runtime.pack.cards[source.definitionId] as ExecutableCardDefinition | undefined;
  const controller = state.players.find((player) => player.id === source.controllerPlayerId && player.status === 'active');
  const ownerId = definition?.ownerId ?? (definition as unknown as { owner?: { id?: string } } | undefined)?.owner?.id;
  const ownedByControllerMaster = !!controller && (
    controller.masterCardId === ownerId ||
    source.definitionId.startsWith(`${controller.masterCardId}.skill.`)
  );
  if (!definition || definition.cardType !== 'master_skill' || !ownedByControllerMaster) return undefined;
  return definition;
}

export function conditionalAttackAttributePowerBonus(state: GameState, cardInstanceId: string): number {
  const runtime = state.abilityRuntime;
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId);
  if (!runtime || !physical || physical.zone !== 'attack_area') return 0;
  const targetDefinition = runtime.pack.cards[physical.definitionId] as ExecutableCardDefinition | undefined;
  const attributes = targetDefinition?.cardFace.attributes;
  if (!Array.isArray(attributes)) return 0;
  let total = 0;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== physical.controllerPlayerId) continue;
    const sourceDefinition = runtime.pack.cards[source.definitionId];
    for (const ability of sourceDefinition?.abilities ?? []) {
      if (!liveProvider(state, source.instanceId, ability)) continue;
      const effect = ability.effects[0]!;
      if (isControllerAttackAttributePowerBonusEffect(effect) && attributes.includes(effect.attribute as string)) {
        total += Number(effect.amount);
      }
    }
  }
  return total;
}

export interface ConditionalAdditionalPlayModifier {
  providerSourceCardId: string;
  providerAbilityId: string;
  targetDefinitionId: string;
  minimumControllerMana: number;
  additionalManaCost: number;
}

export function conditionalDefinitionAdditionalPlayModifier(
  state: GameState,
  playerId: string,
  targetCardInstanceId: string,
): ConditionalAdditionalPlayModifier | undefined {
  const runtime = state.abilityRuntime;
  const target = state.cards.find((card) => card.instanceId === targetCardInstanceId);
  const controller = state.players.find((player) => player.id === playerId && player.status === 'active');
  if (!runtime || !target || target.controllerPlayerId !== playerId || !controller) return undefined;
  for (const source of state.cards) {
    if (source.controllerPlayerId !== playerId) continue;
    const sourceDefinition = runtime.pack.cards[source.definitionId];
    for (const ability of sourceDefinition?.abilities ?? []) {
      if (!liveProvider(state, source.instanceId, ability)) continue;
      const effect = ability.effects[0]!;
      if (!isConditionalDefinitionAdditionalPlayEffect(effect) || target.definitionId !== effect.definitionId) continue;
      if (controller.mana < Number(effect.minimumControllerMana)) return undefined;
      return {
        providerSourceCardId: source.instanceId,
        providerAbilityId: ability.id,
        targetDefinitionId: String(effect.definitionId),
        minimumControllerMana: Number(effect.minimumControllerMana),
        additionalManaCost: Number(effect.additionalManaCost),
      };
    }
  }
  return undefined;
}
