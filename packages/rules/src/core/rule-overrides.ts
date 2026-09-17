import type { GameState, PhaseName } from '../schema/game';
import type { RuleNode } from '../ability/types';

export type GameStartRuleOverrideName =
  | 'first_logical_day_total_power_adjustment'
  | 'non_climax_situation_mana_gain_cap'
  | 'lock_controller_movement_in_own_action_and_combat'
  | 'round_total_mana_gain_cap'
  | 'total_power_adjustment_if_other_battle_participant_lower_vp'
  | 'controller_master_skill_power_lock_if_situation_forbids'
  | 'command_spell_phase_override'
  | 'view_opponent_discard'
  | 'extra_attack_play_allowance_if_mana_at_least'
  | 'view_face_down_events'
  | 'ignore_situation_play_forbid_attribute';

function keysAre(node: RuleNode, keys: string[]): boolean {
  const actual = Object.keys(node).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

export function isExactGameStartRuleOverrideEffect(effect: RuleNode | undefined): boolean {
  if (!effect || effect.type !== 'install_rule_override' || effect.player !== 'controller' || typeof effect.rule !== 'string') return false;
  switch (effect.rule as GameStartRuleOverrideName) {
    case 'first_logical_day_total_power_adjustment':
    case 'total_power_adjustment_if_other_battle_participant_lower_vp':
      return effect.value === -2 && keysAre(effect, ['type', 'player', 'rule', 'value']);
    case 'non_climax_situation_mana_gain_cap':
      return effect.value === 1 && keysAre(effect, ['type', 'player', 'rule', 'value']);
    case 'lock_controller_movement_in_own_action_and_combat':
    case 'view_opponent_discard':
    case 'view_face_down_events':
      return effect.enabled === true && keysAre(effect, ['type', 'player', 'rule', 'enabled']);
    case 'round_total_mana_gain_cap':
      return effect.regular === 2 && effect.climax === 4 && keysAre(effect, ['type', 'player', 'rule', 'regular', 'climax']);
    case 'controller_master_skill_power_lock_if_situation_forbids':
      return effect.attribute === '宝具' && effect.value === 0 && keysAre(effect, ['type', 'player', 'rule', 'attribute', 'value']);
    case 'command_spell_phase_override':
      return effect.phase === 'advance' && keysAre(effect, ['type', 'player', 'rule', 'phase']);
    case 'extra_attack_play_allowance_if_mana_at_least':
      return effect.threshold === 11 && effect.amount === 1 && keysAre(effect, ['type', 'player', 'rule', 'threshold', 'amount']);
    case 'ignore_situation_play_forbid_attribute':
      return effect.attribute === '宝具' && keysAre(effect, ['type', 'player', 'rule', 'attribute']);
    default:
      return false;
  }
}

function addUnique(list: string[] | undefined, playerId: string): string[] {
  return [...new Set([...(list ?? []), playerId])];
}
function mapSet<T>(map: Record<string, T> | undefined, playerId: string, value: T): Record<string, T> {
  return { ...(map ?? {}), [playerId]: value };
}

export function installGameStartRuleOverride(state: GameState, controllerId: string, effect: RuleNode): void {
  if (!isExactGameStartRuleOverrideEffect(effect)) throw new Error('Unsupported game-start rule override shape.');
  const overrides = state.ruleOverrides ??= {};
  switch (effect.rule as GameStartRuleOverrideName) {
    case 'first_logical_day_total_power_adjustment':
      overrides.firstLogicalDayTotalPowerAdjustmentByPlayer = mapSet(overrides.firstLogicalDayTotalPowerAdjustmentByPlayer, controllerId, -2); break;
    case 'non_climax_situation_mana_gain_cap':
      overrides.nonClimaxSituationManaGainCapByPlayer = mapSet(overrides.nonClimaxSituationManaGainCapByPlayer, controllerId, 1); break;
    case 'lock_controller_movement_in_own_action_and_combat':
      overrides.movementLockedOwnActionCombatPlayerIds = addUnique(overrides.movementLockedOwnActionCombatPlayerIds, controllerId); break;
    case 'round_total_mana_gain_cap':
      overrides.roundTotalManaGainCapByPlayer = mapSet(overrides.roundTotalManaGainCapByPlayer, controllerId, { regular: 2, climax: 4 }); break;
    case 'total_power_adjustment_if_other_battle_participant_lower_vp':
      overrides.lowerVpBattleTotalPowerAdjustmentByPlayer = mapSet(overrides.lowerVpBattleTotalPowerAdjustmentByPlayer, controllerId, -2); break;
    case 'controller_master_skill_power_lock_if_situation_forbids':
      overrides.masterSkillPowerLockIfSituationForbidsByPlayer = mapSet(overrides.masterSkillPowerLockIfSituationForbidsByPlayer, controllerId, { attribute: '宝具', value: 0 }); break;
    case 'command_spell_phase_override':
      overrides.commandSpellPhaseOverrideByPlayer = mapSet(overrides.commandSpellPhaseOverrideByPlayer, controllerId, 'advance'); break;
    case 'view_opponent_discard':
      overrides.viewOpponentDiscardPlayerIds = addUnique(overrides.viewOpponentDiscardPlayerIds, controllerId); break;
    case 'extra_attack_play_allowance_if_mana_at_least':
      overrides.extraAttackPlayAllowanceByManaByPlayer = mapSet(overrides.extraAttackPlayAllowanceByManaByPlayer, controllerId, { threshold: 11, amount: 1 }); break;
    case 'view_face_down_events':
      overrides.viewFaceDownEventsPlayerIds = addUnique(overrides.viewFaceDownEventsPlayerIds, controllerId); break;
    case 'ignore_situation_play_forbid_attribute': {
      const prior = overrides.ignoreSituationPlayForbidAttributesByPlayer?.[controllerId] ?? [];
      overrides.ignoreSituationPlayForbidAttributesByPlayer = mapSet(overrides.ignoreSituationPlayForbidAttributesByPlayer, controllerId, [...new Set([...prior, '宝具'])]);
      break;
    }
  }
}

export function logicalDayForPlayer(state: GameState, playerId: string): number {
  const value = state.ruleOverrides?.logicalDayByPlayer?.[playerId];
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : state.round.roundNumber;
}

export function movementLockedByPersistentRule(state: GameState, playerId: string): boolean {
  return state.ruleOverrides?.movementLockedOwnActionCombatPlayerIds?.includes(playerId) === true &&
    ['action', 'battle'].includes(state.round.activePhase);
}

export function commandSpellPhaseOverride(state: GameState, playerId: string): PhaseName | undefined {
  return state.ruleOverrides?.commandSpellPhaseOverrideByPlayer?.[playerId];
}

export function persistentExtraAttackAllowance(state: GameState, playerId: string): number {
  const rule = state.ruleOverrides?.extraAttackPlayAllowanceByManaByPlayer?.[playerId];
  const mana = state.players.find((player) => player.id === playerId)?.mana ?? 0;
  return rule && mana >= rule.threshold ? rule.amount : 0;
}

export function ignoresSituationPlayForbid(state: GameState, playerId: string, attribute: string): boolean {
  return state.ruleOverrides?.ignoreSituationPlayForbidAttributesByPlayer?.[playerId]?.includes(attribute) === true;
}

export function canViewFaceDownEvents(state: GameState, viewerId: string): boolean {
  return state.ruleOverrides?.viewFaceDownEventsPlayerIds?.includes(viewerId) === true;
}
export function canViewOpponentDiscard(state: GameState, viewerId: string): boolean {
  return state.ruleOverrides?.viewOpponentDiscardPlayerIds?.includes(viewerId) === true;
}

export interface ManaGrantOptions {
  source?: 'generic' | 'situation' | 'deployment' | 'event';
  isClimaxSituation?: boolean;
  bypassRoundGainCap?: boolean;
}
export interface ManaGrantResult {
  requestedAmount: number;
  cappedRequestAmount: number;
  actualAmount: number;
  overflowAmount: number;
  before: number;
  after: number;
}

function isClimaxRound(state: GameState, explicit: boolean | undefined): boolean {
  if (explicit !== undefined) return explicit;
  const mode = state as unknown as { modeState?: { currentSituationIsClimax?: unknown } };
  if (typeof mode.modeState?.currentSituationIsClimax === 'boolean') return mode.modeState.currentSituationIsClimax;
  return state.round.roundNumber >= 9;
}

export function grantMana(state: GameState, playerId: string, requestedAmount: number, options: ManaGrantOptions = {}): ManaGrantResult {
  if (!Number.isSafeInteger(requestedAmount) || requestedAmount < 0) throw new Error('Mana grant must be a nonnegative safe integer.');
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error(`Unknown mana recipient: ${playerId}`);
  const before = player.mana;
  let cappedRequestAmount = requestedAmount;
  const overrides = state.ruleOverrides;
  const climax = isClimaxRound(state, options.isClimaxSituation);
  if (options.source === 'situation' && !climax) {
    const cap = overrides?.nonClimaxSituationManaGainCapByPlayer?.[playerId];
    if (Number.isSafeInteger(cap) && Number(cap) >= 0) cappedRequestAmount = Math.min(cappedRequestAmount, Number(cap));
  }
  const runtime = state.abilityRuntime;
  if (runtime && !options.bypassRoundGainCap) {
    const ledger = runtime.manaGainedThisRound;
    if (ledger.round !== state.round.roundNumber) {
      ledger.round = state.round.roundNumber;
      ledger.byPlayer = {};
    }
    const rule = overrides?.roundTotalManaGainCapByPlayer?.[playerId];
    if (rule) {
      const limit = climax ? rule.climax : rule.regular;
      const remaining = Math.max(0, limit - (ledger.byPlayer[playerId] ?? 0));
      cappedRequestAmount = Math.min(cappedRequestAmount, remaining);
    }
  }
  const storageCap = runtime?.manaCaps[playerId] ?? 12;
  const blocked = runtime?.manaGainBlocked.includes(playerId) === true;
  const after = blocked ? before : Math.min(storageCap, before + cappedRequestAmount);
  player.mana = after;
  const actualAmount = after - before;
  if (runtime && actualAmount > 0) {
    const ledger = runtime.manaGainedThisRound;
    if (ledger.round !== state.round.roundNumber) { ledger.round = state.round.roundNumber; ledger.byPlayer = {}; }
    ledger.byPlayer[playerId] = (ledger.byPlayer[playerId] ?? 0) + actualAmount;
  }
  return { requestedAmount, cappedRequestAmount, actualAmount, overflowAmount: requestedAmount - actualAmount, before, after };
}

export function resetManaGainLedgerForRound(state: GameState, round: number): void {
  if (state.abilityRuntime) state.abilityRuntime.manaGainedThisRound = { round, byPlayer: {} };
}

export function situationForbidsAttribute(state: GameState, attribute: string): boolean {
  const store = state as unknown as { modeState?: { cardPlayForbids?: Array<{ sourceType?: string; attribute?: string }> } };
  return Array.isArray(store.modeState?.cardPlayForbids) && store.modeState!.cardPlayForbids!.some((entry) => entry.sourceType === 'situation' && entry.attribute === attribute);
}
