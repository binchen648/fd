import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, RuleNode } from './types';
import { linkedRoleActiveMemberIds, removeLinkedRoleMember } from './linked-role-core-capability';

export const LINKED_ROLE_COPY_REVEALED_MEMBER_SERVANT_SKILL_EFFECT = 'linked_role_copy_revealed_member_servant_skill' as const;
const PRIVILEGED = new Set<string>([LINKED_ROLE_COPY_REVEALED_MEMBER_SERVANT_SKILL_EFFECT]);

function rec(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: unknown, keys: readonly string[]): boolean { if (!rec(value)) return false; const actual = Object.keys(value); return actual.length === keys.length && actual.every((key) => keys.includes(key)); }
function key(value: unknown): value is string { return typeof value === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/i.test(value); }
function runtime(state: GameState) { if (!state.abilityRuntime) throw new Error('LINKED_ROLE_COPY_RUNTIME_REQUIRED'); return state.abilityRuntime; }
function effectOf(ability: AuthoringAbility): RuleNode { return ability.effects[0]!; }
function relationship(effect: RuleNode): string | undefined { return key(effect.relationshipKey) ? String(effect.relationshipKey) : undefined; }

export function isAcceptedLinkedRoleMemberSkillCopyAbility(ability: AuthoringAbility): boolean {
  if (ability.kind !== 'phase_action' || ability.execution.mode !== 'automatic' || ability.effects.length !== 1 || ability.targets.length !== 1 ||
      ability.conditions.length !== 0 || ability.cost.length !== 0 || ability.creates.length !== 0 || ability.ruleModifiers.length !== 0 ||
      Object.keys(ability.lifecycle).length !== 0 || Object.keys(ability.limit).length !== 0 || Object.keys(ability.visibility).length !== 0 ||
      !Array.isArray(ability.execution.allowedOperations) || ability.execution.allowedOperations.length !== 0) return false;
  if (!exact(ability.activation, ['phase','opens']) || ability.activation.phase !== 'action' || ability.activation.opens !== 'controller_action_window') return false;
  if (!Object.keys(ability.responseWindow).every((keyName) => ['order','passBehavior'].includes(keyName)) ||
      (ability.responseWindow.order !== undefined && ability.responseWindow.order !== 'turn_order') ||
      (ability.responseWindow.passBehavior !== undefined && ability.responseWindow.passBehavior !== 'decline_this_window')) return false;
  const target = ability.targets[0]!; const count = rec(target.count) ? target.count : {};
  if (target.id !== 'member_revealed_servant_skill' || target.type !== 'card_instance' || !rec(target.scope) ||
      target.scope.zone !== 'skill' || target.scope.owner !== 'any' || target.scope.controller !== 'any' ||
      !exact(target.scope, ['zone','owner','controller']) || count.min !== 1 || count.max !== 1 || !Array.isArray(target.constraints) || target.constraints.length !== 0 ||
      !exact(target, ['id','type','scope','count','constraints'])) return false;
  const effect = effectOf(ability); const rel = relationship(effect);
  return effect.type === LINKED_ROLE_COPY_REVEALED_MEMBER_SERVANT_SKILL_EFFECT && !!rel &&
    effect.target === 'member_revealed_servant_skill' && exact(effect, ['type','relationshipKey','target']);
}

export function containsLinkedRoleMemberSkillCopyPrivilegedNode(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsLinkedRoleMemberSkillCopyPrivilegedNode);
  if (!rec(value)) return false;
  if (typeof value.type === 'string' && PRIVILEGED.has(value.type)) return true;
  return Object.values(value).some(containsLinkedRoleMemberSkillCopyPrivilegedNode);
}

function providerValid(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedLinkedRoleMemberSkillCopyAbility(ability)) return false;
  const source = state.cards.find((card) => card.instanceId === ctx.sourceCardId);
  const definition = source && runtime(state).pack.cards[source.definitionId];
  return !!source && !!definition && source.ownerPlayerId === ctx.controllerId && source.controllerPlayerId === ctx.controllerId && source.zone === 'skill' &&
    definition.cardType === 'master_skill' && (definition as unknown as { ownerId?: string }).ownerId === state.players.find((player) => player.id === ctx.controllerId)?.masterCardId;
}

