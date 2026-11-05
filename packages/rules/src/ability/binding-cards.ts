import type { GameState } from '../schema/game';
import type { BoundCardInfo } from './types';

/**
 * Structured card info for result bindings. Card identity (instanceId) is always
 * returned; attributes/cardType are only exposed when the controller may legally
 * see the card (owns it, or it sits in a public zone and is not face-down).
 */
export function boundCardInfo(state: GameState, controllerId: string, instanceId: string): BoundCardInfo {
  const card = state.cards.find((entry) => entry.instanceId === instanceId);
  const runtime = (state as unknown as { abilityRuntime?: { pack?: { cards?: Record<string, { cardFace?: { attributes?: unknown }; cardType?: string }> }; cardState?: Record<string, { faceDown?: boolean }> } }).abilityRuntime;
  const definition = card ? runtime?.pack?.cards?.[card.definitionId] : undefined;
  const faceDown = runtime?.cardState?.[instanceId]?.faceDown === true;
  const publicZone = ['discard', 'field', 'attack_area', 'removed_from_game'].includes(card?.zone ?? '');
  const visible = !!card && (card.ownerPlayerId === controllerId || (publicZone && !faceDown));
  if (!visible) return { cardId: instanceId, redacted: true };
  const attributes = Array.isArray(definition?.cardFace?.attributes)
    ? (definition!.cardFace.attributes as unknown[]).map(String)
    : [];
  return { cardId: instanceId, attributes, cardType: String(definition?.cardType ?? '') };
}
