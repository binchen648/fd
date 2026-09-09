import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { assertExecutableCardPack, compileExecutableCardPack } from '../src/ability/executable-card-pack';
import type { ResolutionEffectNode } from '../src/ability/resolution-dataflow';

const workspaceRoot = resolve('.');
const packPath = resolve('data/packs/fd-playtest-v1/pack.json');

function sourceInput() {
  const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
  return compileLoadedPlaytestPack(loaded).library;
}

function installResolutionFixture(input: ReturnType<typeof sourceInput>, effects: ResolutionEffectNode[]): void {
  input.rules.archives[7]!.cards[0]!.abilities![0]!.effects = effects;
}

describe('ExecutableCardPack compiler', () => {
  it('normalizes one canonical runtime definition and explicit deck per source archive', () => {
    const input = sourceInput();
    const executable = compileExecutableCardPack(input);

    expect(executable.schemaVersion).toBe('fd-executable-card-pack-v1');
    expect(executable).not.toHaveProperty('archives');
    expect(executable.definitionHash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(executable.cards)).toHaveLength(70);
    expect(Object.values(executable.decks)).toHaveLength(7);
    expect(Object.values(executable.decks).every((deck) => deck.length === 12)).toBe(true);
    expect(executable.cards['servant.artoriac.skill.sc-artoriac-1']).toMatchObject({
      ownerId: 'servant.artoriac',
      playKind: 'attack',
      destinationZone: 'attack_area',
      initialZone: 'skill',
    });
    expect(executable.sourceMap['servant.artoriac.skill.sc-artoriac-1']).toEqual({
      archiveId: 'servant.artoriac',
      archiveIndex: 7,
      cardIndex: 0,
      path: 'archives[7].cards[0]',
    });
    expect(() => assertExecutableCardPack(executable, input)).not.toThrow();
    expect(() => assertExecutableCardPack({ ...executable, definitionHash: '0'.repeat(64) }, input)).toThrow(/hash mismatch/);
    const changedClassification = structuredClone(executable);
    changedClassification.cards['servant.artoriac.skill.sc-artoriac-1']!.destinationZone = 'field';
    expect(() => assertExecutableCardPack(changedClassification, input)).toThrow(/hash mismatch/);
  });

  it.each([
    ['requirement', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.cards[0]!.playRequirements![0]!.value = 9;
    }],
    ['effect parameter', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.cards[0]!.abilities![2]!.effects![0]!.to = { zone: 'discard', owner: 'controller' };
    }],
  ])('changes definitionHash when golden-card %s changes', (_name, mutate) => {
    const baseline = compileExecutableCardPack(sourceInput()).definitionHash;
    const changed = sourceInput();
    mutate(changed);
    expect(compileExecutableCardPack(changed).definitionHash).not.toBe(baseline);
  });

  it.each([
    ['unsupported mechanic', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.cards[0]!.abilities![0]!.effects = [{ type: 'unknown_phase_2_effect' }];
    }, /Unmapped type/],
    ['duplicate card id', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[8]!.cards[0]!.id = input.rules.archives[7]!.cards[0]!.id;
    }, /Duplicate card definition/],
    ['dangling skillCardId', (input: ReturnType<typeof sourceInput>) => {
      input.servants[0]!.skillCardIds[0] = 'servant.missing.skill.card';
    }, /references missing skill card/],
    ['unknown deck entry', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.deck![0]!.cardId = 'card.guessed-fallback';
    }, /Unknown deck entry/],
    ['11-card deck', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.deck![0]!.count = input.rules.archives[7]!.deck![0]!.count! - 1;
    }, /exactly 12 cards; found 11/],
    ['13-card deck', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.deck![0]!.count = input.rules.archives[7]!.deck![0]!.count! + 1;
    }, /exactly 12 cards/],
    ['invalid primitive parameter', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.cards[0]!.abilities![0]!.effects = [{ type: 'draw_cards', count: 'two' }];
    }, /Draw count must be a nonnegative integer/],
    ['missing named reference', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.cards = input.rules.archives[7]!.cards.filter((card) =>
        card.id !== 'servant.artoriac.skill.sc-artoriac-4');
    }, /references missing card/],
    ['dangling rule reference', (input: ReturnType<typeof sourceInput>) => {
      const card = input.rules.archives[7]!.cards.find((candidate) =>
        candidate.id === 'servant.artoriac.skill.sc-artoriac-4')!;
      card.abilities![0]!.creates = [{ type: 'create_card', cardId: 'card.missing', to: { zone: 'deck', owner: 'controller' } }];
    }, /references missing card/],
    ['missing target reference', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives[7]!.cards[0]!.abilities![2]!.effects![0]!.target = 'missing_target';
    }, /references missing target/],
    ['invalid direct resource amount', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives.flatMap((archive) => archive.cards).find((card) => card.cardType === 'command_spell')!.abilities![0]!.effects![0]!.amount = 'four';
    }, /Executable compilation rejected unsupported semantics[\s\S]*Expected a numeric amount or controlled AST/],
    ['unsupported direct resource target', (input: ReturnType<typeof sourceInput>) => {
      input.rules.archives.flatMap((archive) => archive.cards).find((card) => card.cardType === 'command_spell')!.abilities![0]!.effects![0]!.player = 'opponent';
    }, /Executable compilation rejected unsupported semantics[\s\S]*Only controller resource\/movement effects are supported/],
  ])('fails closed for %s', (_name, mutate, expected) => {
    const input = sourceInput();
    mutate(input);

    expect(() => compileExecutableCardPack(input)).toThrow(expected);
  });

  it('accepts Phase 3A resolution data-flow nodes through the executable compiler path', () => {
    const input = sourceInput();
    installResolutionFixture(input, [
      {
        id: 'effect-a',
        type: 'remove_advantage_position',
        target: { expr: 'same_battlefield_opponents' },
        bind: 'removedAdvantages',
      },
      {
        id: 'effect-b',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding: 'removedAdvantages', field: 'removedCount', valueType: 'number' },
      },
    ]);

    expect(() => compileExecutableCardPack(input)).not.toThrow();
  });

  it.each([
    ['unknown binding', [
      {
        id: 'effect-b',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding: 'missing', field: 'removedCount', valueType: 'number' },
      },
    ] satisfies ResolutionEffectNode[], /Resolution data-flow validation failed[\s\S]*unknown_binding/],
    ['future binding', [
      {
        id: 'effect-b',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: { expr: 'binding_field', binding: 'later', field: 'removedCount', valueType: 'number' },
      },
      {
        id: 'effect-a',
        type: 'remove_advantage_position',
        target: { expr: 'same_battlefield_opponents' },
        bind: 'later',
      },
    ] satisfies ResolutionEffectNode[], /Resolution data-flow validation failed[\s\S]*future_binding/],
    ['wrong expression type', [
      {
        id: 'effect-a',
        type: 'remove_advantage_position',
        target: { expr: 'same_battlefield_opponents' },
        bind: 'removedAdvantages',
      },
      {
        id: 'effect-b',
        type: 'remove_advantage_position',
        target: { expr: 'binding_field', binding: 'removedAdvantages', field: 'removedCount', valueType: 'player_ids' },
      },
    ] satisfies ResolutionEffectNode[], /Resolution data-flow validation failed[\s\S]*wrong_expression_type/],
    ['schema-runtime field drift', [
      {
        id: 'effect-a',
        type: 'adjust_victory_points',
        player: 'controller',
        amount: 1,
        bind: 'vpResult',
      },
      {
        id: 'effect-b',
        type: 'remove_advantage_position',
        target: { expr: 'binding_field', binding: 'vpResult', field: 'playerId', valueType: 'player_ids' },
      },
    ] satisfies ResolutionEffectNode[], /Resolution data-flow validation failed[\s\S]*invalid_result_field/],
  ])('fails closed for Phase 3A resolution data-flow %s through the executable compiler path', (_name, effects, expected) => {
    const input = sourceInput();
    installResolutionFixture(input, effects);

    expect(() => compileExecutableCardPack(input)).toThrow(expected);
  });
});
