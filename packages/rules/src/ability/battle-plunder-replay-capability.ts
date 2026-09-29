import type { GameState } from '../schema/game';
import type { AuthoringAbility, RuleNode } from './types';

export const BATTLE_COMPETITION_PLUNDER_EFFECT = 'battle_competition_reward_plunder' as const;
export const PLAY_RECORDED_REMOVED_CARD_EFFECT = 'play_recorded_removed_card' as const;

const PRESENT_SOURCE_ZONES = new Set(['skill', 'field', 'attack_area']);

function exactKeys(value: RuleNode, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
function empty(value: RuleNode): boolean { return Object.keys(value).length === 0; }
function safeKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value);
}
function automaticNoHost(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && Array.isArray(ability.execution.allowedOperations) && ability.execution.allowedOperations.length === 0;
}
function standardResponse(ability: AuthoringAbility): boolean {
  return exactKeys(ability.responseWindow, ['order', 'passBehavior']) && ability.responseWindow.order === 'turn_order' &&
    ability.responseWindow.passBehavior === 'decline_this_window';
}
function emptyCommon(ability: AuthoringAbility): boolean {
  return ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && empty(ability.lifecycle) &&
    empty(ability.limit) && automaticNoHost(ability) && standardResponse(ability);
}
function exactReveal(ability: AuthoringAbility): boolean {
  return ability.visibility.revealsTrueName === true && ability.visibility.revealTiming === 'on_use_declared' &&
    ability.visibility.revealScope === 'servant_package' && exactKeys(ability.visibility, ['revealsTrueName', 'revealTiming', 'revealScope']);
}

export function isBattleCompetitionPlunderEffect(value: RuleNode): boolean {
  return value.type === BATTLE_COMPETITION_PLUNDER_EFFECT && safeKey(value.recordKey) &&
    value.competitionReward === 'replace' && value.peekCount === 3 && value.vpCap === 5 &&
    value.removedZone === 'removed_from_game' && value.trigger === 'after_controller_wins_battle' &&
    exactKeys(value, ['type', 'recordKey', 'competitionReward', 'peekCount', 'vpCap', 'removedZone', 'trigger']);
}

export function isPlayRecordedRemovedCardEffect(value: RuleNode): boolean {
  return value.type === PLAY_RECORDED_REMOVED_CARD_EFFECT && safeKey(value.recordKey) &&
    value.sourceZone === 'removed_from_game' && value.minimumManaCost === 2 && value.removeSourceAfterBattle === true &&
    exactKeys(value, ['type', 'recordKey', 'sourceZone', 'minimumManaCost', 'removeSourceAfterBattle']);
}

export function isAcceptedBattleCompetitionPlunderAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'forced_trigger' && exactKeys(ability.activation, ['trigger']) &&
    ability.activation.trigger === 'after_controller_wins_battle' && ability.effects.length === 1 &&
    isBattleCompetitionPlunderEffect(ability.effects[0]!) && emptyCommon(ability) && empty(ability.visibility);
}

export function isAcceptedPlayRecordedRemovedCardAbility(ability: AuthoringAbility): boolean {
  return ability.kind === 'phase_action' && exactKeys(ability.activation, ['phase', 'opens', 'requiresSourceState']) &&
    ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' &&
    ability.activation.requiresSourceState === 'active' && ability.effects.length === 1 &&
    isPlayRecordedRemovedCardEffect(ability.effects[0]!) && emptyCommon(ability) && exactReveal(ability);
}

export function isAcceptedBattlePlunderReplayAbility(ability: AuthoringAbility): boolean {
  return isAcceptedBattleCompetitionPlunderAbility(ability) || isAcceptedPlayRecordedRemovedCardAbility(ability);
}

const privilegedTypes = new Set<string>([BATTLE_COMPETITION_PLUNDER_EFFECT, PLAY_RECORDED_REMOVED_CARD_EFFECT]);
export function containsBattlePlunderReplayPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsBattlePlunderReplayPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const current = value as RuleNode;
  if (privilegedTypes.has(String(current.type))) return true;
  return Object.values(current).some(containsBattlePlunderReplayPrivilegedNode);
}

export function battlePlunderRecordKeyFromAbility(ability: AuthoringAbility): string | undefined {
  if (!isAcceptedBattlePlunderReplayAbility(ability)) return undefined;
  const key = ability.effects[0]?.recordKey;
  return safeKey(key) ? key : undefined;
}
export function isValidBattlePlunderRecordKey(value: unknown): value is string { return safeKey(value); }

export function battlePlunderSourcePresent(state: GameState, sourceCardId: string, controllerId: string): boolean {
  const source = state.cards.find((candidate) => candidate.instanceId === sourceCardId);
  if (!source || source.ownerPlayerId !== controllerId || source.controllerPlayerId !== controllerId || !PRESENT_SOURCE_ZONES.has(source.zone)) return false;
  const sourceState = state.abilityRuntime?.cardState[sourceCardId];
  if (sourceState?.faceDown) return false;
  return source.zone === 'skill' || sourceState?.active === true;
}

export function controllerHasCompetitionRewardPlunderReplacement(state: GameState, controllerId: string): boolean {
  return state.cards.some((source) => {
    if (!battlePlunderSourcePresent(state, source.instanceId, controllerId)) return false;
    const definition = state.abilityRuntime?.pack.cards[source.definitionId];
    return !!definition?.abilities.some(isAcceptedBattleCompetitionPlunderAbility);
  });
}
