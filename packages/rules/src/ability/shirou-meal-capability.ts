import type { GameState } from '../schema/game';
import type { AbilityEvent, AuthoringAbility, PlayerId, RuleNode } from './types';
import { grantMana } from '../core/rule-overrides';
import { shuffleOwnedDeckDeterministically } from './deterministic-deck-order';
import { terrainAdvantageAtLocation } from './terrain-advantage-override';

export const SHIROU_MEAL_ASCENSION_EFFECT = 'shirou_meal_ascension' as const;
export const SHIROU_MEAL_ASCENSION_ROUND_END_EFFECT = 'shirou_meal_ascension_round_end' as const;
export const SHIROU_MEAL_PROCUREMENT_EFFECT = 'shirou_meal_procurement' as const;
export const SHIROU_MEAL_MENU_EFFECT = 'shirou_meal_menu' as const;
export const SHIROU_MEAL_GLUTTONY_EFFECT = 'shirou_meal_gluttony' as const;

export const SHIROU_MEAL_FOOD_TYPES = ['肉', '蔬菜', '鱼'] as const;
export type ShirouMealFood = typeof SHIROU_MEAL_FOOD_TYPES[number];
export type ShirouMealAttribute = '力量' | '迅捷' | '魔术';
export type ShirouMealFoodState = Record<ShirouMealFood, number>;

const FOOD_FOR_ATTRIBUTE: Record<ShirouMealAttribute, ShirouMealFood> = {
  力量: '肉', 迅捷: '蔬菜', 魔术: '鱼',
};
const ATTRIBUTE_SET = ['力量', '迅捷', '魔术', '特殊', '宝具'] as const;

function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function passiveShell(a: AuthoringAbility): boolean {
  return a.kind === 'passive' && a.activation.trigger === 'while_active' &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 &&
    a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 &&
    a.creates.length === 0 && a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 &&
    Object.keys(a.limit).length === 0 && Object.keys(a.visibility).length === 0;
}
function phaseActionShell(a: AuthoringAbility): boolean {
  return a.kind === 'phase_action' && a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 &&
    a.conditions.length === 0 && a.cost.length === 0 && a.creates.length === 0 &&
    a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 && Object.keys(a.limit).length === 0 &&
    Object.keys(a.visibility).length === 0;
}
function forcedRoundEndShell(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' && a.activation.trigger === 'round_end' &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 &&
    a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 &&
    a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 && Object.keys(a.limit).length === 0 &&
    Object.keys(a.visibility).length === 0;
}

export function isShirouMealAscensionAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return passiveShell(a) && a.effects.length === 1 && !!e && e.type === SHIROU_MEAL_ASCENSION_EFFECT &&
    exactKeys(e, ['type', 'foodCost', 'topDiscard']) && e.foodCost === 1 && e.topDiscard === 1;
}
export function isShirouMealAscensionRoundEndAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return forcedRoundEndShell(a) && a.effects.length === 1 && !!e && e.type === SHIROU_MEAL_ASCENSION_ROUND_END_EFFECT &&
    exactKeys(e, ['type', 'topDiscard']) && e.topDiscard === 1;
}
export function isShirouMealProcurementAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return phaseActionShell(a) && a.effects.length === 1 && !!e && e.type === SHIROU_MEAL_PROCUREMENT_EFFECT &&
    exactKeys(e, ['type']);
}
export function isShirouMealMenuAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return phaseActionShell(a) && a.effects.length === 1 && !!e && e.type === SHIROU_MEAL_MENU_EFFECT &&
    exactKeys(e, ['type', 'foodCost', 'samePowerBonus', 'differentMana', 'protectNextShuffle']) &&
    e.foodCost === 3 && e.samePowerBonus === 6 && e.differentMana === 4 && e.protectNextShuffle === true &&
    a.targets.length === 1 && a.targets[0]?.id === 'food_selection' && a.targets[0]?.type === 'choice';
}
export function isShirouMealGluttonyAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return passiveShell(a) && a.effects.length === 1 && !!e && e.type === SHIROU_MEAL_GLUTTONY_EFFECT &&
    exactKeys(e, ['type', 'vpLoss']) && e.vpLoss === 3;
}
export function containsShirouMealPrivilegedNode(a: AuthoringAbility): boolean {
  return [...a.effects, ...a.creates, ...a.ruleModifiers].some((node) =>
    [SHIROU_MEAL_ASCENSION_EFFECT, SHIROU_MEAL_ASCENSION_ROUND_END_EFFECT, SHIROU_MEAL_PROCUREMENT_EFFECT,
      SHIROU_MEAL_MENU_EFFECT, SHIROU_MEAL_GLUTTONY_EFFECT].includes(String(node.type) as never));
}
export function isAcceptedShirouMealAbility(a: AuthoringAbility): boolean {
  return isShirouMealAscensionAbility(a) || isShirouMealAscensionRoundEndAbility(a) ||
    isShirouMealProcurementAbility(a) || isShirouMealMenuAbility(a) || isShirouMealGluttonyAbility(a);
}
function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('ABILITY_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function isShirouMealDefinition(definition: { id?: string; ownerId?: string; owner?: { id?: string } } | undefined): boolean {
  const ownerId = definition?.ownerId ?? definition?.owner?.id;
  return ownerId === 'master.shirou-meal' || (ownerId === undefined && definition?.id?.startsWith('master.shirou-meal.skill.') === true);
}
/**
 * Every Shirou Meal privileged route is source-bound.  Shape alone is not
 * authority: a foreign owner's card may carry an identical effect envelope,
 * but it must not be able to borrow Shirou's food/menu/protection handlers.
 */
