/**
 * Content library persistence helpers.
 */

import { access, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertContentLibraryIndex,
  cloneContentLibraryIndex,
  CONTENT_LIBRARY_INDEX_VERSION,
} from './library-index-schema';
import type { ContentLibraryIndex } from './library-index-schema';
import {
  assertServantReviewDraftIndex,
  cloneServantReviewDraftIndex,
} from './review-draft-schema';
import type { ServantReviewDraftIndex } from './review-draft-schema';

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface PersistenceAdapter {
  save(index: ContentLibraryIndex, filePath: string): Promise<void>;
  load(filePath: string): Promise<ContentLibraryIndex>;
  saveReviewDrafts(index: ServantReviewDraftIndex, filePath: string): Promise<void>;
  loadReviewDrafts(filePath: string): Promise<ServantReviewDraftIndex>;
  exists(filePath: string): Promise<boolean>;
  delete(filePath: string): Promise<void>;
}

export class FileSystemPersistence implements PersistenceAdapter {
  async save(index: ContentLibraryIndex, filePath: string): Promise<void> {
    assertContentLibraryIndex(index, 'content library index');
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(index, null, 2)}
`, 'utf8');
  }

  async load(filePath: string): Promise<ContentLibraryIndex> {
    const raw = await readFile(filePath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    assertContentLibraryIndex(parsed, 'content library index');
    return cloneContentLibraryIndex(parsed);
  }

  async saveReviewDrafts(index: ServantReviewDraftIndex, filePath: string): Promise<void> {
    assertServantReviewDraftIndex(index, 'servant review draft index');
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(index, null, 2)}
`, 'utf8');
  }

  async loadReviewDrafts(filePath: string): Promise<ServantReviewDraftIndex> {
    const raw = await readFile(filePath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    assertServantReviewDraftIndex(parsed, 'servant review draft index');
    return cloneServantReviewDraftIndex(parsed);
  }

  async exists(filePath: string): Promise<boolean> {
    return pathExists(filePath);
  }

  async delete(filePath: string): Promise<void> {
    if (await pathExists(filePath)) {
      await unlink(filePath);
    }
  }
}

export class LibraryBackupManager {
  constructor(private readonly backupDir = 'packages/content/backups') {}

  async createBackup(index: ContentLibraryIndex): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `library-backup-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupFileName);

    const persistence = new FileSystemPersistence();
    await persistence.save(index, backupPath);
    return backupPath;
  }

  async listBackups(): Promise<string[]> {
    if (!(await pathExists(this.backupDir))) {
      return [];
    }

    const files = await readdir(this.backupDir);
    return files
      .filter((file) => file.startsWith('library-backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
  }

  async restoreFromBackup(backupFileName: string): Promise<ContentLibraryIndex> {
    const backupPath = path.join(this.backupDir, backupFileName);
    const persistence = new FileSystemPersistence();
    return persistence.load(backupPath);
  }

  async cleanOldBackups(keepCount = 10): Promise<void> {
    const backups = await this.listBackups();
    if (backups.length <= keepCount) {
      return;
    }

    await Promise.all(backups.slice(keepCount).map((backup) => unlink(path.join(this.backupDir, backup))));
  }
}

export const persistence = {
  async save(index: ContentLibraryIndex, filePath: string): Promise<void> {
    const adapter = new FileSystemPersistence();
    return adapter.save(index, filePath);
  },

  async load(filePath: string): Promise<ContentLibraryIndex> {
    const adapter = new FileSystemPersistence();
    return adapter.load(filePath);
  },

  async saveReviewDrafts(index: ServantReviewDraftIndex, filePath: string): Promise<void> {
    const adapter = new FileSystemPersistence();
    return adapter.saveReviewDrafts(index, filePath);
  },

  async loadReviewDrafts(filePath: string): Promise<ServantReviewDraftIndex> {
    const adapter = new FileSystemPersistence();
    return adapter.loadReviewDrafts(filePath);
  },

  async backup(index: ContentLibraryIndex): Promise<string> {
    const normalizedIndex: ContentLibraryIndex = {
      ...cloneContentLibraryIndex(index),
      version: CONTENT_LIBRARY_INDEX_VERSION,
    };
    const backupManager = new LibraryBackupManager();
    return backupManager.createBackup(normalizedIndex);
  },

  async listBackups(): Promise<string[]> {
    const backupManager = new LibraryBackupManager();
    return backupManager.listBackups();
  },

  async restoreBackup(backupFileName: string): Promise<ContentLibraryIndex> {
    const backupManager = new LibraryBackupManager();
    return backupManager.restoreFromBackup(backupFileName);
  },
};
