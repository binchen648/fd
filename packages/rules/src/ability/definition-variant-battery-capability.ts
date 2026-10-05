import { grantMana, spendMana } from '../core/rule-overrides';
import type { GameState } from '../schema/game';
import { getEffectiveCardAttributes } from './card-instance-state';
import type { AuthoringAbility, AuthoringCard, EffectContext, RuleNode } from './types';

export const DEFINITION_VARIANT_BATTERY_ACCESS_EFFECT = 'definition_variant_battery_access_rule' as const;
export const DEFINITION_VARIANT_BATTERY_RECHARGE_EFFECT = 'definition_variant_battery_recharge' as const;
export const DEFINITION_VARIANT_BATTERY_IGNORE_DEFEAT_EFFECT = 'definition_variant_battery_ignore_defeat_round' as const;
export const DEFINITION_VARIANT_BATTERY_OVERLOAD_EFFECT = 'definition_variant_battery_overload' as const;
export const DEFINITION_VARIANT_ACTIVATION_LOCK_EFFECT = 'definition_variant_activation_lock' as const;
export const DEFINITION_VARIANT_ASCENSION_STOCK_EFFECT = 'definition_variant_ascension_stock' as const;

const VARIANT_ATTRIBUTES = ['力量', '迅捷', '魔术', '特殊', '无属性'] as const;
type VariantAttribute = typeof VARIANT_ATTRIBUTES[number];

interface VariantSpec {
  id: string;
  attribute: VariantAttribute;
  excludeDefinitionIds: string[];
  excludeCardTypes: string[];
}

function rec(value: unknown): value is RuleNode {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exact(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function exactStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0) && new Set(value).size === value.length;
}
function normalResponse(ability: AuthoringAbility): boolean {
  return exact(ability.responseWindow as RuleNode, ['order', 'passBehavior']) &&
    ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window';
}
function common(ability: AuthoringAbility, targets: number): boolean {
  return ability.conditions.length === 0 && ability.targets.length === targets && ability.effects.length === 1 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && exact(ability.lifecycle as RuleNode, []) && exact(ability.limit as RuleNode, []) &&
    exact(ability.visibility as RuleNode, []) && normalResponse(ability) && ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}
function key(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }
function variantSpecs(value: unknown): VariantSpec[] | undefined {
  if (!Array.isArray(value) || value.length !== 5) return undefined;
  const specs: VariantSpec[] = [];
  for (const raw of value) {
    if (!rec(raw) || !exact(raw, ['id', 'attribute', 'excludeDefinitionIds', 'excludeCardTypes']) || !key(raw.id) ||
        !(VARIANT_ATTRIBUTES as readonly string[]).includes(String(raw.attribute)) || !exactStringArray(raw.excludeDefinitionIds) || !exactStringArray(raw.excludeCardTypes)) return undefined;
    specs.push({ id: String(raw.id), attribute: String(raw.attribute) as VariantAttribute,
      excludeDefinitionIds: [...raw.excludeDefinitionIds as string[]], excludeCardTypes: [...raw.excludeCardTypes as string[]] });
  }
  if (new Set(specs.map((entry) => entry.id)).size !== specs.length || new Set(specs.map((entry) => entry.attribute)).size !== specs.length) return undefined;
  return specs;
}
function choiceTarget(target: RuleNode, id: string): boolean {
  if (!exact(target, ['id', 'type', 'options', 'count']) || target.id !== id || target.type !== 'choice' || !Array.isArray(target.options)) return false;
  const count = rec(target.count) ? target.count : {};
  return exact(count, ['min', 'max']) && count.min === 1 && count.max === 1 && target.options.every((option) =>
    rec(option) && exact(option, ['id', 'label']) && key(option.id) && typeof option.label === 'string');
}
function batteryCommonEffect(effect: RuleNode, extra: readonly string[]): boolean {
  const keys = ['type', 'workshopLocationId', 'sharedUsageKey', 'accessProviderDefinitionId', 'enhancedProviderDefinitionId',
    'enhancedAttribute', 'enhancedPowerBonus', ...extra];
  return exact(effect, keys) && effect.workshopLocationId === 'magic_workshop' && key(effect.sharedUsageKey) && key(effect.accessProviderDefinitionId) &&
    key(effect.enhancedProviderDefinitionId) && effect.enhancedAttribute === '魔术' && effect.enhancedPowerBonus === 2;
}

