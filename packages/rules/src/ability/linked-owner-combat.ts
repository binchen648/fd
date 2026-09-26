import type { BattleParticipantBreakdown, GameState } from '../schema/game';
import type { AuthoringCard, RuleNode } from './types';

export interface LinkedOwnerCombatRule {
  type: 'linked_owner_combat_rule';
  ignoreBattleLossEffects: true;
  shareMaximumCombatPower: true;
  closeIfOwnerAbsent: true;
  returnToOwnerAtBattleEnd: 'discard';
  returnToOwnerHandOnOwnerLoss: true;
  ownerCommandSealsAtMost: 0;
  basePowerMultiplier: 2;
}

const RULE_KEYS = [
  'type', 'ignoreBattleLossEffects', 'shareMaximumCombatPower', 'closeIfOwnerAbsent',
  'returnToOwnerAtBattleEnd', 'returnToOwnerHandOnOwnerLoss', 'ownerCommandSealsAtMost',
  'basePowerMultiplier',
] as const;

export function isLinkedOwnerCombatRule(value: unknown): value is LinkedOwnerCombatRule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rule = value as Record<string, unknown>;
  return Object.keys(rule).length === RULE_KEYS.length && Object.keys(rule).every((key) => (RULE_KEYS as readonly string[]).includes(key)) &&
    rule.type === 'linked_owner_combat_rule' && rule.ignoreBattleLossEffects === true &&
    rule.shareMaximumCombatPower === true && rule.closeIfOwnerAbsent === true &&
    rule.returnToOwnerAtBattleEnd === 'discard' && rule.returnToOwnerHandOnOwnerLoss === true &&
    rule.ownerCommandSealsAtMost === 0 && rule.basePowerMultiplier === 2;
}

function definitionForCard(state: GameState, definitionId: string): AuthoringCard | undefined {
  return state.abilityRuntime?.pack.cards[definitionId];
}

export function linkedOwnerCombatRuleForDefinition(definition: AuthoringCard | undefined): LinkedOwnerCombatRule | undefined {
  if (!definition) return undefined;
  for (const ability of definition.abilities) {
    for (const effect of ability.effects) if (isLinkedOwnerCombatRule(effect)) return effect;
  }
  return undefined;
}

export function linkedOwnerCombatRuleForCard(state: GameState, card: GameState['cards'][number]): LinkedOwnerCombatRule | undefined {
  return linkedOwnerCombatRuleForDefinition(definitionForCard(state, card.definitionId));
}

function activeLinkedCard(state: GameState, card: GameState['cards'][number]): boolean {
  const runtimeState = state.abilityRuntime?.cardState[card.instanceId];
  return !!linkedOwnerCombatRuleForCard(state, card) && ['attack_area', 'field'].includes(card.zone) &&
    runtimeState?.active === true && runtimeState.faceDown !== true;
}

function commandSeals(state: GameState, playerId: string): number {
  const player = state.players.find((candidate) => candidate.id === playerId) as (GameState['players'][number] & { commandSpells?: number }) | undefined;
  return Number(player?.commandSpells ?? 3);
}

export function linkedOwnerBasePowerMultiplier(state: GameState, card: GameState['cards'][number]): number {
  const rule = linkedOwnerCombatRuleForCard(state, card);
  if (!rule) return 1;
  return commandSeals(state, card.ownerPlayerId) <= rule.ownerCommandSealsAtMost ? rule.basePowerMultiplier : 1;
}

export function controllerHasLinkedOwnerCardFrom(state: GameState, controllerId: string, ownerId: string): boolean {
  return state.cards.some((card) => card.controllerPlayerId === controllerId && card.ownerPlayerId === ownerId &&
    controllerId !== ownerId && activeLinkedCard(state, card));
}

function linkedPairAtBattlefield(state: GameState, card: GameState['cards'][number], battlefieldId: string): boolean {
  if (!activeLinkedCard(state, card) || card.controllerPlayerId === card.ownerPlayerId) return false;
  const owner = state.players.find((player) => player.id === card.ownerPlayerId);
  const controller = state.players.find((player) => player.id === card.controllerPlayerId);
  return owner?.status === 'active' && controller?.status === 'active' &&
    owner.locationId === battlefieldId && controller.locationId === battlefieldId;
}

export function playerHasLinkedOwnerLossImmunity(state: GameState, playerId: string, battlefieldId: string): boolean {
  return state.cards.some((card) => {
    const rule = linkedOwnerCombatRuleForCard(state, card);
    return rule?.ignoreBattleLossEffects === true && linkedPairAtBattlefield(state, card, battlefieldId) &&
      (card.ownerPlayerId === playerId || card.controllerPlayerId === playerId);
  });
}

