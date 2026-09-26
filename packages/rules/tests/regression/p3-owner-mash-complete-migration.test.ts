import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSeededGameState } from '../../src/tools/seeded-state';
import { loadAuthoringJson } from '../../src/ability/loader';
import { calculateCardPower, initializeAbilityRuntime, resolveEffect } from '../../src/ability/interpreter';
import {
  applyLinkedOwnerCombatPowerSharing,
  linkedOwnerBasePowerMultiplier,
  playerHasLinkedOwnerLossImmunity,
  prepareLinkedOwnerCardsForBattle,
  servantRevealForbiddenByNoCommandSeals,
  settleLinkedOwnerCardsAfterBattles,
} from '../../src/ability/linked-owner-combat';
import { terrainAdvantageAtLocation } from '../../src/ability/terrain-advantage-override';
import type { AuthoringCard, EffectContext } from '../../src/ability/types';
import type { BattleParticipantBreakdown, GameState } from '../../src/schema/game';

const archivePath = 'data/authoring/servants/servant.mash.json';
const skill = (n: number) => `servant.mash.skill.sc-mash-${n}`;
const battlefield = 'miyama_town' as const;

function archive(): any { return JSON.parse(readFileSync(archivePath, 'utf8')); }
function setup() {
  const raw = archive();
  const pack = loadAuthoringJson(raw);
  const state = createSeededGameState();
  state.cards = [];
  state.round.activePhase = 'action';
  state.players[0]!.servantCardId = 'servant.mash';
  state.players[0]!.locationId = battlefield;
  state.players[1]!.locationId = battlefield;
  (state.players[0] as GameState['players'][number] & { commandSpells?: number }).commandSpells = 3;
  initializeAbilityRuntime(state, pack, { seed: 42 });
  return { raw, pack, state };
}
function addCard(state: GameState, definitionId: string, ownerPlayerId: string, controllerPlayerId = ownerPlayerId, zone = 'attack_area') {
  const instanceId = `${definitionId}:${state.cards.length}`;
  state.cards.push({ instanceId, definitionId, ownerPlayerId, controllerPlayerId, zone, visibility: { scope: 'public' } });
  state.abilityRuntime!.cardState[instanceId] = { active: true, faceDown: false };
  return state.cards[state.cards.length - 1]!;
}
function context(sourceCardId: string, abilityId: string, selections: Record<string, string[]> = {}): EffectContext {
  return { controllerId: 'p1', sourceCardId, abilityId, variables: {}, selections };
}
function breakdown(playerId: string, power: number): BattleParticipantBreakdown {
  return { playerId, basePower: power, totalModifier: 0, effectivePower: power, modifiers: [] };
}

