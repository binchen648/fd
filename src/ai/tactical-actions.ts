import type { AvailableAction } from "../application/integration-contract.ts";
import type { GameState } from "../domain/state/types.ts";
import type { CardDefinition, EventDefinition } from "../rules-core/content-types.ts";
import { createGameState } from "../domain/state/createGameState.ts";
import { projectPublicState } from "../projection/project-state.ts";
import { calculateCombatPower } from "../rules-core/combat-power.ts";
import { getCardPlayCost } from "../rules-core/costs.ts";
import { getPrintedCardBasePower } from "../rules-core/card-values.ts";
import { assertCardCanEnterAttack, getStandardAttackRequirements } from "../rules-core/card-rules.ts";
import { assertStructuredCardBatchAllowed, getStructuredStandardAttackCardCountRule } from "../rules-core/rule-modifiers.ts";
import { deployPlayer, movePlayer } from "../rules-core/board.ts";
import { CommandType } from "../match-engine/commands.ts";
import { useNormalCommandSeal, type NormalCommandSealPayload } from "../rules-core/normal-command-seal.ts";

/** A planning copy containing public information and this player's own cards only. */
export function tacticalKnowledge(state: GameState, actorId: string): GameState {
  const view = projectPublicState(state, actorId);
  const empty = createGameState({ gameInstanceId: state.gameInstanceId, players: Object.values(view.players), seed: 1 });
  const players = Object.fromEntries(Object.values(view.players).map(player => {
    const own = player.id === actorId;
    const attacks = Object.values(view.cards).filter(card => card.controllerPlayerId === player.id && card.zone === "attack").map(card => card.instanceId);
    const terrainSlot = player.locationId ? view.board.outpostRecords[player.locationId]?.indexOf(player.id) ?? -1 : -1;
    return [player.id, own ? { ...structuredClone(state.players[player.id]),
      // Even the bot must not plan around the order of its next draws.
      deck: Array.from({ length: player.deckCount }, (_, i) => `unknown-deck:${player.id}:${i}`),
    } : {
      ...empty.players[player.id], ...player, attack: attacks,
      // Counts are public; placeholders never disclose a hand or deck definition/order.
      hand: Array.from({ length: player.handCount }, (_, i) => `unknown-hand:${player.id}:${i}`),
      deck: Array.from({ length: player.deckCount }, (_, i) => `unknown-deck:${player.id}:${i}`),
      flags: { ...player.publicFlags, deploymentBonusActive: terrainSlot >= 0,
        deploymentLocationId: player.locationId ?? "", deploymentBonus: terrainSlot === 0 ? 3 : terrainSlot === 1 ? 1 : 0 },
    }];
  }));
  const cards = Object.fromEntries(Object.values(view.cards).map(card => [card.instanceId, {
    ...(card.ownerPlayerId === actorId && card.definitionId != null ? structuredClone(state.cards[card.instanceId]) : {}),
    ...card, definitionId: card.definitionId ?? "ai:hidden", modifiers: [], residual: false, temporary: false,
    active: card.definitionId !== null && card.active,
  }]));
  // Explicit planning surface: command queues and decision submissions are never copied.
  return { ...empty, status: view.status, mode: view.mode, modeState: view.modeState,
    round: view.round, phase: view.phase, step: view.step, activePlayerId: view.activePlayerId,
    turnOrder: [...view.turnOrder], board: structuredClone(view.board), players, cards,
    activeRuleModifiers: view.activeRuleModifiers.filter(modifier =>
      modifier.controllerPlayerId === actorId || (modifier.sourceInstanceId &&
        view.cards[modifier.sourceInstanceId]?.definitionId != null && view.cards[modifier.sourceInstanceId]?.face === "up")),
  } as GameState;
}

type AttackPayload = { faceUpInstanceIds?: string[]; faceDownInstanceIds?: string[] };
type Context = { actorId: string; definitions: Record<string, CardDefinition>; events: readonly EventDefinition[] };

function power(state: GameState, id: string, context: Context): number {
  return calculateCombatPower(state, state.players[id], context.definitions, state.players[id].locationId ?? undefined);
}

function attackCopy(state: GameState, payload: AttackPayload, context: Context): GameState {
  const next = structuredClone(state), player = next.players[context.actorId];
  for (const [face, ids] of [["up", payload.faceUpInstanceIds ?? []], ["down", payload.faceDownInstanceIds ?? []]] as const) {
    for (const id of ids) {
      const card = next.cards[id], definition = context.definitions[card?.definitionId];
      if (!card || !definition) continue;
      player.mana -= getCardPlayCost(state, definition, state.players[context.actorId], state.cards[id], context.definitions);
      player.hand = player.hand.filter(candidate => candidate !== id);
      if (!player.attack.includes(id)) player.attack.push(id);
      card.zone = "attack"; card.face = face; card.active = face === "up";
    }
  }
  return next;
}

