/**
 * Extended effect handlers for 5 servants
 * This module adds support for new effect types needed by:
 * - Achilles (random discard, battlefield lock, terrain immunity)
 * - Artoria Alter (noble phantasm forbid, situation ignore)
 * - Ereshkigal (situation modifier reverse, deploy trigger)
 * - Bae (terrain multiplier, seat position check)
 * - Kintoki (zone to skill move, mana requirement ignore)
 */

import type { GameState } from '../schema/game';
import type { RuleNode } from './types';
import { node, str } from './loader';
import { clearTransientCardTransformState } from './card-instance-state';

function modeState(state: GameState): Record<string, any> {
  (state as any).modeState = (state as any).modeState || {};
  return (state as any).modeState;
}

function pushMasterDirective(
  state: GameState,
  controllerId: string,
  effect: RuleNode,
  payload: Record<string, unknown> = {}
): void {
  const store = modeState(state);
  store.masterDirectives = store.masterDirectives || [];
  store.masterDirectives.push({
    controllerId,
    directive: str(effect.directive) || str(effect.type),
    ...payload,
    ...(effect.payload && typeof effect.payload === 'object' ? effect.payload : {}),
  });
}

function directiveContext(context?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...(context?.sourceCardId ? { sourceCardId: context.sourceCardId } : {}),
    ...(context?.abilityId ? { abilityId: context.abilityId } : {}),
  };
}

function isActiveFieldCard(state: GameState, card: GameState['cards'][number]): boolean {
  return ['field', 'attack_area'].includes(card.zone) && (((state as any).abilityRuntime?.cardState?.[card.instanceId]?.active === true) || (card as any).active === true);
}

function sourceCardId(context?: Record<string, unknown>): string {
  return typeof context?.sourceCardId === 'string' ? context.sourceCardId : '';
}

function abilityId(context?: Record<string, unknown>): string {
  return typeof context?.abilityId === 'string' ? context.abilityId : '';
}

function selected(context: Record<string, unknown> | undefined, targetRef: string): string | undefined {
  const selections = context?.selections as Record<string, string[] | undefined> | undefined;
  return selections?.[targetRef]?.[0];
}

/** Check if a condition is met */
export function checkExtendedCondition(
  state: GameState,
  controllerId: string,
  condition: RuleNode,
  _context?: Record<string, unknown>
): boolean {
  const p = state.players.find(p => p.id === controllerId);
  if (!p) return false;

  switch (str(condition.type)) {
    case 'controller_seat_in_first_half': {
      // Check if controller's seat is in the first half of eligible players
      const eligiblePlayers = state.players.filter(pl => pl.status === 'active')
        .sort((a, b) => a.seat - b.seat);
      const firstHalfCount = Math.floor(eligiblePlayers.length / 2);
      const playerIndex = eligiblePlayers.findIndex(pl => pl.id === controllerId);
      return playerIndex >= 0 && playerIndex < firstHalfCount;
    }
    case 'controller_at_battlefield': {
      return p.locationId === 'miyama_town' || p.locationId === 'shinto';
    }
    case 'controller_servant_revealed': {
      return (state as any).abilityRuntime?.revealedServants?.includes(controllerId) ?? false;
    }
    case 'not_location_kind': {
      const locationId = str(condition.locationKind);
      return p.locationId !== locationId;
    }
    case 'controller_at_battlefield_with_exactly_one_opponent': {
      const opponents = state.players.filter(pl =>
        pl.id !== controllerId &&
        pl.status === 'active' &&
        pl.locationId === p.locationId
      );
      return (p.locationId === 'miyama_town' || p.locationId === 'shinto') && opponents.length === 1;
    }
    case 'controller_played_highest_cost_noble_phantasm_in_battle_this_round': {
      // Check if the controller played the highest cost noble phantasm this round
      const r = (state as any).abilityRuntime;
      if (!r) return false;
      const costs = r.noblePhantasmCostsThisRound?.[controllerId] ?? [];
      if (costs.length === 0) return false;
      const highestCost = Math.max(...costs.map((c: any) => c.cost));
      // Check if any of the highest cost cards were played
      return costs.some((c: any) => c.cost === highestCost);
    }
    case 'highest_cost_noble_phantasm_cost_at_least': {
      // Check if the highest cost noble phantasm this round has cost >= value
      const r = (state as any).abilityRuntime;
      if (!r) return false;
      const costs = r.noblePhantasmCostsThisRound?.[controllerId] ?? [];
      if (costs.length === 0) return false;
      const highestCost = Math.max(...costs.map((c: any) => c.cost));
      return highestCost >= Number(condition.value ?? 0);
    }
    default:
      return false;
  }
}