describe('P3 owner-complete Mash migration', () => {
  it('loads all four frozen Mash skills plus the physical Guard card with no unsupported mechanics', () => {
    const { pack } = setup();
    expect([1, 2, 3, 4].map(skill).every((id) => !!pack.cards[id])).toBe(true);
    expect(pack.cards[skill(4)]!.initialPlacement).toBe('outside_game');
    expect(pack.cards['card.x-guard']).toBeDefined();
    expect(pack.report.filter((entry) => entry.status === 'unsupported')).toEqual([]);
  });

  it('fails closed when a bounded Mash capability shape is widened by an extra field', () => {
    const raw = archive();
    raw.cards[4].abilities[1].effects[0].extra = 'near-match';
    const pack = loadAuthoringJson(raw);
    expect(pack.report.some((entry) => entry.cardId === 'card.x-guard' && entry.status === 'unsupported')).toBe(true);
  });

  it('applies Lord Camelot as +2 terrain followed by doubling on the controller battlefield', () => {
    const { state } = setup();
    (state as any).modeState = { terrainAssignments: { [battlefield]: ['p2', 'p1'] } };
    const source = addCard(state, skill(1), 'p1', 'p1', 'attack_area');
    const ability = state.abilityRuntime!.pack.cards[skill(1)]!.abilities[0]!;
    resolveEffect(state, context(source.instanceId, ability.id, { 'chosen-player': ['p2'] }), ability.effects[0]!);
    // p2 has base terrain 3 at the first slot: (3 + 2) * 2 = 10.
    expect(terrainAdvantageAtLocation(state, 'p2', battlefield)).toBe(10);
  });

  it('applies Snowflake Wall to engaged opponent attacks, with -3 hidden and -4 revealed, excluding the Guard borrower', () => {
    const { state } = setup();
    const source = addCard(state, skill(2), 'p1');
    const attackDefinition: AuthoringCard = {
      id: 'test.attack', name: 'test attack', cardType: 'basic_attack', cardFace: { basePower: 6, attributes: ['力量'] },
      playTiming: {}, playRequirements: [], abilities: [], mode: 'automatic',
    };
    state.abilityRuntime!.pack.cards[attackDefinition.id] = attackDefinition;
    const attack = addCard(state, attackDefinition.id, 'p2');
    const ability = state.abilityRuntime!.pack.cards[skill(2)]!.abilities[0]!;
    resolveEffect(state, context(source.instanceId, ability.id), ability.effects[0]!);
    expect(calculateCardPower(state, attack.instanceId).value).toBe(3);

    // A fresh attack after true-name release receives -4 instead.
    state.abilityRuntime!.revealedServants.push('p1');
    const revealedAttack = addCard(state, attackDefinition.id, 'p2');
    resolveEffect(state, context(source.instanceId, ability.id), ability.effects[0]!);
    expect(calculateCardPower(state, revealedAttack.instanceId).value).toBe(2);

    // A borrower controlling Mash's active Guard is excluded from Snowflake Wall.
    const guard = addCard(state, 'card.x-guard', 'p1', 'p2');
    expect(guard.controllerPlayerId).toBe('p2');
    const excludedAttack = addCard(state, attackDefinition.id, 'p2');
    resolveEffect(state, context(source.instanceId, ability.id), ability.effects[0]!);
    expect(calculateCardPower(state, excludedAttack.instanceId).value).toBe(6);
  });

  it('enforces Ortenaus generically when the servant owner has no command seals', () => {
    const { state } = setup();
    const p1 = state.players[0] as GameState['players'][number] & { commandSpells?: number };
    p1.commandSpells = 0;
    expect(servantRevealForbiddenByNoCommandSeals(state, 'p1')).toBe(true);
    state.abilityRuntime!.revealedServants.push('p1');
    const source = addCard(state, skill(3), 'p1');
    const ruleAbility = state.abilityRuntime!.pack.cards[skill(3)]!.abilities[0]!;
    resolveEffect(state, context(source.instanceId, ruleAbility.id), ruleAbility.effects[0]!);
    expect(state.abilityRuntime!.revealedServants).not.toContain('p1');

    const guard = addCard(state, 'card.x-guard', 'p1');
    expect(linkedOwnerBasePowerMultiplier(state, guard)).toBe(2);
    expect(calculateCardPower(state, guard.instanceId).value).toBe(10);

    p1.commandSpells = 1;
    expect(servantRevealForbiddenByNoCommandSeals(state, 'p1')).toBe(false);
    expect(linkedOwnerBasePowerMultiplier(state, guard)).toBe(1);
  });

  it('implements Guard linked-owner combat sharing, loss immunity, absence close, and owner-loss return', () => {
    const { state } = setup();
    const guard = addCard(state, 'card.x-guard', 'p1', 'p2');
    expect(playerHasLinkedOwnerLossImmunity(state, 'p1', battlefield)).toBe(true);
    expect(playerHasLinkedOwnerLossImmunity(state, 'p2', battlefield)).toBe(true);
    const shared = applyLinkedOwnerCombatPowerSharing(state, battlefield, [breakdown('p1', 4), breakdown('p2', 8)]);
    expect(shared.map((entry) => entry.effectivePower)).toEqual([8, 8]);

    const ownerLost = settleLinkedOwnerCardsAfterBattles(state, [{
      battlefieldId: battlefield, winnerPlayerIds: ['p2'], winnerPlayerId: 'p2', tied: false, margin: 4, vpReward: 1,
      militaryAdjustments: [], participantBreakdowns: shared,
    }]);
    const returned = ownerLost.cards.find((card) => card.instanceId === guard.instanceId)!;
    expect(returned.controllerPlayerId).toBe('p1');
    expect(returned.zone).toBe('hand');

    // If Mash is not in the borrower's battle, Guard closes before that battle.
    state.players[0]!.locationId = 'shinto';
    const closedState = prepareLinkedOwnerCardsForBattle(state, battlefield);
    const closed = closedState.cards.find((card) => card.instanceId === guard.instanceId)!;
    expect(closed.controllerPlayerId).toBe('p1');
    expect(closed.zone).toBe('discard');
    expect(closedState.abilityRuntime!.cardState[closed.instanceId]!.active).toBe(false);
  });
});
