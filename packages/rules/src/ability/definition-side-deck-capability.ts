import type { GameState } from '../schema/game';
import type { LocationId } from '../schema/location';
import { canOccupyLocation, getEnabledLocations } from '../core/map-engine';
import type {
  AbilityEvent, AuthoringAbility, DefinitionSideDeckInteractionMetadata, DefinitionSideDeckState,
  EffectContext, PendingDecision, RuleNode,
} from './types';
import { markCommandSealSpent } from './permanent-skill-tuning-capability';

export const DEFINITION_SIDE_DECK_SETUP_EFFECT = 'definition_side_deck_setup' as const;
export const DEFINITION_SIDE_DECK_MANA_DRAW_RULE_EFFECT = 'definition_side_deck_mana_draw_rule' as const;
export const DEFINITION_SIDE_DECK_PLAY_EFFECT = 'definition_side_deck_play_action' as const;
export const SOURCE_OPPONENT_COUNT_POWER_EFFECT = 'source_opponent_count_power' as const;
export const DEFINITION_SIDE_DECK_DISCARD_FOR_MANA_EFFECT = 'definition_side_deck_discard_for_mana' as const;
export const DEFINITION_SIDE_DECK_DELAYED_DRAW_DISCARD_EFFECT = 'definition_side_deck_delayed_draw_discard' as const;
export const ENTERING_OPPONENT_POWER_PENALTY_EFFECT = 'entering_opponent_power_penalty_round' as const;
export const DEFINITION_SIDE_DECK_BATTLE_LOSS_DRAW_EFFECT = 'definition_side_deck_battle_loss_draw' as const;
export const BATTLE_WIN_VP_SWING_EFFECT = 'battle_win_vp_swing' as const;
export const DEFEAT_ENGAGED_DEFINITION_CONTROLLER_EFFECT = 'defeat_engaged_definition_controller' as const;
export const SAME_BATTLEFIELD_DEFINITION_POWER_ZERO_EFFECT = 'same_battlefield_definition_power_zero' as const;
export const DEFINITION_SIDE_DECK_VIRTUAL_COMMAND_SEAL_EFFECT = 'definition_side_deck_virtual_command_seal' as const;
export const FORWARD_MOVE_SOURCE_POWER_EFFECT = 'forward_move_source_power' as const;
export const DISCARD_LOCATION_EVENT_BY_VP_EFFECT = 'discard_location_event_by_vp' as const;
export const CONTROLLER_ATTRIBUTE_POWER_BONUS_EFFECT = 'controller_attribute_power_bonus' as const;
export const UNSEALED_ENGAGED_OPPONENT_POWER_PENALTY_EFFECT = 'unsealed_engaged_opponent_power_penalty' as const;
export const DEFINITION_SIDE_DECK_DISCARD_ALL_SOURCE_POWER_EFFECT = 'definition_side_deck_discard_all_source_power' as const;
export const DEFINITION_SIDE_DECK_ONE_SHOT_CHOICE_EFFECT = 'definition_side_deck_one_shot_choice' as const;
export const DEFINITION_SIDE_DECK_UNLIMITED_PLAY_EFFECT = 'definition_side_deck_unlimited_play' as const;
export const DEFINITION_SIDE_DECK_PAY_MANA_DRAW_EFFECT = 'definition_side_deck_pay_mana_draw' as const;

const PRIVILEGED = new Set<string>([
  DEFINITION_SIDE_DECK_SETUP_EFFECT, DEFINITION_SIDE_DECK_MANA_DRAW_RULE_EFFECT, DEFINITION_SIDE_DECK_PLAY_EFFECT,
  SOURCE_OPPONENT_COUNT_POWER_EFFECT, DEFINITION_SIDE_DECK_DISCARD_FOR_MANA_EFFECT,
  DEFINITION_SIDE_DECK_DELAYED_DRAW_DISCARD_EFFECT, ENTERING_OPPONENT_POWER_PENALTY_EFFECT,
  DEFINITION_SIDE_DECK_BATTLE_LOSS_DRAW_EFFECT, BATTLE_WIN_VP_SWING_EFFECT, DEFEAT_ENGAGED_DEFINITION_CONTROLLER_EFFECT,
  SAME_BATTLEFIELD_DEFINITION_POWER_ZERO_EFFECT, DEFINITION_SIDE_DECK_VIRTUAL_COMMAND_SEAL_EFFECT,
  FORWARD_MOVE_SOURCE_POWER_EFFECT, DISCARD_LOCATION_EVENT_BY_VP_EFFECT, CONTROLLER_ATTRIBUTE_POWER_BONUS_EFFECT,
  UNSEALED_ENGAGED_OPPONENT_POWER_PENALTY_EFFECT, DEFINITION_SIDE_DECK_DISCARD_ALL_SOURCE_POWER_EFFECT,
  DEFINITION_SIDE_DECK_ONE_SHOT_CHOICE_EFFECT, DEFINITION_SIDE_DECK_UNLIMITED_PLAY_EFFECT,
  DEFINITION_SIDE_DECK_PAY_MANA_DRAW_EFFECT,
]);

function rec(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): boolean {
  if (!rec(value)) return false; const actual = Object.keys(value); return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function empty(value: unknown): boolean { return rec(value) && Object.keys(value).length === 0; }
function key(value: unknown): value is string { return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/i.test(value); }
function def(value: unknown): value is string { return typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]{0,191}$/i.test(value); }
function positive(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) > 0; }
function nonnegative(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) >= 0; }
function exactStringList(value: unknown, min = 1): value is string[] {
  return Array.isArray(value) && value.length >= min && new Set(value).size === value.length && value.every(def);
}
function standardResponse(a: AuthoringAbility): boolean {
  return exact(a.responseWindow, ['order', 'passBehavior']) && a.responseWindow.order === 'turn_order' && a.responseWindow.passBehavior === 'decline_this_window';
}
function common(a: AuthoringAbility, conditions = 0): boolean {
  return a.conditions.length === conditions && a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 && a.ruleModifiers.length === 0 &&
    empty(a.lifecycle) && empty(a.limit) && empty(a.visibility) && standardResponse(a) && a.execution.mode === 'automatic' &&
    Array.isArray(a.execution.allowedOperations) && a.execution.allowedOperations.length === 0;
}
function forced(a: AuthoringAbility, trigger: string, conditions = 0): boolean {
  return a.kind === 'forced_trigger' && exact(a.activation, ['trigger']) && a.activation.trigger === trigger && common(a, conditions);
}
function action(a: AuthoringAbility, phase: 'advance' | 'action' | 'combat'): boolean {
  return a.kind === 'phase_action' && exact(a.activation, ['phase', 'opens']) && a.activation.phase === phase &&
    a.activation.opens === (phase === 'combat' ? 'controller_combat_action_window' : 'controller_action_window') && common(a);
}
function passive(a: AuthoringAbility): boolean {
  return a.kind === 'passive' && exact(a.activation, ['trigger']) && a.activation.trigger === 'while_active' && common(a);
}
function residualOnPlay(a: AuthoringAbility): boolean {
  return (a.kind === 'forced_trigger' || a.kind === 'residual') && exact(a.activation, ['trigger']) && a.activation.trigger === 'on_card_played' && common(a);
}

export function isDefinitionSideDeckSetupEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_SETUP_EFFECT && key(e.deckKey) && exactStringList(e.definitionIds, 1) && e.shuffle === true &&
    e.recycleDiscard === true && e.replaceOrdinaryCommandSealsWithVirtual === true &&
    exact(e, ['type', 'deckKey', 'definitionIds', 'shuffle', 'recycleDiscard', 'replaceOrdinaryCommandSealsWithVirtual']);
}
export function isDefinitionSideDeckManaDrawRuleEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_MANA_DRAW_RULE_EFFECT && key(e.deckKey) && e.divisor === 2 && e.rounding === 'floor' &&
    Array.isArray(e.excludedSourceDefinitionIds) && e.excludedSourceDefinitionIds.every(def) &&
    exact(e, ['type', 'deckKey', 'divisor', 'rounding', 'excludedSourceDefinitionIds']);
}
export function isDefinitionSideDeckPlayEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_PLAY_EFFECT && key(e.deckKey) && key(e.usageKey) && e.maxUsesPerRound === 1 &&
    e.costSource === 'printed_cost' && exact(e, ['type', 'deckKey', 'usageKey', 'maxUsesPerRound', 'costSource']);
}
export function isSourceOpponentCountPowerEffect(e: RuleNode): boolean {
  return e.type === SOURCE_OPPONENT_COUNT_POWER_EFFECT && e.amountPerOpponent === 1 && e.requireSameBattlefield === true &&
    exact(e, ['type', 'amountPerOpponent', 'requireSameBattlefield']);
}
export function isDefinitionSideDeckDiscardForManaEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_DISCARD_FOR_MANA_EFFECT && key(e.deckKey) && e.maxDiscard === 3 && e.manaPerCard === 2 &&
    e.suppressManaDrawObserver === true && exact(e, ['type', 'deckKey', 'maxDiscard', 'manaPerCard', 'suppressManaDrawObserver']);
}
export function isDefinitionSideDeckDelayedDrawDiscardEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_DELAYED_DRAW_DISCARD_EFFECT && key(e.deckKey) && e.delayRounds === 1 && e.drawCount === 3 && e.discardCount === 2 &&
    exact(e, ['type', 'deckKey', 'delayRounds', 'drawCount', 'discardCount']);
}
export function isEnteringOpponentPowerPenaltyEffect(e: RuleNode): boolean {
  return e.type === ENTERING_OPPONENT_POWER_PENALTY_EFFECT && e.amount === 5 && e.duration === 'this_round' && e.requireSameLocation === true &&
    exact(e, ['type', 'amount', 'duration', 'requireSameLocation']);
}
export function isDefinitionSideDeckBattleLossDrawEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_BATTLE_LOSS_DRAW_EFFECT && key(e.deckKey) && e.count === 2 && exact(e, ['type', 'deckKey', 'count']);
}
export function isBattleWinVpSwingEffect(e: RuleNode): boolean {
  return e.type === BATTLE_WIN_VP_SWING_EFFECT && e.controllerGain === 2 && e.loserLoss === 2 && e.scope === 'battle_losers' &&
    exact(e, ['type', 'controllerGain', 'loserLoss', 'scope']);
}
export function isDefeatEngagedDefinitionControllerEffect(e: RuleNode): boolean {
  return e.type === DEFEAT_ENGAGED_DEFINITION_CONTROLLER_EFFECT && def(e.requiredControlledDefinitionId) && e.targetCount === 1 &&
    exact(e, ['type', 'requiredControlledDefinitionId', 'targetCount']);
}
export function isSameBattlefieldDefinitionPowerZeroEffect(e: RuleNode): boolean {
  return e.type === SAME_BATTLEFIELD_DEFINITION_POWER_ZERO_EFFECT && def(e.targetDefinitionId) && e.value === 0 &&
    exact(e, ['type', 'targetDefinitionId', 'value']);
}
export function isDefinitionSideDeckVirtualCommandSealEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_VIRTUAL_COMMAND_SEAL_EFFECT && key(e.deckKey) && e.closeSourceAfterUse === true &&
    exact(e, ['type', 'deckKey', 'closeSourceAfterUse']);
}
export function isForwardMoveSourcePowerEffect(e: RuleNode): boolean {
  return e.type === FORWARD_MOVE_SOURCE_POWER_EFFECT && e.minX === 1 && e.maxX === 8 && e.powerBase === 1 && e.powerPerX === 1 &&
    e.followMovementArrows === true && exact(e, ['type', 'minX', 'maxX', 'powerBase', 'powerPerX', 'followMovementArrows']);
}
export function isDiscardLocationEventByVpEffect(e: RuleNode): boolean {
  return e.type === DISCARD_LOCATION_EVENT_BY_VP_EFFECT && e.minimumX === 0 && e.vpOffset === 2 && e.requireControllerLocation === true &&
    exact(e, ['type', 'minimumX', 'vpOffset', 'requireControllerLocation']);
}
export function isControllerAttributePowerBonusEffect(e: RuleNode): boolean {
  return e.type === CONTROLLER_ATTRIBUTE_POWER_BONUS_EFFECT && typeof e.attribute === 'string' && e.attribute.length > 0 && e.amount === 2 &&
    exact(e, ['type', 'attribute', 'amount']);
}
export function isUnsealedEngagedOpponentPowerPenaltyEffect(e: RuleNode): boolean {
  return e.type === UNSEALED_ENGAGED_OPPONENT_POWER_PENALTY_EFFECT && e.amount === 3 && e.requireNoCommandSealSpendOrUseThisRound === true &&
    exact(e, ['type', 'amount', 'requireNoCommandSealSpendOrUseThisRound']);
}
export function isDefinitionSideDeckDiscardAllSourcePowerEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_DISCARD_ALL_SOURCE_POWER_EFFECT && key(e.deckKey) && e.multiplier === 2 && e.maximum === 10 &&
    exact(e, ['type', 'deckKey', 'multiplier', 'maximum']);
}
export function isDefinitionSideDeckOneShotChoiceEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_ONE_SHOT_CHOICE_EFFECT && key(e.deckKey) && e.oncePerGame === true && e.manaGain === 2 && e.directDraw === 1 &&
    e.victoryPointReward === 2 && e.allowAdjacentMove === true && e.allowBonusSideDeckPlay === true &&
    exact(e, ['type', 'deckKey', 'oncePerGame', 'manaGain', 'directDraw', 'victoryPointReward', 'allowAdjacentMove', 'allowBonusSideDeckPlay']);
}
export function isDefinitionSideDeckUnlimitedPlayEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_UNLIMITED_PLAY_EFFECT && key(e.deckKey) && e.unlimited === true && exact(e, ['type', 'deckKey', 'unlimited']);
}
export function isDefinitionSideDeckPayManaDrawEffect(e: RuleNode): boolean {
  return e.type === DEFINITION_SIDE_DECK_PAY_MANA_DRAW_EFFECT && key(e.deckKey) && e.manaCost === 4 && e.drawCount === 1 && e.suppressManaDrawObserver === true &&
    exact(e, ['type', 'deckKey', 'manaCost', 'drawCount', 'suppressManaDrawObserver']);
}

