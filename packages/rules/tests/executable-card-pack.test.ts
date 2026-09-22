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

function masterSupportArchive(mutate?: (archive: any) => void): any {
  const archive: any = {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_support_definition_archive',
    id: 'master.support-owner',
    name: 'Support Owner',
    cards: [{
      id: 'card.support.only',
      name: 'Support Only',
      cardType: 'master_skill',
      initialPlacement: 'outside_game',
      printedText: 'support only',
      cardFace: { cost: 1, basePower: 1 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [],
    }],
  };
  mutate?.(archive);
  return archive;
}

function masterRuleArchive(mutate?: (archive: any) => void): any {
  const archive: any = {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'master_rule_definition_archive',
    id: 'master.rule-owner',
    name: 'Rule Owner',
    cards: [
      {
        id: 'master.rule-owner.skill.source', name: 'Rule Source', cardType: 'master_skill',
        owner: { type: 'master', id: 'master.rule-owner' }, printedText: 'provision target',
        cardFace: { typeLabel: '被动', attributes: [] }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [], abilities: [{
          id: 'source.game-start-provision', kind: 'forced_trigger', printedClause: 'provision target',
          activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
          lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
          effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: ['master.rule-owner.skill.target'] }],
          execution: { mode: 'automatic', allowedOperations: [] },
        }],
      },
      {
        id: 'master.rule-owner.skill.target', name: 'Rule Target', cardType: 'master_skill',
        owner: { type: 'master', id: 'master.rule-owner' }, initialPlacement: 'outside_game', printedText: 'target',
        cardFace: { cost: 1, basePower: 1 }, playTiming: { phase: 'action', window: 'controller_play_card_window' },
        playRequirements: [], abilities: [],
      },
    ],
  };
  mutate?.(archive);
  return archive;
}


function eventRuleArchive(mutate?: (archive: any) => void): any {
  const archive: any = {
    schemaVersion: 'fd-card-authoring-v1',
    archiveType: 'event_rule_definition_archive',
    id: 'master.synthetic-event-rules',
    name: 'Synthetic Event Rules',
    cards: [{
      id: 'master.synthetic-event.skill.objective',
      name: 'Synthetic Objective',
      cardType: 'event',
      printedText: 'event rule only',
      cardFace: { cost: 0, basePower: 0 },
      playTiming: { phase: 'action', window: 'controller_play_card_window' },
      playRequirements: [],
      abilities: [],
    }],
  };
  mutate?.(archive);
  return archive;
}