/** Resolve an extended effect */
export function resolveExtendedEffect(
  state: GameState,
  controllerId: string,
  effect: RuleNode,
  context?: Record<string, unknown>
): void {
  const p = state.players.find(p => p.id === controllerId);
  if (!p) return;

  switch (str(effect.type)) {
    case 'opponents_random_discard': {
      const count = Number(effect.count ?? 1);
      const opponents = state.players.filter(pl =>
        pl.id !== controllerId &&
        pl.status === 'active' &&
        pl.locationId === p.locationId
      );
      for (const opponent of opponents) {
        const handCards = state.cards.filter(c =>
          c.ownerPlayerId === opponent.id &&
          c.zone === 'hand' &&
          c.visibility?.scope === 'owner_only'
        );
        const discardCount = Math.min(count, handCards.length);
        for (let i = 0; i < discardCount; i++) {
          const randomIndex = Math.floor(Math.random() * handCards.length);
          const card = handCards.splice(randomIndex, 1)[0];
          if (card) {
            card.zone = 'discard';
            card.visibility = { scope: 'public' };
          }
        }
      }
      break;
    }
    case 'lock_battlefield': {
      // Mark the current battlefield as locked for this round
      const locationId = p.locationId;
      if (locationId) {
        (state as any).modeState = (state as any).modeState || {};
        (state as any).modeState.lockedBattlefields = (state as any).modeState.lockedBattlefields || [];
        (state as any).modeState.lockedBattlefields.push({
          locationId,
          lockedBy: controllerId,
          duration: str(effect.duration) || 'this_round'
        });
      }
      break;
    }
    case 'exclude_from_terrain_and_external_effects': {
      // Mark controller and opponents as immune to terrain and external effects
      const locationId = p.locationId;
      if (locationId) {
        (state as any).modeState = (state as any).modeState || {};
        (state as any).modeState.terrainImmunity = (state as any).modeState.terrainImmunity || [];
        (state as any).modeState.terrainImmunity.push({
          locationId,
          immunePlayers: [controllerId, ...state.players
            .filter(pl => pl.id !== controllerId && pl.status === 'active' && pl.locationId === locationId)
            .map(pl => pl.id)]
        });
      }
      break;
    }
    case 'set_opponent_power_to_zero': {
      const opponents = state.players.filter(pl =>
        pl.id !== controllerId &&
        pl.status === 'active' &&
        pl.locationId === p.locationId
      );
      for (const opponent of opponents) {
        const attackCards = state.cards.filter(c =>
          c.ownerPlayerId === opponent.id &&
          isActiveFieldCard(state, c)
        );
        for (const card of attackCards) {
          (card as any).powerModifiers = (card as any).powerModifiers || [];
          (card as any).powerModifiers.push({
            id: `zero-${controllerId}-${card.instanceId}`,
            sourceId: 'extended-effect',
            kind: 'set',
            value: 0,
            duration: 'round'
          });
        }
      }
      break;
    }
    case 'forbid_opponents_noble_phantasm': {
      const opponents = state.players.filter(pl =>
        pl.id !== controllerId &&
        pl.status === 'active' &&
        pl.locationId === p.locationId
      );
      for (const opponent of opponents) {
        (state as any).modeState = (state as any).modeState || {};
        (state as any).modeState.forbiddenCardTypes = (state as any).modeState.forbiddenCardTypes || [];
        (state as any).modeState.forbiddenCardTypes.push({
          playerId: opponent.id,
          forbiddenType: 'noble_phantasm',
          duration: 'while_active'
        });
      }
      break;
    }
    case 'create_status': {
      const statusId = str(effect.statusId);
      const duration = str(effect.duration) || 'this_round';
      (state as any).activeStatuses = (state as any).activeStatuses || [];
      (state as any).activeStatuses.push({
        id: statusId,
        sourceControllerId: controllerId,
        duration,
        locationId: p.locationId
      });
      break;
    }
    case 'record_master_directive': {
      pushMasterDirective(state, controllerId, effect, directiveContext(context));
      break;
    }
    case 'movement_rule_override': {
      state.ruleOverrides = state.ruleOverrides || {};
      const rule = str(effect.rule);
      if (rule === 'reverse_arrow_movement') {
        state.ruleOverrides.reverseArrowMovementPlayerIds = [...new Set([
          ...(state.ruleOverrides.reverseArrowMovementPlayerIds ?? []),
          controllerId,
        ])];
      }
      break;
    }
    case 'deployment_rule_override': {
      state.ruleOverrides = state.ruleOverrides || {};
      const rule = str(effect.rule);
      if (rule === 'must_deploy_to_battlefield') {
        state.ruleOverrides.mustDeployToBattlefieldPlayerIds = [...new Set([
          ...(state.ruleOverrides.mustDeployToBattlefieldPlayerIds ?? []),
          controllerId,
        ])];
      }
      break;
    }
    case 'adjust_command_seals': {
      const current = Number((p as any).commandSpells ?? 3);
      const amount = Number(effect.amount ?? 0);
      (p as any).commandSpells = Math.max(0, current + amount);
      pushMasterDirective(state, controllerId, effect, { ...directiveContext(context), amount, commandSpells: (p as any).commandSpells });
      break;
    }
    case 'set_mana': {
      const amount = Number(effect.amount ?? 0);
      p.mana = Math.max(0, amount);
      pushMasterDirective(state, controllerId, effect, { ...directiveContext(context), amount });
      break;
    }
    case 'create_independent_deck': {
      const deckId = str(effect.deckId);
      const definitionId = str(effect.definitionId);
      const quantity = Math.max(0, Number(effect.quantity ?? 0));
      for (let i = 0; i < quantity; i++) {
        state.cards.push({
          instanceId: `${deckId || 'independent'}-${controllerId}-${i + 1}`,
          definitionId,
          ownerPlayerId: controllerId,
          controllerPlayerId: controllerId,
          zone: 'independent_deck',
          visibility: { scope: 'owner_only', ownerPlayerId: controllerId },
        } as any);
      }
      pushMasterDirective(state, controllerId, effect, { ...directiveContext(context), deckId, definitionId, quantity });
      break;
    }
    case 'draw_from_independent_deck': {
      const deckId = str(effect.deckId);
      const top = state.cards.find(c =>
        c.ownerPlayerId === controllerId &&
        c.zone === 'independent_deck' &&
        (!deckId || c.instanceId.startsWith(`${deckId}-${controllerId}-`))
      );
      if (top) {
        top.zone = 'hand';
        top.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
      }
      pushMasterDirective(state, controllerId, effect, { ...directiveContext(context), deckId, moved: top ? 1 : 0 });
      break;
    }
    case 'activate_card_by_id': {
      const definitionId = str(effect.definitionId);
      const target = state.cards.find(c => c.ownerPlayerId === controllerId && c.definitionId === definitionId);
      if (target) {
        target.zone = 'field';
        target.visibility = { scope: 'public' };
        (target as any).active = true;
        const runtime = (state as any).abilityRuntime;
        if (runtime) {
          runtime.cardState[target.instanceId] = {
            active: true,
            faceDown: false,
            playedRound: state.round.roundNumber,
          };
        }
      }
      pushMasterDirective(state, controllerId, effect, { ...directiveContext(context), definitionId, activated: target ? 1 : 0 });
      break;
    }
    case 'replace_card_in_deck': {
      const definitionId = str(effect.definitionId);
      const targetRef = str(effect.target);
      const selections = (context?.selections ?? {}) as Record<string, string[] | undefined>;
      const selectedTargetId = targetRef ? selections[targetRef]?.[0] : undefined;
      const target = selectedTargetId
        ? state.cards.find(c =>
            c.instanceId === selectedTargetId &&
            c.ownerPlayerId === controllerId &&
            c.zone === 'deck' &&
            c.definitionId !== definitionId
          )
        : state.cards.find(c =>
            c.ownerPlayerId === controllerId &&
            c.zone === 'deck' &&
            c.definitionId !== definitionId
          );
      if (target && definitionId) {
        target.definitionId = definitionId;
        target.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
      }
      pushMasterDirective(state, controllerId, effect, {
        ...directiveContext(context),
        definitionId,
        replaced: target ? 1 : 0,
        replacedInstanceId: target?.instanceId,
      });
      break;
    }
    case 'attach_card_to_player_attack': {
      const targetPlayerId = selected(context, str(effect.target));
      if (!targetPlayerId || targetPlayerId === controllerId) break;
      const cardId = str(effect.cardId);
      const support = state.cards.find(c =>
        c.ownerPlayerId === controllerId &&
        c.definitionId === cardId &&
        ['skill', 'hand'].includes(c.zone));
      if (!support) break;
      support.zone = 'attack_area';
      support.controllerPlayerId = targetPlayerId;
      support.visibility = { scope: 'public' };
      const runtime = (state as any).abilityRuntime;
      runtime.cardState[support.instanceId] = {
        active: true,
        faceDown: false,
        playedRound: state.round.roundNumber,
      };
      const store = modeState(state);
      store.supportShotAttachments = store.supportShotAttachments || [];
      store.supportShotAttachments.push({
        sourceOwnerId: controllerId,
        targetPlayerId,
        cardInstanceId: support.instanceId,
        sourceCardId: sourceCardId(context),
        abilityId: abilityId(context),
        returnAtRoundEnd: effect.returnAtRoundEnd !== false,
      });
      if (effect.controllerCannotWinStatus) {
        (state as any).activeStatuses = (state as any).activeStatuses || [];
        (state as any).activeStatuses.push({
          id: str(effect.controllerCannotWinStatus),
          sourceControllerId: controllerId,
          duration: 'this_round',
        });
      }
      break;
    }
    case 'append_only_rule': {
      break;
    }
    case 'transfer_vp_to_owner': {
      const amount = Math.max(0, Number(effect.amount ?? 0));
      const source = state.cards.find(c => c.instanceId === sourceCardId(context));
      const owner = source ? state.players.find(candidate => candidate.id === source.ownerPlayerId) : undefined;
      if (!owner || owner.id === controllerId || amount <= 0) break;
      const payer = state.players.find(candidate => candidate.id === controllerId);
      if (!payer) break;
      const paid = Math.min(amount, payer.vp);
      payer.vp -= paid;
      owner.vp += paid;
      modeState(state).vpTransfers = [
        ...((modeState(state).vpTransfers as Array<Record<string, unknown>> | undefined) ?? []),
        { fromPlayerId: controllerId, toPlayerId: owner.id, amount: paid, sourceCardId: source?.instanceId, abilityId: abilityId(context) },
      ];
      break;
    }
    case 'look_at_match_deck_bottoms': {
      const deckKinds = Array.isArray(effect.deckKinds) ? effect.deckKinds.map(String) : ['situation', 'event'];
      const looked: Record<string, string | undefined> = {};
      if (deckKinds.includes('situation')) looked.situation = state.situationDeck?.[state.situationDeck.length - 1];
      if (deckKinds.includes('event')) looked.event = state.eventDeck?.[state.eventDeck.length - 1];
      modeState(state).lookedMatchDeckBottoms = {
        controllerId,
        sourceCardId: sourceCardId(context),
        abilityId: abilityId(context),
        looked,
      };
      break;
    }
    case 'swap_revealed_with_deck_bottom': {
      const event = context?.event as { revealedKind?: string; revealedId?: string; locationId?: string } | undefined;
      const kind = str(effect.revealedKind) || event?.revealedKind;
      if (kind === 'situation') {
        const bottom = state.situationDeck?.pop();
        if (bottom && state.currentSituationCardId) {
          const previous = state.currentSituationCardId;
          state.currentSituationCardId = bottom;
          state.situationDeck = [previous, ...(state.situationDeck ?? [])];
          modeState(state).chaldeasSwaps = [...((modeState(state).chaldeasSwaps as Array<Record<string, unknown>> | undefined) ?? []), {
            controllerId,
            kind,
            previous,
            replacement: bottom,
            sourceCardId: sourceCardId(context),
            abilityId: abilityId(context),
          }];
        }
      }
      if (kind === 'event') {
        const bottom = state.eventDeck?.pop();
        const placement = state.eventPlacements.find(candidate =>
          candidate.eventCardId === event?.revealedId &&
          (!event?.locationId || candidate.locationId === event.locationId));
        if (bottom && placement) {
          const previous = placement.eventCardId;
          placement.eventCardId = bottom;
          state.eventDeck = [previous, ...(state.eventDeck ?? [])];
          modeState(state).chaldeasSwaps = [...((modeState(state).chaldeasSwaps as Array<Record<string, unknown>> | undefined) ?? []), {
            controllerId,
            kind,
            locationId: placement.locationId,
            previous,
            replacement: bottom,
            sourceCardId: sourceCardId(context),
            abilityId: abilityId(context),
          }];
        }
      }
      break;
    }
    case 'soul_drag_power_bonus': {
      const runtime = (state as any).abilityRuntime;
      const amount = Math.ceil(state.round.roundNumber / 2);
      runtime.ongoingEffects.push({
        id: `${sourceCardId(context)}:${abilityId(context)}:soul-drag`,
        sourceCardId: sourceCardId(context),
        abilityId: abilityId(context),
        controllerId,
        starts: 'immediate',
        duration: 'while_card_active',
        startRound: state.round.roundNumber,
        cleanup: 'when_card_leaves_active_area',
        sourceMustRemainActive: true,
        ruleModifiers: [{
          sourceCardId: sourceCardId(context),
          controllerId,
          definition: {
            id: 'soul_drag_power_bonus',
            operation: 'add',
            rule: 'card.currentPower',
            scope: { controller: 'self' },
            value: amount,
          },
        }],
        publicZones: [],
      });
      break;
    }
    case 'transform_to_return_silence_on_loss': {
      const runtime = state.abilityRuntime;
      const sourceId = sourceCardId(context);
      const source = state.cards.find((card) => card.instanceId === sourceId);
      const sourceState = runtime?.cardState[sourceId];
      if (!runtime || !source || !['field', 'attack_area'].includes(source.zone) || sourceState?.active !== true || sourceState.faceDown) break;
      runtime.transformedReturnSilenceSourceCardIds = [...new Set([
        ...(runtime.transformedReturnSilenceSourceCardIds ?? []),
        sourceId,
      ])];
      break;
    }
    case 'return_silence_battle_start': {
      const sourceId = sourceCardId(context);
      if (!state.abilityRuntime?.transformedReturnSilenceSourceCardIds?.includes(sourceId)) break;
      state.ruleOverrides = state.ruleOverrides || {};
      state.ruleOverrides.mustDeployToBattlefieldPlayerIds = [...new Set([
        ...(state.ruleOverrides.mustDeployToBattlefieldPlayerIds ?? []),
        controllerId,
      ])];
      break;
    }
    case 'false_attendant_book_replacement': {
      const store = modeState(state);
      if (store.falseAttendantBookResolved?.[controllerId]) break;
      store.falseAttendantBookResolved = { ...(store.falseAttendantBookResolved ?? {}), [controllerId]: true };
      const controller = state.players.find(candidate => candidate.id === controllerId);
      if (!controller) break;
      const sakuraMasterId = str(effect.sakuraMasterId) || 'master.sakura';
      const sakuraInPlay = state.players.some(candidate => candidate.masterCardId === sakuraMasterId);
      if (sakuraInPlay) {
        const unused = ((store.unownedServantPool as string[] | undefined) ?? [])
          .find(servantId => !state.players.some(candidate => candidate.servantCardId === servantId));
        if (unused) {
          controller.servantCardId = unused;
          (controller as any).commandSpells = 3;
          store.unownedServantPool = ((store.unownedServantPool as string[] | undefined) ?? []).filter(id => id !== unused);
          state.log.push({ type: 'identity_replaced', message: `player:${controllerId}:servant->${unused}`, payload: { playerId: controllerId, role: 'servant', newCardId: unused } });
        } else {
          state.log.push({ type: 'replacement_missing_servant_pool', message: `player:${controllerId}:false_attendant_book`, payload: { playerId: controllerId } });
        }
      } else if ((state as any).abilityRuntime?.pack?.cards?.[sakuraMasterId]) {
        controller.masterCardId = sakuraMasterId;
        controller.mana = Number((state as any).abilityRuntime.pack.cards[sakuraMasterId].cardFace?.initialMana ?? 4);
        (controller as any).commandSpells = 2;
        state.log.push({ type: 'identity_replaced', message: `player:${controllerId}:master->${sakuraMasterId}`, payload: { playerId: controllerId, role: 'master', newCardId: sakuraMasterId, preserveVictoryPoints: true } });
      } else {
        (controller as any).commandSpells = 2;
        controller.mana = 4;
        state.log.push({ type: 'replacement_missing_master_asset', message: `player:${controllerId}:master->${sakuraMasterId}`, payload: { playerId: controllerId, requestedMasterId: sakuraMasterId, preserveVictoryPoints: true } });
      }
      break;
    }
    case 'terrain_multiplier': {
      const multiplier = Number(effect.value ?? 2);
      // Apply terrain multiplier to controller's terrain bonus
      (state as any).modeState = (state as any).modeState || {};
      (state as any).modeState.terrainMultipliers = (state as any).modeState.terrainMultipliers || [];
      (state as any).modeState.terrainMultipliers.push({
        playerId: controllerId,
        multiplier,
        duration: 'this_round',
        ...directiveContext(context),
      });
      break;
    }
    case 'reduce_opponents_power': {
      const amount = Number(effect.amount ?? 0);
      const condition = str(effect.condition);
      const opponents = state.players.filter(pl =>
        pl.id !== controllerId &&
        pl.status === 'active' &&
        pl.locationId === p.locationId
      );
      for (const opponent of opponents) {
        // Check condition if specified
        if (condition === 'opponent_has_no_terrain') {
          // Simplified: assume opponent has no terrain for now
          const attackCards = state.cards.filter(c =>
            c.ownerPlayerId === opponent.id &&
            isActiveFieldCard(state, c)
          );
          for (const card of attackCards) {
            (card as any).powerModifiers = (card as any).powerModifiers || [];
            (card as any).powerModifiers.push({
              id: `reduce-${controllerId}-${card.instanceId}`,
              sourceId: 'extended-effect',
              kind: 'add',
              value: -amount,
              duration: 'round'
            });
          }
        }
      }
      break;
    }
    case 'move_card_from_zone_to_skill': {
      const cardId = str(effect.cardId);
      const targetCard = state.cards.find(c =>
        c.definitionId === cardId &&
        c.ownerPlayerId === controllerId
      );
      if (targetCard) {
        targetCard.zone = 'skill';
        targetCard.visibility = { scope: 'owner_only', ownerPlayerId: controllerId };
        clearTransientCardTransformState(state, targetCard.instanceId);
      }
      break;
    }
    case 'close_source_card': {
      // Close the source card (move to skill for servant skills)
      const sourceCardId = (context as any)?.sourceCardId;
      if (sourceCardId) {
        const sourceCard = state.cards.find(c => c.instanceId === sourceCardId);
        if (sourceCard) {
          sourceCard.zone = 'skill';
          (sourceCard as any).active = false;
          if (state.abilityRuntime?.cardState[sourceCard.instanceId]) state.abilityRuntime.cardState[sourceCard.instanceId]!.active = false;
          clearTransientCardTransformState(state, sourceCard.instanceId);
        }
      }
      break;
    }
    case 'choice_is': {
      // This is handled by the branch logic, just pass through
      break;
    }
    case 'hide_servant_true_name': {
      // Hide servant true name
      const runtime = (state as any).abilityRuntime;
      if (runtime) {
        runtime.revealedServants = runtime.revealedServants.filter((id: string) => id !== controllerId);
      }
      break;
    }
    case 'reverse_situation_event_power_modifiers':
    case 'reverse_situation_and_event_power_modifiers': {
      // Reverse all power modifiers from situation and event cards for players at this location
      // This is Ereshkigal's Netherworld Protection effect
      const locationId = p.locationId;
      if (!locationId) break;
      
      // Get all players at this location
      const playersAtLocation = state.players.filter(pl => 
        pl.status === 'active' && pl.locationId === locationId
      );
      
      // Mark the location as having reversed modifiers
      (state as any).modeState = (state as any).modeState || {};
      (state as any).modeState.reversedModifierLocations = (state as any).modeState.reversedModifierLocations || [];
      (state as any).modeState.reversedModifierLocations.push({
        locationId,
        sourceControllerId: controllerId,
        exemptPlayers: [controllerId], // Ereshkigal herself is exempt
        duration: 'while_active'
      });
      
      // Apply immediate reversal to existing modifiers
      for (const player of playersAtLocation) {
        if (player.id === controllerId) continue; // Skip Ereshkigal
        
        // Find all attack cards for this player at this location
        const attackCards = state.cards.filter(c => 
        c.ownerPlayerId === player.id && 
          isActiveFieldCard(state, c)
        );
        
        for (const card of attackCards) {
          const modifiers = (card as any).powerModifiers || [];
          // Add a reversal modifier
          const reversalId = `netherworld-reversal-${controllerId}-${card.instanceId}`;
          if (!modifiers.some((m: any) => m.id === reversalId)) {
            modifiers.push({
              id: reversalId,
              sourceId: 'netherworld-protection',
              kind: 'reverse_situation_event',
              duration: 'while_active'
            });
            (card as any).powerModifiers = modifiers;
          }
        }
      }
      break;
    }
    case 'create_modifier': {
      // Create a power modifier for a target
      const modifier = node(effect.modifier);
      if (!modifier) break;
      
      const target = str(effect.target) || 'controller';
      const playerId = target === 'controller' ? controllerId : target;
      
      // Find the target player's cards
      const targetCards = state.cards.filter(c => 
        c.ownerPlayerId === playerId && 
        isActiveFieldCard(state, c)
      );
      
      // Apply modifier to all eligible cards
      for (const card of targetCards) {
        const modifiers = (card as any).powerModifiers || [];
        const modifierId = `modifier-${controllerId}-${card.instanceId}-${Date.now()}`;
        modifiers.push({
          id: modifierId,
          sourceId: 'create_modifier',
          kind: str(modifier.kind) || 'add',
          value: Number(modifier.value ?? 0),
          duration: str(modifier.duration) || 'round'
        });
        (card as any).powerModifiers = modifiers;
      }
      break;
    }
    default:
      // Unknown effect type - log but don't throw
      console.warn(`Unknown extended effect type: ${effect.type}`);
  }
}

/** Get extended legal actions */
export function getExtendedLegalActions(
  _state: GameState,
  _playerId: string
): Array<{ type: string; cardInstanceId?: string; abilityId?: string }> {
  // For now, return empty - legal actions are handled by the main interpreter
  return [];
}