export function isShirouMealSourceAbility(state: GameState, sourceCardId: string, controllerId: PlayerId, ability: AuthoringAbility): boolean {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  if (!source || source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId) return false;
  const definition = runtime(state).pack.cards[source.definitionId];
  if (!isShirouMealDefinition(definition) || !definition) return false;
  const canonical = definition.abilities.find((entry) => entry.id === ability.id);
  return !!canonical && isAcceptedShirouMealAbility(canonical) && isAcceptedShirouMealAbility(ability);
}
function isShirouMealActionSource(state: GameState, sourceCardId: string, controllerId: PlayerId, abilityId: string, predicate: (ability: AuthoringAbility) => boolean): boolean {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  if (!source || source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId) return false;
  const definition = runtime(state).pack.cards[source.definitionId];
  return !!definition && isShirouMealDefinition(definition) && definition.abilities.some((entry) => entry.id === abilityId && predicate(entry));
}
function foodState(state: GameState, playerId: PlayerId): ShirouMealFoodState {
  const store = (runtime(state).shirouMealFoodByPlayer ??= {});
  const current = store[playerId] ?? { 肉: 0, 蔬菜: 0, 鱼: 0 };
  current.肉 = Number.isSafeInteger(current.肉) && current.肉 >= 0 ? current.肉 : 0;
  current.蔬菜 = Number.isSafeInteger(current.蔬菜) && current.蔬菜 >= 0 ? current.蔬菜 : 0;
  current.鱼 = Number.isSafeInteger(current.鱼) && current.鱼 >= 0 ? current.鱼 : 0;
  store[playerId] = current;
  return current;
}
export function shirouMealFood(state: GameState, playerId: PlayerId): ShirouMealFoodState {
  return { ...foodState(state, playerId) };
}
export function grantShirouMealFood(state: GameState, playerId: PlayerId, food: ShirouMealFood, amount = 1, sourceCardId?: string, abilityId?: string): void {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('INVALID_FOOD_AMOUNT');
  const current = foodState(state, playerId); current[food] += amount;
  runtime(state).events.push({ type: 'shirou_meal_food_gained', playerId, ...(sourceCardId ? { sourceCardId } : {}), ...(abilityId ? { abilityId } : {}), attribute: food, movedCount: amount });
}
export function spendShirouMealFood(state: GameState, playerId: PlayerId, foods: readonly ShirouMealFood[], sourceCardId?: string, abilityId?: string): void {
  if (foods.length === 0 || foods.some((food) => !SHIROU_MEAL_FOOD_TYPES.includes(food))) throw new Error('INVALID_FOOD_SELECTION');
  const current = foodState(state, playerId);
  const counts: ShirouMealFoodState = { 肉: 0, 蔬菜: 0, 鱼: 0 };
  for (const food of foods) counts[food]++;
  for (const food of SHIROU_MEAL_FOOD_TYPES) if (counts[food] > current[food]) throw new Error('INSUFFICIENT_FOOD');
  for (const food of SHIROU_MEAL_FOOD_TYPES) current[food] -= counts[food];
  runtime(state).events.push({ type: 'shirou_meal_food_spent', playerId, ...(sourceCardId ? { sourceCardId } : {}), ...(abilityId ? { abilityId } : {}), movedCount: foods.length, attribute: foods.join(',') });
}
export function spendAnyShirouMealFood(state: GameState, playerId: PlayerId, amount: number, sourceCardId?: string, abilityId?: string): void {
  if (!Number.isSafeInteger(amount) || amount < 0 || shirouMealTotalFood(state, playerId) < amount) throw new Error('INSUFFICIENT_FOOD');
  const foods: ShirouMealFood[] = [];
  const current = foodState(state, playerId);
  for (const food of SHIROU_MEAL_FOOD_TYPES) for (let index = 0; index < Math.min(current[food], amount - foods.length); index++) foods.push(food);
  spendShirouMealFood(state, playerId, foods, sourceCardId, abilityId);
}
export function shirouMealTotalFood(state: GameState, playerId: PlayerId): number {
  const current = foodState(state, playerId);
  return SHIROU_MEAL_FOOD_TYPES.reduce((sum, food) => sum + current[food], 0);
}

