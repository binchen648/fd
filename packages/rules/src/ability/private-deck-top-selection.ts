/**
 * Identity-free, pure authority check for a private deck-top choice continuation.
 * No card identities are exposed to non-decision makers here; the caller must
 * enforce the visibility / interaction lease and apply resulting mutations atomically.
 */
export interface PrivateDeckPhysicalCard {
  instanceId: string;
  ownerPlayerId: string;
  zone: string;
}

/** Prepare a whole-card-array replacement without altering the authoritative state.
 * A caller must authenticate the pending decision and commit atomically.
 */
export function preparePrivateDeckTopMutation<T extends PrivateDeckPhysicalCard>(
  cards: readonly T[],
  targetPlayerId: string,
  recordedTopIds: readonly string[],
  discardedIds: readonly string[],
  orderedSurvivors: readonly string[],
): T[] | undefined {
  if (!Array.isArray(cards) || typeof targetPlayerId !== 'string' || !targetPlayerId) return undefined;
  if (cards.some(c => !c || typeof c.instanceId !== 'string' ||
      typeof c.ownerPlayerId !== 'string' || typeof c.zone !== 'string')) return undefined;
  const unique = new Set(cards.map(c => c.instanceId));
  if (unique.size !== cards.length) return undefined;
  const live = cards.filter(c => c.ownerPlayerId === targetPlayerId && c.zone === 'deck').map(c => c.instanceId);
  const plan = planPrivateDeckTopSelection(recordedTopIds, live, discardedIds, orderedSurvivors);
  if (!plan) return undefined;
  const byId = new Map(cards.map(c => [c.instanceId, c] as const));
  const discarded = new Set(plan.discardedIds);
  const prepared = cards.map(c => discarded.has(c.instanceId) ? { ...c, zone: 'discard' } : { ...c });
  const remainingPositions = prepared.flatMap((c, i) =>
    c.ownerPlayerId === targetPlayerId && c.zone === 'deck' ? [i] : []);
  if (remainingPositions.length !== plan.resultingDeckIds.length) return undefined;
  remainingPositions.forEach((index, i) => {
    const original = byId.get(plan.resultingDeckIds[i]!);
    if (original) prepared[index] = { ...original };
  });
  return prepared;
}

/** Fail-closed transaction proposal across an exact private continuation lease.
 * Only produces a replacement card array. The game engine must authenticate
 * phase/source and commit via its existing transactional resolution boundary.
 */
export function prepareLeasedPrivateDeckTopMutation<T extends PrivateDeckPhysicalCard>(
  cards: readonly T[],
  lease: PrivateDeckTopLease,
  authority: { controllerId: string; targetPlayerId: string; sourceCardInstanceId: string; abilityId: string; decisionId: string; revision: number },
  discardedIds: readonly string[],
  orderedSurvivors: readonly string[],
): T[] | undefined {
  if (!Array.isArray(cards) || !lease || !authority) return undefined;
  const deckIds = cards.filter(c => c?.ownerPlayerId === authority.targetPlayerId && c.zone === 'deck').map(c => c.instanceId);
  if (!validatePrivateDeckTopLease(lease, { ...authority, deckIds })) return undefined;
  return preparePrivateDeckTopMutation(cards, lease.targetPlayerId, lease.recordedTopIds, discardedIds, orderedSurvivors);
}

/** Bound gameplay eligibility for a private opponent deck-top action.
 * This is an identity-free gate to be called from the authoritative dispatcher.
 */
export interface PrivateDeckTopActionAuthority {
  phase: string;
  controllerId: string;
  targetPlayerId: string;
  battlefieldId: string;
  controllerLocationId: string;
  targetLocationId: string;
  sourceOwnedByController: boolean;
  sourceActive: boolean;
  sourceAbilityAccepted: boolean;
  pendingDecisionId: string | undefined;
}
export function isPrivateDeckTopActionAuthorized(authority: PrivateDeckTopActionAuthority): boolean {
  return !!authority && authority.phase === 'action' &&
    typeof authority.controllerId === 'string' && authority.controllerId.length > 0 &&
    typeof authority.targetPlayerId === 'string' && authority.targetPlayerId.length > 0 &&
    typeof authority.battlefieldId === 'string' && authority.battlefieldId.length > 0 &&
    authority.controllerLocationId === authority.battlefieldId &&
    authority.targetLocationId === authority.battlefieldId &&
    authority.sourceOwnedByController === true &&
    authority.sourceActive === true && authority.sourceAbilityAccepted === true &&
    authority.pendingDecisionId === undefined;
}

