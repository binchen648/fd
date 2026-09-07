import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { CONTENT_LIBRARY_INDEX_VERSION } from '../library-index-schema';
import { FileSystemPersistence, LibraryBackupManager } from '../persistence';
import type { ContentLibraryIndex } from '../index';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'fd-content-'));
  tempDirs.push(dir);
  return dir;
}

function makeIndex(): ContentLibraryIndex {
  return {
    version: CONTENT_LIBRARY_INDEX_VERSION,
    lastUpdated: '2026-04-14T00:00:00.000Z',
    stats: {
      totalCards: 1,
      bySourceSet: { master: 1 },
      byNamespace: { master: 1 },
    },
    cards: {
      'master-001': {
        id: 'master-001',
        name: 'Master',
        language: 'zh-CN',
        sourceSet: 'master',
        namespace: 'master',
        approvedAt: '2026-04-14T00:00:00.000Z',
        guardrailJobId: 'job-001',
        tags: ['master'],
        cardType: 'master_identity',
        initialMana: 4,
        commandSpells: 3,
      },
    },
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('FileSystemPersistence', () => {
  it('saves and loads a valid library index', async () => {
    const persistence = new FileSystemPersistence();
    const dir = await makeTempDir();
    const filePath = path.join(dir, 'library-index.json');

    await persistence.save(makeIndex(), filePath);
    const loaded = await persistence.load(filePath);

    expect(loaded).toEqual(makeIndex());
  });

  it('rejects invalid persisted structures during load', async () => {
    const persistence = new FileSystemPersistence();
    const dir = await makeTempDir();
    const filePath = path.join(dir, 'invalid-index.json');

    await writeFile(filePath, JSON.stringify({ ...makeIndex(), version: '0.9.0' }), 'utf8');

    await expect(persistence.load(filePath)).rejects.toThrow('Invalid content library index structure');
  });

  it('checks existence and deletes stored files', async () => {
    const persistence = new FileSystemPersistence();
    const dir = await makeTempDir();
    const filePath = path.join(dir, 'library-index.json');

    expect(await persistence.exists(filePath)).toBe(false);
    await persistence.save(makeIndex(), filePath);
    expect(await persistence.exists(filePath)).toBe(true);
    await persistence.delete(filePath);
    expect(await persistence.exists(filePath)).toBe(false);
  });
});

describe('LibraryBackupManager', () => {
  it('creates, lists, restores, and trims backups', async () => {
    const dir = await makeTempDir();
    const manager = new LibraryBackupManager(dir);

    const first = await manager.createBackup(makeIndex());
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = await manager.createBackup(makeIndex());

    const backups = await manager.listBackups();
    expect(backups).toHaveLength(2);
    const [latestBackup, previousBackup] = backups;
    if (!latestBackup || !previousBackup) {
      throw new Error('Expected two backups');
    }
    expect(path.basename(second)).toBe(latestBackup);
    expect(path.basename(first)).toBe(previousBackup);

    const restored = await manager.restoreFromBackup(latestBackup);
    expect(restored.cards['master-001']?.name).toBe('Master');

    await manager.cleanOldBackups(1);
    expect(await manager.listBackups()).toHaveLength(1);
  });
});
