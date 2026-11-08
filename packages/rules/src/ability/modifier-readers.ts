/**
 * FD-CANONICAL-EFFECT-IR: explicit reader registry for every rule modifier.
 * A rule may only stay in the loader whitelist if it names at least one reader here,
 * and the reader contract test verifies the file/symbol really exists.
 */
export interface RuleReaderRef {
  file: string;
  symbol: string;
}

export const ruleReaders: Record<string, RuleReaderRef[]> = {
  'attack.currentPower': [{ file: 'ability/interpreter.ts', symbol: 'calculateCardPower' }],
  'card.currentPower': [{ file: 'ability/interpreter.ts', symbol: 'calculateCardPower' }],
  'battle.totalPower': [{ file: 'core/combat-resolver.ts', symbol: 'getTotalPowerBreakdowns' }],
  'effect_prevention': [{ file: 'ability/interpreter.ts', symbol: 'resolveEffect' }],
  'use_skill_card': [{ file: 'ability/interpreter.ts', symbol: 'ongoingCardPlayForbidRules' }],
  'play_card_attribute': [{ file: 'ability/interpreter.ts', symbol: 'ongoingCardPlayForbidRules' }],
  'situation_restrictions': [{ file: 'ability/interpreter.ts', symbol: 'ongoingCardPlayForbidRules' }],
  'situation_play_forbid': [{ file: 'ability/interpreter.ts', symbol: 'ongoingCardPlayForbidRules' }],
  'enter_or_leave_current_battlefield': [{ file: 'ability/interpreter.ts', symbol: 'lockedBattlefieldIdsForMovement' }],
  'terrain_and_external_servant_or_npc_effects': [{ file: 'core/terrain-advantage.ts', symbol: 'isTerrainSuppressedByAuthoredDuel' }],
  'skill_zone_mana_requirement': [{ file: 'ability/interpreter.ts', symbol: 'hasPlayRuleException' }],
  'skill_zone_mana_at_least': [{ file: 'ability/interpreter.ts', symbol: 'condition' }],
  'netherworld_protection': [{ file: 'core/combat-resolver.ts', symbol: 'reverseSituationAndEventIfNeeded' }],
  'command_spell_phase': [{ file: 'ability/interpreter.ts', symbol: 'effectiveActivationPhase' }],
  'opponent_ability_effects': [{ file: 'ability/interpreter.ts', symbol: 'isProtectedFromOpponentEffects' }],
  'movement.reverse_arrows': [{ file: 'ability/interpreter.ts', symbol: 'hasReverseArrowMovement' }],
  'deployment.requirement': [{ file: 'match-session.ts', symbol: 'structuralDeploymentReplacementLocations' }],
  'immune_to_defeat': [{ file: 'phases/battle-phase.ts', symbol: 'applyDefeatStatus' }],
  'terrain.multiplier': [{ file: 'core/terrain-advantage.ts', symbol: 'hasRemoteOperationBonus' }],
  'battle.winVpBonus': [{ file: 'core/combat-resolver.ts', symbol: 'declaredWinVpBonus' }],
};
