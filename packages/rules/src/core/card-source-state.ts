import type { GameState } from '../schema/game';

/**
 * Card Zone/source-state policy backed by FD-Game-Rules-Final 11.1/11.3/11.4:
 * an explicitly activated face-up card remains an active source while it is in
 * an active board area and its authoritative runtime active bit is still set.
 * Lifecycle consumes this policy; Lifecycle does not define active zones.
 */
export const ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID = 'fd.card-zone.active-card-source.v1';

export interface CardSourceValidityInput {
  policyId: string;
  sourceCardInstanceId: string;
  sourceAbilityId: string;
  controllerPlayerId: string;
  sourceDefinitionIdAtInstall: string;
}

export interface CardSourceValidityResult {
  supported: boolean;
  valid: boolean;
  reason?: 'unknown_policy' | 'missing_source' | 'controller_changed' | 'definition_changed' | 'ability_missing' | 'inactive_source';
}

export function evaluateCardSourceValidity(state: GameState, input: CardSourceValidityInput): CardSourceValidityResult {
  if (input.policyId !== ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID) {
    return { supported: false, valid: false, reason: 'unknown_policy' };
  }
  const source = state.cards.find((card) => card.instanceId === input.sourceCardInstanceId);
  if (!source) return { supported: true, valid: false, reason: 'missing_source' };
  if (source.controllerPlayerId !== input.controllerPlayerId) {
    return { supported: true, valid: false, reason: 'controller_changed' };
  }
  if (source.definitionId !== input.sourceDefinitionIdAtInstall) {
    return { supported: true, valid: false, reason: 'definition_changed' };
  }
  const runtime = state.abilityRuntime;
  const abilityStillExists = runtime?.pack.cards[source.definitionId]?.abilities.some(
    (ability) => ability.id === input.sourceAbilityId,
  ) ?? false;
  if (!abilityStillExists) return { supported: true, valid: false, reason: 'ability_missing' };
  const sourceState = runtime?.cardState[source.instanceId];
  const inActiveArea = source.zone === 'field' || source.zone === 'attack_area';
  const valid = inActiveArea && sourceState?.active === true && sourceState.faceDown !== true;
  return valid
    ? { supported: true, valid: true }
    : { supported: true, valid: false, reason: 'inactive_source' };
}
