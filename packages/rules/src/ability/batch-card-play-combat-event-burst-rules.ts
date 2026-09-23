import type { GameState } from '../schema/game';
import { listEventRuleCandidates, moveEventRuleCandidates } from './event-rule';
import type { AbilityEvent, AuthoringAbility, RuleNode } from './types';

export const B06_SOURCE_PLAYED_FACE_UP_CONDITION = 'b06_source_played_face_up';
export const B06_ARM_ROUND_PUNISHMENT_EFFECT = 'b06_arm_round_punishment';
export const B06_SOURCE_ARMED_THIS_ROUND_CONDITION = 'b06_source_armed_this_round';
export const B06_PUNISH_BATTLE_LOSERS_EFFECT = 'b06_punish_battle_losers_by_event_vp';
export const B06_EVENT_BURST_EFFECT = 'b06_event_burst_source_power_and_remove';

function record(value: unknown): Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}
function exactKeys(value: unknown, expected: readonly string[]): boolean {
  const actual = Object.keys(record(value)).sort(); const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}
function empty(value: unknown): boolean { return exactKeys(value, []); }
function exactCondition(value: unknown, type: string): boolean { return record(value).type === type && exactKeys(value, ['type']); }
function automatic(a: AuthoringAbility): boolean {
  return a.execution.mode === 'automatic' && Array.isArray(a.execution.allowedOperations) && a.execution.allowedOperations.length === 0;
}
function trueNameVisibility(value: unknown): boolean {
  const v = record(value);
  return exactKeys(v, ['revealsTrueName', 'revealTiming', 'revealScope']) && v.revealsTrueName === true &&
    v.revealTiming === 'on_use_declared' && v.revealScope === 'servant_package';
}
function exactResponseWindow(value: unknown): boolean {
  const v = record(value);
  return empty(v) || (exactKeys(v, ['order', 'passBehavior']) && v.order === 'turn_order' && v.passBehavior === 'decline_this_window');
}
function baseEmpty(a: AuthoringAbility): boolean {
  return a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 && a.ruleModifiers.length === 0 &&
    empty(a.lifecycle) && exactResponseWindow(a.responseWindow) && automatic(a);
}

export function isAcceptedB06RoundArmAbility(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'on_card_played' &&
    a.conditions.length === 2 && exactCondition(a.conditions[0], 'event_player_is_controller') &&
    exactCondition(a.conditions[1], B06_SOURCE_PLAYED_FACE_UP_CONDITION) && a.effects.length === 1 &&
    exactCondition(a.effects[0], B06_ARM_ROUND_PUNISHMENT_EFFECT) && empty(a.limit) && trueNameVisibility(a.visibility) && baseEmpty(a);
}

export function isAcceptedB06BattlePunishAbility(a: AuthoringAbility): boolean {
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'after_battle_result_determined' &&
    a.conditions.length === 1 && exactCondition(a.conditions[0], B06_SOURCE_ARMED_THIS_ROUND_CONDITION) && a.effects.length === 1 &&
    exactCondition(a.effects[0], B06_PUNISH_BATTLE_LOSERS_EFFECT) && empty(a.limit) && empty(a.visibility) && baseEmpty(a);
}

export function isAcceptedB06EventBurstAbility(a: AuthoringAbility): boolean {
  const limit = record(a.limit);
  return a.kind === 'forced_trigger' && exactKeys(a.activation, ['trigger']) && a.activation.trigger === 'on_card_played' &&
    a.conditions.length === 2 && exactCondition(a.conditions[0], 'event_player_is_controller') &&
    exactCondition(a.conditions[1], B06_SOURCE_PLAYED_FACE_UP_CONDITION) && a.effects.length === 1 &&
    exactCondition(a.effects[0], B06_EVENT_BURST_EFFECT) && exactKeys(limit, ['type', 'uses', 'scope']) &&
    limit.type === 'per_game' && limit.uses === 1 && limit.scope === 'this_card' && trueNameVisibility(a.visibility) && baseEmpty(a);
}