export function isAcceptedDefinitionSideDeckAbility(a: AuthoringAbility): boolean {
  if (a.effects.length !== 1) return false; const e = a.effects[0]!;
  if (isDefinitionSideDeckSetupEffect(e)) return forced(a, 'game_start');
  if (isDefinitionSideDeckManaDrawRuleEffect(e)) return passive(a);
  if (isDefinitionSideDeckPlayEffect(e)) return action(a, 'advance');
  if (isSourceOpponentCountPowerEffect(e)) return passive(a);
  if (isDefinitionSideDeckDiscardForManaEffect(e)) return action(a, 'action');
  if (isDefinitionSideDeckDelayedDrawDiscardEffect(e)) return residualOnPlay(a);
  if (isEnteringOpponentPowerPenaltyEffect(e)) return forced(a, 'after_controller_enters_location', 1) && a.conditions[0]?.type === 'event_player_is_opponent' && exact(a.conditions[0], ['type']);
  if (isDefinitionSideDeckBattleLossDrawEffect(e)) return forced(a, 'after_controller_loses_battle');
  if (isBattleWinVpSwingEffect(e)) return forced(a, 'after_controller_wins_battle');
  if (isDefeatEngagedDefinitionControllerEffect(e)) return action(a, 'combat');
  if (isSameBattlefieldDefinitionPowerZeroEffect(e)) return passive(a);
  if (isDefinitionSideDeckVirtualCommandSealEffect(e)) return residualOnPlay(a);
  if (isForwardMoveSourcePowerEffect(e)) return action(a, 'action');
  if (isDiscardLocationEventByVpEffect(e)) return action(a, 'action');
  if (isControllerAttributePowerBonusEffect(e)) return passive(a);
  if (isUnsealedEngagedOpponentPowerPenaltyEffect(e)) return passive(a);
  if (isDefinitionSideDeckDiscardAllSourcePowerEffect(e)) return residualOnPlay(a);
  if (isDefinitionSideDeckOneShotChoiceEffect(e)) return action(a, 'action');
  if (isDefinitionSideDeckUnlimitedPlayEffect(e)) return passive(a);
  if (isDefinitionSideDeckPayManaDrawEffect(e)) return action(a, 'action');
  return false;
}
export function containsDefinitionSideDeckPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsDefinitionSideDeckPrivilegedNode);
  if (!rec(value)) return false;
  if (typeof value.type === 'string' && PRIVILEGED.has(value.type)) return true;
  return Object.values(value).some(containsDefinitionSideDeckPrivilegedNode);
}

