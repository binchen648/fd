import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, PendingDecision, RevealedHandCard } from './types';

const record = (n: unknown): n is Record<string, unknown> => !!n && typeof n === 'object' && !Array.isArray(n);
const safeBinding = (n: unknown): n is string => typeof n === 'string' && n.length > 0 && !['__proto__', 'prototype', 'constructor'].includes(n);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Existing user-approved top-level snapshot producer followed by an optional bound play. */
export function handRevealContractIssue(a: Pick<AuthoringAbility, 'effects' | 'targets'>): string | undefined {
  const nestedReveal = (input: unknown): boolean => Array.isArray(input) ? input.some(nestedReveal)
    : record(input) && (input.type === 'reveal_hands' || input.type === 'play_revealed_card' || Object.values(input).some(nestedReveal));
  if (a.effects.some(effect => Object.entries(effect).some(([key, value]) => key !== 'type' && nestedReveal(value)))) return 'Hand-reveal producer and consumer must be top-level effects';
  const producers = new Map<string, string>();
  const boundTargets = a.targets.filter(t => typeof t.targetsFromBinding === 'string');
  for (const effect of a.effects) {
    if (effect.type === 'reveal_hands') {
      if (Object.keys(effect).some(k => !['type', 'targetRef', 'bind'].includes(k))) return 'Unsupported hand-reveal effect field';
      const target = a.targets.find(t => t.id === effect.targetRef);
      if (!target || target.type !== 'player' || !safeBinding(effect.bind) || producers.has(effect.bind)) return 'Hand reveal requires a player target and unique safe binding';
      producers.set(effect.bind, String(target.id));
    }
    if (effect.type === 'play_revealed_card') {
      if (Object.keys(effect).some(k => !['type', 'target', 'binding'].includes(k))) return 'Unsupported revealed-play effect field';
      const target = a.targets.find(t => t.id === effect.target);
      const scope = target?.scope, count = target?.count;
      if (!safeBinding(effect.binding) || !producers.has(effect.binding) || !target || target.type !== 'card_instance' ||
          target.targetsFromBinding !== effect.binding || !record(scope) || scope.zone !== 'hand' || scope.owner !== 'any' || scope.controller !== 'any' ||
          !record(count) || count.min !== 0 || count.max !== 1) return 'Revealed play requires an earlier reveal binding and an optional single bound hand target';
    }
  }
  for (const target of boundTargets) {
    if (!a.effects.some(e => e.type === 'play_revealed_card' && e.target === target.id && e.binding === target.targetsFromBinding)) return 'Bound hand target requires its matching revealed-play consumer';
  }
  return undefined;
}

export function isRevealedHandCard(value: unknown): value is RevealedHandCard {
  return record(value) && Object.keys(value).every(k => ['cardId', 'definitionId', 'ownerPlayerId', 'controllerPlayerId', 'name'].includes(k)) &&
    ['cardId', 'definitionId', 'ownerPlayerId', 'controllerPlayerId', 'name'].every(k => typeof value[k] === 'string' && value[k] !== '');
}

/** Snapshot facts may outlive the window; only an unchanged physical hand instance can be exposed/played. */
export function matchesRevealedHandInstance(s: GameState, entry: RevealedHandCard): boolean {
  return s.cards.some(c => c.instanceId === entry.cardId && c.definitionId === entry.definitionId && c.ownerPlayerId === entry.ownerPlayerId &&
    c.controllerPlayerId === entry.controllerPlayerId && c.zone === 'hand');
}

export function validHandRevealBindings(s: GameState, ctx: EffectContext, a: AuthoringAbility, requireCurrentIdentity = false): boolean {
  if (handRevealContractIssue(a)) return false;
  for (const [id, binding] of Object.entries(ctx.bindings ?? {})) {
    if (binding.effectType !== 'reveal_hands') {
      if (binding.revealedCards !== undefined) return false;
      continue;
    }
    const producer = a.effects.find(e => e.type === 'reveal_hands' && e.bind === id);
    const selectedPlayers = producer ? ctx.selections[String(producer.targetRef)] : undefined;
    if (!producer || !Array.isArray(selectedPlayers) || !Array.isArray(binding.revealedCards) ||
        !binding.revealedCards.every(isRevealedHandCard) || binding.affectedCount !== binding.revealedCards.length ||
        !Array.isArray(binding.affectedPlayerIds) || new Set(binding.affectedPlayerIds).size !== binding.affectedPlayerIds.length ||
        !binding.affectedPlayerIds.every(playerId => selectedPlayers.includes(playerId) && s.players.some(p => p.id === playerId)) ||
        !same(binding.affectedCardIds, binding.revealedCards.map(c => c.cardId)) || new Set(binding.affectedCardIds).size !== binding.revealedCards.length) return false;
    for (const entry of binding.revealedCards) {
      const definition = s.abilityRuntime?.pack.cards[entry.definitionId];
      if (!definition || entry.name !== definition.name || !binding.affectedPlayerIds.includes(entry.ownerPlayerId) ||
          !s.players.some(p => p.id === entry.controllerPlayerId)) return false;
      if (requireCurrentIdentity && !s.cards.some(c => c.instanceId === entry.cardId && c.definitionId === entry.definitionId &&
          c.ownerPlayerId === entry.ownerPlayerId && (c.controllerPlayerId === entry.controllerPlayerId ||
          (c.controllerPlayerId === ctx.controllerId && c.zone !== 'hand' &&
            s.abilityRuntime?.events.some(event => event.type === 'revealed_card_played' &&
              event.cardInstanceId === c.instanceId && event.playerId === ctx.controllerId &&
              event.sourceCardId === ctx.sourceCardId && event.abilityId === ctx.abilityId &&
              event.details?.round === String(s.round.roundNumber)))))) return false;
    }
  }
  return true;
}

export function pendingRevealedHands(s: GameState, pending: PendingDecision | undefined): RevealedHandCard[] {
  if (!pending) return [];
  return Object.values(pending.context.bindings ?? {}).flatMap(binding => binding.effectType === 'reveal_hands'
    ? (binding.revealedCards ?? []).filter(entry => isRevealedHandCard(entry) && matchesRevealedHandInstance(s, entry)) : []);
}

export function lastHandReveal(s: GameState): { round: number; controllerId: string; cards: RevealedHandCard[] } | undefined {
  const event = [...(s.abilityRuntime?.events ?? [])].reverse().find(e => e.type === 'hands_revealed');
  if (!event?.playerId || !event.details?.cards || !event.details.round) return;
  try {
    const cards: unknown = JSON.parse(event.details.cards), round = Number(event.details.round);
    if (!Array.isArray(cards) || !cards.every(isRevealedHandCard) || !Number.isSafeInteger(round) || round < 1) return;
    return {round, controllerId: event.playerId, cards};
  } catch { return; }
}
