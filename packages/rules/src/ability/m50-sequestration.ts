import type { GameState } from '../schema/game';
import type { AbilityRuntime, PlayerId } from './types';

export interface SequesteredServantSkillReceipt {
  instanceId: string;
  ownerPlayerId: PlayerId;
  returnOnPlayerEliminationId: PlayerId;
  returnFaceDown: boolean;
  sourceCardId: string;
}

function nextRandomIndex(runtime: AbilityRuntime, maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) throw new Error('M50_SEQUESTER_RANDOM_BOUND_INVALID');
  let x = runtime.randomState >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; runtime.randomState = x >>> 0;
  return Math.floor((runtime.randomState / 0x100000000) * maxExclusive);
}

function isOncePerGameCard(runtime: AbilityRuntime, definitionId: string): boolean {
  const definition = runtime.pack.cards[definitionId];
  if (!definition) throw new Error('M50_SEQUESTER_DEFINITION_MISSING');
  return definition.abilities.some((ability) => ability.execution.mode === 'automatic' &&
    ability.limit?.type === 'per_game' && ability.limit?.scope === 'this_card' && Number(ability.limit?.uses ?? 1) === 1);
}

export function sequesterRandomInactiveServantSkill(
  state: GameState,
  targetPlayerId: PlayerId,
  returnOnPlayerEliminationId: PlayerId,
  sourceCardId: string,
): string | undefined {
  const runtime = state.abilityRuntime;
  const target = state.players.find((player) => player.id === targetPlayerId);
  if (!runtime || !target || !state.players.some((player) => player.id === returnOnPlayerEliminationId) || !sourceCardId) {
    throw new Error('M50_SEQUESTER_STATE_INVALID');
  }
  const candidates = state.cards.filter((candidate) => {
    if (candidate.ownerPlayerId !== targetPlayerId || candidate.controllerPlayerId !== targetPlayerId || candidate.zone !== 'skill') return false;
    const definition = runtime.pack.cards[candidate.definitionId];
    return definition?.cardType === 'servant_skill' && runtime.cardState[candidate.instanceId]?.active !== true;
  });
  if (!candidates.length) return undefined;
  const selected = candidates[nextRandomIndex(runtime, candidates.length)]!;
  const stateEntry = runtime.cardState[selected.instanceId] ??= { active: false, faceDown: false, playedRound: state.round.roundNumber };
  const returnFaceDown = stateEntry.faceDown === true;
  selected.zone = 'removed_from_game'; selected.visibility = { scope: 'public' };
  stateEntry.active = false;
  if (!isOncePerGameCard(runtime, selected.definitionId)) {
    (runtime.sequesteredServantSkills ??= []).push({ instanceId: selected.instanceId, ownerPlayerId: targetPlayerId,
      returnOnPlayerEliminationId, returnFaceDown, sourceCardId });
  }
  return selected.instanceId;
}

export function settleSequesteredServantSkillsForEliminations(state: GameState, eliminatedPlayerIds: readonly PlayerId[]): string[] {
  const runtime = state.abilityRuntime; if (!runtime?.sequesteredServantSkills?.length || !eliminatedPlayerIds.length) return [];
  const eliminated = new Set(eliminatedPlayerIds); const restored: string[] = []; const keep: SequesteredServantSkillReceipt[] = [];
  for (const receipt of runtime.sequesteredServantSkills) {
    if (!eliminated.has(receipt.returnOnPlayerEliminationId)) { keep.push(receipt); continue; }
    const card = state.cards.find((candidate) => candidate.instanceId === receipt.instanceId);
    const owner = state.players.find((player) => player.id === receipt.ownerPlayerId);
    if (!card || !owner || card.ownerPlayerId !== receipt.ownerPlayerId || card.zone !== 'removed_from_game') throw new Error('M50_SEQUESTER_RECEIPT_STALE');
    card.controllerPlayerId = receipt.ownerPlayerId; card.zone = 'skill'; card.visibility = { scope: 'owner_only', ownerPlayerId: receipt.ownerPlayerId };
    const cardState = runtime.cardState[card.instanceId] ??= { active: false, faceDown: receipt.returnFaceDown, playedRound: state.round.roundNumber };
    cardState.active = false; cardState.faceDown = receipt.returnFaceDown;
    restored.push(card.instanceId);
  }
  runtime.sequesteredServantSkills = keep;
  return restored;
}
