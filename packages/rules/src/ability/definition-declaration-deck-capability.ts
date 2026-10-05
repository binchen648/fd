import type { GameState } from '../schema/game';
import { grantMana, spendMana } from '../core/rule-overrides';
import { getEffectiveCardAttributes } from './card-instance-state';
import { shuffleOwnedDeckDeterministically } from './deterministic-deck-order';
import type { AuthoringAbility, AuthoringCard, EffectContext, ExecutableCardDefinition, RuleNode } from './types';

export const SET_OWNED_DEFINITION_SKILL_ACTIVE_EFFECT = 'set_owned_definition_skill_active' as const;
export const DEPLOYMENT_BATTERY_CHOICE_EFFECT = 'deployment_battery_choice' as const;
export const DECLARED_ATTRIBUTE_PLAY_RULE_EFFECT = 'declared_attribute_required_additional_play_rule' as const;
export const ZERO_MATCHING_OPPONENT_BASIC_ATTACKS_EFFECT = 'zero_matching_same_battlefield_opponent_basic_attacks' as const;
export const DECLARATION_SECRET_REWRITE_EFFECT = 'rewrite_definition_declaration_secret_until_combat' as const;
export const SCHEDULE_DECK_REBUILD_AFTER_UNLOCK_EFFECT = 'schedule_exact_deck_rebuild_after_unlock_round' as const;
export const REVEAL_SECRET_DECLARATIONS_EFFECT = 'reveal_secret_definition_declarations' as const;

export const DECLARED_ATTRIBUTE_OPTIONS = ['力量', '迅捷', '魔术', '特殊', '宝具'] as const;
export type DeclaredAttribute = typeof DECLARED_ATTRIBUTE_OPTIONS[number];

function rec(value: unknown): value is RuleNode { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value); return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function exactArray(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) && value.length === expected.length && value.every((entry, index) => entry === expected[index]);
}
function normalResponse(a: AuthoringAbility): boolean {
  return exact(a.responseWindow as unknown as RuleNode, ['order','passBehavior']) &&
    a.responseWindow.order === 'turn_order' && a.responseWindow.passBehavior === 'decline_this_window';
}
function emptyCommon(a: AuthoringAbility, effects = 1, targets = 0): boolean {
  return a.effects.length === effects && a.targets.length === targets && a.conditions.length === 0 && a.cost.length === 0 &&
    a.ruleModifiers.length === 0 && a.creates.length === 0 && empty(a.lifecycle as unknown as RuleNode) &&
    empty(a.limit as unknown as RuleNode) && empty(a.visibility as unknown as RuleNode) && normalResponse(a) &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0;
}

