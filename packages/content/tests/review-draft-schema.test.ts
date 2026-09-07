import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import { FileSystemPersistence } from '../src/persistence';
import type { ServantReviewDraftIndex } from '../src/review-draft-schema';

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'fd-review-draft-'));
  tempDirs.push(dir);
  return dir;
}

function makeDraftIndex(): ServantReviewDraftIndex {
  return {
    version: 'servant-review-draft-v1',
    lastUpdated: '2026-04-25T00:00:00.000Z',
    pages: {
      '查尔斯·巴贝奇': {
        pageName: '查尔斯·巴贝奇',
        sourceHtm: 'D:/fd/chm-extract/查尔斯·巴贝奇.htm',
        status: 'review_required',
        reason: 'multiple-main-card-candidates',
        draftArtifacts: ['D:/fd/data/staged/review-pending/查尔斯·巴贝奇/page-manifest.json'],
      },
    },
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('review draft schema persistence', () => {
  it('persists and reloads servant review drafts separately from approved library cards', async () => {
    const dir = await makeTempDir();
    const filePath = path.join(dir, 'review-drafts.json');
    const persistence = new FileSystemPersistence();

    await persistence.saveReviewDrafts(makeDraftIndex(), filePath);
    const loaded = await persistence.loadReviewDrafts(filePath);

    expect(loaded).toEqual(makeDraftIndex());
  });
});