describe('ExecutableCardPack compiler', () => {
  it('normalizes one canonical runtime definition and explicit deck per source archive', () => {
    const input = sourceInput();
    const executable = compileExecutableCardPack(input);

    expect(executable.schemaVersion).toBe('fd-executable-card-pack-v1');
    expect(executable).not.toHaveProperty('archives');
    expect(executable.definitionHash).toMatch(/^[a-f0-9]{64}$/);
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

  it('registers master support archives without creating playable character, fallback spell, deck, or archive-order drift', () => {
    const input = sourceInput();
    const baseline = compileExecutableCardPack(input);
    const baselineArchiveIds = input.rules.archives.map((archive) => archive.id);
    input.rules.archives.push(masterSupportArchive());

    const executable = compileExecutableCardPack(input);
    expect(input.rules.archives.slice(0, baselineArchiveIds.length).map((archive) => archive.id)).toEqual(baselineArchiveIds);
    expect(Object.keys(executable.cards)).toHaveLength(Object.keys(baseline.cards).length + 1);
    expect(executable.cards['card.support.only']).toMatchObject({
      ownerId: 'master.support-owner',
      cardType: 'master_skill',
      initialPlacement: 'outside_game',
    });
    expect(executable.cards['card.support.only']!.initialZone).toBeUndefined();
    expect(executable.characters['master.support-owner']).toBeUndefined();
    expect(executable.fallbackCommandSpells['master.support-owner']).toBeUndefined();
    expect(executable.cards['master.support-owner.command-spell']).toBeUndefined();
    expect(executable.decks['master.support-owner']).toBeUndefined();
    expect(executable.sourceMap['servant.artoriac.skill.sc-artoriac-1']!.archiveIndex).toBe(7);
    expect(() => assertExecutableCardPack(executable, input)).not.toThrow();
  });

  it.each([
    ['missing support discriminator', (archive: any) => { delete archive.archiveType; }, /support-shaped archive requires archiveType=master_support_definition_archive/],
    ['normal-master discriminator on support shape', (archive: any) => { archive.archiveType = 'master_skill_card_archive'; }, /support-shaped archive requires archiveType=master_support_definition_archive/],
    ['near-match support discriminator', (archive: any) => { archive.archiveType = 'master_support_definition_archive_x'; }, /support-shaped archive requires archiveType=master_support_definition_archive/],
    ['wrong owner family', (archive: any) => { archive.id = 'servant.support-owner'; }, /id must start with master\./],
    ['empty archive', (archive: any) => { archive.cards = []; }, /must contain at least one card/],
    ['non-master-skill card', (archive: any) => { archive.cards[0].cardType = 'command_spell'; }, /only master_skill cards/],
    ['missing outside-game placement', (archive: any) => { delete archive.cards[0].initialPlacement; }, /requires initialPlacement=outside_game/],
    ['deck surface', (archive: any) => { archive.deck = []; }, /cannot define a deck/],
    ['playable public information', (archive: any) => { archive.publicInformation = { initialMana: 4 }; }, /cannot define playable master publicInformation/],
  ])('fails closed for malformed executable master support archive: %s', (_name, mutate, expected) => {
    const input = sourceInput();
    input.rules.archives.push(masterSupportArchive(mutate));
    expect(() => compileExecutableCardPack(input)).toThrow(expected);
  });

  it('compiles mixed master rule archives without playable character, fallback spell, or deck surface', () => {
    const input = sourceInput();
    const baseline = compileExecutableCardPack(input);
    const baselineArchiveIds = input.rules.archives.map((archive) => archive.id);
    input.rules.archives.push(masterRuleArchive());

    const executable = compileExecutableCardPack(input);
    expect(input.rules.archives.slice(0, baselineArchiveIds.length).map((archive) => archive.id)).toEqual(baselineArchiveIds);
    expect(Object.keys(executable.cards)).toHaveLength(Object.keys(baseline.cards).length + 2);
    expect(executable.cards['master.rule-owner.skill.source']).toMatchObject({
      ownerId: 'master.rule-owner', cardType: 'master_skill', initialZone: 'skill',
    });
    expect(executable.cards['master.rule-owner.skill.target']).toMatchObject({
      ownerId: 'master.rule-owner', cardType: 'master_skill', initialPlacement: 'outside_game',
    });
    expect(executable.cards['master.rule-owner.skill.target']!.initialZone).toBeUndefined();
    expect(executable.characters['master.rule-owner']).toBeUndefined();
    expect(executable.fallbackCommandSpells['master.rule-owner']).toBeUndefined();
    expect(executable.cards['master.rule-owner.command-spell']).toBeUndefined();
    expect(executable.decks['master.rule-owner']).toBeUndefined();
    expect(() => assertExecutableCardPack(executable, input)).not.toThrow();
  });

  it.each([
    ['missing rule discriminator', (archive: any) => { delete archive.archiveType; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['normal-master discriminator on rule shape', (archive: any) => { archive.archiveType = 'master_skill_card_archive'; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['near-match rule discriminator', (archive: any) => { archive.archiveType = 'master_rule_definition_archive_x'; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['missing rule discriminator + deck', (archive: any) => { delete archive.archiveType; archive.deck = []; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['normal-master discriminator + deck', (archive: any) => { archive.archiveType = 'master_skill_card_archive'; archive.deck = []; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['near-match rule discriminator + deck', (archive: any) => { archive.archiveType = 'master_rule_definition_archive_x'; archive.deck = []; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['missing rule discriminator + publicInformation', (archive: any) => { delete archive.archiveType; archive.publicInformation = { initialMana: 4 }; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['normal-master discriminator + publicInformation', (archive: any) => { archive.archiveType = 'master_skill_card_archive'; archive.publicInformation = { initialMana: 4 }; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['near-match rule discriminator + publicInformation', (archive: any) => { archive.archiveType = 'master_rule_definition_archive_x'; archive.publicInformation = { initialMana: 4 }; }, /rule-shaped archive requires archiveType=master_rule_definition_archive/],
    ['support discriminator on mixed shape', (archive: any) => { archive.archiveType = 'master_support_definition_archive'; }, /requires initialPlacement=outside_game/],
    ['wrong owner family', (archive: any) => { archive.id = 'servant.rule-owner'; }, /id must start with master\./],
    ['one-card archive', (archive: any) => { archive.cards = [archive.cards[0]]; }, /at least two cards/],
    ['non-master-skill card', (archive: any) => { archive.cards[0].cardType = 'command_spell'; }, /only master_skill cards/],
    ['missing outside-game card', (archive: any) => { delete archive.cards[1].initialPlacement; }, /requires at least one initialPlacement=outside_game/],
    ['all-outside-game support shape', (archive: any) => { archive.cards[0].initialPlacement = 'outside_game'; }, /support-shaped archive requires archiveType=master_support_definition_archive/],
    ['mismatched card owner', (archive: any) => { archive.cards[0].owner.id = 'master.other'; }, /card owner must match archive id/],
    ['deck surface', (archive: any) => { archive.deck = []; }, /cannot define a deck/],
    ['playable public information', (archive: any) => { archive.publicInformation = { initialMana: 4 }; }, /cannot define playable master publicInformation/],
  ])('fails closed for malformed executable mixed master rule archive: %s', (_name, mutate, expected) => {
    const input = sourceInput();
    input.rules.archives.push(masterRuleArchive(mutate));
    expect(() => compileExecutableCardPack(input)).toThrow(expected);
  });

  it('preserves the structural outer_god_life semantic category into executable definitions', () => {
    const input = sourceInput();
    const source = input.rules.archives.flatMap((archive) => archive.cards).find((card) => card.id === 'servant.artoriac.skill.sc-artoriac-1')!;
    source.cardFace.semanticCategory = 'outer_god_life';
    const executable = compileExecutableCardPack(input);
    expect(executable.cards[source.id]!.cardFace.semanticCategory).toBe('outer_god_life');
    expect(() => assertExecutableCardPack(executable, input)).not.toThrow();
  });

  it('compiles event rule archives into a separate executable eventRules map without player-product surfaces', () => {
    const input = sourceInput();
    const baseline = compileExecutableCardPack(input);
    input.rules.archives.push(eventRuleArchive());

    const executable = compileExecutableCardPack(input);
    expect(Object.keys(executable.cards)).toHaveLength(Object.keys(baseline.cards).length);
    expect(executable.cards['master.synthetic-event.skill.objective']).toBeUndefined();
    expect(executable.eventRules['master.synthetic-event.skill.objective']).toMatchObject({
      id: 'master.synthetic-event.skill.objective', cardType: 'event', mode: 'automatic',
    });
    expect(executable.eventCatalog?.['event.waxing_moon_ritual.akasaka']).toMatchObject({
      id: 'event.waxing_moon_ritual.akasaka', eventSetIds: ['event-set.waxing_moon_ritual'],
    });
    expect(executable.eventCatalog?.['master.synthetic-event.skill.objective']).toMatchObject({
      id: 'master.synthetic-event.skill.objective', tags: [], eventSetIds: [],
    });
    expect(executable.characters['master.synthetic-event-rules']).toBeUndefined();
    expect(executable.fallbackCommandSpells['master.synthetic-event-rules']).toBeUndefined();
    expect(executable.decks['master.synthetic-event-rules']).toBeUndefined();
    expect(executable.sourceMap['master.synthetic-event.skill.objective']).toMatchObject({ archiveId: 'master.synthetic-event-rules' });
    expect(() => assertExecutableCardPack(executable, input)).not.toThrow();
  });

  it.each([
    ['missing discriminator', (archive: any) => { delete archive.archiveType; }, /Event rule-shaped archive requires archiveType=event_rule_definition_archive/],
    ['master-rule discriminator', (archive: any) => { archive.archiveType = 'master_rule_definition_archive'; }, /Event rule-shaped archive requires archiveType=event_rule_definition_archive/],
    ['near-match discriminator', (archive: any) => { archive.archiveType = 'event_rule_definition_archive_x'; }, /Event rule-shaped archive requires archiveType=event_rule_definition_archive/],
    ['missing discriminator + deck', (archive: any) => { delete archive.archiveType; archive.deck = []; }, /Event rule-shaped archive requires archiveType=event_rule_definition_archive/],
    ['near-match discriminator + publicInformation', (archive: any) => { archive.archiveType = 'event_rule_definition_archive_x'; archive.publicInformation = { initialMana: 4 }; }, /Event rule-shaped archive requires archiveType=event_rule_definition_archive/],
    ['empty archive', (archive: any) => { archive.cards = []; }, /at least one card/],
    ['non-event card', (archive: any) => { archive.cards[0].cardType = 'master_skill'; }, /only event cards/],
    ['player initial placement', (archive: any) => { archive.cards[0].initialPlacement = 'outside_game'; }, /cannot define player-card initialPlacement/],
    ['deck surface', (archive: any) => { archive.deck = []; }, /cannot define a deck/],
    ['playable public information', (archive: any) => { archive.publicInformation = { initialMana: 4 }; }, /cannot define playable publicInformation/],
    ['empty event tag', (archive: any) => { archive.cards[0].cardFace.eventTags = ['']; }, /eventTags must be an array of nonempty strings/],
    ['negative printed reward', (archive: any) => { archive.cards[0].cardFace.printedReward = -1; }, /printedReward must be a nonnegative integer/],
    ['missing event trigger', (archive: any) => { archive.cards[0].abilities = [{ id: 'bad', activation: { eventController: 'event_player' } }]; }, /event rule ability trigger is required/i],
    ['missing event controller', (archive: any) => { archive.cards[0].abilities = [{ id: 'bad', activation: { trigger: 'round_end' } }]; }, /event rule ability eventController is required/i],
    ['invalid event controller', (archive: any) => { archive.cards[0].abilities = [{ id: 'bad', activation: { trigger: 'round_end', eventController: 'identity_owner' } }]; }, /eventController is unsupported/],
    ['mixed event/non-event + missing discriminator', (archive: any) => { delete archive.archiveType; archive.cards.push({ ...archive.cards[0], id: 'master.synthetic.skill', cardType: 'master_skill' }); }, /Event rule-shaped archive requires archiveType=event_rule_definition_archive/],
    ['mixed event/non-event + near-match + deck', (archive: any) => { archive.archiveType = 'event_rule_definition_archive_x'; archive.deck = []; archive.cards.push({ ...archive.cards[0], id: 'master.synthetic.skill', cardType: 'master_skill' }); }, /Event rule-shaped archive requires archiveType=event_rule_definition_archive/],
  ])('fails closed for malformed executable event rule archive: %s', (_name, mutate, expected) => {
    const input = sourceInput();
    input.rules.archives.push(eventRuleArchive(mutate));
    expect(() => compileExecutableCardPack(input)).toThrow(expected);
  });

  it('classifies exact required-additional master skills as attack-area cards through the shared marker contract', () => {
    const input = sourceInput();
    const executable = compileExecutableCardPack(input);
    expect(executable.cards['master.maiya.deck.support-shot']).toMatchObject({
      cardType: 'master_skill',
      playKind: 'attack',
      destinationZone: 'attack_area',
    });

    const unmarkedInput = sourceInput();
    const support = unmarkedInput.rules.archives.find((archive) => archive.id === 'master.maiya')!
      .cards.find((card) => card.id === 'master.maiya.deck.support-shot')!;
    support.abilities = support.abilities!.filter((ability) =>
      !ability.effects?.some((effect) => effect.type === 'append_only_rule' && effect.rule === undefined));
    const unmarked = compileExecutableCardPack(unmarkedInput);
    expect(unmarked.cards['master.maiya.deck.support-shot']).toMatchObject({
      playKind: 'support',
      destinationZone: 'field',
    });

    const nearMatchInput = sourceInput();
    const nearMatch = nearMatchInput.rules.archives.find((archive) => archive.id === 'master.maiya')!
      .cards.find((card) => card.id === 'master.maiya.deck.support-shot')!
      .abilities!.find((ability) => ability.effects?.some((effect) => effect.type === 'append_only_rule'))!;
    nearMatch.responseWindow = { priority: 'turn_order' };
    const nearMatchCompiled = compileExecutableCardPack(nearMatchInput);
    expect(nearMatchCompiled.cards['master.maiya.deck.support-shot']).toMatchObject({
      playKind: 'support',
      destinationZone: 'field',
    });
  });

  it('defers game-start provisioned master skills from initial state placement', () => {
    const input = sourceInput();
    const baseline = compileExecutableCardPack(input);
    const archive = input.rules.archives.find((candidate) =>
      candidate.id.startsWith('master.') &&
      candidate.cards.filter((card) => card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill').length >= 2);
    expect(archive).toBeDefined();
    const [source, target] = archive!.cards.filter((card) =>
      card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill');
    expect(source).toBeDefined();
    expect(target).toBeDefined();
    source!.abilities = [{
      id: 'fixture.game-start-provision', kind: 'forced_trigger', printedClause: 'fixture',
      activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [target!.id] }],
      execution: { mode: 'automatic', allowedOperations: [] },
    } as any];

    const executable = compileExecutableCardPack(input);
    expect(executable.cards[source!.id]!.initialZone).toBe('skill');
    expect(executable.cards[target!.id]!.initialZone).toBeUndefined();
  });

  it.each([
    ['non-game-start trigger', (ability: any) => { ability.activation = { trigger: 'while_active' }; }],
    ['duplicate target ids', (ability: any, targetId: string) => { ability.effects[0].targetDefinitionIds = [targetId, targetId]; }],
    ['extra effect field', (ability: any) => { ability.effects[0].reason = 'unsupported-extra-shape'; }],
    ['extra effect', (ability: any) => { ability.effects.push({ type: 'noop' }); }],
  ])('rejects malformed provisioning envelope before it can defer initial skills: %s', (_name, mutate) => {
    const input = sourceInput();
    const baseline = compileExecutableCardPack(input);
    const archive = input.rules.archives.find((candidate) =>
      candidate.id.startsWith('master.') &&
      candidate.cards.filter((card) => card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill').length >= 2)!;
    const [source, target] = archive.cards.filter((card) =>
      card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill');
    const ability: any = {
      id: 'fixture.invalid-game-start-provision', kind: 'forced_trigger', printedClause: 'fixture',
      activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [target!.id] }],
      execution: { mode: 'automatic', allowedOperations: [] },
    };
    mutate(ability, target!.id);
    source!.abilities = [ability];

    expect(() => compileExecutableCardPack(input)).toThrow(/Unsupported game-start skill provisioning shape/);
  });

  it('rejects a structurally valid provisioning envelope from a command-spell source', () => {
    const input = sourceInput();
    const baseline = compileExecutableCardPack(input);
    const archive = input.rules.archives.find((candidate) => candidate.id.startsWith('master.') &&
      candidate.cards.some((card) => card.cardType === 'command_spell') &&
      candidate.cards.some((card) => card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill'))!;
    const source = archive.cards.find((card) => card.cardType === 'command_spell')!;
    const target = archive.cards.find((card) => card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill')!;
    source.abilities = [{
      id: 'fixture.command-spell-provision', kind: 'forced_trigger', printedClause: 'fixture',
      activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
      lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
      effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [target.id] }],
      execution: { mode: 'automatic', allowedOperations: [] },
    } as any];

    expect(() => compileExecutableCardPack(input)).toThrow(/source must be an owned master_skill/);
  });

  it('rejects cross-owner and self provisioning targets before initial-zone deferral', () => {
    const makeInput = (selfTarget: boolean) => {
      const input = sourceInput();
      const baseline = compileExecutableCardPack(input);
      const sourceArchive = input.rules.archives.find((candidate) => candidate.id.startsWith('master.') &&
        candidate.cards.filter((card) => card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill').length >= 1)!;
      const source = sourceArchive.cards.find((card) => card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill')!;
      const otherTarget = input.rules.archives.find((candidate) => candidate.id.startsWith('master.') && candidate.id !== sourceArchive.id)!
        .cards.find((card) => card.cardType === 'master_skill' && baseline.cards[card.id]?.initialZone === 'skill')!;
      source.abilities = [{
        id: 'fixture.invalid-target-provision', kind: 'forced_trigger', printedClause: 'fixture',
        activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
        lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [selfTarget ? source.id : otherTarget.id] }],
        execution: { mode: 'automatic', allowedOperations: [] },
      } as any];
      return input;
    };

    expect(() => compileExecutableCardPack(makeInput(false))).toThrow(/Invalid game-start skill provisioning target/);
    expect(() => compileExecutableCardPack(makeInput(true))).toThrow(/Invalid game-start skill provisioning target/);
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
    ['unsupported card-zone move owner', (input: ReturnType<typeof sourceInput>) => {
      const conversion = input.rules.archives.find((archive) => archive.id === 'master.irisviel')!
        .cards.find((card) => card.id === 'master.irisviel.skill.conversion-magic')!
        .abilities!.find((ability) => ability.id === 'conversion-magic.preparation')!;
      conversion.effects![0]!.owner = 'opponent';
    }, /Executable compilation rejected unsupported semantics[\s\S]*Only controller ownership is supported/],
    ['unsupported card-zone move destination', (input: ReturnType<typeof sourceInput>) => {
      const conversion = input.rules.archives.find((archive) => archive.id === 'master.irisviel')!
        .cards.find((card) => card.id === 'master.irisviel.skill.conversion-magic')!
        .abilities!.find((ability) => ability.id === 'conversion-magic.preparation')!;
      conversion.effects![0]!.to = { zone: 'attack_area' };
    }, /Resolution data-flow validation failed[\s\S]*Only controller hand to discard move_all_remaining is supported/],
    ['unsupported card-zone draw player', (input: ReturnType<typeof sourceInput>) => {
      const timeAlter = input.rules.archives.find((archive) => archive.id === 'master.kiritsugu')!
        .cards.find((card) => card.id === 'master.kiritsugu.skill.time-alter')!
        .abilities!.find((ability) => ability.id === 'time-alter.action')!;
      timeAlter.effects![1]!.player = 'opponent';
    }, /Executable compilation rejected unsupported semantics[\s\S]*Only controller resource\/movement effects are supported/],
    ['unsupported add-to-attack return marker', (input: ReturnType<typeof sourceInput>) => {
      const support = input.rules.archives.find((archive) => archive.id === 'master.maiya')!
        .cards.find((card) => card.id === 'master.maiya.skill.military')!
        .abilities!.find((ability) => ability.id === 'military.attach-support-shot')!;
      support.effects![0]!.returnAtRoundEnd = false;
    }, /Resolution data-flow validation failed[\s\S]*Only return-at-round-end Maiya cannot-win support attachments are supported/],
    ['unsupported source-card response face-down play', (input: ReturnType<typeof sourceInput>) => {
      const volumen = input.rules.archives.find((archive) => archive.id === 'master.kayneth')!
        .cards.find((card) => card.id === 'master.kayneth.deck.volumen-hydrargyrum')!
        .abilities!.find((ability) => ability.id === 'volumen.extra-play')!;
      volumen.effects![0]!.face = 'face_down';
    }, /Resolution data-flow validation failed[\s\S]*Only face-up source-card response play is supported/],
  ])('fails closed for %s', (_name, mutate, expected) => {
    const input = sourceInput();
    mutate(input);

    expect(() => compileExecutableCardPack(input)).toThrow(expected);
  });

  it.each([
    ['private target visibility drift', (ability: any) => { ability.targets[0].visibility = 'public'; }],
    ['optional target max drift', (ability: any) => { ability.targets[0].count.max = 2; }],
    ['hand scope drift', (ability: any) => { ability.targets[0].scope.zone = 'discard'; }],
    ['base-power constraint drift', (ability: any) => { ability.targets[0].constraints[0].value = 4; }],
    ['continuation effect drift', (ability: any) => { ability.effects[0].type = 'draw_cards'; ability.effects[0].count = 1; delete ability.effects[0].target; }],
  ])('fails closed for TO13 private optional interaction %s', (_name, mutate) => {
    const input = sourceInput();
    const archive = input.rules.archives.find((candidate) => candidate.id === 'servant.drake')!;
    const card = archive.cards.find((candidate) => candidate.id === 'servant.drake.skill.sc-drake-1')!;
    const ability = card.abilities!.find((candidate) => candidate.id === 'sc-drake-1.mount-summon')!;
    mutate(ability);
    expect(() => compileExecutableCardPack(input)).toThrow(/Unsupported private optional hand-play interaction semantic shape/);
  });

  it('fails closed for an unsupported lifecycle source-validity policy through the executable compiler path', () => {
    const input = sourceInput();
    const archive = input.rules.archives.find((candidate) => candidate.id === 'servant.artoriac')!;
    const card = archive.cards.find((candidate) => candidate.id === 'servant.artoriac.skill.sc-artoriac-3')!;
    const ability = card.abilities!.find((candidate) => candidate.id === 'sc-artoriac-3.discard-public-and-power-formula')!;
    (ability.lifecycle!.sourceValidity as { policyId: string }).policyId = 'unknown-source-state-policy';

    expect(() => compileExecutableCardPack(input)).toThrow(/Unsupported Card Zone source-validity policy/);
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
