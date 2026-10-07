import type { GameState } from '../schema/game';
import type { AuthoringAbility, PendingDecision, RuleNode } from './types';
import { projectBattleEliminationCandidatePlayerIds } from '../core/elimination-resolver';

export const ELIMINATION_RESCUE_SHARED_VICTORY_EFFECT = 'once_per_game_elimination_rescue_shared_victory' as const;

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: unknown): boolean {
  return record(value) && Object.keys(value).length === 0;
}
function standardResponse(value: unknown): boolean {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return keys.every((key) => ['order', 'passBehavior'].includes(key)) &&
    (value.order === undefined || value.order === 'turn_order') &&
    (value.passBehavior === undefined || value.passBehavior === 'decline_this_window');
}
function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('ELIMINATION_RESCUE_RUNTIME_MISSING');
  return state.abilityRuntime;
}
function stableProjectionValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.map(stableProjectionValue).join(',')}]`;
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableProjectionValue(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function eliminationRescueProjectionFingerprint(state: GameState, projectedCandidatePlayerIds: readonly string[]): string {
  const unsettled = (state.abilityRuntime?.eliminationRescueRecords ?? [])
    .filter((entry) => entry.round === state.round.roundNumber && !entry.scoringSettled)
    .map((entry) => ({ controllerId: entry.controllerId, targetPlayerId: entry.targetPlayerId, sourceCardId: entry.sourceCardId, abilityId: entry.abilityId }))
    .sort((left, right) => left.targetPlayerId.localeCompare(right.targetPlayerId) || left.sourceCardId.localeCompare(right.sourceCardId));
  return stableProjectionValue({
    round: state.round.roundNumber,
    battleResults: state.battleResults,
    players: state.players.map((player) => ({ id: player.id, seat: player.seat, status: player.status, militaryResult: player.militaryResult })),
    unsettled,
    projectedCandidatePlayerIds: [...projectedCandidatePlayerIds],
  });
}
export function isEliminationRescueSharedVictoryEffect(value: RuleNode): boolean {
  return value.type === ELIMINATION_RESCUE_SHARED_VICTORY_EFFECT &&
    value.preventElimination === true && value.swapVictoryPointsWithOpponent === true && value.shareVictory === true &&
    exactKeys(value, ['type', 'preventElimination', 'swapVictoryPointsWithOpponent', 'shareVictory']);
}
export function isAcceptedEliminationRescueSharedVictoryAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'passive' || ability.activation.trigger !== 'while_active' ||
      !exactKeys(ability.activation as unknown as Record<string, unknown>, ['trigger'])) return false;
  if (ability.conditions.length || ability.targets.length || ability.cost.length || ability.ruleModifiers.length || ability.creates.length) return false;
  if (ability.effects.length !== 1 || !isEliminationRescueSharedVictoryEffect(ability.effects[0]!)) return false;
  if (!empty(ability.lifecycle) || !standardResponse(ability.responseWindow) || !empty(ability.visibility)) return false;
  if (!record(ability.limit) || ability.limit.type !== 'per_game' || ability.limit.uses !== 1 || ability.limit.scope !== 'this_card' ||
      !exactKeys(ability.limit as Record<string, unknown>, ['type', 'uses', 'scope'])) return false;
  return ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0;
}
const eliminationRescueSharedVictoryNodeCache = new WeakMap<object, boolean>();
export function containsEliminationRescueSharedVictoryNode(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const key = value as object;
  const cached = eliminationRescueSharedVictoryNodeCache.get(key);
  if (cached !== undefined) return cached;
  const result = Array.isArray(value)
    ? value.some(containsEliminationRescueSharedVictoryNode)
    : record(value) && (value.type === ELIMINATION_RESCUE_SHARED_VICTORY_EFFECT || Object.values(value).some(containsEliminationRescueSharedVictoryNode));
  eliminationRescueSharedVictoryNodeCache.set(key, result);
  return result;
}

const packHasEliminationRescueSharedVictory = new WeakMap<object, boolean>();
export function runtimePackHasEliminationRescueSharedVictory(state: GameState): boolean {
  const pack = state.abilityRuntime?.pack;
  if (!pack) return false;
  const key = pack as object;
  const cached = packHasEliminationRescueSharedVictory.get(key);
  if (cached !== undefined) return cached;
  const found = Object.values(pack.cards).some((definition) => definition.abilities.some(isAcceptedEliminationRescueSharedVictoryAbility));
  packHasEliminationRescueSharedVictory.set(key, found);
  return found;
}

function sourceProvenanceValid(state: GameState, sourceCardId: string, controllerId: string, abilityId: string): boolean {
  const r = state.abilityRuntime;
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const ability = source && r?.pack.cards[source.definitionId]?.abilities.find((entry) => entry.id === abilityId);
  return !!source && source.ownerPlayerId === controllerId && source.controllerPlayerId === controllerId &&
    !!ability && isAcceptedEliminationRescueSharedVictoryAbility(ability);
}
function sourceLive(state: GameState, sourceCardId: string, controllerId: string, abilityId: string): boolean {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  return source?.zone === 'skill' && sourceProvenanceValid(state, sourceCardId, controllerId, abilityId);
}
function providers(state: GameState) {
  if (!runtimePackHasEliminationRescueSharedVictory(state)) return [];
  const r = runtime(state);
  const out: Array<{ controllerId: string; sourceCardId: string; abilityId: string }> = [];
  for (const player of state.players.slice().sort((a, b) => a.seat - b.seat)) {
    for (const source of state.cards.filter((card) => card.ownerPlayerId === player.id && card.controllerPlayerId === player.id && card.zone === 'skill')) {
      const definition = r.pack.cards[source.definitionId];
      if (!definition) continue;
      for (const ability of definition.abilities) {
        if (isAcceptedEliminationRescueSharedVictoryAbility(ability)) {
          out.push({ controllerId: player.id, sourceCardId: source.instanceId, abilityId: ability.id });
        }
      }
    }
  }
  return out;
}
export function hasAvailableEliminationRescueProvider(state: GameState): boolean {
  if (![8, 9, 10].includes(state.round.roundNumber) || state.abilityRuntime?.pendingDecision) return false;
  return providers(state).some((entry) => !used(state, entry.sourceCardId, entry.abilityId));
}
function used(state: GameState, sourceCardId: string, abilityId: string): boolean {
  return (state.abilityRuntime?.eliminationRescueRecords ?? []).some((entry) =>
    entry.sourceCardId === sourceCardId && entry.abilityId === abilityId);
}
function candidateKey(round: number, ids: readonly string[]): string {
  return `${round}:${[...ids].sort().join(',')}`;
}
function declineKey(sourceCardId: string, abilityId: string, key: string): string {
  return `elimination-rescue-decline:${sourceCardId}:${abilityId}:${key}`;
}
function nextDecisionId(state: GameState): string {
  const r = runtime(state);
  r.sequence += 1;
  return `elimination-rescue:${r.sequence}`;
}

export function stageEliminationRescueChoice(state: GameState, projectedCandidatePlayerIds: readonly string[]): boolean {
  const r = runtime(state);
  if (r.pendingDecision || projectedCandidatePlayerIds.length === 0 || ![8, 9, 10].includes(state.round.roundNumber)) return false;
  const supplied = [...new Set(projectedCandidatePlayerIds)];
  if (supplied.length !== projectedCandidatePlayerIds.length ||
      supplied.some((id) => !state.players.some((player) => player.id === id))) return false;
  supplied.sort((a, b) => {
    const left = state.players.find((player) => player.id === a)!;
    const right = state.players.find((player) => player.id === b)!;
    return left.seat - right.seat || left.id.localeCompare(right.id);
  });
  const candidates = projectBattleEliminationCandidatePlayerIds(state);
  if (!candidates.length || JSON.stringify(supplied) !== JSON.stringify(candidates)) return false;
  const key = candidateKey(state.round.roundNumber, candidates);
  const provider = providers(state).find((entry) => !used(state, entry.sourceCardId, entry.abilityId) &&
    !r.abilityUsage[declineKey(entry.sourceCardId, entry.abilityId, key)]);
  if (!provider) return false;
  const id = nextDecisionId(state);
  r.pendingDecision = {
    id,
    controllerId: provider.controllerId,
    target: { id: 'elimination_rescue_target', type: 'player', count: { min: 0, max: 1 } },
    candidates,
    min: 0,
    max: 1,
    context: { controllerId: provider.controllerId, sourceCardId: provider.sourceCardId, abilityId: provider.abilityId, variables: {}, selections: {} },
    remainingEffects: [],
    interaction: {
      kind: 'elimination_rescue_choice_v1',
      template: 'target',
      visibility: 'owner_only',
      cancelPolicy: 'forbidden',
      sourceCardInstanceId: provider.sourceCardId,
      abilityId: provider.abilityId,
      createdRevision: r.revision,
      continuationRef: `${id}:continuation`,
      controllerId: provider.controllerId,
      round: state.round.roundNumber,
      candidatePlayerIds: [...candidates],
      candidateKey: key,
      projectionFingerprint: eliminationRescueProjectionFingerprint(state, candidates),
      constraints: { kind: 'target', targetKind: 'player', min: 0, max: 1, distinct: true },
    },
  };
  return true;
}

export function isEliminationRescuePendingDecisionLiveValid(state: GameState, decision: PendingDecision): boolean {
  try {
    const meta = decision.interaction;
    if (meta?.kind !== 'elimination_rescue_choice_v1') return false;
    const live = projectBattleEliminationCandidatePlayerIds(state);
    const count = record(decision.target.count) ? decision.target.count : {};
    return state.round.roundNumber === meta.round && sourceLive(state, meta.sourceCardInstanceId, meta.controllerId, meta.abilityId) &&
      !used(state, meta.sourceCardInstanceId, meta.abilityId) &&
      meta.createdRevision === runtime(state).revision && meta.continuationRef === `${decision.id}:continuation` &&
      meta.candidateKey === candidateKey(meta.round, live) &&
      meta.projectionFingerprint === eliminationRescueProjectionFingerprint(state, live) &&
      JSON.stringify(meta.candidatePlayerIds) === JSON.stringify(live) &&
      decision.controllerId === meta.controllerId && decision.context.controllerId === meta.controllerId &&
      decision.context.sourceCardId === meta.sourceCardInstanceId && decision.context.abilityId === meta.abilityId &&
      decision.target.id === 'elimination_rescue_target' && decision.target.type === 'player' &&
      count.min === 0 && count.max === 1 && decision.min === 0 && decision.max === 1 &&
      decision.remainingEffects.length === 0 &&
      meta.constraints.kind === 'target' && meta.constraints.targetKind === 'player' && meta.constraints.min === 0 &&
      meta.constraints.max === 1 && meta.constraints.distinct === true &&
      JSON.stringify(decision.candidates) === JSON.stringify(live);
  } catch {
    return false;
  }
}

export function resolveEliminationRescueDecision(state: GameState, decision: PendingDecision, selected: readonly string[]): boolean {
  if (!isEliminationRescuePendingDecisionLiveValid(state, decision) || selected.length > 1 ||
      new Set(selected).size !== selected.length || selected.some((id) => !decision.candidates.includes(id))) return false;
  const meta = decision.interaction!;
  if (meta.kind !== 'elimination_rescue_choice_v1') return false;
  const r = runtime(state);
  delete r.pendingDecision;
  if (selected.length === 0) {
    r.abilityUsage[declineKey(meta.sourceCardInstanceId, meta.abilityId, meta.candidateKey)] = 1;
    r.events.push({ type: 'elimination_rescue_declined', playerId: meta.controllerId, controllerId: meta.controllerId,
      sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, roundNumber: meta.round });
    return true;
  }
  const targetPlayerId = selected[0]!;
  const opponentTarget = targetPlayerId !== meta.controllerId;
  (r.eliminationRescueRecords ??= []).push({
    controllerId: meta.controllerId,
    targetPlayerId,
    sourceCardId: meta.sourceCardInstanceId,
    abilityId: meta.abilityId,
    round: meta.round,
    opponentTarget,
    scoringSettled: false,
    vpSwapped: false,
  });
  if (opponentTarget) {
    const leftPlayerId = meta.controllerId < targetPlayerId ? meta.controllerId : targetPlayerId;
    const rightPlayerId = meta.controllerId < targetPlayerId ? targetPlayerId : meta.controllerId;
    const duplicate = (r.sharedVictoryLinks ??= []).some((entry) =>
      entry.leftPlayerId === leftPlayerId && entry.rightPlayerId === rightPlayerId);
    if (!duplicate) r.sharedVictoryLinks.push({
      leftPlayerId, rightPlayerId,
      sourceCardId: meta.sourceCardInstanceId,
      abilityId: meta.abilityId,
      createdRound: meta.round,
    });
  }
  r.events.push({ type: 'elimination_rescue_armed', playerId: targetPlayerId, controllerId: meta.controllerId,
    sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, roundNumber: meta.round });
  return true;
}

export function playerEliminationPreventedByAcceptedRescue(state: GameState, playerId: string): boolean {
  if (![8, 9, 10].includes(state.round.roundNumber)) return false;
  const records = state.abilityRuntime?.eliminationRescueRecords;
  if (!records?.length) return false;
  return records.some((entry) =>
    entry.targetPlayerId === playerId && entry.round === state.round.roundNumber && !entry.scoringSettled);
}
export function settleEliminationRescueAfterScoring(state: GameState): Array<{ playerId: string; before: number; after: number }> {
  const changes: Array<{ playerId: string; before: number; after: number }> = [];
  const r = runtime(state);
  const records = r.eliminationRescueRecords;
  if (!records?.length) return changes;
  for (const entry of records) {
    if (entry.round !== state.round.roundNumber || entry.scoringSettled) continue;
    const target = state.players.find((player) => player.id === entry.targetPlayerId);
    const controller = state.players.find((player) => player.id === entry.controllerId);
    if (!target || !controller || target.status !== 'active') throw new Error('ELIMINATION_RESCUE_SETTLEMENT_INVALID');
    if (entry.opponentTarget) {
      const controllerBefore = controller.vp;
      const targetBefore = target.vp;
      controller.vp = targetBefore;
      target.vp = controllerBefore;
      entry.vpSwapped = true;
      changes.push({ playerId: controller.id, before: controllerBefore, after: controller.vp });
      changes.push({ playerId: target.id, before: targetBefore, after: target.vp });
      r.events.push({ type: 'elimination_rescue_vp_swapped', playerId: target.id, controllerId: controller.id,
        sourceCardId: entry.sourceCardId, abilityId: entry.abilityId, roundNumber: entry.round });
    }
    entry.scoringSettled = true;
  }
  return changes.filter((entry) => entry.before !== entry.after);
}

export function expandSharedVictoryRanking<T extends { playerId: string; rank: number }>(state: GameState, ranking: T[]): T[] {
  if (!ranking.length) return ranking;
  const winners = new Set(ranking.filter((entry) => entry.rank === 1).map((entry) => entry.playerId));
  let changed = true;
  while (changed) {
    changed = false;
    for (const link of state.abilityRuntime?.sharedVictoryLinks ?? []) {
      if (winners.has(link.leftPlayerId) && !winners.has(link.rightPlayerId)) { winners.add(link.rightPlayerId); changed = true; }
      if (winners.has(link.rightPlayerId) && !winners.has(link.leftPlayerId)) { winners.add(link.leftPlayerId); changed = true; }
    }
  }
  return ranking.map((entry) => winners.has(entry.playerId) ? { ...entry, rank: 1 } : entry);
}

export function isEliminationRescueRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const r = state.abilityRuntime;
    if (!r) return true;
    if (r.eliminationRescueBattleResolutionRound !== undefined &&
        (r.eliminationRescueBattleResolutionRound !== state.round.roundNumber || state.battleResults.length === 0)) return false;
    const playerIds = new Set(state.players.map((player) => player.id));
    const sourceKeys = new Set<string>();
    for (const entry of r.eliminationRescueRecords ?? []) {
      const sourceKey = `${entry.sourceCardId}:${entry.abilityId}`;
      if (sourceKeys.has(sourceKey) || !playerIds.has(entry.controllerId) || !playerIds.has(entry.targetPlayerId) ||
          !Number.isSafeInteger(entry.round) || entry.round < 1 || entry.round > state.round.roundNumber ||
          entry.opponentTarget !== (entry.controllerId !== entry.targetPlayerId) ||
          typeof entry.scoringSettled !== 'boolean' || typeof entry.vpSwapped !== 'boolean' ||
          entry.vpSwapped && (!entry.opponentTarget || !entry.scoringSettled) ||
          entry.opponentTarget && entry.scoringSettled && !entry.vpSwapped ||
          !sourceProvenanceValid(state, entry.sourceCardId, entry.controllerId, entry.abilityId)) return false;
      sourceKeys.add(sourceKey);
    }
    const linkKeys = new Set<string>();
    for (const link of r.sharedVictoryLinks ?? []) {
      if (!playerIds.has(link.leftPlayerId) || !playerIds.has(link.rightPlayerId) || link.leftPlayerId >= link.rightPlayerId ||
          !Number.isSafeInteger(link.createdRound) || link.createdRound < 1 || link.createdRound > state.round.roundNumber ||
          !sourceProvenanceValid(state, link.sourceCardId, link.leftPlayerId, link.abilityId) &&
          !sourceProvenanceValid(state, link.sourceCardId, link.rightPlayerId, link.abilityId)) return false;
      const key = `${link.leftPlayerId}:${link.rightPlayerId}`;
      if (linkKeys.has(key)) return false;
      linkKeys.add(key);
      if (!(r.eliminationRescueRecords ?? []).some((entry) => entry.sourceCardId === link.sourceCardId &&
          entry.abilityId === link.abilityId && entry.opponentTarget &&
          new Set([entry.controllerId, entry.targetPlayerId]).has(link.leftPlayerId) &&
          new Set([entry.controllerId, entry.targetPlayerId]).has(link.rightPlayerId))) return false;
    }
    if (r.pendingDecision?.interaction?.kind === 'elimination_rescue_choice_v1' &&
        !isEliminationRescuePendingDecisionLiveValid(state, r.pendingDecision)) return false;
    return true;
  } catch {
    return false;
  }
}
