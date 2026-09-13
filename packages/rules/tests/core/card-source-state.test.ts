import { describe, expect, it } from 'vitest';

import {
  ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID,
  evaluateCardSourceValidity,
} from '../../src/core/card-source-state';
import { initializeAbilityRuntime } from '../../src/ability/interpreter';
import type { AbilityDefinitionPack } from '../../src/ability/types';
import { createSeededGameState } from '../../src/tools/seeded-state';

const DEF = 'test.active-source';
const ABILITY = 'test.active-source.passive';

function setup(zone: 'field' | 'attack_area' | 'skill' = 'attack_area') {
  const state = createSeededGameState({ activeSeats: [1, 2] });
  const pack: AbilityDefinitionPack = {
    schemaVersion: 'fd-card-rule-content-v1',
    cards: {
      [DEF]: {
        id: DEF,
        name: 'Active Source Fixture',
        cardType: 'servant_skill',
        cardFace: { cost: 0, basePower: 0 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{
          id: ABILITY,
          kind: 'residual',
          printedClause: 'fixture',
          activation: { trigger: 'while_active' },
          conditions: [], targets: [], effects: [], cost: [], ruleModifiers: [], creates: [], lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          execution: { mode: 'automatic', allowedOperations: [] },
        }],
        mode: 'automatic',
      },
    },
  };
  initializeAbilityRuntime(state, pack, { seed: 7 });
  state.cards = [{
    instanceId: 'source-1',
    definitionId: DEF,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: { scope: 'public' },
  }];
  state.abilityRuntime!.cardState['source-1'] = { active: true, faceDown: false, playedRound: 1 };
  return state;
}

function check(state = setup()) {
  return evaluateCardSourceValidity(state, {
    policyId: ACTIVE_CARD_SOURCE_VALIDITY_POLICY_ID,
    sourceCardInstanceId: 'source-1',
    sourceAbilityId: ABILITY,
    controllerPlayerId: 'p1',
    sourceDefinitionIdAtInstall: DEF,
  });
}

describe('Card Zone active source-state policy', () => {
  it.each(['field', 'attack_area'] as const)('accepts an authoritative face-up active source in %s', (zone) => {
    expect(check(setup(zone))).toEqual({ supported: true, valid: true });
  });

  it('rejects inactive, face-down, and off-active-area sources without guessing from definition identity', () => {
    const inactive = setup();
    inactive.abilityRuntime!.cardState['source-1']!.active = false;
    expect(check(inactive)).toMatchObject({ supported: true, valid: false, reason: 'inactive_source' });

    const faceDown = setup();
    faceDown.abilityRuntime!.cardState['source-1']!.faceDown = true;
    expect(check(faceDown)).toMatchObject({ supported: true, valid: false, reason: 'inactive_source' });

    expect(check(setup('skill'))).toMatchObject({ supported: true, valid: false, reason: 'inactive_source' });
  });

  it('binds validity to the exact source instance, controller, definition, and ability', () => {
    const missing = setup();
    missing.cards[0]!.instanceId = 'replacement-instance';
    expect(check(missing)).toMatchObject({ valid: false, reason: 'missing_source' });

    const controllerChanged = setup();
    controllerChanged.cards[0]!.controllerPlayerId = 'p2';
    expect(check(controllerChanged)).toMatchObject({ valid: false, reason: 'controller_changed' });

    const definitionChanged = setup();
    definitionChanged.cards[0]!.definitionId = 'test.transformed-source';
    expect(check(definitionChanged)).toMatchObject({ valid: false, reason: 'definition_changed' });

    const abilityMissing = setup();
    abilityMissing.abilityRuntime!.pack.cards[DEF]!.abilities = [];
    expect(check(abilityMissing)).toMatchObject({ valid: false, reason: 'ability_missing' });
  });

  it('returns unsupported for an unreviewed policy id instead of falling back to current-zone heuristics', () => {
    const state = setup();
    expect(evaluateCardSourceValidity(state, {
      policyId: 'fd.card-zone.unknown-policy',
      sourceCardInstanceId: 'source-1',
      sourceAbilityId: ABILITY,
      controllerPlayerId: 'p1',
      sourceDefinitionIdAtInstall: DEF,
    })).toEqual({ supported: false, valid: false, reason: 'unknown_policy' });
  });
});
