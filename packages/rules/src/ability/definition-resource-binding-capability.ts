import type { GameState } from '../schema/game';
import type { AuthoringAbility, EffectContext, PendingDecision, PlayerId, RuleNode, SafeEvent } from './types';

export const PROVISION_DEFINITION_SKILL_EFFECT = 'provision_definition_skill';
export const REMOVE_DEFINITION_SKILL_ON_FIRST_MANA_CROSSING_EFFECT = 'remove_definition_skill_on_first_mana_crossing';
export const REACTIVE_OPPONENT_VP_MANA_CONVERSION_EFFECT = 'reactive_opponent_vp_mana_conversion';
export const BIND_ENGAGED_OPPONENT_ROUND_RULE_EFFECT = 'bind_engaged_opponent_round_rule';
export const GRANT_OPPONENT_BATTLE_WINNERS_VP_EFFECT = 'grant_opponent_battle_winners_vp';

const FLAG_PREFIX = '__fd_definition_resource_binding:';

function runtime(state: GameState) {
  if (!state.abilityRuntime) throw new Error('ABILITY_RUNTIME_REQUIRED');
  return state.abilityRuntime;
}
function obj(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exact(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function standard(ability: AuthoringAbility): boolean {
  return ability.execution.mode === 'automatic' && ability.execution.allowedOperations.length === 0 &&
    ability.conditions.length === 0 && ability.targets.length === 0 && ability.cost.length === 0 &&
    ability.ruleModifiers.length === 0 && ability.creates.length === 0 && Object.keys(ability.lifecycle).length === 0 &&
    Object.keys(ability.visibility).length === 0 && Object.keys(ability.limit).length === 0 &&
    ability.responseWindow.order === 'turn_order' && ability.responseWindow.passBehavior === 'decline_this_window';
}
function singleEffect(ability: AuthoringAbility): RuleNode | undefined { return ability.effects.length === 1 ? ability.effects[0] : undefined; }
function provisionAbility(ability: AuthoringAbility): boolean {
  const effect = singleEffect(ability); const trigger = ability.activation.trigger;
  return standard(ability) && ability.kind === 'forced_trigger' && !!effect && effect.type === PROVISION_DEFINITION_SKILL_EFFECT &&
    ['game_start', 'servant_package_revealed', 'after_master_ascension_unlocked'].includes(String(trigger)) &&
    exact(ability.activation, ['trigger']) && exact(effect, ['type', 'definitionId', 'destination', 'createIfMissing']) &&
    typeof effect.definitionId === 'string' && effect.definitionId.length > 0 && effect.destination === 'skill' && effect.createIfMissing === true;
}
function manaCrossingAbility(ability: AuthoringAbility): boolean {
  const effect = singleEffect(ability);
  return standard(ability) && ability.kind === 'forced_trigger' && ability.activation.trigger === 'mana_adjusted' &&
    exact(ability.activation, ['trigger']) && !!effect && effect.type === REMOVE_DEFINITION_SKILL_ON_FIRST_MANA_CROSSING_EFFECT &&
    exact(effect, ['type', 'definitionId', 'threshold', 'firstCrossing', 'destination']) &&
    typeof effect.definitionId === 'string' && effect.definitionId.length > 0 && effect.threshold === 1 &&
    effect.firstCrossing === true && effect.destination === 'removed_from_game';
}
function vpConversionAbility(ability: AuthoringAbility): boolean {
  const effect = singleEffect(ability);
  const sourceTypes = Array.isArray(effect?.qualifyingSourceCardTypes) ? effect.qualifyingSourceCardTypes : [];
  return standard(ability) && ability.kind === 'forced_trigger' && ability.activation.trigger === 'victory_points_adjusted' &&
    exact(ability.activation, ['trigger']) && !!effect && effect.type === REACTIVE_OPPONENT_VP_MANA_CONVERSION_EFFECT &&
    exact(effect, ['type', 'requireSameLocation', 'qualifyingSourceCardTypes', 'vpRounding', 'controllerManaLossPerPreventedVp', 'controllerVpPerActualManaLost']) &&
    effect.requireSameLocation === true && sourceTypes.length === 3 && new Set(sourceTypes).size === 3 &&
    ['servant_skill', 'command_spell', 'master_ascension'].every((entry) => sourceTypes.includes(entry)) &&
    effect.vpRounding === 'floor_half_gain' && effect.controllerManaLossPerPreventedVp === 1 && effect.controllerVpPerActualManaLost === 1;
}
function bindAbility(ability: AuthoringAbility): boolean {
  const effect = singleEffect(ability);
  return standard(ability) && ability.kind === 'phase_action' && exact(ability.activation, ['phase', 'opens']) &&
    ability.activation.phase === 'action' && ability.activation.opens === 'controller_action_window' && !!effect &&
    effect.type === BIND_ENGAGED_OPPONENT_ROUND_RULE_EFFECT &&
    exact(effect, ['type', 'minimumPowerPenalty', 'maximumPowerPenalty', 'blockOwnTurnMovement', 'removeSourceIfTargetLosesThisRound']) &&
    effect.minimumPowerPenalty === 1 && effect.maximumPowerPenalty === 5 && effect.blockOwnTurnMovement === true && effect.removeSourceIfTargetLosesThisRound === true;
}
function winnerRewardAbility(ability: AuthoringAbility): boolean {
  const effect = singleEffect(ability);
  return standard(ability) && ability.kind === 'forced_trigger' && exact(ability.activation, ['trigger']) &&
    ability.activation.trigger === 'after_battle_result_determined' && !!effect && effect.type === GRANT_OPPONENT_BATTLE_WINNERS_VP_EFFECT &&
    exact(effect, ['type', 'amount']) && effect.amount === 3;
}

export function containsDefinitionResourceBindingPrivilegedNode(ability: AuthoringAbility): boolean {
  return ability.effects.some((effect) => [PROVISION_DEFINITION_SKILL_EFFECT, REMOVE_DEFINITION_SKILL_ON_FIRST_MANA_CROSSING_EFFECT,
    REACTIVE_OPPONENT_VP_MANA_CONVERSION_EFFECT, BIND_ENGAGED_OPPONENT_ROUND_RULE_EFFECT,
    GRANT_OPPONENT_BATTLE_WINNERS_VP_EFFECT].includes(String(effect.type)));
}
export function isAcceptedDefinitionResourceBindingAbility(ability: AuthoringAbility): boolean {
  return provisionAbility(ability) || manaCrossingAbility(ability) || vpConversionAbility(ability) || bindAbility(ability) || winnerRewardAbility(ability);
}

function sourceProvider(state: GameState, sourceCardId: string, abilityId: string): { source: GameState['cards'][number]; ability: AuthoringAbility; controllerId: PlayerId } | undefined {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId); if (!source) return undefined;
  const def = runtime(state).pack.cards[source.definitionId]; if (!def || def.cardType !== 'master_skill') return undefined;
  const controller = state.players.find((entry) => entry.id === source.controllerPlayerId && entry.status === 'active');
  if (!controller || source.ownerPlayerId !== controller.id || !source.definitionId.startsWith(`${controller.masterCardId}.skill.`) || source.zone !== 'skill') return undefined;
  const stateEntry = runtime(state).cardState[source.instanceId]; if (stateEntry?.faceDown === true) return undefined;
  const ability = def.abilities.find((entry) => entry.id === abilityId); if (!ability || !isAcceptedDefinitionResourceBindingAbility(ability)) return undefined;
  return { source, ability, controllerId: controller.id };
}
function persistedBoundProvider(state: GameState, sourceCardId: string, abilityId: string): { source: GameState['cards'][number]; ability: AuthoringAbility; controllerId: PlayerId } | undefined {
  const source = state.cards.find((entry) => entry.instanceId === sourceCardId); if (!source) return undefined;
  const def = runtime(state).pack.cards[source.definitionId]; if (!def || def.cardType !== 'master_skill') return undefined;
  const controller = state.players.find((entry) => entry.id === source.controllerPlayerId && entry.status === 'active');
  if (!controller || source.ownerPlayerId !== controller.id || !source.definitionId.startsWith(`${controller.masterCardId}.skill.`) ||
      !['skill', 'removed_from_game'].includes(source.zone)) return undefined;
  const stateEntry = runtime(state).cardState[source.instanceId]; if (stateEntry?.faceDown === true) return undefined;
  const ability = def.abilities.find((entry) => entry.id === abilityId); if (!ability || !bindAbility(ability)) return undefined;
  return { source, ability, controllerId: controller.id };
}
function providers(state: GameState, predicate: (ability: AuthoringAbility) => boolean): Array<{ sourceCardId: string; ability: AuthoringAbility; controllerId: PlayerId }> {
  const out: Array<{ sourceCardId: string; ability: AuthoringAbility; controllerId: PlayerId }> = [];
  for (const source of state.cards) {
    const def = runtime(state).pack.cards[source.definitionId];
    if (!def || def.cardType !== 'master_skill' || source.zone !== 'skill' || source.ownerPlayerId !== source.controllerPlayerId) continue;
    const controller = state.players.find((entry) => entry.id === source.controllerPlayerId && entry.status === 'active');
    if (!controller || !source.definitionId.startsWith(`${controller.masterCardId}.skill.`) || runtime(state).cardState[source.instanceId]?.faceDown === true) continue;
    for (const ability of def.abilities) if (predicate(ability)) out.push({ sourceCardId: source.instanceId, ability, controllerId: controller.id });
  }
  return out;
}
function moveOwnedDefinitionToSkill(state: GameState, controllerId: PlayerId, sourceCardId: string, definitionId: string): boolean {
  const def = runtime(state).pack.cards[definitionId]; const controller = state.players.find((entry) => entry.id === controllerId);
  if (!def || !controller || def.cardType !== 'master_skill' || !definitionId.startsWith(`${controller.masterCardId}.skill.`)) return false;
  const existing = state.cards.filter((entry) => entry.definitionId === definitionId && entry.ownerPlayerId === controllerId);
  if (existing.length > 1) return false;
  let physical = existing[0];
  if (!physical) {
    const instanceId = `${controllerId}:provisioned-master-skill:${definitionId}`;
    if (state.cards.some((entry) => entry.instanceId === instanceId)) return false;
    physical = { instanceId, definitionId, ownerPlayerId: controllerId, controllerPlayerId: controllerId, zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: controllerId }, generatedBy: sourceCardId };
    state.cards.push(physical);
  } else {
    physical.controllerPlayerId = controllerId; physical.zone = 'skill'; physical.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
  }
  const prior = runtime(state).cardState[physical.instanceId];
  runtime(state).cardState[physical.instanceId] = prior ? { ...prior, active: false, faceDown: false } : { active: false, faceDown: false, playedRound: 0 };
  return true;
}
function removeOwnedDefinition(state: GameState, controllerId: PlayerId, definitionId: string): boolean {
  const matches = state.cards.filter((entry) => entry.definitionId === definitionId && entry.ownerPlayerId === controllerId);
  if (matches.length > 1) return false;
  const physical = matches[0]; if (!physical) return true;
  physical.controllerPlayerId = controllerId; physical.zone = 'removed_from_game'; physical.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
  const cardState = runtime(state).cardState[physical.instanceId] ??= { active: false, faceDown: false, playedRound: 0 };
  cardState.active = false; cardState.faceDown = false; delete cardState.paidManaOnPlay;
  return true;
}
function flagBag(state: GameState, playerId: PlayerId): Record<string, boolean | number | string> {
  runtime(state).structuredPlayerFlagsByPlayer ??= {}; return runtime(state).structuredPlayerFlagsByPlayer![playerId] ??= {};
}
function crossingFlag(sourceCardId: string, abilityId: string): string { return `${FLAG_PREFIX}mana-crossed:${sourceCardId}:${abilityId}`; }
function provisionFlag(sourceCardId: string, abilityId: string): string { return `${FLAG_PREFIX}provisioned:${sourceCardId}:${abilityId}`; }
function bindFlag(sourceCardId: string, abilityId: string): string { return `${FLAG_PREFIX}bound:${sourceCardId}:${abilityId}`; }
function encodeBinding(controllerId: string, round: number, penalty: number): string { return JSON.stringify({ controllerId, round, penalty }); }
function parseBinding(value: unknown): { controllerId: string; round: number; penalty: number } | undefined {
  if (typeof value !== 'string') return undefined; try { const parsed = JSON.parse(value); return obj(parsed) && typeof parsed.controllerId === 'string' &&
    Number.isSafeInteger(parsed.round) && Number(parsed.round) > 0 && Number.isSafeInteger(parsed.penalty) && Number(parsed.penalty) >= 1 && Number(parsed.penalty) <= 5
    ? { controllerId: parsed.controllerId, round: Number(parsed.round), penalty: Number(parsed.penalty) } : undefined; } catch { return undefined; }
}
function activeEngagedOpponentIds(state: GameState, controllerId: PlayerId): PlayerId[] {
  const controller = state.players.find((entry) => entry.id === controllerId && entry.status === 'active');
  if (!controller?.locationId || !state.map.locations.find((entry) => entry.id === controller.locationId)?.tags.includes('battlefield')) return [];
  return state.players.filter((entry) => entry.status === 'active' && entry.id !== controllerId && entry.locationId === controller.locationId).map((entry) => entry.id);
}
function choiceId(playerId: string, penalty: number): string { return `${playerId}::penalty:${penalty}`; }
function parseChoice(value: string): { playerId: string; penalty: number } | undefined {
  const match = /^(.*)::penalty:([1-5])$/.exec(value); return match?.[1] ? { playerId: match[1], penalty: Number(match[2]) } : undefined;
}

export function canExecuteDefinitionResourceBindingEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!isAcceptedDefinitionResourceBindingAbility(ability) || !sourceProvider(state, ctx.sourceCardId, ctx.abilityId)) return false;
  if (provisionAbility(ability)) {
    const trigger = ability.activation.trigger;
    if (!ctx.event || ctx.event.type !== trigger) return false;
    if (runtime(state).structuredPlayerFlagsByPlayer?.[ctx.controllerId]?.[provisionFlag(ctx.sourceCardId, ctx.abilityId)] === true) return false;
    if (trigger === 'game_start') return true;
    if (ctx.event.playerId !== ctx.controllerId) return false;
    return trigger !== 'after_master_ascension_unlocked' || ctx.event.sourceCardId === ctx.sourceCardId;
  }
  if (bindAbility(ability)) return activeEngagedOpponentIds(state, ctx.controllerId).length > 0;
  if (winnerRewardAbility(ability)) {
    const participants = ctx.event?.battleParticipantIds; const winners = ctx.event?.battleResult?.winners;
    return Array.isArray(participants) && Array.isArray(winners) && winners.length > 0 &&
      winners.every((id) => participants.includes(id)) && winners.some((id) => id !== ctx.controllerId);
  }
  return false;
}

export function resolveDefinitionResourceBindingEffect(state: GameState, ctx: EffectContext, ability: AuthoringAbility): boolean {
  if (!canExecuteDefinitionResourceBindingEffect(state, ctx, ability)) return false;
  const effect = ability.effects[0]!;
  if (provisionAbility(ability)) {
    if (!moveOwnedDefinitionToSkill(state, ctx.controllerId, ctx.sourceCardId, String(effect.definitionId))) return false;
    flagBag(state, ctx.controllerId)[provisionFlag(ctx.sourceCardId, ctx.abilityId)] = true;
    return true;
  }
  if (winnerRewardAbility(ability)) {
    for (const playerId of new Set(ctx.event!.battleResult!.winners.filter((id) => id !== ctx.controllerId))) {
      const target = state.players.find((entry) => entry.id === playerId && entry.status === 'active'); if (!target) continue;
      const before = target.vp; target.vp += 3;
      runtime(state).events.push({ type: 'victory_points_adjusted', playerId, controllerId: ctx.controllerId, sourceCardId: ctx.sourceCardId,
        abilityId: ctx.abilityId, resource: 'victory_points', delta: 3, before, after: target.vp });
    }
    return true;
  }
  if (bindAbility(ability)) {
    const opponents = activeEngagedOpponentIds(state, ctx.controllerId); const options = opponents.flatMap((id) => [1,2,3,4,5].map((penalty) => choiceId(id, penalty)));
    const id = `definition-binding:${runtime(state).sequence++}`;
    runtime(state).pendingDecision = { id, controllerId: ctx.controllerId,
      target: { id: 'bound_opponent_power_choice', type: 'choice', options: options.map((option) => ({ id: option })), count: { min: 1, max: 1 } },
      candidates: options, min: 1, max: 1, context: structuredClone(ctx), remainingEffects: [],
      interaction: { kind: 'bound_opponent_round_rule_v1', template: 'target', visibility: 'owner_only', cancelPolicy: 'forbidden',
        sourceCardInstanceId: ctx.sourceCardId, abilityId: ctx.abilityId, createdRevision: runtime(state).revision + 1, continuationRef: `${id}:continuation`,
        controllerId: ctx.controllerId, round: state.round.roundNumber, opponentIds: opponents, options,
        constraints: { kind: 'target', targetKind: 'choice', min: 1, max: 1, distinct: true } } } as PendingDecision;
    return true;
  }
  return false;
}

