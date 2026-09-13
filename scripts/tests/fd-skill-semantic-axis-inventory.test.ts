import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

import { classifyAbility } from '../../docs/audits/fd-skill-semantic-axis-inventory.mjs';

const archive = { id: 'test.archive' };
const card = { id: 'test.card' };

function loadAbility(file: string, abilityId: string) {
  const source = JSON.parse(readFileSync(file, 'utf8'));
  for (const sourceCard of source.cards ?? []) {
    const ability = sourceCard.abilities?.find((candidate: { id?: string }) => candidate.id === abilityId);
    if (ability) return { archive: source, card: sourceCard, ability };
  }
  throw new Error(`Missing authoring ability: ${abilityId}`);
}

describe('semantic-axis interaction classification', () => {
  it('does not classify automatic effect branches as player choices', () => {
    const row = classifyAbility(archive, card, {
      id: 'automatic.branch',
      kind: 'phase_action',
      targets: [],
      effects: [{
        type: 'branch',
        branches: [
          { if: { type: 'can_adjust_mana' }, then: [{ type: 'adjust_mana', amount: 2 }] },
          { else: [{ type: 'adjust_victory_points', amount: 2 }] },
        ],
      }],
    });

    expect(row.interaction).toEqual([]);
  });

  it('does not classify a fixed amount in a choice branch as amount selection', () => {
    const row = classifyAbility(archive, card, {
      id: 'fixed.amount.choice',
      kind: 'phase_action',
      targets: [{
        id: 'chosen_option',
        type: 'choice',
        count: { min: 1, max: 1 },
        options: [{ id: 'pay_three' }],
      }],
      effects: [{
        type: 'branch',
        branches: [{
          if: { type: 'choice_is', choiceId: 'chosen_option', value: 'pay_three' },
          then: [{ type: 'pay_mana', amount: 3 }],
        }],
      }],
    });

    expect(row.interaction).toEqual(['BRANCH_CHOICE']);
    expect(row.interaction).not.toContain('CHOOSE_AMOUNT');
  });

  it('classifies only a structured amount target as amount selection', () => {
    const row = classifyAbility(archive, card, {
      id: 'explicit.amount',
      kind: 'phase_action',
      targets: [{ id: 'chosen_amount', type: 'amount', count: { min: 1, max: 3 } }],
      effects: [],
    });

    expect(row.interaction).toEqual(['CHOOSE_AMOUNT']);
  });

  it.each([
    { visibility: 'private_to_controller', scope: { zone: 'removed_from_game', owner: 'controller' } },
    { visibility: 'controller_private_until_resolution', scope: { zone: 'battle_area', owner: 'controller' } },
    { scope: { zone: 'hand', controller: 'self' } },
    { scope: { zone: 'deck', owner: 'controller' } },
  ])('classifies structured private card targets as hidden information: %j', (target) => {
    const row = classifyAbility(archive, card, {
      id: 'private.target',
      kind: 'phase_action',
      targets: [{ id: 'selected_card', type: 'card_instance', count: { min: 1, max: 1 }, ...target }],
      effects: [],
    });

    expect(row.visibility).toContain('HIDDEN_OR_PRIVATE');
  });

  it.each([
    ['data/authoring/servants/servant.artoriac.json', 'sc-artoriac-5.gain-mana-or-vp', []],
    ['data/authoring/servants/servant.ereshkigal.json', 'sc-ereshkigal-3.blooming-netherworld', []],
    ['data/authoring/servants/servant.drake.json', 'sc-drake-2.reward-and-move', ['CHOOSE_LOCATION']],
    ['data/authoring/servants/servant.kintoki.json', 'sc-kintoki-3.golden-eater', ['CHOOSE_N_CARDS']],
    ['data/authoring/servants/servant.achilles.json', 'sc-achilles-2.blue-sky', ['BRANCH_CHOICE']],
  ])('keeps real ability interaction intent exact: %s / %s', (file, abilityId, expected) => {
    const loaded = loadAbility(file as string, abilityId as string);
    const row = classifyAbility(loaded.archive, loaded.card, loaded.ability);

    expect(row.interaction).toEqual(expected);
    expect(row.interaction).not.toContain('CHOOSE_AMOUNT');
  });

  it.each([
    ['data/authoring/servants/servant.drake.json', 'sc-drake-1.mount-summon'],
    ['data/authoring/servants/servant.kintoki.json', 'sc-kintoki-3.golden-eater'],
  ])('keeps real private target visibility exact: %s / %s', (file, abilityId) => {
    const loaded = loadAbility(file, abilityId);
    const row = classifyAbility(loaded.archive, loaded.card, loaded.ability);

    expect(row.visibility).toContain('HIDDEN_OR_PRIVATE');
  });
});
