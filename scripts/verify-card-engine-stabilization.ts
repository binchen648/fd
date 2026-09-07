import { spawnSync } from 'node:child_process';

const steps = [
  ['typecheck', 'typecheck'],
  ['content validation', 'content:validate'],
  ['playtest pack verification', 'verify:playtest-v1'],
  ['generated-content determinism', 'verify:generated-content'],
  ['root rules/content tests', 'test'],
  ['complex-skill regressions', 'test:complex-skills'],
  ['client tests', 'test:client'],
  ['real-server Playwright', 'e2e:fd-remote'],
] as const;

const failures: string[] = [];
for (const [label, script] of steps) {
  process.stdout.write(`\n=== ${label} (${script}) ===\n`);
  const result = spawnSync(`npm run ${script}`, { cwd: process.cwd(), stdio: 'inherit', shell: true });
  if (result.error) {
    process.stderr.write(`Unable to start ${script}: ${result.error.message}\n`);
    failures.push(`${label} (${script}): start error`);
  } else if (result.status !== 0) {
    failures.push(`${label} (${script}): exit ${result.status ?? 'unknown'}`);
  }
}

process.stdout.write('\n=== stabilization verification summary ===\n');
if (failures.length) {
  for (const failure of failures) process.stdout.write(`FAILED: ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('PASSED: all stabilization gates\n');
}
