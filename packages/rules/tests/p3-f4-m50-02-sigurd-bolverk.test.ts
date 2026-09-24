import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import type { GameState } from '../src/schema/game';
import { createSeededGameState } from '../src/tools/seeded-state';

const BOLVERK = 'servant.fixture.sigurd.bolverk';
const BASIC = 'fixture.basic.blade-storm';
const SOURCE = 'bolverk-source';
const ATTACK = 'basic-source';
const CURSE = 'bolverk-cursed';
const PARENT = 'blade-storm';
const GRANT = 'sigurd-blade-storm';

function grantedAbility(): any {
  return {
    id: GRANT, kind: 'phase_action', printedClause: 'fixture Blade Storm',
    activation: { phase: 'action', opens: 'controller_action_window', requiresSourceState: 'active' },
    conditions: [], targets: [], cost: [{ type: 'pay_mana', amount: 2 }],
    effects: [{ type: 'double_source_base_power_remove_after_battle' }],
    creates: [], ruleModifiers: [], lifecycle: {}, responseWindow: {},
    limit: { type: 'per_round', uses: 1, scope: 'this_card' }, visibility: {},
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'servant_skill_card_archive', id: 'servant.fixture.sigurd', name: 'fixture', class: 'Saber',
    cards: [
      {
        id: BOLVERK, name: 'Bolverk', cardType: 'servant_skill', cardFace: { typeLabel: 'skill', attributes: ['宝具'], cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
        abilities: [
          {
            id: CURSE, kind: 'forced_trigger', printedClause: 'fixture curse', markers: ['m50_structured_v1'],
            activation: { trigger: 'm50_round_started' }, conditions: [{ type: 'source_revealed' }], targets: [], cost: [],
            effects: [{ type: 'lose_victory_points', target: 'controller', amount: 1 }], creates: [], ruleModifiers: [],
            lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
          {
            id: PARENT, kind: 'passive', printedClause: 'fixture grant', markers: ['m50_structured_v1'], activation: {},
            conditions: [{ type: 'source_revealed' }], targets: [], effects: [], cost: [], creates: [], ruleModifiers: [],
            transforms: [{
              id: 'fixture-grant-blade-storm', type: 'card', target: { subject: 'controller', cards: { basic: true } },
              grantAbilities: [grantedAbility()], lifecycle: { duration: 'permanent' },
            }],
            lifecycle: {}, responseWindow: {}, limit: {}, visibility: {}, execution: { mode: 'automatic', allowedOperations: [] },
          },
        ],
      },
      {
        id: BASIC, name: 'Basic attack', cardType: 'basic_attack', cardFace: { typeLabel: 'attack', attributes: ['力量'], cost: 0, basePower: 3 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities: [],
      },
    ],
  };
}

function setup(options: { revealed?: boolean; sourceZone?: 'skill' | 'attack_area' } = {}): GameState {
  const pack = rules.loadAuthoringJson(archive());
  expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  const sourceZone = options.sourceZone ?? 'skill';
  const revealed = options.revealed ?? true;
  state.cards = [
    {
      instanceId: SOURCE, definitionId: BOLVERK, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: sourceZone,
      visibility: revealed ? { scope: 'public' } : { scope: 'owner_only', ownerPlayerId: 'p1' },
    },
    {
      instanceId: ATTACK, definitionId: BASIC, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'attack_area',
      visibility: { scope: 'public' },
    },
  ];
  state.players[0]!.mana = 10;
  state.players[0]!.vp = 5;
  state.round.activePhase = 'action';
  state.round.prioritySeat = state.players[0]!.seat;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  state.abilityRuntime!.cardState[SOURCE] = { active: sourceZone === 'attack_area', faceDown: false, playedRound: state.round.roundNumber };
  state.abilityRuntime!.cardState[ATTACK] = { active: true, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

function grantAction(state: GameState) {
  return rules.getLegalActions(state, 'p1').find((action) =>
    action.type === 'activate_ability' && action.cardInstanceId === ATTACK && action.abilityId === GRANT);
}

function activateGrant(state: GameState) {
  return rules.dispatchAbilityCommand(state, 'p1', { type: 'activate_ability', cardInstanceId: ATTACK, abilityId: GRANT });
}

describe('P3 F4 M50-02 Sigurd Bolverk Gram', () => {
  it('accepts only the exact revealed-source basic-card transform and exact granted ability', () => {
    const raw = archive();
    expect(rules.loadAuthoringJson(raw).report).toEqual([]);
    expect(rules.isAcceptedM50BladeStormGrantedAbility(raw.cards[0].abilities[1].transforms[0].grantAbilities[0])).toBe(true);

    const widened = archive();
    widened.cards[0].abilities[1].transforms[0].target.cards = { basic: true, attributesAny: ['力量'] };
    expect(rules.loadAuthoringJson(widened).report.length).toBeGreaterThan(0);

    const wrongGrant = archive();
    wrongGrant.cards[0].abilities[1].transforms[0].grantAbilities[0].effects[0].extra = true;
    expect(rules.isAcceptedM50BladeStormGrantedAbility(wrongGrant.cards[0].abilities[1].transforms[0].grantAbilities[0])).toBe(false);
    expect(rules.loadAuthoringJson(wrongGrant).report.length).toBeGreaterThan(0);
  });

  it('loses 1 VP at the authoritative next-round start only while the physical source is revealed', () => {
    const revealed = setup({ revealed: true });
    rules.advanceAbilityPhase(revealed, 'preparation', 2);
    expect(revealed.players[0]!.vp).toBe(4);

    const hidden = setup({ revealed: false });
    rules.advanceAbilityPhase(hidden, 'preparation', 2);
    expect(hidden.players[0]!.vp).toBe(5);
  });

  it('grants the action to the active basic card itself, pays 2 mana, doubles its base power, and is once per round', () => {
    const state = setup();
    expect(grantAction(state)).toEqual(expect.objectContaining({ type: 'activate_ability', cardInstanceId: ATTACK, abilityId: GRANT }));
    expect(rules.calculateCardPower(state, ATTACK).value).toBe(3);
    expect(activateGrant(state).ok).toBe(true);
    expect(state.players[0]!.mana).toBe(8);
    expect(rules.calculateCardPower(state, ATTACK).value).toBe(6);
    expect(state.abilityRuntime!.cardState[ATTACK]).toMatchObject({ basePowerMultiplier: 2, removeAfterBattleRound: 1 });

    const beforeMana = state.players[0]!.mana;
    expect(grantAction(state)).toBeUndefined();
    const second = activateGrant(state);
    expect(second.ok).toBe(false);
    expect(state.players[0]!.mana).toBe(beforeMana);
    expect(rules.calculateCardPower(state, ATTACK).value).toBe(6);
  });

  it('withdraws the dynamic grant immediately when the revealing source leaves, without undoing an already applied physical multiplier', () => {
    const state = setup();
    expect(activateGrant(state).ok).toBe(true);
    expect(rules.calculateCardPower(state, ATTACK).value).toBe(6);

    const source = state.cards.find((card) => card.instanceId === SOURCE)!;
    source.zone = 'removed_from_game';
    source.visibility = { scope: 'public' };
    state.abilityRuntime!.cardState[SOURCE]!.active = false;
    expect(rules.m50GrantedAbilitiesForCard(state, ATTACK).some((ability) => ability.id === GRANT)).toBe(false);
    expect(rules.calculateCardPower(state, ATTACK).value).toBe(6);
  });

  it('removes an empowered physical card after combat even if it changed zones before the terminal event', () => {
    const state = setup();
    expect(activateGrant(state).ok).toBe(true);
    const attack = state.cards.find((card) => card.instanceId === ATTACK)!;
    attack.zone = 'hand';
    attack.visibility = { scope: 'owner_only', ownerPlayerId: 'p1' };
    state.abilityRuntime!.cardState[ATTACK]!.active = false;

    rules.processAbilitySystemEvent(state, 'fixture-battle-end', { type: 'after_battle_ended' });
    const settledAttack = state.cards.find((card) => card.instanceId === ATTACK)!;
    expect(settledAttack).toMatchObject({ zone: 'removed_from_game', controllerPlayerId: 'p1', visibility: { scope: 'public' } });
    expect(state.abilityRuntime!.cardState[ATTACK]!.active).toBe(false);
    expect(state.abilityRuntime!.cardState[ATTACK]!.removeAfterBattleRound).toBeUndefined();
  });
});