export function isB06CardPlayCombatEventBurstCandidate(a: AuthoringAbility | RuleNode): boolean {
  const raw = record(a); const conditions = Array.isArray(raw.conditions) ? raw.conditions : []; const effects = Array.isArray(raw.effects) ? raw.effects : [];
  return conditions.some((entry) => [B06_SOURCE_PLAYED_FACE_UP_CONDITION, B06_SOURCE_ARMED_THIS_ROUND_CONDITION].includes(String(record(entry).type ?? ''))) ||
    effects.some((entry) => [B06_ARM_ROUND_PUNISHMENT_EFFECT, B06_PUNISH_BATTLE_LOSERS_EFFECT, B06_EVENT_BURST_EFFECT].includes(String(record(entry).type ?? '')));
}
export function isAcceptedB06CardPlayCombatEventBurstAbility(a: AuthoringAbility): boolean {
  return isAcceptedB06RoundArmAbility(a) || isAcceptedB06BattlePunishAbility(a) || isAcceptedB06EventBurstAbility(a);
}

function sourceAndAbility(state: GameState, sourceCardId: string, abilityId: string) {
  const source = state.cards.find((card) => card.instanceId === sourceCardId);
  const def = source ? state.abilityRuntime?.pack.cards[source.definitionId] : undefined;
  const ability = def?.abilities.find((candidate) => candidate.id === abilityId);
  return { source, def, ability };
}
function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
function trustedFaceUpSourcePlay(state: GameState, controllerId: string, sourceCardId: string, event: AbilityEvent | undefined) {
  const runtime = state.abilityRuntime;
  if (!runtime || !event || event.type !== 'on_card_played' || event.playerId !== controllerId || event.sourceCardId !== sourceCardId || !/^play-[1-9]\d*$/.test(event.id)) return undefined;
  const trusted = runtime.trustedCardPlaySnapshots?.[event.id];
  if (!trusted || trusted.eventId !== event.id || trusted.playerId !== controllerId || trusted.sourceCardId !== sourceCardId ||
      trusted.round !== state.round.roundNumber || trusted.faceDown || !runtime.processedEvents.includes(event.id)) return undefined;
  return trusted;
}

export function b06SourcePlayedFaceUp(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): boolean {
  if (!isAcceptedB06RoundArmAbility(ability) && !isAcceptedB06EventBurstAbility(ability)) return false;
  return !!trustedFaceUpSourcePlay(state, controllerId, sourceCardId, event);
}

function validateRoundArm(state: GameState, arm: NonNullable<NonNullable<GameState['abilityRuntime']>['b06RoundPunishmentArms']>[number]) {
  const runtime = state.abilityRuntime; const { source, def, ability } = sourceAndAbility(state, arm.sourceCardId, arm.armAbilityId);
  const punish = def?.abilities.find((candidate) => candidate.id === arm.punishAbilityId);
  const trusted = runtime?.trustedCardPlaySnapshots?.[arm.rootEventId];
  if (!runtime || !source || !def || !ability || !punish || source.definitionId !== arm.sourceDefinitionId || source.controllerPlayerId !== arm.controllerId ||
      !isAcceptedB06RoundArmAbility(ability) || !isAcceptedB06BattlePunishAbility(punish) || !/^play-[1-9]\d*$/.test(arm.rootEventId) ||
      !runtime.processedEvents.includes(arm.rootEventId) || !trusted || trusted.eventId !== arm.rootEventId || trusted.playerId !== arm.controllerId ||
      trusted.sourceCardId !== arm.sourceCardId || trusted.round !== arm.round || trusted.faceDown || !Number.isSafeInteger(arm.round) || arm.round < 1) {
    throw new Error('B06_ROUND_PUNISHMENT_ARM_STATE_INVALID');
  }
  return { source, def, ability, punish, trusted };
}

export function armB06RoundPunishment(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): void {
  const trusted = trustedFaceUpSourcePlay(state, controllerId, sourceCardId, event);
  const { source, def } = sourceAndAbility(state, sourceCardId, ability.id);
  const punish = def?.abilities.find(isAcceptedB06BattlePunishAbility);
  if (!trusted || !source || !def || !isAcceptedB06RoundArmAbility(ability) || !punish || source.controllerPlayerId !== controllerId) {
    throw new Error('B06_ROUND_PUNISHMENT_ARM_TRIGGER_INVALID');
  }
  const arms = state.abilityRuntime!.b06RoundPunishmentArms ??= [];
  if (arms.some((entry) => entry.sourceCardId === sourceCardId && entry.round === trusted.round)) throw new Error('B06_ROUND_PUNISHMENT_ARM_DUPLICATE');
  const next = { sourceCardId, sourceDefinitionId: source.definitionId, controllerId, armAbilityId: ability.id, punishAbilityId: punish.id,
    rootEventId: event!.id, round: trusted.round };
  arms.push(next); validateRoundArm(state, next);
}

