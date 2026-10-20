import type { AuthoringAbility, EffectContext, RuleNode } from './types';
import type { GameState } from '../schema/game';

export const TOKIOMI_CREST_EFFECT = 'tokiomi_crest_of_command' as const;
export const TOKIOMI_PROVISION_ITEMS_EFFECT = 'tokiomi_provision_items' as const;
export const TOKIOMI_USE_ITEM_EFFECT = 'tokiomi_use_item' as const;
export const TOKIOMI_REMOVE_BURNING_EFFECT = 'tokiomi_remove_burning' as const;
const TOKIOMI = 'master.tokiomi';
export const TOKIOMI_BURNING_MARKER = 'tokiomi.burning' as const;
const runtime = (s: GameState) => s.abilityRuntime!;
const exact = (value: unknown, keys: readonly string[]) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === keys.length && Object.keys(value as object).every((key) => keys.includes(key));

export function containsTokiomiPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsTokiomiPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const node = value as Record<string, unknown>;
  return [TOKIOMI_CREST_EFFECT, TOKIOMI_PROVISION_ITEMS_EFFECT, TOKIOMI_USE_ITEM_EFFECT, TOKIOMI_REMOVE_BURNING_EFFECT].includes(node.type as typeof TOKIOMI_CREST_EFFECT) || Object.values(node).some(containsTokiomiPrivilegedNode);
}
export function isAcceptedTokiomiAbility(a: AuthoringAbility): boolean {
  if (a.effects.length !== 1 || a.conditions.length || a.targets.length || a.cost.length || a.ruleModifiers.length) return false;
  const e = a.effects[0]!;
  if (a.execution.mode !== 'automatic' || a.execution.allowedOperations.length !== 0) return false;
  if (a.id === 'tokiomi.ascension.crest') return a.kind === 'passive' && a.activation.trigger === 'while_active' && e.type === TOKIOMI_CREST_EFFECT && exact(e, ['type']);
  if (a.id === 'tokiomi.careless-tutor') return a.kind === 'forced_trigger' && a.activation.trigger === 'game_start' && e.type === TOKIOMI_PROVISION_ITEMS_EFFECT && exact(e, ['type']);
  if (a.id === 'tokiomi.ascension.burning-remove') return a.kind === 'forced_trigger' && a.activation.trigger === 'on_marker_removed' && e.type === TOKIOMI_REMOVE_BURNING_EFFECT && exact(e, ['type']);
  return a.id === 'tokiomi.item.use' && a.kind === 'forced_trigger' && a.activation.trigger === 'on_card_played' && e.type === TOKIOMI_USE_ITEM_EFFECT && exact(e, ['type']);
}
export function resolveTokiomiEffect(s: GameState, ctx: EffectContext, ability: AuthoringAbility, effect: RuleNode): boolean {
  if (!isAcceptedTokiomiAbility(ability)) return false;
  if (effect.type === TOKIOMI_PROVISION_ITEMS_EFFECT) {
    const source = s.cards.find((card) => card.instanceId === ctx.sourceCardId);
    const owner = s.players.find((player) => player.id === ctx.controllerId);
    if (!source || !owner || owner.masterCardId !== TOKIOMI || source.zone !== 'skill') return false;
    const eligible = s.players.filter((player) => player.status === 'active').sort((left, right) => right.seat - left.seat).slice(0, 2);
    const state = runtime(s) as GameState['abilityRuntime'] & { tokiomi?: TokiomiRuntime };
    state.tokiomi ??= { crestByPlayer: {}, itemUseRound: {} };
    for (let index = 0; index < 4; index += 1) {
      const recipient = eligible[index % eligible.length]!;
      const instanceId = `${ctx.sourceCardId}:item:${index}`;
      if (s.cards.some((card) => card.instanceId === instanceId)) continue;
      s.cards.push({ instanceId, definitionId: `${TOKIOMI}.generated.item`, ownerPlayerId: recipient.id, controllerPlayerId: recipient.id, zone: 'hand', visibility: { scope: 'owner_only', ownerPlayerId: recipient.id }, generatedBy: ctx.sourceCardId });
      runtime(s).cardState[instanceId] = { active: false, faceDown: false, playedRound: s.round.roundNumber };
    }
    runtime(s).events.push({ type: 'tokiomi_items_provisioned', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
    return true;
  }
  if (effect.type === TOKIOMI_USE_ITEM_EFFECT) {
    const source = s.cards.find((card) => card.instanceId === ctx.sourceCardId);
    const owner = s.players.find((player) => player.id === ctx.controllerId);
    const state = runtime(s) as GameState['abilityRuntime'] & { tokiomi?: TokiomiRuntime };
    const eligible = s.players.filter((player) => player.status === 'active').sort((left, right) => right.seat - left.seat).slice(0, 2).map((player) => player.id);
    if (!source || !owner || source.definitionId !== `${TOKIOMI}.generated.item` || !eligible.includes(ctx.controllerId) || s.round.prioritySeat !== owner.seat || tokiomiItemUseRecordedThisRound(s, ctx.controllerId)) return false;
    state.tokiomi ??= { crestByPlayer: {}, itemUseRound: {} }; state.tokiomi.itemUseRound[ctx.controllerId] = s.round.roundNumber;
    source.zone = 'removed_from_game'; runtime(s).events.push({ type: 'tokiomi_item_used', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId }); return true;
  }
  if (effect.type === TOKIOMI_REMOVE_BURNING_EFFECT) {
    const source = s.cards.find((card) => card.instanceId === ctx.sourceCardId);
    return !!source && source.controllerPlayerId === ctx.controllerId && tokiomiRemoveBurningMarker(s, source.instanceId);
  }
  if (effect.type !== TOKIOMI_CREST_EFFECT) return false;
  const source = s.cards.find((card) => card.instanceId === ctx.sourceCardId);
  const owner = s.players.find((player) => player.id === ctx.controllerId);
  if (!source || !owner || owner.masterCardId !== TOKIOMI || source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId || source.zone !== 'field' || runtime(s).cardState[source.instanceId]?.active !== true || runtime(s).cardState[source.instanceId]?.faceDown === true) return false;
  const state = runtime(s) as GameState['abilityRuntime'] & { tokiomi?: TokiomiRuntime };
  state.tokiomi ??= { crestByPlayer: {}, itemUseRound: {} };
  state.tokiomi.crestByPlayer[ctx.controllerId] = source.instanceId;
  runtime(s).events.push({ type: 'tokiomi_crest_installed', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
  return true;
}
type TokiomiRuntime = { crestByPlayer: Record<string, string>; itemUseRound: Record<string, number> };
function tokiomiState(s: GameState): TokiomiRuntime | undefined { return (runtime(s) as GameState['abilityRuntime'] & { tokiomi?: TokiomiRuntime }).tokiomi; }
export function tokiomiCrestSource(s: GameState, playerId: string): string | undefined { return tokiomiState(s)?.crestByPlayer[playerId]; }
function liveCrest(s: GameState, playerId: string): boolean { const id = tokiomiCrestSource(s, playerId); const source = id && s.cards.find((card) => card.instanceId === id); return !!source && source.ownerPlayerId === playerId && source.controllerPlayerId === playerId && source.zone === 'field' && runtime(s).cardState[id]?.active === true && runtime(s).cardState[id]?.faceDown !== true; }
export function tokiomiFireballModifier(s: GameState, playerId: string, definitionId: string): { costAdd: number; powerAdd: number } { return definitionId === `${TOKIOMI}.generated.fireball` && liveCrest(s, playerId) ? { costAdd: 2, powerAdd: 2 } : { costAdd: 0, powerAdd: 0 }; }
export function tokiomiHasBurningMarker(s: GameState, sourceId: string): boolean { return runtime(s).cardState[sourceId]?.markers?.includes(TOKIOMI_BURNING_MARKER) === true; }
export function tokiomiBurningPowerPenalty(s: GameState, sourceId: string): number { const source = s.cards.find((card) => card.instanceId === sourceId); return source && tokiomiHasBurningMarker(s, sourceId) && liveCrest(s, source.controllerPlayerId) ? -3 : 0; }
export function tokiomiCanMarkBurning(s: GameState, playerId: string, sourceId: string): boolean {
  const source = s.cards.find((card) => card.instanceId === sourceId); const state = source && runtime(s).cardState[sourceId];
  const definition = source && runtime(s).pack.cards[source.definitionId];
  return s.round.activePhase === 'battle' && s.round.prioritySeat === s.players.find((player) => player.id === playerId)?.seat && !!source && source.controllerPlayerId === playerId && ['field', 'attack_area'].includes(source.zone) && state?.active === true && state.faceDown !== true &&
    ['basic_attack', 'master_skill', 'servant_skill'].includes(definition?.cardType ?? '') && definition?.id !== `${TOKIOMI}.skill.ascension` && liveCrest(s, playerId) && !tokiomiHasBurningMarker(s, sourceId);
}
export function tokiomiSetBurningMarker(s: GameState, sourceId: string): void { const state = runtime(s).cardState[sourceId] ??= { active: false, faceDown: false, playedRound: s.round.roundNumber }; state.markers = [...new Set([...(state.markers ?? []), TOKIOMI_BURNING_MARKER])]; }
export function tokiomiRemoveBurningMarker(s: GameState, sourceId: string): boolean { const source = s.cards.find((card) => card.instanceId === sourceId); if (!source || !tokiomiHasBurningMarker(s, sourceId) || !liveCrest(s, source.controllerPlayerId)) return false; const player = s.players.find((entry) => entry.id === source.controllerPlayerId); if (!player || player.mana < 2) return false; player.mana -= 2; const state = runtime(s).cardState[sourceId]!; state.markers = (state.markers ?? []).filter((marker) => marker !== TOKIOMI_BURNING_MARKER); runtime(s).events.push({ type: 'tokiomi_burning_removed', playerId: player.id, sourceCardId: sourceId, abilityId: 'tokiomi.ascension.crest' }); return true; }
export function tokiomiCanRemoveBurning(s: GameState, playerId: string, sourceId: string): boolean { const source = s.cards.find((card) => card.instanceId === sourceId); const player = s.players.find((entry) => entry.id === playerId); return s.round.activePhase === 'battle' && s.round.prioritySeat === player?.seat && !!source && !!player && source.controllerPlayerId === playerId && player.mana >= 2 && tokiomiHasBurningMarker(s, sourceId) && liveCrest(s, playerId); }
export function tokiomiItemUseRecordedThisRound(s: GameState, playerId: string): boolean { return tokiomiState(s)?.itemUseRound[playerId] === s.round.roundNumber; }
export function tokiomiItemUsedThisRound(s: GameState, playerId: string): boolean { return tokiomiItemUseRecordedThisRound(s, playerId) && s.players.find((player) => player.id === playerId)?.masterCardId === TOKIOMI; }
export function tokiomiProvisionItemDestination(s: GameState, ctx: EffectContext, definitionId: string): { playerId: string; zone: 'hand' } | undefined {
  if (ctx.abilityId !== 'tokiomi.careless-tutor' || definitionId !== `${TOKIOMI}.generated.item`) return undefined;
  const eligible = s.players.filter((player) => player.status === 'active').sort((left, right) => right.seat - left.seat).slice(0, 2);
  if (eligible.length !== 2) return undefined;
  const count = s.cards.filter((card) => card.generatedBy === ctx.sourceCardId && card.definitionId === definitionId).length;
  return { playerId: eligible[count % 2]!.id, zone: 'hand' };
}
export function tokiomiCanUseItem(s: GameState, playerId: string, sourceId: string): boolean {
  const source = s.cards.find((card) => card.instanceId === sourceId); const player = s.players.find((entry) => entry.id === playerId);
  const eligible = s.players.filter((entry) => entry.status === 'active').sort((left, right) => right.seat - left.seat).slice(0, 2).some((entry) => entry.id === playerId);
  return !!source && !!player && source.definitionId === `${TOKIOMI}.generated.item` && source.ownerPlayerId === playerId && source.controllerPlayerId === playerId && eligible && s.round.prioritySeat === player.seat && !tokiomiItemUseRecordedThisRound(s, playerId);
}
export function tokiomiRecordItemUse(s: GameState, playerId: string, sourceId: string): void {
  const state = runtime(s) as GameState['abilityRuntime'] & { tokiomi?: TokiomiRuntime };
  state.tokiomi ??= { crestByPlayer: {}, itemUseRound: {} }; state.tokiomi.itemUseRound[playerId] = s.round.roundNumber;
  runtime(s).events.push({ type: 'tokiomi_item_used', playerId, sourceCardId: sourceId, abilityId: 'tokiomi.careless-tutor' });
}