function sourceHasLiveAbility(state: GameState, playerId: PlayerId, predicate: (ability: AuthoringAbility) => boolean): boolean {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) return false;
  return state.cards.some((physical) => {
    if (physical.ownerPlayerId !== playerId || physical.controllerPlayerId !== playerId || !['field', 'attack_area'].includes(physical.zone)) return false;
    const stateOfCard = runtime(state).cardState[physical.instanceId];
    const definition = runtime(state).pack.cards[physical.definitionId];
    return stateOfCard?.active === true && stateOfCard.faceDown !== true && isShirouMealDefinition(definition) && !!definition && definition.abilities.some(predicate);
  });
}
export function shirouMealFoodPlayCost(state: GameState, sourceCardId: string): number {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  const definition = source && runtime(state).pack.cards[source.definitionId];
  return isShirouMealDefinition(definition) && !!definition && definition.abilities.some(isShirouMealAscensionAbility) ? 1 : 0;
}
export function shirouMealAscensionPowerBonus(state: GameState, sourceCardId: string, attributes: readonly string[]): number {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId);
  if (!source || !sourceHasLiveAbility(state, source.controllerPlayerId, isShirouMealAscensionAbility)) return 0;
  const foods = foodState(state, source.controllerPlayerId);
  return (['力量', '迅捷', '魔术'] as const).filter((attribute) => attributes.includes(attribute))
    .reduce((sum, attribute) => sum + foods[FOOD_FOR_ATTRIBUTE[attribute]], 0);
}