/** Return a decision view that only reveals card identities to its controller.
 * Public observers get counts, never the private deck-top instance IDs.
 */
export function projectPrivateDeckTopDecision(
  viewerPlayerId: string | undefined,
  controllerId: string,
  topCardIds: readonly string[],
): { count: number; cardInstanceIds?: string[] } | undefined {
  if (typeof controllerId !== 'string' || !controllerId ||
      !Array.isArray(topCardIds) || topCardIds.length > 3 || !distinct(topCardIds)) return undefined;
  if (viewerPlayerId === controllerId) return { count: topCardIds.length, cardInstanceIds: [...topCardIds] };
  return { count: topCardIds.length };
}

/** Recheck the authorized final choice against its pending-decision envelope.
 * This does not independently trust card IDs supplied by the client.
 */
export function validatePrivateDeckTopDecisionEnvelope(
  envelope: {
    decisionId: string; controllerId: string; candidates: readonly string[];
    min: number; max: number; visibility: string; cancelPolicy: string;
  },
  actorId: string,
  expectedDecisionId: string,
  allowedIds: readonly string[],
  selectedIds: readonly string[],
): boolean {
  if (!envelope || typeof actorId !== 'string' || !actorId ||
      envelope.controllerId !== actorId || envelope.decisionId !== expectedDecisionId ||
      envelope.visibility !== 'owner_only' || envelope.cancelPolicy !== 'forbidden' ||
      !Array.isArray(envelope.candidates) || !Array.isArray(allowedIds) || !Array.isArray(selectedIds) ||
      !distinct(envelope.candidates) || !distinct(allowedIds) || !distinct(selectedIds) ||
      envelope.candidates.length !== allowedIds.length ||
      envelope.candidates.some((id, index) => id !== allowedIds[index]) ||
      !Number.isSafeInteger(envelope.min) || !Number.isSafeInteger(envelope.max) ||
      envelope.min < 0 || envelope.max > 3 || envelope.min > envelope.max ||
      selectedIds.length < envelope.min || selectedIds.length > envelope.max ||
      selectedIds.some(id => !allowedIds.includes(id))) return false;
  return true;
}

/** Apply a validated private top-card decision using the authoritative move and
 * reorder hooks. The game command dispatcher must provide rollback on throws.
 */
export function applyPrivateDeckTopSelection<T extends PrivateDeckPhysicalCard>(
  cards: readonly T[],
  lease: PrivateDeckTopLease,
  authority: { controllerId: string; targetPlayerId: string; sourceCardInstanceId: string; abilityId: string; decisionId: string; revision: number },
  discardedIds: readonly string[],
  orderedSurvivors: readonly string[],
  moveToDiscard: (instanceId: string) => void,
  reorderDeck: (targetId: string, orderedDeckIds: readonly string[]) => void,
): boolean {
  const proposed = prepareLeasedPrivateDeckTopMutation(cards, lease, authority, discardedIds, orderedSurvivors);
  if (!proposed || typeof moveToDiscard !== 'function' || typeof reorderDeck !== 'function') return false;
  const liveDeck = cards.filter(c => c.ownerPlayerId === lease.targetPlayerId && c.zone === 'deck').map(c=>c.instanceId);
  const planned = planPrivateDeckTopSelection(lease.recordedTopIds, liveDeck, discardedIds, orderedSurvivors);
  if (!planned) return false;
  for (const id of planned.discardedIds) moveToDiscard(id);
  reorderDeck(lease.targetPlayerId, planned.resultingDeckIds);
  return true;
}