export function isSetOwnedDefinitionSkillActiveEffect(e: RuleNode): boolean {
  return e.type === SET_OWNED_DEFINITION_SKILL_ACTIVE_EFFECT && typeof e.definitionId === 'string' && e.definitionId.length > 0 &&
    typeof e.active === 'boolean' && exact(e, ['type','definitionId','active']);
}
export function isDeploymentBatteryChoiceEffect(e: RuleNode): boolean {
  return e.type === DEPLOYMENT_BATTERY_CHOICE_EFFECT && e.workshopLocationId === 'magic_workshop' &&
    typeof e.battlefieldDefinitionId === 'string' && e.battlefieldDefinitionId.length > 0 &&
    e.manaGain === 1 && e.ignoreDefeatManaCost === 2 && exact(e, ['type','workshopLocationId','battlefieldDefinitionId','manaGain','ignoreDefeatManaCost']);
}
export function isDeclaredAttributePlayRuleEffect(e: RuleNode): boolean {
  return e.type === DECLARED_ATTRIBUTE_PLAY_RULE_EFFECT && exactArray(e.allowedAttributes, DECLARED_ATTRIBUTE_OPTIONS) &&
    e.uniquePerGame === true && e.requiresActiveSkillSource === true &&
    exact(e, ['type','allowedAttributes','uniquePerGame','requiresActiveSkillSource']);
}
export function isZeroMatchingOpponentBasicAttacksEffect(e: RuleNode): boolean {
  return e.type === ZERO_MATCHING_OPPONENT_BASIC_ATTACKS_EFFECT && e.value === 0 && e.sameBattlefield === true && e.basicOnly === true &&
    exact(e, ['type','value','sameBattlefield','basicOnly']);
}
export function isDeclarationSecretRewriteEffect(e: RuleNode): boolean {
  return e.type === DECLARATION_SECRET_REWRITE_EFFECT && typeof e.definitionId === 'string' && e.definitionId.length > 0 &&
    e.allowRepeat === true && e.visibility === 'secret_until_combat_start' && exact(e, ['type','definitionId','allowRepeat','visibility']);
}
export function isScheduleDeckRebuildAfterUnlockEffect(e: RuleNode): boolean {
  return e.type === SCHEDULE_DECK_REBUILD_AFTER_UNLOCK_EFFECT && Array.isArray(e.definitionIds) && e.definitionIds.length > 0 &&
    e.definitionIds.every((id) => typeof id === 'string' && id.length > 0) && e.targetRoundOffset === 1 &&
    exact(e, ['type','definitionIds','targetRoundOffset']);
}
export function isRevealSecretDeclarationsEffect(e: RuleNode): boolean {
  return e.type === REVEAL_SECRET_DECLARATIONS_EFFECT && typeof e.definitionId === 'string' && e.definitionId.length > 0 &&
    exact(e, ['type','definitionId']);
}

function choiceTarget(target: RuleNode): boolean {
  if (target.id !== 'deployment_battery_mode' || target.type !== 'choice' || !exact(target, ['id','type','options','count'])) return false;
  if (!Array.isArray(target.options) || target.options.length !== 2) return false;
  const options = target.options.map((raw) => rec(raw) ? raw : {});
  if (!exact(options[0]!, ['id','label']) || options[0]!.id !== 'gain_mana' || typeof options[0]!.label !== 'string') return false;
  if (!exact(options[1]!, ['id','label']) || options[1]!.id !== 'ignore_defeat' || typeof options[1]!.label !== 'string') return false;
  const count = rec(target.count) ? target.count : {};
  return exact(count, ['min','max']) && count.min === 1 && count.max === 1;
}

export function isAcceptedDefinitionDeclarationDeckAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0]; if (!e) return false;
  if (isSetOwnedDefinitionSkillActiveEffect(e)) {
    if (!emptyCommon(a)) return false;
    if (a.kind !== 'forced_trigger' || !exact(a.activation as unknown as RuleNode, ['trigger'])) return false;
    if (e.active === false) return ['game_start','round_end'].includes(String(a.activation.trigger));
    return e.active === true && a.activation.trigger === 'after_player_deployed_to_battlefield';
  }
  if (isDeploymentBatteryChoiceEffect(e)) {
    return emptyCommon(a, 1, 1) && a.kind === 'forced_trigger' && exact(a.activation as unknown as RuleNode, ['trigger']) &&
      a.activation.trigger === 'after_player_deployed_to_location' && choiceTarget(a.targets[0]!);
  }
  if (isDeclaredAttributePlayRuleEffect(e)) {
    return emptyCommon(a) && a.kind === 'passive' && exact(a.activation as unknown as RuleNode, ['trigger']) && a.activation.trigger === 'while_active';
  }
  if (isZeroMatchingOpponentBasicAttacksEffect(e)) {
    return emptyCommon(a) && a.kind === 'phase_action' && exact(a.activation as unknown as RuleNode, ['phase','opens','requiresSourceState']) &&
      a.activation.phase === 'combat' && a.activation.opens === 'controller_combat_action_window' && a.activation.requiresSourceState === 'active';
  }
  if (isDeclarationSecretRewriteEffect(e)) {
    return emptyCommon(a) && a.kind === 'passive' && exact(a.activation as unknown as RuleNode, ['trigger']) && a.activation.trigger === 'while_active';
  }
  if (isScheduleDeckRebuildAfterUnlockEffect(e)) {
    return emptyCommon(a) && a.kind === 'forced_trigger' && exact(a.activation as unknown as RuleNode, ['trigger']) && a.activation.trigger === 'after_master_ascension_unlocked';
  }
  if (isRevealSecretDeclarationsEffect(e)) {
    return emptyCommon(a) && a.kind === 'forced_trigger' && exact(a.activation as unknown as RuleNode, ['trigger']) && a.activation.trigger === 'controller_combat_action_window';
  }
  return false;
}

