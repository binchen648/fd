import type { AuthoringAbility, RuleNode } from './types';
import type { GameState } from '../schema/game';

/** Authenticated runtime markers for the four canonical master.sieg clauses. */
export const SIEG_GALVANISM_EFFECT = 'sieg_galvanism' as const;
export const SIEG_SYNC_STRENGTH_EFFECT = 'sieg_sync_strength' as const;
export const SIEG_DRAGON_COMMAND_EFFECT = 'sieg_dragon_command' as const;
export const SIEG_BALMUNG_FREE_PLAY_EFFECT = 'sieg_balmung_free_play' as const;
export const SIEG_BALMUNG_PENALTY_EFFECT = 'sieg_balmung_penalty' as const;

const privileged = new Set<string>([
  SIEG_GALVANISM_EFFECT, SIEG_SYNC_STRENGTH_EFFECT, SIEG_DRAGON_COMMAND_EFFECT,
  SIEG_BALMUNG_FREE_PLAY_EFFECT, SIEG_BALMUNG_PENALTY_EFFECT,
]);
const str = (value: unknown): string => typeof value === 'string' ? value : '';
const nodes = (value: unknown): RuleNode[] => Array.isArray(value) ? value.filter((v): v is RuleNode => !!v && typeof v === 'object' && !Array.isArray(v)) : [];
const exact = (value: RuleNode, keys: readonly string[]) => Object.keys(value).every((key) => keys.includes(key));

function walk(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(walk);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.type === 'string' && privileged.has(record.type)) return true;
  return Object.values(record).some(walk);
}

export function containsSiegPrivilegedNode(value: unknown): boolean { return walk(value); }
export function isSiegGalvanismAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return a.kind === 'residual' && a.activation.trigger === 'after_player_spends_mana' &&
    a.effects.length === 1 && e?.type === SIEG_GALVANISM_EFFECT &&
    exact(e, ['type', 'minimumSpent', 'restoreCommandSeals']) && e.minimumSpent === 4 && e.restoreCommandSeals === 1;
}
export function isSiegSyncStrengthAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return a.kind === 'passive' && a.activation.trigger === 'while_active' &&
    a.effects.length === 1 && e?.type === SIEG_SYNC_STRENGTH_EFFECT &&
    exact(e, ['type', 'attribute', 'amount']) && e.attribute === '力量' && e.amount === 3;
}
export function isSiegDragonCommandAbility(a: AuthoringAbility): boolean {
  const e = a.effects[2];
  return a.kind === 'phase_action' && a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    a.effects.length === 3 && a.effects[0]?.type === 'adjust_command_seals' && a.effects[0]?.amount === -1 && a.effects[0]?.directive === 'spend_command_spell' &&
    a.effects[1]?.type === 'adjust_mana' && a.effects[1]?.amount === 2 && e?.type === SIEG_DRAGON_COMMAND_EFFECT &&
    exact(e, ['type', 'temporaryDefinitionId']) && e.temporaryDefinitionId === 'master.sieg.skill.s2';
}
export function isSiegBalmungFreePlayAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return a.kind === 'phase_action' && a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    a.effects.length === 1 && e?.type === SIEG_BALMUNG_FREE_PLAY_EFFECT &&
    exact(e, ['type', 'penaltyDefinitionId']) && e.penaltyDefinitionId === 'master.sieg.skill.s2.penalty';
}
export function isSiegBalmungPenaltyAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  return a.kind === 'phase_action' && a.activation.phase === 'action' && a.activation.opens === 'controller_action_window' &&
    a.effects.length === 1 && e?.type === SIEG_BALMUNG_PENALTY_EFFECT && exact(e, ['type', 'target', 'defeatController']) && e.target === 'agility_attack' && e.defeatController === true;
}
export function isAcceptedSiegAbility(a: AuthoringAbility): boolean {
  return isSiegGalvanismAbility(a) || isSiegSyncStrengthAbility(a) || isSiegDragonCommandAbility(a) ||
    isSiegBalmungFreePlayAbility(a) || isSiegBalmungPenaltyAbility(a);
}

/** Apply the residual mana-spend clause from the authoritative payment hook. */
export function applySiegGalvanism(state: GameState, spenderId: string, amount: number): Array<{ controllerId: string; sourceCardId: string; abilityId: string }> {
  const runtime = state.abilityRuntime;
  if (!runtime || amount < 4) return [];
  const spender = state.players.find((entry) => entry.id === spenderId);
  if (!spender?.locationId) return [];
  const rewards: Array<{ controllerId: string; sourceCardId: string; abilityId: string }> = [];
  for (const source of state.cards) {
    if (source.ownerPlayerId === spenderId || source.controllerPlayerId !== source.ownerPlayerId || source.zone !== 'field' && source.zone !== 'attack_area') continue;
    const controller = state.players.find((entry) => entry.id === source.controllerPlayerId);
    const ability = runtime.pack.cards[source.definitionId]?.abilities.find(isSiegGalvanismAbility);
    if (!controller || controller.status !== 'active' || controller.locationId !== spender.locationId || source.ownerPlayerId !== controller.id ||
        runtime.cardState[source.instanceId]?.active !== true || runtime.cardState[source.instanceId]?.faceDown === true || controller.masterCardId !== 'master.sieg' || !ability) continue;
    const carrier = controller as typeof controller & { commandSpells?: number };
    carrier.commandSpells = Number(carrier.commandSpells ?? 3) + 1;
    rewards.push({ controllerId: controller.id, sourceCardId: source.instanceId, abilityId: ability.id });
  }
  return rewards;
}