function runtime(s: GameState) { if (!s.abilityRuntime) throw new Error('DEFINITION_SIDE_DECK_RUNTIME_REQUIRED'); return s.abilityRuntime; }
function storageKey(controllerId: string, deckKey: string): string { return `${controllerId}:${deckKey}`; }
export function definitionSideDeckState(s: GameState, controllerId: string, deckKey: string): DefinitionSideDeckState | undefined {
  return runtime(s).definitionSideDecks?.[storageKey(controllerId, deckKey)];
}
function requiredState(s: GameState, controllerId: string, deckKey: string): DefinitionSideDeckState {
  const found = definitionSideDeckState(s, controllerId, deckKey); if (!found) throw new Error('DEFINITION_SIDE_DECK_NOT_INITIALIZED'); return found;
}
function deterministicShuffle(s: GameState, ids: readonly string[]): string[] {
  const out = [...ids]; const r = runtime(s);
  for (let i = out.length - 1; i > 0; i--) { let x = r.randomState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; r.randomState = x >>> 0;
    const j = Math.floor((r.randomState / 0x100000000) * (i + 1)); [out[i], out[j]] = [out[j]!, out[i]!]; }
  return out;
}
function remove(list: string[], id: string): void { const index = list.indexOf(id); if (index >= 0) list.splice(index, 1); }
function sideCard(s: GameState, state: DefinitionSideDeckState, id: string, zone?: string) {
  return s.cards.find((entry) => entry.instanceId === id && entry.ownerPlayerId === state.controllerId && entry.controllerPlayerId === state.controllerId &&
    entry.definitionSideDeckKey === state.deckKey && (!zone || entry.zone === zone));
}
function liveSource(s: GameState, controllerId: string, sourceCardId: string, abilityId: string): AuthoringAbility | undefined {
  const source = s.cards.find((entry) => entry.instanceId === sourceCardId && entry.ownerPlayerId === controllerId && entry.controllerPlayerId === controllerId && ['skill','field','attack_area'].includes(entry.zone));
  const ability = source ? runtime(s).pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === abilityId) : undefined;
  return ability && isAcceptedDefinitionSideDeckAbility(ability) ? ability : undefined;
}
function activeSource(s: GameState, sourceCardId: string): boolean {
  const source = s.cards.find((entry) => entry.instanceId === sourceCardId); const state = runtime(s).cardState[sourceCardId];
  return !!source && ['skill','field','attack_area'].includes(source.zone) && !!state && !state.faceDown && (source.zone === 'skill' || state.active);
}
function observerAbility(s: GameState, state: DefinitionSideDeckState): AuthoringAbility | undefined {
  const source = s.cards.find((entry) => entry.instanceId === state.providerSourceCardId && entry.controllerPlayerId === state.controllerId);
  return source ? runtime(s).pack.cards[source.definitionId]?.abilities.find((ability) => {
    const effect = ability.effects[0]; return !!effect && isAcceptedDefinitionSideDeckAbility(ability) && isDefinitionSideDeckManaDrawRuleEffect(effect) && effect.deckKey === state.deckKey;
  }) : undefined;
}
function unlimitedProvider(s: GameState, state: DefinitionSideDeckState): boolean {
  for (const physical of s.cards) {
    if (physical.controllerPlayerId !== state.controllerId || !activeSource(s, physical.instanceId)) continue;
    const definition = runtime(s).pack.cards[physical.definitionId];
    if (definition?.abilities.some((ability) => {
      const effect = ability.effects[0]; return !!effect && isAcceptedDefinitionSideDeckAbility(ability) && isDefinitionSideDeckUnlimitedPlayEffect(effect) && effect.deckKey === state.deckKey;
    })) return true;
  }
  return false;
}
function initialize(s: GameState, ctx: EffectContext, effect: RuleNode): DefinitionSideDeckState {
  const r = runtime(s); r.definitionSideDecks ??= {}; const sk = storageKey(ctx.controllerId, String(effect.deckKey));
  if (r.definitionSideDecks[sk]) return r.definitionSideDecks[sk]!;
  const definitionIds = [...(effect.definitionIds as string[])];
  if (definitionIds.some((id) => !r.pack.cards[id])) throw new Error('DEFINITION_SIDE_DECK_DEFINITION_MISSING');
  const ids = definitionIds.map((definitionId) => {
    const instanceId = `side:${String(effect.deckKey)}:${ctx.controllerId}:${r.sequence++}`;
    s.cards.push({ instanceId, definitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId, zone: 'definition_side_deck',
      visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId }, generatedBy: ctx.sourceCardId, definitionSideDeckKey: String(effect.deckKey) });
    r.cardState[instanceId] = { active: false, faceDown: true, playedRound: s.round.roundNumber }; return instanceId;
  });
  const state: DefinitionSideDeckState = { deckKey: String(effect.deckKey), controllerId: ctx.controllerId, providerSourceCardId: ctx.sourceCardId,
    providerAbilityId: ctx.abilityId, definitionIds, drawPile: deterministicShuffle(s, ids), hand: [], discardPile: [], recycleDiscard: true,
    initializedRevision: r.revision, lastObservedManaEventIndex: r.events.length, oneShotAvailable: true };
  r.definitionSideDecks[sk] = state;
  const player = s.players.find((entry) => entry.id === ctx.controllerId); if (player) (player as unknown as {commandSpells?:number}).commandSpells = 0;
  return state;
}
export function drawDefinitionSideDeck(s: GameState, controllerId: string, deckKey: string, count: number): string[] {
  const state = requiredState(s, controllerId, deckKey); if (!Number.isSafeInteger(count) || count < 0) throw new Error('DEFINITION_SIDE_DECK_DRAW_INVALID');
  const drawn: string[] = [];
  for (let n = 0; n < count; n++) {
    if (!state.drawPile.length && state.discardPile.length && state.recycleDiscard) {
      state.drawPile = deterministicShuffle(s, state.discardPile); state.discardPile = [];
      for (const id of state.drawPile) { const card = sideCard(s, state, id); if (!card) throw new Error('DEFINITION_SIDE_DECK_PROVENANCE_INVALID'); card.zone = 'definition_side_deck'; card.visibility = { scope: 'owner_only', ownerPlayerId: controllerId }; }
    }
    const id = state.drawPile.shift(); if (!id) break; const card = sideCard(s, state, id, 'definition_side_deck'); if (!card) throw new Error('DEFINITION_SIDE_DECK_PROVENANCE_INVALID');
    card.zone = 'definition_side_hand'; card.visibility = { scope: 'owner_only', ownerPlayerId: controllerId }; state.hand.push(id); drawn.push(id);
  }
  if (drawn.length) runtime(s).events.push({ type: 'definition_side_deck_drawn', playerId: controllerId, delta: drawn.length });
  return drawn;
}
export function discardDefinitionSideDeckHand(s: GameState, controllerId: string, deckKey: string, ids: readonly string[]): void {
  const state = requiredState(s, controllerId, deckKey); if (new Set(ids).size !== ids.length || ids.some((id) => !state.hand.includes(id))) throw new Error('DEFINITION_SIDE_DECK_HAND_SELECTION_INVALID');
  for (const id of ids) { const card = sideCard(s, state, id, 'definition_side_hand'); if (!card) throw new Error('DEFINITION_SIDE_DECK_PROVENANCE_INVALID'); }
  for (const id of ids) { remove(state.hand, id); state.discardPile.push(id); const card = sideCard(s, state, id)!; card.zone = 'definition_side_discard'; card.visibility = { scope: 'owner_only', ownerPlayerId: controllerId }; const cs = runtime(s).cardState[id]; if (cs) { cs.active = false; cs.faceDown = true; delete cs.roundPowerBonus; } }
}
export function returnDefinitionSideDeckCardToDiscard(s: GameState, cardInstanceId: string): boolean {
  const card = s.cards.find((entry) => entry.instanceId === cardInstanceId && !!entry.definitionSideDeckKey); if (!card) return false;
  const state = definitionSideDeckState(s, card.ownerPlayerId, card.definitionSideDeckKey!); if (!state) return false;
  remove(state.drawPile, cardInstanceId); remove(state.hand, cardInstanceId); remove(state.discardPile, cardInstanceId); state.discardPile.push(cardInstanceId);
  card.zone = 'definition_side_discard'; card.controllerPlayerId = card.ownerPlayerId; card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
  const cs = runtime(s).cardState[cardInstanceId]; if (cs) { cs.active = false; cs.faceDown = true; delete cs.roundPowerBonus; }
  if (state.virtualCommandSealSourceCardId === cardInstanceId) delete state.virtualCommandSealSourceCardId;
  return true;
}
function printedCost(s: GameState, id: string): number {
  const physical = s.cards.find((entry) => entry.instanceId === id); const raw = physical ? runtime(s).pack.cards[physical.definitionId]?.cardFace.cost : undefined;
  return Number.isSafeInteger(raw) && Number(raw) >= 0 ? Number(raw) : 0;
}
function playableSideHandIds(s: GameState, state: DefinitionSideDeckState): string[] {
  return state.hand.filter((id) => { const cost = printedCost(s, id); return state.hand.filter((other) => other !== id).length >= cost; });
}
function playLimitAvailable(s: GameState, state: DefinitionSideDeckState): boolean {
  if (unlimitedProvider(s, state)) return true;
  const uses = state.playUseRound === s.round.roundNumber ? Number(state.playUsesThisRound ?? 0) : 0;
  return uses < 1 || state.bonusPlayRound === s.round.roundNumber;
}
function consumePlayUse(s: GameState, state: DefinitionSideDeckState): void {
  if (state.bonusPlayRound === s.round.roundNumber) { delete state.bonusPlayRound; return; }
  if (unlimitedProvider(s, state)) return;
  if (state.playUseRound !== s.round.roundNumber) { state.playUseRound = s.round.roundNumber; state.playUsesThisRound = 0; }
  state.playUsesThisRound = Number(state.playUsesThisRound ?? 0) + 1;
}
function stage(s: GameState, ctx: EffectContext, state: DefinitionSideDeckState, stageName: DefinitionSideDeckInteractionMetadata['stage'], candidates: string[], min: number, max: number, targetKind: 'card'|'choice', selectedCardInstanceId?: string, paymentCount?: number): boolean {
  if (runtime(s).pendingDecision) return false; const id = `${ctx.sourceCardId}:${ctx.abilityId}:side:${runtime(s).sequence++}`;
  const interaction: DefinitionSideDeckInteractionMetadata = { kind: 'definition_side_deck_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
    sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(s).revision + 1, continuationRef: `${id}:continuation`,
    controllerId: ctx.controllerId, deckKey: state.deckKey, stage: stageName, candidateIds: [...candidates], constraints: { kind: 'target', targetKind, min, max, distinct: true },
    ...(selectedCardInstanceId ? { selectedCardInstanceId } : {}), ...(paymentCount !== undefined ? { paymentCount } : {}) };
  runtime(s).pendingDecision = { id, controllerId: ctx.controllerId, target: { id: `definition_side_deck_${stageName}`, type: targetKind, count: { min, max } },
    candidates: [...candidates], min, max, context: structuredClone(ctx), remainingEffects: [], interaction };
  return true;
}
function stagePlay(s: GameState, ctx: EffectContext, state: DefinitionSideDeckState): boolean {
  if (!playLimitAvailable(s, state)) return false; const candidates = playableSideHandIds(s, state); if (!candidates.length) return false;
  return stage(s, ctx, state, 'play', candidates, 1, 1, 'card');
}
function commitPlay(s: GameState, state: DefinitionSideDeckState, id: string): void {
  const card = sideCard(s, state, id, 'definition_side_hand'); if (!card || !state.hand.includes(id)) throw new Error('DEFINITION_SIDE_DECK_PLAY_INVALID');
  remove(state.hand, id); card.zone = 'attack_area'; card.visibility = { scope: 'public' }; const cs = runtime(s).cardState[id]; if (!cs) throw new Error('DEFINITION_SIDE_DECK_CARD_STATE_MISSING');
  cs.active = true; cs.faceDown = false; cs.playedRound = s.round.roundNumber; consumePlayUse(s, state);
}
function trustedBattle(s: GameState, event: AbilityEvent | undefined, controllerId: string, result: 'win'|'loss') {
  if (!event || event.playerId !== controllerId || event.type !== (result === 'win' ? 'after_controller_wins_battle' : 'after_controller_loses_battle') || !event.resultId) return undefined;
  const root = runtime(s).trustedBattleResultSnapshots?.[event.resultId]; if (!root || !root.battleParticipantIds.includes(controllerId)) return undefined;
  return result === 'win' ? (root.winners.includes(controllerId) ? root : undefined) : (root.loserIds.includes(controllerId) && !root.winners.includes(controllerId) ? root : undefined);
}
function sourceLocation(s: GameState, sourceCardId: string): string | undefined {
  const source = s.cards.find((entry) => entry.instanceId === sourceCardId); return source ? s.players.find((entry) => entry.id === source.controllerPlayerId)?.locationId : undefined;
}
function controllersOfDefinition(s: GameState, definitionId: string): string[] {
  return [...new Set(s.cards.filter((entry) => entry.definitionId === definitionId && ['skill','field','attack_area'].includes(entry.zone) && activeSource(s, entry.instanceId)).map((entry) => entry.controllerPlayerId))];
}
function adjacentLocations(s: GameState, playerId: string): string[] {
  const p = s.players.find((entry) => entry.id === playerId); if (!p?.locationId) return [];
  const enabled = getEnabledLocations(s.map, s.locationConfig); const current = enabled.find((entry) => entry.id === p.locationId); if (!current) return [];
  const ids = new Set<string>(current.movementLinks); for (const loc of enabled) if (loc.movementLinks.includes(p.locationId)) ids.add(loc.id);
  return [...ids].filter((id) => canOccupyLocation({ map: s.map, config: s.locationConfig, locationId: id as LocationId, movingPlayerId: playerId,
    occupyingPlayerIds: s.players.filter((entry) => entry.status === 'active' && entry.id !== playerId && entry.locationId === id).map((entry) => entry.id), ...(s.ruleOverrides ? { ruleOverrides: s.ruleOverrides } : {}) }));
}
function forwardReachable(s: GameState, playerId: string, maxSteps: number): Array<{ locationId: string; steps: number }> {
  const p = s.players.find((entry) => entry.id === playerId); if (!p?.locationId) return [];
  const byId = new Map(getEnabledLocations(s.map, s.locationConfig).map((entry) => [entry.id, entry])); const out: Array<{locationId:string;steps:number}> = [];
  let frontier: LocationId[] = [p.locationId]; const seen = new Map<string, number>([[p.locationId, 0]]);
  for (let step = 1; step <= maxSteps; step++) { const next: LocationId[] = []; for (const from of frontier) for (const to of byId.get(from)?.movementLinks ?? []) {
    if ((seen.get(to) ?? Infinity) <= step) continue; seen.set(to, step); next.push(to); const occupiers = s.players.filter((entry) => entry.status === 'active' && entry.id !== playerId && entry.locationId === to).map((entry) => entry.id);
    if (canOccupyLocation({ map: s.map, config: s.locationConfig, locationId: to, movingPlayerId: playerId, occupyingPlayerIds: occupiers, ...(s.ruleOverrides ? { ruleOverrides: s.ruleOverrides } : {}) })) out.push({ locationId: to, steps: step });
  } frontier = next; if (!frontier.length) break; }
  return out;
}

