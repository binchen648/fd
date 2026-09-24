import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { m50DeploymentManaGainForbidden, m50RegularMovementCostDiscount } from '../src/ability/m50-structural-card-modifiers';
import { createSeededGameState } from '../src/tools/seeded-state';
import type { GameState } from '../src/schema/game';

const CARD = 'master.fixture.kuzuki.s2';
function archive(): any {
  return {
    schemaVersion: 'fd-card-authoring-v1', archiveType: 'master_skill_card_archive', id: 'master.fixture', name: 'fixture', class: 'Master',
    cards: [{
      id: CARD, name: 'fixture', cardType: 'master_skill', owner: { type: 'master', id: 'master.fixture' },
      cardFace: { typeLabel: '被动', cost: 0, basePower: 0, attributes: [] },
      playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [],
      abilities: [{
        id: 'outsider-base-rules', kind: 'passive', markers: ['m50_structured_v1'],
        conditions: [{ type: 'source_owned' }], targets: [], effects: [], cost: [], creates: [],
        ruleModifiers: [
          { id: 'no-workshop-deploy-mana', operation: 'forbid', rule: 'deployment_resource_gain', scope: { subject: 'controller', resource: 'mana', locationIds: ['workshop'] }, lifecycle: { duration: 'permanent' } },
          { id: 'workshop-regular-move-discount', operation: 'subtract', rule: 'movement_cost', scope: { subject: 'controller', method: 'regular', fromLocationIds: ['workshop'] }, value: 1, lifecycle: { duration: 'permanent' } },
        ],
        lifecycle: { duration: 'permanent' }, responseWindow: {}, limit: {}, visibility: {},
        execution: { mode: 'automatic', allowedOperations: [] },
      }],
    }],
  };
}
function setup(withSource = true): GameState {
  const pack = rules.loadAuthoringJson(archive()); expect(pack.report).toEqual([]);
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.round.activePhase = 'action'; state.round.prioritySeat = state.players[0]!.seat;
  state.players[0]!.locationId = 'magic_workshop'; state.players[0]!.mana = 10;
  state.players[1]!.locationId = 'miyama_town'; state.players[1]!.mana = 10;
  state.cards = withSource ? [{ instanceId: 'source', definitionId: CARD, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', visibility: { scope: 'owner_only', ownerPlayerId: 'p1' } }] : [];
  rules.initializeAbilityRuntime(state, pack, { seed: 20260924 });
  if (withSource) state.abilityRuntime!.cardState.source = { active: false, faceDown: false, playedRound: state.round.roundNumber };
  return state;
}

describe('P3 F4 M50-02 Kuzuki outsider permanent player rules', () => {
  it('loads only the exact identity-free permanent workshop modifier envelope', () => {
    expect(rules.loadAuthoringJson(archive()).report).toEqual([]);
    const widened = archive(); widened.cards[0].abilities[0].ruleModifiers[1].value = 2;
    expect(rules.loadAuthoringJson(widened).report.length).toBeGreaterThan(0);
  });

  it('forbids workshop deployment mana only while the source remains controller-owned', () => {
    const state = setup(true);
    expect(m50DeploymentManaGainForbidden(state, 'p1', 'magic_workshop')).toBe(true);
    const session = rules.createMatchSession({ seed: 20260924, humanPlayerIds: ['p1', 'p2'] }) as any;
    session.state = state; session.state.players[0].mana = 0;
    session.applyDeploymentLocationReward('p1', 'magic_workshop');
    expect(session.state.players[0].mana).toBe(0);
    session.state.cards[0].zone = 'removed_from_game';
    expect(m50DeploymentManaGainForbidden(session.state, 'p1', 'magic_workshop')).toBe(false);
    session.applyDeploymentLocationReward('p1', 'magic_workshop');
    expect(session.state.players[0].mana).toBe(2);
  });

  it('subtracts exactly one from normal movement out of workshop and nowhere else', () => {
    const withRule = setup(true); const baseline = setup(false);
    expect(m50RegularMovementCostDiscount(withRule, 'p1', 'magic_workshop')).toBe(1);
    expect(m50RegularMovementCostDiscount(withRule, 'p1', 'shinto')).toBe(0);
    const normalWith = rules.movePlayer(withRule, { playerId: 'p1', to: 'shinto', movementKind: 'normal' });
    const normalBase = rules.movePlayer(baseline, { playerId: 'p1', to: 'shinto', movementKind: 'normal' });
    expect(normalWith.moved).toBe(true); expect(normalBase.moved).toBe(true);
    expect(normalBase.manaSpent - normalWith.manaSpent).toBe(1);
    const effectState = setup(true);
    const effect = rules.movePlayer(effectState, { playerId: 'p1', to: 'shinto', movementKind: 'effect' });
    expect(effect.moved).toBe(true); expect(effect.manaSpent).toBe(0);
  });
});
