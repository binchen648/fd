import type { AuthoringAbility, EffectContext, RuleNode } from './types';
import type { GameState, PlayerState } from '../schema/game';

/** Authenticated runtime effects for master.sion / 紫苑·艾尔特纳姆. */
export const SION_ASCENSION_EFFECT = 'sion_ascension_provision' as const;
export const SION_TRAINING_EFFECT = 'sion_chaldea_training' as const;
export const SION_MAGIC_IMMUNITY_EFFECT = 'sion_magic_immunity_ex' as const;
export const SION_INDEPENDENT_ACTION_EFFECT = 'sion_independent_action_ex' as const;
export const SION_TERRITORY_EFFECT = 'sion_territory_expansion_ex' as const;
export const SION_RIDING_EFFECT = 'sion_riding_ex' as const;
export const SION_STRUCTURED_EFFECT = 'sion_structured_skill' as const;
export const SION_EFFECTS = [SION_ASCENSION_EFFECT, SION_TRAINING_EFFECT, SION_MAGIC_IMMUNITY_EFFECT,
  SION_INDEPENDENT_ACTION_EFFECT, SION_TERRITORY_EFFECT, SION_RIDING_EFFECT, SION_STRUCTURED_EFFECT] as const;

const SION = 'master.sion';
const SION_STRUCTURED_SKILL_BY_ABILITY: Record<string, string> = {
  'sion.s2.library': 'library', 'sion.s3.cafeteria': 'cafeteria',
  'sion.s4.gym': 'gym', 'sion.s4.gym-experience': 'gym_experience',
  'sion.s6.hunt': 'hunt', 'sion.s10.concealment-loss': 'concealment_loss',
  'sion.s10.execution': 'execution', 'sion.s11.berserk': 'berserk',
  'sion.s13.avenger': 'avenger', 'sion.s14.ruler': 'ruler',
  'sion.s15.restart': 'restart', 'sion.s16.abyss': 'abyss', 'sion.s17.aether': 'aether',
};
const str = (v: unknown): string => typeof v === 'string' ? v : '';
const num = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) ? v : Number(v ?? 0);
const effect = (a: AuthoringAbility): RuleNode | undefined => a.effects.find((e) => SION_EFFECTS.includes(str(e.type) as typeof SION_EFFECTS[number]));
export function containsSionPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSionPrivilegedNode);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return SION_EFFECTS.includes(str(record.type) as typeof SION_EFFECTS[number]) || Object.values(record).some(containsSionPrivilegedNode);
}
export function isAcceptedSionAbility(a: AuthoringAbility): boolean {
  const e = effect(a);
  if (!e || !/^sion\./.test(a.id) || a.effects.length !== 1) return false;
  const type = str(e.type);
  if (!SION_EFFECTS.includes(type as typeof SION_EFFECTS[number])) return false;
  if (type === SION_STRUCTURED_EFFECT) return str(e.skill) === SION_STRUCTURED_SKILL_BY_ABILITY[a.id];
  const expected = new Set([
    'sion.ascension.provision', 'sion.s1.training',
  ]);
  if (type === SION_ASCENSION_EFFECT || type === SION_TRAINING_EFFECT) return expected.has(a.id);
  if (type === SION_MAGIC_IMMUNITY_EFFECT) return a.id === 'sion.s5.magic-immunity';
  if (type === SION_INDEPENDENT_ACTION_EFFECT) return a.id === 'sion.s7.independent' || a.id === 'sion.s7.independent-battle';
  if (type === SION_TERRITORY_EFFECT) return a.id === 'sion.s9.territory';
  if (type === SION_RIDING_EFFECT) return a.id === 'sion.s8.riding';
  return false;
}
export function sionEffect(a: AuthoringAbility): RuleNode | undefined { return effect(a); }