export interface DefinitionSideDeckOps {
  grantMana(playerId: string, amount: number, provenance: { controllerId: string; sourceCardId: string; abilityId: string; suppressDefinitionSideDeckDraw?: boolean }): number;
  spendMana(playerId: string, amount: number): boolean;
  movePlayer(playerId: string, toLocationId: string, sourceCardId: string, abilityId: string): boolean;
  emitCardPlayed(playerId: string, cardInstanceId: string): void;
}

function sourceActiveRequired(a: AuthoringAbility): boolean {
  const e = a.effects[0]; const activeTypes: readonly string[] = [DEFEAT_ENGAGED_DEFINITION_CONTROLLER_EFFECT, FORWARD_MOVE_SOURCE_POWER_EFFECT, DISCARD_LOCATION_EVENT_BY_VP_EFFECT];
  return !!e && activeTypes.includes(String(e.type));
}
export function canExecuteDefinitionSideDeckEffect(s: GameState, ctx: EffectContext, a: AuthoringAbility): boolean {
  if (!isAcceptedDefinitionSideDeckAbility(a) || !liveSource(s, ctx.controllerId, ctx.sourceCardId, ctx.abilityId)) return false; const e = a.effects[0]!;
  if (sourceActiveRequired(a) && !activeSource(s, ctx.sourceCardId)) return false;
  if (isDefinitionSideDeckSetupEffect(e)) return !definitionSideDeckState(s, ctx.controllerId, String(e.deckKey));
  if (isDefinitionSideDeckManaDrawRuleEffect(e) || isSourceOpponentCountPowerEffect(e) || isSameBattlefieldDefinitionPowerZeroEffect(e) || isControllerAttributePowerBonusEffect(e) || isUnsealedEngagedOpponentPowerPenaltyEffect(e) || isDefinitionSideDeckUnlimitedPlayEffect(e)) return true;
  if (isDefinitionSideDeckPlayEffect(e)) { const state = definitionSideDeckState(s, ctx.controllerId, String(e.deckKey)); return !!state && playLimitAvailable(s, state) && playableSideHandIds(s, state).length > 0; }
  if (isDefinitionSideDeckDiscardForManaEffect(e)) return !!definitionSideDeckState(s, ctx.controllerId, String(e.deckKey))?.hand.length;
  if (isDefinitionSideDeckDelayedDrawDiscardEffect(e) || isDefinitionSideDeckVirtualCommandSealEffect(e) || isDefinitionSideDeckDiscardAllSourcePowerEffect(e)) return ctx.event?.type === 'on_card_played' && ctx.event.sourceCardId === ctx.sourceCardId && ctx.event.playerId === ctx.controllerId;
  if (isEnteringOpponentPowerPenaltyEffect(e)) return ctx.event?.type === 'after_controller_enters_location' && !!ctx.event.playerId && ctx.event.playerId !== ctx.controllerId && ctx.event.locationId === sourceLocation(s, ctx.sourceCardId);
  if (isDefinitionSideDeckBattleLossDrawEffect(e)) return !!trustedBattle(s, ctx.event, ctx.controllerId, 'loss') && !!definitionSideDeckState(s, ctx.controllerId, String(e.deckKey));
  if (isBattleWinVpSwingEffect(e)) return !!trustedBattle(s, ctx.event, ctx.controllerId, 'win');
  if (isDefeatEngagedDefinitionControllerEffect(e)) { const loc = sourceLocation(s, ctx.sourceCardId); return !!loc && controllersOfDefinition(s, String(e.requiredControlledDefinitionId)).some((id) => id !== ctx.controllerId && s.players.some((p) => p.id === id && p.status === 'active' && p.locationId === loc)); }
  if (isForwardMoveSourcePowerEffect(e)) return forwardReachable(s, ctx.controllerId, Number(e.maxX)).length > 0;
  if (isDiscardLocationEventByVpEffect(e)) { const loc = sourceLocation(s, ctx.sourceCardId); return !!loc && s.eventPlacements.some((entry) => entry.locationId === loc && Number.isSafeInteger(entry.victoryPoints) && Number(entry.victoryPoints) >= Number(e.vpOffset)); }
  if (isDefinitionSideDeckOneShotChoiceEffect(e)) return definitionSideDeckState(s, ctx.controllerId, String(e.deckKey))?.oneShotAvailable === true;
  if (isDefinitionSideDeckPayManaDrawEffect(e)) return !!definitionSideDeckState(s, ctx.controllerId, String(e.deckKey)) && (s.players.find((p) => p.id === ctx.controllerId)?.mana ?? 0) >= Number(e.manaCost);
  return false;
}