function originalServantSkillProvenanceValid(state: GameState, originalCardInstanceId: string, originalOwnerPlayerId: string): boolean {
  const original = state.cards.find((card) => card.instanceId === originalCardInstanceId);
  const owner = state.players.find((player) => player.id === originalOwnerPlayerId);
  const definition = original && runtime(state).pack.cards[original.definitionId];
  return !!original && !!owner && !!definition && original.ownerPlayerId === originalOwnerPlayerId &&
    original.controllerPlayerId === originalOwnerPlayerId && definition.cardType === 'servant_skill' &&
    (definition as unknown as { ownerId?: string }).ownerId === owner.servantCardId;
}

export function linkedRoleEligibleRevealedMemberServantSkillIds(state: GameState, ctx: EffectContext, ability: AuthoringAbility): string[] {
  if (!providerValid(state, ctx, ability)) return [];
  const rel = relationship(effectOf(ability)); if (!rel) return [];
  const members = new Set(linkedRoleActiveMemberIds(state, ctx.controllerId, rel));
  return state.cards.filter((physical) => {
    if (!members.has(physical.ownerPlayerId) || physical.controllerPlayerId !== physical.ownerPlayerId || physical.zone !== 'skill') return false;
    if (!runtime(state).revealedServants.includes(physical.ownerPlayerId)) return false;
    const owner = state.players.find((player) => player.id === physical.ownerPlayerId);
    const definition = runtime(state).pack.cards[physical.definitionId];
    return !!owner && !!definition && definition.cardType === 'servant_skill' && (definition as unknown as { ownerId?: string }).ownerId === owner.servantCardId;
  }).map((physical) => physical.instanceId).sort();
}

export function canExecuteLinkedRoleMemberSkillCopy(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  return providerValid(state, ctx, ability) && linkedRoleEligibleRevealedMemberServantSkillIds(state, ctx, ability).length > 0;
}

export function resolveLinkedRoleMemberSkillCopy(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!canExecuteLinkedRoleMemberSkillCopy(state, ctx, ability)) return false;
  const selected = ctx.selections.member_revealed_servant_skill?.[0];
  if (!selected || !linkedRoleEligibleRevealedMemberServantSkillIds(state, ctx, ability).includes(selected)) return false;
  const original = state.cards.find((card) => card.instanceId === selected); if (!original) return false;
  const rel = relationship(effectOf(ability))!; const r = runtime(state);
  const instanceId = `linked-role-skill-copy-${++r.sequence}`;
  state.cards.push({ instanceId, definitionId: original.definitionId, ownerPlayerId: ctx.controllerId, controllerPlayerId: ctx.controllerId,
    zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: ctx.controllerId }, generatedBy: ctx.sourceCardId });
  r.cardState[instanceId] = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  (r.linkedRoleSkillCopies ??= {})[instanceId] = {
    copyCardInstanceId: instanceId, originalCardInstanceId: original.instanceId, originalOwnerPlayerId: original.ownerPlayerId,
    leaderPlayerId: ctx.controllerId, relationshipKey: rel, providerSourceCardId: ctx.sourceCardId, providerAbilityId: ctx.abilityId,
    round: state.round.roundNumber, used: false,
  };
  r.events.push({ type: 'linked_role_servant_skill_copied', playerId: ctx.controllerId, controllerId: original.ownerPlayerId,
    sourceCardId: ctx.sourceCardId, abilityId: ctx.abilityId, cardInstanceId: instanceId, revealedCardInstanceIds: [original.instanceId] });
  return true;
}

export function linkedRoleOriginalSkillUseLocked(state: GameState, sourceCardId: string, controllerId: string): boolean {
  const physical = state.cards.find((card) => card.instanceId === sourceCardId);
  return !!physical && physical.ownerPlayerId === controllerId && physical.controllerPlayerId === controllerId &&
    runtime(state).linkedRoleOriginalSkillLocks?.[sourceCardId] === state.round.roundNumber;
}

