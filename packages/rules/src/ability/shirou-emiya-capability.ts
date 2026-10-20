import type { GameState } from '../schema/game';
import type { AbilityEvent, AuthoringAbility, AuthoringCard, RuleNode } from './types';

export const SHIROU_EMIYA_BASIC_POWER_BONUS_EFFECT = 'shirou_emiya_basic_power_bonus';
export const SHIROU_EMIYA_CLIMAX_POWER_BONUS_EFFECT = 'shirou_emiya_climax_power_bonus';
export const SHIROU_EMIYA_AVALON_EFFECT = 'shirou_emiya_first_elimination_continue';
const AVALON_USED_FLAG = 'shirou_emiya.avalon.first_elimination_used';

function exactKeys(node: RuleNode, keys: readonly string[]): boolean {
  const actual = Object.keys(node).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}
function passiveShell(a: AuthoringAbility): boolean {
  return a.kind === 'passive' && a.activation.trigger === 'while_active' &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 &&
    a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 &&
    a.creates.length === 0 && a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 &&
    Object.keys(a.limit).length === 0 && Object.keys(a.visibility).length === 0;
}
export function isAcceptedShirouEmiyaBasicPowerAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return passiveShell(a) && a.effects.length === 1 && !!e && e.type === SHIROU_EMIYA_BASIC_POWER_BONUS_EFFECT &&
    exactKeys(e, ['type', 'amount', 'attributes']) && e.amount === 2 &&
    Array.isArray(e.attributes) && e.attributes.length === 2 && e.attributes.includes('力量') && e.attributes.includes('迅捷');
}
export function isAcceptedShirouEmiyaClimaxPowerAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return passiveShell(a) && a.effects.length === 1 && !!e && e.type === SHIROU_EMIYA_CLIMAX_POWER_BONUS_EFFECT &&
    exactKeys(e, ['type', 'amount']) && e.amount === 4;
}
export function isAcceptedShirouEmiyaAvalonAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return a.kind === 'forced_trigger' && a.activation.trigger === 'after_battle_result_determined' &&
    a.execution.mode === 'automatic' && a.execution.allowedOperations.length === 0 &&
    a.conditions.length === 0 && a.targets.length === 0 && a.cost.length === 0 && a.creates.length === 0 &&
    a.ruleModifiers.length === 0 && Object.keys(a.lifecycle).length === 0 && Object.keys(a.limit).length === 0 &&
    Object.keys(a.visibility).length === 0 && Object.keys(a.responseWindow).every((key) => ['order', 'passBehavior'].includes(key)) &&
    (a.responseWindow.order === undefined || a.responseWindow.order === 'turn_order') &&
    (a.responseWindow.passBehavior === undefined || a.responseWindow.passBehavior === 'decline_this_window') && a.effects.length === 1 &&
    !!e && e.type === SHIROU_EMIYA_AVALON_EFFECT && exactKeys(e, ['type']);
}
export function containsShirouEmiyaPrivilegedNode(a: AuthoringAbility): boolean {
  return [...a.effects, ...a.creates, ...a.ruleModifiers].some((node) =>
    [SHIROU_EMIYA_BASIC_POWER_BONUS_EFFECT, SHIROU_EMIYA_CLIMAX_POWER_BONUS_EFFECT, SHIROU_EMIYA_AVALON_EFFECT].includes(String(node.type)));
}
export function isAcceptedShirouEmiyaAbility(a: AuthoringAbility): boolean {
  return isAcceptedShirouEmiyaBasicPowerAbility(a) || isAcceptedShirouEmiyaClimaxPowerAbility(a) || isAcceptedShirouEmiyaAvalonAbility(a);
}

