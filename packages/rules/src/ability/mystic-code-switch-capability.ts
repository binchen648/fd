import type { GameState } from '../schema/game';

/** Identity-free exclusive outside-game Skill acquisition transaction.
 * Call only after a trusted owner/action-choice authorization. No mutation occurs
 * if the frozen choice set or current zone authority is inconsistent.
 */
/** Non-residual battle attack recovery, resolved from trusted printed face cost. */
export function halfUpPrintedAttackRecovery(
  printedCost: unknown,
  eligibleNonResidualAttack: boolean,
  controllerLostBattle: boolean,
): number | undefined {
  if (!eligibleNonResidualAttack || !controllerLostBattle) return undefined;
  if (typeof printedCost !== 'number' || !Number.isSafeInteger(printedCost) || printedCost < 0) return undefined;
  return Math.ceil(printedCost / 2);
}

/** The four exclusive code modes determine their ascension Power/terrain effects. */
export function codeAscensionModifiers(mode: string | undefined): { power: number; terrainOverride?: 0; basicAttackBonus: number; ignoreEightManaGate: boolean } {
  return mode === 'extella' ? { power: 5, terrainOverride: 0, basicAttackBonus: 0, ignoreEightManaGate: false }
    : mode === 'link' ? { power: 0, basicAttackBonus: 1, ignoreEightManaGate: false }
    : mode === 'extra' ? { power: 0, basicAttackBonus: 0, ignoreEightManaGate: true }
    : { power: 0, basicAttackBonus: 0, ignoreEightManaGate: false };
}

/** Apply an already-authorized code choice through the engine's actual move-card
 * lifecycle hook. Validate the entire plan before invoking any mutation.
 * The caller must run this within the game engine's rollback transaction.
 */
export function applyExclusiveOutsideSkillSwitch(
  state: Pick<GameState, 'cards'>,
  controllerId: string,
  offeredDefinitionIds: readonly string[],
  chosenDefinitionId: string,
  move: (instanceId: string, zone: string) => number,
): boolean {
  const plan = planExclusiveOutsideSkillSwitch(state, controllerId, offeredDefinitionIds, chosenDefinitionId);
  if (!plan || typeof move !== 'function') return false;
  // Retire the existing code before activating the replacement.
  for (const change of plan.filter(item => item.zone !== 'skill')) {
    if (state.cards.find(c => c.instanceId === change.instanceId)?.zone !== change.zone) {
      move(change.instanceId, change.zone);
    }
  }
  for (const change of plan.filter(item => item.zone === 'skill')) {
    if (state.cards.find(c => c.instanceId === change.instanceId)?.zone !== 'skill') {
      move(change.instanceId, 'skill');
    }
  }
  return true;
}

/** Random discard is selected by the trusted game RNG, never a client choice.
 * Returns the exact physical card to discard or undefined for an empty hand.
 * The caller owns RNG progression and rollback.
 */
export function chooseRandomOwnedHandCard(
  cards: readonly { instanceId: string; ownerPlayerId: string; controllerPlayerId: string; zone: string }[],
  controllerId: string,
  randomFraction: number,
): string | undefined {
  if (!Array.isArray(cards) || typeof controllerId !== 'string' || !controllerId ||
      typeof randomFraction !== 'number' || !Number.isFinite(randomFraction) ||
      randomFraction < 0 || randomFraction >= 1 ||
      new Set(cards.map(c=>c.instanceId)).size !== cards.length) return undefined;
  const hand = cards.filter(c=>c.ownerPlayerId===controllerId && c.controllerPlayerId===controllerId && c.zone==='hand');
  return hand[Math.floor(randomFraction*hand.length)]?.instanceId;
}

export function planExclusiveOutsideSkillSwitch(
  state: Pick<GameState, 'cards'>,
  controllerId: string,
  offeredDefinitionIds: readonly string[],
  chosenDefinitionId: string,
): Array<{ instanceId: string; zone: string }> | undefined {
  if (!state || !Array.isArray(state.cards) || typeof controllerId !== 'string' || !controllerId || !Array.isArray(offeredDefinitionIds) ||
      offeredDefinitionIds.length < 2 || offeredDefinitionIds.length > 8 ||
      offeredDefinitionIds.some(id => typeof id !== 'string' || !id) ||
      new Set(offeredDefinitionIds).size !== offeredDefinitionIds.length ||
      !offeredDefinitionIds.includes(chosenDefinitionId)) return undefined;
  const physical = state.cards.filter(c => c.ownerPlayerId === controllerId && offeredDefinitionIds.includes(c.definitionId));
  if (physical.length !== offeredDefinitionIds.length ||
      new Set(physical.map(c => c.definitionId)).size !== offeredDefinitionIds.length ||
      physical.some(c => c.controllerPlayerId !== controllerId || !['removed_from_game', 'skill'].includes(c.zone))) return undefined;
  if (physical.filter(c => c.zone === 'skill').length > 1 ||
      new Set(state.cards.map(c => c.instanceId)).size !== state.cards.length) return undefined;
  return physical.map(c => ({
    instanceId: c.instanceId,
    zone: c.definitionId === chosenDefinitionId ? 'skill' : 'removed_from_game',
  }));
}
