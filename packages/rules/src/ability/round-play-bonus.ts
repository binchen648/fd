import type { GameState } from '../schema/game';
import type { RuleNode } from './types';

export interface RoundPlayBonus {
  beneficiaryId: string;
  dueRound: number;
  playEventId: string;
  drawn: boolean;
}

export function isRoundPlayBonusEffect(effect: RuleNode): boolean {
  return Object.keys(effect).length === 5 && effect.type === 'schedule_round_bonus' &&
    effect.roundOffset === 1 && effect.after === 'normal_preparation_draw' &&
    effect.drawCards === 2 && effect.extraNormalPlays === 1;
}

export function isCloseActiveControlledCardRequirement(requirement: RuleNode): boolean {
  return Object.keys(requirement).length === 2 && requirement.type === 'close_active_controlled_card' &&
    typeof requirement.cardId === 'string' && requirement.cardId.length > 0;
}

export function dueRoundPlayBonuses(state: GameState, playerId: string): RoundPlayBonus[] {
  return (state.abilityRuntime?.roundPlayBonuses ?? []).filter(entry =>
    entry.beneficiaryId === playerId && entry.dueRound === state.round.roundNumber);
}

export function optionalRoundPlays(state: GameState, playerId: string): number {
  return dueRoundPlayBonuses(state, playerId).filter(entry => entry.drawn).length;
}
