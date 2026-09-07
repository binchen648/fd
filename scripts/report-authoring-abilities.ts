import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadAuthoringJson } from '../packages/rules/src/ability/loader';
import { buildAuthoringAdapterReport } from '../packages/rules/src/ability/report';

const input = resolve(process.argv[2] ?? 'data/authoring/servants/servant.artoriac.json');
const output = resolve(process.argv[3] ?? 'artifacts/ability-interpreter/artoriac-adapter-report.json');
const raw = JSON.parse(readFileSync(input, 'utf8')) as { deck?: { cardId: string }[] };
const pack = loadAuthoringJson(raw);
const report = buildAuthoringAdapterReport(pack, raw, input);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, ...report.summary }, null, 2));
if (pack.report.length) process.exitCode = 1;