export function isDefinitionVariantBatteryAccessEffect(effect: RuleNode): boolean {
  return effect.type === DEFINITION_VARIANT_BATTERY_ACCESS_EFFECT && key(effect.batteryDefinitionId) && effect.workshopLocationId === 'magic_workshop' &&
    key(effect.sharedUsageKey) && exact(effect, ['type', 'batteryDefinitionId', 'workshopLocationId', 'sharedUsageKey']);
}
export function isDefinitionVariantBatteryRechargeEffect(effect: RuleNode): boolean {
  return effect.type === DEFINITION_VARIANT_BATTERY_RECHARGE_EFFECT && batteryCommonEffect(effect, ['vpTargetId', 'manaBase', 'manaPerVp']) &&
    effect.vpTargetId === 'vp_spend' && effect.manaBase === 1 && effect.manaPerVp === 2;
}
export function isDefinitionVariantBatteryIgnoreDefeatEffect(effect: RuleNode): boolean {
  return effect.type === DEFINITION_VARIANT_BATTERY_IGNORE_DEFEAT_EFFECT && batteryCommonEffect(effect, ['manaCost']) && effect.manaCost === 2;
}
export function isDefinitionVariantBatteryOverloadEffect(effect: RuleNode): boolean {
  return effect.type === DEFINITION_VARIANT_BATTERY_OVERLOAD_EFFECT && batteryCommonEffect(effect, ['variantDefinitionId', 'variantTargetId', 'variants']) &&
    key(effect.variantDefinitionId) && effect.variantTargetId === 'definition_variant' && !!variantSpecs(effect.variants);
}
export function isDefinitionVariantActivationLockEffect(effect: RuleNode): boolean {
  return effect.type === DEFINITION_VARIANT_ACTIVATION_LOCK_EFFECT && !!variantSpecs(effect.variants) && exact(effect, ['type', 'variants']);
}
export function isDefinitionVariantAscensionStockEffect(effect: RuleNode): boolean {
  return effect.type === DEFINITION_VARIANT_ASCENSION_STOCK_EFFECT && key(effect.variantDefinitionId) && !!variantSpecs(effect.variants) &&
    exact(effect, ['type', 'variantDefinitionId', 'variants']);
}

export function isAcceptedDefinitionVariantBatteryAbility(ability: AuthoringAbility): boolean {
  const effect = ability.effects[0]; if (!effect) return false;
  if (isDefinitionVariantBatteryAccessEffect(effect)) {
    return common(ability, 0) && ability.kind === 'passive' && exact(ability.activation as RuleNode, ['trigger']) && ability.activation.trigger === 'while_active';
  }
  if (isDefinitionVariantBatteryRechargeEffect(effect)) {
    return common(ability, 1) && ability.kind === 'phase_action' && exact(ability.activation as RuleNode, ['phase', 'opens']) &&
      ability.activation.phase === 'advance' && ability.activation.opens === 'controller_action_window' && choiceTarget(ability.targets[0]!, 'vp_spend');
  }
  if (isDefinitionVariantBatteryIgnoreDefeatEffect(effect)) {
    return common(ability, 0) && ability.kind === 'phase_action' && exact(ability.activation as RuleNode, ['phase', 'opens']) &&
      ability.activation.phase === 'advance' && ability.activation.opens === 'controller_action_window';
  }
  if (isDefinitionVariantBatteryOverloadEffect(effect)) {
    const specs = variantSpecs(effect.variants)!;
    if (!common(ability, 1) || ability.kind !== 'phase_action' || !exact(ability.activation as RuleNode, ['phase', 'opens']) ||
        ability.activation.phase !== 'combat' || ability.activation.opens !== 'controller_combat_action_window' || !choiceTarget(ability.targets[0]!, 'definition_variant')) return false;
    const optionIds = (ability.targets[0]!.options as Array<Record<string, unknown>>).map((entry) => String(entry.id));
    return optionIds.length === specs.length && optionIds.every((id, index) => id === specs[index]!.id);
  }
  if (isDefinitionVariantActivationLockEffect(effect)) {
    return common(ability, 0) && ability.kind === 'passive' && exact(ability.activation as RuleNode, ['trigger']) && ability.activation.trigger === 'while_active';
  }
  if (isDefinitionVariantAscensionStockEffect(effect)) {
    return common(ability, 0) && ability.kind === 'forced_trigger' && exact(ability.activation as RuleNode, ['trigger']) && ability.activation.trigger === 'after_master_ascension_unlocked';
  }
  return false;
}

