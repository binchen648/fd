import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import type { AuthoringAbility, ExecutableCardDefinition, RuleNode } from '../../src/ability/types';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const OWNER = 'fixture.provision-owner';
const SOURCE = 'fixture.provision-source';
const TARGET_ONE = 'fixture.provision-target-one';
const TARGET_TWO = 'fixture.provision-target-two';

function setupAbility(targetDefinitionIds: string[] = [TARGET_ONE]): AuthoringAbility {
  return {
    id: 'renamed.synthetic.provision', kind: 'forced_trigger', printedClause: 'synthetic setup',
    activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
    lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
    effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

function card(id: string, abilities: AuthoringAbility[] = []): Record<string, unknown> {
  return {
    id, name: id, cardType: 'master_skill', cardFace: { typeLabel: 'special', attributes: [], cost: 0, basePower: 0 },
    playTiming: { phase: 'action', window: 'controller_play_card_window' }, playRequirements: [], abilities,
  };
}

function archive(ability = setupAbility()) {
  return {
    schemaVersion: 'fd-card-authoring-v1', id: OWNER, name: 'Renamed Synthetic Owner', class: 'Master',
    cards: [card(SOURCE, [ability]), card(TARGET_ONE), card(TARGET_TWO)],
  };
}

function setup(ability = setupAbility()): GameState {
  const pack = rules.loadAuthoringJson(archive(ability));
  expect(pack.report).toEqual([]);
  for (const definition of Object.values(pack.cards) as ExecutableCardDefinition[]) definition.ownerId = OWNER;
  (pack.cards[SOURCE] as ExecutableCardDefinition).initialZone = 'skill';
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = OWNER;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260917 });
  state.cards.push({
    instanceId: 'source-instance', definitionId: SOURCE, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return state;
}

function provisioned(state: GameState, definitionId: string) {
  return state.cards.filter((candidate) => candidate.definitionId === definitionId);
}

function start(state: GameState, id = 'synthetic-game-start') {
  rules.processAbilityEvent(state, { id, type: 'game_start' });
}

describe('P3-FB2-15 identity-free game-start skill provisioning', () => {
  it('provisions one target as controller-owned, face-up inactive skill material', () => {
    const state = setup();
    start(state);
    const [created] = provisioned(state, TARGET_ONE);
    expect(created).toMatchObject({
      definitionId: TARGET_ONE, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' }, generatedBy: 'source-instance',
    });
    expect(state.abilityRuntime!.cardState[created!.instanceId]).toMatchObject({ active: false, faceDown: false });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({ type: 'card_created', cardInstanceId: created!.instanceId }));
  });

  it('provisions every target in a multi-target envelope exactly once', () => {
    const state = setup(setupAbility([TARGET_ONE, TARGET_TWO]));
    start(state);
    expect(provisioned(state, TARGET_ONE)).toHaveLength(1);
    expect(provisioned(state, TARGET_TWO)).toHaveLength(1);
  });

  it('retains valid existing targets and is idempotent across replay and restored state', () => {
    const state = setup(setupAbility([TARGET_ONE, TARGET_TWO]));
    state.cards.push({
      instanceId: 'retained-target', definitionId: TARGET_ONE, ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    start(state);
    const beforeReplay = JSON.stringify(state.cards);
    start(state);
    expect(JSON.stringify(state.cards)).toBe(beforeReplay);
    const restored = structuredClone(state);
    start(restored, 'restored-game-start');
    expect(provisioned(restored, TARGET_ONE)).toHaveLength(1);
    expect(provisioned(restored, TARGET_TWO)).toHaveLength(1);
  });

  it('fails closed for malformed, duplicate, non-game-start, and unauthorized structural variants', () => {
    const cases: AuthoringAbility[] = [
      setupAbility([]),
      setupAbility([TARGET_ONE, TARGET_ONE]),
      { ...setupAbility(), activation: { trigger: 'while_active' } },
      { ...setupAbility(), creates: [{ type: 'create_card', cardId: TARGET_TWO, to: { zone: 'skill' } }] },
      { ...setupAbility(), effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [TARGET_ONE, ''] } as RuleNode] },
    ];
    for (const ability of cases) {
      expect(rules.isGameStartSkillProvisioningSemantic(ability)).toBe(false);
      const state = setup(ability);
      start(state);
      expect(provisioned(state, TARGET_ONE)).toHaveLength(0);
    }
  });

  it('fails closed atomically for wrong source ownership/zone, inactive definitions, and invalid retained material', () => {
    const cases: Array<(state: GameState) => void> = [
      (state) => { state.cards[0]!.ownerPlayerId = 'p2'; },
      (state) => { state.cards[0]!.zone = 'field'; },
      (state) => { (state.abilityRuntime!.pack.cards[SOURCE] as ExecutableCardDefinition).cardType = 'command_spell'; },
      (state) => { (state.abilityRuntime!.pack.cards[TARGET_TWO] as ExecutableCardDefinition).ownerId = 'other-owner'; },
      (state) => { state.abilityRuntime!.pack.cards[TARGET_TWO]!.mode = 'unsupported'; },
      (state) => state.cards.push({
        instanceId: 'wrong-retained', definitionId: TARGET_TWO, ownerPlayerId: 'p2', controllerPlayerId: 'p2', zone: 'skill',
        visibility: { scope: 'owner_only', ownerPlayerId: 'p2' },
      }),
    ];
    for (const mutate of cases) {
      const state = setup(setupAbility([TARGET_ONE, TARGET_TWO]));
      mutate(state);
      const targetTwoBefore = provisioned(state, TARGET_TWO).length;
      start(state);
      expect(provisioned(state, TARGET_ONE)).toHaveLength(0);
      expect(provisioned(state, TARGET_TWO)).toHaveLength(targetTwoBefore);
    }
  });

  it('does not change B10 generic create-to-skill compatibility', () => {
    const b10Ability = {
      ...setupAbility(), effects: [], creates: [{ type: 'create_card', cardId: TARGET_ONE, to: { zone: 'skill' } }],
    };
    const state = setup(b10Ability);
    start(state);
    expect(provisioned(state, TARGET_ONE)).toHaveLength(1);
  });

  it('routes solely by shape, not a source identity, name, or printed text', () => {
    const state = setup();
    const source = state.abilityRuntime!.pack.cards[SOURCE]!;
    source.name = 'A completely different source name';
    source.abilities[0]!.id = 'different-ability-id';
    source.abilities[0]!.printedClause = 'Unrelated printed words';
    start(state);
    expect(provisioned(state, TARGET_ONE)).toHaveLength(1);
  });
});
