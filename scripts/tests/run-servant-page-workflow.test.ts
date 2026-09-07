import { access, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { VisionResponse } from '../../packages/contracts/src';
import { runServantPageWorkflowScript } from '../run-servant-page-workflow';

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function makeVisionResponse(rawText: string, cardName: string, classTag?: string): VisionResponse {
  return {
    jobId: 'vision-test',
    artifactVersion: 'vision-response-v1',
    status: 'ok',
    classification: {
      cardTypeGuess: classTag ? 'Servant' : 'servant_skill',
      subtypeGuess: classTag ?? null,
      familyConfidence: 0.99,
    },
    text: {
      cardName,
      rawText,
      normalizedText: rawText.replace(/\n/g, ' '),
    },
    fields: {
      code: null,
      costMarker: null,
      powerMarker: null,
      numericSlots: [],
      iconTags: [],
      rarity: null,
      classTag: classTag ?? null,
    },
    blocks: [],
    uncertainSpans: [],
    overallConfidence: 0.95,
    source: { provider: 'test', model: 'test-model' },
  };
}

describe('runServantPageWorkflowScript', () => {
  it('processes a known HTM page and emits confirmed servant artifacts', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'fd-script-servant-'));
    const htmPath = path.join(root, 'chm-extract', '查尔斯·巴贝奇.htm');
    const imageDir = path.join(root, 'chm-extract', '图包');

    await mkdir(imageDir, { recursive: true });
    await writeFile(path.join(imageDir, 'ScreenShot_001.png'), 'main', 'utf8');
    await writeFile(path.join(imageDir, 'ScreenShot_002.png'), 'skill', 'utf8');
    await writeFile(htmPath, '<img src="图包/ScreenShot_001.png"><img src="图包/ScreenShot_002.png">', 'utf8');

    const result = await runServantPageWorkflowScript({
      projectRoot: root,
      htmPath,
      artifactsByImage: {
        'ScreenShot_001.png': {
          visionArtifact: makeVisionResponse('查尔斯·巴贝奇\n2,3,3,5\n2,2,4,4\n2,3,3,5', '查尔斯·巴贝奇', 'Caster'),
        },
        'ScreenShot_002.png': {
          visionArtifact: makeVisionResponse('魔力放出\n行动阶段：你的攻击威力+2。', '魔力放出'),
        },
      },
    });

    expect(result.status).toBe('confirmed');
    expect(await exists(path.join(root, 'data', 'staged', 'servants', '查尔斯·巴贝奇', '查尔斯·巴贝奇.main-card.json'))).toBe(true);
  });
});
