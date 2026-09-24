import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from './types';

export const M50_DEDUCTION_RECORD_MARKER = 'deduction-record';
export const M50_DEDUCTION_RECORD_ATTRIBUTE_PREFIX = 'deduction-attribute:';
export const M50_DEDUCTION_RECORD_ATTRIBUTES = ['力量', '迅捷', '魔术', '特殊'] as const;
export type M50DeductionRecordAttribute = typeof M50_DEDUCTION_RECORD_ATTRIBUTES[number];

function record(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function exactKeys(value: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function emptyArray(value: unknown): boolean { return Array.isArray(value) && value.length === 0; }
function emptyRecord(value: unknown): boolean { return exactKeys(record(value), []); }
function defaultResponse(value: unknown): boolean {
  const response = record(value);
  return emptyRecord(response) || (exactKeys(response, ['order', 'passBehavior']) &&
    response.order === 'turn_order' && response.passBehavior === 'decline_this_window');
}
function markerList(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((marker) => typeof marker !== 'string')) return undefined;
  return value as string[];
}

/** Reserve the exact Locked-Reference Retroduction record vocabulary wherever it appears. */
export function isM50DeductionRecordCandidate(ability: AuthoringAbility | RuleNode): boolean {
  const markers = markerList((ability as RuleNode).markers) ?? [];
  return markers.includes(M50_DEDUCTION_RECORD_MARKER) ||
    markers.some((marker) => marker.startsWith(M50_DEDUCTION_RECORD_ATTRIBUTE_PREFIX));
}

/**
 * Exact identity-free envelope for Sherlock-style secret record definitions.
 * The record card has no independent triggered effect; it is a typed outside-game
 * data card consumed by a separate Retroduction ability. This classifier keeps the
 * record attribute executable without inventing the consumer behavior here.
 */
export function classifyM50DeductionRecordMarker(
  ability: AuthoringAbility | RuleNode,
): M50DeductionRecordAttribute | undefined {
  const raw = ability as RuleNode;
  const markers = markerList(raw.markers);
  if (!markers || markers.length !== 3 || new Set(markers).size !== 3 ||
      !markers.includes('m50_structured_v1') || !markers.includes(M50_DEDUCTION_RECORD_MARKER)) return undefined;
  const attributeMarkers = markers.filter((marker) => marker.startsWith(M50_DEDUCTION_RECORD_ATTRIBUTE_PREFIX));
  if (attributeMarkers.length !== 1) return undefined;
  const attribute = attributeMarkers[0]!.slice(M50_DEDUCTION_RECORD_ATTRIBUTE_PREFIX.length) as M50DeductionRecordAttribute;
  if (!M50_DEDUCTION_RECORD_ATTRIBUTES.includes(attribute)) return undefined;
  if (raw.kind !== 'passive' || record(raw.execution).mode !== 'automatic') return undefined;
  const allowedOperations = record(raw.execution).allowedOperations;
  if (allowedOperations !== undefined && (!Array.isArray(allowedOperations) || allowedOperations.length !== 0)) return undefined;
  if (!emptyRecord(raw.activation) || !emptyArray(raw.conditions) || !emptyArray(raw.targets) || !emptyArray(raw.effects) ||
      !emptyArray(raw.cost) || !emptyArray(raw.ruleModifiers) || !emptyArray(raw.creates) || !emptyRecord(raw.lifecycle) ||
      !defaultResponse(raw.responseWindow) || !emptyRecord(raw.limit) || !emptyRecord(raw.visibility)) return undefined;
  return attribute;
}

export function isAcceptedM50DeductionRecordMarker(ability: AuthoringAbility | RuleNode): boolean {
  return classifyM50DeductionRecordMarker(ability) !== undefined;
}

/** Resolve the semantic attribute carried by an exact outside-game record definition. */
export function m50DeductionRecordAttribute(definition: ExecutableCardDefinition): M50DeductionRecordAttribute | undefined {
  if (definition.cardType !== 'servant_skill' || definition.initialPlacement !== 'outside_game') return undefined;
  const candidates = definition.abilities.filter(isM50DeductionRecordCandidate);
  if (candidates.length === 0) return undefined;
  if (candidates.length !== 1) throw new Error('M50_DEDUCTION_RECORD_AMBIGUOUS');
  const attribute = classifyM50DeductionRecordMarker(candidates[0]!);
  if (!attribute) throw new Error('M50_DEDUCTION_RECORD_INVALID');
  return attribute;
}