const PRIVILEGED = new Set<string>([
  DEFINITION_VARIANT_BATTERY_ACCESS_EFFECT, DEFINITION_VARIANT_BATTERY_RECHARGE_EFFECT, DEFINITION_VARIANT_BATTERY_IGNORE_DEFEAT_EFFECT,
  DEFINITION_VARIANT_BATTERY_OVERLOAD_EFFECT, DEFINITION_VARIANT_ACTIVATION_LOCK_EFFECT, DEFINITION_VARIANT_ASCENSION_STOCK_EFFECT,
]);
export function containsDefinitionVariantBatteryPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsDefinitionVariantBatteryPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.type === 'string' && PRIVILEGED.has(candidate.type)) return true;
  return Object.values(candidate).some(containsDefinitionVariantBatteryPrivilegedNode);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('DEFINITION_VARIANT_BATTERY_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function liveOwnedDefinition(state: GameState, controllerId: string, definitionId: string): boolean {
  return state.cards.some((card) => card.ownerPlayerId === controllerId && card.controllerPlayerId === controllerId && card.definitionId === definitionId &&
    ['skill', 'field', 'attack_area'].includes(card.zone) && runtime(state).cardState[card.instanceId]?.faceDown !== true);
}
function sourceValid(state: GameState, ctx: EffectContext): boolean {
  const source = state.cards.find((entry) => entry.instanceId === ctx.sourceCardId);
  return !!source && source.ownerPlayerId === ctx.controllerId && source.controllerPlayerId === ctx.controllerId && source.zone === 'skill' &&
    runtime(state).cardState[source.instanceId]?.faceDown !== true;
}
function batterySharedUsageKey(state: GameState, sourceCardId: string, sharedUsageKey: string): string {
  return `definition-variant-battery:${sourceCardId}:${sharedUsageKey}:round:${state.round.roundNumber}`;
}
function sharedUsed(state: GameState, sourceCardId: string, sharedUsageKey: string): boolean {
  return (runtime(state).abilityUsage[batterySharedUsageKey(state, sourceCardId, sharedUsageKey)] ?? 0) >= 1;
}
function markSharedUsed(state: GameState, sourceCardId: string, sharedUsageKey: string): void {
  runtime(state).abilityUsage[batterySharedUsageKey(state, sourceCardId, sharedUsageKey)] = 1;
}
function enhancedProviderLive(state: GameState, controllerId: string, definitionId: string): boolean {
  return liveOwnedDefinition(state, controllerId, definitionId);
}
function batteryAccessProviderMatches(state: GameState, ctx: EffectContext, effect: RuleNode): boolean {
  const source = state.cards.find((entry) => entry.instanceId === ctx.sourceCardId); if (!source) return false;
  const providerDefinition = runtime(state).pack.cards[String(effect.accessProviderDefinitionId)];
  return !!providerDefinition && liveOwnedDefinition(state, ctx.controllerId, String(effect.accessProviderDefinitionId)) && providerDefinition.abilities.some((ability) =>
    isAcceptedDefinitionVariantBatteryAbility(ability) && isDefinitionVariantBatteryAccessEffect(ability.effects[0]!) &&
    ability.effects[0]!.batteryDefinitionId === source.definitionId && ability.effects[0]!.workshopLocationId === effect.workshopLocationId &&
    ability.effects[0]!.sharedUsageKey === effect.sharedUsageKey);
}
function playerAtWorkshop(state: GameState, controllerId: string, effect: RuleNode): boolean {
  return state.players.find((entry) => entry.id === controllerId)?.locationId === effect.workshopLocationId;
}
function variantRecords(state: GameState) { return runtime(state).definitionSkillVariants ??= {}; }
function variantSpecFor(effect: RuleNode, id: string): VariantSpec | undefined { return variantSpecs(effect.variants)?.find((entry) => entry.id === id); }
function existingVariantIds(state: GameState, controllerId: string, definitionId: string): Set<string> {
  return new Set(Object.values(variantRecords(state)).filter((record) => record.controllerId === controllerId && record.definitionId === definitionId).map((record) => record.variantId));
}