export function boundOpponentDecisionLiveValid(state: GameState, decision: PendingDecision): boolean {
  const meta = decision.interaction; if (!meta || meta.kind !== 'bound_opponent_round_rule_v1') return false;
  const provider = sourceProvider(state, meta.sourceCardInstanceId, meta.abilityId); if (!provider || !bindAbility(provider.ability)) return false;
  const opponentIds = activeEngagedOpponentIds(state, meta.controllerId); const options = opponentIds.flatMap((id) => [1,2,3,4,5].map((penalty) => choiceId(id, penalty)));
  const target = decision.target; const count = obj(target.count) ? target.count : {};
  return decision.controllerId === meta.controllerId && decision.context.controllerId === meta.controllerId && decision.context.sourceCardId === meta.sourceCardInstanceId &&
    decision.context.abilityId === meta.abilityId && meta.round === state.round.roundNumber && meta.createdRevision === runtime(state).revision &&
    meta.continuationRef === `${decision.id}:continuation` && meta.template === 'target' && meta.visibility === 'owner_only' && meta.cancelPolicy === 'forbidden' &&
    meta.constraints.kind === 'target' && meta.constraints.targetKind === 'choice' && meta.constraints.min === 1 && meta.constraints.max === 1 && meta.constraints.distinct === true &&
    target.id === 'bound_opponent_power_choice' && target.type === 'choice' && count.min === 1 && count.max === 1 &&
    decision.min === 1 && decision.max === 1 && decision.remainingEffects.length === 0 &&
    JSON.stringify(meta.opponentIds) === JSON.stringify(opponentIds) && JSON.stringify(meta.options) === JSON.stringify(options) && JSON.stringify(decision.candidates) === JSON.stringify(options);
}
export function resolveBoundOpponentDecision(state: GameState, decision: PendingDecision, selectedIds: string[]): boolean {
  if (!boundOpponentDecisionLiveValid(state, decision) || selectedIds.length !== 1 || !decision.candidates.includes(selectedIds[0]!)) return false;
  const meta = decision.interaction!; if (meta.kind !== 'bound_opponent_round_rule_v1') return false;
  const selected = parseChoice(selectedIds[0]!); if (!selected || !meta.opponentIds.includes(selected.playerId)) return false;
  const target = state.players.find((entry) => entry.id === selected.playerId && entry.status === 'active'); if (!target) return false;
  const bag = flagBag(state, selected.playerId); bag[bindFlag(meta.sourceCardInstanceId, meta.abilityId)] = encodeBinding(meta.controllerId, meta.round, selected.penalty);
  runtime(state).roundPlayerPowerAdjustments ??= [];
  runtime(state).roundPlayerPowerAdjustments = runtime(state).roundPlayerPowerAdjustments!.filter((entry) =>
    !(entry.playerId === selected.playerId && entry.sourceCardId === meta.sourceCardInstanceId && entry.abilityId === meta.abilityId && entry.round === meta.round));
  runtime(state).roundPlayerPowerAdjustments!.push({ playerId: selected.playerId, amount: -selected.penalty, round: meta.round,
    sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId });
  runtime(state).events.push({ type: 'bound_opponent_round_rule_applied', playerId: selected.playerId, controllerId: meta.controllerId,
    sourceCardId: meta.sourceCardInstanceId, abilityId: meta.abilityId, delta: -selected.penalty });
  delete runtime(state).pendingDecision;
  return true;
}