type SionRuntime = GameState['abilityRuntime'] & { sion?: {
  experience: Record<string, number>; territoryWins: Record<string, number>; covered: Record<string, string>;
  transformedTraining: Record<string, string>; roundUses: Record<string, number>;
} };
function rt(state: GameState): SionRuntime { return state.abilityRuntime as SionRuntime; }
function store(state: GameState) {
  const r = rt(state); return r.sion ??= { experience: {}, territoryWins: {}, covered: {}, transformedTraining: {}, roundUses: {} };
}
function sourceCard(state: GameState, sourceCardId: string) { return state.cards.find((c) => c.instanceId === sourceCardId); }
function controller(state: GameState, id: string): PlayerState | undefined { return state.players.find((p) => p.id === id); }
function activeSource(state: GameState, sourceCardId: string, controllerId: string): boolean {
  const c = sourceCard(state, sourceCardId); return !!c && c.ownerPlayerId === controllerId && c.controllerPlayerId === controllerId &&
    ['field', 'attack_area'].includes(c.zone) && rt(state).cardState[sourceCardId]?.active === true && rt(state).cardState[sourceCardId]?.faceDown !== true;
}
function nextId(state: GameState, label: string): string { const r = rt(state); r.sequence += 1; return `${label}:${r.sequence}`; }
function addSkill(state: GameState, controllerId: string, definitionId: string, generatedBy: string): string {
  const existing = state.cards.find((c) => c.ownerPlayerId === controllerId && c.definitionId === definitionId && c.zone !== 'removed_from_game');
  if (existing) return existing.instanceId;
  const instanceId = nextId(state, 'sion-skill');
  state.cards.push({ instanceId, definitionId, ownerPlayerId: controllerId, controllerPlayerId: controllerId, zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: controllerId }, generatedBy });
  rt(state).cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return instanceId;
}
function activeSionSources(state: GameState, controllerId: string, abilityType: string): string[] {
  return state.cards.filter((c) => c.ownerPlayerId === controllerId && c.controllerPlayerId === controllerId && ['field', 'attack_area'].includes(c.zone) &&
    rt(state).cardState[c.instanceId]?.active === true && rt(state).cardState[c.instanceId]?.faceDown !== true &&
    rt(state).pack.cards[c.definitionId]?.abilities.some((a) => sionEffect(a)?.type === abilityType)).map((c) => c.instanceId);
}
function allAtLocation(state: GameState, locationId: string | undefined): PlayerState[] { return locationId ? state.players.filter((p) => p.status === 'active' && p.locationId === locationId) : []; }