export function definitionVariantBatteryChoiceCandidates(state: GameState, controllerId: string, ability: AuthoringAbility): string[] {
  if (!isAcceptedDefinitionVariantBatteryAbility(ability)) return [];
  const effect = ability.effects[0]!;
  if (isDefinitionVariantBatteryRechargeEffect(effect)) {
    const player = state.players.find((entry) => entry.id === controllerId);
    if (!player || !Number.isSafeInteger(player.vp) || player.vp < 0) return [];
    return Array.from({ length: player.vp + 1 }, (_, index) => `vp:${index}`);
  }
  if (isDefinitionVariantBatteryOverloadEffect(effect)) {
    if (enhancedProviderLive(state, controllerId, String(effect.enhancedProviderDefinitionId))) return [];
    const used = existingVariantIds(state, controllerId, String(effect.variantDefinitionId));
    return variantSpecs(effect.variants)!.map((entry) => entry.id).filter((id) => !used.has(id));
  }
  return [];
}

function commonBatteryCanExecute(state: GameState, ctx: EffectContext, effect: RuleNode): boolean {
  return sourceValid(state, ctx) && playerAtWorkshop(state, ctx.controllerId, effect) && batteryAccessProviderMatches(state, ctx, effect) &&
    !sharedUsed(state, ctx.sourceCardId, String(effect.sharedUsageKey));
}
export function canExecuteDefinitionVariantBatteryEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedDefinitionVariantBatteryAbility(ability)) return false;
  const effect = ability.effects[0]!;
  if (isDefinitionVariantBatteryAccessEffect(effect) || isDefinitionVariantActivationLockEffect(effect)) return true;
  if (isDefinitionVariantAscensionStockEffect(effect)) {
    return sourceValid(state, ctx) && ctx.event?.type === 'after_master_ascension_unlocked' && ctx.event.playerId === ctx.controllerId && ctx.event.sourceCardId === ctx.sourceCardId;
  }
  if (!commonBatteryCanExecute(state, ctx, effect)) return false;
  const player = state.players.find((entry) => entry.id === ctx.controllerId); if (!player) return false;
  if (isDefinitionVariantBatteryRechargeEffect(effect)) return state.round.activePhase === 'advance' && Number.isSafeInteger(player.vp) && player.vp >= 0;
  if (isDefinitionVariantBatteryIgnoreDefeatEffect(effect)) return state.round.activePhase === 'advance' && player.mana >= Number(effect.manaCost);
  if (isDefinitionVariantBatteryOverloadEffect(effect)) return state.round.activePhase === 'battle' &&
    !enhancedProviderLive(state, ctx.controllerId, String(effect.enhancedProviderDefinitionId)) && definitionVariantBatteryChoiceCandidates(state, ctx.controllerId, ability).length > 0;
  return false;
}

