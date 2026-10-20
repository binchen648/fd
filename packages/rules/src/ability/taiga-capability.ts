import type { AuthoringAbility, EffectContext, RuleNode } from './types';
import type { GameState } from '../schema/game';

export const TAIGA_DOMESTIC_CARNAGE_EFFECT = 'taiga_domestic_carnage' as const;
export const TAIGA_FATES_GUIDE_EFFECT = 'taiga_fates_guide' as const;
export const TAIGA_TIGER_STAMP_STATUS = 'status.tiger-stamp' as const;
const TAIGA = 'master.taiga';
const rec = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: unknown, keys: readonly string[]) => rec(v) && Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k));
const runtime = (s: GameState) => s.abilityRuntime!;
export function containsTaigaPrivilegedNode(v: unknown): boolean {
  if (Array.isArray(v)) return v.some(containsTaigaPrivilegedNode);
  if (!rec(v)) return false;
  if (v.type === TAIGA_DOMESTIC_CARNAGE_EFFECT || v.type === TAIGA_FATES_GUIDE_EFFECT) return true;
  return Object.values(v).some(containsTaigaPrivilegedNode);
}
export function isAcceptedTaigaAbility(a: AuthoringAbility): boolean {
  const e = a.effects[0];
  if (!e || a.effects.length !== 1 || a.conditions.length !== 0 || a.targets.length !== 0 || a.cost.length !== 0 || a.creates.length !== 0 || a.ruleModifiers.length !== 0) return false;
  if (e.type === TAIGA_DOMESTIC_CARNAGE_EFFECT) return a.id === 'taiga.ascension.domestic-carnage' && a.kind === 'passive' && a.activation.trigger === 'while_active' && exact(e, ['type']);
  if (e.type === TAIGA_FATES_GUIDE_EFFECT) return a.id === 'taiga.fates-guide' && a.kind === 'residual' && a.activation.trigger === 'after_controller_wins_battle' && exact(e, ['type']);
  return a.id === 'taiga.helper.initial-mana' && a.kind === 'forced_trigger' && a.activation.trigger === 'game_start' && e.type === 'set_mana' && e.player === 'controller' && e.amount === 3;
}
function sourceLive(s: GameState, ctx: EffectContext): boolean {
  const c = s.cards.find(x => x.instanceId === ctx.sourceCardId); const d = c && runtime(s).pack.cards[c.definitionId];
  return !!c && c.ownerPlayerId === ctx.controllerId && c.controllerPlayerId === ctx.controllerId && (d?.id?.startsWith(`${TAIGA}.`) || c.definitionId.startsWith(`${TAIGA}.`)) && ['field', 'attack_area'].includes(c.zone) && runtime(s).cardState[c.instanceId]?.active === true && runtime(s).cardState[c.instanceId]?.faceDown !== true;
}
export function taigaActive(s: GameState, locationId: string | undefined): boolean {
  if (!locationId) return false;
  return Object.values((runtime(s) as any).taigaDomesticCarnageByPlayer ?? {}).some((x: any) => x.locationId === locationId && sourceLive(s, { controllerId: x.controllerId, sourceCardId: x.sourceCardId, abilityId: x.abilityId } as EffectContext)) ||
    s.cards.some(card => card.definitionId === `${TAIGA}.skill.ascension` && card.zone === 'field' && card.ownerPlayerId === card.controllerPlayerId && runtime(s).cardState[card.instanceId]?.active === true && runtime(s).cardState[card.instanceId]?.faceDown !== true && s.players.some(p => p.id === card.controllerPlayerId && p.masterCardId === TAIGA));
}
export function taigaCompetitionReward(s: GameState, locationId: string): number | undefined {
  if (locationId !== 'magic_workshop' || !taigaActive(s, locationId)) return undefined;
  return Number(s.currentSituationMana ?? 0);
}
export function taigaPowerBonus(s: GameState, playerId: string): number {
  const n = Number((runtime(s) as any).taigaTigerStampsByPlayer?.[playerId] ?? 0); return Number.isSafeInteger(n) ? Math.min(3, Math.max(0, n)) : 0;
}
export function resolveTaigaEffect(s: GameState, ctx: EffectContext, a: AuthoringAbility, effect: RuleNode): boolean {
  if (!isAcceptedTaigaAbility(a)) return false;
  const p = s.players.find(x => x.id === ctx.controllerId); if (!p || p.masterCardId !== TAIGA) return false;
  if (effect.type === TAIGA_DOMESTIC_CARNAGE_EFFECT) {
    if (!sourceLive(s, ctx)) return false;
    ((runtime(s) as any).taigaDomesticCarnageByPlayer ??= {})[ctx.controllerId] = { controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, locationId: 'magic_workshop' };
    return true;
  }
  if (effect.type === TAIGA_FATES_GUIDE_EFFECT) {
    const e = ctx.event; const losers = e?.battleResult?.loserIds ?? [];
    if (e?.type !== 'after_controller_wins_battle' || e.playerId !== ctx.controllerId || !sourceLive(s, ctx)) return false;
    const stamps = ((runtime(s) as any).taigaTigerStampsByPlayer ??= {}); let count = 0;
    for (const id of losers) { if (id === ctx.controllerId) continue; stamps[id] = Number(stamps[id] ?? 0) + 1; count++; }
    p.vp += count; runtime(s).events.push({ type: 'taiga_tiger_stamps_distributed', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, count } as any);
    return true;
  }
  return false;
}