export function resolveDefinitionSideDeckEffect(s: GameState, ctx: EffectContext, a: AuthoringAbility, ops: DefinitionSideDeckOps): boolean {
  if (!canExecuteDefinitionSideDeckEffect(s, ctx, a)) return false; const e = a.effects[0]!;
  if (isDefinitionSideDeckSetupEffect(e)) { initialize(s, ctx, e); return true; }
  if (isDefinitionSideDeckManaDrawRuleEffect(e) || isSourceOpponentCountPowerEffect(e) || isSameBattlefieldDefinitionPowerZeroEffect(e) || isControllerAttributePowerBonusEffect(e) || isUnsealedEngagedOpponentPowerPenaltyEffect(e) || isDefinitionSideDeckUnlimitedPlayEffect(e)) return true;
  if (isDefinitionSideDeckPlayEffect(e)) return stagePlay(s, ctx, requiredState(s, ctx.controllerId, String(e.deckKey)));
  if (isDefinitionSideDeckDiscardForManaEffect(e)) { const state = requiredState(s, ctx.controllerId, String(e.deckKey)); return stage(s, ctx, state, 'discard_for_mana', [...state.hand], 1, Math.min(Number(e.maxDiscard), state.hand.length), 'card'); }
  if (isDefinitionSideDeckDelayedDrawDiscardEffect(e)) { const state = requiredState(s, ctx.controllerId, String(e.deckKey)); state.delayedDrawDiscard = { targetRound: s.round.roundNumber + Number(e.delayRounds), drawCount: Number(e.drawCount), discardCount: Number(e.discardCount), sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId }; return true; }
  if (isEnteringOpponentPowerPenaltyEffect(e)) { const id = ctx.event!.playerId!; runtime(s).roundPlayerPowerAdjustments ??= []; runtime(s).roundPlayerPowerAdjustments!.push({ playerId: id, amount: -Number(e.amount), round: s.round.roundNumber, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId }); return true; }
  if (isDefinitionSideDeckBattleLossDrawEffect(e)) { drawDefinitionSideDeck(s, ctx.controllerId, String(e.deckKey), Number(e.count)); return true; }
  if (isBattleWinVpSwingEffect(e)) { const facts = trustedBattle(s, ctx.event, ctx.controllerId, 'win'); if (!facts) return false; const controller = s.players.find((p) => p.id === ctx.controllerId)!; controller.vp += Number(e.controllerGain); for (const id of facts.loserIds) { const p = s.players.find((x) => x.id === id); if (p) p.vp = Math.max(0, p.vp - Number(e.loserLoss)); } return true; }
  if (isDefeatEngagedDefinitionControllerEffect(e)) { const loc = sourceLocation(s, ctx.sourceCardId)!; const targets = controllersOfDefinition(s, String(e.requiredControlledDefinitionId)).filter((id) => id !== ctx.controllerId && s.players.some((p) => p.id === id && p.status === 'active' && p.locationId === loc)); return stage(s, ctx, { ...requiredAnyState(s, ctx.controllerId), deckKey: '__structural__' }, 'defeat_target', targets, 1, 1, 'choice'); }
  if (isDefinitionSideDeckVirtualCommandSealEffect(e)) { const state = requiredState(s, ctx.controllerId, String(e.deckKey)); if (!state.oneShotAvailable || state.virtualCommandSealSourceCardId) return true; const player = s.players.find((p) => p.id === ctx.controllerId)!; const carrier = player as unknown as {commandSpells?:number}; carrier.commandSpells = Number(carrier.commandSpells ?? 0) + 1; state.virtualCommandSealSourceCardId = ctx.sourceCardId; return true; }
  if (isForwardMoveSourcePowerEffect(e)) { const state = requiredAnyState(s, ctx.controllerId); const candidates: string[] = []; for (let x = Number(e.minX); x <= Number(e.maxX); x++) { candidates.push(`x:${x}:stay`); for (const dest of forwardReachable(s, ctx.controllerId, x)) candidates.push(`x:${x}:${dest.locationId}`); } return stage(s, ctx, state, 'rush_choice', [...new Set(candidates)], 1, 1, 'choice'); }
  if (isDiscardLocationEventByVpEffect(e)) { const state = requiredAnyState(s, ctx.controllerId); const loc = sourceLocation(s, ctx.sourceCardId)!; const candidates = s.eventPlacements.map((entry, index) => ({ entry, index })).filter(({entry}) => entry.locationId === loc && Number.isSafeInteger(entry.victoryPoints) && Number(entry.victoryPoints) >= Number(e.vpOffset)).map(({entry,index}) => `event:${index}:x:${Number(entry.victoryPoints) - Number(e.vpOffset)}`); return stage(s, ctx, state, 'event_discard', candidates, 1, 1, 'choice'); }
  if (isDefinitionSideDeckDiscardAllSourcePowerEffect(e)) { const state = requiredState(s, ctx.controllerId, String(e.deckKey)); const count = state.hand.length; discardDefinitionSideDeckHand(s, ctx.controllerId, state.deckKey, [...state.hand]); const cs = runtime(s).cardState[ctx.sourceCardId]; if (cs) cs.roundPowerBonus = { round: s.round.roundNumber, amount: Math.min(Number(e.maximum), count * Number(e.multiplier)), sourceAbilityId: ctx.abilityId }; return true; }
  if (isDefinitionSideDeckOneShotChoiceEffect(e)) { const state = requiredState(s, ctx.controllerId, String(e.deckKey)); const candidates = ['beast_play','mana','victory', ...adjacentLocations(s, ctx.controllerId).map((id) => `move:${id}`)]; return stage(s, ctx, state, 'one_shot_choice', candidates, 1, 1, 'choice'); }
  if (isDefinitionSideDeckPayManaDrawEffect(e)) { if (!ops.spendMana(ctx.controllerId, Number(e.manaCost))) return false; drawDefinitionSideDeck(s, ctx.controllerId, String(e.deckKey), Number(e.drawCount)); return true; }
  return false;
}
function requiredAnyState(s: GameState, controllerId: string): DefinitionSideDeckState {
  const found = Object.values(runtime(s).definitionSideDecks ?? {}).find((entry) => entry.controllerId === controllerId); if (!found) throw new Error('DEFINITION_SIDE_DECK_CONTROLLER_STATE_REQUIRED'); return found;
}

function interactionAbility(s: GameState, meta: DefinitionSideDeckInteractionMetadata): AuthoringAbility | undefined {
  const source = s.cards.find((entry) => entry.instanceId === meta.sourceCardInstanceId && entry.controllerPlayerId === meta.controllerId);
  const ability = source ? runtime(s).pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === meta.abilityId) : undefined;
  return ability && isAcceptedDefinitionSideDeckAbility(ability) ? ability : undefined;
}
export function isDefinitionSideDeckPendingDecisionLiveValid(s: GameState, d: PendingDecision): boolean {
  try { const meta = d.interaction; if (!meta || meta.kind !== 'definition_side_deck_v1' || d.controllerId !== meta.controllerId || d.context.controllerId !== meta.controllerId ||
      d.context.sourceCardId !== meta.sourceCardInstanceId || d.context.abilityId !== meta.abilityId || meta.createdRevision !== runtime(s).revision || meta.continuationRef !== `${d.id}:continuation` ||
      meta.template !== 'target' || meta.visibility !== 'owner_only' || meta.cancelPolicy !== 'forbidden' || d.remainingEffects.length !== 0 || d.min !== meta.constraints.min || d.max !== meta.constraints.max) return false;
    const ability = interactionAbility(s, meta); if (!ability) return false;
    let expected = [...meta.candidateIds];
    if (meta.deckKey !== '__structural__') { const state = definitionSideDeckState(s, meta.controllerId, meta.deckKey); if (!state) return false;
      if (meta.stage === 'play') expected = playableSideHandIds(s, state);
      if (meta.stage === 'payment') expected = state.hand.filter((id) => id !== meta.selectedCardInstanceId);
      if (meta.stage === 'discard_for_mana' || meta.stage === 'delayed_discard') expected = [...state.hand];
    }
    return expected.length === d.candidates.length && expected.every((id) => d.candidates.includes(id)) && d.candidates.every((id) => expected.includes(id));
  } catch { return false; }
}