export function b06SourceArmedThisRound(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility): boolean {
  if (!isAcceptedB06BattlePunishAbility(ability)) return false;
  const arms = state.abilityRuntime?.b06RoundPunishmentArms ?? []; const seen = new Set<string>(); let matched = false;
  for (const arm of arms) {
    validateRoundArm(state, arm);
    const key = JSON.stringify([arm.sourceCardId, arm.round]);
    if (seen.has(key)) throw new Error('B06_ROUND_PUNISHMENT_ARM_DUPLICATE');
    seen.add(key);
    if (arm.sourceCardId === sourceCardId && arm.controllerId === controllerId && arm.punishAbilityId === ability.id && arm.round === state.round.roundNumber) matched = true;
  }
  return matched;
}

export interface B06BattleSnapshotInput {
  battlePhaseResolutionId: string; battleId: string; resultId: string; battlefieldId: string;
  battleParticipantIds: string[]; winners: string[]; loserIds: string[]; printedEventVpTotal: number;
}
export function rememberB06BattleEventVpSnapshot(state: GameState, input: B06BattleSnapshotInput): void {
  const runtime = state.abilityRuntime; if (!runtime) return;
  const currentArms = (runtime.b06RoundPunishmentArms ?? []).filter((arm) => arm.round === state.round.roundNumber);
  if (currentArms.length === 0) return;
  for (const arm of currentArms) validateRoundArm(state, arm);
  if (!input.resultId || !input.battleId || !input.battlePhaseResolutionId || !input.battlefieldId ||
      new Set(input.battleParticipantIds).size !== input.battleParticipantIds.length || new Set(input.winners).size !== input.winners.length ||
      new Set(input.loserIds).size !== input.loserIds.length || input.winners.some((id) => input.loserIds.includes(id)) ||
      [...input.winners, ...input.loserIds].some((id) => !state.players.some((player) => player.id === id))) throw new Error('B06_BATTLE_EVENT_VP_SNAPSHOT_INVALID');
  const placements = state.eventPlacements.filter((placement) => placement.locationId === input.battlefieldId);
  if (placements.some((placement) => !Number.isSafeInteger(placement.victoryPoints) || Number(placement.victoryPoints) < 0)) throw new Error('B06_BATTLE_EVENT_VP_SNAPSHOT_INVALID');
  const eventVpTotal = placements.reduce((sum, placement) => sum + Number(placement.victoryPoints), 0);
  if (!Number.isSafeInteger(eventVpTotal) || !Number.isSafeInteger(input.printedEventVpTotal) || input.printedEventVpTotal < 0 || input.printedEventVpTotal !== eventVpTotal) throw new Error('B06_BATTLE_EVENT_VP_SNAPSHOT_INVALID');
  let battleLogIndex = -1;
  for (let index = state.log.length - 1; index >= 0; index--) {
    const entry = state.log[index]!;
    if (entry.type === 'battle_resolved' && entry.message === `battlefield:${input.battlefieldId}`) { battleLogIndex = index; break; }
  }
  const battleLog = state.log[battleLogIndex]; const battlePayload = battleLog?.payload ?? {};
  const breakdowns = Array.isArray(battlePayload.participantBreakdowns) ? battlePayload.participantBreakdowns as Array<Record<string, unknown>> : [];
  const loggedParticipants = breakdowns.map((entry) => String(entry.playerId ?? ''));
  const loggedLosers = loggedParticipants.filter((playerId) => !input.winners.includes(playerId));
  if (battleLogIndex < 0 || loggedParticipants.some((id) => !id) || new Set(loggedParticipants).size !== loggedParticipants.length ||
      !Array.isArray(battlePayload.winnerPlayerIds) || !sameStrings(battlePayload.winnerPlayerIds.map(String), input.winners) ||
      !sameStrings(loggedParticipants, input.battleParticipantIds) || !sameStrings(loggedLosers, input.loserIds) ||
      battlePayload.printedEventVpTotal !== eventVpTotal) {
    throw new Error('B06_BATTLE_EVENT_VP_SNAPSHOT_INVALID');
  }
  const snapshots = runtime.b06BattleEventVpSnapshots ??= {};
  const placementFacts = placements.map((placement) => ({ eventCardId: placement.eventCardId, locationId: placement.locationId,
    ...(placement.ruleInstanceId ? { ruleInstanceId: placement.ruleInstanceId } : {}), victoryPoints: Number(placement.victoryPoints) }));
  const next = { battlePhaseResolutionId: input.battlePhaseResolutionId, battleId: input.battleId, resultId: input.resultId,
    battlefieldId: input.battlefieldId, round: state.round.roundNumber, battleParticipantIds: [...input.battleParticipantIds],
    winners: [...input.winners], loserIds: [...input.loserIds], eventVpTotal, placementFacts, battleLogIndex, snapshotLogIndex: state.log.length };
  const prior = snapshots[input.resultId];
  if (prior && JSON.stringify(prior) !== JSON.stringify(next)) throw new Error('B06_BATTLE_EVENT_VP_SNAPSHOT_COLLISION');
  state.log.push({ type: 'b06_battle_event_vp_snapshot', message: input.resultId, payload: {
    battlePhaseResolutionId: input.battlePhaseResolutionId, battleId: input.battleId, resultId: input.resultId, battlefieldId: input.battlefieldId,
    round: state.round.roundNumber, battleParticipantIds: [...input.battleParticipantIds], winners: [...input.winners], loserIds: [...input.loserIds],
    eventVpTotal, placementFacts: structuredClone(placementFacts), battleLogIndex } });
  snapshots[input.resultId] = next;
}