export function commitLinkedRoleCopiedSkillUse(state: GameState, copyCardInstanceId: string, controllerId: string): boolean {
  const r = runtime(state); const copy = r.linkedRoleSkillCopies?.[copyCardInstanceId];
  if (!copy) return true;
  if (copy.used || copy.round !== state.round.roundNumber || copy.leaderPlayerId !== controllerId) return false;
  const physical = state.cards.find((card) => card.instanceId === copyCardInstanceId);
  const original = state.cards.find((card) => card.instanceId === copy.originalCardInstanceId);
  const provider = state.cards.find((card) => card.instanceId === copy.providerSourceCardId);
  if (!physical || !original || !provider || physical.ownerPlayerId !== controllerId || physical.controllerPlayerId !== controllerId ||
      physical.generatedBy !== copy.providerSourceCardId || !originalServantSkillProvenanceValid(state, copy.originalCardInstanceId, copy.originalOwnerPlayerId) ||
      provider.ownerPlayerId !== controllerId || provider.controllerPlayerId !== controllerId || provider.zone !== 'skill') return false;
  const providerAbility = runtime(state).pack.cards[provider.definitionId]?.abilities.find((ability) => ability.id === copy.providerAbilityId);
  if (!providerAbility || !isAcceptedLinkedRoleMemberSkillCopyAbility(providerAbility) || relationship(effectOf(providerAbility)) !== copy.relationshipKey) return false;
  if (!linkedRoleActiveMemberIds(state, controllerId, copy.relationshipKey).includes(copy.originalOwnerPlayerId)) return false;
  (r.linkedRoleOriginalSkillLocks ??= {})[copy.originalCardInstanceId] = state.round.roundNumber;
  if (!removeLinkedRoleMember(state, controllerId, copy.originalOwnerPlayerId, copy.relationshipKey)) return false;
  copy.used = true;
  r.events.push({ type: 'linked_role_copied_skill_used', playerId: controllerId, controllerId: copy.originalOwnerPlayerId,
    sourceCardId: copyCardInstanceId, abilityId: copy.providerAbilityId, cardInstanceId: copy.originalCardInstanceId });
  return true;
}

export function cleanupLinkedRoleSkillCopiesAtRoundEnd(state: GameState): void {
  const r = runtime(state); const copies = r.linkedRoleSkillCopies ?? {};
  for (const [copyId, copy] of Object.entries(copies)) {
    if (copy.round > state.round.roundNumber) continue;
    const index = state.cards.findIndex((card) => card.instanceId === copyId);
    if (index >= 0) state.cards.splice(index, 1);
    delete r.cardState[copyId]; delete copies[copyId];
    r.events.push({ type: 'linked_role_temporary_skill_copy_expired', playerId: copy.leaderPlayerId, sourceCardId: copy.providerSourceCardId,
      abilityId: copy.providerAbilityId, cardInstanceId: copyId });
  }
  for (const [originalId, round] of Object.entries(r.linkedRoleOriginalSkillLocks ?? {})) if (round <= state.round.roundNumber) delete r.linkedRoleOriginalSkillLocks![originalId];
}

export function isLinkedRoleMemberSkillCopyRuntimeProvenanceValidForRestore(state: GameState): boolean {
  try {
    const r = runtime(state); const copies = r.linkedRoleSkillCopies ?? {};
    for (const [copyId, copy] of Object.entries(copies)) {
      if (copyId !== copy.copyCardInstanceId || copy.round !== state.round.roundNumber) return false;
      const physical = state.cards.find((card) => card.instanceId === copyId); const original = state.cards.find((card) => card.instanceId === copy.originalCardInstanceId);
      const provider = state.cards.find((card) => card.instanceId === copy.providerSourceCardId);
      if (!physical || !original || !provider || physical.definitionId !== original.definitionId || physical.ownerPlayerId !== copy.leaderPlayerId ||
          physical.controllerPlayerId !== copy.leaderPlayerId || physical.generatedBy !== copy.providerSourceCardId ||
          !originalServantSkillProvenanceValid(state, copy.originalCardInstanceId, copy.originalOwnerPlayerId) ||
          provider.ownerPlayerId !== copy.leaderPlayerId || provider.controllerPlayerId !== copy.leaderPlayerId || provider.zone !== 'skill') return false;
      const providerAbility = r.pack.cards[provider.definitionId]?.abilities.find((ability) => ability.id === copy.providerAbilityId);
      if (!providerAbility || !isAcceptedLinkedRoleMemberSkillCopyAbility(providerAbility) || relationship(effectOf(providerAbility)) !== copy.relationshipKey) return false;
      const activeMember = linkedRoleActiveMemberIds(state, copy.leaderPlayerId, copy.relationshipKey).includes(copy.originalOwnerPlayerId);
      if (!copy.used && !activeMember) return false;
      if (copy.used && (activeMember || r.linkedRoleOriginalSkillLocks?.[copy.originalCardInstanceId] !== state.round.roundNumber)) return false;
    }
    for (const [originalId, round] of Object.entries(r.linkedRoleOriginalSkillLocks ?? {})) {
      if (round !== state.round.roundNumber || !state.cards.some((card) => card.instanceId === originalId) ||
          !Object.values(copies).some((copy) => copy.originalCardInstanceId === originalId && copy.used)) return false;
    }
    return true;
  } catch { return false; }
}