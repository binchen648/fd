import type { GameState } from '../schema/game';
import type { RuleNode } from './types';

export const M50_EFFECT_INSTALLED_MANA_SPENDING_FORBID_POLICY = 'm50-effect-installed-mana-spending-forbid-v1';
export const M50_EFFECT_INSTALLED_COMBAT_SETTLEMENT_POLICY = 'm50-effect-installed-combat-settlement-v1';

function record(value: unknown): RuleNode {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RuleNode : {};
}
function exactKeys(value: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

/** Exact Reference envelope for an effect-installed, this-round mana-spending prohibition. */
export function isAcceptedEffectInstalledControllerManaSpendingForbidModifier(modifier: RuleNode): boolean {
  if (!exactKeys(modifier, ['id', 'printedClause', 'installation', 'operation', 'rule', 'scope', 'lifecycle'])) return false;
  const scope = record(modifier.scope);
  const lifecycle = record(modifier.lifecycle);
  return typeof modifier.id === 'string' && modifier.id.length > 0 &&
    (modifier.printedClause === undefined || typeof modifier.printedClause === 'string') &&
    modifier.installation === 'effect' && modifier.operation === 'forbid' && modifier.rule === 'mana_spending' &&
    exactKeys(scope, ['subject']) && scope.subject === 'controller' &&
    exactKeys(lifecycle, ['duration']) && lifecycle.duration === 'this_round';
}

export type M50CombatSettlementRule = 'defeat' | 'combat_winner_inclusion' | 'combat_reward_distribution';

/** Exact Reference envelopes for effect-installed combat-settlement rules. */
export function isAcceptedEffectInstalledCombatSettlementModifier(modifier: RuleNode): boolean {
  if (!exactKeys(modifier, ['id', 'printedClause', 'installation', 'operation', 'rule', 'scope', 'lifecycle'])) return false;
  if (typeof modifier.id !== 'string' || modifier.id.length === 0 ||
      (modifier.printedClause !== undefined && typeof modifier.printedClause !== 'string') || modifier.installation !== 'effect') return false;
  const scope = record(modifier.scope);
  const lifecycle = record(modifier.lifecycle);
  if (!exactKeys(lifecycle, ['duration', 'cleanup']) || lifecycle.duration !== 'this_round' || lifecycle.cleanup !== 'remain_active') return false;
  if (modifier.rule === 'defeat') return modifier.operation === 'ignore' && exactKeys(scope, ['subject']) && scope.subject === 'controller';
  if (modifier.rule === 'combat_winner_inclusion') return modifier.operation === 'allow' && exactKeys(scope, ['subject']) && scope.subject === 'controller';
  if (modifier.rule === 'combat_reward_distribution') {
    return modifier.operation === 'replace' && exactKeys(scope, ['subject', 'whenControllerWins', 'mode']) &&
      scope.subject === 'controller' && scope.whenControllerWins === true && scope.mode === 'full_reward_each';
  }
  return false;
}

export function isAcceptedEffectInstalledCombatSettlementBundle(modifiers: RuleNode[]): boolean {
  if (modifiers.length !== 3 || !modifiers.every(isAcceptedEffectInstalledCombatSettlementModifier)) return false;
  const rules = modifiers.map((modifier) => String(modifier.rule)).sort();
  return JSON.stringify(rules) === JSON.stringify(['combat_reward_distribution', 'combat_winner_inclusion', 'defeat']);
}

function exactCombatSettlementReceipt(state: GameState, playerId: string): RuleNode[] {
  const runtime = state.abilityRuntime;
  if (!runtime) return [];
  const rules: RuleNode[] = [];
  for (const ongoing of runtime.ongoingEffects) {
    if (ongoing.policyKey !== M50_EFFECT_INSTALLED_COMBAT_SETTLEMENT_POLICY) continue;
    if (ongoing.starts !== 'immediate' || ongoing.duration !== 'this_round' || ongoing.cleanup !== 'remain_active' ||
        ongoing.sourceMustRemainActive !== false || ongoing.startRound !== state.round.roundNumber ||
        ongoing.expiresAtRound !== ongoing.startRound + 1 || ongoing.publicZones.length !== 0 || ongoing.ruleModifiers.length !== 3) {
      throw new Error('M50_COMBAT_SETTLEMENT_ONGOING_INVALID');
    }
    const seen = new Set<string>();
    for (const installed of ongoing.ruleModifiers) {
      if (installed.sourceCardId !== ongoing.sourceCardId || installed.controllerId !== ongoing.controllerId) {
        throw new Error('M50_COMBAT_SETTLEMENT_PROVENANCE_INVALID');
      }
      const modifier = record(installed.definition);
      const scope = record(modifier.scope);
      const rule = String(modifier.rule);
      if (!['defeat', 'combat_winner_inclusion', 'combat_reward_distribution'].includes(rule) || seen.has(rule) ||
          typeof modifier.id !== 'string' || modifier.id.length === 0 || scope.subject !== 'selected_player' ||
          typeof scope.playerId !== 'string' || scope.playerId !== ongoing.controllerId ||
          !exactKeys(scope, rule === 'combat_reward_distribution' ? ['subject', 'playerId', 'whenControllerWins', 'mode'] : ['subject', 'playerId'])) {
        throw new Error('M50_COMBAT_SETTLEMENT_MODIFIER_INVALID');
      }
      if (rule === 'defeat' && modifier.operation !== 'ignore') throw new Error('M50_COMBAT_SETTLEMENT_MODIFIER_INVALID');
      if (rule === 'combat_winner_inclusion' && modifier.operation !== 'allow') throw new Error('M50_COMBAT_SETTLEMENT_MODIFIER_INVALID');
      if (rule === 'combat_reward_distribution' &&
          (modifier.operation !== 'replace' || scope.whenControllerWins !== true || scope.mode !== 'full_reward_each')) {
        throw new Error('M50_COMBAT_SETTLEMENT_MODIFIER_INVALID');
      }
      seen.add(rule);
      if (ongoing.controllerId === playerId) rules.push(modifier);
    }
    if (seen.size !== 3) throw new Error('M50_COMBAT_SETTLEMENT_MODIFIER_INVALID');
  }
  return rules;
}

export function m50EffectInstalledCombatDefeatIgnored(state: GameState, playerId: string): boolean {
  return exactCombatSettlementReceipt(state, playerId).some((modifier) => modifier.rule === 'defeat' && modifier.operation === 'ignore');
}

export function m50EffectInstalledCombatWinnerIncluded(state: GameState, playerId: string): boolean {
  return exactCombatSettlementReceipt(state, playerId).some((modifier) => modifier.rule === 'combat_winner_inclusion' && modifier.operation === 'allow');
}

export function m50EffectInstalledFullRewardEach(state: GameState, winnerIds: string[]): boolean {
  return winnerIds.some((playerId) => exactCombatSettlementReceipt(state, playerId).some((modifier) =>
    modifier.rule === 'combat_reward_distribution' && modifier.operation === 'replace'));
}

/** Server-owned ongoing receipt boundary for voluntary positive mana spending. */
export function m50ManaSpendingForbidden(state: GameState, playerId: string): boolean {
  const runtime = state.abilityRuntime;
  if (!runtime) return false;
  for (const ongoing of runtime.ongoingEffects) {
    if (ongoing.policyKey !== M50_EFFECT_INSTALLED_MANA_SPENDING_FORBID_POLICY) continue;
    if (ongoing.starts !== 'immediate' || ongoing.duration !== 'this_round' || ongoing.cleanup !== 'expire_after_duration' ||
        ongoing.sourceMustRemainActive !== false || ongoing.startRound !== state.round.roundNumber ||
        ongoing.expiresAtRound !== ongoing.startRound + 1 || ongoing.publicZones.length !== 0 || ongoing.ruleModifiers.length !== 1) {
      throw new Error('M50_MANA_SPENDING_FORBID_ONGOING_INVALID');
    }
    const installed = ongoing.ruleModifiers[0]!;
    const modifier = record(installed.definition);
    const scope = record(modifier.scope);
    if (installed.sourceCardId !== ongoing.sourceCardId || installed.controllerId !== ongoing.controllerId ||
        !exactKeys(modifier, ['id', 'operation', 'rule', 'scope']) || modifier.operation !== 'forbid' || modifier.rule !== 'mana_spending' ||
        !exactKeys(scope, ['subject', 'playerId']) || scope.subject !== 'selected_player' || typeof scope.playerId !== 'string') {
      throw new Error('M50_MANA_SPENDING_FORBID_MODIFIER_INVALID');
    }
    if (scope.playerId === playerId) return true;
  }
  return false;
}