function sourceHasEffect(s: GameState, playerId: string, effectType: string, predicate?: (a: AuthoringAbility) => boolean): boolean {
  const controller = s.players.find((candidate) => candidate.id === playerId);
  return s.cards.some((physical) => physical.ownerPlayerId === playerId && physical.controllerPlayerId === playerId && physical.zone === 'skill' &&
    s.abilityRuntime?.pack.cards[physical.definitionId]?.cardType === 'master_skill' &&
    ownerMatchesController(s, physical.definitionId, controller?.masterCardId) &&
    (s.abilityRuntime?.pack.cards[physical.definitionId]?.abilities ?? []).some((a) => a.effects.some((effect) => effect.type === effectType) && (!predicate || predicate(a))));
}
function ownerMatchesController(s: GameState, definitionId: string, masterCardId: string | undefined): boolean {
  if (!masterCardId) return false;
  const ownerId = (s.abilityRuntime?.pack.cards[definitionId] as (AuthoringCard & { ownerId?: string }) | undefined)?.ownerId;
  return ownerId === masterCardId || (ownerId === undefined && definitionId.startsWith(`${masterCardId}.skill.`));
}
export function shirouEmiyaPowerBonus(s: GameState, sourceCardId: string): { basic: number; climax: number } {
  if (!s.abilityRuntime) return { basic: 0, climax: 0 };
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  const d = source ? s.abilityRuntime.pack.cards[source.definitionId] : undefined;
  if (!source || !d || (d as AuthoringCard & { playKind?: string }).playKind !== 'attack') return { basic: 0, climax: 0 };
  const attrs = Array.isArray(d.cardFace.attributes) ? d.cardFace.attributes : [];
  const basic = d.cardType === 'basic_attack' && attrs.some((a) => a === '力量' || a === '迅捷') &&
    sourceHasEffect(s, source.controllerPlayerId, SHIROU_EMIYA_BASIC_POWER_BONUS_EFFECT, isAcceptedShirouEmiyaBasicPowerAbility) ? 2 : 0;
  const currentSituationIsClimax = (s as unknown as { modeState?: { currentSituationIsClimax?: boolean } }).modeState?.currentSituationIsClimax;
  const climax = ((typeof currentSituationIsClimax === 'boolean' ? currentSituationIsClimax : s.round.roundNumber >= 9)) &&
    sourceHasEffect(s, source.controllerPlayerId, SHIROU_EMIYA_CLIMAX_POWER_BONUS_EFFECT, isAcceptedShirouEmiyaClimaxPowerAbility) ? 4 : 0;
  return { basic, climax };
}
export function canExecuteShirouEmiyaAvalon(s: GameState, sourceCardId: string, controllerId: string, event?: AbilityEvent): boolean {
  const source = s.cards.find((candidate) => candidate.instanceId === sourceCardId);
  const p = s.players.find((candidate) => candidate.id === controllerId);
  const flags = s.abilityRuntime?.structuredPlayerFlagsByPlayer?.[controllerId];
  const battleElimination = event?.type === 'after_battle_result_determined' &&
    event.battleParticipantIds?.includes(controllerId) === true && event.battleResult?.loserIds.includes(controllerId) === true;
  const linkedAuxiliaryElimination = event?.type === 'player_eliminated_by_linked_auxiliary_upkeep' &&
    event.playerId === controllerId && typeof event.sourceCardId === 'string' && typeof event.abilityId === 'string';
  return !!source && !!p && ownerMatchesController(s, source.definitionId, p.masterCardId) && source.ownerPlayerId === controllerId && source.controllerPlayerId === controllerId && source.zone === 'skill' &&
    p.status === 'eliminated' && (battleElimination || linkedAuxiliaryElimination) && flags?.[AVALON_USED_FLAG] !== true;
}
export function resolveShirouEmiyaAvalon(s: GameState, sourceCardId: string, abilityId: string, controllerId: string, event?: AbilityEvent): void {
  if (!s.abilityRuntime || !canExecuteShirouEmiyaAvalon(s, sourceCardId, controllerId, event)) throw new Error('Avalon requires the first authoritative elimination event');
  const p = s.players.find((candidate) => candidate.id === controllerId)!;
  const before = p.mana;
  p.mana = 0;
  p.status = 'active';
  if (p.militaryResult <= -9) p.militaryResult = -8;
  delete p.eliminationOrder;
  (s.abilityRuntime.structuredPlayerFlagsByPlayer ??= {})[controllerId] = { ...(s.abilityRuntime.structuredPlayerFlagsByPlayer?.[controllerId] ?? {}), [AVALON_USED_FLAG]: true };
  s.abilityRuntime.events.push({ type: 'shirou_emiya_avalon_continued', playerId: controllerId, sourceCardId, abilityId, resource: 'mana', before, after: 0, delta: -before });
}
