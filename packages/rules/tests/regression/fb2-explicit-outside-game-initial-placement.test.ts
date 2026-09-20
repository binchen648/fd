import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { compileExecutableCardPack } from '../../src/ability/executable-card-pack';
import { loadAuthoringJson } from '../../src/ability/loader';

const workspaceRoot = resolve('.');
const packPath = resolve('data/packs/fd-playtest-v1/pack.json');

function sourceInput() {
  const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
  return compileLoadedPlaytestPack(loaded).library;
}

function masterSkillFixture(input: ReturnType<typeof sourceInput>) {
  const archive = input.rules.archives.find((candidate) =>
    candidate.id.startsWith('master.') && candidate.cards.filter((card) => card.cardType === 'master_skill').length >= 2,
  );
  expect(archive).toBeDefined();
  const skills = archive!.cards.filter((card) => card.cardType === 'master_skill');
  return { archive: archive!, source: skills[0]!, target: skills[1]! };
}

function provisioningAbility(targetDefinitionId: string) {
  return {
    id: 'fixture.fb2-18.provision',
    kind: 'forced_trigger',
    printedClause: 'fixture',
    activation: { trigger: 'game_start' },
    conditions: [],
    targets: [],
    cost: [],
    creates: [],
    ruleModifiers: [],
    lifecycle: {},
    responseWindow: {},
    limit: {},
    visibility: {},
    effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [targetDefinitionId] }],
    execution: { mode: 'automatic', allowedOperations: [] },
  };
}

describe('P3-FB2-18 recovery explicit outside-game initial placement', () => {
  it('preserves the exact authoring literal through loadAuthoringJson', () => {
    const input = sourceInput();
    const { archive, target } = masterSkillFixture(input);
    (target as any).initialPlacement = 'outside_game';

    const loaded = loadAuthoringJson(archive);
    expect(loaded.report).toEqual([]);
    expect(loaded.cards[target.id]!.initialPlacement).toBe('outside_game');
  });

  it('registers an owned master_skill without assigning an initial zone', () => {
    const input = sourceInput();
    const { target } = masterSkillFixture(input);
    (target as any).initialPlacement = 'outside_game';

    const executable = compileExecutableCardPack(input);
    expect(executable.cards[target.id]).toMatchObject({
      cardType: 'master_skill',
      initialPlacement: 'outside_game',
    });
    expect(executable.cards[target.id]!.initialZone).toBeUndefined();
  });

  it('keeps ordinary master skills on their existing initial skill-zone path', () => {
    const input = sourceInput();
    const { target } = masterSkillFixture(input);

    const executable = compileExecutableCardPack(input);
    expect(executable.cards[target.id]!.initialPlacement).toBeUndefined();
    expect(executable.cards[target.id]!.initialZone).toBe('skill');
  });

  it.each([
    ['wrong literal', 'skill'],
    ['non-string value', 1],
  ])('fails closed for %s', (_label, value) => {
    const input = sourceInput();
    const { target } = masterSkillFixture(input);
    (target as any).initialPlacement = value;

    expect(() => compileExecutableCardPack(input)).toThrow(/initialPlacement/);
  });

  it('fails closed when outside-game placement is attached to an unsupported card type', () => {
    const input = sourceInput();
    const { target } = masterSkillFixture(input);
    target.cardType = 'command_spell';
    (target as any).initialPlacement = 'outside_game';

    expect(() => compileExecutableCardPack(input)).toThrow(/owned master_skill/);
  });

  it('fails closed when a servant-owned card is disguised as a master_skill', () => {
    const input = sourceInput();
    const servantArchive = input.rules.archives.find((candidate) => candidate.id.startsWith('servant.'))!;
    const target = servantArchive.cards.find((card) => card.cardType === 'servant_skill')!;
    target.cardType = 'master_skill';
    (target as any).initialPlacement = 'outside_game';

    expect(() => compileExecutableCardPack(input)).toThrow(/owned master_skill/);
  });

  it('coexists with FB2-15 provisioning without weakening source/target validation', () => {
    const input = sourceInput();
    const { source, target } = masterSkillFixture(input);
    (target as any).initialPlacement = 'outside_game';
    source.abilities = [provisioningAbility(target.id) as any];

    const executable = compileExecutableCardPack(input);
    expect(executable.cards[source.id]!.initialZone).toBe('skill');
    expect(executable.cards[target.id]!.initialZone).toBeUndefined();
  });

  it('still rejects a game-start provisioning source that is itself explicitly deferred', () => {
    const input = sourceInput();
    const { source, target } = masterSkillFixture(input);
    (source as any).initialPlacement = 'outside_game';
    (target as any).initialPlacement = 'outside_game';
    source.abilities = [provisioningAbility(target.id) as any];

    expect(() => compileExecutableCardPack(input)).toThrow(/source cannot itself be deferred/);
  });
});