function cardAttributes(state: GameState, cardId: string): string[] {
  const definition = runtime(state).pack.cards[cardId];
  if (definition && Array.isArray(definition.cardFace.attributes)) return definition.cardFace.attributes.filter((value): value is string => typeof value === 'string');
  const dynamic = state as unknown as { modeState?: { cardAttributes?: Record<string, string[]> }; contentRuntime?: { cardAttributes?: Record<string, string[]> } };
  return dynamic.modeState?.cardAttributes?.[cardId] ?? dynamic.contentRuntime?.cardAttributes?.[cardId] ?? [];
}
function validProcurementAttributes(state: GameState, playerId: PlayerId): ShirouMealAttribute[] {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player?.locationId || terrainAdvantageAtLocation(state, playerId, player.locationId) <= 0) return [];
  const attributes = new Set<string>();
  for (const placement of state.eventPlacements.filter((entry) => entry.locationId === player.locationId)) {
    for (const attribute of cardAttributes(state, placement.eventCardId)) attributes.add(attribute);
    const extended = placement as typeof placement & { attributes?: unknown };
    if (Array.isArray(extended.attributes)) extended.attributes.filter((value): value is string => typeof value === 'string').forEach((value) => attributes.add(value));
  }
  if (state.currentSituationCardId) for (const attribute of cardAttributes(state, state.currentSituationCardId)) attributes.add(attribute);
  const extended = state as unknown as { currentSituationAttributes?: unknown };
  if (Array.isArray(extended.currentSituationAttributes)) extended.currentSituationAttributes.filter((value): value is string => typeof value === 'string').forEach((value) => attributes.add(value));
  return (['力量', '迅捷', '魔术'] as const).filter((attribute) => attributes.has(attribute));
}
export function canShirouMealProcurement(state: GameState, playerId: PlayerId): boolean {
  const previous = runtime(state).shirouMealProcurementRoundByPlayer?.[playerId];
  const available = validProcurementAttributes(state, playerId);
  const alreadyTaken = previous?.round === state.round.roundNumber ? new Set(previous.attributes) : new Set<string>();
  return available.some((attribute) => !alreadyTaken.has(attribute));
}
export function shirouMealProcurement(state: GameState, playerId: PlayerId, sourceCardId: string, abilityId: string): boolean {
  if (!isShirouMealActionSource(state, sourceCardId, playerId, abilityId, isShirouMealProcurementAbility)) return false;
  const r = runtime(state); const previous = r.shirouMealProcurementRoundByPlayer?.[playerId];
  const alreadyTaken = previous?.round === state.round.roundNumber ? new Set(previous.attributes) : new Set<string>();
  const attributes = validProcurementAttributes(state, playerId).filter((attribute) => !alreadyTaken.has(attribute));
  if (attributes.length === 0) return false;
  r.shirouMealProcurementRoundByPlayer ??= {};
  r.shirouMealProcurementRoundByPlayer[playerId] = { round: state.round.roundNumber, attributes: [...alreadyTaken, ...attributes] };
  for (const attribute of attributes) grantShirouMealFood(state, playerId, FOOD_FOR_ATTRIBUTE[attribute], 1, sourceCardId, abilityId);
  runtime(state).events.push({ type: 'shirou_meal_procurement_resolved', playerId, sourceCardId, abilityId, roundNumber: state.round.roundNumber, movedCount: attributes.length });
  return true;
}
export function shirouMealMenuChoices(state: GameState, playerId: PlayerId): string[] {
  const foods = foodState(state, playerId);
  const choices: string[] = [];
  for (const food of SHIROU_MEAL_FOOD_TYPES) if (foods[food] >= 3) choices.push(`${food},${food},${food}`);
  if (foods.肉 >= 1 && foods.蔬菜 >= 1 && foods.鱼 >= 1) choices.push('肉,蔬菜,鱼');
  return choices;
}
function parseMenuChoice(value: string): ShirouMealFood[] {
  const selected = value.split(',');
  if (selected.length !== 3 || selected.some((entry) => !SHIROU_MEAL_FOOD_TYPES.includes(entry as ShirouMealFood))) throw new Error('INVALID_FOOD_SELECTION');
  return selected as ShirouMealFood[];
}
export function resolveShirouMealAbility(state: GameState, ctx: { controllerId: PlayerId; sourceCardId: string; abilityId: string; selections: Record<string, string[]>; event?: AbilityEvent }, ability: AuthoringAbility, findPending: () => boolean): boolean {
  if (!isShirouMealSourceAbility(state, ctx.sourceCardId, ctx.controllerId, ability)) throw new Error('INVALID_SOURCE_OWNER');
  const effect = ability.effects[0]!;
  if (isShirouMealProcurementAbility(ability)) return shirouMealProcurement(state, ctx.controllerId, ctx.sourceCardId, ctx.abilityId);
  if (isShirouMealAscensionRoundEndAbility(ability)) {
    discardShirouMealDeckTop(state, ctx.controllerId, ctx.sourceCardId, ctx.abilityId);
    return true;
  }
  if (isShirouMealMenuAbility(ability)) {
    const selected = ctx.selections.food_selection?.[0];
    if (!selected) { if (shirouMealMenuChoices(state, ctx.controllerId).length === 0) throw new Error('INSUFFICIENT_FOOD'); if (findPending()) return true; throw new Error('FOOD_SELECTION_REQUIRED'); }
    const choices = shirouMealMenuChoices(state, ctx.controllerId);
    if (!choices.includes(selected)) throw new Error('INVALID_FOOD_SELECTION');
    const foods = parseMenuChoice(selected);
    const r = runtime(state); const source = state.cards.find((entry) => entry.instanceId === ctx.sourceCardId);
    if (!source || source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId || source.zone !== 'field' || r.cardState[source.instanceId]?.active !== true) throw new Error('INVALID_SOURCE_STATE');
    spendShirouMealFood(state, ctx.controllerId, foods, ctx.sourceCardId, ctx.abilityId);
    r.roundPlayerPowerAdjustments ??= [];
    if (foods.every((food) => food === foods[0])) r.roundPlayerPowerAdjustments.push({ playerId: ctx.controllerId, amount: 6, round: state.round.roundNumber, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    else grantMana(state, ctx.controllerId, 4, { source: 'generic', controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    r.shirouMealProtectedNextShuffleByPlayer ??= {};
    r.shirouMealProtectedNextShuffleByPlayer[ctx.controllerId] = { sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId };
    r.events.push({ type: 'shirou_meal_menu_resolved', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, attribute: selected, movedCount: 3 });
    return true;
  }
  if (isShirouMealAscensionAbility(ability) || isShirouMealGluttonyAbility(ability)) return true;
  void effect;
  return false;
}
export function discardShirouMealDeckTop(state: GameState, playerId: PlayerId, sourceCardId: string, abilityId: string): boolean {
  const top = state.cards.find((entry) => entry.ownerPlayerId === playerId && entry.controllerPlayerId === playerId && entry.zone === 'deck');
  if (!top) return false;
  top.zone = 'discard'; top.visibility = { scope: 'owner_only', ownerPlayerId: playerId };
  const cardState = runtime(state).cardState[top.instanceId]; if (cardState) { cardState.active = false; cardState.faceDown = false; }
  runtime(state).events.push({ type: 'shirou_meal_ascension_discard_top', playerId, sourceCardId, abilityId, cardInstanceId: top.instanceId, fromZone: 'deck', toZone: 'discard', movedCount: 1 });
  return true;
}
export function recordShirouMealAutomaticRecycle(state: GameState, playerId: PlayerId, sourceCardId?: string, abilityId?: string): void {
  const source = state.cards.find((entry) => entry.ownerPlayerId === playerId && entry.controllerPlayerId === playerId && ['field', 'attack_area'].includes(entry.zone) && runtime(state).cardState[entry.instanceId]?.active === true && runtime(state).cardState[entry.instanceId]?.faceDown !== true && isShirouMealDefinition(runtime(state).pack.cards[entry.definitionId]) && runtime(state).pack.cards[entry.definitionId]?.abilities.some(isShirouMealGluttonyAbility));
  if (!source) return;
  const protection = runtime(state).shirouMealProtectedNextShuffleByPlayer?.[playerId];
  if (protection) {
    delete runtime(state).shirouMealProtectedNextShuffleByPlayer![playerId];
    runtime(state).events.push({ type: 'shirou_meal_gluttony_protected_shuffle', playerId, sourceCardId: protection.sourceCardId, abilityId: protection.abilityId });
    return;
  }
  const target = state.players.find((entry) => entry.id === playerId); if (!target) return;
  const before = target.vp; target.vp = Math.max(0, before - 3);
  runtime(state).events.push({ type: 'shirou_meal_gluttony_vp_loss', playerId, sourceCardId: sourceCardId ?? source.instanceId, abilityId: abilityId ?? 'deck_recycle', resource: 'victory_points', requestedDelta: -3, delta: target.vp - before, before, after: target.vp });
}
export function applyShirouMealPower(state: GameState, sourceCardId: string, attributes: readonly string[]): number {
  return shirouMealAscensionPowerBonus(state, sourceCardId, attributes);
}
export function shuffleOwnedDeckForShirouMeal(state: GameState, playerId: PlayerId, sourceCardId?: string, abilityId?: string): void {
  recordShirouMealAutomaticRecycle(state, playerId, sourceCardId, abilityId);
  shuffleOwnedDeckDeterministically(state, playerId);
}
