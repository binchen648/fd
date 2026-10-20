import type { AuthoringAbility, EffectContext, RuleNode } from './types';
import type { GameState } from '../schema/game';

export const TOKIOMI_CREST_EFFECT = 'tokiomi_crest_of_command' as const;
const TOKIOMI = 'master.tokiomi';
const runtime = (s: GameState) => s.abilityRuntime!;
const exact = (value: unknown, keys: readonly string[]) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === keys.length && Object.keys(value as object).every((key) => keys.includes(key));

export function containsTokiomiPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsTokiomiPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const node = value as Record<string, unknown>;
  return node.type === TOKIOMI_CREST_EFFECT || Object.values(node).some(containsTokiomiPrivilegedNode);
}
export function isAcceptedTokiomiAbility(a: AuthoringAbility): boolean {
  if (a.effects.length !== 1) return false;
  const e = a.effects[0]!;
  return a.id === 'tokiomi.ascension.crest' && a.kind === 'passive' && a.activation.trigger === 'while_active' && a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 && e.type === TOKIOMI_CREST_EFFECT && exact(e, ['type']);
}
export function resolveTokiomiEffect(s: GameState, ctx: EffectContext, ability: AuthoringAbility, effect: RuleNode): boolean {
  if (!isAcceptedTokiomiAbility(ability) || effect.type !== TOKIOMI_CREST_EFFECT) return false;
  const source = s.cards.find((card) => card.instanceId === ctx.sourceCardId);
  const owner = s.players.find((player) => player.id === ctx.controllerId);
  if (!source || !owner || owner.masterCardId !== TOKIOMI || source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId || source.zone !== 'field' || runtime(s).cardState[source.instanceId]?.active !== true || runtime(s).cardState[source.instanceId]?.faceDown === true) return false;
  const state = runtime(s) as GameState['abilityRuntime'] & { tokiomi?: { crestByPlayer: Record<string, string> } };
  state.tokiomi ??= { crestByPlayer: {} };
  state.tokiomi.crestByPlayer[ctx.controllerId] = source.instanceId;
  runtime(s).events.push({ type: 'tokiomi_crest_installed', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
  return true;
}
export function tokiomiCrestSource(s: GameState, playerId: string): string | undefined { return (runtime(s) as GameState['abilityRuntime'] & { tokiomi?: { crestByPlayer: Record<string, string> } }).tokiomi?.crestByPlayer[playerId]; }