function qualifyingVpSource(state: GameState, event: SafeEvent): boolean {
  if (!event.sourceCardId || !event.abilityId) return false;
  const source = state.cards.find((entry) => entry.instanceId === event.sourceCardId); const def = source && runtime(state).pack.cards[source.definitionId]; if (!source || !def) return false;
  if (!def.abilities.some((ability) => ability.id === event.abilityId)) return false;
  if (def.cardType === 'servant_skill' || def.cardType === 'command_spell') return true;
  const owner = state.players.find((entry) => entry.id === source.controllerPlayerId); return def.cardType === 'master_skill' && !!owner &&
    def.id === `${owner.masterCardId}.skill.ascension`;
}
function settleManaCrossingEvent(state: GameState, event: SafeEvent): void {
  if (!event.playerId || event.resource !== 'mana' || !Number.isSafeInteger(event.before) || !Number.isSafeInteger(event.after) ||
      !Number.isSafeInteger(event.delta) || Number(event.before) < 0 || Number(event.after) < 0 || Number(event.delta) >= 0 ||
      Number(event.after) - Number(event.before) !== Number(event.delta) || Number(event.before) <= 1 || Number(event.after) > 1) return;
  const before = Number(event.before); const after = Number(event.after);
  const player = state.players.find((entry) => entry.id === event.playerId && entry.status === 'active');
  if (!player || player.mana !== after) return;
  for (const provider of providers(state, manaCrossingAbility).filter((entry) => entry.controllerId === event.playerId)) {
    const key = crossingFlag(provider.sourceCardId, provider.ability.id); const bag = flagBag(state, provider.controllerId); if (bag[key] === true) continue;
    bag[key] = true; if (!removeOwnedDefinition(state, provider.controllerId, String(provider.ability.effects[0]!.definitionId))) throw new Error('DEFINITION_SKILL_REMOVAL_FAILED');
    runtime(state).events.push({ type: 'definition_skill_removed_on_first_mana_crossing', playerId: provider.controllerId,
      sourceCardId: provider.sourceCardId, abilityId: provider.ability.id, resource: 'mana', before, after });
  }
}
function settleVpConversionEvent(state: GameState, event: SafeEvent): void {
  if (!event.playerId || event.resource !== 'victory_points' || !Number.isSafeInteger(event.before) || !Number.isSafeInteger(event.after) ||
      !Number.isSafeInteger(event.delta) || Number(event.before) < 0 || Number(event.after) < 0 || Number(event.delta) <= 0 ||
      Number(event.after) - Number(event.before) !== Number(event.delta) || !qualifyingVpSource(state, event)) return;
  const recipient = state.players.find((entry) => entry.id === event.playerId && entry.status === 'active'); if (!recipient?.locationId) return;
  if (recipient.vp !== Number(event.after)) return;
  for (const provider of providers(state, vpConversionAbility)) {
    if (provider.controllerId === recipient.id) continue; const controller = state.players.find((entry) => entry.id === provider.controllerId && entry.status === 'active');
    if (!controller || controller.locationId !== recipient.locationId) continue;
    const gain = Number(event.delta); const corrected = Math.floor(gain / 2); const prevented = gain - corrected; if (prevented <= 0) continue;
    recipient.vp = Math.max(0, recipient.vp - prevented);
    const manaBefore = controller.mana; const manaLost = Math.min(manaBefore, prevented); controller.mana -= manaLost;
    const vpBefore = controller.vp; controller.vp += manaLost;
    runtime(state).events.push({ type: 'victory_points_adjusted', playerId: recipient.id, controllerId: provider.controllerId,
      sourceCardId: provider.sourceCardId, abilityId: provider.ability.id, resource: 'victory_points', delta: -prevented, before: recipient.vp + prevented, after: recipient.vp });
    if (manaLost > 0) runtime(state).events.push({ type: 'mana_adjusted', playerId: controller.id, controllerId: controller.id,
      sourceCardId: provider.sourceCardId, abilityId: provider.ability.id, resource: 'mana', delta: -manaLost, before: manaBefore, after: controller.mana });
    if (manaLost > 0) runtime(state).events.push({ type: 'victory_points_adjusted', playerId: controller.id, controllerId: controller.id,
      sourceCardId: provider.sourceCardId, abilityId: provider.ability.id, resource: 'victory_points', delta: manaLost, before: vpBefore, after: controller.vp });
  }
}
export function settleDefinitionResourceEvent(state: GameState, event: SafeEvent): void {
  // The crossing rule is cause-independent. Consume any authoritative typed mana
  // transaction with coherent before/after/delta provenance instead of narrowing
  // observation to two event names. Existing resource producers use several
  // specialized event types (for example lose-all-mana and post-play mana loss).
  if (event.resource === 'mana') settleManaCrossingEvent(state, event);
  if (event.type === 'victory_points_adjusted') settleVpConversionEvent(state, event);
}
export function settleDefinitionResourceAuditEvents(state: GameState, startIndex: number): void {
  const events = runtime(state).events; let index = Math.max(0, startIndex); let guard = 0;
  while (index < events.length) {
    if (++guard > 512) throw new Error('DEFINITION_RESOURCE_EVENT_LOOP');
    const event = events[index++]!;
    settleDefinitionResourceEvent(state, event);
  }
}

