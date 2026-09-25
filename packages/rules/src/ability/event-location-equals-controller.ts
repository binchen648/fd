import type { GameState } from '../schema/game';
import type { AbilityEvent, PlayerId, RuleNode } from './types';

const CONDITION_TYPE = 'event_location_equals_controller';
const MOVEMENT_EVENT_TYPE = 'after_controller_enters_location';

/**
 * FB2-43 accepts only the frozen type-only event-location relation shape.
 * Player relationship and battlefield checks remain separate conditions.
 */
export function isAcceptedEventLocationEqualsControllerCondition(condition: RuleNode): boolean {
  return condition.type === CONDITION_TYPE &&
    Object.keys(condition).length === 1 && Object.keys(condition).every((key) => key === 'type');
}

export function eventLocationEqualsController(
  state: GameState,
  controllerId: PlayerId,
  event: AbilityEvent | undefined,
): boolean {
  if (!event || event.type !== MOVEMENT_EVENT_TYPE ||
      typeof event.locationId !== 'string' || event.locationId.length === 0) return false;

  const controller = state.players.find((player) => player.id === controllerId);
  if (!controller || typeof controller.locationId !== 'string' || controller.locationId.length === 0) return false;

  return event.locationId === controller.locationId;
}
