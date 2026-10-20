import type { GameState } from '../schema/game';
import type { AuthoringAbility, PlayerId, RuleNode } from './types';
import { composeTerrainAdvantageOverride, terrainAdvantageAtLocation } from './terrain-advantage-override';

export const SHISHIGOU_BASE_ACTIVATE_EFFECT = 'shishigou_base_necromancy' as const;
export const SHISHIGOU_CORPSE_REVEAL_EFFECT = 'shishigou_corpse_reveal' as const;
export const SHISHIGOU_CORPSE_REMOVE_ATTACK_EFFECT = 'shishigou_corpse_remove_attack' as const;
export const SHISHIGOU_STRENGTH_EFFECT = 'shishigou_necromancy_strength' as const;
export const SHISHIGOU_AGILITY_EFFECT = 'shishigou_necromancy_agility' as const;
export const SHISHIGOU_MAGIC_EFFECT = 'shishigou_necromancy_magic' as const;
export const SHISHIGOU_SPECIAL_EFFECT = 'shishigou_necromancy_special' as const;

export const SHISHIGOU_GENERATED_BASIC_ABILITY_ID = 'shishigou.necromancy.basic';
export const SHISHIGOU_CORPSE_TARGET_ID = 'corpse_card';
export const SHISHIGOU_FACE_DOWN_ATTACK_TARGET_ID = 'face_down_attack';
export const SHISHIGOU_LOCATION_TARGET_ID = 'necromancy_battlefield';
export const SHISHIGOU_POWER_TARGET_ID = 'necromancy_power_card';

const ATTRIBUTES = ['力量', '迅捷', '魔术', '特殊'] as const;
export type ShishigouAttribute = typeof ATTRIBUTES[number];

function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function shell(a: AuthoringAbility, kind: string, phase: string, opens: string): boolean {
  return a.kind === kind && a.activation.phase === phase && a.activation.opens === opens &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 &&
    a.conditions.length === 0 && a.cost.length === 0 && a.creates.length === 0 &&
    a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 &&
    Object.keys(a.limit).length === 0 && Object.keys(a.visibility).length === 0;
}
function emptyPassiveShell(a: AuthoringAbility): boolean {
  return a.kind === 'passive' && a.activation.trigger === 'while_active' &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 &&
    a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 &&
    a.creates.length === 0 && a.ruleModifiers.length === 0 &&
    Object.keys(a.lifecycle).length === 0 && Object.keys(a.limit).length === 0 &&
    Object.keys(a.visibility).length === 0;
}

