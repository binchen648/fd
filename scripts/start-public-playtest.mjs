import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { markPublicBuild, assertPublicBuild } from './public-playtest-build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--no-build')) throw new Error('Usage: npm run playtest:host -- [--no-build]');
const dist = resolve(root, 'apps/client/dist');
const npmCli = process.env.npm_execpath;
async function runNpm(command) {
  if (!npmCli) throw new Error('Please launch with npm run playtest:host');
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, [npmCli, ...command], { cwd: root, stdio: 'inherit', env: { ...process.env, VITE_FD_PUBLIC_PLAYTEST: '1' } });
    child.once('error', reject); child.once('exit', code => code === 0 ? done() : reject(new Error(`Build failed (${code})`)));
  });
}
if (!args.includes('--no-build')) {
  await runNpm(['run', 'typecheck']);
  await runNpm(['run', 'build', '--workspace', '@fd/client']);
  markPublicBuild(dist);
}
assertPublicBuild(dist);
const child = spawn(process.execPath, ['--import', 'tsx', resolve(root, 'apps/server/src/index.ts')], {
  cwd: root, stdio: ['inherit', 'pipe', 'inherit'], env: { ...process.env, FD_CLIENT_DIST: dist, FD_STATE_FILE: resolve(process.env.FD_STATE_FILE ?? resolve(root, '.fd-server/rooms.json')) },
});
child.stdout.pipe(process.stdout);
let announced = false;
let output = '';
child.stdout.on('data', data => {
  output += data;
  const address = output.match(/FD match server listening on http:\/\/[^\s]+:(\d+)/);
  if (announced || !address) return;
  announced = true;
  console.log('Open the local address above. Sakura Frp: TCP -> 127.0.0.1:' + address[1] + ', then configure automatic HTTPS and a valid certificate/subdomain.');
  console.log('Share the room invitation link shown inside the remote room, never your private launch link. Keep this process and Sakura Frp running.');
});
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 1; });
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { if (!stopping) { stopping = true; child.kill('SIGTERM'); } });