function consumeOneShot(s: GameState, state: DefinitionSideDeckState): void {
  state.oneShotAvailable = false; const sourceId = state.virtualCommandSealSourceCardId; if (!sourceId) return;
  const p = s.players.find((entry) => entry.id === state.controllerId); const carrier = p as unknown as {commandSpells?:number};
  if (p && Number(carrier.commandSpells ?? 0) > 0) {
    const before = Number(carrier.commandSpells);
    carrier.commandSpells = before - 1;
    markCommandSealSpent(s, state.controllerId, before, before - 1, { sourceCardId: sourceId });
  }
  closeVirtualSealSource(s, state);
}
function closeVirtualSealSource(s: GameState, state: DefinitionSideDeckState): void {
  const id = state.virtualCommandSealSourceCardId; if (!id) return; returnDefinitionSideDeckCardToDiscard(s, id); delete state.virtualCommandSealSourceCardId;
}
export function resolveDefinitionSideDeckDecision(s: GameState, playerId: string, d: PendingDecision, selected: readonly string[], ops: DefinitionSideDeckOps): boolean {
  if (!isDefinitionSideDeckPendingDecisionLiveValid(s, d) || d.controllerId !== playerId || selected.length < d.min || selected.length > d.max || new Set(selected).size !== selected.length || selected.some((id) => !d.candidates.includes(id))) return false;
  const meta = d.interaction! as DefinitionSideDeckInteractionMetadata; const ability = interactionAbility(s, meta)!; const e = ability.effects[0]!; delete runtime(s).pendingDecision;
  if (meta.stage === 'play') { const state = requiredState(s, meta.controllerId, meta.deckKey); const cardId = selected[0]!; const cost = printedCost(s, cardId); if (cost > 0) return stage(s, d.context, state, 'payment', state.hand.filter((id) => id !== cardId), cost, cost, 'card', cardId, cost); commitPlay(s, state, cardId); ops.emitCardPlayed(meta.controllerId, cardId); return true; }
  if (meta.stage === 'payment') { const state = requiredState(s, meta.controllerId, meta.deckKey); if (selected.length !== meta.paymentCount || !meta.selectedCardInstanceId) return false; discardDefinitionSideDeckHand(s, meta.controllerId, meta.deckKey, selected); commitPlay(s, state, meta.selectedCardInstanceId); ops.emitCardPlayed(meta.controllerId, meta.selectedCardInstanceId); return true; }
  if (meta.stage === 'discard_for_mana') { if (!isDefinitionSideDeckDiscardForManaEffect(e)) return false; discardDefinitionSideDeckHand(s, meta.controllerId, meta.deckKey, selected); ops.grantMana(meta.controllerId, selected.length * Number(e.manaPerCard), { controllerId: meta.controllerId, sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, suppressDefinitionSideDeckDraw: true }); return true; }
  if (meta.stage === 'delayed_discard') { discardDefinitionSideDeckHand(s, meta.controllerId, meta.deckKey, selected); const state = requiredState(s, meta.controllerId, meta.deckKey); delete state.delayedDrawDiscard; return true; }
  if (meta.stage === 'defeat_target') { const id = selected[0]!; runtime(s).battleDefeatRoundByPlayer ??= {}; runtime(s).battleDefeatRoundByPlayer![id] = s.round.roundNumber; runtime(s).events.push({ type: 'player_defeated_by_effect', playerId: id, controllerId: meta.controllerId, sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId }); return true; }
  if (meta.stage === 'rush_choice') { if (!isForwardMoveSourcePowerEffect(e)) return false; const match = /^x:(\d+):(.*)$/.exec(selected[0]!); if (!match) return false; const x = Number(match[1]); const destination = match[2]!; if (x < Number(e.minX) || x > Number(e.maxX)) return false; if (destination !== 'stay' && !forwardReachable(s, meta.controllerId, x).some((entry) => entry.locationId === destination) || (destination !== 'stay' && !ops.movePlayer(meta.controllerId, destination, meta.sourceCardInstanceId, meta.abilityId))) return false; const cs = runtime(s).cardState[meta.sourceCardInstanceId]; if (cs) cs.roundPowerBonus = { round: s.round.roundNumber, amount: Number(e.powerBase) + x * Number(e.powerPerX), sourceAbilityId: meta.abilityId }; return true; }
  if (meta.stage === 'event_discard') { if (!isDiscardLocationEventByVpEffect(e)) return false; const match = /^event:(\d+):x:(\d+)$/.exec(selected[0]!); if (!match) return false; const index = Number(match[1]); const placement = s.eventPlacements[index]; const loc = sourceLocation(s, meta.sourceCardInstanceId); if (!placement || placement.locationId !== loc || !Number.isSafeInteger(placement.victoryPoints) || Number(placement.victoryPoints) !== Number(match[2]) + Number(e.vpOffset)) return false; s.eventPlacements.splice(index, 1); (s.eventDiscardPile ??= []).push(placement); return true; }
  if (meta.stage === 'one_shot_choice') { if (!isDefinitionSideDeckOneShotChoiceEffect(e)) return false; const state = requiredState(s, meta.controllerId, meta.deckKey); if (!state.oneShotAvailable) return false; const choice = selected[0]!;
    if (choice === 'beast_play') { state.bonusPlayRound = s.round.roundNumber; consumeOneShot(s, state); return stagePlay(s, d.context, state); }
    if (choice === 'mana') { consumeOneShot(s, state); ops.grantMana(meta.controllerId, Number(e.manaGain), { controllerId: meta.controllerId, sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, suppressDefinitionSideDeckDraw: true }); drawDefinitionSideDeck(s, meta.controllerId, meta.deckKey, Number(e.directDraw)); return true; }
    if (choice === 'victory') { state.battleWinRewardRound = s.round.roundNumber; consumeOneShot(s, state); return true; }
    if (choice.startsWith('move:')) { const location = choice.slice(5); if (!adjacentLocations(s, meta.controllerId).includes(location)) return false; consumeOneShot(s, state); return ops.movePlayer(meta.controllerId, location, meta.sourceCardInstanceId, meta.abilityId); }
  }
  return false;
}