function validatedBattleSnapshot(state: GameState, event: AbilityEvent | undefined) {
  const runtime = state.abilityRuntime;
  if (!runtime || !event || event.type !== 'after_battle_result_determined' || !event.resultId || event.id !== event.resultId) throw new Error('B06_BATTLE_EVENT_VP_STATE_INVALID');
  const snapshot = runtime.b06BattleEventVpSnapshots?.[event.resultId]; const trusted = runtime.trustedBattleResultSnapshots?.[event.resultId];
  const eventParticipants = event.battleParticipantIds ?? []; const eventLosers = event.battleResult?.loserIds ?? [];
  if (!snapshot || !trusted || snapshot.resultId !== event.resultId || snapshot.battlePhaseResolutionId !== event.battlePhaseResolutionId ||
      snapshot.battleId !== event.battleId || snapshot.battlefieldId !== event.battlefieldId || snapshot.round !== state.round.roundNumber ||
      eventParticipants.some((id) => !snapshot.battleParticipantIds.includes(id)) || !sameStrings(snapshot.winners, event.battleResult?.winners ?? []) ||
      eventLosers.some((id) => !snapshot.loserIds.includes(id)) || trusted.resultId !== snapshot.resultId || trusted.battleId !== snapshot.battleId ||
      trusted.battlePhaseResolutionId !== snapshot.battlePhaseResolutionId || trusted.battlefieldId !== snapshot.battlefieldId ||
      trusted.battleParticipantIds.some((id) => !snapshot.battleParticipantIds.includes(id)) || !sameStrings(trusted.winners, snapshot.winners) ||
      trusted.loserIds.some((id) => !snapshot.loserIds.includes(id)) || !Number.isSafeInteger(snapshot.eventVpTotal) || snapshot.eventVpTotal < 0 ||
      !runtime.processedEvents.includes(event.id)) throw new Error('B06_BATTLE_EVENT_VP_STATE_INVALID');
  const derivedEventVpTotal = snapshot.placementFacts.reduce((sum, entry) => sum + entry.victoryPoints, 0);
  if (!Number.isSafeInteger(derivedEventVpTotal) || derivedEventVpTotal !== snapshot.eventVpTotal || snapshot.placementFacts.some((entry) =>
      !entry.eventCardId || !entry.locationId || entry.locationId !== snapshot.battlefieldId || !Number.isSafeInteger(entry.victoryPoints) || entry.victoryPoints < 0 ||
      runtime.pack.eventCatalog?.[entry.eventCardId]?.printedReward !== entry.victoryPoints)) throw new Error('B06_BATTLE_EVENT_VP_STATE_INVALID');
  const currentPlacementFacts = state.eventPlacements.filter((placement) => placement.locationId === snapshot.battlefieldId)
    .map((placement) => ({ eventCardId: placement.eventCardId, locationId: placement.locationId,
      ...(placement.ruleInstanceId ? { ruleInstanceId: placement.ruleInstanceId } : {}), victoryPoints: Number(placement.victoryPoints) }));
  if (JSON.stringify(currentPlacementFacts) !== JSON.stringify(snapshot.placementFacts)) throw new Error('B06_BATTLE_EVENT_VP_STATE_INVALID');
  const battleLog = state.log[snapshot.battleLogIndex]; const battlePayload = battleLog?.payload ?? {};
  const snapshotLog = state.log[snapshot.snapshotLogIndex]; const snapshotPayload = snapshotLog?.payload ?? {};
  if (battleLog?.type !== 'battle_resolved' || battleLog.message !== `battlefield:${snapshot.battlefieldId}` ||
      !Array.isArray(battlePayload.winnerPlayerIds) || !sameStrings(battlePayload.winnerPlayerIds.map(String), snapshot.winners) || battlePayload.printedEventVpTotal !== snapshot.eventVpTotal ||
      snapshotLog?.type !== 'b06_battle_event_vp_snapshot' || snapshotLog.message !== snapshot.resultId ||
      snapshotPayload.resultId !== snapshot.resultId || snapshotPayload.battleId !== snapshot.battleId || snapshotPayload.battlePhaseResolutionId !== snapshot.battlePhaseResolutionId ||
      snapshotPayload.battlefieldId !== snapshot.battlefieldId || snapshotPayload.round !== snapshot.round || snapshotPayload.eventVpTotal !== snapshot.eventVpTotal ||
      snapshotPayload.battleLogIndex !== snapshot.battleLogIndex || JSON.stringify(snapshotPayload.placementFacts) !== JSON.stringify(snapshot.placementFacts) ||
      JSON.stringify(snapshotPayload.battleParticipantIds) !== JSON.stringify(snapshot.battleParticipantIds) || JSON.stringify(snapshotPayload.winners) !== JSON.stringify(snapshot.winners) ||
      JSON.stringify(snapshotPayload.loserIds) !== JSON.stringify(snapshot.loserIds)) throw new Error('B06_BATTLE_EVENT_VP_STATE_INVALID');
  return snapshot;
}

