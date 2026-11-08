import { describe, expect, it } from 'vitest';
import type { AbilityCommand } from '../../src/ability/types';
import { deriveBattleParticipantsFromState } from '../../src/core/combat-resolver';
import { AUTOMATIC_EVENT_EFFECTS, createMatchSession } from '../../src/match-session';
import { humans } from './seven-roster-test-helpers';

const resistance = 'event.waxing_moon_ritual.resistance';

describe('Resistance remains host-adjudicated', () => {
  it.each(['action', 'battle'] as const)('rejects an injected participation toggle during %s', phase => {
    const session = createMatchSession({ seed: 20260907, humanPlayerIds: humans });
    const [first, second] = session.state.players;
    first!.locationId = second!.locationId = 'miyama_town';
    session.state.round.activePhase = phase;
    session.state.round.prioritySeat = first!.seat;
    session.state.eventPlacements = [{ locationId: 'miyama_town', eventCardId: resistance, visibility: { scope: 'public' }, battleModifiers: [] }];
    const modeState = (session.state as unknown as { modeState: Record<string, unknown> }).modeState;
    modeState.participationEvents = [{ locationId: 'miyama_town', sourceId: resistance }];
    const command = { type: 'declare_battle_participation', participate: false } as unknown as AbilityCommand;
    const before = structuredClone(session.state);

    expect(session.dispatchPlayerAction(second!.id, command).ok).toBe(false);
    expect(session.state).toEqual(before);
    expect(session.getPlayerView(second!.id)).not.toHaveProperty('battleParticipation');

    // A checkpoint from an older candidate may contain an unvalidated decline.
    modeState.battleParticipation = { round: session.state.round.roundNumber, declines: [second!.id] };
    expect(deriveBattleParticipantsFromState(session.state, 'miyama_town').map(p => p.playerId)).toContain(second!.id);
  });

  it.each([
    'battle_participation_choice_at_action_end',
    'cap_non_highest_base_power_active_attacks_at_printed_power',
    'battle_result_rank_power_bonus',
    'grant_terrain_to_first_entry_each_other_player',
    'block_entry_for_other_players',
    'winner_only_strips_other_participants_round_rewards',
  ])('keeps %s on the existing host review path until the printed behavior can be enforced', effect => {
    expect(AUTOMATIC_EVENT_EFFECTS.has(effect)).toBe(false);
  });
});
