import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

import { loadPlaytestClientFixture } from '../apps/client/src/state/playtest-fixture-loader';
import {
  createFdPlaytestV1FivePlayerState,
  projectPlayerMatchView,
  stepGameLoop,
  type CardInstance,
} from '../packages/rules/src/index';
import type { PlayerMatchView } from '../packages/game-contracts/src/index';
import { compilePlaytestContentPack } from './compile-playtest-content-pack';

export interface VerifyFdPlaytestV1Options {
  workspaceRoot: string;
  outputDirectory: string;
}

export interface VerifyFdPlaytestV1Result {
  summary: {
    masters: number;
    servants: number;
    events: number;
    servantStartingDeckCards: number;
    seats: number;
    blockingIssues: number;
    privateViewLeaks: number;
  };
  ownerView: PlayerMatchView;
  opponentView: PlayerMatchView;
  opponentSerialized: string;
  frontendFixtureSerialized: string;
}

const privateCards: CardInstance[] = [
  ...Array.from({ length: 3 }, (_, index) => ({
    instanceId: `private-owner-hand-${index + 1}`,
    definitionId: `private.owner.attack.${index + 1}`,
    ownerPlayerId: 'player-1',
    controllerPlayerId: 'player-1',
    zone: 'hand',
    visibility: { scope: 'owner_only' as const, ownerPlayerId: 'player-1' },
  })),
  {
    instanceId: 'private-owner-skill-1',
    definitionId: 'private.owner.skill.1',
    ownerPlayerId: 'player-1',
    controllerPlayerId: 'player-1',
    zone: 'skill',
    visibility: { scope: 'owner_only', ownerPlayerId: 'player-1' },
  },
];

export function verifyFdPlaytestV1(options: VerifyFdPlaytestV1Options): VerifyFdPlaytestV1Result {
  const compilation = compilePlaytestContentPack({
    packPath: resolve(options.workspaceRoot, 'data/packs/fd-playtest-v1/pack.json'),
    outputDirectory: options.outputDirectory,
    workspaceRoot: options.workspaceRoot,
  });
  const baseState = createFdPlaytestV1FivePlayerState();
  const advancedState = stepGameLoop({
    ...baseState,
    round: { ...baseState.round, activePhase: 'advance' },
    cards: privateCards,
  }).nextState;

  if (advancedState.round.activePhase !== 'action') {
    throw new Error(`Expected action phase, received ${advancedState.round.activePhase}`);
  }

  const ownerView = projectPlayerMatchView(
    advancedState,
    { kind: 'player', playerId: 'player-1' },
    { revision: 1 },
  );
  const opponentView = projectPlayerMatchView(
    advancedState,
    { kind: 'player', playerId: 'player-2' },
    { revision: 1 },
  );
  const opponentSerialized = JSON.stringify(opponentView);
  const privateDefinitionIds = privateCards.map((card) => card.definitionId);
  const privateViewLeaks = privateDefinitionIds.filter((id) => opponentSerialized.includes(id)).length;
  const frontendFixtureSerialized = JSON.stringify(loadPlaytestClientFixture());
  const loadedLibrary = JSON.parse(readFileSync(compilation.outputPaths.library, 'utf8')) as {
    servants: Array<{ startingDeck: { entries: Array<{ copies: number }> } }>;
  };
  const loadedFixture = JSON.parse(readFileSync(compilation.outputPaths.fixture, 'utf8')) as {
    seats: Array<unknown>;
  };
  const servantStartingDeckCards = loadedLibrary.servants.reduce(
    (total, servant) => total + servant.startingDeck.entries.reduce(
      (servantTotal, entry) => servantTotal + entry.copies,
      0,
    ),
    0,
  );

  if (privateViewLeaks > 0) {
    throw new Error(`Opponent projection leaked ${privateViewLeaks} private card definition(s)`);
  }

  return {
    summary: {
      ...compilation.summary,
      servantStartingDeckCards,
      seats: loadedFixture.seats.length,
      privateViewLeaks,
    },
    ownerView,
    opponentView,
    opponentSerialized,
    frontendFixtureSerialized,
  };
}

function runCli(): void {
  const workspaceRoot = resolve('.');
  const result = verifyFdPlaytestV1({
    workspaceRoot,
    outputDirectory: resolve(workspaceRoot, 'data/generated'),
  });
  const { summary } = result;
  process.stdout.write(
    `${summary.masters} masters, ${summary.servants} servants, ${summary.events} events, ` +
      `${summary.servantStartingDeckCards} starting-deck cards, ${summary.privateViewLeaks} private-view leaks\n`,
  );
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  runCli();
}