function grantEnhancedBonusIfLive(state: GameState, ctx: EffectContext, effect: RuleNode): void {
  if (!enhancedProviderLive(state, ctx.controllerId, String(effect.enhancedProviderDefinitionId))) return;
  const list = runtime(state).roundCardAttributePowerBonuses ??= [];
  list.push({ controllerId: ctx.controllerId, attribute: String(effect.enhancedAttribute), amount: Number(effect.enhancedPowerBonus),
    round: state.round.roundNumber, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
}
function createVariant(state: GameState, ctx: EffectContext, definitionId: string, spec: VariantSpec, faceDown: boolean): string {
  const existing = Object.entries(variantRecords(state)).find(([, record]) => record.controllerId === ctx.controllerId && record.definitionId === definitionId && record.variantId === spec.id);
  if (existing) {
    const physical = state.cards.find((entry) => entry.instanceId === existing[0]);
    if (!physical) throw new Error('DEFINITION_VARIANT_PHYSICAL_MISSING');
    if (!faceDown && physical.zone === 'skill') {
      const cardState = runtime(state).cardState[physical.instanceId]; if (!cardState) throw new Error('DEFINITION_VARIANT_STATE_MISSING');
      cardState.faceDown = false; physical.visibility = { scope: 'owner_only', ownerPlayerId: ctx.controllerId };
    }
    return physical.instanceId;
  }
  if (!runtime(state).pack.cards[definitionId]) throw new Error('DEFINITION_VARIANT_DEFINITION_MISSING');
  const instanceId = `definition-variant:${ctx.controllerId}:${definitionId}:${spec.id}`;
  if (state.cards.some((entry) => entry.instanceId === instanceId)) throw new Error('DEFINITION_VARIANT_INSTANCE_COLLISION');
  state.cards.push({ instanceId, definitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId, zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId }, generatedBy: ctx.sourceCardId });
  runtime(state).cardState[instanceId] = { active: false, faceDown, playedRound: state.round.roundNumber };
  variantRecords(state)[instanceId] = { controllerId: ctx.controllerId, definitionId, variantId: spec.id, attribute: spec.attribute,
    sourceCardId: ctx.sourceCardId, sourceAbilityId: ctx.abilityId, createdRound: state.round.roundNumber };
  runtime(state).events.push({ type: 'definition_skill_variant_created', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
    abilityId: ctx.abilityId, cardInstanceId: instanceId, toZone: 'skill' });
  return instanceId;
}

export function resolveDefinitionVariantBatteryEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!canExecuteDefinitionVariantBatteryEffect(state, ctx, ability)) return false;
  const effect = ability.effects[0]!;
  if (isDefinitionVariantBatteryAccessEffect(effect) || isDefinitionVariantActivationLockEffect(effect)) return true;
  if (isDefinitionVariantAscensionStockEffect(effect)) {
    for (const spec of variantSpecs(effect.variants)!) createVariant(state, ctx, String(effect.variantDefinitionId), spec, false);
    return true;
  }
  if (isDefinitionVariantBatteryRechargeEffect(effect)) {
    const selected = ctx.selections[String(effect.vpTargetId)]?.[0];
    const match = /^vp:(\d+)$/.exec(selected ?? ''); if (!match) return false;
    const amount = Number(match[1]); const player = state.players.find((entry) => entry.id === ctx.controllerId)!;
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > player.vp) return false;
    const before = player.vp; player.vp -= amount;
    runtime(state).events.push({ type: 'victory_points_adjusted', playerId: ctx.controllerId, resource: 'victory_points', delta: -amount, before, after: player.vp,
      sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    grantMana(state, ctx.controllerId, Number(effect.manaBase) + Number(effect.manaPerVp) * amount, { source: 'generic' });
    markSharedUsed(state, ctx.sourceCardId, String(effect.sharedUsageKey)); grantEnhancedBonusIfLive(state, ctx, effect); return true;
  }
  if (isDefinitionVariantBatteryIgnoreDefeatEffect(effect)) {
    spendMana(state, ctx.controllerId, Number(effect.manaCost));
    (runtime(state).battleLossIgnoreRoundByPlayer ??= {})[ctx.controllerId] = state.round.roundNumber;
    markSharedUsed(state, ctx.sourceCardId, String(effect.sharedUsageKey)); grantEnhancedBonusIfLive(state, ctx, effect); return true;
  }
  if (isDefinitionVariantBatteryOverloadEffect(effect)) {
    const selected = ctx.selections[String(effect.variantTargetId)]?.[0];
    if (!selected || !definitionVariantBatteryChoiceCandidates(state, ctx.controllerId, ability).includes(selected)) return false;
    const spec = variantSpecFor(effect, selected); if (!spec) return false;
    createVariant(state, ctx, String(effect.variantDefinitionId), spec, true);
    markSharedUsed(state, ctx.sourceCardId, String(effect.sharedUsageKey)); grantEnhancedBonusIfLive(state, ctx, effect); return true;
  }
  return false;
}

export function hasDefinitionVariantAttackMarker(card: AuthoringCard | undefined): boolean {
  return !!card && card.abilities.some((ability) => isAcceptedDefinitionVariantBatteryAbility(ability) && isDefinitionVariantActivationLockEffect(ability.effects[0]!));
}

export function definitionVariantAbilityActivationBlocked(state: GameState, sourceCardId: string): boolean {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId); if (!source) return false;
  const sourcePlayer = state.players.find((entry) => entry.id === source.controllerPlayerId && entry.status === 'active'); if (!sourcePlayer?.locationId) return false;
  const sourceDefinition = runtime(state).pack.cards[source.definitionId]; if (!sourceDefinition) return false;
  const attrs = getEffectiveCardAttributes(state, source.instanceId);
  for (const [instanceId, record] of Object.entries(runtime(state).definitionSkillVariants ?? {})) {
    const physical = state.cards.find((entry) => entry.instanceId === instanceId); const cardState = runtime(state).cardState[instanceId];
    if (!physical || physical.controllerPlayerId !== record.controllerId || physical.definitionId !== record.definitionId || physical.zone !== 'attack_area' ||
        cardState?.active !== true || cardState.faceDown === true) continue;
    const controller = state.players.find((entry) => entry.id === record.controllerId && entry.status === 'active');
    if (!controller?.locationId || controller.locationId !== sourcePlayer.locationId) continue;
    const provider = runtime(state).pack.cards[record.definitionId]; const lock = provider?.abilities.find((ability) =>
      isAcceptedDefinitionVariantBatteryAbility(ability) && isDefinitionVariantActivationLockEffect(ability.effects[0]!));
    if (!lock) continue;
    const spec = variantSpecFor(lock.effects[0]!, record.variantId); if (!spec || spec.attribute !== record.attribute) continue;
    if (spec.excludeDefinitionIds.includes(source.definitionId) || spec.excludeCardTypes.includes(sourceDefinition.cardType)) continue;
    if (spec.attribute === '无属性' ? attrs.length === 0 : attrs.includes(spec.attribute)) return true;
  }
  return false;
}

