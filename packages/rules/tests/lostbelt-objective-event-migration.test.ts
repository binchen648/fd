import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { compileLoadedPlaytestPack, loadPlaytestContentPack } from '../../content/src/index';
import { describe, expect, it } from 'vitest';

import * as rules from '../src/index';
import { compileExecutableCardPack } from '../src/ability/executable-card-pack';
import { createSeededGameState } from '../src/tools/seeded-state';

const F1_COMMIT = '59f145434695d29bdd17e4cb3adc887e84182377';
const REFERENCE_COMMIT = 'b2f9fa15fba07c63530bbf4612b03b8b704755f9';
const workspaceRoot = resolve('.');
const productionPackPath = resolve('data/packs/fd-playtest-v1/pack.json');
const archivePath = 'data/authoring/rules/lostbelt-objective-kadoc-ophelia.json';

const expected = [
  {
    id: 'master.kadoc.skill.s3', name: '冻土',
    text: '【俄罗斯事件牌】战果1，数量5。\n部署于此战场的玩家立即失去2点魔力。进入此战场的玩家失去2点魔力。',
    sha: '7f4096a58df09a1825d0c53beb69855d7ab8a1ebb6107ea5829cb63f5d7259c8',
    clauses: ['79b43e85325b94864cb8006cc67f7635a9bb4313ef3d3d8ac740fd6ba897c3a5', 'd8cd9a53abcbde4a35dd65a15be52b21f172a8dbb1d85aa9c206c75a9bf56fde'],
  },
  {
    id: 'master.ophelia.skill.s5', name: '苏尔特领域',
    text: '【北欧事件牌】战果4，数量2。\n力量属性于此战场威力+4。迅捷属性于此战场威力-2。',
    sha: '72132a0e0a1700a58297838ad872a5c4eeb6f62f21855d0432cc427be5fa2343',
    clauses: ['0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2', 'e7f59257ade03c3ed3f68c1496641747d3f09d8bb61adb9328332ec9f3d2e8d2'],
  },
  {
    id: 'master.ophelia.skill.s6', name: '女武神领域',
    text: '【北欧事件牌】战果4，数量2。\n迅捷属性于此战场威力+4。魔术属性于此战场威力-2。',
    sha: '321b2706f9b0fd3761bb1086ff16699d199901738418e0292cccfefdba8dbbb2',
    clauses: ['0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2', '4bf3d381fcba33b51a514e391d8181866821932309cb582e8de3b85f6aaf30d6'],
  },
  {
    id: 'master.ophelia.skill.s7', name: '斯卡蒂领域',
    text: '【北欧事件牌】战果4，数量2。\n魔术属性于此战场威力+4。力量属性于此战场威力-2。',
    sha: 'f1356fe8da0d2d55f4d97b21781f488e96b91eb42f97203c9985e6838e56ea4b',
    clauses: ['0f2245e361a2aa3a68160131f937db89ee46d70af9d4e4bbe44e80e38ec651f2', '5d7d47df8b72504df2b48c6e9de637165ab2272cf9f983957f3101a756759678'],
  },
] as const;

function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function rawArchive(): any {
  return JSON.parse(readFileSync(resolve(archivePath), 'utf8'));
}