export function b06BattleLoserPenaltyFacts(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined) {
  if (!isAcceptedB06BattlePunishAbility(ability) || !b06SourceArmedThisRound(state, controllerId, sourceCardId, ability)) throw new Error('B06_BATTLE_PUNISHMENT_NOT_ARMED');
  const snapshot = validatedBattleSnapshot(state, event);
  return { loserIds: [...snapshot.loserIds], amount: snapshot.eventVpTotal };
}

function validateEventBurstState(state: GameState): void {
  const runtime = state.abilityRuntime; if (!runtime) return; const seen = new Set<string>();
  for (const receipt of runtime.b06EventBurstBonuses ?? []) {
    const { source, def, ability } = sourceAndAbility(state, receipt.sourceCardId, receipt.abilityId);
    const trusted = runtime.trustedCardPlaySnapshots?.[receipt.rootEventId]; const trustedRoot = runtime.b06TrustedEventBurstRoots?.[receipt.rootEventId];
    const log = state.log[receipt.logIndex]; const payload = log?.payload ?? {};
    const key = JSON.stringify([receipt.sourceCardId, receipt.abilityId, receipt.rootEventId]);
    const derivedTotal = receipt.movedEvents.reduce((sum, entry) => sum + entry.victoryPoints, 0); const derivedAmount = derivedTotal * 2;
    if (seen.has(key) || !source || !def || !ability || source.definitionId !== receipt.sourceDefinitionId || source.controllerPlayerId !== receipt.controllerId ||
        !isAcceptedB06EventBurstAbility(ability) || !/^play-[1-9]\d*$/.test(receipt.rootEventId) || !runtime.processedEvents.includes(receipt.rootEventId) ||
        !trusted || trusted.eventId !== receipt.rootEventId || trusted.playerId !== receipt.controllerId || trusted.sourceCardId !== receipt.sourceCardId ||
        trusted.round !== receipt.round || trusted.faceDown || !trustedRoot || trustedRoot.rootEventId !== receipt.rootEventId ||
        trustedRoot.sourceCardId !== receipt.sourceCardId || trustedRoot.sourceDefinitionId !== receipt.sourceDefinitionId ||
        trustedRoot.controllerId !== receipt.controllerId || trustedRoot.abilityId !== receipt.abilityId || trustedRoot.round !== receipt.round ||
        trustedRoot.amount !== receipt.amount || JSON.stringify(trustedRoot.sourceTokens) !== JSON.stringify(receipt.sourceTokens) ||
        JSON.stringify(trustedRoot.movedEvents) !== JSON.stringify(receipt.movedEvents) ||
        trustedRoot.eventRuleZoneRevisionBefore !== receipt.eventRuleZoneRevisionBefore || trustedRoot.eventRuleZoneRevisionAfter !== receipt.eventRuleZoneRevisionAfter ||
        !Number.isSafeInteger(receipt.round) || receipt.round < 1 || !Number.isSafeInteger(receipt.amount) || receipt.amount < 0 || !Number.isSafeInteger(derivedTotal) || derivedAmount !== receipt.amount ||
        !Number.isSafeInteger(receipt.eventRuleZoneRevisionBefore) || !Number.isSafeInteger(receipt.eventRuleZoneRevisionAfter) ||
        receipt.eventRuleZoneRevisionAfter !== receipt.eventRuleZoneRevisionBefore + (receipt.movedEvents.length ? 1 : 0) || runtime.eventRuleZoneRevision < receipt.eventRuleZoneRevisionAfter ||
        log?.type !== 'b06_event_burst_resolved' || log.message !== receipt.rootEventId || payload.rootEventId !== receipt.rootEventId ||
        payload.sourceCardId !== receipt.sourceCardId || payload.controllerId !== receipt.controllerId || payload.round !== receipt.round || payload.amount !== receipt.amount ||
        payload.eventRuleZoneRevisionBefore !== receipt.eventRuleZoneRevisionBefore || payload.eventRuleZoneRevisionAfter !== receipt.eventRuleZoneRevisionAfter ||
        JSON.stringify(payload.sourceTokens) !== JSON.stringify(receipt.sourceTokens) || JSON.stringify(payload.movedEvents) !== JSON.stringify(receipt.movedEvents) ||
        new Set(receipt.sourceTokens).size !== receipt.sourceTokens.length || receipt.sourceTokens.length !== receipt.movedEvents.length) throw new Error('B06_EVENT_BURST_STATE_INVALID');
    for (const [index, entry] of receipt.movedEvents.entries()) {
      const parts = receipt.sourceTokens[index]?.split(':') ?? [];
      if (parts.length !== 5 || parts[0] !== 'event_battlefield' || Number(parts[1]) !== receipt.eventRuleZoneRevisionBefore ||
          !Number.isSafeInteger(Number(parts[2])) || Number(parts[2]) < 0 || parts[3] !== entry.eventCardId || parts[4] !== (entry.ruleInstanceId ?? '')) {
        throw new Error('B06_EVENT_BURST_STATE_INVALID');
      }
      if (!entry.eventCardId || !entry.locationId || !Number.isSafeInteger(entry.victoryPoints) || entry.victoryPoints < 0 ||
          runtime.pack.eventCatalog?.[entry.eventCardId]?.printedReward !== entry.victoryPoints) throw new Error('B06_EVENT_BURST_STATE_INVALID');
    }
    seen.add(key);
  }
}