export function definitionVariantRoundCardPowerBonus(state: GameState, sourceCardId: string): number {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId); if (!source || source.zone !== 'attack_area') return 0;
  const definition = runtime(state).pack.cards[source.definitionId]; if (!definition || !['attack', 'basic_attack', 'servant_attack', 'servant_skill', 'servant_deck_card', 'master_deck_card', 'master_skill'].includes(definition.cardType)) return 0;
  const attrs = getEffectiveCardAttributes(state, sourceCardId);
  return (runtime(state).roundCardAttributePowerBonuses ?? []).filter((entry) => entry.controllerId === source.controllerPlayerId && entry.round === state.round.roundNumber && attrs.includes(entry.attribute))
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function definitionVariantBatteryRuntimeValidForRestore(state: GameState): boolean {
  const r = state.abilityRuntime; if (!r) return true;
  const playerIds = new Set(state.players.map((entry) => entry.id));
  for (const [instanceId, record] of Object.entries(r.definitionSkillVariants ?? {})) {
    if (!playerIds.has(record.controllerId) || !key(record.definitionId) || !key(record.variantId) || !(VARIANT_ATTRIBUTES as readonly string[]).includes(record.attribute) ||
        !key(record.sourceCardId) || !key(record.sourceAbilityId) || !Number.isSafeInteger(record.createdRound) || record.createdRound < 0 || record.createdRound > state.round.roundNumber) return false;
    const physical = state.cards.find((entry) => entry.instanceId === instanceId); const source = state.cards.find((entry) => entry.instanceId === record.sourceCardId);
    if (!physical || physical.ownerPlayerId !== record.controllerId || physical.controllerPlayerId !== record.controllerId || physical.definitionId !== record.definitionId ||
        !['skill', 'attack_area', 'discard', 'removed_from_game'].includes(physical.zone) || !source || source.ownerPlayerId !== record.controllerId || source.controllerPlayerId !== record.controllerId) return false;
    const sourceAbility = r.pack.cards[source.definitionId]?.abilities.find((ability) => ability.id === record.sourceAbilityId);
    if (!sourceAbility || !isAcceptedDefinitionVariantBatteryAbility(sourceAbility)) return false;
    const effect = sourceAbility.effects[0]!;
    const definitionId = isDefinitionVariantBatteryOverloadEffect(effect) || isDefinitionVariantAscensionStockEffect(effect) ? String(effect.variantDefinitionId) : '';
    const spec = variantSpecFor(effect, record.variantId);
    if (definitionId !== record.definitionId || !spec || spec.attribute !== record.attribute) return false;
  }
  for (const entry of r.roundCardAttributePowerBonuses ?? []) {
    if (!playerIds.has(entry.controllerId) || !key(entry.attribute) || entry.attribute !== '魔术' || entry.amount !== 2 || !Number.isSafeInteger(entry.round) || entry.round < 0 || entry.round > state.round.roundNumber ||
        !key(entry.sourceCardId) || !key(entry.abilityId)) return false;
    const source = state.cards.find((card) => card.instanceId === entry.sourceCardId && card.ownerPlayerId === entry.controllerId && card.controllerPlayerId === entry.controllerId);
    const ability = source ? r.pack.cards[source.definitionId]?.abilities.find((candidate) => candidate.id === entry.abilityId) : undefined;
    const effect = ability?.effects[0];
    if (!source || !ability || !effect || !isAcceptedDefinitionVariantBatteryAbility(ability) ||
        ![DEFINITION_VARIANT_BATTERY_RECHARGE_EFFECT, DEFINITION_VARIANT_BATTERY_IGNORE_DEFEAT_EFFECT, DEFINITION_VARIANT_BATTERY_OVERLOAD_EFFECT].includes(String(effect.type) as typeof DEFINITION_VARIANT_BATTERY_RECHARGE_EFFECT) ||
        String(effect.enhancedProviderDefinitionId) === '' || !enhancedProviderLive(state, entry.controllerId, String(effect.enhancedProviderDefinitionId))) return false;
  }
  return true;
}
