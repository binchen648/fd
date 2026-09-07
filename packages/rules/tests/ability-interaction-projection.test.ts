import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as rules from '../src/index';
import { createSeededGameState } from '../src/tools/seeded-state';

const approvedAuthoringArchives = [
  'data/authoring/masters/master.kayneth.json',
  'data/authoring/masters/master.shinji.json',
  'data/authoring/masters/master.kiritsugu.json',
  'data/authoring/masters/master.maiya.json',
  'data/authoring/masters/master.gatou.json',
  'data/authoring/masters/master.irisviel.json',
  'data/authoring/masters/master.olga-marie.json',
  'data/authoring/servants/servant.artoriac.json',
  'data/authoring/servants/servant.drake.json',
  'data/authoring/servants/servant.achilles.json',
  'data/authoring/servants/servant.artoria-alt.json',
  'data/authoring/servants/servant.ereshkigal.json',
  'data/authoring/servants/servant.tomoe.json',
  'data/authoring/servants/servant.kintoki.json',
];

function archive(path: string) {
  const rootPath = resolve(process.cwd(), path);
  const packageScriptPath = resolve(process.cwd(), '../..', path);
  try {
    return JSON.parse(readFileSync(rootPath, 'utf8'));
  } catch {
    return JSON.parse(readFileSync(packageScriptPath, 'utf8'));
  }
}

function loadedAbilities(path: string) {
  const pack = rules.loadAuthoringJson(archive(path));
  return Object.values(pack.cards).flatMap(card =>
    card.abilities.map(ability => ({ path, cardId: card.id, ability })),
  );
}

function addCard(state: ReturnType<typeof createSeededGameState>, definitionId: string, zone = 'skill') {
  const instanceId = `c-${state.cards.length}`;
  state.cards.push({
    instanceId,
    definitionId,
    ownerPlayerId: 'p1',
    controllerPlayerId: 'p1',
    zone,
    visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
  });
  return instanceId;
}

describe('ability interaction projection', () => {
  it('classifies every approved seven-pair authoring ability from JSON fields', () => {
    const abilities = approvedAuthoringArchives.flatMap(loadedAbilities);
    expect(abilities.length).toBeGreaterThan(0);

    for (const { path, cardId, ability } of abilities) {
      const interaction = rules.classifyAbilityInteraction(ability);
      expect(interaction.kind, `${path} ${cardId} ${ability.id}`).not.toBe('unsupported');

      if (ability.kind === 'phase_action') {
        expect(interaction, `${path} ${cardId} ${ability.id}`).toMatchObject({
          kind: 'phase_activation',
          commandType: 'activate_ability',
        });
        expect(['preparation', 'advance', 'action', 'combat']).toContain(interaction.phase);
      }

      if (ability.kind === 'optional_trigger' || ability.kind === 'response') {
        expect(interaction, `${path} ${cardId} ${ability.id}`).toMatchObject({
          kind: 'response_window',
          commandType: 'resolve_response',
        });
      }

      if (ability.kind === 'forced_trigger') {
        expect(interaction.kind, `${path} ${cardId} ${ability.id}`).toBe('automatic_trigger');
      }

      if (ability.kind === 'passive') {
        const trigger = String(ability.activation.trigger ?? '');
        const expected = trigger && trigger !== 'while_active' && trigger !== 'when_play_requirements_checked'
          ? 'response_window'
          : 'automatic_rule';
        expect(interaction.kind, `${path} ${cardId} ${ability.id}`).toBe(expected);
      }

      if (['residual', 'declaration_reveal', 'conditional_reveal', 'continuous_formula'].includes(ability.kind)) {
        expect(interaction.kind, `${path} ${cardId} ${ability.id}`).toBe('automatic_rule');
      }
    }
  });

  it('exposes advance phase actions only during the advance phase', () => {
    const raw = archive('data/authoring/masters/master.irisviel.json');
    const pack = rules.loadAuthoringJson(raw);
    const state = createSeededGameState();
    state.cards = [];
    state.players[0]!.masterCardId = raw.id;
    state.players[0]!.mana = 4;
    state.round.prioritySeat = 1;
    rules.initializeAbilityRuntime(state, pack, { seed: 42 });
    const conversionMagic = addCard(state, 'master.irisviel.skill.conversion-magic');

    state.round.activePhase = 'action';
    expect(rules.projectAbilityState(state, 'p1').legalActions.some(action =>
      action.type === 'activate_ability' &&
      action.cardInstanceId === conversionMagic &&
      action.abilityId === 'conversion-magic.preparation',
    )).toBe(false);

    state.round.activePhase = 'preparation';
    expect(rules.projectAbilityState(state, 'p1').legalActions.some(action =>
      action.type === 'activate_ability' &&
      action.cardInstanceId === conversionMagic &&
      action.abilityId === 'conversion-magic.preparation',
    )).toBe(false);

    state.round.activePhase = 'advance';
    expect(rules.projectAbilityState(state, 'p1').legalActions.some(action =>
      action.type === 'activate_ability' &&
      action.cardInstanceId === conversionMagic &&
      action.abilityId === 'conversion-magic.preparation',
    )).toBe(true);
  });

  it('offers passive triggered abilities through a declineable response window', () => {
    const raw = archive('data/authoring/servants/servant.ereshkigal.json');
    const pack = rules.loadAuthoringJson(raw);
    const state = createSeededGameState();
    state.cards = [];
    state.players[0]!.servantCardId = raw.id;
    state.round.prioritySeat = 1;
    rules.initializeAbilityRuntime(state, pack, { seed: 42 });
    addCard(state, 'servant.ereshkigal.skill.sc-ereshkigal-2', 'field');

    rules.processAbilityEvent(state, { id: 'eresh-power-window', type: 'when_power_calculation_applied', playerId: 'p1' });

    const actions = rules.projectAbilityState(state, 'p1').legalActions;
    expect(actions).toContainEqual(expect.objectContaining({
      type: 'resolve_response',
      abilityId: 'sc-ereshkigal-2.self-exempt',
    }));
    const decline = actions.find(action => action.type === 'decline_this_window');
    expect(decline).toBeTruthy();
    expect(rules.dispatchAbilityCommand(state, 'p1', decline as any).ok).toBe(true);
    expect(rules.projectAbilityState(state, 'p1').legalActions.some(action => action.type === 'resolve_response')).toBe(false);
  });
});