/** Non-text fixture: provision the six referenced New Chaldea skills at game start. */
function provision(state: GameState, ctx: EffectContext): void {
  const ids = ['s5', 's6', 's7', 's8', 's10', 's11'];
  ids.forEach((id) => addSkill(state, ctx.controllerId, `${SION}.skill.${id}`, ctx.sourceCardId));
  rt(state).events.push({ type: 'sion_new_chaldea_provisioned', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
}
function train(state: GameState, ctx: EffectContext): void {
  const s = store(state);
  for (const id of ['s2', 's3', 's4']) {
    const card = addSkill(state, ctx.controllerId, `${SION}.skill.${id}`, ctx.sourceCardId);
    const servant = state.cards.find((c) => c.ownerPlayerId === ctx.controllerId && c.controllerPlayerId === ctx.controllerId && c.zone === 'skill' && c.definitionId.startsWith('servant.') && !s.covered[c.instanceId]);
    if (servant) s.covered[servant.instanceId] = card;
  }
  rt(state).events.push({ type: 'sion_chaldea_training_installed', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
}
function spendVp(state: GameState, playerId: string, amount: number): boolean { const p = controller(state, playerId); if (!p || p.vp < amount) return false; p.vp -= amount; return true; }
function defeat(state: GameState, target: PlayerState, ctx: EffectContext): void {
  if (target.status !== 'active') return;
  target.status = 'eliminated';
  (rt(state).battleDefeatRoundByPlayer ??= {})[target.id] = state.round.roundNumber;
  rt(state).events.push({ type: 'player_defeated_by_effect', playerId: target.id, controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId });
}

/** Resolve the Sion authored production effects. This function only accepts source-bound cards. */
export function resolveSionEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility, node: RuleNode): boolean {
  if (!isAcceptedSionAbility(ability)) return false;
  const source = sourceCard(state, ctx.sourceCardId);
  if (!source || source.ownerPlayerId !== ctx.controllerId || source.controllerPlayerId !== ctx.controllerId ||
      (state.abilityRuntime?.pack.cards[source.definitionId] as { ownerId?: string } | undefined)?.ownerId !== SION && !source.definitionId.startsWith(`${SION}.`)) {
    return false;
  }
  // Ascension is a game-start provision while the source remains in the skill
  // zone; every other Sion ability is a source-card activation and must be
  // resolved only from a public active zone.
  if (node.type !== SION_ASCENSION_EFFECT && !['field', 'attack_area'].includes(source.zone)) return false;
  const p = controller(state, ctx.controllerId); if (!p) throw new Error('Sion controller is missing');
  const type = str(node.type); const s = store(state);
  switch (type) {
    case SION_ASCENSION_EFFECT: provision(state, ctx); return true;
    case SION_TRAINING_EFFECT: train(state, ctx); return true;
    case SION_MAGIC_IMMUNITY_EFFECT: {
      s.roundUses[`${ctx.sourceCardId}:magic:${state.round.roundNumber}`] = 1;
      rt(state).events.push({ type: 'sion_magic_immunity_applied', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId }); return true;
    }
    case SION_INDEPENDENT_ACTION_EFFECT: {
      if (ability.id.includes('.s6')) { p.locationId = 'recon' as never; }
      if (ability.id.includes('.s7')) {
        if (ctx.event?.type === 'after_controller_wins_battle') p.vp += 2;
        if (ctx.event?.type === 'after_controller_loses_battle') p.vp = Math.max(0, p.vp - 3);
      }
      rt(state).events.push({ type: 'sion_independent_action_resolved', playerId: ctx.controllerId, sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId }); return true;
    }
    case SION_TERRITORY_EFFECT: {
      if (ability.id.includes('.s9') && p.locationId === 'magic_workshop') {
        const wins = s.territoryWins[ctx.controllerId] ?? 0; (p as PlayerState & { sionTerritoryPower?: number }).sionTerritoryPower = wins;
      }
      return true;
    }
    case SION_RIDING_EFFECT: {
      const hand = state.cards.filter((c) => c.ownerPlayerId === ctx.controllerId && c.controllerPlayerId === ctx.controllerId && c.zone === 'hand' &&
        Number(state.abilityRuntime?.pack.cards[c.definitionId]?.cardFace.basePower ?? 99) <= 3).slice(0, 3);
      for (const card of hand) { card.zone = 'attack_area'; card.visibility = { scope: 'public' }; rt(state).cardState[card.instanceId] ??= { active: true, faceDown: false, playedRound: state.round.roundNumber }; rt(state).cardState[card.instanceId]!.active = true; }
      if (hand.length) rt(state).cardState[ctx.sourceCardId]!.active = false;
      return true;
    }
    case SION_STRUCTURED_EFFECT: {
      if (ability.id.includes('.s13')) {
        if (!spendVp(state, ctx.controllerId, 2)) return false;
        const discarded = state.cards.find((c) => c.ownerPlayerId === ctx.controllerId && c.controllerPlayerId === ctx.controllerId && c.zone === 'discard');
        if (discarded) { discarded.zone = 'attack_area'; discarded.visibility = { scope: 'public' }; rt(state).cardState[discarded.instanceId] ??= { active: true, faceDown: false, playedRound: state.round.roundNumber }; rt(state).cardState[discarded.instanceId]!.active = true; }
      } else if (ability.id.includes('.s16')) {
        const all = String(node.scope ?? '') === 'all_players';
        for (const card of state.cards.filter((c) => c.zone === 'hand' && (all || c.controllerPlayerId === ctx.controllerId || c.ownerPlayerId === ctx.controllerId))) card.zone = 'discard';
      } else if (ability.id.includes('.s11')) {
        const top = state.cards.filter((c) => c.ownerPlayerId === ctx.controllerId && c.zone === 'deck').slice(0, 3);
        for (const card of top) { card.zone = 'removed_from_game'; rt(state).cardState[card.instanceId]!.faceDown = true; }
        rt(state).cardState[ctx.sourceCardId]!.roundPowerBonus = { round: state.round.roundNumber, amount: top.length * 4, sourceAbilityId: ctx.abilityId };
      } else if (ability.id.includes('.s10')) {
        const target = allAtLocation(state, p.locationId).find((x) => x.id !== p.id && x.status === 'active'); if (target) defeat(state, target, ctx);
      } else if (ability.id.includes('.s14')) {
        const target = allAtLocation(state, p.locationId).find((x) => x.id !== p.id); if (target) (target as PlayerState & { temporaryRulerSealUntilRound?: number }).temporaryRulerSealUntilRound = state.round.roundNumber;
      } else if (ability.id.includes('.s15')) {
        for (const other of allAtLocation(state, 'moon_holy_grail')) { other.locationId = 'recon' as never; }
        for (const card of state.cards.filter((c) => c.zone === 'field' && (c as typeof c & { locationId?: string }).locationId === 'moon_holy_grail')) card.zone = 'removed_from_game';
      } else if (ability.id.includes('.s17')) {
        for (const card of state.cards.filter((c) => c.controllerPlayerId === ctx.controllerId && c.zone === 'attack_area' && (state.abilityRuntime?.pack.cards[c.definitionId]?.cardFace.attributes as unknown[] | undefined)?.includes('幸运'))) rt(state).cardState[card.instanceId]!.active = false;
      } else if (ability.id.includes('.s4')) {
        s.experience[ctx.sourceCardId] = (s.experience[ctx.sourceCardId] ?? 0) + 1;
      } else if (ability.id.includes('.s3') || ability.id.includes('.s2')) {
        s.experience[ctx.sourceCardId] = (s.experience[ctx.sourceCardId] ?? 0) + 1;
      }
      return true;
    }
    default: return false;
  }
}

export function sionPowerBonus(state: GameState, cardId: string): number {
  const card = sourceCard(state, cardId); if (!card) return 0;
  const d = rt(state).pack.cards[card.definitionId]; const p = controller(state, card.controllerPlayerId); if (!d || !p) return 0;
  let bonus = 0;
  for (const sourceId of activeSionSources(state, card.controllerPlayerId, SION_STRUCTURED_EFFECT)) {
    const source = sourceCard(state, sourceId); const ability = source && rt(state).pack.cards[source.definitionId]?.abilities.find((a) => sionEffect(a)?.type === SION_STRUCTURED_EFFECT);
    if (source?.definitionId.endsWith('.s4') && d.cardType === 'basic_attack') bonus += 1;
  }
  for (const sourceId of activeSionSources(state, card.controllerPlayerId, SION_TERRITORY_EFFECT)) if (p.locationId === 'magic_workshop') bonus += store(state).territoryWins[card.controllerPlayerId] ?? 0;
  return bonus;
}

export function settleSionEvent(state: GameState, event: { type: string; playerId?: string; sourceCardId?: string }): void {
  if (event.type === 'after_controller_wins_battle' && event.playerId) {
    const s = store(state); s.territoryWins[event.playerId] = (s.territoryWins[event.playerId] ?? 0) + 1;
  }
  if (event.type === 'after_controller_loses_battle' && event.playerId) {
    for (const sourceId of activeSionSources(state, event.playerId, SION_STRUCTURED_EFFECT)) {
      const d = rt(state).pack.cards[sourceCard(state, sourceId)?.definitionId ?? '']; if (d?.id.endsWith('.s10')) { sourceCard(state, sourceId)!.zone = 'removed_from_game'; rt(state).cardState[sourceId]!.active = false; }
    }
  }
}
