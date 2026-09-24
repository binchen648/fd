import type { GameState } from '../schema/game';
import { m50LinkedPlayerCardAttributes } from './m50-linked-player-card-modifiers';

/** Current physical-card attributes after instance-scoped and continuous structural transforms. Printed definitions remain immutable. */
export function getEffectiveCardAttributes(state: GameState, cardInstanceId: string): string[] {
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!card) return [];
  const runtime = state.abilityRuntime;
  const override = runtime?.cardState[cardInstanceId]?.attributeOverrides;
  const printed = runtime?.pack.cards[card.definitionId]?.cardFace.attributes;
  const resolved = override !== undefined
    ? override.filter((attribute): attribute is string => typeof attribute === 'string')
    : Array.isArray(printed) ? printed.filter((attribute): attribute is string => typeof attribute === 'string') : [];
  return m50LinkedPlayerCardAttributes(state, cardInstanceId, resolved);
}

/** Reverse/attribute transforms are physical-card state and expire whenever that card leaves board zones. */
export function clearTransientCardTransformState(state: GameState, cardInstanceId: string): void {
  const cardState = state.abilityRuntime?.cardState[cardInstanceId];
  if (!cardState) return;
  delete cardState.reversed;
  delete cardState.attributeOverrides;
}