export function settleDefinitionSideDeckRoundStart(s: GameState): void {
  const r = runtime(s); if (r.pendingDecision) return;
  for (const state of Object.values(r.definitionSideDecks ?? {})) { const due = state.delayedDrawDiscard; if (!due || due.targetRound !== s.round.roundNumber) continue;
    drawDefinitionSideDeck(s, state.controllerId, state.deckKey, due.drawCount); const count = Math.min(due.discardCount, state.hand.length); if (count <= 0) { delete state.delayedDrawDiscard; continue; }
    const ctx: EffectContext = { controllerId: state.controllerId, sourceCardId: due.sourceCardId, abilityId: due.abilityId, variables: {}, selections: {} };
    stage(s, ctx, state, 'delayed_discard', [...state.hand], count, count, 'card'); return;
  }
}
export function settleDefinitionSideDeckManaEvents(s: GameState): void {
  const r = runtime(s); const events = r.events;
  for (const state of Object.values(r.definitionSideDecks ?? {})) {
    const observer = observerAbility(s, state); const effect = observer?.effects[0]; let index = Math.max(0, state.lastObservedManaEventIndex);
    for (; index < events.length; index++) { const event = events[index]!; if (!observer || !effect || !isDefinitionSideDeckManaDrawRuleEffect(effect)) continue;
      if (event.type !== 'mana_granted' || event.playerId !== state.controllerId || !positive(event.delta) || event.definitionSideDeckDrawSuppressed) continue;
      const source = event.sourceCardId ? s.cards.find((entry) => entry.instanceId === event.sourceCardId) : undefined;
      if (source && (effect.excludedSourceDefinitionIds as string[]).includes(source.definitionId)) continue;
      drawDefinitionSideDeck(s, state.controllerId, state.deckKey, Math.floor(Number(event.delta) / Number(effect.divisor)));
    }
    state.lastObservedManaEventIndex = events.length;
  }
}
export function settleDefinitionSideDeckBattleEvent(s: GameState, event: AbilityEvent): void {
  if (event.type !== 'after_controller_wins_battle' || !event.playerId) return;
  for (const state of Object.values(runtime(s).definitionSideDecks ?? {})) if (state.controllerId === event.playerId && state.battleWinRewardRound === s.round.roundNumber && trustedBattle(s, event, state.controllerId, 'win')) {
    const p = s.players.find((entry) => entry.id === state.controllerId); if (p) p.vp += 2; delete state.battleWinRewardRound;
  }
}
export function markDefinitionSideDeckCommandSealSpentOrUsed(s: GameState, playerId: string): void {
  runtime(s).commandSealSpentOrUsedRoundByPlayer ??= {}; runtime(s).commandSealSpentOrUsedRoundByPlayer![playerId] = s.round.roundNumber;
  for (const state of Object.values(runtime(s).definitionSideDecks ?? {})) if (state.controllerId === playerId && state.virtualCommandSealSourceCardId) closeVirtualSealSource(s, state);
}

export function definitionSideDeckCardPowerAdjustment(s: GameState, cardInstanceId: string): { add: number; forceZero: boolean } {
  const physical = s.cards.find((entry) => entry.instanceId === cardInstanceId); if (!physical) return { add: 0, forceZero: false };
  const r = runtime(s); let add = 0; let forceZero = false; const controller = s.players.find((entry) => entry.id === physical.controllerPlayerId); const attrs = r.pack.cards[physical.definitionId]?.cardFace.attributes;
  const attributes = Array.isArray(attrs) ? attrs.map(String) : [];
  const own = r.pack.cards[physical.definitionId]; for (const ability of own?.abilities ?? []) { const e = ability.effects[0]; if (e && isAcceptedDefinitionSideDeckAbility(ability) && isSourceOpponentCountPowerEffect(e) && activeSource(s, cardInstanceId) && controller?.locationId) add += s.players.filter((p) => p.id !== physical.controllerPlayerId && p.status === 'active' && p.locationId === controller.locationId).length * Number(e.amountPerOpponent); }
  for (const source of s.cards) { if (source.controllerPlayerId !== physical.controllerPlayerId || !activeSource(s, source.instanceId)) continue; const definition = r.pack.cards[source.definitionId]; for (const ability of definition?.abilities ?? []) { const e = ability.effects[0]; if (!e || !isAcceptedDefinitionSideDeckAbility(ability)) continue;
      if (isControllerAttributePowerBonusEffect(e) && attributes.includes(String(e.attribute))) add += Number(e.amount);
    } }
  for (const source of s.cards) { if (source.controllerPlayerId === physical.controllerPlayerId || !activeSource(s, source.instanceId)) continue; const sourcePlayer = s.players.find((p) => p.id === source.controllerPlayerId); if (!controller?.locationId || sourcePlayer?.locationId !== controller.locationId) continue; const definition = r.pack.cards[source.definitionId];
    for (const ability of definition?.abilities ?? []) { const e = ability.effects[0]; if (e && isAcceptedDefinitionSideDeckAbility(ability) && isSameBattlefieldDefinitionPowerZeroEffect(e) && physical.definitionId === e.targetDefinitionId) forceZero = true; }
  }
  return { add, forceZero };
}
export function definitionSideDeckPlayerPowerAdjustment(s: GameState, playerId: string): number {
  const target = s.players.find((entry) => entry.id === playerId && entry.status === 'active'); if (!target?.locationId) return 0; let total = 0;
  for (const source of s.cards) { if (source.controllerPlayerId === playerId || !activeSource(s, source.instanceId)) continue; const controller = s.players.find((entry) => entry.id === source.controllerPlayerId); if (controller?.locationId !== target.locationId) continue;
    for (const ability of runtime(s).pack.cards[source.definitionId]?.abilities ?? []) { const e = ability.effects[0]; if (e && isAcceptedDefinitionSideDeckAbility(ability) && isUnsealedEngagedOpponentPowerPenaltyEffect(e) && runtime(s).commandSealSpentOrUsedRoundByPlayer?.[playerId] !== s.round.roundNumber) total -= Number(e.amount); }
  }
  return total;
}

export function isDefinitionSideDeckRuntimeProvenanceValidForRestore(s: GameState): boolean {
  try { const r = runtime(s); const ids = new Set(s.players.map((entry) => entry.id)); const allPhysical = new Set(s.cards.map((entry) => entry.instanceId));
    for (const [storage, state] of Object.entries(r.definitionSideDecks ?? {})) {
      if (storage !== storageKey(state.controllerId, state.deckKey) || !ids.has(state.controllerId) || !key(state.deckKey) || !exactStringList(state.definitionIds) || state.definitionIds.some((id) => !r.pack.cards[id])) return false;
      const source = liveSource(s, state.controllerId, state.providerSourceCardId, state.providerAbilityId); const setup = source?.effects[0]; if (!source || !setup || !isDefinitionSideDeckSetupEffect(setup) || setup.deckKey !== state.deckKey) return false;
      const played = s.cards.filter((entry) => entry.ownerPlayerId === state.controllerId && entry.controllerPlayerId === state.controllerId && entry.definitionSideDeckKey === state.deckKey && ['attack_area','field'].includes(entry.zone)).map((entry) => entry.instanceId);
      const combined = [...state.drawPile, ...state.hand, ...state.discardPile, ...played]; if (new Set(combined).size !== combined.length || combined.length !== state.definitionIds.length || combined.some((id) => !allPhysical.has(id))) return false;
      for (const id of combined) { const card = sideCard(s, state, id); if (!card || !state.definitionIds.includes(card.definitionId)) return false; const expected = state.drawPile.includes(id) ? 'definition_side_deck' : state.hand.includes(id) ? 'definition_side_hand' : state.discardPile.includes(id) ? 'definition_side_discard' : 'attack_area'; if (card.zone !== expected) return false; }
      if (!Number.isSafeInteger(state.lastObservedManaEventIndex) || state.lastObservedManaEventIndex < 0 || state.lastObservedManaEventIndex > r.events.length) return false;
      if (state.virtualCommandSealSourceCardId && !s.cards.some((entry) => entry.instanceId === state.virtualCommandSealSourceCardId && entry.controllerPlayerId === state.controllerId)) return false;
    }
    if (r.pendingDecision?.interaction?.kind === 'definition_side_deck_v1' && !isDefinitionSideDeckPendingDecisionLiveValid(s, r.pendingDecision)) return false;
    if (r.commandSealSpentOrUsedRoundByPlayer && Object.entries(r.commandSealSpentOrUsedRoundByPlayer).some(([id, round]) => !ids.has(id) || !Number.isSafeInteger(round) || round < 1 || round > s.round.roundNumber)) return false;
    return true;
  } catch { return false; }
}
