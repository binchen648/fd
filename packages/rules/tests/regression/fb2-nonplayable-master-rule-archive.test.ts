import { resolve } from 'node:path';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { describe, expect, it } from 'vitest';

import * as rules from '../../src/index';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import type { GameState } from '../../src/schema/game';
import { createSeededGameState } from '../../src/tools/seeded-state';

const workspaceRoot = resolve('.');
const packPath = resolve('data/packs/fd-playtest-v1/pack.json');
const OWNER = 'master.synthetic-rule-owner';
const SOURCE = 'master.synthetic-rule-owner.skill.source';
const TARGET = 'master.synthetic-rule-owner.skill.target';

function mixedRuleArchive() {
  return {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_rule_definition_archive',
    id: OWNER,
    name: 'Synthetic Rule Owner',
    cards: [
      {
        id: SOURCE,
        name: 'Synthetic Source',
        cardType: 'master_skill',
        owner: { type: 'master', id: OWNER },
        printedText: 'provision target',
        cardFace: { typeLabel: '被动', attributes: [] },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [{
          id: 'synthetic.game-start-provision',
          kind: 'forced_trigger',
          printedClause: 'provision target',
          activation: { trigger: 'game_start' },
          conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [], lifecycle: {},
          responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [TARGET] }],
          execution: { mode: 'automatic', allowedOperations: [] },
        }],
      },
      {
        id: TARGET,
        name: 'Synthetic Target',
        cardType: 'master_skill',
        owner: { type: 'master', id: OWNER },
        initialPlacement: 'outside_game',
        printedText: 'outside game target',
        cardFace: { cost: 1, basePower: 1 },
        playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [],
        abilities: [],
      },
    ],
  } as any;
}

function executable() {
  const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
  const input = compileLoadedPlaytestPack(loaded).library;
  input.rules.archives.push(mixedRuleArchive());
  return compileExecutableCardPack(input);
}

function runtimeState(): GameState {
  const pack = executable();
  const state = createSeededGameState({ activeSeats: [1, 2] });
  state.cards = [];
  state.players[0]!.masterCardId = OWNER;
  rules.initializeAbilityRuntime(state, pack, { seed: 20260918 });
  state.cards.push({
    instanceId: 'synthetic-rule-source-instance',
    definitionId: SOURCE,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return state;
}

describe('P3-FB2-26 non-playable master mixed rule archive', () => {
  it('compiles a normal source plus outside-game target without playable master surface', () => {
    const pack = executable();
    expect(pack.cards[SOURCE]).toMatchObject({ ownerId: OWNER, cardType: 'master_skill', initialZone: 'skill' });
    expect(pack.cards[TARGET]).toMatchObject({ ownerId: OWNER, cardType: 'master_skill', initialPlacement: 'outside_game' });
    expect(pack.cards[TARGET]!.initialZone).toBeUndefined();
    expect(pack.characters[OWNER]).toBeUndefined();
    expect(pack.fallbackCommandSpells[OWNER]).toBeUndefined();
    expect(pack.decks[OWNER]).toBeUndefined();
  });

  it('executes the unchanged FB2-15 game-start provisioning contract through the compiled mixed archive', () => {
    const state = runtimeState();
    rules.processAbilityEvent(state, { id: 'fb2-26-game-start', type: 'game_start' });

    const created = state.cards.filter((card) => card.definitionId === TARGET);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' }, generatedBy: 'synthetic-rule-source-instance',
    });
    expect(state.abilityRuntime!.events).toContainEqual(expect.objectContaining({
      type: 'card_created', sourceCardId: 'synthetic-rule-source-instance',
      abilityId: 'synthetic.game-start-provision', cardInstanceId: created[0]!.instanceId,
    }));
  });
});
