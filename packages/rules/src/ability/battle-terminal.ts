import type { GameState } from '../schema/game';
import type { AbilityEvent, PlayerId } from './types';
import { processAbilityEvent } from './interpreter';

export interface BattleTerminalSeed {
  battlePhaseResolutionId: string;
  battleIds: string[];
  resultIds: string[];
  scoringReceiptIds: string[];
  battleParticipantIds: PlayerId[];
  battleOutcomes: Array<{ battlefieldId: string; participantPlayerIds: PlayerId[]; winnerPlayerIds: PlayerId[] }>;
}

function stableUnique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function buildBattleTerminalEvent(seed: BattleTerminalSeed): AbilityEvent {
  return {
    id: `${seed.battlePhaseResolutionId}:after_battle_ended`,
    type: 'after_battle_ended',
    battlePhaseResolutionId: seed.battlePhaseResolutionId,
    battleIds: [...seed.battleIds],
    resultIds: [...seed.resultIds],
    scoringReceiptIds: [...seed.scoringReceiptIds],
    battleParticipantIds: stableUnique(seed.battleParticipantIds),
    battleOutcomes: seed.battleOutcomes.map((outcome) => ({
      battlefieldId: outcome.battlefieldId,
      participantPlayerIds: stableUnique(outcome.participantPlayerIds),
      winnerPlayerIds: stableUnique(outcome.winnerPlayerIds),
    })),
  };
}

export function stageBattleTerminalEvent(state: GameState, seed: BattleTerminalSeed): AbilityEvent | undefined {
  const runtime = state.abilityRuntime;
  if (!runtime) return undefined;
  const event = buildBattleTerminalEvent(seed);
  if (runtime.processedEvents.includes(event.id)) {
    if (runtime.pendingBattleTerminalEvent?.id === event.id) delete runtime.pendingBattleTerminalEvent;
    return undefined;
  }
  if (runtime.pendingBattleTerminalEvent && runtime.pendingBattleTerminalEvent.id !== event.id) {
    throw new Error('A different battle terminal event is already pending');
  }
  runtime.pendingBattleTerminalEvent = event;
  return event;
}

export function flushBattleTerminalEvent(state: GameState): AbilityEvent | undefined {
  const runtime = state.abilityRuntime;
  const event = runtime?.pendingBattleTerminalEvent;
  if (!runtime || !event) return undefined;
  if (runtime.pendingPostBattleEvents?.length || runtime.pendingDecision || runtime.responseWindows.length || runtime.hostRequests.length) {
    return undefined;
  }
  processAbilityEvent(state, structuredClone(event));
  if (state.abilityRuntime?.processedEvents.includes(event.id)) delete state.abilityRuntime.pendingBattleTerminalEvent;
  return event;
}
