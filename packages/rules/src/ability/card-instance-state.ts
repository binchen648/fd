import { isActiveCardSource } from '../core/card-source-state';
import type { GameState } from '../schema/game';

/** Current physical-card attributes after instance-scoped transforms. Printed definitions remain immutable. */
export function getEffectiveCardAttributes(state: GameState, cardInstanceId: string): string[] {
  const card = state.cards.find((candidate) => candidate.instanceId === cardInstanceId);
  if (!card) return [];
  const runtime = state.abilityRuntime;
  const override = runtime?.cardState[cardInstanceId]?.attributeOverrides;

  const printed = runtime?.pack.cards[card.definitionId]?.cardFace.attributes;
  const attributes = override ?? printed;
  const base = Array.isArray(attributes) ? attributes.filter((attribute): attribute is string => typeof attribute === 'string') : [];
  const gained = (runtime?.ongoingEffects ?? []).filter(o => o.sourceCardId === cardInstanceId &&
    o.sourceMustRemainActive === true && isActiveCardSource(state,cardInstanceId) &&
    (o.expiresAtRound === undefined || state.round.roundNumber < o.expiresAtRound)).flatMap(o => o.ruleModifiers)
    .filter(m => m.definition.rule === 'card.attributes' && m.definition.operation === 'add')
    .flatMap(m => Array.isArray(m.definition.attributes) ? m.definition.attributes.filter((a): a is string => typeof a === 'string') : []);
  return [...new Set([...base,...gained])];
}

/** Reverse/attribute transforms are physical-card state and expire whenever that card leaves board zones. */
export function clearTransientCardTransformState(state: GameState, cardInstanceId: string): void {
  const cardState = state.abilityRuntime?.cardState[cardInstanceId];
  if (!cardState) return;
  delete cardState.reversed;
  delete cardState.attributeOverrides;
  delete cardState.values;
  if (state.abilityRuntime) state.abilityRuntime.ongoingEffects = state.abilityRuntime.ongoingEffects.filter(o =>
    o.sourceCardId !== cardInstanceId || !o.ruleModifiers.some(m => m.definition.rule === 'card.attributes' || m.definition.rule === 'attack.currentPower' && m.definition.operation === 'multiply'));
}

/** IDs are source-local data keys, never prototype/object traversal instructions. */
export function isStoredCardValueId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/.test(value) &&
    !['__proto__', 'constructor', 'prototype'].includes(value);
}
