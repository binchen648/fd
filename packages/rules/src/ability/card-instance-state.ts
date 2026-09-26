import type { GameState } from '../schema/game';
import { conditionalRevealedSourceAttributes } from './revealed-card-mechanics';

/** Current physical-card attributes after instance-scoped transforms. Printed definitions remain immutable. */
export function getEffectiveCardAttributes(state: GameState, cardInstanceId: string): string[] {
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!card) return [];
  const runtime = state.abilityRuntime;
  const override = runtime?.cardState[cardInstanceId]?.attributeOverrides;
  const printed = override !== undefined ? override : runtime?.pack.cards[card.definitionId]?.cardFace.attributes;
  const result = Array.isArray(printed) ? printed.filter((attribute): attribute is string => typeof attribute === 'string') : [];
  for (const attribute of conditionalRevealedSourceAttributes(state, cardInstanceId)) if (!result.includes(attribute)) result.push(attribute);
  return result;
}

/** Instance-scoped transforms expire whenever that physical card leaves active board zones. */
export function clearTransientCardTransformState(state: GameState, cardInstanceId: string): void {
  const cardState = state.abilityRuntime?.cardState[cardInstanceId];
  if (cardState) {
    delete cardState.reversed;
    delete cardState.attributeOverrides;
    delete cardState.basePowerMultiplier;
  }
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!card) return;
  const carrier = card as unknown as { powerModifiers?: Array<Record<string, unknown>> };
  if (!Array.isArray(carrier.powerModifiers)) return;
  carrier.powerModifiers = carrier.powerModifiers.filter((modifier) => modifier.lifecycle !== 'until_leaves_active_area');
  if (carrier.powerModifiers.length === 0) delete carrier.powerModifiers;
}
