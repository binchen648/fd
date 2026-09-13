import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  compileLoadedPlaytestPack,
  loadPlaytestContentPack,
  type SourceAssetValidation,
  validateLoadedPlaytestPack,
} from '../packages/content/src/playtest-pack-loader';
import { compileExecutableCardPack } from '../packages/rules/src/ability/executable-card-pack';

export interface CompilePlaytestContentPackOptions {
  packPath: string;
  outputDirectory: string;
  workspaceRoot: string;
  validateOnly?: boolean;
  sourceAssetValidation?: SourceAssetValidation;
  sourceAssetRoot?: string;
}

export interface CompilePlaytestContentPackResult {
  summary: {
    masters: number;
    servants: number;
    events: number;
    blockingIssues: number;
  };
  outputPaths: {
    library: string;
    fixture: string;
    evidence: string;
  };
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function compilePlaytestContentPack(
  options: CompilePlaytestContentPackOptions,
): CompilePlaytestContentPackResult {
  const loaded = loadPlaytestContentPack(options.packPath, {
    workspaceRoot: options.workspaceRoot,
  });
  const issues = validateLoadedPlaytestPack(loaded, {
    workspaceRoot: options.workspaceRoot,
    sourceAssetValidation: options.sourceAssetValidation,
    sourceAssetRoot: options.sourceAssetRoot,
  });
  const compiled = compileLoadedPlaytestPack(loaded, issues);
  compiled.library.rules = compileExecutableCardPack(compiled.library);
  const blockingIssues = issues.filter((issue) => issue.blocking);
  const outputPaths = {
    library: resolve(options.outputDirectory, `${loaded.id}.content-library.json`),
    fixture: resolve(options.outputDirectory, `${loaded.id}.fixture.json`),
    evidence: resolve(options.outputDirectory, `${loaded.id}.evidence-report.json`),
  };

  if (blockingIssues.length > 0) {
    const details = blockingIssues
      .map((issue) => `${issue.code}: ${issue.message}`)
      .join('\n');
    throw new Error(`Playtest pack has ${blockingIssues.length} blocking issue(s):\n${details}`);
  }

  if (!options.validateOnly) {
    mkdirSync(options.outputDirectory, { recursive: true });
    writeFileSync(outputPaths.library, serialize(compiled.library), 'utf8');
    writeFileSync(outputPaths.fixture, serialize(compiled.fixture), 'utf8');
    writeFileSync(outputPaths.evidence, serialize(compiled.evidenceReport), 'utf8');
  }

  return {
    summary: compiled.evidenceReport.summary,
    outputPaths,
  };
}

interface CliArguments {
  packPath: string;
  outputDirectory: string;
  validateOnly: boolean;
  sourceAssetValidation: SourceAssetValidation;
}

function parseArguments(argv: string[]): CliArguments {
  const packIndex = argv.indexOf('--pack');
  if (packIndex < 0 || !argv[packIndex + 1]) {
    throw new Error('Usage: --pack <workspace-relative-pack.json> [--output <directory>] [--validate-only]');
  }

  const outputIndex = argv.indexOf('--output');
  return {
    packPath: argv[packIndex + 1]!,
    outputDirectory: outputIndex >= 0 && argv[outputIndex + 1]
      ? argv[outputIndex + 1]!
      : 'data/generated',
    validateOnly: argv.includes('--validate-only'),
    sourceAssetValidation: argv.includes('--source-assets')
      ? argv[argv.indexOf('--source-assets') + 1] as SourceAssetValidation
      : 'metadata_only',
  };
}

function runCli(): void {
  const workspaceRoot = resolve('.');
  const args = parseArguments(process.argv.slice(2));
  const result = compilePlaytestContentPack({
    packPath: resolve(workspaceRoot, args.packPath),
    outputDirectory: resolve(workspaceRoot, args.outputDirectory),
    workspaceRoot,
    validateOnly: args.validateOnly,
    sourceAssetValidation: args.sourceAssetValidation,
    sourceAssetRoot: process.env.FD_SOURCE_ASSET_ROOT
      ? resolve(process.env.FD_SOURCE_ASSET_ROOT)
      : workspaceRoot,
  });

  process.stdout.write(
    `${result.summary.masters} masters, ${result.summary.servants} servants, ${result.summary.events} events, ${result.summary.blockingIssues} blocking issues\n`,
  );
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  runCli();
}
