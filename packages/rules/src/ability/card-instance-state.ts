import type { GameState } from '../schema/game';

/** Current physical-card attributes after instance-scoped transforms. Printed definitions remain immutable. */
export function getEffectiveCardAttributes(state: GameState, cardInstanceId: string): string[] {
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!card) return [];
  const runtime = state.abilityRuntime;
  const override = runtime?.cardState[cardInstanceId]?.attributeOverrides;
  if (override !== undefined) return override.filter((attribute): attribute is string => typeof attribute === 'string');
  const printed = runtime?.pack.cards[card.definitionId]?.cardFace.attributes;
  return Array.isArray(printed) ? printed.filter((attribute): attribute is string => typeof attribute === 'string') : [];
}

/** Instance-scoped transforms expire whenever that physical card leaves active board zones. */
export function clearTransientCardTransformState(state: GameState, cardInstanceId: string): void {
  const cardState = state.abilityRuntime?.cardState[cardInstanceId];
  if (cardState) {
    delete cardState.reversed;
    delete cardState.attributeOverrides;
  }
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!card) return;
  const carrier = card as unknown as { powerModifiers?: Array<Record<string, unknown>> };
  if (!Array.isArray(carrier.powerModifiers)) return;
  carrier.powerModifiers = carrier.powerModifiers.filter((modifier) => modifier.lifecycle !== 'until_leaves_active_area');
  if (carrier.powerModifiers.length === 0) delete carrier.powerModifiers;
}