const PRIVILEGED = new Set<string>([
  SET_OWNED_DEFINITION_SKILL_ACTIVE_EFFECT, DEPLOYMENT_BATTERY_CHOICE_EFFECT, DECLARED_ATTRIBUTE_PLAY_RULE_EFFECT,
  ZERO_MATCHING_OPPONENT_BASIC_ATTACKS_EFFECT, DECLARATION_SECRET_REWRITE_EFFECT, SCHEDULE_DECK_REBUILD_AFTER_UNLOCK_EFFECT,
  REVEAL_SECRET_DECLARATIONS_EFFECT,
]);
export function containsDefinitionDeclarationDeckPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsDefinitionDeclarationDeckPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.type === 'string' && PRIVILEGED.has(candidate.type)) return true;
  return Object.values(candidate).some(containsDefinitionDeclarationDeckPrivilegedNode);
}

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('DEFINITION_DECLARATION_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function sourceDefinition(state: GameState, sourceCardId: string): ExecutableCardDefinition | undefined {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  return source ? runtime(state).pack.cards[source.definitionId] as ExecutableCardDefinition | undefined : undefined;
}
function sourceValid(state: GameState, ctx: EffectContext): boolean {
  const source = state.cards.find((card) => card.instanceId === ctx.sourceCardId);
  const player = state.players.find((entry) => entry.id === ctx.controllerId);
  const definition = sourceDefinition(state, ctx.sourceCardId);
  return !!source && !!player && !!definition && source.ownerPlayerId === ctx.controllerId && source.controllerPlayerId === ctx.controllerId &&
    definition.cardType === 'master_skill' && source.definitionId.startsWith(`${player.masterCardId}.skill.`) &&
    ['skill','field','attack_area'].includes(source.zone) && runtime(state).cardState[source.instanceId]?.faceDown !== true;
}
function physicalDefinitionSkills(state: GameState, playerId: string, definitionId: string) {
  return state.cards.filter((card) => card.definitionId === definitionId && card.ownerPlayerId === playerId && card.controllerPlayerId === playerId);
}
function isBattlefield(state: GameState, locationId: string | undefined): boolean {
  return !!locationId && state.map.locations.some((location) => location.id === locationId && location.tags.includes('battlefield'));
}

export function deploymentBatteryChoiceCandidates(state: GameState, controllerId: string, ability: AuthoringAbility): string[] {
  if (!isAcceptedDefinitionDeclarationDeckAbility(ability) || !isDeploymentBatteryChoiceEffect(ability.effects[0]!)) return [];
  const player = state.players.find((entry) => entry.id === controllerId); if (!player) return [];
  return player.mana >= Number(ability.effects[0]!.ignoreDefeatManaCost) ? ['gain_mana','ignore_defeat'] : ['gain_mana'];
}