export function installB06EventBurst(state: GameState, controllerId: string, sourceCardId: string, ability: AuthoringAbility, event: AbilityEvent | undefined): void {
  const runtime = state.abilityRuntime; const trusted = trustedFaceUpSourcePlay(state, controllerId, sourceCardId, event); const { source, def } = sourceAndAbility(state, sourceCardId, ability.id);
  if (!runtime || !trusted || !source || !def || source.controllerPlayerId !== controllerId || !isAcceptedB06EventBurstAbility(ability)) throw new Error('B06_EVENT_BURST_TRIGGER_INVALID');
  const listed = listEventRuleCandidates(state, runtime.pack, ['event_battlefield']);
  const publicTokens: string[] = []; const movedEvents: Array<{ eventCardId: string; locationId: string; ruleInstanceId?: string; victoryPoints: number }> = [];
  for (const [index, placement] of state.eventPlacements.entries()) {
    if (placement.visibility.scope !== 'public') continue;
    if (!Number.isSafeInteger(placement.victoryPoints) || Number(placement.victoryPoints) < 0 || runtime.pack.eventCatalog?.[placement.eventCardId]?.printedReward !== Number(placement.victoryPoints)) {
      throw new Error('B06_EVENT_BURST_EVENT_VP_INVALID');
    }
    const candidate = listed.find((entry) => entry.eventCardId === placement.eventCardId && entry.locationId === placement.locationId &&
      (placement.ruleInstanceId ? entry.ruleInstanceId === placement.ruleInstanceId : entry.token.includes(`:${index}:`)));
    if (!candidate) throw new Error('B06_EVENT_BURST_EVENT_SELECTION_INVALID');
    publicTokens.push(candidate.token);
    movedEvents.push({ eventCardId: placement.eventCardId, locationId: placement.locationId,
      ...(placement.ruleInstanceId ? { ruleInstanceId: placement.ruleInstanceId } : {}), victoryPoints: Number(placement.victoryPoints) });
  }
  const total = movedEvents.reduce((sum, entry) => sum + entry.victoryPoints, 0); const amount = total * 2;
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(amount)) throw new Error('B06_EVENT_BURST_EVENT_VP_INVALID');
  const beforeRevision = runtime.eventRuleZoneRevision;
  if (publicTokens.length) moveEventRuleCandidates(state, runtime.pack, publicTokens, 'event_outside_game');
  const afterRevision = runtime.eventRuleZoneRevision;
  const receipts = runtime.b06EventBurstBonuses ??= [];
  if (receipts.some((entry) => entry.sourceCardId === sourceCardId && entry.rootEventId === event!.id)) throw new Error('B06_EVENT_BURST_DUPLICATE');
  const roots = runtime.b06TrustedEventBurstRoots ??= {};
  const root = { sourceCardId, sourceDefinitionId: source.definitionId, controllerId, abilityId: ability.id, rootEventId: event!.id, round: trusted.round,
    amount, sourceTokens: [...publicTokens], movedEvents: structuredClone(movedEvents), eventRuleZoneRevisionBefore: beforeRevision, eventRuleZoneRevisionAfter: afterRevision };
  const priorRoot = roots[event!.id];
  if (priorRoot && JSON.stringify(priorRoot) !== JSON.stringify(root)) throw new Error('B06_EVENT_BURST_ROOT_COLLISION');
  roots[event!.id] = root;
  const logIndex = state.log.length;
  state.log.push({ type: 'b06_event_burst_resolved', message: event!.id, payload: { rootEventId: event!.id, sourceCardId, controllerId, round: trusted.round,
    amount, sourceTokens: [...publicTokens], movedEvents: structuredClone(movedEvents), eventRuleZoneRevisionBefore: beforeRevision, eventRuleZoneRevisionAfter: afterRevision } });
  receipts.push({ sourceCardId, sourceDefinitionId: source.definitionId, controllerId, abilityId: ability.id, rootEventId: event!.id, round: trusted.round,
    amount, sourceTokens: [...publicTokens], movedEvents, eventRuleZoneRevisionBefore: beforeRevision, eventRuleZoneRevisionAfter: afterRevision, logIndex });
  validateEventBurstState(state);
}

export function b06SourcePowerBonus(state: GameState, sourceCardId: string): number {
  validateEventBurstState(state); const runtime = state.abilityRuntime; if (!runtime) return 0;
  return (runtime.b06EventBurstBonuses ?? []).filter((entry) => entry.sourceCardId === sourceCardId && entry.round === state.round.roundNumber)
    .reduce((sum, entry) => sum + entry.amount, 0);
}
