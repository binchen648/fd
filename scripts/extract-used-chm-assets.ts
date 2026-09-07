import { mkdirSync, readdirSync, readFileSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const workspaceRoot = resolve('.');
const chmRoot = resolve(workspaceRoot, 'chm-extract');
const chmImageRoot = resolve(chmRoot, '图包');
const outputRoot = resolve(workspaceRoot, 'apps/client/public/assets/fd/real/chm-used');
const manifestPath = resolve(workspaceRoot, 'apps/client/src/state/fd-asset-manifest.ts');

const entities = [
  { id: 'master.kayneth', name: '肯尼斯·阿其波卢德', kind: 'masters' },
  { id: 'master.shinji', name: '间桐慎二', kind: 'masters' },
  { id: 'master.kiritsugu', name: '卫宫切嗣', kind: 'masters' },
  { id: 'master.maiya', name: '久宇舞弥', kind: 'masters' },
  { id: 'master.gatou', name: '卧藤门司', kind: 'masters' },
  { id: 'master.irisviel', name: '爱丽丝菲尔·冯·爱因兹贝伦', kind: 'masters' },
  { id: 'master.olga-marie', name: '奥尔加玛丽·阿尼姆斯菲亚', kind: 'masters' },
  { id: 'servant.artoriac', name: '阿尔托莉雅·卡斯特', kind: 'servants' },
  { id: 'servant.drake', name: '弗朗西斯·德雷克', kind: 'servants' },
  { id: 'servant.achilles', name: '阿喀琉斯', kind: 'servants' },
  { id: 'servant.artoria-alt', name: '阿尔托莉雅·潘德拉贡[Alter', kind: 'servants' },
  { id: 'servant.ereshkigal', name: '埃列什基伽勒', kind: 'servants' },
  { id: 'servant.tomoe', name: '巴御前', kind: 'servants' },
  { id: 'servant.kintoki', name: '坂田金时', kind: 'servants' },
] as const;

function slug(id: string): string {
  return id.replaceAll('.', '-').replaceAll('_', '-');
}

function findHtm(name: string): string | undefined {
  const exact = resolve(chmRoot, `${name}.htm`);
  if (existsSync(exact)) return exact;
  return readdirSync(chmRoot)
    .filter((file) => file.endsWith('.htm'))
    .map((file) => resolve(chmRoot, file))
    .find((file) => basename(file, '.htm').includes(name) || name.includes(basename(file, '.htm')));
}

function screenshotNames(htmPath: string): string[] {
  const htm = readFileSync(htmPath, 'utf8');
  return [...new Set([...htm.matchAll(/ScreenShot_[^"'<>\\]+\.png/g)].map((match) => match[0]))];
}

function assetUrl(kind: string, entitySlug: string, index: number): string {
  return `/assets/fd/real/chm-used/${kind}/${entitySlug}/${String(index).padStart(2, '0')}.png`;
}

const entityManifest: Record<string, string> = {};
const cardManifest: Record<string, string> = {};
const sourceManifest: Record<string, { htmPath?: string; copied: string[]; missing: string[] }> = {};

for (const entity of entities) {
  const htmPath = findHtm(entity.name);
  const entitySlug = slug(entity.id);
  const outputDirectory = resolve(outputRoot, entity.kind, entitySlug);
  mkdirSync(outputDirectory, { recursive: true });

  const copied: string[] = [];
  const missing: string[] = [];
  if (htmPath) {
    screenshotNames(htmPath).forEach((name, index) => {
      const source = resolve(chmImageRoot, name);
      if (!existsSync(source)) {
        missing.push(name);
        return;
      }
      const destination = resolve(outputDirectory, `${String(index).padStart(2, '0')}.png`);
      copyFileSync(source, destination);
      copied.push(assetUrl(entity.kind, entitySlug, index));
    });
  }

  if (copied[0]) entityManifest[entity.id] = copied[0];
  sourceManifest[entity.id] = {
    ...(htmPath ? { htmPath: htmPath.replaceAll('\\', '/').replace(`${workspaceRoot.replaceAll('\\', '/')}/`, '') } : {}),
    copied,
    missing,
  };
}

function addCard(id: string, entityId: string, imageIndex: number): void {
  const copied = sourceManifest[entityId]?.copied ?? [];
  if (copied.length === 0) return;
  cardManifest[id] = copied[Math.min(imageIndex, copied.length - 1)]!;
}

for (const entity of entities) addCard(`${entity.id}.overview`, entity.id, 0);

for (const archiveFile of [
  ...readdirSync(resolve(workspaceRoot, 'data/authoring/masters')).map((file) => resolve(workspaceRoot, 'data/authoring/masters', file)),
  ...readdirSync(resolve(workspaceRoot, 'data/authoring/servants')).map((file) => resolve(workspaceRoot, 'data/authoring/servants', file)),
]) {
  const archive = JSON.parse(readFileSync(archiveFile, 'utf8')) as { id: string; cards?: Array<{ id: string }> };
  archive.cards?.forEach((card, index) => addCard(card.id, archive.id, index + 1));
}

const file = `export const fdRealAssetManifest = ${JSON.stringify({
  entities: entityManifest,
  cards: cardManifest,
  sources: sourceManifest,
}, null, 2)} as const;\n`;

writeFileSync(manifestPath, file, 'utf8');
process.stdout.write(`${Object.keys(entityManifest).length} entities, ${Object.keys(cardManifest).length} cards\n`);
