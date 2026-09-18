import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '@fd/content';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { compileExecutableCardPack } from '../src/ability/executable-card-pack';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const workspaceRoot = resolve('.');
const packPath = resolve('data/packs/fd-playtest-v1/pack.json');

const members = [
  {
    ownerId: 'master.ciel', sourceId: 'master.ciel.skill.s1a', legacyId: 's1a', name: '埋葬机关的修女',
    text: '将【火葬式典】加入你的技能区。', sha: '2cdf7e6bcc7876757898867a73658374247440ab0d78a6a21d2b8f34cf19d486',
    targetId: 'master.ciel.skill.s2', abilityId: 's1a.game-start-skill-provisioning', file: 'data/authoring/masters/master.ciel.json',
  },
  {
    ownerId: 'master.shiki-ryougi', sourceId: 'master.shiki-ryougi.skill.s1a', legacyId: 's1a', name: '欠损',
    text: '游戏开始时，将【死・紧握】加入你的技能区。', sha: 'd1e84428f5798f573fd01ed7f061e937925424f2fbab89c4a43ad6af7782d98f',
    targetId: 'master.shiki-ryougi.skill.s3', abilityId: 's1a.game-start-skill-provisioning', file: 'data/authoring/masters/master.shiki-ryougi.json',
  },
  {
    ownerId: 'master.shirou-emiya', sourceId: 'master.shirou-emiya.skill.s2', legacyId: 's2', name: '投影',
    text: '将【干将·莫邪】加入你的技能区。', sha: 'a0ea1f45cedb3ac69c9d4050cfdadcf318cf32f62b749013a8454245535ca575',
    targetId: 'card.derived.master.shirou-emiya.ganjiang-moye', abilityId: 's2.game-start-skill-provisioning', file: 'data/authoring/masters/master.shirou-emiya.json',
  },
] as const;

function archive(file: string): any {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function production() {
  const loaded = loadPlaytestContentPack(packPath, { workspaceRoot });
  const compiled = compileLoadedPlaytestPack(loaded).library;
  const executable = compileExecutableCardPack(compiled);
  return { loaded, compiled, executable };
}

describe('P3-FB2-26 exact three provisioning consumer migration', () => {
  it('materializes exactly the three F1-grounded sources in mixed rules-only owner archives', () => {
    const manifest = JSON.parse(readFileSync(packPath, 'utf8')) as any;
    expect(manifest.authoringMasterSupportFiles).toEqual([]);
    expect(manifest.authoringMasterRuleFiles).toEqual(members.map((member) => member.file));

    for (const member of members) {
      const ownerArchive = archive(member.file);
      expect(ownerArchive.archiveType).toBe('master_rule_definition_archive');
      expect(ownerArchive.cards.map((card: any) => card.id)).toEqual([member.sourceId, member.targetId]);

      const source = ownerArchive.cards[0];
      const target = ownerArchive.cards[1];
      expect(source).toMatchObject({
        id: member.sourceId, aliases: [member.legacyId], legacyId: member.legacyId, name: member.name,
        cardType: 'master_skill', owner: { type: 'master', id: member.ownerId }, printedText: member.text,
        cardFace: { typeLabel: '被动', attributes: [] },
      });
      expect(source.initialPlacement).toBeUndefined();
      expect(target).toMatchObject({
        id: member.targetId, cardType: 'master_skill', owner: { type: 'master', id: member.ownerId },
        initialPlacement: 'outside_game',
      });
      expect(sha(source.printedText)).toBe(member.sha);
      expect(source.abilities).toHaveLength(1);
      expect(source.abilities[0]).toMatchObject({
        id: member.abilityId, kind: 'forced_trigger', printedClause: member.text,
        activation: { trigger: 'game_start' }, conditions: [], targets: [], cost: [], creates: [], ruleModifiers: [],
        lifecycle: {}, responseWindow: {}, limit: {}, visibility: {},
        effects: [{ type: 'provision_skill_cards', player: 'controller', targetDefinitionIds: [member.targetId] }],
        execution: { mode: 'automatic', allowedOperations: [] },
      });
      expect(source.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        sourceTextSha256: member.sha,
        referenceStaticMetadata: { commit: REFERENCE_COMMIT, legacySkillId: member.legacyId, typeLabel: '被动' },
        acceptedContracts: {
          gameStartSkillProvisioning: 'P3-R41/FB2-15',
          nonPlayableMasterRuleArchive: 'P3-R55/FB2-26',
        },
      });
    }
  });

  it('keeps all three owners rules-only while compiling ordinary sources and deferred targets', () => {
    const { loaded, executable } = production();
    expect(loaded.masters).toHaveLength(7);
    for (const member of members) {
      expect(loaded.masters.some((master) => master.id === member.ownerId)).toBe(false);
      expect(loaded.cards.some((card) => card.id === member.sourceId || card.id === member.targetId)).toBe(false);
      expect(executable.cards[member.sourceId]).toMatchObject({
        ownerId: member.ownerId, cardType: 'master_skill', initialZone: 'skill',
      });
      expect(executable.cards[member.targetId]).toMatchObject({
        ownerId: member.ownerId, cardType: 'master_skill', initialPlacement: 'outside_game',
      });
      expect(executable.cards[member.targetId]!.initialZone).toBeUndefined();
      expect(executable.characters[member.ownerId]).toBeUndefined();
      expect(executable.fallbackCommandSpells[member.ownerId]).toBeUndefined();
      expect(executable.decks[member.ownerId]).toBeUndefined();
      expect(executable.cards[member.ownerId + '.command-spell']).toBeUndefined();
    }
  });

  it.each(members)('provisions $sourceId through the unchanged FB2-15 runtime exactly once', (member) => {
    const { executable } = production();
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.cards = [];
    state.players[0]!.masterCardId = member.ownerId;
    rules.initializeAbilityRuntime(state, executable, { seed: 20260919 });
    const sourceInstanceId = member.sourceId + '.instance';
    state.cards.push({
      instanceId: sourceInstanceId,
      definitionId: member.sourceId,
      ownerPlayerId: 'p1',
      controllerPlayerId: 'p1',
      zone: 'skill',
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });

    const event = { id: member.sourceId + '.game-start', type: 'game_start' as const };
    rules.processAbilityEvent(state, event);
    rules.processAbilityEvent(state, event);

    const created = state.cards.filter((card) => card.definitionId === member.targetId);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      ownerPlayerId: 'p1', controllerPlayerId: 'p1', zone: 'skill', generatedBy: sourceInstanceId,
      visibility: { scope: 'owner_only', ownerPlayerId: 'p1' },
    });
    const createdEvents = state.abilityRuntime!.events.filter((entry) =>
      entry.type === 'card_created' && entry.cardInstanceId === created[0]!.instanceId);
    expect(createdEvents).toHaveLength(1);
    expect(createdEvents[0]).toMatchObject({
      type: 'card_created', sourceCardId: sourceInstanceId, abilityId: member.abilityId,
    });
  });
});