function handPotential(state: GameState, id: string, context: Context): number {
  const definition = context.definitions[state.cards[id]?.definitionId];
  if (!definition) return 0;
  const player = state.players[context.actorId];
  const cost = Math.max(0, getCardPlayCost(state, definition, player, state.cards[id], context.definitions));
  return Math.max(0, getPrintedCardBasePower(state, player, definition)) / (cost + 1);
}

function locationValue(state: GameState, context: Context): number {
  const player = state.players[context.actorId], location = player.locationId;
  const late = state.round >= 10;
  const reserve = Math.min(8, player.mana) * (late ? .08 : .3) + player.hand.length * (late ? .12 : .65)
    + player.hand.reduce((sum, id) => sum + handPotential(state, id, context), 0) * (late ? .01 : .7);
  if (location === "scouting") return 8 + reserve;
  if (location === "workshop") return reserve + (player.mana < 5 ? 2 : .5);
  if (!location) return reserve;
  const opponents = (state.board.locations[location] ?? []).filter(id => id !== player.id && !state.players[id]?.eliminated);
  let probability = 1;
  const ownPower = power(state, player.id, context);
  for (const id of opponents) {
    const opponent = state.players[id], publicCards = Object.values(state.cards).filter(card => card.controllerPlayerId === id && card.zone === "attack");
    const hiddenCount = publicCards.filter(card => card.definitionId === "ai:hidden").length;
    const actorIndex = state.turnOrder.indexOf(player.id), opponentIndex = state.turnOrder.indexOf(id);
    const stillToPlay = state.phase === "outpost" || (state.phase === "action" && opponentIndex > actorIndex);
    const uncertainty = hiddenCount * 2 + (stillToPlay && opponent.hand.length ? Math.min(6, opponent.mana + 2) : 0);
    const threat = power(state, id, context) + uncertainty;
    const margin = ownPower - threat;
    // Exact public wins/ties matter; uncertain future plays are an estimate, never a peek.
    probability *= uncertainty ? Math.max(.05, Math.min(.95, .5 + margin / 12)) : margin > 0 ? 1 : margin === 0 ? .5 : 0;
  }
  if (state.phase === "action") {
    const route = ["workshop", "mountain", "city", "scouting"];
    const targetIndex = route.indexOf(location), actorIndex = state.turnOrder.indexOf(player.id);
    for (const id of state.turnOrder.slice(actorIndex + 1)) {
      const opponent = state.players[id];
      if (!opponent || opponent.eliminated || opponents.includes(id) || !opponent.hand.length) continue;
      const from = route.indexOf(opponent.locationId ?? "");
      if (from < 0 || from >= targetIndex) continue;
      // An already engaged opponent cannot freely leave its battlefield.
      if (from > 0 && (state.board.locations[opponent.locationId!] ?? []).length > 1) continue;
      const travelCost = route.slice(from + 1, targetIndex + 1).reduce((sum, destination) => sum + (destination === "mountain" ? 1 : 2), 0);
      if (opponent.mana < travelCost) continue;
      const potentialPower = Math.min(6, opponent.mana - travelCost + 2);
      const invasionRisk = Math.max(0, Math.min(1, (potentialPower - ownPower + 2) / 6));
      probability *= 1 - .35 * invasionRisk;
    }
  }
  const sealReward = player.flags.commandSealVictoryPointBonusRound === state.round ? Number(player.flags.commandSealVictoryPointBonus ?? 0) : 0;
  const reward = sealReward + (location === "city" ? 3 : 2) + (state.board.currentEvents[location] ?? []).reduce((sum, id) =>
    sum + (context.events.find(event => event.id === id)?.victoryPoints ?? (id === "event:hidden" ? 2 : 0)), 0);
  const leader = Math.max(...Object.values(state.players).filter(p => !p.eliminated).map(p => p.victoryPoints));
  const urgency = state.round >= 10 || player.victoryPoints < leader - 5 ? 1.25 : 1;
  return reserve + reward * 4 * probability * urgency - (1 - probability) * 2 - opponents.length * .12;
}

