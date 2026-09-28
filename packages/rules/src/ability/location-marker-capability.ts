import type { AuthoringAbility, RuleNode } from './types';

export const LOCATION_MARKER_FOLLOW_EFFECT = 'location_marker_follow_opponent_departure' as const;
export const LOCATION_MARKER_COMBAT_BRANCH_EFFECT = 'location_marker_combat_terrain_or_vp_transfer' as const;
export const LOCATION_MARKER_PLACE_EFFECT = 'location_marker_place_at_controller' as const;
export const LOCATION_MARKER_MIDPOINT_DEFEAT_EFFECT = 'location_marker_midpoint_converge_defeat' as const;

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function markerKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value);
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function emptyCommon(ability: AuthoringAbility): boolean {
  return ability.targets.length === 0 && ability.cost.length === 0 && ability.ruleModifiers.length === 0 && ability.creates.length === 0 &&
    empty(ability.lifecycle) && empty(ability.limit) && automaticNoHost(ability);
}
function emptyVisibility(ability: AuthoringAbility): boolean { return empty(ability.visibility); }
function activeActivation(ability: AuthoringAbility, phase: 'advance' | 'action' | 'combat', opens: 'controller_action_window' | 'controller_combat_action_window'): boolean {
  return ability.activation.phase === phase && ability.activation.opens === opens && ability.activation.requiresSourceState === 'active' &&
    exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']);
}

export function isLocationMarkerFollowEffect(value: RuleNode): boolean {
  return value.type === LOCATION_MARKER_FOLLOW_EFFECT && markerKey(value.markerKey) && exactKeys(value, ['type', 'markerKey']);
}
export function isLocationMarkerCombatBranchEffect(value: RuleNode): boolean {
  return value.type === LOCATION_MARKER_COMBAT_BRANCH_EFFECT && markerKey(value.markerKey) && value.terrainAmount === 3 &&
    value.vpTransferAmount === 1 && exactKeys(value, ['type', 'markerKey', 'terrainAmount', 'vpTransferAmount']);
}
export function isLocationMarkerPlaceEffect(value: RuleNode): boolean {
  return value.type === LOCATION_MARKER_PLACE_EFFECT && markerKey(value.markerKey) && exactKeys(value, ['type', 'markerKey']);
}
export function isLocationMarkerMidpointDefeatEffect(value: RuleNode): boolean {
  return value.type === LOCATION_MARKER_MIDPOINT_DEFEAT_EFFECT && markerKey(value.markerKey) && value.distance === 2 &&
    exactKeys(value, ['type', 'markerKey', 'distance']);
}

export function isAcceptedLocationMarkerFollowAbility(ability: AuthoringAbility): boolean {
  const condition = ability.conditions[0];
  return ability.kind === 'forced_trigger' && ability.activation.trigger === 'after_controller_enters_location' &&
    ability.activation.requiresSourceState === 'active' && exactKeys(ability.activation, ['trigger', 'requiresSourceState']) &&
    ability.conditions.length === 1 && !!condition && condition.type === 'event_player_is_opponent' && exactKeys(condition, ['type']) &&
    ability.effects.length === 1 && isLocationMarkerFollowEffect(ability.effects[0]!) && emptyCommon(ability) && emptyVisibility(ability) && standardResponse(ability);
}
export function isAcceptedLocationMarkerCombatAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && activeActivation(ability, 'combat', 'controller_combat_action_window') &&
    ability.conditions.length === 0 && ability.effects.length === 1 && isLocationMarkerCombatBranchEffect(ability.effects[0]!) &&
    emptyCommon(ability) && emptyVisibility(ability) && standardResponse(ability);
}
export function isAcceptedLocationMarkerPlaceAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && activeActivation(ability, 'advance', 'controller_action_window') &&
    ability.conditions.length === 0 && ability.effects.length === 1 && isLocationMarkerPlaceEffect(ability.effects[0]!) &&
    emptyCommon(ability) && emptyVisibility(ability) && standardResponse(ability);
}
export function isAcceptedLocationMarkerMidpointDefeatAbility(ability: AuthoringAbility): boolean {
  const visibility = ability.visibility;
  return ability.kind === 'phase_action' && activeActivation(ability, 'action', 'controller_action_window') &&
    ability.conditions.length === 0 && ability.effects.length === 1 && isLocationMarkerMidpointDefeatEffect(ability.effects[0]!) &&
    emptyCommon(ability) && visibility.revealsTrueName === true && visibility.revealTiming === 'on_use_declared' &&
    visibility.revealScope === 'servant_package' && exactKeys(visibility, ['revealsTrueName', 'revealTiming', 'revealScope']) && standardResponse(ability);
}
export function isAcceptedLocationMarkerAbility(ability: AuthoringAbility): boolean {
  return isAcceptedLocationMarkerFollowAbility(ability) || isAcceptedLocationMarkerCombatAbility(ability) ||
    isAcceptedLocationMarkerPlaceAbility(ability) || isAcceptedLocationMarkerMidpointDefeatAbility(ability);
}
export function containsLocationMarkerPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsLocationMarkerPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const current = value as RuleNode;
  if ([LOCATION_MARKER_FOLLOW_EFFECT, LOCATION_MARKER_COMBAT_BRANCH_EFFECT, LOCATION_MARKER_PLACE_EFFECT,
    LOCATION_MARKER_MIDPOINT_DEFEAT_EFFECT].includes(String(current.type) as typeof LOCATION_MARKER_FOLLOW_EFFECT)) return true;
  return Object.values(current).some(containsLocationMarkerPrivilegedNode);
}
export function locationMarkerKeyFromAbility(ability: AuthoringAbility): string | undefined {
  if (!isAcceptedLocationMarkerAbility(ability)) return undefined;
  const key = ability.effects[0]?.markerKey;
  return markerKey(key) ? key : undefined;
}
export function isValidLocationMarkerKey(value: unknown): value is string { return markerKey(value); }
