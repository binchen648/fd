import type { AuthoringAbility, AuthoringCard, AbilityDefinitionPack, RuleNode } from './types';

export const DEDUCTION_RECORD_MARKER = 'deduction-record' as const;
export const DEDUCTION_RECORD_ATTRIBUTE_PREFIX = 'deduction-attribute:' as const;
export const DEDUCTION_RECORD_ATTRIBUTES = ['力量', '迅捷', '魔术', '特殊'] as const;
export type DeductionRecordAttribute = typeof DEDUCTION_RECORD_ATTRIBUTES[number];
const structuredMarker = 'm50_structured_v1';
const knownAttributes = new Set<string>(DEDUCTION_RECORD_ATTRIBUTES);

function record(value: unknown): RuleNode {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

export function deductionRecordAttributeFromMarkers(markers: unknown): DeductionRecordAttribute | undefined {
  if (!Array.isArray(markers) || markers.length !== 3 || new Set(markers).size !== markers.length ||
      !markers.every((marker) => typeof marker === 'string')) return undefined;
  if (!markers.includes(structuredMarker) || !markers.includes(DEDUCTION_RECORD_MARKER)) return undefined;
  const encoded = markers.filter((marker) => marker.startsWith(DEDUCTION_RECORD_ATTRIBUTE_PREFIX));
  if (encoded.length !== 1) return undefined;
  const attribute = encoded[0]!.slice(DEDUCTION_RECORD_ATTRIBUTE_PREFIX.length);
  return knownAttributes.has(attribute) ? attribute as DeductionRecordAttribute : undefined;
}

export function isDeductionRecordMarkerAbility(ability: AuthoringAbility): boolean {
  const attribute = deductionRecordAttributeFromMarkers((ability as unknown as RuleNode).markers);
  if (!attribute || ability.kind !== 'passive' || ability.execution.mode !== 'automatic' ||
      ability.execution.allowedOperations.length !== 0) return false;
  if (!exactKeys(ability.activation, []) || ability.conditions.length !== 0 || ability.targets.length !== 0 ||
      ability.effects.length !== 0 || ability.cost.length !== 0 || ability.ruleModifiers.length !== 0 ||
      ability.creates.length !== 0 || !exactKeys(ability.lifecycle, []) ||
      !(exactKeys(ability.responseWindow, []) || (exactKeys(ability.responseWindow, ['order', 'passBehavior']) &&
        ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window')) ||
      !exactKeys(ability.limit, []) || !exactKeys(ability.visibility, [])) return false;
  return true;
}

export function deductionRecordAttribute(card: AuthoringCard | undefined): DeductionRecordAttribute | undefined {
  if (!card || card.cardType !== 'servant_skill' || card.initialPlacement !== 'outside_game' || card.abilities.length !== 1) return undefined;
  const ability = card.abilities[0]!;
  if (!isDeductionRecordMarkerAbility(ability)) return undefined;
  return deductionRecordAttributeFromMarkers((ability as unknown as RuleNode).markers);
}

export function deductionRecordDefinitionsForOwner(pack: AbilityDefinitionPack, servantRoot: string): Map<DeductionRecordAttribute, string> {
  const result = new Map<DeductionRecordAttribute, string>();
  if (!servantRoot.startsWith('servant.')) return result;
  const prefix = `${servantRoot}.skill.`;
  for (const card of Object.values(pack.cards)) {
    if (!card.id.startsWith(prefix)) continue;
    const attribute = deductionRecordAttribute(card);
    if (!attribute || result.has(attribute)) continue;
    result.set(attribute, card.id);
  }
  return result;
}

export function isDeductionRecordCondition(node: RuleNode): boolean {
  if (['deduction_record_present', 'deduction_record_absent'].includes(String(node.type ?? ''))) return exactKeys(node, ['type']);
  return node.type === 'deduction_record_matches_event_attack' && node.allowNoblePhantasmRevealException === true &&
    exactKeys(node, ['type', 'allowNoblePhantasmRevealException']);
}

export function isDeductionRecordEffect(node: RuleNode): boolean {
  if (node.type === 'choose_deduction_record') {
    return typeof node.optional === 'boolean' && exactKeys(node, ['type', 'optional']);
  }
  if (node.type === 'resolve_deduction_record_on_event') {
    return node.vpGain === 1 && node.optionalNext === true && node.allowNoblePhantasmRevealException === true &&
      exactKeys(node, ['type', 'vpGain', 'optionalNext', 'allowNoblePhantasmRevealException']);
  }
  if (node.type === 'expire_deduction_record') {
    return node.vpPenalty === 3 && exactKeys(node, ['type', 'vpPenalty']);
  }
  if (node.type === 'reveal_selected_opponent_and_resolve_deduction') {
    return typeof node.target === 'string' && node.target.length > 0 && node.vpGain === 1 && node.optionalNext === true &&
      node.defeatOnMatch === true && node.show === 'hand_and_face_down_attacks' &&
      exactKeys(node, ['type', 'target', 'vpGain', 'optionalNext', 'defeatOnMatch', 'show']);
  }
  return false;
}

export function isEventLocationIsCondition(node: RuleNode): boolean {
  return node.type === 'event_location_is' && typeof node.locationId === 'string' && node.locationId.length > 0 &&
    exactKeys(node, ['type', 'locationId']);
}

export function isSameLocationAsControllerConstraint(node: RuleNode): boolean {
  return node.type === 'same_location_as_controller' && exactKeys(node, ['type']);
}

export function deductionRecordMechanicIsWellFormed(node: RuleNode): boolean {
  const type = String(node.type ?? '');
  if (type.startsWith('deduction_record_') || type === 'choose_deduction_record' || type === 'reveal_selected_opponent_and_resolve_deduction' || type === 'expire_deduction_record') {
    return isDeductionRecordCondition(node) || isDeductionRecordEffect(node);
  }
  return true;
}