function bestHandValue(state: GameState, context: Context): number {
  const player = state.players[context.actorId];
  let best = locationValue(state, context);
  // Small, bounded one-turn lookahead for choosing a destination. Dispatch legality stays in the engine.
  const hand = player.hand.filter(id => context.definitions[state.cards[id]?.definitionId])
    .sort((a, b) => handPotential(state, b, context) - handPotential(state, a, context)).slice(0, 16);
  const requirements = getStandardAttackRequirements(player, state, context.definitions);
  const countRule = getStructuredStandardAttackCardCountRule(state, player.id, context.definitions);
  for (let i = 0; i < hand.length; i++) for (let j = i; j < hand.length; j++) {
    const ids = i === j ? [hand[i]] : [hand[i], hand[j]];
    const selected = ids.map(id => context.definitions[state.cards[id].definitionId]);
    const single = selected.some(definition => definition.singleCardPlay === true);
    const alreadyReduced = player.attack.some(id => context.definitions[state.cards[id]?.definitionId]?.tags?.includes("reduces-standard-attack-by-one"));
    const reduction = !alreadyReduced && selected.some(definition => definition.tags?.includes("reduces-standard-attack-by-one")) ? 1 : 0;
    const required = Math.max(1, requirements.requiredCards - reduction);
    // Do not value a fictional one-card win when the normal batch requires two.
    if (single ? ids.length !== 1 : countRule ? ids.length < countRule.minCount || ids.length > countRule.maxCount : ids.length !== required) continue;
    try {
      assertStructuredCardBatchAllowed(state, player.id, ids, context.definitions);
      for (const instanceId of ids) assertCardCanEnterAttack({ state, playerId: context.actorId,
        instanceId, definitions: context.definitions, faceDown: false, primitiveDragonActive: requirements.primitiveDragonActive });
    } catch { continue; }
    const next = attackCopy(state, { faceUpInstanceIds: ids }, context);
    if (next.players[context.actorId].mana < 0) continue;
    best = Math.max(best, locationValue(next, context));
  }
  return best;
}

function sealOpportunityCost(state: GameState, actorId: string): number {
  const remaining = state.players[actorId].commandSeals;
  // Early seals retain value for later rounds; the last seal is more scarce.
  // This is a planning cost, not a rule limit or an extra payment.
  return state.round >= 10 ? 2 + Math.max(0, 3 - remaining) * .5
    : 6 + Math.max(0, 11 - state.round) * .45 + Math.max(0, 3 - remaining) * 2;
}

/** Rank only engine-provided actions; never fabricate a target, batch, or command. */
export function rankTacticalActions(state: GameState, actorId: string, actions: readonly AvailableAction[],
  definitions: Record<string, CardDefinition>, events: readonly EventDefinition[]): AvailableAction[] {
  const knowledge = tacticalKnowledge(state, actorId), context = { actorId, definitions, events };
  const baseline = state.step === "move-decision" ? bestHandValue(knowledge, context) : locationValue(knowledge, context);
  const ranked = actions.map((action, index) => {
    let score = baseline;
    const payload = (action.payload ?? {}) as AttackPayload & { locationId?: string };
    try {
      if (action.commandType === CommandType.CommitAttack) score = locationValue(attackCopy(knowledge, payload, context), context);
      else if (action.commandType === CommandType.DeployPlayer || action.commandType === CommandType.MovePlayer) {
        const next = structuredClone(knowledge);
        if (action.commandType === CommandType.DeployPlayer) deployPlayer(next, actorId, payload.locationId as "workshop" | "mountain" | "city", definitions);
        else movePlayer(next, actorId, payload.locationId!, false, definitions);
        score = bestHandValue(next, context) - (action.commandType === CommandType.MovePlayer ? .2 : 0);
      } else if (action.commandType === CommandType.UseCommandSeal) {
        const next = structuredClone(knowledge);
        useNormalCommandSeal(next, actorId, action.payload as NormalCommandSealPayload, definitions);
        // A seal must improve the plan enough to justify consuming a limited resource.
        score = bestHandValue(next, context) - sealOpportunityCost(knowledge, actorId);
      } else if (action.commandType !== CommandType.CompletePlayerWindow && action.commandType !== CommandType.CompleteCombatResponse) score = Number.NEGATIVE_INFINITY;
    } catch { score = Number.NEGATIVE_INFINITY; }
    return { action, score, index };
  });
  // Compare incremental benefit against the best ordinary plan, not doing nothing.
  // At a movement window, CompletePlayerWindow already scores the stay-and-play plan.
  const ordinaryBest = Math.max(baseline, ...ranked.filter(item => item.action.commandType !== CommandType.UseCommandSeal).map(item => item.score));
  for (const item of ranked) if (item.action.commandType === CommandType.UseCommandSeal && item.score <= ordinaryBest + .001) {
    item.score = Number.NEGATIVE_INFINITY;
  }
  return ranked.sort((a, b) => b.score - a.score || a.index - b.index).map(item => item.action);
}