export function declarationPlayRule(definition: AuthoringCard | undefined): RuleNode | undefined {
  if (!definition) return undefined;
  const abilities = definition.abilities.filter((ability) => isAcceptedDefinitionDeclarationDeckAbility(ability) && isDeclaredAttributePlayRuleEffect(ability.effects[0]!));
  return abilities.length === 1 ? abilities[0]!.effects[0] : undefined;
}
function liveRewriteProvider(state: GameState, controllerId: string, targetDefinitionId: string): { sourceCardId: string; abilityId: string } | undefined {
  const matches: { sourceCardId: string; abilityId: string }[] = [];
  for (const source of state.cards) {
    if (source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId || !['skill','field','attack_area'].includes(source.zone)) continue;
    const sourceState = runtime(state).cardState[source.instanceId]; if (sourceState?.faceDown) continue;
    const definition = runtime(state).pack.cards[source.definitionId]; if (!definition) continue;
    for (const ability of definition.abilities) {
      const effect = ability.effects[0];
      if (effect && isAcceptedDefinitionDeclarationDeckAbility(ability) && isDeclarationSecretRewriteEffect(effect) && effect.definitionId === targetDefinitionId) {
        matches.push({ sourceCardId: source.instanceId, abilityId: ability.id });
      }
    }
  }
  return matches.length === 1 ? matches[0] : undefined;
}
function declarationHistory(state: GameState, playerId: string, definitionId: string): string[] {
  const all = runtime(state).declaredAttributesByPlayerDefinition ??= {};
  const byDefinition = all[playerId] ??= {};
  return byDefinition[definitionId] ??= [];
}
export function legalDeclaredAttributes(state: GameState, playerId: string, cardInstanceId: string): DeclaredAttribute[] {
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = physical ? runtime(state).pack.cards[physical.definitionId] : undefined;
  if (!physical || !declarationPlayRule(definition) || physical.ownerPlayerId !== playerId || physical.controllerPlayerId !== playerId ||
      physical.zone !== 'skill' || runtime(state).cardState[physical.instanceId]?.active !== true ||
      runtime(state).cardState[physical.instanceId]?.faceDown === true) return [];
  if (liveRewriteProvider(state, playerId, physical.definitionId)) return [...DECLARED_ATTRIBUTE_OPTIONS];
  const used = new Set(declarationHistory(state, playerId, physical.definitionId));
  return DECLARED_ATTRIBUTE_OPTIONS.filter((attribute) => !used.has(attribute));
}
export function validateDeclaredAttributePlay(state: GameState, playerId: string, cardInstanceId: string, declaredAttribute: unknown): { attribute: DeclaredAttribute; secret: boolean } | undefined {
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = physical ? runtime(state).pack.cards[physical.definitionId] : undefined;
  const rule = declarationPlayRule(definition);
  if (!rule) {
    if (declaredAttribute !== undefined) throw new Error('DECLARED_ATTRIBUTE_NOT_SUPPORTED');
    return undefined;
  }
  if (!physical || physical.ownerPlayerId !== playerId || physical.controllerPlayerId !== playerId || physical.zone !== 'skill' ||
      runtime(state).cardState[physical.instanceId]?.active !== true || runtime(state).cardState[physical.instanceId]?.faceDown === true) {
    throw new Error('DECLARED_ATTRIBUTE_SOURCE_NOT_ACTIVE');
  }
  if (typeof declaredAttribute !== 'string' || !(DECLARED_ATTRIBUTE_OPTIONS as readonly string[]).includes(declaredAttribute)) throw new Error('DECLARED_ATTRIBUTE_INVALID');
  const rewrite = liveRewriteProvider(state, playerId, physical.definitionId);
  if (!rewrite && declarationHistory(state, playerId, physical.definitionId).includes(declaredAttribute)) throw new Error('DECLARED_ATTRIBUTE_ALREADY_USED');
  return { attribute: declaredAttribute as DeclaredAttribute, secret: !!rewrite };
}
export function commitDeclaredAttributePlay(state: GameState, playerId: string, cardInstanceId: string, declaration: { attribute: DeclaredAttribute; secret: boolean } | undefined): void {
  if (!declaration) return;
  const physical = state.cards.find((card) => card.instanceId === cardInstanceId); if (!physical) throw new Error('DECLARED_ATTRIBUTE_SOURCE_MISSING');
  const cardState = runtime(state).cardState[cardInstanceId]; if (!cardState) throw new Error('DECLARED_ATTRIBUTE_STATE_MISSING');
  cardState.declaredAttribute = declaration.attribute;
  cardState.declaredAttributeRevealed = !declaration.secret;
  const history = declarationHistory(state, playerId, physical.definitionId);
  if (!history.includes(declaration.attribute)) history.push(declaration.attribute);
  runtime(state).events.push(declaration.secret
    ? { type: 'card_attribute_declared_secret', playerId, sourceCardId: cardInstanceId }
    : { type: 'card_attribute_declared', playerId, sourceCardId: cardInstanceId, attribute: declaration.attribute });
}

export function canExecuteDefinitionDeclarationDeckEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedDefinitionDeclarationDeckAbility(ability) || !sourceValid(state, ctx)) return false;
  const effect = ability.effects[0]!;
  if (isSetOwnedDefinitionSkillActiveEffect(effect)) {
    if (ability.activation.trigger === 'after_player_deployed_to_battlefield') {
      return ctx.event?.type === 'after_player_deployed_to_battlefield' && ctx.event.playerId === ctx.controllerId && isBattlefield(state, ctx.event.locationId) && physicalDefinitionSkills(state, ctx.controllerId, String(effect.definitionId)).length === 1;
    }
    return ctx.event?.type === ability.activation.trigger && physicalDefinitionSkills(state, ctx.controllerId, String(effect.definitionId)).length === 1;
  }
  if (isDeploymentBatteryChoiceEffect(effect)) {
    return ctx.event?.type === 'after_player_deployed_to_location' && ctx.event.playerId === ctx.controllerId &&
      ctx.event.locationId === effect.workshopLocationId && state.round.activePhase === 'advance';
  }
  if (isZeroMatchingOpponentBasicAttacksEffect(effect)) {
    const source = state.cards.find((card) => card.instanceId === ctx.sourceCardId); const sourceState = source ? runtime(state).cardState[source.instanceId] : undefined;
    const controller = state.players.find((player) => player.id === ctx.controllerId);
    return state.round.activePhase === 'battle' && source?.zone === 'attack_area' && sourceState?.active === true && sourceState.faceDown !== true &&
      typeof sourceState.declaredAttribute === 'string' && sourceState.declaredAttributeRevealed === true && isBattlefield(state, controller?.locationId);
  }
  if (isScheduleDeckRebuildAfterUnlockEffect(effect)) {
    return ctx.event?.type === 'after_master_ascension_unlocked' && ctx.event.playerId === ctx.controllerId && ctx.event.sourceCardId === ctx.sourceCardId &&
      (effect.definitionIds as string[]).every((id) => !!runtime(state).pack.cards[String(id)]);
  }
  if (isRevealSecretDeclarationsEffect(effect)) {
    return ctx.event?.type === 'controller_combat_action_window' && state.round.activePhase === 'battle';
  }
  return false;
}

export function resolveDefinitionDeclarationDeckEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!canExecuteDefinitionDeclarationDeckEffect(state, ctx, ability)) return false;
  const effect = ability.effects[0]!; const r = runtime(state); const player = state.players.find((entry) => entry.id === ctx.controllerId)!;
  if (isSetOwnedDefinitionSkillActiveEffect(effect)) {
    const target = physicalDefinitionSkills(state, ctx.controllerId, String(effect.definitionId))[0]!;
    const targetState = r.cardState[target.instanceId] ??= { active: false, faceDown: false, playedRound: state.round.roundNumber };
    targetState.active = effect.active === true; targetState.faceDown = false;
    target.visibility = effect.active === true ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: ctx.controllerId };
    r.events.push({ type: effect.active === true ? 'definition_skill_activated' : 'definition_skill_deactivated', playerId: ctx.controllerId,
      sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, cardInstanceId: target.instanceId });
    return true;
  }
  if (isDeploymentBatteryChoiceEffect(effect)) {
    const selected = ctx.selections.deployment_battery_mode?.[0];
    if (!selected || !deploymentBatteryChoiceCandidates(state, ctx.controllerId, ability).includes(selected)) return false;
    if (selected === 'gain_mana') grantMana(state, ctx.controllerId, Number(effect.manaGain), { source: 'generic' });
    else {
      spendMana(state, ctx.controllerId, Number(effect.ignoreDefeatManaCost));
      (r.battleLossIgnoreRoundByPlayer ??= {})[ctx.controllerId] = state.round.roundNumber;
      r.events.push({ type: 'battle_loss_effects_ignored_this_round', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    }
    return true;
  }
  if (isZeroMatchingOpponentBasicAttacksEffect(effect)) {
    const sourceState = r.cardState[ctx.sourceCardId]!; const attribute = sourceState.declaredAttribute!; const locationId = player.locationId!;
    for (const target of state.cards) {
      const targetPlayer = state.players.find((entry) => entry.id === target.controllerPlayerId);
      const targetState = r.cardState[target.instanceId]; const definition = r.pack.cards[target.definitionId];
      if (!targetPlayer || targetPlayer.id === ctx.controllerId || targetPlayer.status !== 'active' || targetPlayer.locationId !== locationId ||
          target.zone !== 'attack_area' || targetState?.active !== true || targetState.faceDown === true || definition?.cardType !== 'basic_attack' ||
          !getEffectiveCardAttributes(state, target.instanceId).includes(attribute)) continue;
      const carrier = target as unknown as { powerModifiers?: Array<Record<string, unknown>> }; carrier.powerModifiers ??= [];
      const id = `declared-attribute-zero:${state.round.roundNumber}:${ctx.sourceCardId}:${ctx.abilityId}:${target.instanceId}`;
      if (!carrier.powerModifiers.some((modifier) => modifier.id === id)) carrier.powerModifiers.push({ id, sourceId: ctx.sourceCardId,
        controllerId: ctx.controllerId, kind: 'set', value: 0, lifecycle: 'until_leaves_active_area', round: state.round.roundNumber });
    }
    return true;
  }
  if (isScheduleDeckRebuildAfterUnlockEffect(effect)) {
    r.pendingExactDeckRebuilds ??= [];
    const targetRound = state.round.roundNumber + Number(effect.targetRoundOffset);
    if (!r.pendingExactDeckRebuilds.some((entry) => entry.controllerId === ctx.controllerId && entry.sourceCardId === ctx.sourceCardId && entry.abilityId === ctx.abilityId)) {
      r.pendingExactDeckRebuilds.push({ controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, targetRound,
        definitionIds: (effect.definitionIds as string[]).map(String) });
    }
    return true;
  }
  if (isRevealSecretDeclarationsEffect(effect)) {
    for (const physical of state.cards.filter((card) => card.ownerPlayerId === ctx.controllerId && card.controllerPlayerId === ctx.controllerId && card.definitionId === effect.definitionId && card.zone === 'attack_area')) {
      const cardState = r.cardState[physical.instanceId];
      if (cardState?.declaredAttribute && cardState.declaredAttributeRevealed === false) cardState.declaredAttributeRevealed = true;
    }
    return true;
  }
  return false;
}

export function applyDueExactDeckRebuilds(state: GameState, round: number): void {
  const r = runtime(state); const pending = r.pendingExactDeckRebuilds ?? [];
  const due = pending.filter((entry) => entry.targetRound === round); if (!due.length) return;
  for (const entry of due) {
    const player = state.players.find((candidate) => candidate.id === entry.controllerId); if (!player) throw new Error('EXACT_DECK_REBUILD_PLAYER_MISSING');
    for (const physical of state.cards.filter((card) => card.ownerPlayerId === entry.controllerId && ['hand','deck','discard'].includes(card.zone))) {
      physical.zone = 'removed_from_game'; physical.visibility = { scope: 'public' };
      const cardState = r.cardState[physical.instanceId]; if (cardState) { cardState.active = false; cardState.faceDown = false; }
    }
    entry.definitionIds.forEach((definitionId, index) => {
      if (!r.pack.cards[definitionId]) throw new Error('EXACT_DECK_REBUILD_DEFINITION_MISSING');
      const instanceId = `exact-deck-rebuild:${entry.controllerId}:${round}:${index}:${definitionId}`;
      if (state.cards.some((card) => card.instanceId === instanceId)) throw new Error('EXACT_DECK_REBUILD_DUPLICATE_INSTANCE');
      state.cards.push({ instanceId, definitionId, ownerPlayerId: entry.controllerId, controllerPlayerId: entry.controllerId,
        zone: 'deck', visibility: { scope: 'owner_only', ownerPlayerId: entry.controllerId }, generatedBy: entry.sourceCardId });
      r.cardState[instanceId] = { active: false, faceDown: false, playedRound: Math.max(0, round - 1) };
    });
    shuffleOwnedDeckDeterministically(state, entry.controllerId);
    r.events.push({ type: 'exact_deck_rebuilt', playerId: entry.controllerId, sourceCardId: entry.sourceCardId, abilityId: entry.abilityId,
      movedCount: entry.definitionIds.length });
  }
  r.pendingExactDeckRebuilds = pending.filter((entry) => entry.targetRound !== round);
}

export function definitionDeclarationDeckRuntimeValidForRestore(state: GameState): boolean {
  const r = state.abilityRuntime; if (!r) return true;
  const playerIds = new Set(state.players.map((player) => player.id));
  for (const [playerId, byDefinition] of Object.entries(r.declaredAttributesByPlayerDefinition ?? {})) {
    if (!playerIds.has(playerId) || !rec(byDefinition)) return false;
    for (const [definitionId, values] of Object.entries(byDefinition)) {
      if (!r.pack.cards[definitionId] || !Array.isArray(values) || values.length > DECLARED_ATTRIBUTE_OPTIONS.length ||
          new Set(values).size !== values.length || values.some((value) => typeof value !== 'string' || !(DECLARED_ATTRIBUTE_OPTIONS as readonly string[]).includes(value))) return false;
    }
  }
  for (const physical of state.cards) {
    const cardState = r.cardState[physical.instanceId]; if (!cardState) continue;
    const hasDeclaration = cardState.declaredAttribute !== undefined || cardState.declaredAttributeRevealed !== undefined;
    if (hasDeclaration && (typeof cardState.declaredAttribute !== 'string' || !(DECLARED_ATTRIBUTE_OPTIONS as readonly string[]).includes(cardState.declaredAttribute) ||
        typeof cardState.declaredAttributeRevealed !== 'boolean' || !declarationPlayRule(r.pack.cards[physical.definitionId]))) return false;
  }
  for (const entry of r.pendingExactDeckRebuilds ?? []) {
    if (!playerIds.has(entry.controllerId) || !Number.isSafeInteger(entry.targetRound) || entry.targetRound < state.round.roundNumber || entry.targetRound > state.round.roundNumber + 1 ||
        !Array.isArray(entry.definitionIds) || entry.definitionIds.length === 0 || entry.definitionIds.some((id) => typeof id !== 'string' || !r.pack.cards[id])) return false;
    const source = state.cards.find((card) => card.instanceId === entry.sourceCardId && card.ownerPlayerId === entry.controllerId && card.controllerPlayerId === entry.controllerId);
    const ability = source ? r.pack.cards[source.definitionId]?.abilities.find((candidate) => candidate.id === entry.abilityId) : undefined;
    if (!source || !ability || !isAcceptedDefinitionDeclarationDeckAbility(ability) || !isScheduleDeckRebuildAfterUnlockEffect(ability.effects[0]!) ||
        !exactArray(entry.definitionIds, ability.effects[0]!.definitionIds as string[])) return false;
  }
  return true;
}