function migratedPack() {
  const tmp = mkdtempSync(join(tmpdir(), 'fd-lostbelt-objective-'));
  try {
    const manifest = JSON.parse(readFileSync(productionPackPath, 'utf8')) as any;
    manifest.authoringEventRuleFiles = [...(manifest.authoringEventRuleFiles ?? []), archivePath];
    const tempManifest = join(tmp, 'pack.json');
    writeFileSync(tempManifest, JSON.stringify(manifest, null, 2));
    const loaded = loadPlaytestContentPack(tempManifest, { workspaceRoot });
    const compiled = compileLoadedPlaytestPack(loaded).library;
    const executable = compileExecutableCardPack(compiled);
    return { loaded, compiled, executable };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

describe('P3 R63 Lostbelt objective event migration', () => {
  it('materializes exactly the four F1-grounded rules-only event definitions with frozen evidence', () => {
    const archive = rawArchive();
    expect(archive).toMatchObject({
      schemaVersion: 'fd-card-authoring-v1', archiveType: 'event_rule_definition_archive',
      id: 'event-rule.lostbelt-objectives.kadoc-ophelia',
      sourcePolicy: { phase3EvidenceCommit: F1_COMMIT, referenceMetadataCommit: REFERENCE_COMMIT },
    });
    expect(archive.cards.map((card: any) => card.id)).toEqual(expected.map((member) => member.id));
    expect(new Set(archive.cards.map((card: any) => card.id)).size).toBe(4);

    for (const member of expected) {
      const card = archive.cards.find((candidate: any) => candidate.id === member.id);
      expect(card).toMatchObject({ id: member.id, name: member.name, cardType: 'event', printedText: member.text });
      expect(sha(card.printedText)).toBe(member.sha);
      expect(card.phase3Evidence).toMatchObject({
        f1Commit: F1_COMMIT,
        sourceTextSha256: member.sha,
        referenceStaticMetadata: { commit: REFERENCE_COMMIT },
        acceptedContracts: { eventRuleBridge: 'P3-R61/FB2-28', eventStaticBattleMetadata: 'P3-R63/FB2-29' },
      });
      expect(card.phase3Evidence.f1ClauseSources.map((entry: any) => entry.sha256)).toEqual(member.clauses);
    }
  });

  it('passes the real content/compiler path without widening product surfaces and compiles exact static event metadata', () => {
    const { loaded, executable } = migratedPack();
    expect(loaded.authoringArchives.some((archive: any) => archive.id === 'event-rule.lostbelt-objectives.kadoc-ophelia')).toBe(true);

    for (const member of expected) {
      expect(executable.cards[member.id]).toBeUndefined();
      expect(executable.eventRules[member.id]).toBeDefined();
      expect(executable.characters[member.id]).toBeUndefined();
      expect(executable.decks[member.id]).toBeUndefined();
      expect(executable.fallbackCommandSpells[member.id]).toBeUndefined();
      expect(Object.values(executable.eventSets ?? {}).some((set: any) => set.cardIds?.includes(member.id))).toBe(false);
    }

    expect(executable.eventCatalog?.['master.kadoc.skill.s3']).toMatchObject({
      id: 'master.kadoc.skill.s3', printedReward: 1,
      tags: ['lostbelt-effect:frozen-wastes', 'lostbelt-group:russia', 'lostbelt-objective'],
    });
    expect(executable.eventCatalog?.['master.kadoc.skill.s3']?.battleModifiers).toBeUndefined();

    expect(executable.eventCatalog?.['master.ophelia.skill.s5']).toMatchObject({ printedReward: 4 });
    expect(executable.eventCatalog?.['master.ophelia.skill.s5']?.battleModifiers).toEqual([
      { sourceId: 'master.ophelia.skill.s5', targetTag: '力量', value: 4, condition: 'has_attribute' },
      { sourceId: 'master.ophelia.skill.s5', targetTag: '敏捷', value: -2, condition: 'has_attribute' },
    ]);
    expect(executable.eventCatalog?.['master.ophelia.skill.s6']?.battleModifiers).toEqual([
      { sourceId: 'master.ophelia.skill.s6', targetTag: '敏捷', value: 4, condition: 'has_attribute' },
      { sourceId: 'master.ophelia.skill.s6', targetTag: '魔术', value: -2, condition: 'has_attribute' },
    ]);
    expect(executable.eventCatalog?.['master.ophelia.skill.s7']?.battleModifiers).toEqual([
      { sourceId: 'master.ophelia.skill.s7', targetTag: '魔术', value: 4, condition: 'has_attribute' },
      { sourceId: 'master.ophelia.skill.s7', targetTag: '力量', value: -2, condition: 'has_attribute' },
    ]);
  });

  it('executes Kadoc deploy/enter mana taxes only at the source event battlefield and remains replay-idempotent', () => {
    const { executable } = migratedPack();
    const state = createSeededGameState({ activeSeats: [1, 2] });
    state.players[0]!.locationId = 'shinto';
    state.players[1]!.locationId = 'miyama_town';
    state.eventOutsideGame = ['master.kadoc.skill.s3'];
    rules.initializeAbilityRuntime(state, executable, { seed: 20260919 });

    const [outside] = rules.listEventRuleCandidates(state, executable, ['event_outside_game']);
    expect(outside?.eventCardId).toBe('master.kadoc.skill.s3');
    rules.moveEventRuleCandidate(state, executable, outside!.token, 'event_battlefield', { locationId: 'miyama_town', visibility: 'public' });

    const before = state.players[1]!.mana;
    rules.processAbilityEvent(state, {
      id: 'kadoc-deploy-1', type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: 'miyama_town',
    });
    expect(state.players[1]!.mana).toBe(before - 2);
    const revisionAfterDeploy = state.abilityRuntime!.revision;
    rules.processAbilityEvent(state, {
      id: 'kadoc-deploy-1', type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: 'miyama_town',
    });
    expect(state.players[1]!.mana).toBe(before - 2);
    expect(state.abilityRuntime!.revision).toBe(revisionAfterDeploy);

    rules.processAbilityEvent(state, {
      id: 'kadoc-deploy-wrong', type: 'after_player_deployed_to_battlefield', playerId: 'p2', locationId: 'shinto',
    });
    expect(state.players[1]!.mana).toBe(before - 2);

    rules.processAbilityEvent(state, {
      id: 'kadoc-enter-1', type: 'after_controller_enters_location', playerId: 'p2', locationId: 'miyama_town',
    });
    expect(state.players[1]!.mana).toBe(before - 4);

    rules.processAbilityEvent(state, {
      id: 'kadoc-enter-wrong', type: 'after_controller_enters_location', playerId: 'p2', locationId: 'shinto',
    });
    expect(state.players[1]!.mana).toBe(before - 4);
  });
});
