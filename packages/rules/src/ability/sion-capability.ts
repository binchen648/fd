import type { AuthoringAbility, EffectContext, PendingDecision, RuleNode } from './types';
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
  transformedTraining: Record<string, string>; roundUses: Record<string, number>; trainingSpent: Record<string, number>;
  s8CloseRound?: Record<string, number>; s14LastTargetRound?: Record<string, number>;
} };
function rt(state: GameState): SionRuntime { return state.abilityRuntime as SionRuntime; }
function store(state: GameState) {
  const r = rt(state); return r.sion ??= { experience: {}, territoryWins: {}, covered: {}, transformedTraining: {}, roundUses: {}, trainingSpent: {} };
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
function moveSionCard(state: GameState, id: string, zone: string): void {
  const card = sourceCard(state, id); if (!card) throw new Error('Sion card is missing');
  card.zone = zone; card.visibility = zone === 'field' || zone === 'attack_area' || zone === 'removed_from_game' ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
  const cs = rt(state).cardState[id]; if (cs && !['field', 'attack_area'].includes(zone)) cs.active = false;
}
export function isSionCoveredCard(state: GameState, cardId: string): boolean { return !!rt(state).sion?.covered[cardId]; }
export function sionCardPlayCommandSealCost(definitionId: string): number { return definitionId === `${SION}.skill.s17` ? 1 : 0; }
function stageChoice(state: GameState, ctx: EffectContext, mode: 'training' | 'riding' | 'hunt' | 'execution' | 'avenger' | 'ruler' | 'abyss', candidates: string[], min: number, max: number, targetKind: 'card' | 'player' | 'location' | 'choice', options?: string[]): void {
  const r = rt(state); if (r.pendingDecision) throw new Error('Sion already has a pending decision');
  const id = nextId(state, `sion-${mode}-choice`);
  r.pendingDecision = { id, controllerId: ctx.controllerId, target: { id: `sion-${mode}`, type: targetKind, count: { min, max } }, candidates: [...candidates], min, max, context: structuredClone(ctx), remainingEffects: [], interaction: {
    kind: 'sion_choice_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden', sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId,
    createdRevision: r.revision + 1, continuationRef: `${id}:continuation`, controllerId: ctx.controllerId, mode, candidateIds: [...candidates], round: state.round.roundNumber,
    ...(options ? { options: [...options] } : {}), constraints: { kind: 'target', targetKind, min, max, distinct: true },
  } };
}

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
function consumeTraining(state: GameState, ctx: EffectContext): boolean {
  const source = sourceCard(state, ctx.sourceCardId); if (!source || source.zone !== 'skill' || state.round.activePhase !== 'preparation') return false;
  const s = store(state); const covered = Object.entries(s.covered).filter(([, provider]) => provider === ctx.sourceCardId).map(([id]) => id);
  const exp = s.experience[ctx.sourceCardId] ?? 0; const spent = s.trainingSpent[ctx.sourceCardId] ?? 0;
  if (ctx.abilityId === 'sion.s2.library') {
    const upgrades = Math.floor(exp / 2) - spent; if (upgrades < 1) return false;
    for (const id of covered) (rt(state).cardState[id] as any).sionCostReduction = ((rt(state).cardState[id] as any).sionCostReduction ?? 0) + upgrades;
    s.trainingSpent[ctx.sourceCardId] = spent + upgrades;
  } else if (ctx.abilityId === 'sion.s3.cafeteria') {
    if (exp - spent < 2 || covered.length !== 1) return false;
    for (const id of covered) { const card = sourceCard(state, id); if (!card) continue; const exId = `${card.definitionId}.ex`; card.definitionId = exId; s.transformedTraining[id] = exId; rt(state).pack.cards[exId] ??= { id: exId, name: 'EX技能', cardType: 'servant_skill', cardFace: { typeLabel: '技能', attributes: ['特殊'], cost: 0, basePower: 0 }, playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [], mode: 'automatic' } as any; }
    s.trainingSpent[ctx.sourceCardId] = spent + 2;
  } else if (ctx.abilityId === 'sion.s4.gym') {
    if (Math.floor(exp / 2) <= spent) return false; for (const id of covered) (rt(state).cardState[id] as any).sionPowerBonus = ((rt(state).cardState[id] as any).sionPowerBonus ?? 0) + 1; s.trainingSpent[ctx.sourceCardId] = spent + 1;
  } else return false;
  moveSionCard(state, ctx.sourceCardId, 'removed_from_game'); return true;
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
  if (['sion.s2.library', 'sion.s3.cafeteria', 'sion.s4.gym'].includes(ctx.abilityId) && state.round.activePhase === 'preparation' && source.zone === 'skill') return consumeTraining(state, ctx);
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
        Number(state.abilityRuntime?.pack.cards[c.definitionId]?.cardFace.basePower ?? 99) <= 3);
      stageChoice(state, ctx, 'riding', hand.map((c) => c.instanceId), 0, Math.min(3, hand.length), 'card');
      return true;
    }
    case SION_STRUCTURED_EFFECT: {
      if (ability.id.includes('.s6')) {
        const destinations = ['miyama_town', 'shinto', 'magic_workshop', 'recon'].filter((locationId) => locationId === 'recon' || state.locationConfig.enabledLocationIds.includes(locationId as never));
        stageChoice(state, ctx, 'hunt', destinations, 1, 1, 'location');
      } else if (ability.id.includes('.s13')) {
        if (p.vp < 2) return false;
        const discarded = state.cards.filter((c) => c.ownerPlayerId === ctx.controllerId && c.controllerPlayerId === ctx.controllerId && c.zone === 'discard').map((c) => c.instanceId);
        if (!discarded.length) return false; stageChoice(state, ctx, 'avenger', discarded, 1, 1, 'card');
      } else if (ability.id.includes('.s16')) {
        stageChoice(state, ctx, 'abyss', ['local', 'all_players'], 1, 1, 'choice');
      } else if (ability.id.includes('.s11')) {
        const deck = state.cards.filter((c) => c.ownerPlayerId === ctx.controllerId && c.zone === 'deck'); const top: typeof deck = [];
        for (let i = 0; i < Math.min(3, deck.length); i += 1) { let x = rt(state).randomState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; rt(state).randomState = x >>> 0; const index = Math.floor((rt(state).randomState / 0x100000000) * deck.length); top.push(...deck.splice(Math.max(0, Math.min(deck.length - 1, index)), 1)); }
        for (const card of top) { card.zone = 'removed_from_game'; rt(state).cardState[card.instanceId]!.faceDown = true; }
        rt(state).cardState[ctx.sourceCardId]!.roundPowerBonus = { round: state.round.roundNumber, amount: top.length * 4, sourceAbilityId: ctx.abilityId };
      } else if (ability.id.includes('.s10')) {
        const targets = allAtLocation(state, p.locationId).filter((x) => x.id !== p.id).map((x) => x.id); if (!targets.length) return false; stageChoice(state, ctx, 'execution', targets, 1, 1, 'player');
      } else if (ability.id.includes('.s14')) {
        const last = store(state).s14LastTargetRound ?? {}; const targets = state.players.filter((x) => x.id !== p.id && x.status === 'active' && (last[`${p.id}:${x.id}`] === undefined || state.round.roundNumber - last[`${p.id}:${x.id}`]! > 3)).map((x) => x.id); if (!targets.length) return false; stageChoice(state, ctx, 'ruler', targets, 1, 1, 'player');
      } else if (ability.id.includes('.s15')) {
        for (const other of allAtLocation(state, 'moon_holy_grail').sort((a, b) => a.seat - b.seat)) { other.locationId = 'recon' as never; }
        const moonEvents = state.eventPlacements.filter((placement) => placement.locationId === 'moon_holy_grail');
        for (const placement of moonEvents) { state.eventPlacements.splice(state.eventPlacements.indexOf(placement), 1); rt(state).events.push({ type: 'sion_restart_event_removed', sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId }); }
      } else if (ability.id.includes('.s17')) {
        const own = state.players.find((candidate) => candidate.id === ctx.controllerId);
        if (!own?.locationId) return false;
        for (const card of state.cards.filter((c) => c.controllerPlayerId === ctx.controllerId && c.zone === 'attack_area' && (state.abilityRuntime?.pack.cards[c.definitionId]?.cardFace.attributes as unknown[] | undefined)?.includes('幸运'))) rt(state).cardState[card.instanceId]!.active = false;
        for (const opponent of allAtLocation(state, own.locationId).filter((candidate) => candidate.id !== ctx.controllerId)) {
          const deck = state.cards.filter((card) => card.ownerPlayerId === opponent.id && card.zone === 'deck');
          for (const drawn of deck.slice(0, 2)) { drawn.zone = 'hand'; drawn.visibility = { scope: 'public' }; }
          for (const card of state.cards.filter((candidate) => candidate.controllerPlayerId === opponent.id && ['hand', 'attack_area'].includes(candidate.zone))) card.visibility = { scope: 'public' };
          const lucky = state.cards.some((card) => card.controllerPlayerId === opponent.id && ['hand', 'attack_area'].includes(card.zone) &&
            (state.abilityRuntime?.pack.cards[card.definitionId]?.cardFace.attributes as unknown[] | undefined)?.includes('幸运'));
          if (lucky) defeat(state, opponent, ctx);
        }
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

export function resolveSionChoice(state: GameState, playerId: string, decision: PendingDecision, selected: string[]): boolean {
  const meta = decision.interaction; if (!meta || meta.kind !== 'sion_choice_v1' || meta.controllerId !== playerId || !selected.every((id) => meta.candidateIds.includes(id)) || selected.length < meta.constraints.min || selected.length > meta.constraints.max) return false;
  const ctx = decision.context; if (ctx.controllerId !== playerId) return false;
  const s = store(state); const source = sourceCard(state, meta.sourceCardInstanceId); if (!source || source.controllerPlayerId !== playerId) return false;
  if (meta.mode === 'riding') { for (const id of selected) { const c = sourceCard(state, id); if (!c || c.zone !== 'hand') return false; moveSionCard(state, id, 'attack_area'); rt(state).cardState[id] ??= { active: true, faceDown: false, playedRound: state.round.roundNumber }; rt(state).cardState[id]!.active = true; } s.s8CloseRound ??= {}; s.s8CloseRound[meta.sourceCardInstanceId] = state.round.roundNumber; }
  else if (meta.mode === 'execution') { const target = state.players.find((p) => p.id === selected[0] && p.locationId === state.players.find((x) => x.id === playerId)?.locationId && p.status === 'active'); if (!target) return false; defeat(state, target, ctx); }
  else if (meta.mode === 'avenger') { const c = sourceCard(state, selected[0]!); if (!c || c.zone !== 'discard' || c.ownerPlayerId !== playerId || !spendVp(state, playerId, 2)) return false; moveSionCard(state, c.instanceId, 'attack_area'); rt(state).cardState[c.instanceId] ??= { active: true, faceDown: false, playedRound: state.round.roundNumber }; rt(state).cardState[c.instanceId]!.active = true; }
  else if (meta.mode === 'ruler') { const target = state.players.find((p) => p.id === selected[0] && p.status === 'active' && p.id !== playerId); if (!target) return false; (target as PlayerState & { temporaryRulerSealUntilRound?: number }).temporaryRulerSealUntilRound = state.round.roundNumber; s.s14LastTargetRound ??= {}; s.s14LastTargetRound[`${playerId}:${target.id}`] = state.round.roundNumber; }
  else if (meta.mode === 'abyss') { const all = selected[0] === 'all_players'; if (all) { if (state.players.find((p) => p.id === playerId)!.mana < 2) return false; state.players.find((p) => p.id === playerId)!.mana -= 2; } const ids = all ? state.players.filter((p) => p.status === 'active').map((p) => p.id) : [playerId]; for (const c of state.cards.filter((card) => card.zone === 'hand' && ids.includes(card.controllerPlayerId))) moveSionCard(state, c.instanceId, 'discard'); }
  else if (meta.mode === 'hunt') { const destination = selected[0]; const p = state.players.find((x) => x.id === playerId)!; if (destination === 'recon') { if (p.mana < 1) return false; p.mana -= 1; } p.locationId = destination as never; }
  else if (meta.mode === 'training') { const covered = selected[0]; if (!covered || !s.covered[covered]) return false; }
  delete rt(state).pendingDecision; return true;
}

export function sionPowerBonus(state: GameState, cardId: string): number {
  const card = sourceCard(state, cardId); if (!card) return 0;
  const d = rt(state).pack.cards[card.definitionId]; const p = controller(state, card.controllerPlayerId); if (!d || !p) return 0;
  let bonus = Number((rt(state).cardState[cardId] as any)?.sionPowerBonus ?? 0);
  for (const sourceId of activeSionSources(state, card.controllerPlayerId, SION_STRUCTURED_EFFECT)) {
    const source = sourceCard(state, sourceId); const ability = source && rt(state).pack.cards[source.definitionId]?.abilities.find((a) => sionEffect(a)?.type === SION_STRUCTURED_EFFECT);
    if (source?.definitionId.endsWith('.s4') && d.cardType === 'basic_attack') bonus += 1;
  }
  for (const sourceId of activeSionSources(state, card.controllerPlayerId, SION_TERRITORY_EFFECT)) if (p.locationId === 'magic_workshop') bonus += store(state).territoryWins[card.controllerPlayerId] ?? 0;
  return bonus;
}
export function sionMagicAttackSuppressed(state: GameState, cardId: string): boolean {
  const card = sourceCard(state, cardId); if (!card) return false; const d = rt(state).pack.cards[card.definitionId]; const owner = controller(state, card.controllerPlayerId);
  if (!d || !owner || !((d.cardFace.attributes as string[] | undefined) ?? []).includes('魔术') || !owner.locationId) return false;
  return state.cards.some((source) => source.controllerPlayerId !== card.controllerPlayerId && source.ownerPlayerId === source.controllerPlayerId && ['field', 'attack_area'].includes(source.zone) && activeSionSources(state, source.controllerPlayerId, SION_MAGIC_IMMUNITY_EFFECT).includes(source.instanceId) && controller(state, source.controllerPlayerId)?.locationId === owner.locationId);
}

export function settleSionEvent(state: GameState, event: { type: string; playerId?: string; sourceCardId?: string }): void {
  const s = store(state);
  if (event.type === 'on_card_played' && event.sourceCardId) {
    const played = sourceCard(state, event.sourceCardId); const d = played && rt(state).pack.cards[played.definitionId]; const owner = played && controller(state, played.controllerPlayerId);
    if (played && d && owner && ((d.cardFace.attributes as string[] | undefined) ?? []).includes('宝具')) for (const sourceId of activeSionSources(state, owner.id, SION_STRUCTURED_EFFECT)) {
      const source = sourceCard(state, sourceId); if (!source?.definitionId.endsWith('.s2')) continue; const key = `${sourceId}:${owner.id}`;
      if (s.roundUses[key] === 1 || owner.id === source.controllerPlayerId) continue; const controllerPlayer = controller(state, source.controllerPlayerId); if (!controllerPlayer || controllerPlayer.locationId !== owner.locationId) continue;
      controllerPlayer.vp += 1; s.experience[sourceId] = (s.experience[sourceId] ?? 0) + 1; s.roundUses[key] = 1;
    }
  }
  if (event.type === 'controller_combat_action_window' && event.playerId) for (const sourceId of activeSionSources(state, event.playerId, SION_STRUCTURED_EFFECT)) {
    const source = sourceCard(state, sourceId); const owner = controller(state, event.playerId); if (!source?.definitionId.endsWith('.s3') || !owner?.locationId) continue;
    for (const target of allAtLocation(state, owner.locationId)) { target.mana += 1; if (target.id !== owner.id) s.experience[sourceId] = (s.experience[sourceId] ?? 0) + 1; }
  }
  if (event.type === 'after_battle_result_determined' && event.playerId) for (const sourceId of activeSionSources(state, event.playerId, SION_STRUCTURED_EFFECT)) {
    const source = sourceCard(state, sourceId); if (source?.definitionId.endsWith('.s4')) s.experience[sourceId] = (s.experience[sourceId] ?? 0) + 1;
  }
  if (event.type === 'after_controller_wins_battle' && event.playerId) {
    s.territoryWins[event.playerId] = (s.territoryWins[event.playerId] ?? 0) + 1;
  }
  if (event.type === 'after_controller_loses_battle' && event.playerId) {
    for (const sourceId of activeSionSources(state, event.playerId, SION_STRUCTURED_EFFECT)) {
      const d = rt(state).pack.cards[sourceCard(state, sourceId)?.definitionId ?? '']; if (d?.id.endsWith('.s10')) { sourceCard(state, sourceId)!.zone = 'removed_from_game'; rt(state).cardState[sourceId]!.active = false; }
    }
  }
  if (event.type === 'round_end') for (const [sourceId, round] of Object.entries(s.s8CloseRound ?? {})) if (round === state.round.roundNumber) { const source = sourceCard(state, sourceId); if (source) moveSionCard(state, sourceId, 'skill'); delete s.s8CloseRound![sourceId]; }
}