export function isShishigouBaseActivationAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return emptyPassiveShell(a) && a.effects.length === 1 && !!e && e.type === 'shishigou_ascension' &&
    exactKeys(e, ['type']);
}
/** Dynamic ability granted to each basic attack while the ascension is live. */
export function isShishigouBaseGrantedAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return a.kind === 'phase_action' && a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 && a.conditions.length === 0 &&
    a.creates.length === 0 && a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 &&
    Object.keys(a.visibility).length === 0 && a.effects.length === 1 && !!e &&
    e.type === SHISHIGOU_BASE_ACTIVATE_EFFECT && exactKeys(e, ['type']) &&
    a.cost.length === 1 && a.cost[0]?.type === 'pay_mana' && a.cost[0]?.amount === 3 && a.targets.length === 0 &&
    a.limit.type === 'per_round' && a.limit.uses === 1 && a.limit.scope === 'this_card';
}
export function isShishigouCorpseRevealAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return shell(a, 'phase_action', 'action', 'controller_action_window') && a.effects.length === 1 && !!e &&
    e.type === SHISHIGOU_CORPSE_REVEAL_EFFECT && exactKeys(e, ['type', 'target']) && e.target === SHISHIGOU_CORPSE_TARGET_ID &&
    a.targets.length === 1 && a.targets[0]?.id === SHISHIGOU_CORPSE_TARGET_ID;
}
export function isShishigouCorpseRemoveAttackAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return shell(a, 'phase_action', 'combat', 'controller_combat_action_window') && a.effects.length === 1 && !!e &&
    e.type === SHISHIGOU_CORPSE_REMOVE_ATTACK_EFFECT && exactKeys(e, ['type', 'target']) && e.target === SHISHIGOU_FACE_DOWN_ATTACK_TARGET_ID &&
    a.targets.length === 1 && a.targets[0]?.id === SHISHIGOU_FACE_DOWN_ATTACK_TARGET_ID;
}
export function isShishigouStrengthAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return shell(a, 'phase_action', 'action', 'controller_action_window') && a.effects.length === 1 && !!e &&
    e.type === SHISHIGOU_STRENGTH_EFFECT && exactKeys(e, ['type', 'target']) && e.target === SHISHIGOU_LOCATION_TARGET_ID &&
    a.targets.length === 1 && a.targets[0]?.id === SHISHIGOU_LOCATION_TARGET_ID;
}
export function isShishigouAgilityAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return shell(a, 'phase_action', 'action', 'controller_action_window') && a.effects.length === 1 && !!e &&
    e.type === SHISHIGOU_AGILITY_EFFECT && exactKeys(e, ['type']);
}
export function isShishigouMagicAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return shell(a, 'phase_action', 'action', 'controller_action_window') && a.effects.length === 1 && !!e &&
    e.type === SHISHIGOU_MAGIC_EFFECT && exactKeys(e, ['type']);
}
export function isShishigouSpecialAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return shell(a, 'phase_action', 'action', 'controller_action_window') && a.effects.length === 1 && !!e &&
    e.type === SHISHIGOU_SPECIAL_EFFECT && exactKeys(e, ['type', 'target']) && e.target === SHISHIGOU_POWER_TARGET_ID &&
    a.targets.length === 1 && a.targets[0]?.id === SHISHIGOU_POWER_TARGET_ID;
}
export function isShishigouNecromancyAbility(a: AuthoringAbility): boolean {
  return isShishigouStrengthAbility(a) || isShishigouAgilityAbility(a) || isShishigouMagicAbility(a) || isShishigouSpecialAbility(a);
}
export function containsShishigouPrivilegedNode(a: AuthoringAbility): boolean {
  return [...a.effects, ...a.creates, ...a.ruleModifiers].some((node) => [
    'shishigou_ascension', SHISHIGOU_BASE_ACTIVATE_EFFECT, SHISHIGOU_CORPSE_REVEAL_EFFECT,
    SHISHIGOU_CORPSE_REMOVE_ATTACK_EFFECT, SHISHIGOU_STRENGTH_EFFECT, SHISHIGOU_AGILITY_EFFECT,
    SHISHIGOU_MAGIC_EFFECT, SHISHIGOU_SPECIAL_EFFECT,
  ].includes(String(node.type)));
}
export function isAcceptedShishigouAbility(a: AuthoringAbility): boolean {
  return isShishigouBaseActivationAbility(a) || isShishigouBaseGrantedAbility(a) || isShishigouCorpseRevealAbility(a) ||
    isShishigouCorpseRemoveAttackAbility(a) || isShishigouNecromancyAbility(a);
}
export function shishigouAbilityAttribute(a: AuthoringAbility): ShishigouAttribute | undefined {
  if (isShishigouStrengthAbility(a)) return '力量';
  if (isShishigouAgilityAbility(a)) return '迅捷';
  if (isShishigouMagicAbility(a)) return '魔术';
  if (isShishigouSpecialAbility(a)) return '特殊';
  return undefined;
}
function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('ABILITY_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function definition(state: GameState, cardInstanceId: string) {
  const card = state.cards.find((entry) => entry.instanceId === cardInstanceId);
  return card ? runtime(state).pack.cards[card.definitionId] : undefined;
}
function owned(state: GameState, id: string, playerId: PlayerId): boolean {
  const card = state.cards.find((entry) => entry.instanceId === id);
  return !!card && card.ownerPlayerId === playerId && card.controllerPlayerId === playerId;
}
function liveShishigouAscension(state: GameState, playerId: PlayerId): boolean {
  return state.cards.some((card) => card.ownerPlayerId === playerId && card.controllerPlayerId === playerId &&
    ['field', 'attack_area'].includes(card.zone) && runtime(state).cardState[card.instanceId]?.active === true &&
    runtime(state).cardState[card.instanceId]?.faceDown !== true &&
    definition(state, card.instanceId)?.id.startsWith('master.shishigou.') === true &&
    definition(state, card.instanceId)?.abilities.some(isShishigouBaseActivationAbility));
}
function cardAttributes(state: GameState, id: string): string[] {
  const attrs = definition(state, id)?.cardFace.attributes;
  return Array.isArray(attrs) ? attrs.filter((value): value is string => typeof value === 'string') : [];
}
function necromancySources(state: GameState, playerId: string, attribute: string): Array<{ cardId: string; ability: AuthoringAbility }> {
  return state.cards.filter((card) => owned(state, card.instanceId, playerId) && card.zone === 'skill')
    .flatMap((card) => (definition(state, card.instanceId)?.abilities ?? [])
      .filter((ability) => isShishigouNecromancyAbility(ability) && shishigouAbilityAttribute(ability) === attribute)
      .map((ability) => ({ cardId: card.instanceId, ability })));
}
export function shishigouNecromancyTarget(state: GameState, playerId: string, attribute: string): { cardId: string; abilityId: string } | undefined {
  const matches = necromancySources(state, playerId, attribute);
  return matches.length === 1 ? { cardId: matches[0]!.cardId, abilityId: matches[0]!.ability.id } : undefined;
}
export function shishigouCorpseCardIds(state: GameState, playerId: string): string[] {
  const removed = runtime(state).shishigouCorpseRemovedCardIds ?? [];
  return removed.filter((id) => {
    const card = state.cards.find((entry) => entry.instanceId === id);
    return !!card && card.ownerPlayerId === playerId && card.zone === 'removed_from_game' && runtime(state).cardState[id]?.faceDown === true;
  });
}
export function shishigouBaseAbilityForBasic(state: GameState, cardInstanceId: string): AuthoringAbility | undefined {
  const card = state.cards.find((entry) => entry.instanceId === cardInstanceId);
  const d = card && runtime(state).pack.cards[card.definitionId];
  if (!card || !d || d.cardType !== 'basic_attack' || !liveShishigouAscension(state, card.controllerPlayerId)) return undefined;
  return {
    id: SHISHIGOU_GENERATED_BASIC_ABILITY_ID, kind: 'phase_action',
    printedClause: '行动阶段：花费3点魔力，根据此牌属性激活【死灵魔术】。',
    activation: { phase: 'action', opens: 'controller_action_window' }, conditions: [], targets: [],
    effects: [{ type: SHISHIGOU_BASE_ACTIVATE_EFFECT }], cost: [{ type: 'pay_mana', amount: 3 }],
    ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: { order: 'turn_order', passBehavior: 'decline_this_window' },
    limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
  };
}
export function canExecuteShishigouAbility(state: GameState, sourceCardId: string, ability: AuthoringAbility, controllerId: string): boolean {
  if (!isAcceptedShishigouAbility(ability) || !owned(state, sourceCardId, controllerId)) return false;
  if (isShishigouBaseActivationAbility(ability) || isShishigouBaseGrantedAbility(ability)) return true;
  if (isShishigouNecromancyAbility(ability)) return false; // only invoked through the shared handler
  if (isShishigouCorpseRevealAbility(ability)) return shishigouCorpseCardIds(state, controllerId).length > 0;
  if (isShishigouCorpseRemoveAttackAbility(ability)) return true;
  return true;
}

