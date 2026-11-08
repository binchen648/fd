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
import type { AbilityEvent, RuleNode } from './types';
import { str } from './loader';
import { currentMatchDeckBottom, swapMatchReveal } from './chaldeas-reveal';
import { clearTransientCardTransformState } from './card-instance-state';
import { boundCardInfo } from './binding-cards';
import { installStatus } from './status';


/** Deterministic draw: uses the ability runtime's xorshift seed so replays stay reproducible. */
function seededIndex(state: GameState, length: number): number {
  const runtime = (state as any).abilityRuntime;
  if (!runtime || typeof runtime.randomState !== 'number' || length <= 1) return 0;
  let seed = runtime.randomState;
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  runtime.randomState = seed >>> 0;
  return Math.floor((runtime.randomState / 0x100000000) * length);
}
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
    round: state.round.roundNumber,
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

/**
 * Legacy adapter: 条件判定已全部收敛到 `interpreter` 的 `condition()`。
 * 这里保留空实现只是为了让旧调用点继续编译；**不要再往里加条件**。
 */
export function checkExtendedCondition(
  _state: GameState,
  _controllerId: string,
  _condition: RuleNode,
  _context?: Record<string, unknown>
): boolean {
  return false;
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
      const discardedIds: string[] = [];
      const affected: string[] = [];
      const byTarget: Array<{ playerId: string; cardIds: string[]; cards: ReturnType<typeof boundCardInfo>[]; flags: Record<string, boolean> }> = [];
      for (const opponent of opponents) {
        const handCards = state.cards.filter(c =>
          c.ownerPlayerId === opponent.id &&
          c.zone === 'hand' &&
          c.visibility?.scope === 'owner_only'
        );
        const discardCount = Math.min(count, handCards.length);
        for (let i = 0; i < discardCount; i++) {
          const randomIndex = seededIndex(state, handCards.length);
          const card = handCards.splice(randomIndex, 1)[0];
          if (card) {
            card.zone = 'discard';
            card.visibility = { scope: 'public' };
            discardedIds.push(card.instanceId);
          }
        }
        if (discardCount > 0) {
          affected.push(opponent.id);
          const cards = discardedIds.slice(-discardCount).map(id => boundCardInfo(state, controllerId, id));
          const visible = cards.filter(card => !card.redacted);
          byTarget.push({
            playerId: opponent.id,
            cardIds: cards.map(card => card.cardId),
            cards,
            flags: {
              lacks_luck_or_agility: visible.length > 0 && visible.every(card =>
                !(card.attributes ?? []).some(attribute => attribute === '幸运' || attribute === '敏捷')),
            },
          });
        }
      }
      const bindings = context?.bindings as Record<string, unknown> | undefined;
      const bindingId = str(effect.bind);
      if (bindings && bindingId) {
        bindings[bindingId] = {
          effectType: 'opponents_random_discard',
          affectedCount: discardedIds.length,
          affectedPlayerIds: affected,
          affectedCardIds: discardedIds,
          affectedCards: discardedIds.map(id => boundCardInfo(state, controllerId, id)),
          byTarget,
        };
      }
      break;
    }
    case 'create_status': {
      installStatus(state, {
        id: str(effect.statusId),
        controllerId,
        duration: str(effect.duration) || 'this_round',
        ...(Number.isFinite(Number(effect.rounds)) ? { rounds: Number(effect.rounds) } : {}),
        sourceCardId: sourceCardId(context),
        sourceAbilityId: abilityId(context),
        ...(p.locationId ? { locationId: p.locationId } : {}),
      });
      break;
    }
    case 'record_master_directive': {
      pushMasterDirective(state, controllerId, effect, directiveContext(context));
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
        installStatus(state, {
          id: str(effect.controllerCannotWinStatus),
          controllerId,
          duration: 'this_round',
          sourceCardId: sourceCardId(context),
          sourceAbilityId: abilityId(context),
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
      if (deckKinds.includes('situation')) looked.situation = currentMatchDeckBottom(state, 'situation');
      if (deckKinds.includes('event')) looked.event = currentMatchDeckBottom(state, 'event');
      modeState(state).lookedMatchDeckBottoms = {
        controllerId,
        sourceCardId: sourceCardId(context),
        abilityId: abilityId(context),
        looked,
      };
      (state as any).abilityRuntime.events.push({
        type: 'match_deck_bottom_looked',
        playerId: controllerId,
        sourceCardId: sourceCardId(context),
        abilityId: abilityId(context),
        visibility: controllerId,
        details: looked,
      });
      break;
    }
    case 'swap_revealed_with_deck_bottom': {
      swapMatchReveal(state, sourceCardId(context), context?.event as AbilityEvent | undefined);
      break;
    }
    case 'soul_drag_power_bonus': {
      const runtime = state.abilityRuntime;
      const source = state.cards.find(card => card.instanceId === sourceCardId(context));
      const activation = source && runtime?.cardState[source.instanceId];
      if (!runtime || !source || !['field', 'attack_area'].includes(source.zone) ||
          activation?.active !== true || activation.faceDown === true) break;
      const activationRound = activation.playedRound;
      if (!Number.isSafeInteger(activationRound) || activationRound! < 1 || activationRound! > state.round.roundNumber) {
        throw new Error('Soul Drag requires a valid activation round');
      }
      const id = `${source.instanceId}:${abilityId(context)}:soul-drag`;
      if (runtime.ongoingEffects.some(ongoing => ongoing.id === id)) break;
      const amount = Math.ceil(activationRound! / 2);
      runtime.ongoingEffects.push({
        id,
        sourceCardId: source.instanceId,
        abilityId: abilityId(context),
        controllerId,
        starts: 'immediate',
        duration: 'while_card_active',
        startRound: state.round.roundNumber,
        cleanup: 'when_card_leaves_active_area',
        sourceMustRemainActive: true,
        ruleModifiers: [{
          sourceCardId: source.instanceId,
          controllerId,
          definition: {
            id: 'soul_drag_power_bonus',
            operation: 'add',
            rule: 'battle.totalPower',
            scope: { subject: 'controller' },
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
          // B-SERVANT-OWNERSHIP-CONTRACT：归属必须随从者变更同步（否则 servantOwnership 变陈旧）
          const previous = controller.servantCardId;
          const ownership = (state as unknown as { servantOwnership?: Record<string, string | null> }).servantOwnership;
          if (ownership) {
            if (previous) ownership[previous] = null;
            ownership[unused] = controllerId;
          }
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
        expiresAtRound: state.round.roundNumber + 1,
        sourceMustRemainActive: true,
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
    case 'hide_servant_true_name': {
      // Hide servant true name
      const runtime = (state as any).abilityRuntime;
      if (runtime) {
        runtime.revealedServants = runtime.revealedServants.filter((id: string) => id !== controllerId);
      }
      break;
    }
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
    default: {
      // Legacy adapter 只兜底真正没人处理的类型；不再"悄悄 warn 后继续"，
      // 否则未知效果会被当成已执行（歧义 0 的前提）。interpreter 会把它转成 reject。
      throw new Error(`Unknown legacy effect type: ${String(effect.type ?? '')}`);
    }
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