export interface PrivateDeckTopSelection {
  discardedIds: string[];
  remainingTopIds: string[];
  resultingDeckIds: string[];
}
function distinct(ids: readonly string[]): boolean {
  return ids.every((id) => typeof id === 'string' && id.length > 0) &&
    new Set(ids).size === ids.length;
}
export function planPrivateDeckTopSelection(
  recordedTopIds: readonly string[],
  liveDeckIds: readonly string[],
  discardedIds: readonly string[],
  remainingTopIds: readonly string[],
): PrivateDeckTopSelection | undefined {
  if (!Array.isArray(recordedTopIds) || !Array.isArray(liveDeckIds) ||
      !Array.isArray(discardedIds) || !Array.isArray(remainingTopIds) ||
      recordedTopIds.length > 3 || !distinct(recordedTopIds) || !distinct(liveDeckIds) ||
      !distinct(discardedIds) || !distinct(remainingTopIds)) return undefined;
  if (recordedTopIds.length !== Math.min(3, liveDeckIds.length) ||
      recordedTopIds.some((id, i) => id !== liveDeckIds[i])) return undefined;
  const recorded = new Set(recordedTopIds);
  if (discardedIds.some((id) => !recorded.has(id))) return undefined;
  const discarded = new Set(discardedIds);
  const survivors = recordedTopIds.filter((id) => !discarded.has(id));
  if (remainingTopIds.length !== survivors.length || remainingTopIds.some((id) => !survivors.includes(id)))
    return undefined;
  return {
    discardedIds: [...discardedIds],
    remainingTopIds: [...remainingTopIds],
    resultingDeckIds: [...remainingTopIds, ...liveDeckIds.slice(recordedTopIds.length)],
  };
}
/** Pure validation for a serialized action-stage deck-top choice lease.
 * Runtime must additionally authenticate source, phase, target, visibility.
 */
export interface PrivateDeckTopLease {
  controllerId: string;
  targetPlayerId: string;
  sourceCardInstanceId: string;
  abilityId: string;
  decisionId: string;
  createdRevision: number;
  recordedTopIds: string[];
}
export function validatePrivateDeckTopLease(
  lease: PrivateDeckTopLease,
  current: { controllerId: string; targetPlayerId: string; sourceCardInstanceId: string; abilityId: string; decisionId: string; revision: number; deckIds: readonly string[] },
): boolean {
  if (!lease || !current || typeof lease !== 'object' || !Array.isArray(lease.recordedTopIds)) return false;
  for (const key of ['controllerId', 'targetPlayerId', 'sourceCardInstanceId', 'abilityId', 'decisionId'] as const) {
    if (typeof lease[key] !== 'string' || !lease[key] || lease[key] !== current[key]) return false;
  }
  if (!Number.isSafeInteger(lease.createdRevision) ||
      lease.createdRevision < 0 || lease.createdRevision !== current.revision) return false;
  if (!Array.isArray(current.deckIds) || !distinct(current.deckIds) ||
      !distinct(lease.recordedTopIds) || lease.recordedTopIds.length > 3 ||
      lease.recordedTopIds.length !== Math.min(3, current.deckIds.length)) return false;
  return lease.recordedTopIds.every((id, i) => current.deckIds[i] === id);
}
/** Transition an authenticated private top-card decision into the reorder phase.
 * The caller is responsible for the next pending-decision lease and visibility.
 */
export function planPrivateDeckTopDiscard(
  recordedTopIds: readonly string[],
  liveDeckIds: readonly string[],
  discardedIds: readonly string[],
): { discardedIds: string[]; reorderCandidates: string[] } | undefined {
  if (!Array.isArray(recordedTopIds) || !Array.isArray(liveDeckIds) ||
      !Array.isArray(discardedIds) || !distinct(discardedIds) ||
      discardedIds.some((id) => !recordedTopIds.includes(id))) return undefined;
  const survivors = recordedTopIds.filter((id) => !discardedIds.includes(id));
  const plan = planPrivateDeckTopSelection(recordedTopIds, liveDeckIds, discardedIds, survivors);
  if (!plan) return undefined;
  return { discardedIds: plan.discardedIds, reorderCandidates: survivors };
}

/** Validate final survivor permutation after cards have actually been discarded.
 * The current top must still be the surviving snapshot in the original order.
 */
export function planPrivateDeckTopReorder(
  expectedSurvivors: readonly string[],
  liveDeckIds: readonly string[],
  orderedSurvivors: readonly string[],
): string[] | undefined {
  if (!Array.isArray(expectedSurvivors) || !Array.isArray(liveDeckIds) ||
      !Array.isArray(orderedSurvivors) || expectedSurvivors.length > 3 ||
      !distinct(expectedSurvivors) || !distinct(liveDeckIds) || !distinct(orderedSurvivors) ||
      expectedSurvivors.length > liveDeckIds.length ||
      expectedSurvivors.some((id, i) => id !== liveDeckIds[i]) ||
      orderedSurvivors.length !== expectedSurvivors.length ||
      orderedSurvivors.some((id) => !expectedSurvivors.includes(id))) return undefined;
  return [...orderedSurvivors, ...liveDeckIds.slice(expectedSurvivors.length)];
}