export function resolveShishigouAbility(
  state: GameState,
  ctx: { controllerId: string; sourceCardId: string; abilityId: string; selections: Record<string, string[]> },
  ability: AuthoringAbility,
): { activate?: { cardId: string; abilityId: string }; targetCardId?: string } | false {
  if (!canExecuteShishigouAbility(state, ctx.sourceCardId, ability, ctx.controllerId)) return false;
  if (isShishigouBaseActivationAbility(ability) || isShishigouBaseGrantedAbility(ability)) {
    const attribute = cardAttributes(state, ctx.sourceCardId).find((value) => ATTRIBUTES.includes(value as ShishigouAttribute));
    if (!attribute) return false;
    const target = shishigouNecromancyTarget(state, ctx.controllerId, attribute);
    return target ? { activate: target } : false;
  }
  if (isShishigouCorpseRevealAbility(ability)) {
    const id = ctx.selections[SHISHIGOU_CORPSE_TARGET_ID]?.[0];
    if (!id || !shishigouCorpseCardIds(state, ctx.controllerId).includes(id)) return false;
    const cardState = runtime(state).cardState[id];
    if (!cardState || cardState.faceDown !== true) return false;
    cardState.faceDown = false; state.cards.find((entry) => entry.instanceId === id)!.visibility = { scope: 'public' };
    return { targetCardId: id };
  }
  if (isShishigouNecromancyAbility(ability)) return false;
  return {};
}

export function markShishigouCorpseRemoval(state: GameState, cardInstanceId: string): void {
  const r = runtime(state); r.shishigouCorpseRemovedCardIds ??= [];
  if (!r.shishigouCorpseRemovedCardIds.includes(cardInstanceId)) r.shishigouCorpseRemovedCardIds.push(cardInstanceId);
}
export function resolveShishigouStrength(state: GameState, playerId: string, locationId: string, move: (locationId: string) => void, sourceCardId = 'shishigou-necromancy'): void {
  move(locationId); composeTerrainAdvantageOverride(state, playerId, locationId as any, 2, 1, sourceCardId);
}
export function resolveShishigouMagic(state: GameState, playerId: string, locationId: string, sourceCardId: string): void {
  if (terrainAdvantageAtLocation(state, playerId, locationId as any) <= 0) throw new Error('NO_TERRAIN_ADVANTAGE');
  composeTerrainAdvantageOverride(state, playerId, locationId as any, 0, 2, sourceCardId);
}
