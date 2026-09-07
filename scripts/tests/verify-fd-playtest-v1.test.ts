import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { verifyFdPlaytestV1 } from '../verify-fd-playtest-v1';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('FD playtest v1 end-to-end verifier', () => {
  it('compiles, creates seven normal seats, advances, projects and serializes without leaking private cards', () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), 'fd-playtest-verify-'));
    temporaryDirectories.push(outputDirectory);

    const result = verifyFdPlaytestV1({
      workspaceRoot: resolve('.'),
      outputDirectory,
    });

    expect(result.summary).toEqual({
      masters: 7,
      servants: 7,
      events: 20,
      servantStartingDeckCards: 84,
      seats: 7,
      blockingIssues: 0,
      privateViewLeaks: 0,
    });
    expect(result.ownerView.self?.hand.every((card) => card.definitionId)).toBe(true);
    expect(result.opponentView.players.find((player) => player.id === 'player-1')?.hand).toEqual({ count: 3 });
    expect(result.opponentSerialized).not.toContain('private.owner.attack');
    expect(result.frontendFixtureSerialized).not.toContain('servant.bb');
    expect(result.frontendFixtureSerialized).not.toContain('servant.babbage');
    expect(result.frontendFixtureSerialized).not.toContain('月之圣杯');
    expect(() => JSON.parse(result.frontendFixtureSerialized)).not.toThrow();
  });
});
