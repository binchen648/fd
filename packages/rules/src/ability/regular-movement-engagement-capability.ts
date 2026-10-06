import type { GameState } from '../schema/game';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

export const REGULAR_MOVEMENT_IGNORE_SOURCE_ENGAGEMENT_EFFECT = 'regular_movement_ignore_source_controller_engagement';

function exact(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value as Record<string, unknown>);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function effect(value: unknown): value is RuleNode {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    (value as RuleNode).type === REGULAR_MOVEMENT_IGNORE_SOURCE_ENGAGEMENT_EFFECT &&
    exact(value, ['type']);
}

export function containsRegularMovementEngagementPrivilegedNode(ability: AuthoringAbility): boolean {
  return ability.effects.some((entry) => entry.type === REGULAR_MOVEMENT_IGNORE_SOURCE_ENGAGEMENT_EFFECT);
}

export function isAcceptedRegularMovementEngagementAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'passive' &&
    (!ability.activation || exact(ability.activation, [])) &&
    ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && ability.effects.length === 1 &&
    effect(ability.effects[0]) &&
    exact(ability.lifecycle, []) && exact(ability.limit, []) && exact(ability.visibility, []) &&
    ability.execution.mode === 'automatic';
}

function liveProvider(state: GameState, sourceId: string, ability: AuthoringAbility): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime || !isAcceptedRegularMovementEngagementAbility(ability)) return false;
  const source = state.cards.find((card) => card.instanceId === sourceId);
  if (!source || source.ownerPlayerId !== source.controllerPlayerId || source.zone !== 'skill') return false;
  const definition = runtime.pack.cards[source.definitionId] as ExecutableCardDefinition | undefined;
  if (!definition || definition.cardType !== 'master_skill') return false;
  const controller = state.players.find((player) => player.id === source.controllerPlayerId);
  const ownerId = definition.ownerId ?? (definition as unknown as { owner?: { id?: string } }).owner?.id;
  const ownedByControllerMaster = !!controller && (
    controller.masterCardId === ownerId ||
    source.definitionId.startsWith(`${controller.masterCardId}.skill.`)
  );
  return ownedByControllerMaster &&
    runtime.cardState[sourceId]?.faceDown !== true;
}

/** Whether the ordinary inferred engagement at the mover's current battlefield is fully waived. */
export function regularMovementEngagementIgnored(state: GameState, movingPlayerId: string): boolean {
  const runtime = state.abilityRuntime;
  const mover = state.players.find((player) => player.id === movingPlayerId && player.status === 'active');
  if (!runtime || !mover?.locationId) return false;
  for (const source of state.cards) {
    const definition = runtime.pack.cards[source.definitionId];
    for (const ability of definition?.abilities ?? []) {
      if (!liveProvider(state, source.instanceId, ability)) continue;
      const providerId = source.controllerPlayerId;
      if (providerId === movingPlayerId) return true;
      const provider = state.players.find((player) => player.id === providerId && player.status === 'active');
      if (provider?.locationId !== mover.locationId) continue;
      const otherEngagerExists = state.players.some((player) =>
        player.status === 'active' && player.id !== movingPlayerId && player.id !== providerId &&
        player.locationId === mover.locationId);
      if (!otherEngagerExists) return true;
    }
  }
  return false;
}
