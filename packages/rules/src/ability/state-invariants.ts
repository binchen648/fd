import type { GameState } from '../schema/game';

/** Zones a card instance may legally occupy in the shipped engine. */
export const cardZones = [
  'deck', 'hand', 'skill', 'field', 'attack_area', 'discard',
  'removed_from_game', 'looked_cards', 'independent_deck', 'master',
  'event_deck', 'event_discard',
] as const;

export interface StateInvariantViolation {
  code: string;
  path: string;
  message: string;
}

/**
 * Structural invariants of a resolved game state. These are deliberately engine-level
 * (not rule-level): no printed rule decides whether mana may be negative.
 * Used by the development-mode guard and by regression tests.
 */
export function collectStateViolations(state: GameState): StateInvariantViolation[] {
  const violations: StateInvariantViolation[] = [];
  const report = (code: string, path: string, message: string) => violations.push({ code, path, message });

  const playerIds = new Set(state.players.map((player) => player.id));
  if (playerIds.size !== state.players.length) report('duplicate_player', 'players', 'duplicate player id');

  for (const [index, player] of state.players.entries()) {
    const path = `players[${index}]`;
    if (!Number.isInteger(player.mana) || player.mana < 0) report('invalid_mana', `${path}.mana`, `mana=${player.mana}`);
    if (!Number.isInteger(player.vp) || player.vp < 0) report('invalid_vp', `${path}.vp`, `vp=${player.vp}`);
    if (player.status !== 'active' && player.status !== 'eliminated') report('invalid_status', `${path}.status`, String(player.status));
    if (!Number.isInteger(player.seat) || player.seat < 1) report('invalid_seat', `${path}.seat`, `seat=${player.seat}`);
  }

  const instances = new Set<string>();
  for (const [index, card] of state.cards.entries()) {
    const path = `cards[${index}]`;
    if (instances.has(card.instanceId)) report('duplicate_card_instance', `${path}.instanceId`, card.instanceId);
    instances.add(card.instanceId);
    if (!(cardZones as readonly string[]).includes(card.zone)) report('unknown_zone', `${path}.zone`, card.zone);
    if (!playerIds.has(card.ownerPlayerId)) report('dangling_card_owner', `${path}.ownerPlayerId`, card.ownerPlayerId);
    if (!playerIds.has(card.controllerPlayerId)) report('dangling_card_controller', `${path}.controllerPlayerId`, card.controllerPlayerId);
  }

  if (!Number.isInteger(state.round.roundNumber) || state.round.roundNumber < 1) {
    report('invalid_round', 'round.roundNumber', `round=${state.round.roundNumber}`);
  }

  const runtime = state.abilityRuntime;
  if (runtime) {
    for (const instanceId of Object.keys(runtime.cardState)) {
      if (!instances.has(instanceId)) report('dangling_card_state', `abilityRuntime.cardState.${instanceId}`, 'no such card instance');
    }
    for (const ongoing of runtime.ongoingEffects) {
      if (!instances.has(ongoing.sourceCardId)) {
        report('dangling_ongoing_source', 'abilityRuntime.ongoingEffects', ongoing.sourceCardId);
      }
    }
    const decision = runtime.pendingDecision;
    if (decision) {
      if (!decision.id) report('invalid_decision', 'abilityRuntime.pendingDecision.id', 'missing id');
      if (!Number.isInteger(decision.min) || !Number.isInteger(decision.max) || decision.min < 0 || decision.max < decision.min) {
        report('invalid_decision', 'abilityRuntime.pendingDecision', `min=${decision.min} max=${decision.max}`);
      }
      if (decision.max > 0 && decision.candidates.length < decision.min) {
        report('invalid_decision', 'abilityRuntime.pendingDecision.candidates', 'fewer candidates than min');
      }
    }
  } else if (state.players.length > 0) {
    report('missing_runtime', 'abilityRuntime', 'ability runtime is not initialized');
  }

  for (const [index, placement] of state.eventPlacements.entries()) {
    if (!state.map.locations.some((location) => location.id === placement.locationId)) {
      report('unknown_event_location', `eventPlacements[${index}].locationId`, String(placement.locationId));
    }
  }

  return violations;
}

export function assertStateInvariants(state: GameState): void {
  const violations = collectStateViolations(state);
  if (violations.length > 0) {
    const summary = violations.map((violation) => `${violation.code}@${violation.path}: ${violation.message}`).join('; ');
    throw new Error(`State invariant violation: ${summary}`);
  }
}
