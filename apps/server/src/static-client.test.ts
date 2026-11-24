import { it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createMatchServer } from './match-server';

it('serves built client and existing APIs on one port without exposing private or escaped files', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fd-public-')), root = join(dir, 'dist');
  mkdirSync(join(root, 'assets'), { recursive: true }); mkdirSync(join(dir, 'private'));
  writeFileSync(join(root, 'index.html'), '<html>FD PUBLIC</html>');
  writeFileSync(join(root, 'assets', 'app.js'), 'console.log("FD")');
  writeFileSync(join(dir, 'private', 'secret.json'), 'PRIVATE');
  symlinkSync(join(dir, 'private'), join(root, 'escape'), 'junction');
  writeFileSync(join(root, '.env'), 'SECRET'); writeFileSync(join(root, 'rooms.json.key'), 'KEY');
  const server = createMatchServer({ clientDist: root } as Parameters<typeof createMatchServer>[0]);
  const port = await server.listen(), base = `http://127.0.0.1:${port}`;
  try {
    const page = await fetch(base + '/?join=room'); expect(page.status).toBe(200); expect(await page.text()).toContain('FD PUBLIC');
    expect(page.headers.get('referrer-policy')).toBe('no-referrer');
    const js = await fetch(base + '/assets/app.js'); expect(js.headers.get('content-type')).toContain('javascript');
    const head = await fetch(base + '/assets/app.js', { method: 'HEAD' }); expect(head.status).toBe(200); expect(await head.text()).toBe('');
    for (const path of ['/.env', '/rooms.json.key', '/escape/secret.json', '/assets/..%2f..%2fprivate/secret.json', '/missing.js']) {
      const r = await fetch(base + path); expect(r.status, path).toBe(404); expect(await r.text()).not.toContain('PRIVATE');
    }
    expect((await fetch(base + '/health')).status).toBe(200);
    const room = await fetch(base + '/rooms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roomId: 'public-api', hostClientId: 'host' }) });
    expect(room.status).toBe(201);
  } finally { await server.close(); rmSync(dir, { recursive: true, force: true }); }
});