function closeToOwnerDiscard(state: GameState, card: GameState['cards'][number]): void {
  card.controllerPlayerId = card.ownerPlayerId;
  card.zone = 'discard';
  card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
  const runtimeState = state.abilityRuntime?.cardState[card.instanceId];
  if (runtimeState) { runtimeState.active = false; runtimeState.faceDown = true; }
}

export function prepareLinkedOwnerCardsForBattle(state: GameState, battlefieldId: string): GameState {
  const candidates = state.cards.filter((card) => {
    const rule = linkedOwnerCombatRuleForCard(state, card);
    if (!rule?.closeIfOwnerAbsent || !activeLinkedCard(state, card) || card.controllerPlayerId === card.ownerPlayerId) return false;
    const controller = state.players.find((player) => player.id === card.controllerPlayerId);
    if (controller?.locationId !== battlefieldId) return false;
    const owner = state.players.find((player) => player.id === card.ownerPlayerId);
    return owner?.status !== 'active' || owner.locationId !== battlefieldId;
  });
  if (!candidates.length) return state;
  const copy = structuredClone(state);
  for (const candidate of candidates) {
    const card = copy.cards.find((entry) => entry.instanceId === candidate.instanceId);
    if (card) closeToOwnerDiscard(copy, card);
  }
  return copy;
}

export function applyLinkedOwnerCombatPowerSharing(
  state: GameState,
  battlefieldId: string,
  breakdowns: BattleParticipantBreakdown[],
): BattleParticipantBreakdown[] {
  const next = breakdowns.map((entry) => ({ ...entry, modifiers: entry.modifiers.map((modifier) => ({ ...modifier })) }));
  for (const card of state.cards) {
    const rule = linkedOwnerCombatRuleForCard(state, card);
    if (!rule?.shareMaximumCombatPower || !linkedPairAtBattlefield(state, card, battlefieldId)) continue;
    const owner = next.find((entry) => entry.playerId === card.ownerPlayerId);
    const controller = next.find((entry) => entry.playerId === card.controllerPlayerId);
    if (!owner || !controller) continue;
    const shared = Math.max(owner.effectivePower, controller.effectivePower);
    for (const entry of [owner, controller]) {
      const delta = shared - entry.effectivePower;
      if (delta === 0) continue;
      entry.effectivePower = shared;
      entry.totalModifier += delta;
      entry.modifiers.push({
        source: 'skill', label: 'linked_owner_combat_maximum', value: delta,
        payload: { kind: 'modifier', sourceType: 'skill', sourceId: card.definitionId, targetTag: 'combat_power' },
      });
    }
  }
  return next;
}

export function settleLinkedOwnerCardsAfterBattles(
  state: GameState,
  battles: GameState['battleResults'],
): GameState {
  const borrowed = state.cards.filter((card) => card.controllerPlayerId !== card.ownerPlayerId && activeLinkedCard(state, card));
  if (!borrowed.length) return state;
  const copy = structuredClone(state);
  for (const candidate of borrowed) {
    const card = copy.cards.find((entry) => entry.instanceId === candidate.instanceId);
    if (!card) continue;
    const ownerLost = battles.some((battle) =>
      battle.participantBreakdowns.some((participant) => participant.playerId === card.ownerPlayerId) &&
      !battle.winnerPlayerIds.includes(card.ownerPlayerId));
    card.controllerPlayerId = card.ownerPlayerId;
    card.zone = ownerLost ? 'hand' : 'discard';
    card.visibility = { scope: 'owner_only', ownerPlayerId: card.ownerPlayerId };
    const runtimeState = copy.abilityRuntime?.cardState[card.instanceId];
    if (runtimeState) { runtimeState.active = false; runtimeState.faceDown = !ownerLost; }
  }
  return copy;
}

export function isServantNoCommandSealsRule(value: unknown): value is RuleNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rule = value as Record<string, unknown>;
  return rule.type === 'servant_no_command_seals_rule' && rule.commandSealsAtMost === 0 &&
    rule.hideTrueName === true && Object.keys(rule).length === 3 &&
    Object.keys(rule).every((key) => ['type', 'commandSealsAtMost', 'hideTrueName'].includes(key));
}

export function servantRevealForbiddenByNoCommandSeals(state: GameState, playerId: string): boolean {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player?.servantCardId || commandSeals(state, playerId) > 0) return false;
  const servantSkillPrefix = `${player.servantCardId}.skill.`;
  return Object.values(state.abilityRuntime?.pack.cards ?? {}).some((definition) =>
    definition.id.startsWith(servantSkillPrefix) && definition.abilities.some((ability) =>
      ability.effects.some((effect) => isServantNoCommandSealsRule(effect))));
}