export function boundOpponentRoundMovementLocked(state: GameState, playerId: PlayerId): boolean {
  if (!state.abilityRuntime) return false;
  const bag = state.abilityRuntime.structuredPlayerFlagsByPlayer?.[playerId]; if (!bag) return false;
  return Object.entries(bag).some(([key, value]) => {
    if (!key.startsWith(FLAG_PREFIX + 'bound:')) return false; const parsed = parseBinding(value); if (!parsed || parsed.round !== state.round.roundNumber) return false;
    const suffix = key.slice((FLAG_PREFIX + 'bound:').length); const split = suffix.lastIndexOf(':'); if (split <= 0) return false;
    return !!persistedBoundProvider(state, suffix.slice(0, split), suffix.slice(split + 1));
  });
}
export function isBoundOpponentRoundPowerAdjustmentValid(state: GameState, entry: {
  playerId: PlayerId; amount: number; round: number; sourceCardId: string; abilityId: string;
}): boolean {
  if (!Number.isSafeInteger(entry.amount) || entry.amount > -1 || entry.amount < -5 || entry.round !== state.round.roundNumber) return false;
  const provider = persistedBoundProvider(state, entry.sourceCardId, entry.abilityId); if (!provider) return false;
  const raw = runtime(state).structuredPlayerFlagsByPlayer?.[entry.playerId]?.[bindFlag(entry.sourceCardId, entry.abilityId)];
  const parsed = parseBinding(raw);
  return !!parsed && parsed.controllerId === provider.controllerId && parsed.round === entry.round && parsed.penalty === -entry.amount;
}
export function settleBoundOpponentBattleOutcome(state: GameState, event: { type: string; battleParticipantIds?: PlayerId[]; battleResult?: { winners: PlayerId[]; loserIds: PlayerId[] } }): void {
  if (event.type !== 'after_battle_result_determined' || !event.battleResult || !event.battleParticipantIds) return;
  const losers = new Set(event.battleResult.loserIds.filter((id) => !event.battleResult!.winners.includes(id)));
  for (const targetId of event.battleParticipantIds.filter((id) => losers.has(id))) {
    const bag = runtime(state).structuredPlayerFlagsByPlayer?.[targetId]; if (!bag) continue;
    for (const [key, value] of Object.entries(bag)) {
      if (!key.startsWith(FLAG_PREFIX + 'bound:')) continue; const parsed = parseBinding(value); if (!parsed || parsed.round !== state.round.roundNumber) continue;
      const suffix = key.slice((FLAG_PREFIX + 'bound:').length); const split = suffix.lastIndexOf(':'); if (split <= 0) continue;
      const sourceCardId = suffix.slice(0, split); const abilityId = suffix.slice(split + 1); const provider = persistedBoundProvider(state, sourceCardId, abilityId);
      if (!provider) throw new Error('BOUND_OPPONENT_PROVENANCE_INVALID');
      if (provider.source.zone !== 'skill') continue;
      provider.source.zone = 'removed_from_game'; provider.source.visibility = { scope: 'owner_only', ownerPlayerId: provider.source.ownerPlayerId };
      const cardState = runtime(state).cardState[sourceCardId]; if (cardState) { cardState.active = false; cardState.faceDown = false; }
      runtime(state).events.push({ type: 'bound_opponent_source_removed_on_target_loss', playerId: targetId, controllerId: parsed.controllerId, sourceCardId, abilityId });
    }
  }
}
export function cleanupDefinitionResourceBindingRoundState(state: GameState, currentRound: number): void {
  for (const bag of Object.values(runtime(state).structuredPlayerFlagsByPlayer ?? {})) for (const [key, value] of Object.entries(bag)) {
    if (!key.startsWith(FLAG_PREFIX + 'bound:')) continue; const parsed = parseBinding(value); if (!parsed || parsed.round < currentRound) delete bag[key];
  }
}
export function definitionResourceBindingRuntimeValidForRestore(state: GameState): boolean {
  try {
    for (const [targetId, bag] of Object.entries(runtime(state).structuredPlayerFlagsByPlayer ?? {})) for (const [key, value] of Object.entries(bag)) {
      if (key.startsWith(FLAG_PREFIX + 'mana-crossed:')) {
        if (value !== true) return false; const suffix = key.slice((FLAG_PREFIX + 'mana-crossed:').length); const split = suffix.lastIndexOf(':');
        if (split <= 0 || !sourceProvider(state, suffix.slice(0, split), suffix.slice(split + 1))) return false;
      }
      if (key.startsWith(FLAG_PREFIX + 'provisioned:')) {
        if (value !== true) return false; const suffix = key.slice((FLAG_PREFIX + 'provisioned:').length); const split = suffix.lastIndexOf(':');
        if (split <= 0) return false; const provider = sourceProvider(state, suffix.slice(0, split), suffix.slice(split + 1));
        if (!provider || !provisionAbility(provider.ability) || provider.controllerId !== targetId) return false;
      }
      if (key.startsWith(FLAG_PREFIX + 'bound:')) {
        const parsed = parseBinding(value); if (!parsed || parsed.round !== state.round.roundNumber || !state.players.some((entry) => entry.id === targetId) || !state.players.some((entry) => entry.id === parsed.controllerId)) return false;
        const suffix = key.slice((FLAG_PREFIX + 'bound:').length); const split = suffix.lastIndexOf(':'); if (split <= 0) return false;
        const sourceCardId = suffix.slice(0, split); const abilityId = suffix.slice(split + 1); const provider = persistedBoundProvider(state, sourceCardId, abilityId);
        if (!provider || provider.controllerId !== parsed.controllerId) return false;
        if (!(runtime(state).roundPlayerPowerAdjustments ?? []).some((entry) => entry.playerId === targetId && entry.sourceCardId === sourceCardId && entry.abilityId === abilityId && entry.round === parsed.round && entry.amount === -parsed.penalty)) return false;
      }
    }
    return true;
  } catch { return false; }
}
